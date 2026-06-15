# React Query Architecture Deep Dive

## You

#18: Inside React Query

## Claude


# 🔍 Phân Tích Sâu: Inside React Query Architecture


## 📝 1. TÓM TẮT CHÍNH


Bài viết này deep dive vào **kiến trúc bên trong của React Query** - giải thích cách thức hoạt động của async state management library phổ biến nhất trong React ecosystem. Tác giả breakdown từng component core và data flow để developer hiểu được tại sao React Query lại powerful và framework-agnostic đến vậy.


**Tại sao quan trọng?** Hiểu được internal architecture giúp developer optimize performance, debug issues hiệu quả hơn, và make informed decisions khi design application state management.


---


## 🔍 2. KHÁI NIỆM CỐT LÕI


### 🏗️ QueryClient


- **Định nghĩa:** Entry point chính, container chứa QueryCache và MutationCache
- **Analogy:** Giống như "database connection" trong backend - stable, singleton instance
- **Vai trò:** Provide convenience methods để interact với cache, hold default configurations


### 💾 QueryCache


- **Định nghĩa:** In-memory storage với key-value structure
- **Key:** Serialized version của queryKey (gọi là queryKeyHash)
- **Value:** Query instance
- **Tương đương:** Giống Redis cache nhưng trong memory của browser


### 🔄 Query


- **Định nghĩa:** Core logic processor - chứa data, status, metadata
- **Responsibilities:** Execute query function, retry logic, cancellation, deduplication
- **State machine:** Ensure không có impossible states (VD: đang fetch mà trigger fetch khác)


### 👀 QueryObserver


- **Định nghĩa:** Bridge giữa Query và React component
- **Optimization:** Chỉ notify component về changes mà nó actually care about
- **One-to-one:** Mỗi useQuery call tạo 1 Observer, subscribe to exactly 1 Query


---


## 💡 3. HIỂU BẢN CHẤT


### 🎯 Pain Points Được Solve:


1. **Server State vs Client State Confusion**
javascript// ❌ Trước khi có React Query - mixing server & client state
const [users, setUsers] = useState([])
const [loading, setLoading] = useState(false)
const [error, setError] = useState(null)

// ✅ Với React Query - declarative server state
const { data: users, isLoading, error } = useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers
})
2. **Cache Invalidation Hell**
3. **Request Deduplication**
4. **Background Refetching**
5. **Stale Data Management**


### ⚙️ Cơ Chế Hoạt Động Underlying:


**Observer Pattern + State Machine + Intelligent Caching**


```javascript
// Simplified mental model
class Query {
  state = 'idle' // idle -> loading -> success/error
  observers = new Set() // Components listening to this query

  notify() {
    this.observers.forEach(observer => {
      if (observer.shouldNotify(this.state)) {
        observer.component.rerender()
      }
    })
  }
}
```


### 🤔 Tại Sao Chọn Architecture Này?


- **Framework Agnostic:** Core logic tách biệt khỏi React
- **Performance:** Observer pattern cho selective re-rendering
- **Predictable:** State machine prevent race conditions
- **Extensible:** Plugin architecture cho persisters, devtools


---


## 🛠️ 4. CODE EXAMPLES THỰC TẾ


### 📱 Setup QueryClient


### 🔥 Data Flow Visualization


---


## 🔄 5. SO SÁNH & PHÂN BIỆT


### ⚔️ React Query vs Alternatives


```
AspectReact QueryRedux Toolkit QuerySWRZustand + Custom🏗️ ArchitectureObserver Pattern + State MachineRedux-based normalizationSimple cache with SWR strategyManual implementation📦 Bundle Size~13kb~50kb+ (với Redux)~4kb~2kb + custom code🔧 Setup ComplexityMedium (QueryClient setup)High (store, slices)Low (1 provider)High (DIY everything)🎯 Cache StrategyIntelligent background refetchNormalized entity cacheStale-while-revalidateManual cache management🔄 Optimistic UpdatesBuilt-in với rollbackExcellent với immerManual implementationDIY📊 DevToolsExcellent dedicated devtoolsRedux DevToolsBasicNone
```


### 🤔 Khi nào dùng approach nào?


