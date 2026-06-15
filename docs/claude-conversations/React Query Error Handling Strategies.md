# React Query Error Handling Strategies

## You

React Query Error Handling

## Claude


# 🎯 React Query Error Handling - Phân Tích Toàn Diện


## 📝 TÓM TẮT CHÍNH


Bài viết này đi sâu vào **Error Handling trong React Query** - một aspect cực kỳ quan trọng nhưng thường bị overlook trong quá trình phát triển ứng dụng. Thay vì chỉ focus vào "sunshine cases", bài viết hướng dẫn các strategies khác nhau để handle errors một cách elegant và user-friendly.


**Tại sao quan trọng?** Bởi vì trong real-world applications, network requests fail, servers down, rate limits hit - và cách chúng ta handle những tình huống này directly impact user experience và app reliability.


## 🔍 KHÁI NIỆM CỐT LÕI


### 1. Error States trong React Query


- **isError**: Boolean flag cho biết query có bị lỗi hay không
- **error**: Object chứa chi tiết lỗi
- **status**: Enum với các giá trị: 'pending', 'error', 'success'


### 2. Error Boundaries


- **Định nghĩa**: React component đặc biệt có thể catch JavaScript errors ở bất kỳ đâu trong component tree
- **So sánh**: Giống như try-catch block nhưng cho React components
- **Limitation**: Không thể catch async errors trực tiếp


### 3. throwOnError Flag


- **Cơ chế**: React Query catch async error và re-throw trong next render cycle
- **Mục đích**: Cho phép Error Boundaries catch được async errors
- **Flexibility**: Có thể customize error nào sẽ được throw


### 4. Global vs Local Error Handling


- **Local**: Handle error trong từng component riêng lẻ
- **Global**: Centralized error handling thông qua QueryCache callbacks


## 💡 HIỂU BẢN CHẤT


### Pain Points Được Giải Quyết:


🎯 **Boilerplate Reduction**: Thay vì phải check `isError` ở mọi component, dùng Error Boundaries để centralize


🎯 **Background Error Handling**: Phân biệt giữa initial fetch error và background refetch error


🎯 **User Experience**: Tránh unmount toàn bộ UI chỉ vì background fetch fail


🎯 **Error Notification**: Toast notifications thay vì error banners permanent


### Cơ Chế Underlying:


```javascript
// React Query internally làm như thế này:
try {
  const data = await queryFn();
  return data;
} catch (error) {
  if (throwOnError) {
    // Re-throw trong next render để Error Boundary catch được
    scheduleErrorThrow(error);
  }
  return { error, data: undefined };
}
```


### Tại Sao Approach Này Được Chọn:


✅ **Leverages React Ecosystem**: Sử dụng Error Boundaries có sẵn của React

✅ **Granular Control**: Developer choose error handling strategy per query

✅ **Performance**: Không block UI unnecessarily

✅ **Separation of Concerns**: Business logic tách khỏi error handling logic


## 🛠️ CODE EXAMPLES THỰC TẾ


### 1. Standard Error Handling Pattern


```javascript
function ProductList() {
  const products = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts
  })

  // ⏳ Loading state - hiển thị skeleton hoặc spinner
  if (products.isPending) {
    return <ProductSkeleton />
  }

  // ❌ Error state - hiển thị error message với retry option
  if (products.isError) {
    return (
      <ErrorCard
        message="Không thể tải danh sách sản phẩm"
        onRetry={() => products.refetch()}
        error={products.error}
      />
    )
  }

  // ✅ Success state - render data
  return (
    <div className="product-grid">
      {products.data.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
```


### 2. Error Boundaries với throwOnError


