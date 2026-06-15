# JavaScript Event Propagation Deep Dive

## You

Continue

## Claude


# PHÂN TÍCH CHUYÊN SÂU: Event Bubbling và Capturing trong JavaScript - Từ First Principles đến Production Engineering


*Góc nhìn của một Principal Front-end Engineer qua hành trình tại NAB, Axon, Binance, Webflow, và Figma*


---


## 🌱 PREFACE: TẠI SAO CHÚNG TA CẦN HIỂU SÂU VỀ EVENT SYSTEM?


💭 **Principal's Reflection**: Trong 15 năm career, tôi nhận ra rằng Event System là spine của mọi ứng dụng web hiện đại. Tại NAB, khi chúng tôi build banking platform phục vụ 9 triệu customers, một bug trong event handling có thể crash toàn bộ transaction flow. Tại Binance, với trading volume $76 billion/ngày, việc hiểu sâu event propagation là difference giữa profit và catastrophic loss.


Nhưng hầu hết developers chỉ biết `addEventListener()` và nghĩ rằng đó là đủ. Thực tế, Event System là một distributed computing model thu nhỏ ngay trong browser của bạn. Nó implement Observer Pattern, Message Passing, và Tree Traversal algorithms - tất cả đều là fundamental computer science concepts.


Hôm nay, chúng ta sẽ journey từ "What is an event?" đến "How to architect event-driven systems at enterprise scale?"


---


## 📚 PART I: FOUNDATION LEVEL - XÂY DỰNG TƯ DUY CƠ BẢN


### 🔬 Chapter 1: Event Là Gì? - Từ Hardware đến Software Abstraction


#### 🌱 Nguồn Gốc & Motivation


💭 **Thought Process**: Khi tôi mentor junior developers, câu hỏi đầu tiên tôi thường hỏi là: "Theo bạn, computer làm sao biết user đã click chuột?" Câu trả lời này reveal understanding level về computer fundamentals.


**Problem Statement Chi Tiết:**


Quay về năm 1960s, computers không có GUI, không có mouse, không có interactive experiences. Programs chạy batch mode - input một lần, process, output một lần, end. Nhưng khi personal computers xuất hiện, users muốn real-time interaction:


- Click buttons
- Type text
- Drag and drop
- Resize windows
- Multi-tasking


**Challenge cốt lõi:** Làm sao để computer respond to unpredictable user actions trong khi vẫn maintain program execution flow?


**Historical Context:**


1. **Polling Era (1970s)**: Programs liên tục check input devices


```c
// Pseudo-code cổ điển
while (true) {
    if (mouse_clicked()) handle_click();
    if (key_pressed()) handle_key();
    // Very inefficient!
}
```


1. **Interrupt-Driven Era (1980s)**: Hardware interrupts pause CPU execution


```c
// Hardware level interrupt
void mouse_interrupt_handler() {
    // CPU stops current work
    // Handle mouse event
    // Resume previous work
}
```


1. **Event-Driven Programming (1990s+)**: Software abstraction layer


```javascript
// Modern event-driven approach
button.addEventListener('click', handleClick);
// Non-blocking, efficient, scalable
```


#### 🔬 Bản Chất & Mechanism - Computer Science Deep Dive


**Core Algorithm Analysis:**


Event System là implementation của **Observer Pattern** combined với **Tree Traversal algorithms**. Hãy breakdown từng component:


**1. Event Creation (Signal Generation)**


```javascript
// Khi user click, browser engine tạo Event object
class MouseEvent {
    constructor(type, target, coordinates) {
        this.type = type;           // 'click'
        this.target = target;       // DOM element
        this.clientX = coordinates.x;
        this.clientY = coordinates.y;
        this.timestamp = performance.now();
        this.bubbles = true;        // Default behavior
    }
}
```


💭 **Deep Understanding**: Event object không phải magic. Nó là structured data containing context information. Browser engine (Blink, Gecko, WebKit) tạo ra objects này based on hardware interrupts.


**2. Target Selection (Hit Testing Algorithm)**


```javascript
// Browser engine performs geometric calculations
function findEventTarget(x, y) {
    // Traverse DOM tree from deepest to shallowest
    let elements = document.elementsFromPoint(x, y);
    return elements[0]; // Most nested element
}
```


**Data Structure:** Browser maintain **Spatial Index** (usually R-tree hoặc Quad-tree) để optimize hit testing performance từ O(n) thành O(log n).


**3. Event Propagation (Tree Traversal)**


Đây là core mechanism mà chúng ta cần hiểu thoroughly:


```javascript
// Simplified browser engine logic
function propagateEvent(event, target) {
    // Phase 1: Build ancestors path (Capturing)
    let ancestors = [];
    let node = target.parentNode;
    while (node) {
        ancestors.push(node);
        node = node.parentNode;
    }

    // Phase 2: Capturing phase (Root to Target)
    for (let i = ancestors.length - 1; i >= 0; i--) {
        if (event.cancelBubble) break;
        invokeListeners(ancestors[i], event, 'capture');
    }

    // Phase 3: Target phase
    invokeListeners(target, event, 'target');

    // Phase 4: Bubbling phase (Target to Root)
    for (let i = 0; i < ancestors.length; i++) {
        if (event.cancelBubble) break;
        invokeListeners(ancestors[i], event, 'bubble');
    }
}
```


#### 💡 Intuitive Understanding - Real-World Analogies


**Analogy 1: Corporate Hierarchy Communication**


Imagine một company với hierarchy: CEO → VP → Manager → Employee. Khi Employee có issue, information flow như thế nào?


1. **Capturing Phase**: CEO decides "Investigate employee issue" → VP → Manager → Employee
2. **Target Phase**: Employee explains exact problem
3. **Bubbling Phase**: Employee → Manager (adds context) → VP (strategic perspective) → CEO (final decision)


**Analogy 2: Mail Delivery System**


Event propagation giống postal system:


- **Event**: Letter/package
- **Target**: Recipient address
- **Capturing**: Mail sorting from national → regional → local
- **Bubbling**: Delivery confirmation back up the chain


**Visual Metaphor**: Think of DOM tree như Russian Nesting Dolls (Matryoshka). Event starts from innermost doll và propagates outward, allowing mỗi layer process information.


### 🔬 Chapter 2: DOM Tree - The Foundation Architecture


#### 🌱 Nguồn Gốc & Motivation


💭 **Principal's Perspective**: Tại Webflow, chúng tôi build visual website builder. Users drag/drop elements để create complex layouts. Initially, junior engineers muốn attach event listeners directly to mỗi draggable element. Với 1000+ elements, performance crashed. DOM Tree traversal understanding saved our bacon.


**Problem Statement:**


HTML documents are inherently hierarchical - elements nest inside other elements. Nhưng làm sao browser represent này efficiently? Và làm sao events navigate qua hierarchy này?


**Before DOM Trees:**


- Linear parsing: Browser read HTML top-to-bottom
- No structural relationship between elements
- No efficient way to traverse parent-child relationships
- No event delegation capabilities


**With DOM Trees:**


- Hierarchical representation using Tree data structure
- O(log n) traversal complexity
- Parent-child relationships explicitly maintained
- Event propagation follows tree structure


#### 🔬 Bản Chất & Mechanism - Tree Data Structure Analysis


**Core Tree Implementation:**


```javascript
// Simplified DOM Node implementation
class DOMNode {
    constructor(tagName) {
        this.tagName = tagName;
        this.parentNode = null;
        this.childNodes = [];
        this.attributes = new Map();
        this.eventListeners = new Map();
    }

    appendChild(child) {
        child.parentNode = this;
        this.childNodes.push(child);
        return child;
    }

    removeChild(child) {
        const index = this.childNodes.indexOf(child);
        if (index > -1) {
            this.childNodes.splice(index, 1);
            child.parentNode = null;
        }
        return child;
    }

    // Tree traversal methods
    getAncestors() {
        let ancestors = [];
        let node = this.parentNode;
        while (node) {
            ancestors.push(node);
            node = node.parentNode;
        }
        return ancestors;
    }
}
```


**Memory Model Analysis:**


```javascript
// Memory layout example
const html = new DOMNode('html');
const body = new DOMNode('body');
const div = new DOMNode('div');
const button = new DOMNode('button');

// Building tree structure
html.appendChild(body);
body.appendChild(div);
div.appendChild(button);

// Memory representation:
// html: { childNodes: [body], parentNode: null }
// body: { childNodes: [div], parentNode: html }
// div:  { childNodes: [button], parentNode: body }
// button: { childNodes: [], parentNode: div }
```


**Tree Traversal Algorithms:**


```javascript
// Depth-First Search (DFS) - Used in event propagation
function traverseTreeDFS(node, callback) {
    callback(node);
    for (let child of node.childNodes) {
        traverseTreeDFS(child, callback);
    }
}

// Breadth-First Search (BFS) - Used in some CSS selectors
function traverseTreeBFS(root, callback) {
    const queue = [root];
    while (queue.length > 0) {
        const node = queue.shift();
        callback(node);
        queue.push(...node.childNodes);
    }
}

// Ancestor Path - Used in event propagation
function getPathToRoot(node) {
    const path = [];
    while (node) {
        path.unshift(node);
        node = node.parentNode;
    }
    return path;
}
```


#### ⚙️ Implementation Deep Dive - Browser Engine Specifics


**V8 Engine (Chrome) Implementation:**


