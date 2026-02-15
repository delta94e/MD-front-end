# Provider Pattern — Deep Dive

> 📅 2026-02-15 · ⏱ 20 phút đọc
>
> Provider Concept & Context API,
> Prop Drilling Problem,
> ThemeProvider Example,
> Custom Hook Pattern,
> Performance Optimization,
> Multiple Contexts,
> TypeScript Integration,
> Real-World Applications & Tradeoffs
> Độ khó: ⭐️⭐️⭐️⭐️ | React Design Pattern

---

## Mục Lục

| #   | Phần                                     |
| --- | ---------------------------------------- |
| 1   | Provider Pattern là gì?                  |
| 2   | Vấn đề — Prop Drilling                   |
| 3   | Context API — Giải pháp                  |
| 4   | ThemeProvider — Ví dụ kinh điển          |
| 5   | Custom Hook — Best Practice              |
| 6   | Custom Provider Component                |
| 7   | useReducer + Context                     |
| 8   | Multiple Contexts                        |
| 9   | Performance — Re-render Problem          |
| 10  | Performance — Optimization               |
| 11  | TypeScript Integration                   |
| 12  | Async Actions với Context                |
| 13  | styled-components ThemeProvider          |
| 14  | Component Composition — Thay thế Context |
| 15  | Real-World Applications                  |
| 16  | Tradeoffs — Ưu & Nhược điểm              |
| 17  | Tóm tắt                                  |

---

## §1. Provider Pattern là gì?

```
PROVIDER PATTERN — KHÁI NIỆM:
═══════════════════════════════════════════════════════════════

  ĐỊNH NGHĨA:
  → Provider = CUNG CẤP data cho NHIỀU components!
  → KHÔNG cần truyền props qua từng tầng!
  → Dùng React Context API!
  → Wrap components trong Provider → TẤT CẢ con cháu
    đều ACCESS được data!

  VÍ DỤ THỰC TẾ: ĐÀI PHÁT THANH!
  ┌──────────────────────────────────────────────┐
  │              📡 Provider                     │
  │         (Đài phát thanh!)                    │
  │    Phát sóng: theme, user, locale...        │
  │                                              │
  │  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐       │
  │  │📻 A │  │📻 B │  │  C  │  │📻 D │       │
  │  │dùng │  │dùng │  │KHÔNG│  │dùng │       │
  │  │data │  │data │  │ cần │  │data │       │
  │  └─────┘  └─────┘  └─────┘  └─────┘       │
  └──────────────────────────────────────────────┘

  → Provider PHÁT SÓNG data!
  → Components CẦN thì BẮT SÓNG (useContext!)
  → Components KHÔNG CẦN thì KHÔNG ảnh hưởng!
  → → KHÔNG cần truyền props qua trung gian!

  KHI NÀO DÙNG:
  → Theme (light/dark mode!)
  → Authentication (user info!)
  → Locale/Language (i18n!)
  → Feature Flags!
  → Shopping Cart!
  → Bất kỳ data nào NHIỀU components cần!
```

---

## §2. Vấn đề — Prop Drilling

```javascript
// ═══ VẤN ĐỀ: PROP DRILLING! ═══

// ❌ BAD — truyền data qua TỪNG TẦNG:
function App() {
  const data = { listItem: "Item 1", title: "Hello", text: "World" };

  return (
    <div>
      <SideBar data={data} /> {/* ← Truyền data! */}
      <Content data={data} /> {/* ← Truyền data! */}
    </div>
  );
}

// SideBar KHÔNG DÙNG data, chỉ TRUYỀN TIẾP!
const SideBar = ({ data }) => <List data={data} />; // ← Trung gian!
const List = ({ data }) => <ListItem data={data} />; // ← Trung gian!
const ListItem = ({ data }) => <span>{data.listItem}</span>; // ← DÙNG!

// Content KHÔNG DÙNG data, chỉ TRUYỀN TIẾP!
const Content = ({ data }) => (
  <div>
    <Header data={data} /> {/* ← Trung gian! */}
    <Block data={data} /> {/* ← Trung gian! */}
  </div>
);
const Header = ({ data }) => <div>{data.title}</div>; // ← DÙNG!
const Block = ({ data }) => <Text data={data} />; // ← Trung gian!
const Text = ({ data }) => <h1>{data.text}</h1>; // ← DÙNG!
```

