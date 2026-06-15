# JavaScript Function Object Deep Dive

## You

Continue

## You

Continue

## Claude


# Phân Tích Chuyên Sâu: Function Object và Named Function Expression trong JavaScript


### Góc Nhìn Principal Front-end Engineer từ NAB, Axon, Binance, Webflow, Figma


---


## 🌱 Mở Đầu: Tại Sao Hiểu Sâu Function Object Lại Quan Trọng?


Khi tôi bắt đầu career tại NAB với vai trò Senior Engineer, tôi nghĩ mình đã hiểu về functions trong JavaScript. Cho đến khi một bug production khiến tôi nhận ra rằng understanding của mình chỉ là surface level. Bug đó liên quan đến một function bị reassign và mất reference đến chính nó trong recursive call - chính xác là vấn đề mà Named Function Expression (NFE) được thiết kế để giải quyết.


💭 **Principal's Reflection**: *Sau 15+ năm experience ở các công ty tier-1, tôi nhận ra rằng việc truly understand JavaScript fundamentals không phải là nice-to-have mà là absolutely critical. Functions trong JS không chỉ là "callable code blocks" - chúng là first-class objects với properties, methods, và behaviors phức tạp mà có thể make-or-break production applications.*


---


## 📖 PHẦN I: FUNCTION OBJECTS - TỪ FIRST PRINCIPLES ĐẾN BROWSER INTERNALS


### 🌱 Nguồn Gốc & Motivation: Tại Sao Functions Là Objects?


**Problem Statement Chi Tiết:**


Trong early days của programming languages, functions typically được treat như pure procedures - chỉ là executable code không có state hay properties. Nhưng khi JavaScript được thiết kế (1995), Brendan Eich đối mặt với một fundamental challenge:


1. **Dynamic Language Requirements**: JavaScript cần flexibility để modify behavior at runtime
2. **First-Class Function Support**: Functions cần có thể pass around như values
3. **Introspection Capabilities**: Code cần có thể examine functions để make decisions
4. **Meta-programming Support**: Framework authors cần ability để extend function behavior


💭 **Historical Context Deep Dive**: *Brendan Eich đã inspired bởi Scheme (functional programming) và Self (prototype-based OOP). Decision để make functions objects không phải random choice - nó reflection của need for maximum flexibility trong web environment, nơi mà code requirements constantly changing.*


**Alternative Solutions và Trade-offs:**


1. **Pure Procedure Model** (như C):

✅ Simplicity, predictable performance
❌ No runtime introspection, limited flexibility
2. **Function Pointers** (như C++):

✅ Some flexibility, good performance
❌ Limited metadata, no dynamic properties
3. **Function Objects** (JavaScript approach):

✅ Maximum flexibility, rich metadata, dynamic behavior
❌ Higher memory overhead, potential confusion


### 🔬 Bản Chất & Mechanism: Function Objects Internal Structure


**Core Algorithm Explanation:**


Khi JavaScript engine (V8, SpiderMonkey, etc.) encounters function declaration, đây là simplified process:


```javascript
// Khi engine gặp function declaration này:
function sayHi() {
    alert("Hi");
}

// Internally, engine creates:
// 1. Function object với callable behavior
// 2. Properties như name, length, prototype
// 3. Hidden properties cho execution context
// 4. Reference đến lexical environment
```


**Memory Model Analysis:**


```
Memory Layout của Function Object:
┌─────────────────────────────────────┐
│ Function Object (sayHi)             │
├─────────────────────────────────────┤
│ [[Call]] internal method            │ ← Makes it callable
│ [[Construct]] internal method       │ ← Enables 'new' operator
│ name: "sayHi"                       │ ← name property
│ length: 0                           │ ← parameter count
│ prototype: {...}                    │ ← For constructor usage
│ [[Environment]]: LexicalEnv         │ ← Closure scope
│ [[FormalParameters]]: []            │ ← Parameter names
│ [[ECMAScriptCode]]: "alert('Hi')"   │ ← Function body
│ [[Realm]]: current realm            │ ← Execution realm
└─────────────────────────────────────┘
```


💭 **Engine Implementation Insight**: *Tại Binance, khi optimize trading algorithms, tôi đã deep-dive vào V8 source code để understand function call overhead. Function objects không phải chỉ là simple wrappers - chúng contain complex metadata structures mà V8 uses để optimize execution paths, inline calls, và manage memory.*


**Step-by-step Execution Flow:**


```javascript
// Step 1: Function Declaration Phase (Hoisting)
function sayHi() {  // Engine creates function object ngay lập tức
    alert("Hi");
}

// Step 2: Property Access
console.log(sayHi.name);  // "sayHi"
// Engine flow:
// 1. Resolve 'sayHi' identifier
// 2. Check if it's function object
// 3. Access 'name' property từ object
// 4. Return string value

// Step 3: Property Assignment
sayHi.customProp = "custom value";
// Engine flow:
// 1. Treat sayHi như object
// 2. Create new property slot
// 3. Store value với property descriptor
// 4. Update object's property map
```


### 💡 Intuitive Understanding: Real-world Analogies


**Analogy 1: Swiss Army Knife**
Function trong JavaScript giống như Swiss Army Knife:


- **Primary function**: Cutting (callable behavior)
- **Additional tools**: Screwdriver, scissors (properties như name, length)
- **Customizable**: You can attach additional tools (custom properties)
- **Inspectable**: You can examine what tools are available


**Analogy 2: Employee Object trong HR System**


```javascript
// Giống như employee trong company
function processPayroll(employee) {
    // Primary job function
    return employee.salary * 12;
}

// But employee has additional properties
processPayroll.department = "Finance";
processPayroll.permissions = ["read", "write"];
processPayroll.lastModified = new Date();

// Company can inspect employee capabilities
if (processPayroll.permissions.includes("write")) {
    // Allow modification
}
```


💭 **Teaching Mental Model**: *Khi mentor engineers tại Webflow, tôi thường explain functions như "smart objects" - they're not just code containers, but intelligent entities với identity (name), capabilities (length), và extensible behavior (custom properties). Analogy này helps junior engineers stop thinking về functions như static code blocks.*


### ⚙️ Implementation Deep Dive: Browser-Specific Behaviors


**V8 Engine (Chrome/Node.js) Implementation:**


```javascript
// V8 optimizes function property access
function example() {}

// First access: Dictionary mode (slow)
example.customProp = "value";

// Multiple accesses: Transitions to Map-based optimization
for (let i = 0; i < 1000; i++) {
    console.log(example.customProp);  // V8 creates hidden class
}
```


**Performance Characteristics Analysis:**


```javascript
// Benchmark function property vs variable access
function testFunctionProperties() {
    // Function property approach
    function counter() {
        return counter.count++;
    }
    counter.count = 0;

    // Variable approach
    let count = 0;
    function counterVar() {
        return count++;
    }

    // Performance comparison (rough numbers):
    // Function property: ~50% slower due to property lookup
    // Variable access: Faster, direct memory access
    // Trade-off: Flexibility vs Performance
}
```


💭 **Production Optimization Experience**: *Tại Axon, chúng tôi có real-time video processing system where every microsecond matters. Initially, chúng tôi store configuration trong function properties vì convenience, nhưng profiling revealed property access overhead. Final solution: hybrid approach - critical configs trong closure variables, non-critical metadata trong properties.*


**Edge Cases và Error Scenarios:**


```javascript
// Edge Case 1: Property collision với built-in properties
function dangerous() {}
dangerous.name = "modified";  // May be ignored (read-only)
dangerous.length = 5;         // Ignored (non-configurable)

// Edge Case 2: Function property inheritance
function Parent() {}
Parent.staticProp = "parent";

function Child() {}
Child.prototype = Object.create(Parent.prototype);
// Child.staticProp is undefined - properties don't inherit

// Edge Case 3: Arrow functions và properties
const arrow = () => {};
console.log(arrow.name);     // "arrow" - contextual name
arrow.customProp = "works";  // Still works, they're objects too
```


---


## 📖 PHẦN II: FUNCTION NAME PROPERTY - CONTEXTUAL INTELLIGENCE


### 🌱 Nguồn Gốc: Tại Sao Name Property Quan Trọng?


**Problem Statement:**


Trong early JavaScript development, debugging functions rất khó khăn vì:


1. **Anonymous Function Hell**: Stack traces chỉ show "anonymous function"
2. **Dynamic Function Creation**: Functions created at runtime không có meaningful names
3. **Debugging Difficulty**: Cannot identify functions trong error logs
4. **Profiling Challenges**: Performance tools cannot distinguish functions


💭 **Personal Debugging Story**: *Tại NAB, chúng tôi có complex trading system với hundreds of anonymous callback functions. Khi bug xảy ra, stack trace chỉ show "anonymous function at line X" repeatedly. Impossible để pinpoint exact function causing issue. Đó là lúc tôi truly appreciate the name property và implement naming conventions cho all function expressions.*


### 🔬 Contextual Name Algorithm Deep Dive


**Contextual Name Assignment Logic:**


```javascript
// Engine's name inference algorithm (simplified):
/*
1. Check if function has explicit name
2. If not, examine assignment context:
   - Variable assignment: use variable name
   - Object property: use property key
   - Default parameter: use parameter name
   - Array element: unable to infer (empty string)
*/

// Case 1: Explicit naming
function explicitName() {}
console.log(explicitName.name);  // "explicitName"

// Case 2: Variable assignment inference
let inferredFromVar = function() {};
console.log(inferredFromVar.name);  // "inferredFromVar"

// Case 3: Object property inference
const obj = {
    methodName: function() {},          // name: "methodName"
    shorthand() {},                     // name: "shorthand"
    'string-key': function() {},        // name: "string-key"
    [Symbol.iterator]: function() {}    // name: "[Symbol.iterator]"
};

// Case 4: Default parameter inference
function acceptsCallback(fn = function() {}) {
    console.log(fn.name);  // "fn" - inferred from parameter name
}

// Case 5: Cannot infer scenarios
const arr = [function() {}];  // arr[0].name === ""
const dynamic = {};
dynamic[Math.random()] = function() {};  // Cannot infer dynamic keys
```


**Browser Engine Implementation Differences:**


```javascript
// V8 (Chrome) specific behavior
const obj = {
    0: function() {},        // name: "0" (numeric key)
    null: function() {},     // name: "null" (converted to string)
    undefined: function() {} // name: "undefined"
};

// SpiderMonkey (Firefox) may handle edge cases differently
// Always test cross-browser for production apps
```


💭 **Cross-Browser Debugging Experience**: *Tại Figma, chúng tôi discovered subtle differences trong name property behavior across browsers. Firefox và Chrome handle certain edge cases differently, đặc biệt với Symbol keys và computed property names. Lesson learned: never rely on name property for application logic, chỉ dùng cho debugging/profiling.*


### 💡 Advanced Name Property Use Cases


**Production Debugging Strategy:**


```javascript
// Advanced debugging với named functions
class APIClient {
    constructor(baseURL) {
        this.baseURL = baseURL;

        // Each method has meaningful name for stack traces
        this.get = function apiClientGet(endpoint) {
            return this.request('GET', endpoint);
        };

        this.post = function apiClientPost(endpoint, data) {
            return this.request('POST', endpoint, data);
        };

        // Custom naming for dynamic methods
        ['PUT', 'DELETE', 'PATCH'].forEach(method => {
            this[method.toLowerCase()] = {
                [method.toLowerCase()]: function(endpoint, data) {
                    return this.request(method, endpoint, data);
                }
            }[method.toLowerCase()];
        });
    }

    request(method, endpoint, data) {
        // Meaningful function names show up in stack traces
        console.trace(`API Request: ${method} ${endpoint}`);
        // ... implementation
    }
}
```


**Performance Monitoring Applications:**


```javascript
// Function naming for performance monitoring
function createPerformanceWrapper(originalFn, context) {
    const wrapperName = `${context}_${originalFn.name || 'anonymous'}`;

    return {
        [wrapperName]: function(...args) {
            const startTime = performance.now();

            try {
                const result = originalFn.apply(this, args);

                // Log performance với meaningful function name
                console.log(`${wrapperName}: ${performance.now() - startTime}ms`);

                return result;
            } catch (error) {
                // Error reporting với function context
                console.error(`Error in ${wrapperName}:`, error);
                throw error;
            }
        }
    }[wrapperName];
}

// Usage
const optimizedFunction = createPerformanceWrapper(
    function calculateTradingSignal(data) {
        // Complex calculation
        return processData(data);
    },
    'trading_algorithm'
);
```


💭 **Production Monitoring Insight**: *Tại Binance, chúng tôi process millions of trading transactions per second. Having meaningful function names trong performance profiles is crucial for identifying bottlenecks. Chúng tôi built automated tooling để ensure all hot-path functions have descriptive names for better observability.*


---


## 📖 PHẦN III: FUNCTION LENGTH PROPERTY - PARAMETER INTROSPECTION


### 🌱 Motivation: Polymorphism và Function Introspection


**Core Problem Solved:**


Length property enables runtime polymorphism based on function signatures:


```javascript
// Classical problem: Different handling based on function arity
function createEventHandler(callback) {
    // How do we know if callback expects event object?
    // Solution: Inspect function.length

    if (callback.length === 0) {
        // No-argument callback
        return () => callback();
    } else if (callback.length === 1) {
        // Single argument (event object)
        return (event) => callback(event);
    } else {
        // Multiple arguments (event + additional data)
        return (event, ...args) => callback(event, ...args);
    }
}

// Usage examples
const simpleHandler = () => console.log('Clicked!');           // length: 0
const eventHandler = (e) => console.log('Event:', e.type);     // length: 1
const complexHandler = (e, data, meta) => {                    // length: 3
    console.log('Complex handling:', e, data, meta);
};
```


### 🔬 Length Property Calculation Algorithm


**Parameter Counting Rules:**


