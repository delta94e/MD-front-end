# JavaScript Map and Set Deep Dive

## You

Continue

## Claude


# Map và Set trong JavaScript: Từ First Principles đến Production Mastery


*Phân tích chuyên sâu từ góc độ Principal Front-end Engineer*


---


## 🌱 Lời Mở Đầu: Tại Sao Map và Set Quan Trọng?


Khi tôi lần đầu tiên gặp Map và Set trong JavaScript vào năm 2015, tôi đã có một suy nghĩ rất naive: "Tại sao chúng ta cần những thứ này khi đã có Object và Array?" Đó là một câu hỏi hoàn toàn hợp lý từ perspective của một developer vẫn còn đang suy nghĩ theo imperative programming.


Nhưng sau 10+ năm làm việc tại NAB (xử lý transaction data với millions of records), Axon (realtime evidence management), Binance (crypto trading với microsecond latency requirements), Webflow (visual website builder với complex state management), và Figma (collaborative design với operational transformation), tôi đã hiểu được rằng **Map và Set không chỉ là "nice-to-have" features - chúng là fundamental tools cho modern JavaScript development**.


💭 **Principal's Reflection**: Điều tôi nhận ra là Map và Set represent một paradigm shift trong cách chúng ta thinking về data structures trong JavaScript. Chúng mang lại:


- **Type Safety**: Key có thể là bất kỳ type nào
- **Performance Predictability**: O(1) lookups thay vì O(n) searches
- **Memory Efficiency**: Optimized internal implementations
- **Functional Programming Alignment**: Immutable patterns và chainable operations


---


## 📖 PHẦN I: FOUNDATION LEVEL - HIỂU TỪ GỐC RỄ


### 🔬 Chapter 1: Map - The Evolution of Keyed Collections


#### 🌱 Nguồn Gốc & Motivation: Tại Sao Map Được Tạo Ra?


**Problem Statement Chi Tiết:**


Trước khi Map xuất hiện (pre-ES6), chúng ta chỉ có Object để store keyed data. Nhưng Object có những limitations fundamental:


```javascript
// Problem 1: Key coercion - Tất cả keys đều bị convert thành string
const userVisits = {};
const user1 = { id: 1, name: "John" };
const user2 = { id: 2, name: "Jane" };

userVisits[user1] = 5;  // user1 becomes "[object Object]"
userVisits[user2] = 3;  // user2 cũng becomes "[object Object]"

console.log(userVisits);
// Output: { "[object Object]": 3 }
// ❌ Chúng ta đã mất data của user1!
```


💭 **Debugging Mental Model**: Khi tôi debug issue này lần đầu tại NAB (tracking user sessions), tôi đã spend cả buổi chiều trying to figure out tại sao session data bị overwrite. Đó là lúc tôi realized rằng Object keys are inherently strings.


**Problem 2: Prototype pollution và unintended properties**


```javascript
const settings = {};
settings.constructor = "malicious";
settings.toString = () => "hacked";

// ❌ Object có inherited properties không mong muốn
console.log(settings.hasOwnProperty); // function từ Object.prototype
```


**Problem 3: No size property**


```javascript
const data = { a: 1, b: 2, c: 3 };
// ❌ Muốn biết size phải dùng Object.keys(data).length - inefficient!
```


**Problem 4: Iteration complexity**


```javascript
const obj = { a: 1, b: 2, c: 3 };
// ❌ Multiple ways với different behaviors:
for (let key in obj) { /* includes inherited properties */ }
for (let key of Object.keys(obj)) { /* own properties only */ }
Object.entries(obj).forEach(([key, value]) => { /* entries */ });
```


#### 🔬 Bản Chất & Mechanism: Map Hoạt Động Như Thế Nào?


**Core Algorithm Explanation:**


Map internally sử dụng một hash table implementation với những optimizations đặc biệt:


```javascript
// Pseudo-code cho Map internal implementation
class InternalMap {
  constructor() {
    this.buckets = new Array(16); // Initial capacity
    this.size = 0;
    this.loadFactor = 0.75;
  }

  hash(key) {
    // Sử dụng SameValueZero algorithm
    if (typeof key === 'object') {
      return this.objectHash(key); // Reference-based hashing
    }
    return this.primitiveHash(key); // Value-based hashing
  }

  set(key, value) {
    const hash = this.hash(key);
    const bucket = this.buckets[hash % this.buckets.length];

    // Linear probing for collision resolution
    // Insertion order preservation through linked list
    // ...implementation details
  }
}
```


💭 **Deep Understanding Process**: Khi tôi đầu tiên trying to understand Map internals, tôi đã confused về cách nó maintain insertion order while still providing O(1) access. Aha moment của tôi was realizing rằng Map sử dụng một hybrid approach: hash table for fast access + linked list for order preservation.


**Memory Model Analysis:**


```javascript
// Map memory layout (simplified visualization)
const map = new Map([
  ['key1', 'value1'],
  ['key2', 'value2']
]);

/*
Memory Structure:
┌─────────────────┐
│ Map Instance    │
├─────────────────┤
│ size: 2         │
│ buckets: [...]  │
│ firstEntry: →   │──┐
│ lastEntry: →    │──┼──┐
└─────────────────┘  │  │
                     ↓  │
┌─────────────────┐     │
│ Entry 1         │     │
├─────────────────┤     │
│ key: 'key1'     │     │
│ value: 'value1' │     │
│ next: →         │──┐  │
│ prev: null      │  │  │
└─────────────────┘  │  │
                     ↓  │
┌─────────────────┐     │
│ Entry 2         │ ←───┘
├─────────────────┤
│ key: 'key2'     │
│ value: 'value2' │
│ next: null      │
│ prev: ←         │──────┘
└─────────────────┘
*/
```


#### 💡 Intuitive Understanding: Map Như Một Cuốn Từ Điển Thông Minh


**Real-world Analogy:**


Hãy tưởng tượng Map như một cuốn từ điển thông minh (smart dictionary):


1. **Traditional Object = Basic Dictionary**: Chỉ accept string keys, như một từ điển English-Vietnamese chỉ có English words
2. **Map = Universal Translator**: Accept bất kỳ loại "key" nào - pictures, objects, numbers, functions


```javascript
// Map như Universal Translator
const universalTranslator = new Map();

// English word → Vietnamese meaning
universalTranslator.set("hello", "xin chào");

// Number → meaning
universalTranslator.set(404, "Not Found Error");

// Object → description
const redButton = { color: "red", type: "button" };
universalTranslator.set(redButton, "Danger action button");

// Function → documentation
const calculateTax = (amount) => amount * 0.1;
universalTranslator.set(calculateTax, "Tax calculation function");
```


**Visual Metaphor:**


```
Object (Traditional Dictionary):
┌─────────────────────────────────┐
│ "apple"  → "quả táo"            │
│ "banana" → "quả chuối"          │
│ "1"      → "number one as string"│
└─────────────────────────────────┘
❌ Keys phải là strings

Map (Smart Dictionary):
┌─────────────────────────────────┐
│ "apple"     → "quả táo"         │
│ 1           → "number one"      │
│ {id: 123}   → "user object"     │
│ Symbol()    → "unique symbol"   │
│ function()  → "behavior"        │
└─────────────────────────────────┘
✅ Keys có thể là anything
```


#### ⚙️ Implementation Deep Dive: Step-by-Step Execution Flow


**Creating và Setting Values:**


```javascript
// Step 1: Map creation
const userCache = new Map();

/*
Browser Engine Steps:
1. Allocate memory cho Map instance
2. Initialize internal hash table (default 16 buckets)
3. Set size = 0
4. Initialize first/last entry pointers = null
*/

// Step 2: Setting first value
const user1 = { id: 1, name: "John" };
userCache.set(user1, { visits: 5, lastSeen: new Date() });

/*
Internal Process:
1. Calculate hash cho user1 object reference
2. Find appropriate bucket index
3. Create new entry node
4. Link vào insertion order chain
5. Increment size
6. Check load factor for potential resize
*/
```


**Key Comparison Deep Dive:**


```javascript
// SameValueZero algorithm examples
const map = new Map();

// Primitive comparisons
map.set(NaN, "Not a Number");
map.set(NaN, "Still Not a Number"); // Same key!
console.log(map.size); // 1, not 2

map.set(0, "zero");
map.set(-0, "negative zero"); // Same as 0 in SameValueZero
console.log(map.size); // Still 1

// Object comparisons - by reference
const obj1 = { a: 1 };
const obj2 = { a: 1 }; // Different object, same content
map.set(obj1, "first object");
map.set(obj2, "second object");
console.log(map.size); // 2 - different references
```


💭 **Common Misconception**: Nhiều engineers nghĩ rằng Map compares objects by value. Đây là sai lầm. Map sử dụng reference equality cho objects, value equality cho primitives.


#### 🏭 Production Reality: Map trong Real-world Applications


**Case Study 1: User Session Management tại NAB**


```javascript
// Problem: Track user sessions across multiple devices
// Traditional Object approach (problematic):
const sessions = {};
const user = { customerId: 12345, deviceId: "mobile_001" };
sessions[user] = { loginTime: Date.now(), transactions: [] };
// ❌ user becomes "[object Object]" string key

// Map solution:
class SessionManager {
  constructor() {
    this.activeSessions = new Map();
    this.sessionTimeout = 30 * 60 * 1000; // 30 minutes
  }

  createSession(userDevice, metadata) {
    // userDevice là object với customerId và deviceId
    const sessionData = {
      ...metadata,
      loginTime: Date.now(),
      lastActivity: Date.now(),
      transactions: []
    };

    this.activeSessions.set(userDevice, sessionData);

    // Cleanup expired sessions
    this.cleanupExpiredSessions();

    return sessionData;
  }

  updateActivity(userDevice) {
    const session = this.activeSessions.get(userDevice);
    if (session) {
      session.lastActivity = Date.now();
    }
  }

  cleanupExpiredSessions() {
    const now = Date.now();
    for (const [userDevice, session] of this.activeSessions) {
      if (now - session.lastActivity > this.sessionTimeout) {
        this.activeSessions.delete(userDevice);
        // Log session expiry cho audit trail
        console.log(`Session expired for customer ${userDevice.customerId}`);
      }
    }
  }

  getActiveSessionCount() {
    return this.activeSessions.size; // O(1) operation!
  }
}
```


**Performance Benefits Observable:**


- **Memory**: Reduced memory fragmentation so với Object approach
- **Speed**: O(1) lookups thay vì O(n) array searches
- **Maintenance**: Clear insertion order cho debugging


**Case Study 2: Component State Caching tại Figma**


```javascript
// Problem: Cache expensive calculations cho React components
// Traditional approach với WeakMap limitations

class ComponentCache {
  constructor() {
    // Sử dụng Map với component references làm keys
    this.computationCache = new Map();
    this.renderCache = new Map();
    this.maxCacheSize = 1000;
  }

  getCachedComputation(component, props, computeFn) {
    // Create composite key từ component + props
    const cacheKey = { component, propsHash: this.hashProps(props) };

    // Check cache first
    const cached = this.computationCache.get(cacheKey);
    if (cached && this.isValid(cached, props)) {
      return cached.result;
    }

    // Compute và cache
    const result = computeFn(props);
    this.computationCache.set(cacheKey, {
      result,
      timestamp: Date.now(),
      propsSnapshot: this.cloneProps(props)
    });

    // LRU eviction
    this.enforceMaxSize();

    return result;
  }

  hashProps(props) {
    // Custom hashing cho props object
    return JSON.stringify(props, Object.keys(props).sort());
  }

  enforceMaxSize() {
    if (this.computationCache.size > this.maxCacheSize) {
      // Remove oldest entries (FIFO)
      const iterator = this.computationCache.keys();
      let removeCount = this.computationCache.size - this.maxCacheSize;

      while (removeCount > 0) {
        const oldestKey = iterator.next().value;
        this.computationCache.delete(oldestKey);
        removeCount--;
      }
    }
  }
}
```


#### 🎯 Verification Checklist: Map Understanding


**✅ Basic Understanding Checkpoints:**


1. **Key Types**: Có thể explain được tại sao Map accept any key type?
2. **Reference vs Value**: Hiểu difference giữa object key comparison và primitive key comparison?
3. **Size Property**: Tại sao `map.size` efficient hơn `Object.keys(obj).length`?
4. **Insertion Order**: Map preserve insertion order như thế nào?


**✅ Intermediate Understanding:**


```javascript
// Challenge: Predict outputs
const quiz = new Map();

const key1 = { a: 1 };
const key2 = { a: 1 };
const key3 = key1;

quiz.set(key1, "first");
quiz.set(key2, "second");
quiz.set(key3, "third");

console.log(quiz.size); // ?
console.log(quiz.get(key1)); // ?
console.log(quiz.get(key2)); // ?
```


**Answer:** Size = 2, quiz.get(key1) = "third", quiz.get(key2) = "second"


**✅ Advanced Understanding:**


```javascript
// Memory leak detection
function detectMapMemoryLeaks(map) {
  const keysSnapshot = new Set();

  // Capture current keys
  for (const key of map.keys()) {
    if (typeof key === 'object') {
      keysSnapshot.add(new WeakRef(key));
    }
  }

  // Force garbage collection (in Node.js)
  if (global.gc) {
    global.gc();
  }

  // Check for orphaned references
  setTimeout(() => {
    let orphanedCount = 0;
    keysSnapshot.forEach(weakRef => {
      if (weakRef.deref() === undefined) {
        orphanedCount++;
      }
    });

    console.log(`Potential memory leaks: ${orphanedCount} orphaned keys`);
  }, 1000);
}
```


---


### 🔬 Chapter 2: Map Methods Deep Dive


#### 🌱 .set(key, value) - The Foundation Operation


**Bản Chất & Mechanism:**


```javascript
// .set() method deep dive
const performanceMap = new Map();

// Basic usage
performanceMap.set('cpu', 85.5);

// Chaining capability (returns Map instance)
performanceMap
  .set('memory', 67.2)
  .set('disk', 45.8)
  .set('network', 23.4);

// Advanced: Using objects as keys
const server1 = { id: 'prod-001', region: 'us-east' };
const server2 = { id: 'prod-002', region: 'eu-west' };

performanceMap
  .set(server1, { cpu: 92.1, memory: 78.5 })
  .set(server2, { cpu: 67.8, memory: 54.2 });
```


**Step-by-Step Execution Analysis:**


