# React Router — Nguyên lý hoạt động & Dynamic Loading — Deep Dive

> 📅 2026-02-13 · ⏱ 20 phút đọc
>
> Nguyên lý bên dưới React Router: History API, Hash vs Browser Router,
> Route Matching, Dynamic Loading (React.lazy, Code Splitting, Suspense)
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Must-know React Interview

---

## Mục Lục

| #   | Phần                                           |
| --- | ---------------------------------------------- |
| 1   | SPA Routing — Tại sao cần Client-Side Routing? |
| 2   | Hai cơ chế nền tảng: Hash vs History API       |
| 3   | React Router — Kiến trúc tổng quan             |
| 4   | BrowserRouter — Nguyên lý bên dưới             |
| 5   | HashRouter — Nguyên lý bên dưới                |
| 6   | Route Matching — Thuật toán khớp đường dẫn     |
| 7   | Tự triển khai Mini Router                      |
| 8   | Dynamic Loading — Nguyên lý & Triển khai       |
| 9   | React.lazy + Suspense + Code Splitting         |
| 10  | Tổng kết & Checklist phỏng vấn                 |

---

## §1. SPA Routing — Tại sao cần Client-Side Routing?

```
TRƯỚC KHI CÓ SPA (Multi-Page Application):
═══════════════════════════════════════════════════════════════

  User click link → Browser gửi request → Server trả HTML MỚI
  → Toàn bộ trang RELOAD! Trắng màn hình! Chậm!

  /home   → Server trả home.html (reload toàn trang)
  /about  → Server trả about.html (reload toàn trang)
  /users  → Server trả users.html (reload toàn trang)

  SPA (Single-Page Application):
  → Chỉ load 1 HTML duy nhất (index.html)
  → JavaScript thay đổi NỘI DUNG mà KHÔNG reload trang!
  → URL thay đổi nhưng KHÔNG gửi request đến server!

  /home   → JS render HomeComponent (không reload!)
  /about  → JS render AboutComponent (không reload!)
  /users  → JS render UsersComponent (không reload!)

  VẤN ĐỀ: Làm sao thay đổi URL mà KHÔNG reload?
  → 2 CÁCH: Hash (#) hoặc History API
```

---

## §2. Hai cơ chế nền tảng: Hash vs History API

### Hash Routing

```
HASH ROUTING (#):
═══════════════════════════════════════════════════════════════

  URL: https://app.com/#/about
                         ↑
                         Hash fragment

  NGUYÊN LÝ:
  → Phần sau # KHÔNG được gửi đến server!
  → Browser KHÔNG reload khi # thay đổi
  → window.onhashchange → lắng nghe thay đổi
  → Đọc hash hiện tại: window.location.hash
```

```javascript
// HASH ROUTING — Cơ chế hoạt động:

// ① Lắng nghe thay đổi hash:
window.addEventListener("hashchange", function (e) {
  console.log("Old URL:", e.oldURL);
  console.log("New URL:", e.newURL);
  console.log("Hash:", window.location.hash);
  renderRoute(window.location.hash);
});

// ② Thay đổi hash:
window.location.hash = "#/about";
// → URL: https://app.com/#/about
// → Trigger hashchange event!
// → Browser KHÔNG reload!

// ③ HTML anchor cũng thay đổi hash:
// <a href="#/about">About</a>
// → Click → hash thay đổi → hashchange fires!

// ④ Simple hash router:
function renderRoute(hash) {
  const routes = {
    "#/": "<h1>Home</h1>",
    "#/about": "<h1>About</h1>",
    "#/users": "<h1>Users</h1>",
  };
  document.getElementById("app").innerHTML = routes[hash] || "<h1>404</h1>";
}
// Khởi tạo:
renderRoute(window.location.hash || "#/");
```

### History API

```
HISTORY API (HTML5):
═══════════════════════════════════════════════════════════════

  URL: https://app.com/about
                       ↑
                       KHÔNG có # → URL sạch đẹp!

  NGUYÊN LÝ:
  → history.pushState() → thêm entry VÀO history stack
  → history.replaceState() → thay thế entry HIỆN TẠI
  → CẢ HAI đều thay đổi URL mà KHÔNG reload!
  → window.onpopstate → lắng nghe khi user nhấn Back/Forward
```

