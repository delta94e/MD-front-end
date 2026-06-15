# Type-Level TypeScript: Hành Trình Từ Newbie Đến Principal Engineer

## Claude


# Type-Level TypeScript: Hành Trình Từ Newbie Đến Principal Engineer


## Lời Mở Đầu: Tại Sao Type-Level Programming Quan Trọng?


Trong suốt hành trình 12 năm làm việc tại các công ty lớn như NAB, Axon, Binance, Webflow, và Figma, tôi đã chứng kiến sự tiến hóa của TypeScript từ một "nice-to-have" tool thành backbone của modern front-end development. Nhưng điều khiến tôi thực sự impressed không phải là basic type annotations, mà là khả năng type-level programming - một paradigm hoàn toàn khác biệt mà nhiều senior engineers vẫn chưa truly master.


**💭 Principal's Perspective:** Khi tôi interview candidates cho senior/principal roles, tôi thường bắt đầu với câu hỏi: "Hãy explain sự khác biệt giữa `string | number` và `string & number`". 80% candidates có thể answer về union, nhưng chỉ 20% hiểu sâu về intersection, và gần như 0% có thể explain tại sao `string & number` evaluates to `never`. Đây chính là gap giữa surface knowledge và deep understanding.


## PHẦN I: FOUNDATION LEVEL - XÂY DỰNG NỀN TẢNG TƯ DUY


### 1. Paradigm Shift: Từ Value Programming Sang Type Programming


#### 🌱 Nguồn Gốc & Motivation


Trước khi dive vào technical details, chúng ta cần understand một fundamental shift trong cách thinking. Trong traditional programming, chúng ta work với values:


```javascript
// Value-level programming
const name = "Alice";
const age = 30;
const user = { name, age };
```


Nhưng trong type-level TypeScript, **types chính là data**:


```typescript
// Type-level programming
type Name = "Alice";
type Age = 30;
type User = { name: Name; age: Age };
```


**💭 Debugging Mental Model:** Khi tôi đầu tiên encounter type-level programming, biggest confusion của tôi là mixing up value world và type world. Tôi hay viết:


```typescript
// ❌ Sai thinking - trying to mix worlds
type Five = 2 + 3; // Error!
```


**Aha moment** đến khi tôi realize: types và values are completely separate universes, each with their own rules and operations.


#### 🔬 Bản Chất & Mechanism


**Computer Science Deep Dive:** Về mặt theoretical, type systems are formal systems của mathematical logic. TypeScript's type checker hoạt động như một theorem prover, attempting to prove hoặc disprove type relationships.


```typescript
// Type checker proves: "Alice" ⊆ string
const greeting: string = "Alice"; // ✅ Proof successful

// Type checker cannot prove: string ⊆ "Alice"
const specific: "Alice" = greeting; // ❌ Proof failed
```


**Browser Engine Perspective:** Điều quan trọng cần hiểu là type checking happens completely at compile time. V8 engine không care about TypeScript types - nó chỉ execute JavaScript output.


```typescript
// TypeScript compile time
function greet(name: string): string {
  return `Hello, ${name}`;
}

// JavaScript runtime
function greet(name) {
  return `Hello, ${name}`;
}
```


#### 💡 Intuitive Understanding


**Real-world Analogy:** Think của type-level programming như việc design một classification system cho library. Values là books, types là categories. Bạn có thể create nested categories (subtyping), combine categories (unions), hoặc find intersection of categories.


**Mental Model:**


- Type checker = Librarian kiểm tra xem book có thuộc category không
- Subtyping = Category hierarchy
- Type operations = Transformations on category labels


### 2. Năm Loại Types: Architecture của Type System


#### 🔬 Primitive Types - The Building Blocks


**Etymology & Context:** Primitive types được call là "primitive" vì chúng là indivisible units - không thể break down further. Trong computer science, primitives là atomic data types được built into language.


```typescript
type Primitives =
  | number     // IEEE 754 double precision
  | string     // UTF-16 encoded text
  | boolean    // true/false binary
  | symbol     // Unique identifier
  | bigint     // Arbitrary precision integer
  | undefined  // Absence of value
  | null;      // Intentional absence
```


**Memory Model Analysis:**


- `number`: 64-bit floating point (8 bytes)
- `string`: Variable length, reference to heap
- `boolean`: Optimized to single bit trong V8
- `symbol`: Unique reference in global symbol registry
- `bigint`: Variable length arbitrary precision
- `undefined`/`null`: Singleton values trong V8


**💭 Production Reality tại Binance:** Chúng tôi learned hard way về `number` precision limits khi dealing với cryptocurrency values. BigInt became essential:


```typescript
// ❌ Precision loss với large numbers
const satoshi = 2100000000000000; // 21M Bitcoin in satoshi
const wei = 1000000000000000000; // 1 ETH in wei

// ✅ Safe với BigInt
const satoshiBig = 2100000000000000n;
const weiBig = 1000000000000000000n;
```


#### 🔬 Literal Types - Exact Value Representation


**Core Mechanism:** Literal types are singleton sets - sets containing exactly one value. Đây là TypeScript's way của expressing exact values at type level.


```typescript
// Literal types - singleton sets
type Twenty = 20;           // Set containing only 20
type Hello = "Hello";       // Set containing only "Hello"
type True = true;           // Set containing only true
```


**Step-by-step Execution Flow:**


1. **Type inference:** TypeScript infers literal type from const assertion
2. **Widening prevention:** `as const` prevents widening to primitive
3. **Assignability check:** Value must exactly match literal


```typescript
// Without const assertion - widening occurs
let x = 20;        // Type: number (widened)

// With const assertion - literal preserved
let y = 20 as const; // Type: 20 (literal)

// Object literal with const assertion
const config = {
  apiUrl: "https://api.example.com",
  timeout: 5000
} as const;
// Type: { readonly apiUrl: "https://api.example.com"; readonly timeout: 5000 }
```


**💭 Think Out Loud - Performance Implications:** Tại Webflow, chúng tôi discovered rằng excessive literal types có thể slow down TypeScript compiler significantly. Type checker phải maintain enormous lookup tables:


```typescript
// ❌ Expensive - too many literal types
type CSSProperty = "margin-top" | "margin-bottom" | "margin-left" | /* 500+ more */;

// ✅ Better - use template literals với constraints
type MarginProperty = `margin-${Direction}`;
type Direction = "top" | "bottom" | "left" | "right";
```


#### 🔬 Data Structures - Complex Type Architectures


**Objects vs Records vs Tuples vs Arrays - Complete Breakdown:**


TypeScript provides four built-in data structures, each optimized for different use cases:


```typescript
// 1. Object Types - Fixed, heterogeneous keys
type User = {
  id: number;           // Always present
  name: string;         // Always present
  email?: string;       // Optional
  readonly created: Date; // Immutable
};

// 2. Record Types - Dynamic, homogeneous values
type UserCache = {
  [userId: string]: User;  // Unknown keys, same value type
};

// 3. Tuple Types - Fixed length arrays
type Coordinate = [number, number];           // Exactly 2 elements
type RGB = [number, number, number];          // Exactly 3 elements
type RGBA = [number, number, number, number?]; // 3 or 4 elements

// 4. Array Types - Variable length arrays
type Numbers = number[];     // Any number of numbers
type Users = Array<User>;    // Generic syntax
```


**Memory Layout & Performance Characteristics:**


```typescript
// Object property access - O(1) với hidden classes trong V8
interface Point {
  x: number;
  y: number;
}

// Record access - O(1) average, O(n) worst case với hash collision
type Points = Record<string, Point>;

// Tuple access - O(1) direct index access
type TuplePoint = [number, number];

// Array access - O(1) direct index, dynamic resizing overhead
type ArrayPoints = Point[];
```


**💭 Architecture Decision tại NAB:** Khi designing trading platform, chúng tôi faced choice giữa object và tuple cho price data:


```typescript
// Option 1: Object approach - readable nhưng verbose
interface PriceData {
  symbol: string;
  bid: number;
  ask: number;
  timestamp: number;
}

// Option 2: Tuple approach - compact nhưng less readable
type PriceDataTuple = [string, number, number, number];

// We chose hybrid approach
type PriceData = [
  symbol: string,
  bid: number,
  ask: number,
  timestamp: number
];
```


**Edge Cases & Error Scenarios:**


```typescript
// Tuple length mismatches
type Point3D = [number, number, number];
const point: Point3D = [1, 2]; // ❌ Length mismatch

// Record key constraints
type StringRecord = Record<string, number>;
const data: StringRecord = {
  123: 456,      // ✅ Number keys auto-converted to strings
  [Symbol()]: 789 // ❌ Symbol keys not assignable to string
};

// Object property excess
interface Config {
  apiUrl: string;
}
const config: Config = {
  apiUrl: "https://api.com",
  timeout: 5000  // ❌ Excess property error
};
```


### 3. Types as Sets - Mental Model Revolution


#### 🌱 Nguồn Gốc & Fundamental Breakthrough


**Historical Context:** Set theory được developed bởi Georg Cantor vào late 1800s. Computer science adopted set theory cho type systems vì nó provides mathematical foundation for reasoning about program correctness.


**Problem Statement:** Traditional OOP languages thinking về inheritance trees, nhưng real-world type relationships are more complex. Set theory allows us to reason about:


- Subset relationships (subtyping)
- Set operations (unions, intersections)
- Empty sets (impossible types)
- Universal sets (top types)


#### 🔬 Subtyping Deep Dive


**Liskov Substitution Principle trong TypeScript:**


```typescript
// Base type
interface Animal {
  name: string;
}

// Subtype - can substitute Animal everywhere
interface Dog extends Animal {
  name: string;    // Inherited
  breed: string;   // Additional property
}

// Covariance - Dog[] is subtype of Animal[]
const dogs: Dog[] = [{ name: "Rex", breed: "Labrador" }];
const animals: Animal[] = dogs; // ✅ Safe upcast

// Contravariance - Animal handler can handle Dog
type AnimalHandler = (animal: Animal) => void;
type DogHandler = (dog: Dog) => void;

const handleAnimal: AnimalHandler = (animal) => console.log(animal.name);
const handleDog: DogHandler = handleAnimal; // ✅ Safe contravariant assignment
```


**💭 Principal's Debugging Story:** Tại Figma, chúng tôi encountered subtle subtyping bug với event handlers:


```typescript
interface ClickEvent {
  type: "click";
  target: Element;
}

interface ButtonClickEvent extends ClickEvent {
  type: "click";
  target: HTMLButtonElement; // More specific target
}

// Seems safe but causes runtime issues
function handleGenericClick(handler: (e: ClickEvent) => void) {
  // Runtime: target might not be HTMLButtonElement!
  const event: ClickEvent = { type: "click", target: document.body };
  handler(event); // 💥 Handler expects HTMLButtonElement
}

const buttonHandler = (e: ButtonClickEvent) => {
  e.target.click(); // Assumes HTMLButtonElement methods
};

handleGenericClick(buttonHandler); // Type-safe but runtime unsafe!
```


**Solution:** Understanding contravariance properly:


```typescript
// Correct: Handler should accept MORE general types
type EventHandler<T extends ClickEvent> = (event: T) => void;

// Button handler must work with any ClickEvent
const safeButtonHandler: EventHandler<ClickEvent> = (e) => {
  if (e.target instanceof HTMLButtonElement) {
    e.target.click(); // Safe runtime check
  }
};
```


#### 🔬 Assignability Rules - The Complete Matrix


**Fundamental Rule:** Type A is assignable to type B if and only if set A ⊆ set B.


```typescript
// Assignability matrix
type AssignabilityExamples = {
  // Literal to primitive: ✅ Subset relationship
  literalToString: string extends "hello" ? never : "hello"; // "hello" assignable to string

  // Primitive to literal: ❌ Superset not assignable to subset
  stringToLiteral: "hello" extends string ? never : string; // never - not assignable

  // Union to member: ❌ Superset not assignable
  unionToMember: "a" extends "a" | "b" ? never : "a" | "b"; // never - not assignable

  // Member to union: ✅ Subset assignable
  memberToUnion: "a" | "b" extends "a" ? never : "a"; // "a" assignable to "a" | "b"
};
```


**Variance trong Function Types:**


```typescript
// Function parameter contravariance
type Func1 = (x: Dog) => void;
type Func2 = (x: Animal) => void;

// Func2 assignable to Func1 (contravariant in parameters)
const f1: Func1 = (dog: Dog) => {};
const f2: Func2 = (animal: Animal) => {};
const f3: Func1 = f2; // ✅ Safe - f2 can handle Dog (which is Animal)

// Function return covariance
type Getter1 = () => Animal;
type Getter2 = () => Dog;

// Getter2 assignable to Getter1 (covariant in return)
const g1: Getter1 = () => ({ name: "Generic" });
const g2: Getter2 = () => ({ name: "Rex", breed: "Lab" });
const g3: Getter1 = g2; // ✅ Safe - g2 returns Dog (which is Animal)
```


### 4. Union Types - Set Operations in Practice


#### 🔬 Union Mechanism Deep Dive


**Core Algorithm:** TypeScript's union type implementation sử dụng discriminated unions với tag-based dispatch:


```typescript
// Internal representation (conceptual)
type Union<A, B> = {
  tag: "A" | "B";
  value: A | B;
  // Type checker maintains both possibilities
};
```


**Step-by-step Union Resolution:**


```typescript
type TrafficLight = "green" | "orange" | "red";

// 1. Type checker creates union symbol table
// 2. Each literal gets unique ID
// 3. Union operations work on ID sets
// 4. Assignability check intersects ID sets

function handleTrafficLight(light: TrafficLight) {
  // Type narrowing through control flow analysis
  if (light === "green") {
    // TypeScript eliminates "orange" | "red" from union
    // light: "green"
    console.log("Go!");
  } else if (light === "orange") {
    // light: "orange"
    console.log("Caution!");
  } else {
    // light: "red" (exhaustive elimination)
    console.log("Stop!");
  }
}
```


**💭 Performance Deep Dive tại Axon:** Union types với large member sets có thể cause significant compilation slowdown:


```typescript
// ❌ Expensive union - 1000+ members
type HugeUnion = "item1" | "item2" | /* ... */ | "item1000";

// TypeScript compiler O(n²) trong worst case cho union operations
type ProcessedUnion<T> = T extends string ? `processed-${T}` : never;
type Result = ProcessedUnion<HugeUnion>; // Very slow compilation
```


**Optimization Strategy:**


```typescript
// ✅ Better approach - hierarchical unions
type Category = "user" | "admin" | "guest";
type UserAction = "create" | "read" | "update" | "delete";
type AdminAction = UserAction | "delete-all" | "backup";

// Compose rather than flatten
type Action<T extends Category> =
  T extends "user" ? UserAction :
  T extends "admin" ? AdminAction :
  never;
```


#### 🔬 Discriminated Unions - Type Safety Revolution


**Pattern Recognition:** Discriminated unions solve the expression problem - adding new variants without modifying existing code:


```typescript
// Payment processing example từ experience tại Binance
interface CreditCardPayment {
  type: "credit_card";
  cardNumber: string;
  expiryDate: string;
  cvv: string;
}

interface BankTransferPayment {
  type: "bank_transfer";
  accountNumber: string;
  routingNumber: string;
  bankName: string;
}

interface CryptoPayment {
  type: "crypto";
  walletAddress: string;
  currency: "BTC" | "ETH" | "USDT";
  network: string;
}

type PaymentMethod = CreditCardPayment | BankTransferPayment | CryptoPayment;
```


**Exhaustive Pattern Matching:**


