# React Component Communication Techniques

## You

Continue

## Claude


# React Component Communication: Phân Tích Chuyên Sâu Từ Góc Độ Principal Front-end Engineer


*Một cuộc hành trình khám phá toàn diện về giao tiếp component trong React - Từ first principles đến production-grade implementations*


---


## 🎯 Mở Đầu: Tại Sao Component Communication Là Trái Tim Của React Architecture?


Khi tôi bắt đầu hành trình với React vào năm 2016 tại NAB, tôi đã nghĩ rằng component communication chỉ đơn giản là truyền props từ cha xuống con. Thật ngây thơ! Sau 8 năm làm việc tại các công ty như Axon, Binance, Webflow, và Figma, tôi nhận ra rằng **component communication chính là xương sống của mọi React application phức tạp**.


💭 **Principal's Perspective**: *Component communication không chỉ là về việc truyền data. Nó là về designing information architecture, managing complexity, enabling scalability, và creating maintainable systems. Mỗi pattern communication mà chúng ta chọn sẽ impact đến performance, developer experience, testing strategy, và long-term maintainability của entire codebase.*


### 🌱 Tại Sao Bài Viết Này Tồn Tại?


Trong những năm làm việc tại các dự án scale lớn:


- **NAB**: Banking platform với 10M+ users
- **Axon**: Real-time communication tools cho law enforcement
- **Binance**: High-frequency trading interface
- **Webflow**: Visual website builder với complex nested components
- **Figma**: Collaborative design tool với real-time synchronization


Tôi đã chứng kiến hàng ngàn engineers struggle với component communication. Không phải vì họ không biết syntax, mà vì họ không hiểu **bản chất sâu sắc** của từng pattern, **trade-offs**, và **appropriate use cases**.


### 🎓 Methodology: Cách Chúng Ta Sẽ Học


Thay vì học theo kiểu "copy-paste code examples", chúng ta sẽ:


1. **First Principles Thinking**: Hiểu **tại sao** mỗi pattern tồn tại
2. **Mechanism Deep Dive**: Khám phá **cách hoạt động** ở browser level
3. **Production Reality**: Học từ real-world scenarios và debugging stories
4. **Mental Models**: Xây dựng intuitive understanding
5. **Verification**: Self-assessment và interview preparation


---


## 📖 PHẦN I: PARENT-CHILD COMMUNICATION - THE FOUNDATION


### 🔬 Props: Bản Chất Sâu Sắc Của One-Way Data Flow


#### 🌱 Nguồn Gốc & Motivation: Tại Sao Props Tồn Tại?


Trước khi có React, chúng ta có jQuery spaghetti code. Hãy t상像 bạn đang xây dựng một dashboard với 50 widgets, mỗi widget cần access đến user data. Trong jQuery world:


```javascript
// jQuery hell - Global state nightmare
window.userData = { name: "John", role: "admin" };

// Widget1
$("#widget1").data("user", window.userData);

// Widget2 - accidentally mutates global state
$("#widget2").click(() => {
  window.userData.role = "user"; // BUG: Affects all widgets!
});
```


**Vấn đề**: No clear data ownership, unpredictable mutations, debugging nightmare.


React team (Jordan Walke tại Facebook, 2013) nhận ra rằng UI problems thực chất là **data flow problems**. Họ đã thiết kế props system dựa trên **functional programming principles**:


1. **Immutability**: Props are read-only
2. **Unidirectional flow**: Data flows down the component tree
3. **Pure functions**: Same props → Same output
4. **Composition**: Complex UIs from simple components


💭 **Think Out Loud**: *Khi tôi đầu tiên học React, tôi confused về việc "tại sao không thể mutate props?". Aha moment đến khi tôi realize rằng props immutability enables predictable rendering, easier debugging, và time-travel debugging capabilities trong React DevTools.*


#### ⚙️ Core Mechanism: Props Hoạt Động Như Thế Nào?


**Step 1: JSX Compilation**


```jsx
// JSX code
<UserProfile name="Alice" age={25} />

// Compiled JavaScript (Babel output)
React.createElement(UserProfile, { name: "Alice", age: 25 });
```


**Step 2: React Element Creation**


```javascript
// React internally creates this object
const element = {
  type: UserProfile,
  props: {
    name: "Alice",
    age: 25,
    children: undefined
  },
  key: null,
  ref: null
};
```


**Step 3: Component Function Invocation**


```javascript
// React calls your component function
function UserProfile(props) {
  // props = { name: "Alice", age: 25 }
  return <div>{props.name}</div>;
}
```


💡 **Intuitive Understanding**: Props giống như **function parameters trong mathematics**. Khi bạn có function `f(x) = x²`, bạn không expect `x` sẽ thay đổi bên trong function. Props hoạt động tương tự - they're **input arguments** for your component function.


#### 🔍 Step-by-step Breakdown: Props Lifecycle


```javascript
// Parent component render cycle
function App() {
  const [user, setUser] = useState({ name: "Alice", age: 25 });

  // Step 1: Parent creates props object
  const userProfileProps = {
    name: user.name,
    age: user.age
  };

  // Step 2: Props passed to child
  return <UserProfile {...userProfileProps} />;
}

// Child component receives props
function UserProfile(props) {
  // Step 3: Props object available in component
  console.log("Received props:", props);

  // Step 4: Props used in JSX
  return (
    <div>
      <h1>{props.name}</h1>
      <p>Age: {props.age}</p>
    </div>
  );
}
```


**Memory Model Analysis**:


```javascript
// React's internal representation
const fiber = {
  elementType: UserProfile,
  memoizedProps: { name: "Alice", age: 25 }, // Current props
  pendingProps: { name: "Alice", age: 25 },  // New props
  // ... other fiber properties
};
```


#### 🛠️ Implementation Deep Dive: Props Validation & Optimization


**Props Type Checking (Runtime)**:


```javascript
import PropTypes from 'prop-types';

UserProfile.propTypes = {
  name: PropTypes.string.isRequired,
  age: PropTypes.number,
  avatar: PropTypes.string,
  onProfileClick: PropTypes.func
};

UserProfile.defaultProps = {
  age: 0,
  avatar: '/default-avatar.png'
};
```


**TypeScript Approach (Compile-time)**:


```typescript
interface UserProfileProps {
  name: string;
  age?: number;
  avatar?: string;
  onProfileClick?: (userId: string) => void;
}

const UserProfile: React.FC<UserProfileProps> = ({
  name,
  age = 0,
  avatar = '/default-avatar.png',
  onProfileClick
}) => {
  return (
    <div onClick={() => onProfileClick?.(name)}>
      <img src={avatar} alt={name} />
      <h3>{name}</h3>
      <p>Age: {age}</p>
    </div>
  );
};
```


💭 **Production Reality**: *Tại Figma, chúng tôi learned the hard way rằng proper props typing is crucial. Một lần, props shape change đã break 47 components across 12 different teams. From that point, chúng tôi mandatory TypeScript strict mode và comprehensive props interface documentation.*


#### 🏭 Production Reality: Props Performance Optimization


**Problem**: Props referential equality affects React.memo


```javascript
// ❌ BAD: Object created on every render
function Parent() {
  return (
    <Child
      style={{ marginTop: 10 }} // New object every render!
      data={{ user: "Alice" }}   // New object every render!
    />
  );
}

const Child = React.memo(({ style, data }) => {
  console.log("Child rendered"); // Always logs!
  return <div style={style}>{data.user}</div>;
});
```


**Solution**: Memoization strategies


```javascript
// ✅ GOOD: Stable references
function Parent() {
  const style = useMemo(() => ({ marginTop: 10 }), []);
  const data = useMemo(() => ({ user: "Alice" }), []);

  return <Child style={style} data={data} />;
}

// Or better: Move static objects outside component
const CHILD_STYLE = { marginTop: 10 };

function Parent() {
  const data = useMemo(() => ({ user: "Alice" }), []);
  return <Child style={CHILD_STYLE} data={data} />;
}
```


**Advanced: Props Drilling Performance Impact**


```javascript
// Performance Analysis tại Binance trading interface
function TradingDashboard({ marketData }) {
  return (
    <Layout>
      <Sidebar marketData={marketData} /> {/* Props drilling level 1 */}
      <MainContent marketData={marketData} />
    </Layout>
  );
}

function Sidebar({ marketData }) {
  return (
    <div>
      <MarketOverview data={marketData} /> {/* Level 2 */}
      <WatchList data={marketData} />
    </div>
  );
}

function MarketOverview({ data }) {
  return (
    <div>
      <PriceWidget price={data.currentPrice} /> {/* Level 3 */}
      <VolumeWidget volume={data.volume} />
    </div>
  );
}

// Performance issue: Deep prop drilling causes unnecessary re-renders
// Solution: Context API hoặc Component composition
```


#### 💭 Debugging Mental Model: Props Troubleshooting


**Red Flags Báo Hiệu Props Problems**:


1. **Component re-renders unexpectedly**


```javascript
// Debug với React DevTools Profiler
function MyComponent({ data }) {
  console.log("Render:", data); // Check if data reference changes
  return <div>{data.name}</div>;
}

// Profiler analysis shows unnecessary renders
// → Check parent component's memoization
```


1. **Props seem to "disappear"**


```javascript
function Child({ name }) {
  console.log("Props received:", { name }); // undefined?

  // Common cause: Parent component not passing props correctly
  // Or: Destructuring typo
  return <div>{name}</div>;
}

// Parent component
function Parent() {
  const userName = "Alice";
  return <Child names={userName} />; // BUG: names vs name
}
```


1. **Props mutations not reflecting in child**


```javascript
// Common misconception
function Parent() {
  const [user, setUser] = useState({ name: "Alice" });

  const updateUser = () => {
    user.name = "Bob"; // ❌ Direct mutation - React won't detect change!
    setUser(user);     // Same reference, no re-render
  };

  // ✅ Correct approach
  const updateUserCorrect = () => {
    setUser({ ...user, name: "Bob" }); // New object reference
  };
}
```


#### 🎯 Interview Questions: Props Deep Understanding


**Level 1: Basic Understanding**


1. *"Explain what happens when you pass a prop to a component"*
2. *"Why are props read-only in React?"*
3. *"What's the difference between props and state?"*


**Level 2: Intermediate**


1. *"How does React.createElement handle props internally?"*
2. *"Explain the performance implications of passing objects as props"*
3. *"What are the trade-offs between prop drilling vs Context API?"*


**Level 3: Advanced**


1. *"How would you optimize a component tree with deep prop drilling?"*
2. *"Explain fiber reconciliation when props change"*
3. *"Design a props system for a component library with backward compatibility"*


---


### 🔄 Callbacks: Child-to-Parent Communication Deep Dive


#### 🌱 Nguồn Gốc & Motivation: Tại Sao Cần Callbacks?


Props flow xuống, nhưng events cần flow ngược lên. Đây là fundamental challenge trong any UI framework. Trước React:


```javascript
// jQuery approach - tightly coupled
$("#search-input").on("input", function() {
  const value = $(this).val();
  $("#results-container").html(searchResults(value));
  updateURL(value); // Side effect
  trackAnalytics(value); // Another side effect
});
```


**Problems**:


- Tight coupling giữa search input và results display
- No clear separation of concerns
- Hard to test individual pieces
- No reusability


React's callback pattern giải quyết bằng cách **invert control**:


- Child components trigger events
- Parent components handle consequences
- Clear separation of concerns
- Testable và reusable


#### ⚙️ Core Mechanism: Callback Functions Behind The Scenes


**Event Bubbling trong React Synthetic Events**:


```javascript
function SearchInput({ onSearch }) {
  const handleChange = (e) => {
    const value = e.target.value;
    onSearch(value); // Invoke parent's callback
  };

  return (
    <input
      type="text"
      onChange={handleChange} // React synthetic event
    />
  );
}

// React internally:
// 1. Creates SyntheticEvent wrapper
// 2. Calls your handleChange with normalized event
// 3. handleChange calls parent callback
// 4. Parent callback updates state
// 5. Re-render cycle begins
```


**Memory Model: Function References**:


```javascript
function Parent() {
  // Each render creates new function reference
  const handleSearch = (query) => {
    console.log("Search for:", query);
  };

  return <SearchInput onSearch={handleSearch} />;
}

// Problem: Child re-renders unnecessarily
// Solution: useCallback
function Parent() {
  const handleSearch = useCallback((query) => {
    console.log("Search for:", query);
  }, []); // Stable reference

  return <SearchInput onSearch={handleSearch} />;
}
```


#### 🔍 Advanced Callback Patterns: Real-World Scenarios


**Pattern 1: State Lifting với Complex Data**


```javascript
// Scenario: E-commerce cart system tại Webflow
function ShoppingCart() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);

  // Complex callback handling multiple state updates
  const handleItemChange = useCallback((itemId, changes) => {
    setItems(prevItems => {
      const newItems = prevItems.map(item =>
        item.id === itemId ? { ...item, ...changes } : item
      );

      // Calculate total as side effect
      const newTotal = newItems.reduce((sum, item) =>
        sum + (item.price * item.quantity), 0
      );
      setTotal(newTotal);

      return newItems;
    });
  }, []);

  return (
    <div>
      {items.map(item => (
        <CartItem
          key={item.id}
          item={item}
          onChange={(changes) => handleItemChange(item.id, changes)}
        />
      ))}
      <CartTotal total={total} />
    </div>
  );
}

function CartItem({ item, onChange }) {
  const handleQuantityChange = (newQuantity) => {
    onChange({ quantity: newQuantity });
  };

  const handleRemove = () => {
    onChange({ quantity: 0 }); // Triggers parent logic
  };

  return (
    <div>
      <span>{item.name}</span>
      <QuantityInput
        value={item.quantity}
        onChange={handleQuantityChange}
      />
      <button onClick={handleRemove}>Remove</button>
    </div>
  );
}
```


**Pattern 2: Event Aggregation cho Performance**


```javascript
// Problem: Too many individual callbacks
function DataTable({ data, onCellChange }) {
  return (
    <table>
      {data.map((row, rowIndex) => (
        <tr key={rowIndex}>
          {row.map((cell, cellIndex) => (
            <td key={cellIndex}>
              <input
                value={cell}
                onChange={(e) => onCellChange(rowIndex, cellIndex, e.target.value)}
                // Problem: New function every render!
              />
            </td>
          ))}
        </tr>
      ))}
    </table>
  );
}

// Solution: Event delegation pattern
function DataTable({ data, onCellChange }) {
  const handleTableChange = useCallback((e) => {
    if (e.target.tagName === 'INPUT') {
      const rowIndex = parseInt(e.target.dataset.row);
      const cellIndex = parseInt(e.target.dataset.cell);
      onCellChange(rowIndex, cellIndex, e.target.value);
    }
  }, [onCellChange]);

  return (
    <table onChange={handleTableChange}>
      {data.map((row, rowIndex) => (
        <tr key={rowIndex}>
          {row.map((cell, cellIndex) => (
            <td key={cellIndex}>
              <input
                value={cell}
                data-row={rowIndex}
                data-cell={cellIndex}
                // Single event listener on table
              />
            </td>
          ))}
        </tr>
      ))}
    </table>
  );
}
```


#### 🏭 Production Case Study: Binance Trading Interface Callbacks


```javascript
// Real scenario: High-frequency price updates với callback optimization
function TradingInterface() {
  const [orders, setOrders] = useState([]);
  const [positions, setPositions] = useState([]);

  // Optimized callback để handle high-frequency updates
  const handleOrderUpdate = useCallback((orderUpdate) => {
    // Batch updates để avoid unnecessary re-renders
    setOrders(prevOrders => {
      const newOrders = [...prevOrders];
      const index = newOrders.findIndex(o => o.id === orderUpdate.id);

      if (index >= 0) {
        newOrders[index] = { ...newOrders[index], ...orderUpdate };
      } else {
        newOrders.push(orderUpdate);
      }

      return newOrders;
    });
  }, []);

  // Debounced callback for position calculations
  const handlePositionUpdate = useMemo(
    () => debounce((positionData) => {
      setPositions(prevPositions =>
        updatePositionsWithRisk(prevPositions, positionData)
      );
    }, 100), // 100ms debounce
    []
  );

  return (
    <>
      <OrderBook onOrderUpdate={handleOrderUpdate} />
      <PositionManager onPositionUpdate={handlePositionUpdate} />
    </>
  );
}

// OrderBook component với optimized rendering
const OrderBook = React.memo(({ onOrderUpdate }) => {
  useEffect(() => {
    const websocket = new WebSocket('wss://api.binance.com/ws/orders');

    websocket.onmessage = (event) => {
      const orderData = JSON.parse(event.data);
      onOrderUpdate(orderData); // Stable callback reference
    };

    return () => websocket.close();
  }, [onOrderUpdate]); // Won't cause reconnection thanks to useCallback

  return <div>Order Book Content</div>;
});
```


#### 💭 Mental Model: Callback Performance Troubleshooting


**Common Performance Pitfalls**:


1. **Inline function creation**


```javascript
// ❌ BAD: New function every render
<button onClick={() => handleClick(item.id)}>
  Click me
</button>

// ✅ GOOD: Stable function reference
const handleItemClick = useCallback((id) => handleClick(id), [handleClick]);
<button onClick={() => handleItemClick(item.id)}>
  Click me
</button>

// ✅ BETTER: Use data attributes
<button
  onClick={handleClick}
  data-item-id={item.id}
>
  Click me
</button>
```


1. **Callback dependency arrays**


```javascript
// ❌ BAD: Missing dependencies
const handleSubmit = useCallback((data) => {
  api.post('/submit', { ...data, userId }); // userId not in deps!
}, []); // Stale closure bug

// ✅ GOOD: Correct dependencies
const handleSubmit = useCallback((data) => {
  api.post('/submit', { ...data, userId });
}, [userId]); // Callback updates when userId changes
```


1. **Over-memoization**


```javascript
// ❌ BAD: Unnecessary memoization
const handleClick = useCallback(() => {
  console.log('clicked'); // No dependencies, no benefit
}, []);

// ✅ GOOD: Simple function
const handleClick = () => {
  console.log('clicked');
};
```


#### 🎯 Follow-up Questions: Callback Mastery


**Fundamental Questions**:


1. *"When should you use useCallback vs regular function?"*
2. *"How do you handle async callbacks properly?"*
3. *"What are the performance implications of deep callback chains?"*


**Advanced Scenarios**:


1. *"Design a callback system for undo/redo functionality"*
2. *"How would you implement callback debouncing for real-time search?"*
3. *"Explain callback memory leaks và prevention strategies"*