```javascript
// HISTORY API — 3 Methods quan trọng:

// ① pushState — Thêm vào history stack:
history.pushState(
  { page: "about" }, // state object (truyền dữ liệu)
  "", // title (hầu hết browser bỏ qua)
  "/about", // new URL
);
// → URL đổi thành /about
// → KHÔNG reload!
// → KHÔNG trigger popstate! (chỉ pushState)

// ② replaceState — Thay thế entry hiện tại:
history.replaceState({ page: "home" }, "", "/home");
// → URL đổi thành /home
// → Entry cũ bị THAY THẾ (không thêm vào stack)

// ③ popstate — Lắng nghe Back/Forward:
window.addEventListener("popstate", function (e) {
  console.log("State:", e.state); // state từ pushState
  console.log("Path:", window.location.pathname);
  renderRoute(window.location.pathname);
});

// ④ Điều hướng chương trình:
history.back(); // ← Giống nút Back
history.forward(); // → Giống nút Forward
history.go(-2); // ← Lùi 2 bước
```

```
PUSH STATE vs HASH — SO SÁNH:
═══════════════════════════════════════════════════════════════

  ┌──────────────────┬────────────────────┬────────────────────┐
  │                  │ Hash (#)           │ History API        │
  ├──────────────────┼────────────────────┼────────────────────┤
  │ URL              │ /#/about (xấu)     │ /about (đẹp!)      │
  │ Server request   │ ❌ # không gửi     │ ❌ pushState local │
  │ Reload           │ ❌ Không           │ ❌ Không           │
  │ SEO              │ ❌ Kém (# bị skip) │ ✅ Tốt (URL thật) │
  │ Browser support  │ ✅ Mọi browser     │ IE10+              │
  │ Server config    │ ✅ Không cần       │ ⚠️ CẦN cấu hình!  │
  │ Event            │ hashchange         │ popstate           │
  │ State data       │ ❌ Không           │ ✅ pushState(data) │
  └──────────────────┴────────────────────┴────────────────────┘

  ⚠️ HISTORY API CẦN SERVER CONFIG:
  → User refresh /about → Server nhận request /about
  → Server KHÔNG CÓ /about (chỉ có index.html!)
  → → 404 Not Found! 💀
  →→ FIX: Server phải trả index.html cho TẤT CẢ routes!

  # Nginx config:
  location / {
      try_files $uri $uri/ /index.html;
  }
```

---

## §3. React Router — Kiến trúc tổng quan

```
REACT ROUTER ARCHITECTURE:
═══════════════════════════════════════════════════════════════

  3 LỚP KIẾN TRÚC:

  ┌─────────────────────────────────────────────────────────┐
  │ LAYER 3: Components (API cho developer)                │
  │ <Route>, <Link>, <Switch>/<Routes>,                    │
  │ <Redirect>/<Navigate>, <Outlet>                        │
  ├─────────────────────────────────────────────────────────┤
  │ LAYER 2: React Router Core                              │
  │ RouterContext, matchPath(), useHistory/useNavigate,     │
  │ useLocation, useParams, useRouteMatch                   │
  ├─────────────────────────────────────────────────────────┤
  │ LAYER 1: History Library                                │
  │ createBrowserHistory() — History API wrapper            │
  │ createHashHistory() — Hash wrapper                      │
  │ createMemoryHistory() — Memory (test/SSR)               │
  └─────────────────────────────────────────────────────────┘

  LUỒNG HOẠT ĐỘNG:
  ① User click <Link to="/about">
  ② Link gọi history.push('/about')
  ③ History thay đổi URL (pushState hoặc hash)
  ④ History thông báo listeners
  ⑤ Router component nhận location mới
  ⑥ Router truyền location qua Context
  ⑦ Route components re-render, match path mới
  ⑧ Matched Route render component tương ứng
```

```javascript
// React Router v6 cơ bản:
import { BrowserRouter, Routes, Route, Link, Outlet } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
        <Link to="/users/123">User 123</Link>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/users/:id" element={<User />} /> {/* Dynamic param */}
        <Route path="*" element={<NotFound />} /> {/* 404 Catch-all */}
      </Routes>
    </BrowserRouter>
  );
}
```

