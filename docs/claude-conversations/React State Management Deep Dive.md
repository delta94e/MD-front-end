# React State Management Deep Dive

## Claude


# Phân Tích Chuyên Sâu: State Management Trong React - Góc Nhìn Principal Engineer


## Mở Đầu: Hành Trình Hiểu Sâu State Management


Khi tôi nhìn lại hành trình 15 năm làm việc tại các công ty như NAB, Axon, Binance, Webflow, và Figma, tôi nhận ra rằng state management không chỉ là một kỹ thuật - nó là nghệ thuật của việc mô hình hóa dữ liệu trong ứng dụng. Từ những ngày đầu với jQuery manipulation DOM trực tiếp đến thời đại hiện tại với React và các patterns phức tạp, tôi đã chứng kiến sự tiến hóa của cách chúng ta quản lý state.


Bài viết này không chỉ là một tutorial thông thường. Đây là một cuộc hành trình khám phá sâu vào bản chất của state management, từ những principles cơ bản nhất đến những architectural decisions phức tạp mà chỉ có kinh nghiệm thực tế mới có thể dạy được.


### Tại Sao State Management Quan Trọng Đến Vậy?


Trước khi đi sâu vào các khái niệm kỹ thuật, hãy hiểu rõ tại sao state management lại là backbone của mọi ứng dụng React hiện đại. Tôi đã từng debugging một bug tại Binance trong 3 ngày liền chỉ vì misunderstanding về cách Redux handle async actions. Đó là lúc tôi nhận ra: không hiểu sâu state management = không thể build reliable applications.


State trong ứng dụng web giống như hệ thần kinh trong cơ thể người. Mọi tương tác, mọi thay đổi đều được truyền tải thông qua state. Khi state management được thiết kế tốt, ứng dụng chạy mượt mà như một cỗ máy được tinh chế. Khi state management tồi, bug sẽ xuất hiện khắp nơi như virus lây lan.


## Phần I: Foundation Level - Xây Dựng Nền Tảng Vững Chắc


### Chương 1: Hiểu Bản Chất của State


#### 1.1 State Là Gì Thực Sự?


Nguồn Gốc & Motivation:


State, trong computer science, được định nghĩa như là snapshot của data tại một thời điểm cụ thể. Nhưng trong React, state mang ý nghĩa sâu sắc hơn nhiều. Nó không chỉ là data, mà là "linh hồn" của component - thứ quyết định component sẽ render như thế nào tại mọi thời điểm.


Trước khi React ra đời, chúng ta quản lý state thông qua DOM manipulation trực tiếp. Hãy tưởng tượng bạn có một counter app với vanilla JavaScript:


```javascript
// Cách cũ - DOM manipulation trực tiếp
let count = 0;
const counterElement = document.getElementById('counter');
const buttonElement = document.getElementById('increment-btn');

function updateCounter() {
    count += 1;
    counterElement.textContent = count; // Manual DOM update
}

buttonElement.addEventListener('click', updateCounter);
```


Vấn đề với approach này là gì? Khi ứng dụng phức tạp lên, việc đồng bộ giữa data (count) và UI (counterElement) trở nên nightmare. Bạn phải manually update DOM ở khắp nơi, dẫn đến inconsistent state và bugs không thể predict được.


React sinh ra để giải quyết chính xác vấn đề này thông qua declarative programming paradigm. Thay vì nói "làm gì" (imperative), chúng ta nói "muốn gì" (declarative).


Bản Chất & Mechanism:


State trong React hoạt động dựa trên reconciliation algorithm - một process so sánh virtual DOM trees và chỉ update những phần thực sự thay đổi trong real DOM. Đây là breakthrough lớn vì:


1. **Predictable Updates**: Mỗi state change trigger một re-render cycle có thể predict được
2. **Performance Optimization**: Chỉ update minimal DOM nodes
3. **Developer Experience**: Code theo functional programming style


Khi bạn gọi `setState` (class components) hoặc state setter từ `useState` (functional components), React không update state immediately. Thay vào đó, nó schedule một update và batch multiple updates lại với nhau để tối ưu performance.


Intuitive Understanding:


Hãy tưởng tượng state như một cuốn sổ ghi chép của component. Mỗi khi bạn muốn thay đổi ghi chú, bạn không xóa toàn bộ trang và viết lại từ đầu. Thay vào đó, bạn chỉ update những phần cần thiết. React làm exactly điều này với UI.


#### 1.2 useState Hook - Cánh Cửa Vào Thế Giới State


Nguồn Gốc & Motivation:


Hooks được introduce trong React 16.8 như một revolution trong cách chúng ta viết components. Trước đó, chỉ class components mới có thể có state, và việc share stateful logic giữa components là extremely difficult.


Dan Abramov và React team đã struggle với những vấn đề này trong nhiều năm:


- **Wrapper Hell**: Higher-Order Components (HOCs) và Render Props tạo ra deeply nested component trees
- **Complex Lifecycle**: componentDidMount, componentDidUpdate, componentWillUnmount scattered logic
- **Class Confusion**: `this` binding và lifecycle methods confusing cho developers


useState là hook đầu tiên và fundamental nhất, được thiết kế để bring state functionality vào functional components một cách clean và intuitive.


Bản Chất & Mechanism:


```javascript
const [state, setState] = useState(initialValue);
```


Thoạt nhìn syntax này simple, nhưng mechanism phía sau rất sophisticated. Hãy break down từng component:


**Array Destructuring**: React trả về một array với exactly 2 elements:


- Index 0: Current state value
- Index 1: Function để update state


**Closure Magic**: useState leverage JavaScript closures để maintain state giữa các re-renders. Mỗi component instance có riêng state slot trong React's internal fiber node.


**State Initialization**: initialValue chỉ được sử dụng trong lần render đầu tiên. Trong subsequent renders, React ignore parameter này.


Implementation Deep Dive:


Hãy xem pseudo-code của useState implementation:


```javascript
// Simplified React internals
let currentFiber = null;
let hookIndex = 0;

function useState(initialValue) {
    const fiber = currentFiber;
    const hooks = fiber.hooks || (fiber.hooks = []);
    const hook = hooks[hookIndex] || (hooks[hookIndex] = {
        state: initialValue,
        queue: []
    });

    // Process queued updates
    let newState = hook.state;
    hook.queue.forEach(update => {
        newState = typeof update === 'function' ? update(newState) : update;
    });
    hook.state = newState;
    hook.queue = [];

    const setState = (update) => {
        hook.queue.push(update);
        scheduleReRender(fiber);
    };

    hookIndex++;
    return [hook.state, setState];
}
```


Step-by-step Execution Flow:


1. **Hook Registration**: React registers hook với current fiber node
2. **State Retrieval**: Lấy current state từ hook storage
3. **Queue Processing**: Xử lý pending updates từ queue
4. **Setter Creation**: Tạo setState function với closure over hook reference
5. **Return Array**: Trả về [currentState, setter]


Production Reality - Kinh Nghiệm Tại Figma:


Tại Figma, chúng tôi có một design tool với thousands of components và complex state interactions. Một lesson đắt giá tôi học được là: **useState không phải lúc nào cũng là best choice**.


Cụ thể, khi implement collaborative editing feature, chúng tôi ban đầu sử dụng useState để track cursor positions của multiple users:


```javascript
// Approach tồi - Re-render hell
function CollaborativeCanvas() {
    const [userCursors, setUserCursors] = useState({});

    useEffect(() => {
        socket.on('cursor-move', (userId, position) => {
            setUserCursors(prev => ({
                ...prev,
                [userId]: position
            }));
        });
    }, []);

    return (
        <Canvas>
            {Object.entries(userCursors).map(([userId, position]) => (
                <UserCursor key={userId} position={position} />
            ))}
        </Canvas>
    );
}
```


Vấn đề: Mỗi cursor movement trigger re-render của entire Canvas component, causing performance bottleneck với 50+ concurrent users.


Solution: Chuyển sang useRef để track cursor positions và chỉ re-render khi cần thiết:


```javascript
// Approach tốt hơn
function CollaborativeCanvas() {
    const userCursorsRef = useRef({});
    const [, forceRerender] = useReducer(x => x + 1, 0);

    const updateCursor = useCallback((userId, position) => {
        userCursorsRef.current[userId] = position;
        // Chỉ re-render khi user stop moving (debounced)
        debouncedRerender();
    }, []);

    // Rest of implementation...
}
```


Principal's Perspective:


Từ góc độ architecture, useState là building block cơ bản nhất, nhưng nó cũng là source của nhiều performance issues nếu không được sử dụng correctly. Khi mentoring junior developers, tôi luôn emphasize:


1. **useState for Local Component State**: Chỉ sử dụng cho state truly belong to component
2. **Avoid useState for Derived State**: Không dùng useState cho values có thể calculate từ props
3. **Consider useRef for Non-Rendering State**: Sử dụng useRef cho data không affect rendering


### Chương 2: Props và Data Flow - Hệ Thống Tuần Hoàn Của React


#### 2.1 Props: Huyết Mạch Của Component Communication


Nguồn Gốc & Motivation:


Props (properties) là React's implementation của functional programming principle: **pure functions**. Ý tưởng cốt lõi là components should be predictable - given same props, component should render exactly the same output.


Concept này được inspire từ mathematical functions:


```
f(x) = y
Component(props) = JSX
```


Trước React, component communication thông qua global variables hoặc direct DOM manipulation - extremely error-prone và hard to debug. Props introduce one-way data flow, making applications much more predictable.


Bản Chất & Mechanism:


Props trong React hoạt động thông qua JavaScript's parameter passing mechanism, nhưng với twist đặc biệt: **immutability**. React enforce rằng props are read-only trong component.