**Production Debugging**:


1. *"A component re-renders every second despite no prop changes. How do you debug?"*
2. *"Callbacks seem to use stale values. Walk through your debugging process."*
3. *"Design a callback system for a collaborative editor (think Figma/Google Docs)"*


---


## 📖 PHẦN II: CROSS-LAYER COMMUNICATION - CONTEXT API MASTERY


### 🔬 Context API: Solving Props Drilling At Scale


#### 🌱 Nguồn Gốc & Motivation: The Props Drilling Problem


Tại NAB, chúng tôi có một banking dashboard với component hierarchy 8 levels deep. User authentication state cần được accessed ở mọi level:


```javascript
// Before Context API - Props drilling nightmare
function App() {
  const [user, setUser] = useState(null);
  return <Dashboard user={user} setUser={setUser} />;
}

function Dashboard({ user, setUser }) {
  return (
    <div>
      <Header user={user} setUser={setUser} />
      <Sidebar user={user} />
      <MainContent user={user} setUser={setUser} />
    </div>
  );
}

function Header({ user, setUser }) {
  return (
    <div>
      <Navigation user={user} />
      <UserMenu user={user} setUser={setUser} />
    </div>
  );
}

function UserMenu({ user, setUser }) {
  return (
    <div>
      <ProfileDropdown user={user} />
      <LogoutButton onLogout={() => setUser(null)} />
    </div>
  );
}

// ... và cứ thế tiếp tục xuống 8 levels
```


**Problems**:


- Intermediate components become "prop pipes"
- Hard to refactor component structure
- Props pollution - components receive props they don't use
- Difficult to add new user-dependent features


Context API ra đời để solve exactly this problem - provide **"wormhole"** để data có thể tunnel through component tree mà không cần pass qua intermediate components.


#### ⚙️ Core Mechanism: Context Behind The Scenes


**Step 1: Context Creation & Provider Setup**


```javascript
// React internally tạo context object
const UserContext = React.createContext(defaultValue);

// Provider component wraps part of tree
function App() {
  const [user, setUser] = useState(null);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      <Dashboard />
    </UserContext.Provider>
  );
}
```


**Step 2: Context Resolution Algorithm**


```javascript
// Khi component gọi useContext
function ProfileComponent() {
  const { user } = useContext(UserContext);
  // React traverses up the tree to find nearest Provider
  return <div>{user?.name}</div>;
}

// React's internal algorithm:
// 1. Start at current component
// 2. Walk up fiber tree
// 3. Find nearest Provider with matching context
// 4. Return Provider's value
// 5. Subscribe to value changes for re-renders
```


**Memory Model: Context Fiber Structure**


```javascript
// React Fiber representation
const contextFiber = {
  elementType: UserContext.Provider,
  memoizedProps: {
    value: { user: {...}, setUser: f() }, // Current context value
  },
  context: UserContext, // Context reference
  // Linked list of consumers for efficient updates
  dependencies: [
    { context: UserContext, consumer: ProfileComponent },
    { context: UserContext, consumer: LogoutButton },
  ]
};
```


#### 🛠️ Implementation Deep Dive: Context Optimization Patterns


**Pattern 1: Context Value Memoization**


```javascript
// ❌ BAD: New object every render triggers all consumers
function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        profile,
        setProfile
      }} // New object every render!
    >
      {children}
    </UserContext.Provider>
  );
}

// ✅ GOOD: Memoized context value
function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  const contextValue = useMemo(() => ({
    user,
    setUser,
    profile,
    setProfile
  }), [user, profile]); // Only changes when data changes

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
}
```


**Pattern 2: Context Splitting Strategy**


```javascript
// Problem: Monolithic context causes unnecessary re-renders
const AppContext = createContext({
  user: null,
  theme: 'light',
  notifications: [],
  cart: [],
  // ... 20 other properties
});

// Solution: Split contexts by update frequency và coupling
const UserContext = createContext();
const ThemeContext = createContext();
const ShoppingContext = createContext();

function AppProvider({ children }) {
  return (
    <UserProvider>
      <ThemeProvider>
        <ShoppingProvider>
          {children}
        </ShoppingProvider>
      </ThemeProvider>
    </UserProvider>
  );
}

// Components only subscribe to relevant contexts
function ThemeToggle() {
  const { theme, toggleTheme } = useContext(ThemeContext);
  // Won't re-render when user data changes
  return <button onClick={toggleTheme}>{theme}</button>;
}
```


**Pattern 3: Context with Reducers - Complex State Management**


```javascript
// Advanced pattern: Context + useReducer for complex state logic
const initialState = {
  user: null,
  loading: false,
  error: null,
  permissions: []
};

function userReducer(state, action) {
  switch (action.type) {
    case 'FETCH_USER_START':
      return { ...state, loading: true, error: null };

    case 'FETCH_USER_SUCCESS':
      return {
        ...state,
        loading: false,
        user: action.payload.user,
        permissions: action.payload.permissions
      };

    case 'FETCH_USER_ERROR':
      return { ...state, loading: false, error: action.payload };

    case 'UPDATE_PERMISSIONS':
      return { ...state, permissions: action.payload };

    default:
      throw new Error(`Unhandled action type: ${action.type}`);
  }
}

function UserProvider({ children }) {
  const [state, dispatch] = useReducer(userReducer, initialState);

  // Memoize actions to prevent consumer re-renders
  const actions = useMemo(() => ({
    fetchUser: async (userId) => {
      dispatch({ type: 'FETCH_USER_START' });
      try {
        const response = await api.getUser(userId);
        dispatch({
          type: 'FETCH_USER_SUCCESS',
          payload: response
        });
      } catch (error) {
        dispatch({
          type: 'FETCH_USER_ERROR',
          payload: error.message
        });
      }
    },

    updatePermissions: (permissions) => {
      dispatch({
        type: 'UPDATE_PERMISSIONS',
        payload: permissions
      });
    }
  }), []); // Actions are stable

  const value = useMemo(() => ({
    ...state,
    ...actions
  }), [state, actions]);

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}
```


#### 🏭 Production Case Study: Figma's Context Strategy


```javascript
// Real-world example: Figma's collaborative editing context
function CollaborationProvider({ children }) {
  const [document, setDocument] = useState(null);
  const [cursors, setCursors] = useState(new Map());
  const [selections, setSelections] = useState(new Map());
  const websocketRef = useRef(null);

  // Optimized context value với selective updates
  const contextValue = useMemo(() => ({
    // Document state
    document,
    updateDocument: (changes) => {
      setDocument(prev => applyChanges(prev, changes));
      broadcastChanges(changes);
    },

    // Collaboration state
    cursors,
    selections,

    // Connection management
    isConnected: websocketRef.current?.readyState === WebSocket.OPEN,
  }), [document, cursors, selections]);

  // WebSocket management
  useEffect(() => {
    websocketRef.current = new WebSocket('wss://figma.com/collaborate');

    websocketRef.current.onmessage = (event) => {
      const { type, payload } = JSON.parse(event.data);

      switch (type) {
        case 'CURSOR_UPDATE':
          setCursors(prev => new Map(prev.set(payload.userId, payload.cursor)));
          break;
        case 'SELECTION_UPDATE':
          setSelections(prev => new Map(prev.set(payload.userId, payload.selection)));
          break;
        case 'DOCUMENT_CHANGE':
          setDocument(prev => applyRemoteChanges(prev, payload));
          break;
      }
    };

    return () => websocketRef.current?.close();
  }, []);

  return (
    <CollaborationContext.Provider value={contextValue}>
      {children}
    </CollaborationContext.Provider>
  );
}

// Selective context consumption
function Canvas() {
  const { document, updateDocument } = useContext(CollaborationContext);
  // Only re-renders when document changes, not cursors

  return (
    <div>
      {document?.layers.map(layer => (
        <Layer
          key={layer.id}
          data={layer}
          onUpdate={(changes) => updateDocument({ layerId: layer.id, changes })}
        />
      ))}
    </div>
  );
}

function CursorsOverlay() {
  const { cursors } = useContext(CollaborationContext);
  // Only re-renders when cursors change, not document

  return (
    <div className="cursors-overlay">
      {Array.from(cursors.entries()).map(([userId, cursor]) => (
        <Cursor key={userId} position={cursor.position} user={userId} />
      ))}
    </div>
  );
}
```


#### 💭 Mental Model: Context Performance Debugging


**Red Flags & Debugging Process**:


1. **Excessive Re-renders**


```javascript
// Debug tool: Context update tracker
function useContextUpdateTracker(contextName, contextValue) {
  const prevValue = useRef();

  useEffect(() => {
    if (prevValue.current !== contextValue) {
      console.log(`${contextName} context updated:`, {
        prev: prevValue.current,
        next: contextValue,
        changed: Object.keys(contextValue).filter(key =>
          prevValue.current?.[key] !== contextValue[key]
        )
      });
      prevValue.current = contextValue;
    }
  });
}

// Usage in Provider
function UserProvider({ children }) {
  const contextValue = useMemo(/* ... */);
  useContextUpdateTracker('User', contextValue);

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
}
```


1. **Context value object recreation**


```javascript
// DevTools debugging: Track context value references
function ContextValueDebugger({ children }) {
  const contextValue = useContext(MyContext);
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current++;
    console.log(`Context consumer render #${renderCount.current}`, {
      contextValue,
      reference: contextValue === prevValue ? 'SAME' : 'DIFFERENT'
    });
  });

  return children;
}
```


1. **Provider placement issues**


```javascript
// Common mistake: Provider too low in tree
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/dashboard" element={
          <UserProvider> {/* Provider only covers dashboard! */}
            <Dashboard />
          </UserProvider>
        } />
        <Route path="/profile" element={
          <Profile /> {/* No access to UserContext! */}
        } />
      </Routes>
    </Router>
  );
}

// Fix: Move Provider higher
function App() {
  return (
    <UserProvider> {/* Provider covers entire app */}
      <Router>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </Router>
    </UserProvider>
  );
}
```


#### 🎯 Advanced Context Patterns: Custom Hooks


```javascript
// Advanced pattern: Custom hooks with error boundaries
function useUser() {
  const context = useContext(UserContext);

  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }

  return context;
}

// Selector pattern for performance
function useUserSelector(selector) {
  const context = useContext(UserContext);

  if (context === undefined) {
    throw new Error('useUserSelector must be used within a UserProvider');
  }

  return useMemo(() => selector(context), [context, selector]);
}

// Usage: Only subscribe to specific parts of context
function UserProfile() {
  const userName = useUserSelector(context => context.user?.name);
  const userEmail = useUserSelector(context => context.user?.email);

  return (
    <div>
      <h1>{userName}</h1>
      <p>{userEmail}</p>
    </div>
  );
}

// Advanced: Context with middleware pattern
function createContextWithMiddleware(reducer, middleware = []) {
  const Context = createContext();

  function Provider({ children, initialState }) {
    const [state, baseDispatch] = useReducer(reducer, initialState);

    const dispatch = useMemo(() => {
      return middleware.reduceRight(
        (next, middleware) => middleware(next),
        baseDispatch
      );
    }, [baseDispatch]);

    const value = useMemo(() => ({ state, dispatch }), [state, dispatch]);

    return <Context.Provider value={value}>{children}</Context.Provider>;
  }

  function useContext() {
    const context = React.useContext(Context);
    if (!context) {
      throw new Error('useContext must be used within Provider');
    }
    return context;
  }

  return { Provider, useContext };
}

// Middleware examples
const loggingMiddleware = (next) => (action) => {
  console.log('Dispatching:', action);
  const result = next(action);
  console.log('New state:', result);
  return result;
};

const analyticsMiddleware = (next) => (action) => {
  analytics.track(`Action: ${action.type}`, action.payload);
  return next(action);
};

// Usage
const { Provider: UserProvider, useContext: useUser } =
  createContextWithMiddleware(userReducer, [
    loggingMiddleware,
    analyticsMiddleware
  ]);
```


#### 🎯 Interview Questions: Context API Mastery


**Basic Level**:


1. *"Explain the difference between Context API and props drilling"*
2. *"When would you choose Context over state lifting?"*
3. *"What happens when a Context Provider value changes?"*


**Intermediate Level**:


1. *"How do you optimize Context performance to prevent unnecessary re-renders?"*
2. *"Explain the trade-offs of splitting contexts vs monolithic context"*
3. *"How would you implement selective Context subscriptions?"*


**Advanced Level**:


1. *"Design a Context system for a multi-tenant application"*
2. *"How would you implement Context middleware pattern?"*
3. *"Explain Context memory leaks và prevention strategies"*


**Production Debugging**:


1. *"Components are re-rendering unnecessarily when using Context. Walk through your debugging process."*
2. *"How would you implement Context for a real-time collaborative application?"*
3. *"Design a Context architecture for micro-frontends communication."*


---


## 📖 PHẦN III: GLOBAL STATE MANAGEMENT - BEYOND CONTEXT


### 🔬 Zustand: Lightweight State Management Philosophy


#### 🌱 Nguồn Gốc & Motivation: Context API's Limitations At Scale


Sau 2 năm sử dụng Context API exclusively tại Axon, chúng tôi encountered several limitations:


```javascript
// Problem 1: Provider hell
function App() {
  return (
    <UserProvider>
      <ThemeProvider>
        <NotificationProvider>
          <LanguageProvider>
            <ShoppingCartProvider>
              <WebSocketProvider>
                <AnalyticsProvider>
                  <ActualApp /> {/* Buried under 7 providers! */}
                </AnalyticsProvider>
              </WebSocketProvider>
            </ShoppingCartProvider>
          </LanguageProvider>
        </NotificationProvider>
      </ThemeProvider>
    </UserProvider>
  );
}

// Problem 2: Over-engineering for simple state
const CounterContext = createContext();
function CounterProvider({ children }) {
  const [count, setCount] = useState(0);
  const value = useMemo(() => ({ count, setCount }), [count]);
  return <CounterContext.Provider value={value}>{children}</CounterContext.Provider>;
}
// 15 lines of code để manage một counter!
```


**Enter Zustand** (tạo bởi Poimandres team, 2019):


- Minimal boilerplate
- No providers needed
- TypeScript-first design
- Framework-agnostic (works outside React)
- Tiny bundle size (~2KB)


💭 **Think Out Loud**: *Khi tôi first encountered Zustand, tôi skeptical. "Another state management library?" Nhưng sau khi sử dụng trong 1 tuần tại Webflow project, tôi realized rằng đây chính là philosophy mà tôi đã tìm kiếm: "Make simple things simple, make complex things possible."*


#### ⚙️ Core Mechanism: Zustand's Store Architecture


**Behind The Scenes: Store Creation**


```javascript
// Zustand's internal implementation (simplified)
function create(stateCreator) {
  let state;
  const listeners = new Set();

  const setState = (partial, replace) => {
    const nextState = typeof partial === 'function'
      ? partial(state)
      : partial;

    if (nextState !== state) {
      const previousState = state;
      state = replace ? nextState : { ...state, ...nextState };

      // Notify all subscribers
      listeners.forEach(listener => listener(state, previousState));
    }
  };

  const getState = () => state;

  const subscribe = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener); // Unsubscribe function
  };

  const api = { setState, getState, subscribe };
  state = stateCreator(setState, getState, api);

  return api;
}

// React hook integration
function useStore(store, selector = (state) => state) {
  const [, forceUpdate] = useReducer(c => c + 1, 0);

  useEffect(() => {
    const unsubscribe = store.subscribe((state, previousState) => {
      const selectedState = selector(state);
      const previousSelectedState = selector(previousState);

      if (selectedState !== previousSelectedState) {
        forceUpdate();
      }
    });

    return unsubscribe;
  }, [store, selector]);

  return selector(store.getState());
}
```


**Memory Model: Zustand vs Context**


```javascript
// Context API memory footprint
const ContextStore = {
  providers: 5, // Multiple providers in tree
  subscribers: 20, // All consumers re-render on any change
  memoryUsage: '~50KB', // Provider overhead + React internals
};

// Zustand memory footprint
const ZustandStore = {
  stores: 1, // Single store object
  subscribers: 3, // Only relevant selectors trigger re-renders
  memoryUsage: '~5KB', // Minimal overhead
};
```


#### 🛠️ Implementation Deep Dive: Advanced Zustand Patterns


**Pattern 1: Store Slicing & Selectors**


```javascript
// Complex application state tại Binance
const useTradingStore = create((set, get) => ({
  // Market data slice
  marketData: {
    prices: {},
    volumes: {},
    orderBooks: {}
  },

  // User positions slice
  positions: [],

  // UI state slice
  selectedPair: 'BTC/USDT',
  chartInterval: '1m',

  // Actions grouped by domain
  marketActions: {
    updatePrice: (symbol, price) => set(state => ({
      marketData: {
        ...state.marketData,
        prices: { ...state.marketData.prices, [symbol]: price }
      }
    })),

    updateOrderBook: (symbol, orderBook) => set(state => ({
      marketData: {
        ...state.marketData,
        orderBooks: { ...state.marketData.orderBooks, [symbol]: orderBook }
      }
    }))
  },

  positionActions: {
    addPosition: (position) => set(state => ({
      positions: [...state.positions, position]
    })),

    updatePosition: (id, updates) => set(state => ({
      positions: state.positions.map(p =>
        p.id === id ? { ...p, ...updates } : p
      )
    }))
  },

  uiActions: {
    setSelectedPair: (pair) => set({ selectedPair: pair }),
    setChartInterval: (interval) => set({ chartInterval: interval })
  }
}));

// Optimized selectors để prevent unnecessary re-renders
const useMarketPrice = (symbol) =>
  useTradingStore(state => state.marketData.prices[symbol]);

const usePositions = () =>
  useTradingStore(state => state.positions);

const useSelectedPair = () =>
  useTradingStore(state => state.selectedPair);

// Usage in components
function PriceDisplay({ symbol }) {
  const price = useMarketPrice(symbol); // Only re-renders when this price changes
  return <div>{price}</div>;
}
```


**Pattern 2: Store Composition & Modules**


```javascript
// Modular store architecture
const createUserSlice = (set, get) => ({
  user: null,
  profile: null,
  preferences: {},

  userActions: {
    setUser: (user) => set({ user }),
    updateProfile: (profile) => set({ profile }),
    updatePreferences: (prefs) => set(state => ({
      preferences: { ...state.preferences, ...prefs }
    }))
  }
});

