# React Query: 5 Hidden Bugs

## You

#23: Why You Want React Query

## Claude


# 🎯 PHÂN TÍCH: "Tại Sao Bạn Muốn React Query"


## 📝 TÓM TẮT CHÍNH


Bài viết này chỉ ra **5 bugs ẩn giấu** trong việc sử dụng `fetch` + `useEffect` đơn giản để load data, và giải thích tại sao **React Query không phải là data fetching library** mà là **async state manager**. Đây là kiến thức cực kỳ quan trọng vì đa số developers đều gặp phải những bugs này mà không hề biết, dẫn đến user experience tệ và code khó maintain.


## 🔍 KHÁI NIỆM CỐT LÕI


### 🎪 React Query


- **Định nghĩa**: Async state management library, KHÔNG phải data fetching library
- **Mental model**: Giống như Redux cho async data - quản lý cache, loading states, error handling tự động
- **So sánh quen thuộc**: Nếu Redux là "global state cho sync data" thì React Query là "global state cho async data"


### 🏎️ Race Condition


- **Định nghĩa**: Khi multiple async requests được fire và response về không đúng thứ tự
- **Ví dụ thực tế**: User click "Books" → "Movies" nhanh, nhưng response "Books" về sau → data bị sai
- **Tại sao nguy hiểm**: UI hiển thị data không khớp với user selection


### 🔄 Async State Management


- **Khác với sync state**: Sync = `useState`, Async = loading + data + error + race conditions + caching
- **Complexity multiplication**: Mỗi thêm 1 requirement, code phức tạp tăng exponentially


## 💡 HIỂU BẢN CHẤT


### 🎯 Pain Points Được Solve:


1. **Race conditions** - Data không sync với UI selection
2. **Missing loading states** - No spinner cho poor UX
3. **Inconsistent error handling** - Error từ request cũ vẫn hiển thị
4. **No caching** - Mỗi lần re-render = new request
5. **Complex state management** - Phải manually track loading/error/data


### ⚙️ Cơ Chế Hoạt Động:


```javascript
// Mental model: React Query = Smart Cache + Auto State Management
const queryClient = {
  cache: new Map(), // Key-value store cho data
  subscribers: new Set(), // Components đang listen
  invalidation: new Set(), // Queries cần re-fetch
}
```


### 🤔 Tại Sao Không Dùng Alternatives:


- **Pure useEffect**: Too many edge cases (như bài viết chỉ ra)
- **Custom hooks**: Reinventing the wheel, missing advanced features
- **Context + useReducer**: Verbose, no built-in caching/deduplication


## 🛠️ CODE EXAMPLES THỰC TẾ


### ❌ Cách Cũ - Đầy Bugs:


### ✅ React Query Solution - Chỉ 10 Dòng Code:


```javascript
function Bookmarks({ category }) {
  const { isLoading, data, error } = useQuery({
    queryKey: ['bookmarks', category], // 🔑 Cache key cho từng category
    queryFn: () =>
      fetch(`${endpoint}/${category}`).then((res) => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      }),
  });

  // Return JSX - tất cả bugs đã được fix tự động! ✨
}
```


## 🔄 SO SÁNH & PHÂN BIỆT


### 📊 Comparison Table:


```
useEffect + fetchReact Query
```


### 🎯 Khi Nào Dùng Gì:


**👍 Dùng useEffect + fetch khi:**


- Prototype nhanh, one-time request
- Không quan tâm edge cases
- Team nhỏ, project đơn giản
- Không có caching requirements


**🚀 Dùng React Query khi:**


- Production application
- Multiple data sources
- Cần caching và performance
- Team scaling, code maintainability
- User experience quan trọng


## 🎯 BEST PRACTICES


### ⚡ React Query Setup:


```javascript
// 1. Query Client Configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 phút - data coi như fresh
      cacheTime: 10 * 60 * 1000, // 10 phút - keep trong cache
      retry: 3, // Retry 3 lần khi fail
      refetchOnWindowFocus: false, // Không refetch khi focus window
    },
  },
});

// 2. Query Key Best Practices
const queryKeys = {
  all: ['bookmarks'] as const,
  lists: () => [...queryKeys.all, 'list'] as const,
  list: (category: string) => [...queryKeys.lists(), category] as const,
  details: () => [...queryKeys.all, 'detail'] as const,
  detail: (id: string) => [...queryKeys.details(), id] as const,
};
```


