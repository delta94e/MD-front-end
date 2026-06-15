# React Query: The Bad Parts

## You

#28: React Query - The Bad Parts

## Claude


# 📊 Phân Tích: React Query - The Bad Parts


## 🎯 1. TÓM TẮT CHÍNH


Bài viết này thực chất là một bài talk của **Dominic (TkDodo)** - maintainer chính của React Query, trong đó anh chia sẻ về những **trade-offs và hạn chế** của React Query thay vì chỉ nói về ưu điểm. Mặc dù tiêu đề có từ "Bad Parts", nhưng nội dung chủ yếu **debunk các myths** và giải thích tại sao những "nhược điểm" được cho là của React Query thực ra không phải là vấn đề lớn như nhiều người nghĩ.


## 🔍 2. KHÁI NIỆM CỐT LÕI


### 🎯 React Query/TanStack Query


- **Định nghĩa**: Thư viện state management chuyên biệt cho **server state** (dữ liệu từ API)
- **Khác biệt**: Không phải thư viện fetch data như Axios, mà là **data synchronization tool**
- **So sánh**: Giống như Redux nhưng specialized cho async data


### 📦 Bundle Size


- **Thực tế**: ~10KB minzipped khi sử dụng core features
- **Myth**: Nhiều người nghĩ nó "nặng" vì nhìn thấy 700KB trên npm (bao gồm source maps, dev tools)
- **So sánh**: Nhỏ hơn nhiều custom solutions thường viết


### 🔄 Declarative vs Imperative Data Fetching


- **Declarative**: Mô tả "tôi muốn data gì" thay vì "làm thế nào để fetch"
- **Query Key**: Chứa tất cả dependencies, tự động refetch khi thay đổi
- **Mental Model**: State-driven thay vì event-driven


### 🗄️ Document Cache vs Normalized Cache


- **Document Cache**: Lưu toàn bộ response theo query key
- **Normalized Cache**: Lưu từng entity một lần, reference từ nhiều nơi
- **Trade-off**: Đơn giản hơn nhưng có thể duplicate data


## 💡 3. HIỂU BẢN CHẤT


### 🎯 Pain Points React Query Giải Quyết


```javascript
// ❌ Cách truyền thống - phải tự manage mọi thứ
const [data, setData] = useState(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

useEffect(() => {
  setLoading(true);
  fetch('/api/tasks')
    .then(res => res.json())
    .then(data => {
      setData(data);
      setLoading(false);
    })
    .catch(err => {
      setError(err);
      setLoading(false);
    });
}, []); // Rất dễ miss dependencies

// ✅ Với React Query - tự động handle mọi thứ
const { data, isLoading, error } = useQuery({
  queryKey: ['tasks'],
  queryFn: () => fetch('/api/tasks').then(res => res.json())
});
```


### 🧠 Mental Model


React Query thay đổi cách suy nghĩ từ:


- **"Khi user click button → fetch data"** (imperative)
- Thành **"Tôi muốn data tương ứng với state hiện tại"** (declarative)


## 🛠️ 4. CODE EXAMPLES THỰC TẾ


### 📝 Ví dụ về Declarative Filtering


```javascript
function TaskList() {
  // ✅ Lưu filter state để làm dependency
  const [appliedFilters, setAppliedFilters] = useState({
    status: 'all',
    priority: 'all'
  });

  // ✅ Query key thay đổi → tự động refetch
  const { data: tasks } = useQuery({
    queryKey: ['tasks', appliedFilters], // Key include filters
    queryFn: () => fetchTasks(appliedFilters),
  });

  // ✅ Cách đúng để trigger refetch
  const handleApplyFilters = (newFilters) => {
    setAppliedFilters(newFilters); // State change → auto refetch
  };

  return (
    <div>
      <FilterForm onApply={handleApplyFilters} />
      <TaskGrid tasks={tasks} />
    </div>
  );
}

// ❌ Cách SAI - nhiều người hay mắc lỗi này
function BadExample() {
  const { data, refetch } = useQuery({
    queryKey: ['tasks'], // Key cố định
    queryFn: () => fetchTasks()
  });

  const handleFilter = (filters) => {
    // ❌ SAI: refetch không nhận arguments
    // refetch(filters); // Không work!

    // ❌ SAI: Sẽ override cache và race conditions
    refetch(); // Chỉ fetch lại với query function cũ
  };
}
```


