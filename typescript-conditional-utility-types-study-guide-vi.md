# Hướng Dẫn Học Tập: Conditional Types và Utility Types trong TypeScript

## Câu hỏi
(Ứng dụng thực tế) Kết hợp conditional types và utility types để triển khai một `NullableProperties<T>` - biến tất cả các thuộc tính không phải function trong T thành nullable.

---

## Trả lời

### Giải pháp

```typescript
type NullableProperties<T> = {  
  [K in keyof T]: T[K] extends Function ? T[K] : T[K] | null;  
};
```

### Giải thích chi tiết

Cần xác định xem giá trị thuộc tính có phải là function hay không dựa trên conditional type.

---

## 📚 Kiến thức nền tảng

### 1. Mapped Types (Kiểu ánh xạ)

Mapped Types cho phép bạn tạo kiểu mới bằng cách biến đổi các thuộc tính của kiểu hiện có.

```typescript
type Readonly<T> = {
  readonly [K in keyof T]: T[K];
};
```

**Cú pháp cơ bản:**
- `[K in keyof T]`: Duyệt qua tất cả các key trong T
- `K`: Biến đại diện cho mỗi key
- `keyof T`: Lấy tất cả các key của T

---

### 2. Conditional Types (Kiểu điều kiện)

Conditional Types cho phép bạn chọn kiểu dựa trên điều kiện.

```typescript
T extends U ? X : Y
```

**Ý nghĩa:**
- Nếu `T` có thể gán cho `U` → trả về `X`
- Ngược lại → trả về `Y`

**Ví dụ đơn giản:**
```typescript
type IsString<T> = T extends string ? true : false;

type A = IsString<string>;  // true
type B = IsString<number>;  // false
```

---

### 3. keyof Operator

`keyof` trả về union của tất cả các key trong một object type.

```typescript
interface Person {
  name: string;
  age: number;
}

type PersonKeys = keyof Person;  // "name" | "age"
```

---

## 🔍 Phân tích chi tiết NullableProperties<T>

### Cấu trúc từng phần

```typescript
type NullableProperties<T> = {  
  [K in keyof T]: T[K] extends Function ? T[K] : T[K] | null;  
};
```

#### Phần 1: `[K in keyof T]`
- **Mapped Type**: Duyệt qua tất cả các key trong T
- `K`: Đại diện cho từng key (name, age, sayHi)
- `keyof T`: Lấy tất cả key của T

#### Phần 2: `T[K] extends Function`
- **Conditional Type**: Kiểm tra xem kiểu của thuộc tính có phải Function không
- `T[K]`: Lấy kiểu của thuộc tính tại key K
- `extends Function`: Kiểm tra có phải là function

#### Phần 3: `? T[K] : T[K] | null`
- **Nếu là Function**: Giữ nguyên kiểu `T[K]`
- **Nếu không phải Function**: Thêm `null` → `T[K] | null`

---

## 🧪 Test Case và Kết quả

### Định nghĩa interface ban đầu

```typescript
interface User {  
  name: string;  
  age: number;  
  sayHi(): void; // ⚠️ Giữ nguyên, không biến thành null  
}
```

### Áp dụng NullableProperties

```typescript
type NullableUser = NullableProperties<User>;
```

### Kết quả tương đương

```typescript
/*  
NullableUser tương đương với:  
{  
  name: string | null;     // ✅ Thuộc tính thường → thêm null
  age: number | null;      // ✅ Thuộc tính thường → thêm null
  sayHi(): void;           // ✅ Function → giữ nguyên
}  
*/
```

---

## 💡 Ví dụ thực tế

### Ví dụ 1: Sử dụng với object

```typescript
const user: NullableUser = {
  name: "Alice",
  age: null,              // ✅ Hợp lệ vì age có thể null
  sayHi() {
    console.log("Hi!");
  }
};
```

### Ví dụ 2: Kiểm tra lỗi

```typescript
const invalidUser: NullableUser = {
  name: "Bob",
  age: 25,
  sayHi: null  // ❌ LỖI: Function không thể null
};
```