```
PROP DRILLING — VẤN ĐỀ:
═══════════════════════════════════════════════════════════════

  App (data) ─────────────────────────┐
    ├── SideBar (data) ← KHÔNG DÙNG! │ Chỉ truyền tiếp!
    │     └── List (data) ← KHÔNG!   │
    │           └── ListItem (data) ← DÙNG! ✅
    └── Content (data) ← KHÔNG DÙNG! │
          ├── Header (data) ← DÙNG! ✅
          └── Block (data) ← KHÔNG!  │
                └── Text (data) ← DÙNG! ✅

  VẤN ĐỀ:
  → SideBar, List, Content, Block = TRUNG GIAN vô nghĩa!
  → Đổi tên prop "data"? → SỬA TẤT CẢ 8 components!
  → Thêm prop mới? → SỬA TẤT CẢ trung gian!
  → Khó biết data ĐẾN TỪ ĐÂU!
  → App càng LỚN → càng NIGHTMARE!
```

---

## §3. Context API — Giải pháp

```javascript
// ═══ GIẢI PHÁP: PROVIDER PATTERN! ═══

// ① Tạo Context:
const DataContext = React.createContext();

// ② Wrap trong Provider:
function App() {
  const data = { listItem: "Item 1", title: "Hello", text: "World" };

  return (
    <div>
      <DataContext.Provider value={data}>
        <SideBar /> {/* ← KHÔNG cần prop! */}
        <Content /> {/* ← KHÔNG cần prop! */}
      </DataContext.Provider>
    </div>
  );
}

// Trung gian = SẠCH! Không biết gì về data!
const SideBar = () => <List />;
const List = () => <ListItem />;
const Content = () => (
  <div>
    <Header />
    <Block />
  </div>
);
const Block = () => <Text />;

// ③ Chỉ components CẦN mới useContext!
function ListItem() {
  const data = React.useContext(DataContext);
  return <span>{data.listItem}</span>; // ← Trực tiếp!
}

function Header() {
  const data = React.useContext(DataContext);
  return <div>{data.title}</div>; // ← Trực tiếp!
}

function Text() {
  const data = React.useContext(DataContext);
  return <h1>{data.text}</h1>; // ← Trực tiếp!
}
```

```
SAU KHI DÙNG PROVIDER:
═══════════════════════════════════════════════════════════════

  DataContext.Provider (value={data})
    ├── SideBar ← SẠCH! Không prop!
    │     └── List ← SẠCH!
    │           └── ListItem ← useContext(DataContext) ✅
    └── Content ← SẠCH!
          ├── Header ← useContext(DataContext) ✅
          └── Block ← SẠCH!
                └── Text ← useContext(DataContext) ✅

  → Trung gian KHÔNG CẦN biết về data!
  → Chỉ 3 components DÙNG data mới useContext!
  → Đổi tên? Chỉ sửa ở Provider + 3 consumers!
  → CLEAN! MAINTAINABLE!
```

---

## §4. ThemeProvider — Ví dụ kinh điển

```javascript
// ═══ THEME PROVIDER — LIGHT/DARK MODE ═══

import React, { useState, createContext, useContext } from "react";

// ① Tạo Context:
export const ThemeContext = createContext();

// ② Định nghĩa themes:
const themes = {
  light: { background: "#fff", color: "#000" },
  dark: { background: "#171717", color: "#fff" },
};

// ③ App = Provider!
export default function App() {
  const [theme, setTheme] = useState("dark");

  function toggleTheme() {
    setTheme(theme === "light" ? "dark" : "light");
  }

  const providerValue = {
    theme: themes[theme], // ← Style data!
    toggleTheme, // ← Function để toggle!
  };

  return (
    <div className={`App theme-${theme}`}>
      <ThemeContext.Provider value={providerValue}>
        <Toggle /> {/* ← Consumer! */}
        <List /> {/* ← Trung gian! */}
      </ThemeContext.Provider>
    </div>
  );
}

// ④ Toggle = Consumer! Gọi toggleTheme!
function Toggle() {
  const { toggleTheme } = useContext(ThemeContext);

  return (
    <label className="switch">
      <input type="checkbox" onClick={toggleTheme} />
      <span className="slider round" />
    </label>
  );
}

// ⑤ List = TRUNG GIAN! Không cần theme!
function List() {
  return (
    <ul>
      <ListItem text="Lorem ipsum dolor sit amet" />
      <ListItem text="Consectetur adipiscing elit" />
      <ListItem text="Sed do eiusmod tempor" />
    </ul>
  );
}

// ⑥ ListItem = Consumer! Dùng theme!
function ListItem({ text }) {
  const { theme } = useContext(ThemeContext);

  return <li style={theme}>{text}</li>;
  // → style = { background: '#171717', color: '#fff' }
}

// → List KHÔNG CẦN biết về theme!
// → Toggle có toggleTheme function!
// → ListItem có theme styles!
// → Provider PHÁT SÓNG cho TẤT CẢ consumers!
```

