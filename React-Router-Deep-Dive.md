# React Router — Deep Dive

> 📅 2026-02-12 · ⏱ 25 phút đọc
>
> 8 chủ đề: Implementation principle (hash/history), route config
> (Route/Switch/Link/Redirect), redirects, Link vs `<a>`, URL params
> & history object, re-render on route change, routing modes
> (BrowserRouter/HashRouter), Switch & exact.
> Độ khó: ⭐️⭐️⭐️⭐️ | Chủ đề: React Routing

---

## Mục Lục

0. [Nguyên lý hoạt động React-Router](#0-nguyên-lý-hoạt-động)
1. [Cấu hình Route — Route/Switch/Link/Redirect](#1-cấu-hình-route)
2. [Redirect — Chuyển hướng](#2-redirect)
3. [Link vs `<a>` tag](#3-link-vs-a-tag)
4. [Lấy URL Params & History Object](#4-url-params--history)
5. [Re-render khi Route thay đổi](#5-re-render-khi-route-thay-đổi)
6. [Routing Modes — BrowserRouter vs HashRouter](#6-routing-modes)
7. [Switch & exact](#7-switch--exact)
8. [Tóm Tắt & Câu Hỏi Phỏng Vấn](#8-tóm-tắt--câu-hỏi-phỏng-vấn)

---

## 0. Nguyên lý hoạt động

### Client-Side Routing — 2 phương thức

```
CLIENT-SIDE ROUTING:
═══════════════════════════════════════════════════════════════

  ① HASH ROUTING (#)
     URL: example.com/#/about
     ┌──────────────────────────────────────────────┐
     │ Cơ chế: window.onhashchange event            │
     │ Thay đổi hash: location.hash = '/about'      │
     │ Browser KHÔNG gửi request → chỉ thay đổi UI  │
     │ Server KHÔNG biết hash → luôn trả cùng 1 HTML│
     └──────────────────────────────────────────────┘

  ② HISTORY ROUTING (HTML5 History API)
     URL: example.com/about
     ┌──────────────────────────────────────────────┐
     │ Cơ chế: history.pushState / replaceState     │
     │ Lắng nghe: popstate event (back/forward)     │
     │ pushState/replaceState KHÔNG trigger popstate │
     │ → Phải dispatch custom event                 │
     │ URL đẹp hơn, KHÔNG có dấu #                 │
     │ ⚠️ Server cần config fallback → index.html   │
     └──────────────────────────────────────────────┘
```

### React-Router — Nguyên lý bên trong

```
REACT-ROUTER ARCHITECTURE:
═══════════════════════════════════════════════════════════════

  ┌─────────────────────────────────────────────────────────┐
  │                    react-router                         │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │              history library                     │  │
  │  │  → Abstract hash/history API differences         │  │
  │  │  → Maintain history stack                        │  │
  │  │  → Smooth browser differences                   │  │
  │  │  → Transparent to upper layers                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                         ↓                              │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │            Route Matching Engine                 │  │
  │  │  → Maintain list of <Route> configs              │  │
  │  │  → URL changes → match path → render component  │  │
  │  │  → Context API truyền location/match/history    │  │
  │  └──────────────────────────────────────────────────┘  │
  └─────────────────────────────────────────────────────────┘

  FLOW:
  URL change → history library detect
             → match registered routes
             → render matching component
             → update UI (NO page reload!)
```

### Hash vs History — Implementation

```javascript
// ── Hash Routing (tự implement) ──
window.addEventListener("hashchange", () => {
  const path = window.location.hash.slice(1); // bỏ #
  // match route → render component
});

// Navigate:
location.hash = "/about";
// hoặc: <a href="#/about">

// ── History Routing (tự implement) ──
// Push new URL (KHÔNG reload page):
history.pushState({ page: "about" }, "", "/about");

// Listen back/forward:
window.addEventListener("popstate", (event) => {
  const path = window.location.pathname;
  // match route → render component
});

// ⚠️ pushState KHÔNG trigger popstate
// → Phải tự dispatch event hoặc call render manually
```

---

## 1. Cấu hình Route

### `<Route>` — Match path → render component

```javascript
// Route match dựa trên path vs location.pathname
// location = { pathname: '/about' }
<Route path='/about' component={About} />   // ✅ renders <About/>
<Route path='/contact' component={Contact} /> // ❌ renders null
<Route component={Always} />                 // ✅ always renders (no path)
```

### `<Switch>` — Render FIRST match only

```javascript
<Switch>
  <Route exact path="/" component={Home} />
  <Route path="/about" component={About} />
  <Route path="/contact" component={Contact} />
  <Route component={NotFound} /> {/* fallback 404 */}
</Switch>
// Switch iterate children → render FIRST match → stop
// Không có Switch → render TẤT CẢ matches!
```

### `<Link>` & `<NavLink>` — Navigation

```javascript
// ── Link: render <a> tag ──
<Link to="/">Home</Link>
// → <a href="/">Home</a>

// ── NavLink: Link + active styling ──
// location = { pathname: '/react' }
<NavLink to="/react" activeClassName="active">
    React
</NavLink>
// → <a href="/react" class="active">React</a>

// NavLink props:
//   activeClassName: class khi match
//   activeStyle: inline style khi match
//   exact: chỉ active khi exact match
//   isActive: custom function check active
```

### `<Redirect>` — Force navigation

```javascript
<Switch>
  <Redirect from="/old-path" to="/new-path" />
  <Route path="/new-path" component={NewPage} />
</Switch>
// Redirect renders → navigate to `to` prop immediately
```

---

## 2. Redirect

```javascript
// ── Basic redirect ──
<Redirect from="/users/:id" to="/users/profile/:id" />

// ── Redirect with object ──
<Redirect to={{
    pathname: '/login',
    search: '?from=dashboard',
    state: { referrer: currentLocation }
}} />

// ── Conditional redirect ──
<Route path="/dashboard">
    {isLoggedIn ? <Dashboard /> : <Redirect to="/login" />}
</Route>
```

```
REDIRECT PROPS:
  ┌──────────┬─────────────────────────────────────────┐
  │ from     │ Path pattern to match (string)          │
  │ to       │ Target URL (string hoặc object)         │
  │ push     │ true → push vào history (có thể back)   │
  │          │ false → replace (DEFAULT, không back)    │
  │ exact    │ Exact match `from` path                 │
  │ strict   │ Strict trailing slash matching           │
  └──────────┴─────────────────────────────────────────┘
```

---

## 3. Link vs `<a>` tag

```
<Link> vs <a> — DIFFERENCES:
═══════════════════════════════════════════════════════════════

  ┌──────────────┬─────────────────────┬─────────────────────┐
  │              │ <Link>              │ <a>                 │
  ├──────────────┼─────────────────────┼─────────────────────┤
  │ Rendered DOM │ <a> tag             │ <a> tag             │
  ├──────────────┼─────────────────────┼─────────────────────┤
  │ Navigation   │ Client-side (SPA)   │ Full page reload    │
  │              │ Chỉ update component│ Request server mới  │
  ├──────────────┼─────────────────────┼─────────────────────┤
  │ Page reload  │ ❌ KHÔNG reload     │ ✅ RELOAD toàn page │
  ├──────────────┼─────────────────────┼─────────────────────┤
  │ State        │ ✅ Giữ Redux/state │ ❌ MẤT tất cả state │
  ├──────────────┼─────────────────────┼─────────────────────┤
  │ Performance  │ ✅ Nhanh (no reload)│ ❌ Chậm (full load) │
  └──────────────┴─────────────────────┴─────────────────────┘
```

### `<Link>` làm gì khi click?

```javascript
// <Link> nội bộ thực hiện 3 bước:
handleClick = (event) => {
  // ① Chạy onClick handler (nếu có)
  if (this.props.onClick) this.props.onClick(event);

  // ② Prevent default <a> behavior (KHÔNG reload page!)
  event.preventDefault();

  // ③ Dùng history API navigate
  history.push(this.props.to);
  // → URL thay đổi → Route match → render component
  // → PAGE KHÔNG RELOAD!
};
```

### Simulate Link behavior với `<a>`

```javascript
// Disable <a> default → dùng history API
document.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", function (e) {
    e.preventDefault(); // chặn default navigation
    history.pushState(null, "", this.href); // thay đổi URL
    // trigger route matching manually...
  });
});
```

---

## 4. URL Params & History

### 3 cách truyền params

```javascript
// ═══════════════════════════════════════════════════════════
// ① QUERY STRING (GET params)
// ═══════════════════════════════════════════════════════════
// URL: /admin?id=1111&name=john
// Route config: bình thường
<Route path="/admin" component={Admin} />;

// Lấy params:
// Class component:
const search = this.props.location.search; // "?id=1111&name=john"
const params = new URLSearchParams(search);
const id = params.get("id"); // "1111"

// Hooks:
import { useLocation } from "react-router-dom";
const { search } = useLocation();
const params = new URLSearchParams(search);

// ═══════════════════════════════════════════════════════════
// ② DYNAMIC ROUTE (URL params)
// ═══════════════════════════════════════════════════════════
// URL: /admin/1111
// Route config: dynamic segment
<Route path="/admin/:id" component={Admin} />;

// Lấy params:
// Class component:
const id = this.props.match.params.id; // "1111"

// Hooks:
import { useParams } from "react-router-dom";
const { id } = useParams();

// ═══════════════════════════════════════════════════════════
// ③ STATE / QUERY (Link object)
// ═══════════════════════════════════════════════════════════
// Navigate với state:
<Link
  to={{
    pathname: "/admin",
    state: { userId: 1111, role: "admin" },
    search: "?tab=settings",
  }}
>
  Go to Admin
</Link>;

// Lấy state:
// Class component:
const state = this.props.location.state; // { userId: 1111, role: 'admin' }

// Hooks:
const location = useLocation();
const { userId, role } = location.state;
// ⚠️ state MẤT khi user refresh page!
```

```
3 CÁCH TRUYỀN PARAMS — SO SÁNH:
  ┌─────────────┬──────────────┬──────────────┬──────────────┐
  │             │ Query String │ Dynamic Route│ State/Query  │
  ├─────────────┼──────────────┼──────────────┼──────────────┤
  │ URL visible │ ✅ Có        │ ✅ Có        │ ❌ Không      │
  │ Refresh safe│ ✅ Giữ       │ ✅ Giữ       │ ❌ Mất!       │
  │ Bookmarkable│ ✅ Có        │ ✅ Có        │ ❌ Không      │
  │ Data type   │ String only  │ String only  │ Any (object) │
  │ Use case    │ Filters, sort│ Resource ID  │ Temp data    │
  └─────────────┴──────────────┴──────────────┴──────────────┘
```

### History Object

```javascript
// ── Hooks (React 16.8+) ──
import { useHistory } from "react-router-dom";

function MyComponent() {
  const history = useHistory();

  const navigate = () => {
    history.push("/new-page"); // navigate + add to history
    history.replace("/new-page"); // navigate + replace current
    history.goBack(); // = history.go(-1)
    history.goForward(); // = history.go(1)
  };
}

// ── Class component ──
class MyComponent extends React.Component {
  navigate = () => {
    this.props.history.push("/new-page");
  };
}
// ⚠️ Chỉ có props.history nếu component TRỰC TIẾP render bởi <Route>
// Nếu không → dùng withRouter HOC:
import { withRouter } from "react-router-dom";
export default withRouter(MyComponent);

// ── React Router v6 ──
import { useNavigate } from "react-router-dom";
const navigate = useNavigate();
navigate("/new-page");
navigate(-1); // go back
```

---

## 5. Re-render khi Route thay đổi

### Vấn đề

> Cùng 1 component render cho nhiều routes khác nhau.
> Route thay đổi → component **KHÔNG unmount/remount** → phải detect thay đổi.

### Class Component — componentWillReceiveProps

```javascript
class NewsList extends Component {
  componentDidMount() {
    this.fetchData(this.props.location);
  }

  fetchData(location) {
    const type = location.pathname.replace("/", "") || "top";
    this.props.dispatch(fetchListData(type));
  }

  // Detect route change → refetch data
  componentWillReceiveProps(nextProps) {
    if (nextProps.location.pathname !== this.props.location.pathname) {
      this.fetchData(nextProps.location);
    }
  }

  render() {
    /* ... */
  }
}
```

### Hooks — useEffect (Modern)

```javascript
function NewsList() {
  const location = useLocation();
  const dispatch = useDispatch();

  useEffect(() => {
    const type = location.pathname.replace("/", "") || "top";
    dispatch(fetchListData(type));
  }, [location.pathname]);
  // ← dependency array: re-run effect khi pathname thay đổi

  return /* ... */;
}
```

### Key Trick — Force remount

```javascript
// Dùng key = location.pathname → force UNMOUNT + REMOUNT
<Route path="/news/:type">
  {({ location }) => <NewsList key={location.pathname} />}
</Route>
// Mỗi route change → key thay đổi → React destroy old + create new
// ✅ Simple nhưng ❌ mất internal state
```

---

## 6. Routing Modes

### BrowserRouter (History mode)

```javascript
// URL: example.com/about/contact
<BrowserRouter
    basename="/app"          // base URL prefix
    forceRefresh={false}     // true = full page reload (fallback)
    getUserConfirmation={fn} // custom confirm dialog
    keyLength={6}            // location.key length
>
    <App />
</BrowserRouter>

// basename example:
<BrowserRouter basename="/calendar">
    <Link to="/today" />
    {/* renders: <a href="/calendar/today"> */}
</BrowserRouter>
```

```
BROWSERROUTER:
  ✅ URL đẹp: example.com/about
  ✅ Dùng HTML5 History API (pushState, replaceState, popstate)
  ⚠️ Server PHẢI config fallback → index.html
     (nginx: try_files $uri /index.html)
  ⚠️ Nếu không config server → 404 khi refresh!
```

### HashRouter (Hash mode)

```javascript
// URL: example.com/#/about/contact
<HashRouter
  basename="/app"
  getUserConfirmation={fn}
  hashType="slash" // #/ (default)
>
  <App />
</HashRouter>

// hashType options:
//   "slash"   → #/about       (default)
//   "noslash" → #about
//   "hashbang"→ #!/about      (Google AJAX crawling)
```

```
HASHROUTER:
  ✅ KHÔNG cần server config (hash không gửi lên server)
  ✅ Tương thích browser cũ
  ❌ URL xấu: có dấu #
  ❌ SEO kém (search engine bỏ qua hash)
  ❌ Không gửi hash lên server → SSR không hoạt động
```

### So sánh

```
BROWSERROUTER vs HASHROUTER:
  ┌──────────────────┬──────────────────┬──────────────────┐
  │                  │ BrowserRouter    │ HashRouter       │
  ├──────────────────┼──────────────────┼──────────────────┤
  │ URL format       │ /about           │ /#/about         │
  │ API              │ HTML5 History    │ window.location  │
  │                  │ pushState        │ .hash            │
  ├──────────────────┼──────────────────┼──────────────────┤
  │ Server config    │ ⚠️ CẦN fallback │ ✅ KHÔNG cần     │
  │ Browser support  │ IE10+            │ Tất cả           │
  │ SEO              │ ✅ Tốt           │ ❌ Kém           │
  │ SSR              │ ✅ Support       │ ❌ Không          │
  ├──────────────────┼──────────────────┼──────────────────┤
  │ Recommend        │ ✅ Production    │ Legacy/demo      │
  └──────────────────┴──────────────────┴──────────────────┘
```

### getUserConfirmation (Navigation guard)

```javascript
// Xác nhận trước khi navigate (giống Vue beforeRouteLeave)
const getConfirmation = (message, callback) => {
  const allowTransition = window.confirm(message);
  callback(allowTransition);
};

<BrowserRouter getUserConfirmation={getConfirmation}>
  <App />
</BrowserRouter>;

// Trong component:
import { Prompt } from "react-router-dom";
<Prompt
  when={formIsDirty}
  message="Bạn có chắc muốn rời trang? Dữ liệu chưa lưu sẽ mất!"
/>;
```

---

## 7. Switch & exact

### Vấn đề không có Switch

```javascript
// ❌ KHÔNG có Switch:
<Route path="/" component={Home} />
<Route path="/login" component={Login} />

// URL: /login
// → path="/" match (vì /login BẮT ĐẦU bằng /)
// → path="/login" CŨNG match
// → RENDER CẢ HAI: Home + Login cùng lúc!
```

### Switch — Render first match only

```javascript
// ✅ CÓ Switch:
<Switch>
  <Route path="/" component={Home} />
  <Route path="/login" component={Login} />
</Switch>

// URL: /login
// → path="/" match FIRST → render Home → STOP
// → Login KHÔNG BAO GIỜ render!
// ⚠️ Vẫn sai! Cần exact
```

### exact — Exact match

```javascript
// ✅ Switch + exact:
<Switch>
  <Route exact path="/" component={Home} />
  <Route path="/login" component={Login} />
  <Route path="/register" component={Register} />
  <Route component={NotFound} /> {/* 404 fallback */}
</Switch>

// URL: /         → exact match "/" → Home ✅
// URL: /login    → "/" không exact match → skip → "/login" match → Login ✅
// URL: /register → Register ✅
// URL: /xyz      → không match gì → NotFound ✅
```

```
SWITCH & EXACT:
  ┌──────────┬─────────────────────────────────────────┐
  │ Switch   │ Iterate Routes → render FIRST match     │
  │          │ → Stop sau khi tìm thấy match đầu tiên │
  ├──────────┼─────────────────────────────────────────┤
  │ exact    │ path PHẢI match CHÍNH XÁC              │
  │          │ "/" chỉ match "/" (không match "/about") │
  ├──────────┼─────────────────────────────────────────┤
  │ strict   │ Trailing slash phải match               │
  │          │ "/about/" chỉ match "/about/" (có /)    │
  ├──────────┼─────────────────────────────────────────┤
  │ sensitive│ Case-sensitive matching                 │
  │          │ "/About" ≠ "/about"                     │
  └──────────┴─────────────────────────────────────────┘
```

### React Router v6 — Thay đổi

```javascript
// React Router v6:
// → KHÔNG CẦN exact (mặc định exact!)
// → KHÔNG CẦN Switch → dùng <Routes>
// → KHÔNG CẦN component prop → dùng element

import { Routes, Route } from "react-router-dom";

<Routes>
  <Route path="/" element={<Home />} />
  <Route path="/login" element={<Login />} />
  <Route path="/users/:id" element={<UserProfile />} />
  <Route path="*" element={<NotFound />} />
</Routes>;
// v6 default exact match → "/" chỉ match "/"
// "*" = catch-all (404)
```

---

## 8. Tóm Tắt & Câu Hỏi Phỏng Vấn

### Quick Reference

```
REACT ROUTER — QUICK REFERENCE:
═══════════════════════════════════════════════════════════════

  PRINCIPLE:
    Hash        → window.onhashchange + location.hash
    History     → pushState/replaceState + popstate event
    react-router→ history lib + route matching + Context API

  COMPONENTS:
    <Route>     → Match path → render component
    <Switch>    → Render FIRST match only
    <Link>      → SPA navigation (no reload)
    <NavLink>   → Link + active styling
    <Redirect>  → Force navigation to new path

  PARAMS:
    Query string → URLSearchParams / useLocation().search
    Dynamic route→ useParams() / match.params
    State        → location.state (⚠️ mất khi refresh)

  MODES:
    BrowserRouter→ HTML5 History, clean URL, cần server config
    HashRouter   → Hash-based, URL có #, không cần server

  MATCHING:
    exact        → Chính xác (mặc định trong v6)
    Switch       → First match only (→ Routes trong v6)
```

### Câu Hỏi Phỏng Vấn

**1. React-Router nguyên lý hoạt động?**

> Dựa trên **history library** abstract 2 loại client-side routing: ① **Hash** — listen `hashchange` event, dùng `location.hash`. ② **History** — dùng HTML5 `pushState/replaceState`, listen `popstate`. React-Router maintain danh sách routes, khi URL thay đổi → match path → render component tương ứng qua **Context API** truyền location/match/history xuống component tree.

**2. Link vs `<a>` tag khác gì?**

> Cả hai render ra `<a>` tag trong DOM. Khác biệt: `<Link>` **preventDefault** `<a>` default behavior → dùng `history.push` navigate → **KHÔNG reload page**, giữ SPA state. `<a>` tag reload **toàn bộ page** → mất state, chậm hơn. `<Link>` thực hiện 3 bước: ① execute onClick, ② `preventDefault`, ③ `history.push(to)`.

**3. BrowserRouter vs HashRouter?**

> **BrowserRouter**: URL đẹp (`/about`), dùng HTML5 History API, **cần server config** fallback index.html, SEO tốt, hỗ trợ SSR. **HashRouter**: URL có `#` (`/#/about`), KHÔNG cần server config, tương thích browser cũ, SEO kém, không SSR. Production → recommend BrowserRouter.

**4. Có mấy cách truyền params? So sánh?**

> 3 cách: ① **Query string** (`?id=1`) — visible, refresh-safe, string only. ② **Dynamic route** (`/:id`) — visible, refresh-safe, string only. ③ **State** (`location.state`) — invisible, **MẤT khi refresh**, any data type. Dùng `useParams`, `useLocation`, `URLSearchParams` để lấy.

**5. Switch và exact dùng để làm gì?**

> **Switch** iterate child Routes → render **FIRST match** → stop (không render nhiều component). **exact** yêu cầu path match **chính xác** (url `/` không match `/about`). Kết hợp: Switch + exact trên `/` route → routing chính xác. **React Router v6**: mặc định exact, `<Routes>` thay `<Switch>`.

**6. Route thay đổi nhưng cùng component, làm sao re-render?**

> ① **useEffect** với dependency `[location.pathname]` — detect thay đổi → refetch data. ② **componentWillReceiveProps** (class) — compare `nextProps.location` vs `this.props.location`. ③ **Key trick**: `key={location.pathname}` → force unmount/remount (đơn giản nhưng mất internal state).

---

## Checklist Học Tập

- [ ] Client-side routing: Hash (hashchange) vs History (pushState/popstate)
- [ ] history library: abstract browser differences, maintain stack
- [ ] `<Route>`: path matching, component/render/children props
- [ ] `<Switch>`: first match only, fallback 404 route
- [ ] `<Link>`: 3 steps (onClick → preventDefault → history.push)
- [ ] `<NavLink>`: activeClassName, activeStyle
- [ ] `<Redirect>`: from/to/push props
- [ ] Link vs `<a>`: SPA navigation vs full page reload
- [ ] URL params: query string, dynamic route (:id), state
- [ ] URLSearchParams, useParams, useLocation hooks
- [ ] History object: useHistory, push/replace/goBack
- [ ] withRouter HOC: inject history vào non-route components
- [ ] Re-render: useEffect dependency, componentWillReceiveProps, key trick
- [ ] BrowserRouter: HTML5 History, clean URL, cần server fallback
- [ ] HashRouter: hash-based, no server config, SEO kém
- [ ] getUserConfirmation + Prompt: navigation guard
- [ ] exact/strict/sensitive: matching props
- [ ] React Router v6: Routes (replaces Switch), element prop, default exact

---

_Cập nhật lần cuối: Tháng 2, 2026_
