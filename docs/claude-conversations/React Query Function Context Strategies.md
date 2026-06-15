# React Query Function Context Strategies

## You

Leveraging the Query Function Context

## Claude


# 🚀 Phân Tích: Query Function Context trong React Query


## 📝 1. TÓM TẮT CHÍNH


Bài viết này là một **addendum quan trọng** cho việc sử dụng React Query hiệu quả hơn. Tác giả đề xuất **ngừng sử dụng inline functions** trong queryFn và thay vào đó **leverage Query Function Context** kết hợp với **object-based query keys** để đạt được type safety tốt hơn và tránh các lỗi phổ biến khi query keys không đồng bộ với dependencies thực tế.


Đây là vấn đề quan trọng vì trong các ứng dụng lớn với nhiều filter/sorting parameters, việc query keys bị out-of-sync với dependencies có thể gây ra những bug khó debug và ảnh hưởng đến cache invalidation.


## 🔍 2. KHÁI NIỆM CỐT LÕI


### Query Function Context


- **Định nghĩa**: Một object được React Query tự động inject vào queryFn, chứa thông tin về query hiện tại
- **Tương tự như**: Context trong React, nhưng specific cho từng query function
- **Chứa gì**: `queryKey`, `pageParam` (cho infinite queries), và các metadata khác


### Query Key Factory


- **Định nghĩa**: Một pattern để tạo ra query keys một cách consistent và type-safe
- **Tương tự như**: Factory pattern trong OOP, nhưng áp dụng cho query keys
- **Mục đích**: Centralize việc tạo keys và đảm bảo consistency


### Object Query Keys


- **Định nghĩa**: Sử dụng objects thay vì arrays làm elements trong query key
- **Ưu điểm**: Named destructuring, không bị ảnh hưởng bởi order, fuzzy matching mạnh hơn
- **Khác biệt**: Thay vì `['todos', state, sorting]` → `[{ scope: 'todos', state, sorting }]`


## 💡 3. HIỂU BẢN CHẤT


### Pain Points được giải quyết:


🔥 **Query Key Drift**: Khi queryKey không match với actual dependencies


```typescript
// ❌ Bug phổ biến - quên update queryKey
const { state, sorting, filter } = useParams()
return useQuery({
  queryKey: ['todos', state],           // Thiếu sorting, filter
  queryFn: () => fetchTodos(state, sorting, filter)  // Actual dependencies
})
```


🔥 **Type Safety**: Không có compile-time check cho parameter consistency


🔥 **Scalability**: Với 10+ parameters, việc maintain trở nên nightmare


### Cơ chế hoạt động:


React Query tự động inject QueryFunctionContext vào mọi queryFn. Thay vì closure over variables, ta extract parameters directly từ queryKey trong context.


### Tại sao chọn approach này:


1. **Forced consistency**: Không thể sử dụng param mà không có trong queryKey
2. **Type safety**: Full TypeScript inference support
3. **Debugging**: Dễ dàng inspect queryKey để biết exact parameters
4. **Performance**: Không tạo new function mỗi render


## 🛠️ 4. CODE EXAMPLES THỰC TẾ


### Approach cũ (Inline Functions):


```typescript
// ❌ Cách cũ - dễ gây bugs
export const useTodos = () => {
  const { state, sorting, filter, page } = useTodoParams()

  return useQuery({
    queryKey: ['todos', state, sorting], // Quên filter và page!
    queryFn: () => fetchTodos(state, sorting, filter, page), // Out of sync
  })
}
```


### Approach mới (Query Function Context):


```typescript
// ✅ Cách mới - type-safe và consistent
const fetchTodos = async ({ queryKey }: QueryFunctionContext) => {
  // Destructure trực tiếp từ queryKey
  const [, state, sorting, filter, page] = queryKey

  // Build URL từ parameters được đảm bảo sync
  const response = await axios.get(`todos/${state}`, {
    params: { sorting, filter, page }
  })
  return response.data
}

export const useTodos = () => {
  const { state, sorting, filter, page } = useTodoParams()

  // Forced consistency - không thể quên parameter nào
  return useQuery({
    queryKey: ['todos', state, sorting, filter, page],
    queryFn: fetchTodos, // Không closure, dùng context
  })
}
```


### Object Keys với Factory Pattern:


```typescript
// 🏭 Query Key Factory
const todoKeys = {
  // Base scope
  all: [{ scope: 'todos' }] as const,

  // List scope với filters
  lists: () => [{ ...todoKeys.all[0], entity: 'list' }] as const,

  // Specific list với full parameters
  list: (params: TodoListParams) => [{
    ...todoKeys.lists()[0],
    ...params // state, sorting, filter, page
  }] as const,
}

// 🎯 Type-safe fetch function
const fetchTodos = async ({
  // Destructure named properties - không lo order!
  queryKey: [{ state, sorting, filter, page }],
}: QueryFunctionContext<ReturnType<typeof todoKeys['list']>>) => {

  // Build API call từ named parameters
  const response = await axios.get(`todos/${state}`, {
    params: { sorting, filter, page }
  })
  return response.data
}

// 🚀 Usage trong component
export const useTodos = () => {
  const params = useTodoParams() // { state, sorting, filter, page }

  return useQuery({
    queryKey: todoKeys.list(params), // Factory tạo key
    queryFn: fetchTodos,            // Context-based function
  })
}
```


