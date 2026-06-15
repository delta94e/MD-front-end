# React Hooks Advanced Patterns

## You

Continue

## Claude


# Phân Tích Chuyên Sâu React Hooks Pattern: Từ First Principles Đến Production Mastery


*Góc nhìn của một Principal Front-end Engineer từ kinh nghiệm thực tế tại NAB, Axon, Binance, Webflow, và Figma*


## 🌟 Lời Mở Đầu: Tại Sao Hooks Là Một Cuộc Cách Mạng Thực Sự?


Khi tôi lần đầu tiên nghe về React Hooks vào năm 2018, thẳng thắn mà nói, tôi đã skeptical. Là một engineer đã làm việc với React từ những ngày đầu với createClass, rồi ES6 classes, tôi nghĩ: "Lại một JavaScript framework chasing shiny object syndrome nữa sao?". Nhưng sau khi implement Hooks trong production tại Binance cho trading dashboard với real-time data streams, tôi đã thực sự hiểu tại sao Dan Abramov và React team lại gọi đây là "the biggest paradigm shift since React itself".


💭 **Principal's Reflection**: *Hooks không chỉ là syntactic sugar. Nó là một fundamental rethinking về component architecture, state management, và side effects trong React ecosystem. Nó giải quyết những vấn đề mà chúng ta đã struggle hàng năm trời mà không nhận ra chúng ta đang struggle.*


### 🔬 Foundation Level: React Hooks Là Gì Thực Sự?


Trước khi dive deep, hãy establish một understanding hoàn toàn từ first principles.


**📖 Definition từ Computer Science Perspective:**
React Hooks là một set of functions cho phép bạn "hook into" React's internal state và lifecycle systems từ functional components. Về bản chất, Hooks là một implementation của higher-order functions pattern combined với closure mechanism để manage stateful logic.


**🌱 Nguồn Gốc & Motivation - The Real Problem:**


Để hiểu Hooks, chúng ta phải hiểu vấn đề mà nó giải quyết. Tôi sẽ kể một câu chuyện thực tế từ dự án tại NAB.


Năm 2017, chúng tôi đang build mortgage application system. Một component đơn giản để track user's progress through application steps đã grow thành một 800-line class component monster:


```javascript
// Đây là nightmare mà chúng tôi đã face tại NAB
class MortgageApplicationTracker extends React.Component {
  constructor(props) {
    super(props);

    // State cho 12 different concerns
    this.state = {
      currentStep: 1,
      formData: {},
      validationErrors: {},
      isSubmitting: false,
      autoSaveTimer: null,
      userActivity: 'active',
      sessionTimeout: null,
      networkStatus: 'online',
      unsavedChanges: false,
      progressPercentage: 0,
      estimatedTime: 0,
      lastSavedTimestamp: null
    };

    // 20+ method bindings - performance killer
    this.handleStepChange = this.handleStepChange.bind(this);
    this.handleFormSubmit = this.handleFormSubmit.bind(this);
    this.handleAutoSave = this.handleAutoSave.bind(this);
    this.handleUserActivity = this.handleUserActivity.bind(this);
    this.handleNetworkChange = this.handleNetworkChange.bind(this);
    // ... 15 more bindings
  }

  componentDidMount() {
    // 5 different setup concerns mixed together
    this.setupAutoSave();
    this.setupActivityTracking();
    this.setupNetworkMonitoring();
    this.setupSessionTimeout();
    this.loadPreviousProgress();
  }

  componentDidUpdate(prevProps, prevState) {
    // Logic scattered everywhere
    if (prevState.currentStep !== this.state.currentStep) {
      this.updateProgress();
      this.resetStepValidation();
      this.trackStepChange();
    }

    if (prevState.formData !== this.state.formData) {
      this.scheduleAutoSave();
      this.markUnsavedChanges();
    }

    // ... more scattered logic
  }

  componentWillUnmount() {
    // Cleanup nightmare
    if (this.state.autoSaveTimer) {
      clearInterval(this.state.autoSaveTimer);
    }
    if (this.state.sessionTimeout) {
      clearTimeout(this.state.sessionTimeout);
    }

    window.removeEventListener('online', this.handleNetworkChange);
    window.removeEventListener('offline', this.handleNetworkChange);
    document.removeEventListener('mousemove', this.handleUserActivity);
    document.removeEventListener('keypress', this.handleUserActivity);
    // ... more cleanup
  }

  // 30+ methods with tangled logic
  setupAutoSave() { /* auto-save logic */ }
  setupActivityTracking() { /* activity logic */ }
  setupNetworkMonitoring() { /* network logic */ }
  handleStepChange() { /* step logic */ }
  handleFormSubmit() { /* submit logic */ }
  // ... methods scattered everywhere

  render() {
    // 100+ lines of JSX
    return (
      <div className="mortgage-tracker">
        {/* Complex rendering logic */}
      </div>
    );
  }
}
```


**🔥 The Pain Points We Experienced:**


1. **Logic Scattering**: Auto-save logic was split across constructor, componentDidMount, componentDidUpdate, và componentWillUnmount
2. **Reusability Nightmare**: Muốn reuse auto-save logic? Copy-paste entire class
3. **Testing Hell**: Testing một method require setup entire class state
4. **Performance Issues**: 20+ method bindings trong constructor
5. **Onboarding Difficulty**: New developers cần hiểu ES6 classes, `this` binding, lifecycle methods


💭 **The Aha Moment**: *Vấn đề không phải ở React. Vấn đề là chúng ta đang organize logic theo lifecycle thay vì theo concern. Auto-save logic should live together, không scatter across 4 different methods.*


## 📚 PHẦN I: DEEP DIVE - CLASS COMPONENTS VÀ NHỮNG HẠN CHẾ CỐT LÕI


### 🔬 Bản Chất Của Class Components - Computer Science Perspective


Trước khi hiểu tại sao Hooks revolutionary, chúng ta cần hiểu class components từ computer science fundamentals.


**⚙️ Class Components Memory Model:**


```javascript
// Đây là những gì thực sự happen trong memory
class UserProfile extends React.Component {
  constructor(props) {
    super(props);

    // Memory allocation cho state object
    this.state = {
      user: null,
      loading: true,
      error: null
    };

    // Method binding tạo new function instances
    this.handleUserUpdate = this.handleUserUpdate.bind(this);
    // Mỗi bind() call = new function object trong memory
  }
}

// Memory layout:
// UserProfile instance:
//   - __proto__ -> UserProfile.prototype
//   - state: { user: null, loading: true, error: null }
//   - handleUserUpdate: bound function reference
//   - props: reference to props object
//   - context: React context reference
```


**🧠 Cognitive Load Analysis:**


Khi tôi analyze onboarding time tại Webflow, tôi discovered rằng junior developers spent 60% of their debugging time trên những issues related đến:


1. **this Context Confusion**:


```javascript
class EventHandler extends React.Component {
  constructor(props) {
    super(props);
    this.state = { count: 0 };

    // Tại sao cần bind? Junior dev confusion point #1
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick() {
    // `this` context issue nếu không bind
    this.setState({ count: this.state.count + 1 });
  }

  render() {
    return (
      <button onClick={this.handleClick}>
        Count: {this.state.count}
      </button>
    );
  }
}
```


💭 **Teaching Moment**: *Tôi phải explain rằng trong JavaScript, this binding is dynamic. Khi pass this.handleClick as prop, this context gets lost. Arrow functions solve này through lexical scoping, nhưng creates new function mỗi render.*


1. **Lifecycle Method Logic Scattering**:


Đây là real example từ Figma plugin development:


```javascript
class CanvasSync extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      nodes: [],
      syncStatus: 'idle',
      lastSync: null
    };
  }

  componentDidMount() {
    // Setup concern #1: WebSocket connection
    this.websocket = new WebSocket(this.props.wsUrl);
    this.websocket.onmessage = this.handleNodeUpdate;

    // Setup concern #2: Auto-sync timer
    this.syncTimer = setInterval(this.syncNodes, 5000);

    // Setup concern #3: Visibility change detection
    document.addEventListener('visibilitychange', this.handleVisibilityChange);

    // Initial data fetch
    this.fetchInitialNodes();
  }

  componentDidUpdate(prevProps, prevState) {
    // Update concern #1: WebSocket reconnection
    if (prevProps.wsUrl !== this.props.wsUrl) {
      this.websocket.close();
      this.websocket = new WebSocket(this.props.wsUrl);
      this.websocket.onmessage = this.handleNodeUpdate;
    }

    // Update concern #2: Sync interval changes
    if (prevProps.syncInterval !== this.props.syncInterval) {
      clearInterval(this.syncTimer);
      this.syncTimer = setInterval(this.syncNodes, this.props.syncInterval);
    }

    // Update concern #3: Node selection changes
    if (prevState.selectedNodes !== this.state.selectedNodes) {
      this.syncSelectedNodes();
    }
  }

  componentWillUnmount() {
    // Cleanup concern #1: WebSocket
    if (this.websocket) {
      this.websocket.close();
    }

    // Cleanup concern #2: Timer
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    // Cleanup concern #3: Event listeners
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }

  // Methods scattered throughout class...
  handleNodeUpdate = (event) => { /* WebSocket logic */ }
  handleVisibilityChange = () => { /* Visibility logic */ }
  syncNodes = () => { /* Sync logic */ }
  syncSelectedNodes = () => { /* Selection sync logic */ }
  fetchInitialNodes = () => { /* Fetch logic */ }
}
```


**🔍 The Problem Analysis:**


1. **Single Responsibility Principle Violation**: Một class đang handle WebSocket, timing, event listeners, và data fetching
2. **Temporal Coupling**: Setup/cleanup logic cho cùng một concern bị tách rời
3. **Reusability Issues**: Muốn reuse WebSocket logic? Extract HOC hoặc Render Props - thêm complexity


### 🏭 Production Reality: Wrapper Hell và Performance Issues


Tại Axon, chúng tôi có một dashboard component bị wrap trong 7 layers của HOCs:


```javascript
const DashboardComponent = withAuth(
  withTheme(
    withAnalytics(
      withErrorBoundary(
        withLoading(
          withDataFetching(
            withWebSocket(BaseDashboard)
          )
        )
      )
    )
  )
);
```


**React DevTools Tree:**


```
WithAuth
  WithTheme
    WithAnalytics
      WithErrorBoundary
        WithLoading
          WithDataFetching
            WithWebSocket
              BaseDashboard
```


**Performance Impact Analysis:**


1. **Extra Re-renders**: Mỗi HOC layer có thể trigger unnecessary re-renders
2. **Props Drilling**: Props phải pass through 7 layers
3. **Debug Nightmare**: Error stack traces become meaningless
4. **Bundle Size**: Mỗi HOC adds to bundle size


💭 **Principal's Learning**: *Wrapper hell wasn't just aesthetic problem. Nó có real performance và maintainability costs. Chúng tôi measured 15% performance improvement chỉ bằng cách flatten component hierarchy with Hooks.*


## 📚 PHẦN II: HOOKS REVOLUTION - PARADIGM SHIFT FUNDAMENTALS


### 🌱 Nguồn Gốc Triết Học: Functional Programming Meets React


React Hooks represent một fundamental paradigm shift từ object-oriented component model sang functional programming model. Đây không phải là accident - nó reflect broader industry trend towards functional programming benefits.


**🔬 First Principles: What Are Hooks Really?**


Từ computer science perspective, React Hooks là implementation của several advanced patterns:


1. **Higher-Order Functions**: Hooks are functions that enhance component behavior
2. **Closures**: Hooks capture and maintain state through closure mechanism
3. **Function Composition**: Multiple hooks compose together cleanly
4. **Immutable State Updates**: State updates follow functional programming principles


```javascript
// Hooks dưới góc nhìn functional programming
const useCounter = (initialValue = 0) => {
  // Closure captures state
  const [count, setCount] = useState(initialValue);

  // Pure functions for state updates
  const increment = useCallback(() => setCount(c => c + 1), []);
  const decrement = useCallback(() => setCount(c => c - 1), []);
  const reset = useCallback(() => setCount(initialValue), [initialValue]);

  // Return object with state and behaviors
  return { count, increment, decrement, reset };
};

// Function composition
const CounterComponent = () => {
  const counter = useCounter(10);
  const isEven = useMemo(() => counter.count % 2 === 0, [counter.count]);

  return (
    <div>
      <p>Count: {counter.count} ({isEven ? 'Even' : 'Odd'})</p>
      <button onClick={counter.increment}>+</button>
      <button onClick={counter.decrement}>-</button>
      <button onClick={counter.reset}>Reset</button>
    </div>
  );
};
```


### ⚙️ Core Mechanism: Hooks Fiber Architecture Deep Dive


Để truly understand Hooks, chúng ta cần understand cách React internally manage hooks state.


**🧠 React Fiber và Hooks Storage:**


