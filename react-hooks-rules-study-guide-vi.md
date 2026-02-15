# Hướng Dẫn Học Tập: Tại Sao Không Thể Đặt useEffect Trong Câu Lệnh If?

## Câu hỏi
Tại sao React không cho phép đặt `useEffect` (và các Hooks khác) bên trong câu lệnh `if`?

---

## Trả lời ngắn gọn

**Thứ tự gọi React Hooks phải ổn định và nhất quán qua mọi lần render.** React phân biệt và quản lý các Hooks khác nhau dựa trên **thứ tự gọi** của chúng, không phải dựa trên tên hay vị trí trong code.

---

## 🔍 Giải thích chi tiết

### Cách React quản lý Hooks

React lưu trữ các Hooks trong một **linked list** (danh sách liên kết) hoặc cấu trúc tương tự, theo thứ tự chúng được gọi:

```javascript
function Component() {
  const [count, setCount] = useState(0);  // Hook 1
  useEffect(() => {});                    // Hook 2
  const [name, setName] = useState("");   // Hook 3
}
```

**Cấu trúc nội bộ của React:**
```
[Hook1, Hook2, Hook3]
  ↓       ↓       ↓
[count, effect, name]
```

React **không lưu tên biến** (`count`, `name`), mà chỉ lưu **vị trí trong danh sách**.

---

## ❌ Vấn đề khi đặt Hook trong điều kiện

### Ví dụ sai:

```javascript
function Component({ isLoggedIn }) {
  const [count, setCount] = useState(0);  // Hook 1
  
  if (isLoggedIn) {
    useEffect(() => {                     // Hook 2 (có điều kiện)
      console.log('User logged in');
    });
  }
  
  const [name, setName] = useState("");   // Hook 3 hoặc Hook 2?
}
```

### Vấn đề xảy ra:

#### Lần render đầu tiên (isLoggedIn = true):
```
Hook 1: useState(0)      → count
Hook 2: useEffect(...)   → effect
Hook 3: useState("")     → name
```

#### Lần render thứ hai (isLoggedIn = false):
```
Hook 1: useState(0)      → count
Hook 2: useState("")     → name (❌ React nghĩ đây là effect!)
```

**Kết quả:** React bị lẫn lộn, không biết Hook nào tương ứng với state nào → **BUG nghiêm trọng!**

---

## 🧠 Cơ chế hoạt động của React Hooks

### 1. React sử dụng Linked List

React lưu trữ Hooks trong một cấu trúc giống linked list:

```javascript
// Cấu trúc đơn giản hóa
const fiber = {
  memoizedState: {
    // Hook đầu tiên
    memoizedState: 0,           // Giá trị của useState
    next: {
      // Hook thứ hai
      memoizedState: effectObject,
      next: {
        // Hook thứ ba
        memoizedState: "",
        next: null
      }
    }
  }
};
```

### 2. React duyệt Hooks theo thứ tự

**Lần render đầu tiên (Mount):**
```javascript
let currentHook = null;  // Con trỏ hiện tại

function useState(initialValue) {
  // Tạo Hook mới và thêm vào cuối danh sách
  const hook = {
    memoizedState: initialValue,
    next: null
  };
  
  if (currentHook === null) {
    // Hook đầu tiên
    fiber.memoizedState = hook;
  }else {
    // Thêm vào cuối
    currentHook.next = hook;
  }
  
  currentHook = hook;
  return [hook.memoizedState, setState];
}
```

**Các lần render sau (Update):**
```javascript
let currentHook = fiber.memoizedState;  // Bắt đầu từ đầu danh sách

function useState(initialValue) {
  // Lấy Hook từ danh sách đã có
  const hook = currentHook;
  currentHook = currentHook.next;  // Di chuyển con trỏ
  
  return [hook.memoizedState, setState];
}
```

### 3. Vấn đề khi thứ tự thay đổi

```javascript
// Render 1: isLoggedIn = true
currentHook → Hook1 → Hook2 → Hook3 → null

// Render 2: isLoggedIn = false
currentHook → Hook1 → Hook3 → null
//                      ↑
//                React nghĩ đây là Hook2!
```

---

## 🔧 Cơ chế của useEffect

### Workflow của useEffect

```javascript
useEffect(() => {
  // Effect callback
  return () => {
    // Cleanup function
  };
}, [dependencies]);
```

### Các bước React thực hiện:

#### 1. So sánh dependencies

