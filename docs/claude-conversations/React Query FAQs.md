# React Query FAQs

## You

React Query FAQs

## Claude


# 🎯 PHÂN TÍCH REACT QUERY FAQs - NHỮNG CÂU HỎI THƯỜNG GẶP


## 📝 TÓM TẮT CHÍNH


Bài viết này là **bộ sưu tập các câu hỏi thường gặp nhất về React Query** được tác giả Dominik (maintainer chính của React Query) tổng hợp sau 18 tháng support community. Đây là những vấn đề mà **80% developers mới học React Query đều gặp phải**, từ việc hiểu sai cách truyền parameters cho refetch đến những lỗi tinh vi về query keys và error handling.


**Tại sao quan trọng?** Vì những misunderstandings này không chỉ gây bugs mà còn làm mất đi những **tính năng cốt lõi mạnh mẽ nhất của React Query** như caching thông minh và declarative data fetching.


---


## 🔍 KHÁI NIỆM CỐT LÕI


### 1. Declarative Query Pattern


**Simple explanation:** Thay vì "khi click button thì fetch data", ta nghĩ theo kiểu "luôn hiển thị data tương ứng với state hiện tại"


### 2. Query Key Dependencies


**Simple explanation:** Query key giống như "địa chỉ" trong cache. Nếu địa chỉ khác nhau = data khác nhau, cùng địa chỉ = cùng data


### 3. Cache Invalidation vs Refetch


- **Refetch:** Gọi lại cùng API với cùng parameters
- **Invalidation:** Đánh dấu data cũ, trigger fetch mới
- **New Fetch:** Fetch với parameters hoàn toàn mới


### 4. Stable Reference Pattern


**Simple explanation:** Đảm bảo objects không bị recreate mỗi khi component re-render để tránh infinite loops


---


## 💡 HIỂU BẢN CHẤT


### 🎯 Pain Points được giải quyết:


1. **Manual Data Synchronization Hell** - Không cần manually sync data giữa các components
2. **Complex Loading States** - Auto handle loading, error, success states
3. **Cache Management Complexity** - Intelligent caching với minimal config
4. **Redundant Network Requests** - Dedupe requests và smart refetching


### ⚙️ Cơ chế hoạt động underlying:


```javascript
// Mental Model: React Query như một "Smart Cache Layer"
QueryCache = {
  ['user', 1]: { data: {...}, timestamp: 123456, status: 'success' },
  ['posts', 'trending']: { data: [...], timestamp: 123457, status: 'loading' },
  ['user', 2]: { data: {...}, timestamp: 123458, status: 'error' }
}
```


### 🤔 Tại sao choose React Query thay vì alternatives?


```
ApproachReact QueryRedux Toolkit QuerySWRManual FetchLearning CurveTrung bìnhCaoThấpThấpCaching Intelligence⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐Declarative API⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐Bundle SizeTrung bìnhLớnNhỏNhỏ nhất
```


---


## 🛠️ CODE EXAMPLES THỰC TẾ


### ❌ Sai lầm #1: Trying to pass parameters to refetch


```javascript
// 🚨 SAI - Approach cũ (imperative thinking)
const { data, refetch } = useQuery({
  queryKey: ['product'], // ❌ Key cố định
  queryFn: () => fetchProduct({ id: 1 }),
})

// ❌ Điều này KHÔNG hoạt động và phá vỡ caching
const handleShowProduct2 = () => {
  refetch({ id: 2 }) // Ghi đè data của product 1!
}
```


```javascript
// ✅ ĐÚNG - Declarative approach
const [productId, setProductId] = useState(1)

const { data } = useQuery({
  queryKey: ['product', productId], // ✅ Key dynamic theo dependency
  queryFn: () => fetchProduct({ id: productId }),
})

// ✅ Chỉ cần update state, React Query tự động fetch
const handleShowProduct2 = () => {
  setProductId(2) // Trigger fetch mới + cache riêng biệt
}
```