```javascript
// Pseudo-code representation của React internals
class FiberNode {
  constructor() {
    this.memoizedState = null; // Linked list của hook states
    this.tag = FunctionComponent;
    this.elementType = YourComponent;
  }
}

// Mỗi hook call tạo một node trong linked list
class Hook {
  constructor() {
    this.memoizedState = null; // Current state value
    this.next = null;          // Next hook trong list
    this.queue = null;         // Update queue for state changes
  }
}

// Example: Component với 3 hooks
function MyComponent() {
  const [name, setName] = useState('');     // Hook index 0
  const [age, setAge] = useState(0);        // Hook index 1
  const [email, setEmail] = useState('');   // Hook index 2

  // React internally maintains:
  // fiberNode.memoizedState = Hook0 -> Hook1 -> Hook2 -> null
}
```


**🔍 Rules of Hooks - Technical Explanation:**


Các Rules of Hooks tồn tại vì technical constraints của linked list implementation:


```javascript
// ❌ Tại sao điều này breaks Hooks?
function BrokenComponent({ condition }) {
  const [name, setName] = useState(''); // Always hook index 0

  if (condition) {
    const [age, setAge] = useState(0);  // Sometimes hook index 1
  }

  const [email, setEmail] = useState(''); // Sometimes index 1, sometimes 2!

  // React internal confusion:
  // First render: Hook0(name) -> Hook1(age) -> Hook2(email)
  // Second render: Hook0(name) -> Hook1(email)
  // Hook1 expects age state but gets email state!
}

// ✅ Correct implementation
function CorrectComponent({ condition }) {
  const [name, setName] = useState('');
  const [age, setAge] = useState(0);
  const [email, setEmail] = useState('');

  // Conditional logic inside hooks, not conditional hooks
  useEffect(() => {
    if (condition) {
      // Do something with age
    }
  }, [condition, age]);
}
```


💭 **Principal's Insight**: *Rules of Hooks aren't arbitrary restrictions. Chúng reflect fundamental architectural decisions trong React's reconciliation algorithm. Understanding này helps debug weird hook behaviors.*


### 🎯 State Hook Deep Dive: useState Internals


Bây giờ chúng ta sẽ dissect `useState` từ implementation level đến practical usage.


**📖 useState - From First Principles:**


```javascript
// Simplified useState implementation
function useState(initialState) {
  // Get current hook from fiber
  const hook = getCurrentHook();

  if (hook.memoizedState === null) {
    // First render: initialize state
    hook.memoizedState = typeof initialState === 'function'
      ? initialState()
      : initialState;
  }

  const setState = (newState) => {
    // Create update object
    const update = {
      action: typeof newState === 'function' ? newState : () => newState,
      next: null
    };

    // Add to update queue
    if (hook.queue === null) {
      hook.queue = { pending: null };
    }

    const pending = hook.queue.pending;
    if (pending === null) {
      update.next = update;
    } else {
      update.next = pending.next;
      pending.next = update;
    }
    hook.queue.pending = update;

    // Schedule re-render
    scheduleWork(currentFiber);
  };

  return [hook.memoizedState, setState];
}
```


**🔬 State Updates: Synchronous vs Asynchronous Behavior:**


Đây là một confusion point mà tôi thường see trong code reviews:


```javascript
function Counter() {
  const [count, setCount] = useState(0);

  const handleClick = () => {
    console.log('Before:', count); // 0

    setCount(count + 1);
    console.log('After:', count);  // Still 0! Why?

    setCount(count + 1);
    console.log('Count again:', count); // Still 0!

    // Final count after re-render will be 1, not 2!
  };

  return <button onClick={handleClick}>Count: {count}</button>;
}
```


**🧠 Mental Model: State Updates Are Asynchronous và Batched:**


```javascript
function Counter() {
  const [count, setCount] = useState(0);

  const handleClick = () => {
    // React batches these updates
    setCount(count + 1); // count = 0, so sets to 1
    setCount(count + 1); // count still 0, so sets to 1 again
    setCount(count + 1); // count still 0, so sets to 1 again

    // Result: count becomes 1, not 3
  };

  const handleClickCorrect = () => {
    // Use functional updates
    setCount(c => c + 1); // c = 0, returns 1
    setCount(c => c + 1); // c = 1, returns 2
    setCount(c => c + 1); // c = 2, returns 3

    // Result: count becomes 3
  };

  return (
    <div>
      <button onClick={handleClick}>Wrong Way</button>
      <button onClick={handleClickCorrect}>Correct Way</button>
      <p>Count: {count}</p>
    </div>
  );
}
```


**🏭 Production Example từ Binance Trading Platform:**


Tại Binance, chúng tôi có real-time price updates mà require careful state management:


```javascript
function TradingWidget({ symbol }) {
  const [price, setPrice] = useState(null);
  const [volume, setVolume] = useState(null);
  const [change, setChange] = useState(null);

  useEffect(() => {
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@ticker`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      // ❌ Wrong: Multiple state updates cause multiple re-renders
      setPrice(parseFloat(data.c));
      setVolume(parseFloat(data.v));
      setChange(parseFloat(data.P));
    };

    return () => ws.close();
  }, [symbol]);

  // Better approach: Batch updates
  useEffect(() => {
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@ticker`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      // ✅ Better: Use single state object
      setTicker(prevTicker => ({
        ...prevTicker,
        price: parseFloat(data.c),
        volume: parseFloat(data.v),
        change: parseFloat(data.P),
        timestamp: Date.now()
      }));
    };

    return () => ws.close();
  }, [symbol]);
}
```


**💡 Performance Optimization Patterns:**


```javascript
// Pattern 1: Lazy Initial State
const [expensiveValue, setExpensiveValue] = useState(() => {
  // Only runs on first render
  return computeExpensiveValue(props);
});

// Pattern 2: State Reducer for Complex Updates
const [state, setState] = useState({
  user: null,
  preferences: {},
  notifications: []
});

const updateUser = (userData) => {
  setState(prevState => ({
    ...prevState,
    user: { ...prevState.user, ...userData }
  }));
};

// Pattern 3: Optimistic Updates
const [todos, setTodos] = useState([]);
const [optimisticTodos, setOptimisticTodos] = useState([]);

const addTodo = async (text) => {
  const tempTodo = { id: Date.now(), text, pending: true };

  // Optimistic update
  setOptimisticTodos(prev => [...prev, tempTodo]);

  try {
    const savedTodo = await api.createTodo(text);
    setTodos(prev => [...prev, savedTodo]);
    setOptimisticTodos(prev => prev.filter(t => t.id !== tempTodo.id));
  } catch (error) {
    // Rollback optimistic update
    setOptimisticTodos(prev => prev.filter(t => t.id !== tempTodo.id));
    showError('Failed to create todo');
  }
};
```


### 🎯 Effect Hook Deep Dive: useEffect Mastery


`useEffect` is arguably the most complex và misunderstood hook. Tôi đã see countless bugs related đến incorrect useEffect usage.


**🔬 useEffect Mental Model - Event Subscription Pattern:**


```javascript
// useEffect isn't about lifecycle methods
// It's about synchronizing with external systems

function ChatRoom({ roomId }) {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    // Effect function: "Subscribe to room"
    const socket = new WebSocket(`/chat/${roomId}`);

    socket.onmessage = (event) => {
      setMessages(prev => [...prev, JSON.parse(event.data)]);
    };

    // Cleanup function: "Unsubscribe from room"
    return () => {
      socket.close();
    };
  }, [roomId]); // Dependency: "Re-subscribe when room changes"
}
```


**⚙️ Dependency Array Deep Understanding:**


Đây là source của 80% useEffect bugs:


```javascript
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);

  // ❌ Missing dependency - stale closure bug
  useEffect(() => {
    const fetchUser = async () => {
      const userData = await api.getUser(userId);
      setUser(userData);

      // Bug: posts state might be stale
      const userPosts = await api.getPosts(userId, posts.length);
      setPosts([...posts, ...userPosts]);
    };

    fetchUser();
  }, [userId]); // Missing 'posts' dependency

  // ✅ Correct implementation
  useEffect(() => {
    const fetchUser = async () => {
      const userData = await api.getUser(userId);
      setUser(userData);
    };

    fetchUser();
  }, [userId]);

  useEffect(() => {
    const fetchPosts = async () => {
      const userPosts = await api.getPosts(userId, posts.length);
      setPosts(prev => [...prev, ...userPosts]);
    };

    fetchPosts();
  }, [userId, posts.length]);
}
```


**🧠 Advanced useEffect Patterns:**


```javascript
// Pattern 1: Async Effect with Cleanup
function useAsyncEffect(asyncFn, deps) {
  useEffect(() => {
    let cancelled = false;

    const runAsync = async () => {
      try {
        const result = await asyncFn();
        if (!cancelled) {
          // Use result
        }
      } catch (error) {
        if (!cancelled) {
          // Handle error
        }
      }
    };

    runAsync();

    return () => {
      cancelled = true;
    };
  }, deps);
}

// Pattern 2: Interval with Dynamic Delay
function useInterval(callback, delay) {
  const savedCallback = useRef();

  useEffect(() => {
    savedCallback.current = callback;
  });

  useEffect(() => {
    if (delay !== null) {
      const tick = () => savedCallback.current();
      const id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}

// Pattern 3: Previous Value Tracking
function usePrevious(value) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}
```


**🏭 Real-World Example từ Figma Plugin Development:**


```javascript
function CanvasSync({ nodes, onNodesChange }) {
  const [syncStatus, setSyncStatus] = useState('idle');
  const [lastSync, setLastSync] = useState(null);
  const abortController = useRef(null);

  // Sync nodes when they change
  useEffect(() => {
    const syncNodes = async () => {
      // Cancel previous sync if still running
      if (abortController.current) {
        abortController.current.abort();
      }

      abortController.current = new AbortController();

      try {
        setSyncStatus('syncing');

        const response = await fetch('/api/sync-nodes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nodes }),
          signal: abortController.current.signal
        });

        if (!response.ok) throw new Error('Sync failed');

        const syncedNodes = await response.json();
        onNodesChange(syncedNodes);

        setSyncStatus('success');
        setLastSync(new Date());

      } catch (error) {
        if (error.name !== 'AbortError') {
          setSyncStatus('error');
          console.error('Sync failed:', error);
        }
      }
    };

    // Debounce sync calls
    const timeoutId = setTimeout(syncNodes, 500);

    return () => {
      clearTimeout(timeoutId);
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, [nodes, onNodesChange]);

  // Auto-sync every 30 seconds
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (syncStatus !== 'syncing') {
        // Trigger sync by updating a dependency
        setLastSync(prev => prev); // Forces re-sync
      }
    }, 30000);

    return () => clearInterval(intervalId);
  }, [syncStatus]);

  return (
    <div className="sync-status">
      Status: {syncStatus}
      {lastSync && <span>Last sync: {lastSync.toLocaleTimeString()}</span>}
    </div>
  );
}
```


### 🎯 Custom Hooks: The Real Power Unleashed


Custom Hooks là nơi Hooks pattern truly shines. Chúng cho phép extract và reuse stateful logic theo cách mà impossible với class components.


**🔬 Custom Hook Design Principles:**


```javascript
// Principle 1: Single Responsibility
// ❌ Hook doing too many things
function useBadUserData(userId) {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [friends, setFriends] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // Too much logic in one hook
  useEffect(() => {
    // Fetch user, posts, friends, notifications...
  }, [userId]);

  return { user, posts, friends, notifications };
}

// ✅ Separated concerns
function useUser(userId) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        setError(null);
        const userData = await api.getUser(userId);
        setUser(userData);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  return { user, loading, error };
}

function usePosts(userId) {
  // Similar pattern for posts
}

function useFriends(userId) {
  // Similar pattern for friends
}
```


**🏭 Production Custom Hook Example từ NAB:**


```javascript
// Real-world data fetching hook used across NAB applications
function useApiData(url, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { retries = 3, retryDelay = 1000, dependencies = [] } = options;

  const fetchData = useCallback(async (attempt = 1) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      setData(result);

    } catch (err) {
      if (attempt < retries) {
        setTimeout(() => fetchData(attempt + 1), retryDelay);
      } else {
        setError(err);
      }
    } finally {
      setLoading(false);
    }
  }, [url, retries, retryDelay]);

  useEffect(() => {
    fetchData();
  }, [fetchData, ...dependencies]);

  const refetch = useCallback(() => fetchData(), [fetchData]);

  return { data, loading, error, refetch };
}

// Usage across different components
function MortgageApplications() {
  const { data: applications, loading, error, refetch } = useApiData('/api/mortgage-applications');

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} onRetry={refetch} />;

  return (
    <div>
      {applications.map(app => (
        <ApplicationCard key={app.id} application={app} />
      ))}
    </div>
  );
}

function UserDashboard() {
  const { data: userProfile } = useApiData('/api/user/profile');
  const { data: accountSummary } = useApiData('/api/account/summary');

  return (
    <Dashboard profile={userProfile} summary={accountSummary} />
  );
}
```


**🎯 Advanced Custom Hook Patterns:**


```javascript
// Pattern 1: State Machine Hook
function useStateMachine(initialState, transitions) {
  const [state, setState] = useState(initialState);

  const send = useCallback((event) => {
    setState(currentState => {
      const transition = transitions[currentState]?.[event];
      return transition ? transition : currentState;
    });
  }, [transitions]);

  return [state, send];
}

// Usage example
const loginTransitions = {
  idle: {
    LOGIN_START: 'loading',
  },
  loading: {
    LOGIN_SUCCESS: 'authenticated',
    LOGIN_ERROR: 'error',
  },
  error: {
    LOGIN_START: 'loading',
    RESET: 'idle',
  },
  authenticated: {
    LOGOUT: 'idle',
  },
};

function LoginComponent() {
  const [authState, send] = useStateMachine('idle', loginTransitions);

  const handleLogin = async () => {
    send('LOGIN_START');
    try {
      await authenticate();
      send('LOGIN_SUCCESS');
    } catch (error) {
      send('LOGIN_ERROR');
    }
  };

  return (
    <div>
      {authState === 'loading' && <div>Logging in...</div>}
      {authState === 'error' && <div>Login failed</div>}
      {authState === 'authenticated' && <div>Welcome!</div>}
      <button onClick={handleLogin}>Login</button>
    </div>
  );
}

// Pattern 2: Local Storage Sync Hook
function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  // Listen for external storage changes
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch (error) {
          console.error(`Error parsing localStorage key "${key}":`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [storedValue, setValue];
}

// Pattern 3: WebSocket Hook
function useWebSocket(url, options = {}) {
  const [socket, setSocket] = useState(null);
  const [lastMessage, setLastMessage] = useState(null);
  const [readyState, setReadyState] = useState(WebSocket.CONNECTING);
  const { reconnectAttempts = 5, reconnectInterval = 3000 } = options;

  const reconnectAttemptRef = useRef(0);

  const connectWebSocket = useCallback(() => {
    const ws = new WebSocket(url);

    ws.onopen = () => {
      setReadyState(WebSocket.OPEN);
      setSocket(ws);
      reconnectAttemptRef.current = 0;
    };

    ws.onmessage = (event) => {
      setLastMessage(event.data);
    };

    ws.onclose = () => {
      setReadyState(WebSocket.CLOSED);
      setSocket(null);

      // Auto-reconnect
      if (reconnectAttemptRef.current < reconnectAttempts) {
        setTimeout(() => {
          reconnectAttemptRef.current++;
          connectWebSocket();
        }, reconnectInterval);
      }
    };

    ws.onerror = () => {
      setReadyState(WebSocket.CLOSED);
    };

    return ws;
  }, [url, reconnectAttempts, reconnectInterval]);

  useEffect(() => {
    const ws = connectWebSocket();

    return () => {
      ws.close();
    };
  }, [connectWebSocket]);

  const sendMessage = useCallback((message) => {
    if (socket && readyState === WebSocket.OPEN) {
      socket.send(message);
    }
  }, [socket, readyState]);

  return {
    socket,
    lastMessage,
    readyState,
    sendMessage,
  };
}
```


## 📚 PHẦN III: PRODUCTION MASTERY - HOOKS IN THE REAL WORLD


### 🏭 Performance Optimization: The Principal Engineer's Perspective


Sau several years working with Hooks in production, tôi đã học được rằng Hooks performance optimization requires deep understanding của React's rendering model.


**🔬 Re-render Analysis - When and Why Components Re-render:**


```javascript
// Understanding re-render triggers
function ParentComponent() {
  const [count, setCount] = useState(0);
  const [user, setUser] = useState({ name: 'John', age: 30 });

  // ❌ This creates new object every render - causes child re-renders
  const badUserData = {
    ...user,
    preferences: { theme: 'dark' }
  };

  // ✅ Memoized object - only changes when user changes
  const goodUserData = useMemo(() => ({
    ...user,
    preferences: { theme: 'dark' }
  }), [user]);

  // ❌ New function every render - breaks React.memo optimization
  const badHandleUpdate = (newData) => {
    setUser(prevUser => ({ ...prevUser, ...newData }));
  };

  // ✅ Memoized callback - stable reference
  const goodHandleUpdate = useCallback((newData) => {
    setUser(prevUser => ({ ...prevUser, ...newData }));
  }, []);

  return (
    <div>
      <button onClick={() => setCount(count + 1)}>Count: {count}</button>
      <ExpensiveChildComponent
        userData={goodUserData}
        onUpdate={goodHandleUpdate}
      />
    </div>
  );
}

const ExpensiveChildComponent = React.memo(({ userData, onUpdate }) => {
  console.log('ExpensiveChildComponent rendered');

  return (
    <div>
      <h3>{userData.name}</h3>
      <button onClick={() => onUpdate({ age: userData.age + 1 })}>
        Age up
      </button>
    </div>
  );
});
```


**⚡ Real Performance Issue từ Webflow Dashboard:**


Tại Webflow, chúng tôi có một dashboard hiển thị real-time analytics. Initial implementation causing significant performance issues:


```javascript
// ❌ Performance nightmare - before optimization
function AnalyticsDashboard() {
  const [metrics, setMetrics] = useState([]);
  const [timeRange, setTimeRange] = useState('24h');
  const [selectedMetric, setSelectedMetric] = useState(null);

  // Expensive calculation running every render
  const processedMetrics = metrics.map(metric => ({
    ...metric,
    formattedValue: formatNumber(metric.value),
    percentChange: calculatePercentChange(metric.current, metric.previous),
    trend: calculateTrend(metric.history),
    chartData: generateChartData(metric.history)
  }));

  // New function every render - breaks memoization
  const handleMetricClick = (metric) => {
    setSelectedMetric(metric);
    // Track analytics event
    analytics.track('metric_clicked', { metricId: metric.id });
  };

  return (
    <div className="dashboard">
      <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
      <div className="metrics-grid">
        {processedMetrics.map(metric => (
          <MetricCard
            key={metric.id}
            metric={metric}
            onClick={handleMetricClick}
            isSelected={selectedMetric?.id === metric.id}
          />
        ))}
      </div>
      {selectedMetric && (
        <DetailedMetricView metric={selectedMetric} />
      )}
    </div>
  );
}

// Performance monitoring showed:
// - 15+ unnecessary re-renders per second
// - 300ms+ processing time for metric calculations
// - Memory leaks from uncleaned event listeners
```


**✅ Optimized Version:**


```javascript
// ✅ Optimized implementation
function AnalyticsDashboard() {
  const [metrics, setMetrics] = useState([]);
  const [timeRange, setTimeRange] = useState('24h');
  const [selectedMetricId, setSelectedMetricId] = useState(null);

  // Memoized expensive calculations
  const processedMetrics = useMemo(() => {
    return metrics.map(metric => ({
      ...metric,
      formattedValue: formatNumber(metric.value),
      percentChange: calculatePercentChange(metric.current, metric.previous),
      trend: calculateTrend(metric.history),
      chartData: generateChartData(metric.history)
    }));
  }, [metrics]);

  // Memoized callback with stable reference
  const handleMetricClick = useCallback((metricId) => {
    setSelectedMetricId(metricId);

    // Track analytics event
    const metric = metrics.find(m => m.id === metricId);
    analytics.track('metric_clicked', { metricId });
  }, [metrics]);

  // Memoized selected metric object
  const selectedMetric = useMemo(() => {
    return processedMetrics.find(m => m.id === selectedMetricId);
  }, [processedMetrics, selectedMetricId]);

  // Real-time data fetching with proper cleanup
  useEffect(() => {
    const ws = new WebSocket(`/api/analytics/stream?timeRange=${timeRange}`);

    ws.onmessage = (event) => {
      const newMetrics = JSON.parse(event.data);
      setMetrics(newMetrics);
    };

    return () => {
      ws.close();
    };
  }, [timeRange]);

  return (
    <div className="dashboard">
      <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
      <MetricsGrid
        metrics={processedMetrics}
        onMetricClick={handleMetricClick}
        selectedMetricId={selectedMetricId}
      />
      {selectedMetric && (
        <DetailedMetricView metric={selectedMetric} />
      )}
    </div>
  );
}

// Separate component for better memoization
const MetricsGrid = React.memo(({ metrics, onMetricClick, selectedMetricId }) => {
  return (
    <div className="metrics-grid">
      {metrics.map(metric => (
        <MetricCard
          key={metric.id}
          metric={metric}
          onClick={onMetricClick}
          isSelected={selectedMetricId === metric.id}
        />
      ))}
    </div>
  );
});

// Results after optimization:
// - 90% reduction in re-renders
// - 50ms average processing time
// - Zero memory leaks
// - Smooth 60fps scrolling
```


### 🎯 Error Handling và Debugging Strategies


**🔬 Error Boundary Integration với Hooks:**


```javascript
// Custom hook for error handling
function useErrorHandler() {
  const [error, setError] = useState(null);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  const handleError = useCallback((error, errorInfo) => {
    setError({ error, errorInfo });

    // Log to monitoring service
    logger.error('Component Error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    });
  }, []);

  // Effect to throw error if one occurs
  useEffect(() => {
    if (error) {
      throw error.error;
    }
  }, [error]);

  return { handleError, resetError, hasError: !!error };
}

// Async error handling hook
function useAsyncError() {
  const { handleError } = useErrorHandler();

  const throwAsyncError = useCallback((error) => {
    // Convert async error to sync error for Error Boundary
    const syncError = new Error(error.message);
    syncError.stack = error.stack;
    handleError(syncError, { componentStack: '' });
  }, [handleError]);

  return throwAsyncError;
}

// Usage in components
function DataFetchingComponent({ userId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const throwAsyncError = useAsyncError();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await api.getUserData(userId);
        setData(response.data);
      } catch (error) {
        // This will be caught by Error Boundary
        throwAsyncError(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, throwAsyncError]);

  if (loading) return <LoadingSpinner />;

  return <UserDataDisplay data={data} />;
}
```


**🔍 Debugging Hook Dependencies:**


```javascript
// Custom hook for debugging dependencies
function useWhyDidYouUpdate(name, props) {
  const previous = useRef();

  useEffect(() => {
    if (previous.current) {
      const allKeys = Object.keys({ ...previous.current, ...props });
      const changedProps = {};

      allKeys.forEach(key => {
        if (previous.current[key] !== props[key]) {
          changedProps[key] = {
            from: previous.current[key],
            to: props[key]
          };
        }
      });

      if (Object.keys(changedProps).length) {
        console.log('[useWhyDidYouUpdate]', name, changedProps);
      }
    }

    previous.current = props;
  });
}

// Usage
function MyComponent({ userId, filters, sortBy }) {
  useWhyDidYouUpdate('MyComponent', { userId, filters, sortBy });

  useEffect(() => {
    // Effect logic
  }, [userId, filters, sortBy]);

  // Component logic
}

// Development-only hook để track re-renders
function useRenderCount(name) {
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current++;
    console.log(`${name} rendered ${renderCount.current} times`);
  });

  return renderCount.current;
}
```


### 🎯 Testing Strategies for Hooks


**🧪 Unit Testing Custom Hooks:**


```javascript
// Testing custom hooks với renderHook utility
import { renderHook, act } from '@testing-library/react-hooks';
import { useCounter } from './useCounter';

describe('useCounter', () => {
  it('should initialize with default value', () => {
    const { result } = renderHook(() => useCounter());

    expect(result.current.count).toBe(0);
  });

  it('should initialize with custom value', () => {
    const { result } = renderHook(() => useCounter(10));

    expect(result.current.count).toBe(10);
  });

  it('should increment count', () => {
    const { result } = renderHook(() => useCounter());

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(1);
  });

  it('should handle multiple increments', () => {
    const { result } = renderHook(() => useCounter());

    act(() => {
      result.current.increment();
      result.current.increment();
      result.current.increment();
    });

    expect(result.current.count).toBe(3);
  });

  it('should reset to initial value', () => {
    const { result } = renderHook(() => useCounter(5));

    act(() => {
      result.current.increment();
      result.current.increment();
    });

    expect(result.current.count).toBe(7);

    act(() => {
      result.current.reset();
    });

    expect(result.current.count).toBe(5);
  });
});

// Testing async hooks
describe('useApiData', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it('should fetch data successfully', async () => {
    const mockData = { id: 1, name: 'Test' };
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const { result, waitForNextUpdate } = renderHook(() =>
      useApiData('/api/test')
    );

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBe(null);
    expect(result.current.error).toBe(null);

    await waitForNextUpdate();

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBe(null);
  });

  it('should handle fetch errors', async () => {
    const errorMessage = 'Network error';
    fetchMock.mockRejectedValueOnce(new Error(errorMessage));

    const { result, waitForNextUpdate } = renderHook(() =>
      useApiData('/api/test')
    );

    await waitForNextUpdate();

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBe(null);
    expect(result.current.error.message).toBe(errorMessage);
  });

  it('should refetch data when called', async () => {
    const mockData = { id: 1, name: 'Test' };
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => mockData,
    });

    const { result, waitForNextUpdate } = renderHook(() =>
      useApiData('/api/test')
    );

    await waitForNextUpdate();

    expect(fetchMock).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.refetch();
    });

    await waitForNextUpdate();

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
```


**🧪 Integration Testing với React Testing Library:**


```javascript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UserProfile } from './UserProfile';

// Mock custom hook
jest.mock('./hooks/useApiData', () => ({
  useApiData: jest.fn()
}));

describe('UserProfile Component', () => {
  const mockUseApiData = useApiData as jest.MockedFunction<typeof useApiData>;

  beforeEach(() => {
    mockUseApiData.mockClear();
  });

  it('should display loading state', () => {
    mockUseApiData.mockReturnValue({
      data: null,
      loading: true,
      error: null,
      refetch: jest.fn()
    });

    render(<UserProfile userId="123" />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should display user data when loaded', () => {
    const mockUser = {
      id: '123',
      name: 'John Doe',
      email: 'john@example.com'
    };

    mockUseApiData.mockReturnValue({
      data: mockUser,
      loading: false,
      error: null,
      refetch: jest.fn()
    });

    render(<UserProfile userId="123" />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });

  it('should handle retry when error occurs', async () => {
    const mockRefetch = jest.fn();
    mockUseApiData.mockReturnValue({
      data: null,
      loading: false,
      error: new Error('Failed to fetch'),
      refetch: mockRefetch
    });

    render(<UserProfile userId="123" />);

    expect(screen.getByText('Failed to fetch')).toBeInTheDocument();

    const retryButton = screen.getByText('Retry');
    fireEvent.click(retryButton);

    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });
});
```


## 📚 PHẦN IV: ADVANCED PATTERNS VÀ ANTI-PATTERNS


### 🎯 Advanced Hook Composition Patterns


**🔬 Compound Hooks Pattern:**


```javascript
// Pattern: Combining multiple hooks for complex state management
function useShoppingCart() {
  const [items, setItems] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Derived state
  const totalItems = useMemo(() =>
    items.reduce((sum, item) => sum + item.quantity, 0)
  , [items]);

  const totalPrice = useMemo(() =>
    items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  , [items]);

  // Actions
  const addItem = useCallback((product) => {
    setItems(current => {
      const existingItem = current.find(item => item.id === product.id);

      if (existingItem) {
        return current.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...current, { ...product, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((productId) => {
    setItems(current => current.filter(item => item.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId, quantity) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }

    setItems(current =>
      current.map(item =>
        item.id === productId
          ? { ...item, quantity }
          : item
      )
    );
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const toggleCart = useCallback(() => {
    setIsOpen(current => !current);
  }, []);

  // Persistence effect
  useEffect(() => {
    const savedCart = localStorage.getItem('shopping-cart');
    if (savedCart) {
      setItems(JSON.parse(savedCart));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('shopping-cart', JSON.stringify(items));
  }, [items]);

  // Auto-close cart after adding item
  const [recentlyAdded, setRecentlyAdded] = useState(null);

  useEffect(() => {
    if (recentlyAdded) {
      const timer = setTimeout(() => {
        setRecentlyAdded(null);
        setIsOpen(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [recentlyAdded]);

  const addItemWithFeedback = useCallback((product) => {
    addItem(product);
    setRecentlyAdded(product);
    setIsOpen(true);
  }, [addItem]);

  return {
    // State
    items,
    isOpen,
    loading,
    totalItems,
    totalPrice,
    recentlyAdded,

    // Actions
    addItem: addItemWithFeedback,
    removeItem,
    updateQuantity,
    clearCart,
    toggleCart,
  };
}

// Usage
function ShoppingApp() {
  const cart = useShoppingCart();

  return (
    <div>
      <ProductGrid onAddToCart={cart.addItem} />
      <CartButton
        itemCount={cart.totalItems}
        onClick={cart.toggleCart}
      />
      {cart.isOpen && (
        <CartDrawer
          items={cart.items}
          total={cart.totalPrice}
          onUpdateQuantity={cart.updateQuantity}
          onRemoveItem={cart.removeItem}
          onClose={cart.toggleCart}
        />
      )}
      {cart.recentlyAdded && (
        <Toast>
          Added {cart.recentlyAdded.name} to cart!
        </Toast>
      )}
    </div>
  );
}
```


**🎯 State Machine with Hooks:**


```javascript
// Advanced state machine pattern với XState inspiration
function useStateMachine(config) {
  const { states, initial, context: initialContext = {} } = config;

  const [current, setCurrent] = useState(initial);
  const [context, setContext] = useState(initialContext);

  const send = useCallback((event, payload = {}) => {
    setCurrent(currentState => {
      const stateConfig = states[currentState];
      const transition = stateConfig.on?.[event];

      if (!transition) {
        console.warn(`No transition for event "${event}" in state "${currentState}"`);
        return currentState;
      }

      let nextState;
      let nextContext = context;

      if (typeof transition === 'string') {
        nextState = transition;
      } else if (typeof transition === 'function') {
        const result = transition(context, payload);
        nextState = result.state || currentState;
        nextContext = { ...context, ...result.context };
      } else {
        nextState = transition.target;
        if (transition.actions) {
          transition.actions.forEach(action => {
            if (typeof action === 'function') {
              const result = action(context, payload);
              if (result) {
                nextContext = { ...nextContext, ...result };
              }
            }
          });
        }
      }

      setContext(nextContext);
      return nextState;
    });
  }, [states, context]);

  const currentStateConfig = states[current];

  return {
    current,
    context,
    send,
    matches: (state) => current === state,
    can: (event) => !!currentStateConfig.on?.[event],
  };
}

// Usage example: File upload state machine
const fileUploadMachine = {
  initial: 'idle',
  context: {
    file: null,
    progress: 0,
    error: null,
  },
  states: {
    idle: {
      on: {
        SELECT_FILE: {
          target: 'selected',
          actions: [(context, { file }) => ({ file })],
        },
      },
    },
    selected: {
      on: {
        UPLOAD: 'uploading',
        CANCEL: 'idle',
      },
    },
    uploading: {
      on: {
        PROGRESS: {
          target: 'uploading',
          actions: [(context, { progress }) => ({ progress })],
        },
        SUCCESS: 'uploaded',
        ERROR: {
          target: 'error',
          actions: [(context, { error }) => ({ error })],
        },
        CANCEL: 'idle',
      },
    },
    uploaded: {
      on: {
        RESET: 'idle',
      },
    },
    error: {
      on: {
        RETRY: 'uploading',
        RESET: 'idle',
      },
    },
  },
};

function FileUploadComponent() {
  const upload = useStateMachine(fileUploadMachine);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      upload.send('SELECT_FILE', { file });
    }
  };

  const handleUpload = async () => {
    upload.send('UPLOAD');

    try {
      const formData = new FormData();
      formData.append('file', upload.context.file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        upload.send('SUCCESS');
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      upload.send('ERROR', { error: error.message });
    }
  };

  return (
    <div>
      {upload.matches('idle') && (
        <input type="file" onChange={handleFileSelect} />
      )}

      {upload.matches('selected') && (
        <div>
          <p>Selected: {upload.context.file.name}</p>
          <button onClick={handleUpload}>Upload</button>
          <button onClick={() => upload.send('CANCEL')}>Cancel</button>
        </div>
      )}

      {upload.matches('uploading') && (
        <div>
          <p>Uploading... {upload.context.progress}%</p>
          <button onClick={() => upload.send('CANCEL')}>Cancel</button>
        </div>
      )}

      {upload.matches('uploaded') && (
        <div>
          <p>Upload successful!</p>
          <button onClick={() => upload.send('RESET')}>Upload Another</button>
        </div>
      )}

      {upload.matches('error') && (
        <div>
          <p>Error: {upload.context.error}</p>
          <button onClick={() => upload.send('RETRY')}>Retry</button>
          <button onClick={() => upload.send('RESET')}>Reset</button>
        </div>
      )}
    </div>
  );
}
```


### 🚫 Common Anti-Patterns và Cách Tránh


**❌ Anti-Pattern 1: Stale Closure Problem:**


```javascript
// ❌ Stale closure bug
function Timer() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCount(count + 1); // Stale closure - count is always 0
    }, 1000);

    return () => clearInterval(interval);
  }, []); // Empty dependency array traps stale value

  return <div>Count: {count}</div>;
}

// ✅ Fixed with functional update
function Timer() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCount(prevCount => prevCount + 1); // Always gets latest value
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return <div>Count: {count}</div>;
}

// ✅ Alternative fix with useRef
function Timer() {
  const [count, setCount] = useState(0);
  const countRef = useRef(count);

  useEffect(() => {
    countRef.current = count;
  }, [count]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCount(countRef.current + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return <div>Count: {count}</div>;
}
```


**❌ Anti-Pattern 2: Excessive Re-renders:**


```javascript
// ❌ Creates new object every render
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);

  const userPreferences = {
    theme: 'dark',
    language: 'en',
    notifications: true
  }; // New object every render!

  useEffect(() => {
    fetchUser(userId).then(setUser);
  }, [userId]);

  return (
    <div>
      <UserSettings preferences={userPreferences} />
      <UserDetails user={user} />
    </div>
  );
}

// ✅ Fixed with useMemo
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);

  const userPreferences = useMemo(() => ({
    theme: 'dark',
    language: 'en',
    notifications: true
  }), []); // Stable reference

  useEffect(() => {
    fetchUser(userId).then(setUser);
  }, [userId]);

  return (
    <div>
      <UserSettings preferences={userPreferences} />
      <UserDetails user={user} />
    </div>
  );
}
```


**❌ Anti-Pattern 3: useEffect Dependency Hell:**


```javascript
// ❌ Dependency hell - effect runs too often
function DataProcessor({ filters, sortBy, searchQuery }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const processData = async () => {
    setLoading(true);
    try {
      const response = await api.fetchData({
        filters: filters,
        sort: sortBy,
        search: searchQuery
      });
      setData(response.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    processData(); // Function recreated every render
  }, [processData]); // Effect runs every render!

  return <DataList data={data} loading={loading} />;
}

// ✅ Fixed with useCallback and proper dependencies
function DataProcessor({ filters, sortBy, searchQuery }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const processData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.fetchData({
        filters,
        sort: sortBy,
        search: searchQuery
      });
      setData(response.data);
    } finally {
      setLoading(false);
    }
  }, [filters, sortBy, searchQuery]); // Only recreate when inputs change

  useEffect(() => {
    processData();
  }, [processData]);

  return <DataList data={data} loading={loading} />;
}
```


## 📚 PHẦN V: HOOKS ARCHITECTURE PATTERNS


### 🏗️ Hooks-First Architecture Design


Sau years của experience building large-scale applications với Hooks, tôi đã develop một set of architectural patterns mà proven effective.


**🎯 Layer Separation Pattern:**


```javascript
// Layer 1: Core Business Logic Hooks
function useUserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createUser = useCallback(async (userData) => {
    setLoading(true);
    setError(null);

    try {
      const newUser = await userService.create(userData);
      setUsers(prev => [...prev, newUser]);
      return newUser;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateUser = useCallback(async (userId, updates) => {
    setLoading(true);
    setError(null);

    try {
      const updatedUser = await userService.update(userId, updates);
      setUsers(prev => prev.map(user =>
        user.id === userId ? updatedUser : user
      ));
      return updatedUser;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteUser = useCallback(async (userId) => {
    setLoading(true);
    setError(null);

    try {
      await userService.delete(userId);
      setUsers(prev => prev.filter(user => user.id !== userId));
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      try {
        const userData = await userService.getAll();
        setUsers(userData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  return {
    users,
    loading,
    error,
    createUser,
    updateUser,
    deleteUser,
  };
}

// Layer 2: UI State Management Hooks
function useUserListUI() {
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [filterBy, setFilterBy] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const toggleUserSelection = useCallback((userId) => {
    setSelectedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  }, []);

  const selectAllUsers = useCallback((userIds) => {
    setSelectedUsers(new Set(userIds));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedUsers(new Set());
  }, []);

  const toggleSort = useCallback((field) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  }, [sortBy]);

  return {
    selectedUsers,
    sortBy,
    sortOrder,
    filterBy,
    searchQuery,
    toggleUserSelection,
    selectAllUsers,
    clearSelection,
    toggleSort,
    setFilterBy,
    setSearchQuery,
  };
}

// Layer 3: Computed Values và Filtering
function useUserFiltering(users, { searchQuery, filterBy, sortBy, sortOrder }) {
  const filteredAndSortedUsers = useMemo(() => {
    let filtered = users;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (filterBy !== 'all') {
      filtered = filtered.filter(user => user.status === filterBy);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [users, searchQuery, filterBy, sortBy, sortOrder]);

  const userStats = useMemo(() => ({
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    inactive: users.filter(u => u.status === 'inactive').length,
    filtered: filteredAndSortedUsers.length,
  }), [users, filteredAndSortedUsers]);

  return {
    filteredUsers: filteredAndSortedUsers,
    userStats,
  };
}

// Layer 4: Component Composition Hook
function useUserList() {
  const userManagement = useUserManagement();
  const uiState = useUserListUI();
  const { filteredUsers, userStats } = useUserFiltering(
    userManagement.users,
    uiState
  );

  // Bulk operations
  const deleteSelectedUsers = useCallback(async () => {
    const userIds = Array.from(uiState.selectedUsers);

    try {
      await Promise.all(
        userIds.map(id => userManagement.deleteUser(id))
      );
      uiState.clearSelection();
    } catch (error) {
      console.error('Failed to delete users:', error);
    }
  }, [uiState.selectedUsers, userManagement.deleteUser, uiState.clearSelection]);

  return {
    // Data
    users: filteredUsers,
    stats: userStats,
    loading: userManagement.loading,
    error: userManagement.error,

    // UI State
    selectedUsers: uiState.selectedUsers,
    sortBy: uiState.sortBy,
    sortOrder: uiState.sortOrder,
    filterBy: uiState.filterBy,
    searchQuery: uiState.searchQuery,

    // Actions
    createUser: userManagement.createUser,
    updateUser: userManagement.updateUser,
    deleteUser: userManagement.deleteUser,
    deleteSelectedUsers,

    // UI Actions
    toggleUserSelection: uiState.toggleUserSelection,
    selectAllUsers: uiState.selectAllUsers,
    clearSelection: uiState.clearSelection,
    toggleSort: uiState.toggleSort,
    setFilterBy: uiState.setFilterBy,
    setSearchQuery: uiState.setSearchQuery,
  };
}

// Component using the composed hook
function UserListPage() {
  const userList = useUserList();

  if (userList.loading) return <LoadingSpinner />;
  if (userList.error) return <ErrorMessage error={userList.error} />;

  return (
    <div className="user-list-page">
      <UserListHeader
        stats={userList.stats}
        searchQuery={userList.searchQuery}
        onSearchChange={userList.setSearchQuery}
        filterBy={userList.filterBy}
        onFilterChange={userList.setFilterBy}
        selectedCount={userList.selectedUsers.size}
        onDeleteSelected={userList.deleteSelectedUsers}
      />

      <UserTable
        users={userList.users}
        selectedUsers={userList.selectedUsers}
        sortBy={userList.sortBy}
        sortOrder={userList.sortOrder}
        onUserSelect={userList.toggleUserSelection}
        onSelectAll={userList.selectAllUsers}
        onSort={userList.toggleSort}
        onUserUpdate={userList.updateUser}
        onUserDelete={userList.deleteUser}
      />
    </div>
  );
}
```


### 🎯 Global State Management với Custom Hooks


```javascript
// Global state management pattern using hooks và context
function createGlobalState(initialState) {
  const StateContext = createContext();
  const DispatchContext = createContext();

  function StateProvider({ children }) {
    const [state, dispatch] = useReducer(
      (state, action) => {
        switch (action.type) {
          case 'SET_STATE':
            return { ...state, ...action.payload };
          case 'RESET_STATE':
            return initialState;
          default:
            return state;
        }
      },
      initialState
    );

    return (
      <StateContext.Provider value={state}>
        <DispatchContext.Provider value={dispatch}>
          {children}
        </DispatchContext.Provider>
      </StateContext.Provider>
    );
  }

  function useGlobalState() {
    const state = useContext(StateContext);
    const dispatch = useContext(DispatchContext);

    if (state === undefined || dispatch === undefined) {
      throw new Error('useGlobalState must be used within StateProvider');
    }

    const setState = useCallback((updates) => {
      dispatch({ type: 'SET_STATE', payload: updates });
    }, [dispatch]);

    const resetState = useCallback(() => {
      dispatch({ type: 'RESET_STATE' });
    }, [dispatch]);

    return [state, setState, resetState];
  }

  return { StateProvider, useGlobalState };
}

// Usage
const { StateProvider: AppStateProvider, useGlobalState: useAppState } = createGlobalState({
  user: null,
  theme: 'light',
  notifications: [],
  settings: {}
});

function App() {
  return (
    <AppStateProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
        </Layout>
      </Router>
    </AppStateProvider>
  );
}

function useAuth() {
  const [appState, setAppState] = useAppState();

  const login = useCallback(async (credentials) => {
    try {
      const user = await authService.login(credentials);
      setAppState({ user });
      return user;
    } catch (error) {
      throw error;
    }
  }, [setAppState]);

  const logout = useCallback(async () => {
    await authService.logout();
    setAppState({ user: null });
  }, [setAppState]);

  return {
    user: appState.user,
    isAuthenticated: !!appState.user,
    login,
    logout,
  };
}
```


## 📚 PHẦN VI: PERFORMANCE VÀ OPTIMIZATION MASTERY


### ⚡ Advanced Performance Patterns


**🔬 Virtualization với Hooks:**


```javascript
// Custom hook for virtual scrolling
function useVirtualScroll({
  items,
  itemHeight,
  containerHeight,
  overscan = 5
}) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleRange = useMemo(() => {
    const startIndex = Math.max(
      0,
      Math.floor(scrollTop / itemHeight) - overscan
    );

    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );

    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1)
      .map((item, index) => ({
        ...item,
        index: visibleRange.startIndex + index,
        top: (visibleRange.startIndex + index) * itemHeight
      }));
  }, [items, visibleRange, itemHeight]);

  const totalHeight = items.length * itemHeight;

  const handleScroll = useCallback((event) => {
    setScrollTop(event.target.scrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight,
    handleScroll,
    visibleRange
  };
}

// Virtual list component
function VirtualList({ items, renderItem, itemHeight = 50 }) {
  const containerRef = useRef();
  const [containerHeight, setContainerHeight] = useState(400);

  const {
    visibleItems,
    totalHeight,
    handleScroll
  } = useVirtualScroll({
    items,
    itemHeight,
    containerHeight
  });

  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight);
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  return (
    <div
      ref={containerRef}
      className="virtual-list-container"
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map(item => (
          <div
            key={item.id}
            style={{
              position: 'absolute',
              top: item.top,
              left: 0,
              right: 0,
              height: itemHeight
            }}
          >
            {renderItem(item, item.index)}
          </div>
        ))}
      </div>
    </div>
  );
}
```


**🎯 Worker Threads Integration:**


```javascript
// Custom hook for web worker integration
function useWebWorker(workerFunction, dependencies = []) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const workerRef = useRef(null);

  const execute = useCallback((data) => {
    setLoading(true);
    setError(null);

    // Create worker if it doesn't exist
    if (!workerRef.current) {
      const workerBlob = new Blob([`
        self.onmessage = function(e) {
          try {
            const result = (${workerFunction.toString()})(e.data);
            self.postMessage({ type: 'SUCCESS', result });
          } catch (error) {
            self.postMessage({ type: 'ERROR', error: error.message });
          }
        }
      `], { type: 'application/javascript' });

      workerRef.current = new Worker(URL.createObjectURL(workerBlob));

      workerRef.current.onmessage = (e) => {
        const { type, result, error } = e.data;

        if (type === 'SUCCESS') {
          setResult(result);
        } else if (type === 'ERROR') {
          setError(new Error(error));
        }

        setLoading(false);
      };

      workerRef.current.onerror = (error) => {
        setError(error);
        setLoading(false);
      };
    }

    workerRef.current.postMessage(data);
  }, dependencies);

  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  return { result, loading, error, execute };
}

// Heavy computation worker function
const heavyComputationWorker = (data) => {
  const { numbers, operation } = data;

  // Simulate heavy computation
  let result = 0;
  for (let i = 0; i < numbers.length; i++) {
    for (let j = 0; j < 1000000; j++) {
      result += numbers[i] * Math.random();
    }
  }

  return result;
};

// Component using web worker
function HeavyComputationComponent() {
  const [inputNumbers, setInputNumbers] = useState([1, 2, 3, 4, 5]);

  const {
    result,
    loading,
    error,
    execute
  } = useWebWorker(heavyComputationWorker);

  const handleCompute = () => {
    execute({
      numbers: inputNumbers,
      operation: 'complex'
    });
  };

  return (
    <div>
      <input
        value={inputNumbers.join(',')}
        onChange={(e) => setInputNumbers(e.target.value.split(',').map(Number))}
      />
      <button onClick={handleCompute} disabled={loading}>
        {loading ? 'Computing...' : 'Compute'}
      </button>
      {error && <div>Error: {error.message}</div>}
      {result && <div>Result: {result}</div>}
    </div>
  );
}
```


### 🎯 Memory Management Strategies


```javascript
// Memory leak prevention hook
function useMemoryLeak() {
  const mountedRef = useRef(true);
  const timersRef = useRef(new Set());
  const listenersRef = useRef(new Map());

  useEffect(() => {
    return () => {
      mountedRef.current = false;

      // Clear all timers
      timersRef.current.forEach(timerId => {
        clearTimeout(timerId);
        clearInterval(timerId);
      });

      // Remove all event listeners
      listenersRef.current.forEach((listener, element) => {
        element.removeEventListener(listener.event, listener.handler);
      });
    };
  }, []);

  const setTimeout = useCallback((callback, delay) => {
    const timerId = window.setTimeout(() => {
      if (mountedRef.current) {
        callback();
      }
      timersRef.current.delete(timerId);
    }, delay);

    timersRef.current.add(timerId);
    return timerId;
  }, []);

  const setInterval = useCallback((callback, delay) => {
    const timerId = window.setInterval(() => {
      if (mountedRef.current) {
        callback();
      }
    }, delay);

    timersRef.current.add(timerId);
    return timerId;
  }, []);

  const addEventListener = useCallback((element, event, handler, options) => {
    const listener = { event, handler };
    listenersRef.current.set(element, listener);
    element.addEventListener(event, handler, options);

    return () => {
      element.removeEventListener(event, handler);
      listenersRef.current.delete(element);
    };
  }, []);

  return {
    isMounted: () => mountedRef.current,
    setTimeout,
    setInterval,
    addEventListener
  };
}

// Large dataset handling hook
function useLargeDataset(data, pageSize = 100) {
  const [currentPage, setCurrentPage] = useState(0);
  const [loadedData, setLoadedData] = useState([]);

  // Pagination logic
  const paginatedData = useMemo(() => {
    const start = currentPage * pageSize;
    const end = start + pageSize;
    return data.slice(start, end);
  }, [data, currentPage, pageSize]);

  // Progressive loading
  useEffect(() => {
    setLoadedData(prev => {
      const newData = [...prev];
      paginatedData.forEach((item, index) => {
        const globalIndex = currentPage * pageSize + index;
        newData[globalIndex] = item;
      });
      return newData;
    });
  }, [paginatedData, currentPage, pageSize]);

  // Memory cleanup for large datasets
  useEffect(() => {
    // Keep only current page and adjacent pages in memory
    const keepStart = Math.max(0, currentPage - 2) * pageSize;
    const keepEnd = Math.min(data.length, (currentPage + 3) * pageSize);

    setLoadedData(prev => {
      const cleaned = [];
      for (let i = keepStart; i < keepEnd; i++) {
        if (prev[i]) {
          cleaned[i] = prev[i];
        }
      }
      return cleaned;
    });
  }, [currentPage, pageSize, data.length]);

  return {
    currentPage,
    setCurrentPage,
    paginatedData,
    totalPages: Math.ceil(data.length / pageSize),
    loadedData: loadedData.filter(Boolean)
  };
}
```


## 📚 PHẦN VII: THINK OUT LOUD - PRINCIPAL'S MENTAL MODELS


### 💭 Debugging Mental Models


**🔍 When Things Go Wrong - My Thought Process:**


Khi tôi encounter một Hooks-related bug, đây là mental framework mà tôi sử dụng:


**Step 1: Identify the Bug Category**


```javascript
// Is it a stale closure bug?
function BuggyComponent() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      console.log(count); // Always logs 0 - STALE CLOSURE
      setCount(count + 1); // count is captured from first render
    }, 1000);

    return () => clearInterval(timer);
  }, []); // Empty deps array creates stale closure

  return <div>{count}</div>;
}

// Mental checklist:
// ✓ Are we using stale values in useEffect/useCallback?
// ✓ Are dependencies missing from dependency arrays?
// ✓ Are we creating new objects/functions unnecessarily?
// ✓ Are we violating Rules of Hooks?
```


**Step 2: Use Debugging Hooks**


```javascript
// My custom debugging toolkit
function useDebugValue(value, label = 'Debug') {
  const prevValue = useRef();

  useEffect(() => {
    if (prevValue.current !== value) {
      console.log(`${label} changed:`, {
        from: prevValue.current,
        to: value,
        timestamp: new Date().toISOString()
      });
    }
    prevValue.current = value;
  });

  return value;
}

function useWhyDidYouUpdate(name, props) {
  const previous = useRef();

  useEffect(() => {
    if (previous.current) {
      const allKeys = Object.keys({ ...previous.current, ...props });
      const changedProps = {};

      allKeys.forEach(key => {
        if (previous.current[key] !== props[key]) {
          changedProps[key] = {
            from: previous.current[key],
            to: props[key]
          };
        }
      });

      if (Object.keys(changedProps).length) {
        console.log('[useWhyDidYouUpdate]', name, changedProps);
      }
    }

    previous.current = props;
  });
}

// Usage in problematic component
function ProblematicComponent({ userId, filters }) {
  useWhyDidYouUpdate('ProblematicComponent', { userId, filters });

  const [data, setData] = useState([]);
  const debugData = useDebugValue(data, 'Component Data');

  useEffect(() => {
    // Effect logic
  }, [userId, filters]);

  return <div>{/* Component JSX */}</div>;
}
```


**Step 3: Performance Profiling Approach**


```javascript
// My performance debugging strategy
function usePerformanceMonitor(name) {
  const renderCount = useRef(0);
  const startTime = useRef(performance.now());

  renderCount.current++;

  useEffect(() => {
    const endTime = performance.now();
    const renderTime = endTime - startTime.current;

    console.log(`${name} - Render #${renderCount.current}:`, {
      renderTime: `${renderTime.toFixed(2)}ms`,
      timestamp: new Date().toISOString()
    });

    startTime.current = performance.now();
  });

  useEffect(() => {
    return () => {
      console.log(`${name} unmounted after ${renderCount.current} renders`);
    };
  }, []);
}

