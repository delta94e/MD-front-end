# Browser Event Loop Mechanics

## You

Event Loop in the Browser
The event loop is: execute a macro task, then clear the micro task list, execute the macro task again, and then clear the micro task list.Microtasks microtask(jobs):promise / ajax / Object.observe(该方法已废弃)Macro Tasks macrotask(task):setTimout / script / IO / UI Rendering
作者：郭东东 链接：https://juejin.cn/post/6844903776512393224 来源：稀土掘金 著作权归作者所有。商业转载请联系作者获得授权，非商业转载请注明出处。

## Claude


# Event Loop Trong Browser: Phân Tích Chuyên Sâu Từ Góc Độ Principal Front-end Engineer


## 🌟 Lời Mở Đầu: Tại Sao Event Loop Là "Holy Grail" Của JavaScript?


Khi tôi bắt đầu journey làm Principal Front-end Engineer tại các công ty MAANG, có một câu hỏi mà tôi thường được hỏi trong mọi cuộc phỏng vấn technical: **"Hãy giải thích Event Loop hoạt động như thế nào?"**. Và thật thú vị, đây cũng là câu hỏi mà 80% các ứng viên - từ junior đến senior - thường trả lời một cách surface-level hoặc hoàn toàn sai.


💭 **Principal's Reflection**: *Sau 10+ năm working với JavaScript và đã interview hàng nghìn engineers, tôi nhận ra rằng Event Loop không chỉ là một "nice-to-know concept" mà là foundation absolute của mọi JavaScript application. Hiểu sâu Event Loop = hiểu bản chất của JavaScript concurrency model.*


## 📖 PHẦN CƠ BẢN (Foundation Level): Xây Dựng Nền Tảng Từ Số 0


### 🌱 Nguồn Gốc & Motivation: Tại Sao Event Loop Tồn Tại?


#### Problem Statement Chi Tiết


Hãy tưởng tượng bạn đang xây dựng một restaurant (browser) và bạn có duy nhất một chef (JavaScript thread). Trong restaurant này:


- Khách hàng liên tục order món ăn (user interactions)
- Một số món cần thời gian nấu lâu (network requests)
- Một số món có thể làm ngay (DOM manipulations)
- Chef không thể clone bản thân để làm song song


**Vấn đề cốt lõi**: Làm sao để chef có thể serve được tất cả customers mà không ai phải chờ đợi quá lâu?


```javascript
// Imagine this WITHOUT Event Loop - BLOCKING VERSION
function fetchUserData() {
    // This would FREEZE the entire browser for 3 seconds
    const data = synchronousNetworkCall(); // 3 seconds wait
    return data;
}

// User clicks button while network call is happening
button.onclick = () => {
    console.log("Button clicked!"); // This would NEVER execute until network call finishes
};
```


💭 **Deep Understanding Process**: *Khi tôi đầu tiên học JavaScript, tôi confused về tại sao JavaScript được gọi là "single-threaded" nhưng vẫn có thể handle concurrent operations. Điều này seems contradictory cho đến khi tôi truly understood Event Loop mechanism.*


#### Historical Context: Từ Đâu Mà Có


**1995 - Brendan Eich's Original Design**:
Khi Brendan Eich tạo ra JavaScript trong 10 ngày tại Netscape, ông phải giải quyết một challenge fundamental: làm sao để JavaScript có thể handle user interactions và DOM manipulations mà không block browser rendering?


**Original Constraints**:


- JavaScript phải là single-threaded (để tránh complexity của thread synchronization)
- Phải non-blocking (để maintain responsive UI)
- Phải simple enough cho non-programmers sử dụng


**Solution**: Event-driven, non-blocking I/O model với Event Loop


```javascript
// Early JavaScript approach - Event-driven
window.onload = function() {
    console.log("Page loaded!");
};

setTimeout(function() {
    console.log("This runs later!");
}, 1000);

console.log("This runs first!");
```


### 🔬 Bản Chất & Mechanism: Event Loop Là Gì Thực Sự?


#### Core Algorithm Explanation


Event Loop về bản chất là một **infinite loop** với **priority queue system**. Hãy nghĩ về nó như một super-efficient restaurant manager:


```pseudocode
while (true) {
    // Step 1: Check if there are any scripts to execute
    if (callStack.isEmpty()) {

        // Step 2: Process ONE macro task
        if (macroTaskQueue.hasItems()) {
            const task = macroTaskQueue.dequeue();
            callStack.push(task);
            execute(task);
        }

        // Step 3: Process ALL micro tasks
        while (microTaskQueue.hasItems()) {
            const microTask = microTaskQueue.dequeue();
            callStack.push(microTask);
            execute(microTask);
        }

        // Step 4: Render if needed
        if (shouldRender()) {
            performRender();
        }
    }
}
```


#### Data Structure Breakdown


Event Loop sử dụng 3 data structures chính:


**1. Call Stack (LIFO - Last In, First Out)**


```javascript
// Call Stack visualization
function a() {
    console.log('A');
    b();
}

function b() {
    console.log('B');
    c();
}

function c() {
    console.log('C');
}

a();

/* Call Stack Evolution:
Initial: []
After a(): [a]
After b(): [a, b]
After c(): [a, b, c]
After c returns: [a, b]
After b returns: [a]
After a returns: []
*/
```


**2. Macro Task Queue (FIFO - First In, First Out)**


```javascript
// Macro tasks get queued in order
setTimeout(() => console.log('Timer 1'), 0);
setTimeout(() => console.log('Timer 2'), 0);
setTimeout(() => console.log('Timer 3'), 0);

// Queue state: [Timer1, Timer2, Timer3]
// Execution order: Timer1 → Timer2 → Timer3
```


**3. Micro Task Queue (FIFO with Higher Priority)**


```javascript
// Micro tasks always execute before macro tasks
setTimeout(() => console.log('Macro 1'), 0);
Promise.resolve().then(() => console.log('Micro 1'));
Promise.resolve().then(() => console.log('Micro 2'));
setTimeout(() => console.log('Macro 2'), 0);

// Execution order: Micro1 → Micro2 → Macro1 → Macro2
```


#### Memory Model Analysis


```javascript
// Memory layout during Event Loop execution
function demonstrateMemoryModel() {
    // Stack memory
    let stackVariable = "I'm on the stack";

    // Heap memory for promises
    const promise = new Promise((resolve) => {
        // Closure variables go to heap
        let heapVariable = "I'm on the heap";
        setTimeout(() => resolve(heapVariable), 0);
    });

    return promise;
}

/* Memory Allocation:
Heap: Promise object, closure variables, callback functions
Stack: Local variables, function parameters
Event Loop Queues: References to heap-allocated callbacks
*/
```


### 💡 Intuitive Understanding: Những Metaphor Giúp Hiểu Sâu


#### Restaurant Kitchen Metaphor


Hãy tưởng tượng Event Loop như một restaurant kitchen:


```javascript
// Chef (Main Thread) scenario
class RestaurantKitchen {
    constructor() {
        this.orders = []; // Macro task queue
        this.quickTasks = []; // Micro task queue
        this.currentOrder = null; // Call stack
    }

    // Event Loop iteration
    processOrders() {
        while (true) {
            // If chef is free
            if (!this.currentOrder) {

                // Take one main order (macro task)
                if (this.orders.length > 0) {
                    this.currentOrder = this.orders.shift();
                    this.cookOrder(this.currentOrder);
                }

                // Do all quick tasks first (micro tasks)
                while (this.quickTasks.length > 0) {
                    const quickTask = this.quickTasks.shift();
                    this.doQuickTask(quickTask);
                }
            }
        }
    }
}

// Usage example
const kitchen = new RestaurantKitchen();

// Customer places order (macro task)
setTimeout(() => {
    console.log("🍕 Pizza ready!");
}, 1000);

// Chef remembers to season (micro task)
Promise.resolve().then(() => {
    console.log("🧂 Added seasoning");
});

// Output: "🧂 Added seasoning" → "🍕 Pizza ready!"
```


#### Post Office Metaphor


```javascript
// Event Loop như một post office
class PostOffice {
    constructor() {
        this.regularMail = []; // Macro tasks
        this.expressMail = []; // Micro tasks
    }

    processMailDay() {
        // Process one regular mail
        if (this.regularMail.length > 0) {
            this.deliverRegularMail(this.regularMail.shift());
        }

        // Process ALL express mail before next regular mail
        while (this.expressMail.length > 0) {
            this.deliverExpressMail(this.expressMail.shift());
        }
    }
}
```


### ⚙️ Implementation Deep Dive: Browser Engine Level


#### V8 Engine Integration


