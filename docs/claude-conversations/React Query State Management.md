# React Query State Management

## You

Thinking in React Query

## Claude


# 🚀 Thinking in React Query: Phân Tích Chuyên Sâu


## 📝 1. TÓM TẮT CHÍNH


**React Query** không phải là thư viện fetch data như nhiều người nghĩ, mà là một **async state manager** chuyên biệt. Bài talk này phá vỡ 3 misconceptions lớn nhất về React Query và chỉ ra cách tiếp cận đúng để tận dụng tối đa sức mạnh của nó. Đây là kiến thức cốt lõi mà mọi developer sử dụng React Query cần nắm vững để tránh những anti-patterns phổ biến.


---


## 🔍 2. KHÁI NIỆM CỐT LÕI


### 🎯 Async State vs Client State


- **Client State**: Dữ liệu ta hoàn toàn kiểm soát (toggle button, form input)
- **Async State (Server State)**: Dữ liệu từ server, có thể outdated, ta chỉ "mượn" snapshot


### 🔄 Stale vs Fresh Data


- **Fresh**: Dữ liệu mới, không cần refetch
- **Stale**: Dữ liệu cũ, cần update khi có trigger events


### ⚡ Fine-grained Subscriptions


- Components chỉ re-render khi data mà chúng quan tâm thay đổi
- Được control thông qua query keys và selectors


---


## 💡 3. HIỂU BẢN CHẤT


### 🎯 Pain Points được giải quyết:


**Trước React Query:**


```javascript
// ❌ Anti-pattern: Mixing client state với server state
const [users, setUsers] = useState([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

useEffect(() => {
  setLoading(true);
  fetchUsers()
    .then(setUsers)
    .catch(setError)
    .finally(() => setLoading(false));
}, []);

// Vấn đề: Data không auto-sync, phải manual handle loading/error states
```


**Với React Query:**


```javascript
// ✅ Correct: Tách biệt concerns
const { data: users, isLoading, error } = useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers,
  staleTime: 5 * 60 * 1000, // 5 phút
});

// React Query tự động handle: caching, background refetch, error retry
```


### 🔧 Cơ chế hoạt động:


1. **Query Key** = Unique identifier cho cache entry
2. **Query Function** = Promise-returning function
3. **Cache Management** = Automatic với configurable behaviors
4. **Background Updates** = Dựa trên stale time và trigger events


---


## 🛠️ 4. CODE EXAMPLES THỰC TẾ


### Example 1: Basic Usage


### Example 2: Stale Time Configuration


### Example 3: Dependencies as Query Keys


---


## 🔄 5. SO SÁNH & PHÂN BIỆT


### 🥊 React Query vs Alternatives


```
AspectReact QueryRedux + RTK QuerySWRApollo ClientLearning Curve🟢 Medium🔴 High🟢 Easy🟡 Medium-HighBundle Size🟢 ~13kb🟡 ~25kb🟢 ~4kb🔴 ~33kbCaching✅ Advanced✅ Advanced🟡 Basic✅ NormalizedDevTools✅ Excellent✅ Good🟡 Basic✅ GreatTypeScript✅ First-class✅ Excellent🟡 Good✅ GoodUse CaseUniversalComplex stateSimple fetchingGraphQL apps
```


### 🎯 When to Choose React Query:


**✅ Perfect for:**


- REST APIs với complex caching needs
- Applications cần background sync
- Teams muốn focus vào business logic
- Projects cần predictable data flow


**❌ Avoid when:**


- Simple CRUD operations only
- GraphQL với normalized cache requirements
- Very tight bundle size constraints
- Team prefer explicit control over every detail


---


## 🎯 6. BEST PRACTICES


### 🔑 Configuration Best Practices:


```javascript
// ✅ DO: Global defaults với sensible values
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000, // 2 phút cho most cases
      retry: 3, // Retry 3 lần
      refetchOnWindowFocus: true, // Keep data fresh
      refetchOnMount: true,
    },
    mutations: {
      retry: 1, // Ít retry hơn cho mutations
    },
  },
});

// ✅ DO: Override per query khi cần
const { data } = useQuery({
  queryKey: ['config'],
  queryFn: fetchConfig,
  staleTime: Infinity, // Config ít khi thay đổi
});
```


### 🚫 Common Anti-Patterns:


```javascript
// ❌ DON'T: State syncing anti-pattern
const [users, setUsers] = useState([]);
const { data } = useQuery(['users'], fetchUsers, {
  onSuccess: (data) => setUsers(data), // 🚨 Unnecessary state duplication
});

// ❌ DON'T: Missing dependencies
const useIssues = (filters) => {
  return useQuery({
    queryKey: ['issues'], // 🚨 Missing filters dependency
    queryFn: () => fetchIssues(filters), // 🚨 Stale closure problem
  });
};

// ❌ DON'T: Disabling everything
const { data } = useQuery(['data'], fetchData, {
  refetchOnMount: false,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false, // 🚨 Data sẽ never update
});
```