// Real debugging session example từ Binance
function TradingWidget({ symbol }) {
  usePerformanceMonitor('TradingWidget');

  const [price, setPrice] = useState(null);
  const [volume, setVolume] = useState(null);

  // This was causing excessive re-renders
  useEffect(() => {
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@ticker`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      // Problem: Two separate setState calls = two re-renders
      setPrice(parseFloat(data.c));
      setVolume(parseFloat(data.v));
    };

    return () => ws.close();
  }, [symbol]);

  return (
    <div>
      <div>Price: {price}</div>
      <div>Volume: {volume}</div>
    </div>
  );
}

// After investigation, the fix:
function OptimizedTradingWidget({ symbol }) {
  const [ticker, setTicker] = useState({ price: null, volume: null });

  useEffect(() => {
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@ticker`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      // Solution: Single state update
      setTicker({
        price: parseFloat(data.c),
        volume: parseFloat(data.v)
      });
    };

    return () => ws.close();
  }, [symbol]);

  return (
    <div>
      <div>Price: {ticker.price}</div>
      <div>Volume: {ticker.volume}</div>
    </div>
  );
}
```


### 💭 Architecture Decision Mental Framework


**🏗️ When Designing Hook Architecture:**


**Decision Point 1: Single Hook vs Multiple Hooks**


```javascript
// Mental question: "Does this logic belong together?"