---

## §5. Custom Hook — Best Practice

```javascript
// ═══ CUSTOM HOOK — THAY VÌ useContext TRỰC TIẾP ═══

// ❌ BAD — mỗi component phải import CONTEXT + useContext:
import { useContext } from "react";
import { ThemeContext } from "./App";

function ListItem() {
  const theme = useContext(ThemeContext); // ← Phải biết ThemeContext!
  return <li style={theme.theme}>...</li>;
}

// ✅ GOOD — custom hook! Chỉ import HOOK:
// theme-context.js:
const ThemeContext = createContext(); // ← KHÔNG export context!

function useThemeContext() {
  const context = useContext(ThemeContext);

  // ① Validation — bắt lỗi NGAY!
  if (!context) {
    throw new Error("useThemeContext must be used within ThemeProvider");
  }

  return context;
}

export { useThemeContext }; // ← Chỉ export HOOK!

// Sử dụng:
import { useThemeContext } from "./theme-context";

function ListItem() {
  const { theme } = useThemeContext(); // ← Clean! Validate!
  return <li style={theme}>...</li>;
}
```

```
TẠI SAO CUSTOM HOOK TỐT HƠN:
═══════════════════════════════════════════════════════════════

  ① VALIDATION:
  → useContext trả undefined nếu KHÔNG có Provider?
  → → Runtime error KHÓ DEBUG!
  → Custom hook THROW ERROR rõ ràng!
  → → "useThemeContext must be used within ThemeProvider"!

  ② ENCAPSULATION:
  → Context = PRIVATE! Không export!
  → Chỉ export hook + provider!
  → → Consumers KHÔNG biết implementation!
  → → Đổi từ Context sang Zustand? KHÔNG ảnh hưởng!

  ③ DX (Developer Experience):
  → import useThemeContext vs import useContext + ThemeContext!
  → → 1 import vs 2 imports!
  → → Tên hook = tự mô tả purpose!

  ④ SINGLE SOURCE OF TRUTH:
  → 1 hook = 1 cách access context!
  → Không ai dùng sai cách!
```

---

## §6. Custom Provider Component

```javascript
// ═══ TÁCH PROVIDER THÀNH COMPONENT RIÊNG ═══

// theme-context.js — TẤT CẢ logic context ở ĐÂY!

import React, { createContext, useState, useContext } from "react";

const ThemeContext = createContext();

const themes = {
  light: { background: "#fff", color: "#000" },
  dark: { background: "#171717", color: "#fff" },
};

// ① Custom Provider Component:
function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("dark");

  function toggleTheme() {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  }

  const value = {
    theme: themes[theme],
    themeName: theme,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

// ② Custom Hook:
function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

// ③ Export CHỈ Provider + Hook! KHÔNG export Context!
export { ThemeProvider, useTheme };

// ═══ App.js — CLEAN! ═══

import { ThemeProvider } from "./theme-context";

export default function App() {
  return (
    <ThemeProvider>
      {" "}
      {/* ← Không cần biết Context! */}
      <Toggle />
      <List />
    </ThemeProvider>
  );
}

// ═══ ListItem.js — CLEAN! ═══

import { useTheme } from "./theme-context";

function ListItem({ text }) {
  const { theme } = useTheme(); // ← Không cần biết Context!
  return <li style={theme}>{text}</li>;
}
```

```
FILE STRUCTURE — KENT C. DODDS PATTERN:
═══════════════════════════════════════════════════════════════

  src/
  ├── contexts/
  │   ├── theme-context.js      ← ThemeProvider + useTheme
  │   ├── auth-context.js       ← AuthProvider + useAuth
  │   └── locale-context.js     ← LocaleProvider + useLocale
  ├── components/
  │   ├── Toggle.js             ← useTheme()
  │   ├── ListItem.js           ← useTheme()
  │   └── UserMenu.js           ← useAuth()
  └── App.js                    ← Compose providers!

  RULE:
  → KHÔNG export Context object!
  → CHỈ export Provider component + Custom Hook!
  → → "Provide only one way to access context!"
  → → — Kent C. Dodds
```

---

## §7. useReducer + Context