```javascript
// 🛡️ Error Boundary Component
class ProductErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    // 📊 Log error to monitoring service
    console.error('Product fetch error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h2>Oops! Có lỗi xảy ra</h2>
          <button onClick={() => this.setState({ hasError: false })}>
            Thử lại
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

// 🎯 Component sử dụng throwOnError
function ProductList() {
  const products = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
    // 🚀 Tất cả errors sẽ được throw về Error Boundary
    throwOnError: true,
  })

  // 📝 Chỉ cần handle success và loading states
  if (products.data) {
    return (
      <div className="product-grid">
        {products.data.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    )
  }

  return <ProductSkeleton />
}

// 🏗️ App structure
function App() {
  return (
    <ProductErrorBoundary>
      <ProductList />
    </ProductErrorBoundary>
  )
}
```


### 3. Granular Error Handling


```javascript
function UserProfile() {
  const userProfile = useQuery({
    queryKey: ['user-profile'],
    queryFn: fetchUserProfile,
    // 🎛️ Chỉ server errors (5xx) sẽ đi vào Error Boundary
    // Client errors (4xx) sẽ được handle locally
    throwOnError: (error) => {
      // 🔍 Check HTTP status code
      const statusCode = error.response?.status

      // 🔴 Server errors -> Error Boundary
      if (statusCode >= 500) return true

      // 🟡 Client errors -> Handle locally
      if (statusCode >= 400 && statusCode < 500) return false

      // 🔵 Network errors -> Error Boundary
      return !error.response
    },
  })

  // 🛠️ Handle client errors locally (validation, permission, etc.)
  if (userProfile.isError) {
    const error = userProfile.error
    const statusCode = error.response?.status

    if (statusCode === 401) {
      return <LoginPrompt />
    }

    if (statusCode === 403) {
      return <PermissionDenied />
    }

    if (statusCode === 404) {
      return <UserNotFound />
    }
  }

  return userProfile.data ? <ProfileCard user={userProfile.data} /> : <ProfileSkeleton />
}
```


### 4. Global Error Handling với Toast Notifications


```javascript
import toast from 'react-hot-toast'

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      // 🎯 Chỉ show toast cho background refetches
      // (khi đã có data trong cache)
      if (query.state.data !== undefined) {
        toast.error(`Cập nhật dữ liệu thất bại: ${error.message}`)
        return
      }

      // 🔍 Categorize errors
      if (error.response?.status >= 500) {
        toast.error('Lỗi server, vui lòng thử lại sau')
      } else if (error.response?.status === 404) {
        toast.error('Dữ liệu không tồn tại')
      } else if (!error.response) {
        toast.error('Không có kết nối internet')
      } else {
        toast.error('Có lỗi xảy ra, vui lòng thử lại')
      }
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      // 📝 Handle mutation errors globally
      toast.error(`Thao tác thất bại: ${error.message}`)
    },
  }),
})
```


## 🔄 SO SÁNH & PHÂN BIỆT


```
ApproachƯu ĐiểmNhược ĐiểmUse CasesStandard Error Checking✅ Explicit control<br/>✅ Easy to understand<br/>✅ Component-specific❌ Boilerplate code<br/>❌ Hard to maintain<br/>❌ No background error handlingSmall apps, specific error handlingError Boundaries✅ Centralized handling<br/>✅ Clean component code<br/>✅ Graceful degradation❌ Less granular control<br/>❌ Setup overhead<br/>❌ All-or-nothing approachLarge apps, consistent error UXGlobal Callbacks✅ Single source of truth<br/>✅ Perfect for monitoring<br/>✅ Background error handling❌ Less context<br/>❌ Hard to customize per queryLogging, analytics, toast notifications
```


### Performance Comparison:


```javascript
// ❌ Bad: Multiple error checks
function BadExample() {
  const users = useQuery({ queryKey: ['users'], queryFn: fetchUsers })
  const posts = useQuery({ queryKey: ['posts'], queryFn: fetchPosts })
  const comments = useQuery({ queryKey: ['comments'], queryFn: fetchComments })

  if (users.isError || posts.isError || comments.isError) {
    return <ErrorPage />
  }
  // ... rest of component
}

// ✅ Good: Error Boundary handles all
function GoodExample() {
  const users = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
    throwOnError: true
  })
  const posts = useQuery({
    queryKey: ['posts'],
    queryFn: fetchPosts,
    throwOnError: true
  })
  // ... clean component logic
}
```