```typescript
function processPayment(payment: PaymentMethod): string {
  switch (payment.type) {
    case "credit_card":
      // TypeScript narrows to CreditCardPayment
      return `Processing card ending in ${payment.cardNumber.slice(-4)}`;

    case "bank_transfer":
      // TypeScript narrows to BankTransferPayment
      return `Processing transfer from ${payment.bankName}`;

    case "crypto":
      // TypeScript narrows to CryptoPayment
      return `Processing ${payment.currency} to ${payment.walletAddress}`;

    default:
      // Exhaustiveness check - should be never
      const exhaustive: never = payment;
      throw new Error(`Unhandled payment type: ${exhaustive}`);
  }
}
```


**💭 Production Issue tại Binance:** Initially chúng tôi không use discriminated unions và encountered runtime errors:


```typescript
// ❌ Old approach - dangerous type assertions
interface Payment {
  type: string;
  data: any;
}

function processPaymentOld(payment: Payment) {
  if (payment.type === "credit_card") {
    // ⚠️ No type safety - runtime error potential
    const card = payment.data as CreditCardPayment;
    return card.cardNumber; // Could be undefined!
  }
}

// ✅ New approach - type safety guaranteed
function processPaymentNew(payment: PaymentMethod) {
  if (payment.type === "credit_card") {
    // ✅ TypeScript guarantees payment is CreditCardPayment
    return payment.cardNumber; // Always defined
  }
}
```


### 5. Intersection Types - Set Intersection Deep Dive


#### 🔬 Intersection Algorithm & Implementation


**Mathematical Foundation:** Intersection A ∩ B creates type containing values that simultaneously satisfy both A and B constraints.


```typescript
// Simple intersections
type Person = { name: string };
type Employee = { employeeId: number };
type PersonEmployee = Person & Employee;

// Result: { name: string; employeeId: number }
const worker: PersonEmployee = {
  name: "Alice",
  employeeId: 12345
};
```


**Complex Intersection Resolution:**


```typescript
// Intersection với conflicting properties
type A = { x: string; y: number };
type B = { x: number; z: boolean };
type Intersection = A & B;

// Result: { x: never; y: number; z: boolean }
// x property becomes never (string & number = ∅)

const impossible: Intersection = {
  x: "impossible", // ❌ Cannot assign to never
  y: 42,
  z: true
};
```


**💭 Real-world Debugging tại Webflow:** Chúng tôi encountered tricky intersection với function signatures:


```typescript
// Component props intersection
interface BaseProps {
  className?: string;
  children?: React.ReactNode;
}

interface ButtonProps extends BaseProps {
  onClick: (event: MouseEvent) => void;
  variant: "primary" | "secondary";
}

interface LinkProps extends BaseProps {
  href: string;
  target?: "_blank" | "_self";
}

// Intersection creates flexible component
type ButtonLinkProps = ButtonProps & LinkProps;

// Usage requires both button AND link properties
const buttonLink: ButtonLinkProps = {
  onClick: (e) => { /* handle click */ },
  variant: "primary",
  href: "/dashboard",
  target: "_blank"
};
```


**Method Intersection Complexities:**


```typescript
// Function intersection behavior
type MethodA = { method: (x: string) => number };
type MethodB = { method: (x: number) => string };
type MethodIntersection = MethodA & MethodB;

// Result method type: ((x: string) => number) & ((x: number) => string)
// This creates overloaded function signature!

const obj: MethodIntersection = {
  method: (x: string | number): number | string => {
    if (typeof x === "string") return 42;
    return "result";
  }
};
```


## PHẦN II: SENIOR LEVEL - ADVANCED TYPE MANIPULATION


### 6. The never Type - Empty Set Mastery


#### 🌱 Theoretical Foundation của never


**Set Theory Context:** never represents ∅ (empty set) - set containing no elements. Trong type theory, này là bottom type - subtype của every other type.


**Why Empty Set Matters:** Empty set là fundamental building block của set operations. Without empty set, không thể define complement hoặc difference operations.


#### 🔬 never trong Type-Level Programming


**Control Flow Analysis:**


```typescript
function assertNever(x: never): never {
  throw new Error(`Unexpected value: ${x}`);
}

// Exhaustive checking pattern
type Status = "loading" | "success" | "error";

function handleStatus(status: Status) {
  switch (status) {
    case "loading":
      return "Loading...";
    case "success":
      return "Success!";
    case "error":
      return "Error occurred";
    default:
      // status: never - all cases handled
      return assertNever(status);
  }
}
```


**Type-Level Filtering với never:**


```typescript
// Remove null/undefined từ union
type NonNullable<T> = T extends null | undefined ? never : T;

type Example1 = NonNullable<string | null | undefined>; // string
type Example2 = NonNullable<number | null>; // number

// Advanced filtering patterns
type Filter<T, U> = T extends U ? never : T;
type StringsOnly = Filter<string | number | boolean, number | boolean>; // string

// Object key filtering
type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];

interface User {
  id: number;       // Required
  name: string;     // Required
  email?: string;   // Optional
  phone?: string;   // Optional
}

type Required = RequiredKeys<User>; // "id" | "name"
```


**💭 Advanced Pattern tại Figma:** Chúng tôi sử dụng never cho conditional type chains:


```typescript
// Plugin API type safety
type PluginCommand =
  | { type: "create-shape"; shape: "rectangle" | "circle" }
  | { type: "delete-shape"; id: string }
  | { type: "update-props"; id: string; props: Record<string, any> };

// Extract payload type based on command type
type ExtractPayload<T extends PluginCommand, Type extends T["type"]> =
  T extends { type: Type } ? Omit<T, "type"> : never;

type CreatePayload = ExtractPayload<PluginCommand, "create-shape">;
// Result: { shape: "rectangle" | "circle" }

type DeletePayload = ExtractPayload<PluginCommand, "delete-shape">;
// Result: { id: string }
```


### 7. The unknown Type - Universal Set Mastery


#### 🔬 unknown vs any - Critical Distinction


**Safety Comparison:**


```typescript
// any - bypasses type checking (dangerous)
let anyValue: any = "hello";
anyValue.foo.bar.baz; // ✅ Type-checks but runtime error!
anyValue(); // ✅ Type-checks but might not be function!
anyValue[Symbol.iterator](); // ✅ Type-checks but might crash!

// unknown - safe top type
let unknownValue: unknown = "hello";
unknownValue.foo; // ❌ Type error - must narrow first
unknownValue(); // ❌ Type error - must check if function
unknownValue[Symbol.iterator]; // ❌ Type error - must validate
```


**Type Narrowing Patterns:**


```typescript
function processUnknown(value: unknown) {
  // Type guards for safe narrowing
  if (typeof value === "string") {
    // value: string
    console.log(value.toUpperCase());
  } else if (typeof value === "number") {
    // value: number
    console.log(value.toFixed(2));
  } else if (value && typeof value === "object") {
    // value: object (but still need more checks)
    if ("name" in value && typeof value.name === "string") {
      // Now safe to access name
      console.log(value.name);
    }
  }
}
```


**Advanced Type Predicate Functions:**


```typescript
// User-defined type guards
interface User {
  id: number;
  name: string;
  email: string;
}

function isUser(value: unknown): value is User {
  return (
    value !== null &&
    typeof value === "object" &&
    typeof (value as any).id === "number" &&
    typeof (value as any).name === "string" &&
    typeof (value as any).email === "string"
  );
}

// Usage with unknown
function handleApiResponse(response: unknown) {
  if (isUser(response)) {
    // response: User (narrowed safely)
    console.log(`User: ${response.name}`);
    console.log(`Email: ${response.email}`);
  } else {
    console.log("Invalid user data");
  }
}
```


**💭 Production Story tại NAB:** Chúng tôi migrated từ any sang unknown cho external API responses:


```typescript
// Old approach - dangerous
async function fetchUserOld(): Promise<any> {
  const response = await fetch("/api/user");
  const data = await response.json(); // Returns any
  return data.user.profile.name; // ⚠️ Runtime error if structure changes
}

// New approach - safe với unknown
async function fetchUserNew(): Promise<string | null> {
  const response = await fetch("/api/user");
  const data: unknown = await response.json();

  // Safe validation chain
  if (
    data &&
    typeof data === "object" &&
    "user" in data &&
    typeof data.user === "object" &&
    data.user &&
    "profile" in data.user &&
    typeof data.user.profile === "object" &&
    data.user.profile &&
    "name" in data.user.profile &&
    typeof data.user.profile.name === "string"
  ) {
    return data.user.profile.name;
  }

  return null; // Safe fallback
}
```