```javascript
// ═══ useReducer + Context — COMPLEX STATE ═══

// count-context.js:
import React, { createContext, useContext, useReducer } from "react";

const CountContext = createContext();

// ① Reducer — quản lý complex state:
function countReducer(state, action) {
  switch (action.type) {
    case "increment":
      return { count: state.count + 1 };
    case "decrement":
      return { count: state.count - 1 };
    default:
      throw new Error(`Unhandled action type: ${action.type}`);
    // → #FailFast! Lỗi gõ sai action type!
  }
}

// ② Provider — useReducer thay vì useState:
function CountProvider({ children }) {
  const [state, dispatch] = useReducer(countReducer, { count: 0 });

  // NOTE: có thể cần useMemo nếu App re-render thường xuyên!
  const value = { state, dispatch };

  return (
    <CountContext.Provider value={value}>{children}</CountContext.Provider>
  );
}

// ③ Custom Hook:
function useCount() {
  const context = useContext(CountContext);
  if (context === undefined) {
    throw new Error("useCount must be used within a CountProvider");
  }
  return context;
}

export { CountProvider, useCount };

// ═══ SỬ DỤNG ═══

function App() {
  return (
    <CountProvider>
      <CountDisplay />
      <CountButtons />
    </CountProvider>
  );
}

function CountDisplay() {
  const { state } = useCount();
  return <div>Count: {state.count}</div>;
}

function CountButtons() {
  const { dispatch } = useCount();
  return (
    <div>
      <button onClick={() => dispatch({ type: "decrement" })}>-</button>
      <button onClick={() => dispatch({ type: "increment" })}>+</button>
    </div>
  );
}
```

```
useState vs useReducer trong Provider:
═══════════════════════════════════════════════════════════════

  useState:
  → State đơn giản (1-2 values!)
  → Toggle, form input, simple counter!
  → → const [theme, setTheme] = useState('dark');

  useReducer:
  → State phức tạp (nhiều actions!)
  → Giống Redux nhưng LOCAL!
  → dispatch STABLE (không đổi reference!)
  → → Tốt cho useEffect dependencies!
  → → const [state, dispatch] = useReducer(reducer, init);

  DISPATCH STABILITY:
  → dispatch KHÔNG BAO GIỜ thay đổi reference!
  → → Khác setState có thể thay đổi!
  → → Không cần lo useEffect deps!
  → → "dispatch is stable for the lifetime of the component"
```

---

## §8. Multiple Contexts

```javascript
// ═══ MULTIPLE CONTEXTS — TÁCH CONCERNS ═══

// ❌ BAD — tất cả trong 1 context:
const AppContext = createContext();

function AppProvider({ children }) {
  const [theme, setTheme] = useState("dark");
  const [user, setUser] = useState(null);
  const [locale, setLocale] = useState("vi");

  // → Đổi theme → TẤT CẢ consumers re-render!
  // → Kể cả components chỉ dùng user hoặc locale!
  return (
    <AppContext.Provider
      value={{ theme, user, locale, setTheme, setUser, setLocale }}
    >
      {children}
    </AppContext.Provider>
  );
}

// ✅ GOOD — tách thành NHIỀU contexts:
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LocaleProvider>
          <MainContent />
        </LocaleProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

// → Đổi theme → CHỈ theme consumers re-render!
// → Đổi user → CHỈ auth consumers re-render!
// → Đổi locale → CHỈ locale consumers re-render!

// ═══ CONSUMING MULTIPLE CONTEXTS ═══

function UserProfile() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { t } = useLocale();

  return (
    <div style={theme}>
      <h1>{t("profile.title")}</h1>
      <p>{user.name}</p>
    </div>
  );
}
```

```
MULTIPLE CONTEXTS — RULE OF THUMB:
═══════════════════════════════════════════════════════════════

  TÁCH khi:
  → Data THAY ĐỔI tần suất KHÁC nhau!
  → → Theme: hiếm khi đổi!
  → → User: đổi khi login/logout!
  → → Locale: hiếm khi đổi!
  → → Cart: đổi THƯỜNG XUYÊN!

  → Data DÙNG bởi NHÓM components KHÁC nhau!
  → → Theme: hầu hết UI components!
  → → Auth: protected routes, user menu!
  → → Cart: checkout flow!

  GỘP khi:
  → Data LUÔN dùng cùng nhau!
  → → Form state + form errors = 1 context!
  → → User + permissions = 1 context! (nếu luôn đi kèm!)
```

---

## §9. Performance — Re-render Problem

