# React Query and Context Architecture

## You

React Query and React Context

## Claude


# 🎯 PHÂN TÍCH: React Query và React Context - Giải quyết vấn đề Implicit Dependencies


## 📝 TÓM TẮT CHÍNH


Bài viết này giải quyết một **trade-off cốt lõi** trong React Query: giữa việc tạo components tự chủ (self-contained) có khả năng handle loading/error states vs việc tạo components "biết chắc" rằng data đã được fetch ở component cha. Tác giả đề xuất sử dụng **React Context như một dependency injection tool** để biến các implicit dependencies thành explicit, giúp code safer và maintainable hơn.


## 🔍 KHÁI NIỆM CỐT LÕI


### 🏗️ Self-contained Components


```javascript
// Component tự chủ - có thể đặt ở bất kỳ đâu trong app
function ProductTable() {
  const productQuery = useProductQuery()

  // Phải handle tất cả states
  if (productQuery.data) return <table>...</table>
  if (productQuery.isError) return <ErrorMessage />
  return <SkeletonLoader />
}
```


**Định nghĩa**: Component có thể hoạt động độc lập, tự fetch data và handle các states.


### 🔗 Implicit Dependencies


```javascript
// Component này "giả định" user data đã có sẵn
function UserNameDisplay() {
  const { data } = useCurrentUserQuery()
  return <div>User: {data.userName}</div> // ❌ TypeScript error!
}
```


**Định nghĩa**: Dependency chỉ tồn tại trong đầu developer, không visible trong code.


### 🎯 Dependency Injection với Context


```javascript
// Biến implicit thành explicit
const CurrentUserContext = React.createContext<User | null>(null)

export const useCurrentUserContext = () => {
  const currentUser = React.useContext(CurrentUserContext)
  if (!currentUser) {
    throw new Error('CurrentUserContext: No value provided')
  }
  return currentUser
}
```


## 💡 HIỂU BẢN CHẤT


### 🎯 Pain Point được giải quyết


**Vấn đề**: Khi làm việc với React Query, chúng ta thường gặp tình huống:


- Component A fetch user data ở top level
- Component B (deep nested) cần hiển thị user name
- Component B "biết chắc" data đã có, nhưng TypeScript không biết
- Phải chọn giữa: ignore TS, thêm unnecessary checks, hoặc duplicate loading logic


**Solution**: Context làm cho dependency trở nên **explicit và type-safe**.


### ⚙️ Cơ chế hoạt động underlying


1. **Provider Level**: Handle loading/error states một lần
2. **Consumer Level**: Assume data luôn available, type-safe
3. **Invariant Check**: Fail fast nếu dùng sai context


```typescript
// Cơ chế fail-fast với invariant
export const useCurrentUserContext = () => {
  const currentUser = React.useContext(CurrentUserContext)
  if (!currentUser) {
    throw new Error('CurrentUserContext: No value provided') // 🚨 Fail fast
  }
  return currentUser // ✅ TypeScript biết đây là User, không phải User | null
}
```


## 🛠️ CODE EXAMPLES THỰC TẾ


### 📋 Complete Implementation Example


## 🔄 SO SÁNH & PHÂN BIỆT


### 📊 Comparison Table: Approaches to Handle Data Dependencies


```
ApproachƯu điểm ✅Nhược điểm ❌Khi nào dùng?Self-contained Components- Resilient to change<br>- Có thể move anywhere<br>- Explicit loading states- Duplicate loading logic<br>- Potential over-fetching<br>- Complex component treeKhi component có thể render independentImplicit Dependencies- Simple code<br>- No duplicate logic<br>- Fast development- Type unsafe<br>- Brittle to refactoring<br>- Hidden dependenciesPrototype hoặc small appsContext Pattern- Type safe<br>- Explicit dependencies<br>- Centralized loading- Potential waterfalls<br>- More setup code<br>- Context re-render issuesData mandatory cho sub-treeSuspense- Elegant API<br>- Automatic type narrowing<br>- React future direction- Limited browser support<br>- Waterfall issues<br>- Still experimentalModern React apps (v18+)
```


### 🔍 Chi tiết so sánh


**1. Type Safety:**


- ❌ Implicit: `data.userName` có thể undefined
- ✅ Context: `user.userName` luôn guaranteed type User
- ✅ Suspense: Tự động narrow type sau render


**2. Performance:**


- ⚡ Self-contained: Parallel fetching
- 🐌 Context/Suspense: Potential waterfall
- 📊 Memory: Context không tạo extra copies


## 🎯 BEST PRACTICES


### ✅ DOs - Nên làm