### 🚨 Common Mistakes:


```javascript
// ❌ MISTAKE 1: Query key không stable
function BadComponent({ category }) {
  const { data } = useQuery({
    queryKey: ['bookmarks', { category }], // Object tạo mới mỗi render!
    queryFn: fetchBookmarks,
  });
}

// ✅ FIX: Dùng primitive values
function GoodComponent({ category }) {
  const { data } = useQuery({
    queryKey: ['bookmarks', category], // String stable across renders
    queryFn: () => fetchBookmarks(category),
  });
}

// ❌ MISTAKE 2: Không handle loading states trong UI
function BadUI() {
  const { data } = useQuery({ /* ... */ });
  return <div>{data.map(item => ...)}</div>; // Crash khi data undefined!
}

// ✅ FIX: Always handle loading states
function GoodUI() {
  const { data, isLoading, error } = useQuery({ /* ... */ });

  if (isLoading) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!data) return <EmptyState />;

  return <div>{data.map(item => ...)}</div>;
}
```


### 🔧 Performance Optimizations:


```javascript
// 🚀 Optimistic Updates cho better UX
const updateBookmarkMutation = useMutation({
  mutationFn: updateBookmark,
  onMutate: async (newBookmark) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['bookmarks'] });

    // Snapshot previous value
    const previousData = queryClient.getQueryData(['bookmarks']);

    // Optimistically update
    queryClient.setQueryData(['bookmarks'], old =>
      old.map(item => item.id === newBookmark.id ? newBookmark : item)
    );

    return { previousData };
  },
  onError: (err, newBookmark, context) => {
    // Rollback on error
    queryClient.setQueryData(['bookmarks'], context.previousData);
  },
  onSettled: () => {
    // Always refetch after error or success
    queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
  },
});
```


## 🚀 ỨNG DỤNG THỰC TẾ


### 🏢 Real-World Use Cases:


**1. E-commerce Product Listing:**


```javascript
// Infinite scroll products với cache
function ProductList({ category }) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['products', category],
    queryFn: ({ pageParam = 0 }) =>
      fetchProducts(category, pageParam),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 5 * 60 * 1000, // Cache 5 phút cho performance
  });
}
```


**2. Real-time Dashboard:**


```javascript
// Auto-refresh data every 30s
function Dashboard() {
  const { data: metrics } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: fetchMetrics,
    refetchInterval: 30 * 1000, // Refresh every 30s
    refetchIntervalInBackground: true, // Continue khi tab inactive
  });
}
```


**3. Search với Debouncing:**


```javascript
function SearchResults({ query }) {
  const debouncedQuery = useDebounce(query, 300);

  const { data, isLoading } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: () => searchAPI(debouncedQuery),
    enabled: !!debouncedQuery, // Chỉ search khi có query
    keepPreviousData: true, // Giữ old results while loading new
  });
}
```


### 🔗 Integration với Frameworks:


```javascript
// Next.js với Server-Side Rendering
export async function getServerSideProps() {
  const queryClient = new QueryClient();

  // Prefetch data on server
  await queryClient.prefetchQuery({
    queryKey: ['bookmarks'],
    queryFn: fetchBookmarks,
  });

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
    },
  };
}
```


## 📚 KIẾN THỨC LIÊN QUAN


### 🎯 Prerequisites:


- **React Hooks**: `useState`, `useEffect`, `useContext`
- **Promise/Async**: `.then()`, `async/await`, error handling
- **HTTP Concepts**: Status codes, request/response cycle
- **Caching Theory**: Cache invalidation, TTL, stale-while-revalidate


### 🚀 Advanced Topics Để Tìm Hiểu Tiếp:


```javascript
// 1. Custom Hooks với React Query
function useBookmarks(category) {
  return useQuery({
    queryKey: ['bookmarks', category],
    queryFn: () => api.getBookmarks(category),
    select: (data) => data.filter(item => item.isActive), // Transform data
    onSuccess: (data) => {
      // Side effects khi success
      analytics.track('bookmarks_loaded', { count: data.length });
    },
  });
}

// 2. Parallel Queries
function useParallelData(userId) {
  const userQuery = useQuery(['user', userId], () => fetchUser(userId));
  const postsQuery = useQuery(['posts', userId], () => fetchUserPosts(userId));

  return {
    user: userQuery.data,
    posts: postsQuery.data,
    isLoading: userQuery.isLoading || postsQuery.isLoading,
  };
}

// 3. Dependent Queries
function useUserPosts(userId) {
  const { data: user } = useQuery(['user', userId], () => fetchUser(userId));

  const postsQuery = useQuery(
    ['posts', user?.id],
    () => fetchUserPosts(user.id),
    {
      enabled: !!user?.id, // Chỉ chạy khi có user
    }
  );

  return postsQuery;
}
```


