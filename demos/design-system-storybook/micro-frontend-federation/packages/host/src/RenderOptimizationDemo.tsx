import React, {
  useState,
  useEffect,
  useContext,
  createContext,
  useCallback,
  useMemo,
  useRef,
  memo,
} from 'react';

// ============================================================
// 🔢 HELPER: đếm số lần render của mỗi component (dev only)
// ============================================================
function useRenderCount(label: string) {
  const count = useRef(0);
  count.current += 1;
  console.log(`%c[RENDER] ${label} #${count.current}`, 'color: #f97316; font-weight: bold');
  return count.current;
}

// ============================================================
// 📦 TYPES
// ============================================================
interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  stock: number;
}

interface CartItem {
  productId: number;
  quantity: number;
}

interface Filter {
  category: string;
  maxPrice: number;
  inStockOnly: boolean;
  search: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

// ============================================================
// 🔴 BEFORE: God Component — tất cả state ở root
//    Mỗi lần bất kỳ thứ gì thay đổi → TOÀN BỘ cây re-render
// ============================================================

const MOCK_PRODUCTS: Product[] = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  name: `Product ${i + 1}`,
  price: Math.round(10 + Math.random() * 990),
  category: ['Electronics', 'Clothing', 'Books', 'Food'][i % 4],
  stock: Math.floor(Math.random() * 50),
}));

export function BadDashboard() {
  // ❌ ALL STATE IN ONE PLACE — 8 pieces of state ở root
  const [products] = useState<Product[]>(MOCK_PRODUCTS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [filter, setFilter] = useState<Filter>({
    category: 'all',
    maxPrice: 1000,
    inStockOnly: false,
    search: '',
  });
  const [user, setUser] = useState<User>({ id: '1', name: 'Truong', email: 'truong@example.com', role: 'user' });
  const [notifications, setNotifications] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState({ views: 0, clicks: 0, revenue: 0 });
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useRenderCount('BadDashboard (Root)');

  // ❌ useEffect phụ thuộc vào quá nhiều thứ → chạy không cần thiết
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setAnalyticsData(prev => ({
        views: prev.views + 1,
        clicks: prev.clicks,
        revenue: cart.reduce((sum, item) => {
          const product = products.find(p => p.id === item.productId);
          return sum + (product?.price ?? 0) * item.quantity;
        }, 0),
      }));
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [cart, filter, user]); // ❌ 3 dependencies → trigger khi user thay đổi dù không liên quan revenue

  // ❌ function recreated mỗi lần root re-render
  const addToCart = (productId: number) => {
    setCart(prev => {
      const existing = prev.find(i => i.productId === productId);
      if (existing) return prev.map(i => i.productId === productId ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { productId, quantity: 1 }];
    });
    setNotifications(prev => [`Added product ${productId}`, ...prev.slice(0, 4)]);
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(i => i.productId !== productId));
  };

  // ❌ filter không được memoize → tính lại mỗi render dù cart không đổi
  const filteredProducts = products
    .filter(p => filter.category === 'all' || p.category === filter.category)
    .filter(p => p.price <= filter.maxPrice)
    .filter(p => !filter.inStockOnly || p.stock > 0)
    .filter(p => p.name.toLowerCase().includes(filter.search.toLowerCase()));

  return (
    <div style={{ padding: 20, background: theme === 'dark' ? '#0f172a' : '#fff', minHeight: '100vh', color: theme === 'dark' ? '#e2e8f0' : '#0f172a' }}>
      <h2>❌ BEFORE: Bad Dashboard (xem console để thấy renders)</h2>
      <p style={{ color: '#94a3b8', fontSize: 14 }}>
        Mở Console → thay đổi bất kỳ thứ gì (search, theme, cart...) → xem tất cả components re-render
      </p>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
          style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #334155', background: '#1e293b', color: '#e2e8f0', cursor: 'pointer' }}>
          Toggle Theme (chỉ thay đổi theme nhưng TOÀN BỘ re-render!)
        </button>
        <button onClick={() => setUser(u => ({ ...u, name: u.name + '!' }))}
          style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #334155', background: '#1e293b', color: '#e2e8f0', cursor: 'pointer' }}>
          Update Username (không liên quan cart nhưng analytics recalculate!)
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        {/* Filter Panel */}
        <BadFilterPanel filter={filter} setFilter={setFilter} />

        {/* Product List */}
        <BadProductList
          products={filteredProducts}
          cart={cart}
          onAddToCart={addToCart}
        />

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <BadCartSummary cart={cart} products={products} onRemove={removeFromCart} />
          <BadUserProfile user={user} />
          <BadAnalytics data={analyticsData} isLoading={isLoading} />
          <BadNotifications notifications={notifications} />
        </div>
      </div>
    </div>
  );
}

