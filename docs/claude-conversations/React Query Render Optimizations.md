# React Query Render Optimizations

## You

#3: React Query Render Optimizations

## Claude


# 🚀 React Query Render Optimizations - Deep Dive Analysis


## 📝 1. TÓM TẮT CHÍNH


Bài viết này giải thích **render optimization strategies** trong React Query - một vấn đề mà nhiều developer gặp phải khi components re-render không cần thiết mặc dù data không thay đổi. Vấn đề này quan trọng vì nó ảnh hưởng trực tiếp đến **user experience** và **app performance**, đặc biệt quan trọng trong việc tối ưu ứng dụng production-level.


## 🔍 2. KHÁI NIỆM CỐT LÕI


### 🎯 isFetching Transition


- **Định nghĩa**: Flag cho biết khi nào request đang được thực hiện trong background
- **So sánh**: Giống như loading spinner, nhưng cho background fetches
- **Vấn đề**: Gây ra 2 lần re-render ngay cả khi data không đổi


### ⚡ notifyOnChangeProps


- **Định nghĩa**: Option cho phép specify fields nào trigger re-render
- **So sánh**: Như React.memo dependencies, nhưng cho React Query observers
- **Cách hoạt động**: Chỉ notify observer khi specified props thay đổi


### 🎪 Tracked Queries


- **Định nghĩa**: Auto-tracking system biết được fields nào component đang sử dụng
- **So sánh**: Như Vue reactivity system - tự động detect dependencies
- **Magic**: Không cần manual configuration, tự optimize


### 🔗 Structural Sharing


- **Định nghĩa**: Mechanism giữ nguyên reference của unchanged data parts
- **So sánh**: Như Git diff - chỉ thay đổi parts thật sự khác
- **Benefit**: Prevent unnecessary re-renders ở component level


## 💡 3. HIỂU BẢN CHẤT


### 🎯 Pain Points được giải quyết:


- **Unnecessary re-renders** khi fetch background data
- **Manual optimization** quá phức tạp và dễ lỗi
- **Performance bottlenecks** trong large applications
- **Developer experience** khi phải track nhiều fields


### ⚙️ Cơ chế hoạt động:


```typescript
// Cơ chế tracking trong React Query
// 1. Observer pattern để watch changes
// 2. Shallow comparison cho từng field
// 3. Reference equality preservation
// 4. Batched notifications
```


### 🚀 Tại sao chọn approach này:


- **Zero-config optimization** cho most use cases
- **Granular control** khi cần fine-tuning
- **Backward compatibility** với existing code
- **Performance by default** principle


## 🛠️ 4. CODE EXAMPLES THỰC TẾ


### 📊 Problem: Unnecessary Re-renders


```typescript
// ❌ Vấn đề: Component re-render 2 lần mặc dù data không đổi
export const useTodosQuery = (select) =>
  useQuery({
    queryKey: ['todos'],
    queryFn: fetchTodos,
    select,
  })

export const useTodosCount = () =>
  useTodosQuery((data) => data.length)

function TodosCount() {
  const todosCount = useTodosCount()
  // Re-render khi isFetching: true → false
  // Mặc dù todosCount.data không thay đổi
  return <div>{todosCount.data}</div>
}
```


### ✅ Solution 1: Manual notifyOnChangeProps


```typescript
// ✅ Giải pháp 1: Chỉ định fields cần observe
export const useTodosQuery = (select, notifyOnChangeProps) =>
  useQuery({
    queryKey: ['todos'],
    queryFn: fetchTodos,
    select,
    notifyOnChangeProps, // Chỉ notify khi specified props change
  })

export const useTodosCount = () =>
  useTodosQuery(
    (data) => data.length,
    ['data'] // Chỉ care về data field, ignore isFetching
  )

function TodosCount() {
  const { error, data } = useTodosCount()
  // ⚠️ Nguy hiểm: Nếu sử dụng error nhưng không declare trong notifyOnChangeProps
  // → Component sẽ không update khi có error!
  return (
    <div>
      {error ? error : null}
      {data ? data : null}
    </div>
  )
}
```


### 🎪 Solution 2: Tracked Queries (Recommended)


