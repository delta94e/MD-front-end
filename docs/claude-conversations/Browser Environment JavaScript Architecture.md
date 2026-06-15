# Browser Environment JavaScript Architecture

## You

Continue

## You

Continue

## Claude


# Phân Tích Chuyên Sâu: Browser Environment, Specs & JavaScript Platform Architecture


*Từ góc nhìn Principal Front-end Engineer với kinh nghiệm NAB, Axon, Binance, Webflow, Figma*


---


## 🎯 Tổng Quan & Context Setting


Chào các bạn developers! Hôm nay tôi sẽ cùng các bạn deep dive vào một trong những foundation concepts quan trọng nhất của web development - **Browser Environment & Specifications**. Đây là tài liệu từ JavaScript.info về cách JavaScript hoạt động trong browser environment, và tôi sẽ phân tích nó từ góc độ của một Principal Engineer với hơn 10 năm kinh nghiệm tại các công ty lớn.


💭 **Principal's Opening Thoughts:**
*Khi tôi nhìn vào bài viết này, tôi immediately recognize đây là một foundational piece mà mọi front-end engineer cần hiểu thoroughly. Nhưng thực tế, qua kinh nghiệm mentor junior engineers tại NAB và Binance, tôi thấy 80% developers chỉ understand surface level. Họ biết sử dụng window.document nhưng không hiểu tại sao nó tồn tại, cách browser construct nó, và implications khi scale.*


### 🌱 Nguồn Gốc & Historical Context


**Câu hỏi đầu tiên:** Tại sao chúng ta cần hiểu về Browser Environment?


Để trả lời câu hỏi này, chúng ta cần travel back in time đến năm 1995. Khi Brendan Eich tạo ra JavaScript tại Netscape, ông không chỉ tạo ra một programming language - ông tạo ra một **ecosystem**.


🔬 **First Principles Breakdown:**


**Problem Statement (1995):**


- Web pages lúc đó chỉ là static HTML
- Không có cách nào để interact với user dynamically
- Server-side processing chậm và require full page reload
- Need for client-side scripting language


**Why JavaScript + Browser Environment?**
JavaScript được thiết kế không phải như một standalone language (như C++ hay Java), mà như một **hosted language**. Concept của "host environment" là revolutionary vì:


1. **Separation of Concerns:** Language core (ECMAScript) tách biệt với platform-specific APIs
2. **Extensibility:** Mỗi host environment có thể provide custom objects/functions
3. **Security:** Browser có thể control access to system resources


---


## 📖 PHẦN I: WINDOW OBJECT - THE UNIVERSAL ENTRY POINT


### 🌱 Nguồn Gốc & Motivation


💭 **Think Out Loud:**
*Khi tôi first time encounter window object năm 2012, tôi rất confused về dual nature của nó. Tại sao nó vừa là global object, vừa represent browser window? Breakthrough moment của tôi là khi debug một memory leak tại NAB project và realize rằng every variable declaration without var/let/const becomes a property of window object.*


**Historical Context:**
Window object được introduce trong Netscape Navigator 2.0 (1996). Lúc đó, web developers cần:


- Access browser functionality (như navigate, resize window)
- Global scope cho JavaScript variables
- Communication between frames


**Problem Solving:**
Trước window object, developers không có cách nào để:


- Control browser behavior programmatically
- Share data between different scripts
- Access browser information


### 🔬 Bản Chất & Core Mechanism


**Window Object's Dual Nature - Deep Analysis:**


```javascript
// Nature 1: Global Object
var globalVar = "Hello World";
console.log(window.globalVar); // "Hello World"

// Nature 2: Browser Window Representation
console.log(window.innerWidth); // Browser window width
console.log(window.location.href); // Current URL
```


🔍 **Step-by-step Execution Analysis:**


Khi browser khởi tạo một page:


1. **JavaScript Engine Initialization:**

V8 (Chrome) tạo ra execution context
Global object được create (trong browser = window)
Built-in objects (Array, Object, Function) được attach
2. **Browser APIs Injection:**

Browser inject browser-specific APIs vào window
DOM APIs (document, HTMLElement)
BOM APIs (navigator, location, history)
Web APIs (fetch, localStorage, setTimeout)
3. **Property Descriptor Analysis:**


```javascript
// Let's analyze window properties deeply
Object.getOwnPropertyDescriptor(window, 'document');
// Returns: { value: #document, writable: false, enumerable: true, configurable: false }

Object.getOwnPropertyDescriptor(window, 'innerWidth');
// Returns: { get: function(), set: undefined, enumerable: true, configurable: true }
```


### ⚙️ Implementation Deep Dive


**Memory Model Analysis:**


Trong browser engine (Blink + V8), window object được implement như:


```cpp
// Pseudo C++ implementation
class Window : public EventTarget {
private:
    Document* document_;
    Navigator* navigator_;
    Location* location_;
    int inner_width_;
    int inner_height_;

public:
    // Global object functionality
    void SetGlobalProperty(const String& name, v8::Local<v8::Value> value);
    v8::Local<v8::Value> GetGlobalProperty(const String& name);

    // Browser window functionality
    int GetInnerWidth() const { return inner_width_; }
    void Resize(int width, int height);
};
```


**Performance Characteristics:**


- **Property Access Time:** O(1) cho direct properties, O(log n) cho prototype chain
- **Memory Overhead:** ~2KB base size + dynamic properties
- **GC Impact:** Window object never được garbage collected (global reference)


💭 **Production Reality Insight:**
*Tại Binance, chúng tôi gặp performance issue với window object pollution. Third-party scripts tạo ra thousands of global variables, causing memory bloat và slower property lookups. Solution: namespace pattern và strict ESLint rules.*


### 🏭 Production Engineering Perspectives


**Scale Considerations:**


1. **Global Namespace Pollution:**


```javascript
// ❌ Bad: Pollutes global namespace
var userConfig = { theme: 'dark' };
var apiEndpoint = 'https://api.example.com';

// ✅ Good: Namespace pattern
window.MyApp = {
  config: { theme: 'dark' },
  constants: { API_ENDPOINT: 'https://api.example.com' }
};
```


1. **Memory Management:**


```javascript
// ❌ Memory leak potential
window.onload = function() {
  // Large object attached to window - never GC'd
  window.largeData = new Array(1000000).fill('data');
};

// ✅ Proper cleanup
const AppController = {
  init() {
    this.data = new Array(1000000).fill('data');
    window.addEventListener('beforeunload', () => this.cleanup());
  },
  cleanup() {
    this.data = null;
  }
};
```


**Common Pitfalls từ kinh nghiệm thực tế:**


**Pitfall 1: Implicit Global Creation**


```javascript
// Tại Webflow project, junior developer viết:
function processData() {
  result = []; // ❌ Accidentally creates window.result
  // ... processing logic
  return result;
}

// Solution: Always use declarations
function processData() {
  const result = []; // ✅ Block-scoped
  // ... processing logic
  return result;
}
```


**Pitfall 2: Window Object Detection:**


```javascript
// ❌ Unreliable in different environments
if (typeof window !== 'undefined') {
  // Browser code
}

// ✅ More robust detection
const isWindowAvailable = (() => {
  try {
    return typeof window !== 'undefined' && window.window === window;
  } catch (e) {
    return false;
  }
})();
```


### 💭 Deep Understanding Process


**Debugging Mental Model:**


Khi tôi debug window-related issues, tôi follow pattern này:


1. **Window Property Inspection:**


```javascript
// Debug helper function tôi always sử dụng
function debugWindowProperties() {
  const props = Object.getOwnPropertyNames(window);
  const custom = props.filter(prop =>
    !prop.startsWith('webkit') &&
    !prop.startsWith('moz') &&
    !['document', 'navigator', 'location'].includes(prop)
  );
  console.table(custom.map(prop => ({
    property: prop,
    type: typeof window[prop],
    descriptor: Object.getOwnPropertyDescriptor(window, prop)
  })));
}
```


1. **Memory Analysis:**


```javascript
// Monitor window object size growth
function monitorWindowSize() {
  const initialProps = Object.getOwnPropertyNames(window).length;
  return {
    check() {
      const currentProps = Object.getOwnPropertyNames(window).length;
      console.log(`Window properties grew by: ${currentProps - initialProps}`);
    }
  };
}
```


**Aha Moments từ Experience:**


💡 **Moment 1 - Tại NAB (2018):**
*Discover rằng window.name persists across page navigations và có thể dùng cho cross-page communication. Điều này lead đến breakthrough trong implement persistent user preferences.*


💡 **Moment 2 - Tại Axon (2020):**
*Realize rằng window object trong iframes có separate global scope nhưng share same prototype chain. This insight helped resolve complex iframe communication issues.*


---


## 📖 PHẦN II: DOM (DOCUMENT OBJECT MODEL) - THE PAGE CONTENT UNIVERSE


### 🌱 Nguồn Gốc & Historical Evolution


💭 **Personal Learning Journey:**
*DOM là concept đầu tiên khiến tôi truly appreciate elegance của web architecture. Nhưng journey để hiểu DOM deeply mất gần 2 năm. Initial confusion: tại sao element.innerHTML khác với element.textContent? Breakthrough: khi understand DOM như một live data structure, not static HTML.*


**Historical Timeline:**


- **1995:** HTML as markup language
- **1998:** DOM Level 1 - standardized document manipulation
- **2000:** DOM Level 2 - events and CSS manipulation
- **2004:** DOM Level 3 - enhanced navigation and validation
- **2012:** DOM Living Standard - continuous evolution


**Problem Statement Pre-DOM:**


Trước DOM, web developers cannot:


- Dynamically modify page content
- Respond to user interactions
- Create interactive applications
- Manipulate HTML structure programmatically


**Solution Architecture:**


DOM provides:


1. **Tree-based representation** của HTML document
2. **Live interface** for content manipulation
3. **Event system** for user interaction
4. **Standardized API** across browsers


### 🔬 Core Mechanism & Data Structure Analysis


**DOM Tree Structure - Deep Dive:**


```javascript
// Visualizing DOM tree structure
function visualizeDOMTree(element, depth = 0) {
  const indent = '  '.repeat(depth);
  console.log(`${indent}${element.nodeName} (${element.nodeType})`);

  if (element.attributes) {
    Array.from(element.attributes).forEach(attr => {
      console.log(`${indent}  @${attr.name}="${attr.value}"`);
    });
  }

  element.childNodes.forEach(child => {
    if (child.nodeType === Node.ELEMENT_NODE) {
      visualizeDOMTree(child, depth + 1);
    } else if (child.nodeType === Node.TEXT_NODE && child.textContent.trim()) {
      console.log(`${indent}  TEXT: "${child.textContent.trim()}"`);
    }
  });
}

// Usage
visualizeDOMTree(document.body);
```


**Memory Model & Browser Implementation:**


```cpp
// Pseudo browser engine implementation
class Element : public Node {
private:
    String tag_name_;
    AttributeMap attributes_;
    Vector<Node*> children_;
    Element* parent_;
    ComputedStyle* computed_style_;
    LayoutObject* layout_object_;

public:
    // Core DOM methods
    Element* getElementById(const String& id);
    NodeList* getElementsByTagName(const String& tag);
    void appendChild(Node* child);
    void removeChild(Node* child);

    // Performance-critical methods
    void SetInnerHTML(const String& html); // Triggers parsing
    String GetInnerHTML() const;           // Serializes tree
    void SetTextContent(const String& text); // Direct text manipulation
};
```


**Performance Characteristics Analysis:**


```
getElementByIdgetElementsByTagNamequerySelectorappendChildinnerHTMLtextContent
```


### 💡 Intuitive Understanding Through Analogies


**DOM Tree như File System:**


```javascript
// DOM navigation giống file system navigation
// document.body == root directory "/"
// element.children == subdirectories
// element.textContent == file content
// element.getAttribute() == file metadata

// Navigating DOM like file paths
const navigateDOM = (path) => {
  return path.split('/').reduce((current, segment) => {
    if (segment === '..') return current.parentElement;
    if (segment === '.') return current;
    return current.querySelector(segment);
  }, document.body);
};

// Usage: navigateDOM('div/span/..')
```


**DOM Mutations như Database Transactions:**


```javascript
// DOM mutations should be batched like DB transactions
class DOMTransaction {
  constructor() {
    this.operations = [];
  }

  add(operation) {
    this.operations.push(operation);
    return this;
  }

  commit() {
    // Batch DOM operations to minimize reflows
    const fragment = document.createDocumentFragment();
    this.operations.forEach(op => op(fragment));
    document.body.appendChild(fragment);
  }
}

// Usage
new DOMTransaction()
  .add(fragment => {
    const div = document.createElement('div');
    div.textContent = 'Item 1';
    fragment.appendChild(div);
  })
  .add(fragment => {
    const div = document.createElement('div');
    div.textContent = 'Item 2';
    fragment.appendChild(div);
  })
  .commit();
```


### ⚙️ Advanced Implementation Deep Dive


**Browser Rendering Pipeline Integration:**


```javascript
// Understanding critical rendering path impact
class DOMPerformanceAnalyzer {
  static measureDOMOperation(operation, name) {
    performance.mark(`${name}-start`);

    const result = operation();

    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);

    const measure = performance.getEntriesByName(name)[0];
    console.log(`${name}: ${measure.duration}ms`);

    return result;
  }

  static analyzeReflow(operation) {
    const initialHeight = document.body.offsetHeight;

    const result = this.measureDOMOperation(operation, 'dom-mutation');

    const finalHeight = document.body.offsetHeight;

    if (initialHeight !== finalHeight) {
      console.warn('Operation triggered reflow');
    }

    return result;
  }
}

// Usage
DOMPerformanceAnalyzer.analyzeReflow(() => {
  const div = document.createElement('div');
  div.style.height = '100px';
  document.body.appendChild(div);
});
```


**Event Delegation & Performance:**


```javascript
// Advanced event delegation pattern
class EventDelegator {
  constructor(container) {
    this.container = container;
    this.handlers = new Map();

    // Single event listener for all events
    this.container.addEventListener('click', this.handleClick.bind(this));
  }

  on(selector, handler) {
    if (!this.handlers.has(selector)) {
      this.handlers.set(selector, []);
    }
    this.handlers.get(selector).push(handler);
  }

  handleClick(event) {
    // Use Element.matches() for efficient selector matching
    for (const [selector, handlers] of this.handlers) {
      if (event.target.matches(selector)) {
        handlers.forEach(handler => handler(event));
      }
    }
  }
}

// Production usage tại Figma project
const appDelegator = new EventDelegator(document.body);
appDelegator.on('.button', handleButtonClick);
appDelegator.on('.link', handleLinkClick);
appDelegator.on('[data-action]', handleActionClick);
```


### 🏭 Production Engineering Deep Dive


**Real-world Challenge từ Binance Trading Platform:**


**Problem:** Real-time price updates for 500+ trading pairs causing severe performance degradation.


**Root Cause Analysis:**


```javascript
// ❌ Naive approach causing performance issues
function updatePrices(priceData) {
  priceData.forEach(price => {
    const element = document.getElementById(`price-${price.symbol}`);
    element.textContent = price.value; // Triggers layout recalculation
    element.className = price.change > 0 ? 'positive' : 'negative'; // More layout
  });
}
```


**Solution - Batched DOM Updates:**


```javascript
// ✅ Optimized approach
class PriceUpdateBatcher {
  constructor() {
    this.pendingUpdates = [];
    this.isScheduled = false;
  }

  update(symbol, price, change) {
    this.pendingUpdates.push({ symbol, price, change });

    if (!this.isScheduled) {
      this.isScheduled = true;
      requestAnimationFrame(() => this.flush());
    }
  }

  flush() {
    // Read phase - batch all DOM reads
    const elements = this.pendingUpdates.map(update => ({
      ...update,
      element: document.getElementById(`price-${update.symbol}`)
    }));

    // Write phase - batch all DOM writes
    elements.forEach(({ element, price, change }) => {
      element.textContent = price;
      element.className = change > 0 ? 'positive' : 'negative';
    });

    this.pendingUpdates = [];
    this.isScheduled = false;
  }
}

// Result: 60fps performance với 500+ concurrent updates
```


**Memory Management Best Practices:**


```javascript
// DOM element lifecycle management
class ComponentManager {
  constructor() {
    this.components = new WeakMap();
    this.observers = new Set();
  }

  createComponent(element, data) {
    // Associate data with element using WeakMap
    this.components.set(element, data);

    // Setup MutationObserver for cleanup detection
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        mutation.removedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            this.cleanup(node);
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    this.observers.add(observer);
  }

  cleanup(element) {
    // Automatic cleanup when element removed from DOM
    if (this.components.has(element)) {
      const data = this.components.get(element);
      if (data.destroy) data.destroy();
      this.components.delete(element);
    }
  }

  destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }
}
```


### 💭 Advanced Debugging Strategies


**DOM Debugging Toolkit:**


```javascript
// Complete DOM analysis toolkit
class DOMDebugger {
  // Find memory leaks in DOM references
  static findOrphanedElements() {
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: (node) => {
          // Check for potential memory leak indicators
          if (node._listeners || node.__reactInternalInstance) {
            return NodeFilter.FILTER_ACCEPT;
          }
          return NodeFilter.FILTER_SKIP;
        }
      }
    );

    const orphaned = [];
    let node;
    while (node = walker.nextNode()) {
      if (!document.contains(node)) {
        orphaned.push(node);
      }
    }

    return orphaned;
  }

  // Analyze DOM complexity
  static analyzeDOMComplexity() {
    const stats = {
      totalElements: document.querySelectorAll('*').length,
      maxDepth: 0,
      averageChildren: 0,
      leafNodes: 0
    };

    function traverse(element, depth = 0) {
      stats.maxDepth = Math.max(stats.maxDepth, depth);

      if (element.children.length === 0) {
        stats.leafNodes++;
      } else {
        Array.from(element.children).forEach(child =>
          traverse(child, depth + 1)
        );
      }
    }

    traverse(document.body);
    stats.averageChildren = stats.totalElements / (stats.totalElements - stats.leafNodes);

    return stats;
  }

  // Monitor DOM mutations
  static monitorMutations(callback) {
    const observer = new MutationObserver(mutations => {
      const summary = {
        added: 0,
        removed: 0,
        attributes: 0,
        characterData: 0
      };

      mutations.forEach(mutation => {
        summary[mutation.type === 'childList' ?
          (mutation.addedNodes.length ? 'added' : 'removed') :
          mutation.type
        ]++;
      });

      callback(summary, mutations);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true
    });

    return observer;
  }
}

// Usage trong production debugging
const mutationMonitor = DOMDebugger.monitorMutations((summary, mutations) => {
  if (summary.added > 100) {
    console.warn('High DOM mutation rate detected', summary);
  }
});
```


### 🎯 Interview Questions & Verification Checkpoints


**Principal Level Questions:**


1. **Architecture Design:**

"Thiết kế một virtual DOM implementation. Explain diff algorithm và reconciliation strategy."
"How would you implement efficient DOM recycling for infinite scroll?"
2. **Performance Analysis:**

"Debug performance issue: scrolling lag trong large list. Walk through investigation process."
"Compare memory usage của innerHTML vs createElement approaches."
3. **Browser Internals:**

"Explain critical rendering path và DOM's role trong layout/paint phases."
"How does browser optimize frequent DOM queries?"


**Code Review Red Flags:**


```javascript
// ❌ Red flag 1: Frequent DOM queries
function updateList(items) {
  items.forEach(item => {
    document.getElementById(item.id).textContent = item.name; // Query mỗi loop
  });
}

// ❌ Red flag 2: Synchronous layout thrashing
function resizeElements() {
  elements.forEach(el => {
    el.style.width = el.offsetWidth + 10 + 'px'; // Read-write-read-write
  });
}

// ❌ Red flag 3: Memory leak potential
element.onclick = function() {
  // Closure captures large scope
  heavyData.process();
};
```


---


## 📖 PHẦN III: BOM (BROWSER OBJECT MODEL) - THE BROWSER API UNIVERSE


### 🌱 Nguồn Gốc & Browser Ecosystem Evolution


💭 **Principal's Perspective:**
*BOM là unsung hero của web development. Khi tôi start career, focus chủ yếu vào DOM manipulation. Nhưng qua experience tại Webflow và Figma, tôi realize BOM APIs (navigator, location, history) actually drive user experience. Navigation, device detection, storage management - tất cả critical business logic.*


**Historical Context & Motivation:**


BOM emerged để solve fundamental problems:


1. **Browser Environment Detection:**

Different browsers, different capabilities
Need programmatic access to browser features
User agent detection for compatibility
2. **Navigation & History Management:**

Back/forward button functionality
URL manipulation without page reload
Single Page Application requirements
3. **Device & System Information:**

Screen resolution, platform detection
Network status, geolocation
Storage capabilities


**Why BOM ≠ DOM?**


Critical distinction mà nhiều developers confuse:


- **DOM:** Document structure và content manipulation
- **BOM:** Browser environment và system interaction
- **Web APIs:** Extended functionality (fetch, localStorage, etc.)


### 🔬 Navigator Object - Browser Intelligence Deep Dive


**Core Implementation Analysis:**


```javascript
// Complete navigator object exploration
class NavigatorAnalyzer {
  static getComprehensiveInfo() {
    return {
      // Browser identification
      userAgent: navigator.userAgent,
      vendor: navigator.vendor,
      vendorSub: navigator.vendorSub,
      product: navigator.product,

      // Platform information
      platform: navigator.platform,
      oscpu: navigator.oscpu,
      language: navigator.language,
      languages: navigator.languages,

      // Browser capabilities
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      javaEnabled: navigator.javaEnabled(),

      // Hardware information
      hardwareConcurrency: navigator.hardwareConcurrency,
      deviceMemory: navigator.deviceMemory,
      maxTouchPoints: navigator.maxTouchPoints,

      // Permissions
      permissions: navigator.permissions,

      // Service Worker
      serviceWorker: navigator.serviceWorker,

      // Media devices
      mediaDevices: navigator.mediaDevices
    };
  }

  // Advanced browser detection (replacing user agent sniffing)
  static detectBrowserCapabilities() {
    const capabilities = {};

    // Feature detection over user agent parsing
    capabilities.hasWebGL = (() => {
      try {
        const canvas = document.createElement('canvas');
        return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
      } catch(e) {
        return false;
      }
    })();

    capabilities.hasWebAssembly = (() => {
      try {
        return typeof WebAssembly === 'object' && typeof WebAssembly.instantiate === 'function';
      } catch(e) {
        return false;
      }
    })();

    capabilities.hasServiceWorker = 'serviceWorker' in navigator;
    capabilities.hasIndexedDB = 'indexedDB' in window;
    capabilities.hasLocalStorage = (() => {
      try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        return true;
      } catch(e) {
        return false;
      }
    })();

    return capabilities;
  }
}
```


**Production Implementation - Feature Detection Framework:**


```javascript
// Advanced feature detection system used tại Figma
class FeatureDetector {
  constructor() {
    this.cache = new Map();
    this.detectors = new Map();
    this.initializeDetectors();
  }

  initializeDetectors() {
    // CSS capabilities
    this.detectors.set('css-grid', () => {
      return CSS.supports('display', 'grid');
    });

    this.detectors.set('css-custom-properties', () => {
      return CSS.supports('color', 'var(--test)');
    });

    // JavaScript capabilities
    this.detectors.set('es6-modules', () => {
      return 'import' in document.createElement('script');
    });

    this.detectors.set('intersection-observer', () => {
      return 'IntersectionObserver' in window;
    });

    // Hardware capabilities
    this.detectors.set('high-performance-device', () => {
      return navigator.hardwareConcurrency >= 4 &&
             (navigator.deviceMemory || 4) >= 4;
    });

    // Network capabilities
    this.detectors.set('fast-network', () => {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (!connection) return true; // Assume fast if unknown

      return connection.effectiveType === '4g' ||
             connection.downlink > 1.5;
    });
  }

  async detect(feature) {
    if (this.cache.has(feature)) {
      return this.cache.get(feature);
    }

    const detector = this.detectors.get(feature);
    if (!detector) {
      throw new Error(`Unknown feature: ${feature}`);
    }

    const result = await detector();
    this.cache.set(feature, result);
    return result;
  }

  async detectBatch(features) {
    const results = await Promise.all(
      features.map(async feature => [feature, await this.detect(feature)])
    );
    return Object.fromEntries(results);
  }
}

// Usage trong production
const detector = new FeatureDetector();

// Adaptive loading based on capabilities
async function loadAppropriateAssets() {
  const capabilities = await detector.detectBatch([
    'high-performance-device',
    'fast-network',
    'css-grid',
    'intersection-observer'
  ]);

  if (capabilities['high-performance-device'] && capabilities['fast-network']) {
    // Load full-featured app
    await import('./app-full.js');
  } else {
    // Load lightweight version
    await import('./app-lite.js');
  }
}
```


### 🌍 Location Object - URL Management Mastery


**URL Architecture Deep Analysis:**


```javascript
// Complete URL manipulation toolkit
class URLManager {
  constructor(url = window.location.href) {
    this.url = new URL(url);
  }

  // Advanced query parameter management
  getParams() {
    return Object.fromEntries(this.url.searchParams);
  }

  setParam(key, value) {
    this.url.searchParams.set(key, value);
    return this;
  }

  removeParam(key) {
    this.url.searchParams.delete(key);
    return this;
  }

  // Batch parameter operations
  updateParams(params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === null || value === undefined) {
        this.url.searchParams.delete(key);
      } else {
        this.url.searchParams.set(key, value);
      }
    });
    return this;
  }

  // Navigation utilities
  navigate(options = {}) {
    const { replace = false, state = null } = options;

    if (replace) {
      history.replaceState(state, '', this.url.href);
    } else {
      history.pushState(state, '', this.url.href);
    }
  }

  // URL comparison and validation
  isSameOrigin(otherUrl) {
    const other = new URL(otherUrl, this.url.href);
    return this.url.origin === other.origin;
  }

  isSecure() {
    return this.url.protocol === 'https:';
  }

  // Generate variants
  withProtocol(protocol) {
    const clone = new URLManager(this.url.href);
    clone.url.protocol = protocol;
    return clone;
  }

  withHost(host) {
    const clone = new URLManager(this.url.href);
    clone.url.host = host;
    return clone;
  }

  toString() {
    return this.url.href;
  }
}

// Advanced routing system implementation
class Router {
  constructor() {
    this.routes = new Map();
    this.middleware = [];
    this.currentRoute = null;

    // Listen to navigation events
    window.addEventListener('popstate', this.handlePopState.bind(this));

    // Intercept link clicks
    document.addEventListener('click', this.handleLinkClick.bind(this));
  }

  use(middleware) {
    this.middleware.push(middleware);
  }

  route(pattern, handler) {
    // Convert pattern to regex
    const regex = new RegExp(
      '^' + pattern.replace(/:\w+/g, '([^/]+)').replace(/\*/g, '(.*)') + '$'
    );

    this.routes.set(regex, { pattern, handler });
  }

  async navigate(path, options = {}) {
    const urlManager = new URLManager(path);

    // Run middleware
    for (const middleware of this.middleware) {
      const result = await middleware(urlManager, options);
      if (result === false) return; // Middleware blocked navigation
    }

    // Find matching route
    const route = this.matchRoute(urlManager.url.pathname);
    if (route) {
      this.currentRoute = route;
      urlManager.navigate(options);
      await route.handler(route.params, urlManager);
    } else {
      throw new Error(`No route found for ${path}`);
    }
  }

  matchRoute(pathname) {
    for (const [regex, { pattern, handler }] of this.routes) {
      const match = pathname.match(regex);
      if (match) {
        // Extract parameter names from pattern
        const paramNames = (pattern.match(/:\w+/g) || []).map(p => p.slice(1));
        const params = Object.fromEntries(
          paramNames.map((name, index) => [name, match[index + 1]])
        );

        return { handler, params, pattern };
      }
    }
    return null;
  }

  handlePopState(event) {
    const route = this.matchRoute(location.pathname);
    if (route) {
      this.currentRoute = route;
      route.handler(route.params, new URLManager());
    }
  }

  handleLinkClick(event) {
    const link = event.target.closest('a[href]');
    if (!link) return;

    const href = link.getAttribute('href');
    if (href.startsWith('http') || href.startsWith('//')) return; // External link

    event.preventDefault();
    this.navigate(href);
  }
}
```


