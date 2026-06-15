# JavaScript Promise Error Handling Guide

## You

Continue

## Claude


# Error Handling với Promises trong JavaScript: Hành Trình Từ Cơ Bản Đến Chuyên Gia


*Từ góc nhìn của Principal Front-end Engineer có kinh nghiệm tại NAB, Axon, Binance, Webflow, và Figma*


---


## 🌟 Lời Mở Đầu: Tại Sao Error Handling Lại Quan Trọng Đến Vậy?


Khi tôi mới bắt đầu làm việc tại NAB với hệ thống banking có millions users, điều đầu tiên manager dạy tôi không phải là viết code, mà là: **"Trong production, mọi thứ có thể sai. Nhiệm vụ của chúng ta là đảm bảo ứng dụng vẫn hoạt động một cách graceful khi điều đó xảy ra."**


Promises và error handling không chỉ là một khái niệm technical, mà là philosophy về cách chúng ta xây dựng software resilient. Hôm nay, chúng ta sẽ đi từ những concepts cơ bản nhất cho đến những advanced patterns mà tôi đã áp dụng trong những hệ thống scale millions users.


---


## 📚 PHẦN I: FOUNDATION LEVEL - XÂY DỰNG NỀN TẢNG


### 🔬 Chapter 1: Promises - Từ Gốc Rễ Đến Bản Chất


#### 🌱 Nguồn Gốc & Motivation: Tại Sao Promises Được Sinh Ra?


**💭 Thought Process của tôi:** Khi tôi đầu tiên học JavaScript, tôi không hiểu tại sao cần Promises. Callback functions đã hoạt động tốt rồi mà? Cho đến khi tôi gặp phải "Callback Hell" trong một dự án thực tế...


Hãy tưởng tượng bạn đang ở năm 2010, trước khi Promises được standardized. Bạn cần thực hiện một chuỗi operations bất đồng bộ:


```javascript
// Pre-Promise Era: Callback Hell
function fetchUserData(userId, callback) {
    // Simulate API call
    setTimeout(() => {
        if (Math.random() > 0.1) { // 90% success rate
            callback(null, { id: userId, name: 'John' });
        } else {
            callback(new Error('Network error'), null);
        }
    }, 1000);
}

function fetchUserPosts(userId, callback) {
    setTimeout(() => {
        if (Math.random() > 0.1) {
            callback(null, [{ id: 1, title: 'Post 1' }]);
        } else {
            callback(new Error('Posts fetch failed'), null);
        }
    }, 1000);
}

// The Dreaded Pyramid of Doom
fetchUserData(123, (userErr, user) => {
    if (userErr) {
        console.error('User fetch failed:', userErr);
        return;
    }

    fetchUserPosts(user.id, (postsErr, posts) => {
        if (postsErr) {
            console.error('Posts fetch failed:', postsErr);
            return;
        }

        // Imagine if we need to fetch comments for each post...
        posts.forEach(post => {
            fetchPostComments(post.id, (commentsErr, comments) => {
                if (commentsErr) {
                    console.error('Comments fetch failed:', commentsErr);
                    return;
                }
                // More nesting...
            });
        });
    });
});
```


**🔥 Vấn đề của Callback Pattern:**


1. **Pyramid of Doom**: Code nesting becomes unmanageable
2. **Error Handling Duplication**: Phải check error ở mọi level
3. **Debugging Nightmare**: Stack traces become confusing
4. **No Composition**: Không thể combine/compose operations dễ dàng


**📖 Historical Context:**


- **2011**: CommonJS Promises/A spec được proposed
- **2012**: jQuery implements Deferred (tương tự Promises)
- **2015**: ES6 officially includes Promise
- **2017**: async/await makes Promises even more elegant


#### 🔬 Bản Chất & Mechanism: Promise Hoạt Động Như Thế Nào?


**💡 Mental Model Cơ Bản:**
Hãy tưởng tượng Promise như một "receipt" (biên lai) mà bạn nhận được khi order food delivery:


```
📱 Order Food (Initiate Promise)
    ↓
📋 Receipt với Order Number (Promise Object)
    ↓
⏳ Waiting... (Pending State)
    ↓
✅ Food Delivered (Fulfilled) | ❌ Order Cancelled (Rejected)
```


**⚙️ Implementation Deep Dive:**


Ở level engine, một Promise được implement như một State Machine:


```javascript
// Simplified Promise Implementation (Educational Purpose)
class SimplePromise {
    constructor(executor) {
        this.state = 'pending';
        this.value = undefined;
        this.reason = undefined;
        this.onFulfilledCallbacks = [];
        this.onRejectedCallbacks = [];

        const resolve = (value) => {
            if (this.state === 'pending') {
                this.state = 'fulfilled';
                this.value = value;
                this.onFulfilledCallbacks.forEach(callback => callback(value));
            }
        };

        const reject = (reason) => {
            if (this.state === 'pending') {
                this.state = 'rejected';
                this.reason = reason;
                this.onRejectedCallbacks.forEach(callback => callback(reason));
            }
        };

        try {
            executor(resolve, reject);
        } catch (error) {
            reject(error);
        }
    }

    then(onFulfilled, onRejected) {
        return new SimplePromise((resolve, reject) => {
            if (this.state === 'fulfilled') {
                if (!onFulfilled) {
                    resolve(this.value);
                    return;
                }
                try {
                    const result = onFulfilled(this.value);
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            } else if (this.state === 'rejected') {
                if (!onRejected) {
                    reject(this.reason);
                    return;
                }
                try {
                    const result = onRejected(this.reason);
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            } else {
                // Pending state
                this.onFulfilledCallbacks.push((value) => {
                    if (!onFulfilled) {
                        resolve(value);
                        return;
                    }
                    try {
                        const result = onFulfilled(value);
                        resolve(result);
                    } catch (error) {
                        reject(error);
                    }
                });

                this.onRejectedCallbacks.push((reason) => {
                    if (!onRejected) {
                        reject(reason);
                        return;
                    }
                    try {
                        const result = onRejected(reason);
                        resolve(result);
                    } catch (error) {
                        reject(error);
                    }
                });
            }
        });
    }

    catch(onRejected) {
        return this.then(null, onRejected);
    }
}
```


**🔍 Step-by-step Execution Flow:**


```javascript
// Phân tích từng bước execution
console.log('1. Script starts');

const promise = new Promise((resolve, reject) => {
    console.log('2. Executor runs synchronously');

    setTimeout(() => {
        console.log('4. Async operation completes');
        resolve('Success!');
    }, 1000);
});

console.log('3. Promise created, continuing sync execution');

promise.then(value => {
    console.log('5. Then handler executes:', value);
});

console.log('6. Script ends');

// Output:
// 1. Script starts
// 2. Executor runs synchronously
// 3. Promise created, continuing sync execution
// 6. Script ends
// 4. Async operation completes
// 5. Then handler executes: Success!
```


**🧠 Memory Model Analysis:**


```javascript
// Memory allocation pattern
const promise = new Promise(resolve => {
    // Heap: Promise object được allocate
    // - state: 'pending'
    // - value: undefined
    // - onFulfilledCallbacks: []
    // Stack: executor function frame

    setTimeout(() => {
        // Heap: Timer callback được queue
        resolve('data');
        // Heap: Promise state changes to 'fulfilled'
        // Heap: value = 'data'
        // Heap: onFulfilledCallbacks được execute
    }, 0);

    // Stack: executor frame pops
});

// Heap: .then registration
promise.then(value => {
    // Stack: new frame cho callback
    console.log(value);
    // Stack: frame pops
});

// Memory cleanup happens automatically via GC
// khi không còn references đến promise
```


#### 💡 Intuitive Understanding: Real-world Analogies


**🏪 Restaurant Order Analogy:**


```javascript
// Analogy: Ordering at a restaurant
const orderFood = (dish) => {
    return new Promise((resolve, reject) => {
        console.log(`👨‍🍳 Chef starts cooking ${dish}`);

        const cookingTime = Math.random() * 3000 + 1000; // 1-4 seconds
        const successRate = 0.8; // 80% success

        setTimeout(() => {
            if (Math.random() < successRate) {
                resolve(`🍽️ ${dish} is ready!`);
            } else {
                reject(new Error(`😞 Sorry, we ran out of ${dish}`));
            }
        }, cookingTime);
    });
};

// Usage
const order = orderFood('Pizza');
console.log('📋 Order placed, got receipt'); // Immediate

order
    .then(result => {
        console.log('✅ Food received:', result);
        return 'Payment completed';
    })
    .then(paymentResult => {
        console.log('💳', paymentResult);
    })
    .catch(error => {
        console.log('❌ Order failed:', error.message);
    });
```


### 🔬 Chapter 2: Error Handling Fundamentals - Tại Sao Errors Không Thể Tránh Khỏi?


#### 🌱 Nguồn Gốc & Motivation: Error Types trong JavaScript Environment


**💭 Principal's Insight:** Sau nhiều năm debugging production issues, tôi nhận ra rằng errors không phải là "bad things" mà là "expected behaviors" mà chúng ta cần handle gracefully.


**📊 Error Categories trong Real-world Applications:**


```javascript
// 1. SYNTAX ERRORS (Compile-time)
// Caught by parser, không reach runtime
function badSyntax() {
    return { // Missing closing brace - SyntaxError
}

// 2. REFERENCE ERRORS (Runtime)
function referenceErrorExample() {
    console.log(nonExistentVariable); // ReferenceError
}

// 3. TYPE ERRORS (Runtime)
function typeErrorExample() {
    const num = 42;
    num.toUpperCase(); // TypeError: num.toUpperCase is not a function
}

// 4. RANGE ERRORS (Runtime)
function rangeErrorExample() {
    const arr = new Array(-1); // RangeError: Invalid array length
}

// 5. NETWORK ERRORS (Async, most common in web apps)
async function networkErrorExample() {
    try {
        const response = await fetch('https://nonexistent-api.com/data');
        // NetworkError, TimeoutError, etc.
    } catch (error) {
        console.log('Network failed:', error);
    }
}

// 6. BUSINESS LOGIC ERRORS (Application-specific)
function validateAge(age) {
    if (age < 0) {
        throw new Error('Age cannot be negative'); // Custom business logic error
    }
    if (age > 150) {
        throw new Error('Age seems unrealistic');
    }
    return age;
}
```


**🔥 Production Error Stories từ Kinh Nghiệm Thực Tế:**


**Story 1: The NAB Banking Bug**


```javascript
// Tại NAB, chúng tôi có một bug khiến users không thể transfer money
// Root cause: Unhandled promise rejection trong validation chain

const validateTransfer = async (amount, fromAccount, toAccount) => {
    // Bug: Missing error handling ở mỗi step
    const balanceCheck = await checkBalance(fromAccount); // Có thể throw NetworkError
    const fraudCheck = await checkFraud(amount, fromAccount); // Có thể throw ValidationError
    const limitCheck = await checkDailyLimit(amount, fromAccount); // Có thể throw LimitError

    return { valid: true };
};

// Fix: Comprehensive error handling
const validateTransferFixed = async (amount, fromAccount, toAccount) => {
    try {
        const [balanceResult, fraudResult, limitResult] = await Promise.allSettled([
            checkBalance(fromAccount),
            checkFraud(amount, fromAccount),
            checkDailyLimit(amount, fromAccount)
        ]);

        // Handle specific failures gracefully
        const failures = [];

        if (balanceResult.status === 'rejected') {
            failures.push({ type: 'balance', reason: balanceResult.reason });
        }

        if (fraudResult.status === 'rejected') {
            failures.push({ type: 'fraud', reason: fraudResult.reason });
        }

        if (limitResult.status === 'rejected') {
            failures.push({ type: 'limit', reason: limitResult.reason });
        }

        if (failures.length > 0) {
            return { valid: false, failures };
        }

        return { valid: true };

    } catch (error) {
        // Catch-all for unexpected errors
        return {
            valid: false,
            failures: [{ type: 'system', reason: error }]
        };
    }
};
```


#### 🔬 Bản Chất & Mechanism: JavaScript Error Model


**⚙️ JavaScript Error Object Architecture:**


```javascript
// Error Object Anatomy
class DetailedError extends Error {
    constructor(message, code, context = {}) {
        super(message);
        this.name = this.constructor.name;
        this.code = code;
        this.context = context;
        this.timestamp = new Date().toISOString();
        this.stack = this.stack; // Capture stack trace

        // V8-specific: capture stack trace properly
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }

    toJSON() {
        return {
            name: this.name,
            message: this.message,
            code: this.code,
            context: this.context,
            timestamp: this.timestamp,
            stack: this.stack
        };
    }
}

// Usage in production
const validateUser = async (userData) => {
    try {
        if (!userData.email) {
            throw new DetailedError(
                'Email is required',
                'VALIDATION_EMAIL_MISSING',
                { userData, field: 'email' }
            );
        }

        if (!isValidEmail(userData.email)) {
            throw new DetailedError(
                'Invalid email format',
                'VALIDATION_EMAIL_INVALID',
                { email: userData.email, pattern: EMAIL_REGEX }
            );
        }

        return { valid: true };

    } catch (error) {
        // Log với full context for debugging
        console.error('User validation failed:', error.toJSON());
        throw error; // Re-throw với preserved context
    }
};
```


**🧠 Call Stack và Error Propagation:**


```javascript
// Understanding error propagation through call stack
function deepFunction() {
    console.log('📍 deepFunction called');
    throw new Error('Deep error occurred');
}

function middleFunction() {
    console.log('📍 middleFunction called');
    try {
        deepFunction();
    } catch (error) {
        console.log('🔍 Caught in middleFunction:', error.message);

        // Re-throw với additional context
        error.context = { level: 'middle', additionalInfo: 'processed' };
        throw error;
    }
}

function topFunction() {
    console.log('📍 topFunction called');
    try {
        middleFunction();
    } catch (error) {
        console.log('🔍 Caught in topFunction:', error.message);
        console.log('📋 Error context:', error.context);
        console.log('📊 Stack trace:', error.stack);
    }
}

// Call stack visualization:
// topFunction() -> middleFunction() -> deepFunction() -> throw
//                                  <- catch & re-throw
//              <- catch & handle
```


---


## 🚀 PHẦN II: PROMISE ERROR HANDLING - INTERMEDIATE LEVEL


### 🔬 Chapter 3: Promise Chain Error Handling - The Magic of .catch()


#### 🌱 Nguồn Gốc & Motivation: Tại Sao Promise Chains Powerful?


**💭 Reflection từ kinh nghiệm:** Khi tôi làm việc tại Binance với high-frequency trading data, việc handle errors trong promise chains không chỉ là về code quality, mà còn là về user experience và data integrity.


```javascript
// Real-world scenario: Cryptocurrency price aggregation
const fetchPriceFromExchanges = async (symbol) => {
    const exchanges = ['binance', 'coinbase', 'kraken'];

    // Without proper error handling (BAD)
    const badImplementation = async () => {
        const binancePrice = await fetchFromBinance(symbol);
        const coinbasePrice = await fetchFromCoinbase(symbol);
        const krakenPrice = await fetchFromKraken(symbol);

        return calculateAveragePrice([binancePrice, coinbasePrice, krakenPrice]);
        // Problem: Nếu một exchange fails, toàn bộ function fails
    };

    // With robust error handling (GOOD)
    const goodImplementation = async () => {
        const pricePromises = exchanges.map(async (exchange) => {
            try {
                switch (exchange) {
                    case 'binance':
                        return await fetchFromBinance(symbol);
                    case 'coinbase':
                        return await fetchFromCoinbase(symbol);
                    case 'kraken':
                        return await fetchFromKraken(symbol);
                    default:
                        throw new Error(`Unknown exchange: ${exchange}`);
                }
            } catch (error) {
                console.warn(`Failed to fetch from ${exchange}:`, error.message);
                return null; // Graceful degradation
            }
        });

        const results = await Promise.all(pricePromises);
        const validPrices = results.filter(price => price !== null);

        if (validPrices.length === 0) {
            throw new Error('All exchanges failed to provide price data');
        }

        return {
            averagePrice: calculateAveragePrice(validPrices),
            sources: validPrices.length,
            failed: exchanges.length - validPrices.length
        };
    };

    return goodImplementation();
};
```