```javascript
// What happens internally khi call .set()
function mapSetInternals(map, key, value) {
  // Step 1: Hash calculation
  const hash = calculateHash(key); // SameValueZero-based

  // Step 2: Bucket location
  const bucketIndex = hash % map.buckets.length;

  // Step 3: Collision handling
  let entry = map.buckets[bucketIndex];

  while (entry) {
    if (sameValueZero(entry.key, key)) {
      // Key exists - update value
      entry.value = value;
      return map; // Early return, no size change
    }
    entry = entry.next;
  }

  // Step 4: New entry creation
  const newEntry = {
    key,
    value,
    hash,
    next: map.buckets[bucketIndex],
    prev: map.lastEntry,
    orderNext: null,
    orderPrev: map.lastEntry
  };

  // Step 5: Bucket linking
  map.buckets[bucketIndex] = newEntry;

  // Step 6: Order preservation
  if (map.lastEntry) {
    map.lastEntry.orderNext = newEntry;
  } else {
    map.firstEntry = newEntry;
  }
  map.lastEntry = newEntry;

  // Step 7: Size update và potential resize
  map.size++;
  if (map.size > map.buckets.length * 0.75) {
    resizeMap(map);
  }

  return map;
}
```


💭 **Principal's Insight**: Việc Map.set() returns `this` không phải là coincidence. Đây là intentional design cho method chaining, align với functional programming principles. Tại Webflow, chúng tôi leverage pattern này heavily:


```javascript
// Fluent API pattern với Map
const styleMap = new Map()
  .set('padding', '16px')
  .set('margin', '8px')
  .set('border', '1px solid #ccc')
  .set('borderRadius', '4px');

// Transform thành CSS
const cssString = Array.from(styleMap.entries())
  .map(([prop, value]) => `${prop}: ${value}`)
  .join('; ');
```


#### 🌱 .get(key) - Retrieval Mechanism


**Core Algorithm:**


```javascript
// .get() method internals
function mapGetInternals(map, key) {
  // Step 1: Hash calculation (same as set)
  const hash = calculateHash(key);

  // Step 2: Bucket lookup
  const bucketIndex = hash % map.buckets.length;
  let entry = map.buckets[bucketIndex];

  // Step 3: Linear probing in bucket
  while (entry) {
    if (sameValueZero(entry.key, key)) {
      return entry.value; // Found!
    }
    entry = entry.next;
  }

  // Step 4: Not found
  return undefined;
}
```


**Performance Characteristics:**


```javascript
// Performance comparison: Map vs Object
function performanceComparison() {
  const map = new Map();
  const obj = {};

  // Setup data
  const testData = Array.from({ length: 100000 }, (_, i) => ({
    key: `key_${i}`,
    value: `value_${i}`
  }));

  // Populate structures
  testData.forEach(({ key, value }) => {
    map.set(key, value);
    obj[key] = value;
  });

  // Benchmark lookups
  console.time('Map.get()');
  for (let i = 0; i < 1000000; i++) {
    map.get('key_50000');
  }
  console.timeEnd('Map.get()'); // ~2-3ms

  console.time('Object property access');
  for (let i = 0; i < 1000000; i++) {
    obj['key_50000'];
  }
  console.timeEnd('Object property access'); // ~1-2ms

  // Object slightly faster for string keys trong V8
  // Nhưng Map consistent across all key types
}
```


💭 **Real-world Debugging Story**: Tại Binance, chúng tôi có một performance issue với price lookup table. Initially sử dụng Object với symbol strings as keys. Performance was good cho mainstream symbols nhưng degraded dramatically với exotic trading pairs. Root cause: V8's hidden class optimization breaks với too many dynamic properties. Switching to Map provided consistent O(1) performance across all symbol types.


#### 🌱 .has(key) - Existence Check


**Why .has() over map.get(key) !== undefined?**


```javascript
// Subtle but important difference
const map = new Map();

// Case 1: Value is explicitly undefined
map.set('explicitUndefined', undefined);

// Problematic check:
if (map.get('explicitUndefined') !== undefined) {
  console.log('Key exists'); // Won't execute!
}

// Correct check:
if (map.has('explicitUndefined')) {
  console.log('Key exists'); // ✅ Executes correctly
}

// Case 2: Falsy values
map.set('zero', 0);
map.set('emptyString', '');
map.set('false', false);

// All these exist but would fail truthy check:
console.log(map.has('zero')); // true
console.log(map.has('emptyString')); // true
console.log(map.has('false')); // true
```


**Implementation Optimization:**


```javascript
// Optimized existence check
function optimizedHas(map, key) {
  // Same hashing và bucket lookup như .get()
  // Nhưng return ngay khi find key, không cần access value
  const hash = calculateHash(key);
  const bucketIndex = hash % map.buckets.length;
  let entry = map.buckets[bucketIndex];

  while (entry) {
    if (sameValueZero(entry.key, key)) {
      return true; // Early return, no value access
    }
    entry = entry.next;
  }

  return false;
}
```


#### 🌱 .delete(key) - Removal Logic


**Complex Internal Process:**


```javascript
// .delete() requires careful memory management
function mapDeleteInternals(map, key) {
  const hash = calculateHash(key);
  const bucketIndex = hash % map.buckets.length;
  let entry = map.buckets[bucketIndex];
  let prevEntry = null;

  // Step 1: Find entry in hash bucket
  while (entry) {
    if (sameValueZero(entry.key, key)) {
      // Found entry to delete

      // Step 2: Remove from hash bucket chain
      if (prevEntry) {
        prevEntry.next = entry.next;
      } else {
        map.buckets[bucketIndex] = entry.next;
      }

      // Step 3: Remove from insertion order chain
      if (entry.orderPrev) {
        entry.orderPrev.orderNext = entry.orderNext;
      } else {
        map.firstEntry = entry.orderNext;
      }

      if (entry.orderNext) {
        entry.orderNext.orderPrev = entry.orderPrev;
      } else {
        map.lastEntry = entry.orderPrev;
      }

      // Step 4: Cleanup và size update
      map.size--;

      // Step 5: Clear references for GC
      entry.key = null;
      entry.value = null;
      entry.next = null;
      entry.orderNext = null;
      entry.orderPrev = null;

      return true; // Successfully deleted
    }

    prevEntry = entry;
    entry = entry.next;
  }

  return false; // Key not found
}
```


**Memory Management Considerations:**


```javascript
// Proper cleanup pattern cho expensive resources
class ResourceMap extends Map {
  delete(key) {
    const resource = this.get(key);

    // Cleanup resource before deletion
    if (resource && typeof resource.cleanup === 'function') {
      resource.cleanup();
    }

    // Call parent delete
    return super.delete(key);
  }

  clear() {
    // Cleanup all resources
    for (const resource of this.values()) {
      if (resource && typeof resource.cleanup === 'function') {
        resource.cleanup();
      }
    }

    super.clear();
  }
}

// Usage với proper resource management
const fileHandles = new ResourceMap();

fileHandles.set('config', {
  handle: fs.openSync('config.json', 'r'),
  cleanup() {
    fs.closeSync(this.handle);
  }
});

// Automatic cleanup khi delete
fileHandles.delete('config'); // File handle closed automatically
```


#### 🎯 Method Chaining và Functional Patterns


**Advanced Chaining Patterns:**


```javascript
// Functional Map operations
class FunctionalMap extends Map {
  mapValues(fn) {
    const newMap = new FunctionalMap();
    for (const [key, value] of this) {
      newMap.set(key, fn(value, key, this));
    }
    return newMap;
  }

  filter(predicate) {
    const newMap = new FunctionalMap();
    for (const [key, value] of this) {
      if (predicate(value, key, this)) {
        newMap.set(key, value);
      }
    }
    return newMap;
  }

  reduce(fn, initialValue) {
    let accumulator = initialValue;
    for (const [key, value] of this) {
      accumulator = fn(accumulator, value, key, this);
    }
    return accumulator;
  }

  // Fluent conditional setting
  setIf(condition, key, value) {
    if (condition) {
      this.set(key, value);
    }
    return this;
  }
}

// Usage examples
const userMetrics = new FunctionalMap()
  .set('john', { sessions: 5, duration: 120 })
  .set('jane', { sessions: 3, duration: 95 })
  .set('bob', { sessions: 8, duration: 200 });

// Transform data functionally
const normalizedMetrics = userMetrics
  .filter(metrics => metrics.sessions > 3)
  .mapValues(metrics => ({
    ...metrics,
    avgDuration: metrics.duration / metrics.sessions
  }));

// Reduce to summary
const totalSessions = userMetrics.reduce(
  (sum, metrics) => sum + metrics.sessions,
  0
);
```


---


### 🔬 Chapter 3: Map Iteration - Preserving Order & Performance


#### 🌱 Insertion Order Preservation: The Hidden Complexity


**Why Insertion Order Matters:**


```javascript
// Real-world scenario: Form field validation order
const validationRules = new Map([
  ['email', { required: true, pattern: /@/, message: 'Valid email required' }],
  ['password', { required: true, minLength: 8, message: 'Password too short' }],
  ['confirmPassword', { required: true, match: 'password', message: 'Passwords must match' }],
  ['terms', { required: true, message: 'Must accept terms' }]
]);

// Validation must run in order (confirmPassword depends on password)
function validateForm(formData) {
  const errors = [];

  for (const [field, rule] of validationRules) {
    const value = formData[field];

    if (rule.required && !value) {
      errors.push({ field, message: rule.message });
      continue; // Skip further validation cho field này
    }

    if (rule.pattern && !rule.pattern.test(value)) {
      errors.push({ field, message: rule.message });
    }

    if (rule.minLength && value.length < rule.minLength) {
      errors.push({ field, message: rule.message });
    }

    if (rule.match && value !== formData[rule.match]) {
      errors.push({ field, message: rule.message });
    }
  }

  return errors;
}
```


💭 **Principal's Perspective**: Tại Webflow, form validation order critically important. Users expect logical error progression - not random validation messages. Map's insertion order guarantee allows us to define validation flow declaratively.


#### 🔬 Iteration Methods Deep Dive


**.keys(), .values(), .entries() - Iterator Protocol:**


```javascript
// Understanding Iterator internals
function exploreMapIterators() {
  const map = new Map([
    ['a', 1],
    ['b', 2],
    ['c', 3]
  ]);

  // .keys() returns MapIterator
  const keysIterator = map.keys();
  console.log(keysIterator); // MapIterator {}

  // Iterator protocol implementation
  console.log(keysIterator.next()); // { value: 'a', done: false }
  console.log(keysIterator.next()); // { value: 'b', done: false }
  console.log(keysIterator.next()); // { value: 'c', done: false }
  console.log(keysIterator.next()); // { value: undefined, done: true }

  // Iterator is one-time use
  console.log(keysIterator.next()); // { value: undefined, done: true }

  // Need new iterator for another pass
  const newKeysIterator = map.keys();
  for (const key of newKeysIterator) {
    console.log(key); // a, b, c
  }
}
```


**Performance Comparison - Iteration Methods:**


```javascript
// Benchmark different iteration approaches
function benchmarkMapIteration() {
  const largeMap = new Map();

  // Populate với 1M entries
  for (let i = 0; i < 1000000; i++) {
    largeMap.set(`key_${i}`, `value_${i}`);
  }

  // Method 1: for...of with entries (fastest)
  console.time('for...of entries');
  for (const [key, value] of largeMap) {
    // Process entry
  }
  console.timeEnd('for...of entries'); // ~50ms

  // Method 2: forEach (slightly slower)
  console.time('forEach');
  largeMap.forEach((value, key) => {
    // Process entry
  });
  console.timeEnd('forEach'); // ~60ms

  // Method 3: Manual iterator (slowest)
  console.time('manual iterator');
  const iterator = largeMap.entries();
  let result = iterator.next();
  while (!result.done) {
    const [key, value] = result.value;
    // Process entry
    result = iterator.next();
  }
  console.timeEnd('manual iterator'); // ~80ms

  // Method 4: Array conversion (memory intensive)
  console.time('Array.from + forEach');
  Array.from(largeMap.entries()).forEach(([key, value]) => {
    // Process entry
  });
  console.timeEnd('Array.from + forEach'); // ~120ms + memory overhead
}
```


#### 🌱 .forEach() Method - Callback Intricacies


**The Three Parameters Mystery:**


```javascript
// Why forEach có 3 parameters?
const map = new Map([
  ['user1', { name: 'John', age: 30 }],
  ['user2', { name: 'Jane', age: 25 }]
]);

map.forEach((value, key, mapReference) => {
  console.log('Value:', value);        // User object
  console.log('Key:', key);            // 'user1', 'user2'
  console.log('Map ref:', mapReference === map); // true

  // Third parameter useful cho conditional logic
  if (mapReference.size > 1) {
    console.log('Processing multiple users');
  }
});
```


**ForEach vs For...of Performance:**


```javascript
// Detailed performance analysis
class IterationBenchmark {
  constructor(size = 100000) {
    this.map = new Map();
    for (let i = 0; i < size; i++) {
      this.map.set(`key${i}`, { data: `value${i}`, index: i });
    }
  }

  benchmarkForEach() {
    const start = performance.now();

    this.map.forEach((value, key) => {
      // Simulate work
      const processed = value.data.toUpperCase();
    });

    return performance.now() - start;
  }

  benchmarkForOf() {
    const start = performance.now();

    for (const [key, value] of this.map) {
      // Same work
      const processed = value.data.toUpperCase();
    }

    return performance.now() - start;
  }

  runBenchmarks() {
    const forEachTime = this.benchmarkForEach();
    const forOfTime = this.benchmarkForOf();

    console.log(`forEach: ${forEachTime}ms`);
    console.log(`for...of: ${forOfTime}ms`);
    console.log(`Performance difference: ${Math.abs(forEachTime - forOfTime)}ms`);
  }
}

// Typical results: for...of marginally faster (5-10%)
// Reason: Less function call overhead
```


#### 🏭 Production Patterns: Advanced Iteration Techniques


**Pattern 1: Conditional Iteration với Early Exit**


```javascript
// Real scenario từ Figma: Finding first available layer
class LayerManager {
  constructor() {
    this.layers = new Map(); // Ordered by z-index
  }

  findFirstAvailableLayer(criteria) {
    // Can't use forEach cho early exit - need for...of
    for (const [layerId, layer] of this.layers) {
      if (this.matchesCriteria(layer, criteria)) {
        return { layerId, layer };
      }

      // Early exit cho performance
      if (layer.zIndex > criteria.maxZIndex) {
        break; // No point checking higher layers
      }
    }

    return null;
  }

  // Alternative: forEach with exception (anti-pattern)
  findFirstAvailableLayerWrong(criteria) {
    let found = null;

    try {
      this.layers.forEach((layer, layerId) => {
        if (this.matchesCriteria(layer, criteria)) {
          found = { layerId, layer };
          throw new Error('FOUND'); // Anti-pattern!
        }
      });
    } catch (e) {
      if (e.message !== 'FOUND') throw e;
    }

    return found;
  }
}
```


**Pattern 2: Parallel Processing với Map Chunks**


