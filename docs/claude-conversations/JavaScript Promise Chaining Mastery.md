# JavaScript Promise Chaining Mastery

## Claude


# Promise Chaining: Hành Trình Từ Callback Hell Đến Asynchronous Mastery


*Phân tích chuyên sâu từ góc độ Principal Front-end Engineer với kinh nghiệm tại NAB, Axon, Binance, Webflow, Figma*


---


## 🌱 Nguồn Gốc & Motivation: Tại Sao Promise Chaining Tồn Tại?


### 📚 Historical Context: Cuộc Khủng Hoảng Callback Hell


Trước khi chúng ta dive sâu vào Promise chaining, hãy hiểu tại sao concept này được sinh ra. Quay về năm 2010, JavaScript development còn rất primitive. Khi tôi làm việc tại các dự án đầu tiên, chúng ta phải deal với callback hell - một vấn đề mà mọi JavaScript developer đều phải trải qua.


**Vấn đề cốt lõi:** JavaScript là single-threaded, nhưng web applications cần xử lý nhiều asynchronous operations:


- Network requests
- File operations
- User interactions
- Timers và animations


**Trước Promise era, chúng ta code như thế này:**


```javascript
// Callback Hell - Code thực tế từ dự án NAB năm 2015
function loadUserProfile(userId, callback) {
    getUserData(userId, function(err, userData) {
        if (err) {
            callback(err, null);
            return;
        }

        getPermissions(userData.id, function(err, permissions) {
            if (err) {
                callback(err, null);
                return;
            }

            getPreferences(userData.id, function(err, preferences) {
                if (err) {
                    callback(err, null);
                    return;
                }

                generateDashboard(userData, permissions, preferences, function(err, dashboard) {
                    if (err) {
                        callback(err, null);
                        return;
                    }

                    callback(null, {
                        user: userData,
                        permissions: permissions,
                        preferences: preferences,
                        dashboard: dashboard
                    });
                });
            });
        });
    });
}
```


**💭 Think Out Loud - Suy nghĩ thầm lặng:**
*"Khi tôi đầu tiên nhìn thấy code như này tại NAB, tôi nghĩ: 'Tại sao code JavaScript lại khó đọc đến vậy?' Callback hell không chỉ là vấn đề về syntax, mà là fundamental design problem. Error handling phải repeat ở mọi level, code grow theo chiều ngang thay vì chiều dọc, và worst case scenario - khi cần modify logic, bạn phải refactor toàn bộ pyramid."*


### 🔬 Problem Analysis - Tại Sao Callback Pattern Fail?


**1. Cognitive Overhead:**


- Human brain xử lý information linearly (top to bottom)
- Callback pattern force chúng ta think inside-out
- Error handling scattered khắp nơi


**2. Maintenance Nightmare:**


- Adding new step = refactor entire chain
- Error propagation phức tạp
- Testing individual steps cực kỳ khó


**3. Composition Impossibility:**


- Không thể compose callbacks như functions
- Reusability gần như zero
- Parallel execution requires complex coordination


## 💡 Promise: The Game Changer


### 🌟 Bản Chất Promise - Hiểu Từ First Principles


**Promise là gì?**
Promise không phải là magic. Nó là một design pattern implement State Machine pattern để wrap asynchronous operations.


**Core Mechanism - Computer Science Perspective:**


```javascript
// Simplified Promise implementation để hiểu mechanism
class SimplePromise {
    constructor(executor) {
        this.state = 'pending';  // pending, fulfilled, rejected
        this.value = undefined;
        this.onFulfilledCallbacks = [];
        this.onRejectedCallbacks = [];

        const resolve = (value) => {
            if (this.state === 'pending') {
                this.state = 'fulfilled';
                this.value = value;
                this.onFulfilledCallbacks.forEach(cb => cb(value));
            }
        };

        const reject = (reason) => {
            if (this.state === 'pending') {
                this.state = 'rejected';
                this.value = reason;
                this.onRejectedCallbacks.forEach(cb => cb(reason));
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
            const handleFulfilled = () => {
                try {
                    const result = onFulfilled(this.value);
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            };

            const handleRejected = () => {
                try {
                    const result = onRejected(this.value);
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            };

            if (this.state === 'fulfilled') {
                handleFulfilled();
            } else if (this.state === 'rejected') {
                handleRejected();
            } else {
                this.onFulfilledCallbacks.push(handleFulfilled);
                this.onRejectedCallbacks.push(handleRejected);
            }
        });
    }
}
```


**💭 Think Out Loud:**
*"Aha moment đầu tiên khi tôi hiểu Promise: Nó là một wrapper around future value! Promise không làm async operation trở thành sync. Thay vào đó, nó provide một cách elegant để chain operations và handle errors. Key insight: Promise always return một Promise khác, tạo ra chainable interface."*


---


## 🔗 PROMISE CHAINING: THE CORE CONCEPT


### 📖 Định Nghĩa & Bản Chất


Promise Chaining là pattern cho phép chúng ta connect nhiều asynchronous operations thành một sequence, trong đó output của operation trước sẽ become input của operation sau.


**Core Principle:** Mỗi `.then()` call return một Promise mới, cho phép chain tiếp theo.


### 🔬 Mechanism Deep Dive


**1. Basic Chaining Anatomy:**


```javascript
// Anatomy của một promise chain
new Promise((resolve, reject) => {
    // Initial async operation
    setTimeout(() => resolve(1), 1000);
})
.then(function(result) { // Handler 1
    console.log(result); // 1
    return result * 2;   // Return value becomes resolved value của promise mới
})
.then(function(result) { // Handler 2
    console.log(result); // 2
    return result * 2;   // Chain tiếp tục
})
.then(function(result) { // Handler 3
    console.log(result); // 4
    return result * 2;
});
```


**Step-by-step Execution Flow:**


1. **Initial Promise Creation:**

State: pending
Executor function chạy ngay lập tức
setTimeout schedule resolve(1) sau 1 giây
2. **First .then() Call:**

Return một Promise mới (Promise A)
Register handler function vào callback queue của original promise
Promise A vẫn đang pending
3. **Second .then() Call:**

Return Promise B
Register handler vào Promise A's callback queue
Promise B pending
4. **Third .then() Call:**

Return Promise C
Register handler vào Promise B's callback queue
5. **Resolution Cascade:**

Original promise resolves với value 1
Handler 1 chạy, return 2
Promise A resolves với value 2
Handler 2 chạy, return 4
Promise B resolves với value 4
Handler 3 chạy, return 8
Promise C resolves với value 8


**💭 Think Out Loud:**
*"Một misconception common mà tôi thấy junior developers mắc: nghĩ rằng .then() modify original Promise. Thực tế, mỗi .then() tạo ra Promise hoàn toàn mới. Đây là functional programming principle - immutability. Original Promise never changes state sau khi settled."*


### ⚙️ Browser Engine Implementation


**V8 Engine Perspective:**


```javascript
// Pseudo-code cho V8's Promise implementation
class V8Promise {
    constructor(executor) {
        this.[[PromiseState]] = 'pending';
        this.[[PromiseResult]] = undefined;
        this.[[PromiseFulfillReactions]] = [];
        this.[[PromiseRejectReactions]] = [];

        // V8 tạo ra resolve và reject functions
        const resolve = (value) => {
            if (this.[[PromiseState]] === 'pending') {
                // State transition
                this.[[PromiseState]] = 'fulfilled';
                this.[[PromiseResult]] = value;

                // Trigger all pending reactions
                this.[[PromiseFulfillReactions]].forEach(reaction => {
                    // Schedule reaction to run on next tick
                    queueMicrotask(() => reaction.handler(value));
                });
            }
        };

        // Execute với error handling
        try {
            executor(resolve, reject);
        } catch (error) {
            reject(error);
        }
    }
}
```


**Memory Model Analysis:**


Khi chúng ta chain promises, V8 tạo ra linked list của Promise objects:


```
Original Promise → Promise A → Promise B → Promise C
     ↓               ↓           ↓           ↓
  Handler 0      Handler 1   Handler 2   Handler 3
```


Mỗi Promise maintain references đến:


- Previous promise (để listen for resolution)
- Handler functions
- Next promise (để propagate value)


**Call Stack & Event Loop Interaction:**


```javascript
console.log('Start');

Promise.resolve(1)
    .then(result => {
        console.log('Then 1:', result);
        return result * 2;
    })
    .then(result => {
        console.log('Then 2:', result);
        return result * 2;
    });

console.log('End');

// Output:
// Start
// End
// Then 1: 1
// Then 2: 2
```


**Execution Timeline:**


1. **Synchronous Phase:**

console.log('Start') - vào call stack, execute, pop
Promise.resolve(1) - tạo fulfilled promise, return về then chain
.then() calls register handlers vào microtask queue
console.log('End') - execute
2. **Microtask Phase:**

Event loop check microtask queue
Execute first handler: log 'Then 1: 1', return 2
Second handler được schedule vào microtask queue
Execute second handler: log 'Then 2: 2'


**💭 Think Out Loud:**
*"Khi debug Promise chains tại Binance, tôi thường dùng Chrome DevTools Performance tab để track microtask execution. Key insight: Promises always resolve asynchronously, even khi value already available. Đây là guarantee của spec để ensure consistent behavior."*


---


## 🏗️ PROMISE CHAINING PATTERNS - SENIOR LEVEL


### 1. Value Transformation Chains


**Pattern:** Transform data qua multiple steps


```javascript
// Real-world example từ Webflow project
function processUserUpload(file) {
    return validateFile(file)
        .then(validatedFile => {
            console.log('✅ File validated:', validatedFile.name);
            return compressImage(validatedFile);
        })
        .then(compressedFile => {
            console.log('✅ Image compressed:', compressedFile.size);
            return uploadToS3(compressedFile);
        })
        .then(s3Response => {
            console.log('✅ Uploaded to S3:', s3Response.url);
            return generateThumbnail(s3Response.url);
        })
        .then(thumbnail => {
            console.log('✅ Thumbnail generated:', thumbnail.url);
            return {
                originalUrl: s3Response.url,
                thumbnailUrl: thumbnail.url,
                metadata: {
                    size: compressedFile.size,
                    dimensions: thumbnail.dimensions
                }
            };
        });
}

// Usage
processUserUpload(selectedFile)
    .then(result => {
        updateUI(result);
        showSuccessMessage('Upload completed!');
    })
    .catch(error => {
        console.error('Upload failed:', error);
        showErrorMessage(error.message);
    });
```