---

## 🎯 Các trường hợp nâng cao

### Trường hợp 1: Xử lý Optional Properties

```typescript
interface Product {
  id: number;
  name: string;
  description?: string;  // Optional property
  getPrice(): number;
}

type NullableProduct = NullableProperties<Product>;

/*
Kết quả:
{
  id: number | null;
  name: string | null;
  description?: string | null;  // Vẫn optional + thêm null
  getPrice(): number;           // Function giữ nguyên
}
*/
```

### Trường hợp 2: Xử lý Arrow Functions

```typescript
interface Calculator {
  value: number;
  add: (x: number) => number;     // Arrow function
  subtract(x: number): number;    // Method
}

type NullableCalculator = NullableProperties<Calculator>;

/*
Kết quả:
{
  value: number | null;           // Thuộc tính → thêm null
  add: (x: number) => number;     // Function → giữ nguyên
  subtract(x: number): number;    // Function → giữ nguyên
}
*/
```

---

## 🔧 Các biến thể và mở rộng

### Biến thể 1: Chỉ nullable cho string properties

```typescript
type NullableStrings<T> = {
  [K in keyof T]: T[K] extends string ? T[K] | null : T[K];
};

interface Config {
  host: string;
  port: number;
  debug: boolean;
}

type NullableConfig = NullableStrings<Config>;
/*
{
  host: string | null;  // ✅ String → thêm null
  port: number;         // ❌ Number → giữ nguyên
  debug: boolean;       // ❌ Boolean → giữ nguyên
}
*/
```

### Biến thể 2: Loại trừ cả methods và arrow functions

```typescript
type NullableNonFunctions<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any 
    ? T[K] 
    : T[K] | null;
};
```

**Giải thích:**
- `(...args: any[]) => any`: Kiểm tra chính xác hơn cho function signature
- Bắt được cả methods và arrow functions

---

## 📊 So sánh các cách kiểm tra Function

| Cách kiểm tra | Ưu điểm | Nhược điểm |
|---------------|---------|------------|
| `extends Function` | Đơn giản, dễ hiểu | Có thể bỏ sót một số edge cases |
| `extends (...args: any[]) => any` | Chính xác hơn | Phức tạp hơn một chút |
| `extends { (...args: any[]): any }` | Bắt được callable objects | Quá chi tiết cho hầu hết trường hợp |

---

## 🎓 Bài tập thực hành

### Bài tập 1: RequiredNullable
Tạo type biến tất cả properties thành required và nullable (loại bỏ optional).

```typescript
type RequiredNullable<T> = {
  [K in keyof T]-?: T[K] extends Function ? T[K] : T[K] | null;
};

interface PartialUser {
  name?: string;
  age?: number;
  greet?(): void;
}

type FullUser = RequiredNullable<PartialUser>;
/*
{
  name: string | null;    // Required + nullable
  age: number | null;     // Required + nullable
  greet(): void;          // Required + giữ nguyên function
}
*/
```

**Giải thích:** `-?` loại bỏ optional modifier.

---

### Bài tập 2: DeepNullable
Tạo type biến tất cả properties thành nullable, kể cả nested objects.

```typescript
type DeepNullable<T> = {
  [K in keyof T]: T[K] extends Function
    ? T[K]
    : T[K] extends object
    ? DeepNullable<T[K]> | null
    : T[K] | null;
};

interface Company {
  name: string;
  address: {
    street: string;
    city: string;
  };
  getInfo(): string;
}

type NullableCompany = DeepNullable<Company>;
/*
{
  name: string | null;
  address: {
    street: string | null;
    city: string | null;
  } | null;
  getInfo(): string;
}
*/
```

---

### Bài tập 3: SelectiveNullable
Chỉ biến một số properties cụ thể thành nullable.