```cpp
// Simplified C++ representation
class Node {
private:
    Vector<Node*> children_;
    Node* parent_;
    EventListenerMap listeners_;

public:
    void addEventListener(const String& type, EventListener* listener, bool useCapture) {
        EventListenerVector* listeners = getEventListeners(type);
        listeners->append(EventListenerWithOptions(listener, useCapture));
    }

    void dispatchEvent(Event* event) {
        // Build propagation path
        Vector<Node*> ancestors;
        for (Node* node = parent_; node; node = node->parent_) {
            ancestors.append(node);
        }

        // Capturing phase
        for (int i = ancestors.size() - 1; i >= 0; --i) {
            if (event->propagationStopped()) break;
            ancestors[i]->fireEventListeners(event, true);
        }

        // Target phase
        fireEventListeners(event, false);

        // Bubbling phase
        for (Node* ancestor : ancestors) {
            if (event->propagationStopped()) break;
            ancestor->fireEventListeners(event, false);
        }
    }
};
```


**Performance Characteristics:**


- **Tree Construction**: O(n) where n = number of nodes
- **Ancestor Path Lookup**: O(h) where h = tree height (usually log n)
- **Event Propagation**: O(h) for path traversal + O(k) for listener execution
- **Memory Overhead**: Each node stores parent pointer + children array


**Browser Optimization Techniques:**


1. **Node Pool Allocation**: Reuse node objects để avoid garbage collection
2. **Path Caching**: Cache ancestor paths for frequent event targets
3. **Listener Grouping**: Group listeners by event type để reduce lookup overhead
4. **Early Termination**: Stop propagation immediately when `stopPropagation()` called


---


## 📘 PART II: SENIOR LEVEL - HIỂU SÂU CÁC CONCEPTS NÂNG CAO


### 🔬 Chapter 3: Event Bubbling - Deep Mechanism Analysis


#### 🌱 Nguồn Gốc & Historical Context


💭 **Principal's Memory**: Tại NAB, chúng tôi có một incident khá memorable. Banking form có nested components: `<form>` → `<div class="section">` → `<button class="submit">`. Junior developer attach submit handler vào both form và button. Khi user click button, handler fired twice - một transaction được process hai lần, resulting in double charges. Đó là moment tôi realize importance of understanding bubbling mechanism thoroughly.


**Historical Evolution:**


1. **Netscape Era (1995)**: Event bubbling được invented bởi Netscape team
2. **Internet Explorer Approach (1996)**: Microsoft implemented event capturing instead
3. **Browser Wars Chaos (1997-2004)**: Incompatible event models
4. **DOM Level 2 Standard (2000)**: W3C standardized both bubbling và capturing
5. **Modern Consensus (2005+)**: All browsers support both models


**Design Philosophy Behind Bubbling:**


Netscape engineers observed real-world communication patterns:


- In organizations, issues bubble up from employees to management
- In software, errors propagate up the call stack
- In networks, packets route through hierarchical infrastructure


They realized DOM events should follow similar patterns.


#### 🔬 Core Algorithm - Step-by-Step Execution Flow


**Detailed Bubbling Implementation:**


```javascript
// Complete bubbling mechanism implementation
class EventTarget {
    constructor() {
        this._listeners = new Map();
        this.parent = null;
        this.children = new Set();
    }

    addEventListener(type, listener, options = {}) {
        if (!this._listeners.has(type)) {
            this._listeners.set(type, []);
        }

        const listenerEntry = {
            listener,
            capture: !!options.capture,
            once: !!options.once,
            passive: !!options.passive,
            signal: options.signal
        };

        this._listeners.get(type).push(listenerEntry);

        // Handle AbortSignal
        if (options.signal) {
            options.signal.addEventListener('abort', () => {
                this.removeEventListener(type, listener, options);
            });
        }
    }

    dispatchEvent(event) {
        // Set event properties
        event.target = this;
        event.eventPhase = Event.AT_TARGET;

        // Phase 1: Build propagation path
        const propagationPath = this._buildPropagationPath();

        // Phase 2: Capturing phase
        event.eventPhase = Event.CAPTURING_PHASE;
        for (let i = propagationPath.length - 1; i > 0; i--) {
            if (event._stopPropagation) break;
            event.currentTarget = propagationPath[i];
            this._invokeListeners(propagationPath[i], event, true);
        }

        // Phase 3: Target phase
        event.eventPhase = Event.AT_TARGET;
        event.currentTarget = this;
        this._invokeListeners(this, event, false);
        this._invokeListeners(this, event, true);

        // Phase 4: Bubbling phase
        if (event.bubbles && !event._stopPropagation) {
            event.eventPhase = Event.BUBBLING_PHASE;
            for (let i = 1; i < propagationPath.length; i++) {
                if (event._stopPropagation) break;
                event.currentTarget = propagationPath[i];
                this._invokeListeners(propagationPath[i], event, false);
            }
        }

        return !event.defaultPrevented;
    }

    _buildPropagationPath() {
        const path = [this];
        let current = this.parent;
        while (current) {
            path.push(current);
            current = current.parent;
        }
        return path;
    }

    _invokeListeners(target, event, capture) {
        const listeners = target._listeners.get(event.type) || [];

        for (const entry of listeners) {
            if (entry.capture !== capture) continue;
            if (event._stopImmediatePropagation) break;

            try {
                // Handle passive listeners
                if (entry.passive) {
                    // Prevent preventDefault() in passive listeners
                    const originalPreventDefault = event.preventDefault;
                    event.preventDefault = () => {
                        console.warn('preventDefault() ignored in passive listener');
                    };

                    entry.listener.call(target, event);
                    event.preventDefault = originalPreventDefault;
                } else {
                    entry.listener.call(target, event);
                }

                // Handle once option
                if (entry.once) {
                    this.removeEventListener(event.type, entry.listener, {
                        capture: entry.capture
                    });
                }
            } catch (error) {
                // Browser handles listener errors
                console.error('Event listener error:', error);
            }
        }
    }
}
```


#### 💡 Advanced Bubbling Patterns - Production Use Cases


**Pattern 1: Event Delegation - Enterprise Scale Implementation**


💭 **Binance Trading Interface Story**: Tại Binance, trading interface có 1000+ cryptocurrency pairs, mỗi pair có multiple action buttons (buy, sell, add to watchlist, etc.). Initially, chúng tôi attach individual listeners cho mỗi button - 5000+ event listeners total. Performance degraded significantly trên mobile devices.


Solution: Event Delegation Pattern


```javascript
// Before: Performance killer
class TradingPairList {
    constructor(pairs) {
        this.pairs = pairs;
        this.render();
        this.attachListeners(); // This kills performance
    }

    attachListeners() {
        // 5000+ event listeners!
        this.pairs.forEach(pair => {
            document.getElementById(`buy-${pair.id}`).addEventListener('click', this.handleBuy);
            document.getElementById(`sell-${pair.id}`).addEventListener('click', this.handleSell);
            document.getElementById(`watch-${pair.id}`).addEventListener('click', this.handleWatch);
        });
    }
}

// After: Optimized with event delegation
class OptimizedTradingPairList {
    constructor(pairs) {
        this.pairs = pairs;
        this.render();
        this.attachDelegatedListener(); // Single listener!
    }

    attachDelegatedListener() {
        // Only 1 event listener for entire list!
        this.container.addEventListener('click', (event) => {
            const action = event.target.dataset.action;
            const pairId = event.target.dataset.pairId;

            if (!action || !pairId) return;

            switch (action) {
                case 'buy':
                    this.handleBuy(pairId, event);
                    break;
                case 'sell':
                    this.handleSell(pairId, event);
                    break;
                case 'watch':
                    this.handleWatch(pairId, event);
                    break;
            }
        });
    }

    render() {
        this.container.innerHTML = this.pairs.map(pair => `
            <div class="trading-pair" data-pair-id="${pair.id}">
                <span class="pair-name">${pair.name}</span>
                <button data-action="buy" data-pair-id="${pair.id}">Buy</button>
                <button data-action="sell" data-pair-id="${pair.id}">Sell</button>
                <button data-action="watch" data-pair-id="${pair.id}">Watch</button>
            </div>
        `).join('');
    }
}
```


**Performance Impact:**


- Memory usage: 95% reduction
- Event registration time: 98% faster
- GC pressure: Significantly reduced
- Mobile scrolling: Butter smooth


**Pattern 2: Event Bus Architecture - Component Communication**


💭 **Figma Plugin System Experience**: Tại Figma, chúng tôi build plugin ecosystem where hundreds of plugins need to communicate với main application và với nhau. Direct coupling would create dependency hell. Event bubbling inspired our event bus architecture.