const createNotificationSlice = (set, get) => ({
  notifications: [],
  unreadCount: 0,

  notificationActions: {
    addNotification: (notification) => set(state => ({
      notifications: [...state.notifications, notification],
      unreadCount: state.unreadCount + 1
    })),

    markAsRead: (id) => set(state => ({
      notifications: state.notifications.map(n =>
        n.id === id ? { ...n, read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1)
    }))
  }
});

const createCartSlice = (set, get) => ({
  items: [],
  total: 0,

  cartActions: {
    addItem: (item) => set(state => {
      const newItems = [...state.items, item];
      const newTotal = newItems.reduce((sum, i) => sum + i.price, 0);
      return { items: newItems, total: newTotal };
    }),

    removeItem: (id) => set(state => {
      const newItems = state.items.filter(item => item.id !== id);
      const newTotal = newItems.reduce((sum, i) => sum + i.price, 0);
      return { items: newItems, total: newTotal };
    })
  }
});

// Combine slices into single store
const useAppStore = create((set, get, api) => ({
  ...createUserSlice(set, get, api),
  ...createNotificationSlice(set, get, api),
  ...createCartSlice(set, get, api),
}));

// Typed selectors cho better developer experience
const useUser = () => useAppStore(state => state.user);
const useCart = () => useAppStore(state => ({
  items: state.items,
  total: state.total,
  actions: state.cartActions
}));
```


**Pattern 3: Async Actions & Side Effects**


```javascript
// Advanced async patterns with error handling
const useApiStore = create((set, get) => ({
  data: null,
  loading: false,
  error: null,

  // Async action with loading states
  fetchData: async (id) => {
    set({ loading: true, error: null });

    try {
      const response = await api.getData(id);
      set({ data: response.data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  // Optimistic updates pattern
  updateDataOptimistic: async (id, updates) => {
    // Immediately update UI
    const previousData = get().data;
    set({ data: { ...previousData, ...updates } });

    try {
      await api.updateData(id, updates);
      // Success - data is already updated
    } catch (error) {
      // Rollback on error
      set({ data: previousData, error: error.message });
    }
  },

  // Batch operations
  batchUpdate: (operations) => {
    set(state => {
      let newState = { ...state };

      operations.forEach(op => {
        switch (op.type) {
          case 'ADD_ITEM':
            newState.items = [...newState.items, op.item];
            break;
          case 'REMOVE_ITEM':
            newState.items = newState.items.filter(i => i.id !== op.id);
            break;
          case 'UPDATE_ITEM':
            newState.items = newState.items.map(i =>
              i.id === op.id ? { ...i, ...op.updates } : i
            );
            break;
        }
      });

      return newState;
    });
  }
}));
```


#### 🏭 Production Case Study: Webflow's Visual Builder State


```javascript
// Real-world example: Complex visual builder state management
const useBuilderStore = create((set, get) => ({
  // Canvas state
  canvas: {
    elements: new Map(),
    selectedIds: new Set(),
    hoveredId: null,
    dragState: null,
    viewport: { x: 0, y: 0, zoom: 1 }
  },

  // History management
  history: {
    past: [],
    present: null,
    future: []
  },

  // Actions
  actions: {
    // Element management
    addElement: (element) => set(state => {
      const newElements = new Map(state.canvas.elements);
      newElements.set(element.id, element);

      return {
        canvas: { ...state.canvas, elements: newElements },
        history: pushToHistory(state.history, {
          type: 'ADD_ELEMENT',
          element
        })
      };
    }),

    updateElement: (id, updates) => set(state => {
      const newElements = new Map(state.canvas.elements);
      const element = newElements.get(id);

      if (element) {
        newElements.set(id, { ...element, ...updates });
        return {
          canvas: { ...state.canvas, elements: newElements },
          history: pushToHistory(state.history, {
            type: 'UPDATE_ELEMENT',
            id,
            updates,
            previous: element
          })
        };
      }

      return state;
    }),

    // Selection management
    selectElements: (ids) => set(state => ({
      canvas: {
        ...state.canvas,
        selectedIds: new Set(ids)
      }
    })),

    // Undo/Redo
    undo: () => set(state => {
      if (state.history.past.length === 0) return state;

      const previous = state.history.past[state.history.past.length - 1];
      const newPast = state.history.past.slice(0, -1);

      return {
        ...applyHistoryAction(state, previous, 'undo'),
        history: {
          past: newPast,
          present: previous,
          future: [state.history.present, ...state.history.future]
        }
      };
    }),

    redo: () => set(state => {
      if (state.history.future.length === 0) return state;

      const next = state.history.future[0];
      const newFuture = state.history.future.slice(1);

      return {
        ...applyHistoryAction(state, next, 'redo'),
        history: {
          past: [...state.history.past, state.history.present],
          present: next,
          future: newFuture
        }
      };
    })
  }
}));

// Optimized selectors for performance
const useSelectedElements = () => useBuilderStore(
  state => Array.from(state.canvas.selectedIds).map(id =>
    state.canvas.elements.get(id)
  ).filter(Boolean)
);

const useCanvasViewport = () => useBuilderStore(
  state => state.canvas.viewport
);

const useHistoryState = () => useBuilderStore(
  state => ({
    canUndo: state.history.past.length > 0,
    canRedo: state.history.future.length > 0
  })
);

// Component usage
function Canvas() {
  const elements = useBuilderStore(state => state.canvas.elements);
  const { updateElement } = useBuilderStore(state => state.actions);

  return (
    <div className="canvas">
      {Array.from(elements.entries()).map(([id, element]) => (
        <Element
          key={id}
          data={element}
          onUpdate={(updates) => updateElement(id, updates)}
        />
      ))}
    </div>
  );
}
```


#### 💭 Mental Model: Zustand Performance Optimization


**Understanding Selector Performance**:


```javascript
// ❌ BAD: Selector creates new object every time
const useUserData = () => useAppStore(state => ({
  name: state.user.name,
  email: state.user.email
})); // New object reference causes re-render

// ✅ GOOD: Use multiple selectors
const useUserName = () => useAppStore(state => state.user.name);
const useUserEmail = () => useAppStore(state => state.user.email);

// ✅ BETTER: Memoized selector
const useUserData = () => useAppStore(
  useCallback(state => ({
    name: state.user.name,
    email: state.user.email
  }), [])
);

// ✅ BEST: Use shallow equality
import { shallow } from 'zustand/shallow';

const useUserData = () => useAppStore(
  state => ({ name: state.user.name, email: state.user.email }),
  shallow
);
```


**Advanced Debugging Techniques**:


```javascript
// Debug store changes
const debugStore = (config) => (set, get, api) =>
  config(
    (...args) => {
      console.log('Store updated:', args);
      set(...args);
    },
    get,
    api
  );

// Store performance profiling
const performanceStore = (config) => (set, get, api) => {
  const wrappedSet = (...args) => {
    const start = performance.now();
    set(...args);
    const end = performance.now();
    console.log(`Store update took ${end - start}ms`);
  };

  return config(wrappedSet, get, api);
};

// Usage
const useMyStore = create(
  debugStore(
    performanceStore(
      (set, get) => ({
        // Your store implementation
      })
    )
  )
);
```


#### 🎯 Zustand vs Redux Toolkit Comparison


```javascript
// Same feature implemented in both

// Redux Toolkit approach
const userSlice = createSlice({
  name: 'user',
  initialState: { data: null, loading: false },
  reducers: {
    setUser: (state, action) => {
      state.data = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    }
  }
});

// Store setup
const store = configureStore({
  reducer: { user: userSlice.reducer }
});

// Component usage
function UserProfile() {
  const user = useSelector(state => state.user.data);
  const dispatch = useDispatch();

  const handleUpdate = (userData) => {
    dispatch(userSlice.actions.setUser(userData));
  };
}

// Zustand approach
const useUserStore = create((set) => ({
  user: null,
  loading: false,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading })
}));

// Component usage
function UserProfile() {
  const { user, setUser } = useUserStore();

  const handleUpdate = (userData) => {
    setUser(userData);
  };
}

// Comparison:
// Redux Toolkit: 25+ lines, complex setup, more boilerplate
// Zustand: 8 lines, simple setup, minimal boilerplate
```


#### 🎯 Interview Questions: Zustand Mastery


**Basic Level**:


1. *"Explain how Zustand differs from Context API"*
2. *"What are the advantages of Zustand over Redux?"*
3. *"How does Zustand handle subscriptions internally?"*


**Intermediate Level**:


1. *"How do you optimize performance with Zustand selectors?"*
2. *"Explain store slicing strategies for large applications"*
3. *"How would you implement middleware in Zustand?"*


**Advanced Level**:


1. *"Design a Zustand store for real-time collaborative features"*
2. *"How would you implement time-travel debugging in Zustand?"*
3. *"Compare memory usage and performance of Zustand vs Redux in large apps"*


---


### 🔬 Redux Toolkit: Modern Redux Philosophy


#### 🌱 Nguồn Gốc & Evolution: From Redux Complexity to Toolkit Simplicity


Redux ra đời năm 2015 (Dan Abramov) như một breakthrough trong state management, nhưng quickly became notorious vì boilerplate hell:


```javascript
// Classic Redux - Circa 2016
// Action types
const FETCH_USER_REQUEST = 'FETCH_USER_REQUEST';
const FETCH_USER_SUCCESS = 'FETCH_USER_SUCCESS';
const FETCH_USER_FAILURE = 'FETCH_USER_FAILURE';

// Action creators
const fetchUserRequest = () => ({
  type: FETCH_USER_REQUEST
});

const fetchUserSuccess = (user) => ({
  type: FETCH_USER_SUCCESS,
  payload: user
});

const fetchUserFailure = (error) => ({
  type: FETCH_USER_FAILURE,
  payload: error
});

// Reducer
const userReducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_USER_REQUEST:
      return { ...state, loading: true, error: null };
    case FETCH_USER_SUCCESS:
      return { ...state, loading: false, user: action.payload };
    case FETCH_USER_FAILURE:
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
};

// Thunk for async
const fetchUser = (id) => async (dispatch) => {
  dispatch(fetchUserRequest());
  try {
    const user = await api.getUser(id);
    dispatch(fetchUserSuccess(user));
  } catch (error) {
    dispatch(fetchUserFailure(error.message));
  }
};

// 50+ lines cho một simple async operation!
```


**Redux Toolkit (2019)** được tạo ra để solve these problems:


- Reduce boilerplate drastically
- Include best practices by default
- Better DevTools integration
- Immer integration for immutable updates
- RTK Query for data fetching


💭 **Principal's Perspective**: *Tại NAB, chúng tôi migrated từ classic Redux sang Redux Toolkit. Migration took 3 months nhưng reduced codebase by 40% và dramatically improved developer productivity. Key lesson: Don't stick with old patterns just vì familiarity.*


#### ⚙️ Core Mechanism: RTK's Magic Under The Hood


**createSlice Internals**:


```javascript
// Redux Toolkit's createSlice implementation (simplified)
function createSlice({ name, initialState, reducers, extraReducers }) {
  const actionCreators = {};
  const reducerMap = {};

  // Generate action types and creators
  Object.keys(reducers).forEach(reducerName => {
    const type = `${name}/${reducerName}`;
    actionCreators[reducerName] = (payload) => ({ type, payload });
    reducerMap[type] = reducers[reducerName];
  });

  // Create reducer with Immer integration
  const reducer = (state = initialState, action) => {
    const caseReducer = reducerMap[action.type];

    if (caseReducer) {
      return produce(state, draft => {
        caseReducer(draft, action); // Immer allows "mutations"
      });
    }

    // Handle extraReducers
    if (extraReducers) {
      return extraReducers(state, action);
    }

    return state;
  };

  return {
    actions: actionCreators,
    reducer,
    caseReducers: reducerMap
  };
}
```


**Immer Integration Deep Dive**:


```javascript
// How Immer enables "mutable" updates
import produce from 'immer';

const baseState = {
  user: { name: 'Alice', posts: [{ id: 1, title: 'Hello' }] },
  loading: false
};

// Traditional Redux approach
const newState = {
  ...baseState,
  user: {
    ...baseState.user,
    posts: [
      ...baseState.user.posts,
      { id: 2, title: 'New Post' }
    ]
  }
};

// RTK with Immer approach
const newState = produce(baseState, draft => {
  draft.user.posts.push({ id: 2, title: 'New Post' });
  // Looks like mutation, but creates new immutable state
});

// Immer's internal mechanism:
// 1. Creates proxy of original state
// 2. Records all "mutations" as patches
// 3. Applies patches to create new immutable state
// 4. Maintains structural sharing for unchanged parts
```


#### 🛠️ Implementation Deep Dive: Advanced RTK Patterns


**Pattern 1: Complex State with Nested Updates**


```javascript
// Complex e-commerce state management
const ecommerceSlice = createSlice({
  name: 'ecommerce',
  initialState: {
    products: {},
    categories: {},
    cart: {
      items: [],
      total: 0,
      discounts: [],
      shippingInfo: null
    },
    user: {
      profile: null,
      orders: [],
      wishlist: []
    },
    ui: {
      currentView: 'products',
      filters: {},
      sorting: 'name-asc'
    }
  },
  reducers: {
    // Product management
    setProducts: (state, action) => {
      state.products = action.payload.reduce((acc, product) => {
        acc[product.id] = product;
        return acc;
      }, {});
    },

    updateProduct: (state, action) => {
      const { id, updates } = action.payload;
      if (state.products[id]) {
        Object.assign(state.products[id], updates);
      }
    },

    // Complex cart operations
    addToCart: (state, action) => {
      const { productId, quantity = 1, options = {} } = action.payload;
      const product = state.products[productId];

      if (!product) return;

      const existingItemIndex = state.cart.items.findIndex(
        item => item.productId === productId &&
                 JSON.stringify(item.options) === JSON.stringify(options)
      );

      if (existingItemIndex >= 0) {
        state.cart.items[existingItemIndex].quantity += quantity;
      } else {
        state.cart.items.push({
          id: Date.now(),
          productId,
          quantity,
          options,
          price: product.price
        });
      }

      // Recalculate total
      state.cart.total = state.cart.items.reduce(
        (sum, item) => sum + (item.price * item.quantity), 0
      );
    },

    applyDiscount: (state, action) => {
      const discount = action.payload;
      const existingIndex = state.cart.discounts.findIndex(
        d => d.code === discount.code
      );

      if (existingIndex >= 0) {
        state.cart.discounts[existingIndex] = discount;
      } else {
        state.cart.discounts.push(discount);
      }

      // Recalculate total with discounts
      const subtotal = state.cart.items.reduce(
        (sum, item) => sum + (item.price * item.quantity), 0
      );

      const totalDiscount = state.cart.discounts.reduce(
        (sum, discount) => sum + discount.amount, 0
      );

      state.cart.total = Math.max(0, subtotal - totalDiscount);
    },

    // Advanced filtering
    setFilters: (state, action) => {
      const { category, priceRange, brand, inStock } = action.payload;

      state.ui.filters = {
        ...state.ui.filters,
        ...(category !== undefined && { category }),
        ...(priceRange !== undefined && { priceRange }),
        ...(brand !== undefined && { brand }),
        ...(inStock !== undefined && { inStock })
      };
    },

    // Batch operations
    batchUpdateCart: (state, action) => {
      const operations = action.payload;

      operations.forEach(op => {
        switch (op.type) {
          case 'UPDATE_QUANTITY':
            const item = state.cart.items.find(i => i.id === op.itemId);
            if (item) item.quantity = op.quantity;
            break;

          case 'REMOVE_ITEM':
            state.cart.items = state.cart.items.filter(i => i.id !== op.itemId);
            break;

          case 'APPLY_COUPON':
            if (!state.cart.discounts.find(d => d.code === op.code)) {
              state.cart.discounts.push(op.discount);
            }
            break;
        }
      });

      // Recalculate total after all operations
      const subtotal = state.cart.items.reduce(
        (sum, item) => sum + (item.price * item.quantity), 0
      );
      const totalDiscount = state.cart.discounts.reduce(
        (sum, discount) => sum + discount.amount, 0
      );
      state.cart.total = Math.max(0, subtotal - totalDiscount);
    }
  }
});
```


**Pattern 2: RTK Query Integration**


```javascript
// Advanced API slice với complex caching strategies
const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    }
  }),
  tagTypes: ['Product', 'User', 'Order'],
  endpoints: (builder) => ({
    // Get products với advanced caching
    getProducts: builder.query({
      query: ({ category, page = 1, limit = 10, filters = {} }) => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
          ...(category && { category }),
          ...filters
        });
        return `products?${params}`;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Product', id })),
              { type: 'Product', id: 'LIST' }
            ]
          : [{ type: 'Product', id: 'LIST' }],
      serializeQueryArgs: ({ queryArgs, endpointDefinition, endpointName }) => {
        // Custom cache key generation
        const { page, ...otherArgs } = queryArgs;
        return `${endpointName}-${JSON.stringify(otherArgs)}`;
      },
      merge: (currentCache, newItems, { arg }) => {
        if (arg.page === 1) {
          return newItems;
        }
        return [...currentCache, ...newItems];
      },
      forceRefetch({ currentArg, previousArg }) {
        return currentArg?.page !== previousArg?.page;
      }
    }),

    // Optimistic updates
    updateProduct: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `products/${id}`,
        method: 'PATCH',
        body: patch
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Product', id },
        { type: 'Product', id: 'LIST' }
      ],
      onQueryStarted: async ({ id, ...patch }, { dispatch, queryFulfilled }) => {
        // Optimistic update
        const patchResult = dispatch(
          apiSlice.util.updateQueryData('getProducts', undefined, draft => {
            const product = draft.find(p => p.id === id);
            if (product) {
              Object.assign(product, patch);
            }
          })
        );

        try {
          await queryFulfilled;
        } catch {
          // Rollback on error
          patchResult.undo();
        }
      }
    }),

    // Streaming updates
    getOrderStatus: builder.query({
      query: (orderId) => `orders/${orderId}/status`,
      onCacheEntryAdded: async (
        orderId,
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved }
      ) => {
        const ws = new WebSocket(`ws://api.example.com/orders/${orderId}`);

        try {
          await cacheDataLoaded;

          const listener = (event) => {
            const data = JSON.parse(event.data);
            updateCachedData((draft) => {
              Object.assign(draft, data);
            });
          };

          ws.addEventListener('message', listener);
        } catch {
          // no-op in case `cacheEntryRemoved` resolves before `cacheDataLoaded`,
          // in which case `cacheDataLoaded` will throw
        }

        await cacheEntryRemoved;
        ws.close();
      }
    })
  })
});