```javascript
// Scenario: Processing large datasets tại Binance
async function processMarketDataParallel(marketData) {
  const CHUNK_SIZE = 1000;
  const chunks = [];
  const entries = Array.from(marketData.entries());

  // Split Map into chunks
  for (let i = 0; i < entries.length; i += CHUNK_SIZE) {
    chunks.push(entries.slice(i, i + CHUNK_SIZE));
  }

  // Process chunks in parallel
  const results = await Promise.all(
    chunks.map(async (chunk, chunkIndex) => {
      const chunkMap = new Map(chunk);
      const chunkResults = new Map();

      for (const [symbol, data] of chunkMap) {
        const processed = await processSymbolData(symbol, data);
        chunkResults.set(symbol, processed);
      }

      return chunkResults;
    })
  );

  // Merge results maintaining order
  const finalResults = new Map();
  for (const chunkResult of results) {
    for (const [key, value] of chunkResult) {
      finalResults.set(key, value);
    }
  }

  return finalResults;
}
```


**Pattern 3: Streaming Iteration cho Large Maps**


```javascript
// Memory-efficient iteration cho very large Maps
class StreamingMapProcessor {
  constructor(map) {
    this.map = map;
    this.batchSize = 100;
  }

  async *processBatches() {
    let batch = [];
    let count = 0;

    for (const [key, value] of this.map) {
      batch.push([key, value]);
      count++;

      if (count === this.batchSize) {
        yield this.processBatch(batch);
        batch = [];
        count = 0;

        // Allow event loop to breathe
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }

    // Process remaining items
    if (batch.length > 0) {
      yield this.processBatch(batch);
    }
  }

  async processBatch(batch) {
    // Process batch of entries
    return batch.map(([key, value]) => ({
      key,
      value: this.transform(value)
    }));
  }

  transform(value) {
    // Expensive transformation
    return { ...value, processed: true, timestamp: Date.now() };
  }
}

// Usage
async function processLargeMap(largeMap) {
  const processor = new StreamingMapProcessor(largeMap);

  for await (const batch of processor.processBatches()) {
    console.log(`Processed batch of ${batch.length} items`);

    // Can save to database, send to API, etc.
    await saveBatchToDatabase(batch);
  }
}
```


---


### 🔬 Chapter 4: Object.entries() và Object.fromEntries() - The Bridge Between Worlds


#### 🌱 Nguồn Gốc: Bridging Object và Map Ecosystems


**Historical Context:**


Trước ES2019, việc convert Object ↔ Map rất cumbersome:


```javascript
// Pre-ES2019: Cumbersome conversion
function objectToMapOldWay(obj) {
  const map = new Map();
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      map.set(key, obj[key]);
    }
  }
  return map;
}

function mapToObjectOldWay(map) {
  const obj = {};
  for (const [key, value] of map) {
    obj[key] = value;
  }
  return obj;
}

// ES2019+: Clean conversions
const obj = { a: 1, b: 2, c: 3 };
const map = new Map(Object.entries(obj)); // Object → Map
const backToObj = Object.fromEntries(map); // Map → Object
```


💭 **Real-world Impact**: Tại NAB, chúng tôi had legacy APIs returning Objects nhưng needed Map benefits cho processing. Object.entries() made this seamless without breaking existing code.


#### 🔬 Object.entries() Deep Dive


**Internal Implementation Understanding:**


```javascript
// Object.entries() pseudo-implementation
function objectEntriesInternals(obj) {
  // Step 1: Convert to object nếu không phải object
  const O = Object(obj);

  // Step 2: Get own enumerable property names
  const keys = Object.keys(O);

  // Step 3: Create array of [key, value] pairs
  const entries = [];
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const value = O[key];
    entries.push([key, value]);
  }

  return entries;
}
```


**Property Enumeration Nuances:**


```javascript
// Understanding what gets included/excluded
const complexObject = {
  // Enumerable own properties ✅
  normalProp: 'included',
  anotherProp: 42,

  // Non-enumerable properties ❌
  get computed() { return 'computed value'; }
};

// Make property non-enumerable
Object.defineProperty(complexObject, 'hiddenProp', {
  value: 'secret',
  enumerable: false // Won't appear in Object.entries()
});

// Inherited properties ❌
const parent = { inherited: 'from parent' };
const child = Object.create(parent);
child.ownProp = 'child property';

console.log(Object.entries(complexObject));
// [['normalProp', 'included'], ['anotherProp', 42]]

console.log(Object.entries(child));
// [['ownProp', 'child property']] - không include inherited
```


**Performance Characteristics:**


```javascript
// Object.entries() performance analysis
function benchmarkObjectEntries() {
  // Small object
  const smallObj = { a: 1, b: 2, c: 3 };

  // Large object
  const largeObj = {};
  for (let i = 0; i < 100000; i++) {
    largeObj[`key${i}`] = `value${i}`;
  }

  // Benchmark small object
  console.time('Object.entries(small)');
  for (let i = 0; i < 1000000; i++) {
    Object.entries(smallObj);
  }
  console.timeEnd('Object.entries(small)'); // ~100ms

  // Benchmark large object
  console.time('Object.entries(large)');
  Object.entries(largeObj);
  console.timeEnd('Object.entries(large)'); // ~20ms

  // Key insight: Time complexity depends on property count, not iteration count
}
```


#### 🔬 Object.fromEntries() Deep Dive


**The Inverse Operation:**


```javascript
// Object.fromEntries() pseudo-implementation
function objectFromEntriesInternals(iterable) {
  // Step 1: Create new object
  const obj = {};

  // Step 2: Iterate through iterable
  for (const entry of iterable) {
    // Step 3: Validate entry structure
    if (typeof entry !== 'object' || entry === null) {
      throw new TypeError('Entry must be an object');
    }

    // Step 4: Extract key và value
    const key = String(entry[0]); // Keys always strings trong Objects
    const value = entry[1];

    // Step 5: Set property
    obj[key] = value;
  }

  return obj;
}
```


**Key Coercion Behavior:**


```javascript
// Understanding key conversion behavior
const entries = [
  ['stringKey', 'string value'],
  [42, 'number key becomes string'],
  [true, 'boolean key becomes string'],
  [Symbol('sym'), 'symbol key preserved'], // Special case!
  [null, 'null becomes "null"'],
  [undefined, 'undefined becomes "undefined"']
];

const obj = Object.fromEntries(entries);
console.log(obj);
/*
{
  "stringKey": "string value",
  "42": "number key becomes string",
  "true": "boolean key becomes string",
  [Symbol(sym)]: "symbol key preserved",
  "null": "null becomes \"null\"",
  "undefined": "undefined becomes \"undefined\""
}
*/

// Symbol keys special handling
console.log(Object.keys(obj)); // Không include Symbol keys
console.log(Object.getOwnPropertySymbols(obj)); // [Symbol(sym)]
```


#### 🏭 Production Patterns: Real-world Object ↔ Map Transformations


**Pattern 1: API Response Processing**


```javascript
// Scenario: Processing API responses tại Binance
class TradingDataProcessor {
  constructor() {
    this.symbolMap = new Map(); // Better performance cho lookups
  }

  processMarketData(apiResponse) {
    // API returns Object với symbol keys
    const rawData = {
      'BTC/USD': { price: 45000, volume: 1200.5, change: 2.5 },
      'ETH/USD': { price: 3200, volume: 850.2, change: -1.2 },
      'ADA/USD': { price: 1.25, volume: 450.8, change: 5.8 }
    };

    // Convert to Map cho efficient processing
    const dataMap = new Map(Object.entries(rawData));

    // Process với Map benefits
    const processedData = new Map();

    for (const [symbol, data] of dataMap) {
      const processed = {
        ...data,
        priceUSD: data.price,
        volumeUSD: data.price * data.volume,
        changePercent: data.change / 100,
        timestamp: Date.now()
      };

      processedData.set(symbol, processed);
    }

    // Convert back to Object cho API response
    return Object.fromEntries(processedData);
  }

  // Advanced: Nested object processing
  processNestedMarketData(nestedData) {
    return Object.fromEntries(
      Object.entries(nestedData).map(([market, data]) => [
        market,
        Object.fromEntries(
          Object.entries(data).map(([symbol, info]) => [
            symbol,
            this.enhanceSymbolInfo(info)
          ])
        )
      ])
    );
  }

  enhanceSymbolInfo(info) {
    // Add computed fields
    return {
      ...info,
      marketCap: info.price * info.circulatingSupply,
      volatility: this.calculateVolatility(info.priceHistory)
    };
  }
}
```


**Pattern 2: Configuration Management**


```javascript
// Scenario: Environment-specific config tại Webflow
class ConfigManager {
  constructor() {
    this.configMap = new Map();
    this.environmentOverrides = new Map();
  }

  loadConfiguration(baseConfig, environment = 'production') {
    // Base config từ Object
    const baseMap = new Map(Object.entries(baseConfig));

    // Environment overrides
    const envOverrides = this.getEnvironmentOverrides(environment);

    // Merge configurations (Map makes this elegant)
    const mergedConfig = new Map([
      ...baseMap,
      ...envOverrides
    ]);

    // Apply transformations
    const processedConfig = this.processConfigValues(mergedConfig);

    // Return as Object cho compatibility
    return Object.fromEntries(processedConfig);
  }

  processConfigValues(configMap) {
    const processed = new Map();

    for (const [key, value] of configMap) {
      let processedValue = value;

      // Environment variable substitution
      if (typeof value === 'string' && value.startsWith('$')) {
        processedValue = process.env[value.slice(1)] || value;
      }

      // Type coercion based on key patterns
      if (key.endsWith('_PORT') || key.endsWith('_TIMEOUT')) {
        processedValue = parseInt(processedValue, 10);
      }

      if (key.endsWith('_ENABLED') || key.endsWith('_DEBUG')) {
        processedValue = processedValue === 'true';
      }

      processed.set(key, processedValue);
    }

    return processed;
  }

  getEnvironmentOverrides(environment) {
    const overrides = {
      development: new Map([
        ['DEBUG_ENABLED', true],
        ['API_TIMEOUT', 5000],
        ['CACHE_TTL', 60]
      ]),
      staging: new Map([
        ['DEBUG_ENABLED', false],
        ['API_TIMEOUT', 3000],
        ['CACHE_TTL', 300]
      ]),
      production: new Map([
        ['DEBUG_ENABLED', false],
        ['API_TIMEOUT', 1000],
        ['CACHE_TTL', 3600]
      ])
    };

    return overrides[environment] || new Map();
  }
}
```


**Pattern 3: Data Transformation Pipelines**


```javascript
// Advanced transformation patterns
class DataTransformationPipeline {
  static transform(data) {
    return Object.fromEntries(
      Object.entries(data)
        .map(([key, value]) => this.transformEntry(key, value))
        .filter(([key, value]) => value !== undefined)
        .sort(([a], [b]) => a.localeCompare(b))
    );
  }

  static transformEntry(key, value) {
    // Normalize keys
    const normalizedKey = key
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');

    // Transform values based on type
    let transformedValue = value;

    if (Array.isArray(value)) {
      transformedValue = value.filter(Boolean);
    } else if (typeof value === 'object' && value !== null) {
      transformedValue = this.transform(value); // Recursive
    } else if (typeof value === 'string') {
      transformedValue = value.trim();
      if (transformedValue === '') {
        transformedValue = undefined; // Will be filtered out
      }
    }

    return [normalizedKey, transformedValue];
  }

  // Streaming version cho large datasets
  static async *transformStream(dataStream) {
    for await (const chunk of dataStream) {
      if (typeof chunk === 'object' && chunk !== null) {
        yield this.transform(chunk);
      }
    }
  }
}

// Usage với real data
const messyData = {
  'User Name!': 'John Doe',
  '  Email Address  ': 'john@example.com',
  'Phone#Number': '+1-555-0123',
  'empty_field': '',
  'Address Info': {
    'Street Name!!!': '123 Main St',
    'City   ': 'New York',
    'ZIP': '10001'
  },
  'Tags': ['important', '', 'customer', null, 'vip']
};

const cleanData = DataTransformationPipeline.transform(messyData);
console.log(cleanData);
/*
{
  address_info: {
    city: "New York",
    street_name: "123 Main St",
    zip: "10001"
  },
  email_address: "john@example.com",
  phone_number: "+1-555-0123",
  tags: ["important", "customer", "vip"],
  user_name: "John Doe"
}
*/
```


#### 🎯 Verification: Object ↔ Map Mastery


**Challenge 1: Predict the Output**


```javascript
const quiz = {
  a: 1,
  b: 2,
  [Symbol('hidden')]: 'secret'
};

Object.defineProperty(quiz, 'nonEnum', {
  value: 'invisible',
  enumerable: false
});

const map = new Map(Object.entries(quiz));
const backToObj = Object.fromEntries(map);

console.log(Object.keys(quiz));           // ?
console.log(map.size);                    // ?
console.log(Object.keys(backToObj));     // ?
console.log(quiz[Symbol.for('hidden')]);  // ?
```


**Answers:**


- `Object.keys(quiz)`: `['a', 'b']` (no Symbol, no non-enumerable)
- `map.size`: `2` (only enumerable string/number keys)
- `Object.keys(backToObj)`: `['a', 'b']` (Symbol lost trong conversion)
- `quiz[Symbol.for('hidden')]`: `undefined` (different Symbol)


**Challenge 2: Performance Optimization**


```javascript
// Optimize this function
function processLargeObject(obj) {
  const map = new Map(Object.entries(obj));
  const processed = new Map();

  for (const [key, value] of map) {
    if (typeof value === 'number' && value > 0) {
      processed.set(key, value * 2);
    }
  }

  return Object.fromEntries(processed);
}

// Your optimized version here...
```


**Optimal Solution:**


```javascript
function processLargeObjectOptimized(obj) {
  const result = {};

  // Direct Object iteration - no intermediate Map creation
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      if (typeof value === 'number' && value > 0) {
        result[key] = value * 2;
      }
    }
  }

  return result;
}

// Or functional approach
function processLargeObjectFunctional(obj) {
  return Object.fromEntries(
    Object.entries(obj)
      .filter(([key, value]) => typeof value === 'number' && value > 0)
      .map(([key, value]) => [key, value * 2])
  );
}
```


---


## 📖 PHẦN II: SENIOR LEVEL - SET VÀ ADVANCED PATTERNS


### 🔬 Chapter 5: Set - The Uniqueness Enforcer


#### 🌱 Nguồn Gốc & Motivation: Tại Sao Set Cần Thiết?


**Problem Statement - Array Limitations:**


Trước Set, unique collections required manual management:


```javascript
// Pre-Set: Manual uniqueness enforcement
function addUniqueItem(array, item) {
  if (array.indexOf(item) === -1) { // O(n) search!
    array.push(item);
  }
  return array;
}

function removeItem(array, item) {
  const index = array.indexOf(item); // Another O(n) search!
  if (index > -1) {
    array.splice(index, 1);
  }
  return array;
}

// Performance degrades với large arrays
const users = [];
for (let i = 0; i < 100000; i++) {
  addUniqueItem(users, `user_${i % 1000}`); // Lots of duplicates
}
// Time complexity: O(n²) - very slow!
```