**Deep Analysis:**


Trong pattern này, mỗi step transform data:


- `validateFile`: File → ValidatedFile
- `compressImage`: ValidatedFile → CompressedFile
- `uploadToS3`: CompressedFile → S3Response
- `generateThumbnail`: S3Url → ThumbnailData


**Performance Considerations:**


```javascript
// Optimized version với parallel processing cho independent operations
function processUserUploadOptimized(file) {
    return validateFile(file)
        .then(validatedFile => {
            // Compress và generate metadata song song
            const compressionPromise = compressImage(validatedFile);
            const metadataPromise = extractMetadata(validatedFile);

            return Promise.all([compressionPromise, metadataPromise]);
        })
        .then(([compressedFile, metadata]) => {
            return uploadToS3(compressedFile, metadata);
        })
        .then(s3Response => {
            // Generate thumbnail và update database song song
            const thumbnailPromise = generateThumbnail(s3Response.url);
            const dbUpdatePromise = updateDatabase(s3Response);

            return Promise.all([thumbnailPromise, dbUpdatePromise])
                .then(([thumbnail, dbResult]) => ({
                    ...s3Response,
                    thumbnail,
                    dbResult
                }));
        });
}
```


**💭 Think Out Loud:**
*"Lesson learned từ Webflow: Khi chain promises, always think về opportunities for parallel execution. Don't chain unnecessarily khi operations có thể run concurrently. Promise.all() is your friend, but beware - nếu một promise reject, cả chain sẽ fail."*


### 2. Conditional Chaining Pattern


**Problem:** Sometimes bạn cần conditional logic trong promise chain.


```javascript
// Anti-pattern: Nested then
function getUserDataBad(userId) {
    return fetchUser(userId)
        .then(user => {
            if (user.isPremium) {
                return fetchPremiumFeatures(user.id)
                    .then(features => {
                        return { ...user, features };
                    });
            } else {
                return user;
            }
        });
}

// Better pattern: Flat chaining với conditional returns
function getUserDataGood(userId) {
    let userData;

    return fetchUser(userId)
        .then(user => {
            userData = user;

            // Conditional promise return
            if (user.isPremium) {
                return fetchPremiumFeatures(user.id);
            }

            // Return resolved promise để maintain chain
            return Promise.resolve(null);
        })
        .then(features => {
            return {
                ...userData,
                features: features || []
            };
        });
}

// Functional approach với higher-order functions
function getUserDataFunctional(userId) {
    const addFeatures = (user) => {
        if (user.isPremium) {
            return fetchPremiumFeatures(user.id)
                .then(features => ({ ...user, features }));
        }
        return Promise.resolve(user);
    };

    return fetchUser(userId)
        .then(addFeatures);
}
```


**Advanced Conditional Pattern:**


```javascript
// Pattern cho complex conditional flows từ NAB banking project
function processTransaction(transactionData) {
    return validateTransaction(transactionData)
        .then(validatedData => {
            // Chain conditionally based on transaction type
            switch (validatedData.type) {
                case 'TRANSFER':
                    return processTransfer(validatedData);
                case 'PAYMENT':
                    return processPayment(validatedData);
                case 'WITHDRAWAL':
                    return processWithdrawal(validatedData);
                default:
                    return Promise.reject(new Error('Invalid transaction type'));
            }
        })
        .then(processedTransaction => {
            // Common post-processing
            return Promise.all([
                logTransaction(processedTransaction),
                updateBalance(processedTransaction),
                sendNotification(processedTransaction)
            ]).then(() => processedTransaction);
        });
}

function processTransfer(data) {
    return checkSourceAccount(data.from)
        .then(sourceAccount => {
            if (sourceAccount.balance < data.amount) {
                throw new Error('Insufficient funds');
            }
            return checkDestinationAccount(data.to);
        })
        .then(destinationAccount => {
            return executeTransfer(data, destinationAccount);
        });
}
```


**💭 Think Out Loud:**
*"Conditional chaining là một trong những challenges khó nhất khi design promise flows. Tại NAB, chúng tôi often encounter business logic phức tạp với nhiều edge cases. Key principle: Keep chains flat bằng cách extract conditional logic thành separate functions. Avoid nesting promises trong .then() handlers."*


### 3. Error Recovery Patterns


**Pattern:** Graceful degradation và retry logic


```javascript
// Error recovery với fallbacks
function fetchUserWithFallback(userId) {
    return fetchUserFromPrimaryDB(userId)
        .catch(primaryError => {
            console.warn('Primary DB failed:', primaryError.message);
            return fetchUserFromSecondaryDB(userId);
        })
        .catch(secondaryError => {
            console.warn('Secondary DB failed:', secondaryError.message);
            return fetchUserFromCache(userId);
        })
        .catch(cacheError => {
            console.error('All sources failed:', cacheError.message);
            return createGuestUser(userId);
        });
}

// Retry pattern với exponential backoff
function fetchWithRetry(url, maxRetries = 3, baseDelay = 1000) {
    function attempt(retriesLeft) {
        return fetch(url)
            .catch(error => {
                if (retriesLeft === 0) {
                    throw error;
                }

                const delay = baseDelay * Math.pow(2, maxRetries - retriesLeft);
                console.log(`Retry after ${delay}ms. Retries left: ${retriesLeft}`);

                return new Promise(resolve => setTimeout(resolve, delay))
                    .then(() => attempt(retriesLeft - 1));
            });
    }

    return attempt(maxRetries);
}

// Usage
fetchWithRetry('https://api.example.com/data')
    .then(response => response.json())
    .then(data => console.log('Success:', data))
    .catch(error => console.error('Failed after all retries:', error));
```


**Advanced Error Handling Pattern:**


```javascript
// Error categorization và handling từ Axon project
class APIError extends Error {
    constructor(message, statusCode, isRetryable = false) {
        super(message);
        this.statusCode = statusCode;
        this.isRetryable = isRetryable;
        this.name = 'APIError';
    }
}

function smartFetch(url, options = {}) {
    const maxRetries = options.retries || 3;
    const timeout = options.timeout || 5000;

    function attemptFetch(retriesLeft) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        return fetch(url, {
            ...options,
            signal: controller.signal
        })
        .then(response => {
            clearTimeout(timeoutId);

            if (!response.ok) {
                const isRetryable = response.status >= 500 || response.status === 429;
                throw new APIError(
                    `HTTP ${response.status}: ${response.statusText}`,
                    response.status,
                    isRetryable
                );
            }

            return response;
        })
        .catch(error => {
            clearTimeout(timeoutId);

            if (retriesLeft > 0 && shouldRetry(error)) {
                const delay = calculateBackoff(maxRetries - retriesLeft);
                console.log(`Retrying request to ${url} after ${delay}ms`);

                return new Promise(resolve => setTimeout(resolve, delay))
                    .then(() => attemptFetch(retriesLeft - 1));
            }

            throw error;
        });
    }

    function shouldRetry(error) {
        if (error instanceof APIError) {
            return error.isRetryable;
        }

        // Network errors are usually retryable
        if (error.name === 'TypeError' || error.name === 'AbortError') {
            return true;
        }

        return false;
    }

    function calculateBackoff(attempt) {
        return Math.min(1000 * Math.pow(2, attempt) + Math.random() * 1000, 30000);
    }

    return attemptFetch(maxRetries);
}
```


**💭 Think Out Loud:**
*"Error handling trong promise chains là art form. Tại Axon, chúng tôi deal với unreliable external APIs. Lesson learned: Always categorize errors. Network errors khác với business logic errors. Retry logic should be intelligent - don't retry validation errors, but do retry temporary network failures."*


---


## 🔄 RETURNING PROMISES FROM HANDLERS


### 📖 Core Concept: Promise Unwrapping


Một trong những powerful features của Promise chaining là ability để return promises từ `.then()` handlers. Browser automatically "unwrap" nested promises.


**Basic Example:**


```javascript
// Handler return một promise
new Promise(resolve => resolve(1))
    .then(result => {
        console.log(result); // 1

        // Return một promise thay vì value
        return new Promise(resolve => {
            setTimeout(() => resolve(result * 2), 1000);
        });
    })
    .then(result => {
        console.log(result); // 2 (sau 1 giây)
        return result * 2;
    });
```


### 🔬 Mechanism Deep Dive: Promise Resolution Procedure


**Theo ES6 Specification, khi handler return một promise:**


1. **Promise Detection:**

Check if returned value has .then method
If yes, treat as "thenable"
2. **Promise Unwrapping:**

Call .then() method của returned promise
Pass resolve/reject callbacks từ outer promise
3. **State Propagation:**

Khi inner promise settles, outer promise settles với same value/reason


**Implementation Pseudo-code:**


```javascript
// Simplified promise resolution procedure
function resolvePromise(promise, x, resolve, reject) {
    if (promise === x) {
        // Circular reference
        reject(new TypeError('Chaining cycle detected'));
        return;
    }

    if (x && (typeof x === 'object' || typeof x === 'function')) {
        let then;

        try {
            then = x.then;
        } catch (e) {
            reject(e);
            return;
        }

        if (typeof then === 'function') {
            // x is thenable, unwrap it
            try {
                then.call(x,
                    value => resolvePromise(promise, value, resolve, reject),
                    reason => reject(reason)
                );
            } catch (e) {
                reject(e);
            }
        } else {
            // x is not thenable, resolve with x
            resolve(x);
        }
    } else {
        // x is primitive value
        resolve(x);
    }
}
```


### 🏭 Real-world Example: Sequential Script Loading


**Problem:** Load multiple scripts sequentially để ensure dependencies.


```javascript
// Basic approach
function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;

        script.onload = () => resolve(script);
        script.onerror = () => reject(new Error(`Failed to load script: ${src}`));

        document.head.appendChild(script);
    });
}

// Sequential loading với promise chaining
loadScript('/libs/jquery.js')
    .then(script => {
        console.log('jQuery loaded');
        return loadScript('/libs/lodash.js');  // Return promise
    })
    .then(script => {
        console.log('Lodash loaded');
        return loadScript('/app/main.js');    // Return promise
    })
    .then(script => {
        console.log('Main app loaded');
        // All scripts loaded, initialize app
        initializeApp();
    })
    .catch(error => {
        console.error('Script loading failed:', error);
    });
```