```javascript
function useEffect(callback, deps) {
  const prevDeps = currentHook.memoizedState?.deps;
  
  // So sánh từng dependency
  const hasChanged = !prevDeps || 
    deps.some((dep, i) => !Object.is(dep, prevDeps[i]));
  
  if (hasChanged) {
    // Đánh dấu cần chạy effect
    scheduleEffect(callback);
  }
  
  // Lưu deps mới
  currentHook.memoizedState = { deps, cleanup: null };
}
```

#### 2. Thực thi và Cleanup

**Khi component mount:**
```
1. Render component
2. Commit changes to DOM
3. Chạy useEffect callback
4. Lưu cleanup function (nếu có)
```

**Khi dependencies thay đổi:**
```
1. Render component
2. Commit changes to DOM
3. Chạy cleanup function cũ (nếu có)
4. Chạy useEffect callback mới
5. Lưu cleanup function mới
```

**Khi component unmount:**
```
1. Chạy tất cả cleanup functions
2. Xóa component khỏi DOM
```

### Ví dụ minh họa:

```javascript
function Timer() {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    console.log('Effect: Setup timer');
    const id = setInterval(() => {
      setCount(c => c + 1);
    }, 1000);
    
    return () => {
      console.log('Cleanup: Clear timer');
      clearInterval(id);
    };
  }, []); // Chỉ chạy 1 lần
  
  return <div>{count}</div>;
}
```

**Timeline:**
```
Mount:
  → Render
  → Commit to DOM
  → Console: "Effect: Setup timer"
  → Timer bắt đầu chạy

Unmount:
  → Console: "Cleanup: Clear timer"
  → Timer bị dừng
  → Component bị xóa
```

---

## 📋 Rules of Hooks (Quy tắc của Hooks)

### Quy tắc 1: Chỉ gọi Hooks ở top level

```javascript
// ✅ ĐÚNG
function Component() {
  const [count, setCount] = useState(0);
  useEffect(() => {});
  const [name, setName] = useState("");
}

// ❌ SAI - Trong điều kiện
function Component({ condition }) {
  if (condition) {
    const [count, setCount] = useState(0);  // ❌
  }
}

// ❌ SAI - Trong vòng lặp
function Component() {
  for (let i = 0; i < 3; i++) {
    useEffect(() => {});  // ❌
  }
}

// ❌ SAI - Trong nested function
function Component() {
  function handleClick() {
    const [count, setCount] = useState(0);  // ❌
  }
}
```

### Quy tắc 2: Chỉ gọi Hooks từ React functions

```javascript
// ✅ ĐÚNG - Trong React component
function Component() {
  const [count, setCount] = useState(0);
}

// ✅ ĐÚNG - Trong Custom Hook
function useCustomHook() {
  const [value, setValue] = useState(0);
  return value;
}

// ❌ SAI - Trong function thường
function regularFunction() {
  const [count, setCount] = useState(0);  // ❌
}

// ❌ SAI - Trong class method
class Component extends React.Component {
  handleClick() {
    const [count, setCount] = useState(0);  // ❌
  }
}
```

---

## 💡 Giải pháp: Đặt điều kiện BÊN TRONG Hook

### Thay vì điều kiện bên ngoài:

```javascript
// ❌ SAI
function Component({ isLoggedIn }) {
  if (isLoggedIn) {
    useEffect(() => {
      console.log('User logged in');
    });
  }
}
```

### Đặt điều kiện bên trong:

```javascript
// ✅ ĐÚNG
function Component({ isLoggedIn }) {
  useEffect(() => {
    if (isLoggedIn) {
      console.log('User logged in');
    }
  }, [isLoggedIn]);
}
```

---

## 🎯 Các trường hợp thực tế

### Trường hợp 1: Effect có điều kiện

```javascript
// ❌ SAI
function UserProfile({ userId }) {
  if (userId) {
    useEffect(() => {
      fetchUser(userId);
    }, [userId]);
  }
}

// ✅ ĐÚNG - Cách 1: Điều kiện bên trong
function UserProfile({ userId }) {
  useEffect(() => {
    if (userId) {
      fetchUser(userId);
    }
  }, [userId]);
}

// ✅ ĐÚNG - Cách 2: Early return
function UserProfile({ userId }) {
  useEffect(() => {
    if (!userId) return;
    
    fetchUser(userId);
  }, [userId]);
}
```

### Trường hợp 2: Multiple effects có điều kiện