export const {
  useGetProductsQuery,
  useUpdateProductMutation,
  useGetOrderStatusQuery
} = apiSlice;
```


#### 🏭 Production Case Study: Binance Trading Platform Redux


```javascript
// Real-world example: High-frequency trading state management
const tradingSlice = createSlice({
  name: 'trading',
  initialState: {
    // Market data
    symbols: {},
    tickerData: {},
    orderBooks: {},
    recentTrades: {},

    // User trading state
    account: {
      balances: {},
      positions: [],
      orders: []
    },

    // UI state
    selectedSymbol: 'BTCUSDT',
    chartData: {},
    activeOrders: new Set(),

    // Performance tracking
    lastUpdate: null,
    updateCount: 0
  },
  reducers: {
    // High-frequency price updates
    updateTicker: (state, action) => {
      const ticker = action.payload;

      // Batch multiple tickers for performance
      if (Array.isArray(ticker)) {
        ticker.forEach(t => {
          state.tickerData[t.symbol] = t;
        });
      } else {
        state.tickerData[ticker.symbol] = ticker;
      }

      state.lastUpdate = Date.now();
      state.updateCount++;
    },

    // OrderBook updates với efficient merging
    updateOrderBook: (state, action) => {
      const { symbol, bids, asks, lastUpdateId } = action.payload;

      if (!state.orderBooks[symbol]) {
        state.orderBooks[symbol] = { bids: [], asks: [], lastUpdateId: 0 };
      }

      const orderBook = state.orderBooks[symbol];

      // Skip outdated updates
      if (lastUpdateId <= orderBook.lastUpdateId) return;

      // Merge bids and asks efficiently
      if (bids) {
        mergePriceLevels(orderBook.bids, bids);
      }

      if (asks) {
        mergePriceLevels(orderBook.asks, asks);
      }

      orderBook.lastUpdateId = lastUpdateId;
    },

    // Order management với optimistic updates
    placeOrder: (state, action) => {
      const order = {
        ...action.payload,
        id: `temp_${Date.now()}`,
        status: 'PENDING',
        timestamp: Date.now()
      };

      state.account.orders.push(order);
      state.activeOrders.add(order.id);
    },

    confirmOrder: (state, action) => {
      const { tempId, confirmedOrder } = action.payload;

      // Replace temporary order with confirmed one
      const index = state.account.orders.findIndex(o => o.id === tempId);
      if (index >= 0) {
        state.account.orders[index] = confirmedOrder;
        state.activeOrders.delete(tempId);
        state.activeOrders.add(confirmedOrder.id);
      }
    },

    rejectOrder: (state, action) => {
      const { tempId, error } = action.payload;

      // Remove rejected order
      state.account.orders = state.account.orders.filter(o => o.id !== tempId);
      state.activeOrders.delete(tempId);
    },

    // Balance updates với precise calculation
    updateBalance: (state, action) => {
      const balances = action.payload;

      Object.entries(balances).forEach(([asset, balance]) => {
        state.account.balances[asset] = {
          free: balance.free,
          locked: balance.locked,
          total: parseFloat(balance.free) + parseFloat(balance.locked)
        };
      });
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase('ws/connected', (state) => {
        state.wsConnected = true;
      })
      .addCase('ws/disconnected', (state) => {
        state.wsConnected = false;
      });
  }
});

// Helper function for order book merging
function mergePriceLevels(existing, updates) {
  updates.forEach(([price, quantity]) => {
    const priceFloat = parseFloat(price);
    const quantityFloat = parseFloat(quantity);

    const existingIndex = existing.findIndex(
      level => parseFloat(level[0]) === priceFloat
    );

    if (quantityFloat === 0) {
      // Remove price level
      if (existingIndex >= 0) {
        existing.splice(existingIndex, 1);
      }
    } else if (existingIndex >= 0) {
      // Update existing level
      existing[existingIndex][1] = quantity;
    } else {
      // Add new level và sort
      existing.push([price, quantity]);
      existing.sort((a, b) => parseFloat(b[0]) - parseFloat(a[0]));
    }
  });
}

// Selectors với memoization for performance
const selectOrderBookBySymbol = createSelector(
  [state => state.trading.orderBooks, (_, symbol) => symbol],
  (orderBooks, symbol) => orderBooks[symbol] || { bids: [], asks: [] }
);

const selectAccountValue = createSelector(
  [state => state.trading.account.balances, state => state.trading.tickerData],
  (balances, tickers) => {
    return Object.entries(balances).reduce((total, [asset, balance]) => {
      if (asset === 'USDT') {
        return total + balance.total;
      }

      const ticker = tickers[`${asset}USDT`];
      if (ticker) {
        return total + (balance.total * parseFloat(ticker.price));
      }

      return total;
    }, 0);
  }
);
```


#### 💭 Mental Model: Redux Toolkit Debugging Strategies


**Performance Debugging**:


```javascript
// Selector performance tracking
const createTrackedSelector = (name, selector) => {
  return createSelector(selector, (result) => {
    console.log(`Selector ${name} recomputed:`, result);
    return result;
  });
};

// Action tracking middleware
const actionLogger = (store) => (next) => (action) => {
  const start = performance.now();
  const result = next(action);
  const end = performance.now();

  console.log(`Action ${action.type} took ${end - start}ms`);
  return result;
};

// State diff tracking
let previousState;
const stateDiffer = (store) => (next) => (action) => {
  const result = next(action);
  const currentState = store.getState();

  if (previousState) {
    const diff = deepDiff(previousState, currentState);
    console.log(`State changes from ${action.type}:`, diff);
  }

  previousState = currentState;
  return result;
};
```


**Common Debugging Scenarios**:


1. **Unnecessary re-renders**


```javascript
// Debug component re-renders with useSelector
function MyComponent() {
  const data = useSelector(state => {
    console.log('Selector running'); // Runs on every state change
    return {
      user: state.user, // Creates new object reference!
      products: state.products
    };
  });

  // Fix with proper memoization
  const data = useSelector(createSelector(
    state => state.user,
    state => state.products,
    (user, products) => ({ user, products })
  ));
}
```


1. **State mutation bugs**


```javascript
// RTK mutation detection
const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER]
      },
      immutableCheck: { warnAfter: 128 } // Warn after 128ms
    })
});
```


#### 🎯 Interview Questions: Redux Toolkit Expertise


**Basic Level**:


1. *"Explain the main advantages of Redux Toolkit over classic Redux"*
2. *"How does createSlice work internally?"*
3. *"What is the role of Immer in Redux Toolkit?"*


**Intermediate Level**:


1. *"How do you handle side effects in Redux Toolkit?"*
2. *"Explain RTK Query và its advantages over manual API calls"*
3. *"How do you optimize Redux selectors for performance?"*


**Advanced Level**:


1. *"Design a Redux architecture for real-time trading application"*
2. *"How would you implement optimistic updates with rollback capability?"*
3. *"Compare memory usage và performance of RTK vs Zustand in high-frequency updates"*


**Production Scenarios**:


1. *"Your Redux store is causing performance issues. Walk through your debugging process."*
2. *"How would you migrate a large legacy Redux codebase to Redux Toolkit?"*
3. *"Design a state management strategy for micro-frontends using Redux."*


---


## 📖 PHẦN IV: SIBLING & ADVANCED COMMUNICATION PATTERNS


### 🔬 Brother Components: State Lifting Patterns


#### 🌱 Nguồn Gốc & Motivation: The Common Parent Strategy


Brother (sibling) components không thể directly communicate trong React's one-way data flow model. Data must flow through common ancestors. Đây là fundamental constraint, nhưng cũng là blessing in disguise - nó enforces clear data ownership và predictable updates.


Tại Figma, chúng tôi có một classic scenario:


- `LayersList` component (displays layers)
- `PropertiesPanel` component (shows selected layer properties)
- Cả hai cần sync khi user selects một layer


```javascript
// ❌ BAD: Brothers trying to communicate directly
function LayersList() {
  const [selectedLayer, setSelectedLayer] = useState(null);

  // How to tell PropertiesPanel about selection change? 🤔
  const handleLayerSelect = (layer) => {
    setSelectedLayer(layer);
    // No direct way to notify sibling!
  };
}

function PropertiesPanel() {
  // How to know which layer is selected? 🤔
  return <div>Properties for ???</div>;
}
```


**Solution: State Lifting Pattern**


```javascript
// ✅ GOOD: Common parent manages shared state
function DesignEditor() {
  const [selectedLayer, setSelectedLayer] = useState(null);

  return (
    <div className="editor">
      <LayersList
        selectedLayer={selectedLayer}
        onLayerSelect={setSelectedLayer}
      />
      <Canvas selectedLayer={selectedLayer} />
      <PropertiesPanel layer={selectedLayer} />
    </div>
  );
}
```


💭 **Think Out Loud**: *Ban đầu, tôi frustrated với pattern này vì nó seemed like "extra work". Tại sao không để components tự manage their state? Nhưng sau nhiều năm, tôi realized rằng state lifting actually creates clearer mental models, easier testing, và better separation of concerns.*


#### ⚙️ Core Mechanism: State Lifting Deep Dive


**Principle 1: Single Source of Truth**


```javascript
// State ownership hierarchy
function App() {
  // App-level state: Authentication, routing, global UI
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState('light');

  return (
    <ShoppingCart user={user} theme={theme} />
  );
}

function ShoppingCart({ user, theme }) {
  // Cart-level state: Items, checkout process
  const [items, setItems] = useState([]);
  const [checkoutStep, setCheckoutStep] = useState(1);

  return (
    <div>
      <CartItems
        items={items}
        onUpdateItem={(id, changes) => {
          setItems(prev => prev.map(item =>
            item.id === id ? { ...item, ...changes } : item
          ));
        }}
      />
      <CheckoutSummary items={items} step={checkoutStep} />
      <CheckoutButton
        onNext={() => setCheckoutStep(step => step + 1)}
      />
    </div>
  );
}
```


**Principle 2: Callback Coordination**


```javascript
// Advanced callback patterns for brother coordination
function Dashboard() {
  const [selectedMetric, setSelectedMetric] = useState('revenue');
  const [dateRange, setDateRange] = useState({ start: '2024-01-01', end: '2024-12-31' });
  const [filters, setFilters] = useState({});

  // Coordinated state updates
  const handleMetricChange = useCallback((metric) => {
    setSelectedMetric(metric);
    // Reset filters when metric changes
    setFilters({});
  }, []);

  const handleDateRangeChange = useCallback((newRange) => {
    setDateRange(newRange);
    // Could trigger data refetch
  }, []);

  return (
    <div className="dashboard">
      <MetricSelector
        value={selectedMetric}
        onChange={handleMetricChange}
      />
      <DateRangePicker
        value={dateRange}
        onChange={handleDateRangeChange}
      />
      <FilterPanel
        filters={filters}
        onChange={setFilters}
        availableFilters={getFiltersForMetric(selectedMetric)}
      />
      <ChartArea
        metric={selectedMetric}
        dateRange={dateRange}
        filters={filters}
      />
      <DataTable
        metric={selectedMetric}
        dateRange={dateRange}
        filters={filters}
      />
    </div>
  );
}
```


#### 🛠️ Advanced State Lifting Patterns


**Pattern 1: State Lifting with Derived State**


```javascript
// Complex derived state calculations
function ECommerceDashboard() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [user, setUser] = useState(null);

  // Derived state calculations
  const cartSummary = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => {
      const product = products.find(p => p.id === item.productId);
      return sum + (product?.price || 0) * item.quantity;
    }, 0);

    const tax = subtotal * 0.1;
    const shipping = subtotal > 50 ? 0 : 10;
    const total = subtotal + tax + shipping;

    return { subtotal, tax, shipping, total };
  }, [cart, products]);

  const productAvailability = useMemo(() => {
    return products.reduce((acc, product) => {
      const cartQuantity = cart
        .filter(item => item.productId === product.id)
        .reduce((sum, item) => sum + item.quantity, 0);

      acc[product.id] = {
        available: product.stock - cartQuantity,
        inCart: cartQuantity
      };

      return acc;
    }, {});
  }, [products, cart]);

  // Coordinated actions
  const handleAddToCart = useCallback((productId, quantity) => {
    const availability = productAvailability[productId];

    if (availability.available >= quantity) {
      setCart(prev => {
        const existingItem = prev.find(item => item.productId === productId);

        if (existingItem) {
          return prev.map(item =>
            item.productId === productId
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        }

        return [...prev, { productId, quantity }];
      });
    }
  }, [productAvailability]);

  return (
    <div className="ecommerce-dashboard">
      <ProductCatalog
        products={products}
        availability={productAvailability}
        onAddToCart={handleAddToCart}
      />

      <ShoppingCart
        items={cart}
        products={products}
        onUpdateQuantity={(productId, quantity) => {
          setCart(prev => prev.map(item =>
            item.productId === productId
              ? { ...item, quantity }
              : item
          ));
        }}
        onRemoveItem={(productId) => {
          setCart(prev => prev.filter(item => item.productId !== productId));
        }}
      />

      <OrderSummary
        summary={cartSummary}
        user={user}
        onCheckout={() => {
          // Handle checkout process
        }}
      />
    </div>
  );
}
```


**Pattern 2: Multi-Level State Lifting**


```javascript
// Complex nested state lifting scenario - Webflow style builder
function WebflowBuilder() {
  // Top-level design state
  const [document, setDocument] = useState({ pages: [], assets: [] });
  const [selectedPageId, setSelectedPageId] = useState(null);
  const [designMode, setDesignMode] = useState('design'); // design, preview, export

  // Derived state
  const selectedPage = useMemo(() =>
    document.pages.find(p => p.id === selectedPageId),
    [document.pages, selectedPageId]
  );

  return (
    <div className="webflow-builder">
      <Toolbar
        mode={designMode}
        onModeChange={setDesignMode}
        document={document}
        onExport={() => {/* export logic */}}
      />

      <Sidebar
        pages={document.pages}
        selectedPageId={selectedPageId}
        onPageSelect={setSelectedPageId}
        onPageCreate={(page) => {
          setDocument(prev => ({
            ...prev,
            pages: [...prev.pages, page]
          }));
          setSelectedPageId(page.id);
        }}
      />

      {selectedPage && (
        <PageEditor
          page={selectedPage}
          mode={designMode}
          assets={document.assets}
          onPageUpdate={(updates) => {
            setDocument(prev => ({
              ...prev,
              pages: prev.pages.map(p =>
                p.id === selectedPageId ? { ...p, ...updates } : p
              )
            }));
          }}
          onAssetUpload={(asset) => {
            setDocument(prev => ({
              ...prev,
              assets: [...prev.assets, asset]
            }));
          }}
        />
      )}
    </div>
  );
}

function PageEditor({ page, mode, assets, onPageUpdate, onAssetUpload }) {
  // Page-level state
  const [selectedElementId, setSelectedElementId] = useState(null);
  const [clipboard, setClipboard] = useState(null);
  const [history, setHistory] = useState({ past: [], future: [] });

  const selectedElement = useMemo(() =>
    page.elements.find(e => e.id === selectedElementId),
    [page.elements, selectedElementId]
  );

  const handleElementUpdate = useCallback((elementId, updates) => {
    const newElements = page.elements.map(e =>
      e.id === elementId ? { ...e, ...updates } : e
    );

    onPageUpdate({ elements: newElements });

    // Add to history
    setHistory(prev => ({
      past: [...prev.past, page.elements],
      future: []
    }));
  }, [page.elements, onPageUpdate]);

  return (
    <div className="page-editor">
      <Canvas
        elements={page.elements}
        selectedElementId={selectedElementId}
        onElementSelect={setSelectedElementId}
        onElementUpdate={handleElementUpdate}
        mode={mode}
      />

      <ElementsPanel
        elements={page.elements}
        selectedElementId={selectedElementId}
        onElementSelect={setSelectedElementId}
        onElementDelete={(elementId) => {
          const newElements = page.elements.filter(e => e.id !== elementId);
          onPageUpdate({ elements: newElements });
        }}
      />

      <PropertiesPanel
        element={selectedElement}
        onElementUpdate={(updates) =>
          handleElementUpdate(selectedElementId, updates)
        }
      />

      <AssetsPanel
        assets={assets}
        onAssetUpload={onAssetUpload}
        onAssetSelect={(asset) => {
          if (selectedElementId) {
            handleElementUpdate(selectedElementId, {
              backgroundImage: asset.url
            });
          }
        }}
      />
    </div>
  );
}
```


#### 🏭 Production Case Study: NAB Banking Dashboard State Coordination


```javascript
// Real-world banking dashboard với complex brother coordination
function BankingDashboard({ userId }) {
  // Top-level banking state
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [dateRange, setDateRange] = useState(getDefaultDateRange());
  const [transactionFilters, setTransactionFilters] = useState({});
  const [view, setView] = useState('overview'); // overview, transactions, analytics

  // Derived state
  const selectedAccount = useMemo(() =>
    accounts.find(acc => acc.id === selectedAccountId),
    [accounts, selectedAccountId]
  );

  const accountSummary = useMemo(() => {
    if (!selectedAccount) return null;

    const transactions = selectedAccount.transactions.filter(tx => {
      const txDate = new Date(tx.date);
      return txDate >= dateRange.start && txDate <= dateRange.end;
    });

    const balance = transactions.reduce((sum, tx) => sum + tx.amount, 0);
    const income = transactions.filter(tx => tx.amount > 0).reduce((sum, tx) => sum + tx.amount, 0);
    const expenses = transactions.filter(tx => tx.amount < 0).reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

    return { balance, income, expenses, transactionCount: transactions.length };
  }, [selectedAccount, dateRange]);

  // Cross-component coordinated actions
  const handleAccountChange = useCallback((accountId) => {
    setSelectedAccountId(accountId);
    // Reset filters when account changes
    setTransactionFilters({});
    // Auto-switch to overview for new account
    setView('overview');
  }, []);

  const handleDateRangeChange = useCallback((newRange) => {
    setDateRange(newRange);
    // Could trigger analytics recalculation
  }, []);

  const handleTransactionSelect = useCallback((transactionId) => {
    // When transaction selected, switch to transaction view
    setView('transactions');
    setTransactionFilters({ selectedId: transactionId });
  }, []);

  return (
    <div className="banking-dashboard">
      <DashboardHeader
        user={userId}
        view={view}
        onViewChange={setView}
        dateRange={dateRange}
        onDateRangeChange={handleDateRangeChange}
      />

      <AccountsSidebar
        accounts={accounts}
        selectedAccountId={selectedAccountId}
        onAccountSelect={handleAccountChange}
        summary={accountSummary}
      />

      <MainContent
        view={view}
        account={selectedAccount}
        dateRange={dateRange}
        filters={transactionFilters}
        onFiltersChange={setTransactionFilters}
        onTransactionSelect={handleTransactionSelect}
      />

      <QuickActions
        account={selectedAccount}
        onTransfer={(transferData) => {
          // Update account balance optimistically
          setAccounts(prev => prev.map(acc => {
            if (acc.id === transferData.fromAccountId) {
              return {
                ...acc,
                balance: acc.balance - transferData.amount,
                transactions: [{
                  id: Date.now(),
                  amount: -transferData.amount,
                  description: `Transfer to ${transferData.toAccountName}`,
                  date: new Date().toISOString()
                }, ...acc.transactions]
              };
            }
            return acc;
          }));
        }}
        onPayBill={(billData) => {
          // Similar optimistic update for bill payment
        }}
      />
    </div>
  );
}

