# Meta Frontend Interview Simulation

## Claude


# 🎯 Meta Frontend Engineering Mock Interview


## Technical Deep Dive: JavaScript Performance Optimization


---


## Phase 1: Article Overview & Initial Understanding


**Interviewer:** "Good morning! I'm excited to dive into some core JavaScript performance concepts with you today. I've shared an article covering event delegation, closures, and performance optimization techniques. Can you walk me through the first concept - event delegation - and explain why it's particularly important for applications at Meta's scale?"


*(Chào buổi sáng! Hôm nay tôi rất hào hứng được thảo luận về các khái niệm hiệu suất JavaScript cốt lõi với bạn. Tôi đã chia sẻ một bài viết về event delegation, closures và các kỹ thuật tối ưu hóa hiệu suất. Bạn có thể giải thích khái niệm đầu tiên - event delegation - và tại sao nó đặc biệt quan trọng cho các ứng dụng ở quy mô Meta không?)*


**Candidate:** "Absolutely! Event delegation is a powerful pattern where instead of attaching individual event listeners to multiple child elements, we attach a single listener to their common parent container.


In the todo list example from the article, rather than creating separate click handlers for each `<li>` item, we attach one listener to the `<ul>` container. When a click occurs, we use `event.target` to identify which specific item was clicked.


For Meta's scale, this is crucial because:


1. **Memory efficiency** - One listener vs potentially thousands reduces memory footprint
2. **Dynamic content handling** - New items added via React state updates automatically inherit the behavior without re-binding
3. **Performance at scale** - With Facebook's news feed having hundreds of interactive elements, event delegation prevents DOM performance bottlenecks


The pattern leverages event bubbling (sự kiện nổi bọt) - events propagate from child to parent, allowing the parent to intercept and handle them."


**Interviewer:** "Excellent explanation! Now, can you identify and explain the critical bug in the original non-delegated code example? I noticed there's a typo that would cause a runtime error."


**Candidate:** "Great catch! There's a variable name typo on line 6: `let itimes = app.getElementsByClassName('item');` should be `let items`. Then on line 8, the code tries to iterate over `items` which is undefined, causing a `TypeError: items is not iterable`.


Beyond the typo, the fundamental issue is scalability. Each `addEventListener` call:


- Creates a new function closure in memory
- Registers another DOM event handler
- Increases the browser's event processing overhead


At Meta's scale, if we have a Facebook post with 100 reactions/comments, that's 100+ individual listeners just for one post. Multiply that across an infinite scroll feed, and we're looking at potential memory leaks and performance degradation."


**Evaluation: 4/4 - Demonstrates deep understanding of both the technical details and real-world implications at scale**


---


## Phase 2: Core Technical Deep Dive


**Interviewer:** "Perfect diagnosis! Let's move to closures. The article shows a classic setTimeout loop problem. Walk me through exactly what's happening in the broken closure example and why all outputs show '4' instead of 0,1,2,3."


*(Chẩn đoán hoàn hảo! Hãy chuyển sang closures. Bài viết cho thấy vấn đề setTimeout loop kinh điển. Hãy giải thích chính xác điều gì đang xảy ra trong ví dụ closure bị lỗi và tại sao tất cả outputs đều hiển thị '4' thay vì 0,1,2,3.)*


**Candidate:** "This is a classic JavaScript execution context and closure scope issue. Let me break it down step by step:


1. **The loop executes synchronously** - all four `setTimeout` calls are queued immediately
2. **Variable var i has function scope** - there's only ONE `i` variable shared across all iterations
3. **setTimeout callbacks execute asynchronously** - they run after the loop completes
4. **By the time callbacks execute, i equals 4** - the loop terminated when `i < arr.length` became false


The closure captures a reference to the variable `i`, not its value at that moment. Since all callbacks reference the same `i`, they all see the final value.


**Here's the execution timeline:**


```
// Synchronous phase (0ms)
Loop iteration 0: setTimeout scheduled, i = 0
Loop iteration 1: setTimeout scheduled, i = 1
Loop iteration 2: setTimeout scheduled, i = 2
Loop iteration 3: setTimeout scheduled, i = 3
Loop exits: i = 4

// Asynchronous phase (3000ms later)
All 4 callbacks execute, accessing i = 4
```


