# React Query Keys Best Practices

## You

#8: Effective React Query Keys

## Claude


# 🔑 React Query Keys: The Master Key to Efficient Data Management


## 1. 📝 TÓM TẮT CHÍNH


Bài viết này giải thích về **Query Keys** - một khái niệm cốt lõi trong React Query library. Query Keys không chỉ đơn thuần là identifiers mà còn là "điều khiển viên" của toàn bộ hệ thống caching, automatic refetching và manual data management. Việc organize Query Keys hiệu quả sẽ quyết định tính maintainability và performance của ứng dụng React khi scale lên.


## 2. 🔍 KHÁI NIỆM CỐT LÕI


### 🎯 Query Key là gì?


- **Định nghĩa**: Query Key là một array (hoặc string) dùng để uniquely identify một query trong React Query cache
- **Analogy**: Giống như address của một ngôi nhà - mỗi địa chỉ phải unique để postman biết deliver đúng nơi


### 🏗️ Ba chức năng chính của Query Keys:


```
['todos']['todos', filters]['todos']
```


### 🔗 Query Cache Structure:


```javascript
// Internally, React Query cache trông như thế này:
{
  "['todos']": { data: [...], meta: {...} },
  "['todos', 'list', {filters: 'all'}]": { data: [...], meta: {...} },
  "['user', 123]": { data: {...}, meta: {...} }
}
```


## 3. 💡 HIỂU BẢN CHẤT


### 🎯 Solve Pain Points nào?


**❌ Traditional Approach Problems:**


```javascript
// Cách cũ: Manual state management nightmare
const [todos, setTodos] = useState([])
const [loading, setLoading] = useState(false)
const [filters, setFilters] = useState('all')

useEffect(() => {
  setLoading(true)
  fetchTodos(filters).then(data => {
    setTodos(data)
    setLoading(false)
  })
}, [filters]) // Phải manually track dependencies

// Problem:
// - Duplicate requests
// - No caching
// - Manual loading states
// - Complex state synchronization
```


**✅ React Query Solution:**


```javascript
// Cách mới: Declarative magic
const { data: todos, isLoading } = useQuery({
  queryKey: ['todos', filters], // Key thay đổi → auto refetch
  queryFn: () => fetchTodos(filters)
})

// Benefits:
// - Automatic caching
// - Deduplication
// - Background refetching
// - Optimistic updates
```


### 🔧 Cơ chế hoạt động Underlying:


1. **Key Serialization**: `['todos', {filter: 'done'}]` → `"todos.{\"filter\":\"done\"}"`
2. **Cache Lookup**: Check if serialized key exists in cache
3. **Cache Miss**: Execute queryFn và store result
4. **Cache Hit**: Return cached data instantly
5. **Key Change Detection**: Shallow comparison of key arrays


## 4. 🛠️ CODE EXAMPLES THỰC TẾ


### 📋 Example 1: Basic Query Key Structure


```javascript
// ❌ WRONG: Không thể mix useQuery và useInfiniteQuery cùng key
function TodoApp() {
  // Query cho pagination bình thường
  const { data: todosPage } = useQuery({
    queryKey: ['todos'], // ⚠️ Key trùng lặp
    queryFn: () => fetchTodos({ page: 1, limit: 10 })
  })

  // Infinite query cho infinite scroll
  const { data: infiniteTodos } = useInfiniteQuery({
    queryKey: ['todos'], // 🚨 Conflict! Sẽ share cache với query trên
    queryFn: ({ pageParam = 0 }) => fetchInfiniteTodos(pageParam)
  })
}

// ✅ CORRECT: Keys phải unique cho mỗi loại query
function TodoApp() {
  // Query cho pagination
  const { data: todosPage } = useQuery({
    queryKey: ['todos', 'page'], // ✅ Unique key
    queryFn: () => fetchTodos({ page: 1, limit: 10 })
  })

  // Infinite query
  const { data: infiniteTodos } = useInfiniteQuery({
    queryKey: ['todos', 'infinite'], // ✅ Unique key
    queryFn: ({ pageParam = 0 }) => fetchInfiniteTodos(pageParam)
  })
}
```