---

## §4. BrowserRouter — Nguyên lý bên dưới

```javascript
// BrowserRouter = History API + React Context

// ① History object nội bộ:
// Sử dụng thư viện "history" (cùng tác giả React Router)
import { createBrowserHistory } from "history";

const history = createBrowserHistory();
// history bọc window.history + thêm listener system

// ② BrowserRouter source (đơn giản hóa):
function BrowserRouter({ children }) {
  // Tạo history instance
  const historyRef = useRef(null);
  if (historyRef.current === null) {
    historyRef.current = createBrowserHistory();
  }
  const history = historyRef.current;

  // State = location hiện tại
  const [state, setState] = useState({
    action: history.action,
    location: history.location,
  });

  // Lắng nghe thay đổi location
  useLayoutEffect(() => {
    return history.listen(setState); // ← RE-RENDER khi location đổi!
  }, [history]);

  // Truyền qua Context
  return (
    <Router
      navigator={history}
      location={state.location}
      navigationType={state.action}
    >
      {children}
    </Router>
  );
}

// ③ Router truyền xuống qua Context:
const NavigationContext = React.createContext();
const LocationContext = React.createContext();

function Router({ navigator, location, children }) {
  return (
    <NavigationContext.Provider value={{ navigator }}>
      <LocationContext.Provider value={{ location }}>
        {children}
      </LocationContext.Provider>
    </NavigationContext.Provider>
  );
}

// ④ Hooks đọc context:
function useNavigate() {
  const { navigator } = useContext(NavigationContext);
  return useCallback((to) => navigator.push(to), [navigator]);
}

function useLocation() {
  return useContext(LocationContext).location;
}

function useParams() {
  const { matches } = useContext(RouteContext);
  // Trả về params từ matched route
  return matches[matches.length - 1].params;
}
```

```
BROWSERROUTER — LUỒNG PUSH:
═══════════════════════════════════════════════════════════════

  <Link to="/about"> click
       │
       ▼
  navigate('/about')
       │
       ▼
  history.push('/about')
       │
       ▼
  window.history.pushState(state, '', '/about')  ← URL đổi!
       │
       ▼
  history.listen callbacks fire
       │
       ▼
  setState({ location: { pathname: '/about' } })
       │
       ▼
  React RE-RENDER!
       │
       ▼
  <Routes> nhận location mới → match '/about' → render <About />
```

---

## §5. HashRouter — Nguyên lý bên dưới

```javascript
// HashRouter = Hash (#) + React Context

// ① createHashHistory (đơn giản hóa):
function createHashHistory() {
  let listeners = [];

  function getLocation() {
    const hash = window.location.hash.slice(1) || "/";
    return { pathname: hash };
  }

  // Lắng nghe hashchange:
  window.addEventListener("hashchange", () => {
    const location = getLocation();
    listeners.forEach((listener) => listener({ location, action: "POP" }));
  });

  return {
    get location() {
      return getLocation();
    },

    push(path) {
      window.location.hash = path; // ← Thay đổi hash → trigger hashchange!
    },

    replace(path) {
      const url = window.location.href.split("#")[0] + "#" + path;
      window.location.replace(url);
    },

    listen(listener) {
      listeners.push(listener);
      return () => {
        listeners = listeners.filter((l) => l !== listener);
      };
    },

    go(n) {
      window.history.go(n);
    },
    back() {
      window.history.go(-1);
    },
    forward() {
      window.history.go(1);
    },
  };
}

// ② HashRouter component — GIỐNG BrowserRouter!
// Chỉ khác: dùng createHashHistory thay createBrowserHistory
function HashRouter({ children }) {
  const historyRef = useRef(createHashHistory());
  const [state, setState] = useState({
    location: historyRef.current.location,
  });

  useEffect(() => {
    return historyRef.current.listen(({ location }) => {
      setState({ location });
    });
  }, []);

  return (
    <Router navigator={historyRef.current} location={state.location}>
      {children}
    </Router>
  );
}
```

---