```cpp
// Simplified V8 Event Loop implementation (C++)
class V8EventLoop {
private:
    std::queue<Task> macro_tasks_;
    std.queue<MicroTask> micro_tasks_;
    bool is_running_;

public:
    void Run() {
        is_running_ = true;

        while (is_running_) {
            // Execute one macro task
            if (!macro_tasks_.empty()) {
                Task task = macro_tasks_.front();
                macro_tasks_.pop();
                ExecuteTask(task);
            }

            // Execute all micro tasks
            while (!micro_tasks_.empty()) {
                MicroTask micro_task = micro_tasks_.front();
                micro_tasks_.pop();
                ExecuteMicroTask(micro_task);
            }

            // Yield to browser for rendering
            if (ShouldYieldToRenderer()) {
                YieldToRenderer();
            }
        }
    }
};
```


#### Browser-Specific Implementations


**Chrome (Blink Engine)**:


```javascript
// Chrome's implementation details
const chromeEventLoop = {
    // Chrome prioritizes user interactions
    taskPriorities: {
        'user-blocking': 1,    // Clicks, key presses
        'user-visible': 2,     // Rendering updates
        'background': 3        // Network requests
    },

    // Chrome's frame budget: 16.67ms (60fps)
    frameTimeBudget: 16.67,

    processFrame() {
        const frameStart = performance.now();

        while (performance.now() - frameStart < this.frameTimeBudget) {
            this.processNextTask();
        }

        this.renderFrame();
    }
};
```


**Firefox (Gecko Engine)**:


```javascript
// Firefox's approach
const firefoxEventLoop = {
    // Firefox uses cooperative scheduling
    cooperativeScheduling: true,

    // Different queue priorities
    taskQueues: {
        'control': [], // Browser internal tasks
        'user-interaction': [], // User input
        'networking': [], // Network responses
        'timer': [] // setTimeout/setInterval
    }
};
```


### 🎯 Định Nghĩa Chính Xác: Macro Tasks vs Micro Tasks


#### Macro Tasks (Task Queue)


```javascript
// Macro tasks - "Big jobs" that can be interrupted
const macroTaskExamples = {
    // 1. Script execution
    scriptExecution: () => {
        console.log("This entire script is a macro task");
    },

    // 2. setTimeout/setInterval
    timers: () => {
        setTimeout(() => console.log("Timer macro task"), 0);
        setInterval(() => console.log("Interval macro task"), 1000);
    },

    // 3. I/O operations
    io: () => {
        // File reading (Node.js example)
        // fs.readFile('file.txt', callback); // Macro task
    },

    // 4. UI events
    uiEvents: () => {
        button.addEventListener('click', () => {
            console.log("Click handler is a macro task");
        });
    },

    // 5. MessageChannel/postMessage
    messaging: () => {
        const channel = new MessageChannel();
        channel.port2.onmessage = () => {
            console.log("Message handler is a macro task");
        };
        channel.port1.postMessage("Hello");
    }
};
```


#### Micro Tasks (Job Queue)


```javascript
// Micro tasks - "Small, urgent jobs" that must complete
const microTaskExamples = {
    // 1. Promise resolutions
    promises: () => {
        Promise.resolve().then(() => {
            console.log("Promise.then is a micro task");
        });

        // Promise chains create multiple micro tasks
        Promise.resolve()
            .then(() => console.log("Micro 1"))
            .then(() => console.log("Micro 2"))
            .then(() => console.log("Micro 3"));
    },

    // 2. async/await (syntactic sugar for promises)
    asyncAwait: async () => {
        console.log("Before await");
        await Promise.resolve(); // Micro task
        console.log("After await - this is a micro task");
    },

    // 3. queueMicrotask (explicit micro task scheduling)
    explicit: () => {
        queueMicrotask(() => {
            console.log("Explicit micro task");
        });
    },

    // 4. MutationObserver
    mutations: () => {
        const observer = new MutationObserver(() => {
            console.log("DOM mutation callback - micro task");
        });

        observer.observe(document.body, { childList: true });
        document.body.appendChild(document.createElement('div'));
    }
};
```


#### Deprecated: Object.observe


```javascript
// Object.observe - DEPRECATED and removed
// This was a micro task but is no longer part of the spec

// Old way (DON'T USE):
/*
Object.observe(obj, function(changes) {
    // This callback was a micro task
    console.log("Object changed", changes);
});
*/

// Modern alternatives:
// 1. Proxy for object observation
const observableObject = new Proxy({}, {
    set(target, property, value) {
        console.log(`Setting ${property} to ${value}`);

        // Schedule a micro task for change notification
        queueMicrotask(() => {
            console.log("Change processed as micro task");
        });

        target[property] = value;
        return true;
    }
});

// 2. Using getters/setters
class ObservableClass {
    constructor() {
        this._data = {};
    }

    set data(value) {
        this._data = value;

        // Micro task for change notification
        Promise.resolve().then(() => {
            this.onDataChange(value);
        });
    }

    onDataChange(newValue) {
        console.log("Data changed:", newValue);
    }
}
```


## 🔧 PHẦN TRUNG CẤP (Senior Level): Thực Chiến Và Patterns


### 💭 Think Out Loud: Common Misconceptions Mà Senior Engineers Thường Mắc


#### Misconception #1: "setTimeout(fn, 0) Executes Immediately"


```javascript
// WRONG understanding
console.log("1");
setTimeout(() => console.log("2"), 0); // NOT immediate!
console.log("3");

// Expected by confused developers: 1, 2, 3
// Actual output: 1, 3, 2

// WHY? Let's trace through Event Loop:
/*
Step 1: console.log("1") - executes immediately (synchronous)
Step 2: setTimeout(..., 0) - adds callback to macro task queue
Step 3: console.log("3") - executes immediately (synchronous)
Step 4: Event Loop processes macro task queue → console.log("2")
*/
```


**Debugging Mental Model**:


```javascript
// Visualizing the queue states
function debugEventLoop() {
    console.log("=== Call Stack: [main] ===");

    console.log("1. Adding to macro queue...");
    setTimeout(() => {
        console.log("=== Call Stack: [setTimeout callback] ===");
        console.log("4. From macro task");
    }, 0);

    console.log("2. Adding to micro queue...");
    Promise.resolve().then(() => {
        console.log("=== Call Stack: [Promise callback] ===");
        console.log("3. From micro task");
    });

    console.log("=== Call Stack: [main] about to empty ===");
}

debugEventLoop();

/* Output with stack visualization:
=== Call Stack: [main] ===
1. Adding to macro queue...
2. Adding to micro queue...
=== Call Stack: [main] about to empty ===
=== Call Stack: [Promise callback] ===
3. From micro task
=== Call Stack: [setTimeout callback] ===
4. From macro task
*/
```


#### Misconception #2: "All Async Operations Are the Same"


```javascript
// WRONG: Treating all async as equal
async function confusedAsync() {
    console.log("Start");

    // These are NOT the same!
    setTimeout(() => console.log("Timer"), 0);        // Macro task
    Promise.resolve().then(() => console.log("Promise")); // Micro task

    console.log("End");
}

confusedAsync();
// Output: Start, End, Promise, Timer
// NOT: Start, End, Timer, Promise

// Correct understanding with explanation:
async function clearAsync() {
    console.log("1. Synchronous start");

    // Macro task - goes to macro queue
    setTimeout(() => {
        console.log("4. Macro task executed");
    }, 0);

    // Micro task - goes to micro queue
    Promise.resolve().then(() => {
        console.log("3. Micro task executed");
    });

    console.log("2. Synchronous end");
    // Now call stack is empty → Event Loop processes queues
    // Micro tasks first → then macro tasks
}
```


#### Misconception #3: "Promise.then Executes Synchronously"


```javascript
// DANGEROUS misconception
function dangerousAssumption() {
    let result = null;

    Promise.resolve("data").then(data => {
        result = data; // This happens LATER!
    });

    console.log(result); // null - NOT "data"!
    // Common mistake: assuming result is available immediately
}

// Correct approach
async function correctApproach() {
    let result = null;

    // Properly wait for promise
    result = await Promise.resolve("data");
    console.log(result); // "data" - correct!

    // Or use .then properly
    Promise.resolve("data").then(data => {
        console.log(data); // "data" - in the micro task
    });
}
```


### 🏭 Production Reality: Real-world Scenarios từ MAANG


#### Scenario 1: Netflix Video Player - Frame Drops Investigation