### 🔄 Example 2: Declarative Refetching


```javascript
// ❌ IMPERATIVE: Thinking cũ - manual refetch
function TodoList() {
  const [filters, setFilters] = useState('all')
  const { data, refetch } = useQuery({
    queryKey: ['todos'], // ⚠️ Key static, không reflect filters
    queryFn: () => fetchTodos('all') // ⚠️ Hard-coded filters
  })

  const handleFilterChange = (newFilter) => {
    setFilters(newFilter)
    // 🚨 Trying to pass params to refetch - WRONG!
    refetch({ filters: newFilter }) // Không work!
  }
}

// ✅ DECLARATIVE: Thinking mới - let key drive the query
function TodoList() {
  const [filters, setFilters] = useState('all')

  // ✅ Key chứa filters → auto refetch khi filters change
  const { data } = useQuery({
    queryKey: ['todos', filters], // Key thay đổi theo filters
    queryFn: () => fetchTodos(filters), // QueryFn nhận filters từ state
    staleTime: 5 * 60 * 1000, // Cache 5 phút
    cacheTime: 10 * 60 * 1000 // Keep in memory 10 phút
  })

  // ✅ Chỉ cần update state, React Query lo phần còn lại
  const handleFilterChange = (newFilter) => {
    setFilters(newFilter) // Component re-render → new key → auto refetch
  }

  return (
    <div>
      <FilterButtons onFilterChange={handleFilterChange} />
      {data?.map(todo => <TodoItem key={todo.id} todo={todo} />)}
    </div>
  )
}
```


### 🏗️ Example 3: Hierarchical Key Structure


```javascript
// ✅ RECOMMENDED: Structured keys từ generic đến specific
const todoQueries = {
  // Level 1: Feature level
  all: ['todos'] as const,

  // Level 2: Query type level
  lists: () => [...todoQueries.all, 'list'] as const,
  details: () => [...todoQueries.all, 'detail'] as const,

  // Level 3: Specific parameters
  list: (filters: TodoFilters) => [...todoQueries.lists(), { filters }] as const,
  detail: (id: number) => [...todoQueries.details(), id] as const,
}

// Usage trong components
function TodoListPage() {
  const [filters, setFilters] = useState({ status: 'all', priority: 'high' })

  // ✅ Key structure: ['todos', 'list', { filters: { status: 'all', priority: 'high' } }]
  const { data: todos } = useQuery({
    queryKey: todoQueries.list(filters),
    queryFn: () => fetchTodoList(filters)
  })
}

function TodoDetailPage({ todoId }: { todoId: number }) {
  // ✅ Key structure: ['todos', 'detail', 123]
  const { data: todo } = useQuery({
    queryKey: todoQueries.detail(todoId),
    queryFn: () => fetchTodoDetail(todoId)
  })
}
```


### 🔧 Example 4: Advanced Cache Manipulation


```javascript
function useUpdateTodo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateTodo,
    onSuccess: (updatedTodo) => {
      // ✅ Update specific todo detail
      queryClient.setQueryData(
        todoQueries.detail(updatedTodo.id),
        updatedTodo
      )

      // ✅ Update all lists containing this todo
      queryClient.setQueriesData(
        todoQueries.lists(), // Match all list queries
        (oldData: Todo[] | undefined) => {
          if (!oldData) return oldData
          return oldData.map(todo =>
            todo.id === updatedTodo.id ? updatedTodo : todo
          )
        }
      )

      // ✅ Invalidate background data để refetch fresh
      queryClient.invalidateQueries({
        queryKey: todoQueries.lists(),
        refetchType: 'inactive' // Chỉ refetch inactive tabs
      })
    }
  })
}
```


## 5. 🔄 SO SÁNH & PHÂN BIỆT


### 📊 Query Keys vs Traditional State Management