#### 🔬 Bản Chất & Mechanism: Promise Chain Error Propagation


**⚙️ Error Propagation trong Promise Chains:**


```javascript
// Deep dive: How errors flow through promise chains
const demonstrateErrorFlow = () => {
    console.log('🚀 Starting promise chain...');

    return Promise.resolve('initial value')
        .then(value => {
            console.log('✅ Step 1:', value);
            return 'step 1 result';
        })
        .then(value => {
            console.log('✅ Step 2:', value);
            throw new Error('Something went wrong in step 2!');
            return 'step 2 result'; // This line never executes
        })
        .then(value => {
            console.log('❌ Step 3 SKIPPED:', value); // Skipped due to error
            return 'step 3 result';
        })
        .then(value => {
            console.log('❌ Step 4 SKIPPED:', value); // Also skipped
            return 'step 4 result';
        })
        .catch(error => {
            console.log('🔍 Caught error:', error.message);
            return 'recovered value'; // Recovery
        })
        .then(value => {
            console.log('✅ Step 5 (after recovery):', value);
            return 'final result';
        });
};

// Call để thấy flow
demonstrateErrorFlow().then(result => {
    console.log('🎯 Final result:', result);
});

// Output:
// 🚀 Starting promise chain...
// ✅ Step 1: initial value
// ✅ Step 2: step 1 result
// 🔍 Caught error: Something went wrong in step 2!
// ✅ Step 5 (after recovery): recovered value
// 🎯 Final result: final result
```


**🔍 Browser Engine Perspective:**


```javascript
// Simulating browser engine's promise handling
class PromiseExecutionVisualizer {
    constructor() {
        this.microtaskQueue = [];
        this.currentStep = 0;
    }

    scheduleTask(description, task) {
        this.microtaskQueue.push({
            id: ++this.currentStep,
            description,
            task
        });

        console.log(`📝 Scheduled: [${this.currentStep}] ${description}`);
    }

    processMicrotasks() {
        console.log('\n⚡ Processing microtask queue...');

        while (this.microtaskQueue.length > 0) {
            const { id, description, task } = this.microtaskQueue.shift();
            console.log(`🔄 Executing: [${id}] ${description}`);

            try {
                task();
            } catch (error) {
                console.log(`❌ Task [${id}] failed:`, error.message);
            }
        }

        console.log('✅ Microtask queue empty\n');
    }
}

// Demonstration
const visualizer = new PromiseExecutionVisualizer();

const demoPromise = new Promise((resolve) => {
    console.log('🚀 Promise executor runs synchronously');
    visualizer.scheduleTask('Resolve promise', () => resolve('success'));
});

demoPromise
    .then(value => {
        visualizer.scheduleTask('First .then handler', () => {
            console.log('Handler 1:', value);
            return 'modified';
        });
    })
    .catch(error => {
        visualizer.scheduleTask('Catch handler', () => {
            console.log('Caught:', error);
        });
    });

// Simulate browser's event loop
setTimeout(() => {
    visualizer.processMicrotasks();
}, 0);
```


#### 💡 Advanced Error Recovery Patterns


**🛠️ Error Recovery Strategies:**


```javascript
// Pattern 1: Retry with Exponential Backoff
class RetryablePromise {
    static async withRetry(
        promiseFactory,
        maxRetries = 3,
        baseDelay = 1000,
        backoffMultiplier = 2
    ) {
        let lastError;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`🔄 Attempt ${attempt}/${maxRetries}`);
                return await promiseFactory();

            } catch (error) {
                lastError = error;
                console.log(`❌ Attempt ${attempt} failed:`, error.message);

                if (attempt === maxRetries) {
                    throw new Error(
                        `All ${maxRetries} attempts failed. Last error: ${error.message}`
                    );
                }

                const delay = baseDelay * Math.pow(backoffMultiplier, attempt - 1);
                console.log(`⏳ Waiting ${delay}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
}

// Usage with real API
const fetchWithRetry = (url) => {
    return RetryablePromise.withRetry(
        () => fetch(url).then(response => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return response.json();
        }),
        3, // max retries
        1000, // base delay
        2 // backoff multiplier
    );
};

// Example usage
fetchWithRetry('https://api.github.com/users/octocat')
    .then(data => console.log('✅ Success:', data))
    .catch(error => console.log('❌ Final failure:', error.message));
```


**🔧 Pattern 2: Circuit Breaker**


```javascript
// Circuit Breaker Pattern for resilient systems
class CircuitBreaker {
    constructor(threshold = 5, timeout = 60000) {
        this.threshold = threshold; // Failure threshold
        this.timeout = timeout; // Time before trying again
        this.failureCount = 0;
        this.lastFailureTime = null;
        this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    }

    async call(promiseFactory) {
        if (this.state === 'OPEN') {
            if (Date.now() - this.lastFailureTime < this.timeout) {
                throw new Error('Circuit breaker is OPEN. Service unavailable.');
            } else {
                this.state = 'HALF_OPEN';
                console.log('🔄 Circuit breaker transitioning to HALF_OPEN');
            }
        }

        try {
            const result = await promiseFactory();

            // Success: Reset circuit breaker
            if (this.state === 'HALF_OPEN') {
                this.state = 'CLOSED';
                this.failureCount = 0;
                console.log('✅ Circuit breaker CLOSED (service recovered)');
            }

            return result;

        } catch (error) {
            this.failureCount++;
            this.lastFailureTime = Date.now();

            if (this.failureCount >= this.threshold) {
                this.state = 'OPEN';
                console.log('🚨 Circuit breaker OPEN (service failing)');
            }

            throw error;
        }
    }

    getState() {
        return {
            state: this.state,
            failureCount: this.failureCount,
            threshold: this.threshold
        };
    }
}

// Usage in production environment
const circuitBreaker = new CircuitBreaker(3, 5000); // 3 failures, 5s timeout