```javascript
// Enterprise-grade Event Bus implementation
class EventBus {
    constructor() {
        this.listeners = new Map();
        this.middlewares = [];
        this.eventHistory = [];
        this.maxHistorySize = 1000;
    }

    // Middleware pattern for event processing
    use(middleware) {
        this.middlewares.push(middleware);
    }

    emit(eventType, data, options = {}) {
        const event = {
            type: eventType,
            data,
            timestamp: Date.now(),
            source: options.source || 'unknown',
            id: this.generateEventId(),
            bubbles: options.bubbles !== false,
            cancelable: options.cancelable !== false,
            _cancelled: false,
            _stopped: false
        };

        // Apply middlewares
        for (const middleware of this.middlewares) {
            if (event._cancelled) break;
            middleware(event);
        }

        if (event._cancelled) return false;

        // Store in history for debugging
        this.addToHistory(event);

        // Emit to listeners
        return this.propagateEvent(event);
    }

    propagateEvent(event) {
        const listeners = this.listeners.get(event.type) || [];

        for (const listener of listeners) {
            if (event._stopped) break;

            try {
                const result = listener.handler(event);

                // Support async listeners
                if (result instanceof Promise) {
                    result.catch(error => {
                        console.error(`Async event listener error:`, error);
                    });
                }
            } catch (error) {
                console.error(`Event listener error:`, error);

                // Optional: stop propagation on error
                if (listener.stopOnError) {
                    event._stopped = true;
                }
            }
        }

        return !event._cancelled;
    }

    on(eventType, handler, options = {}) {
        if (!this.listeners.has(eventType)) {
            this.listeners.set(eventType, []);
        }

        const listener = {
            handler,
            once: options.once || false,
            priority: options.priority || 0,
            stopOnError: options.stopOnError || false,
            context: options.context
        };

        const listeners = this.listeners.get(eventType);
        listeners.push(listener);

        // Sort by priority (higher priority first)
        listeners.sort((a, b) => b.priority - a.priority);

        // Return unsubscribe function
        return () => this.off(eventType, handler);
    }

    off(eventType, handler) {
        const listeners = this.listeners.get(eventType);
        if (!listeners) return;

        const index = listeners.findIndex(l => l.handler === handler);
        if (index > -1) {
            listeners.splice(index, 1);
        }
    }

    // Debugging utilities
    getEventHistory(filter) {
        if (!filter) return this.eventHistory;

        return this.eventHistory.filter(event => {
            if (filter.type && event.type !== filter.type) return false;
            if (filter.source && event.source !== filter.source) return false;
            if (filter.since && event.timestamp < filter.since) return false;
            return true;
        });
    }

    generateEventId() {
        return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    addToHistory(event) {
        this.eventHistory.push(event);
        if (this.eventHistory.length > this.maxHistorySize) {
            this.eventHistory.shift();
        }
    }
}

// Usage in Figma plugin system
const pluginEventBus = new EventBus();

// Logging middleware
pluginEventBus.use((event) => {
    console.log(`[EventBus] ${event.type}:`, event.data);
});

// Authentication middleware
pluginEventBus.use((event) => {
    if (event.type.startsWith('admin.') && !isAdmin(event.source)) {
        event._cancelled = true;
        console.warn('Unauthorized admin event blocked');
    }
});

// Plugin communication
pluginEventBus.on('selection.changed', (event) => {
    // Update all plugins when selection changes
    updatePluginSelection(event.data.selectedNodes);
});

pluginEventBus.on('plugin.action', (event) => {
    // Handle plugin actions
    executePluginAction(event.data.action, event.data.params);
});
```


#### 🏭 Production Challenges & Solutions


**Challenge 1: Memory Leaks in Event-Heavy Applications**


💭 **Axon Body Camera Software Story**: Tại Axon, body camera software process millions of events (video frames, GPS coordinates, sensor data, user interactions). Memory leaks từ unremoved event listeners crashed devices in field.


```javascript
// Problematic pattern that causes memory leaks
class VideoPlayer {
    constructor(videoElement) {
        this.video = videoElement;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Memory leak: anonymous functions can't be removed
        this.video.addEventListener('timeupdate', () => {
            this.updateProgress();
        });

        this.video.addEventListener('ended', () => {
            this.handleVideoEnd();
        });

        // Memory leak: no cleanup on component destruction
        window.addEventListener('resize', () => {
            this.adjustPlayerSize();
        });
    }

    destroy() {
        // Oops! Can't remove anonymous listeners
        // window listener never cleaned up
    }
}

// Solution: Proper listener management
class LeakFreeVideoPlayer {
    constructor(videoElement) {
        this.video = videoElement;
        this.listeners = new Map();
        this.abortController = new AbortController();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Store bound functions for cleanup
        this.handleTimeUpdate = this.handleTimeUpdate.bind(this);
        this.handleVideoEnd = this.handleVideoEnd.bind(this);
        this.handleResize = this.handleResize.bind(this);

        // Use AbortController for automatic cleanup
        const signal = this.abortController.signal;

        this.video.addEventListener('timeupdate', this.handleTimeUpdate, { signal });
        this.video.addEventListener('ended', this.handleVideoEnd, { signal });
        window.addEventListener('resize', this.handleResize, { signal });

        // Alternative: Manual tracking
        this.addListener(this.video, 'loadstart', this.handleLoadStart);
        this.addListener(this.video, 'error', this.handleError);
    }

    addListener(target, type, handler, options) {
        const boundHandler = handler.bind(this);
        target.addEventListener(type, boundHandler, options);

        // Track for cleanup
        if (!this.listeners.has(target)) {
            this.listeners.set(target, []);
        }
        this.listeners.get(target).push({ type, handler: boundHandler, options });
    }

    handleTimeUpdate() {
        this.updateProgress();
    }

    handleVideoEnd() {
        this.handleVideoEnd();
    }

    handleResize() {
        this.adjustPlayerSize();
    }

    destroy() {
        // Automatic cleanup with AbortController
        this.abortController.abort();

        // Manual cleanup for tracked listeners
        for (const [target, listeners] of this.listeners) {
            for (const { type, handler, options } of listeners) {
                target.removeEventListener(type, handler, options);
            }
        }

        this.listeners.clear();
    }
}
```


**Challenge 2: Event Performance at Scale**


```javascript
// Performance monitoring for event-heavy applications
class EventPerformanceMonitor {
    constructor() {
        this.metrics = {
            totalEvents: 0,
            averageProcessingTime: 0,
            slowEvents: [],
            memoryUsage: []
        };

        this.startMonitoring();
    }

    startMonitoring() {
        // Monkey patch addEventListener to track performance
        const originalAddEventListener = EventTarget.prototype.addEventListener;

        EventTarget.prototype.addEventListener = function(type, listener, options) {
            const wrappedListener = this.wrapListenerForMonitoring(type, listener);
            return originalAddEventListener.call(this, type, wrappedListener, options);
        }.bind(this);
    }

    wrapListenerForMonitoring(eventType, originalListener) {
        return (event) => {
            const startTime = performance.now();
            const startMemory = performance.memory?.usedJSHeapSize || 0;

            try {
                originalListener(event);
            } finally {
                const endTime = performance.now();
                const endMemory = performance.memory?.usedJSHeapSize || 0;

                this.recordMetrics(eventType, endTime - startTime, endMemory - startMemory);
            }
        };
    }

    recordMetrics(eventType, processingTime, memoryDelta) {
        this.metrics.totalEvents++;

        // Update average processing time
        const prevAvg = this.metrics.averageProcessingTime;
        const newAvg = (prevAvg * (this.metrics.totalEvents - 1) + processingTime) / this.metrics.totalEvents;
        this.metrics.averageProcessingTime = newAvg;

        // Track slow events (>16ms for 60fps)
        if (processingTime > 16) {
            this.metrics.slowEvents.push({
                type: eventType,
                processingTime,
                timestamp: Date.now()
            });

            // Keep only recent slow events
            if (this.metrics.slowEvents.length > 100) {
                this.metrics.slowEvents.shift();
            }
        }

        // Track memory usage
        if (memoryDelta > 0) {
            this.metrics.memoryUsage.push({
                type: eventType,
                memoryDelta,
                timestamp: Date.now()
            });
        }
    }

    getReport() {
        return {
            ...this.metrics,
            recommendations: this.generateRecommendations()
        };
    }

    generateRecommendations() {
        const recommendations = [];

        if (this.metrics.averageProcessingTime > 10) {
            recommendations.push('Consider debouncing high-frequency events');
        }

        if (this.metrics.slowEvents.length > 10) {
            recommendations.push('Optimize slow event handlers or move work to Web Workers');
        }

        const recentMemoryGrowth = this.metrics.memoryUsage
            .slice(-10)
            .reduce((sum, usage) => sum + usage.memoryDelta, 0);

        if (recentMemoryGrowth > 1024 * 1024) { // 1MB
            recommendations.push('Potential memory leak in event handlers');
        }

        return recommendations;
    }
}
```


### 🔬 Chapter 4: Event Capturing - The Underestimated Phase


#### 🌱 Nguồn Gốc & Design Philosophy


💭 **Principal's Insight**: Event capturing là most misunderstood aspect of DOM events. Trong 15 năm career, tôi thấy 95% developers không bao giờ use capturing phase deliberately. Nhưng capturing là key to solving complex event coordination problems.


**Historical Context:**


Capturing được inspired bởi **Hierarchical Decision Making** trong management theory:


1. **Top-Down Decision Flow**: CEO decides strategy → VPs implement → Managers execute
2. **Information Preprocessing**: Higher levels filter/modify information before it reaches lower levels
3. **Early Intervention**: Problems can be caught and handled before affecting lower levels


**Technical Motivation:**


```javascript
// Problem scenario: Modal dialogs
<div class="app">
    <div class="modal-backdrop" onclick="closeModal()">
        <div class="modal-content" onclick="handleModalClick()">
            <button onclick="handleButtonClick()">Click me</button>
        </div>
    </div>
</div>
```


Without capturing, clicking button triggers all three handlers:


1. `handleButtonClick()`
2. `handleModalClick()`
3. `closeModal()` ← Oops! Modal closes unexpectedly


#### 🔬 Capturing Mechanism - Advanced Implementation


**Complete Capturing Implementation:**