```
AspectTraditional Redux/ContextReact Query KeysCachingManual implementationAutomatic với key-based cacheRefetchingManual dispatch actionsAuto refetch khi key changeDeduplicationCustom logic neededBuilt-in deduplicationBackground UpdatesComplex setupNative supportOptimistic UpdatesBoilerplate codeSimple onMutate callbacks
```


### 🎯 String Keys vs Array Keys


```javascript
// ❌ STRING KEYS: Limited flexibility
useQuery({ queryKey: 'todos' })
useQuery({ queryKey: 'todos-filtered-done' }) // Hard to manipulate

// ✅ ARRAY KEYS: Infinite flexibility
useQuery({ queryKey: ['todos'] })
useQuery({ queryKey: ['todos', 'list', { status: 'done' }] })

// Benefits of Array Keys:
// - Hierarchical invalidation: ['todos'] invalidates all
// - Partial matching: ['todos', 'list'] matches all lists
// - Type safety with TypeScript
// - Easy programmatic manipulation
```


### 🏢 Flat vs Hierarchical Structure


```javascript
// ❌ FLAT STRUCTURE: Hard to maintain
const keys = {
  allTodos: ['todos-all'],
  doneTodos: ['todos-done'],
  pendingTodos: ['todos-pending'],
  todoDetail1: ['todo-1'],
  todoDetail2: ['todo-2']
  // Problem: No relationship, hard to invalidate groups
}

// ✅ HIERARCHICAL: Scalable và maintainable
const keys = {
  all: ['todos'],
  lists: () => [...keys.all, 'list'],
  details: () => [...keys.all, 'detail'],
  list: (filter: string) => [...keys.lists(), { filter }],
  detail: (id: number) => [...keys.details(), id]
}

// Benefits:
// - Clear relationships
// - Easy group operations
// - Predictable structure
// - Scale well with complex apps
```


## 6. 🎯 BEST PRACTICES


### 🏗️ Structure Guidelines


```typescript
// ✅ RECOMMENDED: Feature-based Query Key Factory
interface TodoFilters {
  status?: 'all' | 'pending' | 'done'
  priority?: 'low' | 'medium' | 'high'
  assignee?: string
}

const todoKeys = {
  // Level 1: Feature scope
  all: ['todos'] as const,

  // Level 2: Operation type
  lists: () => [...todoKeys.all, 'list'] as const,
  details: () => [...todoKeys.all, 'detail'] as const,
  search: () => [...todoKeys.all, 'search'] as const,

  // Level 3: Specific operations
  list: (filters?: TodoFilters) => [...todoKeys.lists(), { filters }] as const,
  detail: (id: number) => [...todoKeys.details(), id] as const,
  searchByKeyword: (keyword: string) => [...todoKeys.search(), keyword] as const,

  // Level 4: Related data
  comments: (todoId: number) => [...todoKeys.detail(todoId), 'comments'] as const,
  attachments: (todoId: number) => [...todoKeys.detail(todoId), 'attachments'] as const,
} satisfies Record<string, unknown>

// Type safety với TypeScript
type TodoKeyFactory = typeof todoKeys
type TodoKeys = ReturnType<TodoKeyFactory[keyof TodoKeyFactory]>
```


### ⚠️ Common Mistakes to Avoid


