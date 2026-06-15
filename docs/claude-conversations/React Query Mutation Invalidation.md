# React Query Mutation Invalidation

## You

Automatic Query Invalidation after Mutations

## Claude


# 🎯 Phân Tích: Automatic Query Invalidation after Mutations trong React Query


## 📝 TÓM TẮT CHÍNH


Bài viết giải thích tại sao **React Query không tự động liên kết Mutations với Queries** và cách implement **automatic invalidation** sau khi mutations hoàn thành. Đây là một vấn đề cốt lõi trong data management - làm sao để UI luôn sync với server state sau khi user thực hiện các actions thay đổi dữ liệu.


## 🔍 KHÁI NIỆM CỐT LÕI


### Query vs Mutation


- **Query**: Đọc dữ liệu bất đồng bộ (thường là data fetching)
- **Mutation**: Action để update dữ liệu/resource


### Query Invalidation


- **Invalidation ≠ Refetch**: Invalidation chỉ đánh dấu queries là "stale" và chỉ refetch những queries đang active
- **Active Queries**: Những queries hiện đang được sử dụng trên màn hình
- **Stale Queries**: Những queries được đánh dấu cần update, sẽ refetch khi được sử dụng tiếp


### Global Cache Callbacks


- Callbacks chạy cho **tất cả mutations** trong app thay vì từng mutation riêng lẻ
- Giống như middleware pattern - intercept mọi mutation để xử lý logic chung


## 💡 HIỂU BẢN CHẤT


### Pain Point Developer


```js
// ❌ Vấn đề thường gặp:
const updateIssue = useMutation(updateIssueFn)
const issues = useQuery(['issues'], fetchIssues)

// Sau khi update issue, list issues không được cập nhật tự động
// Developer phải manual invalidate ở mỗi nơi sử dụng
```


### Tại sao React Query không build-in automatic invalidation?


1. **Flexibility**: Không phải ai cũng muốn refetch sau mutation
2. **Performance**: Có thể mutation trả về updated data, không cần refetch
3. **Diverse strategies**: Có nhiều cách invalidate khác nhau tùy use case


### Solution Architecture


```js
// 🎯 Global callback pattern
MutationCache → onSuccess → queryClient.invalidateQueries()
     ↓
All mutations trigger automatic invalidation
```


## 🛠️ CODE EXAMPLES THỰC TẾ


### 1. Basic Automatic Invalidation


### 2. Advanced Strategies - MutationKey Approach


### 3. Meta-based Strategy với TypeScript Support


## 🔄 SO SÁNH & PHÂN BIỆT


### Manual vs Automatic Invalidation


```
ApproachƯu điểmNhược điểmKhi nào dùngManual InvalidationControl hoàn toàn, optimize performanceDễ quên, code repetitive, maintenance hellSimple apps, specific casesGlobal Auto InvalidationSimple setup, never miss invalidationCó thể over-fetchMedium-large apps, safety-firstSelective Auto InvalidationBest of both worldsComplex setup, learning curveLarge apps, performance critical
```


### Strategies Comparison


```js
// ❌ Manual approach - ERROR PRONE
const updateIssue = useMutation({
  mutationFn: updateIssueFn,
  onSuccess: () => {
    // Dễ quên invalidate related queries
    queryClient.invalidateQueries(['issues'])
    // Quên ['issues', 'stats'], ['labels'] affected by issue changes
  }
})

// ✅ Global approach - SIMPLE & SAFE
// Global callback tự động handle tất cả

// 🎯 Selective approach - OPTIMAL & COMPLEX
const updateIssue = useMutation({
  mutationFn: updateIssueFn,
  meta: {
    invalidates: [['issues'], ['labels'], ['stats']]
  }
})
```


## 🎯 BEST PRACTICES


### ⚡ Performance Considerations


```js
// ✅ DO: Sử dụng staleTime để reduce unnecessary refetch
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000, // 2 minutes - data còn fresh
      cacheTime: 5 * 60 * 1000, // 5 minutes - keep in memory
    },
  },
})

// ✅ DO: Exclude static queries khỏi invalidation
const excludeStaticQueries = (query) => {
  const staleTime = query.observers[0]?.options.staleTime
  return staleTime !== Number.POSITIVE_INFINITY
}

queryClient.invalidateQueries({
  predicate: excludeStaticQueries
})
```


### 🚫 Common Mistakes


```js
// ❌ DON'T: Invalidate trong onError - có thể cause infinite loop
onError: () => {
  queryClient.invalidateQueries() // Wrong!
}

// ❌ DON'T: Await tất cả invalidations - slow UX
onSuccess: async () => {
  await queryClient.invalidateQueries() // Slow!
}

// ✅ DO: Chỉ await critical queries
onSuccess: async () => {
  // Fire-and-forget cho most queries
  queryClient.invalidateQueries()

  // Chỉ await critical ones
  return queryClient.invalidateQueries(['user-profile'])
}
```


### 📊 Monitoring & Debugging


```js
// ✅ DO: Add logging để monitor invalidation patterns
const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onSuccess: (_data, _variables, _context, mutation) => {
      const startTime = Date.now()

      queryClient.invalidateQueries()

      // Track performance impact
      console.log(`Invalidation took: ${Date.now() - startTime}ms`)
      console.log(`Active queries: ${queryClient.getQueryCache().getAll().filter(q => q.getObserversCount() > 0).length}`)
    },
  }),
})
```