**Advanced Pattern với Error Recovery:**


```javascript
// Enhanced script loader với fallbacks
function loadScriptWithFallback(primarySrc, fallbackSrc) {
    return loadScript(primarySrc)
        .catch(primaryError => {
            console.warn(`Primary source failed: ${primarySrc}`, primaryError);
            return loadScript(fallbackSrc);
        })
        .catch(fallbackError => {
            console.error(`Both sources failed for script`, {
                primary: primarySrc,
                fallback: fallbackSrc,
                errors: { primaryError, fallbackError }
            });
            throw new Error(`Unable to load script from any source`);
        });
}

// Usage với complex dependency management
function loadApplicationDependencies() {
    const dependencies = [
        {
            name: 'jQuery',
            primary: '/libs/jquery-3.6.0.min.js',
            fallback: 'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js'
        },
        {
            name: 'Lodash',
            primary: '/libs/lodash-4.17.21.min.js',
            fallback: 'https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js'
        },
        {
            name: 'Chart.js',
            primary: '/libs/chart-3.9.1.min.js',
            fallback: 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js'
        }
    ];

    // Sequential loading với proper error handling
    return dependencies.reduce((chain, dependency) => {
        return chain.then(() => {
            console.log(`Loading ${dependency.name}...`);
            return loadScriptWithFallback(dependency.primary, dependency.fallback);
        }).then(script => {
            console.log(`✅ ${dependency.name} loaded successfully`);
            return script;
        });
    }, Promise.resolve())
    .then(() => {
        console.log('🎉 All dependencies loaded successfully');
        return validateDependencies();
    });
}

function validateDependencies() {
    const requiredGlobals = ['$', '_', 'Chart'];
    const missing = requiredGlobals.filter(global => typeof window[global] === 'undefined');

    if (missing.length > 0) {
        throw new Error(`Missing required globals: ${missing.join(', ')}`);
    }

    return true;
}
```


**💭 Think Out Loud:**
*"Sequential script loading là classic use case tôi encounter ở mọi project. Key insight: Always plan for failure. CDN có thể down, local files có thể corrupted. Promise chaining với fallback URLs đã save tôi countless times tại production. Rule of thumb: Critical dependencies should always have fallback sources."*


### 🌐 Network Request Chaining


**Real-world Example từ Figma Integration:**


```javascript
// Complex data fetching với dependent requests
function loadDesignProjectData(projectId) {
    let projectData;
    let userPermissions;

    return fetchProject(projectId)
        .then(project => {
            projectData = project;
            console.log('Project loaded:', project.name);

            // Fetch user permissions dựa trên project data
            return fetchUserPermissions(project.ownerId, project.id);
        })
        .then(permissions => {
            userPermissions = permissions;
            console.log('Permissions loaded:', permissions);

            // Conditional fetching based on permissions
            if (permissions.canViewAssets) {
                return fetchProjectAssets(projectData.id);
            }

            return Promise.resolve([]);
        })
        .then(assets => {
            console.log('Assets loaded:', assets.length);

            // Parallel fetch của additional data
            const additionalDataPromises = [];

            if (userPermissions.canViewComments) {
                additionalDataPromises.push(fetchComments(projectData.id));
            }

            if (userPermissions.canViewHistory) {
                additionalDataPromises.push(fetchVersionHistory(projectData.id));
            }

            if (userPermissions.canViewTeam) {
                additionalDataPromises.push(fetchTeamMembers(projectData.teamId));
            }

            // Wait for all additional data
            return Promise.all(additionalDataPromises)
                .then(([comments = [], history = [], team = []]) => ({
                    project: projectData,
                    permissions: userPermissions,
                    assets,
                    comments,
                    history,
                    team
                }));
        });
}

// Usage với comprehensive error handling
loadDesignProjectData('proj_123')
    .then(fullProjectData => {
        renderProjectDashboard(fullProjectData);
        trackUserAction('project_loaded', {
            projectId: fullProjectData.project.id,
            assetsCount: fullProjectData.assets.length,
            hasComments: fullProjectData.comments.length > 0
        });
    })
    .catch(error => {
        if (error.status === 403) {
            showPermissionDeniedMessage();
        } else if (error.status === 404) {
            showProjectNotFoundMessage();
        } else {
            showGenericErrorMessage();
            logError('project_load_failed', error);
        }
    });
```


**Performance Optimization Pattern:**


```javascript
// Optimized version với request deduplication và caching
class ProjectDataLoader {
    constructor() {
        this.cache = new Map();
        this.pendingRequests = new Map();
    }

    loadProject(projectId) {
        // Check cache first
        if (this.cache.has(projectId)) {
            return Promise.resolve(this.cache.get(projectId));
        }

        // Check if request already in flight
        if (this.pendingRequests.has(projectId)) {
            return this.pendingRequests.get(projectId);
        }

        // Start new request
        const requestPromise = this._fetchProjectData(projectId)
            .then(data => {
                this.cache.set(projectId, data);
                this.pendingRequests.delete(projectId);
                return data;
            })
            .catch(error => {
                this.pendingRequests.delete(projectId);
                throw error;
            });

        this.pendingRequests.set(projectId, requestPromise);
        return requestPromise;
    }

    _fetchProjectData(projectId) {
        // Implementation with all the chaining logic above
        return loadDesignProjectData(projectId);
    }
}

// Singleton instance
const projectLoader = new ProjectDataLoader();
```


**💭 Think Out Loud:**
*"Network request chaining tại Figma taught me về importance của request optimization. Browser có limit 6 concurrent requests per domain. Khi chain nhiều dependent requests, bạn có thể quickly hit limits. Solutions: Request deduplication, caching, và careful planning của request dependencies."*


---


## 🔀 THENABLES: PROMISE INTEROPERABILITY


### 📖 Thenable Concept: Duck Typing for Promises


Thenable là object implement Promise-like interface nhưng không necessarily inherit từ Promise class. Đây là powerful pattern cho interoperability.


**Core Definition:**


```javascript
// Minimal thenable interface
const thenable = {
    then(onFulfilled, onRejected) {
        // Implementation details
    }
};
```


### 🔬 Thenable Specification & Implementation


**ES6 Specification Requirements:**


1. **Method Signature:** `then(onFulfilled?, onRejected?)`
2. **Parameters:** Both parameters optional
3. **Return Value:** Should return thenable để enable chaining
4. **Async Execution:** Handlers should execute asynchronously


**Custom Thenable Example:**


```javascript
// Advanced thenable implementation
class CustomThenable {
    constructor(value, delay = 0) {
        this.value = value;
        this.delay = delay;
        this.state = 'pending';
        this.handlers = [];
    }

    then(onFulfilled, onRejected) {
        return new CustomThenable(
            this._executeHandlers(onFulfilled, onRejected),
            0
        );
    }

    _executeHandlers(onFulfilled, onRejected) {
        if (this.state === 'pending') {
            // Simulate async resolution
            setTimeout(() => {
                try {
                    this.state = 'fulfilled';
                    this._runHandlers();
                } catch (error) {
                    this.state = 'rejected';
                    this.rejectionReason = error;
                    this._runHandlers();
                }
            }, this.delay);

            this.handlers.push({ onFulfilled, onRejected });
            return this;
        }

        // Already resolved
        return this._processHandler(onFulfilled, onRejected);
    }

    _runHandlers() {
        this.handlers.forEach(({ onFulfilled, onRejected }) => {
            this._processHandler(onFulfilled, onRejected);
        });
        this.handlers = [];
    }

    _processHandler(onFulfilled, onRejected) {
        try {
            if (this.state === 'fulfilled' && typeof onFulfilled === 'function') {
                return onFulfilled(this.value);
            } else if (this.state === 'rejected' && typeof onRejected === 'function') {
                return onRejected(this.rejectionReason);
            }

            return this.state === 'fulfilled' ? this.value : this.rejectionReason;
        } catch (error) {
            throw error;
        }
    }
}
```


### 🏭 Real-world Thenable Applications


**1. Library Interoperability Example (jQuery Deferred):**


```javascript
// Bridge between jQuery Deferred và modern Promises
function jQueryToPromise(jqXHR) {
    return new Promise((resolve, reject) => {
        jqXHR
            .done(resolve)
            .fail(reject);
    });
}

// Usage với Promise chaining
function fetchUserDataWithJQuery(userId) {
    return jQueryToPromise($.ajax({
        url: `/api/users/${userId}`,
        method: 'GET'
    }))
    .then(userData => {
        console.log('User data loaded:', userData);
        return jQueryToPromise($.ajax({
            url: `/api/users/${userId}/preferences`,
            method: 'GET'
        }));
    })
    .then(preferences => {
        console.log('Preferences loaded:', preferences);
        return { userData, preferences };
    });
}
```


**2. Custom Async Control Flow (từ Axon project):**


```javascript
// Custom thenable for rate-limited operations
class RateLimitedThenable {
    constructor(operation, rateLimiter) {
        this.operation = operation;
        this.rateLimiter = rateLimiter;
    }

    then(onFulfilled, onRejected) {
        return this.rateLimiter.acquire()
            .then(() => this.operation())
            .then(onFulfilled)
            .catch(onRejected)
            .finally(() => this.rateLimiter.release());
    }
}

class TokenBucketRateLimiter {
    constructor(capacity, refillRate) {
        this.capacity = capacity;
        this.tokens = capacity;
        this.refillRate = refillRate;
        this.lastRefill = Date.now();
        this.queue = [];
    }

    acquire() {
        return new Promise((resolve) => {
            this._refillTokens();

            if (this.tokens > 0) {
                this.tokens--;
                resolve();
            } else {
                this.queue.push(resolve);
                this._scheduleRefill();
            }
        });
    }

    release() {
        // Token được refill automatically
    }

    _refillTokens() {
        const now = Date.now();
        const timePassed = now - this.lastRefill;
        const tokensToAdd = Math.floor(timePassed / 1000 * this.refillRate);

        this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
        this.lastRefill = now;
    }

    _scheduleRefill() {
        if (this.queue.length > 0 && this.tokens === 0) {
            setTimeout(() => {
                this._refillTokens();
                if (this.tokens > 0) {
                    const resolve = this.queue.shift();
                    this.tokens--;
                    resolve();
                }

                if (this.queue.length > 0) {
                    this._scheduleRefill();
                }
            }, 1000 / this.refillRate);
        }
    }
}

// Usage
const rateLimiter = new TokenBucketRateLimiter(5, 1); // 5 tokens, 1 per second

function makeAPICall(endpoint) {
    return new RateLimitedThenable(
        () => fetch(endpoint).then(r => r.json()),
        rateLimiter
    );
}

// Chain rate-limited calls
makeAPICall('/api/data1')
    .then(data1 => {
        console.log('Data 1:', data1);
        return makeAPICall('/api/data2');
    })
    .then(data2 => {
        console.log('Data 2:', data2);
        return makeAPICall('/api/data3');
    })
    .then(data3 => {
        console.log('Data 3:', data3);
    });
```


