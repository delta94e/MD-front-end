# React Query with TypeScript

## You

React Query and TypeScript

## Claude


# 🔍 Phân Tích: React Query và TypeScript - Best Practices & Patterns


## 📝 1. TÓM TẮT CHÍNH


Bài viết này giải quyết những thách thức phức tạp khi sử dụng React Query với TypeScript, đặc biệt là về việc xử lý **Generics** và **Type Inference**. Tác giả chia sẻ các pattern thực tế để tận dụng tối đa sức mạnh của TypeScript thay vì chống lại nó, giúp developer viết code type-safe và maintainable hơn.


Vấn đề này cực kỳ quan trọng vì React Query là một trong những library phổ biến nhất cho data fetching, và việc setup TypeScript không đúng cách có thể dẫn đến type errors khó debug và loss of type safety.


## 🔍 2. KHÁI NIỆM CỐT LÕI


### 🎯 Generics trong React Query


```typescript
// React Query sử dụng 4 generic types
useQuery<TQueryFnData, TError, TData, TQueryKey>
```


- **TQueryFnData**: Kiểu dữ liệu trả về từ API function
- **TError**: Kiểu error có thể xảy ra
- **TData**: Kiểu dữ liệu cuối cùng (sau khi transform qua `select`)
- **TQueryKey**: Kiểu của query key


### 🧠 Type Inference vs Explicit Typing


**Type Inference** - Để TypeScript tự suy luận:


```typescript
// TypeScript tự hiểu `data` là Group[] | undefined
const groupsQuery = useQuery({
  queryKey: ['groups'],
  queryFn: fetchGroups // fetchGroups(): Promise<Group[]>
})
```


**Explicit Typing** - Khai báo trực tiếp:


```typescript
// Phải khai báo tất cả generics hoặc không khai báo gì
const groupsQuery = useQuery<Group[], Error>({
  queryKey: ['groups'],
  queryFn: fetchGroups
})
```


### 🔄 Partial Type Argument Inference Problem


TypeScript hiện tại **KHÔNG hỗ trợ** partial generic inference, nghĩa là:


```typescript
// ❌ Không thể làm thế này
useQuery<Group[]>({ ... }) // Chỉ khai báo 1 generic

// ✅ Phải làm thế này
useQuery<Group[], Error, number, QueryKey>({ ... }) // Tất cả hoặc không có gì
```


## 💡 3. HIỂU BẢN CHẤT


### 🎯 Pain Points mà bài viết giải quyết:


1. **Type Safety Loss**: Khi không setup đúng, có thể mất type safety
2. **Complex Generic Signatures**: 4 generics khó nhớ và dễ nhầm lẫn
3. **Verbose Code**: Phải khai báo nhiều types không cần thiết
4. **Error Type Handling**: `unknown` vs `Error` type confusion


### ⚙️ Cơ chế hoạt động underlying:


React Query được thiết kế **agnostic** - không biết bạn fetch data gì, kiểu gì. Vì vậy:


```typescript
// Library không thể biết Group[] là gì
const data = await api.fetchSomething() // ??? - could be anything
```


TypeScript cần thông tin để provide autocomplete và type checking, nhưng React Query không thể "đoán" được structure của API response.


### 🚀 Tại sao Type Inference approach tốt hơn:


1. **Maintainable**: Ít code boilerplate
2. **Scalable**: Tự động adapt khi API thay đổi
3. **Natural**: Giống JavaScript workflow
4. **Future-proof**: Hoạt động với React Query updates


## 🛠️ 4. CODE EXAMPLES THỰC TẾ


### 📌 Pattern 1: Type Inference (Recommended)


```typescript
// ✅ CÁCH TỐT NHẤT - Để TypeScript tự suy luận
interface User {
  id: number;
  name: string;
  email: string;
}

// 1. Định nghĩa API function với return type rõ ràng
async function fetchUsers(): Promise<User[]> {
  const response = await fetch('/api/users');
  return response.json();
}

// 2. Sử dụng trong useQuery - KHÔNG cần generics
function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers // TypeScript tự hiểu return type
  });
}

// 3. Sử dụng với select transform
function useUserCount() {
  return useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
    select: (users) => users.length // TypeScript biết users là User[]
    // data sẽ có type: number | undefined
  });
}
```