function MainContent({ view, account, dateRange, filters, onFiltersChange, onTransactionSelect }) {
  // View-specific rendering with coordinated state
  switch (view) {
    case 'overview':
      return (
        <AccountOverview
          account={account}
          dateRange={dateRange}
          onTransactionSelect={onTransactionSelect}
        />
      );

    case 'transactions':
      return (
        <TransactionsView
          account={account}
          dateRange={dateRange}
          filters={filters}
          onFiltersChange={onFiltersChange}
          onTransactionSelect={onTransactionSelect}
        />
      );

    case 'analytics':
      return (
        <AnalyticsView
          account={account}
          dateRange={dateRange}
        />
      );

    default:
      return null;
  }
}
```


#### 💭 Mental Model: State Lifting Performance Optimization


**Performance Considerations**:


1. **Minimize unnecessary re-renders**


```javascript
// Problem: Parent re-renders cause all children to re-render
function Parent() {
  const [sharedState, setSharedState] = useState({});
  const [unrelatedState, setUnrelatedState] = useState(0);

  return (
    <div>
      <ChildA data={sharedState} onChange={setSharedState} />
      <ChildB data={sharedState} />
      <UnrelatedChild /> {/* Re-renders when unrelatedState changes */}
    </div>
  );
}

// Solution: Split state và memoization
function Parent() {
  const [sharedState, setSharedState] = useState({});
  const [unrelatedState, setUnrelatedState] = useState(0);

  const memoizedSharedData = useMemo(() => sharedState, [sharedState]);

  return (
    <div>
      <ChildA data={memoizedSharedData} onChange={setSharedState} />
      <ChildB data={memoizedSharedData} />
      <UnrelatedChild count={unrelatedState} /> {/* Memoized */}
    </div>
  );
}

const UnrelatedChild = React.memo(({ count }) => {
  return <div>Count: {count}</div>;
});
```


1. **State colocation strategies**


```javascript
// ❌ BAD: All state lifted to top level
function App() {
  const [userProfile, setUserProfile] = useState({});
  const [shoppingCart, setShoppingCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalState, setModalState] = useState({ isOpen: false });
  // ... 20 more state variables

  // Every state change re-renders entire app!
}

// ✅ GOOD: Strategic state placement
function App() {
  const [userProfile, setUserProfile] = useState({});

  return (
    <div>
      <Header user={userProfile} />
      <ShoppingSection user={userProfile} />
      <SearchSection />
    </div>
  );
}

function ShoppingSection({ user }) {
  const [cart, setCart] = useState([]);
  // Cart state only affects shopping components

  return (
    <div>
      <ProductList onAddToCart={(item) => setCart(prev => [...prev, item])} />
      <Cart items={cart} onUpdateCart={setCart} />
    </div>
  );
}

function SearchSection() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  // Search state isolated from rest of app

  return (
    <div>
      <SearchInput value={query} onChange={setQuery} />
      <SearchResults results={results} />
    </div>
  );
}
```


#### 🎯 Interview Questions: State Lifting Mastery


**Basic Level**:


1. *"Why can't sibling components communicate directly in React?"*
2. *"Explain the state lifting pattern với a practical example"*
3. *"When should you lift state up vs keep it local?"*


**Intermediate Level**:


1. *"How do you optimize performance when lifting state causes unnecessary re-renders?"*
2. *"Explain the trade-offs between state lifting và Context API"*
3. *"How would you handle complex coordinated state updates between siblings?"*


**Advanced Level**:


1. *"Design a state architecture for a collaborative document editor"*
2. *"How would you implement undo/redo with lifted state?"*
3. *"Compare state lifting patterns in large vs small applications"*


**Production Scenarios**:


1. *"You have 5 sibling components that need to share complex state. Walk through your architecture decisions."*
2. *"How would you refactor a component tree with performance issues due to excessive state lifting?"*
3. *"Design state management for a real-time multiplayer game using state lifting."*


---


### 🔬 Advanced Communication: Refs & useImperativeHandle


#### 🌱 Nguồn Gốc & Motivation: Breaking The Declarative Paradigm


React được thiết kế theo declarative paradigm - bạn describe **what** the UI should look like, không phải **how** to manipulate it. Nhưng có những scenarios mà chúng ta cần imperative access:


- Focus management
- Scroll positioning
- Animation triggering
- Third-party library integration
- Canvas/WebGL manipulation


Refs provide the "escape hatch" để access DOM elements hoặc component instances directly.


```javascript
// Declarative approach - React's preferred way
function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  return (
    <div>
      {error && <div className="error">{error}</div>}
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        type="password"
      />
      <button onClick={handleSubmit}>Login</button>
    </div>
  );
}

// Sometimes imperative access is necessary
function LoginFormWithFocus() {
  const emailRef = useRef();
  const passwordRef = useRef();
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await login(emailRef.current.value, passwordRef.current.value);
    } catch (err) {
      setError(err.message);
      // Focus first field with error
      if (err.field === 'email') {
        emailRef.current.focus();
      } else if (err.field === 'password') {
        passwordRef.current.focus();
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input ref={emailRef} placeholder="Email" />
      <input ref={passwordRef} placeholder="Password" type="password" />
      <button type="submit">Login</button>
    </form>
  );
}
```


💭 **Think Out Loud**: *Ban đầu, tôi overused refs vì nó felt more familiar (coming from jQuery background). Big mistake! Refs should be your last resort, chỉ sử dụng khi declarative approach không sufficient. Tại Figma, chúng tôi có rule: "Justify every ref usage in code review."*


#### ⚙️ Core Mechanism: Refs Under The Hood


**useRef Implementation Insights**:


```javascript
// Simplified useRef implementation
function useRef(initialValue) {
  const [ref] = useState(() => ({ current: initialValue }));
  return ref;
}

// Key insight: ref.current mutations không trigger re-renders
function Component() {
  const ref = useRef(0);

  const increment = () => {
    ref.current += 1; // No re-render!
    console.log(ref.current); // Updates silently
  };

  return <button onClick={increment}>Count: {ref.current}</button>;
  // UI won't update because no re-render triggered
}
```


**Ref Attachment Process**:


```javascript
// When React encounters ref prop
function MyComponent() {
  const divRef = useRef();

  return <div ref={divRef}>Content</div>;
  // React internally:
  // 1. Creates/finds DOM element
  // 2. Assigns element to divRef.current
  // 3. Element accessible after render
}

useEffect(() => {
  console.log(divRef.current); // DOM element available
  divRef.current.style.backgroundColor = 'red';
}, []); // Runs after DOM creation
```


#### 🛠️ useImperativeHandle: Custom Ref APIs


**Basic Pattern**:


```javascript
// Child component exposes custom API
const CustomInput = forwardRef((props, ref) => {
  const inputRef = useRef();
  const [value, setValue] = useState('');
  const [isValid, setIsValid] = useState(true);

  // Expose custom methods to parent
  useImperativeHandle(ref, () => ({
    // Public API methods
    focus: () => {
      inputRef.current?.focus();
    },

    blur: () => {
      inputRef.current?.blur();
    },

    getValue: () => value,

    setValue: (newValue) => {
      setValue(newValue);
      setIsValid(validateValue(newValue));
    },

    clear: () => {
      setValue('');
      setIsValid(true);
    },

    validate: () => {
      const valid = validateValue(value);
      setIsValid(valid);
      return valid;
    },

    // Expose validation state
    get isValid() {
      return isValid;
    }
  }), [value, isValid]); // Dependencies for memoization

  return (
    <div className={`custom-input ${isValid ? '' : 'error'}`}>
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        {...props}
      />
      {!isValid && <span className="error-message">Invalid input</span>}
    </div>
  );
});