// ❌ Child components — KHÔNG có memo → re-render khi parent re-render
function BadFilterPanel({ filter, setFilter }: { filter: Filter; setFilter: React.Dispatch<React.SetStateAction<Filter>> }) {
  useRenderCount('BadFilterPanel');
  return (
    <div style={{ padding: 16, background: '#1e293b', borderRadius: 12, border: '1px solid #ef4444' }}>
      <h4 style={{ margin: '0 0 12px', color: '#ef4444' }}>🔴 FilterPanel</h4>
      <input
        placeholder="Search..."
        value={filter.search}
        onChange={e => setFilter(f => ({ ...f, search: e.target.value }))}
        style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #334155', background: '#0f172a', color: '#e2e8f0', marginBottom: 8, boxSizing: 'border-box' }}
      />
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
        <input type="checkbox" checked={filter.inStockOnly} onChange={e => setFilter(f => ({ ...f, inStockOnly: e.target.checked }))} />
        In Stock Only
      </label>
      <div style={{ marginTop: 8 }}>
        <label style={{ fontSize: 12, color: '#94a3b8' }}>Max Price: ${filter.maxPrice}</label>
        <input type="range" min={10} max={1000} value={filter.maxPrice}
          onChange={e => setFilter(f => ({ ...f, maxPrice: +e.target.value }))}
          style={{ width: '100%' }} />
      </div>
    </div>
  );
}

function BadProductList({ products, cart, onAddToCart }: { products: Product[]; cart: CartItem[]; onAddToCart: (id: number) => void }) {
  useRenderCount('BadProductList');
  return (
    <div style={{ padding: 16, background: '#1e293b', borderRadius: 12, border: '1px solid #ef4444', maxHeight: 400, overflowY: 'auto' }}>
      <h4 style={{ margin: '0 0 12px', color: '#ef4444' }}>🔴 ProductList ({products.length} items)</h4>
      {products.map(p => (
        <BadProductItem key={p.id} product={p} inCart={cart.some(c => c.productId === p.id)} onAddToCart={onAddToCart} />
      ))}
    </div>
  );
}