```javascript
// Rule 1: Count only formal parameters before rest parameter
function example1(a, b, c) {}              // length: 3
function example2(a, b, ...rest) {}        // length: 2 (rest ignored)
function example3(...args) {}              // length: 0 (only rest)

// Rule 2: Default parameters stop counting
function example4(a, b = 5, c) {}          // length: 1 (stops at default)
function example5(a, b, c = 10) {}         // length: 2 (counts until default)

// Rule 3: Destructuring parameters count as one
function example6({a, b}, [x, y]) {}       // length: 2
function example7({a, b} = {}) {}          // length: 0 (default parameter)

// Complex examples
function complex(
    required1,                    // +1 = 1
    required2,                    // +1 = 2
    optional = 'default',         // STOP counting here
    anotherParam,                 // Not counted
    ...rest                       // Not counted
) {}
console.log(complex.length);      // 2
```


**Engine Implementation Details:**


```javascript
// How JavaScript engine determines length during function creation:
/*
Parser phase:
1. Tokenize function declaration/expression
2. Identify formal parameters
3. Count parameters until first default or rest
4. Store count in function object's length property
5. Property is non-writable, non-enumerable, configurable
*/

// Verification of property descriptor
function test(a, b) {}
console.log(Object.getOwnPropertyDescriptor(test, 'length'));
// {
//   value: 2,
//   writable: false,     // Cannot change
//   enumerable: false,   // Doesn't show in for...in
//   configurable: true   // Can be deleted/redefined
// }
```


💭 **Parser Implementation Insight**: *Khi study V8 source code tại các optimization projects, tôi discovered rằng length calculation happens during parsing phase, không phải runtime. Điều này means length property là compile-time constant, enabling V8 to optimize based on function arity trong hot paths.*


### ⚙️ Production Use Cases: Polymorphic Function Design


**Framework-Level Polymorphism:**


```javascript
// React-style event handler factory (inspired by Figma's component system)
function createUniversalHandler(handlers) {
    return function universalHandler(event) {
        handlers.forEach(handler => {
            switch (handler.length) {
                case 0:
                    // Simple callback
                    handler();
                    break;

                case 1:
                    // Standard event handler
                    handler(event);
                    break;

                case 2:
                    // Handler with component context
                    handler(event, this);
                    break;

                case 3:
                    // Handler with full context (event, component, metadata)
                    handler(event, this, { timestamp: Date.now() });
                    break;

                default:
                    // Spread all available context
                    handler(event, this, { timestamp: Date.now() }, ...arguments);
            }
        });
    };
}

// Usage in component system
const Button = {
    onClick: createUniversalHandler([
        () => console.log('Button clicked'),                    // Simple
        (e) => console.log('Event:', e.type),                   // Event-aware
        (e, component) => console.log('Component:', component), // Context-aware
        (e, comp, meta) => analytics.track('click', meta)       // Full context
    ])
};
```


**API Design Pattern:**


```javascript
// Flexible API design pattern from NAB trading system
class TradingAPI {
    // Polymorphic order method based on parameter count
    placeOrder(...args) {
        switch (arguments.length) {
            case 1:
                // placeOrder({ symbol, quantity, price, type })
                return this._placeOrderFromObject(args[0]);

            case 3:
                // placeOrder(symbol, quantity, price)
                return this._placeOrderFromParams(args[0], args[1], args[2], 'LIMIT');

            case 4:
                // placeOrder(symbol, quantity, price, type)
                return this._placeOrderFromParams(...args);

            default:
                throw new Error(`Invalid number of arguments: ${arguments.length}`);
        }
    }

    // Internal implementation methods
    _placeOrderFromObject(orderData) {
        // Validate object structure
        const { symbol, quantity, price, type = 'LIMIT' } = orderData;
        return this._executeOrder(symbol, quantity, price, type);
    }

    _placeOrderFromParams(symbol, quantity, price, type) {
        // Validate individual parameters
        return this._executeOrder(symbol, quantity, price, type);
    }

    _executeOrder(symbol, quantity, price, type) {
        // Actual order execution logic
        console.log(`Order: ${type} ${quantity} ${symbol} @ ${price}`);
    }
}

// Usage flexibility
const api = new TradingAPI();
api.placeOrder('AAPL', 100, 150.00);                    // 3 params
api.placeOrder('AAPL', 100, 150.00, 'MARKET');          // 4 params
api.placeOrder({ symbol: 'AAPL', quantity: 100, price: 150.00 }); // object
```


💭 **API Design Philosophy**: *Tại các fintech companies như NAB và Binance, API flexibility là crucial. Length-based polymorphism allows us to provide multiple interface styles cho same functionality, accommodating different developer preferences và use cases without code duplication.*


### 💡 Advanced Introspection Patterns


**Function Signature Analysis:**


```javascript
// Advanced function analysis utility
class FunctionAnalyzer {
    static analyze(fn) {
        const source = fn.toString();
        const paramMatch = source.match(/\(([^)]*)\)/);
        const paramString = paramMatch ? paramMatch[1] : '';

        return {
            name: fn.name,
            length: fn.length,
            parameters: this.parseParameters(paramString),
            hasDefaults: this.hasDefaultParameters(paramString),
            hasRest: this.hasRestParameter(paramString),
            isAsync: source.startsWith('async'),
            isGenerator: source.includes('function*'),
            complexity: this.calculateComplexity(source)
        };
    }

    static parseParameters(paramString) {
        if (!paramString.trim()) return [];

        return paramString.split(',').map(param => {
            const trimmed = param.trim();
            const hasDefault = trimmed.includes('=');
            const isRest = trimmed.startsWith('...');
            const isDestructured = trimmed.includes('{') || trimmed.includes('[');

            return {
                name: this.extractParamName(trimmed),
                hasDefault,
                isRest,
                isDestructured
            };
        });
    }

    static extractParamName(param) {
        // Extract parameter name from various formats
        if (param.startsWith('...')) {
            return param.slice(3).split('=')[0].trim();
        }
        if (param.includes('=')) {
            return param.split('=')[0].trim();
        }
        if (param.includes('{') || param.includes('[')) {
            return `[destructured]`;
        }
        return param.trim();
    }

    static hasDefaultParameters(paramString) {
        return paramString.includes('=');
    }

    static hasRestParameter(paramString) {
        return paramString.includes('...');
    }

    static calculateComplexity(source) {
        // Simple complexity metric based on syntax elements
        const complexityMarkers = [
            'if', 'else', 'for', 'while', 'switch', 'try', 'catch',
            'function', '=>', '?', '&&', '||'
        ];

        return complexityMarkers.reduce((count, marker) => {
            const matches = source.match(new RegExp(marker, 'g'));
            return count + (matches ? matches.length : 0);
        }, 0);
    }
}

// Usage examples
function complexExample(
    required,
    optional = 'default',
    { destructured, nested = 5 } = {},
    [arrayParam] = [],
    ...rest
) {
    if (required && optional) {
        for (let item of rest) {
            console.log(item);
        }
    }
    return destructured?.nested || arrayParam?.[0];
}

const analysis = FunctionAnalyzer.analyze(complexExample);
console.log(JSON.stringify(analysis, null, 2));
/*
{
  "name": "complexExample",
  "length": 1,
  "parameters": [
    { "name": "required", "hasDefault": false, "isRest": false, "isDestructured": false },
    { "name": "optional", "hasDefault": true, "isRest": false, "isDestructured": false },
    { "name": "[destructured]", "hasDefault": true, "isRest": false, "isDestructured": true },
    { "name": "[destructured]", "hasDefault": true, "isRest": false, "isDestructured": true },
    { "name": "rest", "hasDefault": false, "isRest": true, "isDestructured": false }
  ],
  "hasDefaults": true,
  "hasRest": true,
  "isAsync": false,
  "isGenerator": false,
  "complexity": 8
}
*/
```


💭 **Code Analysis Tools Experience**: *Tại Webflow, chúng tôi built sophisticated code analysis tools để help developers understand function complexity và optimize performance. Function introspection patterns như thế này prove invaluable for building developer tools, linting systems, và automated code review processes.*


---


## 📖 PHẦN IV: CUSTOM PROPERTIES - EXTENDING FUNCTION BEHAVIOR


### 🌱 Nguồn Gốc: Tại Sao Functions Cần Custom Properties?


**Historical Context:**


Trong traditional programming languages, extending function behavior typically requires:


1. **Wrapper functions** (higher-order functions)
2. **Function objects/classes** (OOP approach)
3. **Global state** (problematic for encapsulation)


JavaScript's function properties provide elegant alternative:


- **Encapsulation**: State travels với function
- **Introspection**: Code có thể examine function metadata
- **Framework Development**: Enable powerful abstractions
- **Memoization**: Efficient caching mechanisms


💭 **Framework Development Insight**: *Khi building internal frameworks tại Figma, function properties prove invaluable. Instead of maintaining separate metadata stores, chúng tôi attach configuration, cache, và debugging information directly to functions. Điều này creates self-contained, introspectable units của functionality.*


### 🔬 Property vs Variable: Memory Model Deep Dive


**Fundamental Difference Analysis:**


```javascript
// Approach 1: Function Property
function counterWithProperty() {
    return counterWithProperty.count++;
}
counterWithProperty.count = 0;

// Approach 2: Closure Variable
function makeCounterWithClosure() {
    let count = 0;
    return function() {
        return count++;
    };
}
const counterWithClosure = makeCounterWithClosure();

// Memory layout comparison:
/*
Function Property Approach:
┌─────────────────────────────────┐
│ counterWithProperty (Function)  │
├─────────────────────────────────┤
│ [[Call]]: <executable code>     │
│ count: 0 (enumerable property)  │ ← Accessible from outside
│ name: "counterWithProperty"     │
│ length: 0                       │
└─────────────────────────────────┘

Closure Variable Approach:
┌─────────────────────────────────┐
│ counterWithClosure (Function)   │
├─────────────────────────────────┤
│ [[Call]]: <executable code>     │
│ [[Environment]]: {              │
│   count: 0                      │ ← Private, inaccessible
│ }                               │
│ name: ""                        │
│ length: 0                       │
└─────────────────────────────────┘
*/
```


**Access Control Implications:**


```javascript
// Function properties: Public access
function publicCounter() {
    return publicCounter.count++;
}
publicCounter.count = 0;

console.log(publicCounter());     // 0
console.log(publicCounter.count); // 1 (external access possible)
publicCounter.count = 100;        // External modification possible
console.log(publicCounter());     // 100

// Closure variables: Private access
function createPrivateCounter() {
    let count = 0;

    function counter() {
        return count++;
    }

    // Controlled access through methods
    counter.getCount = () => count;
    counter.reset = () => count = 0;
    // count itself remains inaccessible

    return counter;
}

const privateCounter = createPrivateCounter();
console.log(privateCounter());            // 0
console.log(privateCounter.getCount());   // 1
// privateCounter.count is undefined - no direct access
```


💭 **Security Considerations**: *Tại Binance, khi working với financial algorithms, closure-based privacy critical để prevent external tampering với internal state. However, function properties useful cho non-sensitive metadata như performance metrics, configuration flags, và debugging information.*


### ⚙️ Advanced Patterns: Memoization và Caching


**Production-Grade Memoization:**


```javascript
// Sophisticated memoization với function properties
function createMemoizedFunction(fn, options = {}) {
    const {
        maxCacheSize = 100,
        ttl = null,           // Time to live in milliseconds
        keyGenerator = JSON.stringify,
        onCacheHit = null,
        onCacheMiss = null
    } = options;

    function memoized(...args) {
        const key = keyGenerator(args);
        const now = Date.now();

        // Check if cached result exists và is still valid
        if (memoized._cache.has(key)) {
            const cached = memoized._cache.get(key);

            if (!ttl || (now - cached.timestamp) < ttl) {
                memoized._stats.hits++;
                onCacheHit?.(key, cached.value);
                return cached.value;
            } else {
                // Expired entry
                memoized._cache.delete(key);
            }
        }

        // Cache miss - compute result
        memoized._stats.misses++;
        const result = fn.apply(this, args);

        // Store trong cache
        if (memoized._cache.size >= maxCacheSize) {
            // LRU eviction: remove oldest entry
            const firstKey = memoized._cache.keys().next().value;
            memoized._cache.delete(firstKey);
        }

        memoized._cache.set(key, {
            value: result,
            timestamp: now
        });

        onCacheMiss?.(key, result);
        return result;
    }

    // Function properties for cache management
    memoized._cache = new Map();
    memoized._stats = { hits: 0, misses: 0 };
    memoized._options = options;

    // Cache management methods
    memoized.clearCache = () => {
        memoized._cache.clear();
        memoized._stats = { hits: 0, misses: 0 };
    };

    memoized.getCacheStats = () => ({
        ...memoized._stats,
        size: memoized._cache.size,
        hitRate: memoized._stats.hits / (memoized._stats.hits + memoized._stats.misses)
    });

    memoized.deleteCacheEntry = (key) => {
        return memoized._cache.delete(key);
    };

    // Expose original function
    memoized._original = fn;

    return memoized;
}

// Usage example: Expensive calculation
const fibonacci = createMemoizedFunction(
    function fibonacciCalculation(n) {
        if (n <= 1) return n;
        return fibonacciCalculation(n - 1) + fibonacciCalculation(n - 2);
    },
    {
        maxCacheSize: 50,
        ttl: 5000, // 5 seconds
        onCacheHit: (key, value) => console.log(`Cache hit for fib(${key}): ${value}`),
        onCacheMiss: (key, value) => console.log(`Cache miss for fib(${key}): ${value}`)
    }
);

// Performance comparison
console.time('First call');
console.log(fibonacci(35)); // Slow: lots of recursive calls
console.timeEnd('First call');

console.time('Second call');
console.log(fibonacci(35)); // Fast: cached result
console.timeEnd('Second call');

console.log(fibonacci.getCacheStats());
// { hits: 1, misses: 36, size: 36, hitRate: 0.027 }
```


**Distributed Cache Pattern:**


