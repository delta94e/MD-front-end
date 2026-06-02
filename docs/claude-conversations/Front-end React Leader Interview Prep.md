# Front-end React Leader Interview Prep

## You

Liệt kê tất cả các nội dung, concept cần học để interview vị trí front end React leader ở công ty dưới với requirement như sau:

## You

Chi tiết vào TECHNICAL SKILLS - REACT & JAVASCRIPT cần học kĩ những concept nào cho phần React.js Core Principles (yêu cầu 5+ năm kinh nghiệm)

## You

Chi tiết vào TECHNICAL SKILLS - REACT & JAVASCRIPT cần học kĩ những concept nào cho phần JavaScript fundamentals: DOM manipulation, JavaScript object model

## You

Chi tiết vào TECHNICAL SKILLS - REACT & JAVASCRIPT cần học kĩ những concept nào cho phần
* Modern ECMAScript specifications (ES6+)

## You

Chi tiết vào TECHNICAL SKILLS - REACT & JAVASCRIPT cần học kĩ những concept nào cho phần
* React Hooks và lifecycle methods

## You

Chi tiết vào TECHNICAL SKILLS - REACT & JAVASCRIPT cần học kĩ những concept nào cho phần
* Component architecture và reusable components

## You

Chi tiết vào TECHNICAL SKILLS - REACT & JAVASCRIPT cần học kĩ những concept nào cho phần
* Isomorphic React (Server-side rendering)

## You

Chi tiết vào TECHNICAL SKILLS - REACT & JAVASCRIPT cần học kĩ những concept nào cho phần
* Performance optimization trong React

## You

Nội dung này k có Computer Science fundamentals

## Claude


Dựa trên job description của vị trí Front-end Leader tại LeapXpert, đây là tất cả các nội dung và concept cần học để chuẩn bị cho interview:


## 1. TECHNICAL SKILLS - REACT & JAVASCRIPT


- **React.js Core Principles** (yêu cầu 5+ năm kinh nghiệm)
- **JavaScript fundamentals**: DOM manipulation, JavaScript object model
- **Modern ECMAScript specifications** (ES6+)
- **React Hooks** và lifecycle methods
- **Component architecture** và reusable components
- **Isomorphic React** (Server-side rendering)
- **Performance optimization** trong React


## 2. STATE MANAGEMENT


- **Redux** - actions, reducers, store, middleware
- **Context API**
- **Modern state management patterns**
- **State persistence** và caching strategies


## 3. DEVELOPMENT TOOLS & BUILD PIPELINE


- **Webpack** configuration và optimization
- **Babel** transpilation
- **NPM/Yarn** package management
- **Build pipelines** và bundling strategies
- **Chrome DevTools** cho debugging complex UI issues


## 4. PERFORMANCE & OPTIMIZATION


- **Browser performance optimization** techniques
- **Runtime behavior optimization**
- **Cross-browser compatibility** issues và solutions
- **Lazy loading** và code splitting
- **Memory management** trong React applications


## 5. SECURITY


- **XSS (Cross-Site Scripting)** prevention
- **CSRF (Cross-Site Request Forgery)** protection
- **Secure front-end development practices**
- **Input validation** và sanitization


## 6. API & AUTHENTICATION


- **RESTful APIs** integration
- **JWT (JSON Web Tokens)** implementation
- **Modern authorization mechanisms**
- **HTTP methods** và status codes
- **API error handling**


## 7. LEADERSHIP & TEAM MANAGEMENT


- **Team leadership skills** (yêu cầu 2+ năm lead 3+ engineers)
- **Mentoring** và coaching junior developers
- **Code review** best practices
- **Technical decision making**
- **Conflict resolution** trong technical discussions


## 8. AGILE & COLLABORATION


- **Agile methodologies** (Scrum, Kanban)
- **Git workflows** (GitFlow, feature branches)
- **Collaborative development** practices
- **Sprint planning** và estimation techniques


## 9. CI/CD & DEVOPS


- **CI/CD pipeline** evaluation và improvement
- **Automated testing** strategies
- **Deployment processes**
- **DevOps collaboration** practices


## 10. AI & MODERN DEVELOPMENT


- **AI-powered development tools**: GitHub Copilot, ChatGPT, Cursor
- **AI adoption strategies** cho development team
- **Productivity enhancement** through AI tools
- **AI trends** trong frontend development


## 11. ARCHITECTURE & SCALABILITY


- **Scalable technical solutions** design
- **Component library** architecture
- **Micro-frontend** concepts
- **Design patterns** trong React applications
- **Technical debt** management


## 12. COMMUNICATION & BUSINESS


- **Technical concept explanation** in English
- **Business requirements translation** to technical solutions
- **Stakeholder communication**
- **Technical documentation** writing


## 13. TESTING


- **Unit testing** (Jest, React Testing Library)
- **Integration testing**
- **E2E testing** frameworks
- **Test-driven development** (TDD)


## 14. COMPANY-SPECIFIC KNOWLEDGE


- **Enterprise-grade security** requirements
- **Compliance** trong business communications
- **Messaging platforms** integration
- **Digital Communications Governance**


## 15. SOFT SKILLS CẦN DEMONSTRATE


- **Problem-solving** abilities
- **Continuous improvement** mindset
- **Innovation** và creativity
- **Adaptability** trong fast-paced environment
- **Ownership** và accountability


Để chuẩn bị tốt cho interview, bạn nên:


1. **Thực hành** coding challenges với React
2. **Chuẩn bị** câu chuyện về leadership experience
3. **Review** các project đã làm để có thể discuss architecture decisions
4. **Tìm hiểu** về LeapXpert và business domain của họ
5. **Chuẩn bị** questions để hỏi interviewer về technical challenges và team culture


## Claude


## REACT.JS CORE PRINCIPLES - CHI TIẾT CHO SENIOR/LEAD LEVEL (5+ YEARS)


### 1. COMPONENT ARCHITECTURE & PATTERNS


**Core Component Concepts:**


- **Function Components vs Class Components** - khi nào dùng gì, migration strategies
- **Higher-Order Components (HOC)** - implementation patterns, common use cases
- **Render Props** pattern và use cases
- **Compound Components** pattern cho complex UI
- **Controlled vs Uncontrolled Components** - pros/cons và best practices
- **Component Composition** vs Inheritance


**Advanced Component Patterns:**


- **Container/Presentational Component** pattern
- **Provider Pattern** cho state sharing
- **Custom Hooks** pattern để reuse logic
- **Polymorphic Components** với TypeScript
- **Compound Components** với React.Children API


### 2. REACT HOOKS - DEEP DIVE


**Built-in Hooks Mastery:**


- **useState** - lazy initialization, functional updates, batch updates
- **useEffect** - dependency array optimization, cleanup patterns, timing issues
- **useContext** - performance implications, context splitting strategies
- **useReducer** - complex state logic, dispatch patterns
- **useMemo & useCallback** - when to use, over-optimization pitfalls
- **useRef** - DOM access, storing mutable values, forwardRef patterns
- **useImperativeHandle** với forwardRef
- **useLayoutEffect** vs useEffect - synchronous vs asynchronous


**Custom Hooks Advanced Patterns:**


- **Data fetching hooks** với caching strategies
- **Form handling hooks** với validation
- **Local storage hooks** với sync strategies
- **Debouncing/throttling hooks**
- **Animation hooks** integration
- **Hook composition** patterns


### 3. VIRTUAL DOM & RECONCILIATION


**Core Understanding:**


- **Virtual DOM diffing algorithm** - how React decides what to update
- **Reconciliation process** - key prop importance
- **Fiber architecture** - prioritization và interrupt-ability
- **Work phases** - render vs commit phase
- **Batch updates** mechanism


**Performance Implications:**


- **React.memo** - when và how to use effectively
- **PureComponent** behavior và limitations
- **Key prop optimization** cho list rendering
- **Avoiding unnecessary re-renders**


### 4. STATE MANAGEMENT PATTERNS


**Local State Management:**


- **State lifting** strategies
- **State colocation** best practices
- **Derived state** patterns
- **State normalization** techniques


**Global State Patterns:**


- **Context API** - performance optimization, provider composition
- **State machines** concept integration
- **Flux pattern** understanding (foundation for Redux)


### 5. LIFECYCLE & EFFECTS


**Deep Understanding:**


- **Component lifecycle** in function components với hooks
- **Effect cleanup** patterns và memory leak prevention
- **Effect synchronization** với external systems
- **Effect dependencies** optimization strategies
- **Race condition** handling trong effects


**Advanced Effect Patterns:**


- **Custom effect hooks** cho reusable side effects
- **Effect composition** patterns
- **Conditional effects** và dynamic dependencies


### 6. COMPONENT COMMUNICATION


**Data Flow Patterns:**


- **Props drilling** và solutions
- **Callback props** optimization
- **Event bubbling** trong React
- **Portal communication** patterns


**Advanced Communication:**


- **Context-based communication**
- **Custom events** với useRef
- **Imperative APIs** với useImperativeHandle


### 7. RENDERING & PERFORMANCE


**Rendering Behavior:**


- **Render phases** understanding
- **Concurrent features** (React 18+)
- **Suspense** và lazy loading
- **Error boundaries** implementation


**Performance Optimization:**


- **Code splitting** strategies
- **Lazy component loading**
- **Bundle optimization** techniques
- **Render optimization** patterns


### 8. ADVANCED REACT PATTERNS


**Design Patterns:**


- **Factory pattern** trong components
- **Observer pattern** với custom hooks
- **Strategy pattern** cho conditional rendering
- **Decorator pattern** với HOCs


**Architecture Patterns:**


- **Feature-based** vs **layer-based** organization
- **Atomic design** principles
- **Component library** design
- **Theme system** architecture


### 9. REACT ECOSYSTEM INTEGRATION


**Router Integration:**


- **React Router** deep concepts - lazy loading, code splitting
- **Navigation guards** patterns
- **Route-based code splitting**


**Form Handling:**


- **Controlled forms** optimization
- **Form validation** strategies
- **Form state management** patterns


### 10. TESTING REACT APPLICATIONS


**Testing Patterns:**


- **Component testing** strategies
- **Hook testing** với React Testing Library
- **Integration testing** approaches
- **Mocking patterns** cho external dependencies


### 11. REACT 18+ MODERN FEATURES


**Concurrent Features:**


- **Suspense** for data fetching
- **Transitions** API
- **Concurrent rendering**
- **Automatic batching**


**Server Components (Future):**


- **RSC** concepts understanding
- **Hydration** strategies


### 12. COMMON PITFALLS & ANTI-PATTERNS


**Performance Anti-patterns:**


- **Inline object/function** creation
- **Unnecessary useCallback/useMemo**
- **Context value** object creation


**Logic Anti-patterns:**


- **Mutating state** directly
- **Missing dependencies** trong effects
- **Stale closure** issues


### INTERVIEW PREPARATION TIPS:


**Practical Examples Chuẩn Bị:**


- Implement custom hooks for common use cases
- Explain component re-render scenarios
- Design component API for reusability
- Optimize performance for large lists
- Handle complex form state management


**Architecture Questions:**


- How would you structure a large React application?
- When would you use Context vs external state management?
- How do you prevent prop drilling?
- What's your approach to component composition?


**Code Review Scenarios:**


- Identify performance issues in React code
- Suggest improvements for component architecture
- Review hook usage patterns
- Evaluate state management approaches


Với 5+ năm kinh nghiệm, interviewer sẽ expect bạn không chỉ biết cách dùng mà còn hiểu **tại sao** và **khi nào** dùng từng pattern, và có thể **trade-off** giữa các solutions khác nhau.


## Claude


## JAVASCRIPT FUNDAMENTALS - CHI TIẾT CHO SENIOR/LEAD LEVEL


### 1. JAVASCRIPT OBJECT MODEL - CORE CONCEPTS


**Object Creation & Inheritance:**


```javascript
// Prototype-based inheritance
function Person(name) {
    this.name = name;
}
Person.prototype.greet = function() {
    return `Hello, ${this.name}`;
};

// Modern class syntax (syntactic sugar)
class Developer extends Person {
    constructor(name, skill) {
        super(name);
        this.skill = skill;
    }
}

// Object.create patterns
const personProto = {
    greet() { return `Hello, ${this.name}`; }
};
const john = Object.create(personProto);
```


**Prototype Chain Deep Dive:**


- **__proto__** vs **prototype** property distinction
- **Constructor functions** vs **Factory functions**
- **Prototype pollution** vulnerabilities và prevention
- **Object.getPrototypeOf()** và **Object.setPrototypeOf()**
- **instanceof** operator behavior với prototype chain


**Property Descriptors & Object Configuration:**


```javascript
// Property descriptors
Object.defineProperty(obj, 'property', {
    value: 'value',
    writable: false,
    enumerable: true,
    configurable: false
});

// Object configuration methods
Object.seal(obj);        // Prevents adding/removing properties
Object.freeze(obj);      // Makes object immutable
Object.preventExtensions(obj); // Prevents adding properties
```


**Advanced Object Patterns:**


- **Object composition** vs inheritance
- **Mixin patterns** implementation
- **Factory functions** với closure
- **Module pattern** với IIFE
- **Revealing module pattern**


### 2. THIS BINDING & EXECUTION CONTEXT


**This Binding Rules:**


```javascript
// 1. Default binding
function defaultBinding() {
    console.log(this); // window (non-strict) / undefined (strict)
}

// 2. Implicit binding
const obj = {
    name: 'Object',
    method() {
        console.log(this.name); // 'Object'
    }
};

// 3. Explicit binding
const explicitObj = { name: 'Explicit' };
obj.method.call(explicitObj); // 'Explicit'

// 4. New binding
function Constructor() {
    this.name = 'Constructor';
}
const instance = new Constructor();

// 5. Arrow functions (lexical this)
const arrowObj = {
    name: 'Arrow',
    method: () => {
        console.log(this.name); // undefined (lexical scope)
    }
};
```


**Advanced This Concepts:**


- **Lost binding** scenarios và solutions
- **Arrow functions** vs regular functions trong callbacks
- **Method borrowing** với call/apply/bind
- **This trong event handlers**
- **This trong React components** (class vs hooks)


### 3. CLOSURES & SCOPE


**Scope Chain Understanding:**


- **Lexical scoping** vs dynamic scoping
- **Function scope** vs **block scope**
- **Variable hoisting** behavior với var/let/const
- **Temporal Dead Zone** (TDZ) với let/const


**Closure Patterns:**


```javascript
// Classic closure example
function createCounter() {
    let count = 0;
    return {
        increment: () => ++count,
        decrement: () => --count,
        getCount: () => count
    };
}

// Module pattern với closure
const Module = (function() {
    let privateVariable = 'hidden';

    return {
        publicMethod() {
            return privateVariable;
        }
    };
})();

// Closure trong loops (classic pitfall)
for (var i = 0; i < 5; i++) {
    setTimeout(() => console.log(i), 100); // Always logs 5
}

// Solutions
for (let i = 0; i < 5; i++) {
    setTimeout(() => console.log(i), 100); // Logs 0,1,2,3,4
}
```


**Memory Management:**


- **Closure memory leaks** identification và prevention
- **Garbage collection** behavior với closures
- **WeakMap/WeakSet** usage patterns


### 4. DOM MANIPULATION - ADVANCED TECHNIQUES


**DOM Selection Optimization:**


```javascript
// Performance-optimized selection
const elements = document.querySelectorAll('.class-name');
const elementsArray = Array.from(elements); // Convert NodeList

// Live vs Static NodeLists
const liveNodes = document.getElementsByClassName('class'); // Live
const staticNodes = document.querySelectorAll('.class'); // Static

// Element traversal optimization
function findParentWithClass(element, className) {
    while (element && !element.classList.contains(className)) {
        element = element.parentElement;
    }
    return element;
}
```


**DOM Manipulation Patterns:**


```javascript
// Document Fragment for batch operations
const fragment = document.createDocumentFragment();
for (let i = 0; i < 1000; i++) {
    const div = document.createElement('div');
    div.textContent = `Item ${i}`;
    fragment.appendChild(div);
}
container.appendChild(fragment); // Single reflow

// Template element usage
const template = document.getElementById('item-template');
const clone = template.content.cloneNode(true);

// Efficient DOM updates
function updateDOM(data) {
    // Use requestAnimationFrame for smooth updates
    requestAnimationFrame(() => {
        // Batch DOM reads
        const containerHeight = container.offsetHeight;
        const containerWidth = container.offsetWidth;

        // Batch DOM writes
        element1.style.height = `${containerHeight}px`;
        element2.style.width = `${containerWidth}px`;
    });
}
```


**DOM Performance Optimization:**


- **Layout thrashing** prevention
- **Reflow/repaint** minimization strategies
- **Virtual scrolling** implementation concepts
- **IntersectionObserver** for efficient visibility detection
- **MutationObserver** for DOM change monitoring


### 5. EVENT SYSTEM MASTERY


**Event Flow Understanding:**


```javascript
// Event phases
element.addEventListener('click', handler, {
    capture: true,     // Capture phase
    once: true,       // Execute once then remove
    passive: true     // Never calls preventDefault
});

// Event delegation pattern
function setupDelegation(container, selector, handler) {
    container.addEventListener('click', (event) => {
        const target = event.target.closest(selector);
        if (target) {
            handler.call(target, event);
        }
    });
}
```


**Advanced Event Patterns:**


- **Custom events** creation và dispatch
- **Event emitter** pattern implementation
- **Touch events** handling cho mobile
- **Keyboard navigation** implementation
- **Focus management** strategies


**Memory Management với Events:**


```javascript
// Proper cleanup patterns
class ComponentWithEvents {
    constructor(element) {
        this.element = element;
        this.handleClick = this.handleClick.bind(this);
        this.element.addEventListener('click', this.handleClick);
    }

    handleClick(event) {
        // Handler logic
    }

    destroy() {
        this.element.removeEventListener('click', this.handleClick);
    }
}
```


### 6. ASYNCHRONOUS JAVASCRIPT


**Promise Deep Dive:**


```javascript
// Promise implementation understanding
class MyPromise {
    constructor(executor) {
        this.state = 'pending';
        this.value = undefined;
        this.handlers = [];

        const resolve = (value) => {
            if (this.state === 'pending') {
                this.state = 'fulfilled';
                this.value = value;
                this.handlers.forEach(this.handle.bind(this));
            }
        };

        const reject = (reason) => {
            if (this.state === 'pending') {
                this.state = 'rejected';
                this.value = reason;
                this.handlers.forEach(this.handle.bind(this));
            }
        };

        executor(resolve, reject);
    }
}

// Advanced Promise patterns
Promise.allSettled([promise1, promise2])
    .then(results => {
        results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                console.log(`Promise ${index} fulfilled:`, result.value);
            } else {
                console.log(`Promise ${index} rejected:`, result.reason);
            }
        });
    });
```


**Async/Await Mastery:**


```javascript
// Error handling patterns
async function fetchWithRetry(url, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            if (attempt === maxRetries) {
                throw error;
            }
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
    }
}

// Concurrent async operations
async function processMultipleItems(items) {
    // Sequential (slower)
    const sequentialResults = [];
    for (const item of items) {
        sequentialResults.push(await processItem(item));
    }

    // Concurrent (faster)
    const concurrentResults = await Promise.all(
        items.map(item => processItem(item))
    );

    return { sequentialResults, concurrentResults };
}
```


### 7. FUNCTIONAL PROGRAMMING CONCEPTS


**Array Methods Mastery:**


```javascript
// Advanced array operations
const data = [
    { id: 1, category: 'A', value: 10 },
    { id: 2, category: 'B', value: 20 },
    { id: 3, category: 'A', value: 15 }
];

// Complex data transformations
const result = data
    .filter(item => item.value > 10)
    .reduce((acc, item) => {
        if (!acc[item.category]) {
            acc[item.category] = { items: [], total: 0 };
        }
        acc[item.category].items.push(item);
        acc[item.category].total += item.value;
        return acc;
    }, {});

// Custom higher-order functions
function memoize(fn) {
    const cache = new Map();
    return function(...args) {
        const key = JSON.stringify(args);
        if (cache.has(key)) {
            return cache.get(key);
        }
        const result = fn.apply(this, args);
        cache.set(key, result);
        return result;
    };
}
```


**Immutability Patterns:**


```javascript
// Immutable update patterns
function updateNestedState(state, path, value) {
    const [head, ...tail] = path;

    if (tail.length === 0) {
        return { ...state, [head]: value };
    }

    return {
        ...state,
        [head]: updateNestedState(state[head], tail, value)
    };
}

// Deep cloning strategies
function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(deepClone);
    if (typeof obj === 'object') {
        const clonedObj = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                clonedObj[key] = deepClone(obj[key]);
            }
        }
        return clonedObj;
    }
}
```


### 8. MODERN JAVASCRIPT FEATURES


**ES6+ Features Mastery:**


```javascript
// Destructuring patterns
const { name, age, ...rest } = person;
const [first, second, ...remaining] = array;

// Template literals với tagged templates
function styled(strings, ...values) {
    return strings.reduce((result, string, i) => {
        return result + string + (values[i] || '');
    }, '');
}

// Symbols for private properties
const _private = Symbol('private');
class MyClass {
    constructor() {
        this[_private] = 'hidden';
    }
}

// Generators và Iterators
function* fibonacci() {
    let a = 0, b = 1;
    while (true) {
        yield a;
        [a, b] = [b, a + b];
    }
}

// Proxy for meta-programming
const observableObject = new Proxy(target, {
    set(obj, prop, value) {
        console.log(`Setting ${prop} to ${value}`);
        obj[prop] = value;
        return true;
    }
});
```


### 9. ERROR HANDLING & DEBUGGING


**Advanced Error Handling:**


```javascript
// Custom Error classes
class ValidationError extends Error {
    constructor(message, field) {
        super(message);
        this.name = 'ValidationError';
        this.field = field;
    }
}

// Global error handling
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});
```


### INTERVIEW PREPARATION FOCUS:


**Code Review Scenarios:**


- Identify memory leaks trong DOM manipulation
- Optimize inefficient DOM operations
- Review event handling patterns
- Evaluate object-oriented design patterns


**Architecture Questions:**


- When to use prototype vs class-based inheritance?
- How do you prevent memory leaks với event listeners?
- Explain the difference between shallow và deep copying
- How would you implement a custom event system?


**Performance Questions:**