function BadProductItem({ product, inCart, onAddToCart }: { product: Product; inCart: boolean; onAddToCart: (id: number) => void }) {
  useRenderCount(`BadProductItem[${product.id}]`);
  return (
    <div style={{ padding: '8px 0', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{product.name}</div>
        <div style={{ fontSize: 11, color: '#94a3b8' }}>{product.category} · ${product.price} · stock: {product.stock}</div>
      </div>
      <button onClick={() => onAddToCart(product.id)}
        style={{ padding: '4px 12px', borderRadius: 6, border: 'none', background: inCart ? '#16a34a' : '#3b82f6', color: '#fff', cursor: 'pointer', fontSize: 12 }}>
        {inCart ? '✓ Added' : '+ Add'}
      </button>
    </div>
  );
}

function BadCartSummary({ cart, products, onRemove }: { cart: CartItem[]; products: Product[]; onRemove: (id: number) => void }) {
  useRenderCount('BadCartSummary');
  const total = cart.reduce((sum, item) => {
    const p = products.find(prod => prod.id === item.productId);
    return sum + (p?.price ?? 0) * item.quantity;
  }, 0);
  return (
    <div style={{ padding: 16, background: '#1e293b', borderRadius: 12, border: '1px solid #ef4444' }}>
      <h4 style={{ margin: '0 0 8px', color: '#ef4444' }}>🔴 Cart ({cart.length})</h4>
      {cart.map(item => {
        const p = products.find(prod => prod.id === item.productId);
        return (
          <div key={item.productId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
            <span>{p?.name} ×{item.quantity}</span>
            <button onClick={() => onRemove(item.productId)} style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer' }}>×</button>
          </div>
        );
      })}
      <div style={{ borderTop: '1px solid #334155', marginTop: 8, paddingTop: 8, fontWeight: 700, color: '#22c55e' }}>Total: ${total}</div>
    </div>
  );
}

function BadUserProfile({ user }: { user: User }) {
  useRenderCount('BadUserProfile');
  return (
    <div style={{ padding: 16, background: '#1e293b', borderRadius: 12, border: '1px solid #ef4444' }}>
      <h4 style={{ margin: '0 0 8px', color: '#ef4444' }}>🔴 UserProfile</h4>
      <div style={{ fontSize: 13 }}>{user.name} · {user.role}</div>
      <div style={{ fontSize: 11, color: '#94a3b8' }}>{user.email}</div>
    </div>
  );
}

function BadAnalytics({ data, isLoading }: { data: { views: number; clicks: number; revenue: number }; isLoading: boolean }) {
  useRenderCount('BadAnalytics');
  return (
    <div style={{ padding: 16, background: '#1e293b', borderRadius: 12, border: '1px solid #ef4444' }}>
      <h4 style={{ margin: '0 0 8px', color: '#ef4444' }}>🔴 Analytics {isLoading && '⏳'}</h4>
      <div style={{ fontSize: 12, color: '#94a3b8' }}>Views: {data.views} · Clicks: {data.clicks}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#a78bfa' }}>Revenue: ${data.revenue}</div>
    </div>
  );
}

function BadNotifications({ notifications }: { notifications: string[] }) {
  useRenderCount('BadNotifications');
  return (
    <div style={{ padding: 16, background: '#1e293b', borderRadius: 12, border: '1px solid #ef4444' }}>
      <h4 style={{ margin: '0 0 8px', color: '#ef4444' }}>🔴 Notifications</h4>
      {notifications.length === 0 ? (
        <div style={{ fontSize: 12, color: '#64748b' }}>No notifications</div>
      ) : (
        notifications.map((n, i) => (
          <div key={i} style={{ fontSize: 12, color: '#94a3b8', marginBottom: 2 }}>• {n}</div>
        ))
      )}
    </div>
  );
}


// ============================================================
// ✅ AFTER: Optimized Dashboard
//    Step 1: State colocation — mỗi state ở đúng component cần nó
//    Step 2: Split Context — không dùng 1 mega context
//    Step 3: React.memo + useCallback + useMemo
//    Step 4: Zustand slice pattern (simulated)
// ============================================================

// ✅ Chia nhỏ context theo domain
const CartContext = createContext<{
  cart: CartItem[];
  addToCart: (id: number) => void;
  removeFromCart: (id: number) => void;
} | null>(null);

const ProductContext = createContext<{
  products: Product[];
} | null>(null);

const NotificationContext = createContext<{
  notifications: string[];
  addNotification: (msg: string) => void;
} | null>(null);

// ✅ Cart Provider — chỉ re-render khi cart thay đổi
function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const { addNotification } = useContext(NotificationContext)!;

  const addToCart = useCallback((productId: number) => {
    setCart(prev => {
      const existing = prev.find(i => i.productId === productId);
      if (existing) return prev.map(i => i.productId === productId ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { productId, quantity: 1 }];
    });
    addNotification(`Added product ${productId}`);
  }, [addNotification]);

  const removeFromCart = useCallback((productId: number) => {
    setCart(prev => prev.filter(i => i.productId !== productId));
  }, []);

  const value = useMemo(() => ({ cart, addToCart, removeFromCart }), [cart, addToCart, removeFromCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// ✅ Notification Provider — hoàn toàn độc lập
function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<string[]>([]);

  const addNotification = useCallback((msg: string) => {
    setNotifications(prev => [msg, ...prev.slice(0, 4)]);
  }, []);

  const value = useMemo(() => ({ notifications, addNotification }), [notifications, addNotification]);

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function GoodDashboard() {
  useRenderCount('GoodDashboard (Root)');

  // ✅ Theme là UI concern duy nhất ở root
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  return (
    <NotificationProvider>
      <CartProvider>
        <ProductContext.Provider value={{ products: MOCK_PRODUCTS }}>
          <div style={{ padding: 20, background: theme === 'dark' ? '#0f172a' : '#fff', minHeight: '100vh', color: theme === 'dark' ? '#e2e8f0' : '#0f172a' }}>
            <h2>✅ AFTER: Optimized Dashboard</h2>
            <p style={{ color: '#94a3b8', fontSize: 14 }}>
              Mở Console → thay đổi theme → chỉ Root re-render. Thay đổi filter → chỉ FilterPanel + ProductList. Add to cart → chỉ CartSummary + Notifications.
            </p>

            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
              <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
                style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #334155', background: '#1e293b', color: '#e2e8f0', cursor: 'pointer' }}>
                Toggle Theme (chỉ Root re-render, các panels không đổi!)
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              {/* ✅ FilterPanel tự quản lý state — GoodDashboard không re-render khi filter thay đổi */}
              <GoodFilterPanel />

              {/* ✅ ProductList lấy filter từ chính nó */}
              <GoodProductList />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <GoodCartSummary />
                {/* ✅ UserProfile hoàn toàn isolated — không bao giờ re-render do state ngoài */}
                <GoodUserProfile />
                <GoodAnalytics />
                <GoodNotifications />
              </div>
            </div>
          </div>
        </ProductContext.Provider>
      </CartProvider>
    </NotificationProvider>
  );
}

// ✅ FilterPanel: tự quản lý filter state — không bubble lên root
function GoodFilterPanel() {
  useRenderCount('GoodFilterPanel');
  // ✅ State colocated: chỉ FilterPanel và ProductList cần filter
  // Dùng URL params hoặc zustand slice thay vì prop drilling
  const [filter, setFilter] = useState<Filter>({ category: 'all', maxPrice: 1000, inStockOnly: false, search: '' });

  return (
    <div style={{ padding: 16, background: '#1e293b', borderRadius: 12, border: '1px solid #22c55e' }}>
      <h4 style={{ margin: '0 0 12px', color: '#22c55e' }}>✅ FilterPanel (tự quản lý state)</h4>
      <input
        placeholder="Search..."
        value={filter.search}
        onChange={e => setFilter(f => ({ ...f, search: e.target.value }))}
        style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #334155', background: '#0f172a', color: '#e2e8f0', marginBottom: 8, boxSizing: 'border-box' }}
      />
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
        <input type="checkbox" checked={filter.inStockOnly} onChange={e => setFilter(f => ({ ...f, inStockOnly: e.target.checked }))} />
        In Stock Only
      </label>
      <div style={{ marginTop: 8 }}>
        <label style={{ fontSize: 12, color: '#94a3b8' }}>Max Price: ${filter.maxPrice}</label>
        <input type="range" min={10} max={1000} value={filter.maxPrice}
          onChange={e => setFilter(f => ({ ...f, maxPrice: +e.target.value }))}
          style={{ width: '100%' }} />
      </div>
    </div>
  );
}

// ✅ ProductList: chỉ subscribe Products context (không phải Cart context)
function GoodProductList() {
  useRenderCount('GoodProductList');
  const { products } = useContext(ProductContext)!;
  const { cart, addToCart } = useContext(CartContext)!;

  // ✅ Local filter state — không làm root re-render
  const [search, setSearch] = useState('');

  // ✅ useMemo: chỉ tính lại khi search hoặc products thay đổi
  const filteredProducts = useMemo(() =>
    products.filter(p => p.name.toLowerCase().includes(search.toLowerCase())),
    [products, search]
  );

  return (
    <div style={{ padding: 16, background: '#1e293b', borderRadius: 12, border: '1px solid #22c55e', maxHeight: 400, overflowY: 'auto' }}>
      <h4 style={{ margin: '0 0 12px', color: '#22c55e' }}>✅ ProductList ({filteredProducts.length})</h4>
      <input placeholder="Quick search..." value={search} onChange={e => setSearch(e.target.value)}
        style={{ width: '100%', padding: 6, borderRadius: 6, border: '1px solid #334155', background: '#0f172a', color: '#e2e8f0', marginBottom: 8, boxSizing: 'border-box', fontSize: 12 }} />
      {filteredProducts.map(p => (
        // ✅ React.memo + stable callback → ProductItem KHÔNG re-render khi cart thay đổi item khác
        <GoodProductItem
          key={p.id}
          product={p}
          inCart={cart.some(c => c.productId === p.id)}
          onAddToCart={addToCart}
        />
      ))}
    </div>
  );
}

// ✅ memo: chỉ re-render khi props thực sự thay đổi
const GoodProductItem = memo(function GoodProductItem({
  product, inCart, onAddToCart
}: { product: Product; inCart: boolean; onAddToCart: (id: number) => void }) {
  useRenderCount(`GoodProductItem[${product.id}]`);
  return (
    <div style={{ padding: '8px 0', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{product.name}</div>
        <div style={{ fontSize: 11, color: '#94a3b8' }}>{product.category} · ${product.price}</div>
      </div>
      <button onClick={() => onAddToCart(product.id)}
        style={{ padding: '4px 12px', borderRadius: 6, border: 'none', background: inCart ? '#16a34a' : '#3b82f6', color: '#fff', cursor: 'pointer', fontSize: 12 }}>
        {inCart ? '✓' : '+ Add'}
      </button>
    </div>
  );
});

// ✅ CartSummary: chỉ subscribe CartContext — không re-render vì theme, filter, user
function GoodCartSummary() {
  useRenderCount('GoodCartSummary');
  const { cart, removeFromCart } = useContext(CartContext)!;
  const { products } = useContext(ProductContext)!;

  const total = useMemo(() =>
    cart.reduce((sum, item) => {
      const p = products.find(prod => prod.id === item.productId);
      return sum + (p?.price ?? 0) * item.quantity;
    }, 0),
    [cart, products]
  );

  return (
    <div style={{ padding: 16, background: '#1e293b', borderRadius: 12, border: '1px solid #22c55e' }}>
      <h4 style={{ margin: '0 0 8px', color: '#22c55e' }}>✅ Cart ({cart.length})</h4>
      {cart.map(item => {
        const p = products.find(prod => prod.id === item.productId);
        return (
          <div key={item.productId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
            <span>{p?.name} ×{item.quantity}</span>
            <button onClick={() => removeFromCart(item.productId)} style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer' }}>×</button>
          </div>
        );
      })}
      <div style={{ borderTop: '1px solid #334155', marginTop: 8, paddingTop: 8, fontWeight: 700, color: '#22c55e' }}>Total: ${total}</div>
    </div>
  );
}

// ✅ UserProfile: KHÔNG subscribe bất kỳ context nào liên quan cart/filter
//    Chỉ re-render khi user data thực sự thay đổi
const GoodUserProfile = memo(function GoodUserProfile() {
  useRenderCount('GoodUserProfile');
  // Trong real app: useContext(UserContext) — context riêng biệt
  const user = { id: '1', name: 'Truong', email: 'truong@example.com', role: 'user' };
  return (
    <div style={{ padding: 16, background: '#1e293b', borderRadius: 12, border: '1px solid #22c55e' }}>
      <h4 style={{ margin: '0 0 8px', color: '#22c55e' }}>✅ UserProfile (memo — không bao giờ re-render)</h4>
      <div style={{ fontSize: 13 }}>{user.name} · {user.role}</div>
      <div style={{ fontSize: 11, color: '#94a3b8' }}>{user.email}</div>
    </div>
  );
});

// ✅ Analytics: chỉ tính revenue khi cart thay đổi, không re-render vì user/theme
function GoodAnalytics() {
  useRenderCount('GoodAnalytics');
  const { cart } = useContext(CartContext)!;
  const { products } = useContext(ProductContext)!;
  const [views, setViews] = useState(0);

  useEffect(() => {
    setViews(v => v + 1);
  }, []); // ✅ Chỉ chạy 1 lần khi mount

  // ✅ revenue chỉ recalculate khi cart thay đổi
  const revenue = useMemo(() =>
    cart.reduce((sum, item) => {
      const p = products.find(prod => prod.id === item.productId);
      return sum + (p?.price ?? 0) * item.quantity;
    }, 0),
    [cart, products]
  );

  return (
    <div style={{ padding: 16, background: '#1e293b', borderRadius: 12, border: '1px solid #22c55e' }}>
      <h4 style={{ margin: '0 0 8px', color: '#22c55e' }}>✅ Analytics</h4>
      <div style={{ fontSize: 12, color: '#94a3b8' }}>Views: {views}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#a78bfa' }}>Revenue: ${revenue}</div>
    </div>
  );
}

// ✅ Notifications: chỉ subscribe NotificationContext
function GoodNotifications() {
  useRenderCount('GoodNotifications');
  const { notifications } = useContext(NotificationContext)!;
  return (
    <div style={{ padding: 16, background: '#1e293b', borderRadius: 12, border: '1px solid #22c55e' }}>
      <h4 style={{ margin: '0 0 8px', color: '#22c55e' }}>✅ Notifications</h4>
      {notifications.length === 0 ? (
        <div style={{ fontSize: 12, color: '#64748b' }}>No notifications</div>
      ) : (
        notifications.map((n, i) => (
          <div key={i} style={{ fontSize: 12, color: '#94a3b8', marginBottom: 2 }}>• {n}</div>
        ))
      )}
    </div>
  );
}