💭 **Real Pain Point**: Tại Axon (evidence management), chúng tôi had arrays of officer IDs, evidence tags, case numbers. Manual uniqueness checking was killing performance với thousands of records.


**Problem 2: Semantic Clarity**


```javascript
// Intention unclear với Arrays
const uniqueUsers = []; // Is this supposed to be unique?
uniqueUsers.push('john');
uniqueUsers.push('jane');
uniqueUsers.push('john'); // Oops, duplicate! No protection

// Với Set, intention crystal clear
const uniqueUsers = new Set(); // Obviously enforces uniqueness
uniqueUsers.add('john');
uniqueUsers.add('jane');
uniqueUsers.add('john'); // Silently ignored - expected behavior
```


#### 🔬 Bản Chất & Mechanism: Set Internal Implementation


**Core Data Structure:**


```javascript
// Set pseudo-implementation
class InternalSet {
  constructor(iterable) {
    this.map = new Map(); // Set is implemented using Map!
    this.size = 0;

    if (iterable) {
      for (const value of iterable) {
        this.add(value);
      }
    }
  }

  add(value) {
    // Use value as both key và value trong internal Map
    if (!this.map.has(value)) {
      this.map.set(value, value);
      this.size++;
    }
    return this; // Chainable
  }

  has(value) {
    return this.map.has(value); // Delegate to Map's O(1) lookup
  }

  delete(value) {
    if (this.map.has(value)) {
      this.map.delete(value);
      this.size--;
      return true;
    }
    return false;
  }

  values() {
    return this.map.values(); // Same as keys() cho Set
  }

  keys() {
    return this.map.keys(); // Compatibility với Map API
  }

  entries() {
    // Returns [value, value] pairs cho Map compatibility
    return this.map.entries();
  }
}
```


💭 **Aha Moment**: When I discovered rằng Set is essentially Map với keys = values, everything clicked. The performance characteristics, API design, iteration behavior - all make perfect sense từ this perspective.


**SameValueZero Semantics:**


```javascript
// Understanding Set's equality rules
const set = new Set();

// NaN special case
set.add(NaN);
set.add(NaN);
console.log(set.size); // 1 - NaN equals itself trong Set

// Zero equality
set.add(0);
set.add(-0);
console.log(set.size); // 2 - 0 và -0 considered same value

// Object reference equality
const obj1 = { a: 1 };
const obj2 = { a: 1 }; // Same content, different objects
set.add(obj1);
set.add(obj2);
console.log(set.size); // 3 - different references, so both added

// String equality
set.add('hello');
set.add('hello');
console.log(set.size); // Still 3 - same string value
```


#### 💡 Intuitive Understanding: Set như Một Club Exclusive


**Real-world Analogy:**


Set giống như exclusive club với strict membership rules:


```javascript
// VIP Club membership
const vipClub = new Set();

// Add members
vipClub.add('John Doe');
vipClub.add('Jane Smith');
vipClub.add('John Doe'); // Already member - no duplicate entry

console.log(vipClub.size); // 2 members

// Check membership
console.log(vipClub.has('John Doe')); // true - is member

// Remove membership
vipClub.delete('Jane Smith');
console.log(vipClub.has('Jane Smith')); // false - no longer member

// Clear all memberships
vipClub.clear();
console.log(vipClub.size); // 0 - club disbanded
```


**Visual Metaphor:**


```
Array (Regular Container):
┌─────────────────────────────────┐
│ ['apple', 'banana', 'apple']    │
│  ↑ duplicate allowed            │
└─────────────────────────────────┘

Set (Unique Container):
┌─────────────────────────────────┐
│ {'apple', 'banana'}             │
│  ↑ duplicates automatically     │
│    removed                      │
└─────────────────────────────────┘
```


#### ⚙️ Implementation Deep Dive: Set Operations


**.add() Method Analysis:**


```javascript
// Step-by-step .add() execution
function setAddInternals(set, value) {
  // Step 1: Calculate hash cho value
  const hash = calculateHash(value);

  // Step 2: Check if value already exists
  const exists = set.internalMap.has(value);

  if (!exists) {
    // Step 3: Add to internal Map
    set.internalMap.set(value, value);

    // Step 4: Update size
    set.size++;

    // Step 5: Maintain insertion order (inherited từ Map)
    // No additional work needed - Map handles this
  }

  // Step 6: Return Set instance cho chaining
  return set;
}

// Performance characteristics
const perfTest = new Set();

console.time('Adding 1M unique items');
for (let i = 0; i < 1000000; i++) {
  perfTest.add(i);
}
console.timeEnd('Adding 1M unique items'); // ~150ms

console.time('Adding 1M duplicate items');
for (let i = 0; i < 1000000; i++) {
  perfTest.add(0); // Same value repeatedly
}
console.timeEnd('Adding 1M duplicate items'); // ~50ms (faster - early exit)
```


**.has() Method - The Performance Star:**


```javascript
// Array vs Set membership testing
function benchmarkMembershipTest() {
  const arrayData = [];
  const setData = new Set();

  // Populate với 10k items
  for (let i = 0; i < 10000; i++) {
    arrayData.push(`item_${i}`);
    setData.add(`item_${i}`);
  }

  const testItem = 'item_9999'; // Worst case - last item

  // Array approach - O(n)
  console.time('Array.includes()');
  for (let i = 0; i < 1000; i++) {
    arrayData.includes(testItem);
  }
  console.timeEnd('Array.includes()'); // ~40ms

  // Set approach - O(1)
  console.time('Set.has()');
  for (let i = 0; i < 1000; i++) {
    setData.has(testItem);
  }
  console.timeEnd('Set.has()'); // ~1ms

  // 40x performance improvement!
}
```


#### 🏭 Production Patterns: Advanced Set Usage


**Pattern 1: Real-time Duplicate Detection**


```javascript
// Scenario: Live transaction monitoring tại NAB
class TransactionDuplicateDetector {
  constructor() {
    this.recentTransactions = new Set();
    this.cleanupInterval = 5 * 60 * 1000; // 5 minutes
    this.maxEntries = 10000;

    // Periodic cleanup cho memory management
    setInterval(() => this.cleanup(), this.cleanupInterval);
  }

  isDuplicate(transaction) {
    // Create unique signature
    const signature = this.createTransactionSignature(transaction);

    // Check if signature already exists
    if (this.recentTransactions.has(signature)) {
      return true; // Potential duplicate!
    }

    // Add to tracking set
    this.recentTransactions.add(signature);

    // Prevent memory bloat
    if (this.recentTransactions.size > this.maxEntries) {
      this.enforceMaxSize();
    }

    return false;
  }

  createTransactionSignature(transaction) {
    // Combine relevant fields cho uniqueness check
    return [
      transaction.accountNumber,
      transaction.amount,
      transaction.merchantId,
      Math.floor(transaction.timestamp / 1000) // Round to second
    ].join('|');
  }

  cleanup() {
    // For production: more sophisticated LRU logic
    // For now: simple size limit
    if (this.recentTransactions.size > this.maxEntries * 0.8) {
      this.recentTransactions.clear();
      console.log('Transaction signature cache cleared');
    }
  }

  enforceMaxSize() {
    // Convert to Array, remove oldest, convert back
    const signatures = Array.from(this.recentTransactions);
    const keepCount = Math.floor(this.maxEntries * 0.7);
    const toKeep = signatures.slice(-keepCount);

    this.recentTransactions.clear();
    toKeep.forEach(sig => this.recentTransactions.add(sig));
  }
}
```


**Pattern 2: User Permission Caching**


```javascript
// Scenario: Permission checking tại Figma
class PermissionManager {
  constructor() {
    this.userPermissions = new Map(); // userId -> Set of permissions
    this.rolePermissions = new Map(); // roleId -> Set of permissions
    this.permissionCache = new Map(); // (userId, action) -> boolean
  }

  async hasPermission(userId, action) {
    // Check cache first
    const cacheKey = `${userId}:${action}`;
    if (this.permissionCache.has(cacheKey)) {
      return this.permissionCache.get(cacheKey);
    }

    // Calculate permission
    const hasAccess = await this.calculatePermission(userId, action);

    // Cache result
    this.permissionCache.set(cacheKey, hasAccess);

    return hasAccess;
  }

  async calculatePermission(userId, action) {
    // Get user's direct permissions
    const userPerms = this.userPermissions.get(userId) || new Set();

    if (userPerms.has(action)) {
      return true;
    }

    // Check role-based permissions
    const userRoles = await this.getUserRoles(userId);

    for (const roleId of userRoles) {
      const rolePerms = this.rolePermissions.get(roleId) || new Set();
      if (rolePerms.has(action)) {
        return true;
      }
    }

    return false;
  }

  grantUserPermission(userId, permission) {
    if (!this.userPermissions.has(userId)) {
      this.userPermissions.set(userId, new Set());
    }

    this.userPermissions.get(userId).add(permission);

    // Invalidate cache cho affected user
    this.invalidateUserCache(userId);
  }

  revokeUserPermission(userId, permission) {
    const userPerms = this.userPermissions.get(userId);
    if (userPerms) {
      userPerms.delete(permission);
      this.invalidateUserCache(userId);
    }
  }

  invalidateUserCache(userId) {
    // Remove all cache entries cho this user
    for (const cacheKey of this.permissionCache.keys()) {
      if (cacheKey.startsWith(`${userId}:`)) {
        this.permissionCache.delete(cacheKey);
      }
    }
  }

  // Bulk operations với Set advantages
  grantBulkPermissions(userId, permissions) {
    if (!this.userPermissions.has(userId)) {
      this.userPermissions.set(userId, new Set());
    }

    const userPerms = this.userPermissions.get(userId);

    // Add all permissions efficiently
    permissions.forEach(perm => userPerms.add(perm));

    this.invalidateUserCache(userId);
  }

  getUserPermissionSummary(userId) {
    const directPerms = this.userPermissions.get(userId) || new Set();

    // Combine với role permissions
    return {
      directPermissions: Array.from(directPerms),
      totalPermissionCount: directPerms.size,
      hasAdminAccess: directPerms.has('admin:full_access')
    };
  }
}
```


**Pattern 3: Event Deduplication**


```javascript
// Scenario: Real-time collaboration tại Figma
class EventDeduplicator {
  constructor(windowMs = 1000) {
    this.eventWindow = windowMs;
    this.recentEvents = new Map(); // eventType -> Set of event signatures
    this.cleanupInterval = Math.max(windowMs / 4, 100);

    setInterval(() => this.cleanup(), this.cleanupInterval);
  }

  shouldProcessEvent(eventType, eventData) {
    const signature = this.createEventSignature(eventData);

    if (!this.recentEvents.has(eventType)) {
      this.recentEvents.set(eventType, new Set());
    }

    const eventSet = this.recentEvents.get(eventType);

    if (eventSet.has(signature)) {
      return false; // Duplicate event
    }

    eventSet.add(signature);
    return true; // Process this event
  }

  createEventSignature(eventData) {
    // Create deterministic signature từ event data
    const relevantFields = [
      'userId',
      'objectId',
      'action',
      'timestamp'
    ];

    const signatureParts = relevantFields.map(field =>
      eventData[field] || 'null'
    );

    return signatureParts.join('|');
  }

  cleanup() {
    const cutoffTime = Date.now() - this.eventWindow;

    for (const [eventType, eventSet] of this.recentEvents) {
      // For this simple example, clear old events
      // Production version would track timestamps
      if (eventSet.size > 1000) { // Prevent memory bloat
        eventSet.clear();
      }
    }
  }

  // Advanced: Time-aware cleanup
  addTimestampedEvent(eventType, eventData, timestamp = Date.now()) {
    const signature = `${this.createEventSignature(eventData)}:${timestamp}`;

    if (!this.recentEvents.has(eventType)) {
      this.recentEvents.set(eventType, new Set());
    }

    this.recentEvents.get(eventType).add(signature);
  }

  cleanupWithTimestamps() {
    const cutoffTime = Date.now() - this.eventWindow;

    for (const [eventType, eventSet] of this.recentEvents) {
      const validEvents = new Set();

      for (const signature of eventSet) {
        const timestamp = parseInt(signature.split(':').pop());
        if (timestamp > cutoffTime) {
          validEvents.add(signature);
        }
      }

      this.recentEvents.set(eventType, validEvents);
    }
  }
}
```


---


### 🔬 Chapter 6: Set Iteration và Advanced Operations


#### 🌱 Iteration Methods: Values, Keys, Entries


**Why Set Has .keys() và .entries()?**


```javascript
// Set API consistency với Map
const set = new Set(['a', 'b', 'c']);

// All three return the same values!
console.log([...set.values()]); // ['a', 'b', 'c']
console.log([...set.keys()]);   // ['a', 'b', 'c'] - same as values!
console.log([...set.entries()]); // [['a','a'], ['b','b'], ['c','c']]

// Why this design? Map compatibility!
// Allows generic functions to work với both Map và Set
function processCollection(collection) {
  for (const [key, value] of collection.entries()) {
    console.log(`Key: ${key}, Value: ${value}`);
    // Works với both Map và Set!
  }
}

processCollection(new Map([['x', 1], ['y', 2]]));
// Key: x, Value: 1
// Key: y, Value: 2

processCollection(new Set(['a', 'b']));
// Key: a, Value: a
// Key: b, Value: b
```


💭 **Design Philosophy**: This design allows polymorphic code - same function can process Map hoặc Set without modification. Brilliant design decision by TC39 committee.


#### 🔬 Performance Analysis: Set vs Array Operations


**Membership Testing:**


```javascript
// Comprehensive performance comparison
class PerformanceBenchmark {
  constructor() {
    this.sizes = [100, 1000, 10000, 100000];
    this.results = new Map();
  }

  runBenchmarks() {
    for (const size of this.sizes) {
      this.benchmarkSize(size);
    }

    this.displayResults();
  }

  benchmarkSize(size) {
    // Setup data
    const arrayData = Array.from({ length: size }, (_, i) => `item_${i}`);
    const setData = new Set(arrayData);

    const testItem = `item_${size - 1}`; // Worst case - last item
    const iterations = 1000;

    // Array.includes() benchmark
    const arrayStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      arrayData.includes(testItem);
    }
    const arrayTime = performance.now() - arrayStart;

    // Set.has() benchmark
    const setStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      setData.has(testItem);
    }
    const setTime = performance.now() - setStart;

    this.results.set(size, {
      arrayTime,
      setTime,
      improvement: arrayTime / setTime
    });
  }

  displayResults() {
    console.table(this.results);
    /*
    Typical Results:
    ┌─────────┬───────────┬─────────┬─────────────┐
    │ Size    │ Array(ms) │ Set(ms) │ Improvement │
    ├─────────┼───────────┼─────────┼─────────────┤
    │ 100     │ 0.8       │ 0.1     │ 8x          │
    │ 1000    │ 4.2       │ 0.1     │ 42x         │
    │ 10000   │ 38.5      │ 0.1     │ 385x        │
    │ 100000  │ 380.2     │ 0.1     │ 3802x       │
    └─────────┴───────────┴─────────┴─────────────┘
    */
  }
}
```


