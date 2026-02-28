# React Route Protection — Hạn Chế Truy Cập Routes! Deep Dive!

> **Chủ đề**: How can you restrict access to certain routes in a React application?
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Phương châm**: Tự viết lại bằng tay — KHÔNG dùng thư viện!

---

## Mục Lục

1. [§1. Tại Sao Cần Bảo Vệ Routes?](#1)
2. [§2. Tự Viết — Mini Router Từ Đầu!](#2)
3. [§3. Tự Viết — ProtectedRoute Component!](#3)
4. [§4. Tự Viết — Role-Based Access Control (RBAC)!](#4)
5. [§5. Tự Viết — Auth Context & Provider!](#5)
6. [§6. Tự Viết — Permission-Based Route Guard!](#6)
7. [§7. Tự Viết — Route Config Pattern!](#7)
8. [§8. Tại Sao Client-Side Protection Là KHÔNG ĐỦ?](#8)
9. [§9. Tổng Kết & Câu Hỏi Phỏng Vấn!](#9)

---

## §1. Tại Sao Cần Bảo Vệ Routes?

```
  TẠI SAO CẦN BẢO VỆ ROUTES?
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  React App có nhiều loại trang:                        │
  │                                                        │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  🟢 PUBLIC ROUTES (ai cũng vào được):            │  │
  │  │  /login, /register, /about, /landing             │  │
  │  │                                                  │  │
  │  │  🔒 PROTECTED ROUTES (phải đăng nhập):           │  │
  │  │  /dashboard, /profile, /settings                 │  │
  │  │                                                  │  │
  │  │  👑 ADMIN ROUTES (phải là admin):                 │  │
  │  │  /admin/users, /admin/settings, /admin/reports   │  │
  │  │                                                  │  │
  │  │  📋 ROLE-BASED ROUTES (theo vai trò):             │  │
  │  │  /editor/posts (editor), /moderator/queue (mod)  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  NẾU KHÔNG BẢO VỆ:                                     │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  ❌ User chưa login → vào /dashboard → thấy      │  │
  │  │     trang trống hoặc lỗi!                       │  │
  │  │  ❌ User thường → vào /admin → truy cập admin!   │  │
  │  │  ❌ URL trực tiếp → bypass navigation!           │  │
  │  │  ❌ UX kém → user confused!                      │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  FLOW ĐÚNG:                                            │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  User vào /dashboard                             │  │
  │  │      ↓                                           │  │
  │  │  Đã đăng nhập? ─── NO ───→ Redirect /login      │  │
  │  │      │                                           │  │
  │  │     YES                                          │  │
  │  │      ↓                                           │  │
  │  │  Có quyền? ─── NO ───→ Redirect /unauthorized   │  │
  │  │      │                                           │  │
  │  │     YES                                          │  │
  │  │      ↓                                           │  │
  │  │  Render Component! ✅                             │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §2. Tự Viết — Mini Router Từ Đầu!

```javascript
// ═══════════════════════════════════════════════════════════
// MINI ROUTER — TỰ VIẾT TỪ ĐẦU!
// Để hiểu cách Router hoạt động bên trong!
// ═══════════════════════════════════════════════════════════

var MiniRouter = (function () {
  // ① ROUTE MATCHING:
  // So sánh URL path với route pattern
  function matchRoute(pattern, path) {
    // Pattern: '/users/:id' → Match: '/users/123'
    // Pattern: '/admin/*'   → Match: '/admin/anything'

    var patternParts = pattern.split("/").filter(Boolean);
    var pathParts = path.split("/").filter(Boolean);
    var params = {};

    // Wildcard (*) → match mọi thứ sau:
    if (patternParts[patternParts.length - 1] === "*") {
      patternParts.pop();
      if (pathParts.length < patternParts.length) return null;
    } else if (patternParts.length !== pathParts.length) {
      return null;
    }

    for (var i = 0; i < patternParts.length; i++) {
      if (patternParts[i].charAt(0) === ":") {
        // Dynamic param: :id → extract value
        var paramName = patternParts[i].substring(1);
        params[paramName] = pathParts[i];
      } else if (patternParts[i] !== pathParts[i]) {
        return null; // Không match!
      }
    }

    return { params: params, matched: true };
  }

  // ② ROUTE REGISTRY:
  var _routes = [];
  var _currentPath = window.location.pathname;
  var _listeners = [];

  function addRoute(pattern, component, options) {
    options = options || {};
    _routes.push({
      pattern: pattern,
      component: component,
      isProtected: options.isProtected || false,
      requiredRoles: options.requiredRoles || [],
      requiredPermissions: options.requiredPermissions || [],
    });
  }

  // ③ NAVIGATE:
  function navigate(path) {
    _currentPath = path;
    window.history.pushState({}, "", path);
    notifyListeners();
  }

  // ④ RESOLVE — tìm route phù hợp:
  function resolve(path) {
    path = path || _currentPath;
    for (var i = 0; i < _routes.length; i++) {
      var match = matchRoute(_routes[i].pattern, path);
      if (match) {
        return {
          route: _routes[i],
          params: match.params,
          path: path,
        };
      }
    }
    return null; // 404!
  }

  // ⑤ LISTENER PATTERN:
  function subscribe(listener) {
    _listeners.push(listener);
    return function unsubscribe() {
      _listeners = _listeners.filter(function (l) {
        return l !== listener;
      });
    };
  }

  function notifyListeners() {
    var resolved = resolve(_currentPath);
    for (var i = 0; i < _listeners.length; i++) {
      _listeners[i](resolved);
    }
  }

  // ⑥ LISTEN TO BROWSER BACK/FORWARD:
  window.addEventListener("popstate", function () {
    _currentPath = window.location.pathname;
    notifyListeners();
  });

  return {
    addRoute: addRoute,
    navigate: navigate,
    resolve: resolve,
    subscribe: subscribe,
    matchRoute: matchRoute,
  };
})();
```

```
  MINI ROUTER — HOẠT ĐỘNG:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  URL: /users/123                                       │
  │       ↓                                                │
  │  resolve('/users/123')                                 │
  │       ↓                                                │
  │  Loop qua _routes:                                     │
  │  ┌────────────────────────────────────────────┐        │
  │  │ Pattern: '/'          → KHÔNG match! (1≠2) │        │
  │  │ Pattern: '/login'     → KHÔNG match!       │        │
  │  │ Pattern: '/users/:id' → MATCH!             │        │
  │  │   params: { id: '123' }                    │        │
  │  │   component: UserProfile                   │        │
  │  │   isProtected: true                        │        │
  │  └────────────────────────────────────────────┘        │
  │       ↓                                                │
  │  return { route, params: {id:'123'}, path }            │
  │       ↓                                                │
  │  isProtected? → kiểm tra auth → render hoặc redirect! │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §3. Tự Viết — ProtectedRoute Component!

```javascript
// ═══════════════════════════════════════════════════════════
// PROTECTED ROUTE — TỰ VIẾT!
// Component cơ bản nhất để bảo vệ route!
// ═══════════════════════════════════════════════════════════

// ① ProtectedRoute ĐƠN GIẢN NHẤT:
function ProtectedRoute(props) {
  // props.isAuthenticated: boolean
  // props.children: component cần bảo vệ
  // props.redirectTo: đường dẫn redirect (default '/login')

  if (!props.isAuthenticated) {
    // Chưa đăng nhập → redirect về login!
    // Lưu intended URL để sau login redirect lại:
    var currentPath = window.location.pathname;
    var loginUrl =
      (props.redirectTo || "/login") +
      "?returnUrl=" +
      encodeURIComponent(currentPath);

    // Redirect:
    window.location.href = loginUrl;

    // Render null hoặc loading:
    return null;
  }

  // Đã đăng nhập → render component!
  return props.children;
}

// SỬ DỤNG:
// ProtectedRoute({
//     isAuthenticated: AuthManager.isLoggedIn(),
//     children: DashboardPage()
// });

// ═══════════════════════════════════════════════════════════
// ② ProtectedRoute VỚI LOADING STATE:
// ═══════════════════════════════════════════════════════════

function ProtectedRouteWithLoading(props) {
  var authState = React.useState({
    isChecking: true,
    isAuthenticated: false,
    user: null,
  });
  var state = authState[0];
  var setState = authState[1];

  React.useEffect(function () {
    // Kiểm tra auth status từ server:
    checkAuthStatus()
      .then(function (result) {
        setState({
          isChecking: false,
          isAuthenticated: result.authenticated,
          user: result.user,
        });
      })
      .catch(function () {
        setState({
          isChecking: false,
          isAuthenticated: false,
          user: null,
        });
      });
  }, []);

  // ① ĐANG KIỂM TRA → hiện loading:
  if (state.isChecking) {
    return React.createElement(
      "div",
      {
        className: "auth-loading",
      },
      "Đang kiểm tra quyền truy cập...",
    );
  }

  // ② CHƯA ĐĂNG NHẬP → redirect:
  if (!state.isAuthenticated) {
    var returnUrl = encodeURIComponent(window.location.pathname);
    MiniRouter.navigate("/login?returnUrl=" + returnUrl);
    return null;
  }

  // ③ ĐÃ ĐĂNG NHẬP → render:
  return props.children;
}

function checkAuthStatus() {
  return fetch("/api/auth/me", {
    credentials: "include",
  }).then(function (res) {
    if (!res.ok) throw new Error("Not authenticated");
    return res.json();
  });
}
```

```
  PROTECTED ROUTE — FLOW:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  User navigate → /dashboard                           │
  │       ↓                                                │
  │  ProtectedRoute renders                                │
  │       ↓                                                │
  │  ┌──────────────────┐                                  │
  │  │ isChecking: true │ → 🔄 "Đang kiểm tra..."         │
  │  └────────┬─────────┘                                  │
  │           ↓                                            │
  │  fetch('/api/auth/me')                                 │
  │           ↓                                            │
  │  ┌── Response ──┐                                      │
  │  │              │                                      │
  │  ↓              ↓                                      │
  │  200 OK         401 Unauthorized                       │
  │  ↓              ↓                                      │
  │  isAuth: true   isAuth: false                          │
  │  ↓              ↓                                      │
  │  Render         Redirect                               │
  │  Dashboard ✅   → /login?returnUrl=/dashboard ↩️        │
  │                                                        │
  │  SAU KHI LOGIN THÀNH CÔNG:                             │
  │  /login page đọc returnUrl → redirect /dashboard!     │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §4. Tự Viết — Role-Based Access Control (RBAC)!

```
  RBAC — KHÁI NIỆM:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ROLE-BASED ACCESS CONTROL:                            │
  │  → Mỗi user có 1 hoặc nhiều ROLES                    │
  │  → Mỗi route yêu cầu ROLES nhất định                 │
  │  → User chỉ vào được nếu có role phù hợp!            │
  │                                                        │
  │  VÍ DỤ:                                                │
  │  ┌────────────────────────────────────────────────┐    │
  │  │  User: An                                     │    │
  │  │  Roles: ['user', 'editor']                    │    │
  │  │                                               │    │
  │  │  /dashboard     → requires: ['user']    → ✅   │    │
  │  │  /editor/posts  → requires: ['editor']  → ✅   │    │
  │  │  /admin/users   → requires: ['admin']   → ❌   │    │
  │  │  /mod/queue     → requires: ['moderator'] → ❌ │    │
  │  └────────────────────────────────────────────────┘    │
  │                                                        │
  │  HIERARCHY PHỔ BIẾN:                                   │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │        ┌─────────┐                              │  │
  │  │        │ SUPER   │← Có TẤT CẢ quyền!           │  │
  │  │        │ ADMIN   │                              │  │
  │  │        └────┬────┘                              │  │
  │  │             ↓                                   │  │
  │  │        ┌─────────┐                              │  │
  │  │        │  ADMIN  │← Quản lý users, settings    │  │
  │  │        └────┬────┘                              │  │
  │  │        ┌────┴────┐                              │  │
  │  │        ↓         ↓                              │  │
  │  │  ┌─────────┐ ┌─────────┐                       │  │
  │  │  │ EDITOR  │ │  MOD    │                       │  │
  │  │  └────┬────┘ └────┬────┘                       │  │
  │  │       └─────┬─────┘                             │  │
  │  │             ↓                                   │  │
  │  │        ┌─────────┐                              │  │
  │  │        │  USER   │← Quyền cơ bản              │  │
  │  │        └─────────┘                              │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

```javascript
// ═══════════════════════════════════════════════════════════
// ROLE-BASED ROUTE GUARD — TỰ VIẾT!
// ═══════════════════════════════════════════════════════════

// ① ROLE HIERARCHY:
var RoleHierarchy = (function () {
  // Role hierarchy — role cao hơn bao gồm role thấp hơn:
  var _hierarchy = {
    super_admin: ["admin", "editor", "moderator", "user"],
    admin: ["editor", "moderator", "user"],
    editor: ["user"],
    moderator: ["user"],
    user: [],
  };

  // Lấy TẤT CẢ roles (bao gồm inherited):
  function getEffectiveRoles(userRoles) {
    var effective = {};
    for (var i = 0; i < userRoles.length; i++) {
      var role = userRoles[i];
      effective[role] = true;
      // Thêm inherited roles:
      var inherited = _hierarchy[role] || [];
      for (var j = 0; j < inherited.length; j++) {
        effective[inherited[j]] = true;
      }
    }
    return Object.keys(effective);
  }

  // Kiểm tra user có role nào đó:
  function hasRole(userRoles, requiredRole) {
    var effective = getEffectiveRoles(userRoles);
    return effective.indexOf(requiredRole) !== -1;
  }

  // Kiểm tra user có BẤT KỲ role nào trong danh sách:
  function hasAnyRole(userRoles, requiredRoles) {
    var effective = getEffectiveRoles(userRoles);
    for (var i = 0; i < requiredRoles.length; i++) {
      if (effective.indexOf(requiredRoles[i]) !== -1) {
        return true;
      }
    }
    return false;
  }

  // Kiểm tra user có TẤT CẢ roles trong danh sách:
  function hasAllRoles(userRoles, requiredRoles) {
    var effective = getEffectiveRoles(userRoles);
    for (var i = 0; i < requiredRoles.length; i++) {
      if (effective.indexOf(requiredRoles[i]) === -1) {
        return false;
      }
    }
    return true;
  }

  return {
    getEffectiveRoles: getEffectiveRoles,
    hasRole: hasRole,
    hasAnyRole: hasAnyRole,
    hasAllRoles: hasAllRoles,
  };
})();

// ② ROLE-BASED PROTECTED ROUTE:
function RoleProtectedRoute(props) {
  // props.user: { id, name, roles: ['editor', 'user'] }
  // props.requiredRoles: ['admin'] hoặc ['editor', 'moderator']
  // props.requireAll: true/false (AND vs OR)
  // props.children: component cần render

  // Chưa đăng nhập:
  if (!props.user) {
    MiniRouter.navigate(
      "/login?returnUrl=" + encodeURIComponent(window.location.pathname),
    );
    return null;
  }

  // Kiểm tra roles:
  var hasAccess;
  if (props.requireAll) {
    // Phải có TẤT CẢ roles:
    hasAccess = RoleHierarchy.hasAllRoles(
      props.user.roles,
      props.requiredRoles,
    );
  } else {
    // Chỉ cần BẤT KỲ role nào:
    hasAccess = RoleHierarchy.hasAnyRole(props.user.roles, props.requiredRoles);
  }

  if (!hasAccess) {
    // Không có quyền → trang 403:
    return React.createElement(
      "div",
      {
        className: "forbidden-page",
      },
      React.createElement("h1", null, "403 — Không Có Quyền Truy Cập"),
      React.createElement(
        "p",
        null,
        "Bạn cần role: " + props.requiredRoles.join(", "),
      ),
      React.createElement(
        "p",
        null,
        "Roles hiện tại: " + props.user.roles.join(", "),
      ),
      React.createElement(
        "button",
        {
          onClick: function () {
            MiniRouter.navigate("/dashboard");
          },
        },
        "Về Dashboard",
      ),
    );
  }

  // Có quyền → render:
  return props.children;
}

// SỬ DỤNG:
// RoleProtectedRoute({
//     user: { id: 1, roles: ['editor'] },
//     requiredRoles: ['admin'],
//     children: AdminPage()
// });
// → User là editor, cần admin → 403!
```

---

## §5. Tự Viết — Auth Context & Provider!

```javascript
// ═══════════════════════════════════════════════════════════
// AUTH CONTEXT & PROVIDER — TỰ VIẾT!
// Quản lý auth state cho TOÀN APP!
// ═══════════════════════════════════════════════════════════

// ① TỰ VIẾT CONTEXT (simplified):
var AuthContext = (function () {
  var _value = null;
  var _subscribers = [];

  return {
    Provider: function (props) {
      _value = props.value;
      // Notify subscribers:
      for (var i = 0; i < _subscribers.length; i++) {
        _subscribers[i](_value);
      }
      return props.children;
    },
    useContext: function () {
      return _value;
    },
    subscribe: function (fn) {
      _subscribers.push(fn);
    },
  };
})();

// ② AUTH PROVIDER — quản lý toàn bộ auth logic:
function AuthProvider(props) {
  var state = React.useState({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });
  var authState = state[0];
  var setAuthState = state[1];

  // Kiểm tra auth khi app khởi động:
  React.useEffect(function () {
    initializeAuth();
  }, []);

  function initializeAuth() {
    setAuthState(function (prev) {
      return Object.assign({}, prev, { isLoading: true });
    });

    // Gọi server kiểm tra session:
    fetch("/api/auth/me", { credentials: "include" })
      .then(function (res) {
        if (!res.ok) throw new Error("Not authenticated");
        return res.json();
      })
      .then(function (user) {
        setAuthState({
          user: user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      })
      .catch(function () {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      });
  }

  function login(email, password) {
    return fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email: email, password: password }),
    })
      .then(function (res) {
        if (!res.ok) throw new Error("Login failed");
        return res.json();
      })
      .then(function (data) {
        setAuthState({
          user: data.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        // Redirect về returnUrl hoặc dashboard:
        var params = new URLSearchParams(window.location.search);
        var returnUrl = params.get("returnUrl") || "/dashboard";
        MiniRouter.navigate(returnUrl);
        return data;
      });
  }

  function logout() {
    return fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    }).then(function () {
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
      MiniRouter.navigate("/login");
    });
  }

  function hasRole(role) {
    if (!authState.user || !authState.user.roles) return false;
    return RoleHierarchy.hasRole(authState.user.roles, role);
  }

  function hasPermission(permission) {
    if (!authState.user || !authState.user.permissions) return false;
    return authState.user.permissions.indexOf(permission) !== -1;
  }

  // Context value:
  var contextValue = {
    user: authState.user,
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading,
    login: login,
    logout: logout,
    hasRole: hasRole,
    hasPermission: hasPermission,
  };

  return AuthContext.Provider({
    value: contextValue,
    children: props.children,
  });
}

// ③ useAuth HOOK:
function useAuth() {
  var auth = AuthContext.useContext();
  if (!auth) {
    throw new Error("useAuth phải dùng bên trong AuthProvider!");
  }
  return auth;
}
```

```
  AUTH CONTEXT — FLOW:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  App Component                                         │
  │  └─ AuthProvider ← Quản lý auth state!                │
  │     │  user: { id, name, roles, permissions }         │
  │     │  isAuthenticated: true/false                    │
  │     │  login(), logout(), hasRole(), hasPermission()  │
  │     │                                                 │
  │     ├─ Header ← useAuth() → hiện tên user            │
  │     ├─ Sidebar ← useAuth() → ẩn/hiện menu items      │
  │     │                                                 │
  │     ├─ Router                                         │
  │     │  ├─ / → PublicPage                              │
  │     │  ├─ /login → LoginPage                          │
  │     │  ├─ /dashboard → ProtectedRoute → DashboardPage │
  │     │  ├─ /admin/* → RoleProtectedRoute → AdminPage   │
  │     │  └─ /editor/* → RoleProtectedRoute → EditorPage │
  │     │                                                 │
  │     └─ Footer                                         │
  │                                                        │
  │  MỌI component con → useAuth() → đọc auth state!     │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §6. Tự Viết — Permission-Based Route Guard!

```javascript
// ═══════════════════════════════════════════════════════════
// PERMISSION-BASED GUARD — CHI TIẾT HƠN RBAC!
// ═══════════════════════════════════════════════════════════

// RBAC: hasRole('admin') → quá rộng
// Permission-based: hasPermission('users:delete') → chính xác hơn!

var PermissionSystem = (function () {
  // Permission format: 'resource:action'
  // users:read, users:create, users:update, users:delete
  // posts:read, posts:create, posts:publish
  // orders:read, orders:refund

  // Role → Permissions mapping:
  var _rolePermissions = {
    super_admin: ["*"], // Wildcard — tất cả quyền!
    admin: [
      "users:read",
      "users:create",
      "users:update",
      "users:delete",
      "posts:read",
      "posts:create",
      "posts:update",
      "posts:delete",
      "posts:publish",
      "settings:read",
      "settings:update",
      "reports:read",
    ],
    editor: ["posts:read", "posts:create", "posts:update", "posts:publish"],
    moderator: [
      "posts:read",
      "posts:update",
      "posts:delete",
      "users:read",
      "comments:delete",
    ],
    user: ["posts:read", "profile:read", "profile:update"],
  };

  // Lấy tất cả permissions từ roles:
  function getPermissions(userRoles) {
    var permissions = {};
    for (var i = 0; i < userRoles.length; i++) {
      var rolePerms = _rolePermissions[userRoles[i]] || [];
      for (var j = 0; j < rolePerms.length; j++) {
        permissions[rolePerms[j]] = true;
      }
    }
    return Object.keys(permissions);
  }

  // Kiểm tra 1 permission:
  function check(userRoles, requiredPermission) {
    var perms = getPermissions(userRoles);
    // Wildcard check:
    if (perms.indexOf("*") !== -1) return true;
    return perms.indexOf(requiredPermission) !== -1;
  }

  // Kiểm tra ANY:
  function checkAny(userRoles, requiredPermissions) {
    for (var i = 0; i < requiredPermissions.length; i++) {
      if (check(userRoles, requiredPermissions[i])) return true;
    }
    return false;
  }

  // Kiểm tra ALL:
  function checkAll(userRoles, requiredPermissions) {
    for (var i = 0; i < requiredPermissions.length; i++) {
      if (!check(userRoles, requiredPermissions[i])) return false;
    }
    return true;
  }

  return {
    getPermissions: getPermissions,
    check: check,
    checkAny: checkAny,
    checkAll: checkAll,
  };
})();

// PERMISSION-PROTECTED ROUTE:
function PermissionRoute(props) {
  // props.permissions: ['users:delete', 'users:update']
  // props.requireAll: true = cần TẤT CẢ, false = cần BẤT KỲ
  // props.fallback: component hiện khi không có quyền

  var auth = useAuth();

  if (auth.isLoading) {
    return React.createElement("div", null, "Loading...");
  }

  if (!auth.isAuthenticated) {
    MiniRouter.navigate(
      "/login?returnUrl=" + encodeURIComponent(window.location.pathname),
    );
    return null;
  }

  var hasAccess;
  if (props.requireAll) {
    hasAccess = PermissionSystem.checkAll(auth.user.roles, props.permissions);
  } else {
    hasAccess = PermissionSystem.checkAny(auth.user.roles, props.permissions);
  }

  if (!hasAccess) {
    if (props.fallback) return props.fallback;
    return React.createElement(
      "div",
      { className: "no-permission" },
      React.createElement("h2", null, "⛔ Không Có Quyền!"),
      React.createElement(
        "p",
        null,
        "Cần permissions: " + props.permissions.join(", "),
      ),
    );
  }

  return props.children;
}
```

```
  PERMISSION CHECK — FLOW:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  Route: /admin/users/delete                            │
  │  Required: ['users:delete']                            │
  │                                                        │
  │  User roles: ['editor']                                │
  │       ↓                                                │
  │  getPermissions(['editor'])                            │
  │       ↓                                                │
  │  ['posts:read', 'posts:create',                        │
  │   'posts:update', 'posts:publish']                     │
  │       ↓                                                │
  │  'users:delete' trong danh sách? → ❌ KHÔNG!           │
  │       ↓                                                │
  │  ⛔ "Không có quyền! Cần: users:delete"                │
  │                                                        │
  │  ─────────────────────────────────                     │
  │                                                        │
  │  User roles: ['admin']                                 │
  │       ↓                                                │
  │  getPermissions(['admin'])                             │
  │       ↓                                                │
  │  ['users:read', 'users:create',                        │
  │   'users:update', 'users:delete', ...]                 │
  │       ↓                                                │
  │  'users:delete' trong danh sách? → ✅ CÓ!              │
  │       ↓                                                │
  │  Render DeleteUserPage! ✅                              │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §7. Tự Viết — Route Config Pattern!

```javascript
// ═══════════════════════════════════════════════════════════
// ROUTE CONFIG — KHAI BÁO TẤT CẢ ROUTES Ở 1 NƠI!
// ═══════════════════════════════════════════════════════════

// ① ROUTE CONFIGURATION:
var routeConfig = [
  // PUBLIC ROUTES:
  {
    path: "/",
    component: "HomePage",
    isPublic: true,
  },
  {
    path: "/login",
    component: "LoginPage",
    isPublic: true,
    guestOnly: true, // Chỉ user CHƯA đăng nhập!
  },
  {
    path: "/register",
    component: "RegisterPage",
    isPublic: true,
    guestOnly: true,
  },

  // PROTECTED ROUTES:
  {
    path: "/dashboard",
    component: "DashboardPage",
    isPublic: false,
    roles: ["user"], // Mọi user đã login
  },
  {
    path: "/profile",
    component: "ProfilePage",
    isPublic: false,
    roles: ["user"],
  },

  // EDITOR ROUTES:
  {
    path: "/editor/posts",
    component: "EditorPostsPage",
    isPublic: false,
    roles: ["editor"],
    permissions: ["posts:create", "posts:update"],
  },

  // ADMIN ROUTES:
  {
    path: "/admin/dashboard",
    component: "AdminDashboardPage",
    isPublic: false,
    roles: ["admin"],
  },
  {
    path: "/admin/users",
    component: "AdminUsersPage",
    isPublic: false,
    roles: ["admin"],
    permissions: ["users:read"],
  },
  {
    path: "/admin/users/:id",
    component: "AdminUserDetailPage",
    isPublic: false,
    roles: ["admin"],
    permissions: ["users:read", "users:update"],
  },

  // 404 FALLBACK:
  {
    path: "*",
    component: "NotFoundPage",
    isPublic: true,
  },
];

// ② ROUTE RENDERER — dựa trên config:
function AppRouter() {
  var auth = useAuth();
  var currentPath = window.location.pathname;

  // Tìm route match:
  var matchedRoute = null;
  var params = {};
  for (var i = 0; i < routeConfig.length; i++) {
    var match = MiniRouter.matchRoute(routeConfig[i].path, currentPath);
    if (match) {
      matchedRoute = routeConfig[i];
      params = match.params;
      break;
    }
  }

  // 404:
  if (!matchedRoute) {
    return renderComponent("NotFoundPage");
  }

  // Loading:
  if (auth.isLoading && !matchedRoute.isPublic) {
    return React.createElement("div", null, "Loading...");
  }

  // Guest-only (login, register):
  if (matchedRoute.guestOnly && auth.isAuthenticated) {
    MiniRouter.navigate("/dashboard");
    return null;
  }

  // Public → render ngay:
  if (matchedRoute.isPublic) {
    return renderComponent(matchedRoute.component, params);
  }

  // Protected — check auth:
  if (!auth.isAuthenticated) {
    MiniRouter.navigate("/login?returnUrl=" + encodeURIComponent(currentPath));
    return null;
  }

  // Check roles:
  if (matchedRoute.roles && matchedRoute.roles.length > 0) {
    if (!RoleHierarchy.hasAnyRole(auth.user.roles, matchedRoute.roles)) {
      return renderComponent("ForbiddenPage");
    }
  }

  // Check permissions:
  if (matchedRoute.permissions && matchedRoute.permissions.length > 0) {
    if (!PermissionSystem.checkAll(auth.user.roles, matchedRoute.permissions)) {
      return renderComponent("ForbiddenPage");
    }
  }

  // ALL CHECKS PASSED → render!
  return renderComponent(matchedRoute.component, params);
}

function renderComponent(name, params) {
  // Component registry:
  var components = {
    HomePage: function () {
      return React.createElement("h1", null, "Home");
    },
    LoginPage: function () {
      return React.createElement("h1", null, "Login");
    },
    DashboardPage: function () {
      return React.createElement("h1", null, "Dashboard");
    },
    AdminDashboardPage: function () {
      return React.createElement("h1", null, "Admin Dashboard");
    },
    ForbiddenPage: function () {
      return React.createElement(
        "div",
        null,
        React.createElement("h1", null, "403 Forbidden"),
        React.createElement("p", null, "Không có quyền!"),
      );
    },
    NotFoundPage: function () {
      return React.createElement("h1", null, "404 Not Found");
    },
  };
  var Component = components[name];
  return Component ? Component(params) : null;
}
```

```
  ROUTE CONFIG PATTERN — FLOW:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  routeConfig (centralized!)                            │
  │  ┌─────────────────────────────────────────┐           │
  │  │ [ { path, component, roles, perms }, ] │           │
  │  └───────────────┬─────────────────────────┘           │
  │                  ↓                                     │
  │  AppRouter reads config                                │
  │                  ↓                                     │
  │  ┌───────────────────────────────┐                     │
  │  │ Match path? ── NO ──→ 404    │                     │
  │  │     │                        │                     │
  │  │    YES                       │                     │
  │  │     ↓                        │                     │
  │  │ isPublic? ── YES ──→ Render! │                     │
  │  │     │                        │                     │
  │  │    NO                        │                     │
  │  │     ↓                        │                     │
  │  │ isAuth? ── NO ──→ /login     │                     │
  │  │     │                        │                     │
  │  │    YES                       │                     │
  │  │     ↓                        │                     │
  │  │ hasRole? ── NO ──→ 403      │                     │
  │  │     │                        │                     │
  │  │    YES                       │                     │
  │  │     ↓                        │                     │
  │  │ hasPerm? ── NO ──→ 403      │                     │
  │  │     │                        │                     │
  │  │    YES                       │                     │
  │  │     ↓                        │                     │
  │  │ ✅ RENDER COMPONENT!         │                     │
  │  └───────────────────────────────┘                     │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §8. Tại Sao Client-Side Protection Là KHÔNG ĐỦ?

```
  ⚠️ CLIENT-SIDE PROTECTION KHÔNG ĐỦ — TẠI SAO?
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  CLIENT-SIDE (React) CHỈ LÀ UX, KHÔNG PHẢI SECURITY! │
  │                                                        │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  React ProtectedRoute:                           │  │
  │  │  → ẨN trang admin khỏi user thường              │  │
  │  │  → REDIRECT về login nếu chưa đăng nhập         │  │
  │  │  → TỐT CHO UX!                                  │  │
  │  │                                                  │  │
  │  │  NHƯNG:                                          │  │
  │  │  → User MỞ DevTools → đọc/sửa JS → BYPASS!     │  │
  │  │  → User GỌI API trực tiếp (Postman/curl)!       │  │
  │  │  → User SỬA localStorage → fake isAdmin=true!   │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ĐÚNG CÁCH: BẢO VỆ Ở CẢ HAI TẦNG!                    │
  │                                                        │
  │  ┌──────────────┐      ┌──────────────┐               │
  │  │  Client-Side │      │  Server-Side │               │
  │  │  (React)     │      │  (API)       │               │
  │  │              │      │              │               │
  │  │  UX Layer:   │      │  Security    │               │
  │  │  • Ẩn UI     │      │  Layer:      │               │
  │  │  • Redirect  │      │  • Verify    │               │
  │  │  • Disable   │      │    tokens!   │               │
  │  │    buttons   │      │  • Check     │               │
  │  │  • Hiện      │      │    roles!    │               │
  │  │    loading   │      │  • Validate  │               │
  │  │              │      │    perms!    │               │
  │  │  ⚠️ Bypass-  │      │  ✅ Source   │               │
  │  │    able!     │      │    of truth! │               │
  │  └──────────────┘      └──────────────┘               │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

```javascript
// ═══════════════════════════════════════════════════════════
// SERVER-SIDE MIDDLEWARE — BẢO VỆ THỰC SỰ!
// ═══════════════════════════════════════════════════════════

// Server PHẢI kiểm tra auth cho MỌI API request:
function authMiddleware(req, res, next) {
  // Verify JWT/session:
  var token = req.headers["authorization"];
  if (!token) {
    return res.status(401).json({ error: "Chưa đăng nhập!" });
  }
  var user = verifyToken(token);
  if (!user) {
    return res.status(401).json({ error: "Token invalid!" });
  }
  req.user = user;
  next();
}

function roleMiddleware(requiredRoles) {
  return function (req, res, next) {
    if (!RoleHierarchy.hasAnyRole(req.user.roles, requiredRoles)) {
      return res.status(403).json({
        error: "Không có quyền!",
        required: requiredRoles,
        current: req.user.roles,
      });
    }
    next();
  };
}

function permissionMiddleware(requiredPerms) {
  return function (req, res, next) {
    if (!PermissionSystem.checkAll(req.user.roles, requiredPerms)) {
      return res.status(403).json({
        error: "Thiếu permission!",
        required: requiredPerms,
      });
    }
    next();
  };
}

// Route definitions (server):
// app.get('/api/admin/users',
//     authMiddleware,
//     roleMiddleware(['admin']),
//     permissionMiddleware(['users:read']),
//     getUsersHandler
// );
// → Kể cả user BYPASS React ProtectedRoute
// → Gọi API trực tiếp → Server VẪN TỪ CHỐI!
```

---

## §9. Tổng Kết & Câu Hỏi Phỏng Vấn!

### 9.1. Tổng Kết!

```
  ROUTE PROTECTION — TỔNG KẾT:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  CÁC PHƯƠNG PHÁP:                                     │
  │  ① ProtectedRoute — kiểm tra authentication           │
  │  ② Role-Based Access — kiểm tra roles (RBAC)          │
  │  ③ Permission-Based — kiểm tra permissions chi tiết   │
  │  ④ Route Config Pattern — centralized route rules     │
  │  ⑤ Auth Context/Provider — share auth state toàn app  │
  │                                                        │
  │  NGUYÊN TẮC:                                           │
  │  → Client-side = UX (ẩn UI, redirect, loading)        │
  │  → Server-side = SECURITY (verify, reject, protect)   │
  │  → PHẢI BẢO VỆ Ở CẢ HAI TẦNG!                        │
  │  → returnUrl pattern cho UX mượt mà!                  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 9.2. Câu Hỏi Phỏng Vấn!

**❓ Q1: Làm sao restrict access routes trong React?**

> Sử dụng **ProtectedRoute** component — wrapper kiểm tra authentication/authorization trước khi render. Nếu chưa login → redirect `/login` (kèm `returnUrl`). Nếu không đủ quyền → hiện 403 hoặc redirect. Kết hợp **Auth Context** (React Context API) share auth state toàn app và **Route Config** pattern khai báo centralized. Quan trọng: client-side protection chỉ là **UX layer**, server API **phải** verify independently.

**❓ Q2: RBAC vs Permission-based khác nhau thế nào?**

> **RBAC (Role-Based)**: Kiểm tra user có role phù hợp (`hasRole('admin')`). Đơn giản, dễ hiểu. Nhược: quá rộng — admin có tất cả quyền, khó fine-tune. **Permission-based**: Kiểm tra quyền cụ thể (`hasPermission('users:delete')`). Chi tiết hơn — có thể cho editor quyền `posts:publish` nhưng không cho `users:delete`. Thực tế thường **kết hợp**: roles map đến permissions, route check permissions cụ thể.

**❓ Q3: Tại sao client-side protection không đủ?**

> React code chạy trên browser — user **xem source**, **sửa JS** qua DevTools, **gọi API trực tiếp** bằng Postman/curl. ProtectedRoute chỉ ẩn UI, không chặn API access. Giải pháp: server **phải** có auth middleware verify token + role + permission cho **mọi** API endpoint. Client = UX layer (ẩn, redirect, disable), Server = Security layer (verify, reject). Cả hai phải đồng bộ rules.

**❓ Q4: returnUrl pattern hoạt động thế nào?**

> Khi user chưa login vào `/admin/users` → ProtectedRoute redirect `/login?returnUrl=%2Fadmin%2Fusers`. Login page đọc `returnUrl` từ query string. Sau login thành công → redirect về `/admin/users` thay vì dashboard default. UX mượt: user không mất flow. **Chú ý bảo mật**: validate returnUrl — chỉ cho phép same-origin URLs, chặn open redirect attack (`returnUrl=https://evil.com`).

**❓ Q5: Làm sao handle loading state khi check auth?**

> Khi app mount → gọi `/api/auth/me` verify session → **isLoading=true**. Trong lúc chờ, ProtectedRoute hiện **loading spinner** (không redirect!). Nếu redirect ngay → user đã login vẫn thấy flash login page. Sau response: authenticated → render component, not authenticated → redirect login. Pattern: `isLoading ? <Loading/> : isAuth ? <Component/> : <Redirect/>`.

**❓ Q6: Route Config pattern có lợi ích gì?**

> **Centralized** — tất cả route rules ở 1 file → dễ review, audit security. **Consistent** — mọi route xử lý auth cùng cách. **Maintainable** — thêm route = thêm 1 object vào array, không sửa nhiều files. **Auto-generate** — có thể tạo navigation menu, sidebar, breadcrumbs từ config. **Server-sync** — cùng config có thể dùng cho server-side route protection.

---

> 📝 **Ghi nhớ cuối cùng:**
> "Client-side route protection = UX, KHÔNG phải security! ProtectedRoute ẩn UI + redirect, nhưng hacker BYPASS được! Server API PHẢI verify token + roles + permissions cho MỌI request! Dùng Auth Context share state, Route Config centralized rules, RBAC + Permissions cho fine-grained access control!"
