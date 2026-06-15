# React Query Testing Techniques

## You

Testing React Query

## Claude


# 🧪 Testing React Query - Complete Analysis


## 1. 📝 TÓM TẮT CHÍNH


Bài viết này giải quyết một trong những **pain points** lớn nhất khi làm việc với React Query: **làm sao để test các components sử dụng hooks như useQuery một cách hiệu quả**. Vấn đề này quan trọng vì với sự phổ biến của hooks, các components không còn "pure" nữa - chúng phụ thuộc vào external dependencies như network requests, cache, và async state.


Tác giả cung cấp một **complete testing strategy** từ việc mock network requests đến setup testing environment phù hợp cho React Query.


## 2. 🔍 KHÁI NIỆM CỐT LÕI


### Smart Components vs Pure Components


```javascript
// ❌ Pure Component - dễ test
function PureComponent({ data, loading }) {
  return loading ? <Spinner /> : <div>{data}</div>
}

// ⚠️ Smart Component - khó test hơn vì phụ thuộc external state
function SmartComponent() {
  const { data, isLoading } = useQuery(['users'], fetchUsers)
  return isLoading ? <Spinner /> : <div>{data}</div>
}
```


### Mock Service Worker (MSW)


- **Bản chất**: Interceptor cho network requests ở service worker level
- **Tại sao quan trọng**: Cho phép mock API responses mà không cần mock fetch/axios trực tiếp
- **So sánh**: Giống như having a fake backend server chỉ cho testing


### QueryClientProvider & QueryClient


```javascript
// QueryClient = vessel chứa QueryCache
// QueryCache = nơi store data của tất cả queries
const queryClient = new QueryClient()

// QueryClientProvider = Context provider để share QueryClient trong component tree
<QueryClientProvider client={queryClient}>
  <App />
</QueryClientProvider>
```


## 3. 💡 HIỂU BẢN CHẤT


### Pain Points được giải quyết:


1. **Async Nature**: React Query là async by default → tests cần handle loading states
2. **Network Dependencies**: Components cần API data → cần mock network layer
3. **Shared State**: QueryCache share data between components → tests có thể conflict
4. **Retries**: Default 3 retries với exponential backoff → tests timeout


### Tại sao approach này tốt hơn alternatives:


```
ApproachProsConsMSW✅ Single source of truth<br/>✅ Works across environments⚠️ Learning curveMock fetch directly✅ Simple setup❌ Fragile, hard to maintainMock API client✅ Type-safe❌ Doesn't test network layer
```


## 4. 🛠️ CODE EXAMPLES THỰC TẾ


### Setup Testing Wrapper


```javascript
const createWrapper = () => {
  // ✅ Tạo QueryClient mới cho mỗi test để isolation
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // ✅ Tắt retries để tránh timeout trong tests
        retry: false,
      },
    },
  })

  // Return wrapper component để wrap test components
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

// Sử dụng trong test
test('should fetch user data', async () => {
  const { result } = renderHook(() => useUserQuery(), {
    wrapper: createWrapper(), // Wrap hook trong QueryClientProvider
  })

  // Chờ query complete
  await waitFor(() => result.current.isSuccess)

  expect(result.current.data).toBeDefined()
})
```


### Testing Components với React Query


```javascript
// Component cần test
function UserProfile({ userId }) {
  const { data, isLoading, error } = useQuery(
    ['user', userId],
    () => fetchUser(userId)
  )

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  return <div>Welcome {data.name}!</div>
}

// Test cho component
test('should display user name when loaded', async () => {
  // Setup MSW mock
  server.use(
    rest.get('/api/users/1', (req, res, ctx) => {
      return res(ctx.json({ id: 1, name: 'John Doe' }))
    })
  )

  render(<UserProfile userId={1} />, {
    wrapper: createWrapper() // Wrap component trong QueryClientProvider
  })

  // Verify loading state
  expect(screen.getByText('Loading...')).toBeInTheDocument()

  // Wait for data to load
  await waitFor(() => {
    expect(screen.getByText('Welcome John Doe!')).toBeInTheDocument()
  })
})
```


### Advanced: Custom Query Defaults


```javascript
// ❌ Không nên set retry trực tiếp trong useQuery
function BadExample() {
  const query = useQuery({
    queryKey: ['todos'],
    queryFn: fetchTodos,
    retry: 5, // Hard to override trong tests!
  })
}

// ✅ Nên sử dụng setQueryDefaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2 }, // Default cho tất cả queries
  },
})

// Set specific defaults cho specific query keys
queryClient.setQueryDefaults(['todos'], { retry: 5 })

function GoodExample() {
  // Query này sẽ retry 5 lần vì setQueryDefaults
  const query = useQuery({
    queryKey: ['todos'],
    queryFn: fetchTodos,
    // Không cần set retry ở đây
  })
}
```


## 5. 🔄 SO SÁNH & PHÂN BIỆT


### Testing Strategies Comparison


```
StrategyUse CaseProsConsWhen to UseMSWFull integration testsReal network simulationSetup complexityTesting complete user flowsMock Query ClientUnit testsFast, isolatedDoesn't test network layerTesting component logic onlyMock API functionsSpecific endpointsGranular controlBrittle, needs maintenanceTesting error cases
```


### Wrapper Approaches