### 🗺️ Integration với Router (Advanced Pattern)


```javascript
// ✅ Best Practice: Sync với URL params
import { useSearch } from '@tanstack/react-router';

function TaskListWithRouter() {
  // Filters được sync với URL search params
  const { status, priority } = useSearch({
    from: '/tasks'
  });

  const { data: tasks } = useQuery({
    queryKey: ['tasks', { status, priority }],
    queryFn: () => fetchTasks({ status, priority }),
  });

  // 🎉 Lợi ích:
  // - Shareable URLs
  // - Browser back/forward
  // - Page refresh giữ state
  // - Automatic caching theo URL

  return <TaskGrid tasks={tasks} />;
}
```


### 🚫 Anti-pattern: Dùng React Query cho Client State


```javascript
// ❌ ĐỪNG làm thế này với client state
function BadSidebarToggle() {
  const { data: isSidebarOpen } = useQuery({
    queryKey: ['sidebar-state'], // Unique key cần thiết
    queryFn: () => Promise.resolve(false), // Fake async
    initialData: false,
    staleTime: Infinity, // Disable auto-refetch
    cacheTime: Infinity, // Disable garbage collection
    refetchOnMount: false, // Disable default behaviors
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const toggleSidebar = () => {
    queryClient.setQueryData(['sidebar-state'], !isSidebarOpen);
  };

  // Quá phức tạp và không hiệu quả!
}

// ✅ Cách ĐÚNG với Zustand
import { create } from 'zustand';

const useUIStore = create((set) => ({
  isSidebarOpen: false,
  toggleSidebar: () => set((state) => ({
    isSidebarOpen: !state.isSidebarOpen
  })),
}));

function GoodSidebarToggle() {
  const { isSidebarOpen, toggleSidebar } = useUIStore();

  return (
    <button onClick={toggleSidebar}>
      {isSidebarOpen ? 'Close' : 'Open'} Sidebar
    </button>
  );
}
```


## 🔄 5. SO SÁNH & PHÂN BIỆT


### 📊 React Query vs Alternatives


```
FeatureReact QuerySWRApollo ClientCustom SolutionBundle Size~10KB~7KB~30KB+VariesLearning CurveMediumLowHighDependsGraphQL SupportBasicBasicExcellentManualNormalized Cache❌❌✅ManualDevTools✅ Excellent✅ Basic✅ Good❌TypeScript✅ Excellent✅ Good✅ GoodDependsServer Integration✅ SSR/SSG✅ SSR/SSG✅ SSRManual
```


### 🎯 Khi nào dùng gì?


```javascript
// ✅ React Query tốt cho:
// - REST APIs
// - Complex caching needs
// - Multiple refetch triggers
// - Optimistic updates
// - Background sync

// ✅ SWR tốt cho:
// - Simple use cases
// - Smaller bundle priority
// - Quick prototyping

// ✅ Apollo Client tốt cho:
// - GraphQL-heavy apps
// - Need normalized cache
// - Complex entity relationships

// ✅ Native fetch tốt cho:
// - Server Components (Next.js 13+)
// - Simple one-time fetching
// - No caching needed
```


## 🎯 6. BEST PRACTICES


### ⚡ Performance Optimizations


```javascript
// ✅ Tree-shake chỉ import cần thiết
import { useQuery } from '@tanstack/react-query';
// Thay vì: import * as ReactQuery from '@tanstack/react-query';

// ✅ Structured query keys cho easy invalidation
const queryKeys = {
  tasks: {
    all: ['tasks'] as const,
    lists: () => [...queryKeys.tasks.all, 'list'] as const,
    list: (filters: TaskFilters) => [...queryKeys.tasks.lists(), filters] as const,
    details: () => [...queryKeys.tasks.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.tasks.details(), id] as const,
  }
};

// ✅ Sử dụng staleTime để reduce unnecessary requests
const { data } = useQuery({
  queryKey: queryKeys.tasks.list(filters),
  queryFn: () => fetchTasks(filters),
  staleTime: 5 * 60 * 1000, // 5 minutes - data considered fresh
});
```