```typescript
// ✅ Giải pháp 2: Auto-tracking, zero config
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      notifyOnChangeProps: 'tracked', // Magic! Tự động track
    },
  },
})

function TodosCount() {
  const { error, data, isLoading } = useTodosQuery()

  // React Query tự động biết component đang sử dụng:
  // - error (nếu render conditionally)
  // - data (always used)
  // - isLoading (nếu được access)
  // → Chỉ notify khi những fields này thay đổi

  if (isLoading) return <div>Loading...</div>

  return (
    <div>
      {error ? <span>Error: {error}</span> : null}
      {data ? <span>Count: {data}</span> : null}
    </div>
  )
}
```


### 🔗 Structural Sharing Example


```typescript
// Structural sharing giữ reference của unchanged objects
const previousData = [
  { id: 1, name: "Learn React", status: "active" },
  { id: 2, name: "Learn React Query", status: "todo" }
]

const newData = [
  { id: 1, name: "Learn React", status: "done" }, // Changed
  { id: 2, name: "Learn React Query", status: "todo" } // Unchanged
]

// React Query sẽ:
// - Tạo new reference cho array và object id:1 (vì có thay đổi)
// - Giữ nguyên reference cho object id:2 (không thay đổi)
// → Optimized re-renders cho components sử dụng specific todos
```


## 🔄 5. SO SÁNH & PHÂN BIỆT


```
ApproachƯu điểmNhược điểmUse CaseDefault Behavior✅ Simple, no config❌ Unnecessary re-rendersSmall apps, prototypingManual notifyOnChangeProps✅ Full control, precise❌ Boilerplate, error-proneCritical performance pathsTracked Queries✅ Auto-optimization, safe❌ Slight overhead, limitationsProduction apps (recommended)Structural Sharing✅ Built-in, zero config❌ JSON-serializable onlyDefault cho mọi trường hợp
```


### 🎯 Khi nào dùng approach nào:


```typescript
// 🟢 Tracked Queries - Recommended cho 90% cases
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { notifyOnChangeProps: 'tracked' }
  }
})

// 🟡 Manual - Khi cần extreme optimization
const criticalQuery = useQuery({
  queryKey: ['critical-data'],
  queryFn: fetchCriticalData,
  notifyOnChangeProps: ['data', 'error'] // Chỉ những gì thật sự cần
})

// 🔴 Disable structural sharing - Khi data rất lớn
const bigDataQuery = useQuery({
  queryKey: ['big-data'],
  queryFn: fetchBigData,
  structuralSharing: false // Tránh performance bottleneck
})
```


## 🎯 6. BEST PRACTICES


### ✅ Do's:


```typescript
// ✅ Enable tracked queries globally
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { notifyOnChangeProps: 'tracked' }
  }
})

// ✅ Normal destructuring OK
const { isLoading, data } = useQuery(...)

// ✅ Dependencies in useEffect properly tracked
React.useEffect(() => {
  console.log(queryInfo.data)
}, [queryInfo.data]) // Được track vì access trong render
```


### ❌ Don'ts:


```typescript
// ❌ Object rest destructuring tracks ALL fields
const { isLoading, ...queryInfo } = useQuery(...) // Tracks everything!

// ❌ Access trong effect không được track
const queryInfo = useQuery(...)
React.useEffect(() => {
  console.log(queryInfo.data) // Không được track!
})

// ❌ Once tracked, always tracked
if (someCondition()) {
  // Field sẽ được track cho lifetime của observer
  return <div>{queryInfo.data}</div>
}
```


### ⚡ Performance Considerations:


```typescript
// Large datasets - consider disabling structural sharing
const heavyDataQuery = useQuery({
  queryKey: ['heavy-data'],
  queryFn: fetchHeavyData,
  structuralSharing: false, // Tránh bottleneck
})

// Non-JSON data - structural sharing won't work
const binaryDataQuery = useQuery({
  queryKey: ['binary-data'],
  queryFn: fetchBinaryData,
  structuralSharing: false, // Required cho non-JSON
})
```


## 🚀 7. ỨNG DỤNG THỰC TẾ


### 📊 Dashboard Application:


```typescript
// Real-world dashboard với nhiều widgets
function Dashboard() {
  // Mỗi widget chỉ re-render khi data của nó thay đổi
  return (
    <div className="dashboard">
      <SalesWidget />      {/* Chỉ render khi sales data thay đổi */}
      <UsersWidget />      {/* Chỉ render khi users data thay đổi */}
      <RevenueWidget />    {/* Chỉ render khi revenue data thay đổi */}
    </div>
  )
}

function SalesWidget() {
  // Tracked queries tự động optimize
  const { data: salesData } = useQuery({
    queryKey: ['dashboard', 'sales'],
    queryFn: fetchSalesData,
    refetchInterval: 30000, // Background refetch every 30s
  })

  // Component chỉ re-render khi salesData thật sự thay đổi
  // Không bị ảnh hưởng bởi isFetching của other widgets
  return <Chart data={salesData} />
}
```