```javascript
// Approach 1: Function wrapper (Recommended)
const createWrapper = () => {
  const queryClient = new QueryClient(/* config */)
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

// Approach 2: Component wrapper
const TestWrapper = ({ children }) => {
  const queryClient = new QueryClient(/* config */)
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

// Approach 1 tốt hơn vì tạo QueryClient mới cho mỗi test
```


## 6. 🎯 BEST PRACTICES


### ⚠️ Common Mistakes cần tránh:


1. **Sharing QueryClient between tests**
javascript// ❌ Sai - cache pollution
const queryClient = new QueryClient()

// ✅ Đúng - fresh client mỗi test
const createWrapper = () => new QueryClient()
2. **Forgetting to turn off retries**
javascript// ❌ Tests sẽ timeout
const queryClient = new QueryClient() // default 3 retries

// ✅ Tắt retries cho tests
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } }
})
3. **Not waiting for async operations**
javascript// ❌ Test có thể fail vì chưa load xong
const { result } = renderHook(() => useQuery())
expect(result.current.data).toBeDefined()

// ✅ Chờ query complete
await waitFor(() => result.current.isSuccess)
expect(result.current.data).toBeDefined()


### 🚀 Performance Considerations:


- **Isolate tests**: Mỗi test nên có QueryClient riêng
- **Use MSW**: Faster than mocking individual functions
- **Minimal network mocks**: Only mock what you need to test


## 7. 🚀 ỨNG DỤNG THỰC TẾ


### E-commerce Application Testing


```javascript
// Test shopping cart với React Query
test('should update cart when item added', async () => {
  server.use(
    rest.post('/api/cart/items', (req, res, ctx) => {
      return res(ctx.json({ success: true, cartTotal: 5 }))
    })
  )

  render(<AddToCartButton productId="123" />, {
    wrapper: createWrapper()
  })

  fireEvent.click(screen.getByText('Add to Cart'))

  await waitFor(() => {
    expect(screen.getByText('Added to cart!')).toBeInTheDocument()
  })
})
```


### Dashboard Application Testing


```javascript
// Test real-time data updates
test('should show latest metrics', async () => {
  const mockMetrics = { users: 1000, revenue: 50000 }

  server.use(
    rest.get('/api/metrics', (req, res, ctx) => {
      return res(ctx.json(mockMetrics))
    })
  )

  render(<MetricsDashboard />, { wrapper: createWrapper() })

  await waitFor(() => {
    expect(screen.getByText('Users: 1000')).toBeInTheDocument()
    expect(screen.getByText('Revenue: $50,000')).toBeInTheDocument()
  })
})
```


## 8. 📚 KIẾN THỨC LIÊN QUAN


### Prerequisites:


- React Testing Library fundamentals
- Jest mocking strategies
- React hooks concepts
- Async/await patterns


### Advanced Topics:


- **React Query DevTools** integration trong tests
- **Optimistic Updates** testing strategies
- **Infinite Queries** testing patterns
- **Mutations** testing with error handling


### Related Technologies:


- **SWR** (alternative to React Query)
- **Apollo GraphQL** testing strategies
- **Redux Toolkit Query** testing approaches


## 9. 💼 INTERVIEW PERSPECTIVE


### Câu hỏi phổ biến:


**Q: "Làm sao để test một component sử dụng useQuery?"**


**A:** "Có 3 steps chính:


1. **Setup QueryClientProvider** với QueryClient có retry: false
2. **Mock network layer** bằng MSW hoặc mock API functions
3. **Wait for async operations** bằng waitFor() trước khi assert"


**Q: "Tại sao cần tắt retries trong tests?"**


**A:** "React Query default retry 3 lần với exponential backoff. Trong tests, nếu mock API return error, query sẽ retry nhiều lần làm test timeout. Tắt retries giúp tests run faster và predictable hơn."


**Q: "MSW vs mock fetch trực tiếp - nên chọn gì?"**


**A:** "MSW tốt hơn vì:


- **Single source of truth** cho tất cả network mocks
- **Works across environments** (node, browser, storybook)
- **More realistic** - simulate actual network behavior
- **Better maintenance** - centralized API mocking"


### Điểm cộng khi demonstrate:


- Hiểu được async nature của React Query
- Biết cách isolate tests để tránh cache pollution
- Understand trade-offs giữa different mocking strategies
- Có experience với MSW setup


## 10. 🎪 DEMO INTERACTIVE


Tôi sẽ tạo một working example để bạn có thể experiment:


## 🎉 KẾT LUẬN


Bài viết này cung cấp một **complete roadmap** cho việc testing React Query - một skill set quan trọng mà mọi React developer cần master. Từ những concepts cơ bản như setup QueryClientProvider đến advanced techniques như MSW integration, author đã build một foundation vững chắc cho testing strategy.


### 🔑 Key Takeaways:


1. **Isolation is key** - Mỗi test cần QueryClient riêng để tránh cache pollution
2. **Turn off retries** - Essential để tests không timeout
3. **MSW > manual mocks** - Provide better, more maintainable testing experience
4. **Always await async** - React Query là async by nature, tests phải handle đúng cách


### 🚀 Next Steps:


- Practice implementing testing strategies này trong current projects
- Explore MSW setup cho real applications
- Study React Query DevTools integration trong tests
- Learn about testing Infinite Queries và Optimistic Updates


Với knowledge từ bài viết này, bạn có thể confidently test bất kỳ React Query implementation nào và explain approach clearly trong technical interviews! 🎯
