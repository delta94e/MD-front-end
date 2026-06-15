# React Query: Placeholder and Initial Data

## You

Placeholder and Initial Data in React Query

## Claude


# 🚀 Placeholder Data vs Initial Data trong React Query


## 📝 1. TÓM TẮT CHÍNH


Bài viết giải quyết vấn đề **loại bỏ loading spinners khó chịu** trong React applications bằng cách sử dụng React Query. Thay vì để users nhìn thấy loading states, chúng ta có thể **pre-fill cache** với data có sẵn thông qua hai approaches: **Placeholder Data** và **Initial Data**. Vấn đề này cực kỳ quan trọng vì UX tốt là yếu tố quyết định success của product, và users ghét phải chờ đợi loading states không cần thiết.


---


## 🔍 2. KHÁI NIỆM CỐT LÕI


### 🏗️ Cache Level vs Observer Level


**Cache Level** (Mức độ Cache):


- Mỗi Query Key chỉ có **một cache entry duy nhất**
- Data được share "globally" across toàn bộ application
- Options như `queryFn`, `gcTime` hoạt động ở level này


**Observer Level** (Mức độ Observer):


- **Observer = subscription** cho một cache entry
- Mỗi lần gọi `useQuery` = tạo một observer mới
- Multiple observers có thể watch cùng một cache entry
- Options như `select`, `refetchInterval` hoạt động ở level này


### 🎭 Placeholder Data


```typescript
// "Fake-it-till-you-make-it" data
// Không bao giờ được persist vào cache
// Hoạt động ở Observer Level
```


### 💾 Initial Data


```typescript
// "Good" data được coi như fetched từ backend
// Được persist vào cache
// Hoạt động ở Cache Level
```


---


## 💡 3. HIỂU BẢN CHẤT


### 🎯 Pain Points được giải quyết:


- **Loading Spinner Fatigue**: Users ghét chờ đợi
- **Jarring UX transitions**: Từ empty state → loaded state
- **Perceived Performance**: App cảm giác "chậm" dù API nhanh
- **Stale Content Flash**: Data cũ bị thay thế đột ngột


### ⚙️ Cơ chế hoạt động:


React Query cache system hoạt động như một **smart memory layer**:


```
User Request → Check Cache → Return Data (nếu có) → Background Refetch
                    ↓
              Pre-filled với Placeholder/Initial Data
```


### 🤔 Tại sao không dùng alternatives?


- **State Management (Redux/Zustand)**: Phức tạp, boilerplate nhiều
- **Component State**: Không share được data
- **Local Storage**: Sync issues, không reactive


---


## 🛠️ 4. CODE EXAMPLES THỰC TẾ


### 🎪 Placeholder Data Example


### 💾 Initial Data với Cache Pre-fill


```typescript
// 🎯 Use case: Pre-fill user detail từ user list cache
const useUserDetail = (userId: string) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUserDetail(userId),
    // 🔄 Lấy data từ cache của user list
    initialData: () => {
      const usersListData = queryClient.getQueryData(['users', 'list']);
      return usersListData?.find(user => user.id === userId);
    },
    // ⏰ Quan trọng: Cung cấp timestamp để React Query biết data "cũ" thế nào
    initialDataUpdatedAt: () => {
      return queryClient.getQueryState(['users', 'list'])?.dataUpdatedAt;
    },
    staleTime: 5 * 60 * 1000, // 5 phút
  });
};
```


---


## 🔄 5. SO SÁNH & PHÂN BIỆT


### 📊 Comparison Table


```
Aspect🎭 Placeholder Data💾 Initial DataHoạt động levelObserver LevelCache LevelPersist vào cache❌ Không✅ CóBackground refetch✅ Luôn luôn⚖️ Tùy vào staleTimeMultiple observers✅ Có thể khác nhau❌ Chỉ một dataisPlaceholderData flag✅ Có❌ KhôngRespect staleTime❌ Không✅ CóUse case chínhUI loading statesCache pre-filling
```


### 🎯 Khi nào dùng gì?