This demonstrates why understanding JavaScript's event loop and closure behavior is critical for React developers working with async operations."


**Interviewer:** "Excellent! Now I want to test your solution knowledge. The article provides three solutions. Can you explain the IIFE solution and why it works, then tell me which approach you'd recommend for a React component and why?"


**Candidate:** "The IIFE (Immediately Invoked Function Expression) solution creates a new execution context for each iteration:


```javascript
setTimeout(function(i_local){
  return function () {
    console.log('The index of this number is: ' + i_local);
  }
}(i), 3000)
```


**How it works:**


1. `(function(i_local){...})(i)` - IIFE executes immediately with current `i` value
2. Parameter `i_local` captures the value (not reference) at that iteration
3. Returns a new function that closes over `i_local`
4. Each iteration creates a separate closure with its own `i_local`


**For React components, I'd recommend the let solution:**


```javascript
for (let i = 0; i < arr.length; i++) {
  setTimeout(() => console.log('Index:', i), 3000);
}
```


**Why let over IIFE in React:**


1. **Block scope** - `let` creates new binding per iteration automatically
2. **Cleaner syntax** - More readable for team maintenance
3. **Modern JavaScript** - Aligns with ES6+ practices in React ecosystem
4. **Performance** - Slightly better than creating additional function closures
5. **React DevTools friendly** - Easier to debug in React components


However, in React, we'd typically use `useEffect` with proper dependencies rather than setTimeout loops directly."


**Evaluation: 4/4 - Demonstrates mastery of closure mechanics and practical React application**


**Interviewer:** "Now let's tackle the performance optimization concepts. Explain the difference between throttling and debouncing, and give me a real-world Meta product example where you'd use each approach."


*(Bây giờ hãy giải quyết các khái niệm tối ưu hóa hiệu suất. Giải thích sự khác biệt giữa throttling và debouncing, và cho tôi một ví dụ thực tế về sản phẩm Meta mà bạn sẽ sử dụng mỗi phương pháp.)*


**Candidate:** "Excellent question! Both are rate-limiting techniques but with different strategies:


**Throttling (điều tiết):**


- **Strategy:** Execute callback at most once per time interval
- **Analogy:** "Execute first, ignore rest until cooldown"
- **Use case:** Continuous monitoring where regular updates matter


**Debouncing (chống rung):**


- **Strategy:** Execute callback only after activity stops for specified delay
- **Analogy:** "Wait for silence, then execute"
- **Use case:** Waiting for user to finish an action


**Real Meta product examples:**


**Throttling - Facebook News Feed scroll tracking:**


```javascript
// Track scroll position for analytics every 100ms max
const trackScrollPosition = throttle((scrollY) => {
  analytics.track('feed_scroll_position', { position: scrollY });
}, 100);

window.addEventListener('scroll', () =>
  trackScrollPosition(window.scrollY)
);
```


We need regular scroll position data for engagement metrics, but not on every pixel.


**Debouncing - Instagram Search functionality:**


```javascript
// Search only after user stops typing for 300ms
const searchUsers = debounce(async (query) => {
  const results = await api.searchUsers(query);
  setSearchResults(results);
}, 300);

// In React component
const handleSearchInput = (e) => {
  searchUsers(e.target.value);
};
```


We don't want to hit the API on every keystroke - wait until user finishes typing.


**Performance impact at Meta scale:**


- **Throttling** reduces API calls from 60/second to 10/second for scroll tracking
- **Debouncing** reduces search API calls from 1000+ to ~50 per user session"


**Evaluation: 4/4 - Demonstrates deep understanding with relevant, scalable examples**


---


## Phase 3: Practical Implementation


**Interviewer:** "I love those examples! Now let's get into implementation. The article shows a combined throttle-debounce approach. Can you walk me through this hybrid implementation line by line and explain when you'd use this over pure throttling or debouncing?"


**Candidate:** "Absolutely! This hybrid approach is brilliant for preventing the 'frozen page' perception. Let me break down the enhanced throttle implementation:


```javascript
function throttle(fn, delay) {
  let last = 0, timer = null;

  return function () {
    let context = this;
    let args = arguments;
    let now = +new Date();

    if (now - last < delay) {
      // Debouncing behavior: reset timer for rapid events
      clearTimeout(timer);
      timer = setTimeout(function () {
        last = now;
        fn.apply(context, args);
      }, delay);
    } else {
      // Throttling behavior: immediate execution after threshold
      last = now;
      fn.apply(context, args);
    }
  }
}
```


**Line-by-line breakdown:**


1. **State variables:** `last` tracks throttle timing, `timer` handles debounce timeout
2. **Time comparison:** `now - last < delay` determines which strategy to use
3. **Debounce path (rapid events):** Clear existing timer, set new one - gives user one more chance
4. **Throttle path (threshold exceeded):** Execute immediately - prevents indefinite delays


**When to use hybrid over pure approaches:**


**Use hybrid for:** Facebook Messenger typing indicators


- **Problem:** Pure debouncing could delay 'typing...' indicator indefinitely if user types continuously
- **Solution:** Hybrid ensures indicator shows within max delay (throttle) but still waits for pauses (debounce)


**Use pure throttling for:** Scroll position analytics


- **Need:** Consistent data points for metrics
- **Why not hybrid:** We want regular intervals, not smart delays


**Use pure debouncing for:** Form validation


- **Need:** Validate only after user completes input
- **Why not hybrid:** No benefit to early validation during typing"


**Interviewer:** "Excellent analysis! Now, final challenge: You're building a React component for Meta's new feature - a real-time collaborative document editor like Google Docs. You need to handle keystroke events for auto-save functionality. How would you implement this using the concepts we've discussed, and what performance considerations would you account for at Meta's scale?"


*(Phân tích xuất sắc! Bây giờ, thử thách cuối cùng: Bạn đang xây dựng một React component cho tính năng mới của Meta - một trình soạn thảo tài liệu cộng tác thời gian thực như Google Docs. Bạn cần xử lý các sự kiện keystroke cho chức năng tự động lưu. Bạn sẽ triển khai điều này như thế nào bằng cách sử dụng các khái niệm chúng ta đã thảo luận, và những cân nhắc về hiệu suất nào bạn sẽ tính đến ở quy mô Meta?)*


**Candidate:** "Great challenge! This requires a sophisticated approach combining all three concepts. Here's my implementation:


```javascript
import React, { useCallback, useRef, useEffect } from 'react';

const CollaborativeEditor = ({ documentId, userId }) => {
  const editorRef = useRef(null);
  const saveTimerRef = useRef(null);
  const lastSaveRef = useRef(0);
  const contentRef = useRef('');

  // Hybrid throttle-debounce for auto-save
  const autoSave = useCallback((content) => {
    const now = Date.now();
    const SAVE_DELAY = 2000; // 2 seconds
    const MAX_WAIT = 10000;  // Max 10 seconds without save

    // Force save if max wait time exceeded (throttle behavior)
    if (now - lastSaveRef.current >= MAX_WAIT) {
      saveDocument(content);
      lastSaveRef.current = now;
      return;
    }

    // Otherwise use debouncing - wait for typing pause
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveDocument(content);
      lastSaveRef.current = now;
    }, SAVE_DELAY);
  }, [documentId, userId]);

  // Event delegation for all editor interactions
  const handleEditorEvents = useCallback((e) => {
    // Use event delegation to handle all input types
    if (e.target.matches('[contenteditable], input, textarea')) {
      const content = e.target.textContent || e.target.value;
      contentRef.current = content;

      // Trigger auto-save on content change
      if (e.type === 'input' || e.type === 'keyup') {
        autoSave(content);
      }
    }
  }, [autoSave]);

  // Optimized save function with error handling
  const saveDocument = useCallback(async (content) => {
    try {
      // Optimistic UI update
      setIsSaving(true);

      await fetch(`/api/documents/${documentId}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          userId,
          timestamp: Date.now(),
          version: documentVersionRef.current + 1
        })
      });

      setLastSaved(new Date());
      setIsSaving(false);
    } catch (error) {
      // Retry logic for failed saves
      console.error('Save failed:', error);
      setIsSaving(false);
      // Could implement exponential backoff retry here
    }
  }, [documentId, userId]);

  // Set up event delegation on mount
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    // Single event listener handles all interactions
    editor.addEventListener('input', handleEditorEvents);
    editor.addEventListener('keyup', handleEditorEvents);
    editor.addEventListener('paste', handleEditorEvents);

    return () => {
      editor.removeEventListener('input', handleEditorEvents);
      editor.removeEventListener('keyup', handleEditorEvents);
      editor.removeEventListener('paste', handleEditorEvents);
      clearTimeout(saveTimerRef.current);
    };
  }, [handleEditorEvents]);

  return (
    <div
      ref={editorRef}
      contentEditable
      className="collaborative-editor"
      style={{ minHeight: '400px', border: '1px solid #ccc' }}
    />
  );
};
```


**Performance considerations at Meta's scale:**


1. **Memory Management:**

Use useRef to avoid re-renders on timer changes
Single event listener via delegation vs multiple listeners
Cleanup timers in useEffect cleanup
2. **Network Optimization:**

Batch saves to prevent excessive API calls
Implement request deduplication for concurrent users
Use WebSocket for real-time collaboration instead of polling
3. **Race Condition Handling:**

Version control for document conflicts
Optimistic UI updates with rollback capability
Queue saves during network failures
4. **Scalability:**

Debounced saves reduce server load by ~90%
Event delegation scales with document size
Consider implementing operational transforms for true collaborative editing


This approach ensures users never lose work while maintaining optimal performance at Meta's billions-of-users scale."


**Evaluation: 4/4 - Demonstrates expert-level integration of concepts with real-world scalability considerations**


---


# 🎯 Final Interview Assessment


## Overall Performance: 4/4 (Strong Hire)


**Strengths Demonstrated:**


- ✅ Deep understanding of JavaScript fundamentals
- ✅ Excellent explanation of performance optimization concepts
- ✅ Strong practical application with React ecosystem
- ✅ Scalability awareness appropriate for Meta's scale
- ✅ Clean, production-ready code implementation
- ✅ Great communication skills with clear technical explanations


**Technical Competencies:**


- **Event Delegation:** Expert level - understands memory implications and scalability
- **Closures:** Mastery - can explain execution context and provide multiple solutions
- **Performance Optimization:** Advanced - knows when to apply throttling vs debouncing vs hybrid
- **React Integration:** Strong - demonstrates modern hooks usage and best practices


**Recommendation:** **Strong hire for Senior/Staff Frontend Engineer role**


The candidate demonstrates the technical depth and practical problem-solving skills expected at Meta. Their ability to connect low-level JavaScript concepts to real-world product scenarios shows excellent engineering judgment.


## Claude


# 🎯 PHÂN TÍCH CHUYÊN SÂU: JavaScript Performance Optimization Techniques


## 1. 📝 TÓM TẮT CHÍNH


Bài viết này trình bày **3 kỹ thuật tối ưu hóa performance quan trọng** trong JavaScript frontend development: **Event Delegation**, **Closures trong Loops**, và **Throttle/Debounce**. Đây là những vấn đề mà mọi senior frontend engineer đều phải nắm vững để xây dựng ứng dụng web có khả năng scale tốt và performance cao.


Những kỹ thuật này giải quyết các pain points phổ biến như memory leaks, excessive event listeners, và quá nhiều API calls không cần thiết - những vấn đề có thể khiến ứng dụng chậm chạp hoặc crash khi có nhiều user tương tác.


## 2. 🔍 KHÁI NIỆM CỐT LÕI


### 🎯 Event Delegation


>
> **Định nghĩa đơn giản**: Thay vì gắn event listener cho từng element con, ta gắn 1 listener duy nhất cho element cha và dùng event bubbling để handle.
>
>


**Tương tự như**: Thay vì đặt 1 cảnh sát ở mỗi cửa hàng, ta đặt 1 cảnh sát ở đầu phố để giám sát toàn bộ khu vực.


### 🔄 Closures trong Loops


>
> **Định nghĩa đơn giản**: Closure là inner function có thể access variables từ outer scope. Trong loops, cần cẩn thận về variable scope để tránh bugs.
>
>


**Tương tự như**: Một người phụ trách ghi nhớ số thứ tự, nhưng chỉ nhớ được số cuối cùng thay vì từng số riêng biệt.


### ⚡ Throttle & Debounce


>
> **Định nghĩa đơn giản**:
>
>
> - **Throttle**: Giới hạn function chỉ chạy tối đa 1 lần trong khoảng thời gian nhất định
> - **Debounce**: Function chỉ chạy sau khi user ngừng action trong 1 khoảng thời gian
>
>


**Tương tự như**:


- **Throttle**: Elevator chỉ dừng ở 1 tầng mỗi 5 giây dù có nhiều người nhấn nút
- **Debounce**: Cửa tự động chỉ đóng sau khi không có ai đi qua trong 3 giây


## 3. 💡 HIỂU BẢN CHẤT


### 🔥 Pain Points được giải quyết:


1. **Memory Leaks**: Quá nhiều event listeners không được cleanup
2. **Performance Issues**: Browser phải xử lý hàng nghìn events mỗi giây
3. **Excessive API Calls**: Search/save functions gọi API liên tục
4. **UI Freezing**: Too many synchronous operations block main thread


### ⚙️ Cơ chế hoạt động underlying:


- **Event Delegation**: Dựa vào **Event Bubbling** - events lan truyền từ child lên parent
- **Closures**: Dựa vào **Lexical Scoping** - inner functions retain access to outer variables
- **Throttle/Debounce**: Dựa vào **setTimeout/clearTimeout** để control timing


### 🤔 Tại sao chọn những solutions này?


- **Event Delegation**: Scale tốt hơn individual listeners, động support dynamic content
- **Block Scoping với let**: Đơn giản hơn IIFE, modern JavaScript standard
- **Hybrid Throttle-Debounce**: Balance giữa responsiveness và efficiency


## 4. 🛠️ CODE EXAMPLES THỰC TẾ


### 🎯 Event Delegation - Todo List


```javascript
// ❌ CÁCH KHÔNG TỐI ƯU - Multiple listeners
document.addEventListener('DOMContentLoaded', function() {
  let app = document.getElementById('todo-app');
  let items = app.getElementsByClassName('item'); // Fix lỗi typo "itimes"

  for (let item of items) {
    item.addEventListener('click', function(){
      alert('Bạn đã click vào: ' + item.innerHTML);
    })
  }
})

