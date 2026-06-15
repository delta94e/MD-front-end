# Render Optimization — Phát hiện và tối ưu Over-rendering trong React phức tạp

> **Demo file:** [`src/RenderOptimizationDemo.tsx`](../packages/host/src/RenderOptimizationDemo.tsx)
>
> Mở browser console trước khi chạy demo để thấy log `[RENDER] ComponentName #N`

---

## Vấn đề thực tế: "State phức tạp → Không biết component nào render nhiều"

Khi ứng dụng lớn dần, một pattern rất phổ biến là **God Component** — đặt toàn bộ state ở root, rồi truyền props xuống khắp cây. Hệ quả:

```
User gõ 1 ký tự vào search input
  → setFilter() ở root
  → Root re-render
  → TẤT CẢ children re-render:
     FilterPanel, ProductList (20 items × ProductItem), 
     CartSummary, UserProfile, Analytics, Notifications
  → 26+ component renders chỉ vì gõ 1 phím
```

---

## Bước 1: Phát hiện — Công cụ đo lường

### 1.1. Custom `useRenderCount` Hook (nhanh nhất)

```typescript
// Thêm vào bất kỳ component nào cần theo dõi
function useRenderCount(label: string) {
  const count = useRef(0);
  count.current += 1;
  console.log(
    `%c[RENDER] ${label} #${count.current}`,
    'color: #f97316; font-weight: bold'
  );
  return count.current;
}

// Dùng trong component:
function ProductList({ products }) {
  useRenderCount('ProductList'); // ← thêm dòng này
  // ...
}
```

**Khi nào dùng:** Debug nhanh, không cần cài thêm package. Xem console để thấy component nào render nhiều nhất.

### 1.2. React DevTools Profiler (visual, chính xác nhất)

```
1. Mở Chrome DevTools → tab "Components" (cần React DevTools extension)
2. Chuyển sang tab "Profiler"
3. Click ⏺ Record
4. Thực hiện thao tác cần đo (gõ search, click button...)
5. Click ⏹ Stop
6. Xem "Flame Chart" — ô nào màu cam/đỏ = render lâu nhất
7. Click vào từng ô → xem "Why did this render?"
```

**Thông tin Profiler cho bạn biết:**
- Thời gian render từng component (ms)
- Số lần render trong session
- **Lý do render** (props changed / state changed / context changed / parent re-rendered)

### 1.3. `why-did-you-render` Library (tự động detect)

```bash
npm install @welldone-software/why-did-you-render --save-dev
```

```typescript
// src/wdyr.ts — import đầu tiên trong entry point
import React from 'react';

if (process.env.NODE_ENV === 'development') {
  const whyDidYouRender = require('@welldone-software/why-did-you-render');
  whyDidYouRender(React, {
    trackAllPureComponents: true, // Track tất cả React.memo components
    logOnDifferentValues: true,   // Log khi props "bằng nhau về value" nhưng khác reference
  });
}

// Trong component bạn muốn track:
function ProductList({ products, onAddToCart }) { /* ... */ }
ProductList.whyDidYouRender = true; // ← Bật tracking cho component này
```

**Output ở console:**
```
[why-did-you-render]
ProductList re-rendered because of props changes:
  onAddToCart: [same value] function  ← callback không được memoize!
  previous value: ƒ addToCart()
  next value:     ƒ addToCart()      ← khác reference dù logic giống hệt
```

### 1.4. Chrome Performance Tab (cho bottleneck thực sự)

```
1. Chrome DevTools → Performance tab
2. Click Record → thực hiện thao tác → Stop
3. Xem phần "Main" thread
4. Tìm các "Task" màu vàng dài > 50ms (Long Tasks)
5. Click vào task → xem call stack
6. Tìm React reconcile/render trong stack
```

---

## Bước 2: Phân tích Pattern — 5 nguyên nhân phổ biến

### ❌ Pattern 1: God Component — State ở quá cao

```typescript
// ❌ Root component giữ state cho tất cả
function App() {
  const [filter, setFilter] = useState({ search: '', category: 'all' });
  const [cart, setCart] = useState([]);
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState('dark');
  const [notifications, setNotifications] = useState([]);
  const [analytics, setAnalytics] = useState({});

  // Bất kỳ state nào thay đổi → App re-render → TẤT CẢ re-render
  return (
    <>
      <FilterPanel filter={filter} setFilter={setFilter} />
      <ProductList filter={filter} cart={cart} />
      <CartSummary cart={cart} />
      <UserProfile user={user} />     {/* Re-render dù filter đổi! */}
      <Analytics data={analytics} />  {/* Re-render dù cart đổi! */}
    </>
  );
}
```

**Chẩn đoán:** Profiler → click bất kỳ → thấy tất cả components đều "re-rendered because parent re-rendered"

### ❌ Pattern 2: Callback không được memoize → Phá vỡ React.memo

```typescript
// ❌ Function tạo mới mỗi render → memo vô dụng
function ProductList({ products }) {
  // addToCart được tạo mới mỗi lần ProductList render
  const addToCart = (id) => { /* ... */ }; // ← function mới mỗi lần!

  return products.map(p =>
    // ❌ MemoProductItem luôn re-render vì onAdd là function mới
    <MemoProductItem key={p.id} product={p} onAdd={addToCart} />
  );
}

const MemoProductItem = React.memo(ProductItem); // ← memo vô nghĩa
```

**Chẩn đoán:** `why-did-you-render` báo: `"[same value] function"` — props giống nhau nhưng khác reference

### ❌ Pattern 3: Mega Context → Toàn bộ subscribers re-render

```typescript
// ❌ 1 context chứa tất cả
const AppContext = createContext({
  cart: [],
  user: null,
  theme: 'dark',
  filter: {},
  notifications: [],
  // ...
});

// Component chỉ cần user cũng re-render khi cart thay đổi!
function UserProfile() {
  const { user } = useContext(AppContext); // ← subscribe toàn bộ context
  // Re-render mỗi khi cart, theme, filter... thay đổi
}
```

**Chẩn đoán:** Profiler → "Why did this render?" → "context changed" ở component không liên quan

### ❌ Pattern 4: Derived state tính toán lại không cần thiết

```typescript
// ❌ filteredProducts tính lại mỗi render dù products và filter không đổi
function ProductList({ products, filter, cart }) {
  // Tính lại mỗi lần cart thay đổi (dù filter không đổi!)
  const filteredProducts = products
    .filter(p => p.category === filter.category)
    .filter(p => p.price <= filter.maxPrice);

  return filteredProducts.map(p => (
    <ProductItem key={p.id} product={p} inCart={cart.some(c => c.productId === p.id)} />
  ));
}
```

**Chẩn đoán:** React Profiler → thấy render time cao bất thường khi làm việc không liên quan

### ❌ Pattern 5: useEffect dependency quá rộng

```typescript
// ❌ Effect chạy lại khi user thay đổi dù chỉ cần cart
useEffect(() => {
  const revenue = cart.reduce(/* tính revenue */);
  setAnalytics(prev => ({ ...prev, revenue }));
}, [cart, filter, user]); // ← user không liên quan revenue!
//               ^^^^^ thêm user vào dependency vì linter warning
//               nhưng user thay đổi → effect chạy → setAnalytics → re-render
```

---

## Bước 3: Tối ưu — Refactor từng bước

### ✅ Fix 1: State Colocation — Đặt state đúng chỗ

```typescript
// Nguyên tắc: State thuộc về component nào gần nhất cần nó

// ❌ Before: filter ở root App
function App() {
  const [filter, setFilter] = useState({...});
  return <FilterPanel filter={filter} setFilter={setFilter} />;
}

// ✅ After: filter tự quản lý trong FilterPanel
// → Root không re-render khi filter thay đổi
function FilterPanel() {
  const [filter, setFilter] = useState({...}); // ← colocated!
  // Nếu ProductList cần filter → dùng URL params hoặc Zustand slice
  return <input onChange={e => setFilter(f => ({ ...f, search: e.target.value }))} />;
}
```

**Rule of thumb:** Hỏi "Component nào cao nhất cần state này?" → đặt state ở đó, không cao hơn.

### ✅ Fix 2: Split Context theo Domain

```typescript
// ❌ Before: 1 mega context
const AppContext = createContext({ cart, user, theme, filter, notifications });

// ✅ After: Tách riêng theo domain — mỗi consumer chỉ subscribe context của mình
const CartContext = createContext<CartContextType | null>(null);
const UserContext = createContext<UserContextType | null>(null);
const ThemeContext = createContext<ThemeContextType | null>(null);
const NotificationContext = createContext<NotificationContextType | null>(null);

// UserProfile chỉ subscribe UserContext
// → Không re-render khi cart thay đổi
function UserProfile() {
  const { user } = useContext(UserContext)!; // ← chỉ subscribe UserContext
  return <div>{user.name}</div>;
}

// CartSummary chỉ subscribe CartContext
function CartSummary() {
  const { cart } = useContext(CartContext)!; // ← chỉ subscribe CartContext
  return <div>{cart.length} items</div>;
}
```

### ✅ Fix 3: React.memo + useCallback + useMemo

```typescript
// ✅ Memoize callback để không tạo function mới mỗi render
function CartProvider({ children }) {
  const [cart, setCart] = useState([]);

  const addToCart = useCallback((productId: number) => {
    setCart(prev => {
      // functional update không cần cart trong dependency array
      const existing = prev.find(i => i.productId === productId);
      if (existing) return prev.map(i =>
        i.productId === productId ? { ...i, quantity: i.quantity + 1 } : i
      );
      return [...prev, { productId, quantity: 1 }];
    });
  }, []); // ← dependency rỗng: function không bao giờ recreate

  const removeFromCart = useCallback((productId: number) => {
    setCart(prev => prev.filter(i => i.productId !== productId));
  }, []);

  // ✅ Memoize context value để tránh tạo object mới mỗi render
  const value = useMemo(
    () => ({ cart, addToCart, removeFromCart }),
    [cart, addToCart, removeFromCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// ✅ React.memo: ProductItem chỉ re-render khi props thực sự thay đổi
const ProductItem = memo(function ProductItem({ product, inCart, onAdd }) {
  return (
    <div>
      <span>{product.name}</span>
      <button onClick={() => onAdd(product.id)}>
        {inCart ? '✓' : '+ Add'}
      </button>
    </div>
  );
});
// Với memo + useCallback, ProductItem[3] KHÔNG re-render khi bạn add ProductItem[7]

// ✅ useMemo: chỉ tính lại filteredProducts khi thực sự cần
function ProductList() {
  const { products } = useContext(ProductContext)!;
  const [search, setSearch] = useState('');

  const filteredProducts = useMemo(
    () => products.filter(p => p.name.toLowerCase().includes(search.toLowerCase())),
    [products, search] // ← chỉ recalculate khi search hoặc products thay đổi
  );

  return filteredProducts.map(p => <ProductItem key={p.id} product={p} />);
}
```

### ✅ Fix 4: Zustand cho state chia sẻ phức tạp

```typescript
// Dùng Zustand thay vì Context khi:
// - Nhiều components không có quan hệ cha-con đều cần cùng state
// - Context nesting quá sâu (Provider hell)
// - Cần subscribe chỉ một phần của state (selector)

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

interface CartStore {
  items: CartItem[];
  addItem: (productId: number) => void;
  removeItem: (productId: number) => void;
  total: number; // derived state
}

const useCartStore = create<CartStore>()(
  subscribeWithSelector((set, get) => ({
    items: [],
    total: 0,

    addItem: (productId) => set(state => {
      const existing = state.items.find(i => i.productId === productId);
      const newItems = existing
        ? state.items.map(i => i.productId === productId ? { ...i, quantity: i.quantity + 1 } : i)
        : [...state.items, { productId, quantity: 1 }];
      return { items: newItems };
    }),

    removeItem: (productId) => set(state => ({
      items: state.items.filter(i => i.productId !== productId)
    })),
  }))
);

// ✅ Selector: component chỉ re-render khi phần nó cần thay đổi
function CartCount() {
  // Chỉ re-render khi items.length thay đổi — không re-render khi item[0].quantity thay đổi
  const count = useCartStore(state => state.items.length);
  return <span>{count} items</span>;
}

function CartTotal() {
  // Chỉ re-render khi items thay đổi (để tính lại total)
  const items = useCartStore(state => state.items);
  const total = items.reduce(/* ... */, 0);
  return <span>${total}</span>;
}
```

### ✅ Fix 5: useEffect dependency tối giản

```typescript
// ❌ Before: dependency quá rộng
useEffect(() => {
  const revenue = cart.reduce(/* ... */);
  setAnalytics(prev => ({ ...prev, revenue }));
}, [cart, filter, user]); // user, filter không liên quan revenue!

// ✅ After: chỉ dependency thực sự cần
useEffect(() => {
  const revenue = cart.reduce(/* ... */);
  setAnalytics(prev => ({ ...prev, revenue }));
}, [cart]); // chỉ recalculate khi cart thay đổi

// ✅ Hoặc tốt hơn: dùng useMemo thay vì useEffect + setState
// useMemo tính toán synchronously, không trigger extra render cycle
const revenue = useMemo(
  () => cart.reduce(/* ... */, 0),
  [cart]
);
```

---

## Bước 4: Kiểm chứng kết quả

### So sánh Before vs After (mở Console khi chạy demo)

| Thao tác | ❌ Before: Số renders | ✅ After: Số renders |
|---|---|---|
| Gõ 1 ký tự vào search | 26+ (toàn bộ tree) | 2 (FilterPanel + ProductList) |
| Toggle theme | 26+ | 1 (Root only) |
| Add to cart | 26+ | 4 (CartSummary + Notifications + ProductItem thay đổi + GoodAnalytics) |
| Update username | 26+ | 1 (GoodUserProfile nếu data thực sự thay đổi) |

### Checklist trước khi ship

```
□ React DevTools Profiler: không có component nào render > 16ms (60fps threshold)
□ why-did-you-render: không còn "[same value]" warnings
□ Profiler "Why did this render?": không còn "parent re-rendered" ở leaf components
□ Chrome Performance: không có Long Tasks > 50ms do React reconciliation
□ useRenderCount logs: số render per interaction hợp lý (< 5 cho hầu hết thao tác)
```

---

## Quy trình tổng kết: Phát hiện → Phân tích → Fix

```
1. PHÁT HIỆN
   ↓ Thêm useRenderCount vào các components nghi vấn
   ↓ Xem console: component nào render nhiều nhất?
   ↓ React Profiler: component nào render lâu nhất?

2. PHÂN TÍCH NGUYÊN NHÂN
   ↓ "parent re-rendered" → state ở quá cao → Fix 1: Colocation
   ↓ "context changed" → mega context → Fix 2: Split Context
   ↓ "[same value] function" → callback không memo → Fix 3: useCallback
   ↓ Expensive computation mỗi render → Fix 3: useMemo
   ↓ Nhiều components không quan hệ cần cùng state → Fix 4: Zustand

3. FIX (theo thứ tự ưu tiên)
   ↓ State Colocation (không cần refactor lớn, impact cao)
   ↓ React.memo + useCallback (dễ thêm, giảm ngay renders)
   ↓ Split Context (refactor vừa, loại bỏ cascading re-renders)
   ↓ useMemo cho expensive computation
   ↓ Zustand nếu Context không đủ

4. KIỂM CHỨNG
   ↓ So sánh render count Before vs After
   ↓ Chạy React Profiler lại
   ↓ Đo LCP / INP trước và sau bằng WebPageTest
```

---

## Demo: Chạy thử ngay

Xem file [`RenderOptimizationDemo.tsx`](../packages/host/src/RenderOptimizationDemo.tsx) — chứa 2 phiên bản:

- **`<BadDashboard />`** — God Component, 8 states ở root, không memo, mega context giả lập qua props. Mỗi thao tác nhỏ → 26+ renders.
- **`<GoodDashboard />`** — Split Context (Cart/Notification/Product), state colocation, React.memo, useCallback, useMemo. Mỗi thao tác chỉ render đúng components liên quan.

Thêm vào `App.tsx` để chạy:

```tsx
import { BadDashboard, GoodDashboard } from './RenderOptimizationDemo';

// Chạy từng cái một, xem console
export default function App() {
  return (
    <>
      <BadDashboard />
      {/* <GoodDashboard /> */}
    </>
  );
}
```

---

## Tối ưu render mà KHÔNG cần memo / useMemo / useCallback

`memo`, `useMemo`, `useCallback` là "cái búa" — khi nào cũng dùng thì sẽ thêm complexity và đôi khi còn làm chậm hơn (do overhead của so sánh). Có nhiều kỹ thuật tốt hơn nên thử trước.

### Kỹ thuật 1: Children as Props (Component Composition)

Đây là kỹ thuật mạnh nhất và ít người biết nhất. Khi bạn pass `children` vào một component, React **không re-create** `children` JSX khi component cha re-render — vì `children` được tạo ra bởi **component cấp trên** (người gọi), không phải bởi component cha đó.

```tsx
// ❌ Before: SlowContext re-render → Counter cũng re-render
function SlowContextProvider() {
  const [count, setCount] = useState(0);
  const [theme, setTheme] = useState('dark');

  // Mỗi khi count thay đổi → re-render → ExpensiveTree re-render
  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>
      <ExpensiveTree />   {/* ← re-render dù không cần count */}
    </div>
  );
}

// ✅ After: Tách state ra một wrapper, pass children từ bên ngoài
function CounterWrapper({ children }: { children: React.ReactNode }) {
  const [count, setCount] = useState(0);
  // count thay đổi → CounterWrapper re-render → children KHÔNG re-render
  // vì children được tạo ra bởi App (bên ngoài), không phải bởi CounterWrapper
  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>
      {children}
    </div>
  );
}

// Trong App — ExpensiveTree được tạo ở đây, không nằm trong CounterWrapper
function App() {
  return (
    <CounterWrapper>
      <ExpensiveTree />  {/* ← không bao giờ re-render khi count thay đổi */}
    </CounterWrapper>
  );
}
```

**Tại sao hoạt động?** `<ExpensiveTree />` là JSX được tạo ra trong `App`. Khi `CounterWrapper` re-render, React thấy `children` prop không thay đổi reference (vẫn là JSX object được tạo từ `App`) → skip re-render `ExpensiveTree`. **Không cần `memo` nào cả.**

### Kỹ thuật 2: Component as Prop

Tương tự pattern trên nhưng dùng render prop hoặc component prop:

```tsx
// ❌ Before: Header chứa logic → tất cả re-render khi scroll
function Page() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    window.addEventListener('scroll', () => setScrollY(window.scrollY));
  }, []);

  return (
    <div>
      <StickyHeader scrollY={scrollY} />
      <ExpensiveContent />  {/* ← re-render mỗi khi scroll! */}
    </div>
  );
}

// ✅ After: Tách scroll logic ra riêng, ExpensiveContent không bị ảnh hưởng
function ScrollTracker({ render }: { render: (scrollY: number) => React.ReactNode }) {
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    const handler = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);
  return <>{render(scrollY)}</>;
}

function Page() {
  return (
    <div>
      <ScrollTracker render={(scrollY) => <StickyHeader scrollY={scrollY} />} />
      <ExpensiveContent />  {/* ← không bao giờ re-render khi scroll */}
    </div>
  );
}
```

### Kỹ thuật 3: State Colocation (đặt state ở đúng chỗ)

Kỹ thuật đơn giản nhất: **không để state ở cao hơn cần thiết**.

```tsx
// ❌ Before: isOpen ở root → toàn bộ re-render khi mở/đóng modal
function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  return (
    <div>
      <ExpensiveDashboard />     {/* ← re-render khi modal toggle! */}
      <button onClick={() => setIsModalOpen(true)}>Open Modal</button>
      {isModalOpen && <Modal onClose={() => setIsModalOpen(false)} />}
    </div>
  );
}

// ✅ After: isOpen sống hoàn toàn trong ModalButton — không ai khác bị ảnh hưởng
function ModalButton() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <button onClick={() => setIsOpen(true)}>Open Modal</button>
      {isOpen && <Modal onClose={() => setIsOpen(false)} />}
    </>
  );
}

function App() {
  return (
    <div>
      <ExpensiveDashboard />  {/* ← không bao giờ re-render vì modal */}
      <ModalButton />
    </div>
  );
}
```

### Kỹ thuật 4: Zustand / Jotai — Atomic State với Selector

Với Zustand, component chỉ re-render khi **đúng phần state nó dùng** thay đổi:

```tsx
// Zustand store
const useStore = create((set) => ({
  cart: [],
  user: { name: 'Truong', role: 'admin' },
  theme: 'dark',
  filters: { category: 'all', maxPrice: 1000 },
  addToCart: (id) => set(state => ({ cart: [...state.cart, id] })),
  setTheme: (t) => set({ theme: t }),
}));

// ✅ CartCount chỉ re-render khi cart.length thay đổi
// Không re-render khi theme, user, filters thay đổi
function CartCount() {
  const count = useStore(state => state.cart.length); // ← selector
  return <span>{count} items</span>;
}

// ✅ ThemeToggle chỉ re-render khi theme thay đổi
function ThemeToggle() {
  const theme = useStore(state => state.theme);       // ← selector
  const setTheme = useStore(state => state.setTheme); // ← stable reference
  return <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme}</button>;
}

// Jotai: atomic approach — mỗi atom hoàn toàn độc lập
import { atom, useAtom, useAtomValue } from 'jotai';

const cartAtom = atom<CartItem[]>([]);
const themeAtom = atom<'dark' | 'light'>('dark');
const userAtom = atom({ name: 'Truong', role: 'admin' });

// CartCount chỉ subscribe cartAtom — theme, user thay đổi không ảnh hưởng
function CartCount() {
  const cart = useAtomValue(cartAtom); // ← chỉ subscribe cartAtom
  return <span>{cart.length} items</span>;
}
```

### Kỹ thuật 5: `useReducer` thay vì nhiều `useState`

Khi có nhiều states liên quan nhau, dùng `useReducer` giúp gom nhiều state updates thành **1 lần render duy nhất**:

```tsx
// ❌ Before: 3 setState riêng → 3 lần render (React <18) hoặc vẫn tạo nhiều re-renders
function BadForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);  // render 1
    await submitAPI({ name, email });
    setIsSubmitting(false); // render 2
    setName('');            // render 3 (nếu không batch)
    setEmail('');           // render 4
  };
}

// ✅ After: useReducer — tất cả state updates gom vào 1 dispatch → 1 render
type FormState = { name: string; email: string; isSubmitting: boolean; error: string | null };
type FormAction =
  | { type: 'SET_FIELD'; field: 'name' | 'email'; value: string }
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_SUCCESS' }
  | { type: 'SUBMIT_ERROR'; error: string };

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SET_FIELD': return { ...state, [action.field]: action.value };
    case 'SUBMIT_START': return { ...state, isSubmitting: true, error: null };
    case 'SUBMIT_SUCCESS': return { name: '', email: '', isSubmitting: false, error: null };
    case 'SUBMIT_ERROR': return { ...state, isSubmitting: false, error: action.error };
    default: return state;
  }
}

function GoodForm() {
  const [state, dispatch] = useReducer(formReducer, { name: '', email: '', isSubmitting: false, error: null });

  const handleSubmit = async () => {
    dispatch({ type: 'SUBMIT_START' }); // 1 render
    try {
      await submitAPI(state);
      dispatch({ type: 'SUBMIT_SUCCESS' }); // 1 render
    } catch (e) {
      dispatch({ type: 'SUBMIT_ERROR', error: String(e) }); // 1 render
    }
  };
}
```

### Kỹ thuật 6: Module-level Constants và Pure Functions

Đặt data và functions **ngoài component** nếu chúng không phụ thuộc vào props/state — chúng sẽ không bao giờ recreate:

```tsx
// ❌ Before: object và function tạo mới mỗi render
function ProductList() {
  // ← tạo mới mỗi render dù nội dung giống hệt!
  const CATEGORIES = ['Electronics', 'Clothing', 'Books'];
  const formatPrice = (price: number) => `$${price.toFixed(2)}`;
  const sortByPrice = (a: Product, b: Product) => a.price - b.price;

  return /* ... */;
}

// ✅ After: đặt ra ngoài — tạo 1 lần duy nhất, không ảnh hưởng đến renders
const CATEGORIES = ['Electronics', 'Clothing', 'Books']; // ← module-level const
const formatPrice = (price: number) => `$${price.toFixed(2)}`; // ← pure function
const sortByPrice = (a: Product, b: Product) => a.price - b.price;

function ProductList() {
  // Dùng trực tiếp, không cần useCallback hay useMemo
  return /* ... */;
}
```

### Kỹ thuật 7: `useDeferredValue` và `useTransition` (React 18+)

Không giảm số lần render, nhưng **ưu tiên** renders quan trọng trước, giúp UI không bị đơ:

```tsx
// useDeferredValue: defer việc tính toán nặng để không block input
function SearchPage() {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query); // ← defer update

  // deferredQuery cập nhật sau query → input responsive ngay lập tức
  // ExpensiveList chỉ render sau khi browser xử lý xong input
  const filteredProducts = useMemo(
    () => expensiveFilter(products, deferredQuery), // ← dùng deferred value
    [products, deferredQuery]
  );

  return (
    <>
      <input value={query} onChange={e => setQuery(e.target.value)} />
      <Suspense fallback={<Spinner />}>
        <ExpensiveList products={filteredProducts} />
      </Suspense>
    </>
  );
}

// useTransition: mark state update là non-urgent
function TabSwitcher() {
  const [tab, setTab] = useState('home');
  const [isPending, startTransition] = useTransition();

  const switchTab = (newTab: string) => {
    startTransition(() => {
      setTab(newTab); // ← React biết đây là non-urgent, có thể interrupt
    });
  };

  return (
    <div>
      {isPending && <Spinner />} {/* ← hiện spinner trong khi transition */}
      <button onClick={() => switchTab('profile')}>Profile</button>
      <SlowTabContent tab={tab} />
    </div>
  );
}
```

---

## Tránh dùng `useEffect` — Khi nào nó sai, và thay bằng gì?

> **Nguyên tắc cốt lõi:** `useEffect` chỉ dùng để **đồng bộ hóa React với hệ thống bên ngoài** (DOM API, browser APIs, WebSocket, third-party library...). Mọi thứ khác đều có cách tốt hơn.

### ❌ Anti-pattern 1: Dùng useEffect để tính derived state

Đây là lỗi cực kỳ phổ biến — dùng `useEffect` + `setState` để tính giá trị từ state/props hiện có:

```tsx
// ❌ WRONG: Effect tạo thêm 1 render cycle thừa
function ProductList({ products, filter }) {
  const [filteredProducts, setFilteredProducts] = useState([]);

  useEffect(() => {
    // Render 1: products hoặc filter thay đổi → trigger effect
    // Render 2: setFilteredProducts → trigger thêm 1 render nữa!
    setFilteredProducts(
      products.filter(p => p.category === filter.category)
    );
  }, [products, filter]);

  return filteredProducts.map(p => <ProductItem key={p.id} product={p} />);
}

// ✅ CORRECT: Tính trực tiếp trong render — không cần effect, không cần extra render
function ProductList({ products, filter }) {
  // Tính ngay trong render — 0 extra render cycles
  const filteredProducts = products.filter(p => p.category === filter.category);
  // Nếu tốn kém: dùng useMemo, nhưng đa số trường hợp không cần
  return filteredProducts.map(p => <ProductItem key={p.id} product={p} />);
}
```

**Rule:** Nếu bạn đang viết `useEffect(() => { setState(compute(x)) }, [x])` → **luôn luôn** có cách tốt hơn.

### ❌ Anti-pattern 2: Dùng useEffect để reset state khi prop thay đổi

```tsx
// ❌ WRONG: Effect reset form khi userId thay đổi → extra render
function ProfileForm({ userId }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    // userId thay đổi → render 1 với state cũ → effect chạy → render 2 với state mới
    setName('');
    setEmail('');
  }, [userId]);
}

// ✅ CORRECT 1: Dùng key prop — React tự reset toàn bộ state khi key thay đổi
function App() {
  return <ProfileForm key={userId} userId={userId} />;
  //                  ^^^ React unmount và remount ProfileForm khi userId thay đổi
  //                  → state tự reset về initialValue, không cần effect
}

// ✅ CORRECT 2: Nếu chỉ cần reset một phần state
function ProfileForm({ userId }) {
  const [name, setName] = useState('');
  const [prevUserId, setPrevUserId] = useState(userId);

  // Nếu userId thay đổi, reset state ngay trong render (trước khi paint)
  if (prevUserId !== userId) {
    setPrevUserId(userId);
    setName(''); // reset ngay, không tạo extra effect cycle
  }
}
```

### ❌ Anti-pattern 3: Dùng useEffect để fetch data (khi không cần)

```tsx
// ❌ WRONG: useEffect fetch → nhiều vấn đề (race condition, no caching, re-fetch không cần)
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/users/${userId}`)
      .then(r => r.json())
      .then(data => { setUser(data); setLoading(false); });
    // ← Race condition: nếu userId thay đổi nhanh, response cũ có thể arrive sau!
  }, [userId]);
}

// ✅ CORRECT 1: React Query / SWR — caching, deduplication, race condition tự xử lý
import { useQuery } from '@tanstack/react-query';

function UserProfile({ userId }) {
  const { data: user, isLoading } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetch(`/api/users/${userId}`).then(r => r.json()),
    staleTime: 5 * 60 * 1000, // cache 5 phút
  });
  // ← không cần useEffect, không cần state, tự handle race condition, caching, retry
}

// ✅ CORRECT 2: Nếu không muốn React Query, dùng use() hook (React 19)
// hoặc Suspense + resource pattern
```

### ❌ Anti-pattern 4: Dùng useEffect để subscribe external store

```tsx
// ❌ WRONG: useEffect + useState để subscribe external store
function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
}

// ✅ CORRECT: useSyncExternalStore — built-in hook cho external store
// Tự handle server rendering, concurrent mode, race conditions
function ConnectionStatus() {
  const isOnline = useSyncExternalStore(
    // subscribe function: gọi callback khi store thay đổi
    (callback) => {
      window.addEventListener('online', callback);
      window.addEventListener('offline', callback);
      return () => {
        window.removeEventListener('online', callback);
        window.removeEventListener('offline', callback);
      };
    },
    // getSnapshot: đọc giá trị hiện tại của store
    () => navigator.onLine,
    // getServerSnapshot (optional): cho SSR
    () => true
  );
  return <span>{isOnline ? '🟢 Online' : '🔴 Offline'}</span>;
}
```

### ❌ Anti-pattern 5: Dùng useEffect để notify parent về state change

```tsx
// ❌ WRONG: Effect để "sync" state lên parent — tạo render cascade
function ChildForm({ onValidChange }) {
  const [value, setValue] = useState('');
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const valid = value.length > 3;
    setIsValid(valid);   // render 1
    onValidChange(valid); // ← không nên gọi trong effect!
  }, [value]);           // render 2 (parent re-render)
}

// ✅ CORRECT: Xử lý ngay trong event handler
function ChildForm({ onValidChange }) {
  const [value, setValue] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    // Tính và notify ngay trong event handler — 1 render duy nhất
    onValidChange(newValue.length > 3);
  };

  return <input value={value} onChange={handleChange} />;
}
```

### ❌ Anti-pattern 6: Dùng useEffect để init state từ props

```tsx
// ❌ WRONG: Effect để copy prop vào state lúc đầu
function EditableTitle({ initialTitle }) {
  const [title, setTitle] = useState('');

  useEffect(() => {
    setTitle(initialTitle); // ← render 1 với '', render 2 với initialTitle
  }, []);
}

// ✅ CORRECT: Lazy initializer trong useState
function EditableTitle({ initialTitle }) {
  const [title, setTitle] = useState(() => initialTitle); // ← chỉ chạy 1 lần, không re-render
  // hoặc đơn giản hơn:
  const [title2, setTitle2] = useState(initialTitle); // ← cũng ổn nếu initialTitle không đổi
}
```

### ❌ Anti-pattern 7: Dùng useEffect cho logic không liên quan lifecycle

```tsx
// ❌ WRONG: Event handlers không nên trong useEffect
function LoginForm() {
  const [error, setError] = useState('');

  // Điều này không cần effect — không sync với external system
  useEffect(() => {
    if (error) {
      analytics.track('login_error', { error });
    }
  }, [error]);
}

// ✅ CORRECT: Logic xử lý trong event handler trực tiếp
function LoginForm() {
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login();
    } catch (err) {
      const errorMsg = String(err);
      setError(errorMsg);
      analytics.track('login_error', { error: errorMsg }); // ← ngay trong handler
    }
  };
}
```

---

## Khi nào useEffect là ĐÚNG để dùng

Chỉ dùng `useEffect` khi **thực sự cần đồng bộ với hệ thống ngoài React**:

```tsx
// ✅ ĐÚNG 1: Sync với DOM API trực tiếp
useEffect(() => {
  document.title = `${count} notifications`;
}, [count]);

// ✅ ĐÚNG 2: WebSocket / SSE connection lifecycle
useEffect(() => {
  const ws = new WebSocket(url);
  ws.onmessage = handleMessage;
  return () => ws.close(); // ← cleanup là bắt buộc
}, [url]);

// ✅ ĐÚNG 3: Third-party library không biết về React (maps, charts, players)
useEffect(() => {
  const map = new google.maps.Map(containerRef.current, options);
  return () => map.remove();
}, []);

// ✅ ĐÚNG 4: Timer / Interval
useEffect(() => {
  const id = setInterval(fetchLatestData, 30000);
  return () => clearInterval(id);
}, []);

// ✅ ĐÚNG 5: Resize / Intersection Observer
useEffect(() => {
  const observer = new IntersectionObserver(handleIntersect);
  observer.observe(elementRef.current);
  return () => observer.disconnect();
}, []);
```

---

## Bảng quyết định: useEffect hay không?

| Tình huống | ❌ Đừng dùng useEffect | ✅ Thay bằng |
|---|---|---|
| Tính giá trị từ state/props | `useEffect + setState` | Tính thẳng trong render hoặc `useMemo` |
| Fetch data | `useEffect + fetch + useState` | React Query / SWR / `use()` |
| Subscribe external store | `useEffect + setState` | `useSyncExternalStore` |
| Reset state khi prop đổi | `useEffect + setState` | `key` prop hoặc tính ngay trong render |
| Notify parent khi state đổi | `useEffect + onCallback()` | Gọi callback trong event handler |
| Init state từ prop | `useEffect + setState` | `useState(() => initialValue)` |
| Analytics / logging khi event xảy ra | `useEffect` | Event handler |
| DOM API / Browser API | — | ✅ `useEffect` là đúng |
| WebSocket / SSE | — | ✅ `useEffect` là đúng |
| Third-party library | — | ✅ `useEffect` là đúng |
| Timer / Interval | — | ✅ `useEffect` là đúng |

---

## Case Study thực tế: Notion App — Làm chậm ~30% load time chỉ bằng config

> **Nguồn:** [3perf.com/blog/notion](https://3perf.com/blog/notion/) — Ivan Akulov (PerfPerfPerf)
>
> Đây là một case study reverse-engineering Notion (React web app chạy trong Electron), phân tích tại sao app load chậm 6.2s trên desktop và 12.6s trên mobile (Nexus 5), và đề xuất các fix cụ thể có thể giảm ~30% load time.

### Vấn đề: Notion tải mất 6–12 giây

Khi mở Notion, đây là timeline loading waterfall:

```
Timeline (Desktop):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
0s      1s      2s      3s      4s      5s      6s      7s
├───────┼───────┼───────┼───────┼───────┼────■──┼───────┤
│ ██ Download vendor.js + app.js (2 bundles, parallel)  │
│       ████████████████████ Execute JS (3.3s!)         │
│                            ██ API requests            │
│                              ██ More JS execution     │
│                                        ▲ First Paint  │
│                                        (5.6s: spinner)│
│                                          ▲ Content    │
│                                          (6.2s)       │
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Nexus 5 (mid-tier Android phone):
- vendor + app bundle compilation: 0.4s + 1.2s = 1.6s
- Bundle execution: 3.3s
- Total JS cost: 4.9s (chiếm 80% thời gian load!)
- First content: 12.6s 😱
```

**Root cause**: Notion có **1100+ modules** đều được initialize ngay khi bundle load — kể cả code cho các tính năng chưa cần dùng đến (settings, import tools, admin panel...).

```
JS bundle lifecycle (từ Chrome DevTools Performance tab):
┌──────────────────────────────────────────────────────────────┐
│  COMPILE vendor.js   │  COMPILE app.js (1.2s)               │
│  (0.4s)              │                                       │
│──────────────────────┴──────────────────────────────────────│
│                EXECUTE ALL 1100+ MODULES (3.3s)              │
│  bkwR() → CyCz() → fOpr() → ... × 1100 modules             │
│  [Each module = 1-5ms, but 1100 × 3ms = 3.3s total]        │
└──────────────────────────────────────────────────────────────┘
```

---

### Fix 1: Code Splitting — Chỉ tải code cần thiết

**Vấn đề đo lường được:** Notion bundle gồm nhiều code không cần cho trang đầu (settings pages, import tools, admin features...) nhưng tất cả đều bị load upfront.

```
Phân tích bundle (minh họa):
┌─────────────────────────────────────────────────────┐
│  vendor.js (~2.4MB gzip)                            │
│  ┌─────────┬─────────┬────────┬───────────────────┐ │
│  │ react   │ lodash  │ moment │ ... 50+ libraries  │ │
│  │ (140KB) │ (70KB)  │ (67KB) │                   │ │
│  └─────────┴─────────┴────────┴───────────────────┘ │
│                                                     │
│  app.js (~3.7MB gzip)                               │
│  ┌──────────┬───────────┬──────────┬─────────────┐  │
│  │ Homepage │ Settings  │ Import   │ Admin Panel  │  │
│  │ (needed) │ (not now) │ (not now)│ (not now)   │  │
│  └──────────┴───────────┴──────────┴─────────────┘  │
│   ↑ CHỈ CẦN PHẦN NÀY lúc đầu, nhưng load tất cả!   │
└─────────────────────────────────────────────────────┘
```

**Fix: Dynamic Import (React.lazy)**

```javascript
// ❌ Before: Import tất cả upfront → tất cả được execute khi bundle load
import SettingsPage from './pages/Settings';
import ImportTool from './pages/Import';
import AdminPanel from './pages/Admin';

// ✅ After: Dynamic import → tạo ra chunk riêng, chỉ tải khi cần
const SettingsPage = React.lazy(() => import('./pages/Settings'));
const ImportTool = React.lazy(() => import('./pages/Import'));
const AdminPanel = React.lazy(() => import('./pages/Admin'));

// Webpack tự động tạo ra các file chunk riêng biệt:
// dist/
//   main.js           ← chỉ chứa code cần thiết cho homepage
//   settings.chunk.js ← chỉ tải khi user vào Settings
//   import.chunk.js   ← chỉ tải khi user dùng Import
//   admin.chunk.js    ← chỉ tải khi user là admin
```

**Kết quả ước tính:** Giảm lượng JS cần execute lúc khởi động từ 100% xuống còn 40-60%.

---

### Fix 2: Module Concatenation (Scope Hoisting)

**Vấn đề:** Mỗi module bị bọc trong một function riêng → overhead 1100 function calls.

```
❌ Without Module Concatenation (mỗi module = 1 function):
┌──────────────────────────────────────────────────────┐
│ bkwR: function(module, __webpack_exports__, req) {   │
│   "use strict";                                      │
│   var _helper = __webpack_require__("xN6P");         │
│   // actual code...                                  │
│ }                                                    │
│                                                      │
│ xN6P: function(module, __webpack_exports__, req) {   │
│   "use strict";                                      │
│   // helper code...                                  │
│ }                                                    │
└──────────────────────────────────────────────────────┘
Có 1100 modules → 1100 wrapper functions → overhead lớn!

✅ With Module Concatenation (nhiều modules gộp vào 1 scope):
┌──────────────────────────────────────────────────────┐
│ // helper code inlined trực tiếp                     │
│ function helperFunction() { /* ... */ }              │
│                                                      │
│ // main module code dùng trực tiếp                   │
│ var result = helperFunction();                       │
└──────────────────────────────────────────────────────┘
Ít wrapper functions hơn → ít overhead hơn → execute nhanh hơn
```

**Config Webpack:**
```javascript
// webpack.config.js
module.exports = {
  optimization: {
    concatenateModules: true, // Bật scope hoisting (default: true trong production)
  }
}
```

**Cách verify:** Tìm `__webpack_require__` trong bundle output. Nếu vẫn còn rất nhiều → concatenation chưa hoạt động tốt.

---

### Fix 3: Loại bỏ Polyfills không cần thiết

**Vấn đề phát hiện trong Notion:** Bundle chứa polyfills cho **tất cả** browsers kể cả IE11, trong khi Notion chạy trong Electron (Chrome!) và target users dùng modern browsers.

```
Bundle phân tích (webpack-bundle-analyzer):
┌────────────────────────────────────────────────────────────┐
│ vendor.js                                                  │
│ ┌─────────────────────────────────────────────────────┐   │
│ │  core-js polyfills: 200KB+ (!!)                     │   │
│ │  ┌──────────────┬───────────────┬─────────────────┐ │   │
│ │  │ Array.from   │ Promise.all   │ Object.assign   │ │   │
│ │  │ (modern)     │ (modern)      │ (modern)        │ │   │
│ │  └──────────────┴───────────────┴─────────────────┘ │   │
│ │  Electron dùng Chrome 80+ → tất cả đều native! 🤦   │   │
│ └─────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────┘
```

**Fix:** Cấu hình Babel target đúng browser range:
```javascript
// babel.config.js
module.exports = {
  presets: [
    ['@babel/preset-env', {
      // ❌ Before: target quá rộng → nhiều polyfills
      // targets: '> 0.5%, last 2 versions, not dead'

      // ✅ After: target chỉ browsers thực sự cần support
      targets: {
        chrome: '80',      // Nếu là Electron app
        // hoặc:
        // browsers: ['last 2 Chrome versions', 'last 2 Firefox versions']
        // Loại bỏ IE hoàn toàn nếu không cần
      },
      useBuiltIns: 'usage', // Chỉ thêm polyfills thực sự cần dùng
      corejs: 3,
    }],
  ],
};
```

**Kết quả:** Loại bỏ được 50-200KB polyfill code không cần thiết.

---

### Fix 4: Defer Third-party Scripts (Delay Intercom, Analytics...)

**Vấn đề phát hiện trong Notion:** Analytics và Intercom (support chat) được load **ngay khi app khởi động**, chiếm băng thông và CPU trong giai đoạn critical loading.

```
Loading Waterfall — BEFORE:
┌────────────────────────────────────────────────────────┐
│ 0s─────────────────────────────────5s──────────────10s │
│ [Download vendor.js              ]                     │
│ [Download app.js                 ]                     │
│             [Execute JS          ]                     │
│                         [Intercom SDK  ←── chiếm BW!] │
│                         [Amplitude     ←── chiếm BW!] │
│                         [API: Get page data           ]│
│                                          ▲ First paint │
└────────────────────────────────────────────────────────┘

Loading Waterfall — AFTER (defer third parties):
┌────────────────────────────────────────────────────────┐
│ 0s─────────────────────────────────5s──────────────10s │
│ [Download vendor.js              ]                     │
│ [Download app.js                 ]                     │
│             [Execute JS          ]                     │
│                         [API: Get page data           ]│
│                              ▲ First paint (sớm hơn!) │
│                                             [Intercom] │
│                                             [Analytics]│
│                                              ↑ Defer 5s│
└────────────────────────────────────────────────────────┘
```

**Fix: Delay loading third-party scripts**

```javascript
// ❌ Before: Load ngay khi app khởi động
// Trong HTML:
// <script src="https://widget.intercom.io/widget/xxx" async></script>

// ✅ After: Chờ đến khi app đã interactive, rồi mới load
function loadIntercomLazily() {
  // Option 1: Load sau khi app render xong
  window.addEventListener('load', () => {
    setTimeout(() => {
      const script = document.createElement('script');
      script.src = 'https://widget.intercom.io/widget/xxx';
      document.head.appendChild(script);
    }, 5000); // Delay 5 giây sau khi page load
  });
}

// Option 2: Chỉ load khi user thực sự cần (click vào support icon)
function loadIntercomOnDemand() {
  document.querySelector('#support-btn').addEventListener('click', () => {
    if (!window.Intercom) {
      const script = document.createElement('script');
      script.src = 'https://widget.intercom.io/widget/xxx';
      script.onload = () => window.Intercom('show');
      document.head.appendChild(script);
    } else {
      window.Intercom('show');
    }
  });
}
```

---

### Fix 5: Preload API Data song song với JS execution

**Vấn đề:** Notion thực hiện API calls để lấy dữ liệu trang **sau khi JS đã thực thi xong** — tức là user phải chờ thêm 1-2s để fetch data sau khi JS đã load.

```
Timeline hiện tại (Sequential):
─────────────────────────────────────────────────────────────
Time:   0s          2s          4s          6s          8s
        ├───────────┼───────────┼───────────┼───────────┤
Step:   [HTML]
        [vendor.js + app.js (download + parse)]
                              [JS Execute]
                                          [API: /getPage]
                                                      [Render]
─────────────────────────────────────────────────────────────
→ Data fetch chỉ bắt đầu ở 4s (sau khi JS xong)

Cải thiện (Parallel — Inline data trong HTML):
─────────────────────────────────────────────────────────────
Time:   0s          2s          4s          6s          8s
        ├───────────┼───────────┼───────────┼───────────┤
Step:   [HTML + inline <script>prefetch API data</script>]
              ↓ Fetch bắt đầu ngay từ giây 0!
        [vendor.js + app.js]
        [API: /getPage ──────────────────────]
                              [JS Execute]
                              [Data đã sẵn sàng → Render ngay!]
─────────────────────────────────────────────────────────────
→ Tiết kiệm 2-4s wait time!
```

**Fix: Inline data prefetch vào HTML**

```html
<!-- Server inject script này vào <head> của HTML response -->
<script>
  // Bắt đầu fetch data ngay khi HTML được parse,
  // song song với việc download JS bundles
  window.__NOTION_DATA__ = new Promise((resolve) => {
    fetch('/api/v3/getPublicPageData', {
      method: 'POST',
      body: JSON.stringify({ pageId: 'PAGE_ID' }),
    })
      .then(r => r.json())
      .then(resolve);
  });
</script>

<!-- Sau đó JS bundles download & execute... -->
<!-- Khi React app khởi động, data đã sẵn sàng: -->
```

```javascript
// Trong React app:
async function initApp() {
  // Thay vì fetch lại từ đầu, dùng data đã được preload
  const pageData = await window.__NOTION_DATA__;
  renderApp(pageData); // ← Data đã sẵn sàng, render ngay!
}
```

---

### Fix 6: Thêm Loading Skeleton thay vì Blank Screen

**Vấn đề UX:** Dù technical performance chưa thể cải thiện hoàn toàn, user vẫn thấy màn hình **trắng hoàn toàn** trong 5.6 giây đầu — điều này khiến họ nghĩ app bị treo.

```
Trải nghiệm người dùng — Perception vs Reality:
┌─────────────────────────────────────────────────────┐
│ Blank screen (0s → 5.6s):                          │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │                                             │   │
│  │         (trống hoàn toàn)                  │   │
│  │                                             │   │
│  └─────────────────────────────────────────────┘   │
│  → User: "App bị treo? Có vấn đề gì không?"        │
│                                                     │
│ Với Loading Skeleton (cải thiện perceived speed):   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ ██████████████████████ ← title skeleton     │   │
│  │ ██████████ ████████████████ ← text skeletons│   │
│  │ ████████████████████████████████████████    │   │
│  │ ████████████████████  ← content area        │   │
│  └─────────────────────────────────────────────┘   │
│  → User: "Đang tải... bình thường"                 │
│  → Perceived load time giảm dù actual time giống!  │
└─────────────────────────────────────────────────────┘
```

**Fix: Server-render skeleton trong HTML**

```html
<!-- Server inject skeleton vào HTML trước khi JS load -->
<div id="root">
  <!-- Skeleton hiển thị ngay khi HTML parse, không cần JS -->
  <div class="skeleton-layout">
    <div class="skeleton-sidebar">
      <div class="skeleton-item"></div>
      <div class="skeleton-item"></div>
    </div>
    <div class="skeleton-content">
      <div class="skeleton-title"></div>
      <div class="skeleton-paragraph"></div>
    </div>
  </div>
</div>
```

```css
/* Skeleton animation — không cần JS */
.skeleton-item {
  height: 20px;
  background: linear-gradient(
    90deg,
    #f0f0f0 25%,
    #e0e0e0 50%,
    #f0f0f0 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

---

### Fix 7: Cache-Control headers đúng cách

**Vấn đề phát hiện trong Notion:** API responses thiếu hoặc cấu hình sai `Cache-Control` headers → mỗi lần mở Notion, toàn bộ API data phải fetch lại từ server dù user đã ghé thăm page đó hôm qua.

```
HTTP Caching Strategy cho React App:

HTML files:
  Cache-Control: no-cache, must-revalidate
  (Luôn check server có version mới không — vì HTML chứa hash references)

JS/CSS bundles (có content hash trong tên):
  vendor.abc123.js → Cache-Control: max-age=31536000, immutable
  app.def456.js   → Cache-Control: max-age=31536000, immutable
  (Cache vĩnh viễn — nếu file thay đổi, tên file thay đổi)

API responses:
  GET /api/pages/:id → Cache-Control: private, max-age=300
  (Cache 5 phút phía client, không cache ở CDN)
  
  GET /api/public/:id → Cache-Control: public, max-age=60, s-maxage=3600
  (Public pages: client cache 1 phút, CDN cache 1 giờ)
```

---

### Tổng kết Case Study: Kết quả ước tính

```
Optimization Impact Summary:
┌──────────────────────────────────────────────────────────────┐
│ Fix                    │ Technique           │ Impact        │
├──────────────────────────────────────────────────────────────┤
│ Code Splitting         │ React.lazy          │ -40% JS exec  │
│ Module Concatenation   │ webpack config      │ -5-10% exec   │
│ Remove Polyfills       │ Babel targets       │ -50-200KB     │
│ Defer Third Parties    │ setTimeout load     │ -1-2s network │
│ Preload API Data       │ Inline prefetch     │ -2-4s wait    │
│ Loading Skeleton       │ Server HTML         │ Perceived -50%│
│ Cache-Control          │ HTTP headers        │ Repeat -80%   │
├──────────────────────────────────────────────────────────────┤
│ TOTAL ESTIMATED        │                     │ ~30% faster   │
└──────────────────────────────────────────────────────────────┘

Timeline Before vs After (Desktop):
BEFORE: 0s ─────── 3s ─────── 6s ──────► 6.2s (first content)
AFTER:  0s ─── 2s ─────── 4s ───► ~4.3s (first content) ✅

Timeline Before vs After (Nexus 5 mobile):
BEFORE: 0s ──────────────── 12.6s ──────────────────────────►
AFTER:  0s ────────── ~8.8s ─────────────────────────────────►
```

> **Bài học chính:** Phần lớn performance gain không đến từ việc tối ưu React renders, mà đến từ **tối ưu bundle size và loading strategy**. Luôn đo lường với WebPageTest/Chrome DevTools Performance tab trước khi tối ưu bất cứ thứ gì.


---

## Case Study thực tế: Causal App — Tối ưu React Interaction Performance

> **Nguồn:** [3perf.com/blog/causal](https://3perf.com/blog/causal/) — Ivan Akulov (PerfPerfPerf)
>
> Case study này khác với Notion: vấn đề không phải là **load time** mà là **interaction latency** — mỗi lần user gõ một số vào cell của spreadsheet, UI bị đơ 690ms trên MacBook Pro và hơn 1.5s trên máy thấp hơn. Causal là một collaborative spreadsheet/financial modeling app phức tạp, dùng React + Redux + AG Grid.

### Vấn đề: Gõ một số vào cell → UI lag 690ms

```
Chrome DevTools Performance Trace — Mỗi lần gõ một ký tự:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
0ms                          690ms
├─────────────────────────────┤
│ [User presses key]          │
│                             │
│ JS: Parse model (300ms) ███ │  ← Server gửi protobuf, cần decode
│ JS: React renders   (200ms) │  ← AG Grid re-render toàn bộ grid
│ JS: Deep comparison (90ms)  │  ← AG Grid deep-compare tất cả props
│ JS: useEffect callbacks     │  ← Nhiều useEffect không cần chạy lại
│ JS: Redundant renders       │  ← Cùng 1 update trigger 4 renders!
│                             ▼ 690ms sau: UI mới phản hồi
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Target: Giảm xuống < 100ms (ngưỡng user không cảm thấy lag)
Kết quả thực tế đạt được: ~4× nhanh hơn sau tất cả fixes
```

---

### Fix 1: Patch thư viện third-party để tránh render không cần thiết

**Vấn đề phát hiện:** AG Grid (data grid library) có một bug — khi user click vào 1 cell, nó tính toán lại `getCellRendererParams` cho **tất cả** cells trong viewport, dù chỉ 1 cell thay đổi.

```
AG Grid behavior khi 1 cell được chọn:

TRƯỚC (bug):
  User clicks Cell[3][4]
         │
         ▼
  AG Grid: "Selection changed!"
         │
         ▼
  AG Grid gọi getCellRendererParams() cho TẤT CẢ cells:
  ┌──────────────────────────────────────────────────────┐
  │  Cell[0][0] getCellRendererParams() ← không cần!    │
  │  Cell[0][1] getCellRendererParams() ← không cần!    │
  │  Cell[0][2] getCellRendererParams() ← không cần!    │
  │  ...                                                 │
  │  Cell[3][4] getCellRendererParams() ← CÁI NÀY mới  │
  │  ...                                                 │
  │  Cell[N][M] getCellRendererParams() ← không cần!    │
  └──────────────────────────────────────────────────────┘
  Kết quả: O(N×M) function calls cho mỗi click!
  Với grid 20 rows × 50 cols = 1000 unnecessary calls!

SAU (patch):
  User clicks Cell[3][4]
         │
         ▼
  Chỉ gọi getCellRendererParams() cho cells thực sự thay đổi
  (cells liên quan đến selection state)
```

**Fix: Dùng `yarn patch` để patch AG Grid**

```bash
# Tạo patch cho thư viện third-party
yarn patch @ag-grid-community/react

# Edit file trong thư mục patch
# Sau khi sửa:
yarn patch-commit /tmp/patch-folder
# → Tạo ra file .patch được lưu trong package.json
```

```json
// package.json
{
  "resolutions": {
    "@ag-grid-community/react": "patch:@ag-grid-community/react@npm:27.x.x#./patches/ag-grid.patch"
  }
}
```

**Bài học:** Đừng ngại patch third-party libraries khi cần — `yarn patch` (hoặc `patch-package` với npm) cho phép bạn fix bugs trong dependencies mà không cần fork hay chờ PR merge.

---

### Fix 2: useEffect dependency quá rộng — "Hack" dependency array

**Vấn đề phát hiện:** Một `useEffect` được thiết kế để chạy khi **số lượng variables thay đổi** (thêm/xóa variable), nhưng thực tế nó chạy **mỗi khi bất kỳ variable nào thay đổi giá trị** — kể cả khi user chỉ gõ một số vào cell.

```typescript
// ❌ BEFORE: autocompleteVariables là deep object, thay đổi mỗi keystroke
useEffect(() => {
  setTimeout(() => {
    // Workaround cho bug AG Grid autocomplete
    gridApi.refreshCells({ force: true });
  }, 0);
}, [gridApi, autocompleteVariables]);
//           ^^^^^^^^^^^^^^^^^^^
// autocompleteVariables = { "id-1": { name, type, dimensions, model, value... }, ... }
// Mỗi khi user gõ → variable values thay đổi → object reference thay đổi
// → useEffect re-runs → gridApi.refreshCells() gọi không cần thiết!
```

```
Vòng lặp lãng phí:
User gõ "5" vào cell
  → Redux updates variable value
  → autocompleteVariables object recreated (reference mới)
  → useEffect dependency [autocompleteVariables] triggered
  → gridApi.refreshCells({ force: true }) called
  → Toàn bộ grid re-renders
  → UI lag!

Nhưng gridApi.refreshCells() CHỈ CẦN chạy khi:
  → variable được THÊM VÀO hoặc BỊ XÓA (thay đổi về số lượng/IDs)
  → KHÔNG CẦN chạy khi chỉ thay đổi values!
```

**Fix: Serialize dependency thành string đại diện cho "shape" thay vì object:**

```typescript
// ✅ AFTER: Chỉ re-run khi danh sách variable IDs thực sự thay đổi
useEffect(() => {
  setTimeout(() => {
    gridApi.refreshCells({ force: true });
  }, 0);
}, [
  gridApi,
  // ← Thay vì pass object, serialize chỉ phần quan trọng (IDs)
  Object.keys(autocompleteVariables).sort().join(','),
  // "id-abc,id-def,id-xyz" — chỉ thay đổi khi variable được thêm/xóa
]);

// Lúc gõ:
//   autocompleteVariables thay đổi → sort().join() vẫn như cũ → useEffect KHÔNG chạy ✅
// Lúc thêm variable:
//   sort().join() = "id-abc,id-def,id-xyz,id-new" → useEffect chạy ✅
```

> **Lưu ý:** Đây là giải pháp tạm thời ("hack"). Giải pháp lý tưởng là move `gridApi.refreshCells()` vào Redux saga xử lý action "add/remove variable". Nhưng trong thực tế, đây là trade-off hợp lý: ít technical debt hơn, nhanh ship hơn, và dễ xóa sau khi refactor xong.

**Kết quả:** Tiết kiệm ~5-10% JavaScript execution time.

---

### Fix 3: Deep Equality Check trong AG Grid — Patch để dùng Identity Check

**Vấn đề phát hiện:** AG Grid's `componentDidUpdate` chạy deep comparison trên **toàn bộ props** mỗi khi component re-render. Prop `context` là một object khổng lồ (chứa toàn bộ model, dimensions, scenarios...) → mỗi deep comparison tốn ~90ms.

```
AG Grid componentDidUpdate flow:
┌────────────────────────────────────────────────────────────┐
│ componentDidUpdate(prevProps, nextProps)                   │
│         │                                                  │
│         ▼                                                  │
│ extractGridPropertyChanges()                               │
│         │                                                  │
│         ▼                                                  │
│ Với MỖI prop (rowData, context, columnDefs, ...):         │
│   changeDetectionStrategy.areEqual(prev, next)            │
│         │                                                  │
│         ▼ (default: DeepValueCheck)                       │
│ areEqual() → areEquivalent() → areEquivalent() → ...      │
│ [đệ quy đến tận lá của object tree]                      │
│                                                            │
│ context prop:                                              │
│ {                                                          │
│   editorModel: { variables: { "id-1": {...}, ... } },    │
│   autocompleteVariables: { "id-1": {...}, ... },          │
│   allDimensions: [...],                                    │
│   filteredDimensions: [...],                              │
│   // ... nhiều fields khác                               │
│ }                                                          │
│                                                            │
│ Deep compare object này = ~90ms mỗi lần!                  │
└────────────────────────────────────────────────────────────┘
```

**Fix: Patch AG Grid để support `IdentityCheck` (===) cho specific props:**

```typescript
// PATCH AG Grid source code (via yarn patch):
// getStrategyTypeForProp() — thêm support cho custom strategy per-prop

getStrategyTypeForProp(propKey) {
  // NEW: Support custom strategies từ caller
  if (
    this.props.changeDetectionStrategies &&
    propKey in this.props.changeDetectionStrategies
  ) {
    return this.props.changeDetectionStrategies[propKey];
  }
  // ... rest of original code
  return ChangeDetectionStrategyType.DeepValueCheck;
}
```

```typescript
// Sau đó dùng trong component:
import { ChangeDetectionStrategyType } from '@ag-grid-community/react';

<AgGridReact
  // ← context được memoize bằng useMemo,
  //   nên === comparison là đúng và chính xác
  changeDetectionStrategies={{
    context: ChangeDetectionStrategyType.IdentityCheck,
    //       ↑ Dùng === thay vì deep comparison
    //         context object được tạo bởi useMemo → stable reference
  }}
  context={context}
  // ...
/>
```

```typescript
// context được memoize đúng cách
const context = useMemo(
  () => ({
    editorModel,
    autocompleteVariables,
    allDimensions,
    filteredDimensions,
    // ...
  }),
  [editorModel, autocompleteVariables, allDimensions, filteredDimensions /* ... */]
);
// useMemo → reference chỉ thay đổi khi dependencies thực sự thay đổi
// → IdentityCheck (===) chính xác 100%
```

**Kết quả:** Tiết kiệm ~3-5% JavaScript cost, loại bỏ 90ms deep comparison mỗi lần render.

---

### Fix 4: useSelector vs useStore — Tránh re-render khi chỉ cần read trong callback

**Vấn đề:** Khi một component cần đọc Redux state **trong một callback** (không phải để render UI), dùng `useSelector` gây re-render thừa khi state đó thay đổi.

```typescript
// ❌ BEFORE: useSelector → component re-renders mỗi khi editorModel thay đổi
const CellWrapper = () => {
  const editorModel = useSelector(state => state.editorModel);

  const onChange = useCallback(() => {
    // Chỉ cần editorModel trong callback, không cần để render
    doSomethingWith(editorModel);
  }, [editorModel]); // ← editorModel thay đổi → onChange mới → Cell re-renders!

  return <Cell onChange={onChange} />;
};

// Timeline khi editorModel thay đổi:
// editorModel updates → CellWrapper re-renders → onChange recreated
// → Cell (memoized) re-renders vì onChange prop thay đổi
// → Nếu editorModel update 4 lần → 4 lần re-render của Cell!
```

```typescript
// ✅ AFTER: useStore → component KHÔNG re-render khi editorModel thay đổi
const CellWrapper = () => {
  // useStore() trả về store object — stable reference, KHÔNG trigger re-render
  const store = useStore();

  const onChange = useCallback(() => {
    // Đọc state tại thời điểm callback được gọi — luôn fresh, không cần dependency
    const editorModel = store.getState().editorModel;
    doSomethingWith(editorModel);
  }, [store]); // ← store reference không bao giờ thay đổi → onChange stable!

  return <Cell onChange={onChange} />;
  // Cell.memo → onChange không thay đổi → Cell KHÔNG re-renders ✅
};
```

```
So sánh useSelector vs useStore:
┌─────────────────────────────────────────────────────────────┐
│                │ useSelector              │ useStore         │
├─────────────────────────────────────────────────────────────┤
│ Triggers       │ Re-renders component     │ Không re-render  │
│ re-render?     │ khi selected state       │ bao giờ          │
│                │ thay đổi                 │                  │
├─────────────────────────────────────────────────────────────┤
│ Đọc state      │ Ngay khi component       │ Lazy: đọc tại    │
│ khi nào?       │ render (reactive)        │ thời điểm cần   │
│                │                          │ (trong callback) │
├─────────────────────────────────────────────────────────────┤
│ Dùng khi       │ Component output PHỤ     │ Callback/handler │
│                │ THUỘC vào state          │ cần state nhưng  │
│                │ (render state)           │ output KHÔNG PHỤ │
│                │                          │ THUỘC vào state  │
└─────────────────────────────────────────────────────────────┘

Ví dụ thực tế:
  useSelector: <UserAvatar src={user.avatar} />  ← avatar ảnh hưởng render
  useStore:    onClick={() => dispatch(action(store.getState().userId))}
                                                  ← userId chỉ cần trong handler
```

---

### Fix 5: Web Workers — Khi nào NÊN và KHÔNG NÊN dùng

**Ý tưởng ban đầu:** Parse protobuf binary model (tốn 400-800ms) trong Web Worker để không block main thread.

```
Ý tưởng:
Main thread: [Receive binary]──►[worker.decodeResponse()]──►[Use data]
Worker thread:                   [████ Parse 500ms ████]

Thực tế sau khi implement:
Main thread:  [Serialize data → Worker]──►[Wait]──►[Deserialize result]
              [████ 400ms ████]                      [████ 600ms ████]
Worker thread:                 [████ Parse 500ms ████]
              ↑ Tổng thời gian TĂNG lên vì serialization overhead!
```

**Vì sao Web Worker thất bại trong case này:**

```
Khi pass data tới/từ Web Worker, browser phải serialize/deserialize:
┌─────────────────────────────────────────────────────────────┐
│ Main → Worker:                                              │
│   rawResponse (ArrayBuffer 5MB) → clone → worker           │
│   Serialization: ~200ms (với buffer lớn)                   │
│                                                             │
│ Worker → Main:                                             │
│   parsedModel (large JS object) → clone → main             │
│   Deserialization: ~600ms (object lớn hơn binary nhiều!)   │
│                                                             │
│ Parse time trong Worker: ~500ms                            │
│ TOTAL: 200 + 600 + 500 = 1300ms > 500ms ban đầu! ❌        │
└─────────────────────────────────────────────────────────────┘

Rule of thumb — Web Worker phù hợp khi:
  ✅ Data in/out nhỏ (< 100KB)
  ✅ Computation heavy (>> serialization cost)
  ✅ Ví dụ: Tính toán số học, compress/decompress, image processing

Web Worker KHÔNG phù hợp khi:
  ❌ Kết quả là large JS object (deserialization expensive)
  ❌ Serialization cost > computation cost
  ❌ Ví dụ: Parse large protobuf → large JS object
```

**Giải pháp thực sự cho Causal:** Selective Data Loading — thay vì load toàn bộ model, chỉ fetch **rows đang visible** trong viewport.

```
BEFORE (Full Model Load):
  Server → Client: 5MB model (tất cả rows/categories)
  Parse: 500-1500ms
  
AFTER (Selective Load):
  Server → Client: chỉ visible rows (~50 rows)
  Parse: 1-5ms (!!!)
  
Kết quả: Parse cost giảm từ 500ms xuống 1-5ms = 100-500× nhanh hơn!
```

---

### Kết quả tổng thể: ~4× nhanh hơn

```
Performance Trace: Gõ một ký tự vào cell (100 categories model)

BEFORE:
  0ms ──────────────────────────────────────────── 690ms
  │ Parse model       (300ms) ██████████           │
  │ React renders     (200ms)         ████████     │
  │ Deep AG Grid diff  (90ms)                 ███  │
  │ Redundant effects  (50ms)                    ██│
  ──────────────────────────────────────────────────

AFTER (tất cả fixes + selective loading):
  0ms ─────── 175ms
  │ Parse visible rows (1-5ms) █               │
  │ React renders     (120ms)   ████████████   │
  │ AG Grid IdentityCheck (5ms)             █  │
  │ Reduced useEffect runs (10ms)            ██│
  ────────────────────────────────────────────

Tổng: 690ms → ~175ms = 4× nhanh hơn 🚀

Performance Trace comparison:
BEFORE: ████████████████████████████████████ 690ms (chủ yếu màu vàng/đỏ)
AFTER:  ████████ 175ms (nhiều khoảng xanh — main thread free!)

Màu sắc trong Chrome DevTools Performance:
  🟡 Vàng   = JS executing (scripting)
  🔴 Đỏ    = Long Task > 50ms (blocking UI)
  🔵 Xanh  = main thread idle / waiting
```

---

### Tổng kết Fix Summary

```
┌──────────────────────────────────────────────────────────────────┐
│ Fix                      │ Technique              │ Impact       │
├──────────────────────────────────────────────────────────────────┤
│ Patch AG Grid selection  │ yarn patch             │ -30% renders │
│ useEffect dependency     │ Object.keys().join()   │ -5-10% JS    │
│ AG Grid deep compare     │ IdentityCheck patch    │ -3-5% JS     │
│ useSelector → useStore   │ Stable ref pattern     │ -N renders   │
│ Selective data loading   │ Virtualized fetch      │ -99% parse!  │
│ Web Workers              │ ❌ Didn't work here    │ 0 (overhead) │
├──────────────────────────────────────────────────────────────────┤
│ TOTAL                    │                        │ ~4× faster   │
└──────────────────────────────────────────────────────────────────┘
```

---

### Bài học chính từ Causal Case Study

**1. Profile trước, optimize sau — luôn luôn**

```
Đừng guess. Mở Chrome DevTools → Performance → Record → thực hiện action
→ Nhìn vào flame chart → chỉ optimize những gì THỰC SỰ tốn thời gian.

Causal tưởng rằng Web Worker sẽ giúp → thực tế làm chậm hơn!
```

**2. Thư viện third-party có thể là bottleneck — đừng ngại patch**

```
AG Grid gây ra 2/5 vấn đề (selection re-render + deep compare).
Giải pháp: yarn patch — tạo patch file, commit vào repo, tự động apply.
Không cần fork thư viện, không cần chờ upstream fix.
```

**3. useEffect dependency là nguồn gốc của nhiều "mysterious lags"**

```
Khi useEffect chạy nhiều hơn dự kiến, kiểm tra ngay:
  → Dependency nào là object/array? (reference thay đổi mỗi render)
  → Có thể serialize thành primitive không? (string, number)
  → Có thể dùng useRef để đọc latest value mà không cần dependency?
  → Có thể move logic ra khỏi useEffect (vào event handler/saga)?
```

**4. useStore thay vì useSelector cho event handlers**

```typescript
// Pattern: Cần state trong handler nhưng KHÔNG cần render lại khi state đổi
const store = useStore(); // ← stable, không gây re-render
const handler = useCallback(() => {
  const state = store.getState(); // ← đọc tại thời điểm cần, luôn fresh
  doSomething(state.value);
}, [store]); // ← store stable → handler stable → child không re-render
```

**5. Tìm kiếm giải pháp gốc rễ, không chỉ workaround**

```
useEffect dependency hack (Object.keys().join()) là giải pháp tạm thời.
Giải pháp thực sự: Move logic vào Redux saga, loại bỏ dependency vào object.
→ Implement workaround ngay để ship, nhưng track technical debt và fix đúng cách.
```


---

## Case Study thực tế: Spotify — 6 Phát hiện từ 1 buổi profiling lúc 1 giờ sáng

> **Nguồn:** [3perf.com/blog/spotify-1am](https://3perf.com/blog/spotify-1am/) — Ivan Akulov (PerfPerfPerf)
>
> Spotify là Electron app → có thể dùng Chrome DevTools để profile. Sau khi bật DevTools bằng `spicetify enable-devtools`, tác giả record Performance trace khi chuyển giữa các playlist. Kết quả: **~440ms delay** mỗi lần switch playlist — từ đó phát hiện ra 6 vấn đề điển hình của React app trong thực tế.

### Bối cảnh: Chuyển playlist mất 440ms

```
Chrome DevTools Performance — Switch playlist action:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
0ms                                              440ms
├─────────────────────────────────────────────────┤
│ [User clicks playlist]                          │
│                                                 │
│ ████ Layout Thrashing (80ms) ████               │
│                  ██ React render #1             │
│                      ██ React render #2         │
│                          ██ React render #3     │  ← Cascading!
│                    ██████████████ Large render  │
│                    (200ms, 82 tracks)           │
│                              ██ styled-comps    │
│                               (generateStyles) │
│                                                 ▼
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Nhận ra ngay: t.unstable_runWithPriority trong flamechart = React đang chạy
```

---

### Phát hiện 1: Cascading Rerenders — Multiple React renders liên tiếp

**Dấu hiệu:** Trong Performance flamechart, thấy **nhiều `t.unstable_runWithPriority`** calls nối tiếp nhau thay vì 1 lần duy nhất.

```
Cascading Rerenders pattern:
┌──────────────────────────────────────────────────────────┐
│ User clicks playlist                                     │
│         │                                                │
│         ▼                                               │
│ Fetch playlist data (3 async calls):                    │
│   Promise A: fetch metadata    ──►resolve──► setState   │
│   Promise B: fetch track list  ──►resolve──► setState   │  ← render 2
│   Promise C: fetch artwork     ──►resolve──► setState   │  ← render 3
│                                                          │
│ Vì 3 promises resolve ở 3 thời điểm khác nhau:         │
│   → 3 setState → 3 React render cycles                 │
│   → Một số components render 3 lần dù chỉ cần 1 lần!  │
│   → Overhead tích lũy từ 3 reconciliation passes       │
└──────────────────────────────────────────────────────────┘
```

**Fix: Gom tất cả async calls lại, render 1 lần duy nhất:**

```typescript
// ❌ Before: 3 setState riêng → 3 render cycles
async function loadPlaylist(id: string) {
  const metadata = await fetchMetadata(id);
  setMetadata(metadata);                    // render 1

  const tracks = await fetchTracks(id);
  setTracks(tracks);                        // render 2

  const artwork = await fetchArtwork(id);
  setArtwork(artwork);                      // render 3
}

// ✅ Fix 1: Promise.all — chờ tất cả xong, set state 1 lần
async function loadPlaylist(id: string) {
  const [metadata, tracks, artwork] = await Promise.all([
    fetchMetadata(id),
    fetchTracks(id),
    fetchArtwork(id),
  ]);
  // 1 setState object → 1 render cycle duy nhất
  setPlaylistData({ metadata, tracks, artwork });
}

// ✅ Fix 2: unstable_batchedUpdates (React 17 trở về trước)
// React 18 tự động batch tất cả updates, kể cả trong async callbacks
import { unstable_batchedUpdates } from 'react-dom';

const [metadata, tracks, artwork] = await Promise.all([...]);
unstable_batchedUpdates(() => {
  setMetadata(metadata);
  setTracks(tracks);
  setArtwork(artwork);
  // → React gom tất cả thành 1 render cycle
});

// ✅ Fix 3: React 18 — tự động batch (không cần làm gì thêm)
// Trong React 18, tất cả setState trong async callbacks đều được batch tự động
```

**Tác động:** Giảm từ N render cycles xuống còn 1 → tiết kiệm (N-1) × reconciliation overhead.

---

### Phát hiện 2: Layout Thrashing — 80ms "tím" trong flamechart

**Dấu hiệu:** Các khối màu **tím (violet)** dày đặc trong Performance tab = browser bị force reflow liên tục.

```
Layout Thrashing — cơ chế:
┌──────────────────────────────────────────────────────────┐
│ JavaScript đọc layout property (offsetHeight, getBCR...) │
│   → Browser phải tính toán layout trước khi trả lời     │
│   → Nếu DOM đã bị thay đổi từ JS trước đó               │
│   → Browser phải recalculate layout (expensive!)        │
│                                                          │
│ Layout Thrashing xảy ra khi:                            │
│                                                          │
│ for (const el of elements) {                            │
│   const height = el.offsetHeight; // ← READ  (force reflow!) │
│   el.style.height = height * 2 + 'px'; // ← WRITE      │
│ }                                                        │
│                                                          │
│ Timeline:                                               │
│ Write → Read → REFLOW → Write → Read → REFLOW → ...     │
│ [████purple████][████purple████][████purple████]         │
│                                                          │
│ Fix: Tách read và write ra khỏi nhau:                   │
│ const heights = elements.map(el => el.offsetHeight); // READ all │
│ elements.forEach((el, i) => el.style.height = heights[i] * 2 + 'px'); // WRITE all │
│ → 1 REFLOW duy nhất thay vì N reflows                   │
└──────────────────────────────────────────────────────────┘
```

**Các layout properties gây forced reflow:**

```javascript
// ❌ Đọc các property này sau khi DOM đã thay đổi → forced reflow:
element.offsetHeight / offsetWidth / offsetTop / offsetLeft
element.scrollHeight / scrollWidth / scrollTop
element.clientHeight / clientWidth / clientTop
element.getBoundingClientRect()
element.getComputedStyle()
window.innerWidth / innerHeight
document.documentElement.clientWidth

// ✅ Batching với requestAnimationFrame:
requestAnimationFrame(() => {
  // Tất cả reads
  const heights = [...elements].map(el => el.offsetHeight);

  // Tất cả writes — trong cùng 1 frame
  elements.forEach((el, i) => {
    el.style.height = heights[i] + 'px';
  });
});
```

---

### Phát hiện 3: Render 82 tracks cùng lúc — cần List Virtualization

**Dấu hiệu:** Largest React render tốn **200ms** và render **82 component** track cùng lúc — dù user chỉ nhìn thấy ~10-15 tracks trong viewport.

```
Vấn đề: Render tất cả vs chỉ render visible:
┌─────────────────────────────────────────────────┐
│ Spotify playlist (82 tracks)                    │
│                                                 │
│ ┌──────────────────────────────────────────┐   │
│ │ Track 1  ← visible (in viewport)         │   │
│ │ Track 2  ← visible                       │   │  ← Render 10-15 tracks
│ │ Track 3  ← visible                       │   │
│ │ ...                                      │   │
│ │ Track 12 ← visible                       │   │
│ └──────────────────────────────────────────┘   │  ↑ viewport cutoff
│   Track 13 ← NOT visible (below fold)          │
│   Track 14 ← NOT visible                       │  ← Vẫn bị render!
│   ...                                           │
│   Track 82 ← NOT visible                       │  ← Vẫn bị render!
│                                                 │
│ ❌ React render 82 components = 200ms           │
│ ✅ Render 12 visible + 3 buffer = ~25ms         │
└─────────────────────────────────────────────────┘
```

**Fix: React Window / TanStack Virtual:**

```typescript
// ❌ Before: Render tất cả 82 tracks
function TrackList({ tracks }: { tracks: Track[] }) {
  return (
    <div>
      {tracks.map(track => (
        <TrackItem key={track.id} track={track} />
      ))}
    </div>
  );
}

// ✅ After: Chỉ render visible rows + buffer
import { FixedSizeList as List } from 'react-window';

function TrackList({ tracks }: { tracks: Track[] }) {
  return (
    <List
      height={500}          // viewport height
      itemCount={tracks.length}
      itemSize={56}         // height của mỗi track row
      width="100%"
      overscanCount={3}     // render thêm 3 items ngoài viewport làm buffer
    >
      {({ index, style }) => (
        <TrackItem
          key={tracks[index].id}
          track={tracks[index]}
          style={style}     // react-window inject absolute positioning
        />
      )}
    </List>
  );
}

// TanStack Virtual (headless, flexible hơn):
import { useVirtualizer } from '@tanstack/react-virtual';

function TrackList({ tracks }: { tracks: Track[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: tracks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 56,
    overscan: 3,
  });

  return (
    <div ref={parentRef} style={{ height: '500px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
        {virtualizer.getVirtualItems().map(virtualItem => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <TrackItem track={tracks[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Kết quả:** 82 tracks → 12-15 tracks rendered → render time giảm **từ 200ms xuống ~30ms (6×)**.

---

### Phát hiện 4: `formatDate` được gọi nhưng không hiển thị UI nào

**Dấu hiệu:** **5% total time** được dùng để gọi `formatDate` (từ `date-fns`) — nhưng nhìn vào UI không thấy date nào được hiển thị!

```
Flame chart pattern:
┌──────────────────────────────────────────────────┐
│ TrackItem render                                  │
│   └── formatDate(track.addedAt)  ← called!       │
│       └── date-fns internals...  ← 2-3ms/call   │
│                                                   │
│ × 82 tracks = 82 × 2ms = ~160ms wasted!          │
│ (5% của 440ms total = 22ms — bài estimate ~160ms)│
└──────────────────────────────────────────────────┘
```

**Nguyên nhân có thể:**
1. Component ẩn (invisible component vẫn được render)
2. Forgotten code — feature đã bị remove khỏi UI nhưng code vẫn còn
3. Developer build đang dùng debug mode

**Fix tùy theo tình huống:**

```typescript
// Nếu date không cần hiển thị → xóa luôn call:
// Trước:
const formattedDate = formatDate(track.addedAt, 'MMM dd, yyyy');
// Sau: Xóa dòng này nếu không dùng

// Nếu cần format date nhưng format đơn giản → dùng native APIs thay vì date-fns:
// date-fns: ~2-3ms/call (full internationalization support)
// Native: ~0.1ms/call
const date = new Date(track.addedAt);
const formatted = `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
// → 20-30× nhanh hơn cho format đơn giản

// Nếu cần format phức tạp nhưng values ít thay đổi → memoize:
const formattedDate = useMemo(
  () => formatDate(track.addedAt, 'MMM dd, yyyy'),
  [track.addedAt] // chỉ tính lại khi date thay đổi
);
```

---

### Phát hiện 5: `styled-components` với dynamic props — Bottleneck ẩn

**Dấu hiệu:** `generateAndInjectStyles()` xuất hiện trong flamechart với tần suất cao — đây là internal function của `styled-components`.

```
styled-components behavior với dynamic styles:

// Bình thường — styles được cache và tái sử dụng:
const Button = styled.button`
  background: blue;    ← static value
  color: white;
`;

// Mount 100 <Button /> → chỉ generate CSS 1 lần, cache lại → OK ✅

// VẤN ĐỀ — dynamic value từ props:
const TrackRow = styled.div`
  background-color: ${props => props.color};  ← dynamic!
`;

// Mount 82 <TrackRow color={track.accentColor} />:
// → Mỗi track có color khác nhau
// → styled-components generate 82 unique CSS classes!
// → 82 × generateAndInjectStyles() calls
// → 82 × CSS injection into <head>
// → Layout recalculation sau mỗi injection!
```

```
CSS injection overhead timeline:
<head>                          DOM
  <style id="sc-xxx">           │
    .sc-abc { bg: #e74c3c }     │  ← inject for track 1
    .sc-def { bg: #3498db }     │  ← inject for track 2
    .sc-ghi { bg: #2ecc71 }     │  ← inject for track 3
    ...                         │
    .sc-xyz { bg: #9b59b6 }     │  ← inject for track 82
  </style>                      │
                                ▼
                          Browser recomputes styles 82× !
```

**Fix: Dùng inline styles hoặc CSS custom properties cho dynamic values:**

```typescript
// ❌ Before: styled-components với dynamic prop → 82 CSS classes
const TrackRow = styled.div<{ $accentColor: string }>`
  background-color: ${props => props.$accentColor};
  border-left: 4px solid ${props => props.$accentColor};
`;

// ✅ Fix 1: Inline styles cho dynamic values (no CSS generation overhead)
function TrackItem({ track }: { track: Track }) {
  return (
    <div
      className={styles.trackRow}  // ← static styled từ CSS Module
      style={{
        backgroundColor: track.accentColor,  // ← dynamic via inline style
        borderLeftColor: track.accentColor,
      }}
    >
      {/* ... */}
    </div>
  );
}

// ✅ Fix 2: CSS Custom Properties (CSS variables) — 1 class, nhiều values
const TrackRow = styled.div`
  background-color: var(--accent-color);  ← static CSS class
  border-left: 4px solid var(--accent-color);
`;

function TrackItem({ track }: { track: Track }) {
  return (
    <TrackRow
      style={{ '--accent-color': track.accentColor } as React.CSSProperties}
    >
      {/* ... */}
    </TrackRow>
  );
}
// → 1 CSS class được generate và reuse
// → CSS variable thay đổi inline → không cần generate CSS mới
// → Không có layout thrashing từ CSS injection
```

**Rule of thumb với styled-components:**

```
✅ OK — static styles:
  styled.div`
    display: flex;
    align-items: center;
  `

✅ OK — từ một tập hữu hạn values (theme):
  styled.div`
    color: ${props => props.theme.colors.primary};
  `

❌ CẢNH BÁO — dynamic value từ runtime data:
  styled.div`
    background: ${props => props.color};  ← mỗi unique color = 1 CSS class mới
  `
  → Dùng inline styles hoặc CSS custom properties thay thế
```

---

### Phát hiện 6: Minified code = khó đọc trace

**Bài học thực tế:** Khi app đang production-minified, function names bị rút ngắn (`t.unstable_runWithPriority`, `a()`, `b()`...) — không thể biết function nào đang làm gì.

```
Flamechart với minified code:
┌──────────────────────────────────────────────────────────┐
│ a() [200ms]                                              │
│   └── b() [150ms]                                        │
│       └── c() [120ms]                                    │
│           └── d() [80ms]     ← Cái này là gì???         │
└──────────────────────────────────────────────────────────┘

Flamechart với source maps:
┌──────────────────────────────────────────────────────────┐
│ TrackList.render() [200ms]                               │
│   └── Track.render() [150ms]                             │
│       └── formatDate() [120ms]                           │
│           └── date-fns/format [80ms]  ← À! date-fns!    │
└──────────────────────────────────────────────────────────┘
```

**Setup Source Maps cho production debugging:**

```javascript
// webpack.config.js
module.exports = {
  // ✅ Option 1: Source maps chỉ cho nội bộ (không public)
  // Dùng khi có VPN/auth để protect source maps
  devtool: 'source-map', // Tạo .map files riêng biệt

  // ✅ Option 2: Hidden source maps (map files không được reference trong bundle)
  // Dev upload .map lên error tracking tool (Sentry, Datadog)
  devtool: 'hidden-source-map',

  // Sau đó upload source maps lên Sentry:
  // sentry-webpack-plugin tự động upload .map files
};
```

```bash
# Hoặc: Bật source maps tạm thời trong local build để profile
GENERATE_SOURCEMAP=true npm run build
# → Profile local build thay vì production
```

---

### Tổng kết: 6 Phát hiện từ 440ms Spotify trace

```
┌───────────────────────────────────────────────────────────────────┐
│ #  │ Phát hiện               │ Biểu hiện           │ Fix          │
├───────────────────────────────────────────────────────────────────┤
│ 1  │ Cascading Rerenders     │ Nhiều React renders │ Promise.all  │
│    │                         │ liên tiếp           │ + batch      │
├───────────────────────────────────────────────────────────────────┤
│ 2  │ Layout Thrashing        │ Violet blocks ~80ms │ Batch read/  │
│    │                         │ trong perf tab      │ write DOM    │
├───────────────────────────────────────────────────────────────────┤
│ 3  │ Render 82 tracks        │ 200ms React render  │ react-window │
│    │                         │ 1 component         │ / virtual    │
├───────────────────────────────────────────────────────────────────┤
│ 4  │ formatDate() ẩn         │ 5% time, no UI date │ Xóa code     │
│    │                         │                     │ / native API │
├───────────────────────────────────────────────────────────────────┤
│ 5  │ styled-components       │ generateAndInject   │ Inline styles│
│    │ dynamic props           │ 82× calls           │ / CSS vars   │
├───────────────────────────────────────────────────────────────────┤
│ 6  │ Minified = unreadable   │ a(), b(), c()...    │ Source maps  │
│    │                         │ không biết là gì    │ khi profile  │
└───────────────────────────────────────────────────────────────────┘

Timeline cải thiện ước tính:
BEFORE: 0ms ──────────────────────────────────────── 440ms
         │ Layout thrashing (80ms)                   │
         │ Cascading renders (3×)                    │
         │ 82 track renders (200ms)                  │
         │ styled-components gen (22ms)              │
         │ formatDate unnecessary (22ms)             │

AFTER (áp dụng tất cả fixes):
AFTER:  0ms ──────── ~80ms
         │ 1 render cycle                            │
         │ 12-15 virtual track renders (~30ms)       │
         │ CSS vars thay vì generated styles         │
         │ No layout thrashing                       │
         → ~5.5× nhanh hơn
```

---

### Bài học chính từ Spotify Case Study

**1. Nhận dạng React trong bất kỳ app nào**

```
Thấy t.unstable_runWithPriority trong flamechart = React đang chạy.
React có thể ẩn trong: Electron apps, React Native, PWAs, browser extensions...
Khi đã nhận dạng được → áp dụng tất cả React optimization techniques.
```

**2. Cascading Renders = nhiều promises resolve riêng biệt**

```
Pattern nhận biết: Nhiều khối React render liên tiếp trong flamechart
Nguyên nhân: Multiple setState trong các async callbacks khác nhau
Fix: Promise.all + 1 setState / React 18 auto-batching
```

**3. Violet blocks = Layout Thrashing — đọc rồi write DOM xen kẽ**

```
Nhận biết: Khối màu tím (purple/violet) dày đặc trong Performance tab
Nguyên nhân: Read layout property (offsetHeight...) sau khi write DOM
Fix: Batch tất cả reads trước, rồi batch tất cả writes sau
```

**4. styled-components + dynamic values = hidden perf trap**

```typescript
// ⚠️ Anti-pattern — unique CSS class cho mỗi unique value:
styled.div`color: ${props => props.color};`

// ✅ Thay bằng inline styles hoặc CSS custom properties
```

**5. Profiling minified code = khó → cần source maps hoặc profile dev build**

```
Không cần profile production bundle. Tái hiện vấn đề trong:
  → Dev build với source maps
  → Staging với source maps enabled
  → Local với production-like data
```


---

## Case Study thực tế: Polished Library — Tại sao Tree-shaking Không Hoạt Động

> **Nguồn:** [iamakulov.com/notes/polished-webpack](https://iamakulov.com/notes/polished-webpack/) — Ivan Akulov
>
> Case study này khác hoàn toàn — không phải về React renders, mà về **webpack Tree-shaking**. Bài viết điều tra tại sao import `{ opacify }` từ `polished` lại tạo ra bundle **lớn gấp đôi** so với import trực tiếp từ file, dù tree-shaking đã được bật.

### Vấn đề: Import khác nhau → Bundle size khác biệt gấp đôi

```
Hai cách import polished — kết quả khác nhau hoàn toàn:

// Cách 1: Named import từ package
import { opacify, transparentize } from 'polished';
→ Bundle size: 16 kB  ← TO HƠN!

// Cách 2: Import trực tiếp từ file
import opacify from 'polished/lib/color/opacify.js';
import transparentize from 'polished/lib/color/transparentize.js';
→ Bundle size: 9.86 kB  ← NHỎ HƠN!

❓ Câu hỏi: Tại sao Tree-shaking không hoạt động với Cách 1?
   (polished dùng ES modules, webpack tree-shaking đã bật, nhưng bundle vẫn to hơn gấp đôi!)
```

---

### Bước 1: Xác minh Entry Point — package.json `module` field

**Điều kiện tiên quyết để tree-shake:** webpack phải đọc file ES Module (có `export`), không phải CommonJS (có `module.exports`).

```json
// polished/package.json
{
  "name": "polished",
  "main": "lib/index.js",         // ← CommonJS (không tree-shakeable)
  "module": "dist/polished.es.js", // ← ES Module (tree-shakeable)
}
```

```
webpack ưu tiên "module" hơn "main":
import { opacify } from 'polished'
  → webpack đọc package.json
  → tìm "module" field → dist/polished.es.js
  → dist/polished.es.js có ES export → OK ✅

Vậy entry point không phải vấn đề.
Vấn đề phải ở chỗ khác...
```

---

### Bước 2: So sánh hai bundles để tìm "dead code" còn sót lại

**Phương pháp debug:**

```bash
# Tạo test project để so sánh hai bundles
mkdir polished-test && cd polished-test
npm init -y && npm install polished webpack

# index-import-package.js
# import { opacify, transparentize } from 'polished';
# console.log(opacify, transparentize);

# index-import-files.js
# import opacify from 'polished/lib/color/opacify.js';
# import transparentize from 'polished/lib/color/transparentize.js';
# console.log(opacify, transparentize);

# webpack.config.js với UglifyJS beautify=true (dễ đọc bundle)
# → Build và so sánh 2 bundles
```

```
Kết quả ban đầu:
bundle-import-package.js  → 16 kB
bundle-import-files.js    → 9.86 kB

Diffing 2 bundles → bundle-import-package.js có thêm:

// bundle-import-package.js (phần thừa)
function desaturate(amount, color) {
    // ...
}
curry(desaturate);  // ← function này không được dùng!

function lighten(amount, color) {
    // ...
}
curry(lighten);     // ← function này cũng không được dùng!
```

---

### Root Cause: `curry()` Wrapper Ngăn Tree-shaking

**Đây là cốt lõi của vấn đề:**

```
Polished source code (trước khi build):
┌────────────────────────────────────────────────────────────┐
│ // polished/src/color/opacify.js                          │
│ function opacify(amount, color) { ... }                   │
│ export default curry(opacify);   ← export là curry call  │
│                                                            │
│ // polished/src/color/desaturate.js                       │
│ function desaturate(amount, color) { ... }                │
│ export default curry(desaturate); ← tương tự             │
│                                                            │
│ // polished/src/color/lighten.js                          │
│ function lighten(amount, color) { ... }                   │
│ export default curry(lighten);   ← tương tự              │
└────────────────────────────────────────────────────────────┘

Sau khi Rollup build thành polished.es.js:
┌────────────────────────────────────────────────────────────┐
│ function opacify(amount, color) { ... }                   │
│ var opacify$1 = curry(opacify);    ← biến, có export      │
│                                                            │
│ function desaturate(amount, color) { ... }                │
│ var desaturate$1 = curry(desaturate); ← biến, KHÔNG export│
│                                                            │
│ function lighten(amount, color) { ... }                   │
│ var lighten$1 = curry(lighten);   ← biến, KHÔNG export    │
│                                                            │
│ export { opacify$1 as opacify, ... };                     │
└────────────────────────────────────────────────────────────┘
```

**Tại sao webpack KHÔNG thể xóa `curry(desaturate)` và `curry(lighten)`:**

```
Webpack Tree-shaking logic:
┌────────────────────────────────────────────────────────────┐
│ Webpack thấy: var desaturate$1 = curry(desaturate)        │
│                                                            │
│ Webpack nghĩ:                                              │
│   "desaturate$1 không được export → có thể xóa variable"  │
│   "Nhưng curry(desaturate) là function CALL"              │
│   "Function call có thể có SIDE EFFECTS!"                  │
│   "Nếu tôi xóa curry(desaturate), app có thể bị break"   │
│   "→ TÔI PHẢI GIỮ LẠI curry(desaturate) call này"        │
│                                                            │
│ Kết quả:                                                   │
│   var desaturate$1 = curry(desaturate); ĐƯỢC GIỮ          │
│   function desaturate() ĐƯỢC GIỮ (vì được pass vào curry)│
│   → Dead code ở lại trong bundle!                         │
└────────────────────────────────────────────────────────────┘

So sánh với import trực tiếp từ file (không có vấn đề):
import opacify from 'polished/lib/color/opacify.js';
→ Mỗi file chỉ export code của chính nó
→ desaturate.js và lighten.js không được import → không có trong bundle
→ Bundle size nhỏ hơn ✅
```

---

### Giải pháp: `/*#__PURE__*/` Annotation

**`/*#__PURE__*/`** là một annotation đặc biệt để nói với minifiers (UglifyJS, Terser) rằng function call này **không có side effects** — an toàn để xóa nếu kết quả không được dùng.

```javascript
// ❌ Before: curry() call không có annotation
// → webpack/UglifyJS không thể xóa kể cả khi không dùng
export default curry(lighten);
// Sau khi Rollup build:
var lighten$1 = curry(lighten);  // ← giữ lại vì "có thể có side effects"
```

```javascript
// ✅ After: Thêm /*#__PURE__*/ annotation
// → UglifyJS biết rằng curry() call này pure, safe to remove
const curriedLighten = /*#__PURE__*/ curry(lighten);
export default curriedLighten;
// Sau khi Rollup build:
var lighten$1 = /*#__PURE__*/ curry(lighten);
// UglifyJS: "lighten$1 không được export, curry() là pure → XÓA!"
```

```
Cơ chế hoạt động của /*#__PURE__*/:
┌────────────────────────────────────────────────────────────┐
│ KHÔNG có annotation:                                       │
│   var x = someFunction();                                  │
│   UglifyJS: "someFunction() có thể có side effects"        │
│   UglifyJS: "Phải giữ lại call này dù x không được dùng"  │
│   → KEPT IN BUNDLE                                         │
│                                                            │
│ CÓ annotation:                                             │
│   var x = /*#__PURE__*/ someFunction();                   │
│   UglifyJS: "someFunction() được đánh dấu là PURE"        │
│   UglifyJS: "x không được dùng, và call là pure"          │
│   UglifyJS: "→ AN TOÀN ĐỂ XÓA toàn bộ statement này"     │
│   → REMOVED FROM BUNDLE ✅                                 │
└────────────────────────────────────────────────────────────┘
```

**Áp dụng vào polished library:**

```javascript
// polished/src/color/lighten.js — TRƯỚC
function lighten(amount, color) {
  // ...
}
export default curry(lighten);

// polished/src/color/lighten.js — SAU
function lighten(amount, color) {
  // ...
}
const curriedLighten = /*#__PURE__*/ curry(lighten);
export default curriedLighten;

// Tương tự cho desaturate, darken, và tất cả các functions khác...
```

**Kết quả sau khi thêm `/*#__PURE__*/`:**

```
TRƯỚC:
  bundle-import-package.js  → 16 kB
  bundle-import-files.js    → 9.86 kB

SAU (chỉ fix curry):
  bundle-import-package.js  → 11.8 kB  (giảm 4.2KB)
  bundle-import-files.js    → 9.86 kB

SAU (fix thêm em.js, rem.js, normalize.js):
  bundle-import-package.js  → 7.76 kB  (nhỏ hơn cả import-files!)
  bundle-import-files.js    → 9.87 kB

→ Cuối cùng: import { opacify } từ package CÒN NHỎ HƠN import từ file riêng!
  Vì flat bundle của Rollup không có webpack module wrapper overhead.
```

---

### Các vấn đề khác được phát hiện (normalize.js)

**Vấn đề 3:** Trong `normalize.js`, có 2 global objects dùng **computed property keys** — khi Babel compile, nó transform thành `defineProperty()` calls → không tree-shakeable.

```javascript
// polished/src/mixins/normalize.js — TRƯỚC
// (code ở module scope, không trong function)
const normalizeStyles = {
  ['html']: {         // ← computed property key
    fontSize: '100%',
    lineHeight: '1.15',
  }
};

// Sau khi Babel compile:
var _normalizeStyles;
var normalizeStyles = (_normalizeStyles = {},
  _defineProperty(_normalizeStyles, 'html', { ... }),  // ← side effect!
  _normalizeStyles
);
// → UglifyJS không thể xóa _defineProperty() calls
```

```javascript
// ✅ Fix Option 1: Move vào trong function (chỉ tạo khi function được gọi)
function normalize() {
  const styles = {
    'html': { fontSize: '100%' }  // ← string literal key, không cần defineProperty
  };
  return styles;
}

// ✅ Fix Option 2: Dùng string keys thay vì computed keys
const normalizeStyles = {
  'html': { fontSize: '100%' }  // ← không cần Babel transform
};
```

---

### Tổng kết: Checklist Tree-shaking

```
Tree-shaking Checklist cho libraries:
┌─────────────────────────────────────────────────────────────────┐
│ ✅ 1. package.json có "module" field trỏ đến ES Module file     │
│                                                                 │
│ ✅ 2. Không có top-level side effects (function calls, DOM      │
│       manipulation, global variable mutations...)               │
│                                                                 │
│ ✅ 3. Các function calls ở module scope được đánh dấu          │
│       /*#__PURE__*/ nếu chúng thực sự pure                    │
│                                                                 │
│ ✅ 4. Không dùng computed property keys ở module scope          │
│       (Babel biến chúng thành _defineProperty() side effects)  │
│                                                                 │
│ ✅ 5. Nếu dùng Babel, bật "sideEffects: false" trong           │
│       package.json nếu toàn bộ library là pure                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### Bài học áp dụng cho project của bạn

**1. Kiểm tra thư viện bạn đang dùng có tree-shakeable không:**

```bash
# Dùng webpack-bundle-analyzer để xem bundle composition
npm install --save-dev webpack-bundle-analyzer

# webpack.config.js
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
module.exports = {
  plugins: [new BundleAnalyzerPlugin()],
};
# → Mở browser, xem file nào chiếm nhiều space nhất
```

**2. Tìm dấu hiệu tree-shaking không hoạt động:**

```javascript
// Nếu bạn import ít nhưng bundle vẫn lớn → tree-shaking đang fail
// Kiểm tra: library có "module" field trong package.json không?
// Xem: https://bundlephobia.com/package/[tên-thư-viện]

// So sánh:
import { debounce } from 'lodash';        // ❌ lodash không tree-shakeable → 70KB!
import debounce from 'lodash/debounce';   // ✅ chỉ lấy 1 function → ~2KB
import { debounce } from 'lodash-es';    // ✅ lodash-es là ES Module → tree-shakeable
```

**3. Thêm `sideEffects: false` vào package.json của library/app:**

```json
// package.json của library
{
  "name": "my-component-library",
  "module": "dist/index.es.js",
  "sideEffects": false,
  // Hoặc liệt kê cụ thể các files CÓ side effects:
  // "sideEffects": ["./src/styles/global.css", "./src/polyfills.js"]
}
```

**4. Khi viết utilities/helpers, đánh dấu pure functions:**

```javascript
// Khi export function được wrap bởi higher-order function:

// ❌ Tree-shaking có thể fail:
export const memoizedFetch = memoize(fetchData);

// ✅ Đánh dấu rõ ràng là pure:
export const memoizedFetch = /*#__PURE__*/ memoize(fetchData);
// → UglifyJS/Terser sẽ drop nếu memoizedFetch không được import
```

```
Kết quả từ case study Polished:
┌──────────────────────────────────────────────────────────────┐
│ Approach               │ Bundle Size │ Notes                │
├──────────────────────────────────────────────────────────────┤
│ import từ package      │ 16 kB       │ Trước fix            │
│ import từ file riêng   │ 9.86 kB     │ Workaround           │
│ import từ package      │ 11.8 kB     │ Sau fix curry        │
│ (+ /*#__PURE__*/)      │             │                      │
│ import từ package      │ 7.76 kB     │ Sau tất cả fixes     │
│ (+ tất cả fixes)       │             │ → NHỎ HƠN cả workaround! │
└──────────────────────────────────────────────────────────────┘

Bài học lớn: Flat bundle (Rollup) + /*#__PURE__*/ + ES Module
= Bundle nhỏ hơn cả khi import từng file riêng lẻ,
  vì không có webpack module wrapper overhead.
```


---

## Case Study thực tế: Framer — AVIF Images và `stale-while-revalidate` CDN Strategy

> **Nguồn:** [framer.com/blog/introducing-avif-support](https://www.framer.com/blog/introducing-avif-support/) — Framer Engineering Team
>
> Case study này tập trung vào **Image Optimization** — không phải về React, mà về chiến lược chuyển đổi format ảnh từ WebP sang AVIF mà **không làm chậm** trải nghiệm người dùng ngay cả ở lần request đầu tiên (cache miss). Đây là bài học về HTTP Caching và CDN strategy cho production systems.

### Bối cảnh: Tại sao AVIF quan trọng?

```
So sánh Image Formats cho Web:
┌───────────────────────────────────────────────────────────┐
│ Format │ Compression │ Quality │ Browser Support │ Speed  │
├───────────────────────────────────────────────────────────┤
│ JPEG   │ Trung bình  │ OK      │ 100%            │ Nhanh  │
│ WebP   │ Tốt hơn 25% │ Tốt     │ ~95%            │ Nhanh  │
│ AVIF   │ Tốt hơn 50% │ Xuất sắc│ ~90%            │ Chậm!  │
│        │ so với JPEG │         │ (modern browsers)│       │
└───────────────────────────────────────────────────────────┘

Encode speed comparison (same image, same quality):
  WebP:  100–300ms  ← nhanh
  AVIF:  1,000–2,000ms ← chậm hơn 5-10×!

Tại sao vẫn muốn dùng AVIF:
  → File size nhỏ hơn WebP ~20-50%
  → Bandwidth giảm → load nhanh hơn cho end user
  → Đặc biệt quan trọng với mobile users (slow network)
```

---

### Vấn đề: On-Demand Encoding AVIF sẽ block first request

**Framer's image pipeline (trước khi có AVIF):**

```
Request flow cho image — WebP model:
User browser                 CDN Edge              Framer Server
     │                           │                       │
     │ GET /image.jpg?format=webp │                       │
     ├──────────────────────────►│                       │
     │                           │ MISS (first request)  │
     │                           ├──────────────────────►│
     │                           │   Encode to WebP      │
     │                           │   (~150ms)            │
     │                           │◄──────────────────────┤
     │   WebP image (150ms)      │                       │
     │◄──────────────────────────┤                       │
     │                           │ Cache WebP            │
     │                           │ max-age=31536000      │
     │                           │                       │
Second request:
     │ GET /image.jpg?format=webp │                       │
     ├──────────────────────────►│                       │
     │   WebP image (5ms)        │  HIT — serve from cache│
     │◄──────────────────────────┤                       │
```

**Vấn đề nếu áp dụng cùng pattern cho AVIF:**

```
Naive AVIF approach (BAD):
User browser                 CDN Edge              Framer Server
     │                           │                       │
     │ GET /image.jpg?format=avif │                       │
     ├──────────────────────────►│                       │
     │                           │ MISS (first request)  │
     │                           ├──────────────────────►│
     │                           │   Encode to AVIF      │
     │                           │   (1,000–2,000ms!!)   │
     │                           │                       │
     │                           │◄──────────────────────┤
     │   AVIF image (2,000ms!!)  │                       │
     │◄──────────────────────────┤                       │
                ↑
        User phải chờ 2 giây cho ảnh đầu tiên!
        Đây là "cold start" problem của AVIF encoding
```

---

### Giải pháp: `stale-while-revalidate` — Serve ngay, optimize sau

**Insight quan trọng:** HTTP Cache-Control có directive `stale-while-revalidate` cho phép CDN **serve cached version cũ** trong khi **fetch/generate version mới ở background**.

```
HTTP Cache-Control directives:
┌────────────────────────────────────────────────────────────┐
│ max-age=N                                                  │
│   → Resource fresh trong N seconds                        │
│   → Sau N seconds: resource "stale" (hết hạn)             │
│                                                            │
│ stale-while-revalidate=M                                  │
│   → Khi resource đã stale: serve stale version NGAY       │
│   → Đồng thời: fetch fresh version ở BACKGROUND           │
│   → Trong vòng M seconds sau khi stale                    │
│                                                            │
│ Kết hợp:                                                   │
│   max-age=0, stale-while-revalidate=31536000              │
│   → Resource stale NGAY LẬP TỨC (max-age=0)              │
│   → Nhưng vẫn được serve trong 1 năm (SWR=31536000)      │
│   → Background: CDN lấy fresh version từ origin           │
└────────────────────────────────────────────────────────────┘
```

**Framer's actual AVIF strategy:**

```
Framer AVIF Loading Strategy — Request #1 (Cache Miss):
User browser                 CDN Edge              Framer Server
     │                           │                       │
     │  GET /img?format=avif     │                       │
     ├──────────────────────────►│                       │
     │                           │ MISS                  │
     │                           ├──────────────────────►│
     │                           │  "Give me AVIF"       │
     │                           │                       │
     │                           │  ← Framer: "AVIF takes│
     │                           │    2s. Here's WebP    │
     │                           │    instantly + SWR    │
     │                           │    header"            │
     │                           │◄──────────────────────┤
     │                           │  Response:            │
     │                           │  WebP image           │
     │                           │  Cache-Control:       │
     │                           │  max-age=0,           │
     │                           │  stale-while-         │
     │                           │  revalidate=31536000  │
     │                           │                       │
     │  WebP image (fast! ~150ms)│                       │
     │◄──────────────────────────┤                       │
     │                           │ CDN stores WebP       │
     │                           │ Marks as STALE        │
     │                           │ immediately           │

Framer AVIF Loading Strategy — Request #2 (Background Revalidation):
     │                           │                       │
     │  (Next user visits page)  │                       │
     │  GET /img?format=avif     │                       │
     ├──────────────────────────►│                       │
     │                           │ HIT but STALE         │
     │  WebP image (from cache,  │                       │
     │  instant! ~5ms)           │                       │
     │◄──────────────────────────┤                       │
     │                           │ Background: revalidate│
     │                           ├──────────────────────►│
     │                           │  "Give me AVIF"       │
     │                           │  (takes 1-2s)         │
     │                           │◄──────────────────────┤
     │                           │  AVIF image           │
     │                           │  Cache-Control:       │
     │                           │  max-age=31536000     │
     │                           │  (long cache!)        │
     │                           │ CDN stores AVIF       │

Framer AVIF Loading Strategy — Request #3+ (AVIF Served):
     │  GET /img?format=avif     │                       │
     ├──────────────────────────►│                       │
     │                           │ HIT, FRESH            │
     │  AVIF image (tiny! ~5ms)  │                       │
     │◄──────────────────────────┤                       │
     │  (20-50% nhỏ hơn WebP!) ✅│                       │
```

---

### Cơ chế `stale-while-revalidate` — Deep Dive

```
Cache State Machine:
                    ┌─────────────────────────────────┐
                    │  max-age=0, swr=31536000         │
                    └────────────────┬────────────────┘
                                     │
              ┌──────────────────────▼──────────────────────┐
              │             Resource Stored                  │
              │                                              │
              │  FRESH:  0s (immediate stale với max-age=0) │
              │  STALE:  0s → 31536000s (vẫn serve được)   │
              │  EXPIRED: sau 31536000s (không serve nữa)   │
              └──────────────────────────────────────────────┘

Mỗi request trong giai đoạn STALE:
  User ← [Cached version (WebP)] ← CDN  (ngay lập tức)
                                    ↓ background
                                   Server (encode AVIF, 1-2s)
                                    ↓
                                   CDN stores AVIF

Sau khi AVIF ready:
  User ← [AVIF version] ← CDN  (ngay lập tức, nhỏ hơn 50%)
```

**HTTP Header thực tế:**

```http
# Response header khi serve WebP (cache miss, lần đầu)
HTTP/2 200 OK
Content-Type: image/webp
Cache-Control: max-age=0, stale-while-revalidate=31536000
Vary: Accept                    ← quan trọng: browser gửi Accept header
                                   để CDN biết serve AVIF hay WebP

# Response header khi serve AVIF (sau khi đã được encode)
HTTP/2 200 OK
Content-Type: image/avif
Cache-Control: max-age=31536000, immutable
Vary: Accept
```

**`Vary: Accept` header — tại sao cần thiết:**

```
Browser gửi Accept header để nói format nào được support:

Chrome:
  Accept: image/avif,image/webp,image/apng,image/*,*/*;q=0.8

Safari (cũ, không support AVIF):
  Accept: image/webp,image/png,image/svg+xml,image/*;*/*;q=0.8

CDN dùng Accept header để:
  1. Quyết định serve AVIF hay WebP cho mỗi browser
  2. Cache riêng biệt cho mỗi Accept value (nhờ Vary: Accept)
  → Chrome nhận AVIF, Safari nhận WebP từ cùng 1 URL!
```

---

### Exceptions — Khi nào KHÔNG dùng AVIF

```
Framer vẫn dùng WebP trong 2 trường hợp:
┌─────────────────────────────────────────────────────────┐
│ 1. Lossless images (PNG, screenshots, graphics)         │
│    AVIF lossless: to hơn WebP lossless                  │
│    WebP lossless: nhỏ hơn và chất lượng tốt hơn        │
│    → Serve WebP cho lossless images                     │
│                                                         │
│ 2. Animated images (GIF → animated WebP/AVIF)           │
│    Library limitation: animated AVIF chưa stable        │
│    → Serve animated WebP thay vì animated AVIF          │
└─────────────────────────────────────────────────────────┘

Decision Tree:
Image upload
  │
  ├── Animated? ──► WebP (animated)
  │
  ├── Lossless? ──► WebP (lossless)
  │
  └── Normal photo/graphic?
         │
         ├── Browser supports AVIF? ──► AVIF (20-50% nhỏ hơn)
         │
         └── Browser không support? ──► WebP
```

---

### Áp dụng vào project của bạn

**1. Serve modern image formats với `<picture>` element:**

```html
<!-- ✅ Responsive format selection — browser tự chọn format tốt nhất -->
<picture>
  <!-- AVIF cho browsers hỗ trợ -->
  <source
    srcset="image.avif"
    type="image/avif"
  />
  <!-- WebP fallback -->
  <source
    srcset="image.webp"
    type="image/webp"
  />
  <!-- JPEG/PNG ultimate fallback -->
  <img
    src="image.jpg"
    alt="Product photo"
    loading="lazy"
    decoding="async"
  />
</picture>
```

**2. Next.js Image component (tự động handle AVIF):**

```typescript
// Next.js tự động convert và serve AVIF/WebP
import Image from 'next/image';

function ProductCard({ product }) {
  return (
    <Image
      src={product.imageUrl}
      alt={product.name}
      width={400}
      height={300}
      // Next.js tự động:
      // - Resize theo width/height
      // - Convert sang AVIF (nếu browser support)
      // - Fallback sang WebP
      // - Lazy load
      // - Blur placeholder
    />
  );
}

// next.config.js — configure AVIF quality
module.exports = {
  images: {
    formats: ['image/avif', 'image/webp'],
    // AVIF thường cần quality cao hơn vì compression algorithm khác
    quality: 75,
  },
};
```

**3. Implement `stale-while-revalidate` trong image CDN/API:**

```typescript
// Express/Node.js server — image optimization endpoint
app.get('/api/images/:id', async (req, res) => {
  const { format = 'webp' } = req.query;
  const imageId = req.params.id;

  // Check nếu AVIF version đã được cached
  const avifCached = await cache.get(`${imageId}:avif`);

  if (format === 'avif' && !avifCached) {
    // AVIF chưa ready → serve WebP ngay + trigger AVIF generation
    const webpBuffer = await getOrGenerateWebP(imageId);

    // Serve WebP immediately với stale-while-revalidate
    res.set({
      'Content-Type': 'image/webp',
      'Cache-Control': 'max-age=0, stale-while-revalidate=31536000',
      'Vary': 'Accept',
    });
    res.send(webpBuffer);

    // Generate AVIF in background (không block response)
    setImmediate(async () => {
      try {
        const avifBuffer = await convertToAvif(imageId); // 1-2s
        await cache.set(`${imageId}:avif`, avifBuffer, { ttl: Infinity });
      } catch (err) {
        console.error('AVIF generation failed:', err);
      }
    });
    return;
  }

  if (format === 'avif' && avifCached) {
    // AVIF đã ready → serve từ cache với long max-age
    res.set({
      'Content-Type': 'image/avif',
      'Cache-Control': 'max-age=31536000, immutable',
      'Vary': 'Accept',
    });
    res.send(avifCached);
    return;
  }

  // WebP request
  const webpBuffer = await getOrGenerateWebP(imageId);
  res.set({
    'Content-Type': 'image/webp',
    'Cache-Control': 'max-age=31536000, immutable',
  });
  res.send(webpBuffer);
});
```

**4. Đo lường kết quả với Lighthouse/WebPageTest:**

```
Metrics để track sau khi implement AVIF:
┌────────────────────────────────────────────────────────────┐
│ Metric              │ Expected Impact                      │
├────────────────────────────────────────────────────────────┤
│ Total Image Bytes   │ -20-50% (vs WebP)                    │
│ LCP (image)         │ Giảm nếu LCP element là ảnh         │
│ Total Page Weight   │ -10-30% nếu images chiếm nhiều      │
│ Bandwidth cost      │ -20-50% → tiết kiệm tiền CDN        │
│ Time to Load        │ Giảm tương ứng bandwidth tiết kiệm  │
└────────────────────────────────────────────────────────────┘

Tools để so sánh:
  Squoosh.app: Upload ảnh, compare JPEG vs WebP vs AVIF
  Lighthouse: Opportunities → "Use modern image formats"
  WebPageTest: Waterfall → xem Content-Type của ảnh
  Chrome DevTools → Network → filter "img" → xem size
```

---

### Tổng kết: Image Optimization Strategy

```
Recommended Image Strategy cho Production React App:
┌────────────────────────────────────────────────────────────┐
│ Format Selection:                                          │
│   Photo/hero image → AVIF (primary) + WebP (fallback)     │
│   Screenshots/graphics → WebP lossless                    │
│   Animated → WebP animated (AVIF animated unstable)       │
│   SVG icons/logos → SVG (vector, scalable, tiny)          │
│                                                            │
│ CDN Caching Strategy:                                      │
│   Cache miss (AVIF not ready):                            │
│     Cache-Control: max-age=0, stale-while-revalidate=...  │
│     Serve: WebP (fast) + Generate AVIF background         │
│   Cache hit (AVIF ready):                                 │
│     Cache-Control: max-age=31536000, immutable            │
│     Serve: AVIF (optimal size)                            │
│                                                            │
│ Implementation Options:                                    │
│   Next.js: Image component (built-in AVIF support)        │
│   Cloudinary: f_auto,q_auto parameter                     │
│   Cloudflare Images: automatic format selection           │
│   Custom: sharp library + stale-while-revalidate header   │
│                                                            │
│ Expected Results:                                          │
│   Image size: -20-50% vs JPEG                             │
│   First user: WebP (fast), subsequent: AVIF (optimal)     │
│   Zero UX degradation from encoding latency               │
└────────────────────────────────────────────────────────────┘

Bài học lớn: Đừng chờ AVIF encode xong mới serve.
  → Serve WebP ngay với stale-while-revalidate
  → Generate AVIF ở background
  → CDN tự động upgrade sang AVIF cho requests tiếp theo
  = 0 latency penalty + 20-50% bandwidth savings
```


---

## Web Performance 101: Toàn cảnh Tối ưu Web App

> **Nguồn:** [3perf.com/talks/web-perf-101](https://3perf.com/talks/web-perf-101/) — Ivan Akulov (PerfPerfPerf)
>
> Bài talk ~90 slides này là một **mental model đầy đủ** về web performance — từ JS, CSS, Images, Fonts đến HTTP Caching và Networking. Không phải một case study đơn lẻ, mà là **framework tư duy** để tiếp cận bất kỳ vấn đề performance nào một cách có hệ thống.

### Bức tranh toàn cảnh: Tại sao performance quan trọng?

```
Business Impact của Performance:
┌────────────────────────────────────────────────────────────┐
│ +1s load time   → -7% conversion rate (Akamai)            │
│ 100ms delay     → -1% revenue (Amazon)                    │
│ 53% users       → abandon site nếu load > 3s (Google)     │
│ Slow site       → thứ hạng SEO thấp hơn (Google ranking)  │
└────────────────────────────────────────────────────────────┘

5 Categories cần optimize:
  1. JavaScript   → Giảm, trì hoãn, split JS
  2. CSS          → Inline critical CSS, defer non-critical
  3. Images       → Đúng format, đúng size, lazy load
  4. Fonts        → font-display, fallback fonts
  5. Networking   → Gzip, HTTP/2, Caching, CDN
```

---

### Part 1: JavaScript Optimization

#### 1.1 Chi phí thực sự của JavaScript

```
JavaScript lifecycle — mỗi bước đều tốn thời gian:
┌──────────────────────────────────────────────────────────────┐
│  Download           Parse          Compile        Execute    │
│  ──────────         ──────────     ──────────     ────────── │
│  Phụ thuộc          CPU cost       CPU cost       CPU cost   │
│  network            Mobile: 3-4x   Có thể cache   Business   │
│                     chậm hơn       V8 bytecode    logic runs │
│                     desktop!                                  │
└──────────────────────────────────────────────────────────────┘

Rule of thumb:
  200KB JS (gzipped) = ~1MB JS to parse/compile on device
  Mobile (Moto G4): 3-4× chậm hơn MacBook Pro để process JS
```

#### 1.2 Minification — Bước tối thiểu bắt buộc

```javascript
// Before minification:
function calculateTax(price, taxRate) {
  const TAX_MULTIPLIER = taxRate / 100;
  const taxAmount = price * TAX_MULTIPLIER;
  return taxAmount;
}
// 130 bytes

// After minification (Terser/UglifyJS):
function c(a,b){return a*(b/100)}
// 33 bytes — giảm 75%!

// webpack config:
module.exports = {
  mode: 'production', // ← tự động bật Terser
  // Hoặc explicit:
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin({
      terserOptions: {
        compress: {
          drop_console: true, // Xóa console.log trong production
        },
      },
    })],
  },
};
```

#### 1.3 Code Splitting — Chỉ tải code cần thiết

```
Vấn đề: Single bundle lớn — tất cả code load upfront
Giải pháp: Split thành nhiều chunks nhỏ — chỉ load khi cần

Bundle Strategy:
┌────────────────────────────────────────────────────────────┐
│ main.js          → Core app code (luôn cần)               │
│ vendors.js       → React, lodash... (ít thay đổi)         │
│ dashboard.chunk  → Dashboard page (lazy load)             │
│ settings.chunk   → Settings page (lazy load)              │
│ admin.chunk      → Admin panel (lazy load)                 │
└────────────────────────────────────────────────────────────┘

React implementation:
```

```javascript
// Route-based code splitting
import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Settings  = lazy(() => import('./pages/Settings'));
const Admin     = lazy(() => import('./pages/Admin'));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/"          element={<HomePage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/settings"  element={<Settings />} />
          <Route path="/admin"     element={<Admin />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
```

#### 1.4 Tree Shaking — Loại bỏ dead code

```javascript
// ✅ Named exports → Tree-shakeable
export function formatDate(date) { ... }
export function formatCurrency(amount) { ... }

// Chỉ import cái cần → formatCurrency không vào bundle
import { formatDate } from './utils';

// ❌ Default export object → Không tree-shakeable
export default {
  formatDate: (date) => { ... },
  formatCurrency: (amount) => { ... },
};
// → Cả 2 functions đều vào bundle dù chỉ dùng 1!

// ❌ lodash CommonJS → Không tree-shakeable (70KB!)
import { debounce } from 'lodash';

// ✅ lodash-es → Tree-shakeable
import { debounce } from 'lodash-es';
// Hoặc:
import debounce from 'lodash/debounce'; // ~2KB
```

#### 1.5 Defer và Async Script Loading

```html
<!-- ❌ Blocking: HTML parse dừng lại để tải và chạy JS -->
<script src="app.js"></script>

<!-- ✅ async: Download song song, execute ngay khi xong -->
<script src="analytics.js" async></script>
<!-- Dùng cho scripts không phụ thuộc nhau và không cần DOM -->

<!-- ✅ defer: Download song song, execute sau khi HTML parse xong -->
<script src="app.js" defer></script>
<!-- Dùng cho main app scripts — thứ tự execute được đảm bảo -->

<!-- Timeline so sánh: -->
<!--
Normal:  HTML ──[STOP]──── JS Load+Execute ──── resume HTML ──►
async:   HTML ─────────────────────────── HTML  [JS Execute] ──►
               [JS download ──────────────────►]
defer:   HTML ──────────────────────────[done] [JS Execute] ──►
               [JS download ──────────────►]
-->
```

---

### Part 2: CSS Optimization

#### 2.1 Critical CSS — Inline để tránh render-blocking

```
Render-blocking problem:
┌────────────────────────────────────────────────────────────┐
│ Browser parses HTML                                        │
│   → Finds <link rel="stylesheet" href="styles.css">       │
│   → STOPS rendering                                        │
│   → Downloads styles.css                                   │
│   → Parses CSS                                             │
│   → Resumes rendering                                      │
│   → User sees content                                      │
│                                                            │
│ Result: User thấy BLANK SCREEN trong suốt thời gian       │
│ download CSS (có thể 1-3s trên slow 3G)                   │
└────────────────────────────────────────────────────────────┘
```

```html
<!-- ✅ Critical CSS Inlining Pattern -->
<head>
  <!-- 1. Inline CSS cho above-the-fold content (hero, nav, header) -->
  <style>
    /* critical.css — CSS tối thiểu để render màn hình đầu tiên */
    body { margin: 0; font-family: sans-serif; }
    .nav { display: flex; background: #333; }
    .hero { min-height: 100vh; display: flex; }
    /* ... ~10-20KB CSS tối thiểu ... */
  </style>

  <!-- 2. Load non-critical CSS async (không block render) -->
  <link
    rel="preload"
    href="styles.css"
    as="style"
    onload="this.onload=null;this.rel='stylesheet'"
  />
  <!-- Fallback cho browsers không support preload -->
  <noscript>
    <link rel="stylesheet" href="styles.css" />
  </noscript>
</head>
```

```javascript
// Tool: critical npm package — tự động extract critical CSS
// install: npm install critical --save-dev

const critical = require('critical');
critical.generate({
  src: 'index.html',
  dest: 'index-critical.html',
  width: 1300,
  height: 900,
  inline: true, // Inline critical CSS vào HTML
});
```

#### 2.2 Remove Unused CSS

```bash
# PurgeCSS — loại bỏ CSS không dùng
npm install @fullhuman/postcss-purgecss --save-dev
```

```javascript
// postcss.config.js
module.exports = {
  plugins: [
    require('@fullhuman/postcss-purgecss')({
      content: [
        './src/**/*.html',
        './src/**/*.jsx',
        './src/**/*.tsx',
      ],
      defaultExtractor: content =>
        content.match(/[\w-/:]+(?<!:)/g) || [],
      safelist: [
        /^active/,    // Giữ classes dynamic (thêm bởi JS)
        /^is-/,
        /^has-/,
      ],
    }),
  ],
};

// Kết quả điển hình:
//   Bootstrap đầy đủ: ~180KB → Sau PurgeCSS: ~15KB (92% giảm!)
//   Tailwind đầy đủ: ~3MB   → Sau PurgeCSS: ~10KB (99% giảm!)
```

---

### Part 3: Image Optimization

#### 3.1 Chọn đúng format

```
Image Format Decision Tree:
                    Upload image
                         │
         ┌───────────────┴──────────────────┐
         ▼                                   ▼
     Vector?                          Raster (photo)?
    (Logo, icon)                             │
         │               ┌──────────────────┼───────────────┐
         ▼               ▼                  ▼               ▼
       SVG           Photo?           Screenshot?      Animation?
                         │            (UI, text)          │
                         │                │               ▼
                         ▼                ▼           GIF → WebP
                       AVIF           PNG/WebP        animated
                       WebP           lossless
                       JPEG
                    (by browser support)

Size comparison (same quality, 1000×667px photo):
  JPEG:    ~130KB
  WebP:    ~90KB  (30% nhỏ hơn JPEG)
  AVIF:    ~65KB  (50% nhỏ hơn JPEG!)
  PNG:     ~500KB (much larger — lossless)
```

#### 3.2 Responsive Images — Đúng size cho đúng device

```html
<!-- ✅ srcset + sizes: Browser chọn size phù hợp với màn hình -->
<img
  src="hero-800.jpg"
  srcset="
    hero-400.jpg  400w,
    hero-800.jpg  800w,
    hero-1200.jpg 1200w,
    hero-1600.jpg 1600w
  "
  sizes="
    (max-width: 600px)  100vw,
    (max-width: 1200px) 80vw,
    60vw
  "
  alt="Hero image"
/>
<!-- Mobile 375px: browser tải hero-400.jpg (đủ dùng) -->
<!-- Retina 1440px: browser tải hero-1600.jpg (sắc nét) -->
<!-- → Không lãng phí bandwidth tải ảnh quá lớn! -->

<!-- ✅ lazy loading: Chỉ tải khi ảnh vào viewport -->
<img
  src="product.jpg"
  loading="lazy"     <!-- Native browser lazy loading -->
  decoding="async"   <!-- Decode image không block main thread -->
  alt="Product"
/>
```

#### 3.3 Webpack image optimization

```javascript
// webpack.config.js
module.exports = {
  module: {
    rules: [
      {
        test: /\.(png|jpe?g|gif|svg|webp)$/i,
        use: [
          'file-loader',
          {
            loader: 'image-webpack-loader',
            options: {
              mozjpeg: { quality: 75, progressive: true },
              optipng: { enabled: false },
              pngquant: { quality: [0.65, 0.90], speed: 4 },
              gifsicle: { interlaced: false },
              webp: { quality: 75 }, // Convert to WebP
            },
          },
        ],
      },
    ],
  },
};
```

---

### Part 4: Font Optimization

#### 4.1 font-display — Tránh Invisible Text

```
font-display behavior comparison:
┌─────────────────────────────────────────────────────────────┐
│ auto (default):                                             │
│   0ms → 3000ms: INVISIBLE text (FOIT — Flash of Invisible) │
│   3000ms+: Fallback font shown                             │
│   When custom loaded: Swap to custom font                  │
│                                                             │
│ block:                                                      │
│   0ms → 3000ms: INVISIBLE text (same as auto)              │
│   When custom loaded: Swap to custom font                  │
│                                                             │
│ swap:                                                       │
│   0ms: FALLBACK font shown immediately                     │
│   When custom loaded: Swap (FOUT — Flash of Unstyled Text) │
│   Risk: User đang đọc rồi bị flash!                        │
│                                                             │
│ fallback: ← RECOMMENDED cho body text                      │
│   0ms → 100ms: INVISIBLE (brief block period)             │
│   100ms: Fallback font shown (if custom not cached)        │
│   0ms → 3000ms: Swap window (nếu custom load trong 3s)    │
│   3000ms+: Stay with fallback                              │
│                                                             │
│ optional: ← RECOMMENDED cho decorative fonts               │
│   0ms → 100ms: INVISIBLE (brief block period)             │
│   100ms: Fallback font shown                               │
│   NEVER swap (user không thấy flash bao giờ)               │
│   Custom font chỉ dùng cho page load tiếp theo (nếu cached)│
└─────────────────────────────────────────────────────────────┘
```

```css
/* ✅ Recommended font-display setup */
@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter-regular.woff2') format('woff2');
  font-display: fallback; /* Cho body text */
  font-weight: 400;
}

@font-face {
  font-family: 'Playfair Display';
  src: url('/fonts/playfair-bold.woff2') format('woff2');
  font-display: optional; /* Cho decorative/heading fonts */
  font-weight: 700;
}

body {
  /* ✅ Luôn specify fallback font! */
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  /*                    ↑ popular  ↑ generic family */
  /*                      system     (backup for any OS) */
}

/* ❌ BAD: Không có fallback → Times New Roman hiện ra! */
body {
  font-family: 'Inter';
}
```

#### 4.2 Preload Critical Fonts

```html
<!-- Preload font được dùng ngay trên page (hero text, nav) -->
<head>
  <link
    rel="preload"
    href="/fonts/inter-regular.woff2"
    as="font"
    type="font/woff2"
    crossorigin
    <!-- crossorigin bắt buộc cho fonts! -->
  />
</head>
<!-- Browser download font song song với HTML parse
     → Font đã sẵn sàng khi cần render → không có delay! -->
```

---

### Part 5: Networking Optimization

#### 5.1 Gzip / Brotli Compression

```
Text compression impact:
┌────────────────────────────────────────────────────────────┐
│ File         │ Original │ Gzip   │ Brotli │                │
├────────────────────────────────────────────────────────────┤
│ app.js       │ 1.2MB    │ 320KB  │ 280KB  │ -77%           │
│ vendor.js    │ 2.4MB    │ 680KB  │ 600KB  │ -75%           │
│ styles.css   │ 180KB    │ 28KB   │ 22KB   │ -88%           │
│ index.html   │ 50KB     │ 8KB    │ 6KB    │ -88%           │
└────────────────────────────────────────────────────────────┘
Compression chỉ hoạt động với text files (JS, CSS, HTML, JSON, SVG)
Binary files (images, fonts woff2) đã được compressed sẵn

Nginx config:
```

```nginx
# nginx.conf
gzip on;
gzip_types text/html text/css application/javascript application/json;
gzip_min_length 1024;  # Chỉ compress files > 1KB
gzip_comp_level 6;     # 1-9, 6 là balance tốt giữa speed và ratio

# Brotli (tốt hơn gzip ~15-25%):
brotli on;
brotli_types text/html text/css application/javascript;
brotli_comp_level 6;
```

#### 5.2 HTTP Caching Strategy

```
Cache-Control cho các loại assets:
┌────────────────────────────────────────────────────────────┐
│ HTML files:                                                │
│   Cache-Control: no-cache                                  │
│   (Luôn check server — HTML có thể thay đổi)              │
│                                                            │
│ JS/CSS với content hash (app.abc123.js):                  │
│   Cache-Control: max-age=31536000, immutable               │
│   (Cache 1 năm — hash thay đổi khi nội dung thay đổi)    │
│                                                            │
│ Images (không có hash):                                    │
│   Cache-Control: max-age=86400                             │
│   (Cache 1 ngày — safe để invalidate nếu cần)             │
│                                                            │
│ API responses (private data):                              │
│   Cache-Control: private, max-age=300                      │
│   (Cache phía client 5 phút, không cache CDN)             │
└────────────────────────────────────────────────────────────┘

webpack content hashing:
```

```javascript
// webpack.config.js — content hash cho long-term caching
module.exports = {
  output: {
    filename: '[name].[contenthash:8].js',
    // Tạo ra: main.a1b2c3d4.js
    // Hash CHỈ thay đổi khi nội dung file thay đổi
    // → vendor.js hash không đổi dù app code thay đổi
  },
  optimization: {
    // Tách vendor code riêng để cache độc lập
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    },
    // Runtime chunk riêng (chứa webpack bootstrap)
    runtimeChunk: 'single',
  },
};
```

#### 5.3 HTTP/2 và Resource Hints

```html
<head>
  <!-- DNS Prefetch: Resolve DNS sớm cho third-party domains -->
  <link rel="dns-prefetch" href="//fonts.googleapis.com" />
  <link rel="dns-prefetch" href="//api.analytics.com" />

  <!-- Preconnect: DNS + TCP + TLS handshake sớm -->
  <!-- Dùng cho critical third-party resources -->
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />

  <!-- Preload: Tải resource với priority cao ngay lập tức -->
  <!-- Dùng cho resources cần sớm nhưng browser chưa discover -->
  <link rel="preload" href="/fonts/inter.woff2" as="font" crossorigin />
  <link rel="preload" href="/api/user" as="fetch" crossorigin />

  <!-- Prefetch: Tải resource khi browser idle -->
  <!-- Dùng cho resources cần cho page TIẾP THEO -->
  <link rel="prefetch" href="/dashboard.chunk.js" as="script" />
</head>
```

---

### Part 6: Công cụ Đo lường

```
Tool Selection Guide:
┌─────────────────────────────────────────────────────────────┐
│ Tool                  │ Use when                           │
├─────────────────────────────────────────────────────────────┤
│ PageSpeed Insights    │ Bắt đầu audit bất kỳ URL nào      │
│ (pagespeed.web.dev)   │ Target: score ≥ 80                 │
│                       │ Chạy Lighthouse lab test           │
├─────────────────────────────────────────────────────────────┤
│ Lighthouse            │ Test local/staging app             │
│ (Chrome DevTools)     │ Kiểm tra performance, SEO, a11y   │
│                       │ Chi tiết hơn PageSpeed             │
├─────────────────────────────────────────────────────────────┤
│ WebPageTest           │ Deep performance investigation     │
│ (webpagetest.org)     │ Xem loading waterfall              │
│                       │ Test từ nhiều locations            │
│                       │ Test với nhiều network conditions  │
├─────────────────────────────────────────────────────────────┤
│ webpack-bundle-       │ Hiểu bundle composition            │
│ analyzer              │ Tìm gì đang chiếm nhiều KB nhất    │
│                       │ Identify tree-shaking failures     │
├─────────────────────────────────────────────────────────────┤
│ Chrome DevTools       │ Profile runtime performance        │
│ Performance tab       │ Xem JS execution time              │
│                       │ Tìm long tasks, layout thrashing   │
│                       │ Memory leaks, excessive renders    │
└─────────────────────────────────────────────────────────────┘
```

---

### Tổng kết: Web Performance Checklist

```
Web Performance Optimization Checklist:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

JAVASCRIPT:
  [ ] Minification bật (production mode)
  [ ] Code splitting theo routes (React.lazy)
  [ ] Tree-shaking hoạt động (ES modules, no side effects)
  [ ] Third-party scripts dùng async/defer
  [ ] Không có unused dependencies (bundle analyzer)
  [ ] Polyfills chỉ cho browsers thực sự cần

CSS:
  [ ] Critical CSS được inline (above-the-fold)
  [ ] Non-critical CSS load async
  [ ] Unused CSS được remove (PurgeCSS)
  [ ] CSS minified

IMAGES:
  [ ] Đúng format (AVIF > WebP > JPEG/PNG)
  [ ] Đúng dimensions (không serve 2000px cho 400px slot)
  [ ] Lazy loading (loading="lazy" hoặc Intersection Observer)
  [ ] Compression applied (TinyPNG, image-webpack-loader)
  [ ] Responsive images (srcset + sizes)

FONTS:
  [ ] font-display: fallback hoặc optional
  [ ] Fallback font được specify
  [ ] Preload critical fonts
  [ ] Chỉ load font weights/styles thực sự dùng

NETWORKING:
  [ ] Gzip/Brotli compression bật
  [ ] HTTP/2 bật (multiplexing)
  [ ] CDN cho static assets
  [ ] Content hashing cho long-term caching
  [ ] Cache-Control headers đúng
  [ ] Resource hints (preconnect, preload, prefetch)

METRICS TO TRACK:
  [ ] LCP (Largest Contentful Paint) < 2.5s
  [ ] FID/INP (Interaction to Next Paint) < 200ms
  [ ] CLS (Cumulative Layout Shift) < 0.1
  [ ] TTFB (Time to First Byte) < 800ms
  [ ] Total bundle size (JS) < 200KB gzipped
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Priority matrix:
┌─────────────────────────────────────────────────────────────┐
│                  │ HIGH impact  │ LOW impact                │
├─────────────────────────────────────────────────────────────┤
│ EASY to do       │ ⭐⭐⭐ DO FIRST│ ⭐⭐ Do second           │
│                  │ - Minify JS  │ - Remove unused CSS      │
│                  │ - Gzip       │ - Responsive images      │
│                  │ - Cache hdrs │ - font-display           │
│                  │ - Image fmt  │                          │
├─────────────────────────────────────────────────────────────┤
│ HARD to do       │ ⭐⭐ Plan it  │ ⭐ Skip unless needed   │
│                  │ - Code split │ - HTTP/2 push            │
│                  │ - Critical   │ - Service Workers        │
│                  │   CSS inline │ - Complex prefetching    │
│                  │ - Tree shake │                          │
└─────────────────────────────────────────────────────────────┘
```


---

## Deep Dive: `<link rel>` Resource Hints — Preload, Prefetch, Preconnect

> **Nguồn:** [3perf.com/blog/link-rels](https://3perf.com/blog/link-rels/) — Ivan Akulov (PerfPerfPerf)
>
> Bài này là **reference guide** đầy đủ về tất cả các `<link rel>` tags liên quan đến performance. Mỗi tag có use case, cách dùng, và gotchas riêng — dùng sai thì không chỉ không giúp được mà còn làm chậm hơn.

### Tổng quan: 6 Resource Hint Tags

```
<link rel> Performance Tags — Mind Map:
┌────────────────────────────────────────────────────────────────┐
│                    Resource Hints                              │
│                         │                                     │
│        ┌────────────────┼─────────────────┐                   │
│        ▼                ▼                 ▼                   │
│   NETWORKING         LOADING           RENDERING              │
│   ─────────         ───────           ─────────               │
│   preconnect        preload           prerender               │
│   dns-prefetch      prefetch                                   │
│                     modulepreload                              │
│                                                               │
│  Timeline khi page load:                                      │
│  0ms ─────────────────────────────────────────────► time      │
│  │ DNS resolve  │ TCP connect │ TLS handshake │ Request │     │
│  └─ dns-prefetch┘ └──────────── preconnect ───────────┘       │
│                                     │                         │
│                               preload: Download resource NOW  │
│                               prefetch: Download when idle    │
│                               prerender: Load+render in bg    │
└────────────────────────────────────────────────────────────────┘
```

---

### 1. `<link rel="preload">` — Tải ngay, dùng ngay sau đó

**Mục đích:** Nói với browser "tải resource này với priority cao nhất — tôi sẽ cần nó ngay".

```html
<!-- Syntax: -->
<link rel="preload" href="/path/to/resource" as="TYPE" />

<!-- as attribute values: -->
<!-- as="script"    → JS file -->
<!-- as="style"     → CSS file -->
<!-- as="font"      → Font file (cần thêm crossorigin!) -->
<!-- as="image"     → Image -->
<!-- as="fetch"     → API/fetch request -->
<!-- as="document"  → iframe/embed -->
```

**Ví dụ thực tế:**

```html
<head>
  <!-- Font: LUÔN cần crossorigin kể cả same-origin! -->
  <link
    rel="preload"
    href="/fonts/inter-bold.woff2"
    as="font"
    type="font/woff2"
    crossorigin
  />

  <!-- Critical JS chunk (không phải main bundle — nó đã tải rồi) -->
  <link
    rel="preload"
    href="/static/dashboard.chunk.js"
    as="script"
  />

  <!-- Hero image — LCP element cần load sớm -->
  <link
    rel="preload"
    href="/images/hero.avif"
    as="image"
    type="image/avif"
  />

  <!-- API data cần ngay khi JS chạy -->
  <link
    rel="preload"
    href="/api/user/profile"
    as="fetch"
    crossorigin
  />
</head>
```

```
Timeline SO SÁNH — Font loading:

WITHOUT preload:
  0ms: HTML parse → <head> → body render → CSS parse → "need Inter font!"
  2000ms: Browser discovers font is needed
  2300ms: Font downloaded
  2300ms: Text renders ← user waits 2.3s for text!

WITH preload:
  0ms: HTML parse → <link rel="preload" as="font"> → browser starts fetch
  300ms: Font downloaded (parallel với everything else!)
  1000ms: CSS parsed, font ready → Text renders immediately ✅
```

**Gotchas quan trọng:**

```
⚠️ WARNING 1: Chỉ preload những gì THỰC SỰ dùng ngay!
  Nếu preload 1 resource nhưng không dùng trong 3s → browser warning:
  "The resource was preloaded but not used within a few seconds"
  → Bạn đã LÃNG PHÍ bandwidth và làm chậm resources khác!

⚠️ WARNING 2: crossorigin cho fonts là bắt buộc
  Font requests luôn là cross-origin (kể cả cùng domain)
  Thiếu crossorigin → browser tải font 2 lần! (preload + actual request)

⚠️ WARNING 3: as attribute phải chính xác
  Sai as → browser có thể fetch với wrong priority hoặc fetch 2 lần
  as="script" nhưng file là font → resource bị fetch 2 lần!
```

---

### 2. `<link rel="prefetch">` — Tải khi rảnh, dùng ở trang sau

**Mục đích:** Nói với browser "khi bạn rảnh, hãy tải resource này — tôi cần nó ở page tiếp theo".

```html
<!-- Prefetch JS chunk cho trang tiếp theo user có thể đến -->
<link rel="prefetch" href="/static/checkout.chunk.js" as="script" />

<!-- Prefetch page tiếp theo trong flow -->
<link rel="prefetch" href="/checkout" />
```

```
preload vs prefetch — Key differences:
┌─────────────────────────────────────────────────────────────┐
│                │ preload              │ prefetch            │
├─────────────────────────────────────────────────────────────┤
│ Priority       │ HIGH (ngay lập tức) │ LOWEST (khi idle)   │
│ When to use    │ Trang HIỆN TẠI      │ Trang TIẾP THEO     │
│ Browser action │ Fetch ngay          │ Fetch khi rảnh      │
│ Cache          │ Memory cache        │ HTTP cache          │
│ Impact         │ Tốt nếu đúng        │ Không hại nếu sai   │
│                │ Hại nếu sai         │                     │
└─────────────────────────────────────────────────────────────┘

Use case thực tế — prefetch:
  Trang product listing → user có thể click vào product detail
  → Prefetch product detail JS chunk trên listing page
  → Khi user click → chunk đã cached → instant!
```

**React Router với prefetch:**

```typescript
// Hover prefetch — load chunk khi user hover vào link
import { Link } from 'react-router-dom';

function NavItem({ to, children }) {
  const handleMouseEnter = () => {
    // Dynamically add prefetch link khi hover
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = getChunkUrl(to); // map route → chunk URL
    link.as = 'script';
    document.head.appendChild(link);
  };

  return (
    <Link to={to} onMouseEnter={handleMouseEnter}>
      {children}
    </Link>
  );
}

// Hoặc dùng thư viện quicklink (tự động prefetch links trong viewport)
import { listen } from 'quicklink';
window.addEventListener('load', () => listen());
```

---

### 3. `<link rel="preconnect">` — Kết nối sớm tới third-party domains

**Mục đích:** Thực hiện DNS lookup + TCP connection + TLS handshake sớm cho domains biết trước.

```
Connection setup cost cho mỗi new domain:
┌────────────────────────────────────────────────────────────┐
│ DNS lookup:      20-120ms  (tìm IP của domain)            │
│ TCP handshake:   20-100ms  (establish connection)         │
│ TLS handshake:   40-200ms  (HTTPS security setup)         │
│                  ─────────                                 │
│ Total:           80-420ms overhead cho EVERY new domain!  │
└────────────────────────────────────────────────────────────┘

WITHOUT preconnect (first request to fonts.googleapis.com):
  0ms: User visits page
  1000ms: Browser discovers need for Google Fonts
  1000ms → 1400ms: DNS + TCP + TLS = 400ms wasted!
  1400ms → 1700ms: Download font CSS
  1700ms → 2000ms: Download font files
  2000ms: Font ready ← 2 giây!

WITH preconnect:
  0ms: <link rel="preconnect"> — browser starts DNS+TCP+TLS
  0ms → 200ms: Connection established (trong background!)
  1000ms: Browser discovers need for Google Fonts
  1000ms: Connection ALREADY OPEN! Jump straight to download
  1000ms → 1200ms: Download font CSS
  1200ms → 1500ms: Download font files
  1500ms: Font ready ← 1.5 giây! (tiết kiệm 500ms)
```

```html
<head>
  <!-- ✅ Preconnect cho critical third-party domains -->
  <!-- Google Fonts cần 2 connections riêng: -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <!--                                                      ↑ crossorigin bắt buộc -->
  <!--                                                        cho CORS domains      -->

  <!-- Analytics -->
  <link rel="preconnect" href="https://www.google-analytics.com" />

  <!-- API server -->
  <link rel="preconnect" href="https://api.myapp.com" />
</head>
```

**Giới hạn quan trọng:**

```
❌ ĐỪNG preconnect quá nhiều domains!
  Limit: 4-6 domains tối đa

  Lý do: Mỗi connection:
  - Chiếm CPU để làm TLS handshake
  - Chiếm memory để giữ connection open
  - Nếu không dùng trong 10s → browser close và wasted!

  Cho domains ít quan trọng hơn → dùng dns-prefetch thay thế:
  <link rel="dns-prefetch" href="//less-important-cdn.com" />
  → Chỉ làm DNS (20-120ms), không làm TCP+TLS
  → Nhẹ hơn nhiều, có thể dùng nhiều hơn
```

---

### 4. `<link rel="dns-prefetch">` — Chỉ resolve DNS sớm

**Mục đích:** Chỉ làm DNS lookup sớm (không TCP, không TLS). Nhẹ hơn preconnect, phù hợp cho nhiều domains hơn.

```html
<!-- dns-prefetch: chỉ resolve DNS, không mở connection -->
<link rel="dns-prefetch" href="//fonts.googleapis.com" />
<link rel="dns-prefetch" href="//cdn.analytics-provider.com" />
<link rel="dns-prefetch" href="//maps.external-service.com" />
<link rel="dns-prefetch" href="//payment.gateway.com" />
<!-- Có thể dùng cho 10+ domains vì rất lightweight -->

<!-- Kết hợp preconnect + dns-prefetch cho cross-browser support: -->
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="dns-prefetch" href="//fonts.gstatic.com" />
<!-- preconnect cho browsers hỗ trợ, dns-prefetch làm fallback -->
```

```
dns-prefetch vs preconnect timing:
  dns-prefetch: DNS (20-120ms)
  preconnect:   DNS + TCP + TLS (80-420ms)

  Dùng preconnect khi: Critical domain, biết chắc sẽ dùng, ≤ 6 domains
  Dùng dns-prefetch khi: Less critical, nhiều domains, cần cross-browser
```

---

### 5. `<link rel="modulepreload">` — Preload ES Modules

**Vấn đề:** Khi app dùng ES Modules, browser phải load modules theo chuỗi:

```
ES Module waterfall problem:
┌────────────────────────────────────────────────────────────┐
│ main.js imports Header.js                                  │
│   ↓ Download main.js (100ms)                               │
│   ↓ Parse main.js → discover Header.js                    │
│   ↓ Download Header.js (100ms)                            │
│   ↓ Parse Header.js → discover Logo.js, Link.js          │
│   ↓ Download Logo.js + Link.js (100ms)                    │
│   ↓ Parse Logo.js → discover Img.js                       │
│   ↓ Download Img.js (100ms)                               │
│   ↓ App starts! Total: 400ms (4 round trips!)             │
└────────────────────────────────────────────────────────────┘

WITH modulepreload:
┌────────────────────────────────────────────────────────────┐
│ HTML tells browser about all modules upfront:              │
│   Download all 4 modules simultaneously (100ms)           │
│   App starts! Total: 100ms (1 round trip!) ✅              │
└────────────────────────────────────────────────────────────┘
```

```html
<!-- Tell browser about all ES modules upfront -->
<link rel="modulepreload" href="/static/Header.js" />
<link rel="modulepreload" href="/static/Logo.js" />
<link rel="modulepreload" href="/static/Link.js" />
<link rel="modulepreload" href="/static/Img.js" />

<!-- vs preload: modulepreload cũng compile JS → bytecode cache -->
<!-- preload as="script" chỉ download, không compile -->
```

---

### 6. `<link rel="prerender">` — Load và render page trong background

**Mục đích:** Render hoàn toàn một page trong tab ẩn — khi user click vào, page hiện ra ngay lập tức.

```html
<!-- Prerender trang tiếp theo trong conversion funnel -->
<link rel="prerender" href="/checkout" />
```

```
⚠️ CẢNH BÁO:
  - Cực kỳ tốn resource (load + execute toàn bộ page JS, CSS, images)
  - Chỉ dùng khi chắc chắn 70%+ users sẽ đến trang đó
  - Chỉ prerender TỐI ĐA 1 page
  - Chrome thực ra chỉ làm "NoState Prefetch" (download không render)
  - Firefox và Safari không support
  - Modern thay thế: Speculation Rules API (Chrome 109+)
```

---

### Quick Reference: Chọn tag nào?

```
Decision Flow:
                Tôi cần gì?
                     │
        ┌────────────┼─────────────────┐
        ▼            ▼                 ▼
   Kết nối       Resource           Page/URL
   tới domain    cụ thể             khác
        │            │                 │
        ▼            ▼                 ▼
   Critical?    Trang nào?      Chắc user sẽ đến?
        │            │                 │
   Yes─►preconnect  Current─►preload  Yes─►prerender
   No─►dns-prefetch Next───►prefetch  No──►prefetch

   ES Module? → modulepreload

Cheat Sheet:
┌────────────────────────────────────────────────────────────────┐
│ Tag               │ Khi nào dùng                              │
├────────────────────────────────────────────────────────────────┤
│ preload           │ Resource cần ngay trên page hiện tại      │
│                   │ (fonts, critical JS, hero image)          │
├────────────────────────────────────────────────────────────────┤
│ prefetch          │ Resource cần ở page TIẾP THEO             │
│                   │ (JS chunks, images của next page)         │
├────────────────────────────────────────────────────────────────┤
│ preconnect        │ Third-party domain quan trọng (≤6)        │
│                   │ (Google Fonts, API server)                │
├────────────────────────────────────────────────────────────────┤
│ dns-prefetch      │ Third-party domains ít quan trọng (>6)    │
│                   │ Fallback cho preconnect                   │
├────────────────────────────────────────────────────────────────┤
│ modulepreload     │ ES Module app — preload module graph       │
├────────────────────────────────────────────────────────────────┤
│ prerender         │ Chắc chắn user sẽ đến page đó (1 page)   │
└────────────────────────────────────────────────────────────────┘
```

---

## Deep Dive: Polyfills — 3 Cách serve đúng browser, không lãng phí

> **Nguồn:** [3perf.com/blog/polyfills](https://3perf.com/blog/polyfills/) — Ivan Akulov (PerfPerfPerf)
>
> Bài này giải thích 3 cách phổ biến để chỉ serve polyfills cho browsers thực sự cần — không ship code thừa cho Chrome/Firefox hiện đại, không bỏ sót IE11.

### Vấn đề: Polyfills thêm hàng trăm KB cho tất cả users

```
Polyfill problem — "one size fits all":
┌────────────────────────────────────────────────────────────┐
│ Approach naïve: Import toàn bộ core-js                    │
│   import 'core-js';  // 293 polyfills!                    │
│                                                            │
│   Chrome 120 user: 0 polyfills cần → nhận 293 KB JS thừa │
│   Firefox 120 user: 0 polyfills cần → nhận 293 KB JS thừa│
│   IE 11 user:      ~200 polyfills cần → OK                │
│                                                            │
│ Vấn đề: 95% users (modern browsers) gánh 293KB vô ích!   │
└────────────────────────────────────────────────────────────┘
```

---

### Approach 1: polyfill.io — Third-party service

**Cách hoạt động:** Service đọc `User-Agent` header và trả về đúng polyfills mà browser đó cần.

```html
<!-- Thêm TRƯỚC bundle của bạn -->
<script src="https://polyfill.io/v3/polyfill.min.js?features=default"></script>
<script src="/bundle.min.js"></script>

<!-- Chỉ lấy polyfills cần cho app của bạn: -->
<script src="https://polyfill.io/v3/polyfill.min.js?features=Map,Promise,fetch,Object.assign"></script>
```

```
Ví dụ response cho các browsers khác nhau:
  Chrome 120:  polyfill.io trả về 0 bytes (empty script)
  IE 11:       polyfill.io trả về ~120KB polyfills
  Safari 12:   polyfill.io trả về ~30KB polyfills
```

**Pros và Cons:**

```
✅ Ưu điểm:
  - Setup cực đơn giản (1 dòng HTML)
  - Chính xác nhất: đúng browser, đúng polyfills
  - Modern browsers không nhận gì cả (0 bytes!)

❌ Nhược điểm:
  - +50-300ms TTI (Time to Interactive) vì:
    · Browser phải connect tới polyfill.io server (different origin)
    · DNS + TCP + TLS + Request = 50-300ms overhead!
  - Script không có async/defer → block render!
  - Nếu polyfill.io bị outage → site chậm hoặc break ở old browsers
  - Privacy: Request lộ User-Agent ra bên ngoài

Fix latency issue:
  → Thêm preconnect: <link rel="preconnect" href="https://polyfill.io">
  → Thêm async: <script src="https://polyfill.io/..." async></script>
    (Nhưng cần đảm bảo polyfills available trước khi bundle run)
```

---

### Approach 2: `module`/`nomodule` Pattern

**Nguyên tắc:** Browsers không support ES2015 sẽ bỏ qua `type="module"` và load `nomodule`. Browsers modern sẽ bỏ qua `nomodule` và load `type="module"`.

```html
<!-- Bundle đầy đủ polyfills cho old browsers (IE11, etc.) -->
<script nomodule src="/polyfills/full.min.js"></script>

<!-- Bundle polyfills minimal cho modern browsers (ES2015+) -->
<script type="module" src="/polyfills/modern.min.js"></script>

<!-- App bundle chính — defer để chạy sau polyfills -->
<script src="/bundle.min.js" defer></script>
```

```
Browser behavior:
┌────────────────────────────────────────────────────────────┐
│ IE 11 (no ES2015):                                        │
│   - nomodule → LOAD /polyfills/full.min.js ✅             │
│   - type="module" → IGNORE                                │
│   - /bundle.min.js → LOAD ✅                              │
│                                                            │
│ Chrome 120 (ES2015+):                                     │
│   - nomodule → IGNORE                                     │
│   - type="module" → LOAD /polyfills/modern.min.js ✅      │
│   - /bundle.min.js → LOAD ✅                              │
└────────────────────────────────────────────────────────────┘

Bundle split:
  full.min.js:    Promise, Map, Set, fetch, Object.assign... (200KB)
  modern.min.js:  Array.prototype.flat, Object.fromEntries... (30KB)
  → Modern users chỉ nhận 30KB thay vì 200KB!
```

**Gotchas:**

```
⚠️ Safari 10.1 quirk:
  Supports type="module" nhưng không support nomodule attribute
  → Safari 10.1 sẽ load CẢ HAI full.min.js và modern.min.js!
  Fix: Thêm script sau để prevent double-load trong Safari 10.1

⚠️ type="module" scripts luôn deferred:
  type="module" scripts luôn chạy sau HTML parse (như defer)
  → bundle.min.js cũng cần defer để đảm bảo thứ tự đúng
  → Xem snippet bên dưới

⚠️ Chỉ split ở ES2015 boundary:
  ES2016+ features (Array.flat, Object.fromEntries...) vẫn phải
  ship cho TẤT CẢ ES2015+ browsers dù nhiều không cần
```

```javascript
// Webpack config để tạo module/nomodule bundles:
// webpack.config.js — tạo 2 configs cho 2 target browsers

const commonConfig = {
  entry: './src/index.js',
  // ...
};

// Config cho modern browsers
const modernConfig = {
  ...commonConfig,
  output: { filename: 'bundle.modern.js' },
  module: {
    rules: [{
      test: /\.js$/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: [['@babel/preset-env', {
            targets: { esmodules: true }, // ES2015+ browsers
            useBuiltIns: 'usage',
            corejs: 3,
          }]],
        },
      },
    }],
  },
};

// Config cho legacy browsers
const legacyConfig = {
  ...commonConfig,
  output: { filename: 'bundle.legacy.js' },
  module: {
    rules: [{
      test: /\.js$/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: [['@babel/preset-env', {
            targets: '> 0.5%, last 2 versions, IE 11',
            useBuiltIns: 'usage',
            corejs: 3,
          }]],
        },
      },
    }],
  },
};
```

---

### Approach 3: Babel `useBuiltIns` — Polyfills theo usage

**Cách hoạt động:** Babel phân tích code và chỉ thêm polyfills cho methods thực sự được dùng.

```javascript
// babel.config.js
module.exports = {
  presets: [
    ['@babel/preset-env', {
      targets: '> 0.5%, last 2 versions, not dead',

      // Option 1: useBuiltIns: 'entry'
      // → Replace `import 'core-js'` với polyfills cần cho target browsers
      useBuiltIns: 'entry',
      corejs: 3,
      // Trong code: import 'core-js'; // 1 dòng này thôi
      // Babel transform thành: import core-js/modules/es.array.flat; ...
      // (chỉ những polyfills cần cho target browsers)

      // Option 2: useBuiltIns: 'usage' (mạnh hơn)
      // → Chỉ thêm polyfills cho methods THỰC SỰ DÙNG trong code
      useBuiltIns: 'usage',
      corejs: 3,
      // Trong code:
      //   [1,2,3].includes(2); // ← dùng Array.includes
      // Babel tự động thêm:
      //   import 'core-js/modules/es.array.includes'; // Nếu target cần nó
    }],
  ],
};
```

**useBuiltIns: 'entry' vs 'usage':**

```
entry mode:
  Before: import 'core-js';           // 293 polyfills
  After:  import 'core-js/modules/...'; // 87 polyfills cho target browsers
  → Vẫn ship nhiều polyfills chưa cần cho modern browsers

usage mode:
  Before: console.log([1,2].includes(1)); // no imports
  After (target IE11): import 'core-js/modules/es.array.includes';
  After (target Chrome 80+): // nothing! Chrome 80 already has includes
  → Chính xác nhất — chỉ polyfill những gì code thực sự dùng
```

**Gotchas của usage mode:**

```
⚠️ node_modules KHÔNG được polyfilled:
  Nếu 1 thư viện dùng Array.flat() nhưng bạn target IE11,
  usage mode sẽ KHÔNG thêm polyfill cho thư viện đó!

  Fix: pipe node_modules qua Babel (chậm hơn nhiều):
  // webpack.config.js
  {
    test: /\.js$/,
    exclude: /node_modules\/(?!your-problematic-lib)/, // Exclude tất cả trừ lib cần
    use: 'babel-loader',
  }

⚠️ Có thể thêm polyfills thừa (false positive):
  myObj.includes(); // Babel không biết myObj là Array hay String
  → Thêm cả Array.includes VÀ String.includes polyfill
  → 1 trong 2 cái là thừa

⚠️ Phải dùng core-js 3 (không phải 2):
  core-js 2 không có polyfills cho methods mới (Array.flat, etc.)
  Upgrade: npm install core-js@3
```

---

### So sánh 3 Approaches

```
┌────────────────────────────────────────────────────────────────────┐
│                  │ polyfill.io  │ module/nomodule │ Babel usage   │
├────────────────────────────────────────────────────────────────────┤
│ Setup effort     │ ⭐ Dễ nhất   │ ⭐⭐⭐ Phức tạp  │ ⭐⭐ Vừa       │
├────────────────────────────────────────────────────────────────────┤
│ Accuracy         │ ⭐⭐⭐ Tốt nhất│ ⭐⭐ OK          │ ⭐⭐⭐ Tốt      │
├────────────────────────────────────────────────────────────────────┤
│ Modern browsers  │ ⭐⭐⭐ 0 bytes │ ⭐⭐ Ít polyfills│ ⭐⭐⭐ Tối ưu   │
├────────────────────────────────────────────────────────────────────┤
│ TTI overhead     │ ❌ +50-300ms  │ ✅ None         │ ✅ None        │
├────────────────────────────────────────────────────────────────────┤
│ External dep     │ ❌ Có (risk)  │ ✅ Không        │ ✅ Không       │
├────────────────────────────────────────────────────────────────────┤
│ Dependencies     │ ❌ Không polyfill deps │ ❌ Không │ ❌ Không    │
└────────────────────────────────────────────────────────────────────┘

Recommendation:
  → Dự án mới, modern stack → Babel useBuiltIns: 'usage' + core-js 3
  → Cần target IE11 nghiêm túc → module/nomodule pattern
  → Quick win, team nhỏ → polyfill.io (nhớ thêm async + preconnect)
  → Ideal → Kết hợp: Babel useBuiltIns theo UA-based serving
```

**Best practice cuối cùng — Custom solution:**

```javascript
// Server-side rendering hoặc edge function:
// Đọc User-Agent → chọn đúng bundle → serve

// server.js (Node.js)
function getBundleForBrowser(userAgent) {
  const isModernBrowser = /Chrome\/[89]\d|Firefox\/[89]\d|Safari\/1[4-9]/.test(userAgent);

  if (isModernBrowser) {
    return {
      polyfills: '/polyfills/modern.min.js',  // ~20KB
      bundle: '/bundle.modern.min.js',        // No transpilation overhead
    };
  } else {
    return {
      polyfills: '/polyfills/full.min.js',    // ~200KB  
      bundle: '/bundle.legacy.min.js',        // ES5 transpiled
    };
  }
}

app.get('/', (req, res) => {
  const { polyfills, bundle } = getBundleForBrowser(req.headers['user-agent']);
  res.send(`
    <html>
      <head>
        <script src="${polyfills}" defer></script>
        <script src="${bundle}" defer></script>
      </head>
    </html>
  `);
});
// → Modern browsers: ~20KB polyfills + modern bundle
// → Old browsers: ~200KB polyfills + transpiled bundle
// → Zero overhead, zero external dependencies
```


---

## Deep Dive: HTTP Caching — Cache-Control, ETag và Versioning

> **Nguồn:** [iamakulov.com/notes/caching](https://iamakulov.com/notes/caching/) — Ivan Akulov
>
> Bài ngắn nhưng rất súc tích — giải thích đúng 4 headers quan trọng nhất của HTTP Caching, cơ chế hoạt động thực sự của chúng, và cách implement versioning để cache dài hạn nhưng vẫn có thể invalidate khi cần.

### 4 Caching Headers — Phân loại

```
4 HTTP Caching Headers:
┌────────────────────────────────────────────────────────────┐
│ PRIMARY (bắt buộc có 1):                                  │
│   Cache-Control  → Kiểm soát chi tiết caching behavior    │
│   Expires        → Ngày hết hạn cụ thể (cũ hơn, ít dùng) │
│                                                            │
│ SECONDARY (optional, dùng để validate):                    │
│   ETag           → Hash của file content                   │
│   Last-Modified  → Timestamp file được sửa lần cuối       │
│                                                            │
│ KHUYẾN NGHỊ: Dùng Cache-Control + ETag                    │
│   Cache-Control: flexible hơn Expires                      │
│   ETag: reliable hơn Last-Modified (MDN)                  │
│   (dùng cả 4 không cần thiết — browser chỉ dùng 2)       │
└────────────────────────────────────────────────────────────┘
```

---

### Cơ chế hoạt động: Lifecycle của 1 resource có caching

```
Ví dụ: pic.gif với header Cache-Control: max-age=60, ETag: "deadbeef123"

Request #1 — Cache MISS (lần đầu):
  Browser ──GET /pic.gif──────────────────────────► Server
  Browser ◄──200 OK, pic.gif (full content)────────┤
           ◄──Cache-Control: max-age=60─────────────┤
           ◄──ETag: "deadbeef123"───────────────────┤
  Browser stores pic.gif in cache, notes ETag and expiry time

Request #2 — Cache HIT (trong vòng 60 giây):
  Browser ──(user refreshes page)─────────────────────────
           "max-age=60 chưa hết!" → KHÔNG gửi request gì
           Lấy pic.gif từ local cache → instant! ✅

Request #3 — Conditional Request (sau 60 giây):
  Browser ──GET /pic.gif───────────────────────────► Server
           ──If-None-Match: "deadbeef123"────────────┤
                                                      │
  Server đọc pic.gif, tính ETag mới...               │
                                                      │
  CASE A — File KHÔNG đổi (ETag vẫn là "deadbeef123"):
  Browser ◄──304 Not Modified (NO BODY!)──────────────┤
           ← Không download gì thêm!
           ← Browser dùng lại cached version ✅
           ← Chỉ mất time của 1 round trip nhỏ

  CASE B — File ĐÃ THAY ĐỔI (ETag khác):
  Browser ◄──200 OK, pic.gif (full content, mới!)─────┤
           ◄──Cache-Control: max-age=60─────────────────┤
           ◄──ETag: "newetag456"────────────────────────┤
           ← Download full file mới
           ← Update cache
```

```
Visual timeline:
│ Request 1 ──► Full download (200 OK)
│ Request 2 ──► NOTHING! (cache hit, max-age still valid)
│ Request 3 ──► Conditional GET (304 Not Modified — tiny!)
│ Request 4 ──► Conditional GET → 200 OK (file changed → full)
│
│ Performance impact:
│   Cache HIT:        0ms network cost!
│   304 Not Modified: ~5-20ms (just headers, no body)
│   200 OK miss:      Normal full download
```

---

### Cache-Control: `immutable` — Loại bỏ hoàn toàn conditional requests

**Vấn đề với max-age:** Dù cache còn hiệu lực, browser vẫn gửi conditional request sau mỗi `max-age` seconds — dù file KHÔNG thay đổi.

**Giải pháp:** `Cache-Control: immutable` — nói với browser "file này sẽ không bao giờ thay đổi, đừng hỏi lại".

```http
# Bình thường: max-age=60 → conditional request mỗi 60s
Cache-Control: max-age=60
# → Mỗi 60s: Browser vẫn gửi request (dù nhận 304 Not Modified)

# Với immutable: KHÔNG GỬI REQUEST GÌ KỂ CẢ SAU KHI HẾT HẠN
Cache-Control: max-age=31536000, immutable
# → Browser coi file là valid mãi mãi
# → KHÔNG gửi conditional request
# → 0 network cost cho returning users!
```

```
Timeline so sánh — Returning user (file không đổi):

WITHOUT immutable (max-age=3600):
  Visit 1:  Full download (200 OK)
  After 1h: Browser: "max-age expired, must check" → GET + 304 → tiny delay
  After 2h: Browser: "max-age expired, must check" → GET + 304 → tiny delay
  After 3h: GET + 304 → tiny delay
  (Mỗi giờ đều có 1 round trip!)

WITH immutable (max-age=31536000, immutable):
  Visit 1:  Full download (200 OK)
  Visit 2:  Từ cache, NO REQUEST! ✅
  Visit 3:  Từ cache, NO REQUEST! ✅
  Visit 4:  Từ cache, NO REQUEST! ✅
  (Không bao giờ gửi request nữa cho file này)
```

**⚠️ Nhưng làm sao update nếu file thay đổi?** → Đây là lúc cần **Versioning**.

---

### Versioning — Cache dài hạn + có thể invalidate

**Cơ chế:** Thêm hash vào tên file — khi file thay đổi, tên file thay đổi → browser coi đây là file MỚI hoàn toàn.

```
Versioning strategies:

Strategy 1: Query string (đơn giản, nhưng không phải best practice)
  /images/logo.png?v=1499433448
  /styles/app.css?v=abc123
  → Một số CDN và proxies không cache files có query strings!

Strategy 2: Content hash trong tên file (RECOMMENDED)
  /images/logo.a1b2c3d4.png
  /styles/app.ef5g6h7i.css
  /scripts/vendor.deadbeef.js
  → CDN và proxies cache bình thường
  → Hash chỉ thay đổi khi content thay đổi
  → Webpack/Vite tự động làm điều này!
```

```javascript
// webpack.config.js — content hashing tự động
module.exports = {
  output: {
    // [contenthash:8] → 8 ký tự hex từ content hash
    filename: '[name].[contenthash:8].js',      // app.a1b2c3d4.js
    chunkFilename: '[name].[contenthash:8].js', // vendor.ef5g6h7i.js
  },
};

// Vite — tự động có content hash
// vite.config.ts
export default {
  build: {
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]',
      },
    },
  },
};
```

**Kết hợp versioning + immutable = Cache strategy hoàn hảo:**

```
Complete Caching Strategy:
┌────────────────────────────────────────────────────────────┐
│ JS/CSS bundles (có content hash):                         │
│   app.a1b2c3d4.js                                         │
│   → Cache-Control: max-age=31536000, immutable            │
│   → Cache 1 năm, không bao giờ revalidate                 │
│   → Khi deploy mới: tên file thay đổi → browser download  │
│                                                            │
│ HTML files (không có hash, chứa references tới assets):   │
│   index.html                                              │
│   → Cache-Control: no-cache                               │
│   → Luôn check server có version mới không                │
│   → Browser vẫn gửi request nhưng thường nhận 304        │
│                                                            │
│ Images có hash:                                           │
│   hero.deadbeef.avif                                      │
│   → Cache-Control: max-age=31536000, immutable            │
│                                                            │
│ Images KHÔNG có hash (user avatar, dynamic):              │
│   /users/123/avatar.jpg                                   │
│   → Cache-Control: max-age=86400                          │
│   → Cache 1 ngày, sau đó revalidate với ETag              │
│                                                            │
│ API responses:                                            │
│   GET /api/products → Cache-Control: private, max-age=300 │
│   GET /api/public   → Cache-Control: public, s-maxage=3600│
└────────────────────────────────────────────────────────────┘
```

---

### Nginx / Express Config Examples

```nginx
# nginx.conf — Production caching setup

# HTML files: luôn revalidate
location ~* \.html$ {
    add_header Cache-Control "no-cache";
    add_header ETag on;           # Nginx tự tính ETag
}

# JS/CSS/Images với content hash: cache forever
location ~* \.(js|css|png|avif|webp|woff2)$ {
    # Chỉ apply cho files có hash trong tên (8 hex chars)
    if ($uri ~* "\.([a-f0-9]{8})\.(js|css|png)$") {
        add_header Cache-Control "max-age=31536000, immutable";
    }
}

# Hoặc đơn giản hơn: apply cho toàn bộ /static/ directory
location /static/ {
    add_header Cache-Control "max-age=31536000, immutable";
}
```

```javascript
// Express.js — Caching middleware
const express = require('express');
const app = express();

// Static files với long-term cache
app.use('/static', express.static('dist', {
  maxAge: '1y',       // max-age=31536000
  immutable: true,    // Cache-Control: immutable
  etag: true,         // Bật ETag
}));

// HTML với no-cache
app.get('*', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('ETag', generateETag(htmlContent));
  res.sendFile(path.join(__dirname, 'dist/index.html'));
});
```

---

### Cache-Control Values — Quick Reference

```
Cache-Control Directives Cheatsheet:
┌─────────────────────────────────────────────────────────────┐
│ Directive              │ Ý nghĩa                           │
├─────────────────────────────────────────────────────────────┤
│ max-age=N              │ Cache N giây                       │
│ no-cache               │ Phải revalidate trước khi serve   │
│                        │ (NOT "don't cache"!)              │
│ no-store               │ KHÔNG cache gì hết (sensitive data)│
│ immutable              │ File không đổi, đừng revalidate   │
│ public                 │ CDN có thể cache                  │
│ private                │ Chỉ browser cache, không CDN      │
│ s-maxage=N             │ CDN cache N giây                  │
│ stale-while-           │ Serve stale + fetch fresh in bg   │
│   revalidate=N         │                                   │
│ must-revalidate        │ Không serve stale sau max-age     │
├─────────────────────────────────────────────────────────────┤
│ Common combinations:                                        │
│                                                             │
│ Versioned static:                                           │
│   max-age=31536000, immutable                              │
│                                                             │
│ HTML/dynamic:                                               │
│   no-cache                                                  │
│                                                             │
│ Private user data:                                          │
│   private, no-cache                                         │
│   private, max-age=300                                      │
│                                                             │
│ Public API (CDN-cacheable):                                 │
│   public, max-age=60, s-maxage=3600                        │
│                                                             │
│ Background update (Framer AVIF pattern):                    │
│   max-age=0, stale-while-revalidate=86400                  │
└─────────────────────────────────────────────────────────────┘
```

---

### ETag vs Last-Modified — Khi nào dùng cái nào?

```
So sánh ETag và Last-Modified:
┌──────────────────────────────────────────────────────────────┐
│                │ ETag                  │ Last-Modified        │
├──────────────────────────────────────────────────────────────┤
│ Dựa trên       │ Content hash          │ File timestamp       │
│ Chính xác?     │ ✅ Cao — thay đổi khi │ ❌ Thấp hơn — có    │
│                │ content thay đổi      │ thể đổi dù content   │
│                │                       │ không đổi (touch!)  │
│ Server cost    │ Phải tính hash        │ Chỉ đọc metadata     │
│ Request header │ If-None-Match:        │ If-Modified-Since:   │
│                │   "deadbeef123"       │   Wed, 21 Oct 2015  │
│ MDN recommend  │ ✅                    │                      │
└──────────────────────────────────────────────────────────────┘

Ví dụ tại sao Last-Modified không reliable:
  # Tình huống: deploy lại server nhưng file KHÔNG thay đổi
  $ touch /var/www/app.js    ← file mới nhưng content cũ
  # Last-Modified: thay đổi → browser download lại không cần thiết!
  # ETag: vẫn cùng hash → browser nhận 304 Not Modified ✅

Dùng ETag:
  → Khi accuracy quan trọng
  → Khi file có thể bị touch mà không thay đổi content
  → Khi cần validate API responses

Dùng Last-Modified:
  → Khi server không muốn tính hash (performance)
  → Khi file thay đổi = timestamp luôn thay đổi (đủ chính xác)
```

---

### Tổng kết: 3 Rules of Caching

```
Rule 1: Luôn dùng Cache-Control + ETag
  → Cache-Control: kiểm soát duration và behavior
  → ETag: enable efficient revalidation (304 Not Modified)

Rule 2: Versioned assets → cache forever
  → JS/CSS/images có content hash → max-age=31536000, immutable
  → HTML (reference tới assets) → no-cache
  → Khi deploy: hash thay đổi → browser download tự động

Rule 3: Cache-Control: immutable = zero overhead cho returning users
  → Không cần conditional requests
  → CHỈ dùng khi kết hợp với versioning!
  → Nếu không có versioning: không thể invalidate!

Caching anti-patterns:
  ❌ no-store cho static assets → không cache gì → mọi visit re-download
  ❌ max-age rất lớn mà không có versioning → không update được!
  ❌ no-cache nhầm thành "don't cache" → thực ra vẫn cache, chỉ revalidate
  ❌ ETag mà server farm → mỗi server tính ETag khác → luôn miss!
     (Fix: Centralize ETag calculation hoặc dùng content hash làm ETag)
```


---

## Deep Dive: React Render Performance Monitoring — 5 Bước Đo Production

> **Nguồn:** [3perf.com/blog/react-monitoring](https://3perf.com/blog/react-monitoring/) — Ivan Akulov (PerfPerfPerf)
>
> Tối ưu performance mà không đo lường = bắn trong bóng tối. Bài này là **hướng dẫn 5 bước thực tế** để setup monitoring cho React app trong production — đo lường interaction latency của real users, detect regressions sớm, và collect data có ý nghĩa.

### Tại sao cần Monitoring, không chỉ Profiling?

```
Profiling (DevTools) vs Monitoring (Production):
┌────────────────────────────────────────────────────────────┐
│ Chrome DevTools Profiling:                                 │
│   ✅ Chi tiết, dễ debug                                    │
│   ❌ Chỉ đo trên máy DEV của bạn                          │
│   ❌ Không biết user thực sự trải nghiệm gì               │
│   ❌ Không detect regressions sau deploy                   │
│                                                            │
│ Production Monitoring (RUM):                              │
│   ✅ Data từ REAL users, real devices, real networks       │
│   ✅ Detect regression ngay sau deploy                    │
│   ✅ Thấy P50, P75, P95 — biết ai đang bị ảnh hưởng      │
│   ❌ Cần setup, có overhead nhỏ                           │
│                                                            │
│ Cần CẢ HAI:                                              │
│   RUM: "Cái gì đang chậm trong production?"               │
│   DevTools: "Tại sao nó chậm?"                            │
└────────────────────────────────────────────────────────────┘
```

---

### Step 1: Xác định Interactions Quan Trọng Nhất

**Không track mọi thứ** — chọn 3-5 interactions quan trọng nhất với user:

```
Framework để chọn interactions:
┌────────────────────────────────────────────────────────────┐
│ Câu hỏi 1: User làm gì NHIỀU NHẤT?                       │
│   → Search, filter, type vào form, click button chính     │
│                                                            │
│ Câu hỏi 2: Cái gì QUAN TRỌNG NHẤT cho business?          │
│   → Checkout flow, submit đơn hàng, send message          │
│                                                            │
│ Câu hỏi 3: User PHÀN NÀN về cái gì?                      │
│   → Kiểm tra support tickets, user interviews             │
│                                                            │
│ Target: < 100ms = instant feel                            │
│         100-300ms = noticeable nhưng OK                   │
│         > 300ms = frustrating                             │
│         > 1000ms = unacceptable                           │
└────────────────────────────────────────────────────────────┘

Ví dụ interactions cần track:
  Gmail: "Click Compose" → "Email composer opens"
  Jira:  "Click Create Issue" → "Modal opens"
  Figma: "Select element" → "Toolbar updates"
  Slack: "Click channel" → "Messages render"
```

---

### Step 2: Đo Interaction Duration — `measureInteraction()`

**Thách thức:** React renders bất đồng bộ — không thể đo bằng `Date.now()` trước và sau `setState` vì render chưa xong khi `setState` return.

**Giải pháp:** Đo từ event handler đến frame tiếp theo sau khi React render xong.

```typescript
// Approach 1: Đơn giản với performance.now()
function measureInteraction(interactionName: string) {
  const startTime = performance.now();

  return {
    end() {
      const duration = performance.now() - startTime;
      console.log(`${interactionName}: ${duration.toFixed(1)}ms`);
      return duration;
    }
  };
}

// Dùng:
const handleSearch = (query: string) => {
  const interaction = measureInteraction('search');
  setSearchQuery(query);  // Trigger React re-render
  // ← Nhưng render chưa xong ở đây!
  // interaction.end() quá sớm → đo không đúng!
};
```

```typescript
// Approach 2: afterFrame helper — đo sau khi browser paint xong
// afterFrame: runs callback sau khi browser đã paint frame kế tiếp
function afterFrame(callback: () => void) {
  // requestAnimationFrame: fires trước paint
  // setTimeout 0: fires sau paint (mẹo để chờ frame hoàn tất)
  requestAnimationFrame(() => {
    setTimeout(callback, 0);
  });
}

function measureInteraction(interactionName: string) {
  const startTime = performance.now();

  return {
    end() {
      afterFrame(() => {
        const duration = performance.now() - startTime;
        // Lúc này: browser đã render và paint xong!
        sendToMonitoring(interactionName, duration);
      });
    }
  };
}

// Dùng:
const handleSearch = (query: string) => {
  const interaction = measureInteraction('Search Results');
  setSearchQuery(query);  // React sẽ re-render
  interaction.end();       // end() sẽ tự chờ render + paint xong
};
```

```typescript
// Approach 3: performance.mark + performance.measure (RECOMMENDED)
// → Visible trong Chrome DevTools Performance tab!
// → Có thể đọc bởi PerformanceObserver từ monitoring scripts độc lập

function measureInteraction(interactionName: string) {
  const markName = `${interactionName}:start`;
  performance.mark(markName);

  return {
    end() {
      afterFrame(() => {
        performance.measure(
          interactionName,  // Tên measure — xuất hiện trong DevTools!
          markName          // Start mark
          // End: auto = now
        );

        // Đọc measurement
        const [measure] = performance.getEntriesByName(interactionName);
        sendToMonitoring(interactionName, measure.duration);

        // Cleanup
        performance.clearMarks(markName);
        performance.clearMeasures(interactionName);
      });
    }
  };
}
```

```
Chrome DevTools Performance tab với performance.measure():
┌────────────────────────────────────────────────────────────┐
│  Timings row:                                             │
│  │███ Search Results (145ms) ███│                        │
│                                                            │
│  → Bạn thấy ngay interaction này mất bao lâu             │
│  → Correlate với JS flame chart bên dưới                 │
│  → Biết ngay component nào gây chậm!                     │
└────────────────────────────────────────────────────────────┘
```

**Gotcha với React 18 Concurrent Mode:**

```typescript
// ⚠️ useTransition + afterFrame = sai!
const ComposeButton = () => {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    const interaction = measureInteraction('Open Composer');
    startTransition(() => {
      setIsComposerOpen(true);
    });
    interaction.end(); // ← afterFrame fires TOO EARLY!
    // Concurrent rendering có thể tiếp tục sau afterFrame!
  };
};

// ✅ Fix: Dùng useEffect thay vì afterFrame với concurrent mode
// (kém chính xác hơn nhưng đúng với concurrent rendering)
const ComposeButton = () => {
  const [isPending, startTransition] = useTransition();
  const interactionRef = useRef<ReturnType<typeof measureInteraction> | null>(null);

  const handleClick = () => {
    interactionRef.current = measureInteraction('Open Composer');
    startTransition(() => {
      setIsComposerOpen(true);
    });
  };

  useEffect(() => {
    if (isComposerOpen && interactionRef.current) {
      const duration = performance.now() - interactionRef.current.startTime;
      sendToMonitoring('Open Composer', duration);
      interactionRef.current = null;
    }
  }, [isComposerOpen]);
};
```

---

### Step 3: Gửi Data đến Monitoring Tool (Sentry)

```typescript
// Cập nhật measureInteraction() để send tới Sentry
import * as Sentry from '@sentry/react';

function measureInteraction(interactionName: string) {
  const startTime = performance.now();

  // Tạo Sentry transaction
  const transaction = Sentry.startTransaction({
    name: interactionName,
    op: 'ui.interaction',
  });

  return {
    end() {
      afterFrame(() => {
        const duration = performance.now() - startTime;

        // Finish transaction → Sentry records it
        transaction.finish();

        // Hoặc thêm custom data:
        transaction.setMeasurement('interaction.duration', duration, 'millisecond');
        transaction.setTag('interaction.name', interactionName);
        transaction.setTag('slow', duration > 300 ? 'true' : 'false');
        transaction.finish();
      });
    }
  };
}
```

```
Sentry Dashboard sau khi setup:
┌────────────────────────────────────────────────────────────┐
│ Performance → Transactions                                 │
│                                                            │
│ "Search Results"                                           │
│   P50:  45ms  ← 50% users trải nghiệm ≤ 45ms             │
│   P75:  120ms ← 75% users trải nghiệm ≤ 120ms            │
│   P95:  890ms ← 5% users thấy > 890ms (!) ← ĐÂY LÀ VẤN ĐỀ│
│   Count: 12,450 events/day                                │
│                                                            │
│ "Open Composer"                                           │
│   P50:  23ms                                              │
│   P75:  67ms                                              │
│   P95:  145ms ← OK                                        │
│                                                            │
│ → P95 của Search Results quá cao → cần investigate!       │
└────────────────────────────────────────────────────────────┘

Alternatives to Sentry:
  DataDog → `datadogRum.addTiming(interactionName, duration)`
  New Relic → `newrelic.addPageAction(interactionName, { duration })`
  Custom → POST /api/metrics với { name, duration, timestamp, userId }
```

---

### Step 4: Collect Long Tasks và Events với PerformanceObserver

**Mục đích:** Ngoài specific interactions, track tất cả long tasks (> 50ms) để thấy trends.

```typescript
// Setup PerformanceObserver để track long tasks và slow events
function setupPerformanceMonitoring() {
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      // Bỏ qua events nhanh (< 50ms)
      if (entry.entryType === 'event' && entry.duration < 50) continue;

      sendToDataWarehouse(entry);
    }
  });

  // Track cả long tasks và slow user events
  observer.observe({
    entryTypes: [
      'longtask',  // JS blocks main thread > 50ms
      'event',     // User interaction events (click, keypress...)
    ]
  });
}

// Structure của PerformanceEntry trong Chrome:
// longtask entry:
// {
//   entryType: 'longtask',
//   duration: 234,        // ms
//   startTime: 12345,     // ms từ page load
//   name: 'self',
// }

// event entry (Chrome 102+):
// {
//   entryType: 'event',
//   name: 'click',        // event type
//   duration: 145,        // ms từ event đến next paint
//   startTime: 12345,
//   processingStart: 12346, // ms khi event handler bắt đầu
//   processingEnd: 12490,   // ms khi event handler kết thúc
//   target: <button>,       // DOM element
// }
```

```typescript
// Gửi lên Sentry với context đầy đủ
function sendToDataWarehouse(entry: PerformanceEntry) {
  if (entry.entryType === 'event') {
    const eventEntry = entry as PerformanceEventTiming;

    Sentry.captureMessage('Slow user interaction', {
      level: 'warning',
      extra: {
        duration: eventEntry.duration,
        startTime: eventEntry.startTime,
        eventType: eventEntry.name,         // 'click', 'keypress', etc.
        targetClass: (eventEntry.target as Element)?.className,
        targetId: (eventEntry.target as Element)?.id,
        // Processing time = thời gian JS event handler chạy
        processingTime: eventEntry.processingEnd - eventEntry.processingStart,
        // Rendering time = tổng - processing (time to paint)
        renderTime: eventEntry.duration - (eventEntry.processingEnd - eventEntry.processingStart),
      }
    });
  }

  if (entry.entryType === 'longtask') {
    Sentry.captureMessage('Long task detected', {
      level: 'warning',
      extra: {
        duration: entry.duration,
        startTime: entry.startTime,
        // Current URL khi long task xảy ra
        url: window.location.href,
        // Sentry breadcrumbs cung cấp context (xem bên dưới)
      }
    });
  }
}
```

**Thêm Breadcrumbs để hiểu context của long tasks:**

```typescript
// Sentry breadcrumbs: ghi lại "lịch sử" của user trước long task
// → Giúp trả lời: "User đã làm gì trước khi long task xảy ra?"

// Setup breadcrumb tracking
function setupBreadcrumbs() {
  // Track mọi navigation
  window.addEventListener('popstate', () => {
    Sentry.addBreadcrumb({
      category: 'navigation',
      message: `Navigated to ${window.location.pathname}`,
      level: 'info',
    });
  });

  // Track important user actions
  document.addEventListener('click', (e) => {
    const target = e.target as Element;
    if (target.tagName === 'BUTTON' || target.closest('[data-track]')) {
      Sentry.addBreadcrumb({
        category: 'user.click',
        message: `Clicked: ${target.textContent?.slice(0, 50)}`,
        data: { elementId: target.id, className: target.className },
        level: 'info',
      });
    }
  });
}

// Kết quả: Khi long task xảy ra, Sentry hiển thị:
// Breadcrumbs:
//   [10:00:00] User navigated to /dashboard
//   [10:00:02] User clicked: "Load More"
//   [10:00:03] User clicked: "Filter by Date"
//   [10:00:04] ← LONG TASK 456ms xảy ra ở đây!
// → Developer biết ngay: long task liên quan đến "Filter by Date" action
```

---

### Step 5: Monitor và Alert

```typescript
// React Error Boundary + Performance wrapper
// Tự động track slow renders và errors

import { Profiler } from 'react';

function onRenderCallback(
  id: string,              // Component tree "id"
  phase: 'mount' | 'update',
  actualDuration: number,  // Thời gian render thực tế (ms)
  baseDuration: number,    // Ước tính nếu không có memoization
  startTime: number,
  commitTime: number,
) {
  // Chỉ report slow renders
  if (actualDuration > 16) { // > 1 frame (16ms = 60fps)
    console.warn(`Slow render: ${id} took ${actualDuration.toFixed(1)}ms`);

    if (actualDuration > 100) {
      Sentry.captureMessage('Very slow React render', {
        extra: { componentId: id, duration: actualDuration, phase }
      });
    }
  }
}

// Wrap component trees cần monitor
function Dashboard() {
  return (
    <Profiler id="Dashboard" onRender={onRenderCallback}>
      <DashboardContent />
    </Profiler>
  );
}
```

**Setup Alerts:**

```
Sentry Alerts Setup:
┌────────────────────────────────────────────────────────────┐
│ Alert 1: P75 Interaction > 300ms                          │
│   Trigger: avg(Search Results.duration) > 300ms           │
│   Period: Last 1 hour                                     │
│   Action: Slack notification → #performance-alerts        │
│                                                            │
│ Alert 2: Long Tasks tăng đột biến                        │
│   Trigger: count(Long task) > 2x baseline                │
│   Period: Last 15 minutes                                 │
│   Action: PagerDuty alert → on-call engineer             │
│                                                            │
│ Alert 3: Slow renders tăng sau deploy                    │
│   Trigger: count(Very slow React render) > 100/hour      │
│   Action: Email to team lead                              │
└────────────────────────────────────────────────────────────┘
```

---

### Synthetic Testing — Bắt Regressions Trước khi Deploy

**RUM** (Real User Monitoring) bắt regressions SAU khi xảy ra. **Synthetic Testing** bắt TRƯỚC — trong CI/CD.

```typescript
// playwright.perf.test.ts — Synthetic performance test
import { test, expect } from '@playwright/test';

test('Search interaction < 200ms', async ({ page }) => {
  await page.goto('/');

  // Inject measurement helper
  await page.evaluate(() => {
    window.__perfMeasurements = {};

    // Override search handler để capture timing
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const start = performance.now();
      const result = await originalFetch(...args);
      window.__perfMeasurements['fetchDuration'] = performance.now() - start;
      return result;
    };
  });

  // Measure: click search → results appear
  const startTime = Date.now();
  await page.fill('[data-testid="search-input"]', 'performance');
  await page.waitForSelector('[data-testid="search-results"]');
  const duration = Date.now() - startTime;

  // Fail test nếu chậm hơn budget
  expect(duration).toBeLessThan(200);

  // Store cho comparison với runs trước
  console.log(`Search interaction: ${duration}ms`);
});

// Hoặc dùng Lighthouse Timespan mode:
import { playAudit } from 'playwright-lighthouse';

test('Measure Search INP with Lighthouse', async ({ page, browserContext }) => {
  await page.goto('/');

  // Start Lighthouse Timespan
  const result = await playAudit({
    page,
    thresholds: {
      'interaction-to-next-paint': 200, // INP < 200ms
    },
    config: {
      extends: 'lighthouse:default',
      settings: { onlyAudits: ['interaction-to-next-paint'] },
    },
  });

  expect(result.lhr.audits['interaction-to-next-paint'].numericValue).toBeLessThan(200);
});
```

**So sánh với baseline — tránh noise:**

```
❌ Sai: So sánh với lần chạy trước
  Run N-1: 145ms
  Run N:   160ms → "Chậm hơn 10%!" (có thể chỉ là noise!)

✅ Đúng: So sánh với trung bình 4-40 lần chạy gần nhất
  Average(last 20 runs): 150ms
  Run N: 160ms → "+7% — nằm trong khoảng noise" → PASS

  Average(last 20 runs): 150ms
  Run N: 380ms → "+153% — regression thực sự!" → FAIL + Alert
```

---

### Kinh nghiệm thực tế từ clients

```
Real-world feedback từ 3perf clients:

Client F (SUCCESS):
  "Tracks significant interactions + long tasks vào data warehouse.
  Đã dùng nhiều năm — metrics rõ ràng show khi nào app chậm đi.
  Không dùng afterFrame — mỗi interaction có cách đo riêng."

Client Y (SUCCESS):
  "Track long tasks → Sentry.
  Điểm mấu chốt: thêm custom breadcrumbs khắp app.
  Mỗi long task có history: 'User click A → 2s sau click B → long task.'
  → Hiểu ngay context, fix nhanh."

Client A (FAILED):
  "Setup interaction tracking nhưng sau đó disable.
  Feedback: 'Numbers không có nghĩa với variables như user system
  resources, app và data size.'"
  
  → Bài học: Raw numbers cần CONTEXT mới có ý nghĩa!
    Segment by: device type, connection speed, data volume
    Dùng P75/P95 thay vì average (average bị skewed bởi outliers)
```

---

### Tổng kết: 5-Step Monitoring Setup

```
┌────────────────────────────────────────────────────────────┐
│ Step 1: Xác định 3-5 interactions quan trọng nhất         │
│         → Hỏi: user làm gì nhiều nhất? Business care gì? │
│                                                            │
│ Step 2: Instrument interactions với measureInteraction()  │
│         → performance.mark() + performance.measure()      │
│         → afterFrame() để chờ render + paint xong        │
│         → useEffect thay thế nếu dùng useTransition      │
│                                                            │
│ Step 3: Gửi tới Sentry (hoặc DataDog, New Relic)         │
│         → Sentry.startTransaction() / captureMessage()    │
│         → Track P50, P75, P95 — không chỉ average        │
│                                                            │
│ Step 4: PerformanceObserver cho long tasks + events       │
│         → Thấy trends tổng thể                            │
│         → Custom breadcrumbs cho context                  │
│                                                            │
│ Step 5: Alerts + Synthetic Testing trong CI               │
│         → Alert khi P75 > threshold                       │
│         → Playwright + Lighthouse Timespan cho CI         │
│         → So sánh với avg(last 20 runs), không phải run-1 │
└────────────────────────────────────────────────────────────┘

Tools ecosystem:
  RUM:        Sentry, DataDog, New Relic, SpeedCurve
  Synthetic:  Playwright, Puppeteer, k6, Lighthouse CI
  Built-in:   PerformanceObserver, React Profiler API
  Metrics:    INP (Interaction to Next Paint) → Core Web Vital
```


---

## Deep Dive: Webpack Optimization — 3 Pillars để giảm Bundle Size

> **Nguồn:** [web.dev/articles/webpack](https://web.dev/articles/webpack) — Google Web.dev
>
> Guide chính thức từ Google về tối ưu webpack cho production. Bài chia thành 3 pillars: **Decrease Front-End Size**, **Code Splitting**, và **Long-term Caching** — 3 mục tiêu bổ sung cho nhau để có một build pipeline thực sự tối ưu.

### Bức tranh tổng quan: 3 Pillars

```
3 Webpack Optimization Pillars:
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│   Pillar 1            Pillar 2           Pillar 3             │
│   ─────────           ─────────          ─────────            │
│   Decrease            Code               Long-term            │
│   Bundle Size         Splitting          Caching              │
│                                                                │
│   Goal: Nhỏ hơn       Goal: Load         Goal: Không          │
│         → Parse       chỉ cái cần        download lại         │
│           nhanh         → Faster TTI     khi không cần        │
│                                                                │
│   Techniques:         Techniques:        Techniques:          │
│   - mode:production   - React.lazy       - contenthash        │
│   - Tree shaking      - dynamic import   - splitChunks        │
│   - Bundle analyzer   - splitChunks      - runtimeChunk       │
│   - Optimize deps     - vendor split     - deterministic IDs  │
│   - Externalize       - route split                           │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

### Pillar 1: Decrease Front-End Size

#### 1.1 Production Mode — Bước đầu tiên và quan trọng nhất

```javascript
// webpack.config.js
module.exports = {
  mode: 'production', // ← 1 dòng này bật rất nhiều optimizations!
};

// mode: 'production' tự động bật:
// ✅ Minification (Terser) — loại bỏ whitespace, rút ngắn tên biến
// ✅ Tree shaking — xóa unused exports
// ✅ Module concatenation (Scope Hoisting) — giảm wrapper functions
// ✅ process.env.NODE_ENV = 'production' — libraries strip dev code
// ✅ Deterministic chunk IDs — stable hashes cho caching
```

```
Tác động của mode: 'production' vs 'development':
┌────────────────────────────────────────────────────────────┐
│ File             │ development │ production │ Reduction    │
├────────────────────────────────────────────────────────────┤
│ React bundle     │ 1.0 MB      │ 112 KB     │ -89%         │
│ App bundle       │ 800 KB      │ 180 KB     │ -78%         │
│ vendor bundle    │ 2.4 MB      │ 640 KB     │ -73%         │
│ Total            │ 4.2 MB      │ 932 KB     │ -78%         │
└────────────────────────────────────────────────────────────┘
```

#### 1.2 Phân tích bundle với webpack-bundle-analyzer

```bash
npm install --save-dev webpack-bundle-analyzer
```

```javascript
// webpack.config.js
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = {
  plugins: [
    new BundleAnalyzerPlugin({
      // Mở browser với interactive treemap
      analyzerMode: 'static',     // Tạo report.html (không mở browser)
      reportFilename: 'bundle-report.html',
      openAnalyzer: false,        // Set true để tự mở
    }),
  ],
};

// npm run build → mở bundle-report.html
// → Xem block to nhất là gì → đó là mục tiêu optimize đầu tiên!
```

```
Bundle Analyzer giúp phát hiện:
┌────────────────────────────────────────────────────────────┐
│ 🔴 moment.js: 65KB (chỉ dùng 1-2 functions!)             │
│    Fix: Thay bằng date-fns (tree-shakeable) hoặc dayjs    │
│                                                            │
│ 🔴 lodash: 70KB (chỉ dùng _.get và _.set)                │
│    Fix: import get from 'lodash/get' (2KB) thay vì toàn bộ│
│                                                            │
│ 🔴 Duplicate: react được include 2 lần!                  │
│    Fix: Kiểm tra npm ls react, resolve duplicate deps     │
│                                                            │
│ 🟡 Locale files của moment/date-fns: 40KB                │
│    Fix: webpack.ContextReplacementPlugin để exclude       │
└────────────────────────────────────────────────────────────┘
```

#### 1.3 Optimize Dependencies — Tìm và thay thế thư viện béo

```javascript
// ❌ Import cả thư viện — KHÔNG tree-shakeable
import _ from 'lodash';                    // 70KB
import moment from 'moment';               // 65KB + 40KB locales
import { isEqual } from 'lodash';          // Vẫn 70KB! (CommonJS)

// ✅ Import chỉ method cần
import get from 'lodash/get';              // 2KB
import set from 'lodash/set';              // 1KB
import { isEqual } from 'lodash-es';       // ~2KB (ES module, tree-shakeable)

// ✅ Thay thư viện to bằng thư viện nhỏ hơn
import { format } from 'date-fns';         // ~2KB (thay vì moment 65KB)
import dayjs from 'dayjs';                // 2KB (API tương tự moment)
```

```javascript
// webpack.config.js — Loại bỏ moment.js locales (tốn 40KB!)
const webpack = require('webpack');

module.exports = {
  plugins: [
    // Chỉ giữ locale 'vi' và 'en'
    new webpack.ContextReplacementPlugin(
      /moment[/\\]locale$/,
      /vi|en/
    ),
  ],
};
```

#### 1.4 Tree Shaking — Đảm bảo hoạt động đúng

```javascript
// babel.config.js — QUAN TRỌNG: Không transform ES modules!
module.exports = {
  presets: [
    ['@babel/preset-env', {
      modules: false, // ← Bắt buộc! 'auto' hoặc 'commonjs' sẽ break tree-shaking
      // modules: false → Giữ import/export → webpack có thể tree-shake
      // modules: 'commonjs' → Chuyển thành require() → webpack KHÔNG tree-shake được
    }]
  ]
};

// package.json của library
{
  "sideEffects": false,      // ← Nói webpack: "Tất cả files đều pure"
  // Hoặc list cụ thể files CÓ side effects:
  "sideEffects": [
    "./src/styles/global.css",  // CSS imports có side effects!
    "./src/polyfills.js"
  ]
}
```

```
Tree shaking workflow:
  1. webpack reads "sideEffects" from package.json
  2. webpack marks unused exports as "dead code"
  3. Terser eliminates dead code during minification

Common tree-shaking pitfalls:
  ❌ Babel transforms ESM → CJS → no tree-shaking
  ❌ Library uses "sideEffects: true" or missing field
  ❌ Import a namespace: import * as utils → tree-shaking disabled
  ✅ Named imports: import { specific } from 'lib' → tree-shakeable
```

#### 1.5 Externalize Dependencies — Load từ CDN

```javascript
// webpack.config.js
module.exports = {
  externals: {
    // Nói webpack: "react" không bundle vào, dùng global window.React
    'react': 'React',
    'react-dom': 'ReactDOM',
  },
};

// index.html — Load từ CDN với long-term cache
// CDN đã được tối ưu, global cached across sites!
```

```html
<head>
  <!-- React từ CDN — shared cache với millions of sites -->
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
</head>
```

```
Externalize trade-offs:
✅ Bundle nhỏ hơn (React 112KB → 0KB trong bundle)
✅ CDN cache — users có thể đã có cached React từ site khác
✅ CDN infrastructure tốt hơn server của bạn

❌ Extra HTTP request (ảnh hưởng TTFB)
❌ Phụ thuộc CDN availability
❌ Nếu CDN down → app break
❌ Không kiểm soát version cụ thể

→ Chỉ externalize với libraries THỰC SỰ phổ biến (React, Vue)
  và khi user base đủ lớn để benefit từ CDN cache sharing
```

---

### Pillar 2: Code Splitting

#### 2.1 Route-based Splitting với React.lazy

```javascript
// webpack.config.js — dynamic import tự động tạo chunk
// Không cần config gì thêm! webpack tự xử lý

// App.tsx — Route-based code splitting
import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

// Mỗi lazy() call → webpack tạo 1 chunk file riêng
const HomePage      = lazy(() => import('./pages/HomePage'));
const Dashboard     = lazy(() => import('./pages/Dashboard'));
const SettingsPage  = lazy(() => import('./pages/Settings'));
const AdminPanel    = lazy(() => import('./pages/Admin'));
// ↑ Admin chỉ dành cho ~1% users nhưng hiện tại vẫn load cho tất cả!

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/"          element={<HomePage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings"  element={<SettingsPage />} />
        <Route path="/admin"     element={<AdminPanel />} />
      </Routes>
    </Suspense>
  );
}
```

```
Bundle output với code splitting:
BEFORE (no splitting):
  main.js: 2.4MB ← tất cả pages trong 1 file

AFTER (route splitting):
  main.js:          320KB  ← core app + home
  dashboard.chunk:  450KB  ← chỉ load khi vào /dashboard
  settings.chunk:   180KB  ← chỉ load khi vào /settings
  admin.chunk:      290KB  ← chỉ load khi vào /admin (1% users!)

Initial load (home page):
  BEFORE: 2.4MB download
  AFTER:  320KB download (-87%!)
```

#### 2.2 Vendor Splitting — Tách node_modules

```javascript
// webpack.config.js
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        // Tách toàn bộ node_modules thành "vendors" chunk
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 10,
        },
        // Tách React riêng (ít thay đổi nhất)
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom|react-router)[\\/]/,
          name: 'vendor-react',
          chunks: 'all',
          priority: 20, // Higher priority = được xử lý trước
        },
        // Tách UI library (cũng ít thay đổi)
        ui: {
          test: /[\\/]node_modules[\\/](@mui|antd|@chakra-ui)[\\/]/,
          name: 'vendor-ui',
          chunks: 'all',
          priority: 15,
        },
      },
    },
  },
};
```

```
Caching benefit từ vendor splitting:
┌────────────────────────────────────────────────────────────┐
│ Deploy A:                    Deploy B (bug fix in App):    │
│   vendor-react.abc123.js       vendor-react.abc123.js ← SAME│
│   vendor-ui.def456.js          vendor-ui.def456.js    ← SAME│
│   app.ghi789.js                app.jkl012.js          ← NEW │
│                                                            │
│ User đã có cache từ Deploy A:                             │
│   vendor-react: CACHED ✅ (0 download)                    │
│   vendor-ui: CACHED ✅ (0 download)                        │
│   app: Download 180KB (chỉ app code thay đổi)             │
│                                                            │
│ BEFORE (monolithic): Mọi deploy → user download 2.4MB     │
│ AFTER (split):       Bug fix deploy → user chỉ download   │
│                      180KB (app chunk mới)                 │
└────────────────────────────────────────────────────────────┘
```

#### 2.3 Component-level Splitting với dynamic import

```typescript
// Không chỉ split theo route — split theo feature/component
// Khi component nặng và không cần ngay

// ❌ Import static — luôn bundle vào main
import { HeavyChart } from './HeavyChart'; // 400KB D3 chart library!

// ✅ Dynamic import — chỉ load khi cần
const HeavyChart = lazy(() =>
  import('./HeavyChart').then(m => ({ default: m.HeavyChart }))
);

// Hover-to-load pattern — load khi user hover vào button
function ReportSection() {
  const [showChart, setShowChart] = useState(false);

  return (
    <div>
      <button
        onMouseEnter={() => {
          // Preload chunk khi hover — chunk sẵn sàng khi click!
          import('./HeavyChart');
        }}
        onClick={() => setShowChart(true)}
      >
        View Chart
      </button>

      {showChart && (
        <Suspense fallback={<ChartSkeleton />}>
          <HeavyChart data={data} />
        </Suspense>
      )}
    </div>
  );
}
```

---

### Pillar 3: Long-term Caching

#### 3.1 Content Hash — Tên file thay đổi khi nội dung thay đổi

```javascript
// webpack.config.js — Complete caching setup
module.exports = {
  output: {
    // [contenthash:8] → 8 ký tự hex từ content hash
    filename: '[name].[contenthash:8].js',
    chunkFilename: '[name].[contenthash:8].js',
    // app.a1b2c3d4.js
    // vendors.ef5g6h7i.js
    // dashboard.deadbeef.js
  },

  optimization: {
    // Tách webpack runtime ra riêng
    // → Thay đổi chunk IDs không làm thay đổi vendor hash!
    runtimeChunk: 'single',

    // Deterministic IDs — stable hashes giữa các builds
    moduleIds: 'deterministic',
    chunkIds: 'deterministic',

    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    },
  },
};
```

```
Vì sao runtimeChunk: 'single' quan trọng:
┌────────────────────────────────────────────────────────────┐
│ Vấn đề không có runtimeChunk:                             │
│   webpack runtime (bootstrap) được nhúng vào main.js      │
│   Runtime chứa: chunk IDs và module IDs                   │
│   Khi thêm 1 file mới → module IDs thay đổi               │
│   → Runtime thay đổi → main.js hash thay đổi              │
│   → vendor hash cũng thay đổi! (vì vendor được import     │
│      bởi main)                                             │
│   → User phải download lại vendor dù code không đổi!      │
│                                                            │
│ Với runtimeChunk: 'single':                               │
│   runtime.abc.js (2KB) — thay đổi khi chunk IDs thay đổi │
│   vendor.def.js (640KB) — CHỈ thay đổi khi vendor code đổi│
│   app.ghi.js (180KB) — thay đổi khi app code đổi          │
│   → Mỗi chunk độc lập, cache riêng, invalidate riêng!    │
└────────────────────────────────────────────────────────────┘
```

#### 3.2 HTTP Headers + Content Hash = Perfect Caching

```
Complete caching setup với nginx:

# Versioned JS/CSS (có contenthash trong tên):
/static/app.a1b2c3d4.js
/static/vendor.ef5g6h7i.js
  → Cache-Control: max-age=31536000, immutable

# HTML (không có hash, reference đến hashed assets):
/index.html
  → Cache-Control: no-cache
  → ETag: enabled

# Images với hash:
/static/logo.deadbeef.svg
  → Cache-Control: max-age=31536000, immutable
```

```javascript
// webpack.config.js + HtmlWebpackPlugin → tự động inject đúng script tags
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
      // Tự động inject:
      // <script src="/static/vendor.ef5g6h7i.js" defer></script>
      // <script src="/static/runtime.abc123.js" defer></script>
      // <script src="/static/app.a1b2c3d4.js" defer></script>
    }),
  ],
};
```

---

### Complete webpack.config.js — Production Ready

```javascript
// webpack.config.js — Production-optimized config
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const webpack = require('webpack');

const isAnalyze = process.env.ANALYZE === 'true';

module.exports = {
  mode: 'production', // ← Pillar 1: Enable all production optimizations

  entry: './src/index.tsx',

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'static/js/[name].[contenthash:8].js',       // Pillar 3
    chunkFilename: 'static/js/[name].[contenthash:8].js',  // Pillar 3
    publicPath: '/',
    clean: true,
  },

  optimization: {
    // Pillar 3: Stable hashes
    runtimeChunk: 'single',
    moduleIds: 'deterministic',
    chunkIds: 'deterministic',

    // Pillar 2: Code splitting
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        reactVendor: {
          test: /[\\/]node_modules[\\/](react|react-dom|react-router-dom)[\\/]/,
          name: 'vendor-react',
          priority: 30,
        },
        uiVendor: {
          test: /[\\/]node_modules[\\/](@mui|antd)[\\/]/,
          name: 'vendor-ui',
          priority: 20,
        },
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendor-others',
          priority: 10,
        },
      },
    },
  },

  plugins: [
    new HtmlWebpackPlugin({ template: './public/index.html' }),

    new MiniCssExtractPlugin({
      filename: 'static/css/[name].[contenthash:8].css',
    }),

    // Pillar 1: Strip moment.js locales
    new webpack.ContextReplacementPlugin(
      /moment[/\\]locale$/,
      /vi|en/
    ),

    // Analysis (chỉ chạy khi ANALYZE=true)
    ...(isAnalyze ? [new BundleAnalyzerPlugin()] : []),
  ],
};

// Usage:
// npm run build              → Normal production build
// ANALYZE=true npm run build → Build + open bundle analyzer
```

---

### Workflow: Từ "không biết" đến "tối ưu"

```
Step-by-step Optimization Process:
┌────────────────────────────────────────────────────────────┐
│ Step 1: Measure hiện trạng                                │
│   ANALYZE=true npm run build                              │
│   → Xem bundle-report.html                               │
│   → Note top 3 largest blocks                             │
│                                                            │
│ Step 2: Quick wins (không break anything)                 │
│   ✅ mode: 'production' (nếu chưa có)                     │
│   ✅ contenthash trong filename                           │
│   ✅ runtimeChunk: 'single'                               │
│   ✅ moduleIds: 'deterministic'                           │
│                                                            │
│ Step 3: Optimize dependencies                             │
│   ✅ lodash → lodash/method hoặc lodash-es               │
│   ✅ moment → date-fns hoặc dayjs                         │
│   ✅ Remove unused dependencies                           │
│   ✅ Check cho duplicate packages (npm ls)                │
│                                                            │
│ Step 4: Code splitting                                    │
│   ✅ Route-based: React.lazy cho mỗi page                │
│   ✅ Vendor split: react / ui-lib / others                │
│   ✅ Feature split: heavy components                      │
│                                                            │
│ Step 5: Measure kết quả                                   │
│   ANALYZE=true npm run build (so sánh với Step 1)        │
│   Lighthouse → Total JS size, TTI                        │
│   WebPageTest → Waterfall, cache behavior                 │
└────────────────────────────────────────────────────────────┘

Expected results sau khi optimize:
  Initial bundle:   -40-80% smaller
  Vendor cache hit: 95%+ (vendor ít thay đổi)
  TTI:              -1-3s faster
  Returning users:  -80-90% less download (cache hits!)
```


---

## Deep Dive: INP (Interaction to Next Paint) — Core Web Vital về Responsiveness

> **Nguồn:** [web.dev/articles/inp](https://web.dev/articles/inp) — Google Web.dev
>
> Kể từ tháng 3/2024, **INP thay thế FID** (First Input Delay) và trở thành Core Web Vital chính thức đo lường **responsiveness tổng thể** của trang web. Đây là metric khó đạt được nhất trong 3 Core Web Vitals — vì nó đo lường MỌILẦN user tương tác, không chỉ lần đầu tiên.

### INP là gì và tại sao quan trọng hơn FID?

```
FID (cũ) vs INP (mới):
┌────────────────────────────────────────────────────────────┐
│ FID (First Input Delay):                                  │
│   - Đo delay của interaction ĐẦU TIÊN                     │
│   - Chỉ đo "input delay" (không đo processing + paint)   │
│   - User có thể bị chậm ở interactions sau → FID vẫn OK  │
│   - Dễ "game": optimize lần đầu, bỏ qua phần còn lại     │
│                                                            │
│ INP (Interaction to Next Paint):                          │
│   - Đo TẤT CẢ interactions trong suốt session            │
│   - Lấy interaction CHẬM NHẤT (bỏ một số outliers)       │
│   - Đo đầy đủ: input delay + processing + presentation    │
│   - Không thể "game" — phải tối ưu toàn bộ app           │
│                                                            │
│ INP chính xác hơn vì:                                     │
│   User sử dụng app nhiều giờ — FID chỉ đo giây đầu tiên  │
│   FID = 10ms nhưng sau đó click nào cũng lag 800ms?       │
│   FID: "Good" ✅  INP: "Poor" ❌ ← INP phản ánh đúng hơn │
└────────────────────────────────────────────────────────────┘
```

---

### INP Thresholds và Scoring

```
INP Score Thresholds (tại P75 của page loads):
┌────────────────────────────────────────────────────────────┐
│                                                            │
│   ≤ 200ms    200-500ms    > 500ms                         │
│   ┌──────┐   ┌────────┐   ┌──────┐                       │
│   │ GOOD │   │ NEEDS  │   │ POOR │                       │
│   │  ✅  │   │ IMPROV │   │  ❌  │                       │
│   └──────┘   └────────┘   └──────┘                       │
│                                                            │
│ Target: INP ≤ 200ms tại P75                               │
│ P75 = 75% users có INP ≤ giá trị này                     │
│                                                            │
│ Qualifying interactions (được đo):                        │
│   ✅ Mouse click                                          │
│   ✅ Touchscreen tap                                       │
│   ✅ Keyboard press (Enter, Space, letter keys...)         │
│                                                            │
│ NOT qualifying (không đo):                                │
│   ❌ Scrolling (scroll)                                   │
│   ❌ Hovering (mouseover, mouseenter)                     │
│   ❌ Zooming (pinch-to-zoom)                              │
│                                                            │
│ INP = longest interaction của session                     │
│ (sau khi bỏ một số outliers nếu interactions > 50 lần)   │
└────────────────────────────────────────────────────────────┘
```

---

### 3 Phases của mọi Interaction

```
Mỗi interaction bao gồm 3 phases — cộng lại = INP duration:

User clicks button
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│ Phase 1: INPUT DELAY                                        │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│ Từ: User input (click/tap/key)                             │
│ Đến: Event handler bắt đầu chạy                           │
│                                                             │
│ Gây ra bởi: Long tasks đang chạy trên main thread!        │
│   setTimeout callback, rendering, parsing JS...            │
│   Browser phải chờ task hiện tại xong mới handle event    │
│                                                             │
│ Fix: Yield to main thread, break up long tasks             │
├─────────────────────────────────────────────────────────────┤
│ Phase 2: PROCESSING TIME                                    │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│ Từ: Event handler bắt đầu                                 │
│ Đến: Event handler kết thúc                               │
│                                                             │
│ Gây ra bởi: Code trong event handler quá nặng             │
│   setState → massive re-render, complex calculations...    │
│                                                             │
│ Fix: Optimize event handler, defer non-critical work       │
├─────────────────────────────────────────────────────────────┤
│ Phase 3: PRESENTATION DELAY                                 │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│ Từ: Event handler kết thúc                                │
│ Đến: Browser paint frame mới lên màn hình                 │
│                                                             │
│ Gây ra bởi: Expensive style/layout/paint                  │
│   Layout thrashing, large DOM, complex CSS...              │
│                                                             │
│ Fix: Reduce DOM size, avoid layout thrashing, CSS contain  │
└─────────────────────────────────────────────────────────────┘

INP = Input Delay + Processing Time + Presentation Delay
```

```
DevTools visualization (Performance tab > Interactions track):

Time  →
│
│     [User Click]
│          │
│          ├─────── Input Delay (45ms): Waiting for JS task ──────┤
│          │                                                       │
│          │               ├── Processing (120ms): React render ──┤
│          │               │                                       │
│          │               │                   ├── Presentation ──┤
│          │               │                   │   (35ms): Paint  │
│          │               │                   │                  │
│          └───────────────┴───────────────────┴──────────────────►
│          ↑                                                       ↑
│       Clicked                                             Next Paint
│          └───────────── INP = 200ms total ─────────────────────┘
```

---

### Nguyên nhân gây INP cao — và cách fix

#### Fix Phase 1: Giảm Input Delay — Yield to Main Thread

```javascript
// Vấn đề: Long task block main thread → input delay cao
// Khi JS chạy 300ms liên tục → mọi click trong 300ms đó bị delay!

// ❌ BAD: Synchronous long task
function processLargeDataset(data) {
  // Chạy 400ms — block toàn bộ main thread!
  return data.map(item => expensiveTransform(item));
}

// ✅ FIX 1: scheduler.yield() — Modern API (Chrome 115+)
async function processLargeDataset(data) {
  const results = [];
  for (const item of data) {
    results.push(expensiveTransform(item));

    // Yield mỗi ~50ms để browser có thể handle user input
    if (results.length % 100 === 0) {
      await scheduler.yield(); // Pause, let browser handle pending events
      // Sau yield: task tiếp tục với priority cao (không bị queue sau tasks khác)
    }
  }
  return results;
}

// ✅ FIX 2: setTimeout — Fallback (ít tối ưu hơn scheduler.yield)
function processInChunks(data, onComplete) {
  const CHUNK_SIZE = 50;
  let index = 0;

  function processChunk() {
    const end = Math.min(index + CHUNK_SIZE, data.length);
    while (index < end) {
      expensiveTransform(data[index]);
      index++;
    }

    if (index < data.length) {
      setTimeout(processChunk, 0); // Yield sau mỗi chunk
    } else {
      onComplete();
    }
  }

  processChunk();
}
```

```
scheduler.yield() vs setTimeout(fn, 0):
┌────────────────────────────────────────────────────────────┐
│ setTimeout(fn, 0):                                        │
│   Task queue: [other tasks...] → [your continuation]     │
│   → Continuation chạy SAU tất cả tasks đã queue          │
│   → Có thể delay thêm nếu có nhiều tasks                 │
│                                                            │
│ scheduler.yield():                                        │
│   → Continuation được queue với PRIORITY cao              │
│   → Chạy trước non-user-visible tasks                    │
│   → Chỉ pending user interactions được ưu tiên hơn       │
│   → Tốt hơn trong practice!                              │
└────────────────────────────────────────────────────────────┘
```

#### Fix Phase 2: Giảm Processing Time — Optimize Event Handlers

```typescript
// ❌ BAD: Event handler làm quá nhiều việc synchronously
const handleFilterChange = (newFilter: string) => {
  // 1. Filter 10,000 items — 80ms
  const filtered = allItems.filter(item => matchesFilter(item, newFilter));
  // 2. Sort — 40ms
  const sorted = filtered.sort(complexSort);
  // 3. Transform — 30ms
  const transformed = sorted.map(expensiveTransform);
  // 4. Update state → React re-renders ALL — 150ms
  setDisplayedItems(transformed);
  setFilteredCount(filtered.length);
  setLastFilter(newFilter);
  // Total: 300ms processing time → INP = bad
};

// ✅ FIX: Tách urgent vs non-urgent updates với useTransition
import { useTransition, useDeferredValue, useCallback } from 'react';

function FilteredList() {
  const [filter, setFilter] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleFilterChange = useCallback((newFilter: string) => {
    // URGENT: Update filter input ngay (user needs to see what they typed)
    setFilter(newFilter);

    // NON-URGENT: Heavy computation — React có thể interrupt nếu cần
    startTransition(() => {
      // React 18: Nếu user gõ thêm ký tự trong khi đang compute,
      // React dừng computation này và bắt đầu với filter mới
      const filtered = allItems.filter(item => matchesFilter(item, newFilter));
      const sorted = filtered.sort(complexSort);
      setDisplayedItems(sorted);
    });
  }, [allItems]);

  return (
    <div>
      <input value={filter} onChange={e => handleFilterChange(e.target.value)} />
      {isPending && <Spinner />}  {/* Show spinner khi computing */}
      <ItemList items={displayedItems} />
    </div>
  );
}
```

```typescript
// useDeferredValue — Defer render của expensive component
function SearchResults({ query }: { query: string }) {
  // deferredQuery chỉ update sau khi urgent renders xong
  const deferredQuery = useDeferredValue(query);

  // ExpensiveResults chỉ re-render với deferredQuery
  // → Không block user input với urgent query updates!
  const isStale = query !== deferredQuery;

  return (
    <div style={{ opacity: isStale ? 0.7 : 1 }}> {/* Visual feedback */}
      <ExpensiveResults query={deferredQuery} />
    </div>
  );
}
```

#### Fix Phase 3: Giảm Presentation Delay — Optimize Rendering

```css
/* ❌ Expensive CSS triggers: causes layout/paint */
.item {
  width: calc(100% - 20px); /* Triggers layout */
  height: auto;              /* Triggers layout */
  box-shadow: 0 4px 8px rgba(0,0,0,0.3); /* Triggers paint */
}

/* ✅ GPU-accelerated properties — no layout, no paint */
.item {
  /* Animations: Use transform và opacity — only compositor layer! */
  transform: translateX(0);  /* → Change to translateX(20px) for animation */
  opacity: 1;                /* → Change to opacity: 0 for fade */
  /* These only trigger Composite — fastest possible! */
}

/* content-visibility: auto — skip rendering off-screen content */
.card-list-item {
  content-visibility: auto;
  /* Browser: "Đừng render element này nếu không visible"
     → Massive savings for long lists! */
  contain-intrinsic-size: auto 300px; /* Estimated size for scroll */
}
```

```typescript
// Layout Thrashing: Đọc sau khi write → forced synchronous layout!
// ❌ BAD: Read/write interleaved → browser phải recalculate mỗi lần
function updateItemWidths(items: HTMLElement[]) {
  items.forEach(item => {
    const width = item.offsetWidth; // READ: forces browser to calculate
    item.style.width = width * 0.5 + 'px'; // WRITE: invalidates layout
    // Next iteration: READ again → recalculate again → thrashing!
  });
}

// ✅ GOOD: Batch reads, then batch writes
function updateItemWidths(items: HTMLElement[]) {
  // Batch all reads first
  const widths = items.map(item => item.offsetWidth);

  // Then batch all writes
  items.forEach((item, i) => {
    item.style.width = widths[i] * 0.5 + 'px';
  });
  // Browser chỉ recalculate layout 1 lần!
}
```

---

### Đo lường INP — Công cụ và Code

#### Trong Browser (Field Data)

```javascript
// Dùng web-vitals library để đo INP trong production
import { onINP } from 'web-vitals';

onINP((metric) => {
  // metric.value: INP score (ms)
  // metric.rating: 'good' | 'needs-improvement' | 'poor'
  // metric.entries: PerformanceEventTiming[] — tất cả interactions
  // metric.attribution: {
  //   interactionType: 'click' | 'pointer' | 'keyboard',
  //   interactionTarget: Element,  // DOM element bị tương tác
  //   inputDelay: number,
  //   processingDuration: number,
  //   presentationDelay: number,
  //   loadState: 'loading' | 'dom-interactive' | ...
  // }

  console.log(`INP: ${metric.value}ms (${metric.rating})`);

  // Send to analytics
  if (metric.rating !== 'good') {
    analytics.track('inp_poor', {
      value: metric.value,
      interactionType: metric.attribution?.interactionType,
      targetElement: metric.attribution?.interactionTarget?.tagName,
      inputDelay: metric.attribution?.inputDelay,
      processingDuration: metric.attribution?.processingDuration,
      presentationDelay: metric.attribution?.presentationDelay,
    });
  }
}, { reportAllChanges: false }); // report khi session kết thúc
```

```javascript
// Long Animation Frames API (LoAF) — identify long tasks
// Chrome 116+: thay thế longtask API với context tốt hơn
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    // entry.duration: độ dài của long animation frame (ms)
    // entry.scripts: scripts gây ra LoAF
    if (entry.duration > 50) {
      console.warn('Long Animation Frame:', {
        duration: entry.duration,
        blockingDuration: entry.blockingDuration,
        // Scripts gây ra frame này
        scripts: entry.scripts.map(s => ({
          name: s.sourceURL,
          duration: s.duration,
          type: s.invokerType, // 'event-listener', 'user-callback', etc.
        })),
      });
    }
  }
});

observer.observe({ type: 'long-animation-frame', buffered: true });
```

#### Trong DevTools (Lab Data)

```
Chrome DevTools — Đo INP:

1. Performance Panel:
   - Record → thực hiện interactions → Stop
   - Nhìn vào "Interactions" track (cạnh Timings)
   - Mỗi interaction hiện: [Input Delay][Processing][Presentation]
   - Màu đỏ = chậm, màu xanh = OK

2. Lighthouse Timespan Mode (Chrome 99+):
   - Open DevTools → Lighthouse
   - Chọn "Timespan" (thay vì "Navigation")
   - Start → thực hiện interactions → End
   - Xem "Interaction to Next Paint" trong kết quả

3. Web Vitals Extension:
   - Cài extension Web Vitals (Google)
   - Hiện INP real-time khi bạn tương tác với page
   - Click vào metric → xem chi tiết 3 phases
```

---

### INP Optimization Checklist cho React Apps

```
INP Optimization Priority Matrix:
┌────────────────────────────────────────────────────────────────┐
│ Phase 1: Input Delay (thường là nguyên nhân #1!)              │
│   [ ] Tìm long tasks > 50ms trong Performance panel           │
│   [ ] Break up long tasks với scheduler.yield() hoặc setTimeout│
│   [ ] Defer non-critical work khỏi event handlers             │
│   [ ] Offload CPU work sang Web Workers                       │
│                                                                │
│ Phase 2: Processing Time                                       │
│   [ ] Bọc heavy state updates trong startTransition           │
│   [ ] Dùng useDeferredValue cho expensive re-renders          │
│   [ ] Optimize render path (React.memo, useMemo, useCallback) │
│   [ ] Virtualize large lists (react-window, react-virtual)    │
│                                                                │
│ Phase 3: Presentation Delay                                    │
│   [ ] Chỉ dùng transform/opacity cho animations               │
│   [ ] Tránh layout thrashing (batch reads/writes)             │
│   [ ] content-visibility: auto cho long pages                 │
│   [ ] Giảm DOM size (ít nodes = paint nhanh hơn)             │
│   [ ] CSS contain: strict cho isolated components             │
└────────────────────────────────────────────────────────────────┘

INP Debugging Workflow:
  Step 1: Đo INP với web-vitals library trong production
  Step 2: Tìm interaction tệ nhất từ attribution data
  Step 3: Reproduce trong DevTools Performance tab
  Step 4: Xác định phase nào chiếm nhiều nhất
  Step 5: Apply fix tương ứng cho phase đó
  Step 6: Verify cải thiện với web-vitals library
  Step 7: Deploy và monitor field data qua CrUX (Chrome UX Report)

Target: INP < 200ms at P75 ← "Good" threshold
        INP < 500ms at P75 ← "Needs improvement"
        INP > 500ms at P75 ← "Poor" (SEO ranking impact!)
```


---

## Deep Dive: React Concurrency — Cơ chế bên trong và Practical Use

> **Nguồn:** [3perf.com/talks/react-concurrency](https://3perf.com/talks/react-concurrency/) — Ivan Akulov (PerfPerfPerf)
>
> Đây là bài talk giải thích **React Concurrency từ bên trong** — không chỉ là "dùng `startTransition`" mà là **tại sao nó hoạt động**, `shouldYieldToHost()` làm gì, tại sao concurrent rendering không giúp được expensive components, và các framework khác như Vue/Preact tại sao từ chối implement nó.

### Vấn đề React 17 giải quyết như thế nào (và tại sao không đủ)

```
React 17 — Synchronous Rendering:
┌────────────────────────────────────────────────────────────┐
│ User types in search box                                  │
│   ↓                                                        │
│ React bắt đầu render (setState)                           │
│   ↓                                                        │
│ React render toàn bộ component tree — 500ms!              │
│   ← User gõ thêm ký tự                                    │
│   ← User click button                                     │
│   ← Tất cả input BỊ BLOCK vì main thread bận!            │
│   ↓ (sau 500ms)                                           │
│ React hoàn thành → browser handle các events đã queue    │
│                                                            │
│ Kết quả: UI "giật" — user thấy lag rõ ràng               │
└────────────────────────────────────────────────────────────┘
```

---

### React Fiber — Nền tảng của Concurrency

**React Fiber** (React 16+) là kiến trúc mới cho phép React chia nhỏ render thành các "units of work":

```
React Fiber Architecture:
┌────────────────────────────────────────────────────────────┐
│ Component tree → Fiber tree (linked list structure)       │
│                                                            │
│ App                                                        │
│  └─ Fiber(App)                                            │
│      ├─ Fiber(Header)                                     │
│      │   ├─ Fiber(Logo)                                   │
│      │   └─ Fiber(Nav)                                    │
│      └─ Fiber(MainContent)                                │
│          ├─ Fiber(SearchBar)                              │
│          └─ Fiber(ResultsList)  ← 10,000 items...        │
│              ├─ Fiber(Item[0])                            │
│              ├─ Fiber(Item[1])                            │
│              └─ ... 9,998 more                            │
│                                                            │
│ React duyệt Fiber tree: 1 Fiber = 1 "unit of work"       │
│ Sau mỗi unit, React có thể PAUSE nếu cần!                │
└────────────────────────────────────────────────────────────┘
```

---

### Cơ chế cốt lõi: `performUnitOfWork()` + `shouldYieldToHost()`

```
React's Concurrent Rendering Loop (simplified):
```

```javascript
// Pseudo-code của React's rendering loop — scheduler/src/Scheduler.js
function workLoop() {
  while (workInProgress !== null) {
    // performUnitOfWork: render 1 component (1 Fiber)
    performUnitOfWork(workInProgress);

    // shouldYieldToHost: Có nên dừng lại không?
    if (shouldYieldToHost()) {
      // Yield control back to browser!
      // Browser có thể handle: user clicks, scroll, paint...
      return; // Sẽ được resume sau
    }
    // Nếu không cần yield → tiếp tục render component tiếp theo
  }
}

// shouldYieldToHost trong React 18 (thực tế):
function shouldYieldToHost() {
  const currentTime = performance.now();
  // Yield mỗi 5ms để browser có cơ hội handle events
  return currentTime >= deadline; // deadline = startTime + 5ms
}
```

```
Concurrent Rendering Timeline:
│
│ [startTransition(() => setLargeList(data))]
│          │
│          ▼
│    ████░░░████░░░████░░░████░░░████
│    │   │  │   │  │   │  │   │  │
│    │5ms│  │5ms│  │5ms│  │5ms│  └─ React finishes
│    │   │  │   │  │   │  │   │
│    │   └──┘   └──┘   └──┘   │
│    │    ↑      ↑      ↑     │
│    │  yield  yield  yield   │
│    │  Browser handles       │
│    │  pending events!       │
│
│ ████ = React rendering (non-urgent)
│ ░░░░ = Browser handling user input / painting
│
│ User clicks button while React is rendering:
│         click happens HERE ↓
│    ████░[CLICK]████░░░████░░░████
│           ↑
│    Browser handles click in next "gap"
│    → < 5ms delay → feels instant!
```

---

### Feature 1: `startTransition` và `useDeferredValue`

#### `startTransition` — Đánh dấu update là non-urgent

```typescript
import { useState, useTransition } from 'react';

function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Item[]>([]);
  const [isPending, startTransition] = useTransition();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;

    // URGENT: Update input ngay lập tức
    setQuery(newQuery);

    // NON-URGENT: Filter/sort 50,000 items
    // → React có thể INTERRUPT render này nếu user gõ tiếp!
    startTransition(() => {
      const filtered = allItems
        .filter(item => item.name.includes(newQuery))
        .sort(complexSort);
      setResults(filtered);
    });
  };

  return (
    <div>
      <input value={query} onChange={handleChange} />

      {/* isPending: true khi transition đang chạy */}
      {isPending && <div className="loading-indicator" />}

      {/* Khi user gõ nhanh:
          - Input update ngay (0ms delay)
          - Results render có thể bị interrupt nhiều lần
          - Chỉ kết quả CUỐI được render hoàn toàn */}
      <ResultsList results={results} />
    </div>
  );
}
```

```
startTransition behavior — User gõ "reac" rất nhanh:

t=0ms: User gõ 'r' → setQuery('r') ngay
       startTransition → React bắt đầu filter với 'r'
t=2ms: React render 20% list...
t=3ms: User gõ 'e' → NEW input arrives! (URGENT)
       React STOPS current render (discard!)
       setQuery('re') ngay ← User thấy 're' ngay lập tức
       startTransition → React bắt đầu filter với 're'
t=5ms: React render 30% list...
t=6ms: User gõ 'a' → React STOPS lại! Discard!
       ...tiếp tục...
t=100ms: User stop gõ → React hoàn thành filter 'reac'
         Render kết quả, commit vào DOM

→ Input luôn responsive!
→ Chỉ 1 filter operation hoàn thành (kết quả cuối cùng)
→ Tất cả intermediate renders bị discard → tiết kiệm CPU!
```

#### `useDeferredValue` — Defer một specific value

```typescript
import { useDeferredValue, memo } from 'react';

// ExpensiveList được wrap trong React.memo
// → Chỉ re-render khi deferredItems thay đổi (không phải query)
const ExpensiveList = memo(({ items }: { items: Item[] }) => {
  return (
    <ul>
      {items.map(item => <Item key={item.id} data={item} />)}
    </ul>
  );
});

function Search({ items }: { items: Item[] }) {
  const [query, setQuery] = useState('');

  // filtered được tính MỌI KHI query thay đổi (đồng bộ)
  const filtered = items.filter(item => item.name.includes(query));

  // deferredFiltered: React giữ giá trị CŨ trong khi tính giá trị mới
  // → ExpensiveList không re-render ngay khi query thay đổi
  const deferredFiltered = useDeferredValue(filtered);

  const isStale = filtered !== deferredFiltered;

  return (
    <div>
      <input value={query} onChange={e => setQuery(e.target.value)} />

      {/* Visual feedback: mờ đi khi đang deferred */}
      <div style={{ opacity: isStale ? 0.7 : 1 }}>
        <ExpensiveList items={deferredFiltered} />
      </div>
    </div>
  );
}
```

```
startTransition vs useDeferredValue:
┌────────────────────────────────────────────────────────────┐
│                │ startTransition    │ useDeferredValue     │
├────────────────────────────────────────────────────────────┤
│ Wrap           │ setState call      │ Computed value       │
│ Use when       │ You control the    │ Value comes from     │
│                │ state setter       │ props/external       │
│ isPending      │ ✅ Available       │ Compare old vs new   │
│ Typical use    │ Event handlers     │ Memoized components  │
└────────────────────────────────────────────────────────────┘
```

---

### Feature 2: Selective Hydration với `<Suspense>`

**SSR Problem:** Khi server-render HTML lớn, hydration (attach event listeners) phải hoàn thành trước khi user có thể tương tác.

```
React 17 SSR — Hydration block:
┌────────────────────────────────────────────────────────────┐
│ HTML từ server: trang hiển thị ngay                       │
│ Hydration bắt đầu: React traverse toàn bộ component tree │
│   - Header (100ms)                                        │
│   - Sidebar (200ms)                                       │
│   - Main Content (500ms) ← user muốn click đây!          │
│   - Footer (100ms)                                        │
│ Total: 900ms — user click trong 900ms này → KHÔNG REACT   │
└────────────────────────────────────────────────────────────┘

React 18 SSR — Selective Hydration với Suspense:
┌────────────────────────────────────────────────────────────┐
│ HTML từ server: trang hiển thị ngay                       │
│                                                            │
│ Hydration bắt đầu (concurrent):                          │
│   - Header (100ms) ← hydrate                             │
│   - t=50ms: User CLICKS vào Main Content!                │
│   → React: "Main Content được click!"                     │
│   → React PRIORITIZES hydrating Main Content TRƯỚC!       │
│   - Main Content (500ms) ← hydrate với priority cao       │
│   - Sau click: Main Content interactive sau ~500ms        │
│   - Sidebar, Footer hydrate sau (background)              │
│                                                            │
│ → Phần user muốn dùng sẽ interactive trước!              │
└────────────────────────────────────────────────────────────┘
```

```tsx
// Setup Selective Hydration
import { Suspense } from 'react';

// Server component structure:
function App() {
  return (
    <html>
      <body>
        <Header /> {/* No Suspense: hydrate first, blocking */}

        {/* Each Suspense boundary = independent hydration unit */}
        <Suspense fallback={<SidebarSkeleton />}>
          <Sidebar />          {/* Hydrates independently */}
        </Suspense>

        <Suspense fallback={<ContentSkeleton />}>
          <MainContent />      {/* Hydrates independently */}
          {/* If user clicks here → React hydrates this FIRST */}
        </Suspense>

        <Suspense fallback={<FooterSkeleton />}>
          <Footer />           {/* Hydrates independently, lowest priority */}
        </Suspense>
      </body>
    </html>
  );
}
```

**Gotcha quan trọng — khi user click bên trong Suspense đang hydrate:**

```
⚠️ Click inside hydrating Suspense boundary:
  User click button trong <Suspense> đang hydrate
  → React KHÔNG biết onClick của button đó là gì (chưa hydrate!)
  → React KHÔNG thể replay event (browser limitation)
  → React SWITCHES to urgent/blocking rendering cho Suspense này!
  → Suspense boundary hydrate hoàn toàn đồng bộ (như React 17)
  → Sau đó execute onClick

Bài học: 1 Suspense lớn wrap toàn bộ app = không giúp gì!
Fix: Chia nhỏ nhiều Suspense boundaries = mỗi cái hydrate độc lập
     Chỉ boundary bị click mới switch sang blocking hydration
```

---

### 3 Drawbacks của React Concurrency — Honest Assessment

Ivan Akulov không ngần ngại nêu rõ nhược điểm thực tế:

```
Drawback 1: Non-urgent updates CHẬM HƠN
┌────────────────────────────────────────────────────────────┐
│ Lý do: React phải yield control back to browser mỗi 5ms  │
│   → Thêm overhead từ task scheduling                      │
│   → Non-urgent render 600ms component tree:               │
│     - React 17 sync: 600ms straight                       │
│     - React 18 concurrent: 600ms + ~50ms overhead (8%)    │
│                                                            │
│ Trong tương lai: navigator.scheduling.isInputPending()    │
│   → Yield chỉ khi có user input (thông minh hơn 5ms fixed)│
│   → Nhưng performance tests inconclusive, chưa ship       │
└────────────────────────────────────────────────────────────┘

Drawback 2: Phức tạp hơn → CPU tốn kém hơn
┌────────────────────────────────────────────────────────────┐
│ Để enable concurrency, React architecture phức tạp hơn:   │
│   - Fiber work loop phức tạp hơn                          │
│   - Priority scheduling overhead                          │
│   - Đây là lý do Vue.js và Preact từ chối implement!     │
│                                                            │
│ Marvin Hagemeister (Preact, 2020):                        │
│   "It's still up in the air whether Concurrent Mode       │
│    benefits apps at all, even for React."                 │
│                                                            │
│ Evan You (Vue.js, 2019):                                  │
│   "The demo React team showcased is so contrived that     │
│    it will most likely never happen in an actual app."    │
│                                                            │
│ Ryan Carniato (Solid, 2022):                              │
│   "I've never come across this [using Concurrent         │
│    Rendering to break up CPU work] naturally in Solid.   │
│    Only in benchmarks that simulate slowdown."            │
└────────────────────────────────────────────────────────────┘

Drawback 3 (CRITICAL PITFALL): Không giúp với expensive single components!
┌────────────────────────────────────────────────────────────┐
│ shouldYieldToHost() chỉ được gọi SAU KHI performUnitOfWork│
│ hoàn thành. Và performUnitOfWork() = render 1 component.  │
│                                                            │
│ Nếu 1 component mất 500ms để render:                     │
│   - shouldYieldToHost không bao giờ được gọi trong 500ms  │
│   - Main thread bị block 500ms DÙ là non-urgent!         │
│   - Không có cách nào interrupt giữa chừng 1 component!  │
│                                                            │
│ Lý do: React không thể pause giữa chừng 1 function call  │
│   Rendering 1 component = gọi 1 function                 │
│   Một khi function đang chạy, không thể dừng lại         │
│   (đây là limitation cơ bản của JavaScript)              │
│                                                            │
│ Fix: Chia nhỏ component thành nhiều sub-components nhỏ   │
│   → Mỗi sub-component = 1 unit of work                   │
│   → React có thể yield giữa chúng                        │
└────────────────────────────────────────────────────────────┘
```

```
Tổng kết Drawbacks:
  ❌ Non-urgent updates: ~8% chậm hơn (scheduling overhead)
  ❌ All updates: CPU tốn kém hơn (complex architecture)
  ❌ KHÔNG giúp nếu 1 component đơn lẻ render quá lâu!

  ✅ Nhưng: Nếu bạn có nhiều components nhỏ → magical!
    Render 10,000 small components → không block UI
    User typing while React renders → instant response
```

---

### React's Long Game — Tại sao React vẫn làm

Dù Vue/Preact phản đối, React team có lý do chiến lược lớn hơn:

```
Dan Abramov (2019):
  "Concurrent Mode lets React do work 'on the side'.
   This unlocks many abilities that weren't possible!
   Time slicing is just a nice bonus."

→ Concurrent Rendering là NỀN TẢNG cho:

1. Activity/Offscreen API (upcoming):
   <Activity mode="hidden">
     <InactiveRoute />  ← Pre-render trong background
   </Activity>
   → Khi user navigate → INSTANT! (đã render sẵn)
   → Chỉ cần show DOM node + run useEffect

2. Server Components (React 19):
   Concurrent rendering cho phép interleave
   server + client rendering

3. Future: "React Forget" / auto-memoization compiler
   Compiler tự biết khi nào cần memo
   → Dev không cần viết useMemo/memo thủ công
```

---

### Practical Guide: Khi nào dùng gì?

```
Decision Tree — Concurrent Features:

User interaction lag?
         │
         ▼
    Expensive render?
         │
    Yes──┼──No
         │   │
         │   ▼
         │ Other cause (network, DOM, CSS)
         │ → Fix that instead
         ▼
Single component chậm (> 50ms)?
         │
    Yes──┼──No
         │   │
         │   ▼
         │ Many components chậm?
         │   │
         │   ▼
         │ startTransition / useDeferredValue ← EFFECTIVE!
         ▼
Chia nhỏ component thành sub-components!
   THEN dùng startTransition
   (Concurrent rendering works per-component)

Code patterns:
┌────────────────────────────────────────────────────────────┐
│ Scenario                 │ Solution                       │
├────────────────────────────────────────────────────────────┤
│ Typing → filter list     │ startTransition + setResults   │
│ Typing → expensive chart │ useDeferredValue(chartData)    │
│ Tab switch → heavy page  │ startTransition(setActiveTab)  │
│ SSR hydration slow       │ <Suspense> boundaries chia nhỏ │
│ 1 component > 100ms      │ Split component + startTransition│
│ Background pre-render    │ Activity API (future)           │
└────────────────────────────────────────────────────────────┘
```

```typescript
// Complete example: Search với tất cả concurrent features
import { useState, useTransition, useDeferredValue, Suspense, memo } from 'react';

// Memoize để chỉ re-render khi deferredResults thay đổi
const SearchResults = memo(({ results }: { results: Item[] }) => (
  <ul>
    {results.map(item => (
      <li key={item.id}>{item.name}</li>
    ))}
  </ul>
));

function SmartSearch({ allItems }: { allItems: Item[] }) {
  const [query, setQuery] = useState('');
  const [isPending, startTransition] = useTransition();

  // Immediate filter (sync với query)
  const filtered = allItems.filter(item =>
    item.name.toLowerCase().includes(query.toLowerCase())
  );

  // Deferred: SearchResults chỉ update sau urgent renders
  const deferredFiltered = useDeferredValue(filtered);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Urgent: Input update ngay
    setQuery(e.target.value);
    // startTransition không cần ở đây vì useDeferredValue đã handle
    // Nhưng nếu có additional expensive setState:
    // startTransition(() => setOtherExpensiveState(...))
  };

  return (
    <div>
      <input
        value={query}
        onChange={handleChange}
        placeholder="Search..."
      />
      <span>{isPending ? 'Loading...' : `${deferredFiltered.length} results`}</span>

      {/* SearchResults chỉ re-render với deferredFiltered
          → Không block typing! */}
      <div style={{ opacity: deferredFiltered !== filtered ? 0.6 : 1 }}>
        <SearchResults results={deferredFiltered} />
      </div>
    </div>
  );
}
```


---

## Deep Dive: Optimize Resize & Scroll Events — Tránh Janky UI

> **Nguồn:** [iamakulov.com/notes/resize-scroll](https://iamakulov.com/notes/resize-scroll/) — Ivan Akulov
>
> `resize`, `scroll`, `mousewheel` là các events được fired **hàng chục lần mỗi giây**. Nếu event handler chậm hơn 1 frame (~16ms), browser không kịp repaint → UI bị giật. Bài này trình bày 4 kỹ thuật tối ưu.

### Vấn đề: Event handlers fired quá nhiều lần

```
Event firing frequency (trên máy tính thông thường):
┌────────────────────────────────────────────────────────────┐
│ scroll:       ~60 events/giây  (mỗi frame)                │
│ resize:       ~30-60 events/giây (khi kéo window)         │
│ mousemove:    ~60 events/giây  (khi di chuột)             │
│ touchmove:    ~60 events/giây  (khi vuốt trên mobile)     │
│                                                            │
│ Nếu handler mất 20ms:                                     │
│   60 events/s × 20ms = 1200ms JS mỗi giây!               │
│   → Main thread blocked 120% thời gian → không thể paint! │
│   → Scroll janky, UI đứng hình                            │
│                                                            │
│ Budget mỗi frame (60fps):  16.7ms                         │
│ Budget cho event handler:  ≤ 10ms (để còn room cho paint) │
└────────────────────────────────────────────────────────────┘
```

---

### Technique 1: Throttling — Giới hạn tần suất thực thi

**Mục đích:** Đảm bảo handler chỉ chạy tối đa 1 lần trong N milliseconds, dù event fired nhiều hơn.

```javascript
// ❌ BAD: Handler chạy mỗi lần resize (có thể 60 lần/giây!)
window.addEventListener('resize', () => {
  calculateLayout(); // Mất 20ms → quá slow!
});

// ✅ GOOD: Throttle — chạy tối đa 1 lần mỗi 100ms
import { throttle } from 'lodash';

window.addEventListener('resize', throttle(() => {
  calculateLayout(); // Vẫn mất 20ms, nhưng chỉ chạy 10 lần/giây
}, 100));
```

```
Throttle vs Debounce — Khi nào dùng cái nào?:
┌────────────────────────────────────────────────────────────┐
│ THROTTLE: Chạy đều đặn — không skip quá lâu              │
│   Events:  ████████████████████████████████              │
│   Handlers: █   █   █   █   █   █   █   █               │
│   Dùng khi: Scroll position tracking, mousemove drawing  │
│   Cần thấy kết quả liên tục (dù ít lần hơn)             │
│                                                            │
│ DEBOUNCE: Chờ "yên tĩnh" — chỉ chạy SAU KHI dừng       │
│   Events:  ████████████████████████████████              │
│   Handlers:                                █              │
│   Dùng khi: Resize → recalculate layout (chỉ cần        │
│   kết quả cuối), search input autocomplete               │
└────────────────────────────────────────────────────────────┘
```

```typescript
// React hooks implementation
import { useEffect, useCallback, useRef } from 'react';

// useThrottle hook
function useThrottledCallback<T extends (...args: unknown[]) => void>(
  callback: T,
  delay: number
): T {
  const lastRan = useRef(Date.now());

  return useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastRan.current >= delay) {
      lastRan.current = now;
      callback(...args);
    }
  }, [callback, delay]) as T;
}

// useDebounce hook
function useDebouncedCallback<T extends (...args: unknown[]) => void>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  return useCallback((...args: Parameters<T>) => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => callback(...args), delay);
  }, [callback, delay]) as T;
}

// Usage in React component
function ResponsiveComponent() {
  const [width, setWidth] = useState(window.innerWidth);

  // Debounce: recalculate layout chỉ khi user dừng resize
  const handleResize = useDebouncedCallback(() => {
    setWidth(window.innerWidth);
    recalculateExpensiveLayout();
  }, 150);

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  return <div style={{ width }}>{/* ... */}</div>;
}
```

---

### Technique 2: `passive: true` — Unlock Smooth Scrolling

**Vấn đề:** Mặc định, browser phải **chờ event handler hoàn thành** trước khi scroll, vì handler có thể gọi `event.preventDefault()` để cancel scroll.

```javascript
// ❌ Browser phải chờ updateBackground() xong mới scroll!
window.addEventListener('touchstart', (e) => {
  updateBackground(e); // Mất 15ms → browser delay scroll 15ms!
  // Browser lo: "Handler này có gọi e.preventDefault() không?"
  // → Phải đợi để biết!
});

// ✅ passive: true → Browser biết ngay "không có preventDefault"
// → Browser scroll NGAY LẬP TỨC, không chờ handler!
window.addEventListener('touchstart', (e) => {
  updateBackground(e); // Vẫn chạy, nhưng scroll đã bắt đầu!
}, { passive: true });
// → Scroll mượt mà ngay cả khi handler chậm!
```

```
passive: true — Browser behavior:

WITHOUT passive:
  User swipes screen
  Browser: "Wait for touchstart handler to finish..."
  Handler runs (15ms)
  Browser: "OK, handler didn't preventDefault() → scroll!"
  → 15ms scroll delay → JANKY

WITH passive: true:
  User swipes screen
  Browser: "Handler won't preventDefault() → scroll NOW!"
  Handler runs in parallel with scrolling
  → 0ms scroll delay → SMOOTH!
```

```javascript
// Events hỗ trợ passive:
// ✅ touchstart, touchmove   → mobile scrolling
// ✅ mousewheel, wheel       → desktop scrolling
// ❌ click, keydown          → thường không cần (không liên quan scroll)

// Chrome DevTools cảnh báo:
// "[Violation] Added non-passive event listener to a scroll-blocking
//  'touchstart' event. Consider marking event handler as 'passive'
//  to make the page more responsive."

// React: Đây là issue với synthetic events!
// React gắn event listeners ở root với { passive: false } (legacy)
// → Dùng native addEventListener với passive: true cho scroll/touch:
useEffect(() => {
  const element = containerRef.current;
  const handler = (e: TouchEvent) => {
    updateParallax(e.touches[0].clientY);
    // KHÔNG gọi e.preventDefault() → có thể dùng passive!
  };

  element?.addEventListener('touchmove', handler, { passive: true });
  return () => element?.removeEventListener('touchmove', handler);
}, []);
```

---

### Technique 3: Dùng Modern APIs thay thế event listeners

Thay vì "optimize cái tệ", hãy dùng APIs được thiết kế đúng mục đích:

```
API Alternatives Map:
┌─────────────────────────────────────────────────────────────┐
│ Thay vì scroll listener để:    → Dùng API:                 │
├─────────────────────────────────────────────────────────────┤
│ Detect element in viewport     → IntersectionObserver      │
│ Sticky header (fixed/static)   → position: sticky (CSS!)  │
│ Detect element resized         → ResizeObserver            │
│                                                             │
│ Thay vì resize listener để:                                │
├─────────────────────────────────────────────────────────────┤
│ Layout change at breakpoint    → window.matchMedia         │
│ Component-level size change    → ResizeObserver            │
└─────────────────────────────────────────────────────────────┘
```

#### `IntersectionObserver` — Thay scroll listeners cho visibility detection

```typescript
// ❌ OLD: scroll listener để detect visibility
window.addEventListener('scroll', () => {
  const rect = element.getBoundingClientRect(); // Force layout!
  if (rect.top < window.innerHeight) {
    loadMoreItems();
  }
}); // Runs 60 times/second, reads layout mỗi lần!

// ✅ NEW: IntersectionObserver — zero scroll overhead!
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        loadMoreItems();
        // Optionally disconnect after first trigger:
        observer.unobserve(entry.target);
      }
    });
  },
  {
    // Trigger khi element 10% visible
    threshold: 0.1,
    // Trigger 200px TRƯỚC khi element vào viewport (prefetch!)
    rootMargin: '200px 0px',
  }
);

observer.observe(sentinelElement); // Element ở cuối list

// React hook:
function useIntersectionObserver(
  ref: React.RefObject<Element>,
  options?: IntersectionObserverInit
) {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsIntersecting(entry.isIntersecting),
      options
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, options]);

  return isIntersecting;
}

// Usage:
function InfiniteList() {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const isVisible = useIntersectionObserver(sentinelRef, {
    rootMargin: '200px'
  });

  useEffect(() => {
    if (isVisible) loadMoreItems();
  }, [isVisible]);

  return (
    <div>
      {items.map(item => <Item key={item.id} data={item} />)}
      <div ref={sentinelRef} /> {/* Sentinel element */}
    </div>
  );
}
```

#### `ResizeObserver` — Thay resize listeners cho element-level resize

```typescript
// ❌ OLD: window resize listener (không detect container resize!)
window.addEventListener('resize', () => {
  const width = container.offsetWidth; // Force layout!
  if (width < 600) setLayout('compact');
});

// ✅ NEW: ResizeObserver — detect ELEMENT resize, không chỉ window!
// Useful khi container resize do: parent resize, flex layout, etc.
const resizeObserver = new ResizeObserver(entries => {
  for (const entry of entries) {
    const { width, height } = entry.contentRect;
    if (width < 600) setLayout('compact');
    else setLayout('full');
  }
});

resizeObserver.observe(containerElement);

// React hook:
function useResizeObserver(ref: React.RefObject<Element>) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return size;
}

// Usage:
function AdaptiveCard() {
  const cardRef = useRef<HTMLDivElement>(null);
  const { width } = useResizeObserver(cardRef);

  return (
    <div ref={cardRef} className={width < 400 ? 'compact' : 'full'}>
      {/* Tự adapt theo kích thước container, không phải window */}
    </div>
  );
}
```

#### `position: sticky` — Thay scroll listeners cho sticky headers

```css
/* ❌ OLD: Scroll listener để toggle fixed/static */
/* JavaScript:
window.addEventListener('scroll', () => {
  if (window.scrollY > headerOffset) {
    header.style.position = 'fixed';
  } else {
    header.style.position = 'static';
  }
}); */

/* ✅ NEW: CSS only — zero JavaScript, zero scroll listener! */
.sticky-header {
  position: sticky;
  top: 0;          /* Dính ở top khi scroll đến đây */
  z-index: 100;

  /* Browser handle hoàn toàn — không block scroll!
     Không cần JS event listener
     Không cần layout reads
     Compositor layer tự handle → super smooth */
}
```

```javascript
// window.matchMedia — Thay resize listener cho breakpoint changes
// ❌ OLD: resize listener + check width
window.addEventListener('resize', throttle(() => {
  if (window.innerWidth < 768) setIsMobile(true);
  else setIsMobile(false);
}, 100));

// ✅ NEW: matchMedia — chỉ fires khi breakpoint THAY ĐỔI!
const mediaQuery = window.matchMedia('(max-width: 768px)');

// Modern syntax (addEventListener):
mediaQuery.addEventListener('change', (e) => {
  setIsMobile(e.matches); // Chỉ fire khi cross threshold
});

// React hook:
function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(
    () => window.matchMedia(query).matches
  );

  useEffect(() => {
    const mq = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

// Usage:
function App() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  return isMobile ? <MobileLayout /> : <DesktopLayout />;
}
```

---

### Technique 4: Optimize handler code — ≤ 10ms budget

```typescript
// Nếu đã throttle + dùng modern APIs mà vẫn slow:
// → Tối ưu code bên trong handler

// ❌ BAD: Đọc layout properties mỗi lần scroll (layout thrashing!)
window.addEventListener('scroll', () => {
  const sections = document.querySelectorAll('.section');
  sections.forEach(section => {
    const rect = section.getBoundingClientRect(); // Force layout!
    if (rect.top < 0) section.classList.add('passed');
  });
});

// ✅ GOOD 1: Cache layout reads
let cachedRects: DOMRect[] = [];
const sections = Array.from(document.querySelectorAll('.section'));

// Recalculate positions chỉ khi resize (ít khi hơn scroll)
window.addEventListener('resize', debounce(() => {
  cachedRects = sections.map(s => s.getBoundingClientRect());
}, 150));

// Scroll handler: chỉ đọc từ cache
window.addEventListener('scroll', throttle(() => {
  const scrollY = window.scrollY; // Không force layout
  sections.forEach((section, i) => {
    if (cachedRects[i] && cachedRects[i].top + scrollY < scrollY) {
      section.classList.add('passed');
    }
  });
}, 16), { passive: true });

// ✅ GOOD 2: requestAnimationFrame — sync với browser paint
let ticking = false;
window.addEventListener('scroll', () => {
  if (!ticking) {
    requestAnimationFrame(() => {
      updateParallax(window.scrollY);
      ticking = false;
    });
    ticking = true;
  }
}, { passive: true });
// requestAnimationFrame đảm bảo update sync với browser repaint
// + ticking flag đảm bảo chỉ 1 rAF per frame (tự throttle!)
```

---

### Những thứ KHÔNG hoạt động như bạn nghĩ

```
❌ MYTH 1: requestAnimationFrame giúp scroll handler nhanh hơn
  Thực tế: rAF hữu ích cho JS animations
  Với scroll handlers: không mang lại benefit đáng kể
  Dùng throttle + passive: true thay thế

❌ MYTH 2: Event delegation giúp scroll/resize nhanh hơn
  Thực tế: Event delegation tối ưu MEMORY, không phải speed
  Không giúp với scroll/resize performance

✅ THỰC SỰ HIỆU QUẢ:
  1. throttle/debounce (giảm execution frequency)
  2. passive: true (unlock smooth scrolling)
  3. Modern APIs (IntersectionObserver, ResizeObserver, sticky)
  4. Optimize handler code (cache, batch reads)
  5. requestAnimationFrame (CHỈ cho animations, không scroll)
```

---

### Quick Reference: Scroll & Resize Optimization

```
Decision Matrix:
┌────────────────────────────────────────────────────────────────┐
│ Bạn cần làm gì?              → Giải pháp tốt nhất            │
├────────────────────────────────────────────────────────────────┤
│ Sticky header                → position: sticky (CSS!)       │
│ Detect element in viewport   → IntersectionObserver          │
│ Infinite scroll / lazy load  → IntersectionObserver          │
│ Element resize detection     → ResizeObserver                 │
│ Breakpoint change            → window.matchMedia             │
│ Parallax / scroll animation  → scroll listener + passive: true│
│                                + requestAnimationFrame        │
│ Resize → recalculate layout  → resize listener + debounce    │
│ Scroll → update position     → scroll listener + throttle    │
│                                + passive: true               │
├────────────────────────────────────────────────────────────────┤
│ Event handler vẫn chậm sau optimize:                          │
│   - Profile với DevTools Performance tab                      │
│   - Cache expensive DOM reads (getBoundingClientRect)         │
│   - Batch reads trước, writes sau (avoid layout thrashing)   │
│   - Xem xét Web Worker cho heavy computation                  │
└────────────────────────────────────────────────────────────────┘
```


---

## Deep Dive: Optimize INP — Hướng dẫn Thực chiến theo Phase

> **Nguồn:** [web.dev/articles/optimize-inp](https://web.dev/articles/optimize-inp) — Google Web.dev
>
> Trong khi bài INP overview giải thích **INP là gì**, bài này đi sâu vào **cách fix từng phase** — với techniques cụ thể, code patterns, và những cạm bẫy thường gặp. Đây là bài "làm theo được" cho engineers.

### Workflow: Tiếp cận Cyclic (Lặp đi lặp lại)

```
INP Optimization là iterative process — không phải one-time fix:

Measure (RUM) → Identify slow interaction → Diagnose phase
     ↑                                              ↓
   Verify                                    Apply fix
     ↑                                              ↓
   Deploy  ←────────────────── Test & Confirm improvement

Tools:
  Field data:  web-vitals library → Sentry/DataDog
  Lab data:    Chrome DevTools Performance tab
  Diagnose:    Interactions track + Long Tasks + Flame chart
```

---

### Phase 1: Giảm Input Delay

Input delay = thời gian từ user click đến khi event handler BẮT ĐẦU chạy. Nguyên nhân chính: **main thread đang bận**.

#### 1A. Tránh Long Tasks trong JS

```javascript
// Vấn đề: JS task > 50ms = "long task" = block mọi input!
// Chrome DevTools: Long tasks hiển thị màu đỏ trong Performance tab

// ❌ BAD: Synchronous, chặn main thread 300ms
function processData(items) {
  return items.map(item => ({
    ...item,
    processed: expensiveComputation(item), // 300ms total
  }));
}
// Nếu user click trong khi processData() chạy → input delay 300ms!

// ✅ FIX 1: scheduler.yield() — Modern API (recommended 2024+)
// Web.dev KHÔNG khuyên dùng isInputPending() nữa → dùng scheduler.yield()
async function processDataAsync(items) {
  const results = [];

  for (let i = 0; i < items.length; i++) {
    results.push({
      ...items[i],
      processed: expensiveComputation(items[i]),
    });

    // Yield mỗi 50 items (hoặc mỗi ~5ms)
    if (i % 50 === 0) {
      await scheduler.yield();
      // → Browser có cơ hội handle pending user input
      // → Continuation được resume với high priority
    }
  }

  return results;
}

// ✅ FIX 2: Web Worker — offload hoàn toàn khỏi main thread
// (Khi computation không cần DOM access)
const worker = new Worker('./data-processor.worker.js');

worker.postMessage({ items }); // Serialize và gửi sang worker
worker.onmessage = (e) => {
  const { results } = e.data;
  setProcessedData(results); // Update UI từ main thread
};
// Main thread hoàn toàn free trong khi worker xử lý!
```

#### 1B. Tránh Recurring Timers gây xung đột

```javascript
// ❌ BAD: setInterval heavy task → compete với user input!
setInterval(() => {
  updateDashboardMetrics();   // 30ms — runs every 1 second
  syncLocalStorage();         // 20ms
  checkForUpdates();          // 15ms — total 65ms every 1s!
  // → Mỗi 1 giây, main thread bị block 65ms
  // → Bất kỳ click nào trong 65ms đó = 65ms input delay!
}, 1000);

// ✅ FIX: Tách thành nhiều timers với rate phù hợp
// + yield giữa các tasks nặng

// Metrics: update nhiều hơn (user cần thấy)
setInterval(() => updateDashboardMetrics(), 2000); // 30ms mỗi 2s

// Storage sync: ít critical hơn, dùng requestIdleCallback
function scheduleStorageSync() {
  requestIdleCallback(() => {
    syncLocalStorage();
    scheduleStorageSync(); // Re-schedule sau khi xong
  }, { timeout: 5000 }); // Timeout: chạy tối đa sau 5s kể cả không idle
}
scheduleStorageSync();

// Updates: dùng Background Sync hoặc WebSocket
// → Không cần polling!
```

#### 1C. Manage Third-Party Scripts

```javascript
// Third-party scripts là nguyên nhân phổ biến của high input delay!
// Chat widgets, analytics, A/B testing tools...

// ❌ BAD: Load third-party script trong <head> blocking
// <script src="https://heavy-analytics.com/tracker.js"></script>
// → Parse + execute trước khi page interactive

// ✅ FIX 1: Defer third-party scripts
// <script src="https://analytics.com/tracker.js" defer></script>
// <script src="https://analytics.com/tracker.js" async></script>

// ✅ FIX 2: Load sau user interaction / sau page load
window.addEventListener('load', () => {
  // Đợi page load xong
  setTimeout(() => {
    // Đợi thêm 2s để user có thể tương tác trước
    const script = document.createElement('script');
    script.src = 'https://heavy-chat-widget.com/widget.js';
    document.body.appendChild(script);
  }, 2000);
});

// ✅ FIX 3: Facade pattern — chỉ load khi user click
function ChatFacade() {
  const [isLoaded, setIsLoaded] = useState(false);

  const handleClick = async () => {
    if (!isLoaded) {
      // Load real widget khi user THỰC SỰ muốn dùng
      await import('heavy-chat-widget');
      setIsLoaded(true);
    }
    openChat();
  };

  return (
    <button onClick={handleClick}>
      {isLoaded ? 'Open Chat' : 'Chat with us →'}
    </button>
  );
}
```

---

### Phase 2: Optimize Event Callbacks (Processing Time)

Processing time = thời gian event handlers thực sự chạy.

#### 2A. Làm ít hơn — Nguyên tắc quan trọng nhất

```typescript
// ❌ BAD: Event handler làm quá nhiều việc synchronously
const handleProductSelect = async (productId: string) => {
  // 1. Fetch product details (async OK)
  const product = await fetchProduct(productId);

  // 2. Update selected product (necessary)
  setSelectedProduct(product);

  // 3. Log analytics (NOT urgent — defer this!)
  await logProductView(productId);

  // 4. Update recommendation engine (NOT urgent!)
  await updateRecommendations(productId);

  // 5. Sync với localStorage (NOT urgent!)
  localStorage.setItem('lastViewed', productId);

  // 6. Update URL (can defer)
  history.pushState({}, '', `/products/${productId}`);
};

// ✅ FIX: Chỉ làm urgent work trong main handler
// Defer non-critical work
const handleProductSelect = async (productId: string) => {
  // URGENT: User cần thấy product details ngay
  const product = await fetchProduct(productId);
  setSelectedProduct(product);

  // NON-URGENT: Defer với scheduler.yield()
  // hoặc đơn giản là không await + let it run in background
  scheduler.yield().then(() => {
    // Chạy sau next frame — không block user thấy product
    logProductView(productId);
    updateRecommendations(productId);
    localStorage.setItem('lastViewed', productId);
    history.pushState({}, '', `/products/${productId}`);
  });
};
```

#### 2B. Tách Processing thành "Urgent" và "Non-urgent" chunks

```typescript
// Pattern: Yield sau khi visual update, trước heavy processing
const handleFilterChange = async (filter: string) => {
  // STEP 1: Update UI ngay (urgent — user cần thấy filter applied)
  setActiveFilter(filter);

  // STEP 2: Yield → browser paint new UI (user thấy response ngay)
  await scheduler.yield();

  // STEP 3: Heavy processing (non-urgent — sau paint)
  const filtered = await processLargeDataset(allItems, filter);
  setFilteredItems(filtered);

  // STEP 4: Yield → browser paint results
  await scheduler.yield();

  // STEP 5: Analytics, logging (lowest priority)
  logFilterUsage(filter, filtered.length);
};

// Timeline:
// User click → setActiveFilter → yield → [PAINT: filter highlighted]
//            → processDataset → yield → [PAINT: results shown]
//            → logFilterUsage (background)
// INP = time đến first paint response ← rất nhanh!
```

#### 2C. `startTransition` cho React — Built-in prioritization

```typescript
import { useTransition } from 'react';

function FilterPanel({ allItems }: { allItems: Item[] }) {
  const [filter, setFilter] = useState('all');
  const [filteredItems, setFilteredItems] = useState(allItems);
  const [isPending, startTransition] = useTransition();

  const handleFilterChange = (newFilter: string) => {
    // URGENT: Update filter UI ngay
    setFilter(newFilter);

    // NON-URGENT: React có thể interrupt nếu user click lại
    startTransition(() => {
      const result = allItems.filter(item =>
        newFilter === 'all' ? true : item.category === newFilter
      );
      setFilteredItems(result);
    });
  };

  return (
    <div>
      <FilterButtons
        active={filter}
        onChange={handleFilterChange}
        loading={isPending}
      />
      <div style={{ opacity: isPending ? 0.7 : 1 }}>
        <ItemGrid items={filteredItems} />
      </div>
    </div>
  );
}
```

---

### Phase 3: Giảm Presentation Delay

Presentation delay = thời gian từ event handler kết thúc → browser paint frame mới.

#### 3A. Tránh Large Rendering Updates

```typescript
// ❌ BAD: Một lần update quá nhiều → browser phải recalculate tất cả
const handleAccordionOpen = (id: string) => {
  // Trigger re-render của TOÀN BỘ list (1000 items)
  setExpandedItems(prev => ({ ...prev, [id]: true }));
  // → React re-renders ALL items
  // → Style recalculation cho 1000 nodes
  // → Layout cho 1000 nodes
  // → Paint
};

// ✅ FIX 1: Virtualize — chỉ render visible items
import { FixedSizeList } from 'react-window';

function VirtualizedAccordion({ items }: { items: Item[] }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const Row = ({ index, style }: { index: number; style: CSSProperties }) => (
    <div style={style}>
      <AccordionItem
        data={items[index]}
        isExpanded={expanded[items[index].id]}
        onToggle={(id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }))}
      />
    </div>
  );

  return (
    <FixedSizeList
      height={600}
      itemCount={items.length}
      itemSize={60}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
  // → Chỉ ~10 items được render (visible trong viewport)
  // → Style/layout chỉ cho 10 items thay vì 1000!
}

// ✅ FIX 2: Tách state để isolate re-renders
// Thay vì 1 state lớn cho toàn bộ app:
const handleAccordionOpen = (id: string) => {
  // Chỉ accordion component đó re-render
  // Nếu mỗi accordion quản lý state nội bộ
};
```

#### 3B. DOM Size ảnh hưởng đến Presentation Delay

```
DOM Size Impact on Rendering:
┌────────────────────────────────────────────────────────────┐
│ Google khuyến nghị:                                       │
│   Total DOM nodes: < 1,500                                │
│   Max depth:       < 32 levels                            │
│   Children/parent: < 60                                   │
│                                                            │
│ Tại sao DOM size quan trọng với INP:                      │
│   Mỗi click → style recalculation toàn bộ DOM             │
│   10,000 DOM nodes × style recalc = SLOW presentation     │
│   → Presentation delay cao dù processing time nhỏ        │
│                                                            │
│ Cách đo: DevTools → Performance → "Recalculate Style"     │
│   Nếu > 10ms → DOM quá lớn!                              │
└────────────────────────────────────────────────────────────┘
```

```css
/* content-visibility: auto — Skip rendering off-screen content */
.feed-item {
  content-visibility: auto;
  /* Browser: "Đừng render element này nếu không visible"
     → Massive savings cho long feeds/lists!
     → Style + Layout + Paint chỉ cho visible items */
  contain-intrinsic-size: auto 120px; /* Estimated height cho scroll */
}

/* contain: strict — Isolate rendering scope */
.widget {
  contain: strict;
  /* Nói với browser: "Widget này không ảnh hưởng layout bên ngoài"
     → Browser không cần recalculate layout của parent/siblings
     → Giảm scope của style recalculation */
}

/* Animations: chỉ dùng transform + opacity */
/* ❌ BAD: triggers layout */
.animate-width  { transition: width 0.3s; }
.animate-top    { transition: top 0.3s; }
.animate-margin { transition: margin 0.3s; }

/* ✅ GOOD: compositor only — không trigger layout/paint */
.animate-slide  { transition: transform 0.3s; }
.animate-fade   { transition: opacity 0.3s; }
.animate-scale  { transition: transform 0.3s; } /* scale() */
```

#### 3C. Tránh Layout Thrashing trong Event Handlers

```typescript
// ❌ BAD: Read/write interleaved = forced synchronous layout!
const handleItemClick = (clickedId: string) => {
  const items = document.querySelectorAll('.item');

  items.forEach(item => {
    // READ: forces browser to recalculate layout
    const height = item.offsetHeight;

    // WRITE: invalidates layout
    item.style.height = height * 1.1 + 'px';

    // Next READ: browser recalculates AGAIN!
    const newHeight = item.offsetHeight; // = another forced layout!
  });
  // N items = 2N forced layout calculations!
};

// ✅ GOOD: Batch all reads, then batch all writes
const handleItemClick = (clickedId: string) => {
  const items = Array.from(document.querySelectorAll('.item'));

  // PHASE 1: Batch all reads (1 layout calculation)
  const heights = items.map(item => item.offsetHeight);

  // PHASE 2: Batch all writes (1 layout invalidation, repaint once)
  items.forEach((item, i) => {
    item.style.height = heights[i] * 1.1 + 'px';
  });
  // = 1 layout read + 1 repaint (instead of 2N!)
};
```

---

### Điểm khác biệt: optimize-inp vs inp overview

```
web.dev/articles/inp:             web.dev/articles/optimize-inp:
──────────────────────           ──────────────────────────────
"INP là gì?"                     "Làm thế nào để fix?"
3 phases định nghĩa              Techniques cụ thể cho mỗi phase
Scoring, thresholds              Code patterns, anti-patterns
Qualifying interactions          scheduler.yield() deep dive
DevTools basics                  requestIdleCallback patterns
                                 DOM size management
                                 content-visibility
                                 Third-party script management
                                 Cyclic debug workflow

→ Đọc INP overview TRƯỚC        → Dùng optimize-inp như CHECKLIST
  để hiểu khái niệm               khi cần fix INP cụ thể
```

---

### Complete INP Optimization Checklist

```
Phase 1: Input Delay
  [ ] Profile: tìm long tasks > 50ms (đỏ trong DevTools)
  [ ] Break up long tasks: scheduler.yield() sau mỗi ~5ms
  [ ] Recurring timers: chạy heavy work với requestIdleCallback
  [ ] Third-party: defer, async, hoặc facade pattern
  [ ] Web Workers: offload CPU-heavy non-DOM work

Phase 2: Processing Time
  [ ] Event handlers: chỉ làm urgent work
  [ ] Non-critical work: defer với scheduler.yield()
  [ ] React: startTransition cho non-urgent state updates
  [ ] Đo: Chrome DevTools → "Event: click" → flame chart
      Xem function nào trong handler tốn nhiều nhất

Phase 3: Presentation Delay
  [ ] Virtualize large lists (react-window, tanstack-virtual)
  [ ] DOM size: < 1,500 total nodes
  [ ] content-visibility: auto cho long feeds
  [ ] CSS contain: strict cho isolated widgets
  [ ] Animations: chỉ transform + opacity
  [ ] Layout thrashing: batch reads trước, writes sau

Monitoring:
  [ ] web-vitals library: onINP với attribution
  [ ] Alert khi INP P75 > 200ms
  [ ] Weekly review của INP trends
  [ ] Synthetic tests: Playwright + Lighthouse Timespan

Target: INP < 200ms (Good) at P75
```


---

## Deep Dive: Tìm Slow Interactions trong Production — Field Debugging

> **Nguồn:** [web.dev/articles/find-slow-interactions-in-the-field](https://web.dev/articles/find-slow-interactions-in-the-field) — Google Web.dev
>
> Bài trước dạy cách fix từng phase. Bài này dạy **cách TÌM interactions chậm trong production** — từ real user data (field data) đến reproduce trong DevTools. Đây là bước đầu tiên trong mọi INP debugging workflow.

### Field Data vs Lab Data — Tại sao cần cả hai?

```
Field Data (RUM):                    Lab Data (DevTools):
────────────────                     ────────────────────
Real users, real devices             Controlled environment
Real network conditions              Reproducible
Real concurrent work                 Detailed flame charts
"What is slow?"                      "Why is it slow?"

→ Dùng field data để PHÁT HIỆN      → Dùng lab data để DIAGNOSE
  interaction nào chậm trong         nguyên nhân khi đã biết
  production                         interaction nào cần fix
```

---

### Step 1: Thu thập field data với `web-vitals` Attribution Build

```javascript
// QUAN TRỌNG: Import từ 'web-vitals/attribution' (không phải 'web-vitals')
// Attribution build cung cấp breakdown chi tiết theo từng phase!
import { onINP } from 'web-vitals/attribution';

onINP((metric) => {
  const { attribution } = metric;

  // Thông tin cơ bản
  console.log('INP:', metric.value, 'ms');
  console.log('Rating:', metric.rating); // 'good' | 'needs-improvement' | 'poor'

  // Attribution data — đây là "chìa khóa" để debug!
  console.log('Interaction type:', attribution.interactionType);
  // → 'click' | 'pointer' | 'keyboard'

  console.log('Interaction target:', attribution.interactionTarget);
  // → CSS selector của element bị click
  // → Ví dụ: "#submit-button" hoặc ".product-card:nth-child(3)"

  // Phase breakdown — biết phase nào chậm nhất!
  console.log('Input delay:',         attribution.inputDelay, 'ms');
  console.log('Processing duration:', attribution.processingDuration, 'ms');
  console.log('Presentation delay:',  attribution.presentationDelay, 'ms');

  // Load state khi interaction xảy ra
  console.log('Load state:', attribution.loadState);
  // → 'loading' | 'dom-interactive' | 'dom-content-loaded' | 'complete'
  // Biết interaction xảy ra lúc page đang load hay đã load xong

}, { reportAllChanges: false }); // false: chỉ report INP cuối session
```

```typescript
// Production-ready: gửi attribution data lên analytics
import { onINP, type INPMetricWithAttribution } from 'web-vitals/attribution';

function sendToAnalytics(metric: INPMetricWithAttribution) {
  const { attribution } = metric;

  // Chỉ gửi lên server nếu slow hoặc sample
  const shouldReport =
    metric.rating === 'poor' ||
    metric.rating === 'needs-improvement' ||
    Math.random() < 0.05; // 5% sample của "good" interactions

  if (!shouldReport) return;

  // Serialize interactionTarget (DOM element → CSS selector string)
  const targetSelector = attribution.interactionTarget
    ? getSelector(attribution.interactionTarget as Element)
    : 'unknown';

  fetch('/api/vitals', {
    method: 'POST',
    body: JSON.stringify({
      name: 'INP',
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,

      // Attribution fields
      interactionType: attribution.interactionType,
      interactionTarget: targetSelector,
      loadState: attribution.loadState,

      // Phase durations (milliseconds)
      inputDelay: attribution.inputDelay,
      processingDuration: attribution.processingDuration,
      presentationDelay: attribution.presentationDelay,

      // Context
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
    }),
    headers: { 'Content-Type': 'application/json' },
    // keepalive: gửi dù user rời page (important cho end-of-session data!)
    keepalive: true,
  });
}

// Helper: DOM element → CSS selector string
function getSelector(element: Element, maxLength = 100): string {
  let selector = '';
  try {
    // Ưu tiên id
    if (element.id) return `#${element.id}`;

    // Build selector từ element và ancestors
    selector = element.tagName.toLowerCase();
    if (element.className) {
      const classes = Array.from(element.classList).slice(0, 2).join('.');
      selector += `.${classes}`;
    }
  } catch (e) {
    selector = 'unknown';
  }
  return selector.slice(0, maxLength);
}

onINP(sendToAnalytics, { reportAllChanges: false });
```

---

### Step 2: Long Animation Frames API (LoAF) — "Tại sao" chậm

**LoAF** (Long Animation Frames, Chrome 123+) là API mới thay thế Long Tasks API — cung cấp **attribution chi tiết hơn**: biết SCRIPT nào gây ra frame chậm.

```javascript
// Setup LoAF observer — bắt tất cả frames > 50ms
const loafObserver = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.duration < 50) continue; // Chỉ quan tâm long frames

    console.group(`Long Animation Frame: ${entry.duration.toFixed(1)}ms`);

    // Breakdown của frame này
    console.log('Blocking duration:', entry.blockingDuration, 'ms');
    // blockingDuration = thời gian frame block user input

    // Scripts gây ra frame chậm này
    for (const script of entry.scripts) {
      console.log('Script:', {
        name: script.sourceURL,      // File URL
        functionName: script.sourceFunctionName, // Function name
        duration: script.duration,   // ms script này chiếm
        invokerType: script.invokerType, // 'event-listener' | 'user-callback' | 'resolve-promise' | ...
        invoker: script.invoker,     // Mô tả ngắn (e.g., "BUTTON#submit.click")
      });
    }

    // Style/layout thời gian
    console.log('Style & layout:', entry.styleAndLayoutStart
      ? (entry.startTime + entry.duration) - entry.styleAndLayoutStart
      : 0, 'ms');

    console.groupEnd();
  }
});

// Check browser support trước khi observe
if (PerformanceObserver.supportedEntryTypes.includes('long-animation-frame')) {
  loafObserver.observe({ type: 'long-animation-frame', buffered: true });
}
```

```
LoAF vs Long Tasks API — Tại sao LoAF tốt hơn:
┌────────────────────────────────────────────────────────────┐
│ Long Tasks API (cũ):                                      │
│   entry.duration: 234ms                                   │
│   entry.name: 'self'                                      │
│   → Chỉ biết "có task 234ms" — không biết TẠI SAO!       │
│                                                            │
│ LoAF (mới, Chrome 123+):                                  │
│   entry.duration: 234ms                                   │
│   entry.blockingDuration: 190ms                           │
│   entry.scripts[0]:                                       │
│     sourceURL: 'https://myapp.com/bundle.js'             │
│     sourceFunctionName: 'handleFilterChange'              │
│     duration: 180ms                                       │
│     invokerType: 'event-listener'                         │
│     invoker: 'INPUT#search-box.input'                    │
│   → "Function handleFilterChange trong bundle.js,         │
│      triggered bởi INPUT#search-box, mất 180ms"          │
│   → Biết chính xác đâu cần fix!                          │
└────────────────────────────────────────────────────────────┘
```

```javascript
// Kết hợp INP Attribution + LoAF để có picture hoàn chỉnh
import { onINP } from 'web-vitals/attribution';

// Lưu LoAF entries để correlate với INP
const recentLoAFs: PerformanceEntry[] = [];
const MAX_LOAF_BUFFER = 30;

if (PerformanceObserver.supportedEntryTypes.includes('long-animation-frame')) {
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      recentLoAFs.push(entry);
      // Giữ buffer nhỏ
      if (recentLoAFs.length > MAX_LOAF_BUFFER) recentLoAFs.shift();
    }
  }).observe({ type: 'long-animation-frame', buffered: true });
}

onINP((metric) => {
  const { attribution } = metric;

  // Tìm LoAF entries overlap với INP interaction
  const interactionStart = metric.entries[0]?.startTime ?? 0;
  const interactionEnd = interactionStart + metric.value;

  const overlappingLoAFs = recentLoAFs.filter(loaf => {
    const loafEnd = loaf.startTime + loaf.duration;
    // Check overlap
    return loaf.startTime < interactionEnd && loafEnd > interactionStart;
  });

  // Gửi lên server với full context
  sendToAnalytics({
    inp: metric.value,
    rating: metric.rating,
    interactionTarget: attribution.interactionTarget,
    interactionType: attribution.interactionType,
    phases: {
      inputDelay: attribution.inputDelay,
      processingDuration: attribution.processingDuration,
      presentationDelay: attribution.presentationDelay,
    },
    // LoAF data: biết SCRIPT nào gây chậm
    culpritScripts: overlappingLoAFs.flatMap(loaf =>
      (loaf as any).scripts?.map((s: any) => ({
        url: s.sourceURL,
        fn: s.sourceFunctionName,
        duration: s.duration,
        invoker: s.invoker,
      })) ?? []
    ),
  });
});
```

---

### Step 3: Từ Field Data → Reproduce trong DevTools

```
Field data cung cấp:
  interactionTarget: "#search-input"
  interactionType: "keyboard"
  inputDelay: 145ms       ← PHASE 1 chậm!
  processingDuration: 23ms
  presentationDelay: 12ms

→ Diagnosis: Input delay cao → main thread bận khi user gõ

DevTools Reproduction Workflow:
  1. Mở Chrome DevTools → Performance tab
  2. Click "Record" (Ctrl+Shift+E)
  3. Gõ vào #search-input
  4. Stop recording
  5. Nhìn vào "Interactions" track → click interaction đó
  6. Zoom vào timeline → xem task nào đang chạy trước interaction
  7. Tìm long task (màu đỏ) → click → xem flame chart

→ Tìm ra: analytics tracker đang poll mỗi 100ms → input delay!
```

```
DevTools Performance tab — Đọc kết quả:
┌────────────────────────────────────────────────────────────────┐
│ Main thread timeline:                                          │
│                                                                │
│ ████████████████░░░[EVENT]███████████░░░░░░░░░[PAINT]        │
│ ↑                 ↑       ↑         ↑         ↑              │
│ Long task        User    Handler   Handler   Next             │
│ (analytics)      types   starts    ends      paint           │
│ 145ms            input                                        │
│                                                                │
│ ← Input Delay → ← Processing  → ← Presentation Delay →      │
│    145ms              23ms              12ms                  │
│                                                                │
│ → Culprit: Long task trước input = analytics poller          │
└────────────────────────────────────────────────────────────────┘
```

---

### Gotcha Quan Trọng: `interactionTarget` có thể Misleading!

```
⚠️ interactionTarget = element bị click
   KHÔNG PHẢI = nguyên nhân gây chậm!

Ví dụ:
  User click #checkout-button
  INP = 800ms
  interactionTarget = "#checkout-button"

  Bạn nghĩ: "Checkout button handler chậm"
  Thực tế: Input delay 750ms — analytics script block main thread!
  Handler của button chỉ mất 20ms

→ LUÔN check phase breakdown TRƯỚC:
  inputDelay cao?       → Main thread bận trước interaction
                          (long tasks, third-party scripts)
  processingDuration cao? → Event handler code chậm
  presentationDelay cao?  → Rendering expensive (DOM size, layout)

→ interactionTarget chỉ giúp tìm ĐÂU user tương tác
  LoAF + flame chart mới nói TẠI SAO chậm
```

---

### Dashboard Pattern — Aggregate Field Data

```typescript
// Aggregating INP data tại server/analytics để prioritize fixes

// Endpoint nhận vitals data
// POST /api/vitals
// Body: { name, value, rating, interactionType, interactionTarget,
//         inputDelay, processingDuration, presentationDelay, url }

// SQL queries hữu ích:

// 1. Tìm interactions chậm nhất (P75 INP > 200ms)
/*
SELECT
  interactionTarget,
  interactionType,
  url,
  PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY value) as p75_inp,
  AVG(inputDelay) as avg_input_delay,
  AVG(processingDuration) as avg_processing,
  AVG(presentationDelay) as avg_presentation,
  COUNT(*) as occurrences
FROM web_vitals
WHERE name = 'INP' AND value > 200
GROUP BY interactionTarget, interactionType, url
ORDER BY p75_inp DESC, occurrences DESC
LIMIT 20;
*/

// 2. Xác định phase nào chậm nhất theo target
/*
SELECT
  interactionTarget,
  AVG(inputDelay) as avg_input_delay,
  AVG(processingDuration) as avg_processing,
  AVG(presentationDelay) as avg_presentation,
  -- Identify dominant phase
  CASE
    WHEN AVG(inputDelay) > AVG(processingDuration)
      AND AVG(inputDelay) > AVG(presentationDelay) THEN 'input_delay'
    WHEN AVG(processingDuration) > AVG(presentationDelay) THEN 'processing'
    ELSE 'presentation'
  END as dominant_phase
FROM web_vitals
WHERE name = 'INP'
GROUP BY interactionTarget
HAVING COUNT(*) > 100  -- Đủ sample size
ORDER BY (avg_input_delay + avg_processing + avg_presentation) DESC;
*/
```

---

### Complete Field Debugging Workflow

```
INP Field Debugging — End-to-End:
┌────────────────────────────────────────────────────────────────┐
│ STEP 1: Setup (một lần)                                        │
│   npm install web-vitals                                       │
│   Import từ 'web-vitals/attribution' (không phải 'web-vitals')│
│   onINP(sendToAnalytics) với full attribution data            │
│   Setup LoAF observer để capture culprit scripts              │
│                                                                │
│ STEP 2: Collect (liên tục)                                    │
│   Field data từ real users → database                         │
│   Track: interactionTarget, phases, loadState, URL            │
│                                                                │
│ STEP 3: Prioritize (weekly)                                   │
│   Query: Top 10 slow interactions by P75 INP + frequency      │
│   Focus: Interactions xảy ra nhiều + INP cao nhất            │
│   Identify: dominant phase (input delay / processing / pres.) │
│                                                                │
│ STEP 4: Reproduce (per issue)                                 │
│   Biết: element + type + phase từ field data                  │
│   Open: Chrome DevTools Performance tab                       │
│   Record: trigger same interaction                            │
│   Analyze: flame chart, identify culprit function             │
│                                                                │
│ STEP 5: Fix + Verify                                          │
│   Apply fix (scheduler.yield, startTransition, etc.)         │
│   Deploy → Monitor field data                                 │
│   Confirm INP improvement trong 1-2 weeks                     │
│                                                                │
│ STEP 6: Repeat                                                │
│   Next slow interaction trong priority list                   │
└────────────────────────────────────────────────────────────────┘

Tools stack:
  Field collection: web-vitals/attribution + LoAF observer
  Storage:          Sentry, DataDog, BigQuery, hoặc custom
  Analysis:         Dashboard SQL queries + P75 segmentation
  Lab debugging:    Chrome DevTools Performance tab (Interactions track)
  Browser support:  LoAF = Chrome 123+ only (graceful degradation)
```


---

## Deep Dive: Manually Diagnose Slow Interactions in the Lab

> **Nguồn:** [web.dev/articles/manually-diagnose-slow-interactions-in-the-lab](https://web.dev/articles/manually-diagnose-slow-interactions-in-the-lab) — Google Web.dev
>
> Bài trước dạy tìm slow interactions từ **field data**. Bài này dạy cách **reproduce và diagnose trong Chrome DevTools** — bước "tại sao chậm" trong vòng lặp debug. Đây là skill DevTools cần thiết cho mọi frontend engineer làm về performance.

### Tại sao cần Lab Diagnosis?

```
Field Data (RUM) → "Button #submit chậm 800ms"
                       ↓
Lab Diagnosis (DevTools) → "Function handleSubmit gọi validateAll()
                            mất 650ms vì iterate 50,000 items"
                       ↓
Fix → scheduler.yield() + pagination

→ Không có Lab Diagnosis → không biết cần fix GÌ!
```

---

### Setup: Trước khi Record

```
Best practices để có accurate results:

1. Dùng Incognito window:
   → Extensions không interfere (ad blocker, React DevTools...)
   → Cache sạch
   → Không có background tabs ảnh hưởng CPU

2. Bật CPU Throttling để simulate mobile devices:
   DevTools → Performance tab → ⚙️ (Capture settings)
   CPU: 4x slowdown  ← Simulate mid-range Android phone
        6x slowdown  ← Simulate low-end Android phone
   → Long tasks nổi bật hơn → dễ spot
   → Gần với experience của 80% users hơn máy Dev của bạn!

3. Disable network throttling (trừ khi đang debug network):
   → Chỉ throttle CPU cho interaction debugging

4. Reload page để bắt đầu từ trạng thái clean:
   → Tránh stale state từ lần debug trước
```

---

### Step-by-Step: Record và Analyze

#### Step 1: Bắt đầu Recording

```
Chrome DevTools → Performance tab:

┌─────────────────────────────────────────────────────────────┐
│ ● Record  ↺ Reload  ⚙️ Settings                            │
│                                                             │
│ ● = Click để START recording                               │
│ Shortcut: Ctrl+Shift+E (Windows) / Cmd+Shift+E (Mac)       │
│                                                             │
│ Sau khi click Record:                                       │
│   - DevTools bắt đầu capture mọi thứ trên main thread      │
│   - Một chấm đỏ nhấp nháy → đang record                   │
│   - Thực hiện ĐÚNG interaction bạn muốn diagnose           │
│   - Dừng ngay sau interaction (không record quá dài)        │
│     → Recording quá dài = khó tìm interaction trong trace  │
└─────────────────────────────────────────────────────────────┘
```

#### Step 2: Nhìn vào Interactions Track

```
Sau khi stop recording, timeline xuất hiện:

Timeline Layout:
┌─────────────────────────────────────────────────────────────┐
│ Timings    │ FCP  LCP                                       │
│ Interactions│ ████████████████ ← INTERACTION BARS          │
│ Network    │ ▬▬▬▬ ▬▬▬ ▬▬                                  │
│ Main       │ ████░███████░░░████████ ← FLAME CHART         │
│            │                                               │
│ Interactions track: mỗi bar = 1 interaction               │
│   Màu xanh = OK (< 200ms)                                 │
│   Màu đỏ (red triangle) = SLOW (> 200ms) ← mục tiêu debug│
└─────────────────────────────────────────────────────────────┘

Khi click vào 1 interaction bar:
  → Panel bên dưới hiện Summary với 3 phases:
  Input delay:         45ms  ← Phase 1
  Processing duration: 620ms ← Phase 2 (CULPRIT!)
  Presentation delay:  12ms  ← Phase 3
  Total:               677ms
```

#### Step 3: Identify Phase Chậm và Locate trong Flame Chart

```
Dựa vào phase breakdown → biết cần nhìn vào đâu:

Phase 1 (Input Delay) cao → Tìm Long Tasks TRƯỚC interaction
┌─────────────────────────────────────────────────────────────┐
│ [Long Task: 200ms] [Long Task: 150ms] [Click Event: ...]   │
│   ↑ Tìm task này ← chúng block input!                     │
└─────────────────────────────────────────────────────────────┘

Phase 2 (Processing) cao → Zoom vào trong click event handler
┌─────────────────────────────────────────────────────────────┐
│        [click ▼]                                           │
│          [handleSubmit ▼]                                  │
│            [validateAll ▼]    ← 620ms! HERE               │
│              [validateItem x 50000]                        │
└─────────────────────────────────────────────────────────────┘

Phase 3 (Presentation) cao → Tìm Purple bars sau handler
┌─────────────────────────────────────────────────────────────┐
│ [click handler] [Recalculate Style: 400ms] ← purple bar   │
│                 [Layout: 200ms]            ← purple bar   │
└─────────────────────────────────────────────────────────────┘
```

#### Step 4: Đọc Flame Chart

```
Flame Chart anatomy:
┌─────────────────────────────────────────────────────────────┐
│  Main Thread:                                               │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Task (677ms)                         ███ Red = slow  │  │
│  │ ┌──────────────────────────────────┐                 │  │
│  │ │ Event: click (620ms)             │                 │  │
│  │ │ ┌────────────────────────────┐   │                 │  │
│  │ │ │ handleSubmit (618ms)       │   │                 │  │
│  │ │ │ ┌────────────────────┐     │   │                 │  │
│  │ │ │ │ validateAll (610ms)│     │   │                 │  │
│  │ │ │ │ ┌──────────────┐   │     │   │                 │  │
│  │ │ │ │ │validateItem  │×N │     │   │                 │  │
│  │ │ │ └─┴──────────────┘   │     │   │                 │  │
│  │ │ └────────────────────────────┘   │                 │  │
│  │ └──────────────────────────────────┘                 │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│ Đọc flame chart: TOP = caller, BOTTOM = callee             │
│ WIDTH ∝ TIME TAKEN                                         │
│ → Function rộng nhất ở bottom = most expensive             │
└─────────────────────────────────────────────────────────────┘
```

#### Step 5: Bottom-Up và Call Tree tabs

```
3 tabs phân tích dữ liệu sau khi SELECT một range:

Summary tab:
  Tổng thời gian: Scripting / Rendering / Painting / Idle
  → "60% Scripting, 30% Rendering" → biết bottleneck là JS

Bottom-Up tab (MOST USEFUL cho tìm culprit):
  Function            │ Self Time │ Total Time
  validateItem        │ 580ms     │ 580ms    ← CULPRIT!
  validateAll         │ 5ms       │ 585ms
  handleSubmit        │ 3ms       │ 618ms
  (anonymous)         │ 2ms       │ 620ms

  → Self Time = thời gian function TỰ CHẠY (không kể con)
  → Sort by Self Time → tìm function tốn CPU nhất
  → validateItem 580ms self time = đây là cái cần optimize!

Call Tree tab (để hiểu context):
  Task
  └─ Event: click
     └─ handleSubmit
        └─ validateAll
           └─ validateItem [called 50,000 times!]

  → Thấy được "50,000 times" → biết cần pagination hoặc lazy validate
```

---

### Color Coding trong Performance Timeline

```
Color Guide — mỗi màu = loại work khác nhau:

YELLOW  ████ Scripting       → JavaScript execution
         → Tìm yellow blocks lớn = JS đang block
         → Solution: break up tasks, Web Workers

PURPLE  ████ Rendering       → Style + Layout calculation
         → Nếu to sau click → layout thrashing hoặc DOM size
         → Solution: batch reads/writes, content-visibility

GREEN   ████ Painting        → Actual pixel drawing
         → Ít khi là bottleneck (GPU accelerated thường OK)
         → Nếu to → tránh paint-heavy CSS (box-shadow...)

GRAY    ████ Idle/System     → Browser doing its own things

RED    ▲    Long Task flag   → Task > 50ms (red triangle)
            → Mọi task có red triangle = cần attention!
```

---

### Common Patterns và Fix Actions

```
Pattern 1: Long Task TRƯỚC interaction (Input Delay cao)
┌─────────────────────────────────────────────────────────────┐
│ Timeline: [██████ setInterval callback 150ms] [CLICK]      │
│                                                             │
│ Reading: Analytics setInterval block main thread           │
│ Fix:     requestIdleCallback cho analytics                  │
│          KHÔNG dùng setInterval với heavy work             │
└─────────────────────────────────────────────────────────────┘

Pattern 2: Deep Call Stack trong Event Handler (Processing cao)
┌─────────────────────────────────────────────────────────────┐
│ Flame: click → handler → processAll → computeItem (×1000) │
│                                                             │
│ Reading: Synchronous loop quá nhiều iterations             │
│ Fix:     scheduler.yield() mỗi N iterations                 │
│          Pagination, virtualization                         │
└─────────────────────────────────────────────────────────────┘

Pattern 3: Purple Blocks lớn sau Handler (Presentation cao)
┌─────────────────────────────────────────────────────────────┐
│ Timeline: [click handler] [████ Recalculate Style 300ms]  │
│                                                             │
│ Reading: Style recalculation quá đắt → DOM quá to?         │
│          Hoặc forced synchronous layout?                    │
│ Fix:     content-visibility: auto                          │
│          Giảm DOM nodes                                     │
│          Batch DOM writes                                   │
└─────────────────────────────────────────────────────────────┘

Pattern 4: Third-party Script trong Long Task
┌─────────────────────────────────────────────────────────────┐
│ Timeline: [██████ cdn.analytics.com/tracker.js 200ms]      │
│                                                             │
│ Reading: Third-party script block main thread              │
│ Fix:     async/defer loading                                │
│          Facade pattern                                     │
│          Load sau user interaction                          │
└─────────────────────────────────────────────────────────────┘
```

---

### Practical Shortcuts và Tips

```
DevTools Performance Keyboard Shortcuts:
  W / S         → Zoom in / out (timeline)
  A / D         → Pan left / right
  Ctrl+F        → Search trong flame chart
  Click + drag  → Select time range → Bottom-Up/Call Tree filter

Tips để debug hiệu quả:

1. RECORD NGẮN: 2-3 seconds quanh interaction
   → Trace dài = khó tìm interaction
   → Nên: Click Record → Wait 0.5s → Perform interaction → Stop

2. CPU Throttle 4x là sweet spot:
   → 1x = long tasks ngắn, khó thấy
   → 6x = quá slow, không realistic
   → 4x = balance tốt nhất

3. Disable extensions với Incognito:
   → React DevTools có overhead riêng
   → Ad blockers có thể mask third-party issues

4. Dùng "Interactions" track để navigate nhanh:
   → Click vào interaction bar → auto-scroll flame chart đến đúng vị trí
   → Không cần scroll manually trong trace dài

5. Performance.mark() để annotate:
   // Thêm vào code để mark trong timeline
   performance.mark('validateAll:start');
   validateAll(data);
   performance.mark('validateAll:end');
   performance.measure('validateAll', 'validateAll:start', 'validateAll:end');
   // → Xuất hiện trong Timings track của DevTools!
   // → Đặt marker giúp locate chính xác vùng cần fix
```

---

### Workflow Tổng hợp: Field → Lab → Fix

```
Complete INP Debug Workflow:
┌────────────────────────────────────────────────────────────────┐
│ FIELD (web-vitals/attribution):                               │
│   onINP → interactionTarget="#search-btn"                     │
│         → interactionType="click"                             │
│         → inputDelay=12ms, processingDuration=680ms           │
│         → "Processing phase is the culprit!"                  │
│                                    │                          │
│                                    ▼                          │
│ LAB (Chrome DevTools):                                        │
│   1. Incognito + CPU 4x throttle                             │
│   2. Record → click #search-btn → Stop                       │
│   3. Interactions track → click slow interaction bar         │
│   4. Confirm: processingDuration 680ms matches field         │
│   5. Zoom flame chart into "Event: click" block              │
│   6. Bottom-Up → Self Time sort:                             │
│        filterItems: 650ms self time ← FOUND IT!             │
│   7. Call Tree → filterItems called with 100,000 items!      │
│                                    │                          │
│                                    ▼                          │
│ FIX:                                                          │
│   async function handleSearch(query) {                        │
│     const CHUNK = 1000;                                       │
│     const results = [];                                       │
│     for (let i = 0; i < allItems.length; i += CHUNK) {      │
│       results.push(...filterItems(allItems.slice(i, i+CHUNK), query)); │
│       await scheduler.yield(); // yield mỗi 1000 items       │
│     }                                                         │
│     setResults(results);                                      │
│   }                                                           │
│                                    │                          │
│                                    ▼                          │
│ VERIFY (Lab):                                                 │
│   Record lại → processingDuration giảm từ 680ms → 45ms ✅   │
│                                    │                          │
│                                    ▼                          │
│ DEPLOY + MONITOR (Field):                                     │
│   INP P75 giảm từ 720ms → 85ms sau 1 tuần ✅               │
└────────────────────────────────────────────────────────────────┘
```


---

## Deep Dive: Optimize Long Tasks — Breaking Up Main Thread Work

> **Nguồn:** [web.dev/articles/optimize-long-tasks](https://web.dev/articles/optimize-long-tasks) — Google Web.dev
>
> **Long Tasks** (tasks > 50ms trên main thread) là root cause của hầu hết INP issues. Bài này là reference đầy đủ về **tất cả kỹ thuật break up long tasks** — từ `setTimeout` đơn giản đến `scheduler.postTask()` với priority control, kèm tradeoffs rõ ràng.

### Tại sao 50ms là ngưỡng?

```
Browser main thread = single-threaded:
  Mọi JS, rendering, input handling đều chạy trên 1 thread

Một task đang chạy → không thể handle input:
  ┌────────────────────────────────────────────────────────────┐
  │ Task: 300ms                                               │
  │ ████████████████████████████████████████████████████████  │
  │                                                           │
  │ t=50ms: User clicks button                               │
  │   Browser: "Can't handle it yet, task is running!"       │
  │ t=150ms: User clicks again (frustrated)                  │
  │ t=300ms: Task finishes → handle both clicks (too late!)  │
  │                                                           │
  │ Input delay = 250ms → INP = POOR                         │
  └────────────────────────────────────────────────────────────┘

50ms rule: Long Task = ANY task > 50ms
  → 50ms = Human perception threshold
  → < 50ms: interaction feels instant
  → > 50ms: user notices lag
  → > 300ms: user thinks something is broken
```

---

### Yielding Techniques — So sánh đầy đủ

#### Technique 1: `setTimeout(fn, 0)` — Classic approach

```javascript
// setTimeout(fn, 0): đặt fn vào task queue, chạy sau current task
// → Yield về main thread, browser có thể handle input

// ❌ Không yield: 1 monolithic task 400ms
function saveSettings(data) {
  validateAll(data);      // 100ms
  persistToStorage(data); // 150ms
  updateUI(data);         // 100ms
  logAnalytics(data);     // 50ms
  // Total: 1 task 400ms = LONG TASK!
}

// ✅ setTimeout yield: tách thành nhiều tasks nhỏ
function saveSettings(data) {
  // Task 1: Validate
  validateAll(data); // 100ms

  setTimeout(() => {
    // Task 2: Persist (sau task 1)
    persistToStorage(data); // 150ms

    setTimeout(() => {
      // Task 3: Update UI
      updateUI(data); // 100ms

      setTimeout(() => {
        // Task 4: Analytics (lowest priority)
        logAnalytics(data); // 50ms
      }, 0);
    }, 0);
  }, 0);
}
// Mỗi task < 200ms → browser có gaps để handle input!
```

```
setTimeout(fn, 0) — Cách hoạt động:
  Task queue: [currentTask] [fn] [other tasks...]
  → fn được đặt CUỐI queue → có thể bị delay bởi tasks khác!
  → Không prioritized → đây là limitation của setTimeout
```

#### Technique 2: `scheduler.yield()` — Modern recommended

```javascript
// scheduler.yield(): Purpose-built cho yielding
// ✅ Continuation được prioritized (không bị push xuống cuối queue)
// ✅ Cleaner async/await syntax

async function saveSettings(data) {
  validateAll(data);

  await scheduler.yield(); // Yield → browser handles pending input

  persistToStorage(data);

  await scheduler.yield(); // Yield lại

  updateUI(data);

  await scheduler.yield();

  logAnalytics(data);
}
```

```
scheduler.yield() vs setTimeout(fn, 0):
┌────────────────────────────────────────────────────────────┐
│ setTimeout(fn, 0):                                        │
│   Task queue: [A] [B] [C] [your-continuation] [D] [E]   │
│   → Continuation phải đợi A, B, C xong mới chạy         │
│   → D và E có thể chen vào trước!                        │
│                                                            │
│ scheduler.yield():                                        │
│   Task queue: [A] [your-continuation (HIGH)] [B] [C]    │
│   → Continuation được prioritized                         │
│   → Chỉ pending user interactions được ưu tiên hơn       │
│   → Tốt hơn setTimeout trong thực tế!                   │
└────────────────────────────────────────────────────────────┘

Browser support (2024):
  scheduler.yield(): Chrome 124+, Edge 124+ (NOT Safari/Firefox)
  → Cần feature detection + fallback!
```

```javascript
// Polyfill/fallback pattern — Production ready
const yieldToMain = typeof scheduler?.yield === 'function'
  ? () => scheduler.yield()
  : () => new Promise(resolve => setTimeout(resolve, 0));

// Dùng thống nhất:
async function processItems(items) {
  for (let i = 0; i < items.length; i++) {
    processItem(items[i]);

    if (i % 50 === 0) {
      await yieldToMain(); // Works in all browsers!
    }
  }
}
```

#### Technique 3: `scheduler.postTask()` — Priority-based scheduling

```javascript
// scheduler.postTask(): Schedule task với explicit priority
// Priorities:
//   'user-blocking': HIGHEST — for critical UI updates
//   'user-visible':  DEFAULT — for important but non-blocking work
//   'background':    LOWEST  — for analytics, prefetching

// Basic usage:
scheduler.postTask(() => {
  updateCriticalUI();
}, { priority: 'user-blocking' });

scheduler.postTask(() => {
  loadSecondaryContent();
}, { priority: 'user-visible' });

scheduler.postTask(() => {
  logAnalytics();
}, { priority: 'background' });
```

```javascript
// Advanced: TaskController — cancel hoặc re-prioritize tasks
const controller = new TaskController({ priority: 'background' });

// Preload route data (low priority, happens in background)
const preloadTask = scheduler.postTask(
  () => prefetchRouteData('/settings'),
  { signal: controller.signal }
);

// User navigates to settings → URGENT now!
function handleSettingsClick() {
  // Elevate priority từ 'background' → 'user-blocking'
  controller.setPriority('user-blocking');
  // Task sẽ chạy ngay (high priority)
}

// User navigates elsewhere → Cancel preload
function handleOtherNavigation() {
  controller.abort(); // Cancel task hoàn toàn
}
```

```
postTask priorities trong practice:
┌────────────────────────────────────────────────────────────┐
│ user-blocking:  Để làm gì?                                │
│   → Input handlers, critical state updates                │
│   → Anything blocking user from proceeding               │
│   → E.g.: form validation after submit                   │
│                                                            │
│ user-visible:   Để làm gì? (default)                     │
│   → Non-critical UI updates                              │
│   → Loading secondary content                            │
│   → E.g.: lazy-load tab content, sidebars               │
│                                                            │
│ background:     Để làm gì?                               │
│   → Analytics, logging                                   │
│   → Preloading/prefetching                              │
│   → Syncing data                                         │
│   → E.g.: send beacon, prefetch next page               │
└────────────────────────────────────────────────────────────┘

Browser support (2024):
  scheduler.postTask(): Chrome 94+, Edge 94+ (NOT Safari/Firefox)
  → Cần feature detection!
```

---

### Anti-pattern: Yield Quá Nhiều

```javascript
// ❌ BAD: Yield sau MỖI item → overhead > benefit!
async function processItems(items) {
  for (const item of items) {
    processItem(item); // Chỉ mất 0.1ms mỗi item
    await scheduler.yield(); // Yield 1ms overhead!
    // 1000 items × (0.1ms work + 1ms yield overhead) = 1100ms
    // vs KHÔNG yield: 1000 × 0.1ms = 100ms!
    // → CHẬM HƠN 11 LẦN vì yield quá nhiều!
  }
}

// ✅ GOOD: Yield dựa trên thời gian đã trôi qua
async function processItems(items) {
  let lastYield = performance.now();

  for (const item of items) {
    processItem(item);

    const now = performance.now();
    // Chỉ yield khi đã làm việc > 50ms liên tục
    if (now - lastYield > 50) {
      await scheduler.yield();
      lastYield = performance.now(); // Reset timer
    }
  }
}
// → Yield ~mỗi 50ms → balance tốt giữa responsiveness và overhead
```

---

### Pattern: "Prioritize, Don't Defer" — Visual first

```javascript
// Pattern quan trọng từ web.dev:
// Làm VISUAL UPDATE trước → yield → làm non-visual work sau

// ❌ BAD: Làm analytics trước khi update UI
async function handleProductClick(product) {
  await logAnalytics(product); // 80ms — non-visual, không urgent
  await saveToRecentlyViewed(product); // 50ms
  updateProductDisplay(product); // 20ms — user đang chờ cái này!
  // User thấy UI update sau 150ms → laggy!
}

// ✅ GOOD: "Prioritize" — visual update TRƯỚC, defer non-visual
async function handleProductClick(product) {
  // STEP 1: Update UI ngay — user cần thấy điều này
  updateProductDisplay(product); // 20ms

  // STEP 2: Yield → browser paint new UI → user thấy ngay!
  await scheduler.yield();

  // STEP 3: Non-visual work (sau khi user đã thấy response)
  logAnalytics(product);         // 80ms — chạy "behind the scenes"
  saveToRecentlyViewed(product); // 50ms — không urgent
}
// User thấy UI update sau 20ms (không phải 150ms!)
// Analytics vẫn chạy, nhưng không block user experience
```

---

### Khi nào dùng Web Workers thay vì Yielding?

```
Yielding vs Web Workers:
┌────────────────────────────────────────────────────────────┐
│ YIELDING (scheduler.yield / setTimeout):                  │
│   ✅ Simple to implement                                   │
│   ✅ Access to DOM                                        │
│   ✅ Access to all Web APIs                               │
│   ❌ Vẫn trên main thread → không thực sự parallel       │
│   ❌ Overhead từ yield/resume                             │
│   Use when: Work CẦN DOM access                          │
│                                                            │
│ WEB WORKERS:                                              │
│   ✅ Truly parallel (separate thread)                     │
│   ✅ Zero impact on main thread                           │
│   ✅ Tốt cho CPU-intensive tasks                         │
│   ❌ No DOM access                                        │
│   ❌ Communication overhead (postMessage serialization)   │
│   ❌ More complex to setup                                │
│   Use when: Heavy computation không cần DOM               │
└────────────────────────────────────────────────────────────┘

Decision: "Does this work need the DOM?"
  YES → Yielding (scheduler.yield / setTimeout)
  NO  → Web Worker

Examples:
  Filtering/sorting data    → Web Worker (no DOM needed)
  Image processing          → Web Worker (OffscreenCanvas)
  Cryptography/hashing      → Web Worker
  Updating DOM elements     → Yielding (needs DOM)
  React state updates       → startTransition (React's yielding)
  Form validation UI        → Yielding
```

```javascript
// Web Worker example cho heavy computation
// main.ts:
const worker = new Worker(new URL('./heavy-worker.ts', import.meta.url));

async function processLargeDataset(data: DataItem[]) {
  return new Promise<ProcessedItem[]>((resolve, reject) => {
    worker.onmessage = (e) => resolve(e.data.results);
    worker.onerror = (e) => reject(e);

    // Gửi data sang worker (serialized via structured clone)
    worker.postMessage({ type: 'process', data });
  });
}

// Sử dụng: Main thread hoàn toàn free!
const processedData = await processLargeDataset(rawData);
setData(processedData); // Update DOM từ main thread

// heavy-worker.ts (runs in separate thread):
self.onmessage = (e) => {
  if (e.data.type === 'process') {
    const results = e.data.data.map(item => {
      // Heavy computation — không block main thread!
      return expensiveTransform(item);
    });
    self.postMessage({ results });
  }
};
```

---

### Tổng hợp: Chọn Technique nào?

```
Decision Tree — Optimize Long Tasks:

Task > 50ms detected?
         │
    Yes──┼──No: No action needed
         │
         ▼
Needs DOM access?
         │
    No───┼──Yes
         │   │
         │   ▼
         │ Single component renders slowly?
         │   │
         │ Yes─┼──No: Many components?
         │     │       │
         │     │       ▼
         │     │    React.startTransition / useDeferredValue
         │     │
         │     ▼
         │ Split component into smaller sub-components
         │ THEN use startTransition
         │
         ▼
Web Worker (no DOM needed)

For DOM-needing tasks:
  Need priority control?    → scheduler.postTask() (Chrome 94+)
  Need cancel/reprioritize? → TaskController
  Simple yield needed?      → scheduler.yield() (Chrome 124+)
  Need cross-browser?       → setTimeout(fn, 0) fallback

Always:
  Yield dựa trên elapsed time (mỗi 50ms)
  KHÔNG yield sau mỗi item (quá nhiều overhead)
  Visual update TRƯỚC → yield → non-visual work SAU

API Compatibility Matrix (2024):
┌──────────────────────────────────────────────────┐
│ API              │ Chrome │ Firefox │ Safari      │
├──────────────────────────────────────────────────┤
│ setTimeout       │  ✅    │   ✅    │   ✅       │
│ scheduler.yield  │  ✅124+│   ❌    │   ❌       │
│ scheduler.postTask│  ✅94+ │   ❌    │   ❌       │
│ requestIdleCallback│ ✅    │   ✅    │   ✅       │
│ Web Workers      │  ✅    │   ✅    │   ✅       │
└──────────────────────────────────────────────────┘
→ Production: luôn có setTimeout fallback!
```


---

## Deep Dive: Optimize Input Delay — Phase 1 Deep Dive

> **Nguồn:** [web.dev/articles/optimize-input-delay](https://web.dev/articles/optimize-input-delay) — Google Web.dev
>
> Trong chuỗi INP bài viết, bài này focus hoàn toàn vào **Phase 1: Input Delay** — thời gian từ khi user tương tác đến khi event handler BẮT ĐẦU chạy. Input delay thường là culprit ẩn và ít được chú ý nhất, nhưng lại là nguyên nhân phổ biến nhất gây INP cao.

### Input Delay là gì và tại sao khó debug?

```
INP = Input Delay + Processing Duration + Presentation Delay
             ↑
     Bài này focus vào đây

Input Delay khó debug vì:
  - Không xuất hiện trong event handler code của bạn
  - Thường do code KHÁC đang chạy (timers, third-party)
  - Chỉ thấy khi nhìn vào main thread timeline trong DevTools
  - User thấy "lag" nhưng handler của bạn chạy bình thường!

Ví dụ trực quan:
  ┌────────────────────────────────────────────────────────┐
  │ t=0ms:   User clicks button                           │
  │ t=1ms:   Browser notes click event                    │
  │ t=1ms:   Main thread busy: setInterval callback...    │
  │ t=150ms: setInterval finishes                         │
  │ t=150ms: Click handler STARTS (150ms input delay!)   │
  │ t=170ms: Click handler finishes (20ms processing)    │
  │ t=180ms: Browser paints                               │
  │                                                        │
  │ INP = 180ms (mostly input delay, not your handler!)   │
  └────────────────────────────────────────────────────────┘
```

---

### Nguyên nhân 1: Timers Running at Inopportune Times

**`setInterval` và `setTimeout`** với heavy callbacks là nguyên nhân phổ biến nhất của high input delay.

```javascript
// ❌ BAD: setInterval với heavy work — chạy mỗi 1 giây
setInterval(() => {
  // Heavy: sync data, recalculate, update DOM
  syncDataToServer();        // 40ms
  recalculateDashboard();   // 60ms
  updateAllCharts();         // 80ms
  // Total: 180ms mỗi 1 giây!
  // → Nếu user click trong 180ms này → input delay = 180ms!
}, 1000);

// ✅ FIX 1: Dùng requestIdleCallback cho non-urgent work
function scheduleDataSync() {
  requestIdleCallback(() => {
    syncDataToServer(); // Chỉ chạy khi browser idle
    scheduleDataSync(); // Re-schedule sau khi xong
  }, {
    timeout: 5000 // Tối đa đợi 5s kể cả không idle
  });
}
scheduleDataSync();

// ✅ FIX 2: Chia nhỏ interval tasks với yield
async function runDashboardUpdate() {
  syncDataToServer();          // 40ms
  await scheduler.yield();     // Yield → browser handles input

  recalculateDashboard();     // 60ms
  await scheduler.yield();     // Yield

  updateAllCharts();           // 80ms
}

// Chạy mỗi 1 giây nhưng có yield gaps
setInterval(runDashboardUpdate, 1000);

// ✅ FIX 3: Dùng Web Worker cho sync không cần DOM
const syncWorker = new Worker('./sync-worker.js');
setInterval(() => {
  // Offload hoàn toàn khỏi main thread!
  syncWorker.postMessage({ action: 'sync' });
}, 1000);
// recalculateDashboard và updateAllCharts vẫn cần main thread
// Nhưng giảm từ 180ms → 80ms per interval
```

**`setTimeout` chains** cũng có thể gây vấn đề tương tự:

```javascript
// ❌ Recursive setTimeout với heavy work
function heavyPoll() {
  fetchAndProcessData(); // 100ms
  setTimeout(heavyPoll, 500); // "500ms after previous run"
  // Nếu fetch 100ms + process 200ms = 300ms total
  // → chạy lại sau 500ms → chỉ 200ms "free time" cho user
}

// ✅ FIX: Cộng thêm thời gian vào delay để maintain "free time"
async function smartPoll() {
  const start = performance.now();
  await fetchAndProcessData();
  const elapsed = performance.now() - start;

  // Luôn đợi đủ 2000ms total (bao gồm cả thời gian processing)
  const remainingDelay = Math.max(0, 2000 - elapsed);
  setTimeout(smartPoll, remainingDelay);
}
```

---

### Nguyên nhân 2: Interaction Overlap

Khi user tương tác nhanh (ví dụ type nhanh hoặc click liên tiếp), interactions có thể **overlap** — interaction sau phải đợi interaction trước hoàn thành.

```
Interaction Overlap Example:

t=0ms:   User types 'a' → interaction #1 starts
t=5ms:   User types 'b' → interaction #2 waiting!
t=180ms: Interaction #1 finishes (processing 'a')
t=180ms: Interaction #2 starts → input delay = 175ms!

Timeline:
┌────────────────────────────────────────────────────────────┐
│ [Interaction 1: 'a' keypress ─────────────── 180ms]       │
│     [Interaction 2: 'b' keypress]                         │
│     ├──── input delay: 175ms ───┤                         │
│                                  [processing: 20ms][paint] │
│                                                            │
│ User gõ 'b' nhưng phải đợi 175ms trước khi được xử lý!   │
└────────────────────────────────────────────────────────────┘
```

```typescript
// FIX: startTransition để mark non-urgent work — allow overlap
import { useTransition } from 'react';

function SearchInput() {
  const [value, setValue] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isPending, startTransition] = useTransition();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    // URGENT: Update input value ngay (không delay)
    setValue(newValue);

    // NON-URGENT: Search có thể bị interrupt nếu user tiếp tục gõ
    startTransition(() => {
      const searchResults = performSearch(newValue);
      setResults(searchResults);
    });
    // → Nếu user gõ 'b' trước khi search 'a' xong:
    //   React discards search 'a' → search 'b' ngay
    //   → Input delay của 'b' = 0ms (not blocked by 'a' search!)
  };

  return (
    <div>
      <input
        value={value}
        onChange={handleChange}
        // Input selalu responsive!
      />
      <div style={{ opacity: isPending ? 0.7 : 1 }}>
        <Results data={results} />
      </div>
    </div>
  );
}
```

```typescript
// FIX 2: Debounce để tránh processing quá nhiều interactions
import { useDeferredValue } from 'react';

// useDeferredValue cho phép React tự quản lý "debouncing":
function SearchWithDeferred() {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  // deferredQuery chỉ update khi main thread idle
  // → Tự nhiên tránh overlap mà không cần thủ công debounce

  return (
    <div>
      <input value={query} onChange={e => setQuery(e.target.value)} />
      <SearchResults query={deferredQuery} /> {/* Uses deferred value */}
    </div>
  );
}
```

---

### Nguyên nhân 3: Third-Party Scripts

Third-party scripts (analytics, chat widgets, A/B testing) chạy trên main thread và block input handling.

```
Third-party scripts trên main thread timeline:
┌────────────────────────────────────────────────────────────┐
│ t=0:    Page load complete                                 │
│ t=100:  Google Analytics executes (50ms)                  │
│ t=150:  Intercom chat widget init (120ms)                 │
│ t=270:  Hotjar session recording setup (80ms)             │
│ t=350:  User clicks CTA button                           │
│ t=350:  Browser: "Main thread free!" → handle click       │
│ Input delay = 0ms (just lucky timing)                     │
│                                                            │
│ BUT if user clicks at t=200:                              │
│ t=200:  User clicks CTA button                           │
│ t=270:  Hotjar finishes → click can be handled           │
│ Input delay = 70ms from Hotjar!                           │
└────────────────────────────────────────────────────────────┘
```

```html
<!-- ❌ BAD: Third-party scripts trong <head> — block render -->
<head>
  <script src="https://analytics.example.com/tracker.js"></script>
  <script src="https://chat.intercom.com/widget.js"></script>
</head>

<!-- ✅ FIX 1: Defer + Async -->
<head>
  <!-- async: download parallel, execute khi ready -->
  <script async src="https://analytics.example.com/tracker.js"></script>
  <!-- defer: download parallel, execute sau DOM parsed -->
  <script defer src="https://chat.intercom.com/widget.js"></script>
</head>

<!-- ✅ FIX 2: Load sau user interaction (facade pattern) -->
```

```typescript
// Facade pattern — Load third-party ONLY khi user cần
function ChatFacade() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const loadAndOpen = async () => {
    if (!isLoaded) {
      // Load chat widget script
      await new Promise<void>((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://chat.example.com/widget.js';
        script.onload = () => resolve();
        document.body.appendChild(script);
      });
      setIsLoaded(true);
    }
    setIsOpen(true);
    // @ts-ignore
    window.ChatWidget?.open();
  };

  return (
    <button onClick={loadAndOpen}>
      {isLoaded ? 'Open Chat' : 'Chat with us'}
    </button>
  );
}

// ✅ FIX 3: Dùng Partytown để chạy third-party scripts
// trong Web Worker (zero main thread impact!)
// https://partytown.builder.io/
// <Partytown forward={['gtag']} /> trong Next.js
```

---

### Nguyên nhân 4: Excessive Rendering (Presentation affecting Input Delay)

Khi một render operation chiếm quá lâu, nó có thể ảnh hưởng đến **input delay của interaction tiếp theo**:

```
Excessive rendering blocks next interaction:

t=0:    User clicks Tab A → tab change triggered
t=0:    React re-renders tab content (500ms — lots of components!)
t=300:  User clicks Tab B (wants to switch again)
t=500:  React finishes Tab A render
t=500:  Browser handles Tab B click
t=500:  Input delay = 200ms for Tab B!

→ Render của interaction 1 gây input delay cho interaction 2!
```

```typescript
// FIX: startTransition để cho phép interrupt
function TabNavigation() {
  const [activeTab, setActiveTab] = useState('home');
  const [isPending, startTransition] = useTransition();

  const handleTabClick = (tab: string) => {
    // Urgent: Update tab indicator ngay
    // Non-urgent: Render tab content (có thể bị interrupt)
    startTransition(() => {
      setActiveTab(tab);
    });
  };

  // Nếu user clicks Tab B trước khi Tab A render xong:
  // → React discards Tab A render
  // → Bắt đầu render Tab B ngay
  // → Tab B input delay = 0ms!
  return (
    <div>
      <TabBar
        active={activeTab}
        onTabClick={handleTabClick}
        loading={isPending} // Visual feedback
      />
      <Suspense fallback={<TabSkeleton />}>
        <TabContent tab={activeTab} />
      </Suspense>
    </div>
  );
}
```

---

### Measuring Input Delay Specifically

```javascript
// web-vitals attribution cho phép isolate input delay
import { onINP } from 'web-vitals/attribution';

onINP((metric) => {
  const { attribution } = metric;

  // Focus vào input delay specifically
  const inputDelayMs = attribution.inputDelay;

  if (inputDelayMs > 50) {
    // Input delay > 50ms = đáng investigate!
    console.warn('High input delay detected:', {
      inputDelay: inputDelayMs,
      interactionTarget: attribution.interactionTarget,
      loadState: attribution.loadState,
      // loadState tells you WHEN the interaction happened:
      // 'loading': page still loading → third-party scripts likely culprit
      // 'dom-interactive': DOM ready but scripts running
      // 'complete': page fully loaded → background timers likely culprit
    });

    // Send for analysis
    fetch('/api/perf', {
      method: 'POST',
      body: JSON.stringify({
        type: 'high-input-delay',
        inputDelay: inputDelayMs,
        loadState: attribution.loadState,
        url: window.location.href,
        timestamp: Date.now(),
      }),
      keepalive: true,
    });
  }
});

// loadState mapping → likely culprit:
const culpritByLoadState = {
  'loading': 'Third-party scripts executing during page load',
  'dom-interactive': 'Parser-blocking scripts or early timers',
  'dom-content-loaded': 'DOMContentLoaded handlers',
  'complete': 'Background timers (setInterval) or polling',
};
```

---

### Input Delay Optimization Summary

```
Root Cause → Fix Map:
┌────────────────────────────────────────────────────────────────┐
│ Cause                      │ Fix                              │
├────────────────────────────────────────────────────────────────┤
│ setInterval heavy work     │ requestIdleCallback / yield      │
│ setTimeout chains          │ Account for processing time      │
│ Interaction overlap        │ startTransition / useDeferredValue│
│ Third-party blocking       │ async/defer → facade → Partytown │
│ Previous render too slow   │ startTransition (interruptible)  │
│ Page load scripts          │ Code splitting, defer loading     │
│ Heavy DOMContentLoaded     │ Defer non-critical init work     │
└────────────────────────────────────────────────────────────────┘

Diagnosis Flow:
  Field: web-vitals/attribution → inputDelay high?
    → Check loadState:
      'loading'/'dom-interactive' → Third-party scripts
      'complete' → Background timers / polling

  Lab: DevTools Performance tab
    → Find long tasks BEFORE the interaction click event
    → Bottom-Up: Which function has highest Self Time?
    → That function = input delay culprit

Target: inputDelay < 50ms (ideally < 10ms)
  Total INP: < 200ms
  Processing: < 100ms
  Presentation: < 50ms
  Input Delay: < 50ms → leaves room for processing + presentation
```


---

## Deep Dive: Script Evaluation and Long Tasks — Startup Performance

> **Nguồn:** [web.dev/articles/script-evaluation-and-long-tasks](https://web.dev/articles/script-evaluation-and-long-tasks) — Google Web.dev
>
> Bài này giải quyết vấn đề đặc biệt của **long tasks trong giai đoạn startup** — trước khi user tương tác lần đầu. Khác với INP (runtime interactions), đây là về **script evaluation time**: browser phải parse, compile và execute JavaScript khi load trang. Monolithic bundles lớn → 1 long task khổng lồ → user không thể tương tác.

### Vòng đời của một JavaScript File

```
Browser nhận 1 JS file → 3 giai đoạn:

GIAI ĐOẠN 1: Parse
  Browser đọc raw source code
  Tạo Abstract Syntax Tree (AST)
  Cost: tỷ lệ thuận với file size

GIAI ĐOẠN 2: Compile
  AST → bytecode (V8: Ignition interpreter)
  Optimization: hot code paths → optimized machine code (TurboFan)
  Cost: CPU-intensive, chạy trên main thread

GIAI ĐOẠN 3: Evaluate (Execute top-level code)
  Chạy code ngoài functions (import statements, global vars, class defs)
  Đây là "Evaluate Script" task trong DevTools
  Cost: depends on how much top-level code

→ Tất cả 3 giai đoạn = 1 BLOCKING TASK trên main thread!
```

```
DevTools Performance tab — Startup Long Tasks:

Main thread timeline:
┌─────────────────────────────────────────────────────────────┐
│ Task: Evaluate Script (chunk.bundle.js — 2MB)    ████ 800ms│
│   ↳ Parse: 200ms                                            │
│   ↳ Compile: 300ms                                          │
│   ↳ Execute top-level: 300ms                                │
│                                                             │
│ Trong 800ms này: User KHÔNG THỂ tương tác!                 │
│ Nếu user click trong lúc này → input delay = 800ms!        │
│                                                             │
│ Red triangle ↑ = Long Task > 50ms (800ms = VERY bad)       │
└─────────────────────────────────────────────────────────────┘

Identify trong DevTools:
  Performance tab → Record page load
  Look for: "Evaluate Script" (yellow bars at startup)
  Bottom-Up tab → "Scripting" column → sort by time
  → Thấy: "main-app.bundle.js" chiếm 800ms → culprit!
```

---

### Nguyên nhân chính: Monolithic Bundles

```
Monolithic bundle = Gộp toàn bộ app code vào 1 file:

main.bundle.js (2MB):
├── React (140KB)
├── ReactDOM (130KB)
├── Lodash (70KB)           ← Có thể không dùng hết
├── Moment.js (290KB)       ← Nên dùng dayjs hoặc date-fns!
├── HomePage components
├── AboutPage components    ← User có thể không vào trang này!
├── DashboardPage components ← User có thể không vào trang này!
├── SettingsPage components  ← User có thể không vào trang này!
└── 50 more components...

→ Browser phải evaluate TOÀN BỘ khi load HomePage!
→ 1 Evaluate Script task: 800ms
→ Long task block tất cả input trong 800ms!
```

---

### Fix 1: Code Splitting — Tách bundle thành nhiều tasks

**Code splitting** biến 1 Evaluate Script task lớn → nhiều tasks nhỏ hơn, mỗi task < 50ms.

```javascript
// ❌ BEFORE: Static imports — tất cả evaluate cùng 1 lúc
import { HomePage } from './HomePage';
import { Dashboard } from './Dashboard';
import { Settings } from './Settings';
import { Reports } from './Reports';
// → 1 bundle to, 1 Evaluate Script task, 1 long task

// ✅ AFTER: Dynamic imports — mỗi route = 1 task riêng
// Lazy load từng route:
const HomePage = lazy(() => import('./HomePage'));
const Dashboard = lazy(() => import('./Dashboard'));
const Settings = lazy(() => import('./Settings'));
const Reports = lazy(() => import('./Reports'));

// Timeline AFTER code splitting:
// t=0:   Evaluate main-bundle.js (50ms) ← smaller, not a long task
// t=50:  User sees homepage, can interact
// t=100: User navigates to Dashboard
// t=100: Load + Evaluate dashboard.chunk.js (80ms)
// t=180: Dashboard interactive
//
// vs BEFORE:
// t=0:   Evaluate main.bundle.js (800ms)
// t=800: User finally can interact
```

```typescript
// React với React.lazy + Suspense — Route-based splitting
import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

const HomePage  = lazy(() => import('./pages/HomePage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Settings  = lazy(() => import('./pages/Settings'));

function App() {
  return (
    <Routes>
      <Route path="/" element={
        <Suspense fallback={<PageSkeleton />}>
          <HomePage />
        </Suspense>
      } />
      <Route path="/dashboard" element={
        <Suspense fallback={<PageSkeleton />}>
          <Dashboard />
        </Suspense>
      } />
      <Route path="/settings" element={
        <Suspense fallback={<PageSkeleton />}>
          <Settings />
        </Suspense>
      } />
    </Routes>
  );
}

// Webpack/Vite tự động tạo separate chunks:
// main.chunk.js       (chứa React, router, shared components)
// HomePage.chunk.js   (chỉ HomePage code)
// Dashboard.chunk.js  (chỉ Dashboard code)
// Settings.chunk.js   (chỉ Settings code)
```

---

### Fix 2: Dynamic Import cho Features, không chỉ Routes

Code splitting không chỉ giới hạn ở routing — áp dụng cho bất kỳ feature nào không cần ngay:

```typescript
// Feature-based lazy loading

// ❌ BAD: Load markdown parser cho tất cả users
import { marked } from 'marked'; // 80KB
function BlogPost({ content }: { content: string }) {
  return <div dangerouslySetInnerHTML={{ __html: marked(content) }} />;
}

// ✅ GOOD: Chỉ load khi cần (blog post page)
function BlogPost({ content }: { content: string }) {
  const [html, setHtml] = useState('');

  useEffect(() => {
    // Dynamic import: chỉ load + evaluate 'marked' khi component mount
    import('marked').then(({ marked }) => {
      setHtml(marked(content));
    });
  }, [content]);

  return html
    ? <div dangerouslySetInnerHTML={{ __html: html }} />
    : <div>{content}</div>; // Fallback while loading
}
```

```typescript
// Heavy features: Load on user interaction
function Editor() {
  const [CodeMirror, setCodeMirror] = useState<typeof import('codemirror') | null>(null);

  const handleFocus = async () => {
    if (!CodeMirror) {
      // CodeMirror = 500KB — chỉ load khi user thực sự dùng editor
      const cm = await import('codemirror');
      await import('codemirror/mode/javascript/javascript'); // syntax highlighting
      setCodeMirror(cm);
    }
  };

  if (!CodeMirror) {
    return (
      <textarea
        placeholder="Click to use full editor..."
        onFocus={handleFocus}
      />
    );
  }

  return <CodeMirror.default />;
}
```

```typescript
// Component-level splitting cho heavy UI libraries
import { lazy, Suspense, useState } from 'react';

// DataGrid nặng: chỉ load khi user vào trang có table
const DataGrid = lazy(() =>
  import('@mui/x-data-grid').then(m => ({ default: m.DataGrid }))
);

// RichTextEditor nặng: chỉ load khi user click "Edit"
const RichTextEditor = lazy(() => import('./RichTextEditor'));

function DocumentPage({ doc }: { doc: Document }) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div>
      {isEditing ? (
        <Suspense fallback={<div>Loading editor...</div>}>
          <RichTextEditor content={doc.content} />
        </Suspense>
      ) : (
        <>
          <div>{doc.content}</div>
          <button onClick={() => setIsEditing(true)}>Edit</button>
        </>
      )}
    </div>
  );
}
```

---

### Fix 3: `defer` và `type="module"` — Script Loading Strategy

```html
<!-- ❌ Blocking script: parse HTML → stop → download + execute JS → resume HTML -->
<script src="app.js"></script>

<!-- ✅ async: download parallel với HTML parsing, execute ngay khi ready -->
<!-- Dùng cho: analytics, tracking — không cần chờ DOM -->
<script async src="analytics.js"></script>

<!-- ✅ defer: download parallel, execute SAU KHI HTML parsed -->
<!-- Dùng cho: app scripts cần DOM nhưng không urgent -->
<script defer src="app.js"></script>

<!-- ✅ type="module": implicit defer + ESM modules -->
<!-- Module scripts được xử lý riêng lẻ → evaluation tasks nhỏ hơn -->
<script type="module" src="app.mjs"></script>
```

```
Script loading timeline comparison:

Regular <script>:
  HTML parse ──► STOP ──► Download JS ──► Execute ──► Resume HTML
                                           ↑ Long Task blocking!

<script defer>:
  HTML parse ──────────────────────────────► Execute ──► DOMContentLoaded
               Download JS (parallel) ──────►
               → Non-blocking! But still 1 big Execute task

<script type="module">:
  HTML parse ─────────────────────────────────────────► All ready
               Download main.mjs ──►
               Download dep1.mjs ──► Each module = separate eval task!
               Download dep2.mjs ──►
               → Smaller eval tasks per module!
```

---

### Fix 4: Xóa Dead Code (Tree Shaking)

```
Ít code hơn = Ít time parse/compile/evaluate hơn = Không có long task

Common culprits:
┌────────────────────────────────────────────────────────────┐
│ Moment.js:   290KB → dayjs: 2KB  (same API, 145x nhỏ hơn)│
│ Lodash:      70KB  → lodash-es (tree-shakeable)            │
│              hoặc dùng native JS methods                   │
│ jQuery:      87KB  → Vanilla JS (không cần năm 2024!)     │
│ date-fns:    dùng named imports để tree-shake              │
│ Unused icons:tùy chỉnh icon bundle                         │
└────────────────────────────────────────────────────────────┘
```

```typescript
// ❌ BAD: Import toàn bộ lodash
import _ from 'lodash'; // 70KB
const result = _.chunk(array, 3);

// ✅ GOOD: Import chỉ cái cần
import chunk from 'lodash/chunk'; // ~1KB

// ❌ BAD: Import toàn bộ date-fns
import { format, addDays, subDays, ... } from 'date-fns'; // 80KB

// ✅ GOOD: Named imports (tree-shakeable với bundler)
import { format } from 'date-fns/format'; // ~5KB

// ❌ BAD: Moment.js (non-tree-shakeable)
import moment from 'moment'; // 290KB!
const formatted = moment(date).format('DD/MM/YYYY');

// ✅ GOOD: dayjs (API tương tự, 2KB!)
import dayjs from 'dayjs';
const formatted = dayjs(date).format('DD/MM/YYYY');
```

---

### Đo lường: Trước và Sau

```
Workflow đo lường Script Evaluation:

Step 1: Baseline measurement
  Chrome DevTools → Performance tab
  Network throttling: "Fast 3G" (simulates real users)
  CPU throttling: 4x slowdown
  Record page load (reload)
  
Step 2: Identify script evaluation tasks
  Main thread → Look for yellow "Evaluate Script" bars
  Bottom-Up tab → Sort by "Total Time" → Scripting category
  Note: Which files? Total time?

Step 3: Check chunk sizes
  DevTools → Network tab → Filter: JS
  Sort by Size → Top offenders?
  Lighthouse → "Avoid large payloads" warning

Step 4: Apply code splitting + dynamic imports

Step 5: Measure again
  Compare "Evaluate Script" total time
  Compare largest single task (should be < 50ms each)
  Compare Time to Interactive (TTI)

Goals after optimization:
  No single "Evaluate Script" task > 50ms
  Total scripting time at startup < 200ms
  Time to Interactive < 3.8s (Good)
```

---

### Summary: Script Evaluation vs Runtime Long Tasks

```
Hai loại Long Tasks cần phân biệt:
┌────────────────────────────────────────────────────────────┐
│ Script Evaluation Long Tasks:                             │
│   KHI NÀO: Startup (page load)                           │
│   NGUYÊN NHÂN: Large JS bundles being parsed/compiled     │
│   NHÌN NHƯ: "Evaluate Script" task trong DevTools        │
│   FIX: Code splitting, dynamic imports, tree shaking      │
│   METRIC: TTI (Time to Interactive), TBT (Total Blocking) │
│                                                            │
│ Runtime Long Tasks:                                       │
│   KHI NÀO: Sau startup (user interactions)               │
│   NGUYÊN NHÂN: Heavy JS in event handlers, timers        │
│   NHÌN NHƯ: Yellow task blocks trong flame chart         │
│   FIX: scheduler.yield(), startTransition, Web Workers   │
│   METRIC: INP (Interaction to Next Paint)                 │
│                                                            │
│ → Cần fix CẢ HAI để có app thực sự nhanh!               │
└────────────────────────────────────────────────────────────┘

Quick wins priority:
  1. Remove unused dependencies (dayjs vs moment, lodash-es)
  2. Route-based code splitting (lazy() + Suspense)
  3. Heavy feature lazy loading (on interaction)
  4. Large inline scripts → external + defer
  5. Audit with Lighthouse "Reduce unused JavaScript"
```


---

## Deep Dive: Use Web Workers — Off-Main-Thread Architecture

> **Nguồn:** [web.dev/articles/off-main-thread](https://web.dev/articles/off-main-thread) — Google Web.dev
>
> Trong khi `scheduler.yield()` và `startTransition` giúp browser "thở" giữa các tasks, **Web Workers** là giải pháp triệt để hơn: **chạy hoàn toàn trên thread riêng**, không ảnh hưởng main thread dù computation mất bao lâu. Đây là "bảo bối" cho các heavy CPU tasks không cần DOM access.

### Main Thread — "Boring" là tốt nhất

```
Main Thread Architecture — Mục tiêu:
┌────────────────────────────────────────────────────────────┐
│ Main Thread (boring):                                     │
│   ✅ Handle user input (click, scroll, type)              │
│   ✅ Update DOM / React renders                           │
│   ✅ Animations (CSS, Web Animations API)                 │
│   ✅ Coordinate with Workers                              │
│   ❌ Heavy computation                                    │
│   ❌ Data processing                                      │
│   ❌ File parsing                                         │
│   ❌ Cryptography                                         │
│                                                            │
│ Web Worker Thread:                                        │
│   ✅ Heavy computation                                    │
│   ✅ Data processing (filter, sort, transform)            │
│   ✅ Image/audio processing                               │
│   ✅ Cryptography, hashing                               │
│   ✅ Parsing large datasets (JSON, CSV, XML)              │
│   ❌ DOM access (no document, window!)                    │
│   ❌ localStorage (use IndexedDB instead)                 │
└────────────────────────────────────────────────────────────┘

Rule of thumb: Task > 8-10ms → candidate for Web Worker
```

---

### Approach 1: Raw `postMessage` — Fundamental

```javascript
// main.ts — Tạo worker và communicate
const worker = new Worker(
  new URL('./data.worker.ts', import.meta.url),
  { type: 'module' } // ES modules in workers!
);

// Send data to worker
worker.postMessage({
  type: 'PROCESS_DATA',
  payload: largeDataset
});

// Receive result from worker
worker.onmessage = (event) => {
  const { type, result } = event.data;
  if (type === 'PROCESS_COMPLETE') {
    setProcessedData(result);
  }
};

// Cleanup
worker.terminate(); // Luôn terminate khi không cần!
```

```javascript
// data.worker.ts — Chạy trong separate thread
self.onmessage = (event) => {
  const { type, payload } = event.data;

  if (type === 'PROCESS_DATA') {
    // Heavy computation — không block main thread!
    const result = processData(payload); // 500ms OK!

    self.postMessage({
      type: 'PROCESS_COMPLETE',
      result
    });
  }
};

function processData(data) {
  // Any heavy computation here
  return data
    .filter(item => item.active)
    .map(item => ({
      ...item,
      score: computeExpensiveScore(item)
    }))
    .sort((a, b) => b.score - a.score);
}
```

**Vấn đề với raw `postMessage`:**

```
postMessage overhead — Structured Clone Algorithm:
  Main thread: postMessage(data)
    → JS engine clones data (deep copy)
    → Copy gửi qua thread boundary
    → Worker receives clone
    → Worker processes
    → Worker postMessage(result)
    → Main thread receives clone of result

  For 1MB object:
    Serialization: ~50ms ← thêm latency!
    Deserialization: ~50ms ← thêm nữa!
  
  Total overhead: 100ms chỉ để transfer data!
  → Có thể cancel out performance gains của Worker
```

---

### Approach 2: Transferable Objects — Zero-Copy Transfer

```javascript
// Thay vì copy, TRANSFER ownership của buffer
// → Zero-copy, near-instant transfer
// → Sender KHÔNG THỂ access data nữa sau khi transfer!

// ❌ SLOW: postMessage copies the ArrayBuffer
const buffer = new ArrayBuffer(1024 * 1024); // 1MB
worker.postMessage({ buffer }); // Copies 1MB!
console.log(buffer.byteLength); // 1048576 — copy exists in main thread

// ✅ FAST: Transfer ownership
const buffer = new ArrayBuffer(1024 * 1024); // 1MB
worker.postMessage(
  { buffer },
  [buffer]  // Second arg: list of transferable objects
  // → buffer is MOVED, not copied
);
console.log(buffer.byteLength); // 0 — buffer now belongs to worker!

// Transferable types:
//   ArrayBuffer, MessagePort, ImageBitmap, OffscreenCanvas
//   ReadableStream, WritableStream, TransformStream
//   AudioData, VideoFrame (WebCodecs)
```

```typescript
// Real-world: Image processing với transferable
// main.ts:
async function processImage(imageData: ImageData) {
  const buffer = imageData.data.buffer; // ArrayBuffer của pixel data

  worker.postMessage(
    { type: 'PROCESS_IMAGE', buffer, width: imageData.width, height: imageData.height },
    [buffer] // Transfer — zero copy!
  );
}

// worker.ts:
self.onmessage = (e) => {
  const { buffer, width, height } = e.data;
  const pixels = new Uint8ClampedArray(buffer);

  // Apply grayscale filter — heavy operation, OK ở đây!
  for (let i = 0; i < pixels.length; i += 4) {
    const gray = 0.299 * pixels[i] + 0.587 * pixels[i+1] + 0.114 * pixels[i+2];
    pixels[i] = pixels[i+1] = pixels[i+2] = gray;
  }

  // Transfer result back (zero copy!)
  self.postMessage(
    { type: 'IMAGE_PROCESSED', buffer, width, height },
    [buffer]
  );
};
```

---

### Approach 3: Comlink — RPC Interface (Recommended!)

**Comlink** (by Google Chrome team) biến Web Workers thành simple async functions — không cần viết `postMessage` boilerplate.

```bash
npm install comlink
```

```typescript
// worker.ts — expose API
import * as Comlink from 'comlink';

const api = {
  // Mọi function đều có thể là heavy computation
  async sortAndFilter(items: Item[], filter: string): Promise<Item[]> {
    return items
      .filter(item => item.category === filter || filter === 'all')
      .sort((a, b) => b.score - a.score);
  },

  async parseCSV(csvText: string): Promise<Record<string, string>[]> {
    // Heavy CSV parsing — fine ở đây!
    return csvText.split('\n').map(line => {
      const values = line.split(',');
      return { name: values[0], value: values[1] };
    });
  },

  async computeStats(data: number[]): Promise<{
    mean: number; median: number; stdDev: number;
  }> {
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const sorted = [...data].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const stdDev = Math.sqrt(
      data.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / data.length
    );
    return { mean, median, stdDev };
  },
};

// Expose API để main thread có thể gọi
Comlink.expose(api);

// Type export để main thread biết interface
export type WorkerAPI = typeof api;
```

```typescript
// useWorker.ts — React hook để dùng worker
import { useEffect, useRef, useState } from 'react';
import * as Comlink from 'comlink';
import type { WorkerAPI } from './worker';

export function useDataWorker() {
  const workerRef = useRef<Worker | null>(null);
  const apiRef = useRef<Comlink.Remote<WorkerAPI> | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Tạo worker
    const worker = new Worker(
      new URL('./worker.ts', import.meta.url),
      { type: 'module' }
    );

    // Wrap với Comlink — giờ api.sortAndFilter() trả về Promise!
    const api = Comlink.wrap<WorkerAPI>(worker);

    workerRef.current = worker;
    apiRef.current = api;
    setIsReady(true);

    return () => {
      // QUAN TRỌNG: Cleanup khi unmount!
      api[Comlink.releaseProxy](); // Release Comlink proxy
      worker.terminate();          // Terminate worker thread
    };
  }, []);

  return { api: apiRef.current, isReady };
}
```

```typescript
// Component sử dụng
import { useDataWorker } from './useWorker';

function DataTable({ rawData }: { rawData: Item[] }) {
  const { api, isReady } = useDataWorker();
  const [sortedData, setSortedData] = useState<Item[]>([]);
  const [filter, setFilter] = useState('all');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFilterChange = async (newFilter: string) => {
    if (!api || !isReady) return;

    setFilter(newFilter);
    setIsProcessing(true);

    try {
      // Gọi worker như gọi function bình thường!
      // Heavy computation chạy trên separate thread
      // Main thread HOÀN TOÀN FREE → UI responsive!
      const result = await api.sortAndFilter(rawData, newFilter);
      setSortedData(result);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div>
      <FilterBar
        active={filter}
        onChange={handleFilterChange}
        loading={isProcessing}
      />
      {/* UI vẫn interactive trong khi worker đang xử lý! */}
      <Table data={sortedData} />
    </div>
  );
}
```

---

### Approach 4: OffscreenCanvas — Render ngoài Main Thread

```typescript
// Dành cho canvas-heavy applications (charts, games, visualizations)

// main.tsx:
function ChartComponent({ data }: { data: number[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Transfer canvas control sang worker
    const offscreen = canvas.transferControlToOffscreen();
    // → Canvas giờ thuộc về worker, không phải main thread!

    const worker = new Worker(
      new URL('./chart.worker.ts', import.meta.url),
      { type: 'module' }
    );

    // Transfer offscreen canvas (transferable!)
    worker.postMessage({ type: 'INIT', canvas: offscreen }, [offscreen]);
    workerRef.current = worker;

    return () => worker.terminate();
  }, []);

  // Send data updates to worker
  useEffect(() => {
    workerRef.current?.postMessage({ type: 'UPDATE_DATA', data });
  }, [data]);

  return <canvas ref={canvasRef} width={800} height={400} />;
}

// chart.worker.ts:
let ctx: OffscreenCanvasRenderingContext2D | null = null;

self.onmessage = (e) => {
  if (e.data.type === 'INIT') {
    const canvas = e.data.canvas as OffscreenCanvas;
    ctx = canvas.getContext('2d');
    // Canvas rendering entirely in worker!
  }

  if (e.data.type === 'UPDATE_DATA' && ctx) {
    // Draw chart — complex rendering không block main thread!
    drawComplexChart(ctx, e.data.data);
  }
};

function drawComplexChart(ctx: OffscreenCanvasRenderingContext2D, data: number[]) {
  ctx.clearRect(0, 0, 800, 400);
  // ...complex drawing logic, animation calculations, etc.
  // All off main thread!
}
```

---

### Worker Pool Pattern — Multiple Workers

```typescript
// Cho heavy workloads: pool of workers để maximize CPU cores
class WorkerPool {
  private workers: Worker[] = [];
  private queue: Array<{ resolve: Function; reject: Function; task: any }> = [];
  private availableWorkers: Worker[] = [];

  constructor(
    private workerUrl: URL,
    private size = navigator.hardwareConcurrency // Số CPU cores
  ) {
    for (let i = 0; i < size; i++) {
      const worker = new Worker(workerUrl, { type: 'module' });
      this.workers.push(worker);
      this.availableWorkers.push(worker);
    }
  }

  async run(task: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const process = () => {
        const worker = this.availableWorkers.pop();
        if (!worker) {
          // Queue task nếu không có worker available
          this.queue.push({ resolve, reject, task });
          return;
        }

        worker.onmessage = (e) => {
          resolve(e.data);
          this.availableWorkers.push(worker); // Return to pool
          // Process next queued task
          if (this.queue.length > 0) {
            const next = this.queue.shift()!;
            worker.onmessage = null;
            this.run(next.task).then(next.resolve).catch(next.reject);
          }
        };
        worker.onerror = (e) => {
          reject(e);
          this.availableWorkers.push(worker);
        };

        worker.postMessage(task);
      };

      process();
    });
  }

  terminate() {
    this.workers.forEach(w => w.terminate());
  }
}

// Usage:
const pool = new WorkerPool(
  new URL('./process.worker.ts', import.meta.url),
  4 // 4 workers cho 4 CPU cores
);

// Process 100 chunks in parallel!
const chunks = splitIntoChunks(largeDataset, 100);
const results = await Promise.all(chunks.map(chunk => pool.run(chunk)));
const combined = results.flat();
```

---

### When NOT to use Web Workers

```
Overhead của Web Workers:
  1. Startup time: ~10-40ms để khởi tạo worker
  2. postMessage serialization: ~1ms per KB data
  3. Thread context switching: small overhead

→ Web Workers có thể CHẬM HƠN nếu:
  ❌ Task < 10ms (overhead > benefit)
  ❌ Data transfer quá lớn và không dùng Transferables
  ❌ Cần DOM access (phải dùng yielding thay thế)
  ❌ Nhiều tiny messages (batching overhead)

Use Web Workers KHI:
  ✅ Task > 50ms
  ✅ CPU-intensive, không cần DOM
  ✅ Data có thể transferred (ArrayBuffer, ImageBitmap)
  ✅ Task là recurring và startup cost được amortized
```

---

### Summary: Off-Main-Thread Patterns

```
Choosing the right approach:
┌────────────────────────────────────────────────────────────────┐
│ Approach          │ When to use                              │
├────────────────────────────────────────────────────────────────┤
│ Raw postMessage   │ Simple, one-shot tasks                   │
│                   │ Learning/prototyping                     │
│ Transferables     │ Large binary data (images, audio, video) │
│                   │ ArrayBuffer, ImageBitmap                 │
│ Comlink           │ Complex APIs, multiple methods           │
│                   │ TypeScript + React projects (recommended)│
│ OffscreenCanvas   │ Canvas-heavy: charts, games, visualizer  │
│ Worker Pool       │ High-volume parallel processing          │
│                   │ CPU-bound batch operations               │
└────────────────────────────────────────────────────────────────┘

Performance comparison (1MB data processing):
  Sync on main thread:          500ms (blocks UI)
  postMessage (copy):           500ms + 100ms overhead = 600ms
  Transferable (move):          500ms + 1ms overhead = 501ms
  Worker Pool (4 cores):        ~130ms + overhead (4x parallel!)
  Comlink + Transferable:       ~502ms (great DX, minimal overhead)

Setup in Vite/Next.js:
  Vite: new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })
  Next.js: Same pattern, no extra config needed (built-in support)
  Comlink: npm install comlink → import * as Comlink from 'comlink'
```


---

## Deep Dive: Avoid Large Complex Layouts and Layout Thrashing

> **Nguồn:** [web.dev/articles/avoid-large-complex-layouts-and-layout-thrashing](https://web.dev/articles/avoid-large-complex-layouts-and-layout-thrashing) — Google Web.dev
>
> **Layout thrashing** là kẻ thù thầm lặng — presentation delay cao không phải vì animation phức tạp mà vì code đọc và ghi DOM xen kẽ nhau, khiến browser phải recalculate layout nhiều lần trong 1 frame. Bài này giải thích cơ chế và các kỹ thuật tránh.

### Browser Rendering Pipeline — Cần hiểu trước

```
Browser rendering pipeline (1 frame):
┌────────────────────────────────────────────────────────────┐
│ JavaScript → Style → Layout → Paint → Composite           │
│                                                            │
│ Style:    Tính toán computed styles cho mỗi element       │
│ Layout:   Tính position, size của mỗi element (reflow)    │
│ Paint:    Fill pixels (màu sắc, text, shadows)            │
│ Composite:Ghép layers lên màn hình                        │
│                                                            │
│ Layout là bước ĐẮT NHẤT (cascade effects):                │
│   1 element thay đổi size → browser re-layout TẤT CẢ    │
│   elements bị affect (ancestors + siblings)               │
│                                                            │
│ Budget: 16ms per frame (60fps) cho toàn bộ pipeline      │
│ Layout thường chiếm 5-10ms                                │
└────────────────────────────────────────────────────────────┘
```

---

### Vấn đề 1: Layout Thrashing — Forced Synchronous Layout

**Layout thrashing** xảy ra khi JavaScript đọc layout properties ngay SAU KHI ghi DOM — forcing browser phải recalculate layout ngay lập tức (synchronously), không chờ đến cuối frame.

```javascript
// ❌ BAD: Read/Write interleaved = LAYOUT THRASHING!

// Scenario: Sync widths của 10 elements
const boxes = document.querySelectorAll('.box');
boxes.forEach(box => {
  // WRITE: Ghi style → layout invalidated (dirty)
  box.style.width = box.offsetWidth * 2 + 'px';
  //                 ↑ READ: browser buộc phải recalculate layout!
  //                   vì layout đang dirty và cần accurate value
});
// 10 iterations = 10 forced layout recalculations!
// Mỗi cái: ~5ms × 10 = 50ms chỉ để layout!
// → Long task → presentation delay cao → INP tệ

// ❌ BAD 2: getComputedStyle trong loop
const elements = document.querySelectorAll('.item');
for (const el of elements) {
  const height = getComputedStyle(el).height; // READ: force layout
  el.style.marginTop = parseInt(height) / 2 + 'px'; // WRITE: dirty
  // Next iteration READ: force layout AGAIN!
}
```

```
Why forced synchronous layout is expensive:
┌────────────────────────────────────────────────────────────┐
│ Normal flow (1 layout per frame):                         │
│   JS writes → ... more JS ... → Frame end → Layout once  │
│                                                            │
│ Forced Synchronous Layout (multiple per frame):           │
│   JS write (dirty) → JS read → LAYOUT NOW! →             │
│   JS write (dirty) → JS read → LAYOUT AGAIN! →           │
│   JS write (dirty) → JS read → LAYOUT AGAIN! → ...       │
│                                                            │
│ 10 loops = 10 layouts instead of 1!                       │
│ Complex DOM: each layout = 10-50ms                        │
│ Total: up to 500ms for 1 operation!                       │
└────────────────────────────────────────────────────────────┘
```

---

### Fix 1: Batch Reads, Then Batch Writes

```javascript
// ✅ GOOD: PHASE 1 = all reads, PHASE 2 = all writes

// PHASE 1: Batch ALL reads (1 layout calculation)
const boxes = document.querySelectorAll('.box');
const widths = Array.from(boxes).map(box => box.offsetWidth); // READ × N
// → Browser calculates layout ONCE for all reads

// PHASE 2: Batch ALL writes (layout invalidated once, painted once)
boxes.forEach((box, i) => {
  box.style.width = widths[i] * 2 + 'px'; // WRITE × N (no reads!)
});
// → Browser paints ONCE at end of frame

// Total: 1 layout + 1 paint (not N layouts + N paints)
```

```typescript
// React Pattern: Tránh layout thrashing trong hooks
function useElementSizes(refs: React.RefObject<HTMLElement>[]) {
  const [sizes, setSizes] = useState<{ width: number; height: number }[]>([]);

  useEffect(() => {
    // ✅ Batch all reads together (1 layout)
    const newSizes = refs.map(ref => ({
      width: ref.current?.offsetWidth ?? 0,
      height: ref.current?.offsetHeight ?? 0,
    }));

    // ✅ Single state update → React batches DOM writes
    setSizes(newSizes);
    // React 18: tất cả setState trong 1 event/effect được automatic batched
  }, [refs]);

  return sizes;
}

// ❌ BAD React pattern: setState trong loop (multiple renders)
function BadComponent({ items }: { items: Item[] }) {
  useEffect(() => {
    items.forEach(item => {
      const el = document.getElementById(item.id);
      if (el) {
        const width = el.offsetWidth; // READ (force layout)
        setSomeState(prev => ({
          ...prev,
          [item.id]: width * 2
        })); // WRITE → triggers re-render → new layout!
      }
    });
  }, [items]);
}

// ✅ GOOD React pattern: batch reads → single update
function GoodComponent({ items }: { items: Item[] }) {
  useEffect(() => {
    // PHASE 1: All reads
    const measurements = items.reduce((acc, item) => {
      const el = document.getElementById(item.id);
      if (el) acc[item.id] = el.offsetWidth;
      return acc;
    }, {} as Record<string, number>);

    // PHASE 2: Single write (1 re-render, 1 layout)
    setSomeState(prev => {
      const next = { ...prev };
      Object.entries(measurements).forEach(([id, width]) => {
        next[id] = width * 2;
      });
      return next;
    });
  }, [items]);
}
```

---

### Properties nào gây Forced Layout?

```
READ properties gây forced synchronous layout:
┌────────────────────────────────────────────────────────────────┐
│ Box model:                                                     │
│   offsetWidth, offsetHeight, offsetTop, offsetLeft            │
│   clientWidth, clientHeight, clientTop, clientLeft            │
│   scrollWidth, scrollHeight, scrollTop, scrollLeft            │
│                                                                │
│ Position/Size:                                                 │
│   getBoundingClientRect()                                      │
│   getClientRects()                                             │
│                                                                │
│ Computed styles:                                               │
│   getComputedStyle()    ← đặc biệt dangerous!                │
│                                                                │
│ Window:                                                        │
│   window.innerWidth, window.innerHeight                        │
│   window.scrollX, window.scrollY                              │
│                                                                │
│ Others:                                                        │
│   element.focus()  ← YES, focus() forces layout!             │
│   scrollIntoView() ← forces layout                            │
└────────────────────────────────────────────────────────────────┘

WRITE operations (invalidate layout):
  element.style.* = value
  element.className = value
  element.setAttribute('style', ...)
  element.innerHTML = html
  appendChild(), removeChild(), insertBefore()
  classList.add/remove/toggle
```

---

### Fix 2: `requestAnimationFrame` để sync với browser

```javascript
// requestAnimationFrame ensures your reads happen AFTER browser layout
// → No forced synchronous layout!

// ❌ BAD: Read trong event handler sau write (may force layout)
button.addEventListener('click', () => {
  panel.style.display = 'block';  // WRITE
  const height = panel.offsetHeight; // READ → forced layout!
  animateToHeight(height);
});

// ✅ GOOD: Defer read đến next frame
button.addEventListener('click', () => {
  panel.style.display = 'block';  // WRITE

  requestAnimationFrame(() => {
    // Browser đã layout → read safe, không forced!
    const height = panel.offsetHeight; // READ (no force!)
    animateToHeight(height);
  });
});
```

```typescript
// Pattern: rAF + batch reads/writes cho animations
function animateItems(items: HTMLElement[]) {
  function frame() {
    // PHASE 1: Read (all in 1 rAF = 1 layout)
    const rects = items.map(item => item.getBoundingClientRect());

    // PHASE 2: Write (all in same rAF = queued, painted once)
    items.forEach((item, i) => {
      const rect = rects[i];
      item.style.transform = `translateX(${-rect.left}px)`;
    });

    // Không cần requestAnimationFrame lại ở đây
    // vì chúng ta đã trong 1 rAF frame
  }

  requestAnimationFrame(frame);
}
```

---

### Fix 3: FastDOM — Library để tự động batch

```javascript
// FastDOM tự động batch reads và writes, phòng chống thrashing
// npm install fastdom

import fastdom from 'fastdom';

// ❌ BAD: Manual và dễ quên
element.style.width = '100px'; // write
const h = element.offsetHeight; // read → forced!

// ✅ GOOD: FastDOM batch tự động
fastdom.measure(() => {
  // Tất cả reads trong đây được batch TRƯỚC writes
  const width = element.offsetWidth;
  const height = element.offsetHeight;

  fastdom.mutate(() => {
    // Tất cả writes được batch SAU reads
    element.style.width = width * 2 + 'px';
    element.style.height = height * 1.5 + 'px';
  });
});

// FastDOM queue:
//   [measure: read widths] → execute all reads → [mutate: set styles] → execute all writes
// = 1 layout + 1 paint per batch
```

---

### Fix 4: CSS thay thế JavaScript cho Layout

```css
/* ❌ JavaScript-driven layout — prone to thrashing */
/* JS: const width = el.offsetWidth; el.style.width = width/2 + 'px'; */

/* ✅ CSS-driven layout — no JavaScript, no layout thrashing */

/* Equal-width columns */
.container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  /* Browser handles layout math — no JS needed! */
}

/* Toggle class instead of multiple style writes */
/* ❌ BAD: 3 style writes = potentially 3 layout recalcs */
element.style.width = '200px';
element.style.height = '100px';
element.style.margin = '10px';

/* ✅ GOOD: 1 class toggle = 1 layout at most */
element.classList.add('expanded');
/* .expanded { width: 200px; height: 100px; margin: 10px; } */
```

```typescript
// React: dùng className toggle, không inline style manipulation
// ❌ BAD: Multiple style updates → multiple potential layouts
function BadAccordion({ isOpen }: { isOpen: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      if (isOpen) {
        ref.current.style.height = ref.current.scrollHeight + 'px'; // READ + WRITE
        ref.current.style.opacity = '1';   // WRITE
        ref.current.style.overflow = 'visible'; // WRITE
      }
    }
  }, [isOpen]);

  return <div ref={ref} />;
}

// ✅ GOOD: CSS transitions + className toggle
function GoodAccordion({ isOpen }: { isOpen: boolean }) {
  return (
    <div className={`accordion ${isOpen ? 'accordion--open' : ''}`}>
      {/* CSS handles all the animation logic */}
    </div>
  );
}

/*
.accordion {
  max-height: 0;
  overflow: hidden;
  opacity: 0;
  transition: max-height 0.3s ease, opacity 0.3s ease;
}
.accordion--open {
  max-height: 500px;  (or use CSS custom property)
  opacity: 1;
}
*/
```

---

### Fix 5: Giảm Layout Scope với CSS `contain`

```css
/* CSS contain: tạo boundary cho layout calculations */
/* Browser chỉ recalculate layout TRONG element, không propagate ra ngoài */

.widget {
  contain: layout;
  /* Changes inside .widget không trigger parent/sibling layout */
}

.isolated-component {
  contain: strict;
  /* contain: size layout paint style */
  /* Tất cả contain properties — most isolation */
}

/* Usecase: Dashboard với nhiều independent widgets */
.dashboard-widget {
  contain: layout style;
  /* Widget A thay đổi → KHÔNG trigger Widget B layout! */
}
```

---

### DevTools: Nhận biết Layout Thrashing

```
Chrome DevTools Performance tab — Tìm Layout Thrashing:

1. Record interaction
2. Nhìn flame chart → tìm purple "Layout" bars
3. Nếu thấy NHIỀU layout bars nhỏ xen kẽ với JS:
   → Đây là layout thrashing!
4. Click vào 1 Layout bar → "Forced Reflow"
   → Details: "Layout was forced before the page finished loading"
   → Call stack: chỉ ra code gây forced layout

Warning trong console:
  "[Violation] Forced reflow while executing JavaScript took 230ms"
  → Chrome sẽ cảnh báo khi forced layout > 10ms!

Timeline signature của thrashing:
  JS▐Layout▐JS▐Layout▐JS▐Layout  ← BAD (many small purple blocks)
  JS──────────────────────▐Layout  ← GOOD (1 large purple block at end)
```

---

### Real-world Example: Equalizing Card Heights

```typescript
// Common scenario: Making card grid have equal heights
// ❌ Naive approach — layout thrashing!
function equalizeHeights(cards: NodeListOf<HTMLElement>) {
  let maxHeight = 0;

  // This loop causes thrashing!
  cards.forEach(card => {
    const height = card.offsetHeight; // READ → forced layout!
    if (height > maxHeight) maxHeight = height;
    card.style.height = maxHeight + 'px'; // WRITE → invalidate!
    // Next READ: browser must recalculate!
  });
}

// ✅ Fixed: batch reads → batch writes
function equalizeHeights(cards: NodeListOf<HTMLElement>) {
  // PHASE 1: All reads (1 layout)
  const heights = Array.from(cards).map(c => c.offsetHeight);
  const maxHeight = Math.max(...heights);

  // PHASE 2: All writes (1 layout invalidation, 1 paint)
  cards.forEach(card => {
    card.style.height = maxHeight + 'px';
  });
}

// ✅ Even better: CSS Grid
// No JS needed!
// .card-grid { display: grid; align-items: stretch; }
// Cards automatically same height within each row!
```

---

### Summary: Layout Thrashing Cheat Sheet

```
TRIGGER (gây forced layout):
  Read AFTER write trong same synchronous code block

DETECT:
  DevTools Performance → nhiều purple "Layout" bars
  Console warning: "Forced reflow"
  Bottom-Up tab: "Layout" self-time cao

FIX HIERARCHY (ưu tiên từ trên xuống):
  1. ✅ CSS first — dùng CSS classes, Grid, Flexbox
  2. ✅ Batch: All reads → all writes (không xen kẽ)
  3. ✅ requestAnimationFrame để defer reads
  4. ✅ FastDOM cho complex scenarios
  5. ✅ CSS contain: layout để isolate scope
  6. ✅ ResizeObserver thay scroll listener cho size detection

PROPERTIES cần cẩn thận khi đọc (force layout):
  offsetWidth/Height, clientWidth/Height
  getBoundingClientRect(), getClientRects()
  getComputedStyle()
  scrollTop/Left/Width/Height
  window.innerWidth/Height

Target: 0 forced synchronous layouts per interaction
DevTools goal: 1 Layout block per frame (at end of JS)
```


---

## Deep Dive: Reduce the Scope and Complexity of Style Calculations

> **Nguồn:** [web.dev/articles/reduce-the-scope-and-complexity-of-style-calculations](https://web.dev/articles/reduce-the-scope-and-complexity-of-style-calculations) — Google Web.dev
>
> Sau layout thrashing, **style recalculation** là bước tốn kém thứ hai trong rendering pipeline. Mỗi khi DOM thay đổi, browser phải tính lại styles — và với CSS selectors phức tạp hoặc DOM lớn, bước này có thể mất hàng chục milliseconds. Bài này dạy cách viết CSS "performant" để giảm scope và complexity của style recalculation.

### Style Recalculation — Cơ chế

```
Khi nào Style Recalculation xảy ra:
  - classList.add/remove/toggle
  - element.setAttribute('class', ...)
  - DOM node được thêm hoặc xóa
  - User hover/focus (pseudo-class changes)
  - JavaScript thay đổi inline styles
  - CSS animations/transitions

Browser phải làm 2 việc:
  1. SELECTOR MATCHING: Với mỗi element bị affect,
     browser đọc TOÀN BỘ CSS rules và hỏi:
     "Rule này có áp dụng cho element này không?"
     → ~50% thời gian recalculation

  2. COMPUTED STYLES: Sau khi biết rules nào match,
     tính toán computed value (cascade, inheritance, specificity)
     → ~50% thời gian còn lại

Tổng thời gian = (số elements affected) × (complexity per element)
```

```
Tại sao DevTools hiện "Recalculate Style" cao?
  Performance tab → flame chart → tìm purple "Recalculate Style"
  Click vào → Details:
    "Elements Affected: 2134"  ← Quá nhiều!
    "Duration: 45ms"           ← Quá lâu!
  → 45ms chỉ riêng cho style = half budget của 1 frame (16ms)!
```

---

### Vấn đề 1: Complex CSS Selectors → Chậm matching

```css
/* Browser matching selectors RIGHT-TO-LEFT (từ phải sang trái):
   "div > p > span.text" → tìm ".text" → check parent "p" → check grandparent "div"
   Nếu có 10,000 spans, browser phải traverse 3 levels cho TỪNG CÁI!
*/

/* ❌ SLOW: Complex selectors — expensive tree traversal */
.nav > ul > li > a:hover { color: blue; }
.article-content p:nth-last-child(2) strong { font-weight: bold; }
div.container > div.row > div.col-md-6:first-child { padding: 0; }
[data-theme="dark"] .sidebar .nav-item.active > .nav-link { color: white; }

/* Tại sao chậm:
   Selector dài → nhiều "tests" phải pass → O(n) traversal
   :nth-last-child → phải đếm TẤT CẢ siblings → O(n) per element
   Structural selectors → expensive tree queries */

/* ✅ FAST: Single class selectors — O(1) matching */
.nav-link-hover { color: blue; }
.article-last-strong { font-weight: bold; }
.first-col-no-pad { padding: 0; }
.dark-active-nav { color: white; }
```

```
Selector matching performance comparison:
┌────────────────────────────────────────────────────────────┐
│ Selector Type          │ Complexity │ Example             │
├────────────────────────────────────────────────────────────┤
│ .single-class          │ O(1) ✅   │ .btn-primary         │
│ #id                    │ O(1) ✅   │ #header              │
│ .parent .child         │ O(n)      │ .card .title         │
│ :nth-child(n)          │ O(n)      │ li:nth-child(3)      │
│ :nth-last-child(n)     │ O(n) ❌   │ p:nth-last-child(2)  │
│ .box:not(.special) .x  │ O(n²) ❌  │ complex nesting      │
└────────────────────────────────────────────────────────────┘
```

---

### Fix 1: BEM — Block Element Modifier

BEM (Block__Element--Modifier) không chỉ là naming convention — nó giúp giảm selector complexity xuống còn O(1).

```css
/* BEM pattern: Mỗi element có 1 unique class → 1-class selector */

/* Block */
.card {}

/* Element */
.card__title {}
.card__body {}
.card__footer {}

/* Modifier */
.card--featured {}
.card__title--large {}

/* ❌ OLD: Nested selectors (slow matching) */
.card .title { font-size: 1.5rem; }
.card.featured .title { color: gold; }
.sidebar .card .title { font-size: 1rem; }

/* ✅ BEM: Single class selectors (instant matching) */
.card__title { font-size: 1.5rem; }
.card--featured .card__title { color: gold; }  /* Still O(1) */
/* Better: */
.card__title--featured { color: gold; }         /* O(1) ✅ */
.card__title--sidebar { font-size: 1rem; }      /* O(1) ✅ */
```

```typescript
// BEM trong React/TypeScript
import styles from './Card.module.css';

interface CardProps {
  title: string;
  featured?: boolean;
  size?: 'small' | 'large';
}

// CSS Modules + BEM naming
function Card({ title, featured, size }: CardProps) {
  return (
    <div className={[
      styles.card,
      featured && styles['card--featured'],
    ].filter(Boolean).join(' ')}>
      <h2 className={[
        styles.card__title,
        size === 'large' && styles['card__title--large'],
      ].filter(Boolean).join(' ')}>
        {title}
      </h2>
    </div>
  );
}

// card.module.css:
// .card { ... }          → 1 selector
// .card__title { ... }   → 1 selector
// .card--featured { ... } → 1 selector
// → Browser matching = O(1) per element!
```

---

### Vấn đề 2: Style Invalidation Scope quá Rộng

Khi 1 element thay đổi class, browser cần recalculate styles cho TẤT CẢ elements có thể bị affect:

```
Style Invalidation Cascades:
┌────────────────────────────────────────────────────────────┐
│ HTML:                                                      │
│ <body>                                                     │
│   <div class="theme-dark">       ← className changed!     │
│     <header>                                               │
│       <nav>                                               │
│         <ul><li><a>Link</a></li></ul>  ← 10 links         │
│       </nav>                                               │
│     </header>                                              │
│     <main>                                                 │
│       <article>                                           │
│         <p>Text...</p>  × 100 paragraphs                  │
│       </article>                                           │
│     </main>                                                │
│   </div>                                                   │
│                                                            │
│ CSS: .theme-dark * { color: white; }                      │
│ → Browser: "Tất cả descendants của .theme-dark"           │
│ → Elements to recalculate: 10 links + 100 p + headers...  │
│ → Có thể 500+ elements!                                   │
│ → "Elements Affected: 500, Duration: 30ms"                │
└────────────────────────────────────────────────────────────┘
```

```css
/* ❌ WIDE SCOPE: Selectors matching nhiều elements */
.theme-dark * { color: white; }           /* * = ALL descendants */
.active .item { background: blue; }       /* Tất cả .item trong .active */
[data-state="loading"] p { opacity: 0.5; } /* Tất cả p trong loading state */

/* ✅ NARROW SCOPE: Target cụ thể, ít cascade */

/* Option 1: Toggle class chỉ trên elements cần thay đổi */
.theme-dark-text { color: white; }  /* Chỉ apply cho elements có class này */

/* Option 2: CSS Custom Properties — 1 change, no selector matching! */
:root { --text-color: black; }
.theme-dark { --text-color: white; }  /* 1 element change */
p, h1, span, a { color: var(--text-color); }
/* → browser recalculates CSS var usage, nhưng selector matching = minimal */

/* Option 3: CSS @layer và @scope (modern) */
@scope (.card) to (.card__footer) {
  /* Styles chỉ áp dụng trong .card, không leak ra ngoài */
  p { margin: 0; }
}
```

---

### Fix 2: CSS Custom Properties — Efficient Theme Switching

```typescript
// Theme switching KHÔNG gây expensive style recalculation
// CSS variables change = 1 element update, browser handle inherited values

// ❌ BAD: Toggle class trên body → recalculate TẤT CẢ elements
function toggleTheme(isDark: boolean) {
  document.body.className = isDark ? 'dark-theme' : 'light-theme';
  // CSS: .dark-theme * { color: ...; background: ...; }
  // → 1000+ elements recalculated!
}

// ✅ GOOD: CSS Custom Properties → minimal recalculation
function toggleTheme(isDark: boolean) {
  const root = document.documentElement;
  if (isDark) {
    root.style.setProperty('--color-text', '#ffffff');
    root.style.setProperty('--color-bg', '#1a1a1a');
    root.style.setProperty('--color-primary', '#60a5fa');
  } else {
    root.style.setProperty('--color-text', '#000000');
    root.style.setProperty('--color-bg', '#ffffff');
    root.style.setProperty('--color-primary', '#2563eb');
  }
  // CSS variables change → browser re-applies where used
  // Dramatically less work than class-based theming!
}

// CSS:
// :root {
//   --color-text: #000000;
//   --color-bg: #ffffff;
// }
// body { color: var(--color-text); background: var(--color-bg); }
// .button { background: var(--color-primary); }
```

---

### Fix 3: CSS `contain` — Limit Recalculation Scope

```css
/* contain: style → browser KHÔNG propagate style changes ra ngoài element */

.isolated-widget {
  contain: style layout paint;
  /* → Changes inside widget = không trigger parent style recalculation */
  /* → Browser biết: "widget này là standalone unit" */
}

/* content-visibility: auto — skip TOÀN BỘ style + layout + paint */
.feed-item {
  content-visibility: auto;
  contain-intrinsic-size: auto 120px; /* estimated height */
  /* Browser: "Nếu off-screen → không tính style/layout/paint" */
  /* → Massive savings cho long feeds! */
}
```

```
content-visibility impact (Google case study):
  News site với 100 articles:
    WITHOUT: Style recalculation = 45ms (tính tất cả 100)
    WITH content-visibility: auto: = 4ms (chỉ tính ~5 visible items)
    → 11x improvement!
```

---

### Fix 4: Tránh CSS Inheritance Chains dài

```css
/* Inherited properties lan truyền xuống tất cả descendants:
   color, font-size, font-family, line-height, visibility...
   → Thay đổi ở parent = recalculate TẤT CẢ descendants */

/* ❌ BAD: Thay đổi inherited property ở high-level parent */
.container:hover {
  font-size: 18px; /* Inherited! Tất cả text trong container recalculate */
}

/* ✅ GOOD: Thay đổi chỉ tại element cần */
.container__title:hover {
  font-size: 18px; /* Chỉ element này và descendants của nó */
}

/* ✅ BETTER: Dùng non-inherited properties khi có thể */
.container:hover .container__text {
  font-size: 18px; /* Target specific → ít elements affected */
}

/* Inherited properties (expensive to change at high level):
   color, font-size, font-family, font-weight, line-height
   visibility, cursor, direction, quotes, text-align...

   Non-inherited (safer to change):
   width, height, margin, padding, border, background
   display, position, opacity, transform... */
```

---

### DevTools: Tìm Style Recalculation Issues

```
Chrome DevTools Performance tab:
  Record interaction → Look for "Recalculate Style" (purple)
  Click on it → Summary panel:
    "Elements Affected: 2134"  ← Cao = scope quá rộng
    "Duration: 45ms"           ← Cao = selectors quá complex

  DevTools → More Tools → CSS Overview:
    → Xem unused CSS rules
    → Complex selectors list

  Performance tab → ⚙️ Settings → Enable "Selector Stats"
  → Thêm column trong Bottom-Up: selector match statistics
  → Xem selector nào match nhiều nhất và tốn thời gian nhất

Lighthouse:
  "Avoid an excessive DOM size" warning
  "Remove unused CSS" warning
```

---

### React-specific: Class Toggle Best Practices

```typescript
// React className management — minimize style recalculation scope

// ❌ BAD: Toggle class on wrapper → cascades to all children
function List({ isLoading }: { isLoading: boolean }) {
  return (
    // Thay đổi class này = style recalc cho ALL descendants!
    <div className={isLoading ? 'list-container loading' : 'list-container'}>
      {items.map(item => <Item key={item.id} data={item} />)}
    </div>
  );
}
// CSS: .loading * { opacity: 0.5; } ← BAD wildcard!
// CSS: .loading .item { opacity: 0.5; } ← Better but still cascades

// ✅ GOOD: Apply loading state only to overlay, not to content
function List({ isLoading }: { isLoading: boolean }) {
  return (
    <div className="list-container">
      {isLoading && (
        <div className="list-overlay" aria-hidden="true" />
        // CSS: .list-overlay { position: absolute; inset: 0; background: rgba(255,255,255,0.5); }
        // → Chỉ 1 element, không cascade!
      )}
      <ul>
        {items.map(item => <Item key={item.id} data={item} />)}
      </ul>
    </div>
  );
}

// ✅ GOOD: CSS Custom Properties cho loading state
function List({ isLoading }: { isLoading: boolean }) {
  return (
    <div
      className="list-container"
      style={{ '--opacity': isLoading ? '0.5' : '1' } as React.CSSProperties}
    >
      {items.map(item => <Item key={item.id} data={item} />)}
    </div>
  );
}
// CSS: .list-container { opacity: var(--opacity, 1); }
// → 1 CSS variable change → efficient!
```

---

### Summary: Style Calculation Optimization

```
Two axes to optimize:
  1. SCOPE: Số elements bị affect khi style thay đổi
  2. COMPLEXITY: Thời gian match CSS selectors

REDUCE SCOPE:
  ✅ Target specific elements, not wide ancestors
  ✅ CSS Custom Properties thay class-based theming
  ✅ content-visibility: auto cho off-screen elements
  ✅ CSS contain: style|layout|paint cho isolated widgets
  ✅ Apply changes low in DOM tree (không ở body/html)

REDUCE COMPLEXITY:
  ✅ BEM / single-class selectors (O(1) matching)
  ✅ Tránh :nth-last-child, :not() chains, deep nesting
  ✅ Tránh wildcard (*) trong selectors
  ✅ CSS Modules / scoped styles (auto scope)

MEASURE:
  DevTools Performance → "Recalculate Style" → Elements Affected
  Target: Elements Affected < 100 per interaction
  Target: Recalculate Style < 3ms per interaction

Modern CSS tooling:
  CSS Modules → automatically scoped selectors
  CSS-in-JS (Emotion/styled-components) → generates unique classes
  Tailwind CSS → utility classes (mostly single-class, O(1))
  → Tất cả đều giúp tránh complex nested selectors naturally!
```


---

## Deep Dive: DOM Size and Interactivity — Tại sao DOM lớn = INP tệ

> **Nguồn:** [web.dev/articles/dom-size-and-interactivity](https://web.dev/articles/dom-size-and-interactivity) — Google Web.dev
>
> Đây là bài giải thích **mối quan hệ trực tiếp giữa DOM size và INP**. DOM lớn không chỉ chậm tải trang — nó làm CHẬM MỌI INTERACTION suốt vòng đời trang. Mỗi click, hover, scroll đều trigger style recalculation và layout trên toàn bộ DOM tree.

### DOM Size Thresholds — Khi nào quá lớn?

```
Lighthouse thresholds (2024):
┌────────────────────────────────────────────────────────────┐
│ Metric              │ Warning  │ Excessive                 │
├────────────────────────────────────────────────────────────┤
│ Total DOM nodes     │ > 800    │ > 1,500 ← phổ biến nhất  │
│ Maximum depth       │ > 32     │ "div soup" territory       │
│ Max children/parent │ > 60     │ Long lists without virtual │
└────────────────────────────────────────────────────────────┘

Đo DOM size trong DevTools:
  Console:
    document.querySelectorAll('*').length  → tổng số elements
    
  Performance panel → Memory tab → Heap snapshot
    → Tìm "HTMLElement" count

  Lighthouse → "Avoid an excessive DOM size"
    → Lists all violating nodes với count + depth
```

---

### Tại sao DOM lớn ảnh hưởng INP — 3 cơ chế

```
CƠ CHẾ 1: Style Recalculation tốn O(n) time

  Mỗi interaction (click, hover, focus) → browser recalculate styles
  Time ∝ (số CSS rules) × (số DOM nodes)

  1,500 nodes × 100 CSS rules = 150,000 evaluations
  10,000 nodes × 100 CSS rules = 1,000,000 evaluations → slow!

  DevTools: "Recalculate Style, Elements Affected: 8,432, 67ms"
  → 67ms chỉ riêng style = 4 frames bị block!

CƠ CHẾ 2: Layout tốn O(n) time

  Layout cascade: thay đổi 1 element → phải recalculate
  tất cả elements trong subtree (và đôi khi toàn trang)

  10,000 nodes → layout = 50ms+ khi resize hoặc DOM change
  → Presentation delay cao → INP tệ

CƠ CHẾ 3: JavaScript operations chậm hơn

  querySelectorAll('.item') → traverse 10,000 nodes = slow
  getElementById() → OK (O(1))
  getElementsByClassName() → OK (live collection)
  querySelector('.complex > .nested .target') → SLOW với big DOM
```

---

### Nguyên nhân phổ biến của DOM quá lớn

```
1. "Div soup" từ CSS frameworks / page builders:
   <div class="container">
     <div class="row">
       <div class="col-12 col-md-6">
         <div class="card">
           <div class="card-body">
             <div class="card-content">
               <div class="text-wrapper">
                 <p>Actual content</p>  ← 8 divs để wrap 1 paragraph!
               </div>
             </div>
           </div>
         </div>
       </div>
     </div>
   </div>

2. Long lists không có virtualization:
   100 products → 100 × 10 nodes = 1,000 nodes (OK)
   1,000 products → 1,000 × 10 = 10,000 nodes (SLOW!)

3. Hidden content vẫn trong DOM:
   Tabs: tất cả tabs trong DOM, display:none các tab không active
   Modals: render modal ngay cả khi chưa open
   Accordion: tất cả panels trong DOM

4. Infinite scroll không cleanup:
   User scroll xuống → thêm items
   KHÔNG remove items đã scroll qua
   → DOM grows indefinitely!
```

---

### Fix 1: Virtualization — Chỉ render visible items

```typescript
// react-window: Chỉ render items trong viewport
import { FixedSizeList, VariableSizeList } from 'react-window';

// ❌ BAD: Render toàn bộ list
function BadProductList({ products }: { products: Product[] }) {
  return (
    <ul>
      {products.map(product => (
        // 10,000 products → 10,000 DOM nodes!
        <ProductItem key={product.id} data={product} />
      ))}
    </ul>
  );
}

// ✅ GOOD: react-window — chỉ render ~10 visible items
function VirtualProductList({ products }: { products: Product[] }) {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      <ProductItem data={products[index]} />
    </div>
  );

  return (
    <FixedSizeList
      height={600}        // Container height
      itemCount={products.length}
      itemSize={120}      // Each row height (fixed)
      width="100%"
      overscanCount={3}   // Render 3 extra above/below viewport
    >
      {Row}
    </FixedSizeList>
  );
  // → Dù có 10,000 products, chỉ ~7 DOM nodes rendered!
  // → DOM size: 70 nodes instead of 100,000!
}

// Variable height items: VariableSizeList
function VariableList({ items }: { items: Item[] }) {
  const getItemSize = (index: number) => items[index].expanded ? 200 : 80;

  return (
    <VariableSizeList
      height={500}
      itemCount={items.length}
      itemSize={getItemSize}
      width="100%"
    >
      {({ index, style }) => (
        <div style={style}>
          <Item data={items[index]} />
        </div>
      )}
    </VariableSizeList>
  );
}
```

```typescript
// react-virtuoso: Easier API, auto-calculates sizes
import { Virtuoso } from 'react-virtuoso';

function ChatList({ messages }: { messages: Message[] }) {
  return (
    <Virtuoso
      style={{ height: '600px' }}
      totalCount={messages.length}
      // Auto-measures item heights!
      itemContent={(index) => <Message data={messages[index]} />}
      // followOutput: auto-scroll to bottom for chat
      followOutput="smooth"
      // Infinite scroll built-in!
      endReached={() => loadMoreMessages()}
    />
  );
}
```

---

### Fix 2: `content-visibility: auto` — Skip off-screen rendering

```css
/* CSS-only approach — không cần JS, không cần virtual library */
/* Browser tự skip rendering cho off-screen elements */

.feed-article {
  content-visibility: auto;

  /* QUAN TRỌNG: Cung cấp intrinsic size để tránh layout shift */
  /* Browser cần biết estimated height để tính scroll position */
  contain-intrinsic-size: auto 300px; /* Estimated: 300px height */
}

/* ⚠️ CAVEAT: Không dùng cho content trong initial viewport!
   → LCP có thể bị delay nếu hero content có content-visibility: auto
   → Chỉ dùng cho content DƯỚI the fold */

/* Example: News feed */
.news-feed .article {
  content-visibility: auto;
  contain-intrinsic-size: auto 200px;
  /* → Article off-screen: browser SKIP style + layout + paint
     → Massive reduction in rendering work!
     → Scroll qua → browser render on-demand */
}

/* Performance impact (thực tế):
   1000 articles:
   WITHOUT: First render 3000ms, style recalc 50ms/interaction
   WITH:    First render 400ms,  style recalc 5ms/interaction (10x!) */
```

```typescript
// React: Apply content-visibility via CSS class
function ArticleFeed({ articles }: { articles: Article[] }) {
  return (
    <div className="feed">
      {articles.map((article, index) => (
        <article
          key={article.id}
          className={`feed-article ${index > 3 ? 'below-fold' : ''}`}
          // Chỉ apply content-visibility cho articles dưới fold
        >
          <ArticleContent data={article} />
        </article>
      ))}
    </div>
  );
}

// CSS:
// .below-fold {
//   content-visibility: auto;
//   contain-intrinsic-size: auto 250px;
// }
```

---

### Fix 3: Lazy DOM Creation với IntersectionObserver

```typescript
// Tạo DOM nodes chỉ khi user THỰC SỰ scroll đến
// → DOM size grows on demand, không pre-render tất cả

function LazySection({ children, placeholder }: {
  children: React.ReactNode;
  placeholder: React.ReactNode;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Once visible, no need to keep observing
          observer.disconnect();
        }
      },
      { rootMargin: '200px' } // Load 200px before entering viewport
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref}>
      {isVisible ? children : placeholder}
    </div>
  );
}

// Usage:
function ProductPage() {
  return (
    <div>
      <HeroSection />        {/* Always rendered */}
      <FeaturedProducts />   {/* Always rendered */}

      {/* Heavy sections: only created when scrolled to */}
      <LazySection placeholder={<SectionSkeleton height={400} />}>
        <ReviewsSection />   {/* 500+ DOM nodes, created on demand */}
      </LazySection>

      <LazySection placeholder={<SectionSkeleton height={300} />}>
        <RecommendationsSection />  {/* Another 300+ nodes */}
      </LazySection>

      <LazySection placeholder={<SectionSkeleton height={200} />}>
        <RelatedProductsSection />
      </LazySection>
    </div>
  );
}
```

---

### Fix 4: Remove DOM nodes khi không cần

```typescript
// Infinite scroll: cleanup old nodes khi user scroll xa
function InfiniteScrollList() {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 50 });
  const BUFFER = 50; // Giữ 50 items trên + 50 items dưới viewport

  const onScroll = useCallback((scrollTop: number, clientHeight: number) => {
    const ITEM_HEIGHT = 80;
    const firstVisible = Math.floor(scrollTop / ITEM_HEIGHT);
    const lastVisible = Math.ceil((scrollTop + clientHeight) / ITEM_HEIGHT);

    setVisibleRange({
      start: Math.max(0, firstVisible - BUFFER),
      end: Math.min(allItems.length, lastVisible + BUFFER),
    });
    // → Chỉ render 100 items tại 1 thời điểm
    // → DOM size cố định, không grow indefinitely
  }, []);

  // Render phantom spacers để maintain scroll position
  const topSpacerHeight = visibleRange.start * 80;
  const bottomSpacerHeight = (allItems.length - visibleRange.end) * 80;

  return (
    <div onScroll={e => onScroll(e.currentTarget.scrollTop, e.currentTarget.clientHeight)}>
      <div style={{ height: topSpacerHeight }} />
      {allItems.slice(visibleRange.start, visibleRange.end).map(item => (
        <Item key={item.id} data={item} />
      ))}
      <div style={{ height: bottomSpacerHeight }} />
    </div>
  );
}
```

---

### Fix 5: Xóa "Div Soup" — Semantic HTML

```typescript
// ❌ BAD: Excessive wrapper divs
function Card({ title, content, tags }: CardProps) {
  return (
    <div className="card-wrapper">
      <div className="card-container">
        <div className="card">
          <div className="card-header">
            <div className="card-title-wrapper">
              <div className="card-title-inner">
                <h3>{title}</h3>
              </div>
            </div>
          </div>
          <div className="card-body">
            <div className="card-content">
              <div className="card-text">
                <p>{content}</p>
              </div>
            </div>
          </div>
          <div className="card-footer">
            <div className="tags-container">
              {tags.map(tag => (
                <div className="tag-wrapper">
                  <span className="tag">{tag}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
// → 10+ nodes per card × 100 cards = 1,000+ unnecessary nodes!

// ✅ GOOD: Semantic HTML, minimal wrappers
function Card({ title, content, tags }: CardProps) {
  return (
    <article className="card">
      <header>
        <h3>{title}</h3>
      </header>
      <p>{content}</p>
      <footer>
        {tags.map(tag => <span key={tag} className="tag">{tag}</span>)}
      </footer>
    </article>
  );
}
// → 4-5 nodes per card × 100 cards = 400-500 nodes (2-3x less!)
```

---

### Đo và Monitor DOM Size

```javascript
// Measure DOM size programmatically
function getDOMStats() {
  const allElements = document.querySelectorAll('*');

  // Max depth
  let maxDepth = 0;
  allElements.forEach(el => {
    let depth = 0;
    let parent = el.parentElement;
    while (parent) {
      depth++;
      parent = parent.parentElement;
    }
    maxDepth = Math.max(maxDepth, depth);
  });

  // Max children
  let maxChildren = 0;
  allElements.forEach(el => {
    maxChildren = Math.max(maxChildren, el.children.length);
  });

  return {
    totalNodes: allElements.length,
    maxDepth,
    maxChildren,
    // Lighthouse thresholds:
    isHealthy: allElements.length < 1500 && maxDepth < 32 && maxChildren < 60,
  };
}

// Run in DevTools Console:
// console.table(getDOMStats())

// Performance Observer để detect DOM size growth:
const observer = new MutationObserver((mutations) => {
  const totalNodes = document.querySelectorAll('*').length;
  if (totalNodes > 1500) {
    console.warn(`DOM size exceeded threshold: ${totalNodes} nodes`);
  }
});

observer.observe(document.body, { childList: true, subtree: true });
```

---

### Summary: DOM Size → INP Pipeline

```
DOM Size Impact on INP phases:
┌────────────────────────────────────────────────────────────────┐
│ Phase            │ DOM size impact                            │
├────────────────────────────────────────────────────────────────┤
│ Input Delay      │ querySelectorAll() slower → more blocking  │
│ Processing Time  │ JS DOM operations slow with large tree     │
│ Presentation     │ Style recalc + Layout cost O(n) nodes      │
│ (LARGEST impact) │ → Main bottleneck with large DOM!          │
└────────────────────────────────────────────────────────────────┘

Fix Priority:
  1. Virtualize long lists (react-window, react-virtuoso)
     → DOM: 10,000 → ~20 nodes (500x reduction!)
  2. content-visibility: auto cho long feeds
     → Render cost: O(n) → O(visible items)
  3. Lazy DOM creation (IntersectionObserver)
     → Only create nodes when needed
  4. Cleanup old nodes (infinite scroll)
     → Prevent DOM growth over time
  5. Remove div soup
     → 3-5x node reduction per component

Targets:
  Total nodes:      < 1,500 (ideally < 800)
  Max depth:        < 32 levels
  Max children:     < 60 per parent
  
DevTools check:
  Lighthouse → "Avoid an excessive DOM size"
  Console: document.querySelectorAll('*').length
```


---

## Deep Dive: Client-Side Rendering of HTML and Interactivity

> **Nguồn:** [web.dev/articles/client-side-rendering-of-html-and-interactivity](https://web.dev/articles/client-side-rendering-of-html-and-interactivity) — Google Web.dev
>
> Bài này focus vào một vấn đề đặc thù của SPA/CSR apps: khi JavaScript **inject HTML lớn vào DOM** (tab switch, modal open, route change), browser phải parse + style + layout + paint toàn bộ HTML đó **trong 1 task** — gây presentation delay cao. Khác với bài DOM size (giảm nodes), bài này về **cách inject HTML hiệu quả**.

### Vấn đề: Browser parse HTML khác server

```
SERVER-SIDE rendering (fast):
  Server gửi HTML → Browser nhận từng byte
  Browser STREAM parse: parse được đến đâu → render đến đó
  → Incremental, không block!

CLIENT-SIDE rendering (slow):
  JS fetch data → JS build HTML string → JS inject vào DOM
  browser.innerHTML = '<div>...(500KB HTML)...</div>';
  → Browser phải parse TOÀN BỘ string CÙNG 1 LÚC
  → 1 Huge Task → blocks main thread → HIGH presentation delay!
```

```
CSR innerHTML injection — timeline trong DevTools:

Main thread:
  [JS: Build HTML string: 50ms]
  [innerHTML = htmlString: starts parse]
  [Parse HTML: 100ms        ]
  [Recalculate Style: 40ms  ]
  [Layout: 60ms             ]
  [Paint: 30ms              ]
  [Composite: 10ms          ]
  Total: 290ms — 1 MONOLITHIC TASK!
  → User click anything during this → 290ms input delay!
```

---

### DOM Manipulation APIs — So sánh

```javascript
// 3 cách inject HTML — performance khác nhau đáng kể:

// 1. innerHTML — WORST (nhưng phổ biến nhất)
container.innerHTML = bigHtmlString;
// Vấn đề:
//   - Re-parses entire container's existing content
//   - Destroys and recreates ALL existing nodes
//   - Event listeners bị remove!
//   - 1 blocking parse task

// 2. insertAdjacentHTML — BETTER
container.insertAdjacentHTML('beforeend', htmlChunk);
// Tốt hơn vì:
//   - Không touch existing content
//   - Không destroy event listeners
//   - Parse chỉ phần mới inject
//   Nhưng vẫn: 1 parse task nếu htmlChunk lớn

// 3. DocumentFragment — BEST cho complex DOM building
const fragment = document.createDocumentFragment();
// Build cây DOM trong memory (không attached to page):
items.forEach(item => {
  const el = document.createElement('div');
  el.className = 'item';
  el.textContent = item.name;
  fragment.appendChild(el);
});
// Append 1 lần duy nhất:
container.appendChild(fragment);
// Tốt vì:
//   - Build DOM "offline" (không trigger reflow)
//   - 1 reflow khi attach
//   - Không re-parse HTML string (build DOM directly)
```

---

### Fix 1: Chunk HTML Injection với Yield

Thay vì inject 1 lượng HTML khổng lồ, chia thành nhiều chunks nhỏ với yield giữa mỗi chunk:

```typescript
// ❌ BAD: Inject 1000 items cùng lúc
async function renderAllItems(items: Item[]) {
  const html = items.map(item => `
    <div class="item">
      <img src="${item.image}" />
      <h3>${item.name}</h3>
      <p>${item.description}</p>
    </div>
  `).join('');

  container.innerHTML = html; // 1 monolithic task parsing 1000 items!
}

// ✅ GOOD: Inject theo chunks với yield
async function renderItemsInChunks(items: Item[], container: HTMLElement) {
  const CHUNK_SIZE = 50; // Render 50 items mỗi chunk

  for (let i = 0; i < items.length; i += CHUNK_SIZE) {
    const chunk = items.slice(i, i + CHUNK_SIZE);

    // Build fragment offline (no reflow)
    const fragment = document.createDocumentFragment();
    chunk.forEach(item => {
      const el = document.createElement('div');
      el.className = 'item';
      el.innerHTML = `
        <img src="${item.image}" loading="lazy" />
        <h3>${item.name}</h3>
      `;
      fragment.appendChild(el);
    });

    // Append chunk (1 reflow per chunk)
    container.appendChild(fragment);

    // YIELD → browser paint chunk + handle input
    await scheduler.yield();
    // → User thấy items xuất hiện dần dần (progressive)
    // → Không bị freeze trong khi toàn bộ 1000 items render
  }
}
```

```
Chunked rendering — User experience:

BEFORE (monolithic):
  Click "Load More" → FREEZE 500ms → Tất cả 1000 items appear
  User: "Why is it frozen?"

AFTER (chunked):
  Click "Load More" → 50 items appear (50ms)
  → 50 more appear (50ms)
  → 50 more appear...
  → User có thể scroll, click ngay trong khi items load!
  → Feels responsive even though total time similar
```

---

### Fix 2: React Patterns cho Large HTML Rendering

```typescript
// React tự handle chunking qua startTransition
import { useState, useTransition, Suspense, lazy } from 'react';

// Pattern 1: startTransition cho tab switch với heavy content
function TabPanel() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isPending, startTransition] = useTransition();

  const handleTabChange = (tab: string) => {
    // Tab UI change: urgent (instant)
    // Content render: non-urgent (can be interrupted)
    startTransition(() => {
      setActiveTab(tab);
    });
  };

  return (
    <div>
      <TabBar
        active={activeTab}
        onChange={handleTabChange}
        loading={isPending} // Show loading indicator while rendering
      />
      <div style={{ opacity: isPending ? 0.7 : 1 }}>
        {/* React renders this "in background" via startTransition */}
        <TabContent tab={activeTab} />
      </div>
    </div>
  );
}

// Pattern 2: Lazy + Suspense cho route-based heavy HTML
const HeavyDashboard = lazy(() => import('./HeavyDashboard'));
// → Dashboard HTML không được created/parsed cho đến khi user navigate đó
// → Tránh hoàn toàn upfront render cost!

function App() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <HeavyDashboard />
    </Suspense>
  );
}

// Pattern 3: Progressive enhancement với useDeferredValue
function SearchResults({ query }: { query: string }) {
  const deferredQuery = useDeferredValue(query);

  // Results chỉ re-render khi deferredQuery thay đổi (ưu tiên thấp)
  // → Typing vào search box luôn responsive!
  const results = useSearchResults(deferredQuery);

  return (
    <div style={{ opacity: query !== deferredQuery ? 0.7 : 1 }}>
      {results.map(result => (
        <ResultCard key={result.id} data={result} />
      ))}
    </div>
  );
}
```

---

### Fix 3: Skeleton Screens — Immediate Visual Feedback

```typescript
// Pattern: Show skeleton TRƯỚC khi heavy HTML render
// → User thấy response ngay (không cảm thấy lag)
// → Presentation delay của heavy content không ảnh hưởng perceived responsiveness

function ProductModal({ productId, onClose }: ModalProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    fetchProduct(productId).then(data => {
      startTransition(() => {
        setProduct(data);
        setIsLoading(false);
      });
    });
  }, [productId]);

  return (
    <dialog open>
      {isLoading ? (
        // IMMEDIATE: Skeleton appears instantly when modal opens
        <ProductSkeleton />
      ) : (
        // DEFERRED: Heavy HTML rendered after skeleton
        <ProductDetail data={product!} />
      )}
      <button onClick={onClose}>Close</button>
    </dialog>
  );
}

// ProductSkeleton: CSS-only, no complex DOM
// Appears in < 5ms (simple CSS shapes)
// ProductDetail: 200 DOM nodes, images, rich content
// Appears after data fetch + startTransition
```

---

### Fix 4: Đo Presentation Delay thực sự

```javascript
// Đừng chỉ đo JavaScript execution time — đo cả rendering time!

// ❌ KHÔNG ĐỦ: Chỉ đo JS execution
const start = performance.now();
container.innerHTML = bigHtml;
const jsTime = performance.now() - start; // 5ms — looks fast!
// Nhưng: style + layout + paint sau đó = 200ms!

// ✅ ĐO ĐÚNG: Đo đến khi browser paint xong
const start = performance.now();
container.innerHTML = bigHtml;

// requestAnimationFrame fires AFTER layout + paint!
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    // Double rAF: ensures browser has painted
    const totalTime = performance.now() - start;
    console.log('Actual render time:', totalTime, 'ms');
    // Có thể 200ms dù JS chỉ 5ms!
  });
});

// Measurement với PerformanceObserver (recommended)
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.entryType === 'event' && entry.name === 'click') {
      console.log({
        inputDelay: entry.processingStart - entry.startTime,
        processingDuration: entry.processingEnd - entry.processingStart,
        presentationDelay: entry.duration - (entry.processingEnd - entry.startTime),
        total: entry.duration
      });
    }
  }
});
observer.observe({ type: 'event', durationThreshold: 16 });
```

---

### Fix 5: SSR/Streaming cho Initial Load

```typescript
// Next.js App Router — Streaming với Suspense
// Server stream HTML theo chunks → browser parse incrementally
// → Không có "big bang" client-side rendering!

// app/dashboard/page.tsx:
import { Suspense } from 'react';

export default async function DashboardPage() {
  return (
    <div>
      {/* Critical: Server render ngay */}
      <DashboardHeader />

      {/* Heavy: Stream sau khi header đã hiện */}
      <Suspense fallback={<MetricsSkeleton />}>
        <MetricsSection /> {/* Async server component */}
      </Suspense>

      <Suspense fallback={<ChartsSkeleton />}>
        <ChartsSection />  {/* Heavy charts */}
      </Suspense>

      <Suspense fallback={<TableSkeleton />}>
        <DataTable />      {/* 1000+ rows */}
      </Suspense>
    </div>
  );
}

// Browser nhận HTML theo streams:
// Stream 1: <DashboardHeader> → Render ngay
// Stream 2: <MetricsSection>  → Replace skeleton
// Stream 3: <ChartsSection>   → Replace skeleton
// Stream 4: <DataTable>       → Replace skeleton
// → Không bao giờ có 1 monolithic HTML injection!
// → Presentation delay phân tán vào nhiều small tasks
```

---

### Summary: CSR HTML Rendering Patterns

```
Rendering large HTML — Decision matrix:
┌────────────────────────────────────────────────────────────────┐
│ Scenario                    │ Best approach                   │
├────────────────────────────────────────────────────────────────┤
│ Tab switch (heavy content)  │ React startTransition           │
│ Route change (SPA)          │ React.lazy() + Suspense        │
│ Modal with rich content     │ Skeleton → startTransition      │
│ Long list rendering         │ Virtualization (react-window)   │
│ Search results update       │ useDeferredValue               │
│ Initial page load (Next.js) │ Streaming SSR + Suspense        │
│ Inject HTML chunks          │ DocumentFragment + yield loop  │
├────────────────────────────────────────────────────────────────┤
│ AVOID:                                                         │
│   ❌ container.innerHTML = bigHtmlString (1 huge task)        │
│   ❌ Render all items at once (even with React)               │
│   ❌ Measure only JS time (presentation delay is the real cost│
└────────────────────────────────────────────────────────────────┘

Key mental model:
  "Browser parse time" is INVISIBLE to JavaScript profiling
  JS: 5ms → browser parse + style + layout + paint: 200ms
  → User feels 200ms lag, not 5ms
  → Always measure with double-rAF or PerformanceObserver!

Presentation delay targets:
  < 50ms:  Excellent
  < 100ms: Acceptable
  > 200ms: Poor (users will notice)
  > 500ms: Very Poor (users think app is broken)
```


---

## Deep Dive: IndexedDB — Client-Side Database for Performance

> **Nguồn:** [web.dev/articles/indexeddb](https://web.dev/articles/indexeddb) — Google Web.dev
>
> **IndexedDB** là database thực sự trên client — không phải key-value store như localStorage. Đây là nền tảng cho offline-first apps, caching strategies, và giảm network requests. Bài này cover toàn bộ từ concepts đến production patterns với TypeScript.

### IndexedDB vs localStorage — Khi nào dùng cái nào?

```
localStorage:
  ✅ Simple key-value (max ~5-10MB)
  ✅ Synchronous (easy to use)
  ❌ Blocks main thread!
  ❌ Only strings (no complex objects)
  ❌ No indexing/querying
  Use for: Settings, small preferences, flags

IndexedDB:
  ✅ Large data (thường 50-1000MB+, browser decides)
  ✅ Asynchronous (non-blocking)
  ✅ Complex objects (Structured Clone: Date, Blob, ArrayBuffer...)
  ✅ Indexes for fast queries
  ✅ Transactions (atomicity)
  ✅ Available in Web Workers!
  Use for: Cached API data, offline content, large datasets

sessionStorage: Same as localStorage but cleared when tab closes
Cache API (Service Worker): Best for HTTP response caching (assets, API)
IndexedDB: Best for structured application data
```

---

### Concepts: Database, Object Store, Index, Transaction

```
IndexedDB Structure:
┌─────────────────────────────────────────────────────────────┐
│ Database: "my-app-db" (v2)                                 │
│   ├── Object Store: "products"                             │
│   │     keyPath: "id"                                      │
│   │     Indexes: "by-category", "by-price"                 │
│   │     Records: { id: "1", name: "iPhone", price: 999... }│
│   │                                                         │
│   ├── Object Store: "users"                                │
│   │     keyPath: "userId"                                  │
│   │     autoIncrement: true                                │
│   │     Records: { userId: 1, email: "...", prefs: {...} } │
│   │                                                         │
│   └── Object Store: "cache"                               │
│         keyPath: "url"                                      │
│         Records: { url: "/api/products", data: [...] }     │
└─────────────────────────────────────────────────────────────┘

Transactions:
  Mọi read/write phải trong transaction
  transaction = atomic: tất cả thành công hoặc tất cả rollback
  
  Modes:
    'readonly':  Concurrent reads OK
    'readwrite': Exclusive access, block other writes
    
  Best practice: Giữ transactions ngắn — commit NGAY sau write
  → Long transactions block other transactions!
```

---

### Setup: `idb` Library (Recommended over raw API)

```bash
npm install idb
```

```typescript
// db.ts — Database setup với TypeScript types
import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Define schema — TypeScript type safety!
interface AppDB extends DBSchema {
  products: {
    key: string;         // keyPath: 'id'
    value: {
      id: string;
      name: string;
      category: string;
      price: number;
      stock: number;
      updatedAt: number;
    };
    indexes: {
      'by-category': string;
      'by-price': number;
      'by-updated': number;
    };
  };
  'api-cache': {
    key: string;         // keyPath: 'url'
    value: {
      url: string;
      data: unknown;
      timestamp: number;
      expiresAt: number;
    };
  };
  'user-preferences': {
    key: string;
    value: {
      key: string;
      value: unknown;
    };
  };
}

const DB_NAME = 'my-app-db';
const DB_VERSION = 2;

// Singleton pattern: 1 connection, reuse everywhere
let dbPromise: Promise<IDBPDatabase<AppDB>> | null = null;

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<AppDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        // Version guards — handle migrations safely!
        if (oldVersion < 1) {
          // Version 1: Create products store
          const productStore = db.createObjectStore('products', {
            keyPath: 'id'
          });
          productStore.createIndex('by-category', 'category');
          productStore.createIndex('by-price', 'price');
        }

        if (oldVersion < 2) {
          // Version 2: Add new stores + index
          db.createObjectStore('api-cache', { keyPath: 'url' });
          db.createObjectStore('user-preferences', { keyPath: 'key' });

          // Add index to existing store (via transaction!)
          transaction.objectStore('products')
            .createIndex('by-updated', 'updatedAt');
        }
        // Thêm version guards cho migrations tương lai:
        // if (oldVersion < 3) { ... }
      },
      blocked() {
        // Old tab đang dùng DB với version cũ
        alert('Please close other tabs to update the app!');
      },
      blocking() {
        // Tab này đang block upgrade ở tab khác
        window.location.reload();
      },
      terminated() {
        dbPromise = null; // Reset để reconnect
      }
    });
  }
  return dbPromise;
}
```

---

### CRUD Operations

```typescript
// products.ts — Repository pattern với IndexedDB

import { getDB } from './db';

type Product = AppDB['products']['value'];

// CREATE / UPDATE
export async function saveProduct(product: Product): Promise<void> {
  const db = await getDB();
  await db.put('products', {
    ...product,
    updatedAt: Date.now()
  });
  // 'put' = upsert (insert nếu chưa có, update nếu đã có)
}

// READ single
export async function getProduct(id: string): Promise<Product | undefined> {
  const db = await getDB();
  return db.get('products', id);
}

// READ all
export async function getAllProducts(): Promise<Product[]> {
  const db = await getDB();
  return db.getAll('products');
  // ⚠️ Cẩn thận: getAll load toàn bộ vào memory!
  // Nếu có 100,000 products → dùng cursor thay thế
}

// READ by index
export async function getProductsByCategory(category: string): Promise<Product[]> {
  const db = await getDB();
  return db.getAllFromIndex('products', 'by-category', category);
}

// READ by price range
export async function getProductsByPriceRange(
  minPrice: number,
  maxPrice: number
): Promise<Product[]> {
  const db = await getDB();
  const range = IDBKeyRange.bound(minPrice, maxPrice);
  return db.getAllFromIndex('products', 'by-price', range);
}

// DELETE
export async function deleteProduct(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('products', id);
}

// BATCH operations trong 1 transaction (atomic!)
export async function saveProducts(products: Product[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('products', 'readwrite');

  // Tất cả writes trong cùng 1 transaction
  await Promise.all([
    ...products.map(product => tx.store.put({
      ...product,
      updatedAt: Date.now()
    })),
    tx.done // Wait for transaction to complete
  ]);
}
```

---

### Cursor — Iterate Large Datasets Efficiently

```typescript
// Cursor: Iterate từng record, không load toàn bộ vào memory
// Perfect cho: Export, bulk processing, pagination

// Tìm products giá cao nhất mà không load all into memory
export async function getExpensiveProducts(
  threshold: number,
  limit: number
): Promise<Product[]> {
  const db = await getDB();
  const results: Product[] = [];

  // IDBKeyRange.lowerBound: price > threshold
  const range = IDBKeyRange.lowerBound(threshold, true);

  // Iterate cursor by price index
  let cursor = await db.transaction('products')
    .store
    .index('by-price')
    .openCursor(range, 'prev'); // 'prev' = descending (highest first)

  while (cursor && results.length < limit) {
    results.push(cursor.value);
    cursor = await cursor.continue();
  }

  return results;
}

// Bulk update với cursor (memory-efficient)
export async function markOutOfStock(): Promise<number> {
  const db = await getDB();
  const tx = db.transaction('products', 'readwrite');
  let updatedCount = 0;

  let cursor = await tx.store.openCursor();
  while (cursor) {
    if (cursor.value.stock === 0) {
      // Update record at cursor position
      await cursor.update({
        ...cursor.value,
        outOfStock: true,
        updatedAt: Date.now()
      });
      updatedCount++;
    }
    cursor = await cursor.continue();
  }

  await tx.done;
  return updatedCount;
}
```

---

### Pattern: API Cache với Stale-While-Revalidate

```typescript
// cache.ts — IndexedDB as API response cache
import { getDB } from './db';

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getCachedOrFetch<T>(
  url: string,
  fetcher: () => Promise<T>
): Promise<T> {
  const db = await getDB();

  // Step 1: Check cache
  const cached = await db.get('api-cache', url);
  const isValid = cached && cached.expiresAt > Date.now();

  if (isValid) {
    // Return cache immediately (fast!)
    // Optionally revalidate in background
    if (Date.now() > cached.expiresAt - 60_000) {
      // Within 1 minute of expiry: revalidate in background
      fetcher().then(freshData => {
        db.put('api-cache', {
          url,
          data: freshData,
          timestamp: Date.now(),
          expiresAt: Date.now() + CACHE_TTL
        });
      }).catch(console.error); // Silent fail for background update
    }
    return cached.data as T;
  }

  // Step 2: Fetch fresh data
  const freshData = await fetcher();

  // Step 3: Store in cache (non-blocking)
  db.put('api-cache', {
    url,
    data: freshData,
    timestamp: Date.now(),
    expiresAt: Date.now() + CACHE_TTL
  }).catch(console.error);

  return freshData;
}

// Cache invalidation
export async function invalidateCache(urlPattern?: string): Promise<void> {
  const db = await getDB();

  if (!urlPattern) {
    // Clear all cache
    await db.clear('api-cache');
    return;
  }

  // Clear matching URLs using cursor
  const tx = db.transaction('api-cache', 'readwrite');
  let cursor = await tx.store.openCursor();

  while (cursor) {
    if (cursor.key.toString().includes(urlPattern)) {
      await cursor.delete();
    }
    cursor = await cursor.continue();
  }
  await tx.done;
}
```

---

### React Hook: `useIndexedDB`

```typescript
// useIndexedDB.ts — Production-ready hook
import { useState, useEffect, useCallback } from 'react';
import { getCachedOrFetch } from './cache';
import { saveProduct, getProductsByCategory, deleteProduct } from './products';

// Generic cache hook
export function useCachedFetch<T>(url: string, fetcher: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    getCachedOrFetch(url, fetcher)
      .then(result => {
        if (!cancelled) {
          setData(result);
          setIsLoading(false);
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err);
          setIsLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [url]);

  return { data, error, isLoading };
}

// Products-specific hook
export function useProducts(category: string) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      // Step 1: Load from IndexedDB immediately (fast, offline-capable)
      const cached = await getProductsByCategory(category);
      setProducts(cached);

      // Step 2: Fetch fresh from network (Stale-While-Revalidate)
      const fresh = await fetch(`/api/products?category=${category}`)
        .then(r => r.json());

      // Step 3: Update IndexedDB + UI with fresh data
      await saveProducts(fresh);
      setProducts(fresh);
    } finally {
      setIsLoading(false);
    }
  }, [category]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const remove = useCallback(async (id: string) => {
    await deleteProduct(id);
    setProducts(prev => prev.filter(p => p.id !== id));
    // Optimistic UI: update state immediately, sync DB in background
  }, []);

  return { products, isLoading, remove, refresh: loadProducts };
}
```

---

### Error Handling — Production Considerations

```typescript
// IndexedDB có thể fail trong nhiều trường hợp thực tế:
// - Private browsing mode (Firefox: fully blocked!)
// - Disk full
// - User denied storage permission
// - Browser security settings
// - iOS Safari: eviction trong PWA

// Production-grade wrapper với fallback
class StorageService {
  private isAvailable: boolean | null = null;

  async checkAvailability(): Promise<boolean> {
    if (this.isAvailable !== null) return this.isAvailable;

    try {
      const db = await getDB();
      // Test write
      await db.put('user-preferences', { key: '__test__', value: 1 });
      await db.delete('user-preferences', '__test__');
      this.isAvailable = true;
    } catch {
      this.isAvailable = false;
      console.warn('IndexedDB not available, falling back to memory cache');
    }

    return this.isAvailable;
  }

  // In-memory fallback when IndexedDB unavailable
  private memoryCache = new Map<string, unknown>();

  async get(key: string): Promise<unknown> {
    if (!(await this.checkAvailability())) {
      return this.memoryCache.get(key);
    }

    try {
      const db = await getDB();
      const record = await db.get('user-preferences', key);
      return record?.value;
    } catch (error) {
      console.error('IndexedDB get failed:', error);
      return this.memoryCache.get(key);
    }
  }

  async set(key: string, value: unknown): Promise<void> {
    this.memoryCache.set(key, value); // Always update memory cache

    if (!(await this.checkAvailability())) return;

    try {
      const db = await getDB();
      await db.put('user-preferences', { key, value });
    } catch (error) {
      console.error('IndexedDB set failed:', error);
      // Memory cache already updated, graceful degradation!
    }
  }
}

export const storage = new StorageService();
```

---

### Summary: IndexedDB Decision Guide

```
Choose IndexedDB when:
  ✅ Need to cache API responses (offline-first)
  ✅ Store large datasets (products catalog, messages history)
  ✅ Need complex queries (filter by category + price range)
  ✅ Need transactions (atomic multi-store updates)
  ✅ Work with binary data (images, files, ArrayBuffers)
  ✅ PWA / Service Worker integration

Don't use IndexedDB when:
  ❌ Simple key-value under 5MB → localStorage
  ❌ HTTP response caching → Cache API (Service Worker)
  ❌ Session-only data → sessionStorage or React state
  ❌ Sensitive data → Never store unencrypted in any client storage!

Performance tips:
  ✅ Use idb library (not raw IndexedDB API)
  ✅ Batch writes in 1 transaction
  ✅ Use indexes for queries (not getAll + filter)
  ✅ Use cursors for large datasets (not getAll)
  ✅ Keep transactions short (no awaits on slow operations inside tx)
  ✅ Implement Stale-While-Revalidate for UX

Libraries comparison:
  idb (Jake Archibald):   Thin Promise wrapper, type-safe, ~1.7KB
  Dexie.js:               Higher-level, Observable support, ~22KB
  RxDB:                   Reactive, real-time sync, >100KB
  localForage:            Auto-selects best storage, simple API, ~8KB
  TanStack Query persist: Integration with query cache, best for React
```


---

## Deep Dive: Why Speed Matters — The Business Case for Performance

> **Nguồn:** [web.dev/learn/performance/why-speed-matters](https://web.dev/learn/performance/why-speed-matters) — Google Web.dev
>
> Bài mở đầu của chuỗi "Learn Performance" trên web.dev. Không phải về kỹ thuật — mà về **lý do TẠI SAO** performance quan trọng: user psychology, business impact, và web equity. Đây là bài cần đọc để thuyết phục stakeholders đầu tư vào performance work.

### Performance là về Con Người, không phải Metrics

```
Common mistake: "Cần fix LCP < 2.5s vì Google ranking"
Better framing: "Cần fix LCP < 2.5s vì 53% users bỏ đi
                 nếu page load > 3 giây trên mobile"

Metrics chỉ là proxy cho human experience:
  LCP → "Khi nào user thấy content chính?"
  FID/INP → "Khi nào user có thể tương tác?"
  CLS → "Nội dung có nhảy lung tung không?"

Performance goal thực sự:
  User thấy content → User interact → User convert → User return
  Chứ không phải: "Lighthouse score 100"
```

---

### Ngưỡng Thời Gian — User Psychology

```
Human perception thresholds (Nielsen Norman Group research):
┌────────────────────────────────────────────────────────────┐
│ < 100ms    "Instantaneous" — cảm giác ngay lập tức       │
│            User không nhận ra độ trễ                       │
│                                                            │
│ 100-300ms  "Fast" — UI phản hồi nhanh                    │
│            User có thể nhận ra nhưng không khó chịu       │
│                                                            │
│ 300-1000ms "Sluggish" — Flow bị gián đoạn                │
│            User nhận ra app đang "xử lý"                  │
│            Cần spinner/loading state                       │
│                                                            │
│ 1-3s       "Slow" — User bắt đầu impatient               │
│            Bounce rate tăng đáng kể                        │
│            Cần skeleton screens, progress indicators       │
│                                                            │
│ > 3s       "Unacceptable" — User likely leaves            │
│            53% mobile users abandon page                   │
│            First impression permanently damaged            │
│                                                            │
│ > 10s      "Broken" — User assumes site is down          │
│            Extremely unlikely to return                    │
└────────────────────────────────────────────────────────────┘

INP targets từ user psychology:
  < 200ms:  "Good" — user thấy immediate response
  200-500ms: "Needs improvement" — noticeable delay
  > 500ms:  "Poor" — users frustrated
```

---

### Business Impact — Real Case Studies

```
Vodafone (Telecommunications):
  LCP improvement: 31% better
  → Sales increase: +8%

redBus (Travel booking, India):
  INP improvement: optimized
  → Sales increase: +7%
  → Key insight: INP = booking flow interactions
    Better INP = users can complete booking faster = more conversions

Rakuten 24 (E-commerce, Japan):
  Core Web Vitals investment
  → Revenue per visitor: +53.37%
  → Conversion rate: +33.13%
  → Note: Largest % uplift of any case study!

Pinterest:
  Load time: -40% reduction in perceived load
  → Search engine traffic: +15%
  → Sign-up rate: +15%

Mobify:
  Homepage load: -100ms faster
  → Conversion rate: +1.11% ($380,000/year additional revenue)
  → Session-based revenue: +1.55%

Walmart:
  Every 1s improvement in load time
  → Conversions increase: +2%

AliExpress:
  Load time: -36% reduction
  → Order count: +10.5%
  → New customer conversion: +27%
  
BBC:
  Every additional second load time
  → Lose 10% of users
  → Article reads significantly reduced

Google Search:
  +0.5s slower search results
  → Traffic and revenue: -20%!
  → That's why Google cares SO MUCH about performance
```

---

### Performance và Equity — Không chỉ là Business Concern

```
"Performance is a matter of equity" — một trong những góc nhìn
quan trọng nhất của web.dev:

1. LOW-END DEVICES:
   Developer machine: MacBook Pro M3, 32GB RAM
   Typical mobile user: Android budget phone, 2GB RAM, 4× slower CPU
   
   App "fast" trên dev machine có thể = "unusable" trên user device!
   
   Test with CPU throttling 4-6x!
   Simulate real-world devices, not just desktops

2. NETWORK CONDITIONS:
   Dev office: WiFi 100Mbps
   Real users: 3G (1.6Mbps download, 750Kbps upload)
              2G in rural areas (0.25Mbps)
              Lossy connections, high latency
   
   Large JS bundle (500KB):
   WiFi 100Mbps: 0.04s download
   3G:           2.5s download → + parse time → 5+ seconds before interactive!

3. DATA COSTS:
   1MB of JavaScript:
   US/Europe: ~$0.001 (negligible)
   India:     ~$0.01-0.05 (noticeable)
   Africa:    ~$0.10+ (significant!)
   
   Bloated apps LITERALLY cost users money!
   Performance optimization = accessibility for users with limited data plans

4. BATTERY LIFE:
   Heavy CPU usage → more battery drain
   Users on older phones with degraded batteries
   Performance = respecting user resources

CONSEQUENCE: If your app only works well on high-end devices
  with fast internet → you're excluding a significant portion
  of your potential user base
```

---

### Performance và SEO — Core Web Vitals là Ranking Factor

```
Google's stance (2021-present):
  Core Web Vitals = official Google Search ranking signal
  Poor vitals → không disqualify ranking nhưng là tiebreaker
  
  Thực tế:
    2 pages ngang nhau về content quality
    Page A: Good CWV → ranked higher
    Page B: Poor CWV → ranked lower

  Metrics Google tracks:
    LCP: Largest Contentful Paint → < 2.5s (Good)
    INP: Interaction to Next Paint → < 200ms (Good) [replaced FID in March 2024]
    CLS: Cumulative Layout Shift → < 0.1 (Good)

  Lighthouse score ≠ Real CWV:
    Lighthouse = Lab (1 machine, 1 run)
    Real CWV = Field (real users, all devices, all connections)
    PageSpeed Insights = both Lab + Field data
    → Optimize for Field data (P75 of real users)!
```

---

### The Performance Gap — Dev vs Production

```
Common scenario:
  Developer: "Our site is fast! Lighthouse score 95!"
  User in Vietnam on Xiaomi Redmi:  "Site won't load..."

Gap sources:
┌────────────────────────────────────────────────────────────┐
│ Developer                     │ Real User                 │
├────────────────────────────────────────────────────────────┤
│ Fast laptop (M3)              │ Budget Android (Snapdragon│
│                               │ 665, 4x slower)           │
│ Office WiFi (100Mbps)         │ 3G/4G (1-10Mbps)         │
│ Same city as servers          │ High latency (100-300ms)  │
│ Latest Chrome                 │ Chrome 115 (outdated)     │
│ Empty cache (fresh test)      │ Warm cache (returning)    │
│ No extensions                 │ Multiple extensions       │
│ No background apps            │ 10+ apps running          │
└────────────────────────────────────────────────────────────┘

Simulation tools:
  DevTools Network: "Slow 3G" throttle
  DevTools CPU:     4-6x slowdown
  WebPageTest:      Real devices in real locations
  PageSpeed Insights: Field data from Chrome UX Report (CrUX)
  → Always test với throttling để simulate real users!
```

---

### Making the Business Case — Thuyết phục Stakeholders

```
Pitch framework cho Product/Business stakeholders:

1. TRANSLATE to business metrics (không nói "LCP"):
   BAD:  "LCP là 4.2s, cần cải thiện xuống 2.5s"
   GOOD: "Page load chậm 4.2s → 40% users bỏ đi
          với traffic 100K/month = 40K lost opportunities
          conversion rate 2% = 800 conversions lost/month
          average order $50 = $40,000/month lost revenue"

2. USE competitor comparison:
   "Competitor loads in 2.1s, we load in 4.2s
    → Users choosing them over us partially because of speed"

3. CITE industry data:
   "Every 100ms delay = 1% revenue loss (Amazon study)"
   "redBus improved INP → +7% sales"
   "Rakuten improved CWV → +53% revenue per visitor"

4. SHOW real user experience:
   Screen recording on throttled mobile device
   → Stakeholders see what users experience
   → Much more impactful than Lighthouse scores

5. PROPOSE ROI calculation:
   "Performance project cost: 2 weeks dev time = $X
    Expected conversion lift: +2% = $Y/month
    ROI: Payback in N months"
```

---

### Summary: Why Speed Matters — Key Takeaways

```
For DEVELOPERS:
  Performance is user experience, not just a technical metric
  Test with CPU throttling + network throttling
  Field data (CrUX) > Lab data (Lighthouse)
  Optimize for P75 real users, not best-case scenarios

For TEAMS:
  Performance work = revenue impact (provable!)
  Use case studies to justify investment
  Core Web Vitals = SEO ranking factor (Google confirmed)
  Poor performance = exclusion (equity issue)

Key numbers to remember:
  53% mobile users leave if page > 3s load
  100ms delay = measurable negative impact on conversions
  1s improvement = +2% conversions (Walmart)
  Good LCP: < 2.5s | Good INP: < 200ms | Good CLS: < 0.1
  
  Rakuten: +53% revenue per visitor from CWV investment
  → This is the ROI of performance optimization!

The "why" motivates the "how":
  Understanding business impact → prioritize performance work
  Understanding equity → test on real devices
  Understanding user psychology → set meaningful thresholds
  
  → Everything else in this guide (INP, React optimization,
    Web Workers, layout thrashing...) serves THESE goals!
```


---

## Deep Dive: General HTML Performance — Tối ưu từ Gốc rễ

> **Nguồn:** [web.dev/learn/performance/general-html-performance](https://web.dev/learn/performance/general-html-performance) — Google Web.dev
>
> Trước khi tối ưu JavaScript hay CSS, nền tảng là **HTML delivery**. Bài này cover toàn bộ quá trình từ khi browser gửi request đến khi document được parsed — TTFB, render-blocking resources, resource hints, và document order. Đây là checklist cho mọi web app.

### Critical Rendering Path — Toàn cảnh

```
Browser nhận URL → Render pixels:

1. DNS Lookup          → IP address của server
2. TCP Handshake       → Kết nối network
3. TLS Negotiation     → HTTPS security (thêm 1-2 RTTs!)
4. HTTP Request        → Gửi GET /
5. TTFB               ← Time to First Byte: server trả byte đầu tiên
6. HTML Download       → Browser nhận HTML document
7. HTML Parse          → Browser parse HTML, build DOM
   ├── Encounter <link rel="stylesheet"> → STOP, download CSS!
   ├── Encounter <script> (no defer/async) → STOP, download + run JS!
   └── Continue parsing...
8. CSS Download + Parse → Build CSSOM
9. Render Tree         → DOM + CSSOM = Render Tree
10. Layout             → Calculate positions/sizes
11. Paint              → Fill pixels
12. FCP / LCP          ← First + Largest Contentful Paint

GOAL: Minimize blocking at every step!
```

---

### Step 1: TTFB — Server Response Time

TTFB là **nền tảng** của mọi performance metric. Nếu TTFB cao, mọi thứ sau đó đều bị delay.

```
TTFB Timeline:
  t=0:    Browser sends GET /
  t=50ms: DNS + TCP + TLS (kết nối mới)
  t=200ms: Server starts processing
  t=800ms: Server finishes DB queries, generates HTML
  t=800ms: FIRST BYTE arrives at browser
            ↑ TTFB = 800ms (BAD — target < 800ms)

What causes high TTFB:
  1. Slow server: DB queries, heavy computation
  2. No CDN: Server far from user → high network latency
  3. No caching: Server generates page every request
  4. Redirects: Each redirect adds 1 RTT (100-300ms on mobile)
```

```
Fixes by TTFB cause:
┌────────────────────────────────────────────────────────────┐
│ Cause              │ Fix                                   │
├────────────────────────────────────────────────────────────┤
│ Slow server        │ Optimize DB queries, add caching      │
│ Far from user      │ CDN (Cloudflare, AWS CloudFront)      │
│ No page cache      │ Cache HTML response (Redis, Varnish)  │
│ Unnecessary redirect│ Eliminate or consolidate redirects   │
│ No HTTP/2          │ Enable HTTP/2 (multiplexing!)         │
└────────────────────────────────────────────────────────────┘

Target:
  TTFB < 200ms: Excellent (CDN edge serving)
  TTFB < 800ms: Good (Lighthouse threshold)
  TTFB > 800ms: Needs improvement
```

---

### Step 2: Render-Blocking Resources

```
HTML parser pause points:
┌────────────────────────────────────────────────────────────┐
│ <head>                                                     │
│   <link rel="stylesheet" href="styles.css">               │
│   ← PARSER PAUSES: Download + parse CSS before continuing │
│   ← Every <link stylesheet> blocks rendering!             │
│                                                            │
│   <script src="app.js"></script>                          │
│   ← PARSER PAUSES: Download + execute JS                  │
│   ← JS might use document.write() → must block!           │
│ </head>                                                    │
│ <body>                                                     │
│   ...content user wants to see...                          │
│   ← Cannot render until head is fully processed!          │
└────────────────────────────────────────────────────────────┘
```

```html
<!-- ❌ BEFORE: All blocking -->
<head>
  <link rel="stylesheet" href="all-styles.css">     <!-- BLOCK -->
  <script src="analytics.js"></script>               <!-- BLOCK -->
  <script src="app.js"></script>                     <!-- BLOCK -->
</head>

<!-- ✅ AFTER: Optimized loading -->
<head>
  <!-- Critical CSS: inline → no network request needed! -->
  <style>
    /* Only above-the-fold styles: ~14KB limit -->
    body { font-family: Inter, sans-serif; margin: 0; }
    .hero { height: 100vh; display: flex; ... }
    .nav { ... }
  </style>

  <!-- Full stylesheet: non-blocking with media trick -->
  <link rel="stylesheet" href="full-styles.css"
        media="print" onload="this.media='all'">
  <!-- media="print" = not render-blocking! -->
  <!-- onload: when loaded, switch to media="all" -->
  <noscript><link rel="stylesheet" href="full-styles.css"></noscript>

  <!-- Third-party scripts: async (execute when ready, don't block) -->
  <script async src="analytics.js"></script>

  <!-- App JS: defer (execute after HTML parsed) -->
  <script defer src="app.js"></script>
  <!-- defer: parallel download, execute AFTER HTML parse complete -->
  <!-- → User sees content while JS downloads! -->
</head>
```

```
Script loading comparison:
┌────────────────────────────────────────────────────────────┐
│ Type           │ Download    │ Execute        │ DOM ready? │
├────────────────────────────────────────────────────────────┤
│ <script>       │ Blocks HTML │ Immediately    │ NO         │
│ <script async> │ Parallel    │ When ready     │ Maybe      │
│ <script defer> │ Parallel    │ After parse    │ YES ✅     │
│ <script type=  │ Parallel    │ After parse    │ YES ✅     │
│   "module">    │ (implicit   │ (modules are   │            │
│                │  defer)     │  always defer) │            │
└────────────────────────────────────────────────────────────┘

RULE: Use defer for everything unless you need async order-independence
      async: OK for analytics, third-party (order doesn't matter)
      defer: Best for app scripts (run in order, after DOM ready)
```

---

### Step 3: Resource Hints — Proactive Loading

```html
<!-- Resource hints: giúp browser biết TRƯỚC cần gì -->

<!-- preconnect: Establish connection early (DNS+TCP+TLS) -->
<!-- Use for: CDN origins, API origins, font origins -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://api.myapp.com">
<!-- Saves: 100-500ms per origin on first request! -->

<!-- dns-prefetch: Just DNS lookup (weaker than preconnect) -->
<!-- Use for: Many third-party origins (preconnect has overhead) -->
<link rel="dns-prefetch" href="https://cdn.example.com">

<!-- preload: Fetch critical resources with high priority -->
<!-- Use for: LCP image, critical font, critical JS -->
<link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/hero-image.webp" as="image">
<!-- ↑ "I NEED this immediately — start downloading NOW!" -->
<!-- Browser downloads in parallel with HTML parse -->

<!-- prefetch: Download for NEXT navigation (low priority) -->
<!-- Use for: Likely next page resources -->
<link rel="prefetch" href="/dashboard.js" as="script">
<!-- ↑ "I'll need this LATER — download when idle" -->

<!-- prerender: Render entire next page in background (experimental) -->
<!-- Use for: Very predictable next page (checkout flow) -->
<link rel="prerender" href="/checkout">
```

---

### Step 4: `fetchpriority` — Fine-grained Priority Control

```html
<!-- fetchpriority: Explicitly set resource priority -->
<!-- Giúp browser biết resource nào QUAN TRỌNG NHẤT -->

<!-- LCP image: HIGH priority — download this FIRST! -->
<img src="/hero.webp"
     fetchpriority="high"
     alt="Hero image">
<!-- Mặc định: browser không biết image nào là LCP
     fetchpriority="high": "This is my LCP, prioritize it!"
     → LCP improvement thường 200-500ms! -->

<!-- Below-fold images: LOW priority → không cạnh tranh với LCP -->
<img src="/feature1.webp"
     loading="lazy"
     fetchpriority="low"
     alt="Feature">

<!-- Non-critical JS: LOW priority -->
<script src="non-critical.js" fetchpriority="low" defer></script>

<!-- Critical font preload: HIGH priority -->
<link rel="preload"
      href="/fonts/inter.woff2"
      as="font"
      fetchpriority="high"
      crossorigin>

<!-- ⚠️ ANTI-PATTERN: fetchpriority="high" quá nhiều! -->
<!-- Nếu mọi thứ đều high priority → không có gì là high -->
<!-- Chỉ dùng cho 1-2 resources quan trọng nhất (LCP image) -->
```

---

### Step 5: Document Order — HTML Structure Matters

```html
<!-- Browser parse HTML từ trên xuống dưới
     → Thứ tự trong <head> và <body> ảnh hưởng performance! -->

<!-- ✅ OPTIMAL <head> order -->
<head>
  <!-- 1. Charset + viewport FIRST (no network) -->
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">

  <!-- 2. Title (SEO, tab display) -->
  <title>My App</title>

  <!-- 3. Preconnect to critical origins -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://cdn.myapp.com">

  <!-- 4. Critical CSS (inline or high-priority stylesheet) -->
  <style>/* critical above-fold CSS */</style>

  <!-- 5. Preload critical resources -->
  <link rel="preload" href="/fonts/inter.woff2" as="font" crossorigin>
  <link rel="preload" href="/hero.webp" as="image" fetchpriority="high">

  <!-- 6. Non-critical CSS (non-blocking) -->
  <link rel="stylesheet" href="/styles.css" media="print"
        onload="this.media='all'">

  <!-- 7. Scripts (defer/async) -->
  <script defer src="/app.js"></script>
</head>

<body>
  <!-- Content order: Most important FIRST -->
  <!-- Browser renders top-to-bottom
       → LCP element should appear early in HTML -->

  <!-- ✅ Hero/LCP content early -->
  <header>...</header>
  <main>
    <img src="/hero.webp" fetchpriority="high" alt="Hero">
    <!-- ↑ LCP candidate: early in HTML = browser finds it EARLY -->
  </main>

  <!-- ❌ BAD: LCP image deeply nested, late in HTML -->
  <!-- Browser finds it later → starts downloading later → LCP slower -->

  <!-- Non-critical scripts at body END (legacy pattern) -->
  <!-- Modern: use defer on scripts in <head> instead -->
</body>
```

---

### Step 6: 103 Early Hints — Server-Push Alternative

```
103 Early Hints: HTTP status code gửi TRƯỚC main response
  → Server: "Đang xử lý, nhưng đây là hints cho browser"
  → Browser: "OK, bắt đầu preconnect/preload trong khi chờ!"

Timeline WITHOUT Early Hints:
  Browser →[GET /]→ Server
  Server processes (500ms)...
  Server →[200 + HTML]→ Browser
  Browser: "Oh! Cần fonts từ fonts.google.com!"
  Browser →[connect to fonts.google.com]→ [300ms]
  Total critical path: 500ms + 300ms = 800ms

Timeline WITH Early Hints:
  Browser →[GET /]→ Server
  Server →[103 Early Hints: preconnect fonts.google.com]→ Browser
  Browser: Starts connecting to fonts.google.com (parallel!)
  Server continues processing (500ms)...
  Server →[200 + HTML]→ Browser
  Fonts already connected!
  Total critical path: 500ms (instead of 800ms)
  Saving: 300ms!
```

```nginx
# Nginx config: 103 Early Hints
location / {
    # Send early hints BEFORE processing
    http2_push_preload on;
    add_header Link "</fonts/inter.woff2>; rel=preload; as=font; crossorigin" always;
    # ... process request ...
}

# Or via application code (Node.js/Next.js):
# res.writeEarlyHints({
#   'link': [
#     '</fonts/inter.woff2>; rel=preload; as=font',
#     '<https://api.example.com>; rel=preconnect'
#   ]
# });
```

---

### Step 7: Compression và Minification

```
Text compression — MANDATORY:
  HTML, CSS, JS = text → compressible!

  Without compression: app.js = 500KB
  With gzip:           app.js = 150KB (70% reduction!)
  With Brotli:         app.js = 120KB (76% reduction!) ← Better than gzip

  Enable in Nginx:
    gzip on;
    gzip_types text/html text/css application/javascript;
    brotli on; (requires ngx_brotli module)

  In Vite/webpack: Built-in or plugins
    vite-plugin-compression → auto-generate .gz + .br files

Minification:
  Remove whitespace, comments, shorten variable names
  HTML: 150KB → 90KB
  CSS:  80KB  → 50KB
  JS:   bundler handles automatically (terser, esbuild)
```

---

### HTML Performance Checklist

```
TTFB:
  ☑ TTFB < 800ms (target < 200ms với CDN)
  ☑ CDN deployed (Cloudflare, CloudFront, etc.)
  ☑ Unnecessary redirects eliminated
  ☑ Server-side caching implemented
  ☑ HTTP/2 or HTTP/3 enabled

Render-blocking:
  ☑ Critical CSS inlined (<14KB above-fold)
  ☑ All <script> tags have defer or async
  ☑ No render-blocking CSS for below-fold content
  ☑ type="module" scripts (implicit defer)

Resource hints:
  ☑ preconnect for critical third-party origins
  ☑ preload for LCP image/font
  ☑ fetchpriority="high" on LCP image
  ☑ loading="lazy" on below-fold images

Document structure:
  ☑ charset + viewport in first 1024 bytes
  ☑ LCP element early in HTML (discoverable early)
  ☑ Preconnect before stylesheets
  ☑ Styles before scripts in <head>

Compression:
  ☑ Brotli (or Gzip) enabled on server
  ☑ HTML/CSS/JS minified
  ☑ No unused CSS/JS shipped

Measurement:
  ☑ TTFB checked via PageSpeed Insights (field data)
  ☑ LCP breakdown analyzed (chrome://tracing or CrUX)
  ☑ Render-blocking resources checked (Lighthouse)
```


---

## Deep Dive: Understanding the Critical Path

> **Nguồn:** [web.dev/learn/performance/understanding-the-critical-path](https://web.dev/learn/performance/understanding-the-critical-path) — Google Web.dev
>
> Bài này là **lý thuyết nền tảng** — giải thích tại sao các kỹ thuật trong bài trước (defer, preload, inline CSS...) lại có tác dụng. Hiểu Critical Rendering Path giúp debug performance issues một cách hệ thống thay vì mò mẫm. **Đây là kiến thức bắt buộc cho senior frontend developers.**

### Critical Rendering Path — Toàn cảnh (Deep Dive)

```
Browser pipeline chi tiết:

1. Nhận HTML bytes từ server
   ↓
2. HTML Parser: Bytes → Tokens → Nodes → DOM Tree
   ├── Gặp <link stylesheet>? → Download CSS (block render!)
   ├── Gặp <script>?         → Download + Execute JS (block parser!)
   ├── Gặp <img>?            → Download (không block parse)
   └── Continue parsing...
   ↓
3. CSS Parser (khi CSS downloaded): Bytes → CSSOM Tree
   CSSOM = tất cả CSS rules đã được resolved
   NOTE: Browser không thể render BẤT KỲ content nào
         cho đến khi CSSOM được built HOÀN TOÀN!
   ↓
4. Render Tree = DOM + CSSOM
   Chỉ chứa visible elements (không có <head>, display:none, ...)
   ↓
5. Layout (Reflow): Tính toán position + size của mọi element
   ↓
6. Paint: Tô màu pixels
   ↓
7. Composite: Ghép layers (GPU)
   ↓
FCP: First Contentful Paint ← User thấy content lần đầu!
```

---

### CSS là Render-Blocking — Tại sao?

```
Lý do CSS phải block render:
  Nếu browser render trước khi CSS downloaded:
  → User thấy "Flash of Unstyled Content" (FOUC)
  → Text không có font, layout sai, không có màu
  → Cực kỳ bad UX!

  Do đó: Browser MUST wait for CSS before rendering
  → CSS = ALWAYS render-blocking (cho đến khi downloaded + parsed)

Ví dụ waterfall với render-blocking CSS:
┌────────────────────────────────────────────────────────────┐
│ t=0:   Browser sends GET /                                │
│ t=100: HTML starts arriving (TTFB = 100ms)                │
│ t=150: Parser finds <link rel="stylesheet" href="a.css">  │
│ t=150: Start downloading a.css (100KB)                    │
│ t=150: HTML parsing CONTINUES but render BLOCKED          │
│ t=350: a.css fully downloaded + parsed                    │
│ t=350: CSSOM built → Render Tree → FCP!                   │
│                                                            │
│ Timeline: HTML(0-250ms) + CSS download(150-350ms)         │
│ FCP at 350ms (CSS was on critical path 200ms)             │
└────────────────────────────────────────────────────────────┘

Optimization goal: Shorten or eliminate time CSS blocks render
  → Inline critical CSS (no download needed!)
  → Reduce CSS file size (faster download)
  → Split CSS: only load what's needed for current page
```

---

### JavaScript là Parser-Blocking — Tại sao?

```
JavaScript blocks HTML parser vì:
  JS có thể dùng document.write() → chèn content vào DOM
  JS có thể modify DOM (appendChild, removeChild...)
  JS có thể modify CSSOM (element.style.color = 'red')

  Do đó: Browser phải STOP parsing HTML khi gặp <script>
  → Download + Execute JS xong → Tiếp tục parse HTML

WORST CASE: CSS + JS blocks combined
  <link rel="stylesheet" href="styles.css">  → Block render
  <script src="app.js"></script>             → Block parser

  Timeline:
  HTML parse → encounter CSS → download CSS (200ms)
  Meanwhile: encounter JS → try to download JS
  BUT: JS execution might read CSSOM!
  → Browser must wait for CSS to be parsed BEFORE executing JS!
  → CSS blocks JS execution → JS blocks HTML parsing!
  → CSS → JS → HTML parse TRIPLE BLOCK!

┌────────────────────────────────────────────────────────────┐
│ t=0:    HTML starts parsing                               │
│ t=50:   <link stylesheet> → download CSS (200ms)         │
│ t=60:   <script> → waiting for CSS first...              │
│ t=250:  CSS done → execute JS (100ms)                    │
│ t=350:  JS done → resume HTML parsing                    │
│ t=400:  HTML fully parsed → Render Tree → FCP!           │
│                                                            │
│ vs OPTIMAL:                                               │
│ t=50:   Inline critical CSS → no download                │
│ t=50:   <script defer> → download in parallel            │
│ t=100:  HTML fully parsed                                │
│ t=100:  Render Tree built → FCP! (300ms faster!)         │
│ t=150:  JS executes (after DOMContentLoaded)             │
└────────────────────────────────────────────────────────────┘
```

---

### Preload Scanner — Browser's Lookahead Mechanism

```
Problem: Parser blocked by JS → không thể discover CSS, images, fonts
Solution: Browsers có "Preload Scanner" (secondary lookahead parser)

Preload Scanner:
  Chạy PARALLEL với main HTML parser
  Scan ahead trong HTML → tìm resources cần download
  KHÔNG execute JS, KHÔNG modify DOM
  Chỉ DISCOVER và START downloading resources

Timeline WITH preload scanner:
┌────────────────────────────────────────────────────────────┐
│ Main Parser: Parsing... → BLOCKED by <script src="app.js">│
│                                                            │
│ Preload Scanner (parallel): Scanning ahead...             │
│   Found: <link href="styles.css"> → Start download!       │
│   Found: <img src="hero.webp"> → Start download!         │
│   Found: <link href="font.woff2"> → Start download!      │
│                                                            │
│ Result: CSS, images, fonts all downloading IN PARALLEL    │
│         even though main parser is blocked!               │
└────────────────────────────────────────────────────────────┘

⚠️ DEFEATING the Preload Scanner (common mistakes):
  CSS background-image: url('./hero.jpg')
  → Preload scanner CANNOT see CSS background images
  → Image only discovered AFTER CSS is parsed
  → Solution: Use <img> for LCP images, or <link rel="preload">

  document.createElement('script')
  → Dynamically created scripts are invisible to preload scanner
  → Solution: <link rel="preload" as="script">

  @import url('fonts.css') in CSS files
  → Discovered only after CSS file is downloaded and parsed
  → Solution: <link rel="stylesheet"> directly in HTML

GOLDEN RULE: Resources in HTML = discoverable by preload scanner
             Resources in CSS/JS = NOT discoverable until file parsed
```

---

### Visualizing: Critical Resources, Bytes, Round Trips

```
3 dimensions của Critical Path:

1. CRITICAL RESOURCES:
   Resources mà browser phải fetch để render initial view
   Each resource = at least 1 round trip (1 RTT)
   
   Goal: Minimize number of critical resources
   
   NOT critical: Images (không block render)
   NOT critical: Fonts (không block parse, FOUT acceptable)
   NOT critical: <script defer> (không block parse)
   CRITICAL: <link stylesheet> in <head>
   CRITICAL: <script> (no defer/async) in <head>

2. CRITICAL BYTES:
   Tổng số bytes cần download trước first render
   
   Goal: Minimize bytes on critical path
   
   Techniques:
   - Inline critical CSS (0 bytes network, faster parse)
   - Minify CSS/JS (fewer bytes = faster download)
   - Tree-shake (remove unused code)
   - Split: only load critical bundle for current page

3. CRITICAL ROUND TRIPS (RTTs):
   RTT (Round Trip Time) = thời gian packet đi từ client → server → client
   
   Typical RTT:
   Same country: 20-50ms
   Across continents: 100-200ms
   Mobile (3G): 300-500ms!
   
   First 14KB TCP Slow Start:
   → Browser gửi request → Server có thể gửi 10 TCP segments (~14KB) đầu tiên
   → Sau đó slow start: tăng dần window size
   → TIP: Critical CSS < 14KB = có thể arrive trong RTT đầu tiên!

   Goal: Minimize RTTs on critical path
   
   Techniques:
   - Inline critical CSS: 0 extra RTTs!
   - Preconnect: reduce RTTs for third-party origins
   - HTTP/2: multiple requests over 1 connection
   - CDN: reduce RTT per request (server closer to user)
```

---

### Critical Path Waterfall — Reading DevTools

```
Chrome DevTools Network tab — Read waterfall:

Timeline:
  ├── Dark gray = Queued (waiting for connection)
  ├── Light gray = Stalled/Connecting (DNS, TCP, TLS)
  ├── Green = TTFB (waiting for server response)
  └── Blue = Content Download

Rendering indicators:
  ┤ Blue DOMContentLoaded line → HTML parsed, deferred JS ran
  ┤ Red Load line → all resources loaded

Identifying critical path issues:
  1. Long green bar on HTML → High TTFB
  2. CSS file starting AFTER JS → JS was parser-blocking CSS discovery
  3. Sequential waterfall (each waits for previous) → chaining issue
  4. Large blocking time before FCP → render-blocking resources

Ideal waterfall:
  HTML ─────────────────►
  CSS    ──────────────────────────────────────► (parallel start)
  JS     ──────────────────────────────────────► (parallel start)
  Fonts  ──────────────────────────────────────► (parallel start)
  Images ──────────────────────────────────────► (parallel start)
  FCP here ────────────────────────────────────►|

Bad waterfall (sequential, blocking):
  HTML ─────────────────►
                          CSS ──────────────────►
                                                 JS ─────────────►
                                                                   FCP!
```

---

### Practical: Applying Critical Path Knowledge

```typescript
// How to think about Critical Path in a React/Next.js app:

// 1. What's on the critical path for my page?
// Answer: Everything needed before FCP

// Critical:
// - HTML document itself
// - CSS loaded with <link> in <head>
// - JS with no defer/async that might CSSOM-query

// NOT critical (can be deferred):
// - React bundle (defer it → inline SSR HTML appears first)
// - Images (lazy load below-fold)
// - Fonts (FOIT/FOUT acceptable, use font-display: swap)
// - Analytics scripts (async)

// 2. Next.js Critical Path optimization
// next.config.js:
const nextConfig = {
  // These affect critical path:
  experimental: {
    optimizeCss: true,      // Inline critical CSS automatically
    optimizePackageImports: ['@mui/icons-material'], // Tree-shake
  }
};

// 3. Manually identify critical CSS (for non-Next.js apps)
// Tools: critical (npm package), PurgeCSS, penthouse
// Manual: DevTools Coverage tab → which CSS is used on first paint?

// 4. Use Performance tab to see critical path
// Performance tab → record page load
// Look for: When does "FCP" marker appear?
// Look back: What resources loaded BEFORE FCP?
// Those are your critical path resources!
```

---

### Critical Path Optimization — Decision Framework

```
Khi gặp performance issue, ask:

Q1: "Is this resource on the critical path?"
  YES → Optimize to make it faster (inline, preload, reduce size)
  NO  → Defer/lazy load (move it OFF the critical path!)

Q2: "Is this resource render-blocking?"
  CSS without media query? → YES, render-blocking
  <script> without defer/async? → YES, parser-blocking
  <script defer>? → NO, not blocking
  <img>? → NO (but affects LCP if large!)

Q3: "Can I reduce the size of critical resources?"
  Critical CSS:  Inline only above-fold styles (~14KB)
  Critical JS:   Code-split aggressively, defer non-critical
  HTML:          Server-render critical content, hydrate later

Q4: "Can I reduce RTTs on critical path?"
  preconnect for third-party origins
  CDN for faster TTFB
  HTTP/2 for multiplexing
  103 Early Hints for parallel resource discovery

Mental Model Summary:
┌────────────────────────────────────────────────────────────┐
│ Critical Path = Chain of dependencies before first render  │
│                                                            │
│ ELIMINATE from critical path:                             │
│   defer all JS → no parser-blocking                       │
│   async analytics → not critical                          │
│   lazy-load images → not render-blocking                  │
│                                                            │
│ SHORTEN critical path resources:                          │
│   Inline critical CSS → 0 RTT                            │
│   Preconnect CDN → -1 RTT per origin                     │
│   CDN for HTML → lower TTFB                              │
│                                                            │
│ PARALLELIZE:                                              │
│   preload important resources → parallel download         │
│   HTTP/2 multiplexing → no head-of-line blocking          │
│   103 Early Hints → parallel during server think time     │
└────────────────────────────────────────────────────────────┘
```


---

## Deep Dive: Optimize Resource Loading

> **Nguồn:** [web.dev/learn/performance/optimize-resource-loading](https://web.dev/learn/performance/optimize-resource-loading) — Google Web.dev
>
> Bài này dạy cách **kiểm soát thứ tự và ưu tiên tải resources** — thay vì để browser tự quyết định. Browser có heuristics tốt nhưng không hoàn hảo: nó không biết resource nào là LCP image, không biết font nào là critical. Bài này cho bạn công cụ để "nói chuyện" với browser.

### Vấn đề: Bandwidth Contention

```
Browser có bandwidth giới hạn:
  Tất cả resources cùng cạnh tranh bandwidth
  
  Example: Page load với nhiều resources
  ┌────────────────────────────────────────────────────────┐
  │ HTML         ──────►                                   │
  │ styles.css   ──────────────────►                       │
  │ app.js       ──────────────────────────────────────►   │
  │ analytics.js ──────────────────────────────────────►   │  ← Cạnh tranh
  │ chatbot.js   ──────────────────────────────────────►   │  ← bandwidth
  │ hero.webp    ─────────────────────────────────────────►│  ← với LCP!
  │ logo.png     ──────────────────────────────────────►   │
  │                                                        │
  │ hero.webp (LCP image) phải đợi JS, analytics,        │
  │ chatbot download xong mới có bandwidth để download!   │
  │ → LCP bị delay bởi non-critical resources!            │
  └────────────────────────────────────────────────────────┘
```

---

### Tool 1: `fetchpriority` — Explicit Priority Control

```html
<!-- LCP image: Boost priority → downloads first! -->
<img
  src="/hero.webp"
  alt="Hero"
  fetchpriority="high"
  width="1200" height="600"
>
<!--
  Default browser: image = Medium priority
  With fetchpriority="high": Very High priority
  → Browser downloads hero BEFORE other Medium/Low resources
  → LCP improvement: typically 200-500ms!
-->

<!-- Below-fold images: Lower priority -->
<img
  src="/feature.webp"
  alt="Feature"
  loading="lazy"
  fetchpriority="low"
>
<!-- low priority = doesn't compete with hero/CSS for bandwidth -->

<!-- Preloaded LCP image: ALSO needs fetchpriority -->
<link
  rel="preload"
  href="/hero.webp"
  as="image"
  fetchpriority="high"
>
<!-- Without fetchpriority="high", preloaded images may still
     be medium priority! Always add both. -->

<!-- Non-critical script: deprioritize -->
<script src="analytics.js" fetchpriority="low" defer></script>
<script src="chatbot.js" fetchpriority="low" defer></script>
<!-- → analytics/chatbot download với low priority
     → không cạnh tranh bandwidth với LCP image! -->
```

```
fetchpriority values:
┌────────────────────────────────────────────────────────────┐
│ Value  │ Browser Priority │ When to use                   │
├────────────────────────────────────────────────────────────┤
│ high   │ Very High/High   │ LCP image, critical font,     │
│        │                  │ above-fold content            │
│ auto   │ Default          │ Let browser decide (default)  │
│ low    │ Low              │ Below-fold, non-critical,     │
│        │                  │ analytics, third-party        │
└────────────────────────────────────────────────────────────┘

⚠️ ANTI-PATTERN: fetchpriority="high" trên nhiều thứ
  <img fetchpriority="high"> ← LCP image (OK)
  <img fetchpriority="high"> ← Feature image (WRONG!)
  <img fetchpriority="high"> ← Card images (WRONG!)
  → Nếu mọi thứ là "high" → không có gì thực sự là high
  → Rule: Chỉ 1-2 resources có fetchpriority="high" per page!
```

---

### Tool 2: `preload` — Force Early Discovery

```html
<!-- preload: Nói với browser "tôi sẽ cần resource này SỚM"
     Browser discover và download ngay, dù chưa gặp trong parse -->

<!-- Critical font: phải có crossorigin! -->
<link
  rel="preload"
  href="/fonts/inter-variable.woff2"
  as="font"
  type="font/woff2"
  crossorigin
  fetchpriority="high"
>
<!--
  Tại sao crossorigin BẮT BUỘC với fonts?
  Fonts fetched qua CORS (ngay cả same-origin)
  Thiếu crossorigin → browser fetch TWICE!
  (1 lần từ preload, 1 lần từ @font-face)
  → Waste bandwidth, slower!
-->

<!-- LCP image discoverable via CSS background (không visible to preload scanner) -->
<!-- CSS: .hero { background-image: url('/hero.webp'); } -->
<!-- Solution: preload it explicitly! -->
<link
  rel="preload"
  href="/hero.webp"
  as="image"
  fetchpriority="high"
>

<!-- Critical JS module -->
<link rel="modulepreload" href="/src/main.js">
<!-- modulepreload: download + parse + compile JS module
     vs preload as="script": chỉ download
     → modulepreload tốt hơn cho ES modules! -->
```

```
preload as values — PHẢI khai báo đúng!
  as="font"     → font resource
  as="image"    → image resource  
  as="script"   → JS file
  as="style"    → CSS file
  as="fetch"    → JSON/XHR (cần crossorigin nếu cross-origin)
  as="document" → iframe resource

Sai as= → browser ignores preload hint!
Thiếu as= → browser fetches without priority → defeats purpose!
```

---

### Tool 3: `preconnect` — Warm Up Connections

```html
<!-- preconnect: Thực hiện DNS + TCP + TLS trước khi browser
     cần gửi request. Saves: 100-500ms per connection! -->

<!-- Third-party fonts -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<!-- crossorigin: fonts.gstatic.com serves fonts via CORS -->

<!-- CDN cho assets -->
<link rel="preconnect" href="https://cdn.myapp.com">

<!-- API endpoint -->
<link rel="preconnect" href="https://api.myapp.com">

<!-- ⚠️ Không preconnect quá nhiều! Mỗi connection = CPU + memory -->
<!-- Rule: Chỉ preconnect tới origins cần trong 5s đầu tiên -->
<!-- Max: 5-6 preconnects là đủ -->
```

```
preconnect vs dns-prefetch:
┌────────────────────────────────────────────────────────────┐
│ preconnect:                                               │
│   DNS + TCP + TLS → "Full connection warmup"              │
│   Cost: More CPU/memory                                   │
│   Savings: Full RTT time (100-500ms)                      │
│   Use for: Origins bạn CHẮC CHẮN sẽ request soon         │
│                                                            │
│ dns-prefetch:                                             │
│   DNS only → "Just DNS lookup"                           │
│   Cost: Minimal                                           │
│   Savings: DNS lookup time (20-120ms)                     │
│   Use for: Origins bạn MAYBE sẽ request, nhiều origins   │
└────────────────────────────────────────────────────────────┘

Best practice:
  Critical third-party (fonts, CDN) → preconnect
  Many analytics/tracking origins → dns-prefetch
  
<!-- Fonts example: preconnect + dns-prefetch fallback -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="dns-prefetch" href="https://fonts.googleapis.com">
<!-- dns-prefetch as fallback for browsers không support preconnect -->
```

---

### Tool 4: `prefetch` — Prepare for Future Navigation

```html
<!-- prefetch: Download resource với LOW priority cho NEXT PAGE -->
<!-- Khác preload: preload = current page, prefetch = next page -->

<!-- User likely to go to /checkout next -->
<link rel="prefetch" href="/checkout.js" as="script">
<link rel="prefetch" href="/checkout.css" as="style">

<!-- Product detail page (user hover on product card) -->
```

```typescript
// Dynamic prefetch on hover — sophisticated pattern
function ProductCard({ product }: { product: Product }) {
  const prefetchTimeout = useRef<ReturnType<typeof setTimeout>>();

  const handleMouseEnter = () => {
    // Wait 100ms (user might just be passing mouse over)
    prefetchTimeout.current = setTimeout(() => {
      // Prefetch product detail page resources
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = `/products/${product.id}/bundle.js`;
      link.as = 'script';
      document.head.appendChild(link);
    }, 100);
  };

  const handleMouseLeave = () => {
    clearTimeout(prefetchTimeout.current);
  };

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      ...
    </div>
  );
}

// Next.js: Built-in prefetching!
// <Link href="/checkout"> prefetches /checkout trong viewport
// → No manual prefetch needed for routing!
```

---

### Tool 5: `loading="lazy"` — Defer Off-Screen Resources

```html
<!-- Images: Lazy load để tiết kiệm bandwidth cho LCP -->

<!-- ❌ BAD: All images load immediately (compete with LCP!) -->
<img src="/product1.webp" alt="Product 1">
<img src="/product2.webp" alt="Product 2">
<!-- These might be below fold! Wasting bandwidth! -->

<!-- ✅ GOOD: Lazy load below-fold images -->
<img src="/hero.webp" alt="Hero" fetchpriority="high">  ← Above fold, eager
<img src="/product1.webp" alt="Product 1" loading="lazy">  ← Below fold
<img src="/product2.webp" alt="Product 2" loading="lazy">  ← Below fold

<!-- Iframes: Always lazy load! -->
<iframe
  src="https://www.youtube.com/embed/..."
  loading="lazy"
  title="Video"
>
</iframe>

<!-- ⚠️ NEVER lazy load above-fold content!
  <img src="/hero.webp" loading="lazy"> ← BAD!
  → LCP image won't start downloading until JS evaluates lazy loading
  → LCP significantly worse!
  → ONLY lazy load images that are BELOW the fold! -->
```

---

### Tool 6: `decoding="async"` — Non-blocking Image Decode

```html
<!-- Image decoding có thể block rendering -->
<!-- decoding="async": decode trong background thread -->

<img
  src="/large-image.webp"
  alt="Large image"
  decoding="async"
  loading="lazy"
>

<!--
  sync (default): Browser decode image, block rendering until done
  async: Browser decode in background, không block rendering
  auto: Browser decides
  
  When to use:
  - Large images below fold: async (non-blocking decode)
  - LCP image: sync hoặc auto (want it ASAP, blocking is OK)
  - Animated images: sync (để tránh flicker)
-->
```

---

### LCP Optimization — Putting It All Together

```html
<!-- Complete LCP optimization setup -->
<head>
  <!-- 1. Preconnect to image CDN -->
  <link rel="preconnect" href="https://images.cdn.com">

  <!-- 2. Preload LCP image with high priority -->
  <link
    rel="preload"
    href="https://images.cdn.com/hero.webp"
    as="image"
    imagesrcset="hero-400.webp 400w, hero-800.webp 800w, hero-1600.webp 1600w"
    imagesizes="100vw"
    fetchpriority="high"
  >

  <!-- 3. Deprioritize non-critical scripts -->
  <script src="analytics.js" defer fetchpriority="low"></script>
</head>

<body>
  <!-- 4. LCP image: fetchpriority="high", NO lazy loading! -->
  <img
    src="https://images.cdn.com/hero-800.webp"
    srcset="hero-400.webp 400w, hero-800.webp 800w, hero-1600.webp 1600w"
    sizes="100vw"
    alt="Hero"
    fetchpriority="high"
    width="1600"
    height="800"
  >
  <!-- width/height: Prevents CLS (layout shift) while loading -->

  <!-- 5. Below-fold: lazy + low priority -->
  <img src="feature.webp" loading="lazy" fetchpriority="low" alt="Feature">
</body>
```

```
LCP Sub-parts và Optimization:

LCP = Load Delay + Load Duration + Element Render Delay

LOAD DELAY (time before browser starts requesting LCP resource):
  Cause: LCP resource không discoverable early
  Fix: preload, put <img> in static HTML (not JS-injected)
  Fix: preconnect to image CDN
  Fix: fetchpriority="high"

LOAD DURATION (time to download LCP resource):
  Cause: Resource too large, slow server
  Fix: Optimize image (WebP, AVIF, compression)
  Fix: CDN (closer server)
  Fix: fetchpriority="high" (more bandwidth)

ELEMENT RENDER DELAY (time between download and actual render):
  Cause: JS blocking, CSS blocking, large DOM
  Fix: defer/async JS, inline critical CSS
  Fix: Reduce DOM size
```

---

### Summary: Resource Loading Priority Matrix

```
Decision matrix — cần dùng gì?
┌────────────────────────────────────────────────────────────────┐
│ Resource Type      │ Hints                  │ Attributes       │
├────────────────────────────────────────────────────────────────┤
│ LCP image          │ preload + preconnect   │ fetchpriority=high│
│ Critical font      │ preload                │ crossorigin (req!)│
│ Below-fold images  │ -                      │ loading=lazy      │
│                    │                        │ fetchpriority=low │
│ Analytics scripts  │ -                      │ async/defer       │
│                    │                        │ fetchpriority=low │
│ Next-page resources│ prefetch               │ -                 │
│ API CDN            │ preconnect             │ -                 │
│ Many 3rd parties   │ dns-prefetch           │ -                 │
│ JS modules         │ modulepreload          │ -                 │
│ Iframes            │ -                      │ loading=lazy      │
└────────────────────────────────────────────────────────────────┘

Anti-patterns:
  ❌ preload quá nhiều resources → bandwidth contention
  ❌ fetchpriority="high" trên nhiều hơn 1-2 images
  ❌ loading="lazy" trên LCP image → kills LCP!
  ❌ preload font thiếu crossorigin → double fetch!
  ❌ prefetch cho critical resources → too low priority
  ❌ preconnect > 6 origins → wasted connections

DevTools verification:
  Network tab → Sort by Priority column
  LCP image should be: Highest priority
  Analytics/chatbot: Low priority
  If LCP image = Medium → add fetchpriority="high"!
```


---

## Deep Dive: Resource Hints — preconnect, prefetch, và Speculation Rules API

> **Nguồn:** [web.dev/learn/performance/resource-hints](https://web.dev/learn/performance/resource-hints) — Google Web.dev
>
> Bài trước cover `preload` và `fetchpriority` cho current page. Bài này focus vào **future navigations** — làm sao để page tiếp theo cảm giác instant. Đây là nơi **Speculation Rules API** được giới thiệu — một Web API mới (2023-2024) có thể prerender toàn bộ trang kế trong background.

### Resource Hints Overview — Map Toàn cảnh

```
Resource Hints phân theo timing:
┌────────────────────────────────────────────────────────────┐
│ CURRENT PAGE resources:                                    │
│   preload        → Download critical resource NOW          │
│   modulepreload  → Download + compile JS module NOW        │
│   fetchpriority  → Adjust priority (không download extra)  │
│                                                            │
│ FUTURE PAGE connections:                                   │
│   preconnect     → DNS + TCP + TLS early (before request)  │
│   dns-prefetch   → DNS only early (lighter than preconnect)│
│                                                            │
│ FUTURE PAGE resources:                                     │
│   prefetch       → Download future page document/resource  │
│   prerender      → Render entire future page (heavy!)      │
│   ← OLD: <link rel="prefetch/prerender">                  │
│   ← NEW: <script type="speculationrules"> ← Better!       │
└────────────────────────────────────────────────────────────┘
```

---

### `preconnect` — Warm Up Connections Trước khi Cần

```
DNS + TCP + TLS = kết nối đến origin mới:
  DNS lookup:    20-120ms
  TCP handshake: 1 RTT = 50-300ms
  TLS negotiate: 1-2 RTT = 50-600ms
  Total first connection: 100-1000ms before first byte!

preconnect: Thực hiện tất cả TRƯỚC khi cần!

Without preconnect:
  User clicks link → browser starts DNS → TCP → TLS → request
  Total wait: 500ms just for connection setup!

With preconnect:
  Page load → preconnect to api.myapp.com (background)
  User clicks link → connection already warmed → request immediately!
  Savings: 500ms connection setup time!
```

```html
<!-- Preconnect cho critical third-party origins -->

<!-- Fonts: preconnect BOTH domains! -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<!--
  fonts.googleapis.com: CSS file (no CORS)
  fonts.gstatic.com: actual font files (CORS → need crossorigin!)
  Thiếu domain thứ 2 → font download sẽ cần new connection!
-->

<!-- API: data needed right after page load -->
<link rel="preconnect" href="https://api.myapp.com">

<!-- Image CDN: LCP image may come from here -->
<link rel="preconnect" href="https://images.cdn.myapp.com">

<!-- ⚠️ Max 5-6 preconnects! -->
<!-- Each idle preconnect wastes: CPU, memory, bandwidth -->
<!-- Unused connections timeout after ~10s -->
```

```
preconnect vs dns-prefetch:
┌────────────────────────────────────────────────────────────┐
│ preconnect:                                               │
│   DNS + TCP + TLS (~300ms on mobile)                     │
│   Connection held open (costs resources!)                 │
│   Use for: Origins you're CERTAIN to use in 5-10s        │
│   Limit: 5-6 origins max                                 │
│                                                            │
│ dns-prefetch:                                             │
│   DNS only (~50ms)                                       │
│   Minimal resource cost                                   │
│   Use for: Origins you might use, unsure timing          │
│   Limit: Can use more freely (10-15 origins OK)          │
│                                                            │
│ Pattern: preconnect (primary) + dns-prefetch (fallback)  │
│   <link rel="preconnect" href="https://fonts.google.com">│
│   <link rel="dns-prefetch" href="https://fonts.google.com│
│   → dns-prefetch for browsers that don't support preconn │
└────────────────────────────────────────────────────────────┘
```

---

### `prefetch` — Download Tài nguyên cho Trang Kế

```html
<!-- prefetch: Download document/resource cho navigation sắp tới -->
<!-- Low priority, runs in idle time -->

<!-- User đang xem /products/list → likely next: /products/:id -->
<link rel="prefetch" href="/products/123">
<!-- Browser downloads /products/123 HTML khi browser rảnh -->
<!-- Khi user navigate → HTML đã cached → instant! -->

<!-- Prefetch JS chunk cho next route -->
<link rel="prefetch" href="/chunks/checkout.js" as="script">

<!-- Prefetch image gallery (user likely to scroll/view) -->
<link rel="prefetch" href="/images/product-gallery.webp" as="image">
```

```typescript
// Dynamic prefetch — Next.js built-in
// <Link> component tự động prefetch khi link trong viewport!

import Link from 'next/link';

function Navigation() {
  return (
    <nav>
      {/* Next.js prefetches /dashboard khi link visible */}
      <Link href="/dashboard">Dashboard</Link>

      {/* Disable prefetch nếu không muốn -->
      <Link href="/heavy-page" prefetch={false}>Heavy Page</Link>
    </nav>
  );
}

// Manual prefetch trong React (SPA)
function usePrefetch(href: string) {
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    link.as = 'document';
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, [href]);
}

// Usage: Prefetch checkout when user adds to cart
function AddToCartButton() {
  const [added, setAdded] = useState(false);

  const handleClick = () => {
    setAdded(true);
    // User just added to cart → likely going to checkout!
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = '/checkout';
    document.head.appendChild(link);
  };

  return <button onClick={handleClick}>Add to Cart</button>;
}
```

---

### Speculation Rules API — The Modern Approach (2024+)

**Speculation Rules API** là cách mới tốt hơn `<link rel="prefetch/prerender">` — declarative, JSON-based, với fine-grained control về eagerness và conditions.

```html
<!-- Speculation Rules: JSON config trong <script> tag -->
<script type="speculationrules">
{
  "prefetch": [
    {
      "source": "list",
      "urls": ["/about", "/contact", "/pricing"],
      "eagerness": "moderate"
    }
  ],
  "prerender": [
    {
      "source": "document",
      "where": {
        "href_matches": "/products/*"
      },
      "eagerness": "moderate"
    }
  ]
}
</script>
```

```
Eagerness levels:
┌────────────────────────────────────────────────────────────┐
│ immediate:   Start speculating when rules are loaded       │
│              → Right when page loads                       │
│              Good for: Near-certain next pages             │
│              Warning: Uses most resources!                 │
│                                                            │
│ moderate:    Start when user hovers over link (~200ms)     │
│              → Browser heuristic: hover = likely click     │
│              RECOMMENDED: Good balance efficiency/accuracy │
│                                                            │
│ conservative:Start when user mousedown on link             │
│              → Very high confidence (user is clicking)     │
│              Good for: Pages with side effects             │
└────────────────────────────────────────────────────────────┘
```

```html
<!-- Pattern 1: Prefetch all same-origin links on hover -->
<script type="speculationrules">
{
  "prefetch": [
    {
      "source": "document",
      "where": {
        "and": [
          { "href_matches": "/*" },
          { "not": { "href_matches": "/logout" } },
          { "not": { "href_matches": "/api/*" } }
        ]
      },
      "eagerness": "moderate"
    }
  ]
}
</script>
<!-- → Tất cả internal links được prefetch khi hover -->
<!-- → Navigations feel much faster! -->
<!-- → Excludes /logout, /api/* (side effects!) -->

<!-- Pattern 2: Prerender specific high-confidence pages -->
<script type="speculationrules">
{
  "prerender": [
    {
      "source": "list",
      "urls": ["/checkout"],
      "eagerness": "moderate"
    }
  ],
  "prefetch": [
    {
      "source": "document",
      "where": { "href_matches": "/products/*" },
      "eagerness": "conservative"
    }
  ]
}
</script>
<!-- prerender /checkout (user likely heading there after cart)  -->
<!-- prefetch product pages (many options, user browses)        -->
```

```javascript
// Programmatic Speculation Rules (via JavaScript)
if ('speculationrules' in HTMLScriptElement.prototype) {
  const script = document.createElement('script');
  script.type = 'speculationrules';
  script.text = JSON.stringify({
    prerender: [
      {
        source: 'list',
        urls: ['/checkout'],
        eagerness: 'immediate'
      }
    ]
  });
  document.head.appendChild(script);
}

// Check browser support:
const isSupported = HTMLScriptElement.supports?.('speculationrules');
// Chrome 109+ supports Speculation Rules API
// Safari/Firefox: Not yet (use <link rel="prefetch"> as fallback)
```

---

### `prerender` — Render Toàn Bộ Trang Kế

```
prerender vs prefetch:
┌────────────────────────────────────────────────────────────┐
│ prefetch:                                                 │
│   Downloads HTML document only                            │
│   Stores in cache for faster load                         │
│   Still needs: parse HTML, CSS, JS on navigation          │
│   Speed: ~50-70% faster navigation                        │
│   Cost: Low (just HTML download)                          │
│                                                            │
│ prerender:                                                │
│   Downloads ALL resources (HTML + CSS + JS + images)      │
│   Executes JavaScript                                      │
│   Renders page in HIDDEN background tab                   │
│   Navigation = just show the already-rendered tab!        │
│   Speed: ~95-100% faster (feels INSTANT!)                 │
│   Cost: HIGH (full page render = CPU + memory)            │
└────────────────────────────────────────────────────────────┘

When to use prerender:
  ✅ Very high confidence user will navigate there
  ✅ Page doesn't have side effects (no POST on load)
  ✅ Page is same-origin (cross-origin prerender = restricted)
  ✅ Content is similar for different users (not personalized)
  
  ❌ /logout, /delete, /checkout-complete (side effects!)
  ❌ Cross-origin pages (restricted for privacy)
  ❌ Pages with auto-play video/audio (jarring!)
  ❌ Pages that generate analytics events on load (double-count!)
```

```javascript
// Browser limits for Speculation Rules:
// Chrome limits:
//   prefetch: Up to 50 concurrent (immediate), 2 (moderate/conservative)
//   prerender: 10 concurrent (immediate), 2 (moderate), 1 (conservative)
// → Conservative eagerness = less resource waste, still fast!

// Detecting if page was prerendered:
document.addEventListener('prerenderingchange', () => {
  // Page was prerendered, now being activated (user navigated here)
  // Good for: Starting analytics, activating timers, etc.
  analytics.track('page_view', { prerendered: true });
});

// Check if currently prerendering:
if (document.prerendering) {
  // Don't auto-play video, don't start timers, etc.
  console.log('Being prerendered, holding off on side effects');
}
```

---

### React/Next.js Integration

```typescript
// Next.js: Speculation Rules via custom _document.tsx
// app/layout.tsx (App Router):

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Speculation Rules for common navigations */}
        <script
          type="speculationrules"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              prefetch: [
                {
                  source: 'document',
                  where: {
                    and: [
                      { href_matches: '/*' },
                      { not: { href_matches: '/api/*' } }
                    ]
                  },
                  eagerness: 'moderate'
                }
              ]
            })
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

// Note: Next.js already does prefetch via <Link> component
// Speculation Rules = ADDITIONAL optimization for non-Next navigation
// or for apps using React Router instead of Next.js

// React Router: Manual Speculation Rules
function App() {
  useEffect(() => {
    // Add speculation rules after mount
    if (HTMLScriptElement.supports?.('speculationrules')) {
      const script = document.createElement('script');
      script.type = 'speculationrules';
      script.textContent = JSON.stringify({
        prerender: [{
          source: 'document',
          where: { href_matches: '/checkout' },
          eagerness: 'moderate'
        }]
      });
      document.head.appendChild(script);
    }
  }, []);

  return <RouterProvider router={router} />;
}
```

---

### Summary: Resource Hints Decision Guide

```
Use case → Hint:
┌────────────────────────────────────────────────────────────────┐
│ Need early connection to third-party    → preconnect          │
│ Many third-parties, lower certainty     → dns-prefetch        │
│                                                                │
│ Critical resource needed NOW            → preload             │
│ JS module needed NOW                    → modulepreload        │
│                                                                │
│ User MIGHT navigate to next page        → prefetch            │
│ (Modern approach)                       → speculationrules     │
│                                           prefetch + moderate  │
│                                                                │
│ User WILL navigate (high confidence)    → prerender           │
│ (Modern approach)                       → speculationrules     │
│                                           prerender + moderate │
│                                                                │
│ Adjust resource priority                → fetchpriority       │
└────────────────────────────────────────────────────────────────┘

Speculation Rules Eagerness:
  immediate   → Certain (main conversion page: /checkout)
  moderate    → Likely (hover = intent signal) ← DEFAULT CHOICE
  conservative→ High-risk pages (avoid side effects)

Anti-patterns:
  ❌ prerender /logout, /delete (side effects!)
  ❌ prerender cross-origin pages (privacy restrictions)
  ❌ Too many prerenders (heavy CPU/memory!)
  ❌ Forgetting crossorigin on preconnect for CORS resources
  ❌ dns-prefetch when preconnect is appropriate (vice versa)

Browser support (2024):
  preconnect:      All modern browsers ✅
  dns-prefetch:    All modern browsers ✅
  prefetch:        All modern browsers ✅
  Speculation Rules API: Chrome 109+ ✅, Firefox/Safari ❌ (use prefetch fallback)
```


---

## Deep Dive: Image Performance — LCP, CLS và Bandwidth

> **Nguồn:** [web.dev/learn/performance/image-performance](https://web.dev/learn/performance/image-performance) — Google Web.dev
>
> Images thường chiếm 50-70% tổng page weight và là LCP element phổ biến nhất. Tối ưu images đúng cách có thể cải thiện LCP hàng trăm milliseconds và loại bỏ CLS hoàn toàn. Bài này cover format, sizing, loading strategy, và responsive images.

### Tại sao Images là Core Web Vitals Bottleneck

```
Typical page weight breakdown (median 2024):
  Images:     ~1,000KB (50%)  ← Biggest opportunity!
  JavaScript: ~500KB  (25%)
  CSS:        ~80KB   (4%)
  Fonts:      ~100KB  (5%)
  HTML:       ~30KB   (1.5%)
  Other:      ~290KB  (14.5%)

Images affect:
  LCP: Hero image thường là LCP element
       → Slow image download = high LCP
  CLS: Image không có width/height → layout shift khi load
       → CLS penalty
  Bandwidth: 50% of page = massive savings opportunity
```

---

### Fix 1: Modern Image Formats — WebP và AVIF

```
Format comparison (same visual quality):
┌────────────────────────────────────────────────────────────┐
│ Format │ Size (relative) │ Browser Support │ Use case     │
├────────────────────────────────────────────────────────────┤
│ JPEG   │ 100% (baseline) │ All browsers    │ Fallback     │
│ PNG    │ 150-300%        │ All browsers    │ Transparency │
│ WebP   │ 25-35% smaller  │ 95%+ browsers   │ ✅ Recommend │
│ AVIF   │ 50% smaller!    │ 80%+ browsers   │ ✅ Best but  │
│        │                 │                 │  slow encode │
└────────────────────────────────────────────────────────────┘

Real numbers:
  JPEG hero: 200KB
  WebP hero: 130KB (-35%)
  AVIF hero:  95KB (-52%)
  → AVIF: same visual quality, half the download time!
```

```html
<!-- <picture> element: serve modern format, fallback to JPEG -->
<picture>
  <!-- AVIF: Best compression, newer browsers -->
  <source
    type="image/avif"
    srcset="hero.avif 1x, hero@2x.avif 2x"
  >
  <!-- WebP: Great compression, wide support -->
  <source
    type="image/webp"
    srcset="hero.webp 1x, hero@2x.webp 2x"
  >
  <!-- JPEG fallback: All browsers -->
  <img
    src="hero.jpg"
    alt="Hero image"
    width="1200"
    height="600"
    fetchpriority="high"
  >
</picture>
<!-- Browser picks first <source> it supports
     Chrome 85+: AVIF ← picks this
     Safari 14+: WebP ← picks this
     Older: JPEG ← fallback -->
```

```typescript
// Next.js: Automatic format conversion!
import Image from 'next/image';

// next/image auto-serves AVIF → WebP → fallback
// Based on browser Accept header: "image/avif,image/webp,*/*"
function HeroSection() {
  return (
    <Image
      src="/hero.jpg"           // Source: JPEG (or any format)
      alt="Hero"
      width={1200}
      height={600}
      priority                  // LCP image → preload + eager
      // next/image automatically:
      // 1. Converts to WebP/AVIF
      // 2. Resizes to requested dimensions
      // 3. Serves from /_next/image?url=...&w=...&q=...
    />
  );
}
```

---

### Fix 2: Responsive Images — `srcset` + `sizes`

```html
<!-- Problem: 2000px image served to mobile (400px wide screen)
     → 5x more pixels than needed!
     → Wasted bandwidth + slower LCP on mobile -->

<!-- Solution: srcset + sizes = right size for each device -->

<img
  src="hero-800.webp"
  srcset="
    hero-400.webp   400w,
    hero-800.webp   800w,
    hero-1200.webp  1200w,
    hero-1600.webp  1600w,
    hero-2400.webp  2400w
  "
  sizes="
    (max-width: 400px) 100vw,
    (max-width: 800px) 100vw,
    (max-width: 1200px) 75vw,
    50vw
  "
  alt="Hero"
  width="1600"
  height="900"
  fetchpriority="high"
>
<!--
  How browser chooses:
  Mobile 375px: 375px × 2dpr = 750px needed → serve 800w version
  Tablet 768px: 768px × 2dpr = 1536px needed → serve 1600w version
  Desktop 1440px: 1440px × 0.5 (sizes=50vw) × 2dpr = 1440px → 1600w

  Result: Mobile downloads 800KB instead of 2400KB (3x smaller!)
-->
```

```
sizes attribute — What it means:
  sizes="(max-width: 400px) 100vw"
  = "On screens ≤ 400px, image takes 100% of viewport width"

  sizes="(max-width: 1200px) 75vw, 50vw"
  = "On screens ≤ 1200px: 75% viewport; on larger: 50% viewport"

IMPORTANT: sizes must reflect your CSS layout!
  Wrong sizes = browser fetches wrong size image
  → Too small: blurry image
  → Too large: wasted bandwidth

Rule: Set sizes to match how wide the image appears in your layout!
```

```typescript
// Next.js: sizes prop
function ProductGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4">
      {products.map(product => (
        <Image
          key={product.id}
          src={product.image}
          alt={product.name}
          width={400}
          height={300}
          // CSS: 1 col on mobile (100vw), 3 cols on md (33vw), 4 cols on lg (25vw)
          sizes="(max-width: 768px) 100vw,
                 (max-width: 1024px) 33vw,
                 25vw"
          loading="lazy"
        />
      ))}
    </div>
  );
}
// → next/image generates srcset with correct sizes automatically!
```

---

### Fix 3: `width` và `height` — Prevent CLS

```html
<!-- CLS problem: Image without dimensions -->
<!-- Browser doesn't know image size before download
     → Renders page with 0-height image placeholder
     → Image loads → LAYOUT SHIFTS → CLS penalty! -->

<!-- ❌ BAD: No dimensions → CLS! -->
<img src="/hero.webp" alt="Hero">

<!-- ✅ GOOD: Explicit dimensions → browser reserves space -->
<img
  src="/hero.webp"
  alt="Hero"
  width="1200"
  height="600"
>
<!--
  Browser: "Oh, this image will be 1200×600px (2:1 aspect ratio)"
  → Reserves space BEFORE download
  → No layout shift when image loads!
  → CLS = 0 for this image!
-->

<!-- CSS: Make responsive while maintaining aspect ratio -->
<style>
img {
  max-width: 100%;
  height: auto; /* Maintains aspect ratio */
}
/* Even with width="1200" height="600", image scales down on mobile
   because max-width: 100% + height: auto! */
</style>
```

```typescript
// Next.js: Automatic CLS prevention
// Option 1: Explicit dimensions
<Image src="/hero.jpg" width={1200} height={600} alt="Hero" />

// Option 2: fill (responsive container)
<div style={{ position: 'relative', width: '100%', height: '400px' }}>
  <Image
    src="/hero.jpg"
    fill              // Fills parent container
    style={{ objectFit: 'cover' }}
    alt="Hero"
  />
</div>

// Option 3: Static import (auto-detects dimensions!)
import heroImage from './hero.jpg';
<Image src={heroImage} alt="Hero" />
// → Next.js reads actual dimensions from file → auto sets width/height!
// → Zero CLS, zero effort!
```

---

### Fix 4: Loading Strategy — lazy vs eager

```html
<!-- Loading strategy: 2 options -->

<!-- eager (default): Download immediately -->
<!-- Use for: LCP image, above-fold critical images -->
<img
  src="/hero.webp"
  alt="Hero"
  loading="eager"        <!-- or omit (default is eager) -->
  fetchpriority="high"   <!-- Prioritize within eager loads -->
  width="1200"
  height="600"
>

<!-- lazy: Download when near viewport -->
<!-- Use for: Below-fold images, cards, long feeds -->
<img
  src="/product.webp"
  alt="Product"
  loading="lazy"     <!-- Start loading when ~200-500px from viewport -->
  width="400"
  height="300"
>
<!--
  loading="lazy" savings (typical e-commerce):
    10 products below fold × 200KB each = 2MB not downloaded on initial load!
    → First Contentful Paint faster
    → LCP faster (less bandwidth competition)
    → Only downloaded when user scrolls
-->

<!-- ⚠️ CRITICAL: Never lazy-load LCP image! -->
<!-- loading="lazy" delays LCP image → kills LCP score! -->
<!-- Common mistake: lazy-loading hero image thinking it "saves bandwidth" -->
```

```
Lazy loading threshold (Chrome):
  Images load when within:
    ~200px of viewport (mobile, slow connections)
    ~1200px of viewport (desktop, fast connections)
  → User rarely sees placeholder on scroll!
```

---

### Fix 5: `decoding` — Non-blocking Image Decode

```html
<!-- Image decoding: CPU-intensive operation -->
<!-- sync (default): Block render while decoding -->
<!-- async: Decode in background thread -->

<!-- LCP image: sync (want it ASAP, blocking is acceptable) -->
<img src="/hero.webp" decoding="sync" fetchpriority="high" ...>

<!-- Below-fold images: async (don't block rendering) -->
<img src="/product.webp" decoding="async" loading="lazy" ...>

<!-- Auto (browser decides based on heuristics) -->
<img src="/image.webp" decoding="auto" ...>
```

---

### Fix 6: Image CDN — Automatic Optimization at Scale

```
Image CDN vs Manual:
  Manual approach:
    1. Designer uploads 5000px JPEG hero image
    2. Dev manually creates: hero-400.webp, hero-800.webp, hero-1200.webp
    3. Write srcset HTML
    4. Repeat for EVERY image!
    5. Update whenever image changes...

  Image CDN (Cloudinary, Imgix, Cloudflare Images):
    1. Upload original image once
    2. Request transformed version via URL params:
       https://cdn.com/hero.jpg?w=800&f=webp&q=80
    3. CDN: auto-resize + convert format + compress!
    4. Result: Served from edge (fast!) in any format/size

URL-based transforms (Cloudinary example):
  Original: https://res.cloudinary.com/demo/hero.jpg (5MB)
  Optimized: https://res.cloudinary.com/demo/w_800,f_webp,q_auto/hero.jpg (60KB!)
    w_800: resize to 800px
    f_webp: convert to WebP
    q_auto: auto-quality (smart compression)
```

```typescript
// Next.js Image with external CDN (Cloudinary)
// next.config.js:
const nextConfig = {
  images: {
    remotePatterns: [{
      protocol: 'https',
      hostname: 'res.cloudinary.com',
    }],
    // Or use a loader:
    loader: 'cloudinary',
    path: 'https://res.cloudinary.com/demo/',
  }
};

// Usage: Next.js auto-generates optimal URL for each device
<Image
  src="https://res.cloudinary.com/demo/hero.jpg"
  width={1200}
  height={600}
  alt="Hero"
  priority
/>
// → Next.js generates: ...f_webp,q_auto,w_1200/hero.jpg for desktop
//                       ...f_webp,q_auto,w_640/hero.jpg for mobile
// → Cloudinary serves from edge cache!
```

---

### Image Optimization Checklist

```
FORMAT:
  ☑ Use WebP (or AVIF) for all photos/illustrations
  ☑ Use <picture> for format negotiation with JPEG fallback
  ☑ PNG only for images needing transparency
  ☑ SVG for icons/logos (infinitely scalable, tiny file)

SIZING:
  ☑ Always set width + height attributes
  ☑ Use srcset + sizes for responsive images
  ☑ Provide images at 1x, 1.5x, 2x (retina) sizes
  ☑ Don't serve images larger than display size

LOADING:
  ☑ LCP image: loading="eager" + fetchpriority="high" + preload
  ☑ Below-fold: loading="lazy"
  ☑ NEVER lazy-load LCP image!
  ☑ Large below-fold images: decoding="async"

COMPRESSION:
  ☑ WebP quality 75-85% (optimal balance)
  ☑ AVIF quality 50-70% (better compression)
  ☑ Remove EXIF metadata (use tools or CDN)
  ☑ Progressive JPEG for large photos

REACT/NEXT.JS:
  ☑ Use next/image (auto-handles format + sizing + lazy + CLS)
  ☑ priority prop ONLY on LCP image (1 per page!)
  ☑ Provide correct sizes prop matching CSS layout
  ☑ Static import for local images (auto-detects dimensions)
  ☑ Use Image CDN (Cloudinary/Imgix) for dynamic images

MEASUREMENT:
  ☑ PageSpeed Insights: Check LCP image optimization
  ☑ Lighthouse: "Serve images in next-gen formats"
  ☑ Lighthouse: "Properly size images"
  ☑ Network tab: Check image file sizes in production
```

---

### Summary: Image Impact on Core Web Vitals

```
LCP improvement from image optimization:
  LCP Image format: JPEG → AVIF = ~50% smaller = 2x faster download
  LCP preload: +fetchpriority="high" = 200-500ms LCP improvement
  LCP in static HTML (not JS-injected): eliminates "Load Delay"

CLS from images:
  Missing width/height → CLS every time images load
  Fix: Always set width + height → CLS = 0 for images

Bandwidth savings typical e-commerce:
  10 product cards, 200KB each JPEG:
  → WebP + lazy load: 10 × 130KB = save 700KB initial load
  → AVIF + lazy load: 10 × 95KB = save 1050KB initial load
  
  LCP hero JPEG 200KB:
  → WebP + srcset (mobile): 60KB (3x smaller!)
  → AVIF + srcset (mobile): 40KB (5x smaller!)
  → LCP: 200ms faster on 3G connection!
```


---

## Deep Dive: Code-Split JavaScript — Chỉ tải code khi cần

> **Nguồn:** [web.dev/learn/performance/code-split-javascript](https://web.dev/learn/performance/code-split-javascript) — Google Web.dev
>
> **Code splitting** là kỹ thuật chia bundle JavaScript thành nhiều chunks nhỏ và chỉ tải chunk cần thiết cho page hiện tại. Thay vì tải 2MB JS ngay khi user vào trang chủ, ta tải 200KB cho trang chủ, 300KB cho trang product khi user navigate. Bài này là deep dive từ lý thuyết đến production patterns với React/Vite/Next.js.

### Vấn đề: Monolithic JS Bundle

```
Typical SPA mà KHÔNG code split:
┌────────────────────────────────────────────────────────────┐
│ app.bundle.js = 2.5MB (minified + gzipped)                │
│                                                            │
│ Contains:                                                  │
│   Home page code:        150KB (user using this NOW)      │
│   Products page:         300KB (user NOT here yet)        │
│   Dashboard:             400KB (user NOT here yet)        │
│   Admin panel:           500KB (90% users never use!)     │
│   Checkout flow:         250KB (user NOT here yet)        │
│   Rich text editor:      450KB (only in create-post page) │
│   Charts library:        350KB (only in analytics page)   │
│   ─────────────────────────────────────────────           │
│   Total served:        2,400KB                            │
│   Actually needed:       150KB (6%)                       │
│   Wasted:              2,250KB (94%!) ← SHIPPED BUT UNUSED│
│                                                            │
│ Impact on mobile (3G):                                    │
│   Download: 2.5MB = 15-20s!                               │
│   Parse + Execute: 8-12s on budget phone!                 │
│   TBT (Total Blocking Time): Massive                      │
│   INP: Terrible during startup (main thread blocked)      │
└────────────────────────────────────────────────────────────┘
```

---

### Cơ chế: Dynamic Import — Nền tảng của Code Splitting

```javascript
// Static import: Bundler MUST include in main bundle
import { heavyFunction } from './heavy-module';
// → Always loaded, even if user never calls heavyFunction()!

// Dynamic import: Bundler creates SEPARATE chunk
const { heavyFunction } = await import('./heavy-module');
// → Chunk created at build time
// → NOT downloaded until this code runs!
// → Browser fetches chunk ON DEMAND via network request
```

```
Build output comparison:

BEFORE (static imports):
  dist/app.js = 2.5MB (everything)

AFTER (dynamic imports):
  dist/app.js         = 200KB  (core + home page)
  dist/products.js    = 300KB  (products page)
  dist/dashboard.js   = 400KB  (dashboard)
  dist/admin.js       = 500KB  (admin panel)
  dist/checkout.js    = 250KB  (checkout)
  dist/editor.js      = 450KB  (rich text editor)
  dist/charts.js      = 350KB  (charts library)

User visits home page:
  Downloads: app.js (200KB) only!
  vs Before: 2.5MB
  Savings: 92% reduction!
```

---

### Strategy 1: Route-Based Splitting — Most Important

```typescript
// React Router + React.lazy = Route-based code splitting
import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

// ❌ BAD: Static imports → all routes in main bundle
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import DashboardPage from './pages/DashboardPage';
import AdminPage from './pages/AdminPage';

// ✅ GOOD: Dynamic imports → each route = separate chunk
const HomePage = lazy(() => import('./pages/HomePage'));
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
// Each page = separate chunk, loaded only when user navigates!

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <Suspense fallback={<PageSkeleton />}>
        <HomePage />
      </Suspense>
    ),
  },
  {
    path: '/products',
    element: (
      <Suspense fallback={<PageSkeleton />}>
        <ProductsPage />
      </Suspense>
    ),
  },
  {
    path: '/dashboard',
    element: (
      <Suspense fallback={<PageSkeleton />}>
        <DashboardPage />
      </Suspense>
    ),
  },
]);
```

```typescript
// Next.js App Router: Route splitting is AUTOMATIC!
// app/page.tsx          → chunk for /
// app/products/page.tsx → chunk for /products
// app/dashboard/page.tsx → chunk for /dashboard
// No configuration needed!

// BUT: Heavy components in pages still need manual splitting
// app/products/page.tsx:
import dynamic from 'next/dynamic';

// Heavy chart library: only load when needed
const SalesChart = dynamic(
  () => import('@/components/SalesChart'),
  {
    loading: () => <ChartSkeleton />,
    ssr: false, // Client-side only (chart can't SSR)
  }
);

export default function ProductsPage() {
  const [showChart, setShowChart] = useState(false);
  return (
    <div>
      <ProductList />
      <button onClick={() => setShowChart(true)}>Show Analytics</button>
      {showChart && <SalesChart />} {/* Chart chunk loaded on demand! */}
    </div>
  );
}
```

---

### Strategy 2: Component-Based Splitting

```typescript
// Split heavy components that are not always needed

// ❌ BAD: Rich text editor bundled with every page
import RichTextEditor from 'quill'; // 450KB!
// Even pages that never use editor pay this cost!

// ✅ GOOD: Lazy load editor only for create-post page
const RichTextEditor = lazy(() =>
  import('@/components/RichTextEditor')
    .then(mod => ({ default: mod.RichTextEditor }))
);

// ✅ GOOD: Load on user interaction
function CreatePostPage() {
  const [editorLoaded, setEditorLoaded] = useState(false);

  return (
    <div>
      <h1>Create Post</h1>
      {!editorLoaded ? (
        <button onClick={() => setEditorLoaded(true)}>
          Start Writing
        </button>
      ) : (
        <Suspense fallback={<EditorSkeleton />}>
          <RichTextEditor />  {/* 450KB chunk loads HERE */}
        </Suspense>
      )}
    </div>
  );
}
```

```typescript
// Pattern: IntersectionObserver lazy loading (viewport-based)
// Component chunk loads when element ENTERS viewport

function useLazyLoad(ref: React.RefObject<Element>) {
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' } // Start loading 200px before viewport
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref]);

  return shouldLoad;
}

// Usage: Heavy analytics section below fold
const AnalyticsSection = lazy(() => import('./AnalyticsSection'));

function ProductPage() {
  const analyticsRef = useRef<HTMLDivElement>(null);
  const shouldLoadAnalytics = useLazyLoad(analyticsRef);

  return (
    <div>
      <ProductHero />        {/* Above fold: loaded immediately */}
      <ProductDetails />
      <div ref={analyticsRef}>
        {shouldLoadAnalytics ? (
          <Suspense fallback={<AnalyticsSkeleton />}>
            <AnalyticsSection /> {/* Loads when user scrolls near! */}
          </Suspense>
        ) : (
          <AnalyticsSkeleton />
        )}
      </div>
    </div>
  );
}
```

---

### Strategy 3: Prefetch Chunks — Instant Navigation

```typescript
// Load chunks in background during idle time
// User gets instant navigation without waiting for chunk download!

const ProductsPage = lazy(() =>
  import(
    /* webpackPrefetch: true */       // Webpack
    /* @vite-ignore */
    './pages/ProductsPage'
  )
);
// → Browser prefetches ProductsPage chunk in background
// → When user navigates → chunk already in cache → instant!

// Vite: Manual prefetch via link tag
function NavBar() {
  const prefetchDashboard = () => {
    // User hovering nav → likely to click → prefetch now!
    const link = document.createElement('link');
    link.rel = 'modulepreload'; // ES module prefetch!
    link.href = '/chunks/dashboard.js';
    document.head.appendChild(link);
  };

  return (
    <nav>
      <a
        href="/dashboard"
        onMouseEnter={prefetchDashboard}
      >
        Dashboard
      </a>
    </nav>
  );
}

// React Router v6.4+: Built-in prefetch
// <Link prefetch="intent" to="/dashboard">Dashboard</Link>
// → Prefetches on hover/focus automatically!
```

---

### Strategy 4: Vendor Splitting — Caching Optimization

```typescript
// vite.config.ts: Manual chunk splitting
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks: change rarely → cache longer!
          'react-vendor': ['react', 'react-dom'],
          'router-vendor': ['react-router-dom'],
          'query-vendor': ['@tanstack/react-query'],
          'ui-vendor': ['@mui/material', '@emotion/react'],
          // App chunks: change often
          // (bundler handles automatically per route)
        }
      }
    }
  }
});

/* Build output:
   dist/react-vendor-[hash].js   = 150KB  ← Cached for months!
   dist/router-vendor-[hash].js  = 50KB   ← Cached for months!
   dist/ui-vendor-[hash].js      = 300KB  ← Cached for months!
   dist/app-[hash].js            = 50KB   ← Changes per deploy
   dist/products-[hash].js       = 80KB   ← Changes per deploy
   
   User on repeat visit:
   vendor chunks: SERVED FROM CACHE (0 network)
   app chunks: Small download (only changed code)
   Total: ~130KB instead of 630KB! */
```

---

### Measuring: Identify What to Split

```bash
# 1. Bundle Analyzer — Visual treemap of bundle
# Vite:
npm install --save-dev rollup-plugin-visualizer

# vite.config.ts:
import { visualizer } from 'rollup-plugin-visualizer';
export default defineConfig({
  plugins: [visualizer({ open: true })] // Opens in browser after build
});

npm run build  # → Opens treemap visualization!
# → Look for: Large squares = big dependencies = split candidates!

# 2. Webpack Bundle Analyzer
npm install --save-dev webpack-bundle-analyzer
# webpack.config.js: plugins: [new BundleAnalyzerPlugin()]
```

```
Chrome DevTools: Coverage tab
  1. DevTools → More tools → Coverage
  2. Record page load
  3. See % unused JS per file
  
  Kết quả điển hình:
  app.bundle.js: 78% unused!  ← Split this!
  react.js:       5% unused   ← OK (core library)
  
  Red = unused, Blue = used
  → Files with >50% red = prime split candidates
```

---

### Anti-Patterns: Over-splitting và Under-splitting

```typescript
// ❌ OVER-SPLITTING: Too many tiny chunks
// 100 lazy components, each 2KB = 100 HTTP requests!
// HTTP/2 helps but still overhead

const Button = lazy(() => import('./Button'));       // 2KB ← TOO SMALL
const Input = lazy(() => import('./Input'));         // 1KB ← TOO SMALL
const Label = lazy(() => import('./Label'));         // 0.5KB ← TOO SMALL

// ✅ GOOD: Group related small components
const FormComponents = lazy(() => import('./forms')); // 20KB ← OK

// Rule of thumb:
// Split if chunk > 20-30KB AND not needed immediately
// Don't split if chunk < 10KB (HTTP overhead > benefit)

// ❌ UNDER-SPLITTING: Not splitting obvious candidates
// 450KB chart library ALWAYS loaded, only used in /analytics
import { Chart } from 'chart.js'; // ← Should be lazy!

// ✅ GOOD: Split large libraries
const Chart = lazy(() => import('./LazyChart'));

// Split candidates (if used in < 100% of pages):
// - Chart libraries (chart.js, recharts): 200-450KB
// - Rich text editors (quill, tiptap): 300-500KB
// - PDF viewers: 500KB+
// - 3D libraries (three.js): 600KB+
// - Date pickers with locales: 200KB+
// - Code syntax highlighters: 100-300KB
```

---

### Summary: Code Splitting Decision Framework

```
WHEN to code split:
  ✅ Large JS chunks (> 30KB) not needed on first load
  ✅ Features used by < 50% of users (admin, settings)
  ✅ Below-fold components (load on scroll)
  ✅ On-interaction features (modals, editors, charts)
  ✅ Different user roles (admin panel vs user view)

HOW to split (in order of priority):
  1. Route-based (biggest impact, easiest):
     React.lazy + Suspense per route
     Next.js: Automatic for app/ directory

  2. Large library splitting:
     Chart libraries, editors, PDF viewers

  3. Interaction-based:
     Load on button click, modal open, scroll

  4. Viewport-based:
     IntersectionObserver for below-fold sections

  5. Vendor splitting:
     Separate vendor chunks for better caching

MEASURE impact:
  Before: Lighthouse → "Reduce unused JavaScript"
  Tools: webpack-bundle-analyzer, rollup-visualizer
  DevTools: Coverage tab (% unused JS)
  Network: Before/after chunk sizes

Targets:
  Initial bundle (main chunk): < 100-200KB (compressed)
  Per-route chunks: < 50-100KB each
  Vendor chunks: Stable (cached aggressively)
  
Impact (typical SPA):
  TBT: -40-60% (less JS to parse on startup)
  TTI: -30-50% (interactive sooner)
  INP startup: Significantly improved
  
  Real numbers:
  Before: 2.5MB bundle, TTI 8s on mobile
  After:  200KB initial, TTI 2s on mobile (4x faster!)
```


---

## Deep Dive: Lazy Load Images and Iframe Elements

> **Nguồn:** [web.dev/learn/performance/lazy-load-images-and-iframe-elements](https://web.dev/learn/performance/lazy-load-images-and-iframe-elements) — Google Web.dev
>
> Bài này là companion của bài Image Performance — focus đặc biệt vào **lazy loading mechanics**, cách nó ảnh hưởng đến Core Web Vitals, và **Facade Pattern** cho iframes. Quan trọng: lazy loading là con dao hai lưỡi — dùng sai chỗ có thể HURT performance thay vì help.

### Native Lazy Loading — `loading="lazy"`

```html
<!-- Browser-native lazy loading (Chrome 77+, Firefox 75+, Safari 15.4+) -->
<!-- Không cần JavaScript! -->

<!-- Images -->
<img
  src="product.webp"
  loading="lazy"
  width="400"
  height="300"
  alt="Product"
>

<!-- Iframes -->
<iframe
  src="https://www.youtube.com/embed/..."
  loading="lazy"
  width="560"
  height="315"
  title="Video"
></iframe>

<!-- How it works:
  Browser tracks each image/iframe distance from viewport
  When element within threshold → starts loading
  Threshold varies by connection speed:
    Fast connection: ~1250px from viewport
    Slow connection: ~2500px from viewport
  (Browser is smart! Loads earlier on slow connection
   to compensate for slower download time) -->
```

```
Native lazy loading vs IntersectionObserver (old way):

Native loading="lazy":                IntersectionObserver (manual):
  ✅ No JS required                    ❌ Requires JS bundle
  ✅ Works even if JS fails            ❌ Breaks without JS
  ✅ Browser-optimized threshold       ❌ Manual threshold config
  ✅ Works with preload scanner        ❌ May miss preload
  ✅ Zero performance cost             ❌ Observer overhead
  ✅ Auto-adjusts for connection       ❌ Static threshold
  
  Use native for: Simple image/iframe lazy loading
  Use IntersectionObserver for: Custom behavior, components,
    data fetching, animations, complex logic
```

---

### ⚠️ Critical Rule: Không Lazy Load LCP Image!

```html
<!-- ❌ EXTREMELY BAD: Lazy loading hero/LCP image -->
<img
  src="/hero.webp"
  loading="lazy"    ← THIS DESTROYS LCP!
  alt="Hero"
>
<!-- What happens:
  Browser sees loading="lazy"
  → Decides: "I'll wait until this is near viewport"
  → Hero IS in viewport → browser starts loading
  But: The lazy-load trigger requires JavaScript evaluation
  → Adds extra delay before image starts downloading!
  → LCP 500-1000ms WORSE than without lazy loading!
  
  Measured impact: Adding loading="lazy" to LCP image
  = +500ms to +1500ms LCP on mobile! -->

<!-- ✅ CORRECT: Above-fold images = eager (default) + high priority -->
<img
  src="/hero.webp"
  loading="eager"        ← or just omit (eager is default)
  fetchpriority="high"   ← Download before other resources
  width="1200"
  height="600"
  alt="Hero"
>

<!-- ✅ CORRECT: Below-fold images = lazy -->
<img
  src="/product.webp"
  loading="lazy"          ← Only images below the fold!
  width="400"
  height="300"
  alt="Product"
>
```

```
Threshold for "above the fold":
  If image is visible WITHOUT scrolling on any device → eager
  If image requires scrolling to see → lazy
  
  Common mistake: Testing on wide monitor (hero is visible)
  but on mobile (hero + 1st card might be visible)
  
  Safe rule: First 3-5 images in any content flow = eager
             Everything else = lazy
```

---

### CLS Prevention với Lazy Loaded Images

```html
<!-- CLS từ lazy loading: Image loads → page shifts down -->
<!-- Fix: ALWAYS set width + height (or aspect-ratio) -->

<!-- ❌ BAD: No dimensions → massive CLS when images load -->
<img src="product.webp" loading="lazy" alt="Product">
<!-- Browser: "Unknown size... reserve 0px height"
     Image loads → "Oh it's 400x300px!" → PAGE SHIFTS! -->

<!-- ✅ GOOD: Explicit dimensions → space reserved before load -->
<img
  src="product.webp"
  loading="lazy"
  width="400"
  height="300"   ← Browser reserves 400×300 space immediately
  alt="Product"
>
<!-- Browser reserves correct space before image loads!
     Image loads → fills already-reserved space → NO SHIFT! -->

<!-- CSS: Make responsive (add to global styles) -->
<style>
  img {
    max-width: 100%;
    height: auto; /* Maintains aspect ratio while being responsive */
  }

  /* OR use aspect-ratio for unknown dimensions: */
  .product-image-container {
    aspect-ratio: 4 / 3;
    overflow: hidden;
  }
</style>
```

```typescript
// React: CLS-safe lazy image component
interface LazyImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;  // true = LCP image
  className?: string;
}

function LazyImage({
  src, alt, width, height,
  priority = false,
  className
}: LazyImageProps) {
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding={priority ? 'sync' : 'async'}
      className={className}
      style={{ maxWidth: '100%', height: 'auto' }}
    />
  );
}

// Usage:
<LazyImage src="/hero.webp" width={1200} height={600} priority alt="Hero" />
<LazyImage src="/product.webp" width={400} height={300} alt="Product" />
```

---

### Iframe Lazy Loading — Đặc biệt Quan Trọng

```
Standard <iframe> cost:
  YouTube embed (no lazy loading):
    - 11 network requests
    - ~500KB of JavaScript downloaded
    - 3 additional origins connected (youtube.com, ytimg.com, googlevideo.com)
    - Main thread blocked while parsing YouTube JS
    - Even if user never watches video!

  With loading="lazy":
    - 0 requests until iframe near viewport
    - 0KB downloaded initially
    - 0 connections established initially
    → Massive saving for pages with YouTube embeds!
```

```html
<!-- Lazy load all third-party iframes! -->

<!-- YouTube -->
<iframe
  src="https://www.youtube.com/embed/VIDEO_ID"
  loading="lazy"
  width="560"
  height="315"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowfullscreen
  title="Video title"
></iframe>

<!-- Google Maps -->
<iframe
  src="https://www.google.com/maps/embed?..."
  loading="lazy"
  width="600"
  height="450"
  style="border: 0"
  allowfullscreen
  title="Location map"
></iframe>

<!-- Third-party widgets -->
<iframe
  src="https://widget.example.com/embed"
  loading="lazy"
  width="400"
  height="300"
  title="Widget"
></iframe>
```

---

### Facade Pattern — YouTube embed Không Tốn Bandwidth

**Facade** = thumbnail tĩnh + play button giả → chỉ tải iframe thật khi user click.

```typescript
// YouTube Facade Component — PRODUCTION PATTERN
interface YouTubeFacadeProps {
  videoId: string;
  title: string;
  className?: string;
}

function YouTubeFacade({ videoId, title, className }: YouTubeFacadeProps) {
  const [activated, setActivated] = useState(false);
  const thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  if (activated) {
    // User clicked → load real iframe
    return (
      <iframe
        src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
        title={title}
        width="560"
        height="315"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className={className}
      />
    );
  }

  return (
    <div
      className={`youtube-facade ${className ?? ''}`}
      style={{
        position: 'relative',
        aspectRatio: '16 / 9',
        cursor: 'pointer',
        background: '#000',
      }}
      onClick={() => setActivated(true)}
      role="button"
      tabIndex={0}
      aria-label={`Play video: ${title}`}
      onKeyDown={e => e.key === 'Enter' && setActivated(true)}
    >
      {/* Thumbnail - just an img, not iframe! */}
      <img
        src={thumbnailUrl}
        alt={`Thumbnail: ${title}`}
        loading="lazy"           // Thumbnail lazy loaded too!
        width={560}
        height={315}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />

      {/* Play button overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg
          width="68"
          height="48"
          viewBox="0 0 68 48"
          aria-hidden="true"
        >
          {/* YouTube play button shape */}
          <path
            d="M66.52 7.74c-.78-2.93-2.49-5.41-5.42-6.19C55.79.13 34 0 34 0S12.21.13 6.9 1.55c-2.93.78-4.63 3.26-5.42 6.19C.06 13.05 0 24 0 24s.06 10.95 1.48 16.26c.78 2.93 2.49 5.41 5.42 6.19C12.21 47.87 34 48 34 48s21.79-.13 27.1-1.55c2.93-.78 4.64-3.26 5.42-6.19C67.94 34.95 68 24 68 24s-.06-10.95-1.48-16.26z"
            fill="#f00"
          />
          <path d="M 45,24 27,14 27,34" fill="#fff" />
        </svg>
      </div>
    </div>
  );
}

// ✅ Use lite-youtube-embed library (smaller, better):
// npm install lite-youtube-embed
// import 'lite-youtube-embed/src/lite-yt-embed.css';
// import 'lite-youtube-embed/src/lite-yt-embed.js';
// <lite-youtube videoid="VIDEO_ID" playlabel="Play video"></lite-youtube>
```

```
Facade Pattern Impact:
  Standard YouTube embed:
    - 500KB JS downloaded on page load
    - 11 network requests
    - Main thread blocked 300ms+
    
  With Facade:
    - 0KB YouTube JS on page load
    - 1 network request (thumbnail image only!)
    - Zero main thread impact
    
  User clicks play:
    - Iframe loads (now user wants it!)
    - 500KB YouTube JS downloads
    - Video starts playing
    
  Net result:
    - Pages with video embeds: 500KB lighter initial load
    - LCP: Much faster (no YouTube iframe blocking)
    - Time to Interactive: Significantly faster
```

---

### Custom IntersectionObserver — Khi Native Không Đủ

```typescript
// Use when: Need custom behavior beyond simple lazy loading
// Examples: Load data, trigger animations, complex UI

function useIntersectionObserver<T extends Element>(
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const ref = useRef<T>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
      if (entry.isIntersecting) {
        setHasIntersected(true);
        // Once intersected, can stop observing (for one-shot loads)
        // observer.disconnect();
      }
    }, {
      root: null,          // Viewport
      rootMargin: '200px', // Load 200px BEFORE entering viewport
      threshold: 0,        // Trigger when ANY part enters viewport
      ...options
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return { ref, isIntersecting, hasIntersected };
}

// Example: Lazy load heavy map component
const MapComponent = lazy(() => import('./HeavyMapComponent'));

function LocationSection() {
  const { ref, hasIntersected } = useIntersectionObserver<HTMLDivElement>({
    rootMargin: '400px' // Start loading 400px before viewport (map is heavy!)
  });

  return (
    <div ref={ref} style={{ minHeight: '400px' }}>
      {hasIntersected ? (
        <Suspense fallback={<MapSkeleton />}>
          <MapComponent />  {/* Map loads when user near this section */}
        </Suspense>
      ) : (
        <MapSkeleton />
      )}
    </div>
  );
}

// Example: Data fetching on scroll
function ProductSection({ category }: { category: string }) {
  const { ref, hasIntersected } = useIntersectionObserver<HTMLDivElement>();
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (hasIntersected) {
      // Load products only when section visible!
      fetchProducts(category).then(setProducts);
    }
  }, [hasIntersected, category]);

  return (
    <section ref={ref}>
      {products.length > 0 ? (
        products.map(p => <ProductCard key={p.id} data={p} />)
      ) : (
        <ProductsSkeleton />
      )}
    </section>
  );
}
```

---

### Summary: Lazy Loading Decision Guide

```
Images:
┌────────────────────────────────────────────────────────────┐
│ Image position         │ loading=     │ fetchpriority=    │
├────────────────────────────────────────────────────────────┤
│ Above fold (LCP)       │ eager        │ high              │
│ Above fold (not LCP)   │ eager        │ auto              │
│ Below fold (1st 3)     │ lazy         │ auto              │
│ Far below fold         │ lazy         │ low               │
│ Background/decorative  │ lazy         │ low               │
└────────────────────────────────────────────────────────────┘

Iframes:
  ✅ ALWAYS use loading="lazy" for all iframes
  ✅ Consider Facade Pattern for YouTube/video embeds
  ✅ Set width + height to prevent CLS

CLS Prevention (always!):
  ✅ width + height attributes on all images
  ✅ CSS: img { max-width: 100%; height: auto; }
  ✅ Or: aspect-ratio in CSS for dynamic-size images

Anti-patterns:
  ❌ loading="lazy" on LCP image (biggest mistake!)
  ❌ No width/height → CLS
  ❌ Heavy iframe without lazy (YouTube, Maps)
  ❌ Using IntersectionObserver when loading="lazy" suffices
  ❌ Facade without keyboard accessibility (needs role + tabIndex)

Impact (typical e-commerce product page):
  12 product images (all lazy):
    WITHOUT lazy: 12 × 150KB = 1.8MB downloaded on load
    WITH lazy:    2 × 150KB = 300KB downloaded on load
    Savings: 1.5MB = 10s on 3G!

  1 YouTube embed (facade):
    WITHOUT facade: 500KB YouTube JS on load
    WITH facade:    1 thumbnail = ~15KB
    Savings: 485KB = 3s on 3G!
```


---

## Deep Dive: Prefetching, Prerendering, Precaching — 3 Tầng Navigation Performance

> **Nguồn:** [web.dev/learn/performance/prefetching-prerendering-precaching](https://web.dev/learn/performance/prefetching-prerendering-precaching) — Google Web.dev
>
> Bài này là **tổng hợp hoàn chỉnh** về speculative loading — từ đơn giản (`prefetch`) đến phức tạp (`prerender`) đến offline-first (`precaching` qua Service Worker). Ba kỹ thuật này bổ sung cho nhau và cùng mục tiêu: làm navigation cảm giác instant.

### 3 Kỹ thuật — Tổng quan

```
┌────────────────────────────────────────────────────────────────┐
│ Kỹ thuật     │ Làm gì                    │ Kết quả            │
├────────────────────────────────────────────────────────────────┤
│ PREFETCH      │ Download HTML next page   │ Cache hit on nav   │
│               │ (không execute JS)        │ ~50-70% faster     │
├────────────────────────────────────────────────────────────────┤
│ PRERENDER     │ Render page trong hidden  │ Navigation instant │
│               │ tab (execute JS, load all │ ~95-100% faster    │
│               │ resources)               │                    │
├────────────────────────────────────────────────────────────────┤
│ PRECACHING    │ Service Worker stores     │ Works offline!     │
│ (Service      │ assets at install time    │ Repeat visits: 0ms │
│  Worker)      │ in Cache API             │ network for assets │
└────────────────────────────────────────────────────────────────┘
```

---

### Tier 1: Prefetch — Download Trước cho Navigation Sau

```html
<!-- Link-based prefetch (older approach) -->
<link rel="prefetch" href="/products/123" as="document">

<!-- Speculation Rules API (modern approach) -->
<script type="speculationrules">
{
  "prefetch": [
    {
      "source": "document",
      "where": { "href_matches": "/*" },
      "eagerness": "moderate"
    }
  ]
}
</script>
```

```
Prefetch flow:
  Page A loads → speculationrules found
  Browser (idle time): GET /products/123 HTML → cached
  User clicks link to /products/123
  Browser: "Cache hit! Return cached HTML"
  → LCP of /products/123: Much faster!
  
  Note: ONLY HTML cached (not CSS/JS/images)
  → Still needs to fetch those on navigation
  → But HTML parse starts immediately from cache
```

---

### Tier 2: Prerender — Render Toàn Bộ trong Background

```html
<script type="speculationrules">
{
  "prerender": [
    {
      "source": "list",
      "urls": ["/checkout"],
      "eagerness": "moderate"
    },
    {
      "source": "document",
      "where": {
        "and": [
          { "href_matches": "/products/*" },
          { "not": { "selector_matches": ".no-prerender" } }
        ]
      },
      "eagerness": "conservative"
    }
  ]
}
</script>
```

```
Prerender vs Prefetch deep comparison:
┌────────────────────────────────────────────────────────────┐
│                  │ Prefetch         │ Prerender            │
├────────────────────────────────────────────────────────────┤
│ Downloads        │ HTML only        │ HTML + CSS + JS      │
│                  │                  │ + images             │
│ Executes JS      │ No               │ Yes (full page!)     │
│ Network requests │ 1 (HTML)         │ All page resources   │
│ Memory usage     │ Low (HTML text)  │ High (rendered page) │
│ CPU usage        │ Low              │ High (JS execution)  │
│ Navigation speed │ ~50-70% faster   │ ~95-100% (instant!)  │
│ Max concurrent   │ Up to 50         │ Max 2-10             │
│ Side effects     │ None (no JS run) │ Yes! (JS runs!)      │
└────────────────────────────────────────────────────────────┘
```

```javascript
// Detect và handle prerendering trong code
// (Important: prevent side effects during prerender!)

// Check if being prerendered:
if (document.prerendering) {
  console.log('Currently being prerendered');
  // Don't send analytics, don't auto-play media, don't start timers!
}

// React to when prerendered page becomes active:
document.addEventListener('prerenderingchange', () => {
  if (!document.prerendering) {
    // Page is NOW active (user navigated here!)
    analytics.track('pageview');  // Safe to track now
    startVideoAutoplay();          // Safe to start now
    initializeChat();              // Safe to start now
  }
});

// useEffect with prerendering guard:
function Page() {
  useEffect(() => {
    // This runs during prerender too!
    // Guard for side effects:
    if (document.prerendering) return;

    analytics.trackPageView();

    // Or listen for activation:
    document.addEventListener('prerenderingchange', () => {
      analytics.trackPageView();
    }, { once: true });
  }, []);
}
```

---

### Tier 3: Precaching — Service Worker + Cache API

**Precaching** = Service Worker pre-downloads + stores assets khi install → sẵn sàng phục vụ ngay từ cache, không cần network.

```javascript
// service-worker.js — Manual precaching (raw)
const CACHE_NAME = 'app-v1';
const PRECACHE_ASSETS = [
  '/',
  '/offline.html',
  '/styles/main.css',
  '/scripts/app.js',
  '/fonts/inter.woff2',
  '/images/logo.svg',
];

// Install event: Precache critical assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Precaching assets...');
      return cache.addAll(PRECACHE_ASSETS);
      // addAll: fetch ALL → cache ALL → or fail all
      // Use add() individually for fault-tolerant precaching
    })
  );
  // Force new SW to become active immediately
  self.skipWaiting();
});

// Activate event: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    })
  );
  self.clients.claim(); // Take control of all tabs immediately
});

// Fetch event: Serve from cache (cache-first for precached assets)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request);
    })
  );
});
```

---

### Workbox — Recommended Abstraction

```bash
# Install Workbox (production-ready SW library)
npm install workbox-webpack-plugin
# or for Vite:
npm install vite-plugin-pwa
```

```javascript
// vite.config.ts with Workbox (via vite-plugin-pwa)
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        // Precache: Auto-precaches build output files
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],

        // Runtime caching strategies
        runtimeCaching: [
          {
            // API responses: Network-first with cache fallback
            urlPattern: /^https:\/\/api\.myapp\.com\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 5 * 60, // 5 minutes
              },
              networkTimeoutSeconds: 3, // 3s timeout → fallback cache
            },
          },
          {
            // Images: Cache-first (images rarely change)
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days!
              },
            },
          },
          {
            // Fonts: Cache-first, long TTL
            urlPattern: /\.(?:woff|woff2|ttf|eot)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'fonts-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year!
              },
            },
          },
          {
            // Pages: Stale-While-Revalidate (fast + fresh)
            urlPattern: /^https:\/\/myapp\.com\/(?!api)/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'pages-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 24 * 60 * 60, // 1 day
              },
            },
          },
        ],
      },
    }),
  ],
});
```

---

### Caching Strategies — Chi tiết

```
CACHE FIRST (Offline-first):
  Request → Check cache → Found? Return cache
                         Not found? Fetch network → cache → return
  
  Use for: Versioned assets (JS/CSS with hash in filename),
           fonts, images that don't change
  
  Benefit: Fastest possible response (from memory/disk cache)
  Risk: Stale content if cache not invalidated properly
  Mitigation: Use content-hash in filenames!
    /app.abc123.js → hash changes when content changes
    → Old hash URL returns old content (correct!)
    → New hash URL fetches fresh (correct!)

NETWORK FIRST:
  Request → Fetch network (with timeout)
          → Success? Cache + Return fresh
          → Fail? Return cached fallback
  
  Use for: API data, frequently updated pages, personalized content
  Benefit: Always fresh when online, graceful offline fallback
  Risk: Slow on bad connections (waits for network timeout)
  Mitigation: Set aggressive timeout (3-5s)

STALE WHILE REVALIDATE:
  Request → Return cache IMMEDIATELY (fast!)
          → Simultaneously: Fetch network → update cache
          → Next request: Gets fresh cached content
  
  Use for: Social feeds, product listings, blog posts
           (content where slight staleness acceptable)
  Benefit: Instant response + background freshness
  Risk: User may see stale data briefly
  Sweet spot: Most web content!

NETWORK ONLY:
  Request → Always fetch network, no cache
  Use for: POST requests, real-time data, transactions
  
CACHE ONLY:
  Request → Always return cache, never fetch
  Use for: Precached assets in offline mode
```

---

### Next.js: Precaching với next-pwa

```typescript
// next.config.js with next-pwa
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com/,
      handler: 'StaleWhileRevalidate',
      options: { cacheName: 'google-fonts-stylesheets' }
    },
    {
      urlPattern: /^https:\/\/fonts\.gstatic\.com/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-webfonts',
        expiration: { maxEntries: 20, maxAgeSeconds: 31536000 }
      }
    }
  ]
});

module.exports = withPWA({
  // Your Next.js config
});
```

---

### Putting It All Together — 3-Layer Strategy

```
Full navigation performance stack:

Layer 1: PRECACHING (Service Worker)
  → Static assets (JS, CSS, fonts): Instant from cache
  → No network for repeat visits!
  
Layer 2: PREFETCH (Speculation Rules)
  → Next page HTML: Cached on hover/load
  → Navigation: Cache hit instead of network
  
Layer 3: PRERENDER (Speculation Rules)
  → Specific high-confidence pages (checkout, product detail)
  → Navigation: Instant (already rendered!)

Implementation priority:
  1. First: Implement caching (biggest ongoing impact)
     → Every repeat visit benefits
     
  2. Second: Route prefetch (link-based or speculation rules)
     → Every navigation faster
     
  3. Third: Prerender high-value pages
     → Checkout, key product pages = instant
```

```
Impact comparison for E-commerce:

WITHOUT any speculative loading (baseline):
  First visit to /products: 3.5s LCP
  Navigation to /product/123: 2.0s LCP
  
WITH prefetch (Speculation Rules):
  First visit: 3.5s LCP (no change)
  Navigation: 0.8s LCP (from cache!) ← 60% faster

WITH prerender (Speculation Rules):
  First visit: 3.5s LCP (no change)
  Navigation: ~0ms (instant!) ← 100% faster

WITH precaching (Service Worker):
  First visit: 3.5s LCP (no change)
  Repeat visit: 0.3s LCP (from SW cache!) ← 91% faster
  Navigation: 0.5s LCP (SW + prefetch) ← 75% faster
  Offline: Works! ← New capability

Combined (all 3):
  Repeat visit home: 0.3s LCP
  Navigation product: ~0ms (prerendered!)
  Offline: Graceful fallback
```

---

### Summary

```
Prefetch vs Prerender vs Precaching:
┌────────────────────────────────────────────────────────────────┐
│                │ Prefetch    │ Prerender   │ Precaching        │
├────────────────────────────────────────────────────────────────┤
│ Technology     │ link/SR API │ SR API      │ Service Worker    │
│ When           │ On hover/   │ On hover/   │ On SW install     │
│                │ page load   │ page load   │ (once)            │
│ What cached    │ HTML only   │ Full page   │ Static assets     │
│ Impact         │ Fast nav    │ Instant nav │ Fast repeat visits│
│ Offline?       │ No          │ No          │ Yes!              │
│ Risk           │ Wasted      │ Side        │ Stale content     │
│                │ bandwidth   │ effects!    │                   │
│ Use for        │ All internal│ Checkout,   │ JS/CSS/fonts/     │
│                │ links       │ key pages   │ images            │
└────────────────────────────────────────────────────────────────┘

Recommendation:
  All apps: Implement SW precaching (via Workbox/vite-plugin-pwa)
  Content sites: Add Speculation Rules prefetch (all internal links)
  E-commerce: Add Speculation Rules prerender for /checkout
  PWAs: Full Service Worker with runtime caching strategies
```


---

## Deep Dive: Web Worker Overview — JavaScript Off the Main Thread

> **Nguồn:** [web.dev/learn/performance/web-worker-overview](https://web.dev/learn/performance/web-worker-overview) — Google Web.dev
>
> Bài này là **entry point** của chuỗi Web Worker trên web.dev Learn Performance — giải thích WHY (tại sao cần workers), WHAT (workers là gì), và WHEN (khi nào dùng). Khác với bài Off-Main-Thread đã cover implementation chi tiết, bài này focus vào **mental model và decision making**.

### Tại sao Main Thread là Bottleneck

```
JavaScript là single-threaded — một thread làm TẤT CẢ:

Main Thread responsibilities:
┌────────────────────────────────────────────────────────────┐
│  User Input Handling    │ Click, keyboard, touch           │
│  JavaScript Execution   │ Your app code                   │
│  Style Calculations     │ CSS matching                    │
│  Layout                 │ Position/size computation        │
│  Paint                  │ Pixel rendering                  │
│  Compositing            │ Layer combining                  │
│  Network Callbacks      │ fetch().then() handlers          │
│  GC (Garbage Collection)│ Memory cleanup                  │
└────────────────────────────────────────────────────────────┘

Budget per frame: 16ms (60fps)
If ANY task > 16ms → Frame dropped → Jank!
If ANY task > 50ms → Long Task → INP suffers!

Problem: CPU-intensive JS eats into this budget:
  Sort 100,000 records:   ~200ms → blocks 12 frames!
  Parse large JSON:       ~100ms → blocks 6 frames!
  Image processing:       ~500ms → frozen UI!
```

---

### Web Worker — Giải pháp Parallel Execution

```
With Web Workers:
┌─────────────────────────────────────────────────────────────────┐
│ Main Thread:                                                    │
│   Handle clicks → Update UI → Run React rendering              │
│   Budget: 16ms ← PROTECTED! (no heavy computation here)        │
│                              ↕ postMessage                      │
│ Worker Thread:                                                  │
│   Sort data → Parse JSON → Process images → Complex math        │
│   No budget limit! Can run for seconds without affecting UI!    │
└─────────────────────────────────────────────────────────────────┘

Result:
  User: Smooth 60fps animations ← Main thread free
  App:  Complex computations happening ← Worker thread busy
  Net:  BOTH happen simultaneously! (true parallelism)
```

---

### Worker Types — Dedicated vs Shared

```
Dedicated Worker:
  - 1 worker ↔ 1 document (1:1 relationship)
  - Most common type
  - Created: new Worker('./worker.js')
  - Use for: Page-specific heavy computation

Shared Worker:
  - 1 worker ↔ Multiple tabs/windows (1:N)
  - Complex: multiple clients connect via MessagePort
  - Created: new SharedWorker('./shared-worker.js')
  - Use for: Shared state across tabs, single WebSocket

Service Worker:
  - Intercepts network requests (different purpose!)
  - Not for computation offloading
  - Covered in Precaching section above

Which to use?
  Heavy computation for current page → Dedicated Worker ← Common
  Shared computation across tabs → Shared Worker ← Rare
  Network/caching → Service Worker ← Covered separately
```

---

### Anatomy of a Web Worker

```javascript
// ============== MAIN THREAD ==============
// main.js

// Create worker
const worker = new Worker(
  new URL('./worker.js', import.meta.url),
  { type: 'module' }  // Enable ES modules in worker
);

// Send data TO worker
worker.postMessage({
  type: 'SORT_DATA',
  payload: largeArray
});

// Receive results FROM worker
worker.onmessage = (event) => {
  const { type, result } = event.data;
  if (type === 'SORT_RESULT') {
    setSortedData(result);
  }
};

// Error handling
worker.onerror = (error) => {
  console.error('Worker error:', error);
};

// Cleanup
// worker.terminate(); // When done (avoid memory leaks!)


// ============== WORKER THREAD ==============
// worker.js

// Receive data from main thread
self.onmessage = (event) => {
  const { type, payload } = event.data;

  if (type === 'SORT_DATA') {
    // Heavy work — happens in worker, doesn't block UI!
    const result = payload.sort((a, b) => a.value - b.value);

    // Send result back
    self.postMessage({
      type: 'SORT_RESULT',
      result
    });
  }
};
```

```
postMessage data transfer:
  Data is COPIED (structured clone algorithm) by default:
    Main → Worker: copy of data
    Worker → Main: copy of result
    
  Cost: Proportional to data size
    Small data (< 1MB): Negligible
    Large data (100MB): Noticeable (100ms+)
    
  Solution for large data: Transferable Objects (zero-copy!)
    worker.postMessage(buffer, [buffer]); // Transfer, not copy!
    → buffer moved to worker (main can't access anymore)
    → Zero serialization cost!
    
  Transferable types:
    ArrayBuffer, MessagePort, ReadableStream,
    WritableStream, ImageBitmap, OffscreenCanvas
```

---

### Khi nào dùng Web Worker — Decision Framework

```
Worker decision tree:

Task takes > 50ms on main thread?
  NO  → Keep on main thread (overhead > benefit)
  YES → Continue...

Task needs DOM access?
  YES → Cannot use Worker (DOM = main thread only)
       → Consider: scheduler.yield() or startTransition instead
  NO  → Continue...

Task is CPU-bound (computation)?
  YES → Web Worker ← STRONG candidate!
  NO  → Network-bound? → Use fetch() directly (async, non-blocking)

Can task be broken into smaller chunks?
  YES → Consider: scheduler.yield() between chunks first
       (simpler than Worker setup)
  NO  → Definitely Web Worker

Use Worker when:
  ✅ Data processing: Sort/filter 10,000+ items
  ✅ JSON parsing: Large payloads (> 1MB)
  ✅ Image manipulation: Resize, filter, compress
  ✅ Cryptography: hashing, encryption
  ✅ WebAssembly execution (wasm runs great in workers!)
  ✅ Scientific computing: simulations, ML inference
  ✅ Text processing: search indexing, NLP
  ✅ File processing: CSV/Excel parsing, zip/unzip

DON'T use Worker when:
  ❌ Task < 10ms (overhead = wasted effort)
  ❌ Task needs DOM (impossible!)
  ❌ Simple async operations (fetch, setTimeout = already non-blocking)
  ❌ Very small datasets (postMessage overhead > computation time)
```

---

### React Integration Pattern

```typescript
// useWorker hook — reusable pattern for React
function useWorker<TInput, TOutput>(
  workerFactory: () => Worker
): {
  run: (data: TInput) => Promise<TOutput>;
  isLoading: boolean;
} {
  const workerRef = useRef<Worker | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Create worker on mount
    workerRef.current = workerFactory();

    return () => {
      // Terminate on unmount (prevent leaks!)
      workerRef.current?.terminate();
    };
  }, []);

  const run = useCallback((data: TInput): Promise<TOutput> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        reject(new Error('Worker not initialized'));
        return;
      }

      setIsLoading(true);

      const handleMessage = (event: MessageEvent) => {
        resolve(event.data as TOutput);
        setIsLoading(false);
        workerRef.current?.removeEventListener('message', handleMessage);
        workerRef.current?.removeEventListener('error', handleError);
      };

      const handleError = (error: ErrorEvent) => {
        reject(error);
        setIsLoading(false);
        workerRef.current?.removeEventListener('message', handleMessage);
        workerRef.current?.removeEventListener('error', handleError);
      };

      workerRef.current.addEventListener('message', handleMessage);
      workerRef.current.addEventListener('error', handleError);
      workerRef.current.postMessage(data);
    });
  }, []);

  return { run, isLoading };
}

// Usage: Sort large dataset
const sortWorker = new Worker(new URL('./sort.worker.ts', import.meta.url));
const { run: sortData, isLoading } = useWorker(() => sortWorker);

function DataTable({ rawData }: { rawData: Item[] }) {
  const [sorted, setSorted] = useState<Item[]>([]);

  const handleSort = async (field: string) => {
    // Non-blocking! UI stays responsive while worker sorts
    const result = await sortData({ data: rawData, field });
    setSorted(result);
  };

  return (
    <div>
      {isLoading && <div>Sorting... (in background)</div>}
      <SortButton onClick={() => handleSort('name')} />
      <Table data={sorted} />
    </div>
  );
}
```

---

### Worker Performance: Benchmarks

```
Real-world benchmark: Sort 100,000 objects by 3 fields

ON MAIN THREAD:
  Sort time:       300ms
  UI freeze:       300ms ← User sees frozen interface!
  Dropped frames:  ~18 frames (300ms / 16ms)
  INP:             300ms+ (Poor!)

IN WEB WORKER:
  Sort time:       305ms (5ms overhead for postMessage)
  UI freeze:       ~0ms ← UI remains smooth!
  Dropped frames:  0
  INP:             < 50ms (just the state update) ← Excellent!

Parse 5MB JSON:
  Main thread:     200ms freeze
  Worker:          200ms in background, 5ms postMessage = 205ms total
  INP improvement: 200ms → 5ms = 97.5% better!

Image grayscale (2000×1500 px):
  Main thread:     800ms freeze
  Worker (ArrayBuffer transfer): 805ms, 0ms UI freeze
  Transferable: postMessage = ~1ms (zero copy!)
```

---

### What Workers CANNOT Do

```
Workers cannot access:
  ❌ DOM: document, document.getElementById, element.style...
  ❌ window object (partially: no window.alert, window.location...)
  ❌ localStorage, sessionStorage
  ❌ Cookies (document.cookie)
  ❌ Parent scope variables

Workers CAN access:
  ✅ fetch() (network requests!)
  ✅ WebSockets
  ✅ IndexedDB (full access!)
  ✅ Cache API (Service Worker style caching)
  ✅ WebAssembly
  ✅ Canvas (via OffscreenCanvas)
  ✅ Crypto API
  ✅ Performance API
  ✅ console.log (for debugging)
  ✅ setTimeout, setInterval
  ✅ ES6+ (import/export with type: 'module')

Architecture pattern for DOM updates from Worker:
  Worker computes result
  → postMessage result to main thread
  → Main thread receives → updates React state
  → React re-renders → DOM updated
  (Never directly from Worker!)
```

---

### Summary: Web Workers Mental Model

```
Core mental model:
  "Move computation OFF the main thread,
   ONLY bring results BACK to main thread"

Decision:
  Task > 50ms AND no DOM access → WEB WORKER

Communication pattern:
  Main → Worker: postMessage(data)
  Worker → Main: self.postMessage(result)
  
  Large binary data: Use Transferables (zero-copy!)
  Small structured data: Regular postMessage (auto clone)
  Complex API: Use Comlink (covered in Off-Main-Thread guide)

Lifecycle:
  new Worker(url) → Ready
  worker.postMessage() → Running
  worker.terminate() → Done (always cleanup!)
  
Memory leak prevention:
  Terminate worker when React component unmounts
  Don't create workers per-render (create once, reuse!)
  
Next steps (deeper dives):
  → "Off-Main-Thread Architecture" section (earlier in this guide)
    covers: Comlink, Worker Pool, Transferables, OffscreenCanvas
```