### 📌 Pattern 2: Error Handling với Type Narrowing


```typescript
function UsersList() {
  const usersQuery = useUsers();

  // ❌ CÁCH SAI - error có type unknown
  if (usersQuery.error) {
    return <div>{usersQuery.error.message}</div>; // TypeScript error!
  }

  // ✅ CÁCH ĐÚNG - Type narrowing với instanceof
  if (usersQuery.error instanceof Error) {
    return <div>Lỗi: {usersQuery.error.message}</div>; // ✅ Safe!
  }

  // ✅ Hoặc sử dụng type assertion (nếu chắc chắn)
  if (usersQuery.error) {
    const error = usersQuery.error as Error;
    return <div>Lỗi: {error.message}</div>;
  }

  if (usersQuery.isLoading) return <div>Đang tải...</div>;

  return (
    <ul>
      {usersQuery.data?.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```


### 📌 Pattern 3: Dependent Queries với skipToken


```typescript
// ✅ MODERN APPROACH - Sử dụng skipToken (v5.25+)
import { useQuery, skipToken } from '@tanstack/react-query';

async function fetchUserProfile(userId: number): Promise<UserProfile> {
  const response = await fetch(`/api/users/${userId}/profile`);
  return response.json();
}

function useUserProfile(userId: number | undefined) {
  return useQuery({
    queryKey: ['user-profile', userId],
    // skipToken tự động disable query và provide type safety
    queryFn: userId ? () => fetchUserProfile(userId) : skipToken
  });
}

// ✅ LEGACY APPROACH - Manual Promise rejection
function fetchUserProfileLegacy(userId: number | undefined): Promise<UserProfile> {
  if (typeof userId === 'undefined') {
    return Promise.reject(new Error('User ID is required'));
  }

  return fetch(`/api/users/${userId}/profile`).then(res => res.json());
}

function useUserProfileLegacy(userId: number | undefined) {
  return useQuery({
    queryKey: ['user-profile', userId],
    queryFn: () => fetchUserProfileLegacy(userId),
    enabled: Boolean(userId) // Enable chỉ khi có userId
  });
}
```


### 📌 Pattern 4: Infinite Queries với Proper Typing


```typescript
interface PostsResponse {
  posts: Post[];
  nextCursor?: number;
  hasMore: boolean;
}

// ✅ V5 approach với initialPageParam
function useInfinitePosts() {
  return useInfiniteQuery({
    queryKey: ['posts'],
    queryFn: ({ pageParam }: { pageParam: number }) => {
      // pageParam được type correctly như number
      return fetchPosts({ cursor: pageParam, limit: 10 });
    },
    initialPageParam: 0, // Required trong v5
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.nextCursor : undefined;
    }
  });
}
```


## 🔄 5. SO SÁNH & PHÂN BIỆT


```
ApproachƯu điểmNhược điểmKhi nào dùngType Inference• Ít boilerplate<br>• Tự động update<br>• Readable• Cần API functions có type<br>• Error type = unknown• Recommended mặc định<br>• Team có type disciplineExplicit Generics• Control hoàn toàn<br>• Rõ ràng intent• Verbose<br>• Dễ outdated<br>• Partial inference issue• Legacy codebase<br>• Complex error handlingDestructuring vs ObjectObject: Type narrowing<br>Destructuring: CleanerObject: Verbose<br>Destructuring: Mất type narrowingObject: Khi cần type narrowing<br>Destructuring: Simple cases
```


### 🎯 Real-world Decision Matrix:


```typescript
// 🟢 Simple case - Dùng inference + destructuring
const { data, isLoading, error } = useUsers();

// 🟡 Complex case - Dùng object + type narrowing
const usersQuery = useUsers();
if (usersQuery.isSuccess) {
  // usersQuery.data guaranteed là User[] (not undefined)
  console.log(usersQuery.data.length);
}

// 🔴 Legacy/special case - Explicit generics
const usersQuery = useQuery<User[], ApiError, UserStats>({
  queryKey: ['users'],
  queryFn: fetchUsers,
  select: transformToStats
});
```


