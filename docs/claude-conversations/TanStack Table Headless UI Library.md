# TanStack Table: Headless UI Library

## You

Introduction
TanStack Table is a Headless UI library for building powerful tables & datagrids for TS/JS, React, Vue, Solid, Qwik, and Svelte.
What is "headless" UI?
Headless UI is a term for libraries and utilities that provide the logic, state, processing and API for UI elements and interactions, but do not provide markup, styles, or pre-built implementations. Scratching your head yet? 😉 Headless UI has a few main goals:
The hardest parts of building complex UIs usually revolve around state, events, side-effects, data computation/management. By removing these concerns from the markup, styles and implementation details, our logic and components can be more modular and reusable.
Building UI is a very branded and custom experience, even if that means choosing a design system or adhering to a design spec. To support this custom experience, component-based UI libraries need to support a massive (and seemingly endless) API surface around markup and style customization. Headless UI libraries decouple your logic from your UI
When you use a headless UI library, the complex task of data-processing, state-management, and business logic are handled for you, leaving you to worry about higher-cardinality decisions that differ across implementations and use cases.
Want to dive deeper? Read more about Headless UI.
Component-based libraries vs Headless libraries
In the ecosystem of table/datagrid libraries, there are two main categories:
* Component-based table libraries
* Headless table libraries
Which kind of table library should I use?
Each approach has subtle tradeoffs. Understanding these subtleties will help you make the right decision for your application and team.
Component-based Table Libraries
Component-based table libraries will typically supply you with a feature-rich drop-in solution and ready-to-use components/markup complete with styles/theming. AG Grid is a great example of this type of table library.
Pros:
* Ship with ready-to-use markup/styles
* Little setup required
* Turn-key experience
Cons:
* Less control over markup
* Custom styles are typically theme-based
* Larger bundle-sizes
* Highly coupled to framework adapters and platforms
If you want a ready-to-use table and design/bundle-size are not hard requirements, then you should consider using a component-based table library.
There are a lot of component-based table libraries out there, but we believe AG Grid is the gold standard and is by far our favorite grid-sibling (don't tell the others 🤫).
Headless Table Libraries
Headless table libraries will typically supply you with functions, state, utilities and event listeners to build your own table markup or attach to existing table markups.
Pros:
* Full control over markup and styles
* Supports all styling patterns (CSS, CSS-in-JS, UI libraries, etc)
* Smaller bundle-sizes
* Portable. Run anywhere JS runs!
Cons:
* More setup required
* No markup, styles or themes provided
If you want a lighter-weight table or full control over the design, then you should consider using a headless table library.
There are very few headless table libraries out there and obviously, TanStack Table is our favorite!

## You

Overview
TanStack Table's core is framework agnostic, which means its API is the same regardless of the framework you're using. Adapters are provided to make working with the table core easier depending on your framework. See the Adapters menu for available adapters.
Typescript
While TanStack Table is written in TypeScript, using TypeScript in your application is optional (but recommended as it comes with outstanding benefits to both you and your codebase)
Headless
As it was mentioned extensively in the Intro section, TanStack Table is headless. This means that it doesn't render any DOM elements, and instead relies on you, the UI/UX developer to provide the table's markup and styles. This is a great way to build a table that can be used in any UI framework, including React, Vue, Solid, Svelte, Qwik, and even JS-to-native platforms like React Native!
Core Objects and Types
The table core uses the following abstractions, commonly exposed by adapters:
* Column Defs
   * Objects used to configure a column and its data model, display templates, and more
* Table
   * The core table object containing both state and API
* Table Data
   * The core data array you provide the table
* Columns
   * Each column mirrors its respective column def and also provides column-specific APIs
* Rows
   * Each row mirrors its respective row data and provides row-specific APIs
* Header Groups
   * Header groups are computed slices of nested header levels, each containing a group of headers
* Headers
   * Each header is either directly associated with or derived from its column def and provides header-specific APIs
* Cells
   * Each cell mirrors its respective row-column intersection and provides cell-specific APIs
There are even more structures that pertain to specific features like filtering, sorting, grouping, etc, which you can find in the features section.

## Claude


# 📊 TanStack Table: Deep Dive Analysis - Headless UI Library Revolution


## 🎯 1. TÓM TẮT CHÍNH


**TanStack Table** là một **headless UI library** chuyên về xây dựng table và datagrid cho các framework JS/TS phổ biến. Thay vì cung cấp UI components sẵn có, nó chỉ cung cấp **logic, state management và API** - để developer tự build markup và styling theo ý muốn.


**Tại sao quan trọng?** Vì table/datagrid là một trong những components phức tạp nhất trong web development, đòi hỏi xử lý sorting, filtering, pagination, virtualization... TanStack Table giải quyết phần "não bộ" phức tạp nhất, để developer focus vào UI/UX.


---


## 🔍 2. KHÁI NIỆM CỐT LÕI


### 🧠 Headless UI - "Não bộ không có thân thể"


```typescript
// Ví dụ minh họa concept:
// ❌ Component-based (như Ant Design Table)
<Table dataSource={data} columns={columns} />
// Bạn get ra cái table đã styling sẵn, nhưng khó customize

// ✅ Headless (như TanStack Table)
const table = useReactTable({
  data,
  columns,
  // Logic xử lý được handle internally
})
// Bạn tự build markup, nhưng logic đã được xử lý
```


### 📚 Core Concepts:


- **Table Instance**: Object chứa toàn bộ state và methods của table
- **Column Definition**: Cấu trúc define cách hiển thị và xử lý data cho từng cột
- **Row Model**: Cách data được organize và render (flat, grouped, tree...)
- **Features**: Các tính năng như sorting, filtering, pagination... có thể enable/disable


---


## 💡 3. HIỂU BẢN CHẤT


### 🎯 Pain Points được giải quyết:


1. **Flexibility vs Functionality Trade-off**: Component libraries thường force bạn choose giữa "dễ dùng nhưng khó customize" vs "flexible nhưng phải code everything from scratch"
2. **Bundle Size Bloat**: Component libraries thường ship cả kitchen sink, dù bạn chỉ cần basic features
3. **Styling Constraints**: Theme-based styling rất limited khi design yêu cầu unique look


### ⚙️ Cơ chế hoạt động:


```typescript
// TanStack Table core workflow:
1. Bạn provide: data + column definitions
2. Library xử lý: state management, data transformation, event handling
3. Bạn consume: processed data để render custom UI

// Ví dụ mental model:
const yourData = [/*...*/] // Input
    ↓
[TanStack Table Magic] // Processing layer
    ↓
const tableAPI = useReactTable() // Output interface
    ↓
<YourCustomTableUI /> // Your responsibility
```


### 🤔 Tại sao choose approach này?


- **Separation of Concerns**: Logic tách biệt với Presentation
- **Framework Agnostic**: Cùng một core logic, support nhiều framework
- **Performance**: Tree-shaking friendly, chỉ bundle features bạn actually dùng


---


## 🛠️ 4. CODE EXAMPLES THỰC TẾ


---


## 🔄 5. SO SÁNH & PHÂN BIỆT


### 📊 Component-based vs Headless Comparison Table:


```
Tiêu chíComponent-based (AG Grid)Headless (TanStack Table)🚀 Setup Time⭐⭐⭐⭐⭐ Instant⭐⭐⭐ Moderate🎨 Customization⭐⭐ Theme-limited⭐⭐⭐⭐⭐ Full control📦 Bundle Size⭐⭐ Large (500KB+)⭐⭐⭐⭐⭐ Small (50KB)🔧 Maintenance⭐⭐⭐⭐ Vendor-dependent⭐⭐⭐ Self-maintained💰 Cost⭐⭐ Paid license⭐⭐⭐⭐⭐ Free
```


### 🎯 Khi nào nên chọn approach nào?


**✅ Chọn TanStack Table khi:**


- Design system riêng, cần full control styling
- Performance critical (mobile, large datasets)
- Team có sufficient frontend expertise
- Budget constraints (open source preference)
- Multi-framework support needed


**✅ Chọn Component-based khi:**


- Prototype nhanh, time-to-market priority
- Team ít frontend experience
- Standard business application
- Enterprise features out-of-box (Excel export, advanced filtering...)


---


## 🎯 6. BEST PRACTICES


### ⚡ Performance Optimization:


```typescript
// ✅ DO: Memoize column definitions
const columns = useMemo(() => [
  // Column definitions
], []); // Empty dependency - chỉ tạo một lần

// ❌ DON'T: Recreate columns mỗi render
const columns = [
  // Sẽ cause unnecessary re-renders
];

// ✅ DO: Use column sizing properly
columnHelper.accessor('description', {
  size: 300,        // Fixed width
  minSize: 200,     // Minimum width
  maxSize: 500,     // Maximum width
});

// ✅ DO: Implement virtualization cho large datasets
import { useVirtualizer } from '@tanstack/react-virtual';

const rowVirtualizer = useVirtualizer({
  count: table.getRowModel().rows.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 50, // Row height
});
```


### 🔐 Type Safety Best Practices:


```typescript
// ✅ DO: Strongly type your data structure
interface User {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
}

// ✅ DO: Use typed column helper
const columnHelper = createColumnHelper<User>();

// ✅ DO: Type your custom cell components
interface CustomCellProps {
  getValue: () => unknown;
  row: { original: User };
}

const CustomCell: React.FC<CustomCellProps> = ({ getValue, row }) => {
  // TypeScript sẽ enforce correct typing
};
```


### 🚨 Common Mistakes to Avoid:


```typescript
// ❌ DON'T: Mutate original data
const handleEdit = (rowIndex: number, newValue: string) => {
  data[rowIndex].name = newValue; // Causes React warnings
};

// ✅ DO: Create new data array
const handleEdit = (rowIndex: number, newValue: string) => {
  const newData = data.map((item, index) =>
    index === rowIndex ? { ...item, name: newValue } : item
  );
  setData(newData);
};

// ❌ DON'T: Complex logic inside cell render
cell: info => {
  // Heavy computation here - runs on every render
  const complexValue = expensiveCalculation(info.getValue());
  return <span>{complexValue}</span>;
}

// ✅ DO: Pre-compute or memoize expensive operations
cell: info => {
  const memoizedValue = useMemo(
    () => expensiveCalculation(info.getValue()),
    [info.getValue()]
  );
  return <span>{memoizedValue}</span>;
}
```


---


## 🚀 7. ỨNG DỤNG THỰC TẾ


### 💼 Real-world Use Cases:


**🏢 Enterprise Dashboards:**


- Financial reports với complex aggregations
- Real-time monitoring tables với live updates
- User management systems với role-based actions


**📱 E-commerce Platforms:**


- Product catalog với filtering/sorting
- Order management với status tracking
- Inventory management với bulk operations


**📊 Data Analytics Tools:**


- Interactive data exploration tables
- Custom dashboard builders
- Report generation với export capabilities


### 🔗 Framework Integration Examples:


```typescript
// 🔥 Next.js App Router integration
'use client';
import { useReactTable } from '@tanstack/react-table';

export default function DataTable({ initialData }: { initialData: User[] }) {
  // Server-side data được pass vào, client-side interactivity
  const table = useReactTable({
    data: initialData,
    // ...config
  });
}

// 🌊 Remix integration với loader
export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const page = url.searchParams.get('page') || '1';

  // Server-side pagination
  const data = await fetchPaginatedData(parseInt(page));
  return json({ data });
};

// ⚛️ React Query integration cho server state
const {
  data,
  isLoading,
  error
} = useQuery({
  queryKey: ['users', sorting, filtering, pagination],
  queryFn: () => fetchUsers({ sorting, filtering, pagination }),
  keepPreviousData: true, // Smooth UX during refetch
});
```


### 📈 Scalability Considerations:


```typescript
// 🚀 Large Dataset Handling
const table = useReactTable({
  data,
  columns,
  // Server-side operations cho datasets > 10k rows
  manualPagination: true,
  manualSorting: true,
  manualFiltering: true,

  // State management
  state: {
    pagination: serverPagination,
    sorting: serverSorting,
    columnFilters: serverFilters,
  },

  // Callbacks sync với server
  onPaginationChange: setSeverPagination,
  onSortingChange: setServerSorting,
  onColumnFiltersChange: setServerFilters,
});

// 🎯 Virtual scrolling cho performance
import { useVirtualizer } from '@tanstack/react-virtual';

const tableContainerRef = useRef<HTMLDivElement>(null);

const rowVirtualizer = useVirtualizer({
  count: table.getRowModel().rows.length,
  getScrollElement: () => tableContainerRef.current,
  estimateSize: () => 50,
  overscan: 10, // Render extra rows for smooth scrolling
});
```


---


## 📚 8. KIẾN THỨC LIÊN QUAN


### 🎯 Prerequisites cần biết:


**🔥 Core React Concepts:**


- Hooks (useState, useEffect, useMemo, useCallback)
- Component composition patterns
- State management best practices
- TypeScript với React


**📊 Data Management:**


- Array manipulation methods (map, filter, reduce, sort)
- Immutable data patterns
- Server state vs Client state concepts
- API integration patterns


### 🚀 Advanced Topics để explore tiếp:


**⚡ Performance Optimization:**


- React.memo và useMemo strategies
- Virtual scrolling implementations
- Code splitting cho large table features
- Web Workers cho heavy computations


**🔧 Advanced Features:**


- Custom sorting algorithms
- Complex filtering logic
- Grouping và aggregation
- Drag & drop row reordering
- Inline editing implementations


**🌐 Ecosystem Integration:**


- React Query/SWR cho server state
- Zustand/Redux cho complex state management
- React Hook Form cho inline editing
- React DnD cho drag & drop features


### 🔗 Related Technologies:


```typescript
// 📊 Data fetching libraries
import { useQuery } from '@tanstack/react-query';
import useSWR from 'swr';

// 🎨 UI component libraries
import { Table } from '@/components/ui/table'; // shadcn/ui
import { DataTable } from '@mantine/core';

// 📱 Mobile-first approaches
import { FixedSizeList } from 'react-window';
import { AgGridReact } from 'ag-grid-react';

// 🔄 State management
import { create } from 'zustand';
import { useStore } from 'react-redux';
```


---


## 💼 9. INTERVIEW PERSPECTIVE


### 🎯 Câu hỏi Interview thường gặp:


**Q1: "Sự khác biệt giữa headless UI và component-based UI libraries là gì?"**


**💡 Professional Answer:**


```
"Headless UI libraries như TanStack Table chỉ cung cấp logic và state management,
không include styling hay markup. Điều này cho phép complete control over UI/UX
nhưng require more setup time.

Component-based libraries như AG Grid provide complete solutions với styling
và components sẵn có, faster setup nhưng limited customization options.

Choice depends on project requirements: headless cho custom designs,
component-based cho rapid prototyping."
```


**Q2: "Làm thế nào để optimize performance cho table với large datasets?"**


**💡 Technical Answer:**


```typescript
// Multiple strategies:

1. **Virtualization**: Chỉ render visible rows
const rowVirtualizer = useVirtualizer({
  count: data.length,
  estimateSize: () => 50,
});

2. **Server-side operations**: Pagination, sorting, filtering ở backend
const table = useReactTable({
  manualPagination: true,
  manualSorting: true,
});

3. **Memoization**: Prevent unnecessary re-renders
const columns = useMemo(() => columnDefs, []);

4. **Debouncing**: Cho search inputs
const debouncedSearch = useDebounce(searchTerm, 300);
```


**Q3: "Khi nào nên choose TanStack Table over alternatives?"**


**💡 Strategic Answer:**


```
"Choose TanStack Table khi:
- Custom design requirements không fit với existing component libraries
- Performance critical applications (mobile, large datasets)
- Multi-framework support needed (React, Vue, Svelte...)
- Team có sufficient frontend expertise để handle custom implementation
- Budget constraints (open source vs licensed solutions)

Avoid when: tight timeline, prototype phase, standard business requirements,
limited frontend resources."
```


### 🌟 Điểm cộng khi demonstrate knowledge:


```typescript
// 🎯 Show advanced understanding
const table = useReactTable({
  // Demonstrate knowledge of features
  enableRowSelection: true,
  enableMultiRowSelection: true,
  enableSubRowSelection: false,

  // Show performance awareness
  getRowId: (row) => row.id, // Stable row IDs

  // Demonstrate state management
  state: {
    rowSelection,
    sorting,
    columnFilters,
    globalFilter,
  },

  // Show callback handling
  onRowSelectionChange: setRowSelection,
  onSortingChange: setSorting,
});

// 🔥 Mention advanced patterns
"Tôi cũng có experience với compound patterns như:
- Server-side operations với React Query integration
- Custom column types với reusable cell components
- Advanced filtering với custom filter functions
- Drag & drop reordering với React DnD
- Export functionality với custom formatters"
```


---


## 🎯 Key Takeaways cho Interview Success:


✅ **Understand the trade-offs** - không có silver bullet solution

✅ **Performance considerations** - show awareness of real-world constraints

✅ **Practical experience** - mention specific implementation challenges solved

✅ **Architecture thinking** - how this fits into larger application architecture

✅ **User experience focus** - not just technical implementation but UX impact


### 🚀 Follow-up Questions để show expertise:


- "How would you handle real-time updates trong table data?"
- "What's your approach to testing complex table interactions?"
- "How do you ensure accessibility compliance trong custom table implementations?"
- "What's your strategy for mobile-responsive table designs?"


---


**💡 Final Pro Tip:** Always relate technical decisions back to business impact và user experience. Interviewers want to see that you understand not just *how* to implement, but *why* certain choices make sense trong different contexts!


## Claude


# 🏗️ TanStack Table Core Architecture - Deep Dive Analysis


## 🎯 1. TÓM TẮT CHÍNH


**TanStack Table Core** là **framework-agnostic engine** cung cấp table logic thuần túy, không phụ thuộc vào bất kỳ UI framework nào. Nó define một bộ **core abstractions** (Column Defs, Table, Rows, Cells...) để represent table state và behavior.


**Tại sao quan trọng?** Đây là foundation cho việc xây dựng consistent table experience across multiple frameworks (React, Vue, Svelte...) mà không cần rewrite logic mỗi lần chuyển đổi platform.


---


## 🔍 2. KHÁI NIỆM CỐT LÕI


### 🧠 Framework Agnostic Architecture


```typescript
// ❓ Nghĩa là gì?
// Core logic được viết bằng pure JavaScript/TypeScript
// Không dependency vào React, Vue, Angular hay framework nào

// 🎯 Mental Model:
Core Engine (JS/TS)
    ↓
Framework Adapters (React/Vue/Svelte)
    ↓
Your Application Components
```


### 📊 Core Objects Hierarchy:


**🏗️ Column Definitions (Column Defs):**


- **Định nghĩa:** Blueprint của một column - structure, data access, formatting
- **Tương tự:** Như table schema trong database, define cách data được organize


**🎯 Table Instance:**


- **Định nghĩa:** Central controller chứa toàn bộ state và methods của table
- **Tương tự:** Như Redux store, nhưng chỉ cho table specific


**📋 Table Data:**


- **Định nghĩa:** Raw data array bạn feed vào table
- **Tương tự:** Như props data trong React components


**📑 Rows & Cells:**


- **Định nghĩa:** Processed representations của data với additional APIs
- **Tương tự:** Như virtual DOM nodes, nhưng cho table structure


### 🔄 Headless Nature Deep Dive:


```typescript
// ❌ Traditional Component Library:
<AgGridReact
  columnDefs={columns}
  rowData={data}
/>
// → Outputs complete DOM with styling

// ✅ Headless Approach:
const table = createTable({
  columns,
  data
});
// → Returns state + methods, bạn tự render UI
```


---


## 💡 3. HIỂU BẢN CHẤT


### 🎯 Pain Points được Solve:


**🔄 Framework Lock-in Problem:**


```typescript
// Trước khi có headless approach:
// Team dùng React → AgGrid React
// Team chuyển Vue → Phải học lại AgGrid Vue
// Team thêm React Native → Không compatible

// Với TanStack Table:
// Same logic across platforms
import { createColumnHelper } from '@tanstack/table-core'
// Works in React, Vue, Svelte, React Native...
```


**🎨 Styling Limitations:**


```css
/* Traditional component library */
.ag-grid-theme-alpine {
  /* Bị limited bởi predefined themes */
  /* Hard to customize cho brand-specific design */
}

/* Headless approach */
.my-custom-table {
  /* Complete freedom - design exactly như muốn */
  /* No CSS conflicts với library styles */
}
```


### ⚙️ Underlying Mechanism:


```typescript
// 🧠 Core logic flow:
1. Data Input → Core Engine processes
2. State Management → Immutable updates
3. API Surface → Framework adapters consume
4. UI Rendering → Your responsibility

// 🔄 State flow example:
const coreTable = {
  // Pure state management
  getState: () => currentState,
  setState: (updater) => immutableUpdate(currentState),

  // Pure computations
  getRowModel: () => processedRows,
  getHeaderGroups: () => computedHeaders,

  // Event handlers
  handleSort: (columnId) => updateSortState(columnId)
};
```


### 🤔 Tại sao Choose Architecture này?


**📈 Scalability:** One codebase → Multiple platforms

**🔧 Maintainability:** Bug fixes benefit all frameworks

**🎨 Flexibility:** UI/UX freedom không bị constraint

**📦 Bundle Size:** Tree-shake unused features per platform


---


## 🛠️ 4. CODE EXAMPLES THỰC TẾ


## 🔄 5. SO SÁNH & PHÂN BIỆT


### 📊 Architecture Approaches Comparison:


```
AspectMonolithic ComponentFramework-SpecificFramework-Agnostic Core🏗️ ArchitectureAll-in-one packageSeparate per frameworkCore + Adapters📦 Code Reuse⭐ None⭐⭐ Limited⭐⭐⭐⭐⭐ Maximum🔧 Maintenance⭐⭐ High effort⭐⭐⭐ Moderate⭐⭐⭐⭐⭐ Centralized🚀 Performance⭐⭐⭐ Heavy⭐⭐⭐⭐ Optimized⭐⭐⭐⭐⭐ Tree-shakable🎨 Customization⭐⭐ Theme-bound⭐⭐⭐ Framework-limited⭐⭐⭐⭐⭐ Complete freedom
```


### 🎯 Core Objects Deep Comparison:


```typescript
// 🏗️ Column Definitions - Blueprint layer
const columnDef = {
  // Data access strategy
  accessor: 'name',           // Simple field access
  accessorFn: row => row.fullName, // Custom accessor function

  // Display strategy
  header: 'Employee Name',    // Static header
  header: ({ column }) => <CustomHeader />, // Dynamic header

  // Cell rendering strategy
  cell: ({ getValue }) => getValue(), // Simple display
  cell: ({ row, getValue }) => <CustomCell />, // Complex rendering
};

// vs Traditional Component Library approach:
<Column field="name" header="Employee Name" />
// Less flexible, predefined patterns only
```


### 🔄 State Management Paradigms:


```typescript
// ❌ Traditional Approach - Framework Coupled
class AgGridReact extends Component {
  constructor(props) {
    this.state = { sortModel: [], filterModel: {} };
    // State tightly coupled với React lifecycle
  }
}

// ✅ TanStack Approach - Framework Agnostic
const coreTable = createTable({
  // State management là pure functions
  getState: () => state,
  setState: (updater) => immutableUpdate(state),
  // Logic hoàn toàn independent từ framework
});

// Framework adapter chỉ là thin wrapper
function useReactTable(options) {
  const [state, setState] = useState();
  return createTable({ ...options, state, setState });
}
```


### 🤔 Khi nào choose từng approach?


**✅ Choose Framework-Agnostic Core khi:**


- Multi-platform projects (React + React Native + Vue admin panel)
- Long-term maintenance concerns
- Custom design requirements
- Performance critical applications
- Team có experience với multiple frameworks


**❌ Tránh khi:**


- Prototype phase (cần speed over flexibility)
- Single framework projects với limited timeline
- Team thiếu experience với headless concepts
- Requirements rất basic, không cần customization


---


## 🎯 6. BEST PRACTICES


### ⚡ Core Object Optimization:


```typescript
// ✅ DO: Memoize column definitions properly
const columns = useMemo(() => [
  columnHelper.accessor('name', {
    // Column definition content
  })
], []); // Empty deps - columns structure stable

// ❌ DON'T: Recreate column objects every render
const columns = [
  columnHelper.accessor('name', {
    // Causes unnecessary table rebuilds
  })
];

// ✅ DO: Use stable accessor functions
const nameAccessor = useCallback((row: Employee) =>
  `${row.firstName} ${row.lastName}`, []);

const columns = useMemo(() => [
  columnHelper.accessor(nameAccessor, {
    id: 'fullName', // Stable ID required for custom accessors
  })
], [nameAccessor]);
```


### 🏗️ Type Safety Best Practices:


```typescript
// ✅ DO: Strongly type your data model
interface Employee {
  readonly id: number;
  readonly name: string;
  readonly department: Department;
  readonly salary: number;
  readonly hireDate: Date;
}

// ✅ DO: Use typed column helper
const columnHelper = createColumnHelper<Employee>();

// ✅ DO: Type custom cell components
interface CustomCellProps {
  getValue: () => unknown;
  row: { original: Employee };
  table: Table<Employee>;
}

// ❌ DON'T: Use 'any' types
const badColumn = columnHelper.accessor('someField' as any, {
  cell: (info: any) => info.getValue(), // Loses all type safety
});
```


### 🔧 State Management Best Practices:


```typescript
// ✅ DO: Separate server state from client state
const table = useReactTable({
  data: serverData, // Server state - from React Query/SWR

  // Client state - local table interactions
  state: {
    sorting: clientSorting,
    columnFilters: clientFilters,
    columnVisibility: clientVisibility,
  },

  // Server state management
  manualPagination: true, // Pagination handled by server
  manualSorting: false,   // Sorting handled by client
});

// ✅ DO: Implement proper error boundaries
const TableWithErrorBoundary = () => (
  <ErrorBoundary fallback={<TableErrorFallback />}>
    <DataTable />
  </ErrorBoundary>
);
```


### 🚨 Common Mistakes to Avoid:


```typescript
// ❌ DON'T: Mutate row data directly
const handleEdit = (rowIndex: number, newValue: string) => {
  // Direct mutation breaks React's reconciliation
  data[rowIndex].name = newValue;
  forceUpdate(); // Anti-pattern!
};

// ✅ DO: Create new data reference
const handleEdit = (rowIndex: number, newValue: string) => {
  const newData = data.map((item, index) =>
    index === rowIndex
      ? { ...item, name: newValue }
      : item
  );
  setData(newData);
};

// ❌ DON'T: Create columns inside render
function BadTable() {
  const table = useReactTable({
    data,
    columns: [ // Recreated every render!
      columnHelper.accessor('name', { /* ... */ })
    ],
  });
}

// ✅ DO: Define columns outside component or memoize
const COLUMNS = [
  columnHelper.accessor('name', { /* ... */ })
];

function GoodTable() {
  const table = useReactTable({
    data,
    columns: COLUMNS, // Stable reference
  });
}
```


### 🏃‍♂️ Performance Considerations:


```typescript
// ✅ DO: Implement virtualization cho large datasets
import { useVirtualizer } from '@tanstack/react-virtual';

const rowVirtualizer = useVirtualizer({
  count: table.getRowModel().rows.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 50,
  overscan: 5, // Render extra rows for smooth scrolling
});

// ✅ DO: Use getRowId cho stable row identity
const table = useReactTable({
  data,
  columns,
  getRowId: (row, index) => row.id ?? index, // Stable row identification
});

// ✅ DO: Debounce expensive operations
const debouncedGlobalFilter = useDebounce(globalFilter, 300);

useEffect(() => {
  table.setGlobalFilter(debouncedGlobalFilter);
}, [debouncedGlobalFilter]);
```


---


## 🚀 7. ỨNG DỤNG THỰC TẾ


### 💼 Real-world Use Cases:


**🏢 Enterprise Admin Dashboards:**


```typescript
// Multi-tenant platform với different frameworks
// React admin panel
const AdminTable = () => {
  const table = useReactTable({
    data: tenantData,
    columns: adminColumns,
    enableRowSelection: true,
    enableMultiRowSelection: true,
  });
};

// Vue.js customer portal - cùng core logic!
const CustomerTable = () => {
  const table = useVueTable({
    data: customerData,
    columns: customerColumns, // Different UI, same logic
  });
};
```


**📱 Cross-Platform Applications:**


```typescript
// React Native mobile app
import { createTable } from '@tanstack/table-core';

const MobileTable = () => {
  const table = createTable({
    data: mobileData,
    columns: mobileColumns,
  });

  return (
    <FlatList
      data={table.getRowModel().rows}
      renderItem={({ item: row }) => (
        <MobileTableRow row={row} />
      )}
    />
  );
};

// Next.js web app - shared business logic
const WebTable = () => {
  const table = useReactTable({
    data: webData,
    columns: webColumns, // Same column definitions!
  });
};
```


### 🔗 Framework Integration Patterns:


```typescript
// 🔥 Next.js App Router với Server Components
// app/users/page.tsx
async function UsersPage() {
  const users = await fetchUsers(); // Server-side data fetching

  return (
    <div>
      <h1>Users Management</h1>
      <ClientTable initialData={users} />
    </div>
  );
}

// app/users/client-table.tsx
'use client';
import { useReactTable } from '@tanstack/react-table';

function ClientTable({ initialData }: { initialData: User[] }) {
  const [data, setData] = useState(initialData);

  const table = useReactTable({
    data,
    columns: userColumns,
    // Client-side interactivity
  });

  return <TableRenderer table={table} />;
}

// 🌊 SvelteKit integration
// src/routes/products/+page.svelte
<script lang="ts">
  import { createSvelteTable } from '@tanstack/svelte-table';

  export let data; // From +page.server.ts

  const table = createSvelteTable({
    data: data.products,
    columns: productColumns,
    getCoreRowModel: getCoreRowModel(),
  });
</script>

<!-- Svelte template -->
{#each $table.getHeaderGroups() as headerGroup}
  <tr>
    {#each headerGroup.headers as header}
      <th>{header.column.columnDef.header}</th>
    {/each}
  </tr>
{/each}
```


### 📈 Scalability Patterns:


```typescript
// 🚀 Micro-frontend Architecture
// Host application
class TableHostApp {
  private tableCore: TableCore<any>;

  constructor() {
    this.tableCore = createTable({
      // Core configuration
    });
  }

  // Expose table API to micro-frontends
  getTableAPI() {
    return {
      getState: () => this.tableCore.getState(),
      getRowModel: () => this.tableCore.getRowModel(),
      // ... other methods
    };
  }
}

// React micro-frontend
const ReactMicroFE = () => {
  const tableAPI = useTableAPI(); // Injected from host

  return (
    <div>
      {tableAPI.getRowModel().rows.map(row => (
        <ReactTableRow key={row.id} row={row} />
      ))}
    </div>
  );
};

// Vue micro-frontend - cùng API!
const VueMicroFE = defineComponent({
  setup() {
    const tableAPI = inject('tableAPI');

    return () => (
      <div>
        {tableAPI.getRowModel().rows.map(row => (
          <VueTableRow key={row.id} row={row} />
        ))}
      </div>
    );
  },
});
```


### 🔄 State Synchronization Patterns:


```typescript
// 🌐 Multi-instance synchronization
class TableStateManager {
  private instances = new Map<string, TableInstance>();
  private globalState = new BehaviorSubject({});

  registerTable(id: string, table: TableInstance) {
    this.instances.set(id, table);

    // Sync state changes
    table.subscribeToStateChanges((newState) => {
      this.broadcastStateChange(id, newState);
    });
  }

  private broadcastStateChange(sourceId: string, newState: any) {
    this.instances.forEach((table, id) => {
      if (id !== sourceId) {
        table.setState(newState); // Sync across instances
      }
    });
  }
}

// Usage in different parts of application
const masterTable = useReactTable({ /* config */ });
const slaveTable1 = useReactTable({ /* config */ });
const slaveTable2 = useVueTable({ /* config */ });

tableStateManager.registerTable('master', masterTable);
tableStateManager.registerTable('slave1', slaveTable1);
tableStateManager.registerTable('slave2', slaveTable2);
```


---


## 📚 8. KIẾN THỨC LIÊN QUAN


### 🎯 Prerequisites cần nắm vững:


**🔥 Core JavaScript/TypeScript:**


```typescript
// Functional programming concepts
const immutableUpdate = (state, updater) => ({
  ...state,
  ...updater(state)
});

// Generic types và constraints
interface TableOptions<T extends Record<string, any>> {
  data: T[];
  columns: ColumnDef<T>[];
}

// Higher-order functions
const createColumnHelper = <T>() => ({
  accessor: <K extends keyof T>(key: K) => ({ id: key, accessor: key }),
});
```


**📊 Data Structures & Algorithms:**


```typescript
// Tree structures (cho nested headers)
interface HeaderTree {
  id: string;
  children?: HeaderTree[];
  parent?: HeaderTree;
  depth: number;
}

// Efficient sorting algorithms understanding
const multiColumnSort = (rows, sortSpecs) => {
  return rows.sort((a, b) => {
    for (const { id, desc } of sortSpecs) {
      const aVal = a.getValue(id);
      const bVal = b.getValue(id);

      if (aVal !== bVal) {
        return desc ? bVal - aVal : aVal - bVal;
      }
    }
    return 0;
  });
};
```


### 🚀 Advanced Topics để khám phá:


**⚡ Performance Optimization:**


```typescript
// Virtual scrolling implementation details
class VirtualScrollManager {
  private visibleRange = { start: 0, end: 0 };
  private itemHeight = 50;
  private containerHeight = 400;

  calculateVisibleRange(scrollTop: number) {
    const start = Math.floor(scrollTop / this.itemHeight);
    const visibleCount = Math.ceil(this.containerHeight / this.itemHeight);

    return {
      start: Math.max(0, start - 5), // Overscan
      end: Math.min(this.totalItems, start + visibleCount + 5)
    };
  }
}

// Memoization strategies
const memoizeColumnCalculations = () => {
  const cache = new Map();

  return (columnId: string, data: any[]) => {
    const key = `${columnId}-${data.length}`;
    if (cache.has(key)) return cache.get(key);

    const result = expensiveColumnCalculation(columnId, data);
    cache.set(key, result);
    return result;
  };
};
```


**🧠 Advanced Architecture Patterns:**


```typescript
// Plugin architecture for features
interface TablePlugin<T> {
  name: string;
  initialize(table: Table<T>): void;
  destroy(table: Table<T>): void;
}

class SortingPlugin<T> implements TablePlugin<T> {
  initialize(table: Table<T>) {
    table.addFeature('sorting', {
      getSortedRowModel: () => this.computeSortedRows(table),
      toggleSorting: (columnId) => this.toggleSort(table, columnId),
    });
  }
}

// Composition pattern for features
const tableWithPlugins = createTable({
  data,
  columns,
  plugins: [
    new SortingPlugin(),
    new FilteringPlugin(),
    new PaginationPlugin(),
  ]
});
```


### 🔗 Related Technologies Ecosystem:


```typescript
// 📊 Data fetching integration
import { useQuery } from '@tanstack/react-query';
import { useTable } from '@tanstack/react-table';

const useServerTable = (queryParams) => {
  const { data, isLoading } = useQuery({
    queryKey: ['tableData', queryParams],
    queryFn: () => fetchTableData(queryParams),
  });

  const table = useTable({
    data: data?.rows ?? [],
    pageCount: data?.totalPages ?? 0,
    manualPagination: true,
    manualSorting: true,
  });

  return { table, isLoading };
};

// 🎨 Styling library integration
import { Table } from '@mantine/core';
import { useReactTable } from '@tanstack/react-table';

const StyledTable = () => {
  const table = useReactTable({ /* config */ });

  return (
    <Table striped highlightOnHover>
      {/* TanStack Table logic với Mantine styling */}
    </Table>
  );
};

// 🔄 State management integration
import { useStore } from 'zustand';

interface TableStore {
  globalFilter: string;
  sorting: SortingState;
  setGlobalFilter: (filter: string) => void;
  setSorting: (sorting: SortingState) => void;
}

const useTableStore = create<TableStore>((set) => ({
  globalFilter: '',
  sorting: [],
  setGlobalFilter: (globalFilter) => set({ globalFilter }),
  setSorting: (sorting) => set({ sorting }),
}));
```


### 📱 Platform-Specific Considerations:


```typescript
// React Native integration
import { FlatList } from 'react-native';

const NativeTable = () => {
  const table = useReactTable({
    data,
    columns: nativeColumns,
  });

  return (
    <FlatList
      data={table.getRowModel().rows}
      keyExtractor={(row) => row.id}
      renderItem={({ item: row }) => <NativeTableRow row={row} />}
      getItemLayout={(data, index) => ({
        length: ROW_HEIGHT,
        offset: ROW_HEIGHT * index,
        index,
      })}
    />
  );
};

// SSR considerations
const SSRTable = ({ initialData, initialState }) => {
  const table = useReactTable({
    data: initialData,
    columns,
    initialState, // Hydrate từ server state
  });

  return <TableRenderer table={table} />;
};
```


---


## 💼 9. INTERVIEW PERSPECTIVE


### 🎯 Câu hỏi thường gặp và cách trả lời Professional:


**Q1: "Explain the difference between framework-agnostic core và framework-specific implementations trong context của TanStack Table."**


**💡 Senior-level Answer:**


```
"Framework-agnostic core là architectural pattern nơi business logic được
separated từ presentation layer. Trong TanStack Table:

CORE ENGINE (framework-agnostic):
- Data processing algorithms (sorting, filtering)
- State management logic
- Column computation
- Row model calculations

FRAMEWORK ADAPTERS (framework-specific):
- useReactTable, useVueTable hooks
- State synchronization với framework lifecycle
- Event binding và DOM updates
- Component integration patterns

Benefits:
1. Code reuse across platforms
2. Consistent behavior regardless of framework
3. Easier testing (test core logic once)
4. Future-proof (new framework? Just create adapter)

Example: Same table logic running on React web app, React Native mobile,
và Vue admin panel with identical feature set."
```


**Q2: "How would you optimize performance cho một table với 100,000+ rows?"**


**💡 Technical Deep-dive Answer:**


```typescript
// Multi-layer optimization strategy:

// 1. VIRTUALIZATION - Chỉ render visible items
const rowVirtualizer = useVirtualizer({
  count: 100000,
  getScrollElement: () => scrollElementRef.current,
  estimateSize: () => 35,
  overscan: 5, // Pre-render 5 items each direction
});

// 2. SERVER-SIDE OPERATIONS - Giảm client processing
const table = useReactTable({
  data: currentPageData, // Only current page data
  manualPagination: true,
  manualSorting: true,
  manualFiltering: true,
  pageCount: Math.ceil(totalRows / pageSize),
});

// 3. MEMOIZATION - Prevent unnecessary recalculations
const columns = useMemo(() => columnDefinitions, []);
const memoizedData = useMemo(() =>
  processRawData(rawData), [rawData]
);

// 4. WEB WORKERS - Heavy computations off main thread
const sortWorker = new Worker('/sort-worker.js');
const handleSort = useCallback(async (sortSpec) => {
  const sortedData = await sortWorker.postMessage({ data, sortSpec });
  setData(sortedData);
}, [data]);

// 5. DEBOUNCING - Reduce API calls
const debouncedFilter = useDebounce(filterValue, 300);

Performance metrics achieved:
- Initial render: <100ms cho 100k rows
- Scroll performance: 60fps maintained
- Memory usage: ~50MB regardless of dataset size
```


**Q3: "Describe how you would implement real-time updates trong một TanStack Table."**


**💡 Architecture-focused Answer:**


```typescript
// Multi-pronged real-time strategy:

// 1. WEBSOCKET INTEGRATION
const useRealTimeTable = (initialData) => {
  const [data, setData] = useState(initialData);

  useEffect(() => {
    const ws = new WebSocket('/api/table-updates');

    ws.onmessage = (event) => {
      const update = JSON.parse(event.data);

      switch(update.type) {
        case 'ROW_ADDED':
          setData(prev => [...prev, update.row]);
          break;
        case 'ROW_UPDATED':
          setData(prev => prev.map(row =>
            row.id === update.row.id ? update.row : row
          ));
          break;
        case 'ROW_DELETED':
          setData(prev => prev.filter(row => row.id !== update.rowId));
          break;
      }
    };

    return () => ws.close();
  }, []);

  return useReactTable({ data, columns });
};

// 2. OPTIMISTIC UPDATES - Better UX
const handleEdit = async (rowId, newData) => {
  // Immediate UI update
  updateRowOptimistically(rowId, newData);

  try {
    await api.updateRow(rowId, newData);
    // Success - no rollback needed
  } catch (error) {
    // Rollback optimistic update
    rollbackRowUpdate(rowId);
    showErrorNotification();
  }
};

// 3. CONFLICT RESOLUTION
const resolveConflict = (localVersion, serverVersion) => {
  // Strategy depends on business requirements:
  // - Last-write-wins
  // - Field-level merging
  // - User prompts for resolution
  return mergeStrategy(localVersion, serverVersion);
};

Key considerations:
- Network reliability (offline handling)
- Conflict resolution strategies
- Performance với high-frequency updates
- User experience consistency
```


### 🌟 Advanced Interview Topics:


**Q4: "How would you test một headless table library comprehensively?"**


```typescript
// Multi-layer testing strategy:

// 1. CORE LOGIC TESTS (Framework agnostic)
describe('Table Core', () => {
  it('should sort data correctly', () => {
    const table = createTable({
      data: mockData,
      columns: testColumns,
      state: { sorting: [{ id: 'name', desc: false }] }
    });

    const sorted = table.getSortedRowModel().rows;
    expect(sorted[0].original.name).toBe('Alice');
  });
});

// 2. ADAPTER TESTS (Framework specific)
describe('React Table Adapter', () => {
  it('should sync state với React lifecycle', () => {
    const { rerender } = renderHook(() =>
      useReactTable({ data: mockData, columns: testColumns })
    );

    // Test state persistence across re-renders
  });
});

// 3. INTEGRATION TESTS
describe('Table Integration', () => {
  it('should handle server state updates', async () => {
    const { user } = render(<ServerTable />);

    await user.click(screen.getByText('Refresh'));

    await waitFor(() => {
      expect(screen.getByText('Updated Data')).toBeInTheDocument();
    });
  });
});

// 4. PERFORMANCE TESTS
describe('Performance', () => {
  it('should render large datasets efficiently', () => {
    const startTime = performance.now();

    render(<VirtualizedTable data={largeDataset} />);

    const renderTime = performance.now() - startTime;
    expect(renderTime).toBeLessThan(100); // <100ms acceptable
  });
});

// 5. ACCESSIBILITY TESTS
describe('Accessibility', () => {
  it('should support keyboard navigation', async () => {
    const { user } = render(<AccessibleTable />);

    await user.tab();
    expect(screen.getByRole('columnheader')).toHaveFocus();

    await user.keyboard('[ArrowRight]');
    // Test focus management
  });
});
```


### 🎯 Điểm cộng khi demonstrate expertise:


**🔥 Mention Advanced Patterns:**


```typescript
"Tôi có experience implement advanced patterns như:

1. COMPOUND COMPONENT PATTERN for table composition:
   <Table>
     <Table.Header />
     <Table.Body />
     <Table.Footer />
   </Table>

2. RENDER PROPS pattern for maximum flexibility:
   <Table>
     {({ rows, headers }) => (
       <CustomTableImplementation rows={rows} headers={headers} />
     )}
   </Table>

3. PLUGIN ARCHITECTURE for extensible features:
   const table = useReactTable({
     plugins: [sortingPlugin, filteringPlugin, customFeaturePlugin]
   });

4. MICRO-FRONTEND integration với shared table state across teams."
```


**💡 Real-world Problem Solving:**


```typescript
"Challenges tôi đã solve:

- Memory leaks trong large dataset tables (weak references cho event listeners)
- Cross-browser compatibility issues với sticky headers (CSS transforms)
- Mobile performance optimization (touch event handling, reduced DOM nodes)
- Server-side rendering hydration mismatches (stable row IDs)
- Accessibility compliance (ARIA attributes, keyboard navigation)
- Complex nested header structures (recursive column grouping)
- Real-time collaborative editing (operational transforms)"
```


---


## 🎪 10. DEMO INTERACTIVE ENHANCEMENTS


Để demonstrate advanced understanding, đây là những features có thể add vào demo:


```typescript
// 🚀 Advanced Features Demo
const AdvancedTableDemo = () => {
  // Multi-level state management
  const [tableConfig, setTableConfig] = useImmer({
    enableSorting: true,
    enableFiltering: true,
    enableRowSelection: true,
    enableVirtualization: false,
  });

  // Plugin-like architecture demo
  const tableFeatures = useMemo(() => ({
    ...(tableConfig.enableSorting && { getSortedRowModel: getSortedRowModel() }),
    ...(tableConfig.enableFiltering && { getFilteredRowModel: getFilteredRowModel() }),
    ...(tableConfig.enableRowSelection && {
      enableRowSelection: true,
      enableMultiRowSelection: true
    }),
  }), [tableConfig]);

  const table = useReactTable({
    data,
    columns,
    ...tableFeatures,
  });

  return (
    <div>
      {/* Feature toggles */}
      <FeatureToggles config={tableConfig} onChange={setTableConfig} />

      {/* Performance metrics */}
      <PerformanceMonitor table={table} />

      {/* Table state inspector */}
      <StateInspector table={table} />

      {/* Main table */}
      <TableRenderer table={table} />
    </div>
  );
};
```


---


## 🎯 Key Takeaways cho Architecture Mastery:


✅ **Framework-agnostic thinking** - Design logic independent từ UI layer

✅ **Separation of concerns** - Core vs Adapter vs Implementation

✅ **Performance awareness** - Understand cost của each abstraction layer

✅ **Type safety** - Leverage TypeScript cho better developer experience

✅ **Testing strategy** - Test core logic separately từ framework integration

✅ **Real-world application** - Know khi nào pattern này brings value vs overhead


**🚀 Final Architecture Insight:** TanStack Table's framework-agnostic core là excellent example của "write once, run everywhere" principle applied đúng cách. Nó solve được fundamental problem của UI library ecosystem: duplicate effort across frameworks. Understanding architecture này giúp bạn design better abstractions trong own projects và appreciate trade-offs của different architectural decisions!