## §6. Route Matching — Thuật toán khớp đường dẫn

```
ROUTE MATCHING — LÀM SAO REACT ROUTER BIẾT RENDER GÌ:
═══════════════════════════════════════════════════════════════

  URL: /users/123/posts
  Routes:
    /            → Home
    /users       → UserList
    /users/:id   → UserDetail   ← :id = dynamic param!
    /users/:id/posts → UserPosts ← ← ← MATCH! id=123
    *            → NotFound

  QUY TRÌNH:
  ① Tách URL thành segments: ['users', '123', 'posts']
  ② So sánh với TỪNG route pattern:
     - /           → [''] ← 1 segment vs 3 → KHÔNG match
     - /users      → ['users'] ← 1 vs 3 → KHÔNG match
     - /users/:id  → ['users', ':id'] ← 2 vs 3 → KHÔNG match
     - /users/:id/posts → ['users', ':id', 'posts'] ← 3 vs 3!
       → 'users' === 'users' ✅
       → ':id' matches '123' (dynamic!) → params.id = '123' ✅
       → 'posts' === 'posts' ✅
       → MATCH! ✅
```

```javascript
// TỰ TRIỂN KHAI matchPath:
function matchPath(pattern, pathname) {
  // ① Chuyển pattern thành RegExp:
  // '/users/:id/posts' → /^\/users\/([^/]+)\/posts\/?$/
  const paramNames = [];
  const regexpStr = pattern
    .replace(/:([^/]+)/g, (_, paramName) => {
      paramNames.push(paramName); // Thu thập tên param
      return "([^/]+)"; // Match bất kỳ non-slash
    })
    .replace(/\*/g, "(.*)"); // Wildcard

  const regexp = new RegExp(`^${regexpStr}\\/?$`);

  // ② Kiểm tra match:
  const match = pathname.match(regexp);
  if (!match) return null;

  // ③ Trích xuất params:
  const params = {};
  paramNames.forEach((name, index) => {
    params[name] = decodeURIComponent(match[index + 1]);
  });

  return {
    path: pattern,
    url: pathname,
    params,
    isExact: pathname === match[0],
  };
}

// Kiểm tra:
matchPath("/users/:id", "/users/123");
// → { path: '/users/:id', url: '/users/123', params: { id: '123' } } ✅

matchPath("/users/:id/posts/:postId", "/users/5/posts/42");
// → { params: { id: '5', postId: '42' } } ✅
```

```
REACT ROUTER v6 — RANKING ALGORITHM:
═══════════════════════════════════════════════════════════════

  v6 dùng RANKING thay vì exact match order!

  Mỗi route segment được tính ĐIỂM:
  → Static segment (/users):     3 điểm
  → Dynamic param (/:id):        2 điểm
  → Wildcard (*):                1 điểm
  → Layout (index route):        + bonus

  URL: /users/new
  Candidates:
    /users/:id   → 3 + 2 = 5 điểm
    /users/new   → 3 + 3 = 6 điểm ← THẮNG!

  → Static "new" THẮNG dynamic ":id"!
  → v6 KHÔNG cần thứ tự khai báo route! Tự rank! ⭐
  → v5 phụ thuộc thứ tự → dễ bug!
```

---

## §7. Tự triển khai Mini Router

