ơ# React Data Fetching — Deep Dive!

> **Chủ đề**: Part 6 — Data Fetching (Q48-Q63)
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Phương châm**: Tự viết lại bằng tay — KHÔNG dùng thư viện!

---

## Mục Lục

1. [§1. So Sánh fetch, Axios, SWR, TanStack Query!](#1)
2. [§2. fetch() + useEffect — Cơ Bản!](#2)
3. [§3. Axios — Ưu Điểm!](#3)
4. [§4. Error Handling!](#4)
5. [§5. POST, PUT, DELETE!](#5)
6. [§6. Headers & Auth Tokens!](#6)
7. [§7. Cancel Requests!](#7)
8. [§8. .then().catch() vs async/await!](#8)
9. [§9. Pagination!](#9)
10. [§10. SWR — Caching & Revalidation!](#10)
11. [§11. TanStack Query — Fetch & Cache!](#11)
12. [§12. SWR vs TanStack Query — Real-time!](#12)
13. [§13. Optimistic Updates!](#13)
14. [§14. Background Refetching & Invalidation!](#14)
15. [§15. Tự Viết — Data Fetching Hook!](#15)
16. [§16. Tổng Kết & Câu Hỏi Phỏng Vấn!](#16)

---

## §1. So Sánh fetch, Axios, SWR, TanStack Query!

```
  DATA FETCHING TOOLS — SO SÁNH:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ┌─────────┬──────────┬──────────┬───────────────────┐ │
  │  │         │ fetch()  │ Axios    │ SWR / TanStack Q  │ │
  │  ├─────────┼──────────┼──────────┼───────────────────┤ │
  │  │ Loại    │ Browser  │ HTTP     │ Data Fetching     │ │
  │  │         │ API      │ Client   │ HOOKS (React)     │ │
  │  ├─────────┼──────────┼──────────┼───────────────────┤ │
  │  │ Install │ Built-in │ npm      │ npm               │ │
  │  │ Size    │ 0kb      │ ~13kb    │ SWR~4kb TQ~13kb  │ │
  │  ├─────────┼──────────┼──────────┼───────────────────┤ │
  │  │ Auto    │ ❌       │ ✅ JSON  │ ✅ JSON           │ │
  │  │ JSON    │ .json()  │ auto     │ auto              │ │
  │  ├─────────┼──────────┼──────────┼───────────────────┤ │
  │  │ Error   │ ❌ chỉ   │ ✅ throw │ ✅ built-in       │ │
  │  │ handle  │ network  │ on 4xx   │ error state       │ │
  │  ├─────────┼──────────┼──────────┼───────────────────┤ │
  │  │ Cancel  │ Abort    │ Cancel   │ ✅ auto           │ │
  │  │         │ Controller│ Token   │ on unmount        │ │
  │  ├─────────┼──────────┼──────────┼───────────────────┤ │
  │  │ Caching │ ❌       │ ❌       │ ✅ built-in!      │ │
  │  │ Retry   │ ❌       │ ❌       │ ✅ auto retry     │ │
  │  │ Dedup   │ ❌       │ ❌       │ ✅ deduplication  │ │
  │  │ Revalid │ ❌       │ ❌       │ ✅ stale-while    │ │
  │  ├─────────┼──────────┼──────────┼───────────────────┤ │
  │  │ Dùng khi│ Đơn giản │ HTTP     │ React app phức   │ │
  │  │         │ no dep   │ phức tạp │ tạp, cần cache!   │ │
  │  └─────────┴──────────┴──────────┴───────────────────┘ │
  │                                                        │
  │  PHÂN TẦNG:                                            │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  Layer 1: HTTP CLIENT (gửi/nhận request):       │  │
  │  │  → fetch() — browser built-in                   │  │
  │  │  → Axios — HTTP client library                  │  │
  │  │                                                  │  │
  │  │  Layer 2: DATA MANAGEMENT (cache, sync, state): │  │
  │  │  → SWR — stale-while-revalidate                │  │
  │  │  → TanStack Query — server state management     │  │
  │  │  → Dùng fetch/Axios BÊN TRONG để gọi API!     │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §2. fetch() + useEffect — Cơ Bản!

```javascript
// ═══════════════════════════════════════════════════════════
// fetch() TRONG useEffect — CÁC PATTERN:
// ═══════════════════════════════════════════════════════════

// ① CƠ BẢN (có đầy đủ loading/error/cleanup):
function UserList() {
  var dataState = React.useState(null);
  var data = dataState[0],
    setData = dataState[1];
  var loadState = React.useState(true);
  var loading = loadState[0],
    setLoading = loadState[1];
  var errState = React.useState(null);
  var error = errState[0],
    setError = errState[1];

  React.useEffect(function () {
    var cancelled = false; // ← cleanup flag!

    setLoading(true);
    fetch("https://api.example.com/users")
      .then(function (response) {
        // ⚠️ fetch KHÔNG throw lỗi khi 404/500!
        if (!response.ok) {
          throw new Error("HTTP " + response.status);
        }
        return response.json();
      })
      .then(function (json) {
        if (!cancelled) {
          // ← chỉ update nếu chưa unmount!
          setData(json);
          setLoading(false);
        }
      })
      .catch(function (err) {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });

    return function () {
      cancelled = true;
    }; // ← cleanup!
  }, []);

  if (loading) return React.createElement("p", null, "Loading...");
  if (error) return React.createElement("p", null, "Error: " + error);
  return React.createElement(
    "ul",
    null,
    data.map(function (user) {
      return React.createElement("li", { key: user.id }, user.name);
    }),
  );
}

// ② VỚI AbortController (đúng cách cancel!):
function UserProfile(props) {
  var userState = React.useState(null);
  var setUser = userState[1];

  React.useEffect(
    function () {
      var controller = new AbortController();

      fetch("/api/users/" + props.id, {
        signal: controller.signal, // ← truyền signal!
      })
        .then(function (r) {
          return r.json();
        })
        .then(function (data) {
          setUser(data);
        })
        .catch(function (err) {
          if (err.name !== "AbortError") {
            console.error(err); // chỉ log nếu KHÔNG phải abort!
          }
        });

      return function () {
        controller.abort(); // ← cancel request khi unmount/re-render!
      };
    },
    [props.id],
  );
}
```

---

## §3. Axios — Ưu Điểm!

```javascript
// ═══════════════════════════════════════════════════════════
// TỰ VIẾT — SimpleAxios (MÔ PHỎNG Axios core):
// ═══════════════════════════════════════════════════════════

var SimpleAxios = (function () {
  var _defaults = {
    baseURL: "",
    headers: { "Content-Type": "application/json" },
    timeout: 0,
  };
  var _interceptors = { request: [], response: [] };

  function mergeHeaders(a, b) {
    var result = {};
    for (var k in a) result[k] = a[k];
    for (var k in b) result[k] = b[k];
    return result;
  }

  function request(config) {
    var url = (_defaults.baseURL || "") + config.url;
    var headers = mergeHeaders(_defaults.headers, config.headers || {});

    // Chạy request interceptors:
    var finalConfig = {
      url: url,
      headers: headers,
      method: config.method,
      body: config.data,
      timeout: config.timeout || _defaults.timeout,
    };
    for (var i = 0; i < _interceptors.request.length; i++) {
      finalConfig = _interceptors.request[i](finalConfig);
    }

    var fetchOptions = {
      method: finalConfig.method || "GET",
      headers: finalConfig.headers,
    };

    if (finalConfig.body && finalConfig.method !== "GET") {
      fetchOptions.body =
        typeof finalConfig.body === "string"
          ? finalConfig.body
          : JSON.stringify(finalConfig.body); // ← AUTO stringify!
    }

    // Timeout:
    var controller = new AbortController();
    fetchOptions.signal = controller.signal;
    var timeoutId;
    if (finalConfig.timeout > 0) {
      timeoutId = setTimeout(function () {
        controller.abort();
      }, finalConfig.timeout);
    }

    return fetch(finalConfig.url, fetchOptions).then(function (response) {
      if (timeoutId) clearTimeout(timeoutId);

      return response.text().then(function (text) {
        var data;
        try {
          data = JSON.parse(text);
        } catch (e) {
          // ← AUTO parse JSON!
          data = text;
        }

        var result = {
          data: data,
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          config: finalConfig,
        };

        // ⚠️ KHÁC fetch: throw nếu status >= 400!
        if (!response.ok) {
          var err = new Error("Request failed: " + response.status);
          err.response = result;
          throw err;
        }

        // Chạy response interceptors:
        for (var j = 0; j < _interceptors.response.length; j++) {
          result = _interceptors.response[j](result);
        }
        return result;
      });
    });
  }

  return {
    defaults: _defaults,
    interceptors: _interceptors,
    get: function (url, config) {
      return request(Object.assign({ url: url, method: "GET" }, config));
    },
    post: function (url, data, config) {
      return request(
        Object.assign({ url: url, method: "POST", data: data }, config),
      );
    },
    put: function (url, data, config) {
      return request(
        Object.assign({ url: url, method: "PUT", data: data }, config),
      );
    },
    delete: function (url, config) {
      return request(Object.assign({ url: url, method: "DELETE" }, config));
    },
    create: function (instanceConfig) {
      var instance = Object.create(this);
      instance.defaults = Object.assign({}, _defaults, instanceConfig);
      return instance;
    },
  };
})();

// ═══════════════════════════════════════════════════════════
// AXIOS ƯU ĐIỂM SO VỚI fetch():
// ═══════════════════════════════════════════════════════════

// ① AUTO JSON — không cần .json():
// fetch: fetch(url).then(r => r.json()).then(data => ...)
// axios: axios.get(url).then(res => res.data)

// ② AUTO ERROR — throw khi 4xx/5xx:
// fetch: if (!response.ok) throw new Error(...)  ← PHẢI TỰ CHECK!
// axios: tự throw → catch bắt luôn!

// ③ INTERCEPTORS — xử lý global:
SimpleAxios.interceptors.request.push(function (config) {
  config.headers["Authorization"] = "Bearer " + getToken();
  return config;
});
SimpleAxios.interceptors.response.push(function (response) {
  console.log("Response:", response.status);
  return response;
});

// ④ TIMEOUT — built-in:
// fetch: phải dùng AbortController + setTimeout
// axios: { timeout: 5000 }  ← đơn giản!

// ⑤ INSTANCES — nhiều base URLs:
var apiClient = SimpleAxios.create({
  baseURL: "https://api.example.com/v1",
  timeout: 10000,
  headers: { "X-Custom": "value" },
});
```

---

## §4. Error Handling!

```javascript
// ═══════════════════════════════════════════════════════════
// ① fetch() ERROR HANDLING:
// ═══════════════════════════════════════════════════════════

function fetchWithErrorHandling(url) {
  return fetch(url)
    .then(function (response) {
      // ⚠️ fetch CHỈ reject khi NETWORK error!
      // 404, 500 → response.ok = false → PHẢI TỰ CHECK!
      if (!response.ok) {
        // Tạo error object chi tiết:
        return response
          .json()
          .catch(function () {
            return {};
          })
          .then(function (body) {
            var err = new Error(
              body.message || "HTTP Error " + response.status,
            );
            err.status = response.status;
            err.data = body;
            throw err;
          });
      }
      return response.json();
    })
    .catch(function (err) {
      // Phân loại error:
      if (err.name === "AbortError") {
        return { cancelled: true };
      }
      if (err.name === "TypeError") {
        // Network error / CORS / DNS failure:
        throw new Error("Network error: " + err.message);
      }
      throw err;
    });
}

// ② AXIOS ERROR HANDLING:
function axiosErrorHandling(url) {
  return SimpleAxios.get(url)
    .then(function (res) {
      return res.data;
    })
    .catch(function (err) {
      if (err.response) {
        // Server responded status >= 400:
        console.log("Status:", err.response.status);
        console.log("Data:", err.response.data);
      } else if (err.request) {
        // Request sent nhưng không có response:
        console.log("No response received");
      } else {
        // Setup error:
        console.log("Error:", err.message);
      }
      throw err;
    });
}

// ③ REACT HOOK — Error Boundary Pattern:
function useApiCall() {
  var state = React.useState({
    data: null,
    error: null,
    loading: false,
  });
  var setState = state[1];

  function execute(promiseFn) {
    setState({ data: null, error: null, loading: true });
    return promiseFn()
      .then(function (data) {
        setState({ data: data, error: null, loading: false });
        return data;
      })
      .catch(function (err) {
        var message;
        if (err.status === 401) message = "Vui lòng đăng nhập lại";
        else if (err.status === 403) message = "Không có quyền";
        else if (err.status === 404) message = "Không tìm thấy";
        else if (err.status === 422) message = "Dữ liệu không hợp lệ";
        else if (err.status >= 500) message = "Lỗi server";
        else message = err.message || "Có lỗi xảy ra";
        setState({ data: null, error: message, loading: false });
        throw err;
      });
  }

  return { state: state[0], execute: execute };
}
```

---

## §5. POST, PUT, DELETE!

```javascript
// ═══════════════════════════════════════════════════════════
// ① fetch() — POST/PUT/DELETE:
// ═══════════════════════════════════════════════════════════

// POST:
fetch("/api/users", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name: "John", email: "john@test.com" }),
})
  .then(function (r) {
    if (!r.ok) throw new Error(r.status);
    return r.json();
  })
  .then(function (user) {
    console.log("Created:", user);
  });

// PUT (update toàn bộ):
fetch("/api/users/1", {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name: "New Name", email: "new@test.com" }),
});

// PATCH (update một phần):
fetch("/api/users/1", {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name: "Updated Name" }),
});

// DELETE:
fetch("/api/users/1", { method: "DELETE" }).then(function (r) {
  if (!r.ok) throw new Error(r.status);
});

// ═══════════════════════════════════════════════════════════
// ② Axios — Ngắn gọn hơn nhiều!
// ═══════════════════════════════════════════════════════════

// POST — auto JSON stringify:
SimpleAxios.post("/api/users", { name: "John", email: "john@test.com" });
// PUT:
SimpleAxios.put("/api/users/1", { name: "New Name" });
// DELETE:
SimpleAxios.delete("/api/users/1");

// ═══════════════════════════════════════════════════════════
// ③ REACT HOOK — CRUD Operations:
// ═══════════════════════════════════════════════════════════

function useCrud(baseUrl) {
  function getAll() {
    return SimpleAxios.get(baseUrl).then(function (r) {
      return r.data;
    });
  }
  function getById(id) {
    return SimpleAxios.get(baseUrl + "/" + id).then(function (r) {
      return r.data;
    });
  }
  function create(data) {
    return SimpleAxios.post(baseUrl, data).then(function (r) {
      return r.data;
    });
  }
  function update(id, data) {
    return SimpleAxios.put(baseUrl + "/" + id, data).then(function (r) {
      return r.data;
    });
  }
  function remove(id) {
    return SimpleAxios.delete(baseUrl + "/" + id);
  }

  return {
    getAll: getAll,
    getById: getById,
    create: create,
    update: update,
    remove: remove,
  };
}
```

---

## §6. Headers & Auth Tokens!

```javascript
// ═══════════════════════════════════════════════════════════
// ① fetch() — Headers thủ công mỗi request:
// ═══════════════════════════════════════════════════════════

var token = localStorage.getItem("auth_token");

fetch("/api/protected", {
  headers: {
    "Content-Type": "application/json",
    Authorization: "Bearer " + token,
    "X-Request-ID": Date.now().toString(),
  },
});

// ② Axios — INTERCEPTOR (tự động cho MỌI request!):
SimpleAxios.interceptors.request.push(function (config) {
  var token = localStorage.getItem("auth_token");
  if (token) {
    config.headers["Authorization"] = "Bearer " + token;
  }
  config.headers["X-Request-ID"] = Date.now().toString();
  return config;
});
// → Mỗi request TỰ ĐỘNG có Authorization header!
// → KHÔNG cần truyền lại mỗi lần!

// ③ Axios Instance — headers mặc định:
var authApi = SimpleAxios.create({
  baseURL: "https://api.example.com",
  headers: {
    Authorization: "Bearer " + token,
    "Accept-Language": "vi",
  },
});

// ④ REFRESH TOKEN INTERCEPTOR:
SimpleAxios.interceptors.response.push(function (response) {
  return response;
});
// Thêm error interceptor cho 401:
// if (err.response.status === 401) → refreshToken() → retry!
```

---

## §7. Cancel Requests!

```javascript
// ═══════════════════════════════════════════════════════════
// ① fetch() — AbortController:
// ═══════════════════════════════════════════════════════════

function SearchWithCancel() {
  var controllerRef = React.useRef(null);

  function handleSearch(query) {
    // Cancel request trước (nếu có):
    if (controllerRef.current) controllerRef.current.abort();

    // Tạo controller mới:
    controllerRef.current = new AbortController();

    fetch("/api/search?q=" + query, {
      signal: controllerRef.current.signal,
    })
      .then(function (r) {
        return r.json();
      })
      .then(function (data) {
        console.log(data);
      })
      .catch(function (err) {
        if (err.name === "AbortError") return; // ignore!
        console.error(err);
      });
  }

  // Cleanup on unmount:
  React.useEffect(function () {
    return function () {
      if (controllerRef.current) controllerRef.current.abort();
    };
  }, []);

  return handleSearch;
}

// ② Axios — CancelToken (tương tự nhưng wraps AbortController):
function useAxiosCancel() {
  var controllerRef = React.useRef(null);

  function cancelableGet(url) {
    if (controllerRef.current) controllerRef.current.abort();
    controllerRef.current = new AbortController();

    return SimpleAxios.get(url, {
      signal: controllerRef.current.signal,
    });
  }

  React.useEffect(function () {
    return function () {
      if (controllerRef.current) controllerRef.current.abort();
    };
  }, []);

  return cancelableGet;
}
```

---

## §8. .then().catch() vs async/await!

```javascript
// ═══════════════════════════════════════════════════════════
// ① .then().catch() — Promise chain:
// ═══════════════════════════════════════════════════════════

function fetchUserChain(id) {
  return fetch("/api/users/" + id)
    .then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    })
    .then(function (user) {
      return fetch("/api/posts?userId=" + user.id);
    })
    .then(function (res) {
      return res.json();
    })
    .then(function (posts) {
      return posts;
    })
    .catch(function (err) {
      console.error("Error:", err);
      return null;
    });
}
// → Callback chain → khó đọc khi NHIỀU bước tuần tự!

// ═══════════════════════════════════════════════════════════
// ② async/await — Đồng bộ hóa cú pháp:
// ═══════════════════════════════════════════════════════════

async function fetchUserAsync(id) {
  try {
    var res = await fetch("/api/users/" + id);
    if (!res.ok) throw new Error("HTTP " + res.status);
    var user = await res.json();

    var postsRes = await fetch("/api/posts?userId=" + user.id);
    var posts = await postsRes.json();
    return posts;
  } catch (err) {
    console.error("Error:", err);
    return null;
  }
}
// → Đọc như code đồng bộ → DỄ HIỂU hơn!
// → try/catch thay .catch() → quen thuộc!

// ⚠️ TRONG useEffect — KHÔNG ĐƯỢC async trực tiếp!
React.useEffect(function () {
  // ❌ useEffect(async () => ...) → KHÔNG ĐƯỢC!
  // ✅ Tạo async function bên trong:
  async function loadData() {
    try {
      var res = await fetch("/api/data");
      var data = await res.json();
      setData(data);
    } catch (err) {
      setError(err.message);
    }
  }
  loadData();
}, []);
```

---

## §9. Pagination!

```javascript
// ═══════════════════════════════════════════════════════════
// PAGINATED DATA FETCHING:
// ═══════════════════════════════════════════════════════════

function usePagination(url, pageSize) {
  pageSize = pageSize || 10;
  var state = React.useState({
    data: [],
    page: 1,
    total: 0,
    loading: false,
    error: null,
    hasMore: true,
  });
  var s = state[0],
    setState = state[1];

  function fetchPage(page) {
    setState(function (prev) {
      return Object.assign({}, prev, { loading: true, error: null });
    });

    SimpleAxios.get(url, {
      params: { page: page, limit: pageSize },
    })
      .then(function (res) {
        setState(function (prev) {
          return {
            data:
              page === 1 ? res.data.items : prev.data.concat(res.data.items),
            page: page,
            total: res.data.total,
            loading: false,
            error: null,
            hasMore: page * pageSize < res.data.total,
          };
        });
      })
      .catch(function (err) {
        setState(function (prev) {
          return Object.assign({}, prev, {
            loading: false,
            error: err.message,
          });
        });
      });
  }

  React.useEffect(
    function () {
      fetchPage(1);
    },
    [url],
  );

  function nextPage() {
    if (s.hasMore && !s.loading) fetchPage(s.page + 1);
  }
  function prevPage() {
    if (s.page > 1 && !s.loading) fetchPage(s.page - 1);
  }
  function goToPage(p) {
    if (!s.loading) fetchPage(p);
  }

  return {
    data: s.data,
    page: s.page,
    total: s.total,
    loading: s.loading,
    error: s.error,
    hasMore: s.hasMore,
    nextPage: nextPage,
    prevPage: prevPage,
    goToPage: goToPage,
  };
}
```

---

## §10. SWR — Caching & Revalidation!

```javascript
// ═══════════════════════════════════════════════════════════
// TỰ VIẾT — SimpleSWR (mô phỏng SWR core logic):
// ═══════════════════════════════════════════════════════════

var SimpleSWR = (function () {
  var _cache = {}; // { key: { data, timestamp } }
  var _subscribers = {}; // { key: [setState callbacks] }
  var _inflights = {}; // { key: Promise } — deduplication!

  function useSWR(key, fetcher, options) {
    options = options || {};
    var revalidateOnFocus = options.revalidateOnFocus !== false;
    var revalidateOnReconnect = options.revalidateOnReconnect !== false;
    var dedupingInterval = options.dedupingInterval || 2000;
    var refreshInterval = options.refreshInterval || 0;

    var state = React.useState({
      data: _cache[key] ? _cache[key].data : undefined,
      error: undefined,
      isLoading: !_cache[key],
      isValidating: false,
    });
    var s = state[0],
      setState = state[1];

    function revalidate() {
      // ① DEDUPLICATION — không gọi trùng!
      if (_inflights[key]) return _inflights[key];

      setState(function (p) {
        return Object.assign({}, p, { isValidating: true });
      });

      _inflights[key] = fetcher(key)
        .then(function (data) {
          _cache[key] = { data: data, timestamp: Date.now() };
          setState({
            data: data,
            error: undefined,
            isLoading: false,
            isValidating: false,
          });
          // Notify tất cả subscribers (components khác cùng key):
          if (_subscribers[key]) {
            _subscribers[key].forEach(function (cb) {
              cb({
                data: data,
                error: undefined,
                isLoading: false,
                isValidating: false,
              });
            });
          }
          return data;
        })
        .catch(function (err) {
          setState(function (p) {
            return Object.assign({}, p, {
              error: err,
              isLoading: false,
              isValidating: false,
            });
          });
        })
        .finally(function () {
          delete _inflights[key];
        });

      return _inflights[key];
    }

    React.useEffect(
      function () {
        // Subscribe:
        if (!_subscribers[key]) _subscribers[key] = [];
        _subscribers[key].push(setState);

        // ② STALE-WHILE-REVALIDATE:
        if (_cache[key]) {
          setState(function (p) {
            return Object.assign({}, p, {
              data: _cache[key].data,
              isLoading: false,
            });
          });
        }
        revalidate(); // Revalidate in background!

        // ③ REVALIDATE ON FOCUS:
        function onFocus() {
          if (revalidateOnFocus) revalidate();
        }
        window.addEventListener("focus", onFocus);

        // ④ REVALIDATE ON RECONNECT:
        function onOnline() {
          if (revalidateOnReconnect) revalidate();
        }
        window.addEventListener("online", onOnline);

        // ⑤ POLLING (refreshInterval):
        var interval;
        if (refreshInterval > 0) {
          interval = setInterval(revalidate, refreshInterval);
        }

        return function () {
          var idx = _subscribers[key].indexOf(setState);
          if (idx > -1) _subscribers[key].splice(idx, 1);
          window.removeEventListener("focus", onFocus);
          window.removeEventListener("online", onOnline);
          if (interval) clearInterval(interval);
        };
      },
      [key],
    );

    return {
      data: s.data,
      error: s.error,
      isLoading: s.isLoading,
      isValidating: s.isValidating,
      mutate: function (newData) {
        _cache[key] = { data: newData, timestamp: Date.now() };
        setState(function (p) {
          return Object.assign({}, p, { data: newData });
        });
      },
    };
  }

  return { useSWR: useSWR, cache: _cache };
})();

// SỬ DỤNG:
function UserProfile(props) {
  var swrResult = SimpleSWR.useSWR("/api/users/" + props.id, function (url) {
    return fetch(url).then(function (r) {
      return r.json();
    });
  });

  if (swrResult.isLoading) return React.createElement("p", null, "Loading...");
  if (swrResult.error) return React.createElement("p", null, "Error!");
  return React.createElement("h1", null, swrResult.data.name);
  // → Lần đầu: Loading → fetch → hiện data
  // → Lần sau: hiện data CŨ ngay + fetch mới background!
  //   (STALE-WHILE-REVALIDATE!)
}
```

---

## §11. TanStack Query — Fetch & Cache!

```javascript
// ═══════════════════════════════════════════════════════════
// TỰ VIẾT — SimpleQuery (mô phỏng TanStack Query core):
// ═══════════════════════════════════════════════════════════

var SimpleQuery = (function () {
  var _cache = {};
  var _observers = {};

  function useQuery(options) {
    var queryKey = Array.isArray(options.queryKey)
      ? options.queryKey.join(":")
      : options.queryKey;
    var queryFn = options.queryFn;
    var staleTime = options.staleTime || 0;
    var cacheTime = options.cacheTime || 300000; // 5 min
    var retry = options.retry !== undefined ? options.retry : 3;
    var enabled = options.enabled !== false;

    var state = React.useState({
      data: _cache[queryKey] ? _cache[queryKey].data : undefined,
      error: null,
      status: _cache[queryKey] ? "success" : "loading",
      isFetching: false,
    });
    var s = state[0],
      setState = state[1];

    function fetchWithRetry(attempt) {
      return queryFn().catch(function (err) {
        if (attempt < retry) {
          // Exponential backoff:
          var delay = Math.min(1000 * Math.pow(2, attempt), 30000);
          return new Promise(function (resolve) {
            setTimeout(function () {
              resolve(fetchWithRetry(attempt + 1));
            }, delay);
          });
        }
        throw err;
      });
    }

    function fetchData() {
      // Check stale:
      var cached = _cache[queryKey];
      if (cached && Date.now() - cached.timestamp < staleTime) {
        setState({
          data: cached.data,
          error: null,
          status: "success",
          isFetching: false,
        });
        return;
      }

      setState(function (p) {
        return Object.assign({}, p, { isFetching: true });
      });

      fetchWithRetry(0)
        .then(function (data) {
          _cache[queryKey] = { data: data, timestamp: Date.now() };
          setState({
            data: data,
            error: null,
            status: "success",
            isFetching: false,
          });
        })
        .catch(function (err) {
          setState({
            data: undefined,
            error: err,
            status: "error",
            isFetching: false,
          });
        });
    }

    React.useEffect(
      function () {
        if (enabled) fetchData();
      },
      [queryKey, enabled],
    );

    return {
      data: s.data,
      error: s.error,
      status: s.status,
      isLoading: s.status === "loading",
      isError: s.status === "error",
      isSuccess: s.status === "success",
      isFetching: s.isFetching,
      refetch: fetchData,
    };
  }

  function invalidateQueries(keyPrefix) {
    for (var key in _cache) {
      if (key.indexOf(keyPrefix) === 0) delete _cache[key];
    }
  }

  return {
    useQuery: useQuery,
    invalidateQueries: invalidateQueries,
    cache: _cache,
  };
})();

// SỬ DỤNG:
function TodoList() {
  var query = SimpleQuery.useQuery({
    queryKey: ["todos"],
    queryFn: function () {
      return fetch("/api/todos").then(function (r) {
        return r.json();
      });
    },
    staleTime: 60000, // 1 phút — KHÔNG refetch nếu chưa stale!
  });

  if (query.isLoading) return React.createElement("p", null, "Loading...");
  if (query.isError) return React.createElement("p", null, "Error!");
  return React.createElement(
    "ul",
    null,
    query.data.map(function (t) {
      return React.createElement("li", { key: t.id }, t.title);
    }),
  );
}
```

---

## §12. SWR vs TanStack Query — Real-time!

```
  SWR vs TANSTACK QUERY:
  ┌────────────────────────────────────────────────────────┐
  │  Feature         │ SWR           │ TanStack Query     │
  │  ────────────────│───────────────│────────────────────│
  │  Stale-While     │ ✅ Core!      │ ✅ Có              │
  │  Revalidate      │ Mặc định ON  │ Configurable       │
  │  ────────────────│───────────────│────────────────────│
  │  staleTime       │ ❌ Luôn stale │ ✅ Configurable!   │
  │                  │ (revalidate)  │ (skip fetch nếu    │
  │                  │               │  chưa hết stale)   │
  │  ────────────────│───────────────│────────────────────│
  │  Mutations       │ mutate()      │ useMutation()!     │
  │                  │ manual        │ Built-in hook      │
  │  ────────────────│───────────────│────────────────────│
  │  Optimistic      │ ✅ mutate()   │ ✅ onMutate()      │
  │  Updates         │ + rollback    │ built-in pattern   │
  │  ────────────────│───────────────│────────────────────│
  │  Retry           │ ❌ Manual     │ ✅ Auto (3x)       │
  │                  │               │ exponential backoff│
  │  ────────────────│───────────────│────────────────────│
  │  DevTools        │ ❌            │ ✅ React Query     │
  │                  │               │ DevTools!          │
  │  ────────────────│───────────────│────────────────────│
  │  Infinite Query  │ useSWRInfinite│ useInfiniteQuery   │
  │  ────────────────│───────────────│────────────────────│
  │  Size            │ ~4KB          │ ~13KB              │
  │  ────────────────│───────────────│────────────────────│
  │  Khi nào dùng?   │ Nhẹ, đơn giản│ Phức tạp, mutation │
  │                  │ read-heavy    │ nhiều, cần DevTools│
  └────────────────────────────────────────────────────────┘
```

---

## §13. Optimistic Updates!

```javascript
// ═══════════════════════════════════════════════════════════
// OPTIMISTIC UPDATE — TỰ VIẾT:
// Cập nhật UI TRƯỚC → gọi API → rollback nếu fail!
// ═══════════════════════════════════════════════════════════

function useOptimisticUpdate(queryKey) {
  function optimisticMutate(mutationFn, optimisticData, rollbackData) {
    // ① Cập nhật cache NGAY (optimistic):
    SimpleSWR.cache[queryKey] = {
      data: optimisticData,
      timestamp: Date.now(),
    };

    // ② Gọi API:
    return mutationFn().catch(function (err) {
      // ③ ROLLBACK nếu fail:
      SimpleSWR.cache[queryKey] = {
        data: rollbackData,
        timestamp: Date.now(),
      };
      throw err;
    });
  }
  return optimisticMutate;
}

// VD: Toggle todo complete:
function TodoItem(props) {
  var todo = props.todo;
  var optimistic = useOptimisticUpdate("todos");

  function toggleComplete() {
    var updated = Object.assign({}, todo, { completed: !todo.completed });
    var originalTodos = SimpleSWR.cache["todos"].data;
    var newTodos = originalTodos.map(function (t) {
      return t.id === todo.id ? updated : t;
    });

    optimistic(
      function () {
        return SimpleAxios.put("/api/todos/" + todo.id, updated);
      },
      newTodos, // ← UI cập nhật NGAY!
      originalTodos, // ← rollback nếu API fail!
    );
  }

  return React.createElement(
    "li",
    {
      onClick: toggleComplete,
      style: { textDecoration: todo.completed ? "line-through" : "none" },
    },
    todo.title,
  );
}
```

---

## §14. Background Refetching & Invalidation!

```javascript
// ═══════════════════════════════════════════════════════════
// BACKGROUND REFETCHING:
// ═══════════════════════════════════════════════════════════

// SWR: TỰ ĐỘNG refetch khi:
// → Window focus (revalidateOnFocus: true — mặc định!)
// → Network reconnect (revalidateOnReconnect: true)
// → Interval (refreshInterval: 5000 — mỗi 5 giây)
// → Mount component (revalidateOnMount: true)

// TanStack Query: refetch khi:
// → Window focus (refetchOnWindowFocus: true — mặc định!)
// → Network reconnect (refetchOnReconnect: true)
// → Mount nếu stale (refetchOnMount: true)
// → Interval (refetchInterval: 5000)

// ═══════════════════════════════════════════════════════════
// MANUAL INVALIDATION:
// ═══════════════════════════════════════════════════════════

// SWR — mutate() để invalidate:
function createTodo(data) {
  return SimpleAxios.post("/api/todos", data).then(function () {
    // Force refetch todos:
    SimpleSWR.cache["todos"] = null;
    // Hoặc: mutate('/api/todos') → trigger revalidation!
  });
}

// TanStack Query — invalidateQueries():
function createTodoTQ(data) {
  return SimpleAxios.post("/api/todos", data).then(function () {
    SimpleQuery.invalidateQueries("todos");
    // → Xóa cache + trigger refetch cho mọi component
    //   đang subscribe key 'todos'!
  });
}
```

---

## §15. Tự Viết — Data Fetching Hook!

```javascript
// ═══════════════════════════════════════════════════════════
// COMPLETE DATA FETCHING HOOK — TỰ VIẾT!
// Kết hợp: caching + retry + cancel + dedup + stale-while!
// ═══════════════════════════════════════════════════════════

var useDataFetch = (function () {
  var _cache = {};

  return function (url, options) {
    options = options || {};
    var cacheTime = options.cacheTime || 60000;
    var retryCount = options.retry || 2;

    var state = React.useState({
      data: _cache[url] ? _cache[url].data : null,
      loading: !_cache[url],
      error: null,
    });
    var s = state[0],
      setState = state[1];
    var controllerRef = React.useRef(null);

    React.useEffect(
      function () {
        // Stale-while-revalidate:
        if (_cache[url] && Date.now() - _cache[url].ts < cacheTime) {
          setState({ data: _cache[url].data, loading: false, error: null });
          return;
        }

        controllerRef.current = new AbortController();
        setState(function (p) {
          return Object.assign({}, p, { loading: true });
        });

        function attempt(n) {
          return fetch(url, { signal: controllerRef.current.signal })
            .then(function (r) {
              if (!r.ok) throw new Error("HTTP " + r.status);
              return r.json();
            })
            .catch(function (err) {
              if (err.name === "AbortError") throw err;
              if (n < retryCount) {
                return new Promise(function (res) {
                  setTimeout(
                    function () {
                      res(attempt(n + 1));
                    },
                    1000 * (n + 1),
                  );
                });
              }
              throw err;
            });
        }

        attempt(0)
          .then(function (data) {
            _cache[url] = { data: data, ts: Date.now() };
            setState({ data: data, loading: false, error: null });
          })
          .catch(function (err) {
            if (err.name !== "AbortError") {
              setState({ data: null, loading: false, error: err.message });
            }
          });

        return function () {
          controllerRef.current.abort();
        };
      },
      [url],
    );

    return s;
  };
})();
```

---

## §16. Tổng Kết & Câu Hỏi Phỏng Vấn!

```
  DATA FETCHING — TỔNG KẾT:
  ┌────────────────────────────────────────────────────────┐
  │  fetch(): built-in, manual JSON/error, AbortController│
  │  Axios: auto JSON, throw 4xx, interceptors, instances │
  │  SWR: stale-while-revalidate, focus refetch, nhẹ 4KB │
  │  TanStack: staleTime, retry, mutations, DevTools, 13KB│
  └────────────────────────────────────────────────────────┘
```

**❓ Q1: fetch vs Axios khác gì?**

> fetch: built-in, phải tự `.json()`, KHÔNG throw 4xx/5xx (chỉ throw network error), cancel bằng AbortController. Axios: npm package (~13KB), auto parse JSON, auto throw 4xx/5xx, interceptors (auto attach token), instances (baseURL), timeout built-in. → Axios tiện hơn cho projects lớn!

**❓ Q2: SWR vs TanStack Query?**

> SWR (~4KB): stale-while-revalidate strategy, luôn coi data là stale → refetch background. TanStack Query (~13KB): có **staleTime** (skip fetch nếu chưa stale), **retry** tự động (3x + exponential backoff), **useMutation** built-in, **DevTools** debug cache. → SWR cho read-heavy đơn giản, TanStack cho CRUD phức tạp!

**❓ Q3: Optimistic update là gì?**

> Cập nhật UI **TRƯỚC** khi API trả về → UX nhanh hơn! Flow: ① Lưu data cũ (rollback), ② Cập nhật cache/UI với data mới, ③ Gọi API, ④ Nếu fail → rollback data cũ. VD: toggle todo → UI đổi ngay → API call background → nếu fail → revert.

**❓ Q4: Cancel request khi nào?**

> ① Component unmount (tránh setState trên unmounted). ② User search mới (cancel search cũ). ③ Route change trong SPA. Dùng AbortController (fetch) hoặc CancelToken (Axios cũ). Trong useEffect cleanup: `controller.abort()`. SWR/TanStack Query tự cancel!

**❓ Q5: async/await vs .then() trong React?**

> async/await dễ đọc hơn (code tuần tự), try/catch quen thuộc. `.then()` tốt cho chain đơn giản. **⚠️ useEffect KHÔNG chấp nhận async function** (vì cleanup phải sync) → tạo async function BÊN TRONG useEffect rồi gọi!

---

> 📝 **Ghi nhớ cuối cùng:**
> "fetch = manual, Axios = convenient, SWR/TQ = smart caching! fetch không throw 4xx! useEffect không async trực tiếp! AbortController cancel request! Stale-while-revalidate = hiện cũ + fetch mới background! Optimistic = update UI trước → rollback nếu fail! Invalidate queries sau mutation!"