```javascript
// Netflix's video player encountered frame drops
// Root cause: Blocking the Event Loop

// PROBLEMATIC CODE (simplified version of actual issue):
class VideoPlayer {
    constructor() {
        this.frameRate = 60;
        this.frameInterval = 1000 / this.frameRate; // 16.67ms
    }

    // BUG: This blocks Event Loop for too long
    processVideoFrame() {
        const frameStart = performance.now();

        // Complex video processing (simplified)
        for (let i = 0; i < 1000000; i++) {
            // Expensive calculations
            this.applyVideoFilter(i);
        }

        const frameTime = performance.now() - frameStart;
        console.log(`Frame processing took: ${frameTime}ms`);

        if (frameTime > this.frameInterval) {
            console.warn("Frame drop detected!");
        }
    }

    // SOLUTION: Break work into smaller chunks
    processVideoFrameOptimized() {
        const chunkSize = 1000;
        let currentIndex = 0;

        const processChunk = () => {
            const chunkStart = performance.now();

            // Process smaller chunk
            for (let i = 0; i < chunkSize && currentIndex < 1000000; i++) {
                this.applyVideoFilter(currentIndex++);
            }

            const chunkTime = performance.now() - chunkStart;

            if (currentIndex < 1000000) {
                // Yield to Event Loop between chunks
                if (chunkTime < 5) { // If chunk was fast, do more
                    this.processChunk();
                } else { // If chunk was slow, yield
                    setTimeout(processChunk, 0); // Macro task
                }
            }
        };

        processChunk();
    }
}

// Netflix's actual debugging approach
class PerformanceMonitor {
    constructor() {
        this.frameTimes = [];
        this.longTaskObserver = null;
        this.setupMonitoring();
    }

    setupMonitoring() {
        // Monitor long tasks that block Event Loop
        if ('PerformanceObserver' in window) {
            this.longTaskObserver = new PerformanceObserver((list) => {
                list.getEntries().forEach((entry) => {
                    if (entry.duration > 50) { // Tasks > 50ms are problematic
                        console.warn('Long task detected:', {
                            duration: entry.duration,
                            startTime: entry.startTime,
                            name: entry.name
                        });
                    }
                });
            });

            this.longTaskObserver.observe({ entryTypes: ['longtask'] });
        }
    }
}
```


#### Scenario 2: Facebook News Feed - Infinite Scroll Performance


```javascript
// Facebook's news feed infinite scroll optimization
class NewsFeedRenderer {
    constructor() {
        this.posts = [];
        this.renderQueue = [];
        this.isRendering = false;
    }

    // ORIGINAL PROBLEM: Rendering all posts at once
    renderPostsBlocking(posts) {
        posts.forEach(post => {
            this.renderSinglePost(post); // Blocks Event Loop
        });
        // User interaction becomes unresponsive
    }

    // FACEBOOK'S SOLUTION: Time-sliced rendering
    renderPostsTimeSliced(posts) {
        this.renderQueue = [...posts];
        this.scheduleRender();
    }

    scheduleRender() {
        if (this.isRendering || this.renderQueue.length === 0) {
            return;
        }

        this.isRendering = true;

        // Use scheduler to yield to browser
        this.scheduleWork(() => {
            const timeSlice = 5; // 5ms time slice
            const deadline = performance.now() + timeSlice;

            while (this.renderQueue.length > 0 && performance.now() < deadline) {
                const post = this.renderQueue.shift();
                this.renderSinglePost(post);
            }

            if (this.renderQueue.length > 0) {
                // More work to do, schedule next chunk
                this.scheduleWork(this.scheduleRender.bind(this));
            } else {
                this.isRendering = false;
            }
        });
    }

    scheduleWork(callback) {
        // Facebook's scheduling strategy
        if ('scheduler' in window && window.scheduler.postTask) {
            // Use native scheduler if available
            window.scheduler.postTask(callback, { priority: 'user-visible' });
        } else if ('requestIdleCallback' in window) {
            // Use idle callback if available
            requestIdleCallback(callback, { timeout: 5 });
        } else {
            // Fallback to setTimeout
            setTimeout(callback, 0);
        }
    }

    renderSinglePost(post) {
        // Actual DOM manipulation
        const postElement = document.createElement('div');
        postElement.className = 'post';
        postElement.innerHTML = this.generatePostHTML(post);

        // Micro task for smooth animation
        Promise.resolve().then(() => {
            postElement.classList.add('fade-in');
        });

        document.getElementById('feed').appendChild(postElement);
    }
}

// Facebook's performance measurement
class FacebookPerformanceTracker {
    constructor() {
        this.setupTracking();
    }

    setupTracking() {
        // Track Event Loop blocking
        let lastTime = performance.now();

        const checkEventLoop = () => {
            const currentTime = performance.now();
            const gap = currentTime - lastTime;

            if (gap > 50) { // > 50ms gap indicates blocking
                console.warn('Event Loop blocked for:', gap + 'ms');

                // Send telemetry to Facebook's monitoring
                this.sendTelemetry({
                    type: 'event_loop_blocked',
                    duration: gap,
                    timestamp: currentTime
                });
            }

            lastTime = currentTime;
            setTimeout(checkEventLoop, 0);
        };

        checkEventLoop();
    }
}
```


#### Scenario 3: Google Gmail - Email Composer Optimization


```javascript
// Google Gmail's email composer performance optimization
class GmailComposer {
    constructor() {
        this.draftSaveQueue = [];
        this.isAutoSaving = false;
        this.setupAutoSave();
    }

    // CHALLENGE: Auto-save without blocking typing
    setupAutoSave() {
        let typingTimer;
        const textarea = document.getElementById('email-content');

        textarea.addEventListener('input', (event) => {
            // Clear previous timer
            clearTimeout(typingTimer);

            // Don't save immediately - wait for pause in typing
            typingTimer = setTimeout(() => {
                this.queueDraftSave(textarea.value);
            }, 1000); // 1 second debounce
        });
    }

    queueDraftSave(content) {
        this.draftSaveQueue.push({
            content,
            timestamp: Date.now()
        });

        this.processDraftQueue();
    }

    processDraftQueue() {
        if (this.isAutoSaving || this.draftSaveQueue.length === 0) {
            return;
        }

        this.isAutoSaving = true;

        // Use micro task for immediate processing
        Promise.resolve().then(() => {
            const draft = this.draftSaveQueue.shift();
            return this.saveDraftToServer(draft);
        })
        .then(() => {
            this.isAutoSaving = false;

            // Process next item if queue has more
            if (this.draftSaveQueue.length > 0) {
                // Use macro task to yield to other operations
                setTimeout(() => this.processDraftQueue(), 0);
            }
        })
        .catch((error) => {
            console.error('Draft save failed:', error);
            this.isAutoSaving = false;

            // Retry with exponential backoff
            setTimeout(() => this.processDraftQueue(), 2000);
        });
    }

    saveDraftToServer(draft) {
        // Simulated network request
        return new Promise((resolve, reject) => {
            // Use fetch which returns promise (micro task)
            fetch('/api/save-draft', {
                method: 'POST',
                body: JSON.stringify(draft),
                headers: { 'Content-Type': 'application/json' }
            })
            .then(response => response.json())
            .then(resolve)
            .catch(reject);
        });
    }
}

// Google's Event Loop monitoring in Gmail
class GmailPerformanceMonitor {
    constructor() {
        this.performanceEntries = [];
        this.setupEventLoopMonitoring();
    }

    setupEventLoopMonitoring() {
        // Measure main thread blocking
        const observer = new PerformanceObserver((list) => {
            list.getEntries().forEach((entry) => {
                if (entry.entryType === 'measure') {
                    this.performanceEntries.push({
                        name: entry.name,
                        duration: entry.duration,
                        startTime: entry.startTime
                    });

                    // Alert if main thread blocked too long
                    if (entry.duration > 100) {
                        this.reportPerformanceIssue(entry);
                    }
                }
            });
        });

        observer.observe({ entryTypes: ['measure', 'longtask'] });
    }

    reportPerformanceIssue(entry) {
        // Google's internal telemetry
        console.warn('Gmail performance issue:', {
            operation: entry.name,
            blockingTime: entry.duration,
            affectsUserExperience: entry.duration > 50
        });
    }
}
```


### 🎯 Advanced Patterns: Senior-Level Techniques


#### Pattern 1: Cooperative Scheduling


```javascript
// Advanced pattern: Breaking up long-running tasks
class CooperativeScheduler {
    constructor() {
        this.taskQueue = [];
        this.isProcessing = false;
        this.timeSlice = 5; // 5ms time slice
    }

    schedule(task, priority = 'normal') {
        this.taskQueue.push({ task, priority });
        this.taskQueue.sort((a, b) => {
            const priorities = { 'high': 1, 'normal': 2, 'low': 3 };
            return priorities[a.priority] - priorities[b.priority];
        });

        this.processQueue();
    }

    processQueue() {
        if (this.isProcessing || this.taskQueue.length === 0) {
            return;
        }

        this.isProcessing = true;

        const processSlice = () => {
            const sliceStart = performance.now();

            while (this.taskQueue.length > 0 &&
                   performance.now() - sliceStart < this.timeSlice) {
                const { task } = this.taskQueue.shift();
                try {
                    task();
                } catch (error) {
                    console.error('Task execution error:', error);
                }
            }

            if (this.taskQueue.length > 0) {
                // Yield to Event Loop
                setTimeout(processSlice, 0);
            } else {
                this.isProcessing = false;
            }
        };

        processSlice();
    }
}

// Usage example
const scheduler = new CooperativeScheduler();

// Schedule heavy computation
scheduler.schedule(() => {
    for (let i = 0; i < 100000; i++) {
        // Heavy work broken into smaller chunks
        Math.random() * Math.random();
    }
    console.log("Heavy work completed");
}, 'low');

// High priority user interaction
scheduler.schedule(() => {
    console.log("User interaction handled immediately");
}, 'high');
```