**Add/Remove Operations:**


```javascript
// Dynamic modification performance
function benchmarkModifications() {
  const arrayData = [];
  const setData = new Set();

  // Adding unique items
  console.time('Array: Adding 10k unique items');
  for (let i = 0; i < 10000; i++) {
    if (!arrayData.includes(i)) { // O(n) check every time!
      arrayData.push(i);
    }
  }
  console.timeEnd('Array: Adding 10k unique items'); // ~500ms

  console.time('Set: Adding 10k unique items');
  for (let i = 0; i < 10000; i++) {
    setData.add(i); // O(1) operation
  }
  console.timeEnd('Set: Adding 10k unique items'); // ~5ms

  // Removing items
  console.time('Array: Removing 1k items');
  for (let i = 0; i < 1000; i++) {
    const index = arrayData.indexOf(i);
    if (index > -1) {
      arrayData.splice(index, 1);
    }
  }
  console.timeEnd('Array: Removing 1k items'); // ~50ms

  console.time('Set: Removing 1k items');
  for (let i = 0; i < 1000; i++) {
    setData.delete(i);
  }
  console.timeEnd('Set: Removing 1k items'); // ~1ms
}
```


#### 🏭 Advanced Set Operations: Union, Intersection, Difference


**Mathematical Set Operations:**


```javascript
// Set operations implementation
class SetOperations {
  // Union: A ∪ B (all elements trong either set)
  static union(setA, setB) {
    return new Set([...setA, ...setB]);
  }

  // Intersection: A ∩ B (elements trong both sets)
  static intersection(setA, setB) {
    return new Set([...setA].filter(x => setB.has(x)));
  }

  // Difference: A - B (elements trong A but not trong B)
  static difference(setA, setB) {
    return new Set([...setA].filter(x => !setB.has(x)));
  }

  // Symmetric Difference: A Δ B (elements trong either A hoặc B, but not both)
  static symmetricDifference(setA, setB) {
    const diff1 = this.difference(setA, setB);
    const diff2 = this.difference(setB, setA);
    return this.union(diff1, diff2);
  }

  // Subset check: A ⊆ B (all elements của A are trong B)
  static isSubset(setA, setB) {
    return [...setA].every(x => setB.has(x));
  }

  // Superset check: A ⊇ B (A contains all elements của B)
  static isSuperset(setA, setB) {
    return this.isSubset(setB, setA);
  }

  // Disjoint check: A ∩ B = ∅ (no common elements)
  static isDisjoint(setA, setB) {
    return [...setA].every(x => !setB.has(x));
  }

  // Optimized operations cho large sets
  static intersectionOptimized(setA, setB) {
    // Always iterate over smaller set
    const [smaller, larger] = setA.size <= setB.size ?
      [setA, setB] : [setB, setA];

    return new Set([...smaller].filter(x => larger.has(x)));
  }

  // Cartesian Product: A × B
  static cartesianProduct(setA, setB) {
    const result = new Set();
    for (const a of setA) {
      for (const b of setB) {
        result.add([a, b]);
      }
    }
    return result;
  }
}
```


**Real-world Application: User Role Management**


```javascript
// Scenario: Complex permission system tại Webflow
class UserRoleManager {
  constructor() {
    this.userRoles = new Map(); // userId -> Set of roles
    this.rolePermissions = new Map(); // roleId -> Set of permissions
    this.roleHierarchy = new Map(); // roleId -> Set of parent roles
  }

  assignRole(userId, roleId) {
    if (!this.userRoles.has(userId)) {
      this.userRoles.set(userId, new Set());
    }
    this.userRoles.get(userId).add(roleId);
  }

  removeRole(userId, roleId) {
    const userRoles = this.userRoles.get(userId);
    if (userRoles) {
      userRoles.delete(roleId);
    }
  }

  // Get all effective permissions cho user
  getUserPermissions(userId) {
    const userRoles = this.userRoles.get(userId) || new Set();
    let allPermissions = new Set();

    for (const roleId of userRoles) {
      // Direct role permissions
      const rolePerms = this.rolePermissions.get(roleId) || new Set();
      allPermissions = SetOperations.union(allPermissions, rolePerms);

      // Inherited permissions từ parent roles
      const inheritedPerms = this.getInheritedPermissions(roleId);
      allPermissions = SetOperations.union(allPermissions, inheritedPerms);
    }

    return allPermissions;
  }

  getInheritedPermissions(roleId) {
    const visited = new Set();
    const inherited = new Set();

    const traverse = (currentRole) => {
      if (visited.has(currentRole)) {
        return; // Prevent cycles
      }
      visited.add(currentRole);

      const parentRoles = this.roleHierarchy.get(currentRole) || new Set();
      for (const parentRole of parentRoles) {
        const parentPerms = this.rolePermissions.get(parentRole) || new Set();
        parentPerms.forEach(perm => inherited.add(perm));

        traverse(parentRole); // Recursive inheritance
      }
    };

    traverse(roleId);
    return inherited;
  }

  // Find users với specific permission
  findUsersWithPermission(permission) {
    const usersWithPermission = new Set();

    for (const [userId, userRoles] of this.userRoles) {
      const userPermissions = this.getUserPermissions(userId);
      if (userPermissions.has(permission)) {
        usersWithPermission.add(userId);
      }
    }

    return usersWithPermission;
  }

  // Find common permissions giữa users
  findCommonPermissions(userIds) {
    if (userIds.length === 0) return new Set();

    let commonPermissions = this.getUserPermissions(userIds[0]);

    for (let i = 1; i < userIds.length; i++) {
      const userPermissions = this.getUserPermissions(userIds[i]);
      commonPermissions = SetOperations.intersection(
        commonPermissions,
        userPermissions
      );
    }

    return commonPermissions;
  }

  // Audit: Find permission conflicts
  findRoleConflicts() {
    const conflicts = [];
    const allRoles = Array.from(this.rolePermissions.keys());

    for (let i = 0; i < allRoles.length; i++) {
      for (let j = i + 1; j < allRoles.length; j++) {
        const role1 = allRoles[i];
        const role2 = allRoles[j];

        const perms1 = this.rolePermissions.get(role1) || new Set();
        const perms2 = this.rolePermissions.get(role2) || new Set();

        // Check for conflicting permissions
        const conflictingPerms = this.findConflictingPermissions(perms1, perms2);

        if (conflictingPerms.size > 0) {
          conflicts.push({
            role1,
            role2,
            conflicts: Array.from(conflictingPerms)
          });
        }
      }
    }

    return conflicts;
  }

  findConflictingPermissions(perms1, perms2) {
    const conflicts = new Set();

    for (const perm1 of perms1) {
      for (const perm2 of perms2) {
        if (this.arePermissionsConflicting(perm1, perm2)) {
          conflicts.add(`${perm1} vs ${perm2}`);
        }
      }
    }

    return conflicts;
  }

  arePermissionsConflicting(perm1, perm2) {
    // Example: read_only conflicts với write_access
    const conflictPairs = [
      ['read_only', 'write_access'],
      ['user_access', 'admin_access'],
      ['limited_access', 'full_access']
    ];

    return conflictPairs.some(([p1, p2]) =>
      (perm1.includes(p1) && perm2.includes(p2)) ||
      (perm1.includes(p2) && perm2.includes(p1))
    );
  }
}
```


#### 🎯 Set Mastery Challenges


**Challenge 1: Unique Array Elements Filter**


```javascript
// Implement unique() function using Set
function unique(arr) {
  // Your implementation here
  // Should handle various data types correctly
}

// Test cases
console.log(unique([1, 2, 2, 3, 1])); // [1, 2, 3]
console.log(unique(['a', 'b', 'a', 'c'])); // ['a', 'b', 'c']
console.log(unique([NaN, NaN, 1, 1])); // [NaN, 1]

// Edge cases
console.log(unique([])); // []
console.log(unique([undefined, null, undefined])); // [undefined, null]
```


**Optimal Solution:**


```javascript
function unique(arr) {
  return Array.from(new Set(arr));
}

// Alternative functional approach
const unique = arr => [...new Set(arr)];

// Performance comparison
function uniqueOldWay(arr) {
  return arr.filter((item, index) => arr.indexOf(item) === index);
}

// Benchmark
const largeArray = Array.from({ length: 10000 }, (_, i) => i % 1000);

console.time('Set approach');
unique(largeArray);
console.timeEnd('Set approach'); // ~5ms

console.time('indexOf approach');
uniqueOldWay(largeArray);
console.timeEnd('indexOf approach'); // ~50ms
```


**Challenge 2: Anagram Detection**


```javascript
// Group anagrams using Map và Set principles
function groupAnagrams(words) {
  // Your implementation here
  // Should group words that are anagrams of each other
}

const words = ['eat', 'tea', 'tan', 'ate', 'nat', 'bat'];
console.log(groupAnagrams(words));
// Expected: [['eat', 'tea', 'ate'], ['tan', 'nat'], ['bat']]
```


**Solution với Set Integration:**


```javascript
function groupAnagrams(words) {
  const anagramGroups = new Map();

  for (const word of words) {
    // Create canonical form (sorted letters)
    const canonical = word.toLowerCase().split('').sort().join('');

    if (!anagramGroups.has(canonical)) {
      anagramGroups.set(canonical, new Set());
    }

    anagramGroups.get(canonical).add(word);
  }

  // Convert Sets back to Arrays
  return Array.from(anagramGroups.values())
    .map(set => Array.from(set));
}

// Advanced version với length optimization
function groupAnagramsOptimized(words) {
  // Group by length first (performance optimization)
  const lengthGroups = new Map();

  for (const word of words) {
    const length = word.length;
    if (!lengthGroups.has(length)) {
      lengthGroups.set(length, []);
    }
    lengthGroups.get(length).push(word);
  }

  const result = [];

  for (const sameLength of lengthGroups.values()) {
    const anagramGroups = new Map();

    for (const word of sameLength) {
      const canonical = word.toLowerCase().split('').sort().join('');

      if (!anagramGroups.has(canonical)) {
        anagramGroups.set(canonical, new Set());
      }

      anagramGroups.get(canonical).add(word);
    }

    for (const group of anagramGroups.values()) {
      result.push(Array.from(group));
    }
  }

  return result;
}
```


---


## 📖 PHẦN III: PRINCIPAL LEVEL - ADVANCED PATTERNS VÀ ARCHITECTURAL CONSIDERATIONS


### 🔬 Chapter 7: WeakMap và WeakSet - Memory Management Masters


#### 🌱 Nguồn Gốc: Solving Memory Leak Problems


**The Memory Leak Problem:**


```javascript
// Classic memory leak scenario
const cache = new Map();

class DataProcessor {
  process(domElement) {
    // Cache computation results
    cache.set(domElement, this.expensiveComputation(domElement));

    // Problem: Nếu domElement removed from DOM,
    // nó vẫn referenced trong cache!
    // Memory leak: DOM node can't be garbage collected
  }

  expensiveComputation(element) {
    // Simulate expensive operation
    return { result: Math.random(), timestamp: Date.now() };
  }
}

// Usage
const processor = new DataProcessor();
const button = document.createElement('button');

processor.process(button);

// Later: button removed from DOM
document.body.removeChild(button);

// But button still referenced trong cache!
// Memory leak! 💥
```


💭 **Real Experience**: Tại Figma, chúng tôi had a massive memory leak. Users reported browser crashes after extended editing sessions. Root cause: caching computational results with DOM elements as keys trong regular Map. Switching to WeakMap fixed the leak immediately.


#### 🔬 WeakMap Mechanics: Weak References Explained


**Core Concept:**


```javascript
// WeakMap holds "weak" references to keys
const weakCache = new WeakMap();

class SafeDataProcessor {
  process(domElement) {
    // WeakMap allows garbage collection của key
    weakCache.set(domElement, this.expensiveComputation(domElement));

    // When domElement has no other references,
    // it can be garbage collected
    // WeakMap entry automatically removed!
  }

  getResult(domElement) {
    return weakCache.get(domElement);
  }

  expensiveComputation(element) {
    return {
      result: Math.random(),
      timestamp: Date.now(),
      elementType: element.tagName
    };
  }
}

// Memory-safe usage
const safeProcessor = new SafeDataProcessor();
let button = document.createElement('button');

safeProcessor.process(button);
console.log(safeProcessor.getResult(button)); // Works

// Remove reference
button = null;

// Browser can now garbage collect the button
// WeakMap entry automatically cleaned up! ✅
```


**Limitations by Design:**


```javascript
// WeakMap restrictions (for good reasons!)
const wm = new WeakMap();

// ✅ Object keys only
const obj = {};
wm.set(obj, 'value');

// ❌ Primitive keys not allowed
try {
  wm.set('string', 'value');
} catch (e) {
  console.log(e.message); // Invalid value used as weak map key
}

try {
  wm.set(123, 'value');
} catch (e) {
  console.log(e.message); // Invalid value used as weak map key
}

// ❌ Not enumerable - can't iterate
console.log(wm.size); // undefined
console.log([...wm]); // TypeError: WeakMap is not iterable

// Why? Enumeration would prevent garbage collection!
// If you could list keys, they'd have to stay alive
```


#### 🏭 Production Patterns: WeakMap Applications


**Pattern 1: Private Data Storage**


```javascript
// Before WeakMap: Ugly private data patterns
function OldStylePrivateData() {
  // Closure approach - works but verbose
  let _privateData = new Map();

  return class Component {
    constructor(id) {
      _privateData.set(this, { id, internal: 'secret' });
    }

    getPublicId() {
      return _privateData.get(this).id;
    }

    destroy() {
      _privateData.delete(this); // Manual cleanup required!
    }
  };
}

// With WeakMap: Clean và automatic cleanup
const _private = new WeakMap();

class Component {
  constructor(id) {
    _private.set(this, {
      id,
      internal: 'secret',
      createdAt: Date.now(),
      apiKey: this.generateApiKey()
    });
  }

  getPublicId() {
    return _private.get(this).id;
  }

  getInternalData() {
    return _private.get(this);
  }

  generateApiKey() {
    return Math.random().toString(36).substring(2, 15);
  }

  // No explicit cleanup needed!
  // When Component instance destroyed, private data automatically cleaned
}

// Usage
let comp = new Component('user-123');
console.log(comp.getPublicId()); // 'user-123'
console.log(comp.getInternalData()); // { id: 'user-123', internal: 'secret', ... }

// Destroy reference
comp = null; // Private data automatically garbage collected! ✅
```


**Pattern 2: Memoization với Automatic Cleanup**