- How do you optimize DOM manipulation for large datasets?
- What are the performance implications của different this binding patterns?
- How do you handle memory management trong long-lived applications?


Với level senior/lead, interviewer sẽ expect bạn có thể **explain the internals**, **identify performance bottlenecks**, và **mentor others** về những concepts này.


## Claude


## MODERN ECMASCRIPT SPECIFICATIONS (ES6+) - CHI TIẾT CHO SENIOR/LEAD LEVEL


### 1. ES6 (ES2015) - FOUNDATION FEATURES


**Let & Const - Block Scoping:**


```javascript
// Temporal Dead Zone (TDZ)
console.log(typeof myVar); // undefined (var hoisting)
console.log(typeof myLet); // ReferenceError (TDZ)

var myVar = 'var';
let myLet = 'let';

// Block scoping implications
function demonstrateScoping() {
    if (true) {
        var functionScoped = 'visible everywhere';
        let blockScoped = 'only in this block';
        const alsoBlockScoped = 'immutable reference';
    }

    console.log(functionScoped); // Works
    console.log(blockScoped);    // ReferenceError
}

// Const với objects/arrays
const user = { name: 'John' };
user.name = 'Jane'; // OK - modifying property
user.age = 30;      // OK - adding property
// user = {}; // Error - reassigning reference
```


**Arrow Functions - Deep Understanding:**


```javascript
// Lexical this binding
class EventHandler {
    constructor() {
        this.name = 'Handler';

        // Wrong: this binding lost
        setTimeout(function() {
            console.log(this.name); // undefined
        }, 1000);

        // Correct: arrow function preserves this
        setTimeout(() => {
            console.log(this.name); // 'Handler'
        }, 1000);
    }

    // Method definition vs arrow function property
    regularMethod() {
        // Can be overridden, has own 'this'
        return this.name;
    }

    arrowProperty = () => {
        // Cannot be overridden, lexical 'this'
        return this.name;
    }
}

// Arrow functions và hoisting
// const arrow = () => {}; // Not hoisted
// function regular() {} // Hoisted

// Arguments object behavior
function regularFunction() {
    console.log(arguments); // Available
}

const arrowFunction = () => {
    console.log(arguments); // ReferenceError
};

const arrowWithRest = (...args) => {
    console.log(args); // Use rest parameters instead
};
```


**Template Literals & Tagged Templates:**


```javascript
// Basic template literals
const name = 'World';
const message = `Hello, ${name}!`;

// Multiline strings
const html = `
    <div class="container">
        <h1>${title}</h1>
        <p>${description}</p>
    </div>
`;

// Tagged templates - advanced usage
function highlight(strings, ...values) {
    return strings.reduce((result, string, i) => {
        const value = values[i] ? `<mark>${values[i]}</mark>` : '';
        return result + string + value;
    }, '');
}

const searchTerm = 'React';
const text = 'I love React development';
const highlighted = highlight`Search: ${searchTerm} in "${text}"`;

// Styled-components pattern
function styled(strings, ...values) {
    return function(component) {
        const css = strings.reduce((result, string, i) => {
            return result + string + (values[i] || '');
        }, '');
        return { component, css };
    };
}

const Button = styled`
    background: ${props => props.primary ? 'blue' : 'white'};
    color: ${props => props.primary ? 'white' : 'blue'};
`;
```


**Destructuring - Advanced Patterns:**


```javascript
// Array destructuring
const [first, second, ...rest] = [1, 2, 3, 4, 5];
const [a, , c] = [1, 2, 3]; // Skip elements
const [x = 0, y = 0] = []; // Default values

// Object destructuring
const { name, age, address: { city } } = user; // Nested
const { name: userName, age: userAge } = user; // Renaming
const { isActive = true } = user; // Default values

// Function parameter destructuring
function processUser({ name, email, preferences = {} }) {
    const { theme = 'light', notifications = true } = preferences;
    return { name, email, theme, notifications };
}

// Dynamic destructuring
function extractFields(obj, ...fields) {
    return fields.reduce((result, field) => {
        result[field] = obj[field];
        return result;
    }, {});
}

// React props destructuring patterns
const Component = ({
    title,
    subtitle = 'Default subtitle',
    onClick,
    ...restProps
}) => {
    return (
        <div {...restProps}>
            <h1>{title}</h1>
            <h2>{subtitle}</h2>
        </div>
    );
};
```


**Classes - Advanced Usage:**


```javascript
// Class inheritance với super
class Animal {
    constructor(name) {
        this.name = name;
    }

    speak() {
        console.log(`${this.name} makes a sound`);
    }

    static getSpecies() {
        return 'Unknown';
    }
}

class Dog extends Animal {
    constructor(name, breed) {
        super(name); // Must call super first
        this.breed = breed;
    }

    speak() {
        console.log(`${this.name} barks`);
    }

    static getSpecies() {
        return 'Canis lupus';
    }

    // Private fields (ES2022)
    #privateField = 'hidden';

    getPrivateField() {
        return this.#privateField;
    }
}

// Class expression
const MyClass = class {
    constructor() {
        this.value = 'from class expression';
    }
};

// Mixins pattern
const Flyable = {
    fly() {
        console.log(`${this.name} is flying`);
    }
};

const Swimmable = {
    swim() {
        console.log(`${this.name} is swimming`);
    }
};

class Duck extends Animal {
    constructor(name) {
        super(name);
        Object.assign(this, Flyable, Swimmable);
    }
}
```


### 2. ES2016 (ES7) - INCREMENTAL IMPROVEMENTS


**Exponentiation Operator:**


```javascript
// Before: Math.pow(2, 8)
const result = 2 ** 8; // 256

// Compound assignment
let value = 2;
value **= 3; // value = 8
```


**Array.includes():**


```javascript
// Better than indexOf for existence check
const numbers = [1, 2, 3, NaN];

// Old way
if (numbers.indexOf(2) !== -1) { /* found */ }

// New way
if (numbers.includes(2)) { /* found */ }

// Works với NaN
console.log(numbers.includes(NaN)); // true
console.log(numbers.indexOf(NaN));  // -1
```


### 3. ES2017 (ES8) - ASYNC REVOLUTION


**Async/Await - Advanced Patterns:**


```javascript
// Error handling patterns
async function fetchUserData(userId) {
    try {
        const response = await fetch(`/api/users/${userId}`);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const userData = await response.json();
        return userData;
    } catch (error) {
        console.error('Failed to fetch user:', error);
        throw error; // Re-throw for caller to handle
    }
}

// Parallel vs Sequential execution
async function processData() {
    // Sequential (slower)
    const user = await fetchUser();
    const posts = await fetchPosts();
    const comments = await fetchComments();

    // Parallel (faster)
    const [userParallel, postsParallel, commentsParallel] = await Promise.all([
        fetchUser(),
        fetchPosts(),
        fetchComments()
    ]);

    // Mixed approach
    const userData = await fetchUser();
    const [userPosts, userComments] = await Promise.all([
        fetchUserPosts(userData.id),
        fetchUserComments(userData.id)
    ]);
}

// Custom async utilities
async function asyncMap(array, asyncCallback) {
    const results = [];
    for (let i = 0; i < array.length; i++) {
        results[i] = await asyncCallback(array[i], i, array);
    }
    return results;
}

async function asyncFilter(array, asyncPredicate) {
    const results = await Promise.all(
        array.map(async (item, index) => {
            const shouldInclude = await asyncPredicate(item, index, array);
            return { item, shouldInclude };
        })
    );

    return results
        .filter(({ shouldInclude }) => shouldInclude)
        .map(({ item }) => item);
}

// React usage patterns
function useAsyncData(url) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;

        async function fetchData() {
            try {
                setLoading(true);
                const response = await fetch(url);
                const result = await response.json();

                if (!cancelled) {
                    setData(result);
                    setError(null);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        fetchData();

        return () => {
            cancelled = true;
        };
    }, [url]);

    return { data, loading, error };
}
```


**Object Methods Enhancement:**


```javascript
// Object.entries() và Object.values()
const user = { name: 'John', age: 30, city: 'NYC' };

// Iterate over entries
Object.entries(user).forEach(([key, value]) => {
    console.log(`${key}: ${value}`);
});

// Convert object to Map
const userMap = new Map(Object.entries(user));

// Get only values
const values = Object.values(user); // ['John', 30, 'NYC']

// Practical usage - form validation
function validateForm(formData) {
    const errors = {};

    Object.entries(formData).forEach(([field, value]) => {
        if (!value || value.trim() === '') {
            errors[field] = `${field} is required`;
        }
    });

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
}

// Object.getOwnPropertyDescriptors()
const source = {
    get foo() { return 'getter'; },
    set foo(value) { console.log('setter', value); }
};

// Shallow copy với getters/setters preserved
const target = Object.create(
    Object.getPrototypeOf(source),
    Object.getOwnPropertyDescriptors(source)
);
```


**String Padding:**


```javascript
// String.padStart() và padEnd()
const numbers = [1, 12, 123];
numbers.forEach(num => {
    console.log(num.toString().padStart(5, '0')); // 00001, 00012, 00123
});

// Formatting use cases
function formatTime(hours, minutes, seconds) {
    return [hours, minutes, seconds]
        .map(unit => unit.toString().padStart(2, '0'))
        .join(':');
}

// Credit card masking
function maskCreditCard(cardNumber) {
    const lastFour = cardNumber.slice(-4);
    return lastFour.padStart(cardNumber.length, '*');
}
```


### 4. ES2018 (ES9) - ASYNC ITERATION & REST/SPREAD


**Async Iteration:**


```javascript
// Async generators
async function* asyncGenerator() {
    let i = 0;
    while (i < 3) {
        // Simulate async operation
        await new Promise(resolve => setTimeout(resolve, 1000));
        yield i++;
    }
}

// for-await-of loop
async function processAsyncIterable() {
    for await (const value of asyncGenerator()) {
        console.log(value); // 0, 1, 2 (with 1s delay each)
    }
}

// Real-world example: processing paginated API
async function* fetchAllPages(baseUrl) {
    let page = 1;
    let hasMore = true;

    while (hasMore) {
        const response = await fetch(`${baseUrl}?page=${page}`);
        const data = await response.json();

        yield data.items;

        hasMore = data.hasMore;
        page++;
    }
}

async function processAllData() {
    for await (const pageItems of fetchAllPages('/api/data')) {
        pageItems.forEach(item => processItem(item));
    }
}
```


**Object Rest/Spread:**


```javascript
// Object spread
const defaults = { theme: 'light', sidebar: true };
const userPrefs = { theme: 'dark' };
const finalPrefs = { ...defaults, ...userPrefs }; // { theme: 'dark', sidebar: true }

// Object rest
const { name, age, ...otherProps } = user;

// Practical patterns
function createComponent(props) {
    const { className, children, ...restProps } = props;

    return (
        <div
            className={`component ${className || ''}`}
            {...restProps}
        >
            {children}
        </div>
    );
}

// Conditional spread
const buttonProps = {
    type: 'button',
    ...(disabled && { disabled: true }),
    ...(loading && { 'aria-busy': true })
};

// Nested object updates (immutable)
function updateNestedProp(state, path, value) {
    const [head, ...tail] = path;

    return {
        ...state,
        [head]: tail.length === 0
            ? value
            : updateNestedProp(state[head] || {}, tail, value)
    };
}
```


**RegExp Enhancements:**


```javascript
// Named capture groups
const dateRegex = /(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})/;
const match = '2023-12-25'.match(dateRegex);
console.log(match.groups); // { year: '2023', month: '12', day: '25' }

// Lookbehind assertions
const priceRegex = /(?<=\$)\d+/; // Matches digits preceded by $
const price = '$100 and €200'.match(priceRegex); // ['100']

// s (dotAll) flag
const multilineText = `Line 1
Line 2`;
const regex = /Line 1.Line 2/s; // . matches newlines với s flag
```


### 5. ES2019 (ES10) - ARRAY & OBJECT IMPROVEMENTS


**Array.flat() và flatMap():**


```javascript
// Array flattening
const nested = [1, [2, 3], [4, [5, 6]]];
console.log(nested.flat());    // [1, 2, 3, 4, [5, 6]]
console.log(nested.flat(2));   // [1, 2, 3, 4, 5, 6]
console.log(nested.flat(Infinity)); // Flatten all levels

// flatMap - map + flat(1)
const sentences = ['Hello world', 'How are you'];
const words = sentences.flatMap(sentence => sentence.split(' '));
// ['Hello', 'world', 'How', 'are', 'you']

// Practical usage
function extractTagsFromPosts(posts) {
    return posts
        .flatMap(post => post.tags)
        .filter((tag, index, arr) => arr.indexOf(tag) === index); // Unique tags
}
```


**Object.fromEntries():**


```javascript
// Convert Map to Object
const map = new Map([['name', 'John'], ['age', 30]]);
const obj = Object.fromEntries(map); // { name: 'John', age: 30 }

// Filter object properties
function filterObject(obj, predicate) {
    return Object.fromEntries(
        Object.entries(obj).filter(([key, value]) => predicate(key, value))
    );
}

const user = { name: 'John', age: 30, isActive: false };
const activeProps = filterObject(user, (key, value) => value !== false);

// Transform object values
function mapObject(obj, transformer) {
    return Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [key, transformer(value, key)])
    );
}

const uppercased = mapObject(user, (value, key) =>
    typeof value === 'string' ? value.toUpperCase() : value
);
```


**String.trimStart() và trimEnd():**


```javascript
// More semantic than trimLeft/trimRight
const text = '  hello world  ';
console.log(text.trimStart()); // 'hello world  '
console.log(text.trimEnd());   // '  hello world'

// Useful for processing indented code
function removeIndentation(code) {
    const lines = code.split('\n');
    const minIndent = Math.min(
        ...lines
            .filter(line => line.trim())
            .map(line => line.length - line.trimStart().length)
    );

    return lines
        .map(line => line.slice(minIndent))
        .join('\n');
}
```


### 6. ES2020 (ES11) - BIG INT & OPTIONAL CHAINING


**Optional Chaining (?.) - Game Changer:**


```javascript
// Accessing nested properties safely
const user = {
    name: 'John',
    address: {
        street: '123 Main St',
        city: 'NYC'
    }
};

// Old way
const zipCode = user && user.address && user.address.zipCode;

// New way
const zipCodeNew = user?.address?.zipCode; // undefined instead of error

// Method calls
user?.getName?.(); // Call method if it exists

// Array access
const firstHobby = user?.hobbies?.[0];

// Practical React usage
function UserProfile({ user }) {
    return (
        <div>
            <h1>{user?.name ?? 'Unknown User'}</h1>
            <p>{user?.address?.city ?? 'No city'}</p>
            <img src={user?.avatar?.url} alt={user?.name} />
        </div>
    );
}

// API response handling
async function fetchUserProfile(userId) {
    const response = await fetch(`/api/users/${userId}`);
    const data = await response.json();

    return {
        name: data?.user?.profile?.displayName ?? data?.user?.username,
        email: data?.user?.contact?.email,
        avatar: data?.user?.profile?.avatar?.thumbnail?.url,
        preferences: {
            theme: data?.user?.settings?.ui?.theme ?? 'light',
            notifications: data?.user?.settings?.notifications?.enabled ?? true
        }
    };
}
```


**Nullish Coalescing (??) - Precise Defaults:**


```javascript
// Difference from ||
const value1 = '' || 'default';    // 'default' (empty string is falsy)
const value2 = '' ?? 'default';    // '' (empty string is not nullish)

const value3 = 0 || 'default';     // 'default' (0 is falsy)
const value4 = 0 ?? 'default';     // 0 (0 is not nullish)

// Only null và undefined trigger the default
const value5 = null ?? 'default';      // 'default'
const value6 = undefined ?? 'default'; // 'default'

// Practical usage
function createConfig(options = {}) {
    return {
        debug: options.debug ?? false,           // Allow explicit false
        timeout: options.timeout ?? 5000,       // Allow 0 timeout
        retries: options.retries ?? 3,          // Allow 0 retries
        endpoint: options.endpoint ?? '/api',    // Empty string would use '/api'
    };
}

// Chaining với optional chaining
const config = {
    api: {
        timeout: user?.preferences?.apiTimeout ?? 5000,
        retries: user?.preferences?.apiRetries ?? 3
    }
};
```


**BigInt - Large Numbers:**


```javascript
// For numbers larger than Number.MAX_SAFE_INTEGER
const bigNumber = BigInt(9007199254740991); // or 9007199254740991n
const anotherBig = 123n;

// Operations
const sum = bigNumber + anotherBig;
const product = bigNumber * 2n;

// Cannot mix with regular numbers
// const mixed = bigNumber + 123; // TypeError
const mixed = bigNumber + BigInt(123); // OK

// Use cases: cryptocurrency, large IDs
function generateUniqueId() {
    return BigInt(Date.now()) * 1000n + BigInt(Math.random() * 1000);
}
```


**Dynamic Imports - Code Splitting:**


```javascript
// Dynamic imports return promises
async function loadModule() {
    const module = await import('./heavy-module.js');
    return module.default;
}

// Conditional loading
async function loadFeature(featureName) {
    switch (featureName) {
        case 'charts':
            return import('./chart-library.js');
        case 'editor':
            return import('./text-editor.js');
        default:
            throw new Error(`Unknown feature: ${featureName}`);
    }
}

// React code splitting
const LazyComponent = React.lazy(() => import('./LazyComponent'));

function App() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <LazyComponent />
        </Suspense>
    );
}

// Feature detection and polyfill loading
async function loadPolyfills() {
    if (!window.IntersectionObserver) {
        await import('intersection-observer');
    }

    if (!window.fetch) {
        await import('whatwg-fetch');
    }
}
```


### 7. ES2021 (ES12) - STRING & ARRAY ENHANCEMENTS


**String.replaceAll():**


```javascript
// Replace all occurrences without regex
const text = 'hello world hello universe';
const replaced = text.replaceAll('hello', 'hi');
// 'hi world hi universe'

// With regex (global flag required)
const regexReplaced = text.replaceAll(/hello/g, 'hi');

// Practical usage - template processing
function processTemplate(template, variables) {
    return Object.entries(variables).reduce(
        (result, [key, value]) => result.replaceAll(`{{${key}}}`, value),
        template
    );
}

const template = 'Hello {{name}}, welcome to {{site}}!';
const processed = processTemplate(template, {
    name: 'John',
    site: 'Our Website'
});
```


**Logical Assignment Operators:**


```javascript
// ||= (Logical OR assignment)
let config = { theme: null };
config.theme ||= 'light'; // Assigns if falsy
console.log(config.theme); // 'light'

// &&= (Logical AND assignment)
let user = { name: 'John' };
user.name &&= user.name.toUpperCase(); // Assigns if truthy
console.log(user.name); // 'JOHN'

// ??= (Nullish coalescing assignment)
let settings = { timeout: 0 };
settings.timeout ??= 5000; // Only assigns if null/undefined
console.log(settings.timeout); // 0 (not 5000!)

// Practical usage
function initializeDefaults(config) {
    config.debug ??= false;
    config.timeout ??= 5000;
    config.retries ??= 3;

    // Only uppercase if name exists
    config.username &&= config.username.toLowerCase();

    // Set default theme if none provided
    config.theme ||= 'light';

    return config;
}
```


**Numeric Separators:**


```javascript
// Make large numbers readable
const million = 1_000_000;
const binary = 0b1010_0001;
const octal = 0o755;
const hex = 0xFF_EC_DE_5E;
const bigInt = 123_456n;

// Practical usage
const API_TIMEOUT = 30_000; // 30 seconds
const MAX_FILE_SIZE = 10_485_760; // 10MB
const EARTH_RADIUS_KM = 6_371;
```


### 8. ES2022 (ES13) - CLASS FIELDS & TOP-LEVEL AWAIT


**Private Class Fields:**


```javascript
class Counter {
    // Private field
    #count = 0;

    // Private method
    #validate(value) {
        return typeof value === 'number' && value >= 0;
    }

    increment() {
        this.#count++;
    }

    add(value) {
        if (this.#validate(value)) {
            this.#count += value;
        }
    }

    get value() {
        return this.#count;
    }
}

// React class component với private fields
class Component extends React.Component {
    #mounted = false;
    #timeoutId = null;

    componentDidMount() {
        this.#mounted = true;
        this.#scheduleUpdate();
    }

    componentWillUnmount() {
        this.#mounted = false;
        if (this.#timeoutId) {
            clearTimeout(this.#timeoutId);
        }
    }

    #scheduleUpdate = () => {
        if (this.#mounted) {
            this.#timeoutId = setTimeout(() => {
                this.forceUpdate();
                this.#scheduleUpdate();
            }, 1000);
        }
    }
}
```


**Static Class Features:**


```javascript
class MathUtils {
    // Static private field
    static #PI = 3.14159;

    // Static block for complex initialization
    static {
        // Runs once when class is defined
        console.log('MathUtils class initialized');
        this.#setupConstants();
    }

    static #setupConstants() {
        // Complex initialization logic
    }

    static getCircleArea(radius) {
        return this.#PI * radius ** 2;
    }
}

// Factory pattern với static methods
class User {
    #name;
    #email;

    constructor(name, email) {
        this.#name = name;
        this.#email = email;
    }

    static fromJSON(json) {
        const data = JSON.parse(json);
        return new User(data.name, data.email);
    }

    static async fromAPI(userId) {
        const response = await fetch(`/api/users/${userId}`);
        const userData = await response.json();
        return new User(userData.name, userData.email);
    }
}
```


**Top-level Await:**


```javascript
// Module-level async operations
const config = await fetch('/config.json').then(r => r.json());
const translations = await import(`./locales/${config.locale}.js`);

// Conditional imports
const analytics = config.analytics.enabled
    ? await import('./analytics.js')
    : { track: () => {} };

// Error handling at module level
let database;
try {
    database = await connectToDatabase();
} catch (error) {
    console.error('Database connection failed:', error);
    database = createMockDatabase();
}

export { config, translations, analytics, database };
```


### 9. ES2023 (ES14) - ARRAY METHODS


**Array.findLast() và findLastIndex():**