**Real-world Implementation tại NAB Banking Platform:**


```javascript
// URL-based state management cho banking dashboard
class DashboardStateManager {
  constructor() {
    this.urlManager = new URLManager();
    this.state = this.parseStateFromURL();

    // Debounced URL updates
    this.updateURL = this.debounce(this.updateURL.bind(this), 300);
  }

  parseStateFromURL() {
    const params = this.urlManager.getParams();

    return {
      account: params.account || 'checking',
      period: params.period || '30d',
      category: params.category ? params.category.split(',') : [],
      sortBy: params.sort || 'date',
      sortOrder: params.order || 'desc',
      page: parseInt(params.page) || 1
    };
  }

  updateState(newState) {
    this.state = { ...this.state, ...newState };
    this.updateURL();

    // Trigger state change event
    window.dispatchEvent(new CustomEvent('dashboard-state-change', {
      detail: { state: this.state }
    }));
  }

  updateURL() {
    const params = {
      account: this.state.account !== 'checking' ? this.state.account : null,
      period: this.state.period !== '30d' ? this.state.period : null,
      category: this.state.category.length ? this.state.category.join(',') : null,
      sort: this.state.sortBy !== 'date' ? this.state.sortBy : null,
      order: this.state.sortOrder !== 'desc' ? this.state.sortOrder : null,
      page: this.state.page !== 1 ? this.state.page : null
    };

    this.urlManager
      .updateParams(params)
      .navigate({ replace: true });
  }

  debounce(func, delay) {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  }

  // Shareable URLs
  getShareableURL() {
    return this.urlManager.toString();
  }

  // Bookmark functionality
  createBookmark(name) {
    const bookmark = {
      name,
      url: this.getShareableURL(),
      state: { ...this.state },
      timestamp: Date.now()
    };

    // Save to localStorage
    const bookmarks = JSON.parse(localStorage.getItem('dashboard-bookmarks') || '[]');
    bookmarks.push(bookmark);
    localStorage.setItem('dashboard-bookmarks', JSON.stringify(bookmarks));

    return bookmark;
  }
}
```


### 📱 Screen & Viewport Management


**Advanced Viewport Detection & Management:**


```javascript
// Comprehensive viewport management system
class ViewportManager {
  constructor() {
    this.breakpoints = {
      mobile: 768,
      tablet: 1024,
      desktop: 1440,
      large: 1920
    };

    this.listeners = new Set();
    this.currentViewport = this.detectViewport();

    // Throttled resize listener
    this.handleResize = this.throttle(this.handleResize.bind(this), 100);
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('orientationchange', this.handleOrientationChange.bind(this));
  }

  detectViewport() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    return {
      width,
      height,
      ratio: width / height,
      orientation: width > height ? 'landscape' : 'portrait',
      deviceType: this.getDeviceType(width),
      pixelRatio: window.devicePixelRatio || 1,
      availableArea: {
        width: screen.availWidth,
        height: screen.availHeight
      },
      colorDepth: screen.colorDepth,
      isHighDPI: window.devicePixelRatio > 1.5
    };
  }

  getDeviceType(width) {
    if (width < this.breakpoints.mobile) return 'mobile';
    if (width < this.breakpoints.tablet) return 'tablet';
    if (width < this.breakpoints.desktop) return 'desktop';
    return 'large';
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  handleResize() {
    const newViewport = this.detectViewport();
    const hasChanged = JSON.stringify(newViewport) !== JSON.stringify(this.currentViewport);

    if (hasChanged) {
      const changes = this.getViewportChanges(this.currentViewport, newViewport);
      this.currentViewport = newViewport;

      this.listeners.forEach(callback => {
        callback(newViewport, changes);
      });
    }
  }

  getViewportChanges(old, current) {
    return {
      dimensionsChanged: old.width !== current.width || old.height !== current.height,
      orientationChanged: old.orientation !== current.orientation,
      deviceTypeChanged: old.deviceType !== current.deviceType,
      ratioChanged: Math.abs(old.ratio - current.ratio) > 0.1
    };
  }

  handleOrientationChange() {
    // Delay to allow browser to update dimensions
    setTimeout(() => this.handleResize(), 100);
  }

  throttle(func, delay) {
    let lastExecution = 0;
    return (...args) => {
      const now = Date.now();
      if (now - lastExecution >= delay) {
        lastExecution = now;
        func.apply(this, args);
      }
    };
  }

  // Utility methods
  isMobile() {
    return this.currentViewport.deviceType === 'mobile';
  }

  isTablet() {
    return this.currentViewport.deviceType === 'tablet';
  }

  isDesktop() {
    return ['desktop', 'large'].includes(this.currentViewport.deviceType);
  }

  isRetina() {
    return this.currentViewport.isHighDPI;
  }

  // CSS custom properties integration
  updateCSSVariables() {
    const root = document.documentElement;
    const vp = this.currentViewport;

    root.style.setProperty('--viewport-width', `${vp.width}px`);
    root.style.setProperty('--viewport-height', `${vp.height}px`);
    root.style.setProperty('--viewport-ratio', vp.ratio.toString());
    root.style.setProperty('--pixel-ratio', vp.pixelRatio.toString());
    root.style.setProperty('--device-type', vp.deviceType);
  }
}

// Responsive component system integration
class ResponsiveComponent {
  constructor(element) {
    this.element = element;
    this.viewportManager = new ViewportManager();
    this.configurations = new Map();

    // Subscribe to viewport changes
    this.unsubscribe = this.viewportManager.subscribe(
      (viewport, changes) => this.handleViewportChange(viewport, changes)
    );
  }

  configure(deviceType, config) {
    this.configurations.set(deviceType, config);
    return this;
  }

  handleViewportChange(viewport, changes) {
    if (changes.deviceTypeChanged || changes.orientationChanged) {
      this.applyConfiguration(viewport.deviceType);
    }
  }

  applyConfiguration(deviceType) {
    const config = this.configurations.get(deviceType);
    if (!config) return;

    // Apply styles
    if (config.styles) {
      Object.assign(this.element.style, config.styles);
    }

    // Apply classes
    if (config.classes) {
      this.element.className = config.classes.join(' ');
    }

    // Execute custom logic
    if (config.onApply) {
      config.onApply(this.element, deviceType);
    }
  }

  destroy() {
    this.unsubscribe();
  }
}
```


### 🏭 Production Engineering Case Studies


**Case Study 1: Performance Monitoring tại Binance Trading Platform**


```javascript
// Real-time performance monitoring using BOM APIs
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      navigation: null,
      resources: [],
      vitals: {},
      custom: new Map()
    };

    this.setupNavigationTracking();
    this.setupResourceTracking();
    this.setupVitalsTracking();
    this.setupNetworkTracking();
  }

  setupNavigationTracking() {
    // Navigation timing analysis
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0];

      this.metrics.navigation = {
        dns: navigation.domainLookupEnd - navigation.domainLookupStart,
        connect: navigation.connectEnd - navigation.connectStart,
        ttfb: navigation.responseStart - navigation.requestStart,
        download: navigation.responseEnd - navigation.responseStart,
        domComplete: navigation.domComplete - navigation.navigationStart,
        loadComplete: navigation.loadEventEnd - navigation.navigationStart
      };

      this.reportMetrics('navigation', this.metrics.navigation);
    });
  }

  setupResourceTracking() {
    // Monitor resource loading performance
    const observer = new PerformanceObserver(list => {
      list.getEntries().forEach(entry => {
        if (entry.entryType === 'resource') {
          const resource = {
            name: entry.name,
            type: this.getResourceType(entry.name),
            size: entry.transferSize,
            duration: entry.duration,
            protocol: entry.nextHopProtocol
          };

          this.metrics.resources.push(resource);

          // Alert on slow resources
          if (entry.duration > 2000) {
            this.reportSlowResource(resource);
          }
        }
      });
    });

    observer.observe({ entryTypes: ['resource'] });
  }

  setupVitalsTracking() {
    // Core Web Vitals monitoring
    this.observeVital('largest-contentful-paint', 'LCP');
    this.observeVital('first-input-delay', 'FID');
    this.observeVital('cumulative-layout-shift', 'CLS');
  }

  observeVital(entryType, name) {
    const observer = new PerformanceObserver(list => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];

      this.metrics.vitals[name] = lastEntry.value || lastEntry.startTime;
      this.reportMetrics('vitals', { [name]: this.metrics.vitals[name] });
    });

    observer.observe({ entryTypes: [entryType] });
  }

  setupNetworkTracking() {
    // Network information monitoring
    if ('connection' in navigator) {
      const connection = navigator.connection;

      const networkInfo = {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData
      };

      this.reportMetrics('network', networkInfo);

      // Monitor network changes
      connection.addEventListener('change', () => {
        this.reportMetrics('network-change', {
          effectiveType: connection.effectiveType,
          downlink: connection.downlink
        });
      });
    }
  }

  // Custom performance markers
  mark(name) {
    performance.mark(name);
    this.metrics.custom.set(name, performance.now());
  }

  measure(name, startMark, endMark) {
    performance.measure(name, startMark, endMark);
    const measure = performance.getEntriesByName(name)[0];
    this.reportMetrics('custom', { [name]: measure.duration });
  }

  getResourceType(url) {
    const extension = url.split('.').pop().toLowerCase();
    const typeMap = {
      js: 'script',
      css: 'stylesheet',
      jpg: 'image',
      jpeg: 'image',
      png: 'image',
      svg: 'image',
      woff: 'font',
      woff2: 'font'
    };

    return typeMap[extension] || 'other';
  }

  reportMetrics(category, data) {
    // Send to analytics service
    if (this.shouldReport(category, data)) {
      fetch('/api/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          data,
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight
          }
        })
      }).catch(error => {
        console.warn('Failed to report metrics:', error);
      });
    }
  }

  shouldReport(category, data) {
    // Implement sampling logic
    const samplingRates = {
      navigation: 1.0,    // 100% sampling
      vitals: 1.0,        // 100% sampling
      resources: 0.1,     // 10% sampling
      custom: 0.5         // 50% sampling
    };

    return Math.random() < (samplingRates[category] || 0.1);
  }

  reportSlowResource(resource) {
    console.warn(`Slow resource detected: ${resource.name} (${resource.duration}ms)`);

    // Immediate alert for critical resources
    if (resource.type === 'script' && resource.name.includes('critical')) {
      this.reportMetrics('alert', {
        type: 'slow-critical-resource',
        resource
      });
    }
  }
}

// Usage trong production
const performanceMonitor = new PerformanceMonitor();

// Track custom application events
performanceMonitor.mark('trade-execution-start');
// ... trade execution logic
performanceMonitor.mark('trade-execution-end');
performanceMonitor.measure('trade-execution', 'trade-execution-start', 'trade-execution-end');
```


**Case Study 2: Progressive Enhancement tại Webflow Editor**


```javascript
// Progressive enhancement based on BOM capabilities
class ProgressiveEnhancementManager {
  constructor() {
    this.capabilities = new Map();
    this.features = new Map();
    this.fallbacks = new Map();

    this.detectCapabilities();
    this.initializeFeatures();
  }

  async detectCapabilities() {
    // Browser API support
    this.capabilities.set('serviceWorker', 'serviceWorker' in navigator);
    this.capabilities.set('webGL', this.hasWebGL());
    this.capabilities.set('webAssembly', this.hasWebAssembly());
    this.capabilities.set('intersectionObserver', 'IntersectionObserver' in window);
    this.capabilities.set('resizeObserver', 'ResizeObserver' in window);

    // Performance capabilities
    this.capabilities.set('highPerformance', this.isHighPerformanceDevice());
    this.capabilities.set('fastNetwork', await this.isFastNetwork());

    // Storage capabilities
    this.capabilities.set('localStorage', this.hasLocalStorage());
    this.capabilities.set('indexedDB', 'indexedDB' in window);

    // Input capabilities
    this.capabilities.set('touch', 'ontouchstart' in window);
    this.capabilities.set('pointer', 'PointerEvent' in window);

    console.log('Detected capabilities:', Object.fromEntries(this.capabilities));
  }

  registerFeature(name, config) {
    this.features.set(name, {
      dependencies: config.dependencies || [],
      implementation: config.implementation,
      fallback: config.fallback,
      priority: config.priority || 'normal'
    });
  }

  async initializeFeatures() {
    // Sort features by priority
    const sortedFeatures = Array.from(this.features.entries())
      .sort(([, a], [, b]) => {
        const priorities = { high: 3, normal: 2, low: 1 };
        return priorities[b.priority] - priorities[a.priority];
      });

    for (const [name, feature] of sortedFeatures) {
      await this.initializeFeature(name, feature);
    }
  }

  async initializeFeature(name, feature) {
    const canUseFeature = feature.dependencies.every(dep =>
      this.capabilities.get(dep) === true
    );

    if (canUseFeature) {
      try {
        await feature.implementation();
        console.log(`✅ Feature enabled: ${name}`);
      } catch (error) {
        console.warn(`❌ Feature failed: ${name}`, error);
        if (feature.fallback) {
          await feature.fallback();
          console.log(`🔄 Fallback activated: ${name}`);
        }
      }
    } else {
      if (feature.fallback) {
        await feature.fallback();
        console.log(`⚠️ Using fallback: ${name} (missing dependencies: ${
          feature.dependencies.filter(dep => !this.capabilities.get(dep)).join(', ')
        })`);
      }
    }
  }

  hasWebGL() {
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    } catch(e) {
      return false;
    }
  }

  hasWebAssembly() {
    try {
      return typeof WebAssembly === 'object' &&
             typeof WebAssembly.instantiate === 'function';
    } catch(e) {
      return false;
    }
  }

  isHighPerformanceDevice() {
    return navigator.hardwareConcurrency >= 4 &&
           (navigator.deviceMemory || 4) >= 4;
  }

  async isFastNetwork() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!connection) return true;

    // Consider 4G and above as fast
    return connection.effectiveType === '4g' || connection.downlink > 1.5;
  }

  hasLocalStorage() {
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      return true;
    } catch(e) {
      return false;
    }
  }
}

// Feature definitions for Webflow Editor
const enhancementManager = new ProgressiveEnhancementManager();

// Real-time collaboration feature
enhancementManager.registerFeature('realtime-collaboration', {
  dependencies: ['serviceWorker', 'fastNetwork', 'highPerformance'],
  priority: 'high',
  implementation: async () => {
    const { RealtimeCollaboration } = await import('./features/realtime-collaboration.js');
    new RealtimeCollaboration().initialize();
  },
  fallback: async () => {
    const { PollingCollaboration } = await import('./features/polling-collaboration.js');
    new PollingCollaboration().initialize();
  }
});

// Advanced visual effects
enhancementManager.registerFeature('visual-effects', {
  dependencies: ['webGL', 'highPerformance'],
  priority: 'normal',
  implementation: async () => {
    const { WebGLEffects } = await import('./features/webgl-effects.js');
    new WebGLEffects().initialize();
  },
  fallback: async () => {
    const { CSS3Effects } = await import('./features/css3-effects.js');
    new CSS3Effects().initialize();
  }
});

// Offline functionality
enhancementManager.registerFeature('offline-mode', {
  dependencies: ['serviceWorker', 'indexedDB'],
  priority: 'high',
  implementation: async () => {
    const { OfflineManager } = await import('./features/offline-manager.js');
    new OfflineManager().initialize();
  },
  fallback: async () => {
    const { LocalStorageCache } = await import('./features/localstorage-cache.js');
    new LocalStorageCache().initialize();
  }
});
```


### 💭 Advanced BOM Debugging Strategies


**Comprehensive BOM State Inspector:**


```javascript
// Complete BOM debugging toolkit
class BOMDebugger {
  static generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      navigator: this.analyzeNavigator(),
      location: this.analyzeLocation(),
      screen: this.analyzeScreen(),
      history: this.analyzeHistory(),
      performance: this.analyzePerformance(),
      storage: this.analyzeStorage(),
      network: this.analyzeNetwork()
    };

    console.group('🔍 BOM Debug Report');
    console.table(report.navigator);
    console.table(report.location);
    console.table(report.screen);
    console.groupEnd();

    return report;
  }

  static analyzeNavigator() {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      hardwareConcurrency: navigator.hardwareConcurrency,
      deviceMemory: navigator.deviceMemory,
      maxTouchPoints: navigator.maxTouchPoints,
      serviceWorkerSupport: 'serviceWorker' in navigator,
      geolocationSupport: 'geolocation' in navigator
    };
  }

  static analyzeLocation() {
    return {
      href: location.href,
      protocol: location.protocol,
      host: location.host,
      hostname: location.hostname,
      port: location.port,
      pathname: location.pathname,
      search: location.search,
      hash: location.hash,
      origin: location.origin
    };
  }

  static analyzeScreen() {
    return {
      width: screen.width,
      height: screen.height,
      availWidth: screen.availWidth,
      availHeight: screen.availHeight,
      colorDepth: screen.colorDepth,
      pixelDepth: screen.pixelDepth,
      devicePixelRatio: window.devicePixelRatio,
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      outerWidth: window.outerWidth,
      outerHeight: window.outerHeight
    };
  }

  static analyzeHistory() {
    return {
      length: history.length,
      scrollRestoration: history.scrollRestoration,
      supportsPushState: !!(history.pushState),
      supportsReplaceState: !!(history.replaceState)
    };
  }

  static analyzePerformance() {
    if (!performance) return { supported: false };

    const navigation = performance.getEntriesByType('navigation')[0];
    const timing = performance.timing;

    return {
      supported: true,
      navigationStart: timing?.navigationStart,
      loadEventEnd: timing?.loadEventEnd,
      domContentLoadedEventEnd: timing?.domContentLoadedEventEnd,
      timeOrigin: performance.timeOrigin,
      now: performance.now(),
      navigation: navigation ? {
        type: navigation.type,
        redirectCount: navigation.redirectCount,
        transferSize: navigation.transferSize
      } : null
    };
  }

  static analyzeStorage() {
    return {
      localStorage: this.testStorage('localStorage'),
      sessionStorage: this.testStorage('sessionStorage'),
      indexedDB: 'indexedDB' in window,
      cookies: navigator.cookieEnabled,
      estimate: this.getStorageEstimate()
    };
  }

  static testStorage(type) {
    try {
      const storage = window[type];
      const testKey = '__test__';
      storage.setItem(testKey, 'test');
      storage.removeItem(testKey);
      return {
        available: true,
        length: storage.length,
        remainingSpace: this.calculateRemainingSpace(storage)
      };
    } catch(e) {
      return { available: false, error: e.message };
    }
  }

  static calculateRemainingSpace(storage) {
    try {
      let size = 0;
      for (let key in storage) {
        if (storage.hasOwnProperty(key)) {
          size += storage[key].length + key.length;
        }
      }
      return { used: size, limit: '~5MB' }; // Approximate limit
    } catch(e) {
      return { error: e.message };
    }
  }

  static async getStorageEstimate() {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        return {
          quota: estimate.quota,
          usage: estimate.usage,
          available: estimate.quota - estimate.usage,
          percentage: Math.round((estimate.usage / estimate.quota) * 100)
        };
      } catch(e) {
        return { error: e.message };
      }
    }
    return { supported: false };
  }

  static analyzeNetwork() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

    if (!connection) return { supported: false };

    return {
      supported: true,
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData,
      type: connection.type
    };
  }

  // Monitor BOM changes
  static startMonitoring() {
    const monitor = {
      locationChanges: 0,
      onlineStatus: navigator.onLine,
      networkChanges: 0
    };

    // Monitor location changes
    let lastHref = location.href;
    setInterval(() => {
      if (location.href !== lastHref) {
        monitor.locationChanges++;
        console.log('📍 Location changed:', location.href);
        lastHref = location.href;
      }
    }, 1000);

    // Monitor online status
    window.addEventListener('online', () => {
      monitor.onlineStatus = true;
      console.log('🌐 Network: Online');
    });

    window.addEventListener('offline', () => {
      monitor.onlineStatus = false;
      console.log('📵 Network: Offline');
    });

    // Monitor network changes
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection) {
      connection.addEventListener('change', () => {
        monitor.networkChanges++;
        console.log('📶 Network changed:', {
          effectiveType: connection.effectiveType,
          downlink: connection.downlink
        });
      });
    }

    return monitor;
  }
}

// Usage trong development
if (process.env.NODE_ENV === 'development') {
  window.BOMDebugger = BOMDebugger;

  // Auto-generate report on load
  window.addEventListener('load', () => {
    setTimeout(() => BOMDebugger.generateReport(), 1000);
  });

  // Start monitoring
  const monitor = BOMDebugger.startMonitoring();
  console.log('🔧 BOM monitoring started:', monitor);
}
```


---


## 📖 PHẦN IV: CSSOM (CSS OBJECT MODEL) - STYLING SYSTEM ARCHITECTURE


### 🌱 Nguồn Gốc & Design Philosophy


💭 **Principal's Deep Insight:**
*CSSOM là probably the most underestimated API trong web platform. Khi tôi first encountered CSSOM tại Figma project, tôi realize đây là missing piece để build truly dynamic design systems. Most developers chỉ biết element.style, nhưng CSSOM provides access to entire stylesheet architecture. Game changer cho design tools.*


**Historical Context:**


CSSOM được develop để address critical limitations:


1. **Static CSS Problem:**

CSS files were static, no runtime modification
JavaScript could only change inline styles
No access to computed styles or cascade resolution
2. **Design System Requirements:**

Theme switching capabilities
Dynamic style generation
Component-based styling
3. **Performance Optimization:**

Batch style updates
Efficient cascade resolution
Minimal reflow/repaint


**CSSOM vs DOM Relationship:**


```javascript
// Understanding the CSSOM-DOM relationship
class CSSOMAnalyzer {
  static analyzeRelationship() {
    return {
      // DOM represents structure
      dom: {
        purpose: 'Document structure and content',
        mutation: 'appendChild, removeChild, innerHTML',
        events: 'click, change, input'
      },

      // CSSOM represents presentation
      cssom: {
        purpose: 'Style rules and visual presentation',
        mutation: 'insertRule, deleteRule, setProperty',
        computation: 'getComputedStyle, getCSSRule'
      },

      // Integration points
      integration: {
        elementStyle: 'element.style (CSSStyleDeclaration)',
        computedStyle: 'getComputedStyle(element)',
        stylesheets: 'document.stylesheets (StyleSheetList)',
        cssRules: 'stylesheet.cssRules (CSSRuleList)'
      }
    };
  }
}
```


### 🔬 Core CSSOM Architecture Deep Dive


**Stylesheet Hierarchy & Rule Management:**


```javascript
// Complete CSSOM manipulation toolkit
class CSSOMManager {
  constructor() {
    this.stylesheets = new Map();
    this.dynamicRules = new Map();
    this.observers = new Set();

    this.initializeStylesheets();
  }

  initializeStylesheets() {
    // Catalog all existing stylesheets
    Array.from(document.styleSheets).forEach((sheet, index) => {
      this.stylesheets.set(`sheet-${index}`, {
        sheet,
        origin: this.getStylesheetOrigin(sheet),
        rules: this.catalogRules(sheet),
        media: sheet.media.mediaText
      });
    });
  }

  getStylesheetOrigin(sheet) {
    if (!sheet.href) return 'inline';
    if (sheet.href.includes(location.origin)) return 'local';
    return 'external';
  }

  catalogRules(sheet) {
    const rules = [];
    try {
      Array.from(sheet.cssRules || []).forEach((rule, index) => {
        rules.push({
          index,
          type: this.getRuleType(rule),
          selector: rule.selectorText,
          cssText: rule.cssText,
          specificity: this.calculateSpecificity(rule.selectorText)
        });
      });
    } catch(e) {
      // CORS restrictions for external stylesheets
      console.warn('Cannot access rules for stylesheet:', sheet.href);
    }
    return rules;
  }

  getRuleType(rule) {
    const types = {
      1: 'STYLE_RULE',
      3: 'IMPORT_RULE',
      4: 'MEDIA_RULE',
      5: 'FONT_FACE_RULE',
      7: 'KEYFRAMES_RULE',
      8: 'KEYFRAME_RULE',
      10: 'NAMESPACE_RULE',
      12: 'SUPPORTS_RULE'
    };
    return types[rule.type] || 'UNKNOWN';
  }

  calculateSpecificity(selector) {
    if (!selector) return { a: 0, b: 0, c: 0, total: 0 };

    // Simplified specificity calculation
    const ids = (selector.match(/#[^\s+>~.[:]+/g) || []).length;
    const classes = (selector.match(/\.[^\s+>~#[:]+/g) || []).length;
    const attributes = (selector.match(/\[[^\]]+\]/g) || []).length;
    const pseudoClasses = (selector.match(/:[^\s+>~.[:]+/g) || []).length;
    const elements = (selector.match(/[a-zA-Z][^\s+>~.#[:]*|::?[^\s+>~.#[:]+/g) || []).length;

    const a = 0; // inline styles (would be 1)
    const b = ids;
    const c = classes + attributes + pseudoClasses;
    const d = elements;

    return {
      a, b, c, d,
      total: a * 1000 + b * 100 + c * 10 + d
    };
  }

  // Dynamic stylesheet creation
  createStylesheet(id, media = 'all') {
    const style = document.createElement('style');
    style.setAttribute('data-id', id);
    style.media = media;
    document.head.appendChild(style);

    const sheet = style.sheet;
    this.stylesheets.set(id, {
      sheet,
      element: style,
      origin: 'dynamic',
      rules: [],
      media
    });

    return sheet;
  }

  // Efficient rule insertion with conflict resolution
  insertRule(stylesheetId, selector, properties, index) {
    const stylesheetInfo = this.stylesheets.get(stylesheetId);
    if (!stylesheetInfo) {
      throw new Error(`Stylesheet not found: ${stylesheetId}`);
    }

    const { sheet } = stylesheetInfo;

    // Convert properties object to CSS text
    const cssText = this.propertiesToCSSText(properties);
    const ruleText = `${selector} { ${cssText} }`;

    try {
      const insertIndex = index !== undefined ? index : sheet.cssRules.length;
      sheet.insertRule(ruleText, insertIndex);

      // Update our catalog
      const newRule = {
        index: insertIndex,
        type: 'STYLE_RULE',
        selector,
        cssText: ruleText,
        specificity: this.calculateSpecificity(selector)
      };

      stylesheetInfo.rules.splice(insertIndex, 0, newRule);

      return newRule;
    } catch(e) {
      console.error('Failed to insert rule:', ruleText, e);
      throw e;
    }
  }

  propertiesToCSSText(properties) {
    return Object.entries(properties)
      .map(([property, value]) => `${this.camelToKebab(property)}: ${value}`)
      .join('; ');
  }

  camelToKebab(str) {
    return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  }

  // Advanced rule querying
  findRules(criteria) {
    const results = [];

    for (const [id, stylesheetInfo] of this.stylesheets) {
      for (const rule of stylesheetInfo.rules) {
        if (this.matchesCriteria(rule, criteria)) {
          results.push({ stylesheetId: id, rule });
        }
      }
    }

    return results.sort((a, b) => b.rule.specificity.total - a.rule.specificity.total);
  }

  matchesCriteria(rule, criteria) {
    if (criteria.selector && !rule.selector?.includes(criteria.selector)) {
      return false;
    }

    if (criteria.property && !rule.cssText?.includes(criteria.property)) {
      return false;
    }

    if (criteria.minSpecificity && rule.specificity.total < criteria.minSpecificity) {
      return false;
    }

    return true;
  }

  // Cascade analysis
  analyzeCascade(element, property) {
    const computedStyle = getComputedStyle(element);
    const computedValue = computedStyle[property];

    const applicableRules = this.findApplicableRules(element, property);

    return {
      computedValue,
      cascadeOrder: applicableRules,
      source: this.determineValueSource(element, property, applicableRules),
      inheritance: this.analyzeInheritance(element, property)
    };
  }

  findApplicableRules(element, property) {
    const rules = [];

    // Check all stylesheets
    for (const [id, stylesheetInfo] of this.stylesheets) {
      for (const ruleInfo of stylesheetInfo.rules) {
        if (this.ruleApplies(element, ruleInfo, property)) {
          rules.push({
            stylesheetId: id,
            rule: ruleInfo,
            matches: element.matches(ruleInfo.selector)
          });
        }
      }
    }

    // Sort by specificity and source order
    return rules.sort((a, b) => {
      const specificityDiff = b.rule.specificity.total - a.rule.specificity.total;
      if (specificityDiff !== 0) return specificityDiff;

      // If same specificity, later rules win
      return b.rule.index - a.rule.index;
    });
  }

  ruleApplies(element, ruleInfo, property) {
    try {
      return element.matches(ruleInfo.selector) &&
             ruleInfo.cssText.includes(property);
    } catch(e) {
      return false;
    }
  }

  determineValueSource(element, property, rules) {
    // Check inline styles first
    if (element.style[property]) {
      return { type: 'inline', specificity: { total: 1000 } };
    }

    // Check applicable rules
    if (rules.length > 0) {
      return { type: 'stylesheet', rule: rules[0] };
    }

    // Check inheritance
    const parent = element.parentElement;
    if (parent && this.isInheritedProperty(property)) {
      return { type: 'inherited', element: parent };
    }

    return { type: 'default' };
  }

  isInheritedProperty(property) {
    const inheritedProperties = [
      'color', 'font-family', 'font-size', 'font-weight', 'line-height',
      'text-align', 'text-indent', 'letter-spacing', 'word-spacing',
      'visibility', 'cursor'
    ];

    return inheritedProperties.includes(property);
  }

  analyzeInheritance(element, property) {
    const chain = [];
    let current = element.parentElement;

    while (current && current !== document.documentElement) {
      const computedStyle = getComputedStyle(current);
      chain.push({
        element: current,
        value: computedStyle[property],
        tag: current.tagName.toLowerCase()
      });
      current = current.parentElement;
    }

    return chain;
  }
}
```