```javascript
// ═══ RE-RENDER PROBLEM ═══

// ❌ VẤN ĐỀ: MỌI consumer re-render khi VALUE thay đổi!

const CountContext = createContext(null);

function CountProvider({ children }) {
  const [count, setCount] = useState(0);

  return (
    <CountContext.Provider value={{ count, setCount }}>
      {children}
    </CountContext.Provider>
  );
}

// Button — DÙNG cả count và setCount:
function Button() {
  const { count, setCount } = useContext(CountContext);
  return (
    <div>
      <button onClick={() => setCount(count + 1)}>Increment</button>
      <div>Current count: {count}</div>
    </div>
  );
}

// Reset — CHỈ DÙNG setCount, KHÔNG dùng count!
function Reset() {
  const { setCount } = useContext(CountContext);
  return (
    <div>
      <button onClick={() => setCount(0)}>Reset</button>
      {/* → Hiển thị thời gian hiện tại: */}
      <div>Last reset: {new Date().toLocaleTimeString()}</div>
    </div>
  );
}

// → Click Increment → count thay đổi!
// → → Button re-render: OK! ✅ Cần hiển thị count mới!
// → → Reset CŨNG re-render: ❌ KHÔNG cần! Nó không dùng count!
// → → Thời gian "Last reset" CẬP NHẬT sai! BUG!
```

```
RE-RENDER RULE:
═══════════════════════════════════════════════════════════════

  context value THAY ĐỔI (Object.is so sánh!)
        ↓
  TẤT CẢ consumers RE-RENDER!
        ↓
  Kể cả consumers KHÔNG DÙNG phần thay đổi!
        ↓
  VẤN ĐỀ nếu context lớn + nhiều consumers!

  VÍ DỤ:
  value = { count: 0, setCount }  ← Object mới MỖI render!
  → Object.is(oldValue, newValue) === false  ← LUÔN khác!
  → → TẤT CẢ consumers re-render!
```

---

## §10. Performance — Optimization

```javascript
// ═══ GIẢI PHÁP 1: TÁCH STATE VÀ DISPATCH ═══

const CountStateContext = createContext();
const CountDispatchContext = createContext();

function CountProvider({ children }) {
  const [count, setCount] = useState(0);

  return (
    <CountStateContext.Provider value={count}>
      <CountDispatchContext.Provider value={setCount}>
        {children}
      </CountDispatchContext.Provider>
    </CountStateContext.Provider>
  );
}

function useCountState() {
  const context = useContext(CountStateContext);
  if (context === undefined)
    throw new Error("useCountState must be within CountProvider");
  return context;
}

function useCountDispatch() {
  const context = useContext(CountDispatchContext);
  if (context === undefined)
    throw new Error("useCountDispatch must be within CountProvider");
  return context;
}

// → Button dùng CẢ HAI:
function Button() {
  const count = useCountState(); // ← Re-render khi count đổi!
  const setCount = useCountDispatch(); // ← STABLE! Không re-render!
  return <button onClick={() => setCount((c) => c + 1)}>{count}</button>;
}

// → Reset CHỈ dùng dispatch:
function Reset() {
  const setCount = useCountDispatch(); // ← KHÔNG re-render khi count đổi!
  return <button onClick={() => setCount(0)}>Reset</button>;
}
// → Reset KHÔNG re-render khi click Increment! ✅
```

```javascript
// ═══ GIẢI PHÁP 2: useMemo CHO VALUE ═══

// ❌ BAD — tạo object MỚI mỗi render:
function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("dark");

  // → Object mới MỖI RENDER! → consumers ALL re-render!
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ✅ GOOD — useMemo:
function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("dark");

  // → Chỉ tạo object mới khi theme THAY ĐỔI!
  const value = useMemo(
    () => ({
      theme: themes[theme],
      toggleTheme: () =>
        setTheme((prev) => (prev === "light" ? "dark" : "light")),
    }),
    [theme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
```

```javascript
// ═══ GIẢI PHÁP 3: React.memo CHO CONSUMERS ═══

// Wrap component TRUNG GIAN bằng memo:
const ExpensiveList = React.memo(function ExpensiveList() {
  // Component này KHÔNG dùng context!
  // → memo ngăn re-render từ parent!
  return (
    <ul>
      {items.map((item) => (
        <li key={item.id}>{item.text}</li>
      ))}
    </ul>
  );
});
```

---

## §11. TypeScript Integration