```javascript
const numbers = [1, 2, 3, 4, 3, 2, 1];

// Find last occurrence
const lastThree = numbers.findLast(n => n === 3); // 3
const lastThreeIndex = numbers.findLastIndex(n => n === 3); // 4

// Practical usage - find latest matching record
const logs = [
    { level: 'info', message: 'App started', timestamp: 1001 },
    { level: 'error', message: 'Connection failed', timestamp: 1002 },
    { level: 'info', message: 'Retrying...', timestamp: 1003 },
    { level: 'error', message: 'Still failing', timestamp: 1004 }
];

const lastError = logs.findLast(log => log.level === 'error');
console.log(lastError.message); // 'Still failing'
```


**Array.toSorted(), toReversed(), toSpliced():**


```javascript
// Immutable array operations
const original = [3, 1, 4, 1, 5];

// toSorted() - returns new sorted array
const sorted = original.toSorted(); // [1, 1, 3, 4, 5]
console.log(original); // [3, 1, 4, 1, 5] (unchanged)

// toReversed() - returns new reversed array
const reversed = original.toReversed(); // [5, 1, 4, 1, 3]

// toSpliced() - returns new array với splice operation
const spliced = original.toSpliced(2, 1, 'new'); // [3, 1, 'new', 1, 5]

// React state updates
function TodoList() {
    const [todos, setTodos] = useState(['Buy milk', 'Walk dog']);

    const addTodo = (todo) => {
        setTodos(current => current.toSpliced(current.length, 0, todo));
    };

    const removeTodo = (index) => {
        setTodos(current => current.toSpliced(index, 1));
    };

    const sortTodos = () => {
        setTodos(current => current.toSorted());
    };
}
```


### 10. PRACTICAL INTERVIEW PREPARATION


**Code Review Scenarios:**


```javascript
// Before: ES5 style
function processUsers(users) {
    var activeUsers = [];
    for (var i = 0; i < users.length; i++) {
        if (users[i].isActive) {
            activeUsers.push({
                name: users[i].name,
                email: users[i].email
            });
        }
    }
    return activeUsers;
}

// After: Modern ES6+
const processUsers = (users) =>
    users
        .filter(user => user.isActive)
        .map(({ name, email }) => ({ name, email }));

// Advanced: với error handling và type safety
const processUsersAdvanced = (users) => {
    try {
        return users
            ?.filter(user => user?.isActive)
            .map(({ name, email, ...rest }) => ({
                name: name ?? 'Unknown',
                email: email ?? 'No email',
                ...rest
            })) ?? [];
    } catch (error) {
        console.error('Error processing users:', error);
        return [];
    }
};
```


**Performance Considerations:**


```javascript
// Memory optimization with WeakMap
const userMetadata = new WeakMap();

class UserManager {
    addUser(user) {
        // Private data stored separately
        userMetadata.set(user, {
            loginCount: 0,
            lastAccess: new Date()
        });
    }

    getUserStats(user) {
        return userMetadata.get(user);
    }
}

// Async performance patterns
async function batchProcess(items, batchSize = 10) {
    const results = [];

    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const batchResults = await Promise.all(
            batch.map(item => processItem(item))
        );
        results.push(...batchResults);

        // Allow other tasks to run
        await new Promise(resolve => setTimeout(resolve, 0));
    }

    return results;
}
```


**Architecture Questions để Chuẩn Bị:**


- When would you use class fields vs constructor properties?
- How does optional chaining affect bundle size?
- What are the performance implications of dynamic imports?
- How do you handle browser compatibility for modern features?
- When should you use BigInt over regular numbers?
- How do private fields compare to TypeScript private properties?


Với kiến thức này, bạn có thể demonstrate understanding not just of syntax, but of **when và why** to use each feature, và **how they impact** performance và maintainability trong real-world applications.


## Claude


## REACT HOOKS & LIFECYCLE METHODS - CHI TIẾT CHO SENIOR/LEAD LEVEL


### 1. LIFECYCLE METHODS TO HOOKS MIGRATION


**Class Component Lifecycle Mapping:**


```javascript
// Class Component với full lifecycle
class UserProfile extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            user: null,
            loading: true,
            error: null
        };
    }

    // componentDidMount
    componentDidMount() {
        this.fetchUser(this.props.userId);
    }

    // componentDidUpdate
    componentDidUpdate(prevProps) {
        if (prevProps.userId !== this.props.userId) {
            this.fetchUser(this.props.userId);
        }
    }

    // componentWillUnmount
    componentWillUnmount() {
        // Cleanup subscriptions, cancel requests
        if (this.abortController) {
            this.abortController.abort();
        }
    }

    // getDerivedStateFromProps equivalent
    static getDerivedStateFromProps(props, state) {
        if (props.resetUser && state.user) {
            return { user: null, loading: true };
        }
        return null;
    }

    fetchUser = async (userId) => {
        try {
            this.setState({ loading: true, error: null });
            const user = await api.fetchUser(userId);
            this.setState({ user, loading: false });
        } catch (error) {
            this.setState({ error, loading: false });
        }
    }
}

// Equivalent Function Component với Hooks
function UserProfile({ userId, resetUser }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // getDerivedStateFromProps equivalent
    useEffect(() => {
        if (resetUser && user) {
            setUser(null);
            setLoading(true);
        }
    }, [resetUser, user]);

    // componentDidMount + componentDidUpdate + componentWillUnmount
    useEffect(() => {
        const abortController = new AbortController();

        const fetchUser = async () => {
            try {
                setLoading(true);
                setError(null);
                const userData = await api.fetchUser(userId, {
                    signal: abortController.signal
                });
                setUser(userData);
            } catch (err) {
                if (err.name !== 'AbortError') {
                    setError(err);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchUser();

        // Cleanup (componentWillUnmount)
        return () => {
            abortController.abort();
        };
    }, [userId]); // Dependencies (componentDidUpdate trigger)

    return (
        <div>
            {loading && <div>Loading...</div>}
            {error && <div>Error: {error.message}</div>}
            {user && <div>Welcome, {user.name}</div>}
        </div>
    );
}
```


### 2. USESTATE - ADVANCED PATTERNS


**State Updates & Batching:**


```javascript
function Counter() {
    const [count, setCount] = useState(0);

    // Functional updates for state based on previous state
    const increment = () => {
        setCount(prevCount => prevCount + 1);
    };

    // Multiple state updates are batched in React 18+
    const handleMultipleUpdates = () => {
        setCount(c => c + 1); // Batched
        setCount(c => c + 1); // Batched
        setCount(c => c + 1); // Batched
        // Result: count increases by 3
    };

    // Async batching in React 18
    const handleAsyncUpdates = async () => {
        await new Promise(resolve => setTimeout(resolve, 100));

        // These are now batched in React 18 (not in 17)
        setCount(c => c + 1);
        setCount(c => c + 1);
    };

    return (
        <div>
            <p>Count: {count}</p>
            <button onClick={increment}>+1</button>
            <button onClick={handleMultipleUpdates}>+3</button>
        </div>
    );
}
```


**Complex State Management:**


```javascript
// Object state updates
function UserForm() {
    const [user, setUser] = useState({
        name: '',
        email: '',
        preferences: {
            theme: 'light',
            notifications: true
        }
    });

    // Shallow merge for top-level properties
    const updateUser = (updates) => {
        setUser(prevUser => ({
            ...prevUser,
            ...updates
        }));
    };

    // Deep nested updates
    const updatePreferences = (prefUpdates) => {
        setUser(prevUser => ({
            ...prevUser,
            preferences: {
                ...prevUser.preferences,
                ...prefUpdates
            }
        }));
    };

    // Generic nested update utility
    const updateNestedState = (path, value) => {
        setUser(prevUser => {
            const updated = { ...prevUser };
            let current = updated;

            for (let i = 0; i < path.length - 1; i++) {
                current[path[i]] = { ...current[path[i]] };
                current = current[path[i]];
            }

            current[path[path.length - 1]] = value;
            return updated;
        });
    };

    return (
        <form>
            <input
                value={user.name}
                onChange={e => updateUser({ name: e.target.value })}
                placeholder="Name"
            />
            <input
                value={user.email}
                onChange={e => updateUser({ email: e.target.value })}
                placeholder="Email"
            />
            <select
                value={user.preferences.theme}
                onChange={e => updatePreferences({ theme: e.target.value })}
            >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
            </select>
        </form>
    );
}
```


**Lazy Initial State:**


```javascript
function ExpensiveComponent({ data }) {
    // Expensive computation only runs once
    const [processedData, setProcessedData] = useState(() => {
        console.log('Processing data...');
        return data.map(item => ({
            ...item,
            computed: expensiveComputation(item)
        }));
    });

    // Don't do this - runs on every render
    // const [processedData, setProcessedData] = useState(
    //     data.map(item => ({ ...item, computed: expensiveComputation(item) }))
    // );

    return <div>{/* Render processed data */}</div>;
}
```


### 3. USEEFFECT - MASTERY LEVEL


**Dependency Array Deep Dive:**


```javascript
function UserProfile({ userId, options }) {
    const [user, setUser] = useState(null);

    // ❌ Missing dependencies
    useEffect(() => {
        fetchUser(userId, options).then(setUser);
    }, []); // Missing userId, options

    // ❌ Object/function dependencies cause infinite loops
    useEffect(() => {
        fetchUser(userId, options).then(setUser);
    }, [userId, options]); // options object changes every render

    // ✅ Proper dependency handling
    const { theme, language } = options;
    useEffect(() => {
        fetchUser(userId, { theme, language }).then(setUser);
    }, [userId, theme, language]);

    // ✅ Alternative: memoize complex objects
    const stableOptions = useMemo(() => ({
        theme: options.theme,
        language: options.language
    }), [options.theme, options.language]);

    useEffect(() => {
        fetchUser(userId, stableOptions).then(setUser);
    }, [userId, stableOptions]);
}
```


**Effect Cleanup Patterns:**


```javascript
function DataSubscription({ endpoint }) {
    const [data, setData] = useState(null);

    useEffect(() => {
        let cancelled = false;
        const abortController = new AbortController();

        // WebSocket connection
        const ws = new WebSocket(endpoint);

        ws.onmessage = (event) => {
            if (!cancelled) {
                setData(JSON.parse(event.data));
            }
        };

        // HTTP request với abort signal
        const fetchInitialData = async () => {
            try {
                const response = await fetch('/api/initial', {
                    signal: abortController.signal
                });
                const initialData = await response.json();

                if (!cancelled) {
                    setData(initialData);
                }
            } catch (error) {
                if (error.name !== 'AbortError' && !cancelled) {
                    console.error('Failed to fetch initial data:', error);
                }
            }
        };

        fetchInitialData();

        // Cleanup function
        return () => {
            cancelled = true;
            abortController.abort();
            ws.close();
        };
    }, [endpoint]);

    return data ? <div>{JSON.stringify(data)}</div> : <div>Loading...</div>;
}
```


**Effect Timing - useEffect vs useLayoutEffect:**


```javascript
function MeasureComponent() {
    const [height, setHeight] = useState(0);
    const elementRef = useRef(null);

    // useLayoutEffect - runs synchronously after DOM mutations
    // but before browser paint
    useLayoutEffect(() => {
        if (elementRef.current) {
            const rect = elementRef.current.getBoundingClientRect();
            setHeight(rect.height);
        }
    }, []); // Runs after every render, before paint

    // useEffect - runs asynchronously after browser paint
    // Use for side effects that don't need to block painting
    useEffect(() => {
        // Analytics, logging, non-visual side effects
        analytics.track('component-mounted');
    }, []);

    return (
        <div ref={elementRef}>
            <p>Component height: {height}px</p>
            <p>This content determines the height</p>
        </div>
    );
}
```


**Custom Effect Hooks:**


```javascript
// Generic async effect hook
function useAsyncEffect(asyncFn, deps, cleanup) {
    useEffect(() => {
        let cancelled = false;
        const abortController = new AbortController();

        const runAsync = async () => {
            try {
                await asyncFn(abortController.signal, cancelled);
            } catch (error) {
                if (error.name !== 'AbortError' && !cancelled) {
                    console.error('Async effect error:', error);
                }
            }
        };

        runAsync();

        return () => {
            cancelled = true;
            abortController.abort();
            cleanup?.();
        };
    }, deps);
}

// Usage
function MyComponent({ userId }) {
    const [user, setUser] = useState(null);

    useAsyncEffect(
        async (signal, cancelled) => {
            const userData = await fetchUser(userId, { signal });
            if (!cancelled) {
                setUser(userData);
            }
        },
        [userId],
        () => {
            // Additional cleanup
            setUser(null);
        }
    );
}
```


### 4. USEREDUCER - STATE MACHINE PATTERNS


**Complex State Management:**


```javascript
// Action types
const ACTIONS = {
    FETCH_START: 'FETCH_START',
    FETCH_SUCCESS: 'FETCH_SUCCESS',
    FETCH_ERROR: 'FETCH_ERROR',
    RESET: 'RESET',
    UPDATE_FILTER: 'UPDATE_FILTER'
};

// Reducer với type safety
function dataReducer(state, action) {
    switch (action.type) {
        case ACTIONS.FETCH_START:
            return {
                ...state,
                loading: true,
                error: null
            };

        case ACTIONS.FETCH_SUCCESS:
            return {
                ...state,
                loading: false,
                data: action.payload,
                error: null,
                lastFetch: Date.now()
            };

        case ACTIONS.FETCH_ERROR:
            return {
                ...state,
                loading: false,
                error: action.payload,
                data: null
            };

        case ACTIONS.UPDATE_FILTER:
            return {
                ...state,
                filters: {
                    ...state.filters,
                    ...action.payload
                }
            };

        case ACTIONS.RESET:
            return initialState;

        default:
            throw new Error(`Unknown action type: ${action.type}`);
    }
}

const initialState = {
    data: null,
    loading: false,
    error: null,
    filters: {},
    lastFetch: null
};

function DataManager({ endpoint }) {
    const [state, dispatch] = useReducer(dataReducer, initialState);

    // Action creators
    const actions = useMemo(() => ({
        fetchData: async (params) => {
            dispatch({ type: ACTIONS.FETCH_START });
            try {
                const data = await api.fetch(endpoint, params);
                dispatch({ type: ACTIONS.FETCH_SUCCESS, payload: data });
            } catch (error) {
                dispatch({ type: ACTIONS.FETCH_ERROR, payload: error });
            }
        },

        updateFilter: (filterUpdates) => {
            dispatch({
                type: ACTIONS.UPDATE_FILTER,
                payload: filterUpdates
            });
        },

        reset: () => {
            dispatch({ type: ACTIONS.RESET });
        }
    }), [endpoint]);

    // Auto-fetch when filters change
    useEffect(() => {
        actions.fetchData(state.filters);
    }, [state.filters, actions]);

    return (
        <div>
            {state.loading && <div>Loading...</div>}
            {state.error && <div>Error: {state.error.message}</div>}
            {state.data && (
                <DataTable
                    data={state.data}
                    onFilterChange={actions.updateFilter}
                />
            )}
        </div>
    );
}
```


**Form State với useReducer:**


```javascript
const FORM_ACTIONS = {
    SET_FIELD: 'SET_FIELD',
    SET_ERROR: 'SET_ERROR',
    SET_ERRORS: 'SET_ERRORS',
    RESET: 'RESET',
    SET_SUBMITTING: 'SET_SUBMITTING'
};

function formReducer(state, action) {
    switch (action.type) {
        case FORM_ACTIONS.SET_FIELD:
            return {
                ...state,
                values: {
                    ...state.values,
                    [action.field]: action.value
                },
                errors: {
                    ...state.errors,
                    [action.field]: null // Clear field error on change
                }
            };

        case FORM_ACTIONS.SET_ERROR:
            return {
                ...state,
                errors: {
                    ...state.errors,
                    [action.field]: action.error
                }
            };

        case FORM_ACTIONS.SET_ERRORS:
            return {
                ...state,
                errors: action.errors
            };

        case FORM_ACTIONS.SET_SUBMITTING:
            return {
                ...state,
                isSubmitting: action.isSubmitting
            };

        case FORM_ACTIONS.RESET:
            return action.initialState || {
                values: {},
                errors: {},
                isSubmitting: false
            };

        default:
            return state;
    }
}

function useForm(initialValues = {}, validationRules = {}) {
    const [state, dispatch] = useReducer(formReducer, {
        values: initialValues,
        errors: {},
        isSubmitting: false
    });

    const setField = useCallback((field, value) => {
        dispatch({ type: FORM_ACTIONS.SET_FIELD, field, value });
    }, []);

    const validate = useCallback((values = state.values) => {
        const errors = {};

        Object.entries(validationRules).forEach(([field, rules]) => {
            const value = values[field];

            for (const rule of rules) {
                const error = rule(value, values);
                if (error) {
                    errors[field] = error;
                    break;
                }
            }
        });

        return errors;
    }, [validationRules, state.values]);

    const submit = useCallback(async (onSubmit) => {
        const errors = validate();

        if (Object.keys(errors).length > 0) {
            dispatch({ type: FORM_ACTIONS.SET_ERRORS, errors });
            return false;
        }

        dispatch({ type: FORM_ACTIONS.SET_SUBMITTING, isSubmitting: true });

        try {
            await onSubmit(state.values);
            return true;
        } catch (error) {
            if (error.fieldErrors) {
                dispatch({ type: FORM_ACTIONS.SET_ERRORS, errors: error.fieldErrors });
            }
            return false;
        } finally {
            dispatch({ type: FORM_ACTIONS.SET_SUBMITTING, isSubmitting: false });
        }
    }, [state.values, validate]);

    return {
        values: state.values,
        errors: state.errors,
        isSubmitting: state.isSubmitting,
        setField,
        submit,
        reset: () => dispatch({ type: FORM_ACTIONS.RESET })
    };
}
```


### 5. USEMEMO & USECALLBACK - OPTIMIZATION MASTERY


**When to Memoize:**


```javascript
function DataTable({ data, filters, onRowSelect, sortBy }) {
    // ✅ Expensive computation - should memoize
    const processedData = useMemo(() => {
        console.log('Processing data...'); // Should only log when data/filters change

        return data
            .filter(item => {
                return Object.entries(filters).every(([key, value]) => {
                    if (!value) return true;
                    return item[key]?.toString().toLowerCase().includes(value.toLowerCase());
                });
            })
            .sort((a, b) => {
                if (!sortBy.field) return 0;
                const aVal = a[sortBy.field];
                const bVal = b[sortBy.field];

                if (sortBy.direction === 'asc') {
                    return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
                } else {
                    return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
                }
            });
    }, [data, filters, sortBy]);

    // ✅ Event handler passed to child components - should memoize
    const handleRowClick = useCallback((row) => {
        onRowSelect(row);
        // Additional logic here...
        analytics.track('row_selected', { rowId: row.id });
    }, [onRowSelect]);

    // ❌ Don't memoize simple computations
    // const itemCount = useMemo(() => data.length, [data]); // Unnecessary
    const itemCount = data.length; // Simple enough

    // ❌ Don't memoize if dependencies change frequently
    // const timestamp = useMemo(() => Date.now(), []); // Wrong usage

    return (
        <div>
            <div>Showing {itemCount} items</div>
            {processedData.map(row => (
                <TableRow
                    key={row.id}
                    data={row}
                    onClick={handleRowClick}
                />
            ))}
        </div>
    );
}

// Child component that benefits from memoization
const TableRow = React.memo(({ data, onClick }) => {
    // Only re-renders if data or onClick changes
    const handleClick = () => onClick(data);

    return (
        <div onClick={handleClick}>
            {data.name} - {data.value}
        </div>
    );
});
```


**Advanced Memoization Patterns:**


```javascript
// Memoize với complex dependencies
function useExpensiveCalculation(data, config) {
    return useMemo(() => {
        // Complex computation
        return data.reduce((acc, item) => {
            const processed = processItem(item, config);
            return {
                ...acc,
                [item.id]: processed
            };
        }, {});
    }, [data, config.algorithm, config.threshold]); // Only relevant config props
}

// Memoize object creation
function UserProfile({ user, permissions }) {
    const userWithPermissions = useMemo(() => ({
        ...user,
        canEdit: permissions.includes('edit'),
        canDelete: permissions.includes('delete'),
        canView: permissions.includes('view')
    }), [user, permissions]);

    return <ProfileDisplay user={userWithPermissions} />;
}

// Conditional memoization
function ConditionalMemo({ shouldOptimize, data, processor }) {
    const processedData = useMemo(() => {
        return processor(data);
    }, shouldOptimize ? [data, processor] : [data, processor, Math.random()]);

    // Alternative approach
    const processedDataAlt = shouldOptimize
        ? useMemo(() => processor(data), [data, processor])
        : processor(data);

    return <div>{/* Render processed data */}</div>;
}
```


### 6. USEREF - DOM & MUTABLE VALUES


**DOM Manipulation & Focus Management:**


```javascript
function FormWithFocusManagement() {
    const firstInputRef = useRef(null);
    const lastInputRef = useRef(null);
    const formRef = useRef(null);

    // Focus first input on mount
    useEffect(() => {
        firstInputRef.current?.focus();
    }, []);

    // Handle form navigation
    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            // Submit form
            handleSubmit();
        } else if (e.key === 'Escape') {
            // Clear form
            formRef.current?.reset();
        }
    }, []);

    // Auto-focus next field
    const focusNext = (nextRef) => {
        nextRef.current?.focus();
    };

    return (
        <form ref={formRef} onKeyDown={handleKeyDown}>
            <input
                ref={firstInputRef}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        focusNext(lastInputRef);
                    }
                }}
            />
            <input ref={lastInputRef} />
        </form>
    );
}
```


**Storing Mutable Values:**


```javascript
function Timer() {
    const [time, setTime] = useState(0);
    const [isRunning, setIsRunning] = useState(false);

    // Store timer ID without causing re-renders
    const intervalRef = useRef(null);
    const startTimeRef = useRef(null);

    const start = useCallback(() => {
        if (!isRunning) {
            startTimeRef.current = Date.now() - time * 1000;
            intervalRef.current = setInterval(() => {
                setTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
            }, 100);
            setIsRunning(true);
        }
    }, [time, isRunning]);

    const pause = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        setIsRunning(false);
    }, []);

    const reset = useCallback(() => {
        pause();
        setTime(0);
    }, [pause]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    return (
        <div>
            <div>Time: {time}s</div>
            <button onClick={start} disabled={isRunning}>Start</button>
            <button onClick={pause} disabled={!isRunning}>Pause</button>
            <button onClick={reset}>Reset</button>
        </div>
    );
}
```


**Previous Value Pattern:**


