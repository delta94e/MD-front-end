# JavaScript Module Pattern Deep Dive

## You

Continue

## Claude


# Module Pattern trong JavaScript: Hành Trình Từ Cơ Bản Đến Chuyên Sâu - Góc Nhìn Principal Engineer


## Lời Mở Đầu: Tại Sao Module Pattern Là Nền Tảng Của Modern JavaScript?


Xin chào các bạn! Tôi là một Principal Front-end Engineer đã có hơn 10 năm kinh nghiệm làm việc tại các công ty công nghệ hàng đầu như NAB, Axon, Binance, Webflow, và Figma. Hôm nay, tôi muốn chia sẻ với các bạn một trong những khái niệm quan trọng nhất trong JavaScript modern - **Module Pattern**.


💭 **Suy nghĩ thầm lặng của tôi**: Khi tôi bắt đầu làm việc tại NAB vào năm 2015, codebase của họ vẫn đang sử dụng các script tags riêng lẻ và global variables. Mỗi lần deploy, chúng tôi phải cầu nguyện rằng không có naming conflicts. Đó là lúc tôi thực sự hiểu được tầm quan trọng của module system.


Trong bài viết này, tôi sẽ dẫn dắt các bạn từ những khái niệm cơ bản nhất về modules, đến những implementation details phức tạp mà chỉ có Principal Engineers mới cần quan tâm. Mỗi khái niệm sẽ được giải thích từ first principles, kèm theo những câu chuyện thực tế từ production environment.


---


## Phần I: FOUNDATION LEVEL - Hiểu Module Pattern Từ Gốc Rễ


### 📖 Module Pattern: Khái Niệm Cốt Lõi


#### 🌱 Nguồn Gốc & Motivation


**Problem Statement Chi Tiết:**


Hãy tưởng tượng bạn đang xây dựng một ngôi nhà. Nếu bạn đặt tất cả đồ đạc - từ giường ngủ, bàn ăn, tủ lạnh, máy giặt - vào cùng một phòng, thì sẽ ra sao? Chính xác! Sẽ rất lộn xộn, khó tìm kiếm, và các đồ vật có thể va chạm với nhau.


Trong JavaScript, trước khi có module system, chúng ta gặp phải vấn đề tương tự:


```javascript
// Trước kia, tất cả code được viết trong global scope
var userName = "Alice";
var userAge = 25;
var userEmail = "alice@example.com";

function validateEmail(email) {
  // Logic validation
}

function sendEmail(email, message) {
  // Logic gửi email
}

var productName = "iPhone";
var productPrice = 999;

function calculateTax(price) {
  // Logic tính thuế
}

// ... và hàng trăm variables/functions khác
```


**Vấn đề gì xảy ra?**


1. **Global Scope Pollution**: Tất cả variables và functions đều nằm trong global scope, tạo ra một "bãi rác" khổng lồ.
2. **Naming Conflicts**: Nếu hai developers đều tạo một function tên `validateEmail`, function sau sẽ overwrite function trước.
3. **Dependency Management**: Không có cách nào để biết function A có phụ thuộc vào function B hay không.
4. **Code Organization**: Không có cách nào để group related code together.


💭 **Debugging Mental Model của tôi**: Tại Axon, chúng tôi có một incident lớn khi hai teams cùng định nghĩa một function tên `formatCurrency`. Team A format theo USD, team B format theo EUR. Kết quả là pricing hiển thị sai trên production, khiến customers confused về giá sản phẩm.


**Historical Context:**


JavaScript được tạo ra năm 1995 bởi Brendan Eich chỉ trong 10 ngày. Lúc đó, nó chỉ được thiết kế để handle những interactions đơn giản trên web pages. Không ai nghĩ rằng JavaScript sẽ trở thành ngôn ngữ để xây dựng những applications phức tạp như Facebook, Google Maps, hay Netflix.


**Trước khi có ES2015 Modules, developers đã làm gì?**


1. **IIFE (Immediately Invoked Function Expression) Pattern**:


```javascript
var MyModule = (function() {
  var privateVariable = "Tôi là private";

  function privateFunction() {
    console.log("Tôi cũng là private");
  }

  return {
    publicMethod: function() {
      return privateVariable;
    }
  };
})();
```


1. **Namespace Pattern**:


```javascript
var MyApp = MyApp || {};
MyApp.Utils = MyApp.Utils || {};
MyApp.Utils.formatCurrency = function(amount) {
  // Implementation
};
```


1. **CommonJS (Node.js)**:


```javascript
// math.js
exports.add = function(a, b) {
  return a + b;
};

// main.js
var math = require('./math');
console.log(math.add(2, 3));
```


1. **AMD (Asynchronous Module Definition)**:


```javascript
define(['jquery', 'underscore'], function($, _) {
  return {
    doSomething: function() {
      // Implementation using $ and _
    }
  };
});
```


**Tại sao các cách cũ không đủ hiệu quả?**


- **IIFE**: Syntax phức tạp, khó maintain, không có standardized way để handle dependencies.
- **Namespace**: Vẫn pollute global scope, không có proper encapsulation.
- **CommonJS**: Synchronous loading, không phù hợp với browsers.
- **AMD**: Syntax quá verbose, learning curve cao.


#### 🔬 Bản Chất & Mechanism


**Core Algorithm Explanation:**


ES2015 Modules hoạt động dựa trên 3 nguyên tắc cốt lõi:


1. **Module Scope**: Mỗi module có scope riêng, isolated khỏi global scope.
2. **Explicit Exports**: Chỉ những gì được export mới accessible từ bên ngoài.
3. **Static Structure**: Import/export structure phải được determined tại compile time.


**Data Structure Breakdown:**