```typescript
// ═══ TYPESCRIPT — TYPE-SAFE CONTEXT ═══

// count-context.tsx:
import React, { createContext, useContext, useReducer } from 'react';

// ① Types:
type Action = { type: 'increment' } | { type: 'decrement' };
type Dispatch = (action: Action) => void;
type State = { count: number };
type CountProviderProps = { children: React.ReactNode };

// ② Context with undefined default:
const CountContext = createContext<
    { state: State; dispatch: Dispatch } | undefined
>(undefined);
// → Default = undefined → BẮT BUỘC phải dùng trong Provider!

// ③ Reducer — TYPED!
function countReducer(state: State, action: Action): State {
    switch (action.type) {
        case 'increment':
            return { count: state.count + 1 };
        case 'decrement':
            return { count: state.count - 1 };
        default:
            throw new Error(`Unhandled action type: ${action.type}`);
    }
}

// ④ Provider:
function CountProvider({ children }: CountProviderProps) {
    const [state, dispatch] = useReducer(countReducer, { count: 0 });
    const value = { state, dispatch };
    return (
        <CountContext.Provider value={value}>
            {children}
        </CountContext.Provider>
    );
}

// ⑤ Custom Hook — NARROW type!
function useCount() {
    const context = useContext(CountContext);
    if (context === undefined) {
        throw new Error('useCount must be used within a CountProvider');
    }
    return context;
    // → Return type: { state: State; dispatch: Dispatch }
    // → KHÔNG CÒN undefined! TypeScript happy! ✅
}

export { CountProvider, useCount };

// ═══ SỬ DỤNG — TYPE-SAFE! ═══

function Counter() {
    const { state, dispatch } = useCount();

    dispatch({ type: 'increment' });  // ✅ OK!
    dispatch({ type: 'decrement' });  // ✅ OK!
    dispatch({ type: 'reset' });       // ❌ TS Error! Type '"reset"'
                                       // not assignable! AUTOCOMPLETE!
    return <div>{state.count}</div>;   // ✅ state.count = number!
}
```

---

## §12. Async Actions với Context

```javascript
// ═══ ASYNC ACTIONS — HELPER FUNCTIONS ═══

// user-context.js:
const UserContext = createContext();

function userReducer(state, action) {
  switch (action.type) {
    case "start update":
      return { ...state, status: "pending", updates: action.updates };
    case "finish update":
      return { ...state, status: "resolved", user: action.updatedUser };
    case "fail update":
      return { ...state, status: "rejected", error: action.error };
    default:
      throw new Error(`Unhandled action: ${action.type}`);
  }
}

function UserProvider({ children }) {
  const [state, dispatch] = useReducer(userReducer, {
    user: null,
    status: "idle",
    error: null,
  });
  const value = { state, dispatch };
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be within UserProvider");
  return [context.state, context.dispatch];
}

// ① ASYNC HELPER — không phải action creator!
async function updateUser(dispatch, user, updates) {
  dispatch({ type: "start update", updates });
  try {
    const updatedUser = await userClient.updateUser(user, updates);
    dispatch({ type: "finish update", updatedUser });
  } catch (error) {
    dispatch({ type: "fail update", error });
  }
}

export { UserProvider, useUser, updateUser };

// ═══ SỬ DỤNG ═══

import { useUser, updateUser } from "./user-context";

function UserSettings() {
  const [{ user, status, error }, userDispatch] = useUser();

  function handleSubmit(event) {
    event.preventDefault();
    // → Gọi async helper, truyền dispatch!
    updateUser(userDispatch, user, formState);
  }

  return (
    <form onSubmit={handleSubmit}>
      {status === "pending" && <Spinner />}
      {status === "rejected" && <Error message={error.message} />}
      {/* form fields... */}
    </form>
  );
}
```

---

## §13. styled-components ThemeProvider

```javascript
// ═══ styled-components — BUILT-IN PROVIDER ═══

import { ThemeProvider } from "styled-components";
import styled from "styled-components";

const themes = {
  light: { background: "#fff", color: "#000" },
  dark: { background: "#171717", color: "#fff" },
};

// ① App — dùng ThemeProvider của styled-components:
function App() {
  const [theme, setTheme] = useState("dark");

  return (
    <ThemeProvider theme={themes[theme]}>
      <Toggle
        toggleTheme={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
      />
      <List />
    </ThemeProvider>
  );
}

// ② Styled component — tự động nhận theme!
const Li = styled.li`
  background-color: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.color};
  padding: 16px;
  margin: 8px 0;
  border-radius: 8px;
`;

function ListItem({ text }) {
  return <Li>{text}</Li>;
  // → theme INJECT tự động! Không cần useContext!
}

// → styled-components dùng React Context bên trong!
// → ThemeProvider = Context.Provider!
// → Mỗi styled component = Consumer tự động!
// → KHÔNG cần tạo Context riêng cho theme!
```

