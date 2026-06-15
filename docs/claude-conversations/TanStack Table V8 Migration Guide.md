# TanStack Table V8 Migration Guide

## Claude


# 📊 Phân Tích Migration Guide: TanStack Table V8


## 📝 TÓM TẮT CHÍNH


TanStack Table V8 là một cuộc **major rewrite** hoàn toàn từ React Table v7, được viết lại từ đầu bằng TypeScript. Thay vì sử dụng plugin system cũ, V8 chuyển sang **inversion of control pattern** với tree-shakable row models, cung cấp API mạnh mẽ hơn và hỗ trợ tốt hơn cho server-side operations.


**Tại sao quan trọng?** Đây là evolution lớn nhất trong ecosystem table management của React, mang lại type safety, performance improvements, và flexibility cao hơn cho developers xây dựng complex data tables.


## 🔍 KHÁI NIỆM CỐT LÕI


### 🎯 Tree-shakable Row Models


**Định nghĩa đơn giản:** Thay vì load tất cả features cùng lúc (như v7), V8 cho phép import chỉ những features cần thiết.


```tsx
// V7: Plugin system - tất cả hooks phải load cùng lúc
import { useTable, usePagination, useSortBy } from 'react-table';

// V8: Tree-shakable - chỉ import những gì cần
import {
  useReactTable,
  getCoreRowModel,        // Core functionality
  getPaginationRowModel,  // Chỉ khi cần pagination
  getSortedRowModel      // Chỉ khi cần sorting
} from '@tanstack/react-table';
```


### 🏗️ Inversion of Control


**So sánh với Redux pattern:** Thay vì library control logic, developer control configuration và state flow.


### 🔧 Framework Agnostic Core


**Khái niệm:** Core logic tách biệt khỏi React, có adapters cho React, Vue, Svelte, Solid.


## 💡 HIỂU BẢN CHẤT


### 🎯 Pain Points được giải quyết:


**1. Bundle Size Issues (V7)**


- **Vấn đề cũ:** Import cả library ngay cả khi chỉ dùng basic table
- **Solution V8:** Tree-shaking cho phép chỉ bundle những features thực sự sử dụng


**2. TypeScript Support (V7)**


- **Vấn đề cũ:** Cần install thêm @types/react-table, types thường outdated
- **Solution V8:** Built-in TypeScript với type inference mạnh mẽ


**3. Plugin Order Dependencies (V7)**


- **Vấn đề cũ:** Order của hooks/plugins quan trọng và dễ gây bug
- **Solution V8:** Declarative configuration, không có order dependency


### ⚙️ Cơ chế hoạt động underlying:


```tsx
// V7: Imperative plugin chain
const table = useTable(
  config,
  useSortBy,     // ← Order quan trọng!
  usePagination  // ← Phải sau useSortBy
);

// V8: Declarative configuration
const table = useReactTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),     // ← Order không quan trọng
  getPaginationRowModel: getPaginationRowModel(), // ← Có thể đổi chỗ
});
```


## 🛠️ CODE EXAMPLES THỰC TẾ


### 📋 Migration Step-by-Step:


```tsx
// ===== BƯỚC 1: CÀI ĐẶT PACKAGE MỚI =====
// npm uninstall react-table @types/react-table
// npm install @tanstack/react-table

// ===== BƯỚC 2: UPDATE IMPORTS =====
// Before V7
import { useTable, usePagination, useSortBy } from 'react-table';

// After V8
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender
} from '@tanstack/react-table';

// ===== BƯỚC 3: UPDATE COLUMN DEFINITIONS =====
// V7 Style
const columnsV7 = [
  {
    accessor: 'firstName',           // ← String accessor
    Header: 'Tên',                  // ← Capitalized Header
    width: 200,                     // ← width property
    disableSortBy: true             // ← disable* pattern
  },
  {
    accessor: row => row.lastName,   // ← Function accessor
    Header: () => <span>Họ</span>,
    Cell: ({ value }) => (          // ← Direct value prop
      <strong>{value}</strong>
    )
  }
];

// V8 Style với Column Helper (Recommended)
const columnHelper = createColumnHelper<User>();

const columnsV8 = [
  columnHelper.accessor('firstName', {  // ← accessorKey
    header: 'Tên',                     // ← lowercase header
    size: 200,                         // ← size thay vì width
    enableSorting: false               // ← enable* pattern
  }),
  columnHelper.accessor(row => row.lastName, { // ← accessorFn
    header: () => <span>Họ</span>,
    cell: ({ getValue }) => (          // ← getValue() function
      <strong>{getValue()}</strong>
    )
  })
];

// V8 Alternative Style (Without column helper)
const columnsV8Alt = [
  {
    accessorKey: 'firstName',         // ← Explicit accessorKey
    header: 'Tên',
    size: 200,
    enableSorting: false
  },
  {
    accessorFn: row => row.lastName,  // ← Explicit accessorFn
    header: () => <span>Họ</span>,
    cell: ({ getValue }) => (
      <strong>{getValue()}</strong>
    )
  }
];

// ===== BƯỚC 4: UPDATE TABLE INSTANCE =====
// V7 Implementation
const MyTableV7 = () => {
  const tableInstance = useTable(
    {
      columns: columnsV7,
      data
    },
    useSortBy,      // ← Plugin order matters
    usePagination   // ← Must be after useSortBy
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = tableInstance;

  return (
    <table {...getTableProps()}>
      <thead>
        {headerGroups.map(headerGroup => (
          <tr {...headerGroup.getHeaderGroupProps()}>
            {headerGroup.headers.map(column => (
              <th {...column.getHeaderProps()}>
                {column.render('Header')}  {/* ← render method */}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody {...getTableBodyProps()}>
        {rows.map(row => {
          prepareRow(row);
          return (
            <tr {...row.getRowProps()}>
              {row.cells.map(cell => (
                <td {...cell.getCellProps()}>
                  {cell.render('Cell')}  {/* ← render method */}
                </td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

// V8 Implementation
const MyTableV8 = () => {
  const table = useReactTable({
    data,
    columns: columnsV8,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),  // ← Order không quan trọng
    // State management được control bởi developer
    state: {
      pagination: {
        pageIndex: 0,
        pageSize: 10,
      },
    },
  });

  return (
    <table>
      <thead>
        {table.getHeaderGroups().map(headerGroup => (
          <tr key={headerGroup.id}>  {/* ← Manual key prop */}
            {headerGroup.headers.map(header => (
              <th
                key={header.id}
                colSpan={header.colSpan}  {/* ← Manual colSpan */}
              >
                {flexRender(  {/* ← flexRender thay vì render */}
                  header.column.columnDef.header,
                  header.getContext()
                )}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map(row => (
          <tr key={row.id}>
            {row.getVisibleCells().map(cell => (
              <td key={cell.id}>
                {flexRender(
                  cell.column.columnDef.cell,
                  cell.getContext()
                )}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};
```


### 🔄 Row Selection Example:


```tsx
// V7: Built-in props system
const SelectColumnV7 = {
  Header: ({ getToggleAllRowsSelectedProps }) => (
    <input
      type="checkbox"
      {...getToggleAllRowsSelectedProps()}  // ← Magic props
    />
  ),
  Cell: ({ row }) => (
    <input
      type="checkbox"
      {...row.getToggleRowSelectedProps()}  // ← Magic props
    />
  ),
};

// V8: Manual event handlers với helper functions
const SelectColumnV8 = columnHelper.display({
  id: 'select',
  header: ({ table }) => (
    <input
      type="checkbox"
      checked={table.getIsAllRowsSelected()}
      // Indeterminate state cho partial selection
      ref={ref => {
        if (ref) ref.indeterminate = table.getIsSomeRowsSelected();
      }}
      onChange={table.getToggleAllRowsSelectedHandler()}  // ← Helper function
    />
  ),
  cell: ({ row }) => (
    <input
      type="checkbox"
      checked={row.getIsSelected()}
      disabled={!row.getCanSelect()}
      onChange={row.getToggleSelectedHandler()}  // ← Helper function
    />
  ),
});
```