```javascript
// 🚨 MISTAKE 1: Dynamic keys in wrong places
function BadComponent({ userId }: { userId: number }) {
  const { data } = useQuery({
    // ❌ Key thay đổi mỗi render vì object recreation
    queryKey: ['user', { id: userId, timestamp: Date.now() }],
    queryFn: () => fetchUser(userId)
  })
}

// ✅ SOLUTION: Stable references
function GoodComponent({ userId }: { userId: number }) {
  const { data } = useQuery({
    // ✅ Key stable, chỉ thay đổi khi userId thay đổi
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
    // Nếu cần fresh data, dùng staleTime thay vì dynamic key
    staleTime: 0
  })
}

// 🚨 MISTAKE 2: Too granular keys
function BadKeys() {
  return {
    todoTitle: (id: number) => ['todo', id, 'title'],
    todoDescription: (id: number) => ['todo', id, 'description'],
    todoStatus: (id: number) => ['todo', id, 'status']
    // Problem: Too many separate requests cho cùng 1 entity
  }
}

// ✅ SOLUTION: Entity-level keys
function GoodKeys() {
  return {
    detail: (id: number) => ['todo', id],
    // Fetch toàn bộ todo, extract fields ở component level
  }
}

// 🚨 MISTAKE 3: Inconsistent key formats
const badKeys = {
  todos: ['todos'],
  users: 'users', // ❌ Inconsistent type
  projects: ['project'], // ❌ Singular vs plural inconsistency
}

// ✅ SOLUTION: Consistent conventions
const goodKeys = {
  todos: () => ['todos'] as const,
  users: () => ['users'] as const,
  projects: () => ['projects'] as const,
}
```


### 🚀 Performance Optimizations


```javascript
// ✅ PERFORMANCE: Smart invalidation strategies
function useCreateTodo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createTodo,
    onMutate: async (newTodo) => {
      // ✅ Optimistic update: Update UI ngay lập tức
      await queryClient.cancelQueries({ queryKey: todoKeys.lists() })

      const previousTodos = queryClient.getQueryData(todoKeys.list())

      queryClient.setQueryData(
        todoKeys.list(),
        (old: Todo[] = []) => [...old, { ...newTodo, id: 'temp-' + Date.now() }]
      )

      return { previousTodos }
    },

    onError: (err, newTodo, context) => {
      // ✅ Rollback on error
      queryClient.setQueryData(todoKeys.list(), context?.previousTodos)
    },

    onSettled: () => {
      // ✅ Refetch để sync với server
      queryClient.invalidateQueries({ queryKey: todoKeys.lists() })
    }
  })
}

// ✅ PERFORMANCE: Selective refetching
function useSelectiveRefetch() {
  const [currentFilter, setCurrentFilter] = useState('all')

  return useMutation({
    mutationFn: updateTodo,
    onSuccess: (updatedTodo) => {
      // Update active query without refetch
      queryClient.setQueryData(
        todoKeys.list({ status: currentFilter }),
        (old: Todo[]) => old?.map(todo =>
          todo.id === updatedTodo.id ? updatedTodo : todo
        )
      )

      // Invalidate other filters but don't refetch active one
      queryClient.invalidateQueries({
        queryKey: todoKeys.lists(),
        refetchType: 'inactive' // Chỉ refetch inactive queries
      })
    }
  })
}
```


## 7. 🚀 ỨNG DỤNG THỰC TẾ


### 🏢 E-commerce Application Example