```javascript
// Multi-level caching với function properties (inspired by Binance's architecture)
function createDistributedMemoization(fn, config = {}) {
    const {
        localCacheSize = 50,
        remoteCacheUrl = null,
        fallbackToRemote = true,
        syncInterval = 30000 // 30 seconds
    } = config;

    function distributedMemoized(...args) {
        const key = JSON.stringify(args);

        // Level 1: Local cache check
        if (distributedMemoized._localCache.has(key)) {
            distributedMemoized._stats.localHits++;
            return distributedMemoized._localCache.get(key);
        }

        // Level 2: Remote cache check (if configured)
        if (remoteCacheUrl && fallbackToRemote) {
            const remoteResult = distributedMemoized._checkRemoteCache(key);
            if (remoteResult !== null) {
                distributedMemoized._stats.remoteHits++;
                // Store locally for future access
                distributedMemoized._setLocalCache(key, remoteResult);
                return remoteResult;
            }
        }

        // Level 3: Compute result
        distributedMemoized._stats.computations++;
        const result = fn.apply(this, args);

        // Store trong both caches
        distributedMemoized._setLocalCache(key, result);
        if (remoteCacheUrl) {
            distributedMemoized._setRemoteCache(key, result);
        }

        return result;
    }

    // Cache management properties
    distributedMemoized._localCache = new Map();
    distributedMemoized._stats = {
        localHits: 0,
        remoteHits: 0,
        computations: 0
    };

    // Cache management methods
    distributedMemoized._setLocalCache = (key, value) => {
        if (distributedMemoized._localCache.size >= localCacheSize) {
            const firstKey = distributedMemoized._localCache.keys().next().value;
            distributedMemoized._localCache.delete(firstKey);
        }
        distributedMemoized._localCache.set(key, value);
    };

    distributedMemoized._checkRemoteCache = async (key) => {
        try {
            const response = await fetch(`${remoteCacheUrl}/get/${encodeURIComponent(key)}`);
            return response.ok ? await response.json() : null;
        } catch (error) {
            console.warn('Remote cache error:', error);
            return null;
        }
    };

    distributedMemoized._setRemoteCache = async (key, value) => {
        try {
            await fetch(`${remoteCacheUrl}/set`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key, value })
            });
        } catch (error) {
            console.warn('Remote cache set error:', error);
        }
    };

    // Periodic sync với remote cache
    if (remoteCacheUrl && syncInterval > 0) {
        distributedMemoized._syncTimer = setInterval(() => {
            distributedMemoized._syncWithRemote();
        }, syncInterval);
    }

    distributedMemoized._syncWithRemote = async () => {
        // Implementation for syncing local cache với remote
        // Could involve uploading local entries, downloading popular entries, etc.
    };

    return distributedMemoized;
}
```


💭 **Distributed Systems Experience**: *Tại Binance, caching strategy critical cho high-frequency trading algorithms. Multi-level caching với function properties allows us to transparently layer local memory cache, Redis cluster, và computation fallback, while keeping interface simple cho algorithm developers.*


### 💡 Framework Development Patterns


**Middleware System:**


```javascript
// Express.js inspired middleware system using function properties
function createMiddlewareFunction(handler) {
    function middlewareFunction(req, res, next) {
        // Execute middleware chain
        let currentIndex = 0;

        function runNext(error) {
            if (error) {
                // Error handling
                if (middlewareFunction._errorHandlers.length > 0) {
                    const errorHandler = middlewareFunction._errorHandlers[currentIndex] ||
                                       middlewareFunction._errorHandlers[middlewareFunction._errorHandlers.length - 1];
                    return errorHandler(error, req, res, runNext);
                } else {
                    throw error;
                }
            }

            if (currentIndex >= middlewareFunction._middlewares.length) {
                // All middleware executed, run main handler
                return handler(req, res);
            }

            const currentMiddleware = middlewareFunction._middlewares[currentIndex++];
            currentMiddleware(req, res, runNext);
        }

        runNext();
    }

    // Function properties for middleware management
    middlewareFunction._middlewares = [];
    middlewareFunction._errorHandlers = [];
    middlewareFunction._config = {
        timeout: 5000,
        retries: 3,
        circuitBreaker: false
    };

    // Middleware management methods
    middlewareFunction.use = function(middleware) {
        if (typeof middleware !== 'function') {
            throw new Error('Middleware must be a function');
        }
        this._middlewares.push(middleware);
        return this; // Chainable
    };

    middlewareFunction.onError = function(errorHandler) {
        this._errorHandlers.push(errorHandler);
        return this;
    };

    middlewareFunction.configure = function(config) {
        Object.assign(this._config, config);
        return this;
    };

    middlewareFunction.getMiddlewares = function() {
        return [...this._middlewares]; // Return copy
    };

    middlewareFunction.removeMiddleware = function(middleware) {
        const index = this._middlewares.indexOf(middleware);
        if (index > -1) {
            this._middlewares.splice(index, 1);
        }
        return this;
    };

    return middlewareFunction;
}

// Usage example
const apiEndpoint = createMiddlewareFunction((req, res) => {
    res.json({ message: 'Success', data: req.processedData });
});

// Build middleware chain
apiEndpoint
    .use((req, res, next) => {
        // Authentication middleware
        if (!req.headers.authorization) {
            return next(new Error('Authorization required'));
        }
        req.user = { id: 1, name: 'User' };
        next();
    })
    .use((req, res, next) => {
        // Validation middleware
        if (!req.body || !req.body.data) {
            return next(new Error('Invalid request body'));
        }
        req.processedData = processData(req.body.data);
        next();
    })
    .use((req, res, next) => {
        // Logging middleware
        console.log(`${req.method} ${req.url} - User: ${req.user.id}`);
        next();
    })
    .onError((error, req, res, next) => {
        // Error handler
        res.status(400).json({ error: error.message });
    })
    .configure({
        timeout: 10000,
        retries: 1
    });

function processData(data) {
    // Mock data processing
    return { processed: true, timestamp: Date.now(), original: data };
}
```


**Plugin Architecture:**


```javascript
// Plugin system inspired by Webpack's plugin architecture
function createPluginHost(mainFunction) {
    function pluginHost(...args) {
        // Execute pre-hooks
        pluginHost._executeHooks('before', args);

        try {
            // Execute main function
            const result = mainFunction.apply(this, args);

            // Execute post-hooks với result
            pluginHost._executeHooks('after', args, result);

            return result;
        } catch (error) {
            // Execute error hooks
            pluginHost._executeHooks('error', args, error);
            throw error;
        } finally {
            // Execute cleanup hooks
            pluginHost._executeHooks('finally', args);
        }
    }

    // Plugin management properties
    pluginHost._plugins = new Map();
    pluginHost._hooks = {
        before: [],
        after: [],
        error: [],
        finally: []
    };

    // Plugin management methods
    pluginHost.addPlugin = function(name, plugin) {
        if (this._plugins.has(name)) {
            throw new Error(`Plugin '${name}' already exists`);
        }

        this._plugins.set(name, plugin);

        // Register plugin hooks
        if (plugin.hooks) {
            Object.keys(plugin.hooks).forEach(hookType => {
                if (this._hooks[hookType]) {
                    this._hooks[hookType].push({
                        plugin: name,
                        handler: plugin.hooks[hookType]
                    });
                }
            });
        }

        // Call plugin initialization
        if (plugin.init) {
            plugin.init(this);
        }

        return this;
    };

    pluginHost.removePlugin = function(name) {
        const plugin = this._plugins.get(name);
        if (!plugin) return false;

        // Remove plugin hooks
        Object.keys(this._hooks).forEach(hookType => {
            this._hooks[hookType] = this._hooks[hookType].filter(
                hook => hook.plugin !== name
            );
        });

        // Call plugin cleanup
        if (plugin.destroy) {
            plugin.destroy(this);
        }

        this._plugins.delete(name);
        return true;
    };

    pluginHost.getPlugin = function(name) {
        return this._plugins.get(name);
    };

    pluginHost.listPlugins = function() {
        return Array.from(this._plugins.keys());
    };

    pluginHost._executeHooks = function(hookType, args, extra) {
        this._hooks[hookType].forEach(hook => {
            try {
                hook.handler(args, extra);
            } catch (error) {
                console.error(`Error in ${hook.plugin} ${hookType} hook:`, error);
            }
        });
    };

    return pluginHost;
}

// Usage example: Extensible data processor
const dataProcessor = createPluginHost(function processData(data) {
    // Core processing logic
    return {
        processed: true,
        data: data.map(item => item.toUpperCase()),
        timestamp: Date.now()
    };
});

// Add plugins
dataProcessor
    .addPlugin('validator', {
        hooks: {
            before: (args) => {
                const [data] = args;
                if (!Array.isArray(data)) {
                    throw new Error('Data must be an array');
                }
            }
        },
        init: (host) => console.log('Validator plugin initialized'),
        destroy: (host) => console.log('Validator plugin destroyed')
    })
    .addPlugin('logger', {
        hooks: {
            before: (args) => console.log('Processing started:', args[0].length, 'items'),
            after: (args, result) => console.log('Processing completed:', result.data.length, 'items'),
            error: (args, error) => console.error('Processing error:', error.message),
            finally: (args) => console.log('Processing finished')
        }
    })
    .addPlugin('cache', {
        hooks: {
            before: (args) => {
                // Check cache before processing
                const key = JSON.stringify(args[0]);
                if (this.cache && this.cache.has(key)) {
                    throw new CacheHitError(this.cache.get(key));
                }
            },
            after: (args, result) => {
                // Store result trong cache
                const key = JSON.stringify(args[0]);
                if (!this.cache) this.cache = new Map();
                this.cache.set(key, result);
            }
        },
        init: function(host) {
            this.cache = new Map();
        }
    });

// Test the plugin system
try {
    const result = dataProcessor(['hello', 'world', 'javascript']);
    console.log('Result:', result);
} catch (error) {
    console.error('Error:', error.message);
}
```


💭 **Plugin Architecture Experience**: *Tại Webflow, chúng tôi extensively use plugin patterns để allow third-party integrations với our design system. Function properties provide perfect foundation for plugin metadata, hook registration, và lifecycle management. Pattern này scales beautifully from simple extensions to complex plugin ecosystems.*


---


## 📖 PHẦN V: NAMED FUNCTION EXPRESSIONS (NFE) - SELF-REFERENCE MASTERY


### 🌱 Nguồn Gốc: The Self-Reference Problem


**Core Problem Solved by NFE:**


```javascript
// Problem scenario: Function reassignment breaks recursive calls
let factorial = function(n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);  // ← Dangerous: relies on external variable
};

// What happens when function is reassigned?
let temp = factorial;
factorial = null;  // Or reassigned to different function

// Now this breaks:
temp(5);  // Error: factorial is not a function

// NFE Solution:
let factorial = function fact(n) {
    if (n <= 1) return 1;
    return n * fact(n - 1);  // ← Safe: uses internal name
};

let temp = factorial;
factorial = null;
temp(5);  // Works! Returns 120
```


**Historical Context & Motivation:**


Trong early JavaScript development, developers encountered several issues:


1. **Debugging Nightmare**: Anonymous functions trong stack traces
2. **Reassignment Bugs**: Functions losing reference to themselves
3. **Recursive Challenges**: Self-calling functions breaking when moved
4. **Code Maintenance**: Difficult to track function behavior trong complex apps


💭 **Real-World Debugging Experience**: *Tại NAB, chúng tôi had complex financial calculation system với nested recursive functions. Khi functions được dynamically reassigned based on market conditions, recursive calls would break mysteriously. NFE pattern saved us countless debugging hours by providing stable internal references.*


### 🔬 NFE Scope và Binding Mechanism


**Internal Name Binding Rules:**


```javascript
// NFE creates special binding scope
let outer = function inner(x) {
    console.log('Function name:', inner.name);  // "inner"

    // inner is available inside function body
    if (x > 0) {
        return inner(x - 1);  // Safe self-reference
    }

    return x;
};

// But inner is NOT available outside
console.log(outer.name);  // "inner" (still accessible via .name property)
// console.log(inner);    // ReferenceError: inner is not defined

// Scope analysis:
/*
Global Scope:
├── outer: function reference
└── [inner is NOT defined here]

Function Execution Scope:
├── x: parameter
├── inner: function reference (same as outer)
└── [special NFE binding]
*/
```


**Binding Precedence và Edge Cases:**


```javascript
// Edge Case 1: Name collision với parameters
let func = function inner(inner) {  // Parameter named 'inner'
    console.log(typeof inner);      // "number" (parameter wins)

    // How to access function itself?
    console.log(arguments.callee.name);  // "inner" (deprecated approach)

    // Better approach: use different names
};
func(42);

// Edge Case 2: Name collision với local variables
let func2 = function helper() {
    let helper = "I'm a variable";  // Local variable
    console.log(helper);            // "I'm a variable" (variable wins)

    // Function reference is shadowed!
    // return helper();  // Error: helper is not a function
};

// Edge Case 3: Arrow functions cannot be NFE
let arrowFunc = (x) => {
    // return arrowFunc(x - 1);  // Must rely on external reference
};

// Edge Case 4: Method definitions và NFE
const obj = {
    method: function methodName() {
        // methodName available inside
        return typeof methodName;  // "function"
    },

    shorthand() {
        // Function name is "shorthand", available internally
        return typeof shorthand;   // "function"
    }
};
```


💭 **Scope Resolution Deep Dive**: *Understanding NFE scope resolution crucial cho avoiding subtle bugs. Tại Figma, chúng tôi encountered issues where developers accidentally shadowed NFE names với local variables, breaking recursive logic. Code review guidelines now explicitly check for such patterns.*


### ⚙️ Advanced NFE Patterns


**Conditional Self-Reference:**


```javascript
// Pattern: Conditional behavior với NFE
function createConditionalProcessor(condition) {
    return function conditionalProcessor(data) {
        // Process current item
        const processed = processItem(data);

        // Conditionally continue processing
        if (condition(processed)) {
            // Safe self-reference cho continued processing
            return conditionalProcessor(getNextData(processed));
        }

        return processed;
    };
}

function processItem(data) {
    return { ...data, processed: true, timestamp: Date.now() };
}

function getNextData(current) {
    return { id: current.id + 1, value: current.value * 2 };
}

// Usage
const processor = createConditionalProcessor(
    data => data.id < 5  // Continue until id reaches 5
);

const result = processor({ id: 1, value: 10 });
console.log(result);  // Final processed data after recursive calls
```


**NFE for Event Handlers:**