Trong V8 engine (Chrome's JavaScript engine), modules được represent như một object structure:


```
Module Record {
  environment: Lexical Environment,
  namespace: Module Namespace Object,
  exports: Export Entry Records[],
  imports: Import Entry Records[],
  dependencies: Module Record[],
  status: "uninstantiated" | "instantiating" | "instantiated" | "evaluating" | "evaluated"
}
```


**Memory Model Analysis:**


Khi bạn import một module, JavaScript engine thực hiện các bước sau:


1. **Module Loading**: Engine load source code từ file.
2. **Parsing**: Parse code thành Abstract Syntax Tree (AST).
3. **Module Record Creation**: Tạo một Module Record để track module state.
4. **Binding**: Tạo bindings cho các exported values.
5. **Evaluation**: Execute module code.


💭 **Aha moment của tôi**: Tại Binance, khi chúng tôi analyze bundle size, tôi discovered rằng modules không phải là "copied" khi được imported. Thay vào đó, chúng tạo ra live bindings. Điều này có nghĩa là nếu một exported value thay đổi trong module A, tất cả modules import nó sẽ see the updated value.


**Step-by-step Execution Flow:**


Hãy trace through một ví dụ đơn giản:


```javascript
// math.js
let counter = 0;

export function increment() {
  counter++;
  return counter;
}

export function getCounter() {
  return counter;
}

// main.js
import { increment, getCounter } from './math.js';

console.log(getCounter()); // 0
increment();
console.log(getCounter()); // 1
```


**Execution steps:**


1. **Module Graph Construction**: Engine identify tất cả dependencies và build một dependency graph.
2. **Instantiation Phase**: Tạo module environments và setup import/export bindings.
3. **Evaluation Phase**: Execute module code theo topological order.


#### 💡 Intuitive Understanding


**Real-world Analogy: Library System**


Hãy tưởng tượng một thư viện:


- **Module** = Một cuốn sách cụ thể
- **Export** = Mục lục của sách, cho biết những chapters nào có thể đọc
- **Import** = Việc mượn những chapters cụ thể từ sách
- **Module Scope** = Nội dung bên trong sách, chỉ accessible khi bạn mở sách
- **Named Export** = Một chapter cụ thể trong sách
- **Default Export** = Chapter chính, quan trọng nhất của sách


**Visual Metaphor: Apartment Building**


```
Building (Application)
├── Apartment 1 (Module A)
│   ├── Private Room (private functions/variables)
│   ├── Living Room (exported functions)
│   └── Kitchen (exported functions)
├── Apartment 2 (Module B)
│   ├── Private Room
│   └── Living Room
└── Common Area (Global Scope - should be minimal)
```


#### ⚙️ Implementation Deep Dive


**Pseudo-code Walkthrough:**


```javascript
// Browser Module Loader (simplified)
class ModuleLoader {
  constructor() {
    this.moduleMap = new Map();
    this.loadingPromises = new Map();
  }

  async importModule(specifier) {
    // Check if module already loaded
    if (this.moduleMap.has(specifier)) {
      return this.moduleMap.get(specifier).namespace;
    }

    // Check if module is currently loading
    if (this.loadingPromises.has(specifier)) {
      return await this.loadingPromises.get(specifier);
    }

    // Start loading module
    const loadingPromise = this.loadModuleInternal(specifier);
    this.loadingPromises.set(specifier, loadingPromise);

    return await loadingPromise;
  }

  async loadModuleInternal(specifier) {
    // 1. Fetch module source
    const source = await fetch(specifier).then(r => r.text());

    // 2. Parse module
    const moduleRecord = this.parseModule(source, specifier);

    // 3. Load dependencies
    await this.loadDependencies(moduleRecord);

    // 4. Instantiate module
    this.instantiateModule(moduleRecord);

    // 5. Evaluate module
    this.evaluateModule(moduleRecord);

    this.moduleMap.set(specifier, moduleRecord);
    return moduleRecord.namespace;
  }
}
```


**Browser-specific Implementations:**


Mỗi browser implement modules hơi khác nhau:


- **Chrome (V8)**: Sử dụng một sophisticated module loader với aggressive caching.
- **Firefox (SpiderMonkey)**: Focus vào memory efficiency.
- **Safari (JavaScriptCore)**: Optimize cho mobile performance.


**Performance Characteristics:**


- **Time Complexity**: O(n) where n là number of modules trong dependency graph.
- **Space Complexity**: O(m) where m là total size của tất cả modules.
- **Loading**: Modules có thể được loaded parallel nếu chúng không có circular dependencies.


### 📖 Export Mechanisms: Named vs Default


#### 🌱 Nguồn Gốc & Motivation của Export Systems


**Tại sao cần có hai loại exports?**


Câu chuyện bắt đầu từ những ngày đầu của CommonJS. Trong Node.js, bạn có thể export theo hai cách:


```javascript
// Cách 1: Export multiple things
exports.add = function(a, b) { return a + b; };
exports.subtract = function(a, b) { return a - b; };

// Cách 2: Export one main thing
module.exports = function calculator() {
  // Main calculator logic
};
```


ES2015 modules học hỏi từ pattern này và formalize thành **named exports** và **default exports**.


💭 **Insight từ Webflow**: Khi chúng tôi design component library tại Webflow, chúng tôi realized rằng có hai use cases chính:


1. Utility modules (như math, string helpers) thường có nhiều related functions → Named exports
2. Component modules thường có một main component → Default export


#### 🔬 Bản Chất & Mechanism


**Named Exports - Core Algorithm:**


```javascript
// Compilation time analysis
// math.js
export function add(x, y) {  // Named export declaration
  return x + y;
}

export const PI = 3.14159;   // Named export declaration

const helper = function() {   // Private function
  return "helper";
};

export { helper };           // Named export (export list)
```


**Trong AST (Abstract Syntax Tree), điều này trở thành:**


```
ExportNamedDeclaration {
  declaration: FunctionDeclaration {
    id: Identifier { name: "add" },
    params: [Identifier { name: "x" }, Identifier { name: "y" }],
    body: BlockStatement { ... }
  },
  specifiers: [],
  source: null
}
```


**Default Exports - Core Algorithm:**


```javascript
// Default export có thể là expression hoặc declaration
export default function calculator() {  // Default export declaration
  return "main calculator";
}

// Hoặc
const mainCalculator = function() {
  return "main calculator";
};
export default mainCalculator;          // Default export (export default)
```


**Memory Model cho Exports:**


Khi engine process exports, nó tạo ra một **Export Record**:


```javascript
ExportRecord {
  [[ModuleRequest]]: null,
  [[ImportName]]: "add",
  [[LocalName]]: "add",
  [[ExportName]]: "add"
}
```


Đối với default exports:


```javascript
ExportRecord {
  [[ModuleRequest]]: null,
  [[ImportName]]: null,
  [[LocalName]]: "calculator",
  [[ExportName]]: "default"
}
```


#### 💡 Intuitive Understanding


**Restaurant Menu Analogy:**


- **Named Exports** = À la carte menu: Bạn có thể order từng món riêng lẻ
javascriptimport { appetizer, mainCourse, dessert } from './menu';
- **Default Export** = Chef's special: Món đặc biệt của nhà hàng, main attraction
javascriptimport specialDish from './menu';


**Library Analogy:**


- **Named Exports** = Individual chapters của một textbook
- **Default Export** = Main thesis của entire book


#### ⚙️ Implementation Deep Dive


**Export Binding Creation:**


```javascript
// Engine tạo ra bindings như thế này:
function createExportBinding(moduleName, exportName, localName) {
  const module = getModule(moduleName);
  const binding = {
    module: module,
    localName: localName,
    exportName: exportName,
    value: undefined,  // Will be set during evaluation
    mutable: true     // Exports create live bindings
  };

  module.exports.set(exportName, binding);
  return binding;
}
```


**Live Binding Mechanism:**


Đây là một trong những tính năng quan trọng nhất của ES modules:


```javascript
// counter.js
let count = 0;

export function increment() {
  count++;
}

export function getCount() {
  return count;
}

// main.js
import { increment, getCount } from './counter.js';

console.log(getCount()); // 0
increment();
console.log(getCount()); // 1 - Live binding!
```


**Browser Implementation Details:**


Chrome's V8 implementation:


```cpp
// Simplified C++ pseudocode
class ModuleNamespace {
  private:
    std::map<std::string, Handle<Object>> bindings_;

  public:
    Handle<Object> Get(const std::string& name) {
      auto binding = bindings_.find(name);
      if (binding != bindings_.end()) {
        return binding->second->GetValue();  // Live binding lookup
      }
      return Handle<Object>::null();
    }
};
```


### 📖 Import Mechanisms: Static vs Dynamic


#### 🌱 Nguồn Gốc & Motivation


**Static Imports - Tại sao "static"?**


"Static" có nghĩa là import structure phải được determined tại **compile time**, không phải runtime:


```javascript
// ✅ Valid - static structure
import { add } from './math.js';

// ❌ Invalid - dynamic structure
const moduleName = './math.js';
import { add } from moduleName;  // SyntaxError!

// ❌ Invalid - conditional import
if (someCondition) {
  import { add } from './math.js';  // SyntaxError!
}
```


**Tại sao cần static structure?**


1. **Tree Shaking**: Bundlers có thể analyze code và remove unused exports.
2. **Circular Dependency Detection**: Engine có thể detect circular deps trước khi run code.
3. **Performance**: Module graph có thể được built và optimized ahead of time.


💭 **Production Story từ Figma**: Tại Figma, chúng tôi có một codebase khổng lồ với hàng ngàn components. Static imports cho phép webpack analyze dependency graph và tạo ra optimized chunks. Điều này crucial cho performance vì users chỉ load những modules mà họ thực sự cần.


**Dynamic Imports - Tại sao cần "dynamic"?**


Nhưng đôi khi, chúng ta cần load modules based on runtime conditions:


```javascript
// Load module based on user action
button.addEventListener('click', async () => {
  const { heavyFeature } = await import('./heavy-feature.js');
  heavyFeature();
});

// Load module based on environment
const envModule = await import(`./config/${process.env.NODE_ENV}.js`);
```


#### 🔬 Bản Chất & Mechanism


**Static Import Algorithm:**


1. **Parsing Phase**: Engine scan tất cả import statements và build module graph.
2. **Module Resolution**: Resolve module specifiers thành actual file paths.
3. **Loading Phase**: Load tất cả modules trong graph.
4. **Linking Phase**: Setup bindings giữa imports và exports.
5. **Evaluation Phase**: Execute module code.


**Dynamic Import Algorithm:**


Dynamic imports return một Promise và trigger module loading at runtime:


```javascript
// Pseudo-implementation của import()
function dynamicImport(specifier) {
  return new Promise((resolve, reject) => {
    // 1. Resolve module specifier
    const resolvedSpecifier = resolveModuleSpecifier(specifier);

    // 2. Check if module already loaded
    if (moduleCache.has(resolvedSpecifier)) {
      resolve(moduleCache.get(resolvedSpecifier).namespace);
      return;
    }

    // 3. Load module asynchronously
    loadModuleAsync(resolvedSpecifier)
      .then(moduleRecord => {
        resolve(moduleRecord.namespace);
      })
      .catch(reject);
  });
}
```


**Memory Model Differences:**


Static imports tạo ra **immutable bindings** tại module instantiation:


```javascript
// Static import binding
ImportBinding {
  module: ModuleRecord,
  importName: "add",
  localName: "add",
  readonly: true  // Cannot be reassigned
}
```


Dynamic imports return một **namespace object**:


```javascript
// Dynamic import result
NamespaceObject {
  @@toStringTag: "Module",
  default: function() { ... },
  namedExport1: value1,
  namedExport2: value2,
  // ...
}
```


#### 💡 Intuitive Understanding


**Restaurant Analogy:**


**Static Imports** = Making a reservation:


- Bạn phải decide trước menu items khi book
- Restaurant có thể prepare ingredients ahead of time
- Efficient nhưng không flexible


**Dynamic Imports** = Walk-in dining:


- Bạn decide menu khi arrive
- Restaurant prepare food on-demand
- Flexible nhưng có thể slower


**Library Analogy:**


- **Static Imports** = Required textbooks cho course (known trước semester)
- **Dynamic Imports** = Reference books mượn từ library khi cần (on-demand)


#### ⚙️ Implementation Deep Dive


**Static Import Optimization:**


Modern bundlers như webpack, Rollup implement sophisticated optimizations:


```javascript
// Tree shaking example
// math.js
export function add(a, b) { return a + b; }
export function subtract(a, b) { return a - b; }
export function multiply(a, b) { return a * b; }  // Unused
export function divide(a, b) { return a / b; }    // Unused

// main.js
import { add, subtract } from './math.js';

// Bundler output (simplified):
function add(a, b) { return a + b; }
function subtract(a, b) { return a - b; }
// multiply và divide được removed!
```


**Dynamic Import with Code Splitting:**


```javascript
// Webpack automatically creates separate chunks for dynamic imports
async function loadFeature() {
  // This creates a separate bundle chunk
  const { default: HeavyComponent } = await import('./HeavyComponent.js');
  return HeavyComponent;
}

// Webpack output (simplified):
// main.bundle.js - contains main app code
// 1.chunk.js - contains HeavyComponent code
```


**Performance Characteristics:**


```
AspectStatic ImportsDynamic ImportsBundle SizeSmaller (tree shaking)Larger (less optimization)Initial Load TimeSlower (load everything)Faster (load on demand)Runtime PerformanceFaster (pre-loaded)Slower (async loading)Browser CachingBetter (fewer requests)Good (granular caching)
```


### 📖 Module Scope & Encapsulation


#### 🌱 Nguồn Gốc & Motivation


**Problem với Global Scope:**


Trước modules, JavaScript chỉ có **global scope** và **function scope**:


```javascript
// All these pollute global scope
var globalVariable = "I'm global!";
function globalFunction() {
  return "I'm also global!";
}

// Even trong IIFE, variables leak nếu không careful
(function() {
  undeclaredVariable = "I accidentally became global!";
})();

console.log(window.undeclaredVariable); // "I accidentally became global!"
```


💭 **Real incident tại NAB**: Chúng tôi có một bug nghiêm trọng trong payment system. Một developer accidentally overwrite một global utility function `formatAmount`. Thay vì format currency với 2 decimal places, nó format với 0 decimal places. Customers bị charge sai amount trong vài hours trước khi chúng tôi catch được issue.


**Module Scope giải quyết vấn đề này:**


```javascript
// math.js - Module scope
const privateConstant = 3.14159;  // Chỉ accessible trong module
let privateVariable = 0;          // Private to module

function privateHelper() {         // Private function
  return privateConstant * 2;
}

export function publicFunction() { // Only this is accessible outside
  return privateHelper() + privateVariable;
}

// Trong module khác
import { publicFunction } from './math.js';
console.log(publicFunction());      // ✅ Works
console.log(privateConstant);       // ❌ ReferenceError
```


#### 🔬 Bản Chất & Mechanism


**Lexical Environment Creation:**


Khi engine load một module, nó tạo ra một **Module Environment Record**:


```javascript
ModuleEnvironmentRecord {
  // Outer lexical environment (null for modules)
  [[OuterEnv]]: null,

  // Environment record để store bindings
  [[EnvironmentRecord]]: {
    privateConstant: { value: 3.14159, mutable: false },
    privateVariable: { value: 0, mutable: true },
    privateHelper: { value: function() {...}, mutable: false },
    publicFunction: { value: function() {...}, mutable: false }
  },

  // This binding (undefined in modules - strict mode)
  [[ThisBinding]]: undefined
}
```


**Scope Chain trong Modules:**


```javascript
// math.js
const moduleLevel = "I'm at module level";

export function outer() {
  const outerLevel = "I'm in outer function";

  function inner() {
    const innerLevel = "I'm in inner function";

    // Scope chain: inner -> outer -> module -> null
    console.log(innerLevel);   // ✅ Found in inner scope
    console.log(outerLevel);   // ✅ Found in outer scope
    console.log(moduleLevel);  // ✅ Found in module scope
    console.log(globalVar);    // ❌ ReferenceError (no global scope access)
  }

  return inner;
}
```


**Module Strict Mode:**


Tất cả modules automatically run trong strict mode:


```javascript
// math.js - automatically strict mode
function example() {
  // this === undefined (not global object)
  console.log(this); // undefined

  // Undeclared variables throw ReferenceError
  undeclaredVar = "error"; // ReferenceError in strict mode
}
```


#### 💡 Intuitive Understanding


**House Analogy:**


```
Module = Private House
├── Private Rooms (private variables/functions)
│   ├── Bedroom (internal state)
│   ├── Private Study (helper functions)
│   └── Storage (constants, configs)
├── Living Room (exported functions)
│   └── Windows/Doors (export statements)
└── Front Door (import statements)
```


Visitors (other modules) chỉ có thể access living room through front door. Họ không thể access private rooms.


**Company Department Analogy:**


```
Module = Company Department
├── Internal Operations (private functions)
├── Department Secrets (private variables)
├── Public API (exported functions)
└── Department Head (default export)
```


Other departments chỉ có thể interact through official channels (exports), không thể access internal operations.


#### ⚙️ Implementation Deep Dive


**Variable Hoisting trong Modules:**


```javascript
// Module hoisting behavior
console.log(hoistedFunction); // ✅ Function declaration hoisted
console.log(hoistedVar);       // ❌ ReferenceError: Cannot access before initialization
console.log(hoistedLet);       // ❌ ReferenceError: Cannot access before initialization

var hoistedVar = "I'm hoisted but undefined initially";
let hoistedLet = "I'm in temporal dead zone";

function hoistedFunction() {
  return "I'm fully hoisted";
}
```


**Export Binding Setup:**


Engine setup export bindings during module instantiation:


```javascript
// Simplified binding setup
function setupModuleBindings(moduleRecord) {
  const environment = moduleRecord.environment;

  // Setup export bindings
  for (const exportEntry of moduleRecord.localExportEntries) {
    const localBinding = environment.getBinding(exportEntry.localName);
    const exportBinding = createExportBinding(exportEntry.exportName, localBinding);
    moduleRecord.namespace.set(exportEntry.exportName, exportBinding);
  }

  // Setup import bindings
  for (const importEntry of moduleRecord.importEntries) {
    const importedModule = moduleRecord.requestedModules.get(importEntry.moduleRequest);
    const importedBinding = importedModule.namespace.get(importEntry.importName);
    environment.createImportBinding(importEntry.localName, importedBinding);
  }
}
```


**Circular Dependency Handling:**


```javascript
// a.js
import { b } from './b.js';
export const a = 'a';
console.log('a.js:', b);

// b.js
import { a } from './a.js';
export const b = 'b';
console.log('b.js:', a);

// main.js
import './a.js';

// Execution output:
// b.js: undefined  (a chưa được initialized)
// a.js: b
```


Engine handle circular dependencies bằng cách:


1. Tạo module records cho tất cả modules
2. Setup bindings (nhưng chưa initialize values)
3. Evaluate modules theo topological order
4. Bindings được update as values become available


---


## Phần II: SENIOR LEVEL - Advanced Module Patterns


### 📖 Advanced Export/Import Patterns


#### 🌱 Export Aggregation & Re-exports


**Problem Statement:**


Trong large applications, bạn thường muốn create "barrel exports" - modules that aggregate exports từ multiple modules:


```javascript
// Without barrel exports
import { Button } from './components/Button.js';
import { Input } from './components/Input.js';
import { Modal } from './components/Modal.js';
import { Tooltip } from './components/Tooltip.js';
import { Dropdown } from './components/Dropdown.js';
// ... 20 more imports

// With barrel exports
import { Button, Input, Modal, Tooltip, Dropdown } from './components/index.js';
```


💭 **Real-world experience tại Figma**: Chúng tôi có component library với hơn 200 components. Việc import từng component riêng lẻ trở nên nightmare. Barrel exports giúp chúng tôi organize imports much cleaner.


**Re-export Syntax:**


```javascript
// components/index.js - Barrel export file

// Method 1: Import then export
import { Button } from './Button.js';
import { Input } from './Input.js';
export { Button, Input };

// Method 2: Direct re-export (more efficient)
export { Button } from './Button.js';
export { Input } from './Input.js';

// Method 3: Re-export with rename
export { Button as PrimaryButton } from './Button.js';
export { Input as TextInput } from './Input.js';

// Method 4: Re-export all named exports
export * from './Button.js';
export * from './Input.js';

// Method 5: Re-export default as named
export { default as Button } from './Button.js';
```


**Advanced Re-export Patterns:**


```javascript
// Advanced barrel with selective exports
export {
  // Core components
  Button,
  Input,
  Modal
} from './core/index.js';

export {
  // Chart components
  LineChart,
  BarChart,
  PieChart
} from './charts/index.js';

// Conditional exports based on environment
if (process.env.NODE_ENV === 'development') {
  export { DebugPanel } from './debug/DebugPanel.js';
}

// Re-export with type information (TypeScript)
export type { ButtonProps } from './Button.js';
export type { InputProps } from './Input.js';
```


#### 🔬 Core Mechanism của Re-exports


**Engine Processing:**


Khi engine encounter re-export statements, nó:


1. **Resolution Phase**: Resolve target module specifier
2. **Loading Phase**: Load target module if not already loaded
3. **Binding Creation**: Create new export bindings that point to imported bindings
4. **Namespace Update**: Update current module's namespace


**Performance Implications:**


```javascript
// Less efficient - creates intermediate bindings
import { Button } from './Button.js';
export { Button };

// More efficient - direct binding
export { Button } from './Button.js';
```


Direct re-exports avoid creating intermediate bindings trong current module scope.


#### ⚙️ Tree Shaking với Barrel Exports


**Problem với Naive Barrel Exports:**


```javascript
// components/index.js
export { Button } from './Button.js';
export { Modal } from './Modal.js';        // Large component
export { DataTable } from './DataTable.js'; // Very large component

// main.js
import { Button } from './components/index.js';

// Bundler might still include Modal và DataTable code!
```


**Solution: Proper Barrel Structure:**


```javascript
// components/index.js
// Separate heavy components
export { Button } from './Button.js';
export { Input } from './Input.js';

// Heavy components in separate barrels
export { Modal } from './heavy/Modal.js';
export { DataTable } from './heavy/DataTable.js';

// Or use dynamic imports for heavy components
export const Modal = () => import('./heavy/Modal.js');
export const DataTable = () => import('./heavy/DataTable.js');
```


#### 💭 Production Experience: Module Federation


**Tại Webflow**: Chúng tôi sử dụng Webpack Module Federation để share components between micro-frontends:


```javascript
// webpack.config.js
module.exports = {
  mode: 'development',
  plugins: [
    new ModuleFederationPlugin({
      name: 'design_system',
      filename: 'remoteEntry.js',
      exposes: {
        './Button': './src/components/Button.js',
        './Input': './src/components/Input.js',
      },
    }),
  ],
};

// Consumer application
const Button = React.lazy(() => import('design_system/Button'));
```


### 📖 Dynamic Import Advanced Patterns


#### 🌱 Conditional Loading & Code Splitting


**Route-based Code Splitting:**


```javascript
// React Router với dynamic imports
const Home = React.lazy(() => import('./pages/Home.js'));
const About = React.lazy(() => import('./pages/About.js'));
const Dashboard = React.lazy(() =>
  import(/* webpackChunkName: "dashboard" */ './pages/Dashboard.js')
);

function App() {
  return (
    <Router>
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </Suspense>
    </Router>
  );
}
```


**Feature-based Loading:**


```javascript
// Load features based on user permissions
async function loadUserFeatures(userPermissions) {
  const features = [];

  if (userPermissions.includes('admin')) {
    const { AdminPanel } = await import('./features/AdminPanel.js');
    features.push(AdminPanel);
  }

  if (userPermissions.includes('analytics')) {
    const { AnalyticsDashboard } = await import('./features/Analytics.js');
    features.push(AnalyticsDashboard);
  }

  return features;
}
```


**Polyfill Loading:**


```javascript
// Load polyfills only when needed
async function loadPolyfills() {
  const promises = [];

  if (!window.IntersectionObserver) {
    promises.push(import('intersection-observer'));
  }

  if (!window.ResizeObserver) {
    promises.push(import('resize-observer-polyfill'));
  }

  if (!Array.prototype.includes) {
    promises.push(import('array-includes'));
  }

  await Promise.all(promises);
}
```


#### 🔬 Dynamic Import Implementation Details


**Module Loading State Machine:**


```javascript
class DynamicModuleLoader {
  constructor() {
    this.loadingStates = new Map();
    this.loadingPromises = new Map();
  }

  async import(specifier) {
    // Check current state
    const state = this.loadingStates.get(specifier) || 'unloaded';

    switch (state) {
      case 'unloaded':
        return this.startLoading(specifier);
      case 'loading':
        return this.loadingPromises.get(specifier);
      case 'loaded':
        return this.getModule(specifier);
      case 'error':
        throw new Error(`Failed to load module: ${specifier}`);
    }
  }

  async startLoading(specifier) {
    this.loadingStates.set(specifier, 'loading');

    const loadingPromise = this.loadModule(specifier)
      .then(module => {
        this.loadingStates.set(specifier, 'loaded');
        return module;
      })
      .catch(error => {
        this.loadingStates.set(specifier, 'error');
        throw error;
      });

    this.loadingPromises.set(specifier, loadingPromise);
    return loadingPromise;
  }
}
```


**Error Handling Strategies:**


```javascript
async function robustDynamicImport(specifier, fallback = null) {
  try {
    return await import(specifier);
  } catch (error) {
    console.error(`Failed to load ${specifier}:`, error);

    if (fallback) {
      console.log(`Loading fallback: ${fallback}`);
      try {
        return await import(fallback);
      } catch (fallbackError) {
        console.error(`Fallback also failed:`, fallbackError);
      }
    }

    // Return empty module as last resort
    return { default: () => null };
  }
}

// Usage
const component = await robustDynamicImport(
  './HeavyComponent.js',
  './LightweightFallback.js'
);
```


#### 💡 Performance Optimization Patterns


**Preloading Strategies:**


```javascript
class PreloadManager {
  constructor() {
    this.preloadPromises = new Map();
  }

  // Preload during idle time
  preloadOnIdle(specifier, timeout = 5000) {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        this.preload(specifier);
      }, { timeout });
    } else {
      setTimeout(() => this.preload(specifier), 100);
    }
  }

  // Preload on hover (for navigation links)
  preloadOnHover(element, specifier) {
    let preloaded = false;

    element.addEventListener('mouseenter', () => {
      if (!preloaded) {
        this.preload(specifier);
        preloaded = true;
      }
    });
  }

  // Preload based on viewport intersection
  preloadOnVisible(element, specifier) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.preload(specifier);
          observer.unobserve(element);
        }
      });
    });

    observer.observe(element);
  }

  async preload(specifier) {
    if (!this.preloadPromises.has(specifier)) {
      const promise = import(specifier);
      this.preloadPromises.set(specifier, promise);
    }
    return this.preloadPromises.get(specifier);
  }
}
```


💭 **Real optimization tại Binance**: Chúng tôi implement preloading cho trading interface. Khi user hover over "Advanced Trading" button, chúng tôi bắt đầu preload heavy trading components. Điều này reduce perceived loading time từ 2.3s xuống 0.8s.


### 📖 Module Pattern trong React Ecosystem


#### 🌱 Component Module Organization


**Component Module Structure:**


```javascript
// Button/index.js - Main export file
export { default } from './Button.js';
export { ButtonGroup } from './ButtonGroup.js';
export type { ButtonProps, ButtonGroupProps } from './Button.types.js';

// Button/Button.js - Main component
import React from 'react';
import { ButtonProps } from './Button.types.js';
import { useButtonStyles } from './Button.hooks.js';
import './Button.styles.css';

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'medium', children, ...props }, ref) => {
    const styles = useButtonStyles({ variant, size });

    return (
      <button ref={ref} className={styles} {...props}>
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;

// Button/Button.hooks.js - Custom hooks
import { useMemo } from 'react';

export function useButtonStyles({ variant, size }) {
  return useMemo(() => {
    return `btn btn--${variant} btn--${size}`;
  }, [variant, size]);
}

// Button/Button.types.js - TypeScript types
export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  children: React.ReactNode;
}
```


**Compound Component Pattern:**


```javascript
// Modal/index.js
export { default } from './Modal.js';

// Modal/Modal.js
import React, { createContext, useContext } from 'react';
import { ModalHeader } from './ModalHeader.js';
import { ModalBody } from './ModalBody.js';
import { ModalFooter } from './ModalFooter.js';

const ModalContext = createContext();

function Modal({ isOpen, onClose, children }) {
  const value = { isOpen, onClose };

  return (
    <ModalContext.Provider value={value}>
      {isOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            {children}
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
}

// Attach sub-components
Modal.Header = ModalHeader;
Modal.Body = ModalBody;
Modal.Footer = ModalFooter;

export default Modal;

// Usage
<Modal isOpen={isOpen} onClose={handleClose}>
  <Modal.Header>Title</Modal.Header>
  <Modal.Body>Content</Modal.Body>
  <Modal.Footer>Actions</Modal.Footer>
</Modal>
```


#### 🔬 React Module Loading Strategies


**Lazy Loading với Suspense:**


```javascript
// App.js
import React, { Suspense } from 'react';
import ErrorBoundary from './ErrorBoundary.js';

// Lazy load components
const Dashboard = React.lazy(() => import('./Dashboard/index.js'));
const Reports = React.lazy(() => import('./Reports/index.js'));
const Settings = React.lazy(() =>
  import('./Settings/index.js').catch(() => ({
    default: () => <div>Failed to load Settings</div>
  }))
);

function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingSpinner />}>
        <Router>
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Router>
      </Suspense>
    </ErrorBoundary>
  );
}
```


**Context-based Module System:**


```javascript
// modules/ModuleProvider.js
import React, { createContext, useContext, useState, useEffect } from 'react';

const ModuleContext = createContext();

export function ModuleProvider({ children }) {
  const [loadedModules, setLoadedModules] = useState(new Map());
  const [loadingModules, setLoadingModules] = useState(new Set());

  const loadModule = async (moduleId, importFn) => {
    if (loadedModules.has(moduleId)) {
      return loadedModules.get(moduleId);
    }

    if (loadingModules.has(moduleId)) {
      // Wait for existing loading promise
      while (loadingModules.has(moduleId)) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      return loadedModules.get(moduleId);
    }

    setLoadingModules(prev => new Set(prev).add(moduleId));

    try {
      const module = await importFn();
      setLoadedModules(prev => new Map(prev).set(moduleId, module));
      return module;
    } finally {
      setLoadingModules(prev => {
        const newSet = new Set(prev);
        newSet.delete(moduleId);
        return newSet;
      });
    }
  };

  const value = {
    loadedModules,
    loadingModules,
    loadModule
  };

  return (
    <ModuleContext.Provider value={value}>
      {children}
    </ModuleContext.Provider>
  );
}

export function useModule(moduleId, importFn) {
  const { loadModule, loadedModules, loadingModules } = useContext(ModuleContext);
  const [module, setModule] = useState(() => loadedModules.get(moduleId));
  const [loading, setLoading] = useState(() => loadingModules.has(moduleId));

  useEffect(() => {
    if (!module && !loading) {
      setLoading(true);
      loadModule(moduleId, importFn).then(loadedModule => {
        setModule(loadedModule);
        setLoading(false);
      });
    }
  }, [moduleId, importFn, module, loading, loadModule]);

  return { module, loading };
}
```


#### ⚙️ Advanced React Module Patterns


**Higher-Order Component Factory:**


```javascript
// hoc/withDynamicModule.js
export function withDynamicModule(importFn, fallback = null) {
  return function(WrappedComponent) {
    function DynamicModuleComponent(props) {
      const { module, loading } = useModule(importFn.name, importFn);

      if (loading) {
        return fallback || <div>Loading module...</div>;
      }

      if (!module) {
        return <div>Failed to load module</div>;
      }

      return <WrappedComponent {...props} module={module} />;
    }

    DynamicModuleComponent.displayName =
      `withDynamicModule(${WrappedComponent.displayName || WrappedComponent.name})`;

    return DynamicModuleComponent;
  };
}

// Usage
const EnhancedChart = withDynamicModule(
  () => import('./ChartModule.js'),
  <ChartSkeleton />
)(Chart);
```


💭 **Architecture Decision tại Webflow**: Chúng tôi sử dụng pattern này để load chart libraries only when users access analytics features. Điều này reduce main bundle size từ 2.3MB xuống 1.1MB.


---


## Phần III: PRINCIPAL LEVEL - Architecture & Performance


### 📖 Module Bundling & Build Optimization


#### 🌱 Understanding Build Pipeline Architecture


**The Complete Build Pipeline:**


Khi bạn run `npm run build`, rất nhiều thứ xảy ra behind the scenes:


```
Source Code → Parsing → Dependency Graph → Bundling → Optimization → Output
```


**Detailed Pipeline Breakdown:**


1. **Entry Point Analysis**: Bundler bắt đầu từ entry point và discover dependencies
2. **Module Resolution**: Resolve import paths thành actual file paths
3. **Dependency Graph Construction**: Build complete dependency graph
4. **Module Loading**: Load và parse tất cả modules
5. **Code Transformation**: Apply loaders (TypeScript, Babel, etc.)
6. **Bundling**: Combine modules thành bundles
7. **Optimization**: Minification, tree shaking, code splitting
8. **Asset Generation**: Generate final assets với hashes


💭 **Real complexity tại Figma**: Figma codebase có hơn 50,000 files. Build pipeline phải process dependency graph với 200,000+ edges. Chúng tôi optimize bằng cách implement incremental builds và persistent caching, reducing build time từ 15 minutes xuống 2 minutes.


#### 🔬 Webpack Module System Deep Dive


**Webpack Module Representation:**


```javascript
// Webpack wraps modules trong functions
function __webpack_require__(moduleId) {
  // Check if module is in cache
  if(__webpack_module_cache__[moduleId]) {
    return __webpack_module_cache__[moduleId].exports;
  }

  // Create new module và add to cache
  var module = __webpack_module_cache__[moduleId] = {
    id: moduleId,
    loaded: false,
    exports: {}
  };

  // Execute module function
  __webpack_modules__[moduleId].call(
    module.exports,
    module,
    module.exports,
    __webpack_require__
  );

  // Mark module as loaded
  module.loaded = true;

  return module.exports;
}
```


**Module Registry:**


```javascript
var __webpack_modules__ = {
  "./src/math.js": function(module, exports, __webpack_require__) {
    "use strict";

    function add(a, b) {
      return a + b;
    }

    function subtract(a, b) {
      return a - b;
    }

    // Export functions
    exports.add = add;
    exports.subtract = subtract;
  },

  "./src/main.js": function(module, exports, __webpack_require__) {
    "use strict";

    var math = __webpack_require__("./src/math.js");

    console.log(math.add(2, 3));
  }
};
```


#### ⚙️ Advanced Optimization Techniques


**Tree Shaking Deep Dive:**


Tree shaking relies trên **static analysis** của ES modules:


```javascript
// math.js
export function add(a, b) { return a + b; }        // Used
export function subtract(a, b) { return a - b; }   // Used
export function multiply(a, b) { return a * b; }   // Dead code
export function divide(a, b) { return a / b; }     // Dead code

// main.js
import { add, subtract } from './math.js';

console.log(add(2, 3));
console.log(subtract(5, 2));
```


**Webpack Analysis:**


```javascript
// Webpack builds dependency graph
DependencyGraph {
  "./src/main.js": {
    dependencies: ["./src/math.js"],
    usedExports: ["add", "subtract"]
  },
  "./src/math.js": {
    dependencies: [],
    exports: ["add", "subtract", "multiply", "divide"],
    usedExports: ["add", "subtract"]  // multiply, divide will be removed
  }
}
```


**Side Effect Analysis:**


```javascript
// package.json
{
  "name": "my-lib",
  "sideEffects": false  // This package has no side effects
}

// Or specify files with side effects
{
  "sideEffects": [
    "*.css",
    "./src/polyfills.js"
  ]
}
```


**Code Splitting Strategies:**


```javascript
// webpack.config.js
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        // Vendor libraries
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },

        // Common code shared across multiple chunks
        common: {
          name: 'common',
          minChunks: 2,
          chunks: 'all',
          enforce: true
        },

        // React-specific chunks
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
          name: 'react',
          chunks: 'all',
        }
      }
    }
  }
};
```


#### 💡 Performance Monitoring & Optimization


**Bundle Analysis Tools:**


```javascript
// webpack-bundle-analyzer integration
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
  plugins: [
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      openAnalyzer: false,
      reportFilename: 'bundle-report.html'
    })
  ]
};
```


**Custom Bundle Analysis:**


```javascript
class BundleSizeTracker {
  constructor() {
    this.sizeHistory = [];
    this.threshold = 1024 * 1024; // 1MB threshold
  }

  apply(compiler) {
    compiler.hooks.done.tap('BundleSizeTracker', (stats) => {
      const assets = stats.toJson().assets;

      assets.forEach(asset => {
        if (asset.size > this.threshold) {
          console.warn(`⚠️  Large bundle detected: ${asset.name} (${this.formatSize(asset.size)})`);
        }

        this.trackSizeChange(asset);
      });
    });
  }

  trackSizeChange(asset) {
    const previous = this.sizeHistory.find(h => h.name === asset.name);

    if (previous) {
      const change = asset.size - previous.size;
      const percentChange = (change / previous.size) * 100;

      if (Math.abs(percentChange) > 10) {
        console.log(`📊 Size change for ${asset.name}: ${this.formatChange(change)} (${percentChange.toFixed(1)}%)`);
      }
    }

    this.sizeHistory = this.sizeHistory.filter(h => h.name !== asset.name);
    this.sizeHistory.push({ name: asset.name, size: asset.size });
  }
}
```


### 📖 Performance Optimization Strategies


#### 🌱 Core Web Vitals & Module Loading


**Largest Contentful Paint (LCP) Optimization:**


```javascript
// Critical resource preloading
function preloadCriticalModules() {
  const criticalModules = [
    '/chunks/homepage-hero.js',
    '/chunks/navigation.js',
    '/chunks/critical-styles.css'
  ];

  criticalModules.forEach(module => {
    const link = document.createElement('link');
    link.rel = 'modulepreload';  // Specifically for ES modules
    link.href = module;
    document.head.appendChild(link);
  });
}

// Call during initial page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', preloadCriticalModules);
} else {
  preloadCriticalModules();
}
```


**First Input Delay (FID) Optimization:**


```javascript
// Defer non-critical module loading
class DeferredModuleLoader {
  constructor() {
    this.deferredModules = new Map();
    this.isIdle = false;
    this.setupIdleDetection();
  }

  setupIdleDetection() {
    // Wait for main thread to be idle
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        this.isIdle = true;
        this.processDeferredModules();
      });
    } else {
      setTimeout(() => {
        this.isIdle = true;
        this.processDeferredModules();
      }, 2000);
    }
  }

  defer(moduleId, importFn) {
    this.deferredModules.set(moduleId, importFn);

    if (this.isIdle) {
      this.loadModule(moduleId);
    }
  }

  async processDeferredModules() {
    for (const [moduleId] of this.deferredModules) {
      await this.loadModule(moduleId);
      // Yield to main thread
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }

  async loadModule(moduleId) {
    const importFn = this.deferredModules.get(moduleId);
    if (importFn) {
      try {
        await importFn();
        this.deferredModules.delete(moduleId);
      } catch (error) {
        console.error(`Failed to load deferred module ${moduleId}:`, error);
      }
    }
  }
}

// Usage
const deferredLoader = new DeferredModuleLoader();

// Defer analytics loading
deferredLoader.defer('analytics', () => import('./analytics.js'));

// Defer non-critical features
deferredLoader.defer('tooltip', () => import('./tooltip.js'));
```


#### 🔬 Memory Management & Module Lifecycle


**Module Memory Tracking:**


```javascript
class ModuleMemoryTracker {
  constructor() {
    this.moduleRegistry = new Map();
    this.memorySnapshots = [];
    this.setupPerformanceObserver();
  }

  setupPerformanceObserver() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'measure' && entry.name.startsWith('module-')) {
            this.recordModuleMetrics(entry);
          }
        }
      });

      observer.observe({ entryTypes: ['measure'] });
    }
  }

  registerModule(moduleId, moduleExports) {
    this.moduleRegistry.set(moduleId, {
      id: moduleId,
      loadTime: performance.now(),
      exports: moduleExports,
      memoryUsage: this.estimateMemoryUsage(moduleExports)
    });

    // Take memory snapshot
    this.takeMemorySnapshot(moduleId);
  }

  estimateMemoryUsage(obj) {
    // Rough estimation of memory usage
    const seen = new WeakSet();

    function calculateSize(obj) {
      if (obj === null || typeof obj !== 'object') {
        return 8; // Primitive values
      }

      if (seen.has(obj)) {
        return 0; // Avoid circular references
      }

      seen.add(obj);

      let size = 0;
      for (const key in obj) {
        size += calculateSize(obj[key]);
        size += key.length * 2; // String key overhead
      }

      return size;
    }

    return calculateSize(obj);
  }

  takeMemorySnapshot(moduleId) {
    if ('memory' in performance) {
      this.memorySnapshots.push({
        moduleId,
        timestamp: performance.now(),
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize
      });
    }
  }

  analyzeMemoryLeaks() {
    const recentSnapshots = this.memorySnapshots.slice(-10);
    const memoryGrowth = recentSnapshots[recentSnapshots.length - 1].usedJSHeapSize -
                        recentSnapshots[0].usedJSHeapSize;

    if (memoryGrowth > 10 * 1024 * 1024) { // 10MB growth
      console.warn('🚨 Potential memory leak detected:', {
        growth: `${(memoryGrowth / 1024 / 1024).toFixed(2)}MB`,
        snapshots: recentSnapshots
      });
    }
  }
}
```


**Module Garbage Collection:**


```javascript
class ModuleGarbageCollector {
  constructor() {
    this.moduleWeakMap = new WeakMap();
    this.moduleRefs = new Map();
    this.cleanupCallbacks = new Map();
  }

  trackModule(moduleId, moduleExports, cleanupFn) {
    // Use WeakMap to avoid preventing GC
    this.moduleWeakMap.set(moduleExports, moduleId);

    // Track references
    this.moduleRefs.set(moduleId, {
      exports: moduleExports,
      refCount: 0,
      lastAccessed: Date.now()
    });

    if (cleanupFn) {
      this.cleanupCallbacks.set(moduleId, cleanupFn);
    }
  }

  addReference(moduleId) {
    const ref = this.moduleRefs.get(moduleId);
    if (ref) {
      ref.refCount++;
      ref.lastAccessed = Date.now();
    }
  }

  removeReference(moduleId) {
    const ref = this.moduleRefs.get(moduleId);
    if (ref) {
      ref.refCount--;

      if (ref.refCount <= 0) {
        this.scheduleCleanup(moduleId);
      }
    }
  }

  scheduleCleanup(moduleId) {
    // Wait a bit before cleanup in case module is accessed again
    setTimeout(() => {
      const ref = this.moduleRefs.get(moduleId);
      if (ref && ref.refCount <= 0) {
        this.cleanupModule(moduleId);
      }
    }, 30000); // 30 second grace period
  }

  cleanupModule(moduleId) {
    const cleanupFn = this.cleanupCallbacks.get(moduleId);
    if (cleanupFn) {
      try {
        cleanupFn();
      } catch (error) {
        console.error(`Error during module cleanup for ${moduleId}:`, error);
      }
    }

    this.moduleRefs.delete(moduleId);
    this.cleanupCallbacks.delete(moduleId);

    console.log(`🗑️ Module ${moduleId} cleaned up`);
  }
}
```


💭 **Production story tại Binance**: Chúng tôi discovered memory leaks trong trading dashboard khi users để tab open cả ngày. Các chart modules không được cleanup properly. Implementing proper module garbage collection reduced memory usage từ 500MB sau 8 hours xuống stable 150MB.


### 📖 Micro-frontend Architecture với Modules


#### 🌱 Module Federation Deep Dive


**Webpack Module Federation Setup:**


```javascript
// Host application webpack.config.js
const ModuleFederationPlugin = require('@module-federation/webpack');

module.exports = {
  mode: 'development',
  devServer: {
    port: 3000,
  },
  plugins: [
    new ModuleFederationPlugin({
      name: 'host',
      remotes: {
        // Remote applications
        dashboard: 'dashboard@http://localhost:3001/remoteEntry.js',
        analytics: 'analytics@http://localhost:3002/remoteEntry.js',
        userProfile: 'userProfile@http://localhost:3003/remoteEntry.js',
      },
      shared: {
        react: { singleton: true },
        'react-dom': { singleton: true },
        '@company/design-system': { singleton: true },
      },
    }),
  ],
};

// Remote application (dashboard) webpack.config.js
module.exports = {
  mode: 'development',
  devServer: {
    port: 3001,
  },
  plugins: [
    new ModuleFederationPlugin({
      name: 'dashboard',
      filename: 'remoteEntry.js',
      exposes: {
        './Dashboard': './src/Dashboard.jsx',
        './DashboardWidget': './src/DashboardWidget.jsx',
      },
      shared: {
        react: { singleton: true },
        'react-dom': { singleton: true },
      },
    }),
  ],
};
```


**Dynamic Remote Loading:**


```javascript
// Dynamic remote registry
class RemoteRegistry {
  constructor() {
    this.remotes = new Map();
    this.loadingPromises = new Map();
  }

  async registerRemote(name, url) {
    if (this.remotes.has(name)) {
      console.warn(`Remote ${name} already registered`);
      return;
    }

    try {
      // Dynamically load remote entry
      await this.loadRemoteEntry(url);

      // Register remote
      this.remotes.set(name, {
        url,
        loaded: true,
        container: window[name]
      });

      console.log(`✅ Remote ${name} registered successfully`);
    } catch (error) {
      console.error(`❌ Failed to register remote ${name}:`, error);
      throw error;
    }
  }

  async loadRemoteEntry(url) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.type = 'text/javascript';
      script.async = true;

      script.onload = () => {
        resolve();
      };

      script.onerror = () => {
        reject(new Error(`Failed to load remote entry: ${url}`));
      };

      document.head.appendChild(script);
    });
  }

  async loadModule(remoteName, moduleName) {
    const remote = this.remotes.get(remoteName);
    if (!remote) {
      throw new Error(`Remote ${remoteName} not registered`);
    }

    const cacheKey = `${remoteName}/${moduleName}`;

    if (this.loadingPromises.has(cacheKey)) {
      return this.loadingPromises.get(cacheKey);
    }

    const loadingPromise = this.loadModuleInternal(remote, moduleName);
    this.loadingPromises.set(cacheKey, loadingPromise);

    return loadingPromise;
  }

  async loadModuleInternal(remote, moduleName) {
    // Initialize container
    await remote.container.init(__webpack_share_scopes__.default);

    // Load module factory
    const factory = await remote.container.get(moduleName);

    // Execute factory to get module
    const module = factory();

    return module;
  }
}

// Usage
const remoteRegistry = new RemoteRegistry();

// Register remotes dynamically
await remoteRegistry.registerRemote('dashboard', 'http://localhost:3001/remoteEntry.js');

// Load modules
const Dashboard = await remoteRegistry.loadModule('dashboard', './Dashboard');
```


#### 🔬 Cross-Application Communication


**Event-Driven Communication:**


```javascript
// Micro-frontend event bus
class MicroFrontendEventBus {
  constructor() {
    this.listeners = new Map();
    this.messageQueue = [];
    this.isReady = false;
    this.setupChannelMessaging();
  }

  setupChannelMessaging() {
    // Use BroadcastChannel for cross-tab communication
    if ('BroadcastChannel' in window) {
      this.channel = new BroadcastChannel('microfrontend-events');
      this.channel.addEventListener('message', (event) => {
        this.handleMessage(event.data);
      });
    }

    // Fallback to localStorage events
    window.addEventListener('storage', (event) => {
      if (event.key === 'microfrontend-events' && event.newValue) {
        const message = JSON.parse(event.newValue);
        this.handleMessage(message);
      }
    });
  }

  publish(eventType, payload, targetApps = []) {
    const message = {
      id: this.generateId(),
      type: eventType,
      payload,
      targetApps,
      source: this.getAppName(),
      timestamp: Date.now()
    };

    // Emit locally
    this.handleMessage(message);

    // Emit to other apps
    this.broadcastMessage(message);
  }

  subscribe(eventType, callback, filter = {}) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }

    const listener = { callback, filter, id: this.generateId() };
    this.listeners.get(eventType).push(listener);

    return () => {
      const listeners = this.listeners.get(eventType);
      const index = listeners.findIndex(l => l.id === listener.id);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }

  handleMessage(message) {
    const listeners = this.listeners.get(message.type) || [];

    listeners.forEach(listener => {
      // Apply filters
      if (this.matchesFilter(message, listener.filter)) {
        try {
          listener.callback(message.payload, message);
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      }
    });
  }

  matchesFilter(message, filter) {
    if (filter.source && message.source !== filter.source) {
      return false;
    }

    if (filter.targetApps && filter.targetApps.length > 0) {
      if (!filter.targetApps.includes(this.getAppName())) {
        return false;
      }
    }

    return true;
  }

  broadcastMessage(message) {
    if (this.channel) {
      this.channel.postMessage(message);
    } else {
      // Fallback to localStorage
      localStorage.setItem('microfrontend-events', JSON.stringify(message));
      setTimeout(() => {
        localStorage.removeItem('microfrontend-events');
      }, 100);
    }
  }
}

// Usage across micro-frontends
const eventBus = new MicroFrontendEventBus();

// In Dashboard app
eventBus.publish('user-selected', { userId: 123 });

// In Profile app
eventBus.subscribe('user-selected', (payload) => {
  console.log('User selected:', payload.userId);
}, { source: 'dashboard' });
```


**Shared State Management:**


```javascript
// Cross-application shared state
class SharedStateManager {
  constructor() {
    this.state = new Map();
    this.subscribers = new Map();
    this.persistence = new SharedStatePersistence();
    this.sync = new SharedStateSync();
    this.loadPersistedState();
  }

  setState(key, value, options = {}) {
    const previousValue = this.state.get(key);
    this.state.set(key, value);

    // Notify subscribers
    this.notifySubscribers(key, value, previousValue);

    // Persist if needed
    if (options.persist) {
      this.persistence.save(key, value);
    }

    // Sync across apps if needed
    if (options.sync) {
      this.sync.broadcast(key, value);
    }
  }

  getState(key) {
    return this.state.get(key);
  }

  subscribe(key, callback) {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, []);
    }

    const subscriber = { callback, id: this.generateId() };
    this.subscribers.get(key).push(subscriber);

    // Immediately call với current value
    const currentValue = this.state.get(key);
    if (currentValue !== undefined) {
      callback(currentValue);
    }

    return () => {
      const subscribers = this.subscribers.get(key);
      const index = subscribers.findIndex(s => s.id === subscriber.id);
      if (index > -1) {
        subscribers.splice(index, 1);
      }
    };
  }

  notifySubscribers(key, newValue, previousValue) {
    const subscribers = this.subscribers.get(key) || [];
    subscribers.forEach(subscriber => {
      try {
        subscriber.callback(newValue, previousValue);
      } catch (error) {
        console.error('Error in state subscriber:', error);
      }
    });
  }

  async loadPersistedState() {
    try {
      const persistedState = await this.persistence.load();
      for (const [key, value] of persistedState) {
        this.state.set(key, value);
      }
    } catch (error) {
      console.error('Failed to load persisted state:', error);
    }
  }
}

// Usage
const sharedState = new SharedStateManager();

// In any micro-frontend
sharedState.setState('currentUser', { id: 123, name: 'John' }, {
  persist: true,
  sync: true
});

// Subscribe to changes
const unsubscribe = sharedState.subscribe('currentUser', (user) => {
  console.log('Current user changed:', user);
});
```


💭 **Architecture decision tại Webflow**: Chúng tôi migrate từ monolithic React app sang micro-frontend architecture using Module Federation. Biggest challenge là managing shared state across boundaries. Chúng tôi implement event-driven architecture với fallback mechanisms để ensure reliability.


---


## Phần IV: PRODUCTION ENGINEERING LEVEL


### 📖 Module Loading Performance in Production


#### 🌱 Network-Level Optimizations


**HTTP/2 Push & Preload Strategies:**


```javascript
// Server-side module preloading
class ModulePreloadOptimizer {
  constructor() {
    this.criticalModules = new Set();
    this.preloadGraph = new Map();
    this.userPatterns = new Map();
  }

  // Analyze user navigation patterns
  analyzeUserPattern(userId, route, loadedModules) {
    if (!this.userPatterns.has(userId)) {
      this.userPatterns.set(userId, {
        routes: [],
        moduleUsage: new Map(),
        patterns: []
      });
    }

    const userPattern = this.userPatterns.get(userId);
    userPattern.routes.push({ route, timestamp: Date.now() });

    loadedModules.forEach(module => {
      const count = userPattern.moduleUsage.get(module) || 0;
      userPattern.moduleUsage.set(module, count + 1);
    });

    // Detect patterns
    this.detectNavigationPatterns(userId);
  }

  detectNavigationPatterns(userId) {
    const userPattern = this.userPatterns.get(userId);
    const recentRoutes = userPattern.routes.slice(-10);

    // Look for common sequences
    for (let i = 0; i < recentRoutes.length - 1; i++) {
      const current = recentRoutes[i].route;
      const next = recentRoutes[i + 1].route;

      const sequenceKey = `${current}->${next}`;
      if (!this.preloadGraph.has(sequenceKey)) {
        this.preloadGraph.set(sequenceKey, { count: 0, modules: new Set() });
      }

      this.preloadGraph.get(sequenceKey).count++;
    }
  }

  generatePreloadHeaders(currentRoute, userId) {
    const headers = [];
    const userPattern = this.userPatterns.get(userId);

    if (userPattern) {
      // Find likely next routes
      const likelyNext = this.findLikelyNextRoutes(currentRoute);

      likelyNext.forEach(route => {
        const modules = this.getModulesForRoute(route);
        modules.forEach(module => {
          headers.push(`<${module}>; rel=modulepreload`);
        });
      });
    }

    return headers;
  }

  findLikelyNextRoutes(currentRoute) {
    const candidates = [];

    for (const [sequence, data] of this.preloadGraph) {
      const [from, to] = sequence.split('->');
      if (from === currentRoute && data.count > 3) {
        candidates.push({ route: to, probability: data.count });
      }
    }

    return candidates
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 3)
      .map(c => c.route);
  }
}

// Express.js middleware
function modulePreloadMiddleware(req, res, next) {
  const optimizer = new ModulePreloadOptimizer();
  const userId = req.user?.id;
  const route = req.path;

  if (userId) {
    const preloadHeaders = optimizer.generatePreloadHeaders(route, userId);
    preloadHeaders.forEach(header => {
      res.append('Link', header);
    });
  }

  next();
}
```


**Service Worker Module Caching:**


```javascript
// Advanced service worker cho module caching
class ModuleCacheManager {
  constructor() {
    this.CACHE_NAME = 'modules-v1';
    this.moduleVersions = new Map();
    this.setupEventListeners();
  }

  setupEventListeners() {
    self.addEventListener('install', event => {
      event.waitUntil(this.preinstallCriticalModules());
    });

    self.addEventListener('fetch', event => {
      if (this.isModuleRequest(event.request)) {
        event.respondWith(this.handleModuleRequest(event.request));
      }
    });

    self.addEventListener('message', event => {
      if (event.data.type === 'PREFETCH_MODULES') {
        this.prefetchModules(event.data.modules);
      }
    });
  }

  async preinstallCriticalModules() {
    const criticalModules = [
      '/js/chunks/runtime.js',
      '/js/chunks/vendors.js',
      '/js/chunks/main.js'
    ];

    const cache = await caches.open(this.CACHE_NAME);

    const fetchPromises = criticalModules.map(async (url) => {
      try {
        const response = await fetch(url);
        if (response.ok) {
          await cache.put(url, response.clone());
          console.log(`✅ Preinstalled: ${url}`);
        }
      } catch (error) {
        console.error(`❌ Failed to preinstall: ${url}`, error);
      }
    });

    await Promise.allSettled(fetchPromises);
  }

  async handleModuleRequest(request) {
    const cache = await caches.open(this.CACHE_NAME);

    // Try cache first
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      // Check if cache is still valid
      if (this.isCacheValid(request.url, cachedResponse)) {
        console.log(`📦 Cache hit: ${request.url}`);
        return cachedResponse;
      }
    }

    // Fetch from network
    try {
      const networkResponse = await fetch(request);

      if (networkResponse.ok) {
        // Update cache
        await cache.put(request, networkResponse.clone());
        console.log(`🌐 Network fetch: ${request.url}`);
        return networkResponse;
      }

      // If network fails và có cached version, return it
      if (cachedResponse) {
        console.log(`⚠️ Network failed, using stale cache: ${request.url}`);
        return cachedResponse;
      }

    } catch (error) {
      console.error(`❌ Network error for: ${request.url}`, error);

      if (cachedResponse) {
        return cachedResponse;
      }
    }

    return new Response('Module not found', { status: 404 });
  }

  isCacheValid(url, response) {
    const cacheDate = new Date(response.headers.get('date'));
    const maxAge = this.getMaxAge(url);
    const age = Date.now() - cacheDate.getTime();

    return age < maxAge;
  }

  getMaxAge(url) {
    // Critical modules: 1 hour
    if (url.includes('runtime') || url.includes('vendor')) {
      return 60 * 60 * 1000;
    }

    // Regular modules: 24 hours
    return 24 * 60 * 60 * 1000;
  }

  async prefetchModules(modules) {
    const cache = await caches.open(this.CACHE_NAME);

    const prefetchPromises = modules.map(async (module) => {
      try {
        const response = await fetch(module);
        if (response.ok) {
          await cache.put(module, response);
          console.log(`🔄 Prefetched: ${module}`);
        }
      } catch (error) {
        console.error(`❌ Prefetch failed: ${module}`, error);
      }
    });

    await Promise.allSettled(prefetchPromises);
  }

  isModuleRequest(request) {
    return request.url.includes('/js/') &&
           (request.url.endsWith('.js') || request.url.includes('chunk'));
  }
}

// Initialize service worker
const moduleCacheManager = new ModuleCacheManager();
```


#### 🔬 Runtime Performance Monitoring


**Module Load Time Tracking:**


```javascript
class ModulePerformanceMonitor {
  constructor() {
    this.loadTimes = new Map();
    this.errorCounts = new Map();
    this.observer = null;
    this.setupPerformanceObserver();
  }

  setupPerformanceObserver() {
    if ('PerformanceObserver' in window) {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.processPerformanceEntry(entry);
        }
      });

      this.observer.observe({
        entryTypes: ['navigation', 'resource', 'measure']
      });
    }
  }

  processPerformanceEntry(entry) {
    if (entry.entryType === 'resource' && this.isModuleResource(entry)) {
      this.trackModuleLoad(entry);
    } else if (entry.entryType === 'measure' && entry.name.startsWith('module-')) {
      this.trackModuleMeasure(entry);
    }
  }

  trackModuleLoad(entry) {
    const moduleId = this.extractModuleId(entry.name);
    const loadTime = entry.responseEnd - entry.requestStart;

    if (!this.loadTimes.has(moduleId)) {
      this.loadTimes.set(moduleId, []);
    }

    this.loadTimes.get(moduleId).push({
      loadTime,
      transferSize: entry.transferSize,
      timestamp: entry.startTime
    });

    // Check for performance issues
    this.analyzeModulePerformance(moduleId, loadTime);
  }

  analyzeModulePerformance(moduleId, loadTime) {
    const history = this.loadTimes.get(moduleId);

    // Calculate average load time
    const avgLoadTime = history.reduce((sum, record) => sum + record.loadTime, 0) / history.length;

    // Alert if load time significantly higher than average
    if (loadTime > avgLoadTime * 2 && loadTime > 1000) {
      console.warn(`🐌 Slow module load detected:`, {
        moduleId,
        loadTime: `${loadTime.toFixed(2)}ms`,
        average: `${avgLoadTime.toFixed(2)}ms`,
        deviation: `${((loadTime / avgLoadTime - 1) * 100).toFixed(1)}%`
      });

      this.reportSlowModule(moduleId, loadTime, avgLoadTime);
    }
  }

  trackModuleError(moduleId, error) {
    const count = this.errorCounts.get(moduleId) || 0;
    this.errorCounts.set(moduleId, count + 1);

    console.error(`❌ Module error:`, { moduleId, error, totalErrors: count + 1 });

    // Report if error rate is high
    if (count + 1 >= 3) {
      this.reportModuleErrors(moduleId, count + 1);
    }
  }

  async reportSlowModule(moduleId, loadTime, avgLoadTime) {
    // Send to analytics
    if (window.gtag) {
      gtag('event', 'slow_module_load', {
        custom_parameter_1: moduleId,
        custom_parameter_2: loadTime,
        custom_parameter_3: avgLoadTime
      });
    }

    // Send to error tracking service
    if (window.Sentry) {
      Sentry.withScope(scope => {
        scope.setTag('performance', 'slow_module');
        scope.setContext('module', {
          id: moduleId,
          loadTime,
          avgLoadTime,
          userAgent: navigator.userAgent,
          connection: this.getConnectionInfo()
        });

        Sentry.captureMessage(`Slow module load: ${moduleId}`, 'warning');
      });
    }
  }

  getConnectionInfo() {
    if ('connection' in navigator) {
      return {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt
      };
    }
    return null;
  }

  generatePerformanceReport() {
    const report = {
      timestamp: new Date().toISOString(),
      modules: [],
      summary: {
        totalModules: this.loadTimes.size,
        avgLoadTime: 0,
        slowModules: 0,
        errorModules: this.errorCounts.size
      }
    };

    let totalLoadTime = 0;
    let moduleCount = 0;

    for (const [moduleId, records] of this.loadTimes) {
      const avgLoadTime = records.reduce((sum, r) => sum + r.loadTime, 0) / records.length;
      const recentRecords = records.slice(-5);
      const recentAvg = recentRecords.reduce((sum, r) => sum + r.loadTime, 0) / recentRecords.length;

      report.modules.push({
        moduleId,
        avgLoadTime: avgLoadTime.toFixed(2),
        recentAvgLoadTime: recentAvg.toFixed(2),
        loadCount: records.length,
        errors: this.errorCounts.get(moduleId) || 0,
        isSlow: avgLoadTime > 2000
      });

      totalLoadTime += avgLoadTime;
      moduleCount++;

      if (avgLoadTime > 2000) {
        report.summary.slowModules++;
      }
    }

    report.summary.avgLoadTime = (totalLoadTime / moduleCount).toFixed(2);

    return report;
  }

  isModuleResource(entry) {
    return entry.name.includes('/js/') &&
           (entry.name.endsWith('.js') || entry.name.includes('chunk'));
  }

  extractModuleId(url) {
    const match = url.match(/\/([^\/]+\.js)$/);
    return match ? match[1] : url;
  }
}

// Usage
const performanceMonitor = new ModulePerformanceMonitor();

// Monitor dynamic imports
const originalImport = window.__webpack_require__.e;
window.__webpack_require__.e = function(chunkId) {
  performance.mark(`module-${chunkId}-start`);

  return originalImport.call(this, chunkId)
    .then(result => {
      performance.mark(`module-${chunkId}-end`);
      performance.measure(`module-${chunkId}`, `module-${chunkId}-start`, `module-${chunkId}-end`);
      return result;
    })
    .catch(error => {
      performanceMonitor.trackModuleError(chunkId, error);
      throw error;
    });
};
```


#### 💡 Advanced Caching Strategies


**Intelligent Module Versioning:**


```javascript
class ModuleVersionManager {
  constructor() {
    this.versionMap = new Map();
    this.dependencyGraph = new Map();
    this.cacheStrategy = new Map();
    this.loadHashes();
  }

  async loadHashes() {
    try {
      // Load module hashes từ manifest
      const manifest = await fetch('/build/module-manifest.json');
      const data = await manifest.json();

      for (const [moduleId, info] of Object.entries(data.modules)) {
        this.versionMap.set(moduleId, {
          hash: info.hash,
          size: info.size,
          dependencies: info.dependencies || [],
          lastModified: info.lastModified
        });

        // Build dependency graph
        this.dependencyGraph.set(moduleId, info.dependencies);
      }

      this.optimizeCacheStrategy();
    } catch (error) {
      console.error('Failed to load module manifest:', error);
    }
  }

  optimizeCacheStrategy() {
    for (const [moduleId, info] of this.versionMap) {
      let strategy = 'default';

      // High-frequency modules get aggressive caching
      if (this.isHighFrequencyModule(moduleId)) {
        strategy = 'aggressive';
      }

      // Large modules get background prefetch
      if (info.size > 100 * 1024) { // 100KB
        strategy = 'background';
      }

      // Critical path modules get preload
      if (this.isCriticalPath(moduleId)) {
        strategy = 'preload';
      }

      this.cacheStrategy.set(moduleId, strategy);
    }
  }

  async invalidateModule(moduleId) {
    const info = this.versionMap.get(moduleId);
    if (!info) return;

    // Invalidate module và all dependents
    const dependents = this.findDependents(moduleId);
    const toInvalidate = [moduleId, ...dependents];

    const cache = await caches.open('modules-v1');

    for (const module of toInvalidate) {
      const moduleInfo = this.versionMap.get(module);
      if (moduleInfo) {
        const urls = this.getModuleUrls(module, moduleInfo.hash);
        for (const url of urls) {
          await cache.delete(url);
          console.log(`🗑️ Invalidated cache for: ${url}`);
        }
      }
    }
  }

  findDependents(moduleId) {
    const dependents = [];

    for (const [otherModuleId, dependencies] of this.dependencyGraph) {
      if (dependencies.includes(moduleId)) {
        dependents.push(otherModuleId);
        // Recursively find dependents
        dependents.push(...this.findDependents(otherModuleId));
      }
    }

    return [...new Set(dependents)]; // Remove duplicates
  }

  getModuleUrls(moduleId, hash) {
    return [
      `/js/chunks/${moduleId}.${hash}.js`,
      `/js/chunks/${moduleId}.${hash}.js.map`
    ];
  }

  isHighFrequencyModule(moduleId) {
    const highFrequencyModules = ['react', 'react-dom', 'vendor', 'common'];
    return highFrequencyModules.some(name => moduleId.includes(name));
  }

  isCriticalPath(moduleId) {
    const criticalModules = ['runtime', 'main', 'vendor'];
    return criticalModules.some(name => moduleId.includes(name));
  }

  async shouldUpdateModule(moduleId, currentHash) {
    const storedInfo = this.versionMap.get(moduleId);

    if (!storedInfo || storedInfo.hash !== currentHash) {
      return true;
    }

    // Check dependency updates
    for (const depId of storedInfo.dependencies) {
      const depInfo = this.versionMap.get(depId);
      if (depInfo && await this.shouldUpdateModule(depId, depInfo.hash)) {
        return true;
      }
    }

    return false;
  }
}
```


💭 **Production war story tại Figma**: Chúng tôi có một incident nghiêm trọng khi deploy version mới. Một số users vẫn đang sử dụng cached version của old modules với new API. Điều này gây ra UI breaks và data corruption. Từ đó, chúng tôi implement sophisticated cache invalidation strategy với dependency tracking.


### 📖 Error Handling & Resilience


#### 🌱 Module Loading Error Recovery


**Comprehensive Error Handling:**


```javascript
class ModuleErrorHandler {
  constructor() {
    this.retryAttempts = new Map();
    this.failedModules = new Set();
    this.fallbackModules = new Map();
    this.errorReporter = new ModuleErrorReporter();
    this.setupGlobalErrorHandling();
  }

  setupGlobalErrorHandling() {
    // Handle dynamic import errors
    const originalImport = window.import || (specifier => import(specifier));

    window.import = async (specifier) => {
      return this.resilientImport(specifier, originalImport);
    };

    // Handle script loading errors
    window.addEventListener('error', (event) => {
      if (this.isModuleError(event)) {
        this.handleModuleLoadError(event);
      }
    });

    // Handle unhandled promise rejections from module loading
    window.addEventListener('unhandledrejection', (event) => {
      if (this.isModulePromiseRejection(event)) {
        this.handleModulePromiseRejection(event);
      }
    });
  }

  async resilientImport(specifier, importFn) {
    const maxRetries = 3;
    const retryDelay = 1000; // 1 second

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await importFn(specifier);

        // Reset retry count on success
        this.retryAttempts.delete(specifier);

        return result;

      } catch (error) {
        console.error(`❌ Module load attempt ${attempt} failed for ${specifier}:`, error);

        this.retryAttempts.set(specifier, attempt);

        if (attempt < maxRetries) {
          // Wait before retry với exponential backoff
          const delay = retryDelay * Math.pow(2, attempt - 1);
          await this.delay(delay);

          // Try alternative CDN if available
          if (attempt === 2) {
            specifier = this.tryAlternativeCDN(specifier);
          }

        } else {
          // All retries failed
          this.failedModules.add(specifier);
          return this.handleFinalFailure(specifier, error);
        }
      }
    }
  }

  async handleFinalFailure(specifier, error) {
    // Try fallback module
    const fallbackModule = this.fallbackModules.get(specifier);
    if (fallbackModule) {
      console.warn(`⚠️ Loading fallback for ${specifier}: ${fallbackModule}`);
      try {
        return await import(fallbackModule);
      } catch (fallbackError) {
        console.error(`❌ Fallback also failed for ${specifier}:`, fallbackError);
      }
    }

    // Report error
    this.errorReporter.report({
      type: 'module_load_failure',
      specifier,
      error: error.message,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      retryAttempts: this.retryAttempts.get(specifier) || 0
    });

    // Return empty module để prevent app crash
    return this.createEmptyModule(specifier);
  }

  createEmptyModule(specifier) {
    console.warn(`🔧 Creating empty module for ${specifier}`);

    // Return module with safe defaults
    return {
      default: () => {
        console.warn(`Empty module called: ${specifier}`);
        return null;
      },
      // Common named exports với safe defaults
      Component: () => React.createElement('div', null, 'Component failed to load'),
      reducer: (state = {}) => state,
      middleware: (store) => (next) => (action) => next(action),
      // Add more common patterns as needed
    };
  }

  tryAlternativeCDN(specifier) {
    // Switch to alternative CDN
    if (specifier.includes('cdn1.example.com')) {
      return specifier.replace('cdn1.example.com', 'cdn2.example.com');
    } else if (specifier.includes('cdn2.example.com')) {
      return specifier.replace('cdn2.example.com', 'backup.example.com');
    }

    return specifier;
  }

  registerFallback(module, fallback) {
    this.fallbackModules.set(module, fallback);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  isModuleError(event) {
    return event.target?.src?.includes('/js/') ||
           event.filename?.includes('/js/');
  }

  isModulePromiseRejection(event) {
    const reason = event.reason;
    return reason &&
           (reason.message?.includes('Loading chunk') ||
            reason.message?.includes('Failed to fetch'));
  }

  handleModuleLoadError(event) {
    const src = event.target?.src || event.filename;
    console.error(`🚨 Module script error: ${src}`);

    this.errorReporter.report({
      type: 'module_script_error',
      src,
      message: event.message,
      lineno: event.lineno,
      colno: event.colno
    });
  }

  handleModulePromiseRejection(event) {
    console.error(`🚨 Module promise rejection:`, event.reason);

    this.errorReporter.report({
      type: 'module_promise_rejection',
      reason: event.reason?.message || String(event.reason)
    });

    // Prevent default to avoid console spam
    event.preventDefault();
  }
}

// Error reporting service
class ModuleErrorReporter {
  constructor() {
    this.errorQueue = [];
    this.isOnline = navigator.onLine;
    this.setupOfflineHandling();
  }

  setupOfflineHandling() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.flushErrorQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  report(errorData) {
    const enrichedError = {
      ...errorData,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      connection: this.getConnectionInfo(),
      performance: this.getPerformanceInfo()
    };

    if (this.isOnline) {
      this.sendError(enrichedError);
    } else {
      this.errorQueue.push(enrichedError);
    }
  }

  async sendError(errorData) {
    try {
      await fetch('/api/module-errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorData)
      });
    } catch (error) {
      console.error('Failed to report module error:', error);
      this.errorQueue.push(errorData);
    }
  }

  async flushErrorQueue() {
    while (this.errorQueue.length > 0) {
      const errorData = this.errorQueue.shift();
      await this.sendError(errorData);
    }
  }

  getConnectionInfo() {
    if ('connection' in navigator) {
      return {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt
      };
    }
    return null;
  }

  getPerformanceInfo() {
    if ('performance' in window) {
      return {
        navigation: performance.getEntriesByType('navigation')[0],
        memory: performance.memory ? {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize
        } : null
      };
    }
    return null;
  }
}

// Initialize error handling
const moduleErrorHandler = new ModuleErrorHandler();

// Register fallbacks for critical modules
moduleErrorHandler.registerFallback('./CriticalComponent.js', './FallbackComponent.js');
moduleErrorHandler.registerFallback('./ChartLibrary.js', './SimpleChart.js');
```


#### 🔬 Circuit Breaker Pattern for Modules


**Module Circuit Breaker:**


```javascript
class ModuleCircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.timeout = options.timeout || 60000; // 1 minute
    this.monitoringPeriod = options.monitoringPeriod || 300000; // 5 minutes

    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.nextAttempt = null;

    this.onStateChange = options.onStateChange || (() => {});
  }

  async execute(moduleLoader) {
    if (this.state === 'OPEN') {
      if (this.shouldAttemptReset()) {
        this.state = 'HALF_OPEN';
        this.onStateChange('HALF_OPEN');
      } else {
        throw new Error('Circuit breaker is OPEN - module loading temporarily disabled');
      }
    }

    try {
      const result = await moduleLoader();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error);
      throw error;
    }
  }

  onSuccess() {
    this.failureCount = 0;
    this.lastFailureTime = null;

    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED';
      this.onStateChange('CLOSED');
      console.log('✅ Circuit breaker reset to CLOSED');
    }
  }

  onFailure(error) {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.timeout;
      this.onStateChange('OPEN');
      console.warn(`🔴 Circuit breaker opened after ${this.failureCount} failures`);
    }
  }

  shouldAttemptReset() {
    return Date.now() >= this.nextAttempt;
  }

  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime,
      nextAttempt: this.nextAttempt
    };
  }
}

// Module loading với circuit breaker
class ResilientModuleLoader {
  constructor() {
    this.circuitBreakers = new Map();
    this.loadingStrategies = new Map();
    this.setupDefaultStrategies();
  }

  setupDefaultStrategies() {
    // Different strategies for different module types
    this.loadingStrategies.set('critical', {
      retries: 5,
      timeout: 10000,
      fallbackRequired: true
    });

    this.loadingStrategies.set('feature', {
      retries: 3,
      timeout: 5000,
      fallbackRequired: false
    });

    this.loadingStrategies.set('analytics', {
      retries: 1,
      timeout: 3000,
      fallbackRequired: false
    });
  }

  async loadModule(specifier, moduleType = 'feature') {
    const circuitBreaker = this.getCircuitBreaker(specifier);
    const strategy = this.loadingStrategies.get(moduleType);

    return circuitBreaker.execute(async () => {
      return this.loadWithStrategy(specifier, strategy);
    });
  }

  getCircuitBreaker(specifier) {
    if (!this.circuitBreakers.has(specifier)) {
      const breaker = new ModuleCircuitBreaker({
        failureThreshold: 3,
        timeout: 30000,
        onStateChange: (state) => {
          console.log(`🔄 Circuit breaker for ${specifier}: ${state}`);
          this.reportCircuitBreakerState(specifier, state);
        }
      });

      this.circuitBreakers.set(specifier, breaker);
    }

    return this.circuitBreakers.get(specifier);
  }

  async loadWithStrategy(specifier, strategy) {
    const timeout = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Module load timeout')), strategy.timeout);
    });

    const loadPromise = this.attemptLoad(specifier, strategy.retries);

    return Promise.race([loadPromise, timeout]);
  }

  async attemptLoad(specifier, maxRetries) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await import(specifier);
      } catch (error) {
        lastError = error;

        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  reportCircuitBreakerState(specifier, state) {
    // Report to monitoring system
    if (window.gtag) {
      gtag('event', 'circuit_breaker_state_change', {
        module_specifier: specifier,
        new_state: state
      });
    }
  }

  getSystemHealth() {
    const health = {
      totalModules: this.circuitBreakers.size,
      openCircuits: 0,
      halfOpenCircuits: 0,
      recentFailures: 0
    };

    for (const [specifier, breaker] of this.circuitBreakers) {
      const state = breaker.getState();

      if (state.state === 'OPEN') {
        health.openCircuits++;
      } else if (state.state === 'HALF_OPEN') {
        health.halfOpenCircuits++;
      }

      // Count recent failures (last 5 minutes)
      if (state.lastFailureTime &&
          Date.now() - state.lastFailureTime < 300000) {
        health.recentFailures++;
      }
    }

    return health;
  }
}

// Usage
const resilientLoader = new ResilientModuleLoader();

// Load critical modules với enhanced resilience
async function loadCriticalModule() {
  try {
    const module = await resilientLoader.loadModule('./CriticalFeature.js', 'critical');
    return module;
  } catch (error) {
    console.error('Failed to load critical module after all retries:', error);
    // Load fallback
    return import('./FallbackFeature.js');
  }
}
```


💭 **Real production experience tại Binance**: Trong crypto trading platform, module loading failures có thể cost users millions of dollars nếu họ không thể execute trades. Chúng tôi implement circuit breaker pattern với multiple fallback levels. Khi main trading module fails, system automatically switches sang simplified trading interface, ensuring users vẫn có thể trade.


---


## Phần V: VERIFICATION & MASTERY CHECKPOINTS


### 📖 Self-Assessment Questions


#### 🎯 Foundation Level (Junior/Mid-level)


**Conceptual Understanding:**


1. **Module Scope Question**:
javascript// file-a.js
const secret = "hidden";
export const public = "visible";

// file-b.js
import { public } from './file-a.js';
console.log(secret); // Có hoạt động không? Tại sao?
**Expected Answer**: Không hoạt động. `secret` variable chỉ tồn tại trong module scope của file-a.js. Module pattern đảm bảo encapsulation - chỉ có exported values mới accessible từ bên ngoài.
2. **Export vs Import Binding Question**:
javascript// counter.js
let count = 0;
export function increment() { count++; }
export function getCount() { return count; }

// main.js
import { increment, getCount } from './counter.js';
console.log(getCount()); // ?
increment();
console.log(getCount()); // ?
**Expected Answer**:

First log: 0
Second log: 1
Đây là live binding - imported functions reference original variables trong exporting module.


**Practical Scenarios:**


1. **Tree Shaking Understanding**:
javascript// utils.js
export function used() { return "I'm used"; }
export function unused() { return "I'm not used"; }

// main.js
import { used } from './utils.js';
used();
Question: Trong production build, function `unused` có được included không? Explain tree shaking process.
2. **Dynamic Import Use Cases**:
Khi nào bạn sẽ sử dụng dynamic imports thay vì static imports? Provide 3 real-world scenarios with code examples.


#### 🎯 Senior Level


**Advanced Pattern Recognition:**


1. **Circular Dependency Analysis**:
javascript// a.js
import { b } from './b.js';
export const a = 'value-a';
console.log('In a.js, b is:', b);

// b.js
import { a } from './a.js';
export const b = 'value-b';
console.log('In b.js, a is:', a);

// main.js
import './a.js';
Predict execution output và explain how JavaScript engine handles circular dependencies.
2. **Module Federation Complexity**:
Design a module federation architecture cho một e-commerce platform với:

Product catalog micro-frontend
Shopping cart micro-frontend
User profile micro-frontend
Shared design system

Address: shared dependencies, version conflicts, error boundaries, performance implications.


**Performance Analysis:**


1. **Bundle Optimization Challenge**:
Given this import structure:
javascript// Heavy imports
import _ from 'lodash';              // 70KB
import moment from 'moment';         // 67KB
import { Chart } from 'chart.js';    // 89KB
import { Button } from './components'; // 5KB + dependencies
Optimize này để reduce initial bundle size và improve loading performance. Explain your strategy.


#### 🎯 Principal Level


**Architecture Decisions:**


1. **Module Loading Strategy Design**:
Design complete module loading strategy cho một application với:

100+ routes
500+ components
Multiple user roles với different permissions
International users với varying network conditions

Address: cache strategies, preloading, error handling, monitoring.
2. **Performance Optimization Challenge**:
Your application có issue:

Initial bundle: 2.5MB
Time to Interactive: 4.2s on 3G
Module load failures: 2% of users

Design comprehensive solution addressing each issue with specific techniques và measurable improvements.


### 📖 Common Interview Questions


#### 🎯 Technical Deep Dive Questions


**Question 1: "Explain the difference between CommonJS và ES Modules"**


**Comprehensive Answer:**


```javascript
// CommonJS (Node.js)
// - Synchronous loading
// - Dynamic structure
// - Runtime resolution

const fs = require('fs');              // Synchronous
const moduleName = './utils.js';
const utils = require(moduleName);     // Dynamic - allowed

if (condition) {
  const helper = require('./helper');  // Conditional - allowed
}

module.exports = {
  function1,
  function2
};

// ES Modules
// - Asynchronous loading (in browsers)
// - Static structure
// - Compile-time resolution

import fs from 'fs';                   // Static structure required
// import moduleName from './utils.js';  // ❌ Dynamic not allowed
// if (condition) {                    // ❌ Conditional not allowed
//   import helper from './helper';
// }

export { function1, function2 };       // Static exports

// Dynamic ES modules
const module = await import('./utils.js'); // Runtime loading
```


**Key Differences:**


1. **Loading**: CommonJS synchronous, ES Modules asynchronous
2. **Structure**: CommonJS dynamic, ES Modules static
3. **Tree Shaking**: Only possible với ES Modules
4. **Browser Support**: ES Modules native, CommonJS needs bundler
5. **Binding**: CommonJS copies exports, ES Modules live bindings


**Question 2: "How does module bundling affect performance?"**


**Comprehensive Answer:**


```javascript
// Before bundling (multiple requests)
// Each import = separate HTTP request
import './module1.js';  // Request 1
import './module2.js';  // Request 2
import './module3.js';  // Request 3
// = 3 round trips, potentially blocking

// After bundling (single request)
// All modules combined into single file
// bundle.js contains module1 + module2 + module3
// = 1 round trip

// However, single bundle issues:
const LARGE_BUNDLE = {
  size: '2MB',
  loadTime: '4.2s on 3G',
  cacheInvalidation: 'Entire bundle invalidated on any change'
};

// Solution: Code splitting
async function loadFeature() {
  // Lazy load heavy features
  const { HeavyComponent } = await import('./heavy-feature.js');
  return HeavyComponent;
}

// Optimal bundling strategy:
const OPTIMAL_STRATEGY = {
  vendor: 'Third-party libraries (rare changes)',
  common: 'Shared application code',
  features: 'Individual feature bundles',
  critical: 'Above-the-fold content'
};
```


**Performance Implications:**


1. **Network**: Fewer requests vs larger payloads
2. **Caching**: Granular caching vs single bundle invalidation
3. **Loading**: Parallel loading vs sequential execution
4. **Memory**: All modules in memory vs on-demand loading


**Question 3: "Design a module loading strategy for a large-scale application"**


**Comprehensive Answer:**


```javascript
class EnterpriseModuleStrategy {
  constructor() {
    this.strategies = {
      critical: this.createCriticalStrategy(),
      feature: this.createFeatureStrategy(),
      vendor: this.createVendorStrategy(),
      lazy: this.createLazyStrategy()
    };
  }

  createCriticalStrategy() {
    return {
      // Critical path modules
      preload: true,
      cache: 'aggressive',
      fallback: 'required',
      monitoring: 'realtime',

      modules: [
        'authentication',
        'navigation',
        'error-boundary',
        'core-layout'
      ]
    };
  }

  createFeatureStrategy() {
    return {
      // Feature modules
      loading: 'route-based',
      prefetch: 'on-idle',
      cache: 'smart',
      fallback: 'graceful',

      // Conditional loading based on user role
      loadConditions: {
        admin: ['admin-panel', 'user-management'],
        user: ['dashboard', 'profile'],
        guest: ['landing', 'auth']
      }
    };
  }

  async loadModule(moduleId, category = 'feature') {
    const strategy = this.strategies[category];

    // Apply loading strategy
    return this.executeStrategy(moduleId, strategy);
  }

  // Performance monitoring
  monitorPerformance() {
    return {
      bundleSize: this.getTotalBundleSize(),
      loadTimes: this.getAverageLoadTimes(),
      errorRates: this.getErrorRates(),
      userExperience: this.getUserExperienceMetrics()
    };
  }
}
```


### 📖 Code Review Red Flags


#### 🚨 Anti-patterns to Watch For


**1. Module Anti-patterns:**


```javascript
// ❌ BAD: Mixing module systems
const something = require('commonjs-module');
import { other } from 'es-module';

// ❌ BAD: Side effects in modules
import './global-modifications.js'; // Modifies global state
export const value = mutateGlobalState(); // Side effect during import

// ❌ BAD: Circular dependencies
// a.js
import { b } from './b.js';
export const a = b + 1;

// b.js
import { a } from './a.js';
export const b = a + 1; // Will cause issues

// ✅ GOOD: Clean separation
import { pure } from './pure-module.js';
export const calculated = pure(input); // No side effects
```


**2. Performance Anti-patterns:**


```javascript
// ❌ BAD: Importing entire large libraries
import _ from 'lodash'; // Imports entire library
import * as moment from 'moment'; // Imports everything

// ✅ GOOD: Selective imports
import { debounce, throttle } from 'lodash';
import { format } from 'date-fns'; // Lighter alternative

// ❌ BAD: Unnecessary dynamic imports
const component = await import('./SimpleComponent.js'); // Overhead for small modules

// ✅ GOOD: Static imports for small, critical modules
import SimpleComponent from './SimpleComponent.js';
```


**3. Error Handling Anti-patterns:**


```javascript
// ❌ BAD: No error handling for dynamic imports
const module = await import('./feature.js'); // Can fail silently
module.default();

// ❌ BAD: Catching và ignoring errors
try {
  await import('./optional-feature.js');
} catch (e) {
  // Silent failure - user không biết feature failed
}

// ✅ GOOD: Proper error handling
try {
  const module = await import('./feature.js');
  return module.default();
} catch (error) {
  console.error('Failed to load feature:', error);

  // Provide fallback or user feedback
  return this.loadFallbackFeature();
}
```


### 📖 Practical Exercises


#### 🛠️ Exercise 1: Module Performance Audit


**Scenario**: Your e-commerce app has performance issues. Bundle size is 3.2MB và users complain about slow loading.


**Task**: Analyze này bundle structure và create optimization plan:


```javascript
// Current bundle analysis
const CURRENT_BUNDLES = {
  main: {
    size: '1.8MB',
    modules: [
      'react', 'react-dom',           // 150KB
      'lodash',                       // 70KB
      'moment',                       // 67KB
      'chart.js',                     // 89KB
      'product-catalog',              // 245KB
      'shopping-cart',                // 189KB
      'user-profile',                 // 156KB
      'admin-panel',                  // 234KB (only for admins!)
      'analytics',                    // 178KB (only for tracking)
      'payment-processing',           // 223KB
      'misc-utilities'                // 189KB
    ]
  },
  vendor: {
    size: '890KB',
    modules: ['various-npm-packages']
  },
  styles: {
    size: '510KB',
    modules: ['css-files']
  }
};

// Your optimization plan:
class BundleOptimizationPlan {
  analyze() {
    // 1. Identify unnecessary inclusions
    // 2. Find opportunities for code splitting
    // 3. Detect unused dependencies
    // 4. Plan loading strategies
  }

  implement() {
    // Your implementation here
  }
}
```


**Expected Outcome**:


- Reduce main bundle từ 1.8MB → 600KB
- Implement route-based code splitting
- Add proper caching strategies
- Create performance monitoring


#### 🛠️ Exercise 2: Micro-frontend Module Integration


**Scenario**: You need to integrate 3 independent micro-frontends:


1. **Shopping Cart** (React, port 3001)
2. **Product Catalog** (Vue.js, port 3002)
3. **User Dashboard** (Angular, port 3003)


**Task**: Design module federation setup with:


- Shared design system
- Cross-application state management
- Error isolation
- Performance optimization


```javascript
// Your solution template:
class MicroFrontendIntegration {
  constructor() {
    this.apps = new Map();
    this.sharedState = new SharedStateManager();
    this.eventBus = new CrossAppEventBus();
  }

  setupModuleFederation() {
    // Configure webpack module federation
  }

  handleCrossAppCommunication() {
    // Design communication patterns
  }

  implementErrorBoundaries() {
    // Isolate failures
  }

  optimizeSharedDependencies() {
    // Manage shared libraries
  }
}
```


#### 🛠️ Exercise 3: Dynamic Module Loading System


**Scenario**: Build a plugin system where modules can be loaded dynamically based on user permissions và features enabled.


**Requirements**:


- Load modules only when needed
- Handle loading failures gracefully
- Implement caching và invalidation
- Provide developer API


```javascript
// Your plugin system:
class DynamicPluginSystem {
  async loadPlugin(pluginId, userPermissions) {
```


## Claude


```javascript
// Your plugin system:
class DynamicPluginSystem {
  constructor() {
    this.loadedPlugins = new Map();
    this.pluginRegistry = new Map();
    this.permissionManager = new PluginPermissionManager();
    this.cacheManager = new PluginCacheManager();
  }

  async loadPlugin(pluginId, userPermissions) {
    // 1. Check permissions
    if (!this.permissionManager.canLoad(pluginId, userPermissions)) {
      throw new Error(`Insufficient permissions for plugin: ${pluginId}`);
    }

    // 2. Check cache
    if (this.loadedPlugins.has(pluginId)) {
      return this.loadedPlugins.get(pluginId);
    }

    // 3. Load với error handling
    try {
      const plugin = await this.loadPluginModule(pluginId);

      // 4. Initialize plugin
      const initializedPlugin = await this.initializePlugin(plugin, userPermissions);

      // 5. Cache result
      this.loadedPlugins.set(pluginId, initializedPlugin);

      return initializedPlugin;

    } catch (error) {
      console.error(`Failed to load plugin ${pluginId}:`, error);

      // Fallback strategy
      return this.loadFallbackPlugin(pluginId);
    }
  }

  async loadPluginModule(pluginId) {
    const pluginInfo = this.pluginRegistry.get(pluginId);
    if (!pluginInfo) {
      throw new Error(`Plugin not found: ${pluginId}`);
    }

    // Dynamic import với timeout
    const timeout = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Plugin load timeout')), 10000);
    });

    const loadPromise = import(pluginInfo.moduleUrl);

    return Promise.race([loadPromise, timeout]);
  }

  async initializePlugin(plugin, userPermissions) {
    // Plugin lifecycle: validate → configure → initialize
    if (typeof plugin.default?.initialize !== 'function') {
      throw new Error('Plugin missing initialize method');
    }

    const config = this.generatePluginConfig(userPermissions);
    return await plugin.default.initialize(config);
  }

  unloadPlugin(pluginId) {
    const plugin = this.loadedPlugins.get(pluginId);
    if (plugin && typeof plugin.cleanup === 'function') {
      plugin.cleanup();
    }

    this.loadedPlugins.delete(pluginId);
    this.cacheManager.invalidate(pluginId);
  }

  // Developer API
  registerPlugin(pluginId, config) {
    this.pluginRegistry.set(pluginId, {
      moduleUrl: config.moduleUrl,
      permissions: config.requiredPermissions,
      dependencies: config.dependencies || [],
      version: config.version
    });
  }

  // Plugin health monitoring
  getPluginHealth() {
    const health = {
      totalPlugins: this.pluginRegistry.size,
      loadedPlugins: this.loadedPlugins.size,
      failedPlugins: [],
      memoryUsage: this.calculatePluginMemoryUsage()
    };

    return health;
  }
}

// Usage example:
const pluginSystem = new DynamicPluginSystem();

// Register plugins
pluginSystem.registerPlugin('analytics-dashboard', {
  moduleUrl: '/plugins/analytics-dashboard.js',
  requiredPermissions: ['analytics:read'],
  dependencies: ['chart-library'],
  version: '1.2.0'
});

// Load plugin based on user role
async function loadUserPlugins(userRole) {
  const permissions = await getUserPermissions(userRole);

  if (permissions.includes('analytics:read')) {
    const analytics = await pluginSystem.loadPlugin('analytics-dashboard', permissions);
    analytics.render(document.getElementById('analytics-container'));
  }
}
```


**Expected Implementation Details:**


- Permission-based loading mechanism
- Graceful error handling với fallbacks
- Plugin lifecycle management (initialize, cleanup)
- Memory monitoring và optimization
- Developer-friendly API


---


## Phần VI: PRODUCTION READINESS CHECKLIST


### 📖 Pre-deployment Verification


#### ✅ Performance Checklist


**Bundle Analysis:**


```javascript
// Performance thresholds (production-ready standards)
const PERFORMANCE_THRESHOLDS = {
  // Bundle sizes
  mainBundle: 250 * 1024,        // 250KB max
  vendorBundle: 500 * 1024,      // 500KB max
  featureChunks: 100 * 1024,     // 100KB max per chunk

  // Loading times (on 3G)
  initialLoad: 3000,             // 3s max
  chunkLoad: 1000,               // 1s max per chunk

  // Error rates
  moduleLoadFailure: 0.1,        // 0.1% max failure rate

  // Cache hit rates
  moduleCache: 90,               // 90% min cache hit rate
};

class ProductionReadinessChecker {
  async checkBundleSizes() {
    const bundleStats = await this.getBundleStats();

    const issues = [];

    if (bundleStats.main > PERFORMANCE_THRESHOLDS.mainBundle) {
      issues.push(`Main bundle too large: ${this.formatSize(bundleStats.main)}`);
    }

    if (bundleStats.vendor > PERFORMANCE_THRESHOLDS.vendorBundle) {
      issues.push(`Vendor bundle too large: ${this.formatSize(bundleStats.vendor)}`);
    }

    bundleStats.chunks.forEach(chunk => {
      if (chunk.size > PERFORMANCE_THRESHOLDS.featureChunks) {
        issues.push(`Chunk ${chunk.name} too large: ${this.formatSize(chunk.size)}`);
      }
    });

    return {
      passed: issues.length === 0,
      issues,
      recommendations: this.generateSizeRecommendations(bundleStats)
    };
  }

  async checkLoadingPerformance() {
    const metrics = await this.runPerformanceTests();

    return {
      initialLoad: {
        actual: metrics.initialLoad,
        threshold: PERFORMANCE_THRESHOLDS.initialLoad,
        passed: metrics.initialLoad <= PERFORMANCE_THRESHOLDS.initialLoad
      },
      chunkLoading: {
        average: metrics.averageChunkLoad,
        threshold: PERFORMANCE_THRESHOLDS.chunkLoad,
        passed: metrics.averageChunkLoad <= PERFORMANCE_THRESHOLDS.chunkLoad
      }
    };
  }

  generateSizeRecommendations(bundleStats) {
    const recommendations = [];

    // Analyze large dependencies
    const largeDeps = bundleStats.dependencies
      .filter(dep => dep.size > 50 * 1024)
      .sort((a, b) => b.size - a.size);

    largeDeps.forEach(dep => {
      recommendations.push({
        type: 'dependency',
        target: dep.name,
        size: dep.size,
        suggestions: [
          `Consider lighter alternative to ${dep.name}`,
          `Use tree shaking to reduce ${dep.name} footprint`,
          `Load ${dep.name} dynamically if not critical`
        ]
      });
    });

    return recommendations;
  }
}
```


**Security Checklist:**


```javascript
class ModuleSecurityChecker {
  checkDependencyVulnerabilities() {
    // Integration với npm audit, Snyk, etc.
    return {
      vulnerabilities: this.scanVulnerabilities(),
      outdatedPackages: this.checkOutdatedPackages(),
      licenseIssues: this.checkLicenseCompliance()
    };
  }

  validateModuleIntegrity() {
    // Check subresource integrity
    const checks = {
      sri: this.validateSRI(),
      csp: this.validateCSP(),
      moduleSignature: this.validateModuleSignatures()
    };

    return checks;
  }

  auditDynamicImports() {
    // Scan for potential injection vulnerabilities
    const dynamicImports = this.findDynamicImports();
    const vulnerableImports = [];

    dynamicImports.forEach(importStatement => {
      if (this.hasUserInput(importStatement)) {
        vulnerableImports.push({
          location: importStatement.location,
          risk: 'Code injection possible',
          fix: 'Validate input or use allowlist'
        });
      }
    });

    return vulnerableImports;
  }
}
```


#### ✅ Monitoring & Observability Setup


**Real User Monitoring (RUM):**


```javascript
class ModuleRUMCollector {
  constructor() {
    this.setupPerformanceObserver();
    this.setupErrorTracking();
    this.setupUserJourneyTracking();
  }

  setupPerformanceObserver() {
    if ('PerformanceObserver' in window) {
      // Track module loading performance
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (this.isModuleEntry(entry)) {
            this.trackModuleMetrics(entry);
          }
        }
      });

      observer.observe({ entryTypes: ['resource', 'navigation'] });
    }
  }

  trackModuleMetrics(entry) {
    const metrics = {
      moduleUrl: entry.name,
      loadTime: entry.responseEnd - entry.requestStart,
      transferSize: entry.transferSize,
      encodedBodySize: entry.encodedBodySize,
      timestamp: entry.startTime,

      // Network conditions
      connection: this.getConnectionInfo(),

      // User context
      userAgent: navigator.userAgent,
      viewport: `${window.innerWidth}x${window.innerHeight}`,

      // Performance context
      memoryUsage: this.getMemoryInfo(),
      cpuInfo: this.getCPUInfo()
    };

    this.sendMetrics('module_load_performance', metrics);
  }

  setupErrorTracking() {
    // Track module loading errors
    window.addEventListener('error', (event) => {
      if (this.isModuleError(event)) {
        this.trackModuleError(event);
      }
    });

    // Track promise rejections from dynamic imports
    window.addEventListener('unhandledrejection', (event) => {
      if (this.isModulePromiseRejection(event)) {
        this.trackModulePromiseError(event);
      }
    });
  }

  setupUserJourneyTracking() {
    // Track which modules users actually use
    this.trackModuleUsage();
    this.trackUserFlows();
    this.trackFeatureAdoption();
  }

  generateRUMReport() {
    return {
      performance: this.getPerformanceInsights(),
      errors: this.getErrorAnalysis(),
      usage: this.getUsagePatterns(),
      opportunities: this.getOptimizationOpportunities()
    };
  }
}
```


**Alerting & Dashboards:**


```javascript
class ModuleAlertingSystem {
  constructor() {
    this.thresholds = {
      errorRate: 1.0,           // 1% error rate
      loadTime: 3000,           // 3s load time
      bundleSize: 500 * 1024,   // 500KB bundle size
      memoryLeak: 50 * 1024 * 1024 // 50MB memory growth
    };

    this.setupAlerts();
  }

  setupAlerts() {
    // Error rate monitoring
    this.monitorErrorRate();

    // Performance degradation monitoring
    this.monitorPerformance();

    // Bundle size monitoring
    this.monitorBundleSize();

    // Memory leak detection
    this.monitorMemoryUsage();
  }

  monitorErrorRate() {
    setInterval(() => {
      const errorRate = this.calculateErrorRate();

      if (errorRate > this.thresholds.errorRate) {
        this.triggerAlert({
          type: 'high_error_rate',
          severity: 'critical',
          value: errorRate,
          threshold: this.thresholds.errorRate,
          affectedModules: this.getFailingModules()
        });
      }
    }, 60000); // Check every minute
  }

  triggerAlert(alert) {
    // Send to multiple channels
    this.sendToSlack(alert);
    this.sendToPagerDuty(alert);
    this.logToSystem(alert);

    // Auto-remediation for known issues
    this.attemptAutoRemediation(alert);
  }

  attemptAutoRemediation(alert) {
    switch (alert.type) {
      case 'high_error_rate':
        // Switch to fallback CDN
        this.switchToCDNFallback();
        break;

      case 'slow_performance':
        // Enable aggressive caching
        this.enableAggressiveCaching();
        break;

      case 'memory_leak':
        // Force garbage collection
        this.forceModuleCleanup();
        break;
    }
  }
}
```


### 📖 Deployment Strategies


#### 🚀 Progressive Module Deployment


**Feature Flag Integration:**


```javascript
class ProgressiveModuleDeployment {
  constructor() {
    this.featureFlags = new FeatureFlagManager();
    this.userSegments = new UserSegmentManager();
    this.rolloutStrategy = new RolloutStrategy();
  }

  async loadModule(moduleId, userId) {
    // Check feature flag
    const isEnabled = await this.featureFlags.isEnabled(
      `module_${moduleId}`,
      userId
    );

    if (!isEnabled) {
      return this.loadLegacyModule(moduleId);
    }

    // Progressive rollout
    const rolloutPercentage = await this.featureFlags.getRolloutPercentage(
      `module_${moduleId}`
    );

    const userSegment = await this.userSegments.getUserSegment(userId);

    if (this.shouldLoadNewModule(rolloutPercentage, userSegment)) {
      try {
        return await this.loadNewModule(moduleId);
      } catch (error) {
        // Automatic fallback on error
        this.reportDeploymentError(moduleId, error);
        return this.loadLegacyModule(moduleId);
      }
    }

    return this.loadLegacyModule(moduleId);
  }

  shouldLoadNewModule(rolloutPercentage, userSegment) {
    // Beta users always get new modules
    if (userSegment.includes('beta')) {
      return true;
    }

    // Internal users get early access
    if (userSegment.includes('internal')) {
      return rolloutPercentage > 0;
    }

    // Regular users get gradual rollout
    const userHash = this.hashUserId(userId);
    return (userHash % 100) < rolloutPercentage;
  }

  async monitorDeployment(moduleId) {
    const metrics = {
      newModulePerformance: await this.getModuleMetrics(moduleId, 'new'),
      legacyModulePerformance: await this.getModuleMetrics(moduleId, 'legacy'),
      errorRates: await this.getErrorRates(moduleId),
      userSatisfaction: await this.getUserFeedback(moduleId)
    };

    // Auto-rollback on issues
    if (this.shouldRollback(metrics)) {
      await this.initiateRollback(moduleId);
    }

    return metrics;
  }

  shouldRollback(metrics) {
    const newErrorRate = metrics.errorRates.new;
    const legacyErrorRate = metrics.errorRates.legacy;

    // Rollback if new version has significantly higher error rate
    if (newErrorRate > legacyErrorRate * 2 && newErrorRate > 1.0) {
      return true;
    }

    // Rollback if performance is significantly worse
    const performanceDegradation =
      metrics.newModulePerformance.avgLoadTime /
      metrics.legacyModulePerformance.avgLoadTime;

    if (performanceDegradation > 1.5) {
      return true;
    }

    return false;
  }
}
```


**Blue-Green Module Deployment:**


```javascript
class BlueGreenModuleDeployment {
  constructor() {
    this.environments = {
      blue: { active: true, version: '1.0.0' },
      green: { active: false, version: '1.1.0' }
    };

    this.router = new ModuleRouter();
    this.healthChecker = new ModuleHealthChecker();
  }

  async deployToGreen(newModules) {
    console.log('🟢 Starting green deployment...');

    try {
      // 1. Deploy to green environment
      await this.deployModules('green', newModules);

      // 2. Run health checks
      const healthCheck = await this.healthChecker.check('green');

      if (!healthCheck.passed) {
        throw new Error(`Health check failed: ${healthCheck.issues.join(', ')}`);
      }

      // 3. Run integration tests
      const integrationTests = await this.runIntegrationTests('green');

      if (!integrationTests.passed) {
        throw new Error(`Integration tests failed: ${integrationTests.failures}`);
      }

      // 4. Canary testing với small percentage
      await this.startCanaryTesting('green', 5); // 5% traffic

      console.log('✅ Green deployment successful');

    } catch (error) {
      console.error('❌ Green deployment failed:', error);
      await this.cleanupFailedDeployment('green');
      throw error;
    }
  }

  async switchTraffic() {
    console.log('🔄 Switching traffic from blue to green...');

    const phases = [10, 25, 50, 75, 100]; // Gradual traffic shift

    for (const percentage of phases) {
      // Route percentage of traffic to green
      await this.router.setTrafficSplit({
        blue: 100 - percentage,
        green: percentage
      });

      // Monitor for issues
      await this.monitorPhase(percentage);

      // Wait before next phase
      await this.delay(300000); // 5 minutes between phases
    }

    // Mark green as active
    this.environments.green.active = true;
    this.environments.blue.active = false;

    console.log('✅ Traffic switch completed');
  }

  async monitorPhase(percentage) {
    const monitoringDuration = 300000; // 5 minutes
    const startTime = Date.now();

    while (Date.now() - startTime < monitoringDuration) {
      const metrics = await this.getEnvironmentMetrics();

      if (this.detectIssues(metrics)) {
        throw new Error(`Issues detected at ${percentage}% traffic`);
      }

      await this.delay(30000); // Check every 30 seconds
    }
  }

  async rollback() {
    console.log('🔴 Initiating rollback to blue...');

    // Immediate traffic switch back to blue
    await this.router.setTrafficSplit({
      blue: 100,
      green: 0
    });

    // Mark blue as active again
    this.environments.blue.active = true;
    this.environments.green.active = false;

    console.log('✅ Rollback completed');
  }
}
```


💭 **Production experience tại Figma**: Chúng tôi learned the hard way rằng module deployments cần extra care. Một lần, chúng tôi deploy new collaboration features và break existing documents cho 15% users. Từ đó, chúng tôi always use progressive rollouts với automatic rollback triggers.


---


## Kết Luận: Mastering Module Pattern Journey


### 🎯 Key Takeaways


Sau khi đi qua comprehensive journey này về Module Pattern trong JavaScript, đây là những insights quan trọng nhất mà bạn cần nhớ:


#### 🧠 Mental Models


**1. Module as Encapsulated Universe:**
Mỗi module là một universe riêng biệt với laws of physics riêng (scope rules). Chỉ có những gì được explicitly exported mới có thể "escape" universe này.


**2. Import/Export as Contracts:**
Imports và exports tạo ra contracts giữa modules. Live bindings đảm bảo rằng contracts này được honored và updated real-time.


**3. Bundle as City Planning:**
Bundling giống như city planning - bạn cần balance giữa convenience (fewer requests) và efficiency (smaller payloads). Code splitting giống như xây metro system để people có thể reach destinations efficiently.


#### 🏗️ Architecture Principles


**1. Progressive Enhancement:**


- Start với static imports cho critical functionality
- Add dynamic imports cho optional features
- Implement fallbacks cho everything


**2. Performance by Design:**


- Bundle size affects user experience more than code elegance
- Every module load is a user waiting
- Cache invalidation is harder than naming things


**3. Resilience First:**


- Networks are unreliable
- Modules will fail to load
- Users will have poor connections
- Plan for failure, not just success


### 🚀 Next Steps in Your Journey


#### For Junior/Mid Developers:


1. **Practice Module Refactoring**: Take một existing codebase và break it into proper modules
2. **Study Bundle Analyzer**: Understand what goes into your bundles
3. **Implement Error Boundaries**: Practice graceful failure handling


#### For Senior Developers:


1. **Design Module Architecture**: Plan module boundaries cho large applications
2. **Optimize Performance**: Achieve significant bundle size reductions
3. **Implement Advanced Patterns**: Module federation, dynamic loading strategies


#### For Principal Engineers:


1. **Build Infrastructure**: Create tooling cho module optimization
2. **Establish Standards**: Define module patterns cho your organization
3. **Mentor Others**: Share knowledge về production module patterns


### 📚 Recommended Learning Path


**Phase 1: Foundation Mastery**


- ES2015 Modules specification deep dive
- Bundler internals (Webpack, Rollup, Vite)
- Performance measurement tools


**Phase 2: Advanced Patterns**


- Module federation hands-on projects
- Micro-frontend architecture
- Dynamic loading optimization


**Phase 3: Production Excellence**


- Monitoring và alerting setup
- Deployment strategy implementation
- Error handling và resilience patterns


### 🔮 Future of Module Pattern


**Emerging Trends to Watch:**


1. **HTTP/3 và Module Loading**: Multiplexing will change optimal bundling strategies
2. **WebAssembly Modules**: WASM modules will become first-class citizens
3. **Edge Computing**: Module loading will happen closer to users
4. **AI-Optimized Bundling**: ML will predict optimal module loading patterns


**Preparing for the Future:**


- Keep module boundaries clean và well-defined
- Invest trong monitoring và observability
- Build flexible loading strategies
- Focus on user experience metrics


### 💭 Final Thoughts


Module Pattern không chỉ là syntax hay technical implementation - nó là foundation của how we structure, scale, và deliver modern web applications. Mastering modules means mastering the art of **progressive complexity management**.


Remember: **Good module architecture is invisible to users but invaluable to developers.**


Những patterns và techniques trong guide này được battle-tested trong production environments tại các companies như NAB, Axon, Binance, Webflow, và Figma. Chúng represent real-world solutions to real-world problems.


**The journey of mastering modules never truly ends** - browsers evolve, standards improve, và new challenges emerge. But với solid foundation trong principles và patterns covered here, bạn sẽ be ready để adapt và excel trong any module-related challenge.


Keep learning, keep building, và remember - every great application starts với well-designed modules. 🚀


---


**Happy Coding!**
*From a fellow engineer who has debugged countless module issues at 2 AM in production* 😅