**Giải thích chi tiết:**


- **Dòng 3:** `productId` trong query key là dependency - khi thay đổi sẽ trigger fetch mới
- **Dòng 4:** `queryFn` nhận `productId` từ closure, luôn sync với state
- **Dòng 9:** Chỉ update state, không cần gọi fetch manually


### ✅ Real-world example: URL-based product catalog


```javascript
// 🎯 Production-ready example
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { keepPreviousData } from '@tanstack/react-query'

function ProductDetail() {
  const { productId } = useParams() // URL: /products/123

  const {
    data: product,
    isLoading,
    isError,
    isPlaceholderData // Flag để hiển thị loading state nhẹ
  } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => fetchProduct(productId),
    // ✅ Giữ data cũ khi switching products để UX mượt hơn
    placeholderData: keepPreviousData,
    // ✅ Cache trong 5 phút - giảm API calls
    staleTime: 5 * 60 * 1000,
  })

  return (
    <div>
      {/* ✅ Hiển thị loading indicator khi fetching data mới */}
      {isPlaceholderData && <div className="loading-overlay">Đang tải...</div>}

      {/* ✅ Navigation tự động trigger fetch mới */}
      <nav>
        <Link to="/products/1">Sản phẩm 1</Link>
        <Link to="/products/2">Sản phẩm 2</Link>
      </nav>

      {product && <ProductCard product={product} />}
    </div>
  )
}
```


---


## 🔄 SO SÁNH & PHÂN BIỆT


### 🆚 Imperative vs Declarative Data Fetching


```
Imperative (Manual)Declarative (React Query)"Khi click thì fetch""Luôn hiển thị data cho state hiện tại"Manual loading statesAuto loading statesManual error handlingCentralized error handlingManual cache managementIntelligent cachingEasy to introduce bugsType-safe và predictable
```


### 🆚 initialData vs placeholderData


```javascript
// ❌ initialData - Được cache như real data
const query1 = useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
  initialData: [], // ⚠️ Được treat như fresh data!
  staleTime: 5000, // ❌ Sẽ không fetch trong 5s
})

// ✅ placeholderData - Chỉ là temporary display
const query2 = useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
  placeholderData: [], // ✅ Chỉ hiển thị, vẫn fetch background
  staleTime: 5000, // ✅ Vẫn fetch bình thường
})
```


---


## 🎯 BEST PRACTICES


### 🏆 Query Key Factories Pattern


```javascript
// ✅ Centralized query key management
export const todoKeys = {
  all: ['todos'] as const,
  lists: () => [...todoKeys.all, 'list'] as const,
  list: (filters: string) => [...todoKeys.lists(), { filters }] as const,
  details: () => [...todoKeys.all, 'detail'] as const,
  detail: (id: number) => [...todoKeys.details(), id] as const,
}

// Usage
const todoListQuery = useQuery({
  queryKey: todoKeys.list(filters),
  queryFn: () => fetchTodos(filters),
})

// ✅ Type-safe invalidation
queryClient.invalidateQueries({ queryKey: todoKeys.lists() })
```


### 🛡️ Error Handling Best Practices


```javascript
// ✅ Proper fetch error handling
const fetchTodo = async (id: number) => {
  const response = await fetch(`/api/todos/${id}`)

  // ⚠️ fetch() không tự động reject cho 4xx/5xx
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  return response.json()
}

// ✅ Global error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Không retry cho 404, 401, 403
        if (error.status >= 400 && error.status < 500) return false
        return failureCount < 3
      },
      staleTime: 5 * 60 * 1000, // 5 phút
    },
  },
})
```


### ⚡ Performance Optimizations