## 🔄 SO SÁNH & PHÂN BIỆT


### ⚖️ V7 vs V8 Comparison Table:


```
AspectReact Table V7TanStack Table V8WinnerBundle SizeToàn bộ libraryTree-shakable✅ V8TypeScriptSeparate @typesBuilt-in types✅ V8Plugin SystemHook-basedRow models✅ V8Learning CurveModerateSteeper initially⚖️ V7Framework SupportReact onlyMulti-framework✅ V8Migration EffortN/ASignificant❌ V8
```


### 🎯 Khi nào nên migrate?


**✅ Nên migrate khi:**


- Starting new project
- Heavy TypeScript usage
- Need bundle size optimization
- Planning multi-framework support
- Want latest features (pinning, advanced filtering)


**❌ Không nên migrate khi:**


- Legacy project với limited timeline
- Team chưa familiar với TypeScript
- Simple table requirements
- V7 đang work perfectly fine


## 🎯 BEST PRACTICES


### ⚠️ Common Mistakes cần tránh:


```tsx
// ❌ MISTAKE 1: Định nghĩa columns inside component without memoization
const BadExample = () => {
  const columns = [  // ← Re-creates mỗi render!
    { accessorKey: 'name', header: 'Name' }
  ];

  return <MyTable columns={columns} />;
};

// ✅ CORRECT: Memoization với useMemo
const GoodExample = () => {
  const columns = useMemo(() => [
    { accessorKey: 'name', header: 'Name' }
  ], []);  // ← Empty dependency array vì columns không đổi

  return <MyTable columns={columns} />;
};

// ✅ BETTER: Define outside component
const COLUMNS = [
  { accessorKey: 'name', header: 'Name' }
];

const BestExample = () => {
  return <MyTable columns={COLUMNS} />;
};

// ❌ MISTAKE 2: Quên manual key props
<tr>  {/* ← Missing key! */}
  {row.cells.map(cell => <td>{cell.value}</td>)}
</tr>

// ✅ CORRECT: Manual key props
<tr key={row.id}>
  {row.cells.map(cell => (
    <td key={cell.id}>{cell.value}</td>
  ))}
</tr>

// ❌ MISTAKE 3: Accessing value directly
cell: ({ row }) => <span>{row.original.name}</span>  // ← Direct access

// ✅ CORRECT: Use getValue() for better performance
cell: ({ getValue }) => <span>{getValue()}</span>  // ← Cached value
```


### 🚀 Performance Optimizations:


```tsx
// ✅ Memoize expensive calculations
const data = useMemo(() =>
  expensiveDataTransformation(rawData),
  [rawData]
);

// ✅ Memoize column definitions
const columns = useMemo(() => [
  columnHelper.accessor('name', {
    header: 'Name',
    cell: ({ getValue }) => getValue().toUpperCase()
  })
], []);

// ✅ Use state for controlled features
const [pagination, setPagination] = useState({
  pageIndex: 0,
  pageSize: 10,
});

const table = useReactTable({
  data,
  columns,
  state: { pagination },  // ← Controlled state
  onPaginationChange: setPagination,
  getCoreRowModel: getCoreRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
});
```


## 🚀 ỨNG DỤNG THỰC TẾ


### 💼 E-commerce Product Table:


```tsx
interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
  image: string;
}

const ProductTable = () => {
  const columnHelper = createColumnHelper<Product>();

  const columns = useMemo(() => [
    // Select column cho bulk actions
    columnHelper.display({
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
        />
      ),
    }),

    // Image preview
    columnHelper.accessor('image', {
      header: 'Hình ảnh',
      cell: ({ getValue }) => (
        <img
          src={getValue()}
          alt="Product"
          className="w-12 h-12 object-cover rounded"
        />
      ),
      enableSorting: false,
    }),

    // Product name với search highlighting
    columnHelper.accessor('name', {
      header: 'Tên sản phẩm',
      cell: ({ getValue, table }) => {
        const searchTerm = table.getState().globalFilter;
        return <HighlightedText text={getValue()} searchTerm={searchTerm} />;
      },
    }),

    // Price với currency formatting
    columnHelper.accessor('price', {
      header: 'Giá',
      cell: ({ getValue }) => (
        <span className="font-semibold text-green-600">
          {new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
          }).format(getValue())}
        </span>
      ),
    }),

    // Stock với color coding
    columnHelper.accessor('stock', {
      header: 'Tồn kho',
      cell: ({ getValue }) => {
        const stock = getValue();
        const colorClass = stock > 50 ? 'text-green-600' :
                          stock > 10 ? 'text-yellow-600' : 'text-red-600';
        return <span className={colorClass}>{stock}</span>;
      },
    }),

    // Actions column
    columnHelper.display({
      id: 'actions',
      header: 'Thao tác',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button onClick={() => editProduct(row.original.id)}>
            Sửa
          </Button>
          <Button
            variant="destructive"
            onClick={() => deleteProduct(row.original.id)}
          >
            Xóa
          </Button>
        </div>
      ),
    }),
  ], []);

  const table = useReactTable({
    data: products,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    // Row selection state
    enableRowSelection: true,
    state: {
      rowSelection,
      pagination,
      sorting,
      globalFilter,
    },
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
  });

  return (
    <div className="space-y-4">
      {/* Global search */}
      <input
        placeholder="Tìm kiếm sản phẩm..."
        value={globalFilter ?? ''}
        onChange={e => setGlobalFilter(e.target.value)}
        className="w-full p-2 border rounded"
      />

      {/* Bulk actions */}
      {Object.keys(rowSelection).length > 0 && (
        <div className="bg-blue-50 p-3 rounded">
          Đã chọn {Object.keys(rowSelection).length} sản phẩm
          <Button onClick={handleBulkDelete} className="ml-2">
            Xóa hàng loạt
          </Button>
        </div>
      )}

      {/* Table */}
      <table className="w-full border-collapse border">
        <thead>
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <th
                  key={header.id}
                  className="border p-2 bg-gray-50"
                  onClick={header.column.getToggleSortingHandler()}
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                  {/* Sort indicator */}
                  {{
                    asc: ' 🔼',
                    desc: ' 🔽',
                  }[header.column.getIsSorted() as string] ?? null}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map(row => (
            <tr
              key={row.id}
              className={row.getIsSelected() ? 'bg-blue-50' : ''}
            >
              {row.getVisibleCells().map(cell => (
                <td key={cell.id} className="border p-2">
                  {flexRender(
                    cell.column.columnDef.cell,
                    cell.getContext()
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div>
          Hiển thị {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} đến{' '}
          {Math.min(
            (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
            table.getPrePaginationRowModel().rows.length
          )}{' '}
          trong tổng số {table.getPrePaginationRowModel().rows.length} sản phẩm
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Trước
          </Button>
          <Button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Tiếp
          </Button>
        </div>
      </div>
    </div>
  );
};
```


## 📚 KIẾN THỨC LIÊN QUAN


### 📋 Prerequisites:


- **React Hooks** (useState, useMemo, useCallback)
- **TypeScript basics** (interfaces, generics)
- **Modern JavaScript** (destructuring, optional chaining)
- **CSS/Styling** framework (Tailwind, styled-components)


### 🔗 Advanced Topics:


- **Virtual Scrolling** integration với react-virtual
- **Server-side filtering/sorting** với API endpoints
- **Custom filter functions** cho complex data types
- **Column resizing** và drag-and-drop reordering
- **Export functionality** (PDF, Excel, CSV)


### 🛠️ Related Technologies:


- **@tanstack/react-virtual** - Virtual scrolling cho large datasets
- **@tanstack/react-query** - Server state management
- **react-hook-form** - Form integration
- **zod** - Runtime type validation
- **@dnd-kit** - Drag and drop functionality


## 💼 INTERVIEW PERSPECTIVE


### ❓ Câu hỏi Interview phổ biến:


**Q1: "Tại sao TanStack Table V8 lại được rewrite hoàn toàn từ V7?"**


