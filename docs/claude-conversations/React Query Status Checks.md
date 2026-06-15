# React Query Status Checks

## You

Status Checks in React Query

## Claude


# 📊 Phân Tích: Status Checks trong React Query


## 🎯 1. TÓM TẮT CHÍNH


Bài viết đề cập đến **pattern kiểm tra status trong React Query** và tại sao cách tiếp cận truyền thống (kiểm tra `isPending` và `error` trước) có thể gây ra **UX confusing** khi xử lý background refetch failures. **Vấn đề cốt lõi**: React Query refetch data aggressively ở background, và khi background refetch fails, việc hiển thị error screen thay vì stale data có thể gây ra trải nghiệm user không tốt.


## 🔍 2. KHÁI NIỆM CỐT LÕI


### 🔄 State Machine của React Query


```typescript
// Ba trạng thái chính trong React Query
type QueryStatus =
  | 'success'  // Query thành công, có data
  | 'error'    // Query thất bại, có error được set
  | 'pending'  // Query chưa có data (trước v5 gọi là 'loading')
```


### 🎛️ Flags quan trọng


- **isFetching**: Flag độc lập cho biết có request đang in-flight hay không
- **isPaused**: Derived từ fetchStatus, cho biết query có bị pause không
- **Đặc điểm**: Có thể `fetching + success` hoặc `fetching + error`, nhưng KHÔNG thể `loading + success`


### 🔄 Stale-While-Revalidate Mechanism


React Query áp dụng chiến lược **"luôn show data nếu có, dù data đó stale"** - đây là điểm mạnh giúp UX smooth hơn.


## 💡 3. HIỂU BẢN CHẤT


### 🎯 Pain Point được giải quyết


```typescript
// Vấn đề: User thấy loading -> data -> error screen (confusing!)
// Nguyên nhân: Background refetch fails
// Solution: Check data availability first, không phải status first
```


### ⚙️ Cơ chế hoạt động underlying


React Query có **aggressive refetching** với:


- `refetchOnMount` - Refetch khi component mount
- `refetchOnWindowFocus` - Refetch khi switch tab back
- `refetchOnReconnect` - Refetch khi network reconnect
- **Retry mechanism**: 3 lần với exponential backoff


### 🤔 Tại sao solution này được chọn?


Alternative approaches như manual refetch hoặc no background refetch sẽ dẫn đến **stale data** mà user không biết. React Query balance giữa **data freshness** và **UX consistency**.


## 🛠️ 4. CODE EXAMPLES THỰC TẾ


### ❌ Pattern truyền thống (có vấn đề)


```typescript
const TodoList = () => {
  const todos = useTodos()

  // Kiểm tra pending trước
  if (todos.isPending) {
    return <div>Loading...</div>
  }

  // Kiểm tra error trước data
  if (todos.error) {
    return <div>Error: {todos.error.message}</div> // ❌ Thay thế stale data!
  }

  // Hiển thị data cuối cùng
  return <div>{todos.data.map(renderTodo)}</div>
}
```


**⚠️ Vấn đề**: Khi background refetch fails, user sẽ thấy error screen thay vì stale data họ đang xem.


### ✅ Pattern được recommend (data-first)


```typescript
const TodoList = () => {
  const todos = useTodos()

  // Kiểm tra data availability TRƯỚC
  if (todos.data) {
    return <div>{todos.data.map(renderTodo)}</div> // ✅ Ưu tiên show data
  }

  // Chỉ show error khi KHÔNG có data
  if (todos.error) {
    return <div>Error: {todos.error.message}</div>
  }

  // Loading state cuối cùng
  return <div>Loading...</div>
}
```


### 🎨 Pattern nâng cao với background error indicator


```typescript
const TodoList = () => {
  const todos = useTodos()

  return (
    <div>
      {/* Background error indicator */}
      {todos.error && todos.data && (
        <div className="bg-yellow-100 p-2 mb-4">
          ⚠️ Data có thể không mới nhất. Đang thử kết nối lại...
        </div>
      )}

      {/* Hiển thị data nếu có */}
      {todos.data ? (
        <div>{todos.data.map(renderTodo)}</div>
      ) : todos.error ? (
        <div>Error: {todos.error.message}</div>
      ) : (
        <div>Loading...</div>
      )}
    </div>
  )
}
```


## 🔄 5. SO SÁNH & PHÂN BIỆT


```
ApproachƯu điểmNhược điểmKhi nào dùngStatus-firstLogic đơn giản, dễ hiểuUX jerky khi background refetch failsApps ít background refetchData-firstUX smooth, không mất dataCó thể miss error states quan trọngMost production appsHybridBest of both worldsCode phức tạp hơnCritical data applications
```


### 🆚 So sánh với other data fetching solutions


```typescript
// Traditional fetch (no background refetch)
const [data, setData] = useState(null)
const [loading, setLoading] = useState(true)
const [error, setError] = useState(null)

// React Query (with aggressive background refetch)
const { data, isPending, error, isFetching } = useQuery(...)
```


## 🎯 6. BEST PRACTICES


### ✅ Do's