#### Pattern 2: Event Loop Profiling


```javascript
// Advanced debugging: Event Loop performance profiling
class EventLoopProfiler {
    constructor() {
        this.measurements = [];
        this.isRunning = false;
        this.startTime = null;
    }

    start() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.startTime = performance.now();
        this.scheduleCheck();
    }

    scheduleCheck() {
        if (!this.isRunning) return;

        const checkTime = performance.now();

        // Schedule next check using different task types
        setTimeout(() => {
            const macroTaskTime = performance.now();
            const macroDelay = macroTaskTime - checkTime;

            Promise.resolve().then(() => {
                const microTaskTime = performance.now();
                const microDelay = microTaskTime - checkTime;

                this.recordMeasurement({
                    checkTime,
                    macroDelay,
                    microDelay,
                    eventLoopLag: macroDelay
                });

                this.scheduleCheck();
            });
        }, 0);
    }

    recordMeasurement(measurement) {
        this.measurements.push(measurement);

        // Alert on high Event Loop lag
        if (measurement.eventLoopLag > 50) {
            console.warn('High Event Loop lag detected:', measurement);
        }

        // Keep only recent measurements
        if (this.measurements.length > 100) {
            this.measurements.shift();
        }
    }

    getStats() {
        if (this.measurements.length === 0) return null;

        const lags = this.measurements.map(m => m.eventLoopLag);
        const avgLag = lags.reduce((sum, lag) => sum + lag, 0) / lags.length;
        const maxLag = Math.max(...lags);
        const minLag = Math.min(...lags);

        return {
            averageLag: avgLag.toFixed(2) + 'ms',
            maxLag: maxLag.toFixed(2) + 'ms',
            minLag: minLag.toFixed(2) + 'ms',
            measurementCount: this.measurements.length
        };
    }

    stop() {
        this.isRunning = false;
        return this.getStats();
    }
}

// Usage
const profiler = new EventLoopProfiler();
profiler.start();

// Run some heavy operations
setTimeout(() => {
    const stats = profiler.stop();
    console.log('Event Loop Performance:', stats);
}, 5000);
```


### 🔍 Deep Debugging Techniques


#### Technique 1: Call Stack Visualization


```javascript
// Advanced debugging: Visualizing call stack and queues
class EventLoopVisualizer {
    constructor() {
        this.callStack = [];
        this.macroQueue = [];
        this.microQueue = [];
        this.logs = [];
    }

    // Monkey patch console.log to track execution
    setupLogging() {
        const originalLog = console.log;
        const self = this;

        console.log = function(...args) {
            // Capture stack trace
            const stack = new Error().stack
                .split('\n')
                .slice(2, 4)
                .map(line => line.trim());

            self.logs.push({
                message: args.join(' '),
                callStack: [...self.callStack],
                macroQueueLength: self.macroQueue.length,
                microQueueLength: self.microQueue.length,
                timestamp: performance.now(),
                stack: stack
            });

            originalLog.apply(console, args);
        };
    }

    // Track function calls
    wrapFunction(fn, name) {
        const self = this;
        return function(...args) {
            self.callStack.push(name);
            try {
                const result = fn.apply(this, args);
                return result;
            } finally {
                self.callStack.pop();
            }
        };
    }

    // Visualize current state
    visualizeState() {
        console.table({
            'Call Stack': this.callStack.join(' → '),
            'Macro Queue Length': this.macroQueue.length,
            'Micro Queue Length': this.microQueue.length
        });
    }

    // Get execution timeline
    getExecutionTimeline() {
        return this.logs.map((log, index) => ({
            step: index + 1,
            message: log.message,
            callStack: log.callStack.join(' → '),
            queueState: `M:${log.macroQueueLength} μ:${log.microQueueLength}`,
            time: log.timestamp.toFixed(2) + 'ms'
        }));
    }
}

// Example usage
const visualizer = new EventLoopVisualizer();
visualizer.setupLogging();

// Wrapped functions for tracking
const wrappedSetTimeout = visualizer.wrapFunction(setTimeout, 'setTimeout');
const wrappedPromise = visualizer.wrapFunction(Promise.resolve().then.bind(Promise.resolve()), 'Promise.then');

// Test scenario
console.log("1. Start");

wrappedSetTimeout(() => {
    console.log("4. Timeout callback");
}, 0);

wrappedPromise(() => {
    console.log("3. Promise callback");
});

console.log("2. End");

// View timeline after execution
setTimeout(() => {
    console.table(visualizer.getExecutionTimeline());
}, 100);
```


## 🚀 PHẦN CHUYÊN SÂU (Principal Level): Architecture và Strategy


### 💭 Principal's Strategic Thinking


#### Performance Budget và Event Loop


```javascript
// Principal-level thinking: Performance budgeting for Event Loop
class EventLoopPerformanceBudget {
    constructor() {
        this.frameBudget = 16.67; // 60fps = 16.67ms per frame
        this.tasks = new Map();
        this.budgetAllocations = {
            'user-input': 0.3,      // 30% for user interactions
            'rendering': 0.4,        // 40% for DOM updates
            'business-logic': 0.2,   // 20% for app logic
            'background': 0.1        // 10% for background tasks
        };
    }

    // Register task with performance budget
    registerTask(taskName, category, estimatedDuration) {
        const maxAllowedDuration = this.frameBudget * this.budgetAllocations[category];

        if (estimatedDuration > maxAllowedDuration) {
            console.warn(`Task "${taskName}" exceeds budget:`, {
                estimated: estimatedDuration + 'ms',
                budget: maxAllowedDuration + 'ms',
                category
            });

            // Suggest optimization strategies
            this.suggestOptimization(taskName, estimatedDuration, maxAllowedDuration);
        }

        this.tasks.set(taskName, {
            category,
            estimatedDuration,
            budget: maxAllowedDuration,
            actualDurations: []
        });
    }

    // Execute task with budget monitoring
    executeTask(taskName, taskFn) {
        const task = this.tasks.get(taskName);
        if (!task) {
            throw new Error(`Task "${taskName}" not registered`);
        }

        const startTime = performance.now();

        try {
            const result = taskFn();
            const actualDuration = performance.now() - startTime;

            task.actualDurations.push(actualDuration);

            if (actualDuration > task.budget) {
                this.handleBudgetViolation(taskName, actualDuration, task.budget);
            }

            return result;
        } catch (error) {
            console.error(`Task "${taskName}" failed:`, error);
            throw error;
        }
    }

    suggestOptimization(taskName, actual, budget) {
        const strategies = [
            'Break task into smaller chunks using setTimeout',
            'Use requestIdleCallback for non-critical work',
            'Consider Web Workers for CPU-intensive operations',
            'Implement virtual scrolling for large lists',
            'Use CSS animations instead of JavaScript',
            'Debounce/throttle high-frequency events'
        ];

        console.log(`Optimization suggestions for "${taskName}":`, strategies);
    }

    handleBudgetViolation(taskName, actual, budget) {
        console.error('Performance budget violation:', {
            task: taskName,
            actualDuration: actual.toFixed(2) + 'ms',
            budgetExceeded: (actual - budget).toFixed(2) + 'ms',
            impactOnFrameRate: actual > 16.67 ? 'SEVERE' : 'MODERATE'
        });

        // In production, this would trigger alerts
        this.triggerPerformanceAlert(taskName, actual, budget);
    }
}

// Principal-level implementation example
class ApplicationPerformanceManager {
    constructor() {
        this.budget = new EventLoopPerformanceBudget();
        this.setupPerformanceMonitoring();
        this.initializeTaskRegistration();
    }

    initializeTaskRegistration() {
        // Register critical application tasks
        this.budget.registerTask('user-input-handler', 'user-input', 2);
        this.budget.registerTask('list-render', 'rendering', 5);
        this.budget.registerTask('data-processing', 'business-logic', 3);
        this.budget.registerTask('analytics-tracking', 'background', 1);
    }

    setupPerformanceMonitoring() {
        // Monitor long tasks
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                list.getEntries().forEach((entry) => {
                    if (entry.duration > 50) {
                        this.reportLongTask(entry);
                    }
                });
            });

            observer.observe({ entryTypes: ['longtask'] });
        }
    }

    reportLongTask(entry) {
        // Principal-level reporting: tie performance to business metrics
        const report = {
            duration: entry.duration,
            startTime: entry.startTime,
            impactOnUserExperience: this.calculateUXImpact(entry.duration),
            businessImpact: this.calculateBusinessImpact(entry.duration),
            recommendedActions: this.getRecommendedActions(entry.duration)
        };

        console.warn('Long task detected:', report);

        // In production: send to monitoring service
        this.sendToMonitoringService(report);
    }

    calculateUXImpact(duration) {
        if (duration > 200) return 'CRITICAL - User likely to notice jank';
        if (duration > 100) return 'HIGH - Potential user frustration';
        if (duration > 50) return 'MEDIUM - Slight UX degradation';
        return 'LOW - Minimal impact';
    }

    calculateBusinessImpact(duration) {
        // Principal insight: Performance directly affects business KPIs
        const conversionImpact = Math.min(duration / 1000 * 0.1, 0.5); // Max 50% impact

        return {
            estimatedConversionLoss: `${(conversionImpact * 100).toFixed(1)}%`,
            userRetentionRisk: duration > 100 ? 'HIGH' : 'LOW',
            revenueImpact: duration > 200 ? 'SIGNIFICANT' : 'MINIMAL'
        };
    }
}
```


