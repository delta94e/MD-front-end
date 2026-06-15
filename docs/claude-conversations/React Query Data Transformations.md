# React Query Data Transformations

## You

#2: React Query Data Transformations

## Claude


# 🎯 PHÂN TÍCH CHUYÊN SÂU: React Query Data Transformations


## 📝 1. TÓM TẮT CHÍNH


Bài viết này giải quyết một vấn đề cực kỳ phổ biến trong frontend development: **Làm thế nào để transform data hiệu quả khi sử dụng React Query?**


Vấn đề này quan trọng vì trong thực tế, data từ backend (đặc biệt là REST APIs) hiếm khi có format chính xác như frontend cần. Developer cần có strategy rõ ràng để transform data mà vẫn đảm bảo performance và maintainability.


---


## 🔍 2. KHÁI NIỆM CỐT LÕI


### 🎯 Data Transformation trong React Query


- **Định nghĩa**: Quá trình chuyển đổi cấu trúc data từ format mà backend trả về thành format mà frontend component cần sử dụng
- **Tương tự như**: Việc "dịch thuật" giữa hai ngôn ngữ khác nhau - backend "nói" một kiểu, frontend "hiểu" một kiểu khác


### 🔧 4 Approaches chính:


```
ApproachVị trí thực hiệnTimingBackendServer-sideTrước khi gửi responseQueryFnTrong function fetchSau khi nhận data, trước khi cacheRender FunctionTrong custom hookMỗi lần component renderSelect OptionTrong useQuery configKhi data thay đổi hoặc selector thay đổi
```


---


## 💡 3. HIỂU BẢN CHẤT


### 🎯 Pain Points được giải quyết:


- **Mismatch giữa API structure và UI requirements**
- **Performance issues** khi transform data không đúng chỗ
- **Code duplication** khi cùng một transformation logic scattered khắp app
- **Caching efficiency** - transform ở đâu để optimize cache hits


### ⚙️ Cơ chế hoạt động underlying:


React Query có **query cache** làm trung tâm. Tùy vào approach, data được transform:


- **Trước khi vào cache** (queryFn)
- **Sau khi ra khỏi cache** (render/select)


### 🤔 Tại sao cần nhiều approaches?


Không có "one-size-fits-all solution". Mỗi approach phù hợp với scenarios khác nhau về performance, flexibility, và team structure.


---


## 🛠️ 4. CODE EXAMPLES THỰC TẾ


### Approach 1: Transform trong QueryFn


### Approach 2: Transform trong Render Function


### Approach 3: Transform bằng Select Option


### Approach 0: Transform trên Backend


---


## 🔄 5. SO SÁNH & PHÂN BIỆT


### 📊 Bảng so sánh chi tiết:


```
CriteriaBackendQueryFnRender FunctionSelect Option🚀 Performance⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐🔧 Flexibility⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐💾 Caching Efficiency⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐🐛 Debugging⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐🔄 Reusability⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐
```


### 🎯 Khi nào nên dùng approach nào:


**🏆 Backend Transformation:**


- ✅ Enterprise apps với dedicated backend team
- ✅ Multiple clients (web, mobile) cần cùng format
- ✅ Performance critical applications
- ❌ Public APIs không control được


**⚙️ QueryFn Transformation:**


- ✅ Shared API layer cho phép modify
- ✅ One-time transformation cho toàn bộ data
- ✅ Simple, straightforward transformations
- ❌ Expensive transformations (chạy mỗi fetch)


**🎨 Render Function:**


- ✅ Complex business logic kết hợp với transformation
- ✅ Dynamic transformations based on props/state
- ✅ Prototype và development phase
- ❌ High-frequency re-renders


**🔍 Select Option:**


- ✅ Performance-critical applications
- ✅ Partial subscriptions (chỉ subscribe một phần data)
- ✅ Multiple components cần different views của cùng data
- ✅ Expensive transformations cần optimize


---


