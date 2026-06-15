# TanStack Table Row Models Analysis

## You

Rows Guide
API
Row API
Rows Guide
This quick guide will discuss the different ways you can retrieve and interact with row objects in TanStack Table.
Where to Get Rows From
There are multiple table instance APIs you can use to retrieve rows from the table instance.
table.getRow
If you need to access a specific row by its id, you can use the table.getRow table instance API.
jsRow Models
The table instance generates row objects and stores them in useful arrays called "Row Models". This is discussed in much more detail in the Row Models Guide, but here are the most common ways you may access the row models.
Render Rows
jsxGet Selected Rows
jsRow Objects
Every row object contains row data and many APIs to either interact with the table state or extract cells from the row based on the state of the table.
Row IDs
Every row object has an id property that makes it unique within the table instance. By default the row.id is the same as the row.index that is created in the row model. However, it can be useful to override each row's id with a unique identifier from the row's data. You can use the getRowId table option to do this.
jsNote: In some features like grouping and expanding, the row.id will have additional string appended to it.
Access Row Values
The recommended way to access data values from a row is to use either the row.getValue or row.renderValue APIs. Using either of these APIs will cache the results of the accessor functions and keep rendering efficient. The only difference between the two is that row.renderValue will return either the value or the renderFallbackValue if the value is undefined, whereas row.getValue will return the value or undefined if the value is undefined.
jsNote: cell.getValue and cell.renderValue are shortcuts for the row.getValue and row.renderValue APIs, respectively.
Access Original Row Data
For every row object, you can access the original corresponding data that was passed to the table instance via the row.original property. None of the data in the row.original will have been modified by the accessors in your column definitions, so if you were doing any sort of data transformations in your accessors, those will not be reflected in the row.original object.
jsSub Rows
If you are using either grouping or expanding features, your rows may contain sub-rows or parent row references. This is discussed in much more detail in the Expanding Guide, but here is a quick overview of useful properties and methods for working with sub-rows.
* row.subRows: An array of sub-rows for the row.
* row.depth: The depth of the row (if nested or grouped) relative to the root row array. 0 for root level rows, 1 for child rows, 2 for grandchild rows, etc.
* row.parentId: The unique ID of the parent row for the row (The row that contains this row in its subRows array).
* row.getParentRow: Returns the parent row for the row, if it exists.
More Row APIs
Depending on the features that you are using for your table, there are dozens more useful APIs for interacting with rows. See each features' respective API docs or guide for more information.

## Claude


# 📊 Phân Tích Chuyên Sâu: TanStack Table Row Models


## 📝 TÓM TẮT CHÍNH


Bài viết này giải thích **Row Models** - hệ thống core của TanStack Table để transform dữ liệu gốc thành các dạng khác nhau phục vụ cho các tính năng như filtering, sorting, grouping, pagination. Đây là concept quan trọng giúp developers hiểu được cách TanStack Table xử lý dữ liệu internally và tại sao phải import các row models một cách selective.


## 🔍 KHÁI NIỆM CỐT LÕI


### 🎯 Row Models là gì?


- **Định nghĩa đơn giản**: Row Models là các functions chuyên biệt transform dữ liệu gốc của bạn thành các format khác nhau
- **Tương tự như**: Array methods trong JavaScript (`filter()`, `sort()`, `slice()`) nhưng specialized cho data tables
- **Mục đích**: Tạo ra các "views" khác nhau của cùng một dataset


### 🔧 Các loại Row Models chính:


```
getCoreRowModelgetFilteredRowModelgetSortedRowModelgetPaginationRowModelgetGroupedRowModel
```


## 💡 HIỂU BẢN CHẤT


### 🎯 Pain Points được giải quyết:


1. **Performance Issue**: Thay vì transform toàn bộ data mỗi lần render, chỉ transform khi cần
2. **Modularity**: Chỉ load code cho features thực sự sử dụng
3. **Data Consistency**: Đảm bảo data transformation theo đúng thứ tự logic
4. **Memory Optimization**: Tránh duplicate data không cần thiết


### ⚙️ Cơ chế hoạt động:


```typescript
// Thứ tự execution pipeline:
Original Data
  → Core Row Model (1:1 mapping)
  → Filtered Row Model (apply filters)
  → Grouped Row Model (apply grouping)
  → Sorted Row Model (apply sorting)
  → Expanded Row Model (handle sub-rows)
  → Pagination Row Model (current page only)
  → Final Row Model (for rendering)
```


### 🤔 Tại sao không dùng alternatives?