```javascript
class AdvancedEventTarget extends EventTarget {
    constructor() {
        super();
        this.captureListeners = new Map();
        this.bubbleListeners = new Map();
        this.eventFilters = new Map();
        this.eventInterceptors = new Map();
    }

    addCaptureListener(type, listener, options = {}) {
        if (!this.captureListeners.has(type)) {
            this.captureListeners.set(type, []);
        }

        const entry = {
            listener,
            priority: options.priority || 0,
            filter: options.filter,
            transform: options.transform,
            condition: options.condition
        };

        this.captureListeners.get(type).push(entry);

        // Sort by priority
        this.captureListeners.get(type).sort((a, b) => b.priority - a.priority);
    }

    addEventFilter(type, filter) {
        if (!this.eventFilters.has(type)) {
            this.eventFilters.set(type, []);
        }
        this.eventFilters.get(type).push(filter);
    }

    addEventInterceptor(type, interceptor) {
        if (!this.eventInterceptors.has(type)) {
            this.eventInterceptors.set(type, []);
        }
        this.eventInterceptors.get(type).push(interceptor);
    }

    processCapturingPhase(event) {
        // Apply filters first
        const filters = this.eventFilters.get(event.type) || [];
        for (const filter of filters) {
            if (!filter(event)) {
                event.stopPropagation();
                return false;
            }
        }

        // Apply interceptors
        const interceptors = this.eventInterceptors.get(event.type) || [];
        for (const interceptor of interceptors) {
            const result = interceptor(event);
            if (result === false) {
                event.stopPropagation();
                return false;
            }
            if (result && typeof result === 'object') {
                Object.assign(event, result);
            }
        }

        // Process capture listeners
        const listeners = this.captureListeners.get(event.type) || [];
        for (const entry of listeners) {
            if (event.cancelBubble) break;

            // Check condition
            if (entry.condition && !entry.condition(event)) continue;

            // Apply filter
            if (entry.filter && !entry.filter(event)) continue;

            // Apply transform
            if (entry.transform) {
                event = entry.transform(event) || event;
            }

            entry.listener.call(this, event);
        }

        return !event.cancelBubble;
    }
}
```


#### 💡 Advanced Capturing Patterns


**Pattern 1: Event Routing và Authorization**


💭 **Figma Multi-User Collaboration**: Tại Figma, multiple users collaborate on same design file. Chúng tôi cần authorize mỗi action before nó reaches target element. Capturing phase perfect cho security layer này.


```javascript
class CollaborativeDesignCanvas extends AdvancedEventTarget {
    constructor(userPermissions) {
        super();
        this.userPermissions = userPermissions;
        this.setupSecurityLayer();
    }

    setupSecurityLayer() {
        // Authorization interceptor
        this.addEventInterceptor('*', (event) => {
            const requiredPermission = this.getRequiredPermission(event);
            if (!this.hasPermission(event.userId, requiredPermission)) {
                console.warn(`User ${event.userId} lacks permission: ${requiredPermission}`);
                return false; // Block event
            }
            return true;
        });

        // Rate limiting interceptor
        this.addEventInterceptor('mousedown', (event) => {
            if (this.isRateLimited(event.userId)) {
                console.warn(`Rate limit exceeded for user ${event.userId}`);
                return false;
            }
            return true;
        });

        // Event transformation interceptor
        this.addEventInterceptor('keydown', (event) => {
            if (event.key === 'Delete' && this.isProtectedElement(event.target)) {
                return {
                    ...event,
                    type: 'softDelete', // Transform dangerous delete to soft delete
                    originalType: 'keydown'
                };
            }
            return true;
        });
    }

    getRequiredPermission(event) {
        const permissionMap = {
            'mousedown': 'select',
            'dblclick': 'edit',
            'keydown': event.key === 'Delete' ? 'delete' : 'edit',
            'contextmenu': 'menu'
        };
        return permissionMap[event.type] || 'read';
    }

    hasPermission(userId, permission) {
        const userPerms = this.userPermissions.get(userId) || [];
        return userPerms.includes(permission) || userPerms.includes('admin');
    }

    isRateLimited(userId) {
        // Implementation of rate limiting logic
        return false; // Simplified
    }

    isProtectedElement(element) {
        return element.classList.contains('protected') ||
               element.dataset.protected === 'true';
    }
}
```


**Pattern 2: Global Event Coordination**


💭 **Binance Trading Terminal**: Trading interface có multiple widgets (price charts, order book, trading form, portfolio). Khi user performs action, chúng tôi cần coordinate updates across all widgets. Capturing phase cho phép central coordination.


```javascript
class TradingTerminalCoordinator {
    constructor() {
        this.widgets = new Map();
        this.globalState = new Proxy({}, {
            set: (target, prop, value) => {
                target[prop] = value;
                this.notifyWidgets(prop, value);
                return true;
            }
        });

        this.setupGlobalEventHandling();
    }

    setupGlobalEventHandling() {
        // Capture all trading-related events for coordination
        document.addEventListener('tradingAction', this.coordinateAction.bind(this), true);
        document.addEventListener('priceUpdate', this.coordinatePriceUpdate.bind(this), true);
        document.addEventListener('orderUpdate', this.coordinateOrderUpdate.bind(this), true);
    }

    coordinateAction(event) {
        const { action, data } = event.detail;

        switch (action) {
            case 'selectPair':
                this.handlePairSelection(data);
                break;
            case 'placeOrder':
                this.handleOrderPlacement(data);
                break;
            case 'cancelOrder':
                this.handleOrderCancellation(data);
                break;
        }

        // Update global state
        this.globalState.lastAction = { action, data, timestamp: Date.now() };
    }

    coordinatePriceUpdate(event) {
        const { symbol, price, timestamp } = event.detail;

        // Update all widgets that show this symbol
        for (const [widgetId, widget] of this.widgets) {
            if (widget.interestedSymbols.includes(symbol)) {
                widget.updatePrice(symbol, price, timestamp);
            }
        }

        // Check for alert triggers
        this.checkPriceAlerts(symbol, price);

        // Update global state
        this.globalState.prices = {
            ...this.globalState.prices,
            [symbol]: { price, timestamp }
        };
    }

    coordinateOrderUpdate(event) {
        const { orderId, status, data } = event.detail;

        // Optimistic UI updates during capturing phase
        if (status === 'pending') {
            this.showPendingIndicator(orderId);
        }

        // Route to appropriate widgets
        this.widgets.forEach(widget => {
            if (widget.type === 'orderBook' || widget.type === 'portfolio') {
                widget.updateOrder(orderId, status, data);
            }
        });

        // Risk management checks
        if (status === 'filled') {
            this.updateRiskMetrics(data);
        }
    }

    registerWidget(widgetId, widget) {
        this.widgets.set(widgetId, widget);

        // Give widget access to global state
        widget.globalState = this.globalState;

        // Subscribe widget to relevant events
        widget.element.addEventListener('tradingAction', (event) => {
            // Add widget context to event
            event.detail.sourceWidget = widgetId;
        }, true);
    }

    checkPriceAlerts(symbol, price) {
        const alerts = this.globalState.alerts || [];
        const triggeredAlerts = alerts.filter(alert =>
            alert.symbol === symbol && this.shouldTriggerAlert(alert, price)
        );

        triggeredAlerts.forEach(alert => {
            this.triggerAlert(alert);
        });
    }

    shouldTriggerAlert(alert, currentPrice) {
        switch (alert.condition) {
            case 'above':
                return currentPrice > alert.price;
            case 'below':
                return currentPrice < alert.price;
            case 'change':
                const prevPrice = this.globalState.prices[alert.symbol]?.price;
                return prevPrice && Math.abs(currentPrice - prevPrice) > alert.threshold;
            default:
                return false;
        }
    }
}
```


**Pattern 3: Event Preprocessing và Normalization**


```javascript
class EventNormalizer {
    constructor() {
        this.setupNormalization();
    }

    setupNormalization() {
        // Normalize touch và mouse events
        document.addEventListener('touchstart', this.normalizeTouchToMouse, true);
        document.addEventListener('touchmove', this.normalizeTouchToMouse, true);
        document.addEventListener('touchend', this.normalizeTouchToMouse, true);

        // Normalize keyboard events across browsers
        document.addEventListener('keydown', this.normalizeKeyboardEvent, true);

        // Normalize wheel events
        document.addEventListener('wheel', this.normalizeWheelEvent, true);
    }

    normalizeTouchToMouse(event) {
        const touch = event.changedTouches[0];
        if (!touch) return;

        const mouseEventType = {
            'touchstart': 'mousedown',
            'touchmove': 'mousemove',
            'touchend': 'mouseup'
        }[event.type];

        const normalizedEvent = new MouseEvent(mouseEventType, {
            clientX: touch.clientX,
            clientY: touch.clientY,
            bubbles: true,
            cancelable: true
        });

        // Add custom properties
        normalizedEvent.originalEvent = event;
        normalizedEvent.isNormalized = true;
        normalizedEvent.inputType = 'touch';

        // Dispatch normalized event
        event.target.dispatchEvent(normalizedEvent);
    }

    normalizeKeyboardEvent(event) {
        // Normalize key codes across browsers
        const normalizedKey = this.normalizeKey(event.key);
        if (normalizedKey !== event.key) {
            const normalizedEvent = new KeyboardEvent('keydown', {
                key: normalizedKey,
                code: event.code,
                ctrlKey: event.ctrlKey,
                shiftKey: event.shiftKey,
                altKey: event.altKey,
                metaKey: event.metaKey,
                bubbles: true,
                cancelable: true
            });

            normalizedEvent.originalEvent = event;
            normalizedEvent.isNormalized = true;

            event.target.dispatchEvent(normalizedEvent);
        }
    }

    normalizeKey(key) {
        const keyMap = {
            'Esc': 'Escape',
            'Del': 'Delete',
            'Ins': 'Insert',
            'Left': 'ArrowLeft',
            'Right': 'ArrowRight',
            'Up': 'ArrowUp',
            'Down': 'ArrowDown'
        };

        return keyMap[key] || key;
    }

    normalizeWheelEvent(event) {
        // Normalize wheel delta across browsers
        let deltaX = event.deltaX;
        let deltaY = event.deltaY;

        // Firefox uses different wheel event properties
        if (event.mozInputSource !== undefined) {
            deltaX *= 40;
            deltaY *= 40;
        }

        // Safari has different scaling
        if (navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome')) {
            deltaX *= 0.4;
            deltaY *= 0.4;
        }

        if (deltaX !== event.deltaX || deltaY !== event.deltaY) {
            const normalizedEvent = new WheelEvent('wheel', {
                deltaX,
                deltaY,
                deltaMode: event.deltaMode,
                bubbles: true,
                cancelable: true
            });

            normalizedEvent.originalEvent = event;
            normalizedEvent.isNormalized = true;

            event.preventDefault();
            event.target.dispatchEvent(normalizedEvent);
        }
    }
}
```


