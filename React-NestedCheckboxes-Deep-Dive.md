# React Nested Checkboxes Interview Deep Dive

> Hướng dẫn xây dựng Hierarchical Checkbox Component với Parent-Child State Management
> Giải thích theo cách Senior Engineer trình bày trong buổi phỏng vấn Big Tech

---

## PHẦN A: HƯỚNG DẪN IMPLEMENTATION CHI TIẾT

> 💡 **Mindset**: Đây là bài toán về **recursive data structures** và **bidirectional state propagation**. Interviewer muốn thấy bạn handle tree traversal và state consistency.

### Tổng Quan Bài Toán

**Yêu cầu:**

- Hiển thị hierarchical checkboxes (tree structure)
- Parent checkbox phản ánh trạng thái của children
- 3 states: checked, unchecked, indeterminate
- Click parent → update tất cả descendants
- Click child → update tất cả ancestors

**💬 Cách mở đầu với interviewer:**

> "Đây là bài toán về bidirectional state propagation trong tree structure. Khi user click checkbox, state changes cần propagate theo 2 hướng: xuống descendants và lên ancestors. Tôi sẽ dùng recursive approach cho cả rendering và state updates."

**🤔 Câu hỏi interviewer có thể hỏi ngay từ đầu:**

| Câu hỏi                       | Cách trả lời                                                                            |
| ----------------------------- | --------------------------------------------------------------------------------------- |
| "Tree depth có limit không?"  | "Không, component phải handle arbitrary depth. Recursive rendering."                    |
| "Performance với large tree?" | "Với 1000+ nodes, cần virtualization. MVP có thể render all."                           |
| "Indeterminate state là gì?"  | "Partial selection - một số children checked, một số không. Browser có native support." |
| "State management ở đâu?"     | "Lift state lên root component. Single source of truth cho toàn bộ tree."               |
| "Có cần persist state không?" | "Clarify: nếu cần, có thể sync với localStorage hoặc backend."                          |

**🏗️ Kiến trúc tổng quan:**

```
┌─────────────────────────────────────────────────────────────────┐
│  COMPONENT ARCHITECTURE                                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Checkboxes.tsx (Root - State Owner)                            │
│  ├── State: checkboxData[] (entire tree)                        │
│  ├── Handlers: onCheck(checked, indices)                        │
│  └── Uses: <CheckboxList items={} onCheck={} />                 │
│                                                                 │
│  CheckboxList.tsx (Recursive Renderer)                          │
│  ├── Renders: <ul> with <li> for each item                      │
│  ├── Uses: <CheckboxInput /> for each checkbox                  │
│  └── Recursively renders children if present                    │
│                                                                 │
│  CheckboxInput.tsx (Leaf Component)                             │
│  ├── Handles: indeterminate state via useRef                    │
│  └── Renders: <input type="checkbox" /> + <label>               │
│                                                                 │
│  State Update Functions (Pure Functions)                        │
│  ├── updateCheckboxAndDescendants() → propagate DOWN            │
│  └── resolveCheckboxStates() → propagate UP                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**📊 State Propagation Diagram:**

```
┌─────────────────────────────────────────────────────────────────┐
│  BIDIRECTIONAL STATE PROPAGATION                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│              Electronics (indeterminate)                        │
│              /          \                                       │
│    Mobile phones ✓      Laptops (indeterminate)                │
│    /        \           /         \                             │
│  iPhone ✓  Android ✓  MacBook ✓   Surface ☐                    │
│                                                                 │
│  CLICK "Surface" → PROPAGATE UP:                                │
│  1. Surface: ☐ → ✓                                              │
│  2. Laptops: indeterminate → ✓ (all children now checked)      │
│  3. Electronics: indeterminate → ✓ (all children now checked)  │
│                                                                 │
│  CLICK "Electronics" to UNCHECK → PROPAGATE DOWN:               │
│  1. Electronics: ✓ → ☐                                          │
│  2. Mobile phones: ✓ → ☐                                        │
│  3. Laptops: ✓ → ☐                                              │
│  4. All leaf nodes: → ☐                                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**📚 Core Concepts cần nắm vững:**

| Concept                 | Áp dụng trong bài                                    |
| ----------------------- | ---------------------------------------------------- |
| **Recursive Rendering** | CheckboxList render chính nó cho children            |
| **Tree Traversal**      | DFS để update descendants, bottom-up cho ancestors   |
| **Indeterminate State** | Chỉ set được qua JavaScript, không có HTML attribute |
| **State Lifting**       | All state ở root, không phải từng checkbox           |
| **Immutable Updates**   | Deep clone before mutation                           |
| **Index Path**          | Dùng [0, 1, 2] để locate checkbox trong tree         |

**🔑 Comparison với các bài tương tự:**

| Bài toán             | Điểm giống                      | Điểm khác                         |
| -------------------- | ------------------------------- | --------------------------------- |
| **File Explorer**    | Recursive tree, expand/collapse | Không cần parent-child state sync |
| **DataTable Filter** | State management, re-render     | Không có recursion, flat data     |
| **Todo List**        | CRUD operations                 | Single level, không nested        |
| **Menu/Dropdown**    | Nested structure                | Không có indeterminate concept    |

**� Project Structure - Best Practices:**

```
src/
├── components/
│   └── Checkboxes/
│       ├── index.ts              # Barrel export
│       ├── Checkboxes.tsx        # Root component (state owner)
│       ├── CheckboxList.tsx      # Recursive renderer
│       ├── CheckboxInput.tsx     # Individual checkbox + indeterminate
│       ├── types.ts              # CheckboxItem, CheckboxValue
│       ├── utils/
│       │   ├── stateUtils.ts     # updateDescendants, resolveStates
│       │   └── treeUtils.ts      # getNodeByPath, flattenTree
│       ├── hooks/
│       │   ├── useCheckboxTree.ts    # Custom hook cho state logic
│       │   └── useIndeterminate.ts   # useRef + useEffect combo
│       ├── __tests__/
│       │   ├── Checkboxes.test.tsx
│       │   └── stateUtils.test.ts
│       └── Checkboxes.module.css # Styles
└── ...
```

**🤔 Q&A về File Organization:**

| Câu hỏi                             | Cách trả lời                                                                           |
| ----------------------------------- | -------------------------------------------------------------------------------------- |
| "Tại sao tách thành nhiều files?"   | "Separation of concerns. Mỗi file có single responsibility. Easy to test và maintain." |
| "Barrel exports (index.ts)?"        | "Clean imports: `import { Checkboxes } from './Checkboxes'` thay vì deep path."        |
| "Co-location vs feature folders?"   | "Feature folders (như trên) tốt hơn khi feature có nhiều files related."               |
| "CSS Modules vs styled-components?" | "CSS Modules cho interview (no deps). Styled-components cho dynamic styling."          |
| "Tests ở đâu?"                      | "**tests** folder co-located. Hoặc file.test.tsx cùng cấp. Cả hai acceptable."         |

**🔗 Custom Hooks - Tách Logic:**

```tsx
// hooks/useCheckboxTree.ts
import { useState, useCallback } from "react";
import { CheckboxItem } from "../types";
import {
  updateCheckboxAndDescendants,
  resolveCheckboxStates,
} from "../utils/stateUtils";

interface UseCheckboxTreeOptions {
  initialData: CheckboxItem[];
  onChange?: (data: CheckboxItem[]) => void;
}

export function useCheckboxTree({
  initialData,
  onChange,
}: UseCheckboxTreeOptions) {
  const [data, setData] = useState<CheckboxItem[]>(initialData);

  const handleCheck = useCallback(
    (checked: boolean, indices: number[]) => {
      setData((prev) => {
        const newData = structuredClone(prev);

        // Navigate to node
        let node = newData[indices[0]];
        for (let i = 1; i < indices.length; i++) {
          node = node.children![indices[i]];
        }

        // Update
        updateCheckboxAndDescendants(node, checked);
        resolveCheckboxStates(newData[indices[0]], indices.slice(1));

        // Notify parent
        onChange?.(newData);

        return newData;
      });
    },
    [onChange],
  );

  const checkAll = useCallback(() => {
    setData((prev) => {
      const newData = structuredClone(prev);
      newData.forEach((item) => updateCheckboxAndDescendants(item, true));
      onChange?.(newData);
      return newData;
    });
  }, [onChange]);

  const uncheckAll = useCallback(() => {
    setData((prev) => {
      const newData = structuredClone(prev);
      newData.forEach((item) => updateCheckboxAndDescendants(item, false));
      onChange?.(newData);
      return newData;
    });
  }, [onChange]);

  const getCheckedItems = useCallback((): CheckboxItem[] => {
    const result: CheckboxItem[] = [];

    function collect(items: CheckboxItem[]) {
      items.forEach((item) => {
        if (item.checked === true) result.push(item);
        if (item.children) collect(item.children);
      });
    }

    collect(data);
    return result;
  }, [data]);

  return {
    data,
    handleCheck,
    checkAll,
    uncheckAll,
    getCheckedItems,
  };
}
```

**📝 Usage với Custom Hook:**

```tsx
// Checkboxes.tsx - Simplified với custom hook
import { useCheckboxTree } from "./hooks/useCheckboxTree";
import CheckboxList from "./CheckboxList";

export default function Checkboxes({ defaultData, onSelectionChange }: Props) {
  const { data, handleCheck, checkAll, uncheckAll, getCheckedItems } =
    useCheckboxTree({
      initialData: defaultData,
      onChange: onSelectionChange,
    });

  return (
    <div>
      <div className="toolbar">
        <button onClick={checkAll}>Select All</button>
        <button onClick={uncheckAll}>Deselect All</button>
        <span>{getCheckedItems().length} selected</span>
      </div>
      <CheckboxList items={data} onCheck={handleCheck} />
    </div>
  );
}
```

**🤔 Q&A về Custom Hooks:**

| Câu hỏi                        | Cách trả lời                                                                           |
| ------------------------------ | -------------------------------------------------------------------------------------- |
| "Tại sao dùng custom hook?"    | "Reusable logic. Component chỉ focus render. Hook encapsulate state + handlers."       |
| "useCallback cần thiết không?" | "Stabilize function reference. Cần khi pass xuống memoized components."                |
| "Hook vs HOC vs Render Props?" | "Hooks modern, composable, no wrapper hell. HOC/Render Props legacy patterns."         |
| "Rules of Hooks?"              | "1) Only at top level 2) Only in React functions. eslint-plugin-react-hooks enforces." |
| "Custom hook naming?"          | "Must start with 'use'. Convention, và React dùng để validate rules of hooks."         |

**�📊 Khi nào interviewer hỏi bài này?**

| Level         | Mục đích đánh giá                                                      |
| ------------- | ---------------------------------------------------------------------- |
| **Mid-level** | Recursion, component composition, basic state management               |
| **Senior**    | Bidirectional propagation, performance optimization, edge cases        |
| **Staff**     | System design for scale, alternative architectures, testing strategies |

**🤔 Advanced Q&A - React Concepts:**

| Câu hỏi                               | Cách trả lời                                                                                         |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| "useState vs useReducer cho bài này?" | "useReducer tốt hơn khi state updates phức tạp. Có thể dispatch actions như CHECK, UNCHECK, TOGGLE." |
| "Context API có dùng được không?"     | "Có, nhưng prop drilling simpler cho interview. Context tốt khi nhiều consumers ở different levels." |
| "Tại sao không dùng Redux?"           | "Overkill cho isolated component. Redux tốt khi state shared across app, không phải single tree."    |
| "React 18 Concurrent features?"       | "useDeferredValue cho large tree rendering. Giữ UI responsive khi updating nhiều nodes."             |
| "Server Components?"                  | "Checkbox cần client-side interactivity. Server Components cho static parts như initial data."       |

**⏱️ Interview Timeline - 45 Phút:**

```
┌─────────────────────────────────────────────────────────────────┐
│  INTERVIEW TIMELINE (45 min)                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  0:00 - 0:05  CLARIFY REQUIREMENTS                              │
│  ────────────────────────────────────────                       │
│  • Confirm: parent/child sync behavior                          │
│  • Ask: expand/collapse feature needed?                         │
│  • Ask: async data fetching?                                    │
│  • Ask: performance constraints (# of nodes)?                   │
│                                                                 │
│  0:05 - 0:10  HIGH-LEVEL DESIGN                                 │
│  ────────────────────────────────────────                       │
│  • Draw component hierarchy                                     │
│  • Explain data structure (recursive interface)                 │
│  • Discuss state management approach                            │
│                                                                 │
│  0:10 - 0:35  IMPLEMENTATION                                    │
│  ────────────────────────────────────────                       │
│  • Types first (2 min)                                          │
│  • CheckboxInput với indeterminate (5 min)                      │
│  • CheckboxList recursive (5 min)                               │
│  • State update functions (8 min)                               │
│  • Root component integration (5 min)                           │
│                                                                 │
│  0:35 - 0:40  TEST & DEBUG                                      │
│  ────────────────────────────────────────                       │
│  • Walk through click scenarios                                 │
│  • Test edge cases verbally                                     │
│                                                                 │
│  0:40 - 0:45  DISCUSS IMPROVEMENTS                              │
│  ────────────────────────────────────────                       │
│  • Performance optimizations                                    │
│  • Accessibility considerations                                 │
│  • Testing strategy                                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**💼 Real-World Use Cases:**

| Use Case                | Ví dụ                                           | Đặc điểm                        |
| ----------------------- | ----------------------------------------------- | ------------------------------- |
| **E-commerce Filters**  | Category filter (Electronics > Phones > iPhone) | Deep nesting, URL sync          |
| **File Permissions**    | Google Drive sharing (Read/Write/Owner)         | Multiple checkbox groups        |
| **Role Management**     | Admin > Editor > Viewer permissions             | Often pre-defined hierarchy     |
| **Survey Questions**    | "Select all that apply" với sub-options         | Dynamic data from API           |
| **Feature Toggles**     | Settings page với categories                    | Typically 2-3 levels            |
| **Org Chart Selection** | Select employees by department                  | Very deep, performance critical |

**🎯 Interview Focus Points:**

| Nếu còn thời gian | Nên mention                             |
| ----------------- | --------------------------------------- |
| **5 phút extra**  | Error boundaries, loading states        |
| **10 phút extra** | Full accessibility (keyboard nav, ARIA) |
| **15 phút extra** | Virtualization cho performance          |

**🤔 Behavioral Questions có thể đi kèm:**

| Câu hỏi                              | Cách trả lời framework                                             |
| ------------------------------------ | ------------------------------------------------------------------ |
| "Có ever implement similar feature?" | STAR: Situation → Task → Action → Result                           |
| "Làm gì khi stuck?"                  | "Break down problem, console.log, rubber duck debug, ask for help" |
| "Làm sao prioritize features?"       | "MoSCoW method: Must-have, Should-have, Could-have, Won't-have"    |
| "Thời gian estimate này bao lâu?"    | "Production quality: 1-2 days. Include tests, a11y, edge cases."   |

**🔄 Data Flow trong bài toán:**

```
┌─────────────────────────────────────────────────────────────────┐
│  DATA FLOW (One-Way + Callback)                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐                                                │
│  │ Root (State)│ ─────────→ Props (data, handlers)              │
│  └─────────────┘                                                │
│         ↑                         ↓                             │
│         │               ┌─────────────────┐                     │
│   Callback              │ CheckboxList    │                     │
│   (onCheck)             │ (renders items) │                     │
│         │               └─────────────────┘                     │
│         │                         ↓                             │
│  ┌──────┴───────┐       ┌─────────────────┐                     │
│  │ State Update │ ←──── │ CheckboxInput   │                     │
│  │ + Re-render  │       │ (user clicks)   │                     │
│  └──────────────┘       └─────────────────┘                     │
│                                                                 │
│  KEY POINTS:                                                    │
│  • Data flows DOWN via props                                    │
│  • Events flow UP via callbacks                                 │
│  • State changes at root trigger full re-render                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**🤔 JavaScript Fundamentals - Cần nắm vững:**

| Câu hỏi                                               | Cách trả lời                                                                                             |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| "Array.prototype.reduce?"                             | "Accumulate values. reduce((acc, item, i) => acc, initial). Dùng để navigate tree với path."             |
| "Spread operator [...arr] làm shallow hay deep copy?" | "Shallow! Chỉ copy top-level. Nested objects vẫn share reference."                                       |
| "forEach vs map?"                                     | "forEach: side effects, return undefined. map: transform, return new array. Dùng map khi cần new array." |
| "const arr = []; arr.push(1) sao không lỗi?"          | "const prevents reassignment, không prevent mutation. arr = [1] sẽ lỗi, arr.push OK."                    |
| "Closures trong bài này?"                             | "handleCheck closure over checkboxData state. Mỗi render tạo new closure với current state."             |

**📚 Array Methods sử dụng trong bài:**

```typescript
// 1. every() - Check tất cả match condition
const allChecked = children.every((c) => c.checked === true);

// 2. some() - Check có ít nhất 1 match
const hasChecked = children.some((c) => c.checked === true);

// 3. filter() - Lọc matching items
const checkedItems = children.filter((c) => c.checked === true);

// 4. reduce() - Navigate path trong tree
const node = indices.reduce(
  (current, index, i) => (i === 0 ? data[index] : current.children![index]),
  null as any,
);

// 5. forEach() - Side effects (mutation)
children.forEach((child) => {
  child.checked = true; // Mutation
});

// 6. map() - Transform (rarely in this problem)
const names = children.map((c) => c.name);

// 7. slice() - Copy array hoặc get portion
const remaining = indices.slice(1); // Remove first element
```

**🔄 Recursion vs Iteration - Trade-offs:**

```
┌─────────────────────────────────────────────────────────────────┐
│  RECURSION vs ITERATION                                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  RECURSION:                                                      │
│  ✅ Natural cho tree structures                                  │
│  ✅ Code readable, mirrors problem structure                     │
│  ✅ Automatic state via call stack                               │
│  ❌ Stack overflow với deep trees (>10K levels)                  │
│  ❌ Harder to debug (stack traces)                               │
│                                                                  │
│  ITERATION:                                                      │
│  ✅ No stack overflow risk                                       │
│  ✅ Better performance (no function call overhead)               │
│  ✅ Easier to debug step-by-step                                 │
│  ❌ Manual state management với explicit stack                   │
│  ❌ Less readable for tree problems                              │
│                                                                  │
│  RECOMMENDATION: Recursion cho interview (clearer)               │
│  Production: Iterative nếu tree có thể rất deep                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**🔍 Debug Strategies:**

| Vấn đề                       | Cách debug                                                            |
| ---------------------------- | --------------------------------------------------------------------- |
| State không update           | Console.log newData trước setCheckboxData. Check reference equality.  |
| Indeterminate không hiển thị | Check useRef, useEffect dependencies. Log ref.current.indeterminate.  |
| Wrong node được update       | Log indices array. Verify path navigation logic.                      |
| Infinite loop                | Check base case của recursion. Verify mutation không affect original. |
| Performance chậm             | React DevTools Profiler. Check unnecessary re-renders.                |

---

### Bước 1: Type Definitions

> 🎯 **Mục tiêu**: Define data structure cho recursive tree.

**💬 Cách trình bày:**

> "Đầu tiên tôi define types. CheckboxItem có thể có children, tạo thành recursive structure. Checked có 3 possible values: true, false, hoặc 'indeterminate'."

```typescript
// types.ts

// Checkbox có 3 states
export type CheckboxValue = boolean | "indeterminate";

// Recursive data structure
export interface CheckboxItem {
  id: number;
  name: string;
  checked: CheckboxValue;
  children?: CheckboxItem[]; // Optional - leaf nodes không có
}

// Props cho CheckboxList component
export interface CheckboxListProps {
  items: ReadonlyArray<CheckboxItem>;
  onCheck: (value: boolean, indices: ReadonlyArray<number>) => void;
}
```

**🤔 Câu hỏi interviewer có thể hỏi:**

| Câu hỏi                                                 | Cách trả lời                                                                                                 |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| "Tại sao 'indeterminate' là string không phải boolean?" | "Vì có 3 states cần represent. Boolean chỉ có true/false. Có thể dùng enum nhưng literal type đơn giản hơn." |
| "ReadonlyArray để làm gì?"                              | "Signal rằng function không nên mutate array. Type-level immutability."                                      |
| "Tại sao children optional?"                            | "Leaf nodes (như 'iPhone') không có children. Optional cho phép cả leaf và parent nodes cùng type."          |
| "Có thể dùng Map thay object không?"                    | "Có, nhưng JSON serialize không support Map. Object/Array đơn giản hơn cho interview."                       |

**📚 Kiến thức nâng cao - Recursive Types:**

```typescript
// CÁCH 1: Direct recursion (như trên)
interface CheckboxItem {
  children?: CheckboxItem[];
}

// CÁCH 2: Với generic constraint
interface TreeNode<T> {
  data: T;
  children?: TreeNode<T>[];
}
type CheckboxNode = TreeNode<{
  id: number;
  name: string;
  checked: CheckboxValue;
}>;

// CÁCH 3: Với discriminated union
type CheckboxItem = LeafNode | ParentNode;
interface LeafNode {
  type: "leaf";
  id: number;
  name: string;
  checked: boolean;
}
interface ParentNode {
  type: "parent";
  id: number;
  name: string;
  checked: CheckboxValue;
  children: CheckboxItem[];
}
```

**🤔 Advanced Q&A - TypeScript Patterns:**

| Câu hỏi                                | Cách trả lời                                                                                       |
| -------------------------------------- | -------------------------------------------------------------------------------------------------- |
| "Tại sao dùng interface thay vì type?" | "Interface cho object shapes, type cho unions. Interface có declaration merging. Cả hai OK ở đây." |
| "as const assertion?"                  | "Make literal types readonly. Ví dụ: `['a', 'b'] as const` → readonly tuple type."                 |
| "Branded/Nominal types?"               | "Tạo distinct types. `type NodeId = number & { _brand: 'NodeId' }`. Prevent mixing IDs."           |
| "Utility types nào hữu ích?"           | "Partial, Required, Pick, Omit, Record. Ví dụ: `Partial<CheckboxItem>` cho update payload."        |
| "Type guard function?"                 | "User-defined: `function hasChildren(item): item is ParentNode { return 'children' in item }`"     |

**📊 Type Guard Example:**

```typescript
// Type guard cho ParentNode
function isParentNode(item: CheckboxItem): item is ParentNode {
  return "type" in item && item.type === "parent";
}

// Usage
function processNode(item: CheckboxItem) {
  if (isParentNode(item)) {
    // TypeScript knows: item.children exists
    item.children.forEach((child) => processNode(child));
  } else {
    // TypeScript knows: item is LeafNode
    console.log(item.checked); // boolean, not CheckboxValue
  }
}
```

**⚠️ Edge Cases cần handle:**

| Edge Case                   | Cách xử lý                                                     |
| --------------------------- | -------------------------------------------------------------- |
| Empty tree `[]`             | Render nothing, handleCheck không được gọi                     |
| Single node (no children)   | Render single checkbox, no recursion                           |
| Deeply nested (100+ levels) | Có thể stack overflow, cần iterative approach                  |
| Duplicate IDs               | Warning/error, keys phải unique                                |
| Circular references         | JSON.stringify fails, cần custom clone                         |
| Null/undefined children     | Check truthy: `if (item.children && item.children.length > 0)` |
| Empty children array `[]`   | Parent không có children visible, vẫn là parent node           |

---

### Bước 2: CheckboxInput Component

> 🎯 **Mục tiêu**: Component xử lý indeterminate state qua JavaScript.

**💬 Cách trình bày:**

> "Indeterminate state đặc biệt - không có HTML attribute, chỉ set được qua JavaScript. Tôi dùng useRef để access DOM element và useEffect để sync indeterminate property."

```tsx
// CheckboxInput.tsx
import { InputHTMLAttributes, useEffect, useId, useRef } from "react";

export type CheckboxValue = boolean | "indeterminate";

export default function CheckboxInput({
  checked,
  label,
  ...props
}: Readonly<{
  checked: CheckboxValue;
  label: string;
}> &
  Omit<InputHTMLAttributes<HTMLInputElement>, "checked">) {
  const id = useId(); // Unique ID cho label association
  const ref = useRef<HTMLInputElement | null>(null);

  // Sync indeterminate property với DOM
  useEffect(() => {
    if (!ref.current) return;
    ref.current.indeterminate = checked === "indeterminate";
  }, [checked]);

  return (
    <div className="checkbox">
      <input
        id={id}
        ref={ref}
        type="checkbox"
        // Khi indeterminate, checked nên là false
        // Để click vào indeterminate → checked (không phải unchecked)
        checked={checked === true}
        {...props}
      />
      <label htmlFor={id}>{label}</label>
    </div>
  );
}
```

**🤔 Câu hỏi interviewer có thể hỏi:**

| Câu hỏi                                       | Cách trả lời                                                                            |
| --------------------------------------------- | --------------------------------------------------------------------------------------- |
| "Tại sao cần useRef?"                         | "indeterminate là DOM property, không phải attribute. Cần direct DOM access để set nó." |
| "useId() để làm gì?"                          | "Generate unique ID cho label htmlFor. React 18+ built-in, SSR-safe."                   |
| "Tại sao checked là false khi indeterminate?" | "UX: click indeterminate → checked. Nếu checked=true, click sẽ uncheck thay vì check."  |
| "Spread ...props để làm gì?"                  | "Forward các HTML attributes như onChange, disabled. Composition pattern."              |
| "Tại sao Omit<..., 'checked'>?"               | "Vì chúng ta override checked prop với custom type. Tránh type conflict."               |

**📚 Kiến thức nâng cao - Indeterminate State:**

```typescript
// Browser behavior với indeterminate:
// 1. Visual: hiển thị dash/hyphen thay vì checkmark
// 2. checked attribute vẫn có value (true/false)
// 3. Chỉ set được qua JS: element.indeterminate = true
// 4. Click vào indeterminate → checked = !checked (toggle)

// Alternative: CSS-only indeterminate visual
// Dùng data attribute và custom styling
<input
  type="checkbox"
  data-indeterminate={checked === 'indeterminate'}
/>

// CSS:
// input[data-indeterminate="true"]::before {
//   content: "-";
//   ...
// }
```

**🤔 Advanced Q&A - Component Design:**

| Câu hỏi                             | Cách trả lời                                                                                   |
| ----------------------------------- | ---------------------------------------------------------------------------------------------- |
| "useLayoutEffect vs useEffect?"     | "useLayoutEffect sync, block paint. Ở đây không cần vì indeterminate không affect layout."     |
| "Forward ref cần không?"            | "Nếu parent cần access DOM element. React.forwardRef + useImperativeHandle."                   |
| "Controlled vs Uncontrolled input?" | "Controlled: value từ state. Bài này controlled vì checked từ props, onChange báo lên parent." |
| "Aria attributes cần gì?"           | "aria-checked='mixed' cho indeterminate. Screen reader sẽ đọc 'partially checked'."            |
| "Focus management?"                 | "tabIndex cho keyboard navigation. Focus ring visible. Có thể custom với :focus-visible."      |

**♿ Accessibility Enhancements:**

```tsx
// Full accessible version
<input
  id={id}
  ref={ref}
  type="checkbox"
  checked={checked === true}
  aria-checked={checked === "indeterminate" ? "mixed" : checked}
  aria-label={label}
  role="checkbox"
  tabIndex={0}
  {...props}
/>
```

---

### Bước 3: CheckboxList Component (Recursive Renderer)

> 🎯 **Mục tiêu**: Render nested checkboxes với arbitrary depth.

**💬 Cách trình bày:**

> "CheckboxList là recursive component - nó render chính nó cho children. Dùng ul/li cho semantic HTML và natural indentation."

```tsx
// CheckboxList.tsx
import CheckboxInput, { CheckboxValue } from "./CheckboxInput";

export interface CheckboxItem {
  id: number;
  name: string;
  checked: CheckboxValue;
  children?: CheckboxItem[];
}

export default function CheckboxList({
  items,
  onCheck,
}: Readonly<{
  items: ReadonlyArray<CheckboxItem>;
  onCheck: (value: boolean, indices: ReadonlyArray<number>) => void;
}>) {
  return (
    <ul>
      {items.map((item, index) => (
        <li key={item.id}>
          <div>
            <CheckboxInput
              checked={item.checked}
              label={item.name}
              onChange={(event) => {
                // Báo lên parent với checked value và index path
                onCheck(event.target.checked, [index]);
              }}
            />
          </div>

          {/* RECURSIVE: Render children nếu có */}
          {item.children && item.children.length > 0 && (
            <CheckboxList
              items={item.children}
              onCheck={(newValue, indices) => {
                // Prepend current index vào path
                onCheck(newValue, [index, ...indices]);
              }}
            />
          )}
        </li>
      ))}
    </ul>
  );
}
```

**🤔 Câu hỏi interviewer có thể hỏi:**

| Câu hỏi                        | Cách trả lời                                                                                                         |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| "Tại sao dùng ul/li?"          | "Semantic HTML cho hierarchical data. Browser có natural indentation với padding-left."                              |
| "indices array để làm gì?"     | "Path từ root đến checkbox được click. [0, 1] = second child của first child. Giúp root locate và update đúng node." |
| "Tại sao prepend index?"       | "Build path bottom-up. Mỗi level thêm index của nó vào đầu array."                                                   |
| "Key có thể dùng index không?" | "Không nên nếu list có thể reorder. id là stable identifier, tốt hơn index."                                         |
| "Recursion có limit không?"    | "JavaScript call stack ~10,000. Với tree sâu hơn cần tail call optimization hoặc iterative approach."                |

**📚 Kiến thức nâng cao - Index Path Pattern:**

```typescript
// INDEX PATH: Cách locate node trong tree

// Data:
// [0] Electronics
//   [0, 0] Mobile phones
//     [0, 0, 0] iPhone
//     [0, 0, 1] Android
//   [0, 1] Laptops
//     [0, 1, 0] MacBook
//     [0, 1, 1] Surface Pro
// [1] Books
//   [1, 0] Fiction
//   [1, 1] Non-fiction
// [2] Toys

// Locate node by path
function getNodeByPath(data: CheckboxItem[], indices: number[]): CheckboxItem {
  return indices.reduce(
    (node, index, i) => (i === 0 ? data[index] : node.children![index]),
    null as any,
  );
}

// Example: getNodeByPath(data, [0, 1, 1]) → Surface Pro
```

**🤔 Advanced Q&A - Recursion Patterns:**

| Câu hỏi                            | Cách trả lời                                                                          |
| ---------------------------------- | ------------------------------------------------------------------------------------- |
| "Recursion depth quá lớn thì sao?" | "Stack overflow. Convert sang iterative với explicit stack. Hoặc trampoline pattern." |
| "Làm sao đếm total nodes?"         | "Recursive count: 1 + children.reduce((sum, c) => sum + countNodes(c), 0)."           |
| "Có thể dùng React.Children.map?"  | "Không - đó cho component children. Ở đây data children, dùng array.map trực tiếp."   |
| "memo cho CheckboxList?"           | "Có thể, nhưng cần stable onCheck callback. Dùng useCallback ở parent."               |
| "Virtualization cho nested list?"  | "Phức tạp hơn flat list. Flatten tree + track depth + custom row height."             |

**📊 Recursion Visualization:**

```
┌─────────────────────────────────────────────────────────────────┐
│  RECURSIVE RENDERING CALL STACK                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  CheckboxList(items=[Electronics, Books, Toys])                 │
│    │                                                            │
│    ├── render Electronics                                       │
│    │   └── CheckboxList(items=[Mobile, Laptops])                │
│    │         │                                                  │
│    │         ├── render Mobile phones                           │
│    │         │   └── CheckboxList(items=[iPhone, Android])      │
│    │         │         ├── render iPhone (no children)          │
│    │         │         └── render Android (no children)         │
│    │         │                                                  │
│    │         └── render Laptops                                 │
│    │             └── CheckboxList(items=[MacBook, Surface])     │
│    │                                                            │
│    ├── render Books                                             │
│    │   └── CheckboxList(items=[Fiction, Non-fiction])           │
│    │                                                            │
│    └── render Toys (no children)                                │
│                                                                 │
│  STACK DEPTH = Tree Depth (here: 4 levels max)                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**🔄 Alternative: Iterative Rendering (với explicit stack):**

```tsx
// Nếu cần tránh recursion
function FlatCheckboxList({ data }: { data: CheckboxItem[] }) {
  // Flatten tree với depth tracking
  const flatItems = useMemo(() => {
    const result: { item: CheckboxItem; depth: number; path: number[] }[] = [];
    const stack = data.map((item, i) => ({ item, depth: 0, path: [i] }));

    while (stack.length > 0) {
      const { item, depth, path } = stack.pop()!;
      result.push({ item, depth, path });

      if (item.children) {
        // Add children to stack (reverse để giữ order)
        for (let i = item.children.length - 1; i >= 0; i--) {
          stack.push({
            item: item.children[i],
            depth: depth + 1,
            path: [...path, i],
          });
        }
      }
    }
    return result;
  }, [data]);

  return (
    <ul>
      {flatItems.map(({ item, depth, path }) => (
        <li key={item.id} style={{ paddingLeft: depth * 24 }}>
          <CheckboxInput checked={item.checked} label={item.name} />
        </li>
      ))}
    </ul>
  );
}
```

---

### Bước 4: State Update Functions

> 🎯 **Mục tiêu**: Xử lý bidirectional state propagation.

**💬 Cách trình bày:**

> "Khi checkbox được click, có 3 operations: (1) Update chính nó, (2) Update tất cả descendants xuống, (3) Update tất cả ancestors lên. Tôi tách thành 2 pure functions."

```typescript
// stateUtils.ts

/**
 * PROPAGATE DOWN: Update checkbox và tất cả descendants
 * Recursive DFS - set tất cả thành cùng value
 */
function updateCheckboxAndDescendants(
  checkboxItem: CheckboxItem,
  checked: boolean, // boolean, không phải indeterminate
) {
  // Update chính nó
  checkboxItem.checked = checked;

  // Base case: không có children
  if (!checkboxItem.children) return;

  // Recursive case: update tất cả children
  checkboxItem.children.forEach((childItem) =>
    updateCheckboxAndDescendants(childItem, checked),
  );
}

/**
 * PROPAGATE UP: Resolve ancestors' states bottom-up
 * Đi theo path xuống, sau đó resolve ngược lên
 */
function resolveCheckboxStates(
  checkboxItem: CheckboxItem,
  indices: ReadonlyArray<number>, // Path còn lại
) {
  // STEP 1: Đi sâu xuống theo path trước
  if (indices.length > 0 && checkboxItem.children) {
    resolveCheckboxStates(checkboxItem.children[indices[0]], indices.slice(1));
  }

  // STEP 2: Sau khi return từ recursion, resolve chính nó
  // Base case: leaf node - không cần resolve
  if (!checkboxItem.children) return;

  // Count children states
  const totalChildren = checkboxItem.children.length;
  const checkedCount = checkboxItem.children.filter(
    (item) => item.checked === true,
  ).length;
  const uncheckedCount = checkboxItem.children.filter(
    (item) => item.checked === false,
  ).length;

  // Determine parent's new state
  if (checkedCount === totalChildren) {
    checkboxItem.checked = true; // All checked
  } else if (uncheckedCount === totalChildren) {
    checkboxItem.checked = false; // All unchecked
  } else {
    checkboxItem.checked = "indeterminate"; // Mixed
  }
}
```

**🤔 Câu hỏi interviewer có thể hỏi:**

| Câu hỏi                                | Cách trả lời                                                                                                     |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| "Tại sao mutate trực tiếp?"            | "Chúng ta đã clone data ở caller. Mutation OK trên clone. Cleaner than immutable updates cho nested structures." |
| "Time complexity?"                     | "O(n) cho cả 2: visit mỗi node tối đa 1 lần. n = total nodes."                                                   |
| "Tại sao resolve bottom-up?"           | "Parent's state phụ thuộc children. Children phải resolved trước để parent tính đúng."                           |
| "indices.slice(1) có expensive không?" | "O(k) với k = path length. Thường k << n nên acceptable."                                                        |
| "Có thể optimize không?"               | "Có: memoize children counts, hoặc maintain parallel data structure cho fast lookups."                           |

**📊 Algorithm Visualization:**

```
┌─────────────────────────────────────────────────────────────────┐
│  STEP-BY-STEP: Click "iPhone" to CHECK                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Initial state:                                                 │
│  [☐] Electronics                                                │
│     [☐] Mobile phones                                           │
│        [☐] iPhone  ← CLICK HERE                                 │
│        [☐] Android                                              │
│     [☐] Laptops                                                 │
│                                                                 │
│  STEP 1: updateCheckboxAndDescendants(iPhone, true)             │
│  [☐] Electronics                                                │
│     [☐] Mobile phones                                           │
│        [✓] iPhone  ← Updated                                    │
│        [☐] Android                                              │
│                                                                 │
│  STEP 2: resolveCheckboxStates() - bottom-up                    │
│  Going DOWN first: Electronics → Mobile phones → iPhone         │
│  Coming UP: resolve each ancestor                               │
│                                                                 │
│  [─] Electronics  ← 1 of 2 children checked → indeterminate     │
│     [─] Mobile phones  ← 1 of 2 children checked → indeterminate│
│        [✓] iPhone                                               │
│        [☐] Android                                              │
│     [☐] Laptops  ← no change (not in path)                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**🤔 Advanced Q&A - Algorithm & Complexity:**

| Câu hỏi                          | Cách trả lời                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------- |
| "DFS vs BFS cho tree traversal?" | "DFS tự nhiên hơn với recursion, less memory. BFS dùng queue, good cho level-order."            |
| "Space complexity?"              | "O(d) với d = max depth cho call stack. O(n) nếu flatten toàn bộ tree."                         |
| "Làm sao test functions này?"    | "Unit test với mock data. Test edge cases: leaf, all checked, mixed, deep nesting."             |
| "Pure functions có gì đặc biệt?" | "Predictable output cho same input. Easy to test, no side effects (ngoại trừ mutation intent)." |
| "Tail recursion optimization?"   | "JS không guarantee TCO. Chỉ Safari support. Convert sang while loop nếu cần."                  |

**🔄 Alternative: Immer cho immutable updates:**

```typescript
import { produce } from "immer";

const handleCheck = (checked: boolean, indices: number[]) => {
  const newData = produce(checkboxData, (draft) => {
    // Navigate to node
    let node = draft[indices[0]];
    for (let i = 1; i < indices.length; i++) {
      node = node.children![indices[i]];
    }

    // Update descendants
    updateCheckboxAndDescendants(node, checked);

    // Resolve ancestors
    resolveCheckboxStates(draft[indices[0]], indices.slice(1));
  });

  setCheckboxData(newData);
};
// Immer tự động tạo new reference cho changed paths
```

**📊 Complexity Analysis:**

```
┌─────────────────────────────────────────────────────────────────┐
│  COMPLEXITY BREAKDOWN                                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  n = total nodes in tree                                        │
│  d = max depth of tree                                          │
│  k = length of path to clicked node                             │
│                                                                 │
│  ┌────────────────────────┬────────────────────────────────┐   │
│  │ Operation              │ Complexity                     │   │
│  ├────────────────────────┼────────────────────────────────┤   │
│  │ Deep clone (JSON)      │ O(n) time, O(n) space          │   │
│  │ Navigate to node       │ O(k) time                      │   │
│  │ Update descendants     │ O(subtree size) ≤ O(n)         │   │
│  │ Resolve ancestors      │ O(k × children count) ≈ O(k)   │   │
│  │ Set state              │ O(1) amortized                 │   │
│  ├────────────────────────┼────────────────────────────────┤   │
│  │ TOTAL                  │ O(n) worst case                │   │
│  └────────────────────────┴────────────────────────────────┘   │
│                                                                 │
│  For 1000 nodes: ~1ms (acceptable)                              │
│  For 10,000 nodes: ~10ms (consider optimization)                │
│  For 100,000 nodes: ~100ms (need virtualization)                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### Bước 5: Root Component (State Owner)

> 🎯 **Mục tiêu**: Orchestrate state updates và render tree.

**💬 Cách trình bày:**

> "Root component là single source of truth. Nó houses entire tree state, handles updates, và passes down data + handlers."

```tsx
// Checkboxes.tsx
import { useState } from "react";
import CheckboxList, { CheckboxItem } from "./CheckboxList";

export default function Checkboxes({
  defaultCheckboxData,
}: Readonly<{
  defaultCheckboxData: ReadonlyArray<CheckboxItem>;
}>) {
  const [checkboxData, setCheckboxData] = useState(defaultCheckboxData);

  const handleCheck = (checked: boolean, indices: ReadonlyArray<number>) => {
    // STEP 1: Deep clone để không mutate original
    const newCheckboxData: CheckboxItem[] = JSON.parse(
      JSON.stringify(checkboxData),
    );

    // STEP 2: Locate the modified checkbox
    const firstLevelIndex = indices[0];
    const remainingIndices = indices.slice(1);

    // Navigate to the modified checkbox
    const modifiedCheckboxItem = remainingIndices.reduce(
      (item, index) => item.children![index],
      newCheckboxData[firstLevelIndex],
    );

    // STEP 3: Update descendants (propagate DOWN)
    updateCheckboxAndDescendants(modifiedCheckboxItem, checked);

    // STEP 4: Update ancestors (propagate UP)
    resolveCheckboxStates(newCheckboxData[firstLevelIndex], remainingIndices);

    // STEP 5: Commit state
    setCheckboxData(newCheckboxData);
  };

  return <CheckboxList items={checkboxData} onCheck={handleCheck} />;
}
```

**🤔 Câu hỏi interviewer có thể hỏi:**

| Câu hỏi                                             | Cách trả lời                                                                                                       |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| "JSON.parse(JSON.stringify()) có vấn đề gì?"        | "Chậm với large data, mất Date/undefined/functions. Cho interview OK. Production dùng structuredClone hoặc Immer." |
| "Tại sao defaultCheckboxData thay vì checkboxData?" | "Naming convention: 'default' prefix cho uncontrolled initial value. Có thể make controlled với value + onChange." |
| "Controlled vs Uncontrolled pattern?"               | "Uncontrolled: component owns state (như hiện tại). Controlled: parent owns state, pass value + onChange."         |
| "Có thể optimize re-renders không?"                 | "Có: React.memo cho CheckboxInput, useMemo cho handlers. Nhưng premature optimization cho interview."              |

**🤔 Advanced Q&A - State Management:**

| Câu hỏi                           | Cách trả lời                                                                              |
| --------------------------------- | ----------------------------------------------------------------------------------------- |
| "useReducer thay useState?"       | "Có thể: dispatch({ type: 'CHECK', indices, value }). Tốt hơn khi có nhiều action types." |
| "useCallback cho handleCheck?"    | "Không cần vì CheckboxList không memo. Nếu memo thì cần useCallback + deps array."        |
| "Lazy initialization?"            | "useState(() => expensiveComputation()). Chỉ chạy lần đầu mount."                         |
| "Context API cho deeply nested?"  | "Tránh prop drilling. Nhưng ở đây prop drilling OK vì structure rõ ràng."                 |
| "External state (Zustand/Jotai)?" | "Overkill cho single component. Tốt khi nhiều components cần shared state."               |

**🔄 Version với useReducer:**

```tsx
type Action =
  | { type: "CHECK"; indices: number[]; checked: boolean }
  | { type: "EXPAND"; indices: number[] }
  | { type: "COLLAPSE"; indices: number[] }
  | { type: "RESET" };

function checkboxReducer(
  state: CheckboxItem[],
  action: Action,
): CheckboxItem[] {
  const newState = JSON.parse(JSON.stringify(state));

  switch (action.type) {
    case "CHECK": {
      const node = getNodeByPath(newState, action.indices);
      updateCheckboxAndDescendants(node, action.checked);
      resolveCheckboxStates(
        newState[action.indices[0]],
        action.indices.slice(1),
      );
      return newState;
    }
    case "RESET":
      return uncheckAll(newState);
    default:
      return state;
  }
}

function Checkboxes({ defaultCheckboxData }: Props) {
  const [checkboxData, dispatch] = useReducer(
    checkboxReducer,
    defaultCheckboxData,
  );

  const handleCheck = (checked: boolean, indices: number[]) => {
    dispatch({ type: "CHECK", indices, checked });
  };

  return <CheckboxList items={checkboxData} onCheck={handleCheck} />;
}
```

**📊 Trade-off Analysis:**

```
┌─────────────────────────────────────────────────────────────────┐
│  useState vs useReducer                                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────────────────────┬───────────────────────────────────────┐ │
│  │ Criteria           │ useState      │ useReducer            │ │
│  ├────────────────────┼───────────────┼───────────────────────┤ │
│  │ Simplicity         │ ✅ Simple      │ ❌ More boilerplate    │ │
│  │ Testability        │ ⚠️ Medium     │ ✅ Easy (pure reducer) │ │
│  │ Complex logic      │ ⚠️ Messy      │ ✅ Organized           │ │
│  │ Multiple actions   │ ⚠️ Functions  │ ✅ Action types        │ │
│  │ DevTools          │ ❌ None        │ ⚠️ With middleware     │ │
│  └────────────────────┴───────────────┴───────────────────────┘ │
│                                                                 │
│  Recommendation: useState OK for interview. useReducer for      │
│  production if adding undo/redo, persistence, or many actions.  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Bước 6: Usage và Styling

> 🎯 **Mục tiêu**: App component và basic CSS.

```tsx
// App.tsx
import Checkboxes from "./Checkboxes";

const checkboxesData = [
  {
    id: 1,
    name: "Electronics",
    checked: false,
    children: [
      {
        id: 2,
        name: "Mobile phones",
        checked: false,
        children: [
          { id: 3, name: "iPhone", checked: false },
          { id: 4, name: "Android", checked: false },
        ],
      },
      {
        id: 5,
        name: "Laptops",
        checked: false,
        children: [
          { id: 6, name: "MacBook", checked: false },
          { id: 7, name: "Surface Pro", checked: false },
        ],
      },
    ],
  },
  {
    id: 8,
    name: "Books",
    checked: false,
    children: [
      { id: 9, name: "Fiction", checked: false },
      { id: 10, name: "Non-fiction", checked: false },
    ],
  },
  { id: 11, name: "Toys", checked: false },
];

export default function App() {
  return (
    <div>
      <h1>Nested Checkboxes</h1>
      <Checkboxes defaultCheckboxData={checkboxesData} />
    </div>
  );
}
```

```css
/* styles.css */
body {
  font-family: sans-serif;
  padding: 20px;
}

ul {
  list-style: none;
  margin: 0;
  padding-left: 24px; /* Indentation cho hierarchy */
}

/* Root level không cần indent */
ul:first-child {
  padding-left: 0;
}

li {
  padding: 4px 0;
}

.checkbox {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.checkbox input {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.checkbox label {
  cursor: pointer;
  user-select: none;
}

/* Hover effect */
.checkbox:hover {
  background: #f0f0f0;
  border-radius: 4px;
  padding: 2px 8px;
  margin: -2px -8px;
}
```

**🤔 Câu hỏi interviewer có thể hỏi về Styling:**

| Câu hỏi                      | Cách trả lời                                                                                  |
| ---------------------------- | --------------------------------------------------------------------------------------------- |
| "CSS-in-JS vs vanilla CSS?"  | "Vanilla CSS đơn giản cho interview. Production có thể dùng styled-components hoặc Tailwind." |
| "Tại sao padding-left 24px?" | "Standard indentation level. Có thể customize based on design system. Tree depth visible."    |
| "list-style: none?"          | "Remove default bullets. Checkboxes replace visual indicator of hierarchy."                   |
| "user-select: none?"         | "Prevent text selection khi click nhanh. Better UX, avoid accidental selection."              |
| "Custom checkbox styling?"   | "Hide native input, use pseudo-elements hoặc SVG icons. Đảm bảo a11y với focus states."       |

**🎨 Advanced Styling - Custom Checkbox:**

```css
/* Hide native checkbox, custom design */
.checkbox input[type="checkbox"] {
  position: absolute;
  opacity: 0;
  cursor: pointer;
}

.checkbox label {
  position: relative;
  padding-left: 28px;
  cursor: pointer;
}

/* Custom checkbox box */
.checkbox label::before {
  content: "";
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  border: 2px solid #666;
  border-radius: 3px;
  background: white;
  transition: all 0.2s;
}

/* Checkmark */
.checkbox input:checked + label::after {
  content: "✓";
  position: absolute;
  left: 4px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 14px;
  color: white;
}

.checkbox input:checked + label::before {
  background: #2563eb;
  border-color: #2563eb;
}

/* Indeterminate dash */
.checkbox input[data-indeterminate="true"] + label::after {
  content: "−";
  left: 5px;
  color: white;
}

.checkbox input[data-indeterminate="true"] + label::before {
  background: #94a3b8;
  border-color: #94a3b8;
}

/* Focus ring cho accessibility */
.checkbox input:focus-visible + label::before {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}
```

**📱 Responsive Considerations:**

```css
/* Touch-friendly size trên mobile */
@media (max-width: 768px) {
  .checkbox label {
    padding: 12px 0;
    padding-left: 36px;
    font-size: 16px; /* Prevent iOS zoom */
  }

  .checkbox label::before {
    width: 24px;
    height: 24px;
  }

  ul {
    padding-left: 20px; /* Less indent on mobile */
  }
}
```

---

### Bước 7: Testing Strategies (Bonus)

> 🧪 **Mục tiêu**: Biết cách test component này trong interview.

**💬 Cách trình bày:**

> "Để verify implementation, tôi sẽ test: unit tests cho utility functions, integration tests cho component behavior, và edge case tests."

**🤔 Câu hỏi interviewer về Testing:**

| Câu hỏi                       | Cách trả lời                                                                                   |
| ----------------------------- | ---------------------------------------------------------------------------------------------- |
| "Làm sao test component này?" | "Unit test utility functions, integration test với React Testing Library, E2E với Playwright." |
| "Mock gì trong tests?"        | "Không cần mock nhiều. Data là prop, handlers là functions. Maybe mock complex API calls."     |
| "Test coverage bao nhiêu?"    | "Aim 80%+. Focus behavior tests, không chỉ line coverage. Critical paths phải 100%."           |
| "Snapshot testing?"           | "Không recommend cho dynamic components. Dễ false positives. Prefer behavior tests."           |
| "Test indeterminate state?"   | "Check DOM property: `expect(checkbox).toHaveProperty('indeterminate', true)`"                 |

**📝 Unit Tests cho Utility Functions:**

```typescript
// stateUtils.test.ts
import {
  updateCheckboxAndDescendants,
  resolveCheckboxStates,
} from "./stateUtils";

describe("updateCheckboxAndDescendants", () => {
  it("should check node and all descendants", () => {
    const node = {
      id: 1,
      name: "Parent",
      checked: false,
      children: [
        { id: 2, name: "Child 1", checked: false },
        { id: 3, name: "Child 2", checked: false },
      ],
    };

    updateCheckboxAndDescendants(node, true);

    expect(node.checked).toBe(true);
    expect(node.children[0].checked).toBe(true);
    expect(node.children[1].checked).toBe(true);
  });

  it("should handle leaf nodes (no children)", () => {
    const leaf = { id: 1, name: "Leaf", checked: false };

    updateCheckboxAndDescendants(leaf, true);

    expect(leaf.checked).toBe(true);
  });

  it("should handle deeply nested structures", () => {
    const deep = {
      id: 1,
      name: "L1",
      checked: false,
      children: [
        {
          id: 2,
          name: "L2",
          checked: false,
          children: [
            {
              id: 3,
              name: "L3",
              checked: false,
            },
          ],
        },
      ],
    };

    updateCheckboxAndDescendants(deep, true);

    expect(deep.children[0].children[0].checked).toBe(true);
  });
});

describe("resolveCheckboxStates", () => {
  it("should set parent to checked when all children checked", () => {
    const tree = {
      id: 1,
      name: "Parent",
      checked: false,
      children: [
        { id: 2, name: "Child 1", checked: true },
        { id: 3, name: "Child 2", checked: true },
      ],
    };

    resolveCheckboxStates(tree, []);

    expect(tree.checked).toBe(true);
  });

  it("should set parent to indeterminate when some children checked", () => {
    const tree = {
      id: 1,
      name: "Parent",
      checked: false,
      children: [
        { id: 2, name: "Child 1", checked: true },
        { id: 3, name: "Child 2", checked: false },
      ],
    };

    resolveCheckboxStates(tree, []);

    expect(tree.checked).toBe("indeterminate");
  });

  it("should set parent to unchecked when all children unchecked", () => {
    const tree = {
      id: 1,
      name: "Parent",
      checked: true, // Previously checked
      children: [
        { id: 2, name: "Child 1", checked: false },
        { id: 3, name: "Child 2", checked: false },
      ],
    };

    resolveCheckboxStates(tree, []);

    expect(tree.checked).toBe(false);
  });
});
```

**🔄 Integration Tests cho Component:**

```tsx
// Checkboxes.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import Checkboxes from "./Checkboxes";

const testData = [
  {
    id: 1,
    name: "Parent",
    checked: false,
    children: [
      { id: 2, name: "Child 1", checked: false },
      { id: 3, name: "Child 2", checked: false },
    ],
  },
];

describe("Checkboxes", () => {
  it("renders all checkboxes", () => {
    render(<Checkboxes defaultCheckboxData={testData} />);

    expect(screen.getByLabelText("Parent")).toBeInTheDocument();
    expect(screen.getByLabelText("Child 1")).toBeInTheDocument();
    expect(screen.getByLabelText("Child 2")).toBeInTheDocument();
  });

  it("checks parent when all children are checked", () => {
    render(<Checkboxes defaultCheckboxData={testData} />);

    fireEvent.click(screen.getByLabelText("Child 1"));
    fireEvent.click(screen.getByLabelText("Child 2"));

    expect(screen.getByLabelText("Parent")).toBeChecked();
  });

  it("sets indeterminate when some children checked", () => {
    render(<Checkboxes defaultCheckboxData={testData} />);

    fireEvent.click(screen.getByLabelText("Child 1"));
    // Child 2 still unchecked

    const parent = screen.getByLabelText("Parent") as HTMLInputElement;
    expect(parent.indeterminate).toBe(true);
  });

  it("checks all children when parent is checked", () => {
    render(<Checkboxes defaultCheckboxData={testData} />);

    fireEvent.click(screen.getByLabelText("Parent"));

    expect(screen.getByLabelText("Child 1")).toBeChecked();
    expect(screen.getByLabelText("Child 2")).toBeChecked();
  });

  it("handles empty data", () => {
    render(<Checkboxes defaultCheckboxData={[]} />);

    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });
});
```

---

### Bước 8: Performance Optimization (Advanced)

> ⚡ **Mục tiêu**: Optimize cho large trees (1000+ nodes).

**💬 Cách trình bày:**

> "Với large trees, có 3 optimization strategies: memoization để tránh unnecessary re-renders, virtualization để chỉ render visible nodes, và structural sharing cho efficient updates."

**🤔 Câu hỏi interviewer về Performance:**

| Câu hỏi                       | Cách trả lời                                                                       |
| ----------------------------- | ---------------------------------------------------------------------------------- |
| "Performance với 10K nodes?"  | "Without optimization: ~100ms per click. Cần virtualization và memoization."       |
| "React.memo có giúp không?"   | "Có nếu props stable. Cần useCallback cho handlers, useMemo cho computed values."  |
| "Khi nào cần virtualization?" | "Khi visible nodes < total nodes. Typically > 100 nodes. Library: react-window."   |
| "Debounce checkbox clicks?"   | "Không cần - click là discrete events. Debounce cho search input, không checkbox." |
| "Web Workers?"                | "Có thể offload tree traversal nhưng phức tạp. Premature optimization usually."    |

**⚡ Optimization 1: React.memo với Custom Comparison:**

```tsx
const MemoizedCheckboxInput = memo(
  function CheckboxInput({ checked, label, onChange }: Props) {
    // ... implementation
  },
  (prevProps, nextProps) => {
    // Custom equality check - chỉ re-render khi thực sự thay đổi
    return (
      prevProps.checked === nextProps.checked &&
      prevProps.label === nextProps.label
      // onChange được stabilize bởi useCallback, không cần compare
    );
  },
);

// Parent component
function Checkboxes({ defaultCheckboxData }: Props) {
  const [checkboxData, setCheckboxData] = useState(defaultCheckboxData);

  // Stabilize callback với useCallback
  const handleCheck = useCallback((checked: boolean, indices: number[]) => {
    setCheckboxData((prev) => {
      const newData = structuredClone(prev);
      // ... update logic
      return newData;
    });
  }, []); // Empty deps - function never changes

  return <CheckboxList items={checkboxData} onCheck={handleCheck} />;
}
```

**⚡ Optimization 2: Virtualization cho Large Trees:**

```tsx
import { VariableSizeList } from "react-window";

function VirtualizedCheckboxTree({ data }: { data: CheckboxItem[] }) {
  // Flatten tree với depth tracking
  const flatNodes = useMemo(() => flattenTree(data), [data]);

  // Variable size vì có thể có expand/collapse
  const getItemSize = (index: number) => 35; // Fixed height per row

  return (
    <VariableSizeList
      height={400}
      width="100%"
      itemCount={flatNodes.length}
      itemSize={getItemSize}
      itemData={flatNodes}
    >
      {({ index, style, data }) => {
        const node = data[index];
        return (
          <div style={{ ...style, paddingLeft: node.depth * 24 }}>
            <MemoizedCheckboxInput
              checked={node.item.checked}
              label={node.item.name}
              onChange={(e) => handleCheck(e.target.checked, node.path)}
            />
          </div>
        );
      }}
    </VariableSizeList>
  );
}

// Helper: Flatten tree
function flattenTree(items: CheckboxItem[], depth = 0, path: number[] = []) {
  const result: FlatNode[] = [];

  items.forEach((item, index) => {
    const currentPath = [...path, index];
    result.push({ item, depth, path: currentPath });

    if (item.children) {
      result.push(...flattenTree(item.children, depth + 1, currentPath));
    }
  });

  return result;
}
```

**⚡ Optimization 3: Structural Sharing với Immer:**

```typescript
import { produce, enableMapSet } from "immer";

enableMapSet(); // Enable Map/Set support

const handleCheck = (checked: boolean, indices: number[]) => {
  setCheckboxData(
    produce((draft) => {
      // Navigate to node
      let node = draft[indices[0]];
      for (let i = 1; i < indices.length; i++) {
        node = node.children![indices[i]];
      }

      // Immer tracks changes và only creates new references
      // for changed parts of the tree
      updateCheckboxAndDescendants(node, checked);
      resolveCheckboxStates(draft[indices[0]], indices.slice(1));
    }),
  );
};

// Benefit: Only changed nodes get new references
// Unchanged subtrees keep same reference → React.memo works
```

**📊 Performance Comparison:**

```
┌─────────────────────────────────────────────────────────────────┐
│  PERFORMANCE BENCHMARKS (1000 nodes, measured on M1 Mac)        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────────────────────────────┬────────────────────────────┐   │
│  │ Implementation             │ Click Response Time        │   │
│  ├────────────────────────────┼────────────────────────────┤   │
│  │ Naive (no optimization)    │ ~80-120ms (janky)          │   │
│  │ + React.memo               │ ~40-60ms (noticeable)      │   │
│  │ + Immer structural sharing │ ~20-30ms (acceptable)      │   │
│  │ + Virtualization           │ ~5-10ms (smooth)           │   │
│  │ All optimizations          │ ~2-5ms (imperceptible)     │   │
│  └────────────────────────────┴────────────────────────────┘   │
│                                                                 │
│  Target: < 16ms for 60fps                                       │
│  Target: < 100ms for perceived "instant"                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### Bước 9: Context API Alternative (Advanced Pattern)

> 🌐 **Mục tiêu**: Tránh prop drilling cho deeply nested trees.

**💬 Cách trình bày:**

> "Nếu tree rất deep hoặc có nhiều consumers cần access state, Context API giúp avoid prop drilling. Trade-off là khi state change, tất cả consumers re-render."

**🤔 Câu hỏi interviewer về Context:**

| Câu hỏi                     | Cách trả lời                                                                |
| --------------------------- | --------------------------------------------------------------------------- |
| "Khi nào cần Context?"      | "Deeply nested (>5 levels), hoặc nhiều unrelated components cần cùng data." |
| "Context re-render vấn đề?" | "Có. Split context, useMemo values, hoặc use-context-selector library."     |
| "Context vs Redux?"         | "Context cho local state, simple. Redux cho global, complex, với devtools." |
| "Multiple contexts?"        | "Có thể nest. Ví dụ: CheckboxDataContext + CheckboxActionsContext."         |

**🌐 Context Implementation:**

```tsx
// CheckboxContext.tsx
import {
  createContext,
  useContext,
  ReactNode,
  useMemo,
  useCallback,
} from "react";
import { CheckboxItem } from "./types";
import { useCheckboxTree } from "./hooks/useCheckboxTree";

interface CheckboxContextValue {
  data: CheckboxItem[];
  handleCheck: (checked: boolean, indices: number[]) => void;
  checkAll: () => void;
  uncheckAll: () => void;
  getCheckedItems: () => CheckboxItem[];
}

const CheckboxContext = createContext<CheckboxContextValue | null>(null);

export function CheckboxProvider({
  children,
  initialData,
  onChange,
}: {
  children: ReactNode;
  initialData: CheckboxItem[];
  onChange?: (data: CheckboxItem[]) => void;
}) {
  const { data, handleCheck, checkAll, uncheckAll, getCheckedItems } =
    useCheckboxTree({ initialData, onChange });

  // Memoize để tránh unnecessary re-renders
  const value = useMemo(
    () => ({
      data,
      handleCheck,
      checkAll,
      uncheckAll,
      getCheckedItems,
    }),
    [data, handleCheck, checkAll, uncheckAll, getCheckedItems],
  );

  return (
    <CheckboxContext.Provider value={value}>
      {children}
    </CheckboxContext.Provider>
  );
}

// Custom hook để consume context
export function useCheckboxContext() {
  const context = useContext(CheckboxContext);
  if (!context) {
    throw new Error("useCheckboxContext must be used within CheckboxProvider");
  }
  return context;
}
```

**📝 Usage với Context:**

```tsx
// App.tsx
<CheckboxProvider initialData={data} onChange={handleChange}>
  <Toolbar /> {/* Can access checkAll, uncheckAll */}
  <CheckboxTree /> {/* Can access data, handleCheck */}
  <SelectionSummary /> {/* Can access getCheckedItems */}
</CheckboxProvider>;

// Toolbar.tsx - No prop drilling!
function Toolbar() {
  const { checkAll, uncheckAll, getCheckedItems } = useCheckboxContext();

  return (
    <div>
      <button onClick={checkAll}>Select All</button>
      <button onClick={uncheckAll}>Clear All</button>
      <span>{getCheckedItems().length} selected</span>
    </div>
  );
}

// CheckboxTree.tsx - Deeply nested, still works!
function CheckboxTree() {
  const { data, handleCheck } = useCheckboxContext();
  return <CheckboxList items={data} onCheck={handleCheck} />;
}
```

---

### Bước 10: Expand/Collapse Feature (Common Extension)

> 🔽 **Mục tiêu**: Thêm khả năng collapse/expand branches.

**💬 Cách trình bày:**

> "Expand/collapse là extension phổ biến. Thêm `expanded` state cho mỗi node, toggle khi click arrow. Collapsed nodes không render children."

**🤔 Câu hỏi về Expand/Collapse:**

| Câu hỏi                      | Cách trả lời                                                                       |
| ---------------------------- | ---------------------------------------------------------------------------------- |
| "State riêng hay cùng data?" | "Có thể tách: expandedIds Set vs checkboxData. Hoặc thêm expanded field vào node." |
| "Keyboard navigation?"       | "Arrow Right/Left để expand/collapse. Enter/Space vẫn toggle checkbox."            |
| "Animation?"                 | "CSS height transition. Hoặc Framer Motion cho smooth animations."                 |

**🔽 Expanded Data Structure:**

```typescript
interface CheckboxItem {
  id: number;
  name: string;
  checked: CheckboxValue;
  children?: CheckboxItem[];
  expanded?: boolean; // New field
}

// Hoặc tách riêng
const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

const toggleExpand = (id: number) => {
  setExpandedIds((prev) => {
    const next = new Set(prev);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    return next;
  });
};
```

**🔽 Component với Expand/Collapse:**

```tsx
function CheckboxListWithExpand({ items, indices = [] }: Props) {
  const { handleCheck } = useCheckboxContext();
  const [expandedIds, setExpandedIds] = useState<Set<number>>(
    new Set(items.map((i) => i.id)), // Default all expanded
  );

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <ul role="tree">
      {items.map((item, index) => {
        const hasChildren = item.children && item.children.length > 0;
        const isExpanded = expandedIds.has(item.id);

        return (
          <li key={item.id} role="treeitem">
            <div className="checkbox-row">
              {hasChildren && (
                <button
                  className="expand-button"
                  onClick={() => toggleExpand(item.id)}
                  aria-expanded={isExpanded}
                  aria-label={isExpanded ? "Collapse" : "Expand"}
                >
                  {isExpanded ? "▼" : "▶"}
                </button>
              )}
              <CheckboxInput
                checked={item.checked}
                label={item.name}
                onChange={(e) =>
                  handleCheck(e.target.checked, [...indices, index])
                }
              />
            </div>

            {/* Only render children if expanded */}
            {hasChildren && isExpanded && (
              <CheckboxListWithExpand
                items={item.children!}
                indices={[...indices, index]}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}
```

---

### Bước 11: API Integration (Real-World Pattern)

> 🔌 **Mục tiêu**: Load data từ API và sync state.

**💬 Cách trình bày:**

> "Production thường fetch từ API. Cần handle loading, error states, và sync lại khi data thay đổi."

**🤔 Câu hỏi về API Integration:**

| Câu hỏi                    | Cách trả lời                                                               |
| -------------------------- | -------------------------------------------------------------------------- |
| "Làm sao sync với server?" | "Optimistic update + rollback on error. Hoặc refetch after mutation."      |
| "Loading state?"           | "Skeleton hoặc spinner. Disable checkboxes during save."                   |
| "Caching?"                 | "React Query/SWR cho caching và revalidation. TanStack Query recommended." |
| "Partial update?"          | "PATCH endpoint cho single node. Hoặc diff để send only changes."          |

**🔌 API Integration với TanStack Query:**

```tsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

function useCheckboxTreeAPI() {
  const queryClient = useQueryClient();

  // Fetch initial data
  const { data, isLoading, error } = useQuery({
    queryKey: ["checkboxTree"],
    queryFn: () => fetch("/api/categories").then((res) => res.json()),
  });

  // Update mutation
  const mutation = useMutation({
    mutationFn: (newData: CheckboxItem[]) =>
      fetch("/api/categories", {
        method: "PUT",
        body: JSON.stringify(newData),
      }),
    // Optimistic update
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: ["checkboxTree"] });
      const previous = queryClient.getQueryData(["checkboxTree"]);
      queryClient.setQueryData(["checkboxTree"], newData);
      return { previous };
    },
    // Rollback on error
    onError: (err, newData, context) => {
      queryClient.setQueryData(["checkboxTree"], context?.previous);
    },
    // Refetch after success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["checkboxTree"] });
    },
  });

  return { data, isLoading, error, updateData: mutation.mutate };
}

// Usage
function Checkboxes() {
  const { data, isLoading, error, updateData } = useCheckboxTreeAPI();

  if (isLoading) return <CheckboxSkeleton />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <CheckboxProvider initialData={data} onChange={updateData}>
      <CheckboxTree />
    </CheckboxProvider>
  );
}
```

**💾 State Persistence (localStorage):**

```tsx
import { useState, useEffect } from "react";

function usePersistedCheckboxTree(key: string, initialData: CheckboxItem[]) {
  // Initialize from localStorage
  const [data, setData] = useState<CheckboxItem[]>(() => {
    if (typeof window === "undefined") return initialData;

    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : initialData;
  });

  // Persist to localStorage on change
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(data));
  }, [key, data]);

  // ... rest of useCheckboxTree logic

  return { data, setData /* ... */ };
}

// Usage với URL sync
function useURLSyncedSelection() {
  const searchParams = new URLSearchParams(window.location.search);

  const getCheckedIdsFromURL = (): Set<number> => {
    const ids = searchParams.get("selected")?.split(",").map(Number) || [];
    return new Set(ids);
  };

  const updateURL = (checkedIds: number[]) => {
    const url = new URL(window.location.href);
    url.searchParams.set("selected", checkedIds.join(","));
    window.history.replaceState({}, "", url.toString());
  };

  return { getCheckedIdsFromURL, updateURL };
}
```

---

### Bước 12: Error Handling (Production-Ready)

> 🛡️ **Mục tiêu**: Làm component robust cho production.

**💬 Cách trình bày:**

> "Để production-ready, tôi thêm error boundaries cho unexpected crashes, validate data schema, và handle edge cases gracefully."

**🤔 Câu hỏi interviewer về Error Handling:**

| Câu hỏi                             | Cách trả lời                                                                                |
| ----------------------------------- | ------------------------------------------------------------------------------------------- |
| "Error boundary cho component này?" | "Wrap trong ErrorBoundary. Catch render errors, show fallback UI, log to monitoring."       |
| "Invalid data xử lý sao?"           | "Validate schema on mount. Default values cho missing fields. Warn in dev, silent in prod." |
| "Network fetch fails?"              | "Show loading state, retry button, graceful degradation với cached data."                   |
| "Node không tìm thấy?"              | "Return early, không crash. Log warning. Consider throwing in dev."                         |
| "Type errors at runtime?"           | "TypeScript cho compile-time. Zod/Yup cho runtime validation if needed."                    |

**🛡️ Error Boundary Implementation:**

```tsx
import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class CheckboxErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to monitoring service (Sentry, etc.)
    console.error("Checkbox tree error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="error-fallback">
            <p>⚠️ Checkbox tree failed to load</p>
            <button onClick={() => this.setState({ hasError: false })}>
              Retry
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
```

**🔒 Data Validation với Zod:**

```typescript
import { z } from "zod";

// Schema definition
const CheckboxItemSchema: z.ZodType<CheckboxItem> = z.lazy(() =>
  z.object({
    id: z.number(),
    name: z.string().min(1),
    checked: z.union([z.boolean(), z.literal("indeterminate")]),
    children: z.array(CheckboxItemSchema).optional(),
  }),
);

// Validation function
function validateCheckboxData(data: unknown): CheckboxItem[] {
  const result = z.array(CheckboxItemSchema).safeParse(data);

  if (!result.success) {
    console.error("Invalid checkbox data:", result.error);
    return []; // Return empty array as fallback
  }

  return result.data;
}
```

**⚠️ Defensive Programming Patterns:**

```typescript
// Safe node access with fallback
function safeGetNode(
  data: CheckboxItem[],
  path: number[],
): CheckboxItem | null {
  try {
    return path.reduce(
      (node, index, i) => {
        if (!node) return null;
        if (i === 0) return data[index] ?? null;
        return node.children?.[index] ?? null;
      },
      null as CheckboxItem | null,
    );
  } catch {
    return null;
  }
}

// Safe update with validation
function handleCheck(checked: boolean, indices: number[]) {
  if (!Array.isArray(indices) || indices.length === 0) {
    console.warn("Invalid indices:", indices);
    return;
  }

  setCheckboxData((prev) => {
    const node = safeGetNode(structuredClone(prev), indices);

    if (!node) {
      console.warn("Node not found at path:", indices);
      return prev; // Return unchanged state
    }

    // ... update logic
  });
}
```

---

### Bước 10: Accessibility (A11y Complete)

> ♿ **Mục tiêu**: Đảm bảo component accessible cho tất cả users.

**💬 Cách trình bày:**

> "Accessibility quan trọng cho cả legal compliance và UX. Tôi implement WCAG 2.1 AA: keyboard navigation, screen reader support, focus management, và proper ARIA."

**🤔 Câu hỏi interviewer về Accessibility:**

| Câu hỏi                      | Cách trả lời                                                            |
| ---------------------------- | ----------------------------------------------------------------------- |
| "ARIA roles cần gì?"         | "role='tree', role='treeitem'. aria-checked='mixed' cho indeterminate." |
| "Keyboard navigation?"       | "Tab để focus, Space/Enter để toggle, Arrow keys để navigate tree."     |
| "Screen reader announce gì?" | "'Checkbox, Electronics, partially checked, 2 of 3 items selected'."    |
| "Focus trap trong modal?"    | "Nếu trong modal, focus stay bên trong. Dùng focus-trap library."       |
| "Color contrast?"            | "4.5:1 ratio cho text. Indeterminate có dash icon, không chỉ màu."      |

**♿ Full Accessible Implementation:**

```tsx
function AccessibleCheckboxTree({ data, onCheck }: Props) {
  const handleKeyDown = (
    e: KeyboardEvent,
    indices: number[],
    item: CheckboxItem,
  ) => {
    switch (e.key) {
      case " ":
      case "Enter":
        e.preventDefault();
        onCheck(!item.checked, indices);
        break;
      case "ArrowDown":
        e.preventDefault();
        focusNextItem();
        break;
      case "ArrowUp":
        e.preventDefault();
        focusPreviousItem();
        break;
    }
  };

  return (
    <ul role="tree" aria-label="Category selection">
      {data.map((item, index) => (
        <li key={item.id} role="treeitem" aria-level={1}>
          <input
            type="checkbox"
            checked={item.checked === true}
            aria-checked={
              item.checked === "indeterminate" ? "mixed" : item.checked
            }
            aria-label={`${item.name}, ${item.checked ? "checked" : "not checked"}`}
            onChange={(e) => onCheck(e.target.checked, [index])}
            onKeyDown={(e) => handleKeyDown(e, [index], item)}
          />
          <span aria-hidden="true">{item.name}</span>
          {/* Recursive children... */}
        </li>
      ))}
    </ul>
  );
}
```

**📊 WCAG 2.1 AA Checklist:**

```
┌─────────────────────────────────────────────────────────────────┐
│  WCAG 2.1 AA CHECKLIST                                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ✅ PERCEIVABLE:                                                │
│     ☐ aria-label, aria-checked cho screen readers              │
│     ☐ Color contrast 4.5:1                                     │
│     ☐ Indeterminate visual không chỉ dùng color                │
│                                                                 │
│  ✅ OPERABLE:                                                   │
│     ☐ Keyboard accessible (Tab, Space, Enter, Arrows)          │
│     ☐ Focus visible (:focus-visible styling)                   │
│     ☐ No keyboard trap                                         │
│                                                                 │
│  ✅ UNDERSTANDABLE:                                             │
│     ☐ Labels clear                                             │
│     ☐ Predictable behavior                                     │
│                                                                 │
│  ✅ ROBUST:                                                     │
│     ☐ Valid HTML, ARIA roles đúng                              │
│     ☐ Compatible với assistive tech                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**🎨 Focus và High Contrast Styling:**

```css
/* Visible focus for keyboard navigation */
.checkbox input:focus-visible {
  outline: 3px solid #2563eb;
  outline-offset: 2px;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .checkbox input {
    border: 2px solid currentColor;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .checkbox * {
    transition: none !important;
  }
}
```

---

## PHẦN B: TẠI SAO LÀM NHƯ VẬY? (Deep Dive)

> 💡 Phần này giải thích **lý do đằng sau** mỗi quyết định thiết kế.

### 1. Tại Sao State Nằm Ở Root?

**💬 Cách giải thích:**

> "State lifting là bắt buộc vì parent needs to know about children's state và ngược lại. Nếu mỗi checkbox manage own state, không có cách nào đồng bộ giữa parent và children."

```
┌─────────────────────────────────────────────────────────────────┐
│  WHY LIFT STATE TO ROOT?                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ❌ LOCAL STATE (each checkbox owns its state):                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Electronics [local state: false]                          │   │
│  │   └── Mobile [local state: ???]                           │   │
│  │         └── iPhone [local state: true]  ← User clicks     │   │
│  │                                                           │   │
│  │ Problem: How does Electronics know iPhone was clicked?    │   │
│  │ Answer: It can't! No way to propagate state UP.           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ✅ LIFTED STATE (root owns all state):                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Root Component                                            │   │
│  │ ├── State: entire tree with all checked values            │   │
│  │ ├── Passes: data + onChange to children                   │   │
│  │ └── On change: updates entire tree, re-renders            │   │
│  │                                                           │   │
│  │ Benefit: Single source of truth, easy to keep consistent │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**🤔 Follow-up questions:**

| Câu hỏi                             | Trả lời                                                                                                        |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| "Có cách nào khác không?"           | "Có: Context API, hoặc state management library như Zustand. Nhưng for interview, prop drilling đơn giản hơn." |
| "Performance với large tree?"       | "Re-render toàn bộ tree mỗi khi click. Với 1000+ nodes, cần React.memo hoặc virtualization."                   |
| "Tại sao không lift state lên App?" | "Principle of least privilege. Lift chỉ đủ cao để share. Quá cao = unnecessary re-renders."                    |
| "Controlled vs Uncontrolled?"       | "Đây là controlled component. State lifted to parent, parent controls via props."                              |
| "Event bubbling có liên quan?"      | "Không. React synthetic events không dùng DOM bubbling. onCheck là custom callback, không phải native event."  |

**📊 State Management Alternatives:**

| Approach          | Khi nào dùng                    | Pros                    | Cons                        |
| ----------------- | ------------------------------- | ----------------------- | --------------------------- |
| **Prop Drilling** | Tree depth < 5, interview       | Simple, no deps         | Verbose, tedious            |
| **Context API**   | Deep tree, nhiều consumers      | No prop drilling        | All consumers re-render     |
| **Zustand**       | Complex app, need selectors     | Simple API, performant  | External dep                |
| **Redux**         | Enterprise app, devtools needed | Powerful, predictable   | Boilerplate, learning curve |
| **Jotai/Recoil**  | Atomic state needed             | Fine-grained reactivity | Learning curve              |

**🔍 Deep Dive - React Reconciliation:**

```
┌─────────────────────────────────────────────────────────────────┐
│  WHAT HAPPENS WHEN STATE CHANGES?                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. setCheckboxData(newData) called                             │
│     ↓                                                           │
│  2. React schedules re-render                                   │
│     ↓                                                           │
│  3. Component function re-executes                              │
│     ↓                                                           │
│  4. New Virtual DOM created                                     │
│     ↓                                                           │
│  5. React DIFF old vs new Virtual DOM                           │
│     ↓                                                           │
│  6. Only changed DOM nodes updated (Reconciliation)             │
│                                                                 │
│  KEY INSIGHT:                                                   │
│  - Component re-render ≠ DOM update                             │
│  - React.memo prevents step 3-4 if props unchanged             │
│  - Actual DOM changes are minimal due to diffing                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Tại Sao Dùng Index Path Thay Vì ID?

**💬 Cách giải thích:**

> "Index path cho phép navigate trực tiếp đến node trong O(k) với k = depth. Nếu dùng ID, phải search toàn bộ tree O(n)."

```
┌─────────────────────────────────────────────────────────────────┐
│  INDEX PATH vs ID LOOKUP                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  INDEX PATH [0, 1, 1]:                                           │
│  data[0].children[1].children[1]                                 │
│  → O(k) với k = path length                                      │
│  → Direct access, không cần search                               │
│                                                                  │
│  ID LOOKUP (id: 7):                                              │
│  function findById(tree, id) {                                   │
│    for (node of tree) {                                          │
│      if (node.id === id) return node;                            │
│      if (node.children) {                                        │
│        const found = findById(node.children, id);                │
│        if (found) return found;                                  │
│      }                                                           │
│    }                                                             │
│  }                                                               │
│  → O(n) worst case                                               │
│                                                                  │
│  TRADE-OFF:                                                      │
│  Index path: Fast nhưng brittle nếu tree structure thay đổi     │
│  ID lookup: Slower nhưng robust với structure changes            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**🤔 Follow-up questions:**

| Câu hỏi                   | Trả lời                                                                                   |
| ------------------------- | ----------------------------------------------------------------------------------------- |
| "Production nên dùng gì?" | "Phụ thuộc use case. Static tree → Index path. Dynamic tree (add/remove) → ID lookup."    |
| "Có thể combine cả hai?"  | "Có! Maintain ID → Path map. Update map khi tree changes. O(1) lookup, O(n) khi reindex." |
| "Hybrid approach?"        | "ID cho API communication, Index path cho internal navigation. Convert khi cần."          |
| "Path validation?"        | "Check bounds: if (indices[i] >= children.length) throw Error('Invalid path')."           |

**🔧 Hybrid Implementation:**

```typescript
// Build ID → Path map for O(1) lookup
function buildIdToPathMap(data: CheckboxItem[]): Map<number, number[]> {
  const map = new Map<number, number[]>();

  function traverse(items: CheckboxItem[], path: number[]) {
    items.forEach((item, index) => {
      const currentPath = [...path, index];
      map.set(item.id, currentPath);
      if (item.children) {
        traverse(item.children, currentPath);
      }
    });
  }

  traverse(data, []);
  return map;
}

// Usage: Convert ID to Path in O(1)
const idToPath = buildIdToPathMap(checkboxData);
const path = idToPath.get(7); // [0, 1, 1]

// When to rebuild: only when tree structure changes (add/delete nodes)
```

---

### 3. Tại Sao Deep Clone?

**💬 Cách giải thích:**

> "React needs new reference để trigger re-render. Shallow copy không đủ vì nested objects vẫn share reference."

```typescript
// ❌ Shallow copy - không work
const newData = [...checkboxData];
newData[0].checked = true;
// checkboxData[0].checked cũng bị thay đổi!

// ❌ Object.assign - cũng shallow
const newData = Object.assign({}, checkboxData);

// ✅ Deep clone - safe
const newData = JSON.parse(JSON.stringify(checkboxData));
newData[0].checked = true;
// checkboxData[0].checked vẫn là false

// ✅ Alternative: structuredClone (modern browsers)
const newData = structuredClone(checkboxData);

// ✅ Alternative: Immer
import { produce } from "immer";
const newData = produce(checkboxData, (draft) => {
  draft[0].checked = true;
});
```

**🤔 Follow-up questions:**

| Câu hỏi                        | Trả lời                                                                                         |
| ------------------------------ | ----------------------------------------------------------------------------------------------- |
| "JSON.stringify có vấn đề gì?" | "Mất undefined, functions, Symbols. Không handle circular references. Slow với large objects."  |
| "structuredClone?"             | "Native deep clone, handles more types. IE không support. Check caniuse."                       |
| "Immer?"                       | "Best for complex updates. Write mutable code, get immutable result. Có overhead nhưng DX tốt." |
| "Khi nào clone toàn bộ?"       | "Khi structure có thể thay đổi ở bất kỳ đâu. Hoặc dùng Immer để structural sharing."            |
| "Memory implications?"         | "Full clone = 2x memory temporarily. GC clean up old reference. Immer = minimal extra memory."  |

**📊 Deep Clone Methods Comparison:**

| Method                       | Browser Support | Speed    | Handles              | Use when                  |
| ---------------------------- | --------------- | -------- | -------------------- | ------------------------- |
| `JSON.parse(JSON.stringify)` | All             | Slow     | JSON-safe types      | Simple data, no functions |
| `structuredClone`            | Modern          | Fast     | Most types, circular | Modern browsers only      |
| `Immer produce`              | All             | Medium   | All types            | Complex updates, want DX  |
| `lodash.cloneDeep`           | All             | Fast     | All types            | Already using lodash      |
| Manual recursive             | All             | Variable | What you implement   | Custom needs              |

**🔍 Structural Sharing Visualization:**

```
┌─────────────────────────────────────────────────────────────────┐
│  FULL CLONE vs STRUCTURAL SHARING                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  FULL CLONE (JSON.parse/stringify):                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Original Tree         Cloned Tree (ALL NEW)             │   │
│  │  ┌─────┐               ┌─────┐                           │   │
│  │  │  A  │               │  A' │  ← New reference          │   │
│  │  └──┬──┘               └──┬──┘                           │   │
│  │     │                     │                              │   │
│  │  ┌──┴──┐               ┌──┴──┐                           │   │
│  │  │  B  │               │  B' │  ← New reference          │   │
│  │  └──┬──┘               └──┬──┘                           │   │
│  │     │                     │                              │   │
│  │  ┌──┴──┐               ┌──┴──┐                           │   │
│  │  │  C  │ (changed)     │  C' │  ← Actually changed       │   │
│  │  └─────┘               └─────┘                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│  Memory: 2x (duplicates everything)                              │
│                                                                  │
│  STRUCTURAL SHARING (Immer):                                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Original Tree         New Tree (PARTIAL new)            │   │
│  │  ┌─────┐               ┌─────┐                           │   │
│  │  │  A  │        ┌──────│  A' │  ← New reference          │   │
│  │  └──┬──┘        │      └──┬──┘   (path to change)        │   │
│  │     │           │         │                              │   │
│  │  ┌──┴──┐        │      ┌──┴──┐                           │   │
│  │  │  B  │ ←──────┘      │  B' │  ← New reference          │   │
│  │  └──┬──┘               └──┬──┘   (path to change)        │   │
│  │     │                     │                              │   │
│  │  ┌──┴──┐               ┌──┴──┐                           │   │
│  │  │  C  │ (changed)     │  C' │  ← Actually changed       │   │
│  │  └─────┘               └─────┘                           │   │
│  │  Other branches SHARED (same reference)                  │   │
│  └──────────────────────────────────────────────────────────┘   │
│  Memory: Only changed path + path to root                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

### 4. Tại Sao Recursive Component?

**💬 Cách giải thích:**

> "Tree data structure tự nó là recursive — mỗi node có thể chứa children giống chính nó. Component render cũng phải recursive để mirror data shape."

**🤔 Follow-up questions:**

| Câu hỏi                                 | Trả lời                                                                                                                               |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| "Recursive component có vấn đề gì?"     | "Stack overflow nếu tree quá deep (>10K levels). Nhưng UI tree hiếm khi deep hơn 10."                                                 |
| "Tại sao không flatten rồi render?"     | "Flatten mất parent-child relationship visual. Recursion tự tạo indentation."                                                         |
| "React có limit recursion depth không?" | "Không có hard limit. Nhưng mỗi level thêm component instance → memory. 1000 levels = 1000 component instances."                      |
| "Tail-call optimization?"               | "JS engines không guarantee TCO cho recursion. Nhưng component recursion không phải function call recursion — nó tạo React elements." |
| "Base case ở đâu?"                      | "Khi node không có children. CheckboxList render input, skip recursive call."                                                         |

**🔍 Recursion Mechanics trong React:**

```
┌─────────────────────────────────────────────────────────────────┐
│  HOW RECURSIVE RENDERING WORKS                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  JSX:                                                           │
│  <CheckboxList items={data}>                                    │
│    └── <li> Electronics                                         │
│         └── <CheckboxList items={electronics.children}>         │
│              └── <li> Mobile phones                             │
│                   └── <CheckboxList items={mobile.children}>    │
│                        └── <li> iPhone (NO children → STOP)     │
│                        └── <li> Android (NO children → STOP)    │
│              └── <li> Laptops                                   │
│                   └── <CheckboxList items={laptops.children}>   │
│                        └── ...                                  │
│                                                                 │
│  VIRTUAL DOM TREE (flattened by React):                          │
│  <ul>                                                           │
│    <li>Electronics                                              │
│      <ul>                                                       │
│        <li>Mobile phones                                        │
│          <ul>                                                   │
│            <li>iPhone</li>                                      │
│            <li>Android</li>                                     │
│          </ul>                                                  │
│        </li>                                                    │
│        <li>Laptops                                              │
│          <ul>...</ul>                                           │
│        </li>                                                    │
│      </ul>                                                      │
│    </li>                                                        │
│  </ul>                                                          │
│                                                                 │
│  KEY: React flattens recursive JSX into nested DOM elements     │
│  Each <CheckboxList> is a separate component instance           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**📊 Recursive vs Iterative Rendering:**

```typescript
// RECURSIVE (natural, readable)
function CheckboxList({ items }: Props) {
  return (
    <ul>
      {items.map((item, i) => (
        <li key={item.id}>
          <CheckboxInput checked={item.checked} label={item.name} />
          {item.children && (
            <CheckboxList items={item.children} />  // ← Recursion!
          )}
        </li>
      ))}
    </ul>
  );
}

// ITERATIVE (for very deep trees, avoids stack overflow)
function CheckboxListIterative({ items }: Props) {
  // Flatten tree into array with depth info
  const flatNodes = useMemo(() => {
    const result: { item: CheckboxItem; depth: number; path: number[] }[] = [];
    const stack = items.map((item, i) => ({ item, depth: 0, path: [i] })).reverse();

    while (stack.length > 0) {
      const { item, depth, path } = stack.pop()!;
      result.push({ item, depth, path });

      if (item.children) {
        // Push children in reverse to maintain order
        for (let i = item.children.length - 1; i >= 0; i--) {
          stack.push({ item: item.children[i], depth: depth + 1, path: [...path, i] });
        }
      }
    }
    return result;
  }, [items]);

  return (
    <div>
      {flatNodes.map(({ item, depth, path }) => (
        <div key={item.id} style={{ paddingLeft: depth * 24 }}>
          <CheckboxInput checked={item.checked} label={item.name} />
        </div>
      ))}
    </div>
  );
}
```

**📊 When to use which?**

| Approach      | Use when                        | Max depth        | Semantic HTML        |
| ------------- | ------------------------------- | ---------------- | -------------------- |
| **Recursive** | Interview, normal apps          | ~100 levels safe | ✅ Nested `<ul><li>` |
| **Iterative** | Performance critical, very deep | Unlimited        | ❌ Flat `<div>`      |
| **Hybrid**    | Best of both                    | Unlimited        | ✅ With extra work   |

---

### 5. Tại Sao Bidirectional Propagation?

**💬 Cách giải thích:**

> "Checkbox tree yêu cầu 2 chiều: click parent → all children change (DOWN). Click child → parent recalculates (UP). Thiếu 1 chiều = UX bugs."

**🤔 Follow-up questions:**

| Câu hỏi                             | Trả lời                                                                                                                |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| "Tại sao không chỉ propagate DOWN?" | "User clicks child 1 of 2 → parent phải thành indeterminate. Không có UP = parent luôn sai."                           |
| "Tại sao không chỉ propagate UP?"   | "User clicks parent → expect all children checked. Không có DOWN = children không sync."                               |
| "Order matters?"                    | "Có! DOWN first (set target + descendants), rồi UP (recalculate ancestors). Ngược lại sẽ sai."                         |
| "Có thể làm trong 1 pass?"          | "Technically có nếu dùng DFS post-order. Nhưng 2 passes rõ ràng hơn, dễ debug."                                        |
| "Event propagation khác gì?"        | "DOM event bubbling/capturing là browser mechanism. Bidirectional propagation là application logic, hoàn toàn manual." |

**🔄 Propagation Algorithm Detailed:**

```
┌─────────────────────────────────────────────────────────────────┐
│  BIDIRECTIONAL PROPAGATION ALGORITHM                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  User clicks "Laptops" checkbox → checked = true                │
│                                                                 │
│  PHASE 1: DOWNWARD (updateCheckboxAndDescendants)               │
│  ─────────────────────────────────────────────────              │
│                                                                 │
│            Electronics (unchanged for now)                       │
│            /          \                                          │
│      Mobile ☐        Laptops ← TARGET                           │
│      /       \        /       \                                  │
│  iPhone ☐  Android ☐ MacBook  Surface                           │
│                       ↓        ↓                                │
│                     SET ✓    SET ✓   ← All descendants = true   │
│                                                                 │
│  After Phase 1:                                                 │
│  Laptops = ✓, MacBook = ✓, Surface = ✓                         │
│                                                                 │
│  PHASE 2: UPWARD (resolveCheckboxStates)                        │
│  ─────────────────────────────────────────────────              │
│                                                                 │
│            Electronics ← RESOLVE THIS                           │
│            /          \                                          │
│      Mobile ☐        Laptops ✓ ← Already resolved               │
│                                                                 │
│  children = [Mobile(☐), Laptops(✓)]                             │
│  allChecked = false                                             │
│  allUnchecked = false                                           │
│  → Electronics = INDETERMINATE                                  │
│                                                                 │
│  RESULT:                                                        │
│  Electronics(~), Mobile(☐), iPhone(☐), Android(☐),              │
│  Laptops(✓), MacBook(✓), Surface(✓)                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**⚠️ Common Bug — Wrong Order:**

```typescript
// ❌ WRONG: UP before DOWN
function handleCheck(checked: boolean, indices: number[]) {
  const newData = structuredClone(checkboxData);

  // Bug: resolve ancestors first, but target node hasn't changed yet!
  resolveCheckboxStates(newData[indices[0]], indices.slice(1));

  // Then update target + descendants - ancestors now have stale values!
  const node = getNodeByPath(newData, indices);
  updateCheckboxAndDescendants(node, checked);

  setCheckboxData(newData); // Ancestors are WRONG
}

// ✅ CORRECT: DOWN first, then UP
function handleCheck(checked: boolean, indices: number[]) {
  const newData = structuredClone(checkboxData);

  // Step 1: Update target + all descendants
  const node = getNodeByPath(newData, indices);
  updateCheckboxAndDescendants(node, checked);

  // Step 2: Recalculate all ancestors from bottom-up
  resolveCheckboxStates(newData[indices[0]], indices.slice(1));

  setCheckboxData(newData); // Everything consistent ✓
}
```

**📊 Propagation Complexity Analysis:**

| Operation              | Time Complexity                                | Space Complexity | Notes                             |
| ---------------------- | ---------------------------------------------- | ---------------- | --------------------------------- |
| **DOWN (descendants)** | O(d) where d = subtree size                    | O(h) call stack  | DFS through all descendants       |
| **UP (ancestors)**     | O(k × b) where k = depth, b = branching factor | O(k) call stack  | Check siblings at each level      |
| **Full update**        | O(d + k×b)                                     | O(h)             | DOWN dominates for large subtrees |
| **Best case**          | O(1)                                           | O(1)             | Click leaf with no siblings       |
| **Worst case**         | O(n)                                           | O(h)             | Click root of entire tree         |

---

### 6. Tại Sao `indeterminate` Phải Set Qua JavaScript?

**💬 Cách giải thích:**

> "HTML checkbox chỉ có 2 states: checked/unchecked. `indeterminate` là visual-only property, không có HTML attribute. Phải dùng JavaScript để set `ref.current.indeterminate = true`."

**🤔 Follow-up questions:**

| Câu hỏi                                          | Trả lời                                                                                                      |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| "Tại sao HTML không có indeterminate attribute?" | "HTML spec design choice. Checkbox là binary. Indeterminate là UI hint, không phải form value."              |
| "indeterminate affect form submission?"          | "KHÔNG! Form submit gửi checked value. indeterminate chỉ affect visual."                                     |
| "CSS selector cho indeterminate?"                | ":indeterminate pseudo-class. Dùng `input:indeterminate { ... }` để style."                                  |
| "ARIA attribute?"                                | "aria-checked='mixed' cho screen readers. Khác với DOM indeterminate property!"                              |
| "useRef vs useEffect timing?"                    | "useRef available immediately. useEffect runs after paint. Cần useEffect để set indeterminate AFTER render." |
| "useLayoutEffect thì sao?"                       | "Runs before paint. Avoid visual flash. Nhưng blocks paint → dùng useEffect trừ khi flicker xảy ra."         |

**🔍 indeterminate Property Deep Dive:**

```typescript
// The 3 states of a checkbox
const checkbox = document.querySelector('input[type="checkbox"]');

// State 1: Unchecked
checkbox.checked = false;
checkbox.indeterminate = false;
// Visual: ☐

// State 2: Checked
checkbox.checked = true;
checkbox.indeterminate = false;
// Visual: ✓

// State 3: Indeterminate (visual only!)
checkbox.checked = false; // checked value doesn't matter
checkbox.indeterminate = true;
// Visual: — (dash/minus)

// IMPORTANT:
// - indeterminate is a PROPERTY, not an ATTRIBUTE
// - <input indeterminate> does NOT work in HTML!
// - Must set via JavaScript: element.indeterminate = true
// - Form submission IGNORES indeterminate, uses checked value
```

**🔧 Implementation Patterns:**

```tsx
// Pattern 1: useEffect (standard)
function CheckboxInput({ checked }: { checked: CheckboxValue }) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = checked === "indeterminate";
    }
  }, [checked]);

  return <input ref={ref} type="checkbox" checked={checked === true} />;
}

// Pattern 2: Callback ref (no useEffect needed)
function CheckboxInput({ checked }: { checked: CheckboxValue }) {
  const setRef = useCallback(
    (el: HTMLInputElement | null) => {
      if (el) {
        el.indeterminate = checked === "indeterminate";
      }
    },
    [checked],
  );

  return <input ref={setRef} type="checkbox" checked={checked === true} />;
}

// Pattern 3: Custom hook
function useIndeterminate(checked: CheckboxValue) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = checked === "indeterminate";
    }
  }, [checked]);

  return ref;
}

// Usage
function CheckboxInput({ checked }: { checked: CheckboxValue }) {
  const ref = useIndeterminate(checked);
  return <input ref={ref} type="checkbox" checked={checked === true} />;
}
```

**📊 3 Patterns Comparison:**

| Pattern          | Pros                                      | Cons                              | Best for              |
| ---------------- | ----------------------------------------- | --------------------------------- | --------------------- |
| **useEffect**    | Standard, well-known                      | Runs after paint (possible flash) | Default choice        |
| **Callback ref** | No useEffect overhead, runs synchronously | Less familiar pattern             | Performance sensitive |
| **Custom hook**  | Reusable, clean component                 | Extra abstraction                 | Multiple checkboxes   |

**🎨 CSS for indeterminate state:**

```css
/* Basic indeterminate styling */
input[type="checkbox"]:indeterminate {
  opacity: 0.7;
}

/* Custom indeterminate icon */
.custom-checkbox input:indeterminate + .checkmark {
  background-color: #2196f3;
}

.custom-checkbox input:indeterminate + .checkmark::after {
  content: "";
  display: block;
  width: 10px;
  height: 2px;
  background: white;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  /* Dash icon instead of checkmark */
}

/* Transition between states */
.custom-checkbox .checkmark::after {
  transition: all 0.2s ease;
}
```

---

### 7. Architecture Decision Records (ADR) Summary

> 📝 **Tổng kết tất cả decisions trong bài toán:**

```
┌─────────────────────────────────────────────────────────────────┐
│  ARCHITECTURE DECISION RECORDS                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ADR-1: State at Root                                           │
│  Status: CHOSEN                                                 │
│  Reason: Bidirectional sync requires single source of truth     │
│  Alternative rejected: Local state (can't sync UP)              │
│                                                                 │
│  ADR-2: Index Path Navigation                                   │
│  Status: CHOSEN (for interview)                                 │
│  Reason: O(k) direct access, simple implementation              │
│  Alternative: ID lookup O(n), more robust for dynamic trees     │
│                                                                 │
│  ADR-3: Deep Clone (JSON.parse/stringify)                       │
│  Status: CHOSEN (for simplicity)                                │
│  Reason: No external deps, works for JSON-safe data             │
│  Alternative: Immer (production), structuredClone (modern)      │
│                                                                 │
│  ADR-4: Recursive Components                                    │
│  Status: CHOSEN                                                 │
│  Reason: Mirrors tree data structure, semantic HTML              │
│  Alternative: Iterative with flattening (perf critical)         │
│                                                                 │
│  ADR-5: useEffect for indeterminate                             │
│  Status: CHOSEN                                                 │
│  Reason: Standard pattern, well-known                           │
│  Alternative: Callback ref (no useEffect overhead)              │
│                                                                 │
│  ADR-6: Bidirectional Propagation (2 passes)                    │
│  Status: CHOSEN                                                 │
│  Reason: Clear separation of DOWN/UP, easy to debug             │
│  Alternative: Single DFS pass (complex, error-prone)            │
│                                                                 │
│  ADR-7: useState over useReducer                                │
│  Status: CHOSEN (for interview)                                 │
│  Reason: Simpler, fewer files, direct mutations after clone     │
│  Alternative: useReducer (production, predictable)              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**🎯 Interview Pro Tip:**

> Khi trình bày, mention ADR cho mỗi decision:
>
> 1. **State decision**: "I chose X **because** Y"
> 2. **Trade-off**: "The alternative is Z, but..."
> 3. **When to switch**: "In production, I'd consider..."

---

### 8. Tại Sao `key` Prop Quan Trọng Trong Recursive List?

**💬 Cách giải thích:**

> "React dùng `key` để identify list items qua re-renders. Với nested tree, wrong key = wrong state mapping, stale UI, hoặc performance issues."

**🤔 Follow-up questions:**

| Câu hỏi                          | Trả lời                                                                                            |
| -------------------------------- | -------------------------------------------------------------------------------------------------- |
| "Dùng index làm key được không?" | "Chỉ khi list static, không reorder. Dynamic list → dùng unique ID."                               |
| "key trùng thì sao?"             | "React warning, sai behavior. Sibling keys phải unique, nhưng cousins có thể trùng."               |
| "key ảnh hưởng performance?"     | "Có. Stable keys → React chỉ update changed items. Unstable keys → remount all."                   |
| "key và reconciliation?"         | "React dùng key để match old vs new elements. Same key = update. Different key = unmount + mount." |
| "Không có key thì sao?"          | "React dùng index mặc định. Warning in dev. Sai khi items reorder/delete/insert."                  |

**🔍 Key Strategies cho Tree:**

```typescript
// ❌ BAD: Index as key (breaks when tree changes)
items.map((item, index) => (
  <li key={index}>  {/* Index changes if items reorder! */}
    <CheckboxInput checked={item.checked} />
  </li>
));

// ❌ BAD: Non-unique key across siblings
items.map((item) => (
  <li key={item.name}>  {/* Names might not be unique! */}
    <CheckboxInput checked={item.checked} />
  </li>
));

// ✅ GOOD: Stable unique ID
items.map((item) => (
  <li key={item.id}>  {/* ID is unique and stable */}
    <CheckboxInput checked={item.checked} />
  </li>
));

// ✅ GOOD: Compound key for generated data
items.map((item, index) => (
  <li key={`${parentId}-${item.id}`}>  {/* Globally unique */}
    <CheckboxInput checked={item.checked} />
  </li>
));
```

**📊 Key Impact on Performance:**

```
┌─────────────────────────────────────────────────────────────────┐
│  KEY IMPACT ON RECONCILIATION                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Scenario: Delete "Mobile" from list                            │
│                                                                 │
│  WITH STABLE KEYS (item.id):                                    │
│  Before: [Electronics(1), Mobile(2), Laptops(3)]                │
│  After:  [Electronics(1), Laptops(3)]                           │
│  React: "key=2 removed, unmount it. Others unchanged."          │
│  DOM ops: 1 removal ✓                                           │
│                                                                 │
│  WITH INDEX KEYS:                                                │
│  Before: [Electronics(0), Mobile(1), Laptops(2)]                │
│  After:  [Electronics(0), Laptops(1)]                           │
│  React: "key=0 same. key=1 changed (Mobile→Laptops). key=2     │
│          removed." Updates Laptops content unnecessarily!        │
│  DOM ops: 1 update + 1 removal ✗                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### 9. Tại Sao Tách `CheckboxInput` và `CheckboxList`?

**💬 Cách giải thích:**

> "Single Responsibility Principle. `CheckboxInput` xử lý visual (indeterminate, label). `CheckboxList` xử lý structure (recursion, layout). Tách ra dễ test, dễ reuse, dễ optimize."

**🤔 Follow-up questions:**

| Câu hỏi                              | Trả lời                                                                                             |
| ------------------------------------ | --------------------------------------------------------------------------------------------------- |
| "Tại sao không 1 component làm hết?" | "Violates SRP. Component vừa handle visual vừa handle recursion → khó maintain, khó test."          |
| "Bao nhiêu components là đủ?"        | "3-4: CheckboxInput (visual), CheckboxList (recursion), Checkboxes (state), App (usage)."           |
| "Presentational vs Container?"       | "CheckboxInput = presentational (only renders). Checkboxes = container (manages state)."            |
| "React.memo cho component nào?"      | "CheckboxInput — vì nó render cho mỗi node. Memo prevents re-render khi checked unchanged."         |
| "Compound Components pattern?"       | "Có thể dùng: Checkbox.Root, Checkbox.List, Checkbox.Item. Clean API nhưng overkill for interview." |

**📊 Component Responsibility Matrix:**

```
┌─────────────────────────────────────────────────────────────────┐
│  COMPONENT RESPONSIBILITIES                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┬──────────────────────────────────────┐    │
│  │ Component         │ Responsibilities                    │    │
│  ├──────────────────┼──────────────────────────────────────┤    │
│  │ App              │ - Provide initial data               │    │
│  │                  │ - Render Checkboxes                  │    │
│  ├──────────────────┼──────────────────────────────────────┤    │
│  │ Checkboxes       │ - Own state (useState)               │    │
│  │ (Container)      │ - Handle check logic                 │    │
│  │                  │ - Deep clone before update           │    │
│  │                  │ - Pass data + handler down           │    │
│  ├──────────────────┼──────────────────────────────────────┤    │
│  │ CheckboxList     │ - Recursive rendering                │    │
│  │ (Structure)      │ - Iterate items with .map()          │    │
│  │                  │ - Build index path                   │    │
│  │                  │ - Render <ul>/<li> structure          │    │
│  ├──────────────────┼──────────────────────────────────────┤    │
│  │ CheckboxInput    │ - Render single checkbox             │    │
│  │ (Presentation)   │ - Handle indeterminate via ref       │    │
│  │                  │ - Display label                      │    │
│  │                  │ - Fire onChange callback              │    │
│  └──────────────────┴──────────────────────────────────────┘    │
│                                                                 │
│  DATA FLOW:                                                     │
│  App → Checkboxes → CheckboxList → CheckboxInput                │
│       (state)      (recursion)     (visual)                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**🧪 Testing Benefits of Separation:**

```typescript
// CheckboxInput can be tested independently
describe('CheckboxInput', () => {
  it('sets indeterminate', () => {
    render(<CheckboxInput checked="indeterminate" label="Test" />);
    const input = screen.getByRole('checkbox') as HTMLInputElement;
    expect(input.indeterminate).toBe(true);
  });

  it('shows label', () => {
    render(<CheckboxInput checked={true} label="Electronics" />);
    expect(screen.getByLabelText('Electronics')).toBeInTheDocument();
  });
});

// CheckboxList can be tested with mock data
describe('CheckboxList', () => {
  it('renders children recursively', () => {
    const data = [{ id: 1, name: 'Parent', checked: false, children: [
      { id: 2, name: 'Child', checked: false }
    ]}];
    render(<CheckboxList items={data} onCheck={jest.fn()} />);
    expect(screen.getByLabelText('Parent')).toBeInTheDocument();
    expect(screen.getByLabelText('Child')).toBeInTheDocument();
  });
});

// Isolation = easier to debug, faster tests, clearer failures
```

---

### 10. Tại Sao Dùng `every()` / `some()` Cho Parent State?

**💬 Cách giải thích:**

> "Cần xác định parent có ALL children checked, NONE checked, hoặc SOME checked. `every()` và `some()` là semantic — code reads like English."

**🤔 Follow-up questions:**

| Câu hỏi                          | Trả lời                                                                                     |
| -------------------------------- | ------------------------------------------------------------------------------------------- |
| "Tại sao không dùng `for` loop?" | "Có thể, nhưng `every`/`some` declarative hơn, short-circuit tự động, ít bug."              |
| "Short-circuit behavior?"        | "`every()` stops at first false. `some()` stops at first true. Efficient cho large arrays." |
| "reduce thì sao?"                | "1 pass thay vì 2 (`every` + `some`). Nhưng verbose hơn, dễ bug hơn."                       |
| "Performance concern?"           | "2 passes qua children array. Nhưng children thường ít (<100). Negligible."                 |
| "Functional programming?"        | "Đúng. `every`/`some` là FP primitives. Declarative > imperative cho readability."          |

**🔍 Logic Analysis:**

```typescript
// Method 1: every() + some() — CLEAR & READABLE
function resolveParentState(children: CheckboxItem[]): CheckboxValue {
  const allChecked = children.every((c) => c.checked === true);
  const allUnchecked = children.every((c) => c.checked === false);

  if (allChecked) return true;
  if (allUnchecked) return false;
  return "indeterminate";
}
// Pros: Very readable, semantic
// Cons: 2 iterations (but short-circuits!)

// Method 2: Single reduce() — ONE PASS
function resolveParentState(children: CheckboxItem[]): CheckboxValue {
  const { checkedCount, total } = children.reduce(
    (acc, child) => ({
      checkedCount: acc.checkedCount + (child.checked === true ? 1 : 0),
      total: acc.total + 1,
    }),
    { checkedCount: 0, total: 0 },
  );

  if (checkedCount === total) return true;
  if (checkedCount === 0) return false;
  return "indeterminate";
}
// Pros: Single iteration
// Cons: More verbose, harder to read

// Method 3: for loop — EARLY EXIT
function resolveParentState(children: CheckboxItem[]): CheckboxValue {
  let hasChecked = false;
  let hasUnchecked = false;

  for (const child of children) {
    if (child.checked === true) hasChecked = true;
    else hasUnchecked = true;

    // Early exit: if both found, must be indeterminate
    if (hasChecked && hasUnchecked) return "indeterminate";
  }

  return hasChecked ? true : false;
}
// Pros: Single pass + earliest possible exit
// Cons: Imperative, more variables

// RECOMMENDATION for interview: Method 1 (every/some)
// RECOMMENDATION for production: Method 3 (for loop) if performance matters
```

**📊 Performance Comparison (100 children):**

| Method                | Best case                | Worst case            | Readability |
| --------------------- | ------------------------ | --------------------- | ----------- |
| `every`+`every`       | O(1) first child differs | O(2n) all same        | ⭐⭐⭐⭐⭐  |
| `reduce`              | O(n) always full scan    | O(n) always full scan | ⭐⭐⭐      |
| `for` loop early exit | O(2) first two differ    | O(n) all same         | ⭐⭐⭐⭐    |

---

### 11. Tại Sao `ReadonlyArray` Trong Props?

**💬 Cách giải thích:**

> "ReadonlyArray signals intent — component nhận props nhưng KHÔNG ĐƯỢC modify. TypeScript enforces này tại compile time. Prevents accidental mutation."

**🤔 Follow-up questions:**

| Câu hỏi                         | Trả lời                                                                                           |
| ------------------------------- | ------------------------------------------------------------------------------------------------- |
| "ReadonlyArray vs Array?"       | "ReadonlyArray không có push, pop, splice, etc. Chỉ có readonly methods (map, filter, forEach)."  |
| "Runtime enforcement?"          | "KHÔNG. Chỉ TypeScript compile-time. Runtime vẫn là normal array."                                |
| "const vs ReadonlyArray?"       | "const prevents reassignment. ReadonlyArray prevents mutation. Cả hai cần cho deep immutability." |
| "Readonly<T> vs ReadonlyArray?" | "Readonly<T> makes all properties readonly (shallow). ReadonlyArray chỉ cho arrays."              |
| "Performance benefit?"          | "Không có runtime benefit. Chỉ DX — catch bugs sớm hơn."                                          |

**🔍 Immutability Levels in TypeScript:**

```typescript
// Level 1: const (reassignment protection only)
const arr = [1, 2, 3];
arr = [4, 5, 6]; // ❌ Error: Cannot assign
arr.push(4); // ✅ Works! const doesn't prevent mutation!

// Level 2: ReadonlyArray (mutation protection)
const arr: ReadonlyArray<number> = [1, 2, 3];
arr.push(4); // ❌ Error: push doesn't exist on ReadonlyArray
arr[0] = 5; // ❌ Error: Index signature only permits reading
arr.map((x) => x); // ✅ Works! Non-mutating methods allowed

// Level 3: readonly keyword (shorthand syntax)
const arr: readonly number[] = [1, 2, 3];
// Same as ReadonlyArray<number>

// Level 4: Readonly<T> for objects (shallow)
interface Props {
  items: ReadonlyArray<CheckboxItem>;
  onCheck: (value: boolean, indices: ReadonlyArray<number>) => void;
}
// items cannot be mutated
// indices cannot be mutated
// But CheckboxItem internal properties CAN still be mutated!

// Level 5: Deep Readonly (full protection)
type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

type ImmutableCheckboxItem = DeepReadonly<CheckboxItem>;
// Now NOTHING can be mutated at any level
```

**📊 When to use which:**

| Level              | Protection                | Use when                    |
| ------------------ | ------------------------- | --------------------------- |
| `const`            | Reassignment only         | Local variables             |
| `ReadonlyArray<T>` | Array mutation            | Props, function params      |
| `Readonly<T>`      | Object mutation (shallow) | Props, return types         |
| `DeepReadonly<T>`  | Everything (deep)         | Critical data, shared state |
| `as const`         | Literal types + readonly  | Constants, enums            |

---

### 12. Tại Sao Separation of Concerns Trong State Update?

**💬 Cách giải thích:**

> "State update tách thành 3 phases rõ ràng: Clone → Mutate → Set. Mỗi phase có responsibility riêng. Dễ debug, dễ test, dễ swap implementation."

**🤔 Follow-up questions:**

| Câu hỏi                         | Trả lời                                                                                                   |
| ------------------------------- | --------------------------------------------------------------------------------------------------------- |
| "Tại sao không inline tất cả?"  | "Spaghetti code. Khó debug khi có bug. Mỗi phase có thể test independently."                              |
| "Pure functions benefits?"      | "`updateCheckboxAndDescendants` và `resolveCheckboxStates` là pure — cùng input, cùng output. Easy test." |
| "Có extract thành custom hook?" | "Có! `useCheckboxTree` encapsulate toàn bộ logic. Component chỉ render."                                  |
| "Command pattern?"              | "Mỗi action (check, uncheck, checkAll) có thể là separate command. Good for undo/redo."                   |

**🔍 3-Phase Update Pattern:**

```typescript
// PHASE 1: CLONE (Immutability)
const newData = structuredClone(checkboxData);

// PHASE 2: MUTATE (Business Logic)
const node = getNodeByPath(newData, indices);
updateCheckboxAndDescendants(node, checked); // DOWN
resolveCheckboxStates(newData[indices[0]], indices.slice(1)); // UP

// PHASE 3: SET (React Integration)
setCheckboxData(newData); // Trigger re-render
```

```
┌─────────────────────────────────────────────────────────────────┐
│  3-PHASE UPDATE PATTERN                                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────┐     ┌──────────┐     ┌─────────┐                  │
│  │  CLONE  │ ──→ │  MUTATE  │ ──→ │  SET    │                  │
│  └─────────┘     └──────────┘     └─────────┘                  │
│  │ Purpose:│     │ Purpose: │     │ Purpose:│                  │
│  │ Protect │     │ Business │     │ Trigger │                  │
│  │ old ref │     │ logic    │     │ render  │                  │
│  │         │     │          │     │         │                  │
│  │ Can swap│     │ Can swap │     │ Always  │                  │
│  │ impl:   │     │ impl:    │     │ setState│                  │
│  │ -JSON   │     │ -manual  │     │         │                  │
│  │ -struct │     │ -immer   │     │         │                  │
│  │ -immer  │     │ -fp-ts   │     │         │                  │
│  └─────────┘     └──────────┘     └─────────┘                  │
│                                                                 │
│  KEY INSIGHT: Each phase is independently testable              │
│  and independently swappable                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**🧪 Testing each phase independently:**

```typescript
// Test CLONE phase
test("clone creates independent copy", () => {
  const original = [{ id: 1, checked: false }];
  const cloned = structuredClone(original);
  cloned[0].checked = true;
  expect(original[0].checked).toBe(false); // Original unchanged
});

// Test MUTATE phase (pure functions)
test("updateCheckboxAndDescendants sets all descendants", () => {
  const node = {
    id: 1,
    checked: false,
    children: [
      { id: 2, checked: false, children: [{ id: 3, checked: false }] },
    ],
  };
  updateCheckboxAndDescendants(node, true);
  expect(node.checked).toBe(true);
  expect(node.children[0].checked).toBe(true);
  expect(node.children[0].children[0].checked).toBe(true);
});

// Test SET phase (React behavior)
test("setState triggers re-render with new reference", () => {
  const { result } = renderHook(() => {
    const [data, setData] = useState([{ id: 1, checked: false }]);
    return { data, setData };
  });

  act(() => {
    const newData = structuredClone(result.current.data);
    newData[0].checked = true;
    result.current.setData(newData);
  });

  expect(result.current.data[0].checked).toBe(true);
});
```

---

### 13. Tại Sao `useCallback` Cho Event Handlers?

**💬 Cách giải thích:**

> "Mỗi render tạo function mới. Nếu pass function làm prop cho `React.memo` component, memo bị phá vỡ vì function reference thay đổi. `useCallback` giữ stable reference."

**🤔 Follow-up questions:**

| Câu hỏi                     | Trả lời                                                                                                               |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| "useCallback luôn cần?"     | "KHÔNG. Chỉ khi function pass to memoized child. Nếu child không memo, useCallback thừa."                             |
| "useCallback vs useMemo?"   | "`useCallback(fn, deps)` = `useMemo(() => fn, deps)`. useCallback là shorthand cho memoize function."                 |
| "Empty dependency array?"   | "Function never recreated. Chỉ an toàn nếu không dùng state/props bên trong (hoặc dùng functional update)."           |
| "Closure trap?"             | "useCallback với deps cũ = stale closure. Function capture old values. Giải pháp: dùng ref hoặc functional setState." |
| "Performance gain thực sự?" | "Measure first! Premature optimization = evil. Chỉ cần khi profiler cho thấy re-renders là bottleneck."               |

**🔍 useCallback Patterns:**

```tsx
// ❌ WITHOUT useCallback: New function every render
function Checkboxes() {
  const [data, setData] = useState(initialData);

  // This creates a NEW function on every render
  const handleCheck = (checked: boolean, indices: number[]) => {
    const newData = structuredClone(data);
    // ... update logic
    setData(newData);
  };

  // Even though CheckboxList is memoized,
  // it re-renders because handleCheck is a new reference!
  return <MemoizedCheckboxList items={data} onCheck={handleCheck} />;
}

// ✅ WITH useCallback: Stable reference
function Checkboxes() {
  const [data, setData] = useState(initialData);

  const handleCheck = useCallback((checked: boolean, indices: number[]) => {
    // ⚠️ Use functional update to avoid stale closure
    setData((prevData) => {
      const newData = structuredClone(prevData);
      const node = getNodeByPath(newData, indices);
      updateCheckboxAndDescendants(node, checked);
      resolveCheckboxStates(newData[indices[0]], indices.slice(1));
      return newData;
    });
  }, []); // Empty deps: safe because using functional update

  return <MemoizedCheckboxList items={data} onCheck={handleCheck} />;
}
```

**⚠️ Stale Closure Trap:**

```tsx
// ❌ STALE CLOSURE BUG
const handleCheck = useCallback((checked: boolean, indices: number[]) => {
  const newData = structuredClone(data); // ← `data` is stale!
  // ... update logic
  setData(newData);
}, []); // Empty deps nhưng dùng `data` trực tiếp

// Lần đầu click: OK (data = initial)
// Lần thứ 2: `data` vẫn là initial → mất lần click đầu!

// ✅ FIX 1: Functional update (recommended)
const handleCheck = useCallback((checked, indices) => {
  setData((prev) => {
    /* clone prev, not data */
  });
}, []);

// ✅ FIX 2: useRef to hold latest data
const dataRef = useRef(data);
dataRef.current = data; // Always fresh

const handleCheck = useCallback((checked, indices) => {
  const newData = structuredClone(dataRef.current); // Always latest
  // ...
}, []);
```

**📊 When to useCallback:**

```
┌─────────────────────────────────────────────────────────────────┐
│  DECISION TREE: SHOULD I useCallback?                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Is the function passed as prop?                                 │
│  ├── NO → Don't useCallback ❌                                  │
│  └── YES                                                        │
│       └── Is the receiving component memoized (React.memo)?      │
│            ├── NO → Don't useCallback ❌ (memo needed first)     │
│            └── YES                                               │
│                 └── Is re-render expensive?                      │
│                      ├── NO → Don't useCallback ❌ (premature)   │
│                      └── YES → USE useCallback ✅                │
│                                                                 │
│  RULE: useCallback alone does NOTHING.                           │
│  It ONLY helps when paired with React.memo.                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### 14. Tại Sao `onChange` Thay Vì `onClick` Cho Checkbox?

**💬 Cách giải thích:**

> "`onChange` là semantic event cho form elements. `onClick` fire cho bất kỳ click nào (label, container). `onChange` chỉ fire khi value thực sự thay đổi."

**🤔 Follow-up questions:**

| Câu hỏi                                  | Trả lời                                                                                                      |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| "onClick cũng work, tại sao không dùng?" | "onClick fire trên label click VÀ input click. Nếu label wrap input thì trigger 2 lần!"                      |
| "React onChange khác native onchange?"   | "Có! React onChange fire mỗi keystroke. Native onchange fire khi blur. React is more predictable."           |
| "onInput thì sao?"                       | "onInput là native equivalent of React onChange. Nhưng React community dùng onChange by convention."         |
| "Synthetic events?"                      | "React wraps native events. Normalized cross-browser. Pooled for performance (pre-React 17)."                |
| "Event delegation?"                      | "React mounts 1 listener at root (React 17+). Delegates to correct handler. Efficient cho 1000+ checkboxes." |

**🔍 Event Handling Deep Dive:**

```tsx
// ❌ WRONG: onClick on checkbox can double-fire
<label onClick={handleClick}>  {/* Click label = fires here */}
  <input type="checkbox" onClick={handleClick} />  {/* AND here! */}
  Electronics
</label>
// Result: handleClick called TWICE!

// ✅ CORRECT: onChange on input only
<label>
  <input type="checkbox" onChange={(e) => onCheck(e.target.checked, indices)} />
  Electronics
</label>
// Result: onChange called ONCE regardless of click location

// Alternative: onClick with stopPropagation (messy)
<label>
  <input
    type="checkbox"
    onClick={(e) => {
      e.stopPropagation();
      onCheck((e.target as HTMLInputElement).checked, indices);
    }}
  />
  Electronics
</label>
// Works but more verbose and less semantic
```

**📊 onChange vs onClick vs onInput:**

| Event      | Fires when             | Use for          | Checkbox behavior           |
| ---------- | ---------------------- | ---------------- | --------------------------- |
| `onChange` | Value changes          | Form elements ✅ | Once per toggle             |
| `onClick`  | Element clicked        | Buttons, links   | Can double-fire with label! |
| `onInput`  | Value changes (native) | Text inputs      | Not standard for checkbox   |

---

### 15. Tại Sao Unidirectional Data Flow?

**💬 Cách giải thích:**

> "React follows one-way data flow: data flows DOWN via props, events flow UP via callbacks. Predictable, debuggable. Two-way binding (Angular style) hides complexity."

**🤔 Follow-up questions:**

| Câu hỏi                      | Trả lời                                                                                           |
| ---------------------------- | ------------------------------------------------------------------------------------------------- |
| "Two-way binding dễ hơn mà?" | "Dễ cho simple cases. Cho complex tree: không biết ai thay đổi gì, khi nào. Debugging nightmare." |
| "v-model (Vue) thì sao?"     | "v-model là syntactic sugar cho :value + @input. Vẫn unidirectional nhưng trông bidirectional."   |
| "React có two-way binding?"  | "Không built-in. Controlled components = manual binding. Libraries như Formik làm nó dễ hơn."     |
| "Flux/Redux pattern?"        | "Cùng principle: Action → Dispatcher → Store → View. One-way circle."                             |
| "Bài toán này thì sao?"      | "Data (tree) flows DOWN. Click events (onCheck) flow UP. State change tại root, re-renders down." |

**🔍 Data Flow Visualization:**

```
┌─────────────────────────────────────────────────────────────────┐
│  UNIDIRECTIONAL DATA FLOW IN NESTED CHECKBOXES                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐                                               │
│  │  Checkboxes   │ ← STATE OWNER                                │
│  │  [data, setData] │                                           │
│  └──────┬───────┘                                               │
│         │                                                       │
│    ┌────┴────┐  DATA (props) flows DOWN ↓                       │
│    │         │                                                  │
│    ▼         │                                                  │
│  ┌──────────────┐                                               │
│  │ CheckboxList  │                                               │
│  │ (items, onCheck) │                                           │
│  └──────┬───────┘                                               │
│         │                                                       │
│    ┌────┴────┐  DATA (props) flows DOWN ↓                       │
│    │         │                                                  │
│    ▼         ▼                                                  │
│  ┌──────────────┐  ┌──────────────┐                              │
│  │ CheckboxInput │  │ CheckboxList │ (recursive)                 │
│  │ (checked,     │  │ (items,      │                            │
│  │  onChange)     │  │  onCheck)    │                            │
│  └──────┬───────┘  └──────────────┘                              │
│         │                                                       │
│    EVENTS (callbacks) flow UP ↑                                  │
│         │                                                       │
│    onChange(e) → onCheck(checked, indices)                       │
│         │                                                       │
│    ┌────┴────┐                                                  │
│    │ Bubbles up to Checkboxes                                   │
│    │ → setData(newData)                                         │
│    │ → Re-render flows DOWN again                               │
│    └─────────┘                                                  │
│                                                                 │
│  ONE-WAY CIRCLE:                                                │
│  State → Props → Render → User Action → Callback → State       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**📊 One-Way vs Two-Way Binding:**

| Aspect             | One-Way (React)                   | Two-Way (Angular)             |
| ------------------ | --------------------------------- | ----------------------------- |
| **Data flow**      | Explicit (props down, events up)  | Implicit (ngModel)            |
| **Debugging**      | Easy — follow the prop chain      | Hard — who changed the value? |
| **Boilerplate**    | More code (onChange handler)      | Less code (ngModel syntax)    |
| **Predictability** | High — state changes are explicit | Lower — hidden updates        |
| **Complex trees**  | Clear hierarchy                   | Binding chaos                 |
| **DevTools**       | Excellent (React DevTools)        | Good but less clear flow      |

---

### 16. Tại Sao `slice()` Cho Path Manipulation?

**💬 Cách giải thích:**

> "`indices.slice(1)` tạo new array bỏ element đầu tiên. Mỗi level recursion xử lý index đầu, pass phần còn lại xuống. Giống peeling an onion — mỗi layer xử lý 1 level."

**🤔 Follow-up questions:**

| Câu hỏi                              | Trả lời                                                                                      |
| ------------------------------------ | -------------------------------------------------------------------------------------------- |
| "Tại sao slice thay vì shift?"       | "shift mutates original array! slice returns new array. Immutability principle."             |
| "slice(1) complexity?"               | "O(k) cho k = remaining elements. Creates new array mỗi call."                               |
| "Có cách nào avoid creating arrays?" | "Dùng offset index thay vì slice: `fn(indices, depth)` traverse bằng `indices[depth]`."      |
| "Spread thay slice?"                 | "`const [first, ...rest] = indices`. Same result, destructuring syntax. Cũng tạo new array." |
| "Performance concern?"               | "slice tạo new array mỗi recursive call. Cho depth 10 = 10 arrays. Negligible."              |

**🔍 Path Manipulation Patterns:**

```typescript
// Pattern 1: slice() — INTERVIEW STANDARD
function resolveCheckboxStates(node: CheckboxItem, indices: number[]) {
  if (indices.length > 0 && node.children) {
    resolveCheckboxStates(
      node.children[indices[0]], // Current level's child
      indices.slice(1), // Remaining path
    );
  }
  // Resolve current node...
}

// Pattern 2: Destructuring — CLEANER SYNTAX
function resolveCheckboxStates(node: CheckboxItem, [first, ...rest]: number[]) {
  if (first !== undefined && node.children) {
    resolveCheckboxStates(node.children[first], rest);
  }
  // Resolve current node...
}

// Pattern 3: Offset index — ZERO ALLOCATION
function resolveCheckboxStates(
  node: CheckboxItem,
  indices: number[],
  depth = 0,
) {
  if (depth < indices.length && node.children) {
    resolveCheckboxStates(node.children[indices[depth]], indices, depth + 1);
  }
  // Resolve current node...
}
// ✅ No new arrays created! Best for performance.
```

**📊 Pattern Comparison:**

| Pattern            | New arrays?     | Readability | Performance   | Best for             |
| ------------------ | --------------- | ----------- | ------------- | -------------------- |
| `slice(1)`         | Yes, every call | ⭐⭐⭐⭐⭐  | O(k) per call | Interview            |
| `[first, ...rest]` | Yes, every call | ⭐⭐⭐⭐⭐  | O(k) per call | Modern code          |
| Offset index       | No allocations  | ⭐⭐⭐      | O(1) per call | Performance critical |

**🔍 Tracing slice through recursion:**

```
┌─────────────────────────────────────────────────────────────────┐
│  PATH TRAVERSAL: User clicks node at [0, 1, 2]                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Call 1: resolveCheckboxStates(root[0], [1, 2])                 │
│          → Navigate to child at index 0                         │
│          → Pass remaining path [1, 2]                           │
│                                                                 │
│  Call 2: resolveCheckboxStates(child_0.children[1], [2])        │
│          → Navigate to child at index 1                         │
│          → Pass remaining path [2]                              │
│                                                                 │
│  Call 3: resolveCheckboxStates(child_0_1.children[2], [])       │
│          → Navigate to child at index 2                         │
│          → Pass remaining path [] (empty = BASE CASE)           │
│                                                                 │
│  UNWIND: Now resolve states bottom-up                           │
│  Call 3 resolves → Call 2 resolves → Call 1 resolves            │
│                                                                 │
│  EACH LEVEL:                                                    │
│  1. Go deeper (if path remaining)                               │
│  2. After return, check own children's states                   │
│  3. Set own state (true/false/indeterminate)                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### 17. Tại Sao Controlled Component Cho Checkbox?

**💬 Cách giải thích:**

> "Controlled component = React owns the truth. State nằm trong React, DOM chỉ reflect state. Nếu uncontrolled, React và DOM có thể out of sync — đặc biệt nguy hiểm cho tree."

**🤔 Follow-up questions:**

| Câu hỏi                                         | Trả lời                                                                                                 |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| "Controlled vs Uncontrolled khác nhau thế nào?" | "Controlled: value via props + onChange handler. Uncontrolled: value via DOM + useRef."                 |
| "defaultChecked thì sao?"                       | "defaultChecked = uncontrolled. Chỉ set initial value. React không track thay đổi."                     |
| "Khi nào dùng uncontrolled?"                    | "Simple form, file input, hoặc integration với non-React library. Nested checkbox = controlled always." |
| "Performance concern?"                          | "Controlled re-renders mỗi change. Uncontrolled không re-render. Nhưng tree cần re-render để sync!"     |
| "Mixed controlled/uncontrolled?"                | "Anti-pattern! React warning. Đừng switch between controlled and uncontrolled."                         |

**🔍 Controlled vs Uncontrolled Demo:**

```tsx
// ❌ UNCONTROLLED: React doesn't know checkbox state
function UncontrolledCheckbox({ label }: { label: string }) {
  const ref = useRef<HTMLInputElement>(null);

  const getChecked = () => ref.current?.checked;
  // Problem: parent cannot know checked state!
  // Problem: cannot sync with siblings/parent checkbox!

  return (
    <label>
      <input type="checkbox" ref={ref} defaultChecked={false} />
      {label}
    </label>
  );
}

// ✅ CONTROLLED: React is the source of truth
function ControlledCheckbox({ checked, onChange, label }: Props) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = checked === "indeterminate";
    }
  }, [checked]);

  return (
    <label>
      <input
        ref={ref}
        type="checkbox"
        checked={checked === true}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  );
}
// Parent controls state → can sync entire tree
```

**📊 Controlled vs Uncontrolled:**

```
┌─────────────────────────────────────────────────────────────────┐
│  CONTROLLED vs UNCONTROLLED COMPONENTS                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  CONTROLLED:                                                    │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐                │
│  │  React   │────→│   DOM    │     │   User   │                │
│  │  State   │     │ (mirror) │←────│  (click) │                │
│  │ checked  │←────│          │     │          │                │
│  └──────────┘     └──────────┘     └──────────┘                │
│  Flow: User → onChange → setState → re-render → DOM updates     │
│  React ALWAYS knows current value ✅                            │
│                                                                 │
│  UNCONTROLLED:                                                  │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐                │
│  │  React   │     │   DOM    │     │   User   │                │
│  │  (???)   │     │  owns    │←────│  (click) │                │
│  │          │     │  value   │     │          │                │
│  └──────────┘     └──────────┘     └──────────┘                │
│  Flow: User → DOM updates directly → React doesn't know!       │
│  React CAN'T sync tree ❌                                       │
│                                                                 │
│  FOR NESTED CHECKBOX: MUST use controlled                       │
│  Because parent needs to know children's state                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### 18. Tại Sao TypeScript Union Type `CheckboxValue`?

**💬 Cách giải thích:**

> "Checkbox có 3 trạng thái: true, false, 'indeterminate'. TypeScript union type `boolean | 'indeterminate'` captures exactly these 3 possibilities. No more, no less."

**🤔 Follow-up questions:**

| Câu hỏi                             | Trả lời                                                                                                    |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------- | --------------------------------------------------------- |
| "Tại sao không dùng enum?"          | "Enum có runtime cost (JS object). Union type là type-level only — zero runtime overhead."                 |
| "null/undefined cho indeterminate?" | "Semantic sai. null = 'no value'. undefined = 'not set'. 'indeterminate' rõ ràng hơn."                     |
| "Number (0, 1, 2)?"                 | "No! Magic numbers = unreadable. `checked: 2` không ai hiểu. `checked: 'indeterminate'` self-documenting." |
| "Type narrowing?"                   | "TS auto-narrows: `if (checked === true)` thì trong block, TS biết checked là boolean."                    |
| "Discriminated union?"              | "Có thể: `{type: 'checked'}                                                                                | {type: 'unchecked'} | {type: 'indeterminate'}`. Nhưng overkill cho 1 property." |

**🔍 Type Design Options:**

```typescript
// ❌ Option 1: Boolean only — CAN'T represent indeterminate
type CheckboxValue = boolean;
// Fails: no way to express "some children checked"

// ❌ Option 2: Enum — runtime overhead
enum CheckboxState {
  CHECKED = "CHECKED",
  UNCHECKED = "UNCHECKED",
  INDETERMINATE = "INDETERMINATE",
}
// Compiles to JS object. Overkill for 3 values.

// ❌ Option 3: Number — unreadable
type CheckboxValue = 0 | 1 | 2;
// if (checked === 2) → what does 2 mean?!

// ❌ Option 4: Nullable — semantic confusion
type CheckboxValue = boolean | null;
// null means "no value", not "partially checked"

// ✅ Option 5: Union type — PERFECT
type CheckboxValue = boolean | "indeterminate";
// - true = checked    ✓
// - false = unchecked  ☐
// - 'indeterminate' = partially checked  —
// Zero runtime cost. Self-documenting. Type-safe.

// Usage with type narrowing:
function getCheckboxIcon(value: CheckboxValue): string {
  if (value === true) return "✓"; // TS knows: boolean (true)
  if (value === false) return "☐"; // TS knows: boolean (false)
  return "—"; // TS knows: 'indeterminate'
}

// Exhaustive check with never:
function assertNever(x: never): never {
  throw new Error(`Unexpected value: ${x}`);
}

function handleCheckboxValue(value: CheckboxValue) {
  switch (value) {
    case true:
      return "checked";
    case false:
      return "unchecked";
    case "indeterminate":
      return "mixed";
    default:
      return assertNever(value); // TS error if case missed!
  }
}
```

**📊 Type Design Comparison:**

| Approach                     | Runtime cost | Readability | Type safety              | Recommended |
| ---------------------------- | ------------ | ----------- | ------------------------ | ----------- |
| `boolean` only               | None         | ⭐⭐⭐      | ❌ Can't model 3rd state | No          |
| `enum`                       | JS object    | ⭐⭐⭐⭐    | ✅ Full                  | Overkill    |
| `number`                     | None         | ⭐          | ❌ Magic numbers         | No          |
| `boolean \| null`            | None         | ⭐⭐        | ⚠️ Semantic mismatch     | No          |
| `boolean \| 'indeterminate'` | None         | ⭐⭐⭐⭐⭐  | ✅ Perfect               | **Yes**     |

---

### 19. Tại Sao `React.memo` Cho CheckboxInput?

**💬 Cách giải thích:**

> "Tree with 1000 nodes = 1000 `CheckboxInput` instances. Click 1 checkbox → `setData` → toàn bộ tree re-renders. `React.memo` skips re-render cho nodes có props unchanged."

**🤔 Follow-up questions:**

| Câu hỏi                           | Trả lời                                                                                             |
| --------------------------------- | --------------------------------------------------------------------------------------------------- |
| "React.memo có cost?"             | "Có! Shallow comparison mỗi render. Nếu props luôn thay đổi, memo = wasted comparison."             |
| "Shallow comparison cho objects?" | "Chỉ compare reference, không compare deep values. Vì vậy cần stable references."                   |
| "Custom comparator?"              | "`React.memo(Component, areEqual)`. areEqual nhận prevProps, nextProps. Return true = skip render." |
| "memo vs useMemo?"                | "React.memo = component level. useMemo = value level. Khác hoàn toàn."                              |
| "React Compiler (React 19)?"      | "Auto-memoization. Không cần React.memo/useMemo/useCallback. Nhưng chưa stable 100%."               |

**🔍 React.memo Implementation:**

```tsx
// Without memo: EVERY checkbox re-renders on ANY change
function CheckboxInput({ checked, label, onChange }: Props) {
  console.log(`Rendering: ${label}`); // Logs for ALL 1000 nodes!

  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = checked === "indeterminate";
    }
  }, [checked]);

  return (
    <label>
      <input
        ref={ref}
        type="checkbox"
        checked={checked === true}
        onChange={onChange}
      />
      {label}
    </label>
  );
}

// With memo: Only changed checkboxes re-render
const MemoizedCheckboxInput = React.memo(CheckboxInput);
// Click 1 checkbox → only affected path re-renders (5-10 components)
// Instead of all 1000!

// Custom comparator for fine-grained control
const OptimizedCheckboxInput = React.memo(CheckboxInput, (prev, next) => {
  // Return true if props are "equal" (skip render)
  return prev.checked === next.checked && prev.label === next.label;
  // Intentionally ignore onChange — it's stable via useCallback
});
```

**📊 Performance Impact:**

```
┌─────────────────────────────────────────────────────────────────┐
│  React.memo PERFORMANCE IMPACT (1000 nodes)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  WITHOUT memo:                                                  │
│  Click checkbox → setData → 1000 components render              │
│  Time: ~16ms (barely within 16ms frame budget)                  │
│                                                                 │
│  WITH memo (no useCallback):                                    │
│  Click checkbox → setData → 1000 memo checks BUT               │
│  onChange is new reference → ALL still re-render!                │
│  Time: ~18ms (WORSE! memo comparison overhead!)                 │
│                                                                 │
│  WITH memo + useCallback:                                       │
│  Click checkbox → setData → 1000 memo checks                   │
│  Only ~5-10 changed nodes re-render                             │
│  Time: ~3ms ✅                                                  │
│                                                                 │
│  LESSON: React.memo alone is NOT enough!                        │
│  Must combine with stable props (useCallback, useMemo)          │
│                                                                 │
│  ┌────────────────────────────────────────────────────┐         │
│  │  OPTIMIZATION STACK:                                │         │
│  │  1. React.memo on CheckboxInput ← component level  │         │
│  │  2. useCallback on handleCheck ← function stability │         │
│  │  3. Stable data references ← structural sharing     │         │
│  │  All 3 needed for full optimization!                │         │
│  └────────────────────────────────────────────────────┘         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### 20. Tại Sao Virtualization Cho Large Trees?

**💬 Cách giải thích:**

> "DOM nodes are expensive. 10,000 checkboxes = 10,000+ DOM elements. Browser lags. Virtualization chỉ render visible items (~50), swap khi scroll. O(visible) thay vì O(total)."

**🤔 Follow-up questions:**

| Câu hỏi                              | Trả lời                                                                                       |
| ------------------------------------ | --------------------------------------------------------------------------------------------- |
| "Khi nào cần virtualization?"        | ">500 visible nodes. Dưới 500, DOM handles fine. Measure trước!"                              |
| "react-window vs react-virtualized?" | "react-window nhẹ hơn (6KB vs 30KB). Đủ cho most cases. Virtualized có thêm features."        |
| "Tree virtualization khó hơn list?"  | "Đúng! Tree có variable depth, expand/collapse. Cần flatten thành list rồi virtualize."       |
| "Accessibility impact?"              | "Screen readers chỉ thấy visible items. Cần aria-rowcount, aria-rowindex cho full tree info." |
| "tanstack/react-virtual?"            | "Modern, headless. No DOM opinions. Best choice hiện tại. Headless = full control."           |

**🔍 Virtualization Architecture:**

```
┌─────────────────────────────────────────────────────────────────┐
│  VIRTUALIZATION FOR LARGE TREES                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  WITHOUT VIRTUALIZATION (10,000 nodes):                         │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  DOM: 10,000+ elements loaded                            │   │
│  │  ┌──┐┌──┐┌──┐┌──┐┌──┐┌──┐...┌──┐┌──┐┌──┐┌──┐           │   │
│  │  │  ││  ││  ││  ││  ││  │   │  ││  ││  ││  │           │   │
│  │  └──┘└──┘└──┘└──┘└──┘└──┘...└──┘└──┘└──┘└──┘           │   │
│  │  Memory: ~50MB   Paint: ~100ms   Scroll: janky           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  WITH VIRTUALIZATION:                                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  ┌ Viewport (visible area) ─────────────────────────┐    │   │
│  │  │  ┌──┐┌──┐┌──┐┌──┐┌──┐  ← Only ~20 items in DOM  │    │   │
│  │  │  │  ││  ││  ││  ││  │                             │    │   │
│  │  │  └──┘└──┘└──┘└──┘└──┘                             │    │   │
│  │  └───────────────────────────────────────────────────┘    │   │
│  │  ↑ Spacer (calculated height for items above)            │   │
│  │  ↓ Spacer (calculated height for items below)            │   │
│  │  Memory: ~5MB   Paint: ~5ms   Scroll: smooth 60fps       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  KEY CONCEPT: Only render what user CAN SEE                     │
│  Recycle DOM elements as user scrolls                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**🔧 Implementation with @tanstack/react-virtual:**

```tsx
import { useVirtualizer } from "@tanstack/react-virtual";

function VirtualizedCheckboxTree({ items }: { items: CheckboxItem[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  // Flatten tree for virtualization
  const flatNodes = useMemo(() => {
    const result: FlatNode[] = [];
    const flatten = (nodes: CheckboxItem[], depth: number, path: number[]) => {
      nodes.forEach((node, i) => {
        const currentPath = [...path, i];
        result.push({ item: node, depth, path: currentPath });
        if (node.children && node.expanded) {
          flatten(node.children, depth + 1, currentPath);
        }
      });
    };
    flatten(items, 0, []);
    return result;
  }, [items]);

  const virtualizer = useVirtualizer({
    count: flatNodes.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 32, // Estimated row height
    overscan: 5, // Render 5 extra items above/below viewport
  });

  return (
    <div ref={parentRef} style={{ height: "400px", overflow: "auto" }}>
      <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const { item, depth, path } = flatNodes[virtualRow.index];
          return (
            <div
              key={item.id}
              style={{
                position: "absolute",
                top: virtualRow.start,
                height: virtualRow.size,
                paddingLeft: depth * 24,
              }}
            >
              <CheckboxInput
                checked={item.checked}
                label={item.name}
                onChange={(checked) => onCheck(checked, path)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

**📊 Performance Benchmarks:**

| Nodes   | Without Virtual | With Virtual | Improvement |
| ------- | --------------- | ------------ | ----------- |
| 100     | 5ms             | 5ms          | None needed |
| 1,000   | 45ms            | 6ms          | **7.5x**    |
| 10,000  | 450ms+ ⚠️       | 7ms          | **64x**     |
| 100,000 | 💀 Crash        | 8ms          | ∞           |

| Metric         | Without     | With                         |
| -------------- | ----------- | ---------------------------- |
| DOM Elements   | All N       | ~20-50                       |
| Memory         | O(n)        | O(visible)                   |
| Initial Render | O(n)        | O(visible)                   |
| Scroll Paint   | O(n)        | O(1)                         |
| Trade-off      | Simple code | Complex code + flatten logic |

---

### 21. Tại Sao Event Delegation Quan Trọng?

**💬 Interview answer:**

> "Thay vì mỗi checkbox gắn riêng event handler, ta có thể dùng event delegation — gắn 1 handler ở parent, dùng `event.target` để xác định node nào được click. Giảm memory footprint từ O(n) xuống O(1) handlers."

**📖 Giải thích chi tiết:**

Trong React, mỗi `onChange` callback tạo 1 closure. Với 10K nodes = 10K closures trong memory. Event delegation giảm xuống 1 closure duy nhất.

```tsx
// ❌ BAD: N event handlers (mỗi node 1 closure)
function CheckboxItem({ item, indices, onCheck }: Props) {
  // Closure mới mỗi render, dù đã dùng useCallback ở parent
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onCheck(e.target.checked, indices);
  };

  return <input type="checkbox" onChange={handleChange} />;
}

// ✅ GOOD: Event delegation (1 handler ở root)
function CheckboxTree({ data }: Props) {
  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const checkbox = target.closest(
      'input[type="checkbox"]',
    ) as HTMLInputElement;
    if (!checkbox) return;

    // Encode path trong data attribute
    const pathStr = checkbox.dataset.path; // "0.1.2"
    if (!pathStr) return;

    const indices = pathStr.split(".").map(Number);
    const checked = checkbox.checked;

    // Single update handler
    setData((prev) => {
      const newData = structuredClone(prev);
      const node = getNodeByPath(newData, indices);
      updateCheckboxAndDescendants(node, checked);
      resolveCheckboxStates(newData[indices[0]], indices.slice(1));
      return newData;
    });
  }, []);

  return (
    <div onClick={handleClick}>
      <CheckboxList items={data} parentPath="" />
    </div>
  );
}

// Leaf component — no handler, just data attribute
function CheckboxInput({ checked, label, path }: Props) {
  return (
    <label>
      <input
        type="checkbox"
        checked={checked === true}
        data-path={path} // "0.1.2" — encode location
        readOnly // React controlled via delegation
      />
      {label}
    </label>
  );
}
```

**Tại sao React đã có Synthetic Event delegation mà vẫn cần?**

React 17+ gắn listeners ở root container (không phải `document` nữa). Nhưng:

- React vẫn tạo **closure cho mỗi inline handler** (`onChange={() => ...}`)
- Event delegation giảm **closures** (memory), không phải DOM listeners
- Quan trọng nhất: giảm **re-render khi prop reference thay đổi**

| Concern           | React Default        | Event Delegation     |
| ----------------- | -------------------- | -------------------- |
| DOM listeners     | 1 (root)             | 1 (root)             |
| Closures          | N (per component)    | 1 (parent)           |
| Memory            | O(n)                 | O(1)                 |
| Re-render trigger | onChange ref changes | No prop = no trigger |
| Trade-off         | Simpler code         | More manual work     |

**🤔 Follow-up questions:**

| Câu hỏi                      | Trả lời                                                                                             |
| ---------------------------- | --------------------------------------------------------------------------------------------------- |
| "React đã delegation rồi?"   | "React delegates DOM events. Nhưng closures vẫn O(n). Event delegation pattern giảm closure count." |
| "Khi nào dùng?"              | "10K+ nodes. Memory constrained. Nếu < 1K nodes, inline handlers tốt hơn (simple code)."            |
| "data-attribute vs closure?" | "data-path='0.1.2' encoded path. Parse từ string. Slightly slower nhưng O(1) memory."               |

---

### 22. Tại Sao Error Handling Trong Recursive Functions?

**💬 Interview answer:**

> "Recursive traversal trên user-provided data có thể fail: missing children, circular references, stack overflow. Defensive coding prevents app crash."

**📖 Giải thích chi tiết:**

```tsx
// ❌ BAD: No error handling — crashes on bad data
function updateCheckboxAndDescendants(node: CheckboxItem, checked: boolean) {
  node.checked = checked;
  node.children?.forEach((child) =>
    updateCheckboxAndDescendants(child, checked),
  );
  // Nếu data có circular reference → infinite recursion → stack overflow!
}

// ✅ GOOD: Defensive recursive function
function updateCheckboxAndDescendants(
  node: CheckboxItem,
  checked: boolean,
  depth = 0,
  visited = new Set<number>(),
): void {
  // Guard 1: Maximum depth protection
  if (depth > 100) {
    console.warn(
      `Maximum depth exceeded at node "${node.name}". Possible circular reference.`,
    );
    return;
  }

  // Guard 2: Circular reference detection
  if (visited.has(node.id)) {
    console.warn(`Circular reference detected at node ID: ${node.id}`);
    return;
  }
  visited.add(node.id);

  // Guard 3: Type validation
  if (typeof node.checked === "undefined") {
    console.warn(`Node missing 'checked' property: ${JSON.stringify(node)}`);
    node.checked = false; // Default value
  }

  node.checked = checked;

  // Guard 4: Children validation
  if (node.children && Array.isArray(node.children)) {
    node.children.forEach((child) => {
      if (child && typeof child === "object") {
        updateCheckboxAndDescendants(child, checked, depth + 1, visited);
      }
    });
  }
}

// ✅ GOOD: resolveCheckboxStates with guards
function resolveCheckboxStates(
  node: CheckboxItem,
  targetPath: number[],
  depth = 0,
): void {
  if (depth > 100) return;
  if (!node || !targetPath.length) return;

  const [currentIndex, ...remainingPath] = targetPath;

  // Guard: valid index
  if (
    !node.children ||
    currentIndex < 0 ||
    currentIndex >= node.children.length
  ) {
    console.warn(`Invalid path index: ${currentIndex} for node "${node.name}"`);
    return;
  }

  if (remainingPath.length > 0) {
    resolveCheckboxStates(
      node.children[currentIndex],
      remainingPath,
      depth + 1,
    );
  }

  // Resolve parent state
  const allChecked = node.children.every((c) => c.checked === true);
  const allUnchecked = node.children.every((c) => c.checked === false);
  node.checked = allChecked ? true : allUnchecked ? false : "indeterminate";
}
```

**📊 Common Failure Modes:**

| Failure        | Cause                 | Guard                       |
| -------------- | --------------------- | --------------------------- |
| Stack overflow | Circular reference    | `visited` Set + depth limit |
| TypeError      | Missing property      | Type check + default value  |
| Out of bounds  | Invalid path index    | Bounds check                |
| Infinite loop  | Self-referencing node | `visited.has(id)`           |
| Silent failure | Swallowed error       | Console.warn + return       |

**🤔 Follow-up questions:**

| Câu hỏi                       | Trả lời                                                                                 |
| ----------------------------- | --------------------------------------------------------------------------------------- |
| "Performance impact?"         | "Set.has() = O(1). Depth check = O(1). Negligible overhead vs crash prevention."        |
| "Production error reporting?" | "Replace console.warn với Sentry/DataDog. Include node context for debugging."          |
| "Iterative vs recursive?"     | "Iterative avoids stack overflow entirely. Use explicit stack: `while (stack.length)`." |
| "Validation layer?"           | "Validate data at API boundary (Zod). Recursive guards are defense-in-depth."           |

---

### 23. Tại Sao `useMemo` Cho Derived State?

**💬 Interview answer:**

> "Counting checked items, filtering tree, computing summary — đều là derived state. Tính lại mỗi render = waste. `useMemo` cache kết quả cho đến khi dependency thay đổi."

**📖 Giải thích chi tiết:**

```tsx
// ❌ BAD: Compute every render — O(n) mỗi render
function CheckboxSummary({ data }: Props) {
  // Traverses entire tree EVERY render, even if data didn't change
  const checkedCount = getCheckedItems(data).length;
  const totalCount = countNodes(data);
  const percentage = Math.round((checkedCount / totalCount) * 100);

  return <p>{percentage}% selected</p>;
}

// ✅ GOOD: Memoized — only recompute when data changes
function CheckboxSummary({ data }: Props) {
  const summary = useMemo(() => {
    const checked = getCheckedItems(data);
    const total = countNodes(data);
    return {
      checkedCount: checked.length,
      totalCount: total,
      percentage: total > 0 ? Math.round((checked.length / total) * 100) : 0,
      checkedNames: checked.map((item) => item.name),
    };
  }, [data]); // Only recompute when data reference changes

  return (
    <p>
      {summary.percentage}% selected ({summary.checkedCount}/
      {summary.totalCount})
    </p>
  );
}

// ❌ BAD: Filter computed inside render without memo
function FilteredTree({ data, searchQuery }: Props) {
  // filterTree is O(n) — runs every render even if nothing changed
  const filtered = searchQuery ? filterTree(data, searchQuery) : data;
  return <CheckboxList items={filtered} />;
}

// ✅ GOOD: Memoized filter
function FilteredTree({ data, searchQuery }: Props) {
  const filtered = useMemo(
    () => (searchQuery ? filterTree(data, searchQuery) : data),
    [data, searchQuery], // Recompute only when data OR query changes
  );

  return <CheckboxList items={filtered} />;
}
```

**Khi nào KHÔNG dùng `useMemo`?**

```tsx
// ❌ OVER-OPTIMIZATION: Simple computation
const isAllChecked = useMemo(
  () => data.every((item) => item.checked === true),
  [data],
);
// Nếu data chỉ có 5-10 items → .every() nhanh hơn useMemo overhead

// ✅ Chỉ dùng useMemo khi:
// 1. Computation > 1ms (profile first!)
// 2. Data structure lớn (100+ nodes)
// 3. Result passed as prop to memoized child
// 4. Referential equality matters (objects/arrays as dependencies)
```

**📊 useMemo Decision Matrix:**

| Scenario                      | useMemo? | Reason                             |
| ----------------------------- | -------- | ---------------------------------- |
| `array.length`                | ❌ No    | O(1) — faster than memo overhead   |
| `array.filter()` on 10 items  | ❌ No    | Too cheap to memoize               |
| `array.filter()` on 1K+ items | ✅ Yes   | O(n) worth caching                 |
| Tree traversal                | ✅ Yes   | O(n) recursive — expensive         |
| Object as child prop          | ✅ Yes   | Stabilize reference for React.memo |
| String concatenation          | ❌ No    | O(1) — trivial                     |
| Sorting large array           | ✅ Yes   | O(n log n) — expensive             |

**🤔 Follow-up questions:**

| Câu hỏi                   | Trả lời                                                                                                       |
| ------------------------- | ------------------------------------------------------------------------------------------------------------- |
| "useMemo vs useCallback?" | "`useMemo` caches value. `useCallback` caches function. `useCallback(fn, deps)` = `useMemo(() => fn, deps)`." |
| "useMemo guarantee?"      | "React MAY drop cached value (memory pressure). Don't rely on it for correctness — only performance."         |
| "React Compiler?"         | "React Compiler (React 19) auto-memoizes. Manual useMemo may become unnecessary in future."                   |
| "Referential equality?"   | "`useMemo` ensures same object reference if deps unchanged. Critical cho React.memo children."                |

---

### 24. Tại Sao Functional `setState`?

**💬 Interview answer:**

> "setState(newValue) dùng stale closure. setState(prev => ...) luôn dùng latest state. Trong checkbox tree, multiple rapid clicks có thể gây race condition nếu không dùng functional form."

**📖 Giải thích chi tiết:**

```tsx
// ❌ BAD: Direct setState — stale closure problem
function CheckboxTree() {
  const [data, setData] = useState(initialData);

  const handleCheck = useCallback(
    (checked: boolean, indices: number[]) => {
      // data captured at time of useCallback creation
      // If user clicks rapidly, data is STALE!
      const newData = structuredClone(data); // ← STALE data!
      const node = getNodeByPath(newData, indices);
      updateCheckboxAndDescendants(node, checked);
      setData(newData);
    },
    [data],
  ); // Must include data → new function every time → memo breaks!

  return <CheckboxList items={data} onCheck={handleCheck} />;
}

// ✅ GOOD: Functional setState — always latest state
function CheckboxTree() {
  const [data, setData] = useState(initialData);

  const handleCheck = useCallback((checked: boolean, indices: number[]) => {
    setData((prev) => {
      // prev is ALWAYS the latest state, even during rapid clicks
      const newData = structuredClone(prev);
      const node = getNodeByPath(newData, indices);
      updateCheckboxAndDescendants(node, checked);
      resolveCheckboxStates(newData[indices[0]], indices.slice(1));
      return newData;
    });
  }, []); // Empty deps! Callback is stable forever ✅

  return <CheckboxList items={data} onCheck={handleCheck} />;
}
```

**Tại sao stale closure xảy ra?**

```
Timeline of rapid clicks:

Click 1: handleCheck captures data v1
  → setData(clone(data v1)) → schedules update to v2
Click 2: handleCheck STILL has data v1 (closure!)
  → setData(clone(data v1)) → OVERWRITES click 1's changes! ❌

With functional setState:
Click 1: setData(prev => ...) → prev = v1 → produces v2
Click 2: setData(prev => ...) → prev = v2 → produces v3 ✅
```

**📊 Direct vs Functional setState:**

| Aspect              | `setState(value)`           | `setState(prev => ...)`     |
| ------------------- | --------------------------- | --------------------------- |
| State reference     | Closure (may be stale)      | Always latest               |
| Rapid updates       | ❌ Race condition           | ✅ Sequential               |
| useCallback deps    | Must include state          | Empty array `[]`            |
| Callback stability  | New ref when state changes  | Stable forever              |
| React.memo children | Re-render on handler change | No unnecessary re-render    |
| Use case            | Simple, one-time set        | Derived from previous state |

**🤔 Follow-up questions:**

| Câu hỏi                   | Trả lời                                                                                                      |
| ------------------------- | ------------------------------------------------------------------------------------------------------------ |
| "Batching?"               | "React 18 auto-batches all setState. Multiple setData calls in handler = 1 re-render."                       |
| "useReducer alternative?" | "dispatch is always stable. reducer(prevState, action) = same pattern. Better for complex state."            |
| "flushSync?"              | "Force synchronous render. Bypasses batching. Rarely needed — performance anti-pattern."                     |
| "Concurrent mode?"        | "setState(prev => ...) is concurrent-safe. React may interrupt/retry renders. Functional form handles this." |

---

### 25. Tại Sao Tree Flattening vs Recursive Rendering?

**💬 Interview answer:**

> "Recursive components đơn giản nhưng khó virtualize. Flatten tree thành flat array + depth info cho phép dùng react-window. Trade-off: code complexity vs performance."

**📖 Giải thích chi tiết:**

```tsx
// ==========================================
// Approach 1: Recursive rendering (hiện tại)
// ==========================================
function CheckboxList({ items, depth = 0 }: Props) {
  return (
    <ul style={{ paddingLeft: depth * 24 }}>
      {items.map((item, index) => (
        <li key={item.id}>
          <CheckboxInput checked={item.checked} label={item.name} />
          {item.children && (
            <CheckboxList items={item.children} depth={depth + 1} />
          )}
        </li>
      ))}
    </ul>
  );
}
// Pros: Simple, natural tree structure
// Cons: Cannot virtualize, all nodes rendered

// ==========================================
// Approach 2: Flat rendering (for virtualization)
// ==========================================
interface FlatNode {
  id: number;
  name: string;
  checked: CheckboxValue;
  depth: number;
  hasChildren: boolean;
  isExpanded: boolean;
  indices: number[]; // Path to original node
}

// Flatten tree into array (respecting expand state)
function flattenTree(
  items: CheckboxItem[],
  expandedIds: Set<number>,
  depth = 0,
  parentIndices: number[] = [],
): FlatNode[] {
  const result: FlatNode[] = [];

  items.forEach((item, index) => {
    const indices = [...parentIndices, index];
    const hasChildren = !!item.children?.length;
    const isExpanded = expandedIds.has(item.id);

    result.push({
      id: item.id,
      name: item.name,
      checked: item.checked,
      depth,
      hasChildren,
      isExpanded,
      indices,
    });

    // Only include children if expanded
    if (hasChildren && isExpanded) {
      result.push(
        ...flattenTree(item.children!, expandedIds, depth + 1, indices),
      );
    }
  });

  return result;
}

// Render flat list — can virtualize!
function FlatCheckboxList({ data, expandedIds }: Props) {
  const flatNodes = useMemo(
    () => flattenTree(data, expandedIds),
    [data, expandedIds],
  );

  return (
    <FixedSizeList
      height={500}
      itemCount={flatNodes.length}
      itemSize={32}
      itemData={flatNodes}
    >
      {({ index, style, data: nodes }) => {
        const node = nodes[index];
        return (
          <div style={{ ...style, paddingLeft: node.depth * 24 }}>
            {node.hasChildren && <button>{node.isExpanded ? "▼" : "▶"}</button>}
            <input type="checkbox" checked={node.checked === true} />
            <span>{node.name}</span>
          </div>
        );
      }}
    </FixedSizeList>
  );
}
```

**📊 Recursive vs Flat Rendering:**

| Aspect                      | Recursive Components | Flat Array + Virtual      |
| --------------------------- | -------------------- | ------------------------- |
| **Code complexity**         | ✅ Simple, natural   | ❌ Need flatten/unflatten |
| **Virtualization**          | ❌ Cannot virtualize | ✅ Easy with react-window |
| **Performance (100 nodes)** | ✅ Fine              | Same                      |
| **Performance (10K nodes)** | ❌ Slow/crash        | ✅ Fast                   |
| **State updates**           | Modify tree directly | Flatten after each update |
| **Accessibility**           | Natural tree roles   | Manual aria-level         |
| **Expand/Collapse**         | Re-render subtree    | Re-compute flat array     |
| **When to use**             | Small trees < 500    | Large trees > 500         |

**🤔 Follow-up questions:**

| Câu hỏi               | Trả lời                                                                            |
| --------------------- | ---------------------------------------------------------------------------------- |
| "Flatten cost?"       | "O(visible nodes) per update. Memoize with useMemo. Cost << rendering savings."    |
| "Keep both data?"     | "Tree state (source of truth) + flat view (derived). Flat = read-only projection." |
| "Dynamic row height?" | "VariableSizeList instead of FixedSizeList. Need `getItemSize(index)` function."   |
| "Search with flat?"   | "Filter flat array instead of tree. Faster but need to show ancestor path."        |

---

### 26. Tại Sao `children` Prop Pattern Cho Flexibility?

**💬 Interview answer:**

> "Render props và children pattern cho phép customize rendering mà không sửa component. Inversion of Control — parent decides how to render, component decides what data."

**📖 Giải thích chi tiết:**

```tsx
// ==========================================
// Pattern 1: Fixed rendering (inflexible)
// ==========================================
// ❌ BAD: Component controls everything
function CheckboxItem({ item }: Props) {
  return (
    <li>
      <input type="checkbox" checked={item.checked === true} />
      <span>{item.name}</span>
      {/* Muốn thêm icon? Badge? Custom style? Phải sửa component! */}
    </li>
  );
}

// ==========================================
// Pattern 2: Render prop (full control)
// ==========================================
// ✅ GOOD: Consumer controls rendering
interface CheckboxTreeProps {
  data: CheckboxItem[];
  renderItem: (props: {
    item: CheckboxItem;
    checked: boolean | "indeterminate";
    onCheck: (checked: boolean) => void;
    depth: number;
    isExpanded: boolean;
    onExpand: () => void;
  }) => React.ReactNode;
}

function CheckboxTree({ data, renderItem }: CheckboxTreeProps) {
  // ... state management logic

  return (
    <ul role="tree">
      {data.map((item, index) => (
        <li key={item.id} role="treeitem">
          {renderItem({
            item,
            checked: item.checked,
            onCheck: (checked) => handleCheck(checked, [index]),
            depth: 0,
            isExpanded: expandedIds.has(item.id),
            onExpand: () => toggleExpand(item.id),
          })}
        </li>
      ))}
    </ul>
  );
}

// Usage — custom rendering
<CheckboxTree
  data={categories}
  renderItem={({ item, checked, onCheck, depth }) => (
    <div
      style={{ paddingLeft: depth * 24, display: "flex", alignItems: "center" }}
    >
      <input
        type="checkbox"
        checked={checked === true}
        ref={(el) => el && (el.indeterminate = checked === "indeterminate")}
        onChange={(e) => onCheck(e.target.checked)}
      />
      <CategoryIcon category={item.category} /> {/* Custom icon! */}
      <span>{item.name}</span>
      <Badge count={countChecked(item.children)} /> {/* Custom badge! */}
    </div>
  )}
/>;

// ==========================================
// Pattern 3: Slot pattern via children
// ==========================================
interface CheckboxTreeSlots {
  header?: React.ReactNode;
  toolbar?: React.ReactNode;
  footer?: React.ReactNode;
  emptyState?: React.ReactNode;
  children: React.ReactNode; // Main content
}

function CheckboxTree({
  header,
  toolbar,
  footer,
  emptyState,
  children,
  data,
}: CheckboxTreeSlots & { data: CheckboxItem[] }) {
  if (data.length === 0) return <>{emptyState ?? <p>No items</p>}</>;

  return (
    <div className="checkbox-tree">
      {header}
      {toolbar}
      <div className="tree-content">{children}</div>
      {footer}
    </div>
  );
}

// Usage with slots
<CheckboxTree data={data}>
  <CheckboxTree header={<h2>Categories</h2>}>
    <CheckboxTree toolbar={<SearchBar />}>
      <CheckboxList items={data} />
    </CheckboxTree>
  </CheckboxTree>
</CheckboxTree>;
```

**📊 Rendering Pattern Comparison:**

| Pattern             | Flexibility | Complexity | Type Safety | Use Case                |
| ------------------- | ----------- | ---------- | ----------- | ----------------------- |
| **Fixed props**     | Low         | Low        | High        | Internal components     |
| **className/style** | Low-Medium  | Low        | High        | Style customization     |
| **Render prop**     | High        | Medium     | High        | Full item customization |
| **Children**        | Medium      | Low        | Medium      | Layout composition      |
| **Slots**           | High        | Medium     | High        | Named regions           |
| **Headless hook**   | Highest     | High       | Highest     | Complete control        |

**🤔 Follow-up questions:**

| Câu hỏi                    | Trả lời                                                                                                |
| -------------------------- | ------------------------------------------------------------------------------------------------------ |
| "Render prop vs HOC?"      | "Render prop = runtime composition. HOC = compile-time. Render prop more flexible, HOC more reusable." |
| "Children vs render prop?" | "Children for layout slots. Render prop when child needs data from parent."                            |
| "Headless?"                | "Return raw state + handlers. Zero UI. User builds entire UI. Max flexibility."                        |
| "Performance?"             | "Render prop creates new function each render. Wrap with useCallback or use static component."         |

---

### 27. Tại Sao Structural Sharing Quan Trọng?

**💬 Interview answer:**

> "structuredClone copies toàn bộ tree mỗi update — O(n). Structural sharing chỉ tạo mới nodes bị thay đổi, giữ nguyên phần còn lại. Giảm memory allocation + giúp React.memo skip re-render unchanged subtrees."

**📖 Giải thích chi tiết:**

```tsx
// ❌ BAD: Full deep clone — O(n) mỗi update
function handleCheck(checked: boolean, indices: number[]) {
  setData((prev) => {
    const newData = structuredClone(prev); // Copy TOÀN BỘ tree
    // Dù chỉ thay đổi 1 leaf, cả tree được copy
    // React.memo comparison fails vì mọi reference đều mới!
    const node = getNodeByPath(newData, indices);
    updateCheckboxAndDescendants(node, checked);
    return newData;
  });
}

// ✅ GOOD: Structural sharing — chỉ clone path bị ảnh hưởng
function structuralUpdate(
  data: CheckboxItem[],
  indices: number[],
  checked: boolean,
): CheckboxItem[] {
  const [head, ...tail] = indices;

  return data.map((item, i) => {
    if (i !== head) return item; // ← SAME REFERENCE! React.memo skips

    // Clone only the modified path
    const updated = { ...item }; // Shallow copy (new ref)

    if (tail.length === 0) {
      // Target node: update self + descendants
      return updateNodeAndDescendants(updated, checked);
    }

    // Intermediate node: recurse into correct child
    updated.children = structuralUpdate(item.children ?? [], tail, checked);

    // Resolve parent state from children
    const allChecked = updated.children.every((c) => c.checked === true);
    const allUnchecked = updated.children.every((c) => c.checked === false);
    updated.checked = allChecked
      ? true
      : allUnchecked
        ? false
        : "indeterminate";

    return updated;
  });
}

// Helper: update node and all descendants (creates new refs)
function updateNodeAndDescendants(
  node: CheckboxItem,
  checked: boolean,
): CheckboxItem {
  return {
    ...node,
    checked,
    children: node.children?.map((child) =>
      updateNodeAndDescendants(child, checked),
    ),
  };
}

// Usage
const handleCheck = useCallback((checked: boolean, indices: number[]) => {
  setData((prev) => structuralUpdate(prev, indices, checked));
}, []);
```

**Visualizing structural sharing:**

```
Before click on [0][1][0]:

root ──→ [A, B, C]           ← shared
          │   │  │
          ▼   ▼  ▼
         [...]  [B1, B2]      ← B2 shared
                 │
                 ▼
                [B1a, B1b]    ← B1b shared

After structural update:

root ──→ [A, B', C]           ← A, C = SAME refs ✅
               │
               ▼
              [B1', B2]       ← B2 = SAME ref ✅
               │
               ▼
              [B1a', B1b]     ← B1b = SAME ref ✅

Only B → B', B1 → B1', B1a → B1a' get new references.
React.memo skips A, C, B2, B1b entirely!
```

**📊 Performance Comparison:**

| Metric             | `structuredClone`   | Structural Sharing      | Immer             |
| ------------------ | ------------------- | ----------------------- | ----------------- |
| Objects created    | All N               | Only path (log N)       | Only changed      |
| React.memo benefit | ❌ All refs new     | ✅ Unchanged = same ref | ✅ Proxy tracks   |
| Memory             | O(n) per update     | O(depth) per update     | O(changed)        |
| Code complexity    | ✅ Simple           | ❌ Manual path logic    | ✅ Mutable syntax |
| Speed              | Slow for large tree | Fast                    | Medium (proxy)    |

**🤔 Follow-up questions:**

| Câu hỏi                       | Trả lời                                                                                                    |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------- |
| "Immer does this?"            | "Yes! Immer uses Proxy to track mutations, then produces structurally shared result. Best of both worlds." |
| "Persistent data structures?" | "Immutable.js, Immer. Share unchanged subtrees. Like Git — each commit shares unchanged files."            |
| "When structuredClone is OK?" | "Small trees (< 100 nodes). Simple code wins. Profile before optimizing."                                  |
| "Object.assign vs spread?"    | "Same — shallow copy. `{...obj}` = `Object.assign({}, obj)`. Both create 1 level new ref."                 |

---

### 28. Tại Sao `forwardRef` Cho Indeterminate Checkbox?

**💬 Interview answer:**

> "indeterminate không phải HTML attribute — phải set qua JavaScript DOM API. forwardRef cho phép parent access DOM node của child component. Kết hợp useImperativeHandle cho clean API."

**📖 Giải thích chi tiết:**

```tsx
// ❌ BAD: useRef bên trong — parent không access được
function CheckboxInput({ checked, label, onChange }: Props) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = checked === "indeterminate";
    }
  }, [checked]);

  return (
    <label>
      <input
        ref={ref}
        type="checkbox"
        checked={checked === true}
        onChange={onChange}
      />
      {label}
    </label>
  );
}
// Parent CANNOT access this input — no way to focus/blur/animate from outside!

// ✅ GOOD: forwardRef — parent có full access
const CheckboxInput = forwardRef<HTMLInputElement, CheckboxInputProps>(
  function CheckboxInput({ checked, label, onChange }, ref) {
    const internalRef = useRef<HTMLInputElement>(null);
    const mergedRef = useMergedRef(ref, internalRef);

    useEffect(() => {
      if (internalRef.current) {
        internalRef.current.indeterminate = checked === "indeterminate";
      }
    }, [checked]);

    return (
      <label>
        <input
          ref={mergedRef}
          type="checkbox"
          checked={checked === true}
          onChange={onChange}
        />
        {label}
      </label>
    );
  },
);

// Merge multiple refs into one
function useMergedRef<T>(...refs: React.Ref<T>[]): React.RefCallback<T> {
  return useCallback((node: T | null) => {
    refs.forEach((ref) => {
      if (typeof ref === "function") {
        ref(node);
      } else if (ref && "current" in ref) {
        (ref as React.MutableRefObject<T | null>).current = node;
      }
    });
  }, refs);
}

// ✅ BETTER: useImperativeHandle — expose controlled API
interface CheckboxHandle {
  focus: () => void;
  blur: () => void;
  shake: () => void; // Custom animation
  getElement: () => HTMLInputElement | null;
}

const CheckboxInput = forwardRef<CheckboxHandle, CheckboxInputProps>(
  function CheckboxInput({ checked, label, onChange }, ref) {
    const inputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(
      ref,
      () => ({
        focus: () => inputRef.current?.focus(),
        blur: () => inputRef.current?.blur(),
        shake: () => {
          inputRef.current?.classList.add("shake-animation");
          setTimeout(
            () => inputRef.current?.classList.remove("shake-animation"),
            500,
          );
        },
        getElement: () => inputRef.current,
      }),
      [],
    );

    useEffect(() => {
      if (inputRef.current) {
        inputRef.current.indeterminate = checked === "indeterminate";
      }
    }, [checked]);

    return (
      <label>
        <input
          ref={inputRef}
          type="checkbox"
          checked={checked === true}
          onChange={onChange}
        />
        {label}
      </label>
    );
  },
);

// Usage from parent
function ParentTree() {
  const firstCheckboxRef = useRef<CheckboxHandle>(null);

  const handleError = () => {
    // Shake the invalid checkbox
    firstCheckboxRef.current?.shake();
    firstCheckboxRef.current?.focus();
  };

  return <CheckboxInput ref={firstCheckboxRef} checked={true} label="Node 1" />;
}
```

**📊 Ref Patterns Comparison:**

| Pattern               | Access           | Encapsulation     | Use Case                     |
| --------------------- | ---------------- | ----------------- | ---------------------------- |
| Internal `useRef`     | Component only   | ✅ Full           | Self-contained effects       |
| `forwardRef`          | Parent + child   | ❌ Exposes DOM    | DOM manipulation from parent |
| `useImperativeHandle` | Parent (limited) | ✅ Controlled API | Expose custom methods only   |
| Callback ref          | Custom logic     | ✅ Flexible       | Measure, observe, init       |

**🤔 Follow-up questions:**

| Câu hỏi                        | Trả lời                                                                                          |
| ------------------------------ | ------------------------------------------------------------------------------------------------ |
| "React 19 ref?"                | "React 19: ref as regular prop (no forwardRef needed). `function Comp({ ref }) {...}`. Simpler!" |
| "useImperativeHandle khi nào?" | "When parent needs methods (focus, scroll, animate) but NOT raw DOM access."                     |
| "Callback ref?"                | "`ref={(el) => { if (el) measure(el) }}`. Runs on mount/unmount. Good for dynamic measurements." |
| "Ref vs state?"                | "Ref = mutable, no re-render. State = immutable, triggers re-render. Ref for DOM, state for UI." |

---

### 29. Tại Sao Custom Hook Testing Riêng Biệt?

**💬 Interview answer:**

> "Custom hooks chứa core logic. Test hooks isolated = test logic thuần tuý, không phụ thuộc UI. renderHook từ @testing-library/react cho phép test hooks ngoài component."

**📖 Giải thích chi tiết:**

```tsx
// ==========================================
// Hook to test
// ==========================================
function useCheckboxTree(initialData: CheckboxItem[]) {
  const [data, setData] = useState(initialData);

  const check = useCallback((indices: number[], checked: boolean) => {
    setData((prev) => {
      const newData = structuredClone(prev);
      const node = getNodeByPath(newData, indices);
      updateCheckboxAndDescendants(node, checked);
      resolveCheckboxStates(newData[indices[0]], indices.slice(1));
      return newData;
    });
  }, []);

  const checkAll = useCallback((checked: boolean) => {
    setData((prev) => {
      const newData = structuredClone(prev);
      setAllChecked(newData, checked);
      return newData;
    });
  }, []);

  const checkedCount = useMemo(() => getCheckedItems(data).length, [data]);

  return { data, check, checkAll, checkedCount };
}

// ==========================================
// Tests for the hook (isolated)
// ==========================================
import { renderHook, act } from "@testing-library/react";

describe("useCheckboxTree", () => {
  const mockData: CheckboxItem[] = [
    {
      id: 1,
      name: "Parent",
      checked: false,
      children: [
        { id: 2, name: "Child A", checked: false },
        { id: 3, name: "Child B", checked: false },
      ],
    },
  ];

  it("should initialize with data", () => {
    const { result } = renderHook(() => useCheckboxTree(mockData));

    expect(result.current.data).toEqual(mockData);
    expect(result.current.checkedCount).toBe(0);
  });

  it("should check a leaf node", () => {
    const { result } = renderHook(() => useCheckboxTree(mockData));

    act(() => {
      result.current.check([0, 0], true); // Check Child A
    });

    expect(result.current.data[0].children![0].checked).toBe(true);
    expect(result.current.data[0].children![1].checked).toBe(false);
    expect(result.current.data[0].checked).toBe("indeterminate"); // Parent
    expect(result.current.checkedCount).toBe(1);
  });

  it("should propagate check to all descendants", () => {
    const { result } = renderHook(() => useCheckboxTree(mockData));

    act(() => {
      result.current.check([0], true); // Check Parent
    });

    expect(result.current.data[0].checked).toBe(true);
    expect(result.current.data[0].children![0].checked).toBe(true);
    expect(result.current.data[0].children![1].checked).toBe(true);
    expect(result.current.checkedCount).toBe(3);
  });

  it("should resolve parent to indeterminate", () => {
    const { result } = renderHook(() => useCheckboxTree(mockData));

    act(() => {
      result.current.check([0, 0], true); // Only Child A
    });

    expect(result.current.data[0].checked).toBe("indeterminate");
  });

  it("should handle checkAll", () => {
    const { result } = renderHook(() => useCheckboxTree(mockData));

    act(() => {
      result.current.checkAll(true);
    });

    expect(result.current.checkedCount).toBe(3);

    act(() => {
      result.current.checkAll(false);
    });

    expect(result.current.checkedCount).toBe(0);
  });

  it("should handle rapid sequential updates", () => {
    const { result } = renderHook(() => useCheckboxTree(mockData));

    act(() => {
      result.current.check([0, 0], true);
      result.current.check([0, 1], true);
    });

    // Both children checked → parent should be true (not indeterminate)
    expect(result.current.data[0].checked).toBe(true);
    expect(result.current.checkedCount).toBe(3);
  });
});
```

**📊 Testing Approach Comparison:**

| Approach                | What it tests     | Speed      | Isolation  | Maintenance |
| ----------------------- | ----------------- | ---------- | ---------- | ----------- |
| **renderHook**          | Hook logic only   | ✅ Fast    | ✅ High    | ✅ Low      |
| **render component**    | Hook + UI         | 🟡 Medium  | 🟡 Medium  | 🟡 Medium   |
| **E2E (Cypress)**       | Full flow         | ❌ Slow    | ❌ Low     | ❌ High     |
| **Pure function tests** | Utility functions | ✅ Fastest | ✅ Highest | ✅ Lowest   |

**🤔 Follow-up questions:**

| Câu hỏi                 | Trả lời                                                                                               |
| ----------------------- | ----------------------------------------------------------------------------------------------------- |
| "renderHook vs render?" | "renderHook cho hooks. render cho components. Hook tests faster, no DOM needed."                      |
| "act() tại sao?"        | "Wraps state updates. Ensures React processes all updates before assertions. Missing act = warnings." |
| "Mock hooks?"           | "Don't mock custom hooks — test real behavior. Mock external deps (API, localStorage)."               |
| "Coverage target?"      | "100% cho hook logic (pure functions). 90%+ cho components. Focus on behavior, not lines."            |

---

### 30. Tại Sao `useEffect` Cleanup Quan Trọng Trong Tree?

**💬 Interview answer:**

> "Tree components mount/unmount dynamically (expand/collapse). useEffect without cleanup = memory leaks, stale subscriptions, DOM manipulation on unmounted components."

**📖 Giải thích chi tiết:**

```tsx
// ❌ BAD: No cleanup — memory leak khi collapse
function CheckboxItem({ item }: Props) {
  useEffect(() => {
    // Subscribe to real-time updates for this node
    const unsubscribe = subscribeToNodeUpdates(item.id, (update) => {
      // This runs EVEN AFTER component unmounts!
      setChecked(update.checked); // ❌ setState on unmounted component
    });
    // MISSING cleanup! 💀
  }, [item.id]);

  // ...
}

// ✅ GOOD: Proper cleanup
function CheckboxItem({ item }: Props) {
  useEffect(() => {
    const unsubscribe = subscribeToNodeUpdates(item.id, (update) => {
      setChecked(update.checked);
    });

    return () => {
      unsubscribe(); // Cleanup on unmount or id change
    };
  }, [item.id]);
}

// ❌ BAD: IntersectionObserver without cleanup
function LazyCheckboxItem({ item }: Props) {
  const ref = useRef<HTMLLIElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        loadChildren(item.id);
      }
    });

    if (ref.current) observer.observe(ref.current);
    // MISSING disconnect! Observer persists after unmount 💀
  }, [item.id]);

  return <li ref={ref}>{/* ... */}</li>;
}

// ✅ GOOD: Observer cleanup
function LazyCheckboxItem({ item }: Props) {
  const ref = useRef<HTMLLIElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        loadChildren(item.id);
        observer.disconnect(); // One-time load
      }
    });

    observer.observe(element);

    return () => {
      observer.disconnect(); // Cleanup on unmount
    };
  }, [item.id]);

  return <li ref={ref}>{/* ... */}</li>;
}

// ==========================================
// Common cleanup patterns in tree components
// ==========================================

// Timer cleanup
useEffect(() => {
  const timer = setTimeout(() => {
    autoSave(data);
  }, 3000);
  return () => clearTimeout(timer); // Cancel if data changes before 3s
}, [data]);

// AbortController for async
useEffect(() => {
  const controller = new AbortController();

  fetchTreeData(nodeId, { signal: controller.signal })
    .then(setChildren)
    .catch((err) => {
      if (err.name !== "AbortError") console.error(err);
    });

  return () => controller.abort(); // Cancel request on unmount
}, [nodeId]);

// Event listener cleanup
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if (e.key === "Escape") collapseAll();
  };
  document.addEventListener("keydown", handler);
  return () => document.removeEventListener("keydown", handler);
}, [collapseAll]);
```

**📊 Cleanup Checklist:**

| Resource               | Cleanup Method            | If Missed                   |
| ---------------------- | ------------------------- | --------------------------- |
| `setTimeout`           | `clearTimeout(id)`        | Runs after unmount          |
| `setInterval`          | `clearInterval(id)`       | Runs forever                |
| `addEventListener`     | `removeEventListener`     | Memory leak                 |
| `WebSocket`            | `ws.close()`              | Connection leak             |
| `IntersectionObserver` | `observer.disconnect()`   | Memory leak                 |
| `ResizeObserver`       | `observer.disconnect()`   | Memory leak                 |
| `fetch`                | `AbortController.abort()` | Wasted network              |
| `subscription`         | `unsubscribe()`           | Memory leak + stale updates |

**🤔 Follow-up questions:**

| Câu hỏi                         | Trả lời                                                                                                |
| ------------------------------- | ------------------------------------------------------------------------------------------------------ |
| "React 18 strict mode?"         | "Double-mounts in dev to catch missing cleanup. If effect breaks on remount → missing cleanup!"        |
| "Memory leak detection?"        | "Chrome DevTools → Memory tab → Heap snapshots. Compare before/after unmount."                         |
| "AbortController?"              | "Cancels fetch. Prevents setState on unmounted. Pattern: `{ signal: controller.signal }`."             |
| "useEffect vs useLayoutEffect?" | "useEffect = after paint (async). useLayoutEffect = before paint (sync). Layout for DOM measurements." |

---

### 31. Tại Sao Discriminated Unions Cho Tree Actions?

**💬 Interview answer:**

> "Tree operations (check, expand, reorder, search) have different payloads. Discriminated union + TypeScript exhaustive checking ensures every action type is handled. Compile-time safety."

**📖 Giải thích chi tiết:**

```tsx
// ❌ BAD: Loose action type — easy to miss cases
type TreeAction = {
  type: string;
  payload: any; // 🚨 No type safety!
};

function reducer(state: TreeState, action: TreeAction) {
  switch (action.type) {
    case "CHECK":
      // action.payload could be anything — runtime errors!
      return handleCheck(state, action.payload.indices, action.payload.checked);
    // Easy to forget a case, misspell type, or pass wrong payload
  }
}

// ✅ GOOD: Discriminated union — exhaustive & type-safe
type TreeAction =
  | { type: "CHECK"; indices: number[]; checked: boolean }
  | { type: "CHECK_ALL"; checked: boolean }
  | { type: "EXPAND"; nodeId: number }
  | { type: "COLLAPSE"; nodeId: number }
  | { type: "EXPAND_ALL" }
  | { type: "COLLAPSE_ALL" }
  | { type: "SEARCH"; query: string }
  | { type: "REORDER"; from: number[]; to: number[] }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "SET_DATA"; data: CheckboxItem[] };

function treeReducer(state: TreeState, action: TreeAction): TreeState {
  switch (action.type) {
    case "CHECK":
      // TypeScript KNOWS: action.indices is number[], action.checked is boolean
      return {
        ...state,
        data: updateTree(state.data, action.indices, action.checked),
      };

    case "CHECK_ALL":
      return {
        ...state,
        data: setAll(state.data, action.checked),
      };

    case "EXPAND":
      return {
        ...state,
        expandedIds: new Set([...state.expandedIds, action.nodeId]),
      };

    case "COLLAPSE":
      return {
        ...state,
        expandedIds: new Set(
          [...state.expandedIds].filter((id) => id !== action.nodeId),
        ),
      };

    case "SEARCH":
      return {
        ...state,
        searchQuery: action.query,
        filteredData: filterTree(state.data, action.query),
      };

    case "REORDER":
      return {
        ...state,
        data: moveNode(state.data, action.from, action.to),
      };

    case "UNDO":
      return state.past.length > 0
        ? {
            ...state,
            data: state.past[state.past.length - 1],
            past: state.past.slice(0, -1),
            future: [state.data, ...state.future],
          }
        : state;

    case "REDO":
      return state.future.length > 0
        ? {
            ...state,
            data: state.future[0],
            past: [...state.past, state.data],
            future: state.future.slice(1),
          }
        : state;

    case "SET_DATA":
      return { ...state, data: action.data };

    case "EXPAND_ALL":
      return { ...state, expandedIds: getAllNodeIds(state.data) };

    case "COLLAPSE_ALL":
      return { ...state, expandedIds: new Set() };

    default:
      // Exhaustive check — TypeScript errors if a case is missing!
      const _exhaustive: never = action;
      return state;
  }
}

// TypeScript catches errors at COMPILE time:
// dispatch({ type: "CHEK" })           // ❌ Typo — TS error
// dispatch({ type: "CHECK" })           // ❌ Missing indices, checked
// dispatch({ type: "CHECK", indices: [0], checked: true }) // ✅ OK
// dispatch({ type: "EXPAND", checked: true })              // ❌ Wrong payload
```

**📊 Type Safety Benefits:**

| Feature            | `string + any` | Discriminated Union |
| ------------------ | -------------- | ------------------- |
| Typo detection     | ❌ Runtime     | ✅ Compile-time     |
| Payload validation | ❌ Manual      | ✅ Automatic        |
| Exhaustive check   | ❌ No          | ✅ `never` type     |
| Autocomplete       | ❌ No          | ✅ IDE support      |
| Refactoring        | ❌ Dangerous   | ✅ Safe             |

**🤔 Follow-up questions:**

| Câu hỏi                | Trả lời                                                                                                         |
| ---------------------- | --------------------------------------------------------------------------------------------------------------- |
| "never type?"          | "`const _: never = action` — TypeScript errors if action can still have a type. Forces handling all cases."     |
| "Extract action type?" | "`Extract<TreeAction, { type: 'CHECK' }>` → gets the specific CheckAction type."                                |
| "Action creators?"     | "`const check = (indices, checked): TreeAction => ({ type: 'CHECK', indices, checked })`. Type-safe factories." |
| "Redux Toolkit?"       | "createSlice auto-generates action creators + types from reducers. Built-in discriminated unions."              |

---

### 32. Tại Sao Iterative vs Recursive Algorithms?

**💬 Interview answer:**

> "Recursion đẹp nhưng có limits: call stack (~10K frames), không tail-call optimized trong JS. Iterative dùng explicit stack — unlimited depth, better performance, easier debugging."

**📖 Giải thích chi tiết:**

```tsx
// ==========================================
// Recursive: elegant but limited
// ==========================================
function countCheckedRecursive(items: CheckboxItem[]): number {
  let count = 0;
  for (const item of items) {
    if (item.checked === true) count++;
    if (item.children) {
      count += countCheckedRecursive(item.children); // ← Call stack grows!
    }
  }
  return count;
}
// Stack depth = tree depth. Tree depth > 10K = 💥 RangeError: Maximum call stack

// ==========================================
// Iterative: explicit stack — no limit
// ==========================================
function countCheckedIterative(items: CheckboxItem[]): number {
  let count = 0;
  const stack: CheckboxItem[] = [...items]; // Explicit stack (heap memory)

  while (stack.length > 0) {
    const node = stack.pop()!; // DFS order

    if (node.checked === true) count++;

    // Push children onto stack (reversed for DFS order)
    if (node.children) {
      for (let i = node.children.length - 1; i >= 0; i--) {
        stack.push(node.children[i]);
      }
    }
  }

  return count;
}
// Stack lives on heap — limited only by available memory (~millions of nodes)

// ==========================================
// BFS with queue (level-order traversal)
// ==========================================
function getNodesByLevel(items: CheckboxItem[]): Map<number, CheckboxItem[]> {
  const levels = new Map<number, CheckboxItem[]>();
  const queue: Array<{ node: CheckboxItem; depth: number }> = items.map(
    (item) => ({ node: item, depth: 0 }),
  );

  while (queue.length > 0) {
    const { node, depth } = queue.shift()!; // FIFO = BFS

    if (!levels.has(depth)) levels.set(depth, []);
    levels.get(depth)!.push(node);

    node.children?.forEach((child) => {
      queue.push({ node: child, depth: depth + 1 });
    });
  }

  return levels;
}

// ==========================================
// Iterative updateCheckboxAndDescendants
// ==========================================
function updateCheckboxAndDescendantsIterative(
  data: CheckboxItem[],
  targetIndices: number[],
  checked: boolean,
): CheckboxItem[] {
  const newData = structuredClone(data);

  // Step 1: Find target node
  const targetNode = getNodeByPath(newData, targetIndices);

  // Step 2: Update descendants iteratively (DFS)
  const stack: CheckboxItem[] = [targetNode];
  while (stack.length > 0) {
    const node = stack.pop()!;
    node.checked = checked;
    if (node.children) {
      stack.push(...node.children);
    }
  }

  // Step 3: Bubble up — resolve parents bottom-up
  for (let i = targetIndices.length - 1; i >= 0; i--) {
    const parentPath = targetIndices.slice(0, i);
    const parentNode =
      parentPath.length === 0
        ? ({ children: newData } as CheckboxItem) // Virtual root
        : getNodeByPath(newData, parentPath);

    if (parentNode.children) {
      const allChecked = parentNode.children.every((c) => c.checked === true);
      const allUnchecked = parentNode.children.every(
        (c) => c.checked === false,
      );

      if (parentPath.length > 0) {
        parentNode.checked = allChecked
          ? true
          : allUnchecked
            ? false
            : "indeterminate";
      }
    }
  }

  return newData;
}
```

**📊 Recursive vs Iterative:**

| Aspect               | Recursive                 | Iterative (Stack) | Iterative (Queue) |
| -------------------- | ------------------------- | ----------------- | ----------------- |
| **Traversal order**  | DFS                       | DFS               | BFS               |
| **Max depth**        | ~10K (call stack)         | ∞ (heap)          | ∞ (heap)          |
| **Memory**           | O(depth) stack            | O(width) stack    | O(width) queue    |
| **Code readability** | ✅ Elegant                | 🟡 Verbose        | 🟡 Verbose        |
| **Debugging**        | ❌ Stack traces           | ✅ Breakpoints    | ✅ Breakpoints    |
| **Tail-call opt**    | ❌ Not in JS/TS           | N/A               | N/A               |
| **Performance**      | 🟡 Function call overhead | ✅ Less overhead  | ✅ Less overhead  |

**🤔 Follow-up questions:**

| Câu hỏi                   | Trả lời                                                                                                  |
| ------------------------- | -------------------------------------------------------------------------------------------------------- |
| "When to use recursive?"  | "Depth < 100, code clarity matters. Most business trees are shallow (< 10 levels)."                      |
| "Tail-call optimization?" | "ES6 spec has it. But NO browser implements it (except Safari). Don't rely on TCO."                      |
| "Trampoline?"             | "Pattern to avoid stack overflow: `while (typeof result === 'function') result = result()`. Manual TCO." |
| "DFS vs BFS?"             | "DFS = go deep first (stack/recursion). BFS = level by level (queue). Use BFS for level operations."     |

---

### 33. Tại Sao Closure Traps Là Lỗi Phổ Biến Nhất?

**💬 Interview answer:**

> "JavaScript closures capture variables by reference. Trong React, mỗi render tạo new closure. Nếu không hiểu closure lifecycle, event handlers sẽ dùng stale props/state — đặc biệt nguy hiểm trong async operations và timers."

**📖 Giải thích chi tiết:**

```tsx
// ==========================================
// Trap 1: Stale state trong setTimeout
// ==========================================
function AutoSaveTree({ data }: Props) {
  // ❌ BAD: data stale sau 3 giây
  useEffect(() => {
    const timer = setInterval(() => {
      // data captured lúc effect chạy lần đầu!
      // Nếu user thay đổi tree, save vẫn dùng data CŨ
      saveToServer(data); // ← STALE!
    }, 3000);
    return () => clearInterval(timer);
  }, []); // Empty deps → data v1 captured forever

  // ✅ GOOD: useRef to escape closure
  const dataRef = useRef(data);
  dataRef.current = data; // Always latest

  useEffect(() => {
    const timer = setInterval(() => {
      saveToServer(dataRef.current); // Always latest via ref
    }, 3000);
    return () => clearInterval(timer);
  }, []);
}

// ==========================================
// Trap 2: Event handler closure
// ==========================================
function CheckboxTree() {
  const [data, setData] = useState(initialData);
  const [selectedCount, setSelectedCount] = useState(0);

  // ❌ BAD: selectedCount stale nếu nhiều clicks liên tục
  const handleCheck = useCallback((checked: boolean, indices: number[]) => {
    setData((prev) => {
      /* ... update ... */
    });
    // selectedCount là giá trị lúc useCallback tạo!
    console.log(`Count: ${selectedCount}`); // ← STALE nếu deps thiếu
    setSelectedCount(selectedCount + 1); // ← Overwrites concurrent updates!
  }, []); // selectedCount not in deps

  // ✅ GOOD: Derive from state, or use functional update
  const handleCheck = useCallback((checked: boolean, indices: number[]) => {
    setData((prev) => {
      const newData = structuredClone(prev);
      // ... update tree ...
      return newData;
    });
    setSelectedCount((prev) => prev + 1); // Functional update = always latest
  }, []);
}

// ==========================================
// Trap 3: useCallback với sai deps
// ==========================================

// ❌ BAD: Missing onCheck in deps
const memoizedList = useMemo(
  () => <CheckboxList items={data} onCheck={handleCheck} />,
  [data],
); // handleCheck missing → stale callback in memoized component!

// ✅ GOOD: Include all used values
const memoizedList = useMemo(
  () => <CheckboxList items={data} onCheck={handleCheck} />,
  [data, handleCheck],
);

// ✅ BETTER: handleCheck stable (empty deps via functional setState)
// → useMemo只需要 [data]
```

**📊 Closure Trap Patterns:**

| Trap                     | Symptom                     | Fix                                |
| ------------------------ | --------------------------- | ---------------------------------- |
| Stale state in timer     | Old data saved/sent         | `useRef` + sync on each render     |
| Stale state in handler   | Action uses outdated count  | Functional `setState(prev => ...)` |
| Missing useCallback deps | Child sees stale handler    | Add deps or make handler stable    |
| Stale props in useEffect | Effect uses old prop value  | Include prop in dependency array   |
| Promise captures stale   | Async result uses old state | `useRef` or cancel previous        |

**🤔 Follow-up questions:**

| Câu hỏi                   | Trả lời                                                                                              |
| ------------------------- | ---------------------------------------------------------------------------------------------------- |
| "ESLint exhaustive-deps?" | "ALWAYS enable. `react-hooks/exhaustive-deps` catches 90% of stale closure bugs. Never disable."     |
| "useRef vs useState?"     | "useRef = mutable, no re-render. For escape hatch. useState = triggers re-render. For UI state."     |
| "Class components?"       | "Class methods don't have closure problem — `this.state` always latest. But class has other issues." |
| "React Compiler?"         | "Auto-detects closures + memoizes correctly. Eliminates most manual closure management."             |

---

### 34. Tại Sao Hiểu React Reconciliation & Tree Diffing?

**💬 Interview answer:**

> "React diffs virtual DOM trees to find minimal DOM updates. Hiểu reconciliation giúp optimize: key strategy, component structure, avoiding unnecessary unmount/remount. Đặc biệt quan trọng cho recursive tree components."

**📖 Giải thích chi tiết:**

```tsx
// ==========================================
// Reconciliation rules React follows:
// ==========================================

// Rule 1: Different element type → destroy old, create new
// <div> → <span> = unmount div, mount span (expensive!)

// Rule 2: Same element type → update props only
// <div className="a"> → <div className="b"> = update className (cheap!)

// Rule 3: Lists → use key to match old/new items
// Without key: React matches by INDEX → bugs when reordering!
// With key: React matches by KEY → correct identity tracking

// ==========================================
// Key strategy in checkbox tree
// ==========================================

// ❌ BAD: Index as key — breaks when reorder/filter/delete
function CheckboxList({ items }: Props) {
  return (
    <ul>
      {items.map((item, index) => (
        <li key={index}>
          {" "}
          {/* ← Index key! */}
          <CheckboxInput checked={item.checked} label={item.name} />
          {item.children && <CheckboxList items={item.children} />}
        </li>
      ))}
    </ul>
  );
}
// Khi xoá item[1], React maps:
// old key=0 → new key=0 (OK)
// old key=1 → new key=1 (WRONG! Now different item!)
// old key=2 → DESTROY (was correct item!)

// ✅ GOOD: Stable ID as key
function CheckboxList({ items }: Props) {
  return (
    <ul>
      {items.map((item) => (
        <li key={item.id}>
          {" "}
          {/* ← Stable unique ID */}
          <CheckboxInput checked={item.checked} label={item.name} />
          {item.children && <CheckboxList items={item.children} />}
        </li>
      ))}
    </ul>
  );
}

// ==========================================
// Avoiding unnecessary reconciliation
// ==========================================

// ❌ BAD: Component created inside render → new type every render!
function ParentTree({ data }: Props) {
  // New component reference EACH render → React unmounts + remounts!
  const TreeItem = ({ item }: { item: CheckboxItem }) => (
    <li>
      <CheckboxInput checked={item.checked} label={item.name} />
    </li>
  );

  return (
    <ul>
      {data.map((item) => (
        <TreeItem key={item.id} item={item} />
      ))}
    </ul>
  );
}

// ✅ GOOD: Component defined OUTSIDE render
const TreeItem = memo(({ item }: { item: CheckboxItem }) => (
  <li>
    <CheckboxInput checked={item.checked} label={item.name} />
  </li>
));

function ParentTree({ data }: Props) {
  return (
    <ul>
      {data.map((item) => (
        <TreeItem key={item.id} item={item} />
      ))}
    </ul>
  );
}

// ==========================================
// Conditional rendering gotcha
// ==========================================

// ❌ BAD: Changing component position → remount
function Tree({ showSearch, data }: Props) {
  return (
    <div>
      {showSearch && <SearchBar />}
      <CheckboxList items={data} /> {/* Position changes = remount! */}
    </div>
  );
}

// ✅ GOOD: Stable position with null
function Tree({ showSearch, data }: Props) {
  return (
    <div>
      {showSearch ? <SearchBar /> : null} {/* null preserves position */}
      <CheckboxList items={data} /> {/* Always position 1 */}
    </div>
  );
}
```

**📊 Reconciliation Costs:**

| Operation            | Cost              | Example                    |
| -------------------- | ----------------- | -------------------------- |
| Update prop          | ✅ Cheap          | `className` change         |
| Reorder (with key)   | 🟡 Medium         | Move DOM node              |
| Unmount + Mount      | ❌ Expensive      | State lost, effects re-run |
| Full subtree destroy | 🔴 Very expensive | Different component type   |

**🤔 Follow-up questions:**

| Câu hỏi                | Trả lời                                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------------------------ |
| "Fiber architecture?"  | "React Fiber = incremental reconciliation. Can pause/resume work. Enables Concurrent Mode."            |
| "O(n) diffing?"        | "React's heuristic: same type = update, diff type = replace. O(n) instead of O(n³) generic tree diff." |
| "key={Math.random()}?" | "NEVER. New key every render = unmount+remount every render = destroyed state + terrible performance." |
| "Fragments vs div?"    | "`<Fragment>` adds no DOM node. `<div>` adds wrapper. Fragment better for lists."                      |

---

### 35. Tại Sao Lazy Initialization Cho Expensive State?

**💬 Interview answer:**

> "useState(expensiveFn()) chạy function MỖI render nhưng chỉ dùng kết quả lần đầu. useState(() => expensiveFn()) = lazy initializer — chỉ chạy 1 lần duy nhất. Quan trọng khi initial data cần transform."

**📖 Giải thích chi tiết:**

```tsx
// ❌ BAD: Expensive computation EVERY render
function CheckboxTree({ rawData }: Props) {
  // transformData runs EVERY render — even though result only used once!
  const [data, setData] = useState(transformAndValidateData(rawData));
  // transformAndValidateData(rawData) is called, result discarded on re-renders
  return <CheckboxList items={data} />;
}

// ✅ GOOD: Lazy initializer — runs once
function CheckboxTree({ rawData }: Props) {
  const [data, setData] = useState(() => {
    // Arrow function only called on FIRST render
    console.log("Transforming data..."); // Logs ONCE
    return transformAndValidateData(rawData);
  });
  return <CheckboxList items={data} />;
}

// ==========================================
// Real-world: Parse + validate initial tree data
// ==========================================
function transformAndValidateData(raw: unknown): CheckboxItem[] {
  // Step 1: Validate shape with Zod
  const parsed = checkboxTreeSchema.parse(raw);

  // Step 2: Add missing IDs
  let nextId = 1;
  const addIds = (items: any[]): CheckboxItem[] =>
    items.map((item) => ({
      ...item,
      id: item.id ?? nextId++,
      checked: item.checked ?? false,
      children: item.children ? addIds(item.children) : undefined,
    }));

  // Step 3: Sort alphabetically
  const sort = (items: CheckboxItem[]): CheckboxItem[] =>
    [...items]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((item) => ({
        ...item,
        children: item.children ? sort(item.children) : undefined,
      }));

  return sort(addIds(parsed));
}

// ==========================================
// useReducer lazy init
// ==========================================
function init(rawData: unknown): TreeState {
  const data = transformAndValidateData(rawData);
  return {
    data,
    past: [],
    future: [],
    expandedIds: new Set<number>(),
    searchQuery: "",
  };
}

function CheckboxTree({ rawData }: Props) {
  // Third arg = lazy initializer
  const [state, dispatch] = useReducer(treeReducer, rawData, init);
  // init(rawData) only called ONCE on mount
  return <CheckboxList items={state.data} />;
}

// ==========================================
// localStorage lazy init
// ==========================================
function usePersistentTree(key: string, fallback: CheckboxItem[]) {
  const [data, setData] = useState(() => {
    // Only reads localStorage ONCE on mount
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : fallback;
    } catch {
      return fallback;
    }
  });

  // Auto-save on change
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(data));
  }, [key, data]);

  return [data, setData] as const;
}
```

**📊 Performance Impact:**

| Pattern                     | First Render   | Re-renders          | Notes            |
| --------------------------- | -------------- | ------------------- | ---------------- |
| `useState(compute())`       | Compute ✅     | Compute ⚠️ (wasted) | Result discarded |
| `useState(() => compute())` | Compute ✅     | Skip ✅             | Lazy — only once |
| `useReducer(r, raw, init)`  | `init(raw)` ✅ | Skip ✅             | Third arg = lazy |

**🤔 Follow-up questions:**

| Câu hỏi              | Trả lời                                                                                               |
| -------------------- | ----------------------------------------------------------------------------------------------------- |
| "props thay đổi?"    | "Lazy init chỉ chạy lần đầu. Nếu prop changes → dùng useEffect + setData hoặc key reset."             |
| "Key reset pattern?" | "`<Tree key={dataVersion} rawData={newData} />`. New key = unmount+remount = fresh lazy init."        |
| "useReducer init?"   | "Third arg: `useReducer(reducer, initArg, initFn)`. `initFn(initArg)` chạy 1 lần."                    |
| "SSR?"               | "Lazy init runs on server too. Don't access `window`/`localStorage` in init — check `typeof window`." |

---

### 36. Tại Sao Composition Over Inheritance?

**💬 Interview answer:**

> "React không dùng inheritance cho component reuse. Composition via props, children, hooks — linh hoạt hơn, dễ test hơn, tránh deep class hierarchies."

**📖 Giải thích chi tiết:**

```tsx
// ❌ BAD: Inheritance — tight coupling, inflexible
class BaseTree extends React.Component {
  handleCheck() {
    /* base logic */
  }
  render() {
    return <div>{this.renderItems()}</div>;
  }
  renderItems() {
    /* base rendering */
  }
}

class SearchableTree extends BaseTree {
  // Override parent method — fragile!
  renderItems() {
    const filtered = this.filterItems(); // Where does this come from?
    return super.renderItems(); // Call parent — confusing chain
  }
}

class DraggableSearchableTree extends SearchableTree {
  // 3 levels deep — nightmare to debug
  // What if we want Draggable WITHOUT Searchable? Can't!
}

// ✅ GOOD: Composition — mix and match features freely
function CheckboxTree({ data, onChange }: BaseProps) {
  const { data: treeData, check, checkAll } = useCheckboxTree(data);
  return <CheckboxList items={treeData} onCheck={check} />;
}

// Add search: wrap with search feature
function SearchableCheckboxTree(props: BaseProps & SearchProps) {
  return (
    <SearchProvider>
      <SearchBar />
      <CheckboxTree {...props} />
    </SearchProvider>
  );
}

// Add drag: wrap with drag feature
function DraggableCheckboxTree(props: BaseProps & DragProps) {
  return (
    <DndProvider>
      <CheckboxTree {...props} />
    </DndProvider>
  );
}

// ✅ Any combination possible!
function FullFeaturedTree(props: AllProps) {
  return (
    <DndProvider>
      <SearchProvider>
        <UndoProvider>
          <CheckboxTree {...props} />
        </UndoProvider>
      </SearchProvider>
    </DndProvider>
  );
}

// ==========================================
// Hook composition (most powerful)
// ==========================================
function useFullCheckboxTree(initialData: CheckboxItem[]) {
  // Compose independent hooks
  const tree = useCheckboxTree(initialData);
  const search = useTreeSearch(tree.data);
  const undoRedo = useUndoRedo(tree.data, tree.setData);
  const expand = useExpandCollapse();
  const persist = usePersistence("tree-key", tree.data, tree.setData);

  return {
    ...tree,
    ...search,
    ...undoRedo,
    ...expand,
    isPersisted: persist.isSynced,
  };
}
```

**📊 Inheritance vs Composition:**

| Aspect              | Inheritance            | Composition         |
| ------------------- | ---------------------- | ------------------- |
| **Coupling**        | Tight (parent-child)   | Loose (independent) |
| **Reuse**           | Entire class hierarchy | Individual features |
| **Flexibility**     | Fixed hierarchy        | Mix-and-match       |
| **Testing**         | Test whole hierarchy   | Test each piece     |
| **Diamond problem** | ❌ Can't extend 2      | ✅ Compose N hooks  |
| **React support**   | ❌ Discouraged         | ✅ Core philosophy  |

**🤔 Follow-up questions:**

| Câu hỏi                 | Trả lời                                                                                                    |
| ----------------------- | ---------------------------------------------------------------------------------------------------------- |
| "Dan Abramov's stance?" | "'React doesn't use inheritance for component reuse. Composition is always enough.'"                       |
| "When inheritance OK?"  | "Almost never in React. Maybe for Error Boundaries (must be class). Prefer composition everywhere else."   |
| "Provider hell?"        | "Many wrappers = deep nesting. Solutions: compose providers utility, or use Zustand (no provider needed)." |
| "HOC vs hooks?"         | "HOC = old composition pattern. Hooks = modern. Hooks don't have wrapper hell, easier to type, debug."     |

---

### 37. Tại Sao `useId` Cho SSR-Safe Accessibility?

**💬 Interview answer:**

> "Checkbox cần `id` + `htmlFor` cho accessibility. Client-generated IDs (Math.random, counter) mismatch with SSR. useId generates stable, hydration-safe IDs."

**📖 Giải thích chi tiết:**

```tsx
// ❌ BAD: Math.random() — different on server vs client
function CheckboxInput({ checked, label, onChange }: Props) {
  const id = `checkbox-${Math.random().toString(36).substr(2, 9)}`;
  // SSR: id = "checkbox-abc123"
  // Client hydration: id = "checkbox-xyz789" → MISMATCH! 💀
  // React hydration error + broken label association

  return (
    <>
      <input
        id={id}
        type="checkbox"
        checked={checked === true}
        onChange={onChange}
      />
      <label htmlFor={id}>{label}</label>
    </>
  );
}

// ❌ BAD: Global counter — not deterministic with Suspense/Streaming
let counter = 0;
function CheckboxInput({ checked, label, onChange }: Props) {
  const [id] = useState(() => `checkbox-${counter++}`);
  // With Suspense: rendering order not guaranteed → counter jumps
  // With concurrent rendering: component rendered multiple times → counter inconsistent

  return (
    <>
      <input id={id} type="checkbox" />
      <label htmlFor={id}>{label}</label>
    </>
  );
}

// ✅ GOOD: useId — SSR-safe, concurrent-safe
function CheckboxInput({ checked, label, onChange }: Props) {
  const id = useId(); // ":r1:", ":r2:", etc. — stable across SSR/CSR

  return (
    <>
      <input
        id={`${id}-checkbox`}
        type="checkbox"
        checked={checked === true}
        onChange={onChange}
        aria-describedby={`${id}-description`}
      />
      <label htmlFor={`${id}-checkbox`}>{label}</label>
      <span id={`${id}-description`} className="sr-only">
        Toggle {label}
      </span>
    </>
  );
}

// ==========================================
// Multiple related IDs from single useId
// ==========================================
function CheckboxItemAccessible({ item, indices }: Props) {
  const id = useId();

  const checkboxId = `${id}-checkbox`;
  const labelId = `${id}-label`;
  const descId = `${id}-desc`;
  const groupId = `${id}-group`;

  return (
    <li role="treeitem" aria-labelledby={labelId}>
      <div className="node-row">
        <input
          id={checkboxId}
          type="checkbox"
          checked={item.checked === true}
          aria-describedby={descId}
          aria-controls={item.children ? groupId : undefined}
        />
        <label id={labelId} htmlFor={checkboxId}>
          {item.name}
        </label>
        <span id={descId} className="sr-only">
          {item.checked === "indeterminate"
            ? `${item.name}: partially selected`
            : item.checked
              ? `${item.name}: selected`
              : `${item.name}: not selected`}
        </span>
      </div>

      {item.children && (
        <ul id={groupId} role="group">
          {item.children.map((child, i) => (
            <CheckboxItemAccessible
              key={child.id}
              item={child}
              indices={[...indices, i]}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
```

**📊 ID Generation Comparison:**

| Method           | SSR Safe | Concurrent Safe | Hydration          | Unique |
| ---------------- | -------- | --------------- | ------------------ | ------ |
| `Math.random()`  | ❌       | ❌              | ❌ Mismatch        | ✅     |
| Global counter   | ❌       | ❌              | ❌ Order dependent | ✅     |
| `useRef(uuid())` | ❌       | ❌              | ❌                 | ✅     |
| `useId()`        | ✅       | ✅              | ✅                 | ✅     |
| Static string    | ✅       | ✅              | ✅                 | ❌     |

**🤔 Follow-up questions:**

| Câu hỏi              | Trả lời                                                                                 |
| -------------------- | --------------------------------------------------------------------------------------- |
| "useId format?"      | "`:r1:`, `:r2:` etc. Colons make it unique — won't conflict with user IDs."             |
| "Multiple IDs?"      | "Call `useId()` once. Derive related IDs: `${id}-input`, `${id}-label`, `${id}-desc`."  |
| "SSR without useId?" | "Use deterministic path-based ID: `tree-${indices.join('-')}`. But fragile on reorder." |
| "aria-describedby?"  | "Links checkbox to descriptive text. Screen readers readinput then description."        |

---

### 38. Tại Sao Data Normalization vs Tree Shape?

**💬 Interview answer:**

> "Nested tree easy to render but hard to update (deep clone). Normalized flat map easy to update but need denormalize to render. Chọn dựa trên read vs write frequency."

**📖 Giải thích chi tiết:**

```tsx
// ==========================================
// Approach 1: Nested tree (natural shape)
// ==========================================
interface NestedItem {
  id: number;
  name: string;
  checked: boolean | "indeterminate";
  children?: NestedItem[];
}

// Data: natural tree structure
const nestedData: NestedItem[] = [
  {
    id: 1,
    name: "Electronics",
    checked: false,
    children: [
      {
        id: 2,
        name: "Phones",
        checked: false,
        children: [
          { id: 3, name: "iPhone", checked: false },
          { id: 4, name: "Samsung", checked: false },
        ],
      },
      { id: 5, name: "Laptops", checked: false },
    ],
  },
];

// Update: O(n) deep clone + path traversal
function updateNested(
  data: NestedItem[],
  targetId: number,
  checked: boolean,
): NestedItem[] {
  return data.map((item) => {
    if (item.id === targetId) return { ...item, checked };
    if (item.children) {
      return {
        ...item,
        children: updateNested(item.children, targetId, checked),
      };
    }
    return item;
  });
}

// ==========================================
// Approach 2: Normalized flat map
// ==========================================
interface NormalizedItem {
  id: number;
  name: string;
  checked: boolean | "indeterminate";
  parentId: number | null;
  childIds: number[];
}

type NormalizedStore = Map<number, NormalizedItem>;

// Data: flat map
const normalizedData: NormalizedStore = new Map([
  [
    1,
    {
      id: 1,
      name: "Electronics",
      checked: false,
      parentId: null,
      childIds: [2, 5],
    },
  ],
  [2, { id: 2, name: "Phones", checked: false, parentId: 1, childIds: [3, 4] }],
  [3, { id: 3, name: "iPhone", checked: false, parentId: 2, childIds: [] }],
  [4, { id: 4, name: "Samsung", checked: false, parentId: 2, childIds: [] }],
  [5, { id: 5, name: "Laptops", checked: false, parentId: 1, childIds: [] }],
]);

// Update: O(1) lookup + O(depth) for parent propagation
function updateNormalized(
  store: NormalizedStore,
  targetId: number,
  checked: boolean,
): NormalizedStore {
  const newStore = new Map(store);

  // Update target + descendants: O(subtree size)
  const stack = [targetId];
  while (stack.length > 0) {
    const id = stack.pop()!;
    const node = { ...newStore.get(id)!, checked };
    newStore.set(id, node);
    stack.push(...node.childIds);
  }

  // Bubble up parents: O(depth)
  let parentId = newStore.get(targetId)!.parentId;
  while (parentId !== null) {
    const parent = newStore.get(parentId)!;
    const childStates = parent.childIds.map((id) => newStore.get(id)!.checked);
    const allChecked = childStates.every((c) => c === true);
    const allUnchecked = childStates.every((c) => c === false);
    const newChecked = allChecked
      ? true
      : allUnchecked
        ? false
        : "indeterminate";

    newStore.set(parentId, { ...parent, checked: newChecked });
    parentId = parent.parentId;
  }

  return newStore;
}

// Denormalize for rendering: O(n)
function denormalize(store: NormalizedStore, rootIds: number[]): NestedItem[] {
  return rootIds.map((id) => {
    const item = store.get(id)!;
    return {
      ...item,
      children:
        item.childIds.length > 0
          ? denormalize(store, item.childIds)
          : undefined,
    };
  });
}
```

**📊 Trade-off Matrix:**

| Operation          | Nested Tree                     | Normalized Map                   |
| ------------------ | ------------------------------- | -------------------------------- |
| **Read (render)**  | ✅ O(1) — already correct shape | ❌ O(n) denormalize              |
| **Write (update)** | ❌ O(n) deep clone              | ✅ O(1) lookup + O(depth) bubble |
| **Find by ID**     | ❌ O(n) search tree             | ✅ O(1) Map.get                  |
| **Move node**      | ❌ Complex splice operations    | ✅ Update parentId + childIds    |
| **Memory**         | ✅ Natural — no duplication     | 🟡 parentId/childIds overhead    |
| **Simplicity**     | ✅ Intuitive                    | ❌ Need normalize/denormalize    |
| **API alignment**  | ✅ APIs often return nested     | ❌ Need transform layer          |

**Khi nào chọn nào?**

| Scenario                       | Recommendation                |
| ------------------------------ | ----------------------------- |
| Small tree (< 100), read-heavy | Nested ✅                     |
| Large tree (> 1K), write-heavy | Normalized ✅                 |
| Need find-by-ID                | Normalized ✅                 |
| API returns nested             | Nested (avoid transform) ✅   |
| Collaborative editing          | Normalized (CRDT-friendly) ✅ |
| Simple prototype               | Nested ✅                     |

**🤔 Follow-up questions:**

| Câu hỏi                 | Trả lời                                                                                    |
| ----------------------- | ------------------------------------------------------------------------------------------ |
| "Redux recommendation?" | "Redux docs recommend normalization. `createEntityAdapter` in Redux Toolkit handles it."   |
| "Both shapes?"          | "Hybrid: normalized source-of-truth + useMemo denormalize for rendering. Best of both."    |
| "Database analogy?"     | "Nested = document DB (MongoDB). Normalized = relational DB (SQL). Same trade-offs."       |
| "Immer + nested?"       | "Immer makes nested updates easy: `draft[0].children[1].checked = true`. No manual clone." |

## PHẦN C: COMMON MISTAKES & HOW TO FIX

> ⚠️ Những lỗi phổ biến khi implement Nested Checkboxes.

### Mistake 1: Quên Handle Indeterminate State

```tsx
// ❌ WRONG: Chỉ handle true/false
function CheckboxInput({ checked }: { checked: boolean }) {
  return <input type="checkbox" checked={checked} />;
}
// Indeterminate state không bao giờ hiển thị!

// ✅ CORRECT: Handle cả 3 states
function CheckboxInput({ checked }: { checked: CheckboxValue }) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = checked === "indeterminate";
    }
  }, [checked]);

  return <input ref={ref} type="checkbox" checked={checked === true} />;
}
```

---

### Mistake 2: Mutate State Directly

```typescript
// ❌ WRONG: Direct mutation
const handleCheck = (checked: boolean, indices: number[]) => {
  const node = getNodeByPath(checkboxData, indices);
  node.checked = checked; // MUTATION!
  setCheckboxData(checkboxData); // Same reference - no re-render!
};

// ✅ CORRECT: Clone first
const handleCheck = (checked: boolean, indices: number[]) => {
  const newData = JSON.parse(JSON.stringify(checkboxData));
  const node = getNodeByPath(newData, indices);
  node.checked = checked;
  setCheckboxData(newData); // New reference - triggers re-render
};
```

**🤔 Câu hỏi interviewer có thể hỏi:**

| Câu hỏi                          | Cách trả lời                                                              |
| -------------------------------- | ------------------------------------------------------------------------- |
| "Tại sao React không re-render?" | "React dùng Object.is() để compare. Same reference = no change detected." |
| "Shallow clone đủ không?"        | "Không với nested data. Nested objects vẫn share reference."              |

---

### Mistake 3: Không Reset Ancestor States

```typescript
// ❌ WRONG: Chỉ update node được click
const handleCheck = (checked: boolean, indices: number[]) => {
  const newData = clone(checkboxData);
  const node = getNodeByPath(newData, indices);
  node.checked = checked;
  // Quên update ancestors!
  setCheckboxData(newData);
};
// UI bug: Parent vẫn unchecked dù all children checked

// ✅ CORRECT: Update cả ancestors
const handleCheck = (checked: boolean, indices: number[]) => {
  const newData = clone(checkboxData);
  const node = getNodeByPath(newData, indices);

  // Update descendants
  updateCheckboxAndDescendants(node, checked);

  // Update ancestors (CRITICAL!)
  resolveCheckboxStates(newData[indices[0]], indices.slice(1));

  setCheckboxData(newData);
};
```

---

### Mistake 4: Incorrect Indeterminate Logic

```typescript
// ❌ WRONG: Chỉ check immediate children
const hasCheckedChild = children.some((c) => c.checked === true);
const hasUncheckedChild = children.some((c) => c.checked === false);
if (hasCheckedChild && hasUncheckedChild) {
  parent.checked = "indeterminate";
}
// Bug: Không handle trường hợp child là indeterminate!

// ✅ CORRECT: Check cho cả 3 states
function determineParentState(children: CheckboxItem[]): CheckboxValue {
  const allChecked = children.every((c) => c.checked === true);
  const allUnchecked = children.every((c) => c.checked === false);

  if (allChecked) return true;
  if (allUnchecked) return false;
  return "indeterminate"; // Some checked, some not, or some indeterminate
}
```

---

### Mistake 5: Key Prop Issues

```tsx
// ❌ WRONG: Using index as key
{
  items.map((item, i) => (
    <li key={i}>
      {" "}
      {/* Bad if items can be reordered */}
      <CheckboxInput checked={item.checked} />
    </li>
  ));
}

// ✅ CORRECT: Using stable identifier
{
  items.map((item) => (
    <li key={item.id}>
      {" "}
      {/* Stable across re-renders */}
      <CheckboxInput checked={item.checked} />
    </li>
  ));
}
```

**🤔 Câu hỏi interviewer có thể hỏi:**

| Câu hỏi                   | Cách trả lời                                                           |
| ------------------------- | ---------------------------------------------------------------------- |
| "Index key có vấn đề gì?" | "Khi list reorder, React reuses wrong DOM elements. State bị lẫn lộn." |
| "Khi nào index key OK?"   | "Static lists không bao giờ reorder, filter, hoặc insert items."       |

---

### Mistake 6: Unnecessary Re-renders Toàn Bộ Tree

```tsx
// ❌ WRONG: Mỗi checkbox nhận hàm mới mỗi render
function CheckboxTree() {
  const [data, setData] = useState(initialData);

  return (
    <ul>
      {data.map((item, i) => (
        <CheckboxItem
          key={item.id}
          item={item}
          // ❌ ARROW FUNCTION = new reference mỗi render!
          onCheck={(checked) => {
            const newData = structuredClone(data);
            // ... update ...
            setData(newData);
          }}
        />
      ))}
    </ul>
  );
}
// Khi check 1 item → ALL items re-render vì onCheck mới!
// Tree 1000 items → 1000 re-renders cho 1 click

// ✅ CORRECT: Stable callback + React.memo
const CheckboxItem = memo(function CheckboxItem({
  item,
  indices,
  onCheck,
}: Props) {
  return (
    <li>
      <input
        type="checkbox"
        checked={item.checked === true}
        onChange={(e) => onCheck(e.target.checked, indices)}
      />
      {item.name}
    </li>
  );
});

function CheckboxTree() {
  const [data, setData] = useState(initialData);

  // ✅ useCallback với functional setState → stable reference
  const handleCheck = useCallback((checked: boolean, indices: number[]) => {
    setData((prev) => {
      const newData = structuredClone(prev);
      const node = getNodeByPath(newData, indices);
      updateCheckboxAndDescendants(node, checked);
      resolveCheckboxStates(newData[indices[0]], indices.slice(1));
      return newData;
    });
  }, []); // Empty deps → function never changes

  return (
    <ul>
      {data.map((item, i) => (
        <CheckboxItem
          key={item.id}
          item={item}
          indices={[i]}
          onCheck={handleCheck} // ← Same reference mỗi render
        />
      ))}
    </ul>
  );
}
// Chỉ items thực sự thay đổi re-render!
```

**🔍 Cách detect re-render thừa:**

```tsx
// DevTools: React Profiler → Highlight updates when components render

// Code: useEffect để log renders
function CheckboxItem({ item }: Props) {
  useEffect(() => {
    console.log(`Rendered: ${item.name}`);
  });
  // ...
}

// Code: why-did-you-render library
import whyDidYouRender from "@welldone-software/why-did-you-render";
whyDidYouRender(React, { trackAllPureComponents: true });
```

**📊 Re-render Impact:**

| Scenario              | Without memo  | With memo + stable callback |
| --------------------- | ------------- | --------------------------- |
| 100 items, click 1    | 100 renders   | 1-3 renders                 |
| 1,000 items, click 1  | 1,000 renders | 1-3 renders                 |
| 10,000 items, click 1 | 💥 Laggy      | 1-3 renders                 |

**🤔 Câu hỏi interviewer có thể hỏi:**

| Câu hỏi                | Cách trả lời                                                                                           |
| ---------------------- | ------------------------------------------------------------------------------------------------------ |
| "React.memo khi nào?"  | "Component render thường xuyên với same props. Đặc biệt list items, recursive tree nodes."             |
| "useCallback khi nào?" | "Khi function passed as prop to memoized child. Không memoize child → useCallback vô nghĩa."           |
| "React Compiler?"      | "Tự động memoize. Không cần memo/useCallback manual. Nhưng hiểu concept vẫn quan trọng cho interview." |
| "Profiler?"            | "React DevTools Profiler tab → record → click → xem components nào render + thời gian."                |

---

### Mistake 7: Dùng `useEffect` Cho Derived State

```tsx
// ❌ WRONG: useEffect để tính derived value → extra render + lag
function CheckboxTree() {
  const [data, setData] = useState(initialData);
  const [checkedCount, setCheckedCount] = useState(0);
  const [hasIndeterminate, setHasIndeterminate] = useState(false);

  // ❌ Effect chạy SAU render → 2 renders cho mỗi data change!
  useEffect(() => {
    setCheckedCount(countChecked(data));
    setHasIndeterminate(hasIndeterminateNodes(data));
  }, [data]);

  // Timeline: data changes → render 1 (stale count) → effect → setState → render 2 (correct count)
  // User sees FLASH of wrong count! 😱

  return (
    <div>
      <span>Checked: {checkedCount}</span> {/* Stale on first render! */}
      <CheckboxList items={data} />
    </div>
  );
}

// ✅ CORRECT: useMemo — derived inline, always in sync
function CheckboxTree() {
  const [data, setData] = useState(initialData);

  // ✅ Computed during render — always consistent
  const checkedCount = useMemo(() => countChecked(data), [data]);
  const hasIndeterminate = useMemo(() => hasIndeterminateNodes(data), [data]);

  // Or even simpler if cheap:
  // const checkedCount = countChecked(data); // No memo needed if fast

  return (
    <div>
      <span>Checked: {checkedCount}</span> {/* Always correct! */}
      <CheckboxList items={data} />
    </div>
  );
}

// ✅ ALSO CORRECT: Compute inside event handler
function CheckboxTree() {
  const [data, setData] = useState(initialData);

  const handleCheck = useCallback((checked: boolean, indices: number[]) => {
    setData((prev) => {
      const newData = structuredClone(prev);
      // ... update tree ...
      return newData;
    });
    // No need for separate checkedCount state!
  }, []);

  // Derive during render
  const summary = useMemo(
    () => ({
      total: countAll(data),
      checked: countChecked(data),
      indeterminate: countIndeterminate(data),
    }),
    [data],
  );

  return <TreeWithSummary data={data} summary={summary} />;
}
```

**📊 useEffect vs useMemo cho derived state:**

| Aspect            | `useEffect` + `setState`          | `useMemo`          |
| ----------------- | --------------------------------- | ------------------ |
| Render count      | 2 renders per change              | 1 render           |
| Consistency       | ❌ Flash of stale value           | ✅ Always in sync  |
| Performance       | ❌ Extra render cycle             | ✅ Computed inline |
| Code clarity      | ❌ Effect = side effect illusion  | ✅ Clearly derived |
| React team advice | ❌ "You Might Not Need an Effect" | ✅ Recommended     |

**🤔 Câu hỏi interviewer có thể hỏi:**

| Câu hỏi                            | Cách trả lời                                                                                    |
| ---------------------------------- | ----------------------------------------------------------------------------------------------- |
| "useEffect viết state OK khi nào?" | "Side effects: API calls, subscriptions, DOM manipulation. KHÔNG cho derived/computed values."  |
| "useMemo vs compute inline?"       | "Inline nếu cheap (< 1ms). useMemo nếu expensive (tree traversal, sort, filter)."               |
| "Double render vấn đề gì?"         | "Flash of incorrect UI. User thấy wrong count rồi correct count. Hại UX."                       |
| "React docs nói gì?"               | "\"You Might Not Need an Effect\" — bài viết chính thức khuyên tránh effect cho derived state." |

---

### Mistake 8: Circular Updates (Infinite Loop)

```tsx
// ❌ WRONG: useEffect triggers setState triggers useEffect → ∞ loop!
function CheckboxTree() {
  const [data, setData] = useState(initialData);
  const [filter, setFilter] = useState("");
  const [filteredData, setFilteredData] = useState(data);

  // ❌ DANGER: data thay đổi → effect → setFilteredData → ???
  useEffect(() => {
    const result = filterTree(data, filter);
    setFilteredData(result);
  }, [data, filter]);

  // Nếu filterTree trả về new array reference mỗi lần:
  // data change → effect → setFilteredData → re-render →
  // nếu có effect khác depend filteredData → setState → re-render → ...
  // React 18 có bail-out nhưng vẫn wasteful

  // ❌ WORSE: Effect writes back to same state it reads
  useEffect(() => {
    // Validate + fix data
    const fixed = validateAndFixTree(data);
    if (JSON.stringify(fixed) !== JSON.stringify(data)) {
      setData(fixed); // ← Writes to data → triggers this effect → LOOP!
    }
  }, [data]);
}

// ✅ CORRECT: Derive inline, no effect needed
function CheckboxTree() {
  const [data, setData] = useState(initialData);
  const [filter, setFilter] = useState("");

  // ✅ Derive during render — no effect, no extra state
  const filteredData = useMemo(() => filterTree(data, filter), [data, filter]);

  return <CheckboxList items={filteredData} />;
}

// ✅ CORRECT: Validate in event handler, not effect
function CheckboxTree() {
  const [data, setData] = useState(() => {
    // Validate ONCE during init
    return validateAndFixTree(initialData);
  });

  const handleDataUpdate = useCallback((newData: CheckboxItem[]) => {
    // Validate in handler, not in effect
    setData(validateAndFixTree(newData));
  }, []);
}
```

**🔍 Detecting infinite loops:**

```tsx
// Console: "Maximum update depth exceeded"
// DevTools: Component renders rapidly, never stabilizes

// Debug technique: add render count
function CheckboxTree() {
  const renderCount = useRef(0);
  renderCount.current++;
  console.log(`Render #${renderCount.current}`);
  // If this number keeps growing → infinite loop!
}
```

**📊 Circular Update Patterns:**

| Pattern                                                     | Risk        | Fix                                       |
| ----------------------------------------------------------- | ----------- | ----------------------------------------- |
| `useEffect` → `setState` on same data                       | 🔴 High     | Validate in handler or init               |
| `useEffect` A → `setState` B → `useEffect` B → `setState` A | 🔴 Critical | useMemo for derived state                 |
| `useEffect` with object dep (new ref each render)           | 🟡 Medium   | useMemo the object, or use primitive deps |
| `onChange` → parent setState → child re-render → onChange   | 🟡 Medium   | Controlled component pattern              |

**🤔 Câu hỏi interviewer có thể hỏi:**

| Câu hỏi                | Cách trả lời                                                                                               |
| ---------------------- | ---------------------------------------------------------------------------------------------------------- |
| "React detect loop?"   | "React 18 bails out after ~50 re-renders cùng state. Throws error: 'Maximum update depth exceeded'."       |
| "Object deps?"         | "`useEffect(() => {}, [obj])` — obj mới mỗi render = effect chạy mỗi render. Dùng primitive hoặc useMemo." |
| "Infinite loop debug?" | "1. Check render count. 2. Check effect dependencies. 3. Search for setState inside useEffect."            |

---

### Mistake 9: Uncontrolled-to-Controlled Warning

```tsx
// ❌ WRONG: checked starts undefined → becomes boolean
function CheckboxInput({ item }: Props) {
  return (
    <input
      type="checkbox"
      // item.checked có thể undefined lần đầu!
      checked={item.checked} // undefined → controlled becomes uncontrolled!
    />
  );
}
// Warning: A component is changing an uncontrolled input to be controlled.

// ❌ ALSO WRONG: Mixing checked and defaultChecked
function CheckboxInput({ item }: Props) {
  return (
    <input
      type="checkbox"
      checked={item.checked === true}
      defaultChecked={false} // ← Can't have both! defaultChecked ignored
    />
  );
}

// ✅ CORRECT: Always provide boolean + onChange
function CheckboxInput({ item, onChange }: Props) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = item.checked === "indeterminate";
    }
  }, [item.checked]);

  return (
    <input
      ref={ref}
      type="checkbox"
      checked={item.checked === true} // Always boolean ✅
      onChange={(e) => onChange(e.target.checked)}
    />
  );
}

// ✅ CORRECT: Type system prevents undefined
interface CheckboxItem {
  id: number;
  name: string;
  checked: boolean | "indeterminate"; // Never undefined!
  children?: CheckboxItem[];
}

// ✅ Initialize with explicit false
function initializeTree(raw: RawItem[]): CheckboxItem[] {
  return raw.map((item) => ({
    ...item,
    checked: item.checked ?? false, // Nullish coalescing → always defined
    children: item.children ? initializeTree(item.children) : undefined,
  }));
}
```

**📊 Controlled vs Uncontrolled:**

| Aspect             | Controlled                          | Uncontrolled           |
| ------------------ | ----------------------------------- | ---------------------- |
| **Value source**   | React state (`checked`)             | DOM (`defaultChecked`) |
| **Update**         | `onChange` → `setState` → re-render | DOM handles internally |
| **Read value**     | `state` variable                    | `ref.current.checked`  |
| **Use case**       | Forms with validation, tree         | Simple forms           |
| **Switch between** | ❌ Warning!                         | ❌ Warning!            |

**🤔 Câu hỏi interviewer có thể hỏi:**

| Câu hỏi                       | Cách trả lời                                                                                       |
| ----------------------------- | -------------------------------------------------------------------------------------------------- |
| "Controlled vs uncontrolled?" | "Controlled: React owns value. Uncontrolled: DOM owns value. Checkbox tree = always controlled."   |
| "Tại sao không mix?"          | "React can't decide who's in charge. Leads to bugs where UI doesn't match state."                  |
| "readOnly?"                   | "`checked` without `onChange` = read-only. Add `readOnly` prop or `onChange` to suppress warning." |

---

### Mistake 10: Deep Clone Performance Trap

```tsx
// ❌ WRONG: JSON.parse(JSON.stringify()) cho mỗi click
function handleCheck(checked: boolean, indices: number[]) {
  setData((prev) => {
    // Problems:
    // 1. Loses Date objects (→ string)
    // 2. Loses undefined values (→ omitted)
    // 3. Loses functions, Symbols
    // 4. Throws on circular references
    // 5. SLOW for large trees (serialize + parse)
    const newData = JSON.parse(JSON.stringify(prev));
    // ...
    return newData;
  });
}

// ❌ ALSO SLOW: structuredClone cho mỗi click trên large tree
function handleCheck(checked: boolean, indices: number[]) {
  setData((prev) => {
    // Better than JSON but still O(n) — copies ENTIRE tree
    // 10,000 nodes → 10,000 objects cloned mỗi click!
    const newData = structuredClone(prev);
    // ...
    return newData;
  });
}
```

**✅ Progressive solutions:**

```tsx
// ✅ Level 1: structuredClone (OK cho < 1000 nodes)
// Simple, correct, good enough for most cases
const newData = structuredClone(prev);

// ✅ Level 2: Structural sharing (OK cho < 10,000 nodes)
// Section 27 — only copy modified path
function structuralUpdate(data, indices, checked) {
  const [head, ...tail] = indices;
  return data.map((item, i) => {
    if (i !== head) return item; // Same reference
    // ... only copy this path
  });
}

// ✅ Level 3: Immer (OK cho any size, slightly slower than manual)
import { produce } from "immer";
const handleCheck = useCallback((checked: boolean, indices: number[]) => {
  setData(
    produce((draft) => {
      const node = getNodeByPath(draft, indices);
      updateCheckboxAndDescendants(node, checked); // Mutate draft directly!
      resolveCheckboxStates(draft[indices[0]], indices.slice(1));
    }),
  );
}, []);

// ✅ Level 4: Normalized store (best cho > 10,000 nodes)
// Section 38 — flat Map, O(1) lookup
function handleCheck(targetId: number, checked: boolean) {
  setStore((prev) => updateNormalized(prev, targetId, checked));
}
```

**📊 Clone Strategy Decision:**

| Tree Size      | Recommended                 | Why                            |
| -------------- | --------------------------- | ------------------------------ |
| < 100 nodes    | `structuredClone`           | Simple, fast enough            |
| 100 - 1,000    | `structuredClone` or Immer  | Balance simplicity/performance |
| 1,000 - 10,000 | Structural sharing or Immer | Avoid full copy                |
| > 10,000       | Normalized store            | O(1) updates essential         |

**🤔 Câu hỏi interviewer có thể hỏi:**

| Câu hỏi                    | Cách trả lời                                                                              |
| -------------------------- | ----------------------------------------------------------------------------------------- |
| "JSON.parse problems?"     | "Loses Date, undefined, Symbol, functions. Throws on circular. Slow (string conversion)." |
| "structuredClone vs JSON?" | "structuredClone handles Date, RegExp, Map, Set, ArrayBuffer. Faster. But still O(n)."    |
| "Immer overhead?"          | "Proxy creation ~2x slower than manual. But simpler code + automatic structural sharing." |
| "When to optimize?"        | "Profile first! Most business trees < 500 nodes. structuredClone fine until proven slow." |

---

### Mistake 11: Missing Accessibility (A11Y)

```tsx
// ❌ WRONG: No ARIA, no keyboard navigation
function CheckboxTree({ data }: Props) {
  return (
    <div>
      {data.map((item) => (
        <div key={item.id}>
          <input type="checkbox" checked={item.checked === true} />
          <span>{item.name}</span>
          {item.children && <CheckboxTree data={item.children} />}
        </div>
      ))}
    </div>
  );
}
// Problems:
// 1. No tree role → screen reader says "group of checkboxes" not "tree"
// 2. No keyboard arrow navigation
// 3. No expand/collapse announcement
// 4. Label not linked to checkbox
// 5. Indeterminate not announced

// ✅ CORRECT: Full WCAG 2.1 compliant tree
function AccessibleCheckboxTree({ data }: Props) {
  return (
    <ul role="tree" aria-label="Category selection">
      {data.map((item, i) => (
        <AccessibleCheckboxItem
          key={item.id}
          item={item}
          indices={[i]}
          level={1}
        />
      ))}
    </ul>
  );
}

function AccessibleCheckboxItem({ item, indices, level }: ItemProps) {
  const id = useId();
  const [expanded, setExpanded] = useState(true);
  const hasChildren = item.children && item.children.length > 0;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowRight":
        if (hasChildren && !expanded) setExpanded(true);
        break;
      case "ArrowLeft":
        if (hasChildren && expanded) setExpanded(false);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        handleCheck(!item.checked);
        break;
    }
  };

  return (
    <li
      role="treeitem"
      aria-expanded={hasChildren ? expanded : undefined}
      aria-level={level}
      aria-checked={item.checked === "indeterminate" ? "mixed" : item.checked}
      aria-label={item.name}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div className="node-row">
        <input
          id={`${id}-checkbox`}
          type="checkbox"
          checked={item.checked === true}
          aria-describedby={`${id}-desc`}
          tabIndex={-1} // Tree item handles focus, not checkbox
          onChange={(e) => handleCheck(e.target.checked)}
        />
        <label htmlFor={`${id}-checkbox`}>{item.name}</label>
        <span id={`${id}-desc`} className="sr-only">
          {item.checked === "indeterminate"
            ? "partially selected"
            : item.checked
              ? "selected"
              : "not selected"}
          {hasChildren
            ? `, ${item.children!.length} sub-items, ${expanded ? "expanded" : "collapsed"}`
            : ""}
        </span>
      </div>

      {hasChildren && expanded && (
        <ul role="group">
          {item.children!.map((child, i) => (
            <AccessibleCheckboxItem
              key={child.id}
              item={child}
              indices={[...indices, i]}
              level={level + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
```

**📊 A11Y Checklist:**

| Requirement         | ARIA                             | Implementation                    |
| ------------------- | -------------------------------- | --------------------------------- |
| Tree structure      | `role="tree"`, `role="treeitem"` | On `<ul>` and `<li>`              |
| Nesting level       | `aria-level`                     | Pass as prop, increment per level |
| Expand/collapse     | `aria-expanded`                  | Only on items with children       |
| Check state         | `aria-checked="mixed"`           | For indeterminate state           |
| Label association   | `htmlFor`, `aria-label`          | Link `<label>` to `<input>`       |
| Keyboard navigation | `ArrowRight/Left/Up/Down`        | Focus management                  |
| Screen reader desc  | `aria-describedby`               | Status + children count           |

**🤔 Câu hỏi interviewer có thể hỏi:**

| Câu hỏi               | Cách trả lời                                                                                     |
| --------------------- | ------------------------------------------------------------------------------------------------ |
| "aria-checked mixed?" | "HTML `indeterminate` is visual only. `aria-checked='mixed'` announces state to screen readers." |
| "Keyboard pattern?"   | "WAI-ARIA TreeView: ArrowRight=expand, ArrowLeft=collapse, Space=toggle, Home/End=first/last."   |
| "Tab vs Arrow?"       | "Tab enters/exits tree. Arrow keys navigate within tree. Only 1 treeitem tabIndex=0 at a time."  |
| "Testing a11y?"       | "axe-core, Lighthouse, jest-axe. Manual: use NVDA/VoiceOver to navigate tree."                   |

---

### Mistake 12: Race Conditions Trong Async Tree Loading

```tsx
// ❌ WRONG: Expand triggers fetch — responses arrive out of order
function CheckboxItem({ item, onLoadChildren }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleExpand = async () => {
    setExpanded(!expanded);
    if (!item.children) {
      setLoading(true);
      // ❌ If user clicks expand/collapse rapidly:
      // Request 1 sent → Request 2 sent → Response 2 arrives → Response 1 arrives
      // UI shows STALE data from Request 1! 💀
      const children = await fetchChildren(item.id);
      setLoading(false);
      onLoadChildren(item.id, children); // May be out of date!
    }
  };
}

// ✅ CORRECT: AbortController cancels previous request
function CheckboxItem({ item, onLoadChildren }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const handleExpand = useCallback(async () => {
    setExpanded((prev) => !prev);

    if (!item.children) {
      // Cancel previous request
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      try {
        const children = await fetchChildren(item.id, {
          signal: controller.signal,
        });

        // Only update if this request wasn't aborted
        if (!controller.signal.aborted) {
          onLoadChildren(item.id, children);
          setLoading(false);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          // Expected — user clicked again. Do nothing.
          return;
        }
        setLoading(false);
        console.error("Failed to load children:", err);
      }
    }
  }, [item.id, item.children, onLoadChildren]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  return (
    <li>
      <button onClick={handleExpand} aria-expanded={expanded}>
        {loading ? "⏳" : expanded ? "▼" : "▶"} {item.name}
      </button>
      {expanded && item.children && (
        <ul>
          {item.children.map((child, i) => (
            <CheckboxItem
              key={child.id}
              item={child}
              onLoadChildren={onLoadChildren}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

// ✅ ALSO GOOD: useTransition for non-urgent updates
function CheckboxItem({ item }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleExpand = () => {
    // Expand immediately (urgent)
    setExpanded((prev) => !prev);

    // Load children in transition (non-urgent, can be interrupted)
    startTransition(async () => {
      const children = await fetchChildren(item.id);
      updateTree(item.id, children);
    });
  };

  return (
    <li>
      <button onClick={handleExpand} disabled={isPending}>
        {isPending ? "⏳" : expanded ? "▼" : "▶"} {item.name}
      </button>
    </li>
  );
}
```

**📊 Race Condition Patterns:**

| Pattern                           | Risk                           | Solution                    |
| --------------------------------- | ------------------------------ | --------------------------- |
| Multiple fetches, no cancel       | 🔴 Stale data overwrites fresh | `AbortController`           |
| setState after unmount            | 🟡 Warning (React 18 OK)       | Check `signal.aborted`      |
| Optimistic update + server reject | 🟡 UI out of sync              | Rollback on error           |
| Concurrent expand/collapse        | 🟡 Flicker                     | `useTransition` or debounce |
| Search while typing               | 🟡 Old results flash           | Debounce + abort previous   |

**🤔 Câu hỏi interviewer có thể hỏi:**

| Câu hỏi               | Cách trả lời                                                                                             |
| --------------------- | -------------------------------------------------------------------------------------------------------- |
| "AbortController?"    | "Web API to cancel fetch. Pass signal to fetch. Call abort() to cancel. Throws AbortError."              |
| "useTransition?"      | "React 18. Marks update as non-urgent. React can interrupt if newer update arrives."                     |
| "Debounce vs abort?"  | "Debounce delays request (saves bandwidth). Abort cancels in-flight (saves processing). Often use both." |
| "Optimistic updates?" | "Update UI immediately, revert if server rejects. Better UX but complex error handling."                 |

---

### Mistake 13: Prop Drilling Qua Nhiều Levels

```tsx
// ❌ WRONG: onCheck truyền qua 5+ levels — khó maintain, dễ quên
function App() {
  const [data, setData] = useState(initialData);

  const handleCheck = useCallback((checked: boolean, indices: number[]) => {
    // ... update logic
  }, []);

  return (
    <Layout onCheck={handleCheck}>
      {" "}
      {/* Level 1 */}
      <Sidebar onCheck={handleCheck}>
        {" "}
        {/* Level 2 */}
        <TreePanel onCheck={handleCheck}>
          {" "}
          {/* Level 3 */}
          <CheckboxTree data={data} onCheck={handleCheck}>
            {" "}
            {/* Level 4 */}
            <CheckboxItem onCheck={handleCheck} /> {/* Level 5 */}
          </CheckboxTree>
        </TreePanel>
      </Sidebar>
    </Layout>
  );
}
// Problem: Layout, Sidebar, TreePanel DON'T USE onCheck — just pass through!
// Adding/removing a prop = edit 5 files 😱

// ✅ CORRECT: Context cho shared state
interface TreeContextValue {
  data: CheckboxItem[];
  onCheck: (checked: boolean, indices: number[]) => void;
  onCheckAll: (checked: boolean) => void;
  expandedIds: Set<number>;
  toggleExpand: (id: number) => void;
}

const TreeContext = createContext<TreeContextValue | null>(null);

function useTreeContext() {
  const ctx = useContext(TreeContext);
  if (!ctx) throw new Error("useTreeContext must be used within TreeProvider");
  return ctx;
}

function TreeProvider({ children, initialData }: ProviderProps) {
  const [data, setData] = useState(initialData);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const onCheck = useCallback((checked: boolean, indices: number[]) => {
    setData((prev) => {
      const newData = structuredClone(prev);
      const node = getNodeByPath(newData, indices);
      updateCheckboxAndDescendants(node, checked);
      resolveCheckboxStates(newData[indices[0]], indices.slice(1));
      return newData;
    });
  }, []);

  const onCheckAll = useCallback((checked: boolean) => {
    setData((prev) => {
      const newData = structuredClone(prev);
      setAllChecked(newData, checked);
      return newData;
    });
  }, []);

  const toggleExpand = useCallback((id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ data, onCheck, onCheckAll, expandedIds, toggleExpand }),
    [data, onCheck, onCheckAll, expandedIds, toggleExpand],
  );

  return <TreeContext.Provider value={value}>{children}</TreeContext.Provider>;
}

// Components just consume context — no prop drilling!
function CheckboxItem({
  item,
  indices,
}: {
  item: CheckboxItem;
  indices: number[];
}) {
  const { onCheck, expandedIds, toggleExpand } = useTreeContext();
  const isExpanded = expandedIds.has(item.id);

  return (
    <li>
      <input
        type="checkbox"
        checked={item.checked === true}
        onChange={(e) => onCheck(e.target.checked, indices)}
      />
      {item.name}
    </li>
  );
}

// ✅ Usage — clean hierarchy, no prop drilling
function App() {
  return (
    <TreeProvider initialData={data}>
      <Layout>
        <Sidebar>
          <TreePanel>
            <CheckboxTree />
          </TreePanel>
        </Sidebar>
      </Layout>
    </TreeProvider>
  );
}
```

**📊 Prop Drilling vs Context vs State Lib:**

| Approach | Levels OK  | Boilerplate | Re-render Control | Best For      |
| -------- | ---------- | ----------- | ----------------- | ------------- |
| Props    | 1-2 levels | ✅ Minimal  | ✅ Precise        | Simple trees  |
| Context  | 3+ levels  | 🟡 Medium   | 🟡 All consumers  | Mid-size apps |
| Zustand  | Any        | ✅ Low      | ✅ Selector-based | Large apps    |
| Redux    | Any        | ❌ High     | ✅ Fine-grained   | Enterprise    |

**🤔 Câu hỏi interviewer có thể hỏi:**

| Câu hỏi                      | Cách trả lời                                                                                      |
| ---------------------------- | ------------------------------------------------------------------------------------------------- |
| "Context re-render problem?" | "All consumers re-render when value changes. Fix: split contexts, useMemo value, or use Zustand." |
| "Khi nào prop drilling OK?"  | "1-2 levels, few props. Explicit data flow. Don't over-engineer with Context for 2 levels."       |
| "Context vs Redux?"          | "Context = simple sharing. Redux = complex state + middleware + devtools + time-travel."          |
| "Zustand vs Context?"        | "Zustand = no Provider, selector-based re-render, simpler API, works outside React."              |

---

### Mistake 14: TypeScript Loose Typing

```tsx
// ❌ WRONG: `any` everywhere — no safety
interface CheckboxItem {
  id: any; // Could be string, number, object...
  name: any; // Same
  checked: any; // boolean? string? number? who knows
  children: any; // undefined? null? array? object?
}

function handleCheck(checked: any, indices: any) {
  // No autocomplete, no error catching, no safety!
  const node = getNodeByPath(data, indices);
  node.checked = checked; // Could set checked to "banana" 🍌
}

// ❌ ALSO BAD: Loose union types
type CheckboxValue = boolean | string | number | null | undefined;
// Too many possibilities — which string? which number?

// ✅ CORRECT: Strict types with discriminated unions
type CheckboxValue = boolean | "indeterminate";

interface CheckboxItem {
  readonly id: number;
  readonly name: string;
  checked: CheckboxValue;
  children?: CheckboxItem[]; // explicitly optional, never null
}

// ✅ Type-safe handler
function handleCheck(checked: boolean, indices: readonly number[]): void {
  setData((prev) => {
    const newData = structuredClone(prev);
    const node = getNodeByPath(newData, indices);
    updateCheckboxAndDescendants(node, checked);
    resolveCheckboxStates(newData[indices[0]], indices.slice(1));
    return newData;
  });
}

// ✅ Generic tree types for reuse
interface TreeNode<T> {
  readonly id: number;
  readonly data: T;
  children?: TreeNode<T>[];
}

type CheckboxTreeNode = TreeNode<{
  name: string;
  checked: CheckboxValue;
}>;

// ✅ Zod validation for runtime safety
import { z } from "zod";

const checkboxItemSchema: z.ZodType<CheckboxItem> = z.lazy(() =>
  z.object({
    id: z.number(),
    name: z.string().min(1),
    checked: z.union([z.boolean(), z.literal("indeterminate")]),
    children: z.array(checkboxItemSchema).optional(),
  }),
);

// Validate API response
function parseTreeData(raw: unknown): CheckboxItem[] {
  const result = z.array(checkboxItemSchema).safeParse(raw);
  if (!result.success) {
    console.error("Invalid tree data:", result.error.format());
    return [];
  }
  return result.data;
}
```

**📊 Type Safety Levels:**

| Level | Approach                          | Safety               | Effort    |
| ----- | --------------------------------- | -------------------- | --------- |
| 0     | `any` everywhere                  | ❌ None              | ✅ Zero   |
| 1     | Basic types (`boolean`, `string`) | 🟡 Compile-time      | ✅ Low    |
| 2     | Strict interfaces + unions        | ✅ Compile-time      | 🟡 Medium |
| 3     | Generics + readonly               | ✅ Strong            | 🟡 Medium |
| 4     | Zod/Joi runtime validation        | ✅ Compile + Runtime | ❌ Higher |

**🤔 Câu hỏi interviewer có thể hỏi:**

| Câu hỏi               | Cách trả lời                                                                                        |
| --------------------- | --------------------------------------------------------------------------------------------------- |
| "any vs unknown?"     | "`any` disables type checking. `unknown` forces you to narrow before use. Always prefer `unknown`." |
| "readonly?"           | "Prevents accidental mutation: `readonly id: number`. `ReadonlyArray<T>` for arrays."               |
| "Runtime validation?" | "TypeScript erased at runtime. API data untyped. Zod validates at runtime + infers TS types."       |
| "Generic tree?"       | "`TreeNode<T>` — reuse tree structure. `T` = checkbox data, file data, org chart data, etc."        |

---

### Mistake 15: Memory Leaks Trong Long-Lived Tree Components

```tsx
// ❌ WRONG: Event listeners accumulate — never removed
function CheckboxTree({ data }: Props) {
  useEffect(() => {
    // Added every time data changes...
    const handler = () => console.log("resize!");
    window.addEventListener("resize", handler);
    // NO CLEANUP! Listeners accumulate! 💀
  }, [data]); // Runs on every data change
}
// After 100 data updates → 100 resize listeners! Memory grows forever.

// ❌ WRONG: Closures capture large objects
function CheckboxTree({ data }: Props) {
  const [history, setHistory] = useState<CheckboxItem[][]>([]);

  const handleCheck = useCallback((checked: boolean, indices: number[]) => {
    setData((prev) => {
      // ❌ Storing ENTIRE tree in history for undo
      // 100 undos × 10,000 nodes = 1,000,000 objects in memory!
      setHistory((h) => [...h, structuredClone(prev)]);

      const newData = structuredClone(prev);
      // ... update ...
      return newData;
    });
  }, []);
}

// ✅ CORRECT: Cleanup + bounded history
function CheckboxTree({ data }: Props) {
  // Cleanup effect properly
  useEffect(() => {
    const handler = () => console.log("resize!");
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler); // ✅ Cleanup
  }, []); // Run once, cleanup on unmount
}

// ✅ CORRECT: Bounded undo history
const MAX_HISTORY = 20;

function useUndoRedo<T>(initial: T) {
  const [state, setState] = useState({
    current: initial,
    past: [] as T[],
    future: [] as T[],
  });

  const update = useCallback((newValue: T) => {
    setState((prev) => ({
      current: newValue,
      past: [...prev.past.slice(-MAX_HISTORY + 1), prev.current], // Bounded!
      future: [], // Clear redo on new action
    }));
  }, []);

  const undo = useCallback(() => {
    setState((prev) => {
      if (prev.past.length === 0) return prev;
      return {
        current: prev.past[prev.past.length - 1],
        past: prev.past.slice(0, -1),
        future: [prev.current, ...prev.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setState((prev) => {
      if (prev.future.length === 0) return prev;
      return {
        current: prev.future[0],
        past: [...prev.past, prev.current],
        future: prev.future.slice(1),
      };
    });
  }, []);

  return {
    value: state.current,
    update,
    undo,
    redo,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
  };
}
```

**📊 Memory Leak Sources:**

| Source                  | Detection                             | Fix                              |
| ----------------------- | ------------------------------------- | -------------------------------- |
| Event listeners         | Chrome DevTools → Performance Monitor | `removeEventListener` in cleanup |
| Unbounded arrays        | Memory tab → Heap snapshots           | `slice(-MAX)` to cap size        |
| Closure over large data | Heap diff between snapshots           | WeakRef, clear references        |
| Detached DOM nodes      | Elements panel → Detached             | Proper unmount cleanup           |
| setInterval no cleanup  | Timer keeps firing                    | `clearInterval` in cleanup       |
| WebSocket no close      | Network tab keeps open                | `ws.close()` in cleanup          |

**🤔 Câu hỏi interviewer có thể hỏi:**

| Câu hỏi                    | Cách trả lời                                                                             |
| -------------------------- | ---------------------------------------------------------------------------------------- |
| "Memory leak detect?"      | "Chrome → Performance Monitor → JS Heap Size. If keeps growing = leak."                  |
| "WeakRef?"                 | "Reference that doesn't prevent GC. Good for caches. `new WeakRef(obj)`, `ref.deref()`." |
| "Undo history size?"       | "Cap at 20-50 steps. Beyond that, users don't need. Saves memory significantly."         |
| "React strict mode helps?" | "Yes! Double-mounts in dev expose missing cleanup. Fix cleanup = fix leaks."             |

---

### Mistake 16: Wrong `useEffect` Dependencies

```tsx
// ❌ WRONG: Empty deps when should include data
function CheckboxTree({ data }: Props) {
  useEffect(() => {
    // Supposed to sync with external system when data changes
    syncToExternalDashboard(data);
  }, []); // ❌ Empty deps — only runs on mount!
  // When user checks items → dashboard NOT updated!
}

// ❌ WRONG: Object/array dep creates infinite loop
function CheckboxTree({ config }: Props) {
  const options = { showCount: true, theme: "dark" }; // NEW object every render!

  useEffect(() => {
    applyOptions(options);
  }, [options]); // ❌ New reference every render → runs every render!
}

// ❌ WRONG: Function dep without useCallback
function CheckboxTree({ onUpdate }: Props) {
  useEffect(() => {
    onUpdate(processedData);
  }, [onUpdate, processedData]);
  // ❌ If parent doesn't wrap onUpdate in useCallback → runs every render!
}

// ✅ CORRECT: Proper dependencies
function CheckboxTree({ data, onUpdate }: Props) {
  // Sync to external system — properly depends on data
  useEffect(() => {
    syncToExternalDashboard(data);
  }, [data]); // ✅ Runs when data actually changes

  // Object dep — memoize it
  const options = useMemo(
    () => ({ showCount: true, theme: "dark" }),
    [], // static options → compute once
  );

  useEffect(() => {
    applyOptions(options);
  }, [options]); // ✅ Stable reference → runs once

  // Function dep — use ref if can't control parent
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    onUpdateRef.current(processedData); // Always latest function
  }, [processedData]); // ✅ Only depends on data, not function
}
```

**📊 Dependency Rules:**

| Dep Type                   | Issue                           | Fix                         |
| -------------------------- | ------------------------------- | --------------------------- |
| Missing deps               | Effect stale, doesn't re-run    | Add to array (ESLint warns) |
| Object literal             | New ref every render → infinite | `useMemo` the object        |
| Array literal              | New ref every render → infinite | `useMemo` or `useState`     |
| Inline function            | New ref every render → infinite | `useCallback` or `useRef`   |
| External function prop     | May change every render         | `useRef` pattern            |
| Primitive (string, number) | ✅ Works correctly              | Value comparison            |

**🤔 Câu hỏi interviewer có thể hỏi:**

| Câu hỏi                | Cách trả lời                                                                                                       |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------ |
| "ESLint rule?"         | "`react-hooks/exhaustive-deps`. ALWAYS enable. Catches 90% of dep issues."                                         |
| "useRef for callback?" | "Store latest callback in ref. Effect reads ref.current. Avoids function in deps. Common pattern."                 |
| "Object.is()?"         | "React uses Object.is for dep comparison. {} !== {} (reference). 42 === 42 (value). Use primitives when possible." |
| "Disable ESLint rule?" | "NEVER with `// eslint-disable`. If ESLint warns, fix the code. Disabling hides real bugs."                        |

---

### Mistake 17: Over-Engineering Small Trees

```tsx
// ❌ OVER-ENGINEERED: 20 nodes, thêm virtualization + normalization + worker
function SmallCheckboxTree({ data }: Props) {
  // Normalized store cho... 20 items 🤦
  const normalizedStore = useMemo(() => normalize(data), [data]);

  // Virtual scroll cho... list fits on screen 🤦
  const virtualizer = useVirtualizer({
    count: flatItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 35,
  });

  // Web Worker cho... 20 node update 🤦
  const worker = useMemo(() => new Worker("./treeWorker.ts"), []);

  // Immer + Zustand + React Query cho... local state 🤦
  const store = useTreeStore();

  // Memoize everything cho... 20 items 🤦
  const items = useMemo(() => data.map(/* ... */), [data]);
  const handleCheck = useCallback(/* ... */, []);
  const memoizedTree = useMemo(() => <Tree items={items} />, [items]);
}
// 500 lines of infrastructure cho feature that could be 50 lines! 😱

// ✅ RIGHT-SIZED: Start simple, optimize when needed
function SmallCheckboxTree({ data: initialData }: Props) {
  const [data, setData] = useState(initialData);

  const handleCheck = (checked: boolean, indices: number[]) => {
    const newData = structuredClone(data); // Fine for 20 nodes!
    const node = getNodeByPath(newData, indices);
    updateCheckboxAndDescendants(node, checked);
    resolveCheckboxStates(newData[indices[0]], indices.slice(1));
    setData(newData);
  };

  return (
    <ul>
      {data.map((item, i) => (
        <CheckboxItem
          key={item.id}
          item={item}
          indices={[i]}
          onCheck={handleCheck}
        />
      ))}
    </ul>
  );
}
// 50 lines, readable, performant enough. Ship it! 🚀
```

**📊 When to Add Complexity:**

| Optimization   | Add When                                    | Don't Add When           |
| -------------- | ------------------------------------------- | ------------------------ |
| `React.memo`   | > 100 items, profiler shows re-render issue | < 50 items               |
| `useCallback`  | Paired with memo'd child                    | No memo'd children       |
| Virtualization | > 500 visible items                         | All items fit on screen  |
| Normalization  | > 1000 items, frequent find-by-ID           | Small tree, render-heavy |
| Web Worker     | > 10,000 nodes, complex computation         | Simple operations        |
| State library  | Multiple components share complex state     | Single component         |
| Immer          | Deep nesting (5+ levels), many updates      | Shallow tree             |

**📐 Rule of thumb:**

```
📏 YAGNI (You Aren't Gonna Need It)
1. Make it work (structuredClone, simple state)
2. Make it right (proper types, error handling)
3. Make it fast (ONLY if profiler shows problem)

"Premature optimization is the root of all evil" — Donald Knuth
```

**🤔 Câu hỏi interviewer có thể hỏi:**

| Câu hỏi                   | Cách trả lời                                                                                              |
| ------------------------- | --------------------------------------------------------------------------------------------------------- |
| "Over-engineering signs?" | "Code 10x longer than needed. Abstractions without use cases. Libraries for simple tasks."                |
| "When to optimize?"       | "Profile first. React DevTools Profiler. Chrome Performance tab. Only optimize measured bottlenecks."     |
| "Interview tradeoff?"     | "Start simple in interview. Mention optimizations as 'next steps'. Shows you know both simple + complex." |
| "YAGNI?"                  | "You Aren't Gonna Need It. Don't build for hypothetical future. Build for current requirements."          |

---

### Mistake 18: Testing Anti-Patterns

```tsx
// ❌ WRONG: Testing implementation details, not behavior
describe("CheckboxTree", () => {
  it("should update internal state", () => {
    const { result } = renderHook(() => useCheckboxTree(mockData));

    // ❌ Testing STATE SHAPE — brittle! Breaks when you refactor
    expect(result.current.data[0].children[0].checked).toBe(false);

    act(() => result.current.check([0, 0], true));

    // ❌ Testing internal data structure
    expect(result.current.data[0].checked).toBe("indeterminate");
    expect(result.current.data[0].children[0].checked).toBe(true);
  });
});

// ❌ WRONG: Snapshot testing for dynamic trees
it("should render correctly", () => {
  const { container } = render(<CheckboxTree data={mockData} />);
  expect(container).toMatchSnapshot();
  // Snapshot is 500 lines. Any prop addition breaks it. No one reviews diffs.
});

// ❌ WRONG: Testing CSS classes instead of behavior
it("should be checked", () => {
  render(<CheckboxTree data={mockData} />);
  const checkbox = screen.getByRole("checkbox");
  expect(checkbox).toHaveClass("checkbox--checked"); // ❌ CSS class = implementation!
});

// ✅ CORRECT: Test BEHAVIOR from user perspective
describe("CheckboxTree", () => {
  it("should check a child and update parent to indeterminate", () => {
    render(<CheckboxTree initialData={mockData} />);

    // User sees checkboxes with labels
    const childCheckbox = screen.getByRole("checkbox", { name: "Child A" });
    const parentCheckbox = screen.getByRole("checkbox", { name: "Parent" });

    // User interaction
    await userEvent.click(childCheckbox);

    // User-visible results
    expect(childCheckbox).toBeChecked();
    expect(parentCheckbox).not.toBeChecked(); // Indeterminate ≠ checked
    expect(parentCheckbox).toHaveAttribute("aria-checked", "mixed");
  });

  it("should check all children when parent is checked", () => {
    render(<CheckboxTree initialData={mockData} />);

    const parentCheckbox = screen.getByRole("checkbox", { name: "Parent" });
    await userEvent.click(parentCheckbox);

    // All children should be checked
    const allCheckboxes = screen.getAllByRole("checkbox");
    allCheckboxes.forEach((cb) => {
      expect(cb).toBeChecked();
    });
  });

  it("should show correct count after multiple operations", () => {
    render(<CheckboxTree initialData={mockData} />);

    await userEvent.click(screen.getByRole("checkbox", { name: "Child A" }));
    expect(screen.getByText("1 selected")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("checkbox", { name: "Child B" }));
    expect(screen.getByText("2 selected")).toBeInTheDocument();
  });

  it("should be keyboard navigable", () => {
    render(<CheckboxTree initialData={mockData} />);

    const firstItem = screen.getByRole("treeitem", { name: "Parent" });
    firstItem.focus();

    // Space to toggle
    await userEvent.keyboard(" ");
    expect(screen.getByRole("checkbox", { name: "Parent" })).toBeChecked();

    // Arrow to navigate
    await userEvent.keyboard("{ArrowRight}"); // Expand
    await userEvent.keyboard("{ArrowDown}"); // Next item
  });
});
```

**📊 Testing Strategy:**

| What to Test               | How                                   | Priority        |
| -------------------------- | ------------------------------------- | --------------- |
| Check/uncheck behavior     | RTL: click → assert checked           | 🔴 Critical     |
| Parent ↔ child propagation | RTL: click child → assert parent      | 🔴 Critical     |
| Indeterminate display      | RTL: aria-checked="mixed"             | 🔴 Critical     |
| Keyboard navigation        | RTL: keyboard events                  | 🟡 Important    |
| Expand/collapse            | RTL: click toggle → assert visibility | 🟡 Important    |
| Edge cases (empty tree)    | RTL: render with []                   | 🟡 Important    |
| Performance (large tree)   | Benchmark, not unit test              | 🟢 Nice to have |
| CSS styling                | Visual regression (Chromatic)         | 🟢 Nice to have |

**🤔 Câu hỏi interviewer có thể hỏi:**

| Câu hỏi                       | Cách trả lời                                                                                           |
| ----------------------------- | ------------------------------------------------------------------------------------------------------ |
| "Implementation vs behavior?" | "Implementation: test state shape, CSS classes, internal methods. Behavior: test what user sees/does." |
| "Snapshot testing?"           | "Good for catching unintended changes. Bad for dynamic UIs, large components. Use sparingly."          |
| "Test coverage target?"       | "100% for core logic (hook). 80-90% for components. Focus on critical paths, not lines."               |
| "Integration vs unit?"        | "Unit: hook logic. Integration: component + hook together. E2E: full user flow. Prefer integration."   |

---

### Mistake 19: Incorrect Expand/Collapse State Management

```tsx
// ❌ WRONG: Expand state stored inside each node → forces data clone for toggle
interface BadCheckboxItem {
  id: number;
  name: string;
  checked: boolean | "indeterminate";
  expanded: boolean; // ← Mixed UI state with data model!
  children?: BadCheckboxItem[];
}

function CheckboxItem({ item, indices }: Props) {
  const handleToggle = () => {
    // Must clone ENTIRE tree to toggle one expand!
    setData((prev) => {
      const newData = structuredClone(prev); // O(n) just to flip expanded!
      const node = getNodeByPath(newData, indices);
      node.expanded = !node.expanded;
      return newData;
    });
  };
}
// Problem: Expand is UI-only state. Don't mix with data model!
// Every expand/collapse clones entire tree → terrible performance.

// ❌ ALSO WRONG: Boolean toggle loses previous state
function CheckboxTree() {
  const [expanded, setExpanded] = useState(true); // Only 1 boolean for ALL nodes!
  // Can't expand Node A while collapsing Node B — it's all-or-nothing
}

// ✅ CORRECT: Separate Set for expand state
function CheckboxTree({ data }: Props) {
  const [expandedIds, setExpandedIds] = useState<Set<number>>(() => {
    // Default: all expanded
    const ids = new Set<number>();
    const collectIds = (items: CheckboxItem[]) => {
      items.forEach((item) => {
        if (item.children?.length) {
          ids.add(item.id);
          collectIds(item.children);
        }
      });
    };
    collectIds(data);
    return ids;
  });

  const toggleExpand = useCallback((id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    const allIds = new Set<number>();
    const collect = (items: CheckboxItem[]) => {
      items.forEach((item) => {
        if (item.children?.length) {
          allIds.add(item.id);
          collect(item.children);
        }
      });
    };
    collect(data);
    setExpandedIds(allIds);
  }, [data]);

  const collapseAll = useCallback(() => {
    setExpandedIds(new Set());
  }, []);

  return (
    <div>
      <div className="toolbar">
        <button onClick={expandAll}>Expand All</button>
        <button onClick={collapseAll}>Collapse All</button>
      </div>
      <ul role="tree">
        {data.map((item, i) => (
          <CheckboxItem
            key={item.id}
            item={item}
            indices={[i]}
            isExpanded={expandedIds.has(item.id)}
            onToggleExpand={toggleExpand}
          />
        ))}
      </ul>
    </div>
  );
}
```

**📊 Expand State Patterns:**

| Pattern                  | Performance              | Flexibility           | Recommended   |
| ------------------------ | ------------------------ | --------------------- | ------------- |
| `expanded` in data model | ❌ Clone tree for toggle | ❌ Mixed concerns     | ❌ No         |
| Single boolean           | ❌ N/A                   | ❌ All-or-nothing     | ❌ No         |
| `Set<number>`            | ✅ O(1) toggle           | ✅ Per-node control   | ✅ Yes        |
| `Map<number, boolean>`   | ✅ O(1) toggle           | ✅ Per-node + default | ✅ Acceptable |

**🤔 Câu hỏi interviewer có thể hỏi:**

| Câu hỏi                         | Cách trả lời                                                                                             |
| ------------------------------- | -------------------------------------------------------------------------------------------------------- |
| "UI state vs data state?"       | "Data = checked, name, id (comes from server). UI = expanded, focused, hovered (local only). Never mix." |
| "Set vs array for expandedIds?" | "Set: O(1) has/add/delete. Array: O(n) includes/filter. Set far better for frequent lookups."            |
| "Default expand all?"           | "Lazy init: traverse tree on mount, collect all parent IDs into Set."                                    |
| "Persist expand state?"         | "Save to sessionStorage. Restore on revisit. Key by tree ID for uniqueness."                             |

---

### Mistake 20: Quên Error Boundary Cho Tree Components

```tsx
// ❌ WRONG: No error boundary → corrupted node crashes ENTIRE app
function App() {
  return (
    <div>
      <Header />
      <CheckboxTree data={data} />{" "}
      {/* One bad node = whole app white screen! */}
      <Footer />
    </div>
  );
}
// If data has circular reference, invalid type, or render error:
// Uncaught Error → React unmounts ENTIRE tree → blank page 💀

// ✅ CORRECT: Error boundary isolates crash to tree only
class TreeErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log to error tracking service
    console.error("Tree crashed:", error);
    console.error("Component stack:", info.componentStack);
    // sendToSentry(error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div role="alert" className="tree-error">
            <h3>⚠️ Tree failed to render</h3>
            <p>{this.state.error?.message}</p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
            >
              Try Again
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}

// Usage
function App() {
  return (
    <div>
      <Header /> {/* Still works even if tree crashes! */}
      <TreeErrorBoundary
        fallback={
          <div className="tree-placeholder">
            <p>
              Unable to load tree. <button>Retry</button>
            </p>
          </div>
        }
      >
        <CheckboxTree data={data} />
      </TreeErrorBoundary>
      <Footer /> {/* Still works! */}
    </div>
  );
}

// ✅ ALSO: Granular error boundaries per subtree
function CheckboxItem({ item, indices }: Props) {
  return (
    <li>
      <input type="checkbox" checked={item.checked === true} />
      {item.name}
      {item.children && (
        <TreeErrorBoundary
          fallback={
            <span className="error-icon">⚠️ Failed to load children</span>
          }
        >
          <ul>
            {item.children.map((child, i) => (
              <CheckboxItem
                key={child.id}
                item={child}
                indices={[...indices, i]}
              />
            ))}
          </ul>
        </TreeErrorBoundary>
      )}
    </li>
  );
}
// If one subtree has bad data → only that subtree shows error
// Rest of tree still works!
```

**📊 Error Boundary Strategy:**

| Granularity    | Crash Impact             | Recovery      | Use When          |
| -------------- | ------------------------ | ------------- | ----------------- |
| App-level only | Whole app crashes        | Full reload   | ❌ Too coarse     |
| Page-level     | Page crashes, nav works  | Navigate away | 🟡 Minimum        |
| Feature-level  | Tree crashes, page works | Retry button  | ✅ Recommended    |
| Node-level     | Single node crashes      | Skip bad node | ✅ Best for trees |

**🤔 Câu hỏi interviewer có thể hỏi:**

| Câu hỏi                 | Cách trả lời                                                                                            |
| ----------------------- | ------------------------------------------------------------------------------------------------------- |
| "Why class component?"  | "Error boundaries MUST be class. No hook equivalent yet. getDerivedStateFromError + componentDidCatch." |
| "Catch async errors?"   | "Error boundaries only catch render/lifecycle errors. Use try/catch for async. Not event handlers."     |
| "react-error-boundary?" | "Library by Brice Clark. `<ErrorBoundary fallbackRender={...}>`. Nicer API than manual class."          |
| "Recovery?"             | "Reset state via key change: `<Tree key={retryCount} />`. Or reset setState in boundary."               |

---

### Mistake 21: CSS Specificity Trong Nested Tree Components

```tsx
// ❌ WRONG: Global styles bleed into nested levels
// styles.css
.checkbox-item { padding-left: 20px; }       // Applied to ALL levels!
.checkbox-item .checkbox-item { /* overrides */ } // Specificity wars begin...

// ❌ WRONG: Inline styles on every element
function CheckboxItem({ item, depth }: Props) {
  return (
    <li style={{ paddingLeft: depth * 20 }}> {/* Each item gets unique style object! */}
      {/* React can't optimize — new style object every render */}
    </li>
  );
}

// ✅ CORRECT: CSS custom properties for dynamic nesting
// styles.css
.tree-item {
  padding-left: calc(var(--depth, 0) * 20px);
  /* Single rule handles ALL depths! */
}

.tree-item[aria-level="1"] { --depth: 0; }
.tree-item[aria-level="2"] { --depth: 1; }
.tree-item[aria-level="3"] { --depth: 2; }

// Generic approach for any depth:
.tree-item {
  padding-left: calc(var(--tree-depth) * var(--indent-size, 20px));
}

// ✅ CORRECT: CSS Module + dynamic custom property
// CheckboxItem.module.css
.item {
  padding-left: calc(var(--depth) * 20px);
  border-left: 2px solid transparent;
  transition: all 0.2s ease;
}

.item:hover {
  background: rgba(0, 0, 0, 0.04);
  border-left-color: #1976d2;
}

.item[data-checked="indeterminate"] {
  background: rgba(25, 118, 210, 0.04);
}

// Component
function CheckboxItem({ item, indices, depth }: Props) {
  return (
    <li
      className={styles.item}
      style={{ "--depth": depth } as React.CSSProperties} // ✅ Single custom property
      data-checked={item.checked === "indeterminate" ? "indeterminate" : undefined}
      aria-level={depth + 1}
    >
      {/* ... */}
    </li>
  );
}

// ✅ ALSO CORRECT: Styled-components with theme
const TreeItem = styled.li<{ $depth: number }>`
  padding-left: ${({ $depth }) => $depth * 20}px;

  &:hover {
    background: ${({ theme }) => theme.colors.hover};
  }

  /* Connector lines */
  &::before {
    content: '';
    position: absolute;
    left: ${({ $depth }) => ($depth - 1) * 20 + 10}px;
    top: 0;
    height: 100%;
    width: 1px;
    background: ${({ theme }) => theme.colors.border};
  }
`;
```

**📊 CSS Strategy for Trees:**

| Approach              | Specificity Control | Performance              | Maintenance           |
| --------------------- | ------------------- | ------------------------ | --------------------- |
| Global CSS            | ❌ Leaks everywhere | ✅ Fast                  | ❌ Hard               |
| Inline styles         | ✅ Scoped           | ❌ New object per render | ❌ No pseudo-elements |
| CSS Modules           | ✅ Scoped           | ✅ Build-time            | ✅ Good               |
| CSS Custom Properties | ✅ Cascade-aware    | ✅ Single reflow         | ✅ Best               |
| styled-components     | ✅ Scoped           | 🟡 Runtime               | ✅ Good               |

**🤔 Câu hỏi interviewer có thể hỏi:**

| Câu hỏi                         | Cách trả lời                                                                                      |
| ------------------------------- | ------------------------------------------------------------------------------------------------- |
| "Tree connector lines?"         | "CSS `::before` pseudo-element with absolute positioning. Width 1px, height 100%."                |
| "Performance of inline styles?" | "New object every render = React can't shallow-compare. Use CSS variables or classes instead."    |
| "CSS-in-JS runtime cost?"       | "styled-components injects styles at runtime. ~2-5ms per component. Consider at 1000+ items."     |
| "Dark mode?"                    | "CSS custom properties: `--tree-bg: white`. Override in `.dark { --tree-bg: #1a1a1a }`. Zero JS." |

---

### Mistake 22: SSR Hydration Mismatch

```tsx
// ❌ WRONG: Math.random() generates different ID on server vs client
function CheckboxItem({ item }: Props) {
  const id = `cb-${Math.random().toString(36).slice(2)}`; // Different on server!
  // Server HTML: id="cb-abc123"
  // Client hydration: id="cb-xyz789"
  // React warning: "Text content did not match" → full re-render!

  return (
    <label htmlFor={id}>
      <input id={id} type="checkbox" />
      {item.name}
    </label>
  );
}

// ❌ WRONG: window/localStorage access during SSR
function CheckboxTree({ data }: Props) {
  // window is undefined on server! 💥
  const [expanded, setExpanded] = useState(
    JSON.parse(window.localStorage.getItem("expanded") || "[]"),
  );
}

// ❌ WRONG: Date-based rendering without suppression
function CheckboxTree({ data }: Props) {
  return (
    <div>
      <span>Last updated: {new Date().toLocaleTimeString()}</span>
      {/* Server renders at T1, client hydrates at T2 → MISMATCH! */}
      <CheckboxList items={data} />
    </div>
  );
}

// ✅ CORRECT: useId for stable IDs
function CheckboxItem({ item }: Props) {
  const id = useId(); // Same on server and client!
  return (
    <label htmlFor={`${id}-checkbox`}>
      <input id={`${id}-checkbox`} type="checkbox" />
      {item.name}
    </label>
  );
}

// ✅ CORRECT: Guard browser APIs
function CheckboxTree({ data }: Props) {
  const [expanded, setExpanded] = useState<number[]>([]);

  // Read localStorage AFTER mount (client only)
  useEffect(() => {
    try {
      const stored = localStorage.getItem("expanded");
      if (stored) setExpanded(JSON.parse(stored));
    } catch {
      /* ignore */
    }
  }, []);
}

// ✅ CORRECT: Suppress hydration for dynamic content
function CheckboxTree({ data }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div>
      {mounted && (
        <span suppressHydrationWarning>
          Last updated: {new Date().toLocaleTimeString()}
        </span>
      )}
      <CheckboxList items={data} />
    </div>
  );
}
```

**📊 SSR Hydration Checklist:**

| Issue           | Server       | Client   | Fix                           |
| --------------- | ------------ | -------- | ----------------------------- |
| Random IDs      | `cb-abc`     | `cb-xyz` | `useId()`                     |
| `window` access | ❌ undefined | ✅ works | `useEffect` guard             |
| `localStorage`  | ❌ undefined | ✅ works | Read in `useEffect`           |
| `Date.now()`    | T1           | T2       | `suppressHydrationWarning`    |
| `navigator`     | ❌ undefined | ✅ works | Dynamic import or `useEffect` |
| CSS-in-JS order | Style A      | Style B  | Consistent insertion          |

**🤔 Câu hỏi interviewer có thể hỏi:**

| Câu hỏi                     | Cách trả lời                                                                                |
| --------------------------- | ------------------------------------------------------------------------------------------- |
| "Hydration là gì?"          | "React attaches event listeners to server-rendered HTML. Expects DOM to match virtual DOM." |
| "Mismatch impact?"          | "React falls back to full client render. Loses SSR benefit. Performance hit + flash."       |
| "suppressHydrationWarning?" | "Tells React to ignore mismatch for specific element. Use sparingly — for timestamps, etc." |
| "Next.js dynamic?"          | "`dynamic(() => import('./Tree'), { ssr: false })`. Component only renders on client."      |

---

### Mistake 23: Misusing `useReducer` vs `useState`

```tsx
// ❌ WRONG: Multiple related useState → out-of-sync risk
function CheckboxTree() {
  const [data, setData] = useState(initialData);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [lastAction, setLastAction] = useState<string>("");

  const handleCheck = (checked: boolean, indices: number[]) => {
    // Must update 3 states atomically — easy to forget one!
    setData((prev) => {
      /* update tree */
    });
    setSelectedIds((prev) => {
      /* update selection */
    });
    setLastAction("check"); // Easy to forget!
    // What if setData succeeds but setSelectedIds gets wrong indices?
    // States become out of sync! 😱
  };
}

// ❌ ALSO WRONG: useReducer for simple toggle
function SimpleCheckbox() {
  // Over-kill for single boolean!
  const [state, dispatch] = useReducer(
    (state, action) => {
      switch (action.type) {
        case "TOGGLE":
          return { ...state, checked: !state.checked };
        default:
          return state;
      }
    },
    { checked: false },
  );

  return (
    <input
      type="checkbox"
      checked={state.checked}
      onChange={() => dispatch({ type: "TOGGLE" })}
    />
  );
  // useState(false) would be 1 line instead of 10!
}

// ✅ CORRECT: useReducer for complex, related state
interface TreeState {
  data: CheckboxItem[];
  expandedIds: Set<number>;
  searchQuery: string;
  past: CheckboxItem[][];
  future: CheckboxItem[][];
}

type TreeAction =
  | { type: "CHECK"; indices: number[]; checked: boolean }
  | { type: "CHECK_ALL"; checked: boolean }
  | { type: "TOGGLE_EXPAND"; nodeId: number }
  | { type: "SEARCH"; query: string }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "RESET"; data: CheckboxItem[] };

function treeReducer(state: TreeState, action: TreeAction): TreeState {
  switch (action.type) {
    case "CHECK": {
      const newData = structuredClone(state.data);
      const node = getNodeByPath(newData, action.indices);
      updateCheckboxAndDescendants(node, action.checked);
      resolveCheckboxStates(
        newData[action.indices[0]],
        action.indices.slice(1),
      );
      return {
        ...state,
        data: newData,
        past: [...state.past.slice(-19), state.data], // All state updated atomically!
        future: [],
      };
    }

    case "TOGGLE_EXPAND":
      const newExpanded = new Set(state.expandedIds);
      newExpanded.has(action.nodeId)
        ? newExpanded.delete(action.nodeId)
        : newExpanded.add(action.nodeId);
      return { ...state, expandedIds: newExpanded };

    case "SEARCH":
      return { ...state, searchQuery: action.query };

    case "UNDO":
      if (state.past.length === 0) return state;
      return {
        ...state,
        data: state.past[state.past.length - 1],
        past: state.past.slice(0, -1),
        future: [state.data, ...state.future],
      };

    case "REDO":
      if (state.future.length === 0) return state;
      return {
        ...state,
        data: state.future[0],
        past: [...state.past, state.data],
        future: state.future.slice(1),
      };

    case "RESET":
      return { ...state, data: action.data, past: [], future: [] };

    default:
      return state;
  }
}

// Usage — clean, predictable
function CheckboxTree({ initialData }: Props) {
  const [state, dispatch] = useReducer(treeReducer, {
    data: initialData,
    expandedIds: new Set(),
    searchQuery: "",
    past: [],
    future: [],
  });

  return (
    <div>
      <button
        onClick={() => dispatch({ type: "UNDO" })}
        disabled={state.past.length === 0}
      >
        Undo
      </button>
      <input
        value={state.searchQuery}
        onChange={(e) => dispatch({ type: "SEARCH", query: e.target.value })}
      />
      <CheckboxList
        items={state.data}
        onCheck={(checked, indices) =>
          dispatch({ type: "CHECK", indices, checked })
        }
      />
    </div>
  );
}
```

**📊 useState vs useReducer Decision:**

| Criteria           | useState              | useReducer                      |
| ------------------ | --------------------- | ------------------------------- |
| **State count**    | 1-2 independent       | 3+ related states               |
| **Update logic**   | Simple set/toggle     | Complex transitions             |
| **Atomic updates** | ❌ Multiple setStates | ✅ Single dispatch              |
| **Debugging**      | Harder (scattered)    | ✅ Centralized + logged         |
| **Testing**        | Test component        | ✅ Test reducer (pure function) |
| **Undo/redo**      | Manual                | ✅ Natural fit                  |

**🤔 Câu hỏi interviewer có thể hỏi:**

| Câu hỏi                 | Cách trả lời                                                                                   |
| ----------------------- | ---------------------------------------------------------------------------------------------- |
| "When useReducer?"      | "Multiple related states, complex transitions, need undo/redo, want testable pure logic."      |
| "useState batching?"    | "React 18 batches all setStates in event handlers. But reducer still better for atomic logic." |
| "Reducer + TypeScript?" | "Discriminated unions for actions. Never `any` payload. Exhaustive switch with `never`."       |
| "Context + Reducer?"    | "Classic pattern: `useReducer` for logic + Context for sharing. Mini-Redux without library."   |

---

### Mistake 24: Ignoring Browser DevTools Cho Debugging

```tsx
// ❌ WRONG: console.log everywhere, remove before deploy
function CheckboxTree({ data }: Props) {
  console.log("data:", data); // 1000 items → console overloaded
  console.log("render count:", renderCount++); // Global mutation
  console.log("checking:", indices); // Forgotten in production

  return <CheckboxList items={data} />;
}

// ✅ CORRECT: Structured debugging strategies
// Strategy 1: React DevTools Profiler
// → Record → Interact → See which components render + why
// → Flamegraph shows render duration per component
// → "Why did this render?" shows changed props/state

// Strategy 2: Performance.mark for timing
function handleCheck(checked: boolean, indices: number[]) {
  performance.mark("check-start");

  setData((prev) => {
    const newData = structuredClone(prev);
    updateTree(newData, indices, checked);

    performance.mark("check-end");
    performance.measure("check-duration", "check-start", "check-end");
    // View in DevTools → Performance → User Timing

    return newData;
  });
}

// Strategy 3: Conditional debug logging
const DEBUG = process.env.NODE_ENV === "development";

function debugLog(label: string, ...args: unknown[]) {
  if (DEBUG) {
    console.groupCollapsed(`🌲 [Tree] ${label}`);
    args.forEach((arg) => console.log(arg));
    console.groupEnd();
  }
}

// Usage
debugLog("handleCheck", { checked, indices, timestamp: Date.now() });
// Collapsed in console → click to expand. Stripped in production.

// Strategy 4: Custom React DevTools hook
function useDebugValue<T>(value: T, label: string) {
  // Shows in React DevTools component inspector
  React.useDebugValue(`${label}: ${JSON.stringify(value)}`);
}

function useCheckboxTree(initialData: CheckboxItem[]) {
  const [data, setData] = useState(initialData);
  const checkedCount = useMemo(() => countChecked(data), [data]);

  // Visible in React DevTools!
  useDebugValue(checkedCount, "Checked count");
  useDebugValue(data.length, "Total nodes");

  return { data, setData };
}

// Strategy 5: Component display names for DevTools
const CheckboxItem = memo(function CheckboxItem({ item }: Props) {
  return <li>{item.name}</li>;
});
// Named function → shows "CheckboxItem" in DevTools instead of "Anonymous"
```

**📊 Debugging Toolkit:**

| Tool                      | What It Shows                  | When to Use                 |
| ------------------------- | ------------------------------ | --------------------------- |
| React DevTools Profiler   | Render count, duration, cause  | Performance issues          |
| React DevTools Components | Props, state, hooks, context   | State inspection            |
| Chrome Performance tab    | JS execution, layout, paint    | Frame drops, jank           |
| Chrome Memory tab         | Heap size, detached nodes      | Memory leaks                |
| `performance.mark()`      | Custom timing markers          | Measure specific operations |
| `useDebugValue()`         | Custom hook values in DevTools | Custom hook debugging       |
| `console.table()`         | Array/object as table          | Data inspection             |
| Source Maps               | Original TypeScript source     | Production debugging        |

**🤔 Câu hỏi interviewer có thể hỏi:**

| Câu hỏi                 | Cách trả lời                                                                                        |
| ----------------------- | --------------------------------------------------------------------------------------------------- |
| "Production debugging?" | "Source maps (hidden), Sentry error tracking, structured logging, feature flags to reproduce."      |
| "console.log in prod?"  | "Always strip with babel/terser. Or use conditional: `if (DEBUG) console.log(...)`. Never in CI."   |
| "React Profiler API?"   | "`<Profiler id='tree' onRender={callback}>`. Programmatic access to render metrics."                |
| "Performance.mark()?"   | "Web API for custom timing. Visible in DevTools Performance tab. Zero overhead when not recording." |

---

### Mistake 25: Stale Closures Trong Debounce/Throttle

```tsx
// ❌ WRONG: Debounced function captures stale state
function CheckboxTree() {
  const [data, setData] = useState(initialData);
  const [searchQuery, setSearchQuery] = useState("");

  // ❌ data is captured at creation time — becomes stale!
  const debouncedFilter = useMemo(
    () =>
      debounce((query: string) => {
        // data here is ALWAYS the initial value!
        // Even after 100 state updates, this closure sees old data 😱
        const filtered = filterTree(data, query);
        setFilteredData(filtered);
      }, 300),
    [], // Empty deps = closure captures initial data forever
  );

  // ❌ ALSO WRONG: Recreating debounce on every render
  const debouncedSearch = debounce((query: string) => {
    // New debounce function each render → previous timer NOT cancelled!
    // Multiple timers running simultaneously!
    filterTree(data, query);
  }, 300);
}

// ✅ CORRECT: useRef to always access latest state
function CheckboxTree() {
  const [data, setData] = useState(initialData);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredData, setFilteredData] = useState(initialData);

  // Ref always points to latest data
  const dataRef = useRef(data);
  dataRef.current = data;

  // Stable debounced function that reads latest via ref
  const debouncedFilter = useMemo(
    () =>
      debounce((query: string) => {
        const current = dataRef.current; // ✅ Always fresh!
        const filtered = filterTree(current, query);
        setFilteredData(filtered);
      }, 300),
    [], // Safe: reads ref, not stale closure
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => debouncedFilter.cancel();
  }, [debouncedFilter]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedFilter(query);
  };

  return (
    <div>
      <input value={searchQuery} onChange={handleSearch} />
      <CheckboxList items={filteredData} />
    </div>
  );
}

// ✅ ALSO CORRECT: Custom useDebouncedCallback hook
function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
): T & { cancel: () => void } {
  const callbackRef = useRef(callback);
  callbackRef.current = callback; // Always latest

  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const debouncedFn = useCallback(
    ((...args) => {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        callbackRef.current(...args); // ✅ Calls latest version
      }, delay);
    }) as T & { cancel: () => void },
    [delay],
  );

  debouncedFn.cancel = () => clearTimeout(timerRef.current);

  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  return debouncedFn;
}

// Usage
function SearchableTree() {
  const [data, setData] = useState(initialData);

  const handleSearch = useDebouncedCallback((query: string) => {
    // Always reads latest data — no stale closure!
    setData((prev) => filterTree(prev, query));
  }, 300);
}
```

**📊 Debounce/Throttle Patterns:**

| Pattern                           | Stale Risk              | Memory         | Recommended    |
| --------------------------------- | ----------------------- | -------------- | -------------- |
| `useMemo(() => debounce(fn), [])` | 🔴 High (stale closure) | ✅ 1 instance  | ❌ Without ref |
| Inline `debounce(fn)` each render | 🟡 None (fresh)         | ❌ N instances | ❌ Never       |
| `useMemo` + `useRef`              | ✅ None                 | ✅ 1 instance  | ✅ Yes         |
| `useDebouncedCallback` hook       | ✅ None                 | ✅ 1 instance  | ✅ Best        |

**🤔 Câu hỏi interviewer có thể hỏi:**

| Câu hỏi                 | Cách trả lời                                                                                   |
| ----------------------- | ---------------------------------------------------------------------------------------------- |
| "Debounce vs throttle?" | "Debounce: wait until stop (search input). Throttle: at most once per interval (scroll)."      |
| "Cancel on unmount?"    | "Must cancel! Otherwise timer fires, sets state on unmounted component. Use cleanup function." |
| "useRef for callbacks?" | "Ref contains no closure. `.current` always latest. Common pattern to break stale closures."   |
| "Libraries?"            | "`use-debounce`, `lodash.debounce`. Or write custom hook — ~15 lines."                         |

---

### Mistake 26: Quên Cleanup Khi Route Change

```tsx
// ❌ WRONG: Component saves to API, but user navigates away mid-save
function CheckboxTree() {
  const [data, setData] = useState(initialData);
  const [isDirty, setIsDirty] = useState(false);

  const handleCheck = (checked: boolean, indices: number[]) => {
    setData((prev) => {
      /* update */
    });
    setIsDirty(true);
  };

  // Auto-save every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      if (isDirty) {
        saveToAPI(data); // ❌ What if component already unmounted?
        setIsDirty(false); // ❌ setState on unmounted!
      }
    }, 5000);
    // NO CLEANUP → timer runs forever after navigation!
  }, [data, isDirty]);
}

// ❌ WRONG: Unsaved changes lost without warning
// User checks 50 items → navigates away → all changes GONE!

// ✅ CORRECT: Full cleanup + navigation guard
function CheckboxTree() {
  const [data, setData] = useState(initialData);
  const [isDirty, setIsDirty] = useState(false);
  const dataRef = useRef(data);
  dataRef.current = data;

  // Auto-save with proper cleanup
  useEffect(() => {
    if (!isDirty) return;

    const timer = setInterval(() => {
      saveToAPI(dataRef.current)
        .then(() => setIsDirty(false))
        .catch((err) => console.error("Auto-save failed:", err));
    }, 5000);

    return () => clearInterval(timer); // ✅ Cleanup on unmount/deps change
  }, [isDirty]);

  // Save on unmount (last chance)
  useEffect(() => {
    return () => {
      if (dataRef.current !== initialData) {
        // Fire-and-forget save on unmount
        navigator.sendBeacon("/api/save", JSON.stringify(dataRef.current));
      }
    };
  }, []);

  // Browser tab close warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = ""; // Required for Chrome
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // React Router navigation guard (v6)
  // useBlocker(isDirty); // or usePrompt

  return (
    <div>
      {isDirty && <span className="unsaved-badge">Unsaved changes</span>}
      <CheckboxList items={data} onCheck={handleCheck} />
      <button onClick={() => saveToAPI(data).then(() => setIsDirty(false))}>
        Save
      </button>
    </div>
  );
}
```

**📊 Cleanup Checklist:**

| Resource           | Cleanup Method         | When           |
| ------------------ | ---------------------- | -------------- |
| `setInterval`      | `clearInterval(id)`    | Effect cleanup |
| `setTimeout`       | `clearTimeout(id)`     | Effect cleanup |
| Event listener     | `removeEventListener`  | Effect cleanup |
| WebSocket          | `ws.close()`           | Effect cleanup |
| AbortController    | `controller.abort()`   | Effect cleanup |
| Route change       | `beforeunload` event   | Browser close  |
| In-flight requests | `AbortController`      | Route change   |
| Unsaved data       | `navigator.sendBeacon` | Last resort    |

**🤔 Câu hỏi interviewer có thể hỏi:**

| Câu hỏi               | Cách trả lời                                                                               |
| --------------------- | ------------------------------------------------------------------------------------------ |
| "sendBeacon?"         | "Browser API. Sends async POST even during unload. Server receives data after tab closes." |
| "beforeunload?"       | "Browser event. Shows 'Leave page?' dialog. Can't customize message in modern browsers."   |
| "React Router guard?" | "`useBlocker` (v6.4+) or `usePrompt`. Shows confirm dialog before navigation."             |
| "Optimistic save?"    | "Save on every change (debounced). No explicit save button needed. Like Google Docs."      |

---

### Mistake 27: Sai Thứ Tự Tree Traversal (BFS vs DFS)

```tsx
// ❌ WRONG: Using BFS when order matters for display
function flattenForDisplay_BFS(items: CheckboxItem[]): FlatItem[] {
  const result: FlatItem[] = [];
  const queue = [...items]; // BFS queue

  while (queue.length > 0) {
    const node = queue.shift()!;
    result.push({ id: node.id, name: node.name, depth: 0 });
    if (node.children) {
      queue.push(...node.children); // Adds children to END of queue
    }
  }
  return result;
}
// Output: Parent1, Parent2, Child1A, Child1B, Child2A, Child2B
// Expected: Parent1, Child1A, Child1B, Parent2, Child2A, Child2B
// BFS gives WRONG display order for tree UI! 😱

// ❌ WRONG: Using DFS when looking for shortest path
function findNodeById_DFS(
  items: CheckboxItem[],
  targetId: number,
): number[] | null {
  // DFS may find a DEEP match when a SHALLOW match exists
  // Not guaranteed shortest path in tree with duplicate IDs (edge case)
}

// ✅ CORRECT: DFS (pre-order) for display order
function flattenForDisplay_DFS(items: CheckboxItem[], depth = 0): FlatItem[] {
  const result: FlatItem[] = [];

  for (const item of items) {
    // Pre-order: visit NODE first, then children
    result.push({ id: item.id, name: item.name, depth });

    if (item.children) {
      result.push(...flattenForDisplay_DFS(item.children, depth + 1));
    }
  }
  return result;
}
// Output: Parent1, Child1A, Child1B, Parent2, Child2A, Child2B ✅

// ✅ CORRECT: Iterative DFS for large trees (no stack overflow)
function flattenIterative(items: CheckboxItem[]): FlatItem[] {
  const result: FlatItem[] = [];
  const stack: Array<{ item: CheckboxItem; depth: number }> = [];

  // Push in reverse so first item is processed first
  for (let i = items.length - 1; i >= 0; i--) {
    stack.push({ item: items[i], depth: 0 });
  }

  while (stack.length > 0) {
    const { item, depth } = stack.pop()!;
    result.push({ id: item.id, name: item.name, depth });

    if (item.children) {
      // Push children in reverse for correct order
      for (let i = item.children.length - 1; i >= 0; i--) {
        stack.push({ item: item.children[i], depth: depth + 1 });
      }
    }
  }

  return result;
}

// ✅ CORRECT: BFS for level-order operations
function countByLevel(items: CheckboxItem[]): Map<number, number> {
  const counts = new Map<number, number>();
  const queue: Array<{ item: CheckboxItem; level: number }> = items.map(
    (item) => ({ item, level: 0 }),
  );

  while (queue.length > 0) {
    const { item, level } = queue.shift()!;
    counts.set(level, (counts.get(level) || 0) + 1);

    if (item.children) {
      item.children.forEach((child) =>
        queue.push({ item: child, level: level + 1 }),
      );
    }
  }
  return counts;
  // Map { 0 => 2, 1 => 4, 2 => 8 } — items per level
}
```

**📊 When to Use BFS vs DFS:**

| Use Case                       | BFS               | DFS (Pre-order)   | DFS (Post-order)  |
| ------------------------------ | ----------------- | ----------------- | ----------------- |
| **Display order**              | ❌ Wrong          | ✅ Correct        | ❌ Wrong          |
| **Level-by-level**             | ✅ Natural        | ❌ Unnatural      | ❌ Unnatural      |
| **Shortest path**              | ✅ Guaranteed     | ❌ Not guaranteed | ❌ Not guaranteed |
| **Check propagation up**       | ❌ Bottom-up hard | ❌ Top-down only  | ✅ Children first |
| **Check propagation down**     | ✅ Level-by-level | ✅ Natural        | ❌ Wrong order    |
| **Flatten for virtualization** | ❌ Wrong order    | ✅ Correct        | ❌ Wrong order    |
| **Memory**                     | 🟡 Queue (width)  | 🟡 Stack (depth)  | 🟡 Stack (depth)  |

**🤔 Câu hỏi interviewer có thể hỏi:**

| Câu hỏi                | Cách trả lời                                                                               |
| ---------------------- | ------------------------------------------------------------------------------------------ |
| "Pre vs Post order?"   | "Pre: visit node BEFORE children (top-down). Post: visit node AFTER children (bottom-up)." |
| "Checkbox tree needs?" | "Pre-order for display. Post-order for calculating parent state from children."            |
| "BFS memory?"          | "Queue grows to max WIDTH of tree. DFS stack grows to max DEPTH. Usually depth << width."  |
| "In-order?"            | "Binary trees only (left-node-right). Not applicable for N-ary checkbox trees."            |

---

### Mistake 28: Không Handle Empty/Loading/Error States

```tsx
// ❌ WRONG: Only handles happy path
function CheckboxTree({ data }: Props) {
  return (
    <ul>
      {data.map((item, i) => (
        <CheckboxItem key={item.id} item={item} indices={[i]} />
      ))}
    </ul>
  );
}
// What if data is []? → Empty <ul> with no feedback
// What if data is undefined? → Runtime crash! 💀
// What if data is loading? → Nothing shown, user confused

// ✅ CORRECT: Handle ALL states
interface TreeState {
  status: "idle" | "loading" | "error" | "success" | "empty";
  data: CheckboxItem[];
  error: string | null;
}

function CheckboxTree({ treeId }: Props) {
  const [state, setState] = useState<TreeState>({
    status: "idle",
    data: [],
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    setState((prev) => ({ ...prev, status: "loading" }));

    fetchTreeData(treeId)
      .then((data) => {
        if (!cancelled) {
          setState({
            status: data.length === 0 ? "empty" : "success",
            data,
            error: null,
          });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setState({ status: "error", data: [], error: err.message });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [treeId]);

  // Render based on state
  switch (state.status) {
    case "idle":
    case "loading":
      return (
        <div className="tree-skeleton" role="status" aria-label="Loading tree">
          <div className="skeleton-line" style={{ width: "80%" }} />
          <div
            className="skeleton-line"
            style={{ width: "60%", marginLeft: 20 }}
          />
          <div
            className="skeleton-line"
            style={{ width: "60%", marginLeft: 20 }}
          />
          <div className="skeleton-line" style={{ width: "70%" }} />
          <span className="sr-only">Loading categories...</span>
        </div>
      );

    case "error":
      return (
        <div className="tree-error" role="alert">
          <span>❌ Failed to load: {state.error}</span>
          <button onClick={() => fetchTreeData(treeId)}>Retry</button>
        </div>
      );

    case "empty":
      return (
        <div className="tree-empty" role="status">
          <span>📂 No categories found</span>
          <p>Create your first category to get started.</p>
        </div>
      );

    case "success":
      return (
        <ul role="tree" aria-label="Category selection">
          {state.data.map((item, i) => (
            <CheckboxItem key={item.id} item={item} indices={[i]} />
          ))}
        </ul>
      );
  }
}
```

**📊 State Machine:**

```
idle → loading → success (render tree)
                → empty   (no data message)
                → error   (retry button)

error → loading (retry) → success / error
```

**📊 UI States Checklist:**

| State         | UI                  | A11Y                          | Common Mistake      |
| ------------- | ------------------- | ----------------------------- | ------------------- |
| Loading       | Skeleton / Spinner  | `role="status"`, `aria-label` | No feedback         |
| Empty         | Placeholder message | `role="status"`               | Empty container     |
| Error         | Error msg + Retry   | `role="alert"`                | Console error only  |
| Success       | Tree content        | `role="tree"`                 | Only this one built |
| Partial error | Tree + error nodes  | Per-node error boundary       | Crash entire tree   |

**🤔 Câu hỏi interviewer có thể hỏi:**

| Câu hỏi                | Cách trả lời                                                                                      |
| ---------------------- | ------------------------------------------------------------------------------------------------- |
| "Skeleton vs spinner?" | "Skeleton shows expected layout — better perceived performance. Spinner is generic."              |
| "State machine?"       | "Explicit states prevent impossible combos (loading + error). Use discriminated union or XState." |
| "Retry strategy?"      | "Exponential backoff: 1s, 2s, 4s, 8s. Max 3 retries. Show permanent error after."                 |
| "Suspense?"            | "React Suspense + ErrorBoundary = declarative loading/error. `<Suspense fallback={spinner}>`."    |

---

### Mistake 29: Conflicting State Updates Từ Multiple Sources

```tsx
// ❌ WRONG: WebSocket + local state = conflict
function CollaborativeTree() {
  const [data, setData] = useState(initialData);

  // Source 1: Local user clicks
  const handleCheck = (checked: boolean, indices: number[]) => {
    setData((prev) => {
      const newData = structuredClone(prev);
      // ... update locally
      return newData;
    });
    // Send to server
    ws.send(JSON.stringify({ type: "CHECK", indices, checked }));
  };

  // Source 2: WebSocket updates from other users
  useEffect(() => {
    ws.onmessage = (event) => {
      const action = JSON.parse(event.data);
      if (action.type === "CHECK") {
        // ❌ CONFLICT! What if local user also checked at same time?
        // Remote update may OVERWRITE local changes!
        setData((prev) => {
          const newData = structuredClone(prev);
          // ... apply remote update
          return newData;
        });
      }
    };
  }, []);
}
// Race condition: User A checks item → User B checks different item
// If updates cross in flight → one overwrites the other! 😱

// ✅ CORRECT: Operational Transform / CRDT approach
interface CheckOperation {
  id: string; // Unique operation ID
  timestamp: number; // Lamport timestamp for ordering
  userId: string; // Who made the change
  nodeId: number; // Which node
  checked: boolean; // New state
}

function CollaborativeTree() {
  const [data, setData] = useState(initialData);
  const pendingOps = useRef<CheckOperation[]>([]);
  const [version, setVersion] = useState(0);

  const handleCheck = useCallback((nodeId: number, checked: boolean) => {
    const op: CheckOperation = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      userId: currentUser.id,
      nodeId,
      checked,
    };

    // Optimistic: apply locally immediately
    setData((prev) => applyOperation(prev, op));
    pendingOps.current.push(op);

    // Send to server
    ws.send(JSON.stringify({ type: "OPERATION", op }));
  }, []);

  // Handle remote operations
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const msg = JSON.parse(event.data);

      if (msg.type === "OPERATION" && msg.op.userId !== currentUser.id) {
        // Apply remote op, transform against pending local ops
        setData((prev) => {
          let transformed = prev;
          transformed = applyOperation(transformed, msg.op);
          return transformed;
        });
      }

      if (msg.type === "ACK") {
        // Server confirmed our operation — remove from pending
        pendingOps.current = pendingOps.current.filter(
          (op) => op.id !== msg.opId,
        );
        setVersion(msg.version);
      }

      if (msg.type === "REJECT") {
        // Server rejected our operation — rollback
        setData((prev) => rollbackOperation(prev, msg.opId));
        pendingOps.current = pendingOps.current.filter(
          (op) => op.id !== msg.opId,
        );
      }
    };

    ws.addEventListener("message", handleMessage);
    return () => ws.removeEventListener("message", handleMessage);
  }, []);
}
```

**📊 Multi-Source State Strategies:**

| Strategy              | Complexity      | Conflict Resolution | Use When         |
| --------------------- | --------------- | ------------------- | ---------------- |
| Last-write-wins       | ✅ Simple       | ❌ Data loss        | Single user      |
| Server-authoritative  | 🟡 Medium       | ✅ Server decides   | Low concurrency  |
| Optimistic + rollback | 🟡 Medium       | ✅ Ack/reject       | Most apps        |
| Operational Transform | ❌ Complex      | ✅ Transform ops    | Real-time collab |
| CRDT                  | ❌ Very complex | ✅ Automatic merge  | P2P, offline     |

**🤔 Câu hỏi interviewer có thể hỏi:**

| Câu hỏi              | Cách trả lời                                                                               |
| -------------------- | ------------------------------------------------------------------------------------------ |
| "Optimistic update?" | "Apply locally first → send to server → rollback if rejected. Faster UX."                  |
| "CRDT?"              | "Conflict-free Replicated Data Type. Math guarantees eventual consistency. Used by Figma." |
| "Version vector?"    | "Each client maintains counter. Compare vectors to detect conflicts."                      |
| "Interview scope?"   | "Mention OT/CRDT concepts. Don't implement. Show awareness of distributed systems."        |

---

### Mistake 30: Ignoring React Strict Mode Warnings

```tsx
// ❌ WRONG: Code that "works" but breaks in StrictMode
function CheckboxTree() {
  const [data, setData] = useState(initialData);
  let renderCount = 0; // ❌ Module-level mutation!

  // StrictMode double-renders: renderCount = 2 on first render!
  renderCount++;
  console.log("Render:", renderCount); // Shows 2 instead of 1

  useEffect(() => {
    // StrictMode double-mounts: this runs TWICE!
    const ws = new WebSocket("wss://api.example.com");
    ws.onmessage = handleTreeUpdate;
    // ❌ No cleanup → 2 WebSocket connections!
  }, []);

  useEffect(() => {
    // StrictMode: mount → unmount → mount
    fetchInitialData().then((result) => {
      setData(result); // Second fetch overwrites first!
    });
    // ❌ No cleanup → double fetch, potential race condition!
  }, []);
}

// ✅ CORRECT: Code that works in StrictMode AND production
function CheckboxTree() {
  const [data, setData] = useState(initialData);

  // ✅ No module-level mutations — use useRef for mutable values
  const renderCount = useRef(0);
  renderCount.current++;

  // ✅ WebSocket with proper cleanup
  useEffect(() => {
    const ws = new WebSocket("wss://api.example.com");
    ws.onmessage = handleTreeUpdate;

    return () => {
      ws.close(); // StrictMode: unmount closes first WS, remount opens second
    };
  }, []);

  // ✅ Fetch with abort
  useEffect(() => {
    const controller = new AbortController();

    fetchInitialData({ signal: controller.signal })
      .then((result) => {
        if (!controller.signal.aborted) {
          setData(result);
        }
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.error(err);
        }
      });

    return () => controller.abort(); // StrictMode: cancels first fetch
  }, []);
}

// ✅ WHY StrictMode exists:
// 1. Finds side effects that need cleanup
// 2. Exposes stale closure bugs
// 3. Prepares for React concurrent features (Suspense, transitions)
// 4. Double-render catches impure render logic
// 5. Only active in development — zero production cost
```

**📊 StrictMode Double Execution:**

| What Runs Twice                   | Why                    | How to Fix                |
| --------------------------------- | ---------------------- | ------------------------- |
| Component body                    | Detect impure renders  | No side effects in render |
| `useState` initializer            | Detect mutations       | Pure function only        |
| `useReducer` reducer              | Detect mutations       | Pure function only        |
| `useEffect` (mount→unmount→mount) | Detect missing cleanup | Always return cleanup     |
| `useMemo` callback                | Detect side effects    | Pure computation only     |

**📊 Common StrictMode Failures:**

| Code Pattern                        | StrictMode Behavior | Fix                          |
| ----------------------------------- | ------------------- | ---------------------------- |
| `let count = 0; count++` in render  | Count = 2           | Use `useRef`                 |
| `fetch()` in `useEffect` no cleanup | Double fetch        | `AbortController`            |
| `addEventListener` no cleanup       | Double listener     | Return `removeEventListener` |
| `new WebSocket()` no cleanup        | 2 connections       | Return `ws.close()`          |
| `setInterval` no cleanup            | 2 intervals         | Return `clearInterval`       |

**🤔 Câu hỏi interviewer có thể hỏi:**

| Câu hỏi                | Cách trả lời                                                                                 |
| ---------------------- | -------------------------------------------------------------------------------------------- |
| "StrictMode in prod?"  | "No! Only in development. Zero performance impact in production build."                      |
| "Why double renders?"  | "Catches impure render functions. If render has side effects, you'll see them doubled."      |
| "Disable StrictMode?"  | "Never! Fix the code instead. StrictMode reveals real bugs that affect concurrent features." |
| "Concurrent features?" | "React 18: startTransition, Suspense, useDeferredValue. All require clean effects."          |

---

## PHẦN D: INTERVIEW TIPS & TALKING POINTS

> 🎯 Những điểm quan trọng cần nhấn mạnh khi trình bày.

### 1. Cách Mở Đầu (First 2 Minutes)

**Làm:**

```
"Đây là bài toán tree traversal với bidirectional state propagation.
Khi checkbox được click:
1. Update chính nó
2. Propagate DOWN đến tất cả descendants
3. Propagate UP để update ancestors

Tôi sẽ dùng:
- Recursive rendering cho arbitrary depth
- Index path để track vị trí trong tree
- State lifting để root component là single source of truth"
```

**Đừng:**

```
"OK để tôi bắt đầu code luôn..."
→ Không show thinking process
```

---

### 2. Key Talking Points

| Khi           | Nói                                                                |
| ------------- | ------------------------------------------------------------------ |
| Define types  | "Recursive type với optional children cho cả leaf và parent nodes" |
| CheckboxInput | "Indeterminate chỉ set được qua JS, dùng useRef + useEffect"       |
| CheckboxList  | "Recursive component - render chính nó cho children"               |
| State updates | "Bidirectional: propagate down với DFS, resolve up bottom-up"      |
| Clone data    | "Deep clone để tránh mutate original, React cần new reference"     |

---

### 3. Handle Follow-up Questions

| Câu hỏi                         | Trả lời                                                                  |
| ------------------------------- | ------------------------------------------------------------------------ |
| "Performance với 10,000 nodes?" | "Virtualization với react-window. Chỉ render visible nodes."             |
| "Add search/filter?"            | "Filter tree recursively. Show node nếu match hoặc có descendant match." |
| "Persist state?"                | "Serialize checked IDs to localStorage hoặc sync với backend."           |
| "Drag and drop reorder?"        | "react-dnd hoặc dnd-kit. Update indices sau drop."                       |
| "Lazy load children?"           | "Children có thể là Promise. Expand node triggers fetch."                |
| "Keyboard navigation?"          | "Arrow keys để navigate, Space để toggle. Manage focus với refs."        |
| "Accessibility?"                | "aria-expanded cho parents, aria-checked='mixed' cho indeterminate."     |

---

### 4. Time Management (45 min)

```
┌─────────────────────────────────────────────────────────────────┐
│  INTERVIEW TIMELINE                                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  0-3 min: Clarify requirements                                  │
│  ├── Tree depth? Performance requirements?                      │
│  └── "What happens when clicking indeterminate checkbox?"       │
│                                                                 │
│  3-8 min: High-level design                                     │
│  ├── Component structure diagram                                │
│  ├── State propagation explanation                              │
│  └── Data structure (CheckboxItem type)                         │
│                                                                 │
│  8-30 min: Implementation                                       │
│  ├── Types (3 min)                                              │
│  ├── CheckboxInput with indeterminate (5 min)                   │
│  ├── CheckboxList recursive (7 min)                             │
│  ├── State update functions (7 min)                             │
│  └── Root component (3 min)                                     │
│                                                                 │
│  30-40 min: Testing & edge cases                                │
│  ├── Walk through code                                          │
│  └── Discuss test cases                                         │
│                                                                 │
│  40-45 min: Improvements & Q&A                                  │
│  ├── Performance optimizations                                  │
│  └── Answer follow-up questions                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### 5. Demonstrating Seniority (Leveling Signals)

> 💡 Interviewer đánh giá LEVEL dựa trên **cách bạn nghĩ**, không chỉ code chạy được.

**Junior signals (L3-L4):**

```
- Code works ✅
- Handles basic cases ✅
- Needs hints for edge cases
- Doesn't mention testing
- No performance awareness
```

**Mid-level signals (L4-L5):**

```
- Code works + edge cases ✅
- Mentions trade-offs
- Writes clean code with types
- Tests mentioned
- Basic optimization awareness
```

**Senior signals (L5-L6):**

```
- Identifies problem class: "Đây là bidirectional tree state propagation"
- Discusses alternatives BEFORE coding: "Có 3 approach: recursive useState,
  useReducer, hoặc normalized store. Tôi chọn X vì..."
- Proactive about trade-offs: "structuredClone O(n) mỗi click,
  nhưng acceptable cho < 1000 nodes. Nếu scale, switch to Immer."
- Production awareness: "Cần error boundary, loading state,
  và keyboard navigation cho a11y"
- System thinking: "Component này sẽ integrate với form submission,
  cần expose checked IDs qua callback hoặc context"
```

**Staff+ signals (L6+):**

```
- Architectural framing: "Bài toán này tương đương với form state management.
  Cùng pattern với address pickers, permission trees, file browsers."
- Cross-cutting concerns: "Nếu tree data từ API, cần cache invalidation
  strategy. useSWR/React Query với mutation."
- Mentoring language: "Nếu junior teammate implement, tôi sẽ khuyên
  start simple rồi optimize."
- Impact awareness: "Feature này affect conversion rate.
  Need analytics: time-to-complete, error rate."
```

**📊 What Interviewers Look For at Each Level:**

| Signal           | Junior    | Mid           | Senior       | Staff+               |
| ---------------- | --------- | ------------- | ------------ | -------------------- |
| Working code     | ✅ Must   | ✅ Must       | ✅ Must      | ✅ Must              |
| Types/interfaces | 🟡 Basic  | ✅ Good       | ✅ Strict    | ✅ Generic           |
| Edge cases       | ❌ Misses | 🟡 Some       | ✅ All       | ✅ Prevents          |
| Trade-offs       | ❌ None   | 🟡 Mentions   | ✅ Discusses | ✅ Quantifies        |
| Testing          | ❌ None   | 🟡 Mentions   | ✅ Plans     | ✅ Strategies        |
| System design    | ❌ None   | ❌ None       | 🟡 Aware     | ✅ Drives            |
| Communication    | Code only | Explains code | Explains WHY | Influences direction |

---

### 6. Technical Communication Patterns

> 🗣️ HOW you explain matters as much as WHAT you build.

**Pattern 1: Think Aloud**

```
❌ Silent coding for 10 minutes
✅ "Tôi đang viết updateDescendants function.
    Nó sẽ DFS traverse tất cả children và set checked = newValue.
    Base case: leaf node (no children).
    Recursive case: set self + recurse into each child."
```

**Pattern 2: Trade-off Framing**

```
❌ "Tôi dùng structuredClone"
✅ "Tôi có 3 options cho immutable update:
    1. JSON.parse(JSON.stringify) — simple nhưng loses Date/undefined
    2. structuredClone — better, handles most types, O(n)
    3. Immer — best DX, structural sharing, slight overhead

    Cho interview scope, tôi chọn structuredClone vì:
    - Built-in, no imports
    - Correct for our data types
    - Performance acceptable cho demo data size

    Production: tôi sẽ dùng Immer hoặc structural sharing."
```

**Pattern 3: Proactive Edge Cases**

```
❌ Wait for interviewer to ask
✅ "Trước khi code, tôi note vài edge cases:
    - Empty tree: [] → render empty state
    - Single node (no children): leaf, no children to propagate
    - Very deep tree: recursive có thể stack overflow > 10K levels
    - All checked → uncheck parent → tất cả children uncheck
    - Circular reference: cần guard (production concern)"
```

**Pattern 4: Complexity Analysis**

```
❌ Don't mention complexity
✅ "handleCheck complexity:
    - Clone: O(n) where n = total nodes
    - Find node by path: O(d) where d = depth
    - Update descendants: O(k) where k = subtree size
    - Resolve ancestors: O(d)
    - Total: O(n) dominated by clone

    Optimize: structural sharing → O(d + k) instead of O(n)"
```

**Pattern 5: Naming and Code Organization**

```
❌ function f1(a, b) { ... }
✅ function updateCheckboxAndDescendants(node: CheckboxItem, checked: boolean): void
   // ↑ Name tells EXACTLY what it does
   // ↑ Types tell EXACTLY what it takes and returns
```

---

### 7. Architecture Discussion Points

> 🏗️ Câu hỏi mở rộng về architecture — cách trả lời level senior.

**Q: "Làm sao integrate component này vào form lớn hơn?"**

```tsx
// ✅ Senior answer: Expose minimal API
interface CheckboxTreeProps {
  data: CheckboxItem[];
  onChange: (checkedIds: number[]) => void; // Only expose what consumer needs
  defaultCheckedIds?: number[];
  disabled?: boolean;
  name?: string; // For form integration
}

// Form integration
function OrderForm() {
  const { register, setValue, watch } = useForm();

  return (
    <form>
      <CheckboxTree
        data={categories}
        name="categories"
        onChange={(ids) => setValue("categoryIds", ids)}
      />
      {/* Other form fields */}
    </form>
  );
}

// Talking point: "Component exposes checkedIds callback,
// not internal tree structure. Consumer doesn't need to know
// about indeterminate state or tree traversal.
// Clean separation of concerns."
```

**Q: "Team khác cũng cần component tương tự. Design library thế nào?"**

```tsx
// ✅ Senior answer: Headless + styled pattern
// 1. Headless hook (logic only)
const { data, check, checkAll, expandedIds, toggle } = useCheckboxTree({
  initialData,
  onChange,
});

// 2. Unstyled components (structure only)
<Tree data={data}>
  <TreeItem render={({ item, check, expanded }) => (
    <CustomCheckbox checked={item.checked} onChange={check} />
  )} />
</Tree>

// 3. Styled preset (ready to use)
<CheckboxTree data={data} theme="default" />

// Talking point: "3-layer architecture giống Radix UI / Headless UI.
// Hook cho logic reuse. Unstyled cho full customization.
// Styled cho quick integration. Teams pick their level."
```

**Q: "Scale cho micro-frontend architecture?"**

```
✅ Senior answer:
"Component expose custom element cho framework-agnostic sharing:
1. React component → wrapped in custom element
2. Bundle as separate package với peer dependencies
3. Communicate via custom events hoặc shared state (Zustand)
4. Lazy load: <script type='module' src='checkbox-tree.js'>

Giống cách apps như Shopify, Slack share components across teams."
```

---

### 8. Handling "I Don't Know" Gracefully

> 🤷 Không biết câu trả lời? Cách handle mà vẫn gain points.

**❌ BAD responses:**

```
"Tôi không biết." (full stop)
"Tôi chưa dùng bao giờ." (no effort)
"Hmm... *silence*" (awkward)
```

**✅ GOOD responses:**

**Pattern 1: Reason from first principles**

```
Q: "Bạn biết gì về React Forget/Compiler?"
A: "Tôi chưa dùng trực tiếp, nhưng từ concept tôi hiểu:
    - Problem: manual memo/useCallback adds complexity
    - Solution: compiler auto-detects reactive dependencies
    - Impact: memo() và useCallback() become unnecessary
    - Tương tự như Vue's reactivity system auto-tracks deps

    Tôi sẽ research thêm after interview."
```

**Pattern 2: Related experience**

```
Q: "Bạn có kinh nghiệm với Web Workers cho tree operations?"
A: "Tôi chưa dùng Worker cho trees specifically, nhưng:
    - Tôi biết Workers run on separate thread, communicate via postMessage
    - Good cho CPU-intensive tasks: sort 10K nodes, complex filtering
    - Trade-off: serialization overhead for message passing
    - Tôi sẽ approach nó bằng cách: profile first →
      identify bottleneck → move ONLY that computation to worker"
```

**Pattern 3: Acknowledge and redirect**

```
Q: "Performance khác biệt giữa React Fiber và Vue reactivity cho trees?"
A: "Tôi biết React dùng reconciliation (diff VDOMs),
    Vue dùng reactive proxies (track dependencies).
    Cho tree updates, Vue có thể granular hơn vì
    nó track chính xác property nào change.

    Nhưng tôi confident hơn về React approach,
    và tôi có thể show cách optimize React tree với
    memo + stable callbacks để achieve similar granularity."
```

---

### 9. Code Quality Signals Trong Interview

> ✨ Những chi tiết nhỏ tạo ấn tượng lớn.

**Signal 1: Consistent naming**

```tsx
// ❌ Mixed conventions
const handleClick = ...
const onChangeCheckbox = ...
const toggleCheck = ...

// ✅ Consistent convention
const handleCheck = ...      // All handlers: handle + Action
const handleExpand = ...
const handleSearch = ...
```

**Signal 2: Early returns**

```tsx
// ❌ Deeply nested
function resolveCheckboxStates(node, indices) {
  if (indices.length > 0) {
    const child = node.children[indices[0]];
    if (child) {
      resolveCheckboxStates(child, indices.slice(1));
      if (node.children) {
        // ... deep nesting ...
      }
    }
  }
}

// ✅ Early returns — flat and readable
function resolveCheckboxStates(node: CheckboxItem, indices: number[]): void {
  if (indices.length === 0) return; // Base case
  if (!node.children) return; // Guard

  const child = node.children[indices[0]];
  if (!child) return; // Guard

  resolveCheckboxStates(child, indices.slice(1));
  node.checked = determineParentState(node.children);
}
```

**Signal 3: Extract meaningful functions**

```tsx
// ❌ Inline logic
const allChecked = node.children.every((c) => c.checked === true);
const allUnchecked = node.children.every((c) => c.checked === false);
node.checked = allChecked ? true : allUnchecked ? false : "indeterminate";

// ✅ Extracted with clear name
function determineParentState(children: CheckboxItem[]): CheckboxValue {
  const allChecked = children.every((c) => c.checked === true);
  if (allChecked) return true;

  const allUnchecked = children.every((c) => c.checked === false);
  if (allUnchecked) return false;

  return "indeterminate";
}
// Name = documentation. Anyone reading code understands intent.
```

**Signal 4: TypeScript precision**

```tsx
// ❌ Loose
function handleCheck(checked: any, indices: any) { ... }

// ✅ Precise
function handleCheck(checked: boolean, indices: readonly number[]): void { ... }
// readonly = I won't mutate the array. Signal of intentional coding.
```

**Signal 5: Comment WHY, not WHAT**

```tsx
// ❌ Comments that repeat code
// Set checked to true
node.checked = true;

// ✅ Comments that explain WHY
// Process children bottom-up so parent state is calculated
// after all descendants are finalized
resolveCheckboxStates(node, indices.slice(1));
```

---

### 10. System Design Bridge

> 🌉 Cách nào connect coding challenge → system design discussion.

**10a. Data Flow Architecture**

```
"Checkbox tree component là part of larger system:

┌──────────────────────────────────────────────────┐
│                    Backend                        │
│  ┌─────────┐    ┌─────────┐    ┌──────────────┐ │
│  │ REST API │    │ GraphQL │    │ WebSocket    │ │
│  │ /tree    │    │ query   │    │ subscriptions│ │
│  └────┬─────┘    └────┬────┘    └──────┬───────┘ │
└───────┼──────────────┼────────────────┼──────────┘
        │              │                │
┌───────┼──────────────┼────────────────┼──────────┐
│       ▼              ▼                ▼          │
│  ┌─────────┐    ┌─────────┐    ┌──────────┐     │
│  │ React   │◄──►│ State   │◄──►│ Real-time│     │
│  │ Query   │    │ Manager │    │ Sync     │     │
│  └────┬────┘    └────┬────┘    └──────────┘     │
│       │              │                           │
│       ▼              ▼                           │
│  ┌────────────────────────────────────┐          │
│  │         CheckboxTree Component     │          │
│  │  ┌──────┐  ┌──────┐  ┌─────────┐ │          │
│  │  │ Hook │  │Render│  │  Events │ │          │
│  │  └──────┘  └──────┘  └─────────┘ │          │
│  └────────────────────────────────────┘          │
│                    Frontend                       │
└──────────────────────────────────────────────────┘
"
```

**10b. Scalability Discussion**

```
"Scaling considerations:

Size tiers:
- Small (< 100 nodes): Simple state, structuredClone, recursive render
- Medium (100-1K): React.memo, useCallback, Immer
- Large (1K-10K): Virtualization, normalized store, Web Workers
- Massive (> 10K): Server-side filtering, pagination, lazy load

Caching strategy:
- Client: React Query / SWR with stale-while-revalidate
- Invalidation: Mutation → invalidate tree query
- Optimistic: Apply locally → confirm with server

Performance budget:
- Initial render: < 100ms (perceived)
- Click response: < 16ms (single frame)
- Search/filter: < 200ms (debounced)
"
```

**10c. Monitoring & Observability**

```
"Production monitoring cho tree component:

1. Performance metrics:
   - render duration (React Profiler)
   - interaction to paint (Web Vitals INP)
   - tree load time

2. Error tracking:
   - Sentry for JS errors
   - Error boundary catches + reports

3. Usage analytics:
   - How deep do users expand?
   - Average selections per session
   - Time to complete tree selection

4. Alerts:
   - Render time > 100ms → investigation
   - Error rate > 1% → bug fix priority
"
```

---

### 11. Behavioral Connection Points

> 🧠 Link coding decisions → behavioral competencies.

**Leadership signal:**

```
"Tôi chọn approach đơn giản nhất trước vì:
1. Team mới có thể hiểu và maintain
2. Optimize chỉ khi data shows bottleneck
3. Code review easier khi logic straightforward

Nếu performance issue xuất hiện, tôi sẽ:
1. Profile với DevTools
2. Identify top 3 bottlenecks
3. Fix highest-impact first
4. Measure improvement
5. Document decision cho team"
```

**Collaboration signal:**

```
"Design component API sao cho:
1. Backend team: clear contract (checkedIds: number[])
2. Design team: customizable via CSS vars / theming
3. QA team: testable via aria attributes
4. PM: measurable via analytics events

Tôi thường viết ADR (Architecture Decision Record) cho decisions
như 'tại sao dùng useReducer thay vì useState cho tree state',
để team members hiểu reasoning."
```

**Growth mindset signal:**

```
"Lần đầu implement tree component, tôi dùng mutable state
và gặp bug khó reproduce. Từ đó tôi:
1. Luôn dùng immutable updates
2. Viết tests cho edge cases trước
3. Dùng TypeScript strict mode từ đầu

Gần đây tôi học thêm về Immer và structural sharing
để optimize cho larger datasets."
```

---

### 12. Common Interviewer Red Flags to Avoid

> 🚩 Những điều interviewer sẽ đánh dấu negative.

| Red Flag                      | Why It's Bad                               | What to Do Instead                                                |
| ----------------------------- | ------------------------------------------ | ----------------------------------------------------------------- |
| Start coding without planning | Shows no strategic thinking                | Spend 3-5 min discussing approach                                 |
| Silent for > 30 seconds       | Interviewer can't evaluate your thinking   | Think aloud, even if uncertain                                    |
| Copy-paste from memory        | Shows rote memorization, not understanding | Derive solution step by step                                      |
| "I always do it this way"     | Shows inflexibility                        | "Approach depends on context: X for small, Y for large"           |
| Skip types                    | Shows lack of rigor                        | Define interfaces FIRST                                           |
| Name variables x, y, temp     | Shows sloppy habits                        | Descriptive names always                                          |
| Ignore edge cases             | Shows lack of experience                   | Proactively mention edge cases                                    |
| "That's easy"                 | Sounds arrogant                            | "Interesting problem. Let me think about the state management..." |
| No questions back             | Shows passive thinking                     | Ask: "What scale? How many levels deep?"                          |
| Over-engineer immediately     | Shows poor prioritization                  | Start simple, mention optimizations                               |
| Get stuck, stay stuck         | Shows inability to adapt                   | "Let me try different approach..."                                |
| "This works in my project"    | Shows inability to explain                 | Explain the WHY, not just the WHAT                                |

**📊 Positive Signals Checklist:**

```
Before coding:
☐ Ask clarifying questions (data size, features, constraints)
☐ Discuss 2-3 approaches with trade-offs
☐ Choose one with reasoning
☐ Outline expected components/functions

During coding:
☐ Think aloud
☐ Types/interfaces first
☐ Meaningful names
☐ Handle edge cases proactively
☐ Comment WHY, not WHAT
☐ Clean code (early returns, small functions)

After coding:
☐ Walk through with example data
☐ Identify limitations
☐ Suggest improvements (testing, perf, a11y)
☐ Ask: "Anything I should elaborate on?"
```

---

### 13. Live Coding Recovery Strategies

> 🔄 Khi bị stuck hoặc code sai — cách recover mà vẫn impress.

**Scenario 1: Bug in recursive logic**

```
Situation: resolveCheckboxStates returns wrong parent state

❌ BAD: Panic, delete everything, start over
❌ BAD: Silent debugging for 5 minutes

✅ GOOD:
"Hmm, parent state is wrong. Let me trace through:
- Node A has children [B(✅), C(❌)]
- Expected: A = indeterminate
- Got: A = true

Ah, I see the bug — I'm checking children BEFORE recursive call.
Need to recurse first, THEN calculate parent.
Let me fix the order... [swap lines]
Now: recurse → children resolved → parent calculated correctly."
```

**Scenario 2: Forgot how `useEffect` cleanup works**

```
❌ BAD: "Umm... I think it returns something..."

✅ GOOD:
"Let me think about this systematically.
useEffect runs after render. If I return a function,
React calls it before next effect or unmount.
Like a constructor/destructor pair.
[writes: return () => { cleanup(); }]
Yes, that's the cleanup pattern."
```

**Scenario 3: Completely wrong approach**

```
❌ BAD: Keep going down wrong path for 15 minutes

✅ GOOD: (after 3-5 minutes)
"Actually, I realize this approach won't handle
the indeterminate case well because [reason].
Let me pivot to a different approach:
Instead of storing checked state in each node,
I'll use a separate Set<number> for checked IDs
and compute indeterminate on-the-fly.
This is cleaner because..."
```

**📊 Recovery Timing:**

| Time Stuck | Action                                         |
| ---------- | ---------------------------------------------- |
| 30 seconds | Think aloud, re-read your code                 |
| 1 minute   | Trace through with concrete example            |
| 2 minutes  | Ask clarifying question to interviewer         |
| 3 minutes  | Simplify: "Let me handle the basic case first" |
| 5 minutes  | Pivot: "Let me try a different approach"       |

---

### 14. Whiteboard vs IDE Interview Strategies

> 🖥️ Mỗi format cần approach khác nhau.

**Whiteboard / Google Docs (No autocomplete):**

```
Priority:
1. Pseudocode structure first
2. Core logic correct
3. Types as comments, not formal interfaces
4. Skip imports entirely
5. Abbreviate obvious code

Example:
// CheckboxItem: { id, name, checked: bool|'indeterminate', children?: [] }

function handleCheck(data, indices, checked) {
  const newData = clone(data)
  const node = getByPath(newData, indices)

  // 1. Update self + descendants
  updateDown(node, checked)

  // 2. Update ancestors bottom-up
  resolveUp(newData[indices[0]], indices.slice(1))

  return newData
}

// Don't write full React component on whiteboard
// Focus on algorithm, mention component structure verbally
```

**IDE / CodeSandbox (Full execution):**

```
Priority:
1. Types and interfaces FIRST (shows rigor)
2. Working code that runs
3. Console.log for quick verification
4. Use autocomplete, don't memorize APIs
5. Write a mini test at the end

// Start with types
interface CheckboxItem {
  id: number;
  name: string;
  checked: boolean | "indeterminate";
  children?: CheckboxItem[];
}

// Then build incrementally — run after each function
```

**Take-home / Async:**

```
Priority:
1. Production-quality code
2. Full TypeScript strict mode
3. Tests (unit + integration)
4. README with design decisions
5. Performance considerations documented
6. Accessibility complete
7. Error handling + edge cases
8. Clean git history (meaningful commits)

// Go above and beyond — this is your chance to shine
```

**📊 Format Comparison:**

| Aspect             | Whiteboard | IDE         | Take-home     |
| ------------------ | ---------- | ----------- | ------------- |
| **Time**           | 30-45 min  | 45-60 min   | 3-5 hours     |
| **Types**          | Comments   | Formal      | Strict        |
| **Tests**          | Verbal     | Optional    | Required      |
| **Imports**        | Skip       | Auto        | Full          |
| **Edge cases**     | Mention    | Handle some | Handle all    |
| **a11y**           | Mention    | Basic       | Complete      |
| **Styling**        | Skip       | Basic       | Polished      |
| **Error handling** | Mention    | Basic       | Comprehensive |

---

### 15. Mock Interview Script: Full 45-Min Walkthrough

> 🎬 Exact script cho nested checkboxes interview.

**[0:00-0:30] — Greeting & Setup**

```
"Hi! Thanks for having me. Tôi sẵn sàng bắt đầu."
→ Open editor, create file
```

**[0:30-3:00] — Clarify Requirements**

```
"Trước khi code, tôi muốn clarify vài điểm:

1. Tree depth: Fixed hay arbitrary?
   → Interviewer: Arbitrary depth

2. Data source: Static hay từ API?
   → Interviewer: Start with static, discuss API later

3. Indeterminate state: Cần handle?
   → Interviewer: Yes

4. Features: Select all? Search? Expand/collapse?
   → Interviewer: Basic first, then discuss

OK, so bài toán là: Nested checkbox tree với arbitrary depth,
bidirectional state propagation, và indeterminate support."
```

**[3:00-5:00] — High-Level Design**

```
"Approach của tôi:

Components:
1. CheckboxTree (root) — owns state
2. CheckboxList (recursive) — renders children
3. CheckboxInput (leaf) — handles indeterminate via ref

Data flow:
- Click → handleCheck(checked, indices)
- Clone data → update node + descendants (DFS down)
- Resolve ancestors (DFS up, bottom-up)
- setState triggers re-render

Tôi chọn structured clone + recursive approach
vì straightforward cho interview scope.
Production: tôi sẽ consider Immer cho structural sharing.

Ready bắt đầu code?"
```

**[5:00-8:00] — Types**

```tsx
"Bắt đầu với types — foundation cho everything:

interface CheckboxItem {
  id: number;
  name: string;
  checked: boolean | 'indeterminate';
  children?: CheckboxItem[];
}

Recursive type — CheckboxItem có thể chứa chính nó.
'indeterminate' là string literal, ko phải boolean.
children optional — leaf nodes không có."
```

**[8:00-13:00] — CheckboxInput Component**

```tsx
"CheckboxInput handles indeterminate — key insight:
HTML checkbox indeterminate chỉ set được qua JavaScript,
không có HTML attribute.
Nên tôi dùng useRef + useEffect."

// [Code CheckboxInput with ref and effect]

"useEffect syncs indeterminate property mỗi khi
checked changes. Ref gives direct DOM access."
```

**[13:00-20:00] — Recursive CheckboxList**

```tsx
"CheckboxList render recursive — core pattern:
Component render chính nó cho children.
indices track position trong tree."

// [Code CheckboxList with recursive rendering]

"Key insight: indices array grows at each level.
[0] → [0, 2] → [0, 2, 1]
Like breadcrumbs through the tree."
```

**[20:00-30:00] — State Update Logic**

```tsx
"Phần quan trọng nhất — bidirectional propagation:"

"Step 1: updateCheckboxAndDescendants
DFS traversal — set checked on node and ALL descendants."

// [Code updateCheckboxAndDescendants]

"Step 2: resolveCheckboxStates
Bottom-up — calculate parent from children states.
3 cases: all checked → true, all unchecked → false,
mixed → 'indeterminate'."

// [Code resolveCheckboxStates]

"Step 3: handleCheck ties it together:
Clone → find node → update down → resolve up → setState."

// [Code handleCheck]
```

**[30:00-35:00] — Walk Through Example**

```
"Let me trace through:
Data: A [B, C [D, E]]
Click on D (check):

1. Clone data
2. Find D at path [2, 0] — A.children[2].children[0]
3. D.checked = true
4. No children to propagate down
5. Resolve C: D=✅, E=❌ → C = indeterminate
6. Resolve A: B=❌, C=indeterminate → A = indeterminate

Result: D=✅, E=❌, C=◼, B=❌, A=◼ ✅ Correct!"
```

**[35:00-40:00] — Edge Cases & Testing**

```
"Edge cases I'd test:
1. Empty tree → empty state UI
2. Single node → no propagation needed
3. Check parent → all children checked
4. Uncheck one child → parent becomes indeterminate
5. Re-check that child → parent returns to checked

Testing approach:
- Unit: test updateCheckboxAndDescendants in isolation
- Integration: RTL render tree, click checkboxes, verify states
- A11y: check aria-checked='mixed' for indeterminate"
```

**[40:00-45:00] — Improvements & Q&A**

```
"If I had more time:
1. Performance: React.memo + useCallback cho memoization
2. Virtualization: react-window cho 10K+ nodes
3. Expand/collapse: separate UI state (Set<number>)
4. Search: filter tree recursively, show matching paths
5. A11y: full keyboard nav, ARIA tree pattern
6. Testing: full RTL test suite

Questions for you?"
```

---

### 16. Company-Specific Interview Adaptation

> 🏢 Mỗi company focus khác nhau — adjust approach accordingly.

**FAANG / Big Tech (Google, Meta, Amazon):**

```
Focus: Algorithm correctness + complexity analysis
Expect:
- Optimal time/space complexity
- Clean code under pressure
- Discuss trade-offs
- Handle follow-up variations
- Strong communication

Emphasis for nested checkboxes:
- "O(n) per click due to clone. Optimizable to O(d+k)
   with structural sharing."
- "DFS pre-order for display, post-order for state resolution."
- "Indeterminate is key complexity — 3-state instead of boolean."
```

**Startups / Scale-ups:**

```
Focus: Shipping speed + pragmatism
Expect:
- Working feature fast
- Good UX decisions
- Production awareness
- "How fast can you build this?"

Emphasis for nested checkboxes:
- "I'd use a headless library like Downshift pattern
   to ship faster."
- "Start with 2-level, extend to arbitrary later."
- "Ship checkbox, add indeterminate in v2 if PM needs it."
```

**Consulting / Enterprise:**

```
Focus: Maintainability + team scalability
Expect:
- Clean architecture
- Documentation
- Testing strategy
- Code review readiness

Emphasis for nested checkboxes:
- "Well-documented component with JSDoc + Storybook."
- "Comprehensive test suite — 90%+ coverage."
- "ADR for key decisions (why useReducer over useState)."
- "Component library integration — versioning strategy."
```

**Fintech / Healthcare:**

```
Focus: Correctness + accessibility + compliance
Expect:
- Zero bugs in state logic
- Full WCAG compliance
- Audit trail
- Data validation

Emphasis for nested checkboxes:
- "Zod validation for tree data from API."
- "Full keyboard navigation + screen reader support."
- "ARIA tree pattern with role=tree, role=treeitem."
- "Every state change logged for audit."
```

**📊 Company Type → Priority Matrix:**

| Priority      | FAANG  | Startup | Enterprise | Fintech |
| ------------- | ------ | ------- | ---------- | ------- |
| Algorithm     | ⭐⭐⭐ | ⭐      | ⭐⭐       | ⭐⭐    |
| Speed         | ⭐⭐   | ⭐⭐⭐  | ⭐         | ⭐      |
| Testing       | ⭐⭐   | ⭐      | ⭐⭐⭐     | ⭐⭐⭐  |
| A11y          | ⭐     | ⭐      | ⭐⭐       | ⭐⭐⭐  |
| Architecture  | ⭐⭐   | ⭐      | ⭐⭐⭐     | ⭐⭐    |
| Communication | ⭐⭐⭐ | ⭐⭐    | ⭐⭐⭐     | ⭐⭐    |
| Trade-offs    | ⭐⭐⭐ | ⭐⭐    | ⭐⭐       | ⭐⭐    |

---

### 17. Post-Interview Reflection Framework

> 📝 Sau interview — cách tự đánh giá và improve.

**Reflection Template:**

```
## Interview Reflection: [Company] - [Date]

### What went well?
- [ ] Clear problem decomposition
- [ ] Types defined first
- [ ] Think aloud throughout
- [ ] Handled follow-ups
- [ ] Mentioned edge cases
- [ ] Discussed trade-offs
- [ ] Code ran correctly

### What could improve?
- [ ] Got stuck on: _______________
- [ ] Forgot about: _______________
- [ ] Should have mentioned: _______________
- [ ] Time management: finished/didn't finish
- [ ] Communication gap: _______________

### Technical gaps identified:
1. _______________
2. _______________

### Action items:
1. Practice: _______________
2. Review: _______________
3. Build: _______________
```

**Common Post-Interview Realizations:**

| "I should have..."            | How to Practice                                     |
| ----------------------------- | --------------------------------------------------- |
| Started with types            | Always write interfaces first, even on paper        |
| Mentioned memo/useCallback    | Practice explaining optimization verbally           |
| Handled indeterminate earlier | Build full implementation 3 times                   |
| Managed time better           | Set phone timer during mock interviews              |
| Asked more questions          | Write 5 clarifying questions per problem            |
| Explained complexity          | Practice O(n) analysis for every function you write |
| Discussed alternatives        | For each solution, prep 2 alternatives              |
| Written tests                 | Practice writing RTL tests from memory              |

**Deliberate Practice Plan:**

```
Week 1: Build nested checkboxes from scratch (no reference)
         Target: 45 minutes, working code

Week 2: Build with add-ons (expand/collapse, search)
         Target: 45 minutes, complete feature

Week 3: Mock interview with friend
         Target: Full 45-min simulation

Week 4: Build variant (file browser, permission tree)
         Target: Apply same patterns to different domain

Week 5: Build from scratch AGAIN
         Target: < 30 minutes, production quality
```

---

### 18. Complete Interview Cheat Sheet

> 📋 1-page reference — review 30 min trước interview.

```
╔══════════════════════════════════════════════════════════════╗
║              NESTED CHECKBOXES — CHEAT SHEET                 ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  DATA TYPE:                                                  ║
║  interface CheckboxItem {                                    ║
║    id: number;                                               ║
║    name: string;                                             ║
║    checked: boolean | 'indeterminate';                       ║
║    children?: CheckboxItem[];                                ║
║  }                                                           ║
║                                                              ║
║  3 COMPONENTS:                                               ║
║  1. CheckboxTree    → owns state, passes handleCheck down    ║
║  2. CheckboxList    → recursive, renders children            ║
║  3. CheckboxInput   → useRef for indeterminate               ║
║                                                              ║
║  CORE ALGORITHM:                                             ║
║  handleCheck(checked, indices):                              ║
║    1. structuredClone(data)        — immutable update         ║
║    2. getNodeByPath(data, indices) — navigate to target       ║
║    3. updateDescendants(node, val) — DFS down                ║
║    4. resolveAncestors(root, path) — bottom-up               ║
║    5. setData(newData)             — trigger re-render        ║
║                                                              ║
║  INDETERMINATE:                                              ║
║  - All children checked      → parent = true                 ║
║  - All children unchecked    → parent = false                ║
║  - Mixed                     → parent = 'indeterminate'      ║
║  - Set via: ref.current.indeterminate = true (JS only)       ║
║                                                              ║
║  KEY PATTERNS:                                               ║
║  - Index path: [0, 2, 1] = root → 3rd child → 2nd child     ║
║  - Recursive component: CheckboxList renders CheckboxList    ║
║  - Bidirectional: propagate DOWN first, resolve UP second    ║
║                                                              ║
║  COMPLEXITIES:                                               ║
║  - Clone: O(n)          — dominating factor                  ║
║  - Find node: O(d)      — d = depth                         ║
║  - Update down: O(k)    — k = subtree size                  ║
║  - Resolve up: O(d)     — d = depth                         ║
║  - Total: O(n)          — optimize with Immer → O(d+k)      ║
║                                                              ║
║  OPTIMIZATIONS TO MENTION:                                   ║
║  - React.memo + useCallback    → prevent re-renders          ║
║  - Virtualization              → 10K+ nodes                  ║
║  - Immer / structural sharing  → O(d+k) updates             ║
║  - Normalized store            → flat Map instead of tree    ║
║  - Expand/collapse             → separate Set<id>            ║
║                                                              ║
║  A11Y TO MENTION:                                            ║
║  - role="tree", role="treeitem"                              ║
║  - aria-checked="mixed" for indeterminate                    ║
║  - aria-expanded for expandable nodes                        ║
║  - Keyboard: Space=toggle, Arrow=navigate                    ║
║                                                              ║
║  FOLLOW-UP ANSWERS:                                          ║
║  - 10K nodes? → Virtualization (react-window)                ║
║  - Search?    → DFS filter, keep ancestors of matches        ║
║  - API data?  → React Query + optimistic updates             ║
║  - Undo/redo? → useReducer + past/future stacks              ║
║  - Testing?   → RTL: render, click, assert aria-checked      ║
║                                                              ║
║  REMEMBER:                                                   ║
║  ★ Types first                                               ║
║  ★ Think aloud                                               ║
║  ★ Trade-offs > perfect code                                 ║
║  ★ Edge cases proactively                                    ║
║  ★ "Interesting problem" > "Easy"                            ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

---

### 19. Debugging Live Trong Interview

> 🐛 Interviewer có thể cố tình inject bug hoặc hỏi "debug this". Cách approach systematic.

**Step-by-step debugging framework:**

```
1. REPRODUCE: "Tôi thấy bug khi click parent checkbox,
   children không update. Let me trace..."

2. ISOLATE: "Bug ở updateDescendants hay resolveAncestors?
   Let me add console.log at key points...
   - Before update: node.checked = false ✅
   - After updateDescendants: children.checked = true ✅
   - After resolveAncestors: parent.checked = false ❌
   → Bug is in resolveAncestors!"

3. IDENTIFY: "In resolveAncestors, I'm checking
   children[0] instead of iterating all children.
   Only first child's state is considered."

4. FIX: "Change children[0].checked to
   children.every(c => c.checked === true) for allChecked check."

5. VERIFY: "Now click parent → all children update ✅
   Click one child off → parent = indeterminate ✅"
```

**Common bugs interviewers introduce:**

| Bug                                  | Symptom                        | Root Cause                             | Fix                           |
| ------------------------------------ | ------------------------------ | -------------------------------------- | ----------------------------- |
| Parent doesn't update                | Click child, parent stays same | Missing `resolveAncestors` call        | Add resolve step after update |
| All nodes change                     | Click one, everything toggles  | Not cloning before mutation            | Add `structuredClone`         |
| Indeterminate never shows            | Parent is only true/false      | Missing `"indeterminate"` case         | Add mixed children check      |
| Click child → wrong parent updates   | Wrong subtree affected         | Incorrect `indices` path               | Trace index navigation        |
| Infinite loop                        | Browser freezes                | `resolveAncestors` calls `handleCheck` | Separate resolve from handler |
| State doesn't persist across renders | Checkbox resets on re-render   | Using local variable instead of state  | Lift to `useState`            |

**Debugging language:**

```
✅ "Let me add a breakpoint here and trace the data flow..."
✅ "I suspect the issue is in state propagation.
    Let me verify by checking intermediate values..."
✅ "Interesting — the bug is a classic off-by-one
    in the index path. indices.slice(1) should be
    indices.slice(0, -1) for ancestor traversal."

❌ "I don't know why it's not working..."
❌ "This should work..." (without investigation)
❌ *Silently staring at code for 2 minutes*
```

---

### 20. Variant Questions & How to Pivot

> 🔄 Interviewer thường hỏi variant sau khi hoàn thành basic. Cách adapt nhanh.

**Variant 1: "Thêm Search/Filter"**

```tsx
// Approach:
"Filter tree nhưng giữ ancestors of matching nodes.
Node visible nếu: tên match HOẶC có descendant match."

function filterTree(items: CheckboxItem[], query: string): CheckboxItem[] {
  if (!query) return items;

  return items
    .map((item) => {
      const childMatches = item.children
        ? filterTree(item.children, query)
        : [];
      const selfMatches = item.name.toLowerCase().includes(query.toLowerCase());

      if (selfMatches || childMatches.length > 0) {
        return { ...item, children: selfMatches ? item.children : childMatches };
      }
      return null;
    })
    .filter(Boolean) as CheckboxItem[];
}

// Key point: "Ancestor path preserved — user sees context."
```

**Variant 2: "Thêm Drag and Drop Reorder"**

```
Approach:
"Dùng dnd-kit hoặc react-dnd.
Khi drop:
1. Remove node from old position (splice old path)
2. Insert at new position (splice new path)
3. Recalculate parent states for both old and new ancestors

Challenge: Update indices after reorder.
Solution: Use node IDs, not index paths, for DnD operations.
Convert back to indices for state updates."
```

**Variant 3: "Thêm Lazy Load Children"**

```tsx
// Approach:
"Children initially null. Expand triggers fetch.";

interface LazyCheckboxItem {
  id: number;
  name: string;
  checked: boolean | "indeterminate";
  children?: LazyCheckboxItem[] | null; // null = not loaded yet
  hasChildren: boolean; // Server tells us if expandable
}

function CheckboxItem({ item }: Props) {
  const [loading, setLoading] = useState(false);

  const handleExpand = async () => {
    if (item.children === null && item.hasChildren) {
      setLoading(true);
      const children = await fetchChildren(item.id);
      // Update tree with fetched children
      setLoading(false);
    }
  };

  return (
    <li>
      {item.hasChildren && (
        <button onClick={handleExpand}>
          {loading ? "⏳" : item.children ? "▼" : "▶"}
        </button>
      )}
      {/* ... */}
    </li>
  );
}
// Key point: "hasChildren flag avoids unnecessary expand buttons.
// Loading state per-node for non-blocking UX."
```

**Variant 4: "Make it Controlled Component"**

```tsx
// Controlled: parent owns state
interface ControlledTreeProps {
  data: CheckboxItem[];
  onChange: (newData: CheckboxItem[]) => void;
  // No internal state — fully controlled
}

// Uncontrolled: internal state with ref
interface UncontrolledTreeProps {
  defaultData: CheckboxItem[];
  ref?: React.Ref<TreeHandle>;
}

interface TreeHandle {
  getCheckedIds: () => number[];
  checkAll: () => void;
  uncheckAll: () => void;
}

// Key point: "Same pattern as <input> vs <input value={x} onChange={fn}/>.
// Controlled for form integration. Uncontrolled for standalone use."
```

**Variant 5: "Multi-select modes"**

```
Approach:
"3 selection modes:
1. Single select: radio behavior, only one node checked
2. Multi select: current behavior, any combination
3. Cascade select: check parent = check all children (current)
4. Independent: check parent ≠ affect children

Make it a prop: <CheckboxTree mode='cascade' | 'independent' | 'single' />"
```

**📊 Variant Difficulty:**

| Variant                 | Extra Time | Complexity | Frequency Asked    |
| ----------------------- | ---------- | ---------- | ------------------ |
| Search/Filter           | +10 min    | Medium     | ⭐⭐⭐ Very common |
| Drag & Drop             | +15 min    | High       | ⭐⭐ Common        |
| Lazy Load               | +10 min    | Medium     | ⭐⭐ Common        |
| Controlled/Uncontrolled | +5 min     | Low        | ⭐⭐⭐ Very common |
| Multi-select modes      | +10 min    | Medium     | ⭐ Less common     |
| Virtualization          | +15 min    | High       | ⭐⭐ Common        |
| Undo/Redo               | +10 min    | Medium     | ⭐ Less common     |

---

### 21. Cross-Framework Comparison Talking Points

> 🔀 Show breadth of knowledge — không chỉ React.

**"Bạn implement bài này trong Vue/Angular/Svelte thế nào?"**

```
React approach:
- useState + structuredClone + recursive component
- Manual re-render optimization (memo, useCallback)
- Indeterminate via useRef + useEffect (imperative)

Vue approach:
- reactive() + deep watcher
- Automatic dependency tracking — no manual memo
- v-model for two-way binding on checkbox
- ref.value.indeterminate = true (similar to React)
- computed() for derived states (auto-memoized)

"Vue's reactivity system tracks property access automatically.
When I do node.checked = true, Vue knows to re-render
only components that read node.checked.
In React, I need structuredClone for immutability
and memo for skip re-renders."

Angular approach:
- Component with @Input/@Output
- OnPush change detection strategy
- Template-driven or reactive forms
- [indeterminate] binding works natively!

"Angular has native [indeterminate] attribute binding.
No useRef needed. Change detection with OnPush
is similar to React.memo."

Svelte approach:
- Reactive declarations ($:)
- No virtual DOM — compile-time reactivity
- bind:checked, bind:indeterminate

"Svelte compiles reactivity at build time.
$: derived statements auto-update.
bind:indeterminate works natively — simplest approach."
```

**📊 Framework Comparison for Nested Checkboxes:**

| Feature             | React               | Vue 3             | Angular          | Svelte             |
| ------------------- | ------------------- | ----------------- | ---------------- | ------------------ |
| State management    | useState/useReducer | reactive/ref      | Service/NgRx     | Store/$:           |
| Immutability        | Required (clone)    | Optional (proxy)  | Optional         | Auto               |
| Re-render control   | memo + useCallback  | Auto (proxy)      | OnPush           | Compile-time       |
| Indeterminate       | useRef + useEffect  | ref + watch       | [indeterminate]  | bind:indeterminate |
| Recursive component | Self-reference      | `<component :is>` | ng-template      | svelte:self        |
| TypeScript          | Good                | Good              | Excellent        | Good               |
| Bundle size impact  | ~45KB (React)       | ~33KB (Vue)       | ~130KB (Angular) | ~5KB (Svelte)      |

---

### 22. Performance Interview Deep-Dive

> ⚡ Khi interviewer drill down vào performance — cách trả lời chi tiết.

**Q: "Component này re-render mỗi khi click. Optimize thế nào?"**

```tsx
// Level 1: Identify the problem
"Mỗi click → setData → ENTIRE tree re-renders.
With 1000 nodes, that's 1000 component renders per click."

// Level 2: Measure first
"Before optimizing, I'd measure:
- React DevTools Profiler → which components re-render?
- Performance.now() → how long does handleCheck take?
- If re-render < 16ms, NO optimization needed."

// Level 3: Apply targeted fixes
"Fix 1: React.memo on CheckboxItem
→ Only re-renders if its props change
→ Need stable callback references (useCallback)"

"Fix 2: useCallback for handleCheck
→ Without: new function reference each render → memo useless
→ With: stable reference → memo works"

"Fix 3: Structural sharing instead of structuredClone
→ Clone only changes path: O(d) instead of O(n)
→ Unchanged subtrees keep same reference → memo skips them"

// Level 4: Quantify improvement
"Before: 1000 nodes × 0.1ms/render = 100ms per click
After memo + structural sharing:
- Changed path: ~5 nodes × 0.1ms = 0.5ms
- Memo checks: ~995 nodes × 0.01ms = ~10ms
- Total: ~10ms — 10x improvement"
```

**Q: "Có 100,000 nodes. Approach?"**

```
"100K nodes cần fundamentally different architecture:

1. Virtualization: Only render visible (~50 nodes)
   → react-window or @tanstack/virtual
   → Flatten tree to array, render window

2. Normalized store: Map<id, node> instead of nested tree
   → O(1) lookup, O(1) update
   → No cloning needed

3. Web Worker for computation:
   → Move updateDescendants/resolveAncestors to worker
   → Main thread stays responsive
   → postMessage overhead: ~1ms for 100K node IDs

4. Pagination/lazy loading:
   → Load only expanded nodes
   → Server computes parent states
   → Client shows what server sends

5. Debounced batch updates:
   → Queue rapid clicks → batch into single update
   → useTransition for non-urgent renders

Architecture shift:
Small tree: Client-side state + recursive render
Large tree: Server-computed state + virtualized flat render"
```

**Q: "Memory footprint?"**

```
"Memory analysis for 100K nodes:

Each CheckboxItem ≈ 200 bytes (id + name + checked + children ref)
100K nodes × 200B = ~20MB base

With structuredClone per click:
→ 20MB × 2 = 40MB momentarily (old + new)
→ GC reclaims old → back to 20MB
→ Frequent clicks: GC pressure 🔴

With Immer/structural sharing:
→ 20MB base + ~5KB per click (only changed path)
→ Minimal GC pressure ✅

With normalized store (Map):
→ Map overhead: ~100 bytes per entry
→ 100K × 300B = 30MB
→ But updates are O(1), no cloning needed ✅

Recommendation:
< 1K nodes:  structuredClone (simple)
1K-10K:      Immer (structural sharing)
> 10K:       Normalized Map + virtualization"
```

---

### 23. API Design Cho Reusable Tree Component

> 📦 Interview question: "Design this as a library component."

**Progressive API Design:**

```tsx
// Level 1: Simple (80% use cases)
<CheckboxTree
  data={items}
  onChange={(checkedIds) => console.log(checkedIds)}
/>

// Level 2: Controlled (form integration)
<CheckboxTree
  data={items}
  checkedIds={selectedIds}
  onCheck={(id, checked) => setSelectedIds(prev => ...)}
/>

// Level 3: Full customization
<CheckboxTree
  data={items}
  onChange={handleChange}
  renderItem={({ item, checked, indeterminate, depth, toggle }) => (
    <div style={{ paddingLeft: depth * 20 }}>
      <CustomCheckbox
        checked={checked}
        indeterminate={indeterminate}
        onChange={toggle}
      />
      <MyIcon type={item.type} />
      <span>{item.name}</span>
    </div>
  )}
  expandable
  searchable
  virtualized
  className="my-tree"
/>

// Level 4: Headless (logic only)
const tree = useCheckboxTree({
  data: items,
  defaultCheckedIds: [1, 3, 5],
  onChange: handleChange,
});

// tree.checkedIds: Set<number>
// tree.indeterminateIds: Set<number>
// tree.check(id): void
// tree.uncheck(id): void
// tree.toggleAll(): void
// tree.expandedIds: Set<number>
// tree.expand(id): void
// tree.collapse(id): void
// tree.search(query): void
// tree.filteredData: CheckboxItem[]

return (
  <ul>
    {tree.filteredData.map(item => (
      <li key={item.id}>
        <input
          type="checkbox"
          checked={tree.checkedIds.has(item.id)}
          ref={el => { if (el) el.indeterminate = tree.indeterminateIds.has(item.id); }}
          onChange={() => tree.check(item.id)}
        />
        {item.name}
      </li>
    ))}
  </ul>
);
```

**API Design Principles to discuss:**

| Principle                      | Application                               | Example                                  |
| ------------------------------ | ----------------------------------------- | ---------------------------------------- |
| **Progressive disclosure**     | Simple API by default, advanced via props | `onChange` vs `onCheck + renderItem`     |
| **Controlled/Uncontrolled**    | Consumer decides who owns state           | `checkedIds` prop vs `defaultCheckedIds` |
| **Render props / Composition** | Custom rendering without forking          | `renderItem` callback                    |
| **Headless pattern**           | Logic without UI                          | `useCheckboxTree` hook                   |
| **Sensible defaults**          | Works with zero config                    | `<CheckboxTree data={items} />`          |
| **Escape hatches**             | Access internals when needed              | `ref.current.getState()`                 |

---

### 24. Senior-Level Storytelling Frameworks

> 📖 Kết nối technical decisions với business impact — đây là signal L6+.

**STAR Method for Technical Decisions:**

```
S (Situation): "Team cần permission management UI
   cho admin dashboard. 200+ permissions nested 4 levels."

T (Task): "Tôi own component architecture.
   Requirements: fast renders, accessible,
   works with existing form library."

A (Action): "Tôi:
   1. Evaluated 3 approaches (flat list, nested tree, hybrid)
   2. Chose nested tree vì users think in hierarchy
   3. Used useReducer for state (predictable, testable)
   4. Added React.memo + structural sharing for perf
   5. Full ARIA tree pattern for accessibility
   6. Wrote comprehensive test suite (45 tests)"

R (Result): "Component shipped in 2 weeks.
   - 0 bugs in first 3 months
   - Reused by 3 other teams
   - Admin task completion time dropped 40%
   - Became part of shared component library"
```

**Impact Quantification Framework:**

```
"When discussing this component, I'd frame impact as:

Developer Impact:
- Reduced implementation time from 2 weeks to 2 hours (reusable)
- 45 tests → zero regression bugs in 6 months
- TypeScript strict mode → caught 12 type errors before runtime

User Impact:
- Permission selection: 3 minutes → 45 seconds (hierarchy view)
- Error rate: 15% → 2% (visual indeterminate feedback)
- Accessibility audit: 0 → full WCAG AA compliance

Business Impact:
- Admin onboarding time reduced by 30%
- Support tickets for permission issues: -60%
- Compliance requirement met (accessibility)"
```

**Connecting to Company Values:**

| Company Value        | How Nested Checkboxes Demonstrates It               |
| -------------------- | --------------------------------------------------- |
| Customer obsession   | Accessible UI, keyboard nav, clear visual feedback  |
| Bias for action      | Start simple, ship, iterate with real data          |
| Ownership            | Full solution: tests, a11y, perf, docs, monitoring  |
| Learn and be curious | Explored Immer, structural sharing, CRDT concepts   |
| Deliver results      | Measurable improvement in user task completion      |
| Think big            | Designed as reusable library, not one-off component |

**Technical Leadership Stories:**

```
Story 1: "Making the Hard Simple"
"Junior engineer proposed a complex state management solution
using Redux + normalized store for 50-item tree.
I suggested starting with useState + structuredClone.
Shipped in 1 day instead of 1 week.
Lesson: Right-size your tools."

Story 2: "Performance Crisis"
"Tree component with 5000 nodes froze on click.
I profiled: 5000 React.memo checks × 0.1ms = 500ms.
Root cause: new callback reference each render broke memo.
Fix: useCallback + structural sharing.
Result: 500ms → 5ms. 100x improvement."

Story 3: "Accessibility Audit"
"External audit flagged our tree as non-compliant.
I added ARIA tree pattern, keyboard navigation,
and screen reader announcements in 3 days.
Result: Full WCAG AA compliance.
Bonus: Found and fixed tab order bugs across other components."
```

---

## PHẦN E: TEST CASES

> 🧪 Các test cases để verify implementation.

### Basic Rendering

```typescript
// Initial state: all unchecked
test('renders all checkboxes as unchecked initially', () => {
  render(<Checkboxes defaultCheckboxData={testData} />);

  const checkboxes = screen.getAllByRole('checkbox');
  checkboxes.forEach(checkbox => {
    expect(checkbox).not.toBeChecked();
  });
});
```

### Leaf Node Behavior

```typescript
test('clicking leaf node checks it', () => {
  render(<Checkboxes defaultCheckboxData={testData} />);

  const iphone = screen.getByLabelText('iPhone');
  fireEvent.click(iphone);

  expect(iphone).toBeChecked();
});
```

### Ancestor Updates

```typescript
test('checking all children marks parent as checked', () => {
  render(<Checkboxes defaultCheckboxData={testData} />);

  fireEvent.click(screen.getByLabelText('iPhone'));
  fireEvent.click(screen.getByLabelText('Android'));

  const mobilePhones = screen.getByLabelText('Mobile phones');
  expect(mobilePhones).toBeChecked();
});

test('checking some children marks parent as indeterminate', () => {
  render(<Checkboxes defaultCheckboxData={testData} />);

  fireEvent.click(screen.getByLabelText('iPhone'));
  // Android still unchecked

  const mobilePhones = screen.getByLabelText('Mobile phones');
  expect(mobilePhones).toHaveProperty('indeterminate', true);
});
```

### Descendant Updates

```typescript
test('checking parent checks all descendants', () => {
  render(<Checkboxes defaultCheckboxData={testData} />);

  fireEvent.click(screen.getByLabelText('Electronics'));

  expect(screen.getByLabelText('Mobile phones')).toBeChecked();
  expect(screen.getByLabelText('iPhone')).toBeChecked();
  expect(screen.getByLabelText('Android')).toBeChecked();
  expect(screen.getByLabelText('Laptops')).toBeChecked();
  expect(screen.getByLabelText('MacBook')).toBeChecked();
  expect(screen.getByLabelText('Surface Pro')).toBeChecked();
});
```

---

## PHẦN F: ADVANCED PATTERNS & OPTIMIZATIONS

> 🚀 **Patterns nâng cao cho production và interview follow-up questions.**

### 1. Performance Optimization với React.memo

**💬 Cách trình bày:**

> "Memo prevent unnecessary re-renders cho unchanged nodes. Phải combine với useCallback cho callbacks, nếu không memo bị phá vỡ."

```tsx
const CheckboxInput = memo(
  function CheckboxInput({ checked, label, onChange }: Props) {
    const ref = useRef<HTMLInputElement>(null);

    useEffect(() => {
      if (ref.current) {
        ref.current.indeterminate = checked === "indeterminate";
      }
    }, [checked]);

    return (
      <label className="checkbox-label">
        <input
          ref={ref}
          type="checkbox"
          checked={checked === true}
          onChange={(e) => onChange(e.target.checked)}
        />
        {label}
      </label>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison - chỉ re-render nếu checked hoặc label thay đổi
    return (
      prevProps.checked === nextProps.checked &&
      prevProps.label === nextProps.label
    );
    // Ignore onChange — assumed stable via useCallback
  },
);
```

**🤔 Follow-up questions:**

| Câu hỏi                                 | Trả lời                                                                                        |
| --------------------------------------- | ---------------------------------------------------------------------------------------------- |
| "memo + useCallback vẫn chưa đủ nhanh?" | "Dùng virtualization (section 2). Hoặc structural sharing thay vì full clone."                 |
| "React DevTools profiler?"              | "Flamegraph cho thấy component nào re-render, bao lâu. Highlight updates = visual."            |
| "React 19 Compiler?"                    | "Auto-memoization. Không cần memo/useMemo/useCallback. Nhưng vẫn cần understand để interview." |

---

### 2. Virtualization cho Large Trees

**💬 Cách trình bày:**

> "Với 1000+ nodes, DOM rendering là bottleneck. Virtualization chỉ render ~20-50 visible items, recycle khi scroll."

```tsx
import { useVirtualizer } from "@tanstack/react-virtual";

interface FlatNode {
  item: CheckboxItem;
  depth: number;
  path: number[];
}

function VirtualizedCheckboxTree({ items, onCheck }: Props) {
  const parentRef = useRef<HTMLDivElement>(null);

  // Step 1: Flatten tree into array (respecting expand/collapse)
  const flatNodes = useMemo(() => {
    const result: FlatNode[] = [];
    const flatten = (nodes: CheckboxItem[], depth: number, path: number[]) => {
      nodes.forEach((node, i) => {
        const currentPath = [...path, i];
        result.push({ item: node, depth, path: currentPath });
        if (node.children) {
          flatten(node.children, depth + 1, currentPath);
        }
      });
    };
    flatten(items, 0, []);
    return result;
  }, [items]);

  // Step 2: Setup virtualizer
  const virtualizer = useVirtualizer({
    count: flatNodes.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 32,
    overscan: 10, // Buffer items above/below viewport
  });

  // Step 3: Render only visible items
  return (
    <div
      ref={parentRef}
      style={{ height: "500px", overflow: "auto" }}
      role="tree"
      aria-label="Checkbox tree"
    >
      <div
        style={{
          height: virtualizer.getTotalSize(),
          position: "relative",
          width: "100%",
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const { item, depth, path } = flatNodes[virtualRow.index];
          return (
            <div
              key={item.id}
              role="treeitem"
              aria-level={depth + 1}
              aria-setsize={flatNodes.length}
              aria-posinset={virtualRow.index + 1}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
                paddingLeft: `${depth * 24}px`,
              }}
            >
              <CheckboxInput
                checked={item.checked}
                label={item.name}
                onChange={(checked) => onCheck(checked, path)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

**🤔 Follow-up questions:**

| Câu hỏi                      | Trả lời                                                                  |
| ---------------------------- | ------------------------------------------------------------------------ |
| "Variable height items?"     | "Dùng `measureElement` callback. Virtualizer auto-measures sau render."  |
| "Horizontal virtualization?" | "`@tanstack/react-virtual` hỗ trợ cả horizontal. Hiếm khi cần cho tree." |
| "Server-side rendering?"     | "Render first N items on server. Hydrate + virtualize on client."        |

---

### 3. Controlled Component Pattern

**💬 Cách trình bày:**

> "Lift state lên parent để Checkboxes trở thành controlled. Parent owns data, Checkboxes chỉ render + compute."

```tsx
// Parent controls state
function App() {
  const [data, setData] = useState(initialData);

  // Can add middleware: validation, logging, etc.
  const handleChange = (newData: CheckboxItem[]) => {
    console.log("Selection changed:", getCheckedItems(newData));
    setData(newData);
  };

  return (
    <>
      <Checkboxes checkboxData={data} onCheckboxChange={handleChange} />
      <SelectedItems data={data} />
      <ExportButton data={data} />
    </>
  );
}

// Checkboxes becomes stateless — pure computation
function Checkboxes({ checkboxData, onCheckboxChange }: ControlledProps) {
  const handleCheck = useCallback(
    (checked: boolean, indices: number[]) => {
      const newData = structuredClone(checkboxData);
      const node = getNodeByPath(newData, indices);
      updateCheckboxAndDescendants(node, checked);
      resolveCheckboxStates(newData[indices[0]], indices.slice(1));
      onCheckboxChange(newData);
    },
    [checkboxData, onCheckboxChange],
  );

  return <CheckboxList items={checkboxData} onCheck={handleCheck} />;
}
```

**🤔 Follow-up questions:**

| Câu hỏi                               | Trả lời                                                                                                   |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| "Khi nào controlled vs uncontrolled?" | "Controlled khi parent cần biết state (phần lớn cases). Uncontrolled khi component hoàn toàn standalone." |
| "Performance impact?"                 | "Controlled re-renders parent mỗi change. Mitigate bằng React.memo cho siblings."                         |
| "Hybrid pattern?"                     | "useControllableState hook: dùng internal state nếu không có props, external nếu có."                     |

---

### 4. Immer cho Immutable Updates

**💬 Cách trình bày:**

> "Immer cho phép viết mutable code nhưng produce immutable result. Perfect cho complex nested updates — code đơn giản, result đúng."

```tsx
import { produce } from "immer";

function useCheckboxTreeWithImmer(initialData: CheckboxItem[]) {
  const [data, setData] = useState(initialData);

  const handleCheck = useCallback((checked: boolean, indices: number[]) => {
    setData(
      produce((draft) => {
        // Navigate to target node — can mutate directly!
        let node = draft[indices[0]];
        for (let i = 1; i < indices.length; i++) {
          node = node.children![indices[i]];
        }

        // DOWN: Set target + descendants
        const setAll = (n: CheckboxItem, value: boolean) => {
          n.checked = value; // Direct mutation — Immer handles immutability
          n.children?.forEach((child) => setAll(child, value));
        };
        setAll(node, checked);

        // UP: Resolve ancestors
        const resolve = (n: CheckboxItem, path: number[]) => {
          if (path.length > 0 && n.children) {
            resolve(n.children[path[0]], path.slice(1));
          }
          if (n.children) {
            const allChecked = n.children.every((c) => c.checked === true);
            const allUnchecked = n.children.every((c) => c.checked === false);
            n.checked = allChecked
              ? true
              : allUnchecked
                ? false
                : "indeterminate";
          }
        };
        resolve(draft[indices[0]], indices.slice(1));
      }),
    );
  }, []);

  return { data, handleCheck };
}
```

**📊 Immer vs Manual Clone:**

| Aspect          | Manual Clone                          | Immer                               |
| --------------- | ------------------------------------- | ----------------------------------- |
| **Code style**  | Imperative (clone + navigate + set)   | Direct mutation syntax              |
| **Readability** | Medium — need to remember clone first | High — reads like simple mutation   |
| **Performance** | O(n) for full clone                   | O(changed path) structural sharing  |
| **Bundle size** | 0 KB                                  | ~6 KB (gzipped)                     |
| **TypeScript**  | Manual type assertions                | Full type inference                 |
| **Debugging**   | Hard — must verify clone correctness  | Easy — Immer guarantees correctness |

**🤔 Follow-up questions:**

| Câu hỏi                 | Trả lời                                                                                      |
| ----------------------- | -------------------------------------------------------------------------------------------- |
| "Immer overhead?"       | "~2-5% slower than manual. But code correctness > micro-optimization."                       |
| "Immer với useReducer?" | "Perfect combo! Reducer + Immer = clean state transitions."                                  |
| "Structural sharing?"   | "Immer only creates new refs for changed paths. Unchanged subtrees share refs → memo works!" |
| "Immer limitations?"    | "No Map/Set support by default (need enableMapSet()). No ES5 (uses Proxy)."                  |

---

### 5. useReducer Pattern cho Complex State

**💬 Cách trình bày:**

> "Khi state logic phức tạp (check, uncheck, checkAll, uncheckAll, expand, search), useReducer tách logic ra khỏi component. Predictable, testable."

```tsx
// Action types
type CheckboxAction =
  | { type: "CHECK"; indices: number[]; checked: boolean }
  | { type: "CHECK_ALL" }
  | { type: "UNCHECK_ALL" }
  | { type: "TOGGLE_EXPAND"; indices: number[] }
  | { type: "SET_SEARCH"; query: string }
  | { type: "RESET" };

interface CheckboxState {
  data: CheckboxItem[];
  expandedIds: Set<number>;
  searchQuery: string;
  history: CheckboxItem[][]; // For undo
}

// Reducer — pure function, easy to test
function checkboxReducer(
  state: CheckboxState,
  action: CheckboxAction,
): CheckboxState {
  switch (action.type) {
    case "CHECK": {
      const newData = structuredClone(state.data);
      const node = getNodeByPath(newData, action.indices);
      updateCheckboxAndDescendants(node, action.checked);
      resolveCheckboxStates(
        newData[action.indices[0]],
        action.indices.slice(1),
      );
      return {
        ...state,
        data: newData,
        history: [...state.history, state.data], // Save for undo
      };
    }

    case "CHECK_ALL": {
      const newData = structuredClone(state.data);
      const setAll = (items: CheckboxItem[]) => {
        items.forEach((item) => {
          item.checked = true;
          if (item.children) setAll(item.children);
        });
      };
      setAll(newData);
      return {
        ...state,
        data: newData,
        history: [...state.history, state.data],
      };
    }

    case "UNCHECK_ALL": {
      const newData = structuredClone(state.data);
      const setAll = (items: CheckboxItem[]) => {
        items.forEach((item) => {
          item.checked = false;
          if (item.children) setAll(item.children);
        });
      };
      setAll(newData);
      return {
        ...state,
        data: newData,
        history: [...state.history, state.data],
      };
    }

    case "TOGGLE_EXPAND": {
      const newExpanded = new Set(state.expandedIds);
      const nodeId = getNodeByPath(state.data, action.indices).id;
      if (newExpanded.has(nodeId)) {
        newExpanded.delete(nodeId);
      } else {
        newExpanded.add(nodeId);
      }
      return { ...state, expandedIds: newExpanded };
    }

    case "SET_SEARCH":
      return { ...state, searchQuery: action.query };

    case "RESET":
      return { ...state, data: structuredClone(state.data), history: [] };

    default:
      return state;
  }
}

// Usage in component
function Checkboxes({ initialData }: Props) {
  const [state, dispatch] = useReducer(checkboxReducer, {
    data: initialData,
    expandedIds: new Set(),
    searchQuery: "",
    history: [],
  });

  return (
    <div>
      <Toolbar
        onCheckAll={() => dispatch({ type: "CHECK_ALL" })}
        onUncheckAll={() => dispatch({ type: "UNCHECK_ALL" })}
        onSearch={(q) => dispatch({ type: "SET_SEARCH", query: q })}
      />
      <CheckboxList
        items={state.data}
        onCheck={(checked, indices) =>
          dispatch({ type: "CHECK", indices, checked })
        }
      />
    </div>
  );
}
```

**🤔 Follow-up questions:**

| Câu hỏi                   | Trả lời                                                                                           |
| ------------------------- | ------------------------------------------------------------------------------------------------- |
| "useState vs useReducer?" | "useState cho simple. useReducer cho >3 related state values hoặc complex transitions."           |
| "useReducer + Context?"   | "Dispatch qua Context thay vì prop drilling. useReducer ít cause re-renders hơn."                 |
| "Testing reducer?"        | "Pure function! `expect(reducer(state, action)).toEqual(expected)`. No React needed."             |
| "Middleware/logging?"     | "Wrap dispatch: `const loggedDispatch = (action) => { console.log(action); dispatch(action); }`." |

---

### 6. Search & Filter Pattern

**💬 Cách trình bày:**

> "User cần tìm node trong large tree. Filter vẫn giữ tree structure — parent visible nếu bất kỳ child match."

```tsx
function useSearchableTree(data: CheckboxItem[]) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter tree: keep node if it matches OR any descendant matches
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;

    const filterTree = (items: CheckboxItem[]): CheckboxItem[] => {
      return items
        .map((item) => {
          const nameMatch = item.name
            .toLowerCase()
            .includes(searchQuery.toLowerCase());
          const filteredChildren = item.children
            ? filterTree(item.children)
            : [];

          // Keep if: name matches OR any child survived filtering
          if (nameMatch || filteredChildren.length > 0) {
            return {
              ...item,
              children:
                filteredChildren.length > 0 ? filteredChildren : item.children,
              // Show all children if parent matches, else only matching
              ...(nameMatch ? {} : { children: filteredChildren }),
            };
          }
          return null;
        })
        .filter(Boolean) as CheckboxItem[];
    };

    return filterTree(data);
  }, [data, searchQuery]);

  return { filteredData, searchQuery, setSearchQuery };
}

// Usage
function SearchableCheckboxTree() {
  const [data, setData] = useState(initialData);
  const { filteredData, searchQuery, setSearchQuery } = useSearchableTree(data);

  return (
    <div>
      <input
        type="search"
        placeholder="Search items..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        aria-label="Search checkbox tree"
      />
      {searchQuery && (
        <p className="search-info">
          Showing {countNodes(filteredData)} of {countNodes(data)} items
        </p>
      )}
      <CheckboxList items={filteredData} onCheck={handleCheck} />
    </div>
  );
}
```

**🤔 Follow-up questions:**

| Câu hỏi                       | Trả lời                                                                                            |
| ----------------------------- | -------------------------------------------------------------------------------------------------- |
| "Debounce search?"            | "Có! `useDeferredValue` (React 18) hoặc lodash debounce (300ms). Avoid filtering every keystroke." |
| "Highlight matches?"          | "Split label thành parts, wrap match trong `<mark>`. Cần careful với HTML injection."              |
| "Search + check interaction?" | "Check trên filtered view vẫn update full data. Filter chỉ affect visibility, không affect state." |
| "Fuzzy search?"               | "Libraries: fuse.js, flexsearch. Nhưng for interview, includes() đủ."                              |

---

### 7. Undo/Redo Pattern

**💬 Cách trình bày:**

> "Maintain history stack cho undo. Redo = forward stack. Mỗi state change push to history. Memory-efficient với structural sharing."

```tsx
function useUndoRedo<T>(initialState: T) {
  const [state, setState] = useState({
    past: [] as T[],
    present: initialState,
    future: [] as T[],
  });

  const canUndo = state.past.length > 0;
  const canRedo = state.future.length > 0;

  const set = useCallback((newPresent: T) => {
    setState((prev) => ({
      past: [...prev.past, prev.present],
      present: newPresent,
      future: [], // Clear redo stack on new action
    }));
  }, []);

  const undo = useCallback(() => {
    setState((prev) => {
      if (prev.past.length === 0) return prev;
      const newPast = [...prev.past];
      const newPresent = newPast.pop()!;
      return {
        past: newPast,
        present: newPresent,
        future: [prev.present, ...prev.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setState((prev) => {
      if (prev.future.length === 0) return prev;
      const newFuture = [...prev.future];
      const newPresent = newFuture.shift()!;
      return {
        past: [...prev.past, prev.present],
        present: newPresent,
        future: newFuture,
      };
    });
  }, []);

  const reset = useCallback((newPresent: T) => {
    setState({ past: [], present: newPresent, future: [] });
  }, []);

  return {
    state: state.present,
    set,
    undo,
    redo,
    canUndo,
    canRedo,
    reset,
    historyLength: state.past.length,
  };
}

// Usage with Checkbox Tree
function CheckboxesWithUndo() {
  const {
    state: data,
    set: setData,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useUndoRedo(initialData);

  const handleCheck = useCallback(
    (checked: boolean, indices: number[]) => {
      const newData = structuredClone(data);
      const node = getNodeByPath(newData, indices);
      updateCheckboxAndDescendants(node, checked);
      resolveCheckboxStates(newData[indices[0]], indices.slice(1));
      setData(newData); // Automatically saves to history
    },
    [data, setData],
  );

  return (
    <div>
      <div className="toolbar">
        <button onClick={undo} disabled={!canUndo}>
          ↩ Undo
        </button>
        <button onClick={redo} disabled={!canRedo}>
          ↪ Redo
        </button>
      </div>
      <CheckboxList items={data} onCheck={handleCheck} />
    </div>
  );
}
```

**🤔 Follow-up questions:**

| Câu hỏi               | Trả lời                                                                                                    |
| --------------------- | ---------------------------------------------------------------------------------------------------------- |
| "Memory concern?"     | "Mỗi state trong history = full clone. Limit history size (e.g., max 50). Hoặc dùng Immer patches."        |
| "Immer patches?"      | "Immer `produceWithPatches` trả patches thay vì full state. Undo = apply inverse patches. Minimal memory." |
| "Keyboard shortcuts?" | "Ctrl+Z undo, Ctrl+Y redo. Dùng useEffect + addEventListener('keydown')."                                  |
| "Batch actions?"      | "Group multiple changes thành 1 undo step. `startBatch()` → changes → `endBatch()`."                       |

---

### 8. Lazy Loading cho Deep Trees

**💬 Cách trình bày:**

> "API trả root nodes. Children loaded on expand. Giảm initial payload, faster time-to-interactive."

```tsx
interface LazyCheckboxItem extends CheckboxItem {
  childrenLoaded: boolean;
  loading: boolean;
}

function useLazyTree(
  loadChildren: (nodeId: number) => Promise<CheckboxItem[]>,
) {
  const [data, setData] = useState<LazyCheckboxItem[]>([]);

  const expand = useCallback(
    async (indices: number[]) => {
      const newData = structuredClone(data);
      const node = getNodeByPath(newData, indices) as LazyCheckboxItem;

      if (node.childrenLoaded) return; // Already loaded

      // Set loading state
      node.loading = true;
      setData(structuredClone(newData));

      try {
        // Fetch children from API
        const children = await loadChildren(node.id);
        const freshData = structuredClone(data);
        const freshNode = getNodeByPath(freshData, indices) as LazyCheckboxItem;

        freshNode.children = children.map((child) => ({
          ...child,
          childrenLoaded: false,
          loading: false,
        }));
        freshNode.childrenLoaded = true;
        freshNode.loading = false;

        setData(freshData);
      } catch (error) {
        // Reset loading state on error
        const freshData = structuredClone(data);
        const freshNode = getNodeByPath(freshData, indices) as LazyCheckboxItem;
        freshNode.loading = false;
        setData(freshData);
      }
    },
    [data, loadChildren],
  );

  return { data, setData, expand };
}

// Lazy node component
function LazyCheckboxNode({ item, indices, onExpand, onCheck }: Props) {
  return (
    <li>
      <div className="checkbox-row">
        {item.children || !item.childrenLoaded ? (
          <button
            className="expand-btn"
            onClick={() => onExpand(indices)}
            disabled={item.loading}
          >
            {item.loading ? "⏳" : item.expanded ? "▼" : "▶"}
          </button>
        ) : null}
        <CheckboxInput
          checked={item.checked}
          label={item.name}
          onChange={(checked) => onCheck(checked, indices)}
        />
      </div>
      {item.loading && <div className="loading-indicator">Loading...</div>}
      {item.children && item.expanded && (
        <CheckboxList items={item.children} /* ... */ />
      )}
    </li>
  );
}
```

**🤔 Follow-up questions:**

| Câu hỏi                                   | Trả lời                                                                                       |
| ----------------------------------------- | --------------------------------------------------------------------------------------------- |
| "Check parent trước khi children loaded?" | "Option 1: disable check until loaded. Option 2: check parent, lazy-check children khi load." |
| "Caching loaded children?"                | "Store in Map<nodeId, children>. Re-use khi collapse/expand lại."                             |
| "Error retry?"                            | "Retry button hoặc auto-retry 3 lần với exponential backoff."                                 |

---

### 9. Normalized State (Flat Map Pattern)

**💬 Cách trình bày:**

> "Thay vì nested tree, store as flat map `{id → node}`. O(1) lookup, no deep clone needed. Trade-off: cần maintain parentId/childIds relationships."

```tsx
// Normalized state structure
interface NormalizedState {
  byId: Record<number, NormalizedNode>;
  rootIds: number[];
}

interface NormalizedNode {
  id: number;
  name: string;
  checked: CheckboxValue;
  parentId: number | null;
  childIds: number[];
}

// Convert tree → flat map
function normalizeTree(
  items: CheckboxItem[],
  parentId: number | null = null,
): NormalizedState {
  const byId: Record<number, NormalizedNode> = {};
  const rootIds: number[] = [];

  const traverse = (nodes: CheckboxItem[], parent: number | null) => {
    nodes.forEach((node) => {
      const childIds = node.children?.map((c) => c.id) ?? [];
      byId[node.id] = {
        id: node.id,
        name: node.name,
        checked: node.checked,
        parentId: parent,
        childIds,
      };
      if (parent === null) rootIds.push(node.id);
      if (node.children) traverse(node.children, node.id);
    });
  };

  traverse(items, parentId);
  return { byId, rootIds };
}

// Update — NO deep clone needed!
function checkNode(
  state: NormalizedState,
  nodeId: number,
  checked: boolean,
): NormalizedState {
  const newById = { ...state.byId };

  // DOWN: Update target + all descendants
  const updateDown = (id: number) => {
    newById[id] = { ...newById[id], checked };
    newById[id].childIds.forEach(updateDown);
  };
  updateDown(nodeId);

  // UP: Resolve ancestors
  const resolveUp = (id: number) => {
    const node = newById[id];
    if (node.parentId === null) return;

    const parent = newById[node.parentId];
    const siblings = parent.childIds.map((cid) => newById[cid]);
    const allChecked = siblings.every((s) => s.checked === true);
    const allUnchecked = siblings.every((s) => s.checked === false);

    newById[parent.id] = {
      ...parent,
      checked: allChecked ? true : allUnchecked ? false : "indeterminate",
    };
    resolveUp(parent.id);
  };
  resolveUp(nodeId);

  return { ...state, byId: newById };
}
```

**📊 Nested vs Normalized:**

| Aspect          | Nested Tree                   | Normalized (Flat Map)            |
| --------------- | ----------------------------- | -------------------------------- |
| **Lookup node** | O(n) search or O(k) path      | O(1) by ID                       |
| **Update node** | Deep clone O(n)               | Shallow copy O(1)                |
| **Add/Remove**  | Complex (find parent, splice) | Simple (update map + parent)     |
| **Render**      | Natural recursion             | Need `renderNode(id)` recursive  |
| **Memory**      | Duplicates on clone           | Shared refs (changed nodes only) |
| **Complexity**  | Low (for interview)           | Higher (normalize/denormalize)   |
| **Best for**    | Interview, small trees        | Production, large dynamic trees  |

**🤔 Follow-up questions:**

| Câu hỏi                           | Trả lời                                                                     |
| --------------------------------- | --------------------------------------------------------------------------- |
| "Redux Toolkit dùng pattern này?" | "Đúng! `createEntityAdapter` normalize entities. Same flat map concept."    |
| "Denormalize khi cần tree?"       | "`buildTree(state)` recursive: root → attach children. Cache result."       |
| "Khi nào dùng normalized?"        | "Frequent CRUD operations. Large datasets. Multiple views of same data."    |
| "Performance trade-off?"          | "Lookup faster (O(1)). Nhưng rendering cần build tree from map mỗi render." |

---

### 10. Drag & Drop Reordering

**💬 Cách trình bày:**

> "Cho phép user drag-and-drop nodes để reorder hoặc reparent. Cần track drag source, drop target, và position (before/after/inside)."

```tsx
import {
  DndContext,
  closestCenter,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";

interface DragData {
  sourceIndices: number[];
  sourceItem: CheckboxItem;
}

function DraggableCheckboxTree({ items, onReorder }: Props) {
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!active || !over || active.id === over.id) return;

      const sourceIndices = (active.data.current as DragData).sourceIndices;
      const targetIndices = (over.data.current as DragData).sourceIndices;

      // Remove from source
      const newData = structuredClone(items);
      const sourceParent =
        sourceIndices.length > 1
          ? getNodeByPath(newData, sourceIndices.slice(0, -1))
          : { children: newData };
      const [removed] = sourceParent.children!.splice(
        sourceIndices[sourceIndices.length - 1],
        1,
      );

      // Insert at target
      const targetParent =
        targetIndices.length > 1
          ? getNodeByPath(newData, targetIndices.slice(0, -1))
          : { children: newData };
      targetParent.children!.splice(
        targetIndices[targetIndices.length - 1],
        0,
        removed,
      );

      onReorder(newData);
    },
    [items, onReorder],
  );

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <CheckboxList items={items} />
    </DndContext>
  );
}
```

**🤔 Follow-up questions:**

| Câu hỏi                                 | Trả lời                                                                                            |
| --------------------------------------- | -------------------------------------------------------------------------------------------------- |
| "Drop positions (before/after/inside)?" | "Detect mouse position relative to target. Top 25% = before, bottom 25% = after, middle = inside." |
| "Keyboard DnD?"                         | "@dnd-kit supports keyboard. Arrow keys + Space to pick/drop. WCAG requirement."                   |
| "Reparenting?"                          | "Drop inside = add as child of target. Update checked states after reparent!"                      |

---

### 11. Context API Cho Prop Drilling

**💬 Cách trình bày:**

> "Deep nested tree = prop drilling qua nhiều levels. Context eliminates passing `onCheck` callback thông qua mỗi level."

```tsx
// 1. Create Context
interface CheckboxContextType {
  onCheck: (checked: boolean, indices: number[]) => void;
  onExpand: (indices: number[]) => void;
  expandedIds: Set<number>;
}

const CheckboxContext = createContext<CheckboxContextType | null>(null);

// 2. Custom hook for safety
function useCheckboxContext() {
  const ctx = useContext(CheckboxContext);
  if (!ctx)
    throw new Error("useCheckboxContext must be used within CheckboxProvider");
  return ctx;
}

// 3. Provider at root
function Checkboxes({ initialData }: Props) {
  const [data, setData] = useState(initialData);
  const [expandedIds, setExpandedIds] = useState(new Set<number>());

  const onCheck = useCallback((checked: boolean, indices: number[]) => {
    setData((prev) => {
      const newData = structuredClone(prev);
      const node = getNodeByPath(newData, indices);
      updateCheckboxAndDescendants(node, checked);
      resolveCheckboxStates(newData[indices[0]], indices.slice(1));
      return newData;
    });
  }, []);

  const onExpand = useCallback(
    (indices: number[]) => {
      setExpandedIds((prev) => {
        const newSet = new Set(prev);
        const nodeId = getNodeByPath(data, indices).id;
        newSet.has(nodeId) ? newSet.delete(nodeId) : newSet.add(nodeId);
        return newSet;
      });
    },
    [data],
  );

  const contextValue = useMemo(
    () => ({ onCheck, onExpand, expandedIds }),
    [onCheck, onExpand, expandedIds],
  );

  return (
    <CheckboxContext.Provider value={contextValue}>
      <CheckboxList items={data} parentIndices={[]} />
    </CheckboxContext.Provider>
  );
}

// 4. Consumer — no prop drilling!
function CheckboxItem({
  item,
  indices,
}: {
  item: CheckboxItem;
  indices: number[];
}) {
  const { onCheck, onExpand, expandedIds } = useCheckboxContext();
  const isExpanded = expandedIds.has(item.id);

  return (
    <li role="treeitem">
      {item.children && (
        <button onClick={() => onExpand(indices)}>
          {isExpanded ? "▼" : "▶"}
        </button>
      )}
      <CheckboxInput
        checked={item.checked}
        label={item.name}
        onChange={(checked) => onCheck(checked, indices)}
      />
      {item.children && isExpanded && (
        <CheckboxList items={item.children} parentIndices={indices} />
      )}
    </li>
  );
}
```

**📊 Props Drilling vs Context:**

| Aspect          | Props Drilling                     | Context API                       |
| --------------- | ---------------------------------- | --------------------------------- |
| **Setup**       | Zero boilerplate                   | Provider + Context + Hook         |
| **Explicit**    | Clear data flow                    | Hidden dependency                 |
| **Performance** | Only affected path                 | All consumers re-render on change |
| **Testing**     | Pass props directly                | Need Provider wrapper             |
| **Refactoring** | Tedious (add/remove at each level) | Change once at Provider           |
| **Best for**    | Shallow trees (2-3 levels)         | Deep trees (4+ levels)            |

**🤔 Follow-up questions:**

| Câu hỏi                       | Trả lời                                                                                                                              |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| "Context performance?"        | "Context change → ALL consumers re-render. Split contexts: data context vs dispatch context."                                        |
| "Split contexts?"             | "Separate `DataContext` (changes often) from `DispatchContext` (stable). Dispatch context consumers don't re-render on data change." |
| "Zustand/Jotai thay Context?" | "External stores: selector-based re-renders. Zustand = simple. Jotai = atomic. Better performance than Context."                     |
| "useContextSelector?"         | "Not built-in. Libraries: use-context-selector. Allows subscribing to specific slice of context."                                    |

---

### 12. Accessibility (WCAG) Patterns

**💬 Cách trình bày:**

> "Checkbox tree phải navigable bằng keyboard, readable bởi screen readers. WCAG 2.1 AA compliance = basic requirement cho production."

```tsx
function AccessibleCheckboxTree({ items, label }: Props) {
  return (
    <div role="tree" aria-label={label}>
      <AccessibleCheckboxList items={items} level={1} />
    </div>
  );
}

function AccessibleCheckboxList({ items, level, parentIndices = [] }: Props) {
  return (
    <ul role="group" aria-label={`Level ${level} items`}>
      {items.map((item, index) => (
        <AccessibleCheckboxItem
          key={item.id}
          item={item}
          level={level}
          indices={[...parentIndices, index]}
          setSize={items.length}
          posInSet={index + 1}
        />
      ))}
    </ul>
  );
}

function AccessibleCheckboxItem({
  item,
  level,
  indices,
  setSize,
  posInSet,
}: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const { onCheck, onExpand, expandedIds } = useCheckboxContext();
  const isExpanded = item.children ? expandedIds.has(item.id) : undefined;

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowRight":
        // Expand if collapsed, or move to first child
        if (item.children && !isExpanded) {
          onExpand(indices);
        }
        break;
      case "ArrowLeft":
        // Collapse if expanded, or move to parent
        if (item.children && isExpanded) {
          onExpand(indices);
        }
        break;
      case "ArrowDown":
        // Move to next visible item
        e.preventDefault();
        focusNextItem(ref.current);
        break;
      case "ArrowUp":
        // Move to previous visible item
        e.preventDefault();
        focusPrevItem(ref.current);
        break;
      case " ":
      case "Enter":
        e.preventDefault();
        onCheck(!item.checked, indices);
        break;
      case "Home":
        e.preventDefault();
        focusFirstItem();
        break;
      case "End":
        e.preventDefault();
        focusLastItem();
        break;
    }
  };

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = item.checked === "indeterminate";
    }
  }, [item.checked]);

  return (
    <li
      role="treeitem"
      aria-level={level}
      aria-setsize={setSize}
      aria-posinset={posInSet}
      aria-expanded={isExpanded}
      aria-checked={item.checked === "indeterminate" ? "mixed" : item.checked}
    >
      <label>
        <input
          ref={ref}
          type="checkbox"
          checked={item.checked === true}
          onChange={(e) => onCheck(e.target.checked, indices)}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          aria-label={item.name}
        />
        <span>{item.name}</span>
      </label>
      {item.children && isExpanded && (
        <AccessibleCheckboxList
          items={item.children}
          level={level + 1}
          parentIndices={indices}
        />
      )}
    </li>
  );
}

// Focus management helpers
function focusNextItem(current: HTMLElement | null) {
  if (!current) return;
  const tree = current.closest("[role='tree']");
  if (!tree) return;
  const items = Array.from(
    tree.querySelectorAll<HTMLInputElement>("input[type='checkbox']"),
  );
  const idx = items.indexOf(current as HTMLInputElement);
  if (idx < items.length - 1) items[idx + 1].focus();
}

function focusPrevItem(current: HTMLElement | null) {
  if (!current) return;
  const tree = current.closest("[role='tree']");
  if (!tree) return;
  const items = Array.from(
    tree.querySelectorAll<HTMLInputElement>("input[type='checkbox']"),
  );
  const idx = items.indexOf(current as HTMLInputElement);
  if (idx > 0) items[idx - 1].focus();
}
```

**📊 ARIA Roles & Properties:**

| ARIA Attribute    | Element        | Value                  | Purpose                               |
| ----------------- | -------------- | ---------------------- | ------------------------------------- |
| `role="tree"`     | Root container | —                      | Identifies tree widget                |
| `role="group"`    | `<ul>`         | —                      | Groups children                       |
| `role="treeitem"` | `<li>`         | —                      | Identifies tree node                  |
| `aria-level`      | `<li>`         | `1, 2, 3...`           | Depth in tree                         |
| `aria-setsize`    | `<li>`         | Number                 | Total siblings at this level          |
| `aria-posinset`   | `<li>`         | Number                 | Position among siblings               |
| `aria-expanded`   | `<li>`         | `true/false/undefined` | Expand state (only if has children)   |
| `aria-checked`    | `<li>`         | `true/false/mixed`     | Check state ("mixed" = indeterminate) |

**⌨️ Keyboard Interactions (WAI-ARIA TreeView):**

| Key               | Action                                      |
| ----------------- | ------------------------------------------- |
| `Space` / `Enter` | Toggle checkbox                             |
| `↓`               | Next visible item                           |
| `↑`               | Previous visible item                       |
| `→`               | Expand (if collapsed), or focus first child |
| `←`               | Collapse (if expanded), or focus parent     |
| `Home`            | First item in tree                          |
| `End`             | Last visible item in tree                   |
| `*`               | Expand all siblings at current level        |

**🤔 Follow-up questions:**

| Câu hỏi                  | Trả lời                                                                           |
| ------------------------ | --------------------------------------------------------------------------------- |
| "Screen reader testing?" | "NVDA (Windows), VoiceOver (Mac), JAWS. Automated: axe-core, jest-axe."           |
| "aria-checked='mixed'?"  | "Indeterminate = ARIA 'mixed'. Screen reader announces 'partially checked'."      |
| "Focus management?"      | "roving tabindex pattern: only 1 item in tab order. Arrow keys move within tree." |
| "Color contrast?"        | "WCAG AA: 4.5:1 text, 3:1 UI components. Check with browser DevTools."            |

---

### 13. Persistence (localStorage / API Sync)

**💬 Cách trình bày:**

> "User selections survive page refresh. Persist to localStorage cho offline, sync to API cho cross-device."

```tsx
// Custom hook: Persist to localStorage
function usePersistedCheckboxTree(key: string, initialData: CheckboxItem[]) {
  // Initialize from localStorage or fallback to initialData
  const [data, setData] = useState<CheckboxItem[]>(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Validate structure matches expected shape
        if (
          Array.isArray(parsed) &&
          parsed.length > 0 &&
          "checked" in parsed[0]
        ) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Failed to load persisted checkbox state:", e);
    }
    return initialData;
  });

  // Debounced save to localStorage
  useEffect(() => {
    const timeout = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(data));
      } catch (e) {
        // Handle quota exceeded
        if (e instanceof DOMException && e.name === "QuotaExceededError") {
          console.warn("localStorage quota exceeded, clearing old data");
          localStorage.removeItem(key);
        }
      }
    }, 300); // Debounce 300ms

    return () => clearTimeout(timeout);
  }, [data, key]);

  const reset = useCallback(() => {
    setData(initialData);
    localStorage.removeItem(key);
  }, [initialData, key]);

  return { data, setData, reset };
}

// Custom hook: Sync to API
function useApiSyncedCheckboxTree(
  apiEndpoint: string,
  initialData: CheckboxItem[],
) {
  const { data, setData, reset } = usePersistedCheckboxTree(
    "checkbox-draft",
    initialData,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Auto-save to API (debounced)
  const saveToApi = useMemo(
    () =>
      debounce(async (newData: CheckboxItem[]) => {
        setIsSaving(true);
        try {
          await fetch(apiEndpoint, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ selections: getCheckedIds(newData) }),
          });
          setLastSaved(new Date());
        } catch (error) {
          console.error("Failed to save:", error);
          // Data is still in localStorage as backup
        } finally {
          setIsSaving(false);
        }
      }, 1000),
    [apiEndpoint],
  );

  const handleSetData = useCallback(
    (newData: CheckboxItem[]) => {
      setData(newData);
      saveToApi(newData);
    },
    [setData, saveToApi],
  );

  return { data, setData: handleSetData, reset, isSaving, lastSaved };
}

// Usage
function PersistentCheckboxTree() {
  const { data, setData, reset, isSaving, lastSaved } =
    useApiSyncedCheckboxTree("/api/selections", initialData);

  return (
    <div>
      <div className="toolbar">
        <button onClick={reset}>Reset All</button>
        {isSaving && <span className="saving">💾 Saving...</span>}
        {lastSaved && (
          <span className="saved">
            ✅ Saved {lastSaved.toLocaleTimeString()}
          </span>
        )}
      </div>
      <CheckboxList items={data} onCheck={handleCheck} />
    </div>
  );
}
```

**🤔 Follow-up questions:**

| Câu hỏi                        | Trả lời                                                                                        |
| ------------------------------ | ---------------------------------------------------------------------------------------------- |
| "localStorage size limit?"     | "~5MB per origin. Checkbox tree < 100KB usually. Monitor with `navigator.storage.estimate()`." |
| "Optimistic updates?"          | "Update UI immediately, sync to API in background. Rollback on API error."                     |
| "Conflict resolution?"         | "Last-write-wins simple. For collaboration: CRDTs or operational transforms."                  |
| "IndexedDB thay localStorage?" | "IndexedDB cho large data (>5MB). Async, structured. Libraries: Dexie.js, idb."                |
| "Partial save?"                | "Chỉ save checked IDs thay vì full tree. Reconstruct từ API data + saved IDs."                 |

---

### 14. Testing Strategies

**💬 Cách trình bày:**

> "Test pyramid: Unit tests cho logic (fast), Integration tests cho component (medium), E2E cho full flow (slow). Each layer catches different bugs."

**🧪 Unit Tests — Pure Logic:**

```tsx
import { describe, it, expect } from "vitest";

describe("updateCheckboxAndDescendants", () => {
  it("should check all descendants when parent checked", () => {
    const node: CheckboxItem = {
      id: 1,
      name: "Electronics",
      checked: false,
      children: [
        {
          id: 2,
          name: "Phones",
          checked: false,
          children: [
            { id: 3, name: "iPhone", checked: false },
            { id: 4, name: "Samsung", checked: false },
          ],
        },
        { id: 5, name: "Laptops", checked: false },
      ],
    };

    updateCheckboxAndDescendants(node, true);

    expect(node.checked).toBe(true);
    expect(node.children![0].checked).toBe(true);
    expect(node.children![0].children![0].checked).toBe(true);
    expect(node.children![0].children![1].checked).toBe(true);
    expect(node.children![1].checked).toBe(true);
  });

  it("should uncheck all descendants when parent unchecked", () => {
    // Similar but with false...
  });
});

describe("resolveCheckboxStates", () => {
  it("should set parent to indeterminate when some children checked", () => {
    const node: CheckboxItem = {
      id: 1,
      name: "Electronics",
      checked: false,
      children: [
        { id: 2, name: "Phones", checked: true },
        { id: 3, name: "Laptops", checked: false },
      ],
    };

    resolveCheckboxStates(node, []);

    expect(node.checked).toBe("indeterminate");
  });

  it("should set parent to true when ALL children checked", () => {
    const node: CheckboxItem = {
      id: 1,
      name: "Electronics",
      checked: false,
      children: [
        { id: 2, name: "Phones", checked: true },
        { id: 3, name: "Laptops", checked: true },
      ],
    };

    resolveCheckboxStates(node, []);

    expect(node.checked).toBe(true);
  });

  it("should handle deeply nested resolution", () => {
    const tree: CheckboxItem = {
      id: 1,
      name: "Root",
      checked: false,
      children: [
        {
          id: 2,
          name: "Level 1",
          checked: false,
          children: [
            {
              id: 3,
              name: "Level 2",
              checked: false,
              children: [
                { id: 4, name: "Leaf A", checked: true },
                { id: 5, name: "Leaf B", checked: false },
              ],
            },
          ],
        },
      ],
    };

    resolveCheckboxStates(tree, [0, 0]);

    expect(tree.children![0].children![0].checked).toBe("indeterminate"); // Level 2
    expect(tree.children![0].checked).toBe("indeterminate"); // Level 1
    expect(tree.checked).toBe("indeterminate"); // Root
  });
});

describe("getNodeByPath", () => {
  const testData: CheckboxItem[] = [
    {
      id: 1,
      name: "A",
      checked: false,
      children: [
        { id: 2, name: "A.1", checked: false },
        {
          id: 3,
          name: "A.2",
          checked: false,
          children: [{ id: 4, name: "A.2.1", checked: false }],
        },
      ],
    },
  ];

  it("navigates to root level", () => {
    expect(getNodeByPath(testData, [0]).name).toBe("A");
  });

  it("navigates to nested node", () => {
    expect(getNodeByPath(testData, [0, 1, 0]).name).toBe("A.2.1");
  });
});
```

**🧪 Integration Tests — React Testing Library:**

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

describe("Checkboxes Component", () => {
  const mockData: CheckboxItem[] = [
    {
      id: 1,
      name: "Electronics",
      checked: false,
      children: [
        { id: 2, name: "Phones", checked: false },
        { id: 3, name: "Laptops", checked: false },
      ],
    },
  ];

  it("renders all checkbox items", () => {
    render(<Checkboxes initialData={mockData} />);

    expect(screen.getByLabelText("Electronics")).toBeInTheDocument();
    expect(screen.getByLabelText("Phones")).toBeInTheDocument();
    expect(screen.getByLabelText("Laptops")).toBeInTheDocument();
  });

  it("checks all children when parent clicked", async () => {
    render(<Checkboxes initialData={mockData} />);
    const user = userEvent.setup();

    await user.click(screen.getByLabelText("Electronics"));

    expect(screen.getByLabelText("Electronics")).toBeChecked();
    expect(screen.getByLabelText("Phones")).toBeChecked();
    expect(screen.getByLabelText("Laptops")).toBeChecked();
  });

  it("sets parent to indeterminate when one child checked", async () => {
    render(<Checkboxes initialData={mockData} />);
    const user = userEvent.setup();

    await user.click(screen.getByLabelText("Phones"));

    const parentCheckbox = screen.getByLabelText(
      "Electronics",
    ) as HTMLInputElement;
    expect(parentCheckbox.indeterminate).toBe(true);
    expect(screen.getByLabelText("Phones")).toBeChecked();
    expect(screen.getByLabelText("Laptops")).not.toBeChecked();
  });

  it("unchecks parent when all children unchecked", async () => {
    render(<Checkboxes initialData={mockData} />);
    const user = userEvent.setup();

    // First check parent (all children checked)
    await user.click(screen.getByLabelText("Electronics"));
    expect(screen.getByLabelText("Electronics")).toBeChecked();

    // Uncheck each child
    await user.click(screen.getByLabelText("Phones"));
    await user.click(screen.getByLabelText("Laptops"));

    expect(screen.getByLabelText("Electronics")).not.toBeChecked();
  });

  it("supports keyboard navigation", async () => {
    render(<Checkboxes initialData={mockData} />);
    const user = userEvent.setup();

    // Tab to first checkbox
    await user.tab();
    expect(screen.getByLabelText("Electronics")).toHaveFocus();

    // Space to toggle
    await user.keyboard(" ");
    expect(screen.getByLabelText("Electronics")).toBeChecked();
  });
});
```

**🧪 Accessibility Tests — jest-axe:**

```tsx
import { axe, toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);

describe("Accessibility", () => {
  it("has no accessibility violations", async () => {
    const { container } = render(<Checkboxes initialData={mockData} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("uses correct ARIA roles", () => {
    render(<Checkboxes initialData={mockData} />);

    expect(screen.getByRole("tree")).toBeInTheDocument();
    expect(screen.getAllByRole("treeitem")).toHaveLength(3);
  });

  it("announces indeterminate state correctly", async () => {
    render(<Checkboxes initialData={mockData} />);
    const user = userEvent.setup();

    await user.click(screen.getByLabelText("Phones"));

    const parentItem = screen
      .getByLabelText("Electronics")
      .closest("[role='treeitem']");
    expect(parentItem).toHaveAttribute("aria-checked", "mixed");
  });
});
```

**📊 Test Strategy Overview:**

```
┌─────────────────────────────────────────────────────────────────┐
│  TEST PYRAMID FOR CHECKBOX TREE                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│              ┌─────────┐                                        │
│              │  E2E    │  ← Fewest: full user flows             │
│              │  Tests  │    (Cypress/Playwright)                 │
│            ┌─┴─────────┴─┐                                      │
│            │ Integration  │  ← Middle: component behavior       │
│            │    Tests     │    (RTL + userEvent)                 │
│          ┌─┴─────────────┴─┐                                    │
│          │   Unit Tests     │  ← Most: pure logic               │
│          │                  │    (Vitest/Jest)                   │
│          └──────────────────┘                                    │
│                                                                 │
│  WHAT TO TEST AT EACH LEVEL:                                    │
│                                                                 │
│  Unit:                                                          │
│  ✅ updateCheckboxAndDescendants (DOWN logic)                   │
│  ✅ resolveCheckboxStates (UP logic)                            │
│  ✅ getNodeByPath (navigation)                                  │
│  ✅ structuredClone behavior                                    │
│  ✅ every()/some() logic                                        │
│                                                                 │
│  Integration:                                                   │
│  ✅ Click parent → all children checked                         │
│  ✅ Click 1 child → parent indeterminate                        │
│  ✅ Uncheck all children → parent unchecked                     │
│  ✅ Keyboard navigation (Tab, Space, Arrow)                     │
│  ✅ Screen reader announcements                                 │
│                                                                 │
│  E2E:                                                           │
│  ✅ Full user flow: search → filter → check → save              │
│  ✅ Persistence: check → refresh → state preserved              │
│  ✅ Performance: 1000 nodes render without jank                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**🤔 Follow-up questions:**

| Câu hỏi                   | Trả lời                                                                                                              |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| "RTL vs Enzyme?"          | "RTL tests behavior (what user sees). Enzyme tests internals (implementation). React team recommends RTL."           |
| "userEvent vs fireEvent?" | "userEvent simulates real user (type, click with focus change). fireEvent just dispatches events. Prefer userEvent." |
| "Snapshot testing?"       | "Fragile cho dynamic tree. Prefer assertion-based. Snapshot only for static UI."                                     |
| "Coverage target?"        | "90%+ cho logic functions. 80%+ cho components. 100% impractical but aim high."                                      |
| "Mocking?"                | "Mock API calls (msw). Don't mock internal hooks—test real behavior."                                                |

---

### 15. Error Boundaries cho Tree Components

**💬 Cách trình bày:**

> "Tree rendering có thể fail (bad data, missing children, stack overflow). Error Boundary catch lỗi ở subtree level, không crash toàn bộ app."

```tsx
// Error Boundary — must be class component (React limitation)
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class CheckboxTreeErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to error reporting service
    console.error("Checkbox tree error:", error);
    console.error("Component stack:", errorInfo.componentStack);

    // Send to Sentry/DataDog
    // Sentry.captureException(error, { extra: errorInfo });
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div role="alert" className="error-fallback">
            <h3>⚠️ Error loading checkbox tree</h3>
            <p>{this.state.error?.message}</p>
            <button onClick={this.resetError}>Try Again</button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}

// Granular error boundaries — wrap each subtree
function SafeCheckboxList({ items, parentIndices }: Props) {
  return (
    <ul role="group">
      {items.map((item, index) => (
        <CheckboxTreeErrorBoundary
          key={item.id}
          fallback={
            <li className="error-node">⚠️ Failed to render: {item.name}</li>
          }
        >
          <CheckboxItem item={item} indices={[...parentIndices, index]} />
        </CheckboxTreeErrorBoundary>
      ))}
    </ul>
  );
}

// Data validation before render
function useValidatedTree(data: unknown): CheckboxItem[] | null {
  return useMemo(() => {
    try {
      return validateAndNormalize(data);
    } catch (e) {
      console.error("Invalid tree data:", e);
      return null;
    }
  }, [data]);
}

// Zod schema validation
import { z } from "zod";

const CheckboxItemSchema: z.ZodType<CheckboxItem> = z.lazy(() =>
  z.object({
    id: z.number(),
    name: z.string(),
    checked: z.union([z.boolean(), z.literal("indeterminate")]),
    children: z.array(CheckboxItemSchema).optional(),
  }),
);

function validateAndNormalize(data: unknown): CheckboxItem[] {
  return z.array(CheckboxItemSchema).parse(data);
}
```

**🤔 Follow-up questions:**

| Câu hỏi                              | Trả lời                                                                                 |
| ------------------------------------ | --------------------------------------------------------------------------------------- |
| "Error Boundary catch async errors?" | "Không! Chỉ catch synchronous render errors. Async errors cần try/catch riêng."         |
| "React 19 use() + Suspense?"         | "use() hook cho async data. ErrorBoundary + Suspense = complete error/loading UX."      |
| "Granularity?"                       | "1 boundary per subtree root vs 1 for entire tree. Trade-off: isolation vs complexity." |
| "Recovery strategy?"                 | "Reset state + refetch data. Hoặc fallback to cached version."                          |

---

### 16. Compound Component Pattern

**💬 Cách trình bày:**

> "Compound components cho phép user compose tree UI flexibly. Parent manages state, children render. Giống `<select>` + `<option>` built-in."

```tsx
// Compound Component API — flexible, declarative
// Usage:
//   <CheckboxTree data={items} onChange={handleChange}>
//     <CheckboxTree.Toolbar />
//     <CheckboxTree.Search />
//     <CheckboxTree.List />
//     <CheckboxTree.Summary />
//   </CheckboxTree>

interface CheckboxTreeContextType {
  data: CheckboxItem[];
  filteredData: CheckboxItem[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onCheck: (checked: boolean, indices: number[]) => void;
  checkedCount: number;
  totalCount: number;
}

const CheckboxTreeContext = createContext<CheckboxTreeContextType | null>(null);

function useCheckboxTree() {
  const ctx = useContext(CheckboxTreeContext);
  if (!ctx) throw new Error("Must be used within CheckboxTree");
  return ctx;
}

// Root component — state management
function CheckboxTree({
  data: initialData,
  onChange,
  children,
}: {
  data: CheckboxItem[];
  onChange: (data: CheckboxItem[]) => void;
  children: React.ReactNode;
}) {
  const [data, setData] = useState(initialData);
  const [searchQuery, setSearchQuery] = useState("");

  const onCheck = useCallback(
    (checked: boolean, indices: number[]) => {
      const newData = structuredClone(data);
      const node = getNodeByPath(newData, indices);
      updateCheckboxAndDescendants(node, checked);
      resolveCheckboxStates(newData[indices[0]], indices.slice(1));
      setData(newData);
      onChange(newData);
    },
    [data, onChange],
  );

  const filteredData = useMemo(
    () => (searchQuery ? filterTree(data, searchQuery) : data),
    [data, searchQuery],
  );

  const contextValue = useMemo(
    () => ({
      data,
      filteredData,
      searchQuery,
      setSearchQuery,
      onCheck,
      checkedCount: countChecked(data),
      totalCount: countNodes(data),
    }),
    [data, filteredData, searchQuery, onCheck],
  );

  return (
    <CheckboxTreeContext.Provider value={contextValue}>
      <div className="checkbox-tree">{children}</div>
    </CheckboxTreeContext.Provider>
  );
}

// Sub-components
CheckboxTree.Toolbar = function Toolbar() {
  const { onCheck, data } = useCheckboxTree();
  return (
    <div className="toolbar">
      <button onClick={() => checkAll(data, onCheck)}>✅ Check All</button>
      <button onClick={() => uncheckAll(data, onCheck)}>❌ Uncheck All</button>
    </div>
  );
};

CheckboxTree.Search = function Search() {
  const { searchQuery, setSearchQuery } = useCheckboxTree();
  return (
    <input
      type="search"
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      placeholder="Search..."
      aria-label="Search checkbox tree"
    />
  );
};

CheckboxTree.List = function List() {
  const { filteredData, onCheck } = useCheckboxTree();
  return <CheckboxList items={filteredData} onCheck={onCheck} />;
};

CheckboxTree.Summary = function Summary() {
  const { checkedCount, totalCount } = useCheckboxTree();
  return (
    <p className="summary">
      Selected: {checkedCount} / {totalCount}
    </p>
  );
};
```

**📊 Pattern Comparison:**

| Pattern          | Flexibility            | Complexity | Reusability | Example                                                     |
| ---------------- | ---------------------- | ---------- | ----------- | ----------------------------------------------------------- |
| **Monolithic**   | Low — all-in-one       | Low        | Low         | `<CheckboxTree config={...} />`                             |
| **Props-based**  | Medium — via config    | Medium     | Medium      | `<CheckboxTree showSearch showToolbar />`                   |
| **Compound**     | High — compose freely  | Medium     | High        | `<CheckboxTree><Tree.Search /><Tree.List /></CheckboxTree>` |
| **Render Props** | Highest — full control | High       | Highest     | `<CheckboxTree render={({data}) => ...} />`                 |
| **Headless**     | Highest — zero UI      | High       | Highest     | `useCheckboxTree()` returns state + handlers                |

**🤔 Follow-up questions:**

| Câu hỏi                     | Trả lời                                                                                               |
| --------------------------- | ----------------------------------------------------------------------------------------------------- |
| "Headless UI pattern?"      | "Hook returns logic only. User provides all UI. Libraries: Headless UI, Radix, React Aria."           |
| "Slot pattern?"             | "Named slots via children or props. `<Tree header={...} footer={...}>`. More explicit than compound." |
| "Type safety cho children?" | "Limit children types: `React.Children.forEach` + type check. Hoặc use explicit props over children." |
| "Testing compound?"         | "Test each sub-component independently. Test composition in integration tests."                       |

---

### 17. Animation & Transitions

**💬 Cách trình bày:**

> "Smooth expand/collapse animations improve UX. CSS transitions for simple, Framer Motion for complex. Key: animate height from 0 to auto."

```tsx
// Approach 1: CSS-only with grid trick (height: auto animation)
function AnimatedCheckboxList({ items, isExpanded, parentIndices }: Props) {
  return (
    <div
      className="expandable"
      style={{
        display: "grid",
        gridTemplateRows: isExpanded ? "1fr" : "0fr",
        transition: "grid-template-rows 300ms ease-out",
      }}
    >
      <div style={{ overflow: "hidden" }}>
        <ul role="group">
          {items.map((item, index) => (
            <CheckboxItem
              key={item.id}
              item={item}
              indices={[...parentIndices, index]}
            />
          ))}
        </ul>
      </div>
    </div>
  );
}

// Approach 2: Framer Motion (more control)
import { motion, AnimatePresence } from "framer-motion";

function MotionCheckboxItem({ item, indices }: Props) {
  const { onCheck, onExpand, expandedIds } = useCheckboxContext();
  const isExpanded = expandedIds.has(item.id);

  return (
    <motion.li
      role="treeitem"
      layout // Smooth reordering animation
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2 }}
    >
      <div className="checkbox-row">
        {item.children && (
          <motion.button
            onClick={() => onExpand(indices)}
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ duration: 0.2 }}
            className="expand-btn"
          >
            ▶
          </motion.button>
        )}
        <CheckboxInput
          checked={item.checked}
          label={item.name}
          onChange={(checked) => onCheck(checked, indices)}
        />
      </div>

      <AnimatePresence initial={false}>
        {item.children && isExpanded && (
          <motion.div
            key="children"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <ul role="group">
              {item.children.map((child, i) => (
                <MotionCheckboxItem
                  key={child.id}
                  item={child}
                  indices={[...indices, i]}
                />
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  );
}

// Approach 3: CSS class-based (lightweight)
const expandStyles = `
  .tree-children {
    overflow: hidden;
    max-height: 0;
    opacity: 0;
    transition: max-height 300ms ease, opacity 200ms ease;
  }

  .tree-children.expanded {
    max-height: 2000px; /* Large enough value */
    opacity: 1;
  }

  .expand-icon {
    transition: transform 200ms ease;
    display: inline-block;
  }

  .expand-icon.rotated {
    transform: rotate(90deg);
  }

  /* Checkbox check animation */
  input[type="checkbox"] {
    transition: box-shadow 150ms ease;
  }

  input[type="checkbox"]:checked {
    animation: checkmark 200ms ease-in-out;
  }

  @keyframes checkmark {
    0% { transform: scale(0.8); }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); }
  }

  /* Staggered children animation */
  .tree-children.expanded > li {
    animation: slideIn 200ms ease-out;
    animation-fill-mode: backwards;
  }

  .tree-children.expanded > li:nth-child(1) { animation-delay: 0ms; }
  .tree-children.expanded > li:nth-child(2) { animation-delay: 50ms; }
  .tree-children.expanded > li:nth-child(3) { animation-delay: 100ms; }
  .tree-children.expanded > li:nth-child(4) { animation-delay: 150ms; }

  @keyframes slideIn {
    from { opacity: 0; transform: translateY(-8px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;
```

**📊 Animation Approaches:**

| Approach           | Bundle Size | Flexibility | Performance | Best For                   |
| ------------------ | ----------- | ----------- | ----------- | -------------------------- |
| **CSS grid trick** | 0 KB        | Low         | Excellent   | Simple expand/collapse     |
| **CSS max-height** | 0 KB        | Low         | Good        | Known max height           |
| **Framer Motion**  | ~30 KB      | High        | Good        | Complex, layout animations |
| **React Spring**   | ~20 KB      | High        | Excellent   | Physics-based              |
| **CSS @keyframes** | 0 KB        | Medium      | Excellent   | Staggered entries          |

**🤔 Follow-up questions:**

| Câu hỏi                       | Trả lời                                                                                                         |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------- |
| "height: auto animation?"     | "CSS can't transition to `auto`. Workaround: grid trick (`0fr` → `1fr`) hoặc JS measure → set explicit height." |
| "Performance?"                | "CSS animations = GPU accelerated (transform, opacity). Avoid animating width/height directly (causes layout)." |
| "Reduced motion?"             | "`@media (prefers-reduced-motion: reduce)` — disable/simplify animations. Accessibility requirement!"           |
| "Virtualization + animation?" | "Tricky. Virtualized items enter/exit viewport. Use `onScroll` position-based opacity fade."                    |

---

### 18. Zustand / Jotai State Management

**💬 Cách trình bày:**

> "Context API re-renders ALL consumers. External stores (Zustand/Jotai) cho selector-based subscription — only re-render khi selected slice changes."

```tsx
// ==========================================
// APPROACH 1: Zustand (simple global store)
// ==========================================
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

interface CheckboxStore {
  // State
  data: CheckboxItem[];
  expandedIds: Set<number>;
  searchQuery: string;

  // Actions
  check: (indices: number[], checked: boolean) => void;
  checkAll: () => void;
  uncheckAll: () => void;
  toggleExpand: (nodeId: number) => void;
  setSearch: (query: string) => void;
}

const useCheckboxStore = create<CheckboxStore>()(
  immer((set) => ({
    data: initialData,
    expandedIds: new Set(),
    searchQuery: "",

    check: (indices, checked) =>
      set((state) => {
        const node = getNodeByPath(state.data, indices);
        const setAll = (n: CheckboxItem, val: boolean) => {
          n.checked = val;
          n.children?.forEach((c) => setAll(c, val));
        };
        setAll(node, checked);
        // Resolve upward
        const resolve = (n: CheckboxItem) => {
          if (n.children) {
            const all = n.children.every((c) => c.checked === true);
            const none = n.children.every((c) => c.checked === false);
            n.checked = all ? true : none ? false : "indeterminate";
          }
        };
        resolveAncestors(state.data, indices, resolve);
      }),

    checkAll: () =>
      set((state) => {
        const setAll = (items: CheckboxItem[]) =>
          items.forEach((i) => {
            i.checked = true;
            if (i.children) setAll(i.children);
          });
        setAll(state.data);
      }),

    uncheckAll: () =>
      set((state) => {
        const setAll = (items: CheckboxItem[]) =>
          items.forEach((i) => {
            i.checked = false;
            if (i.children) setAll(i.children);
          });
        setAll(state.data);
      }),

    toggleExpand: (nodeId) =>
      set((state) => {
        if (state.expandedIds.has(nodeId)) {
          state.expandedIds.delete(nodeId);
        } else {
          state.expandedIds.add(nodeId);
        }
      }),

    setSearch: (query) => set({ searchQuery: query }),
  })),
);

// Components — selector-based (minimal re-renders!)
function TreeToolbar() {
  // Only re-renders when these specific actions change (never, they're stable)
  const checkAll = useCheckboxStore((s) => s.checkAll);
  const uncheckAll = useCheckboxStore((s) => s.uncheckAll);
  const setSearch = useCheckboxStore((s) => s.setSearch);

  return (
    <div className="toolbar">
      <button onClick={checkAll}>✅ All</button>
      <button onClick={uncheckAll}>❌ None</button>
      <input
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search..."
      />
    </div>
  );
}

function TreeNode({ nodeId }: { nodeId: number }) {
  // Only re-renders when THIS node's data changes!
  const node = useCheckboxStore((s) => s.data.find((n) => n.id === nodeId));
  const isExpanded = useCheckboxStore((s) => s.expandedIds.has(nodeId));
  const check = useCheckboxStore((s) => s.check);
  const toggleExpand = useCheckboxStore((s) => s.toggleExpand);

  if (!node) return null;
  // ... render
}

// ==========================================
// APPROACH 2: Jotai (atomic state)
// ==========================================
import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";
import { atomFamily } from "jotai/utils";

// Base atoms
const treeDataAtom = atom<CheckboxItem[]>(initialData);
const expandedIdsAtom = atom<Set<number>>(new Set());
const searchQueryAtom = atom("");

// Derived atoms (computed, like selectors)
const checkedCountAtom = atom((get) => {
  const data = get(treeDataAtom);
  return countChecked(data);
});

const filteredDataAtom = atom((get) => {
  const data = get(treeDataAtom);
  const query = get(searchQueryAtom);
  return query ? filterTree(data, query) : data;
});

// Per-node atom family (granular subscriptions)
const nodeAtomFamily = atomFamily((nodeId: number) =>
  atom(
    (get) => findNodeById(get(treeDataAtom), nodeId),
    (get, set, checked: boolean) => {
      const data = structuredClone(get(treeDataAtom));
      const node = findNodeById(data, nodeId)!;
      updateCheckboxAndDescendants(node, checked);
      resolveAllAncestors(data);
      set(treeDataAtom, data);
    },
  ),
);

// Component — atomic subscription
function JotaiTreeNode({ nodeId }: { nodeId: number }) {
  const [node, setChecked] = useAtom(nodeAtomFamily(nodeId));
  const isExpanded = useAtomValue(
    useMemo(() => atom((get) => get(expandedIdsAtom).has(nodeId)), [nodeId]),
  );

  if (!node) return null;
  return (
    <li>
      <CheckboxInput
        checked={node.checked}
        label={node.name}
        onChange={setChecked}
      />
    </li>
  );
}
```

**📊 State Management Comparison:**

| Feature            | Context API    | Zustand                   | Jotai          | Redux Toolkit  |
| ------------------ | -------------- | ------------------------- | -------------- | -------------- |
| **Bundle size**    | 0 KB           | ~1 KB                     | ~2 KB          | ~10 KB         |
| **Boilerplate**    | Medium         | Low                       | Low            | High           |
| **Re-render**      | All consumers  | Selector-based            | Atom-based     | Selector-based |
| **DevTools**       | React DevTools | Zustand DevTools          | Jotai DevTools | Redux DevTools |
| **Middleware**     | Manual         | Built-in (immer, persist) | Built-in       | Built-in       |
| **Learning curve** | Low            | Low                       | Medium         | High           |
| **SSR**            | Built-in       | Manual                    | Built-in       | Manual         |
| **Best for**       | Small apps     | Medium apps               | Fine-grained   | Large apps     |

**🤔 Follow-up questions:**

| Câu hỏi                | Trả lời                                                                                                         |
| ---------------------- | --------------------------------------------------------------------------------------------------------------- |
| "Zustand vs Redux?"    | "Zustand = simpler API, less boilerplate, same selector pattern. Redux = more ecosystem, DevTools, middleware." |
| "Jotai vs Recoil?"     | "Jotai = simpler, smaller. Recoil = more features (snapshots, persistence). Jotai actively maintained."         |
| "When to use Context?" | "Theme, locale, auth — changes infrequently. Never for frequently changing data (performance)."                 |
| "Zustand persist?"     | "`persist` middleware. Auto-save to localStorage. `partialize` to persist only selected state."                 |

---

### 19. Web Workers cho Heavy Computation

**💬 Cách trình bày:**

> "structuredClone + recursive traversal trên 10K+ nodes block main thread → UI jank. Offload to Web Worker cho non-blocking updates."

```tsx
// ==========================================
// worker.ts — runs in separate thread
// ==========================================
self.onmessage = (e: MessageEvent) => {
  const { type, data, indices, checked } = e.data;

  switch (type) {
    case "CHECK": {
      const newData = structuredClone(data);
      const node = getNodeByPath(newData, indices);

      // Heavy computation — doesn't block UI
      updateCheckboxAndDescendants(node, checked);
      resolveCheckboxStates(newData[indices[0]], indices.slice(1));

      self.postMessage({ type: "CHECK_RESULT", data: newData });
      break;
    }

    case "SEARCH": {
      const { query, tree } = e.data;
      const filtered = filterTree(tree, query);
      const count = countNodes(filtered);
      self.postMessage({ type: "SEARCH_RESULT", data: filtered, count });
      break;
    }

    case "VALIDATE": {
      // Validate large dataset from API
      const validated = validateAndNormalize(e.data.rawData);
      self.postMessage({ type: "VALIDATE_RESULT", data: validated });
      break;
    }
  }
};

// ==========================================
// useCheckboxWorker.ts — hook for components
// ==========================================
function useCheckboxWorker(initialData: CheckboxItem[]) {
  const [data, setData] = useState(initialData);
  const [isProcessing, setIsProcessing] = useState(false);
  const workerRef = useRef<Worker | null>(null);

  // Initialize worker
  useEffect(() => {
    workerRef.current = new Worker(new URL("./worker.ts", import.meta.url), {
      type: "module",
    });

    workerRef.current.onmessage = (e: MessageEvent) => {
      switch (e.data.type) {
        case "CHECK_RESULT":
          setData(e.data.data);
          setIsProcessing(false);
          break;
        case "SEARCH_RESULT":
          // Handle search results
          break;
      }
    };

    workerRef.current.onerror = (error) => {
      console.error("Worker error:", error);
      setIsProcessing(false);
    };

    return () => workerRef.current?.terminate();
  }, []);

  const handleCheck = useCallback(
    (checked: boolean, indices: number[]) => {
      if (!workerRef.current) return;
      setIsProcessing(true);

      // Optimistic update — immediate UI feedback
      setData((prev) => {
        const optimistic = structuredClone(prev);
        getNodeByPath(optimistic, indices).checked = checked;
        return optimistic; // Quick partial update
      });

      // Full computation in worker
      workerRef.current.postMessage({
        type: "CHECK",
        data,
        indices,
        checked,
      });
    },
    [data],
  );

  return { data, handleCheck, isProcessing };
}

// Component usage
function HeavyCheckboxTree() {
  const { data, handleCheck, isProcessing } = useCheckboxWorker(largeDataset);

  return (
    <div>
      {isProcessing && (
        <div className="processing-indicator" aria-live="polite">
          Processing...
        </div>
      )}
      <VirtualizedCheckboxTree items={data} onCheck={handleCheck} />
    </div>
  );
}
```

**📊 Main Thread vs Worker:**

| Aspect            | Main Thread             | Web Worker                  |
| ----------------- | ----------------------- | --------------------------- |
| **UI blocking**   | Yes — jank on heavy ops | No — separate thread        |
| **DOM access**    | Yes                     | ❌ No DOM access            |
| **Data transfer** | N/A                     | Structured clone (overhead) |
| **Debugging**     | Normal DevTools         | Worker DevTools tab         |
| **Complexity**    | Simple                  | Message passing pattern     |
| **When to use**   | < 1K nodes              | > 10K nodes, complex ops    |

**🤔 Follow-up questions:**

| Câu hỏi                 | Trả lời                                                                                        |
| ----------------------- | ---------------------------------------------------------------------------------------------- |
| "SharedArrayBuffer?"    | "Share memory giữa threads. Faster than message passing. Cần COOP/COEP headers."               |
| "Transferable objects?" | "Transfer ownership thay vì copy. `postMessage(data, [data.buffer])`. Zero-copy performance."  |
| "Comlink?"              | "Library simplifies Worker API. Makes Worker functions callable like regular async functions." |
| "When NOT to use?"      | "Simple operations (< 16ms). DOM manipulation. Small datasets. Overhead > benefit."            |

---

### 20. Custom Hook Composition

**💬 Cách trình bày:**

> "Complex features = compose multiple custom hooks. Each hook handles one concern. Compose them into a single powerful hook."

```tsx
// ==========================================
// Individual hooks — single responsibility
// ==========================================

// Hook 1: Core checkbox logic
function useCheckboxLogic(initialData: CheckboxItem[]) {
  const [data, setData] = useState(initialData);

  const check = useCallback((checked: boolean, indices: number[]) => {
    setData((prev) => {
      const newData = structuredClone(prev);
      const node = getNodeByPath(newData, indices);
      updateCheckboxAndDescendants(node, checked);
      resolveCheckboxStates(newData[indices[0]], indices.slice(1));
      return newData;
    });
  }, []);

  const checkAll = useCallback(() => {
    setData((prev) => setAllChecked(structuredClone(prev), true));
  }, []);

  const uncheckAll = useCallback(() => {
    setData((prev) => setAllChecked(structuredClone(prev), false));
  }, []);

  return { data, setData, check, checkAll, uncheckAll };
}

// Hook 2: Expand/collapse
function useExpandCollapse() {
  const [expandedIds, setExpandedIds] = useState(new Set<number>());

  const toggle = useCallback((nodeId: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(nodeId) ? next.delete(nodeId) : next.add(nodeId);
      return next;
    });
  }, []);

  const expandAll = useCallback((allIds: number[]) => {
    setExpandedIds(new Set(allIds));
  }, []);

  const collapseAll = useCallback(() => {
    setExpandedIds(new Set());
  }, []);

  return { expandedIds, toggle, expandAll, collapseAll };
}

// Hook 3: Search & filter
function useTreeSearch(data: CheckboxItem[]) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query); // React 18+

  const filtered = useMemo(
    () => (deferredQuery ? filterTree(data, deferredQuery) : data),
    [data, deferredQuery],
  );

  const matchCount = useMemo(() => countNodes(filtered), [filtered]);

  return {
    query,
    setQuery,
    filtered,
    matchCount,
    isFiltering: query !== deferredQuery,
  };
}

// Hook 4: Selection summary
function useSelectionSummary(data: CheckboxItem[]) {
  return useMemo(() => {
    const checked = getCheckedItems(data);
    const total = countNodes(data);
    return {
      checkedItems: checked,
      checkedCount: checked.length,
      totalCount: total,
      allChecked: checked.length === total,
      noneChecked: checked.length === 0,
      percentage: total > 0 ? Math.round((checked.length / total) * 100) : 0,
    };
  }, [data]);
}

// Hook 5: Undo/Redo (from section 7)
function useHistory<T>(initialState: T) {
  // ... (as implemented in section 7)
}

// ==========================================
// Composed hook — combines all concerns
// ==========================================
function useCheckboxTree(initialData: CheckboxItem[]) {
  // Core logic
  const { data, setData, check, checkAll, uncheckAll } =
    useCheckboxLogic(initialData);

  // Expand/collapse
  const expansion = useExpandCollapse();

  // Search
  const search = useTreeSearch(data);

  // Summary
  const summary = useSelectionSummary(data);

  // History (undo/redo)
  const history = useUndoRedo(data);

  // Compose check handler with history
  const handleCheck = useCallback(
    (checked: boolean, indices: number[]) => {
      check(checked, indices);
      // History is updated via useEffect watching data changes
    },
    [check],
  );

  return {
    // Data
    data: search.filtered, // Always return filtered view
    rawData: data,

    // Actions
    check: handleCheck,
    checkAll,
    uncheckAll,

    // Expansion
    ...expansion,

    // Search
    searchQuery: search.query,
    setSearchQuery: search.setQuery,
    isFiltering: search.isFiltering,
    matchCount: search.matchCount,

    // Summary
    ...summary,

    // History
    undo: history.undo,
    redo: history.redo,
    canUndo: history.canUndo,
    canRedo: history.canRedo,
  };
}

// ==========================================
// Usage — clean component
// ==========================================
function FullFeaturedCheckboxTree() {
  const tree = useCheckboxTree(initialData);

  return (
    <div className="checkbox-tree">
      <div className="toolbar">
        <input
          type="search"
          value={tree.searchQuery}
          onChange={(e) => tree.setSearchQuery(e.target.value)}
          placeholder={`Search ${tree.totalCount} items...`}
        />
        <button onClick={tree.checkAll} disabled={tree.allChecked}>
          ✅ All
        </button>
        <button onClick={tree.uncheckAll} disabled={tree.noneChecked}>
          ❌ None
        </button>
        <button onClick={tree.undo} disabled={!tree.canUndo}>
          ↩ Undo
        </button>
        <button onClick={tree.redo} disabled={!tree.canRedo}>
          ↪ Redo
        </button>
        <span>
          {tree.percentage}% selected ({tree.checkedCount}/{tree.totalCount})
        </span>
      </div>

      {tree.isFiltering && <p>Filtering...</p>}

      <CheckboxList
        items={tree.data}
        expandedIds={tree.expandedIds}
        onCheck={tree.check}
        onExpand={tree.toggle}
      />
    </div>
  );
}
```

**📊 Hook Composition Benefits:**

| Benefit                     | Explanation                                                    |
| --------------------------- | -------------------------------------------------------------- |
| **Single Responsibility**   | Each hook handles one concern (check, expand, search, history) |
| **Testable**                | Test each hook independently with `renderHook`                 |
| **Reusable**                | `useTreeSearch` can be used in other tree components           |
| **Composable**              | Pick and choose — don't need search? Don't include it          |
| **Separation of Concerns**  | Business logic in hooks, rendering in components               |
| **TypeScript IntelliSense** | Return type is well-typed, autocomplete works perfectly        |

**🤔 Follow-up questions:**

| Câu hỏi                          | Trả lời                                                                                                       |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| "Too many hooks?"                | "Each hook should do ONE thing. 5-7 composed hooks is fine. If more, consider extracting to separate module." |
| "Circular dependencies?"         | "Hook A depends on Hook B's output? Pass as parameter. Never import hooks circularly."                        |
| "renderHook testing?"            | "`const { result } = renderHook(() => useCheckboxLogic(data))`. Test independently!"                          |
| "Hook library pattern?"          | "Export hooks from package. Users compose as needed. Like @tanstack/react-query architecture."                |
| "Performance of composed hooks?" | "Each hook = separate useState/useMemo. More hooks = more state updates. Profile with React DevTools."        |

---

### 21. React Server Components (RSC) & Streaming

**💬 Cách trình bày:**

> "Server Components render trên server, gửi HTML — zero client JS cho static parts. Client Components handle interactivity. Hybrid approach cho checkbox tree."

```tsx
// ==========================================
// Server Component — fetches data, no client JS
// ==========================================
// app/checkboxes/page.tsx (Next.js App Router)
async function CheckboxPage() {
  // Fetch data on server — no client bundle impact
  const data = await fetch("https://api.example.com/categories", {
    next: { revalidate: 60 }, // ISR: revalidate every 60s
  }).then((res) => res.json());

  const validated = validateAndNormalize(data);

  return (
    <div className="page">
      <h1>Category Selection</h1>
      {/* Server Component — renders static HTML */}
      <TreeMetadata totalCount={countNodes(validated)} />

      {/* Client Component — handles interactivity */}
      <InteractiveCheckboxTree initialData={validated} />
    </div>
  );
}

// ==========================================
// Shared Server Component — static info
// ==========================================
function TreeMetadata({ totalCount }: { totalCount: number }) {
  // This entire component = 0 KB client JS
  return (
    <div className="metadata">
      <p>Total items: {totalCount}</p>
      <p>Last updated: {new Date().toLocaleString()}</p>
    </div>
  );
}

// ==========================================
// Client Component — interactive
// ==========================================
("use client"); // Must opt-in to client rendering

import { useState, useCallback } from "react";

function InteractiveCheckboxTree({
  initialData,
}: {
  initialData: CheckboxItem[];
}) {
  const [data, setData] = useState(initialData);

  const handleCheck = useCallback(
    (checked: boolean, indices: number[]) => {
      const newData = structuredClone(data);
      const node = getNodeByPath(newData, indices);
      updateCheckboxAndDescendants(node, checked);
      resolveCheckboxStates(newData[indices[0]], indices.slice(1));
      setData(newData);
    },
    [data],
  );

  return <CheckboxList items={data} onCheck={handleCheck} />;
}

// ==========================================
// Streaming with Suspense
// ==========================================
import { Suspense } from "react";

async function StreamingCheckboxPage() {
  return (
    <div>
      <h1>Categories</h1>
      {/* Show immediately */}
      <SearchBar />

      {/* Stream when ready */}
      <Suspense fallback={<TreeSkeleton />}>
        <AsyncCheckboxTree />
      </Suspense>
    </div>
  );
}

async function AsyncCheckboxTree() {
  // This "blocks" but Suspense shows fallback while waiting
  const data = await fetchCategories();
  return <InteractiveCheckboxTree initialData={data} />;
}

function TreeSkeleton() {
  return (
    <div className="skeleton" aria-busy="true" aria-label="Loading tree">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="skeleton-row"
          style={{ paddingLeft: `${(i % 3) * 24}px` }}
        >
          <div className="skeleton-checkbox" />
          <div
            className="skeleton-text"
            style={{ width: `${100 + Math.random() * 100}px` }}
          />
        </div>
      ))}
    </div>
  );
}
```

**📊 Server vs Client Components:**

| Aspect             | Server Component              | Client Component      |
| ------------------ | ----------------------------- | --------------------- |
| **JS bundle**      | 0 KB                          | Included in bundle    |
| **Data fetching**  | Direct DB/API access          | useEffect/React Query |
| **State**          | ❌ No useState                | ✅ Full state         |
| **Event handlers** | ❌ No onClick                 | ✅ Full interactivity |
| **Hooks**          | ❌ No hooks                   | ✅ All hooks          |
| **Rendering**      | Server → HTML stream          | Client → DOM updates  |
| **SEO**            | ✅ Excellent                  | Depends on SSR        |
| **Use case**       | Static content, data fetching | Interactive UI        |

**🤔 Follow-up questions:**

| Câu hỏi                | Trả lời                                                                                                              |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------- |
| "use client boundary?" | "Directive marks component + subtree as client. Minimize client boundary — push down to leaf."                       |
| "Serializable props?"  | "Server → Client props must be serializable (JSON). No functions, no classes, no Symbols."                           |
| "Server Actions?"      | "Functions that run on server, callable from client. `'use server'` directive. Good cho form submission + API sync." |
| "Hydration mismatch?"  | "Server HTML ≠ Client render → warning. Ensure same output. Dùng `suppressHydrationWarning` for dates/random."       |

---

### 22. Form Integration

**💬 Cách trình bày:**

> "Checkbox tree as part of larger form. Integrate với react-hook-form hoặc Formik cho validation, submission, dirty tracking."

```tsx
// ==========================================
// React Hook Form integration
// ==========================================
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// Form schema with Zod
const FormSchema = z.object({
  name: z.string().min(1, "Name required"),
  email: z.string().email("Invalid email"),
  categories: z
    .array(CheckboxItemSchema)
    .refine(
      (data) => getCheckedItems(data).length >= 1,
      "Select at least one category",
    ),
  preferences: z.object({
    newsletter: z.boolean(),
    notifications: z.boolean(),
  }),
});

type FormValues = z.infer<typeof FormSchema>;

function CategoryForm() {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: "",
      email: "",
      categories: initialCategoryData,
      preferences: { newsletter: false, notifications: true },
    },
  });

  // Watch categories for summary
  const categories = useWatch({ control, name: "categories" });
  const checkedCount = categories ? getCheckedItems(categories).length : 0;

  const onSubmit = async (data: FormValues) => {
    const selectedIds = getCheckedItems(data.categories).map((item) => item.id);
    await fetch("/api/submit", {
      method: "POST",
      body: JSON.stringify({ ...data, selectedCategoryIds: selectedIds }),
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="field">
        <label htmlFor="name">Name</label>
        <input id="name" {...register("name")} />
        {errors.name && <span className="error">{errors.name.message}</span>}
      </div>

      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" type="email" {...register("email")} />
        {errors.email && <span className="error">{errors.email.message}</span>}
      </div>

      {/* Checkbox tree as form field */}
      <div className="field">
        <label>Categories ({checkedCount} selected)</label>
        <Controller
          name="categories"
          control={control}
          render={({ field }) => (
            <CheckboxTreeControlled
              data={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
            />
          )}
        />
        {errors.categories && (
          <span className="error">{errors.categories.message}</span>
        )}
      </div>

      <button type="submit" disabled={!isDirty || isSubmitting}>
        {isSubmitting ? "Submitting..." : "Submit"}
      </button>
      <button type="button" onClick={() => reset()}>
        Reset
      </button>
    </form>
  );
}

// Controlled checkbox tree for react-hook-form
function CheckboxTreeControlled({
  data,
  onChange,
  onBlur,
}: {
  data: CheckboxItem[];
  onChange: (data: CheckboxItem[]) => void;
  onBlur: () => void;
}) {
  const handleCheck = useCallback(
    (checked: boolean, indices: number[]) => {
      const newData = structuredClone(data);
      const node = getNodeByPath(newData, indices);
      updateCheckboxAndDescendants(node, checked);
      resolveCheckboxStates(newData[indices[0]], indices.slice(1));
      onChange(newData);
    },
    [data, onChange],
  );

  return (
    <div onBlur={onBlur}>
      <CheckboxList items={data} onCheck={handleCheck} />
    </div>
  );
}
```

**🤔 Follow-up questions:**

| Câu hỏi                       | Trả lời                                                                                                  |
| ----------------------------- | -------------------------------------------------------------------------------------------------------- |
| "Controller vs register?"     | "register cho native inputs. Controller cho custom components (checkbox tree = custom)."                 |
| "Performance với large form?" | "useWatch subscribes to field changes. Chỉ watch cần thiết. Avoid watching entire form."                 |
| "Dirty tracking?"             | "react-hook-form tracks dirty at field level. Checkbox tree = single field, entire tree is dirty/clean." |
| "Multi-step form?"            | "Store tree state in form context. Each step validates its own section."                                 |
| "Formik alternative?"         | "Formik uses render props/HOC. react-hook-form = hook-based, uncontrolled by default (faster)."          |

---

### 23. Debounce & Throttle Patterns

**💬 Cách trình bày:**

> "Search input fires every keystroke → expensive filter. Debounce waits until user stops typing. Throttle limits frequency. Each for different use cases."

```tsx
// ==========================================
// Custom useDebounce hook
// ==========================================
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// Usage: Search with debounce
function DebouncedSearch({ data }: Props) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);

  const filtered = useMemo(
    () => (debouncedQuery ? filterTree(data, debouncedQuery) : data),
    [data, debouncedQuery],
  );

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search... (debounced 300ms)"
      />
      {query !== debouncedQuery && <span>Searching...</span>}
      <CheckboxList items={filtered} />
    </div>
  );
}

// ==========================================
// Custom useThrottle hook
// ==========================================
function useThrottle<T>(value: T, interval: number): T {
  const [throttledValue, setThrottledValue] = useState(value);
  const lastUpdated = useRef(Date.now());

  useEffect(() => {
    const now = Date.now();
    if (now - lastUpdated.current >= interval) {
      lastUpdated.current = now;
      setThrottledValue(value);
    } else {
      const timer = setTimeout(() => {
        lastUpdated.current = Date.now();
        setThrottledValue(value);
      }, interval - (now - lastUpdated.current));
      return () => clearTimeout(timer);
    }
  }, [value, interval]);

  return throttledValue;
}

// ==========================================
// useDeferredValue — React 18+ built-in "debounce"
// ==========================================
function ReactDeferredSearch({ data }: Props) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query); // React handles timing
  const isStale = query !== deferredQuery;

  const filtered = useMemo(
    () => (deferredQuery ? filterTree(data, deferredQuery) : data),
    [data, deferredQuery],
  );

  return (
    <div>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      <div style={{ opacity: isStale ? 0.6 : 1, transition: "opacity 200ms" }}>
        <CheckboxList items={filtered} />
      </div>
    </div>
  );
}

// ==========================================
// Debounced callback (for API sync)
// ==========================================
function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
): T {
  const callbackRef = useRef(callback);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  // Always use latest callback
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Cleanup on unmount
  useEffect(() => () => clearTimeout(timerRef.current), []);

  return useCallback(
    ((...args: Parameters<T>) => {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => callbackRef.current(...args), delay);
    }) as T,
    [delay],
  );
}

// Usage: Auto-save checkbox state
function AutoSaveTree({ data, onSave }: Props) {
  const debouncedSave = useDebouncedCallback(onSave, 1000);

  const handleCheck = useCallback(
    (checked: boolean, indices: number[]) => {
      const newData = /* ... update logic ... */;
      setData(newData);
      debouncedSave(newData); // Saves 1s after last change
    },
    [debouncedSave],
  );
}
```

**📊 Debounce vs Throttle vs useDeferredValue:**

| Feature             | Debounce           | Throttle                | useDeferredValue      |
| ------------------- | ------------------ | ----------------------- | --------------------- |
| **When fires**      | After pause        | At fixed intervals      | React decides         |
| **Delay control**   | Explicit (ms)      | Explicit (ms)           | Automatic             |
| **Best for**        | Search input       | Scroll/resize           | Expensive renders     |
| **Drops events**    | Yes (intermediate) | Yes (between intervals) | No (defers rendering) |
| **Bundle**          | Custom hook        | Custom hook             | Built-in React 18+    |
| **Concurrent-safe** | Manual             | Manual                  | ✅ Automatic          |
| **Cancellation**    | clearTimeout       | clearTimeout            | N/A                   |

**🤔 Follow-up questions:**

| Câu hỏi                              | Trả lời                                                                                             |
| ------------------------------------ | --------------------------------------------------------------------------------------------------- |
| "Leading vs trailing?"               | "Leading: fire immediately, then wait. Trailing: wait, then fire. Trailing more common for search." |
| "useDeferredValue vs useTransition?" | "useDeferredValue defers value. useTransition defers state update. Similar but different API."      |
| "AbortController?"                   | "Cancel ongoing fetch khi new search starts. `controller.abort()` in cleanup."                      |
| "Stale closure?"                     | "useRef cho latest callback. Avoid capturing stale state in setTimeout."                            |

---

### 24. Bulk Operations & Selection Utils

**💬 Cách trình bày:**

> "Production checkbox trees need: select all visible, invert selection, select by level, export selections. These utilities complete the feature set."

```tsx
// ==========================================
// Bulk operation utilities
// ==========================================

// Get all checked leaf items (for API submission)
function getCheckedLeaves(items: CheckboxItem[]): CheckboxItem[] {
  const result: CheckboxItem[] = [];
  const traverse = (nodes: CheckboxItem[]) => {
    nodes.forEach((node) => {
      if (!node.children || node.children.length === 0) {
        if (node.checked === true) result.push(node);
      } else {
        traverse(node.children);
      }
    });
  };
  traverse(items);
  return result;
}

// Get checked IDs (most common API format)
function getCheckedIds(items: CheckboxItem[]): number[] {
  return getCheckedLeaves(items).map((item) => item.id);
}

// Invert all selections
function invertSelections(items: CheckboxItem[]): CheckboxItem[] {
  const result = structuredClone(items);
  const invert = (nodes: CheckboxItem[]) => {
    nodes.forEach((node) => {
      if (!node.children || node.children.length === 0) {
        node.checked = !node.checked;
      }
      if (node.children) invert(node.children);
    });
  };
  invert(result);
  // Resolve all parents after inversion
  resolveAllParents(result);
  return result;
}

// Select by level (e.g., select all level-2 items)
function selectByLevel(
  items: CheckboxItem[],
  targetLevel: number,
  checked: boolean,
): CheckboxItem[] {
  const result = structuredClone(items);
  const traverse = (nodes: CheckboxItem[], level: number) => {
    nodes.forEach((node) => {
      if (level === targetLevel) {
        node.checked = checked;
        if (node.children) {
          const setAll = (n: CheckboxItem) => {
            n.checked = checked;
            n.children?.forEach(setAll);
          };
          node.children.forEach(setAll);
        }
      } else if (node.children) {
        traverse(node.children, level + 1);
      }
    });
  };
  traverse(result, 0);
  resolveAllParents(result);
  return result;
}

// Resolve all parent states bottom-up
function resolveAllParents(items: CheckboxItem[]) {
  const resolve = (nodes: CheckboxItem[]) => {
    nodes.forEach((node) => {
      if (node.children && node.children.length > 0) {
        resolve(node.children); // Resolve children first (bottom-up)
        const allChecked = node.children.every((c) => c.checked === true);
        const allUnchecked = node.children.every((c) => c.checked === false);
        node.checked = allChecked
          ? true
          : allUnchecked
            ? false
            : "indeterminate";
      }
    });
  };
  resolve(items);
}

// Export as flat list for display/API
function exportSelections(items: CheckboxItem[]): {
  id: number;
  name: string;
  path: string;
}[] {
  const result: { id: number; name: string; path: string }[] = [];
  const traverse = (nodes: CheckboxItem[], pathParts: string[]) => {
    nodes.forEach((node) => {
      const currentPath = [...pathParts, node.name];
      if (
        node.checked === true &&
        (!node.children || node.children.length === 0)
      ) {
        result.push({
          id: node.id,
          name: node.name,
          path: currentPath.join(" > "),
        });
      }
      if (node.children) traverse(node.children, currentPath);
    });
  };
  traverse(items, []);
  return result;
}

// ==========================================
// Component with bulk operations
// ==========================================
function BulkOperationsToolbar({ data, setData }: Props) {
  const summary = useSelectionSummary(data);
  const exported = useMemo(() => exportSelections(data), [data]);

  return (
    <div className="bulk-toolbar">
      <div className="actions">
        <button
          onClick={() => setData(setAllChecked(structuredClone(data), true))}
        >
          ✅ Select All ({summary.totalCount})
        </button>
        <button
          onClick={() => setData(setAllChecked(structuredClone(data), false))}
        >
          ❌ Deselect All
        </button>
        <button onClick={() => setData(invertSelections(data))}>
          🔄 Invert Selection
        </button>
        <button onClick={() => setData(selectByLevel(data, 1, true))}>
          📁 Select Level 1
        </button>
      </div>

      <div className="summary">
        <span>
          {summary.checkedCount} / {summary.totalCount} selected
        </span>
        <progress value={summary.percentage} max={100} />
      </div>

      {exported.length > 0 && (
        <details>
          <summary>Selected Items ({exported.length})</summary>
          <ul className="selection-list">
            {exported.map((item) => (
              <li key={item.id}>
                <span className="path">{item.path}</span>
              </li>
            ))}
          </ul>
        </details>
      )}

      <button
        onClick={() => {
          const csv = exported
            .map((e) => `${e.id},${e.name},"${e.path}"`)
            .join("\n");
          navigator.clipboard.writeText(`id,name,path\n${csv}`);
        }}
      >
        📋 Copy as CSV
      </button>
    </div>
  );
}
```

**🤔 Follow-up questions:**

| Câu hỏi                       | Trả lời                                                                                                |
| ----------------------------- | ------------------------------------------------------------------------------------------------------ |
| "Leaves only vs all checked?" | "API usually wants leaf IDs. Parent checked = all children selected. Send leaves to avoid redundancy." |
| "Partial tree submission?"    | "Prune unchecked subtrees before submit. Smaller payload, faster processing."                          |
| "Selection persistence?"      | "Save checked IDs. On reload: restore from IDs + resolve parent states."                               |
| "Multi-select interaction?"   | "Shift+click = range select. Ctrl+click = toggle individual. Match file explorer behavior."            |

---

### 25. TypeScript Advanced: Recursive Generics

**💬 Cách trình bày:**

> "Strong typing cho tree operations. Generic types cho reusable tree utilities. Recursive types cho compile-time tree validation."

```tsx
// ==========================================
// Generic Tree Node
// ==========================================
interface TreeNode<T extends Record<string, unknown> = {}> {
  id: number;
  children?: TreeNode<T>[];
}

// CheckboxItem extends generic TreeNode
interface CheckboxItem extends TreeNode<{
  checked: CheckboxValue;
  name: string;
}> {
  name: string;
  checked: CheckboxValue;
  children?: CheckboxItem[];
}

// ==========================================
// Generic tree operations (reusable!)
// ==========================================
type CheckboxValue = boolean | "indeterminate";

// Generic traverse — works with any tree structure
function traverseTree<T extends TreeNode>(
  nodes: T[],
  visitor: (node: T, depth: number, path: number[]) => void,
  depth = 0,
  path: number[] = [],
): void {
  nodes.forEach((node, index) => {
    const currentPath = [...path, index];
    visitor(node as T, depth, currentPath);
    if (node.children) {
      traverseTree(node.children as T[], visitor, depth + 1, currentPath);
    }
  });
}

// Generic map — transform tree while preserving structure
function mapTree<T extends TreeNode, U extends TreeNode>(
  nodes: T[],
  transform: (node: T, depth: number) => Omit<U, "children">,
  depth = 0,
): U[] {
  return nodes.map((node) => {
    const transformed = transform(node, depth);
    const children = node.children
      ? mapTree(node.children as T[], transform, depth + 1)
      : undefined;
    return { ...transformed, children } as U;
  });
}

// Generic find — search tree with type safety
function findInTree<T extends TreeNode>(
  nodes: T[],
  predicate: (node: T) => boolean,
): T | undefined {
  for (const node of nodes) {
    if (predicate(node)) return node;
    if (node.children) {
      const found = findInTree(node.children as T[], predicate);
      if (found) return found;
    }
  }
  return undefined;
}

// Generic filter — keep nodes matching predicate
function filterTree<T extends TreeNode>(
  nodes: T[],
  predicate: (node: T) => boolean,
): T[] {
  return nodes
    .map((node) => {
      const filteredChildren = node.children
        ? filterTree(node.children as T[], predicate)
        : [];
      if (predicate(node) || filteredChildren.length > 0) {
        return {
          ...node,
          children:
            filteredChildren.length > 0 ? filteredChildren : node.children,
        };
      }
      return null;
    })
    .filter(Boolean) as T[];
}

// ==========================================
// Path type safety
// ==========================================
type Path = readonly number[];

// Branded type for validated paths
type ValidatedPath = Path & { readonly __brand: "validated" };

function validatePath(data: CheckboxItem[], path: number[]): ValidatedPath {
  let current: CheckboxItem[] | undefined = data;
  for (const index of path) {
    if (!current || index < 0 || index >= current.length) {
      throw new Error(`Invalid path: [${path.join(", ")}]`);
    }
    current = current[index].children;
  }
  return path as unknown as ValidatedPath;
}

function getNodeByValidatedPath(
  data: CheckboxItem[],
  path: ValidatedPath,
): CheckboxItem {
  // Safe — path is validated
  return path.reduce<CheckboxItem>(
    (node, index, i) => (i === 0 ? data[index] : node.children![index]),
    {} as CheckboxItem,
  );
}

// ==========================================
// Type-safe event system
// ==========================================
type CheckboxEvent =
  | { type: "check"; nodeId: number; checked: boolean; path: ValidatedPath }
  | { type: "expand"; nodeId: number }
  | { type: "collapse"; nodeId: number }
  | { type: "checkAll" }
  | { type: "uncheckAll" }
  | { type: "search"; query: string };

// Discriminated union — TS narrows automatically
function handleEvent(
  state: CheckboxItem[],
  event: CheckboxEvent,
): CheckboxItem[] {
  switch (event.type) {
    case "check":
      // TS knows: event.nodeId, event.checked, event.path are available
      const newData = structuredClone(state);
      const node = getNodeByValidatedPath(newData, event.path);
      updateCheckboxAndDescendants(node, event.checked);
      return newData;

    case "checkAll":
      // TS knows: only event.type is available
      return setAllChecked(structuredClone(state), true);

    case "search":
      // TS knows: event.query is available
      return filterTreeByName(state, event.query);

    default:
      // Exhaustive check — TS errors if case missed
      const _exhaustive: never = event;
      return state;
  }
}
```

**📊 TypeScript Utility Types for Trees:**

| Type/Pattern          | Purpose            | Example                                               |
| --------------------- | ------------------ | ----------------------------------------------------- |
| `TreeNode<T>`         | Generic base type  | `interface FileNode extends TreeNode<{size: number}>` |
| `DeepReadonly<T>`     | Immutable tree     | Prevent accidental mutation                           |
| `DeepPartial<T>`      | Partial updates    | API patch requests                                    |
| `Branded types`       | Path validation    | `ValidatedPath` ensures safety                        |
| `Discriminated union` | Event handling     | Exhaustive switch/case                                |
| `Generic constraints` | Reusable utilities | `T extends TreeNode`                                  |
| `Conditional types`   | Leaf vs Branch     | `T extends { children: infer C } ? Branch : Leaf`     |

**🤔 Follow-up questions:**

| Câu hỏi                     | Trả lời                                                                                         |
| --------------------------- | ----------------------------------------------------------------------------------------------- |
| "DeepReadonly?"             | "`type DeepReadonly<T> = { readonly [K in keyof T]: DeepReadonly<T[K]> }`. Recursive readonly." |
| "Template literal types?"   | "Dùng cho path strings: `'0.1.2'`. Parse with TS. Overkill cho interview."                      |
| "Zod vs io-ts?"             | "Zod = simpler, schema-first. io-ts = type-first, functional. Zod more popular."                |
| "Generic exhaustive check?" | "`const _: never = event` — TS error nếu any case trong union chưa handled."                    |

---

### 26. Performance Profiling & Debugging

**💬 Cách trình bày:**

> "Measure trước khi optimize. React DevTools Profiler, Chrome Performance tab, và custom metrics cho data-driven decisions."

```tsx
// ==========================================
// 1. React DevTools Profiler API
// ==========================================
import { Profiler, ProfilerOnRenderCallback } from "react";

const onRender: ProfilerOnRenderCallback = (
  id, // "CheckboxTree"
  phase, // "mount" | "update"
  actualDuration, // Time spent rendering
  baseDuration, // Time without memoization
  startTime, // When React began rendering
  commitTime, // When React committed
) => {
  // Log to analytics
  if (actualDuration > 16) {
    // > 1 frame (60fps)
    console.warn(
      `Slow render: ${id} took ${actualDuration.toFixed(2)}ms (${phase})`,
    );
  }

  // Send to monitoring
  performance.mark(`react-render-${id}`);
  // sendToAnalytics({ component: id, duration: actualDuration, phase });
};

function ProfiledCheckboxTree({ data }: Props) {
  return (
    <Profiler id="CheckboxTree" onRender={onRender}>
      <CheckboxList items={data} />
    </Profiler>
  );
}

// ==========================================
// 2. Custom performance hooks
// ==========================================
function useRenderCount(componentName: string) {
  const renderCount = useRef(0);
  renderCount.current += 1;

  useEffect(() => {
    console.log(`${componentName} rendered ${renderCount.current} times`);
  });

  return renderCount.current;
}

function usePerformanceMeasure(label: string) {
  const startTime = useRef(performance.now());

  useEffect(() => {
    const duration = performance.now() - startTime.current;
    console.log(`${label}: ${duration.toFixed(2)}ms`);
  });
}

// Track why component re-rendered
function useWhyDidYouRender<T extends Record<string, unknown>>(
  componentName: string,
  props: T,
) {
  const prevProps = useRef<T>(props);

  useEffect(() => {
    const changes: string[] = [];
    for (const key in props) {
      if (prevProps.current[key] !== props[key]) {
        changes.push(
          `${key}: ${JSON.stringify(prevProps.current[key])} → ${JSON.stringify(props[key])}`,
        );
      }
    }
    if (changes.length > 0) {
      console.log(`${componentName} re-rendered because:`, changes);
    }
    prevProps.current = props;
  });
}

// ==========================================
// 3. Benchmark utility
// ==========================================
function benchmarkCheckboxOperations(nodeCount: number) {
  // Generate test data
  const testData = generateTree(nodeCount);

  // Benchmark structuredClone
  const cloneStart = performance.now();
  const cloned = structuredClone(testData);
  const cloneTime = performance.now() - cloneStart;

  // Benchmark check operation
  const checkStart = performance.now();
  updateCheckboxAndDescendants(cloned[0], true);
  const checkTime = performance.now() - checkStart;

  // Benchmark resolve
  const resolveStart = performance.now();
  resolveAllParents(cloned);
  const resolveTime = performance.now() - resolveStart;

  console.table({
    "Node count": nodeCount,
    "Clone (ms)": cloneTime.toFixed(2),
    "Check all (ms)": checkTime.toFixed(2),
    "Resolve (ms)": resolveTime.toFixed(2),
    "Total (ms)": (cloneTime + checkTime + resolveTime).toFixed(2),
  });

  return { cloneTime, checkTime, resolveTime };
}

// Run benchmarks
// benchmarkCheckboxOperations(100);   // ~0.5ms
// benchmarkCheckboxOperations(1000);  // ~5ms
// benchmarkCheckboxOperations(10000); // ~50ms
// benchmarkCheckboxOperations(100000);// ~500ms → needs Worker

// ==========================================
// 4. Performance budget component
// ==========================================
function PerformanceBudget({
  children,
  budget = 16,
}: {
  children: React.ReactNode;
  budget?: number;
}) {
  return (
    <Profiler
      id="performance-budget"
      onRender={(id, phase, actualDuration) => {
        if (actualDuration > budget) {
          console.error(
            `⚠️ PERFORMANCE BUDGET EXCEEDED: ${actualDuration.toFixed(1)}ms > ${budget}ms budget`,
          );
        }
      }}
    >
      {children}
    </Profiler>
  );
}
```

**📊 Performance Optimization Decision Tree:**

```
┌─────────────────────────────────────────────────────────────────────────┐
│  PERFORMANCE DEBUGGING FLOWCHART                                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Is it slow?                                                            │
│  │                                                                      │
│  ├─ YES → Measure with Profiler                                         │
│  │  │                                                                    │
│  │  ├─ Render time > 16ms?                                              │
│  │  │  │                                                                 │
│  │  │  ├─ Too many components rendering?                                │
│  │  │  │  ├─ YES → React.memo + useCallback                            │
│  │  │  │  └─ NO ↓                                                       │
│  │  │  │                                                                 │
│  │  │  ├─ Too many DOM nodes?                                           │
│  │  │  │  ├─ YES → Virtualization                                       │
│  │  │  │  └─ NO ↓                                                       │
│  │  │  │                                                                 │
│  │  │  ├─ Expensive computation?                                        │
│  │  │  │  ├─ YES → useMemo / Web Worker                                │
│  │  │  │  └─ NO ↓                                                       │
│  │  │  │                                                                 │
│  │  │  └─ structuredClone bottleneck?                                   │
│  │  │     ├─ YES → Immer (structural sharing) / Normalized state        │
│  │  │     └─ NO → Profile deeper with Chrome DevTools                   │
│  │  │                                                                    │
│  │  └─ Mount time > 100ms?                                              │
│  │     ├─ Large initial data → Lazy loading                             │
│  │     ├─ Many effects → Defer with useEffect                          │
│  │     └─ Heavy imports → Code splitting (React.lazy)                   │
│  │                                                                      │
│  └─ NO → Don't optimize! "Premature optimization is the root of evil"  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**📊 Performance Benchmarks Reference:**

| Metric                         | Target          | Tool                    |
| ------------------------------ | --------------- | ----------------------- |
| **First Contentful Paint**     | < 1.8s          | Lighthouse              |
| **Time to Interactive**        | < 3.9s          | Lighthouse              |
| **Render time (per frame)**    | < 16ms          | React Profiler          |
| **JavaScript bundle**          | < 200KB gzipped | webpack-bundle-analyzer |
| **structuredClone** (1K nodes) | < 5ms           | performance.now()       |
| **Full check operation**       | < 10ms          | Custom benchmark        |
| **Search filter** (1K nodes)   | < 20ms          | Custom benchmark        |

**🤔 Follow-up questions:**

| Câu hỏi                    | Trả lời                                                                                       |
| -------------------------- | --------------------------------------------------------------------------------------------- |
| "React DevTools Profiler?" | "Record → interact → analyze flamegraph. Gray = memo skipped. Yellow/red = slow."             |
| "Chrome Performance tab?"  | "Record → timeline shows main thread. Long tasks > 50ms = bad. Check scripting vs rendering." |
| "Why Did You Render?"      | "npm package. Auto-logs unnecessary re-renders. Remove in production!"                        |
| "Performance CI?"          | "Lighthouse CI in GitHub Actions. Fail build if score < threshold. Budget enforcement."       |

---

### 27. Internationalization (i18n)

**💬 Cách trình bày:**

> "Production apps serve global users. Tree labels, ARIA labels, error messages — all need translation. react-intl hoặc i18next cho scalable i18n."

```tsx
// ==========================================
// i18n setup with react-intl
// ==========================================
import {
  IntlProvider,
  useIntl,
  FormattedMessage,
  defineMessages,
} from "react-intl";

// Message definitions (extractable for translators)
const messages = defineMessages({
  searchPlaceholder: {
    id: "checkboxTree.search.placeholder",
    defaultMessage: "Search {count} items...",
    description: "Search input placeholder in checkbox tree",
  },
  selectAll: {
    id: "checkboxTree.actions.selectAll",
    defaultMessage: "Select All",
  },
  deselectAll: {
    id: "checkboxTree.actions.deselectAll",
    defaultMessage: "Deselect All",
  },
  selectedCount: {
    id: "checkboxTree.summary.selected",
    defaultMessage:
      "{count, plural, =0 {No items} one {# item} other {# items}} selected",
  },
  expandNode: {
    id: "checkboxTree.aria.expand",
    defaultMessage: "Expand {name}",
  },
  collapseNode: {
    id: "checkboxTree.aria.collapse",
    defaultMessage: "Collapse {name}",
  },
  indeterminate: {
    id: "checkboxTree.state.indeterminate",
    defaultMessage: "{name}: partially selected",
  },
});

// Vietnamese translations
const viMessages: Record<string, string> = {
  "checkboxTree.search.placeholder": "Tìm kiếm {count} mục...",
  "checkboxTree.actions.selectAll": "Chọn tất cả",
  "checkboxTree.actions.deselectAll": "Bỏ chọn tất cả",
  "checkboxTree.summary.selected":
    "{count, plural, =0 {Không có mục nào} other {# mục}} đã chọn",
  "checkboxTree.aria.expand": "Mở rộng {name}",
  "checkboxTree.aria.collapse": "Thu gọn {name}",
  "checkboxTree.state.indeterminate": "{name}: đã chọn một phần",
};

// ==========================================
// i18n-aware component
// ==========================================
function InternationalizedCheckboxTree({ data }: Props) {
  const intl = useIntl();
  const summary = useSelectionSummary(data);

  return (
    <div>
      {/* Toolbar with translated labels */}
      <div className="toolbar">
        <input
          placeholder={intl.formatMessage(messages.searchPlaceholder, {
            count: summary.totalCount,
          })}
          aria-label={intl.formatMessage(messages.searchPlaceholder, {
            count: summary.totalCount,
          })}
        />
        <button aria-label={intl.formatMessage(messages.selectAll)}>
          <FormattedMessage {...messages.selectAll} />
        </button>
      </div>

      {/* Summary with pluralization */}
      <p>
        <FormattedMessage
          {...messages.selectedCount}
          values={{ count: summary.checkedCount }}
        />
      </p>

      <CheckboxList items={data} />
    </div>
  );
}

// ==========================================
// i18n tree node labels (data-level i18n)
// ==========================================
interface LocalizedCheckboxItem extends CheckboxItem {
  nameKey: string; // "category.electronics"
  name: string; // Fallback: "Electronics"
}

function useLocalizedTree(
  items: LocalizedCheckboxItem[],
): LocalizedCheckboxItem[] {
  const intl = useIntl();

  return useMemo(() => {
    const localize = (
      nodes: LocalizedCheckboxItem[],
    ): LocalizedCheckboxItem[] =>
      nodes.map((node) => ({
        ...node,
        name: intl.messages[node.nameKey]
          ? String(intl.messages[node.nameKey])
          : node.name, // Fallback to default
        children: node.children
          ? localize(node.children as LocalizedCheckboxItem[])
          : undefined,
      }));
    return localize(items);
  }, [items, intl]);
}

// ==========================================
// RTL (Right-to-Left) support
// ==========================================
function RTLCheckboxTree({ data }: Props) {
  const { locale } = useIntl();
  const isRTL = ["ar", "he", "fa", "ur"].includes(locale);

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className="checkbox-tree"
      style={
        {
          // Flip padding for RTL
          "--indent-direction": isRTL ? "padding-right" : "padding-left",
        } as React.CSSProperties
      }
    >
      <CheckboxList items={data} />
    </div>
  );
}
```

**🤔 Follow-up questions:**

| Câu hỏi                     | Trả lời                                                                                                    |
| --------------------------- | ---------------------------------------------------------------------------------------------------------- |
| "react-intl vs i18next?"    | "react-intl = ICU format, smaller. i18next = more features (namespaces, backends). Both production-ready." |
| "Dynamic locale switching?" | "Change IntlProvider `locale` prop. Lazy-load translations: `import(`./locales/${locale}.json`)`."         |
| "ICU pluralization?"        | "`{count, plural, =0 {none} one {# item} other {# items}}`. Handles all languages correctly."              |
| "RTL layout?"               | "`dir='rtl'` on root. CSS logical properties (`margin-inline-start` vs `margin-left`). Test with Arabic."  |

---

### 28. Real-time Collaboration (WebSocket / CRDT)

**💬 Cách trình bày:**

> "Multiple users editing same tree simultaneously. WebSocket for simple sync. CRDT for conflict-free offline-first."

```tsx
// ==========================================
// WebSocket-based real-time sync
// ==========================================
interface TreeOperation {
  type: "CHECK" | "UNCHECK" | "CHECK_ALL" | "UNCHECK_ALL";
  path?: number[];
  userId: string;
  timestamp: number;
}

function useRealtimeTree(initialData: CheckboxItem[], roomId: string) {
  const [data, setData] = useState(initialData);
  const [peers, setPeers] = useState<
    Map<string, { cursor: number[]; name: string }>
  >(new Map());
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(`wss://api.example.com/rooms/${roomId}`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);

      switch (msg.type) {
        case "OPERATION":
          // Apply remote operation
          setData((prev) => applyOperation(prev, msg.operation));
          break;

        case "CURSOR":
          // Show peer's cursor position
          setPeers((prev) =>
            new Map(prev).set(msg.userId, {
              cursor: msg.path,
              name: msg.userName,
            }),
          );
          break;

        case "FULL_STATE":
          // Initial sync on join
          setData(msg.data);
          break;

        case "PEER_LEFT":
          setPeers((prev) => {
            const next = new Map(prev);
            next.delete(msg.userId);
            return next;
          });
          break;
      }
    };

    ws.onclose = () => {
      // Reconnect with exponential backoff
      setTimeout(() => reconnect(roomId), 1000);
    };

    return () => ws.close();
  }, [roomId]);

  const handleCheck = useCallback((checked: boolean, indices: number[]) => {
    const operation: TreeOperation = {
      type: checked ? "CHECK" : "UNCHECK",
      path: indices,
      userId: getCurrentUserId(),
      timestamp: Date.now(),
    };

    // Optimistic local update
    setData((prev) => applyOperation(prev, operation));

    // Broadcast to peers
    wsRef.current?.send(JSON.stringify({ type: "OPERATION", operation }));
  }, []);

  return { data, handleCheck, peers };
}

function applyOperation(
  data: CheckboxItem[],
  op: TreeOperation,
): CheckboxItem[] {
  const newData = structuredClone(data);
  switch (op.type) {
    case "CHECK":
    case "UNCHECK": {
      const node = getNodeByPath(newData, op.path!);
      const checked = op.type === "CHECK";
      updateCheckboxAndDescendants(node, checked);
      resolveCheckboxStates(newData[op.path![0]], op.path!.slice(1));
      break;
    }
    case "CHECK_ALL":
      setAllChecked(newData, true);
      break;
    case "UNCHECK_ALL":
      setAllChecked(newData, false);
      break;
  }
  return newData;
}

// ==========================================
// Peer Presence UI
// ==========================================
function CollaborativeCheckboxItem({
  item,
  indices,
  peers,
}: Props & { peers: Map<string, any> }) {
  // Find peers focused on this node
  const peersHere = Array.from(peers.entries()).filter(([_, peer]) =>
    arraysEqual(peer.cursor, indices),
  );

  return (
    <li className="collab-item">
      <CheckboxInput checked={item.checked} label={item.name} />

      {/* Show peer avatars */}
      {peersHere.length > 0 && (
        <div className="peer-indicators">
          {peersHere.map(([userId, peer]) => (
            <span
              key={userId}
              className="peer-avatar"
              title={`${peer.name} is here`}
              style={{
                backgroundColor: stringToColor(userId),
                border: `2px solid ${stringToColor(userId)}`,
              }}
            >
              {peer.name[0]}
            </span>
          ))}
        </div>
      )}
    </li>
  );
}

// ==========================================
// Conflict Resolution (Last-Write-Wins)
// ==========================================
function resolveConflict(
  local: TreeOperation,
  remote: TreeOperation,
): TreeOperation {
  // Last-Write-Wins: most recent timestamp wins
  if (remote.timestamp > local.timestamp) return remote;
  if (local.timestamp > remote.timestamp) return local;
  // Same timestamp: deterministic tiebreak by userId
  return local.userId > remote.userId ? local : remote;
}
```

**📊 Real-time Approaches:**

| Approach                  | Offline Support | Conflict Handling    | Complexity | Use Case              |
| ------------------------- | --------------- | -------------------- | ---------- | --------------------- |
| **WebSocket (LWW)**       | ❌ No           | Last-Write-Wins      | Low        | Simple shared editing |
| **Operational Transform** | Partial         | Transform operations | High       | Google Docs-style     |
| **CRDT (Yjs/Automerge)**  | ✅ Full         | Auto-resolved        | Medium     | Offline-first apps    |
| **Polling**               | ❌ No           | Server-side merge    | Low        | Infrequent updates    |

**🤔 Follow-up questions:**

| Câu hỏi           | Trả lời                                                                                              |
| ----------------- | ---------------------------------------------------------------------------------------------------- |
| "CRDT for trees?" | "Yjs TreeType hoặc Automerge. Each node = CRDT doc. Merge automatically. Complex but powerful."      |
| "Reconnection?"   | "Exponential backoff (1s, 2s, 4s, 8s...). On reconnect: request full state + apply missed ops."      |
| "Presence?"       | "User cursor position + avatar. Broadcast via WebSocket. Expire stale presences after timeout."      |
| "Scale?"          | "WebSocket = stateful. Use Redis pub/sub for multi-server. Or serverless: Ably, Pusher, Liveblocks." |

---

### 29. Keyboard Shortcuts & Command Palette

**💬 Cách trình bày:**

> "Power users want keyboard shortcuts. Cmd+A select all, Cmd+Z undo, / to search. Command palette for discoverability."

```tsx
// ==========================================
// Global keyboard shortcuts
// ==========================================
function useCheckboxShortcuts({
  checkAll,
  uncheckAll,
  undo,
  redo,
  focusSearch,
  expandAll,
  collapseAll,
}: ShortcutActions) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey; // Cmd/Ctrl

      // Only when tree is focused
      if (!document.activeElement?.closest(".checkbox-tree")) return;

      switch (true) {
        case isMod && e.key === "a":
          e.preventDefault();
          checkAll();
          break;

        case isMod && e.shiftKey && e.key === "a":
          e.preventDefault();
          uncheckAll();
          break;

        case isMod && e.key === "z" && !e.shiftKey:
          e.preventDefault();
          undo();
          break;

        case isMod && (e.key === "y" || (e.shiftKey && e.key === "z")):
          e.preventDefault();
          redo();
          break;

        case e.key === "/" && !isMod:
          e.preventDefault();
          focusSearch();
          break;

        case isMod && e.key === "e":
          e.preventDefault();
          expandAll();
          break;

        case isMod && e.shiftKey && e.key === "e":
          e.preventDefault();
          collapseAll();
          break;
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [checkAll, uncheckAll, undo, redo, focusSearch, expandAll, collapseAll]);
}

// ==========================================
// Command Palette (Cmd+K)
// ==========================================
interface Command {
  id: string;
  label: string;
  shortcut?: string;
  action: () => void;
  icon?: string;
  category: "selection" | "navigation" | "view" | "edit";
}

function useCommandPalette(treeActions: ShortcutActions) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");

  const commands: Command[] = useMemo(
    () => [
      {
        id: "select-all",
        label: "Select All",
        shortcut: "⌘A",
        action: treeActions.checkAll,
        icon: "✅",
        category: "selection",
      },
      {
        id: "deselect-all",
        label: "Deselect All",
        shortcut: "⌘⇧A",
        action: treeActions.uncheckAll,
        icon: "❌",
        category: "selection",
      },
      {
        id: "invert",
        label: "Invert Selection",
        action: treeActions.invertSelection,
        icon: "🔄",
        category: "selection",
      },
      {
        id: "undo",
        label: "Undo",
        shortcut: "⌘Z",
        action: treeActions.undo,
        icon: "↩",
        category: "edit",
      },
      {
        id: "redo",
        label: "Redo",
        shortcut: "⌘⇧Z",
        action: treeActions.redo,
        icon: "↪",
        category: "edit",
      },
      {
        id: "expand-all",
        label: "Expand All",
        shortcut: "⌘E",
        action: treeActions.expandAll,
        icon: "📂",
        category: "view",
      },
      {
        id: "collapse-all",
        label: "Collapse All",
        shortcut: "⌘⇧E",
        action: treeActions.collapseAll,
        icon: "📁",
        category: "view",
      },
      {
        id: "search",
        label: "Search Tree",
        shortcut: "/",
        action: treeActions.focusSearch,
        icon: "🔍",
        category: "navigation",
      },
    ],
    [treeActions],
  );

  const filtered = useMemo(
    () =>
      query
        ? commands.filter(
            (cmd) =>
              cmd.label.toLowerCase().includes(query.toLowerCase()) ||
              cmd.category.includes(query.toLowerCase()),
          )
        : commands,
    [commands, query],
  );

  // Cmd+K to toggle
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        setQuery("");
      }
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return { isOpen, setIsOpen, query, setQuery, filtered };
}

// Command Palette UI
function CommandPalette({ treeActions }: { treeActions: ShortcutActions }) {
  const { isOpen, setIsOpen, query, setQuery, filtered } =
    useCommandPalette(treeActions);
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (!isOpen) return null;

  return (
    <div className="command-palette-overlay" onClick={() => setIsOpen(false)}>
      <div
        className="command-palette"
        role="dialog"
        aria-label="Command palette"
      >
        <input
          autoFocus
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedIndex(0);
          }}
          placeholder="Type a command..."
          role="combobox"
          aria-expanded={true}
          aria-controls="command-list"
          onKeyDown={(e) => {
            if (e.key === "ArrowDown")
              setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
            if (e.key === "ArrowUp")
              setSelectedIndex((i) => Math.max(i - 1, 0));
            if (e.key === "Enter" && filtered[selectedIndex]) {
              filtered[selectedIndex].action();
              setIsOpen(false);
            }
          }}
        />
        <ul id="command-list" role="listbox">
          {filtered.map((cmd, i) => (
            <li
              key={cmd.id}
              role="option"
              aria-selected={i === selectedIndex}
              className={i === selectedIndex ? "selected" : ""}
              onClick={() => {
                cmd.action();
                setIsOpen(false);
              }}
            >
              <span className="icon">{cmd.icon}</span>
              <span className="label">{cmd.label}</span>
              {cmd.shortcut && <kbd className="shortcut">{cmd.shortcut}</kbd>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
```

**🤔 Follow-up questions:**

| Câu hỏi                           | Trả lời                                                                                              |
| --------------------------------- | ---------------------------------------------------------------------------------------------------- |
| "Conflict với browser shortcuts?" | "`e.preventDefault()` override browser. Only when tree focused. Don't override Cmd+C, Cmd+V global." |
| "Shortcut discoverability?"       | "Tooltip on hover. Keyboard shortcut help (? key). Command palette shows all shortcuts."             |
| "Accessibility?"                  | "Shortcuts must NOT be the only way to do things. Always provide button/menu alternative."           |
| "Custom shortcuts?"               | "Let users remap. Store in localStorage. UI for editing shortcuts (VS Code-style settings)."         |

---

### 30. Migration Patterns

**💬 Cách trình bày:**

> "Legacy codebases need migration paths. Class → Hooks, Redux → Zustand, prop drilling → Context. Incremental migration — không rewrite toàn bộ."

```tsx
// ==========================================
// Pattern 1: Class Component → Hooks (incremental)
// ==========================================

// BEFORE: Class component
class CheckboxTreeClass extends React.Component<Props, State> {
  state: State = { data: this.props.initialData };

  handleCheck = (checked: boolean, indices: number[]) => {
    this.setState((prevState) => {
      const newData = structuredClone(prevState.data);
      const node = getNodeByPath(newData, indices);
      updateCheckboxAndDescendants(node, checked);
      resolveCheckboxStates(newData[indices[0]], indices.slice(1));
      return { data: newData };
    });
  };

  render() {
    return <CheckboxList items={this.state.data} onCheck={this.handleCheck} />;
  }
}

// AFTER: Function component with hooks
function CheckboxTreeHooks({ initialData }: Props) {
  const [data, setData] = useState(initialData);

  const handleCheck = useCallback((checked: boolean, indices: number[]) => {
    setData((prev) => {
      const newData = structuredClone(prev);
      const node = getNodeByPath(newData, indices);
      updateCheckboxAndDescendants(node, checked);
      resolveCheckboxStates(newData[indices[0]], indices.slice(1));
      return newData;
    });
  }, []);

  return <CheckboxList items={data} onCheck={handleCheck} />;
}

// ==========================================
// Pattern 2: Redux → Zustand (side-by-side)
// ==========================================

// Step 1: Create Zustand store mirroring Redux slice
// (keep Redux working while migrating)
const useCheckboxStore = create<CheckboxStore>()(
  immer((set) => ({
    data: [],
    // Mirror Redux actions
    check: (indices, checked) =>
      set((state) => {
        /* ... */
      }),
  })),
);

// Step 2: Bridge — sync Redux → Zustand during migration
function ReduxToZustandBridge() {
  const reduxData = useSelector((state: RootState) => state.checkboxTree.data);
  const setZustandData = useCheckboxStore((s) => s.setData);

  useEffect(() => {
    // Keep Zustand in sync with Redux
    setZustandData(reduxData);
  }, [reduxData, setZustandData]);

  return null; // Render nothing
}

// Step 3: Migrate components one by one
// Change: useSelector → useCheckboxStore
// Before: const data = useSelector(selectCheckboxData);
// After:  const data = useCheckboxStore(s => s.data);

// Step 4: Remove Redux slice + bridge when fully migrated

// ==========================================
// Pattern 3: Prop drilling → Context (strangler fig)
// ==========================================

// Step 1: Create context with same shape as props
const CheckboxContext = createContext<CheckboxContextType | null>(null);

// Step 2: Wrap top-level component
function CheckboxTreeWithContext({ initialData }: Props) {
  const [data, setData] = useState(initialData);
  const handleCheck = useCallback(/* ... */);

  return (
    <CheckboxContext.Provider value={{ data, onCheck: handleCheck }}>
      {/* Old components still receive props */}
      {/* New components use useContext */}
      <CheckboxList items={data} onCheck={handleCheck} />
    </CheckboxContext.Provider>
  );
}

// Step 3: Migrate leaf components first (bottom-up)
// Before: function CheckboxInput({ checked, onChange }: Props)
// After:
function CheckboxInput({ checked, onChange }: Props) {
  // Can use either props (backward compat) or context (new way)
  const ctx = useContext(CheckboxContext);
  const actualChecked = checked ?? ctx?.data; // Props override context
  // ...
}

// Step 4: Remove props one level at a time, bottom → top
```

**📊 Migration Strategy Comparison:**

| Strategy                  | Risk      | Duration | Best For                   |
| ------------------------- | --------- | -------- | -------------------------- |
| **Big Bang Rewrite**      | 🔴 High   | Long     | Small codebases            |
| **Strangler Fig**         | 🟢 Low    | Long     | Large codebases            |
| **Branch by Abstraction** | 🟡 Medium | Medium   | API changes                |
| **Feature Flag**          | 🟢 Low    | Medium   | Gradual rollout            |
| **Side-by-Side**          | 🟡 Medium | Medium   | State management migration |

**🤔 Follow-up questions:**

| Câu hỏi                     | Trả lời                                                                                  |
| --------------------------- | ---------------------------------------------------------------------------------------- |
| "Class to Hooks mapping?"   | "`componentDidMount` → `useEffect(fn,[])`, `setState` → `useState`, `this` → closures."  |
| "When to NOT migrate?"      | "If component works, is tested, rarely changes — don't migrate. Migration has cost."     |
| "Testing during migration?" | "Keep existing tests passing. Add new tests for hooks. Both old + new tests run in CI."  |
| "Feature flags?"            | "LaunchDarkly/unleash. `useNewCheckboxTree ? <NewTree/> : <OldTree/>`. Gradual rollout." |

---

### 31. Design System Integration (Radix / shadcn)

**💬 Cách trình bày:**

> "Don't reinvent primitives. Use Radix for accessible. Style with shadcn/Tailwind. Focus on business logic, not checkbox rendering."

```tsx
// ==========================================
// Radix UI Checkbox primitive
// ==========================================
import * as RadixCheckbox from "@radix-ui/react-checkbox";
import { CheckIcon, MinusIcon, ChevronRightIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";

interface TreeCheckboxProps {
  checked: boolean | "indeterminate";
  label: string;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}

// Radix-based checkbox with full accessibility
function TreeCheckbox({
  checked,
  label,
  onCheckedChange,
  disabled,
}: TreeCheckboxProps) {
  const id = useId();

  return (
    <div className="flex items-center gap-2">
      <RadixCheckbox.Root
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className={cn(
          "h-4 w-4 rounded border border-gray-300",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
          "data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600",
          "data-[state=indeterminate]:bg-blue-600 data-[state=indeterminate]:border-blue-600",
          "disabled:opacity-50 disabled:cursor-not-allowed",
        )}
      >
        <RadixCheckbox.Indicator className="flex items-center justify-center text-white">
          {checked === "indeterminate" ? (
            <MinusIcon className="h-3 w-3" />
          ) : (
            <CheckIcon className="h-3 w-3" />
          )}
        </RadixCheckbox.Indicator>
      </RadixCheckbox.Root>
      <label
        htmlFor={id}
        className={cn(
          "text-sm cursor-pointer select-none",
          disabled && "opacity-50 cursor-not-allowed",
        )}
      >
        {label}
      </label>
    </div>
  );
}

// ==========================================
// Radix Collapsible for expand/collapse
// ==========================================
import * as Collapsible from "@radix-ui/react-collapsible";

function TreeBranch({
  item,
  indices,
  onCheck,
  expandedIds,
  onExpand,
}: BranchProps) {
  const isExpanded = expandedIds.has(item.id);

  return (
    <li role="treeitem" aria-expanded={isExpanded}>
      <Collapsible.Root
        open={isExpanded}
        onOpenChange={() => onExpand(item.id)}
      >
        <div className="flex items-center gap-1 py-1">
          {item.children && item.children.length > 0 && (
            <Collapsible.Trigger asChild>
              <button
                className={cn(
                  "p-0.5 rounded hover:bg-gray-100 transition-transform",
                  isExpanded && "rotate-90",
                )}
                aria-label={
                  isExpanded ? `Collapse ${item.name}` : `Expand ${item.name}`
                }
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </Collapsible.Trigger>
          )}

          <TreeCheckbox
            checked={item.checked}
            label={item.name}
            onCheckedChange={(checked) => onCheck(!!checked, indices)}
          />
        </div>

        {item.children && item.children.length > 0 && (
          <Collapsible.Content className="pl-6">
            <ul role="group">
              {item.children.map((child, i) => (
                <TreeBranch
                  key={child.id}
                  item={child}
                  indices={[...indices, i]}
                  onCheck={onCheck}
                  expandedIds={expandedIds}
                  onExpand={onExpand}
                />
              ))}
            </ul>
          </Collapsible.Content>
        )}
      </Collapsible.Root>
    </li>
  );
}

// ==========================================
// shadcn/ui style command menu
// ==========================================
import {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";

function TreeCommandMenu({ actions }: { actions: ShortcutActions }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command..." />
      <CommandList>
        <CommandGroup heading="Selection">
          <CommandItem
            onSelect={() => {
              actions.checkAll();
              setOpen(false);
            }}
          >
            ✅ Select All
          </CommandItem>
          <CommandItem
            onSelect={() => {
              actions.uncheckAll();
              setOpen(false);
            }}
          >
            ❌ Deselect All
          </CommandItem>
        </CommandGroup>
        <CommandGroup heading="View">
          <CommandItem
            onSelect={() => {
              actions.expandAll();
              setOpen(false);
            }}
          >
            📂 Expand All
          </CommandItem>
          <CommandItem
            onSelect={() => {
              actions.collapseAll();
              setOpen(false);
            }}
          >
            📁 Collapse All
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
```

**📊 UI Library Comparison:**

| Library         | Accessibility | Styling  | Bundle         | Approach    |
| --------------- | ------------- | -------- | -------------- | ----------- |
| **Radix UI**    | ✅ Built-in   | Unstyled | ~5KB/component | Primitive   |
| **shadcn/ui**   | ✅ Via Radix  | Tailwind | Copy-paste     | Pre-styled  |
| **Headless UI** | ✅ Built-in   | Unstyled | ~3KB/component | Primitive   |
| **React Aria**  | ✅ Built-in   | Unstyled | ~8KB/component | Hook-based  |
| **MUI**         | ✅ Built-in   | Material | ~40KB+         | Opinionated |
| **Ant Design**  | Partial       | Ant      | ~50KB+         | Opinionated |

**🤔 Follow-up questions:**

| Câu hỏi                 | Trả lời                                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------------------ |
| "Radix vs Headless UI?" | "Radix = more components, better CSS control. Headless UI = Tailwind-focused, simpler API."      |
| "shadcn copy-paste?"    | "Not a dependency — copy components to project. Full control. Customize freely."                 |
| "React Aria vs Radix?"  | "React Aria = hooks (more flexible). Radix = components (easier). Both excellent accessibility." |
| "When to use MUI/Ant?"  | "When you want opinionated design. Enterprise dashboards. Trade customization for speed."        |

---

### 32. Micro-Frontend & Module Federation

**💬 Cách trình bày:**

> "Large organizations: checkbox tree as shared micro-frontend. Module Federation cho runtime sharing across apps. Publish as npm package hoặc remote module."

```tsx
// ==========================================
// Package structure (npm library)
// ==========================================
// @company/checkbox-tree/
// ├── src/
// │   ├── index.ts          // Public API
// │   ├── hooks/
// │   │   ├── useCheckboxTree.ts
// │   │   ├── useExpandCollapse.ts
// │   │   └── useTreeSearch.ts
// │   ├── components/
// │   │   ├── CheckboxTree.tsx
// │   │   ├── CheckboxItem.tsx
// │   │   └── CheckboxInput.tsx
// │   ├── utils/
// │   │   ├── treeOperations.ts
// │   │   └── validation.ts
// │   └── types.ts
// ├── package.json
// └── tsconfig.json

// ==========================================
// Public API (index.ts) — minimal surface area
// ==========================================
// Components
export { CheckboxTree } from "./components/CheckboxTree";
export { CheckboxItem } from "./components/CheckboxItem";

// Hooks (headless usage)
export { useCheckboxTree } from "./hooks/useCheckboxTree";
export { useExpandCollapse } from "./hooks/useExpandCollapse";
export { useTreeSearch } from "./hooks/useTreeSearch";

// Types
export type {
  CheckboxItem as CheckboxItemType,
  CheckboxTreeProps,
} from "./types";

// Utilities (for custom implementations)
export {
  updateCheckboxAndDescendants,
  resolveCheckboxStates,
  getCheckedItems,
  countNodes,
} from "./utils/treeOperations";

// ==========================================
// Module Federation (Webpack 5)
// ==========================================
// webpack.config.js — remote app (provides CheckboxTree)
// const ModuleFederationPlugin = require("webpack/lib/container/ModuleFederationPlugin");
//
// new ModuleFederationPlugin({
//   name: "checkboxTreeApp",
//   filename: "remoteEntry.js",
//   exposes: {
//     "./CheckboxTree": "./src/components/CheckboxTree",
//     "./useCheckboxTree": "./src/hooks/useCheckboxTree",
//   },
//   shared: {
//     react: { singleton: true, requiredVersion: "^18.0.0" },
//     "react-dom": { singleton: true, requiredVersion: "^18.0.0" },
//   },
// });

// Host app — consumes remote CheckboxTree
const RemoteCheckboxTree = React.lazy(
  () => import("checkboxTreeApp/CheckboxTree"),
);

function HostApp() {
  return (
    <Suspense fallback={<TreeSkeleton />}>
      <ErrorBoundary fallback={<FallbackLocalTree />}>
        <RemoteCheckboxTree data={categories} onChange={handleChange} />
      </ErrorBoundary>
    </Suspense>
  );
}

// ==========================================
// Versioning & Backward Compatibility
// ==========================================
interface CheckboxTreeProps {
  // v1 API (always supported)
  data: CheckboxItem[];
  onChange: (data: CheckboxItem[]) => void;

  // v2 additions (optional)
  /** @since 2.0.0 */
  onCheck?: (nodeId: number, checked: boolean) => void;
  /** @since 2.1.0 */
  searchable?: boolean;
  /** @since 2.2.0 */
  virtualized?: boolean;
  /** @since 2.3.0 */
  theme?: "light" | "dark" | "system";

  // Deprecated (still works, logged warning)
  /** @deprecated Use `onChange` instead. Will be removed in v4.0 */
  onUpdate?: (data: CheckboxItem[]) => void;
}

function CheckboxTree(props: CheckboxTreeProps) {
  // Deprecation warning
  useEffect(() => {
    if (props.onUpdate) {
      console.warn(
        "[@company/checkbox-tree] `onUpdate` is deprecated. Use `onChange` instead. " +
          "It will be removed in v4.0. See migration guide: https://docs.example.com/migrate",
      );
    }
  }, []);

  const onChange = props.onChange ?? props.onUpdate; // Backward compat
  // ...
}

// ==========================================
// Bundle optimization for library
// ==========================================
// package.json
// {
//   "name": "@company/checkbox-tree",
//   "version": "3.0.0",
//   "main": "dist/cjs/index.js",        // CommonJS
//   "module": "dist/esm/index.js",       // ESM (tree-shakeable)
//   "types": "dist/types/index.d.ts",    // TypeScript
//   "exports": {
//     ".": {
//       "import": "./dist/esm/index.js",
//       "require": "./dist/cjs/index.js",
//       "types": "./dist/types/index.d.ts"
//     },
//     "./hooks": {
//       "import": "./dist/esm/hooks/index.js",
//       "types": "./dist/types/hooks/index.d.ts"
//     },
//     "./utils": {
//       "import": "./dist/esm/utils/index.js",
//       "types": "./dist/types/utils/index.d.ts"
//     }
//   },
//   "sideEffects": false,
//   "peerDependencies": {
//     "react": ">=18.0.0",
//     "react-dom": ">=18.0.0"
//   }
// }
```

**📊 Distribution Approaches:**

| Approach              | Versioning  | Sharing    | Independence | Best For           |
| --------------------- | ----------- | ---------- | ------------ | ------------------ |
| **npm package**       | Semantic    | Build-time | Full         | Reusable library   |
| **Module Federation** | Runtime     | Runtime    | Partial      | Micro-frontends    |
| **Monorepo**          | Unified     | Build-time | Low          | Single org         |
| **Web Component**     | Independent | N/A        | Full         | Framework-agnostic |
| **iframe**            | Independent | N/A        | Full         | Legacy isolation   |

**🤔 Follow-up questions:**

| Câu hỏi               | Trả lời                                                                                     |
| --------------------- | ------------------------------------------------------------------------------------------- |
| "Semver strategy?"    | "Major: breaking API. Minor: new features. Patch: bug fixes. Always document CHANGELOG."    |
| "Tree-shaking?"       | "`sideEffects: false` + ESM exports. Users only bundle what they import."                   |
| "CSS strategy?"       | "CSS-in-JS (styled-components) or CSS Modules. Avoid global CSS — conflicts with host app." |
| "Peer dependencies?"  | "React as peerDep — avoids duplicate React. Host provides. Version range: `>=18.0.0`."      |
| "Testing as library?" | "Unit tests in package. Integration tests in consuming app. Publish beta first."            |

---

## BONUS: Q&A Tổng Hợp

### React Core Concepts

| Câu hỏi                       | Trả lời                                                                                        |
| ----------------------------- | ---------------------------------------------------------------------------------------------- |
| "useRef vs useState?"         | "useRef không trigger re-render. Dùng cho DOM access hoặc mutable values giữa renders."        |
| "useEffect dependency array?" | "Effect chạy lại khi dependencies thay đổi. Empty array = chỉ mount/unmount."                  |
| "Controlled vs Uncontrolled?" | "Controlled: parent owns state. Uncontrolled: component owns state với defaultValue."          |
| "Virtual DOM là gì?"          | "In-memory JS representation of real DOM. React diffs virtual trees, applies minimal changes." |
| "Reconciliation?"             | "Algorithm so sánh old vs new virtual tree. Same type = update. Different type = replace."     |
| "Fiber architecture?"         | "React 16+ internal. Enables concurrent rendering, priority scheduling, suspense."             |
| "StrictMode?"                 | "Development only. Double-renders to detect side effects. Double-invokes effects."             |
| "React.Fragment?"             | "Group children without extra DOM node. `<>...</>` shorthand. Accepts key prop (long form)."   |

### React Hooks Deep Dive

| Câu hỏi                         | Trả lời                                                                                              |
| ------------------------------- | ---------------------------------------------------------------------------------------------------- |
| "useEffect cleanup?"            | "Return function từ effect. Runs before next effect và on unmount. Clear timers, unsubscribe."       |
| "useLayoutEffect vs useEffect?" | "useLayoutEffect runs synchronously after DOM mutations, before paint. useEffect async after paint." |
| "useId()?"                      | "Generate unique ID for accessibility (htmlFor, aria-describedby). Stable across server/client."     |
| "useTransition?"                | "Mark state update as non-urgent. React keeps old UI responsive. Good cho search/filter."            |
| "useDeferredValue?"             | "Defer expensive re-renders. Similar to debounce nhưng built-in. React 18+."                         |
| "useSyncExternalStore?"         | "Subscribe to external store (non-React state). Handles concurrent mode properly."                   |
| "Custom hooks rules?"           | "Must start with 'use'. Can call other hooks. Must be at top level, not in conditions."              |

### Tree & Algorithm Concepts

| Câu hỏi                    | Trả lời                                                                                                      |
| -------------------------- | ------------------------------------------------------------------------------------------------------------ |
| "DFS vs BFS?"              | "DFS: đi sâu trước (stack/recursion). BFS: đi rộng trước (queue). DFS tự nhiên hơn cho tree."                |
| "Time complexity?"         | "O(n) visit mỗi node tối đa 1 lần cho update operations."                                                    |
| "Space complexity?"        | "O(d) với d = max depth cho recursion stack. O(n) cho clone."                                                |
| "Pre-order vs Post-order?" | "Pre: process trước, recurse sau (DOWN propagation). Post: recurse trước, process sau (UP propagation)."     |
| "Tree balancing?"          | "Không cần cho checkbox tree. Balancing for BST search optimization. UI trees naturally balanced by design." |
| "N-ary vs Binary tree?"    | "Checkbox = N-ary (any number of children). Binary = max 2 children. Same traversal concepts."               |

### JavaScript Advanced

| Câu hỏi                          | Trả lời                                                                                 |
| -------------------------------- | --------------------------------------------------------------------------------------- |
| "structuredClone vs JSON.parse?" | "structuredClone handles more types, native. JSON faster nhưng limited."                |
| "Array.prototype.reduce?"        | "Accumulate values. `reduce((acc, item) => acc + item, 0)`. Single pass."               |
| "Optional chaining ?.?"          | "Short-circuit nếu null/undefined. `obj?.children?.length`."                            |
| "Nullish coalescing ???"         | "`value ?? default`. Chỉ fallback khi null/undefined (not 0 or '')."                    |
| "WeakMap/WeakSet?"               | "Keys are weakly held. GC can collect. Good cho metadata caching without memory leaks." |
| "Proxy?"                         | "Intercept object operations (get, set, delete). Immer dùng Proxy internally."          |
| "Generator functions?"           | "yield pauses execution. `function*`. Useful cho lazy iteration over tree nodes."       |

### TypeScript Essentials

| Câu hỏi                         | Trả lời                                                                                                         |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| "Generic components?"           | "`function List<T>({ items }: { items: T[] })`. Reusable with any type."                                        |
| "Discriminated unions?"         | "Union với common literal property. TS narrows based on discriminator."                                         |
| "Type vs Interface?"            | "Interface: extend, merge, classes. Type: unions, intersections, mapped. Interface for objects, type for rest." |
| "Utility types?"                | "`Partial<T>`, `Required<T>`, `Pick<T,K>`, `Omit<T,K>`, `Record<K,V>`. Built-in transformations."               |
| "Type assertion vs Type guard?" | "Assertion: `as Type` (trust me). Guard: `if (isX(value))` (runtime check). Guards are safer."                  |

### Performance & Architecture

| Câu hỏi                         | Trả lời                                                                                       |
| ------------------------------- | --------------------------------------------------------------------------------------------- |
| "Code splitting?"               | "`React.lazy` + `Suspense`. Load components on demand. Reduce initial bundle."                |
| "Error boundaries?"             | "Class component with `componentDidCatch`. Catch errors in render tree. Show fallback UI."    |
| "Render props vs HOC vs Hooks?" | "Hooks replaced both. Render props for flexibility. HOC for legacy. Hooks = modern standard." |
| "Server Components?"            | "React 19. Run on server, zero client JS. Good cho static tree rendering."                    |
| "Suspense for data?"            | "Show fallback while data loads. Combined with React.lazy, use() hook, or data libraries."    |
| "Concurrent features?"          | "startTransition, useDeferredValue, Suspense. Keep UI responsive during expensive updates."   |

---

_Cập nhật: Tháng 2, 2026_