```typescript
// 1. Always add invariants cho Context hooks
export const useCurrentUserContext = () => {
  const user = useContext(CurrentUserContext)
  if (!user) {
    throw new Error(`
      🚨 useCurrentUserContext phải được sử dụng bên trong CurrentUserContextProvider
      Hint: Wrap component tree với <CurrentUserContextProvider>
    `)
  }
  return user
}

// 2. Tạo custom Provider với clear error handling
export const CurrentUserProvider = ({ children }: PropsWithChildren) => {
  const query = useCurrentUserQuery()

  // ✅ Handle từng state một cách explicit
  if (query.isPending) return <GlobalLoader message="Đang tải user info..." />
  if (query.isError) return <ErrorBoundary error={query.error} />

  return (
    <CurrentUserContext.Provider value={query.data}>
      {children}
    </CurrentUserContext.Provider>
  )
}

// 3. Type Context properly
interface UserContextType {
  user: User // Không phải User | null
  refetch: () => void
  isRefetching: boolean
}
const UserContext = createContext<UserContextType | null>(null)
```


### ❌ DON'Ts - Tránh làm


```typescript
// ❌ Đừng ignore TypeScript warnings
function BadComponent() {
  const { data } = useCurrentUserQuery()
  return <div>{data!.userName}</div> // Dangerous!
}

// ❌ Đừng tạo nested Providers không cần thiết
function OverComplicated() {
  return (
    <UserProvider>
      <PermissionProvider> {/* Có thể combine được */}
        <ProfileProvider>  {/* Too many layers */}
          <App />
        </ProfileProvider>
      </PermissionProvider>
    </UserProvider>
  )
}

// ❌ Đừng để Context value recreate mỗi render
function BadProvider({ children }) {
  const query = useCurrentUserQuery()

  // ❌ Object literal tạo mới mỗi render
  return (
    <UserContext.Provider value={{ user: query.data, isLoading: query.isPending }}>
      {children}
    </UserContext.Provider>
  )
}
```


### ⚡ Performance Optimizations


```typescript
// ✅ Memoize context value
export const OptimizedUserProvider = ({ children }: PropsWithChildren) => {
  const query = useCurrentUserQuery()

  // Chỉ recreate value khi cần thiết
  const contextValue = useMemo(
    () => ({
      user: query.data,
      refetch: query.refetch,
      isRefetching: query.isRefetching
    }),
    [query.data, query.refetch, query.isRefetching]
  )

  if (query.isPending) return <Loader />
  if (query.isError) return <ErrorUI />

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  )
}
```


## 🚀 ỨNG DỤNG THỰC TẾ


### 🏢 Enterprise Applications


**1. Multi-tenant SaaS Platform:**


```typescript
// Tenant context cho phép access tenant info throughout app
const TenantContext = createContext<Tenant | null>(null)

export const TenantProvider = ({ children, tenantId }: Props) => {
  const tenantQuery = useTenantQuery(tenantId)

  // Redirect to tenant selection if no access
  if (tenantQuery.isError && tenantQuery.error.status === 403) {
    return <Navigate to="/tenant-selection" />
  }

  if (tenantQuery.isPending) return <TenantLoader />

  return (
    <TenantContext.Provider value={tenantQuery.data}>
      {children}
    </TenantContext.Provider>
  )
}

// Usage in deep components
function InvoiceList() {
  const tenant = useTenantContext() // ✅ Type-safe tenant access

  const invoicesQuery = useInvoicesQuery({
    tenantId: tenant.id, // Guaranteed to exist
    filters: tenant.defaultInvoiceFilters
  })

  return <InvoiceTable data={invoicesQuery.data} />
}
```


**2. E-commerce với User & Cart Context:**


```typescript
// Combine multiple contexts for complex state
function EcommerceApp() {
  return (
    <UserProvider>
      <CartProvider> {/* Cart depends on user being loaded */}
        <WishlistProvider>
          <ShoppingExperience />
        </WishlistProvider>
      </CartProvider>
    </UserProvider>
  )
}

// Cart có thể safely access user info
function CartProvider({ children }: PropsWithChildren) {
  const user = useUserContext() // User guaranteed to exist

  const cartQuery = useCartQuery(user.id)
  // ... handle cart logic
}
```


### 📱 Mobile-First Applications


```typescript
// Device context cho responsive behavior
const DeviceContext = createContext<DeviceInfo | null>(null)

export const useDeviceContext = () => {
  const device = useContext(DeviceContext)
  if (!device) throw new Error('useDeviceContext requires DeviceProvider')
  return device
}

// Usage throughout app
function ProductGrid() {
  const device = useDeviceContext()

  const columns = device.isMobile ? 2 : device.isTablet ? 3 : 4
  const pageSize = device.isMobile ? 10 : 20

  return <Grid columns={columns} pageSize={pageSize} />
}
```


## 📚 KIẾN THỨC LIÊN QUAN


### 🎯 Prerequisites cần biết


**Fundamental Level:**