## 🎯 6. BEST PRACTICES


### ✅ DO's:


1. **Tận dụng Type Inference:**


```typescript
// ✅ Định nghĩa return type cho API functions
async function fetchData(): Promise<DataType> {
  // implementation
}
```


1. **Sử dụng skipToken cho dependent queries:**


```typescript
// ✅ Modern approach
queryFn: id ? () => fetchUser(id) : skipToken
```


1. **Type narrowing thay vì type assertion:**


```typescript
// ✅ Safe type narrowing
if (error instanceof Error) {
  console.log(error.message);
}
```


1. **Không destructure khi cần type narrowing:**


```typescript
// ✅ Keep object cho type narrowing
const query = useQuery({ ... });
if (query.isSuccess) {
  // query.data có correct type
}
```


### ❌ DON'Ts:


1. **Tránh explicit generics khi không cần:**


```typescript
// ❌ Unnecessary verbose
useQuery<User[], Error>({ ... })

// ✅ Let inference work
useQuery({ ... })
```


1. **Đừng inline API calls không có types:**


```typescript
// ❌ data sẽ là any
queryFn: () => fetch('/api').then(r => r.json())

// ✅ Tách riêng với proper typing
queryFn: fetchUsers // fetchUsers(): Promise<User[]>
```


### ⚠️ Common Mistakes:


```typescript
// ❌ MISTAKE 1: Partial generics
useQuery<User[]>({
  // TypeScript sẽ lấy default cho các generics khác
  select: users => users.length // Error!
});

// ❌ MISTAKE 2: Inline functions without types
useQuery({
  queryFn: () => api.get('/users') // Return type = any
});

// ❌ MISTAKE 3: Destructuring khi cần type narrowing
const { data, isSuccess } = useQuery({ ... });
if (isSuccess) {
  // data vẫn có thể undefined!
}
```


## 🚀 7. ỨNG DỤNG THỰC TẾ


### 📱 E-commerce Application:


```typescript
// Product catalog với search và filtering
interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
}

interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
}

// API function với proper typing
async function fetchProducts(filters: ProductFilters): Promise<Product[]> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined) params.append(key, String(value));
  });

  const response = await fetch(`/api/products?${params}`);
  if (!response.ok) throw new Error('Failed to fetch products');
  return response.json();
}

// Hook với type inference
function useProducts(filters: ProductFilters) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () => fetchProducts(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Component sử dụng
function ProductList({ filters }: { filters: ProductFilters }) {
  const productsQuery = useProducts(filters);

  if (productsQuery.isLoading) return <ProductSkeleton />;

  if (productsQuery.error instanceof Error) {
    return <ErrorMessage message={productsQuery.error.message} />;
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      {productsQuery.data?.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```


### 📊 Dashboard với Real-time Data:


```typescript
// Dashboard metrics với auto-refresh
interface DashboardMetrics {
  totalUsers: number;
  activeUsers: number;
  revenue: number;
  conversionRate: number;
}

function useDashboardMetrics() {
  return useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: fetchDashboardMetrics,
    refetchInterval: 30 * 1000, // 30 seconds
    select: (data) => ({
      ...data,
      // Transform và format data
      formattedRevenue: new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(data.revenue)
    })
  });
}
```


## 📚 8. KIẾN THỨC LIÊN QUAN


### 🔰 Prerequisites cần biết:


1. **TypeScript Fundamentals:**

Generics và Generic Constraints
Type Inference và Type Narrowing
Union Types và Discriminated Unions
Utility Types (Partial, Pick, Omit)
2. **React Query Basics:**

useQuery, useMutation lifecycle
Query keys và caching strategy
Stale time vs Cache time
Background refetching


### 🚀 Advanced Topics để tìm hiểu tiếp:


1. **Advanced React Query:**

Optimistic Updates với TypeScript
Custom hooks patterns
Error boundaries integration
SSR/SSG considerations
2. **TypeScript Advanced:**

Template Literal Types
Conditional Types
Mapped Types
Module Augmentation


### 🔗 Related Technologies:


- **Zod/Yup**: Runtime type validation cho API responses
- **tRPC**: End-to-end type safety
- **GraphQL Code Generator**: Auto-generate types từ schema
- **MSW**: Mock Service Worker cho testing


## 💼 9. INTERVIEW PERSPECTIVE


### 🎯 Câu hỏi phổ biến:


**Q: "Tại sao không nên sử dụng explicit generics trong React Query?"**


**A:** "Có một số lý do chính:


1. **Partial Type Argument Inference** - TypeScript không hỗ trợ partial generics, nên phải khai báo tất cả 4 generics hoặc không khai báo gì
2. **Maintenance overhead** - Khi API thay đổi, phải update types ở nhiều nơi
3. **Type Inference hiệu quả hơn** - TypeScript có thể tự suy luận từ queryFn return type
4. **Code readability** - Ít boilerplate, dễ đọc hơn"


**Q: "Làm thế nào để handle error types trong React Query với TypeScript?"**


**A:** "Có 3 approaches chính:


1. **Type narrowing với instanceof** - Safe và recommended
2. **Type assertion** - Khi chắc chắn error structure
3. **Module augmentation** - Set global error type cho toàn bộ app
Tôi thường dùng instanceof vì nó safe ở runtime và compile time."


**Q: "Explain the difference between type narrowing with object vs destructuring?"**


**A:** "Khi destructure, TypeScript mất track của relationship giữa các properties. Ví dụ:


```typescript
const { data, isSuccess } = useQuery(...);
if (isSuccess) {
  // data vẫn có thể undefined!
}

const query = useQuery(...);
if (query.isSuccess) {
  // query.data guaranteed không undefined
}
```


Vì TypeScript chỉ track type refinement trên individual symbols, không track relationships."


### 🏆 Điểm cộng khi demonstrate:


1. **Hiểu được trade-offs** giữa các approaches
2. **Practical experience** với real-world patterns
3. **Performance awareness** - biết khi nào type checking impact performance
4. **Future-thinking** - hiểu được TypeScript roadmap và React Query evolution


## 🎪 10. DEMO INTERACTIVE


Tôi đã phân tích toàn diện bài viết về **React Query và TypeScript** theo đúng cấu trúc bạn yêu cầu! 🎯


## 🔥 Highlights chính:


1. **Insight quan trọng nhất**: **Type Inference** approach hiệu quả hơn nhiều so với explicit generics trong React Query - đây là game changer mà nhiều developers chưa realize
2. **Pain point thực tế**: Partial Type Argument Inference limitation của TypeScript tạo ra những gotchas khó debug
3. **Practical wisdom**: Object access vs destructuring impact đến type narrowing - một detail nhỏ nhưng crucial cho production code


## 🎪 Interactive Demo


Artifact tôi tạo cho phép bạn:


- **Experiment** với 4 patterns chính của React Query + TypeScript
- **So sánh** type inference vs explicit typing real-time
- **Test** dependent queries và error handling patterns
- **Observe** type narrowing behavior trực tiếp


## 💡 Key Takeaways cho Senior Level:


✅ **Architecture decision**: Type inference scales better trong large codebases

✅ **Performance insight**: Ít generic declarations = faster TypeScript compilation

✅ **Maintainability**: Code tự-documenting through proper typing patterns

✅ **Team efficiency**: Onboarding developers dễ hơn với inference approach


Bạn có muốn tôi deep dive vào **specific aspect** nào không? Ví dụ:


- Advanced error handling strategies với module augmentation
- Performance implications trong large-scale applications
- Migration patterns từ explicit generics sang type inference
- Testing strategies cho TypeScript + React Query code


Hoặc có **use case cụ thể** nào trong dự án bạn muốn discuss? 🚀