- **Built-in Array methods**: Không optimize cho table operations, performance kém với large datasets
- **Manual transformation**: Dễ bug, khó maintain, không consistent
- **Other table libraries**: Ít flexible, bundle size lớn hơn


## 🛠️ CODE EXAMPLES THỰC TẾ


### 📋 Setup cơ bản:


```typescript
import {
  getCoreRowModel,      // Required - dữ liệu gốc
  getFilteredRowModel,  // Optional - cho search/filter
  getSortedRowModel,    // Optional - cho sorting
  getPaginationRowModel // Optional - cho phân trang
} from '@tanstack/react-table'

function DataTable() {
  const table = useReactTable({
    data: employees,        // Dữ liệu gốc từ API
    columns: columnDefs,    // Định nghĩa columns

    // Row Models - chỉ import những gì cần dùng
    getCoreRowModel: getCoreRowModel(),           // Luôn cần
    getFilteredRowModel: getFilteredRowModel(),   // Cho search
    getSortedRowModel: getSortedRowModel(),       // Cho sort
    getPaginationRowModel: getPaginationRowModel(), // Cho pagination

    // State management cho các features
    state: {
      globalFilter,  // Search term
      sorting,       // Sort state
      pagination,    // Page state
    }
  })

  // Lấy rows đã được processed để render
  const rows = table.getRowModel().rows

  return (
    <table>
      {/* Render rows đã được transform */}
      {rows.map(row => (
        <tr key={row.id}>
          {row.getVisibleCells().map(cell => (
            <td key={cell.id}>
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </td>
          ))}
        </tr>
      ))}
    </table>
  )
}
```


### 🔍 Access different row models:


```typescript
function DebugComponent() {
  const table = useReactTable({...})

  // Các row models khác nhau cho debugging
  const coreRows = table.getCoreRowModel().rows           // 1000 rows (original)
  const filteredRows = table.getFilteredRowModel().rows   // 50 rows (after search)
  const sortedRows = table.getSortedRowModel().rows       // 50 rows (sorted)
  const paginatedRows = table.getRowModel().rows          // 10 rows (current page)

  console.log({
    original: coreRows.length,      // 1000
    filtered: filteredRows.length,  // 50
    currentPage: paginatedRows.length // 10
  })
}
```


### 📊 Formats dữ liệu khác nhau:


```typescript
const rowModel = table.getRowModel()

// 1. Array bình thường - cho rendering
const rows = rowModel.rows
console.log(rows[0].original) // Object gốc từ data

// 2. Flat array - tất cả sub-rows được flatten
const flatRows = rowModel.flatRows
console.log(flatRows.length) // Bao gồm cả sub-rows

// 3. Object lookup - tìm kiếm nhanh theo ID
const rowsById = rowModel.rowsById
const specificRow = rowsById['user-123'] // Instant lookup
```


## 🔄 SO SÁNH & PHÂN BIỆT


### 🆚 TanStack Table vs Other Solutions:


```
AspectTanStack TableAnt Design TableMaterial-UI TableModularity✅ Import only needed❌ All-in-one bundle❌ All-in-one bundleBundle Size✅ Optimized⚠️ Larger⚠️ LargerCustomization✅ Full control⚠️ Theme-based⚠️ Theme-basedPerformance✅ Lazy evaluation⚠️ Good⚠️ GoodLearning Curve⚠️ Steeper✅ Easy✅ Easy
```


### 📈 Manual vs Automated Row Models:


```typescript
// ❌ Manual approach - dễ bug, performance kém
function ManualTable({ data }) {
  const [filteredData, setFilteredData] = useState(data)
  const [sortedData, setSortedData] = useState(data)
  const [paginatedData, setPaginatedData] = useState(data)

  // Phải manually sync tất cả states - nightmare!
  useEffect(() => {
    let result = data
    result = applyFilters(result, filters)    // Step 1
    result = applySorting(result, sorting)    // Step 2
    result = applyPagination(result, pagination) // Step 3
    setPaginatedData(result)
  }, [data, filters, sorting, pagination])
}

// ✅ TanStack Table approach - automatic pipeline
function TanStackTable({ data }) {
  const table = useReactTable({
    data,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  // Tất cả transformations được handle automatically!
  const rows = table.getRowModel().rows
}
```


## 🎯 BEST PRACTICES


### ✅ DO's:


```typescript
// 1. Chỉ import row models thực sự cần
import {
  getCoreRowModel,      // Always needed
  getFilteredRowModel   // Only if you have search
} from '@tanstack/react-table'

// 2. Use memoization cho heavy computations
const columns = useMemo(() => columnDefs, [])
const data = useMemo(() => fetchedData, [fetchedData])

// 3. Access đúng row model cho từng use case
const totalRows = table.getCoreRowModel().rows.length      // Original count
const visibleRows = table.getRowModel().rows.length        // After all transforms
const selectedCount = table.getSelectedRowModel().rows.length // Selected only
```