const callExternalService = async (data) => {
    try {
        return await circuitBreaker.call(async () => {
            const response = await fetch('/external-api', {
                method: 'POST',
                body: JSON.stringify(data),
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                throw new Error(`Service error: ${response.status}`);
            }

            return response.json();
        });

    } catch (error) {
        console.log('Service call failed:', error.message);
        console.log('Circuit breaker state:', circuitBreaker.getState());

        // Fallback logic
        return { fallback: true, message: 'Using cached data' };
    }
};
```


### 🔬 Chapter 4: Implicit try...catch - JavaScript's Hidden Safety Net


#### 🌱 Nguồn Gốc & Motivation: The Invisible Guardian


**💭 Insight từ debugging:** Một trong những debugging sessions khó khăn nhất của tôi tại Webflow là khi một Promise rejection không được handle, causing the entire component tree to crash. Đó là lúc tôi realize tầm quan trọng của implicit try...catch.


```javascript
// The mystery case at Webflow: Component crashes without clear reason
const MyComponent = () => {
    useEffect(() => {
        // This innocent-looking code caused production outages
        new Promise((resolve, reject) => {
            // Simulating a complex calculation
            const result = performComplexCalculation();

            // BUG: typo in variable name
            if (reesult.isValid) { // ReferenceError: reesult is not defined
                resolve(result);
            } else {
                reject(new Error('Invalid result'));
            }
        })
        .then(data => updateUI(data))
        .catch(error => {
            // Ironically, we HAD error handling, but the error occurred
            // in the executor before it could be caught
            console.error('Processing failed:', error);
        });
    }, []);

    return <div>My Component</div>;
};

// What actually happened in the browser:
// 1. Promise executor runs
// 2. ReferenceError occurs (reesult is not defined)
// 3. Implicit try...catch catches it
// 4. Promise automatically becomes rejected
// 5. Error propagates to our .catch handler
// 6. Component continues to work!
```


#### 🔬 Bản Chất & Mechanism: How Implicit try...catch Works


**⚙️ Deep Dive into Promise Executor Wrapping:**


```javascript
// Simplified implementation showing implicit try...catch
class PromiseWithExplicitTryCatch {
    constructor(executor) {
        this.state = 'pending';
        this.value = undefined;
        this.handlers = [];

        const resolve = (value) => {
            if (this.state === 'pending') {
                this.state = 'fulfilled';
                this.value = value;
                this.handlers.forEach(handler => handler.onFulfilled(value));
            }
        };

        const reject = (reason) => {
            if (this.state === 'pending') {
                this.state = 'rejected';
                this.value = reason;
                this.handlers.forEach(handler => handler.onRejected(reason));
            }
        };

        // HERE'S THE MAGIC: Implicit try...catch
        try {
            executor(resolve, reject);
        } catch (error) {
            // Any synchronous error in executor automatically rejects
            reject(error);
        }
    }

    then(onFulfilled, onRejected) {
        return new PromiseWithExplicitTryCatch((resolve, reject) => {
            const handle = () => {
                if (this.state === 'fulfilled') {
                    if (!onFulfilled) {
                        resolve(this.value);
                        return;
                    }

                    // ANOTHER implicit try...catch around handlers
                    try {
                        const result = onFulfilled(this.value);
                        resolve(result);
                    } catch (error) {
                        reject(error);
                    }

                } else if (this.state === 'rejected') {
                    if (!onRejected) {
                        reject(this.value);
                        return;
                    }

                    try {
                        const result = onRejected(this.value);
                        resolve(result); // Note: resolve, not reject!
                    } catch (error) {
                        reject(error);
                    }
                }
            };

            if (this.state === 'pending') {
                this.handlers.push({
                    onFulfilled: handle,
                    onRejected: handle
                });
            } else {
                // Execute immediately if already settled
                setTimeout(handle, 0); // Simulate microtask
            }
        });
    }
}
```


**🔍 Demonstrating Different Error Scenarios:**


```javascript
// Scenario 1: Synchronous error in executor
console.log('=== Scenario 1: Sync Error in Executor ===');
new Promise((resolve, reject) => {
    console.log('Executor running...');
    throw new Error('Sync error in executor'); // Caught by implicit try...catch
    console.log('This never executes'); // Dead code
})
.then(value => {
    console.log('Success:', value); // Skipped
})
.catch(error => {
    console.log('Caught:', error.message); // "Sync error in executor"
});

// Scenario 2: Async error in executor (NOT caught by implicit try...catch)
console.log('=== Scenario 2: Async Error in Executor ===');
new Promise((resolve, reject) => {
    console.log('Executor running...');

    setTimeout(() => {
        throw new Error('Async error in executor'); // NOT caught!
        // This becomes an unhandled error
    }, 100);
})
.then(value => {
    console.log('Success:', value); // Never executes
})
.catch(error => {
    console.log('Caught:', error.message); // Never executes
});

// Correct way for scenario 2:
console.log('=== Scenario 2 Fixed ===');
new Promise((resolve, reject) => {
    console.log('Executor running...');

    setTimeout(() => {
        try {
            // Simulating operation that might fail
            const result = riskyOperation();
            resolve(result);
        } catch (error) {
            reject(error); // Explicitly reject
        }
    }, 100);
})
.then(value => {
    console.log('Success:', value);
})
.catch(error => {
    console.log('Caught:', error.message);
});

// Scenario 3: Error in .then handler
console.log('=== Scenario 3: Error in .then Handler ===');
Promise.resolve('initial value')
    .then(value => {
        console.log('Processing:', value);

        // Simulate processing error
        const result = value.toUpperCase(); // Works fine

        // But this will fail:
        return result.nonExistentMethod(); // TypeError caught by implicit try...catch
    })
    .then(value => {
        console.log('Next step:', value); // Skipped
    })
    .catch(error => {
        console.log('Handler error caught:', error.message);
    });
```


#### 💡 Production Implications và Best Practices


**🏭 Real-world Example từ Figma: Plugin System**


```javascript
// At Figma, plugin errors can't crash the main application
class PluginRunner {
    static async executePlugin(pluginCode, context) {
        // Multiple layers of error protection

        return new Promise((resolve, reject) => {
            try {
                // Layer 1: Sync errors in setup
                const pluginFunction = new Function('context', pluginCode);

                // Layer 2: Execution with timeout
                const timeoutId = setTimeout(() => {
                    reject(new Error('Plugin execution timeout'));
                }, 30000); // 30 second timeout

                try {
                    // Layer 3: Promise wrapper for plugin execution
                    const result = pluginFunction(context);

                    // Handle both sync and async plugin returns
                    Promise.resolve(result)
                        .then(finalResult => {
                            clearTimeout(timeoutId);
                            resolve(finalResult);
                        })
                        .catch(pluginError => {
                            clearTimeout(timeoutId);
                            reject(new Error(`Plugin runtime error: ${pluginError.message}`));
                        });

                } catch (syncError) {
                    clearTimeout(timeoutId);
                    reject(new Error(`Plugin sync error: ${syncError.message}`));
                }

            } catch (setupError) {
                reject(new Error(`Plugin setup error: ${setupError.message}`));
            }
        })
        .catch(error => {
            // Layer 4: Final error handling with telemetry
            console.error('Plugin execution failed:', {
                error: error.message,
                stack: error.stack,
                pluginCode: pluginCode.substring(0, 100) + '...', // First 100 chars
                timestamp: new Date().toISOString()
            });

            // Return safe fallback instead of crashing
            return {
                success: false,
                error: error.message,
                fallback: true
            };
        });
    }
}

// Usage
const samplePlugin = `
    // Plugin code that might have errors
    if (context.selectedElements.length === 0) {
        throw new Error('No elements selected');
    }

    return context.selectedElements.map(el => ({
        id: el.id,
        type: el.type,
        // Potential error: accessing undefined property
        width: el.geometry.width
    }));
`;

PluginRunner.executePlugin(samplePlugin, {
    selectedElements: [
        { id: '1', type: 'rectangle' } // Missing geometry!
    ]
})
.then(result => {
    console.log('Plugin result:', result);
})
.catch(error => {
    console.log('This should not happen due to our error handling');
});
```


**🛡️ Defensive Programming Patterns:**


```javascript
// Pattern 1: Error Boundary for Promise Chains
class PromiseErrorBoundary {
    static wrap(promiseChain, context = {}) {
        return promiseChain
            .catch(error => {
                // Enhanced error with context
                const enhancedError = new Error(
                    `Promise chain failed: ${error.message}`
                );
                enhancedError.originalError = error;
                enhancedError.context = context;
                enhancedError.timestamp = new Date().toISOString();

                // Log to monitoring service
                this.logError(enhancedError);

                // Decide whether to re-throw or provide fallback
                if (this.isRecoverable(error)) {
                    return this.getFallback(context);
                } else {
                    throw enhancedError;
                }
            });
    }

    static isRecoverable(error) {
        // Define which errors can be recovered from
        const recoverableErrors = [
            'NetworkError',
            'TimeoutError',
            'RateLimitError'
        ];

        return recoverableErrors.some(type =>
            error.message.includes(type) ||
            error.constructor.name === type
        );
    }

    static getFallback(context) {
        return {
            fallback: true,
            message: 'Using cached or default data',
            context
        };
    }

    static logError(error) {
        // In production, this would go to your monitoring service
        console.error('Promise Error Boundary triggered:', {
            message: error.message,
            stack: error.stack,
            context: error.context,
            timestamp: error.timestamp
        });
    }
}

// Usage
const fetchUserProfile = (userId) => {
    const promiseChain = fetch(`/api/users/${userId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // Process user data
            return {
                id: data.id,
                name: data.name,
                avatar: data.avatar_url,
                // Potentially risky operations
                preferences: JSON.parse(data.preferences_json)
            };
        });

    return PromiseErrorBoundary.wrap(promiseChain, {
        operation: 'fetchUserProfile',
        userId,
        timestamp: Date.now()
    });
};
```


---


## 🎯 PHẦN III: ADVANCED ERROR HANDLING PATTERNS


### 🔬 Chapter 5: Error Rethrowing và Recovery Strategies


#### 🌱 Nguồn Gốc & Motivation: When to Recover vs When to Fail


**💭 Principal's Perspective:** Tại Axon, chúng tôi xử lý video streams từ body cameras. Một error trong video processing có thể có nghĩa là miss critical evidence. Việc quyết định khi nào retry, khi nào fail fast, và khi nào apply fallback strategies trở thành life-or-death decisions.


```javascript
// Real-world scenario: Video processing pipeline
class VideoProcessingPipeline {
    constructor(config = {}) {
        this.config = {
            maxRetries: config.maxRetries || 3,
            criticalOperations: config.criticalOperations || ['evidence_extraction'],
            fallbackStrategies: config.fallbackStrategies || {},
            ...config
        };
    }

    async processVideo(videoFile, operations) {
        const results = {};
        const errors = [];

        for (const operation of operations) {
            try {
                console.log(`🎬 Processing: ${operation.type}`);

                results[operation.type] = await this.executeOperation(
                    videoFile,
                    operation
                );

            } catch (error) {
                const errorContext = {
                    operation: operation.type,
                    videoId: videoFile.id,
                    timestamp: new Date().toISOString(),
                    attempt: 1
                };

                // Decide recovery strategy based on operation criticality
                if (this.config.criticalOperations.includes(operation.type)) {
                    // Critical operations: Retry with escalating strategies
                    try {
                        results[operation.type] = await this.retryWithEscalation(
                            videoFile,
                            operation,
                            error,
                            errorContext
                        );
                    } catch (criticalError) {
                        // Critical operation failed: Fail entire pipeline
                        throw new Error(
                            `Critical operation ${operation.type} failed: ${criticalError.message}`
                        );
                    }
                } else {
                    // Non-critical operations: Apply fallback
                    console.warn(`⚠️ Non-critical operation failed: ${operation.type}`);
                    errors.push({ ...errorContext, error: error.message });

                    const fallback = this.config.fallbackStrategies[operation.type];
                    if (fallback) {
                        results[operation.type] = await fallback(videoFile, error);
                    }
                }
            }
        }

        return {
            results,
            errors,
            success: errors.length === 0
        };
    }

    async retryWithEscalation(videoFile, operation, originalError, context) {
        const strategies = [
            () => this.executeOperation(videoFile, operation), // Direct retry
            () => this.executeWithLowerQuality(videoFile, operation), // Quality fallback
            () => this.executeWithAlternativeAlgorithm(videoFile, operation) // Algorithm fallback
        ];

        let lastError = originalError;

        for (let i = 0; i < strategies.length; i++) {
            try {
                console.log(`🔄 Retry strategy ${i + 1}/${strategies.length}`);
                return await strategies[i]();

            } catch (error) {
                lastError = error;
                context.attempt = i + 2;

                console.warn(`❌ Strategy ${i + 1} failed:`, error.message);

                if (i < strategies.length - 1) {
                    // Wait before next strategy
                    await new Promise(resolve =>
                        setTimeout(resolve, Math.pow(2, i) * 1000)
                    );
                }
            }
        }

        // All strategies failed
        throw new Error(
            `All retry strategies failed for ${operation.type}. Last error: ${lastError.message}`
        );
    }
}
```


#### 🔬 Bản Chất & Mechanism: Error Classification và Decision Trees


**⚙️ Sophisticated Error Categorization:**


```javascript
// Error classification system for intelligent handling
class ErrorClassifier {
    static categories = {
        TRANSIENT: 'transient',        // Temporary issues, should retry
        PERMANENT: 'permanent',        // Permanent issues, don't retry
        CRITICAL: 'critical',          // System-threatening, escalate immediately
        BUSINESS: 'business',          // Business logic violations
        SECURITY: 'security'           // Security-related, special handling
    };

    static classify(error) {
        const classification = {
            category: this.categories.PERMANENT,
            severity: 'medium',
            retryable: false,
            escalate: false,
            context: {}
        };

        // Network-related errors
        if (this.isNetworkError(error)) {
            classification.category = this.categories.TRANSIENT;
            classification.retryable = true;
            classification.context.type = 'network';
        }

        // Rate limiting
        else if (this.isRateLimitError(error)) {
            classification.category = this.categories.TRANSIENT;
            classification.retryable = true;
            classification.context.type = 'rate_limit';
            classification.context.backoff = this.extractBackoffTime(error);
        }

        // Authentication/Authorization
        else if (this.isAuthError(error)) {
            classification.category = this.categories.SECURITY;
            classification.severity = 'high';
            classification.escalate = true;
            classification.context.type = 'auth';
        }

        // Validation errors
        else if (this.isValidationError(error)) {
            classification.category = this.categories.BUSINESS;
            classification.severity = 'low';
            classification.context.type = 'validation';
        }

        // System errors
        else if (this.isSystemError(error)) {
            classification.category = this.categories.CRITICAL;
            classification.severity = 'critical';
            classification.escalate = true;
            classification.context.type = 'system';
        }

        return classification;
    }

    static isNetworkError(error) {
        const networkKeywords = [
            'network', 'timeout', 'connection', 'refused',
            'unreachable', 'dns', 'socket'
        ];
        return networkKeywords.some(keyword =>
            error.message.toLowerCase().includes(keyword)
        ) || error.code === 'ECONNRESET' || error.code === 'ENOTFOUND';
    }

    static isRateLimitError(error) {
        return error.status === 429 ||
               error.message.includes('rate limit') ||
               error.message.includes('too many requests');
    }

    static isAuthError(error) {
        return [401, 403].includes(error.status) ||
               ['unauthorized', 'forbidden', 'authentication'].some(keyword =>
                   error.message.toLowerCase().includes(keyword)
               );
    }

    static isValidationError(error) {
        return [400, 422].includes(error.status) ||
               error.name === 'ValidationError' ||
               error.message.includes('invalid') ||
               error.message.includes('required');
    }

    static isSystemError(error) {
        return [500, 502, 503, 504].includes(error.status) ||
               error.name === 'SystemError' ||
               ['internal server', 'service unavailable'].some(keyword =>
                   error.message.toLowerCase().includes(keyword)
               );
    }

    static extractBackoffTime(error) {
        // Extract retry-after header or calculate backoff
        if (error.headers && error.headers['retry-after']) {
            return parseInt(error.headers['retry-after']) * 1000;
        }
        return Math.random() * 5000 + 1000; // 1-6 seconds random backoff
    }
}

// Smart error handler using classification
class SmartErrorHandler {
    constructor(config = {}) {
        this.config = {
            maxRetries: 3,
            baseDelay: 1000,
            maxDelay: 30000,
            escalationCallback: null,
            ...config
        };
        this.metrics = {
            attempts: 0,
            successes: 0,
            failures: 0,
            escalations: 0
        };
    }

    async handle(promiseFactory, context = {}) {
        this.metrics.attempts++;

        for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
            try {
                const result = await promiseFactory();
                this.metrics.successes++;
                return result;

            } catch (error) {
                const classification = ErrorClassifier.classify(error);

                console.log(`🔍 Error classified:`, {
                    category: classification.category,
                    severity: classification.severity,
                    retryable: classification.retryable,
                    attempt: attempt
                });

                // Escalate critical errors immediately
                if (classification.escalate) {
                    this.metrics.escalations++;
                    if (this.config.escalationCallback) {
                        await this.config.escalationCallback(error, classification, context);
                    }
                }

                // Don't retry if not retryable or last attempt
                if (!classification.retryable || attempt === this.config.maxRetries) {
                    this.metrics.failures++;
                    throw this.enhanceError(error, classification, context);
                }

                // Calculate delay based on error type
                const delay = this.calculateDelay(attempt, classification);
                console.log(`⏳ Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    calculateDelay(attempt, classification) {
        let delay = this.config.baseDelay * Math.pow(2, attempt - 1);

        // Add jitter to prevent thundering herd
        delay += Math.random() * 1000;

        // Use specific backoff for rate limits
        if (classification.context.type === 'rate_limit' &&
            classification.context.backoff) {
            delay = classification.context.backoff;
        }

        return Math.min(delay, this.config.maxDelay);
    }

    enhanceError(originalError, classification, context) {
        const enhancedError = new Error(
            `Operation failed after classification: ${originalError.message}`
        );

        enhancedError.originalError = originalError;
        enhancedError.classification = classification;
        enhancedError.context = context;
        enhancedError.metrics = { ...this.metrics };
        enhancedError.timestamp = new Date().toISOString();

        return enhancedError;
    }

    getMetrics() {
        return { ...this.metrics };
    }
}
```


#### 💡 Advanced Recovery Patterns


**🔧 Pattern 1: Graceful Degradation with Feature Flags**


```javascript
// Feature flag system for graceful degradation
class FeatureFlaggedOperation {
    constructor(featureFlags = {}) {
        this.flags = {
            useAdvancedAlgorithm: true,
            enableCaching: true,
            allowFallbackMode: true,
            requireHighQuality: false,
            ...featureFlags
        };

        this.fallbackChain = [
            'primary',
            'cached',
            'simplified',
            'minimal'
        ];
    }

    async executeWithDegradation(operation, data, context = {}) {
        const results = [];

        for (const mode of this.fallbackChain) {
            try {
                console.log(`🎯 Attempting ${mode} mode...`);

                const result = await this.executeInMode(operation, data, mode, context);

                return {
                    success: true,
                    result,
                    mode,
                    attempts: results.length + 1,
                    degraded: mode !== 'primary'
                };

            } catch (error) {
                console.warn(`❌ ${mode} mode failed:`, error.message);

                results.push({
                    mode,
                    error: error.message,
                    timestamp: new Date().toISOString()
                });

                // Check if we should continue trying
                if (!this.shouldContinueAfterError(error, mode)) {
                    break;
                }
            }
        }

        // All modes failed
        throw new Error(
            `All degradation modes failed. Attempts: ${JSON.stringify(results)}`
        );
    }

    async executeInMode(operation, data, mode, context) {
        switch (mode) {
            case 'primary':
                return this.executePrimary(operation, data, context);

            case 'cached':
                if (!this.flags.enableCaching) {
                    throw new Error('Caching disabled');
                }
                return this.executeCached(operation, data, context);

            case 'simplified':
                if (!this.flags.allowFallbackMode) {
                    throw new Error('Fallback mode disabled');
                }
                return this.executeSimplified(operation, data, context);

            case 'minimal':
                return this.executeMinimal(operation, data, context);

            default:
                throw new Error(`Unknown mode: ${mode}`);
        }
    }

    async executePrimary(operation, data, context) {
        // Full-featured implementation
        if (this.flags.useAdvancedAlgorithm) {
            return await operation.advanced(data, context);
        } else {
            return await operation.standard(data, context);
        }
    }

    async executeCached(operation, data, context) {
        // Try to get from cache first
        const cacheKey = this.generateCacheKey(operation, data);
        const cached = await this.getFromCache(cacheKey);

        if (cached) {
            return {
                ...cached,
                fromCache: true,
                cacheAge: Date.now() - cached.timestamp
            };
        }

        // Cache miss, execute and cache
        const result = await operation.standard(data, context);
        await this.saveToCache(cacheKey, result);
        return result;
    }

    async executeSimplified(operation, data, context) {
        // Simplified version with reduced features
        const simplifiedData = this.simplifyData(data);
        const simplifiedContext = { ...context, simplified: true };

        if (operation.simplified) {
            return await operation.simplified(simplifiedData, simplifiedContext);
        } else {
            // Fallback to standard with simplified data
            return await operation.standard(simplifiedData, simplifiedContext);
        }
    }

    async executeMinimal(operation, data, context) {
        // Absolute minimal functionality
        if (operation.minimal) {
            return await operation.minimal(data, context);
        } else {
            // Last resort: return safe default
            return {
                minimal: true,
                message: 'Minimal functionality active',
                originalData: data,
                timestamp: new Date().toISOString()
            };
        }
    }

    shouldContinueAfterError(error, mode) {
        // Don't continue for security errors
        if (error.message.includes('unauthorized') ||
            error.message.includes('forbidden')) {
            return false;
        }

        // Don't continue if we're already in minimal mode
        if (mode === 'minimal') {
            return false;
        }

        // Continue for most other errors
        return true;
    }

    generateCacheKey(operation, data) {
        // Simple cache key generation
        const dataHash = JSON.stringify(data).slice(0, 100);
        return `${operation.name}-${btoa(dataHash)}`;
    }

    async getFromCache(key) {
        // In production, this would use Redis/Memcached
        const cached = localStorage.getItem(`cache_${key}`);
        if (cached) {
            const parsed = JSON.parse(cached);
            // Check if cache is still valid (e.g., within 1 hour)
            if (Date.now() - parsed.timestamp < 3600000) {
                return parsed;
            }
        }
        return null;
    }

    async saveToCache(key, data) {
        const cacheData = {
            ...data,
            timestamp: Date.now()
        };
        localStorage.setItem(`cache_${key}`, JSON.stringify(cacheData));
    }

    simplifyData(data) {
        // Remove complex/optional fields
        const simplified = { ...data };
        delete simplified.metadata;
        delete simplified.advancedOptions;
        delete simplified.experimentalFeatures;
        return simplified;
    }
}
```


### 🔬 Chapter 6: Unhandled Promise Rejections - The Silent Killers


#### 🌱 Nguồn Gốc & Motivation: When Promises Break Free


**💭 War Story từ Production:** Tại Binance, chúng tôi có một incident nghiêm trọng: một unhandled promise rejection trong price update service đã cause memory leak, dẫn đến server crash mỗi 6 giờ. Bug này tồn tại trong production 3 tuần trước khi chúng tôi identify root cause.


```javascript
// The Binance incident: Recreated (simplified)
class PriceUpdateService {
    constructor() {
        this.priceCache = new Map();
        this.subscribers = new Set();
        this.updateInterval = null;
    }

    start() {
        console.log('🚀 Starting price update service...');

        // The problematic code that caused the incident
        this.updateInterval = setInterval(() => {
            this.updatePrices(); // Missing .catch() - BIG PROBLEM!
        }, 1000);
    }

    async updatePrices() {
        const symbols = ['BTC', 'ETH', 'ADA', 'DOT'];

        // This promise chain had no error handling
        const pricePromises = symbols.map(symbol =>
            this.fetchPrice(symbol)
                .then(price => {
                    this.priceCache.set(symbol, price);
                    this.notifySubscribers(symbol, price);
                })
                // BUG: No .catch() here!
                // When fetchPrice fails, promise rejection goes unhandled
        );

        await Promise.all(pricePromises);
        // BUG: Promise.all will reject if ANY promise rejects
        // But this await is inside setInterval callback
        // So rejection can't be caught by caller
    }

    async fetchPrice(symbol) {
        // Simulating external API that sometimes fails
        const response = await fetch(`https://api.example.com/price/${symbol}`);

        if (!response.ok) {
            throw new Error(`Failed to fetch ${symbol}: ${response.status}`);
        }

        return response.json();
    }

    notifySubscribers(symbol, price) {
        this.subscribers.forEach(callback => {
            try {
                callback(symbol, price);
            } catch (error) {
                console.error('Subscriber notification failed:', error);
            }
        });
    }
}

// What happened in production:
// 1. Service starts normally
// 2. Every second, updatePrices() is called
// 3. Sometimes API fails -> fetchPrice rejects
// 4. Rejection propagates through Promise.all
// 5. No .catch() in updatePrices() -> unhandled rejection
// 6. Node.js logs warning but continues
// 7. Memory slowly leaks from unhandled promise objects
// 8. After 6 hours -> Out of memory -> Server crash
```


#### 🔬 Bản Chất & Mechanism: Understanding Unhandled Rejections


**⚙️ Browser vs Node.js Handling:**


```javascript
// Comprehensive unhandled rejection demonstration
class UnhandledRejectionDemo {
    static setupGlobalHandlers() {
        // Browser environment
        if (typeof window !== 'undefined') {
            window.addEventListener('unhandledrejection', (event) => {
                console.error('🚨 Browser unhandled rejection:', {
                    promise: event.promise,
                    reason: event.reason,
                    type: event.type,
                    timestamp: new Date().toISOString()
                });

                // Prevent browser's default behavior (console error)
                // event.preventDefault();
            });

            window.addEventListener('rejectionhandled', (event) => {
                console.log('✅ Previously unhandled rejection was handled:', {
                    promise: event.promise,
                    reason: event.reason
                });
            });
        }

        // Node.js environment
        if (typeof process !== 'undefined') {
            process.on('unhandledRejection', (reason, promise) => {
                console.error('🚨 Node.js unhandled rejection:', {
                    reason,
                    promise,
                    timestamp: new Date().toISOString()
                });

                // In production, you might want to exit
                // process.exit(1);
            });

            process.on('rejectionHandled', (promise) => {
                console.log('✅ Previously unhandled rejection was handled:', promise);
            });
        }
    }

    static demonstrateUnhandledRejection() {
        console.log('=== Demonstrating Unhandled Rejection ===');

        // Case 1: Simple unhandled rejection
        new Promise((resolve, reject) => {
            setTimeout(() => {
                reject(new Error('This rejection will be unhandled'));
            }, 100);
        });
        // No .catch() -> unhandled rejection after 100ms

        // Case 2: Delayed handling
        const delayedPromise = new Promise((resolve, reject) => {
            setTimeout(() => {
                reject(new Error('This will be handled later'));
            }, 200);
        });

        // Handle it after 500ms -> will trigger both events
        setTimeout(() => {
            delayedPromise.catch(error => {
                console.log('Handled delayed rejection:', error.message);
            });
        }, 500);

        // Case 3: Async function without await
        async function problematicFunction() {
            throw new Error('Error in async function');
        }

        // Calling async function without await -> unhandled rejection
        problematicFunction(); // No await, no .catch()

        // Case 4: Promise.all with unhandled rejection
        const promises = [
            Promise.resolve('success'),
            Promise.reject(new Error('This will be unhandled')),
            Promise.resolve('another success')
        ];

        Promise.all(promises); // No .catch() -> unhandled rejection
    }

    static demonstrateProperHandling() {
        console.log('=== Demonstrating Proper Handling ===');

        // Case 1: Immediate catch
        new Promise((resolve, reject) => {
            setTimeout(() => {
                reject(new Error('This rejection will be handled'));
            }, 100);
        })
        .catch(error => {
            console.log('✅ Caught immediate rejection:', error.message);
        });

        // Case 2: Async function with proper await
        async function safeFunction() {
            try {
                throw new Error('Error in async function');
            } catch (error) {
                console.log('✅ Caught async error:', error.message);
            }
        }

        safeFunction(); // Even without await, the error is handled internally

        // Case 3: Promise.all with error handling
        const promises = [
            Promise.resolve('success'),
            Promise.reject(new Error('This will be handled')),
            Promise.resolve('another success')
        ];

        Promise.allSettled(promises) // Use allSettled instead of all
            .then(results => {
                results.forEach((result, index) => {
                    if (result.status === 'rejected') {
                        console.log(`✅ Promise ${index} failed:`, result.reason.message);
                    } else {
                        console.log(`✅ Promise ${index} succeeded:`, result.value);
                    }
                });
            });
    }
}

// Setup and run demonstration
UnhandledRejectionDemo.setupGlobalHandlers();

setTimeout(() => {
    UnhandledRejectionDemo.demonstrateUnhandledRejection();
}, 1000);

setTimeout(() => {
    UnhandledRejectionDemo.demonstrateProperHandling();
}, 2000);
```


#### 💡 Production-Grade Unhandled Rejection Management


**🛡️ Enterprise-Level Error Monitoring:**


```javascript
// Production-ready unhandled rejection system
class ProductionErrorMonitor {
    constructor(config = {}) {
        this.config = {
            // Monitoring service configuration
            endpoint: config.endpoint || '/api/errors',
            apiKey: config.apiKey,

            // Error processing configuration
            batchSize: config.batchSize || 10,
            flushInterval: config.flushInterval || 30000, // 30 seconds

            // Filtering configuration
            ignorePatterns: config.ignorePatterns || [],
            sensitiveFields: config.sensitiveFields || ['password', 'token', 'key'],

            // Application metadata
            applicationName: config.applicationName || 'unknown',
            version: config.version || '1.0.0',
            environment: config.environment || 'production',

            ...config
        };

        this.errorQueue = [];
        this.metrics = {
            unhandledRejections: 0,
            handledErrors: 0,
            sentToMonitoring: 0,
            failed: 0
        };

        this.setupGlobalHandlers();
        this.startBatchProcessor();
    }

    setupGlobalHandlers() {
        // Unhandled promise rejections
        if (typeof window !== 'undefined') {
            window.addEventListener('unhandledrejection', (event) => {
                this.handleUnhandledRejection(event.reason, event.promise);
            });
        } else if (typeof process !== 'undefined') {
            process.on('unhandledRejection', (reason, promise) => {
                this.handleUnhandledRejection(reason, promise);
            });
        }

        // Global error handler
        if (typeof window !== 'undefined') {
            window.addEventListener('error', (event) => {
                this.handleGlobalError(event.error, {
                    filename: event.filename,
                    lineno: event.lineno,
                    colno: event.colno,
                    message: event.message
                });
            });
        } else if (typeof process !== 'undefined') {
            process.on('uncaughtException', (error) => {
                this.handleGlobalError(error, { type: 'uncaughtException' });
                // In production, you should exit after logging
                // process.exit(1);
            });
        }
    }

    handleUnhandledRejection(reason, promise) {
        this.metrics.unhandledRejections++;

        const errorData = this.createErrorData(reason, {
            type: 'unhandledRejection',
            promise: promise ? this.serializePromise(promise) : null
        });

        console.error('🚨 Unhandled Promise Rejection:', errorData);

        this.queueError(errorData);
    }

    handleGlobalError(error, context = {}) {
        this.metrics.handledErrors++;

        const errorData = this.createErrorData(error, {
            type: 'globalError',
            ...context
        });

        console.error('🚨 Global Error:', errorData);

        this.queueError(errorData);
    }

    createErrorData(error, context = {}) {
        const baseData = {
            message: error.message || String(error),
            stack: error.stack,
            name: error.name || 'Error',
            timestamp: new Date().toISOString(),
            context,

            // Application metadata
            application: this.config.applicationName,
            version: this.config.version,
            environment: this.config.environment,

            // Runtime metadata
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
            url: typeof window !== 'undefined' ? window.location.href : null,
            userId: this.getUserId(),
            sessionId: this.getSessionId()
        };

        // Add additional error properties
        Object.keys(error).forEach(key => {
            if (!baseData.hasOwnProperty(key) &&
                !this.config.sensitiveFields.includes(key)) {
                baseData[key] = error[key];
            }
        });

        return this.sanitizeErrorData(baseData);
    }

    sanitizeErrorData(errorData) {
        // Remove sensitive information
        const sanitized = JSON.parse(JSON.stringify(errorData));

        const sanitizeObject = (obj) => {
            Object.keys(obj).forEach(key => {
                if (this.config.sensitiveFields.some(field =>
                    key.toLowerCase().includes(field.toLowerCase()))) {
                    obj[key] = '[REDACTED]';
                } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                    sanitizeObject(obj[key]);
                }
            });
        };

        sanitizeObject(sanitized);
        return sanitized;
    }

    queueError(errorData) {
        // Check if error should be ignored
        if (this.shouldIgnoreError(errorData)) {
            return;
        }

        this.errorQueue.push(errorData);

        // Flush immediately if queue is full
        if (this.errorQueue.length >= this.config.batchSize) {
            this.flushErrors();
        }
    }

    shouldIgnoreError(errorData) {
        return this.config.ignorePatterns.some(pattern => {
            if (typeof pattern === 'string') {
                return errorData.message.includes(pattern);
            } else if (pattern instanceof RegExp) {
                return pattern.test(errorData.message);
            }
            return false;
        });
    }

    startBatchProcessor() {
        setInterval(() => {
            if (this.errorQueue.length > 0) {
                this.flushErrors();
            }
        }, this.config.flushInterval);
    }

    async flushErrors() {
        if (this.errorQueue.length === 0) return;

        const errors = this.errorQueue.splice(0, this.config.batchSize);

        try {
            await this.sendToMonitoring(errors);
            this.metrics.sentToMonitoring += errors.length;

        } catch (error) {
            console.error('Failed to send errors to monitoring service:', error);
            this.metrics.failed += errors.length;

            // Put errors back in queue for retry (with limit)
            if (errors.every(e => (e.retryCount || 0) < 3)) {
                errors.forEach(e => e.retryCount = (e.retryCount || 0) + 1);
                this.errorQueue.unshift(...errors);
            }
        }
    }

    async sendToMonitoring(errors) {
        if (!this.config.endpoint) {
            console.log('No monitoring endpoint configured, errors:', errors);
            return;
        }

        const payload = {
            errors,
            metadata: {
                timestamp: new Date().toISOString(),
                batchId: this.generateBatchId()
            }
        };

        const response = await fetch(this.config.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`Monitoring service responded with ${response.status}`);
        }

        return response.json();
    }

    // Utility methods
    serializePromise(promise) {
        return {
            state: this.getPromiseState(promise),
            constructor: promise.constructor.name
        };
    }

    getPromiseState(promise) {
        // This is a simplified version
        // In practice, you might use more sophisticated detection
        return 'unknown';
    }

    getUserId() {
        // Extract user ID from your authentication system
        return localStorage.getItem('userId') || 'anonymous';
    }

    getSessionId() {
        // Extract session ID
        return sessionStorage.getItem('sessionId') || 'no-session';
    }

    generateBatchId() {
        return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    getMetrics() {
        return { ...this.metrics };
    }

    // Public API for manual error reporting
    reportError(error, context = {}) {
        const errorData = this.createErrorData(error, {
            type: 'manual',
            ...context
        });

        this.queueError(errorData);
    }
}

// Usage in production
const errorMonitor = new ProductionErrorMonitor({
    endpoint: 'https://monitoring.yourapp.com/api/errors',
    apiKey: 'your-api-key',
    applicationName: 'trading-platform',
    version: '2.1.3',
    environment: 'production',
    ignorePatterns: [
        'Network request failed', // Ignore network issues
        /Script error/i // Ignore generic script errors
    ]
});

// Example: Manual error reporting
try {
    // Some risky operation
    performRiskyOperation();
} catch (error) {
    errorMonitor.reportError(error, {
        operation: 'performRiskyOperation',
        userId: getCurrentUserId(),
        additionalContext: { foo: 'bar' }
    });

    // Handle error gracefully
    showUserFriendlyMessage();
}
```


---


## 🎯 PHẦN IV: ADVANCED PATTERNS VÀ REAL-WORLD APPLICATIONS


### 🔬 Chapter 7: setTimeout Error Pattern - The Async Trap


#### 🌱 Nguồn Gốc & Motivation: Why setTimeout Breaks Promise Error Handling


**💭 The Revelation:** Trong tài liệu mà bạn share, có một task rất thú vị về "Error in setTimeout". Đây là một trong những pitfalls phổ biến nhất mà ngay cả senior engineers thường mắc phải. Hãy cùng deep dive vào why và how.


```javascript
// The problematic pattern from the document
new Promise(function(resolve, reject) {
    setTimeout(() => {
        throw new Error("Whoops!");
    }, 1000);
}).catch(alert);

// Why doesn't this work?
// Let's understand the execution flow step by step
```


#### 🔬 Bản Chất & Mechanism: Execution Context và Call Stack Analysis


**⚙️ Detailed Execution Flow Analysis:**


```javascript
// Let's trace what happens step by step
console.log('=== Tracing setTimeout Error Pattern ===');

console.log('1. Creating promise...');
const problematicPromise = new Promise(function(resolve, reject) {
    console.log('2. Promise executor runs synchronously');

    console.log('3. Setting up setTimeout...');
    setTimeout(() => {
        console.log('6. setTimeout callback executes (in different context)');
        throw new Error("Whoops!"); // This error is NOT caught!
    }, 1000);

    console.log('4. Promise executor completes');
    // Note: Promise remains in "pending" state
});

console.log('5. Attaching .catch handler...');
problematicPromise.catch(error => {
    console.log('This will NEVER execute:', error.message);
});

console.log('7. Script continues...');

// What actually happens:
// 1-5: Synchronous execution
// 6: setTimeout callback runs in global context
// Error is thrown in global context, NOT in promise context
// Promise remains pending forever
// .catch handler never triggers
```


**🧠 Call Stack Visualization:**


```javascript
// Visualizing the call stack issue
class CallStackVisualizer {
    static demonstrate() {
        console.log('📊 Call Stack Analysis:');

        console.log('\n--- Phase 1: Promise Creation ---');
        const promise = new Promise((resolve, reject) => {
            console.log('Call Stack: Promise executor');
            console.log('Context: Promise internal');

            setTimeout(() => {
                console.log('\n--- Phase 2: setTimeout Callback ---');
                console.log('Call Stack: setTimeout callback');
                console.log('Context: Global/Window');
                console.log('❌ Promise context is LOST!');

                // This error happens in global context
                throw new Error('Error in global context');
            }, 100);

            console.log('Promise executor ends, promise stays pending');
        });

        promise.catch(error => {
            console.log('This catch will never run');
        });

        // Global error handler will catch the setTimeout error
        window.addEventListener('error', (event) => {
            console.log('\n--- Phase 3: Global Error Handler ---');
            console.log('✅ Global error handler caught:', event.error.message);
            console.log('But promise remains pending...');
        });
    }
}

// Run demonstration
CallStackVisualizer.demonstrate();
```


**🔍 Multiple Patterns Showing the Same Issue:**


```javascript
// Pattern 1: setTimeout with throw (from document)
console.log('=== Pattern 1: setTimeout + throw ===');
new Promise((resolve, reject) => {
    setTimeout(() => {
        throw new Error("setTimeout error"); // NOT caught by .catch
    }, 100);
}).catch(error => console.log('Caught 1:', error.message));

// Pattern 2: setInterval with error
console.log('=== Pattern 2: setInterval + error ===');
new Promise((resolve, reject) => {
    const interval = setInterval(() => {
        clearInterval(interval);
        throw new Error("setInterval error"); // NOT caught by .catch
    }, 200);
}).catch(error => console.log('Caught 2:', error.message));

// Pattern 3: Event listeners with error
console.log('=== Pattern 3: Event Listener + error ===');
new Promise((resolve, reject) => {
    const button = document.createElement('button');
    button.addEventListener('click', () => {
        throw new Error("Event listener error"); // NOT caught by .catch
    });

    // Simulate click after 300ms
    setTimeout(() => button.click(), 300);
}).catch(error => console.log('Caught 3:', error.message));

// Pattern 4: Async callback with error
console.log('=== Pattern 4: Async Callback + error ===');
new Promise((resolve, reject) => {
    const fs = require('fs'); // Node.js example
    fs.readFile('nonexistent.txt', (err, data) => {
        if (err) {
            // This throw won't be caught by promise .catch
            throw new Error("File read error");
        }
        resolve(data);
    });
}).catch(error => console.log('Caught 4:', error.message));
```


#### 💡 Correct Solutions và Best Practices


**✅ Solution 1: Explicit Promise Control**


```javascript
// CORRECT: Use resolve/reject explicitly
console.log('=== Correct Solution 1: Explicit Control ===');

const correctPromise1 = new Promise((resolve, reject) => {
    setTimeout(() => {
        try {
            // Simulate operation that might fail
            if (Math.random() > 0.5) {
                throw new Error("Simulated error");
            }
            resolve("Success!");
        } catch (error) {
            reject(error); // Explicitly reject the promise
        }
    }, 1000);
});

correctPromise1
    .then(result => console.log('✅ Success:', result))
    .catch(error => console.log('✅ Caught correctly:', error.message));
```


**✅ Solution 2: Promisify Pattern**


```javascript
// CORRECT: Promisify async operations
console.log('=== Correct Solution 2: Promisify Pattern ===');

function delay(ms) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            try {
                // Your async operation here
                const result = performAsyncOperation();
                resolve(result);
            } catch (error) {
                reject(error);
            }
        }, ms);
    });
}