```javascript
// ❌ SAI
function Dashboard({ user, settings }) {
  if (user) {
    useEffect(() => {
      trackUser(user);
    }, [user]);
  }
  
  if (settings) {
    useEffect(() => {
      applySettings(settings);
    }, [settings]);
  }
}

// ✅ ĐÚNG
function Dashboard({ user, settings }) {
  useEffect(() => {
    if (user) {
      trackUser(user);
    }
  }, [user]);
  
  useEffect(() => {
    if (settings) {
      applySettings(settings);
    }
  }, [settings]);
}
```

### Trường hợp 3: Conditional rendering

```javascript
// ❌ SAI
function App({ isAuthenticated }) {
  if (!isAuthenticated) {
    return <Login />;
  }
  
  // Hook sau return có điều kiện
  useEffect(() => {
    loadUserData();
  }, []);
  
  return <Dashboard />;
}

// ✅ ĐÚNG - Cách 1: Hook trước return
function App({ isAuthenticated }) {
  useEffect(() => {
    if (isAuthenticated) {
      loadUserData();
    }
  }, [isAuthenticated]);
  
  if (!isAuthenticated) {
    return <Login />;
  }
  
  return <Dashboard />;
}

// ✅ ĐÚNG - Cách 2: Tách component
function App({ isAuthenticated }) {
  if (!isAuthenticated) {
    return <Login />;
  }
  
  return <AuthenticatedApp />;
}

function AuthenticatedApp() {
  useEffect(() => {
    loadUserData();
  }, []);
  
  return <Dashboard />;
}
```

---

## 🔬 Deep Dive: React Internals

### Cấu trúc Hook trong React

```javascript
// Đơn giản hóa từ React source code
type Hook = {
  memoizedState: any,        // State hiện tại
  baseState: any,            // State cơ sở
  baseQueue: Update | null,  // Queue của updates
  queue: UpdateQueue | null, // Queue hiện tại
  next: Hook | null,         // Hook tiếp theo
};

type Effect = {
  tag: HookEffectTag,        // Mount, Update, Unmount
  create: () => (() => void) | void,  // Effect callback
  destroy: (() => void) | void,       // Cleanup function
  deps: Array<mixed> | null,          // Dependencies
  next: Effect,              // Effect tiếp theo
};
```

### Quá trình render

```javascript
// Pseudo-code đơn giản hóa

// MOUNT PHASE
function mountWorkInProgressHook() {
  const hook = {
    memoizedState: null,
    baseState: null,
    baseQueue: null,
    queue: null,
    next: null,
  };
  
  if (workInProgressHook === null) {
    // Hook đầu tiên
    currentlyRenderingFiber.memoizedState = workInProgressHook = hook;
  } else {
    // Thêm vào cuối
    workInProgressHook = workInProgressHook.next = hook;
  }
  
  return workInProgressHook;
}

// UPDATE PHASE
function updateWorkInProgressHook() {
  // Lấy Hook từ lần render trước
  let nextCurrentHook;
  
  if (currentHook === null) {
    // Hook đầu tiên
    nextCurrentHook = currentlyRenderingFiber.alternate.memoizedState;
  } else {
    // Hook tiếp theo
    nextCurrentHook = currentHook.next;
  }
  
  if (nextCurrentHook === null) {
    // ❌ Số lượng Hooks không khớp!
    throw new Error('Rendered more hooks than during the previous render');
  }
  
  currentHook = nextCurrentHook;
  
  // Clone Hook
  const newHook = {
    memoizedState: currentHook.memoizedState,
    baseState: currentHook.baseState,
    baseQueue: currentHook.baseQueue,
    queue: currentHook.queue,
    next: null,
  };
  
  if (workInProgressHook === null) {
    workInProgressHook = newHook;
  } else {
    workInProgressHook = workInProgressHook.next = newHook;
  }
  
  return workInProgressHook;
}
```

---

## 🛠️ ESLint Plugin

React cung cấp ESLint plugin để phát hiện vi phạm Rules of Hooks:

### Cài đặt

```bash
npm install eslint-plugin-react-hooks --save-dev
```

### Cấu hình .eslintrc