```javascript
function usePrevious(value) {
    const ref = useRef();

    useEffect(() => {
        ref.current = value;
    });

    return ref.current;
}

function ComponentWithPrevious({ count }) {
    const prevCount = usePrevious(count);

    useEffect(() => {
        if (prevCount !== undefined && prevCount !== count) {
            console.log(`Count changed from ${prevCount} to ${count}`);

            if (count > prevCount) {
                // Handle increment
                animateIncrement();
            } else {
                // Handle decrement
                animateDecrement();
            }
        }
    }, [count, prevCount]);

    return <div>Count: {count} (Previous: {prevCount})</div>;
}
```


### 7. USECONTEXT - SCALABLE PATTERNS


**Context Provider Optimization:**


```javascript
// Split contexts to prevent unnecessary re-renders
const UserContext = createContext();
const UserDispatchContext = createContext();

function UserProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Memoize dispatch functions to prevent re-renders
    const dispatch = useMemo(() => ({
        login: async (credentials) => {
            setLoading(true);
            try {
                const userData = await api.login(credentials);
                setUser(userData);
            } finally {
                setLoading(false);
            }
        },

        logout: () => {
            setUser(null);
            api.logout();
        },

        updateUser: (updates) => {
            setUser(prev => ({ ...prev, ...updates }));
        }
    }), []);

    // Memoize context values
    const userValue = useMemo(() => ({
        user,
        loading
    }), [user, loading]);

    return (
        <UserContext.Provider value={userValue}>
            <UserDispatchContext.Provider value={dispatch}>
                {children}
            </UserDispatchContext.Provider>
        </UserContext.Provider>
    );
}

// Custom hooks for consuming contexts
function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}

function useUserDispatch() {
    const context = useContext(UserDispatchContext);
    if (context === undefined) {
        throw new Error('useUserDispatch must be used within a UserProvider');
    }
    return context;
}
```


**Nested Context Providers:**


```javascript
// Theme + User + App Settings
function AppProviders({ children }) {
    return (
        <ErrorBoundary>
            <ThemeProvider>
                <UserProvider>
                    <SettingsProvider>
                        <NotificationProvider>
                            {children}
                        </NotificationProvider>
                    </SettingsProvider>
                </UserProvider>
            </ThemeProvider>
        </ErrorBoundary>
    );
}

// Compound hook for multiple contexts
function useAppContext() {
    const theme = useTheme();
    const user = useUser();
    const settings = useSettings();
    const notifications = useNotifications();

    return {
        theme,
        user,
        settings,
        notifications
    };
}
```


### 8. CUSTOM HOOKS - ADVANCED PATTERNS


**Data Fetching Hook with Caching:**


```javascript
const cache = new Map();

function useApi(endpoint, options = {}) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const {
        skip = false,
        dependencies = [],
        cacheKey,
        ttl = 5 * 60 * 1000 // 5 minutes
    } = options;

    const key = cacheKey || `${endpoint}:${JSON.stringify(options)}`;

    useEffect(() => {
        if (skip) return;

        const abortController = new AbortController();
        let cancelled = false;

        const fetchData = async () => {
            // Check cache first
            const cached = cache.get(key);
            if (cached && Date.now() - cached.timestamp < ttl) {
                setData(cached.data);
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const response = await fetch(endpoint, {
                    ...options,
                    signal: abortController.signal
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const result = await response.json();

                if (!cancelled) {
                    setData(result);

                    // Cache the result
                    cache.set(key, {
                        data: result,
                        timestamp: Date.now()
                    });
                }
            } catch (err) {
                if (err.name !== 'AbortError' && !cancelled) {
                    setError(err);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        fetchData();

        return () => {
            cancelled = true;
            abortController.abort();
        };
    }, [endpoint, key, skip, ttl, ...dependencies]);

    const refetch = useCallback(() => {
        cache.delete(key);
        setLoading(true);
        setError(null);
    }, [key]);

    return {
        data,
        loading,
        error,
        refetch
    };
}
```


**Form Management Hook:**


```javascript
function useFormValidation(initialValues, validators) {
    const [values, setValues] = useState(initialValues);
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const setValue = useCallback((field, value) => {
        setValues(prev => ({ ...prev, [field]: value }));

        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: null }));
        }
    }, [errors]);

    const setTouched = useCallback((field, isTouched = true) => {
        setTouched(prev => ({ ...prev, [field]: isTouched }));
    }, []);

    const validate = useCallback((fieldsToValidate = null) => {
        const fields = fieldsToValidate || Object.keys(validators);
        const newErrors = {};

        fields.forEach(field => {
            const validator = validators[field];
            if (validator) {
                const error = validator(values[field], values);
                if (error) {
                    newErrors[field] = error;
                }
            }
        });

        setErrors(prev => ({ ...prev, ...newErrors }));
        return newErrors;
    }, [values, validators]);

    const validateField = useCallback((field) => {
        const fieldErrors = validate([field]);
        return !fieldErrors[field];
    }, [validate]);

    const handleSubmit = useCallback(async (onSubmit) => {
        const allErrors = validate();
        const hasErrors = Object.keys(allErrors).length > 0;

        if (hasErrors) {
            // Mark all fields as touched to show errors
            setTouched(Object.keys(validators).reduce((acc, field) => {
                acc[field] = true;
                return acc;
            }, {}));
            return false;
        }

        setIsSubmitting(true);

        try {
            await onSubmit(values);
            return true;
        } catch (error) {
            if (error.fieldErrors) {
                setErrors(error.fieldErrors);
            }
            return false;
        } finally {
            setIsSubmitting(false);
        }
    }, [values, validate, validators]);

    const reset = useCallback(() => {
        setValues(initialValues);
        setErrors({});
        setTouched({});
        setIsSubmitting(false);
    }, [initialValues]);

    return {
        values,
        errors,
        touched,
        isSubmitting,
        setValue,
        setTouched,
        validate,
        validateField,
        handleSubmit,
        reset,
        isValid: Object.keys(errors).length === 0
    };
}
```


### 9. DEBUGGING & TESTING HOOKS


**Hook Debugging:**


```javascript
// Debug hook for development
function useDebugValue(value, formatter = (v) => v) {
    useDebugValue(value, formatter);

    useEffect(() => {
        console.log('Hook value changed:', value);
    }, [value]);
}

// Performance monitoring hook
function useRenderCount(componentName) {
    const renderCount = useRef(0);
    const lastRender = useRef(Date.now());

    renderCount.current += 1;
    const currentTime = Date.now();
    const timeSinceLastRender = currentTime - lastRender.current;

    useEffect(() => {
        console.log(`${componentName} rendered ${renderCount.current} times. Time since last: ${timeSinceLastRender}ms`);
        lastRender.current = currentTime;
    });

    useDebugValue({
        renderCount: renderCount.current,
        timeSinceLastRender
    });
}

// Why did you update hook
function useWhyDidYouUpdate(name, props) {
    const previousProps = useRef();

    useEffect(() => {
        if (previousProps.current) {
            const changedProps = Object.entries(props).reduce((acc, [key, value]) => {
                if (previousProps.current[key] !== value) {
                    acc[key] = {
                        from: previousProps.current[key],
                        to: value
                    };
                }
                return acc;
            }, {});

            if (Object.keys(changedProps).length) {
                console.log(`[${name}] Changed props:`, changedProps);
            }
        }

        previousProps.current = props;
    });
}
```


**Testing Custom Hooks:**


```javascript
import { renderHook, act } from '@testing-library/react';

describe('useCounter', () => {
    test('should initialize with default value', () => {
        const { result } = renderHook(() => useCounter());

        expect(result.current.count).toBe(0);
    });

    test('should increment counter', () => {
        const { result } = renderHook(() => useCounter());

        act(() => {
            result.current.increment();
        });

        expect(result.current.count).toBe(1);
    });

    test('should handle async operations', async () => {
        const { result, waitForNextUpdate } = renderHook(() =>
            useApi('/test-endpoint')
        );

        expect(result.current.loading).toBe(true);

        await waitForNextUpdate();

        expect(result.current.loading).toBe(false);
        expect(result.current.data).toBeDefined();
    });
});
```


### 10. PERFORMANCE OPTIMIZATION PATTERNS


**Hook Optimization Best Practices:**


```javascript
function OptimizedComponent({ items, onItemClick, filters }) {
    // ✅ Memoize expensive computations
    const filteredItems = useMemo(() => {
        return items.filter(item =>
            Object.entries(filters).every(([key, value]) =>
                !value || item[key]?.includes(value)
            )
        );
    }, [items, filters]);

    // ✅ Memoize callbacks passed to children
    const handleItemClick = useCallback((item) => {
        onItemClick(item);
        analytics.track('item_clicked', { itemId: item.id });
    }, [onItemClick]);

    // ✅ Split context providers to minimize re-renders
    const contextValue = useMemo(() => ({
        items: filteredItems,
        onItemClick: handleItemClick
    }), [filteredItems, handleItemClick]);

    // ✅ Use refs for values that don't affect rendering
    const renderCount = useRef(0);
    renderCount.current += 1;

    return (
        <ItemContext.Provider value={contextValue}>
            <div>
                {/* Only re-renders when contextValue changes */}
                {filteredItems.map(item => (
                    <MemoizedItem
                        key={item.id}
                        item={item}
                        onClick={handleItemClick}
                    />
                ))}
            </div>
        </ItemContext.Provider>
    );
}

const MemoizedItem = React.memo(({ item, onClick }) => {
    const handleClick = useCallback(() => onClick(item), [item, onClick]);

    return (
        <div onClick={handleClick}>
            {item.name}
        </div>
    );
});
```


### INTERVIEW PREPARATION FOCUS


**Common Questions:**


1. **Lifecycle to Hooks**: How do you convert componentDidMount/Update/WillUnmount to hooks?
2. **Dependency Arrays**: What happens with missing dependencies? How to handle object/function dependencies?
3. **Performance**: When should you use useMemo/useCallback? What are the trade-offs?
4. **Custom Hooks**: How do you extract logic into reusable hooks? How to handle cleanup?
5. **Context**: How do you prevent unnecessary re-renders with Context?


**Code Review Scenarios:**


- Identify infinite loops in useEffect
- Optimize components with excessive re-renders
- Debug stale closure issues
- Review custom hook implementations
- Evaluate context usage patterns


Với kiến thức sâu về hooks này, bạn có thể demonstrate expertise trong **modern React patterns**, **performance optimization**, và **clean architecture** - những skills quan trọng cho senior/lead level.


## Claude


## COMPONENT ARCHITECTURE & REUSABLE COMPONENTS - CHI TIẾT CHO SENIOR/LEAD LEVEL


### 1. COMPONENT DESIGN PRINCIPLES


**Single Responsibility Principle:**


```javascript
// ❌ Bad: Component doing too many things
function UserDashboard({ userId }) {
    const [user, setUser] = useState(null);
    const [posts, setPosts] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [theme, setTheme] = useState('light');
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Fetching logic...
    // Theme switching logic...
    // Sidebar logic...
    // Post management logic...

    return (
        <div>
            {/* 200+ lines of JSX mixing all concerns */}
        </div>
    );
}

// ✅ Good: Single responsibility, composed components
function UserDashboard({ userId }) {
    return (
        <DashboardLayout>
            <DashboardHeader userId={userId} />
            <DashboardContent userId={userId} />
            <DashboardSidebar userId={userId} />
        </DashboardLayout>
    );
}

function DashboardContent({ userId }) {
    return (
        <div className="dashboard-content">
            <UserProfile userId={userId} />
            <UserPosts userId={userId} />
            <UserNotifications userId={userId} />
        </div>
    );
}
```


**Open/Closed Principle - Extensible Components:**


```javascript
// Base Button component - closed for modification, open for extension
function Button({
    variant = 'primary',
    size = 'medium',
    children,
    startIcon,
    endIcon,
    loading = false,
    disabled = false,
    className = '',
    ...restProps
}) {
    const baseClasses = 'btn transition-colors focus:outline-none focus:ring-2';
    const variantClasses = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
        secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
        ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
    };

    const sizeClasses = {
        small: 'px-3 py-1 text-sm',
        medium: 'px-4 py-2',
        large: 'px-6 py-3 text-lg'
    };

    const finalClassName = [
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        loading && 'opacity-70 cursor-not-allowed',
        disabled && 'opacity-50 cursor-not-allowed',
        className
    ].filter(Boolean).join(' ');

    return (
        <button
            className={finalClassName}
            disabled={disabled || loading}
            {...restProps}
        >
            {loading ? (
                <LoadingSpinner size={size} />
            ) : (
                <>
                    {startIcon && <span className="mr-2">{startIcon}</span>}
                    {children}
                    {endIcon && <span className="ml-2">{endIcon}</span>}
                </>
            )}
        </button>
    );
}

// Extending without modifying base component
function IconButton({ icon, ...props }) {
    return (
        <Button {...props} startIcon={icon} />
    );
}

function SubmitButton({ children, ...props }) {
    return (
        <Button type="submit" variant="primary" {...props}>
            {children}
        </Button>
    );
}
```


### 2. COMPONENT COMPOSITION PATTERNS


**Compound Components Pattern:**


```javascript
// Modal compound component
const ModalContext = createContext();

function Modal({ children, isOpen, onClose }) {
    const contextValue = useMemo(() => ({
        isOpen,
        onClose
    }), [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <ModalContext.Provider value={contextValue}>
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-container" onClick={e => e.stopPropagation()}>
                    {children}
                </div>
            </div>
        </ModalContext.Provider>
    );
}

Modal.Header = function ModalHeader({ children, showCloseButton = true }) {
    const { onClose } = useContext(ModalContext);

    return (
        <div className="modal-header">
            <div className="modal-title">{children}</div>
            {showCloseButton && (
                <button onClick={onClose} className="modal-close">
                    ×
                </button>
            )}
        </div>
    );
};

Modal.Body = function ModalBody({ children }) {
    return <div className="modal-body">{children}</div>;
};

Modal.Footer = function ModalFooter({ children }) {
    return <div className="modal-footer">{children}</div>;
};

// Usage - very flexible and readable
function UserProfileModal({ user, isOpen, onClose }) {
    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <Modal.Header>
                Edit Profile - {user.name}
            </Modal.Header>
            <Modal.Body>
                <UserProfileForm user={user} />
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onClose}>
                    Cancel
                </Button>
                <Button variant="primary" type="submit">
                    Save Changes
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
```


**Render Props Pattern:**


```javascript
// Data fetcher với render props
function DataFetcher({ url, children }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await fetch(url);
                const result = await response.json();
                setData(result);
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [url]);

    return children({ data, loading, error });
}

// Flexible usage
function UserList() {
    return (
        <DataFetcher url="/api/users">
            {({ data, loading, error }) => {
                if (loading) return <LoadingSpinner />;
                if (error) return <ErrorMessage error={error} />;
                if (!data) return <EmptyState message="No users found" />;

                return (
                    <div className="user-list">
                        {data.map(user => (
                            <UserCard key={user.id} user={user} />
                        ))}
                    </div>
                );
            }}
        </DataFetcher>
    );
}

// Alternative: Function as children
function ProductGrid() {
    return (
        <DataFetcher url="/api/products">
            {({ data, loading, error }) => (
                <GridLayout>
                    {loading && <GridSkeleton />}
                    {error && <GridError error={error} />}
                    {data?.map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </GridLayout>
            )}
        </DataFetcher>
    );
}
```


**Higher-Order Components (HOCs):**


```javascript
// withAuth HOC
function withAuth(WrappedComponent, { redirectTo = '/login', requiredRoles = [] } = {}) {
    const WithAuthComponent = (props) => {
        const { user, loading } = useAuth();
        const navigate = useNavigate();

        useEffect(() => {
            if (!loading && !user) {
                navigate(redirectTo);
            }
        }, [user, loading, navigate]);

        if (loading) {
            return <LoadingSpinner />;
        }

        if (!user) {
            return null;
        }

        // Check role requirements
        if (requiredRoles.length > 0) {
            const hasRequiredRole = requiredRoles.some(role =>
                user.roles?.includes(role)
            );

            if (!hasRequiredRole) {
                return <UnauthorizedMessage />;
            }
        }

        return <WrappedComponent {...props} user={user} />;
    };

    WithAuthComponent.displayName = `withAuth(${getDisplayName(WrappedComponent)})`;

    return WithAuthComponent;
}

function getDisplayName(WrappedComponent) {
    return WrappedComponent.displayName || WrappedComponent.name || 'Component';
}

// Usage
const AdminDashboard = withAuth(DashboardComponent, {
    requiredRoles: ['admin', 'moderator']
});

// withLoading HOC
function withLoading(WrappedComponent) {
    return function WithLoadingComponent({ isLoading, ...props }) {
        if (isLoading) {
            return <LoadingSpinner />;
        }

        return <WrappedComponent {...props} />;
    };
}

// Composition of HOCs
const EnhancedUserProfile = withAuth(
    withLoading(UserProfile),
    { requiredRoles: ['user'] }
);
```


### 3. PROPS API DESIGN


**Flexible Props Interface:**


```javascript
// Card component với comprehensive props API
function Card({
    // Content
    title,
    subtitle,
    children,

    // Visual variants
    variant = 'default', // default, elevated, outlined, ghost
    size = 'medium', // small, medium, large

    // Interactive states
    clickable = false,
    hoverable = false,
    selected = false,
    disabled = false,

    // Custom styling
    className = '',
    style = {},

    // Actions
    onClick,
    onHover,

    // Accessibility
    role = 'article',
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedBy,

    // Content slots
    header,
    footer,
    actions,
    media,

    // Advanced props
    as: Component = 'div', // Polymorphic component
    ...restProps
}) {
    const cardClasses = cn(
        'card',
        `card--${variant}`,
        `card--${size}`,
        {
            'card--clickable': clickable,
            'card--hoverable': hoverable,
            'card--selected': selected,
            'card--disabled': disabled,
        },
        className
    );

    const handleClick = useCallback((e) => {
        if (disabled) return;
        onClick?.(e);
    }, [onClick, disabled]);

    const cardProps = {
        className: cardClasses,
        style,
        role,
        'aria-label': ariaLabel,
        'aria-describedby': ariaDescribedBy,
        ...(clickable && { onClick: handleClick, role: 'button', tabIndex: 0 }),
        ...restProps
    };

    return (
        <Component {...cardProps}>
            {header && <div className="card__header">{header}</div>}
            {media && <div className="card__media">{media}</div>}

            <div className="card__content">
                {title && <h3 className="card__title">{title}</h3>}
                {subtitle && <p className="card__subtitle">{subtitle}</p>}
                {children}
            </div>

            {actions && <div className="card__actions">{actions}</div>}
            {footer && <div className="card__footer">{footer}</div>}
        </Component>
    );
}

// Usage examples showing flexibility
function ProductCard({ product }) {
    return (
        <Card
            variant="elevated"
            clickable
            onClick={() => navigate(`/products/${product.id}`)}
            title={product.name}
            subtitle={`$${product.price}`}
            media={<img src={product.image} alt={product.name} />}
            actions={
                <div className="flex gap-2">
                    <Button size="small">Add to Cart</Button>
                    <IconButton icon={<HeartIcon />} variant="ghost" />
                </div>
            }
        >
            <p className="product-description">{product.description}</p>
        </Card>
    );
}
```


**Polymorphic Components:**


```javascript
// Generic polymorphic component
function Box({ as: Component = 'div', children, ...props }) {
    return <Component {...props}>{children}</Component>;
}

// Text component với semantic elements
function Text({
    as = 'p',
    variant = 'body',
    size = 'medium',
    color = 'default',
    weight = 'normal',
    align = 'left',
    className = '',
    children,
    ...props
}) {
    const Component = as;

    const textClasses = cn(
        'text',
        `text--${variant}`,
        `text--${size}`,
        `text--${color}`,
        `text--${weight}`,
        `text--${align}`,
        className
    );

    return (
        <Component className={textClasses} {...props}>
            {children}
        </Component>
    );
}

// Usage - same component, different semantic meaning
function Article() {
    return (
        <article>
            <Text as="h1" variant="heading" size="large">
                Article Title
            </Text>
            <Text as="h2" variant="subheading">
                Subtitle
            </Text>
            <Text as="p" variant="body">
                Article content goes here...
            </Text>
            <Text as="span" variant="caption" color="muted">
                Published on March 1, 2024
            </Text>
        </article>
    );
}
```


### 4. COMPONENT LIBRARIES ARCHITECTURE


**Folder Structure & Organization:**


```
src/
├── components/
│   ├── ui/                    # Core UI components
│   │   ├── Button/
│   │   │   ├── index.ts
│   │   │   ├── Button.tsx
│   │   │   ├── Button.test.tsx
│   │   │   ├── Button.stories.tsx
│   │   │   └── Button.module.css
│   │   ├── Input/
│   │   ├── Modal/
│   │   └── index.ts           # Barrel export
│   ├── layout/               # Layout components
│   │   ├── Container/
│   │   ├── Grid/
│   │   └── Stack/
│   ├── forms/               # Form-specific components
│   │   ├── FormField/
│   │   ├── FormGroup/
│   │   └── Validation/
│   ├── feedback/            # Feedback components
│   │   ├── Toast/
│   │   ├── Alert/
│   │   └── Loading/
│   └── compound/           # Complex compound components
│       ├── DataTable/
│       ├── DatePicker/
│       └── FileUpload/
├── hooks/                   # Shared custom hooks
├── utils/                   # Utility functions
├── types/                   # TypeScript type definitions
└── theme/                   # Design system tokens
```


**Component Index & Barrel Exports:**


```javascript
// components/ui/index.ts
export { Button } from './Button';
export { Input } from './Input';
export { Modal } from './Modal';
export { Card } from './Card';
export { Text } from './Text';

// Type exports
export type { ButtonProps } from './Button/Button';
export type { InputProps } from './Input/Input';
export type { ModalProps } from './Modal/Modal';

// components/index.ts - Main library export
export * from './ui';
export * from './layout';
export * from './forms';
export * from './feedback';
export * from './compound';

// Re-export commonly used types
export type {
    ComponentSize,
    ComponentVariant,
    ComponentColor
} from './types';
```


**Theme System Integration:**


