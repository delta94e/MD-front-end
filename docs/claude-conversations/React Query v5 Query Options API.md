# React Query v5 Query Options API

## You

#24: The Query Options API

## Claude


# 🚀 React Query v5: Query Options API - Game Changer cho Data Fetching


## 📝 1. TÓM TẮT CHÍNH


React Query v5 đã thực hiện một breaking change quan trọng: **chuyển từ multiple arguments sang single object pattern** cho tất cả functions. Thay vì truyền `queryKey`, `queryFn` và options riêng biệt, giờ ta chỉ cần truyền một object duy nhất chứa tất cả. Điều này không chỉ đơn giản hóa API mà còn mở ra những pattern mới mạnh mẽ cho **type safety** và **code reusability**.


---


## 🔍 2. KHÁI NIỆM CỐT LÕI


### Query Options Object


```typescript
// ❌ Cách cũ (v4 và trước)
useQuery(['todos'], fetchTodos, { staleTime: 5000 })

// ✅ Cách mới (v5+)
useQuery({
  queryKey: ['todos'],    // Unique identifier cho query
  queryFn: fetchTodos,    // Function fetch data
  staleTime: 5000         // Options khác
})
```


### queryOptions() Helper


- **Runtime**: Không làm gì cả, chỉ return input
- **Compile time**: Cung cấp type safety và data tagging mạnh mẽ


### DataTag Symbol


- Một TypeScript "magic" cho phép associate type information với queryKey
- Giúp `getQueryData()` biết chính xác type sẽ return mà không cần manual type assertion


---


## 💡 3. HIỂU BẢN CHẤT


### 🎯 Pain Points được giải quyết:


**Problem 1: API Inconsistency**


```typescript
// Trước kia có quá nhiều cách gọi function
useQuery(['key'], fn, options)
useQuery(['key'], fn)
useQuery({ queryKey: ['key'], queryFn: fn })
```


**Problem 2: Code Duplication**


```typescript
// Không thể reuse query definition giữa các functions
useQuery(['todos'], fetchTodos, { staleTime: 5000 })
queryClient.prefetchQuery(['todos'], fetchTodos, { staleTime: 5000 })
// ❌ Duplicate code everywhere!
```


**Problem 3: Type Safety Issues**


```typescript
// TypeScript không catch typos trong separate objects
const todosQuery = {
  queryKey: ['todos'],
  stallTime: 5000  // ❌ Typo! Nhưng TS không báo lỗi
}
```


### 🔧 Solution Mechanism:


Single object pattern tạo ra **"Query Definition"** - một abstraction level cho phép:


- **Consistency**: Mọi function đều nhận cùng interface
- **Reusability**: Định nghĩa một lần, dùng nhiều nơi
- **Type Safety**: TypeScript có thể validate đầy đủ


---


## 🛠️ 4. CODE EXAMPLES THỰC TẾ


### Basic Migration


```typescript
// 🔴 React Query v4
const TodosOld = () => {
  const { data } = useQuery(
    ['todos'],           // Query key
    fetchTodos,          // Query function
    { staleTime: 5000 }  // Options
  )
  return <div>{data?.map(todo => todo.title)}</div>
}

// 🟢 React Query v5
const TodosNew = () => {
  const { data } = useQuery({
    queryKey: ['todos'],      // Tất cả trong một object
    queryFn: fetchTodos,      // Dễ đọc, dễ maintain
    staleTime: 5000           // IntelliSense support tốt hơn
  })
  return <div>{data?.map(todo => todo.title)}</div>
}
```


### Query Definition Pattern


```typescript
// ✨ Định nghĩa query một lần
const todosQuery = {
  queryKey: ['todos'],
  queryFn: fetchTodos,
  staleTime: 5000,
  refetchOnWindowFocus: false
}

// 🎯 Sử dụng ở nhiều nơi khác nhau
function TodosList() {
  const { data } = useQuery(todosQuery)           // ✅ Component
  return <div>...</div>
}

function prefetchTodos() {
  queryClient.prefetchQuery(todosQuery)          // ✅ Prefetching
}

function TodosSuspense() {
  const { data } = useSuspenseQuery(todosQuery)  // ✅ Suspense
  return <div>...</div>
}

// 🔥 Tất cả cùng config, zero duplication!
```


### Advanced Query Factory


```typescript
// 🏭 Query Factory Pattern - Industrial Strength
const todoQueries = {
  // 📋 Base keys cho hierarchy
  all: () => ['todos'] as const,
  lists: () => [...todoQueries.all(), 'list'] as const,
  details: () => [...todoQueries.all(), 'detail'] as const,

  // 🎯 Specific queries với full options
  list: (filters: TodoFilters) => queryOptions({
    queryKey: [...todoQueries.lists(), filters],
    queryFn: () => fetchTodos(filters),
    staleTime: 5 * 60 * 1000,  // 5 phút
    cacheTime: 10 * 60 * 1000, // 10 phút
  }),

  detail: (id: number) => queryOptions({
    queryKey: [...todoQueries.details(), id],
    queryFn: () => fetchTodo(id),
    staleTime: 10 * 60 * 1000, // 10 phút cho detail
  }),
}

// 🚀 Usage trong components
function TodoDetail({ id }: { id: number }) {
  const { data: todo } = useQuery(todoQueries.detail(id))

  // ✨ Type automatically inferred!
  //     todo: Todo | undefined

  return <div>{todo?.title}</div>
}
```