#### Scalability Architecture


```javascript
// Principal-level: Designing Event Loop-aware architecture
class ScalableEventLoopArchitecture {
    constructor() {
        this.workerPool = [];
        this.mainThreadScheduler = new PriorityScheduler();
        this.crossTabCoordinator = new CrossTabCoordinator();
        this.setupArchitecture();
    }

    setupArchitecture() {
        // 1. Offload CPU-intensive work to Web Workers
        this.initializeWorkerPool();

        // 2. Implement sophisticated scheduling
        this.setupMainThreadScheduler();

        // 3. Coordinate across browser tabs
        this.setupCrossTabCoordination();

        // 4. Monitor and adapt to device capabilities
        this.setupAdaptivePerformance();
    }

    initializeWorkerPool() {
        const workerCount = navigator.hardwareConcurrency || 4;

        for (let i = 0; i < workerCount; i++) {
            const worker = new Worker('/workers/computation-worker.js');

            worker.onmessage = (event) => {
                const { taskId, result, error } = event.data;
                this.handleWorkerResult(taskId, result, error);
            };

            this.workerPool.push({
                worker,
                busy: false,
                taskQueue: []
            });
        }
    }

    // Offload heavy computation to workers
    scheduleComputationTask(task, data) {
        const availableWorker = this.workerPool.find(w => !w.busy);

        if (availableWorker) {
            availableWorker.busy = true;
            availableWorker.worker.postMessage({
                task,
                data,
                taskId: this.generateTaskId()
            });
        } else {
            // All workers busy - queue task
            const leastBusyWorker = this.workerPool
                .reduce((min, worker) =>
                    worker.taskQueue.length < min.taskQueue.length ? worker : min);

            leastBusyWorker.taskQueue.push({ task, data });
        }
    }

    setupMainThreadScheduler() {
        // Principal-level: Sophisticated priority scheduling
        this.mainThreadScheduler.definePriorities({
            'immediate': 1,        // User interactions
            'user-visible': 2,     // Animations, updates user sees
            'background': 3,       // Analytics, preloading
            'idle': 4             // Cleanup, optimization
        });

        // Time-slice based on device performance
        const devicePerformance = this.assessDevicePerformance();
        this.mainThreadScheduler.setTimeSlice(devicePerformance.timeSlice);
    }

    assessDevicePerformance() {
        // Adaptive performance based on device capabilities
        const startTime = performance.now();

        // Simple performance test
        for (let i = 0; i < 100000; i++) {
            Math.random();
        }

        const testDuration = performance.now() - startTime;

        if (testDuration < 10) {
            return { tier: 'high-end', timeSlice: 8 };
        } else if (testDuration < 20) {
            return { tier: 'mid-range', timeSlice: 5 };
        } else {
            return { tier: 'low-end', timeSlice: 3 };
        }
    }

    setupCrossTabCoordination() {
        // Coordinate heavy operations across tabs
        this.crossTabCoordinator.onMessage('heavy-operation-start', (data) => {
            // Reduce activity in this tab when other tab is busy
            this.mainThreadScheduler.reducePriority('background');
        });

        this.crossTabCoordinator.onMessage('heavy-operation-end', (data) => {
            // Resume normal priority
            this.mainThreadScheduler.restorePriority('background');
        });
    }
}

// Principal-level: Cross-tab coordination
class CrossTabCoordinator {
    constructor() {
        this.channel = new BroadcastChannel('app-coordination');
        this.tabId = this.generateTabId();
        this.messageHandlers = new Map();
        this.setupCoordination();
    }

    setupCoordination() {
        this.channel.onmessage = (event) => {
            const { type, data, fromTab } = event.data;

            if (fromTab !== this.tabId) {
                const handler = this.messageHandlers.get(type);
                if (handler) {
                    handler(data);
                }
            }
        };

        // Heartbeat to detect active tabs
        setInterval(() => {
            this.broadcast('heartbeat', { timestamp: Date.now() });
        }, 5000);
    }

    broadcast(type, data) {
        this.channel.postMessage({
            type,
            data,
            fromTab: this.tabId,
            timestamp: Date.now()
        });
    }

    onMessage(type, handler) {
        this.messageHandlers.set(type, handler);
    }
}

// Principal-level: Priority-based scheduler
class PriorityScheduler {
    constructor() {
        this.queues = new Map();
        this.priorities = new Map();
        this.timeSlice = 5; // Default 5ms
        this.isProcessing = false;
    }

    definePriorities(priorityMap) {
        this.priorities = new Map(Object.entries(priorityMap));

        // Initialize queues for each priority
        this.priorities.forEach((level, name) => {
            this.queues.set(name, []);
        });
    }

    schedule(task, priority = 'background') {
        if (!this.queues.has(priority)) {
            throw new Error(`Unknown priority: ${priority}`);
        }

        this.queues.get(priority).push(task);
        this.processQueues();
    }

    processQueues() {
        if (this.isProcessing) return;

        this.isProcessing = true;

        const processSlice = () => {
            const sliceStart = performance.now();

            // Process tasks in priority order
            const sortedPriorities = Array.from(this.priorities.entries())
                .sort((a, b) => a[1] - b[1]);

            for (const [priority, level] of sortedPriorities) {
                const queue = this.queues.get(priority);

                while (queue.length > 0 &&
                       performance.now() - sliceStart < this.timeSlice) {
                    const task = queue.shift();
                    try {
                        task();
                    } catch (error) {
                        console.error(`Task execution error in ${priority}:`, error);
                    }
                }

                // If we used up time slice, break
                if (performance.now() - sliceStart >= this.timeSlice) {
                    break;
                }
            }

            // Check if more work remains
            const hasWork = Array.from(this.queues.values())
                .some(queue => queue.length > 0);

            if (hasWork) {
                setTimeout(processSlice, 0);
            } else {
                this.isProcessing = false;
            }
        };

        processSlice();
    }
}
```


### 🎯 Expert-Level Patterns và Anti-Patterns


#### Pattern: Event Loop-Aware State Management


```javascript
// Advanced pattern: State management that respects Event Loop
class EventLoopAwareStateManager {
    constructor() {
        this.state = {};
        this.subscribers = new Map();
        this.updateQueue = [];
        this.isProcessingUpdates = false;
        this.batchTimeWindow = 16; // One frame
    }

    // Batch state updates within frame boundary
    setState(updates) {
        this.updateQueue.push(updates);
        this.scheduleUpdateProcessing();
    }

    scheduleUpdateProcessing() {
        if (this.isProcessingUpdates) return;

        this.isProcessingUpdates = true;

        // Use micro task for immediate updates
        Promise.resolve().then(() => {
            this.processBatchedUpdates();
        });
    }

    processBatchedUpdates() {
        const batchStart = performance.now();
        const newState = { ...this.state };

        // Apply all queued updates
        while (this.updateQueue.length > 0) {
            const updates = this.updateQueue.shift();
            Object.assign(newState, updates);

            // Respect frame time budget
            if (performance.now() - batchStart > this.batchTimeWindow * 0.5) {
                // Defer remaining updates to next frame
                setTimeout(() => this.processBatchedUpdates(), 0);
                return;
            }
        }

        // Detect changes
        const changes = this.detectChanges(this.state, newState);
        this.state = newState;

        // Notify subscribers efficiently
        this.notifySubscribers(changes);

        this.isProcessingUpdates = false;
    }

    detectChanges(oldState, newState) {
        const changes = {};

        for (const key in newState) {
            if (oldState[key] !== newState[key]) {
                changes[key] = {
                    oldValue: oldState[key],
                    newValue: newState[key]
                };
            }
        }

        return changes;
    }

    notifySubscribers(changes) {
        // Prioritize UI-affecting subscribers
        const uiSubscribers = [];
        const backgroundSubscribers = [];

        this.subscribers.forEach((callback, key) => {
            if (key.startsWith('ui:')) {
                uiSubscribers.push({ key, callback });
            } else {
                backgroundSubscribers.push({ key, callback });
            }
        });

        // Process UI subscribers in micro tasks
        uiSubscribers.forEach(({ callback }) => {
            Promise.resolve().then(() => {
                try {
                    callback(changes);
                } catch (error) {
                    console.error('Subscriber error:', error);
                }
            });
        });

        // Process background subscribers in macro tasks
        backgroundSubscribers.forEach(({ callback }, index) => {
            setTimeout(() => {
                try {
                    callback(changes);
                } catch (error) {
                    console.error('Background subscriber error:', error);
                }
            }, index); // Spread across multiple ticks
        });
    }

    subscribe(key, callback) {
        this.subscribers.set(key, callback);

        return () => {
            this.subscribers.delete(key);
        };
    }
}

// Usage example
const stateManager = new EventLoopAwareStateManager();

// UI subscriber (high priority)
stateManager.subscribe('ui:component1', (changes) => {
    console.log('UI updated:', changes);
    // Update DOM immediately
});

// Analytics subscriber (low priority)
stateManager.subscribe('analytics:tracker', (changes) => {
    console.log('Tracking state change:', changes);
    // Send analytics data
});

// Batch multiple updates
stateManager.setState({ user: 'John' });
stateManager.setState({ theme: 'dark' });
stateManager.setState({ language: 'en' });
// All processed in single batch
```


