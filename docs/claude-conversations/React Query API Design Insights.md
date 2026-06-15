# React Query API Design Insights

## You

#27: React Query API Design - Lessons Learned

## Claude


Tôi thấy bạn đã cung cấp transcript của một bài talk về React Query API Design từ Dominik (maintainer của React Query), nhưng tôi cần lưu ý rằng đây không phải là bài viết từ Juejin.cn như trong prompt template. Tuy nhiên, tôi sẽ phân tích nội dung này theo cấu trúc bạn yêu cầu vì đây là một chủ đề rất hay và valuable!


## 🎯 TÓM TẮT CHÍNH


**React Query API Design - Lessons Learned** là bài talk của Dominik Dorfmeister, maintainer chính của React Query trong 3.5 năm qua. Bài talk chia sẻ journey thiết kế API của React Query, từ những quyết định thành công đến những mistake đã mắc phải, và bài học về việc balance giữa simplicity vs flexibility trong open source library design.


**Tại sao quan trọng?** API design quyết định success hay failure của một library. React Query thành công phần lớn nhờ API design tốt - vừa easy to use cho beginners, vừa powerful cho advanced use cases.


## 🔍 KHÁI NIỆM CỐT LÕI


### 1. API Complexity Spectrum


- **Simple APIs**: Như `Array.join()` - làm 1 việc, làm tốt, không surprise
- **Complex APIs**: Như `Array.reduce()` - very powerful nhưng hard to understand
- **Library APIs**: Cần balance giữa minimal/intuitive vs powerful/flexible


### 2. Application Complexity Scale


API complexity nên grow theo application complexity:


- **Basic level**: `useQuery(key, fn)` - 80% value với minimal effort
- **Intermediate**: Add `useMutation` + `invalidateQueries`
- **Advanced**: Optimistic updates, infinite queries
- **Expert**: Cache subscriptions, plugins


### 3. Inversion of Control (IoC)


Thay vì add thêm options, cho phép users pass functions để customize behavior:


```typescript
// Thay vì: refetchOnWindowFocusIfError: boolean
// Dùng: refetchOnWindowFocus: (query) => boolean
refetchOnWindowFocus: (query) => query.state.status !== 'error'
```


### 4. TypeScript-First Design


Design APIs với types từ đầu thay vì add types sau. JavaScript dynamic constructs often hard to type later.


## 💡 HIỂU BẢN CHẤT


### Pain Points mà React Query solve:


1. **Caching complexity** - Auto handle cache, deduplication, background updates
2. **State management** - Loading, error, success states out of the box
3. **Performance** - Automatic garbage collection, intelligent refetching
4. **Developer Experience** - TypeScript support, devtools integration


### Underlying mechanism:


React Query hoạt động như một sophisticated caching layer với state machine, quản lý entire lifecycle của data fetching từ initial load đến background updates.


### Tại sao choose React Query over alternatives:


- **SWR**: React Query có more features (mutations, devtools, plugins)
- **Apollo**: Lighter weight, không require GraphQL
- **Manual useState/useEffect**: Eliminate boilerplate, handle edge cases automatically


## 🛠️ CODE EXAMPLES THỰC TẾ


## 🔄 SO SÁNH & PHÂN BIỆT


### React Query vs Alternatives:


```
AspectReact QuerySWRApollo ClientManual useState/useEffectLearning CurveModerateEasySteepEasyBundle Size~13kb~4kb~33kb0kbFeaturesRich ecosystemMinimal but solidGraphQL-focusedBasicTypeScriptExcellentGoodGoodManual typingDevtoolsOutstandingBasicGoodNoneMutationsFirst-classManualBuilt-inManual
```


### V3 vs V4 vs V5 API Changes:


**V3 (Original):**


```typescript
// Multiple ways to call - confusing!
useQuery(key, fn)
useQuery(key, fn, options)
useQuery(options)
```


**V4 (Breaking change problem):**


```typescript
// Disabled queries có isLoading = true (bad!)
const { isLoading } = useQuery({
  queryKey: ['todos', filter],
  queryFn: fetchTodos,
  enabled: !!filter // Nếu filter empty, isLoading vẫn = true
});
```


**V5 (Fixed):**


```typescript
// Single options object, fixed disabled state
const { isLoading } = useQuery({
  queryKey: ['todos', filter],
  queryFn: fetchTodos,
  enabled: !!filter // Disabled queries không set isLoading = true
});
```


## 🎯 BEST PRACTICES


### 1. Query Key Design


```typescript
// ❌ Avoid nested objects trong query keys
queryKey: [{ type: 'todos', filter: 'completed' }]

// ✅ Use flat array structure
queryKey: ['todos', 'completed']

// ✅ Use object ở cuối nếu cần
queryKey: ['todos', { status: 'completed', page: 1 }]
```


### 2. Error Handling Strategy