```javascript
// Pattern: Self-cleaning event handlers with NFE
function createSelfCleaningHandler(element, eventType, options = {}) {
    const {
        maxExecutions = Infinity,
        timeout = null,
        condition = () => true
    } = options;

    let executionCount = 0;
    let timeoutId = null;

    const handler = function selfCleaningHandler(event) {
        executionCount++;

        // Check if handler should continue
        if (!condition(event) || executionCount >= maxExecutions) {
            // Clean up: remove event listener
            element.removeEventListener(eventType, selfCleaningHandler);

            if (timeoutId) {
                clearTimeout(timeoutId);
            }

            console.log(`Handler removed after ${executionCount} executions`);
            return;
        }

        // Handle the event
        console.log(`Event handled: ${eventType}, execution #${executionCount}`);

        // Set timeout for automatic cleanup if specified
        if (timeout && !timeoutId) {
            timeoutId = setTimeout(() => {
                element.removeEventListener(eventType, selfCleaningHandler);
                console.log('Handler removed due to timeout');
            }, timeout);
        }
    };

    element.addEventListener(eventType, handler);
    return handler;  // Return reference for manual cleanup if needed
}

// Usage example
const button = document.createElement('button');
document.body.appendChild(button);

const clickHandler = createSelfCleaningHandler(button, 'click', {
    maxExecutions: 3,  // Remove after 3 clicks
    timeout: 5000,     // Or remove after 5 seconds
    condition: (e) => !e.shiftKey  // Don't count shift+clicks
});
```


💭 **Event Handler Management**: *Tại web applications, memory leaks from event handlers common problem. NFE pattern cho self-cleaning handlers incredibly useful, đặc biệt trong dynamic UI systems như Webflow's editor where elements frequently added/removed.*


**NFE in Module Patterns:**


```javascript
// Pattern: Module với internal NFE methods
function createAdvancedModule(config) {
    const state = { ...config };

    // Private NFE methods
    const module = {
        // Public method using NFE for safe recursion
        processData: function processDataMethod(data, depth = 0) {
            if (depth > 10) {
                throw new Error('Maximum recursion depth exceeded');
            }

            // Process current level
            const processed = transformData(data);

            // Recursively process nested data
            if (processed.children && processed.children.length > 0) {
                processed.children = processed.children.map(child =>
                    processDataMethod(child, depth + 1)
                );
            }

            return processed;
        },

        // Public method với NFE for retry logic
        fetchWithRetry: function fetchWithRetryMethod(url, options = {}) {
            const { maxRetries = 3, delay = 1000 } = options;
            let attempt = 0;

            return function attemptFetch() {
                attempt++;

                return fetch(url, options)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`HTTP ${response.status}`);
                        }
                        return response.json();
                    })
                    .catch(error => {
                        if (attempt < maxRetries) {
                            console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
                            return new Promise(resolve => {
                                setTimeout(() => {
                                    resolve(attemptFetch());  // Safe self-reference
                                }, delay);
                            });
                        }
                        throw error;
                    });
            }();
        }
    };

    function transformData(data) {
        return {
            ...data,
            transformed: true,
            timestamp: Date.now(),
            id: generateId()
        };
    }

    function generateId() {
        return Math.random().toString(36).substr(2, 9);
    }

    return module;
}

// Usage
const dataModule = createAdvancedModule({ apiUrl: 'https://api.example.com' });

// Nested data processing với safe recursion
const nestedData = {
    name: 'root',
    children: [
        {
            name: 'child1',
            children: [
                { name: 'grandchild1' },
                { name: 'grandchild2' }
            ]
        },
        { name: 'child2' }
    ]
};

const processedData = dataModule.processData(nestedData);
console.log(JSON.stringify(processedData, null, 2));
```


### 💡 Performance và Memory Considerations


**Memory Footprint Analysis:**


```javascript
// Memory comparison: NFE vs Regular function expressions
function memoryAnalysis() {
    // Regular function expression
    const regularFunctions = [];
    for (let i = 0; i < 1000; i++) {
        regularFunctions.push(function(x) {
            return x * 2;
        });
    }

    // Named function expressions
    const namedFunctions = [];
    for (let i = 0; i < 1000; i++) {
        namedFunctions.push(function namedFn(x) {
            return x * 2;
        });
    }

    // NFE có slightly higher memory footprint due to:
    // 1. Additional name binding trong internal scope
    // 2. Extra property descriptors
    // 3. Engine-specific optimizations may differ

    // However, benefits usually outweigh costs:
    // - Better debugging experience
    // - Safer recursive calls
    // - Clearer stack traces
}

// Performance optimization techniques
function createOptimizedNFE(baseFunction) {
    // Technique 1: Reuse NFE across multiple calls
    const cache = new Map();

    return function optimizedNFE(...args) {
        const key = JSON.stringify(args);

        if (cache.has(key)) {
            return cache.get(key);
        }

        const result = baseFunction.apply(this, args);

        // Self-reference for cache cleanup
        if (cache.size > 100) {  // Max cache size
            const firstKey = cache.keys().next().value;
            cache.delete(firstKey);
        }

        cache.set(key, result);
        return result;
    };
}

// Technique 2: Lazy NFE evaluation
function createLazyNFE(factory) {
    let nfe = null;

    return function lazyWrapper(...args) {
        if (!nfe) {
            nfe = factory();  // Create NFE only when needed
        }
        return nfe.apply(this, args);
    };
}
```


💭 **Performance Profiling Experience**: *Tại high-frequency trading systems ở Binance, every nanosecond matters. Through extensive profiling, discovered rằng NFE overhead negligible compared to benefits trong error tracking và debugging. Modern JavaScript engines optimize NFE very efficiently.*


---


## 📖 PHẦN VI: PRODUCTION ENGINEERING - REAL-WORLD APPLICATIONS


### 🏭 Enterprise-Scale Function Design Patterns


**Function Factory với Metadata:**


```javascript
// Pattern used at Binance for creating trading algorithm functions
function createTradingAlgorithm(algorithmConfig) {
    const {
        name,
        version,
        author,
        riskThreshold,
        instruments,
        timeframe,
        parameters
    } = algorithmConfig;

    // Main algorithm function với comprehensive metadata
    const algorithm = function tradingAlgorithm(marketData) {
        // Validate input data
        if (!algorithm._validateMarketData(marketData)) {
            throw new Error('Invalid market data provided');
        }

        // Apply risk management
        if (algorithm._calculateRisk(marketData) > riskThreshold) {
            return { action: 'HOLD', reason: 'Risk threshold exceeded' };
        }

        // Execute core algorithm logic
        const signal = algorithm._generateSignal(marketData);

        // Log execution for audit trail
        algorithm._logExecution(marketData, signal);

        return signal;
    };

    // Attach comprehensive metadata
    algorithm.metadata = {
        name,
        version,
        author,
        createdAt: new Date(),
        instruments: [...instruments],
        timeframe,
        riskThreshold,
        parameters: { ...parameters }
    };

    // Attach performance tracking
    algorithm.performance = {
        totalExecutions: 0,
        successfulExecutions: 0,
        averageExecutionTime: 0,
        lastExecutionTime: null,
        errors: []
    };

    // Attach configuration management
    algorithm.config = {
        current: { ...parameters },
        history: [],

        update: function(newParams) {
            this.history.push({
                previous: { ...this.current },
                updated: { ...newParams },
                timestamp: new Date()
            });
            Object.assign(this.current, newParams);
        },

        rollback: function() {
            if (this.history.length > 0) {
                const lastChange = this.history.pop();
                this.current = { ...lastChange.previous };
                return true;
            }
            return false;
        }
    };

    // Internal methods
    algorithm._validateMarketData = function(data) {
        return data &&
               typeof data.price === 'number' &&
               typeof data.volume === 'number' &&
               data.timestamp instanceof Date;
    };

    algorithm._calculateRisk = function(data) {
        // Simplified risk calculation
        const volatility = this._calculateVolatility(data);
        const positionSize = this.config.current.positionSize || 0.1;
        return volatility * positionSize;
    };

    algorithm._calculateVolatility = function(data) {
        // Mock volatility calculation
        return Math.abs(data.price - (data.previousPrice || data.price)) / data.price;
    };

    algorithm._generateSignal = function(data) {
        const startTime = performance.now();

        try {
            // Core algorithm logic would go here
            const signal = {
                action: data.price > this.config.current.buyThreshold ? 'BUY' : 'SELL',
                confidence: Math.random(),
                price: data.price,
                timestamp: data.timestamp
            };

            // Update performance metrics
            this.performance.totalExecutions++;
            this.performance.successfulExecutions++;

            const executionTime = performance.now() - startTime;
            this.performance.averageExecutionTime =
                (this.performance.averageExecutionTime * (this.performance.totalExecutions - 1) + executionTime) /
                this.performance.totalExecutions;

            this.performance.lastExecutionTime = executionTime;

            return signal;
        } catch (error) {
            this.performance.totalExecutions++;
            this.performance.errors.push({
                error: error.message,
                timestamp: new Date(),
                marketData: data
            });
            throw error;
        }
    };

    algorithm._logExecution = function(input, output) {
        // In production, this would write to audit logs
        console.log(`Algorithm ${this.metadata.name} executed:`, {
            input: { price: input.price, volume: input.volume },
            output: output.action,
            timestamp: new Date()
        });
    };

    // Administrative methods
    algorithm.getStats = function() {
        return {
            metadata: { ...this.metadata },
            performance: { ...this.performance },
            currentConfig: { ...this.config.current }
        };
    };

    algorithm.export = function() {
        return {
            metadata: this.metadata,
            config: this.config.current,
            performance: this.performance,
            source: this.toString()
        };
    };

    return algorithm;
}

// Usage trong trading system
const momentumAlgorithm = createTradingAlgorithm({
    name: 'Momentum Strategy v2.1',
    version: '2.1.0',
    author: 'Trading Team',
    riskThreshold: 0.05,
    instruments: ['BTCUSDT', 'ETHUSDT'],
    timeframe: '1m',
    parameters: {
        buyThreshold: 50000,
        sellThreshold: 45000,
        positionSize: 0.1
    }
});

// Test the algorithm
const marketData = {
    price: 51000,
    previousPrice: 50500,
    volume: 1000000,
    timestamp: new Date()
};

const signal = momentumAlgorithm(marketData);
console.log('Trading signal:', signal);
console.log('Algorithm stats:', momentumAlgorithm.getStats());

// Configuration management
momentumAlgorithm.config.update({ buyThreshold: 52000 });
console.log('Updated config:', momentumAlgorithm.config.current);
```


💭 **Financial Systems Architecture**: *Tại Binance, function metadata pattern critical cho compliance và auditing. Regulatory requirements demand full traceability của algorithm behavior, parameter changes, và execution history. Function properties provide elegant solution để embed all necessary metadata directly trong executable code.*


### 🛠️ Debug và Development Tools


**Comprehensive Function Inspector:**


```javascript
// Advanced debugging tool inspired by Chrome DevTools
class Function
```


## Claude


```javascript
// Advanced debugging tool inspired by Chrome DevTools
class FunctionInspector {
   static inspect(fn, options = {}) {
       const {
           includeSource = true,
           analyzeComplexity = true,
           trackPerformance = false,
           enableProfiling = false
       } = options;

       const inspection = {
           basic: this._getBasicInfo(fn),
           properties: this._getCustomProperties(fn),
           prototype: this._getPrototypeInfo(fn),
           scope: this._getScopeInfo(fn),
           source: includeSource ? this._getSourceInfo(fn) : null,
           complexity: analyzeComplexity ? this._analyzeComplexity(fn) : null,
           performance: trackPerformance ? this._createPerformanceTracker(fn) : null
       };

       if (enableProfiling) {
           inspection.profiler = this._createProfiler(fn);
       }

       return inspection;
   }

   static _getBasicInfo(fn) {
       return {
           name: fn.name || '<anonymous>',
           length: fn.length,
           type: this._getFunctionType(fn),
           constructor: fn.constructor.name,
           isNative: this._isNativeFunction(fn),
           isAsync: this._isAsyncFunction(fn),
           isGenerator: this._isGeneratorFunction(fn),
           isArrow: this._isArrowFunction(fn)
       };
   }

   static _getFunctionType(fn) {
       const source = fn.toString();
       if (source.includes('function*')) return 'generator';
       if (source.startsWith('async')) return 'async';
       if (source.includes('=>')) return 'arrow';
       if (source.startsWith('class')) return 'class';
       return 'regular';
   }

   static _isNativeFunction(fn) {
       return fn.toString().includes('[native code]');
   }

   static _isAsyncFunction(fn) {
       return fn.constructor.name === 'AsyncFunction';
   }

   static _isGeneratorFunction(fn) {
       return fn.constructor.name === 'GeneratorFunction';
   }

   static _isArrowFunction(fn) {
       return !fn.hasOwnProperty('prototype') && fn.toString().includes('=>');
   }

   static _getCustomProperties(fn) {
       const properties = {};
       const descriptors = {};

       // Get own properties
       Object.getOwnPropertyNames(fn).forEach(prop => {
           if (!['length', 'name', 'prototype', 'constructor'].includes(prop)) {
               properties[prop] = fn[prop];
               descriptors[prop] = Object.getOwnPropertyDescriptor(fn, prop);
           }
       });

       // Get symbol properties
       Object.getOwnPropertySymbols(fn).forEach(symbol => {
           properties[symbol.toString()] = fn[symbol];
           descriptors[symbol.toString()] = Object.getOwnPropertyDescriptor(fn, symbol);
       });

       return { properties, descriptors };
   }

   static _getPrototypeInfo(fn) {
       if (!fn.prototype) return null;

       return {
           exists: true,
           constructor: fn.prototype.constructor === fn,
           methods: Object.getOwnPropertyNames(fn.prototype)
               .filter(prop => prop !== 'constructor')
               .map(prop => ({
                   name: prop,
                   type: typeof fn.prototype[prop],
                   descriptor: Object.getOwnPropertyDescriptor(fn.prototype, prop)
               }))
       };
   }

   static _getScopeInfo(fn) {
       // Limited scope analysis từ function source
       const source = fn.toString();
       const params = this._extractParameters(source);
       const variables = this._extractVariables(source);
       const closures = this._detectClosures(source);

       return {
           parameters: params,
           localVariables: variables,
           possibleClosures: closures,
           usesThis: source.includes('this.'),
           usesArguments: source.includes('arguments'),
           usesSuper: source.includes('super.')
       };
   }

