# React & TypeScript — Deep Dive!

> **Chủ đề**: Part 3 — React and TypeScript (Q17-Q27)
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Phương châm**: Tự viết lại bằng tay — KHÔNG dùng thư viện!

---

## Mục Lục

1. [§1. Định Nghĩa Types Cho Components!](#1)
2. [§2. Props Với TypeScript!](#2)
3. [§3. React.FC, PropsWithChildren, ComponentProps!](#3)
4. [§4. Type Event Handlers!](#4)
5. [§5. Type Custom Hooks!](#5)
6. [§6. Type useState!](#6)
7. [§7. Extend HTML Attributes!](#7)
8. [§8. Type Context API Provider!](#8)
9. [§9. Mapped Types Trong React!](#9)
10. [§10. Utility Types: Partial, Pick, Omit, Record!](#10)
11. [§11. Readonly Trong Props!](#11)
12. [§12. Tổng Kết & Câu Hỏi Phỏng Vấn!](#12)

---

## §1. Định Nghĩa Types Cho Components!

```
  REACT COMPONENT TYPES — TỔNG QUAN:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ① Function Component (phổ biến nhất):                │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  function Button(props: ButtonProps): JSX.Element│  │
  │  │  const Button: React.FC<ButtonProps> = (props)   │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ② Class Component (legacy):                          │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  class Button extends React.Component<Props,State>│ │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  RETURN TYPES:                                         │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  JSX.Element    → chỉ JSX (KHÔNG null)          │  │
  │  │  React.ReactElement → giống JSX.Element          │  │
  │  │  React.ReactNode → JSX | string | number | null │  │
  │  │  → KHUYẾN NGHỊ: để TS tự infer! (không ghi)    │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

```typescript
// ═══════════════════════════════════════════════════════════
// CÁCH 1: Function Declaration (KHUYẾN NGHỊ!):
// ═══════════════════════════════════════════════════════════

type ButtonProps = {
    label: string;
    variant: 'primary' | 'secondary';   // Union literal type!
    size?: 'sm' | 'md' | 'lg';          // Optional!
    disabled?: boolean;
    onClick: () => void;
};

function Button(props: ButtonProps) {
    // TS tự infer return type = JSX.Element!
    return (
        <button
            className={`btn btn-${props.variant} btn-${props.size || 'md'}`}
            disabled={props.disabled}
            onClick={props.onClick}
        >
            {props.label}
        </button>
    );
}

// ═══════════════════════════════════════════════════════════
// CÁCH 2: Arrow Function:
// ═══════════════════════════════════════════════════════════

const Card = (props: {
    title: string;
    children: React.ReactNode;
}) => {
    return (
        <div className="card">
            <h2>{props.title}</h2>
            <div>{props.children}</div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════
// CÁCH 3: Destructured Props:
// ═══════════════════════════════════════════════════════════

function Avatar({ src, alt, size = 40 }: {
    src: string;
    alt: string;
    size?: number;
}) {
    return <img src={src} alt={alt} width={size} height={size} />;
}

// ═══════════════════════════════════════════════════════════
// interface vs type — KHI NÀO DÙNG GÌ?
// ═══════════════════════════════════════════════════════════

// interface: EXTEND được, dùng cho object shapes:
interface BaseProps {
    id: string;
    className?: string;
}
interface CardProps extends BaseProps {
    title: string;
}

// type: LINH HOẠT hơn (union, intersection, mapped):
type Status = 'loading' | 'success' | 'error'; // union
type WithLoading<T> = T & { isLoading: boolean }; // intersection
```

---

## §2. Props Với TypeScript!

```typescript
// ═══════════════════════════════════════════════════════════
// ① REQUIRED vs OPTIONAL PROPS:
// ═══════════════════════════════════════════════════════════

type UserCardProps = {
    name: string;           // REQUIRED — phải truyền!
    email: string;          // REQUIRED
    avatar?: string;        // OPTIONAL — có ? → có thể không truyền
    role?: 'admin' | 'user';// OPTIONAL + union type
};

// ② DEFAULT VALUES:
function UserCard({ name, email, avatar, role = 'user' }: UserCardProps) {
    // role mặc định = 'user' nếu không truyền!
    return (
        <div>
            {avatar && <img src={avatar} alt={name} />}
            <h3>{name} ({role})</h3>
            <p>{email}</p>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
// ③ DISCRIMINATED UNION PROPS — Pattern cực mạnh!
// ═══════════════════════════════════════════════════════════

// ❌ SAI — 2 props liên quan nhưng KHÔNG ràng buộc:
type BadAlertProps = {
    type: 'info' | 'error' | 'action';
    onAction?: () => void;  // chỉ cần khi type='action'?
    actionLabel?: string;   // → TS KHÔNG biết ràng buộc này!
};

// ✅ ĐÚNG — Discriminated Union:
type AlertProps =
    | { type: 'info'; message: string }
    | { type: 'error'; message: string; errorCode: number }
    | { type: 'action'; message: string;
        onAction: () => void; actionLabel: string };
    // → type='action' BẮT BUỘC có onAction + actionLabel!

function Alert(props: AlertProps) {
    switch (props.type) {
        case 'info':
            return <div className="alert-info">{props.message}</div>;
        case 'error':
            // TS biết props.errorCode tồn tại!
            return <div className="alert-error">
                {props.message} (Code: {props.errorCode})
            </div>;
        case 'action':
            // TS biết props.onAction + actionLabel tồn tại!
            return <div className="alert-action">
                {props.message}
                <button onClick={props.onAction}>{props.actionLabel}</button>
            </div>;
    }
}

// ═══════════════════════════════════════════════════════════
// ④ CALLBACK PROPS:
// ═══════════════════════════════════════════════════════════

type ListProps<T> = {
    items: T[];
    renderItem: (item: T, index: number) => React.ReactNode;
    onSelect?: (item: T) => void;
    keyExtractor: (item: T) => string;
};

function List<T>(props: ListProps<T>) {
    return (
        <ul>
            {props.items.map((item, i) => (
                <li key={props.keyExtractor(item)}
                    onClick={() => props.onSelect?.(item)}>
                    {props.renderItem(item, i)}
                </li>
            ))}
        </ul>
    );
}

// Sử dụng — TS infer T = User:
type User = { id: string; name: string };
<List<User>
    items={users}
    renderItem={(user) => <span>{user.name}</span>}
    keyExtractor={(user) => user.id}
    onSelect={(user) => console.log(user.name)}
/>
```

---

## §3. React.FC, PropsWithChildren, ComponentProps!

```
  React.FC vs Function Declaration:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  React.FC<Props> (trước React 18):                    │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  ✅ Tự thêm children vào props (trước v18)      │  │
  │  │  ✅ Có displayName, defaultProps types           │  │
  │  │  ❌ children IMPLICIT → khó kiểm soát!          │  │
  │  │  ❌ Không hỗ trợ generics dễ dàng!              │  │
  │  │  ❌ React 18 ĐÃ XÓA implicit children!          │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  Function Declaration (KHUYẾN NGHỊ!):                  │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  ✅ Children EXPLICIT — khai báo rõ ràng!       │  │
  │  │  ✅ Generics dễ dàng!                           │  │
  │  │  ✅ Return type tự infer!                       │  │
  │  │  ✅ Đơn giản, dễ đọc!                           │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

```typescript
// ═══════════════════════════════════════════════════════════
// ① React.FC — Cách cũ:
// ═══════════════════════════════════════════════════════════

const OldButton: React.FC<{ label: string }> = ({ label }) => {
    return <button>{label}</button>;
};
// React 18: children KHÔNG tự có → phải khai báo!

// ═══════════════════════════════════════════════════════════
// ② PropsWithChildren — Thêm children vào type:
// ═══════════════════════════════════════════════════════════

// PropsWithChildren IMPLEMENTATION (bên trong React):
// type PropsWithChildren<P = unknown> = P & {
//     children?: React.ReactNode | undefined;
// };

type LayoutProps = React.PropsWithChildren<{
    title: string;
    sidebar?: React.ReactNode;
}>;
// → LayoutProps = { title: string; sidebar?: ReactNode; children?: ReactNode }

function Layout({ title, sidebar, children }: LayoutProps) {
    return (
        <div>
            <h1>{title}</h1>
            {sidebar && <aside>{sidebar}</aside>}
            <main>{children}</main>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
// ③ ComponentProps — Lấy props type từ component:
// ═══════════════════════════════════════════════════════════

// Lấy props của HTML element:
type ButtonHTMLProps = React.ComponentProps<'button'>;
type InputHTMLProps = React.ComponentProps<'input'>;
type AnchorHTMLProps = React.ComponentProps<'a'>;

// Lấy props của React component:
type MyButtonProps = React.ComponentProps<typeof Button>;

// ComponentPropsWithRef — bao gồm ref:
type WithRef = React.ComponentPropsWithRef<'input'>;

// ComponentPropsWithoutRef — KHÔNG bao gồm ref:
type WithoutRef = React.ComponentPropsWithoutRef<'button'>;

// VÍ DỤ THỰC TẾ — Wrapper component:
function IconButton(props: React.ComponentProps<typeof Button> & {
    icon: React.ReactNode;
}) {
    const { icon, ...rest } = props;
    return (
        <Button {...rest} label={<>{icon} {rest.label}</>} />
    );
}
```

---

## §4. Type Event Handlers!

```typescript
// ═══════════════════════════════════════════════════════════
// EVENT TYPES — PHỔ BIẾN:
// ═══════════════════════════════════════════════════════════

// ① MOUSE EVENTS:
function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
  e.preventDefault();
  console.log(e.clientX, e.clientY); // TS biết có clientX!
}

// ② CHANGE EVENTS:
function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
  console.log(e.target.value); // TS biết target là HTMLInputElement!
}
function handleSelectChange(e: React.ChangeEvent<HTMLSelectElement>) {
  console.log(e.target.value);
}

// ③ FORM EVENTS:
function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault();
  const formData = new FormData(e.currentTarget);
}

// ④ KEYBOARD EVENTS:
function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
  if (e.key === "Enter") {
    /* submit */
  }
}

// ⑤ FOCUS EVENTS:
function handleFocus(e: React.FocusEvent<HTMLInputElement>) {
  e.target.select();
}

// ⑥ DRAG EVENTS:
function handleDrop(e: React.DragEvent<HTMLDivElement>) {
  e.preventDefault();
  const files = e.dataTransfer.files;
}
```

```
  EVENT HANDLER TYPES — BẢNG TÓM TẮT:
  ┌────────────────────────────────────────────────────────┐
  │  Event            │ Type                    │ Element  │
  │  ─────────────────│─────────────────────────│──────────│
  │  onClick          │ MouseEvent<HTML...>     │ Button   │
  │  onChange (input)  │ ChangeEvent<HTMLInput>  │ Input    │
  │  onChange (select) │ ChangeEvent<HTMLSelect> │ Select   │
  │  onSubmit          │ FormEvent<HTMLForm>     │ Form     │
  │  onKeyDown/Up      │ KeyboardEvent<HTML...>  │ Input    │
  │  onFocus/onBlur    │ FocusEvent<HTML...>     │ Input    │
  │  onDrag/onDrop     │ DragEvent<HTMLDiv>      │ Div      │
  │  onScroll          │ UIEvent<HTMLDiv>        │ Div      │
  │  onMouseEnter      │ MouseEvent<HTMLDiv>     │ Div      │
  │  onTouchStart      │ TouchEvent<HTMLDiv>     │ Div      │
  │                                                        │
  │  Event Handler shorthand:                              │
  │  React.MouseEventHandler<HTMLButtonElement>            │
  │  = (e: React.MouseEvent<HTMLButtonElement>) => void    │
  └────────────────────────────────────────────────────────┘
```

```typescript
// ═══════════════════════════════════════════════════════════
// TRONG PROPS — 2 cách type event handler:
// ═══════════════════════════════════════════════════════════

// CÁCH 1: Inline function type:
type FormFieldProps = {
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
};

// CÁCH 2: React EventHandler type (ngắn gọn hơn):
type FormFieldProps2 = {
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  onBlur: React.FocusEventHandler<HTMLInputElement>;
};

// CÁCH 3: Callback props (abstract — không cần event):
type SearchProps = {
  onSearch: (query: string) => void; // chỉ cần value!
  onClear: () => void;
};
// → Component xử lý event, chỉ truyền data lên parent!
```

---

## §5. Type Custom Hooks!

```typescript
// ═══════════════════════════════════════════════════════════
// ① HOOK TRẢ VỀ OBJECT:
// ═══════════════════════════════════════════════════════════

type UseFetchResult<T> = {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
};

function useFetch<T>(url: string): UseFetchResult<T> {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  const refetch = React.useCallback(() => {
    setLoading(true);
    setError(null);
    fetch(url)
      .then((res) => res.json())
      .then((json: T) => setData(json))
      .catch((err: Error) => setError(err))
      .finally(() => setLoading(false));
  }, [url]);

  React.useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}

// Sử dụng — TS infer T:
const { data, loading } = useFetch<User[]>("/api/users");
// data: User[] | null — TS biết!

// ═══════════════════════════════════════════════════════════
// ② HOOK TRẢ VỀ TUPLE (như useState):
// ═══════════════════════════════════════════════════════════

function useToggle(initial: boolean = false): [boolean, () => void] {
  const [value, setValue] = React.useState(initial);
  const toggle = React.useCallback(() => setValue((v) => !v), []);
  return [value, toggle]; // tuple!
}
// → const [isOpen, toggleOpen] = useToggle();
// TS biết: isOpen: boolean, toggleOpen: () => void

// AS CONST trick cho tuple phức tạp:
function useCounter(initial: number = 0) {
  const [count, setCount] = React.useState(initial);
  const increment = () => setCount((c) => c + 1);
  const decrement = () => setCount((c) => c - 1);
  const reset = () => setCount(initial);
  return [count, { increment, decrement, reset }] as const;
  // → type: readonly [number, { increment, decrement, reset }]
}

// ═══════════════════════════════════════════════════════════
// ③ HOOK VỚI GENERICS:
// ═══════════════════════════════════════════════════════════

function useLocalStorage<T>(key: string, defaultValue: T) {
  const [value, setValue] = React.useState<T>(() => {
    const stored = localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : defaultValue;
  });

  React.useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}

// Sử dụng:
const [theme, setTheme] = useLocalStorage<"light" | "dark">("theme", "light");
// theme: 'light' | 'dark' — TS biết chính xác!
```

---

## §6. Type useState!

```typescript
// ═══════════════════════════════════════════════════════════
// useState — CÁC TRƯỜNG HỢP:
// ═══════════════════════════════════════════════════════════

// ① AUTO INFER — không cần generic (đơn giản):
const [count, setCount] = React.useState(0);
// TS infer: count: number

const [name, setName] = React.useState("");
// TS infer: name: string

const [isOpen, setIsOpen] = React.useState(false);
// TS infer: isOpen: boolean

// ② CẦN GENERIC — khi initial value không đủ thông tin:
const [user, setUser] = React.useState<User | null>(null);
// PHẢI có generic! Vì null → TS infer: null (không có User!)

const [items, setItems] = React.useState<string[]>([]);
// [] → TS infer: never[] → PHẢI nói là string[]!

const [status, setStatus] = React.useState<"idle" | "loading" | "done">("idle");
// 'idle' → TS infer: string → PHẢI narrow!

// ③ COMPLEX OBJECTS:
type FormState = {
  name: string;
  email: string;
  age: number | null;
  role: "admin" | "user";
};

const [form, setForm] = React.useState<FormState>({
  name: "",
  email: "",
  age: null,
  role: "user",
});

// Update partial state:
setForm((prev) => ({ ...prev, name: "John" }));
// TS kiểm tra 'name' phải là string!

// ④ DISCRIMINATED UNION STATE:
type AsyncState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: Error };

const [state, setState] = React.useState<AsyncState<User[]>>({
  status: "idle",
});

// Type-safe access:
if (state.status === "success") {
  console.log(state.data); // TS biết data: User[] tồn tại!
}
if (state.status === "error") {
  console.log(state.error); // TS biết error tồn tại!
}
```

---

## §7. Extend HTML Attributes!

```typescript
// ═══════════════════════════════════════════════════════════
// EXTEND HTML ATTRIBUTES — Best Practice!
// ═══════════════════════════════════════════════════════════

// ① ComponentPropsWithoutRef — KHUYẾN NGHỊ:
type CustomButtonProps = React.ComponentPropsWithoutRef<'button'> & {
    variant: 'primary' | 'secondary';
    isLoading?: boolean;
};

function CustomButton({ variant, isLoading, children, ...rest }: CustomButtonProps) {
    return (
        <button
            className={`btn-${variant}`}
            disabled={isLoading || rest.disabled}
            {...rest}  // pass ALL HTML button attributes!
        >
            {isLoading ? 'Loading...' : children}
        </button>
    );
}
// → <CustomButton variant="primary" type="submit" aria-label="Save" />
// → TƯƠNG THÍCH tất cả HTML button attributes!

// ② OMIT props bị trùng:
type CustomInputProps = Omit<
    React.ComponentPropsWithoutRef<'input'>,
    'size' | 'onChange'   // Omit vì ta custom lại!
> & {
    size: 'sm' | 'md' | 'lg';          // custom size (string, ko number)
    onChange: (value: string) => void;   // custom onChange signature
};

function CustomInput({ size, onChange, ...rest }: CustomInputProps) {
    return (
        <input
            className={`input-${size}`}
            onChange={(e) => onChange(e.target.value)}
            {...rest}
        />
    );
}

// ③ forwardRef — khi cần expose ref:
type InputWithRefProps = React.ComponentPropsWithoutRef<'input'> & {
    label: string;
    error?: string;
};

const InputWithRef = React.forwardRef<HTMLInputElement, InputWithRefProps>(
    function InputWithRef({ label, error, ...rest }, ref) {
        return (
            <div>
                <label>{label}</label>
                <input ref={ref} aria-invalid={!!error} {...rest} />
                {error && <span role="alert">{error}</span>}
            </div>
        );
    }
);
```

---

## §8. Type Context API Provider!

```typescript
// ═══════════════════════════════════════════════════════════
// CONTEXT + TYPESCRIPT — PATTERN CHUẨN:
// ═══════════════════════════════════════════════════════════

// ① DEFINE context type:
type Theme = 'light' | 'dark';

type ThemeContextType = {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
};

// ② CREATE context (null initial → type-safe!):
const ThemeContext = React.createContext<ThemeContextType | null>(null);

// ③ CUSTOM HOOK (throw nếu dùng ngoài Provider!):
function useTheme(): ThemeContextType {
    const ctx = React.useContext(ThemeContext);
    if (!ctx) {
        throw new Error('useTheme must be used within ThemeProvider!');
    }
    return ctx;  // TS biết KHÔNG null!
}

// ④ PROVIDER component:
function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = React.useState<Theme>('light');
    const toggleTheme = React.useCallback(() => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    }, []);

    const value = React.useMemo<ThemeContextType>(
        () => ({ theme, toggleTheme, setTheme }),
        [theme, toggleTheme]
    );

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

// ⑤ SỬ DỤNG — fully type-safe!:
function Header() {
    const { theme, toggleTheme } = useTheme();
    // TS biết: theme: 'light' | 'dark', toggleTheme: () => void
    return <button onClick={toggleTheme}>Current: {theme}</button>;
}
```

---

## §9. Mapped Types Trong React!

```typescript
// ═══════════════════════════════════════════════════════════
// MAPPED TYPES — CƠ BẢN:
// ═══════════════════════════════════════════════════════════

// Mapped type tạo TYPE MỚI từ type có sẵn:
type Readonly_<T> = { readonly [K in keyof T]: T[K] };
type Optional<T> = { [K in keyof T]?: T[K] };
type Nullable<T> = { [K in keyof T]: T[K] | null };

// ═══════════════════════════════════════════════════════════
// TRONG REACT PROJECT:
// ═══════════════════════════════════════════════════════════

// ① Form state từ model:
type User = { name: string; email: string; age: number };

// Tạo form field errors:
type FormErrors<T> = { [K in keyof T]?: string };
// → FormErrors<User> = { name?: string; email?: string; age?: string }

// Tạo form touched:
type FormTouched<T> = { [K in keyof T]?: boolean };

// Tạo form dirty (giá trị thay đổi):
type FormDirty<T> = { [K in keyof T]?: boolean };

// ② API Response wrapper:
type ApiResponse<T> = {
  [K in keyof T]: {
    data: T[K];
    loading: boolean;
    error: string | null;
  };
};

// ③ Event handlers cho mỗi field:
type FieldHandlers<T> = {
  [K in keyof T as `onChange${Capitalize<string & K>}`]: (value: T[K]) => void;
};
// → FieldHandlers<User> = {
//     onChangeName: (value: string) => void;
//     onChangeEmail: (value: string) => void;
//     onChangeAge: (value: number) => void;
// }

// ═══════════════════════════════════════════════════════════
// ④ TYPE-SAFE FORM HOOK (dùng mapped types):
// ═══════════════════════════════════════════════════════════

function useForm<T extends Record<string, unknown>>(initialValues: T) {
  const [values, setValues] = React.useState<T>(initialValues);
  const [errors, setErrors] = React.useState<FormErrors<T>>({});
  const [touched, setTouched] = React.useState<FormTouched<T>>({});

  function setValue<K extends keyof T>(field: K, value: T[K]) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  function setError<K extends keyof T>(field: K, error: string) {
    setErrors((prev) => ({ ...prev, [field]: error }));
  }

  return { values, errors, touched, setValue, setError };
}

// Sử dụng:
const form = useForm({ name: "", email: "", age: 0 });
form.setValue("name", "John"); // ✅ TS biết value phải là string
form.setValue("age", 25); // ✅ TS biết value phải là number
// form.setValue('name', 123);     // ❌ TS ERROR!
// form.setValue('foo', 'bar');    // ❌ TS ERROR — 'foo' không tồn tại!
```

---

## §10. Utility Types: Partial, Pick, Omit, Record!

```typescript
// ═══════════════════════════════════════════════════════════
// ① PARTIAL<T> — Tất cả thành optional:
// ═══════════════════════════════════════════════════════════

type UserProfile = {
    name: string; email: string; avatar: string; bio: string;
};

// Update chỉ 1 vài fields:
function updateProfile(id: string, updates: Partial<UserProfile>) {
    // updates có thể chỉ có { name: 'New' } mà KHÔNG cần tất cả!
}
updateProfile('1', { name: 'New' });  // ✅ OK!

// React: Edit form chỉ edit 1 số fields:
type EditFormProps = {
    initialValues: UserProfile;
    onChange: (changes: Partial<UserProfile>) => void;
};

// ═══════════════════════════════════════════════════════════
// ② PICK<T, Keys> — Chọn một số properties:
// ═══════════════════════════════════════════════════════════

type UserSummary = Pick<UserProfile, 'name' | 'avatar'>;
// → { name: string; avatar: string }

// React: Component chỉ cần 1 số props:
function UserAvatar(props: Pick<UserProfile, 'name' | 'avatar'>) {
    return <img src={props.avatar} alt={props.name} />;
}

// ═══════════════════════════════════════════════════════════
// ③ OMIT<T, Keys> — Bỏ một số properties:
// ═══════════════════════════════════════════════════════════

type PublicProfile = Omit<UserProfile, 'email'>;
// → { name: string; avatar: string; bio: string }

// React: Extend HTML nhưng override 1 số props:
type CustomSelectProps = Omit<
    React.ComponentPropsWithoutRef<'select'>, 'onChange'
> & { onChange: (value: string) => void };  // custom onChange!

// ═══════════════════════════════════════════════════════════
// ④ RECORD<Keys, Value> — Object với typed keys:
// ═══════════════════════════════════════════════════════════

// Config cho nhiều themes:
type ThemeColors = Record<'primary' | 'secondary' | 'danger', string>;
// → { primary: string; secondary: string; danger: string }

// Status messages:
type StatusMessages = Record<'loading' | 'success' | 'error', string>;
const messages: StatusMessages = {
    loading: 'Đang tải...', success: 'Thành công!', error: 'Lỗi!'
};

// Dynamic route config:
type RouteConfig = Record<string, {
    component: React.ComponentType;
    auth: boolean;
}>;

// ═══════════════════════════════════════════════════════════
// ⑤ REQUIRED<T> — Tất cả thành required:
// ═══════════════════════════════════════════════════════════

type RequiredUser = Required<UserCardProps>;
// Tất cả ? biến mất! avatar: string (không optional nữa!)

// ⑥ EXTRACT + EXCLUDE — Filter union types:
type AllStatus = 'idle' | 'loading' | 'success' | 'error';
type ActiveStatus = Exclude<AllStatus, 'idle'>;
// → 'loading' | 'success' | 'error'
```

---

## §11. Readonly Trong Props!

```typescript
// ═══════════════════════════════════════════════════════════
// READONLY PROPS — TẠI SAO + KHI NÀO?
// ═══════════════════════════════════════════════════════════

// ① React props KHÔNG NÊN mutate! (one-way data flow)
// readonly NGĂN CHẶN mutation tại compile-time!

// CÁCH 1: Readonly utility type:
type ReadonlyCardProps = Readonly<{
    title: string;
    items: string[];
}>;
// → { readonly title: string; readonly items: readonly string[] }
// ❌ props.title = 'new'; → TS ERROR!

// CÁCH 2: readonly keyword:
type TableProps = {
    readonly columns: readonly string[];
    readonly data: readonly Record<string, unknown>[];
    readonly onSort?: (column: string) => void;
};

function Table(props: TableProps) {
    // props.columns = [];      // ❌ TS ERROR — readonly!
    // props.columns.push('x'); // ❌ TS ERROR — readonly array!
    // props.data[0].name = 'x';// ✅ nhưng nên tránh!

    // ✅ Tạo copy mới:
    const sorted = [...props.data].sort(/* ... */);
    return <table>{/* ... */}</table>;
}

// ═══════════════════════════════════════════════════════════
// KHI NÀO DÙNG readonly?
// ═══════════════════════════════════════════════════════════

// ✅ DÙNG:
// → Props nhận arrays/objects từ parent (ngăn mutation!)
// → Shared data structures (config, themes, constants)
// → Khi team lớn — ngăn junior dev vô tình mutate props!

// ❌ KHÔNG CẦN:
// → Primitive props (string, number, boolean) — JS đã immutable!
// → Internal state (useState quản lý mutation qua setter!)
// → Khi CHẮC CHẮN không ai mutate (team nhỏ, conventions rõ)

// ═══════════════════════════════════════════════════════════
// READONLY VỚI NESTED OBJECTS — Deep Readonly:
// ═══════════════════════════════════════════════════════════

type DeepReadonly<T> = {
    readonly [K in keyof T]: T[K] extends object
        ? DeepReadonly<T[K]>
        : T[K];
};

type Config = { theme: { colors: { primary: string; secondary: string } } };
type ReadonlyConfig = DeepReadonly<Config>;
// → config.theme.colors.primary = 'x'; // ❌ TS ERROR — deep readonly!
```

---

## §12. Tổng Kết & Câu Hỏi Phỏng Vấn!

```
  REACT + TYPESCRIPT — TỔNG KẾT:
  ┌────────────────────────────────────────────────────────┐
  │  Component: function Btn(props: BtnProps) — infer!     │
  │  Props: interface/type, discriminated unions!          │
  │  React.FC: TRÁNH! Dùng function declaration!          │
  │  Events: React.ChangeEvent<HTMLInputElement>           │
  │  Hooks: generic <T>, return tuple as const!           │
  │  useState: generic khi initial = null/[]/union!       │
  │  HTML: ComponentPropsWithoutRef<'button'> & Custom    │
  │  Context: createContext<T|null> + throw hook!         │
  │  Mapped: { [K in keyof T]: ... } — form errors!      │
  │  Utility: Partial, Pick, Omit, Record, Required       │
  │  Readonly: Readonly<Props> ngăn mutation!              │
  └────────────────────────────────────────────────────────┘
```

**❓ Q1: Cách define types cho React components?**

> Function declaration + type/interface cho props: `function Button(props: ButtonProps)`. TS tự infer return type. Dùng **interface** khi cần extend, **type** khi cần union/intersection. Tránh React.FC vì React 18 đã xóa implicit children.

**❓ Q2: Discriminated union props là gì?**

> Dùng shared field (VD `type`) để phân biệt các variants. TS tự narrow type khi `switch/if` theo field đó. VD: `| { type: 'error'; errorCode: number } | { type: 'action'; onAction: () => void }` → khi `type === 'error'`, TS biết `errorCode` tồn tại!

**❓ Q3: Type event handlers thế nào?**

> `React.ChangeEvent<HTMLInputElement>` cho onChange, `React.MouseEvent<HTMLButtonElement>` cho onClick, `React.FormEvent<HTMLFormElement>` cho onSubmit. Generic param = loại HTML element. Shorthand: `React.ChangeEventHandler<HTMLInputElement>`.

**❓ Q4: Extend HTML attributes cho custom component?**

> `React.ComponentPropsWithoutRef<'button'> & { customProp: string }`. Dùng **Omit** nếu override props bị trùng: `Omit<ComponentPropsWithoutRef<'input'>, 'size'> & { size: 'sm'|'md' }`. Dùng `forwardRef<HTMLInputElement, Props>` nếu cần expose ref.

**❓ Q5: Readonly props khi nào dùng?**

> Dùng `Readonly<Props>` khi props nhận arrays/objects từ parent — ngăn mutation tại compile-time! React one-way data flow = props KHÔNG NÊN bị mutate. `DeepReadonly<T>` cho nested objects. Không cần cho primitives (string/number đã immutable). `readonly items: readonly string[]` cho cả array lẫn property.

---

> 📝 **Ghi nhớ cuối cùng:**
> "Function declaration + type props! Discriminated union cho variant props! useState generic khi null/[]/union! ComponentPropsWithoutRef extend HTML! Context null + throw hook! Mapped types cho forms! Partial update, Pick subset, Omit override, Record config! Readonly ngăn mutation props!"
