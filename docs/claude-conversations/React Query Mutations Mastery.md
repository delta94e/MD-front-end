# React Query Mutations Mastery

## You

Mastering Mutations in React Query

## Claude


# 🎯 PHÂN TÍCH CHI TIẾT: MASTERING MUTATIONS IN REACT QUERY


## 📝 1. TÓM TẮT CHÍNH


Bài viết này giải thích về **useMutation hook** trong React Query - công cụ để xử lý các thao tác **thay đổi dữ liệu** trên server (tạo, sửa, xóa). Khác với `useQuery` dùng để fetch data, `useMutation` được thiết kế cho các side effects và cung cấp cơ chế để **đồng bộ hóa UI** với server state sau khi thực hiện mutations.


Vấn đề này quan trọng vì trong real-world applications, chúng ta không chỉ hiển thị data mà còn phải **cập nhật, tạo mới, xóa** data - và cần UI reflect những changes này một cách **nhất quán và hiệu quả**.


## 🔍 2. KHÁI NIỆM CỐT LÕI


### 🧬 Mutation là gì?


```javascript
// ❌ Mutation - có side effect (thay đổi array gốc)
const myArray = [1]
myArray.push(2) // Thay đổi myArray trực tiếp
console.log(myArray) // [1, 2]

// ✅ Immutable - không có side effect (tạo array mới)
const myArray = [1]
const newArray = myArray.concat(2) // Tạo array mới
console.log(myArray)  // [1] - không đổi
console.log(newArray) // [1, 2] - mới
```


### 🔄 Server Mutations


Trong context của React Query, mutations là các functions thực hiện **side effects lên server**:


- ✅ Tạo todo mới → `POST /todos`
- ✅ Cập nhật user profile → `PUT /users/123`
- ✅ Xóa comment → `DELETE /comments/456`
- ✅ Login user → `POST /auth/login`


### ⚖️ useQuery vs useMutation


```
AspectuseQueryuseMutationExecutionDeclarative (tự động)Imperative (thủ công)TimingChạy ngay + background refetchChỉ khi được gọiState SharingCó (cache shared)Không (mỗi instance riêng)PurposeFetch & sync dataUpdate server state
```


## 💡 3. HIỂU BẢN CHẤT


### 🎯 Pain Points Được Giải Quyết


**Trước React Query Mutations:**


```javascript
// 😰 Code cũ - phức tạp và error-prone
const [loading, setLoading] = useState(false)
const [error, setError] = useState(null)

const handleSubmit = async (data) => {
  setLoading(true)
  setError(null)
  try {
    await axios.post('/todos', data)
    // 😱 Phải manually refetch tất cả related queries
    refetchTodos()
    refetchStats()
    setLoading(false)
  } catch (err) {
    setError(err)
    setLoading(false)
  }
}
```


**Với useMutation:**


```javascript
// 🎉 Code mới - clean và declarative
const addTodo = useMutation({
  mutationFn: (data) => axios.post('/todos', data),
  onSuccess: () => {
    // ✅ Auto invalidate related queries
    queryClient.invalidateQueries({ queryKey: ['todos'] })
  }
})

const handleSubmit = (data) => {
  addTodo.mutate(data) // Đơn giản và clean!
}
```


### 🔧 Cơ Chế Hoạt Động


1. **Imperative Execution**: Developer control khi nào mutation chạy
2. **State Tracking**: Auto track loading, error, success states
3. **Cache Integration**: Tích hợp với query cache để sync UI
4. **Callback System**: Hooks để handle success/error cases


### 🤔 Tại Sao Không Dùng useQuery?


```javascript
// ❌ Nếu dùng useQuery cho mutations - DISASTER!
const { data } = useQuery({
  queryKey: ['createTodo'],
  queryFn: () => axios.post('/todos', newTodoData) // 😱
})
// Problem: Sẽ tạo todo mỗi khi component re-render, window focus, etc!
```


## 🛠️ 4. CODE EXAMPLES THỰC TẾ


### 📝 Basic Mutation Example


### 📝 Complex Mutation với Optimistic Updates