```javascript
// MINI REACT ROUTER — Hiểu nguyên lý qua code thật:

const RouterContext = React.createContext();

// ① BrowserRouter
function MiniRouter({ children }) {
  const [location, setLocation] = useState(window.location.pathname);

  useEffect(() => {
    // Lắng nghe popstate (Back/Forward):
    const handler = () => setLocation(window.location.pathname);
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  const navigate = useCallback((to) => {
    window.history.pushState(null, "", to);
    setLocation(to); // ← Trigger re-render!
  }, []);

  return (
    <RouterContext.Provider value={{ location, navigate }}>
      {children}
    </RouterContext.Provider>
  );
}

// ② Route — Render nếu match:
function MiniRoute({ path, element }) {
  const { location } = useContext(RouterContext);
  const match = matchPath(path, location);
  return match ? element : null;
}

// ③ Link — Navigate không reload:
function MiniLink({ to, children }) {
  const { navigate } = useContext(RouterContext);
  const handleClick = (e) => {
    e.preventDefault(); // ← KHÔNG reload!
    navigate(to);
  };
  return (
    <a href={to} onClick={handleClick}>
      {children}
    </a>
  );
}

// ④ useNavigate hook:
function useMiniNavigate() {
  const { navigate } = useContext(RouterContext);
  return navigate;
}

// ⑤ useParams hook:
function useMiniParams() {
  const { location } = useContext(RouterContext);
  // Simplified: tìm route hiện tại → trích params
  return {}; // Trong thực tế: lấy từ RouteContext
}

// SỬ DỤNG:
function App() {
  return (
    <MiniRouter>
      <MiniLink to="/">Home</MiniLink>
      <MiniLink to="/about">About</MiniLink>
      <MiniRoute path="/" element={<h1>Home Page</h1>} />
      <MiniRoute path="/about" element={<h1>About Page</h1>} />
    </MiniRouter>
  );
}
```

---

## §8. Dynamic Loading — Nguyên lý & Triển khai

```
TẠI SAO CẦN DYNAMIC LOADING:
═══════════════════════════════════════════════════════════════

  KHÔNG DYNAMIC LOADING:
  → Bundle 1 file JS khổng lồ (2MB+)
  → User vào trang Home → phải tải TOÀN BỘ code (kể cả About, Users...)
  → TTI (Time to Interactive) = CHẬM! 💀

  CÓ DYNAMIC LOADING:
  → Bundle tách thành nhiều chunks nhỏ
  → User vào Home → chỉ tải Home chunk (~200KB)
  → Click About → mới tải About chunk (~100KB)
  → TTI = NHANH! ✅

  KỸ THUẬT:
  ① Code Splitting — Tách code thành chunks
  ② Lazy Loading — Tải chunk khi CẦN (on-demand)
  ③ Route-based Splitting — Tách theo route (phổ biến nhất!)
```

### 8a. Dynamic import() — Nền tảng

```javascript
// dynamic import() — ES2020 — TRẢ VỀ PROMISE!

// ❌ Static import (build-time, luôn được bundle):
import { add } from "./math.js"; // Bundle luôn!

// ✅ Dynamic import (runtime, tải khi cần):
const module = await import("./math.js"); // Tải khi gọi!
module.add(1, 2);

// HOẶC:
import("./math.js").then((module) => {
  module.add(1, 2);
});
```

```
WEBPACK CODE SPLITTING — CÁCH HOẠT ĐỘNG:
═══════════════════════════════════════════════════════════════

  KHI WEBPACK GẶP import():
  ① Phát hiện dynamic import('./About')
  ② Tách About component + dependencies → chunk RIÊNG
  ③ Tạo file: About.chunk.js (hoặc 0.chunk.js)
  ④ Trong main bundle: thay import() bằng code TẢI chunk:

  __webpack_require__.e(chunkId)  // ← Tải chunk
    .then(__webpack_require__)     // ← Execute chunk
    .then(module => ...)           // ← Dùng module

  ⑤ __webpack_require__.e tạo <script> tag:
     var script = document.createElement('script');
     script.src = '/static/js/About.chunk.js';
     document.head.appendChild(script);
  ⑥ Khi script load xong → Promise resolve!

  KẾT QUẢ:
  main.js        ← App shell, router, Home (ban đầu)
  About.chunk.js ← Chỉ tải khi navigate đến /about
  Users.chunk.js ← Chỉ tải khi navigate đến /users
```

### 8b. React.lazy — Lazy Component

```javascript
// React.lazy() — Lazy load component:
const About = React.lazy(() => import("./About"));
// → import() trả về Promise<{ default: Component }>
// → React.lazy() nhận Promise → trả về lazy component
// → Component KHÔNG được tải cho đến khi RENDER lần đầu!

// BẮT BUỘC dùng với Suspense:
function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        <Route path="/about" element={<About />} />
      </Routes>
    </Suspense>
  );
}

// KHI /about ĐƯỢC TRUY CẬP:
// ① React cố render <About />
// ② About chưa load → React.lazy throw Promise!
// ③ Suspense BẮT Promise → hiển thị fallback ("Loading...")
// ④ import('./About') hoàn thành → Promise resolve
// ⑤ Suspense RENDER LẠI → hiển thị <About /> thật!
```