---

## §14. Component Composition — Thay thế Context

```javascript
// ═══ COMPONENT COMPOSITION — TRƯỚC KHI DÙNG CONTEXT ═══

// ❌ Prop drilling:
function Page({ user, avatarSize }) {
  return <PageLayout user={user} avatarSize={avatarSize} />;
}
function PageLayout({ user, avatarSize }) {
  return <NavigationBar user={user} avatarSize={avatarSize} />;
}
function NavigationBar({ user, avatarSize }) {
  return (
    <a href={user.permalink}>
      <Avatar user={user} size={avatarSize} />
    </a>
  );
}

// ✅ COMPONENT COMPOSITION — Inversion of Control!
function Page({ user, avatarSize }) {
  // Tạo element NGAY tại đây!
  const userLink = (
    <a href={user.permalink}>
      <Avatar user={user} size={avatarSize} />
    </a>
  );

  return <PageLayout userLink={userLink} />;
  // → PageLayout KHÔNG CẦN biết user hay avatarSize!
}

function PageLayout({ userLink }) {
  return <NavigationBar userLink={userLink} />;
}

function NavigationBar({ userLink }) {
  return <div>{userLink}</div>;
  // → Chỉ render element đã được built!
}

// → KHÔNG cần Context!
// → Page quyết định CÁI GÌ render!
// → Trung gian chỉ TRUYỀN element đã tạo sẵn!
```

```
KHI NÀO DÙNG GÌ:
═══════════════════════════════════════════════════════════════

  COMPONENT COMPOSITION:
  → 1-2 tầng prop drilling!
  → Chỉ 1-2 components cần data!
  → Data KHÔNG thay đổi thường xuyên!
  → → SIMPLE! Không cần Context!

  CONTEXT (Provider Pattern):
  → NHIỀU tầng prop drilling!
  → NHIỀU components cần data (>3!)
  → Data THAY ĐỔI và cần REACT!
  → Global state: theme, auth, locale!
  → → Context FTW!

  STATE MANAGEMENT LIBRARY:
  → State CỰC KỲ phức tạp!
  → Cần middleware, devtools, time-travel!
  → Cross-cutting concerns!
  → → Redux, Zustand, Jotai!
```

---

## §15. Real-World Applications

```javascript
// ═══ AUTH PROVIDER ═══

const AuthContext = createContext();

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check session on mount:
    async function checkAuth() {
      try {
        const user = await api.getMe();
        setUser(user);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, []);

  const login = async (credentials) => {
    const user = await api.login(credentials);
    setUser(user);
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, loading, login, logout, isAuthenticated: !!user }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be within AuthProvider");
  return context;
}

// SỬ DỤNG:
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!isAuthenticated) return <Navigate to="/login" />;
  return children;
}

function UserMenu() {
  const { user, logout } = useAuth();
  return (
    <div>
      <span>Hello, {user.name}</span>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

```javascript
// ═══ NOTIFICATION PROVIDER ═══

const NotificationContext = createContext();

function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((message, type = "info") => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeNotification(id), 5000); // Auto-dismiss!
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const value = useMemo(
    () => ({
      notifications,
      success: (msg) => addNotification(msg, "success"),
      error: (msg) => addNotification(msg, "error"),
      info: (msg) => addNotification(msg, "info"),
    }),
    [notifications, addNotification],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationList
        notifications={notifications}
        onDismiss={removeNotification}
      />
    </NotificationContext.Provider>
  );
}

function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error("useNotification must be within provider");
  return context;
}

// SỬ DỤNG — bất kỳ đâu trong app!
function SaveButton() {
  const { success, error } = useNotification();

  async function handleSave() {
    try {
      await api.save(data);
      success("Saved successfully!");
    } catch (err) {
      error("Failed to save!");
    }
  }

  return <button onClick={handleSave}>Save</button>;
}
```

---

## §16. Tradeoffs — Ưu & Nhược điểm

```
ƯU ĐIỂM:
═══════════════════════════════════════════════════════════════

  ✅ GIẢI QUYẾT PROP DRILLING:
  → Data truyền TRỰC TIẾP từ Provider → Consumer!
  → Trung gian KHÔNG CẦN biết về data!

  ✅ DỄ REFACTOR:
  → Đổi tên prop? CHỈ sửa ở Provider + consumers!
  → Không sửa 10 components trung gian!

  ✅ SEPARATION OF CONCERNS:
  → Logic riêng (Provider!) / UI riêng (Consumer!)
  → Custom hooks ENCAPSULATE implementation!

  ✅ GLOBAL STATE ĐƠN GIẢN:
  → Theme, Auth, Locale → Context là ĐỦ!
  → Không cần thêm library (Redux, Zustand!)

  ✅ BUILT-IN REACT:
  → Không cần install thêm gì!
  → Mọi React developer đều biết!