### ❌ DON'Ts:


```typescript
// ❌ Import tất cả row models nếu không dùng
import {
  getCoreRowModel,
  getExpandedRowModel,  // Không cần nếu không có sub-rows
  getGroupedRowModel,   // Không cần nếu không group
  getFacetedRowModel    // Không cần nếu không có faceted filters
} from '@tanstack/react-table'

// ❌ Transform data manually trước khi pass vào table
const preProcessedData = data.filter(item => item.active) // Wrong!

// ✅ Let table handle transformations
const table = useReactTable({
  data, // Raw data
  initialState: {
    columnFilters: [{ id: 'status', value: 'active' }] // Right!
  }
})
```


### ⚡ Performance Considerations:


```typescript
// ✅ Memoize expensive operations
const expensiveColumns = useMemo(() => {
  return columns.map(col => ({
    ...col,
    cell: info => expensiveFormatter(info.getValue())
  }))
}, [columns])

// ✅ Use row virtualization cho large datasets
import { useVirtualizer } from '@tanstack/react-virtual'

const rowVirtualizer = useVirtualizer({
  count: table.getRowModel().rows.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 35, // Row height
})
```


## 🚀 ỨNG DỤNG THỰC TẾ


### 💼 E-commerce Admin Dashboard:


```typescript
// Use case: Quản lý orders với multiple filters và sorting
function OrdersTable() {
  const table = useReactTable({
    data: orders,
    columns: orderColumns,

    // Cần filtering cho search orders
    getFilteredRowModel: getFilteredRowModel(),

    // Cần sorting cho sort by date, amount, status
    getSortedRowModel: getSortedRowModel(),

    // Cần pagination vì có hàng nghìn orders
    getPaginationRowModel: getPaginationRowModel(),

    // Cần grouping để group by status
    getGroupedRowModel: getGroupedRowModel(),

    state: {
      globalFilter: searchTerm,
      sorting: [{ id: 'createdAt', desc: true }],
      pagination: { pageIndex: 0, pageSize: 50 },
      grouping: ['status']
    }
  })

  return <DataGrid table={table} />
}
```


### 📊 Analytics Report Table:


```typescript
// Use case: Report với drill-down capabilities
function AnalyticsTable() {
  const table = useReactTable({
    data: analyticsData,
    columns: analyticsColumns,

    // Cần expansion cho drill-down
    getExpandedRowModel: getExpandedRowModel(),

    // Cần grouping cho group by time periods
    getGroupedRowModel: getGroupedRowModel(),

    // Không cần pagination (show all data)
    // Không cần filtering (use external controls)

    state: {
      expanded: expandedRows,
      grouping: ['timeperiod', 'category']
    }
  })
}
```


### 🏢 CRM Contact Management:


```typescript
// Use case: Contact list với advanced search
function ContactsTable() {
  const table = useReactTable({
    data: contacts,
    columns: contactColumns,

    // Cần tất cả features cho CRM
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),        // Cho advanced filters
    getFacetedUniqueValues: getFacetedUniqueValues(), // Cho filter options

    state: {
      columnFilters: [
        { id: 'company', value: selectedCompany },
        { id: 'tags', value: selectedTags }
      ],
      globalFilter: searchQuery,
      sorting: [{ id: 'lastContact', desc: true }]
    }
  })
}
```


## 📚 KIẾN THỨC LIÊN QUAN


### 📋 Prerequisites:


1. **React Hooks**: `useState`, `useMemo`, `useCallback`
2. **TypeScript basics**: Generics, interfaces
3. **Table concepts**: Rows, columns, cells
4. **Data transformation**: Array methods (`filter`, `sort`, `map`)


### 🔗 Advanced Topics:


1. **Custom Row Models**: Tạo row models riêng cho business logic đặc biệt
2. **Row Virtualization**: Optimize performance với hàng nghìn rows
3. **Server-side Processing**: Integrate với backend pagination/filtering
4. **Accessibility**: ARIA labels, keyboard navigation


### 🛠️ Related Technologies:


- **@tanstack/react-virtual**: Virtualization cho large datasets
- **@tanstack/react-query**: Data fetching và caching
- **React Hook Form**: Form handling cho table filters
- **Zustand/Redux**: State management cho complex table states


## 💼 INTERVIEW PERSPECTIVE


### ❓ Câu hỏi phổ biến:


**Q: "Tại sao TanStack Table lại require import row models thay vì built-in?"**


**A Professional**: "TanStack Table sử dụng modular architecture để optimize bundle size. Thay vì ship tất cả features, bạn chỉ import những row models thực sự cần. Điều này giúp:


- Giảm bundle size (tree-shaking friendly)
- Tăng performance (ít code để execute)
- Flexibility cao (có thể customize từng row model)
- Better developer experience (explicit về features đang dùng)"


**Q: "Explain thứ tự execution của row models"**


**A Professional**: "Row models được execute theo pipeline cố định: Core → Filtered → Grouped → Sorted → Expanded → Paginated. Thứ tự này đảm bảo logic consistency:


- Filter trước khi group (chỉ group data relevant)
- Group trước khi sort (sort within groups)
- Sort trước khi expand (maintain order khi expand)
- Paginate cuối cùng (apply lên final result)"


### 🎯 Điểm cộng khi demonstrate:


```typescript
// Demonstrate hiểu biết sâu về row models
function InterviewDemo() {
  const table = useReactTable({...})

  // Show understanding of different row models
  const debugInfo = {
    originalCount: table.getCoreRowModel().rows.length,
    filteredCount: table.getFilteredRowModel().rows.length,
    selectedCount: table.getSelectedRowModel().rows.length,
    currentPageCount: table.getRowModel().rows.length
  }

  // Demonstrate performance awareness
  const memoizedColumns = useMemo(() => columns, [])

  // Show debugging skills
  useEffect(() => {
    console.log('Row model transformations:', debugInfo)
  }, [debugInfo])
}
```


## 🎪 DEMO INTERACTIVE


Tôi sẽ tạo một demo interactive để bạn có thể experiment với different row models:


## 🎉 Tóm tắt demo interactive vừa tạo:


### 🚀 Tính năng chính của demo:


1. **Toggle Row Models**: Bật/tắt từng row model để thấy impact trực tiếp
2. **Real-time Debug Info**: Hiển thị số lượng rows ở mỗi stage của pipeline
3. **Interactive Features**: Search, sort, pagination working tùy theo configuration
4. **Visual Feedback**: Disabled states khi row models bị tắt


### 💡 Learning outcomes từ demo:


- **Visual Understanding**: Thấy được data transformation pipeline hoạt động
- **Hands-on Experience**: Experiment với different configurations
- **Performance Awareness**: Hiểu được modularity benefits
- **Real Implementation**: Code sample có thể reuse trong projects


### 🎯 Key Takeaways:


1. **Row Models = Data Transformation Pipeline** - Không phải magic, chỉ là organized way để transform data
2. **Modularity is King** - Chỉ import những gì cần, optimize bundle size
3. **Order Matters** - Pipeline sequence: Filter → Group → Sort → Expand → Paginate
4. **Debug-friendly** - Multiple row models cho debugging different stages


### 📈 Next Steps để master TanStack Table:


1. **Thực hành với demo** - Experiment với different combinations
2. **Build real project** - Implement trong actual application
3. **Custom row models** - Tạo row models riêng cho business logic
4. **Performance optimization** - Row virtualization cho large datasets


Bạn có muốn tôi deep dive vào phần nào cụ thể hơn không? Hoặc tạo thêm demos cho advanced features như custom row models hay server-side integration? 🤔


## Claude


# 📊 Phân Tích Chuyên Sâu: TanStack Table Rows Guide


## 📝 TÓM TẮT CHÍNH


Bài viết này hướng dẫn chi tiết cách **retrieve và interact với row objects** trong TanStack Table - từ việc lấy specific rows theo ID, access data values, đến làm việc với sub-rows trong grouping/expanding features. Đây là kiến thức fundamental để master data manipulation và rendering trong table applications, giúp developers hiểu cách TanStack Table organize và expose row data through various APIs.


## 🔍 KHÁI NIỆM CỐT LÕI


### 🎯 Row Objects - Containers of Data


- **Định nghĩa đơn giản**: Row objects là wrappers chứa original data + metadata + methods để interact với table
- **Tương tự như**: DOM elements trong browser - có data + methods + properties
- **Structure**: `{ id, original, getValue(), renderValue(), subRows, depth, ... }`


### 📋 Row Models vs Row Objects


```typescript
// Row Models = Collections (arrays) of rows
const rowModel = table.getRowModel() // { rows: [], flatRows: [], rowsById: {} }

// Row Objects = Individual row instances
const row = rowModel.rows[0] // Single row with data + methods
```


### 🔧 Key Row Properties & Methods:


```
row.id"user-123"row.original{ name: "John", age: 30 }row.getValue(key)row.getValue('salary')row.renderValue(key)row.renderValue('avatar')row.subRowsrow.subRows.lengthrow.depth0, 1, 2...
```


## 💡 HIỂU BẢN CHẤT


### 🎯 Pain Points được giải quyết:


1. **Data Access Consistency**: Thay vì access raw data trực tiếp, có standardized APIs
2. **Value Processing**: Automatic caching và processing qua column accessors
3. **Hierarchical Data**: Built-in support cho nested/grouped data
4. **Performance**: Cached getValue results, efficient re-rendering


### ⚙️ Cơ chế hoạt động underlying:


```typescript
// Internal flow khi gọi row.getValue()
row.getValue('salary')
  → Check cache first
  → If miss: Run column accessor function
  → Cache result
  → Return processed value

// vs direct access
row.original.salary // Raw value, no processing, no cache
```


### 🤔 Tại sao không dùng direct object access?


- **Raw data access**: Không có processing/formatting, performance kém
- **Manual caching**: Phải tự implement, dễ bugs
- **No hierarchical support**: Khó handle nested/grouped data
- **Type safety**: Ít type inference hơn


## 🛠️ CODE EXAMPLES THỰC TẾ


### 📋 Basic Row Access:


```typescript
// 1. Lấy specific row theo ID
const specificUser = table.getRow('user-123')
console.log(specificUser.original) // Raw user data

// 2. Render tất cả rows
function DataTable() {
  const table = useReactTable({...})

  return (
    <tbody>
      {table.getRowModel().rows.map(row => (
        <tr key={row.id}> {/* Unique row identifier */}
          {row.getVisibleCells().map(cell => (
            <td key={cell.id}>
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  )
}

// 3. Lấy selected rows để bulk operations
function BulkActions() {
  const selectedRows = table.getSelectedRowModel().rows

  const handleBulkDelete = () => {
    const idsToDelete = selectedRows.map(row => row.id)
    deleteUsers(idsToDelete)
  }
}
```


### 🆔 Custom Row IDs:


```typescript
// ❌ Default: row.id = row.index (0, 1, 2...)
const table = useReactTable({
  data: users, // [{ uuid: 'abc', name: 'John' }, ...]
  columns
})

// ✅ Custom: sử dụng business ID từ data
const table = useReactTable({
  data: users,
  columns,
  getRowId: (originalRow) => originalRow.uuid, // row.id = 'abc', 'def'...
})

// Benefits của custom row IDs:
// - Stable IDs across data updates
// - Better performance với React keys
// - Easier debugging và row tracking
```


### 📊 Data Access Methods:


```typescript
function UserProfileCell({ row }) {
  // ✅ Recommended: Sử dụng processed values
  const fullName = row.getValue('fullName')     // Processed by accessor
  const avatar = row.renderValue('avatar')      // With fallback handling

  // ❌ Avoid: Direct raw access
  const rawName = row.original.first_name + ' ' + row.original.last_name

  // 🔍 So sánh outputs:
  console.log({
    processed: fullName,    // "John Doe" (formatted)
    rendered: avatar,       // <Avatar /> component hoặc fallback
    raw: rawName           // "john doe" (unprocessed)
  })

  return (
    <div className="flex items-center space-x-3">
      {avatar}
      <span>{fullName}</span>
      {/* Access original data khi cần raw values */}
      <small className="text-gray-500">
        ID: {row.original.uuid}
      </small>
    </div>
  )
}
```


### 🌳 Sub Rows & Hierarchical Data:


```typescript
// Hierarchical data structure
const departments = [
  {
    id: 'eng',
    name: 'Engineering',
    employees: [
      { id: 'eng-1', name: 'John Doe', role: 'Senior Dev' },
      { id: 'eng-2', name: 'Jane Smith', role: 'Tech Lead' }
    ]
  }
]

// Column definition với sub-rows support
const columns = [
  {
    accessorKey: 'name',
    cell: ({ row }) => (
      <div style={{ paddingLeft: `${row.depth * 20}px` }}>
        {/* Indent based on nesting level */}
        {row.getCanExpand() && (
          <button onClick={row.getToggleExpandedHandler()}>
            {row.getIsExpanded() ? '▼' : '▶'}
          </button>
        )}
        {row.getValue('name')}
      </div>
    )
  }
]

// Working with sub-rows
function DepartmentRow({ row }) {
  const hasSubRows = row.subRows.length > 0
  const parentDept = row.getParentRow()

  console.log({
    depth: row.depth,           // 0 for departments, 1 for employees
    parentId: row.parentId,     // 'eng' for employee rows
    childCount: row.subRows.length,
    isExpanded: row.getIsExpanded()
  })

  return (
    <tr className={`depth-${row.depth}`}>
      {/* Render row content */}
    </tr>
  )
}
```