```typescript
// ✅ REAL-WORLD: E-commerce query structure
const ecommerceKeys = {
  // Products
  products: {
    all: ['products'] as const,
    lists: () => [...ecommerceKeys.products.all, 'list'] as const,
    details: () => [...ecommerceKeys.products.all, 'detail'] as const,
    search: () => [...ecommerceKeys.products.all, 'search'] as const,

    list: (filters: ProductFilters) => [...ecommerceKeys.products.lists(), filters] as const,
    detail: (id: string) => [...ecommerceKeys.products.details(), id] as const,
    reviews: (id: string) => [...ecommerceKeys.products.detail(id), 'reviews'] as const,
    relatedProducts: (id: string) => [...ecommerceKeys.products.detail(id), 'related'] as const,
  },

  // User-specific data
  user: {
    all: ['user'] as const,
    profile: () => [...ecommerceKeys.user.all, 'profile'] as const,
    orders: () => [...ecommerceKeys.user.all, 'orders'] as const,
    cart: () => [...ecommerceKeys.user.all, 'cart'] as const,
    wishlist: () => [...ecommerceKeys.user.all, 'wishlist'] as const,

    orderDetail: (orderId: string) => [...ecommerceKeys.user.orders(), orderId] as const,
  },

  // Categories
  categories: {
    all: ['categories'] as const,
    tree: () => [...ecommerceKeys.categories.all, 'tree'] as const,
    products: (categoryId: string) => [...ecommerceKeys.categories.all, categoryId, 'products'] as const,
  }
}

// Usage trong ProductListPage
function ProductListPage() {
  const [filters, setFilters] = useFilters() // Custom hook từ URL params

  const { data: products, isLoading } = useQuery({
    queryKey: ecommerceKeys.products.list(filters),
    queryFn: () => fetchProducts(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes - products change frequently
    keepPreviousData: true // Smooth transitions khi filter change
  })

  // Prefetch next page để improve UX
  const { prefetchQuery } = useQueryClient()

  useEffect(() => {
    if (filters.page < totalPages) {
      prefetchQuery({
        queryKey: ecommerceKeys.products.list({ ...filters, page: filters.page + 1 }),
        queryFn: () => fetchProducts({ ...filters, page: filters.page + 1 })
      })
    }
  }, [filters, totalPages])
}

// Usage trong Shopping Cart
function useShoppingCart() {
  const queryClient = useQueryClient()

  const addToCart = useMutation({
    mutationFn: addItemToCart,
    onMutate: async (item) => {
      await queryClient.cancelQueries({ queryKey: ecommerceKeys.user.cart() })

      const previousCart = queryClient.getQueryData(ecommerceKeys.user.cart())

      // Optimistic update
      queryClient.setQueryData(
        ecommerceKeys.user.cart(),
        (old: CartItem[]) => [...(old || []), item]
      )

      return { previousCart }
    },

    onError: (err, item, context) => {
      queryClient.setQueryData(ecommerceKeys.user.cart(), context?.previousCart)
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ecommerceKeys.user.cart() })
    }
  })

  return { addToCart }
}
```


### 📊 Dashboard Application Example


```typescript
// ✅ REAL-WORLD: Analytics dashboard
const dashboardKeys = {
  analytics: {
    all: ['analytics'] as const,
    metrics: () => [...dashboardKeys.analytics.all, 'metrics'] as const,
    reports: () => [...dashboardKeys.analytics.all, 'reports'] as const,

    // Time-based data với cache strategy khác nhau
    realtime: (metricType: string) => [...dashboardKeys.analytics.metrics(), 'realtime', metricType] as const,
    hourly: (metricType: string, date: string) => [...dashboardKeys.analytics.metrics(), 'hourly', metricType, date] as const,
    daily: (metricType: string, dateRange: DateRange) => [...dashboardKeys.analytics.metrics(), 'daily', metricType, dateRange] as const,

    // Custom reports
    customReport: (reportId: string) => [...dashboardKeys.analytics.reports(), reportId] as const,
  }
}

function MetricsDashboard() {
  const [dateRange, setDateRange] = useState({ start: '2024-01-01', end: '2024-01-31' })

  // Realtime data - refetch thường xuyên
  const { data: realtimeUsers } = useQuery({
    queryKey: dashboardKeys.analytics.realtime('active-users'),
    queryFn: () => fetchRealtimeMetrics('active-users'),
    refetchInterval: 30 * 1000, // Refetch mỗi 30 giây
    staleTime: 0 // Always consider stale
  })

  // Historical data - cache lâu hơn
  const { data: dailyMetrics } = useQuery({
    queryKey: dashboardKeys.analytics.daily('page-views', dateRange),
    queryFn: () => fetchDailyMetrics('page-views', dateRange),
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 30 * 60 * 1000 // 30 minutes
  })
}
```


### 🔄 Integration với Next.js SSR