function performAsyncOperation() {
    if (Math.random() > 0.7) {
        throw new Error("Async operation failed");
    }
    return "Async operation succeeded";
}

delay(500)
    .then(result => console.log('✅ Async result:', result))
    .catch(error => console.log('✅ Async error caught:', error.message));
```


**✅ Solution 3: Modern async/await Approach**


```javascript
// CORRECT: Modern async/await pattern
console.log('=== Correct Solution 3: async/await ===');

async function modernAsyncOperation() {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            try {
                const success = Math.random() > 0.3;
                if (success) {
                    resolve("Modern async success");
                } else {
                    throw new Error("Modern async failure");
                }
            } catch (error) {
                reject(error);
            }
        }, 300);
    });
}

async function handleModernAsync() {
    try {
        const result = await modernAsyncOperation();
        console.log('✅ Modern success:', result);
    } catch (error) {
        console.log('✅ Modern error caught:', error.message);
    }
}

handleModernAsync();
```


**🛠️ Advanced Pattern: Timeout-Safe Promise Wrapper**


```javascript
// Production-ready timeout-safe promise wrapper
class TimeoutSafePromise {
    static create(asyncOperation, timeout = 5000) {
        return new Promise((resolve, reject) => {
            let isSettled = false;

            // Timeout mechanism
            const timeoutId = setTimeout(() => {
                if (!isSettled) {
                    isSettled = true;
                    reject(new Error(`Operation timed out after ${timeout}ms`));
                }
            }, timeout);

            // Safe wrapper for async operation
            const safeOperation = async () => {
                try {
                    const result = await asyncOperation();

                    if (!isSettled) {
                        isSettled = true;
                        clearTimeout(timeoutId);
                        resolve(result);
                    }
                } catch (error) {
                    if (!isSettled) {
                        isSettled = true;
                        clearTimeout(timeoutId);
                        reject(error);
                    }
                }
            };

            // Execute the safe operation
            safeOperation();
        });
    }