```javascript
// theme/tokens.js
export const tokens = {
    colors: {
        primary: {
            50: '#eff6ff',
            100: '#dbeafe',
            500: '#3b82f6',
            600: '#2563eb',
            900: '#1e3a8a'
        },
        gray: {
            50: '#f9fafb',
            100: '#f3f4f6',
            500: '#6b7280',
            900: '#111827'
        }
    },
    spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem'
    },
    typography: {
        fontFamily: {
            sans: ['Inter', 'system-ui', 'sans-serif'],
            mono: ['Fira Code', 'monospace']
        },
        fontSize: {
            xs: '0.75rem',
            sm: '0.875rem',
            base: '1rem',
            lg: '1.125rem',
            xl: '1.25rem'
        }
    },
    borderRadius: {
        none: '0',
        sm: '0.125rem',
        md: '0.375rem',
        lg: '0.5rem',
        full: '9999px'
    }
};

// Theme provider
const ThemeContext = createContext();

function ThemeProvider({ theme = tokens, children }) {
    const contextValue = useMemo(() => ({
        ...theme,
        // Utility functions
        getColor: (path) => {
            return path.split('.').reduce((obj, key) => obj?.[key], theme.colors);
        },
        getSpacing: (size) => theme.spacing[size] || size
    }), [theme]);

    return (
        <ThemeContext.Provider value={contextValue}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
}
```


### 5. STYLING STRATEGIES FOR REUSABLE COMPONENTS


**CSS-in-JS với Styled Components:**


```javascript
import styled, { css } from 'styled-components';

// Base styled component với theme integration
const StyledButton = styled.button`
    /* Base styles */
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: none;
    border-radius: ${({ theme }) => theme.borderRadius.md};
    font-family: ${({ theme }) => theme.typography.fontFamily.sans};
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;

    /* Size variants */
    ${({ $size, theme }) => {
        switch ($size) {
            case 'small':
                return css`
                    padding: ${theme.spacing.xs} ${theme.spacing.sm};
                    font-size: ${theme.typography.fontSize.sm};
                `;
            case 'large':
                return css`
                    padding: ${theme.spacing.md} ${theme.spacing.lg};
                    font-size: ${theme.typography.fontSize.lg};
                `;
            default:
                return css`
                    padding: ${theme.spacing.sm} ${theme.spacing.md};
                    font-size: ${theme.typography.fontSize.base};
                `;
        }
    }}

    /* Color variants */
    ${({ $variant, theme }) => {
        switch ($variant) {
            case 'primary':
                return css`
                    background: ${theme.colors.primary[600]};
                    color: white;

                    &:hover {
                        background: ${theme.colors.primary[700]};
                    }

                    &:focus {
                        box-shadow: 0 0 0 3px ${theme.colors.primary[200]};
                    }
                `;
            case 'secondary':
                return css`
                    background: ${theme.colors.gray[100]};
                    color: ${theme.colors.gray[900]};

                    &:hover {
                        background: ${theme.colors.gray[200]};
                    }
                `;
            default:
                return css`
                    background: transparent;
                    color: ${theme.colors.gray[700]};

                    &:hover {
                        background: ${theme.colors.gray[50]};
                    }
                `;
        }
    }}

    /* State modifiers */
    ${({ $loading }) => $loading && css`
        opacity: 0.7;
        cursor: not-allowed;
    `}

    ${({ disabled }) => disabled && css`
        opacity: 0.5;
        cursor: not-allowed;
        pointer-events: none;
    `}
`;

// Component implementation
function Button({
    variant = 'default',
    size = 'medium',
    loading = false,
    children,
    ...props
}) {
    return (
        <StyledButton
            $variant={variant}
            $size={size}
            $loading={loading}
            {...props}
        >
            {loading ? <Spinner /> : children}
        </StyledButton>
    );
}
```


**CSS Modules approach:**


```css
/* Button.module.css */
.button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: none;
    border-radius: var(--border-radius-md);
    font-family: var(--font-family-sans);
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
}

/* Size variants */
.button--small {
    padding: var(--spacing-xs) var(--spacing-sm);
    font-size: var(--font-size-sm);
}

.button--medium {
    padding: var(--spacing-sm) var(--spacing-md);
    font-size: var(--font-size-base);
}

.button--large {
    padding: var(--spacing-md) var(--spacing-lg);
    font-size: var(--font-size-lg);
}

/* Variant styles */
.button--primary {
    background: var(--color-primary-600);
    color: white;
}

.button--primary:hover {
    background: var(--color-primary-700);
}

.button--secondary {
    background: var(--color-gray-100);
    color: var(--color-gray-900);
}

/* State modifiers */
.button--loading {
    opacity: 0.7;
    cursor: not-allowed;
}

.button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}
```


```javascript
// Button.tsx
import styles from './Button.module.css';
import { cn } from '../../utils/classNames';

function Button({
    variant = 'default',
    size = 'medium',
    loading = false,
    disabled = false,
    className = '',
    children,
    ...props
}) {
    const buttonClasses = cn(
        styles.button,
        styles[`button--${variant}`],
        styles[`button--${size}`],
        {
            [styles['button--loading']]: loading,
        },
        className
    );

    return (
        <button
            className={buttonClasses}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? <Spinner /> : children}
        </button>
    );
}
```


### 6. ACCESSIBILITY PATTERNS


**Accessible Component Design:**


```javascript
// Accessible Button component
function Button({
    children,
    variant = 'primary',
    size = 'medium',
    disabled = false,
    loading = false,

    // Accessibility props
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedBy,
    'aria-expanded': ariaExpanded,
    'aria-pressed': ariaPressed,

    // Event handlers
    onClick,
    onKeyDown,

    ...props
}) {
    const handleKeyDown = useCallback((e) => {
        // Handle space and enter keys
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            onClick?.(e);
        }
        onKeyDown?.(e);
    }, [onClick, onKeyDown]);

    const buttonProps = {
        role: 'button',
        tabIndex: disabled ? -1 : 0,
        'aria-label': ariaLabel,
        'aria-describedby': ariaDescribedBy,
        'aria-expanded': ariaExpanded,
        'aria-pressed': ariaPressed,
        'aria-disabled': disabled || loading,
        disabled: disabled || loading,
        onClick: disabled || loading ? undefined : onClick,
        onKeyDown: handleKeyDown
    };

    return (
        <button {...buttonProps} {...props}>
            {loading && (
                <span className="sr-only">Loading...</span>
            )}
            {children}
        </button>
    );
}

// Accessible Input component
function Input({
    label,
    error,
    helperText,
    required = false,
    disabled = false,
    id,
    name,
    type = 'text',
    ...props
}) {
    const inputId = id || `input-${useId()}`;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    const describedBy = [
        error && errorId,
        helperText && helperId
    ].filter(Boolean).join(' ');

    return (
        <div className="input-group">
            {label && (
                <label
                    htmlFor={inputId}
                    className={cn('input-label', { 'required': required })}
                >
                    {label}
                    {required && <span aria-hidden="true"> *</span>}
                </label>
            )}

            <input
                id={inputId}
                name={name}
                type={type}
                required={required}
                disabled={disabled}
                aria-invalid={!!error}
                aria-describedby={describedBy || undefined}
                className={cn('input', {
                    'input--error': error,
                    'input--disabled': disabled
                })}
                {...props}
            />

            {error && (
                <div
                    id={errorId}
                    className="input-error"
                    role="alert"
                    aria-live="polite"
                >
                    {error}
                </div>
            )}

            {helperText && (
                <div
                    id={helperId}
                    className="input-helper"
                >
                    {helperText}
                </div>
            )}
        </div>
    );
}
```


**Keyboard Navigation Patterns:**


```javascript
// Menu component với keyboard navigation
function Menu({ items, onSelect, isOpen, onClose }) {
    const [focusedIndex, setFocusedIndex] = useState(0);
    const itemRefs = useRef([]);

    useEffect(() => {
        if (isOpen && itemRefs.current[focusedIndex]) {
            itemRefs.current[focusedIndex].focus();
        }
    }, [focusedIndex, isOpen]);

    const handleKeyDown = useCallback((e) => {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setFocusedIndex(prev =>
                    prev < items.length - 1 ? prev + 1 : 0
                );
                break;

            case 'ArrowUp':
                e.preventDefault();
                setFocusedIndex(prev =>
                    prev > 0 ? prev - 1 : items.length - 1
                );
                break;

            case 'Enter':
            case ' ':
                e.preventDefault();
                onSelect(items[focusedIndex]);
                onClose();
                break;

            case 'Escape':
                e.preventDefault();
                onClose();
                break;

            case 'Home':
                e.preventDefault();
                setFocusedIndex(0);
                break;

            case 'End':
                e.preventDefault();
                setFocusedIndex(items.length - 1);
                break;
        }
    }, [items, focusedIndex, onSelect, onClose]);

    if (!isOpen) return null;

    return (
        <ul
            role="menu"
            onKeyDown={handleKeyDown}
            className="menu"
        >
            {items.map((item, index) => (
                <li key={item.id}>
                    <button
                        ref={el => itemRefs.current[index] = el}
                        role="menuitem"
                        className={cn('menu-item', {
                            'menu-item--focused': index === focusedIndex
                        })}
                        onClick={() => {
                            onSelect(item);
                            onClose();
                        }}
                        onMouseEnter={() => setFocusedIndex(index)}
                    >
                        {item.label}
                    </button>
                </li>
            ))}
        </ul>
    );
}
```


### 7. ERROR BOUNDARIES FOR COMPONENTS


**Component-Level Error Boundaries:**


```javascript
// Generic Error Boundary
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // Log error to monitoring service
        console.error('Error Boundary caught an error:', error, errorInfo);

        // Send to error reporting service
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            if (this.props.FallbackComponent) {
                return (
                    <this.props.FallbackComponent
                        error={this.state.error}
                        retry={() => this.setState({ hasError: false, error: null })}
                    />
                );
            }

            return (
                <div className="error-fallback">
                    <h2>Something went wrong</h2>
                    <details>
                        <summary>Error details</summary>
                        <pre>{this.state.error?.message}</pre>
                    </details>
                    <button
                        onClick={() => this.setState({ hasError: false, error: null })}
                    >
                        Try again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

// Specialized Error Boundary for async components
function AsyncComponentErrorBoundary({ children, fallback }) {
    return (
        <ErrorBoundary
            FallbackComponent={({ error, retry }) => (
                <div className="async-error-fallback">
                    <p>Failed to load component</p>
                    <button onClick={retry}>Retry</button>
                    {fallback}
                </div>
            )}
        >
            <Suspense fallback={<LoadingSpinner />}>
                {children}
            </Suspense>
        </ErrorBoundary>
    );
}

// HOC for adding error boundaries
function withErrorBoundary(WrappedComponent, errorBoundaryConfig = {}) {
    const WithErrorBoundaryComponent = (props) => (
        <ErrorBoundary {...errorBoundaryConfig}>
            <WrappedComponent {...props} />
        </ErrorBoundary>
    );

    WithErrorBoundaryComponent.displayName =
        `withErrorBoundary(${getDisplayName(WrappedComponent)})`;

    return WithErrorBoundaryComponent;
}
```


### 8. TESTING STRATEGIES FOR REUSABLE COMPONENTS


**Comprehensive Component Testing:**


```javascript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

describe('Button Component', () => {
    // Basic rendering tests
    it('renders children correctly', () => {
        render(<Button>Click me</Button>);
        expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
    });

    // Props testing
    it('applies variant classes correctly', () => {
        const { rerender } = render(<Button variant="primary">Test</Button>);
        expect(screen.getByRole('button')).toHaveClass('button--primary');

        rerender(<Button variant="secondary">Test</Button>);
        expect(screen.getByRole('button')).toHaveClass('button--secondary');
    });

    // Interaction testing
    it('handles click events', async () => {
        const handleClick = jest.fn();
        const user = userEvent.setup();

        render(<Button onClick={handleClick}>Click me</Button>);

        await user.click(screen.getByRole('button'));
        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    // State testing
    it('shows loading state correctly', () => {
        render(<Button loading>Loading</Button>);

        expect(screen.getByRole('button')).toBeDisabled();
        expect(screen.getByTestId('spinner')).toBeInTheDocument();
        expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    // Accessibility testing
    it('is accessible', async () => {
        const { container } = render(
            <Button aria-label="Save document">Save</Button>
        );

        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });

    // Keyboard interaction testing
    it('handles keyboard interactions', async () => {
        const handleClick = jest.fn();
        const user = userEvent.setup();

        render(<Button onClick={handleClick}>Press me</Button>);

        const button = screen.getByRole('button');
        button.focus();

        await user.keyboard('{Enter}');
        expect(handleClick).toHaveBeenCalledTimes(1);

        await user.keyboard(' ');
        expect(handleClick).toHaveBeenCalledTimes(2);
    });

    // Error boundary testing
    it('handles errors gracefully', () => {
        const ThrowError = () => {
            throw new Error('Test error');
        };

        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

        render(
            <ErrorBoundary>
                <ThrowError />
            </ErrorBoundary>
        );

        expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
        consoleSpy.mockRestore();
    });
});

// Integration testing với theme
describe('Button with Theme', () => {
    const renderWithTheme = (component) => {
        return render(
            <ThemeProvider theme={testTheme}>
                {component}
            </ThemeProvider>
        );
    };

    it('applies theme colors correctly', () => {
        renderWithTheme(<Button variant="primary">Themed Button</Button>);

        const button = screen.getByRole('button');
        const styles = getComputedStyle(button);

        expect(styles.backgroundColor).toBe('rgb(59, 130, 246)'); // theme primary
    });
});
```


### 9. DOCUMENTATION PATTERNS


**Storybook Stories:**


```javascript
// Button.stories.js
import { Button } from './Button';

export default {
    title: 'Components/Button',
    component: Button,
    parameters: {
        docs: {
            description: {
                component: 'A versatile button component that supports multiple variants, sizes, and states.'
            }
        }
    },
    argTypes: {
        variant: {
            control: { type: 'select' },
            options: ['primary', 'secondary', 'ghost', 'danger'],
            description: 'Visual style variant'
        },
        size: {
            control: { type: 'select' },
            options: ['small', 'medium', 'large'],
            description: 'Size of the button'
        },
        loading: {
            control: { type: 'boolean' },
            description: 'Shows loading spinner when true'
        }
    }
};

// Default story
export const Default = {
    args: {
        children: 'Button'
    }
};

// Variant stories
export const Primary = {
    args: {
        variant: 'primary',
        children: 'Primary Button'
    }
};

export const Secondary = {
    args: {
        variant: 'secondary',
        children: 'Secondary Button'
    }
};

// Interactive states
export const Loading = {
    args: {
        loading: true,
        children: 'Loading Button'
    }
};

export const Disabled = {
    args: {
        disabled: true,
        children: 'Disabled Button'
    }
};

// Complex story
export const WithIcons = {
    render: (args) => (
        <div className="flex gap-4">
            <Button {...args} startIcon={<PlusIcon />}>
                Add Item
            </Button>
            <Button {...args} endIcon={<ArrowIcon />}>
                Next Step
            </Button>
        </div>
    )
};

// All variants showcase
export const AllVariants = {
    render: () => (
        <div className="grid grid-cols-4 gap-4">
            {['primary', 'secondary', 'ghost', 'danger'].map(variant => (
                <Button key={variant} variant={variant}>
                    {variant}
                </Button>
            ))}
        </div>
    )
};
```


**TypeScript Integration:**


```typescript
// Button.types.ts
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    /** Visual variant of the button */
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';

    /** Size of the button */
    size?: 'small' | 'medium' | 'large';

    /** Show loading spinner and disable interaction */
    loading?: boolean;

    /** Icon to show at the start of the button */
    startIcon?: React.ReactNode;

    /** Icon to show at the end of the button */
    endIcon?: React.ReactNode;

    /** Custom className for additional styling */
    className?: string;

    /** Children content */
    children: React.ReactNode;
}

// Button.tsx
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({
        variant = 'primary',
        size = 'medium',
        loading = false,
        disabled = false,
        startIcon,
        endIcon,
        className = '',
        children,
        ...props
    }, ref) => {
        const buttonClass = cn(
            'button',
            `button--${variant}`,
            `button--${size}`,
            { 'button--loading': loading },
            className
        );

        return (
            <button
                ref={ref}
                className={buttonClass}
                disabled={disabled || loading}
                {...props}
            >
                {loading ? (
                    <Spinner size={size} />
                ) : (
                    <>
                        {startIcon && <span className="button__start-icon">{startIcon}</span>}
                        {children}
                        {endIcon && <span className="button__end-icon">{endIcon}</span>}
                    </>
                )}
            </button>
        );
    }
);

Button.displayName = 'Button';
```


### 10. PERFORMANCE OPTIMIZATION PATTERNS


**Memoization Strategies:**


```javascript
// Smart memoization for compound components
const Card = React.memo(({
    title,
    content,
    actions,
    onActionClick,
    ...props
}) => {
    // Memoize expensive operations
    const processedContent = useMemo(() => {
        if (typeof content === 'string') {
            return content;
        }

        // Complex content processing
        return processContent(content);
    }, [content]);

    // Memoize event handlers
    const handleActionClick = useCallback((action) => {
        onActionClick?.(action);
        // Additional logic...
    }, [onActionClick]);

    return (
        <div className="card" {...props}>
            <CardHeader title={title} />
            <CardContent content={processedContent} />
            <CardActions
                actions={actions}
                onActionClick={handleActionClick}
            />
        </div>
    );
});

// Selective re-rendering with custom comparison
const ExpensiveListItem = React.memo(({
    item,
    isSelected,
    onSelect
}) => {
    console.log(`Rendering item ${item.id}`);

    return (
        <div
            className={`list-item ${isSelected ? 'selected' : ''}`}
            onClick={() => onSelect(item.id)}
        >
            <h3>{item.title}</h3>
            <p>{item.description}</p>
        </div>
    );
}, (prevProps, nextProps) => {
    // Custom comparison function
    return (
        prevProps.item.id === nextProps.item.id &&
        prevProps.item.title === nextProps.item.title &&
        prevProps.item.description === nextProps.item.description &&
        prevProps.isSelected === nextProps.isSelected &&
        prevProps.onSelect === nextProps.onSelect
    );
});
```


### INTERVIEW PREPARATION FOCUS


**Architecture Questions:**


1. How do you decide between HOCs, render props, và compound components?
2. What's your approach to creating a scalable component library?
3. How do you handle theme customization trong reusable components?
4. What patterns do you use for component composition?


**Performance Questions:**


1. When would you use React.memo cho a component?
2. How do you optimize props để avoid unnecessary re-renders?
3. What's your strategy for code splitting trong a component library?


**Design Questions:**


1. How do you design props APIs cho maximum flexibility?
2. How do you handle accessibility trong reusable components?
3. What's your approach to error handling trong component libraries?


**Code Review Scenarios:**


- Evaluate component API design
- Identify performance bottlenecks
- Review accessibility implementation
- Assess testing coverage và strategies


Với kiến thức sâu về component architecture này, bạn có thể demonstrate expertise trong **scalable design patterns**, **performance optimization**, **accessibility**, và **maintainable code architecture** - những skills cốt lõi cho senior/lead level.


## Claude


## ISOMORPHIC REACT (SERVER-SIDE RENDERING) - CHI TIẾT CHO SENIOR/LEAD LEVEL


### 1. CORE SSR CONCEPTS & ARCHITECTURE


**SSR vs CSR vs Hydration:**


```javascript
// Traditional CSR (Client-Side Rendering)
// 1. Browser downloads empty HTML shell
// 2. Downloads JS bundle
// 3. React renders entire app on client
// 4. User sees content

// SSR (Server-Side Rendering)
// 1. Server renders React components to HTML
// 2. Browser receives fully rendered HTML
// 3. User sees content immediately
// 4. JS bundle loads and "hydrates" the static HTML
// 5. App becomes interactive

// Basic SSR implementation
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';

// Server-side rendering function
function renderApp(req, res) {
    const context = {};

    // Render React app to string
    const html = renderToString(
        <StaticRouter location={req.url} context={context}>
            <App />
        </StaticRouter>
    );

    // Check for redirects
    if (context.url) {
        res.redirect(301, context.url);
        return;
    }

    // Send complete HTML response
    res.send(`
        <!DOCTYPE html>
        <html>
            <head>
                <title>SSR App</title>
                <link rel="stylesheet" href="/styles.css">
            </head>
            <body>
                <div id="root">${html}</div>
                <script src="/bundle.js"></script>
            </body>
        </html>
    `);
}

// Client-side hydration
import { hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

// Hydrate the server-rendered markup
const container = document.getElementById('root');
hydrateRoot(
    container,
    <BrowserRouter>
        <App />
    </BrowserRouter>
);
```


**Hydration Mismatch Prevention:**


```javascript
// Common hydration mismatch scenarios and solutions

// ❌ Problem: Different content between server and client
function ProblematicComponent() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // This will cause hydration mismatch
    return (
        <div>
            {mounted ? 'Client rendered' : 'Server rendered'}
        </div>
    );
}

// ✅ Solution: Suppress hydration warning for specific content
function SafeHydratedComponent() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <div>
            <div>Always the same content</div>
            <div suppressHydrationWarning={true}>
                {mounted ? new Date().toISOString() : 'Loading...'}
            </div>
        </div>
    );
}

// ✅ Better solution: Use custom hook for client-only content
function useIsomorphicLayoutEffect(callback, deps) {
    const useLayoutEffect = typeof window !== 'undefined'
        ? React.useLayoutEffect
        : React.useEffect;

    return useLayoutEffect(callback, deps);
}

function useClientOnly() {
    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    return hasMounted;
}

function ClientOnlyComponent({ children, fallback = null }) {
    const hasMounted = useClientOnly();

    return hasMounted ? children : fallback;
}

// Usage
function MyComponent() {
    return (
        <div>
            <h1>Server and Client Content</h1>
            <ClientOnlyComponent fallback={<div>Loading...</div>}>
                <InteractiveWidget />
            </ClientOnlyComponent>
        </div>
    );
}
```


### 2. NEXT.JS ADVANCED PATTERNS


**Rendering Strategies Deep Dive:**