```javascript
const useToggleTodo = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, completed }) => {
      // Simulate server call
      await new Promise(resolve => setTimeout(resolve, 1000))
      return axios.patch(`/todos/${id}`, { completed })
    },

    // 🎯 Optimistic update - cập nhật UI ngay lập tức
    onMutate: async ({ id, completed }) => {
      // Hủy các refetch đang pending để tránh overwrite optimistic update
      await queryClient.cancelQueries({ queryKey: ['todos'] })

      // Snapshot previous value để rollback nếu failed
      const previousTodos = queryClient.getQueryData(['todos'])

      // Optimistically update UI
      queryClient.setQueryData(['todos'], (old) =>
        old?.map(todo =>
          todo.id === id ? { ...todo, completed } : todo
        )
      )

      // Return rollback function
      return { previousTodos }
    },

    // ✅ Success - không cần làm gì vì UI đã updated
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
    },

    // ❌ Error - rollback optimistic update
    onError: (err, variables, context) => {
      queryClient.setQueryData(['todos'], context.previousTodos)
    }
  })
}
```


### 🔄 Mutation với Multiple Variables


```javascript
// ❌ WRONG - Không thể pass multiple arguments
const updateTodo = useMutation({
  mutationFn: (id, title, body) => api.updateTodo(id, title, body) // Won't work!
})

// ✅ CORRECT - Dùng object để wrap multiple variables
const updateTodo = useMutation({
  mutationFn: ({ id, title, body }) => api.updateTodo(id, title, body)
})

// Usage
updateTodo.mutate({ id: 1, title: 'New Title', body: 'New Body' })
```


## 🔄 5. SO SÁNH & PHÂN BIỆT


### ⚖️ Query Invalidation vs Direct Updates


```
ApproachProsConsUse CaseInvalidation🟢 Simple, safe, consistent🔴 Extra network requestDefault choice, complex listsDirect Update🟢 No extra request, instant🔴 Complex logic, prone to bugsSimple updates with full response
```


### 🔍 mutate vs mutateAsync


```javascript
// 🎯 mutate - Recommended approach
const handleSubmit = () => {
  myMutation.mutate(data, {
    onSuccess: (response) => {
      // ✅ Error handling tự động
      navigate('/success')
    }
  })
}

// ⚠️ mutateAsync - Chỉ khi thật sự cần Promise
const handleSubmit = async () => {
  try {
    const response = await myMutation.mutateAsync(data)
    navigate('/success')
  } catch (error) {
    // 😰 Phải tự handle errors
    console.error(error)
  }
}
```


### 📊 Callback Firing Order


```javascript
const mutation = useMutation({
  // 1️⃣ Callbacks này fire TRƯỚC
  onSuccess: () => {
    // Logic liên quan queries (invalidation, etc)
    queryClient.invalidateQueries({ queryKey: ['todos'] })
  }
})

// 2️⃣ Callbacks này fire SAU (nếu component chưa unmount)
mutation.mutate(data, {
  onSuccess: () => {
    // UI logic (redirects, toasts, etc)
    showToast('Success!')
    navigate('/dashboard')
  }
})
```


## 🎯 6. BEST PRACTICES


### ✅ DOs - Nên làm


```javascript
// 🟢 Separate concerns: Logic vs UI
const useCreateTodo = () => useMutation({
  mutationFn: createTodo,
  // ✅ Query logic ở custom hook
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['todos'] })
  }
})

// Trong component
const createTodo = useCreateTodo()
createTodo.mutate(data, {
  // ✅ UI logic ở component level
  onSuccess: () => showToast('Todo created!')
})

// 🟢 Return invalidation promises khi cần wait
onSuccess: () => {
  return queryClient.invalidateQueries({ queryKey: ['todos'] })
  // Mutation sẽ pending cho đến khi refetch xong
}

// 🟢 Use object cho multiple variables
mutationFn: ({ title, body, priority }) => api.create({ title, body, priority })
```


### ❌ DON'Ts - Tránh làm


```javascript
// 🔴 Đừng make mutations quá optimistic nếu failure rate cao
// 🔴 Đừng dùng mutateAsync trừ khi thật sự cần Promise
// 🔴 Đừng forget handle loading states trong UI
// 🔴 Đừng mutate data structure không consistent với backend response
```


### ⚡ Performance Considerations


```javascript
// 🎯 Optimized invalidation với query filters
queryClient.invalidateQueries({
  queryKey: ['todos'],
  exact: false,  // Match all queries starting with ['todos']
  type: 'active' // Chỉ refetch active queries
})

// 🎯 Batch multiple invalidations
Promise.all([
  queryClient.invalidateQueries({ queryKey: ['todos'] }),
  queryClient.invalidateQueries({ queryKey: ['stats'] }),
  queryClient.invalidateQueries({ queryKey: ['users'] })
])
```