**Runtime Validation Libraries Integration:**


```typescript
// Zod integration với unknown
import { z } from "zod";

const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  profile: z.object({
    avatar: z.string().url().optional(),
    bio: z.string().optional()
  })
});

type User = z.infer<typeof UserSchema>;

async function fetchUserSafe(): Promise<User | null> {
  try {
    const response = await fetch("/api/user");
    const data: unknown = await response.json();

    // Parse và validate unknown data
    const user = UserSchema.parse(data);
    return user; // Guaranteed to be User type
  } catch (error) {
    console.error("Invalid user data:", error);
    return null;
  }
}
```


### 8. Advanced Union Manipulation


#### 🔬 Distributive Conditional Types


**Core Mechanism:** Conditional types distribute over unions when applied to naked type parameters:


```typescript
// Distributive behavior
type Exclude<T, U> = T extends U ? never : T;

// How it works step by step:
type Example = Exclude<"a" | "b" | "c", "a">;

// Step 1: Distribution
// = Exclude<"a", "a"> | Exclude<"b", "a"> | Exclude<"c", "a">

// Step 2: Evaluation
// = ("a" extends "a" ? never : "a") |
//   ("b" extends "a" ? never : "b") |
//   ("c" extends "a" ? never : "c")

// Step 3: Resolution
// = never | "b" | "c"

// Step 4: Union cleanup
// = "b" | "c"
```


**Advanced Union Utilities:**


```typescript
// Extract union members matching pattern
type ExtractByPrefix<T, Prefix extends string> =
  T extends `${Prefix}${infer _Rest}` ? T : never;

type ApiEvents = "user:login" | "user:logout" | "post:create" | "post:delete";
type UserEvents = ExtractByPrefix<ApiEvents, "user:">; // "user:login" | "user:logout"

// Convert union to intersection
type UnionToIntersection<U> =
  (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never;

type Props1 = { a: string };
type Props2 = { b: number };
type Props3 = { c: boolean };

type AllProps = UnionToIntersection<Props1 | Props2 | Props3>;
// Result: { a: string } & { b: number } & { c: boolean }
```


**💭 Complex Pattern tại Webflow:** Event system với type-safe handlers:


```typescript
// Event payload mapping
interface EventMap {
  "component:select": { id: string; type: "div" | "text" | "image" };
  "component:move": { id: string; x: number; y: number };
  "component:resize": { id: string; width: number; height: number };
  "layer:create": { parentId: string; type: string };
  "layer:delete": { id: string };
}

// Extract event names
type EventName = keyof EventMap;

// Type-safe event emitter
class TypedEventEmitter {
  private listeners: {
    [K in EventName]?: Array<(payload: EventMap[K]) => void>;
  } = {};

  on<K extends EventName>(
    event: K,
    listener: (payload: EventMap[K]) => void
  ): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event]!.push(listener);
  }

  emit<K extends EventName>(event: K, payload: EventMap[K]): void {
    const eventListeners = this.listeners[event];
    if (eventListeners) {
      eventListeners.forEach(listener => listener(payload));
    }
  }
}

// Usage - fully type-safe
const emitter = new TypedEventEmitter();

emitter.on("component:select", (payload) => {
  // payload: { id: string; type: "div" | "text" | "image" }
  console.log(`Selected ${payload.type} with id ${payload.id}`);
});

emitter.emit("component:select", {
  id: "comp-123",
  type: "div"
}); // ✅ Type-safe

emitter.emit("component:select", {
  id: "comp-123",
  width: 100 // ❌ Type error - width not in payload
});
```


### 9. Template Literal Types - String Manipulation at Type Level


#### 🔬 Template Literal Mechanism


**Core Algorithm:** TypeScript compiler implements template literals qua string concatenation tại type level:


```typescript
// Basic template literal types
type Greeting = "Hello";
type Name = "World";
type Message = `${Greeting}, ${Name}!`; // "Hello, World!"

// Pattern matching với infer
type ExtractName<T> = T extends `Hello, ${infer Name}!` ? Name : never;
type Extracted = ExtractName<"Hello, TypeScript!">; // "TypeScript"
```


**Advanced String Manipulation:**


```typescript
// CSS property generation
type CSSProperty = "margin" | "padding" | "border";
type CSSDirection = "top" | "right" | "bottom" | "left";
type CSSProperties = `${CSSProperty}-${CSSDirection}`;
// Result: "margin-top" | "margin-right" | ... | "border-left"

// HTTP method routing
type HTTPMethod = "GET" | "POST" | "PUT" | "DELETE";
type APIEndpoint = "/users" | "/posts" | "/comments";
type RouteSignature = `${HTTPMethod} ${APIEndpoint}`;
// Result: "GET /users" | "POST /users" | ... | "DELETE /comments"

// String transformation utilities
type Capitalize<S extends string> = S extends `${infer F}${infer R}`
  ? `${Uppercase<F>}${R}`
  : S;

type CamelCase<S extends string> = S extends `${infer Head}-${infer Tail}`
  ? `${Head}${CamelCase<Capitalize<Tail>>}`
  : S;

type KebabToCamel = CamelCase<"user-profile-settings">; // "userProfileSettings"
```


**💭 Real-world Application tại Figma:** Plugin API với type-safe commands:


```typescript
// Plugin command system
type PluginNamespace = "selection" | "viewport" | "history" | "ui";
type PluginAction = "get" | "set" | "reset" | "listen";

// Generate all possible plugin APIs
type PluginAPI = `${PluginNamespace}:${PluginAction}`;

// Dynamic API implementation
type APIImplementation = {
  [K in PluginAPI]: K extends `${infer Namespace}:${infer Action}`
    ? (
        Namespace extends "selection"
          ? Action extends "get"
            ? () => SelectedNode[]
            : Action extends "set"
            ? (nodes: SelectedNode[]) => void
            : never
        : Namespace extends "viewport"
          ? Action extends "get"
            ? () => ViewportBounds
            : Action extends "set"
            ? (bounds: ViewportBounds) => void
            : never
        : never
      )
    : never;
};

// Usage creates type-safe API
declare const figmaAPI: APIImplementation;

const selectedNodes = figmaAPI["selection:get"](); // Returns SelectedNode[]
figmaAPI["selection:set"](selectedNodes); // Accepts SelectedNode[]

// Type error for invalid combinations
figmaAPI["selection:invalid"]; // ❌ Type error
```


**Recursive String Processing:**


```typescript
// Deep object path type generation
type Path<T, Prefix extends string = ""> = {
  [K in keyof T]: T[K] extends object
    ? Path<T[K], `${Prefix}${string extends Prefix ? "" : "."}${string & K}`>
    : `${Prefix}${string extends Prefix ? "" : "."}${string & K}`;
}[keyof T];

interface NestedData {
  user: {
    profile: {
      name: string;
      email: string;
    };
    settings: {
      theme: "light" | "dark";
      notifications: boolean;
    };
  };
  posts: Array<{
    title: string;
    content: string;
  }>;
}

type DataPaths = Path<NestedData>;
// Result: "user.profile.name" | "user.profile.email" | "user.settings.theme" | etc.

// Type-safe deep property access
function getProperty<T, P extends Path<T>>(
  obj: T,
  path: P
): any { // Would need complex type computation for exact return type
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

const data: NestedData = { /* ... */ };
const userName = getProperty(data, "user.profile.name"); // Type-safe access
const invalid = getProperty(data, "user.invalid.path"); // ❌ Type error
```


## PHẦN III: PRINCIPAL LEVEL - SYSTEM DESIGN VÀ ARCHITECTURE


### 10. Advanced Type System Architecture


#### 🌱 Design Principles for Scalable Type Systems