   static _extractParameters(source) {
       const match = source.match(/\(([^)]*)\)/);
       if (!match) return [];

       return match[1].split(',').map(param => {
           const trimmed = param.trim();
           return {
               name: trimmed.split('=')[0].trim().replace(/[{}[\]]/g, ''),
               hasDefault: trimmed.includes('='),
               isDestructured: trimmed.includes('{') || trimmed.includes('['),
               isRest: trimmed.startsWith('...')
           };
       }).filter(param => param.name);
   }

   static _extractVariables(source) {
       const declarations = [];
       const patterns = [
           /\b(?:var|let|const)\s+(\w+)/g,
           /\bfunction\s+(\w+)/g
       ];

       patterns.forEach(pattern => {
           let match;
           while ((match = pattern.exec(source)) !== null) {
               declarations.push(match[1]);
           }
       });

       return [...new Set(declarations)];
   }

   static _detectClosures(source) {
       // Heuristic detection của possible closure usage
       const externalRefs = [];
       const variablePattern = /\b(\w+)\b/g;
       let match;

       while ((match = variablePattern.exec(source)) !== null) {
           const variable = match[1];
           // Skip keywords, built-ins, etc.
           if (!this._isKeywordOrBuiltin(variable)) {
               externalRefs.push(variable);
           }
       }

       return [...new Set(externalRefs)];
   }

   static _isKeywordOrBuiltin(word) {
       const keywords = [
           'function', 'return', 'if', 'else', 'for', 'while', 'do', 'switch',
           'case', 'default', 'break', 'continue', 'try', 'catch', 'finally',
           'throw', 'var', 'let', 'const', 'true', 'false', 'null', 'undefined',
           'console', 'window', 'document', 'this', 'arguments', 'super'
       ];
       return keywords.includes(word);
   }

   static _getSourceInfo(fn) {
       const source = fn.toString();
       return {
           source,
           lines: source.split('\n').length,
           characters: source.length,
           formatted: this._formatSource(source)
       };
   }

   static _formatSource(source) {
       // Basic source formatting
       return source
           .split('\n')
           .map((line, index) => `${(index + 1).toString().padStart(3, ' ')} | ${line}`)
           .join('\n');
   }

   static _analyzeComplexity(fn) {
       const source = fn.toString();

       // Cyclomatic complexity calculation
       const complexityMarkers = [
           'if', 'else', 'while', 'for', 'do', 'switch', 'case',
           '&&', '||', '?', 'catch', 'finally'
       ];

       let complexity = 1; // Base complexity
       complexityMarkers.forEach(marker => {
           const matches = source.match(new RegExp(`\\b${marker}\\b`, 'g'));
           if (matches) complexity += matches.length;
       });

       return {
           cyclomatic: complexity,
           level: this._getComplexityLevel(complexity),
           recommendations: this._getComplexityRecommendations(complexity)
       };
   }

   static _getComplexityLevel(complexity) {
       if (complexity <= 5) return 'Low';
       if (complexity <= 10) return 'Medium';
       if (complexity <= 20) return 'High';
       return 'Very High';
   }

   static _getComplexityRecommendations(complexity) {
       if (complexity <= 5) return ['Function complexity is good'];
       if (complexity <= 10) return ['Consider breaking into smaller functions'];
       if (complexity <= 20) return ['Refactor recommended', 'Break into multiple functions'];
       return ['Urgent refactoring needed', 'Very difficult to test and maintain'];
   }

   static _createPerformanceTracker(fn) {
       const stats = {
           calls: 0,
           totalTime: 0,
           averageTime: 0,
           minTime: Infinity,
           maxTime: 0,
           errors: 0
       };

       return function performanceWrapper(...args) {
           const startTime = performance.now();
           stats.calls++;

           try {
               const result = fn.apply(this, args);

               const duration = performance.now() - startTime;
               stats.totalTime += duration;
               stats.averageTime = stats.totalTime / stats.calls;
               stats.minTime = Math.min(stats.minTime, duration);
               stats.maxTime = Math.max(stats.maxTime, duration);

               return result;
           } catch (error) {
               stats.errors++;
               throw error;
           }
       };
   }

   static _createProfiler(fn) {
       const callStack = [];
       const profile = {
           calls: [],
           timeline: [],
           memory: []
       };

       return function profiledWrapper(...args) {
           const callId = Date.now() + Math.random();
           const startTime = performance.now();
           const startMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;

           callStack.push({
               id: callId,
               function: fn.name,
               args: args.length,
               startTime
           });

           try {
               const result = fn.apply(this, args);

               const endTime = performance.now();
               const endMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
               const duration = endTime - startTime;

               profile.calls.push({
                   id: callId,
                   duration,
                   memory: endMemory - startMemory,
                   success: true
               });

               profile.timeline.push({
                   type: 'call',
                   function: fn.name,
                   start: startTime,
                   end: endTime,
                   duration
               });

               callStack.pop();
               return result;
           } catch (error) {
               profile.calls.push({
                   id: callId,
                   error: error.message,
                   success: false
               });

               callStack.pop();
               throw error;
           }
       };
   }

   // Utility methods for enhanced debugging
   static createWatchpoint(fn, property) {
       if (!fn.hasOwnProperty(property)) {
           fn[property] = undefined;
       }

       let value = fn[property];

       Object.defineProperty(fn, property, {
           get() {
               console.log(`Reading ${fn.name}.${property}:`, value);
               return value;
           },
           set(newValue) {
               console.log(`Writing ${fn.name}.${property}:`, value, '->', newValue);
               console.trace('Property change stack trace:');
               value = newValue;
           },
           enumerable: true,
           configurable: true
       });
   }

   static createBreakpoint(fn, condition = () => true) {
       const original = fn.toString();

       return function breakpointWrapper(...args) {
           if (condition.apply(this, args)) {
               console.log('🔴 Breakpoint hit:', fn.name);
               console.log('Arguments:', args);
               console.log('Context:', this);
               console.trace('Call stack:');

               // In browser, this would trigger debugger
               if (typeof debugger !== 'undefined') {
                   debugger;
               }
           }

           return fn.apply(this, args);
       };
   }
}

// Usage examples trong development environment
function exampleFunction(a, b = 10, ...rest) {
   let localVar = a + b;

   if (localVar > 15) {
       for (let i = 0; i < rest.length; i++) {
           localVar += rest[i];
       }
   }

   return localVar;
}

// Add custom properties
exampleFunction.version = '1.0.0';
exampleFunction.author = 'Development Team';
exampleFunction.cache = new Map();

// Comprehensive inspection
const inspection = FunctionInspector.inspect(exampleFunction, {
   includeSource: true,
   analyzeComplexity: true,
   trackPerformance: true,
   enableProfiling: true
});

console.log('Function Inspection Report:');
console.log(JSON.stringify(inspection, null, 2));

// Create watchpoint on custom property
FunctionInspector.createWatchpoint(exampleFunction, 'cache');

// Test function with performance tracking
const trackedFunction = inspection.performance;
if (trackedFunction) {
   trackedFunction(5, 15, 1, 2, 3);
   trackedFunction(10, 20, 4, 5, 6);
   console.log('Performance stats:', trackedFunction.stats);
}
```


💭 **Development Tools Philosophy**: *Tại Figma, building sophisticated debugging tools essential cho maintaining code quality across large engineering team. Function inspection patterns like này allow developers to understand complex function behavior, identify performance bottlenecks, và debug issues more effectively. Investment trong tooling pays dividends trong developer productivity.*


### 🚀 Performance Optimization Patterns


**Function Pool Pattern:**


```javascript
// High-performance function pooling for memory-constrained environments
class FunctionPool {
    constructor(factory, options = {}) {
        this.factory = factory;
        this.options = {
            initialSize: 5,
            maxSize: 50,
            warmupOnCreate: true,
            enableMetrics: false,
            ...options
        };

        this.available = [];
        this.inUse = new Set();
        this.metrics = {
            created: 0,
            borrowed: 0,
            returned: 0,
            peakUsage: 0,
            avgBorrowTime: 0
        };

        this._initialize();
    }

    _initialize() {
        // Pre-create initial pool
        for (let i = 0; i < this.options.initialSize; i++) {
            const fn = this._createPooledFunction();
            this.available.push(fn);
        }

        if (this.options.warmupOnCreate) {
            this._warmupPool();
        }
    }

    _createPooledFunction() {
        const fn = this.factory();

        // Add pool metadata
        fn._poolMetadata = {
            id: this.metrics.created++,
            createdAt: Date.now(),
            borrowCount: 0,
            totalBorrowTime: 0,
            lastBorrowedAt: null,
            lastReturnedAt: null
        };

        // Wrap function với pool tracking
        const pooledFn = function pooledWrapper(...args) {
            const startTime = performance.now();

            try {
                const result = fn.apply(this, args);

                if (pooledFn._poolMetadata) {
                    pooledFn._poolMetadata.totalBorrowTime += performance.now() - startTime;
                }

                return result;
            } catch (error) {
                // Ensure function is returned to pool even on error
                if (this.inUse.has(pooledFn)) {
                    this.return(pooledFn);
                }
                throw error;
            }
        }.bind(this);

        // Copy metadata
        pooledFn._poolMetadata = fn._poolMetadata;
        pooledFn._originalFunction = fn;

        return pooledFn;
    }

    _warmupPool() {
        // Execute each function once để optimize JIT compilation
        this.available.forEach(fn => {
            try {
                fn._originalFunction(); // Call với no arguments for warmup
            } catch (error) {
                // Ignore warmup errors
            }
        });
    }

    borrow() {
        let fn;

        if (this.available.length > 0) {
            fn = this.available.pop();
        } else if (this.inUse.size < this.options.maxSize) {
            fn = this._createPooledFunction();
        } else {
            throw new Error('Function pool exhausted');
        }

        // Update metadata
        fn._poolMetadata.borrowCount++;
        fn._poolMetadata.lastBorrowedAt = Date.now();

        this.inUse.add(fn);
        this.metrics.borrowed++;
        this.metrics.peakUsage = Math.max(this.metrics.peakUsage, this.inUse.size);

        return fn;
    }

    return(fn) {
        if (!this.inUse.has(fn)) {
            console.warn('Attempting to return function not in use');
            return false;
        }

        this.inUse.delete(fn);
        this.available.push(fn);

        // Update metadata
        fn._poolMetadata.lastReturnedAt = Date.now();
        this.metrics.returned++;

        // Calculate average borrow time
        if (fn._poolMetadata.lastBorrowedAt) {
            const borrowDuration = fn._poolMetadata.lastReturnedAt - fn._poolMetadata.lastBorrowedAt;
            this.metrics.avgBorrowTime =
                (this.metrics.avgBorrowTime * (this.metrics.returned - 1) + borrowDuration) /
                this.metrics.returned;
        }

        return true;
    }

    drain() {
        this.available.length = 0;
        this.inUse.clear();
    }

    getStats() {
        return {
            ...this.metrics,
            currentAvailable: this.available.length,
            currentInUse: this.inUse.size,
            utilizationRate: this.inUse.size / (this.available.length + this.inUse.size)
        };
    }
}

// Usage trong high-frequency scenarios
const calculationPool = new FunctionPool(
    () => function heavyCalculation(data) {
        // Expensive computation
        let result = 0;
        for (let i = 0; i < data.length; i++) {
            result += Math.sqrt(data[i]) * Math.sin(data[i]);
        }
        return result;
    },
    {
        initialSize: 10,
        maxSize: 100,
        warmupOnCreate: true,
        enableMetrics: true
    }
);

// High-frequency usage pattern
async function processHighVolumeData(datasets) {
    const results = [];

    for (const dataset of datasets) {
        const calculator = calculationPool.borrow();

        try {
            const result = calculator(dataset);
            results.push(result);
        } finally {
            calculationPool.return(calculator);
        }
    }

    return results;
}
```


**JIT Optimization Patterns:**


```javascript
// Patterns để optimize V8 JIT compilation
class JITOptimizer {
    // Pattern 1: Monomorphic function shapes
    static createMonomorphicFunction(expectedShape) {
        return function monomorphicProcessor(data) {
            // Ensure consistent object shape to help V8 optimization
            if (!this._validateShape(data, expectedShape)) {
                throw new Error('Data shape mismatch - JIT optimization broken');
            }

            // Optimized processing cho known shape
            return this._processKnownShape(data);
        };
    }

    // Pattern 2: Avoiding deoptimization triggers
    static createStableFunction(processor) {
        return function stableWrapper(input) {
            // Avoid common deoptimization triggers:

            // 1. Consistent parameter types
            if (typeof input !== 'number') {
                return processor(Number(input)); // Type conversion outside hot path
            }

            // 2. Avoid changing function behavior
            if (!stableWrapper._optimized) {
                // Initial setup phase
                stableWrapper._optimized = true;
                return processor(input);
            }

            // 3. Consistent object shapes
            return processor(input);
        };
    }

    // Pattern 3: Inline cache optimization
    static createCachedAccessor(object, property) {
        // Pre-warm inline caches
        const warmupValue = object[property];

        return function optimizedAccessor() {
            // Consistent property access pattern helps V8 inline caching
            return object[property];
        };
    }

    // Pattern 4: Hidden class optimization
    static createObjectFactory(template) {
        return function optimizedFactory(data) {
            // Create objects với consistent property order
            const obj = {};

            // Add properties trong same order as template
            Object.keys(template).forEach(key => {
                obj[key] = data[key] !== undefined ? data[key] : template[key];
            });

            return obj;
        };
    }
}

// Real-world optimization example from trading systems
class TradingEngine {
    constructor() {
        // Pre-define object shapes để help V8 optimization
        this.ORDER_SHAPE = {
            id: '',
            symbol: '',
            quantity: 0,
            price: 0,
            timestamp: 0
        };

        this.TRADE_SHAPE = {
            buyOrderId: '',
            sellOrderId: '',
            quantity: 0,
            price: 0,
            timestamp: 0
        };

        // Create optimized processors
        this.processOrder = JITOptimizer.createMonomorphicFunction(this.ORDER_SHAPE);
        this.processTrade = JITOptimizer.createMonomorphicFunction(this.TRADE_SHAPE);
        this.calculatePrice = JITOptimizer.createStableFunction(this._calculatePriceCore.bind(this));

        // Pre-warm JIT compilation
        this._warmupEngine();
    }