## 🚀 7. ỨNG DỤNG THỰC TẾ


### 💼 Real-World Use Cases


**E-commerce Platform:**


```javascript
// 🛒 Add to cart mutation
const useAddToCart = () => useMutation({
  mutationFn: ({ productId, quantity }) =>
    api.post('/cart/items', { productId, quantity }),
  onSuccess: () => {
    // Invalidate cart, product availability, recommendations
    queryClient.invalidateQueries({ queryKey: ['cart'] })
    queryClient.invalidateQueries({ queryKey: ['products'] })
  }
})

// 💳 Checkout mutation với complex logic
const useCheckout = () => useMutation({
  mutationFn: checkoutCart,
  onMutate: () => {
    // Show loading overlay
    setCheckoutLoading(true)
  },
  onSuccess: (orderData) => {
    // Clear cart, redirect to success page
    queryClient.setQueryData(['cart'], [])
    navigate(`/order/${orderData.id}/success`)
  },
  onError: (error) => {
    // Handle payment errors, show retry options
    handleCheckoutError(error)
  },
  onSettled: () => {
    setCheckoutLoading(false)
  }
})
```


**Social Media App:**


```javascript
// 👍 Like/Unlike post với optimistic updates
const useLikePost = () => useMutation({
  mutationFn: ({ postId, liked }) =>
    api.post(`/posts/${postId}/like`, { liked }),
  onMutate: async ({ postId, liked }) => {
    await queryClient.cancelQueries({ queryKey: ['posts'] })
    const previousPosts = queryClient.getQueryData(['posts'])

    // Optimistic update
    queryClient.setQueryData(['posts'], (old) =>
      old?.map(post =>
        post.id === postId
          ? {
              ...post,
              liked,
              likeCount: post.likeCount + (liked ? 1 : -1)
            }
          : post
      )
    )

    return { previousPosts }
  },
  onError: (err, variables, context) => {
    queryClient.setQueryData(['posts'], context.previousPosts)
  }
})
```


### 🔧 Framework Integration


**Next.js Integration:**


```javascript
// pages/_app.js
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    mutations: {
      // Global mutation defaults
      retry: 1,
      retryDelay: 1000,
    }
  }
})

// pages/api/todos.js - API route
export default async function handler(req, res) {
  if (req.method === 'POST') {
    const todo = await createTodo(req.body)
    res.json(todo)
  }
}
```


**React Native Integration:**


```javascript
// Handle network connectivity
import NetInfo from '@react-native-async-storage/async-storage'

const useCreateTodo = () => useMutation({
  mutationFn: createTodo,
  onError: (error) => {
    if (error.message === 'Network Error') {
      // Queue mutation for later retry when online
      queueMutation({ type: 'CREATE_TODO', data })
    }
  }
})
```


## 📚 8. KIẾN THỨC LIÊN QUAN


### 📖 Prerequisites


- **React Hooks** (useState, useEffect) - Cơ bản để hiểu lifecycle
- **Promises & Async/Await** - Mutations work với async operations
- **HTTP Methods** (GET, POST, PUT, DELETE) - Mapping với CRUD operations
- **Basic React Query** (useQuery, QueryClient) - Foundation concepts


### 🎓 Advanced Topics


```javascript
// 🔥 Infinite Mutations - Pagination với mutations
const useInfiniteComments = (postId) => useInfiniteQuery({
  queryKey: ['comments', postId],
  queryFn: ({ pageParam = 0 }) => fetchComments(postId, pageParam),
  getNextPageParam: (lastPage) => lastPage.nextCursor
})

// 🔥 Parallel Mutations
const useParallelUpdates = () => {
  const updateProfile = useMutation({ mutationFn: updateProfile })
  const updateSettings = useMutation({ mutationFn: updateSettings })

  const updateAll = async (profileData, settingsData) => {
    const results = await Promise.allSettled([
      updateProfile.mutateAsync(profileData),
      updateSettings.mutateAsync(settingsData)
    ])
    return results
  }

  return { updateAll, updateProfile, updateSettings }
}

// 🔥 Dependent Mutations
const useOrderFlow = () => {
  const createOrder = useMutation({ mutationFn: createOrder })
  const processPayment = useMutation({ mutationFn: processPayment })

  const completeOrder = async (orderData, paymentData) => {
    const order = await createOrder.mutateAsync(orderData)
    const payment = await processPayment.mutateAsync({
      ...paymentData,
      orderId: order.id
    })
    return { order, payment }
  }

  return { completeOrder }
}
```