```typescript
// Global error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Không retry 4xx errors
        if (error.status >= 400 && error.status < 500) return false;
        return failureCount < 3;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Component-level error handling
const { data, error, isError } = useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
  throwOnError: true, // Throw to ErrorBoundary
});
```


### 3. Performance Optimization


```typescript
// Selective re-rendering với select
const todoCount = useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
  select: (data) => data.length, // Only re-render khi count changes
});

// Prefetching cho better UX
const prefetchTodo = useCallback((id) => {
  queryClient.prefetchQuery({
    queryKey: ['todo', id],
    queryFn: () => fetchTodo(id),
    staleTime: 10 * 1000,
  });
}, [queryClient]);
```


## 🚀 ỨNG DỤNG THỰC TẾ


### 1. E-commerce Product Catalog


```typescript
// Product listing với pagination
const useProducts = (page, filters) => {
  return useQuery({
    queryKey: ['products', page, filters],
    queryFn: () => fetchProducts({ page, ...filters }),
    keepPreviousData: true, // Smooth pagination
    staleTime: 5 * 60 * 1000,
  });
};

// Product details với related products
const useProductDetail = (productId) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['product', productId],
    queryFn: () => fetchProduct(productId),
    onSuccess: (product) => {
      // Prefetch related products
      product.relatedIds.forEach(id => {
        queryClient.prefetchQuery({
          queryKey: ['product', id],
          queryFn: () => fetchProduct(id),
        });
      });
    },
  });
};
```


### 2. Real-time Dashboard


```typescript
// Auto-refresh dashboard data
const useDashboardData = () => {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboardData,
    refetchInterval: 30 * 1000, // Refresh every 30s
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });
};

// WebSocket integration
const useRealtimeUpdates = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const ws = new WebSocket('/ws/updates');

    ws.onmessage = (event) => {
      const update = JSON.parse(event.data);

      // Update cache based on WebSocket message
      queryClient.setQueryData(['dashboard'], (old) => ({
        ...old,
        ...update
      }));
    };

    return () => ws.close();
  }, [queryClient]);
};
```


## 📚 KIẾN THỨC LIÊN QUAN


### Prerequisites:


- React Hooks (useState, useEffect, useContext)
- JavaScript Promises & async/await
- HTTP fundamentals (REST, status codes)
- TypeScript basics (generics, utility types)


### Advanced Topics:


- **Parallel Queries**: `useQueries` cho multiple queries
- **Dependent Queries**: Chain queries với `enabled` option
- **Background Updates**: `refetchInterval`, `refetchOnWindowFocus`
- **SSR/SSG**: `dehydrate`/`hydrate` cho server-side rendering
- **Custom Hooks**: Abstract business logic
- **Query Cancellation**: AbortController integration


### Related Technologies:


- **Zustand/Redux**: Global state management alongside React Query
- **MSW**: Mock Service Worker cho testing
- **React Router**: Route-based data loading
- **Next.js**: Built-in SWR, but React Query works great too


## 💼 INTERVIEW PERSPECTIVE


### Câu hỏi thường gặp:


**Q: "Tại sao chọn React Query thay vì tự implement với useEffect?"**


**A:** "React Query solve nhiều edge cases mà manual implementation thường miss:


- Cache management và garbage collection
- Race condition handling
- Background refetch strategies
- Error retry logic với exponential backoff
- Request deduplication
- Optimistic updates với rollback
- DevTools cho debugging


Tự implement những features này sẽ mất rất nhiều time và prone to bugs."


**Q: "React Query vs Redux Toolkit Query khác nhau như thế nào?"**


**A:** "RTK Query là part của Redux ecosystem, tốt nếu app đã dùng Redux. React Query là standalone, flexible hơn:


- React Query: Framework-agnostic, works với any state management
- RTK Query: Tied to Redux, code generation features
- React Query: Better TypeScript support, more features like infinite queries
- RTK Query: Smaller bundle nếu đã có Redux


Choice depends on existing architecture và team preferences."


**Q: "Cách handle race conditions trong React Query?"**


**A:** "React Query handle race conditions automatically:


- Automatic request cancellation khi component unmount
- Latest request wins strategy
- Query cancellation với AbortController
- Có thể customize với queryFn cancellation logic


Example:


```typescript
queryFn: async ({ signal }) => {
  const response = await fetch('/api/data', { signal });
  return response.json();
}
```


Signal được React Query provide để cancel request nếu cần."


### Điểm cộng khi demonstrate:


- Hiểu được caching strategies và trade-offs
- Biết khi nào nên invalidate vs refetch vs background update
- Am hiểu TypeScript integration
- Experience với performance optimization patterns
- Knowledge về testing strategies với mocked data


Bài talk này từ Dominik cung cấp insider view về challenges của API design trong open source. Key takeaway là balance giữa simplicity cho beginners và power cho advanced users, cùng với importance của community feedback trong shaping APIs! 🚀