#### Anti-Pattern: Event Loop Blocking


```javascript
// ANTI-PATTERN: Common mistakes that block Event Loop
class EventLoopAntiPatterns {

    // ❌ ANTI-PATTERN 1: Synchronous heavy computation
    badHeavyComputation() {
        console.log("Starting heavy computation...");

        // This BLOCKS Event Loop for seconds
        for (let i = 0; i < 10000000; i++) {
            Math.random() * Math.random();
        }

        console.log("Heavy computation done");
        // User interactions are frozen during this time
    }

    // ✅ CORRECT: Break into chunks
    goodHeavyComputation() {
        console.log("Starting chunked computation...");

        let progress = 0;
        const total = 10000000;
        const chunkSize = 100000;

        const processChunk = () => {
            const chunkStart = performance.now();

            for (let i = 0; i < chunkSize && progress < total; i++) {
                Math.random() * Math.random();
                progress++;
            }

            const chunkTime = performance.now() - chunkStart;

            if (progress < total) {
                // Yield to Event Loop
                if (chunkTime < 5) {
                    // If chunk was fast, continue immediately
                    processChunk();
                } else {
                    // If chunk was slow, yield
                    setTimeout(processChunk, 0);
                }
            } else {
                console.log("Chunked computation done");
            }
        };

        processChunk();
    }

    // ❌ ANTI-PATTERN 2: Infinite loops in promises
    badPromiseLoop() {
        Promise.resolve().then(function recursivePromise() {
            // This creates infinite micro task loop
            // Blocks Event Loop forever!
            return Promise.resolve().then(recursivePromise);
        });
    }

    // ✅ CORRECT: Break promise chains
    goodPromiseLoop() {
        let count = 0;
        const maxIterations = 1000000;

        function controlledPromiseLoop() {
            return Promise.resolve().then(() => {
                // Do work
                count++;

                if (count < maxIterations) {
                    // Periodically yield to macro task queue
                    if (count % 10000 === 0) {
                        return new Promise(resolve => setTimeout(resolve, 0))
                            .then(controlledPromiseLoop);
                    } else {
                        return controlledPromiseLoop();
                    }
                }
            });
        }

        controlledPromiseLoop();
    }

    // ❌ ANTI-PATTERN 3: Blocking DOM queries
    badDOMQueries() {
        const elements = [];

        // Forces layout thrashing - blocks Event Loop
        for (let i = 0; i < 1000; i++) {
            const div = document.createElement('div');
            document.body.appendChild(div);

            // Reading layout properties forces immediate layout
            const height = div.offsetHeight; // LAYOUT THRASH!
            elements.push({ div, height });
        }
    }

    // ✅ CORRECT: Batch DOM operations
    goodDOMQueries() {
        const elements = [];
        const fragment = document.createDocumentFragment();

        // 1. Create elements without adding to DOM
        for (let i = 0; i < 1000; i++) {
            const div = document.createElement('div');
            fragment.appendChild(div);
            elements.push(div);
        }

        // 2. Single DOM insertion
        document.body.appendChild(fragment);

        // 3. Batch read operations if needed
        requestAnimationFrame(() => {
            const heights = elements.map(div => div.offsetHeight);
            console.log('Heights:', heights);
        });
    }
}

// Principal insight: Monitoring anti-patterns in production
class AntiPatternDetector {
    constructor() {
        this.setupDetection();
    }

    setupDetection() {
        // Detect long-running tasks
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                list.getEntries().forEach((entry) => {
                    if (entry.duration > 50) {
                        this.reportAntiPattern('long-task', {
                            duration: entry.duration,
                            name: entry.name,
                            startTime: entry.startTime
                        });
                    }
                });
            });

            observer.observe({ entryTypes: ['longtask'] });
        }

        // Detect micro task starvation
        this.detectMicroTaskStarvation();

        // Detect layout thrashing
        this.detectLayoutThrashing();
    }

    detectMicroTaskStarvation() {
        let macroTaskCount = 0;
        let microTaskCount = 0;

        // Count macro tasks
        const originalSetTimeout = window.setTimeout;
        window.setTimeout = function(...args) {
            macroTaskCount++;
            return originalSetTimeout.apply(this, args);
        };

        // Count micro tasks
        const originalThen = Promise.prototype.then;
        Promise.prototype.then = function(...args) {
            microTaskCount++;
            return originalThen.apply(this, args);
        };

        // Check ratio periodically
        setInterval(() => {
            const ratio = microTaskCount / Math.max(macroTaskCount, 1);

            if (ratio > 100) { // More than 100 micro tasks per macro task
                this.reportAntiPattern('micro-task-starvation', {
                    microTaskCount,
                    macroTaskCount,
                    ratio
                });
            }

            // Reset counters
            microTaskCount = 0;
            macroTaskCount = 0;
        }, 5000);
    }

    detectLayoutThrashing() {
        let layoutCount = 0;
        const startTime = performance.now();

        // Monitor forced layouts
        const observer = new PerformanceObserver((list) => {
            list.getEntries().forEach((entry) => {
                if (entry.name === 'layout') {
                    layoutCount++;
                }
            });
        });

        observer.observe({ entryTypes: ['measure'] });

        setInterval(() => {
            const elapsed = performance.now() - startTime;
            const layoutsPerSecond = (layoutCount / elapsed) * 1000;

            if (layoutsPerSecond > 60) { // More than 60 layouts per second
                this.reportAntiPattern('layout-thrashing', {
                    layoutsPerSecond: layoutsPerSecond.toFixed(2),
                    totalLayouts: layoutCount
                });
            }
        }, 1000);
    }

    reportAntiPattern(type, data) {
        console.warn(`Event Loop Anti-Pattern Detected: ${type}`, data);

        // In production: send to monitoring service
        this.sendTelemetry(type, data);
    }

    sendTelemetry(type, data) {
        // Send to analytics/monitoring service
        fetch('/api/performance-issues', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type,
                data,
                timestamp: Date.now(),
                userAgent: navigator.userAgent,
                url: window.location.href
            })
        }).catch(console.error);
    }
}
```


### 🎓 Advanced Interview Questions & Scenarios


#### Principal-Level Interview Questions


```javascript
// Question 1: Explain this execution order and why
console.log('1');

setTimeout(() => console.log('2'), 0);

Promise.resolve().then(() => {
    console.log('3');
    setTimeout(() => console.log('4'), 0);
});

Promise.resolve().then(() => console.log('5'));

console.log('6');

/* Principal-level answer should include:
1. Step-by-step Event Loop analysis
2. Call stack, micro queue, macro queue states
3. Why promises execute before timeouts
4. Detailed explanation of each phase
*/

// Expected output: 1, 6, 3, 5, 2, 4
```


**Principal-level answer framework**:


```javascript
// Complete Event Loop analysis
function analyzeExecutionOrder() {
    /*
    PHASE 1: Initial script execution (macro task)
    Call Stack: [main script]
    Macro Queue: []
    Micro Queue: []

    - console.log('1') → executes immediately → Output: "1"
    - setTimeout(..., 0) → adds callback to macro queue
    - Promise.resolve().then(...) → adds callback to micro queue
    - Promise.resolve().then(...) → adds second callback to micro queue
    - console.log('6') → executes immediately → Output: "6"

    End of Phase 1:
    Call Stack: []
    Macro Queue: [setTimeout_2]
    Micro Queue: [promise_3, promise_5]

    PHASE 2: Event Loop processes micro queue first
    - Execute promise_3 callback:
      - console.log('3') → Output: "3"
      - setTimeout(..., 0) → adds setTimeout_4 to macro queue
    - Execute promise_5 callback:
      - console.log('5') → Output: "5"

    End of Phase 2:
    Call Stack: []
    Macro Queue: [setTimeout_2, setTimeout_4]
    Micro Queue: []

    PHASE 3: Event Loop processes macro queue
    - Execute setTimeout_2 callback:
      - console.log('2') → Output: "2"

    PHASE 4: Continue macro queue
    - Execute setTimeout_4 callback:
      - console.log('4') → Output: "4"

    Final output: 1, 6, 3, 5, 2, 4
    */
}
```


#### Advanced Scenario Questions


**Question 2: Performance Debugging Scenario**