```javascript
// Parent component
function App() {
    const message = "Hello World";
    return <ChildComponent greeting={message} />;
}

// Child component
function ChildComponent(props) {
    // props.greeting = "Modified"; // ❌ Không được phép!
    return <h1>{props.greeting}</h1>;
}
```


Memory Model Analysis:


Khi React render component tree, nó tạo một object structure trong memory:


```javascript
// React's internal representation (simplified)
const elementTree = {
    type: App,
    props: {},
    children: [{
        type: ChildComponent,
        props: { greeting: "Hello World" },
        children: []
    }]
};
```


Props được pass by reference cho objects/arrays, nhưng React's reconciliation algorithm ensure rằng components chỉ re-render khi props thực sự change (shallow comparison).


Implementation Deep Dive:


```javascript
// React internals cho prop passing
function renderComponent(Component, props) {
    // Freeze props để prevent mutations
    if (process.env.NODE_ENV === 'development') {
        Object.freeze(props);
    }

    return Component(props);
}
```


Việc freeze props trong development mode giúp catch bugs sớm khi developer accidentally mutate props.


Production Reality - Kinh Nghiệm Tại NAB:


Tại NAB, chúng tôi build một banking dashboard với complex data visualization. Ban đầu, chúng tôi pass toàn bộ account data như một massive object:


```javascript
// Approach tồi - Over-passing props
function AccountDashboard({ accountData }) {
    return (
        <div>
            <AccountHeader accountData={accountData} />
            <TransactionList accountData={accountData} />
            <BalanceChart accountData={accountData} />
        </div>
    );
}

function TransactionList({ accountData }) {
    // Chỉ cần accountData.transactions nhưng nhận toàn bộ object
    return accountData.transactions.map(transaction => (
        <TransactionItem key={transaction.id} transaction={transaction} />
    ));
}
```


Vấn đề:


1. **Unnecessary Re-renders**: Khi balance change, TransactionList re-render mặc dù transactions không đổi
2. **Poor Encapsulation**: Components biết quá nhiều về data structure
3. **Hard to Test**: Phải mock toàn bộ accountData object cho unit tests


Solution:


```javascript
// Approach tốt hơn - Selective prop passing
function AccountDashboard({ accountData }) {
    return (
        <div>
            <AccountHeader
                accountNumber={accountData.accountNumber}
                customerName={accountData.customerName}
            />
            <TransactionList transactions={accountData.transactions} />
            <BalanceChart
                balance={accountData.balance}
                history={accountData.balanceHistory}
            />
        </div>
    );
}
```


#### 2.2 Callback Functions: Upward Communication Channel


Nguồn Gốc & Motivation:


React's unidirectional data flow tạo ra một challenge: làm sao child components communicate với parents? Callback functions là elegant solution cho vấn đề này, inspired từ functional programming và event-driven architecture.


Concept này không phải mới - nó exist trong JavaScript từ lâu thông qua event listeners. React adapts pattern này để create consistent communication mechanism.


Bản Chất & Mechanism:


Callback functions hoạt động thông qua closure và higher-order functions:


```javascript
function Parent() {
    const [count, setCount] = useState(0);

    // Callback function được tạo trong parent scope
    const handleIncrement = () => {
        setCount(prev => prev + 1);
    };

    // Pass callback như một prop
    return <Child onIncrement={handleIncrement} />;
}

function Child({ onIncrement }) {
    // Child trigger callback khi cần
    return <button onClick={onIncrement}>Increment</button>;
}
```


Memory Model & Closure Analysis:


Khi Parent component render, JavaScript engine tạo execution context với lexical environment chứa:


- `count` state
- `setCount` function reference
- `handleIncrement` closure


handleIncrement closure capture reference đến parent's lexical environment, cho phép child component access và modify parent state through callback.


Step-by-step Execution Flow:


1. **Parent Renders**: Tạo handleIncrement closure
2. **Prop Passing**: handleIncrement được pass như prop
3. **Child Renders**: Receive callback trong props
4. **Event Triggering**: User click button, trigger callback
5. **Closure Execution**: handleIncrement execute trong parent scope
6. **State Update**: setCount được call, trigger re-render
7. **Reconciliation**: React compare old và new virtual DOM trees
8. **DOM Update**: Update minimal DOM nodes


Production Reality - Kinh Nghiệm Tại Webflow:


Tại Webflow, chúng tôi build visual website builder với drag-and-drop functionality. Communication between draggable elements và layout container là critical:


```javascript
// Complex callback chain trong Webflow's editor
function WebflowEditor() {
    const [elements, setElements] = useState([]);
    const [selectedElement, setSelectedElement] = useState(null);

    const handleElementDrop = useCallback((elementId, newPosition) => {
        setElements(prev => prev.map(el =>
            el.id === elementId
                ? { ...el, position: newPosition }
                : el
        ));
    }, []);

    const handleElementSelect = useCallback((elementId) => {
        setSelectedElement(elementId);
    }, []);

    return (
        <EditorCanvas
            elements={elements}
            onElementDrop={handleElementDrop}
            onElementSelect={handleElementSelect}
        />
    );
}
```


Challenge ở đây là performance: với hundreds of elements, callback chains có thể cause significant overhead. Solution là implementing callback memoization và event delegation.


Principal's Perspective - Callback Performance Optimization:


Một pattern tôi develop qua years of experience là "Callback Factory Pattern":


```javascript
function OptimizedParent() {
    const [items, setItems] = useState([]);

    // Thay vì tạo callback mới cho mỗi item
    const createItemCallback = useCallback((itemId) => {
        return (newValue) => {
            setItems(prev => prev.map(item =>
                item.id === itemId
                    ? { ...item, value: newValue }
                    : item
            ));
        };
    }, []);

    // Cache callbacks để avoid re-creation
    const callbackCache = useRef(new Map());

    const getItemCallback = useCallback((itemId) => {
        if (!callbackCache.current.has(itemId)) {
            callbackCache.current.set(itemId, createItemCallback(itemId));
        }
        return callbackCache.current.get(itemId);
    }, [createItemCallback]);

    return items.map(item => (
        <OptimizedChild
            key={item.id}
            item={item}
            onChange={getItemCallback(item.id)}
        />
    ));
}
```


### Chương 3: Prop Drilling - Vấn Đề Và Giải Pháp


#### 3.1 Hiểu Bản Chất Prop Drilling


Nguồn Gốc & Motivation:


Prop drilling không phải là bug - nó là natural consequence của React's unidirectional data flow. Khi applications grow, component trees become deeper, và việc pass props qua multiple levels becomes tedious và error-prone.


Hãy tưởng tượng một scenario thực tế: bạn có user authentication state ở top-level App component, nhưng cần access user info ở một deeply nested ProfileAvatar component:


```
App (has user state)
├── Header
│   └── Navigation
│       └── UserMenu
│           └── ProfileAvatar (needs user state)
├── Main
│   └── Content
└── Footer
```


Để pass user data từ App đến ProfileAvatar, bạn phải thread props qua Header → Navigation → UserMenu, mặc dù các intermediate components không sử dụng user data.


Bản Chất & Mechanism:


Prop drilling tạo ra coupling giữa components không directly related. Intermediate components become "prop conduits" - chúng chỉ exist để pass data through, không có business logic riêng.


```javascript
// Prop drilling hell
function App() {
    const [user, setUser] = useState(null);

    return (
        <div>
            <Header user={user} />
            <Main user={user} />
        </div>
    );
}

function Header({ user }) {
    return (
        <header>
            <Navigation user={user} />
        </header>
    );
}

function Navigation({ user }) {
    return (
        <nav>
            <UserMenu user={user} />
        </nav>
    );
}

function UserMenu({ user }) {
    return (
        <div>
            <ProfileAvatar user={user} />
        </div>
    );
}

function ProfileAvatar({ user }) {
    return <img src={user?.avatar} alt={user?.name} />;
}
```


Production Reality - Kinh Nghiệm Tại Axon:


Tại Axon, chúng tôi build law enforcement software với complex permission systems. Ban đầu, permission data được drilled qua 8-10 component levels:


```javascript
// Nightmare scenario tại Axon
function AxonApp() {
    const [userPermissions, setUserPermissions] = useState([]);

    return (
        <Dashboard permissions={userPermissions}>
            <Sidebar permissions={userPermissions}>
                <NavigationMenu permissions={userPermissions}>
                    <MenuItem permissions={userPermissions}>
                        <ActionButton permissions={userPermissions} />
                    </MenuItem>
                </NavigationMenu>
            </Sidebar>
        </Dashboard>
    );
}
```


Problems encountered:


1. **Refactoring Nightmare**: Thay đổi permission structure require updates ở multiple components
2. **Performance Issues**: Intermediate components re-render unnecessarily
3. **Testing Complexity**: Mocking props chains trong unit tests extremely difficult
4. **Developer Experience**: New team members confused về data flow


#### 3.2 Context API - Giải Pháp Elegant Cho Prop Drilling


Nguồn Gốc & Motivation:


Context API được introduce để solve exact problem của prop drilling. Nó inspired từ dependency injection pattern trong other frameworks và publisher-subscriber pattern trong software architecture.


React team design Context API với philosophy: "data that is truly global should be accessible globally". Typical use cases:


- Theme information (dark/light mode)
- Authentication state
- Locale/language preferences
- Application-wide settings


Bản Chất & Mechanism:


Context API hoạt động thông qua Provider-Consumer pattern:


1. **Context Creation**: `createContext()` tạo context object
2. **Provider Setup**: Provider component wrap component tree và provide data
3. **Consumer Access**: Components consume data thông qua `useContext()` hook