```typescript
// 1. Luôn consider stale data có valuable không
if (query.data) {
  return <ShowData data={query.data} />
}

// 2. Provide background loading indicators
{query.isFetching && <Spinner className="absolute top-2 right-2" />}

// 3. Handle different error types differently
if (query.error?.name === 'NetworkError' && query.data) {
  // Show stale data với network warning
} else if (query.error && !query.data) {
  // Show full error screen
}
```


### ❌ Don'ts


```typescript
// 1. Đừng blind follow tutorial examples
if (isPending) return 'Loading...' // ❌ Không phù hợp mọi case

// 2. Đừng ignore background fetch status
// ❌ User không biết data có fresh không

// 3. Đừng over-engineer cho simple use cases
// ❌ Không phải lúc nào cũng cần complex error handling
```


### ⚡ Performance Considerations


- **Stale time**: Set appropriate `staleTime` để giảm unnecessary refetches
- **Cache time**: Configure `cacheTime` phù hợp với data lifecycle
- **Background refetch**: Disable nếu data không cần real-time


## 🚀 7. ỨNG DỤNG THỰC TẾ


### 🛒 E-commerce Application


```typescript
const ProductList = () => {
  const { data: products, error, isFetching } = useProducts()

  return (
    <div>
      {/* Hiển thị products dù background refetch fails */}
      {products ? (
        <>
          {isFetching && <RefreshIndicator />}
          <ProductGrid products={products} />
        </>
      ) : error ? (
        <ErrorFallback error={error} />
      ) : (
        <ProductSkeleton />
      )}
    </div>
  )
}
```


### 📊 Dashboard với Real-time Data


```typescript
const MetricsDashboard = () => {
  const { data: metrics, error, dataUpdatedAt } = useMetrics({
    refetchInterval: 5000 // Refetch every 5s
  })

  const isStale = Date.now() - dataUpdatedAt > 10000 // 10s threshold

  return (
    <div>
      {metrics && (
        <>
          <MetricsCards data={metrics} />
          {isStale && <StaleDataWarning />}
        </>
      )}
      {error && !metrics && <DashboardError />}
    </div>
  )
}
```


## 📚 8. KIẾN THỨC LIÊN QUAN


### 📋 Prerequisites cần biết


- React Hooks fundamentals
- Promise-based API calls
- State management concepts
- Error boundary patterns


### 🔗 Advanced topics để tìm hiểu tiếp


- **Optimistic Updates** với React Query
- **Infinite Queries** cho pagination
- **Query Invalidation** strategies
- **Offline React Query** với network status


### 🛠️ Related technologies


- **SWR**: Alternative với similar philosophy
- **Apollo Client**: GraphQL-specific solution
- **Zustand/Redux**: State management integration


## 💼 9. INTERVIEW PERSPECTIVE


### ❓ Câu hỏi interview có thể gặp


**Q1**: "Explain the difference between `isPending` and `isFetching` in React Query"


```typescript
// Câu trả lời professional:
isPending: true khi query chưa có data lần nào (initial load)
isFetching: true khi có request đang chạy (kể cả background refetch)

// Có thể có state: { isPending: false, isFetching: true, data: [...] }
```


**Q2**: "How would you handle a scenario where background refetch fails but you have stale data?"


```typescript
// Show expertise:
"Depends on use case. For non-critical data, show stale data với indicator.
For critical data như financial info, might show error với retry option.
Key là balance giữa UX smoothness và data accuracy."
```


**Q3**: "What are the trade-offs of aggressive background refetching?"


```typescript
// Demonstrate understanding:
"Pros: Always fresh data, good UX khi có network
Cons: Increased bandwidth, potential UX confusion nếu handle poorly
Solution: Smart staleTime config và proper error handling"
```


### 🏆 Điểm cộng khi demonstrate knowledge


- Hiểu rõ **stale-while-revalidate** pattern
- Biết cách **balance UX vs data freshness**
- Có experience với **real-world edge cases**
- Understand **performance implications**


## 🎪 10. DEMO INTERACTIVE


Tôi sẽ tạo một demo để bạn có thể experiment với các patterns khác nhau:


Tôi đã phân tích chi tiết bài viết về **Status Checks trong React Query** theo đúng format bạn yêu cầu với đầy đủ 10 sections bằng tiếng Việt, từ khái niệm cốt lõi đến demo interactive.


**Highlights của analysis:**


🎯 **Key insight**: Đây là về **pattern kiểm tra status** và tại sao cách traditional (check `isPending`/`error` trước) có thể gây **UX confusing** khi background refetch fails.


🛠️ **Core solution**: **Data-first pattern** - ưu tiên show data nếu có, thay vì status-first.


🎪 **Interactive demo**: Tôi đã tạo working demo để bạn experiment với cả 2 patterns và thấy rõ behavior differences.


**Có điều gì specific bạn muốn tôi:**


- Deep dive thêm vào aspect nào?
- Giải thích chi tiết hơn phần nào?
- Thêm use cases cho industry/domain cụ thể?
- Modify demo để test scenarios khác?


Hoặc bạn muốn apply format này để analyze một bài viết Juejin.cn khác? 🚀