---


## 📗 PART III: PRINCIPAL LEVEL - ENTERPRISE ARCHITECTURE & ADVANCED PATTERNS


### 🔬 Chapter 5: Event System Architecture - Enterprise-Scale Design


#### 🌱 System Design Philosophy


💭 **Principal's Strategic Thinking**: Event system architecture isn't just about individual events - it's about designing communication infrastructure cho entire application ecosystem. Tại scale của NAB (9M users), Binance (100M+ trades/day), hay Figma (millions of concurrent designs), event system becomes distributed computing problem.


**Core Architectural Principles:**


1. **Separation of Concerns**: Events carry data, handlers implement business logic
2. **Loose Coupling**: Components communicate through events, not direct references
3. **Scalability**: System handles increasing event volume gracefully
4. **Reliability**: Events are delivered consistently, failures are handled gracefully
5. **Observability**: Event flow is traceable và debuggable
6. **Performance**: Event processing doesn't block critical user interactions


#### 🔬 Enterprise Event Architecture Patterns


**Pattern 1: Hierarchical Event Domains**


```javascript
// Enterprise-scale event domain architecture
class EventDomain {
    constructor(name, parent = null) {
        this.name = name;
        this.parent = parent;
        this.children = new Set();
        this.eventBus = new EventBus();
        this.middlewares = [];
        this.policies = new Map();

        if (parent) {
            parent.addChild(this);
        }
    }

    addChild(domain) {
        this.children.add(domain);

        // Setup event forwarding between domains
        domain.eventBus.on('*', (event) => {
            if (this.shouldForwardEvent(event)) {
                this.eventBus.emit(event.type, event.data, {
                    ...event.options,
                    source: `${domain.name}.${event.source}`
                });
            }
        });
    }

    shouldForwardEvent(event) {
        const policy = this.policies.get(event.type) || this.policies.get('*');
        if (!policy) return false;

        return policy.forward && (!policy.condition || policy.condition(event));
    }

    setEventPolicy(eventType, policy) {
        this.policies.set(eventType, policy);
    }

    emit(eventType, data, options = {}) {
        return this.eventBus.emit(eventType, data, {
            ...options,
            domain: this.name
        });
    }

    on(eventType, handler, options = {}) {
        return this.eventBus.on(eventType, handler, options);
    }
}

// Application-level architecture
class ApplicationEventArchitecture {
    constructor() {
        this.domains = new Map();
        this.setupDomainHierarchy();
        this.setupCrossDomainPolicies();
    }

    setupDomainHierarchy() {
        // Root domain
        const app = new EventDomain('app');

        // Core domains
        const ui = new EventDomain('ui', app);
        const data = new EventDomain('data', app);
        const auth = new EventDomain('auth', app);
        const analytics = new EventDomain('analytics', app);

        // UI subdomains
        const components = new EventDomain('components', ui);
        const routing = new EventDomain('routing', ui);
        const state = new EventDomain('state', ui);

        // Data subdomains
        const api = new EventDomain('api', data);
        const cache = new EventDomain('cache', data);
        const persistence = new EventDomain('persistence', data);

        this.domains.set('app', app);
        this.domains.set('ui', ui);
        this.domains.set('data', data);
        this.domains.set('auth', auth);
        this.domains.set('analytics', analytics);
        this.domains.set('components', components);
        this.domains.set('routing', routing);
        this.domains.set('state', state);
        this.domains.set('api', api);
        this.domains.set('cache', cache);
        this.domains.set('persistence', persistence);
    }

    setupCrossDomainPolicies() {
        // Authentication events flow to all domains
        this.domains.get('auth').setEventPolicy('*', {
            forward: true,
            condition: (event) => event.type.startsWith('auth.')
        });

        // Analytics captures all user interactions
        this.domains.get('analytics').setEventPolicy('*', {
            forward: false, // Don't forward analytics events
            condition: (event) => event.type.includes('user.')
        });

        // Data domain forwards errors to UI
        this.domains.get('data').setEventPolicy('error', {
            forward: true,
            condition: (event) => event.severity >= 'warning'
        });
    }

    getDomain(name) {
        return this.domains.get(name);
    }

    setupGlobalMiddleware() {
        // Add logging middleware to all domains
        for (const domain of this.domains.values()) {
            domain.eventBus.use(this.createLoggingMiddleware(domain.name));
            domain.eventBus.use(this.createValidationMiddleware());
            domain.eventBus.use(this.createSecurityMiddleware());
        }
    }

    createLoggingMiddleware(domainName) {
        return (event) => {
            console.log(`[${domainName}] ${event.type}:`, event.data);

            // Send to external logging service
            if (this.shouldLogExternally(event)) {
                this.sendToLoggingService(domainName, event);
            }
        };
    }

    createValidationMiddleware() {
        return (event) => {
            const schema = this.getEventSchema(event.type);
            if (schema && !this.validateEvent(event, schema)) {
                console.error('Event validation failed:', event);
                event._cancelled = true;
            }
        };
    }

    createSecurityMiddleware() {
        return (event) => {
            if (this.isSecuritySensitive(event)) {
                if (!this.validateEventSecurity(event)) {
                    console.warn('Security validation failed for event:', event.type);
                    event._cancelled = true;
                }
            }
        };
    }
}
```


**Pattern 2: Event Sourcing Architecture**


💭 **Banking System Story**: Tại NAB, financial transactions require complete audit trail. Traditional CRUD operations làm mất transaction history. Event sourcing cho phép chúng tôi replay toàn bộ account history từ event stream.


```javascript
// Event sourcing implementation for financial systems
class EventStore {
    constructor() {
        this.events = [];
        this.snapshots = new Map();
        this.subscriptions = new Map();
        this.version = 0;
    }

    append(aggregateId, events, expectedVersion) {
        // Optimistic concurrency control
        const currentVersion = this.getVersion(aggregateId);
        if (expectedVersion !== currentVersion) {
            throw new Error('Concurrency conflict');
        }

        // Validate events
        for (const event of events) {
            this.validateEvent(event);
        }

        // Append events with metadata
        const eventsWithMetadata = events.map(event => ({
            ...event,
            aggregateId,
            eventId: this.generateEventId(),
            version: ++this.version,
            timestamp: new Date(),
            causationId: event.causationId || null,
            correlationId: event.correlationId || null
        }));

        this.events.push(...eventsWithMetadata);

        // Notify subscribers
        this.notifySubscribers(aggregateId, eventsWithMetadata);

        return this.version;
    }

    getEvents(aggregateId, fromVersion = 0) {
        return this.events.filter(event =>
            event.aggregateId === aggregateId &&
            event.version > fromVersion
        );
    }

    getVersion(aggregateId) {
        const events = this.events.filter(e => e.aggregateId === aggregateId);
        return events.length > 0 ? events[events.length - 1].version : 0;
    }

    createSnapshot(aggregateId, state, version) {
        this.snapshots.set(aggregateId, {
            state,
            version,
            timestamp: new Date()
        });
    }

    getSnapshot(aggregateId) {
        return this.snapshots.get(aggregateId);
    }

    subscribe(aggregateId, handler) {
        if (!this.subscriptions.has(aggregateId)) {
            this.subscriptions.set(aggregateId, []);
        }
        this.subscriptions.get(aggregateId).push(handler);

        return () => {
            const handlers = this.subscriptions.get(aggregateId);
            const index = handlers.indexOf(handler);
            if (index > -1) handlers.splice(index, 1);
        };
    }

    notifySubscribers(aggregateId, events) {
        const handlers = this.subscriptions.get(aggregateId) || [];
        for (const handler of handlers) {
            try {
                handler(events);
            } catch (error) {
                console.error('Subscription handler error:', error);
            }
        }
    }

    validateEvent(event) {
        if (!event.type) throw new Error('Event must have type');
        if (!event.data) throw new Error('Event must have data');
        if (typeof event.data !== 'object') throw new Error('Event data must be object');
    }

    generateEventId() {
        return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

// Aggregate base class for event sourcing
class AggregateRoot {
    constructor(id) {
        this.id = id;
        this.version = 0;
        this.uncommittedEvents = [];
    }

    applyEvent(event, isReplay = false) {
        // Apply event to aggregate state
        const handler = this[`apply${event.type}`];
        if (handler) {
            handler.call(this, event.data);
        }

        if (!isReplay) {
            this.uncommittedEvents.push(event);
        }

        this.version++;
    }

    getUncommittedEvents() {
        return [...this.uncommittedEvents];
    }

    markEventsAsCommitted() {
        this.uncommittedEvents = [];
    }

    loadFromHistory(events) {
        for (const event of events) {
            this.applyEvent(event, true);
        }
    }

    static fromHistory(id, events) {
        const aggregate = new this(id);
        aggregate.loadFromHistory(events);
        return aggregate;
    }
}

// Example: Banking account aggregate
class BankAccount extends AggregateRoot {
    constructor(id) {
        super(id);
        this.balance = 0;
        this.isActive = true;
        this.transactions = [];
    }

    // Commands (business logic)
    deposit(amount, metadata = {}) {
        if (!this.isActive) {
            throw new Error('Account is not active');
        }
        if (amount <= 0) {
            throw new Error('Deposit amount must be positive');
        }

        this.applyEvent({
            type: 'MoneyDeposited',
            data: {
                amount,
                metadata,
                transactionId: this.generateTransactionId()
            }
        });
    }

    withdraw(amount, metadata = {}) {
        if (!this.isActive) {
            throw new Error('Account is not active');
        }
        if (amount <= 0) {
            throw new Error('Withdrawal amount must be positive');
        }
        if (this.balance < amount) {
            throw new Error('Insufficient funds');
        }

        this.applyEvent({
            type: 'MoneyWithdrawn',
            data: {
                amount,
                metadata,
                transactionId: this.generateTransactionId()
            }
        });
    }

    closeAccount() {
        if (!this.isActive) {
            throw new Error('Account already closed');
        }

        this.applyEvent({
            type: 'AccountClosed',
            data: {
                finalBalance: this.balance,
                closedAt: new Date()
            }
        });
    }

    // Event handlers (state changes)
    applyMoneyDeposited(data) {
        this.balance += data.amount;
        this.transactions.push({
            type: 'deposit',
            amount: data.amount,
            transactionId: data.transactionId,
            timestamp: new Date()
        });
    }

    applyMoneyWithdrawn(data) {
        this.balance -= data.amount;
        this.transactions.push({
            type: 'withdrawal',
            amount: data.amount,
            transactionId: data.transactionId,
            timestamp: new Date()
        });
    }

    applyAccountClosed(data) {
        this.isActive = false;
    }

    generateTransactionId() {
        return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

// Repository for event-sourced aggregates
class EventSourcedRepository {
    constructor(eventStore) {
        this.eventStore = eventStore;
    }

    async load(aggregateClass, id) {
        // Try to load from snapshot first
        const snapshot = this.eventStore.getSnapshot(id);
        let fromVersion = 0;
        let aggregate;

        if (snapshot) {
            aggregate = Object.assign(new aggregateClass(id), snapshot.state);
            fromVersion = snapshot.version;
        } else {
            aggregate = new aggregateClass(id);
        }

        // Load events since snapshot
        const events = this.eventStore.getEvents(id, fromVersion);
        aggregate.loadFromHistory(events);

        return aggregate;
    }

    async save(aggregate) {
        const uncommittedEvents = aggregate.getUncommittedEvents();
        if (uncommittedEvents.length === 0) return;

        try {
            const newVersion = this.eventStore.append(
                aggregate.id,
                uncommittedEvents,
                aggregate.version - uncommittedEvents.length
            );

            aggregate.markEventsAsCommitted();

            // Create snapshot periodically
            if (newVersion % 100 === 0) {
                this.eventStore.createSnapshot(aggregate.id, aggregate, newVersion);
            }

        } catch (error) {
            // Handle concurrency conflicts
            if (error.message === 'Concurrency conflict') {
                throw new Error('Aggregate was modified by another process');
            }
            throw error;
        }
    }
}
```