- React Hooks (useState, useEffect, useContext)
- TypeScript basic types và generics
- Component composition patterns
- Props drilling problem


**Intermediate Level:**


- React Query/TanStack Query concepts
- Context API advanced patterns
- Error boundaries
- Suspense và Concurrent Features


**Advanced Level:**


- Performance optimization techniques
- Bundle splitting strategies
- SSR considerations
- Testing strategies for context


### 🌐 Advanced Topics để tìm hiểu tiếp


**1. Advanced React Query Patterns:**


```typescript
// Parallel queries với dependent data
function useUserWithPermissions(userId: string) {
  const userQuery = useUserQuery(userId)

  const permissionsQuery = usePermissionsQuery(
    userId,
    { enabled: !!userQuery.data } // Chỉ fetch khi có user
  )

  return {
    user: userQuery.data,
    permissions: permissionsQuery.data,
    isLoading: userQuery.isPending || permissionsQuery.isPending
  }
}
```


**2. Context Composition Patterns:**


```typescript
// Higher-order component pattern
export const withUserContext = <P extends object>(
  Component: ComponentType<P>
) => {
  return (props: P) => (
    <UserProvider>
      <Component {...props} />
    </UserProvider>
  )
}

// Usage
export default withUserContext(MyApp)
```


**3. Testing Strategies:**


```typescript
// Test utilities cho context
export const renderWithUserContext = (
  ui: ReactElement,
  user: User = mockUser
) => {
  return render(
    <UserContext.Provider value={user}>
      {ui}
    </UserContext.Provider>
  )
}

// Test component behavior
test('hiển thị user name correctly', () => {
  renderWithUserContext(<UserNameDisplay />, mockUser)
  expect(screen.getByText('User: John Doe')).toBeInTheDocument()
})
```


### 🔗 Related Technologies


- **Zustand**: Global state management alternative
- **Jotai**: Atomic state management
- **Redux Toolkit**: Traditional state management
- **SWR**: Alternative to React Query
- **React Router**: For route-based context
- **React Hook Form**: For form context patterns


## 💼 INTERVIEW PERSPECTIVE


### 📝 Câu hỏi Interview có thể gặp


**1. "Explain the difference between prop drilling và Context API"**


**Professional Answer:**


>
> "Prop drilling là việc pass data qua multiple component layers, dẫn đến components ở giữa nhận props không sử dụng. Context API giải quyết bằng cách provide data directly cho consumers, skip intermediate components. Tuy nhiên Context không phải state manager - nó là dependency injection tool."
>
>


**2. "When would you choose Context over global state management?"**


**Professional Answer:**


>
> "Context phù hợp cho data ít thay đổi và scope cụ thể như user info, theme, locale. Global state managers như Zustand better cho frequently changing data hoặc complex state logic. Context + React Query là pattern mạnh cho server state."
>
>


**3. "How do you prevent unnecessary re-renders with Context?"**


**Professional Answer:**


>
> "Memoize context value với useMemo, split contexts nếu data change với frequencies khác nhau, và consider using multiple contexts thay vì một large context object."
>
>


### 💡 Điểm cộng khi demonstrate knowledge


**Code Example trong Interview:**


```typescript
// Demonstrate understanding of performance pitfalls
const ThemeProvider = ({ children }: PropsWithChildren) => {
  const [theme, setTheme] = useState('light')

  // ❌ Bad - creates new object every render
  // const value = { theme, setTheme }

  // ✅ Good - memoized value
  const value = useMemo(
    () => ({ theme, setTheme }),
    [theme]
  )

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}
```


**Advanced Understanding Points:**


- Hiểu khi nào Context cause performance issues
- Biết cách combine Context với React Query effectively
- Understand trade-offs between different patterns
- Có thể explain error boundaries với Context
- Hiểu SSR implications của Context


### 🎯 Red Flags trong Interview


❌ **Tránh những câu trả lời này:**


- "Context là React state manager"
- "Context luôn better than prop drilling"
- "Không cần worry về performance với Context"
- "Context có thể replace Redux hoàn toàn"


✅ **Thay vào đó:**


- "Context is dependency injection, not state management"
- "Context có trade-offs, phù hợp cho specific use cases"
- "Performance considerations quan trọng với Context"
- "Context + specialized tools often better than Context alone"


---


## 🎉 KẾT LUẬN


Pattern Context + React Query này giải quyết elegant một pain point real trong React development: làm sao để balance type safety, code reusability và performance. Nó không phải silver bullet, nhưng là powerful tool khi used correctly.


**Key Takeaways:**


- 🎯 Context makes implicit dependencies explicit
- 🔒 Type safety without sacrificing developer experience
- ⚡ Performance implications cần được consider carefully
- 🛠️ Best suited cho mandatory data trong specific sub-trees
- 🚀 Scales well với proper architecture decisions


Happy coding! 🚀