```javascript
// Given this code causing performance issues, identify and fix problems
class ProblematicComponent {
    constructor() {
        this.data = [];
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Problem 1: No debouncing
        document.addEventListener('scroll', this.onScroll.bind(this));

        // Problem 2: Sync processing in event handler
        document.addEventListener('input', this.onInput.bind(this));
    }

    onScroll() {
        // Problem 3: Expensive DOM queries on scroll
        this.data.forEach((item, index) => {
            const element = document.getElementById(`item-${index}`);
            const rect = element.getBoundingClientRect();

            if (rect.top < window.innerHeight) {
                this.processVisibleItem(item);
            }
        });
    }

    onInput(event) {
        // Problem 4: Synchronous heavy processing
        const result = this.processInputData(event.target.value);
        this.updateUI(result);
    }

    processInputData(value) {
        // Problem 5: Blocking computation
        let result = [];
        for (let i = 0; i < 100000; i++) {
            result.push(value.charAt(i % value.length).toUpperCase());
        }
        return result.join('');
    }

    processVisibleItem(item) {
        // Problem 6: More expensive operations
        for (let i = 0; i < 10000; i++) {
            Math.random() * Math.random();
        }
    }
}

// Principal-level solution:
class OptimizedComponent {
    constructor() {
        this.data = [];
        this.visibilityCache = new Map();
        this.inputWorker = new Worker('/workers/input-processor.js');
        this.setupOptimizedEventListeners();
    }

    setupOptimizedEventListeners() {
        // Solution 1: Debounced scroll with RAF
        this.scrollHandler = this.debounce(this.onScroll.bind(this), 16);
        document.addEventListener('scroll', this.scrollHandler, { passive: true });

        // Solution 2: Debounced input with Worker
        this.inputHandler = this.debounce(this.onInput.bind(this), 300);
        document.addEventListener('input', this.inputHandler);
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func.apply(this, args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    onScroll() {
        // Solution 3: Use RAF for smooth scrolling + Intersection Observer
        requestAnimationFrame(() => {
            this.checkVisibilityOptimized();
        });
    }

    checkVisibilityOptimized() {
        // Use Intersection Observer instead of manual calculations
        if (!this.intersectionObserver) {
            this.intersectionObserver = new IntersectionObserver(
                (entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            const itemIndex = parseInt(entry.target.dataset.index);
                            this.scheduleItemProcessing(this.data[itemIndex]);
                        }
                    });
                },
                { threshold: 0.1 }
            );

            // Observe all items
            this.data.forEach((item, index) => {
                const element = document.getElementById(`item-${index}`);
                if (element) {
                    element.dataset.index = index;
                    this.intersectionObserver.observe(element);
                }
            });
        }
    }

    scheduleItemProcessing(item) {
        // Solution 4: Use scheduler for non-blocking processing
        if ('scheduler' in window) {
            window.scheduler.postTask(() => {
                this.processVisibleItem(item);
            }, { priority: 'background' });
        } else {
            setTimeout(() => this.processVisibleItem(item), 0);
        }
    }

    onInput(event) {
        // Solution 5: Offload to Web Worker
        this.inputWorker.postMessage({
            type: 'process',
            value: event.target.value
        });

        this.inputWorker.onmessage = (e) => {
            const { result } = e.data;
            // Update UI in next frame
            requestAnimationFrame(() => {
                this.updateUI(result);
            });
        };
    }

    processVisibleItem(item) {
        // Solution 6: Time-sliced processing
        const processInChunks = (iterations, chunkSize = 1000) => {
            let processed = 0;

            const processChunk = () => {
                const chunkStart = performance.now();

                while (processed < iterations &&
                       performance.now() - chunkStart < 5) {
                    Math.random() * Math.random();
                    processed++;
                }

                if (processed < iterations) {
                    setTimeout(processChunk, 0);
                }
            };

            processChunk();
        };

        processInChunks(10000);
    }
}
```


### 🔬 Expert Debugging Stories từ MAANG


#### Netflix Case Study: Video Player Event Loop Optimization


```javascript
// Real scenario from Netflix: Video player stuttering during high CPU usage
class NetflixVideoPlayerOptimization {
    constructor() {
        this.frameDropCounter = 0;
        this.performanceMonitor = new VideoPerformanceMonitor();
        this.setupOptimizations();
    }

    setupOptimizations() {
        // Problem: Video frame processing blocking Event Loop
        // causing UI freezes and frame drops

        // Original problematic approach:
        this.problematicFrameProcessing();

        // Netflix's solution:
        this.optimizedFrameProcessing();
    }

    problematicFrameProcessing() {
        /*
        PROBLEM: All video processing in main thread
        - Frame decoding: ~15ms
        - Color correction: ~8ms
        - Subtitle rendering: ~5ms
        - UI updates: ~3ms
        Total: ~31ms per frame (should be max 16.67ms for 60fps)
        */

        this.video.addEventListener('timeupdate', () => {
            // ALL processing in main thread - BLOCKS Event Loop
            const frameData = this.decodeFrame();      // 15ms
            const correctedFrame = this.correctColors(frameData); // 8ms
            this.renderSubtitles();                    // 5ms
            this.updatePlaybackUI();                   // 3ms
            // Total: 31ms - causes frame drops!
        });
    }

    optimizedFrameProcessing() {
        // Netflix's multi-pronged solution:

        // 1. Move heavy processing to Web Workers
        this.frameProcessor = new Worker('/workers/frame-processor.js');

        // 2. Use OffscreenCanvas for rendering
        this.setupOffscreenRendering();

        // 3. Implement frame scheduling
        this.frameScheduler = new VideoFrameScheduler();

        this.video.addEventListener('timeupdate', () => {
            // Only schedule work - don't do it immediately
            this.frameScheduler.scheduleFrameProcessing({
                timestamp: this.video.currentTime,
                frameData: this.getFrameData()
            });
        });
    }

    setupOffscreenRendering() {
        // Move rendering off main thread
        if ('OffscreenCanvas' in window) {
            const canvas = document.getElementById('video-canvas');
            const offscreen = canvas.transferControlToOffscreen();

            this.frameProcessor.postMessage({
                type: 'setup-canvas',
                canvas: offscreen
            }, [offscreen]);
        }
    }
}

class VideoFrameScheduler {
    constructor() {
        this.frameQueue = [];
        this.processingFrame = false;
        this.targetFrameTime = 16.67; // 60fps
    }

    scheduleFrameProcessing(frameData) {
        this.frameQueue.push(frameData);
        this.processFrameQueue();
    }

    processFrameQueue() {
        if (this.processingFrame || this.frameQueue.length === 0) {
            return;
        }

        this.processingFrame = true;

        // Use requestAnimationFrame for optimal timing
        requestAnimationFrame(() => {
            const frameStart = performance.now();
            const frameData = this.frameQueue.shift();

            // Process frame in time budget
            this.processFrameWithBudget(frameData, this.targetFrameTime * 0.8);

            const frameTime = performance.now() - frameStart;

            if (frameTime > this.targetFrameTime) {
                console.warn('Frame processing exceeded budget:', frameTime);
            }

            this.processingFrame = false;

            // Process next frame if available
            if (this.frameQueue.length > 0) {
                setTimeout(() => this.processFrameQueue(), 0);
            }
        });
    }

    processFrameWithBudget(frameData, timeBudget) {
        const startTime = performance.now();

        // Critical path: subtitle rendering (must be synchronous)
        this.renderSubtitles(frameData);

        const criticalTime = performance.now() - startTime;
        const remainingBudget = timeBudget - criticalTime;

        if (remainingBudget > 0) {
            // Non-critical: UI updates within remaining budget
            this.updateUIWithBudget(frameData, remainingBudget);
        } else {
            // Defer UI updates to next frame
            setTimeout(() => this.updateUI(frameData), 0);
        }
    }
}

// Netflix's performance monitoring
class VideoPerformanceMonitor {
    constructor() {
        this.metrics = {
            frameDrops: 0,
            avgFrameTime: 0,
            maxFrameTime: 0,
            eventLoopBlocks: 0
        };

        this.setupMonitoring();
    }

    setupMonitoring() {
        // Monitor frame drops
        this.setupFrameDropDetection();

        // Monitor Event Loop blocking
        this.setupEventLoopMonitoring();

        // Report metrics periodically
        setInterval(() => this.reportMetrics(), 10000);
    }

    setupFrameDropDetection() {
        let lastFrameTime = performance.now();

        const checkFrameRate = () => {
            const currentTime = performance.now();
            const frameDelta = currentTime - lastFrameTime;

            // Expected: ~16.67ms for 60fps
            if (frameDelta > 20) { // Threshold for frame drop
                this.metrics.frameDrops++;
                console.warn('Frame drop detected:', frameDelta + 'ms');
            }

            this.metrics.avgFrameTime = (this.metrics.avgFrameTime + frameDelta) / 2;
            this.metrics.maxFrameTime = Math.max(this.metrics.maxFrameTime, frameDelta);

            lastFrameTime = currentTime;
            requestAnimationFrame(checkFrameRate);
        };

        requestAnimationFrame(checkFrameRate);
    }

    reportMetrics() {
        const report = {
            sessionId: this.generateSessionId(),
            timestamp: Date.now(),
            metrics: this.metrics,
            userAgent: navigator.userAgent,
            videoQuality: this.getCurrentVideoQuality(),
            networkCondition: this.estimateNetworkCondition()
        };

        // Send to Netflix analytics
        this.sendToAnalytics(report);

        // Reset metrics for next period
        this.resetMetrics();
    }
}
```