### ⚡ Performance Best Practices:


```javascript
// ✅ DO: Use selectors để avoid unnecessary re-renders
const useUserCount = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
    select: (data) => data.length, // Only re-render khi count thay đổi
  });
};

// ✅ DO: Proper error boundaries
function App() {
  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      <QueryClientProvider client={queryClient}>
        <Router />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
```


---


## 🚀 7. ỨNG DỤNG THỰC TẾ


### 📱 E-commerce Application:


```javascript
// 🛒 Product listing với pagination và filters
const useProducts = (page, filters) => {
  return useQuery({
    queryKey: ['products', page, filters],
    queryFn: () => fetchProducts({ page, ...filters }),
    keepPreviousData: true, // Smooth pagination experience
    staleTime: 5 * 60 * 1000, // Products ít khi thay đổi
  });
};

// 💰 Real-time cart updates
const useCart = () => {
  return useQuery({
    queryKey: ['cart'],
    queryFn: fetchCart,
    staleTime: 0, // Always fresh for cart
    refetchInterval: 30 * 1000, // Polling mỗi 30s
  });
};
```


### 📊 Dashboard Application:


```javascript
// 📈 Analytics data với different refresh rates
const useAnalytics = (dateRange) => {
  return useQuery({
    queryKey: ['analytics', dateRange],
    queryFn: () => fetchAnalytics(dateRange),
    staleTime: dateRange === 'live' ? 30 * 1000 : 5 * 60 * 1000,
    refetchInterval: dateRange === 'live' ? 60 * 1000 : false,
  });
};

// 🔔 Notifications với optimistic updates
const useNotifications = () => {
  const queryClient = useQueryClient();

  const markAsRead = useMutation({
    mutationFn: markNotificationAsRead,
    onMutate: async (notificationId) => {
      // Optimistic update
      const previousNotifications = queryClient.getQueryData(['notifications']);
      queryClient.setQueryData(['notifications'], (old) =>
        old.map(notif =>
          notif.id === notificationId
            ? { ...notif, read: true }
            : notif
        )
      );
      return { previousNotifications };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      queryClient.setQueryData(['notifications'], context.previousNotifications);
    },
  });

  return { markAsRead };
};
```


### 🏢 Enterprise Integration:


```javascript
// 🔐 Authentication integration
const useAuthenticatedQuery = (queryKey, queryFn, options = {}) => {
  const { token } = useAuth();

  return useQuery({
    ...options,
    queryKey: [...queryKey, token], // Include token in cache key
    queryFn: () => queryFn(token),
    enabled: !!token, // Only run khi có token
    retry: (failureCount, error) => {
      if (error.status === 401) return false; // Don't retry auth errors
      return failureCount < 3;
    },
  });
};

// 🌐 Multi-tenant support
const useTenantQuery = (queryKey, queryFn, options = {}) => {
  const { tenantId } = useTenant();

  return useQuery({
    ...options,
    queryKey: [tenantId, ...queryKey], // Tenant-specific caching
    queryFn: () => queryFn(tenantId),
  });
};
```


---


## 📚 8. KIẾN THỨC LIÊN QUAN


### 🎯 Prerequisites:


- **React Fundamentals**: Hooks, useEffect, useState
- **Promise/Async Programming**: async/await, Promise handling
- **HTTP/REST APIs**: Request methods, status codes, headers
- **JavaScript ES6+**: Destructuring, spread operator, template literals


### 🚀 Advanced Topics để tìm hiểu tiếp:


```javascript
// 🔄 Infinite Queries cho pagination
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
  queryKey: ['posts'],
  queryFn: ({ pageParam = 0 }) => fetchPosts(pageParam),
  getNextPageParam: (lastPage, pages) => lastPage.nextCursor,
});

// 🎯 Parallel và Dependent Queries
const useUserWithPosts = (userId) => {
  const userQuery = useQuery(['user', userId], () => fetchUser(userId));

  const postsQuery = useQuery({
    queryKey: ['posts', userId],
    queryFn: () => fetchUserPosts(userId),
    enabled: !!userQuery.data, // Dependent query
  });

  return { userQuery, postsQuery };
};

// 🔄 Mutations với optimistic updates
const useUpdatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePost,
    onMutate: async (newPost) => {
      await queryClient.cancelQueries(['posts']);
      const previousPosts = queryClient.getQueryData(['posts']);

      queryClient.setQueryData(['posts'], (old) =>
        old.map(post => post.id === newPost.id ? newPost : post)
      );

      return { previousPosts };
    },
    onError: (err, newPost, context) => {
      queryClient.setQueryData(['posts'], context.previousPosts);
    },
    onSettled: () => {
      queryClient.invalidateQueries(['posts']);
    },
  });
};
```