    _warmupEngine() {
        // Execute functions với typical data to trigger JIT compilation
        const sampleOrder = { ...this.ORDER_SHAPE };
        const sampleTrade = { ...this.TRADE_SHAPE };

        for (let i = 0; i < 1000; i++) {
            this.processOrder(sampleOrder);
            this.processTrade(sampleTrade);
            this.calculatePrice(100);
        }
    }

    _calculatePriceCore(basePrice) {
        // Optimized price calculation
        return basePrice * (1 + Math.random() * 0.01);
    }

    _validateShape(data, expectedShape) {
        // Fast shape validation
        const dataKeys = Object.keys(data);
        const expectedKeys = Object.keys(expectedShape);

        if (dataKeys.length !== expectedKeys.length) return false;

        for (const key of expectedKeys) {
            if (!(key trong data) || typeof data[key] !== typeof expectedShape[key]) {
                return false;
            }
        }

        return true;
    }

    _processKnownShape(data) {
        // Optimized processing cho known object shape
        return {
            processed: true,
            data: data,
            timestamp: Date.now()
        };
    }
}

// Benchmark và profiling tools
class PerformanceBenchmark {
    static async benchmarkFunction(fn, iterations = 10000) {
        const results = {
            iterations,
            totalTime: 0,
            averageTime: 0,
            minTime: Infinity,
            maxTime: 0,
            ops_per_second: 0
        };

        // Warmup phase
        for (let i = 0; i < Math.min(1000, iterations / 10); i++) {
            fn();
        }

        // Benchmark phase
        const times = [];

        for (let i = 0; i < iterations; i++) {
            const start = performance.now();
            fn();
            const duration = performance.now() - start;
            times.push(duration);
        }

        // Calculate statistics
        results.totalTime = times.reduce((sum, time) => sum + time, 0);
        results.averageTime = results.totalTime / iterations;
        results.minTime = Math.min(...times);
        results.maxTime = Math.max(...times);
        results.ops_per_second = 1000 / results.averageTime;

        // Additional statistics
        times.sort((a, b) => a - b);
        results.median = times[Math.floor(times.length / 2)];
        results.p95 = times[Math.floor(times.length * 0.95)];
        results.p99 = times[Math.floor(times.length * 0.99)];

        return results;
    }

    static async compareImplementations(implementations, iterations = 10000) {
        const results = {};

        for (const [name, fn] of Object.entries(implementations)) {
            console.log(`Benchmarking ${name}...`);
            results[name] = await this.benchmarkFunction(fn, iterations);
        }

        // Sort by performance
        const sorted = Object.entries(results)
            .sort((a, b) => b[1].ops_per_second - a[1].ops_per_second);

        console.log('\nPerformance Comparison:');
        sorted.forEach(([name, stats], index) => {
            const fastest = sorted[0][1];
            const ratio = fastest.ops_per_second / stats.ops_per_second;
            console.log(`${index + 1}. ${name}: ${stats.ops_per_second.toFixed(0)} ops/sec (${ratio.toFixed(2)}x slower than fastest)`);
        });

        return results;
    }
}
```


💭 **Performance Engineering Insights**: *Tại high-frequency trading systems ở Binance, function optimization critical. Understanding V8's JIT compilation behavior, inline caching, và hidden class optimization allows us to write functions that perform orders of magnitude better. These patterns directly impact our ability to process millions of trades per second.*


---


## 📖 PHẦN VII: ADVANCED USE CASES & INDUSTRY PATTERNS


### 🎯 Framework Development Patterns


**React-Inspired Component Factory:**


```javascript
// Advanced component factory pattern inspired by React Fiber architecture
class ComponentFactory {
    constructor() {
        this.componentRegistry = new Map();
        this.hookSystem = new HookSystem();
        this.renderQueue = [];
        this.updateScheduler = new UpdateScheduler();
    }

    createComponent(name, definition) {
        const component = function Component(props = {}, context = {}) {
            // Set up component execution context
            ComponentFactory._currentComponent = component;
            ComponentFactory._currentProps = props;
            ComponentFactory._currentContext = context;

            try {
                // Execute component definition with hooks support
                const result = definition.call(this, props, context);

                // Process hooks và effects
                component._hookSystem.processHooks();

                return result;
            } finally {
                // Clean up execution context
                ComponentFactory._currentComponent = null;
                ComponentFactory._currentProps = null;
                ComponentFactory._currentContext = null;
            }
        };

        // Component metadata
        component.displayName = name;
        component.definition = definition;
        component.defaultProps = definition.defaultProps || {};
        component.propTypes = definition.propTypes || {};

        // Component lifecycle hooks
        component._hookSystem = new HookSystem();
        component._renderCount = 0;
        component._lastProps = null;
        component._lastContext = null;

        // Component methods
        component.shouldUpdate = function(newProps, newContext) {
            // Shallow comparison by default
            return !this._shallowEqual(this._lastProps, newProps) ||
                   !this._shallowEqual(this._lastContext, newContext);
        };

        component.update = function(newProps, newContext) {
            if (this.shouldUpdate(newProps, newContext)) {
                this._lastProps = { ...newProps };
                this._lastContext = { ...newContext };
                this._renderCount++;

                // Schedule update
                this.factory.updateScheduler.scheduleUpdate(() => {
                    return this(newProps, newContext);
                });
            }
        };

        component.memo = function(areEqual) {
            return ComponentFactory.memo(this, areEqual);
        };

        component._shallowEqual = function(obj1, obj2) {
            if (!obj1 && !obj2) return true;
            if (!obj1 || !obj2) return false;

            const keys1 = Object.keys(obj1);
            const keys2 = Object.keys(obj2);

            if (keys1.length !== keys2.length) return false;

            for (const key of keys1) {
                if (obj1[key] !== obj2[key]) return false;
            }

            return true;
        };

        // Register component
        this.componentRegistry.set(name, component);
        component.factory = this;

        return component;
    }

    static memo(component, areEqual) {
        const memoizedComponent = function MemoizedComponent(props, context) {
            // Check if props/context changed
            if (memoizedComponent._lastRender) {
                const propsEqual = areEqual ?
                    areEqual(memoizedComponent._lastProps, props) :
                    component._shallowEqual(memoizedComponent._lastProps, props);

                if (propsEqual && component._shallowEqual(memoizedComponent._lastContext, context)) {
                    return memoizedComponent._lastResult;
                }
            }

            // Render and cache result
            const result = component(props, context);
            memoizedComponent._lastProps = { ...props };
            memoizedComponent._lastContext = { ...context };
            memoizedComponent._lastResult = result;
            memoizedComponent._lastRender = Date.now();

            return result;
        };

        // Copy component metadata
        memoizedComponent.displayName = `Memo(${component.displayName})`;
        memoizedComponent.originalComponent = component;

        return memoizedComponent;
    }

    createHook(name, hookFunction) {
        this.hookSystem.registerHook(name, hookFunction);
    }

    getComponent(name) {
        return this.componentRegistry.get(name);
    }

    listComponents() {
        return Array.from(this.componentRegistry.keys());
    }
}

// Hook system implementation
class HookSystem {
    constructor() {
        this.hooks = new Map();
        this.currentHookIndex = 0;
        this.hookState = [];
        this.effects = [];
        this.cleanups = [];
    }

    registerHook(name, hookFunction) {
        this.hooks.set(name, hookFunction);

        // Create global hook function
        global[name] = (...args) => {
            return this.executeHook(name, args);
        };
    }

    executeHook(name, args) {
        const hookFunction = this.hooks.get(name);
        if (!hookFunction) {
            throw new Error(`Hook '${name}' not registered`);
        }

        const hookIndex = this.currentHookIndex++;
        return hookFunction.call(this, hookIndex, ...args);
    }

    processHooks() {
        // Process effects
        this.effects.forEach(effect => {
            if (effect.shouldRun()) {
                effect.cleanup = effect.run();
            }
        });

        // Reset hook index for next render
        this.currentHookIndex = 0;
    }

    cleanup() {
        this.cleanups.forEach(cleanup => cleanup());
        this.cleanups = [];
    }
}

// Update scheduler for batching updates
class UpdateScheduler {
    constructor() {
        this.updateQueue = [];
        this.isScheduled = false;
    }

    scheduleUpdate(updateFunction) {
        this.updateQueue.push(updateFunction);

        if (!this.isScheduled) {
            this.isScheduled = true;

            // Use requestAnimationFrame for browser, setImmediate for Node.js
            const scheduler = typeof requestAnimationFrame !== 'undefined' ?
                requestAnimationFrame : setImmediate;

            scheduler(() => {
                this.flushUpdates();
            });
        }
    }

    flushUpdates() {
        const updates = this.updateQueue.splice(0);
        this.isScheduled = false;

        // Batch execute all updates
        updates.forEach(update => {
            try {
                update();
            } catch (error) {
                console.error('Update error:', error);
            }
        });
    }
}

// Usage example: Building a component system
const factory = new ComponentFactory();

// Register built-in hooks
factory.createHook('useState', function(hookIndex, initialValue) {
    if (!this.hookState[hookIndex]) {
        this.hookState[hookIndex] = {
            value: initialValue,
            setValue: (newValue) => {
                this.hookState[hookIndex].value = newValue;
                // Trigger re-render
                ComponentFactory._currentComponent.update(
                    ComponentFactory._currentProps,
                    ComponentFactory._currentContext
                );
            }
        };
    }

    const state = this.hookState[hookIndex];
    return [state.value, state.setValue];
});

factory.createHook('useEffect', function(hookIndex, effect, dependencies) {
    const prevDeps = this.hookState[hookIndex]?.dependencies;
    const depsChanged = !prevDeps ||
        !dependencies ||
        dependencies.some((dep, i) => dep !== prevDeps[i]);

    if (depsChanged) {
        this.effects.push({
            shouldRun: () => true,
            run: effect,
            cleanup: null
        });

        this.hookState[hookIndex] = { dependencies };
    }
});

// Create components
const Button = factory.createComponent('Button', function(props) {
    const [clicked, setClicked] = useState(false);

    useEffect(() => {
        console.log('Button mounted or updated');

        return () => {
            console.log('Button cleanup');
        };
    }, []);

    const handleClick = () => {
        setClicked(true);
        props.onClick?.();
    };

    return {
        type: 'button',
        props: {
            onClick: handleClick,
            className: clicked ? 'clicked' : 'normal'
        },
        children: props.children
    };
});

const MemoizedButton = Button.memo();

// Usage
const button = Button({
    children: 'Click me',
    onClick: () => console.log('Button clicked!')
});

console.log('Button rendered:', button);
```


💭 **Framework Architecture Experience**: *Tại Figma, building component systems that scale across thousands of designers requires sophisticated function factories. Pattern này allows us to create reusable, performant components với built-in optimization, memoization, và lifecycle management. Key insight: functions as first-class objects enable powerful abstraction layers.*


### 🎮 Game Engine Patterns


**Entity Component System (ECS) với Function Objects:**


```javascript
// High-performance ECS implementation for browser games
class EntityComponentSystem {
    constructor() {
        this.entities = new Map();
        this.components = new Map();
        this.systems = new Map();
        this.systemExecutionOrder = [];

        // Performance tracking
        this.frameTime = 0;
        this.systemMetrics = new Map();

        // Function pools for performance
        this.functionPools = new Map();
    }

    createEntity(id = this._generateId()) {
        const entity = function Entity() {
            // Entity as callable function for dynamic behavior
            return entity._currentBehavior?.apply(entity, arguments);
        };

        // Entity metadata
        entity.id = id;
        entity.components = new Map();
        entity.systems = new Set();
        entity.active = true;
        entity.created = performance.now();

        // Entity methods
        entity.addComponent = (name, data) => {
            this.addComponent(entity.id, name, data);
            return entity;
        };

        entity.removeComponent = (name) => {
            this.removeComponent(entity.id, name);
            return entity;
        };

        entity.getComponent = (name) => {
            return this.getComponent(entity.id, name);
        };

        entity.hasComponent = (name) => {
            return entity.components.has(name);
        };

        entity.setBehavior = (behaviorFunction) => {
            entity._currentBehavior = behaviorFunction;
            return entity;
        };

        entity.destroy = () => {
            this.destroyEntity(entity.id);
        };

        // Performance tracking
        entity.performance = {
            updateTime: 0,
            renderTime: 0,
            componentCount: 0
        };

        this.entities.set(id, entity);
        return entity;
    }

    addComponent(entityId, componentName, data = {}) {
        const entity = this.entities.get(entityId);
        if (!entity) throw new Error(`Entity ${entityId} not found`);

        // Get or create component factory
        const componentFactory = this.components.get(componentName);
        if (!componentFactory) {
            throw new Error(`Component ${componentName} not registered`);
        }

        // Create component instance
        const component = componentFactory(data);
        component._entityId = entityId;
        component._name = componentName;
        component._created = performance.now();

        entity.components.set(componentName, component);
        entity.performance.componentCount++;

        // Update system registrations
        this._updateEntitySystems(entity);

        return component;
    }

    registerComponent(name, factory) {
        this.components.set(name, factory);
    }

    registerSystem(name, systemFunction, requirements = [], priority = 0) {
        const system = function GameSystem(entities, deltaTime) {
            const startTime = performance.now();

            try {
                const result = systemFunction.call(system, entities, deltaTime);

                // Update performance metrics
                system.performance.executionTime = performance.now() - startTime;
                system.performance.totalExecutions++;
                system.performance.averageTime =
                    (system.performance.averageTime * (system.performance.totalExecutions - 1) +
                     system.performance.executionTime) / system.performance.totalExecutions;

                return result;
            } catch (error) {
                system.performance.errors++;
                console.error(`System ${name} error:`, error);
                throw error;
            }
        };

        // System metadata
        system.name = name;
        system.requirements = new Set(requirements);
        system.priority = priority;
        system.active = true;

        // Performance tracking
        system.performance = {
            executionTime: 0,
            totalExecutions: 0,
            averageTime: 0,
            errors: 0
        };

        // System configuration
        system.configure = function(config) {
            Object.assign(this, config);
            return this;
        };

        system.getMatchingEntities = () => {
            return Array.from(this.entities.values()).filter(entity => {
                return entity.active && this._entityMatchesSystem(entity, system);
            });
        };

        this.systems.set(name, system);
        this._updateSystemExecutionOrder();

        return system;
    }