```javascript
// Context creation và usage
const UserContext = createContext();

function App() {
    const [user, setUser] = useState(null);

    return (
        <UserContext.Provider value={{ user, setUser }}>
            <Header />
            <Main />
        </UserContext.Provider>
    );
}

function ProfileAvatar() {
    const { user } = useContext(UserContext);
    return <img src={user?.avatar} alt={user?.name} />;
}
```


Memory Model Analysis:


Context Provider tạo một "broadcast channel" trong React's fiber tree. Khi context value change, React traverse fiber tree và mark tất cả components consuming context for re-render.


Implementation Deep Dive:


```javascript
// Simplified Context implementation
function createContext(defaultValue) {
    const context = {
        _currentValue: defaultValue,
        Provider: function ContextProvider({ value, children }) {
            context._currentValue = value;
            return children;
        }
    };

    return context;
}

function useContext(context) {
    // Subscribe component to context changes
    const currentFiber = getCurrentFiber();
    const contextValue = context._currentValue;

    // Mark component for re-render when context changes
    subscribeToContext(currentFiber, context);

    return contextValue;
}
```


Production Reality - Context API Optimization Tại Binance:


Tại Binance, chúng tôi sử dụng Context API extensively cho trading interface. Initial implementation gặp performance issues:


```javascript
// Problematic approach - Single massive context
const TradingContext = createContext();

function TradingProvider({ children }) {
    const [prices, setPrices] = useState({});
    const [orders, setOrders] = useState([]);
    const [portfolio, setPortfolio] = useState({});
    const [userPreferences, setUserPreferences] = useState({});

    // Problem: Mọi thay đổi trigger re-render của all consumers
    const value = {
        prices, setPrices,
        orders, setOrders,
        portfolio, setPortfolio,
        userPreferences, setUserPreferences
    };

    return (
        <TradingContext.Provider value={value}>
            {children}
        </TradingContext.Provider>
    );
}
```


Issues:


- Price updates (very frequent) caused order list component re-renders
- User preference changes triggered price chart re-renders
- Performance degradation với high-frequency trading data


Solution - Context Separation Pattern:


```javascript
// Optimized approach - Separate contexts by update frequency
const PriceContext = createContext();
const OrderContext = createContext();
const PortfolioContext = createContext();
const UserPreferencesContext = createContext();

function TradingProviders({ children }) {
    return (
        <PriceProvider>
            <OrderProvider>
                <PortfolioProvider>
                    <UserPreferencesProvider>
                        {children}
                    </UserPreferencesProvider>
                </PortfolioProvider>
            </OrderProvider>
        </PriceProvider>
    );
}

// Components chỉ subscribe to contexts they actually need
function PriceChart() {
    const { prices } = useContext(PriceContext);
    // Không re-render khi orders change
    return <Chart data={prices} />;
}

function OrderList() {
    const { orders } = useContext(OrderContext);
    // Không re-render khi prices change
    return orders.map(order => <OrderItem key={order.id} order={order} />);
}
```


Principal's Perspective - Context Best Practices:


Qua experience tại multiple companies, tôi develop những principles sau cho Context usage:


**1. Context Granularity Principle**: Separate contexts by data change frequency và consumer needs.


**2. Provider Composition Pattern**: Compose multiple providers thay vì single massive provider.


**3. Context Value Optimization**:


```javascript
function OptimizedProvider({ children }) {
    const [data, setData] = useState({});

    // Memoize context value để prevent unnecessary re-renders
    const value = useMemo(() => ({
        data,
        setData
    }), [data]);

    return (
        <MyContext.Provider value={value}>
            {children}
        </MyContext.Provider>
    );
}
```


**4. Custom Hook Pattern**: Wrap context consumption trong custom hooks for better API:


```javascript
function useUser() {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within UserProvider');
    }
    return context;
}
```


## Phần II: Senior Level - Patterns và Architecture


### Chương 4: useReducer Hook - State Management Cho Complex Logic


#### 4.1 Từ useState Đến useReducer - Khi Nào Cần Upgrade?


Nguồn Gốc & Motivation:


useReducer được design based trên Redux's reducer pattern và functional programming principles. Nó solve những limitations của useState khi dealing với complex state logic:


1. **State Dependencies**: Khi state updates depend on multiple previous state values
2. **Complex State Objects**: Khi state là nested objects với multiple properties
3. **Predictable Updates**: Khi cần ensure state updates follow strict rules
4. **Testing**: Khi cần test state logic independently from components


Dan Abramov design useReducer như "useState's big brother" - cho same functionality nhưng với more structure và predictability.


Bản Chất & Mechanism:


useReducer implement reducer pattern từ functional programming:


```javascript
const [state, dispatch] = useReducer(reducer, initialState);

// Reducer function signature
function reducer(currentState, action) {
    // Return new state based on action
    return newState;
}
```


Core principles:


- **Pure Function**: Reducer must be pure - same inputs always produce same outputs
- **Immutability**: Never mutate current state, always return new state object
- **Action-Driven**: State changes driven by dispatched actions với descriptive types


Implementation Deep Dive:


```javascript
// React's useReducer implementation (simplified)
function useReducer(reducer, initialState, init) {
    const hook = getCurrentHook();

    if (hook.state === undefined) {
        // Initialize state
        hook.state = init ? init(initialState) : initialState;
        hook.queue = [];
    }

    // Process queued actions
    let newState = hook.state;
    hook.queue.forEach(action => {
        newState = reducer(newState, action);
    });

    hook.state = newState;
    hook.queue = [];

    const dispatch = (action) => {
        hook.queue.push(action);
        scheduleReRender();
    };

    return [hook.state, dispatch];
}
```


Memory Model Analysis:


useReducer maintain state trong component's fiber node, similar to useState. Difference là trong update mechanism - thay vì direct state updates, mọi changes go through reducer function, providing centralized update logic.


Production Reality - Shopping Cart Tại E-commerce Platform:


Tại một e-commerce project, chúng tôi implement shopping cart functionality. Initial useState approach quickly became unwieldy:


```javascript
// useState approach - becomes complex quickly
function ShoppingCart() {
    const [items, setItems] = useState([]);
    const [discounts, setDiscounts] = useState([]);
    const [shippingCost, setShippingCost] = useState(0);
    const [total, setTotal] = useState(0);

    const addItem = (product) => {
        setItems(prev => {
            const existingItem = prev.find(item => item.id === product.id);
            if (existingItem) {
                return prev.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, { ...product, quantity: 1 }];
        });

        // Phải manually update total
        setTotal(calculateTotal(items, discounts, shippingCost));
    };

    const removeItem = (productId) => {
        setItems(prev => prev.filter(item => item.id !== productId));
        setTotal(calculateTotal(items, discounts, shippingCost));
    };

    // More methods... each requiring manual total recalculation
}
```


Problems:


- State updates scattered across multiple functions
- Easy to forget updating derived state (total)
- Difficult to ensure consistency
- Hard to test individual update logic


useReducer Solution:


```javascript
// Initial state structure
const initialCartState = {
    items: [],
    discounts: [],
    shippingCost: 0,
    total: 0
};

// Action types - centralized constants
const CART_ACTIONS = {
    ADD_ITEM: 'ADD_ITEM',
    REMOVE_ITEM: 'REMOVE_ITEM',
    UPDATE_QUANTITY: 'UPDATE_QUANTITY',
    APPLY_DISCOUNT: 'APPLY_DISCOUNT',
    SET_SHIPPING: 'SET_SHIPPING'
};

// Pure reducer function - testable in isolation
function cartReducer(state, action) {
    switch (action.type) {
        case CART_ACTIONS.ADD_ITEM: {
            const { product } = action.payload;
            const existingItemIndex = state.items.findIndex(
                item => item.id === product.id
            );

            let newItems;
            if (existingItemIndex >= 0) {
                newItems = state.items.map((item, index) =>
                    index === existingItemIndex
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            } else {
                newItems = [...state.items, { ...product, quantity: 1 }];
            }

            return {
                ...state,
                items: newItems,
                total: calculateTotal(newItems, state.discounts, state.shippingCost)
            };
        }

        case CART_ACTIONS.REMOVE_ITEM: {
            const newItems = state.items.filter(
                item => item.id !== action.payload.productId
            );

            return {
                ...state,
                items: newItems,
                total: calculateTotal(newItems, state.discounts, state.shippingCost)
            };
        }

        case CART_ACTIONS.APPLY_DISCOUNT: {
            const newDiscounts = [...state.discounts, action.payload.discount];

            return {
                ...state,
                discounts: newDiscounts,
                total: calculateTotal(state.items, newDiscounts, state.shippingCost)
            };
        }

        default:
            return state;
    }
}

// Clean component implementation
function ShoppingCart() {
    const [cartState, dispatch] = useReducer(cartReducer, initialCartState);

    const addItem = (product) => {
        dispatch({
            type: CART_ACTIONS.ADD_ITEM,
            payload: { product }
        });
    };

    const removeItem = (productId) => {
        dispatch({
            type: CART_ACTIONS.REMOVE_ITEM,
            payload: { productId }
        });
    };

    return (
        <div>
            <CartItems items={cartState.items} onRemove={removeItem} />
            <CartTotal total={cartState.total} />
        </div>
    );
}
```


Benefits achieved:


- **Centralized Logic**: Tất cả state update logic ở một place
- **Consistency**: Total always calculated correctly
- **Testability**: Reducer function có thể test independently
- **Debugging**: Action types make it clear what operations happened
- **Predictability**: Same action always produces same state change


#### 4.2 Advanced useReducer Patterns


Async Actions Pattern:


```javascript
// Handle async operations với useReducer
function asyncCartReducer(state, action) {
    switch (action.type) {
        case 'FETCH_CART_START':
            return { ...state, loading: true, error: null };

        case 'FETCH_CART_SUCCESS':
            return {
                ...state,
                loading: false,
                items: action.payload.items,
                total: calculateTotal(action.payload.items)
            };

        case 'FETCH_CART_ERROR':
            return { ...state, loading: false, error: action.payload.error };

        default:
            return state;
    }
}

function useAsyncCart() {
    const [state, dispatch] = useReducer(asyncCartReducer, {
        items: [],
        loading: false,
        error: null,
        total: 0
    });

    const fetchCart = async () => {
        dispatch({ type: 'FETCH_CART_START' });

        try {
            const cartData = await api.fetchCart();
            dispatch({
                type: 'FETCH_CART_SUCCESS',
                payload: { items: cartData.items }
            });
        } catch (error) {
            dispatch({
                type: 'FETCH_CART_ERROR',
                payload: { error: error.message }
            });
        }
    };

    return { ...state, fetchCart };
}
```


Immer Integration Pattern:


```javascript
import produce from 'immer';

// Simplify immutable updates với Immer
function cartReducerWithImmer(state, action) {
    return produce(state, draft => {
        switch (action.type) {
            case CART_ACTIONS.ADD_ITEM:
                const existingItem = draft.items.find(
                    item => item.id === action.payload.product.id
                );

                if (existingItem) {
                    existingItem.quantity += 1;
                } else {
                    draft.items.push({ ...action.payload.product, quantity: 1 });
                }

                draft.total = calculateTotal(draft.items, draft.discounts, draft.shippingCost);
                break;

            case CART_ACTIONS.REMOVE_ITEM:
                draft.items = draft.items.filter(
                    item => item.id !== action.payload.productId
                );
                draft.total = calculateTotal(draft.items, draft.discounts, draft.shippingCost);
                break;
        }
    });
}
```


### Chương 5: Redux và Redux Toolkit - Enterprise-Level State Management


#### 5.1 Tại Sao Redux Tồn Tại?


Nguồn Gốc & Motivation:


Redux được tạo ra bởi Dan Abramov năm 2015 để solve những problems mà React's component state không thể handle efficiently trong large-scale applications:


1. **Shared State**: State cần share giữa components không có direct parent-child relationship
2. **Time Travel Debugging**: Khả năng replay actions để debug complex state changes
3. **Predictable State Updates**: Ensure state changes happen theo controlled manner
4. **DevTools Integration**: Advanced debugging capabilities
5. **Middleware Support**: Extensible architecture cho async operations, logging, etc.


Redux inspired từ Flux architecture và Elm programming language. Core idea là **single source of truth** - entire application state stored trong một central store.


Computer Science Fundamentals:


Redux implement những patterns từ functional programming và computer science:


**Event Sourcing**: Thay vì store current state, store sequence of events (actions) that led to current state.


**Command Pattern**: Actions encapsulate requests as objects, allowing you to parameterize clients với different requests.


**Observer Pattern**: Components subscribe to store changes và re-render khi relevant state changes.


**Reducer Pattern**: Pure functions transform state based on actions - similar to Array.reduce().


Bản Chất & Mechanism:


Redux architecture có 3 core principles:


1. **Single Source of Truth**: Application state stored trong single store
2. **State is Read-Only**: State chỉ có thể change thông qua dispatching actions
3. **Changes Made with Pure Functions**: Reducers are pure functions specifying how state changes


```javascript
// Redux data flow
Action → Reducer → New State → Component Re-render
```


Memory Model Analysis:


```javascript
// Simplified Redux store implementation
function createStore(reducer, initialState) {
    let currentState = initialState;
    let listeners = [];

    const getState = () => currentState;

    const dispatch = (action) => {
        currentState = reducer(currentState, action);
        listeners.forEach(listener => listener());
        return action;
    };

    const subscribe = (listener) => {
        listeners.push(listener);
        return () => {
            listeners = listeners.filter(l => l !== listener);
        };
    };

    return { getState, dispatch, subscribe };
}
```


Step-by-step Execution Flow:


1. **Action Dispatch**: Component dispatch action object
2. **Reducer Execution**: Store calls reducer function với current state và action
3. **State Update**: Reducer returns new state object
4. **Subscription Notification**: Store notifies all subscribers về state change
5. **Component Re-render**: Subscribed components re-render với new state
6. **DOM Update**: React reconciliation updates DOM


#### 5.2 Redux Toolkit - Modern Redux Development


Nguồn Gốc & Motivation:


Redux Toolkit (RTK) được create để address common complaints về Redux:


1. **Too Much Boilerplate**: Setting up store, actions, reducers require lot of code
2. **Complex Configuration**: Middleware setup, DevTools integration complex
3. **Immutable Update Logic**: Writing immutable updates manually error-prone
4. **Performance**: Hand-written selectors not optimized


RTK provide "batteries-included" approach với best practices built-in.


Implementation Deep Dive - Production Example Từ Binance Trading Platform:


```javascript
// store/tradingSlice.js - RTK slice cho trading functionality
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Async thunk cho API calls
export const fetchMarketData = createAsyncThunk(
    'trading/fetchMarketData',
    async (symbol, { rejectWithValue }) => {
        try {
            const response = await tradingAPI.getMarketData(symbol);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);

export const placeTrade = createAsyncThunk(
    'trading/placeTrade',
    async (tradeParams, { getState, rejectWithValue }) => {
        try {
            const { auth } = getState();
            const response = await tradingAPI.placeTrade(tradeParams, {
                headers: { Authorization: `Bearer ${auth.token}` }
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);

const initialState = {
    // Market data
    marketData: {},
    selectedSymbol: 'BTCUSDT',

    // Order book
    orderBook: {
        bids: [],
        asks: []
    },

    // User trades
    openOrders: [],
    tradeHistory: [],

    // UI state
    loading: {
        marketData: false,
        placingTrade: false
    },

    errors: {
        marketData: null,
        trading: null
    }
};

const tradingSlice = createSlice({
    name: 'trading',
    initialState,
    reducers: {
        // Synchronous actions
        setSelectedSymbol: (state, action) => {
            state.selectedSymbol = action.payload;
        },

        updateOrderBook: (state, action) => {
            const { bids, asks } = action.payload;
            state.orderBook.bids = bids;
            state.orderBook.asks = asks;
        },

        addToTradeHistory: (state, action) => {
            state.tradeHistory.unshift(action.payload);
            // Keep only last 100 trades for performance
            if (state.tradeHistory.length > 100) {
                state.tradeHistory = state.tradeHistory.slice(0, 100);
            }
        },

        clearErrors: (state) => {
            state.errors = {
                marketData: null,
                trading: null
            };
        }
    },

    extraReducers: (builder) => {
        // Handle async thunk states
        builder
            // Fetch market data
            .addCase(fetchMarketData.pending, (state) => {
                state.loading.marketData = true;
                state.errors.marketData = null;
            })
            .addCase(fetchMarketData.fulfilled, (state, action) => {
                state.loading.marketData = false;
                state.marketData[action.payload.symbol] = action.payload;
            })
            .addCase(fetchMarketData.rejected, (state, action) => {
                state.loading.marketData = false;
                state.errors.marketData = action.payload;
            })

            // Place trade
            .addCase(placeTrade.pending, (state) => {
                state.loading.placingTrade = true;
                state.errors.trading = null;
            })
            .addCase(placeTrade.fulfilled, (state, action) => {
                state.loading.placingTrade = false;
                state.openOrders.push(action.payload);
            })
            .addCase(placeTrade.rejected, (state, action) => {
                state.loading.placingTrade = false;
                state.errors.trading = action.payload;
            });
    }
});

export const {
    setSelectedSymbol,
    updateOrderBook,
    addToTradeHistory,
    clearErrors
} = tradingSlice.actions;

export default tradingSlice.reducer;
```


Store Configuration với RTK:


```javascript
// store/index.js
import { configureStore } from '@reduxjs/toolkit';
import tradingReducer from './tradingSlice';
import authReducer from './authSlice';
import uiReducer from './uiSlice';

// Middleware customization
const loggerMiddleware = (store) => (next) => (action) => {
    console.group(action.type);
    console.info('Dispatching:', action);
    console.log('Previous state:', store.getState());

    const result = next(action);

    console.log('New state:', store.getState());
    console.groupEnd();

    return result;
};

export const store = configureStore({
    reducer: {
        trading: tradingReducer,
        auth: authReducer,
        ui: uiReducer
    },

    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            // RTK default middleware options
            serializableCheck: {
                ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
                ignoredPaths: ['auth.loginTime']
            },
            immutableCheck: {
                ignoredPaths: ['auth.loginTime']
            }
        }).concat(loggerMiddleware),

    devTools: process.env.NODE_ENV !== 'production' && {
        name: 'Binance Trading App',
        trace: true,
        traceLimit: 25
    }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```


Component Integration với RTK:


```javascript
// components/TradingInterface.tsx
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
    fetchMarketData,
    placeTrade,
    setSelectedSymbol,
    clearErrors
} from '../store/tradingSlice';

function TradingInterface() {
    const dispatch = useDispatch();

    // Typed selectors với RTK
    const {
        selectedSymbol,
        marketData,
        orderBook,
        openOrders,
        loading,
        errors
    } = useSelector((state: RootState) => state.trading);

    // Fetch market data khi component mount hoặc symbol change
    useEffect(() => {
        dispatch(fetchMarketData(selectedSymbol));
    }, [dispatch, selectedSymbol]);

    // WebSocket connection cho real-time order book updates
    useEffect(() => {
        const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${selectedSymbol.toLowerCase()}@depth`);

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            dispatch(updateOrderBook({
                bids: data.b,
                asks: data.a
            }));
        };

        return () => ws.close();
    }, [dispatch, selectedSymbol]);

    const handleSymbolChange = (newSymbol: string) => {
        dispatch(clearErrors());
        dispatch(setSelectedSymbol(newSymbol));
    };

    const handlePlaceTrade = async (tradeParams: TradeParams) => {
        try {
            await dispatch(placeTrade(tradeParams)).unwrap();
            // Handle successful trade
            toast.success('Trade placed successfully!');
        } catch (error) {
            // Handle trade error
            toast.error(`Failed to place trade: ${error.message}`);
        }
    };

    if (loading.marketData) {
        return <LoadingSpinner />;
    }

    return (
        <div className="trading-interface">
            <SymbolSelector
                selected={selectedSymbol}
                onChange={handleSymbolChange}
            />

            <MarketDataPanel
                data={marketData[selectedSymbol]}
                loading={loading.marketData}
                error={errors.marketData}
            />

            <OrderBook
                bids={orderBook.bids}
                asks={orderBook.asks}
            />

            <TradingForm
                onSubmit={handlePlaceTrade}
                loading={loading.placingTrade}
                error={errors.trading}
            />

            <OpenOrders orders={openOrders} />
        </div>
    );
}
```


#### 5.3 Advanced Redux Patterns


Normalization Pattern cho Complex Data:


```javascript
// Entity normalization với RTK createEntityAdapter
import { createEntityAdapter, createSlice } from '@reduxjs/toolkit';

const ordersAdapter = createEntityAdapter({
    selectId: (order) => order.id,
    sortComparer: (a, b) => b.timestamp - a.timestamp
});

const ordersSlice = createSlice({
    name: 'orders',
    initialState: ordersAdapter.getInitialState({
        loading: false,
        error: null
    }),
    reducers: {
        orderAdded: ordersAdapter.addOne,
        orderUpdated: ordersAdapter.updateOne,
        orderRemoved: ordersAdapter.removeOne,
        ordersReceived: ordersAdapter.setAll
    }
});

// Generated selectors
export const {
    selectAll: selectAllOrders,
    selectById: selectOrderById,
    selectIds: selectOrderIds
} = ordersAdapter.getSelectors((state) => state.orders);
```


RTK Query cho API State Management:


```javascript
// api/tradingApi.ts - RTK Query API slice
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const tradingApi = createApi({
    reducerPath: 'tradingApi',
    baseQuery: fetchBaseQuery({
        baseUrl: '/api/trading/',
        prepareHeaders: (headers, { getState }) => {
            const token = (getState() as RootState).auth.token;
            if (token) {
                headers.set('authorization', `Bearer ${token}`);
            }
            return headers;
        }
    }),

    tagTypes: ['Order', 'MarketData', 'Portfolio'],

    endpoints: (builder) => ({
        // Queries
        getMarketData: builder.query<MarketData, string>({
            query: (symbol) => `market-data/${symbol}`,
            providesTags: (result, error, symbol) => [
                { type: 'MarketData', id: symbol }
            ]
        }),

        getOrders: builder.query<Order[], void>({
            query: () => 'orders',
            providesTags: (result) =>
                result
                    ? [
                        ...result.map(({ id }) => ({ type: 'Order' as const, id })),
                        { type: 'Order', id: 'LIST' }
                    ]
                    : [{ type: 'Order', id: 'LIST' }]
        }),

        // Mutations
        placeTrade: builder.mutation<Order, TradeParams>({
            query: (tradeParams) => ({
                url: 'orders',
                method: 'POST',
                body: tradeParams
            }),
            invalidatesTags: [
                { type: 'Order', id: 'LIST' },
                { type: 'Portfolio', id: 'LIST' }
            ]
        }),

        cancelOrder: builder.mutation<void, string>({
            query: (orderId) => ({
                url: `orders/${orderId}`,
                method: 'DELETE'
            }),
            invalidatesTags: (result, error, orderId) => [
                { type: 'Order', id: orderId },
                { type: 'Order', id: 'LIST' }
            ]
        })
    })
});

export const {
    useGetMarketDataQuery,
    useGetOrdersQuery,
    usePlaceTradeMutation,
    useCancelOrderMutation
} = tradingApi;
```


Component Usage với RTK Query:


```javascript
function TradingDashboard() {
    const {
        data: orders,
        error: ordersError,
        isLoading: ordersLoading,
        refetch: refetchOrders
    } = useGetOrdersQuery();

    const {
        data: marketData,
        error: marketError,
        isLoading: marketLoading
    } = useGetMarketDataQuery('BTCUSDT', {
        pollingInterval: 1000, // Polling every second
        refetchOnFocus: true
    });

    const [placeTrade, {
        isLoading: isPlacingTrade,
        error: placeTradeError
    }] = usePlaceTradeMutation();

    const handlePlaceTrade = async (tradeParams: TradeParams) => {
        try {
            const result = await placeTrade(tradeParams).unwrap();
            toast.success(`Order placed: ${result.id}`);
        } catch (error) {
            toast.error(`Failed to place order: ${error.message}`);
        }
    };

    return (
        <div>
            <MarketData data={marketData} loading={marketLoading} />
            <OrderList
                orders={orders}
                loading={ordersLoading}
                onRefresh={refetchOrders}
            />
            <TradingForm
                onSubmit={handlePlaceTrade}
                loading={isPlacingTrade}
            />
        </div>
    );
}
```


Principal's Perspective - Redux Architecture Decisions:


Qua experience tại multiple large-scale applications, tôi develop following decision framework cho state management:


**1. Redux vs Context API Decision Matrix:**


```
ScenarioReduxContext APIReasoningGlobal app state✅❌Redux DevTools, middlewareTheme/locale❌✅Simple, rarely changesAuthentication✅✅Depends on complexityForm state❌❌Local state or form librariesAPI caching✅ (RTK Query)❌Sophisticated caching needs
```


**2. State Normalization Guidelines:**


```javascript
// Good: Normalized state structure
{
    entities: {
        users: {
            byId: {
                1: { id: 1, name: 'John', postIds: [1, 2] },
                2: { id: 2, name: 'Jane', postIds: [3] }
            },
            allIds: [1, 2]
        },
        posts: {
            byId: {
                1: { id: 1, title: 'Post 1', authorId: 1 },
                2: { id: 2, title: 'Post 2', authorId: 1 },
                3: { id: 3, title: 'Post 3', authorId: 2 }
            },
            allIds: [1, 2, 3]
        }
    },
    ui: {
        currentUserId: 1,
        loading: false
    }
}

// Bad: Nested, denormalized state
{
    users: [
        {
            id: 1,
            name: 'John',
            posts: [
                { id: 1, title: 'Post 1', author: { id: 1, name: 'John' } },
                { id: 2, title: 'Post 2', author: { id: 1, name: 'John' } }
            ]
        }
    ]
}
```


**3. Performance Optimization Strategies:**


```javascript
// Memoized selectors với Reselect
import { createSelector } from '@reduxjs/toolkit';

const selectOrders = (state) => state.orders.byId;
const selectOrderIds = (state) => state.orders.allIds;
const selectSymbolFilter = (state) => state.ui.symbolFilter;

export const selectFilteredOrders = createSelector(
    [selectOrders, selectOrderIds, selectSymbolFilter],
    (orders, orderIds, symbolFilter) => {
        return orderIds
            .map(id => orders[id])
            .filter(order =>
                !symbolFilter || order.symbol === symbolFilter
            );
    }
);

// Component usage
function OrderList() {
    const filteredOrders = useSelector(selectFilteredOrders);
    // Component chỉ re-render khi filtered orders thực sự change
}
```


## Phần III: Principal Level - Enterprise Patterns và Architecture


### Chương 6: State Management Architecture Design


#### 6.1 Designing State Architecture cho Large-Scale Applications


Principal's Perspective - Lessons từ Figma's Collaborative Editor:


Tại Figma, chúng tôi face unique challenges trong state management cho collaborative design tool với millions of design elements và real-time collaboration. Những lessons tôi learn có thể apply cho bất kỳ large-scale application nào.


**Challenge 1: Scale - Millions of Design Objects**


Initial approach sử dụng single Redux store cho entire design document:


```javascript
// Problematic approach - Monolithic state
const designState = {
    document: {
        id: 'doc-123',
        elements: {
            // Millions of design elements
            'element-1': { type: 'rectangle', x: 10, y: 20, ... },
            'element-2': { type: 'text', content: 'Hello', ... },
            // ... millions more
        },
        layers: [...],
        artboards: [...],
        styles: [...]
    },
    ui: {
        selectedElements: [...],
        viewport: { zoom: 1, pan: { x: 0, y: 0 } },
        tools: { active: 'select' }
    },
    collaboration: {
        cursors: {...},
        presence: {...}
    }
};
```


Problems encountered:


1. **Memory Issues**: Storing millions of objects trong Redux store caused memory leaks
2. **Performance**: Every small change triggered reconciliation của entire tree
3. **Serialization**: Redux DevTools couldn't handle large state objects
4. **Network**: Syncing entire state across clients impossible


**Solution: Hierarchical State Architecture**


```javascript
// Redesigned architecture - Multi-layer state management
class FigmaStateManager {
    constructor() {
        // Level 1: Document Store (Core data)
        this.documentStore = new DocumentStore(); // Custom implementation

        // Level 2: UI Store (Redux for UI state)
        this.uiStore = configureStore({
            reducer: {
                selection: selectionReducer,
                viewport: viewportReducer,
                tools: toolsReducer
            }
        });

        // Level 3: Collaboration Store (Real-time sync)
        this.collaborationStore = new CollaborationStore(); // WebRTC/WebSocket

        // Level 4: Cache Store (LRU cache cho rendered elements)
        this.cacheStore = new LRUCache(10000);
    }