### 💡 Advanced CSSOM Applications


**Real-time Theme System (Figma-inspired):**


```javascript
// Sophisticated theme management system
class ThemeSystem {
  constructor() {
    this.cssomManager = new CSSOMManager();
    this.themes = new Map();
    this.currentTheme = null;
    this.customProperties = new Map();
    this.observers = new Set();

    this.initializeSystem();
  }

  initializeSystem() {
    // Create dedicated theme stylesheet
    this.themeSheet = this.cssomManager.createStylesheet('theme-system');

    // Extract existing custom properties
    this.extractCustomProperties();

    // Setup mutation observers for custom property changes
    this.setupPropertyObserver();
  }

  extractCustomProperties() {
    const rootStyle = getComputedStyle(document.documentElement);

    // Modern browsers support getting all custom properties
    if (CSS.supports('color', 'var(--test)')) {
      Array.from(document.styleSheets).forEach(sheet => {
        try {
          Array.from(sheet.cssRules).forEach(rule => {
            if (rule.type === CSSRule.STYLE_RULE && rule.selectorText === ':root') {
              Array.from(rule.style).forEach(property => {
                if (property.startsWith('--')) {
                  this.customProperties.set(property, {
                    name: property,
                    value: rule.style.getPropertyValue(property),
                    computed: rootStyle.getPropertyValue(property)
                  });
                }
              });
            }
          });
        } catch(e) {
          // Skip CORS-restricted stylesheets
        }
      });
    }
  }

  defineTheme(name, properties) {
    // Validate property structure
    const validatedProperties = this.validateThemeProperties(properties);

    this.themes.set(name, {
      name,
      properties: validatedProperties,
      rules: [],
      timestamp: Date.now()
    });

    // Generate CSS rules for theme
    this.generateThemeRules(name, validatedProperties);

    return this.themes.get(name);
  }

  validateThemeProperties(properties) {
    const validated = {};

    Object.entries(properties).forEach(([key, value]) => {
      // Ensure property name starts with --
      const propName = key.startsWith('--') ? key : `--${key}`;

      // Validate CSS value
      if (this.isValidCSSValue(propName, value)) {
        validated[propName] = value;
      } else {
        console.warn(`Invalid CSS value for ${propName}: ${value}`);
      }
    });

    return validated;
  }

  isValidCSSValue(property, value) {
    try {
      // Create temporary element to test validity
      const testEl = document.createElement('div');
      testEl.style.setProperty(property, value);
      return testEl.style.getPropertyValue(property) !== '';
    } catch(e) {
      return false;
    }
  }

  generateThemeRules(themeName, properties) {
    const theme = this.themes.get(themeName);

    // Clear existing rules for this theme
    theme.rules.forEach(ruleIndex => {
      this.themeSheet.deleteRule(ruleIndex);
    });
    theme.rules = [];

    // Create root rule with all custom properties
    const rootProperties = Object.entries(properties)
      .map(([prop, value]) => `${prop}: ${value}`)
      .join('; ');

    const rootRule = `[data-theme="${themeName}"] { ${rootProperties} }`;

    try {
      const ruleIndex = this.themeSheet.cssRules.length;
      this.themeSheet.insertRule(rootRule, ruleIndex);
      theme.rules.push(ruleIndex);

      // Generate component-specific overrides
      this.generateComponentOverrides(themeName, properties);

    } catch(e) {
      console.error('Failed to generate theme rules:', e);
    }
  }

  generateComponentOverrides(themeName, properties) {
    // Generate semantic color mappings
    const semanticMappings = this.generateSemanticMappings(properties);

    Object.entries(semanticMappings).forEach(([selector, overrides]) => {
      const overrideProperties = Object.entries(overrides)
        .map(([prop, value]) => `${prop}: ${value}`)
        .join('; ');

      const rule = `[data-theme="${themeName}"] ${selector} { ${overrideProperties} }`;

      try {
        const ruleIndex = this.themeSheet.cssRules.length;
        this.themeSheet.insertRule(rule, ruleIndex);
        this.themes.get(themeName).rules.push(ruleIndex);
      } catch(e) {
        console.warn('Failed to create component override:', rule);
      }
    });
  }

  generateSemanticMappings(properties) {
    // Intelligent mapping of theme properties to components
    const mappings = {};

    // Button mappings
    if (properties['--primary-color']) {
      mappings['.btn-primary'] = {
        'background-color': 'var(--primary-color)',
        'border-color': 'var(--primary-color)'
      };
    }

    // Form element mappings
    if (properties['--input-bg'] && properties['--input-border']) {
      mappings['input, textarea, select'] = {
        'background-color': 'var(--input-bg)',
        'border-color': 'var(--input-border)'
      };
    }

    // Surface mappings
    if (properties['--surface-color']) {
      mappings['.card, .modal, .panel'] = {
        'background-color': 'var(--surface-color)'
      };
    }

    return mappings;
  }

  applyTheme(themeName, options = {}) {
    const theme = this.themes.get(themeName);
    if (!theme) {
      throw new Error(`Theme not found: ${themeName}`);
    }

    const { transition = true, scope = document.documentElement } = options;

    if (transition) {
      this.enableTransitions(scope);
    }

    // Apply theme data attribute
    scope.setAttribute('data-theme', themeName);

    // Update current theme reference
    this.currentTheme = themeName;

    // Notify observers
    this.notifyObservers('theme-changed', { theme: themeName, scope });

    if (transition) {
      // Remove transition after completion
      setTimeout(() => this.disableTransitions(scope), 300);
    }

    return theme;
  }

  enableTransitions(scope) {
    const transitionRule = `
      [data-theme] * {
        transition: background-color 0.3s ease,
                   color 0.3s ease,
                   border-color 0.3s ease !important;
      }
    `;

    try {
      const ruleIndex = this.themeSheet.cssRules.length;
      this.themeSheet.insertRule(transitionRule, ruleIndex);
      this.transitionRuleIndex = ruleIndex;
    } catch(e) {
      console.warn('Could not enable theme transitions:', e);
    }
  }

  disableTransitions(scope) {
    if (this.transitionRuleIndex !== undefined) {
      try {
        this.themeSheet.deleteRule(this.transitionRuleIndex);
        this.transitionRuleIndex = undefined;
      } catch(e) {
        console.warn('Could not disable theme transitions:', e);
      }
    }
  }

  // Dynamic property updates
  updateThemeProperty(themeName, property, value) {
    const theme = this.themes.get(themeName);
    if (!theme) return;

    // Update theme definition
    theme.properties[property] = value;

    // Regenerate rules
    this.generateThemeRules(themeName, theme.properties);

    // If this is the current theme, changes are immediately visible
    if (this.currentTheme === themeName) {
      this.notifyObservers('property-updated', { property, value });
    }
  }

  // Real-time property editing
  createPropertyEditor(themeName) {
    const theme = this.themes.get(themeName);
    if (!theme) return null;

    return new ThemePropertyEditor(theme, this);
  }

  setupPropertyObserver() {
    // Monitor for custom property changes
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          this.handleStyleMutation(mutation.target);
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style']
    });
  }

  handleStyleMutation(element) {
    // Check for custom property changes
    Array.from(element.style).forEach(property => {
      if (property.startsWith('--')) {
        const value = element.style.getPropertyValue(property);
        this.notifyObservers('custom-property-changed', {
          element,
          property,
          value
        });
      }
    });
  }

  subscribe(callback) {
    this.observers.add(callback);
    return () => this.observers.delete(callback);
  }

  notifyObservers(event, data) {
    this.observers.forEach(callback => {
      try {
        callback(event, data);
      } catch(e) {
        console.error('Observer callback error:', e);
      }
    });
  }

  // Theme analysis and debugging
  analyzeThemeUsage() {
    const analysis = {
      totalThemes: this.themes.size,
      currentTheme: this.currentTheme,
      customProperties: this.customProperties.size,
      unusedProperties: [],
      conflictingSelectors: []
    };

    // Find unused custom properties
    this.customProperties.forEach((prop, name) => {
      const usage = this.findPropertyUsage(name);
      if (usage.count === 0) {
        analysis.unusedProperties.push(name);
      }
    });

    return analysis;
  }

  findPropertyUsage(propertyName) {
    let count = 0;
    const locations = [];

    // Search through all stylesheets
    Array.from(document.styleSheets).forEach(sheet => {
      try {
        Array.from(sheet.cssRules).forEach(rule => {
          if (rule.cssText.includes(`var(${propertyName})`)) {
            count++;
            locations.push({
              sheet: sheet.href || 'inline',
              rule: rule.cssText
            });
          }
        });
      } catch(e) {
        // Skip CORS-restricted sheets
      }
    });

    return { count, locations };
  }
}

// Theme Property Editor for real-time editing
class ThemePropertyEditor {
  constructor(theme, themeSystem) {
    this.theme = theme;
    this.themeSystem = themeSystem;
    this.createUI();
  }

  createUI() {
    this.container = document.createElement('div');
    this.container.className = 'theme-editor';
    this.container.innerHTML = `
      <div class="theme-editor__header">
        <h3>Theme: ${this.theme.name}</h3>
        <button class="theme-editor__close">×</button>
      </div>
      <div class="theme-editor__properties"></div>
      <div class="theme-editor__actions">
        <button class="theme-editor__export">Export</button>
        <button class="theme-editor__import">Import</button>
      </div>
    `;

    this.renderProperties();
    this.bindEvents();
  }

  renderProperties() {
    const container = this.container.querySelector('.theme-editor__properties');
    container.innerHTML = '';

    Object.entries(this.theme.properties).forEach(([property, value]) => {
      const propertyEl = this.createPropertyEditor(property, value);
      container.appendChild(propertyEl);
    });
  }

  createPropertyEditor(property, value) {
    const div = document.createElement('div');
    div.className = 'property-editor';

    // Detect property type and create appropriate input
    const inputType = this.detectInputType(value);

    div.innerHTML = `
      <label class="property-editor__label">${property}</label>
      <div class="property-editor__input">
        ${this.createInput(inputType, property, value)}
      </div>
      <div class="property-editor__preview" style="${property}: ${value}"></div>
    `;

    return div;
  }

  detectInputType(value) {
    if (value.match(/^#[0-9a-fA-F]{6}$/)) return 'color';
    if (value.match(/^\d+px$/)) return 'pixel';
    if (value.match(/^\d+(\.\d+)?$/)) return 'number';
    return 'text';
  }

  createInput(type, property, value) {
    switch (type) {
      case 'color':
        return `<input type="color" value="${value}" data-property="${property}">`;
      case 'pixel':
        const pixels = parseInt(value);
        return `<input type="range" min="0" max="100" value="${pixels}" data-property="${property}">
                <span class="unit">px</span>`;
      case 'number':
        return `<input type="number" value="${value}" data-property="${property}">`;
      default:
        return `<input type="text" value="${value}" data-property="${property}">`;
    }
  }

  bindEvents() {
    // Property value changes
    this.container.addEventListener('input', (e) => {
      if (e.target.hasAttribute('data-property')) {
        const property = e.target.getAttribute('data-property');
        let value = e.target.value;

        // Add units for pixel inputs
        if (e.target.type === 'range') {
          value += 'px';
        }

        this.updateProperty(property, value);
      }
    });

    // Close button
    this.container.querySelector('.theme-editor__close').addEventListener('click', () => {
      this.destroy();
    });

    // Export/Import
    this.container.querySelector('.theme-editor__export').addEventListener('click', () => {
      this.exportTheme();
    });

    this.container.querySelector('.theme-editor__import').addEventListener('click', () => {
      this.importTheme();
    });
  }

  updateProperty(property, value) {
    this.theme.properties[property] = value;
    this.themeSystem.updateThemeProperty(this.theme.name, property, value);

    // Update preview
    const preview = this.container.querySelector(`[data-property="${property}"]`)
      .closest('.property-editor').querySelector('.property-editor__preview');
    preview.style.setProperty(property, value);
  }

  exportTheme() {
    const exported = {
      name: this.theme.name,
      properties: this.theme.properties,
      timestamp: Date.now(),
      version: '1.0'
    };

    const blob = new Blob([JSON.stringify(exported, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.theme.name}-theme.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  importTheme() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target.result);
          this.theme.properties = imported.properties;
          this.themeSystem.generateThemeRules(this.theme.name, imported.properties);
          this.renderProperties();
        } catch(error) {
          alert('Invalid theme file');
        }
      };
      reader.readAsText(file);
    });

    input.click();
  }

  show() {
    document.body.appendChild(this.container);
  }

  destroy() {
    if (this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}
```


### 🏭 Production Case Study: Component Style Isolation


**Advanced CSS-in-JS System Implementation:**


```javascript
// Production-grade style isolation system used at Webflow
class StyleIsolationSystem {
  constructor() {
    this.cssomManager = new CSSOMManager();
    this.componentStyles = new Map();
    this.isolatedSheets = new Map();
    this.shadowRoots = new WeakMap();

    this.initializeSystem();
  }

  initializeSystem() {
    // Create main isolation stylesheet
    this.isolationSheet = this.cssomManager.createStylesheet('style-isolation');

    // Setup component style tracking
    this.setupStyleTracking();
  }

  // Register component with isolated styles
  registerComponent(name, styles, options = {}) {
    const {
      shadowDOM = false,
      scoped = true,
      namespace = name
    } = options;

    const componentId = this.generateComponentId(name);

    const component = {
      name,
      id: componentId,
      styles: this.processStyles(styles, componentId, scoped),
      shadowDOM,
      namespace,
      instances: new Set(),
      stylesheet: null
    };

    if (shadowDOM) {
      // Shadow DOM provides natural isolation
      component.createShadowInstance = this.createShadowInstance.bind(this, component);
    } else {
      // Create scoped stylesheet
      component.stylesheet = this.createScopedStylesheet(component);
    }

    this.componentStyles.set(name, component);
    return component;
  }

  generateComponentId(name) {
    // Generate unique, stable component ID
    let hash = 0;
    const str = name + Date.now();
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `c${Math.abs(hash).toString(36)}`;
  }

  processStyles(styles, componentId, scoped) {
    if (typeof styles === 'string') {
      return scoped ? this.scopeCSS(styles, componentId) : styles;
    }

    if (typeof styles === 'object') {
      return this.processStyleObject(styles, componentId, scoped);
    }

    throw new Error('Invalid styles format');
  }

  scopeCSS(css, componentId) {
    // Sophisticated CSS scoping
    return css.replace(/([^{}]*){([^{}]*)}/g, (match, selectors, properties) => {
      const scopedSelectors = selectors
        .split(',')
        .map(selector => {
          const trimmed = selector.trim();

          // Handle :root selector
          if (trimmed === ':root') {
            return `[data-component="${componentId}"]`;
          }

          // Handle pseudo-selectors
          if (trimmed.includes(':')) {
            const [base, ...pseudo] = trimmed.split(':');
            return `[data-component="${componentId}"] ${base}:${pseudo.join(':')}`;
          }

          // Regular selectors
          return `[data-component="${componentId}"] ${trimmed}`;
        })
        .join(', ');

      return `${scopedSelectors} { ${properties} }`;
    });
  }

  processStyleObject(styleObj, componentId, scoped) {
    const cssRules = [];

    const processRule = (selector, properties, parentSelector = '') => {
      const fullSelector = parentSelector ? `${parentSelector} ${selector}` : selector;

      const cssProperties = [];
      const nestedRules = [];

      Object.entries(properties).forEach(([key, value]) => {
        if (typeof value === 'object') {
          // Nested rule
          nestedRules.push([key, value]);
        } else {
          // CSS property
          const cssKey = this.camelToKebab(key);
          cssProperties.push(`${cssKey}: ${value}`);
        }
      });

      // Add current rule
      if (cssProperties.length > 0) {
        const scopedSelector = scoped ?
          `[data-component="${componentId}"] ${fullSelector}` :
          fullSelector;

        cssRules.push(`${scopedSelector} { ${cssProperties.join('; ')} }`);
      }

      // Process nested rules
      nestedRules.forEach(([nestedSelector, nestedProperties]) => {
        processRule(nestedSelector, nestedProperties, fullSelector);
      });
    };

    Object.entries(styleObj).forEach(([selector, properties]) => {
      processRule(selector, properties);
    });

    return cssRules.join('\n');
  }

  camelToKebab(str) {
    return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  }

  createScopedStylesheet(component) {
    const sheet = this.cssomManager.createStylesheet(`component-${component.name}`);

    // Insert component styles
    const rules = component.styles.split('}').filter(rule => rule.trim());

    rules.forEach(rule => {
      if (rule.trim()) {
        try {
          sheet.insertRule(rule + '}', sheet.cssRules.length);
        } catch(e) {
          console.warn(`Failed to insert rule for ${component.name}:`, rule, e);
        }
      }
    });

    return sheet;
  }

  createShadowInstance(component, element) {
    // Create shadow root with isolated styles
    const shadowRoot = element.attachShadow({ mode: 'open' });

    // Create style element for component styles
    const styleElement = document.createElement('style');
    styleElement.textContent = component.styles;
    shadowRoot.appendChild(styleElement);

    // Track shadow root
    this.shadowRoots.set(element, shadowRoot);
    component.instances.add(element);

    return shadowRoot;
  }

  // Apply component styles to element
  applyComponentStyles(componentName, element, props = {}) {
    const component = this.componentStyles.get(componentName);
    if (!component) {
      throw new Error(`Component not found: ${componentName}`);
    }

    if (component.shadowDOM) {
      return this.createShadowInstance(component, element);
    } else {
      // Apply scoped data attribute
      element.setAttribute('data-component', component.id);

      // Apply dynamic styles if any
      if (props && Object.keys(props).length > 0) {
        this.applyDynamicStyles(element, component, props);
      }

      component.instances.add(element);
      return element;
    }
  }

  applyDynamicStyles(element, component, props) {
    // Generate CSS custom properties from props
    Object.entries(props).forEach(([key, value]) => {
      const cssProperty = `--${component.namespace}-${this.camelToKebab(key)}`;
      element.style.setProperty(cssProperty, value);
    });
  }

  // Runtime style updates
  updateComponentStyles(componentName, newStyles) {
    const component = this.componentStyles.get(componentName);
    if (!component) return;

    // Process new styles
    component.styles = this.processStyles(newStyles, component.id, true);

    if (component.shadowDOM) {
      // Update all shadow DOM instances
      component.instances.forEach(element => {
        const shadowRoot = this.shadowRoots.get(element);
        if (shadowRoot) {
          const styleEl = shadowRoot.querySelector('style');
          if (styleEl) {
            styleEl.textContent = component.styles;
          }
        }
      });
    } else {
      // Recreate scoped stylesheet
      if (component.stylesheet) {
        // Remove old stylesheet
        component.stylesheet.ownerNode.remove();
      }
      component.stylesheet = this.createScopedStylesheet(component);
    }
  }

  // Performance monitoring
  setupStyleTracking() {
    // Monitor style mutations for performance
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'STYLE') {
              this.trackStyleAddition(node);
            }
          });
        }
      });
    });

    observer.observe(document.head, { childList: true });
  }

  trackStyleAddition(styleElement) {
    const size = styleElement.textContent.length;
    const rules = (styleElement.textContent.match(/{[^}]*}/g) || []).length;

    console.log(`Style added: ${size} chars, ${rules} rules`);

    // Alert on large style additions
    if (size > 50000) {
      console.warn('Large stylesheet detected:', styleElement);
    }
  }

  // Cleanup and optimization
  cleanupComponent(componentName) {
    const component = this.componentStyles.get(componentName);
    if (!component) return;

    // Remove stylesheet
    if (component.stylesheet) {
      component.stylesheet.ownerNode.remove();
    }

    // Clean up instances
    component.instances.forEach(element => {
      element.removeAttribute('data-component');

      if (component.shadowDOM) {
        this.shadowRoots.delete(element);
      }
    });

    this.componentStyles.delete(componentName);
  }

  // Analysis tools
  analyzeStyleUsage() {
    const analysis = {
      totalComponents: this.componentStyles.size,
      totalInstances: 0,
      memoryUsage: 0,
      shadwoDOMComponents: 0,
      scopedComponents: 0
    };

    this.componentStyles.forEach(component => {
      analysis.totalInstances += component.instances.size;
      analysis.memoryUsage += component.styles.length;

      if (component.shadowDOM) {
        analysis.shadwoDOMComponents++;
      } else {
        analysis.scopedComponents++;
      }
    });

    return analysis;
  }
}

// Usage example in production
const styleSystem = new StyleIsolationSystem();

// Register a component with complex styles
styleSystem.registerComponent('Button', {
  '.btn': {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    backgroundColor: 'var(--btn-bg, #007bff)',
    color: 'var(--btn-color, white)',

    '&:hover': {
      backgroundColor: 'var(--btn-hover-bg, #0056b3)'
    },

    '&.btn-large': {
      padding: '15px 30px',
      fontSize: '18px'
    }
  }
}, { scoped: true, namespace: 'btn' });

// Apply to elements with props
const button = document.querySelector('.my-button');
styleSystem.applyComponentStyles('Button', button, {
  bg: '#28a745',
  color: 'white',
  hoverBg: '#218838'
});
```


---


## 📖 PHẦN V: WEB SPECIFICATIONS & STANDARDS DEEP DIVE


### 🌱 Chuẩn Hóa & Governance Ecosystem


💭 **Principal's Standards Perspective:**
*Understanding web specifications không chỉ là academic exercise. Tại Figma, chúng tôi thường implement bleeding-edge features trước khi browsers fully support. Knowledge về specs process helps predict future browser behaviors và plan polyfill strategies. Standards governance directly impacts business decisions.*


**The Standards Bodies Landscape:**


```javascript
// Comprehensive standards tracking system
class WebStandardsTracker {
  constructor() {
    this.organizations = new Map([
      ['WHATWG', {
        name: 'Web Hypertext Application Technology Working Group',
        specs: ['HTML Living Standard', 'DOM Living Standard', 'URL Standard'],
        philosophy: 'Living standards, continuous evolution',
        website: 'https://whatwg.org'
      }],
      ['W3C', {
        name: 'World Wide Web Consortium',
        specs: ['CSS Specifications', 'WebRTC', 'Web Accessibility'],
        philosophy: 'Versioned recommendations, committee consensus',
        website: 'https://w3.org'
      }],
      ['TC39', {
        name: 'ECMAScript Technical Committee',
        specs: ['ECMAScript Language Specification'],
        philosophy: 'Stage-based progression, annual releases',
        website: 'https://tc39.es'
      }],
      ['IETF', {
        name: 'Internet Engineering Task Force',
        specs: ['HTTP', 'TLS', 'WebRTC protocols'],
        philosophy: 'RFC-based standards, engineering focus',
        website: 'https://ietf.org'
      }]
    ]);

    this.specifications = new Map();
    this.implementationStatus = new Map();

    this.initializeTracking();
  }

  initializeTracking() {
    // Track major browser implementation status
    this.browserMatrix = new Map([
      ['Chrome', { engine: 'Blink', vendor: 'Google' }],
      ['Firefox', { engine: 'Gecko', vendor: 'Mozilla' }],
      ['Safari', { engine: 'WebKit', vendor: 'Apple' }],
      ['Edge', { engine: 'Blink', vendor: 'Microsoft' }]
    ]);

    // Initialize key specifications
    this.registerSpecification('DOM Living Standard', {
      organization: 'WHATWG',
      url: 'https://dom.spec.whatwg.org/',
      status: 'Living Standard',
      lastUpdated: '2025-08-20',
      keyFeatures: [
        'Node hierarchy',
        'Event handling',
        'Mutation observation',
        'Shadow DOM'
      ]
    });

    this.registerSpecification('HTML Living Standard', {
      organization: 'WHATWG',
      url: 'https://html.spec.whatwg.org/',
      status: 'Living Standard',
      lastUpdated: '2025-08-20',
      keyFeatures: [
        'HTML elements',
        'Forms',
        'Canvas API',
        'Web Workers',
        'History API'
      ]
    });
  }

  registerSpecification(name, details) {
    this.specifications.set(name, {
      ...details,
      implementationMatrix: new Map(),
      polyfills: [],
      businessImpact: 'unknown'
    });
  }

  trackImplementation(specName, browser, status, version, notes = '') {
    const spec = this.specifications.get(specName);
    if (!spec) return;

    spec.implementationMatrix.set(browser, {
      status, // 'supported', 'partial', 'planned', 'none'
      version,
      notes,
      lastChecked: new Date().toISOString()
    });
  }

  analyzeImplementationGaps() {
    const gaps = [];

    this.specifications.forEach((spec, name) => {
      const implementations = spec.implementationMatrix;
      const support = {
        full: 0,
        partial: 0,
        none: 0,
        total: implementations.size
      };

      implementations.forEach(impl => {
        if (impl.status === 'supported') support.full++;
        else if (impl.status === 'partial') support.partial++;
        else support.none++;
      });

      if (support.none > 0 || support.partial > support.full) {
        gaps.push({
          specification: name,
          support,
          risk: this.calculateRisk(support),
          polyfillsAvailable: spec.polyfills.length > 0
        });
      }
    });

    return gaps.sort((a, b) => b.risk - a.risk);
  }

  calculateRisk(support) {
    // Risk calculation based on browser support
    const totalBrowsers = support.total;
    const unsupported = support.none + (support.partial * 0.5);
    return (unsupported / totalBrowsers) * 100;
  }

  generateCompatibilityReport() {
    return {
      overview: {
        totalSpecifications: this.specifications.size,
        trackingBrowsers: this.browserMatrix.size,
        lastUpdated: new Date().toISOString()
      },
      gapsAnalysis: this.analyzeImplementationGaps(),
      polyfillRecommendations: this.generatePolyfillRecommendations(),
      businessImpact: this.assessBusinessImpact()
    };
  }

  generatePolyfillRecommendations() {
    const recommendations = [];

    this.specifications.forEach((spec, name) => {
      const gaps = this.analyzeSpecificationGaps(spec);
      if (gaps.needsPolyfill) {
        recommendations.push({
          specification: name,
          reason: gaps.reason,
          recommendedPolyfills: spec.polyfills,
          priority: gaps.priority
        });
      }
    });

    return recommendations;
  }

  analyzeSpecificationGaps(spec) {
    const implementations = Array.from(spec.implementationMatrix.values());
    const unsupported = implementations.filter(impl =>
      impl.status === 'none' || impl.status === 'partial'
    );

    return {
      needsPolyfill: unsupported.length > 0,
      reason: `${unsupported.length} browsers lack full support`,
      priority: unsupported.length >= 2 ? 'high' : 'medium'
    };
  }

  assessBusinessImpact() {
    const impact = {
      highImpact: [],
      mediumImpact: [],
      lowImpact: []
    };

    this.specifications.forEach((spec, name) => {
      const gaps = this.analyzeSpecificationGaps(spec);
      const category = this.determineImpactCategory(spec, gaps);
      impact[category].push(name);
    });

    return impact;
  }

  determineImpactCategory(spec, gaps) {
    // Business logic for determining impact
    if (spec.keyFeatures.some(feature =>
      ['Shadow DOM', 'Web Workers', 'Canvas API'].includes(feature)
    )) {
      return 'highImpact';
    }

    if (gaps.needsPolyfill && gaps.priority === 'high') {
      return 'mediumImpact';
    }

    return 'lowImpact';
  }
}
```