```typescript
// ✅ INTEGRATION: Next.js với React Query
export async function getServerSideProps(context: GetServerSidePropsContext) {
  const queryClient = new QueryClient()
  const { productId } = context.params!

  // Prefetch data on server
  await queryClient.prefetchQuery({
    queryKey: ecommerceKeys.products.detail(productId as string),
    queryFn: () => fetchProduct(productId as string)
  })

  // Prefetch related data
  await queryClient.prefetchQuery({
    queryKey: ecommerceKeys.products.reviews(productId as string),
    queryFn: () => fetchProductReviews(productId as string)
  })

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
    },
  }
}

function ProductPage() {
  const router = useRouter()
  const { productId } = router.query

  // Data đã được prefetch trên server, sẽ không refetch
  const { data: product } = useQuery({
    queryKey: ecommerceKeys.products.detail(productId as string),
    queryFn: () => fetchProduct(productId as string)
  })

  return <ProductDetail product={product} />
}
```


## 8. 📚 KIẾN THỨC LIÊN QUAN


### 🎯 Prerequisites cần biết:


1. **React Fundamentals**

useState, useEffect hooks
Component lifecycle
Re-rendering mechanics
2. **JavaScript/TypeScript**

Array methods (map, filter, find)
Object manipulation
Async/await, Promises
Type definitions (TypeScript)
3. **HTTP & API concepts**

REST API patterns
HTTP status codes
Request/Response cycle
Error handling


### 🚀 Advanced Topics để học tiếp:


```typescript
// 1. ADVANCED: Custom hooks với query keys
function useOptimisticTodos() {
  const queryClient = useQueryClient()

  const createTodo = useMutation({
    mutationFn: createTodoAPI,
    onMutate: async (newTodo) => {
      // Advanced optimistic update pattern
      await queryClient.cancelQueries({ queryKey: todoKeys.all })

      const snapshot = new Map()

      // Snapshot all affected queries
      queryClient.getQueriesData({ queryKey: todoKeys.lists() })
        .forEach(([queryKey, data]) => {
          snapshot.set(queryKey, data)
        })

      // Apply optimistic updates
      queryClient.setQueriesData(
        { queryKey: todoKeys.lists() },
        (old: Todo[]) => old ? [...old, { ...newTodo, id: `temp-${Date.now()}` }] : [newTodo]
      )

      return { snapshot }
    }
    // ... error handling
  })
}

// 2. ADVANCED: Infinite queries với complex keys
function useInfiniteTodos(filters: TodoFilters) {
  return useInfiniteQuery({
    queryKey: [...todoKeys.lists(), 'infinite', filters],
    queryFn: ({ pageParam = 0 }) => fetchTodos({ ...filters, page: pageParam }),
    getNextPageParam: (lastPage, allPages) => lastPage.hasMore ? allPages.length : undefined,
    // Advanced: Custom cache invalidation
    onSuccess: (data) => {
      // Update individual todo queries từ infinite data
      data.pages.flat().forEach(todo => {
        queryClient.setQueryData(todoKeys.detail(todo.id), todo)
      })
    }
  })
}

// 3. ADVANCED: Background sync patterns
function useBackgroundSync() {
  const isOnline = useOnlineStatus()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (isOnline) {
      // Refetch all stale queries khi online trở lại
      queryClient.resumePausedMutations()
      queryClient.refetchQueries({
        stale: true,
        type: 'active'
      })
    }
  }, [isOnline, queryClient])
}
```


### 🔗 Related Technologies:


1. **State Management Alternatives**

Redux Toolkit Query (RTK Query)
SWR
Apollo Client (for GraphQL)
Zustand với persistence
2. **Caching Strategies**

Service Workers
HTTP caching headers
CDN caching
Browser storage APIs
3. **Performance Monitoring**

React DevTools Profiler
React Query DevTools
Lighthouse
Web Vitals


## 9. 💼 INTERVIEW PERSPECTIVE


### 🎯 Câu hỏi Interview thường gặp:


**Q1: "Explain how React Query keys work and why they're important."**