// Parent component usage
function Form() {
  const emailRef = useRef();
  const passwordRef = useRef();

  const handleSubmit = () => {
    // Use custom APIs
    if (!emailRef.current.validate()) {
      emailRef.current.focus();
      return;
    }

    if (!passwordRef.current.validate()) {
      passwordRef.current.focus();
      return;
    }

    const formData = {
      email: emailRef.current.getValue(),
      password: passwordRef.current.getValue()
    };

    submitForm(formData);
  };

  const handleReset = () => {
    emailRef.current.clear();
    passwordRef.current.clear();
  };

  return (
    <div>
      <CustomInput
        ref={emailRef}
        placeholder="Email"
        type="email"
      />
      <CustomInput
        ref={passwordRef}
        placeholder="Password"
        type="password"
      />
      <button onClick={handleSubmit}>Submit</button>
      <button onClick={handleReset}>Reset</button>
    </div>
  );
}
```


#### 🏭 Production Case Study: Figma Canvas Refs Architecture


```javascript
// Complex canvas manipulation using refs
const CanvasLayer = forwardRef(({ layer, isSelected, onSelect }, ref) => {
  const elementRef = useRef();
  const transformRef = useRef();
  const animationRef = useRef();

  // Expose complex canvas operations
  useImperativeHandle(ref, () => ({
    // Transform operations
    move: (deltaX, deltaY) => {
      if (elementRef.current) {
        const currentTransform = getComputedTransform(elementRef.current);
        const newX = currentTransform.x + deltaX;
        const newY = currentTransform.y + deltaY;

        elementRef.current.style.transform =
          `translate(${newX}px, ${newY}px) rotate(${currentTransform.rotation}deg) scale(${currentTransform.scale})`;

        // Update internal transform state
        transformRef.current = { x: newX, y: newY, ...currentTransform };
      }
    },

    rotate: (angle) => {
      if (elementRef.current) {
        const currentTransform = transformRef.current || getComputedTransform(elementRef.current);
        const newRotation = currentTransform.rotation + angle;

        elementRef.current.style.transform =
          `translate(${currentTransform.x}px, ${currentTransform.y}px) rotate(${newRotation}deg) scale(${currentTransform.scale})`;

        transformRef.current = { ...currentTransform, rotation: newRotation };
      }
    },

    scale: (scaleX, scaleY = scaleX) => {
      if (elementRef.current) {
        const currentTransform = transformRef.current || getComputedTransform(elementRef.current);

        elementRef.current.style.transform =
          `translate(${currentTransform.x}px, ${currentTransform.y}px) rotate(${currentTransform.rotation}deg) scale(${scaleX}, ${scaleY})`;

        transformRef.current = { ...currentTransform, scaleX, scaleY };
      }
    },

    // Animation operations
    animateTo: (targetTransform, duration = 300) => {
      if (animationRef.current) {
        animationRef.current.cancel();
      }

      const startTransform = transformRef.current || getComputedTransform(elementRef.current);
      const startTime = performance.now();

      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = easeInOutCubic(progress);

        const currentTransform = {
          x: lerp(startTransform.x, targetTransform.x, eased),
          y: lerp(startTransform.y, targetTransform.y, eased),
          rotation: lerp(startTransform.rotation, targetTransform.rotation || 0, eased),
          scaleX: lerp(startTransform.scaleX || 1, targetTransform.scaleX || 1, eased),
          scaleY: lerp(startTransform.scaleY || 1, targetTransform.scaleY || 1, eased)
        };

        elementRef.current.style.transform =
          `translate(${currentTransform.x}px, ${currentTransform.y}px) ` +
          `rotate(${currentTransform.rotation}deg) ` +
          `scale(${currentTransform.scaleX}, ${currentTransform.scaleY})`;

        transformRef.current = currentTransform;

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        }
      };

      animationRef.current = requestAnimationFrame(animate);
    },

    // Utility methods
    getBoundingRect: () => {
      return elementRef.current?.getBoundingClientRect();
    },

    getTransform: () => {
      return transformRef.current || getComputedTransform(elementRef.current);
    },

    highlight: (color = '#007AFF') => {
      if (elementRef.current) {
        elementRef.current.style.boxShadow = `0 0 0 2px ${color}`;
      }
    },

    removeHighlight: () => {
      if (elementRef.current) {
        elementRef.current.style.boxShadow = '';
      }
    },

    // Export operations
    exportToImage: async (format = 'png', quality = 1) => {
      if (!elementRef.current) return null;

      // Create canvas for export
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const rect = elementRef.current.getBoundingClientRect();

      canvas.width = rect.width;
      canvas.height = rect.height;

      // Use html2canvas or similar library
      const dataUrl = await html2canvas(elementRef.current, {
        format,
        quality,
        backgroundColor: null
      });

      return dataUrl;
    }
  }), [layer, isSelected]);

  // Cleanup animations on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        animationRef.current.cancel();
      }
    };
  }, []);

  return (
    <div
      ref={elementRef}
      className={`canvas-layer ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(layer.id)}
      style={{
        position: 'absolute',
        left: layer.x,
        top: layer.y,
        width: layer.width,
        height: layer.height,
        backgroundColor: layer.backgroundColor,
        border: layer.border,
        borderRadius: layer.borderRadius
      }}
    >
      {layer.content}
    </div>
  );
});

// Canvas manager using refs
function FigmaCanvas({ layers, selectedLayerIds, onLayerSelect }) {
  const layerRefs = useRef(new Map());
  const canvasRef = useRef();

  // Multi-selection operations
  const handleBulkMove = useCallback((deltaX, deltaY) => {
    selectedLayerIds.forEach(layerId => {
      const layerRef = layerRefs.current.get(layerId);
      layerRef?.move(deltaX, deltaY);
    });
  }, [selectedLayerIds]);

  const handleBulkRotate = useCallback((angle) => {
    selectedLayerIds.forEach(layerId => {
      const layerRef = layerRefs.current.get(layerId);
      layerRef?.rotate(angle);
    });
  }, [selectedLayerIds]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Delete') {
        selectedLayerIds.forEach(layerId => {
          const layerRef = layerRefs.current.get(layerId);
          layerRef?.animateTo({ scaleX: 0, scaleY: 0 }, 200);
        });
      }

      if (e.key === 'c' && e.metaKey) {
        // Copy selected layers
        const selectedLayers = selectedLayerIds.map(id =>
          layerRefs.current.get(id)?.getTransform()
        ).filter(Boolean);

        navigator.clipboard.writeText(JSON.stringify(selectedLayers));
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedLayerIds]);

  return (
    <div
      ref={canvasRef}
      className="figma-canvas"
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleCanvasMouseMove}
      onMouseUp={handleCanvasMouseUp}
    >
      {layers.map(layer => (
        <CanvasLayer
          key={layer.id}
          ref={(ref) => {
            if (ref) {
              layerRefs.current.set(layer.id, ref);
            } else {
              layerRefs.current.delete(layer.id);
            }
          }}
          layer={layer}
          isSelected={selectedLayerIds.includes(layer.id)}
          onSelect={onLayerSelect}
        />
      ))}
    </div>
  );
}

// Helper functions
function getComputedTransform(element) {
  const style = window.getComputedStyle(element);
  const transform = style.transform;

  if (transform === 'none') {
    return { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 };
  }

  // Parse transform matrix
  const matrix = transform.match(/matrix\(([^)]+)\)/)?.[1].split(', ').map(Number);

  if (matrix) {
    return {
      x: matrix[4] || 0,
      y: matrix[5] || 0,
      rotation: Math.atan2(matrix[1], matrix[0]) * (180 / Math.PI),
      scaleX: Math.sqrt(matrix[0] * matrix[0] + matrix[1] * matrix[1]),
      scaleY: Math.sqrt(matrix[2] * matrix[2] + matrix[3] * matrix[3])
    };
  }

  return { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 };
}

function lerp(start, end, t) {
  return start + (end - start) * t;
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
}
```


#### 💭 Mental Model: When To Use Refs vs State


**Decision Matrix**:


```
ScenarioUse StateUse RefRationaleForm input values✅❌Need re-renders for validation UIFocus management❌✅Imperative DOM operationAnimation values during animation❌✅60fps updates would kill performanceToggle visibility✅❌UI needs to reflect state changeCanvas drawing coordinates❌✅High-frequency updatesModal open/closed✅❌Affects rendering conditionallyScroll position tracking❌✅Performance-sensitiveCounter for user display✅❌User needs to see updates
```


**Anti-patterns với Refs**:


```javascript
// ❌ BAD: Using refs for state that should cause re-renders
function BadCounter() {
  const countRef = useRef(0);

  const increment = () => {
    countRef.current += 1; // No re-render, UI stale!
  };

  return (
    <div>
      <div>Count: {countRef.current}</div> {/* Never updates */}
      <button onClick={increment}>Increment</button>
    </div>
  );
}

// ❌ BAD: Overusing refs for simple operations
function BadForm() {
  const nameRef = useRef();
  const emailRef = useRef();

  const handleSubmit = () => {
    const name = nameRef.current.value;
    const email = emailRef.current.value;

    // No validation UI, no controlled components
    submitForm({ name, email });
  };

  return (
    <form>
      <input ref={nameRef} placeholder="Name" />
      <input ref={emailRef} placeholder="Email" />
      <button type="button" onClick={handleSubmit}>Submit</button>
    </form>
  );
}

// ✅ GOOD: Controlled components với validation
function GoodForm() {
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [errors, setErrors] = useState({});
  const submitButtonRef = useRef(); // Only ref where needed

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateForm(formData);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    submitButtonRef.current.disabled = true;

    try {
      await submitForm(formData);
    } finally {
      submitButtonRef.current.disabled = false;
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={formData.name}
        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
        placeholder="Name"
      />
      {errors.name && <span className="error">{errors.name}</span>}

      <input
        value={formData.email}
        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
        placeholder="Email"
      />
      {errors.email && <span className="error">{errors.email}</span>}

      <button ref={submitButtonRef} type="submit">Submit</button>
    </form>
  );
}
```


#### 🎯 Interview Questions: Refs & useImperativeHandle Mastery


**Basic Level**:


1. *"Explain the difference between useRef và useState"*
2. *"When should you use refs instead of state?"*
3. *"What is useImperativeHandle và why would you use it?"*


**Intermediate Level**:


1. *"How do you properly clean up refs trong useEffect?"*
2. *"Explain forwardRef và its use cases"*
3. *"What are the performance implications of refs vs state?"*


**Advanced Level**:


1. *"Design a custom hook that manages complex DOM animations using refs"*
2. *"How would you implement a reusable component library with ref-based APIs?"*
3. *"Compare ref patterns for canvas manipulation vs SVG manipulation"*


**Production Scenarios**:


1. *"You need to integrate a third-party WebGL library. How do you manage the DOM integration?"*
2. *"Design a form system that supports both controlled và uncontrolled inputs"*
3. *"How would you implement collaborative cursor tracking using refs?"*


---


### 🔬 Custom Hooks: Communication Through Abstraction


#### 🌱 Nguồn Gốc & Motivation: Event Bus Pattern in React


Traditional event bus pattern (như EventEmitter trong Node.js) cho phép loose coupling between components. Trong React, chúng ta có thể implement tương tự using custom hooks:


```javascript
// Classic EventEmitter approach (outside React)
const emitter = new EventEmitter();

// Component A
emitter.on('user-login', (userData) => {
  console.log('User logged in:', userData);
});

// Component B
emitter.emit('user-login', { name: 'Alice', id: 123 });
```


React equivalent using custom hooks:


```javascript
// React event bus hook
function useEventBus() {
  const listeners = useRef(new Map());

  const emit = useCallback((event, data) => {
    const eventListeners = listeners.current.get(event) || [];
    eventListeners.forEach(callback => callback(data));
  }, []);

  const on = useCallback((event, callback) => {
    if (!listeners.current.has(event)) {
      listeners.current.set(event, []);
    }
    listeners.current.get(event).push(callback);

    // Return cleanup function
    return () => {
      const eventListeners = listeners.current.get(event) || [];
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    };
  }, []);

  return { emit, on };
}

// Usage
function ComponentA() {
  const { emit } = useEventBus();

  const handleLogin = () => {
    emit('user-login', { name: 'Alice', id: 123 });
  };

  return <button onClick={handleLogin}>Login</button>;
}

function ComponentB() {
  const { on } = useEventBus();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const cleanup = on('user-login', (userData) => {
      setUser(userData);
    });

    return cleanup;
  }, [on]);

  return <div>Welcome {user?.name}</div>;
}
```


💭 **Think Out Loud**:


## Claude


💭 **Think Out Loud**: *Tại đầu career, tôi thought custom hooks chỉ là "fancy functions". Big mistake! Custom hooks là abstraction layer mạnh nhất trong React. Tại Webflow, chúng tôi có 200+ custom hooks handling everything từ API calls đến complex state synchronization. They're the secret sauce cho maintainable, reusable communication patterns.*


#### ⚙️ Advanced Event Bus Patterns


**Pattern 1: Typed Event Bus với TypeScript**


```javascript
// Type-safe event bus implementation
type EventMap = {
  'user-login': { userId: string; name: string };
  'user-logout': { userId: string };
  'theme-change': { theme: 'light' | 'dark' };
  'notification-show': { message: string; type: 'info' | 'error' | 'success' };
  'modal-open': { modalId: string; data?: any };
  'modal-close': { modalId: string };
};

function useTypedEventBus<T extends EventMap>() {
  const listeners = useRef(new Map<keyof T, Array<(data: any) => void>>());

  const emit = useCallback(<K extends keyof T>(
    event: K,
    data: T[K]
  ) => {
    const eventListeners = listeners.current.get(event) || [];
    eventListeners.forEach(callback => callback(data));
  }, []);

  const on = useCallback(<K extends keyof T>(
    event: K,
    callback: (data: T[K]) => void
  ) => {
    if (!listeners.current.has(event)) {
      listeners.current.set(event, []);
    }
    listeners.current.get(event)!.push(callback);

    return () => {
      const eventListeners = listeners.current.get(event) || [];
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    };
  }, []);

  const off = useCallback(<K extends keyof T>(event: K) => {
    listeners.current.delete(event);
  }, []);

  return { emit, on, off };
}

// Usage with full type safety
function NotificationSystem() {
  const { emit } = useTypedEventBus<EventMap>();

  const showSuccess = () => {
    emit('notification-show', {
      message: 'Success!',
      type: 'success' // Type-checked!
    });
  };

  // TypeScript will error if wrong type
  // emit('user-login', { wrong: 'data' }); // ❌ Type error
}
```


**Pattern 2: Event Bus với Middleware & Debugging**


```javascript
// Advanced event bus với middleware support
function useEventBusWithMiddleware(middlewares = []) {
  const listeners = useRef(new Map());
  const middlewareChain = useRef(middlewares);

  const emit = useCallback((event, data) => {
    // Apply middleware chain
    const context = { event, data, timestamp: Date.now() };

    const processMiddleware = (index = 0) => {
      if (index >= middlewareChain.current.length) {
        // End of middleware chain - emit to listeners
        const eventListeners = listeners.current.get(event) || [];
        eventListeners.forEach(callback => callback(data));
        return;
      }

      const middleware = middlewareChain.current[index];
      middleware(context, () => processMiddleware(index + 1));
    };

    processMiddleware();
  }, []);

  const on = useCallback((event, callback) => {
    if (!listeners.current.has(event)) {
      listeners.current.set(event, []);
    }
    listeners.current.get(event).push(callback);

    return () => {
      const eventListeners = listeners.current.get(event) || [];
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    };
  }, []);

  return { emit, on };
}

// Middleware examples
const loggingMiddleware = (context, next) => {
  console.log(`Event emitted: ${context.event}`, context.data);
  next();
  console.log(`Event processed: ${context.event}`);
};

const analyticsMiddleware = (context, next) => {
  // Track event for analytics
  analytics.track(`Event: ${context.event}`, context.data);
  next();
};

const rateLimitingMiddleware = (() => {
  const eventCounts = new Map();
  const RATE_LIMIT = 10; // events per second

  return (context, next) => {
    const now = Date.now();
    const key = `${context.event}_${Math.floor(now / 1000)}`;
    const count = eventCounts.get(key) || 0;

    if (count < RATE_LIMIT) {
      eventCounts.set(key, count + 1);
      next();
    } else {
      console.warn(`Rate limit exceeded for event: ${context.event}`);
    }
  };
})();

// Usage
const eventBus = useEventBusWithMiddleware([
  loggingMiddleware,
  analyticsMiddleware,
  rateLimitingMiddleware
]);
```


#### 🛠️ Production Pattern: Cross-Component Data Synchronization


**Pattern 3: Shared State Hook**


```javascript
// Shared state hook cho complex data synchronization
function createSharedState(initialState) {
  let sharedState = initialState;
  const listeners = new Set();

  const useSharedState = (selector = (state) => state) => {
    const [, forceUpdate] = useReducer(x => x + 1, 0);
    const selectorRef = useRef(selector);
    const selectedValueRef = useRef();

    // Update selector reference
    selectorRef.current = selector;

    // Calculate selected value
    const selectedValue = selectorRef.current(sharedState);

    useEffect(() => {
      const listener = (newState) => {
        const newSelectedValue = selectorRef.current(newState);

        // Only re-render if selected value changed
        if (newSelectedValue !== selectedValueRef.current) {
          selectedValueRef.current = newSelectedValue;
          forceUpdate();
        }
      };

      listeners.add(listener);
      selectedValueRef.current = selectedValue;

      return () => {
        listeners.delete(listener);
      };
    }, []);

    const setState = useCallback((updater) => {
      const newState = typeof updater === 'function'
        ? updater(sharedState)
        : updater;

      if (newState !== sharedState) {
        sharedState = newState;
        listeners.forEach(listener => listener(newState));
      }
    }, []);

    return [selectedValue, setState];
  };

  return useSharedState;
}

// Usage: Create shared state for shopping cart
const useSharedCart = createSharedState({
  items: [],
  total: 0,
  discountCode: null
});

// Component A - Product listing
function ProductList() {
  const [cart, setCart] = useSharedCart();

  const addToCart = (product) => {
    setCart(prevCart => ({
      ...prevCart,
      items: [...prevCart.items, product],
      total: prevCart.total + product.price
    }));
  };

  return (
    <div>
      {products.map(product => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={() => addToCart(product)}
        />
      ))}
    </div>
  );
}

// Component B - Cart summary (only re-renders when cart changes)
function CartSummary() {
  const [cartSummary] = useSharedCart(cart => ({
    itemCount: cart.items.length,
    total: cart.total
  }));

  return (
    <div>
      Items: {cartSummary.itemCount}
      Total: ${cartSummary.total}
    </div>
  );
}

// Component C - Discount panel (only re-renders when discount changes)
function DiscountPanel() {
  const [discountCode, setCart] = useSharedCart(cart => cart.discountCode);

  const applyDiscount = (code) => {
    setCart(cart => ({ ...cart, discountCode: code }));
  };

  return (
    <div>
      Current discount: {discountCode || 'None'}
      <button onClick={() => applyDiscount('SAVE10')}>
        Apply SAVE10
      </button>
    </div>
  );
}
```


#### 🏭 Production Case Study: Binance Trading Hooks Architecture


```javascript
// Real-world example: Complex trading hooks system
function useWebSocketConnection(url, options = {}) {
  const [connectionState, setConnectionState] = useState('disconnected');
  const [lastMessage, setLastMessage] = useState(null);
  const [error, setError] = useState(null);
  const wsRef = useRef();
  const reconnectTimeoutRef = useRef();
  const messageQueueRef = useRef([]);

  const {
    reconnectAttempts = 5,
    reconnectDelay = 1000,
    onConnect,
    onDisconnect,
    onMessage,
    onError
  } = options;

  const connect = useCallback(() => {
    try {
      wsRef.current = new WebSocket(url);
      setConnectionState('connecting');

      wsRef.current.onopen = () => {
        setConnectionState('connected');
        setError(null);
        onConnect?.();

        // Send queued messages
        messageQueueRef.current.forEach(message => {
          wsRef.current.send(JSON.stringify(message));
        });
        messageQueueRef.current = [];
      };

      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setLastMessage(data);
        onMessage?.(data);
      };

      wsRef.current.onclose = () => {
        setConnectionState('disconnected');
        onDisconnect?.();

        // Auto-reconnect logic
        if (reconnectAttempts > 0) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectDelay);
        }
      };

      wsRef.current.onerror = (error) => {
        setError(error);
        setConnectionState('error');
        onError?.(error);
      };

    } catch (err) {
      setError(err);
      setConnectionState('error');
    }
  }, [url, reconnectAttempts, reconnectDelay, onConnect, onDisconnect, onMessage, onError]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (wsRef.current) {
      wsRef.current.close();
    }

    setConnectionState('disconnected');
  }, []);

  const sendMessage = useCallback((message) => {
    if (connectionState === 'connected' && wsRef.current) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      // Queue message for when connection is established
      messageQueueRef.current.push(message);
    }
  }, [connectionState]);

  useEffect(() => {
    connect();
    return disconnect;
  }, [connect, disconnect]);

  return {
    connectionState,
    lastMessage,
    error,
    connect,
    disconnect,
    sendMessage,
    isConnected: connectionState === 'connected'
  };
}

// Market data hook building on WebSocket
function useMarketData(symbols) {
  const [marketData, setMarketData] = useState(new Map());
  const [subscriptions, setSubscriptions] = useState(new Set());

  const { sendMessage, isConnected, lastMessage } = useWebSocketConnection(
    'wss://stream.binance.com:9443/ws/market',
    {
      onMessage: (data) => {
        if (data.stream && data.data) {
          const symbol = extractSymbolFromStream(data.stream);

          setMarketData(prev => {
            const updated = new Map(prev);
            const existing = updated.get(symbol) || {};

            // Merge new data
            updated.set(symbol, {
              ...existing,
              ...data.data,
              lastUpdate: Date.now()
            });

            return updated;
          });
        }
      }
    }
  );

  // Subscribe to symbols
  useEffect(() => {
    if (isConnected && symbols.length > 0) {
      const newSubscriptions = symbols.filter(symbol =>
        !subscriptions.has(symbol)
      );

      if (newSubscriptions.length > 0) {
        newSubscriptions.forEach(symbol => {
          sendMessage({
            method: 'SUBSCRIBE',
            params: [`${symbol.toLowerCase()}@ticker`],
            id: Date.now()
          });
        });

        setSubscriptions(prev => new Set([...prev, ...newSubscriptions]));
      }
    }
  }, [isConnected, symbols, subscriptions, sendMessage]);

  // Cleanup subscriptions
  useEffect(() => {
    return () => {
      subscriptions.forEach(symbol => {
        sendMessage({
          method: 'UNSUBSCRIBE',
          params: [`${symbol.toLowerCase()}@ticker`],
          id: Date.now()
        });
      });
    };
  }, []);

  return {
    marketData: Object.fromEntries(marketData),
    isConnected,
    subscribe: (symbol) => {
      if (!subscriptions.has(symbol)) {
        sendMessage({
          method: 'SUBSCRIBE',
          params: [`${symbol.toLowerCase()}@ticker`],
          id: Date.now()
        });
        setSubscriptions(prev => new Set(prev).add(symbol));
      }
    },
    unsubscribe: (symbol) => {
      if (subscriptions.has(symbol)) {
        sendMessage({
          method: 'UNSUBSCRIBE',
          params: [`${symbol.toLowerCase()}@ticker`],
          id: Date.now()
        });
        setSubscriptions(prev => {
          const updated = new Set(prev);
          updated.delete(symbol);
          return updated;
        });
      }
    }
  };
}

// Trading hook building on market data
function useTrading() {
  const [orders, setOrders] = useState([]);
  const [positions, setPositions] = useState([]);
  const [balance, setBalance] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const marketData = useMarketData(['BTCUSDT', 'ETHUSDT', 'ADAUSDT']);

  const placeOrder = useCallback(async (orderData) => {
    setIsLoading(true);

    try {
      // Optimistic update
      const tempOrder = {
        ...orderData,
        id: `temp_${Date.now()}`,
        status: 'PENDING',
        timestamp: Date.now()
      };

      setOrders(prev => [...prev, tempOrder]);

      // API call
      const confirmedOrder = await api.placeOrder(orderData);

      // Replace temp order with confirmed
      setOrders(prev => prev.map(order =>
        order.id === tempOrder.id ? confirmedOrder : order
      ));

      return confirmedOrder;

    } catch (error) {
      // Remove temp order on error
      setOrders(prev => prev.filter(order => order.id !== tempOrder.id));
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const cancelOrder = useCallback(async (orderId) => {
    try {
      await api.cancelOrder(orderId);

      setOrders(prev => prev.map(order =>
        order.id === orderId
          ? { ...order, status: 'CANCELLED' }
          : order
      ));
    } catch (error) {
      console.error('Failed to cancel order:', error);
      throw error;
    }
  }, []);

  return {
    orders,
    positions,
    balance,
    marketData: marketData.marketData,
    isLoading,
    placeOrder,
    cancelOrder,
    isMarketDataConnected: marketData.isConnected
  };
}

// Usage in components
function TradingDashboard() {
  const {
    orders,
    positions,
    balance,
    marketData,
    placeOrder,
    cancelOrder,
    isLoading
  } = useTrading();

  return (
    <div className="trading-dashboard">
      <MarketDataPanel data={marketData} />
      <OrdersPanel orders={orders} onCancel={cancelOrder} />
      <PositionsPanel positions={positions} />
      <OrderForm onPlaceOrder={placeOrder} isLoading={isLoading} />
    </div>
  );
}
```


#### 💭 Mental Model: Custom Hook Communication Patterns


**Pattern Classification**:


1. **Event-Based Communication** (Loose coupling)

Event bus hooks
PubSub patterns
Good for: Cross-tree communication, plugin architectures
2. **Shared State Communication** (Direct coupling)

Shared state hooks
Global state management
Good for: Synchronized data, coordinated updates
3. **Context-Based Communication** (Tree-scoped coupling)

Custom context hooks
Provider pattern enhancement
Good for: Feature-specific state, bounded contexts
4. **Imperative Communication** (Ref-based)

Imperative handle hooks
Action-based APIs
Good for: Component control, animations, integrations


**Performance Considerations**:


```javascript
// ❌ BAD: Naive event bus causing unnecessary re-renders
function useEventBus() {
  const [, forceUpdate] = useState({});
  const listeners = useRef(new Map());

  const emit = useCallback((event, data) => {
    listeners.current.get(event)?.forEach(callback => {
      callback(data);
      forceUpdate({}); // Forces ALL components to re-render!
    });
  }, []);
}

// ✅ GOOD: Optimized event bus with selective updates
function useEventBus() {
  const listeners = useRef(new Map());

  const emit = useCallback((event, data) => {
    listeners.current.get(event)?.forEach(callback => callback(data));
    // No forced updates - let components manage their own re-renders
  }, []);

  const useEventListener = useCallback((event, callback, deps = []) => {
    const stableCallback = useCallback(callback, deps);

    useEffect(() => {
      if (!listeners.current.has(event)) {
        listeners.current.set(event, new Set());
      }

      listeners.current.get(event).add(stableCallback);

      return () => {
        listeners.current.get(event).delete(stableCallback);
      };
    }, [event, stableCallback]);
  }, []);

  return { emit, useEventListener };
}

// Usage
function ComponentA() {
  const { emit } = useEventBus();
  const [user, setUser] = useState(null);

  const handleLogin = (userData) => {
    setUser(userData); // Component manages its own state
    emit('user-login', userData); // Notify other components
  };
}

function ComponentB() {
  const { useEventListener } = useEventBus();
  const [welcomeMessage, setWelcomeMessage] = useState('');

  // Only this component re-renders when user-login event occurs
  useEventListener('user-login', (userData) => {
    setWelcomeMessage(`Welcome ${userData.name}!`);
  }, []);
}
```


#### 🎯 Advanced Hook Composition Patterns


```javascript
// Composable hooks pattern
function useApiState() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (apiCall) => {
    setLoading(true);
    setError(null);

    try {
      const result = await apiCall();
      setData(result);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, execute, reset };
}

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

  return [storedValue, setValue];
}

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Composed hook combining multiple behaviors
function useApiWithPersistence(apiCall, storageKey) {
  const apiState = useApiState();
  const [cachedData, setCachedData] = useLocalStorage(storageKey, null);

  // Initialize with cached data
  useEffect(() => {
    if (cachedData && !apiState.data) {
      apiState.execute(() => Promise.resolve(cachedData));
    }
  }, []);

  // Enhanced execute that caches results
  const executeWithCache = useCallback(async (...args) => {
    const result = await apiState.execute(() => apiCall(...args));
    setCachedData(result);
    return result;
  }, [apiState.execute, apiCall, setCachedData]);

  return {
    ...apiState,
    execute: executeWithCache,
    cachedData
  };
}

// Advanced composed hook for search with debouncing
function useSearchWithDebounce(searchApi, delay = 300) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, delay);
  const searchState = useApiWithPersistence(searchApi, `search_${debouncedQuery}`);

  // Auto-execute search when debounced query changes
  useEffect(() => {
    if (debouncedQuery) {
      searchState.execute(debouncedQuery);
    }
  }, [debouncedQuery]);

  return {
    query,
    setQuery,
    results: searchState.data,
    loading: searchState.loading,
    error: searchState.error
  };
}

// Usage
function SearchComponent() {
  const { query, setQuery, results, loading, error } = useSearchWithDebounce(
    (searchTerm) => api.search(searchTerm),
    500
  );

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search..."
      />
      {loading && <div>Searching...</div>}
      {error && <div>Error: {error.message}</div>}
      {results && (
        <div>
          {results.map(result => (
            <div key={result.id}>{result.title}</div>
          ))}
        </div>
      )}
    </div>
  );
}
```


#### 🎯 Interview Questions: Custom Hooks Communication Mastery


**Basic Level**:


1. *"What are custom hooks và how do they enable component communication?"*
2. *"Implement a simple event bus using custom hooks"*
3. *"Explain the difference between custom hooks và higher-order components"*


**Intermediate Level**:


1. *"How do you handle cleanup in custom hooks to prevent memory leaks?"*
2. *"Design a custom hook for managing WebSocket connections"*
3. *"Explain how to optimize custom hooks for performance"*


**Advanced Level**:


1. *"Create a custom hook system for real-time collaborative features"*
2. *"Design a plugin architecture using custom hooks"*
3. *"How would you implement cross-tab communication using custom hooks?"*


**Production Scenarios**:


1. *"Design a custom hooks architecture for a large-scale trading platform"*
2. *"How would you migrate from Redux to custom hooks while maintaining backward compatibility?"*
3. *"Create a testing strategy for complex custom hooks with side effects"*


---


## 📖 PHẦN V: BEST PRACTICES & SELECTION STRATEGIES


### 🔬 Selection Decision Framework


#### 🌱 The Principal's Mental Model: Choosing The Right Pattern


Sau 8 năm working across different scales - từ startups đến unicorns, tôi đã develop một decision framework mà tôi use consistently:


**The 4-Dimensional Analysis**:


1. **Scope** (How far does the data need to travel?)
2. **Frequency** (How often does the data change?)
3. **Complexity** (How complex is the data structure/logic?)
4. **Team** (What's the team's experience level?)


```javascript
// Decision Matrix Example
const communicationDecision = ({
  scope,      // 'local' | 'sibling' | 'tree' | 'global'
  frequency,  // 'static' | 'occasional' | 'frequent' | 'realtime'
  complexity, // 'simple' | 'moderate' | 'complex' | 'enterprise'
  teamLevel   // 'junior' | 'mid' | 'senior' | 'mixed'
}) => {

  // Simple local state
  if (scope === 'local' && complexity === 'simple') {
    return 'useState';
  }

  // Parent-child communication
  if (scope === 'sibling' && complexity === 'simple') {
    return 'props + callbacks';
  }

  // Cross-tree communication
  if (scope === 'tree' && frequency !== 'realtime') {
    return teamLevel === 'junior' ? 'Context API' : 'Zustand';
  }

  // Global state with high frequency
  if (scope === 'global' && frequency === 'realtime') {
    return complexity === 'enterprise' ? 'Redux Toolkit' : 'Zustand';
  }

  // Complex scenarios
  if (complexity === 'enterprise') {
    return 'Redux Toolkit + RTK Query';
  }

  return 'evaluate case by case';
};
```


#### ⚙️ Real-World Selection Examples


**Case Study 1: E-commerce Product Page**


```javascript
// Scenario Analysis:
// - Scope: Component tree (product details, reviews, cart)
// - Frequency: Occasional (add to cart, update quantity)
// - Complexity: Moderate (product variants, inventory)
// - Team: Mixed (3 junior, 2 senior developers)

// ❌ BAD: Over-engineering với Redux
const productSlice = createSlice({
  name: 'product',
  initialState: { selectedVariant: null, quantity: 1 },
  reducers: {
    setVariant: (state, action) => { state.selectedVariant = action.payload; },
    setQuantity: (state, action) => { state.quantity = action.payload; }
  }
});
// Too much boilerplate for simple state!

// ✅ GOOD: State lifting pattern
function ProductPage({ productId }) {
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [cartItems, setCartItems] = useState([]);

  const addToCart = useCallback(() => {
    const item = {
      productId,
      variant: selectedVariant,
      quantity,
      price: selectedVariant.price
    };

    setCartItems(prev => [...prev, item]);
  }, [productId, selectedVariant, quantity]);

  return (
    <div className="product-page">
      <ProductImages variant={selectedVariant} />

      <ProductDetails
        selectedVariant={selectedVariant}
        onVariantChange={setSelectedVariant}
      />

      <QuantitySelector
        quantity={quantity}
        onChange={setQuantity}
      />

      <AddToCartButton
        onClick={addToCart}
        disabled={!selectedVariant}
      />

      <CartSummary items={cartItems} />
    </div>
  );
}
```


**Case Study 2: Real-time Dashboard**


```javascript
// Scenario Analysis:
// - Scope: Global (multiple dashboards, widgets)
// - Frequency: Real-time (WebSocket updates every 100ms)
// - Complexity: Complex (time series, aggregations)
// - Team: Senior (experienced với performance optimization)

// ✅ GOOD: Zustand với optimized selectors
const useDashboardStore = create((set, get) => ({
  // Raw data
  metrics: new Map(),
  timeSeries: new Map(),
  alerts: [],

  // WebSocket connection
  wsConnected: false,

  // Actions
  updateMetric: (key, value) => set(state => {
    const newMetrics = new Map(state.metrics);
    newMetrics.set(key, {
      ...newMetrics.get(key),
      value,
      timestamp: Date.now()
    });
    return { metrics: newMetrics };
  }),

  addTimeSeriesPoint: (seriesId, point) => set(state => {
    const newTimeSeries = new Map(state.timeSeries);
    const series = newTimeSeries.get(seriesId) || [];
    const updatedSeries = [...series.slice(-100), point]; // Keep last 100 points
    newTimeSeries.set(seriesId, updatedSeries);
    return { timeSeries: newTimeSeries };
  })
}));

// Optimized selectors cho performance
const useMetric = (key) => useDashboardStore(
  state => state.metrics.get(key),
  shallow
);

const useTimeSeries = (seriesId) => useDashboardStore(
  state => state.timeSeries.get(seriesId) || [],
  shallow
);

// WebSocket integration
function useDashboardWebSocket() {
  const updateMetric = useDashboardStore(state => state.updateMetric);
  const addTimeSeriesPoint = useDashboardStore(state => state.addTimeSeriesPoint);

  useEffect(() => {
    const ws = new WebSocket('wss://api.dashboard.com/realtime');

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      // Batch updates để avoid excessive re-renders
      if (data.type === 'METRICS_BATCH') {
        data.metrics.forEach(({ key, value }) => {
          updateMetric(key, value);
        });
      }

      if (data.type === 'TIMESERIES_POINT') {
        addTimeSeriesPoint(data.seriesId, data.point);
      }
    };

    return () => ws.close();
  }, [updateMetric, addTimeSeriesPoint]);
}

// Component usage
function MetricWidget({ metricKey }) {
  const metric = useMetric(metricKey); // Only re-renders when this metric changes

  return (
    <div className="metric-widget">
      <h3>{metricKey}</h3>
      <div className="value">{metric?.value || '--'}</div>
      <div className="timestamp">
        {metric?.timestamp ? new Date(metric.timestamp).toLocaleTimeString() : ''}
      </div>
    </div>
  );
}
```


**Case Study 3: Enterprise Form Builder**


```javascript
// Scenario Analysis:
// - Scope: Global (form builder, preview, validation)
// - Frequency: Frequent (drag & drop, property changes)
// - Complexity: Enterprise (nested forms, validation rules, computed fields)
// - Team: Mixed (large team, need maintainability)

// ✅ GOOD: Redux Toolkit với comprehensive architecture
const formBuilderSlice = createSlice({
  name: 'formBuilder',
  initialState: {
    forms: {},
    selectedFormId: null,
    selectedFieldId: null,
    clipboard: null,
    history: { past: [], future: [] },
    validation: {},
    preview: { mode: 'desktop', data: {} }
  },
  reducers: {
    // Form management
    createForm: (state, action) => {
      const form = { ...action.payload, id: generateId() };
      state.forms[form.id] = form;
      state.selectedFormId = form.id;
    },

    updateForm: (state, action) => {
      const { formId, updates } = action.payload;
      if (state.forms[formId]) {
        Object.assign(state.forms[formId], updates);
      }
    },

    // Field management
    addField: (state, action) => {
      const { formId, field, index } = action.payload;
      const form = state.forms[formId];

      if (form) {
        const newField = { ...field, id: generateId() };
        if (typeof index === 'number') {
          form.fields.splice(index, 0, newField);
        } else {
          form.fields.push(newField);
        }
        state.selectedFieldId = newField.id;
      }
    },

    updateField: (state, action) => {
      const { formId, fieldId, updates } = action.payload;
      const form = state.forms[formId];

      if (form) {
        const field = form.fields.find(f => f.id === fieldId);
        if (field) {
          Object.assign(field, updates);

          // Trigger validation recalculation
          state.validation[formId] = calculateValidation(form);
        }
      }
    },

    // History management
    pushToHistory: (state, action) => {
      state.history.past.push(action.payload);
      state.history.future = [];
    },

    undo: (state) => {
      if (state.history.past.length > 0) {
        const previous = state.history.past.pop();
        state.history.future.unshift(getCurrentState(state));
        restoreState(state, previous);
      }
    },

    redo: (state) => {
      if (state.history.future.length > 0) {
        const next = state.history.future.shift();
        state.history.past.push(getCurrentState(state));
        restoreState(state, next);
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(validateForm.fulfilled, (state, action) => {
        state.validation[action.meta.arg] = action.payload;
      });
  }
});

// Async thunks for complex operations
const validateForm = createAsyncThunk(
  'formBuilder/validateForm',
  async (formId, { getState }) => {
    const state = getState();
    const form = state.formBuilder.forms[formId];

    // Complex validation logic
    const validationResults = await validateFormFields(form);
    return validationResults;
  }
);

// RTK Query for API operations
const formBuilderApi = createApi({
  reducerPath: 'formBuilderApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/forms' }),
  tagTypes: ['Form', 'Template'],
  endpoints: (builder) => ({
    getForms: builder.query({
      query: () => 'forms',
      providesTags: ['Form']
    }),

    saveForm: builder.mutation({
      query: ({ formId, formData }) => ({
        url: `forms/${formId}`,
        method: 'PUT',
        body: formData
      }),
      invalidatesTags: ['Form']
    }),

    publishForm: builder.mutation({
      query: (formId) => ({
        url: `forms/${formId}/publish`,
        method: 'POST'
      }),
      invalidatesTags: ['Form']
    })
  })
});

// Selectors với memoization
const selectFormById = createSelector(
  [state => state.formBuilder.forms, (_, formId) => formId],
  (forms, formId) => forms[formId]
);

const selectFormFields = createSelector(
  [selectFormById],
  (form) => form?.fields || []
);

const selectValidationForForm = createSelector(
  [state => state.formBuilder.validation, (_, formId) => formId],
  (validation, formId) => validation[formId] || {}
);
```


#### 💭 Performance vs Complexity Trade-offs


**The Performance Pyramid**:


```javascript
// Performance hierarchy (fastest to slowest)
// 1. Local useState (no prop drilling)
// 2. Props + callbacks (direct parent-child)
// 3. Zustand (minimal re-renders)
// 4. Context API (tree-scoped updates)
// 5. Redux Toolkit (comprehensive but overhead)

// Trade-off analysis
const performanceAnalysis = {
  useState: {
    performance: 'excellent',
    scalability: 'poor',
    maintainability: 'good',
    testability: 'excellent',
    useCase: 'local component state'
  },

  propsAndCallbacks: {
    performance: 'excellent',
    scalability: 'moderate',
    maintainability: 'good',
    testability: 'excellent',
    useCase: 'parent-child communication'
  },

  zustand: {
    performance: 'very good',
    scalability: 'excellent',
    maintainability: 'very good',
    testability: 'good',
    useCase: 'global state, small to medium apps'
  },

  contextAPI: {
    performance: 'good',
    scalability: 'moderate',
    maintainability: 'good',
    testability: 'moderate',
    useCase: 'feature-scoped state'
  },

  reduxToolkit: {
    performance: 'good',
    scalability: 'excellent',
    maintainability: 'excellent',
    testability: 'excellent',
    useCase: 'enterprise apps, complex workflows'
  }
};
```


#### 🛠️ Migration Strategies


**Progressive Enhancement Pattern**:


```javascript
// Phase 1: Start với simple patterns
function AppV1() {
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);

  return (
    <div>
      <Header user={user} />
      <ProductList onAddToCart={(item) => setCart(prev => [...prev, item])} />
      <Cart items={cart} />
    </div>
  );
}

// Phase 2: Extract shared state when needed
const useSharedState = createSharedState({
  user: null,
  cart: []
});

function AppV2() {
  return (
    <div>
      <HeaderWithSharedState />
      <ProductListWithSharedState />
      <CartWithSharedState />
    </div>
  );
}

// Phase 3: Migrate to Zustand when complexity grows
const useAppStore = create((set) => ({
  user: null,
  cart: [],
  orders: [],
  preferences: {},

  actions: {
    setUser: (user) => set({ user }),
    addToCart: (item) => set(state => ({
      cart: [...state.cart, item]
    })),
    // ... more actions
  }
}));

function AppV3() {
  return (
    <div>
      <HeaderWithStore />
      <ProductListWithStore />
      <CartWithStore />
    </div>
  );
}

// Phase 4: Redux Toolkit for enterprise features
function AppV4() {
  return (
    <Provider store={enterpriseStore}>
      <PersistGate loading={<Loading />} persistor={persistor}>
        <Router>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/admin" element={<AdminPanel />} />
          </Routes>
        </Router>
      </PersistGate>
    </Provider>
  );
}
```


#### 🏭 Team & Scale Considerations


**Small Team (2-5 developers)**:


```javascript
// Recommended: Simple patterns, fast iteration
const smallTeamStack = {
  localState: 'useState',
  sharedState: 'Props + callbacks',
  globalState: 'Zustand',
  async: 'React Query',
  forms: 'React Hook Form'
};

// Avoid: Over-engineering
const avoidForSmallTeam = [
  'Redux Toolkit', // Too much boilerplate
  'Complex Context hierarchies', // Hard to debug
  'Custom event bus systems', // Maintenance burden
];
```


**Medium Team (5-15 developers)**:


```javascript
// Recommended: Balance of simplicity và scalability
const mediumTeamStack = {
  localState: 'useState',
  componentCommunication: 'Props + Context where needed',
  globalState: 'Zustand với clear slices',
  async: 'React Query + optimistic updates',
  forms: 'React Hook Form với schema validation'
};

// Key practices
const mediumTeamBestPractices = [
  'Clear state ownership boundaries',
  'Standardized folder structure',
  'Custom hooks for reusable logic',
  'Performance monitoring tools'
];
```


**Large Team (15+ developers)**:


```javascript
// Recommended: Enterprise-grade architecture
const largeTeamStack = {
  localState: 'useState với TypeScript strict mode',
  globalState: 'Redux Toolkit',
  async: 'RTK Query',
  realtime: 'Custom WebSocket middleware',
  forms: 'Formik/React Hook Form với enterprise validation',
  testing: 'Comprehensive unit và integration tests'
};

// Required practices
const largeTeamRequiredPractices = [
  'Strict TypeScript with no any types',
  'Code review requirements',
  'Architecture decision records (ADRs)',
  'Performance budgets và monitoring',
  'Micro-frontend considerations'
];
```


#### 🎯 Interview Questions: Selection Strategy Mastery


**Basic Level**:


1. *"How do you choose between useState và useReducer?"*
2. *"When would you use Context API over props drilling?"*
3. *"What factors influence your state management choice?"*


**Intermediate Level**:


1. *"Compare Zustand vs Redux Toolkit for a medium-sized app"*
2. *"How do you migrate from one state pattern to another?"*
3. *"Explain performance trade-offs between different patterns"*


**Advanced Level**:


1. *"Design a state architecture for a multi-tenant SaaS platform"*
2. *"How would you handle state management in micro-frontends?"*
3. *"Create a migration strategy from Legacy Redux to modern patterns"*


**Principal-Level Questions**:


1. *"You're architecting state management for a team of 50 developers. Walk through your decision process."*
2. *"How do you balance team productivity với long-term maintainability?"*
3. *"Design a state management strategy that can evolve từ MVP to enterprise scale"*


---


## 📖 PHẦN VI: PERFORMANCE OPTIMIZATION STRATEGIES


### 🔬 React.memo & Memoization Deep Dive


#### 🌱 The Rendering Problem: Understanding React's Default Behavior


React's default behavior is to re-render all children khi parent re-renders, regardless of whether their props actually changed. Đây là trade-off for simplicity, nhưng có thể cause performance issues trong complex applications.


```javascript
// Demonstration: The Re-render Cascade Problem
function App() {
  const [count, setCount] = useState(0);
  const [name, setName] = useState('Alice');

  console.log('App rendered');

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name"
      />

      {/* These components re-render even when their props don't change! */}
      <ExpensiveComponent />
      <AnotherExpensiveComponent data="static data" />
      <YetAnotherComponent user={{ name }} />
    </div>
  );
}

function ExpensiveComponent() {
  console.log('ExpensiveComponent rendered'); // Logs on every App render!

  // Expensive computation
  const result = useMemo(() => {
    let sum = 0;
    for (let i = 0; i < 1000000; i++) {
      sum += Math.random();
    }
    return sum;
  }, []); // Only computed once due to useMemo

  return <div>Expensive result: {result}</div>;
}
```


💭 **Think Out Loud**: *Tại Figma, chúng tôi had a canvas với 10,000+ elements. Without proper memoization, dragging one element would cause all 9,999 other elements to re-render. Performance was unusable! React.memo saved us, but required careful implementation.*


#### ⚙️ React.memo Mechanics & Implementation Strategies


**Basic React.memo Usage**:


```javascript
// Shallow comparison memoization
const OptimizedComponent = React.memo(({ name, age, hobbies }) => {
  console.log('OptimizedComponent rendered');

  return (
    <div>
      <h1>{name}</h1>
      <p>Age: {age}</p>
      <ul>
        {hobbies.map(hobby => <li key={hobby}>{hobby}</li>)}
      </ul>
    </div>
  );
});

// Usage
function Parent() {
  const [count, setCount] = useState(0);

  // ❌ BAD: Creates new array reference every render
  const hobbies = ['reading', 'coding', 'music'];

  // ✅ GOOD: Stable reference
  const stableHobbies = useMemo(() => ['reading', 'coding', 'music'], []);

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>

      {/* Won't re-render when count changes */}
      <OptimizedComponent
        name="Alice"
        age={25}
        hobbies={stableHobbies}
      />
    </div>
  );
}
```


**Custom Comparison Functions**:


```javascript
// Advanced: Custom comparison logic
const ComplexComponent = React.memo(({ user, settings, onUpdate }) => {
  return (
    <div>
      <UserProfile user={user} />
      <SettingsPanel settings={settings} onUpdate={onUpdate} />
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison logic

  // Compare user object deeply for specific fields only
  if (prevProps.user.id !== nextProps.user.id ||
      prevProps.user.name !== nextProps.user.name ||
      prevProps.user.avatar !== nextProps.user.avatar) {
    return false; // Props changed, re-render
  }

  // Compare settings object
  if (!isEqual(prevProps.settings, nextProps.settings)) {
    return false; // Settings changed, re-render
  }

  // Ignore function prop changes if functions have stable identities
  if (prevProps.onUpdate !== nextProps.onUpdate) {
    // Could check if function implementation actually changed
    // For now, assume functions are memoized properly
  }

  return true; // Props are effectively the same, skip re-render
});

// Helper function for deep comparison
function isEqual(obj1, obj2) {
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  for (let key of keys1) {
    if (obj1[key] !== obj2[key]) {
      if (typeof obj1[key] === 'object' && typeof obj2[key] === 'object') {
        if (!isEqual(obj1[key], obj2[key])) return false;
      } else {
        return false;
      }
    }
  }

  return true;
}
```


#### 🛠️ Advanced Memoization Patterns


**Pattern 1: Memoized Component with Complex State**


```javascript
// Real-world example: Trading chart component
const TradingChart = React.memo(({
  symbol,
  timeframe,
  data,
  indicators,
  onTimeframeChange,
  onIndicatorToggle
}) => {
  console.log(`TradingChart rendered for ${symbol}`);

  // Expensive chart calculations
  const chartData = useMemo(() => {
    console.log('Calculating chart data...');

    return data.map(point => ({
      ...point,
      // Apply technical indicators
      sma: calculateSMA(data, point.index, indicators.sma.period),
      ema: calculateEMA(data, point.index, indicators.ema.period),
      rsi: calculateRSI(data, point.index, indicators.rsi.period)
    })).filter(point =>
      point.timestamp >= timeframe.start &&
      point.timestamp <= timeframe.end
    );
  }, [data, timeframe, indicators]);

  // Memoized event handlers
  const handleTimeframeChange = useCallback((newTimeframe) => {
    onTimeframeChange(symbol, newTimeframe);
  }, [symbol, onTimeframeChange]);

  const handleIndicatorToggle = useCallback((indicatorName) => {
    onIndicatorToggle(symbol, indicatorName);
  }, [symbol, onIndicatorToggle]);

  return (
    <div className="trading-chart">
      <ChartHeader
        symbol={symbol}
        timeframe={timeframe}
        onTimeframeChange={handleTimeframeChange}
      />

      <ChartCanvas data={chartData} />

      <IndicatorControls
        indicators={indicators}
        onToggle={handleIndicatorToggle}
      />
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for trading chart
  if (prevProps.symbol !== nextProps.symbol) return false;

  // Compare timeframe
  if (prevProps.timeframe.start !== nextProps.timeframe.start ||
      prevProps.timeframe.end !== nextProps.timeframe.end) return false;

  // Compare data length and last few points (for performance)
  if (prevProps.data.length !== nextProps.data.length) return false;
  if (prevProps.data.length > 0) {
    const lastIndex = prevProps.data.length - 1;
    if (prevProps.data[lastIndex].timestamp !== nextProps.data[lastIndex].timestamp ||
        prevProps.data[lastIndex].price !== nextProps.data[lastIndex].price) {
      return false;
    }
  }

  // Deep compare indicators (they change rarely)
  if (!isEqual(prevProps.indicators, nextProps.indicators)) return false;

  return true; // Skip re-render
});

// Technical indicator calculations
function calculateSMA(data, currentIndex, period) {
  if (currentIndex < period - 1) return null;

  let sum = 0;
  for (let i = currentIndex - period + 1; i <= currentIndex; i++) {
    sum += data[i].price;
  }
  return sum / period;
}

function calculateEMA(data, currentIndex, period) {
  if (currentIndex === 0) return data[0].price;

  const multiplier = 2 / (period + 1);
  const prevEMA = data[currentIndex - 1].ema || data[currentIndex - 1].price;
  return (data[currentIndex].price * multiplier) + (prevEMA * (1 - multiplier));
}
```


**Pattern 2: Virtualized List with Memoization**


```javascript
// High-performance virtualized list component
const VirtualizedList = React.memo(({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  onItemClick
}) => {
  const [scrollTop, setScrollTop] = useState(0);

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const endIndex = Math.min(startIndex + visibleCount + 1, items.length);

    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, items.length]);

  // Generate visible items
  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex).map((item, index) => {
      const actualIndex = visibleRange.startIndex + index;
      return {
        ...item,
        index: actualIndex,
        top: actualIndex * itemHeight
      };
    });
  }, [items, visibleRange, itemHeight]);

  // Memoized scroll handler
  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);

  // Memoized click handler
  const handleItemClick = useCallback((item, index) => {
    onItemClick(item, index);
  }, [onItemClick]);

  return (
    <div
      className="virtualized-list"
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={handleScroll}
    >
      {/* Virtual spacer for items above visible range */}
      <div style={{ height: visibleRange.startIndex * itemHeight }} />

      {/* Visible items */}
      {visibleItems.map(item => (
        <VirtualizedListItem
          key={item.id}
          item={item}
          style={{
            position: 'absolute',
            top: item.top,
            height: itemHeight,
            width: '100%'
          }}
          renderItem={renderItem}
          onClick={() => handleItemClick(item, item.index)}
        />
      ))}

      {/* Virtual spacer for items below visible range */}
      <div style={{
        height: (items.length - visibleRange.endIndex) * itemHeight
      }} />
    </div>
  );
}, (prevProps, nextProps) => {
  // Only re-render if items array reference changed
  // or if other props changed
  return (
    prevProps.items === nextProps.items &&
    prevProps.itemHeight === nextProps.itemHeight &&
    prevProps.containerHeight === nextProps.containerHeight &&
    prevProps.renderItem === nextProps.renderItem &&
    prevProps.onItemClick === nextProps.onItemClick
  );
});

// Individual list item component
const VirtualizedListItem = React.memo(({ item, style, renderItem, onClick }) => {
  return (
    <div style={style} onClick={onClick}>
      {renderItem(item)}
    </div>
  );
});
```


#### 🏭 Production Case Study: Figma Layer Panel Optimization


```javascript
// Real-world optimization case from Figma-style design tool
const LayerPanel = React.memo(() => {
  const layers = useDesignStore(state => state.layers);
  const selectedLayerIds = useDesignStore(state => state.selectedLayerIds);

  return (
    <div className="layer-panel">
      <LayerTree
        layers={layers}
        selectedIds={selectedLayerIds}
      />
    </div>
  );
});

const LayerTree = React.memo(({ layers, selectedIds }) => {
  // Convert flat layers to tree structure
  const layerTree = useMemo(() => {
    return buildLayerTree(layers);
  }, [layers]);

  return (
    <div className="layer-tree">
      {layerTree.map(layer => (
        <LayerTreeNode
          key={layer.id}
          layer={layer}
          isSelected={selectedIds.includes(layer.id)}
          selectedIds={selectedIds}
        />
      ))}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison để handle selectedIds array
  if (prevProps.layers !== nextProps.layers) return false;

  // Compare selectedIds arrays
  if (prevProps.selectedIds.length !== nextProps.selectedIds.length) return false;

  // Check if selection actually changed
  const prevSelected = new Set(prevProps.selectedIds);
  const nextSelected = new Set(nextProps.selectedIds);

  if (prevSelected.size !== nextSelected.size) return false;

  for (let id of prevSelected) {
    if (!nextSelected.has(id)) return false;
  }

  return true; // Selection didn't change
});

const LayerTreeNode = React.memo(({ layer, isSelected, selectedIds }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const selectLayer = useDesignStore(state => state.selectLayer);
  const toggleLayerVisibility = useDesignStore(state => state.toggleLayerVisibility);

  // Memoized handlers
  const handleSelect = useCallback((e) => {
    e.stopPropagation();
    selectLayer(layer.id, {
      addToSelection: e.metaKey || e.ctrlKey,
      rangeSelect: e.shiftKey
    });
  }, [layer.id, selectLayer]);

  const handleVisibilityToggle = useCallback((e) => {
    e.stopPropagation();
    toggleLayerVisibility(layer.id);
  }, [layer.id, toggleLayerVisibility]);

  const handleExpandToggle = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  return (
    <div className={`layer-node ${isSelected ? 'selected' : ''}`}>
      <div className="layer-header" onClick={handleSelect}>
        {layer.children?.length > 0 && (
          <button
            className="expand-toggle"
            onClick={handleExpandToggle}
          >
            {isExpanded ? '▼' : '▶'}
          </button>
        )}

        <LayerIcon type={layer.type} />

        <span className="layer-name">{layer.name}</span>

        <button
          className="visibility-toggle"
          onClick={handleVisibilityToggle}
        >
          {layer.visible ? '👁' : '🚫'}
        </button>
      </div>

      {isExpanded && layer.children && (
        <div className="layer-children">
          {layer.children.map(child => (
            <LayerTreeNode
              key={child.id}
              layer={child}
              isSelected={selectedIds.includes(child.id)}
              selectedIds={selectedIds}
            />
          ))}
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Only re-render if layer data hoặc selection status changed
  if (prevProps.layer !== nextProps.layer) return false;
  if (prevProps.isSelected !== nextProps.isSelected) return false;

  // For children selection highlighting, check if any child selection changed
  if (prevProps.layer.children) {
    const prevChildrenSelected = prevProps.layer.children.some(child =>
      prevProps.selectedIds.includes(child.id)
    );
    const nextChildrenSelected = nextProps.layer.children.some(child =>
      nextProps.selectedIds.includes(child.id)
    );

    if (prevChildrenSelected !== nextChildrenSelected) return false;
  }

  return true;
});

// Utility function
function buildLayerTree(flatLayers) {
  const layerMap = new Map(flatLayers.map(layer => [layer.id, { ...layer, children: [] }]));
  const rootLayers = [];

  for (const layer of layerMap.values()) {
    if (layer.parentId && layerMap.has(layer.parentId)) {
      layerMap.get(layer.parentId).children.push(layer);
    } else {
      rootLayers.push(layer);
    }
  }

  return rootLayers;
}
```


#### 💭 Mental Model: When NOT to Use React.memo


**Anti-patterns và Common Mistakes**:


```javascript
// ❌ BAD: Over-memoization
const SimpleComponent = React.memo(({ text }) => {
  return <div>{text}</div>; // Too simple to benefit from memoization
});

// ❌ BAD: Memoizing components with unstable props
function Parent() {
  return (
    <MemoizedChild
      data={{ key: 'value' }} // New object every render!
      onClick={() => console.log('clicked')} // New function every render!
    />
  );
}

// ❌ BAD: Memoizing everything without measuring
const OverMemoizedApp = React.memo(() => {
  return (
    <div>
      {/* Memoizing every single component adds overhead */}
      <MemoizedHeader />
      <MemoizedNavigation />
      <MemoizedContent />
      <MemoizedFooter />
    </div>
  );
});

// ✅ GOOD: Strategic memoization
function OptimizedApp() {
  const [heavyData, setHeavyData] = useState([]);
  const [lightweightState, setLightweightState] = useState('');

  return (
    <div>
      {/* Don't memoize simple, fast components */}
      <SimpleHeader />

      {/* Memoize expensive components */}
      <ExpensiveDataVisualization data={heavyData} />

      {/* Memoize components that receive stable props */}
      <ComplexForm
        initialData={useMemo(() => ({ /* stable object */ }), [])}
        onSubmit={useCallback((data) => {/* stable function */}, [])}
      />
    </div>
  );
}
```


**Performance Measurement Strategy**:


```javascript
// Measure before optimizing
function withPerformanceTracking(Component, componentName) {
  return React.memo((props) => {
    const renderStart = performance.now();

    useEffect(() => {
      const renderEnd = performance.now();
      console.log(`${componentName} rendered in ${renderEnd - renderStart}ms`);
    });

    return <Component {...props} />;
  });
}

// Usage
const TrackedExpensiveComponent = withPerformanceTracking(
  ExpensiveComponent,
  'ExpensiveComponent'
);

// React DevTools Profiler integration
function ProfiledComponent(props) {
  return (
    <Profiler
      id="ExpensiveComponent"
      onRender={(id, phase, actualDuration) => {
        if (actualDuration > 16) { // More than one frame
          console.warn(`${id} took ${actualDuration}ms to render`);
        }
      }}
    >
      <ExpensiveComponent {...props} />
    </Profiler>
  );
}
```


#### 🎯 Interview Questions: Memoization Mastery


**Basic Level**:


1. *"Explain how React.memo works internally"*
2. *"When should you use React.memo và when should you avoid it?"*
3. *"What's the difference between React.memo và useMemo?"*


**Intermediate Level**:


1. *"How do you implement custom comparison functions for React.memo?"*
2. *"Explain the performance trade-offs of memoization"*
3. *"How do you debug unnecessary re-renders in React?"*


**Advanced Level**:


1. *"Design a memoization strategy for a complex data visualization component"*
2. *"How would you implement selective memoization in a large component tree?"*
3. *"Explain virtual DOM diffing và how React.memo affects it"*


**Production Scenarios**:


1. *"Your app has performance issues with list rendering. Walk through your optimization approach."*
2. *"How do you balance memory usage với CPU performance in memoization strategies?"*
3. *"Design a performance monitoring system for React component render times."*


---


## 📖 CONCLUSION: THE COMPONENT COMMUNICATION MASTERY ROADMAP


### 🎯 Your Learning Journey: From Beginner to Principal


Sau 6000+ từ deep diving into React component communication, đây là roadmap để master these concepts:


#### 🌱 Level 1: Foundation (Weeks 1-4)


**Master These Patterns:**


- Props và callbacks for parent-child communication
- Basic state lifting for sibling communication
- Simple Context API usage for avoiding props drilling


**Practice Projects:**


- Todo app với component hierarchy
- Shopping cart với multiple components
- Simple dashboard với data sharing


**Success Metrics:**


- Can explain one-way data flow
- Comfortable với props và state
- Understands when to lift state up


#### 🚀 Level 2: Intermediate (Weeks 5-12)


**Master These Patterns:**


- Advanced Context API với performance optimization
- Zustand for global state management
- Custom hooks for reusable logic
- Basic React.memo usage


**Practice Projects:**


- E-commerce platform với real-time cart
- Dashboard với WebSocket data
- Form builder với dynamic fields


**Success Metrics:**


- Can choose appropriate patterns for different scenarios
- Understands performance implications
- Can debug communication issues effectively


#### ⚡ Level 3: Advanced (Months 3-6)


**Master These Patterns:**


- Redux Toolkit với complex async flows
- Advanced memoization strategies
- Custom event bus systems
- Refs và useImperativeHandle for imperative APIs


**Practice Projects:**


- Real-time collaboration tool (think Figma/Google Docs)
- Trading dashboard với high-frequency updates
- Visual editor với drag & drop


**Success Metrics:**


- Can architect state management for large applications
- Understands memory và performance trade-offs
- Can implement complex communication patterns


#### 🏆 Level 4: Principal (Months 6-12)


**Master These Concepts:**


- System architecture decisions
- Team collaboration patterns
- Migration strategies
- Performance monitoring và optimization


**Practice Projects:**


- Design system for multiple teams
- Micro-frontend communication
- Enterprise-grade application architecture


**Success Metrics:**


- Can make architectural decisions với confidence
- Can lead teams in implementing communication patterns
- Can balance technical debt với feature delivery


### 💭 Final Reflection: The Principal's Perspective


Component communication trong React isn't just about technical patterns - nó là về designing systems that humans can understand, maintain, và evolve.


**Key Insights tôi muốn bạn remember:**


1. **Start Simple**: Always begin với simplest pattern that solves your problem. You can always evolve.
2. **Measure Performance**: Don't optimize until you have data. React DevTools Profiler is your friend.
3. **Team Context Matters**: Technical decisions should consider team experience và project timeline.
4. **Evolve Gradually**: The best architectures evolve step-by-step, không phải được designed perfect from day one.
5. **Communication is Key**: The most elegant code means nothing nếu team không hiểu how to maintain it.


### 🚀 Your Next Steps


1. **Choose a Practice Project**: Pick something slightly above your current level
2. **Implementation Timeline**: Set 2-4 weeks để implement và iterate
3. **Get Feedback**: Share your code với others, ask for reviews
4. **Measure Impact**: Use React DevTools để understand performance implications
5. **Document Learnings**: Write about what you learned, challenges you faced


### 📚 Recommended Resources for Continued Learning


**Official Documentation:**


- React Official Docs (react.dev)
- Redux Toolkit Documentation
- Zustand GitHub repo


**Advanced Reading:**


- "React Performance" by Kent C. Dodds
- React source code (github.com/facebook/react)
- Overreacted.io blog by Dan Abramov


**Tools for Practice:**


- CodeSandbox for quick experiments
- React DevTools for performance profiling
- TypeScript for type safety


---


**Remember**: Component communication mastery isn't about knowing every pattern - nó là về knowing which pattern to choose, when to evolve, và how to communicate your decisions effectively với your team.


Good luck on your journey! 🚀


*"The best React developers aren't those who know the most patterns, but those who choose the right patterns for their team và context."* - Principal Engineer wisdom