**🎭 Placeholder Data:**


- Skeleton loading screens
- Default values cho forms
- Static fallback content
- "Optimistic UI" updates


**💾 Initial Data:**


- Pre-fill từ cache khác
- Data từ SSR/SSG
- Cached data từ localStorage
- Migration data giữa các screens


### ⚡ Performance Implications


```typescript
// 🐌 WRONG: Expensive computation trong render
const { data } = useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers,
  placeholderData: expensiveComputation(), // ❌ Chạy mỗi render!
});

// ✅ RIGHT: Use function để lazy evaluation
const { data } = useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers,
  placeholderData: () => expensiveComputation(), // ✅ Chỉ chạy khi cần
});
```


---


## 🎯 6. BEST PRACTICES


### 🔒 Type Safety với TypeScript


```typescript
interface User {
  id: string;
  name: string;
  email: string;
}

// 🎭 Placeholder Data với proper typing
const usePlaceholderUser = (userId: string) => {
  return useQuery<User>({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
    placeholderData: (): User => ({
      id: userId,
      name: 'Loading...',
      email: 'loading@example.com'
    })
  });
};

// 💾 Initial Data với type assertion cẩn thận
const useInitialUser = (userId: string) => {
  const queryClient = useQueryClient();

  return useQuery<User>({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
    initialData: () => {
      const cachedUser = queryClient.getQueryData<User[]>(['users'])
        ?.find(u => u.id === userId);

      // 🚨 Validate data trước khi return
      if (cachedUser && isValidUser(cachedUser)) {
        return cachedUser;
      }
      return undefined; // Fallback to loading state
    }
  });
};

const isValidUser = (user: any): user is User => {
  return user &&
         typeof user.id === 'string' &&
         typeof user.name === 'string' &&
         typeof user.email === 'string';
};
```


### 🛡️ Error Handling Best Practices


```typescript
// 🎭 Placeholder Data: Graceful degradation khi refetch fails
const useUserWithPlaceholder = (userId: string) => {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
    placeholderData: {
      id: userId,
      name: 'User',
      email: 'user@example.com'
    },
    // 🔄 Retry strategy cho placeholder queries
    retry: (failureCount, error) => {
      // Với placeholder data, user vẫn thấy content
      // Nên có thể retry aggressive hơn
      return failureCount < 5;
    }
  });
};
```


### ⚠️ Common Mistakes


```typescript
// ❌ MISTAKE 1: Placeholder data quá realistic
placeholderData: {
  name: "John Smith", // User có thể confused đây là data thật
  email: "john@email.com"
}

// ✅ CORRECT: Rõ ràng đây là placeholder
placeholderData: {
  name: "Loading...",
  email: "Loading..."
}

// ❌ MISTAKE 2: Initial data không consistent với API
initialData: {
  id: 1,
  fullName: "John" // API trả về "name", không phải "fullName"
}

// ✅ CORRECT: Match exact API schema
initialData: {
  id: 1,
  name: "John"
}
```


---


## 🚀 7. ỨNG DỤNG THỰC TẾ


### 🛒 E-commerce Use Cases


```typescript
// 📱 Product List → Product Detail navigation
const useProductDetail = (productId: string) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['product', productId],
    queryFn: () => fetchProductDetail(productId),
    // 🎯 Pre-fill từ product list cache để instant navigation
    initialData: () => {
      const productsCache = queryClient.getQueryData(['products']);
      return productsCache?.items?.find(p => p.id === productId);
    },
    // ⏰ Respect cache freshness
    initialDataUpdatedAt: () => {
      return queryClient.getQueryState(['products'])?.dataUpdatedAt;
    }
  });
};

// 🛒 Cart với optimistic updates
const useCart = () => {
  return useQuery({
    queryKey: ['cart'],
    queryFn: fetchCart,
    // 🎭 Placeholder cho loading state
    placeholderData: {
      items: [],
      total: 0,
      itemCount: 0
    }
  });
};
```


### 📊 Dashboard với Real-time Data