```typescript
type SelectiveNullable<T, K extends keyof T> = {
  [P in keyof T]: P extends K ? T[P] | null : T[P];
};

interface Student {
  id: number;
  name: string;
  email: string;
  phone: string;
}

// Chỉ email và phone có thể null
type PartialStudent = SelectiveNullable<Student, 'email' | 'phone'>;
/*
{
  id: number;
  name: string;
  email: string | null;   // ✅ Nullable
  phone: string | null;   // ✅ Nullable
}
*/
```

---

## 🌟 Utility Types có sẵn trong TypeScript

TypeScript cung cấp nhiều utility types hữu ích:

### 1. Partial<T>
Biến tất cả properties thành optional.

```typescript
type Partial<T> = {
  [K in keyof T]?: T[K];
};
```

### 2. Required<T>
Biến tất cả properties thành required.

```typescript
type Required<T> = {
  [K in keyof T]-?: T[K];
};
```

### 3. Readonly<T>
Biến tất cả properties thành readonly.

```typescript
type Readonly<T> = {
  readonly [K in keyof T]: T[K];
};
```

### 4. Pick<T, K>
Chọn một số properties từ T.

```typescript
type Pick<T, K extends keyof T> = {
  [P in K]: T[P];
};
```

### 5. Omit<T, K>
Loại bỏ một số properties từ T.

```typescript
type Omit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>;
```

---

## 🎯 Kết luận

### Những điểm quan trọng cần nhớ:

1. **Mapped Types** (`[K in keyof T]`): Duyệt qua tất cả properties
2. **Conditional Types** (`T extends U ? X : Y`): Kiểm tra điều kiện
3. **Function Detection** (`extends Function`): Phát hiện function types
4. **Union Types** (`T | null`): Kết hợp nhiều types

### Ứng dụng thực tế:

- **Form Validation**: Cho phép fields tạm thời null trước khi submit
- **API Response**: Xử lý dữ liệu có thể thiếu từ backend
- **State Management**: Quản lý state có thể chưa được khởi tạo
- **Database Models**: Biểu diễn records có thể có giá trị NULL

---

## 📚 Thuật ngữ quan trọng

- **Mapped Types**: Kiểu ánh xạ - biến đổi properties của type
- **Conditional Types**: Kiểu điều kiện - chọn type dựa trên điều kiện
- **Utility Types**: Các type helper có sẵn trong TypeScript
- **Generic Types**: Kiểu tổng quát - type có tham số
- **Type Inference**: Suy luận kiểu - TypeScript tự động xác định type
- **Union Types**: Kiểu hợp - kết hợp nhiều types với `|`
- **Nullable**: Có thể null - type cho phép giá trị null

---

## 💻 Code hoàn chỉnh để thực hành

```typescript
// ===== Định nghĩa type =====
type NullableProperties<T> = {  
  [K in keyof T]: T[K] extends Function ? T[K] : T[K] | null;  
};

// ===== Test interface =====
interface User {  
  name: string;  
  age: number;  
  email: string;
  isActive: boolean;
  sayHi(): void;
  greet: () => string;
}

// ===== Áp dụng type =====
type NullableUser = NullableProperties<User>;

// ===== Sử dụng thực tế =====
const user1: NullableUser = {
  name: "Alice",
  age: 25,
  email: null,           // ✅ OK
  isActive: null,        // ✅ OK
  sayHi() {
    console.log("Hi!");
  },
  greet: () => "Hello!"
};

const user2: NullableUser = {
  name: null,            // ✅ OK
  age: null,             // ✅ OK
  email: "test@test.com",
  isActive: true,
  sayHi() {},
  greet: () => ""
};

// ===== Test lỗi =====
const invalidUser: NullableUser = {
  name: "Bob",
  age: 30,
  email: "bob@test.com",
  isActive: true,
  sayHi: null,           // ❌ ERROR: Function không thể null
  greet: null            // ❌ ERROR: Function không thể null
};
```

---

*Study guide này giúp bạn hiểu sâu về Conditional Types và Utility Types trong TypeScript. Hãy thực hành với các ví dụ và bài tập để nắm vững kiến thức!*