```javascript
// ✅ Prefetching cho better UX
function ProductList() {
  const queryClient = useQueryClient()

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
  })

  const handleProductHover = (productId: number) => {
    // ✅ Prefetch khi user hover - instant navigation
    queryClient.prefetchQuery({
      queryKey: ['product', productId],
      queryFn: () => fetchProduct(productId),
      staleTime: 10 * 1000, // Cache trong 10s
    })
  }

  return (
    <div>
      {products?.map(product => (
        <ProductCard
          key={product.id}
          product={product}
          onMouseEnter={() => handleProductHover(product.id)}
        />
      ))}
    </div>
  )
}
```


---


## 🚀 ỨNG DỤNG THỰC TẾ


### 🛒 E-commerce Product Catalog


---


## 📚 KIẾN THỨC LIÊN QUAN


### 🎓 Prerequisites cần biết trước:


1. **React Hooks fundamentals** - `useState`, `useEffect`, `useContext`
2. **JavaScript Promises & async/await** - Hiểu cách Promise hoạt động
3. **HTTP Client libraries** - `fetch`, `axios`, hoặc tương tự
4. **React state management basics** - Hiểu về component re-rendering


### 🔗 Advanced topics để tìm hiểu tiếp:


```javascript
// 🚀 Advanced React Query Patterns

// 1. Optimistic Updates
const updateTodoMutation = useMutation({
  mutationFn: updateTodo,
  onMutate: async (newTodo) => {
    // ✅ Cancel ongoing queries
    await queryClient.cancelQueries({ queryKey: ['todos'] })

    // ✅ Snapshot previous value
    const previousTodos = queryClient.getQueryData(['todos'])

    // ✅ Optimistically update
    queryClient.setQueryData(['todos'], old =>
      old.map(todo => todo.id === newTodo.id ? newTodo : todo)
    )

    return { previousTodos }
  },
  onError: (err, newTodo, context) => {
    // ✅ Rollback on error
    queryClient.setQueryData(['todos'], context.previousTodos)
  },
})

// 2. Infinite Queries cho pagination
const {
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
} = useInfiniteQuery({
  queryKey: ['posts'],
  queryFn: ({ pageParam = 0 }) => fetchPosts(pageParam),
  getNextPageParam: (lastPage, pages) => lastPage.nextCursor,
})

// 3. Parallel Queries
const userQueries = useQueries({
  queries: userIds.map(id => ({
    queryKey: ['user', id],
    queryFn: () => fetchUser(id),
    staleTime: 2 * 60 * 1000,
  }))
})
```


### 🌐 Related technologies/concepts:


```
TechnologyRelationship với React QueryLearning ValueSWRAlternative data fetching librarySo sánh approachesRedux Toolkit QueryMore opinionated solutionEnterprise patternsZustand + React QueryState management comboScalable architectureNext.js SSRServer-side integrationFull-stack considerationsGraphQL + React QueryType-safe API layerModern API patterns
```


---


## 💼 INTERVIEW PERSPECTIVE


### 🎯 Câu hỏi interview có thể gặp:


**Q1:** *"Tại sao không nên pass parameters cho refetch function trong React Query?"*


**✅ Câu trả lời professional:**


```
"Vì refetch được thiết kế để replay cùng một request với cùng parameters.
Nếu pass parameters mới, data sẽ ghi đè lên cache entry hiện tại thay vì
tạo cache entry mới. Điều này phá vỡ tính năng caching intelligent của React Query.

Thay vào đó, ta nên sử dụng dynamic query keys để trigger fetch mới
cho data khác nhau, đảm bảo mỗi data variation có cache riêng biệt."
```


**Q2:** *"So sánh initialData vs placeholderData trong React Query"*


**✅ Câu trả lời chi tiết:**


```
initialData:
- Được treat như real data và cached
- Ảnh hưởng bởi staleTime settings
- Dùng khi có actual data synchronously available
- Ví dụ: data từ localStorage hoặc SSR

placeholderData:
- Chỉ để display, không được cached
- Luôn trigger background fetch
- Dùng cho fallback UI states
- Ví dụ: empty array, skeleton screens
```