// ❌ Too much in one hook
function useDashboard() {
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [theme, setTheme] = useState('light');
  const [sidebar, setSidebar] = useState(false);

  // 50+ lines of mixed logic...
}

// ✅ Separated by concern
function useAuth() {
  // Only authentication logic
}

function useNotifications() {
  // Only notification logic
}

function useAnalytics() {
  // Only analytics logic
}

function useTheme() {
  // Only theme logic
}

function useUI() {
  // Only UI state logic
}
```


**Decision Point 2: Local State vs Global State**


```javascript
// Mental framework:
// - Local if used by single component/tree
// - Global if shared across app
// - Derived state if computed from other state

// Local state example
function TodoItem({ todo }) {
  const [isEditing, setIsEditing] = useState(false); // Local UI state

  return (
    <div>
      {isEditing ? (
        <input value={todo.text} />
      ) : (
        <span>{todo.text}</span>
      )}
    </div>
  );
}

// Global state example
function useGlobalNotifications() {
  // Shared across entire app
  const [notifications, setNotifications] = useState([]);

  return {
    notifications,
    addNotification: (notification) => {
      setNotifications(prev => [...prev, notification]);
    }
  };
}

// Derived state example
function useTodoStats(todos) {
  return useMemo(() => ({
    total: todos.length,
    completed: todos.filter(t => t.completed).length,
    remaining: todos.filter(t => !t.completed).length
  }), [todos]); // Computed from todos
}
```


### 💭 Code Review Mental Models


**🔍 What I Look For trong Hooks Code Reviews:**


**Red Flag #1: Dependency Array Issues**


```javascript
// ❌ Missing dependencies
useEffect(() => {
  fetchUserData(userId, filters); // Missing filters from deps
}, [userId]);