### 🔬 DOM Living Standard Deep Analysis


**Advanced DOM Specification Implementation:**


```javascript
// Production-grade DOM implementation analyzer
class DOMSpecificationAnalyzer {
  constructor() {
    this.features = new Map();
    this.compatibilityMatrix = new Map();
    this.performanceBaselines = new Map();

    this.initializeFeatureDetection();
  }

  initializeFeatureDetection() {
    // Core DOM features from specification
    this.registerFeature('Node.prototype.cloneNode', {
      specification: 'DOM Living Standard',
      section: '4.9.1',
      testImplementation: () => {
        const div = document.createElement('div');
        div.innerHTML = '<span>test</span>';
        const clone = div.cloneNode(true);
        return clone.innerHTML === '<span>test</span>';
      },
      performanceTest: () => this.benchmarkCloneNode()
    });

    this.registerFeature('MutationObserver', {
      specification: 'DOM Living Standard',
      section: '4.3.2',
      testImplementation: () => {
        return typeof MutationObserver !== 'undefined' &&
               typeof MutationObserver.prototype.observe === 'function';
      },
      performanceTest: () => this.benchmarkMutationObserver()
    });

    this.registerFeature('Custom Elements', {
      specification: 'DOM Living Standard',
      section: '4.13',
      testImplementation: () => {
        return typeof customElements !== 'undefined' &&
               typeof customElements.define === 'function';
      },
      performanceTest: () => this.benchmarkCustomElements()
    });

    this.registerFeature('Shadow DOM', {
      specification: 'DOM Living Standard',
      section: '4.2.2',
      testImplementation: () => {
        const div = document.createElement('div');
        try {
          const shadow = div.attachShadow({ mode: 'open' });
          return shadow instanceof ShadowRoot;
        } catch(e) {
          return false;
        }
      },
      performanceTest: () => this.benchmarkShadowDOM()
    });
  }

  registerFeature(name, config) {
    this.features.set(name, {
      ...config,
      supported: null,
      performance: null,
      lastTested: null
    });
  }

  async runComprehensiveAnalysis() {
    console.log('🔬 Starting DOM Specification Analysis...');

    const results = {
      browserInfo: this.getBrowserInfo(),
      featureSupport: {},
      performanceMetrics: {},
      complianceScore: 0,
      recommendations: []
    };

    // Test all features
    for (const [name, feature] of this.features) {
      console.log(`Testing ${name}...`);

      try {
        feature.supported = feature.testImplementation();
        feature.lastTested = new Date().toISOString();

        if (feature.supported && feature.performanceTest) {
          feature.performance = await feature.performanceTest();
        }

        results.featureSupport[name] = {
          supported: feature.supported,
          specification: feature.specification,
          section: feature.section
        };

        if (feature.performance) {
          results.performanceMetrics[name] = feature.performance;
        }

      } catch (error) {
        console.error(`Error testing ${name}:`, error);
        feature.supported = false;
        results.featureSupport[name] = {
          supported: false,
          error: error.message
        };
      }
    }

    // Calculate compliance score
    results.complianceScore = this.calculateComplianceScore(results.featureSupport);

    // Generate recommendations
    results.recommendations = this.generateRecommendations(results);

    console.log('✅ Analysis complete');
    return results;
  }

  getBrowserInfo() {
    return {
      userAgent: navigator.userAgent,
      vendor: navigator.vendor,
      language: navigator.language,
      platform: navigator.platform,
      deviceMemory: navigator.deviceMemory,
      hardwareConcurrency: navigator.hardwareConcurrency
    };
  }

  // Performance benchmarks for DOM operations
  async benchmarkCloneNode() {
    const iterations = 10000;
    const testElement = document.createElement('div');
    testElement.innerHTML = `
      <div class="container">
        <h1>Title</h1>
        <p>Content with <span>nested</span> elements</p>
        <ul>
          <li>Item 1</li>
          <li>Item 2</li>
          <li>Item 3</li>
        </ul>
      </div>
    `;

    // Shallow clone benchmark
    const shallowStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      testElement.cloneNode(false);
    }
    const shallowTime = performance.now() - shallowStart;

    // Deep clone benchmark
    const deepStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      testElement.cloneNode(true);
    }
    const deepTime = performance.now() - deepStart;

    return {
      shallowClone: {
        totalTime: shallowTime,
        averageTime: shallowTime / iterations,
        operationsPerSecond: iterations / (shallowTime / 1000)
      },
      deepClone: {
        totalTime: deepTime,
        averageTime: deepTime / iterations,
        operationsPerSecond: iterations / (deepTime / 1000)
      }
    };
  }

  async benchmarkMutationObserver() {
    const iterations = 1000;
    const container = document.createElement('div');
    document.body.appendChild(container);

    let mutations = 0;
    const observer = new MutationObserver((mutationList) => {
      mutations += mutationList.length;
    });

    observer.observe(container, {
      childList: true,
      subtree: true,
      attributes: true
    });

    const start = performance.now();

    // Generate mutations
    for (let i = 0; i < iterations; i++) {
      const div = document.createElement('div');
      div.textContent = `Item ${i}`;
      container.appendChild(div);

      if (i % 10 === 0) {
        div.setAttribute('data-index', i.toString());
      }
    }

    // Wait for observer to process
    await new Promise(resolve => setTimeout(resolve, 100));

    const end = performance.now();

    observer.disconnect();
    document.body.removeChild(container);

    return {
      totalTime: end - start,
      mutationsDetected: mutations,
      averageTimePerMutation: (end - start) / mutations,
      mutationsPerSecond: mutations / ((end - start) / 1000)
    };
  }

  async benchmarkCustomElements() {
    if (typeof customElements === 'undefined') {
      return { error: 'Custom Elements not supported' };
    }

    const iterations = 1000;

    // Define test custom element
    class TestElement extends HTMLElement {
      constructor() {
        super();
        this.innerHTML = '<span>Custom Element</span>';
      }
    }

    try {
      customElements.define('test-element-perf', TestElement);
    } catch(e) {
      // Element might already be defined
    }

    const start = performance.now();

    // Create custom elements
    const elements = [];
    for (let i = 0; i < iterations; i++) {
      const element = document.createElement('test-element-perf');
      elements.push(element);

      if (i % 100 === 0) {
        document.body.appendChild(element);
      }
    }

    const end = performance.now();

    // Cleanup
    elements.forEach(el => {
      if (el.parentNode) el.parentNode.removeChild(el);
    });

    return {
      totalTime: end - start,
      averageTime: (end - start) / iterations,
      elementsPerSecond: iterations / ((end - start) / 1000)
    };
  }

  async benchmarkShadowDOM() {
    const iterations = 1000;
    const start = performance.now();

    const elements = [];
    for (let i = 0; i < iterations; i++) {
      const div = document.createElement('div');
      try {
        const shadow = div.attachShadow({ mode: 'open' });
        shadow.innerHTML = '<p>Shadow content</p>';
        elements.push(div);
      } catch(e) {
        return { error: 'Shadow DOM not supported' };
      }
    }

    const end = performance.now();

    return {
      totalTime: end - start,
      averageTime: (end - start) / iterations,
      shadowRootsPerSecond: iterations / ((end - start) / 1000)
    };
  }

  calculateComplianceScore(featureSupport) {
    const totalFeatures = Object.keys(featureSupport).length;
    const supportedFeatures = Object.values(featureSupport)
      .filter(feature => feature.supported).length;

    return Math.round((supportedFeatures / totalFeatures) * 100);
  }

  generateRecommendations(results) {
    const recommendations = [];

    // Feature support recommendations
    Object.entries(results.featureSupport).forEach(([feature, support]) => {
      if (!support.supported) {
        recommendations.push({
          type: 'polyfill',
          feature,
          priority: this.getFeaturePriority(feature),
          message: `Consider polyfill for ${feature}`
        });
      }
    });

    // Performance recommendations
    Object.entries(results.performanceMetrics).forEach(([feature, metrics]) => {
      if (this.isPerformanceBelowThreshold(feature, metrics)) {
        recommendations.push({
          type: 'performance',
          feature,
          priority: 'medium',
          message: `${feature} performance below optimal threshold`
        });
      }
    });

    // Overall recommendations
    if (results.complianceScore < 80) {
      recommendations.push({
        type: 'general',
        priority: 'high',
        message: 'Consider updating browser or implementing polyfills'
      });
    }

    return recommendations;
  }

  getFeaturePriority(feature) {
    const highPriority = ['MutationObserver', 'Custom Elements'];
    const mediumPriority = ['Shadow DOM'];

    if (highPriority.includes(feature)) return 'high';
    if (mediumPriority.includes(feature)) return 'medium';
    return 'low';
  }

  isPerformanceBelowThreshold(feature, metrics) {
    const thresholds = {
      'Node.prototype.cloneNode': {
        deepClone: { operationsPerSecond: 1000 }
      },
      'MutationObserver': {
        mutationsPerSecond: 10000
      },
      'Custom Elements': {
        elementsPerSecond: 1000
      },
      'Shadow DOM': {
        shadowRootsPerSecond: 500
      }
    };

    const threshold = thresholds[feature];
    if (!threshold) return false;

    // Simple threshold checking
    return Object.entries(threshold).some(([metric, minValue]) => {
      const actualValue = this.getMetricValue(metrics, metric);
      return actualValue && actualValue < minValue;
    });
  }

  getMetricValue(metrics, metricPath) {
    return metricPath.split('.').reduce((obj, key) => obj?.[key], metrics);
  }
}
```


### 🏗️ HTML Specification & Browser Object Model Integration


**Advanced BOM Specification Compliance:**


```javascript
// BOM specification analyzer với real-world business logic
class BOMSpecificationAnalyzer {
  constructor() {
    this.specificationFeatures = new Map();
    this.businessImpactMatrix = new Map();
    this.crossBrowserIssues = [];

    this.initializeSpecificationTests();
  }

  initializeSpecificationTests() {
    // Navigator specification compliance
    this.registerSpecTest('Navigator.userAgent', {
      specification: 'HTML Living Standard',
      section: '7.7.5',
      businessCritical: true,
      test: () => {
        return {
          available: typeof navigator.userAgent === 'string',
          value: navigator.userAgent,
          frozen: this.testUserAgentFreezing(),
          entropy: this.calculateUserAgentEntropy(
```


## Claude


navigator.userAgent)
};
}
});


```
this.registerSpecTest('Location API', {
  specification: 'HTML Living Standard',
  section: '7.7.3',
  businessCritical: true,
  test: () => {
    return {
      available: typeof location === 'object',
      features: {
        href: typeof location.href === 'string',
        protocol: typeof location.protocol === 'string',
        hostname: typeof location.hostname === 'string',
        pathname: typeof location.pathname === 'string',
        search: typeof location.search === 'string',
        hash: typeof location.hash === 'string',
        origin: typeof location.origin === 'string'
      },
      manipulation: this.testLocationManipulation(),
      historyIntegration: this.testHistoryIntegration()
    };
  }
});

this.registerSpecTest('History API', {
  specification: 'HTML Living Standard',
  section: '7.7.4',
  businessCritical: true,
  test: () => {
    return {
      available: typeof history === 'object',
      pushState: typeof history.pushState === 'function',
      replaceState: typeof history.replaceState === 'function',
      state: history.state,
      length: history.length,
      scrollRestoration: history.scrollRestoration,
      compliance: this.testHistoryCompliance()
    };
  }
});

this.registerSpecTest('Storage APIs', {
  specification: 'HTML Living Standard',
  section: '12.2',
  businessCritical: true,
  test: () => {
    return {
      localStorage: this.testStorageAPI('localStorage'),
      sessionStorage: this.testStorageAPI('sessionStorage'),
      indexedDB: this.testIndexedDBAPI(),
      storageEvents: this.testStorageEvents()
    };
  }
});
```


}


registerSpecTest(name, config) {
this.specificationFeatures.set(name, {
...config,
results: null,
lastTested: null,
businessImpact: this.calculateBusinessImpact(config.businessCritical)
});
}


calculateBusinessImpact(isCritical) {
return isCritical ? 'high' : 'medium';
}


testUserAgentFreezing() {
// Test if User-Agent string is frozen (privacy enhancement)
const initialUA = navigator.userAgent;


```
// Attempt to detect if UA is frozen by checking for generic patterns
const frozenPatterns = [
  /Chrome\/\d+\.0\.0\.0/, // Frozen Chrome version
  /Safari\/\d+\.0/,       // Frozen Safari version
  /Version\/\d+\.0/       // Generic frozen pattern
];

return frozenPatterns.some(pattern => pattern.test(initialUA));
```


}


calculateUserAgentEntropy(userAgent) {
// Calculate information entropy of User-Agent string
const freq = {};
for (let char of userAgent) {
freq[char] = (freq[char] || 0) + 1;
}


```
const length = userAgent.length;
let entropy = 0;

for (let char in freq) {
  const probability = freq[char] / length;
  entropy -= probability * Math.log2(probability);
}

return {
  entropy: entropy.toFixed(2),
  uniqueness: entropy > 4 ? 'high' : entropy > 2 ? 'medium' : 'low',
  fingerprinting_risk: entropy > 4.5 ? 'high' : 'low'
};
```


}


testLocationManipulation() {
const tests = {};


```
try {
  // Test URL parsing consistency
  const testURL = 'https://example.com:8080/path?query=value#hash';

  // Create a temporary anchor to test URL parsing
  const anchor = document.createElement('a');
  anchor.href = testURL;

  tests.urlParsing = {
    protocol: anchor.protocol === 'https:',
    hostname: anchor.hostname === 'example.com',
    port: anchor.port === '8080',
    pathname: anchor.pathname === '/path',
    search: anchor.search === '?query=value',
    hash: anchor.hash === '#hash'
  };

  // Test hash change detection
  tests.hashChange = this.testHashChangeSupport();

} catch (error) {
  tests.error = error.message;
}

return tests;
```


}


testHashChangeSupport() {
return typeof window.onhashchange !== 'undefined';
}


testHistoryIntegration() {
const tests = {};


```
try {
  // Test if history operations affect location
  const originalPathname = location.pathname;

  // We can't actually change history in tests, but we can check API existence
  tests.pushStateExists = typeof history.pushState === 'function';
  tests.replaceStateExists = typeof history.replaceState === 'function';
  tests.popstateSupported = 'onpopstate' in window;

  // Test state object serialization capability
  tests.stateObjectSupport = this.testStateObjectSerialization();

} catch (error) {
  tests.error = error.message;
}

return tests;
```


}


testHistoryCompliance() {
const compliance = {
stateObjectCloning: false,
titleParameter: false,
urlValidation: false,
securityConstraints: false
};


```
try {
  // Test state object cloning
  const complexState = {
    data: [1, 2, 3],
    nested: { prop: 'value' },
    date: new Date()
  };

  // History API should clone state objects
  history.replaceState(complexState, '', location.href);
  compliance.stateObjectCloning = typeof history.state === 'object';

  // Test title parameter (often ignored by browsers)
  history.replaceState(null, 'Test Title', location.href);
  compliance.titleParameter = true; // API exists even if ignored

  // Test URL validation
  try {
    history.replaceState(null, '', 'invalid://url');
    compliance.urlValidation = false; // Should have thrown
  } catch (e) {
    compliance.urlValidation = true; // Correctly validated
  }

  // Reset to safe state
  history.replaceState(null, '', location.href);

} catch (error) {
  console.warn('History compliance test failed:', error);
}

return compliance;
```


}


testStateObjectSerialization() {
const testCases = [
{ name: 'simple object', value: { key: 'value' } },
{ name: 'array', value: [1, 2, 3] },
{ name: 'nested object', value: { a: { b: { c: 'deep' } } } },
{ name: 'date object', value: new Date() },
{ name: 'function', value: () => {} }, // Should fail
{ name: 'circular reference', value: {} }
];


```
// Create circular reference
testCases[testCases.length - 1].value.self = testCases[testCases.length - 1].value;

const results = {};

testCases.forEach(testCase => {
  try {
    history.replaceState(testCase.value, '', location.href);
    results[testCase.name] = {
      success: true,
      preserved: JSON.stringify(history.state) === JSON.stringify(testCase.value)
    };
  } catch (error) {
    results[testCase.name] = {
      success: false,
      error: error.message
    };
  }
});

// Reset state
history.replaceState(null, '', location.href);

return results;
```


}


testStorageAPI(storageType) {
if (typeof window[storageType] === 'undefined') {
return { available: false };
}


```
const storage = window[storageType];
const tests = {
  available: true,
  quota: null,
  features: {}
};

try {
  // Test basic operations
  const testKey = '__spec_test__';
  const testValue = 'test_value';

  storage.setItem(testKey, testValue);
  tests.features.setItem = storage.getItem(testKey) === testValue;

  storage.removeItem(testKey);
  tests.features.removeItem = storage.getItem(testKey) === null;

  // Test iteration
  tests.features.length = typeof storage.length === 'number';
  tests.features.key = typeof storage.key === 'function';

  // Test clear
  const itemCount = storage.length;
  storage.clear();
  tests.features.clear = storage.length === 0;

  // Test quota (approximate)
  tests.quota = this.estimateStorageQuota(storage);

} catch (error) {
  tests.error = error.message;
}

return tests;
```


}


estimateStorageQuota(storage) {
try {
const testData = 'x'.repeat(1024); // 1KB chunks
let size = 0;
let iterations = 0;
const maxIterations = 10000; // Prevent infinite loop


```
while (iterations < maxIterations) {
    try {
      storage.setItem(`quota_test_${iterations}`, testData);
      size += testData.length;
      iterations++;
    } catch (e) {
      // Quota exceeded
      break;
    }
  }

  // Cleanup
  for (let i = 0; i < iterations; i++) {
    storage.removeItem(`quota_test_${i}`);
  }

  return {
    estimatedBytes: size,
    estimatedMB: Math.round(size / (1024 * 1024)),
    reliable: iterations < maxIterations
  };

} catch (error) {
  return { error: error.message };
}
```


}


testIndexedDBAPI() {
if (typeof indexedDB === 'undefined') {
return { available: false };
}


```
return {
  available: true,
  features: {
    open: typeof indexedDB.open === 'function',
    deleteDatabase: typeof indexedDB.deleteDatabase === 'function',
    databases: typeof indexedDB.databases === 'function'
  },
  version: this.getIndexedDBVersion()
};
```


}


getIndexedDBVersion() {
// Detect IndexedDB version by feature availability
if (typeof IDBKeyRange !== 'undefined' && 'includes' in IDBKeyRange) {
return '3.0'; // Latest features
} else if (typeof IDBTransaction !== 'undefined' && 'objectStoreNames' in IDBTransaction.prototype) {
return '2.0';
} else {
return '1.0';
}
}


testStorageEvents() {
const tests = {
storageEvent: 'onstorage' in window,
crossTab: false // Would need actual cross-tab testing
};


```
try {
  // Test if storage events can be listened to
  const handler = () => {};
  window.addEventListener('storage', handler);
  window.removeEventListener('storage', handler);
  tests.eventListeners = true;
} catch (error) {
  tests.eventListeners = false;
}

return tests;
```


}


async runBOMComplianceAnalysis() {
console.log('🔍 Starting BOM Specification Compliance Analysis...');


```
const results = {
  browserInfo: this.getBrowserInfo(),
  specificationCompliance: {},
  businessRiskAssessment: {},
  recommendations: [],
  crossBrowserIssues: []
};

// Test all BOM features
for (const [name, feature] of this.specificationFeatures) {
  console.log(`Testing ${name}...`);

  try {
    feature.results = feature.test();
    feature.lastTested = new Date().toISOString();

    results.specificationCompliance[name] = {
      ...feature.results,
      businessImpact: feature.businessImpact,
      specification: feature.specification,
      section: feature.section
    };

  } catch (error) {
    console.error(`Error testing ${name}:`, error);
    results.specificationCompliance[name] = {
      error: error.message,
      businessImpact: feature.businessImpact
    };
  }
}

// Assess business risk
results.businessRiskAssessment = this.assessBusinessRisk(results.specificationCompliance);

// Generate recommendations
results.recommendations = this.generateBOMRecommendations(results);

// Identify cross-browser issues
results.crossBrowserIssues = this.identifyCrossBrowserIssues(results);

console.log('✅ BOM Analysis complete');
return results;
```


}


getBrowserInfo() {
return {
userAgent: navigator.userAgent,
vendor: navigator.vendor,
language: navigator.language,
platform: navigator.platform,
cookieEnabled: navigator.cookieEnabled,
onLine: navigator.onLine,
javaEnabled: navigator.javaEnabled(),
hardwareConcurrency: navigator.hardwareConcurrency,
deviceMemory: navigator.deviceMemory,
connection: this.getConnectionInfo()
};
}


getConnectionInfo() {
const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
if (!connection) return { supported: false };


```
return {
  supported: true,
  effectiveType: connection.effectiveType,
  downlink: connection.downlink,
  rtt: connection.rtt,
  saveData: connection.saveData
};
```


}


assessBusinessRisk(compliance) {
const risks = {
high: [],
medium: [],
low: [],
overall: 'low'
};


```
Object.entries(compliance).forEach(([feature, result]) => {
  if (result.error || this.hasComplianceIssues(result)) {
    const risk = this.calculateFeatureRisk(feature, result);
    risks[risk].push(feature);
  }
});

// Determine overall risk
if (risks.high.length > 0) {
  risks.overall = 'high';
} else if (risks.medium.length > 2) {
  risks.overall = 'medium';
}

return risks;
```


}


hasComplianceIssues(result) {
// Check for common compliance issues
if (result.available === false) return true;
if (result.features && Object.values(result.features).some(f => f === false)) return true;
if (result.compliance && Object.values(result.compliance).some(c => c === false)) return true;


```
return false;
```


}


calculateFeatureRisk(feature, result) {
const highRiskFeatures = ['History API', 'Location API', 'Storage APIs'];
const businessCritical = this.specificationFeatures.get(feature)?.businessCritical;


```
if (businessCritical && highRiskFeatures.includes(feature)) {
  return 'high';
} else if (businessCritical || this.hasMultipleIssues(result)) {
  return 'medium';
}

return 'low';
```


}


hasMultipleIssues(result) {
let issueCount = 0;


```
if (result.error) issueCount++;
if (result.features) {
  issueCount += Object.values(result.features).filter(f => f === false).length;
}

return issueCount >= 2;
```


}


generateBOMRecommendations(results) {
const recommendations = [];


```
Object.entries(results.specificationCompliance).forEach(([feature, result]) => {
  if (this.hasComplianceIssues(result)) {
    recommendations.push({
      type: 'compliance',
      feature,
      priority: this.calculateFeatureRisk(feature, result),
      message: this.generateRecommendationMessage(feature, result),
      actions: this.generateRecommendationActions(feature, result)
    });
  }
});

// Add general recommendations
recommendations.push(...this.generateGeneralRecommendations(results));

return recommendations.sort((a, b) => {
  const priorityOrder = { high: 3, medium: 2, low: 1 };
  return priorityOrder[b.priority] - priorityOrder[a.priority];
});
```


}


generateRecommendationMessage(feature, result) {
if (result.error) {
return `${feature} has implementation errors that may affect functionality`;
}


```
if (result.available === false) {
  return `${feature} is not available in this browser`;
}

return `${feature} has partial compliance issues that may cause unexpected behavior`;
```


}


generateRecommendationActions(feature, result) {
const actions = [];


```
if (result.available === false) {
  actions.push('Implement polyfill or fallback mechanism');
  actions.push('Add feature detection before usage');
}

if (result.features) {
  const failedFeatures = Object.entries(result.features)
    .filter(([, supported]) => !supported)
    .map(([name]) => name);

  if (failedFeatures.length > 0) {
    actions.push(`Address missing features: ${failedFeatures.join(', ')}`);
  }
}

if (result.compliance) {
  const failedCompliance = Object.entries(result.compliance)
    .filter(([, compliant]) => !compliant)
    .map(([name]) => name);

  if (failedCompliance.length > 0) {
    actions.push(`Fix compliance issues: ${failedCompliance.join(', ')}`);
  }
}

return actions;
```


}


generateGeneralRecommendations(results) {
const general = [];


```
// Browser update recommendation
if (results.businessRiskAssessment.overall === 'high') {
  general.push({
    type: 'general',
    priority: 'high',
    message: 'Multiple critical BOM features have compliance issues',
    actions: [
      'Consider browser update requirements',
      'Implement comprehensive feature detection',
      'Create fallback strategies for critical features'
    ]
  });
}

// Performance recommendation
const performanceIssues = this.identifyPerformanceIssues(results);
if (performanceIssues.length > 0) {
  general.push({
    type: 'performance',
    priority: 'medium',
    message: 'Performance issues detected in BOM operations',
    actions: performanceIssues
  });
}

return general;
```


}


identifyPerformanceIssues(results) {
const issues = [];


```
// Check storage quota
Object.entries(results.specificationCompliance).forEach(([feature, result]) => {
  if (feature === 'Storage APIs' && result.localStorage?.quota) {
    const quota = result.localStorage.quota;
    if (quota.estimatedMB < 5) {
      issues.push('localStorage quota is below recommended 5MB');
    }
  }
});

return issues;
```


}


identifyCrossBrowserIssues(results) {
// This would typically compare results across multiple browsers
// For now, we identify potential cross-browser issues based on known patterns


```
const issues = [];

// User-Agent issues
const userAgentResult = results.specificationCompliance['Navigator.userAgent'];
if (userAgentResult?.frozen) {
  issues.push({
    category: 'privacy',
    feature: 'Navigator.userAgent',
    issue: 'User-Agent string appears to be frozen for privacy',
    impact: 'Feature detection may be unreliable',
    browsers: ['Chrome 100+', 'Firefox 100+']
  });
}

// Storage issues
const storageResult = results.specificationCompliance['Storage APIs'];
if (storageResult?.localStorage?.quota?.estimatedMB < 5) {
  issues.push({
    category: 'storage',
    feature: 'localStorage',
    issue: 'Storage quota is limited in private browsing mode',
    impact: 'Application state persistence may fail',
    browsers: ['Safari Private', 'Firefox Private']
  });
}

return issues;
```


}
}