    static delay(ms, result) {
        return this.create(
            () => new Promise(resolve => setTimeout(() => resolve(result), ms)),
            ms + 1000 // Add buffer to timeout
        );
    }

    static delayWithError(ms, errorRate = 0.5) {
        return this.create(
            () => new Promise((resolve, reject) => {
                setTimeout(() => {
                    if (Math.random() < errorRate) {
                        reject(new Error('Delayed operation failed'));
                    } else {
                        resolve('Delayed operation succeeded');
                    }
                }, ms);
            }),
            ms + 1000
        );
    }
}

// Usage examples
console.log('=== Timeout-Safe Promise Examples ===');

// Example 1: Normal operation
TimeoutSafePromise.delay(200, 'Quick operation')
    .then(result => console.log('✅ Quick result:', result))
    .catch(error => console.log('❌ Quick error:', error.message));

// Example 2: Operation with possible error
TimeoutSafePromise.delayWithError(300, 0.7) // 70% chance of error
    .then(result => console.log('✅ Delayed result:', result))
    .catch(error => console.log('❌ Delayed error:', error.message));

// Example 3: Timeout scenario
TimeoutSafePromise.create(
    () => new Promise(resolve => {
        // Never resolves - will timeout
        console.log('Starting operation that never completes...');
    }),
    1000 // 1 second timeout
)
.then(result => console.log('This will never execute'))
.catch(error => console.log('✅ Timeout caught:', error.message));
```


### 🔬 Chapter 8: Production Error Patterns và Advanced Debugging


#### 🌱 Real-World Error Scenarios từ Big Tech


**💭 Collection of War Stories:** Qua những năm làm việc tại các công ty lớn, tôi đã collect được một số error patterns phổ biến và cách handle chúng effectively.


**🔥 Case Study 1: The Figma Plugin Cascade Failure**


```javascript
// Background: Figma plugins can modify design files in real-time
// Problem: One bad plugin crashed the entire plugin system

class FigmaPluginManager {
    constructor() {
        this.plugins = new Map();
        this.runningPlugins = new Set();
        this.errorHistory = [];
        this.circuitBreakers = new Map();
    }

    // The original problematic implementation
    async runPluginUnsafe(pluginId, command, data) {
        const plugin = this.plugins.get(pluginId);

        if (!plugin) {
            throw new Error(`Plugin ${pluginId} not found`);
        }

        // BUG: No error isolation - one plugin error crashes others
        const result = await plugin.execute(command, data);
        return result;
    }