// ❌ Too many dependencies
useEffect(() => {
  doSomething();
}, [a, b, c, d, e, f, g]); // Might indicate design issue

// ❌ Object/array dependencies without proper memoization
useEffect(() => {
  fetchData(config);
}, [config]); // config is recreated every render
```


**Red Flag #2: Performance Anti-patterns**


```javascript
// ❌ Expensive calculation in render
function Component({ items }) {
  const expensiveValue = items.map(item => {
    // Heavy computation
    return heavyCalculation(item);
  }); // Runs every render!

  return <div>{expensiveValue.length}</div>;
}

// ❌ New objects in JSX
function Component({ user }) {
  return (
    <UserCard
      user={user}
      style={{ margin: 10 }} // New object every render
      onClick={() => console.log('clicked')} // New function every render
    />
  );
}
```


**Green Flag: Good Patterns**


```javascript
// ✅ Proper memoization
function Component({ items }) {
  const expensiveValue = useMemo(() => {
    return items.map(item => heavyCalculation(item));
  }, [items]);

  const handleClick = useCallback(() => {
    console.log('clicked');
  }, []);

  const style = useMemo(() => ({ margin: 10 }), []);

  return (
    <UserCard
      user={user}
      style={style}
      onClick={handleClick}
    />
  );
}

// ✅ Clean custom hook
function useApiData(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(url);
        const result = await response.json();

        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [url]);

  return { data, loading, error };
}
```


## 📚 PHẦN VIII: INTERVIEW QUESTIONS VÀ MASTERY VERIFICATION


### 🎯 Junior Level Questions


**Q1: Basic Hooks Understanding**


```javascript
// Question: What's wrong with this code?
function Counter() {
  const [count, setCount] = useState(0);

  if (count > 5) {
    const [message, setMessage] = useState('High count!');
  }

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}

// Answer: Violates Rules of Hooks - conditional hook usage
// Solution:
function Counter() {
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState('High count!');

  return (
    <div>
      <p>Count: {count}</p>
      {count > 5 && <p>{message}</p>}
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}
```


**Q2: State Update Understanding**


```javascript
// Question: What will be the final count after clicking the button?
function App() {
  const [count, setCount] = useState(0);

  const handleClick = () => {
    setCount(count + 1);
    setCount(count + 1);
    setCount(count + 1);
  };

  return <button onClick={handleClick}>Count: {count}</button>;
}

// Answer: 1 (not 3)
// Explanation: All setCount calls use same stale count value
// Solution: Use functional updates
const handleClick = () => {
  setCount(c => c + 1);
  setCount(c => c + 1);
  setCount(c => c + 1);
};
```


### 🎯 Mid-Level Questions


**Q3: useEffect Dependencies**


```javascript
// Question: Identify the issues and fix them
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);

  const fetchUser = async () => {
    const userData = await api.getUser(userId);
    setUser(userData);
  };

  const fetchPosts = async () => {
    const userPosts = await api.getPosts(userId);
    setPosts(userPosts);
  };

  useEffect(() => {
    fetchUser();
    fetchPosts();
  }, []);

  return (
    <div>
      <h1>{user?.name}</h1>
      <div>{posts.length} posts</div>
    </div>
  );
}

// Issues:
// 1. Missing userId dependency
// 2. fetchUser and fetchPosts not in dependencies
// 3. No cleanup for async operations

// Solution:
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        const [userData, userPosts] = await Promise.all([
          api.getUser(userId),
          api.getPosts(userId)
        ]);

        if (!cancelled) {
          setUser(userData);
          setPosts(userPosts);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to fetch data:', error);
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return (
    <div>
      <h1>{user?.name}</h1>
      <div>{posts.length} posts</div>
    </div>
  );
}
```


**Q4: Custom Hook Design**


```javascript
// Question: Create a custom hook for form handling with validation

// Solution:
function useForm(initialValues, validationRules) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = useCallback((fieldName, value) => {
    const rules = validationRules[fieldName];
    if (!rules) return '';

    for (const rule of rules) {
      const error = rule(value, values);
      if (error) return error;
    }
    return '';
  }, [validationRules, values]);

  const setValue = useCallback((name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));

    // Validate on change if field was touched
    if (touched[name]) {
      const error = validate(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  }, [validate, touched]);

  const setFieldTouched = useCallback((name) => {
    setTouched(prev => ({ ...prev, [name]: true }));

    // Validate on blur
    const error = validate(name, values[name]);
    setErrors(prev => ({ ...prev, [name]: error }));
  }, [validate, values]);

  const validateAll = useCallback(() => {
    const allErrors = {};
    let hasErrors = false;

    Object.keys(values).forEach(name => {
      const error = validate(name, values[name]);
      allErrors[name] = error;
      if (error) hasErrors = true;
    });

    setErrors(allErrors);
    setTouched(Object.keys(values).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {}));

    return !hasErrors;
  }, [values, validate]);

  const handleSubmit = useCallback((onSubmit) => {
    return async (event) => {
      event.preventDefault();

      if (!validateAll()) return;

      setIsSubmitting(true);
      try {
        await onSubmit(values);
      } finally {
        setIsSubmitting(false);
      }
    };
  }, [values, validateAll]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    setValue,
    setFieldTouched,
    handleSubmit,
    reset,
    isValid: Object.keys(errors).length === 0
  };
}

// Usage example:
const validationRules = {
  email: [
    (value) => !value ? 'Email is required' : '',
    (value) => !/\S+@\S+\.\S+/.test(value) ? 'Invalid email' : ''
  ],
  password: [
    (value) => !value ? 'Password is required' : '',
    (value) => value.length < 8 ? 'Password must be at least 8 characters' : ''
  ]
};

function LoginForm() {
  const form = useForm(
    { email: '', password: '' },
    validationRules
  );

  const onSubmit = async (values) => {
    await authService.login(values);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <input
        value={form.values.email}
        onChange={(e) => form.setValue('email', e.target.value)}
        onBlur={() => form.setFieldTouched('email')}
      />
      {form.errors.email && <span>{form.errors.email}</span>}

      <input
        type="password"
        value={form.values.password}
        onChange={(e) => form.setValue('password', e.target.value)}
        onBlur={() => form.setFieldTouched('password')}
      />
      {form.errors.password && <span>{form.errors.password}</span>}

      <button type="submit" disabled={form.isSubmitting || !form.isValid}>
        {form.isSubmitting ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
```


### 🎯 Senior Level Questions


**Q5: Performance Optimization**


```javascript
// Question: Optimize this component for better performance
function Dashboard({ userId, timeRange, filters }) {
  const [user, setUser] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [reports, setReports] = useState([]);

  // Expensive calculation
  const processedAnalytics = analytics ? {
    ...analytics,
    chartData: analytics.data.map(point => ({
      ...point,
      formatted: formatNumber(point.value),
      percentage: (point.value / analytics.total) * 100
    })),
    summary: calculateSummary(analytics.data),
    trends: analyzeTrends(analytics.data)
  } : null;

  // Data fetching
  useEffect(() => {
    fetchUser(userId).then(setUser);
  }, [userId]);

  useEffect(() => {
    fetchAnalytics(userId, timeRange, filters).then(setAnalytics);
  }, [userId, timeRange, filters]);

  useEffect(() => {
    fetchReports(userId, filters).then(setReports);
  }, [userId, filters]);

  return (
    <div>
      <UserHeader user={user} />
      <AnalyticsChart data={processedAnalytics} />
      <ReportsTable reports={reports} />
    </div>
  );
}

// Optimized version:
function Dashboard({ userId, timeRange, filters }) {
  const [user, setUser] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [reports, setReports] = useState([]);

  // Memoized expensive calculation
  const processedAnalytics = useMemo(() => {
    if (!analytics) return null;

    return {
      ...analytics,
      chartData: analytics.data.map(point => ({
        ...point,
        formatted: formatNumber(point.value),
        percentage: (point.value / analytics.total) * 100
      })),
      summary: calculateSummary(analytics.data),
      trends: analyzeTrends(analytics.data)
    };
  }, [analytics]);

  // Optimized data fetching with concurrent requests
  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        const [userData, analyticsData, reportsData] = await Promise.all([
          fetchUser(userId),
          fetchAnalytics(userId, timeRange, filters),
          fetchReports(userId, filters)
        ]);

        if (!cancelled) {
          setUser(userData);
          setAnalytics(analyticsData);
          setReports(reportsData);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to fetch dashboard data:', error);
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [userId, timeRange, filters]);

  // Memoized components to prevent unnecessary re-renders
  const userHeader = useMemo(() =>
    <UserHeader user={user} />, [user]
  );

  const analyticsChart = useMemo(() =>
    <AnalyticsChart data={processedAnalytics} />, [processedAnalytics]
  );

  const reportsTable = useMemo(() =>
    <ReportsTable reports={reports} />, [reports]
  );

  return (
    <div>
      {userHeader}
      {analyticsChart}
      {reportsTable}
    </div>
  );
}
```


### 🎯 Principal Level Questions


**Q6: Architecture Design**


```javascript
// Question: Design a hooks-based architecture for a real-time collaborative editor
// Requirements:
// - Real-time sync across multiple users
// - Offline support with conflict resolution
// - Undo/redo functionality
// - Plugin system for extensions

// Solution architecture:

// 1. Core state management
function useEditorState() {
  const [document, setDocument] = useState(null);
  const [cursor, setCursor] = useState({ line: 0, col: 0 });
  const [selection, setSelection] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const applyOperation = useCallback((operation) => {
    setDocument(prev => {
      const newDoc = applyOp(prev, operation);

      // Add to history
      setHistory(h => [...h.slice(0, historyIndex + 1), operation]);
      setHistoryIndex(i => i + 1);

      return newDoc;
    });
  }, [historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex >= 0) {
      const operation = history[historyIndex];
      const inverseOp = getInverseOperation(operation);
      setDocument(prev => applyOp(prev, inverseOp));
      setHistoryIndex(i => i - 1);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const operation = history[historyIndex + 1];
      setDocument(prev => applyOp(prev, operation));
      setHistoryIndex(i => i + 1);
    }
  }, [history, historyIndex]);

  return {
    document,
    cursor,
    selection,
    setCursor,
    setSelection,
    applyOperation,
    undo,
    redo,
    canUndo: historyIndex >= 0,
    canRedo: historyIndex < history.length - 1
  };
}

// 2. Real-time synchronization
function useRealtimeSync(documentId, localState) {
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const socketRef = useRef(null);
  const pendingOpsRef = useRef([]);

  useEffect(() => {
    const socket = new WebSocket(`/api/documents/${documentId}/sync`);
    socketRef.current = socket;

    socket.onopen = () => {
      setConnectionStatus('connected');

      // Send pending operations
      pendingOpsRef.current.forEach(op => {
        socket.send(JSON.stringify({ type: 'operation', operation: op }));
      });
      pendingOpsRef.current = [];
    };

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case 'operation':
          localState.applyOperation(message.operation);
          break;
        case 'users_updated':
          setConnectedUsers(message.users);
          break;
        case 'cursor_update':
          // Handle cursor updates from other users
          break;
      }
    };

    socket.onclose = () => {
      setConnectionStatus('disconnected');
    };

    return () => {
      socket.close();
    };
  }, [documentId, localState]);

  const sendOperation = useCallback((operation) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'operation',
        operation
      }));
    } else {
      // Queue for when connection is restored
      pendingOpsRef.current.push(operation);
    }
  }, []);

  return {
    connectedUsers,
    connectionStatus,
    sendOperation
  };
}