## 🎯 BEST PRACTICES


### 🚨 Critical Guidelines:


1. **Phân Biệt Error Types:**


```javascript
const handleError = (error) => {
  // 🔴 Network errors
  if (!error.response) {
    return 'CONNECTION_ERROR'
  }

  // 🟠 Client errors (validation, permission)
  if (error.response.status < 500) {
    return 'CLIENT_ERROR'
  }

  // 🔴 Server errors
  return 'SERVER_ERROR'
}
```


1. **Background vs Initial Errors:**


```javascript
const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      const isBackgroundError = query.state.data !== undefined

      if (isBackgroundError) {
        // 🔔 Toast notification - keep current UI
        toast.error('Cập nhật thất bại')
      } else {
        // 🚨 Proper error handling - replace UI
        // Let Error Boundary or component handle
      }
    }
  })
})
```


1. **Error Recovery Strategies:**


```javascript
function useProductsWithRetry() {
  return useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
    retry: (failureCount, error) => {
      // 🔄 Retry network errors
      if (!error.response) return failureCount < 3

      // 🚫 Don't retry client errors
      if (error.response.status < 500) return false

      // 🔄 Retry server errors with exponential backoff
      return failureCount < 2
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
  })
}
```


### ⚠️ Common Mistakes:


❌ **Using onError for toasts in custom hooks** (sẽ duplicate notifications)

❌ **Not differentiating background vs initial errors**

❌ **Throwing all errors to Error Boundaries** (lose granular control)

❌ **Forgetting to handle loading states when using throwOnError**


## 🚀 ỨNG DỤNG THỰC TẾ


### 1. E-commerce Application:


```javascript
// 🛒 Product Catalog với sophisticated error handling
function ProductCatalogApp() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* 🛡️ Critical errors go here */}
      <AppErrorBoundary>
        <Header />

        {/* 🎯 Product-specific errors */}
        <ProductErrorBoundary>
          <ProductCatalog />
        </ProductErrorBoundary>

        {/* 🛒 Cart errors won't affect product viewing */}
        <CartErrorBoundary>
          <ShoppingCart />
        </CartErrorBoundary>

        <Footer />
      </AppErrorBoundary>
    </QueryClientProvider>
  )
}
```


### 2. Dashboard Application:


```javascript
// 📊 Dashboard với multiple data sources
function usedashboard() {
  const analytics = useQuery({
    queryKey: ['analytics'],
    queryFn: fetchAnalytics,
    // 🎯 Analytics errors shouldn't crash dashboard
    throwOnError: false
  })

  const userStats = useQuery({
    queryKey: ['user-stats'],
    queryFn: fetchUserStats,
    // 🚨 Critical data - crash if failed
    throwOnError: true
  })

  return { analytics, userStats }
}
```


### 3. Mobile App với React Native:


```javascript
// 📱 Mobile-specific error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // 📶 Network issues common on mobile
        if (!error.response) return failureCount < 5
        return failureCount < 2
      },
      retryDelay: (attemptIndex) => {
        // 🕐 Longer delays for mobile
        return Math.min(2000 * 2 ** attemptIndex, 60000)
      }
    }
  },
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (query.state.data !== undefined) {
        // 📳 Native notification for background errors
        showNativeNotification('Cập nhật dữ liệu thất bại')
      }
    }
  })
})
```


## 📚 KIẾN THỨC LIÊN QUAN


### Prerequisites:


- 🎯 React Fundamentals (Error Boundaries, useEffect)
- 🔄 Promises và Async/Await
- 🌐 HTTP Status Codes
- 🛠️ React Query Basics (useQuery, QueryClient)


### Advanced Topics:


- 🎪 **Suspense Integration**: Error handling với React Suspense
- 🔧 **Custom Error Classes**: Structured error objects
- 📊 **Error Monitoring**: Integration với Sentry, LogRocket
- 🧪 **Testing Error States**: Mock errors trong tests


### Related Technologies:


- 🍞 **React Hook Form**: Error handling cho form validation
- 🌐 **Axios Interceptors**: Global request/response error handling
- 🔔 **Toast Libraries**: react-hot-toast, react-toastify
- 🛡️ **Error Monitoring**: Sentry, Bugsnag, LogRocket


## 💼 INTERVIEW PERSPECTIVE


### Câu Hỏi Thường Gặp:


**Q: "React Query error handling khác gì với traditional try-catch?"**


**A:** "React Query cung cấp multiple layers của error handling:


- **Declarative**: Thông qua `isError`, `throwOnError` thay vì imperative try-catch
- **Background Error Handling**: Phân biệt initial vs background fetch errors
- **Global vs Local**: Centralized error handling through QueryCache callbacks
- **Integration với React**: Error Boundaries cho async errors
- **Automatic Retry**: Built-in retry mechanisms với exponential backoff"


**Q: "Khi nào nên dùng Error Boundaries vs local error handling?"**


**A:**


```javascript
// ✅ Error Boundaries for:
// - Unexpected errors (server 5xx)
// - Network failures
// - Critical app functionality
throwOnError: (error) => error.response?.status >= 500

// ✅ Local handling for:
// - Validation errors (4xx)
// - User permission issues
// - Feature-specific errors
if (query.isError && query.error.response?.status === 400) {
  return <ValidationErrorComponent />
}
```


**Q: "Performance impact của error handling strategies?"**


**A:** "Error Boundaries có performance tốt nhất vì không tạo additional re-renders. Global callbacks chỉ run once per error. Local error checking cần careful memo để avoid unnecessary re-renders."


### 💎 Điểm Cộng Khi Demo:


✨ Show understanding của async error propagation

✨ Demonstrate error categorization logic

✨ Explain trade-offs between different approaches

✨ Discuss user experience implications

✨ Knowledge về error monitoring integration


## 🎪 DEMO INTERACTIVE


Đây là một analysis cực kỳ toàn diện về **React Query Error Handling**! 🎯


## 🌟 KEY TAKEAWAYS


**Điểm mạnh của bài viết:**


- Covers toàn bộ spectrum của error handling strategies
- Practical examples với real-world context
- Explains trade-offs một cách honest và objective
- Provides migration guidance từ old patterns


**Complexity Level:** 🔥🔥🔥⭐⭐ (Intermediate to Advanced)


**Best For:** Developers đã familiar với React Query basics và muốn master error handling


## 🎓 LEARNING PATH TIẾP THEO


### Immediate Next Steps:


1. 🧪 **Practice với Demo Above** - Experiment các scenarios
2. 📚 **Đọc React Query Docs** về Error Handling section
3. 🛠️ **Implement trong project hiện tại** - Start small với global callbacks


### Advanced Topics:


1. 🔍 **Error Monitoring Integration** - Sentry, LogRocket setup
2. 🧪 **Testing Error States** - Mock error scenarios
3. 🚀 **Suspense + Error Boundaries** - React 18 integration
4. 📊 **Error Analytics** - Track user experience metrics


### Related Articles để đọc:


- React Query Status Checks patterns
- Background refetching strategies
- Optimistic updates error handling
- Server State vs Client State management


## 💼 ACTION ITEMS


**Cho Dự Án Hiện Tại:**


1. ✅ Audit current error handling patterns
2. ✅ Implement global QueryCache callbacks
3. ✅ Add Error Boundaries at appropriate levels
4. ✅ Categorize errors by type và handle accordingly


**Cho Technical Growth:**


1. 📖 Study Error Boundary patterns in depth
2. 🧪 Practice testing error scenarios
3. 🔍 Learn error monitoring best practices
4. 📊 Understand UX implications của error handling


---


Bài viết này definitely belongs trong **"Must-Read"** category cho bất kỳ React developer nào working với data fetching! 🚀


**Questions để reflect:**


- Dự án hiện tại của bạn handle errors như thế nào?
- Có opportunities nào để improve user experience?
- Làm sao để balance giữa developer experience và user experience?