### 🌐 Related Technologies


- **React Hook Form** + useMutation = Perfect form handling
- **Zustand/Redux** + React Query = Global state + Server state
- **React Router** + useMutation = Navigation after mutations
- **React Suspense** + useMutation = Advanced loading states


## 💼 9. INTERVIEW PERSPECTIVE


### 🎤 Câu Hỏi Thường Gặp


**Q1: "Sự khác biệt giữa useQuery và useMutation là gì?"**


```
✅ Trả lời Professional:

"useQuery được thiết kế cho data fetching và tự động sync với server state:
- Declarative: Chạy tự động khi component mount
- Background refetch để keep data fresh
- Share state across components qua cache

useMutation được thiết kế cho data modification:
- Imperative: Chỉ chạy khi được trigger manually
- Không share state, mỗi instance độc lập
- Cung cấp callbacks để handle side effects

Ví dụ: useQuery để load danh sách todos, useMutation để create/update/delete todos."
```


**Q2: "Làm thế nào để sync UI sau khi mutation thành công?"**


```
✅ Trả lời với Code Example:

"Có 2 approaches chính:

1. Query Invalidation (recommended):
   queryClient.invalidateQueries({ queryKey: ['todos'] })
   - Safe, consistent, nhưng có extra network request

2. Direct Cache Update:
   queryClient.setQueryData(['todos'], newData)
   - Immediate, nhưng phức tạp và dễ bugs

Tôi thường prefer invalidation vì đơn giản và reliable hơn."
```


**Q3: "Optimistic updates là gì và khi nào nên sử dụng?"**


```
✅ Trả lời Technical:

"Optimistic updates nghĩa là update UI ngay lập tức, giả định mutation sẽ thành công.

Suitable cho:
- Simple operations với low failure rate (toggle, like/unlike)
- Actions cần instant feedback (button states)

NOT suitable cho:
- Complex mutations với high failure rate
- Operations có side effects khó rollback
- Forms có validation phức tạp

Implementation cần onMutate để update UI, onError để rollback."
```


### 🏆 Điểm Cộng Khi Demo


```javascript
// 🌟 Show advanced understanding
const useAdvancedMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateData,

    // ⭐ Demonstrate error handling
    retry: (failureCount, error) => {
      if (error.status === 401) return false // Don't retry auth errors
      return failureCount < 3
    },

    // ⭐ Show performance optimization
    onSuccess: (data, variables) => {
      // Surgical invalidation instead of broad sweep
      queryClient.invalidateQueries({
        queryKey: ['items', variables.categoryId],
        exact: false
      })

      // Update related queries directly if we have the data
      if (data.relatedItems) {
        queryClient.setQueryData(['related', variables.id], data.relatedItems)
      }
    },

    // ⭐ Demonstrate proper error boundaries
    onError: (error, variables, context) => {
      // Log for monitoring
      analytics.track('mutation_failed', {
        operation: 'update_item',
        error: error.message
      })

      // Rollback optimistic updates
      if (context?.previousData) {
        queryClient.setQueryData(['items'], context.previousData)
      }
    }
  })
}
```


## 🎪 10. DEMO INTERACTIVE


Demo trên đây cho phép bạn:


- ✅ **Thêm todos** và thấy loading states
- ✅ **Xóa todos** với confirmation
- ✅ **Observe mutations** hoạt động real-time
- ✅ **Error handling** nếu operations fail
- ✅ **Auto invalidation** để sync UI với data


**Thử nghiệm:**


1. Thêm vài todos để thấy mutation flow
2. Xóa todos để thấy optimistic updates
3. Check browser DevTools Network tab để thấy API calls
4. Mở multiple tabs để thấy cache sharing


**Key Learning Points:**


- Mutations are **imperative** - bạn control khi nào chúng run
- **Loading states** được track automatically
- **Query invalidation** sync UI sau mutations
- **Error handling** được built-in với proper UX


---


## 🎯 TỔNG KẾT


React Query Mutations giải quyết fundamental problem của **client-server state synchronization** khi modify data. Thay vì manually manage loading states, error handling, và cache updates, useMutation cung cấp declarative API để handle tất cả complexity này.


**Core mindset:**


- Queries để **read** data
- Mutations để **write** data
- QueryClient để **sync** state between reads và writes


Master được mutations là bước quan trọng để build robust, user-friendly React applications với excellent UX! 🚀