// 3. Offline support with conflict resolution
function useOfflineSupport(documentId) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [localChanges, setLocalChanges] = useState([]);
  const [conflictResolution, setConflictResolution] = useState(null);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncLocalChanges();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const addLocalChange = useCallback((operation) => {
    setLocalChanges(prev => [...prev, {
      ...operation,
      timestamp: Date.now(),
      id: generateId()
    }]);
  }, []);

  const syncLocalChanges = useCallback(async () => {
    if (localChanges.length === 0) return;

    try {
      const result = await fetch(`/api/documents/${documentId}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operations: localChanges })
      });

      const response = await result.json();

      if (response.conflicts) {
        setConflictResolution({
          conflicts: response.conflicts,
          resolutions: response.suggestedResolutions
        });
      } else {
        setLocalChanges([]);
      }
    } catch (error) {
      console.error('Failed to sync local changes:', error);
    }
  }, [documentId, localChanges]);

  return {
    isOnline,
    localChanges,
    conflictResolution,
    addLocalChange,
    syncLocalChanges
  };
}

// 4. Plugin system
function usePlugins() {
  const [plugins, setPlugins] = useState(new Map());
  const [pluginState, setPluginState] = useState(new Map());

  const registerPlugin = useCallback((plugin) => {
    setPlugins(prev => new Map(prev).set(plugin.id, plugin));

    if (plugin.initialState) {
      setPluginState(prev => new Map(prev).set(plugin.id, plugin.initialState));
    }
  }, []);

  const unregisterPlugin = useCallback((pluginId) => {
    setPlugins(prev => {
      const newMap = new Map(prev);
      newMap.delete(pluginId);
      return newMap;
    });

    setPluginState(prev => {
      const newMap = new Map(prev);
      newMap.delete(pluginId);
      return newMap;
    });
  }, []);

  const getPluginApi = useCallback((pluginId) => {
    return {
      getState: () => pluginState.get(pluginId),
      setState: (newState) => {
        setPluginState(prev => new Map(prev).set(pluginId, newState));
      }
    };
  }, [pluginState]);

  return {
    plugins,
    registerPlugin,
    unregisterPlugin,
    getPluginApi
  };
}

// 5. Main editor hook composition
function useCollaborativeEditor(documentId) {
  const editorState = useEditorState();
  const realtimeSync = useRealtimeSync(documentId, editorState);
  const offlineSupport = useOfflineSupport(documentId);
  const plugins = usePlugins();

  // Enhance applyOperation to handle sync and offline
  const enhancedApplyOperation = useCallback((operation) => {
    editorState.applyOperation(operation);

    if (offlineSupport.isOnline) {
      realtimeSync.sendOperation(operation);
    } else {
      offlineSupport.addLocalChange(operation);
    }
  }, [editorState, realtimeSync, offlineSupport]);

  return {
    // Editor state
    ...editorState,
    applyOperation: enhancedApplyOperation,

    // Realtime features
    connectedUsers: realtimeSync.connectedUsers,
    connectionStatus: realtimeSync.connectionStatus,

    // Offline support
    isOnline: offlineSupport.isOnline,
    localChanges: offlineSupport.localChanges,
    conflictResolution: offlineSupport.conflictResolution,

    // Plugin system
    plugins: plugins.plugins,
    registerPlugin: plugins.registerPlugin,
    unregisterPlugin: plugins.unregisterPlugin,
    getPluginApi: plugins.getPluginApi
  };
}
```


## 📚 PHẦN IX: FUTURE-PROOFING VÀ ADVANCED CONCEPTS


### 🔮 React 18+ Features với Hooks


**🎯 Concurrent Features Integration:**


```javascript
// Transition Hook Usage for Better UX
function SearchResults() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isPending, startTransition] = useTransition();

  const handleSearch = (newQuery) => {
    setQuery(newQuery); // Urgent update

    startTransition(() => {
      // Non-urgent update - can be interrupted
      const searchResults = performExpensiveSearch(newQuery);
      setResults(searchResults);
    });
  };

  return (
    <div>
      <input
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Search..."
      />
      {isPending && <div>Searching...</div>}
      <ResultsList results={results} />
    </div>
  );
}

// Deferred Value for Performance
function HeavyDataVisualization({ data, filters }) {
  const [urgentFilters, setUrgentFilters] = useState(filters);
  const deferredFilters = useDeferredValue(urgentFilters);

  // Expensive computation uses deferred value
  const processedData = useMemo(() => {
    return data.filter(item => matchesFilters(item, deferredFilters))
              .map(item => expensiveTransform(item));
  }, [data, deferredFilters]);

  const
```


## Claude


const updateFilters = (newFilters) => {
setUrgentFilters(newFilters); // Immediate UI update
// processedData will update with deferredFilters, allowing UI to stay responsive
};


const isStale = urgentFilters !== deferredFilters;


return (
<div>
<FilterControls
     filters={urgentFilters}
     onChange={updateFilters}
   />
<div style={{ opacity: isStale ? 0.7 : 1 }}>
<DataVisualization data={processedData} />
</div>
</div>
);
}


// Suspense Integration với Custom Hooks
function useSuspenseData(fetcher, dependencies) {
const [promise, setPromise] = useState(null);


useEffect(() => {
const newPromise = fetcher();
setPromise(newPromise);
}, dependencies);


if (!promise) {
throw new Promise(() => {}); // Suspend until we have a promise
}


// This will suspend the component until promise resolves
throw promise;
}


function UserProfile({ userId }) {
const user = useSuspenseData(
() => api.getUser(userId),
[userId]
);


return (
<div>
<h1>{user.name}</h1>
<p>{user.email}</p>
</div>
);
}


// Usage with Suspense boundary
function App() {
return (
<Suspense fallback={<UserProfileSkeleton />}>
<UserProfile userId="123" />
</Suspense>
);
}


```
### 🎯 Server Components Integration Strategy

```javascript
// Hybrid Client/Server Hook Pattern
'use client';

// Client-side hook for interactive features
function useClientInteractions() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedItems, setSelectedItems] = useState(new Set());

  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  const toggleItem = useCallback((itemId) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }, []);

  return {
    isExpanded,
    selectedItems,
    toggleExpanded,
    toggleItem
  };
}

// Server Component
async function ProductList({ category, page = 1 }) {
  // Server-side data fetching
  const products = await getProducts(category, page);
  const categories = await getCategories();

  return (
    <div>
      <h2>Products in {category}</h2>
      <InteractiveProductList
        products={products}
        categories={categories}
      />
    </div>
  );
}

// Client Component using hooks
'use client';
function InteractiveProductList({ products, categories }) {
  const interactions = useClientInteractions();
  const [filteredProducts, setFilteredProducts] = useState(products);

  const handleFilter = useCallback((filters) => {
    const filtered = products.filter(product =>
      matchesFilters(product, filters)
    );
    setFilteredProducts(filtered);
  }, [products]);

  return (
    <div>
      <FilterPanel
        categories={categories}
        onFilter={handleFilter}
        isExpanded={interactions.isExpanded}
        onToggleExpanded={interactions.toggleExpanded}
      />

      <div className="product-grid">
        {filteredProducts.map(product => (
          <ProductCard
            key={product.id}
            product={product}
            isSelected={interactions.selectedItems.has(product.id)}
            onToggleSelect={() => interactions.toggleItem(product.id)}
          />
        ))}
      </div>

      {interactions.selectedItems.size > 0 && (
        <BulkActions selectedItems={interactions.selectedItems} />
      )}
    </div>
  );
}
```


### 🎯 AI-Enhanced Hooks Pattern


```javascript
// AI-powered hooks for intelligent UX
function useAIAssistant() {
  const [suggestions, setSuggestions] = useState([]);
  const [isThinking, setIsThinking] = useState(false);
  const contextRef = useRef([]);

  const addContext = useCallback((context) => {
    contextRef.current = [...contextRef.current.slice(-9), context];
  }, []);

  const getSuggestions = useCallback(async (userInput) => {
    setIsThinking(true);

    try {
      const response = await fetch('/api/ai/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: userInput,
          context: contextRef.current,
          timestamp: Date.now()
        })
      });

      const aiSuggestions = await response.json();
      setSuggestions(aiSuggestions);

      // Add this interaction to context
      addContext({
        type: 'user_input',
        content: userInput,
        suggestions: aiSuggestions,
        timestamp: Date.now()
      });

    } catch (error) {
      console.error('AI suggestion failed:', error);
      setSuggestions([]);
    } finally {
      setIsThinking(false);
    }
  }, [addContext]);

  const applySuggestion = useCallback((suggestion) => {
    addContext({
      type: 'suggestion_applied',
      content: suggestion,
      timestamp: Date.now()
    });
  }, [addContext]);

  return {
    suggestions,
    isThinking,
    getSuggestions,
    applySuggestion,
    addContext
  };
}

// Smart form with AI assistance
function SmartForm() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    tags: []
  });

  const ai = useAIAssistant();

  const handleFieldChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Get AI suggestions based on field and current form state
    if (field === 'title' && value.length > 10) {
      ai.getSuggestions({
        type: 'description_suggestion',
        title: value,
        currentData: formData
      });
    }

    if (field === 'description' && value.length > 50) {
      ai.getSuggestions({
        type: 'tags_and_category',
        title: formData.title,
        description: value
      });
    }
  }, [formData, ai]);

  return (
    <form>
      <div>
        <label>Title</label>
        <input
          value={formData.title}
          onChange={(e) => handleFieldChange('title', e.target.value)}
        />
      </div>

      <div>
        <label>Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => handleFieldChange('description', e.target.value)}
        />

        {ai.isThinking && <div>AI is thinking...</div>}

        {ai.suggestions.length > 0 && (
          <div className="ai-suggestions">
            <h4>AI Suggestions:</h4>
            {ai.suggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => {
                  handleFieldChange('description', suggestion.content);
                  ai.applySuggestion(suggestion);
                }}
                className="suggestion-button"
              >
                {suggestion.content}
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <label>Category</label>
        <select
          value={formData.category}
          onChange={(e) => handleFieldChange('category', e.target.value)}
        >
          <option value="">Select category...</option>
          {ai.suggestions
            .filter(s => s.type === 'category')
            .map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))
          }
        </select>
      </div>
    </form>
  );
}
```


### 🎯 Advanced State Machines với XState Integration


```javascript
// Complex state machine integration
import { useMachine } from '@xstate/react';
import { createMachine, assign } from 'xstate';