    // Unified API cho state access
    getState() {
        return {
            document: this.documentStore.getVisibleElements(),
            ui: this.uiStore.getState(),
            collaboration: this.collaborationStore.getState()
        };
    }
}
```


**Document Store Implementation:**


```javascript
// Custom store cho design elements - optimized for large datasets
class DocumentStore {
    constructor() {
        this.elements = new Map(); // Faster than plain objects
        this.spatialIndex = new RTree(); // Spatial indexing cho performance
        this.observers = new Set();
        this.changeBuffer = [];
    }

    // Optimized element retrieval
    getElementsInViewport(viewport) {
        const bounds = {
            minX: viewport.x,
            minY: viewport.y,
            maxX: viewport.x + viewport.width,
            maxY: viewport.y + viewport.height
        };

        // Spatial query instead of iterating all elements
        return this.spatialIndex.search(bounds);
    }

    // Batch updates để avoid excessive re-renders
    updateElement(elementId, changes) {
        this.changeBuffer.push({ elementId, changes });

        // Debounced batch processing
        if (!this.updateScheduled) {
            this.updateScheduled = true;
            requestIdleCallback(() => this.flushChanges());
        }
    }

    flushChanges() {
        const batch = [...this.changeBuffer];
        this.changeBuffer = [];
        this.updateScheduled = false;

        // Apply all changes atomically
        batch.forEach(({ elementId, changes }) => {
            const element = this.elements.get(elementId);
            Object.assign(element, changes);

            // Update spatial index
            this.spatialIndex.remove(element);
            this.spatialIndex.insert(element);
        });

        // Notify observers với batched changes
        this.notifyObservers(batch);
    }
}
```


**Integration Layer:**


```javascript
// Higher-order component để connect React với custom stores
function withFigmaState(Component) {
    return function ConnectedComponent(props) {
        const [documentState, setDocumentState] = useState({});
        const uiState = useSelector(state => state);

        useEffect(() => {
            const unsubscribe = figmaStateManager.documentStore.subscribe(
                (changes) => {
                    // Chỉ update component nếu relevant data changed
                    const relevantChanges = changes.filter(change =>
                        props.elementIds?.includes(change.elementId)
                    );

                    if (relevantChanges.length > 0) {
                        setDocumentState(prev => ({
                            ...prev,
                            ...relevantChanges.reduce((acc, change) => {
                                acc[change.elementId] = change.element;
                                return acc;
                            }, {})
                        }));
                    }
                }
            );

            return unsubscribe;
        }, [props.elementIds]);

        return (
            <Component
                {...props}
                documentState={documentState}
                uiState={uiState}
            />
        );
    };
}
```


#### 6.2 Performance Optimization Patterns


**Memory Management Strategy:**


```javascript
// Element lifecycle management
class ElementManager {
    constructor() {
        this.activeElements = new WeakMap(); // Auto GC when elements removed
        this.renderCache = new LRUCache(1000);
        this.geometryCache = new Map();
    }

    createElement(type, props) {
        const element = {
            id: generateId(),
            type,
            ...props,

            // Lazy geometry calculation
            get bounds() {
                if (!this.geometryCache.has(this.id)) {
                    this.geometryCache.set(this.id, calculateBounds(this));
                }
                return this.geometryCache.get(this.id);
            },

            // Invalidate cache when properties change
            set(property, value) {
                this[property] = value;
                this.geometryCache.delete(this.id);
                this.renderCache.delete(this.id);
            }
        };

        this.activeElements.set(element, {
            created: Date.now(),
            lastAccessed: Date.now()
        });

        return element;
    }

    // Cleanup unused elements
    cleanup() {
        const now = Date.now();
        const threshold = 5 * 60 * 1000; // 5 minutes

        for (const [element, metadata] of this.activeElements) {
            if (now - metadata.lastAccessed > threshold) {
                this.geometryCache.delete(element.id);
                this.renderCache.delete(element.id);
                this.activeElements.delete(element);
            }
        }
    }
}
```


**Render Optimization:**


```javascript
// Virtual scrolling cho large lists
function VirtualizedElementList({ elements, viewportHeight, itemHeight }) {
    const [scrollTop, setScrollTop] = useState(0);

    const visibleRange = useMemo(() => {
        const start = Math.floor(scrollTop / itemHeight);
        const end = Math.min(
            start + Math.ceil(viewportHeight / itemHeight) + 1,
            elements.length
        );
        return { start, end };
    }, [scrollTop, viewportHeight, itemHeight, elements.length]);

    const visibleElements = useMemo(() =>
        elements.slice(visibleRange.start, visibleRange.end),
        [elements, visibleRange]
    );

    return (
        <div
            style={{ height: viewportHeight, overflow: 'auto' }}
            onScroll={(e) => setScrollTop(e.target.scrollTop)}
        >
            <div style={{ height: elements.length * itemHeight, position: 'relative' }}>
                {visibleElements.map((element, index) => (
                    <ElementItem
                        key={element.id}
                        element={element}
                        style={{
                            position: 'absolute',
                            top: (visibleRange.start + index) * itemHeight,
                            height: itemHeight
                        }}
                    />
                ))}
            </div>
        </div>
    );
}
```


#### 6.3 Real-time Collaboration State Management


**Operational Transform Pattern:**


```javascript
// Collaborative editing với operational transforms
class CollaborativeStateManager {
    constructor() {
        this.localState = new Map();
        this.remoteOperations = [];
        this.localOperations = [];
        this.lastSyncedRevision = 0;
    }

    // Apply local operation
    applyLocalOperation(operation) {
        // Apply immediately to local state
        this.applyOperation(operation);

        // Queue for remote sync
        this.localOperations.push({
            ...operation,
            revision: this.lastSyncedRevision + this.localOperations.length,
            clientId: this.clientId
        });

        // Send to server
        this.sendToServer(operation);
    }

    // Receive remote operation
    receiveRemoteOperation(operation) {
        // Transform against pending local operations
        const transformedOp = this.transformOperation(
            operation,
            this.localOperations
        );

        // Apply transformed operation
        this.applyOperation(transformedOp);

        // Update revision tracking
        this.lastSyncedRevision = operation.revision;
    }

    // Operational transform algorithm
    transformOperation(operation, conflictingOps) {
        let transformed = { ...operation };

        for (const conflictOp of conflictingOps) {
            transformed = this.transform(transformed, conflictOp);
        }

        return transformed;
    }

    // Transform two operations against each other
    transform(op1, op2) {
        // Example: text editing operations
        if (op1.type === 'insert' && op2.type === 'insert') {
            if (op1.position <= op2.position) {
                return {
                    ...op2,
                    position: op2.position + op1.text.length
                };
            }
        }

        if (op1.type === 'delete' && op2.type === 'insert') {
            if (op1.position < op2.position) {
                return {
                    ...op2,
                    position: op2.position - op1.length
                };
            }
        }

        // More transformation rules...
        return op2;
    }
}
```


**Conflict Resolution Strategy:**


```javascript
// Strategy pattern cho conflict resolution
class ConflictResolver {
    constructor() {
        this.strategies = new Map([
            ['lastWriterWins', this.lastWriterWins],
            ['mergeable', this.mergeableStrategy],
            ['userChoice', this.userChoiceStrategy]
        ]);
    }

    resolve(conflict, strategy = 'lastWriterWins') {
        const resolver = this.strategies.get(strategy);
        return resolver ? resolver(conflict) : this.lastWriterWins(conflict);
    }

    lastWriterWins(conflict) {
        const latest = conflict.operations.reduce((latest, op) =>
            op.timestamp > latest.timestamp ? op : latest
        );
        return latest;
    }

    mergeableStrategy(conflict) {
        // For operations that can be merged (e.g., style changes)
        if (conflict.operations.every(op => op.type === 'styleUpdate')) {
            return {
                type: 'styleUpdate',
                elementId: conflict.elementId,
                styles: conflict.operations.reduce((merged, op) => ({
                    ...merged,
                    ...op.styles
                }), {})
            };
        }

        return this.lastWriterWins(conflict);
    }

    userChoiceStrategy(conflict) {
        // Present conflict to user for manual resolution
        return new Promise((resolve) => {
            this.showConflictModal(conflict, resolve);
        });
    }
}
```


### Chương 7: Testing State Management


#### 7.1 Testing Strategies cho Complex State


**Unit Testing Reducers:**


```javascript
// Pure function testing - easiest to test
describe('cartReducer', () => {
    const initialState = {
        items: [],
        total: 0,
        discounts: []
    };

    it('should add item to empty cart', () => {
        const action = {
            type: 'ADD_ITEM',
            payload: {
                product: { id: 1, name: 'Product 1', price: 100 }
            }
        };

        const newState = cartReducer(initialState, action);

        expect(newState.items).toHaveLength(1);
        expect(newState.items[0]).toEqual({
            id: 1,
            name: 'Product 1',
            price: 100,
            quantity: 1
        });
        expect(newState.total).toBe(100);
    });

    it('should increment quantity for existing item', () => {
        const stateWithItem = {
            items: [{ id: 1, name: 'Product 1', price: 100, quantity: 1 }],
            total: 100,
            discounts: []
        };

        const action = {
            type: 'ADD_ITEM',
            payload: {
                product: { id: 1, name: 'Product 1', price: 100 }
            }
        };

        const newState = cartReducer(stateWithItem, action);

        expect(newState.items).toHaveLength(1);
        expect(newState.items[0].quantity).toBe(2);
        expect(newState.total).toBe(200);
    });

    // Edge cases
    it('should handle invalid actions gracefully', () => {
        const invalidAction = { type: 'INVALID_ACTION' };
        const newState = cartReducer(initialState, invalidAction);

        expect(newState).toBe(initialState); // Should return same reference
    });
});
```


**Integration Testing với React Components:**


```javascript
// Testing component integration với Redux
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import ShoppingCart from './ShoppingCart';
import cartReducer from './cartSlice';