**💭 Think Out Loud:**
*"Thenables gave us incredible flexibility tại Axon. Khi integrate với legacy systems using different async patterns, thenables act như universal adapter. Key insight: Duck typing allows Promise machinery to work với any object implementing .then() method, regardless of inheritance hierarchy."*


**3. Observable-to-Promise Bridge:**


```javascript
// Bridge RxJS Observables với Promise chains
class ObservableThenable {
    constructor(observable) {
        this.observable = observable;
    }

    then(onFulfilled, onRejected) {
        return new Promise((resolve, reject) => {
            const subscription = this.observable.subscribe({
                next: value => {
                    subscription.unsubscribe();
                    try {
                        const result = onFulfilled ? onFulfilled(value) : value;
                        resolve(result);
                    } catch (error) {
                        reject(error);
                    }
                },
                error: error => {
                    subscription.unsubscribe();
                    if (onRejected) {
                        try {
                            const result = onRejected(error);
                            resolve(result);
                        } catch (handlerError) {
                            reject(handlerError);
                        }
                    } else {
                        reject(error);
                    }
                },
                complete: () => {
                    subscription.unsubscribe();
                    resolve(undefined);
                }
            });
        });
    }
}

// Usage với Promise chain
function streamToPromiseChain() {
    const dataStream = new Observable(subscriber => {
        let count = 0;
        const interval = setInterval(() => {
            subscriber.next(count++);
            if (count >= 5) {
                subscriber.complete();
                clearInterval(interval);
            }
        }, 1000);
    });

    return new ObservableThenable(dataStream)
        .then(firstValue => {
            console.log('First value from stream:', firstValue);
            return fetch(`/api/process/${firstValue}`);
        })
        .then(response => response.json())
        .then(processedData => {
            console.log('Processed data:', processedData);
            return processedData;
        });
}
```


---


## 🌐 FETCH API: REAL-WORLD PROMISE CHAINING


### 📖 Fetch API Fundamentals


Fetch API là modern replacement cho XMLHttpRequest, designed ground-up với Promises. Understanding fetch chaining là essential cho web development.


**Basic Fetch Anatomy:**


```javascript
// Basic fetch structure
fetch(url, options)
    .then(response => {
        // Response object, not the actual data
        return response.json(); // Returns another promise
    })
    .then(data => {
        // Actual parsed data
        console.log(data);
    });
```


### 🔬 Response Object Deep Dive


**Response Object Properties:**


```javascript
// Comprehensive response handling
function handleFetchResponse(url) {
    return fetch(url)
        .then(response => {
            console.log('Response status:', response.status);
            console.log('Response OK:', response.ok);
            console.log('Response headers:', response.headers);
            console.log('Response type:', response.type);
            console.log('Response URL:', response.url);

            // Clone response để multiple reads
            const responseClone = response.clone();

            // Response body can only be read once
            if (!response.ok) {
                return response.text().then(errorText => {
                    throw new Error(`HTTP ${response.status}: ${errorText}`);
                });
            }

            // Determine content type và parse accordingly
            const contentType = response.headers.get('content-type');

            if (contentType && contentType.includes('application/json')) {
                return response.json();
            } else if (contentType && contentType.includes('text/')) {
                return response.text();
            } else {
                return response.blob();
            }
        });
}
```


### 🏭 Production-Grade Fetch Patterns


**1. Comprehensive Error Handling:**


```javascript
// Production fetch wrapper từ Binance trading platform
class APIClient {
    constructor(baseURL, defaultOptions = {}) {
        this.baseURL = baseURL;
        this.defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            ...defaultOptions
        };
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = this._mergeOptions(options);

        return this._fetchWithRetry(url, config)
            .then(response => this._handleResponse(response))
            .catch(error => this._handleError(error, endpoint));
    }

    _mergeOptions(options) {
        return {
            ...this.defaultOptions,
            ...options,
            headers: {
                ...this.defaultOptions.headers,
                ...options.headers
            }
        };
    }

    _fetchWithRetry(url, options, attempt = 1) {
        const maxRetries = 3;
        const backoffDelay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);

        return fetch(url, options)
            .then(response => {
                // Success or non-retryable error
                if (response.ok || !this._isRetryableStatus(response.status)) {
                    return response;
                }

                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            })
            .catch(error => {
                if (attempt < maxRetries && this._isRetryableError(error)) {
                    console.log(`Retry attempt ${attempt} for ${url} after ${backoffDelay}ms`);

                    return new Promise(resolve => setTimeout(resolve, backoffDelay))
                        .then(() => this._fetchWithRetry(url, options, attempt + 1));
                }

                throw error;
            });
    }

    _isRetryableStatus(status) {
        return status >= 500 || status === 429; // Server errors and rate limits
    }

    _isRetryableError(error) {
        return error.name === 'TypeError' || // Network errors
               error.name === 'AbortError' ||  // Timeout errors
               error.message.includes('5'); // 5xx errors
    }

    _handleResponse(response) {
        if (!response.ok) {
            return response.text()
                .then(errorText => {
                    let errorData;
                    try {
                        errorData = JSON.parse(errorText);
                    } catch {
                        errorData = { message: errorText };
                    }

                    throw new APIError(
                        errorData.message || `HTTP ${response.status}`,
                        response.status,
                        errorData
                    );
                });
        }

        const contentType = response.headers.get('content-type');

        if (contentType && contentType.includes('application/json')) {
            return response.json();
        }

        return response.text();
    }

    _handleError(error, endpoint) {
        console.error(`API Error for ${endpoint}:`, error);

        // Custom error handling logic
        if (error.status === 401) {
            this._handleUnauthorized();
        } else if (error.status === 403) {
            this._handleForbidden();
        }

        throw error;
    }

    _handleUnauthorized() {
        // Redirect to login or refresh token
        console.log('Unauthorized access, redirecting to login');
    }

    _handleForbidden() {
        // Show permission denied message
        console.log('Access forbidden');
    }
}

class APIError extends Error {
    constructor(message, status, data) {
        super(message);
        this.name = 'APIError';
        this.status = status;
        this.data = data;
    }
}
```


**2. Complex Data Fetching Chain:**


```javascript
// Complex trading data pipeline từ Binance
function loadTradingDashboard(userId) {
    const apiClient = new APIClient('https://api.trading.com');

    return apiClient.request('/auth/verify')
        .then(authData => {
            console.log('Authentication verified:', authData.user);

            // Parallel fetch của independent data
            const portfolioPromise = apiClient.request(`/portfolio/${userId}`);
            const marketDataPromise = apiClient.request('/market/summary');
            const alertsPromise = apiClient.request(`/alerts/${userId}`);

            return Promise.all([portfolioPromise, marketDataPromise, alertsPromise]);
        })
        .then(([portfolio, marketData, alerts]) => {
            console.log('Base data loaded');

            // Extract symbols từ portfolio để fetch detailed prices
            const symbols = portfolio.holdings.map(holding => holding.symbol);

            if (symbols.length === 0) {
                return { portfolio, marketData, alerts, prices: {} };
            }

            // Batch price requests để avoid rate limits
            const pricePromises = this._batchSymbolRequests(symbols, apiClient);

            return Promise.all(pricePromises)
                .then(priceArrays => {
                    const prices = priceArrays.flat().reduce((acc, price) => {
                        acc[price.symbol] = price;
                        return acc;
                    }, {});

                    return { portfolio, marketData, alerts, prices };
                });
        })
        .then(dashboardData => {
            // Calculate derived metrics
            const enrichedPortfolio = this._enrichPortfolioData(
                dashboardData.portfolio,
                dashboardData.prices
            );

            // Fetch recommendation data based on current holdings
            const recommendationPromise = apiClient.request('/recommendations', {
                method: 'POST',
                body: JSON.stringify({
                    holdings: enrichedPortfolio.holdings,
                    riskProfile: dashboardData.portfolio.riskProfile
                })
            });

            return recommendationPromise.then(recommendations => ({
                ...dashboardData,
                portfolio: enrichedPortfolio,
                recommendations
            }));
        });
}

function _batchSymbolRequests(symbols, apiClient, batchSize = 10) {
    const batches = [];

    for (let i = 0; i < symbols.length; i += batchSize) {
        const batch = symbols.slice(i, i + batchSize);
        const batchPromise = apiClient.request('/prices/batch', {
            method: 'POST',
            body: JSON.stringify({ symbols: batch })
        });

        batches.push(batchPromise);
    }

    return batches;
}

function _enrichPortfolioData(portfolio, prices) {
    const enrichedHoldings = portfolio.holdings.map(holding => {
        const currentPrice = prices[holding.symbol];

        if (!currentPrice) {
            return holding;
        }

        const currentValue = holding.quantity * currentPrice.price;
        const gainLoss = currentValue - holding.cost;
        const gainLossPercent = (gainLoss / holding.cost) * 100;

        return {
            ...holding,
            currentPrice: currentPrice.price,
            currentValue,
            gainLoss,
            gainLossPercent,
            lastUpdated: currentPrice.timestamp
        };
    });

    const totalValue = enrichedHoldings.reduce((sum, holding) => sum + holding.currentValue, 0);
    const totalCost = enrichedHoldings.reduce((sum, holding) => sum + holding.cost, 0);
    const totalGainLoss = totalValue - totalCost;
    const totalGainLossPercent = (totalGainLoss / totalCost) * 100;

    return {
        ...portfolio,
        holdings: enrichedHoldings,
        summary: {
            totalValue,
            totalCost,
            totalGainLoss,
            totalGainLossPercent
        }
    };
}
```