## 🔄 5. SO SÁNH & PHÂN BIỆT


```
AspectInline FunctionsQuery Function ContextObject Keys + ContextType Safety❌ Không có✅ Partial🚀 FullConsistency❌ Manual sync✅ Forced sync🚀 Enforced + NamedMaintainability❌ Khó maintain✅ Tốt hơn🚀 ExcellentComplexity✅ Đơn giản⚠️ Medium⚠️ HighPerformance❌ New function/render✅ Stable reference✅ Stable referenceDebugging❌ Khó debug✅ Dễ inspect🚀 Self-documenting
```


### Khi nào dùng approach nào:


**🎯 Inline Functions:**


- Prototype nhanh, app nhỏ
- Team mới với React Query
- Ít parameters (≤ 3)


**🎯 Query Function Context:**


- Production apps, team experienced
- Nhiều parameters (4-8)
- Cần type safety


**🎯 Object Keys + Context:**


- Large-scale applications
- Complex query hierarchies
- Team yêu cầu maximum type safety
- Cần advanced invalidation patterns


## 🎯 6. BEST PRACTICES


### 🚨 Important Notes:


1. **Always use as const** cho query key factories


```typescript
// ✅ Correct
const keys = {
  todos: ['todos'] as const,
  //              ^^^^^^^^^ Bắt buộc!
}

// ❌ Wrong - mất type information
const keys = {
  todos: ['todos'], // TypeScript infer thành string[]
}
```


1. **Consistent object structure** trong factory


```typescript
// ✅ Consistent nesting
const keys = {
  all: [{ scope: 'todos' }] as const,
  lists: () => [{ ...keys.all[0], entity: 'list' }] as const,
  //              ^^^^^^^^^^^^^^^ Spread base object
}
```


1. **Handle undefined parameters** carefully


```typescript
const fetchTodos = async ({ queryKey: [{ state, filter }] }) => {
  const params = {
    ...(filter && { filter }), // Only add if truthy
  }
  // ...
}
```


### 🚫 Common Mistakes:


1. **Forgetting as const** → Mất type safety
2. **Mixing array và object approaches** → Inconsistent codebase
3. **Deep object nesting** → Performance issues với equality checks
4. **Không handle optional parameters** → Runtime errors


### ⚡ Performance Considerations:


- Object keys có slight overhead so với arrays
- Sử dụng shallow objects (depth ≤ 2)
- Cache factory functions khi possible
- Avoid computing expensive values trong key factory


## 🚀 7. ỨNG DỤNG THỰC TẾ


### E-commerce Platform:


```typescript
const productKeys = {
  all: [{ scope: 'products' }] as const,

  // Danh sách sản phẩm với filters
  lists: () => [{ ...productKeys.all[0], entity: 'list' }] as const,
  list: (filters: ProductFilters) => [{
    ...productKeys.lists()[0],
    category: filters.category,
    priceRange: filters.priceRange,
    brand: filters.brand,
    sortBy: filters.sortBy,
    page: filters.page,
  }] as const,

  // Chi tiết sản phẩm
  details: () => [{ ...productKeys.all[0], entity: 'detail' }] as const,
  detail: (id: string, variant?: string) => [{
    ...productKeys.details()[0],
    id,
    ...(variant && { variant })
  }] as const,
}

// Usage trong shopping component
const useProducts = (filters: ProductFilters) => {
  return useQuery({
    queryKey: productKeys.list(filters),
    queryFn: fetchProducts,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  })
}
```


### Dashboard Analytics:


```typescript
const analyticsKeys = {
  all: [{ scope: 'analytics' }] as const,

  metrics: (dateRange: DateRange, metrics: string[]) => [{
    ...analyticsKeys.all[0],
    entity: 'metrics',
    startDate: dateRange.start,
    endDate: dateRange.end,
    metrics: metrics.sort(), // Consistent order
  }] as const,
}

// Powerful invalidation capabilities
const refreshDashboard = () => {
  // Invalidate tất cả analytics data
  queryClient.invalidateQueries({
    queryKey: [{ scope: 'analytics' }]
  })

  // Hoặc chỉ specific metrics
  queryClient.invalidateQueries({
    queryKey: [{ scope: 'analytics', entity: 'metrics' }]
  })
}
```


### Framework Integration:


**Next.js App Router:**


```typescript
// app/products/page.tsx
export default async function ProductsPage({ searchParams }) {
  // Server-side rendering với consistent keys
  const queryKey = productKeys.list(searchParams)

  const products = await fetchProducts({ queryKey })

  return (
    <HydrationBoundary state={{ queryKey, data: products }}>
      <ProductList />
    </HydrationBoundary>
  )
}
```


