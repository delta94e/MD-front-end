# React Query Infinite Queries Deep Dive

## You

How Infinite Queries work

## Claude


# 🔄 Phân Tích Deep Dive: Infinite Queries trong React Query


## 📝 TÓM TẮT CHÍNH


Bài viết này khám phá một bug critical trong **Infinite Queries** của React Query - nơi mà mechanism retry bị broken và gây ra việc restart toàn bộ page-fetching loop thay vì tiếp tục từ điểm failed. Đây là vấn đề architecture-level nghiêm trọng có thể làm ứng dụng infinite scroll không bao giờ load được hết data khi gặp rate limiting hoặc network issues.


## 🔍 KHÁI NIỆM CỐT LÕI


### 1. Infinite Queries


```javascript
// Infinite Query = Single Query + Pagination Behavior
// Thay vì fetch một lần, nó fetch nhiều "pages" tuần tự
const infiniteQuery = useInfiniteQuery({
  queryKey: ['posts'],
  queryFn: ({ pageParam = 0 }) => fetchPosts(pageParam),
  getNextPageParam: (lastPage, pages) => lastPage.nextCursor,
})
```


### 2. Query Class Architecture


```javascript
// Mỗi query trong cache được represent bởi một Query instance
class Query {
  constructor() {
    this.state = { data: null, fetchStatus: 'idle' }
    this.retryer = null // Chịu trách nhiệm retry logic
  }

  // Single point of truth cho việc fetch data
  fetch() {
    if (this.state.fetchStatus === 'idle') {
      this.retryer = createRetryer({
        fetchFn: this.options.queryFn, // Đây là nơi magic xảy ra
        retry: 3, // Default retry count
      })
    }
    return this.retryer.promise
  }
}
```


### 3. QueryBehavior Pattern


```javascript
// Infinite Query chỉ khác Single Query ở behavior layer
const infiniteQueryBehavior = {
  onFetch: (context, queryFn) => {
    return async function fetchFn() {
      // Đây là function được pass vào retryer
      // Nó sẽ fetch ALL pages trong một lần call
      const result = { pages: [] }
      let currentPage = 0

      while (currentPage < remainingPages) {
        const pageData = await queryFn(pageParam)
        result.pages.push(pageData)
        currentPage++
      }

      return result
    }
  }
}
```


## 💡 HIỂU BẢN CHẤT


### Pain Point được giải quyết:


- **Infinite Scrolling Implementation**: Trước khi có Infinite Queries, developers phải manually manage pagination state, caching, và loading states
- **Data Deduplication**: Tránh việc fetch duplicate data khi user scroll lên xuống
- **Background Refetch**: Auto sync data khi có updates


### Cơ chế hoạt động:


```javascript
// Architecture Hierarchy (QUAN TRỌNG để hiểu bug)
Query Instance
  └── Retryer (retry logic)
      └── FetchFunction (từ QueryBehavior)
          └── Loop through pages (infinite query specific)
```


### Tại sao approach này được chọn:


- **Consistency**: Single queries và infinite queries share cùng caching mechanism
- **Simplicity**: Chỉ cần attach behavior khác, không cần separate query type
- **Performance**: Reuse existing infrastructure


## 🛠️ CODE EXAMPLES THỰC TẾ


### Bug Reproduction:


```javascript
// Tình huống gây bug
const problematicInfiniteQuery = useInfiniteQuery({
  queryKey: ['posts'],
  queryFn: async ({ pageParam = 0 }) => {
    // Giả sử page 3 bị rate limited
    if (pageParam === 3) {
      throw new Error('Rate limited')
    }
    return fetchPosts(pageParam)
  },
  getNextPageParam: (lastPage, pages) =>
    lastPage.hasMore ? pages.length : undefined,
  retry: 3, // Đây là root cause của bug
})

// Điều gì xảy ra:
// 1. Fetch page 0 ✅
// 2. Fetch page 1 ✅
// 3. Fetch page 2 ✅
// 4. Fetch page 3 ❌ (rate limited)
// 5. RETRY: Restart từ page 0 (thay vì retry page 3)
// 6. Lại fetch page 0,1,2,3 và fail ở page 3
// 7. Infinite loop!
```


### Code Fix với Closure Pattern:


```javascript
function infiniteQueryBehavior() {
  return {
    onFetch: (context, queryFn) => {
      // Hoist variables ra ngoài fetchFn để remember state
      const remainingPages = context.data.length
      let currentPage = 0 // Closure variable - quan trọng!
      const result = { pages: [] }

      return async function fetchFn() {
        // Khi retry, function này được call lại
        // Nhưng currentPage và result vẫn giữ nguyên giá trị

        do {
          // Chỉ fetch từ page hiện tại trở đi
          const param = getNextPageParam(result)
          if (param == null) break

          try {
            result.pages.push(await queryFn(param))
            currentPage++
          } catch (error) {
            // Khi error, retryer sẽ pause và retry
            // Lần retry tiếp theo sẽ continue từ currentPage này
            throw error
          }
        } while (currentPage < remainingPages)

        return result
      }
    }
  }
}
```


## 🔄 SO SÁNH & PHÂN BIỆT


```
data: Tdata: { pages: T[] }data: { pages: T[] }
```


### Khi nào dùng từng approach:


```javascript
// Single Query: Khi data có thể fit trong 1 response
const userProfile = useQuery({
  queryKey: ['user', userId],
  queryFn: () => fetchUser(userId)
})

// Infinite Query: Khi data cần pagination
const postsList = useInfiniteQuery({
  queryKey: ['posts'],
  queryFn: ({ pageParam }) => fetchPosts(pageParam),
  getNextPageParam: (lastPage) => lastPage.nextCursor
})
```


## 🎯 BEST PRACTICES


### ⚠️ Common Mistakes cần tránh:


```javascript
// ❌ BAD: Không handle edge cases
const badInfiniteQuery = useInfiniteQuery({
  queryKey: ['posts'],
  queryFn: ({ pageParam = 0 }) => fetchPosts(pageParam),
  // Missing getNextPageParam - sẽ chỉ fetch 1 page!
})

// ✅ GOOD: Complete configuration
const goodInfiniteQuery = useInfiniteQuery({
  queryKey: ['posts'],
  queryFn: ({ pageParam = 0 }) => fetchPosts(pageParam),
  getNextPageParam: (lastPage, allPages) => {
    // Luôn check hasMore hoặc nextCursor
    return lastPage.hasMore ? allPages.length : undefined
  },
  retry: (failureCount, error) => {
    // Custom retry logic cho rate limiting
    if (error.status === 429) return failureCount < 5
    return failureCount < 3
  },
  retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
})
```


### Performance Considerations:


```javascript
// Memory management cho large datasets
const optimizedInfiniteQuery = useInfiniteQuery({
  queryKey: ['posts'],
  queryFn: ({ pageParam = 0 }) => fetchPosts(pageParam),
  getNextPageParam: (lastPage) => lastPage.nextCursor,
  // Giới hạn số pages trong memory
  maxPages: 10, // React Query v5 feature
  // Stale time để avoid unnecessary refetches
  staleTime: 5 * 60 * 1000, // 5 minutes
})
```


## 🚀 ỨNG DỤNG THỰC TẾ


### E-commerce Product Listing:


```javascript
const useProductListing = (category) => {
  return useInfiniteQuery({
    queryKey: ['products', category],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await fetch(
        `/api/products?category=${category}&page=${pageParam}&limit=20`
      )
      return response.json()
    },
    getNextPageParam: (lastPage, allPages) =>
      lastPage.hasNextPage ? allPages.length : undefined,
    staleTime: 2 * 60 * 1000, // Cache 2 phút
  })
}

// Component usage
function ProductList({ category }) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useProductListing(category)

  // Flatten all pages
  const products = data?.pages.flatMap(page => page.products) ?? []

  return (
    <div>
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}

      {hasNextPage && (
        <button
          onClick={fetchNextPage}
          disabled={isFetchingNextPage}
        >
          {isFetchingNextPage ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  )
}
```


### Integration với Virtual Scrolling:


```javascript
import { useVirtualizer } from '@tanstack/react-virtual'

function VirtualizedInfiniteList() {
  const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
    // ... query config
  })

  const items = data?.pages.flatMap(page => page.items) ?? []

  const parentRef = useRef()

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100,
    overscan: 5,
  })

  // Auto fetch khi scroll gần cuối
  useEffect(() => {
    const lastItem = virtualizer.getVirtualItems().slice(-1)[0]

    if (
      lastItem &&
      lastItem.index >= items.length - 1 &&
      hasNextPage
    ) {
      fetchNextPage()
    }
  }, [virtualizer.getVirtualItems(), fetchNextPage, hasNextPage])

  return (
    <div ref={parentRef} style={{ height: '400px', overflow: 'auto' }}>
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map(virtualRow => (
          <div
            key={virtualRow.index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: virtualRow.size,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            <Item data={items[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  )
}
```


## 📚 KIẾN THỨC LIÊN QUAN


### Prerequisites:


- React Hooks (useState, useEffect)
- Promise/Async-Await patterns
- JavaScript Closures (để hiểu fix)
- HTTP Status Codes (rate limiting)


### Advanced Topics:


- **Optimistic Updates** với infinite queries
- **React Query DevTools** để debug infinite queries
- **Suspense Integration** với infinite queries
- **Server-side Rendering** considerations


### Related Concepts:


- **Pagination Strategies**: Cursor vs Offset pagination
- **Error Boundaries** cho graceful error handling
- **Web Vitals** impact của infinite scrolling
- **Accessibility** concerns với infinite lists


## 💼 INTERVIEW PERSPECTIVE


### Câu hỏi có thể gặp:


**Q1: "Explain sự khác biệt giữa useQuery và useInfiniteQuery"**


**Trả lời professional:**


```
useQuery fetch một lần và return data directly, trong khi useInfiniteQuery
fetch multiple pages và return { pages: [], pageParams: [] }.

Key differences:
1. Data structure: T vs { pages: T[] }
2. Fetch behavior: Single call vs Multiple calls
3. API: data vs data.pages.flatMap()
4. Use cases: Complete datasets vs Paginated data

Architecture-wise, cả hai đều dùng cùng Query class, chỉ khác QueryBehavior.
```


**Q2: "Làm thế nào để handle error trong infinite queries?"**


**Trả lời với code example:**


```javascript
const { data, error, isError, refetch } = useInfiniteQuery({
  queryKey: ['posts'],
  queryFn: ({ pageParam }) => fetchPosts(pageParam),
  retry: (failureCount, error) => {
    // Custom retry logic
    if (error.status === 429) return failureCount < 5
    return failureCount < 3
  },
  onError: (error) => {
    // Global error handling
    if (error.status === 401) {
      redirectToLogin()
    }
  }
})

// Component level error handling
if (isError) {
  return <ErrorBoundary error={error} onRetry={refetch} />
}
```


**Q3: "Performance implications của infinite queries?"**


**Điểm cộng khi demonstrate:**


```
1. Memory Management: Pages accumulate in memory
   - Solution: maxPages config, manual cleanup

2. Network Overhead: Multiple HTTP calls
   - Solution: Proper staleTime, batch requests

3. DOM Performance: Large lists affect rendering
   - Solution: Virtual scrolling, windowing

4. Bundle Size: React Query adds ~13kb gzipped
   - Solution: Code splitting, lazy loading
```


## 🎪 DEMO INTERACTIVE


Demo trên minh họa perfectly cách **Infinite Queries** hoạt động và tại sao bug này lại critical. Bạn có thể:


1. **Toggle Bug Mode** để thấy sự khác biệt giữa behavior cũ và mới
2. **Observe Retry Logic** khi page 3 fails (rate limiting simulation)
3. **Watch Memory Accumulation** khi pages được fetch successfully


### 🎓 Key Takeaways:


**Từ technical perspective:**


- Closure pattern là solution elegant cho stateful retry logic
- Architecture hierarchy quan trọng: Query → Retryer → FetchFunction
- Infinite Queries chỉ khác Single Queries ở QueryBehavior layer


**Từ practical perspective:**


- Always handle rate limiting gracefully trong infinite queries
- Consider memory implications khi fetch large datasets
- Monitor retry behavior trong production environments


**Từ interview perspective:**


- Đây là example tuyệt vời về architectural constraints và trade-offs
- Shows understanding của caching mechanisms và async patterns
- Demonstrates debugging skills và problem-solving approach


Bài viết này là một **masterclass** trong việc explain complex technical problems một cách clear và actionable. Nó không chỉ identify problem mà còn walk through entire thought process từ discovery đến solution implementation! 🚀