// ✅ CÁCH TỐI ƯU - Event Delegation
document.addEventListener('DOMContentLoaded', function() {
  let app = document.getElementById('todo-app');

  // Chỉ cần 1 event listener cho toàn bộ container
  app.addEventListener('click', function(e) {
    // Kiểm tra xem element được click có phải là LI không
    if (e.target && e.target.nodeName === 'LI') {
      let item = e.target;
      alert('Bạn đã click vào: ' + item.innerHTML);
    }
  })
})
```


### 🔄 Closures trong Loops - Fix setTimeout Bug


```javascript
// ❌ CODE BỊ LỖI - In ra toàn bộ số 4
const arr = [10, 12, 15, 21];
for (var i = 0; i < arr.length; i++) {
  setTimeout(function() {
    console.log('Index của số này là: ' + i); // Luôn in ra 4
  }, 3000);
}

// ✅ GIẢI PHÁP 1: Sử dụng let (ES6) - KHUYẾN KHÍCH
const arr = [10, 12, 15, 21];
for (let i = 0; i < arr.length; i++) { // Dùng 'let' thay vì 'var'
  setTimeout(function() {
    console.log('Index của số này là: ' + i); // In ra đúng 0,1,2,3
  }, 3000);
}

// ✅ GIẢI PHÁP 2: IIFE (Immediately Invoked Function Expression)
const arr = [10, 12, 15, 21];
for (var i = 0; i < arr.length; i++) {
  setTimeout(function(i_local){
    return function () {
      console.log('Index của số này là: ' + i_local);
    }
  }(i), 3000) // Truyền i vào IIFE ngay lập tức
}
```


### ⚡ Throttle Implementation


```javascript
function throttle(fn, interval) {
  let last = 0; // Thời điểm cuối cùng function được execute

  return function () {
    let context = this; // Giữ nguyên context
    let args = arguments; // Giữ nguyên arguments
    let now = +new Date(); // Thời điểm hiện tại

    // Chỉ execute nếu đã đủ thời gian interval
    if (now - last >= interval) {
      last = now;
      fn.apply(context, args);
    }
  }
}