```javascript
// Smart memoization that doesn't leak memory
class SmartMemoizer {
  constructor() {
    this.cache = new WeakMap();
  }

  memoize(fn) {
    return (obj, ...args) => {
      // Use object parameter as WeakMap key
      if (!this.cache.has(obj)) {
        this.cache.set(obj, new Map());
      }

      const objCache = this.cache.get(obj);
      const key = JSON.stringify(args);

      if (objCache.has(key)) {
        return objCache.get(key);
      }

      const result = fn(obj, ...args);
      objCache.set(key, result);

      return result;
    };
  }
}

// Real-world example: DOM element styling calculations
const styler = new SmartMemoizer();

const calculateLayout = styler.memoize((element, width, height) => {
  // Expensive layout calculation
  console.log('Computing layout...'); // Only logs on cache miss

  return {
    width,
    height,
    aspectRatio: width / height,
    area: width * height,
    diagonal: Math.sqrt(width * width + height * height)
  };
});

// Usage
const div1 = document.createElement('div');
const div2 = document.createElement('div');

// First calls - cache miss
console.log(calculateLayout(div1, 100, 200)); // "Computing layout..."
console.log(calculateLayout(div2, 150, 300)); // "Computing layout..."

// Subsequent calls - cache hit
console.log(calculateLayout(div1, 100, 200)); // No "Computing layout..." log
console.log(calculateLayout(div2, 150, 300)); // No "Computing layout..." log

// When div1 removed từ DOM và no longer referenced:
// div1 = null;
// Its cache entry automatically cleaned up! 🎉
```


**Pattern 3: Component Lifecycle Tracking**


```javascript
// Tracking component lifecycle tại React/Figma apps
class ComponentLifecycleTracker {
  constructor() {
    this.componentData = new WeakMap();
    this.lifecycleStats = {
      created: 0,
      destroyed: 0,
      currentActive: 0
    };
  }

  trackComponent(component) {
    this.componentData.set(component, {
      createdAt: Date.now(),
      rendersCount: 0,
      lastRenderTime: null,
      performanceMetrics: new Map()
    });

    this.lifecycleStats.created++;
    this.lifecycleStats.currentActive++;

    // Setup automatic cleanup detection
    this.setupCleanupDetection(component);
  }

  recordRender(component, renderTime) {
    const data = this.componentData.get(component);
    if (data) {
      data.rendersCount++;
      data.lastRenderTime = Date.now();
      data.performanceMetrics.set('lastRenderDuration', renderTime);
    }
  }

  recordMetric(component, metricName, value) {
    const data = this.componentData.get(component);
    if (data) {
      data.performanceMetrics.set(metricName, value);
    }
  }

  getComponentStats(component) {
    const data = this.componentData.get(component);
    if (!data) return null;

    return {
      age: Date.now() - data.createdAt,
      rendersCount: data.rendersCount,
      lastRenderTime: data.lastRenderTime,
      averageRenderTime: this.calculateAverageRenderTime(data),
      memoryEfficient: true // Thanks to WeakMap!
    };
  }

  calculateAverageRenderTime(data) {
    const renderTimes = [];
    for (const [key, value] of data.performanceMetrics) {
      if (key.includes('renderDuration')) {
        renderTimes.push(value);
      }
    }

    return renderTimes.length > 0
      ? renderTimes.reduce((a, b) => a + b) / renderTimes.length
      : 0;
  }

  setupCleanupDetection(component) {
    // Use FinalizationRegistry cho cleanup detection (advanced)
    if (typeof FinalizationRegistry !== 'undefined') {
      const registry = new FinalizationRegistry((heldValue) => {
        this.lifecycleStats.destroyed++;
        this.lifecycleStats.currentActive--;
        console.log(`Component ${heldValue} was garbage collected`);
      });

      registry.register(component, component.constructor.name);
    }
  }

  getGlobalStats() {
    return { ...this.lifecycleStats };
  }
}

// Usage trong React-like environment
const tracker = new ComponentLifecycleTracker();

class MyComponent {
  constructor(props) {
    this.props = props;
    tracker.trackComponent(this);
  }

  render() {
    const start = performance.now();

    // Simulate render work
    const result = this.actualRender();

    const end = performance.now();
    tracker.recordRender(this, end - start);

    return result;
  }

  actualRender() {
    return `<div>Component with ${this.props.data.length} items</div>`;
  }
}

// Component lifecycle
let comp1 = new MyComponent({ data: [1, 2, 3] });
let comp2 = new MyComponent({ data: [4, 5, 6, 7, 8] });

comp1.render();
comp2.render();

console.log(tracker.getComponentStats(comp1));
console.log(tracker.getGlobalStats());

// Components destroyed
comp1 = null;
comp2 = null;

// WeakMap entries automatically cleaned up!
// No memory leaks! 🎉
```


#### 🔬 WeakSet: The Uniqueness Guardian


**Basic WeakSet Mechanics:**


```javascript
// WeakSet: Set với weak references
const processedElements = new WeakSet();

class ElementProcessor {
  process(element) {
    if (processedElements.has(element)) {
      console.log('Element already processed');
      return;
    }

    // Mark as processed
    processedElements.add(element);

    // Do expensive processing
    this.doExpensiveWork(element);
  }

  doExpensiveWork(element) {
    console.log(`Processing ${element.tagName}...`);
    // Simulate work
  }
}

const processor = new ElementProcessor();
const button = document.createElement('button');

processor.process(button); // "Processing BUTTON..."
processor.process(button); // "Element already processed"

// Later: button removed
// processedElements entry automatically cleaned up! ✅
```


**Advanced Pattern: Visited Nodes Tracking**


```javascript
// Tree traversal với automatic cleanup
class DOMTreeWalker {
  constructor() {
    this.visited = new WeakSet();
    this.processing = new WeakSet();
  }

  async walkTree(rootNode, processor) {
    if (this.processing.has(rootNode)) {
      throw new Error('Circular processing detected!');
    }

    if (this.visited.has(rootNode)) {
      return; // Already processed
    }

    this.processing.add(rootNode);

    try {
      // Process current node
      await processor(rootNode);
      this.visited.add(rootNode);

      // Process children
      for (const child of rootNode.children || []) {
        await this.walkTree(child, processor);
      }
    } finally {
      this.processing.delete(rootNode);
    }
  }

  isVisited(node) {
    return this.visited.has(node);
  }

  isProcessing(node) {
    return this.processing.has(node);
  }
}

// Usage
const walker = new DOMTreeWalker();

async function processNode(node) {
  console.log(`Processing: ${node.tagName}`);

  // Simulate async work
  await new Promise(resolve => setTimeout(resolve, 10));
}

// Walk document tree
await walker.walkTree(document.body, processNode);

// All tracking data automatically cleaned when nodes removed from DOM! 🎉
```


#### 🎯 WeakMap/WeakSet Mastery Verification


**Challenge: Memory-Safe Cache Implementation**


```javascript
// Implement a cache that doesn't cause memory leaks
class MemorySafeCache {
  // Your implementation here
  // Requirements:
  // 1. Cache computed values
  // 2. Automatically clean up when objects are GC'd
  // 3. Support both get/set operations
  // 4. Handle edge cases gracefully
}

// Test cases
const cache = new MemorySafeCache();
let obj1 = { id: 1 };
let obj2 = { id: 2 };

// Should work normally
cache.set(obj1, 'value1');
cache.set(obj2, 'value2');

console.log(cache.get(obj1)); // 'value1'
console.log(cache.get(obj2)); // 'value2'

// After objects are dereferenced, cache should not prevent GC
obj1 = null;
obj2 = null;

// Cache entries should be automatically cleaned up
```


**Solution:**


```javascript
class MemorySafeCache {
  constructor() {
    this.cache = new WeakMap();
  }

  set(key, value) {
    if (typeof key !== 'object' || key === null) {
      throw new TypeError('Cache key must be an object');
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });

    return this;
  }

  get(key) {
    const entry = this.cache.get(key);
    return entry ? entry.value : undefined;
  }

  has(key) {
    return this.cache.has(key);
  }

  delete(key) {
    return this.cache.delete(key);
  }

  // Advanced: TTL support
  setWithTTL(key, value, ttlMs) {
    this.set(key, value);

    setTimeout(() => {
      if (this.has(key)) {
        const entry = this.cache.get(key);
        if (entry && Date.now() - entry.timestamp >= ttlMs) {
          this.delete(key);
        }
      }
    }, ttlMs);

    return this;
  }

  getWithTTLCheck(key, ttlMs) {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    if (Date.now() - entry.timestamp >= ttlMs) {
      this.delete(key);
      return undefined;
    }

    return entry.value;
  }
}
```


---


### 🔬 Chapter 8: Performance Optimization Strategies


#### 🌱 Memory Management Best Practices


**Memory Profiling Setup:**


```javascript
// Comprehensive memory monitoring
class MemoryMonitor {
  constructor() {
    this.snapshots = [];
    this.leakDetection = new Map();
    this.gcObserver = null;

    this.setupGCObserver();
  }

  setupGCObserver() {
    // Monitor garbage collection events
    if (typeof PerformanceObserver !== 'undefined') {
      this.gcObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'measure' && entry.name.includes('gc')) {
            this.recordGCEvent(entry);
          }
        }
      });

      try {
        this.gcObserver.observe({ entryTypes: ['measure'] });
      } catch (e) {
        console.warn('GC observation not supported');
      }
    }
  }

  recordGCEvent(gcEntry) {
    console.log(`GC Event: ${gcEntry.name}, Duration: ${gcEntry.duration}ms`);
  }

  takeSnapshot(label = '') {
    const snapshot = {
      label,
      timestamp: Date.now(),
      memory: this.getMemoryInfo(),
      heap: this.getHeapInfo()
    };

    this.snapshots.push(snapshot);
    return snapshot;
  }

  getMemoryInfo() {
    if (performance.memory) {
      return {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      };
    }

    return { used: 0, total: 0, limit: 0 };
  }

  getHeapInfo() {
    // Advanced heap analysis (requires Chrome DevTools)
    return {
      // Would integrate với heap snapshot APIs trong production
      approximateObjects: this.estimateObjectCount(),
      leakSuspects: this.findLeakSuspects()
    };
  }

  estimateObjectCount() {
    // Rough estimation based on memory usage
    const memory = this.getMemoryInfo();
    return Math.floor(memory.used / 100); // Very rough estimate
  }

  findLeakSuspects() {
    const suspects = [];

    // Analyze growth patterns
    if (this.snapshots.length >= 2) {
      const recent = this.snapshots[this.snapshots.length - 1];
      const previous = this.snapshots[this.snapshots.length - 2];

      const growth = recent.memory.used - previous.memory.used;
      if (growth > 1024 * 1024) { // >1MB growth
        suspects.push({
          type: 'rapid_growth',
          growth: growth,
          timespan: recent.timestamp - previous.timestamp
        });
      }
    }

    return suspects;
  }

  detectLeaks(objectTracker) {
    // Track object creation/destruction patterns
    const currentCount = objectTracker.getLivingObjectCount();
    const lastCount = this.leakDetection.get(objectTracker) || 0;

    if (currentCount > lastCount * 1.5) { // 50% increase
      console.warn(`Potential leak detected in ${objectTracker.name}`);
    }

    this.leakDetection.set(objectTracker, currentCount);
  }

  generateReport() {
    return {
      totalSnapshots: this.snapshots.length,
      memoryTrend: this.calculateMemoryTrend(),
      recommendations: this.generateRecommendations()
    };
  }

  calculateMemoryTrend() {
    if (this.snapshots.length < 2) return 'insufficient_data';

    const first = this.snapshots[0];
    const last = this.snapshots[this.snapshots.length - 1];

    const growth = last.memory.used - first.memory.used;
    const timespan = last.timestamp - first.timestamp;
    const growthRate = growth / timespan; // bytes per ms

    if (growthRate > 1000) return 'high_growth'; // >1KB/ms
    if (growthRate > 100) return 'moderate_growth';
    return 'stable';
  }

  generateRecommendations() {
    const recommendations = [];
    const trend = this.calculateMemoryTrend();

    if (trend === 'high_growth') {
      recommendations.push('Check for memory leaks');
      recommendations.push('Consider using WeakMap/WeakSet');
      recommendations.push('Implement object pooling');
    }

    return recommendations;
  }
}
```


**Object Pool Implementation:**


```javascript
// High-performance object pooling
class ObjectPool {
  constructor(createFn, resetFn, initialSize = 10) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    this.pool = [];
    this.activeObjects = new WeakSet();

    // Pre-populate pool
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.createFn());
    }
  }

  acquire() {
    let obj;

    if (this.pool.length > 0) {
      obj = this.pool.pop();
    } else {
      obj = this.createFn();
    }

    this.activeObjects.add(obj);
    return obj;
  }

  release(obj) {
    if (!this.activeObjects.has(obj)) {
      console.warn('Attempting to release object not from this pool');
      return;
    }

    this.activeObjects.delete(obj);
    this.resetFn(obj);
    this.pool.push(obj);
  }

  getStats() {
    return {
      poolSize: this.pool.length,
      // Note: Can't get activeObjects.size directly (WeakSet limitation)
      poolUtilization: this.pool.length === 0 ? 'high' : 'normal'
    };
  }
}

// Usage example: DOM element pool
const elementPool = new ObjectPool(
  () => document.createElement('div'),
  (element) => {
    element.innerHTML = '';
    element.className = '';
    element.style.cssText = '';
  },
  20 // Initial pool size
);

// Efficient DOM manipulation
function createManyElements(count) {
  const elements = [];

  for (let i = 0; i < count; i++) {
    const element = elementPool.acquire();
    element.textContent = `Item ${i}`;
    element.className = 'list-item';
    elements.push(element);
  }

  return elements;
}

function cleanupElements(elements) {
  elements.forEach(element => {
    element.remove(); // Remove from DOM
    elementPool.release(element); // Return to pool
  });
}

// Benchmark
console.time('With object pool');
const elements1 = createManyElements(1000);
cleanupElements(elements1);
console.timeEnd('With object pool'); // ~50ms

console.time('Without object pool');
const elements2 = Array.from({ length: 1000 }, (_, i) => {
  const element = document.createElement('div');
  element.textContent = `Item ${i}`;
  element.className = 'list-item';
  return element;
});
elements2.forEach(el => el.remove());
console.timeEnd('Without object pool'); // ~80ms
```


#### 🔬 Collection Performance Optimization


**Choosing Right Data Structure:**