## 🔄 SO SÁNH & PHÂN BIỆT


### 🆚 Row Access Methods:


```
row.getValue()row.renderValue()row.original.keycell.getValue()
```


### 📈 TanStack vs Alternative Approaches:


```typescript
// ❌ Manual approach - performance issues
function ManualTable({ data }) {
  return (
    <tbody>
      {data.map((item, index) => (
        <tr key={index}> {/* Unstable keys */}
          <td>
            {/* Direct processing trong render - expensive! */}
            {formatCurrency(item.salary)}
          </td>
          <td>
            {/* Conditional rendering logic scattered */}
            {item.avatar_url ? (
              <img src={item.avatar_url} />
            ) : (
              <div>No Avatar</div>
            )}
          </td>
        </tr>
      ))}
    </tbody>
  )
}

// ✅ TanStack approach - optimized
function TanStackTable() {
  const table = useReactTable({
    data,
    columns: [
      {
        accessorKey: 'salary',
        cell: ({ row }) => row.renderValue('salary') // Pre-processed, cached
      },
      {
        accessorKey: 'avatar',
        cell: ({ row }) => row.renderValue('avatar') // With fallback logic
      }
    ]
  })

  return (
    <tbody>
      {table.getRowModel().rows.map(row => (
        <tr key={row.id}> {/* Stable, meaningful keys */}
          {row.getVisibleCells().map(cell => (
            <td key={cell.id}>
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  )
}
```


## 🎯 BEST PRACTICES


### ✅ DO's:


```typescript
// 1. Always use stable row IDs
const table = useReactTable({
  getRowId: (row) => row.id || row.uuid || String(row.pk)
})

// 2. Prefer getValue/renderValue over direct access
const UserCell = ({ row }) => {
  const userName = row.getValue('name')        // ✅ Cached, processed
  const userEmail = row.renderValue('email')   // ✅ With fallback

  return <div>{userName} ({userEmail})</div>
}

// 3. Handle sub-rows properly
const TreeCell = ({ row }) => (
  <div style={{ paddingLeft: `${row.depth * 16}px` }}>
    {row.subRows.length > 0 && (
      <button onClick={row.getToggleExpandedHandler()}>
        {row.getIsExpanded() ? '−' : '+'}
      </button>
    )}
    {row.getValue('name')}
  </div>
)

// 4. Use row methods for state interactions
const ActionCell = ({ row }) => (
  <div>
    <button onClick={() => row.toggleSelected()}>
      {row.getIsSelected() ? 'Deselect' : 'Select'}
    </button>
    {row.getCanExpand() && (
      <button onClick={row.getToggleExpandedHandler()}>
        Toggle
      </button>
    )}
  </div>
)
```


### ❌ DON'Ts:


```typescript
// ❌ Avoid array indices as keys
{data.map((item, index) => (
  <tr key={index}> {/* Breaks React reconciliation */}
))}

// ❌ Don't process data in render
const BadCell = ({ row }) => {
  // Expensive operations trong mỗi render!
  const expensiveValue = complexCalculation(row.original.rawData)
  return <div>{expensiveValue}</div>
}

// ❌ Don't bypass table APIs
const BadComponent = ({ row }) => {
  // Direct DOM manipulation - breaks table state
  useEffect(() => {
    document.getElementById(row.id).style.color = 'red'
  }, [])
}

// ❌ Don't assume sub-row structure
const UnsafeCell = ({ row }) => {
  const parentName = row.getParentRow().getValue('name') // Crash if no parent!

  // ✅ Safe approach:
  const parentName = row.getParentRow()?.getValue('name') || 'No Parent'
}
```


### ⚡ Performance Considerations:


```typescript
// ✅ Memoize expensive row operations
const ExpensiveRowComponent = memo(({ row }) => {
  const expensiveValue = useMemo(() => {
    return heavyCalculation(row.original)
  }, [row.original])

  return <div>{expensiveValue}</div>
})

// ✅ Use row virtualization cho large datasets
import { useVirtualizer } from '@tanstack/react-virtual'

function VirtualizedTable() {
  const rows = table.getRowModel().rows

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 35,
    overscan: 5
  })

  return (
    <div ref={parentRef}>
      {rowVirtualizer.getVirtualItems().map(virtualRow => {
        const row = rows[virtualRow.index]
        return (
          <div key={row.id} data-index={virtualRow.index}>
            {/* Render row content */}
          </div>
        )
      })}
    </div>
  )
}
```