```typescript
// 📈 Analytics dashboard
const useAnalytics = (dateRange: DateRange) => {
  return useQuery({
    queryKey: ['analytics', dateRange],
    queryFn: () => fetchAnalytics(dateRange),
    // 🎭 Skeleton data để maintain layout
    placeholderData: {
      views: 0,
      clicks: 0,
      revenue: 0,
      chart: Array(30).fill({ date: '', value: 0 })
    },
    refetchInterval: 30000, // 30s refresh
    staleTime: 25000 // Fresh for 25s
  });
};
```


### 🎨 Next.js với SSR Integration


```typescript
// pages/user/[id].tsx
export async function getServerSideProps({ params }) {
  const queryClient = new QueryClient();

  // 🏭 Pre-fetch data on server
  await queryClient.prefetchQuery({
    queryKey: ['user', params.id],
    queryFn: () => fetchUser(params.id)
  });

  return {
    props: {
      dehydratedState: dehydrate(queryClient)
    }
  };
}

function UserPage({ userId }) {
  const { data } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
    // 💾 Data đã có sẵn từ SSR, không cần placeholder
    staleTime: 5 * 60 * 1000
  });

  // Component sẽ render với data ngay lập tức!
  return <UserProfile user={data} />;
}
```


---


## 📚 8. KIẾN THỨC LIÊN QUAN


### 🔗 Prerequisites


```typescript
// 📚 Kiến thức cần biết trước:
1. React Hooks (useState, useEffect)
2. Async/await và Promises
3. React Query basics (useQuery, QueryClient)
4. TypeScript generics (optional nhưng recommended)
5. HTTP/REST API concepts
```


### 🎓 Advanced Topics để học tiếp


```typescript
// 🚀 Advanced React Query concepts:

// 1. 🔄 Optimistic Updates
const useTodoMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateTodo,
    onMutate: async (newTodo) => {
      // Cancel refetches
      await queryClient.cancelQueries(['todos']);

      // 🎯 Optimistically update cache
      const previousTodos = queryClient.getQueryData(['todos']);
      queryClient.setQueryData(['todos'], old =>
        old.map(todo => todo.id === newTodo.id ? newTodo : todo)
      );

      return { previousTodos };
    },
    onError: (err, newTodo, context) => {
      // 🔄 Rollback on error
      queryClient.setQueryData(['todos'], context.previousTodos);
    }
  });
};

// 2. 🎪 Infinite Queries với Initial Data
const useInfinitePosts = () => {
  return useInfiniteQuery({
    queryKey: ['posts'],
    queryFn: ({ pageParam = 0 }) => fetchPosts(pageParam),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    // 🎭 Placeholder cho first page
    placeholderData: {
      pages: [{ posts: [], nextCursor: null }],
      pageParams: [0]
    }
  });
};

// 3. 🔮 Prefetching Strategies
const usePrefetchStrategy = () => {
  const queryClient = useQueryClient();

  const prefetchUserOnHover = (userId: string) => {
    queryClient.prefetchQuery({
      queryKey: ['user', userId],
      queryFn: () => fetchUser(userId),
      staleTime: 10 * 1000 // Cache for 10s
    });
  };

  return { prefetchUserOnHover };
};
```


### 🔧 Related Technologies


```typescript
// 🛠️ Ecosystem tools:
1. React Query DevTools - Debug cache state
2. MSW (Mock Service Worker) - Testing với mock data
3. Zod/Yup - Runtime validation cho cache data
4. React Hook Form - Integration với form state
5. React Router - Navigation với cache strategies
```


---


## 💼 9. INTERVIEW PERSPECTIVE


### 🎯 Câu hỏi Interview thường gặp


**Q1: "Explain the difference between Placeholder Data and Initial Data trong React Query"**


💬 **Answer template:**