function renderWithStore(component, { initialState = {} } = {}) {
    const store = configureStore({
        reducer: { cart: cartReducer },
        preloadedState: { cart: initialState }
    });

    return {
        ...render(
            <Provider store={store}>
                {component}
            </Provider>
        ),
        store
    };
}

describe('ShoppingCart Integration', () => {
    it('should update UI when item added to cart', async () => {
        const { store } = renderWithStore(<ShoppingCart />);

        // Initial state
        expect(screen.getByText('Cart (0 items)')).toBeInTheDocument();

        // Add item
        const addButton = screen.getByTestId('add-item-1');
        fireEvent.click(addButton);

        // Verify UI updated
        expect(screen.getByText('Cart (1 items)')).toBeInTheDocument();
        expect(screen.getByText('Product 1')).toBeInTheDocument();

        // Verify store state
        const state = store.getState();
        expect(state.cart.items).toHaveLength(1);
    });

    it('should handle async operations correctly', async () => {
        const { store } = renderWithStore(<ShoppingCart />);

        // Mock API call
        jest.spyOn(api, 'addToCart').mockResolvedValue({
            id: 1,
            name: 'Product 1',
            price: 100
        });

        const addButton = screen.getByTestId('add-item-1');
        fireEvent.click(addButton);

        // Should show loading state
        expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

        // Wait for async operation
        await screen.findByText('Product 1');

        // Loading should be gone
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });
});
```


**Testing Custom Hooks:**


```javascript
// Testing state management hooks
import { renderHook, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useCart } from './useCart';
import cartReducer from './cartSlice';

function createWrapper(initialState = {}) {
    const store = configureStore({
        reducer: { cart: cartReducer },
        preloadedState: { cart: initialState }
    });

    return ({ children }) => (
        <Provider store={store}>{children}</Provider>
    );
}

describe('useCart hook', () => {
    it('should provide cart functionality', () => {
        const wrapper = createWrapper();
        const { result } = renderHook(() => useCart(), { wrapper });

        expect(result.current.items).toEqual([]);
        expect(result.current.total).toBe(0);
        expect(typeof result.current.addItem).toBe('function');
    });

    it('should add item to cart', () => {
        const wrapper = createWrapper();
        const { result } = renderHook(() => useCart(), { wrapper });

        act(() => {
            result.current.addItem({
                id: 1,
                name: 'Product 1',
                price: 100
            });
        });

        expect(result.current.items).toHaveLength(1);
        expect(result.current.total).toBe(100);
    });
});
```


**Property-Based Testing cho State Transitions:**


```javascript
// Property-based testing với fast-check
import fc from 'fast-check';
import { cartReducer } from './cartSlice';

describe('Cart Reducer Properties', () => {
    it('should maintain total consistency', () => {
        fc.assert(fc.property(
            fc.array(fc.record({
                type: fc.constantFrom('ADD_ITEM', 'REMOVE_ITEM', 'UPDATE_QUANTITY'),
                payload: fc.record({
                    product: fc.record({
                        id: fc.integer(1, 1000),
                        price: fc.integer(1, 10000),
                        name: fc.string()
                    }),
                    quantity: fc.optional(fc.integer(1, 10))
                })
            })),
            (actions) => {
                let state = { items: [], total: 0, discounts: [] };

                for (const action of actions) {
                    state = cartReducer(state, action);
                }

                // Property: total should equal sum of item prices * quantities
                const expectedTotal = state.items.reduce(
                    (sum, item) => sum + (item.price * item.quantity),
                    0
                );

                expect(state.total).toBe(expectedTotal);
            }
        ));
    });

    it('should never have negative quantities', () => {
        fc.assert(fc.property(
            fc.array(fc.record({
                type: fc.constantFrom('ADD_ITEM', 'REMOVE_ITEM', 'UPDATE_QUANTITY'),
                payload: fc.anything()
            })),
            (actions) => {
                let state = { items: [], total: 0, discounts: [] };

                for (const action of actions) {
                    state = cartReducer(state, action);
                }

                // Property: no item should have negative quantity
                expect(state.items.every(item => item.quantity >= 0)).toBe(true);
            }
        ));
    });
});
```


#### 7.2 Performance Testing


**Redux Performance Monitoring:**


```javascript
// Custom middleware để monitor performance
const performanceMiddleware = (store) => (next) => (action) => {
    const start = performance.now();
    const stateBefore = store.getState();

    const result = next(action);

    const end = performance.now();
    const stateAfter = store.getState();

    // Log performance metrics
    console.log({
        action: action.type,
        duration: end - start,
        stateSize: JSON.stringify(stateAfter).length,
        stateChanged: stateBefore !== stateAfter
    });

    // Alert on slow actions
    if (end - start > 16) { // 60fps threshold
        console.warn(`Slow action detected: ${action.type} took ${end - start}ms`);
    }

    return result;
};
```


**Memory Leak Detection:**


```javascript
// Memory leak testing
describe('Memory Leaks', () => {
    let store;

    beforeEach(() => {
        store = configureStore({
            reducer: { cart: cartReducer }
        });
    });

    it('should not leak memory with many operations', () => {
        const initialMemory = process.memoryUsage().heapUsed;

        // Perform many operations
        for (let i = 0; i < 10000; i++) {
            store.dispatch(addItem({
                id: i,
                name: `Product ${i}`,
                price: Math.random() * 1000
            }));

            if (i % 100 === 0) {
                store.dispatch(clearCart());
            }
        }

        // Force garbage collection
        if (global.gc) {
            global.gc();
        }

        const finalMemory = process.memoryUsage().heapUsed;
        const memoryIncrease = finalMemory - initialMemory;

        // Memory increase should be reasonable
        expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // 50MB
    });
});
```


### Chương 8: Migration Strategies và Best Practices


#### 8.1 Migration từ Legacy State Management


**Từ Class Components Sang Hooks:**


```javascript
// Legacy class component với state
class LegacyCounter extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            count: 0,
            loading: false,
            error: null
        };
    }

    componentDidMount() {
        this.fetchInitialData();
    }

    fetchInitialData = async () => {
        this.setState({ loading: true });
        try {
            const data = await api.getCount();
            this.setState({ count: data.count, loading: false });
        } catch (error) {
            this.setState({ error: error.message, loading: false });
        }
    }

    increment = () => {
        this.setState(prevState => ({
            count: prevState.count + 1
        }));
    }

    render() {
        const { count, loading, error } = this.state;

        if (loading) return <div>Loading...</div>;
        if (error) return <div>Error: {error}</div>;

        return (
            <div>
                <p>Count: {count}</p>
                <button onClick={this.increment}>Increment</button>
            </div>
        );
    }
}
```


Migration strategy - Step by step:


```javascript
// Step 1: Convert to functional component với useState
function Counter() {
    const [count, setCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const data = await api.getCount();
            setCount(data.count);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const increment = () => {
        setCount(prev => prev + 1);
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div>
            <p>Count: {count}</p>
            <button onClick={increment}>Increment</button>
        </div>
    );
}

// Step 2: Extract logic into custom hook
function useCounter() {
    const [state, setState] = useState({
        count: 0,
        loading: false,
        error: null
    });

    const fetchInitialData = useCallback(async () => {
        setState(prev => ({ ...prev, loading: true }));
        try {
            const data = await api.getCount();
            setState(prev => ({ ...prev, count: data.count, loading: false }));
        } catch (error) {
            setState(prev => ({ ...prev, error: error.message, loading: false }));
        }
    }, []);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    const increment = useCallback(() => {
        setState(prev => ({ ...prev, count: prev.count + 1 }));
    }, []);

    return {
        ...state,
        increment,
        refetch: fetchInitialData
    };
}

// Step 3: Use custom hook in component
function Counter() {
    const { count, loading, error, increment } = useCounter();

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div>
            <p>Count: {count}</p>
            <button onClick={increment}>Increment</button>
        </div>
    );
}

// Step 4: Migrate to useReducer for complex state
function counterReducer(state, action) {
    switch (action.type) {
        case 'FETCH_START':
            return { ...state, loading: true, error: null };
        case 'FETCH_SUCCESS':
            return { ...state, loading: false, count: action.payload };
        case 'FETCH_ERROR':
            return { ...state, loading: false, error: action.payload };
        case 'INCREMENT':
            return { ...state, count: state.count + 1 };
        default:
            return state;
    }
}

function useCounterWithReducer() {
    const [state, dispatch] = useReducer(counterReducer, {
        count: 0,
        loading: false,
        error: null
    });

    const fetchInitialData = useCallback(async () => {
        dispatch({ type: 'FETCH_START' });
        try {
            const data = await api.getCount();
            dispatch({ type: 'FETCH_SUCCESS', payload: data.count });
        } catch (error) {
            dispatch({ type: 'FETCH_ERROR', payload: error.message });
        }
    }, []);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    const increment = useCallback(() => {
        dispatch({ type: 'INCREMENT' });
    }, []);

    return {
        ...state,
        increment,
        refetch: fetchInitialData
    };
}
```


**Migration từ Redux Classic sang Redux Toolkit:**


```javascript
// Legacy Redux setup
// actions/cartActions.js
export const ADD_ITEM = 'ADD_ITEM';
export const REMOVE_ITEM = 'REMOVE_ITEM';
export const CLEAR_CART = 'CLEAR_CART';

export const addItem = (item) => ({
    type: ADD_ITEM,
    payload: item
});