```javascript
// 1. Static Site Generation (SSG)
export async function getStaticProps({ params, preview = false }) {
    // Runs at build time
    const posts = await getBlogPosts();
    const popularPosts = await getPopularPosts();

    return {
        props: {
            posts,
            popularPosts,
            preview
        },
        // Incremental Static Regeneration
        revalidate: 3600, // Revalidate every hour

        // Conditional revalidation
        revalidate: process.env.NODE_ENV === 'production' ? 3600 : 1
    };
}

export async function getStaticPaths() {
    const posts = await getAllPostSlugs();

    return {
        // Pre-render most popular posts
        paths: posts.slice(0, 100).map(slug => ({
            params: { slug }
        })),

        // Enable ISR for other posts
        fallback: 'blocking' // or true for loading states
    };
}

// 2. Server-Side Rendering (SSR)
export async function getServerSideProps({ req, res, params, query }) {
    // Runs on every request
    const session = await getSession(req);

    // Redirect unauthenticated users
    if (!session) {
        return {
            redirect: {
                destination: '/login',
                permanent: false
            }
        };
    }

    // Set cache headers
    res.setHeader(
        'Cache-Control',
        'public, s-maxage=10, stale-while-revalidate=59'
    );

    const userData = await getUserData(session.userId);
    const personalizedContent = await getPersonalizedContent(session.userId);

    return {
        props: {
            user: userData,
            content: personalizedContent,
            timestamp: Date.now() // For debugging
        }
    };
}

// 3. Incremental Static Regeneration (ISR)
function ProductPage({ product, relatedProducts, lastUpdated }) {
    return (
        <div>
            <h1>{product.name}</h1>
            <p>Price: ${product.price}</p>
            <p>Last updated: {new Date(lastUpdated).toLocaleString()}</p>

            <RelatedProducts products={relatedProducts} />
        </div>
    );
}

export async function getStaticProps({ params }) {
    const product = await getProduct(params.id);
    const relatedProducts = await getRelatedProducts(params.id);

    if (!product) {
        return { notFound: true };
    }

    return {
        props: {
            product,
            relatedProducts,
            lastUpdated: Date.now()
        },
        revalidate: 60 // Revalidate every minute
    };
}
```


**Advanced Data Fetching Patterns:**


```javascript
// SWR with SSR
import useSWR from 'swr';

function ProfilePage({ fallbackData }) {
    const { data: user, error, mutate } = useSWR(
        '/api/user/profile',
        fetcher,
        {
            fallbackData, // Use SSR data as fallback
            refreshInterval: 30000, // Refresh every 30 seconds
            revalidateOnFocus: true
        }
    );

    if (error) return <ErrorPage />;
    if (!user) return <LoadingSkeleton />;

    return <UserProfile user={user} onUpdate={mutate} />;
}

export async function getServerSideProps({ req }) {
    const session = await getSession(req);

    if (!session) {
        return { redirect: { destination: '/login', permanent: false } };
    }

    // Fetch initial data on server
    const userData = await getUserProfile(session.userId);

    return {
        props: {
            fallbackData: userData
        }
    };
}

// React Query with SSR
import { QueryClient, dehydrate } from 'react-query';

export async function getServerSideProps() {
    const queryClient = new QueryClient();

    // Prefetch data on server
    await queryClient.prefetchQuery(['posts'], getPosts);
    await queryClient.prefetchQuery(['user'], getCurrentUser);

    return {
        props: {
            dehydratedState: dehydrate(queryClient)
        }
    };
}

function MyApp({ Component, pageProps }) {
    const [queryClient] = useState(() => new QueryClient());

    return (
        <QueryClientProvider client={queryClient}>
            <Hydrate state={pageProps.dehydratedState}>
                <Component {...pageProps} />
            </Hydrate>
        </QueryClientProvider>
    );
}
```


**App Router (Next.js 13+) Patterns:**


```javascript
// app/layout.js - Root Layout
export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>
                <Header />
                <main>{children}</main>
                <Footer />
            </body>
        </html>
    );
}

// app/dashboard/layout.js - Nested Layout
export default function DashboardLayout({ children }) {
    return (
        <div className="dashboard">
            <Sidebar />
            <div className="content">{children}</div>
        </div>
    );
}

// app/dashboard/page.js - Server Component
async function getAnalytics() {
    const res = await fetch('https://api.example.com/analytics', {
        next: { revalidate: 3600 } // Cache for 1 hour
    });
    return res.json();
}

export default async function DashboardPage() {
    const analytics = await getAnalytics();

    return (
        <div>
            <h1>Dashboard</h1>
            <AnalyticsChart data={analytics} />
            <UserActivity /> {/* Client component */}
        </div>
    );
}

// app/dashboard/loading.js - Loading UI
export default function Loading() {
    return <DashboardSkeleton />;
}

// app/dashboard/error.js - Error UI
'use client';

export default function Error({ error, reset }) {
    return (
        <div className="error-boundary">
            <h2>Something went wrong!</h2>
            <p>{error.message}</p>
            <button onClick={reset}>Try again</button>
        </div>
    );
}

// Server vs Client Components
// Server Component (default)
async function ServerUserProfile({ userId }) {
    const user = await getUser(userId);

    return (
        <div>
            <h1>{user.name}</h1>
            <ClientInteractiveWidget user={user} />
        </div>
    );
}

// Client Component
'use client';

function ClientInteractiveWidget({ user }) {
    const [likes, setLikes] = useState(user.likes);

    const handleLike = async () => {
        const newLikes = await likeUser(user.id);
        setLikes(newLikes);
    };

    return (
        <button onClick={handleLike}>
            ❤️ {likes}
        </button>
    );
}
```


### 3. STATE MANAGEMENT WITH SSR


**Redux with SSR:**


```javascript
// store/index.js
import { configureStore } from '@reduxjs/toolkit';
import { userSlice } from './userSlice';

export function makeStore(preloadedState) {
    return configureStore({
        reducer: {
            user: userSlice.reducer
        },
        preloadedState
    });
}

// pages/_app.js
import { Provider } from 'react-redux';
import { makeStore } from '../store';

function MyApp({ Component, pageProps }) {
    // Create store with server-side state
    const store = makeStore(pageProps.initialReduxState);

    return (
        <Provider store={store}>
            <Component {...pageProps} />
        </Provider>
    );
}

// SSR page with Redux
export async function getServerSideProps({ req }) {
    const store = makeStore();

    // Dispatch actions to populate server-side state
    const session = await getSession(req);
    if (session) {
        store.dispatch(userSlice.actions.setUser(session.user));

        // Fetch additional data
        const userData = await getUserProfile(session.userId);
        store.dispatch(userSlice.actions.setProfile(userData));
    }

    return {
        props: {
            initialReduxState: store.getState()
        }
    };
}

// Redux Toolkit Query với SSR
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const apiSlice = createApi({
    reducerPath: 'api',
    baseQuery: fetchBaseQuery({
        baseUrl: '/api/',
        prepareHeaders: (headers, { getState }) => {
            const token = getState().auth.token;
            if (token) {
                headers.set('authorization', `Bearer ${token}`);
            }
            return headers;
        }
    }),
    endpoints: (builder) => ({
        getUser: builder.query({
            query: (id) => `users/${id}`
        }),
        getPosts: builder.query({
            query: () => 'posts'
        })
    })
});

// SSR with RTK Query
export async function getServerSideProps() {
    const store = makeStore();

    // Initiate requests on server
    store.dispatch(apiSlice.endpoints.getUser.initiate('1'));
    store.dispatch(apiSlice.endpoints.getPosts.initiate());

    // Wait for requests to complete
    await Promise.all(
        store.dispatch(apiSlice.util.getRunningQueriesThunk())
    );

    return {
        props: {
            initialReduxState: store.getState()
        }
    };
}
```


**Zustand với SSR:**


```javascript
// store/userStore.js
import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';

export const useUserStore = create(
    subscribeWithSelector(
        persist(
            (set, get) => ({
                user: null,
                profile: null,

                setUser: (user) => set({ user }),
                setProfile: (profile) => set({ profile }),

                // Async actions
                fetchUserProfile: async (userId) => {
                    const profile = await getUserProfile(userId);
                    set({ profile });
                },

                logout: () => set({ user: null, profile: null })
            }),
            {
                name: 'user-storage',
                // Only persist certain fields
                partialize: (state) => ({
                    user: state.user
                }),
                // Skip hydration on server
                skipHydration: true
            }
        )
    )
);

// Custom hook for SSR-safe Zustand
export function useUserStoreSSR(serverState) {
    const store = useUserStore();
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        // Hydrate with server state
        if (serverState && !hydrated) {
            useUserStore.setState(serverState);
            setHydrated(true);
        }
    }, [serverState, hydrated]);

    // Return server state during SSR, client state after hydration
    return typeof window === 'undefined' ? serverState : store;
}

// Usage in component
function UserProfile({ serverUserState }) {
    const { user, profile, fetchUserProfile } = useUserStoreSSR(serverUserState);

    useEffect(() => {
        if (user && !profile) {
            fetchUserProfile(user.id);
        }
    }, [user, profile, fetchUserProfile]);

    return (
        <div>
            <h1>{user?.name}</h1>
            {profile && <UserProfileDetails profile={profile} />}
        </div>
    );
}
```


### 4. ROUTING & NAVIGATION PATTERNS


**Advanced Routing Strategies:**


```javascript
// Dynamic routing với data dependencies
// pages/blog/[...slug].js
function BlogPost({ post, relatedPosts }) {
    const router = useRouter();

    // Handle loading states for fallback pages
    if (router.isFallback) {
        return <BlogPostSkeleton />;
    }

    return (
        <article>
            <BlogPostHeader post={post} />
            <BlogPostContent content={post.content} />
            <RelatedPosts posts={relatedPosts} />
        </article>
    );
}

export async function getStaticPaths() {
    // Generate paths for most popular posts
    const popularPosts = await getPopularPosts(100);

    const paths = popularPosts.map(post => ({
        params: {
            slug: post.slug.split('/').filter(Boolean)
        }
    }));

    return {
        paths,
        fallback: 'blocking' // Generate other posts on-demand
    };
}

export async function getStaticProps({ params }) {
    const slug = params.slug.join('/');
    const post = await getPostBySlug(slug);

    if (!post) {
        return { notFound: true };
    }

    const relatedPosts = await getRelatedPosts(post.tags, post.id);

    return {
        props: { post, relatedPosts },
        revalidate: 3600
    };
}

// Programmatic navigation với data prefetching
function NavigationComponent() {
    const router = useRouter();

    const handleNavigateWithPrefetch = useCallback(async (href) => {
        // Start prefetching data before navigation
        router.prefetch(href);

        // Optional: Preload critical data
        const criticalData = await prefetchCriticalData(href);

        // Navigate with prefetched data
        router.push({
            pathname: href,
            query: { prefetched: JSON.stringify(criticalData) }
        });
    }, [router]);

    return (
        <nav>
            <button onClick={() => handleNavigateWithPrefetch('/dashboard')}>
                Go to Dashboard
            </button>
        </nav>
    );
}
```


**Middleware for Route Protection:**


```javascript
// middleware.js (Next.js 12+)
import { NextResponse } from 'next/server';
import { verifyToken } from './lib/auth';

export async function middleware(request) {
    const { pathname } = request.nextUrl;

    // Protected routes
    if (pathname.startsWith('/dashboard')) {
        const token = request.cookies.get('auth-token')?.value;

        if (!token) {
            return NextResponse.redirect(new URL('/login', request.url));
        }

        try {
            const user = await verifyToken(token);

            // Add user info to headers for pages to use
            const response = NextResponse.next();
            response.headers.set('x-user-id', user.id);
            response.headers.set('x-user-role', user.role);

            return response;
        } catch (error) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    // Admin routes
    if (pathname.startsWith('/admin')) {
        const token = request.cookies.get('auth-token')?.value;

        if (!token) {
            return NextResponse.redirect(new URL('/login', request.url));
        }

        const user = await verifyToken(token);
        if (user.role !== 'admin') {
            return NextResponse.redirect(new URL('/unauthorized', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard/:path*', '/admin/:path*']
};
```


### 5. PERFORMANCE OPTIMIZATION


**Code Splitting & Lazy Loading:**


```javascript
// Dynamic imports với custom loading
const LazyDashboard = dynamic(
    () => import('../components/Dashboard'),
    {
        loading: () => <DashboardSkeleton />,
        ssr: false // Disable SSR for this component
    }
);

// Conditional loading based on user permissions
const AdminPanel = dynamic(
    () => import('../components/AdminPanel'),
    {
        loading: () => <div>Loading admin panel...</div>,
        ssr: false
    }
);

function App({ user }) {
    const [showAdmin, setShowAdmin] = useState(false);

    return (
        <div>
            <Header />
            <LazyDashboard />

            {user.isAdmin && (
                <button onClick={() => setShowAdmin(true)}>
                    Load Admin Panel
                </button>
            )}

            {showAdmin && <AdminPanel />}
        </div>
    );
}

// Resource preloading
function useResourcePreloading() {
    useEffect(() => {
        // Preload critical CSS
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'style';
        link.href = '/critical.css';
        document.head.appendChild(link);

        // Preload important images
        const img = new Image();
        img.src = '/hero-image.jpg';

        // Prefetch likely next pages
        router.prefetch('/dashboard');
        router.prefetch('/profile');
    }, []);
}

// Bundle analysis và optimization
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: process.env.ANALYZE === 'true'
});

module.exports = withBundleAnalyzer({
    experimental: {
        optimizeCss: true,
        optimizeImages: true
    },

    // Optimize font loading
    optimizeFonts: true,

    // Image optimization
    images: {
        domains: ['example.com'],
        formats: ['image/webp', 'image/avif']
    },

    // Webpack optimizations
    webpack: (config, { dev, isServer }) => {
        if (!dev && !isServer) {
            // Split chunks more aggressively
            config.optimization.splitChunks.cacheGroups.vendor = {
                test: /[\\/]node_modules[\\/]/,
                name: 'vendors',
                priority: 10,
                chunks: 'all'
            };
        }

        return config;
    }
});
```


**Caching Strategies:**


```javascript
// API route với caching
// pages/api/posts.js
export default async function handler(req, res) {
    const { method, query } = req;

    if (method === 'GET') {
        const cacheKey = `posts-${JSON.stringify(query)}`;

        // Try cache first
        const cached = await redis.get(cacheKey);
        if (cached) {
            res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
            return res.json(JSON.parse(cached));
        }

        // Fetch fresh data
        const posts = await getPosts(query);

        // Cache the result
        await redis.setex(cacheKey, 3600, JSON.stringify(posts));

        res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
        res.json(posts);
    }
}

// Edge caching với ISR
export async function getStaticProps() {
    const posts = await getPosts();

    return {
        props: { posts },
        revalidate: 60, // Revalidate every minute

        // Custom cache tags for purging
        tags: ['posts']
    };
}

// Custom caching hook
function useApiCache(url, options = {}) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const cacheKey = `api-${url}`;

        // Check session storage first
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
            const { data: cachedData, timestamp } = JSON.parse(cached);
            const isStale = Date.now() - timestamp > (options.ttl || 300000); // 5min default

            if (!isStale) {
                setData(cachedData);
                setLoading(false);
                return;
            }
        }

        // Fetch fresh data
        fetch(url)
            .then(res => res.json())
            .then(freshData => {
                setData(freshData);
                setLoading(false);

                // Cache the result
                sessionStorage.setItem(cacheKey, JSON.stringify({
                    data: freshData,
                    timestamp: Date.now()
                }));
            });
    }, [url, options.ttl]);

    return { data, loading };
}
```


### 6. SEO & META OPTIMIZATION


**Advanced SEO Patterns:**


```javascript
// SEO component với structured data
function SEOHead({
    title,
    description,
    keywords,
    image,
    url,
    type = 'website',
    structuredData
}) {
    const siteTitle = 'My Site';
    const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle;

    return (
        <Head>
            {/* Basic meta tags */}
            <title>{fullTitle}</title>
            <meta name="description" content={description} />
            <meta name="keywords" content={keywords} />
            <link rel="canonical" href={url} />

            {/* Open Graph */}
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={image} />
            <meta property="og:url" content={url} />
            <meta property="og:type" content={type} />
            <meta property="og:site_name" content={siteTitle} />

            {/* Twitter Card */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={image} />

            {/* Structured Data */}
            {structuredData && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify(structuredData)
                    }}
                />
            )}
        </Head>
    );
}

// Blog post với rich structured data
function BlogPost({ post }) {
    const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.excerpt,
        image: post.featuredImage,
        author: {
            '@type': 'Person',
            name: post.author.name,
            url: post.author.profileUrl
        },
        publisher: {
            '@type': 'Organization',
            name: 'My Blog',
            logo: {
                '@type': 'ImageObject',
                url: 'https://myblog.com/logo.png'
            }
        },
        datePublished: post.publishedAt,
        dateModified: post.updatedAt,
        mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': `https://myblog.com/posts/${post.slug}`
        }
    };

    return (
        <>
            <SEOHead
                title={post.title}
                description={post.excerpt}
                keywords={post.tags.join(', ')}
                image={post.featuredImage}
                url={`https://myblog.com/posts/${post.slug}`}
                type="article"
                structuredData={structuredData}
            />

            <article>
                <h1>{post.title}</h1>
                <div dangerouslySetInnerHTML={{ __html: post.content }} />
            </article>
        </>
    );
}

// Sitemap generation
// pages/sitemap.xml.js
function Sitemap() {
    // This component doesn't render anything
    return null;
}