**💭 Think Out Loud:**
*"Trading platforms tại Binance require extremely robust error handling. Market data changes rapidly, API rate limits are strict, và users expect real-time updates. Promise chaining helps orchestrate complex data dependencies, nhưng performance is critical. Key lessons: Batch requests khi possible, cache aggressively, và always have fallbacks for essential data."*


**3. File Upload với Progress Tracking:**


```javascript
// Advanced file upload với promise chaining
class FileUploader {
    constructor(endpoint, options = {}) {
        this.endpoint = endpoint;
        this.options = {
            maxFileSize: 10 * 1024 * 1024, // 10MB default
            allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
            chunkSize: 1024 * 1024, // 1MB chunks
            ...options
        };
    }

    upload(file, progressCallback) {
        return this._validateFile(file)
            .then(validatedFile => {
                if (this._shouldUseChunkedUpload(validatedFile)) {
                    return this._chunkedUpload(validatedFile, progressCallback);
                } else {
                    return this._simpleUpload(validatedFile, progressCallback);
                }
            })
            .then(uploadResult => {
                return this._postProcessUpload(uploadResult);
            });
    }

    _validateFile(file) {
        return new Promise((resolve, reject) => {
            // Size validation
            if (file.size > this.options.maxFileSize) {
                reject(new Error(`File size exceeds limit: ${this.options.maxFileSize} bytes`));
                return;
            }

            // Type validation
            if (!this.options.allowedTypes.includes(file.type)) {
                reject(new Error(`File type not allowed: ${file.type}`));
                return;
            }

            // File integrity check
            if (file.size === 0) {
                reject(new Error('File is empty'));
                return;
            }

            resolve(file);
        });
    }

    _shouldUseChunkedUpload(file) {
        return file.size > this.options.chunkSize * 2;
    }

    _simpleUpload(file, progressCallback) {
        const formData = new FormData();
        formData.append('file', file);

        return fetch(this.endpoint, {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (progressCallback) {
                progressCallback(100);
            }

            if (!response.ok) {
                throw new Error(`Upload failed: HTTP ${response.status}`);
            }

            return response.json();
        });
    }

    _chunkedUpload(file, progressCallback) {
        const totalChunks = Math.ceil(file.size / this.options.chunkSize);
        let uploadedChunks = 0;

        // Initialize multipart upload
        return fetch(`${this.endpoint}/initiate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fileName: file.name,
                fileSize: file.size,
                totalChunks
            })
        })
        .then(response => response.json())
        .then(initResult => {
            const uploadId = initResult.uploadId;

            // Create array of chunk upload promises
            const chunkPromises = [];

            for (let i = 0; i < totalChunks; i++) {
                const start = i * this.options.chunkSize;
                const end = Math.min(start + this.options.chunkSize, file.size);
                const chunk = file.slice(start, end);

                const chunkPromise = this._uploadChunk(chunk, i, uploadId)
                    .then(result => {
                        uploadedChunks++;

                        if (progressCallback) {
                            const progress = Math.round((uploadedChunks / totalChunks) * 100);
                            progressCallback(progress);
                        }

                        return result;
                    });

                chunkPromises.push(chunkPromise);
            }

            // Upload chunks với concurrency control
            return this._executeWithConcurrency(chunkPromises, 3)
                .then(chunkResults => {
                    return this._completeMultipartUpload(uploadId, chunkResults);
                });
        });
    }

    _uploadChunk(chunk, chunkIndex, uploadId) {
        const formData = new FormData();
        formData.append('chunk', chunk);
        formData.append('chunkIndex', chunkIndex);
        formData.append('uploadId', uploadId);

        return fetch(`${this.endpoint}/chunk`, {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Chunk upload failed: ${chunkIndex}`);
            }
            return response.json();
        });
    }

    _executeWithConcurrency(promises, concurrency) {
        let index = 0;
        const results = [];

        const executeNext = () => {
            if (index >= promises.length) {
                return Promise.resolve();
            }

            const currentIndex = index++;
            return promises[currentIndex]
                .then(result => {
                    results[currentIndex] = result;
                    return executeNext();
                });
        };

        // Start initial batch
        const initialBatch = Array(Math.min(concurrency, promises.length))
            .fill(null)
            .map(() => executeNext());

        return Promise.all(initialBatch).then(() => results);
    }

    _completeMultipartUpload(uploadId, chunkResults) {
        return fetch(`${this.endpoint}/complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                uploadId,
                chunks: chunkResults
            })
        })
        .then(response => response.json());
    }

    _postProcessUpload(uploadResult) {
        // Trigger post-processing như thumbnail generation
        if (uploadResult.fileType.startsWith('image/')) {
            return fetch(`${this.endpoint}/process-image`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fileId: uploadResult.fileId,
                    operations: ['thumbnail', 'optimize']
                })
            })
            .then(response => response.json())
            .then(processResult => ({
                ...uploadResult,
                processed: processResult
            }));
        }

        return Promise.resolve(uploadResult);
    }
}

// Usage
const uploader = new FileUploader('/api/upload', {
    maxFileSize: 50 * 1024 * 1024, // 50MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
});

function handleFileUpload(file) {
    const progressElement = document.getElementById('upload-progress');

    uploader.upload(file, (progress) => {
        progressElement.textContent = `${progress}%`;
        progressElement.style.width = `${progress}%`;
    })
    .then(result => {
        console.log('Upload successful:', result);
        showSuccessMessage('File uploaded successfully!');

        if (result.processed) {
            displayThumbnail(result.processed.thumbnailUrl);
        }
    })
    .catch(error => {
        console.error('Upload failed:', error);
        showErrorMessage(`Upload failed: ${error.message}`);
    });
}
```


**💭 Think Out Loud:**
*"File upload chains từ Webflow projects taught me về importance của user experience trong long-running operations. Promise chains enable elegant progress tracking và error recovery, nhưng key is breaking down complex operations thành manageable steps. Users need feedback, và developers need visibility into each stage của process."*


---


## 🚨 ERROR HANDLING & RECOVERY PATTERNS


### 📖 Error Propagation in Promise Chains


Understanding how errors flow through promise chains là crucial cho robust applications. Errors propagate down chain until caught.


**Basic Error Flow:**


```javascript
// Error propagation demonstration
Promise.resolve(1)
    .then(value => {
        console.log('Step 1:', value); // 1
        return value * 2;
    })
    .then(value => {
        console.log('Step 2:', value); // 2
        throw new Error('Something went wrong!');
    })
    .then(value => {
        // This will NOT execute
        console.log('Step 3:', value);
        return value * 2;
    })
    .then(value => {
        // This will also NOT execute
        console.log('Step 4:', value);
        return value * 2;
    })
    .catch(error => {
        // Error caught here
        console.error('Caught error:', error.message);
        return 'recovered'; // Error recovery
    })
    .then(value => {
        // This WILL execute with recovered value
        console.log('Step 5:', value); // 'recovered'
    });
```


### 🔬 Advanced Error Handling Patterns


**1. Error Classification & Handling Strategy:**


```javascript
// Error types classification
class APIError extends Error {
    constructor(message, status, code) {
        super(message);
        this.name = 'APIError';
        this.status = status;
        this.code = code;
        this.isRetryable = this._determineRetryability(status);
    }

    _determineRetryability(status) {
        // 5xx server errors and 429 rate limits are retryable
        return status >= 500 || status === 429;
    }
}

class ValidationError extends Error {
    constructor(message, field, value) {
        super(message);
        this.name = 'ValidationError';
        this.field = field;
        this.value = value;
        this.isRetryable = false;
    }
}

class NetworkError extends Error {
    constructor(message, originalError) {
        super(message);
        this.name = 'NetworkError';
        this.originalError = originalError;
        this.isRetryable = true;
    }
}

// Sophisticated error handling pipeline
function robustAPICall(url, data) {
    return validateInput(data)
        .then(validatedData => {
            return makeAPICall(url, validatedData);
        })
        .catch(error => {
            return handleAPIError(error, url, data);
        });
}

function validateInput(data) {
    return new Promise((resolve, reject) => {
        if (!data || typeof data !== 'object') {
            reject(new ValidationError('Invalid input data', 'data', data));
            return;
        }

        if (!data.userId || typeof data.userId !== 'string') {
            reject(new ValidationError('userId is required', 'userId', data.userId));
            return;
        }

        if (data.amount && (typeof data.amount !== 'number' || data.amount <= 0)) {
            reject(new ValidationError('amount must be positive number', 'amount', data.amount));
            return;
        }

        resolve(data);
    });
}

function makeAPICall(url, data) {
    return fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) {
            throw new APIError(
                `API call failed: ${response.statusText}`,
                response.status,
                null
            );
        }
        return response.json();
    })
    .catch(error => {
        if (error instanceof APIError) {
            throw error;
        }

        // Network errors or other fetch failures
        throw new NetworkError('Network request failed', error);
    });
}

function handleAPIError(error, url, data) {
    console.error(`Error in API call to ${url}:`, error);

    if (error instanceof ValidationError) {
        // Validation errors should not be retried
        throw error;
    }

    if (error instanceof NetworkError || error.isRetryable) {
        // Implement retry logic
        return retryWithBackoff(() => makeAPICall(url, data), 3);
    }

    // Non-retryable API errors
    throw error;
}

function retryWithBackoff(operation, maxRetries, baseDelay = 1000) {
    function attempt(retriesLeft) {
        return operation().catch(error => {
            if (retriesLeft === 0 || !error.isRetryable) {
                throw error;
            }

            const delay = baseDelay * Math.pow(2, maxRetries - retriesLeft);
            const jitter = Math.random() * 0.1 * delay; // Add jitter
            const totalDelay = delay + jitter;

            console.log(`Retrying in ${Math.round(totalDelay)}ms. Retries left: ${retriesLeft}`);

            return new Promise(resolve => setTimeout(resolve, totalDelay))
                .then(() => attempt(retriesLeft - 1));
        });
    }

    return attempt(maxRetries);
}
```


**2. Circuit Breaker Pattern:**


```javascript
// Circuit breaker implementation cho promise chains
class CircuitBreaker {
    constructor(options = {}) {
        this.failureThreshold = options.failureThreshold || 5;
        this.resetTimeout = options.resetTimeout || 60000; // 60 seconds
        this.monitoringPeriod = options.monitoringPeriod || 30000; // 30 seconds

        this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
        this.failureCount = 0;
        this.lastFailureTime = null;
        this.successCount = 0;

        this.metrics = {
            totalRequests: 0,
            failedRequests: 0,
            succeededRequests: 0
        };
    }