```javascript
// ✅ React Query - Perfect cho:
// - Data fetching heavy apps
// - Need background sync
// - Real-time updates important
// - Team muốn focus vào business logic

// ✅ Redux Toolkit Query - Perfect cho:
// - App đã có Redux ecosystem
// - Need complex normalization
// - Strict predictable state management
// - Large team với complex workflows

// ✅ SWR - Perfect cho:
// - Simple data fetching needs
// - Bundle size critical
// - Next.js projects
// - Prototype/MVP development

// ✅ Custom Solution - Perfect cho:
// - Very specific requirements
// - Maximum control needed
// - Learning/educational purposes
// - Micro-frontends architecture
```


### 🔥 Trade-offs Analysis


**React Query Pros:**


- 🎯 Framework-agnostic core
- 🔄 Intelligent request deduplication
- 📊 Rich ecosystem (devtools, persisters)
- 🎛️ Granular control over each query


**React Query Cons:**


- 📚 Learning curve cho complex features
- 🏗️ Additional abstraction layer
- 💾 In-memory only by default


---


## 🎯 6. BEST PRACTICES


### ⚡ Performance Optimizations


### 🔒 Data Race Prevention


```javascript
// ✅ Proper pattern: Mutation với optimistic updates
function useOptimisticUserUpdate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateUser,
    // 🎯 Optimistic update: UI responds instantly
    onMutate: async (newUserData) => {
      // Cancel outgoing refetches để avoid conflicts
      await queryClient.cancelQueries({ queryKey: ['user', newUserData.id] })

      // Snapshot previous value for rollback
      const previousUser = queryClient.getQueryData(['user', newUserData.id])

      // Optimistically update cache
      queryClient.setQueryData(['user', newUserData.id], newUserData)

      return { previousUser }  // Context for rollback
    },

    // 🚨 Error: Rollback optimistic update
    onError: (err, newUserData, context) => {
      queryClient.setQueryData(
        ['user', newUserData.id],
        context?.previousUser
      )
    },

    // ✅ Success: Confirm với server data
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user', variables.id] })
    },
  })
}
```


---


## 🚀 7. ỨNG DỤNG THỰC TẾ


### 📱 E-commerce Platform


```javascript
// 🛒 Product catalog với intelligent caching
function ProductCatalog() {
  const [filters, setFilters] = useState({ category: 'all', priceRange: [0, 1000] })

  // 📊 Products query với dependent data
  const { data: products, isLoading } = useQuery({
    queryKey: ['products', filters],
    queryFn: () => fetchProducts(filters),
    keepPreviousData: true,  // 🎯 Smooth transition between filter changes
    staleTime: 2 * 60 * 1000, // Product data relatively stable
  })

  // 🏪 Individual product prefetching on hover
  const prefetchProduct = useCallback((productId) => {
    queryClient.prefetchQuery({
      queryKey: ['product', productId],
      queryFn: () => fetchProductDetail(productId),
      staleTime: 5 * 60 * 1000,
    })
  }, [])

  return (
    <div>
      <FilterBar filters={filters} onChange={setFilters} />
      <ProductGrid
        products={products}
        onProductHover={prefetchProduct}  // 🚀 Hover-based prefetching
        isLoading={isLoading}
      />
    </div>
  )
}

// 🛍️ Shopping cart với optimistic updates
function useShoppingCart() {
  const queryClient = useQueryClient()

  const addToCart = useMutation({
    mutationFn: ({ productId, quantity }) =>
      api.post('/cart/items', { productId, quantity }),

    onMutate: async ({ productId, quantity }) => {
      // 🎯 Immediate UI feedback
      const product = queryClient.getQueryData(['product', productId])

      queryClient.setQueryData(['cart'], (oldCart) => ({
        ...oldCart,
        items: [...(oldCart?.items || []), { product, quantity }],
        totalItems: (oldCart?.totalItems || 0) + quantity,
      }))

      // 🎊 Trigger success animation immediately
      showAddToCartAnimation()
    },

    onError: () => {
      // 🚨 Rollback và show error
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      showErrorMessage('Failed to add item to cart')
    }
  })

  return { addToCart }
}
```


### 📊 Real-time Dashboard