#### 🏭 Production-Grade Event Infrastructure


**Monitoring & Observability System:**


```javascript
class EventObservabilitySystem {
    constructor() {
        this.metrics = new Map();
        this.traces = [];
        this.alerts = [];
        this.dashboards = new Map();

        this.setupMetricCollection();
        this.setupTracing();
        this.setupAlerting();
    }

    setupMetricCollection() {
        // Event throughput metrics
        this.registerMetric('events.throughput', {
            type: 'counter',
            labels: ['event_type', 'domain', 'status']
        });

        // Event processing latency
        this.registerMetric('events.latency', {
            type: 'histogram',
            labels: ['event_type', 'handler'],
            buckets: [1, 5, 10, 25, 50, 100, 250, 500, 1000]
        });

        // Event queue depth
        this.registerMetric('events.queue_depth', {
            type: 'gauge',
            labels: ['queue_name']
        });

        // Memory usage
        this.registerMetric('events.memory_usage', {
            type: 'gauge',
            labels: ['component']
        });
    }

    setupTracing() {
        // Distributed tracing for event flows
        this.originalDispatchEvent = EventTarget.prototype.dispatchEvent;

        EventTarget.prototype.dispatchEvent = function(event) {
            const traceId = event.traceId || this.generateTraceId();
            const spanId = this.generateSpanId();

            // Create trace span
            const span = {
                traceId,
                spanId,
                parentSpanId: event.parentSpanId,
                operationName: `event.${event.type}`,
                startTime: performance.now(),
                tags: {
                    'event.type': event.type,
                    'event.target': event.target?.tagName || 'unknown',
                    'event.bubbles': event.bubbles
                }
            };

            // Propagate
```


## Claude


```javascript
// Propagate trace context
           event.traceId = traceId;
           event.parentSpanId = spanId;

           try {
               const result = this.originalDispatchEvent.call(this, event);
               span.tags['event.result'] = result;
               return result;
           } catch (error) {
               span.tags['error'] = true;
               span.tags['error.message'] = error.message;
               throw error;
           } finally {
               span.endTime = performance.now();
               span.duration = span.endTime - span.startTime;
               this.recordTrace(span);
           }
       }.bind(this);
   }

   setupAlerting() {
       // High latency alert
       this.addAlert({
           name: 'high_event_latency',
           condition: (metrics) => {
               const latency = metrics.get('events.latency');
               return latency && latency.p95 > 100; // 100ms
           },
           action: this.sendAlert.bind(this),
           cooldown: 300000 // 5 minutes
       });

       // Memory leak alert
       this.addAlert({
           name: 'memory_leak',
           condition: (metrics) => {
               const memory = metrics.get('events.memory_usage');
               return memory && memory.value > 100 * 1024 * 1024; // 100MB
           },
           action: this.sendAlert.bind(this),
           cooldown: 600000 // 10 minutes
       });

       // Queue backup alert
       this.addAlert({
           name: 'queue_backup',
           condition: (metrics) => {
               const queueDepth = metrics.get('events.queue_depth');
               return queueDepth && queueDepth.value > 1000;
           },
           action: this.sendAlert.bind(this),
           cooldown: 60000 // 1 minute
       });
   }

   recordEvent(eventType, domain, status, latency) {
       this.incrementMetric('events.throughput', 1, {
           event_type: eventType,
           domain,
           status
       });

       if (latency !== undefined) {
           this.recordMetric('events.latency', latency, {
               event_type: eventType
           });
       }
   }

   recordTrace(span) {
       this.traces.push(span);

       // Keep only recent traces
       if (this.traces.length > 10000) {
           this.traces.splice(0, 1000);
       }

       // Index by trace ID for quick lookup
       if (!this.traceIndex) this.traceIndex = new Map();
       if (!this.traceIndex.has(span.traceId)) {
           this.traceIndex.set(span.traceId, []);
       }
       this.traceIndex.get(span.traceId).push(span);
   }

   getTraceById(traceId) {
       return this.traceIndex.get(traceId) || [];
   }

   getEventFlowVisualization(traceId) {
       const spans = this.getTraceById(traceId);
       const flow = this.buildEventFlow(spans);
       return this.generateFlowDiagram(flow);
   }

   buildEventFlow(spans) {
       const flow = { nodes: [], edges: [] };
       const nodeMap = new Map();

       // Create nodes for each span
       spans.forEach(span => {
           const nodeId = span.spanId;
           nodeMap.set(nodeId, span);

           flow.nodes.push({
               id: nodeId,
               label: span.operationName,
               duration: span.duration,
               tags: span.tags
           });
       });

       // Create edges for parent-child relationships
       spans.forEach(span => {
           if (span.parentSpanId && nodeMap.has(span.parentSpanId)) {
               flow.edges.push({
                   source: span.parentSpanId,
                   target: span.spanId,
                   type: 'parent-child'
               });
           }
       });

       return flow;
   }

   generateHealthReport() {
       const now = Date.now();
       const last24h = now - (24 * 60 * 60 * 1000);

       const recentEvents = this.traces.filter(trace =>
           trace.startTime > last24h
       );

       const eventsByType = new Map();
       const errorCount = recentEvents.filter(trace =>
           trace.tags.error
       ).length;

       recentEvents.forEach(trace => {
           const type = trace.tags['event.type'];
           eventsByType.set(type, (eventsByType.get(type) || 0) + 1);
       });

       return {
           summary: {
               totalEvents: recentEvents.length,
               errorRate: errorCount / recentEvents.length,
               avgLatency: this.calculateAverageLatency(recentEvents),
               memoryUsage: this.getCurrentMemoryUsage()
           },
           topEventTypes: Array.from(eventsByType.entries())
               .sort((a, b) => b[1] - a[1])
               .slice(0, 10),
           errors: this.getRecentErrors(last24h),
           recommendations: this.generateRecommendations(recentEvents)
       };
   }

   generateRecommendations(recentEvents) {
       const recommendations = [];

       // High frequency events
       const eventCounts = new Map();
       recentEvents.forEach(event => {
           const type = event.tags['event.type'];
           eventCounts.set(type, (eventCounts.get(type) || 0) + 1);
       });

       const highFrequencyEvents = Array.from(eventCounts.entries())
           .filter(([type, count]) => count > 1000)
           .map(([type, count]) => ({ type, count }));

       if (highFrequencyEvents.length > 0) {
           recommendations.push({
               type: 'performance',
               priority: 'high',
               message: 'Consider debouncing high-frequency events',
               details: highFrequencyEvents
           });
       }

       // Long-running handlers
       const slowEvents = recentEvents.filter(event => event.duration > 50);
       if (slowEvents.length > 10) {
           recommendations.push({
               type: 'performance',
               priority: 'medium',
               message: 'Optimize slow event handlers',
               details: slowEvents.slice(0, 5)
           });
       }

       // Memory usage trends
       const memoryTrend = this.analyzeMemoryTrend();
       if (memoryTrend.isIncreasing) {
           recommendations.push({
               type: 'memory',
               priority: 'high',
               message: 'Memory usage is trending upward, potential leak detected',
               details: memoryTrend
           });
       }

       return recommendations;
   }
}
```