```json
{
  "plugins": ["react-hooks"],
  "rules": {
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

### Ví dụ lỗi được phát hiện

```javascript
function Component({ condition }) {
  // ❌ ESLint error: React Hook "useState" is called conditionally
  if (condition) {
    const [count, setCount] = useState(0);
  }
  
  // ❌ ESLint error: React Hook "useEffect" is called conditionally
  condition && useEffect(() => {});
  
  // ❌ ESLint error: React Hook "useCallback" may be executed more than once
  for (let i = 0; i < 3; i++) {
    useCallback(() => {}, []);
  }
}
```

---

## 📊 So sánh các cách xử lý điều kiện

| Cách xử lý | Ưu điểm | Nhược điểm | Khi nào dùng |
|------------|---------|------------|--------------|
| **Điều kiện bên trong Hook** | Đơn giản, tuân thủ rules | Effect vẫn chạy mỗi lần render | Điều kiện đơn giản |
| **Early return trong effect** | Rõ ràng, dễ đọc | Effect vẫn được tạo | Logic phức tạp |
| **Dependencies array** | Tối ưu, chỉ chạy khi cần | Phải quản lý deps cẩn thận | Điều kiện dựa trên props/state |
| **Tách component** | Sạch sẽ, tách biệt logic | Thêm component | Logic hoàn toàn khác nhau |

---

## 🎓 Bài tập thực hành

### Bài tập 1: Sửa lỗi vi phạm Rules of Hooks

```javascript
// ❌ Code có lỗi
function UserDashboard({ user, isAdmin }) {
  const [data, setData] = useState(null);
  
  if (user) {
    useEffect(() => {
      fetchUserData(user.id).then(setData);
    }, [user.id]);
  }
  
  if (isAdmin) {
    const [adminData, setAdminData] = useState(null);
    useEffect(() => {
      fetchAdminData().then(setAdminData);
    }, []);
  }
  
  return <div>{/* ... */}</div>;
}

// ✅ Code đã sửa
function UserDashboard({ user, isAdmin }) {
  const [data, setData] = useState(null);
  const [adminData, setAdminData] = useState(null);
  
  useEffect(() => {
    if (user) {
      fetchUserData(user.id).then(setData);
    }
  }, [user]);
  
  useEffect(() => {
    if (isAdmin) {
      fetchAdminData().then(setAdminData);
    }
  }, [isAdmin]);
  
  return <div>{/* ... */}</div>;
}
```

---

### Bài tập 2: Tối ưu với dependencies

```javascript
// ❌ Không tối ưu - Effect chạy mỗi lần render
function SearchResults({ query, filters }) {
  const [results, setResults] = useState([]);
  
  useEffect(() => {
    if (query) {
      searchAPI(query, filters).then(setResults);
    }
  }); // Thiếu dependencies array
  
  return <div>{/* ... */}</div>;
}

// ✅ Tối ưu - Effect chỉ chạy khi query hoặc filters thay đổi
function SearchResults({ query, filters }) {
  const [results, setResults] = useState([]);
  
  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }
    
    let cancelled = false;
    
    searchAPI(query, filters).then(data => {
      if (!cancelled) {
        setResults(data);
      }
    });
    
    return () => {
      cancelled = true;
    };
  }, [query, filters]);
  
  return <div>{/* ... */}</div>;
}
```

---

### Bài tập 3: Tách component

```javascript
// ❌ Logic phức tạp trong một component
function App({ user }) {
  const [profile, setProfile] = useState(null);
  const [settings, setSettings] = useState(null);
  const [notifications, setNotifications] = useState([]);
  
  useEffect(() => {
    if (user) {
      fetchProfile(user.id).then(setProfile);
    }
  }, [user]);
  
  useEffect(() => {
    if (user) {
      fetchSettings(user.id).then(setSettings);
    }
  }, [user]);
  
  useEffect(() => {
    if (user) {
      const unsubscribe = subscribeToNotifications(user.id, setNotifications);
      return unsubscribe;
    }
  }, [user]);
  
  if (!user) {
    return <Login />;
  }
  
  return <Dashboard profile={profile} settings={settings} notifications={notifications} />;
}

// ✅ Tách thành các component nhỏ
function App({ user }) {
  if (!user) {
    return <Login />;
  }
  
  return <AuthenticatedApp user={user} />;
}

function AuthenticatedApp({ user }) {
  return (
    <Dashboard 
      profile={<UserProfile userId={user.id} />}
      settings={<UserSettings userId={user.id}/>}
      notifications={<Notifications userId={user.id}/>}
    />
  );
}

function UserProfile({ userId }) {
  const [profile, setProfile] = useState(null);
  
  useEffect(() => {
    fetchProfile(userId).then(setProfile);
  }, [userId]);
  
  return <div>{/* ... */}</div>;
}

function UserSettings({ userId }) {
  const [settings, setSettings] = useState(null);
  
  useEffect(() => {
    fetchSettings(userId).then(setSettings);
  }, [userId]);
  
  return <div>{/* ... */}</div>;
}