```javascript
// 📈 Live dashboard với background polling
function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState('7d')

  // 📊 Metrics với interval refetching
  const { data: metrics } = useQuery({
    queryKey: ['metrics', timeRange],
    queryFn: () => fetchMetrics(timeRange),
    refetchInterval: 30 * 1000,  // 🔄 Refresh every 30s
    refetchIntervalInBackground: true,  // Continue when tab inactive
    staleTime: 0,  // Always consider data stale for real-time updates
  })

  // 🎯 Live notifications
  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
    refetchInterval: 10 * 1000,  // More frequent for notifications
    select: (data) => data.filter(n => !n.read),  // Only unread
  })

  return (
    <Dashboard>
      <MetricsCards metrics={metrics} />
      <NotificationCenter notifications={notifications} />
      <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
    </Dashboard>
  )
}
```


### 🔐 User Management System


```javascript
// 👥 Admin panel với complex data relationships
function UserManagement() {
  // 📋 Users list với pagination
  const [page, setPage] = useState(1)
  const { data: usersPage } = useQuery({
    queryKey: ['users', { page, limit: 20 }],
    queryFn: () => fetchUsers({ page, limit: 20 }),
    keepPreviousData: true,  // Smooth pagination
  })

  // 🔍 Search với debounced queries
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearch = useDebounce(searchTerm, 300)

  const { data: searchResults } = useQuery({
    queryKey: ['users', 'search', debouncedSearch],
    queryFn: () => searchUsers(debouncedSearch),
    enabled: debouncedSearch.length > 2,  // Only search with 3+ chars
    staleTime: 5 * 60 * 1000,
  })

  // ✏️ Bulk operations với loading states
  const bulkUpdateUsers = useMutation({
    mutationFn: ({ userIds, updates }) =>
      api.patch('/users/bulk', { userIds, updates }),

    onMutate: ({ userIds, updates }) => {
      // 🎯 Optimistic updates for selected users
      userIds.forEach(userId => {
        queryClient.setQueryData(['user', userId], (oldUser) => ({
          ...oldUser,
          ...updates,
          isUpdating: true,  // Visual feedback
        }))
      })
    },

    onSuccess: (data, { userIds }) => {
      // ✅ Update with server response
      data.forEach((updatedUser) => {
        queryClient.setQueryData(['user', updatedUser.id], updatedUser)
      })

      // 🔄 Refresh users list
      queryClient.invalidateQueries({ queryKey: ['users'] })
    }
  })

  return (
    <UserManagementPanel>
      <SearchBar value={searchTerm} onChange={setSearchTerm} />
      <UsersList
        users={searchTerm ? searchResults : usersPage?.users}
        onBulkUpdate={bulkUpdateUsers.mutate}
        isUpdating={bulkUpdateUsers.isLoading}
      />
      <Pagination page={page} onChange={setPage} />
    </UserManagementPanel>
  )
}
```


---


## 📚 8. KIẾN THỨC LIÊN QUAN


### 🔗 Prerequisites Cần Biết


1. **React Fundamentals** (⭐⭐⭐)

Hooks (useState, useEffect, useContext)
Component lifecycle
Re-rendering behavior và optimization
2. **JavaScript Async Programming** (⭐⭐⭐)

Promises và async/await
Error handling patterns
Event loops và concurrency
3. **HTTP & REST APIs** (⭐⭐)

Request/response cycle
Status codes và error handling
Caching headers


### 🚀 Advanced Topics Để Tìm Hiểu Tiếp


1. **Suspense Integration** (⭐⭐)
javascript// 🔄 React Query với Suspense
function UserProfile({ userId }) {
  const user = useSuspenseQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
  })

  // 🎯 Không cần loading states - Suspense handles it
  return <div>{user.data.name}</div>
}
2. **Custom Persisters** (⭐⭐⭐)
javascript// 💾 Custom persister cho encrypted storage
const encryptedPersister = {
  persistClient: async (client) => {
    const encrypted = await encrypt(JSON.stringify(client))
    localStorage.setItem('rq-cache', encrypted)
  },
  restoreClient: async () => {
    const encrypted = localStorage.getItem('rq-cache')
    if (encrypted) {
      const decrypted = await decrypt(encrypted)
      return JSON.parse(decrypted)
    }
  }
}
3. **Server-Side Rendering** (⭐⭐⭐)

Hydration strategies
Initial data population
SEO considerations


### 🔧 Related Technologies


1. **State Management Alternatives**

Redux Toolkit Query
SWR
Apollo Client (GraphQL)
Zustand với custom async logic
2. **Complementary Tools**

React Query DevTools
MSW (Mock Service Worker) for testing
React Hook Form integration