```
### 🏗️ Đánh Giá Thông Số Kỹ Thuật CSS (CSSOM) Chuyên Sâu

**Implementation Analysis của CSS Object Model:**

```javascript
// Hệ thống phân tích CSSOM specifications toàn diện
class CSSOMSpecificationAnalyzer {
  constructor() {
    this.cssFeatures = new Map();
    this.performanceMetrics = new Map();
    this.compatibilityMatrix = new Map();

    this.initializeCSSOMTests();
  }

  initializeCSSOMTests() {
    // CSS.supports() API testing
    this.registerCSSTest('CSS.supports', {
      specification: 'CSS Conditional Rules Module Level 3',
      businessCritical: true,
      test: () => {
        if (typeof CSS === 'undefined' || typeof CSS.supports !== 'function') {
          return { available: false };
        }

        return {
          available: true,
          propertySupport: this.testPropertySupport(),
          selectorSupport: this.testSelectorSupport(),
          performance: this.benchmarkCSSSupports()
        };
      }
    });

    // StyleSheet API testing
    this.registerCSSTest('StyleSheet API', {
      specification: 'CSSOM',
      businessCritical: true,
      test: () => {
        return {
          available: typeof document.styleSheets !== 'undefined',
          features: {
            insertRule: this.testInsertRule(),
            deleteRule: this.testDeleteRule(),
            cssRules: this.testCSSRules(),
            media: this.testMediaQueries()
          },
          performance: this.benchmarkStyleSheetOperations()
        };
      }
    });

    // Custom Properties (CSS Variables) testing
    this.registerCSSTest('CSS Custom Properties', {
      specification: 'CSS Custom Properties for Cascading Variables Module Level 1',
      businessCritical: true,
      test: () => {
        return {
          available: CSS.supports('color', 'var(--test)'),
          features: {
            basicSupport: this.testBasicCustomProperties(),
            inheritance: this.testCustomPropertyInheritance(),
            fallbacks: this.testCustomPropertyFallbacks(),
            cascade: this.testCustomPropertyCascade()
          },
          performance: this.benchmarkCustomProperties()
        };
      }
    });

    // CSS Typed OM testing
    this.registerCSSTest('CSS Typed OM', {
      specification: 'CSS Typed OM Level 1',
      businessCritical: false,
      test: () => {
        return {
          available: typeof CSS !== 'undefined' && typeof CSS.number === 'function',
          features: {
            numberValues: this.testCSSNumberValue(),
            unitValues: this.testCSSUnitValue(),
            keywordValues: this.testCSSKeywordValue(),
            styleMap: this.testStyleMap()
          },
          performance: this.benchmarkTypedOM()
        };
      }
    });
  }

  registerCSSTest(name, config) {
    this.cssFeatures.set(name, {
      ...config,
      results: null,
      lastTested: null
    });
  }

  testPropertySupport() {
    const properties = [
      // Layout properties
      { property: 'display', value: 'grid' },
      { property: 'display', value: 'flex' },
      { property: 'display', value: 'subgrid' },

      // Transform properties
      { property: 'transform', value: 'translateZ(0)' },
      { property: 'transform-style', value: 'preserve-3d' },

      // Animation properties
      { property: 'animation-timeline', value: 'scroll()' },
      { property: 'animation-range', value: 'contain' },

      // Color properties
      { property: 'color', value: 'oklch(0.7 0.15 180)' },
      { property: 'color', value: 'color(display-p3 1 0 0)' },

      // Container queries
      { property: 'container-type', value: 'inline-size' },
      { property: 'container-name', value: 'sidebar' }
    ];

    const results = {};

    properties.forEach(({ property, value }) => {
      const key = `${property}: ${value}`;
      try {
        results[key] = CSS.supports(property, value);
      } catch (error) {
        results[key] = false;
      }
    });

    return results;
  }

  testSelectorSupport() {
    const selectors = [
      ':has(.child)',
      ':where(.class)',
      ':is(.class)',
      '@container (min-width: 300px)',
      '@media (prefers-color-scheme: dark)',
      '@supports (display: grid)'
    ];

    const results = {};

    selectors.forEach(selector => {
      try {
        results[selector] = CSS.supports(`selector(${selector})`);
      } catch (error) {
        // Fallback: try to use the selector in a style rule
        try {
          const sheet = document.createElement('style').sheet;
          sheet.insertRule(`${selector} { color: red; }`, 0);
          results[selector] = true;
          sheet.deleteRule(0);
        } catch (e) {
          results[selector] = false;
        }
      }
    });

    return results;
  }

  benchmarkCSSSupports() {
    const iterations = 10000;
    const testProperty = 'display';
    const testValue = 'flex';

    const start = performance.now();

    for (let i = 0; i < iterations; i++) {
      CSS.supports(testProperty, testValue);
    }

    const end = performance.now();

    return {
      totalTime: end - start,
      averageTime: (end - start) / iterations,
      operationsPerSecond: iterations / ((end - start) / 1000)
    };
  }

  testInsertRule() {
    try {
      const style = document.createElement('style');
      document.head.appendChild(style);
      const sheet = style.sheet;

      // Test basic rule insertion
      const ruleIndex = sheet.insertRule('.test { color: red; }', 0);
      const success = ruleIndex === 0 && sheet.cssRules.length === 1;

      // Test media rule insertion
      sheet.insertRule('@media (min-width: 600px) { .responsive { display: block; } }', 1);
      const mediaSuccess = sheet.cssRules.length === 2;

      // Cleanup
      document.head.removeChild(style);

      return {
        basicRule: success,
        mediaRule: mediaSuccess,
        keyframeRule: this.testKeyframeInsertion()
      };

    } catch (error) {
      return { error: error.message };
    }
  }

  testKeyframeInsertion() {
    try {
      const style = document.createElement('style');
      document.head.appendChild(style);
      const sheet = style.sheet;

      const keyframeRule = `
        @keyframes testAnimation {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
      `;

      sheet.insertRule(keyframeRule, 0);
      const success = sheet.cssRules.length === 1 &&
                     sheet.cssRules[0].type === CSSRule.KEYFRAMES_RULE;

      document.head.removeChild(style);
      return success;

    } catch (error) {
      return false;
    }
  }

  testDeleteRule() {
    try {
      const style = document.createElement('style');
      document.head.appendChild(style);
      const sheet = style.sheet;

      // Insert multiple rules
      sheet.insertRule('.rule1 { color: red; }', 0);
      sheet.insertRule('.rule2 { color: blue; }', 1);
      sheet.insertRule('.rule3 { color: green; }', 2);

      // Delete middle rule
      sheet.deleteRule(1);

      const success = sheet.cssRules.length === 2 &&
                     sheet.cssRules[1].selectorText === '.rule3';

      document.head.removeChild(style);
      return success;

    } catch (error) {
      return false;
    }
  }

  testCSSRules() {
    try {
      const sheet = document.styleSheets[0];
      if (!sheet) return { available: false };

      return {
        available: true,
        cssRules: typeof sheet.cssRules !== 'undefined',
        rules: typeof sheet.rules !== 'undefined', // IE legacy
        length: typeof sheet.cssRules?.length === 'number',
        iteration: this.testRuleIteration(sheet)
      };

    } catch (error) {
      return { error: error.message };
    }
  }

  testRuleIteration(sheet) {
    try {
      let ruleCount = 0;

      // Test Array.from iteration
      const rulesArray = Array.from(sheet.cssRules || []);
      ruleCount = rulesArray.length;

      // Test for...of iteration
      let iterationCount = 0;
      for (const rule of sheet.cssRules || []) {
        iterationCount++;
        if (iterationCount > 1000) break; // Safety break
      }

      return {
        arrayFrom: ruleCount >= 0,
        forOf: iterationCount === ruleCount,
        indexAccess: sheet.cssRules?.[0] !== undefined
      };

    } catch (error) {
      return { error: error.message };
    }
  }

  testMediaQueries() {
    try {
      const style = document.createElement('style');
      document.head.appendChild(style);
      const sheet = style.sheet;

      // Insert media query rule
      const mediaRule = '@media (min-width: 768px) { .responsive { display: block; } }';
      sheet.insertRule(mediaRule, 0);

      const rule = sheet.cssRules[0];
      const isMediaRule = rule.type === CSSRule.MEDIA_RULE;

      const tests = {
        insertion: isMediaRule,
        mediaText: typeof rule.media?.mediaText === 'string',
        cssRules: typeof rule.cssRules?.length === 'number',
        manipulation: this.testMediaRuleManipulation(rule)
      };

      document.head.removeChild(style);
      return tests;

    } catch (error) {
      return { error: error.message };
    }
  }

  testMediaRuleManipulation(mediaRule) {
    try {
      // Test nested rule insertion
      const initialCount = mediaRule.cssRules.length;
      mediaRule.insertRule('.nested { color: red; }', 0);
      const afterInsert = mediaRule.cssRules.length;

      // Test nested rule deletion
      mediaRule.deleteRule(0);
      const afterDelete = mediaRule.cssRules.length;

      return {
        insert: afterInsert === initialCount + 1,
        delete: afterDelete === initialCount
      };

    } catch (error) {
      return { error: error.message };
    }
  }

  benchmarkStyleSheetOperations() {
    const iterations = 1000;
    const style = document.createElement('style');
    document.head.appendChild(style);
    const sheet = style.sheet;

    // Benchmark rule insertion
    const insertStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      sheet.insertRule(`.rule${i} { color: red; }`, sheet.cssRules.length);
    }
    const insertEnd = performance.now();

    // Benchmark rule access
    const accessStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      const rule = sheet.cssRules[i % sheet.cssRules.length];
      rule.selectorText; // Force property access
    }
    const accessEnd = performance.now();

    // Benchmark rule deletion
    const deleteStart = performance.now();
    while (sheet.cssRules.length > 0) {
      sheet.deleteRule(sheet.cssRules.length - 1);
    }
    const deleteEnd = performance.now();

    document.head.removeChild(style);

    return {
      insertion: {
        totalTime: insertEnd - insertStart,
        averageTime: (insertEnd - insertStart) / iterations,
        rulesPerSecond: iterations / ((insertEnd - insertStart) / 1000)
      },
      access: {
        totalTime: accessEnd - accessStart,
        averageTime: (accessEnd - accessStart) / iterations,
        accessesPerSecond: iterations / ((accessEnd - accessStart) / 1000)
      },
      deletion: {
        totalTime: deleteEnd - deleteStart,
        rulesDeleted: iterations
      }
    };
  }

  testBasicCustomProperties() {
    try {
      const testElement = document.createElement('div');
      document.body.appendChild(testElement);

      // Test setting custom property
      testElement.style.setProperty('--test-color', 'red');
      const setValue = testElement.style.getPropertyValue('--test-color');

      // Test using custom property
      testElement.style.color = 'var(--test-color)';
      const computedStyle = getComputedStyle(testElement);
      const computedColor = computedStyle.color;

      document.body.removeChild(testElement);

      return {
        setProperty: setValue === 'red',
        getProperty: setValue === 'red',
        varFunction: computedColor.includes('rgb') || computedColor === 'red'
      };

    } catch (error) {
      return { error: error.message };
    }
  }

  testCustomPropertyInheritance() {
    try {
      const parent = document.createElement('div');
      const child = document.createElement('div');
      parent.appendChild(child);
      document.body.appendChild(parent);

      // Set custom property on parent
      parent.style.setProperty('--inherited-color', 'blue');
      child.style.color = 'var(--inherited-color)';

      const childComputedStyle = getComputedStyle(child);
      const inheritedColor = childComputedStyle.color;

      document.body.removeChild(parent);

      return {
        inheritance: inheritedColor.includes('rgb') || inheritedColor === 'blue'
      };

    } catch (error) {
      return { error: error.message };
    }
  }

  testCustomPropertyFallbacks() {
    try {
      const testElement = document.createElement('div');
      document.body.appendChild(testElement);

      // Test fallback value
      testElement.style.color = 'var(--nonexistent, green)';
      const computedStyle = getComputedStyle(testElement);
      const fallbackColor = computedStyle.color;

      // Test nested fallbacks
      testElement.style.backgroundColor = 'var(--also-nonexistent, var(--still-nonexistent, yellow))';
      const nestedFallback = computedStyle.backgroundColor;

      document.body.removeChild(testElement);

      return {
        basicFallback: fallbackColor.includes('rgb') || fallbackColor === 'green',
        nestedFallback: nestedFallback.includes('rgb') || nestedFallback === 'yellow'
      };

    } catch (error) {
      return { error: error.message };
    }
  }

  testCustomPropertyCascade() {
    try {
      const style = document.createElement('style');
      style.textContent = `
        .cascade-test {
          --cascade-color: red;
        }
        .cascade-test.override {
          --cascade-color: blue;
        }
      `;
      document.head.appendChild(style);

      const testElement = document.createElement('div');
      testElement.className = 'cascade-test';
      testElement.style.color = 'var(--cascade-color)';
      document.body.appendChild(testElement);

      const initialColor = getComputedStyle(testElement).color;

      // Test cascade override
      testElement.classList.add('override');
      const overrideColor = getComputedStyle(testElement).color;

      // Test inline style override
      testElement.style.setProperty('--cascade-color', 'green');
      const inlineColor = getComputedStyle(testElement).color;

      document.head.removeChild(style);
      document.body.removeChild(testElement);

      return {
        initialValue: initialColor === 'red' || initialColor.includes('rgb'),
        cascadeOverride: overrideColor !== initialColor,
        inlineOverride: inlineColor !== overrideColor
      };

    } catch (error) {
      return { error: error.message };
    }
  }

  benchmarkCustomProperties() {
    const iterations = 10000;
    const testElement = document.createElement('div');
    document.body.appendChild(testElement);

    // Benchmark setting custom properties
    const setStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      testElement.style.setProperty(`--prop${i}`, `value${i}`);
    }
    const setEnd = performance.now();

    // Benchmark getting custom properties
    const getStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      testElement.style.getPropertyValue(`--prop${i}`);
    }
    const getEnd = performance.now();

    document.body.removeChild(testElement);

    return {
      setting: {
        totalTime: setEnd - setStart,
        averageTime: (setEnd - setStart) / iterations,
        operationsPerSecond: iterations / ((setEnd - setStart) / 1000)
      },
      getting: {
        totalTime: getEnd - getStart,
        averageTime: (getEnd - getStart) / iterations,
        operationsPerSecond: iterations / ((getEnd - getStart) / 1000)
      }
    };
  }

  testCSSNumberValue() {
    if (typeof CSS === 'undefined' || typeof CSS.number !== 'function') {
      return { available: false };
    }

    try {
      const numberValue = CSS.number(42);

      return {
        available: true,
        creation: numberValue instanceof CSSNumberValue,
        value: numberValue.value === 42,
        unit: numberValue.unit === 'number'
      };

    } catch (error) {
      return { error: error.message };
    }
  }

  testCSSUnitValue() {
    if (typeof CSS === 'undefined' || typeof CSS.px !== 'function') {
      return { available: false };
    }

    try {
      const pxValue = CSS.px(100);
      const emValue = CSS.em(2);

      return {
        available: true,
        px: pxValue instanceof CSSUnitValue && pxValue.value === 100,
        em: emValue instanceof CSSUnitValue && emValue.unit === 'em',
        arithmetic: this.testCSSArithmetic(pxValue, emValue)
      };

    } catch (error) {
      return { error: error.message };
    }
  }

  testCSSArithmetic(value1, value2) {
    try {
      // Test addition (should work with same units)
      const pxValue1 = CSS.px(100);
      const pxValue2 = CSS.px(50);
      const sum = pxValue1.add(pxValue2);

      return {
        addition: sum instanceof CSSMathSum,
        subtraction: typeof pxValue1.sub === 'function',
        multiplication: typeof pxValue1.mul === 'function',
        division: typeof pxValue1.div === 'function'
      };

    } catch (error) {
      return { error: error.message };
    }
  }

  testCSSKeywordValue() {
    if (typeof CSS === 'undefined' || typeof CSS.keyword !== 'function') {
      return { available: false };
    }

    try {
      const keyword = CSS.keyword('auto');

      return {
        available: true,
        creation: keyword instanceof CSSKeywordValue,
        value: keyword.value === 'auto'
      };

    } catch (error) {
      return { error: error.message };
    }
  }

  testStyleMap() {
    try {
      const testElement = document.createElement('div');
      document.body.appendChild(testElement);

      const hasAttributeStyleMap = 'attributeStyleMap' in testElement;
      const hasComputedStyleMap = 'computedStyleMap' in testElement;

      let attributeStyleMapWorks = false;
      let computedStyleMapWorks = false;

      if (hasAttributeStyleMap) {
        try {
          testElement.attributeStyleMap.set('color', CSS.keyword('red'));
          attributeStyleMapWorks = true;
        } catch (e) {
          // Method exists but might not work
        }
      }

      if (hasComputedStyleMap) {
        try {
          const computedMap = testElement.computedStyleMap();
          computedStyleMapWorks = computedMap instanceof StylePropertyMap;
        } catch (e) {
          // Method exists but might not work
        }
      }

      document.body.removeChild(testElement);

      return {
        attributeStyleMap: hasAttributeStyleMap && attributeStyleMapWorks,
        computedStyleMap: hasComputedStyleMap && computedStyleMapWorks
      };

    } catch (error) {
      return { error: error.message };
    }
  }

  benchmarkTypedOM() {
    if (typeof CSS === 'undefined' || typeof CSS.px !== 'function') {
      return { available: false };
    }

    const iterations = 10000;

    // Benchmark CSS value creation
    const createStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      CSS.px(i);
    }
    const createEnd = performance.now();

    // Benchmark value manipulation
    const value = CSS.px(100);
    const manipulateStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      value.add(CSS.px(1));
    }
    const manipulateEnd = performance.now();

    return {
      creation: {
        totalTime: createEnd - createStart,
        averageTime: (createEnd - createStart) / iterations,
        operationsPerSecond: iterations / ((createEnd - createStart) / 1000)
      },
      manipulation: {
        totalTime: manipulateEnd - manipulateStart,
        averageTime: (manipulateEnd - manipulateStart) / iterations,
        operationsPerSecond: iterations / ((manipulateEnd - manipulateStart) / 1000)
      }
    };
  }

  async runCSSOMAnalysis() {
    console.log('🎨 Starting CSSOM Specification Analysis...');

    const results = {
      browserInfo: this.getBrowserInfo(),
      cssomCompliance: {},
      modernFeatureSupport: {},
      performanceAnalysis: {},
      recommendations: []
    };

    // Test all CSSOM features
    for (const [name, feature] of this.cssFeatures) {
      console.log(`Testing ${name}...`);

      try {
        feature.results = feature.test();
        feature.lastTested = new Date().toISOString();

        results.cssomCompliance[name] = {
          ...feature.results,
          specification: feature.specification,
          businessCritical: feature.businessCritical
        };

      } catch (error) {
        console.error(`Error testing ${name}:`, error);
        results.cssomCompliance[name] = {
          error: error.message
        };
      }
    }

    // Analyze modern CSS feature support
    results.modernFeatureSupport = this.analyzeModernCSSFeatures();

    // Aggregate performance analysis
    results.performanceAnalysis = this.aggregatePerformanceResults(results.cssomCompliance);

    // Generate recommendations
    results.recommendations = this.generateCSSOMRecommendations(results);

    console.log('✅ CSSOM Analysis complete');
    return results;
  }

  getBrowserInfo() {
    return {
      userAgent: navigator.userAgent,
      vendor: navigator.vendor,
      cssSupportsAPI: typeof CSS !== 'undefined' && typeof CSS.supports === 'function',
      styleSheetsCount: document.styleSheets.length
    };
  }

  analyzeModernCSSFeatures() {
    const modernFeatures = [
      'Container Queries',
      'CSS Cascade Layers',
      'CSS Color Level 4',
      'CSS Grid Level 2',
      'CSS Scroll-driven Animations'
    ];

    const support = {};

    // Container Queries
    support['Container Queries'] = {
      containerType: CSS.supports('container-type', 'inline-size'),
      containerQuery: CSS.supports('(min-width: 300px)') // Simplified test
    };

    // Cascade Layers
    support['CSS Cascade Layers'] = {
      layerRule: this.testAtLayerRule()
    };

    // Color Level 4
    support['CSS Color Level 4'] = {
      oklch: CSS.supports('color', 'oklch(0.7 0.15 180)'),
      colorFunction: CSS.supports('color', 'color(display-p3 1 0 0)')
    };

    return support;
  }

  testAtLayerRule() {
    try {
      const style = document.createElement('style');
      document.head.appendChild(style);
      const sheet = style.sheet;

      sheet.insertRule('@layer base { .test { color: red; } }', 0);
      const success = sheet.cssRules.length === 1;

      document.head.removeChild(style);
      return success;

    } catch (error) {
      return false;
    }
  }

  aggregatePerformanceResults(compliance) {
    const performance = {
      overallScore: 0,
      criticalIssues: [],
      recommendations: []
    };

    let totalOperations = 0;
    let totalTime = 0;

    Object.entries(compliance).forEach(([feature, result]) => {
      if (result.performance) {
        const perf = result.performance;

        // Aggregate timing data
        if (perf.totalTime) {
          totalTime += perf.totalTime;
          totalOperations++;
        }

        // Check for performance issues
        if (this.hasPerformanceIssues(feature, perf)) {
          performance.criticalIssues.push({
            feature,
            issue: this.identifyPerformanceIssue(feature, perf)
          });
        }
      }
    });

    // Calculate overall score
    performance.overallScore = Math.max(0, 100 - (performance.criticalIssues.length * 20));

    return performance;
  }

  hasPerformanceIssues(feature, performance) {
    // Define performance thresholds
    const thresholds = {
      'CSS.supports': { operationsPerSecond: 100000 },
      'StyleSheet API': { rulesPerSecond: 10000 },
      'CSS Custom Properties': { operationsPerSecond: 50000 }
    };

    const threshold = thresholds[feature];
    if (!threshold) return false;

    // Check if performance metrics fall below thresholds
    return Object.entries(threshold).some(([metric, minValue]) => {
      const actualValue = this.extractPerformanceMetric(performance, metric);
      return actualValue && actualValue < minValue;
    });
  }

  extractPerformanceMetric(performance, metric) {
    // Navigate through nested performance object to find metric
    if (performance[metric]) return performance[metric];

    // Check nested objects
    for (const key in performance) {
      if (typeof performance[key] === 'object' && performance[key][metric]) {
        return performance[key][metric];
      }
    }

    return null;
  }

  identifyPerformanceIssue(feature, performance) {
    if (feature === 'CSS.supports' && performance.operationsPerSecond < 100000) {
      return 'CSS.supports() operations are slower than expected';
    }

    if (feature === 'StyleSheet API' && performance.insertion?.rulesPerSecond < 10000) {
      return 'Stylesheet rule insertion is slower than expected';
    }

    return 'Performance below optimal thresholds';
  }

  generateCSSOMRecommendations(results) {
    const recommendations = [];

    // Feature support recommendations
    Object.entries(results.cssomCompliance).forEach(([feature, result]) => {
      if (!result.available) {
        recommendations.push({
          type: 'feature-support',
          feature,
          priority: result.businessCritical ? 'high' : 'medium',
          message: `${feature} is not available`,
          actions: ['Consider progressive enhancement', 'Implement feature detection']
        });
      }
    });

    // Performance recommendations
    if (results.performanceAnalysis.criticalIssues.length > 0) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        message: 'CSS operations performance issues detected',
        actions: [
          'Batch CSS rule operations',
          'Use requestAnimationFrame for style changes',
          'Consider CSS-in-JS libraries with optimization'
        ]
      });
    }

    // Modern feature recommendations
    const modernSupport = results.modernFeatureSupport;
    if (modernSupport['Container Queries'] && !modernSupport['Container Queries'].containerType) {
      recommendations.push({
        type: 'modern-css',
        priority: 'medium',
        message: 'Container Queries not supported',
        actions: [
          'Use container query polyfill',
          'Implement responsive design fallbacks'
        ]
      });
    }

    return recommendations;
  }
}
```


### 🎯 Production Engineering Deep Dive: Cross-Browser Strategy


💭 **Principal's Real-World Experience:**
*Tại Figma, chúng tôi deal với extreme browser compatibility requirements. Design tools cần work consistently across Chrome, Firefox, Safari, và even Edge. Strategy là build progressive enhancement system với automatic fallback detection. Không thể assume users có latest browsers.*


**Comprehensive Cross-Browser Compatibility Framework:**


```javascript
// Production-ready cross-browser compatibility management system
class CrossBrowserCompatibilityManager {
  constructor() {
    this.browserFeatures = new Map();
    this.polyfills = new Map();
    this.fallbackStrategies = new Map();
    this.performanceBaselines = new Map();

    this.initializeCompatibilityMatrix();
  }

  initializeCompatibilityMatrix() {
    // Browser detection with version parsing
    this.browserInfo = this.detectBrowserDetails();

    // Feature compatibility matrix
    this.featureMatrix = this.buildFeatureMatrix();

    // Load polyfill registry
    this.initializePolyfillRegistry();

    // Setup monitoring
    this.setupCompatibilityMonitoring();
  }

  detectBrowserDetails() {
    const userAgent = navigator.userAgent;
    const vendor = navigator.vendor;

    // Sophisticated browser detection
    const browsers = {
      chrome: /Chrome\/(\d+)/.exec(userAgent),
      firefox: /Firefox\/(\d+)/.exec(userAgent),
      safari: /Version\/(\d+).*Safari/.exec(userAgent),
      edge: /Edg\/(\d+)/.exec(userAgent),
      ie: /MSIE (\d+)|Trident.*rv:(\d+)/.exec(userAgent)
    };

    let detectedBrowser = 'unknown';
    let version = 0;

    for (const [browser, match] of Object.entries(browsers)) {
      if (match) {
        detectedBrowser = browser;
        version = parseInt(match[1] || match[2]);
        break;
      }
    }

    return {
      name: detectedBrowser,
      version,
      userAgent,
      vendor,
      engine: this.detectEngine(detectedBrowser),
      mobile: /Mobile|Android|iPhone|iPad/.test(userAgent),
      capabilities: this.detectBrowserCapabilities()
    };
  }

  detectEngine(browserName) {
    const engineMap = {
      chrome: 'Blink',
      edge: 'Blink',
      firefox: 'Gecko',
      safari: 'WebKit',
      ie: 'Trident'
    };

    return engineMap[browserName] || 'Unknown';
  }