    async execute(operation) {
        this.metrics.totalRequests++;

        if (this.state === 'OPEN') {
            if (this._shouldAttemptReset()) {
                this.state = 'HALF_OPEN';
                console.log('Circuit breaker entering HALF_OPEN state');
            } else {
                const error = new Error('Circuit breaker is OPEN');
                error.circuitBreakerOpen = true;
                throw error;
            }
        }

        try {
            const result = await operation();
            this._onSuccess();
            return result;
        } catch (error) {
            this._onFailure();
            throw error;
        }
    }

    _shouldAttemptReset() {
        return Date.now() - this.lastFailureTime >= this.resetTimeout;
    }

    _onSuccess() {
        this.metrics.succeededRequests++;

        if (this.state === 'HALF_OPEN') {
            this.successCount++;

            if (this.successCount >= Math.ceil(this.failureThreshold / 2)) {
                this._reset();
                console.log('Circuit breaker reset to CLOSED state');
            }
        } else {
            this.failureCount = 0;
        }
    }

    _onFailure() {
        this.metrics.failedRequests++;
        this.failureCount++;
        this.lastFailureTime = Date.now();

        if (this.state === 'HALF_OPEN') {
            this._trip();
            console.log('Circuit breaker failed during HALF_OPEN, returning to OPEN state');
        } else if (this.failureCount >= this.failureThreshold) {
            this._trip();
            console.log('Circuit breaker tripped to OPEN state');
        }
    }

    _trip() {
        this.state = 'OPEN';
        this.successCount = 0;
    }

    _reset() {
        this.state = 'CLOSED';
        this.failureCount = 0;
        this.successCount = 0;
    }

    getMetrics() {
        const failureRate = this.metrics.totalRequests > 0
            ? (this.metrics.failedRequests / this.metrics.totalRequests) * 100
            : 0;

        return {
            ...this.metrics,
            failureRate: Math.round(failureRate * 100) / 100,
            state: this.state
        };
    }
}

// Usage với promise chains
const circuitBreaker = new CircuitBreaker({
    failureThreshold: 3,
    resetTimeout: 30000,
    monitoringPeriod: 10000
});

function reliableAPICall(endpoint, data) {
    return circuitBreaker.execute(() => {
        return fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        .then(response => {
            if (!response.ok) {
                throw new APIError(`HTTP ${response.status}`, response.status);
            }
            return response.json();
        });
    })
    .catch(error => {
        if (error.circuitBreakerOpen) {
            console.log('Circuit breaker prevented request');
            return getCachedData(endpoint, data);
        }
        throw error;
    });
}

// Chain với circuit breaker protection
function protectedDataFlow(userId) {
    return reliableAPICall('/api/user/profile', { userId })
        .then(profile => {
            console.log('Profile loaded:', profile);
            return reliableAPICall('/api/user/preferences', { userId });
        })
        .then(preferences => {
            console.log('Preferences loaded:', preferences);
            return reliableAPICall('/api/user/recommendations', {
                userId,
                preferences
            });
        })
        .catch(error => {
            console.error('Data flow failed:', error);

            // Fallback to minimal data
            return {
                profile: { userId, name: 'Unknown User' },
                preferences: {},
                recommendations: []
            };
        });
}
```


**💭 Think Out Loud:**
*"Circuit breaker pattern saved chúng tôi nhiều lần tại production. Khi external services become unreliable, circuit breaker prevents cascade failures. Key insight: Don't just fail fast, fail gracefully. Provide fallbacks, cache data khi possible, và always inform users về degraded functionality."*


**3. Parallel Error Handling với Promise.allSettled:**


```javascript
// Advanced parallel processing với individual error handling
function loadDashboardDataParallel(userId) {
    const dataRequests = [
        {
            name: 'profile',
            request: () => fetchUserProfile(userId),
            fallback: () => ({ userId, name: 'Unknown User' }),
            critical: true
        },
        {
            name: 'preferences',
            request: () => fetchUserPreferences(userId),
            fallback: () => ({}),
            critical: false
        },
        {
            name: 'notifications',
            request: () => fetchNotifications(userId),
            fallback: () => ([]),
            critical: false
        },
        {
            name: 'analytics',
            request: () => fetchAnalytics(userId),
            fallback: () => null,
            critical: false
        }
    ];

    const requestPromises = dataRequests.map(({ request, fallback, name }) => {
        return request()
            .catch(error => {
                console.warn(`Failed to load ${name}:`, error);
                return fallback();
            });
    });

    return Promise.allSettled(requestPromises)
        .then(results => {
            const data = {};
            const errors = [];

            results.forEach((result, index) => {
                const { name, critical } = dataRequests[index];

                if (result.status === 'fulfilled') {
                    data[name] = result.value;
                } else {
                    errors.push({
                        component: name,
                        error: result.reason,
                        critical
                    });

                    // Use fallback data
                    data[name] = dataRequests[index].fallback();
                }
            });

            // Check for critical failures
            const criticalErrors = errors.filter(e => e.critical);
            if (criticalErrors.length > 0) {
                throw new Error(`Critical components failed: ${criticalErrors.map(e => e.component).join(', ')}`);
            }

            return {
                data,
                errors: errors.filter(e => !e.critical),
                hasWarnings: errors.length > 0
            };
        });
}

// Usage với comprehensive error reporting
loadDashboardDataParallel('user123')
    .then(result => {
        const { data, errors, hasWarnings } = result;

        // Render dashboard với available data
        renderDashboard(data);

        // Show warnings for non-critical failures
        if (hasWarnings) {
            showWarningBanner(`Some features unavailable: ${errors.map(e => e.component).join(', ')}`);
        }

        // Log errors for monitoring
        errors.forEach(error => {
            logError('dashboard_component_failure', {
                component: error.component,
                error: error.error.message,
                userId: 'user123'
            });
        });
    })
    .catch(error => {
        console.error('Dashboard loading failed completely:', error);
        showErrorPage('Unable to load dashboard. Please try again later.');
    });
```


---


## 🧠 DEBUGGING & PERFORMANCE OPTIMIZATION


### 📖 Debugging Promise Chains


Promise debugging có thể challenging vì asynchronous nature. Tools và techniques for effective debugging:


**1. Chrome DevTools Techniques:**


```javascript
// Enhanced promise debugging với source maps
function debuggablePromiseChain() {
    console.group('Promise Chain Execution');

    return Promise.resolve(1)
        .then(value => {
            console.log('Step 1 - Input:', value);
            const result = value * 2;
            console.log('Step 1 - Output:', result);
            return result;
        })
        .then(value => {
            console.log('Step 2 - Input:', value);
            // Breakpoint here for debugging
            debugger;
            const result = value + 10;
            console.log('Step 2 - Output:', result);
            return result;
        })
        .then(value => {
            console.log('Step 3 - Input:', value);
            if (value > 15) {
                throw new Error('Value too large');
            }
            const result = value * 3;
            console.log('Step 3 - Output:', result);
            return result;
        })
        .catch(error => {
            console.error('Chain failed:', error);
            console.trace(); // Stack trace
            throw error;
        })
        .finally(() => {
            console.groupEnd();
        });
}

// Advanced error tracking với context
function createTraceablePromise(operation, context = {}) {
    const startTime = performance.now();
    const traceId = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log(`[${traceId}] Starting operation:`, context);

    return operation()
        .then(result => {
            const duration = performance.now() - startTime;
            console.log(`[${traceId}] Operation succeeded in ${duration.toFixed(2)}ms:`, result);
            return result;
        })
        .catch(error => {
            const duration = performance.now() - startTime;
            console.error(`[${traceId}] Operation failed after ${duration.toFixed(2)}ms:`, error);
            console.error(`[${traceId}] Context:`, context);
            console.error(`[${traceId}] Stack trace:`, error.stack);
            throw error;
        });
}

// Usage
function trackedAPICall(endpoint, data) {
    return createTraceablePromise(
        () => fetch(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        }).then(r => r.json()),
        { endpoint, dataSize: JSON.stringify(data).length }
    );
}
```


**2. Performance Monitoring:**


```javascript
// Performance monitoring cho promise chains
class PromisePerformanceMonitor {
    constructor() {
        this.metrics = new Map();
        this.activeOperations = new Map();
    }

    startOperation(operationId, metadata = {}) {
        this.activeOperations.set(operationId, {
            startTime: performance.now(),
            metadata
        });
    }

    endOperation(operationId, success = true, error = null) {
        const operation = this.activeOperations.get(operationId);
        if (!operation) return;

        const duration = performance.now() - operation.startTime;

        if (!this.metrics.has(operationId)) {
            this.metrics.set(operationId, {
                totalRuns: 0,
                successfulRuns: 0,
                failedRuns: 0,
                totalDuration: 0,
                minDuration: Infinity,
                maxDuration: 0,
                averageDuration: 0
            });
        }

        const metric = this.metrics.get(operationId);
        metric.totalRuns++;
        metric.totalDuration += duration;
        metric.minDuration = Math.min(metric.minDuration, duration);
        metric.maxDuration = Math.max(metric.maxDuration, duration);
        metric.averageDuration = metric.totalDuration / metric.totalRuns;

        if (success) {
            metric.successfulRuns++;
        } else {
            metric.failedRuns++;
        }

        this.activeOperations.delete(operationId);

        // Log slow operations
        if (duration > 1000) { // 1 second threshold
            console.warn(`Slow operation detected: ${operationId} took ${duration.toFixed(2)}ms`);
        }
    }

    wrapPromise(operationId, promiseFactory, metadata = {}) {
        this.startOperation(operationId, metadata);

        return promiseFactory()
            .then(result => {
                this.endOperation(operationId, true);
                return result;
            })
            .catch(error => {
                this.endOperation(operationId, false, error);
                throw error;
            });
    }