```
REACT.LAZY — NGUYÊN LÝ BÊN DƯỚI:
═══════════════════════════════════════════════════════════════

  function lazy(factory) {
    let status = 'pending';  // 'pending' | 'resolved' | 'rejected'
    let result;

    // factory = () => import('./About')
    const thenable = factory(); // Gọi import() → Promise!

    thenable.then(
      module => { status = 'resolved'; result = module; },
      error  => { status = 'rejected'; result = error; }
    );

    return {
      $$typeof: REACT_LAZY_TYPE,
      _init: function(payload) {
        if (status === 'pending') {
          throw thenable; // ← THROW Promise! → Suspense bắt!
        }
        if (status === 'rejected') {
          throw result; // ← Error → ErrorBoundary bắt!
        }
        return result.default; // ← Module đã load → trả component!
      }
    };
  }

  FLOW:
  Render lần 1 → status='pending' → throw Promise → Suspense fallback
  Promise resolve → status='resolved' → result=module
  Render lần 2 → return result.default → Component thật!
```

---

## §9. React.lazy + Suspense + Code Splitting — Thực tiễn

### Route-based Code Splitting

```javascript
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";

// ① Lazy load mỗi route:
const Home = lazy(() => import("./pages/Home"));
const About = lazy(() => import("./pages/About"));
const Users = lazy(() => import("./pages/Users"));
const Profile = lazy(() => import("./pages/Profile"));

// ② Loading Component:
function LoadingSpinner() {
  return (
    <div className="loading-container">
      <div className="spinner" />
      <p>Đang tải...</p>
    </div>
  );
}

// ③ App với Suspense:
function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/users" element={<Users />} />
          <Route path="/profile/:id" element={<Profile />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
```

### Prefetching — Tải trước khi cần

```javascript
// ④ PREFETCH — Tải trước khi user navigate:

// Cách 1: Hover prefetch
const About = lazy(() => import("./pages/About"));

function Nav() {
  const prefetchAbout = () => {
    import("./pages/About"); // ← Bắt đầu tải khi HOVER!
  };

  return (
    <Link to="/about" onMouseEnter={prefetchAbout}>
      About
    </Link>
  );
}

// Cách 2: Route-level prefetch (webpackPrefetch):
const About = lazy(() => import(/* webpackPrefetch: true */ "./pages/About"));
// → Webpack tạo: <link rel="prefetch" href="/About.chunk.js">
// → Browser tải trong IDLE TIME!

// Cách 3: Preload (tải ngay khi main chunk xong):
const About = lazy(() => import(/* webpackPreload: true */ "./pages/About"));
// → Tải SONG SONG với main bundle!

// PREFETCH vs PRELOAD:
// prefetch: tải khi rảnh (idle) → cho trang CHƯA CẦN
// preload: tải NGAY song song → cho trang SẼ CẦN SỚM
```

### Error Handling

```javascript
// ⑤ ERROR BOUNDARY — Xử lý lỗi load chunk:
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div>
          <h2>Không thể tải trang 😞</h2>
          <button onClick={() => window.location.reload()}>Tải lại</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Sử dụng:
function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
```

### Retry Logic & Named Chunks

```javascript
// ⑥ RETRY — Tự động thử lại khi load lỗi:
function lazyWithRetry(factory, retries = 3) {
  return lazy(() => retryImport(factory, retries));
}

function retryImport(factory, retries) {
  return factory().catch((err) => {
    if (retries <= 0) throw err;
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(retryImport(factory, retries - 1));
      }, 1000); // Thử lại sau 1 giây
    });
  });
}

const About = lazyWithRetry(() => import("./pages/About"));

// ⑦ NAMED CHUNKS — Đặt tên chunk cho dễ debug:
const About = lazy(
  () => import(/* webpackChunkName: "about-page" */ "./pages/About"),
);
// → Output: about-page.chunk.js (thay vì 0.chunk.js)
```