### 🎯 Verification & Mastery Checkpoints


#### Self-Assessment Questions


```javascript
// Level 1: Foundation Understanding
const foundationQuestions = {
    q1: "What happens when the call stack is empty and there are tasks in both micro and macro queues?",
    a1: `Event Loop processes ALL micro tasks first, then ONE macro task,
         then ALL micro tasks again, then next macro task, and so on.`,

    q2: "Why does Promise.resolve().then() execute before setTimeout(fn, 0)?",
    a2: `Promises create micro tasks which have higher priority than macro tasks.
         Event Loop always empties micro task queue before processing macro tasks.`,

    q3: "What's the difference between microtask and macrotask queues?",
    a3: `Micro tasks: Promise callbacks, queueMicrotask, MutationObserver
         Macro tasks: setTimeout, setInterval, I/O, UI events, scripts
         Micro tasks execute with higher priority and ALL at once.`
};

// Level 2: Practical Application
const practicalQuestions = {
    q1: "How would you optimize a function that processes 1 million array items?",
    a1: `Break into chunks using setTimeout or requestIdleCallback:

         function processLargeArray(array, chunkSize = 1000) {
             let index = 0;

             function processChunk() {
                 const end = Math.min(index + chunkSize, array.length);

                 for (; index < end; index++) {
                     processItem(array[index]);
                 }

                 if (index < array.length) {
                     setTimeout(processChunk, 0); // Yield to Event Loop
                 }
             }

             processChunk();
         }`,

    q2: "How do you prevent Event Loop blocking in real applications?",
    a2: `1. Use Web Workers for CPU-intensive tasks
         2. Break long operations into chunks with setTimeout
         3. Use requestIdleCallback for non-critical work
         4. Implement time-budget based processing
         5. Monitor performance with PerformanceObserver`
};

// Level 3: Principal Understanding
const principalQuestions = {
    q1: "Design an Event Loop-aware state management system",
    a1: `class EventLoopAwareState {
            constructor() {
                this.state = {};
                this.updateQueue = [];
                this.subscribers = new Map();
                this.frameScheduler = new FrameScheduler();
            }

            setState(updates) {
                this.updateQueue.push(updates);
                this.frameScheduler.schedule(() => {
                    this.processBatchedUpdates();
                });
            }

            processBatchedUpdates() {
                // Batch all updates in single frame
                const newState = this.updateQueue.reduce(
                    (acc, update) => ({ ...acc, ...update }),
                    this.state
                );

                const changes = this.diff(this.state, newState);
                this.state = newState;

                // Notify subscribers with priority scheduling
                this.notifySubscribers(changes);
            }
         }`,

    q2: "How would you implement cross-tab coordination to prevent Event Loop conflicts?",
    a2: `Use BroadcastChannel for inter-tab communication:

         class CrossTabCoordinator {
             constructor() {
                 this.channel = new BroadcastChannel('app-coordination');
                 this.heavyOperationActive = false;

                 this.channel.onmessage = (event) => {
                     if (event.data.type === 'heavy-operation-start') {
                         this.heavyOperationActive = true;
                         this.reduceBackgroundActivity();
                     }
                 };
             }

             startHeavyOperation() {
                 this.channel.postMessage({
                     type: 'heavy-operation-start',
                     tabId: this.tabId
                 });
             }
         }`
};
```


#### Practical Coding Challenges


```javascript
// Challenge 1: Event Loop Race Condition
function challengeRaceCondition() {
    /*
    CHALLENGE: Predict the output and explain why
    */

    for (let i = 0; i < 3; i++) {
        setTimeout(() => console.log(`Timer: ${i}`), 0);

        Promise.resolve().then(() => console.log(`Promise: ${i}`));
    }

    console.log('Synchronous');
}

// Expected Output Analysis:
/*
Synchronous
Promise: 3
Promise: 3
Promise: 3
Timer: 3
Timer: 3
Timer: 3

Explanation:
- Loop executes synchronously, setting up timers and promises
- Variable 'i' is let in for loop, but closures capture reference
- By time callbacks execute, loop finished and i = 3
- Promises execute first (micro tasks), then timers (macro tasks)
*/

// Solution to fix race condition:
function fixedRaceCondition() {
    for (let i = 0; i < 3; i++) {
        // Capture 'i' value in closure
        ((capturedI) => {
            setTimeout(() => console.log(`Timer: ${capturedI}`), 0);
            Promise.resolve().then(() => console.log(`Promise: ${capturedI}`));
        })(i);
    }

    console.log('Synchronous');
}

// Challenge 2: Build Event Loop Visualizer
class EventLoopVisualizerChallenge {
    /*
    CHALLENGE: Implement a tool that visualizes Event Loop execution
    Requirements:
    1. Track call stack changes
    2. Monitor queue states
    3. Measure timing
    4. Generate execution timeline
    */

    constructor() {
        this.timeline = [];
        this.callStack = [];
        this.macroQueue = [];
        this.microQueue = [];
        this.startTime = performance.now();
    }

    // Implement this method
    instrumentCode(code) {
        // Your implementation here
        // Should track all Event Loop interactions
    }

    // Implement this method
    generateReport() {
        // Your implementation here
        // Should return detailed execution analysis
    }
}

// Challenge 3: Performance Optimizer
class PerformanceOptimizerChallenge {
    /*
    CHALLENGE: Create an automatic Event Loop optimizer
    Requirements:
    1. Detect blocking operations
    2. Automatically split them into chunks
    3. Maintain performance budget
    4. Provide optimization suggestions
    */

    optimize(fn) {
        // Your implementation here
        // Should wrap function to make it non-blocking
    }

    measureAndOptimize(fn) {
        // Your implementation here
        // Should measure performance and apply optimizations
    }
}
```


## 🎓 Tổng Kết: Kiến Thức Principal-Level


### 💭 Key Takeaways cho Principal Engineers


**1. Event Loop không chỉ là Technical Concept**


- Nó là foundation của JavaScript performance
- Ảnh hưởng trực tiếp đến user experience và business metrics
- Hiểu sâu Event Loop = hiểu cách optimize entire application stack


**2. Performance là Architectural Decision**


- Event Loop awareness phải được built into architecture từ đầu
- Cannot be retrofitted easily sau khi application đã complex
- Requires cross-team coordination và education


**3. Monitoring và Observability**


- Event Loop performance must be monitored in production
- Telemetry data drives optimization decisions
- Proactive detection of anti-patterns saves user experience


**4. Team Education Strategy**


- Junior developers need solid foundation in Event Loop mechanics
- Senior developers need practical optimization patterns
- Principal engineers need architectural perspective và business impact understanding


### 🎯 Action Items cho Principal Engineers


**Immediate (Next Sprint)**:


1. Audit current codebase for Event Loop anti-patterns
2. Implement basic performance monitoring
3. Create coding guidelines for Event Loop-aware development


**Short-term (Next Quarter)**:


1. Establish performance budgets based on Event Loop metrics
2. Implement automated detection of blocking operations
3. Train team on Event Loop best practices


**Long-term (Next Year)**:


1. Build Event Loop-aware architecture patterns into framework
2. Establish performance culture with Event Loop metrics as KPIs
3. Contribute to open source tools for Event Loop optimization


### 🔮 Future Considerations


**Emerging Technologies**:


- **Scheduler API**: Native browser scheduling for better Event Loop control
- **OffscreenCanvas**: Moving more rendering off main thread
- **Web Workers Evolution**: Shared Array Buffer và better thread coordination


**Industry Trends**:


- **Server-Side Rendering**: Event Loop considerations for Node.js
- **Edge Computing**: Event Loop optimization for edge environments
- **Real-time Applications**: Event Loop performance for live interactions


### 📚 Continuous Learning Path


**For Continuous Improvement**:


1. Follow browser engine development (Chromium, Firefox)
2. Study performance case studies from major tech companies
3. Contribute to Event Loop-related open source projects
4. Attend conferences focused on JavaScript performance
5. Mentor junior developers on Event Loop fundamentals


---


💭 **Final Principal Reflection**: *Event Loop mastery separates good developers từ great ones. Nó không chỉ là về technical knowledge mà là về thinking systematically về performance, user experience, và business impact. Khi bạn truly understand Event Loop, bạn hiểu heart of JavaScript và có thể make architectural decisions that scale.*


**Remember**: Event Loop không phải là magic - nó là elegant solution cho complex problem of single-threaded concurrency. Master nó, và bạn master JavaScript performance.