## 🚀 ỨNG DỤNG THỰC TẾ


### E-commerce Platform


```js
// 🛒 Shopping cart mutations affect nhiều domains
const addToCart = useMutation({
  mutationFn: addToCartFn,
  meta: {
    invalidates: [
      ['cart'],           // Cart items
      ['products'],       // Product availability
      ['recommendations'], // Update recommendations
      ['user', 'profile'] // User shopping history
    ],
    awaits: ['cart']      // UI wait for cart update
  }
})
```


### Project Management Tool


```js
// 📋 Task updates ripple through multiple views
const updateTask = useMutation({
  mutationFn: updateTaskFn,
  meta: {
    invalidates: [
      ['tasks'],          // Task lists
      ['projects'],       // Project progress
      ['team'],           // Team workload
      ['notifications'],  // Task notifications
      ['reports']         // Analytics reports
    ],
    awaits: ['tasks']     // Wait for task list update
  }
})
```


### Social Media App


```js
// 💬 Comment/like mutations affect feeds
const likePost = useMutation({
  mutationFn: likePostFn,
  meta: {
    invalidates: [
      ['feed'],           // Main feed
      ['posts'],          // Post details
      ['user-activity'],  // User activity log
      ['trending']        // Trending content
    ]
    // Không await - UX phải fast cho social actions
  }
})
```


## 📚 KIẾN THỨC LIÊN QUAN


### Prerequisites cần biết


- ✅ React Query/TanStack Query basics
- ✅ JavaScript Promises & async/await
- ✅ React hooks pattern
- ✅ State management concepts


### Advanced topics để research tiếp


- 🔄 **Optimistic Updates**: Update UI immediately, rollback if needed
- 🎯 **Query Invalidation Patterns**: Advanced patterns cho complex apps
- ⚡ **Background Refetching**: Strategy cho background data syncing
- 🔀 **Mutation Side Effects**: Handle complex side effects
- 🎪 **React Query DevTools**: Debug và monitor queries


### Related Technologies


- **SWR**: Alternative library với similar concepts
- **Apollo Client**: GraphQL equivalent với automatic cache updates
- **Redux Toolkit Query**: Redux-based data fetching
- **Relay**: Facebook's GraphQL client với sophisticated caching


## 💼 INTERVIEW PERSPECTIVE


### 🎯 Câu hỏi Interview thường gặp


**Q1: "Explain cách React Query handle data synchronization after mutations"**


**💡 Professional Answer:**


>
> "React Query không tự động link mutations với queries để maintain flexibility. Thay vào đó, chúng ta có thể implement automatic invalidation qua Global Cache Callbacks. Có 3 strategies chính: invalidate all (simple), mutation-key based (moderate), và meta-driven (advanced). Trade-off giữa simplicity vs performance optimization."
>
>


**Q2: "Khi nào bạn choose global invalidation vs selective invalidation?"**


**💡 Professional Answer:**


>
> "Global invalidation phù hợp với medium apps khi simplicity quan trọng hơn performance. Selective invalidation cho large apps với performance requirements cao. Factors quyết định: app size, query complexity, network constraints, và team experience với React Query."
>
>


**Q3: "Explain difference giữa invalidation và refetch"**


**💡 Professional Answer:**


>
> "Invalidation chỉ mark queries as stale, không immediate refetch. Chỉ active queries được refetch ngay lập tức. Inactive queries được refetch khi cần. Đây là optimization quan trọng để avoid unnecessary network requests."
>
>


### 🔥 Bonus Points khi demonstrate:


- Hiểu được cache invalidation strategies
- Có experience với performance optimization
- Biết cách debug React Query issues
- Understand trade-offs của different approaches


## 🎪 DEMO INTERACTIVE


---


## 🎓 KẾT LUẬN & TAKEAWAYS


### 🎯 Bottom Line Up Front


React Query's automatic invalidation pattern giải quyết được **data synchronization hell** trong modern apps. Có 3 strategies chính: **Manual** (simple nhưng error-prone), **Global Auto** (safe nhưng có thể over-fetch), và **Selective** (optimal nhưng complex). Lựa chọn strategy phụ thuộc vào app size, performance requirements, và team experience.


### 🚀 Action Items để implement ngay:


1. **Start simple:** Implement global auto invalidation trước
2. **Add monitoring:** Log invalidation patterns để understand behavior
3. **Optimize gradually:** Chuyển sang selective strategy khi needed
4. **Test thoroughly:** Ensure UI sync properly sau mọi mutations


### 💎 Key Insights


- **Invalidation ≠ Refetch**: Chỉ active queries được refetch ngay lập tức
- **Trade-off mindset**: Không có perfect solution, chỉ có optimal solution cho context
- **Performance impact minimal**: Với proper staleTime, over-invalidation không đáng lo
- **Developer Experience matters**: Simple global strategy thường better than complex selective strategy


### 🔮 Next Steps Learning Path


1. **Practice** với demo interactive above
2. **Implement** trong side project để get hands-on experience
3. **Explore** React Query DevTools để debug queries
4. **Study** Optimistic Updates pattern cho advanced UX
5. **Learn** về Background Refetching strategies


---


**💬 Có questions gì về React Query invalidation strategies không? Feel free to ask để dive deeper vào bất kỳ aspect nào!**