```
📝 Câu trả lời professional:

"TanStack Table V8 được rewrite để giải quyết 3 pain points chính của V7:

1. **Type Safety**: V7 cần separate @types package và type support không tốt.
   V8 built-in TypeScript với type inference mạnh mẽ.

2. **Bundle Size**: V7 bundle toàn bộ features ngay cả khi không dùng.
   V8 sử dụng tree-shakable row models.

3. **Plugin Dependencies**: V7 plugin order quan trọng và dễ gây bug.
   V8 declarative configuration loại bỏ order dependency.

Ngoài ra V8 còn framework-agnostic, support React, Vue, Svelte..."
```


**Q2: "Explain sự khác biệt giữa accessorKey và accessorFn?"**


```tsx
// accessorKey: cho simple property access
columnHelper.accessor('user.name', {  // ← String path
  header: 'Name'
});

// accessorFn: cho complex data transformation
columnHelper.accessor(row => {  // ← Function transformation
  return `${row.firstName} ${row.lastName}`.trim();
}, {
  header: 'Full Name'
});
```


**Q3: "Làm thế nào để optimize performance cho large datasets?"**


```
📝 Comprehensive answer:

1. **Memoization**: useMemo cho columns và data
2. **Virtual Scrolling**: @tanstack/react-virtual integration
3. **Server-side Operations**: Pagination, sorting, filtering trên server
4. **Lazy Loading**: Load data khi cần
5. **Row Selection Optimization**: Chỉ track selected IDs thay vì full objects
```


### 🏆 Điểm cộng khi demonstrate:


```tsx
// ✅ Show advanced knowledge
const MyAdvancedTable = () => {
  // Controlled state management
  const [{ pageIndex, pageSize }, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  // Server-side data fetching với react-query
  const { data, isLoading } = useQuery({
    queryKey: ['products', pageIndex, pageSize],
    queryFn: () => fetchProducts({ pageIndex, pageSize }),
    keepPreviousData: true,  // ← Smooth UX
  });

  // Custom filter function
  const fuzzyFilter = (row, columnId, value, addMeta) => {
    const itemRank = rankItem(row.getValue(columnId), value);
    addMeta({ itemRank });
    return itemRank.passed;
  };

  const table = useReactTable({
    data: data?.products ?? [],
    columns,
    // Manual pagination for server-side
    manualPagination: true,
    pageCount: data?.pageCount ?? -1,
    state: { pagination: { pageIndex, pageSize } },
    onPaginationChange: setPagination,
    // Custom global filter
    globalFilterFn: fuzzyFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  // Show understanding của performance implications
  return useMemo(() => (
    <TableComponent table={table} />
  ), [table]);
};
```


## 🎪 DEMO INTERACTIVE


Tôi sẽ tạo một demo interactive để bạn có thể experiment với TanStack Table V8:


Tôi đã phân tích toàn bộ migration guide TanStack Table V8 theo đúng 10 phần bạn yêu cầu! 🎯


## 🚀 HIGHLIGHT CHÍNH


**Migration này không chỉ là upgrade version** - đây là một **paradigm shift** hoàn toàn trong cách chúng ta approach table management trong React ecosystem. V8 mang lại:


- **Type Safety 💪** - Built-in TypeScript thay vì separate @types
- **Performance 🚀** - Tree-shakable imports + better state management
- **Flexibility 🔧** - Framework-agnostic core với React adapter
- **Developer Experience 📈** - Declarative config thay vì plugin dependencies


## 🎯 TAKEAWAYS QUAN TRỌNG


1. **Không rush migrate** - V8 có learning curve cao hơn V7
2. **Migration effort significant** - Cần rewrite table logic hoàn toàn
3. **ROI cao cho new projects** - Đặc biệt khi heavy TypeScript usage
4. **Future-proof investment** - Multi-framework support sẵn sàng


## 💡 NEXT STEPS


Bạn có thể:


- **Experiment** với demo interactive ở trên
- **Practice** migration cho một simple table trước
- **Deep dive** vào [TanStack docs](https://tanstack.com/table/v8) cho advanced features
- **Join community** để learn best practices từ other developers


Có câu hỏi gì specific về migration process hay muốn tôi explain deeper về phần nào không? 🤔
