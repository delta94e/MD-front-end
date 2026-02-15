# Hướng Dẫn Học Tập: Utility Types trong TypeScript

## Câu hỏi
Hãy giải thích mục đích và nguyên lý triển khai của các utility types: `Partial<T>`, `Required<T>`, `Readonly<T>`

---

## Trả lời

Ba utility types này đều là các kiểu công cụ có sẵn trong TypeScript, giúp biến đổi types một cách linh hoạt.

---

## 1️⃣ Partial<T>

### Mục đích
Biến tất cả các thuộc tính của type T thành **thuộc tính tùy chọn (optional)**.

### Cách triển khai

```typescript
type Partial<T> = { 
  [P in keyof T]?: T[P] 
};
```

### Giải thích chi tiết

- `[P in keyof T]`: Duyệt qua tất cả các key trong T
- `?`: Thêm modifier optional cho mỗi thuộc tính
- `T[P]`: Giữ nguyên kiểu dữ liệu của thuộc tính

### Ví dụ thực tế

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  age: number;
}

type PartialUser = Partial<User>;

/*
Kết quả tương đương:
{
  id?: number;
  name?: string;
  email?: string;
  age?: number;
}
*/
```

### Ứng dụng thực tế

#### Trường hợp 1: Cập nhật một phần dữ liệu

```typescript
function updateUser(id: number, updates: Partial<User>) {
  // Chỉ cần truyền các field cần update
  // Không bắt buộc phải có đầy đủ tất cả properties
  return { ...existingUser, ...updates };
}

// ✅ Hợp lệ - chỉ update name
updateUser(1, { name: "Alice" });

// ✅ Hợp lệ - update nhiều fields
updateUser(2, { name: "Bob", age: 25 });

// ✅ Hợp lệ - không update gì
updateUser(3, {});
```

#### Trường hợp 2: Form editing (Chỉnh sửa form)

```typescript
interface ProductForm {
  title: string;
  price: number;
  description: string;
  category: string;
}

// State ban đầu có thể chưa có đầy đủ dữ liệu
const [formData, setFormData] = useState<Partial<ProductForm>>({});