**From Experience tại Large Codebases:** Managing TypeScript tại scale (500k+ lines code) requires careful architectural planning. Key principles learned:


1. **Type Locality:** Related types should be co-located
2. **Dependency Inversion:** High-level types shouldn't depend on low-level types
3. **Interface Segregation:** Large interfaces should be split into focused contracts
4. **Open/Closed Principle:** Types should be open for extension, closed for modification


#### 🔬 Modular Type Architecture


**Domain-Driven Type Design:**


```typescript
// Base domain types - stable foundation
namespace Core {
  export interface Entity {
    readonly id: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;
  }

  export interface ValueObject {
    equals(other: this): boolean;
  }

  export interface Repository<T extends Entity> {
    findById(id: string): Promise<T | null>;
    save(entity: T): Promise<void>;
    delete(id: string): Promise<void>;
  }
}

// User domain - extends core concepts
namespace UserDomain {
  export interface User extends Core.Entity {
    readonly email: string;
    readonly name: string;
    readonly role: Role;
  }

  export type Role = "admin" | "user" | "guest";

  export interface UserRepository extends Core.Repository<User> {
    findByEmail(email: string): Promise<User | null>;
    findByRole(role: Role): Promise<User[]>;
  }

  // Value objects
  export class Email implements Core.ValueObject {
    constructor(private readonly value: string) {
      if (!this.isValid(value)) {
        throw new Error("Invalid email format");
      }
    }

    equals(other: Email): boolean {
      return this.value === other.value;
    }

    private isValid(email: string): boolean {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    toString(): string {
      return this.value;
    }
  }
}

// API layer - composes domain types
namespace API {
  // Request/Response DTOs
  export interface CreateUserRequest {
    email: string;
    name: string;
    role?: UserDomain.Role;
  }

  export interface UserResponse {
    id: string;
    email: string;
    name: string;
    role: UserDomain.Role;
    createdAt: string; // ISO string for API
    updatedAt: string;
  }

  // Mappers between domain và API
  export function toUserResponse(user: UserDomain.User): UserResponse {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString()
    };
  }

  export function toUser(request: CreateUserRequest): Partial<UserDomain.User> {
    return {
      email: request.email,
      name: request.name,
      role: request.role ?? "user"
    };
  }
}
```


**💭 Architecture Decision tại NAB:** Chúng tôi discovered rằng mixing domain logic với API types creates tight coupling:


```typescript
// ❌ Poor architecture - mixed concerns
interface UserAPI {
  id: string;
  email: string;
  name: string;
  // API-specific fields mixed with domain
  passwordHash: string; // Should not be in API!
  lastLoginIP: string;  // Domain logic leaking
  // UI-specific fields
  displayName: string;  // Should be computed
}

// ✅ Better architecture - separated concerns
namespace UserDomain {
  interface User {
    readonly id: string;
    readonly email: string;
    readonly name: string;
    readonly passwordHash: string; // Domain only
    readonly lastLoginIP: string;
  }
}

namespace UserAPI {
  interface PublicUser {
    id: string;
    email: string;
    name: string;
    displayName: string; // Computed field
  }

  // Safe transformation
  function toPublicUser(user: UserDomain.User): PublicUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      displayName: user.name || user.email
    };
  }
}
```


### 11. Generic Programming Patterns


#### 🔬 Advanced Generic Constraints


**Constraint-Based Design:**


```typescript
// Flexible generic với multiple constraints
interface Serializable {
  serialize(): string;
}

interface Cacheable {
  getCacheKey(): string;
}

interface Timestamped {
  timestamp: Date;
}

// Combined constraints for sophisticated APIs
class DataService
  T extends Serializable & Cacheable & Timestamped
> {
  private cache = new Map<string, string>();

  async save(item: T): Promise<void> {
    const key = item.getCacheKey();
    const data = item.serialize();

    // Type-safe access to all constraint methods
    this.cache.set(key, data);

    console.log(`Saved at: ${item.timestamp.toISOString()}`);
  }

  async load(key: string): Promise<T | null> {
    const cached = this.cache.get(key);
    if (cached) {
      // Would need additional deserialization logic
      return JSON.parse(cached) as T;
    }
    return null;
  }
}
```


**Higher-Kinded Types Simulation:**


```typescript
// Functor pattern trong TypeScript
interface Functor<T> {
  map<U>(fn: (value: T) => U): Functor<U>;
}

class Maybe<T> implements Functor<T> {
  constructor(private value: T | null) {}

  map<U>(fn: (value: T) => U): Maybe<U> {
    if (this.value === null) {
      return new Maybe<U>(null);
    }
    return new Maybe(fn(this.value));
  }

  flatMap<U>(fn: (value: T) => Maybe<U>): Maybe<U> {
    if (this.value === null) {
      return new Maybe<U>(null);
    }
    return fn(this.value);
  }

  getOrElse(defaultValue: T): T {
    return this.value ?? defaultValue;
  }

  static of<T>(value: T): Maybe<T> {
    return new Maybe(value);
  }

  static none<T>(): Maybe<T> {
    return new Maybe<T>(null);
  }
}

// Functional composition
const result = Maybe.of("hello")
  .map(s => s.toUpperCase())
  .map(s => s.length)
  .map(n => n * 2)
  .getOrElse(0); // 10
```


**💭 Advanced Pattern tại Webflow:** Generic component system with constraint-based props:


```typescript
// Component constraint system
interface ComponentProps {
  className?: string;
  children?: React.ReactNode;
}

interface Clickable {
  onClick?: (event: React.MouseEvent) => void;
}

interface Navigable {
  href?: string;
  target?: "_blank" | "_self";
}

interface Styleable {
  style?: React.CSSProperties;
}

// Conditional props based on element type
type ElementProps<T extends string> =
  T extends "button" ? Clickable :
  T extends "a" ? Navigable & Partial<Clickable> :
  T extends "div" ? Styleable :
  {};

// Generic component với smart prop inference
function Element<T extends keyof JSX.IntrinsicElements>(
  props: {
    as: T;
  } & ComponentProps &
    ElementProps<T> &
    JSX.IntrinsicElements[T]
) {
  const { as: Component, ...rest } = props;
  return React.createElement(Component, rest);
}

// Usage - type-safe based on element type
const button = (
  <Element
    as="button"
    onClick={(e) => console.log("clicked")} // ✅ Valid for button
    className="btn"
  />
);

const link = (
  <Element
    as="a"
    href="/dashboard" // ✅ Valid for anchor
    target="_blank"   // ✅ Valid for anchor
    onClick={(e) => console.log("navigating")} // ✅ Also valid
  />
);

const invalid = (
  <Element
    as="div"
    href="/invalid" // ❌ Type error - href not valid for div
  />
);
```


### 12. Type-Level State Machines


#### 🔬 State Machine Type Modeling


**Finite State Machine Implementation:**


```typescript
// State machine definition tại type level
interface State<Name extends string, Data = {}> {
  name: Name;
  data: Data;
}

interface Transition<From extends string, To extends string, Event extends string> {
  from: From;
  to: To;
  event: Event;
}

// User authentication state machine
type AuthStates =
  | State<"idle">
  | State<"loading">
  | State<"authenticated", { user: User; token: string }>
  | State<"error", { message: string }>;

type AuthEvents =
  | "LOGIN_START"
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILURE"
  | "LOGOUT";

type AuthTransitions =
  | Transition<"idle", "loading", "LOGIN_START">
  | Transition<"loading", "authenticated", "LOGIN_SUCCESS">
  | Transition<"loading", "error", "LOGIN_FAILURE">
  | Transition<"authenticated", "idle", "LOGOUT">
  | Transition<"error", "loading", "LOGIN_START">;

// Type-safe state machine implementation
class StateMachine
  States extends State<string, any>,
  Events extends string,
  Transitions extends Transition<string, string, Events>
> {
  constructor(private currentState: States) {}

  // Transition type safety
  transition
    CurrentName extends States["name"],
    Event extends Events,
    ValidTransition extends Extract
      Transitions,
      { from: CurrentName; event: Event }
    >
  >(
    this: StateMachine<States, Events, Transitions> & { currentState: Extract<States, { name: CurrentName }> },
    event: Event,
    data?: Extract<States, { name: ValidTransition["to"] }>["data"]
  ): StateMachine<States, Events, Transitions> {
    // Runtime transition logic would go here
    const newState = {
      name: "loading", // This would be computed based on transition rules
      data: data || {}
    } as States;

    return new StateMachine(newState);
  }

  getCurrentState(): States {
    return this.currentState;
  }

  is<Name extends States["name"]>(
    stateName: Name
  ): this is StateMachine<States, Events, Transitions> & {
    currentState: Extract<States, { name: Name }>
  } {
    return this.currentState.name === stateName;
  }
}
```