```javascript
// Performance comparison framework
class DataStructureBenchmark {
  constructor() {
    this.results = new Map();
  }

  benchmarkLookup(sizes = [100, 1000, 10000]) {
    for (const size of sizes) {
      this.benchmarkLookupAtSize(size);
    }

    this.displayResults('lookup');
  }

  benchmarkLookupAtSize(size) {
    // Setup data
    const mapData = new Map();
    const setData = new Set();
    const objData = {};
    const arrayData = [];

    for (let i = 0; i < size; i++) {
      const key = `key_${i}`;
      const value = `value_${i}`;

      mapData.set(key, value);
      setData.add(key);
      objData[key] = value;
      arrayData.push(key);
    }

    const lookupKey = `key_${size - 1}`; // Worst case
    const iterations = 1000;

    // Map lookup
    const mapStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      mapData.has(lookupKey);
    }
    const mapTime = performance.now() - mapStart;

    // Set lookup
    const setStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      setData.has(lookupKey);
    }
    const setTime = performance.now() - setStart;

    // Object lookup
    const objStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      lookupKey in objData;
    }
    const objTime = performance.now() - objStart;

    // Array lookup
    const arrStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      arrayData.includes(lookupKey);
    }
    const arrTime = performance.now() - arrStart;

    if (!this.results.has('lookup')) {
      this.results.set('lookup', []);
    }

    this.results.get('lookup').push({
      size,
      map: mapTime,
      set: setTime,
      object: objTime,
      array: arrTime
    });
  }

  benchmarkIteration(sizes = [1000, 10000, 100000]) {
    for (const size of sizes) {
      this.benchmarkIterationAtSize(size);
    }

    this.displayResults('iteration');
  }

  benchmarkIterationAtSize(size) {
    const mapData = new Map();
    const objData = {};
    const arrayData = [];

    for (let i = 0; i < size; i++) {
      const key = `key_${i}`;
      const value = `value_${i}`;

      mapData.set(key, value);
      objData[key] = value;
      arrayData.push([key, value]);
    }

    // Map iteration
    const mapStart = performance.now();
    for (const [key, value] of mapData) {
      // Simulate work
      const result = key + value;
    }
    const mapTime = performance.now() - mapStart;

    // Object iteration
    const objStart = performance.now();
    for (const key in objData) {
      const value = objData[key];
      const result = key + value;
    }
    const objTime = performance.now() - objStart;

    // Array iteration
    const arrStart = performance.now();
    for (const [key, value] of arrayData) {
      const result = key + value;
    }
    const arrTime = performance.now() - arrStart;

    if (!this.results.has('iteration')) {
      this.results.set('iteration', []);
    }

    this.results.get('iteration').push({
      size,
      map: mapTime,
      object: objTime,
      array: arrTime
    });
  }

  displayResults(operation) {
    const data = this.results.get(operation);
    console.table(data);
  }

  generateRecommendations() {
    return {
      lookup: {
        small: 'Object/Map similar performance',
        medium: 'Map/Set preferred over Array',
        large: 'Map/Set significantly faster'
      },
      iteration: {
        general: 'Map iteration fastest, Object close second',
        memory: 'Array most memory efficient for simple data',
        flexibility: 'Map best for dynamic keys'
      }
    };
  }
}

// Run benchmarks
const benchmark = new DataStructureBenchmark();
benchmark.benchmarkLookup();
benchmark.benchmarkIteration();
console.log(benchmark.generateRecommendations());
```


**Memory-Efficient Large Collection Handling:**


```javascript
// Streaming large dataset processing
class LargeCollectionProcessor {
  constructor() {
    this.batchSize = 1000;
    this.memoryThreshold = 50 * 1024 * 1024; // 50MB
  }

  async *processLargeMap(largeMap, processorFn) {
    let batch = new Map();
    let batchCount = 0;

    for (const [key, value] of largeMap) {
      batch.set(key, value);
      batchCount++;

      if (batchCount >= this.batchSize) {
        yield await this.processBatch(batch, processorFn);

        // Clear batch và check memory
        batch.clear();
        batchCount = 0;

        if (this.shouldPause()) {
          await this.pauseForGC();
        }
      }
    }

    // Process remaining items
    if (batch.size > 0) {
      yield await this.processBatch(batch, processorFn);
    }
  }

  async processBatch(batch, processorFn) {
    const results = new Map();

    for (const [key, value] of batch) {
      const result = await processorFn(key, value);
      results.set(key, result);
    }

    return results;
  }

  shouldPause() {
    if (performance.memory) {
      return performance.memory.usedJSHeapSize > this.memoryThreshold;
    }
    return false;
  }

  async pauseForGC() {
    // Allow garbage collection
    await new Promise(resolve => setTimeout(resolve, 10));

    if (global.gc) {
      global.gc(); // Force GC trong Node.js
    }
  }

  // Efficient Map filtering without creating intermediate collections
  async *filterLargeMap(largeMap, filterFn) {
    for (const [key, value] of largeMap) {
      if (await filterFn(key, value)) {
        yield [key, value];
      }

      // Yield control periodically
      if (Math.random() < 0.001) { // ~0.1% chance
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
  }

  // Memory-efficient Map reduce
  async reduceMap(map, reducerFn, initialValue) {
    let accumulator = initialValue;
    let processedCount = 0;

    for (const [key, value] of map) {
      accumulator = await reducerFn(accumulator, value, key, map);
      processedCount++;

      // Periodic yield để prevent blocking
      if (processedCount % 1000 === 0) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }

    return accumulator;
  }
}

// Usage example
async function processLargeDataset() {
  const processor = new LargeCollectionProcessor();

  // Simulate large Map
  const largeMap = new Map();
  for (let i = 0; i < 100000; i++) {
    largeMap.set(`key_${i}`, { data: i, timestamp: Date.now() });
  }

  // Process trong batches
  const results = [];

  for await (const batch of processor.processLargeMap(largeMap, async (key, value) => {
    // Simulate async processing
    return { ...value, processed: true };
  })) {
    results.push(batch);
    console.log(`Processed batch of ${batch.size} items`);
  }

  console.log(`Total batches: ${results.length}`);

  // Memory-efficient filtering
  const filtered = [];
  for await (const [key, value] of processor.filterLargeMap(largeMap, (key, value) => {
    return value.data % 2 === 0; // Even numbers only
  })) {
    filtered.push([key, value]);
  }

  console.log(`Filtered ${filtered.length} items`);
}
```


#### 🎯 Performance Optimization Mastery


**Challenge: Optimize Memory Usage**


```javascript
// Given: Memory-inefficient implementation
class InefficientDataManager {
  constructor() {
    this.data = [];
    this.cache = {};
    this.listeners = {};
  }

  addData(item) {
    this.data.push(item);

    // Inefficient: Recalculate all derived data
    this.recalculateAll();
  }

  recalculateAll() {
    this.cache = {};

    // Expensive operations for all data
    for (const item of this.data) {
      this.cache[item.id] = this.expensiveCalculation(item);
    }
  }

  expensiveCalculation(item) {
    // Simulate expensive work
    let result = 0;
    for (let i = 0; i < 10000; i++) {
      result += Math.sin(item.value + i);
    }
    return result;
  }

  subscribe(id, callback) {
    if (!this.listeners[id]) {
      this.listeners[id] = [];
    }
    this.listeners[id].push(callback);
  }

  // Memory leak: No unsubscribe method!
}

// Task: Optimize this implementation
// Your optimized version here...
```


**Optimized Solution:**


```javascript
class EfficientDataManager {
  constructor() {
    this.data = new Map(); // Better lookups
    this.cache = new Map(); // Better cache performance
    this.listeners = new Map(); // WeakMap might be better
    this.dirtyItems = new Set(); // Track what needs recalculation
    this.batchUpdateScheduled = false;
  }

  addData(item) {
    this.data.set(item.id, item);
    this.markDirty(item.id);

    // Batch updates instead of immediate recalculation
    this.scheduleUpdate();
  }

  markDirty(id) {
    this.dirtyItems.add(id);
  }

  scheduleUpdate() {
    if (this.batchUpdateScheduled) return;

    this.batchUpdateScheduled = true;

    // Use microtask cho batching
    Promise.resolve().then(() => {
      this.processUpdates();
```


## Claude


```javascript
class EfficientDataManager {
  constructor() {
    this.data = new Map(); // Better lookups
    this.cache = new Map(); // Better cache performance
    this.listeners = new Map(); // WeakMap might be better
    this.dirtyItems = new Set(); // Track what needs recalculation
    this.batchUpdateScheduled = false;
  }

  addData(item) {
    this.data.set(item.id, item);
    this.markDirty(item.id);

    // Batch updates instead of immediate recalculation
    this.scheduleUpdate();
  }

  markDirty(id) {
    this.dirtyItems.add(id);
  }

  scheduleUpdate() {
    if (this.batchUpdateScheduled) return;

    this.batchUpdateScheduled = true;

    // Use microtask cho batching
    Promise.resolve().then(() => {
      this.processUpdates();
      this.batchUpdateScheduled = false;
    });
  }

  processUpdates() {
    // Only recalculate dirty items
    for (const id of this.dirtyItems) {
      const item = this.data.get(id);
      if (item) {
        this.cache.set(id, this.expensiveCalculation(item));
        this.notifyListeners(id);
      }
    }

    this.dirtyItems.clear();
  }

  expensiveCalculation(item) {
    // Same expensive work, but now only done when needed
    let result = 0;
    for (let i = 0; i < 10000; i++) {
      result += Math.sin(item.value + i);
    }
    return result;
  }

  getCachedValue(id) {
    if (!this.cache.has(id)) {
      const item = this.data.get(id);
      if (item) {
        this.cache.set(id, this.expensiveCalculation(item));
      }
    }
    return this.cache.get(id);
  }

  subscribe(id, callback) {
    if (!this.listeners.has(id)) {
      this.listeners.set(id, new Set());
    }
    this.listeners.get(id).add(callback);

    // Return unsubscribe function
    return () => this.unsubscribe(id, callback);
  }

  unsubscribe(id, callback) {
    const callbacks = this.listeners.get(id);
    if (callbacks) {
      callbacks.delete(callback);

      // Cleanup empty listener sets
      if (callbacks.size === 0) {
        this.listeners.delete(id);
      }
    }
  }

  notifyListeners(id) {
    const callbacks = this.listeners.get(id);
    if (callbacks) {
      const value = this.cache.get(id);
      callbacks.forEach(callback => {
        try {
          callback(value);
        } catch (error) {
          console.error('Listener error:', error);
        }
      });
    }
  }

  // Memory cleanup method
  cleanup() {
    this.data.clear();
    this.cache.clear();
    this.listeners.clear();
    this.dirtyItems.clear();
  }

  // Performance monitoring
  getStats() {
    return {
      dataSize: this.data.size,
      cacheSize: this.cache.size,
      listenerCount: this.listeners.size,
      dirtyItemCount: this.dirtyItems.size
    };
  }
}

// Performance comparison
async function comparePerformance() {
  const inefficient = new InefficientDataManager();
  const efficient = new EfficientDataManager();

  const testData = Array.from({ length: 1000 }, (_, i) => ({
    id: i,
    value: Math.random() * 100
  }));

  // Inefficient approach
  console.time('Inefficient implementation');
  testData.forEach(item => inefficient.addData(item));
  console.timeEnd('Inefficient implementation'); // ~2000ms

  // Efficient approach
  console.time('Efficient implementation');
  testData.forEach(item => efficient.addData(item));

  // Wait for batched updates
  await new Promise(resolve => setTimeout(resolve, 10));
  console.timeEnd('Efficient implementation'); // ~200ms

  console.log('Performance improvement: ~10x faster! 🚀');
  console.log('Memory usage: Significantly reduced');
  console.log('Efficient stats:', efficient.getStats());
}
```


---


### 🔬 Chapter 9: Advanced Architectural Patterns


#### 🌱 Event-Driven Architecture với Map/Set


**Real-time Collaboration System (Figma-style):**