// Sử dụng: Scroll event chỉ fire tối đa 1 lần/giây
const optimizedScroll = throttle(() => {
  console.log('Đã scroll - chỉ log 1 lần/giây');
}, 1000);

document.addEventListener('scroll', optimizedScroll);
```


### 🛡️ Debounce Implementation


```javascript
function debounce(fn, delay) {
  let timer = null; // Timer để track timeout

  return function () {
    let context = this;
    let args = arguments;

    // Clear timer cũ nếu có
    if(timer) {
      clearTimeout(timer);
    }

    // Set timer mới
    timer = setTimeout(function () {
      fn.apply(context, args);
    }, delay)
  }
}

// Sử dụng: Search chỉ chạy sau khi user ngừng gõ 500ms
const optimizedSearch = debounce((query) => {
  console.log('Searching for:', query);
  // Call API search ở đây
}, 500);

document.getElementById('search').addEventListener('input', (e) => {
  optimizedSearch(e.target.value);
});
```


## 5. 🔄 SO SÁNH & PHÂN BIỆT


### 📊 Event Delegation vs Individual Listeners


```
AspectIndividual ListenersEvent DelegationMemory UsageCao (n listeners)Thấp (1 listener)Dynamic ContentPhải re-bind manuallyAuto supportPerformanceGiảm khi scaleConstant performanceCode ComplexityPhức tạp hơnĐơn giản hơn
```


### 📊 Throttle vs Debounce vs Hybrid


```
TechniqueExecution PatternBest Use CaseProsConsThrottleFixed intervalsScroll tracking, AnalyticsPredictable, Regular dataMay miss final stateDebounceAfter silence periodSearch, Form validationEfficient, User-focusedMay delay too longHybridSmart combinationAuto-save, Real-time syncBest of both worldsMore complex
```


## 6. 🎯 BEST PRACTICES


### ✅ Event Delegation Best Practices


```javascript
// ✅ GOOD: Kiểm tra cụ thể element type
app.addEventListener('click', function(e) {
  if (e.target.matches('.item, .item *')) { // Support nested elements
    let item = e.target.closest('.item');
    handleItemClick(item);
  }
});

// ❌ BAD: Quá general, có thể catch unintended elements
app.addEventListener('click', function(e) {
  handleItemClick(e.target); // Không check gì cả
});
```


### ⚠️ Common Mistakes cần tránh


1. **Quên cleanup event listeners**


```javascript
// ✅ GOOD: Cleanup khi component unmount
useEffect(() => {
  const handler = throttle(handleScroll, 100);
  window.addEventListener('scroll', handler);

  return () => window.removeEventListener('scroll', handler);
}, []);
```


1. **Dùng var thay vì let trong loops**


```javascript
// ❌ BAD
for (var i = 0; i < items.length; i++) { /* closure issue */ }

// ✅ GOOD
for (let i = 0; i < items.length; i++) { /* block scoped */ }
```


1. **Throttle/Debounce với timing không phù hợp**


```javascript
// ❌ BAD: Quá nhanh, không có tác dụng
const search = debounce(apiCall, 50);

// ❌ BAD: Quá chậm, UX kém
const search = debounce(apiCall, 5000);

// ✅ GOOD: Balanced
const search = debounce(apiCall, 300);
```


## 7. 🚀 ỨNG DỤNG THỰC TẾ


### 🎯 React Component với Event Delegation


```javascript
import React, { useRef, useEffect } from 'react';