### 🚨 Common Mistakes


```javascript
// ❌ Mistake 1: Dynamic query keys không stable
function BadComponent({ userId }) {
  const { data } = useQuery({
    queryKey: ['user', { id: userId, timestamp: Date.now() }], // ❌ Always new!
    queryFn: () => fetchUser(userId),
  });
}

// ✅ Fix: Stable keys
function GoodComponent({ userId }) {
  const { data } = useQuery({
    queryKey: ['user', userId], // ✅ Stable key
    queryFn: () => fetchUser(userId),
  });
}

// ❌ Mistake 2: Quên handle loading states properly
function BadLoadingHandling() {
  const { data } = useQuery({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
  });

  // ❌ data có thể undefined → crash
  return <div>{data.map(task => <Task key={task.id} {...task} />)}</div>;
}

// ✅ Fix: Proper loading handling
function GoodLoadingHandling() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
  });

  if (isLoading) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!data) return <EmptyState />;

  return <TaskList tasks={data} />;
}
```


## 🚀 7. ỨNG DỤNG THỰC TẾ


### 🛒 E-commerce Real-world Example


```javascript
// ✅ Product listing với infinite scroll
function ProductCatalog() {
  const [filters, setFilters] = useState({
    category: 'all',
    priceRange: [0, 1000],
    sortBy: 'popularity'
  });

  // Infinite query cho pagination
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['products', filters],
    queryFn: ({ pageParam = 0 }) =>
      fetchProducts({ ...filters, page: pageParam }),
    getNextPageParam: (lastPage, allPages) =>
      lastPage.hasMore ? allPages.length : undefined,
  });

  // Prefetch next category khi hover
  const queryClient = useQueryClient();
  const handleCategoryHover = (category) => {
    queryClient.prefetchQuery({
      queryKey: ['products', { ...filters, category }],
      queryFn: () => fetchProducts({ ...filters, category }),
    });
  };

  return (
    <div>
      <FilterSidebar
        filters={filters}
        onChange={setFilters}
        onCategoryHover={handleCategoryHover}
      />
      <InfiniteProductGrid
        data={data}
        onLoadMore={fetchNextPage}
        hasMore={hasNextPage}
        loading={isFetchingNextPage}
      />
    </div>
  );
}

// ✅ Optimistic updates cho cart
function useAddToCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, quantity }) =>
      addToCartAPI({ productId, quantity }),

    // Optimistic update - update UI trước khi API response
    onMutate: async ({ productId, quantity }) => {
      // Cancel ongoing queries
      await queryClient.cancelQueries({ queryKey: ['cart'] });

      // Get current cart
      const previousCart = queryClient.getQueryData(['cart']);

      // Optimistically update
      queryClient.setQueryData(['cart'], (old) => ({
        ...old,
        items: [...old.items, { productId, quantity }],
        total: old.total + (quantity * getProductPrice(productId))
      }));

      // Return context for rollback
      return { previousCart };
    },

    // Rollback on error
    onError: (err, variables, context) => {
      queryClient.setQueryData(['cart'], context.previousCart);
    },

    // Always refetch to ensure consistency
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}
```


### 📱 Next.js App Router Integration


```javascript
// ✅ Server Components + React Query hybrid
// app/products/page.tsx
export default async function ProductsPage() {
  // Fetch initial data on server
  const initialProducts = await fetchProducts({ page: 0 });

  return (
    <HydrationBoundary
      state={dehydrate(queryClient)}
    >
      <ProductCatalogClient initialData={initialProducts} />
    </HydrationBoundary>
  );
}

// components/ProductCatalogClient.tsx
'use client';
function ProductCatalogClient({ initialData }) {
  // Client-side React Query takes over
  const { data, refetch } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
    initialData, // Server data làm initial state
    staleTime: 60 * 1000, // Cache 1 minute
  });

  // Interactive features work normally
  return <InteractiveProductGrid data={data} onRefresh={refetch} />;
}
```