export const removeItem = (itemId) => ({
    type: REMOVE_ITEM,
    payload: itemId
});

// reducers/cartReducer.js
const initialState = {
    items: [],
    total: 0
};

export default function cartReducer(state = initialState, action) {
    switch (action.type) {
        case ADD_ITEM:
            const newItems = [...state.items, action.payload];
            return {
                ...state,
                items: newItems,
                total: calculateTotal(newItems)
            };
        case REMOVE_ITEM:
            const filteredItems = state.items.filter(
                item => item.id !== action.payload
            );
            return {
                ...state,
                items: filteredItems,
                total: calculateTotal(filteredItems)
            };
        default:
            return state;
    }
}

// store/index.js
import { createStore, combineReducers } from 'redux';
import cartReducer from '../reducers/cartReducer';

const rootReducer = combineReducers({
    cart: cartReducer
});

export const store = createStore(rootReducer);
```


Migration to RTK - Progressive approach:


```javascript
// Step 1: Install RTK và keep existing structure
import { configureStore } from '@reduxjs/toolkit';
import cartReducer from '../reducers/cartReducer'; // Keep existing reducer

export const store = configureStore({
    reducer: {
        cart: cartReducer // Use existing reducer
    }
});

// Step 2: Convert actions và reducers to RTK slice
import { createSlice } from '@reduxjs/toolkit';

const cartSlice = createSlice({
    name: 'cart',
    initialState: {
        items: [],
        total: 0
    },
    reducers: {
        addItem: (state, action) => {
            state.items.push(action.payload);
            state.total = calculateTotal(state.items);
        },
        removeItem: (state, action) => {
            state.items = state.items.filter(
                item => item.id !== action.payload
            );
            state.total = calculateTotal(state.items);
        },
        clearCart: (state) => {
            state.items = [];
            state.total = 0;
        }
    }
});

export const { addItem, removeItem, clearCart } = cartSlice.actions;
export default cartSlice.reducer;

// Step 3: Migrate async actions to createAsyncThunk
export const fetchCart = createAsyncThunk(
    'cart/fetchCart',
    async (userId, { rejectWithValue }) => {
        try {
            const response = await api.getCart(userId);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);

// Add async handling to slice
const cartSlice = createSlice({
    name: 'cart',
    initialState: {
        items: [],
        total: 0,
        loading: false,
        error: null
    },
    reducers: {
        // Existing reducers...
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchCart.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchCart.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload.items;
                state.total = action.payload.total;
            })
            .addCase(fetchCart.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    }
});

// Step 4: Update components to use new actions
function CartComponent() {
    const { items, loading, error } = useSelector(state => state.cart);
    const dispatch = useDispatch();

    // Old way
    // dispatch(addItem(item));

    // New way với RTK
    dispatch(cartSlice.actions.addItem(item));

    // Async action
    useEffect(() => {
        dispatch(fetchCart(userId));
    }, [dispatch, userId]);
}
```


#### 8.2 Team Training và Knowledge Transfer


**Onboarding Plan cho State Management:**


```javascript
// Week 1: Fundamentals
const week1Topics = [
    'React state basics - useState, useEffect',
    'Props và component communication',
    'Common state patterns',
    'Debugging techniques'
];

// Week 2: Intermediate patterns
const week2Topics = [
    'useReducer for complex state',
    'Context API for global state',
    'Custom hooks development',
    'Performance optimization basics'
];

// Week 3: Advanced patterns
const week3Topics = [
    'Redux fundamentals',
    'Redux Toolkit usage',
    'Async state management',
    'Testing strategies'
];

// Week 4: Production practices
const week4Topics = [
    'Architecture patterns',
    'Performance monitoring',
    'Debugging complex state',
    'Code review guidelines'
];
```


**Code Review Checklist:**


```javascript
// State Management Code Review Checklist
const reviewChecklist = {
    stateStructure: [
        '✓ State normalized where appropriate?',
        '✓ No duplicate data in state?',
        '✓ State shape flat and simple?',
        '✓ Derived state computed, not stored?'
    ],

    performance: [
        '✓ Unnecessary re-renders avoided?',
        '✓ useCallback/useMemo used appropriately?',
        '✓ State updates batched where possible?',
        '✓ Large lists virtualized if needed?'
    ],

    testing: [
        '✓ State logic testable in isolation?',
        '✓ Edge cases covered?',
        '✓ Async operations tested?',
        '✓ Error states handled?'
    ],

    maintainability: [
        '✓ State updates centralized?',
        '✓ Action types descriptive?',
        '✓ Complex logic extracted to custom hooks?',
        '✓ TypeScript types defined?'
    ]
};
```


**Common Pitfalls và Solutions:**


```javascript
// Pitfall 1: useState for everything
// ❌ Bad
function ComplexForm() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [age, setAge] = useState(0);
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [submitting, setSubmitting] = useState(false);

    // Many state updates scattered throughout component
}

// ✅ Good
function ComplexForm() {
    const [state, dispatch] = useReducer(formReducer, initialFormState);

    // Centralized state updates
}

// Pitfall 2: Prop drilling
// ❌ Bad
function App() {
    const [user, setUser] = useState(null);
    return <Header user={user} setUser={setUser} />;
}

function Header({ user, setUser }) {
    return <Navigation user={user} setUser={setUser} />;
}

// ✅ Good
function App() {
    return (
        <UserProvider>
            <Header />
        </UserProvider>
    );
}

function Header() {
    return <Navigation />;
}

function Navigation() {
    const { user, setUser } = useUser();
    // Use context directly where needed
}

// Pitfall 3: Mutation of state
// ❌ Bad
function TodoList() {
    const [todos, setTodos] = useState([]);

    const addTodo = (text) => {
        todos.push({ id: Date.now(), text }); // Mutation!
        setTodos(todos);
    };
}

// ✅ Good
function TodoList() {
    const [todos, setTodos] = useState([]);

    const addTodo = (text) => {
        setTodos(prev => [...prev, { id: Date.now(), text }]);
    };
}

// Pitfall 4: Missing dependencies trong useEffect
// ❌ Bad
function UserProfile({ userId }) {
    const [user, setUser] = useState(null);

    useEffect(() => {
        fetchUser(userId).then(setUser);
    }, []); // Missing userId dependency!
}

// ✅ Good
function UserProfile({ userId }) {
    const [user, setUser] = useState(null);

    useEffect(() => {
        fetchUser(userId).then(setUser);
    }, [userId]); // Include all dependencies
}
```


## Kết Luận: State Management Journey


### Reflection từ Principal Engineer Perspective


Sau 15 năm experience trong industry và work với những applications phức tạp nhất tại các công ty như NAB, Axon, Binance, Webflow, và Figma, tôi nhận ra rằng state management không chỉ là technical skill - nó là art của modeling reality trong software.


**Key Insights từ Production Experience:**


1. **Start Simple, Scale Gradually**: Mọi application đều bắt đầu với simple useState. Key là recognize khi nào cần upgrade to more sophisticated solutions.
2. **Performance is not just about Speed**: Một state management solution tốt optimize cho developer experience, maintainability, và debugging experience, không chỉ runtime performance.
3. **Testing Strategy is Critical**: State logic phải testable in isolation. Nếu bạn không thể test state logic separately from UI, architecture có vấn đề.
4. **Team Knowledge Scaling**: Best technical solution vô dụng nếu team không understand hoặc maintain được. Sometimes "good enough" solution mà everyone hiểu tốt hơn "perfect" solution chỉ một người hiểu.


### Future of State Management


**Emerging Patterns:**


1. **Server State vs Client State Separation**: Libraries như React Query, SWR đang redefine cách chúng ta think về state. Server state management becoming specialized domain.
2. **Concurrent Features**: React 18's concurrent features (Suspense, Transitions) changing how we handle async state và user interactions.
3. **AI-Assisted State Management**: Tools like GitHub Copilot giúp generate state management boilerplate, allowing developers focus on business logic.


### Final Recommendations


**For Junior Developers:**


- Master useState và useEffect thoroughly trước khi move to advanced patterns
- Practice building small applications với different state management approaches
- Focus on understanding WHY patterns exist, not just HOW to use them


**For Senior Developers:**


- Develop intuition cho choosing right state management solution
- Practice explaining complex concepts to junior team members
- Build expertise trong performance optimization và debugging


**For Principal/Staff Engineers:**


- Focus on architecture decisions và team education
- Develop frameworks để evaluate state management solutions
- Invest time trong understanding emerging patterns và their implications


### Questions để Kiểm Tra Hiểu Biết Sâu


**Foundation Level:**


1. Explain difference giữa controlled và uncontrolled components
2. When should you use useReducer instead của useState?
3. How does Context API solve prop drilling problem?


**Senior Level:**


1. Design a state management solution cho real-time collaborative editor
2. Optimize a Redux application cho performance với millions of entities
3. Implement optimistic updates cho better user experience


**Principal Level:**


1. Architect state management cho micro-frontend system
2. Design migration strategy từ legacy state management to modern solutions
3. Create framework để evaluate state management solutions cho different use cases


State management là journey, không phải destination. Technology sẽ continue evolving, nhưng fundamental principles của managing application state sẽ remain relevant. Key là develop deep understanding của these principles và ability to adapt them to new technologies và patterns.


Từ experience của tôi, những engineers thành công nhất không phải là những người biết every latest library, mà là những người hiểu deeply về trade-offs và có thể make informed decisions based on context của project và team. State management mastery comes from practice, experimentation, và continuous learning từ both successes và failures.


Remember: Good state management enables great user experiences. Bad state management creates technical debt mà team sẽ pay for years to come. Invest time trong understanding deeply, và your applications - và your team - sẽ benefit immensely.