---


## 🔄 5. SO SÁNH & PHÂN BIỆT


### 📊 Comparison Table


```
AspectReact Query v4React Query v5WinnerAPI ConsistencyMultiple overloadsSingle object patternv5 🏆Code ReuseCustom hooks onlyQuery definitions + hooksv5 🏆Type SafetyManual type assertionsAuto-inferred từ queryFnv5 🏆Learning CurveMultiple patterns to learnOne pattern to rule them allv5 🏆Migration Effort-Breaking changesv4 🏆
```


### 🔄 Pattern Evolution


```typescript
// 🥉 Level 1: Basic Custom Hook (v4 style)
const useTodos = () => useQuery(['todos'], fetchTodos)

// 🥈 Level 2: Query Definition (v5 style)
const todosQuery = { queryKey: ['todos'], queryFn: fetchTodos }
const useTodos = () => useQuery(todosQuery)

// 🥇 Level 3: Query Factory (v5 advanced)
const todoQueries = {
  list: (filters) => queryOptions({
    queryKey: ['todos', filters],
    queryFn: () => fetchTodos(filters)
  })
}
```


---


## 🎯 6. BEST PRACTICES


### ✅ DO's


```typescript
// ✅ Luôn dùng queryOptions() cho type safety
const userQuery = (id: number) => queryOptions({
  queryKey: ['users', id],
  queryFn: () => fetchUser(id),
})

// ✅ Co-locate queryKey và queryFn
// Mọi dependency của queryFn phải có trong queryKey
const postsQuery = (userId: number, filters: PostFilters) => queryOptions({
  queryKey: ['posts', userId, filters], // ✅ All dependencies included
  queryFn: () => fetchPosts(userId, filters)
})

// ✅ Sử dụng hierarchy trong query factories
const queries = {
  users: {
    all: () => ['users'],
    byId: (id: number) => [...queries.users.all(), id],
    detail: (id: number) => queryOptions({
      queryKey: queries.users.byId(id),
      queryFn: () => fetchUser(id)
    })
  }
}
```


### ❌ DON'Ts


```typescript
// ❌ Không tách rời queryKey và queryFn
const USER_KEYS = {
  detail: (id: number) => ['users', id]
}
// ... somewhere else
const { data } = useQuery({
  queryKey: USER_KEYS.detail(userId), // ❌ Separated!
  queryFn: () => fetchUser(userId)
})

// ❌ Không skip queryOptions() nếu cần type safety
const badQuery = {
  queryKey: ['users'],
  queryFn: fetchUsers,
  stallTime: 5000  // ❌ Typo sẽ không được catch!
}

// ❌ Không dùng quá nhiều custom hooks đơn giản
const useUsers = () => useQuery(usersQuery) // ❌ Pointless wrapper
```


### ⚡ Performance Considerations


```typescript
// ⚠️ Cẩn thận với object recreation
function BadComponent({ filters }: Props) {
  const { data } = useQuery({
    queryKey: ['todos', filters],
    queryFn: () => fetchTodos(filters), // ❌ New function mỗi render!
  })
}

// ✅ Better approach
const todosQuery = (filters: Filters) => queryOptions({
  queryKey: ['todos', filters],
  queryFn: () => fetchTodos(filters), // ✅ Stable reference
})

function GoodComponent({ filters }: Props) {
  const { data } = useQuery(todosQuery(filters))
}
```


---


## 🚀 7. ỨNG DỤNG THỰC TẾ


### 📱 E-commerce Application


### 🎮 Interactive Features:


- **Real-time filtering** - Thay đổi filters và thấy ngay kết quả
- **Hover prefetching** - Hover vào card để simulate prefetch (check console)
- **Loading states** - Experience smooth loading với skeleton UI
- **Type safety** - Tất cả data đều được type correctly


---


## 📚 8. KIẾN THỨC LIÊN QUAN


### 📋 Prerequisites cần biết:


```typescript
// 🔧 React Hooks fundamentals
useEffect, useState, useCallback, useMemo

// 🎯 JavaScript ES6+ features
async/await, destructuring, spread operator, optional chaining

// 🏗️ TypeScript basics
interface, type, generic types, union types

// 🌐 HTTP & API concepts
REST API, caching, error handling, retry logic
```


### 🔗 Advanced topics để học tiếp:


1. **React Query Advanced Patterns:**
typescript// 🔄 Optimistic Updates
const mutation = useMutation({
  mutationFn: updateTodo,
  onMutate: async (newTodo) => {
    await queryClient.cancelQueries({ queryKey: ['todos'] })
    const previousTodos = queryClient.getQueryData(['todos'])
    queryClient.setQueryData(['todos'], old => [...old, newTodo])
    return { previousTodos }
  }
})

