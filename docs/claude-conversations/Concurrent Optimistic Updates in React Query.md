# Concurrent Optimistic Updates in React Query

## You

#29: Concurrent Optimistic Updates in React Query

## Claude


# 🎯 PHÂN TÍCH BÀI VIẾT: CONCURRENT OPTIMISTIC UPDATES IN REACT QUERY


## 📝 TÓM TẮT CHÍNH


Bài viết này giải quyết vấn đề **"window of inconsistency"** - hiện tượng UI bị nhấp nháy hoặc hiển thị dữ liệu không nhất quán khi sử dụng Optimistic Updates trong React Query, đặc biệt là khi có nhiều mutations chạy đồng thời. Tác giả đưa ra giải pháp thông minh bằng cách sử dụng **Query Cancellation** kết hợp với **Limited Invalidations** để đảm bảo UI luôn consistent và smooth.


## 🔍 KHÁI NIỆM CỐT LÕI


### 🚀 Optimistic Updates


```typescript
// Cập nhật UI ngay lập tức, không chờ server response
// Giống như khi bạn like một post Facebook - UI update luôn, không chờ server
queryClient.setQueryData(['items', id], (prevData) => ({
  ...prevData,
  isLiked: !prevData.isLiked // Đảo ngược trạng thái like ngay lập tức
}))
```


### ⚡ Window of Inconsistency


Khoảng thời gian UI hiển thị dữ liệu sai lệch, thường xảy ra khi:


- Query đang fetch dữ liệu từ server
- Mutation đang update dữ liệu optimistically
- Server response về và overwrite optimistic update


### 🔄 Query Cancellation


```typescript
// Hủy bỏ những request đang chạy để tránh conflict
await queryClient.cancelQueries({
  queryKey: ['items', 'detail', id]
})
```


### 🎯 Concurrent Mutations


Nhiều mutations cùng chạy song song trên cùng một entity - ví dụ user spam click button toggle.


## 💡 HIỂU BẢN CHẤT


### 🎯 Pain Point được giải quyết:


1. **UI Flickering**: Button toggle từ ON → OFF → ON một cách jarring
2. **Race Conditions**: Request cũ về sau request mới, ghi đè dữ liệu wrong
3. **Poor UX**: User không biết action của họ có thành công không


### ⚙️ Cơ chế hoạt động:


```
Timeline without solution:
[GET request] ─────────────► [response overwrites optimistic update] ❌

Timeline with solution:
[MUTATION starts] ──► [cancels GET] ──► [optimistic update safe] ✅
```


### 🤔 Tại sao không dùng alternatives?


- **Disable button**: UX tệ, user phải chờ
- **Debouncing**: Vẫn có race condition
- **Server state management**: Phức tạp, overkill


## 🛠️ CODE EXAMPLES THỰC TẾ


### 📱 Basic Toggle Implementation:


```typescript
const useToggleIsActive = (id: number) =>
  useMutation({
    mutationFn: api.toggleIsActive,

    // Chạy trước khi gửi request lên server
    onMutate: async () => {
      // Hủy bỏ mọi query đang fetch cho item này để tránh conflict
      await queryClient.cancelQueries({
        queryKey: ['items', 'detail', id],
      })

      // Cập nhật UI ngay lập tức (optimistic)
      queryClient.setQueryData(['items', 'detail', id], (prevItem) =>
        prevItem
          ? {
              ...prevItem,
              isActive: !prevItem.isActive, // Đảo ngược boolean
            }
          : undefined
      )
    },

    // Chạy sau khi mutation hoàn thành (thành công hoặc thất bại)
    onSettled: () => {
      // Invalidate để sync với server state
      queryClient.invalidateQueries({
        queryKey: ['items', 'detail', id],
      })
    },
  })
```


### 🔄 Advanced: Preventing Over-invalidation:


```typescript
const useToggleIsActive = (id: number) =>
  useMutation({
    mutationKey: ['items'], // Tag để group related mutations
    mutationFn: api.toggleIsActive,

    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: ['items', 'detail', id],
      })

      queryClient.setQueryData(['items', 'detail', id], (prevItem) =>
        prevItem
          ? {
              ...prevItem,
              isActive: !prevItem.isActive,
            }
          : undefined
      )
    },

    onSettled: () => {
      // Chỉ invalidate nếu đây là mutation cuối cùng trong group
      if (queryClient.isMutating({ mutationKey: ['items'] }) === 1) {
        queryClient.invalidateQueries({
          queryKey: ['items', 'detail', id],
        })
      }
      // Nếu === 1 nghĩa là chỉ còn mutation hiện tại đang chạy
      // (onSettled chạy khi mutation vẫn đang active)
    },
  })
```