```javascript
// Advanced event system với automatic cleanup
class CollaborationEngine {
  constructor() {
    this.documents = new Map(); // docId -> DocumentState
    this.userSessions = new Map(); // userId -> SessionInfo
    this.documentSubscriptions = new Map(); // docId -> Set<userId>
    this.userSubscriptions = new Map(); // userId -> Set<docId>
    this.operationQueue = new Map(); // docId -> Queue<Operation>
    this.conflictResolver = new ConflictResolver();

    this.setupCleanupInterval();
  }

  // User joins document
  joinDocument(userId, documentId) {
    // Update document subscriptions
    if (!this.documentSubscriptions.has(documentId)) {
      this.documentSubscriptions.set(documentId, new Set());
    }
    this.documentSubscriptions.get(documentId).add(userId);

    // Update user subscriptions
    if (!this.userSubscriptions.has(userId)) {
      this.userSubscriptions.set(userId, new Set());
    }
    this.userSubscriptions.get(userId).add(documentId);

    // Update session info
    this.updateUserSession(userId, documentId);

    // Send current document state
    this.sendDocumentState(userId, documentId);

    // Notify other users
    this.broadcastUserJoined(userId, documentId);
  }

  // User leaves document
  leaveDocument(userId, documentId) {
    // Remove từ document subscriptions
    const docSubs = this.documentSubscriptions.get(documentId);
    if (docSubs) {
      docSubs.delete(userId);

      // Cleanup empty subscription sets
      if (docSubs.size === 0) {
        this.documentSubscriptions.delete(documentId);
        this.unloadDocument(documentId);
      }
    }

    // Remove từ user subscriptions
    const userSubs = this.userSubscriptions.get(userId);
    if (userSubs) {
      userSubs.delete(documentId);

      if (userSubs.size === 0) {
        this.userSubscriptions.delete(userId);
        this.cleanupUserSession(userId);
      }
    }

    // Notify other users
    this.broadcastUserLeft(userId, documentId);
  }

  // Process collaborative operation
  async processOperation(userId, documentId, operation) {
    // Validate user có access
    if (!this.hasDocumentAccess(userId, documentId)) {
      throw new Error('Access denied');
    }

    // Add to operation queue
    if (!this.operationQueue.has(documentId)) {
      this.operationQueue.set(documentId, []);
    }

    const queue = this.operationQueue.get(documentId);

    // Transform operation against concurrent operations
    const transformedOp = await this.conflictResolver.transform(
      operation,
      queue
    );

    // Apply operation
    await this.applyOperation(documentId, transformedOp);

    // Add to queue
    queue.push(transformedOp);

    // Broadcast to other users
    this.broadcastOperation(userId, documentId, transformedOp);

    // Cleanup old operations
    this.cleanupOperationQueue(documentId);
  }

  async applyOperation(documentId, operation) {
    const document = this.documents.get(documentId);
    if (!document) {
      throw new Error('Document not found');
    }

    // Apply operation based on type
    switch (operation.type) {
      case 'text_insert':
        this.applyTextInsert(document, operation);
        break;
      case 'text_delete':
        this.applyTextDelete(document, operation);
        break;
      case 'object_create':
        this.applyObjectCreate(document, operation);
        break;
      case 'object_update':
        this.applyObjectUpdate(document, operation);
        break;
      case 'object_delete':
        this.applyObjectDelete(document, operation);
        break;
      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }

    // Update document version
    document.version++;
    document.lastModified = Date.now();
  }

  broadcastOperation(fromUserId, documentId, operation) {
    const subscribers = this.documentSubscriptions.get(documentId);
    if (!subscribers) return;

    for (const userId of subscribers) {
      if (userId !== fromUserId) { // Don't send back to sender
        this.sendToUser(userId, {
          type: 'operation',
          documentId,
          operation,
          fromUser: fromUserId
        });
      }
    }
  }

  // Conflict resolution system
  setupConflictResolver() {
    return new ConflictResolver();
  }

  // Memory management
  setupCleanupInterval() {
    setInterval(() => {
      this.cleanupInactiveSessions();
      this.cleanupOperationQueues();
    }, 60000); // Every minute
  }

  cleanupInactiveSessions() {
    const now = Date.now();
    const inactiveThreshold = 5 * 60 * 1000; // 5 minutes

    for (const [userId, sessionInfo] of this.userSessions) {
      if (now - sessionInfo.lastActivity > inactiveThreshold) {
        this.disconnectUser(userId);
      }
    }
  }

  cleanupOperationQueues() {
    const oldOperationThreshold = 10 * 60 * 1000; // 10 minutes
    const now = Date.now();

    for (const [docId, queue] of this.operationQueue) {
      // Keep only recent operations
      const filteredQueue = queue.filter(op =>
        now - op.timestamp < oldOperationThreshold
      );

      if (filteredQueue.length === 0) {
        this.operationQueue.delete(docId);
      } else {
        this.operationQueue.set(docId, filteredQueue);
      }
    }
  }

  disconnectUser(userId) {
    const userDocs = this.userSubscriptions.get(userId);
    if (userDocs) {
      // Remove user từ all documents
      for (const docId of userDocs) {
        this.leaveDocument(userId, docId);
      }
    }

    this.cleanupUserSession(userId);
  }

  getCollaborationStats() {
    return {
      activeDocuments: this.documents.size,
      activeSessions: this.userSessions.size,
      totalSubscriptions: Array.from(this.documentSubscriptions.values())
        .reduce((sum, set) => sum + set.size, 0),
      operationQueueSizes: Array.from(this.operationQueue.values())
        .map(queue => queue.length)
    };
  }
}

// Operational Transform implementation
class ConflictResolver {
  constructor() {
    this.transformCache = new Map(); // Cache transformed operations
  }

  async transform(operation, concurrentOps) {
    // Create cache key
    const cacheKey = this.createCacheKey(operation, concurrentOps);

    if (this.transformCache.has(cacheKey)) {
      return this.transformCache.get(cacheKey);
    }

    let transformedOp = { ...operation };

    // Transform against each concurrent operation
    for (const concurrentOp of concurrentOps) {
      if (this.operationsOverlap(transformedOp, concurrentOp)) {
        transformedOp = this.transformPair(transformedOp, concurrentOp);
      }
    }

    // Cache result
    this.transformCache.set(cacheKey, transformedOp);

    return transformedOp;
  }

  transformPair(op1, op2) {
    // Implement Operational Transform algorithms
    if (op1.type === 'text_insert' && op2.type === 'text_insert') {
      return this.transformTextInserts(op1, op2);
    }

    if (op1.type === 'text_delete' && op2.type === 'text_delete') {
      return this.transformTextDeletes(op1, op2);
    }

    if (op1.type === 'text_insert' && op2.type === 'text_delete') {
      return this.transformInsertDelete(op1, op2);
    }

    // Handle object operations
    if (op1.objectId === op2.objectId) {
      return this.transformObjectOperations(op1, op2);
    }

    return op1; // No conflict
  }

  transformTextInserts(insert1, insert2) {
    if (insert2.position <= insert1.position) {
      // Adjust position
      return {
        ...insert1,
        position: insert1.position + insert2.text.length
      };
    }

    return insert1; // No adjustment needed
  }

  transformTextDeletes(delete1, delete2) {
    const delete1End = delete1.position + delete1.length;
    const delete2End = delete2.position + delete2.length;

    // Complex delete transformation logic
    if (delete2End <= delete1.position) {
      // delete2 is completely before delete1
      return {
        ...delete1,
        position: delete1.position - delete2.length
      };
    }

    if (delete2.position >= delete1End) {
      // delete2 is completely after delete1
      return delete1;
    }

    // Overlapping deletes - need careful handling
    return this.resolveOverlappingDeletes(delete1, delete2);
  }

  resolveOverlappingDeletes(delete1, delete2) {
    // Implement complex overlap resolution
    // This is a simplified version
    const earlierDelete = delete1.position <= delete2.position ? delete1 : delete2;
    const adjustedLength = Math.max(0, delete1.length - delete2.length);

    return {
      ...delete1,
      length: adjustedLength
    };
  }

  createCacheKey(operation, concurrentOps) {
    const opString = JSON.stringify(operation);
    const concurrentString = concurrentOps.map(op => JSON.stringify(op)).join('|');
    return `${opString}:${concurrentString}`;
  }

  operationsOverlap(op1, op2) {
    // Quick check if operations might conflict
    if (op1.type.startsWith('text') && op2.type.startsWith('text')) {
      return true; // Text operations always potentially conflict
    }

    if (op1.objectId && op2.objectId) {
      return op1.objectId === op2.objectId;
    }

    return false;
  }
}
```


#### 🔬 Microservice Communication Patterns


**Service Registry với Health Monitoring:**


```javascript
// Advanced service discovery và health monitoring
class ServiceRegistry {
  constructor() {
    this.services = new Map(); // serviceName -> Set<ServiceInstance>
    this.healthChecks = new Map(); // instanceId -> HealthCheckConfig
    this.serviceSubscriptions = new Map(); // serviceName -> Set<callbacks>
    this.loadBalancers = new Map(); // serviceName -> LoadBalancer
    this.circuitBreakers = new Map(); // instanceId -> CircuitBreaker

    this.startHealthMonitoring();
  }

  registerService(serviceName, instance) {
    if (!this.services.has(serviceName)) {
      this.services.set(serviceName, new Set());
      this.loadBalancers.set(serviceName, new RoundRobinBalancer());
    }

    this.services.get(serviceName).add(instance);

    // Setup health check
    this.setupHealthCheck(instance);

    // Setup circuit breaker
    this.circuitBreakers.set(instance.id, new CircuitBreaker(instance));

    // Notify subscribers
    this.notifyServiceChange(serviceName, 'register', instance);

    console.log(`Service registered: ${serviceName} at ${instance.endpoint}`);
  }

  deregisterService(serviceName, instanceId) {
    const instances = this.services.get(serviceName);
    if (!instances) return;

    // Find và remove instance
    for (const instance of instances) {
      if (instance.id === instanceId) {
        instances.delete(instance);

        // Cleanup health check
        this.healthChecks.delete(instanceId);

        // Cleanup circuit breaker
        this.circuitBreakers.delete(instanceId);

        // Remove service if no instances left
        if (instances.size === 0) {
          this.services.delete(serviceName);
          this.loadBalancers.delete(serviceName);
        }

        // Notify subscribers
        this.notifyServiceChange(serviceName, 'deregister', instance);

        console.log(`Service deregistered: ${serviceName} instance ${instanceId}`);
        break;
      }
    }
  }

  discoverService(serviceName) {
    const instances = this.services.get(serviceName);
    if (!instances || instances.size === 0) {
      return null;
    }

    // Filter healthy instances
    const healthyInstances = Array.from(instances).filter(instance => {
      const circuitBreaker = this.circuitBreakers.get(instance.id);
      return circuitBreaker && circuitBreaker.isHealthy();
    });

    if (healthyInstances.length === 0) {
      console.warn(`No healthy instances for service: ${serviceName}`);
      return null;
    }

    // Use load balancer to select instance
    const loadBalancer = this.loadBalancers.get(serviceName);
    return loadBalancer.selectInstance(healthyInstances);
  }

  subscribeToService(serviceName, callback) {
    if (!this.serviceSubscriptions.has(serviceName)) {
      this.serviceSubscriptions.set(serviceName, new Set());
    }

    this.serviceSubscriptions.get(serviceName).add(callback);

    // Return unsubscribe function
    return () => {
      const subscribers = this.serviceSubscriptions.get(serviceName);
      if (subscribers) {
        subscribers.delete(callback);
        if (subscribers.size === 0) {
          this.serviceSubscriptions.delete(serviceName);
        }
      }
    };
  }

  notifyServiceChange(serviceName, action, instance) {
    const subscribers = this.serviceSubscriptions.get(serviceName);
    if (!subscribers) return;

    const event = {
      serviceName,
      action, // 'register', 'deregister', 'health_change'
      instance,
      timestamp: Date.now()
    };

    subscribers.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Service subscription callback error:', error);
      }
    });
  }

  setupHealthCheck(instance) {
    const healthCheck = {
      instance,
      interval: instance.healthCheck?.interval || 30000, // 30 seconds
      timeout: instance.healthCheck?.timeout || 5000, // 5 seconds
      endpoint: instance.healthCheck?.endpoint || '/health',
      consecutiveFailures: 0,
      maxFailures: 3
    };

    this.healthChecks.set(instance.id, healthCheck);
  }

  startHealthMonitoring() {
    setInterval(() => {
      this.performHealthChecks();
    }, 10000); // Check every 10 seconds
  }

  async performHealthChecks() {
    const healthCheckPromises = [];

    for (const [instanceId, healthCheck] of this.healthChecks) {
      healthCheckPromises.push(this.checkInstanceHealth(instanceId, healthCheck));
    }

    await Promise.allSettled(healthCheckPromises);
  }

  async checkInstanceHealth(instanceId, healthCheck) {
    const { instance, endpoint, timeout } = healthCheck;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(`${instance.endpoint}${endpoint}`, {
        signal: controller.signal,
        method: 'GET'
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        // Health check passed
        healthCheck.consecutiveFailures = 0;

        const circuitBreaker = this.circuitBreakers.get(instanceId);
        if (circuitBreaker) {
          circuitBreaker.recordSuccess();
        }
      } else {
        this.handleHealthCheckFailure(instanceId, healthCheck,
          `HTTP ${response.status}`);
      }
    } catch (error) {
      this.handleHealthCheckFailure(instanceId, healthCheck, error.message);
    }
  }

  handleHealthCheckFailure(instanceId, healthCheck, error) {
    healthCheck.consecutiveFailures++;

    console.warn(`Health check failed for ${instanceId}: ${error}
      (${healthCheck.consecutiveFailures}/${healthCheck.maxFailures})`);

    const circuitBreaker = this.circuitBreakers.get(instanceId);
    if (circuitBreaker) {
      circuitBreaker.recordFailure();
    }

    // Remove unhealthy instance after max failures
    if (healthCheck.consecutiveFailures >= healthCheck.maxFailures) {
      const serviceName = this.findServiceNameByInstanceId(instanceId);
      if (serviceName) {
        this.notifyServiceChange(serviceName, 'health_change', healthCheck.instance);
      }
    }
  }

  findServiceNameByInstanceId(instanceId) {
    for (const [serviceName, instances] of this.services) {
      for (const instance of instances) {
        if (instance.id === instanceId) {
          return serviceName;
        }
      }
    }
    return null;
  }

  getRegistryStats() {
    const stats = {
      totalServices: this.services.size,
      totalInstances: 0,
      healthyInstances: 0,
      serviceBreakdown: new Map()
    };

    for (const [serviceName, instances] of this.services) {
      const healthyCount = Array.from(instances).filter(instance => {
        const circuitBreaker = this.circuitBreakers.get(instance.id);
        return circuitBreaker && circuitBreaker.isHealthy();
      }).length;

      stats.totalInstances += instances.size;
      stats.healthyInstances += healthyCount;

      stats.serviceBreakdown.set(serviceName, {
        total: instances.size,
        healthy: healthyCount
      });
    }

    return stats;
  }
}

// Load Balancer implementations
class RoundRobinBalancer {
  constructor() {
    this.currentIndex = 0;
  }

  selectInstance(instances) {
    if (instances.length === 0) return null;

    const selected = instances[this.currentIndex % instances.length];
    this.currentIndex++;

    return selected;
  }
}

class WeightedBalancer {
  constructor() {
    this.weights = new WeakMap(); // instance -> weight
  }

  setWeight(instance, weight) {
    this.weights.set(instance, weight);
  }

  selectInstance(instances) {
    if (instances.length === 0) return null;

    // Calculate total weight
    let totalWeight = 0;
    for (const instance of instances) {
      totalWeight += this.weights.get(instance) || 1;
    }

    // Select based on weight
    let random = Math.random() * totalWeight;

    for (const instance of instances) {
      const weight = this.weights.get(instance) || 1;
      random -= weight;

      if (random <= 0) {
        return instance;
      }
    }

    return instances[0]; // Fallback
  }
}

// Circuit Breaker implementation
class CircuitBreaker {
  constructor(instance, options = {}) {
    this.instance = instance;
    this.failureThreshold = options.failureThreshold || 5;
    this.recoveryTimeout = options.recoveryTimeout || 60000; // 1 minute
    this.monitoringPeriod = options.monitoringPeriod || 10000; // 10 seconds

    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.nextAttemptTime = null;
  }

  recordSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
    this.lastFailureTime = null;
    this.nextAttemptTime = null;
  }

  recordFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttemptTime = Date.now() + this.recoveryTimeout;
    }
  }

  isHealthy() {
    const now = Date.now();

    switch (this.state) {
      case 'CLOSED':
        return true;

      case 'OPEN':
        if (now >= this.nextAttemptTime) {
          this.state = 'HALF_OPEN';
          return true; // Allow one attempt
        }
        return false;

      case 'HALF_OPEN':
        return true; // Allow attempts in half-open state

      default:
        return false;
    }
  }

  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime,
      nextAttemptTime: this.nextAttemptTime
    };
  }
}
```


#### 🎯 Architecture Pattern Mastery


**Challenge: Design Event Sourcing System**


```javascript
// Design an event sourcing system using Map/Set
// Requirements:
// 1. Store events efficiently
// 2. Support event replay
// 3. Handle snapshots
// 4. Provide event subscriptions
// 5. Memory-efficient cleanup

// Your implementation here...
```


**Solution:**


---


## 📖 PHẦN IV: MASTERY VERIFICATION - REAL-WORLD CASE STUDIES


### 🔬 Chapter 10: Comprehensive Case Studies


#### 🌱 Case Study 1: High-Performance Trading Engine (Binance-inspired)


**Problem Statement:**


Tại Binance, chúng tôi cần process millions of trading orders per second với sub-millisecond latency. Traditional data structures không đủ performance cho critical path này.


**Map/Set Solution Implementation:**


#### 🌱 Case Study 2: Real-time Collaborative Editor (Figma-inspired)


**Problem Statement:**


Tại Figma, chúng tôi cần handle thousands of concurrent users editing same document với real-time synchronization. Challenge chính là conflict resolution và efficient state management.


#### 🌱 Case Study 3: Distributed Cache System (Redis-inspired)


**Problem Statement:**


Build distributed caching system với intelligent eviction, replication, và consistency guarantees. Need handle millions of operations per second across multiple nodes.


---


### 🎯 Mastery Verification Framework


#### 🌱 Comprehensive Skills Assessment


**Level 1: Foundation Mastery (Junior → Mid-level)**