  detectBrowserCapabilities() {
    return {
      // Core JavaScript features
      es6Classes: this.testES6Classes(),
      es6Modules: this.testES6Modules(),
      es6Promises: this.testES6Promises(),
      asyncAwait: this.testAsyncAwait(),

      // DOM features
      customElements: this.testCustomElements(),
      shadowDOM: this.testShadowDOM(),
      intersectionObserver: this.testIntersectionObserver(),
      resizeObserver: this.testResizeObserver(),

      // CSS features
      cssGrid: this.testCSSGrid(),
      cssFlexbox: this.testCSSFlexbox(),
      cssCustomProperties: this.testCSSCustomProperties(),
      cssContainerQueries: this.testCSSContainerQueries(),

      // Web APIs
      fetch: this.testFetch(),
      serviceWorker: this.testServiceWorker(),
      webAssembly: this.testWebAssembly(),
      webGL: this.testWebGL(),

      // Storage
      localStorage: this.testLocalStorage(),
      indexedDB: this.testIndexedDB(),

      // Media
      webRTC: this.testWebRTC(),
      mediaDevices: this.testMediaDevices()
    };
  }

  // Feature test implementations
  testES6Classes() {
    try {
      eval('class TestClass {}');
      return true;
    } catch (e) {
      return false;
    }
  }

  testES6Modules() {
    return 'import' in document.createElement('script');
  }

  testES6Promises() {
    return typeof Promise !== 'undefined' && typeof Promise.resolve === 'function';
  }

  testAsyncAwait() {
    try {
      eval('(async function() {})');
      return true;
    } catch (e) {
      return false;
    }
  }

  testCustomElements() {
    return typeof customElements !== 'undefined';
  }

  testShadowDOM() {
    return typeof Element.prototype.attachShadow === 'function';
  }

  testIntersectionObserver() {
    return typeof IntersectionObserver !== 'undefined';
  }

  testResizeObserver() {
    return typeof ResizeObserver !== 'undefined';
  }

  testCSSGrid() {
    return CSS.supports('display', 'grid');
  }

  testCSSFlexbox() {
    return CSS.supports('display', 'flex');
  }

  testCSSCustomProperties() {
    return CSS.supports('color', 'var(--test)');
  }

  testCSSContainerQueries() {
    return CSS.supports('container-type', 'inline-size');
  }

  testFetch() {
    return typeof fetch !== 'undefined';
  }

  testServiceWorker() {
    return 'serviceWorker' in navigator;
  }

  testWebAssembly() {
    return typeof WebAssembly !== 'undefined';
  }

  testWebGL() {
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    } catch (e) {
      return false;
    }
  }

  testLocalStorage() {
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      return true;
    } catch (e) {
      return false;
    }
  }

  testIndexedDB() {
    return typeof indexedDB !== 'undefined';
  }

  testWebRTC() {
    return typeof RTCPeerConnection !== 'undefined';
  }

  testMediaDevices() {
    return navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function';
  }

  buildFeatureMatrix() {
    // Build comprehensive feature support matrix
    return {
      // JavaScript Features
      'ES6 Classes': {
        chrome: { min: 49, current: this.browserInfo.name === 'chrome' && this.browserInfo.version >= 49 },
        firefox: { min: 45, current: this.browserInfo.name === 'firefox' && this.browserInfo.version >= 45 },
        safari: { min: 9, current: this.browserInfo.name === 'safari' && this.browserInfo.version >= 9 },
        edge: { min: 13, current: this.browserInfo.name === 'edge' && this.browserInfo.version >= 13 }
      },

      'CSS Grid': {
        chrome: { min: 57, current: this.browserInfo.name === 'chrome' && this.browserInfo.version >= 57 },
        firefox: { min: 52, current: this.browserInfo.name === 'firefox' && this.browserInfo.version >= 52 },
        safari: { min: 10.1, current: this.browserInfo.name === 'safari' && this.browserInfo.version >= 10 },
        edge: { min: 16, current: this.browserInfo.name === 'edge' && this.browserInfo.version >= 16 }
      },

      'Custom Elements': {
        chrome: { min: 54, current: this.browserInfo.name === 'chrome' && this.browserInfo.version >= 54 },
        firefox: { min: 63, current: this.browserInfo.name === 'firefox' && this.browserInfo.version >= 63 },
        safari: { min: 10.1, current: this.browserInfo.name === 'safari' && this.browserInfo.version >= 10 },
        edge: { min: 79, current: this.browserInfo.name === 'edge' && this.browserInfo.version >= 79 }
      },

      'Shadow DOM': {
        chrome: { min: 53, current: this.browserInfo.name === 'chrome' && this.browserInfo.version >= 53 },
        firefox: { min: 63, current: this.browserInfo.name === 'firefox' && this.browserInfo.version >= 63 },
        safari: { min: 10, current: this.browserInfo.name === 'safari' && this.browserInfo.version >= 10 },
        edge: { min: 79, current: this.browserInfo.name === 'edge' && this.browserInfo.version >= 79 }
      }
    };
  }

  initializePolyfillRegistry() {
    // Register polyfills cho các features
    this.registerPolyfill('ES6 Classes', {
      condition: () => !this.browserInfo.capabilities.es6Classes,
      polyfill: 'https://polyfill.io/v3/polyfill.min.js?features=es6',
      fallback: () => this.implementES5ClassPattern()
    });

    this.registerPolyfill('CSS Grid', {
      condition: () => !this.browserInfo.capabilities.cssGrid,
      polyfill: 'css-grid-polyfill',
      fallback: () => this.implementFlexboxFallback()
    });

    this.registerPolyfill('Custom Elements', {
      condition: () => !this.browserInfo.capabilities.customElements,
      polyfill: '@webcomponents/custom-elements',
      fallback: () => this.implementCustomElementsFallback()
    });

    this.registerPolyfill('Intersection Observer', {
      condition: () => !this.browserInfo.capabilities.intersectionObserver,
      polyfill: 'intersection-observer',
      fallback: () => this.implementScrollBasedVisibility()
    });

    this.registerPolyfill('Fetch API', {
      condition: () => !this.browserInfo.capabilities.fetch,
      polyfill: 'whatwg-fetch',
      fallback: () => this.implementXMLHttpRequestWrapper()
    });
  }

  registerPolyfill(feature, config) {
    this.polyfills.set(feature, {
      ...config,
      loaded: false,
      fallbackActive: false
    });
  }

  async loadPolyfillsForCurrentBrowser() {
    console.log('🔧 Loading polyfills for browser compatibility...');

    const loadPromises = [];

    for (const [feature, polyfillConfig] of this.polyfills) {
      if (polyfillConfig.condition()) {
        console.log(`Loading polyfill for: ${feature}`);

        try {
          if (typeof polyfillConfig.polyfill === 'string') {
            // External polyfill
            await this.loadExternalPolyfill(polyfillConfig.polyfill);
          } else {
            // Custom polyfill function
            await polyfillConfig.polyfill();
          }

          polyfillConfig.loaded = true;

        } catch (error) {
          console.warn(`Failed to load polyfill for ${feature}, using fallback:`, error);

          if (polyfillConfig.fallback) {
            polyfillConfig.fallback();
            polyfillConfig.fallbackActive = true;
          }
        }
      }
    }

    console.log('✅ Polyfill loading complete');
    return this.getPolyfillStatus();
  }

  async loadExternalPolyfill(polyfillUrl) {
    return new Promise((resolve, reject) => {
      // Check if it's a npm package name or URL
      if (!polyfillUrl.startsWith('http')) {
        // For npm packages, we'd typically handle this through build process
        console.warn(`External package ${polyfillUrl} should be loaded through build process`);
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = polyfillUrl;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  getPolyfillStatus() {
    const status = {};

    for (const [feature, config] of this.polyfills) {
      status[feature] = {
        needed: config.condition(),
        loaded: config.loaded,
        fallbackActive: config.fallbackActive
      };
    }

    return status;
  }

  // Fallback implementations
  implementES5ClassPattern() {
    // Provide ES5 class pattern helper
    window.createClass = function(constructor, methods) {
      function Class() {
        return constructor.apply(this, arguments);
      }

      Class.prototype = Object.create(constructor.prototype);
      Object.assign(Class.prototype, methods);

      return Class;
    };
  }

  implementFlexboxFallback() {
    // Add CSS classes for flexbox-like behavior using floats/inline-block
    const fallbackCSS = `
      .flex-fallback {
        display: block;
      }
      .flex-fallback:after {
        content: "";
        display: table;
        clear: both;
      }
      .flex-item-fallback {
        float: left;
        display: inline-block;
      }
      .flex-center-fallback {
        text-align: center;
      }
    `;

    this.injectCSS(fallbackCSS);
  }

  implementCustomElementsFallback() {
    // Simple custom elements polyfill
    window.customElements = window.customElements || {
      define: function(name, constructor) {
        // Register for later initialization
        document.addEventListener('DOMContentLoaded', () => {
          const elements = document.querySelectorAll(name);
          elements.forEach(el => {
            if (!el._customElementInitialized) {
              const instance = new constructor();
              Object.setPrototypeOf(el, constructor.prototype);
              if (instance.connectedCallback) {
                instance.connectedCallback.call(el);
              }
              el._customElementInitialized = true;
            }
          });
        });
      }
    };
  }

  implementScrollBasedVisibility() {
    // Intersection Observer fallback using scroll events
    window.IntersectionObserver = window.IntersectionObserver || class {
      constructor(callback, options = {}) {
        this.callback = callback;
        this.options = options;
        this.observed = new Set();
        this.handleScroll = this.handleScroll.bind(this);
      }

      observe(element) {
        this.observed.add(element);
        if (this.observed.size === 1) {
          window.addEventListener('scroll', this.handleScroll);
          window.addEventListener('resize', this.handleScroll);
        }
      }

      unobserve(element) {
        this.observed.delete(element);
        if (this.observed.size === 0) {
          window.removeEventListener('scroll', this.handleScroll);
          window.removeEventListener('resize', this.handleScroll);
        }
      }

      handleScroll() {
        const entries = [];

        this.observed.forEach(element => {
          const rect = element.getBoundingClientRect();
          const isIntersecting = rect.top < window.innerHeight && rect.bottom > 0;

          entries.push({
            target: element,
            isIntersecting,
            intersectionRatio: isIntersecting ? 1 : 0,
            boundingClientRect: rect
          });
        });

        this.callback(entries);
      }

      disconnect() {
        this.observed.clear();
        window.removeEventListener('scroll', this.handleScroll);
        window.removeEventListener('resize', this.handleScroll);
      }
    };
  }

  implementXMLHttpRequestWrapper() {
    // Fetch API polyfill using XMLHttpRequest
    window.fetch = window.fetch || function(url, options = {}) {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.open(options.method || 'GET', url);

        // Set headers
        if (options.headers) {
          Object.entries(options.headers).forEach(([key, value]) => {
            xhr.setRequestHeader(key, value);
          });
        }

        xhr.onload = () => {
          resolve({
            ok: xhr.status >= 200 && xhr.status < 300,
            status: xhr.status,
            statusText: xhr.statusText,
            text: () => Promise.resolve(xhr.responseText),
            json: () => Promise.resolve(JSON.parse(xhr.responseText))
          });
        };

        xhr.onerror = () => reject(new Error('Network error'));

        xhr.send(options.body);
      });
    };
  }

  injectCSS(css) {
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  }

  setupCompatibilityMonitoring() {
    // Monitor for compatibility issues in production
    this.errorCollector = {
      errors: [],
      warnings: []
    };

    // Catch JavaScript errors that might be compatibility-related
    window.addEventListener('error', (event) => {
      this.errorCollector.errors.push({
        message: event.message,
        filename: event.filename,
        line: event.lineno,
        column: event.colno,
        stack: event.error?.stack,
        timestamp: Date.now(),
        browser: this.browserInfo
      });

      // Check if error is likely compatibility-related
      if (this.isCompatibilityError(event)) {
        this.handleCompatibilityError(event);
      }
    });

    // Monitor for CSS issues
    this.monitorCSSCompatibility();
  }

  isCompatibilityError(event) {
    const compatibilityKeywords = [
      'is not defined',
      'is not a function',
      'Cannot read property',
      'Object doesn\'t support property',
      'CSS.supports is not a function'
    ];

    return compatibilityKeywords.some(keyword =>
      event.message.includes(keyword)
    );
  }

  handleCompatibilityError(event) {
    console.warn('Compatibility error detected:', event.message);

    // Try to apply automatic fixes
    this.attemptAutomaticFix(event);

    // Report to monitoring service
    this.reportCompatibilityIssue(event);
  }

  attemptAutomaticFix(event) {
    // Attempt common fixes for compatibility issues
    const message = event.message;

    if (message.includes('fetch is not defined')) {
      console.log('Attempting to load fetch polyfill...');
      this.loadPolyfillsForCurrentBrowser();
    }

    if (message.includes('IntersectionObserver is not defined')) {
      console.log('Falling back to scroll-based visibility detection...');
      this.implementScrollBasedVisibility();
    }
  }

  monitorCSSCompatibility() {
    // Check for CSS compatibility issues
    const stylesheets = Array.from(document.styleSheets);

    stylesheets.forEach(sheet => {
      try {
        const rules = Array.from(sheet.cssRules || []);
        rules.forEach(rule => {
          this.validateCSSRule(rule);
        });
      } catch (error) {
        // CORS restrictions on external stylesheets
        console.warn('Cannot access stylesheet rules:', sheet.href);
      }
    });
  }

  validateCSSRule(rule) {
    if (rule.type === CSSRule.STYLE_RULE) {
      // Check for unsupported CSS properties
      const unsupportedProperties = this.findUnsupportedProperties(rule);

      if (unsupportedProperties.length > 0) {
        this.errorCollector.warnings.push({
          type: 'css-compatibility',
          rule: rule.cssText,
          unsupportedProperties,
          timestamp: Date.now()
        });
      }
    }
  }

  findUnsupportedProperties(rule) {
    const unsupported = [];
    const style = rule.style;

    for (let i = 0; i < style.length; i++) {
      const property = style[i];
      const value = style.getPropertyValue(property);

      if (!CSS.supports(property, value)) {
        unsupported.push({ property, value });
      }
    }

    return unsupported;
  }

  reportCompatibilityIssue(event) {
    // Send compatibility issue to monitoring service
    const report = {
      type: 'compatibility-error',
      browser: this.browserInfo,
      error: {
        message: event.message,
        filename: event.filename,
        line: event.lineno
      },
      polyfillStatus: this.getPolyfillStatus(),
      timestamp: Date.now()
    };

    // In production, send to actual monitoring service
    console.log('Compatibility report:', report);
  }

  generateCompatibilityReport() {
    return {
      browser: this.browserInfo,
      featureSupport: this.browserInfo.capabilities,
      polyfillStatus: this.getPolyfillStatus(),
      errors: this.errorCollector.errors,
      warnings: this.errorCollector.warnings,
      recommendations: this.generateRecommendations()
    };
  }

  generateRecommendations() {
    const recommendations = [];

    // Browser version recommendations
    if (this.isBrowserOutdated()) {
      recommendations.push({
        type: 'browser-update',
        priority: 'high',
        message: 'Browser version is outdated',
        actions: ['Encourage users to update browser', 'Provide update instructions']
      });
    }

    // Feature gap recommendations
    const missingFeatures = this.identifyMissingFeatures();
    if (missingFeatures.length > 0) {
      recommendations.push({
        type: 'feature-gaps',
        priority: 'medium',
        message: `Missing support for: ${missingFeatures.join(', ')}`,
        actions: ['Implement polyfills', 'Create fallback strategies']
      });
    }

    // Performance recommendations
    if (this.errorCollector.errors.length > 5) {
      recommendations.push({
        type: 'error-rate',
        priority: 'high',
        message: 'High error rate detected',
        actions: ['Investigate compatibility issues', 'Improve error handling']
      });
    }

    return recommendations;
  }

  isBrowserOutdated() {
    const minimumVersions = {
      chrome: 90,
      firefox: 88,
      safari: 14,
      edge: 90
    };

    const minVersion = minimumVersions[this.browserInfo.name];
    return minVersion && this.browserInfo.version < minVersion;
  }

  identifyMissingFeatures() {
    const criticalFeatures = [
      'es6Classes',
      'cssGrid',
      'customElements',
      'fetch',
      'intersectionObserver'
    ];

    return criticalFeatures.filter(feature =>
      !this.browserInfo.capabilities[feature]
    );
  }
}

// Usage trong production environment
const compatibilityManager = new CrossBrowserCompatibilityManager();

// Initialize compatibility layer
compatibilityManager.loadPolyfillsForCurrentBrowser().then(() => {
  console.log('🚀 Application ready with cross-browser compatibility');

  // Start application
  initializeApplication();
});

// Generate và log compatibility report
setTimeout(() => {
  const report = compatibilityManager.generateCompatibilityReport();
  console.log('📊 Compatibility Report:', report);
}, 5000);
```


### 🚀 Performance Optimization Strategies Based on Specifications


💭 **Principal's Performance Philosophy:**
*Performance optimization phải base on deep understanding của browser specifications. Tại Binance trading platform, mỗi millisecond counts. Chúng tôi optimize dựa trên spec-compliant behaviors, không rely on browser-specific quirks. Strategy: measure first, optimize based on standards, validate across browsers.*


**Advanced Performance Optimization Framework:**


```javascript
// Comprehensive performance optimization system
class SpecificationBasedPerformanceOptimizer {
  constructor() {
    this.metrics = new Map();
    this.optimizations = new Map();
    this.watchers = new Set();
    this.baselines = new Map();

    this.initializePerformanceMonitoring();
  }

  initializePerformanceMonitoring() {
    // Core Web Vitals monitoring
    this.setupWebVitalsTracking();

    // DOM performance monitoring
    this.setupDOMPerformanceTracking();

    // CSSOM performance monitoring
    this.setupCSSOMPerformanceTracking();

    // Network performance monitoring
    this.setupNetworkPerformanceTracking();

    // Memory performance monitoring
    this.setupMemoryPerformanceTracking();
  }

  setupWebVitalsTracking() {
    // Largest Contentful Paint (LCP)
    this.observeWebVital('largest-contentful-paint', (entry) => {
      this.recordMetric('LCP', entry.startTime, {
        element: entry.element,
        url: entry.url,
        size: entry.size
      });

      if (entry.startTime > 2500) {
        this.triggerOptimization('LCP', 'slow-lcp');
      }
    });

    // First Input Delay (FID)
    this.observeWebVital('first-input', (entry) => {
      this.recordMetric('FID', entry.processingStart - entry.startTime, {
        eventType: entry.name,
        target: entry.target
      });

      if (entry.processingStart - entry.startTime > 100) {
        this.triggerOptimization('FID', 'high-input-delay');
      }
    });

    // Cumulative Layout Shift (CLS)
    this.observeWebVital('layout-shift', (entry) => {
      if (!entry.hadRecentInput) {
        this.recordMetric('CLS', entry.value, {
          sources: entry.sources
        });

        if (entry.value > 0.1) {
          this.triggerOptimization('CLS', 'layout-shift');
        }
      }
    });
  }

  observeWebVital(entryType, callback) {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(callback);
      });

      observer.observe({ entryTypes: [entryType] });
      this.watchers.add(observer);

    } catch (error) {
      console.warn(`Cannot observe ${entryType}:`, error);
    }
  }

  setupDOMPerformanceTracking() {
    // Track DOM mutations performance
    const mutationObserver = new MutationObserver((mutations) => {
      const mutationCount = mutations.reduce((count, mutation) => {
        return count + mutation.addedNodes.length + mutation.removedNodes.length;
      }, 0);

      if (mutationCount > 100) {
        this.recordMetric('DOM_MUTATIONS', mutationCount, {
          type: 'batch-mutations',
          timestamp: performance.now()
        });

        this.triggerOptimization('DOM', 'excessive-mutations');
      }
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true
    });

    this.watchers.add(mutationObserver);

    // Track DOM query performance
    this.interceptDOMQueries();
  }

  interceptDOMQueries() {
    // Monitor expensive DOM queries
    const originalQuerySelector = document.querySelector;
    const originalQuerySelectorAll = document.querySelectorAll;
    const originalGetElementById = document.getElementById;

    let queryCount = 0;
    const queryMetrics = [];

    document.querySelector = function(selector) {
      const start = performance.now();
      const result = originalQuerySelector.call(this, selector);
      const duration = performance.now() - start;

      queryCount++;
      queryMetrics.push({ selector, duration, type: 'querySelector' });

      if (duration > 10) {
        console.warn(`Slow querySelector: ${selector} (${duration.toFixed(2)}ms)`);
      }

      return result;
    };

    document.querySelectorAll = function(selector) {
      const start = performance.now();
      const result = originalQuerySelectorAll.call(this, selector);
      const duration = performance.now() - start;

      queryCount++;
      queryMetrics.push({ selector, duration, type: 'querySelectorAll', count: result.length });

      if (duration > 20) {
        console.warn(`Slow querySelectorAll: ${selector} (${duration.toFixed(2)}ms, ${result.length} elements)`);
      }

      return result;
    };

    // Periodic reporting
    setInterval(() => {
      if (queryMetrics.length > 0) {
        this.recordMetric('DOM_QUERIES', queryMetrics.length, {
          totalQueries: queryCount,
          slowQueries: queryMetrics.filter(q => q.duration > 10).length,
          averageDuration: queryMetrics.reduce((sum, q) => sum + q.duration, 0) / queryMetrics.length
        });

        queryMetrics.length = 0; // Clear metrics
      }
    }, 5000);
  }

  setupCSSOMPerformanceTracking() {
    // Track stylesheet operations
    this.interceptStylesheetOperations();

    // Monitor CSS custom property performance
    this.monitorCustomPropertyPerformance();

    // Track CSS animation performance
    this.monitorAnimationPerformance();
  }

  interceptStylesheetOperations() {
    // Intercept dynamic style changes
    const originalInsertRule = CSSStyleSheet.prototype.insertRule;
    const originalDeleteRule = CSSStyleSheet.prototype.deleteRule;

    CSSStyleSheet.prototype.insertRule = function(rule, index) {
      const start = performance.now();
      const result = originalInsertRule.call(this, rule, index);
      const duration = performance.now() - start;

      if (duration > 5) {
        console.warn(`Slow CSS rule insertion: ${rule} (${duration.toFixed(2)}ms)`);
      }

      return result;
    };

    CSSStyleSheet.prototype.deleteRule = function(index) {
      const start = performance.now();
      const result = originalDeleteRule.call(this, index);
      const duration = performance.now() - start;

      if (duration > 5) {
        console.warn(`Slow CSS rule deletion at index ${index} (${duration.toFixed(2)}ms)`);
      }

      return result;
    };
  }

  monitorCustomPropertyPerformance() {
    // Track CSS custom property updates
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          const element = mutation.target;
          const customProps = this.extractCustomProperties(element.style.cssText);

          if (customProps.length > 10) {
            this.recordMetric('CSS_CUSTOM_PROPS', customProps.length, {
              element: element.tagName,
              properties: customProps
            });
          }
        }
      });
    });

    observer.observe(document.body, {
      attributes: true,
      subtree: true,
      attributeFilter: ['style']
    });

    this.watchers.add(observer);
  }

  extractCustomProperties(cssText) {
    const customProps = [];
    const regex = /--([\w-]+):\s*([^;]+)/g;
    let match;

    while ((match = regex.exec(cssText)) !== null) {
      customProps.push(match[1]);
    }

    return customProps;
  }

  monitorAnimationPerformance() {
    // Track CSS animations that might cause performance issues
    const animationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes') {
          const element = mutation.target;
          const computedStyle = getComputedStyle(element);

          if (computedStyle.animationName !== 'none') {
            this.analyzeAnimationPerformance(element, computedStyle);
          }
        }
      });
    });

    animationObserver.observe(document.body, {
      attributes: true,
      subtree: true,
      attributeFilter: ['class', 'style']
    });
  }

  analyzeAnimationPerformance(element, computedStyle) {
    const animationProperties = [
      'animationName',
      'animationDuration',
      'animationTimingFunction',
      'animationIterationCount'
    ];

    const animationInfo = {};
    animationProperties.forEach(prop => {
      animationInfo[prop] = computedStyle[prop];
    });

    // Check for performance-heavy animations
    const expensiveProperties = ['width', 'height', 'top', 'left', 'margin', 'padding'];
    const keyframes = this.getKeyframesForAnimation(animationInfo.animationName);

    if (keyframes && this.animatesExpensiveProperties(keyframes, expensiveProperties)) {
      this.recordMetric('EXPENSIVE_ANIMATION', 1, {
        element: element.tagName,
        animation: animationInfo.animationName,
        properties: expensiveProperties
      });

      this.triggerOptimization('CSS_ANIMATION', 'expensive-properties');
    }
  }

  getKeyframesForAnimation(animationName) {
    // Find keyframes rule for animation
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          if (rule.type === CSSRule.KEYFRAMES_RULE && rule.name === animationName) {
            return rule;
          }
        }
      } catch (e) {
        // CORS restrictions
      }
    }
    return null;
  }

  animatesExpensiveProperties(keyframes, expensiveProps) {
    if (!keyframes) return false;

    for (const rule of keyframes.cssRules) {
      for (const prop of expensiveProps) {
        if (rule.style[prop]) {
          return true;
        }
      }
    }

    return false;
  }

  setupNetworkPerformanceTracking() {
    // Monitor resource loading performance
    this.observeResourceTiming();

    // Track fetch performance
    this.interceptFetchAPI();
  }

  observeResourceTiming() {
    const resourceObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();

      entries.forEach((entry) => {
        if (entry.entryType === 'resource') {
          this.analyzeResourcePerformance(entry);
        }
      });
    });

    resourceObserver.observe({ entryTypes: ['resource'] });
    this.watchers.add(resourceObserver);
  }

  analyzeResourcePerformance(entry) {
    const metrics = {
      url: entry.name,
      duration: entry.duration,
      transferSize: entry.transferSize,
      protocol: entry.nextHopProtocol,
      cached: entry.transferSize === 0 && entry.decodedBodySize > 0
    };

    // Check for slow resources
    if (entry.duration > 3000) {
      this.recordMetric('SLOW_RESOURCE', entry.duration, metrics);
      this.triggerOptimization('NETWORK', 'slow-resource');
    }

    // Check for large resources
    if (entry.transferSize > 1000000) { // 1MB
      this.recordMetric('LARGE_RESOURCE', entry.transferSize, metrics);
      this.triggerOptimization('NETWORK', 'large-resource');
    }
  }

  interceptFetchAPI() {
    const originalFetch = window.fetch;

    window.fetch = async function(...args) {
      const start = performance.now();

      try {
        const response = await originalFetch.apply(this, args);
        const duration = performance.now() - start;

        // Log slow API calls
        if (duration > 1000) {
          console.warn(`Slow fetch request: ${args[0]} (${duration.toFixed(2)}ms)`);
        }

        return response;
      } catch (error) {
        const duration = performance.now() - start;
        console.error(`Failed fetch request: ${args[0]} (${duration.toFixed(2)}ms)`, error);
        throw error;
      }
    };
  }

  setupMemoryPerformanceTracking() {
    // Monitor memory usage if available
    if (performance.memory) {
      setInterval(() => {
        const memoryInfo = {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
          jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
        };

        this.recordMetric('MEMORY_USAGE', memoryInfo.usedJSHeapSize, memoryInfo);

        // Check for memory pressure
        const memoryUsageRatio = memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit;
        if (memoryUsageRatio > 0.8) {
          this.triggerOptimization('MEMORY', 'high-memory-usage');
        }
      }, 10000);
    }
  }

  recordMetric(name, value, metadata = {}) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    this.metrics.get(name).push({
      value,
      metadata,
      timestamp: performance.now()
    });

    // Keep only recent metrics (last 100 entries)
    const entries = this.metrics.get(name);
    if (entries.length > 100) {
      entries.splice(0, entries.length - 100);
    }
  }

  triggerOptimization(category, issue) {
    console.log(`🔧 Triggering optimization for ${category}: ${issue}`);

    const optimizationKey = `${category}_${issue}`;

    if (!this.optimizations.has(optimizationKey)) {
      this.optimizations.set(optimizationKey, {
        category,
        issue,
        triggered: 0,
        lastTriggered: null
      });
    }

    const optimization = this.optimizations.get(optimizationKey);
    optimization.triggered++;
    optimization.lastTriggered = Date.now();

    // Apply optimization strategies
    this.applyOptimization(category, issue);
  }

  applyOptimization(category, issue) {
    const optimizationStrategies = {
      'LCP_slow-lcp': () => this.optimizeLCP(),
      'FID_high-input-delay': () => this.optimizeFID(),
      'CLS_layout-shift': () => this.optimizeCLS(),
      'DOM_excessive-mutations': () => this.optimizeDOMMutations(),
      'CSS_ANIMATION_expensive-properties': () => this.optimizeAnimations(),
      'NETWORK_slow-resource': () => this.optimizeNetworkResources(),
      'MEMORY_high-memory-usage': () => this.optimizeMemoryUsage()
    };

    const optimizationKey = `${category}_${issue}`;
    const strategy = optimizationStrategies[optimizationKey];

    if (strategy) {
      strategy();
    } else {
      console.warn(`No optimization strategy for ${optimizationKey}`);
    }
  }

  optimizeLCP() {
    console.log('🚀 Optimizing Largest Contentful Paint...');

    // Preload critical resources
    this.preloadCriticalResources();

    // Optimize images
    this.optimizeImages();

    // Remove render-blocking resources
    this.optimizeRenderBlocking();
  }

  preloadCriticalResources() {
    // Find and preload the LCP element's resources
    const lcpElements = document.querySelectorAll('img, video, [style*="background-image"]');

    lcpElements.forEach(element => {
      if (this.isInViewport(element)) {
        if (element.tagName === 'IMG' && !element.loading) {
          element.loading = 'eager';
        }

        // Add preload link for background images
        if (element.style.backgroundImage) {
          const imageUrl = this.extractImageUrl(element.style.backgroundImage);
          if (imageUrl) {
            this.addPreloadLink(imageUrl, 'image');
          }
        }
      }
    });
  }

  isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= window.innerHeight &&
      rect.right <= window.innerWidth
    );
  }

  extractImageUrl(backgroundImage) {
    const match = backgroundImage.match(/url\(['"]?([^'"]+)['"]?\)/);
    return match ? match[1] : null;
  }

  addPreloadLink(href, as) {
    if (!document.querySelector(`link[href="${href}"]`)) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = href;
      link.as = as;
      document.head.appendChild(link);
    }
  }

  optimizeImages() {
    const images = document.querySelectorAll('img');

    images.forEach(img => {
      // Add loading attribute if not present
      if (!img.hasAttribute('loading')) {
        const isAboveFold = this.isInViewport(img);
        img.loading = isAboveFold ? 'eager' : 'lazy';
      }

      // Add appropriate sizes attribute
      if (!img.hasAttribute('sizes') && img.hasAttribute('srcset')) {
        img.sizes = '(max-width: 768px) 100vw, 50vw';
      }
    });
  }

  optimizeRenderBlocking() {
    // Mark non-critical stylesheets as non-render-blocking
    const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');

    stylesheets.forEach(link => {
      if (!this.isCriticalStylesheet(link)) {
        link.media = 'print';
        link.onload = function() {
          this.media = 'all';
        };
      }
    });
  }

  isCriticalStylesheet(link) {
    // Simple heuristic: assume stylesheets with 'critical' in the name are critical
    return link.href.includes('critical') || link.href.includes('above-fold');
  }

  optimizeFID() {
    console.log('⚡ Optimizing First Input Delay...');

    // Break up long tasks
    this.breakUpLongTasks();

    // Defer non-critical JavaScript
    this.deferNonCriticalJS();

    // Use web workers for heavy computations
    this.offloadToWebWorkers();
  }

  breakUpLongTasks() {
    // Provide utility for breaking up long-running tasks
    window.yieldToMain = function() {
      return new Promise(resolve => {
        setTimeout(resolve, 0);
      });
    };

    // Example usage in long loops:
    window.processLargeArrayWithYielding = async function(array, processor) {
      for (let i = 0; i < array.length; i++) {
        processor(array[i]);

        // Yield every 100 items
        if (i % 100 === 0) {
          await window.yieldToMain();
        }
      }
    };
  }

  deferNonCriticalJS() {
    const scripts = document.querySelectorAll('script[src]');

    scripts.forEach(script => {
      if (!this.isCriticalScript(script)) {
        script.defer = true;
      }
    });
  }

  isCriticalScript(script) {
    // Simple heuristic: assume scripts with 'critical' in the name are critical
    return script.src.includes('critical') || script.src.includes('polyfill');
  }

  offloadToWebWorkers() {
    // Provide utility for easy web worker usage
    window.runInWorker = function(fn, data) {
      return new Promise((resolve, reject) => {
        const worker = new Worker(URL.createObjectURL(new Blob([`
          self.onmessage = function(e) {
            try {
              const result = (${fn.toString()})(e.data);
              self.postMessage({ success: true, result });
            } catch (error) {
              self.postMessage({ success: false, error: error.message });
            }
          }
        `], { type: 'application/javascript' })));

        worker.onmessage = function(e) {
          if (e.data.success) {
            resolve(e.data.result);
          } else {
            reject(new Error(e.data.error));
          }
          worker.terminate();
        };

        worker.postMessage(data);
      });
    };
  }

  optimizeCLS() {
    console.log('📐 Optimizing Cumulative Layout Shift...');

    // Set explicit dimensions for images and videos
    this.setExplicitDimensions();

    // Reserve space for dynamic content
    this.reserveSpaceForDynamicContent();

    // Avoid inserting content above existing content
    this.optimizeContentInsertion();
  }

  setExplicitDimensions() {
    // Add dimensions to images without them
    const images = document.querySelectorAll('img:not([width]):not([height])');

    images.forEach(img => {
      if (img.naturalWidth && img.naturalHeight) {
        img.width = img.naturalWidth;
        img.height = img.naturalHeight;

        // Add CSS to make them responsive
        img.style.width = '100%';
        img.style.height = 'auto';
      }
    });

    // Add aspect-ratio CSS for modern browsers
    const style = document.createElement('style');
    style.textContent = `
      img:not([width]):not([height]) {
        aspect-ratio: attr(width) / attr(height);
      }
    `;
    document.head.appendChild(style);
  }

  reserveSpaceForDynamicContent() {
    // Add placeholder dimensions for dynamic content containers
    const dynamicContainers = document.querySelectorAll('[data-dynamic-content]');

    dynamicContainers.forEach(container => {
      if (!container.style.minHeight) {
        container.style.minHeight = '200px'; // Default placeholder height
      }
    });
  }

  optimizeContentInsertion() {
    // Provide utility for layout-safe content insertion
    window.insertContentSafely = function(container, content, position = 'beforeend') {
      // Measure container before insertion
      const beforeHeight = container.offsetHeight;

      container.insertAdjacentHTML(position, content);

      // Measure after insertion
      const afterHeight = container.offsetHeight;
      const heightDifference = afterHeight - beforeHeight;

      // If content was inserted above existing content, adjust scroll to maintain position
      if (position === 'afterbegin' && heightDifference > 0) {
        window.scrollBy(0, heightDifference);
      }
    };
  }

  optimizeDOMMutations() {
    console.log('🔄 Optimizing DOM mutations...');

    // Provide utilities for batch DOM operations
    this.implementDOMBatching();

    // Use DocumentFragment for multiple insertions
    this.promoteDocumentFragmentUsage();
  }

  implementDOMBatching() {
    window.batchDOMOperations = function(operations) {
      // Use requestAnimationFrame to batch operations
      return new Promise(resolve => {
        requestAnimationFrame(() => {
          operations.forEach(op => op());
          resolve();
        });
      });
    };
  }

  promoteDocumentFragmentUsage() {
    window.createElementsBatch = function(elements) {
      const fragment = document.createDocumentFragment();

      elements.forEach(elementData => {
        const element = document.createElement(elementData.tag);
        if (elementData.attributes) {
          Object.entries(elementData.attributes).forEach(([key, value]) => {
            element.setAttribute(key, value);
          });
        }
        if (elementData.textContent) {
          element.textContent = elementData.textContent;
        }
        fragment.appendChild(element);
      });

      return fragment;
    };
  }

  optimizeAnimations() {
    console.log('🎬 Optimizing CSS animations...');

    // Promote transform and opacity animations
    this.promoteCompositorAnimations();

    // Add will-change hints
    this.addWillChangeHints();
  }

  promoteCompositorAnimations() {
    const style = document.createElement('style');
    style.textContent = `
      .animate-position {
        transform: translateZ(0); /* Force layer creation */
      }

      .animate-transform {
        transition: transform 0.3s ease;
      }

      .animate-opacity {
        transition: opacity 0.3s ease;
      }

      /* Avoid animating layout properties */
      .avoid-layout-animation {
        /* Use transform instead of changing left/top */
        /* Use opacity instead of changing display */
      }
    `;
    document.head.appendChild(style);
  }

  addWillChangeHints() {
    // Add will-change property to elements that will be animated
    const animatedElements = document.querySelectorAll('[class*="animate"]');

    animatedElements.forEach(element => {
      const computedStyle = getComputedStyle(element);

      if (computedStyle.transition !== 'none' || computedStyle.animation !== 'none') {
        element.style.willChange = 'transform, opacity';

        // Remove will-change after animation
        element.addEventListener('transitionend', function() {
          this.style.willChange = 'auto';
        });

        element.addEventListener('animationend', function() {
          this.style.willChange = 'auto';
        });
      }
    });
  }

  optimizeNetworkResources() {
    console.log('🌐 Optimizing network resources...');

    // Implement resource hints
    this.addResourceHints();

    // Optimize loading priorities
    this.optimizeLoadingPriorities();
  }

  addResourceHints() {
    // Add dns-prefetch for external domains
    const externalLinks = document.querySelectorAll('a[href^="http"], link[href^="http"]');
    const domains = new Set();

    externalLinks.forEach(link => {
      const url = new URL(link.href);
      if (url.hostname !== location.hostname) {
        domains.add(url.hostname);
      }
    });

    domains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'dns-prefetch';
      link.href = `//${domain}`;
      document.head.appendChild(link);
    });
  }

  optimizeLoadingPriorities() {
    // Add fetchpriority attributes
    const images = document.querySelectorAll('img');

    images.forEach((img, index) => {
      if (index < 3 && this.isInViewport(img)) {
        img.fetchPriority = 'high';
      } else {
        img.fetchPriority = 'low';
      }
    });
  }

  optimizeMemoryUsage() {
    console.log('🧠 Optimizing memory usage...');

    // Implement garbage collection hints
    this.suggestGarbageCollection();

    // Clean up event listeners
    this.cleanupEventListeners();

    // Optimize image memory usage
    this.optimizeImageMemory();
  }

  suggestGarbageCollection() {
    // Trigger garbage collection if available (Chrome DevTools)
    if (window.gc) {
      window.gc();
    }

    // Clear large objects that are no longer needed
    window.clearLargeObjects = function() {
      // Implementation would clear application-specific large objects
      console.log('Clearing large objects to free memory');
    };
  }

  cleanupEventListeners() {
    // Provide utility for proper event listener cleanup
    window.addCleanupableEventListener = function(element, event, handler) {
      element.addEventListener(event, handler);

      // Return cleanup function
      return function cleanup() {
        element.removeEventListener(event, handler);
      };
    };
  }

  optimizeImageMemory() {
    // Unload off-screen images in very long pages
    const images = document.querySelectorAll('img[src]');

    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const img = entry.target;

        if (!entry.isIntersecting) {
          // Store original src and replace with placeholder
          if (!img.dataset.originalSrc) {
            img.dataset.originalSrc = img.src;
            img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjwvc3ZnPg==';
          }
        } else {
          // Restore original src
          if (img.dataset.originalSrc) {
            img.src = img.dataset.originalSrc;
            delete img.dataset.originalSrc;
          }
        }
      });
    }, {
      rootMargin: '200px' // Start loading when 200px away
    });

    images.forEach(img => imageObserver.observe(img));
  }

  generatePerformanceReport() {
    const report = {
      timestamp: new Date().toISOString(),
      metrics: this.summarizeMetrics(),
      optimizations: this.summarizeOptimizations(),
      recommendations: this.generateRecommendations(),
      browserInfo: {
        userAgent: navigator.userAgent,
        memory: performance.memory ? {
          used: performance.memory.usedJSHeapSize,
          total: performance.memory.totalJSHeapSize,
          limit: performance.memory.jsHeapSizeLimit
        } : null
      }
    };

    return report;
  }

  summarizeMetrics() {
    const summary = {};

    for (const [name, entries] of this.metrics) {
      const values = entries.map(entry => entry.value);
      summary[name] = {
        count: values.length,
        latest: values[values.length - 1],
        average: values.reduce((sum, val) => sum + val, 0) / values.length,
        max: Math.max(...values),
        min: Math.min(...values)
      };
    }

    return summary;
  }

  summarizeOptimizations() {
    const summary = {};

    for (const [key, optimization] of this.optimizations) {
      summary[key] = {
        category: optimization.category,
        issue: optimization.issue,
        triggered: optimization.triggered,
        lastTriggered: optimization.lastTriggered
      };
    }

    return summary;
  }

  generateRecommendations() {
    const recommendations = [];

    // Check Core Web Vitals
    const lcpMetrics = this.metrics.get('LCP');
    if (lcpMetrics && lcpMetrics[lcpMetrics.length - 1]?.value > 2500) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        metric: 'LCP',
        message: 'Largest Contentful Paint is slow',
        actions: [
          'Optimize critical resource loading',
          'Implement image optimization',
          'Remove render-blocking resources'
        ]
      });
    }

    const fidMetrics = this.metrics.get('FID');
    if (fidMetrics && fidMetrics[fidMetrics.length - 1]?.value > 100) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        metric: 'FID',
        message: 'First Input Delay is high',
        actions: [
          'Break up long JavaScript tasks',
          'Defer non-critical JavaScript',
          'Use web workers for heavy computations'
        ]
      });
    }

    // Check optimization triggers
    if (this.optimizations.size > 5) {
      recommendations.push({
        type: 'optimization',
        priority: 'medium',
        message: 'Multiple performance issues detected',
        actions: [
          'Review application architecture',
          'Implement performance monitoring',
          'Consider performance budget'
        ]
      });
    }

    return recommendations;
  }

  destroy() {
    // Clean up observers
    this.watchers.forEach(watcher => {
      if (watcher.disconnect) {
        watcher.disconnect();
      }
    });

    this.watchers.clear();
    this.metrics.clear();
    this.optimizations.clear();
  }
}