    getMetrics() {
        const result = {};
        for (const [operationId, metric] of this.metrics.entries()) {
            result[operationId] = {
                ...metric,
                successRate: (metric.successfulRuns / metric.totalRuns) * 100
            };
        }
        return result;
    }
}

// Global monitor instance
const performanceMonitor = new PromisePerformanceMonitor();

// Monitored fetch function
function monitoredFetch(url, options = {}) {
    const operationId = `fetch_${new URL(url).pathname}`;

    return performanceMonitor.wrapPromise(
        operationId,
        () => fetch(url, options).then(r => r.json()),
        { url, method: options.method || 'GET' }
    );
}

// Performance reporting
function generatePerformanceReport() {
    const metrics = performanceMonitor.getMetrics();

    console.table(metrics);

    // Identify problematic operations
    const slowOperations = Object.entries(metrics)
        .filter(([_, metric]) => metric.averageDuration > 500)
        .sort((a, b) => b[1].averageDuration - a[1].averageDuration);

    if (slowOperations.length > 0) {
        console.warn('Slow operations detected:');
        slowOperations.forEach(([operationId, metric]) => {
            console.warn(`${operationId}: ${metric.averageDuration.toFixed(2)}ms average`);
        });
    }

    // Identify unreliable operations
    const unreliableOperations = Object.entries(metrics)
        .filter(([_, metric]) => metric.successRate < 95)
        .sort((a, b) => a[1].successRate - b[1].successRate);

    if (unreliableOperations.length > 0) {
        console.error('Unreliable operations detected:');
        unreliableOperations.forEach(([operationId, metric]) => {
            console.error(`${operationId}: ${metric.successRate.toFixed(1)}% success rate`);
        });
    }
}

// Automated reporting
setInterval(generatePerformanceReport, 60000); // Every minute
```


**💭 Think Out Loud:**
*"Performance monitoring trong promise chains requires thinking beyond just execution time. Success rates, error patterns, và resource utilization are equally important. Tại các production systems, chúng tôi track thousands of promise chains. Key insight: Instrument early, measure everything, và automate alerting for anomalies."*


**3. Memory Leak Detection:**


```javascript
// Memory leak detection cho long-running promise chains
class PromiseMemoryTracker {
    constructor() {
        this.activePromises = new Set();
        this.promiseCounters = new Map();
        this.gcObserver = null;

        if ('PerformanceObserver' in window) {
            this.setupGCObserver();
        }
    }