const TodoList = ({ todos, onToggle, onDelete }) => {
  const listRef = useRef(null);

  useEffect(() => {
    const handleListClick = (e) => {
      const todoItem = e.target.closest('[data-todo-id]');
      if (!todoItem) return;

      const todoId = todoItem.dataset.todoId;

      if (e.target.matches('.toggle-btn')) {
        onToggle(todoId);
      } else if (e.target.matches('.delete-btn')) {
        onDelete(todoId);
      }
    };

    const list = listRef.current;
    list.addEventListener('click', handleListClick);

    return () => list.removeEventListener('click', handleListClick);
  }, [onToggle, onDelete]);

  return (
    <ul ref={listRef} className="todo-list">
      {todos.map(todo => (
        <li key={todo.id} data-todo-id={todo.id}>
          <span>{todo.text}</span>
          <button className="toggle-btn">Toggle</button>
          <button className="delete-btn">Delete</button>
        </li>
      ))}
    </ul>
  );
};
```


### 🔍 Search với Debounce Hook


```javascript
import { useState, useCallback } from 'react';

const useDebounce = (callback, delay) => {
  const [timer, setTimer] = useState(null);

  const debouncedCallback = useCallback((...args) => {
    if (timer) clearTimeout(timer);

    const newTimer = setTimeout(() => {
      callback(...args);
    }, delay);

    setTimer(newTimer);
  }, [callback, delay, timer]);

  return debouncedCallback;
};