**Q3:** *"Explain React Query's mental model về caching"*


**✅ Approach system thinking:**


```
"React Query hoạt động như một normalized cache layer:

1. Query Key = Cache address (mảng values)
2. Mỗi unique key = separate cache entry
3. Cache có lifecycle: fresh → stale → inactive → garbage collected
4. Automatic background refetching khi data stale
5. Deduplication cho concurrent requests với cùng key

Ví dụ: ['user', 1] và ['user', 2] là hai cache entries hoàn toàn khác nhau."
```


### 🏆 Điểm cộng khi demonstrate knowledge:


1. **Hiểu declarative thinking:** Explain được sự chuyển từ imperative sang declarative mindset
2. **Performance awareness:** Nói về caching strategies, prefetching, stale-time optimization
3. **Real-world experience:** Share concrete examples từ dự án đã làm
4. **Error handling:** Demonstrate understanding về network errors, retry logic
5. **Testing considerations:** Hiểu cách mock và test React Query code


### 🎯 Sample technical challenge:


```javascript
// ❓ INTERVIEWER: "Optimize này để giảm API calls"
function UserProfile({ userId }) {
  const { data: user } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
  })

  const { data: posts } = useQuery({
    queryKey: ['posts', userId],
    queryFn: () => fetchUserPosts(userId),
  })

  return <div>{/* render user + posts */}</div>
}

// ✅ OPTIMIZED ANSWER:
function UserProfile({ userId }) {
  const queryClient = useQueryClient()

  const { data: user } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
    staleTime: 5 * 60 * 1000, // ✅ Cache 5 minutes
  })

  const { data: posts } = useQuery({
    queryKey: ['posts', userId],
    queryFn: () => fetchUserPosts(userId),
    enabled: !!user, // ✅ Chỉ fetch khi có user
    staleTime: 2 * 60 * 1000, // ✅ Posts update thường xuyên hơn
  })

  // ✅ Prefetch related data
  React.useEffect(() => {
    if (user?.friendIds) {
      user.friendIds.forEach(friendId => {
        queryClient.prefetchQuery({
          queryKey: ['user', friendId],
          queryFn: () => fetchUser(friendId),
          staleTime: 5 * 60 * 1000,
        })
      })
    }
  }, [user, queryClient])

  return <div>{/* render user + posts */}</div>
}
```


---


## 🎊 KẾT LUẬN


React Query **không chỉ là một data fetching library** - nó là một **paradigm shift** trong cách chúng ta tư duy về client-side data management. Bài viết của Dominik highlight những **mental model shifts quan trọng nhất**:


### 🔄 Mindset Transformation:


- **Từ:** "Khi nào fetch?" → **Đến:** "Data nào cần hiển thị?"
- **Từ:** Imperative control → **Đến:** Declarative dependencies
- **Từ:** Manual state management → **Đến:** Intelligent caching


### 🎯 Key Takeaways cho Production:


1. **Query Keys là dependencies** - treat them như React dependency arrays
2. **Embrace declarative pattern** - let React Query handle the "when" và "how"
3. **Use TypeScript + Query Key Factories** để avoid silly bugs
4. **Stable QueryClient reference** để tránh cache loss
5. **Proper error handling** với fetch API và try-catch patterns


### 🚀 Next Learning Steps:


1. **Practice với complex scenarios:** Infinite queries, parallel fetching
2. **Learn advanced patterns:** Optimistic updates, dependent queries
3. **Integration testing:** Mock React Query trong unit tests
4. **Performance monitoring:** Measure cache hit rates, network requests
5. **Real-world application:** Build một production app với proper data layer


**Bottom line:** React Query transforms frontend data management từ một "necessary evil" thành một **powerful, predictable, và enjoyable** development experience. Master những concepts này, và bạn sẽ never look back! 🎉