// Initialize performance optimizer
const performanceOptimizer = new SpecificationBasedPerformanceOptimizer();

// Generate periodic reports
setInterval(() => {
  const report = performanceOptimizer.generatePerformanceReport();
  console.log('📊 Performance Report:', report);
}, 30000);

// Export for use in applications
window.PerformanceOptimizer = performanceOptimizer;
```


---


## 📖 PHẦN VI: DEBUGGING & MONITORING STRATEGIES


### 🔍 Advanced Debugging Mental Models


💭 **Principal's Debugging Philosophy:**
*Debugging browser environment issues require systematic approach. Tại Figma, chúng tôi deal với complex interactions between DOM, CSSOM, và JavaScript engine. Strategy: always understand the specification first, then debug against expected behavior. Tools are important, but understanding underlying mechanisms is critical.*


**Comprehensive Debugging Framework:**


```javascript
// Production-grade debugging và monitoring system
class BrowserEnvironmentDebugger {
  constructor() {
    this.debugSessions = new Map();
    this.breakpoints = new Map();
    this.watchers = new Map();
    this.logs = [];
    this.metrics = new Map();

    this.initializeDebuggingTools();
  }

  initializeDebuggingTools() {
    // Setup DOM debugging
    this.setupDOMDebugging();

    // Setup CSSOM debugging
    this.setupCSSOMDebugging();

    // Setup BOM debugging
    this.setupBOMDebugging();

    // Setup performance debugging
    this.setupPerformanceDebugging();

    // Setup error tracking
    this.setupErrorTracking();
  }

  setupDOMDebugging() {
    // Enhanced DOM mutation tracking
    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        this.logDOMMutation(mutation);
        this.checkDOMBreakpoints(mutation);
      });
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeOldValue: true,
      characterData: true,
      characterDataOldValue: true
    });

    // DOM query performance tracking
    this.interceptDOMQueries();

    // Element lifecycle tracking
    this.trackElementLifecycle();
  }

  logDOMMutation(mutation) {
    const logEntry = {
      type: 'DOM_MUTATION',
      mutationType: mutation.type,
      target: this.getElementSelector(mutation.target),
      timestamp: performance.now(),
      details: this.getMutationDetails(mutation)
    };

    this.addLog(logEntry);

    // Check for problematic patterns
    this.checkMutationPatterns(mutation);
  }

  getElementSelector(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) {
      return 'non-element';
    }

    const parts = [];
    let current = element;

    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase();

      if (current.id) {
        selector += `#${current.id}`;
        parts.unshift(selector);
        break; // ID is unique, no need to go further
      }

      if (current.className) {
        const classes = Array.from(current.classList).join('.');
        if (classes) {
          selector += `.${classes}`;
        }
      }

      // Add nth-child if needed for uniqueness
      const siblings = Array.from(current.parentElement?.children || [])
        .filter(child => child.tagName === current.tagName);

      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1;
        selector += `:nth-child(${index})`;
      }

      parts.unshift(selector);
      current = current.parentElement;
    }

    return parts.join(' > ');
  }

  getMutationDetails(mutation) {
    const details = {
      type: mutation.type
    };

    switch (mutation.type) {
      case 'childList':
        details.addedNodes = Array.from(mutation.addedNodes).map(node => ({
          type: node.nodeType,
          tag: node.tagName,
          text: node.textContent?.substring(0, 50)
        }));
        details.removedNodes = Array.from(mutation.removedNodes).map(node => ({
          type: node.nodeType,
          tag: node.tagName,
          text: node.textContent?.substring(0, 50)
        }));
        break;

      case 'attributes':
        details.attributeName = mutation.attributeName;
        details.oldValue = mutation.oldValue;
        details.newValue = mutation.target.getAttribute(mutation.attributeName);
        break;

      case 'characterData':
        details.oldValue = mutation.oldValue;
        details.newValue = mutation.target.textContent;
        break;
    }

    return details;
  }

  checkMutationPatterns(mutation) {
    // Detect excessive mutations
    const recentMutations = this.logs
      .filter(log => log.type === 'DOM_MUTATION')
      .filter(log => performance.now() - log.timestamp < 1000); // Last second

    if (recentMutations.length > 100) {
      this.addLog({
        type: 'WARNING',
        message: 'Excessive DOM mutations detected',
        count: recentMutations.length,
        timestamp: performance.now()
      });
    }

    // Detect layout thrashing
    if (mutation.type === 'attributes') {
      const layoutProperties = ['style', 'class'];
      if (layoutProperties.includes(mutation.attributeName)) {
        this.checkLayoutThrashing(mutation.target);
      }
    }
  }

  checkLayoutThrashing(element) {
    const key = `layout_${this.getElementSelector(element)}`;
    const now = performance.now();

    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }

    const timeline = this.metrics.get(key);
    timeline.push(now);

    // Keep only last 5 seconds
    const cutoff = now - 5000;
    timeline.splice(0, timeline.findIndex(time => time > cutoff));

    // Check for rapid layout changes
    if (timeline.length > 10) {
      this.addLog({
        type: 'WARNING',
        message: 'Potential layout thrashing detected',
        element: this.getElementSelector(element),
        frequency: timeline.length,
        timestamp: now
      });
    }
  }

  interceptDOMQueries() {
    const originalMethods = {
      querySelector: document.querySelector,
      querySelectorAll: document.querySelectorAll,
      getElementById: document.getElementById,
      getElementsByClassName: document.getElementsByClassName,
      getElementsByTagName: document.getElementsByTagName
    };

    // Track query performance
    Object.entries(originalMethods).forEach(([methodName, originalMethod]) => {
      document[methodName] = function(...args) {
        const start = performance.now();
        const result = originalMethod.apply(this, args);
        const duration = performance.now() - start;

        this.logDOMQuery(methodName, args[0], duration, result);

        return result;
      }.bind(this);
    });
  }

  logDOMQuery(method, selector, duration, result) {
    const resultCount = result?.length !== undefined ? result.length : (result ? 1 : 0);

    this.addLog({
      type: 'DOM_QUERY',
      method,
      selector,
      duration,
      resultCount,
      timestamp: performance.now()
    });

    // Warn about slow queries
    if (duration > 10) {
      this.addLog({
        type: 'WARNING',
        message: `Slow DOM query: ${method}('${selector}')`,
        duration,
        timestamp: performance.now()
      });
    }

    // Warn about inefficient selectors
    if (this.isInefficientSelector(selector)) {
      this.addLog({
        type: 'WARNING',
        message: `Inefficient selector: ${selector}`,
        suggestion: this.suggestSelectorOptimization(selector),
        timestamp: performance.now()
      });
    }
  }

  isInefficientSelector(selector) {
    const inefficientPatterns = [
      /\*.*\*/, // Multiple universal selectors
      /\w+\s+\*/, // Universal after type selector
      /\[[^\]]*\~=/, // Attribute contains
      /:.+:.+/, // Multiple pseudo-selectors
    ];

    return inefficientPatterns.some(pattern => pattern.test(selector));
  }

  suggestSelectorOptimization(selector) {
    const suggestions = [];

    if (selector.includes('*')) {
      suggestions.push('Avoid universal selectors, use specific tags or classes');
    }

    if (selector.split(' ').length > 4) {
      suggestions.push('Reduce selector depth, use more specific classes');
    }

    if (selector.includes('[') && selector.includes('~=')) {
      suggestions.push('Use class selectors instead of attribute contains');
    }

    return suggestions.join('; ');
  }

  trackElementLifecycle() {
    // Track elements being added/removed frequently
    const elementTracker = new Map();

    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          // Track added elements
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              this.trackElementAddition(node, elementTracker);
            }
          });

          // Track removed elements
          mutation.removedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              this.trackElementRemoval(node, elementTracker);
            }
          });
        }
      });
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  trackElementAddition(element, tracker) {
    const selector = this.getElementSelector(element);

    if (!tracker.has(selector)) {
      tracker.set(selector, { added: 0, removed: 0, firstSeen: performance.now() });
    }

    tracker.get(selector).added++;

    // Check for element churn
    this.checkElementChurn(selector, tracker.get(selector));
  }

  trackElementRemoval(element, tracker) {
    const selector = this.getElementSelector(element);

    if (!tracker.has(selector)) {
      tracker.set(selector, { added: 0, removed: 0, firstSeen: performance.now() });
    }

    tracker.get(selector).removed++;

    // Check for element churn
    this.checkElementChurn(selector, tracker.get(selector));
  }

  checkElementChurn(selector, stats) {
    const timespan = performance.now() - stats.firstSeen;

    if (timespan > 5000 && stats.added > 10 && stats.removed > 10) {
      this.addLog({
        type: 'WARNING',
        message: 'High element churn detected',
        selector,
        added: stats.added,
        removed: stats.removed,
        timespan: Math.round(timespan),
        timestamp: performance.now()
      });
    }
  }

  setupCSSOMDebugging() {
    // Track stylesheet modifications
    this.interceptStylesheetMethods();

    // Monitor CSS custom property changes
    this.monitorCustomProperties();

    // Track CSS animation performance
    this.monitorCSSAnimations();
  }

  interceptStylesheetMethods() {
    // Intercept stylesheet insertRule/deleteRule
    const originalInsertRule = CSSStyleSheet.prototype.insertRule;
    const originalDeleteRule = CSSStyleSheet.prototype.deleteRule;

    CSSStyleSheet.prototype.insertRule = function(rule, index) {
      const start = performance.now();
      const result = originalInsertRule.call(this, rule, index);
      const duration = performance.now() - start;

      this.logStylesheetOperation('insertRule', rule, index, duration);

      return result;
    }.bind(this
```


## Claude


);


```
CSSStyleSheet.prototype.deleteRule = function(index) {
  const start = performance.now();
  const ruleText = this.cssRules[index]?.cssText || 'unknown';
  const result = originalDeleteRule.call(this, index);
  const duration = performance.now() - start;

  this.logStylesheetOperation('deleteRule', ruleText, index, duration);

  return result;
}.bind(this);
```


}


logStylesheetOperation(operation, rule, index, duration) {
this.addLog({
type: 'CSSOM_OPERATION',
operation,
rule: rule.substring(0, 100), // Truncate long rules
index,
duration,
timestamp: performance.now()
});


```
// Warn about slow operations
if (duration > 5) {
  this.addLog({
    type: 'WARNING',
    message: `Slow CSSOM operation: ${operation}`,
    duration,
    rule: rule.substring(0, 50),
    timestamp: performance.now()
  });
}
```


}


monitorCustomProperties() {
// Track CSS custom property usage and changes
const propertyTracker = new Map();


```
// Monitor style attribute changes
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
      this.analyzeStyleChanges(mutation.target, mutation.oldValue);
    }
  });
});

observer.observe(document.body, {
  attributes: true,
  attributeOldValue: true,
  subtree: true,
  attributeFilter: ['style']
});

// Intercept setProperty calls
const originalSetProperty = CSSStyleDeclaration.prototype.setProperty;
CSSStyleDeclaration.prototype.setProperty = function(property, value, priority) {
  if (property.startsWith('--')) {
    this.logCustomPropertyChange(property, value, 'set');
  }

  return originalSetProperty.call(this, property, value, priority);
}.bind(this);

// Intercept removeProperty calls
const originalRemoveProperty = CSSStyleDeclaration.prototype.removeProperty;
CSSStyleDeclaration.prototype.removeProperty = function(property) {
  if (property.startsWith('--')) {
    this.logCustomPropertyChange(property, null, 'remove');
  }

  return originalRemoveProperty.call(this, property);
}.bind(this);
```


}


analyzeStyleChanges(element, oldValue) {
const currentStyle = element.getAttribute('style') || '';
const oldCustomProps = this.extractCustomProperties(oldValue || '');
const newCustomProps = this.extractCustomProperties(currentStyle);


```
// Find changes
const changes = this.compareCustomProperties(oldCustomProps, newCustomProps);

if (changes.length > 0) {
  this.addLog({
    type: 'CUSTOM_PROPERTY_CHANGE',
    element: this.getElementSelector(element),
    changes,
    timestamp: performance.now()
  });
}
```


}


extractCustomProperties(cssText) {
const properties = new Map();
const regex = /--([\w-]+):\s*([^;]+)/g;
let match;


```
while ((match = regex.exec(cssText)) !== null) {
  properties.set(match[1], match[2].trim());
}

return properties;
```


}


compareCustomProperties(oldProps, newProps) {
const changes = [];


```
// Check for added/modified properties
for (const [name, value] of newProps) {
  const oldValue = oldProps.get(name);
  if (oldValue === undefined) {
    changes.push({ type: 'added', property: `--${name}`, value });
  } else if (oldValue !== value) {
    changes.push({ type: 'modified', property: `--${name}`, oldValue, newValue: value });
  }
}

// Check for removed properties
for (const [name, value] of oldProps) {
  if (!newProps.has(name)) {
    changes.push({ type: 'removed', property: `--${name}`, oldValue: value });
  }
}

return changes;
```


}


logCustomPropertyChange(property, value, operation) {
this.addLog({
type: 'CUSTOM_PROPERTY_OPERATION',
property,
value,
operation,
timestamp: performance.now()
});
}


monitorCSSAnimations() {
// Track CSS animations and transitions
const animationTracker = new Map();


```
// Listen for animation events
['animationstart', 'animationend', 'animationiteration'].forEach(eventType => {
  document.addEventListener(eventType, (event) => {
    this.logAnimationEvent(eventType, event);
  });
});