```
TỰ TRIỂN KHAI DYNAMIC LOADING THỦ CÔNG (không React.lazy):
═══════════════════════════════════════════════════════════════

  // HOC lazy loading:
  function loadable(importFn) {
    let Component = null;

    return function LazyComponent(props) {
      const [loaded, setLoaded] = useState(!!Component);

      useEffect(() => {
        if (!Component) {
          importFn().then(module => {
            Component = module.default;
            setLoaded(true);
          });
        }
      }, []);

      if (!loaded) return <div>Loading...</div>;
      return <Component {...props} />;
    };
  }

  // Sử dụng:
  const About = loadable(() => import('./About'));
  // <About /> → Loading... → (import xong) → <RealAbout />

  THƯ VIỆN PHỔBIẾN: @loadable/component
  → Hỗ trợ SSR (React.lazy KHÔNG hỗ trợ SSR!)
  → Module prefetching
  → Named exports (React.lazy chỉ hỗ trợ default export!)
```

---

## §10. Tổng kết & Checklist phỏng vấn

```
MIND MAP REACT ROUTER & DYNAMIC LOADING:
═══════════════════════════════════════════════════════════════

  React Router
  ├── Hash: window.location.hash, hashchange event, /#/path
  ├── History API: pushState, replaceState, popstate, /path
  ├── Architecture: History lib → Router Core → Components
  ├── Context: LocationContext + NavigationContext
  ├── Matching: segments compare, v6 ranking (static > dynamic > *)
  ├── BrowserRouter: createBrowserHistory + listen → setState → re-render
  └── HashRouter: createHashHistory + hashchange → setState → re-render

  Dynamic Loading
  ├── Code Splitting: import() → webpack chunk
  ├── React.lazy: throw Promise → Suspense catch → fallback → resolve
  ├── Route-based: lazy(() => import('./Page')) + <Suspense>
  ├── Prefetch: hover, webpackPrefetch, webpackPreload
  ├── Error: ErrorBoundary + retry logic
  └── SSR: @loadable/component (React.lazy không hỗ trợ SSR)
```

### Checklist

- [ ] **SPA routing**: thay đổi URL + render component mà KHÔNG reload trang
- [ ] **Hash (#)**: phần sau # không gửi server, `hashchange` event, URL xấu, không cần server config
- [ ] **History API**: `pushState`/`replaceState` thay đổi URL không reload, `popstate` cho Back/Forward
- [ ] **pushState vs hash**: History URL đẹp + SEO tốt nhưng CẦN server trả index.html cho mọi route
- [ ] **React Router 3 lớp**: History lib (hash/browser/memory) → Core (context, hooks) → Components (Route, Link)
- [ ] **BrowserRouter flow**: Link click → history.push → pushState → listener → setState → re-render → Route match
- [ ] **Context**: LocationContext (location hiện tại) + NavigationContext (navigator/history object)
- [ ] **Route matching**: tách URL segments → so sánh pattern → `:param` match bất kỳ segment → trích params
- [ ] **v6 ranking**: static segment (3đ) > dynamic param (2đ) > wildcard (1đ) → không cần thứ tự khai báo
- [ ] **Code splitting**: `import()` → webpack tách chunk riêng → tải qua `<script>` tag khi cần
- [ ] **React.lazy**: nhận `() => import('./X')`, component chưa load → throw Promise → Suspense bắt → fallback
- [ ] **Suspense flow**: render → throw Promise (pending) → fallback → resolve → render lại → component thật
- [ ] **Prefetch**: `onMouseEnter` trigger import, `webpackPrefetch` (idle), `webpackPreload` (parallel)
- [ ] **ErrorBoundary**: bắt lỗi load chunk (network fail), hiển thị UI retry
- [ ] **lazyWithRetry**: retry import N lần với delay khi chunk load thất bại
- [ ] **SSR**: React.lazy KHÔNG hỗ trợ SSR → dùng `@loadable/component`
- [ ] **Named chunks**: `/* webpackChunkName: "name" */` → output tên chunk dễ debug

---

_Nguồn: React Router Architecture & Dynamic Loading Deep Dive_
_Cập nhật lần cuối: Tháng 2, 2026_