```
"Có 2 điểm khác biệt chính:

1. **Level hoạt động**:
   - Placeholder Data hoạt động ở Observer Level (mỗi component)
   - Initial Data hoạt động ở Cache Level (shared globally)

2. **Persistence**:
   - Placeholder Data không persist vào cache, chỉ để show UI
   - Initial Data được persist và respect staleTime

3. **Use cases**:
   - Placeholder: Loading states, skeleton screens
   - Initial: Pre-fill từ cache khác, SSR data

Ví dụ trong e-commerce: Placeholder để show skeleton của product, Initial để pre-fill product detail từ product list cache."
```


**Q2: "When would you use one over the other?"**


💬 **Professional answer:**


```
"Tôi choose based on data source và user experience goals:

**Placeholder Data khi**:
- Data hoàn toàn mới, chưa có trong cache
- Muốn show loading states mà vẫn maintain layout
- Cần visual indicator rằng data đang loading

**Initial Data khi**:
- Có data related trong cache khác (list → detail navigation)
- SSR/SSG scenarios với pre-fetched data
- Muốn avoid unnecessary background refetches

Ví dụ: Trong dashboard, tôi dùng Placeholder cho metric cards (skeleton loading), nhưng Initial Data cho user profile (lấy từ auth cache)."
```


**Q3: "What are the performance implications?"**


💬 **Senior-level answer:**


```
"Performance impacts khác nhau:

**Placeholder Data**:
- ❌ Always triggers background refetch
- ✅ Faster perceived performance (instant UI)
- ⚠️ Watch out for expensive computations in render

**Initial Data**:
- ✅ Có thể skip refetch nếu data fresh (respect staleTime)
- ✅ Reduce network requests
- ⚠️ Stale data risk nếu không setup proper invalidation

**Best practice**: Use function form để avoid computation on every render:
```typescript
// ❌ Computed every render
placeholderData: generateSkeletonData()

// ✅ Computed only when needed
placeholderData: () => generateSkeletonData()
```


### 🏆 Điểm cộng khi demonstrate


```typescript
// 🎯 Show advanced understanding:

// 1. Type safety awareness
interface User {
  id: string;
  name: string;
}

const useTypedQuery = () => {
  return useQuery<User>({ // Generic typing
    queryKey: ['user'],
    queryFn: fetchUser,
    placeholderData: (): User => ({ // Properly typed placeholder
      id: '',
      name: 'Loading...'
    })
  });
};

// 2. Error boundary integration
const useResilientQuery = () => {
  return useQuery({
    queryKey: ['data'],
    queryFn: fetchData,
    placeholderData: fallbackData,
    useErrorBoundary: (error) => {
      // Only bubble up 5xx errors, handle 4xx gracefully
      return error.status >= 500;
    }
  });
};

// 3. Testing considerations
// Mock để test loading states
const createMockQuery = (options = {}) => ({
  data: null,
  isLoading: true,
  isPlaceholderData: true,
  ...options
});
```


### 🎪 Live Coding Tips


```typescript
// 💡 Trong interview coding round:

// 1. Start với simple case
const { data } = useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers,
  placeholderData: [] // Simple skeleton
});

// 2. Gradually add complexity
const { data, isPlaceholderData } = useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers,
  placeholderData: () => Array(5).fill({
    id: '',
    name: 'Loading...'
  })
});

// 3. Show practical considerations
return (
  <div>
    {data?.map(user => (
      <div key={user.id} className={isPlaceholderData ? 'skeleton' : ''}>
        {user.name}
      </div>
    ))}
  </div>
);
```


---


## 🎉 Kết luận


Placeholder Data và Initial Data là hai công cụ mạnh mẽ để optimize user experience trong React applications. Key takeaways:


✅ **Placeholder Data**: Perfect cho loading states và skeleton screens

✅ **Initial Data**: Ideal cho cache pre-filling và SSR scenarios

✅ **Performance**: Hiểu rõ trade-offs để choose đúng approach

✅ **Type Safety**: Always use TypeScript để avoid runtime errors

✅ **Testing**: Mock properly để test cả loading và success states


Với demo interactive ở trên, bạn có thể experiment và thấy được behavior differences một cách trực quan. Practice với real use cases trong dự án để master these concepts! 🚀