// Listen for transition events
['transitionstart', 'transitionend'].forEach(eventType => {
  document.addEventListener(eventType, (event) => {
    this.logTransitionEvent(eventType, event);
  });
});
```


}


logAnimationEvent(eventType, event) {
this.addLog({
type: 'CSS_ANIMATION_EVENT',
eventType,
animationName: event.animationName,
element: this.getElementSelector(event.target),
elapsedTime: event.elapsedTime,
timestamp: performance.now()
});


```
// Track animation performance
if (eventType === 'animationstart') {
  this.startAnimationPerformanceTracking(event.target, event.animationName);
} else if (eventType === 'animationend') {
  this.endAnimationPerformanceTracking(event.target, event.animationName);
}
```


}


logTransitionEvent(eventType, event) {
this.addLog({
type: 'CSS_TRANSITION_EVENT',
eventType,
propertyName: event.propertyName,
element: this.getElementSelector(event.target),
elapsedTime: event.elapsedTime,
timestamp: performance.now()
});
}


startAnimationPerformanceTracking(element, animationName) {
const key = `${this.getElementSelector(element)}_${animationName}`;


```
// Start performance monitoring
const observer = new PerformanceObserver((list) => {
  const entries = list.getEntries();
  entries.forEach(entry => {
    if (entry.entryType === 'measure' && entry.name.includes(animationName)) {
      this.addLog({
        type: 'ANIMATION_PERFORMANCE',
        animationName,
        duration: entry.duration,
        timestamp: performance.now()
      });
    }
  });
});

observer.observe({ entryTypes: ['measure'] });

// Store observer for cleanup
this.watchers.set(key, observer);
```


}


endAnimationPerformanceTracking(element, animationName) {
const key = `${this.getElementSelector(element)}_${animationName}`;
const observer = this.watchers.get(key);


```
if (observer) {
  observer.disconnect();
  this.watchers.delete(key);
}
```


}


setupBOMDebugging() {
// Track navigation events
this.monitorNavigation();


```
// Track storage events
this.monitorStorage();

// Track window events
this.monitorWindowEvents();

// Monitor history changes
this.monitorHistoryChanges();
```


}


monitorNavigation() {
// Track page visibility changes
document.addEventListener('visibilitychange', () => {
this.addLog({
type: 'VISIBILITY_CHANGE',
hidden: document.hidden,
visibilityState: document.visibilityState,
timestamp: performance.now()
});
});


```
// Track online/offline status
window.addEventListener('online', () => {
  this.addLog({
    type: 'NETWORK_STATUS',
    online: true,
    timestamp: performance.now()
  });
});

window.addEventListener('offline', () => {
  this.addLog({
    type: 'NETWORK_STATUS',
    online: false,
    timestamp: performance.now()
  });
});

// Track connection changes
if (navigator.connection) {
  navigator.connection.addEventListener('change', () => {
    this.addLog({
      type: 'CONNECTION_CHANGE',
      effectiveType: navigator.connection.effectiveType,
      downlink: navigator.connection.downlink,
      rtt: navigator.connection.rtt,
      timestamp: performance.now()
    });
  });
}
```


}


monitorStorage() {
// Track localStorage changes
const originalSetItem = Storage.prototype.setItem;
const originalRemoveItem = Storage.prototype.removeItem;
const originalClear = Storage.prototype.clear;


```
Storage.prototype.setItem = function(key, value) {
  const result = originalSetItem.call(this, key, value);

  this.logStorageOperation('setItem', this === localStorage ? 'localStorage' : 'sessionStorage', key, value);

  return result;
}.bind(this);

Storage.prototype.removeItem = function(key) {
  const result = originalRemoveItem.call(this, key);

  this.logStorageOperation('removeItem', this === localStorage ? 'localStorage' : 'sessionStorage', key);

  return result;
}.bind(this);

Storage.prototype.clear = function() {
  const result = originalClear.call(this);

  this.logStorageOperation('clear', this === localStorage ? 'localStorage' : 'sessionStorage');

  return result;
}.bind(this);

// Listen for storage events
window.addEventListener('storage', (event) => {
  this.addLog({
    type: 'STORAGE_EVENT',
    key: event.key,
    oldValue: event.oldValue,
    newValue: event.newValue,
    storageArea: event.storageArea === localStorage ? 'localStorage' : 'sessionStorage',
    timestamp: performance.now()
  });
});
```


}


logStorageOperation(operation, storageType, key, value) {
this.addLog({
type: 'STORAGE_OPERATION',
operation,
storageType,
key,
value: value ? value.substring(0, 100) : undefined, // Truncate long values
timestamp: performance.now()
});


```
// Warn about large storage operations
if (value && value.length > 100000) {
  this.addLog({
    type: 'WARNING',
    message: `Large storage operation: ${key} (${value.length} chars)`,
    operation,
    storageType,
    timestamp: performance.now()
  });
}
```


}


monitorWindowEvents() {
// Track window resize events
let resizeTimeout;
window.addEventListener('resize', () => {
clearTimeout(resizeTimeout);
resizeTimeout = setTimeout(() => {
this.addLog({
type: 'WINDOW_RESIZE',
innerWidth: window.innerWidth,
innerHeight: window.innerHeight,
outerWidth: window.outerWidth,
outerHeight: window.outerHeight,
timestamp: performance.now()
});
}, 100); // Debounce resize events
});


```
// Track focus/blur events
window.addEventListener('focus', () => {
  this.addLog({
    type: 'WINDOW_FOCUS',
    focused: true,
    timestamp: performance.now()
  });
});

window.addEventListener('blur', () => {
  this.addLog({
    type: 'WINDOW_FOCUS',
    focused: false,
    timestamp: performance.now()
  });
});

// Track beforeunload events
window.addEventListener('beforeunload', () => {
  this.addLog({
    type: 'BEFORE_UNLOAD',
    timestamp: performance.now()
  });

  // Save debug session before unload
  this.saveDebugSession();
});
```


}


monitorHistoryChanges() {
// Intercept history methods
const originalPushState = history.pushState;
const originalReplaceState = history.replaceState;


```
history.pushState = function(state, title, url) {
  const result = originalPushState.call(this, state, title, url);

  this.logHistoryOperation('pushState', state, title, url);

  return result;
}.bind(this);

history.replaceState = function(state, title, url) {
  const result = originalReplaceState.call(this, state, title, url);

  this.logHistoryOperation('replaceState', state, title, url);

  return result;
}.bind(this);

// Listen for popstate events
window.addEventListener('popstate', (event) => {
  this.addLog({
    type: 'POPSTATE_EVENT',
    state: event.state,
    url: location.href,
    timestamp: performance.now()
  });
});
```


}


logHistoryOperation(operation, state, title, url) {
this.addLog({
type: 'HISTORY_OPERATION',
operation,
state: state ? JSON.stringify(state).substring(0, 100) : null,
title,
url,
timestamp: performance.now()
});
}


setupPerformanceDebugging() {
// Monitor performance marks and measures
const performanceObserver = new PerformanceObserver((list) => {
const entries = list.getEntries();


```
entries.forEach(entry => {
    this.logPerformanceEntry(entry);
  });
});

performanceObserver.observe({
  entryTypes: ['mark', 'measure', 'navigation', 'resource']
});

// Monitor long tasks
if ('PerformanceObserver' in window && 'PerformanceLongTaskTiming' in window) {
  const longTaskObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries();

    entries.forEach(entry => {
      this.addLog({
        type: 'LONG_TASK',
        duration: entry.duration,
        startTime: entry.startTime,
        attribution: entry.attribution,
        timestamp: performance.now()
      });
    });
  });

  longTaskObserver.observe({ entryTypes: ['longtask'] });
}

// Monitor frame rate
this.monitorFrameRate();
```


}


logPerformanceEntry(entry) {
this.addLog({
type: 'PERFORMANCE_ENTRY',
entryType: entry.entryType,
name: entry.name,
startTime: entry.startTime,
duration: entry.duration,
details: this.getPerformanceEntryDetails(entry),
timestamp: performance.now()
});
}


getPerformanceEntryDetails(entry) {
const details = {};


```
switch (entry.entryType) {
  case 'navigation':
    details.loadEventEnd = entry.loadEventEnd;
    details.domContentLoadedEventEnd = entry.domContentLoadedEventEnd;
    details.responseEnd = entry.responseEnd;
    break;

  case 'resource':
    details.transferSize = entry.transferSize;
    details.protocol = entry.nextHopProtocol;
    details.cached = entry.transferSize === 0 && entry.decodedBodySize > 0;
    break;

  case 'measure':
    details.detail = entry.detail;
    break;
}

return details;
```


}


monitorFrameRate() {
let frameCount = 0;
let lastTime = performance.now();


```
const measureFrameRate = (currentTime) => {
  frameCount++;

  if (currentTime - lastTime >= 1000) {
    const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));

    this.addLog({
      type: 'FRAME_RATE',
      fps,
      timestamp: currentTime
    });

    // Warn about low frame rates
    if (fps < 30) {
      this.addLog({
        type: 'WARNING',
        message: `Low frame rate detected: ${fps} FPS`,
        fps,
        timestamp: currentTime
      });
    }

    frameCount = 0;
    lastTime = currentTime;
  }

  requestAnimationFrame(measureFrameRate);
};

requestAnimationFrame(measureFrameRate);
```


}


setupErrorTracking() {
// Track JavaScript errors
window.addEventListener('error', (event) => {
this.logError('JAVASCRIPT_ERROR', {
message: event.message,
filename: event.filename,
lineno: event.lineno,
colno: event.colno,
stack: event.error?.stack,
timestamp: performance.now()
});
});


```
// Track unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  this.logError('UNHANDLED_REJECTION', {
    reason: event.reason,
    promise: event.promise,
    timestamp: performance.now()
  });
});

// Track resource errors
document.addEventListener('error', (event) => {
  if (event.target !== window) {
    this.logError('RESOURCE_ERROR', {
      element: event.target.tagName,
      source: event.target.src || event.target.href,
      timestamp: performance.now()
    });
  }
}, true);
```


}


logError(type, details) {
this.addLog({
type,
...details
});


```
// Check for error patterns
this.analyzeErrorPatterns(type, details);
```


}


analyzeErrorPatterns(type, details) {
const recentErrors = this.logs
.filter(log => log.type.includes('ERROR'))
.filter(log => performance.now() - log.timestamp < 60000); // Last minute


```
// Check for error clusters
if (recentErrors.length > 10) {
  this.addLog({
    type: 'WARNING',
    message: 'High error rate detected',
    errorCount: recentErrors.length,
    timestamp: performance.now()
  });
}

// Check for repeated errors
const similarErrors = recentErrors.filter(error =>
  error.message === details.message ||
  error.filename === details.filename
);

if (similarErrors.length > 3) {
  this.addLog({
    type: 'WARNING',
    message: 'Repeated error detected',
    errorMessage: details.message,
    occurrences: similarErrors.length,
    timestamp: performance.now()
  });
}
```


}


// Debugging utilities and breakpoints
setDOMBreakpoint(selector, type = 'mutation') {
const id = `dom_${Date.now()}`;
this.breakpoints.set(id, {
type: 'DOM',
selector,
mutationType: type,
active: true
});


```
return id;
```


}


setCSSOMBreakpoint(rule, operation = 'any') {
const id = `cssom_${Date.now()}`;
this.breakpoints.set(id, {
type: 'CSSOM',
rule,
operation,
active: true
});


```
return id;
```


}


checkDOMBreakpoints(mutation) {
for (const [id, breakpoint] of this.breakpoints) {
if (breakpoint.type === 'DOM' && breakpoint.active) {
const element = mutation.target;
if (element.matches && element.matches(breakpoint.selector)) {
if (breakpoint.mutationType === 'any' ||
breakpoint.mutationType === mutation.type) {


```
this.triggerBreakpoint(id, {
          type: 'DOM_BREAKPOINT',
          mutation,
          element: this.getElementSelector(element)
        });
      }
    }
  }
}
```


}


triggerBreakpoint(id, context) {
this.addLog({
type: 'BREAKPOINT_HIT',
breakpointId: id,
context,
timestamp: performance.now()
});


```
// In development, could trigger debugger
if (this.isDevelopmentMode()) {
  console.group(`🔴 Breakpoint Hit: ${id}`);
  console.log('Context:', context);
  console.log('Breakpoint:', this.breakpoints.get(id));
  console.groupEnd();

  // Optionally pause execution
  // debugger;
}
```


}


isDevelopmentMode() {
return location.hostname === 'localhost' ||
location.hostname.includes('dev') ||
location.search.includes('debug=true');
}


// Log management
addLog(entry) {
this.logs.push(entry);


```
// Keep only recent logs (last 1000 entries)
if (this.logs.length > 1000) {
  this.logs.splice(0, this.logs.length - 1000);
}

// Emit log event for real-time monitoring
this.emitLogEvent(entry);
```


}


emitLogEvent(entry) {
// Custom event for real-time log monitoring
const event = new CustomEvent('debug-log', {
detail: entry
});


```
document.dispatchEvent(event);
```


}


// Analysis and reporting
generateDebugReport() {
const report = {
summary: this.generateSummary(),
errors: this.getErrors(),
warnings: this.getWarnings(),
performance: this.getPerformanceMetrics(),
patterns: this.analyzePatterns(),
recommendations: this.generateRecommendations(),
timestamp: new Date().toISOString()
};


```
return report;
```


}


generateSummary() {
const summary = {
totalLogs: this.logs.length,
timespan: this.logs.length > 0 ?
this.logs[this.logs.length - 1].timestamp - this.logs[0].timestamp : 0,
types: {}
};


```
// Count log types
this.logs.forEach(log => {
  summary.types[log.type] = (summary.types[log.type] || 0) + 1;
});

return summary;
```


}


getErrors() {
return this.logs.filter(log =>
log.type.includes('ERROR') ||
log.type.includes('REJECTION')
);
}


getWarnings() {
return this.logs.filter(log => log.type === 'WARNING');
}


getPerformanceMetrics() {
const performanceLogs = this.logs.filter(log =>
log.type.includes('PERFORMANCE') ||
log.type === 'FRAME_RATE' ||
log.type === 'LONG_TASK'
);


```
return {
  entries: performanceLogs,
  avgFrameRate: this.calculateAverageFrameRate(),
  longTaskCount: this.logs.filter(log => log.type === 'LONG_TASK').length
};
```


}


calculateAverageFrameRate() {
const frameRateLogs = this.logs.filter(log => log.type === 'FRAME_RATE');


```
if (frameRateLogs.length === 0) return null;

const totalFps = frameRateLogs.reduce((sum, log) => sum + log.fps, 0);
return Math.round(totalFps / frameRateLogs.length);
```


}


analyzePatterns() {
const patterns = {
frequentSelectors: this.findFrequentSelectors(),
repeatedMutations: this.findRepeatedMutations(),
performanceBottlenecks: this.findPerformanceBottlenecks()
};


```
return patterns;
```


}


findFrequentSelectors() {
const selectorCounts = {};


```
this.logs
  .filter(log => log.type === 'DOM_QUERY')
  .forEach(log => {
    selectorCounts[log.selector] = (selectorCounts[log.selector] || 0) + 1;
  });

return Object.entries(selectorCounts)
  .sort(([,a], [,b]) => b - a)
  .slice(0, 10)
  .map(([selector, count]) => ({ selector, count }));
```


}


findRepeatedMutations() {
const mutationCounts = {};


```
this.logs
  .filter(log => log.type === 'DOM_MUTATION')
  .forEach(log => {
    const key = `${log.target}_${log.mutationType}`;
    mutationCounts[key] = (mutationCounts[key] || 0) + 1;
  });

return Object.entries(mutationCounts)
  .sort(([,a], [,b]) => b - a)
  .slice(0, 10)
  .map(([key, count]) => {
    const [target, type] = key.split('_');
    return { target, type, count };
  });
```


}


findPerformanceBottlenecks() {
const bottlenecks = [];


```
// Find slow DOM queries
const slowQueries = this.logs
  .filter(log => log.type === 'DOM_QUERY' && log.duration > 10)
  .sort((a, b) => b.duration - a.duration)
  .slice(0, 5);

bottlenecks.push(...slowQueries.map(query => ({
  type: 'Slow DOM Query',
  details: `${query.method}('${query.selector}') - ${query.duration.toFixed(2)}ms`
})));

// Find long tasks
const longTasks = this.logs
  .filter(log => log.type === 'LONG_TASK')
  .sort((a, b) => b.duration - a.duration)
  .slice(0, 5);

bottlenecks.push(...longTasks.map(task => ({
  type: 'Long Task',
  details: `${task.duration.toFixed(2)}ms task`
})));

return bottlenecks;
```


}


generateRecommendations() {
const recommendations = [];
const warnings = this.getWarnings();


```
// DOM-related recommendations
const excessiveMutations = warnings.filter(w =>
  w.message.includes('mutations')
);

if (excessiveMutations.length > 0) {
  recommendations.push({
    category: 'DOM',
    priority: 'high',
    message: 'Excessive DOM mutations detected',
    actions: [
      'Batch DOM operations using DocumentFragment',
      'Use requestAnimationFrame for DOM updates',
      'Consider virtual DOM approaches'
    ]
  });
}

// Performance recommendations
const lowFrameRate = warnings.filter(w =>
  w.message.includes('frame rate')
);

if (lowFrameRate.length > 0) {
  recommendations.push({
    category: 'Performance',
    priority: 'high',
    message: 'Low frame rate detected',
    actions: [
      'Optimize CSS animations to use transform/opacity',
      'Reduce JavaScript execution time',
      'Use will-change property for animated elements'
    ]
  });
}

// Error-related recommendations
const errors = this.getErrors();
if (errors.length > 5) {
  recommendations.push({
    category: 'Reliability',
    priority: 'high',
    message: 'High error rate detected',
    actions: [
      'Implement proper error boundaries',
      'Add input validation',
      'Improve error handling'
    ]
  });
}

return recommendations;
```


}


// Session management
saveDebugSession() {
const session = {
id: Date.now(),
timestamp: new Date().toISOString(),
url: location.href,
userAgent: navigator.userAgent,
logs: this.logs,
breakpoints: Array.from(this.breakpoints.entries()),
report: this.generateDebugReport()
};


```
try {
  localStorage.setItem(`debug_session_${session.id}`, JSON.stringify(session));
  console.log(`Debug session saved: ${session.id}`);
} catch (error) {
  console.warn('Failed to save debug session:', error);
}

return session.id;
```


}


loadDebugSession(sessionId) {
try {
const sessionData = localStorage.getItem(`debug_session_${sessionId}`);
if (sessionData) {
const session = JSON.parse(sessionData);
this.logs = session.logs || [];
this.breakpoints = new Map(session.breakpoints || []);


```
console.log(`Debug session loaded: ${sessionId}`);
    return session;
  }
} catch (error) {
  console.error('Failed to load debug session:', error);
}

return null;
```


}


getDebugSessions() {
const sessions = [];


```
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key && key.startsWith('debug_session_')) {
    try {
      const sessionData = JSON.parse(localStorage.getItem(key));
      sessions.push({
        id: sessionData.id,
        timestamp: sessionData.timestamp,
        url: sessionData.url,
        logCount: sessionData.logs?.length || 0
      });
    } catch (error) {
      console.warn(`Failed to parse debug session: ${key}`);
    }
  }
}

return sessions.sort((a, b) => b.id - a.id);
```


}


// Cleanup
destroy() {
// Disconnect all observers
this.watchers.forEach(watcher => {
if (watcher.disconnect) {
watcher.disconnect();
}
});


```
this.watchers.clear();
this.breakpoints.clear();
this.logs = [];
this.metrics.clear();
```


}


// Developer interface
createDebugInterface() {
if (this.debugInterface) {
return this.debugInterface;
}


```
const interface = {
  // Log filtering and searching
  getLogs: (filter) => {
    if (!filter) return this.logs;

    return this.logs.filter(log => {
      if (filter.type && log.type !== filter.type) return false;
      if (filter.timeRange &&
          (log.timestamp < filter.timeRange.start ||
           log.timestamp > filter.timeRange.end)) return false;
      if (filter.search &&
          !JSON.stringify(log).toLowerCase().includes(filter.search.toLowerCase())) return false;

      return true;
    });
  },

  // Real-time monitoring
  onLog: (callback) => {
    document.addEventListener('debug-log', (event) => {
      callback(event.detail);
    });
  },

  // Breakpoint management
  setBreakpoint: (type, config) => {
    if (type === 'dom') {
      return this.setDOMBreakpoint(config.selector, config.mutationType);
    } else if (type === 'cssom') {
      return this.setCSSOMBreakpoint(config.rule, config.operation);
    }
  },

  removeBreakpoint: (id) => {
    this.breakpoints.delete(id);
  },

  listBreakpoints: () => {
    return Array.from(this.breakpoints.entries());
  },

  // Reporting
  generateReport: () => this.generateDebugReport(),

  // Session management
  saveSession: () => this.saveDebugSession(),
  loadSession: (id) => this.loadDebugSession(id),
  listSessions: () => this.getDebugSessions(),

  // Performance analysis
  analyzePerformance: () => this.getPerformanceMetrics(),

  // Error analysis
  analyzeErrors: () => ({
    errors: this.getErrors(),
    warnings: this.getWarnings(),
    patterns: this.analyzePatterns()
  })
};

this.debugInterface = interface;
return interface;
```


}
}


// Initialize debugger in development mode
const browserDebugger = new BrowserEnvironmentDebugger();


// Create global debug interface
window.BrowserDebugger = browserDebugger.createDebugInterface();


// Auto-save session on page unload
window.addEventListener('beforeunload', () => {
browserDebugger.saveDebugSession();
});


// Log debugger initialization
console.log('🔧 Browser Environment Debugger initialized');
console.log('Use window.BrowserDebugger to access debugging interface');


// Example usage in development
if (browserDebugger.isDevelopmentMode()) {
// Set up some default monitoring
window.BrowserDebugger.onLog((log) => {
if (log.type === 'WARNING' || log.type.includes('ERROR')) {
console.warn('🚨 Debug Alert:', log);
}
});


// Example breakpoints
// window.BrowserDebugger.setBreakpoint('dom', {
//   selector: '.critical-element',
//   mutationType: 'attributes'
// });


console.log('🔍 Development mode debugging active');
}


export { BrowserEnvironmentDebugger };


```
---

## 🎯 TỔNG KẾT VÀ CHIẾN LƯỢC THỰC TIẾN

### 🌟 Key Takeaways from Principal Engineer Perspective

💭 **Final Reflection:**
*Sau 15+ năm experience và deep dive vào browser specifications, những insights quan trọng nhất:*

**1. Standards-First Mindset:**
- Luôn understand specifications trước khi implement features
- Polyfills và fallbacks should follow spec behavior, không invent custom behaviors
- Performance optimization phải base on spec-compliant patterns

**2. Progressive Enhancement Strategy:**
- Build core functionality với basic standards support
- Layer advanced features based on capability detection
- Always provide meaningful fallbacks

**3. Cross-Browser Compatibility Framework:**
- Feature detection over browser detection
- Graceful degradation cho unsupported features
- Comprehensive testing across browser engines

**4. Performance-Oriented Development:**
- Understand browser rendering pipeline để optimize effectively
- Monitor Core Web Vitals continuously
- Implement performance budgets based on business requirements

### 🔧 Production Engineering Checklist

**Pre-Development Phase:**
- [ ] Analyze target browser support requirements
- [ ] Identify critical user journeys và compatibility needs
- [ ] Setup feature detection framework
- [ ] Establish performance baselines

**Development Phase:**
- [ ] Implement feature detection for all modern APIs
- [ ] Create fallback strategies for unsupported features
- [ ] Use progressive enhancement patterns
- [ ] Monitor performance metrics during development

**Testing Phase:**
- [ ] Test across target browser matrix
- [ ] Validate polyfill effectiveness
- [ ] Performance testing on various devices
- [ ] Accessibility compliance verification

**Production Phase:**
- [ ] Real-user monitoring setup
- [ ] Error tracking và compatibility issue detection
- [ ] Performance monitoring với alerting
- [ ] Regular compatibility audits

### 🚀 Future-Proofing Strategies

**Emerging Standards Tracking:**
- Monitor W3C và WHATWG proposal pipelines
- Participate in browser preview programs
- Implement experimental features với feature flags
- Plan migration strategies for deprecated APIs

**Architecture Decisions:**
- Design systems that can adapt to new browser capabilities
- Implement plugin architectures for feature enhancement
- Use build-time optimization for polyfill inclusion
- Create abstraction layers for browser-specific implementations

---

## 📚 CURATED LEARNING RESOURCES

### 📖 Essential Specification Documents

**Core Specifications:**
1. **[DOM Living Standard](https://dom.spec.whatwg.org/)** - Complete DOM implementation guide
2. **[HTML Living Standard](https://html.spec.whatwg.org/)** - Comprehensive HTML và BOM specifications
3. **[CSSOM Specification](https://www.w3.org/TR/cssom-1/)** - CSS Object Model detailed implementation
4. **[ECMAScript Specification](https://tc39.es/ecma262/)** - JavaScript language specification

**Advanced Topics:**
1. **[Web Platform Tests](https://web-platform-tests.org/)** - Cross-browser compatibility testing
2. **[Can I Use](https://caniuse.com/)** - Browser support tables
3. **[MDN Web Docs](https://developer.mozilla.org/)** - Comprehensive API documentation
4. **[Chrome Platform Status](https://chromestatus.com/)** - Chrome feature implementation tracking

### 🛠️ Practical Implementation Tools

**Development Tools:**
- **Browser DevTools** - Master performance profiling và debugging
- **Lighthouse** - Automated performance và best practice auditing
- **WebPageTest** - Real-world performance testing
- **BrowserStack/LambdaTest** - Cross-browser testing platforms

**Monitoring Solutions:**
- **Real User Monitoring (RUM)** - Track actual user performance
- **Synthetic Monitoring** - Automated performance testing
- **Error Tracking** - Sentry, Bugsnag for production error monitoring
- **Performance Analytics** - Core Web Vitals tracking

### 💡 Community Resources

**Expert Channels:**
- **Web Standards Community** - Follow W3C và WHATWG discussions
- **Browser Engineering Blogs** - Chrome, Firefox, Safari development teams
- **Performance Community** - Web performance expert discussions
- **Conference Talks** - JSConf, CSS Conf, Performance.now()

---

## 🎉 CLOSING THOUGHTS

Việc hiểu sâu về Browser Environment, Specifications, và Web Standards không chỉ là academic exercise - nó là foundation cho building robust, scalable, và future-proof web applications.

Từ experience tại NAB, Axon, Binance, Webflow, và Figma, tôi learned rằng successful web applications require:

1. **Deep Technical Understanding** - Know the specifications, not just the APIs
2. **Pragmatic Implementation** - Balance ideal solutions với business constraints
3. **Continuous Learning** - Web platform evolves rapidly, stay updated
4. **User-Centric Approach** - Technology serves users, not the other way around

**Final Advice:**

🔥 **For Junior Developers:** Master the fundamentals first. Understand DOM, CSSOM, và BOM thoroughly before jumping to frameworks.

⚡ **For Mid-level Engineers:** Focus on cross-browser compatibility và performance optimization. These skills differentiate good developers from great ones.

🚀 **For Senior+ Engineers:** Think about architecture, standards compliance, và team enablement. Your job is to set technical direction và enable others.

Remember: **Great web developers don't just use browser APIs - they understand why they work the way they do.**

---

*Keep building amazing web experiences! 🌐✨*
```