## 🚀 ỨNG DỤNG THỰC TẾ


### 💼 E-commerce Product Catalog:


```typescript
function ProductTable() {
  const table = useReactTable({
    data: products,
    getRowId: (row) => row.sku, // Product SKU as stable ID
    columns: [
      {
        accessorKey: 'name',
        cell: ({ row }) => {
          const productName = row.getValue('name')
          const productImage = row.renderValue('image') // With fallback

          return (
            <div className="flex items-center">
              {productImage}
              <div>
                <div className="font-medium">{productName}</div>
                <div className="text-gray-500">SKU: {row.id}</div>
              </div>
            </div>
          )
        }
      },
      {
        accessorKey: 'price',
        cell: ({ row }) => {
          // Access both processed và original data
          const displayPrice = row.renderValue('price') // Formatted: "$29.99"
          const rawPrice = row.original.price_cents       // Raw: 2999

          return (
            <div>
              <span className="text-lg font-bold">{displayPrice}</span>
              {rawPrice !== row.original.sale_price_cents && (
                <span className="text-red-500 line-through ml-2">
                  ${(row.original.sale_price_cents / 100).toFixed(2)}
                </span>
              )}
            </div>
          )
        }
      }
    ]
  })
}
```


### 📊 Financial Dashboard với Grouping:


```typescript
function FinancialTable() {
  const table = useReactTable({
    data: transactions,
    getRowId: (row) => row.transaction_id,
    columns: [
      {
        accessorKey: 'category',
        cell: ({ row }) => (
          <div style={{ paddingLeft: `${row.depth * 20}px` }}>
            {row.subRows.length > 0 && (
              <span className="font-bold">
                {row.getValue('category')}
                ({row.subRows.length} transactions)
              </span>
            )}
            {row.depth > 0 && (
              <span className="text-gray-600">
                {row.getValue('description')}
              </span>
            )}
          </div>
        )
      },
      {
        accessorKey: 'amount',
        cell: ({ row }) => {
          const amount = row.getValue('amount')
          const isExpense = row.original.type === 'expense'

          return (
            <span className={isExpense ? 'text-red-600' : 'text-green-600'}>
              {isExpense ? '-' : '+'}{amount}
            </span>
          )
        }
      }
    ],
    getGroupedRowModel: getGroupedRowModel(),
    state: { grouping: ['category'] }
  })
}
```


### 👥 CRM Contact Management:


```typescript
function ContactsTable() {
  const table = useReactTable({
    data: contacts,
    getRowId: (row) => row.contact_id,
    columns: [
      {
        id: 'select',
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
          />
        )
      },
      {
        accessorKey: 'company',
        cell: ({ row }) => {
          // Multi-level hierarchy: Company > Department > Contact
          const indent = row.depth * 24

          if (row.depth === 0) {
            // Company level
            return (
              <div style={{ paddingLeft: indent }}>
                <button onClick={row.getToggleExpandedHandler()}>
                  {row.getIsExpanded() ? '📁' : '📂'}
                  {row.getValue('company')}
                </button>
              </div>
            )
          } else if (row.depth === 1) {
            // Department level
            return (
              <div style={{ paddingLeft: indent }}>
                🏢 {row.getValue('department')}
              </div>
            )
          } else {
            // Contact level
            return (
              <div style={{ paddingLeft: indent }}>
                👤 {row.getValue('name')} - {row.getValue('title')}
              </div>
            )
          }
        }
      }
    ]
  })

  // Bulk operations với selected rows
  const selectedContacts = table.getSelectedRowModel().rows

  const handleBulkEmail = () => {
    const contactEmails = selectedContacts
      .filter(row => row.depth === 2) // Only individual contacts
      .map(row => row.original.email)

    sendBulkEmail(contactEmails)
  }
}
```


## 📚 KIẾN THỨC LIÊN QUAN


### 📋 Prerequisites:


1. **React Fundamentals**: Components, hooks, key props
2. **TypeScript**: Generics, interfaces, type inference
3. **Table Concepts**: Rows, columns, cells, data models
4. **TanStack Table Basics**: useReactTable, column definitions


### 🔗 Advanced Topics:


1. **Row Selection**: Multi-select, programmatic selection
2. **Row Expansion**: Nested data, lazy loading sub-rows
3. **Row Grouping**: Aggregation, custom group headers
4. **Row Virtualization**: Performance với large datasets
5. **Server-side Rows**: Pagination, infinite loading


### 🛠️ Related Technologies:


- **@tanstack/react-virtual**: Row virtualization optimization
- **React Hook Form**: Form state cho editable rows
- **Zustand/Redux**: Global state cho complex row operations
- **React DnD**: Drag-and-drop reordering


## 💼 INTERVIEW PERSPECTIVE


### ❓ Câu hỏi phổ biến:


**Q: "Explain the difference between row.getValue() and row.original.key"**


**A Professional**: "row.getValue() returns processed data through column accessors với caching benefits, while row.original.key gives raw unprocessed data. getValue() offers better performance through memoization và consistent typing, while original access bypasses table processing pipeline và có thể impact performance trong re-renders."


**Q: "How would you handle a table with 10,000+ rows efficiently?"**


**A Professional**: "I'd implement row virtualization using @tanstack/react-virtual, ensure stable row IDs với getRowId, memoize expensive cell components, và consider server-side pagination. Row virtualization chỉ renders visible rows trong viewport, dramatically improving performance. I'd also optimize column definitions với proper memoization."


**Q: "Describe the row hierarchy system in TanStack Table"**


**A Professional**: "TanStack Table supports hierarchical data through row.subRows với automatic depth tracking. Each row has depth property (0 for root, 1+ for nested), parentId reference, và methods like getParentRow(). This enables features like grouping, expansion, và tree-like data structures while maintaining performance through proper data modeling."


### 🎯 Điểm cộng khi demonstrate:


```typescript
// Show understanding of performance implications
function OptimizedRowComponent({ row }) {
  // Demonstrate memoization awareness
  const processedData = useMemo(() => {
    return expensiveTransformation(row.original)
  }, [row.original])

  // Show proper API usage
  const displayValue = row.renderValue('complexField')

  // Demonstrate hierarchy handling
  const isNested = row.depth > 0
  const hasChildren = row.subRows.length > 0

  return (
    <div
      style={{ paddingLeft: `${row.depth * 16}px` }}
      data-testid={`row-${row.id}`} // Good testing practices
    >
      {hasChildren && (
        <button
          onClick={row.getToggleExpandedHandler()}
          aria-label={`Toggle ${row.getValue('name')} expansion`}
        >
          {row.getIsExpanded() ? '−' : '+'}
        </button>
      )}
      {displayValue}
    </div>
  )
}
```


## 🎪 DEMO INTERACTIVE


Tôi sẽ tạo một demo comprehensive để bạn experiment với different row APIs:


## 🎉 Tóm tắt demo interactive vừa tạo:


### 🚀 Tính năng chính của demo:


1. **Hierarchical Data Visualization**: Organization chart với departments → managers → employees
2. **Row ID Comparison**: Toggle between custom business IDs vs default indices
3. **Data Access Methods Demo**: Compare `row.getValue()` vs `row.original` access
4. **Row Inspector**: Deep dive vào row properties, methods, và data structure
5. **Selection & Expansion**: Interactive row selection và hierarchical expansion
6. **Debug Information**: Real-time debugging info về row counts và states


### 💡 Learning outcomes từ demo:


- **Hands-on Row API Experience**: Experiment với all major row methods
- **Performance Awareness**: Hiểu difference giữa cached vs uncached data access
- **Hierarchy Understanding**: See how depth, parentId, subRows work together
- **Practical Implementation**: Real code patterns có thể reuse trong projects


### 🎯 Key Takeaways:


1. **Row Objects = Data + Methods** - Không chỉ là plain data, mà là rich objects với behaviors
2. **getValue() > Direct Access** - Better performance, type safety, consistency
3. **Custom Row IDs Essential** - Stable keys cho React performance và user experience
4. **Hierarchy Support Built-in** - Depth tracking, parent-child relationships automated


### 📈 Next Steps để master Row APIs:


1. **Practice với demo** - Experiment với different data structures
2. **Implement trong real project** - Build actual table với complex data
3. **Optimize performance** - Add memoization, virtualization cho large datasets
4. **Custom row behaviors** - Extend row objects với business-specific methods


### 🎪 Demo Highlights:


- **Interactive Learning**: Click, toggle, inspect để understand concepts
- **Real-world Data**: Organization structure familiar với most developers
- **Debugging Tools**: Inspector shows internal row structure
- **Performance Comparison**: See impact của different approaches
- **Code Quality**: Production-ready patterns với proper TypeScript


Bạn có muốn tôi explain deeper vào phần nào của Row APIs không? Hoặc tạo thêm advanced demos cho specific use cases như editable rows, custom row actions, hay server-side integration? 🤔


**Pro tip**: Hãy spend time với demo inspector để really understand cách TanStack Table structure row data internally. Đây là foundation để master advanced table features! 💪