### 🛒 E-commerce Integration:


```typescript
// Product listing với real-time inventory
function ProductList() {
  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
    select: (data) => data.filter(p => p.inStock), // Chỉ in-stock products
  })

  return (
    <div>
      {products?.map(product =>
        <ProductCard key={product.id} product={product} />
      )}
    </div>
  )
}

function ProductCard({ product }) {
  // Structural sharing ensures chỉ changed products re-render
  // Unchanged products giữ nguyên reference → memo works perfectly
  return React.memo(() => (
    <div>
      <h3>{product.name}</h3>
      <p>${product.price}</p>
      <span>Stock: {product.stock}</span>
    </div>
  ))
}
```


## 📚 8. KIẾN THỨC LIÊN QUAN


### 🎓 Prerequisites:


- React Hooks và re-rendering cycle
- JavaScript object reference equality
- React.memo và useMemo concepts
- Observer pattern understanding


### 🚀 Advanced Topics:


- React Query devtools profiling
- Custom equality functions
- Suspense integration optimizations
- Server-state vs client-state patterns


### 🔗 Related Technologies:


- SWR comparison và migration patterns
- Zustand/Redux integration strategies
- React 18 Concurrent Features compatibility


## 💼 9. INTERVIEW PERSPECTIVE


### 🎯 Câu hỏi thường gặp:


**Q: "Explain React Query render optimizations"**


```typescript
// ✅ Câu trả lời structured:
/*
1. Problem: Unnecessary re-renders từ isFetching transitions
2. Solutions:
   - notifyOnChangeProps (manual)
   - Tracked queries (automatic)
   - Structural sharing (built-in)
3. Trade-offs: Performance vs complexity vs maintainability
4. Real-world impact: Better UX, reduced battery drain
*/
```


**Q: "When would you disable structural sharing?"**


```typescript
// ✅ Answer with examples:
/*
1. Very large datasets (performance bottleneck)
2. Non-JSON serializable data (Maps, Sets, Dates)
3. Custom equality logic requirements
4. Memory-constrained environments
*/
```


**Q: "Tracked queries limitations?"**


```typescript
// ✅ Demonstrate understanding:
/*
1. Object rest destructuring issue
2. Effect-only access not tracked
3. Once-tracked-always-tracked behavior
4. Slight performance overhead
*/
```


### 💡 Điểm cộng khi demonstrate:


- Hiểu difference giữa render vs commit phases
- Biết khi nào optimize và khi nào không cần
- Reference Kent C. Dodds philosophy: "Fix slow render first"
- Practical examples từ real projects


## 🎪 10. DEMO INTERACTIVE


Tôi đã phân tích toàn diện về **React Query Render Optimizations** dựa trên các tài liệu bạn cung cấp!


## 🎯 Highlights chính của analysis:


### 🔥 Key Concepts được cover:


- **isFetching transitions** - vấn đề gây unnecessary re-renders
- **notifyOnChangeProps** - manual optimization strategy
- **Tracked Queries** - automatic optimization (recommended)
- **Structural Sharing** - reference preservation technique


### 💡 Practical Value:


- Code examples với detailed Vietnamese comments
- Real-world use cases (dashboard, e-commerce)
- Best practices và common pitfalls
- Performance considerations chi tiết


### 🎪 Interactive Demo:


Tôi đã tạo một working demo cho phép bạn:


- So sánh render counts giữa các strategies
- Experiment với different approaches
- Hiểu visually cách mỗi optimization hoạt động
- Test tracked queries simulation


### 💼 Interview Ready:


- Structured answers cho câu hỏi phổ biến
- Technical depth với practical examples
- Understanding của trade-offs và limitations


## 🚀 Next Steps bạn có thể làm:


1. **Experiment** với demo để solidify understanding
2. **Implement** tracked queries trong current project
3. **Practice** explaining concepts cho interview prep
4. **Deep dive** vào React DevTools Profiler để measure impact


Bạn có muốn tôi elaborate thêm về phần nào specific không? Hoặc tạo thêm examples cho use case cụ thể của bạn? 🤔