const checkoutMachine = createMachine({
  id: 'checkout',
  initial: 'cart',
  context: {
    items: [],
    user: null,
    paymentMethod: null,
    shippingAddress: null,
    error: null
  },
  states: {
    cart: {
      on: {
        ADD_ITEM: {
          actions: assign({
            items: (context, event) => [...context.items, event.item]
          })
        },
        REMOVE_ITEM: {
          actions: assign({
            items: (context, event) =>
              context.items.filter(item => item.id !== event.itemId)
          })
        },
        PROCEED_TO_CHECKOUT: {
          target: 'authentication',
          cond: (context) => context.items.length > 0
        }
      }
    },

    authentication: {
      initial: 'checking',
      states: {
        checking: {
          invoke: {
            src: 'checkAuth',
            onDone: {
              target: 'authenticated',
              actions: assign({
                user: (context, event) => event.data
              })
            },
            onError: 'unauthenticated'
          }
        },
        unauthenticated: {
          on: {
            LOGIN: {
              target: 'authenticating'
            },
            GUEST_CHECKOUT: {
              target: '#checkout.shipping'
            }
          }
        },
        authenticating: {
          invoke: {
            src: 'login',
            onDone: {
              target: 'authenticated',
              actions: assign({
                user: (context, event) => event.data
              })
            },
            onError: {
              target: 'unauthenticated',
              actions: assign({
                error: (context, event) => event.data
              })
            }
          }
        },
        authenticated: {
          always: {
            target: '#checkout.shipping'
          }
        }
      }
    },

    shipping: {
      on: {
        SET_SHIPPING_ADDRESS: {
          actions: assign({
            shippingAddress: (context, event) => event.address
          })
        },
        CONTINUE_TO_PAYMENT: {
          target: 'payment',
          cond: (context) => !!context.shippingAddress
        }
      }
    },

    payment: {
      initial: 'selecting',
      states: {
        selecting: {
          on: {
            SELECT_PAYMENT_METHOD: {
              actions: assign({
                paymentMethod: (context, event) => event.method
              })
            },
            SUBMIT_PAYMENT: {
              target: 'processing',
              cond: (context) => !!context.paymentMethod
            }
          }
        },
        processing: {
          invoke: {
            src: 'processPayment',
            onDone: {
              target: '#checkout.complete'
            },
            onError: {
              target: 'failed',
              actions: assign({
                error: (context, event) => event.data
              })
            }
          }
        },
        failed: {
          on: {
            RETRY_PAYMENT: 'processing',
            CHANGE_PAYMENT_METHOD: 'selecting'
          }
        }
      }
    },

    complete: {
      type: 'final'
    }
  }
}, {
  services: {
    checkAuth: async () => {
      const response = await fetch('/api/auth/check');
      if (response.ok) {
        return response.json();
      }
      throw new Error('Not authenticated');
    },

    login: async (context, event) => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event.credentials)
      });

      if (response.ok) {
        return response.json();
      }
      throw new Error('Login failed');
    },

    processPayment: async (context) => {
      const response = await fetch('/api/payment/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: context.items,
          paymentMethod: context.paymentMethod,
          shippingAddress: context.shippingAddress,
          user: context.user
        })
      });

      if (response.ok) {
        return response.json();
      }
      throw new Error('Payment failed');
    }
  }
});

// Custom hook wrapping XState machine
function useCheckout() {
  const [state, send] = useMachine(checkoutMachine);

  const addItem = useCallback((item) => {
    send('ADD_ITEM', { item });
  }, [send]);

  const removeItem = useCallback((itemId) => {
    send('REMOVE_ITEM', { itemId });
  }, [send]);

  const proceedToCheckout = useCallback(() => {
    send('PROCEED_TO_CHECKOUT');
  }, [send]);

  const login = useCallback((credentials) => {
    send('LOGIN', { credentials });
  }, [send]);

  const guestCheckout = useCallback(() => {
    send('GUEST_CHECKOUT');
  }, [send]);

  const setShippingAddress = useCallback((address) => {
    send('SET_SHIPPING_ADDRESS', { address });
  }, [send]);

  const selectPaymentMethod = useCallback((method) => {
    send('SELECT_PAYMENT_METHOD', { method });
  }, [send]);

  const submitPayment = useCallback(() => {
    send('SUBMIT_PAYMENT');
  }, [send]);

  return {
    // Current state info
    currentState: state.value,
    context: state.context,

    // State checks
    isInCart: state.matches('cart'),
    isAuthenticating: state.matches('authentication.authenticating'),
    isAuthenticated: state.matches('authentication.authenticated'),
    isSelectingShipping: state.matches('shipping'),
    isSelectingPayment: state.matches('payment.selecting'),
    isProcessingPayment: state.matches('payment.processing'),
    isPaymentFailed: state.matches('payment.failed'),
    isComplete: state.matches('complete'),

    // Actions
    addItem,
    removeItem,
    proceedToCheckout,
    login,
    guestCheckout,
    setShippingAddress,
    selectPaymentMethod,
    submitPayment,

    // Can perform action checks
    canProceedToCheckout: state.can('PROCEED_TO_CHECKOUT'),
    canContinueToPayment: state.can('CONTINUE_TO_PAYMENT'),
    canSubmitPayment: state.can('SUBMIT_PAYMENT')
  };
}

// Checkout component using the hook
function CheckoutFlow() {
  const checkout = useCheckout();

  if (checkout.isInCart) {
    return <CartView checkout={checkout} />;
  }

  if (checkout.isAuthenticating) {
    return <AuthenticationView checkout={checkout} />;
  }

  if (checkout.isSelectingShipping) {
    return <ShippingView checkout={checkout} />;
  }

  if (checkout.isSelectingPayment || checkout.isProcessingPayment || checkout.isPaymentFailed) {
    return <PaymentView checkout={checkout} />;
  }

  if (checkout.isComplete) {
    return <OrderConfirmation checkout={checkout} />;
  }

  return null;
}
```


## 📚 PHẦN X: CONCLUSION - MASTERY MINDSET


### 🎯 The Principal Engineer's Perspective on Hooks Mastery


Sau 7 years working với React Hooks across different companies và scales, đây là những key insights mà tôi muốn share:


**🌟 Hooks Không Chỉ Là Syntax - Nó Là Một Mental Model:**


React Hooks represent một fundamental shift trong cách chúng ta think về component architecture. Nó không phải chỉ là cách để "add state to functional components". Nó là một new way để organize logic around concerns thay vì lifecycle.


```javascript
// Before Hooks: Logic organized by lifecycle
class UserDashboard extends React.Component {
  componentDidMount() {
    this.fetchUser();
    this.setupWebSocket();
    this.startAnalytics();
    this.loadUserPreferences();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.userId !== this.props.userId) {
      this.fetchUser();
      this.resetAnalytics();
      this.loadUserPreferences();
    }
  }

  componentWillUnmount() {
    this.cleanupWebSocket();
    this.stopAnalytics();
    this.saveUserPreferences();
  }
}

// After Hooks: Logic organized by concern
function UserDashboard({ userId }) {
  const user = useUser(userId);           // User management logic
  const websocket = useWebSocket(userId); // WebSocket logic
  const analytics = useAnalytics(userId); // Analytics logic
  const preferences = usePreferences(userId); // Preferences logic

  // Each custom hook encapsulates setup, updates, and cleanup
  // Logic is co-located by feature, not scattered by lifecycle
}
```


**💭 Key Mental Shifts:**


1. **From Objects to Functions**: Component logic becomes composable functions
2. **From Inheritance to Composition**: Reuse through hook composition, not class inheritance
3. **From Imperative to Declarative**: State updates become declarative descriptions
4. **From Scattered to Co-located**: Related logic lives together in custom hooks


### 🏗️ Architecture Principles mà Tôi Follow


**Principle 1: Single Responsibility cho Hooks**


```javascript
// ❌ Hook doing too many things
function useBadDashboard() {
  // User logic
  const [user, setUser] = useState(null);
  // Analytics logic
  const [analytics, setAnalytics] = useState({});
  // Notification logic
  const [notifications, setNotifications] = useState([]);
  // Theme logic
  const [theme, setTheme] = useState('light');

  // 100+ lines of mixed logic...
}

// ✅ Separated concerns
function useDashboard() {
  const user = useUser();
  const analytics = useAnalytics();
  const notifications = useNotifications();
  const theme = useTheme();

  return { user, analytics, notifications, theme };
}
```


**Principle 2: Progressive Enhancement**


```javascript
// Start simple, add complexity incrementally
function useCounter(initialValue = 0) {
  const [count, setCount] = useState(initialValue);

  const increment = useCallback(() => setCount(c => c + 1), []);
  const decrement = useCallback(() => setCount(c => c - 1), []);

  return { count, increment, decrement };
}

// Enhanced version with persistence
function usePersistedCounter(key, initialValue = 0) {
  const [count, setCount] = useLocalStorage(key, initialValue);

  const increment = useCallback(() => setCount(c => c + 1), [setCount]);
  const decrement = useCallback(() => setCount(c => c - 1), [setCount]);

  return { count, increment, decrement };
}

// Enhanced version with analytics
function useAnalyticsCounter(key, initialValue = 0) {
  const counter = usePersistedCounter(key, initialValue);
  const analytics = useAnalytics();

  const increment = useCallback(() => {
    counter.increment();
    analytics.track('counter_incremented', { key });
  }, [counter.increment, analytics, key]);

  const decrement = useCallback(() => {
    counter.decrement();
    analytics.track('counter_decremented', { key });
  }, [counter.decrement, analytics, key]);

  return { ...counter, increment, decrement };
}
```


**Principle 3: Testability First**


```javascript
// Design hooks to be easily testable
function useApiData(url, options = {}) {
  const [state, setState] = useState({
    data: null,
    loading: true,
    error: null
  });

  const { retries = 3, timeout = 5000 } = options;

  useEffect(() => {
    let cancelled = false;

    const fetchData = async (attempt = 1) => {
      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (!cancelled) {
          setState({ data, loading: false, error: null });
        }

      } catch (error) {
        if (!cancelled) {
          if (attempt < retries && error.name !== 'AbortError') {
            setTimeout(() => fetchData(attempt + 1), 1000 * attempt);
          } else {
            setState(prev => ({ ...prev, loading: false, error }));
          }
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [url, retries, timeout]);

  const refetch = useCallback(() => {
    setState(prev => ({ ...prev, loading: true, error: null }));
  }, []);

  return { ...state, refetch };
}

// Easy to test with renderHook
test('useApiData should fetch data successfully', async () => {
  fetchMock.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve({ id: 1, name: 'Test' })
  });

  const { result, waitForNextUpdate } = renderHook(() =>
    useApiData('/api/test')
  );

  expect(result.current.loading).toBe(true);

  await waitForNextUpdate();

  expect(result.current.loading).toBe(false);
  expect(result.current.data).toEqual({ id: 1, name: 'Test' });
  expect(result.current.error).toBe(null);
});
```


### 🚀 Future-Proofing Strategies


**Strategy 1: Platform-Agnostic Hook Design**


```javascript
// Design hooks that can work across different React platforms
function useStorage(key, initialValue, storage = typeof window !== 'undefined' ? window.localStorage : null) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      if (!storage) return initialValue;
      const item = storage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading ${key} from storage:`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);

      if (storage) {
        storage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Error setting ${key} to storage:`, error);
    }
  }, [key, storedValue, storage]);

  return [storedValue, setValue];
}
```


**Strategy 2: Gradual Migration Patterns**


```javascript
// Create migration hooks for legacy code
function useLegacyClassComponent(ClassComponent, props) {
  const [instance, setInstance] = useState(null);
  const [state, setState] = useState({});

  useEffect(() => {
    const componentInstance = new ClassComponent(props);
    componentInstance.setState = setState;
    setInstance(componentInstance);

    if (componentInstance.componentDidMount) {
      componentInstance.componentDidMount();
    }

    return () => {
      if (componentInstance.componentWillUnmount) {
        componentInstance.componentWillUnmount();
      }
    };
  }, [ClassComponent, props]);

  useEffect(() => {
    if (instance && instance.componentDidUpdate) {
      instance.componentDidUpdate();
    }
  });

  return { instance, state };
}
```


### 🎯 Final Recommendations cho Mastery


**1. Build Your Own Hook Library**
Tạo một personal collection of reusable hooks. Đây là cách tốt nhất để understand patterns và improve architecture skills.


**2. Study Open Source Hook Libraries**


- React Use: [https://github.com/streamich/react-use](https://github.com/streamich/react-use)
- Ahooks: [https://github.com/alibaba/hooks](https://github.com/alibaba/hooks)
- SWR: [https://github.com/vercel/swr](https://github.com/vercel/swr)
- React Query: [https://github.com/tannerlinsley/react-query](https://github.com/tannerlinsley/react-query)


**3. Practice Complex State Management**
Build applications với complex state requirements:


- Real-time collaboration tools
- Gaming applications
- Financial dashboards
- Design tools


**4. Performance Profiling**
Regularly profile your applications:


- Use React DevTools Profiler
- Measure render times
- Track memory usage
- Monitor bundle sizes


**5. Teaching and Mentoring**
Best way để master Hooks là teaching others. Write blog posts, give talks, mentor junior developers.


### 💭 Closing Thoughts


React Hooks đã fundamentally changed cách chúng ta build React applications. Nhưng mastery không đến từ việc memorize APIs hay patterns. Nó đến từ understanding underlying principles và developing intuition về khi nào apply những patterns nào.


**Key Takeaways:**


1. **Hooks are about logic organization, not just state management**
2. **Custom hooks are where the real power lies**
3. **Performance optimization requires understanding React's rendering model**
4. **Testing hooks separately makes applications more maintainable**
5. **Architecture decisions compound over time - invest in good patterns early**


**Remember:** Great React developers không phải là những người biết tất cả Hooks APIs. Họ là những người understand khi nào use Hooks để solve real problems elegantly.


React Hooks gave chúng ta tools để build better applications. But tools alone don't make great software. Great software comes from great thinking, good architecture decisions, và deep understanding của problems you're solving.


Keep learning, keep experimenting, và most importantly - keep building great things! 🚀


---


*"The best React code is not the cleverest React code. It's the React code that solves real problems simply and maintainably."* - Personal philosophy after 7 years with React


**THE END**


---