---


## 💼 9. INTERVIEW PERSPECTIVE


### 🎯 Câu Hỏi Interview Có Thể Gặp


**Q: "Explain how React Query works internally?"**


**✅ Professional Answer:**


```
React Query architecture consists của 4 core components:

1. QueryClient - Entry point, holds cache và default configurations
2. QueryCache - In-memory store với queryKeyHash làm keys, Query instances làm values
3. Query - Contains data, status, metadata. Handles execution, retry, deduplication logic
4. QueryObserver - Bridge giữa Query và React component, tối ưu selective re-rendering

Flow: Component mount → useQuery tạo Observer → Observer subscribe to Query → Query fetch data → State changes propagate to Observer → Component re-render với new data.

Key benefit: Framework-agnostic core logic, Observer pattern cho performance optimization."
```


**Q: "How does React Query prevent duplicate requests?"**


**✅ Professional Answer:**


```
React Query implements request deduplication at Query level:

1. Mỗi Query instance duy trì internal state machine
2. Khi multiple components call cùng queryKey simultaneously, chúng subscribe to same Query instance
3. Query chỉ execute function một lần, all Observers nhận same result
4. Subsequent requests while fetching được queued và resolved với same promise

Example: 3 components mount cùng lúc với queryKey ['user', '123'] → Chỉ 1 API call được made, 3 components nhận same data."
```


**Q: "When would you choose React Query over Redux?"**


**✅ Professional Answer:**


```
React Query optimal cho:
- Server state management (async data, caching, sync)
- Applications với lots of data fetching
- Need background refetching và real-time updates
- Teams focus vào business logic over state management

Redux optimal cho:
- Complex client state với cross-component sharing
- Need time-travel debugging
- Predictable state updates với strict patterns
- Large teams requiring standardized state management

Reality: Nhiều apps sử dụng both - React Query cho server state, Redux/Zustand cho client state."
```


### 🏆 Câu Hỏi Nâng Cao (Senior Level)


**Q: "How would you implement optimistic updates with rollback?"**


**✅ Expert-level Answer:**


```javascript
// 🎯 Demonstrate với concrete example
const useOptimisticTodo = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateTodo,
    onMutate: async (newTodo) => {
      // 1. Cancel inflight requests
      await queryClient.cancelQueries(['todos'])

      // 2. Snapshot current state
      const previousTodos = queryClient.getQueryData(['todos'])

      // 3. Optimistically update
      queryClient.setQueryData(['todos'], old =>
        old.map(todo => todo.id === newTodo.id ? newTodo : todo)
      )

      return { previousTodos }
    },
    onError: (err, newTodo, context) => {
      // 4. Rollback on error
      queryClient.setQueryData(['todos'], context.previousTodos)
    },
    onSettled: () => {
      // 5. Sync with server regardless
      queryClient.invalidateQueries(['todos'])
    }
  })
}

Key principles:
- Always cancel concurrent requests
- Maintain rollback context
- Separate optimistic updates from server sync
- Handle error states gracefully
```


### 💡 Điểm Cộng Khi Demonstrate Knowledge


1. **Architecture Understanding** - Explain Observer pattern và state machine
2. **Performance Awareness** - Mention selective re-rendering, request deduplication
3. **Real-world Experience** - Discuss caching strategies, error handling patterns
4. **Framework Agnostic** - Understand core concepts work beyond React
5. **Troubleshooting Skills** - Know common pitfalls và debugging techniques


---


## 🎯 Kết Luận Tổng Hợp


React Query revolutionizes cách chúng ta handle server state trong React applications. Từ việc hiểu architecture bên trong đến implement advanced patterns, library này provide robust foundation cho modern web development.


**🔑 Key Takeaways:**


- **Architecture Design** cho phép framework-agnostic implementation
- **Observer Pattern** optimize performance thông qua selective updates
- **Intelligent Caching** giảm network requests và improve user experience
- **Developer Experience** with powerful devtools và intuitive APIs


**🚀 Next Steps:**


1. Practice với real project implementation
2. Explore advanced patterns như infinite queries, parallel queries
3. Learn integration với SSR frameworks (Next.js, Remix)
4. Contribute to open source để deepen understanding


React Query không chỉ là một library - nó là paradigm shift trong cách we think about data management in frontend applications! 🎊