    // The fixed implementation with comprehensive error handling
    async runPluginSafe(pluginId, command, data) {
        try {
            // Circuit breaker check
            if (this.isPluginCircuitOpen(pluginId)) {
                throw new Error(`Plugin ${pluginId} circuit breaker is open`);
            }

            const plugin = this.plugins.get(pluginId);
            if (!plugin) {
                throw new Error(`Plugin ${pluginId} not found`);
            }

            // Timeout protection
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => {
                    reject(new Error(`Plugin ${pluginId} execution timeout`));
                }, 30000); // 30 second timeout
            });

            // Resource monitoring
            const startMemory = this.getMemoryUsage();
            const startTime = Date.now();

            this.runningPlugins.add(pluginId);

            // Execute with safety measures
            const executionPromise = this.executeInSandbox(plugin, command, data);

            const result = await Promise.race([
                executionPromise,
                timeoutPromise
            ]);

            // Performance monitoring
            const endTime = Date.now();
            const endMemory = this.getMemoryUsage();

            this.recordPluginMetrics(pluginId, {
                executionTime: endTime - startTime,
                memoryDelta: endMemory - startMemory,
                success: true
            });

            return result;

        } catch (error) {
            // Error handling and recovery
            this.handlePluginError(pluginId, error);

            // Circuit breaker logic
            this.updateCircuitBreaker(pluginId, false);

            // Graceful fallback
            return this.getPluginFallback(pluginId, command, data);

        } finally {
            this.runningPlugins.delete(pluginId);
        }
    }

    async executeInSandbox(plugin, command, data) {
        // Create isolated execution context
        const sandbox = this.createSandbox();

        try {
            // Clone data to prevent mutations
            const clonedData = this.deepClone(data);

            // Execute in sandbox with resource limits
            const result = await sandbox.execute(() => {
                return plugin.execute(command, clonedData);
            });

            return result;

        } catch (error) {
            // Enhance error with sandbox context
            error.context = {
                pluginId: plugin.id,
                command,
                sandboxId: sandbox.id,
                timestamp: new Date().toISOString()
            };

            throw error;

        } finally {
            sandbox.destroy();
        }
    }

    handlePluginError(pluginId, error) {
        const errorRecord = {
            pluginId,
            error: {
                message: error.message,
                stack: error.stack,
                name: error.name
            },
            timestamp: new Date().toISOString(),
            context: error.context || {}
        };

        this.errorHistory.push(errorRecord);

        // Keep only last 100 errors
        if (this.errorHistory.length > 100) {
            this.errorHistory.shift();
        }

        // Log to monitoring system
        console.error(`Plugin ${pluginId} failed:`, errorRecord);

        // Notify plugin developer if in development mode
        if (this.isDevelopmentMode()) {
            this.notifyPluginDeveloper(pluginId, errorRecord);
        }
    }

    updateCircuitBreaker(pluginId, success) {
        let breaker = this.circuitBreakers.get(pluginId);

        if (!breaker) {
            breaker = {
                failures: 0,
                lastFailure: null,
                state: 'closed', // closed, open, half-open
                threshold: 5,
                timeout: 60000 // 1 minute
            };
            this.circuitBreakers.set(pluginId, breaker);
        }

        if (success) {
            breaker.failures = 0;
            breaker.state = 'closed';
        } else {
            breaker.failures++;
            breaker.lastFailure = Date.now();

            if (breaker.failures >= breaker.threshold) {
                breaker.state = 'open';
                console.warn(`Circuit breaker opened for plugin ${pluginId}`);
            }
        }
    }

    isPluginCircuitOpen(pluginId) {
        const breaker = this.circuitBreakers.get(pluginId);

        if (!breaker || breaker.state === 'closed') {
            return false;
        }

        if (breaker.state === 'open') {
            // Check if enough time has passed to try again
            if (Date.now() - breaker.lastFailure > breaker.timeout) {
                breaker.state = 'half-open';
                return false;
            }
            return true;
        }

        return false; // half-open state
    }

    getPluginFallback(pluginId, command, data) {
        // Provide safe fallback based on command type
        const fallbacks = {
            'transform': { transformed: false, data, reason: 'Plugin failed' },
            'export': { exported: false, format: 'original', reason: 'Plugin failed' },
            'import': { imported: false, reason: 'Plugin failed' },
            'default': { success: false, reason: 'Plugin failed' }
        };

        return fallbacks[command] || fallbacks.default;
    }

    // Utility methods
    createSandbox() {
        return {
            id: `sandbox_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            execute: async (fn) => {
                // In real implementation, this would use Web Workers or vm2
                return await fn();
            },
            destroy: () => {
                // Cleanup sandbox resources
            }
        };
    }

    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    getMemoryUsage() {
        if (typeof performance !== 'undefined' && performance.memory) {
            return performance.memory.usedJSHeapSize;
        }
        return 0;
    }

    recordPluginMetrics(pluginId, metrics) {
        // In production, send to analytics
        console.log(`Plugin ${pluginId} metrics:`, metrics);
    }

    isDevelopmentMode() {
        return process.env.NODE_ENV === 'development';
    }

    notifyPluginDeveloper(pluginId, error) {
        // Send error to plugin developer dashboard
        console.log(`Notifying developer of plugin ${pluginId}:`, error);
    }
}
```


**🔥 Case Study 2: The NAB Banking Race Condition**


```javascript
// Background: Banking operations must be absolutely consistent
// Problem: Race conditions in concurrent promise chains

class BankingTransactionManager {
    constructor() {
        this.locks = new Map();
        this.transactionHistory = new Map();
        this.balanceCache = new Map();
    }

    // The problematic implementation that caused race conditions
    async transferMoneyUnsafe(fromAccount, toAccount, amount) {
        // BUG: No locking mechanism
        const fromBalance = await this.getBalance(fromAccount);
        const toBalance = await this.getBalance(toAccount);

        if (fromBalance < amount) {
            throw new Error('Insufficient funds');
        }

        // Race condition: Between check and update, balance might change
        await this.updateBalance(fromAccount, fromBalance - amount);
        await this.updateBalance(toAccount, toBalance + amount);

        return { success: true, transactionId: this.generateId() };
    }

    // The fixed implementation with proper concurrency control
    async transferMoneySafe(fromAccount, toAccount, amount) {
        // Create transaction ID first
        const transactionId = this.generateId();

        // Acquire locks in consistent order to prevent deadlocks
        const lockOrder = [fromAccount, toAccount].sort();
        const locks = [];

        try {
            // Acquire locks
            for (const account of lockOrder) {
                await this.acquireLock(account);
                locks.push(account);
            }

            // Perform transaction within lock
            const result = await this.performTransferWithinLock(
                fromAccount,
                toAccount,
                amount,
                transactionId
            );

            return result;

        } catch (error) {
            // Rollback on error
            await this.rollbackTransaction(transactionId);
            throw error;

        } finally {
            // Release locks in reverse order
            for (const account of locks.reverse()) {
                this.releaseLock(account);
            }
        }
    }

    async performTransferWithinLock(fromAccount, toAccount, amount, transactionId) {
        // Double-check balances within lock
        const fromBalance = await this.getBalanceWithLock(fromAccount);
        const toBalance = await this.getBalanceWithLock(toAccount);

        if (fromBalance < amount) {
            throw new Error('Insufficient funds');
        }

        // Create transaction record before making changes
        const transaction = {
            id: transactionId,
            fromAccount,
            toAccount,
            amount,
            timestamp: new Date().toISOString(),
            status: 'pending',
            steps: []
        };

        this.transactionHistory.set(transactionId, transaction);

        try {
            // Step 1: Debit from source
            await this.updateBalanceWithHistory(
                fromAccount,
                fromBalance - amount,
                transactionId,
                'debit'
            );

            transaction.steps.push({
                step: 'debit',
                account: fromAccount,
                amount: -amount,
                timestamp: new Date().toISOString()
            });

            // Step 2: Credit to destination
            await this.updateBalanceWithHistory(
                toAccount,
                toBalance + amount,
                transactionId,
                'credit'
            );

            transaction.steps.push({
                step: 'credit',
                account: toAccount,
                amount: amount,
                timestamp: new Date().toISOString()
            });

            // Mark transaction as completed
            transaction.status = 'completed';
            transaction.completedAt = new Date().toISOString();

            return {
                success: true,
                transactionId,
                fromBalance: fromBalance - amount,
                toBalance: toBalance + amount
            };

        } catch (error) {
            transaction.status = 'failed';
            transaction.error = error.message;
            transaction.failedAt = new Date().toISOString();

            throw error;
        }
    }

    async acquireLock(accountId) {
        while (this.locks.has(accountId)) {
            // Wait for lock to be released
            await new Promise(resolve => setTimeout(resolve, 10));
        }

        this.locks.set(accountId, {
            acquiredAt: Date.now(),
            thread: this.getCurrentThread()
        });
    }

    releaseLock(accountId) {
        this.locks.delete(accountId);
    }

    async getBalanceWithLock(accountId) {
        if (!this.locks.has(accountId)) {
            throw new Error(`Account ${accountId} not locked`);
        }

        // In production, this would hit the database
        return this.balanceCache.get(accountId) || 0;
    }

    async updateBalanceWithHistory(accountId, newBalance, transactionId, type) {
        // Validate balance
        if (newBalance < 0) {
            throw new Error('Balance cannot be negative');
        }

        // Update cache
        this.balanceCache.set(accountId, newBalance);

        // In production, this would:
        // 1. Update database with transaction reference
        // 2. Write to audit log
        // 3. Send to real-time monitoring

        console.log(`${type.toUpperCase()}: Account ${accountId} balance updated to ${newBalance} (Transaction: ${transactionId})`);
    }

    async rollbackTransaction(transactionId) {
        const transaction = this.transactionHistory.get(transactionId);

        if (!transaction || transaction.status === 'completed') {
            return; // Nothing to rollback
        }

        // Reverse all completed steps
        for (const step of transaction.steps.reverse()) {
            try {
                if (step.step === 'debit') {
                    // Reverse debit (add money back)
                    const currentBalance = this.balanceCache.get(step.account) || 0;
                    this.balanceCache.set(step.account, currentBalance - step.amount);
                } else if (step.step === 'credit') {
                    // Reverse credit (remove money)
                    const currentBalance = this.balanceCache.get(step.account) || 0;
                    this.balanceCache.set(step.account, currentBalance - step.amount);
                }

                console.log(`Rolled back ${step.step} for account ${step.account}`);

            } catch (error) {
                console.error(`Failed to rollback step:`, step, error);
                // In production, this would trigger manual intervention
            }
        }

        transaction.status = 'rolled_back';
        transaction.rolledBackAt = new Date().toISOString();
    }

    // Utility methods
    generateId() {
        return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    getCurrentThread() {
        // In real implementation, this would return actual thread/worker ID
        return `thread_${Date.now()}`;
    }

    async getBalance(accountId) {
        // Simplified - in production this would query database
        return this.balanceCache.get(accountId) || 0;
    }

    async updateBalance(accountId, newBalance) {
        this.balanceCache.set(accountId, newBalance);
    }
}

// Usage example demonstrating race condition prevention
const bankingManager = new BankingTransactionManager();

// Setup test accounts
bankingManager.balanceCache.set('account1', 1000);
bankingManager.balanceCache.set('account2', 500);

// Simulate concurrent transfers
async function simulateConcurrentTransfers() {
    console.log('=== Testing Concurrent Transfers ===');

    const transfers = [
        bankingManager.transferMoneySafe('account1', 'account2', 100),
        bankingManager.transferMoneySafe('account1', 'account2', 200),
        bankingManager.transferMoneySafe('account2', 'account1', 150)
    ];

    try {
        const results = await Promise.allSettled(transfers);

        results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                console.log(`✅ Transfer ${index + 1} succeeded:`, result.value);
            } else {
                console.log(`❌ Transfer ${index + 1} failed:`, result.reason.message);
            }
        });

        console.log('Final balances:');
        console.log('Account 1:', bankingManager.balanceCache.get('account1'));
        console.log('Account 2:', bankingManager.balanceCache.get('account2'));

    } catch (error) {
        console.error('Concurrent transfer simulation failed:', error);
    }
}

simulateConcurrentTransfers();
```


---


## 🎯 PHẦN V: INTERVIEW QUESTIONS VÀ PRACTICAL EXERCISES


### 🤔 Interview Questions từ Basic đến Advanced


#### 📚 Level 1: Junior Developer Questions


**Q1: Giải thích sự khác biệt giữa .catch() và try...catch trong Promises**


```javascript
// Expected Answer với Explanation:
console.log('=== Q1: .catch() vs try...catch ===');

// .catch() - Promise method
Promise.reject('Promise error')
    .catch(error => {
        console.log('Caught by .catch():', error);
        // Runs in microtask queue
        // Can be chained
        return 'recovered';
    })
    .then(value => {
        console.log('After recovery:', value);
    });

// try...catch - Synchronous error handling
try {
    throw new Error('Sync error');
} catch (error) {
    console.log('Caught by try...catch:', error.message);
    // Runs immediately in current execution context
}

// GOTCHA: try...catch doesn't catch Promise rejections
try {
    Promise.reject('This will not be caught');
} catch (error) {
    console.log('This will never run');
}

// Correct way to use try...catch with async/await
async function correctUsage() {
    try {
        await Promise.reject('This WILL be caught');
    } catch (error) {
        console.log('Caught with async/await:', error);
    }
}

correctUsage();
```


**Expected Answer:**


- `.catch()` is for Promise chains, handles async rejections
- `try...catch` is for synchronous code and async/await
- `.catch()` can transform errors and continue the chain
- `try...catch` immediately handles the error in current context
- Common mistake: using try...catch around Promise-returning functions without await


**Q2: Tại sao code này không hoạt động như expected?**


```javascript
console.log('=== Q2: Debug This Code ===');

function fetchData() {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (Math.random() > 0.5) {
                resolve('Data fetched');
            } else {
                throw new Error('Fetch failed'); // BUG!
            }
        }, 1000);
    });
}

fetchData()
    .then(data => console.log('Success:', data))
    .catch(error => console.log('Error:', error.message));
```


**Expected Answer:**


- The bug is `throw new Error()` inside setTimeout
- setTimeout callback runs in different execution context
- Error should be `reject(new Error('Fetch failed'))`
- Demonstrates understanding of async execution contexts


#### 📚 Level 2: Mid-Level Developer Questions


**Q3: Implement một retry mechanism với exponential backoff**


```javascript
// Expected Implementation:
async function withRetry(
    asyncOperation,
    maxRetries = 3,
    baseDelay = 1000,
    backoffMultiplier = 2
) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await asyncOperation();
        } catch (error) {
            lastError = error;

            if (attempt === maxRetries) {
                throw new Error(
                    `Failed after ${maxRetries} attempts. Last error: ${error.message}`
                );
            }

            const delay = baseDelay * Math.pow(backoffMultiplier, attempt - 1);
            console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);

            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

// Usage example
withRetry(
    () => fetch('/api/data').then(r => r.json()),
    3,
    1000,
    2
)
.then(data => console.log('Data:', data))
.catch(error => console.error('Final failure:', error.message));
```


**Follow-up Questions:**


- How would you add jitter to prevent thundering herd?
- How would you handle different types of errors differently?
- What metrics would you collect?


**Q4: Race condition trong Promise chains**


```javascript
// Problem Code:
let counter = 0;

async function incrementCounter() {
    const current = counter;
    await new Promise(resolve => setTimeout(resolve, 100));
    counter = current + 1;
}

// What will be the final value of counter?
Promise.all([
    incrementCounter(),
    incrementCounter(),
    incrementCounter()
]);
```


**Expected Answer:**


- Final value will be 1, not 3 (race condition)
- Explain the read-modify-write problem
- Solutions: locks, atomic operations, queue-based processing


#### 📚 Level 3: Senior Developer Questions


**Q5: Design một comprehensive error handling system cho microservices**


```javascript
// Expected Design:
class MicroserviceErrorHandler {
    constructor(config) {
        this.serviceName = config.serviceName;
        this.environment = config.environment;
        this.monitoring = config.monitoring;
        this.circuitBreakers = new Map();
        this.retryPolicies = config.retryPolicies || {};
    }

    async handleServiceCall(serviceCall, options = {}) {
        const {
            serviceName,
            operation,
            timeout = 5000,
            retryPolicy = 'default'
        } = options;

        // Circuit breaker check
        if (this.isCircuitOpen(serviceName)) {
            throw new ServiceUnavailableError(serviceName);
        }

        // Add timeout
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new TimeoutError(serviceName, timeout)), timeout);
        });

        try {
            const result = await Promise.race([serviceCall(), timeoutPromise]);
            this.recordSuccess(serviceName);
            return result;

        } catch (error) {
            return this.handleError(error, serviceName, operation, retryPolicy);
        }
    }

    async handleError(error, serviceName, operation, retryPolicy) {
        // Classify error
        const classification = this.classifyError(error);

        // Record failure
        this.recordFailure(serviceName, classification);

        // Apply retry policy
        if (classification.retryable && this.shouldRetry(retryPolicy)) {
            return this.retryWithPolicy(operation, retryPolicy);
        }

        // Apply fallback
        const fallback = this.getFallback(serviceName, operation);
        if (fallback) {
            return fallback;
        }

        // Escalate error
        throw this.enhanceError(error, serviceName, classification);
    }

    classifyError(error) {
        // Implementation depends on error types
        if (error instanceof TimeoutError) {
            return { type: 'timeout', retryable: true, severity: 'medium' };
        }
        if (error.status >= 500) {
            return { type: 'server', retryable: true, severity: 'high' };
        }
        if (error.status === 429) {
            return { type: 'ratelimit', retryable: true, severity: 'low' };
        }
        if (error.status >= 400 && error.status < 500) {
            return { type: 'client', retryable: false, severity: 'medium' };
        }

        return { type: 'unknown', retryable: false, severity: 'high' };
    }
}

class ServiceUnavailableError extends Error {
    constructor(serviceName) {
        super(`Service ${serviceName} is currently unavailable`);
        this.name = 'ServiceUnavailableError';
        this.serviceName = serviceName;
    }
}

class TimeoutError extends Error {
    constructor(serviceName, timeout) {
        super(`Service ${serviceName} timed out after ${timeout}ms`);
        this.name = 'TimeoutError';
        this.serviceName = serviceName;
        this.timeout = timeout;
    }
}
```


**Evaluation Criteria:**


- Understanding of distributed systems challenges
- Error classification and handling strategies
- Circuit breaker patterns
- Monitoring and observability
- Graceful degradation


**Q6: Memory leak prevention trong Promise chains**


```javascript
// Problem: Identify memory leaks in this code
class DataProcessor {
    constructor() {
        this.cache = new Map();
        this.pendingOperations = new Map();
    }

    async processData(id, data) {
        // Potential memory leak: pendingOperations not cleaned up
        if (this.pendingOperations.has(id)) {
            return this.pendingOperations.get(id);
        }

        const promise = this.performProcessing(id, data)
            .then(result => {
                this.cache.set(id, result);
                return result;
            })
            .catch(error => {
                // Memory leak: error references kept in promise chain
                throw error;
            });

        this.pendingOperations.set(id, promise);
        return promise;
    }

    async performProcessing(id, data) {
        // Simulate long-running operation
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (Math.random() > 0.1) {
                    resolve(`Processed ${id}`);
                } else {
                    reject(new Error(`Processing failed for ${id}`));
                }
            }, Math.random() * 5000);
        });
    }
}
```


**Expected Solutions:**


- Clean up pendingOperations after completion
- Implement cache eviction policies
- Use WeakMap where appropriate
- Monitor memory usage patterns


#### 📚 Level 4: Principal/Staff Engineer Questions


**Q7: Design error handling strategy cho một high-frequency trading system**


**Expected Considerations:**


- Sub-millisecond error recovery
- Partial failure handling
- Data consistency guarantees
- Regulatory compliance
- Risk management integration
- Real-time monitoring and alerting


**Q8: Implement distributed promise coordination**


```javascript
// Design a system where promises across multiple nodes coordinate
class DistributedPromiseCoordinator {
    constructor(nodeId, cluster) {
        this.nodeId = nodeId;
        this.cluster = cluster;
        this.distributedPromises = new Map();
    }

    async createDistributedPromise(promiseId, participantNodes) {
        // Implement 2-phase commit for promise resolution
        // Handle node failures during coordination
        // Ensure exactly-once semantics
    }

    async resolveDistributedPromise(promiseId, value) {
        // Coordinate resolution across all participant nodes
        // Handle split-brain scenarios
        // Ensure consistency
    }
}
```


### 🎯 Practical Exercises


#### 🛠️ Exercise 1: Build a Promise-based Task Queue


```javascript
// Implement a task queue that:
// 1. Processes tasks with configurable concurrency
// 2. Retries failed tasks with backoff
// 3. Provides progress tracking
// 4. Handles priority tasks
// 5. Supports task cancellation

class TaskQueue {
    constructor(concurrency = 3) {
        this.concurrency = concurrency;
        this.running = new Set();
        this.queue = [];
        this.priorityQueue = [];
        this.results = new Map();
        this.metrics = {
            completed: 0,
            failed: 0,
            cancelled: 0
        };
    }

    async add(task, options = {}) {
        // Implementation required
    }

    async process() {
        // Implementation required
    }

    cancel(taskId) {
        // Implementation required
    }

    getProgress() {
        // Implementation required
    }
}

// Test cases
const queue = new TaskQueue(2);

// Add various tasks
queue.add(() => delay(1000).then(() => 'Task 1'));
queue.add(() => delay(500).then(() => 'Task 2'), { priority: 'high' });
queue.add(() => Promise.reject(new Error('Task 3 fails')), { retries: 3 });

queue.process().then(results => {
    console.log('All tasks completed:', results);
});
```


#### 🛠️ Exercise 2: Error Recovery Dashboard


```javascript
// Build a real-time error monitoring dashboard that:
// 1. Displays error rates by service
// 2. Shows circuit breaker states
// 3. Provides error trend analysis
// 4. Allows manual error recovery actions
// 5. Sends alerts for critical errors

class ErrorDashboard {
    constructor() {
        this.services = new Map();
        this.errorHistory = [];
        this.alerts = [];
        this.subscribers = new Set();
    }

    recordError(serviceName, error, context) {
        // Implementation required
    }

    getErrorRate(serviceName, timeWindow = 3600000) {
        // Implementation required
    }

    getCircuitBreakerState(serviceName) {
        // Implementation required
    }

    subscribe(callback) {
        // Implementation required
    }

    triggerRecovery(serviceName) {
        // Implementation required
    }
}
```


---


## 🏆 PHẦN VI: MASTERY VERIFICATION & PRACTICAL APPLICATIONS


### ✅ Self-Assessment Checkpoints


#### 🔍 Level 1: Foundation Understanding


**Checkpoint 1.1: Basic Promise Error Flow**


```javascript
// Can you predict the output of this code?
console.log('Start');

Promise.resolve('A')
    .then(value => {
        console.log('Then 1:', value);
        throw new Error('Error in then 1');
    })
    .then(value => {
        console.log('Then 2:', value); // Will this run?
    })
    .catch(error => {
        console.log('Catch 1:', error.message);
        return 'Recovered';
    })
    .then(value => {
        console.log('Then 3:', value);
    })
    .catch(error => {
        console.log('Catch 2:', error.message); // Will this run?
    });

console.log('End');

// Expected Output:
// Start
// End
// Then 1: A
// Catch 1: Error in then 1
// Then 3: Recovered
```


**Self-Check Questions:**


1. Why doesn't "Then 2" execute?
2. Why doesn't "Catch 2" execute?
3. What's the execution order and why?


**Checkpoint 1.2: Implicit try...catch Understanding**


```javascript
// Debug và fix những issues trong code này:
const buggyPromiseChain = () => {
    return new Promise((resolve, reject) => {
        // Bug 1: Synchronous error
        const data = JSON.parse('invalid json');
        resolve(data);
    })
    .then(data => {
        // Bug 2: Accessing undefined property
        return data.users.map(user => user.name);
    })
    .then(names => {
        // Bug 3: Calling non-existent method
        return names.toUppercase();
    });
};

// Your fixed version should handle all errors gracefully
```


#### 🔍 Level 2: Intermediate Patterns


**Checkpoint 2.1: Error Recovery Strategies**


```javascript
// Implement a robust API call with multiple fallback strategies
async function robustApiCall(url, options = {}) {
    const strategies = [
        () => fetch(url, options),
        () => fetch(url + '?fallback=true', options),
        () => fetch('/api/cached/' + btoa(url), options),
        () => Promise.resolve({ fallback: true, data: null })
    ];

    // Your implementation here
    // Should try each strategy in order
    // Should handle different error types appropriately
    // Should provide meaningful error context
}

// Test your implementation
robustApiCall('https://api.example.com/data')
    .then(result => console.log('Result:', result))
    .catch(error => console.log('All strategies failed:', error));
```


**Checkpoint 2.2: Concurrency Control**


```javascript
// Implement promise-based resource locking
class ResourceLock {
    constructor() {
        this.locks = new Map();
    }

    async withLock(resourceId, operation) {
        // Your implementation:
        // 1. Acquire lock for resourceId
        // 2. Execute operation
        // 3. Release lock even if operation fails
        // 4. Handle concurrent access properly
    }
}

// Test concurrent access
const lock = new ResourceLock();
const results = await Promise.all([
    lock.withLock('resource1', async () => {
        await delay(100);
        return 'Operation 1';
    }),
    lock.withLock('resource1', async () => {
        await delay(50);
        return 'Operation 2';
    })
]);
// Should execute operations sequentially, not concurrently
```


#### 🔍 Level 3: Advanced Patterns


**Checkpoint 3.1: Distributed Error Handling**


```javascript
// Design error handling for microservices communication
class MicroserviceClient {
    constructor(serviceName, config) {
        this.serviceName = serviceName;
        this.config = config;
        this.circuitBreaker = new CircuitBreaker(config.circuitBreaker);
        this.retryPolicy = new RetryPolicy(config.retry);
    }

    async call(endpoint, data, options = {}) {
        // Your implementation should handle:
        // 1. Circuit breaker logic
        // 2. Retry with backoff
        // 3. Timeout management
        // 4. Error classification
        // 5. Fallback strategies
        // 6. Monitoring/metrics
    }
}

// Test distributed error scenarios
const userService = new MicroserviceClient('user-service', {
    circuitBreaker: { threshold: 5, timeout: 30000 },
    retry: { maxAttempts: 3, backoff: 'exponential' },
    timeout: 5000
});
```


**Checkpoint 3.2: Memory Management**


```javascript
// Identify và fix memory leaks trong Promise chains
class DataCache {
    constructor() {
        this.cache = new Map();
        this.pendingRequests = new Map();
        this.subscribers = new Map();
    }

    async getData(key) {
        // This implementation has memory leaks - find and fix them
        if (this.cache.has(key)) {
            return this.cache.get(key);
        }

        if (this.pendingRequests.has(key)) {
            return this.pendingRequests.get(key);
        }

        const promise = this.fetchData(key)
            .then(data => {
                this.cache.set(key, data);
                this.notifySubscribers(key, data);
                return data;
            })
            .catch(error => {
                this.notifySubscribers(key, null, error);
                throw error;
            });

        this.pendingRequests.set(key, promise);
        return promise;
    }

    subscribe(key, callback) {
        if (!this.subscribers.has(key)) {
            this.subscribers.set(key, new Set());
        }
        this.subscribers.get(key).add(callback);
    }

    // Add cleanup methods to prevent memory leaks
}
```


### 🎯 Production Readiness Checklist


#### ✅ Error Handling Maturity Assessment


**Level 1: Basic Error Handling**


- All Promise chains have .catch() handlers
- Async functions use try...catch appropriately
- Errors include meaningful messages
- No unhandled promise rejections in console


**Level 2: Robust Error Handling**


- Error classification system implemented
- Retry mechanisms with exponential backoff
- Circuit breaker pattern for external services
- Graceful degradation strategies
- Error context preservation through call stacks


**Level 3: Production-Grade Error Handling**


- Comprehensive error monitoring and alerting
- Error recovery automation
- Performance impact analysis of error handling
- Security implications of error messages considered
- Compliance requirements met (logging, retention)


**Level 4: Enterprise-Scale Error Handling**


- Distributed error correlation across services
- Real-time error trending and prediction
- Automated error diagnosis and resolution
- Error handling as part of chaos engineering
- Team training and knowledge sharing programs


### 🚀 Next Steps: From Understanding to Mastery


#### 📈 Skill Development Roadmap


**Phase 1: Solidify Foundations (2-4 weeks)**


1. Practice basic Promise patterns daily
2. Build small projects focusing on error handling
3. Read production codebases for error handling patterns
4. Set up comprehensive error monitoring in personal projects


**Phase 2: Advanced Patterns (1-2 months)**


1. Implement retry libraries and circuit breakers
2. Study distributed systems error handling
3. Contribute to open-source projects with focus on reliability
4. Design error handling for high-scale applications


**Phase 3: Expertise Development (3-6 months)**


1. Lead error handling architecture decisions
2. Mentor others on error handling best practices
3. Write technical articles on advanced error patterns
4. Speak at conferences about reliability


## Claude


#### 📚 Recommended Learning Resources


**Books & Articles:**


1. **"Async JavaScript" by Trevor Burnham** - Deep dive into async patterns
2. **"You Don't Know JS: Async & Performance"** - Kyle Simpson's excellent coverage
3. **"Designing Data-Intensive Applications"** - Martin Kleppmann (for distributed error handling)
4. **MDN Promise Documentation** - Always up-to-date reference


**Practical Projects:**


1. Build a robust HTTP client library
2. Create a distributed task queue system
3. Implement a real-time error monitoring dashboard
4. Design a fault-tolerant microservices communication layer


---


## 🔧 PHẦN VII: ADVANCED DEBUGGING & PERFORMANCE OPTIMIZATION


### 🐛 Chapter 9: Advanced Debugging Techniques


#### 🔍 Promise State Introspection


**💡 Advanced Debugging Toolkit:**


### ⚡ Chapter 10: Performance Optimization trong Error Handling


#### 🎯 Error Handling Performance Patterns


**💡 The Hidden Costs của Error Handling:**


```javascript
// Performance Analysis: Error Handling Overhead
class PerformanceAnalyzer {
    static async measureErrorHandlingOverhead() {
        const iterations = 100000;

        console.log('🔬 Measuring error handling performance...');

        // Test 1: No error handling
        const start1 = performance.now();
        for (let i = 0; i < iterations; i++) {
            await Promise.resolve(i);
        }
        const time1 = performance.now() - start1;

        // Test 2: With .catch() but no errors
        const start2 = performance.now();
        for (let i = 0; i < iterations; i++) {
            await Promise.resolve(i).catch(() => {});
        }
        const time2 = performance.now() - start2;

        // Test 3: With try...catch but no errors
        const start3 = performance.now();
        for (let i = 0; i < iterations; i++) {
            try {
                await Promise.resolve(i);
            } catch (error) {
                // Handle error
            }
        }
        const time3 = performance.now() - start3;

        // Test 4: With actual errors (10% error rate)
        const start4 = performance.now();
        for (let i = 0; i < iterations; i++) {
            try {
                if (Math.random() < 0.1) {
                    throw new Error('Test error');
                }
                await Promise.resolve(i);
            } catch (error) {
                // Handle error
            }
        }
        const time4 = performance.now() - start4;

        console.log('📊 Performance Results:');
        console.log(`No error handling: ${time1.toFixed(2)}ms`);
        console.log(`With .catch() (no errors): ${time2.toFixed(2)}ms (+${((time2/time1-1)*100).toFixed(1)}%)`);
        console.log(`With try...catch (no errors): ${time3.toFixed(2)}ms (+${((time3/time1-1)*100).toFixed(1)}%)`);
        console.log(`With actual errors (10%): ${time4.toFixed(2)}ms (+${((time4/time1-1)*100).toFixed(1)}%)`);
    }

    static measureStackTraceImpact() {
        console.log('🔬 Measuring stack trace performance impact...');

        const iterations = 10000;

        // Test 1: Simple error creation
        const start1 = performance.now();
        for (let i = 0; i < iterations; i++) {
            new Error('Simple error');
        }
        const time1 = performance.now() - start1;

        // Test 2: Error with stack trace capture
        const start2 = performance.now();
        for (let i = 0; i < iterations; i++) {
            const error = new Error('Error with stack');
            Error.captureStackTrace(error, this.measureStackTraceImpact);
        }
        const time2 = performance.now() - start2;

        // Test 3: Deep call stack error
        const createDeepError = (depth) => {
            if (depth === 0) {
                return new Error('Deep stack error');
            }
            return createDeepError(depth - 1);
        };

        const start3 = performance.now();
        for (let i = 0; i < iterations; i++) {
            createDeepError(10);
        }
        const time3 = performance.now() - start3;

        console.log('📊 Stack Trace Performance:');
        console.log(`Simple error: ${time1.toFixed(2)}ms`);
        console.log(`With stack capture: ${time2.toFixed(2)}ms (+${((time2/time1-1)*100).toFixed(1)}%)`);
        console.log(`Deep stack (10 levels): ${time3.toFixed(2)}ms (+${((time3/time1-1)*100).toFixed(1)}%)`);
    }
}

// Run performance tests
PerformanceAnalyzer.measureErrorHandlingOverhead();
PerformanceAnalyzer.measureStackTraceImpact();
```


**🚀 Optimization Strategies:**


```javascript
// Strategy 1: Error Object Pooling
class ErrorPool {
    constructor(initialSize = 10) {
        this.pool = [];
        this.inUse = new Set();

        // Pre-allocate error objects
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(this.createError());
        }
    }

    createError() {
        const error = new Error();
        error.reset = function(message, code, context) {
            this.message = message;
            this.code = code;
            this.context = context;
            this.timestamp = Date.now();
            return this;
        };
        return error;
    }

    acquire(message, code, context) {
        let error;

        if (this.pool.length > 0) {
            error = this.pool.pop();
            error.reset(message, code, context);
        } else {
            error = this.createError().reset(message, code, context);
        }

        this.inUse.add(error);
        return error;
    }

    release(error) {
        if (this.inUse.has(error)) {
            this.inUse.delete(error);

            // Clean up error for reuse
            error.message = '';
            error.code = null;
            error.context = null;
            error.timestamp = null;

            // Return to pool if not at capacity
            if (this.pool.length < 20) {
                this.pool.push(error);
            }
        }
    }

    getStats() {
        return {
            poolSize: this.pool.length,
            inUse: this.inUse.size,
            totalAllocated: this.pool.length + this.inUse.size
        };
    }
}

// Usage
const errorPool = new ErrorPool();

async function optimizedOperation() {
    const error = errorPool.acquire(
        'Operation failed',
        'OP_FAILED',
        { operation: 'optimizedOperation' }
    );

    try {
        // Use the error if needed
        if (Math.random() < 0.1) {
            throw error;
        }

        return 'Success';

    } finally {
        // Always return error to pool
        errorPool.release(error);
    }
}
```


**🎯 Strategy 2: Lazy Stack Trace Generation**


```javascript
// Optimized Error Class with Lazy Stack Traces
class LazyError extends Error {
    constructor(message, code, context) {
        super(message);
        this.name = 'LazyError';
        this.code = code;
        this.context = context;
        this.timestamp = Date.now();

        // Don't generate stack trace immediately
        this._stackGenerated = false;
        this._originalStack = null;

        // Override stack property with lazy generation
        Object.defineProperty(this, 'stack', {
            get: this.getStack.bind(this),
            set: this.setStack.bind(this)
        });
    }

    getStack() {
        if (!this._stackGenerated) {
            this.generateStack();
        }
        return this._originalStack;
    }

    setStack(value) {
        this._originalStack = value;
        this._stackGenerated = true;
    }

    generateStack() {
        if (this._stackGenerated) return;

        // Create a new error to capture current stack
        const captureError = new Error();
        Error.captureStackTrace(captureError, LazyError);

        // Process and clean up stack trace
        const stack = captureError.stack;
        const lines = stack.split('\n');

        // Remove internal frames and add our error info
        this._originalStack = [
            `${this.name}: ${this.message}`,
            ...lines.slice(1).filter(line =>
                !line.includes('LazyError') &&
                !line.includes('node_modules')
            )
        ].join('\n');

        this._stackGenerated = true;
    }

    // Method to serialize without triggering stack generation
    toJSON() {
        return {
            name: this.name,
            message: this.message,
            code: this.code,
            context: this.context,
            timestamp: this.timestamp,
            hasStack: this._stackGenerated
        };
    }

    // Force stack generation when needed
    captureStack() {
        this.generateStack();
        return this;
    }
}

// Performance comparison
async function compareErrorPerformance() {
    const iterations = 10000;

    console.log('🔬 Comparing error creation performance...');

    // Test 1: Standard Error
    const start1 = performance.now();
    for (let i = 0; i < iterations; i++) {
        new Error('Standard error');
    }
    const time1 = performance.now() - start1;

    // Test 2: LazyError (no stack access)
    const start2 = performance.now();
    for (let i = 0; i < iterations; i++) {
        new LazyError('Lazy error', 'TEST', {});
    }
    const time2 = performance.now() - start2;

    // Test 3: LazyError with stack access
    const start3 = performance.now();
    for (let i = 0; i < iterations; i++) {
        const error = new LazyError('Lazy error with stack', 'TEST', {});
        error.stack; // Access stack to trigger generation
    }
    const time3 = performance.now() - start3;

    console.log('📊 Error Creation Performance:');
    console.log(`Standard Error: ${time1.toFixed(2)}ms`);
    console.log(`LazyError (no stack): ${time2.toFixed(2)}ms (${((time2/time1-1)*100).toFixed(1)}% change)`);
    console.log(`LazyError (with stack): ${time3.toFixed(2)}ms (${((time3/time1-1)*100).toFixed(1)}% change)`);
}

compareErrorPerformance();
```


### 🔄 Chapter 11: Error Handling Patterns for Different Architectures


#### 🏗️ Microservices Error Propagation


```javascript
// Comprehensive Microservices Error Handling System
class MicroserviceErrorManager {
    constructor(config) {
        this.serviceName = config.serviceName;
        this.version = config.version;
        this.correlationService = config.correlationService;
        this.circuitBreakers = new Map();
        this.errorMetrics = new Map();
        this.retryPolicies = config.retryPolicies || {};
    }

    // Centralized error handling for all service calls
    async handleServiceCall(serviceCall, context = {}) {
        const {
            targetService,
            operation,
            correlationId = this.generateCorrelationId(),
            timeout = 5000,
            retryPolicy = 'default'
        } = context;

        const startTime = Date.now();
        const callContext = {
            sourceService: this.serviceName,
            targetService,
            operation,
            correlationId,
            startTime,
            requestId: this.generateRequestId()
        };

        try {
            // Pre-call validations
            this.validateServiceCall(callContext);

            // Circuit breaker check
            if (this.isCircuitOpen(targetService)) {
                throw new CircuitBreakerOpenError(targetService, callContext);
            }

            // Execute call with timeout and monitoring
            const result = await this.executeWithMonitoring(
                serviceCall,
                callContext,
                timeout
            );

            // Record success metrics
            this.recordSuccess(callContext, Date.now() - startTime);

            return result;

        } catch (error) {
            // Comprehensive error handling
            return this.handleCallError(error, callContext, retryPolicy);
        }
    }

    async executeWithMonitoring(serviceCall, context, timeout) {
        // Add distributed tracing headers
        const tracingContext = this.createTracingContext(context);

        // Timeout wrapper
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
                reject(new ServiceTimeoutError(
                    context.targetService,
                    timeout,
                    context
                ));
            }, timeout);
        });

        // Execute with monitoring
        const resultPromise = serviceCall(tracingContext);

        return Promise.race([resultPromise, timeoutPromise]);
    }

    async handleCallError(error, context, retryPolicy) {
        const classification = this.classifyError(error);
        const errorContext = {
            ...context,
            error: {
                name: error.name,
                message: error.message,
                code: error.code,
                status: error.status
            },
            classification,
            timestamp: new Date().toISOString()
        };

        // Record error metrics
        this.recordError(errorContext);

        // Update circuit breaker
        this.updateCircuitBreaker(context.targetService, false);

        // Determine if retry is appropriate
        if (classification.retryable && this.shouldRetry(retryPolicy, context)) {
            return this.retryWithPolicy(
                context.originalCall,
                errorContext,
                retryPolicy
            );
        }

        // Apply fallback strategies
        const fallbackResult = await this.applyFallback(errorContext);
        if (fallbackResult) {
            return fallbackResult;
        }

        // Enhance and propagate error
        throw this.enhanceError(error, errorContext);
    }

    classifyError(error) {
        // Sophisticated error classification
        const classifications = {
            network: {
                patterns: [/network/i, /connection/i, /timeout/i, /unreachable/i],
                retryable: true,
                severity: 'medium',
                category: 'infrastructure'
            },
            authentication: {
                patterns: [/auth/i, /unauthorized/i, /forbidden/i],
                retryable: false,
                severity: 'high',
                category: 'security'
            },
            rateLimit: {
                patterns: [/rate.?limit/i, /too.?many.?requests/i],
                status: [429],
                retryable: true,
                severity: 'low',
                category: 'throttling'
            },
            serverError: {
                status: [500, 502, 503, 504],
                retryable: true,
                severity: 'high',
                category: 'server'
            },
            clientError: {
                status: [400, 404, 422],
                retryable: false,
                severity: 'medium',
                category: 'client'
            }
        };

        for (const [type, config] of Object.entries(classifications)) {
            if (this.matchesClassification(error, config)) {
                return {
                    type,
                    ...config,
                    confidence: this.calculateConfidence(error, config)
                };
            }
        }

        return {
            type: 'unknown',
            retryable: false,
            severity: 'high',
            category: 'unknown',
            confidence: 0.5
        };
    }

    matchesClassification(error, config) {
        // Check status codes
        if (config.status && error.status) {
            if (config.status.includes(error.status)) {
                return true;
            }
        }

        // Check message patterns
        if (config.patterns) {
            const message = error.message || '';
            return config.patterns.some(pattern => pattern.test(message));
        }

        return false;
    }

    async applyFallback(errorContext) {
        const fallbackStrategies = {
            'user-service': {
                'getProfile': () => this.getCachedProfile(errorContext),
                'updateProfile': () => this.queueProfileUpdate(errorContext)
            },
            'payment-service': {
                'processPayment': () => this.queuePayment(errorContext),
                'getBalance': () => this.getCachedBalance(errorContext)
            }
        };

        const serviceStrategies = fallbackStrategies[errorContext.targetService];
        if (!serviceStrategies) return null;

        const strategy = serviceStrategies[errorContext.operation];
        if (!strategy) return null;

        try {
            const result = await strategy();

            // Mark as fallback result
            return {
                ...result,
                _fallback: true,
                _fallbackReason: errorContext.error.message,
                _originalError: errorContext.error
            };

        } catch (fallbackError) {
            console.warn('Fallback strategy failed:', fallbackError);
            return null;
        }
    }

    enhanceError(originalError, context) {
        // Create enhanced error with full context
        const enhancedError = new DistributedServiceError(
            originalError.message,
            originalError.code || 'SERVICE_ERROR',
            context
        );

        // Preserve original error
        enhancedError.originalError = originalError;
        enhancedError.serviceChain = this.buildServiceChain(context);
        enhancedError.correlationId = context.correlationId;
        enhancedError.requestId = context.requestId;

        return enhancedError;
    }

    buildServiceChain(context) {
        // Build chain of service calls for debugging
        return [
            {
                service: context.sourceService,
                operation: 'call',
                timestamp: new Date(context.startTime).toISOString()
            },
            {
                service: context.targetService,
                operation: context.operation,
                timestamp: context.timestamp,
                failed: true
            }
        ];
    }

    // Utility methods
    generateCorrelationId() {
        return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    createTracingContext(context) {
        return {
            'X-Correlation-ID': context.correlationId,
            'X-Request-ID': context.requestId,
            'X-Source-Service': context.sourceService,
            'X-Operation': context.operation
        };
    }

    recordSuccess(context, duration) {
        const key = `${context.targetService}:${context.operation}`;

        if (!this.errorMetrics.has(key)) {
            this.errorMetrics.set(key, {
                successes: 0,
                failures: 0,
                totalDuration: 0,
                lastSuccess: null
            });
        }

        const metrics = this.errorMetrics.get(key);
        metrics.successes++;
        metrics.totalDuration += duration;
        metrics.lastSuccess = Date.now();
    }

    recordError(context) {
        const key = `${context.targetService}:${context.operation}`;

        if (!this.errorMetrics.has(key)) {
            this.errorMetrics.set(key, {
                successes: 0,
                failures: 0,
                totalDuration: 0,
                lastFailure: null,
                errorTypes: new Map()
            });
        }

        const metrics = this.errorMetrics.get(key);
        metrics.failures++;
        metrics.lastFailure = Date.now();

        // Track error types
        const errorType = context.classification.type;
        const errorCount = metrics.errorTypes.get(errorType) || 0;
        metrics.errorTypes.set(errorType, errorCount + 1);
    }

    getMetrics() {
        const summary = {};

        for (const [key, metrics] of this.errorMetrics) {
            const total = metrics.successes + metrics.failures;
            const successRate = total > 0 ? (metrics.successes / total) * 100 : 0;
            const avgDuration = metrics.successes > 0 ?
                metrics.totalDuration / metrics.successes : 0;

            summary[key] = {
                successRate: successRate.toFixed(2) + '%',
                totalCalls: total,
                averageDuration: avgDuration.toFixed(2) + 'ms',
                errorTypes: Object.fromEntries(metrics.errorTypes)
            };
        }

        return summary;
    }
}

// Custom Error Classes for Microservices
class DistributedServiceError extends Error {
    constructor(message, code, context) {
        super(message);
        this.name = 'DistributedServiceError';
        this.code = code;
        this.context = context;
        this.timestamp = new Date().toISOString();
    }

    toJSON() {
        return {
            name: this.name,
            message: this.message,
            code: this.code,
            context: this.context,
            timestamp: this.timestamp,
            serviceChain: this.serviceChain,
            correlationId: this.correlationId,
            requestId: this.requestId
        };
    }
}

class CircuitBreakerOpenError extends DistributedServiceError {
    constructor(serviceName, context) {
        super(`Circuit breaker is open for service: ${serviceName}`, 'CIRCUIT_BREAKER_OPEN', context);
        this.name = 'CircuitBreakerOpenError';
        this.serviceName = serviceName;
    }
}

class ServiceTimeoutError extends DistributedServiceError {
    constructor(serviceName, timeout, context) {
        super(`Service ${serviceName} timed out after ${timeout}ms`, 'SERVICE_TIMEOUT', context);
        this.name = 'ServiceTimeoutError';
        this.serviceName = serviceName;
        this.timeout = timeout;
    }
}
```


---


## 📋 PHẦN VIII: COMPREHENSIVE REFERENCE & QUICK GUIDES


### 📖 Quick Reference Cards


#### 🎯 Error Handling Decision Tree


### 🎓 Mastery Graduation Checklist


**🏆 Junior Level Mastery (Foundation)**


- Understand Promise states and transitions
- Can explain .catch() vs try...catch differences
- Know implicit try...catch behavior
- Can debug basic Promise chain errors
- Understand setTimeout error pattern pitfall


**🏆 Mid-Level Mastery (Practical)**


- Implement retry mechanisms with backoff
- Handle concurrent Promise errors appropriately
- Design error classification systems
- Apply circuit breaker patterns
- Optimize error handling performance


**🏆 Senior Level Mastery (Advanced)**


- Design distributed error handling strategies
- Implement comprehensive error monitoring
- Handle memory leaks in Promise chains
- Create fault-tolerant microservices communication
- Lead error handling architecture decisions


**🏆 Principal Level Mastery (Expert)**


- Design organization-wide error handling standards
- Implement cross-platform error correlation
- Build advanced debugging and analysis tools
- Mentor teams on error handling best practices
- Contribute to error handling ecosystem (open source, conferences)


---


## 🎯 CONCLUSION: FROM UNDERSTANDING TO MASTERY


### 🚀 The Journey We've Taken


Chúng ta đã cùng nhau đi qua một hành trình comprehensive về Promise error handling, từ những concepts cơ bản nhất cho đến những advanced patterns được sử dụng trong production systems tại các công ty tech hàng đầu.


**🌟 Key Takeaways:**


1. **Error handling không chỉ là defensive programming** - Đó là một fundamental aspect của designing resilient systems
2. **Context matters** - Promise errors behave differently from synchronous errors
3. **Performance implications** - Error handling có cost, nhưng có thể được optimized
4. **Observability is crucial** - Không thể improve những gì không measure được
5. **Team education** - Error handling patterns cần được shared across engineering teams


### 💡 The Mindset Shift


Từ kinh nghiệm của tôi qua những năm tại NAB, Axon, Binance, Webflow, và Figma, mindset quan trọng nhất về error handling là:


**"Errors are not exceptions - they are expected behaviors that we must handle gracefully."**


### 🔮 Future Trends và Emerging Patterns


**1. AI-Powered Error Recovery**


- Machine learning models để predict và prevent errors
- Automated error resolution based on historical patterns
- Intelligent fallback strategy selection


**2. Quantum-Resistant Error Handling**


- Error patterns trong quantum computing environments
- Handling quantum decoherence và probabilistic failures


**3. Edge Computing Error Patterns**


- Distributed error handling across edge nodes
- Network partition tolerance strategies
- Real-time error propagation across geographic boundaries


### 🎯 Your Next Steps


**Immediate Actions (This Week):**


1. Audit your current codebase for unhandled Promise rejections
2. Implement global error handlers in your applications
3. Add retry mechanisms to external API calls
4. Set up basic error monitoring


**Short-term Goals (Next Month):**


1. Design and implement a comprehensive error classification system
2. Add circuit breakers to critical service dependencies
3. Create error handling documentation for your team
4. Implement performance monitoring for error handling overhead


**Long-term Vision (Next Quarter):**


1. Lead error handling architecture decisions in your organization
2. Contribute to open-source error handling libraries
3. Speak at conferences about resilient system design
4. Mentor other engineers on advanced error handling patterns


### 🙏 Final Words


Error handling is both an art and a science. Nó đòi hỏi technical depth, practical experience, và empathy cho users khi things go wrong.


Những patterns và strategies mà chúng ta đã explore không chỉ là code - chúng represent years of collective learning từ engineering teams worldwide, lessons learned from production outages, và innovations born from necessity.


**Remember:** Every error you handle gracefully is a moment when your users don't experience frustration. Every fallback strategy you implement is a step toward building more resilient systems. Every monitoring dashboard you create is a tool that helps your team sleep better at night.


**Keep learning, keep building, và nhất quan trọng - keep handling errors with grace.**


---


*"In the world of distributed systems, it's not about preventing all errors - it's about handling them so well that users never notice when things go wrong."*


**- Principal Engineering Wisdom**


🎉 **Congratulations!** Bạn đã complete một comprehensive journey through Promise error handling. Từ basic concepts đến advanced production patterns, bạn now have the knowledge và tools để build truly resilient applications.


**Happy coding, và may your Promise chains always resolve successfully!** 🚀✨


## Claude


# 🚀 Promise Error Handling Quick Reference Guide


## 🔄 Error Handling Decision Tree


```
Error Occurs
     ↓
Is it in Promise context?
     ↓
┌─ YES ──────────────┐        ┌─ NO ───────────────┐
│   Use .catch()     │        │   Use try...catch  │
│   Can chain        │        │   Immediate handle │
│   Microtask queue  │        │   Sync execution   │
└────────────────────┘        └────────────────────┘
     ↓                             ↓
Can error be recovered?        Log and handle
     ↓                         appropriately
┌─ YES ──────┐    ┌─ NO ─────┐
│ Return      │    │ Re-throw │
│ fallback    │    │ or fail  │
│ Continue    │    │ graceful │
│ chain       │    │          │
└─────────────┘    └──────────┘
```


## 🎯 Common Patterns Quick Lookup


### ✅ Basic Error Handling


```javascript
// ✅ GOOD: Basic promise error handling
promise
  .then(result => processResult(result))
  .catch(error => handleError(error));

// ✅ GOOD: Async/await error handling
try {
  const result = await promise;
  return processResult(result);
} catch (error) {
  return handleError(error);
}
```


### ❌ Common Anti-Patterns


```javascript
// ❌ BAD: setTimeout error won't be caught
new Promise((resolve, reject) => {
  setTimeout(() => {
    throw new Error("Won't be caught!");
  }, 1000);
}).catch(console.error);

// ✅ GOOD: Explicit rejection
new Promise((resolve, reject) => {
  setTimeout(() => {
    try {
      // risky operation
      resolve(result);
    } catch (error) {
      reject(error);
    }
  }, 1000);
}).catch(console.error);
```


### 🔄 Retry Patterns


```javascript
// ✅ Basic retry with exponential backoff
async function withRetry(fn, maxRetries = 3, baseDelay = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) throw error;

      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```


### 🔀 Parallel Error Handling


```javascript
// ✅ Handle some failures gracefully
const results = await Promise.allSettled([
  fetchUser(),
  fetchPosts(),
  fetchComments()
]);

const successful = results
  .filter(r => r.status === 'fulfilled')
  .map(r => r.value);

const failed = results
  .filter(r => r.status === 'rejected')
  .map(r => r.reason);
```


## 🛡️ Error Classification System


### 🏷️ Error Categories


```
CategoryRetryableSeverityExamplesNetwork✅ YesMediumConnection timeout, DNS failureServer✅ YesHigh500, 502, 503, 504 errorsClient❌ NoMedium400, 404, 422 errorsAuth❌ NoHigh401, 403 errorsRate Limit✅ YesLow429 errorsBusiness❌ NoVariableValidation, business rule violations
```


### 🎯 Error Handling Strategy Matrix


```
Error TypeImmediate ActionRetry StrategyFallbackAlert LevelTransientLog warningExponential backoffCache/DefaultLowPermanentLog errorNo retryGraceful degradationMediumCriticalLog criticalCircuit breakerFail safeHighSecurityLog securityNo retryBlock requestCritical
```


## 🔧 Debugging Checklist


### 🔍 When Debugging Promise Errors


- Check if error is in Promise vs global context
- Verify .catch() handlers are attached
- Look for unhandled promise rejections in console
- Check execution order (async vs sync)
- Examine stack traces for context switches
- Monitor memory usage for leaks
- Validate error propagation through chains


### 📊 Performance Considerations


```javascript
// ✅ Optimize error handling performance
class OptimizedErrorHandler {
  constructor() {
    this.errorPool = []; // Reuse error objects
    this.fastPaths = new Map(); // Cache common errors
  }

  handleError(error, context) {
    // Use fast paths for common errors
    const fastPath = this.fastPaths.get(error.code);
    if (fastPath) return fastPath(error, context);

    // Full error processing for complex cases
    return this.fullErrorProcessing(error, context);
  }
}
```


## 🏭 Production Patterns


### 🚨 Error Monitoring Setup


```javascript
// Global error handler setup
window.addEventListener('unhandledrejection', event => {
  console.error('Unhandled promise rejection:', event.reason);

  // Send to monitoring service
  sendToMonitoring({
    type: 'unhandledRejection',
    error: event.reason,
    timestamp: Date.now(),
    url: window.location.href,
    userAgent: navigator.userAgent
  });
});
```


### 🔄 Circuit Breaker Pattern


```javascript
class CircuitBreaker {
  constructor(threshold = 5, timeout = 60000) {
    this.threshold = threshold;
    this.timeout = timeout;
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
  }

  async call(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime < this.timeout) {
        throw new Error('Circuit breaker is OPEN');
      }
      this.state = 'HALF_OPEN';
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
    }
  }
}
```


## 📈 Best Practices Summary


### ✅ Do's


- Always handle Promise rejections
- Use specific error types and codes
- Implement proper retry strategies
- Monitor error rates and patterns
- Provide meaningful error messages
- Test error scenarios thoroughly
- Use circuit breakers for external services
- Implement graceful degradation


### ❌ Don'ts


- Don't ignore Promise rejections
- Don't use generic error handling for everything
- Don't retry non-retryable errors
- Don't expose sensitive information in errors
- Don't let errors crash the entire application
- Don't forget to clean up resources in error cases
- Don't rely solely on try...catch for async code


## 🎯 Testing Error Scenarios


```javascript
// Test framework for error scenarios
describe('Error Handling', () => {
  it('should handle network errors gracefully', async () => {
    const mockFetch = jest.fn().mockRejectedValue(
      new Error('Network error')
    );

    const result = await apiCall('/test', { fetch: mockFetch });

    expect(result.fallback).toBe(true);
    expect(result.error).toBe('Network error');
  });

  it('should retry transient errors', async () => {
    const mockFetch = jest.fn()
      .mockRejectedValueOnce(new Error('Transient error'))
      .mockResolvedValue({ data: 'success' });

    const result = await withRetry(() => apiCall('/test', { fetch: mockFetch }));

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(result.data).toBe('success');
  });
});
```


## 🔗 Additional Resources


- [MDN Promise Documentation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
- [Error Handling Best Practices](https://www.toptal.com/nodejs/node-js-error-handling)
- [Circuit Breaker Pattern](https://martinfowler.com/bliki/CircuitBreaker.html)
- [Microservices Error Handling](https://microservices.io/patterns/reliability/circuit-breaker.html)