    setupGCObserver() {
        try {
            this.gcObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.entryType === 'measure' && entry.name.includes('gc')) {
                        this.onGarbageCollection(entry);
                    }
                }
            });

            this.gcObserver.observe({ entryTypes: ['measure'] });
        } catch (error) {
            console.warn('GC observation not available:', error);
        }
    }

    trackPromise(promise, identifier) {
        const promiseWrapper = {
            id: `${identifier}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            identifier,
            createdAt: Date.now(),
            promise
        };

        this.activePromises.add(promiseWrapper);

        // Update counter
        const count = this.promiseCounters.get(identifier) || 0;
        this.promiseCounters.set(identifier, count + 1);

        // Auto-cleanup when promise settles
        promise.finally(() => {
            this.activePromises.delete(promiseWrapper);
            this.promiseCounters.set(identifier, this.promiseCounters.get(identifier) - 1);
        });

        return promise;
    }

    onGarbageCollection(entry) {
        console.log('GC Event:', {
            duration: entry.duration,
            activePromises: this.activePromises.size,
            promiseCounters: Object.fromEntries(this.promiseCounters)
        });
    }

    getActivePromiseCount() {
        return this.activePromises.size;
    }

    getPromiseCountersByType() {
        return Object.fromEntries(this.promiseCounters);
    }

    checkForLeaks() {
        const now = Date.now();
        const stalePromises = [];

        for (const promiseWrapper of this.activePromises) {
            const age = now - promiseWrapper.createdAt;
            if (age > 30000) { // 30 seconds threshold
                stalePromises.push(promiseWrapper);
            }
        }

        if (stalePromises.length > 0) {
            console.warn('Potential memory leak detected:');
            console.table(stalePromises.map(p => ({
                id: p.id,
                identifier: p.identifier,
                ageMs: now - p.createdAt
            })));
        }

        return stalePromises;
    }
}

// Global memory tracker
const memoryTracker = new PromiseMemoryTracker();

// Tracked promise wrapper
function createTrackedPromise(identifier, promiseFactory) {
    const promise = promiseFactory();
    return memoryTracker.trackPromise(promise, identifier);
}

// Example usage
function trackedDataFetch(userId) {
    return createTrackedPromise('user_data_fetch', () => {
        return fetch(`/api/users/${userId}`)
            .then(response => response.json())
            .then(data => {
                // Process data...
                return data;
            });
    });
}

// Periodic leak checking
setInterval(() => {
    memoryTracker.checkForLeaks();

    const activeCount = memoryTracker.getActivePromiseCount();
    if (activeCount > 100) {
        console.warn(`High number of active promises: ${activeCount}`);
    }
}, 10000); // Check every 10 seconds
```


### 🔧 Performance Optimization Strategies


**1. Request Batching & Deduplication:**


```javascript
// Request batching system
class RequestBatcher {
    constructor(options = {}) {
        this.batchWindow = options.batchWindow || 100; // ms
        this.maxBatchSize = options.maxBatchSize || 50;
        this.pendingRequests = new Map();
        this.batchTimeouts = new Map();
    }

    batch(key, request, identifier) {
        if (!this.pendingRequests.has(key)) {
            this.pendingRequests.set(key, []);
            this._scheduleBatch(key);
        }

        const batch = this.pendingRequests.get(key);

        return new Promise((resolve, reject) => {
            batch.push({ request, resolve, reject, identifier });

            // Force batch execution if max size reached
            if (batch.length >= this.maxBatchSize) {
                this._executeBatch(key);
            }
        });
    }

    _scheduleBatch(key) {
        const timeoutId = setTimeout(() => {
            this._executeBatch(key);
        }, this.batchWindow);

        this.batchTimeouts.set(key, timeoutId);
    }

    _executeBatch(key) {
        const batch = this.pendingRequests.get(key);
        if (!batch || batch.length === 0) return;

        // Clear timeout
        const timeoutId = this.batchTimeouts.get(key);
        if (timeoutId) {
            clearTimeout(timeoutId);
            this.batchTimeouts.delete(key);
        }

        // Remove from pending
        this.pendingRequests.delete(key);

        // Execute batch
        this._processBatch(key, batch);
    }

    _processBatch(key, batch) {
        console.log(`Executing batch for ${key} with ${batch.length} requests`);

        // Group similar requests để optimize
        const groupedRequests = this._groupRequests(batch);

        // Execute each group
        Object.entries(groupedRequests).forEach(([groupKey, requests]) => {
            this._executeGroup(groupKey, requests);
        });
    }

    _groupRequests(batch) {
        return batch.reduce((groups, item) => {
            const groupKey = this._getGroupKey(item.request);
            if (!groups[groupKey]) {
                groups[groupKey] = [];
            }
            groups[groupKey].push(item);
            return groups;
        }, {});
    }

    _getGroupKey(request) {
        // Group by endpoint and method
        return `${request.url}_${request.method || 'GET'}`;
    }

    _executeGroup(groupKey, requests) {
        // Extract parameters from all requests
        const parameters = requests.map(r => r.request.params);

        // Make batched API call
        fetch('/api/batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                groupKey,
                requests: parameters
            })
        })
        .then(response => response.json())
        .then(results => {
            // Distribute results to individual promises
            requests.forEach((request, index) => {
                const result = results[index];
                if (result.success) {
                    request.resolve(result.data);
                } else {
                    request.reject(new Error(result.error));
                }
            });
        })
        .catch(error => {
            // Reject all requests in batch
            requests.forEach(request => {
                request.reject(error);
            });
        });
    }
}

// Usage
const batcher = new RequestBatcher({ batchWindow: 50, maxBatchSize: 20 });

function fetchUserData(userId) {
    return batcher.batch(
        'user_data',
        { url: '/api/users', params: { userId } },
        userId
    );
}

// Multiple calls will be batched together
Promise.all([
    fetchUserData('user1'),
    fetchUserData('user2'),
    fetchUserData('user3'),
    fetchUserData('user4'),
    fetchUserData('user5')
]).then(results => {
    console.log('All user data loaded:', results);
});
```


**2. Intelligent Caching Layer:**


```javascript
// Advanced caching with TTL và invalidation
class PromiseCacheManager {
    constructor(options = {}) {
        this.defaultTTL = options.defaultTTL || 300000; // 5 minutes
        this.maxCacheSize = options.maxCacheSize || 1000;
        this.cache = new Map();
        this.ttlTimeouts = new Map();
        this.accessTimes = new Map();

        // Periodic cleanup
        setInterval(() => this.cleanup(), 60000); // Every minute
    }

    get(key, promiseFactory, options = {}) {
        const ttl = options.ttl || this.defaultTTL;
        const forceRefresh = options.forceRefresh || false;

        // Update access time for LRU
        this.accessTimes.set(key, Date.now());

        if (!forceRefresh && this.cache.has(key)) {
            const cachedItem = this.cache.get(key);

            if (this._isValid(cachedItem)) {
                console.log(`Cache hit for ${key}`);
                return Promise.resolve(cachedItem.data);
            } else {
                this._evict(key);
            }
        }

        // Not in cache or expired, fetch new data
        console.log(`Cache miss for ${key}, fetching...`);

        const promise = promiseFactory()
            .then(data => {
                this._set(key, data, ttl);
                return data;
            })
            .catch(error => {
                // Don't cache errors, but allow fallback to stale data
                if (this.cache.has(key)) {
                    console.warn(`Using stale data for ${key} due to error:`, error);
                    return this.cache.get(key).data;
                }
                throw error;
            });

        return promise;
    }

    _set(key, data, ttl) {
        // Evict LRU items if cache is full
        if (this.cache.size >= this.maxCacheSize) {
            this._evictLRU();
        }

        const expiresAt = Date.now() + ttl;

        this.cache.set(key, {
            data,
            expiresAt,
            createdAt: Date.now()
        });

        // Set TTL timeout
        const timeoutId = setTimeout(() => {
            this._evict(key);
        }, ttl);

        this.ttlTimeouts.set(key, timeoutId);
        this.accessTimes.set(key, Date.now());
    }

    _isValid(cachedItem) {
        return Date.now() < cachedItem.expiresAt;
    }

    _evict(key) {
        this.cache.delete(key);
        this.accessTimes.delete(key);

        const timeoutId = this.ttlTimeouts.get(key);
        if (timeoutId) {
            clearTimeout(timeoutId);
            this.ttlTimeouts.delete(key);
        }
    }

    _evictLRU() {
        // Find least recently used item
        let lruKey = null;
        let lruTime = Infinity;

        for (const [key, accessTime] of this.accessTimes) {
            if (accessTime < lruTime) {
                lruTime = accessTime;
                lruKey = key;
            }
        }

        if (lruKey) {
            console.log(`Evicting LRU item: ${lruKey}`);
            this._evict(lruKey);
        }
    }

    invalidate(pattern) {
        const keysToEvict = [];

        for (const key of this.cache.keys()) {
            if (key.includes(pattern)) {
                keysToEvict.push(key);
            }
        }

        keysToEvict.forEach(key => this._evict(key));

        console.log(`Invalidated ${keysToEvict.length} cache entries matching: ${pattern}`);
    }

    cleanup() {
        const now = Date.now();
        const keysToEvict = [];

        for (const [key, cachedItem] of this.cache) {
            if (now >= cachedItem.expiresAt) {
                keysToEvict.push(key);
            }
        }

        keysToEvict.forEach(key => this._evict(key));

        if (keysToEvict.length > 0) {
            console.log(`Cleaned up ${keysToEvict.length} expired cache entries`);
        }
    }

    getStats() {
        return {
            size: this.cache.size,
            maxSize: this.maxCacheSize,
            utilization: (this.cache.size / this.maxCacheSize) * 100,
            oldestEntry: this._getOldestEntry(),
            newestEntry: this._getNewestEntry()
        };
    }

    _getOldestEntry() {
        let oldest = null;
        let oldestTime = Infinity;

        for (const [key, cachedItem] of this.cache) {
            if (cachedItem.createdAt < oldestTime) {
                oldestTime = cachedItem.createdAt;
                oldest = key;
            }
        }

        return oldest;
    }

    _getNewestEntry() {
        let newest = null;
        let newestTime = 0;

        for (const [key, cachedItem] of this.cache) {
            if (cachedItem.createdAt > newestTime) {
                newestTime = cachedItem.createdAt;
                newest = key;
            }
        }

        return newest;
    }
}

// Global cache instance
const promiseCache = new PromiseCacheManager({
    defaultTTL: 300000, // 5 minutes
    maxCacheSize: 500
});

// Cached API functions
function getCachedUserData(userId) {
    return promiseCache.get(
        `user_${userId}`,
        () => fetch(`/api/users/${userId}`).then(r => r.json()),
        { ttl: 600000 } // 10 minutes for user data
    );
}

function getCachedMarketData(symbol) {
    return promiseCache.get(
        `market_${symbol}`,
        () => fetch(`/api/market/${symbol}`).then(r => r.json()),
        { ttl: 30000 } // 30 seconds for market data
    );
}

// Cache invalidation on user updates
function updateUser(userId, userData) {
    return fetch(`/api/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(userData)
    })
    .then(response => response.json())
    .then(result => {
        // Invalidate related cache entries
        promiseCache.invalidate(`user_${userId}`);
        return result;
    });
}
```


**💭 Think Out Loud:**
*"Caching trong promise chains requires careful consideration của data freshness vs performance. Tại trading platforms, market data caches chỉ valid vài giây, nhưng user profile data có thể cache hours. Key insight: Design cache TTL based on data volatility, và always provide graceful fallbacks when cache fails."*


---


## 🎯 VERIFICATION & MASTERY CHECKPOINTS


### ✅ Self-Assessment Questions


**Beginner Level:**


1. Explain tại sao mỗi `.then()` return một Promise mới thay vì modify original Promise.
2. Điều gì xảy ra khi handler trong `.then()` throw một error?
3. Làm thế nào để chain promises sequentially vs parallel execution?


**Intermediate Level:**


1. Implement một function để retry failed promises với exponential backoff.
2. Explain difference giữa `Promise.all()` và `Promise.allSettled()`.
3. Design error handling strategy cho complex promise chain với multiple failure points.


**Advanced Level:**


1. Implement circuit breaker pattern cho promise-based API calls.
2. Design caching layer với TTL và LRU eviction cho promise results.
3. Create request batching system để optimize multiple similar API calls.


### 🔍 Code Review Scenarios


**Scenario 1: Error Handling Anti-pattern**


```javascript
// What's wrong với code này?
function badErrorHandling() {
    return fetchUserData()
        .then(user => {
            return fetchUserPreferences(user.id)
                .catch(error => {
                    console.log('Preferences failed, using defaults');
                    return {};
                });
        })
        .then(preferences => {
            return processUserData(user, preferences); // Error: user is not defined
        });
}
```


**Expected Answer:** Variable scope issue - `user` không accessible trong second `.then()`. Solutions: sử dụng closure, destructure assignments, hoặc Promise.all().


**Scenario 2: Performance Issue**


```javascript
// Identify performance problems
async function loadUserDashboard(userIds) {
    const results = [];

    for (const userId of userIds) {
        const user = await fetchUser(userId);
        const preferences = await fetchPreferences(userId);
        const analytics = await fetchAnalytics(userId);

        results.push({ user, preferences, analytics });
    }

    return results;
}
```


**Expected Answer:** Sequential execution thay vì parallel. Solution: sử dụng `Promise.all()` cho parallel execution của independent operations.


### 🎪 Practical Exercises


**Exercise 1: Build Robust Data Pipeline**
Requirements:


- Fetch user data từ 3 different endpoints
- Handle partial failures gracefully
- Implement retry logic với backoff
- Cache results appropriately
- Provide comprehensive error reporting


**Exercise 2: Request Queue Implementation**
Requirements:


- Rate-limited API calls (max 5 concurrent, 10 per second)
- Priority queue cho urgent requests
- Automatic retry for failed requests
- Progress tracking và cancellation support


### 🎓 Interview Questions - Principal Level


**Question 1:** "Describe how you would design một promise-based data fetching system for một high-traffic e-commerce platform. Consider caching, error handling, performance, và user experience."


**Expected Discussion Points:**


- Multi-level caching strategy (memory, Redis, CDN)
- Circuit breaker pattern cho external service failures
- Request deduplication và batching
- Graceful degradation strategies
- Monitoring và alerting
- A/B testing infrastructure


**Question 2:** "You notice promise chains trong production đang causing memory leaks. How would you debug và fix this issue?"


**Expected Discussion Points:**


- Identify long-running promises không settle
- Check for circular references
- Implement promise timeout mechanisms
- Use memory profiling tools
- Design proper cleanup strategies
- Implement monitoring for promise lifecycle


**Question 3:** "Design một system để handle file uploads với progress tracking, chunked upload support, và automatic retry. Explain the promise chain architecture."


**Expected Discussion Points:**


- Chunked upload strategy
- Progress aggregation across chunks
- Error recovery mechanisms
- Concurrent upload optimization
- Server-side coordination
- Client-side state management


---


## 🏆 PRINCIPAL'S PERSPECTIVE: STRATEGIC IMPLICATIONS


### 🎯 Architecture Decision Framework


**When evaluating promise chain architectures, consider:**


**1. Scalability Patterns:**


- Request patterns và traffic characteristics
- Error rates và system reliability requirements
- Performance SLAs và user experience goals
- Resource utilization và cost implications


**2. Team Considerations:**


- Developer experience và onboarding
- Code maintainability và debugging complexity
- Testing strategies và coverage requirements
- Documentation và knowledge transfer


**3. System Integration:**


- Legacy system compatibility
- External service dependencies
- Monitoring và observability requirements
- Security và compliance considerations


### 🚀 Future Considerations


**Emerging Patterns:**


- WebAssembly integration với promise chains
- Service Workers cho advanced caching strategies
- HTTP/3 và connection multiplexing implications
- Edge computing và distributed promise execution


**Technology Evolution:**


- Async/await adoption strategies
- Observable patterns integration
- GraphQL subscription models
- Real-time collaboration features


### 💼 Business Impact


**Metrics That Matter:**


- User engagement improvements từ faster loading
- Conversion rate increases từ better error handling
- Developer productivity gains từ better patterns
- Infrastructure cost savings từ optimization


**Risk Mitigation:**


- Gradual rollout strategies cho new patterns
- Fallback mechanisms cho critical paths
- Performance regression detection
- User experience monitoring


---


## 🎉 Conclusion: From Callback Hell to Promise Paradise


Promise chaining represents một fundamental shift trong JavaScript development. Từ callback hell của early days đến elegant, maintainable promise chains today, chúng ta đã đi một chặng đường dài.


**Key Takeaways:**


1. **Fundamental Understanding:** Promises are state machines wrapping future values
2. **Chaining Power:** Every `.then()` returns new Promise, enabling composition
3. **Error Handling:** Errors propagate down chain until caught
4. **Performance Matters:** Parallel execution, caching, và optimization are crucial
5. **Production Ready:** Robust error handling, monitoring, và fallbacks are essential


**💭 Final Think Out Loud:**
*"Promise chaining đã transform cách chúng ta think về asynchronous programming. Từ imperative callback style đến declarative promise chains, chúng ta gained composability, readability, và maintainability. Nhưng với great power comes great responsibility - proper error handling, performance optimization, và monitoring are non-negotiable trong production systems."*


**Next Steps in Your Journey:**


- Master async/await as Promise syntactic sugar
- Explore advanced patterns như Observables
- Study service worker patterns cho offline-first applications
- Dive deep into performance profiling và optimization


Promise chaining is not just syntax - it's a mindset shift toward more reliable, maintainable asynchronous code. Master these patterns, và you'll write JavaScript that scales với confidence.


---


*"Code is read far more often than it's written. Promise chains that are clear, robust, và performant will serve your team và users well for years to come."*


**Remember:** Every great application starts với solid fundamentals. Promise chaining mastery is one of those fundamentals that will serve you throughout your JavaScript journey.