```javascript
// ✅ SAMPLE ANSWER:
"React Query keys serve three main purposes:

1. **Caching Identity**: Keys act như unique identifiers cho cached data
2. **Dependency Tracking**: Khi key thay đổi, query tự động refetch
3. **Cache Management**: Cho phép targeted invalidation và updates

Ví dụ với todo app:
- ['todos'] - cache tất cả todos
- ['todos', 'list', {filter: 'done'}] - cache filtered list
- ['todos', 'detail', 123] - cache specific todo

Key structure này cho phép:
- Invalidate tất cả todos: queryClient.invalidateQueries(['todos'])
- Invalidate chỉ lists: queryClient.invalidateQueries(['todos', 'list'])
- Update specific todo: queryClient.setQueryData(['todos', 'detail', 123], newData)

Điều quan trọng là keys phải deterministic và reflect dependencies."
```


**Q2: "How would you structure query keys for a complex e-commerce application?"**


```typescript
// ✅ DETAILED ANSWER với code example:
const ecommerceKeys = {
  products: {
    all: ['products'],
    lists: () => [...ecommerceKeys.products.all, 'list'],
    list: (filters: ProductFilters) => [...ecommerceKeys.products.lists(), filters],
    details: () => [...ecommerceKeys.products.all, 'detail'],
    detail: (id: string) => [...ecommerceKeys.products.details(), id]
  },
  user: {
    all: ['user'],
    profile: () => [...ecommerceKeys.user.all, 'profile'],
    orders: () => [...ecommerceKeys.user.all, 'orders']
  }
}

// Benefits:
// 1. Hierarchical structure cho easy invalidation
// 2. Type safety với TypeScript
// 3. Consistent naming conventions
// 4. Scalable cho complex features
```


**Q3: "What are common pitfalls when working with Query Keys?"**


```javascript
// ✅ COMPREHENSIVE ANSWER:
"Common pitfalls include:

1. **Unstable Keys**: Creating new objects trong render
   // ❌ Bad
   queryKey: ['todos', { filter: 'done', timestamp: Date.now() }]
   // ✅ Good
   queryKey: ['todos', filter]

2. **Key Conflicts**: Using same key cho different query types
   // ❌ Can't mix useQuery và useInfiniteQuery với same key

3. **Over-granular Keys**: Too many separate requests
   // ❌ ['todo', id, 'title'], ['todo', id, 'description']
   // ✅ ['todo', id] và destructure trong component

4. **Inconsistent Structure**: Mixed formats
   // ❌ ['todos'], 'users', ['project']
   // ✅ ['todos'], ['users'], ['projects']

5. **Missing Dependencies**: Not including all query dependencies trong key
   // ❌ queryKey: ['todos'] nhưng queryFn uses filters
   // ✅ queryKey: ['todos', filters]"
```


### 🏆 Advanced Interview Questions:


**Q4: "How would you implement optimistic updates with complex key structures?"**


## 10. 🎪 DEMO INTERACTIVE


Để giúp bạn experiment và hiểu sâu hơn về React Query Keys, tôi sẽ tạo một demo interactive mà bạn có thể play around:


---


## 🎉 KẾT LUẬN


Bài viết về **React Query Keys** đã được phân tích comprehensive từ góc độ của một Senior Frontend Engineer. Đây là một concept cốt lõi không thể thiếu khi làm việc với React Query library.


### 🎯 Key Takeaways:


1. **Query Keys = Brain of React Query** - Chúng control caching, refetching, và data management
2. **Declarative > Imperative** - Let keys drive queries thay vì manual refetch
3. **Structure Matters** - Hierarchical keys enable powerful cache operations
4. **Factory Pattern** - Scale approach cho complex applications
5. **Optimistic Updates** - Essential cho great UX với proper rollback strategies


### 🚀 Next Steps:


- Practice với interactive demo above để solidify understanding
- Implement Query Key factory trong project hiện tại
- Explore React Query DevTools để visualize cache behavior
- Study advanced patterns như infinite queries và background sync


Với foundation này, bạn đã ready để leverage full power của React Query trong production applications! 💪


---


*💡 Pro tip: Bookmark demo playground này để reference khi cần nhớ lại React Query Keys best practices!*