// Sử dụng trong component
const SearchComponent = () => {
  const [results, setResults] = useState([]);

  const searchAPI = async (query) => {
    if (!query.trim()) return;
    const response = await fetch(`/api/search?q=${query}`);
    const data = await response.json();
    setResults(data);
  };

  const debouncedSearch = useDebounce(searchAPI, 300);

  return (
    <input
      type="text"
      placeholder="Tìm kiếm..."
      onChange={(e) => debouncedSearch(e.target.value)}
    />
  );
};
```


## 8. 📚 KIẾN THỨC LIÊN QUAN


### 📋 Prerequisites cần biết:


- JavaScript Event Loop và Call Stack
- DOM API và Event Handling
- Function scope và Lexical scoping
- `this` binding và `apply/call`
- Modern JavaScript (ES6+): `let/const`, Arrow functions


### 🚀 Advanced topics để tìm hiểu tiếp:


- **Intersection Observer API** cho efficient scroll handling
- **Web Workers** cho heavy computation
- **React Concurrent Features** cho better UX
- **Performance monitoring** với Web Vitals
- **Memory profiling** với Chrome DevTools


### 🔗 Related technologies:


- **RxJS** cho reactive programming với operators như `debounceTime`, `throttleTime`
- **Lodash utilities**: `_.throttle`, `_.debounce`
- **React Query** cho API state management
- **Zustand/Redux** cho global state với optimized updates


## 9. 💼 INTERVIEW PERSPECTIVE


### 🎯 Câu hỏi thường gặp:


**Q1: "Explain the difference between throttle and debounce"**


```javascript
// Trả lời với live demo
const demo = () => {
  // Throttle: Execute ngay, ignore subsequent calls trong interval
  const throttled = throttle(() => console.log('Throttled'), 1000);

  // Debounce: Delay execution until no more calls
  const debounced = debounce(() => console.log('Debounced'), 1000);
};
```


**Q2: "Why does this closure in loop code print 4 four times?"**


```javascript
// Trả lời chi tiết về execution context và variable hoisting
for (var i = 0; i < 4; i++) {
  setTimeout(() => console.log(i), 100);
}
// Giải thích: var có function scope, setTimeout callbacks chạy sau khi loop end
```


**Q3: "How would you optimize a list with 10,000 clickable items?"**


```javascript
// Trả lời về Event Delegation + Virtual Scrolling
const OptimizedList = () => {
  // 1. Event Delegation để giảm listeners
  // 2. Virtual Scrolling để render only visible items
  // 3. React.memo để prevent unnecessary re-renders
};
```


### 🏆 Điểm cộng khi demonstrate:


- Hiểu sâu về JavaScript fundamentals
- Code clean, có error handling
- Biết khi nào nên dùng technique nào
- Quan tâm đến performance và scalability
- Có experience với real-world applications


## 10. 🎪 DEMO INTERACTIVE


Tôi sẽ tạo một demo tương tác để bạn có thể experiment với các concepts này:


```html
<!DOCTYPE html>
<html>
<head>
    <title>JavaScript Performance Demo</title>
    <style>
        .demo-section { margin: 20px 0; padding: 20px; border: 1px solid #ccc; }
        .todo-item { padding: 10px; margin: 5px 0; background: #f0f0f0; cursor: pointer; }
        .todo-item:hover { background: #e0e0e0; }
        .stats { background: #ffffcc; padding: 10px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="demo-section">
        <h3>🎯 Event Delegation Demo</h3>
        <button id="add-item">Thêm Todo Item</button>
        <div class="stats" id="listener-count">Listeners: 1 (Event Delegation)</div>
        <ul id="todo-list"></ul>
    </div>

    <div class="demo-section">
        <h3>🔍 Search với Debounce</h3>
        <input type="text" id="search-input" placeholder="Gõ để search (debounced 300ms)">
        <div class="stats" id="search-stats">API Calls: 0</div>
        <div id="search-results"></div>
    </div>

    <div class="demo-section">
        <h3>⚡ Scroll với Throttle</h3>
        <div class="stats" id="scroll-stats">Scroll Events: 0 (Throttled to 1/100ms)</div>
        <div style="height: 200px; overflow-y: scroll; border: 1px solid #ccc;" id="scroll-area">
            <div style="height: 1000px; background: linear-gradient(to bottom, #ff0000, #0000ff);">
                Scroll this area to see throttling in action
            </div>
        </div>
    </div>

    <script>
        // Event Delegation Demo
        let todoCount = 0;
        let apiCallCount = 0;
        let scrollEventCount = 0;

        const todoList = document.getElementById('todo-list');
        const addButton = document.getElementById('add-item');

        // Single event listener cho toàn bộ todo list
        todoList.addEventListener('click', (e) => {
            if (e.target.classList.contains('todo-item')) {
                e.target.style.textDecoration = e.target.style.textDecoration === 'line-through' ? 'none' : 'line-through';
            }
        });

        addButton.addEventListener('click', () => {
            todoCount++;
            const li = document.createElement('li');
            li.className = 'todo-item';
            li.textContent = `Todo Item ${todoCount} - Click to toggle`;
            todoList.appendChild(li);
        });

        // Search với Debounce
        const debounce = (fn, delay) => {
            let timer = null;
            return function(...args) {
                clearTimeout(timer);
                timer = setTimeout(() => fn.apply(this, args), delay);
            };
        };

        const mockSearch = (query) => {
            apiCallCount++;
            document.getElementById('search-stats').textContent = `API Calls: ${apiCallCount}`;
            document.getElementById('search-results').innerHTML =
                query ? `<p>Kết quả cho: "${query}"</p>` : '';
        };

        const debouncedSearch = debounce(mockSearch, 300);
        document.getElementById('search-input').addEventListener('input', (e) => {
            debouncedSearch(e.target.value);
        });

        // Scroll với Throttle
        const throttle = (fn, interval) => {
            let last = 0;
            return function(...args) {
                const now = Date.now();
                if (now - last >= interval) {
                    last = now;
                    fn.apply(this, args);
                }
            };
        };

        const handleScroll = () => {
            scrollEventCount++;
            document.getElementById('scroll-stats').textContent =
                `Scroll Events: ${scrollEventCount} (Throttled to 1/100ms)`;
        };

        const throttledScroll = throttle(handleScroll, 100);
        document.getElementById('scroll-area').addEventListener('scroll', throttledScroll);

        // Initialize với một số todo items
        for (let i = 1; i <= 3; i++) {
            addButton.click();
        }
    </script>
</body>
</html>
```


---


## 🏁 TÓM TẮT CUỐI CÙNG


Sau khi nắm vững 3 kỹ thuật này, bạn sẽ có thể:


✅ **Xây dựng ứng dụng scalable** với performance tối ưu

✅ **Giải quyết memory leaks** và excessive event handling

✅ **Implement search/auto-save features** hiệu quả

✅ **Pass technical interviews** ở các công ty hàng đầu

✅ **Debug closure issues** và scope problems

✅ **Optimize user experience** với smart timing controls


Những concepts này là foundation cho mọi senior frontend engineer và sẽ được sử dụng hàng ngày trong công việc thực tế!