**💭 Production Implementation tại Axon:** Complex video processing state machine:


```typescript
// Video processing pipeline states
type VideoProcessingStates =
  | State<"uploaded", { fileId: string; originalSize: number }>
  | State<"validating", { fileId: string }>
  | State<"encoding", { fileId: string; progress: number }>
  | State<"transcoding", { fileId: string; formats: string[] }>
  | State<"completed", { fileId: string; processedFiles: ProcessedFile[] }>
  | State<"failed", { fileId: string; error: string; retryCount: number }>;

type VideoProcessingEvents =
  | "VALIDATE"
  | "START_ENCODING"
  | "UPDATE_PROGRESS"
  | "START_TRANSCODING"
  | "COMPLETE"
  | "FAIL"
  | "RETRY";

// Usage trong video processing service
class VideoProcessor {
  private stateMachine: StateMachine<VideoProcessingStates, VideoProcessingEvents, any>;

  constructor(fileId: string, originalSize: number) {
    this.stateMachine = new StateMachine({
      name: "uploaded",
      data: { fileId, originalSize }
    });
  }

  async processVideo(): Promise<void> {
    if (this.stateMachine.is("uploaded")) {
      // Type-safe access to uploaded state data
      const { fileId, originalSize } = this.stateMachine.getCurrentState().data;

      console.log(`Starting validation for file ${fileId} (${originalSize} bytes)`);

      // Transition to validation
      this.stateMachine = this.stateMachine.transition("VALIDATE");
    }

    if (this.stateMachine.is("validating")) {
      // Validation logic...
      const validationResult = await this.validateFile();

      if (validationResult.isValid) {
        this.stateMachine = this.stateMachine.transition("START_ENCODING");
      } else {
        this.stateMachine = this.stateMachine.transition("FAIL", {
          error: validationResult.error,
          retryCount: 0
        });
      }
    }

    // Continue state transitions...
  }

  private async validateFile(): Promise<{ isValid: boolean; error?: string }> {
    // Validation implementation
    return { isValid: true };
  }
}
```


### 13. Performance Optimization at Type Level


#### 🌱 TypeScript Compiler Performance


**Understanding Compilation Bottlenecks:**


1. **Union type complexity:** O(n²) trong worst case
2. **Recursive type depth:** Stack overflow risk beyond ~40 levels
3. **Template literal combinations:** Exponential explosion
4. **Inference complexity:** Can cause infinite loops


#### 🔬 Optimization Strategies


**Union Size Management:**


```typescript
// ❌ Expensive - large union với complex operations
type HugeUnion = "a1" | "a2" | /* ... 1000+ members */ | "a1000";

type ProcessEach<T> = T extends string ? `processed-${T}` : never;
type ProcessedHuge = ProcessEach<HugeUnion>; // Very slow compilation

// ✅ Better - split large unions into chunks
type ChunkA = "a1" | "a2" | "a3" | "a4" | "a5";
type ChunkB = "b1" | "b2" | "b3" | "b4" | "b5";
type ChunkC = "c1" | "c2" | "c3" | "c4" | "c5";

type ProcessedA = ProcessEach<ChunkA>;
type ProcessedB = ProcessEach<ChunkB>;
type ProcessedC = ProcessEach<ChunkC>;

type ProcessedBetter = ProcessedA | ProcessedB | ProcessedC;
```


**Recursive Type Depth Limiting:**


```typescript
// ❌ Dangerous - unbounded recursion
type DeepNested<T, Depth extends any[] = []> =
  Depth["length"] extends 100 ? never : // Depth limit
  T extends object ? {
    [K in keyof T]: DeepNested<T[K], [...Depth, any]>;
  } : T;

// ✅ Better - manual depth control
type DeepNested1<T> = T extends object ? { [K in keyof T]: T[K] } : T;
type DeepNested2<T> = T extends object ? { [K in keyof T]: DeepNested1<T[K]> } : T;
type DeepNested3<T> = T extends object ? { [K in keyof T]: DeepNested2<T[K]> } : T;
// Continue as needed, but with explicit control
```


**💭 Performance Crisis tại Binance:** Chúng tôi encountered 30+ second compilation times với complex trading types:


```typescript
// Original problematic code
type TradingPair = "BTC/USDT" | "ETH/USDT" | /* 500+ pairs */;
type OrderType = "market" | "limit" | "stop" | "stop-limit";
type OrderSide = "buy" | "sell";
type TimeInForce = "GTC" | "IOC" | "FOK";

// This created 500 * 4 * 2 * 3 = 12,000 possible combinations!
type OrderCombination = `${TradingPair}-${OrderType}-${OrderSide}-${TimeInForce}`;

// Processing each combination was exponentially expensive
type ValidateOrder<T extends OrderCombination> =
  T extends `${infer Pair}-${infer Type}-${infer Side}-${infer TIF}`
    ? ValidatePair<Pair> extends true
      ? ValidateType<Type> extends true
        ? ValidateSide<Side> extends true
          ? ValidateTIF<TIF> extends true
            ? T
            : never
          : never
        : never
      : never
    : never;

// Solution: Structural approach instead of combinatorial
interface Order {
  pair: TradingPair;
  type: OrderType;
  side: OrderSide;
  timeInForce: TimeInForce;
}

// Much faster - validate each field independently
type ValidOrder = {
  [K in keyof Order]: Order[K] extends TradingPair ? Order[K] : never;
};
```


### 14. Integration Patterns với External Systems


#### 🔬 API Integration Type Safety


**GraphQL Schema to TypeScript:**


```typescript
// Generated từ GraphQL schema
interface GraphQLResponse<Data, Variables = {}> {
  data?: Data;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: Array<string | number>;
  }>;
  extensions?: Record<string, any>;
}

// Query type generation
type UserQuery = {
  user: {
    id: string;
    name: string;
    email: string;
    posts: Array<{
      id: string;
      title: string;
      content: string;
      publishedAt: string;
    }>;
  };
};

type UserQueryVariables = {
  userId: string;
  includeUnpublished?: boolean;
};

// Type-safe GraphQL client
class TypedGraphQLClient {
  async query<Data, Variables = {}>(
    query: string,
    variables?: Variables
  ): Promise<GraphQLResponse<Data>> {
    const response = await fetch("/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables })
    });

    return response.json();
  }
}

// Usage với full type safety
const client = new TypedGraphQLClient();

const result = await client.query<UserQuery, UserQueryVariables>(
  `
    query GetUser($userId: ID!, $includeUnpublished: Boolean) {
      user(id: $userId) {
        id
        name
        email
        posts(includeUnpublished: $includeUnpublished) {
          id
          title
          content
          publishedAt
        }
      }
    }
  `,
  { userId: "123", includeUnpublished: false }
);

if (result.data) {
  // Fully typed access
  console.log(result.data.user.name);
  result.data.user.posts.forEach(post => {
    console.log(post.title);
  });
}
```


**💭 Real Integration tại Figma:** Plugin API type generation từ native definitions:


```typescript
// Native Figma API definitions (simplified)
interface FigmaNode {
  readonly id: string;
  readonly type: NodeType;
  readonly name: string;
  readonly parent: (BaseNode & ChildrenMixin) | null;
}

interface FrameNode extends FigmaNode {
  readonly type: "FRAME";
  readonly children: ReadonlyArray<SceneNode>;
  layoutMode: "NONE" | "HORIZONTAL" | "VERTICAL";
  itemSpacing: number;
}

interface TextNode extends FigmaNode {
  readonly type: "TEXT";
  characters: string;
  fontSize: number;
  fontName: FontName;
}

type SceneNode = FrameNode | TextNode | /* other node types */;

// Plugin-side type generation
type ExtractNodeType<T extends SceneNode, Type extends T["type"]> =
  T extends { type: Type } ? T : never;

type FrameNodes = ExtractNodeType<SceneNode, "FRAME">;
type TextNodes = ExtractNodeType<SceneNode, "TEXT">;

// Type-safe node manipulation
function processNode(node: SceneNode): void {
  switch (node.type) {
    case "FRAME":
      // TypeScript narrows to FrameNode
      console.log(`Frame với ${node.children.length} children`);
      node.layoutMode = "VERTICAL"; // Type-safe property access
      break;

    case "TEXT":
      // TypeScript narrows to TextNode
      console.log(`Text: "${node.characters}"`);
      node.fontSize = 16; // Type-safe property access
      break;
  }
}
```


## PHẦN IV: MASTERY VERIFICATION & PRACTICE


### 15. Complex Problem Solving Scenarios


#### 🎯 Scenario 1: E-commerce Type System Design


**Requirements:** Design type system cho e-commerce platform với:


- Multi-tenant support
- Dynamic pricing
- Complex product variants
- Order state management
- Permission system


**Solution Architecture:**


```typescript
// Multi-tenant foundation
interface Tenant {
  readonly id: string;
  readonly domain: string;
  readonly settings: TenantSettings;
}

interface TenantSettings {
  currency: Currency;
  taxation: TaxationRules;
  shipping: ShippingRules;
  features: FeatureFlags;
}

// Product system với variants
interface BaseProduct {
  readonly id: string;
  readonly tenantId: string;
  readonly name: string;
  readonly description: string;
  readonly category: Category;
}

interface SimpleProduct extends BaseProduct {
  readonly type: "simple";
  readonly price: Price;
  readonly inventory: InventoryItem;
}

interface VariableProduct extends BaseProduct {
  readonly type: "variable";
  readonly variants: ProductVariant[];
  readonly attributes: ProductAttribute[];
}

type Product = SimpleProduct | VariableProduct;

// Dynamic pricing system
interface Price {
  readonly base: number;
  readonly currency: Currency;
  readonly rules: PricingRule[];
}

interface PricingRule {
  readonly id: string;
  readonly type: "percentage" | "fixed" | "tier";
  readonly conditions: PricingCondition[];
  readonly value: number;
}

// Order state machine
type OrderStates =
  | State<"cart", { items: CartItem[] }>
  | State<"checkout", { items: CartItem[]; shipping: ShippingInfo }>
  | State<"payment", { order: Order; paymentMethod: PaymentMethod }>
  | State<"processing", { order: Order; paymentId: string }>
  | State<"shipped", { order: Order; trackingNumber: string }>
  | State<"delivered", { order: Order; deliveryConfirmation: DeliveryInfo }>
  | State<"cancelled", { order: Order; reason: string }>
  | State<"refunded", { order: Order; refundAmount: number }>;

// Permission system với RBAC
interface Permission {
  readonly resource: Resource;
  readonly action: Action;
  readonly conditions?: PermissionCondition[];
}

type Resource = "product" | "order" | "customer" | "tenant" | "report";
type Action = "create" | "read" | "update" | "delete" | "list";

interface Role {
  readonly id: string;
  readonly name: string;
  readonly permissions: Permission[];
  readonly tenantId: string;
}

// Type-safe permission checking
class PermissionChecker<User extends { roles: Role[] }> {
  constructor(private user: User) {}

  can<R extends Resource, A extends Action>(
    resource: R,
    action: A,
    context?: PermissionContext
  ): boolean {
    return this.user.roles.some(role =>
      role.permissions.some(permission =>
        permission.resource === resource &&
        permission.action === action &&
        this.evaluateConditions(permission.conditions, context)
      )
    );
  }

  private evaluateConditions(
    conditions: PermissionCondition[] | undefined,
    context: PermissionContext | undefined
  ): boolean {
    if (!conditions) return true;
    if (!context) return false;

    return conditions.every(condition =>
      this.evaluateCondition(condition, context)
    );
  }

  private evaluateCondition(
    condition: PermissionCondition,
    context: PermissionContext
  ): boolean {
    // Implementation would check condition against context
    return true;
  }
}
```


#### 🎯 Scenario 2: Real-time Collaboration System


**Challenge:** Design types cho real-time collaborative editor như Google Docs.


**Key Requirements:**


- Operational Transformation
- Conflict Resolution
- User Presence
- Document Versioning
- Offline Support


**Solution:**


```typescript
// Document structure
interface Document {
  readonly id: string;
  readonly version: number;
  readonly content: DocumentContent;
  readonly metadata: DocumentMetadata;
}

interface DocumentContent {
  readonly blocks: ContentBlock[];
  readonly selections: Selection[];
}

type ContentBlock =
  | TextBlock
  | ImageBlock
  | TableBlock
  | CodeBlock;

interface TextBlock {
  readonly type: "text";
  readonly id: string;
  readonly content: string;
  readonly formatting: TextFormatting[];
}

// Operational Transformation
interface Operation {
  readonly id: string;
  readonly authorId: string;
  readonly timestamp: number;
  readonly documentVersion: number;
}

type OperationType =
  | InsertOperation
  | DeleteOperation
  | FormatOperation
  | MoveOperation;

interface InsertOperation extends Operation {
  readonly type: "insert";
  readonly position: Position;
  readonly content: string;
}

interface DeleteOperation extends Operation {
  readonly type: "delete";
  readonly range: Range;
}

// Conflict resolution
type ConflictResolution = "client-wins" | "server-wins" | "manual";

interface ConflictResolver {
  resolve<T extends Operation>(
    local: T,
    remote: T,
    strategy: ConflictResolution
  ): T[];
}

// Real-time collaboration
interface CollaborationSession {
  readonly documentId: string;
  readonly participants: Participant[];
  readonly operations: OperationHistory;
}

interface Participant {
  readonly userId: string;
  readonly presence: PresenceInfo;
  readonly permissions: DocumentPermissions;
}

interface PresenceInfo {
  readonly cursor: Position | null;
  readonly selection: Range | null;
  readonly isActive: boolean;
  readonly lastSeen: Date;
}

// Type-safe operation application
class DocumentEngine {
  apply<T extends Operation>(
    document: Document,
    operation: T
  ): Result<Document, OperationError> {
    // Validate operation
    const validation = this.validateOperation(operation, document);
    if (!validation.isValid) {
      return { error: validation.error };
    }

    // Apply operation based on type
    switch (operation.type) {
      case "insert":
        return this.applyInsert(document, operation);
      case "delete":
        return this.applyDelete(document, operation);
      case "format":
        return this.applyFormat(document, operation);
      default:
        return { error: new OperationError("Unknown operation type") };
    }
  }

  private validateOperation(
    operation: Operation,
    document: Document
  ): ValidationResult {
    // Check version compatibility
    if (operation.documentVersion !== document.version) {
      return {
        isValid: false,
        error: new OperationError("Version mismatch")
      };
    }

    // Type-specific validation
    switch (operation.type) {
      case "insert":
        return this.validateInsert(operation, document);
      case "delete":
        return this.validateDelete(operation, document);
      default:
        return { isValid: true };
    }
  }
}
```


### 16. Interview Questions & Assessment Framework


#### 🎯 Beginner Level Questions


**Q1: Basic Type Understanding**


```typescript
// Explain what happens here and why
type A = string | number;
type B = string & number;

const a: A = "hello"; // Valid?
const b: B = "hello"; // Valid?
```


**Expected Answer:**


- A is union (either string OR number) - valid assignment
- B is intersection (both string AND number simultaneously) - impossible, evaluates to never
- Understanding of set theory: union joins sets, intersection finds overlap