    _entityMatchesSystem(entity, system) {
        for (const requirement of system.requirements) {
            if (!entity.components.has(requirement)) {
                return false;
            }
        }
        return true;
    }

    _updateEntitySystems(entity) {
        entity.systems.clear();

        for (const [systemName, system] of this.systems) {
            if (this._entityMatchesSystem(entity, system)) {
                entity.systems.add(systemName);
            }
        }
    }

    _updateSystemExecutionOrder() {
        this.systemExecutionOrder = Array.from(this.systems.values())
            .sort((a, b) => b.priority - a.priority);
    }

    update(deltaTime) {
        const frameStart = performance.now();

        // Execute systems trong priority order
        for (const system of this.systemExecutionOrder) {
            if (!system.active) continue;

            const matchingEntities = system.getMatchingEntities();
            if (matchingEntities.length > 0) {
                system(matchingEntities, deltaTime);
            }
        }

        this.frameTime = performance.now() - frameStart;
    }

    getPerformanceReport() {
        const report = {
            frameTime: this.frameTime,
            entityCount: this.entities.size,
            systemCount: this.systems.size,
            systems: {}
        };

        for (const [name, system] of this.systems) {
            report.systems[name] = { ...system.performance };
        }

        return report;
    }

    _generateId() {
        return `entity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

// Component factories
const TransformComponent = (data = {}) => ({
    x: data.x || 0,
    y: data.y || 0,
    rotation: data.rotation || 0,
    scale: data.scale || 1
});

const VelocityComponent = (data = {}) => ({
    vx: data.vx || 0,
    vy: data.vy || 0,
    maxSpeed: data.maxSpeed || 100
});

const RenderComponent = (data = {}) => ({
    sprite: data.sprite || null,
    color: data.color || '#ffffff',
    visible: data.visible !== false,
    layer: data.layer || 0
});

const HealthComponent = (data = {}) => ({
    current: data.current || 100,
    maximum: data.maximum || 100,
    regeneration: data.regeneration || 0
});

// Game systems
function MovementSystem(entities, deltaTime) {
    entities.forEach(entity => {
        const transform = entity.getComponent('transform');
        const velocity = entity.getComponent('velocity');

        if (transform && velocity) {
            transform.x += velocity.vx * deltaTime;
            transform.y += velocity.vy * deltaTime;
        }
    });
}

function HealthSystem(entities, deltaTime) {
    entities.forEach(entity => {
        const health = entity.getComponent('health');

        if (health && health.regeneration > 0) {
            health.current = Math.min(
                health.maximum,
                health.current + health.regeneration * deltaTime
            );
        }

        // Remove entities with zero health
        if (health && health.current <= 0) {
            entity.destroy();
        }
    });
}

function RenderSystem(entities, deltaTime) {
    // Sort entities by render layer
    const renderableEntities = entities
        .filter(entity => entity.getComponent('render')?.visible)
        .sort((a, b) => {
            const aLayer = a.getComponent('render').layer;
            const bLayer = b.getComponent('render').layer;
            return aLayer - bLayer;
        });

    renderableEntities.forEach(entity => {
        const transform = entity.getComponent('transform');
        const render = entity.getComponent('render');

        if (transform && render) {
            // Mock rendering
            console.log(`Rendering entity ${entity.id} at (${transform.x}, ${transform.y})`);
        }
    });
}

// Usage example: Simple game
const ecs = new EntityComponentSystem();

// Register components
ecs.registerComponent('transform', TransformComponent);
ecs.registerComponent('velocity', VelocityComponent);
ecs.registerComponent('render', RenderComponent);
ecs.registerComponent('health', HealthComponent);

// Register systems
ecs.registerSystem('movement', MovementSystem, ['transform', 'velocity'], 100);
ecs.registerSystem('health', HealthSystem, ['health'], 50);
ecs.registerSystem('render', RenderSystem, ['transform', 'render'], 0);

// Create game entities
const player = ecs.createEntity('player')
    .addComponent('transform', { x: 100, y: 100 })
    .addComponent('velocity', { vx: 50, vy: 0 })
    .addComponent('render', { color: '#00ff00' })
    .addComponent('health', { current: 100, maximum: 100, regeneration: 1 });

const enemy = ecs.createEntity('enemy')
    .addComponent('transform', { x: 200, y: 150 })
    .addComponent('velocity', { vx: -30, vy: 0 })
    .addComponent('render', { color: '#ff0000' })
    .addComponent('health', { current: 50, maximum: 50 });

// Game loop
function gameLoop() {
    const deltaTime = 0.016; // 60 FPS

    ecs.update(deltaTime);

    // Log performance every second
    if (performance.now() % 1000 < 16) {
        console.log('Performance:', ecs.getPerformanceReport());
    }

    requestAnimationFrame(gameLoop);
}

// Start game
gameLoop();
```


💭 **Game Engine Architecture**: *Building browser-based games requires careful function design để achieve 60fps performance. ECS pattern với function objects provides excellent performance characteristics while maintaining code flexibility. Key insight: using functions as entities enables dynamic behavior switching, which crucial cho complex game mechanics.*


### 🏢 Enterprise Integration Patterns


**Microservice Function Orchestration:**


```javascript
// Enterprise-grade function orchestration for microservices
class ServiceOrchestrator {
    constructor(config = {}) {
        this.services = new Map();
        this.workflows = new Map();
        this.middleware = [];
        this.circuit breakers = new Map();
        this.metrics = new ServiceMetrics();

        this.config = {
            timeout: 5000,
            retries: 3,
            circuitBreakerThreshold: 5,
            bulkheadSize: 10,
            ...config
        };
    }

    registerService(name, serviceFunction, options = {}) {
        const service = this._createEnhancedService(name, serviceFunction, options);
        this.services.set(name, service);

        // Initialize circuit breaker
        this.circuitBreakers.set(name, new CircuitBreaker(name, {
            threshold: options.circuitBreakerThreshold || this.config.circuitBreakerThreshold,
            timeout: options.timeout || this.config.timeout
        }));

        return service;
    }

    _createEnhancedService(name, serviceFunction, options) {
        const service = async function EnhancedService(...args) {
            const startTime = performance.now();
            const circuitBreaker = this.orchestrator.circuitBreakers.get(name);

            // Circuit breaker check
            if (circuitBreaker.isOpen()) {
                throw new ServiceError('Service unavailable - circuit breaker open', 'CIRCUIT_OPEN');
            }

            try {
                // Apply middleware chain
                const context = {
                    service: name,
                    args,
                    startTime,
                    metadata: {}
                };

                await this.orchestrator._executeMiddleware(context, 'before');

                // Execute với timeout và retry logic
                const result = await this.orchestrator._executeWithResilience(
                    name,
                    serviceFunction,
                    args,
                    options
                );

                context.result = result;
                context.duration = performance.now() - startTime;

                await this.orchestrator._executeMiddleware(context, 'after');

                // Record success
                circuitBreaker.recordSuccess();
                this.orchestrator.metrics.recordSuccess(name, context.duration);

                return result;

            } catch (error) {
                const duration = performance.now() - startTime;

                // Record failure
                circuitBreaker.recordFailure();
                this.orchestrator.metrics.recordFailure(name, duration, error);

                // Execute error middleware
                await this.orchestrator._executeMiddleware({
                    service: name,
                    args,
                    error,
                    duration
                }, 'error');

                throw error;
            }
        }.bind({ orchestrator: this });

        // Service metadata
        service.name = name;
        service.originalFunction = serviceFunction;
        service.options = options;
        service.orchestrator = this;

        // Service management methods
        service.disable = () => {
            service.disabled = true;
            return service;
        };

        service.enable = () => {
            service.disabled = false;
            return service;
        };

        service.updateConfig = (newOptions) => {
            Object.assign(service.options, newOptions);
            return service;
        };

        service.getMetrics = () => {
            return this.metrics.getServiceMetrics(name);
        };

        return service;
    }

    async _executeWithResilience(serviceName, fn, args, options) {
        const retries = options.retries || this.config.retries;
        const timeout = options.timeout || this.config.timeout;

        let lastError;

        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                // Execute với timeout
                const result = await Promise.race([
                    fn.apply(null, args),
                    new Promise((_, reject) => {
                        setTimeout(() => reject(new ServiceError('Service timeout', 'TIMEOUT')), timeout);
                    })
                ]);

                return result;

            } catch (error) {
                lastError = error;

                if (attempt < retries && this._isRetryableError(error)) {
                    const delay = this._calculateBackoffDelay(attempt);
                    await this._sleep(delay);
                    continue;
                }

                break;
            }
        }

        throw lastError;
    }

    _isRetryableError(error) {
        // Define which errors should trigger retries
        const retryableCodes = ['TIMEOUT', 'CONNECTION_ERROR', 'SERVICE_UNAVAILABLE'];
        return retryableCodes.includes(error.code) || error.status >= 500;
    }

    _calculateBackoffDelay(attempt) {
        // Exponential backoff với jitter
        const baseDelay = 100;
        const backoffDelay = Math.min(1000, baseDelay * Math.pow(2, attempt));
        const jitter = Math.random() * 0.1 * backoffDelay;
        return backoffDelay + jitter;
    }

    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async _executeMiddleware(context, phase) {
        for (const middleware of this.middleware) {
            if (middleware.phase === phase || middleware.phase === 'all') {
                try {
                    await middleware.handler(context);
                } catch (error) {
                    console.error(`Middleware error trong ${phase} phase:`, error);
                }
            }
        }
    }

    addMiddleware(phase, handler) {
        this.middleware.push({ phase, handler });
        return this;
    }

    createWorkflow(name, steps) {
        const workflow = async function ServiceWorkflow(input) {
            const context = {
                workflow: name,
                input,
                steps: [],
                startTime: performance.now()
            };

            let currentData = input;

            for (let i = 0; i < steps.length; i++) {
                const step = steps[i];
                const stepStart = performance.now();

                try {
                    const service = this.orchestrator.services.get(step.service);
                    if (!service) {
                        throw new ServiceError(`Service ${step.service} not found`, 'SERVICE_NOT_FOUND');
                    }

                    // Prepare step input
                    const stepInput = step.transform ?
                        step.transform(currentData, context) :
                        currentData;

                    // Execute step
                    const stepResult = await service(stepInput);

                    // Process step output
                    currentData = step.output ?
                        step.output(stepResult, currentData, context) :
                        stepResult;

                    context.steps.push({
                        service: step.service,
                        duration: performance.now() - stepStart,
                        success: true
                    });

                } catch (error) {
                    context.steps.push({
                        service: step.service,
                        duration: performance.now() - stepStart,
                        success: false,
                        error: error.message
                    });

                    // Handle step failure
                    if (step.onError) {
                        currentData = await step.onError(error, currentData, context);
                    } else if (!step.optional) {
                        throw error;
                    }
                }
            }

            context.duration = performance.now() - context.startTime;
            context.result = currentData;

            return { result: currentData, context };
        }.bind({ orchestrator: this });

        workflow.name = name;
        workflow.steps = steps;
        workflow.orchestrator = this;

        this.workflows.set(name, workflow);
        return workflow;
    }

    getService(name) {
        return this.services.get(name);
    }

    getWorkflow(name) {
        return this.workflows.get(name);
    }

    getSystemMetrics() {
        return {
            services: this.metrics.getAllMetrics(),
            circuitBreakers: Array.from(this.circuitBreakers.entries()).map(([name, cb]) => ({
                name,
                state: cb.getState(),
                metrics: cb.getMetrics()
            }))
        };
    }
}

// Circuit breaker implementation
class CircuitBreaker {
    constructor(name, options = {}) {
        this.name = name;
        this.threshold = options.threshold || 5;
        this.timeout = options.timeout || 60000;
        this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN

        this.failures = 0;
        this.requests = 0;
        this.lastFailureTime = null;
        this.nextAttemptTime = null;
    }

    isOpen() {
        if (this.state === 'OPEN') {
            if (Date.now() >= this.nextAttemptTime) {
                this.state = 'HALF_OPEN';
                return false;
            }
            return true;
        }
        return false;
    }

    recordSuccess() {
        this.requests++;
        this.failures = 0;

        if (this.state === 'HALF_OPEN') {
            this.state = 'CLOSED';
        }
    }

    recordFailure() {
        this.requests++;
        this.failures++;
        this.lastFailureTime = Date.now();

        if (this.failures >= this.threshold) {
            this.state = 'OPEN';
            this.nextAttemptTime = Date.now() + this.timeout;
        }
    }

    getState() {
        return {
            state: this.state,
            failures: this.failures,
            requests: this.requests,
            failureRate: this.requests > 0 ? this.failures / this.requests : 0
        };
    }

    getMetrics() {
        return this.getState();
    }
}

// Service metrics tracking
class ServiceMetrics {
    constructor() {
        this.metrics = new Map();
    }

    recordSuccess(serviceName, duration) {
        this._ensureMetrics(serviceName);
        const metrics = this.metrics.get(serviceName);

        metrics.totalRequests++;
        metrics.successCount++;
        metrics.totalDuration += duration;
        metrics.averageDuration = metrics.totalDuration / metrics.totalRequests;
        metrics.lastRequestTime = Date.now();
    }

    recordFailure(serviceName, duration, error) {
        this._ensureMetrics(serviceName);
        const metrics = this.metrics.get(serviceName);

        metrics.totalRequests++;
        metrics.failureCount++;
        metrics.totalDuration += duration;
        metrics.averageDuration = metrics.totalDuration / metrics.totalRequests;
        metrics.lastRequestTime = Date.now();
        metrics.lastError = error.message;
    }

    _ensureMetrics(serviceName) {
        if (!this.metrics.has(serviceName)) {
            this.metrics.set(serviceName, {
                totalRequests: 0,
                successCount: 0,
                failureCount: 0,
                totalDuration: 0,
                averageDuration: 0,
                lastRequestTime: null,
                lastError: null
            });
        }
    }

    getServiceMetrics(serviceName) {
        return this.metrics.get(serviceName) || null;
    }

    getAllMetrics() {
        return Object.fromEntries(this.metrics);
    }
}

// Custom error class
class ServiceError extends Error {
    constructor(message, code, status) {
        super(message);
        this.name = 'ServiceError';
        this.code = code;
        this.status = status;
    }
}

// Usage example: E-commerce microservices
const orchestrator = new ServiceOrchestrator({
    timeout: 3000,
    retries: 2,
    circuitBreakerThreshold: 3
});

// Add logging middleware
orchestrator.addMiddleware('before', (context) => {
    console.log(`[${context.service}] Starting execution với args:`, context.args);
});

orchestrator.addMiddleware('after', (context) => {
    console.log(`[${context.service}] Completed trong ${context.duration}ms`);
});

// Register microservices
const userService = orchestrator.registerService('user', async (userId) => {
    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 100));
    return { id: userId, name: `User ${userId}`, email: `user${userId}@example.com` };
});

const orderService = orchestrator.registerService('order', async (userId, orderData) => {
    await new Promise(resolve => setTimeout(resolve, 150));
    return { id: Math.random(), userId, ...orderData, status: 'created' };
});

const paymentService = orchestrator.registerService('payment', async (orderId, amount) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return { orderId, amount, status: 'processed', transactionId: Math.random() };
});

// Create order workflow
const orderWorkflow = orchestrator.createWorkflow('createOrder', [
    {
        service: 'user',
        transform: (input) => input.userId,
        output: (user, original) => ({ ...original, user })
    },
    {
        service: 'order',
        transform: (input) => [input.userId, { items: input.items, total: input.total }],
        output: (order, original) => ({ ...original, order })
    },
    {
        service: 'payment',
        transform: (input) => [input.order.id, input.order.total],
        output: (payment, original) => ({ ...original, payment }),
        onError: async (error, data) => {
            console.log('Payment failed, canceling order...');
            return { ...data, paymentFailed: true };
        }
    }
]);

// Execute workflow
async function createOrder() {
    try {
        const result = await orderWorkflow({
            userId: 123,
            items: ['item1', 'item2'],
            total: 99.99
        });

        console.log('Order created successfully:', result.result);
        console.log('Workflow context:', result.context);

    } catch (error) {
        console.error('Order creation failed:', error);
    }

    // Print system metrics
    console.log('System metrics:', orchestrator.getSystemMetrics());
}

createOrder();
```


💭 **Enterprise Integration Experience**: *Tại large-scale systems như NAB's banking platform, function orchestration critical cho managing hundreds of microservices. Pattern này provides resilience, observability, và performance monitoring needed for production systems handling millions of transactions daily. Key insight: functions as service abstractions enable powerful middleware patterns và cross-cutting concerns.*


---


## 🎯 KẾT LUẬN: MASTERING FUNCTION OBJECTS - TỪLÝ THUYẾT ĐẾN THỰC TIỄN


### 🌟 Tổng Kết Kiến Thức Core


Sau hành trình deep dive này, chúng ta đã explore JavaScript function objects từ first principles đến advanced production patterns. Đây là những key insights rút ra từ experience tại top tech companies:


**🔑 Core Concepts Mastered:**


1. **Function Objects Nature**: Functions trong JavaScript không chỉ là executable code - chúng là full-fledged objects với properties, methods, và complex behavior
2. **Name Property Intelligence**: Contextual naming provides powerful debugging capabilities và stack trace clarity
3. **Length Property Utility**: Parameter introspection enables sophisticated polymorphism và API design
4. **Custom Properties Power**: Function properties offer elegant solutions cho state management, caching, và metadata
5. **NFE Safety**: Named Function Expressions provide safe self-reference, crucial cho recursive patterns


**💡 Advanced Patterns Learned:**


- **Function Factories**: Creating configurable, reusable function generators
- **Performance Optimization**: JIT-friendly patterns, pooling, và memory management
- **Framework Development**: Component systems, plugin architectures, và middleware patterns
- **Enterprise Integration**: Service orchestration, circuit breakers, và resilience patterns


### 🚀 Production-Ready Takeaways


**Immediate Applications:**


```javascript
// 1. Debugging-Friendly Functions
const processData = function dataProcessor(input) {
    // NFE ensures safe recursion và clear stack traces
    if (Array.isArray(input)) {
        return input.map(item => dataProcessor(item));
    }
    return transformItem(input);
};

// 2. Smart API Design
function createAPI(config) {
    const api = function smartAPI(...args) {
        // Length-based polymorphism
        switch (args.length) {
            case 1: return api.get(args[0]);
            case 2: return api.post(args[0], args[1]);
            case 3: return api.put(args[0], args[1], args[2]);
        }
    };
```


## Claude


```javascript
// Function properties for configuration và state
   api.config = { ...config };
   api.cache = new Map();
   api.metrics = { requests: 0, errors: 0 };

   // Method attachment
   api.get = function apiGet(endpoint) {
       api.metrics.requests++;
       // Implementation
   };

   return api;
}

// 3. Performance-Conscious Patterns
const memoizedCalculation = function expensiveCalc(input) {
   const key = JSON.stringify(input);
   if (expensiveCalc.cache.has(key)) {
       return expensiveCalc.cache.get(key);
   }

   const result = performCalculation(input);
   expensiveCalc.cache.set(key, result);
   return result;
};
memoizedCalculation.cache = new Map();
```


### 🎯 Career Impact Guidelines


**For Different Experience Levels:**


**📚 Junior Developers (0-2 years):**


- Start với understanding function properties for debugging
- Practice NFE patterns for safe recursion
- Build simple memoization patterns
- Focus on readable, maintainable code over premature optimization


**🔧 Mid-Level Engineers (2-5 years):**


- Implement function factories for reusable patterns
- Design polymorphic APIs using length property
- Build plugin systems với function properties
- Understand performance implications của different patterns


**🏗️ Senior Engineers (5+ years):**


- Architect function-based frameworks và libraries
- Optimize for specific JavaScript engine characteristics
- Design enterprise-scale function orchestration systems
- Mentor team on advanced function patterns


**🎖️ Principal/Staff Engineers (8+ years):**


- Define function design standards cho entire organization
- Build developer tooling leveraging function introspection
- Optimize critical path performance với advanced patterns
- Drive architectural decisions around function-based abstractions


### 🛡️ Best Practices Summary


**✅ Do:**


```javascript
// 1. Use meaningful function names for debugging
const calculateTax = function taxCalculator(income, deductions) {
    // Clear name helps với stack traces
    return (income - deductions) * 0.25;
};

// 2. Leverage function properties for metadata
function createValidator(rules) {
    validator.rules = rules;
    validator.version = '1.0.0';
    validator.lastUsed = null;

    function validator(data) {
        validator.lastUsed = Date.now();
        return validateData(data, rules);
    }

    return validator;
}

// 3. Use NFE for safe recursion
const traverseTree = function treeTraverser(node, callback) {
    callback(node);
    if (node.children) {
        node.children.forEach(child => treeTraverser(child, callback));
    }
};
```


**❌ Don't:**


```javascript
// 1. Avoid modifying built-in function properties
function badExample() {}
badExample.name = 'modified'; // Ignored, potentially breaks tools
badExample.length = 5;        // Read-only, will fail

// 2. Don't rely on function properties for critical application logic
function unreliablePattern() {
    if (unreliablePattern.config?.enableFeature) {
        // Fragile: external code could modify config
        return advancedFeature();
    }
    return basicFeature();
}

// 3. Avoid excessive function property nesting
function confusingPattern() {}
confusingPattern.config.nested.deeply.buried.setting = true; // Hard to maintain
```


### 🔬 Performance Considerations


**Memory Usage Guidelines:**


```javascript
// Efficient: Shared function properties
function createProcessor(type) {
    const processor = function process(data) {
        return processor._implementations[type](data);
    };

    // Shared across instances
    processor._implementations = sharedImplementations;
    processor.type = type;

    return processor;
}

// Inefficient: Duplicate function properties
function inefficientFactory(type) {
    const processor = function process(data) {
        // Each instance gets own copy của methods
        processor.validate = function(data) { /* ... */ };
        processor.transform = function(data) { /* ... */ };
        return processData(data);
    };
    return processor;
}
```


**CPU Performance Tips:**


```javascript
// V8-optimized patterns
function optimizedFunction(input) {
    // 1. Consistent parameter types help JIT optimization
    if (typeof input !== 'number') {
        throw new TypeError('Expected number');
    }

    // 2. Avoid changing function behavior dynamically
    return input * 2; // Predictable operation
}

// Performance monitoring
function monitoredFunction(data) {
    const start = performance.now();

    try {
        const result = processData(data);
        monitoredFunction._avgTime =
            (monitoredFunction._avgTime + (performance.now() - start)) / 2;
        return result;
    } catch (error) {
        monitoredFunction._errors++;
        throw error;
    }
}
monitoredFunction._avgTime = 0;
monitoredFunction._errors = 0;
```


### 📈 Future-Proofing Strategies


**Evolving JavaScript Ecosystem:**


1. **Function Metadata Standards**: Industry moving toward richer function introspection
2. **Performance Monitoring**: Built-in performance APIs becoming more sophisticated
3. **Type Systems**: TypeScript và other type systems providing better function contracts
4. **Framework Evolution**: React, Vue, và other frameworks increasingly leverage function properties


**Preparing for Change:**


```javascript
// Future-friendly function design
function createFutureProofFunction(config) {
    const fn = function adaptableFunction(...args) {
        // Core logic remains stable
        return fn._processor.apply(this, args);
    };

    // Extensible metadata
    fn.metadata = {
        version: config.version,
        capabilities: new Set(config.capabilities),
        compatibility: config.compatibility
    };

    // Swappable implementation
    fn._processor = config.processor;

    // Upgrade mechanism
    fn.upgrade = function(newProcessor, newMetadata) {
        this._processor = newProcessor;
        Object.assign(this.metadata, newMetadata);
    };

    return fn;
}
```


### 🎨 Creative Applications


**Beyond Traditional Use Cases:**


```javascript
// 1. Function as Data Structure
function createLinkedList() {
    const list = function traverseList(callback) {
        let current = list._head;
        while (current) {
            if (callback(current.value) === false) break;
            current = current.next;
        }
    };

    list._head = null;
    list._size = 0;

    list.add = function(value) {
        const node = { value, next: this._head };
        this._head = node;
        this._size++;
    };

    list.size = () => list._size;

    return list;
}

// 2. Function as State Machine
function createStateMachine(states, initialState) {
    const machine = function transition(action) {
        const currentState = machine._currentState;
        const transitions = machine._states[currentState];

        if (transitions[action]) {
            machine._currentState = transitions[action];
            machine._history.push({ from: currentState, action, to: machine._currentState });
            return machine._currentState;
        }

        throw new Error(`Invalid transition: ${action} from ${currentState}`);
    };

    machine._states = states;
    machine._currentState = initialState;
    machine._history = [];

    machine.getState = () => machine._currentState;
    machine.getHistory = () => [...machine._history];
    machine.canTransition = (action) =>
        machine._states[machine._currentState][action] !== undefined;

    return machine;
}

// 3. Function as Event Emitter
function createEventFunction(handler) {
    const eventFn = function execute(...args) {
        const result = handler.apply(this, args);
        eventFn._emit('execute', { args, result });
        return result;
    };

    eventFn._listeners = new Map();

    eventFn.on = function(event, listener) {
        if (!this._listeners.has(event)) {
            this._listeners.set(event, []);
        }
        this._listeners.get(event).push(listener);
        return this;
    };

    eventFn._emit = function(event, data) {
        const listeners = this._listeners.get(event) || [];
        listeners.forEach(listener => {
            try {
                listener(data);
            } catch (error) {
                console.error('Event listener error:', error);
            }
        });
    };

    return eventFn;
}
```


### 💭 Final Reflection: The Journey Continues


Sau 15+ năm engineering experience tại NAB, Axon, Binance, Webflow, và Figma, tôi nhận ra rằng truly understanding JavaScript functions không phải destination mà là journey. Function objects represent một trong những most powerful abstractions trong JavaScript - they bridge gap between procedural programming, object-oriented design, và functional programming paradigms.


**Key Philosophy:**


- **Functions are first-class citizens** - treat them với respect they deserve
- **Properties enable powerful abstractions** - use them để create elegant APIs
- **Performance matters** - but clarity và maintainability matter more trong most cases
- **Debugging is crucial** - invest trong patterns that make your code observable


**The Path Forward:**


1. **Master the Basics**: Ensure solid understanding của function properties, NFE, và introspection
2. **Build Real Projects**: Apply these patterns trong actual applications, not just toy examples
3. **Measure và Optimize**: Use profiling tools để understand performance implications
4. **Share Knowledge**: Teach others - explaining complex concepts deepens your own understanding
5. **Stay Curious**: JavaScript ecosystem constantly evolving - keep learning


**Parting Wisdom:**


JavaScript functions are not just code containers - they're intelligent objects capable của incredible sophistication. Master them, và you'll unlock new levels của expressiveness trong your applications. Whether you're building simple websites hay complex distributed systems, understanding function objects deeply will make you more effective engineer.


Remember: great code isn't just about working solutions - it's about creating maintainable, performant, và elegant abstractions that enable future innovation. Function objects are one của your most powerful tools pentru achieving this goal.


*"The best functions are those that clearly express intent, handle edge cases gracefully, và provide rich introspection capabilities cho debugging và optimization."* - Lesson learned from countless production debugging sessions.


---


🚀 **Ready to apply these concepts trong your next project? Start small, think big, và always prioritize clarity over cleverness. The JavaScript community needs more engineers who understand functions deeply và can build reliable, performant systems.**


💡 **Remember**: Every expert was once beginner. Keep practicing, keep building, și keep pushing boundaries của what's possible với JavaScript functions.