// User nhập từng field một
const handleChange = (field: keyof ProductForm, value: any) => {
  setFormData(prev => ({ ...prev, [field]: value }));
};
```

#### Trường hợp 3: API Patch Request

```typescript
// PATCH /api/users/:id - chỉ gửi fields cần update
async function patchUser(id: number, data: Partial<User>) {
  return fetch(`/api/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
}

// Chỉ update email
await patchUser(1, { email: "newemail@example.com" });
```

---

## 2️⃣ Required<T>

### Mục đích
Biến tất cả các thuộc tính của type T thành **bắt buộc (required)** - ngược lại với Partial.

### Cách triển khai

```typescript
type Required<T> = { 
  [P in keyof T]-?: T[P] 
};
```

### Giải thích chi tiết

- `[P in keyof T]`: Duyệt qua tất cả các key trong T
- `-?`: **Loại bỏ** modifier optional (dấu `-` có nghĩa là remove)
- `T[P]`: Giữ nguyên kiểu dữ liệu của thuộc tính

### Ví dụ thực tế

```typescript
interface Config {
  host?: string;
  port?: number;
  timeout?: number;
  retries?: number;
}

type RequiredConfig = Required<Config>;

/*
Kết quả tương đương:
{
  host: string;      // ✅ Bắt buộc
  port: number;      // ✅ Bắt buộc
  timeout: number;   // ✅ Bắt buộc
  retries: number;   // ✅ Bắt buộc
}
*/
```

### Ứng dụng thực tế

#### Trường hợp 1: Đảm bảo API trả về đầy đủ dữ liệu

```typescript
interface UserResponse {
  id?: number;
  name?: string;
  email?: string;
}

// Hàm validate đảm bảo response có đầy đủ fields
function validateUserResponse(data: UserResponse): Required<UserResponse> {
  if (!data.id || !data.name || !data.email) {
    throw new Error("Incomplete user data");
  }
  return data as Required<UserResponse>;
}

// Sau khi validate, có thể sử dụng an toàn
const user = validateUserResponse(apiResponse);
console.log(user.name.toUpperCase()); // ✅ Không cần check undefined
```

#### Trường hợp 2: Merge với default values

```typescript
interface AppConfig {
  theme?: 'light' | 'dark';
  language?: string;
  notifications?: boolean;
}

const defaultConfig: Required<AppConfig> = {
  theme: 'light',
  language: 'en',
  notifications: true
};

function createConfig(userConfig: AppConfig): Required<AppConfig> {
  return { ...defaultConfig, ...userConfig };
}

// Luôn trả về config đầy đủ
const config = createConfig({ theme: 'dark' });
console.log(config.language); // ✅ Chắc chắn có giá trị
```

#### Trường hợp 3: Form submission

```typescript
interface FormData {
  username?: string;
  password?: string;
  email?: string;
}

// Khi submit, tất cả fields phải có
function submitForm(data: Required<FormData>) {
  // Đảm bảo không có field nào undefined
  api.post('/register', data);
}

const formData: FormData = { username: 'alice' };
// submitForm(formData); // ❌ ERROR: thiếu password và email

const completeData: Required<FormData> = {
  username: 'alice',
  password: '123456',
  email: 'alice@example.com'
};
submitForm(completeData); // ✅ OK
```

---

## 3️⃣ Readonly<T>

### Mục đích
Biến tất cả các thuộc tính của type T thành **chỉ đọc (read-only)**.

### Cách triển khai

```typescript
type Readonly<T> = { 
  readonly [P in keyof T]: T[P] 
};
```

### Giải thích chi tiết

- `[P in keyof T]`: Duyệt qua tất cả các key trong T
- `readonly`: Thêm modifier readonly cho mỗi thuộc tính
- `T[P]`: Giữ nguyên kiểu dữ liệu của thuộc tính

### Ví dụ thực tế

```typescript
interface Settings {
  apiUrl: string;
  apiKey: string;
  maxRetries: number;
}

type ReadonlySettings = Readonly<Settings>;

/*
Kết quả tương đương:
{
  readonly apiUrl: string;
  readonly apiKey: string;
  readonly maxRetries: number;
}
*/
```

### Ứng dụng thực tế

#### Trường hợp 1: Bảo vệ configuration objects

```typescript
const config: Readonly<Settings> = {
  apiUrl: 'https://api.example.com',
  apiKey: 'secret-key-123',
  maxRetries: 3
};

// config.apiUrl = 'https://hack.com'; // ❌ ERROR: Cannot assign to 'apiUrl'
// config.maxRetries = 999;             // ❌ ERROR: Cannot assign to 'maxRetries'

console.log(config.apiUrl); // ✅ OK - đọc được
```

#### Trường hợp 2: Immutable state trong React

```typescript
interface AppState {
  user: User;
  isLoading: boolean;
  error: string | null;
}

function reducer(state: Readonly<AppState>, action: Action): AppState {
  // state.isLoading = false; // ❌ ERROR: không thể modify trực tiếp
  
  // ✅ Phải tạo object mới
  return {
    ...state,
    isLoading: false
  };
}
```

#### Trường hợp 3: Constants và enums

```typescript
const HTTP_STATUS: Readonly<Record<string, number>> = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404
};

// HTTP_STATUS.OK = 999; // ❌ ERROR: không thể thay đổi
console.log(HTTP_STATUS.OK); // ✅ OK
```

#### Trường hợp 4: Function parameters

```typescript
function processData(data: Readonly<User[]>) {
  // data.push(newUser);        // ❌ ERROR: không thể modify array
  // data[0].name = "Changed";  // ⚠️ CHÚ Ý: vẫn modify được nested properties
  
  // ✅ Phải tạo copy mới
  const newData = [...data, newUser];
  return newData;
}
```

---

## 🔧 Câu hỏi nâng cao: Triển khai Mutable<T>

### Câu hỏi
Làm thế nào để triển khai một utility type `Mutable<T>` có thể loại bỏ modifier readonly khỏi tất cả các thuộc tính trong T?

### Giải pháp

```typescript
type Mutable<T> = {  
  -readonly [P in keyof T]: T[P];  
};
```

### Giải thích chi tiết

- `[P in keyof T]`: Duyệt qua tất cả các key trong T
- `-readonly`: **Loại bỏ** modifier readonly (dấu `-` có nghĩa là remove)
- `T[P]`: Giữ nguyên kiểu dữ liệu của thuộc tính

### Test Case

```typescript
interface Todo {  
  readonly title: string;  
  readonly description: string;  
  readonly completed: boolean;
}  
  
type MutableTodo = Mutable<Todo>;  

/*  
Kết quả tương đương:  
{  
  title: string;        // ✅ Đã loại bỏ readonly
  description: string;  // ✅ Đã loại bỏ readonly
  completed: boolean;   // ✅ Đã loại bỏ readonly
}  
*/
```

### Ứng dụng thực tế

```typescript
// Có một readonly object từ library
const readonlyTodo: Todo = {
  title: "Learn TypeScript",
  description: "Study utility types",
  completed: false
};

// readonlyTodo.completed = true; // ❌ ERROR: readonly

// Tạo mutable copy để có thể chỉnh sửa
const mutableTodo: MutableTodo = { ...readonlyTodo };
mutableTodo.completed = true; // ✅ OK
mutableTodo.title = "Master TypeScript"; // ✅ OK
```

---

## 📊 Bảng so sánh các Modifiers

| Modifier | Ý nghĩa | Cách thêm | Cách loại bỏ |
|----------|---------|-----------|--------------|
| `?` (Optional) | Thuộc tính tùy chọn | `[P in keyof T]?` | `[P in keyof T]-?` |
| `readonly` | Thuộc tính chỉ đọc | `readonly [P in keyof T]` | `-readonly [P in keyof T]` |

### Ví dụ kết hợp

```typescript
// Thêm cả optional và readonly
type PartialReadonly<T> = {
  readonly [P in keyof T]?: T[P];
};

// Loại bỏ cả optional và readonly
type RequiredMutable<T> = {
  -readonly [P in keyof T]-?: T[P];
};
```

---

## 💡 Các Utility Types nâng cao

### 1. DeepReadonly<T> - Readonly sâu

```typescript
type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object
    ? DeepReadonly<T[P]>
    : T[P];
};

interface User {
  name: string;
  address: {
    street: string;
    city: string;
  };
}

type DeepReadonlyUser = DeepReadonly<User>;
/*
{
  readonly name: string;
  readonly address: {
    readonly street: string;
    readonly city: string;
  };
}
*/
```

### 2. PartialBy<T, K> - Chỉ một số fields optional

```typescript
type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
}

// Chỉ description là optional
type ProductInput = PartialBy<Product, 'description'>;
/*
{
  id: number;
  name: string;
  price: number;
  description?: string;  // ✅ Chỉ field này optional
}
*/
```

### 3. RequiredBy<T, K> - Chỉ một số fields required

```typescript
type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

interface FormData {
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

// Username và email bắt buộc, còn lại optional
type LoginForm = RequiredBy<FormData, 'username' | 'email'>;
/*
{
  username: string;      // ✅ Required
  email: string;         // ✅ Required
  password?: string;     // ❌ Vẫn optional
  confirmPassword?: string;
}
*/
```

### 4. Mutable với Deep support

```typescript
type DeepMutable<T> = {
  -readonly [P in keyof T]: T[P] extends object
    ? DeepMutable<T[P]>
    : T[P];
};

interface ReadonlyConfig {
  readonly server: {
    readonly host: string;
    readonly port: number;
  };
  readonly database: {
    readonly url: string;
  };
}

type MutableConfig = DeepMutable<ReadonlyConfig>;
/*
{
  server: {
    host: string;     // ✅ Loại bỏ readonly ở mọi cấp
    port: number;
  };
  database: {
    url: string;
  };
}
*/
```

---

## 🎯 Bài tập thực hành

### Bài tập 1: OptionalReadonly<T>
Tạo type biến tất cả properties thành optional và readonly.

```typescript
type OptionalReadonly<T> = {
  readonly [P in keyof T]?: T[P];
};

interface User {
  id: number;
  name: string;
}

type SafeUser = OptionalReadonly<User>;
/*
{
  readonly id?: number;
  readonly name?: string;
}
*/

const user: SafeUser = { id: 1 };
// user.id = 2; // ❌ ERROR: readonly
console.log(user.name); // ✅ OK: undefined
```

### Bài tập 2: RequiredNotNull<T>
Tạo type biến tất cả properties thành required và loại bỏ null.

```typescript
type RequiredNotNull<T> = {
  [P in keyof T]-?: NonNullable<T[P]>;
};

interface ApiResponse {
  data?: string | null;
  error?: Error | null;
  status?: number | null;
}

type ValidResponse = RequiredNotNull<ApiResponse>;
/*
{
  data: string;      // ✅ Required + không null
  error: Error;      // ✅ Required + không null
  status: number;    // ✅ Required + không null
}
*/
```

### Bài tập 3: WritableKeys<T>
Tìm tất cả các keys không phải readonly.

```typescript
type WritableKeys<T> = {
  [P in keyof T]-?: (<F>() => F extends { [Q in P]: T[P] } ? 1 : 2) extends
    (<F>() => F extends { -readonly [Q in P]: T[P] } ? 1 : 2) ? P : never;
}[keyof T];

interface Mixed {
  readonly id: number;
  name: string;
  readonly createdAt: Date;
  updatedAt: Date;
}

type Writable = WritableKeys<Mixed>; // "name" | "updatedAt"
```

---

## 🌟 Tổng hợp các Built-in Utility Types

### Object Transformation

| Type | Mục đích | Ví dụ |
|------|----------|-------|
| `Partial<T>` | Tất cả optional | `{ name?: string }` |
| `Required<T>` | Tất cả required | `{ name: string }` |
| `Readonly<T>` | Tất cả readonly | `{ readonly name: string }` |
| `Record<K, T>` | Tạo object type | `{ [key: string]: number }` |

### Property Selection

| Type | Mục đích | Ví dụ |
|------|----------|-------|
| `Pick<T, K>` | Chọn một số properties | `Pick<User, 'id' \| 'name'>` |
| `Omit<T, K>` | Loại bỏ một số properties | `Omit<User, 'password'>` |
| `Exclude<T, U>` | Loại bỏ types từ union | `Exclude<'a'\|'b'\|'c', 'a'>` |
| `Extract<T, U>` | Lấy types từ union | `Extract<'a'\|'b'\|'c', 'a'\|'f'>` |

### Type Manipulation

| Type | Mục đích | Ví dụ |
|------|----------|-------|
| `NonNullable<T>` | Loại bỏ null và undefined | `NonNullable<string \| null>` |
| `ReturnType<T>` | Lấy return type của function | `ReturnType<() => string>` |
| `Parameters<T>` | Lấy parameters của function | `Parameters<(a: string) => void>` |
| `InstanceType<T>` | Lấy instance type của class | `InstanceType<typeof MyClass>` |

---

## 📚 Thuật ngữ quan trọng

- **Utility Types**: Các kiểu công cụ có sẵn để biến đổi types
- **Mapped Types**: Kiểu ánh xạ - duyệt qua properties của type
- **Modifiers**: Các từ khóa như `?`, `readonly`, `-?`, `-readonly`
- **Optional Properties**: Thuộc tính tùy chọn (có thể undefined)
- **Required Properties**: Thuộc tính bắt buộc (không thể undefined)
- **Readonly Properties**: Thuộc tính chỉ đọc (không thể gán lại)
- **Mutable**: Có thể thay đổi (ngược lại với readonly)
- **Immutable**: Không thể thay đổi

---

## 🎓 Best Practices

### 1. Sử dụng Partial cho updates

```typescript
// ✅ GOOD
function updateUser(id: number, updates: Partial<User>) {
  return { ...getUser(id), ...updates };
}

// ❌ BAD - phải truyền tất cả fields
function updateUser(id: number, updates: User) {
  return updates;
}
```

### 2. Sử dụng Required cho validation

```typescript
// ✅ GOOD
function validateConfig(config: Partial<Config>): Required<Config> {
  const defaults: Required<Config> = { /* ... */ };
  return { ...defaults, ...config };
}

// ❌ BAD - không đảm bảo đầy đủ
function validateConfig(config: Partial<Config>): Config {
  return config; // Có thể thiếu fields
}
```

### 3. Sử dụng Readonly cho constants

```typescript
// ✅ GOOD
const CONFIG: Readonly<AppConfig> = {
  apiUrl: 'https://api.example.com',
  timeout: 5000
};

// ❌ BAD - có thể bị modify
const CONFIG: AppConfig = {
  apiUrl: 'https://api.example.com',
  timeout: 5000
};
```

### 4. Kết hợp nhiều utility types

```typescript
// ✅ GOOD - Rõ ràng và an toàn
type UpdateUserDTO = Partial<Omit<User, 'id' | 'createdAt'>>;

// Chỉ cho phép update một số fields, không bao gồm id và createdAt
function updateUser(id: number, data: UpdateUserDTO) {
  // ...
}
```

---

## 💻 Code hoàn chỉnh để thực hành

```typescript
// ===== Định nghĩa interfaces =====
interface User {
  id: number;
  name: string;
  email: string;
  age?: number;
}

interface Config {
  host?: string;
  port?: number;
  timeout?: number;
}

interface Settings {
  readonly apiKey: string;
  readonly apiUrl: string;
  maxRetries: number;
}

// ===== Test Partial<T> =====
const partialUser: Partial<User> = {
  name: "Alice"  // ✅ Chỉ cần một số fields
};

function updateUser(id: number, updates: Partial<User>) {
  console.log(`Updating user ${id}`, updates);
}

updateUser(1, { email: "newemail@test.com" });

// ===== Test Required<T> =====
const requiredConfig: Required<Config> = {
  host: "localhost",  // ✅ Bắt buộc
  port: 3000,         // ✅ Bắt buộc
  timeout: 5000       // ✅ Bắt buộc
};

function initServer(config: Required<Config>) {
  console.log(`Server starting on ${config.host}:${config.port}`);
}

// ===== Test Readonly<T> =====
const readonlySettings: Readonly<Settings> = {
  apiKey: "secret-123",
  apiUrl: "https://api.example.com",
  maxRetries: 3
};

// readonlySettings.apiKey = "new-key"; // ❌ ERROR
console.log(readonlySettings.apiKey);   // ✅ OK

// ===== Test Mutable<T> =====
type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

const mutableSettings: Mutable<Settings> = {
  apiKey: "secret-456",
  apiUrl: "https://api2.example.com",
  maxRetries: 5
};

mutableSettings.apiKey = "new-secret"; // ✅ OK
mutableSettings.maxRetries = 10;       // ✅ OK

// ===== Test kết hợp =====
type PartialReadonly<T> = {
  readonly [P in keyof T]?: T[P];
};

const safeUser: PartialReadonly<User> = {
  id: 1
};

// safeUser.id = 2;        // ❌ ERROR: readonly
console.log(safeUser.name); // ✅ OK: undefined
```

---

## 🎯 Kết luận

### Những điểm quan trọng cần nhớ:

1. **Partial<T>**: Biến tất cả thành optional - dùng cho updates
2. **Required<T>**: Biến tất cả thành required - dùng cho validation
3. **Readonly<T>**: Biến tất cả thành readonly - dùng cho immutability
4. **Mutable<T>**: Loại bỏ readonly - dùng khi cần modify
5. **Modifiers**: `?`, `readonly`, `-?`, `-readonly`

### Khi nào sử dụng:

- **Partial**: Form editing, API PATCH, partial updates
- **Required**: API validation, ensure complete data, merge defaults
- **Readonly**: Configuration, constants, immutable state
- **Mutable**: Clone readonly objects, testing, data transformation

---

*Study guide này giúp bạn hiểu sâu về các Utility Types cơ bản và nâng cao trong TypeScript. Hãy thực hành với các ví dụ để nắm vững kiến thức!*