### 🔬 Chapter 6: Advanced Event Patterns cho Production Systems


#### 🌱 Event Orchestration & Choreography


💭 **Microservices Architecture Story**: Tại Binance, trading system có 200+ microservices. Khi user places order, chúng tôi cần coordinate: risk management, wallet service, matching engine, notification service, audit service. Initial design dùng orchestration (central coordinator) nhưng nó became bottleneck. Event choreography saved performance.


**Pattern 1: Event Choreography vs Orchestration**


```javascript
// Orchestration Pattern (Centralized Control)
class OrderOrchestrator {
    constructor() {
        this.services = {
            riskService: new RiskManagementService(),
            walletService: new WalletService(),
            matchingEngine: new MatchingEngine(),
            notificationService: new NotificationService(),
            auditService: new AuditService()
        };
    }

    async processOrder(order) {
        try {
            // Sequential processing with central control
            const riskResult = await this.services.riskService.validateOrder(order);
            if (!riskResult.approved) {
                throw new Error('Risk validation failed');
            }

            const walletResult = await this.services.walletService.reserveFunds(order);
            if (!walletResult.success) {
                throw new Error('Insufficient funds');
            }

            const matchResult = await this.services.matchingEngine.submitOrder(order);

            // Notify and audit in parallel
            await Promise.all([
                this.services.notificationService.notifyOrderStatus(order, matchResult),
                this.services.auditService.logOrderProcessing(order, matchResult)
            ]);

            return matchResult;

        } catch (error) {
            // Compensation logic (rollback)
            await this.compensateFailedOrder(order, error);
            throw error;
        }
    }

    async compensateFailedOrder(order, error) {
        // Manual rollback của tất cả services
        try {
            await this.services.walletService.releaseFunds(order);
            await this.services.auditService.logOrderFailure(order, error);
        } catch (compensationError) {
            console.error('Compensation failed:', compensationError);
        }
    }
}

// Choreography Pattern (Distributed Coordination)
class EventChoreography {
    constructor() {
        this.eventBus = new EventBus();
        this.sagaManager = new SagaManager();
        this.setupEventHandlers();
    }

    setupEventHandlers() {
        // Each service handles its own part và publishes next event
        this.eventBus.on('order.submitted', this.handleOrderSubmitted.bind(this));
        this.eventBus.on('risk.validated', this.handleRiskValidated.bind(this));
        this.eventBus.on('funds.reserved', this.handleFundsReserved.bind(this));
        this.eventBus.on('order.matched', this.handleOrderMatched.bind(this));
        this.eventBus.on('*.failed', this.handleFailure.bind(this));
    }

    async processOrder(order) {
        // Start the choreography
        const sagaId = this.sagaManager.startSaga('order-processing', order);

        this.eventBus.emit('order.submitted', {
            order,
            sagaId,
            timestamp: Date.now()
        });

        return sagaId; // Return immediately, processing happens asynchronously
    }

    async handleOrderSubmitted(event) {
        const { order, sagaId } = event.data;

        try {
            const riskResult = await this.riskService.validateOrder(order);

            if (riskResult.approved) {
                this.eventBus.emit('risk.validated', {
                    order,
                    sagaId,
                    riskResult,
                    timestamp: Date.now()
                });
            } else {
                this.eventBus.emit('risk.failed', {
                    order,
                    sagaId,
                    reason: riskResult.reason,
                    timestamp: Date.now()
                });
            }
        } catch (error) {
            this.eventBus.emit('risk.failed', {
                order,
                sagaId,
                error: error.message,
                timestamp: Date.now()
            });
        }
    }

    async handleRiskValidated(event) {
        const { order, sagaId } = event.data;

        try {
            const walletResult = await this.walletService.reserveFunds(order);

            if (walletResult.success) {
                this.eventBus.emit('funds.reserved', {
                    order,
                    sagaId,
                    reservationId: walletResult.reservationId,
                    timestamp: Date.now()
                });
            } else {
                this.eventBus.emit('funds.failed', {
                    order,
                    sagaId,
                    reason: walletResult.reason,
                    timestamp: Date.now()
                });
            }
        } catch (error) {
            this.eventBus.emit('funds.failed', {
                order,
                sagaId,
                error: error.message,
                timestamp: Date.now()
            });
        }
    }

    async handleFundsReserved(event) {
        const { order, sagaId, reservationId } = event.data;

        try {
            const matchResult = await this.matchingEngine.submitOrder(order);

            this.eventBus.emit('order.matched', {
                order,
                sagaId,
                matchResult,
                reservationId,
                timestamp: Date.now()
            });

            // Parallel notifications (fire and forget)
            this.eventBus.emit('notification.send', { order, matchResult });
            this.eventBus.emit('audit.log', { order, matchResult });

        } catch (error) {
            this.eventBus.emit('matching.failed', {
                order,
                sagaId,
                reservationId,
                error: error.message,
                timestamp: Date.now()
            });
        }
    }

    async handleFailure(event) {
        const { sagaId, order } = event.data;

        // Start compensation workflow
        this.sagaManager.compensate(sagaId, event);
    }
}

// Saga Pattern for managing distributed transactions
class SagaManager {
    constructor() {
        this.activeSagas = new Map();
        this.sagaDefinitions = new Map();
        this.compensationHandlers = new Map();

        this.setupSagaDefinitions();
    }

    setupSagaDefinitions() {
        this.defineSaga('order-processing', {
            steps: [
                { name: 'validate-risk', compensate: 'cancel-risk-validation' },
                { name: 'reserve-funds', compensate: 'release-funds' },
                { name: 'match-order', compensate: 'cancel-order' },
                { name: 'notify-user', compensate: 'send-failure-notification' }
            ]
        });
    }

    defineSaga(name, definition) {
        this.sagaDefinitions.set(name, definition);
    }

    startSaga(sagaType, data) {
        const sagaId = this.generateSagaId();
        const saga = {
            id: sagaId,
            type: sagaType,
            data,
            currentStep: 0,
            completedSteps: [],
            status: 'active',
            startTime: Date.now()
        };

        this.activeSagas.set(sagaId, saga);
        return sagaId;
    }

    async compensate(sagaId, failureEvent) {
        const saga = this.activeSagas.get(sagaId);
        if (!saga) return;

        saga.status = 'compensating';
        saga.failureReason = failureEvent;

        const definition = this.sagaDefinitions.get(saga.type);
        const completedSteps = [...saga.completedSteps].reverse();

        // Execute compensation actions in reverse order
        for (const step of completedSteps) {
            try {
                await this.executeCompensation(step, saga.data);
            } catch (error) {
                console.error(`Compensation failed for step ${step}:`, error);
                // Continue with other compensations
            }
        }

        saga.status = 'compensated';
        saga.endTime = Date.now();
    }

    async executeCompensation(step, sagaData) {
        const handler = this.compensationHandlers.get(step);
        if (handler) {
            await handler(sagaData);
        }
    }

    registerCompensationHandler(step, handler) {
        this.compensationHandlers.set(step, handler);
    }

    generateSagaId() {
        return `saga_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
```


**Pattern 2: Event Sourcing với CQRS (Command Query Responsibility Segregation)**


💭 **Banking System Evolution**: Tại NAB, initial banking system có single database cho both reads và writes. Query performance degraded khi transaction volume tăng. CQRS với event sourcing cho phép optimize read và write models separately.


```javascript
// Command Side - Write Model
class CommandHandler {
    constructor(eventStore, repository) {
        this.eventStore = eventStore;
        this.repository = repository;
        this.commandHandlers = new Map();

        this.registerCommandHandlers();
    }

    registerCommandHandlers() {
        this.commandHandlers.set('CreateAccount', this.handleCreateAccount.bind(this));
        this.commandHandlers.set('DepositMoney', this.handleDepositMoney.bind(this));
        this.commandHandlers.set('WithdrawMoney', this.handleWithdrawMoney.bind(this));
        this.commandHandlers.set('TransferMoney', this.handleTransferMoney.bind(this));
    }

    async handle(command) {
        const handler = this.commandHandlers.get(command.type);
        if (!handler) {
            throw new Error(`No handler for command: ${command.type}`);
        }

        // Add command metadata
        command.id = this.generateCommandId();
        command.timestamp = new Date();
        command.userId = command.userId || 'system';

        return await handler(command);
    }

    async handleCreateAccount(command) {
        const { accountId, customerId, initialDeposit } = command.data;

        // Validate command
        await this.validateCreateAccount(command);

        // Create new aggregate
        const account = new BankAccount(accountId);
        account.create(customerId, initialDeposit);

        // Save events
        await this.repository.save(account);

        return { accountId, status: 'created' };
    }

    async handleDepositMoney(command) {
        const { accountId, amount } = command.data;

        // Load existing aggregate
        const account = await this.repository.load(BankAccount, accountId);

        // Execute business logic
        account.deposit(amount, {
            commandId: command.id,
            source: command.source || 'manual'
        });

        // Save events
        await this.repository.save(account);

        return { accountId, newBalance: account.balance };
    }

    async handleWithdrawMoney(command) {
        const { accountId, amount } = command.data;

        const account = await this.repository.load(BankAccount, accountId);
        account.withdraw(amount, {
            commandId: command.id,
            source: command.source || 'manual'
        });

        await this.repository.save(account);

        return { accountId, newBalance: account.balance };
    }