**Q2: Literal Types**


```typescript
// What's the difference?
let x = "hello";
let y = "hello" as const;
const z = "hello";

// Which assignments work?
let a: "hello" = x; // ?
let b: "hello" = y; // ?
let c: "hello" = z; // ?
```


**Expected Answer:**


- Type widening behavior
- const assertions prevent widening
- const declarations infer literal types


#### 🎯 Senior Level Questions


**Q3: Advanced Union Manipulation**


```typescript
// Implement RemoveFromUnion
type RemoveFromUnion<T, U> = ???;

type Test = RemoveFromUnion<"a" | "b" | "c", "b">; // Should be "a" | "c"
```


**Expected Answer:**


```typescript
type RemoveFromUnion<T, U> = T extends U ? never : T;
```


- Understanding of distributive conditional types
- Knowledge that conditional types distribute over unions
- Usage of never for filtering


**Q4: Object Key Manipulation**


```typescript
// Implement RequiredKeys to extract only required property keys
type RequiredKeys<T> = ???;

interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

type Required = RequiredKeys<User>; // Should be "id" | "name"
```


**Expected Answer:**


```typescript
type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];
```


- Understanding of mapped types
- Knowledge of modifier removal (-?)
- Understanding of conditional type logic with Pick


#### 🎯 Principal Level Questions


**Q5: Higher-Kinded Type Simulation**


```typescript
// Design a type-safe Result type với map/flatMap operations
// Similar to Rust's Result<T, E> or Haskell's Either
```


**Expected Answer:**


```typescript
type Result<T, E> =
  | { success: true; value: T }
  | { success: false; error: E };

interface ResultMethods<T, E> {
  map<U>(fn: (value: T) => U): Result<U, E>;
  flatMap<U, F>(fn: (value: T) => Result<U, F>): Result<U, E | F>;
  mapError<F>(fn: (error: E) => F): Result<T, F>;
}

// Implementation shows understanding of:
// - Discriminated unions for type safety
// - Functor/Monad patterns
// - Generic error handling
// - Method chaining
```


**Q6: Type-Level State Machine**


```typescript
// Design a type system that prevents invalid state transitions
// Example: Loading -> (Success | Error), but not Loading -> Loading
```


**Expected Answer:**


- Phantom types or branded types for state representation
- Conditional types for valid transition checking
- Generic constraints for state machine definition
- Understanding of compile-time vs runtime validation


### 17. Production Debugging Strategies


#### 🔬 TypeScript Compiler Diagnostics


**Debugging Complex Type Errors:**


```typescript
// Use type assertions for debugging
type Debug<T> = {
  [K in keyof T]: T[K];
} & {};

// Inspect intermediate type calculations
type Step1<T> = T extends infer U ? U : never;
type Step2<T> = Step1<T> extends string ? true : false;

// Use conditional types to trace evaluation
type Trace<T, Label extends string = "default"> = T extends infer U
  ? { [K in Label]: U }
  : never;

type Example = Trace<string | number, "MyType">; // { MyType: string | number }
```


**💭 Real Debug Session tại Figma:**


```typescript
// Problem: Complex plugin API type not working
interface PluginMessage<T extends string, P = {}> {
  type: T;
  payload: P;
}

type MessageHandler<T extends PluginMessage<string, any>> = (message: T) => void;

// This was failing mysteriously
type SelectionHandler = MessageHandler<PluginMessage<"selection", { nodes: string[] }>>;

// Debug steps:
// 1. Check constraint satisfaction
type Test1 = PluginMessage<"selection", { nodes: string[] }> extends PluginMessage<string, any> ? true : false; // false!

// 2. Issue found: P = {} constraint too restrictive
interface PluginMessage<T extends string, P = any> { // Changed {} to any
  type: T;
  payload: P;
}

// 3. Verify fix
type Test2 = PluginMessage<"selection", { nodes: string[] }> extends PluginMessage<string, any> ? true : false; // true!
```


**Performance Profiling:**


```typescript
// Use TypeScript's --generateTrace flag
// Analyze type-checking performance
// Identify expensive type operations

// Tools for type complexity analysis:
// 1. ts-unused-exports
// 2. typescript-analyze-trace
// 3. @typescript-eslint/no-unnecessary-type-assertion
```


### 18. Future-Proofing Type Architecture


#### 🌱 Emerging Patterns & Best Practices


**Preparing for TypeScript Evolution:**


1. **Nominal Typing Simulation:** Preparing for potential nominal types


```typescript
// Brand-based nominal typing
type UserId = string & { readonly __brand: "UserId" };
type EmailAddress = string & { readonly __brand: "EmailAddress" };

function createUserId(id: string): UserId {
  return id as UserId; // Validation logic here
}

// Type-safe, prevents mixing different string types
function sendEmail(userId: UserId, email: EmailAddress): void {
  // Implementation
}
```


1. **Higher-Kinded Types Preparation:**


```typescript
// Simulate HKT pattern untuk better generic abstractions
interface HKT<F, A> {
  readonly _F: F;
  readonly _A: A;
}

interface Functor<F> {
  map<A, B>(fa: HKT<F, A>, f: (a: A) => B): HKT<F, B>;
}

// This pattern prepares codebase for future HKT support
```


1. **Module System Evolution:**


```typescript
// Prepare for ES2025+ module features
// Use namespace merging strategically
namespace API {
  export interface Config {
    baseUrl: string;
  }
}

namespace API {
  export interface Config {
    timeout?: number; // Augments previous interface
  }
}

// Result: Config has both baseUrl and timeout
```


**💭 Strategic Technology Planning:** Tại các công ty lớn, chúng tôi learned importance của:


1. **Type Contract Stability:** Internal API types should be versioned
2. **Migration Strategy:** Plan for breaking changes từ TypeScript updates
3. **Team Education:** Regular type system training for team members
4. **Tooling Investment:** Custom type utilities và linting rules
5. **Performance Monitoring:** Track compilation times trong CI/CD


## KẾT LUẬN: MASTERY JOURNEY CONTINUES


### Reflection on the Type-Level Programming Journey


Từ những ngày đầu struggling với basic union types đến architecting complex type systems cho millions-of-users applications, journey này taught me rằng type-level programming không chỉ là about syntax và compiler tricks. Nó là about **thinking differently** - shifting từ imperative programming mindset sang declarative, constraint-based reasoning.


**💭 Principal's Final Thoughts:**


Sau 12 năm working với TypeScript tại scale, key insight của tôi là: **Type system excellence comes từ discipline, not cleverness.** The most elegant type solutions are often the simplest ones that solve real problems và remain maintainable as teams và codebases grow.


**For Newbies Starting Journey:**


- Start với basic set theory understanding
- Practice type challenges daily
- Read open-source library type definitions
- Build mental models before memorizing syntax


**For Senior Engineers Advancing:**


- Focus on architecture principles over complex type gymnastics
- Mentor others - teaching deepens your own understanding
- Contribute to TypeScript community
- Study computer science fundamentals behind type theory


**For Aspiring Principals:**


- Design type systems that grow với organization needs
- Balance type safety với developer productivity
- Lead by example trong code reviews
- Think long-term about technical decisions


### The Never-Ending Learning Path


Type-level TypeScript is continuously evolving field. New patterns emerge, best practices shift, và the language itself keeps growing. The key to long-term success is maintaining **beginner's mind** - staying curious, questioning assumptions, và always being ready to learn something new.


Remember: Every TypeScript expert started by being confused about `string | number`. The difference between expert và beginner isn't the absence of confusion, but the **persistence through confusion** towards deeper understanding.


**Final Challenge:** Take one concept từ this guide mà bạn found challenging, và explain it to someone else. Teaching is the ultimate test of true understanding.


Type-level programming mastery isn't a destination - it's a continuous journey of discovery, refinement, và sharing knowledge với the community. Welcome to the journey, và may your types always compile! 🚀


---


*"In TypeScript, we don't just write code that works - we write code that cannot fail to work." - The Principal's Creed*