// ♾️ Infinite Queries
const {
  data,
  fetchNextPage,
  hasNextPage
} = useInfiniteQuery({
  queryKey: ['todos'],
  queryFn: ({ pageParam = 0 }) => fetchTodos(pageParam),
  getNextPageParam: (lastPage, pages) => lastPage.nextCursor,
})
2. **Performance Optimization:**

Query deduplication
Background refetching
Window focus refetching
Stale-while-revalidate pattern
3. **Error Boundaries & Suspense:**
typescript// 🔄 Error Boundaries với React Query
const { data } = useSuspenseQuery(todoQueries.list())
// Automatically throws errors to nearest Error Boundary


### 🔗 Related Technologies:


- **SWR** - Alternative data fetching library
- **Apollo Client** - GraphQL client với similar caching
- **Zustand/Redux** - State management (complement, không replace)
- **React Router** - Integration patterns với routing


---


## 💼 9. INTERVIEW PERSPECTIVE


### 📋 Câu hỏi Interview có thể gặp:


**Q1: "Tại sao React Query v5 lại thay đổi từ multiple arguments sang single object?"**


✅ **Professional Answer:**


>
> "React Query v5 chuyển sang single object pattern vì 3 lý do chính:
>
>
> **1. API Consistency:** Loại bỏ confusion về multiple overloads, giờ mọi function đều nhận cùng interface
>
>
> **2. Better Abstraction:** Single object cho phép tạo "query definitions" - có thể reuse giữa useQuery, prefetchQuery, invalidateQueries
>
>
> **3. Type Safety:** Với queryOptions() helper, TypeScript có thể auto-infer types và catch typos tốt hơn thông qua DataTag symbol"
>
>


**Q2: "Sự khác biệt giữa Custom Hooks pattern và Query Factory pattern?"**


✅ **Expert Answer:**


```typescript
// ❌ Custom Hook - Limited reusability
const useTodos = () => useQuery(['todos'], fetchTodos)

// ✅ Query Factory - Maximum flexibility
const todoQueries = {
  list: () => queryOptions({
    queryKey: ['todos'],
    queryFn: fetchTodos
  })
}

// Có thể dùng với useQuery, prefetchQuery, useSuspenseQuery...
```


**Q3: "Giải thích DataTag Symbol hoạt động như thế nào?"**


✅ **Advanced Answer:**


>
> "DataTag Symbol là TypeScript "magic" để associate return type của queryFn với queryKey. Khi bạn gọi `queryOptions()`, nó "tag" queryKey với type information. Sau đó `getQueryData()` đọc tag này để infer correct type, eliminating need for manual type assertions."
>
>


### 🏆 Điểm cộng khi demonstrate:


1. **Code Organization:**
typescript// ✨ Show clean separation of concerns
const queries = {
  users: userQueries,    // User-related queries
  posts: postQueries,    // Post-related queries
  comments: commentQueries // Comment-related queries
}
2. **Performance Awareness:**
typescript// 🚀 Demonstrate understanding of caching strategy
const expensiveQuery = queryOptions({
  queryKey: ['heavy-computation', params],
  queryFn: () => heavyComputation(params),
  staleTime: 10 * 60 * 1000, // Cache 10 minutes
  cacheTime: 30 * 60 * 1000, // Keep in memory 30 minutes
})
3. **Error Handling:**
typescript// 🛡️ Proper error boundaries integration
const { data, error, isLoading } = useQuery({
  ...todoQueries.list(),
  retry: (failureCount, error) => {
    if (error.status === 404) return false
    return failureCount < 3
  },
  retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
})


### 🎯 Câu hỏi follow-up để prepared:


- "Khi nào bạn sẽ không dùng React Query?"
- "So sánh React Query với Redux for data fetching"
- "Explain concept của stale-while-revalidate"
- "How would you handle real-time data với React Query?"


### 💡 Pro Tips cho Interview:


1. **Always mention trade-offs:** "React Query tuyệt vời cho server state, nhưng client state vẫn cần Zustand/Redux"
2. **Show practical experience:** Mention specific scenarios bạn đã solve với React Query
3. **Demonstrate performance thinking:** Discuss caching strategies, prefetching, background updates
4. **Security awareness:** Mention how React Query handles sensitive data và token refresh


---


## 🎯 CONCLUSION


React Query v5's Query Options API đại diện cho một **paradigm shift** quan trọng trong cách chúng ta approach data fetching. Single object pattern không chỉ simplify API mà còn unlock powerful patterns như Query Factories và enhanced type safety.


### 🔑 Key Takeaways:


1. **One Object to Rule Them All** - Consistency across toàn bộ API
2. **Type Safety First** - queryOptions() + DataTag = zero manual assertions
3. **Reusability Over Custom Hooks** - Query definitions có thể share everywhere
4. **Co-location Principle** - queryKey và queryFn luôn together


Đây là direction mà modern data fetching đang hướng tới - **declarative, type-safe, và highly reusable**. Nếu bạn chưa migrate lên v5, đây chính là lúc perfect để start! 🚀