## 🎯 6. BEST PRACTICES


### ⚡ Performance Optimization:


---


## 🚀 7. ỨNG DỤNG THỰC TẾ


### 💼 Use Cases trong Real-World Projects:


**🛒 E-commerce Platform:**


```typescript
// Scenario: Product data từ API có structure phức tạp, cần flatten cho UI
const useProductsForListing = () => useQuery({
  queryKey: ['products', 'listing'],
  queryFn: fetchProducts,
  select: (products) => products.map(product => ({
    id: product.id,
    name: product.attributes.display_name,
    price: product.pricing.final_price,
    discountPercent: calculateDiscount(product.pricing),
    image: product.media.images[0]?.url,
    inStock: product.inventory.quantity > 0,
    rating: product.reviews.average_rating,
  }))
});
```


**📊 Analytics Dashboard:**


```typescript
// Scenario: Cần aggregate và format data cho charts
const useAnalyticsData = (timeRange: string) => useQuery({
  queryKey: ['analytics', timeRange],
  queryFn: () => fetchAnalytics(timeRange),
  select: (rawData) => ({
    // Transform cho Chart.js
    chartData: {
      labels: rawData.map(d => formatDate(d.date)),
      datasets: [{
        data: rawData.map(d => d.revenue),
        backgroundColor: rawData.map(d => d.revenue > 10000 ? 'green' : 'orange')
      }]
    },
    // Summary stats
    totalRevenue: rawData.reduce((sum, d) => sum + d.revenue, 0),
    avgOrderValue: calculateAverage(rawData.map(d => d.avg_order)),
    topProducts: rawData.flatMap(d => d.products).slice(0, 5)
  })
});
```


### 🔧 Integration với Frameworks:


**📱 Next.js với Server-Side Rendering:**


```typescript
// pages/todos.tsx
export const getServerSideProps = async () => {
  const queryClient = new QueryClient();

  // Pre-fetch và transform data ở server
  await queryClient.prefetchQuery({
    queryKey: ['todos'],
    queryFn: fetchTodos,
    select: transformTodosForSSR, // Backend transform
  });

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
    },
  };
};
```


**⚡ Micro-frontends Architecture:**


```typescript
// Shared data layer cho multiple micro-frontends
export const createSharedTodoQuery = (baseUrl: string) => ({
  queryKey: ['todos', baseUrl],
  queryFn: () => fetchTodos(baseUrl),
  select: (data) => standardizeDataFormat(data), // Consistent format across apps
});
```


### 📊 Scalability Considerations:


---


## 📚 8. KIẾN THỨC LIÊN QUAN


### 🔍 Prerequisites cần biết trước:


**📦 React Query/TanStack Query Foundation:**


- Query caching mechanism
- Stale-while-revalidate strategy
- Query invalidation và refetching
- Loading states và error handling


**⚛️ React Fundamentals:**


- useCallback và useMemo optimization
- Custom hooks patterns
- Component re-rendering behavior
- State management concepts


**📊 Data Flow Patterns:**


- Observer pattern trong state management
- Immutability principles
- Functional programming concepts (map, filter, reduce)


### 🚀 Advanced topics để tìm hiểu tiếp:


**🔧 Query Optimization:**


```typescript
// Structural sharing optimization
const optimizedSelector = React.useCallback((data: Todo[]) => ({
  todos: data,
  completedCount: data.filter(t => t.completed).length,
  // React Query sẽ chỉ trigger re-render nếu result thực sự khác
}), []);
```


**🎯 Parallel Transformations:**


```typescript
// Transform multiple queries simultaneously
const useTransformedData = () => {
  const todos = useTodosQuery();
  const users = useUsersQuery();

  return React.useMemo(() => ({
    enrichedTodos: todos.data?.map(todo => ({
      ...todo,
      assignee: users.data?.find(u => u.id === todo.userId)
    }))
  }), [todos.data, users.data]);
};
```


### 🌐 Related Technologies:


**🏗️ GraphQL Integration:**


- Apollo Client transformers
- Relay-style pagination với transforms
- Schema stitching patterns


**📱 React Native Considerations:**


- Platform-specific transformations
- Performance optimization trên mobile
- Memory management với large datasets


---


## 💼 9. INTERVIEW PERSPECTIVE


### ❓ Câu hỏi interview có thể gặp:


**🎯 Technical Questions:**


1. **"Explain different ways to transform data in React Query and their trade-offs."**
✅ CÂU TRẢ LỜI SAMPLE:

"Có 4 approaches chính:

1. Backend transformation - ideal nhất vì zero performance cost
   trên frontend, nhưng cần control backend

2. QueryFn transformation - data được transform trước khi cache,
   phù hợp với simple transforms nhưng chạy mỗi lần fetch

3. Render function transformation - flexible nhất, có thể combine
   với business logic, nhưng cần careful với memoization

4. Select option - best performance với built-in optimization,
   hỗ trợ partial subscriptions, là preferred approach trong
   hầu hết cases

Trade-offs chính là giữa performance vs flexibility vs maintainability."
2. **"How would you optimize expensive data transformations?"**
✅ STRATEGIES:

- Sử dụng select option với stable function references
- Implement memoization với correct dependencies
- Consider moving expensive logic to Web Workers
- Cache transformation results nếu data không đổi often
- Use incremental transformations cho large datasets
- Profile performance để identify bottlenecks
3. **"What are the pitfalls of data transformation in React Query?"**
✅ COMMON PITFALLS:

- Inline functions trong select causing unnecessary re-runs
- Wrong useMemo dependencies leading to stale data
- Mutating original data instead of creating new objects
- Forgetting to handle undefined data trong render transforms
- Over-transforming data that could be done once in backend
- Not considering the cost of re-transformations


### 🏆 Câu hỏi Advanced:


**"Design a data transformation system for a large-scale application with multiple data sources and complex UI requirements."**


---


## 🎪 10. DEMO INTERACTIVE


## 🎉 TỔNG KẾT & TAKEAWAYS


Vậy là chúng ta đã deep dive complete vào **React Query Data Transformations** - một topic cực kỳ practical và quan trọng trong modern frontend development!


### 🎯 Key Insights:


**💡 Không có "silver bullet"** - Mỗi approach có trade-offs riêng, choose based on context:


- **Backend Transform** = Zero frontend cost nhưng cần backend control
- **QueryFn Transform** = Simple implementation nhưng performance cost
- **Render Transform** = Maximum flexibility nhưng complexity tăng
- **Select Option** = Best performance với built-in optimizations


**⚡ Performance matters** - Wrong approach có thể kill app performance:


- Inline functions trong select = disaster
- Expensive transforms without memoization = lag city
- Transform 10,000 items mỗi render = users chạy đi


**🏗️ Architecture thinking** - Data transformation là foundational decision:


- Affects caching strategy
- Impacts debugging experience
- Determines scalability limits
- Influences team workflow


### 🚀 Next Steps để Master Topic này:


1. **Practice với demo interactive** ↑ để feel sự khác biệt
2. **Implement trong side project** với real API data
3. **Measure performance** với React DevTools Profiler
4. **Study advanced patterns** như structural sharing trong TanStack Query v5
5. **Read source code** của React Query để hiểu internals


### 💼 Career Impact:


Hiểu sâu về data transformation sẽ giúp bạn:


- **Stand out trong interviews** với system design knowledge
- **Write more performant applications**
- **Debug data issues faster** khi biết data flow
- **Make better architectural decisions** trong large codebases


Đây chính là kiểu knowledge giúp phân biệt **Senior Engineer** vs **Code Monkey** - không chỉ biết code mà còn hiểu why, when, và how để choose right tool for right job! 🎯


*Happy coding và remember: "Premature optimization is root of all evil, but knowing your options is root of all good decisions!"* 😄