export async function getServerSideProps({ res }) {
    // Fetch all pages/posts
    const [pages, posts] = await Promise.all([
        getStaticPages(),
        getAllPosts()
    ]);

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        ${pages.map(page => `
            <url>
                <loc>https://mysite.com${page.path}</loc>
                <lastmod>${page.updatedAt}</lastmod>
                <changefreq>${page.changefreq}</changefreq>
                <priority>${page.priority}</priority>
            </url>
        `).join('')}

        ${posts.map(post => `
            <url>
                <loc>https://mysite.com/posts/${post.slug}</loc>
                <lastmod>${post.updatedAt}</lastmod>
                <changefreq>weekly</changefreq>
                <priority>0.8</priority>
            </url>
        `).join('')}
    </urlset>`;

    res.setHeader('Content-Type', 'text/xml');
    res.setHeader(
        'Cache-Control',
        'public, s-maxage=1200, stale-while-revalidate'
    );
    res.write(sitemap);
    res.end();

    return { props: {} };
}
```


### 7. ERROR HANDLING & MONITORING


**SSR Error Boundaries:**


```javascript
// Error boundary for SSR
class SSRErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // Log to error reporting service
        console.error('SSR Error:', error, errorInfo);

        // Report to monitoring service
        if (typeof window !== 'undefined') {
            // Client-side error reporting
            errorReporting.captureException(error, {
                contexts: { react: errorInfo },
                tags: { component: 'SSRErrorBoundary' }
            });
        } else {
            // Server-side error reporting
            serverErrorReporting.captureException(error, errorInfo);
        }
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback || (
                <div className="error-fallback">
                    <h2>Something went wrong</h2>
                    <p>Please refresh the page or try again later.</p>
                </div>
            );
        }

        return this.props.children;
    }
}

// Custom error pages
// pages/_error.js
function Error({ statusCode, hasGetInitialPropsRun, err }) {
    useEffect(() => {
        if (err) {
            // Report client-side errors
            errorReporting.captureException(err);
        }
    }, [err]);

    return (
        <div className="error-page">
            <h1>
                {statusCode
                    ? `A ${statusCode} error occurred on server`
                    : 'An error occurred on client'}
            </h1>

            {statusCode === 404 && (
                <div>
                    <p>This page could not be found.</p>
                    <Link href="/">
                        <a>Go back home</a>
                    </Link>
                </div>
            )}

            {statusCode === 500 && (
                <div>
                    <p>Internal server error occurred.</p>
                    <button onClick={() => window.location.reload()}>
                        Refresh page
                    </button>
                </div>
            )}
        </div>
    );
}

Error.getInitialProps = ({ res, err }) => {
    const statusCode = res ? res.statusCode : err ? err.statusCode : 404;

    // Log server-side errors
    if (err) {
        console.error('Server error:', err);
        serverErrorReporting.captureException(err);
    }

    return { statusCode };
};

// API error handling
// pages/api/users/[id].js
export default async function handler(req, res) {
    try {
        const { id } = req.query;

        if (!id) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        const user = await getUser(id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('API Error:', error);

        // Report to monitoring service
        errorReporting.captureException(error, {
            tags: { api: 'users', method: req.method }
        });

        res.status(500).json({
            error: 'Internal server error',
            ...(process.env.NODE_ENV === 'development' && { details: error.message })
        });
    }
}
```


### 8. TESTING SSR APPLICATIONS


**Server-Side Testing:**


```javascript
// Testing SSR pages
import { render } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { getServerSideProps } from '../pages/user/[id]';

describe('User Page SSR', () => {
    test('should render user data server-side', async () => {
        const mockReq = { query: { id: '123' } };
        const mockRes = {};

        const { props } = await getServerSideProps({
            req: mockReq,
            res: mockRes,
            query: { id: '123' }
        });

        expect(props.user).toBeDefined();
        expect(props.user.id).toBe('123');
    });

    test('should redirect when user not found', async () => {
        const mockReq = { query: { id: 'nonexistent' } };
        const mockRes = {};

        const result = await getServerSideProps({
            req: mockReq,
            res: mockRes,
            query: { id: 'nonexistent' }
        });

        expect(result).toHaveProperty('redirect');
        expect(result.redirect.destination).toBe('/404');
    });

    test('should server-render without errors', () => {
        const user = { id: '123', name: 'John Doe' };

        expect(() => {
            renderToString(<UserPage user={user} />);
        }).not.toThrow();
    });
});

// Testing hydration
import { hydrateRoot } from 'react-dom/client';

describe('SSR Hydration', () => {
    test('should hydrate without mismatches', () => {
        const serverHTML = renderToString(<App />);

        // Create DOM from server HTML
        document.body.innerHTML = `<div id="root">${serverHTML}</div>`;

        const container = document.getElementById('root');

        // Should hydrate without warnings
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

        hydrateRoot(container, <App />);

        expect(consoleSpy).not.toHaveBeenCalledWith(
            expect.stringContaining('hydrat')
        );

        consoleSpy.mockRestore();
    });
});

// E2E testing với Playwright
import { test, expect } from '@playwright/test';

test.describe('SSR E2E Tests', () => {
    test('should show content immediately on page load', async ({ page }) => {
        // Disable JavaScript to test pure SSR
        await page.setJavaScriptEnabled(false);

        await page.goto('/user/123');

        // Content should be visible immediately
        await expect(page.locator('h1')).toContainText('John Doe');
        await expect(page.locator('[data-testid="user-email"]')).toBeVisible();
    });

    test('should maintain functionality after hydration', async ({ page }) => {
        await page.goto('/user/123');

        // Wait for hydration
        await page.waitForLoadState('networkidle');

        // Interactive features should work
        await page.click('[data-testid="edit-button"]');
        await expect(page.locator('[data-testid="edit-modal"]')).toBeVisible();
    });

    test('should have correct SEO meta tags', async ({ page }) => {
        await page.goto('/user/123');

        const title = await page.title();
        expect(title).toBe('John Doe | My App');

        const description = await page.getAttribute('meta[name="description"]', 'content');
        expect(description).toContain('John Doe');

        const ogTitle = await page.getAttribute('meta[property="og:title"]', 'content');
        expect(ogTitle).toBe('John Doe | My App');
    });
});
```


### 9. DEPLOYMENT & PRODUCTION OPTIMIZATION


**Build Optimization:**


```javascript
// next.config.js - Production optimization
module.exports = {
    // Compiler options
    compiler: {
        removeConsole: process.env.NODE_ENV === 'production',
        styledComponents: true
    },

    // Experimental features for performance
    experimental: {
        appDir: true,
        serverActions: true,
        serverComponentsExternalPackages: ['mongoose']
    },

    // Output configuration
    output: 'standalone', // For Docker deployments

    // Image optimization
    images: {
        formats: ['image/webp', 'image/avif'],
        minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
        dangerouslyAllowSVG: true,
        domains: ['cdn.example.com']
    },

    // Headers for security và performance
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'X-Frame-Options',
                        value: 'DENY'
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff'
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'origin-when-cross-origin'
                    }
                ]
            },
            {
                source: '/api/(.*)',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'no-store, max-age=0'
                    }
                ]
            }
        ];
    },

    // Rewrites for API proxying
    async rewrites() {
        return [
            {
                source: '/api/external/:path*',
                destination: 'https://api.external.com/:path*'
            }
        ];
    }
};

// Docker optimization
// Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then yarn global add pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

RUN yarn build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```


### 10. MONITORING & ANALYTICS


**Performance Monitoring:**


```javascript
// Web Vitals tracking
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric) {
    // Send to your analytics service
    analytics.track('web-vital', {
        name: metric.name,
        value: metric.value,
        id: metric.id,
        delta: metric.delta
    });
}

// Track all web vitals
getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);

// Custom performance monitoring
function usePerformanceMonitoring() {
    useEffect(() => {
        // Monitor hydration time
        const hydrationStart = performance.mark('hydration-start');

        return () => {
            performance.mark('hydration-end');
            performance.measure('hydration', 'hydration-start', 'hydration-end');

            const measure = performance.getEntriesByName('hydration')[0];
            sendToAnalytics({
                name: 'hydration-time',
                value: measure.duration
            });
        };
    }, []);
}

// Server-side performance monitoring
export async function getServerSideProps(context) {
    const startTime = Date.now();

    try {
        const data = await fetchData();

        const endTime = Date.now();
        const duration = endTime - startTime;

        // Log slow requests
        if (duration > 1000) {
            console.warn(`Slow SSR: ${context.req.url} took ${duration}ms`);
        }

        return {
            props: {
                data,
                _performanceMetrics: {
                    ssrDuration: duration
                }
            }
        };
    } catch (error) {
        // Monitor errors
        errorReporting.captureException(error, {
            tags: { ssr: true, page: context.req.url }
        });

        throw error;
    }
}
```


### INTERVIEW PREPARATION FOCUS


**Architecture Questions:**


1. **SSR vs SSG vs CSR**: When would you choose each approach?
2. **Hydration Issues**: How do you debug và prevent hydration mismatches?
3. **Performance**: What strategies do you use to optimize SSR performance?
4. **Caching**: How do you implement caching strategies for SSR applications?


**Technical Deep Dives:**


1. **Data Fetching**: Compare getServerSideProps vs getStaticProps vs App Router
2. **State Management**: How do you handle state rehydration với different state libraries?
3. **SEO Optimization**: What SEO strategies are specific to SSR applications?
4. **Error Handling**: How do you handle errors differently on server vs client?


**Code Review Scenarios:**


- Optimize slow SSR pages
- Debug hydration mismatches
- Implement proper caching strategies
- Review SEO implementation
- Evaluate error handling patterns


Với kiến thức sâu về SSR/Isomorphic React này, bạn có thể demonstrate expertise trong **full-stack React development**, **performance optimization**, **SEO**, và **production deployment** - những skills quan trọng cho senior/lead positions working on complex, high-traffic applications.


## Claude


## PERFORMANCE OPTIMIZATION TRONG REACT - CHI TIẾT CHO SENIOR/LEAD LEVEL


### 1. REACT RENDERING OPTIMIZATION


**Understanding React Reconciliation:**


```javascript
// React Fiber reconciliation process
function OptimizedComponent({ items, selectedId, onSelect }) {
    // ❌ Bad: Causes unnecessary re-renders
    const handleSelect = (id) => {
        onSelect(id);
    };

    const filteredItems = items.filter(item => item.isActive);

    return (
        <div>
            {filteredItems.map(item => (
                <ItemComponent
                    key={item.id}
                    item={item}
                    isSelected={selectedId === item.id}
                    onSelect={handleSelect} // New function every render
                />
            ))}
        </div>
    );
}

// ✅ Good: Optimized version
function OptimizedComponent({ items, selectedId, onSelect }) {
    // Memoize expensive computations
    const filteredItems = useMemo(() =>
        items.filter(item => item.isActive),
        [items]
    );

    // Memoize callbacks
    const handleSelect = useCallback((id) => {
        onSelect(id);
    }, [onSelect]);

    return (
        <div>
            {filteredItems.map(item => (
                <MemoizedItemComponent
                    key={item.id}
                    item={item}
                    isSelected={selectedId === item.id}
                    onSelect={handleSelect}
                />
            ))}
        </div>
    );
}

// Memoized child component
const MemoizedItemComponent = React.memo(({ item, isSelected, onSelect }) => {
    const handleClick = useCallback(() => {
        onSelect(item.id);
    }, [item.id, onSelect]);

    return (
        <div
            className={`item ${isSelected ? 'selected' : ''}`}
            onClick={handleClick}
        >
            {item.name}
        </div>
    );
}, (prevProps, nextProps) => {
    // Custom comparison for shallow equality
    return (
        prevProps.item.id === nextProps.item.id &&
        prevProps.item.name === nextProps.item.name &&
        prevProps.isSelected === nextProps.isSelected &&
        prevProps.onSelect === nextProps.onSelect
    );
});
```


**Advanced Memoization Strategies:**


```javascript
// Deep comparison memoization
function useDeepCompareMemo(factory, deps) {
    const ref = useRef();

    if (!ref.current || !deepEqual(deps, ref.current.deps)) {
        ref.current = {
            deps,
            value: factory()
        };
    }

    return ref.current.value;
}

// Selective memoization based on props
function useSelectiveMemo(obj, keys) {
    return useMemo(() => {
        const selected = {};
        keys.forEach(key => {
            selected[key] = obj[key];
        });
        return selected;
    }, keys.map(key => obj[key]));
}

// Advanced component with selective updates
function DataVisualization({
    data,
    config,
    theme,
    interactions,
    onDataPointClick
}) {
    // Only recalculate when data changes
    const processedData = useMemo(() => {
        console.log('Processing data...');
        return data.map(item => ({
            ...item,
            normalized: item.value / Math.max(...data.map(d => d.value))
        }));
    }, [data]);

    // Only recalculate layout when config or theme changes
    const layout = useMemo(() => {
        console.log('Calculating layout...');
        return calculateLayout(config, theme);
    }, [config.width, config.height, theme.spacing]);

    // Memoize event handlers
    const handleDataPointClick = useCallback((dataPoint) => {
        onDataPointClick(dataPoint);
        // Additional expensive operations
        updateAnalytics(dataPoint);
    }, [onDataPointClick]);

    // Only re-render when essential props change
    return (
        <VisualizationCanvas
            data={processedData}
            layout={layout}
            interactions={interactions}
            onDataPointClick={handleDataPointClick}
        />
    );
}

// Memoize with custom equality
const VisualizationCanvas = React.memo(({
    data,
    layout,
    interactions,
    onDataPointClick
}) => {
    // Complex rendering logic
    return (
        <svg width={layout.width} height={layout.height}>
            {data.map((point, index) => (
                <DataPoint
                    key={point.id}
                    point={point}
                    position={layout.positions[index]}
                    interactive={interactions.enabled}
                    onClick={onDataPointClick}
                />
            ))}
        </svg>
    );
}, (prevProps, nextProps) => {
    // Custom equality check for complex objects
    return (
        shallowEqual(prevProps.data, nextProps.data) &&
        shallowEqual(prevProps.layout, nextProps.layout) &&
        prevProps.interactions.enabled === nextProps.interactions.enabled &&
        prevProps.onDataPointClick === nextProps.onDataPointClick
    );
});
```


### 2. VIRTUALIZATION & LAZY LOADING


**Virtual Scrolling Implementation:**


```javascript
// Custom virtual scrolling hook
function useVirtualization({
    items,
    itemHeight,
    containerHeight,
    overscan = 5
}) {
    const [scrollTop, setScrollTop] = useState(0);

    // Calculate visible range
    const visibleRange = useMemo(() => {
        const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
        const endIndex = Math.min(
            items.length - 1,
            Math.floor((scrollTop + containerHeight) / itemHeight) + overscan
        );

        return { startIndex, endIndex };
    }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

    // Get visible items
    const visibleItems = useMemo(() => {
        return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1)
            .map((item, index) => ({
                ...item,
                index: visibleRange.startIndex + index
            }));
    }, [items, visibleRange]);

    const totalHeight = items.length * itemHeight;
    const offsetY = visibleRange.startIndex * itemHeight;

    return {
        visibleItems,
        totalHeight,
        offsetY,
        setScrollTop
    };
}

// Virtual list component
function VirtualList({
    items,
    itemHeight = 50,
    height = 400,
    renderItem
}) {
    const {
        visibleItems,
        totalHeight,
        offsetY,
        setScrollTop
    } = useVirtualization({
        items,
        itemHeight,
        containerHeight: height
    });

    const handleScroll = useCallback((e) => {
        setScrollTop(e.target.scrollTop);
    }, [setScrollTop]);

    return (
        <div
            style={{ height, overflow: 'auto' }}
            onScroll={handleScroll}
        >
            <div style={{ height: totalHeight, position: 'relative' }}>
                <div
                    style={{
                        transform: `translateY(${offsetY}px)`,
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0
                    }}
                >
                    {visibleItems.map((item) => (
                        <div
                            key={item.id}
                            style={{ height: itemHeight }}
                        >
                            {renderItem(item, item.index)}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// Usage with complex items
function LargeDataList({ data }) {
    const renderItem = useCallback((item, index) => (
        <ComplexListItem
            item={item}
            index={index}
            onAction={(action) => handleItemAction(item.id, action)}
        />
    ), []);

    return (
        <VirtualList
            items={data}
            itemHeight={120}
            height={600}
            renderItem={renderItem}
        />
    );
}
```


**Advanced Lazy Loading Patterns:**


```javascript
// Intersection Observer hook for lazy loading
function useIntersectionObserver({
    threshold = 0.1,
    root = null,
    rootMargin = '0px',
    freezeOnceVisible = false
}) {
    const [entry, setEntry] = useState(null);
    const [isVisible, setIsVisible] = useState(false);

    const element = useCallback(node => {
        if (!node) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                setEntry(entry);
                setIsVisible(entry.isIntersecting);

                if (entry.isIntersecting && freezeOnceVisible) {
                    observer.unobserve(node);
                }
            },
            { threshold, root, rootMargin }
        );

        observer.observe(node);

        return () => observer.disconnect();
    }, [threshold, root, rootMargin, freezeOnceVisible]);

    return { element, entry, isVisible };
}

// Lazy loading image component
function LazyImage({
    src,
    alt,
    placeholder,
    className,
    onLoad,
    ...props
}) {
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);
    const { element, isVisible } = useIntersectionObserver({
        threshold: 0.1,
        freezeOnceVisible: true
    });

    const handleLoad = useCallback(() => {
        setLoaded(true);
        onLoad?.();
    }, [onLoad]);

    const handleError = useCallback(() => {
        setError(true);
    }, []);

    return (
        <div ref={element} className={className}>
            {isVisible && !error && (
                <img
                    src={src}
                    alt={alt}
                    onLoad={handleLoad}
                    onError={handleError}
                    style={{
                        opacity: loaded ? 1 : 0,
                        transition: 'opacity 0.3s ease'
                    }}
                    {...props}
                />
            )}

            {(!isVisible || (!loaded && !error)) && placeholder}

            {error && (
                <div className="image-error">
                    Failed to load image
                </div>
            )}
        </div>
    );
}

// Progressive image loading
function ProgressiveImage({
    lowResSrc,
    highResSrc,
    alt,
    className
}) {
    const [highResLoaded, setHighResLoaded] = useState(false);
    const { element, isVisible } = useIntersectionObserver();

    return (
        <div ref={element} className={className}>
            <img
                src={lowResSrc}
                alt={alt}
                style={{
                    filter: highResLoaded ? 'blur(0)' : 'blur(5px)',
                    transition: 'filter 0.3s ease'
                }}
            />

            {isVisible && (
                <img
                    src={highResSrc}
                    alt={alt}
                    style={{
                        opacity: highResLoaded ? 1 : 0,
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        transition: 'opacity 0.3s ease'
                    }}
                    onLoad={() => setHighResLoaded(true)}
                />
            )}
        </div>
    );
}
```


### 3. BUNDLE OPTIMIZATION & CODE SPLITTING


**Strategic Code Splitting:**


```javascript
// Route-based code splitting
import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

// Lazy load components
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const Analytics = lazy(() => import('./pages/Analytics'));

// Component-based code splitting
const HeavyChart = lazy(() =>
    import('./components/HeavyChart').then(module => ({
        default: module.HeavyChart
    }))
);

// Conditional loading
const AdminPanel = lazy(() => {
    // Only load if user is admin
    return import('./components/AdminPanel');
});

function App() {
    return (
        <Router>
            <Suspense fallback={<PageLoadingSkeleton />}>
                <Routes>
                    <Route
                        path="/dashboard"
                        element={<Dashboard />}
                    />
                    <Route
                        path="/profile"
                        element={<Profile />}
                    />
                    <Route
                        path="/analytics"
                        element={<Analytics />}
                    />
                </Routes>
            </Suspense>
        </Router>
    );
}

// Custom hook for dynamic imports
function useDynamicImport(importFunc, condition = true) {
    const [component, setComponent] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!condition) return;

        setLoading(true);
        setError(null);

        importFunc()
            .then(module => {
                setComponent(() => module.default || module);
            })
            .catch(err => {
                setError(err);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [condition, importFunc]);

    return { component, loading, error };
}

// Usage
function ConditionalFeature({ showAdvanced }) {
    const {
        component: AdvancedFeature,
        loading,
        error
    } = useDynamicImport(
        () => import('./AdvancedFeature'),
        showAdvanced
    );

    if (!showAdvanced) return null;
    if (loading) return <FeatureLoadingSkeleton />;
    if (error) return <FeatureError error={error} />;
    if (!AdvancedFeature) return null;

    return <AdvancedFeature />;
}
```


**Webpack Optimization Strategies:**


```javascript
// webpack.config.js - Advanced optimization
module.exports = {
    optimization: {
        // Split chunks strategy
        splitChunks: {
            chunks: 'all',
            cacheGroups: {
                // Vendor chunk
                vendor: {
                    test: /[\\/]node_modules[\\/]/,
                    name: 'vendors',
                    priority: 10,
                    chunks: 'all',
                },

                // Common chunk
                common: {
                    name: 'common',
                    minChunks: 2,
                    priority: 5,
                    chunks: 'all',
                    enforce: true
                },

                // React vendor chunk
                react: {
                    test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
                    name: 'react',
                    priority: 20,
                    chunks: 'all'
                },

                // UI library chunk
                ui: {
                    test: /[\\/]node_modules[\\/](antd|@mui\/material)[\\/]/,
                    name: 'ui-library',
                    priority: 15,
                    chunks: 'all'
                }
            }
        },

        // Runtime chunk
        runtimeChunk: {
            name: 'runtime'
        },

        // Minimize configuration
        minimize: true,
        minimizer: [
            new TerserPlugin({
                parallel: true,
                terserOptions: {
                    compress: {
                        drop_console: process.env.NODE_ENV === 'production',
                        drop_debugger: true,
                        pure_funcs: ['console.log']
                    }
                }
            })
        ]
    },

    // Module resolution optimization
    resolve: {
        modules: ['node_modules'],
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
        alias: {
            '@': path.resolve(__dirname, 'src'),
            'components': path.resolve(__dirname, 'src/components')
        }
    },

    // Performance hints
    performance: {
        maxAssetSize: 250000,
        maxEntrypointSize: 250000,
        hints: process.env.NODE_ENV === 'production' ? 'warning' : false
    }
};

// Bundle analysis
// package.json scripts
{
    "scripts": {
        "analyze": "npm run build && npx webpack-bundle-analyzer build/static/js/*.js",
        "build:analyze": "ANALYZE=true npm run build"
    }
}
```


### 4. MEMORY MANAGEMENT


**Memory Leak Prevention:**


```javascript
// Preventing memory leaks with proper cleanup
function DataSubscriptionComponent({ endpoint }) {
    const [data, setData] = useState(null);
    const [status, setStatus] = useState('idle');

    useEffect(() => {
        let cancelled = false;
        let eventSource = null;
        let intervalId = null;

        const setupConnection = async () => {
            try {
                setStatus('connecting');

                // WebSocket connection
                eventSource = new EventSource(endpoint);

                eventSource.onmessage = (event) => {
                    if (!cancelled) {
                        setData(JSON.parse(event.data));
                        setStatus('connected');
                    }
                };

                eventSource.onerror = () => {
                    if (!cancelled) {
                        setStatus('error');
                    }
                };

                // Heartbeat to keep connection alive
                intervalId = setInterval(() => {
                    if (!cancelled && eventSource.readyState === EventSource.OPEN) {
                        // Send heartbeat
                        fetch(`${endpoint}/heartbeat`, { method: 'POST' });
                    }
                }, 30000);

            } catch (error) {
                if (!cancelled) {
                    setStatus('error');
                }
            }
        };

        setupConnection();

        // Cleanup function
        return () => {
            cancelled = true;

            if (eventSource) {
                eventSource.close();
            }

            if (intervalId) {
                clearInterval(intervalId);
            }

            setStatus('disconnected');
        };
    }, [endpoint]);

    return (
        <div>
            <ConnectionStatus status={status} />
            {data && <DataDisplay data={data} />}
        </div>
    );
}

// WeakMap for private data to prevent memory leaks
const privateData = new WeakMap();

class ComponentWithPrivateData extends React.Component {
    constructor(props) {
        super(props);

        // Store private data in WeakMap
        privateData.set(this, {
            expensiveData: null,
            callbacks: new Set(),
            subscriptions: new Map()
        });
    }

    componentDidMount() {
        const data = privateData.get(this);

        // Setup subscriptions
        const unsubscribe = eventBus.subscribe('data-update', this.handleDataUpdate);
        data.subscriptions.set('data-update', unsubscribe);
    }

    componentWillUnmount() {
        const data = privateData.get(this);

        // Clean up all subscriptions
        data.subscriptions.forEach(unsubscribe => unsubscribe());
        data.subscriptions.clear();
        data.callbacks.clear();

        // WeakMap will automatically clean up when component is GC'd
    }

    handleDataUpdate = (newData) => {
        const data = privateData.get(this);
        data.expensiveData = processExpensiveData(newData);
        this.forceUpdate();
    }

    render() {
        const data = privateData.get(this);
        return <div>{data.expensiveData?.summary}</div>;
    }
}

// Memory-efficient infinite scroll
function useInfiniteScroll({
    fetchMore,
    hasMore,
    threshold = 100,
    maxCachedPages = 10
}) {
    const [pages, setPages] = useState([]);
    const [loading, setLoading] = useState(false);
    const observerRef = useRef();

    // Limit cached pages to prevent memory bloat
    const limitedPages = useMemo(() => {
        if (pages.length <= maxCachedPages) {
            return pages;
        }

        // Keep first few and last few pages
        const keepFirst = Math.floor(maxCachedPages / 2);
        const keepLast = maxCachedPages - keepFirst;

        return [
            ...pages.slice(0, keepFirst),
            ...pages.slice(-keepLast)
        ];
    }, [pages, maxCachedPages]);

    const loadMore = useCallback(async () => {
        if (loading || !hasMore) return;

        setLoading(true);
        try {
            const newPage = await fetchMore(pages.length);
            setPages(prev => [...prev, newPage]);
        } finally {
            setLoading(false);
        }
    }, [fetchMore, hasMore, loading, pages.length]);

    // Intersection observer for scroll detection
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    loadMore();
                }
            },
            { threshold: 0.1 }
        );

        if (observerRef.current) {
            observer.observe(observerRef.current);
        }

        return () => observer.disconnect();
    }, [loadMore]);

    return {
        pages: limitedPages,
        loading,
        observerRef,
        loadMore
    };
}
```


### 5. PROFILING & PERFORMANCE MONITORING


**React DevTools Profiler Integration:**


```javascript
// Programmatic profiling
function useProfiler(id, onRender) {
    const profiledOnRender = useCallback((id, phase, actualDuration, baseDuration, startTime, commitTime) => {
        onRender?.({
            id,
            phase,
            actualDuration,
            baseDuration,
            startTime,
            commitTime,
            interactions: new Set() // React 18+
        });
    }, [onRender]);

    return function ProfiledComponent({ children }) {
        return (
            <Profiler id={id} onRender={profiledOnRender}>
                {children}
            </Profiler>
        );
    };
}

// Performance monitoring component
function PerformanceMonitor({ children, onMetrics }) {
    const [metrics, setMetrics] = useState({
        renderTime: 0,
        commitTime: 0,
        componentCount: 0
    });

    const handleRender = useCallback((profilerData) => {
        const newMetrics = {
            renderTime: profilerData.actualDuration,
            commitTime: profilerData.commitTime - profilerData.startTime,
            componentCount: 1 // This would be calculated differently in real implementation
        };

        setMetrics(newMetrics);
        onMetrics?.(newMetrics);

        // Log slow renders
        if (profilerData.actualDuration > 16) { // > 1 frame at 60fps
            console.warn(`Slow render detected: ${profilerData.id} took ${profilerData.actualDuration}ms`);
        }
    }, [onMetrics]);

    const ProfiledWrapper = useProfiler('performance-monitor', handleRender);

    return (
        <ProfiledWrapper>
            {children}
            <PerformanceOverlay metrics={metrics} />
        </ProfiledWrapper>
    );
}

// Custom performance hooks
function useRenderTime() {
    const renderStart = useRef();
    const [renderTime, setRenderTime] = useState(0);

    useLayoutEffect(() => {
        renderStart.current = performance.now();
    });

    useEffect(() => {
        const duration = performance.now() - renderStart.current;
        setRenderTime(duration);
    });

    return renderTime;
}

function useReRenderCount() {
    const renderCount = useRef(0);

    useEffect(() => {
        renderCount.current += 1;
    });

    return renderCount.current;
}

// Performance debugging component
function PerformanceDebugger({
    children,
    name,
    logSlowRenders = true,
    slowThreshold = 16
}) {
    const renderTime = useRenderTime();
    const renderCount = useReRenderCount();
    const [lastProps, setLastProps] = useState({});

    useEffect(() => {
        if (logSlowRenders && renderTime > slowThreshold) {
            console.group(`🐌 Slow render: ${name}`);
            console.log(`Render time: ${renderTime.toFixed(2)}ms`);
            console.log(`Render count: ${renderCount}`);
            console.log('Props that changed:', getChangedProps(lastProps, children.props));
            console.groupEnd();
        }

        setLastProps(children.props);
    }, [renderTime, renderCount, slowThreshold, logSlowRenders, name, children.props, lastProps]);

    return children;
}

function getChangedProps(prevProps, nextProps) {
    const changedProps = {};

    Object.keys(nextProps).forEach(key => {
        if (prevProps[key] !== nextProps[key]) {
            changedProps[key] = {
                from: prevProps[key],
                to: nextProps[key]
            };
        }
    });

    return changedProps;
}
```


**Web Vitals Monitoring:**


```javascript
// Comprehensive Web Vitals tracking
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

class PerformanceTracker {
    constructor() {
        this.metrics = new Map();
        this.observers = new Map();
        this.setupWebVitals();
        this.setupCustomMetrics();
    }

    setupWebVitals() {
        const sendToAnalytics = (metric) => {
            this.metrics.set(metric.name, metric);

            // Send to analytics service
            this.reportMetric({
                name: metric.name,
                value: metric.value,
                id: metric.id,
                delta: metric.delta
            });
        };

        getCLS(sendToAnalytics);
        getFID(sendToAnalytics);
        getFCP(sendToAnalytics);
        getLCP(sendToAnalytics);
        getTTFB(sendToAnalytics);
    }

    setupCustomMetrics() {
        // React hydration time
        this.measureHydrationTime();

        // Route change performance
        this.measureRouteChanges();

        // Component mount time
        this.measureComponentMounts();
    }

    measureHydrationTime() {
        if (typeof window === 'undefined') return;

        const hydrationStart = performance.now();

        // Wait for React to be ready
        const checkHydration = () => {
            const root = document.querySelector('#root');
            if (root && root._reactInternalInstance) {
                const hydrationTime = performance.now() - hydrationStart;

                this.reportMetric({
                    name: 'react-hydration',
                    value: hydrationTime
                });
            } else {
                requestIdleCallback(checkHydration);
            }
        };

        requestIdleCallback(checkHydration);
    }

    measureRouteChanges() {
        let routeChangeStart = null;

        // Listen for route changes (React Router)
        const originalPushState = history.pushState;
        const originalReplaceState = history.replaceState;

        history.pushState = function(...args) {
            routeChangeStart = performance.now();
            return originalPushState.apply(history, args);
        };

        history.replaceState = function(...args) {
            routeChangeStart = performance.now();
            return originalReplaceState.apply(history, args);
        };

        // Measure when route change is complete
        const observer = new MutationObserver(() => {
            if (routeChangeStart) {
                const routeChangeTime = performance.now() - routeChangeStart;

                this.reportMetric({
                    name: 'route-change',
                    value: routeChangeTime
                });

                routeChangeStart = null;
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    measureComponentMounts() {
        // This would integrate with React DevTools Profiler
        const componentMountTimes = new Map();

        return {
            onComponentMount: (componentName, mountTime) => {
                componentMountTimes.set(componentName, mountTime);

                if (mountTime > 100) { // Log slow mounts
                    this.reportMetric({
                        name: 'slow-component-mount',
                        value: mountTime,
                        component: componentName
                    });
                }
            }
        };
    }

    reportMetric(metric) {
        // Send to analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'performance_metric', {
                event_category: 'Performance',
                event_label: metric.name,
                value: Math.round(metric.value)
            });
        }

        // Log to console in development
        if (process.env.NODE_ENV === 'development') {
            console.log(`📊 Performance: ${metric.name} = ${metric.value.toFixed(2)}ms`);
        }
    }

    getMetrics() {
        return Object.fromEntries(this.metrics);
    }
}

// Usage
const performanceTracker = new PerformanceTracker();

// React hook for performance tracking
function usePerformanceTracker() {
    const [metrics, setMetrics] = useState({});

    useEffect(() => {
        const interval = setInterval(() => {
            setMetrics(performanceTracker.getMetrics());
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    return {
        metrics,
        reportCustomMetric: (name, value) => {
            performanceTracker.reportMetric({ name, value });
        }
    };
}
```


### 6. IMAGE & ASSET OPTIMIZATION


**Advanced Image Optimization:**


```javascript
// Responsive image component with optimization
function OptimizedImage({
    src,
    alt,
    sizes = '100vw',
    quality = 75,
    priority = false,
    placeholder = 'blur',
    blurDataURL,
    ...props
}) {
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);
    const imgRef = useRef();

    // Generate responsive image URLs
    const generateSrcSet = useCallback((baseSrc) => {
        const widths = [320, 640, 768, 1024, 1280, 1920];
        return widths
            .map(width =>
                `${baseSrc}?w=${width}&q=${quality} ${width}w`
            )
            .join(', ');
    }, [quality]);

    // Preload high priority images
    useEffect(() => {
        if (priority && src) {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = src;
            document.head.appendChild(link);

            return () => {
                document.head.removeChild(link);
            };
        }
    }, [priority, src]);

    // Handle loading states
    const handleLoad = useCallback(() => {
        setLoaded(true);
        setError(false);
    }, []);

    const handleError = useCallback(() => {
        setError(true);
    }, []);

    return (
        <picture>
            {/* WebP format for modern browsers */}
            <source
                srcSet={generateSrcSet(src.replace(/\.(jpg|jpeg|png)$/, '.webp'))}
                sizes={sizes}
                type="image/webp"
            />

            {/* AVIF format for even better compression */}
            <source
                srcSet={generateSrcSet(src.replace(/\.(jpg|jpeg|png)$/, '.avif'))}
                sizes={sizes}
                type="image/avif"
            />

            {/* Fallback */}
            <img
                ref={imgRef}
                src={src}
                srcSet={generateSrcSet(src)}
                sizes={sizes}
                alt={alt}
                onLoad={handleLoad}
                onError={handleError}
                loading={priority ? 'eager' : 'lazy'}
                style={{
                    opacity: loaded ? 1 : 0,
                    transition: 'opacity 0.3s ease',
                    backgroundColor: placeholder === 'blur' ? '#f0f0f0' : 'transparent'
                }}
                {...props}
            />

            {/* Blur placeholder */}
            {!loaded && placeholder === 'blur' && blurDataURL && (
                <img
                    src={blurDataURL}
                    alt=""
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        filter: 'blur(10px)',
                        zIndex: -1
                    }}
                />
            )}

            {error && (
                <div className="image-error">
                    Failed to load image
                </div>
            )}
        </picture>
    );
}

// Image preloading strategy
function useImagePreloader() {
    const [preloadedImages] = useState(() => new Set());

    const preloadImage = useCallback((src) => {
        if (preloadedImages.has(src)) {
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            const img = new Image();

            img.onload = () => {
                preloadedImages.add(src);
                resolve();
            };

            img.onerror = reject;
            img.src = src;
        });
    }, [preloadedImages]);

    const preloadImages = useCallback(async (sources) => {
        const promises = sources.map(src => preloadImage(src));
        return Promise.allSettled(promises);
    }, [preloadImage]);

    return { preloadImage, preloadImages, preloadedImages };
}

// Asset optimization utilities
class AssetOptimizer {
    constructor() {
        this.cache = new Map();
        this.compressionWorker = null;
    }

    // Compress images using Canvas API
    async compressImage(file, quality = 0.8, maxWidth = 1920) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                // Calculate new dimensions
                const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
                canvas.width = img.width * ratio;
                canvas.height = img.height * ratio;

                // Draw and compress
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                canvas.toBlob(resolve, 'image/jpeg', quality);
            };

            img.src = URL.createObjectURL(file);
        });
    }

    // Generate blur placeholder
    generateBlurPlaceholder(imageSrc) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                // Small canvas for blur effect
                canvas.width = 40;
                canvas.height = 40;

                ctx.drawImage(img, 0, 0, 40, 40);

                // Apply blur filter
                ctx.filter = 'blur(4px)';
                ctx.drawImage(canvas, 0, 0);

                resolve(canvas.toDataURL('image/jpeg', 0.1));
            };

            img.src = imageSrc;
        });
    }
}
```


### 7. STATE MANAGEMENT OPTIMIZATION


**Optimized Context Usage:**


```javascript
// Split contexts to minimize re-renders
const UserDataContext = createContext();
const UserActionsContext = createContext();
const UserPreferencesContext = createContext();

function UserProvider({ children }) {
    const [userData, setUserData] = useState(null);
    const [preferences, setPreferences] = useState({});

    // Memoize context values
    const userDataValue = useMemo(() => userData, [userData]);

    const userActions = useMemo(() => ({
        updateUser: (updates) => {
            setUserData(prev => ({ ...prev, ...updates }));
        },

        updatePreferences: (prefUpdates) => {
            setPreferences(prev => ({ ...prev, ...prefUpdates }));
        },

        logout: () => {
            setUserData(null);
            setPreferences({});
        }
    }), []);

    const preferencesValue = useMemo(() => preferences, [preferences]);

    return (
        <UserDataContext.Provider value={userDataValue}>
            <UserActionsContext.Provider value={userActions}>
                <UserPreferencesContext.Provider value={preferencesValue}>
                    {children}
                </UserPreferencesContext.Provider>
            </UserActionsContext.Provider>
        </UserDataContext.Provider>
    );
}

// Selective context consumption
function useUserData() {
    const context = useContext(UserDataContext);
    if (!context) throw new Error('useUserData must be used within UserProvider');
    return context;
}

function useUserActions() {
    const context = useContext(UserActionsContext);
    if (!context) throw new Error('useUserActions must be used within UserProvider');
    return context;
}

// Optimized selector pattern
function createSelector(selector) {
    let lastState = null;
    let lastResult = null;

    return (state) => {
        if (state !== lastState) {
            const newResult = selector(state);
            if (newResult !== lastResult) {
                lastResult = newResult;
            }
            lastState = state;
        }
        return lastResult;
    };
}

// Context with selector
const AppStateContext = createContext();

function useAppSelector(selector) {
    const state = useContext(AppStateContext);
    const memoizedSelector = useMemo(() => createSelector(selector), [selector]);
    return useMemo(() => memoizedSelector(state), [state, memoizedSelector]);
}

// Usage
function UserProfile() {
    const userName = useAppSelector(state => state.user.name);
    const userEmail = useAppSelector(state => state.user.email);

    // Only re-renders when name or email changes
    return (
        <div>
            <h1>{userName}</h1>
            <p>{userEmail}</p>
        </div>
    );
}
```


### 8. ADVANCED PERFORMANCE PATTERNS


**Concurrent Features Optimization:**


```javascript
// Using React 18 Concurrent Features
import {
    startTransition,
    useDeferredValue,
    useTransition,
    useMemo
} from 'react';

function SearchableList({ items, searchTerm, onSearchChange }) {
    const [isPending, startTransition] = useTransition();

    // Defer expensive filtering
    const deferredSearchTerm = useDeferredValue(searchTerm);

    // Expensive filtering operation
    const filteredItems = useMemo(() => {
        console.log('Filtering items...');
        return items.filter(item =>
            item.name.toLowerCase().includes(deferredSearchTerm.toLowerCase()) ||
            item.description.toLowerCase().includes(deferredSearchTerm.toLowerCase())
        );
    }, [items, deferredSearchTerm]);

    const handleSearchChange = (value) => {
        startTransition(() => {
            onSearchChange(value);
        });
    };

    return (
        <div>
            <SearchInput
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Search items..."
            />

            {isPending && <div>Searching...</div>}

            <div style={{ opacity: isPending ? 0.7 : 1 }}>
                {filteredItems.map(item => (
                    <ListItem key={item.id} item={item} />
                ))}
            </div>
        </div>
    );
}

// Time slicing for heavy computations
function useTimeSlicing(computation, data, batchSize = 100) {
    const [result, setResult] = useState([]);
    const [progress, setProgress] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (!data.length) return;

        setIsProcessing(true);
        setResult([]);
        setProgress(0);

        const processInBatches = async () => {
            const batches = [];
            for (let i = 0; i < data.length; i += batchSize) {
                batches.push(data.slice(i, i + batchSize));
            }

            let processedResults = [];

            for (let i = 0; i < batches.length; i++) {
                // Use scheduler to yield to browser
                await new Promise(resolve => {
                    requestIdleCallback(() => {
                        const batchResults = batches[i].map(computation);
                        processedResults = [...processedResults, ...batchResults];

                        setResult([...processedResults]);
                        setProgress((i + 1) / batches.length);

                        resolve();
                    });
                });
            }

            setIsProcessing(false);
        };

        processInBatches();
    }, [data, computation, batchSize]);

    return { result, progress, isProcessing };
}

// Optimistic updates pattern
function useOptimisticUpdates(initialData, updateFn) {
    const [data, setData] = useState(initialData);
    const [optimisticData, setOptimisticData] = useState(initialData);
    const [pending, setPending] = useState(new Set());

    const performOptimisticUpdate = useCallback(async (id, updates, serverUpdateFn) => {
        // Immediately update UI
        setOptimisticData(prev =>
            prev.map(item =>
                item.id === id ? { ...item, ...updates } : item
            )
        );

        setPending(prev => new Set(prev).add(id));

        try {
            // Perform server update
            const result = await serverUpdateFn(id, updates);

            // Update real data
            setData(prev =>
                prev.map(item =>
                    item.id === id ? result : item
                )
            );

            // Sync optimistic data with server result
            setOptimisticData(prev =>
                prev.map(item =>
                    item.id === id ? result : item
                )
            );
        } catch (error) {
            // Revert optimistic update on error
            setOptimisticData(data);
            throw error;
        } finally {
            setPending(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    }, [data]);

    return {
        data: optimisticData,
        performOptimisticUpdate,
        isPending: (id) => pending.has(id)
    };
}
```


### 9. PERFORMANCE TESTING & BENCHMARKING


**Automated Performance Testing:**


```javascript
// Performance testing utilities
class PerformanceBenchmark {
    constructor() {
        this.benchmarks = new Map();
        this.results = new Map();
    }

    // Benchmark a React component
    async benchmarkComponent(Component, props, iterations = 100) {
        const results = [];

        for (let i = 0; i < iterations; i++) {
            const startTime = performance.now();

            // Render component
            const { unmount } = render(<Component {...props} />);

            const renderTime = performance.now() - startTime;

            // Cleanup
            unmount();

            results.push(renderTime);

            // Allow browser to breathe
            if (i % 10 === 0) {
                await new Promise(resolve => setTimeout(resolve, 0));
            }
        }

        return this.calculateStats(results);
    }

    // Benchmark state updates
    async benchmarkStateUpdates(Component, updateAction, iterations = 50) {
        const results = [];

        for (let i = 0; i < iterations; i++) {
            const { rerender } = render(<Component />);

            const startTime = performance.now();

            // Trigger state update
            act(() => {
                updateAction();
            });

            const updateTime = performance.now() - startTime;
            results.push(updateTime);

            // Cleanup
            cleanup();
        }

        return this.calculateStats(results);
    }

    calculateStats(results) {
        const sorted = results.sort((a, b) => a - b);
        const mean = results.reduce((sum, val) => sum + val, 0) / results.length;

        return {
            mean,
            median: sorted[Math.floor(sorted.length / 2)],
            p95: sorted[Math.floor(sorted.length * 0.95)],
            p99: sorted[Math.floor(sorted.length * 0.99)],
            min: Math.min(...results),
            max: Math.max(...results),
            samples: results.length
        };
    }

    // Compare two implementations
    async compareImplementations(impl1, impl2, props, iterations = 100) {
        console.log('🏁 Starting performance comparison...');

        const results1 = await this.benchmarkComponent(impl1, props, iterations);
        const results2 = await this.benchmarkComponent(impl2, props, iterations);

        console.table({
            'Implementation 1': results1,
            'Implementation 2': results2,
            'Improvement': {
                mean: `${(((results1.mean - results2.mean) / results1.mean) * 100).toFixed(2)}%`,
                p95: `${(((results1.p95 - results2.p95) / results1.p95) * 100).toFixed(2)}%`
            }
        });

        return { results1, results2 };
    }
}

// Usage in tests
describe('Component Performance', () => {
    const benchmark = new PerformanceBenchmark();

    test('optimized component should be faster', async () => {
        const props = { items: generateTestData(1000) };

        const { results1, results2 } = await benchmark.compareImplementations(
            UnoptimizedComponent,
            OptimizedComponent,
            props
        );

        // Assert performance improvement
        expect(results2.mean).toBeLessThan(results1.mean);
        expect(results2.p95).toBeLessThan(results1.p95);
    });

    test('component should render within performance budget', async () => {
        const results = await benchmark.benchmarkComponent(
            MyComponent,
            { data: largeDataSet }
        );

        // Performance budget: 16ms for 60fps
        expect(results.p95).toBeLessThan(16);
        expect(results.mean).toBeLessThan(10);
    });
});
```


### INTERVIEW PREPARATION FOCUS


**Core Performance Questions:**


1. **Rendering Optimization**: How do you prevent unnecessary re-renders? When would you use React.memo vs useMemo vs useCallback?
2. **Bundle Size**: What strategies do you use for code splitting và lazy loading?
3. **Memory Management**: How do you identify và fix memory leaks trong React apps?
4. **Virtual Scrolling**: When và how would you implement virtualization for large lists?


**Advanced Topics:**


1. **Concurrent Features**: How do you use React 18's concurrent features for performance?
2. **Profiling**: What tools và techniques do you use to identify performance bottlenecks?
3. **State Management**: How do you optimize context usage to prevent unnecessary re-renders?
4. **Image Optimization**: What's your approach to optimizing images trong web applications?


**Code Review Scenarios:**


- Identify performance issues trong given React code
- Optimize a slow-rendering component
- Implement efficient data fetching patterns
- Design a performance monitoring strategy


**Practical Exercises:**


- Build a virtualized table component
- Optimize a complex form with many fields
- Implement progressive image loading
- Create a performance profiling system


Với kiến thức sâu về performance optimization này, bạn có thể demonstrate expertise trong **scalable React applications**, **performance engineering**, **user experience optimization**, và **production-ready solutions** - những skills quan trọng cho senior/lead roles trong high-performance applications.


## Claude


Bạn nói đúng! Đây là phần bổ sung quan trọng cho Computer Science fundamentals:


## 16. COMPUTER SCIENCE FUNDAMENTALS


### Data Structures & Algorithms


- **Arrays, Objects, Maps, Sets** - khi nào dùng structure nào
- **Linked Lists, Stacks, Queues** - implementation và use cases
- **Trees, Graphs** - traversal algorithms (DFS, BFS)
- **Hash Tables** - collision handling, performance characteristics
- **Sorting algorithms** - quicksort, mergesort, complexity analysis
- **Search algorithms** - binary search, linear search optimization
- **Dynamic Programming** - memoization patterns trong React


### Time & Space Complexity


- **Big O notation** - analyzing algorithm efficiency
- **Space-time tradeoffs** - caching vs memory usage
- **Performance analysis** - identifying bottlenecks trong React apps
- **Optimization strategies** - when to optimize và when not to


### Design Patterns


- **Creational patterns**: Factory, Singleton, Builder
- **Structural patterns**: Adapter, Decorator, Facade
- **Behavioral patterns**: Observer, Strategy, Command
- **React-specific patterns**: HOC, Render Props, Compound Components


### System Design Concepts


- **Scalability principles** - horizontal vs vertical scaling
- **Load balancing** - distributing traffic
- **Caching strategies** - browser cache, CDN, application cache
- **Database design** - relational vs NoSQL, indexing
- **Microservices architecture** - service communication patterns


### Network & Web Protocols


- **HTTP/HTTPS** - methods, status codes, headers
- **WebSockets** - real-time communication
- **REST vs GraphQL** - API design principles
- **Security protocols** - TLS/SSL, CORS, CSP
- **Performance optimization** - compression, minification, CDN


### Memory Management & Performance


- **Garbage Collection** - how JS engines manage memory
- **Memory leaks** - detection và prevention
- **Event loop** - understanding async execution
- **Browser rendering** - paint, layout, composite
- **Performance profiling** - using browser dev tools


### Software Engineering Principles


- **SOLID principles** - applying to React components
- **DRY (Don't Repeat Yourself)** - code reusability
- **KISS (Keep It Simple, Stupid)** - avoiding over-engineering
- **YAGNI (You Aren't Gonna Need It)** - feature creep prevention
- **Code quality metrics** - maintainability, readability


Đây là những kiến thức nền tảng quan trọng mà interviewer sẽ expect ở level Senior/Lead, đặc biệt khi đánh giá khả năng:


- **Problem-solving** với approach có hệ thống
- **Technical decision making** dựa trên trade-offs
- **Architecture design** cho scalable solutions
- **Performance optimization** với understanding sâu về underlying systems
- **Code review** và **mentoring** junior developers về best practices