function Notifications({ userId }) {
  const [notifications, setNotifications] = useState([]);
  
  useEffect(() => {
    const unsubscribe = subscribeToNotifications(userId, setNotifications);
    return unsubscribe;
  }, [userId]);
  
  return <div>{/* ... */}</div>;
}
```

---

## 🌟 Best Practices

### 1. Luôn tuân thủ Rules of Hooks

```javascript
// ✅ GOOD
function Component() {
  const [state1, setState1] = useState(0);
  const [state2, setState2] = useState("");
  useEffect(() => {}, []);
  useEffect(() => {}, [state1]);
}

// ❌ BAD
function Component({ condition }) {
  const [state1, setState1] = useState(0);
  
  if (condition) {
    useEffect(() => {}, []);  // Vi phạm rules
  }
}
```

---

### 2. Sử dụng ESLint plugin

```javascript
// Cài đặt và cấu hình eslint-plugin-react-hooks
// để tự động phát hiện lỗi
```

---

### 3. Đặt điều kiện bên trong Hook

```javascript
// ✅ GOOD
useEffect(() => {
  if (condition) {
    doSomething();
  }
}, [condition]);

// ❌ BAD
if (condition) {
  useEffect(() => {
    doSomething();
  }, []);
}
```

---

### 4. Tách component khi logic phức tạp

```javascript
// ✅ GOOD - Logic rõ ràng, dễ maintain
function App({ user }) {
  if (!user) return <Login />;
  return <Dashboard user={user} />;
}

function Dashboard({ user }) {
  useEffect(() => {
    loadDashboardData(user);
  }, [user]);
  
  return <div>{/* ... */}</div>;
}

// ❌ BAD - Logic lộn xộn
function App({ user }) {
  useEffect(() => {
    if (user) {
      loadDashboardData(user);
    }
  }, [user]);
  
  if (!user) return <Login />;
  return <div>{/* ... */}</div>;
}
```

---

### 5. Sử dụng Custom Hooks để tái sử dụng logic

```javascript
// ✅ GOOD - Tái sử dụng được
function useUserData(userId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (!userId) return;
    
    setLoading(true);
    fetchUserData(userId)
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [userId]);
  
  return { data, loading, error };
}

// Sử dụng ở nhiều component
function ComponentA({ userId }) {
  const { data, loading } = useUserData(userId);
  // ...
}

function ComponentB({ userId }) {
  const { data, error } = useUserData(userId);
  // ...
}
```

---

## 📚 Thuật ngữ quan trọng

- **Rules of Hooks**: Quy tắc sử dụng Hooks trong React
- **Top Level**: Cấp độ cao nhất của function, không nằm trong điều kiện/vòng lặp
- **Linked List**: Danh sách liên kết - cấu trúc dữ liệu lưu trữ Hooks
- **Fiber**: Đơn vị công việc trong React reconciliation
- **Memoized State**: State được ghi nhớ giữa các lần render
- **Mount**: Lần render đầu tiên của component
- **Update**: Các lần render sau của component
- **Unmount**: Khi component bị xóa khỏi DOM
- **Cleanup Function**: Hàm dọn dẹp trong useEffect
- **Dependencies Array**: Mảng dependencies của useEffect/useCallback/useMemo

---

## 🎯 Kết luận

### Những điểm quan trọng cần nhớ:

1. **Thứ tự gọi Hooks phải nhất quán** qua mọi lần render
2. React quản lý Hooks dựa trên **thứ tự**, không phải tên
3. **Không được đặt Hooks** trong if, loops, hoặc nested functions
4. **Đặt điều kiện bên trong Hook**, không phải bên ngoài
5. Sử dụng **ESLint plugin** để phát hiện lỗi sớm

### Tại sao quy tắc này quan trọng:

- Đảm bảo **state được quản lý đúng** giữa các lần render
- Tránh **bugs khó debug** liên quan đến state
- Giúp React **tối ưu hiệu suất** reconciliation
- Đảm bảo **cleanup functions** hoạt động đúng
- Làm code **dễ đọc và maintain** hơn

### Khi gặp lỗi:

1. Kiểm tra xem có Hook nào trong điều kiện không
2. Đảm bảo số lượng Hooks gọi luôn giống nhau
3. Sử dụng ESLint để phát hiện vi phạm
4. Đặt điều kiện bên trong Hook thay vì bên ngoài
5. Tách component nếu logic quá phức tạp

---

*Study guide này giúp bạn hiểu sâu về Rules of Hooks và lý do tại sao React yêu cầu tuân thủ chúng. Hãy luôn nhớ: Hooks phải được gọi ở top level và theo thứ tự nhất quán!*