```

```
NHƯỢC ĐIỂM:
═══════════════════════════════════════════════════════════════

  ❌ RE-RENDER PERFORMANCE:
  → Value thay đổi → TẤT CẢ consumers re-render!
  → 1 context lớn + nhiều consumers = CHẬM!
  → Cần split contexts + useMemo!

  ❌ COMPONENT REUSE KHÓ HƠN:
  → Component dùng useContext → PHẢI có Provider ở trên!
  → Test phải wrap trong Provider!
  → Dùng ngoài Provider → ERROR!

  ❌ OVER-ENGINEERING:
  → Prop drilling 1-2 tầng? → Context = OVERKILL!
  → Component Composition đơn giản hơn!
  → "Apply context sparingly!" — React docs

  ❌ KHÔNG THAY THẾ STATE MANAGEMENT:
  → Complex state (middleware, devtools!) → Redux/Zustand!
  → Frequent updates (animation!) → Zustand/Jotai!
  → Context KHÔNG phải silver bullet!
```

---

## §17. Tóm tắt

```
PROVIDER PATTERN — TRẢ LỜI PHỎNG VẤN:
═══════════════════════════════════════════════════════════════

  Q: "Provider Pattern là gì?"
  A: Dùng React Context để CUNG CẤP data cho NHIỀU
  components KHÔNG cần truyền props qua từng tầng!
  createContext() + Provider + useContext()!

  Q: "Prop Drilling?"
  A: Truyền props qua NHIỀU tầng trung gian!
  Components trung gian KHÔNG DÙNG nhưng phải
  NHẬN và TRUYỀN TIẾP → khó maintain, refactor!

  Q: "Best Practice?"
  A: ① Custom Provider component (ThemeProvider!)
  ② Custom Hook (useTheme!) với validation!
  ③ KHÔNG export Context object! Chỉ export hook!
  ④ Split contexts cho performance!
  ⑤ useMemo cho value object!

  Q: "Performance issue?"
  A: Value thay đổi → TẤT CẢ consumers re-render!
  Fix: ① Tách state/dispatch contexts!
  ② useMemo cho value!
  ③ React.memo cho components!
  ④ Split into multiple contexts!

  Q: "Context vs Redux?"
  A: Context = simple global state (theme, auth!)
  Redux = complex state + middleware + devtools!
  Context KHÔNG phải state management tool!
```

---

### Checklist

- [ ] **Provider concept**: createContext + Provider + useContext; giải quyết prop drilling!
- [ ] **Prop Drilling**: truyền props qua trung gian vô nghĩa; đổi tên = sửa mọi nơi!
- [ ] **ThemeProvider**: light/dark mode; value = { theme, toggleTheme }!
- [ ] **Custom Hook**: useTheme() thay vì useContext(ThemeContext); validation + encapsulation!
- [ ] **Custom Provider Component**: tách logic vào provider; KHÔNG export Context!
- [ ] **useReducer + Context**: complex state; dispatch STABLE; giống mini-Redux!
- [ ] **Multiple Contexts**: tách concerns; đổi theme → chỉ theme consumers re-render!
- [ ] **Re-render Problem**: value thay đổi → TẤT CẢ consumers re-render; Object.is comparison!
- [ ] **Performance Fix**: tách state/dispatch; useMemo value; React.memo; split contexts!
- [ ] **TypeScript**: Context<T | undefined>; custom hook NARROW type; autocomplete actions!
- [ ] **Async Helper**: updateUser(dispatch, user, updates); KHÔNG phải action creator!
- [ ] **styled-components**: ThemeProvider built-in; theme tự inject vào styled components!
- [ ] **Component Composition**: Inversion of Control; TRƯỚC khi reach for Context!
- [ ] **Real-World**: AuthProvider (login/logout/guard!), NotificationProvider (toast!)
- [ ] **Tradeoffs**: Ưu (no drilling, easy refactor, built-in!) vs Nhược (re-render, reuse harder, overkill!)

---

_Nguồn: patterns.dev — Provider Pattern, React Docs — Context, Kent C. Dodds — How To Use React Context Effectively_
_Cập nhật lần cuối: Tháng 2, 2026_