### 📋 Complex List Updates with Filtering:


```typescript
// Update item trong filtered list
queryClient.setQueryData(['items', 'list', filters], (prevItems) =>
  prevItems
    ?.map((item) =>
      item.id === newItem.id ? { ...item, ...newItem } : item
    )
    // Lọc bỏ items không match filter sau khi update
    .filter((item) => filters.categories.includes(item.category))
)
```


## 🔄 SO SÁNH & PHÂN BIỆT


```
ApproachƯu điểmNhược điểmUse CaseNo Optimistic UpdatesĐơn giản, always correctUX chậm, user phải chờNon-critical actionsBasic Optimistic UpdatesUX tốt, implementation dễRace conditions, flickeringSimple togglesWith Query CancellationGiảm inconsistencyPhức tạp hơnReal-time interactionsLimited InvalidationsZero flickeringMost complexHigh-frequency mutations
```


### ⚖️ Trade-offs:


**Optimistic Updates + Query Cancellation:**


- ✅ Excellent UX, immediate feedback
- ✅ Handles single mutations well
- ❌ Still has issues with concurrent mutations


**Limited Invalidations:**


- ✅ Handles concurrent mutations perfectly
- ✅ Zero UI inconsistency
- ❌ More complex logic
- ❌ Requires careful mutation grouping


## 🎯 BEST PRACTICES


### ✅ DOs:


```typescript
// 1. Always cancel queries before optimistic updates
await queryClient.cancelQueries({ queryKey })

// 2. Use mutation keys for grouping related mutations
mutationKey: ['items', 'toggle']

// 3. Check mutation count before invalidating
if (queryClient.isMutating({ mutationKey: ['items'] }) === 1) {
  queryClient.invalidateQueries({ queryKey })
}

// 4. Handle edge cases in optimistic updates
.filter((item) => matchesCurrentFilter(item, filters))
```


### ❌ DON'Ts:


```typescript
// ❌ Forgetting to cancel queries
onMutate: () => {
  queryClient.setQueryData(...) // Missing cancelQueries!
}

// ❌ Always invalidating without checking
onSettled: () => {
  queryClient.invalidateQueries(...) // Causes over-invalidation
}

// ❌ Not handling filter logic in optimistic updates
queryClient.setQueryData(listKey, (prev) =>
  prev?.map(item => item.id === id ? newItem : item)
  // Missing .filter() for current filters!
)
```


### 🚨 Common Mistakes:


1. **Stale Closures**: Dùng `useIsMutating()` thay vì `queryClient.isMutating()`
2. **Missing Error Handling**: Không rollback khi mutation fail
3. **Over-broad Mutation Keys**: Tag quá nhiều mutations không liên quan


## 🚀 ỨNG DỤNG THỰC TẾ


### 🛒 E-commerce Cart:


```typescript
// Add to cart with optimistic updates
const useAddToCart = (productId: string) =>
  useMutation({
    mutationKey: ['cart', 'add'],
    mutationFn: (quantity: number) => api.addToCart(productId, quantity),

    onMutate: async (quantity) => {
      await queryClient.cancelQueries({ queryKey: ['cart'] })

      // Optimistically update cart count
      queryClient.setQueryData(['cart'], (prevCart) => ({
        ...prevCart,
        items: [...prevCart.items, { productId, quantity }],
        totalItems: prevCart.totalItems + quantity
      }))
    },

    onSettled: () => {
      // Chỉ sync với server khi không còn cart mutations khác
      if (queryClient.isMutating({ mutationKey: ['cart'] }) === 1) {
        queryClient.invalidateQueries({ queryKey: ['cart'] })
      }
    }
  })
```


### 📝 Real-time Todo App:


```typescript
// Toggle todo với concurrent support
const useToggleTodo = () =>
  useMutation({
    mutationKey: ['todos', 'toggle'],
    mutationFn: ({ id, completed }: { id: string, completed: boolean }) =>
      api.updateTodo(id, { completed }),

    onMutate: async ({ id, completed }) => {
      await queryClient.cancelQueries({ queryKey: ['todos'] })

      // Update trong list view
      queryClient.setQueryData(['todos', 'list'], (prevTodos) =>
        prevTodos?.map(todo =>
          todo.id === id ? { ...todo, completed } : todo
        )
      )

      // Update trong detail view nếu có
      queryClient.setQueryData(['todos', 'detail', id], (prevTodo) =>
        prevTodo ? { ...prevTodo, completed } : undefined
      )
    },

    onSettled: () => {
      if (queryClient.isMutating({ mutationKey: ['todos'] }) === 1) {
        queryClient.invalidateQueries({ queryKey: ['todos'] })
      }
    }
  })
```