**React Native:**


```typescript
// Optimistic updates với predictable keys
const useUpdateProduct = () => {
  return useMutation({
    mutationFn: updateProduct,
    onMutate: async (updatedProduct) => {
      // Cancel in-flight queries
      await queryClient.cancelQueries({
        queryKey: productKeys.detail(updatedProduct.id)
      })

      // Optimistically update
      queryClient.setQueryData(
        productKeys.detail(updatedProduct.id),
        updatedProduct
      )
    },
  })
}
```


## 📚 8. KIẾN THỨC LIÊN QUAN


### Prerequisites cần biết:


- **React Query basics**: useQuery, useMutation, query invalidation
- **TypeScript generics**: Hiểu `ReturnType<T>`, const assertions
- **JavaScript destructuring**: Array và object destructuring
- **Closure concepts**: Để hiểu tại sao inline functions có vấn đề


### Advanced topics để tìm hiểu tiếp:


- **React Query Key Management**: Advanced invalidation strategies
- **Type-safe API layers**: Tích hợp với tRPC, GraphQL codegen
- **Query optimization**: Parallel queries, dependent queries
- **SSR/SSG integration**: Hydration patterns với query keys


### Related technologies:


- **Zustand/Redux**: State management tích hợp với React Query
- **React Hook Form**: Form state sync với server state
- **Next.js/Remix**: SSR patterns với React Query
- **MSW (Mock Service Worker)**: Testing với consistent query keys


## 💼 9. INTERVIEW PERSPECTIVE


### Câu hỏi có thể gặp:


**Q: "Tại sao không nên sử dụng inline functions trong React Query?"**


**A:** "Inline functions có 3 vấn đề chính:


1. **Query key drift** - queryKey có thể out-of-sync với actual dependencies
2. **Performance** - tạo new function mỗi render
3. **Type safety** - không có compile-time check cho parameter consistency


Thay vào đó, tôi prefer Query Function Context vì nó force consistency và provide better type safety."


**Q: "Explain object query keys vs array query keys"**


**A:** "Object keys có several advantages:


- **Named destructuring** - không cần lo về order
- **Better fuzzy matching** - có thể invalidate theo specific properties
- **Self-documenting** - dễ hiểu query đang fetch gì
- **Scalable** - khi có nhiều parameters, object structure rõ ràng hơn array"


**Q: "How do you handle query key factories in a large team?"**


**A:** "Tôi establish một số conventions:


- **Centralized factories** trong shared utils
- **Consistent naming** - scope → entity → specifics
- **Type exports** để other developers có thể reference
- **Documentation** với examples cho each factory method
- **Linting rules** để enforce sử dụng factories thay vì hardcode keys"


### Điểm cộng khi demonstrate:


✅ **Hiểu performance implications** của different approaches

✅ **Có experience** với large-scale React Query implementations

✅ **Type safety awareness** - biết khi nào cần và không cần strict typing

✅ **Team collaboration skills** - design patterns for scalable codebases

✅ **Debugging expertise** - có thể explain cách debug query issues


## 🎪 10. DEMO INTERACTIVE


Tôi đã tạo một **comprehensive analysis** của bài viết về Query Function Context trong React Query. Đây là một pattern advanced mà rất nhiều teams lớn đang chuyển đổi sang để giải quyết các vấn đề về **query key drift** và **type safety**.


## 🎯 Key Takeaways cho Thực Tế:


### Immediate Actions:


1. **Audit current React Query usage** - check xem có bao nhiêu inline functions đang dùng
2. **Start với Query Function Context** cho new features thay vì jump straight to object keys
3. **Implement ESLint rule** để catch query key drift early


### Team Implementation Strategy:


1. **Phase 1**: Convert critical queries sang Context approach
2. **Phase 2**: Introduce query key factories cho frequently used patterns
3. **Phase 3**: Migrate to object keys cho complex query hierarchies


### Production Considerations:


- **Bundle size impact**: Object keys có slight overhead nhưng negligible trong real apps
- **Performance**: Context approach actually faster vì stable function references
- **Developer Experience**: Significantly better debugging và type safety


## 🚀 Next Steps để Master này:


1. **Practice**: Thử implement 3 approaches trong demo app
2. **Read React Query source**: Hiểu cách QueryFunctionContext được inject
3. **Explore advanced patterns**: Dependent queries, parallel queries với object keys
4. **Study large codebases**: Xem cách companies như Airbnb, Netflix structure query keys


Approach này đặc biệt powerful khi combined với **tRPC** hoặc **GraphQL codegen** để có end-to-end type safety từ API đến UI!


Bạn có muốn tôi deep dive vào bất kỳ aspect nào specific không? Ví dụ như migration strategy cho existing codebase hoặc integration patterns với specific frameworks?