### 🌐 Related Technologies:


- **State Management**: Zustand, Redux Toolkit, Jotai
- **Form Libraries**: React Hook Form, Formik
- **Validation**: Zod, Yup, Joi
- **Testing**: React Testing Library, MSW (Mock Service Worker)
- **DevTools**: React Query DevTools, Redux DevTools


---


## 💼 9. INTERVIEW PERSPECTIVE


### ❓ Câu hỏi interview có thể gặp:


**Q1: "React Query là gì và tại sao dùng nó thay vì useEffect + useState?"**


**🎯 Trả lời professional:**


```
"React Query là async state manager chuyên biệt cho server state, không phải data fetching library.

Key benefits:
- Automatic caching và background refetch
- Optimistic updates và error retry
- Deduplication requests
- Fine-grained subscriptions

So với useEffect + useState:
- Ít boilerplate code hơn
- Built-in loading/error states
- Automatic data synchronization
- Better UX với cache-first approach"
```


**Q2: "Explain stale time vs cache time trong React Query"**


**🎯 Trả lời technical:**


```
"Stale time determines khi nào data được considered 'old' và cần refetch:
- staleTime: 0 = always refetch on triggers
- staleTime: 5 * 60 * 1000 = fresh trong 5 phút

Cache time determines khi nào data bị remove khỏi cache:
- cacheTime: 5 * 60 * 1000 = giữ trong cache 5 phút after last observer

Best practice: staleTime < cacheTime để avoid unnecessary fetches"
```


**Q3: "Handle race conditions trong React Query như thế nào?"**


**🎯 Trả lời advanced:**


```
"React Query tự động handle race conditions through:

1. Query key deduplication - same key = same request
2. Request cancellation - abort previous requests
3. Automatic cache invalidation
4. Optimistic updates với rollback capability

Example:
- User rapidly changes filters
- Previous requests được cancelled
- Only latest request response được sử dụng
- Cache được updated correctly"
```


### 💡 Điểm cộng khi demonstrate:


```javascript
// 🎯 Show understanding của advanced patterns
const useOptimisticMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateData,
    onMutate: async (newData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries(['data']);

      // Snapshot previous value
      const previousData = queryClient.getQueryData(['data']);

      // Optimistically update
      queryClient.setQueryData(['data'], newData);

      return { previousData };
    },
    onError: (err, newData, context) => {
      // Rollback on error
      queryClient.setQueryData(['data'], context.previousData);
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries(['data']);
    },
  });
};

// 📝 Mention testing strategy
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

test('should fetch user data', async () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  const { result } = renderHook(() => useUser(1), { wrapper });

  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.data).toEqual(mockUser);
});
```


---


## 🎪 10. DEMO INTERACTIVE


---


## 🎯 TẢI XUỐNG & THAM KHẢO


### 📚 Resources để học sâu hơn:


- **Official Docs**: [TanStack Query Documentation](https://tanstack.com/query/latest)
- **Course từ creator**: "React Query Essentials" - Tanner Linsley
- **Blog series**: TK-Dodo's React Query blog (highly recommended)
- **Community**: Discord server và GitHub discussions


### 🛠️ Tools để practice:


- **DevTools**: React Query DevTools (built-in)
- **Testing**: MSW + React Testing Library
- **Linting**: ESLint plugin (@tanstack/eslint-plugin-query)
- **TypeScript**: First-class TypeScript support


---


## 🏆 FINAL THOUGHTS


Transcript này từ Dominik (TK-Dodo) đã thay đổi hoàn toàn cách mình nhìn về React Query. Từ việc hiểu sai nó là "data fetching library" đến việc thực sự "thinking in React Query" như một async state manager.


### 🎯 Key Mental Shifts:


1. **Stop treating server state like client state** → Separate concerns properly
2. **Embrace stale data** → Better UX với cache-first approach
3. **Dependencies in query keys** → Automatic invalidation & fresh data
4. **Trust the defaults** → React Query được design for good UX out-of-the-box


### 💡 Actionable Next Steps:


1. **Audit current codebase**: Tìm những chỗ đang mix server state với client state
2. **Implement gradually**: Start với những API calls đơn giản
3. **Configure stale time thoughtfully**: Based on data freshness requirements
4. **Add ESLint plugin**: Catch dependency issues early
5. **Use DevTools**: Monitor cache behavior trong development


React Query không chỉ là một library - nó là một paradigm shift trong cách chúng ta manage async state. Một khi đã "get it", code base sẽ trở nên cleaner, UX tốt hơn, và maintainability cao hơn rất nhiều! 🚀


---


*Đây là analysis từ perspective của Senior Frontend Engineer với 8+ years experience. Nếu có questions hoặc muốn dive deeper vào specific topics, feel free to ask! 💬*