    async handleTransferMoney(command) {
        const { fromAccountId, toAccountId, amount } = command.data;

        // Load both accounts
        const [fromAccount, toAccount] = await Promise.all([
            this.repository.load(BankAccount, fromAccountId),
            this.repository.load(BankAccount, toAccountId)
        ]);

        // Execute transfer (requires coordination)
        const transferId = this.generateTransferId();

        fromAccount.withdraw(amount, {
            commandId: command.id,
            transferId,
            transferType: 'outgoing'
        });

        toAccount.deposit(amount, {
            commandId: command.id,
            transferId,
            transferType: 'incoming'
        });

        // Save both accounts
        await Promise.all([
            this.repository.save(fromAccount),
            this.repository.save(toAccount)
        ]);

        return { transferId, status: 'completed' };
    }

    generateCommandId() {
        return `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    generateTransferId() {
        return `xfer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

// Query Side - Read Model
class QueryHandler {
    constructor() {
        this.readModels = new Map();
        this.projections = new Map();
        this.viewBuilders = new Map();

        this.setupProjections();
    }

    setupProjections() {
        // Account summary projection
        this.registerProjection('AccountSummary', {
            events: ['AccountCreated', 'MoneyDeposited', 'MoneyWithdrawn'],
            handler: this.buildAccountSummary.bind(this)
        });

        // Transaction history projection
        this.registerProjection('TransactionHistory', {
            events: ['MoneyDeposited', 'MoneyWithdrawn'],
            handler: this.buildTransactionHistory.bind(this)
        });

        // Daily balance projection
        this.registerProjection('DailyBalances', {
            events: ['MoneyDeposited', 'MoneyWithdrawn'],
            handler: this.buildDailyBalances.bind(this)
        });

        // Customer analytics projection
        this.registerProjection('CustomerAnalytics', {
            events: ['AccountCreated', 'MoneyDeposited', 'MoneyWithdrawn'],
            handler: this.buildCustomerAnalytics.bind(this)
        });
    }

    registerProjection(name, config) {
        this.projections.set(name, config);
    }

    async handleEvent(event) {
        // Update all relevant projections
        for (const [projectionName, config] of this.projections) {
            if (config.events.includes(event.type)) {
                try {
                    await config.handler(event);
                } catch (error) {
                    console.error(`Projection ${projectionName} failed:`, error);
                    // Continue with other projections
                }
            }
        }
    }

    async buildAccountSummary(event) {
        const accountId = event.aggregateId;
        let summary = this.readModels.get(`account_summary_${accountId}`) || {
            accountId,
            balance: 0,
            totalDeposits: 0,
            totalWithdrawals: 0,
            transactionCount: 0,
            lastActivity: null,
            status: 'active'
        };

        switch (event.type) {
            case 'AccountCreated':
                summary.customerId = event.data.customerId;
                summary.createdAt = event.timestamp;
                summary.balance = event.data.initialDeposit || 0;
                if (event.data.initialDeposit > 0) {
                    summary.totalDeposits = event.data.initialDeposit;
                    summary.transactionCount = 1;
                }
                break;

            case 'MoneyDeposited':
                summary.balance += event.data.amount;
                summary.totalDeposits += event.data.amount;
                summary.transactionCount++;
                summary.lastActivity = event.timestamp;
                break;

            case 'MoneyWithdrawn':
                summary.balance -= event.data.amount;
                summary.totalWithdrawals += event.data.amount;
                summary.transactionCount++;
                summary.lastActivity = event.timestamp;
                break;
        }

        this.readModels.set(`account_summary_${accountId}`, summary);
    }

    async buildTransactionHistory(event) {
        const accountId = event.aggregateId;
        const historyKey = `transaction_history_${accountId}`;
        let history = this.readModels.get(historyKey) || [];

        if (event.type === 'MoneyDeposited' || event.type === 'MoneyWithdrawn') {
            const transaction = {
                id: event.data.transactionId,
                type: event.type === 'MoneyDeposited' ? 'deposit' : 'withdrawal',
                amount: event.data.amount,
                timestamp: event.timestamp,
                metadata: event.data.metadata || {},
                balance: this.calculateBalanceAfterTransaction(accountId, event)
            };

            history.push(transaction);

            // Keep only last 1000 transactions per account
            if (history.length > 1000) {
                history = history.slice(-1000);
            }

            this.readModels.set(historyKey, history);
        }
    }

    async buildDailyBalances(event) {
        const accountId = event.aggregateId;
        const date = new Date(event.timestamp).toISOString().split('T')[0];
        const balanceKey = `daily_balance_${accountId}_${date}`;

        let dailyBalance = this.readModels.get(balanceKey) || {
            accountId,
            date,
            startBalance: 0,
            endBalance: 0,
            totalDeposits: 0,
            totalWithdrawals: 0,
            transactionCount: 0
        };

        if (event.type === 'MoneyDeposited') {
            dailyBalance.totalDeposits += event.data.amount;
            dailyBalance.endBalance += event.data.amount;
            dailyBalance.transactionCount++;
        } else if (event.type === 'MoneyWithdrawn') {
            dailyBalance.totalWithdrawals += event.data.amount;
            dailyBalance.endBalance -= event.data.amount;
            dailyBalance.transactionCount++;
        }

        this.readModels.set(balanceKey, dailyBalance);
    }

    // Query methods
    async getAccountSummary(accountId) {
        return this.readModels.get(`account_summary_${accountId}`);
    }

    async getTransactionHistory(accountId, limit = 100, offset = 0) {
        const history = this.readModels.get(`transaction_history_${accountId}`) || [];
        return history.slice(offset, offset + limit);
    }

    async getDailyBalances(accountId, fromDate, toDate) {
        const balances = [];
        const current = new Date(fromDate);
        const end = new Date(toDate);

        while (current <= end) {
            const dateStr = current.toISOString().split('T')[0];
            const balance = this.readModels.get(`daily_balance_${accountId}_${dateStr}`);
            if (balance) {
                balances.push(balance);
            }
            current.setDate(current.getDate() + 1);
        }

        return balances;
    }

    async getCustomerAnalytics(customerId) {
        // Complex query across multiple accounts
        const analytics = {
            customerId,
            totalAccounts: 0,
            totalBalance: 0,
            totalDeposits: 0,
            totalWithdrawals: 0,
            accountSummaries: []
        };

        // Find all accounts for customer
        for (const [key, value] of this.readModels) {
            if (key.startsWith('account_summary_') && value.customerId === customerId) {
                analytics.totalAccounts++;
                analytics.totalBalance += value.balance;
                analytics.totalDeposits += value.totalDeposits;
                analytics.totalWithdrawals += value.totalWithdrawals;
                analytics.accountSummaries.push(value);
            }
        }

        return analytics;
    }

    calculateBalanceAfterTransaction(accountId, event) {
        const summary = this.readModels.get(`account_summary_${accountId}`);
        return summary ? summary.balance : 0;
    }
}

// Event Store with Projections
class ProjectionManager {
    constructor(eventStore, queryHandler) {
        this.eventStore = eventStore;
        this.queryHandler = queryHandler;
        this.projectionStates = new Map();

        this.startProjectionUpdates();
    }

    startProjectionUpdates() {
        // Subscribe to all events và update projections
        this.eventStore.on('*', async (events) => {
            for (const event of events) {
                await this.queryHandler.handleEvent(event);
                this.updateProjectionState(event);
            }
        });
    }

    updateProjectionState(event) {
        // Track last processed event for each projection
        for (const projectionName of this.queryHandler.projections.keys()) {
            this.projectionStates.set(projectionName, {
                lastEventVersion: event.version,
                lastUpdated: new Date()
            });
        }
    }

    async rebuildProjection(projectionName, fromVersion = 0) {
        console.log(`Rebuilding projection: ${projectionName}`);

        const projection = this.queryHandler.projections.get(projectionName);
        if (!projection) {
            throw new Error(`Projection not found: ${projectionName}`);
        }

        // Clear existing read model data for this projection
        this.clearProjectionData(projectionName);

        // Replay all events
        const allEvents = this.eventStore.getAllEvents(fromVersion);
        for (const event of allEvents) {
            if (projection.events.includes(event.type)) {
                await projection.handler(event);
            }
        }

        console.log(`Projection ${projectionName} rebuilt successfully`);
    }

    clearProjectionData(projectionName) {
        // Remove read model data for specific projection
        // Implementation depends on how data is keyed
        const keysToRemove = [];
        for (const key of this.queryHandler.readModels.keys()) {
            if (this.belongsToProjection(key, projectionName)) {
                keysToRemove.push(key);
            }
        }

        keysToRemove.forEach(key => {
            this.queryHandler.readModels.delete(key);
        });
    }

    belongsToProjection(key, projectionName) {
        // Map keys to projections based on naming convention
        const projectionKeyPrefixes = {
            'AccountSummary': 'account_summary_',
            'TransactionHistory': 'transaction_history_',
            'DailyBalances': 'daily_balance_',
            'CustomerAnalytics': 'customer_analytics_'
        };

        const prefix = projectionKeyPrefixes[projectionName];
        return prefix && key.startsWith(prefix);
    }
}
```


Phần này đã cover comprehensive enterprise-level event system architecture. Chúng ta đã đi từ basic event concepts đến sophisticated patterns như event sourcing, CQRS, saga patterns, và production monitoring.


Trong phần tiếp theo, tôi sẽ dive vào specific production challenges và solutions mà tôi encounter qua career journey tại các companies khác nhau, including performance optimization, debugging techniques, và best practices cho different scales.