### 🔗 Related Technologies:


- **SWR**: Alternative to React Query
- **Apollo Client**: For GraphQL
- **RTK Query**: Redux-based solution
- **Zustand + React Query**: State management combo


## 💼 INTERVIEW PERSPECTIVE


### 🎤 Câu Hỏi Interview Thường Gặp:


**Q1: "Tại sao bạn chọn React Query thay vì useEffect + fetch?"**


**💡 Câu trả lời professional:**


```
"React Query solve được 5 vấn đề chính mà useEffect + fetch gặp phải:

1. Race conditions: Khi user action nhanh, response có thể về không đúng thứ tự
2. Loading states: React Query provide isLoading, error, data states built-in
3. Caching: Automatic caching và deduplication requests
4. Error handling: Auto-reset states khi params change
5. Background updates: Stale-while-revalidate pattern

Ngoài ra còn có optimistic updates, infinite queries, parallel queries -
những features này rất khó implement đúng với vanilla useEffect."
```


**Q2: "React Query có performance overhead không?"**


**💡 Câu trả lời:**


```
"Bundle size của React Query ~13KB gzipped, nhưng benefits rất lớn:

1. Deduplication: Prevent duplicate requests → giảm network load
2. Caching: Reduce server calls → faster user experience
3. Smart refetching: Only fetch khi cần → optimize bandwidth
4. Background updates: Keep data fresh without blocking UI

Trong thực tế, React Query thường IMPROVE performance thay vì làm chậm app."
```


**Q3: "Khi nào KHÔNG nên dùng React Query?"**


**💡 Câu trả lời:**


```
"Không nên dùng khi:

1. One-time requests: Như login, signup - không cần caching
2. File uploads: Progress tracking phức tạp hơn với React Query
3. WebSocket/SSE: Real-time data không phù hợp với caching model
4. Micro apps: Overhead không đáng so với benefits
5. Team không familiar: Learning curve có thể slow down development

Trong cases này, vanilla fetch hoặc axios đơn giản hơn."
```


### 🏆 Điểm Cộng Khi Demonstrate:


```javascript
// Show advanced usage trong interview
function InterviewDemo() {
  // 1. Show you understand query keys
  const queryKeys = {
    users: ['users'] as const,
    user: (id: string) => [...queryKeys.users, id] as const,
  };

  // 2. Show proper error boundaries
  const { data, error, retry } = useQuery({
    queryKey: queryKeys.user(userId),
    queryFn: () => fetchUser(userId),
    retry: (failureCount, error) => {
      // Custom retry logic
      if (error.status === 404) return false;
      return failureCount < 3;
    },
  });

  // 3. Show you handle edge cases
  if (error?.status === 404) {
    return <UserNotFound onCreateUser={handleCreate} />;
  }

  return (
    <div>
      {/* UI implementation */}
      {error && <button onClick={retry}>Retry</button>}
    </div>
  );
}
```


---


## 🎉 TÓM TẮT CUỐI CÙNG


**React Query transforms từ:**


```javascript
// 40+ dòng code đầy bugs ❌
const [loading, setLoading] = useState(true);
const [data, setData] = useState();
const [error, setError] = useState();
// ... 35+ dòng nữa với race conditions, cleanup, etc.
```


**Thành:**


```javascript
// 1 dòng code, solve tất cả problems ✅
const { isLoading, data, error } = useQuery(queryConfig);
```


**🎯 Key Takeaway:** React Query không phải là data fetching library - nó là **async state manager** giúp bạn avoid reinventing the wheel và focus vào business logic thay vì fight với edge cases!


Đây chính là sự khác biệt giữa junior dev (focus vào "làm sao để chạy được") và senior dev (focus vào "làm sao để robust, maintainable và scalable"). 🚀