## 📚 8. KIẾN THỨC LIÊN QUAN


### 🎯 Prerequisites


- **React Hooks**: useState, useEffect, useMemo
- **Async JavaScript**: Promises, async/await
- **REST APIs**: HTTP methods, status codes
- **State Management**: Hiểu khái niệm client vs server state


### 🚀 Advanced Topics


- **Query Invalidation Strategies**
- **Offline Support** với background sync
- **Optimistic Updates** patterns
- **Server State Normalization** với libraries như Normie
- **SSR/SSG** integration patterns


### 🔗 Related Technologies


- **SWR**: Alternative với API tương tự
- **Apollo Client**: Cho GraphQL
- **Zustand/Jotai**: Cho client state
- **TanStack Router**: Routing với type-safe search params


## 💼 9. INTERVIEW PERSPECTIVE


### ❓ Câu hỏi thường gặp


**Q: "Tại sao không dùng useEffect + useState để fetch data?"**


```javascript
// ✅ Câu trả lời professional:
"Có thể dùng được nhưng phải tự implement nhiều thứ:
- Caching mechanism
- Request deduplication
- Background refetching
- Error handling & retries
- Loading states management
- Race condition prevention

React Query đã solve tất cả những vấn đề này out-of-the-box."
```


**Q: "React Query có những trade-offs gì?"**


```javascript
// ✅ Điểm cộng khi trả lời:
"Main trade-offs:
1. Bundle size: ~10KB nhưng save được code tự viết
2. Learning curve: Cần hiểu declarative mindset
3. Không có normalized caching như Apollo
4. Chỉ nên dùng cho server state, không phải client state
5. Có thể overkill cho simple use cases"
```


**Q: "Khi nào không nên dùng React Query?"**


```javascript
// ✅ Show understanding:
"Không nên dùng khi:
- App chỉ có vài API calls đơn giản
- Team chưa familiar với async state management
- Đã có solution khác working tốt (như Apollo cho GraphQL)
- Client state nhiều hơn server state
- Bundle size là constraint critical"
```


### 🎯 Demonstrate Knowledge


```javascript
// ✅ Code sample cho interview
function InterviewExample() {
  // Show understanding of key concepts
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ['users', { role: 'admin' }], // ✅ Proper key structure
    queryFn: () => fetchUsers({ role: 'admin' }),
    staleTime: 5 * 60 * 1000, // ✅ Understand staleTime
  });

  const updateUserMutation = useMutation({
    mutationFn: updateUser,
    onSuccess: () => {
      // ✅ Know when to invalidate vs setQueryData
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  // ✅ Handle edge cases
  if (isLoading) return <Skeleton />;
  if (!users?.length) return <EmptyState />;

  return (
    <UserList
      users={users}
      onUpdate={updateUserMutation.mutate}
    />
  );
}
```


## 🎪 10. DEMO INTERACTIVE


## ✨ Kết luận


Bài talk của **Dominic (TkDodo)** đã thành công **debunk nhiều myths** về React Query và cho thấy rằng những "vấn đề" được nhiều người nhắc đến thực ra không phải là deal-breakers. Thay vào đó, chúng là **trade-offs có thể chấp nhận được** khi xem xét những benefits mà React Query mang lại.


**Key takeaways:**


- **Bundle size** (~10KB) là reasonable cho value cung cấp
- **Learning curve** có thể approach incrementally
- **Declarative pattern** mạnh mẽ hơn imperative khi đã quen
- **Document cache** đơn giản và đủ cho most use cases
- **Đúng tool cho đúng job** - không dùng RQ cho client state


React Query vẫn là một excellent choice cho managing server state, và những "bad parts" thực ra chỉ là **limitations cần awareness** hơn là fundamental flaws. 🚀