### 🎮 Gaming Leaderboard:


```typescript
// Update score với high-frequency mutations
const useUpdateScore = () =>
  useMutation({
    mutationKey: ['game', 'score'],
    mutationFn: (scoreIncrement: number) => api.updateScore(scoreIncrement),

    onMutate: async (scoreIncrement) => {
      await queryClient.cancelQueries({ queryKey: ['leaderboard'] })

      queryClient.setQueryData(['player', 'current'], (prevPlayer) => ({
        ...prevPlayer,
        score: prevPlayer.score + scoreIncrement
      }))

      // Update vị trí trong leaderboard
      queryClient.setQueryData(['leaderboard'], (prevLeaderboard) =>
        prevLeaderboard
          ?.map(player =>
            player.id === currentPlayerId
              ? { ...player, score: player.score + scoreIncrement }
              : player
          )
          .sort((a, b) => b.score - a.score) // Re-sort by score
      )
    },

    onSettled: () => {
      if (queryClient.isMutating({ mutationKey: ['game'] }) === 1) {
        queryClient.invalidateQueries({ queryKey: ['leaderboard'] })
      }
    }
  })
```


## 📚 KIẾN THỨC LIÊN QUAN


### 📋 Prerequisites:


- React Query/TanStack Query basics
- React hooks (useState, useMutation)
- Promise handling và async/await
- Basic understanding của race conditions


### 🎓 Advanced Topics để tìm hiểu tiếp:


- **Error Boundaries**: Handle mutation failures gracefully
- **Offline Support**: Persist optimistic updates khi mất kết nối
- **Conflict Resolution**: Merge strategies khi server data conflicts
- **Real-time Subscriptions**: WebSocket integration với optimistic updates


### 🔗 Related Technologies:


- **Redux Toolkit Query**: Alternative approach với similar concepts
- **SWR**: Simpler alternative cho basic use cases
- **Apollo Client**: GraphQL equivalent với optimistic updates
- **Zustand**: Client state management complement


## 💼 INTERVIEW PERSPECTIVE


### 🎯 Câu hỏi Interview có thể gặp:


**Q1**: "Explain optimistic updates và khi nào bạn sẽ sử dụng?"
**A**: "Optimistic updates là technique update UI ngay lập tức trước khi server respond, giúp improve perceived performance. Tôi sẽ dùng cho actions mà user expect immediate feedback như toggles, likes, hoặc simple form submissions. Không nên dùng cho critical operations như payments hoặc khi server logic phức tạp."


**Q2**: "Làm sao handle concurrent mutations để tránh race conditions?"
**A**: "Tôi sẽ combine 3 strategies: Query Cancellation để abort conflicting requests, Mutation Keys để group related mutations, và Limited Invalidations checking `queryClient.isMutating()` count trước khi invalidate. Điều này đảm bảo chỉ mutation cuối cùng trigger invalidation."


**Q3**: "Trade-offs của optimistic updates là gì?"
**A**: "Pros: Better UX, immediate feedback, perceived performance. Cons: Phải duplicate server logic trên client, handle rollback scenarios, complexity tăng với concurrent operations. Cần balance giữa UX improvement và development complexity."


### 🏆 Điểm cộng khi demonstrate:


- Hiểu được underlying problem (race conditions)
- Biết khi nào nên và không nên dùng optimistic updates
- Có thể implement solution handle concurrent mutations
- Understand performance implications và best practices


## 🎪 DEMO INTERACTIVE


Tôi sẽ tạo một interactive demo để bạn có thể experiment với concurrent optimistic updates:


Bài viết này là một gem về **Concurrent Optimistic Updates** trong React Query! Đây là technique advanced giải quyết vấn đề "window of inconsistency" - một trong những challenges phức tạp nhất khi build real-time UIs.


**Interactive Demo** ở trên cho phép bạn experiment với different strategies và observe trực tiếp cách Query Cancellation và Limited Invalidations hoạt động. Hãy thử:


1. **Turn off cả 2 options** → trigger rapid mutations → observe UI flickering
2. **Enable Query Cancellation only** → see improvement nhưng vẫn có issues
3. **Enable both** → experience completely smooth UI


**Key Takeaway**: Optimistic Updates không chỉ là update UI trước, mà còn phải handle concurrent scenarios intelligently. Pattern này essential cho bất kỳ app nào có real-time interactions.


Có questions cụ thể nào về implementation hoặc muốn dive deeper vào specific scenarios không? 🚀
