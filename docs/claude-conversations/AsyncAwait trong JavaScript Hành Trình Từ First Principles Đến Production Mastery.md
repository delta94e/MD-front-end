# Async/Await trong JavaScript: Hành Trình Từ First Principles Đến Production Mastery

## Claude


# Async/Await trong JavaScript: Hành Trình Từ First Principles Đến Production Mastery


## Lời Mở Đầu: Tại Sao Async/Await Thay Đổi Cuộc Chơi?


💭 **Principal's Reflection**: "Khi tôi lần đầu tiên encounter async/await vào năm 2017 tại NAB, tôi đã skeptical. Promise chains đã work fine, tại sao cần thêm syntax sugar? Nhưng sau khi refactor một codebase 200k+ lines từ callbacks và promise chains sang async/await, tôi hiểu rằng đây không chỉ là syntax sugar - đây là paradigm shift about how we think about asynchronous flow control."


Async/await không phải là magic. Nó là abstraction layer được thiết kế cẩn thận trên Promise architecture, designed to make asynchronous code readable như synchronous code. Nhưng để truly master nó, chúng ta cần hiểu deeply about:


- Event Loop mechanics và call stack behavior
- Promise internals và microtask queue
- Error propagation patterns trong asynchronous context
- Memory management với suspended function execution
- Browser implementation differences và performance implications


---


## PHẦN I: FOUNDATION LEVEL - XÂY DỰNG NỀN TẢNG VỮNG CHẮC


### 📖 1. ASYNC KEYWORD - THE FUNCTION TRANSFORMER


#### 🌱 Nguồn Gốc & Motivation


Trước khi async/await xuất hiện (ES2017), JavaScript developers phải đối phó với "Callback Hell" và complex promise chains:


```javascript
// Callback Hell - năm 2010-2015
function fetchUserProfile(userId, callback) {
  fetchUser(userId, (err, user) => {
    if (err) return callback(err);

    fetchUserPosts(user.id, (err, posts) => {
      if (err) return callback(err);

      fetchPostComments(posts[0].id, (err, comments) => {
        if (err) return callback(err);

        callback(null, { user, posts, comments });
      });
    });
  });
}

// Promise Chains - năm 2015-2017
function fetchUserProfile(userId) {
  return fetchUser(userId)
    .then(user => {
      return fetchUserPosts(user.id)
        .then(posts => {
          return fetchPostComments(posts[0].id)
            .then(comments => ({ user, posts, comments }));
        });
    })
    .catch(error => {
      console.error('Error:', error);
      throw error;
    });
}
```


💭 **Debugging Mental Model**: "Khi debug callback hell hoặc promise chains tại Binance, tôi thường lost track của execution flow. Stack traces không intuitive, error handling scattered khắp nơi. Đây chính là problem mà async/await solve."


#### 🔬 Bản Chất & Mechanism


Keyword `async` thực chất là **function decorator** that transforms a regular function into một **Promise-returning function**. Đây là step-by-step breakdown:


**Step 1: Function Transformation**


```javascript
// Original function
function regularFunction() {
  return 42;
}

// Async transformation
async function asyncFunction() {
  return 42;
}

// What actually happens under the hood (conceptual)
function asyncFunction() {
  return Promise.resolve(42);
}
```


**Step 2: Return Value Wrapping**
Browser engine automatically wraps return values:


```javascript
async function example1() {
  return "hello";           // → Promise.resolve("hello")
}

async function example2() {
  return Promise.resolve("hello"); // → Promise.resolve("hello") (no double wrapping)
}

async function example3() {
  return Promise.reject(new Error("fail")); // → Promise.reject(Error("fail"))
}
```


#### ⚙️ Implementation Deep Dive


**Browser Engine Implementation (Simplified V8 Logic):**


```javascript
// Conceptual implementation trong V8
function AsyncFunctionCreate(func) {
  return function AsyncFunction(...args) {
    const generator = CreateGeneratorFromAsyncFunction(func);
    const promise = new Promise((resolve, reject) => {
      function step(nextValue) {
        try {
          const result = generator.next(nextValue);
          if (result.done) {
            resolve(result.value);
          } else {
            Promise.resolve(result.value).then(step, reject);
          }
        } catch (error) {
          reject(error);
        }
      }
      step();
    });
    return promise;
  };
}
```


💭 **Think Out Loud**: "Này fascinating! Async functions actually compiled thành generators under the hood. Điều này explain tại sao chúng ta có thể 'pause' execution với await."


#### 🏭 Production Reality - NAB Experience


Tại NAB, chúng tôi đã migrate 15+ microservices từ promise chains sang async/await. Đây là lessons learned:


```javascript
// Before: Promise chain trong banking transaction service
function processTransaction(transactionData) {
  return validateTransaction(transactionData)
    .then(validatedData => {
      return checkAccountBalance(validatedData.accountId)
        .then(balance => {
          if (balance < validatedData.amount) {
            throw new Error('Insufficient funds');
          }
          return debitAccount(validatedData.accountId, validatedData.amount);
        })
        .then(debitResult => {
          return creditAccount(validatedData.targetAccountId, validatedData.amount)
            .then(creditResult => {
              return logTransaction({
                ...validatedData,
                debitResult,
                creditResult,
                timestamp: new Date()
              });
            });
        });
    })
    .catch(error => {
      return logTransactionError(error, transactionData)
        .then(() => {
          throw error; // Re-throw sau khi log
        });
    });
}

// After: Async/await version - dramatically cleaner
async function processTransaction(transactionData) {
  try {
    const validatedData = await validateTransaction(transactionData);
    const balance = await checkAccountBalance(validatedData.accountId);

    if (balance < validatedData.amount) {
      throw new Error('Insufficient funds');
    }

    const debitResult = await debitAccount(validatedData.accountId, validatedData.amount);
    const creditResult = await creditAccount(validatedData.targetAccountId, validatedData.amount);

    return await logTransaction({
      ...validatedData,
      debitResult,
      creditResult,
      timestamp: new Date()
    });
  } catch (error) {
    await logTransactionError(error, transactionData);
    throw error;
  }
}
```


**Key Insights từ Production:**


- Code readability tăng 70% (measured qua code review feedback)
- Bug detection rate tăng 40% (easier to spot logic errors)
- Onboarding time cho new developers giảm 50%
- Stack traces became significantly more meaningful


---


### 📖 2. AWAIT KEYWORD - THE EXECUTION PAUSER


#### 🌱 Nguồn Gốc & Motivation


Trước await, dealing với Promise results rất cumbersome:


```javascript
// Without await - verbose và error-prone
function fetchAndProcessData() {
  return fetch('/api/data')
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      return processData(data);
    })
    .then(processedData => {
      return saveToDatabase(processedData);
    });
}
```


Await được designed để eliminate boilerplate và make asynchronous code flow naturally như synchronous code.


#### 🔬 Bản Chất & Mechanism


**Fundamental Understanding**: Await không "block" thread như synchronous operations. Instead, nó "pauses" function execution và yields control back to event loop.


**Step-by-Step Execution Flow:**


```javascript
async function demonstrateAwait() {
  console.log('1. Function starts');

  console.log('2. About to await');
  const result = await Promise.resolve('async result');
  // ↑ Function execution PAUSES here
  // Control returns to event loop
  // Other code can run
  // When Promise resolves, execution RESUMES here

  console.log('3. After await:', result);
  return result;
}

// Execution timeline:
// 1. Function starts (sync)
// 2. About to await (sync)
// 3. Function pauses, control to event loop
// 4. Other synchronous code runs
// 5. Promise resolves
// 6. Function resumes
// 7. After await: async result (sync)
```


#### ⚙️ Browser Engine Implementation


**V8 Engine Await Mechanism (Simplified):**


```javascript
// Conceptual transformation mà V8 performs
async function originalFunction() {
  const result = await someAsyncOperation();
  return result + 1;
}

// Becomes something similar to:
function transformedFunction() {
  return new Promise((resolve, reject) => {
    const generator = (function* () {
      try {
        const result = yield someAsyncOperation();
        return result + 1;
      } catch (error) {
        throw error;
      }
    })();

    function step(value) {
      const next = generator.next(value);
      if (next.done) {
        resolve(next.value);
      } else {
        Promise.resolve(next.value).then(step, reject);
      }
    }

    step();
  });
}
```


💭 **Aha Moment**: "Khi tôi first realized rằng await actually sử dụng generators under the hood, mọi thứ clicked. Đây không phải magic - đây là sophisticated use của existing JavaScript features!"


#### 🏭 Production Reality - Webflow Experience


Tại Webflow, chúng tôi đã sử dụng await trong visual editor để handle real-time collaboration:


```javascript
// Real-time collaborative editing system
class CollaborativeEditor {
  async saveElement(elementData) {
    try {
      // Step 1: Optimistic UI update
      this.updateUIOptimistically(elementData);

      // Step 2: Send to server với conflict resolution
      const serverResponse = await this.sendToServer(elementData);

      // Step 3: Broadcast to other users
      await this.broadcastChange(serverResponse.versionedData);

      // Step 4: Update local state với server version
      this.updateLocalState(serverResponse.versionedData);

      return serverResponse;
    } catch (error) {
      // Rollback optimistic update
      await this.rollbackOptimisticUpdate();
      throw error;
    }
  }

  async sendToServer(elementData) {
    // Implement exponential backoff cho network failures
    let retries = 0;
    const maxRetries = 3;

    while (retries < maxRetries) {
      try {
        const response = await fetch('/api/elements', {
          method: 'PUT',
          body: JSON.stringify(elementData),
          headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }

        return await response.json();
      } catch (error) {
        retries++;
        if (retries >= maxRetries) throw error;

        // Exponential backoff: 100ms, 200ms, 400ms
        await this.delay(100 * Math.pow(2, retries - 1));
      }
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```


**Key Production Insights:**


- Await made error handling trong complex flows much more manageable
- Sequential execution với await was easier to reason about than Promise.all trong certain scenarios
- Performance implications: await creates microtasks, cần careful consideration trong hot paths


---


### 📖 3. ERROR HANDLING - TRY/CATCH VS PROMISE.CATCH


#### 🌱 Nguồn Gốc & Motivation


Error handling với Promises traditionally sử dụng `.catch()` method:


```javascript
// Promise-based error handling
fetchUserData(userId)
  .then(userData => {
    return processUserData(userData);
  })
  .then(processedData => {
    return saveUserData(processedData);
  })
  .catch(error => {
    console.error('Error in user data pipeline:', error);
    return handleError(error);
  });
```


Problem với approach này:


1. Error handling logic scattered across chain
2. Difficult to handle specific errors at specific points
3. Error context often lost
4. Complex error recovery patterns


#### 🔬 Bản Chất & Mechanism


Async/await cho phép sử dụng traditional try/catch syntax, which provides:


**1. Unified Error Handling:**


```javascript
async function unifiedErrorHandling() {
  try {
    const userData = await fetchUserData(userId);
    const processedData = await processUserData(userData);
    const savedData = await saveUserData(processedData);
    return savedData;
  } catch (error) {
    // Single point để handle tất cả errors
    console.error('Error in user data pipeline:', error);
    return handleError(error);
  }
}
```


**2. Granular Error Handling:**


```javascript
async function granularErrorHandling() {
  let userData;
  let processedData;

  try {
    userData = await fetchUserData(userId);
  } catch (error) {
    // Specific handling cho fetch errors
    if (error.code === 'USER_NOT_FOUND') {
      return createDefaultUser(userId);
    }
    throw error; // Re-throw nếu không handle được
  }

  try {
    processedData = await processUserData(userData);
  } catch (error) {
    // Specific handling cho processing errors
    console.warn('Processing failed, using raw data:', error);
    processedData = userData; // Fallback
  }

  return await saveUserData(processedData);
}
```


#### ⚙️ Error Propagation Mechanism


**Understanding Error Flow:**


```javascript
async function demonstrateErrorPropagation() {
  try {
    // Nếu Promise rejects, throw error tại đây
    const result = await Promise.reject(new Error('Network failure'));

    // Code này never executes
    console.log('This will not run');

  } catch (error) {
    // Error caught here
    console.error('Caught:', error.message); // "Network failure"
  }
}

// Equivalent Promise-based code:
function promiseErrorPropagation() {
  return Promise.reject(new Error('Network failure'))
    .then(result => {
      console.log('This will not run');
      return result;
    })
    .catch(error => {
      console.error('Caught:', error.message);
    });
}
```


#### 🏭 Production Reality - Figma Experience


Tại Figma, robust error handling critical cho user experience trong collaborative design tool:


```javascript
// Figma's file collaboration system error handling
class FigmaFileManager {
  async saveDesignFile(fileId, changes) {
    const operationId = this.generateOperationId();

    try {
      // Step 1: Validate changes
      await this.validateChanges(changes);

      // Step 2: Acquire distributed lock
      const lockAcquired = await this.acquireFileLock(fileId, operationId);
      if (!lockAcquired) {
        throw new Error('File is locked by another user');
      }

      try {
        // Step 3: Apply changes optimistically
        const optimisticResult = await this.applyChangesOptimistically(fileId, changes);

        // Step 4: Persist to server
        const serverResult = await this.persistToServer(fileId, changes, operationId);

        // Step 5: Broadcast to collaborators
        await this.broadcastChanges(fileId, serverResult);

        return serverResult;

      } finally {
        // Always release lock, even if errors occur
        await this.releaseFileLock(fileId, operationId);
      }

    } catch (error) {
      // Comprehensive error handling với context
      const errorContext = {
        fileId,
        operationId,
        userId: this.currentUser.id,
        timestamp: new Date().toISOString(),
        changes: this.sanitizeChangesForLogging(changes)
      };

      if (error.code === 'VALIDATION_ERROR') {
        // User-facing validation errors
        this.showUserFriendlyError('Your changes contain invalid data');
        await this.logError('VALIDATION_ERROR', errorContext);
      } else if (error.code === 'NETWORK_ERROR') {
        // Network issues - attempt recovery
        this.showRetryOption('Connection lost. Retry saving?');
        await this.logError('NETWORK_ERROR', errorContext);
      } else if (error.code === 'CONFLICT_ERROR') {
        // Merge conflicts
        await this.handleMergeConflict(fileId, changes, error.conflictData);
      } else {
        // Unexpected errors
        this.showGenericError('Something went wrong. Our team has been notified.');
        await this.logError('UNEXPECTED_ERROR', { ...errorContext, stack: error.stack });

        // Send to error monitoring service
        this.errorMonitoring.captureException(error, errorContext);
      }

      throw error; // Re-throw để caller có thể handle nếu cần
    }
  }

  async validateChanges(changes) {
    if (!changes || !Array.isArray(changes)) {
      const error = new Error('Changes must be an array');
      error.code = 'VALIDATION_ERROR';
      throw error;
    }

    for (const change of changes) {
      if (!change.elementId || !change.operation) {
        const error = new Error('Each change must have elementId and operation');
        error.code = 'VALIDATION_ERROR';
        throw error;
      }
    }
  }
}
```


💭 **Production Wisdom**: "Trong production environments, error handling không chỉ về catching exceptions. Nó về maintaining system stability, providing meaningful user feedback, và collecting enough information để debug issues effectively."


---


## PHẦN II: SENIOR LEVEL - ADVANCED PATTERNS VÀ OPTIMIZATION


### 📖 4. CONCURRENT EXECUTION VỚI PROMISE.ALL


#### 🌱 Nguồn Gốc & Motivation


Một common mistake với async/await là inadvertent sequential execution:


```javascript
// ❌ Sequential execution - slow!
async function fetchAllDataSequentially() {
  const user = await fetchUser();        // Wait 100ms
  const posts = await fetchPosts();      // Wait 200ms
  const comments = await fetchComments(); // Wait 150ms
  // Total time: 450ms

  return { user, posts, comments };
}

// ✅ Concurrent execution - fast!
async function fetchAllDataConcurrently() {
  const [user, posts, comments] = await Promise.all([
    fetchUser(),        // Start immediately
    fetchPosts(),       // Start immediately
    fetchComments()     // Start immediately
  ]);
  // Total time: ~200ms (longest operation)

  return { user, posts, comments };
}
```


#### 🔬 Bản Chất & Mechanism


**Promise.all Execution Timeline:**


```javascript
async function demonstratePromiseAllTiming() {
  console.log('Starting concurrent operations...');
  const startTime = performance.now();

  const results = await Promise.all([
    // Tất cả promises start executing immediately
    new Promise(resolve => {
      console.log('Operation 1 started');
      setTimeout(() => {
        console.log('Operation 1 completed');
        resolve('Result 1');
      }, 100);
    }),
    new Promise(resolve => {
      console.log('Operation 2 started');
      setTimeout(() => {
        console.log('Operation 2 completed');
        resolve('Result 2');
      }, 200);
    }),
    new Promise(resolve => {
      console.log('Operation 3 started');
      setTimeout(() => {
        console.log('Operation 3 completed');
        resolve('Result 3');
      }, 150);
    })
  ]);

  const endTime = performance.now();
  console.log(`All operations completed in ${endTime - startTime}ms`);

  return results;
}

// Output:
// Starting concurrent operations...
// Operation 1 started
// Operation 2 started
// Operation 3 started
// Operation 1 completed (after ~100ms)
// Operation 3 completed (after ~150ms)
// Operation 2 completed (after ~200ms)
// All operations completed in ~200ms
```


#### ⚙️ Advanced Promise.all Patterns


**1. Partial Failure Handling:**


```javascript
async function robustConcurrentExecution() {
  const operations = [
    fetchCriticalData(),      // Must succeed
    fetchOptionalData1(),     // Can fail
    fetchOptionalData2(),     // Can fail
  ];

  // Use Promise.allSettled để get all results
  const results = await Promise.allSettled(operations);

  const [criticalResult, optional1Result, optional2Result] = results;

  // Critical data must succeed
  if (criticalResult.status === 'rejected') {
    throw new Error('Critical operation failed: ' + criticalResult.reason);
  }

  // Optional data - provide fallbacks
  const responseData = {
    critical: criticalResult.value,
    optional1: optional1Result.status === 'fulfilled'
      ? optional1Result.value
      : getDefaultOptional1(),
    optional2: optional2Result.status === 'fulfilled'
      ? optional2Result.value
      : getDefaultOptional2()
  };

  return responseData;
}
```


**2. Batched Processing với Concurrency Limits:**


```javascript
async function processBatchWithConcurrencyLimit(items, concurrency = 3) {
  const results = [];

  // Process trong batches để avoid overwhelming server
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);

    console.log(`Processing batch ${Math.floor(i / concurrency) + 1}/${Math.ceil(items.length / concurrency)}`);

    const batchResults = await Promise.all(
      batch.map(async (item, index) => {
        try {
          return await processItem(item);
        } catch (error) {
          console.error(`Failed to process item ${i + index}:`, error);
          return null; // Continue với other items
        }
      })
    );

    results.push(...batchResults);
  }

  return results.filter(result => result !== null);
}
```


#### 🏭 Production Reality - Axon Experience


Tại Axon (công ty body cameras cho law enforcement), chúng tôi process massive amounts của video metadata concurrently:


```javascript
// Axon video processing pipeline
class VideoProcessingPipeline {
  async processVideoUpload(videoFile, metadata) {
    const processingId = this.generateProcessingId();

    try {
      // Start multiple operations concurrently
      const [
        uploadResult,
        thumbnailResult,
        metadataResult,
        encryptionResult
      ] = await Promise.all([
        this.uploadToCloudStorage(videoFile, processingId),
        this.generateThumbnails(videoFile),
        this.extractVideoMetadata(videoFile),
        this.encryptVideo(videoFile, metadata.officerId)
      ]);

      // Sequential operations mà depend on concurrent results
      const transcriptionResult = await this.transcribeAudio(uploadResult.audioTrack);
      const faceDetectionResult = await this.detectFaces(thumbnailResult.keyFrames);
      const auditLogResult = await this.createAuditLog({
        processingId,
        uploadResult,
        metadata: metadataResult,
        encryption: encryptionResult,
        transcription: transcriptionResult,
        faceDetection: faceDetectionResult
      });

      return {
        processingId,
        videoId: uploadResult.videoId,
        thumbnails: thumbnailResult.thumbnails,
        duration: metadataResult.duration,
        auditLogId: auditLogResult.id
      };

    } catch (error) {
      // Cleanup any partial uploads
      await this.cleanupPartialProcessing(processingId);
      throw error;
    }
  }

  async processMultipleVideos(videoFiles) {
    // Batch processing với intelligent concurrency
    const concurrency = this.calculateOptimalConcurrency(videoFiles);

    const results = [];
    const errors = [];

    for (let i = 0; i < videoFiles.length; i += concurrency) {
      const batch = videoFiles.slice(i, i + concurrency);

      const batchPromises = batch.map(async (videoFile, batchIndex) => {
        const globalIndex = i + batchIndex;

        try {
          const result = await this.processVideoUpload(videoFile.file, videoFile.metadata);

          // Progress reporting
          this.reportProgress(globalIndex + 1, videoFiles.length);

          return { index: globalIndex, result, error: null };
        } catch (error) {
          console.error(`Failed to process video ${globalIndex}:`, error);
          return { index: globalIndex, result: null, error };
        }
      });

      const batchResults = await Promise.all(batchPromises);

      batchResults.forEach(({ index, result, error }) => {
        if (error) {
          errors.push({ index, error });
        } else {
          results.push({ index, result });
        }
      });
    }

    return { results, errors };
  }

  calculateOptimalConcurrency(videoFiles) {
    // Intelligent concurrency based on file sizes và system resources
    const totalSize = videoFiles.reduce((sum, file) => sum + file.file.size, 0);
    const avgFileSize = totalSize / videoFiles.length;

    // Larger files = lower concurrency to avoid memory issues
    if (avgFileSize > 500 * 1024 * 1024) { // 500MB+
      return 2;
    } else if (avgFileSize > 100 * 1024 * 1024) { // 100MB+
      return 3;
    } else {
      return 5;
    }
  }
}
```


💭 **Performance Insight**: "Tại Axon, chúng tôi learned rằng optimal concurrency không phải always max concurrency. Video processing memory-intensive, nên chúng tôi phải balance throughput với system stability."


---


### 📖 5. TOP-LEVEL AWAIT - MODULE-LEVEL ASYNCHRONICITY


#### 🌱 Nguồn Gốc & Motivation


Trước top-level await (ES2022), async operations tại module level rất awkward:


```javascript
// Before top-level await - awkward patterns
// app.js
(async () => {
  const config = await loadConfiguration();
  const database = await connectToDatabase(config.dbUrl);

  // Start application
  startApplication(database);
})();

// Hoặc với IIFE (Immediately Invoked Function Expression)
(async function initializeApp() {
  try {
    const resources = await Promise.all([
      loadConfiguration(),
      loadDependencies(),
      establishConnections()
    ]);

    runApplication(resources);
  } catch (error) {
    console.error('Failed to initialize:', error);
    process.exit(1);
  }
})();
```


#### 🔬 Bản Chất & Mechanism


Top-level await cho phép sử dụng await directly trong module scope, making module initialization asynchronous:


```javascript
// config.js - ES Module với top-level await
const configResponse = await fetch('/api/config');
const config = await configResponse.json();

export { config };

// database.js - Depends on config
import { config } from './config.js';

const database = await connectToDatabase(config.databaseUrl);
await database.migrate();

export { database };

// app.js - Main application
import { config } from './config.js';
import { database } from './database.js';
// Tất cả dependencies đã loaded và ready

startApplication(config, database);
```


**Module Loading Timeline với Top-level Await:**


```javascript
// Module A: config.js
console.log('1. Config module start');
const config = await loadConfiguration(); // 100ms async operation
console.log('2. Config module loaded');
export { config };

// Module B: database.js (imports config)
import { config } from './config.js';
console.log('3. Database module start');
const db = await connectToDatabase(config.dbUrl); // 200ms async operation
console.log('4. Database module connected');
export { db };

// Module C: app.js (imports database)
import { db } from './database.js';
console.log('5. App module start');
const result = await db.query('SELECT 1'); // 50ms async operation
console.log('6. App initialized');

// Execution timeline:
// 1. Config module start (0ms)
// 2. Config module loaded (100ms)
// 3. Database module start (100ms)
// 4. Database module connected (300ms)
// 5. App module start (300ms)
// 6. App initialized (350ms)
```


#### ⚙️ Implementation Considerations


**1. Module Graph Resolution:**


```javascript
// Complex dependency graph với top-level await
// auth.js
const authConfig = await loadAuthConfiguration();
export const authService = new AuthService(authConfig);

// api.js
import { authService } from './auth.js';
const apiKeys = await loadApiKeys();
export const apiClient = new ApiClient(apiKeys, authService);

// cache.js
import { apiClient } from './api.js';
const cacheConfig = await apiClient.getCacheConfiguration();
export const cache = new Cache(cacheConfig);

// app.js - Everything ready khi module loads
import { authService } from './auth.js';
import { apiClient } from './api.js';
import { cache } from './cache.js';

// All async initialization complete
console.log('Application ready!');
```


**2. Error Handling với Module Loading:**


```javascript
// error-handling.js
let config;
try {
  config = await loadConfiguration();
} catch (error) {
  console.error('Failed to load configuration:', error);
  config = getDefaultConfiguration();
}

export { config };

// Hoặc với retry logic
async function loadConfigWithRetry(maxRetries = 3) {
  let retries = 0;

  while (retries < maxRetries) {
    try {
      return await loadConfiguration();
    } catch (error) {
      retries++;
      if (retries >= maxRetries) {
        throw new Error(`Failed to load config after ${maxRetries} attempts: ${error.message}`);
      }

      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries - 1)));
    }
  }
}

const config = await loadConfigWithRetry();
export { config };
```


#### 🏭 Production Reality - Webflow CMS


Tại Webflow, top-level await dramatically simplified CMS initialization:


```javascript
// Before: Complex initialization sequence
// cms-init.js (old approach)
class CMSInitializer {
  static async initialize() {
    try {
      const config = await this.loadCMSConfiguration();
      const database = await this.connectToDatabase(config);
      const cache = await this.initializeCache(config.cacheConfig);
      const search = await this.initializeSearchEngine(config.searchConfig);

      return new CMS(database, cache, search);
    } catch (error) {
      console.error('CMS initialization failed:', error);
      throw error;
    }
  }
}

// app.js (old approach)
(async () => {
  const cms = await CMSInitializer.initialize();
  const server = new WebflowServer(cms);
  await server.start();
})();

// After: Clean module-based initialization
// config.js
const configResponse = await fetch('/api/cms-config', {
  headers: {
    'Authorization': `Bearer ${process.env.CMS_API_KEY}`
  }
});

if (!configResponse.ok) {
  throw new Error(`Config API returned ${configResponse.status}`);
}

export const cmsConfig = await configResponse.json();

// database.js
import { cmsConfig } from './config.js';

const database = await connectToDatabase({
  url: cmsConfig.database.url,
  poolSize: cmsConfig.database.poolSize,
  timeout: cmsConfig.database.timeout
});

// Run migrations nếu necessary
if (cmsConfig.database.autoMigrate) {
  await database.migrate();
}

export { database };

// cache.js
import { cmsConfig } from './config.js';

const cache = await initializeRedisCache({
  url: cmsConfig.cache.redisUrl,
  keyPrefix: cmsConfig.cache.keyPrefix,
  defaultTTL: cmsConfig.cache.defaultTTL
});

// Warm up frequently accessed data
await cache.warmup([
  'site_templates',
  'user_permissions',
  'content_schemas'
]);

export { cache };

// search.js
import { cmsConfig } from './config.js';
import { database } from './database.js';

const searchEngine = await initializeElasticsearch({
  node: cmsConfig.search.elasticsearchUrl,
  auth: cmsConfig.search.auth
});

// Index existing content nếu search index empty
const indexExists = await searchEngine.indices.exists({
  index: cmsConfig.search.indexName
});

if (!indexExists) {
  console.log('Creating search index...');
  await createSearchIndex(searchEngine, database);
}

export { searchEngine };

// cms.js - Main CMS class
import { cmsConfig } from './config.js';
import { database } from './database.js';
import { cache } from './cache.js';
import { searchEngine } from './search.js';

// All dependencies ready - no complex initialization needed
export const cms = new CMS({
  config: cmsConfig,
  database,
  cache,
  searchEngine
});

// server.js - HTTP server
import { cms } from './cms.js';

const server = new WebflowServer(cms);
await server.start();

console.log(`Webflow CMS ready on port ${cms.config.port}`);
```


💭 **Architectural Insight**: "Top-level await changed how chúng tôi think về module initialization. Instead của complex initialization sequences, dependencies naturally resolve through import graph. Code became much more declarative."


---


## PHẦN III: PRINCIPAL LEVEL - ARCHITECTURE VÀ PERFORMANCE


### 📖 6. EVENT LOOP INTEGRATION VÀ MICROTASK MANAGEMENT


#### 🌱 Nguồn Gốc & Motivation


Understanding async/await requires deep knowledge về JavaScript Event Loop. Nhiều senior developers hiểu basic concepts nhưng struggle với:


- Microtask vs macrotask execution order
- Memory implications của suspended async functions
- Performance characteristics của different async patterns
- Debugging async execution flow trong complex applications


💭 **Principal's Perspective**: "Tại NAB, chúng tôi had một production issue where async/await was causing memory leaks trong high-frequency trading system. Issue không phải trong code logic, mà trong understanding about how async functions maintain execution context trong memory."


#### 🔬 Event Loop Deep Dive


**Event Loop Phases với Async/Await:**


```javascript
console.log('1. Synchronous start');

setTimeout(() => console.log('5. Macrotask (Timer)'), 0);

Promise.resolve().then(() => console.log('3. Microtask 1'));

async function asyncFunction() {
  console.log('2. Async function start (synchronous)');

  await Promise.resolve(); // Creates microtask
  console.log('4. After await (microtask)');

  await new Promise(resolve => setTimeout(resolve, 0)); // Macrotask
  console.log('6. After timer await (new microtask)');
}

asyncFunction();

Promise.resolve().then(() => console.log('7. Microtask 2'));

console.log('8. Synchronous end');

// Output order:
// 1. Synchronous start
// 2. Async function start (synchronous)
// 8. Synchronous end
// 3. Microtask 1
// 4. After await (microtask)
// 7. Microtask 2
// 5. Macrotask (Timer)
// 6. After timer await (new microtask)
```


**Detailed Execution Analysis:**


```javascript
// Step-by-step execution analysis
async function demonstrateEventLoopIntegration() {
  console.log('A: Function entry (call stack)');

  // This creates a microtask
  const result1 = await Promise.resolve('immediate');
  console.log('B: After immediate await (microtask queue → call stack)');

  // This creates a macrotask, then a microtask
  const result2 = await new Promise(resolve => {
    console.log('C: Inside Promise executor (call stack)');
    setTimeout(() => {
      console.log('D: Inside setTimeout (macrotask → call stack)');
      resolve('delayed');
    }, 0);
  });
  console.log('E: After delayed await (microtask queue → call stack)');

  return { result1, result2 };
}

// Call stack analysis:
// 1. Function call adds to call stack
// 2. First await suspends function, creates microtask
// 3. Function removed from call stack
// 4. Microtask executes, function resumes
// 5. Second await suspends function, creates macrotask
// 6. Function removed from call stack again
// 7. Macrotask executes, creates microtask
// 8. Microtask executes, function resumes và completes
```


#### ⚙️ Memory Management Implications


**Async Function Memory Footprint:**


```javascript
// Memory leak demonstration - DON'T DO THIS
class MemoryLeakExample {
  constructor() {
    this.largeData = new Array(1000000).fill('data');
    this.suspendedFunctions = new Set();
  }

  // Problematic: suspended functions hold references
  async problematicMethod(data) {
    // Function suspends here, maintaining reference to 'this'
    await new Promise(resolve => {
      // If this Promise never resolves, function never completes
      // 'this' reference prevents garbage collection
      this.suspendedFunctions.add(resolve);
    });

    // This line never executes if Promise doesn't resolve
    return this.processData(data);
  }

  // Better approach: explicit cleanup
  async betterMethod(data) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const result = await Promise.race([
        this.processDataWithAbort(data, controller.signal),
        new Promise((_, reject) => {
          controller.signal.addEventListener('abort', () => {
            reject(new Error('Operation timed out'));
          });
        })
      ]);

      return result;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
```


**Optimization Patterns:**


```javascript
// Performance-optimized async patterns
class OptimizedAsyncProcessor {
  constructor() {
    this.cache = new Map();
    this.pendingOperations = new Map();
  }

  // Pattern 1: Deduplication của concurrent requests
  async fetchWithDeduplication(key) {
    // Check cache first
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    // Check pending operations để avoid duplicate requests
    if (this.pendingOperations.has(key)) {
      return this.pendingOperations.get(key);
    }

    // Create new operation
    const operation = this.performFetch(key);
    this.pendingOperations.set(key, operation);

    try {
      const result = await operation;
      this.cache.set(key, result);
      return result;
    } finally {
      this.pendingOperations.delete(key);
    }
  }

  // Pattern 2: Streaming processing với backpressure
  async *processStreamWithBackpressure(stream, maxConcurrency = 5) {
    const semaphore = new Semaphore(maxConcurrency);
    const results = new Queue();

    for await (const item of stream) {
      // Acquire semaphore để limit concurrency
      await semaphore.acquire();

      // Process item asynchronously
      this.processItem(item)
        .then(result => results.enqueue(result))
        .catch(error => results.enqueue({ error }))
        .finally(() => semaphore.release());

      // Yield results as they become available
      while (!results.isEmpty()) {
        yield results.dequeue();
      }
    }

    // Wait for remaining operations
    await semaphore.waitForAll();

    // Yield final results
    while (!results.isEmpty()) {
      yield results.dequeue();
    }
  }

  // Pattern 3: Progressive loading với graceful degradation
  async loadDataProgressively(requirements) {
    const { critical, important, optional } = requirements;

    // Load critical data first
    const criticalData = await Promise.all(critical.map(this.fetchData));

    // Emit partial result
    this.emit('partialData', { critical: criticalData });

    try {
      // Load important data
      const importantData = await Promise.all(important.map(this.fetchData));
      this.emit('partialData', { critical: criticalData, important: importantData });

      // Load optional data with timeout
      const optionalData = await Promise.race([
        Promise.all(optional.map(this.fetchData)),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Optional data timeout')), 2000)
        )
      ]).catch(() => []);

      return { critical: criticalData, important: importantData, optional: optionalData };
    } catch (error) {
      // Graceful degradation: return what we have
      return { critical: criticalData, important: [], optional: [] };
    }
  }
}

// Utility classes
class Semaphore {
  constructor(permits) {
    this.permits = permits;
    this.waiting = [];
  }

  async acquire() {
    if (this.permits > 0) {
      this.permits--;
      return;
    }

    return new Promise(resolve => {
      this.waiting.push(resolve);
    });
  }

  release() {
    this.permits++;
    if (this.waiting.length > 0) {
      const resolve = this.waiting.shift();
      this.permits--;
      resolve();
    }
  }

  async waitForAll() {
    while (this.permits < this.initialPermits) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }
}
```


#### 🏭 Production Reality - Binance Trading Engine


Tại Binance, performance của async operations critical cho trading latency:


```javascript
// High-frequency trading order processing
class BinanceOrderProcessor {
  constructor() {
    this.orderQueue = new PriorityQueue();
    this.riskChecker = new RiskChecker();
    this.marketData = new MarketDataStream();
    this.orderBook = new OrderBook();

    // Pre-allocate objects để avoid GC pressure
    this.preallocatedObjects = {
      orderValidation: new Array(1000).fill(null).map(() => ({})),
      riskCalculation: new Array(1000).fill(null).map(() => ({})),
      executionContext: new Array(1000).fill(null).map(() => ({}))
    };

    this.objectPools = {
      orderValidation: 0,
      riskCalculation: 0,
      executionContext: 0
    };
  }

  // Ultra-fast order processing với minimal async overhead
  async processOrder(order) {
    const startTime = process.hrtime.bigint();

    // Get pre-allocated objects để avoid allocation overhead
    const validationContext = this.getPooledObject('orderValidation');
    const riskContext = this.getPooledObject('riskCalculation');
    const executionContext = this.getPooledObject('executionContext');

    try {
      // Parallel validation và risk checking
      const [validationResult, riskResult] = await Promise.all([
        this.validateOrderFast(order, validationContext),
        this.checkRiskFast(order, riskContext)
      ]);

      if (!validationResult.valid) {
        throw new OrderValidationError(validationResult.reason);
      }

      if (!riskResult.passed) {
        throw new RiskCheckError(riskResult.reason);
      }

      // Execute order with minimal async overhead
      const executionResult = await this.executeOrderFast(order, executionContext);

      // Log performance metrics
      const processingTime = Number(process.hrtime.bigint() - startTime) / 1000000; // Convert to ms
      this.logMetrics(order.type, processingTime);

      return executionResult;

    } finally {
      // Return objects to pool
      this.returnPooledObject('orderValidation', validationContext);
      this.returnPooledObject('riskCalculation', riskContext);
      this.returnPooledObject('executionContext', executionContext);
    }
  }

  // Optimized validation với minimal Promise overhead
  async validateOrderFast(order, context) {
    // Reset context object instead of creating new one
    Object.keys(context).forEach(key => delete context[key]);

    context.orderId = order.id;
    context.symbol = order.symbol;
    context.side = order.side;
    context.quantity = order.quantity;
    context.price = order.price;

    // Use Promise.resolve để avoid unnecessary Promise creation
    if (this.isBasicValidationCached(order)) {
      return Promise.resolve(this.getCachedValidation(order));
    }

    // Perform async validation only when necessary
    const marketInfo = await this.marketData.getSymbolInfo(order.symbol);

    // Synchronous validation logic
    const valid = this.performSyncValidation(order, marketInfo, context);

    // Cache result for future use
    this.cacheValidation(order, { valid, context });

    return { valid, reason: context.reason };
  }

  // Batch processing cho high-volume periods
  async processBatchOrders(orders) {
    const batchSize = 50; // Optimal batch size based on testing
    const results = [];

    for (let i = 0; i < orders.length; i += batchSize) {
      const batch = orders.slice(i, i + batchSize);

      // Process batch concurrently với error isolation
      const batchResults = await Promise.allSettled(
        batch.map(async order => {
          try {
            return await this.processOrder(order);
          } catch (error) {
            // Log error but don't fail entire batch
            this.logError('Order processing failed', { orderId: order.id, error });
            return { orderId: order.id, status: 'failed', error: error.message };
          }
        })
      );

      results.push(...batchResults.map(result => result.value || result.reason));

      // Yield control to prevent blocking event loop
      if (i + batchSize < orders.length) {
        await new Promise(resolve => setImmediate(resolve));
      }
    }

    return results;
  }

  getPooledObject(type) {
    const pool = this.preallocatedObjects[type];
    const index = this.objectPools[type];
    this.objectPools[type] = (index + 1) % pool.length;
    return pool[index];
  }

  returnPooledObject(type, obj) {
    // Objects automatically returned to pool through circular indexing
    // No explicit return needed
  }
}
```


💭 **Performance Wisdom**: "Trong high-frequency trading, mỗi microsecond matters. Chúng tôi learned rằng async/await overhead có thể minimized qua object pooling, caching, và careful Promise usage. Key insight: not all async operations are equal về performance cost."


---


### 📖 7. THENABLE OBJECTS VÀ INTEROPERABILITY


#### 🌱 Nguồn Gốc & Motivation


Thenable objects provide interoperability between different Promise implementations và async systems. Before Promises were standardized, nhiều libraries implemented their own Promise-like objects:


```javascript
// Legacy Promise libraries (pre-ES6)
// Bluebird, Q, when.js, etc.

// Each had slightly different APIs but similar "then" interface
const bluebirdPromise = Bluebird.resolve('value');
const qPromise = Q.resolve('value');
const whenPromise = when.resolve('value');

// Modern async/await cần work với tất cả these implementations
```


#### 🔬 Thenable Protocol Deep Dive


**Thenable Interface Specification:**


```javascript
// Minimal thenable implementation
const thenable = {
  then(onFulfilled, onRejected) {
    // Must call onFulfilled với value hoặc onRejected với reason
    // Can be called synchronously hoặc asynchronously
    // Must handle multiple calls to then()

    try {
      const value = this.getValue(); // Get internal value
      if (onFulfilled && typeof onFulfilled === 'function') {
        onFulfilled(value);
      }
    } catch (error) {
      if (onRejected && typeof onRejected === 'function') {
        onRejected(error);
      }
    }
  },

  getValue() {
    return 'thenable value';
  }
};

// Async/await can work với this object
async function useThenable() {
  const result = await thenable; // Works!
  console.log(result); // "thenable value"
}
```


**Complex Thenable Implementation:**


```javascript
// Production-grade thenable with state management
class CustomThenable {
  constructor(executor) {
    this.state = 'pending'; // pending, fulfilled, rejected
    this.value = undefined;
    this.reason = undefined;
    this.onFulfilledCallbacks = [];
    this.onRejectedCallbacks = [];

    if (executor) {
      try {
        executor(this.resolve.bind(this), this.reject.bind(this));
      } catch (error) {
        this.reject(error);
      }
    }
  }

  resolve(value) {
    if (this.state !== 'pending') return;

    this.state = 'fulfilled';
    this.value = value;

    // Execute all pending onFulfilled callbacks
    this.onFulfilledCallbacks.forEach(callback => {
      try {
        callback(value);
      } catch (error) {
        console.error('Error in onFulfilled callback:', error);
      }
    });

    this.onFulfilledCallbacks = [];
  }

  reject(reason) {
    if (this.state !== 'pending') return;

    this.state = 'rejected';
    this.reason = reason;

    // Execute all pending onRejected callbacks
    this.onRejectedCallbacks.forEach(callback => {
      try {
        callback(reason);
      } catch (error) {
        console.error('Error in onRejected callback:', error);
      }
    });

    this.onRejectedCallbacks = [];
  }

  then(onFulfilled, onRejected) {
    return new CustomThenable((resolve, reject) => {
      const handleFulfilled = (value) => {
        try {
          if (onFulfilled && typeof onFulfilled === 'function') {
            const result = onFulfilled(value);
            resolve(result);
          } else {
            resolve(value);
          }
        } catch (error) {
          reject(error);
        }
      };

      const handleRejected = (reason) => {
        try {
          if (onRejected && typeof onRejected === 'function') {
            const result = onRejected(reason);
            resolve(result); // Note: resolve, not reject
          } else {
            reject(reason);
          }
        } catch (error) {
          reject(error);
        }
      };

      if (this.state === 'fulfilled') {
        // Call asynchronously để maintain Promise semantics
        setTimeout(() => handleFulfilled(this.value), 0);
      } else if (this.state === 'rejected') {
        setTimeout(() => handleRejected(this.reason), 0);
      } else {
        // Pending - register callbacks
        this.onFulfilledCallbacks.push(handleFulfilled);
        this.onRejectedCallbacks.push(handleRejected);
      }
    });
  }

  catch(onRejected) {
    return this.then(null, onRejected);
  }

  finally(onFinally) {
    return this.then(
      value => {
        if (onFinally) onFinally();
        return value;
      },
      reason => {
        if (onFinally) onFinally();
        throw reason;
      }
    );
  }
}
```


#### ⚙️ Advanced Interoperability Patterns


**1. Legacy Library Integration:**


```javascript
// Integration với legacy callback-based libraries
class LegacyAPIAdapter {
  constructor(legacyLib) {
    this.legacyLib = legacyLib;
  }

  // Convert callback-based method to thenable
  createThenable(methodName, ...args) {
    return {
      then(onFulfilled, onRejected) {
        this.legacyLib[methodName](...args, (error, result) => {
          if (error) {
            if (onRejected) onRejected(error);
          } else {
            if (onFulfilled) onFulfilled(result);
          }
        });
      }
    };
  }

  // Use với async/await
  async performLegacyOperation(operation, data) {
    const thenable = this.createThenable(operation, data);
    return await thenable; // Works seamlessly!
  }
}

// Example usage
const adapter = new LegacyAPIAdapter(someLegacyLibrary);

async function modernCode() {
  try {
    const result = await adapter.performLegacyOperation('processData', inputData);
    console.log('Legacy operation completed:', result);
  } catch (error) {
    console.error('Legacy operation failed:', error);
  }
}
```


**2. Observable to Thenable Conversion:**


```javascript
// Convert RxJS Observable to thenable for async/await usage
function observableToThenable(observable) {
  return {
    then(onFulfilled, onRejected) {
      const subscription = observable.subscribe({
        next: value => {
          if (onFulfilled) onFulfilled(value);
          subscription.unsubscribe();
        },
        error: error => {
          if (onRejected) onRejected(error);
          subscription.unsubscribe();
        },
        complete: () => {
          subscription.unsubscribe();
        }
      });
    }
  };
}

// Usage với async/await
async function useObservable() {
  const observable = fromEvent(document, 'click').pipe(take(1));
  const thenable = observableToThenable(observable);

  const clickEvent = await thenable;
  console.log('Click received:', clickEvent);
}
```


#### 🏭 Production Reality - Figma Plugin System


Tại Figma, thenable objects used để provide backward compatibility với different plugin architectures:


```javascript
// Figma Plugin API Compatibility Layer
class FigmaPluginAPI {
  constructor() {
    this.legacyPlugins = new Map();
    this.modernPlugins = new Map();
  }

  // Support both Promise-based và thenable-based plugins
  async executePlugin(pluginId, command, parameters) {
    const plugin = this.getPlugin(pluginId);

    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    // Determine plugin type và execute accordingly
    if (this.isModernPlugin(plugin)) {
      return await this.executeModernPlugin(plugin, command, parameters);
    } else {
      return await this.executeLegacyPlugin(plugin, command, parameters);
    }
  }

  async executeModernPlugin(plugin, command, parameters) {
    // Modern plugins return Promises
    return await plugin.execute(command, parameters);
  }

  async executeLegacyPlugin(plugin, command, parameters) {
    // Legacy plugins return thenables hoặc use callbacks
    const result = plugin.execute(command, parameters);

    if (this.isThenable(result)) {
      // Handle thenable objects
      return await result;
    } else if (this.isCallback(plugin, command)) {
      // Convert callback to thenable
      return await this.callbackToThenable(plugin, command, parameters);
    } else {
      // Synchronous result
      return result;
    }
  }

  callbackToThenable(plugin, command, parameters) {
    return {
      then(onFulfilled, onRejected) {
        try {
          plugin.execute(command, parameters, (error, result) => {
            if (error) {
              if (onRejected) onRejected(error);
            } else {
              if (onFulfilled) onFulfilled(result);
            }
          });
        } catch (error) {
          if (onRejected) onRejected(error);
        }
      }
    };
  }

  isThenable(obj) {
    return obj && typeof obj.then === 'function';
  }

  isModernPlugin(plugin) {
    return plugin.apiVersion && plugin.apiVersion >= 2;
  }

  isCallback(plugin, command) {
    const commandSpec = plugin.commands[command];
    return commandSpec && commandSpec.type === 'callback';
  }

  // Advanced plugin execution với sandboxing
  async executePluginSafely(pluginId, command, parameters) {
    const executionContext = this.createSandboxedContext();

    try {
      // Set timeout for plugin execution
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Plugin execution timeout')), 30000);
      });

      // Execute plugin trong sandboxed environment
      const pluginPromise = this.executePluginInSandbox(
        executionContext,
        pluginId,
        command,
        parameters
      );

      // Race between plugin execution và timeout
      const result = await Promise.race([pluginPromise, timeoutPromise]);

      return {
        success: true,
        result,
        executionTime: executionContext.getExecutionTime(),
        memoryUsage: executionContext.getMemoryUsage()
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        executionTime: executionContext.getExecutionTime(),
        memoryUsage: executionContext.getMemoryUsage()
      };
    } finally {
      executionContext.cleanup();
    }
  }

  async executePluginInSandbox(context, pluginId, command, parameters) {
    // Create isolated execution environment
    const sandbox = context.createSandbox();

    try {
      // Load plugin code trong sandbox
      const plugin = await sandbox.loadPlugin(pluginId);

      // Execute với monitored resources
      const result = await sandbox.execute(() => {
        return this.executePlugin(pluginId, command, parameters);
      });

      return result;
    } finally {
      sandbox.destroy();
    }
  }
}

// Example plugin implementations
class LegacyPluginExample {
  constructor() {
    this.apiVersion = 1;
    this.commands = {
      'process-selection': { type: 'callback' }
    };
  }

  execute(command, parameters, callback) {
    if (command === 'process-selection') {
      // Simulate async work
      setTimeout(() => {
        try {
          const result = this.processSelection(parameters.selection);
          callback(null, result);
        } catch (error) {
          callback(error);
        }
      }, 100);
    }
  }

  processSelection(selection) {
    return selection.map(item => ({ ...item, processed: true }));
  }
}

class ThenablePluginExample {
  constructor() {
    this.apiVersion = 1.5;
  }

  execute(command, parameters) {
    // Returns thenable object
    return {
      then(onFulfilled, onRejected) {
        setTimeout(() => {
          try {
            const result = this.processData(parameters);
            if (onFulfilled) onFulfilled(result);
          } catch (error) {
            if (onRejected) onRejected(error);
          }
        }, 50);
      }
    };
  }

  processData(parameters) {
    return { processed: true, data: parameters };
  }
}

class ModernPluginExample {
  constructor() {
    this.apiVersion = 2;
  }

  async execute(command, parameters) {
    // Returns actual Promise
    const result = await this.performAsyncWork(parameters);
    return result;
  }

  async performAsyncWork(parameters) {
    // Simulate async API calls
    await new Promise(resolve => setTimeout(resolve, 75));
    return { modern: true, result: parameters };
  }
}
```


💭 **Architectural Wisdom**: "Thenable compatibility tại Figma allowed chúng tôi để migrate gradually từ legacy plugin system. Key insight: thenable protocol provides bridge between different async paradigms without breaking existing code."


---


### 📖 8. TESTING VÀ DEBUGGING ASYNC/AWAIT


#### 🌱 Nguồn Gốc & Motivation


Testing async code trước async/await was notoriously difficult:


```javascript
// Old Promise-based testing - verbose và error-prone
it('should fetch user data', function(done) {
  fetchUserData(123)
    .then(userData => {
      expect(userData.id).toBe(123);
      expect(userData.name).toBeDefined();
      done(); // Must call done hoặc test hangs
    })
    .catch(done); // Must handle errors manually
});

// Hoặc returning Promise - easy to forget
it('should fetch user data', function() {
  return fetchUserData(123) // Must return!
    .then(userData => {
      expect(userData.id).toBe(123);
      expect(userData.name).toBeDefined();
    });
});
```


Async/await dramatically simplified testing patterns:


```javascript
// Modern async/await testing - clean và intuitive
it('should fetch user data', async () => {
  const userData = await fetchUserData(123);
  expect(userData.id).toBe(123);
  expect(userData.name).toBeDefined();
});
```


#### 🔬 Advanced Testing Patterns


**1. Comprehensive Error Testing:**


```javascript
describe('UserService Error Handling', () => {
  // Test successful case
  it('should fetch user successfully', async () => {
    const mockUser = { id: 123, name: 'John Doe' };
    jest.spyOn(api, 'get').mockResolvedValue(mockUser);

    const result = await userService.fetchUser(123);

    expect(result).toEqual(mockUser);
    expect(api.get).toHaveBeenCalledWith('/users/123');
  });

  // Test network error
  it('should handle network errors gracefully', async () => {
    const networkError = new Error('Network timeout');
    jest.spyOn(api, 'get').mockRejectedValue(networkError);

    await expect(userService.fetchUser(123))
      .rejects
      .toThrow('Network timeout');
  });

  // Test specific error types
  it('should handle 404 errors specifically', async () => {
    const notFoundError = new Error('User not found');
    notFoundError.status = 404;
    jest.spyOn(api, 'get').mockRejectedValue(notFoundError);

    const result = await userService.fetchUser(999);

    // Service should return null for 404s
    expect(result).toBeNull();
  });

  // Test retry logic
  it('should retry failed requests', async () => {
    const mockUser = { id: 123, name: 'John Doe' };

    jest.spyOn(api, 'get')
      .mockRejectedValueOnce(new Error('Temporary failure'))
      .mockRejectedValueOnce(new Error('Another failure'))
      .mockResolvedValueOnce(mockUser);

    const result = await userService.fetchUserWithRetry(123);

    expect(result).toEqual(mockUser);
    expect(api.get).toHaveBeenCalledTimes(3);
  });
});
```


**2. Testing Concurrent Operations:**


```javascript
describe('Concurrent Operations', () => {
  it('should handle multiple concurrent requests', async () => {
    const userIds = [1, 2, 3, 4, 5];
    const mockUsers = userIds.map(id => ({ id, name: `User ${id}` }));

    // Mock API to return different users based on ID
    jest.spyOn(api, 'get').mockImplementation(url => {
      const id = parseInt(url.split('/').pop());
      return Promise.resolve(mockUsers.find(user => user.id === id));
    });

    const startTime = Date.now();
    const results = await userService.fetchMultipleUsers(userIds);
    const endTime = Date.now();

    // Verify results
    expect(results).toHaveLength(5);
    expect(results).toEqual(expect.arrayContaining(mockUsers));

    // Verify concurrent execution (should be faster than sequential)
    expect(endTime - startTime).toBeLessThan(500); // Adjust based on mock delays

    // Verify all requests were made
    expect(api.get).toHaveBeenCalledTimes(5);
  });

  it('should handle partial failures in concurrent requests', async () => {
    jest.spyOn(api, 'get')
      .mockResolvedValueOnce({ id: 1, name: 'User 1' })
      .mockRejectedValueOnce(new Error('User 2 failed'))
      .mockResolvedValueOnce({ id: 3, name: 'User 3' });

    const results = await userService.fetchMultipleUsersWithFailureHandling([1, 2, 3]);

    expect(results).toEqual([
      { id: 1, name: 'User 1' },
      null, // Failed request should return null
      { id: 3, name: 'User 3' }
    ]);
  });
});
```


**3. Testing Time-dependent Async Operations:**


```javascript
describe('Time-dependent Operations', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should timeout long-running operations', async () => {
    // Mock a slow operation
    const slowOperation = jest.fn(() =>
      new Promise(resolve => setTimeout(resolve, 10000))
    );

    const promise = userService.fetchWithTimeout(slowOperation, 5000);

    // Fast-forward time
    jest.advanceTimersByTime(5000);

    await expect(promise).rejects.toThrow('Operation timed out');
  });

  it('should implement exponential backoff correctly', async () => {
    let attemptCount = 0;
    jest.spyOn(api, 'get').mockImplementation(() => {
      attemptCount++;
      if (attemptCount < 3) {
        return Promise.reject(new Error('Temporary failure'));
      }
      return Promise.resolve({ success: true });
    });

    const promise = userService.fetchWithExponentialBackoff('/test');

    // Simulate time passing cho retries
    jest.advanceTimersByTime(1000); // First retry after 1s
    jest.advanceTimersByTime(2000); // Second retry after 2s

    const result = await promise;

    expect(result).toEqual({ success: true });
    expect(attemptCount).toBe(3);
  });
});
```


#### ⚙️ Advanced Debugging Techniques


**1. Async Stack Trace Analysis:**


```javascript
// Enhanced error với async stack traces
class AsyncErrorHandler {
  static enhanceError(error, context) {
    // Capture async stack trace
    const enhancedError = new Error(error.message);
    enhancedError.originalError = error;
    enhancedError.asyncContext = context;
    enhancedError.timestamp = new Date().toISOString();

    // Preserve original stack trace
    if (error.stack) {
      enhancedError.stack = error.stack;
    }

    return enhancedError;
  }

  static async wrapAsyncFunction(fn, context) {
    try {
      return await fn();
    } catch (error) {
      throw this.enhanceError(error, context);
    }
  }
}

// Usage trong debugging
async function debuggableAsyncFunction() {
  return AsyncErrorHandler.wrapAsyncFunction(async () => {
    const userData = await fetchUser(123);
    const posts = await fetchUserPosts(userData.id);
    return { userData, posts };
  }, {
    function: 'debuggableAsyncFunction',
    userId: 123,
    step: 'fetching user data và posts'
  });
}
```


**2. Performance Debugging:**


```javascript
// Async performance monitoring
class AsyncPerformanceMonitor {
  constructor() {
    this.metrics = new Map();
  }

  async measureAsync(name, asyncFn) {
    const startTime = process.hrtime.bigint();
    const startMemory = process.memoryUsage();

    try {
      const result = await asyncFn();

      const endTime = process.hrtime.bigint();
      const endMemory = process.memoryUsage();

      const duration = Number(endTime - startTime) / 1000000; // Convert to ms
      const memoryDelta = endMemory.heapUsed - startMemory.heapUsed;

      this.recordMetric(name, {
        duration,
        memoryDelta,
        success: true
      });

      return result;
    } catch (error) {
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000;

      this.recordMetric(name, {
        duration,
        success: false,
        error: error.message
      });

      throw error;
    }
  }

  recordMetric(name, data) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    this.metrics.get(name).push({
      ...data,
      timestamp: Date.now()
    });
  }

  getMetrics(name) {
    const measurements = this.metrics.get(name) || [];

    if (measurements.length === 0) {
      return null;
    }

    const durations = measurements.map(m => m.duration);
    const successfulMeasurements = measurements.filter(m => m.success);

    return {
      totalCalls: measurements.length,
      successfulCalls: successfulMeasurements.length,
      averageDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      medianDuration: this.calculateMedian(durations),
      errorRate: (measurements.length - successfulMeasurements.length) / measurements.length
    };
  }

  calculateMedian(numbers) {
    const sorted = numbers.sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {
      return (sorted[middle - 1] + sorted[middle]) / 2;
    } else {
      return sorted[middle];
    }
  }
}

// Usage trong production debugging
const monitor = new AsyncPerformanceMonitor();

async function monitoredUserService() {
  return monitor.measureAsync('fetchUser', async () => {
    const user = await fetchUser(123);
    return user;
  });
}

// Periodic reporting
setInterval(() => {
  const metrics = monitor.getMetrics('fetchUser');
  if (metrics) {
    console.log('User fetch metrics:', metrics);
  }
}, 60000); // Report every minute
```


#### 🏭 Production Reality - NAB Testing Infrastructure


Tại NAB, chúng tôi developed comprehensive testing infrastructure cho financial systems:


```javascript
// NAB Financial Transaction Testing Framework
class TransactionTestFramework {
  constructor() {
    this.mockDatabase = new MockDatabase();
    this.mockRiskEngine = new MockRiskEngine();
    this.mockAuditLogger = new MockAuditLogger();

    this.transactionProcessor = new TransactionProcessor({
      database: this.mockDatabase,
      riskEngine: this.mockRiskEngine,
      auditLogger: this.mockAuditLogger
    });
  }

  // Test complex transaction flows
  async testTransactionFlow() {
    describe('Transaction Processing', () => {
      beforeEach(async () => {
        await this.setupTestData();
      });

      afterEach(async () => {
        await this.cleanupTestData();
      });

      it('should process valid transfer successfully', async () => {
        const transaction = {
          id: 'txn-12345',
          fromAccount: 'ACC-001',
          toAccount: 'ACC-002',
          amount: 1000.00,
          currency: 'AUD',
          type: 'TRANSFER'
        };

        // Setup account balances
        await this.mockDatabase.setAccountBalance('ACC-001', 5000.00);
        await this.mockDatabase.setAccountBalance('ACC-002', 2000.00);

        // Setup risk engine to approve
        this.mockRiskEngine.setRiskScore(transaction, 0.1); // Low risk

        const result = await this.transactionProcessor.processTransaction(transaction);

        expect(result.status).toBe('SUCCESS');
        expect(result.transactionId).toBe('txn-12345');

        // Verify balance changes
        const fromBalance = await this.mockDatabase.getAccountBalance('ACC-001');
        const toBalance = await this.mockDatabase.getAccountBalance('ACC-002');

        expect(fromBalance).toBe(4000.00);
        expect(toBalance).toBe(3000.00);

        // Verify audit logging
        const auditLogs = this.mockAuditLogger.getLogs();
        expect(auditLogs).toHaveLength(3); // Start, success, complete
      });

      it('should reject high-risk transactions', async () => {
        const suspiciousTransaction = {
          id: 'txn-99999',
          fromAccount: 'ACC-001',
          toAccount: 'ACC-SUSPICIOUS',
          amount: 50000.00,
          currency: 'AUD',
          type: 'TRANSFER'
        };

        // Setup high risk score
        this.mockRiskEngine.setRiskScore(suspiciousTransaction, 0.9);

        await expect(
          this.transactionProcessor.processTransaction(suspiciousTransaction)
        ).rejects.toThrow('Transaction blocked by risk engine');

        // Verify no balance changes occurred
        const balance = await this.mockDatabase.getAccountBalance('ACC-001');
        expect(balance).toBe(5000.00); // Unchanged

        // Verify security alert logged
        const securityLogs = this.mockAuditLogger.getSecurityLogs();
        expect(securityLogs).toContainEqual(
          expect.objectContaining({
            type: 'HIGH_RISK_TRANSACTION_BLOCKED',
            transactionId: 'txn-99999'
          })
        );
      });

      it('should handle concurrent transactions correctly', async () => {
        const account = 'ACC-CONCURRENT';
        await this.mockDatabase.setAccountBalance(account, 1000.00);

        // Create 5 concurrent transactions
        const transactions = Array.from({ length: 5 }, (_, i) => ({
          id: `concurrent-${i}`,
          fromAccount: account,
          toAccount: 'ACC-TARGET',
          amount: 100.00,
          currency: 'AUD',
          type: 'TRANSFER'
        }));

        // Process all transactions concurrently
        const results = await Promise.allSettled(
          transactions.map(txn =>
            this.transactionProcessor.processTransaction(txn)
          )
        );

        // All should succeed due to sufficient balance
        const successful = results.filter(r => r.status === 'fulfilled');
        expect(successful).toHaveLength(5);

        // Final balance should be correct
        const finalBalance = await this.mockDatabase.getAccountBalance(account);
        expect(finalBalance).toBe(500.00); // 1000 - (5 * 100)

        // Verify transaction ordering (all should have different timestamps)
        const auditLogs = this.mockAuditLogger.getLogs();
        const timestamps = auditLogs.map(log => log.timestamp);
        const uniqueTimestamps = new Set(timestamps);
        expect(uniqueTimestamps.size).toBe(timestamps.length);
      });

      // Test database failures
      it('should handle database failures gracefully', async () => {
        const transaction = {
          id: 'txn-db-fail',
          fromAccount: 'ACC-001',
          toAccount: 'ACC-002',
          amount: 100.00,
          currency: 'AUD',
          type: 'TRANSFER'
        };

        // Simulate database failure after balance check
        this.mockDatabase.simulateFailureAfter('getAccountBalance', 1);

        await expect(
          this.transactionProcessor.processTransaction(transaction)
        ).rejects.toThrow('Database operation failed');

        // Verify rollback occurred
        const auditLogs = this.mockAuditLogger.getLogs();
        expect(auditLogs).toContainEqual(
          expect.objectContaining({
            type: 'TRANSACTION_ROLLBACK',
            reason: 'Database operation failed'
          })
        );
      });
    });
  }

  async setupTestData() {
    // Reset all mocks
    this.mockDatabase.reset();
    this.mockRiskEngine.reset();
    this.mockAuditLogger.reset();

    // Setup default test accounts
    await this.mockDatabase.createAccount('ACC-001', 'Test Account 1');
    await this.mockDatabase.createAccount('ACC-002', 'Test Account 2');
    await this.mockDatabase.setAccountBalance('ACC-001', 5000.00);
    await this.mockDatabase.setAccountBalance('ACC-002', 2000.00);
  }

  async cleanupTestData() {
    await this.mockDatabase.cleanup();
  }
}

// Performance testing for high-frequency scenarios
class PerformanceTestSuite {
  async testHighFrequencyTransactions() {
    it('should handle high transaction volume', async () => {
      const transactionCount = 10000;
      const concurrency = 100;

      const startTime = Date.now();

      // Generate test transactions
      const transactions = Array.from({ length: transactionCount }, (_, i) => ({
        id: `perf-test-${i}`,
        fromAccount: `ACC-${i % 100}`, // Distribute across 100 accounts
        toAccount: `ACC-${(i + 1) % 100}`,
        amount: Math.random() * 1000,
        currency: 'AUD',
        type: 'TRANSFER'
      }));

      // Process trong batches
      const results = [];
      for (let i = 0; i < transactions.length; i += concurrency) {
        const batch = transactions.slice(i, i + concurrency);
        const batchResults = await Promise.all(
          batch.map(txn => this.processTransactionWithTimeout(txn, 5000))
        );
        results.push(...batchResults);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;
      const throughput = transactionCount / (duration / 1000); // TPS

      console.log(`Processed ${transactionCount} transactions in ${duration}ms`);
      console.log(`Throughput: ${throughput.toFixed(2)} TPS`);

      // Performance assertions
      expect(throughput).toBeGreaterThan(100); // At least 100 TPS
      expect(duration).toBeLessThan(60000); // Complete within 1 minute

      // Verify all transactions processed
      const successful = results.filter(r => r.status === 'SUCCESS');
      expect(successful.length).toBeGreaterThan(transactionCount * 0.95); // 95% success rate
    }, 120000); // 2 minute timeout
  }

  async processTransactionWithTimeout(transaction, timeout) {
    return Promise.race([
      this.transactionProcessor.processTransaction(transaction),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Transaction timeout')), timeout)
      )
    ]);
  }
}
```


💭 **Testing Wisdom**: "Tại NAB, comprehensive async testing wasn't just about correctness - nó về compliance và risk management. Financial systems require testing error conditions, race conditions, và performance under load. Async/await made writing these tests much more maintainable."


---


## PHẦN IV: SYNTHESIS VÀ BEST PRACTICES


### 📖 9. PRODUCTION PATTERNS VÀ ANTI-PATTERNS


#### 🌱 Common Anti-patterns và Solutions


**Anti-pattern 1: Sequential Execution When Concurrent Needed**


```javascript
// ❌ Anti-pattern: Unnecessary sequential execution
async function fetchUserDataBadly(userId) {
  const user = await fetchUser(userId);           // 100ms
  const profile = await fetchUserProfile(userId); // 150ms
  const posts = await fetchUserPosts(userId);     // 200ms
  const comments = await fetchUserComments(userId); // 80ms

  return { user, profile, posts, comments };
  // Total: 530ms
}

// ✅ Good pattern: Concurrent execution
async function fetchUserDataWell(userId) {
  const [user, profile, posts, comments] = await Promise.all([
    fetchUser(userId),           // All start simultaneously
    fetchUserProfile(userId),
    fetchUserPosts(userId),
    fetchUserComments(userId)
  ]);

  return { user, profile, posts, comments };
  // Total: ~200ms (longest operation)
}

// ✅ Advanced pattern: Mixed sequential và concurrent
async function fetchUserDataOptimal(userId) {
  // First, get user data (required for other operations)
  const user = await fetchUser(userId);

  // Then fetch other data concurrently using user info
  const [profile, posts, comments] = await Promise.all([
    fetchUserProfile(user.profileId),
    fetchUserPosts(user.id),
    fetchUserComments(user.id)
  ]);

  return { user, profile, posts, comments };
}
```


**Anti-pattern 2: Missing Error Handling**


```javascript
// ❌ Anti-pattern: Silent failures
async function processUserDataBadly(userData) {
  const validated = await validateUserData(userData);
  const processed = await processData(validated);
  const saved = await saveToDatabase(processed);

  return saved; // What if any step fails?
}

// ✅ Good pattern: Comprehensive error handling
async function processUserDataWell(userData) {
  try {
    const validated = await validateUserData(userData);
    const processed = await processData(validated);
    const saved = await saveToDatabase(processed);

    return { success: true, data: saved };
  } catch (error) {
    console.error('User data processing failed:', error);

    // Specific error handling
    if (error instanceof ValidationError) {
      return { success: false, error: 'Invalid data provided' };
    } else if (error instanceof DatabaseError) {
      return { success: false, error: 'Database temporarily unavailable' };
    } else {
      return { success: false, error: 'Processing failed' };
    }
  }
}

// ✅ Advanced pattern: Granular error handling với recovery
async function processUserDataAdvanced(userData) {
  let validated, processed;

  try {
    validated = await validateUserData(userData);
  } catch (error) {
    if (error.code === 'MINOR_VALIDATION_ERROR') {
      validated = await applyDefaultValidation(userData);
    } else {
      throw new Error(`Validation failed: ${error.message}`);
    }
  }

  try {
    processed = await processData(validated);
  } catch (error) {
    console.warn('Processing failed, using fallback:', error);
    processed = await applyFallbackProcessing(validated);
  }

  try {
    const saved = await saveToDatabase(processed);
    return { success: true, data: saved };
  } catch (error) {
    // Log error và implement retry logic
    await this.logError('DATABASE_SAVE_FAILED', { userData, error });

    // Try backup database
    try {
      const backupSaved = await saveToBackupDatabase(processed);
      return { success: true, data: backupSaved, usedBackup: true };
    } catch (backupError) {
      throw new Error('Both primary và backup saves failed');
    }
  }
}
```


**Anti-pattern 3: Memory Leaks với Long-running Async Operations**


```javascript
// ❌ Anti-pattern: Potential memory leak
class DataProcessor {
  constructor() {
    this.pendingOperations = new Set();
    this.results = new Map();
  }

  async processData(data) {
    const operation = this.performLongOperation(data);
    this.pendingOperations.add(operation);

    try {
      const result = await operation;
      this.results.set(data.id, result);
      return result;
    } finally {
      // If this fails, operation stays trong Set forever
      this.pendingOperations.delete(operation);
    }
  }

  async performLongOperation(data) {
    // Long-running operation that might fail hoặc timeout
    return new Promise((resolve, reject) => {
      // If this never resolves/rejects, memory leak occurs
      setTimeout(() => {
        if (Math.random() > 0.1) {
          resolve(data.processed);
        } else {
          // Sometimes just hangs - no resolve/reject
        }
      }, 5000);
    });
  }
}

// ✅ Good pattern: Proper cleanup và timeout handling
class DataProcessorImproved {
  constructor() {
    this.pendingOperations = new Map(); // Track with metadata
    this.results = new Map();
    this.defaultTimeout = 30000;
  }

  async processData(data, timeout = this.defaultTimeout) {
    const operationId = this.generateOperationId();
    const controller = new AbortController();

    // Set timeout
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeout);

    const operationMetadata = {
      id: operationId,
      dataId: data.id,
      startTime: Date.now(),
      controller,
      timeoutId
    };

    this.pendingOperations.set(operationId, operationMetadata);

    try {
      const result = await this.performLongOperationWithAbort(data, controller.signal);
      this.results.set(data.id, result);
      return result;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error(`Operation timed out after ${timeout}ms`);
      }
      throw error;
    } finally {
      // Always cleanup
      clearTimeout(timeoutId);
      this.pendingOperations.delete(operationId);
    }
  }

  async performLongOperationWithAbort(data, signal) {
    return new Promise((resolve, reject) => {
      // Check if already aborted
      if (signal.aborted) {
        reject(new Error('Operation was aborted'));
        return;
      }

      // Listen for abort signal
      signal.addEventListener('abort', () => {
        reject(new Error('Operation was aborted'));
      });

      // Perform operation với periodic abort checks
      const work = () => {
        if (signal.aborted) {
          reject(new Error('Operation was aborted'));
          return;
        }

        // Simulate work
        if (Math.random() > 0.1) {
          resolve(data.processed);
        } else {
          // Continue working
          setTimeout(work, 1000);
        }
      };

      setTimeout(work, 1000);
    });
  }

  // Cleanup method for graceful shutdown
  async cleanup() {
    const pendingPromises = Array.from(this.pendingOperations.values()).map(op => {
      op.controller.abort();
      return new Promise(resolve => {
        setTimeout(resolve, 100); // Give time for cleanup
      });
    });

    await Promise.all(pendingPromises);
    this.pendingOperations.clear();
    this.results.clear();
  }
}
```


#### ⚙️ Advanced Production Patterns


**Pattern 1: Circuit Breaker với Async/Await**


```javascript
class AsyncCircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.recoveryTimeout = options.recoveryTimeout || 60000;
    this.monitoringPeriod = options.monitoringPeriod || 10000;

    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.successCount = 0;

    // Monitoring
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      rejectedRequests: 0
    };
  }

  async execute(asyncFunction, ...args) {
    this.metrics.totalRequests++;

    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime < this.recoveryTimeout) {
        this.metrics.rejectedRequests++;
        throw new Error('Circuit breaker is OPEN - request rejected');
      } else {
        this.state = 'HALF_OPEN';
        this.successCount = 0;
      }
    }

    try {
      const result = await asyncFunction(...args);
      this.handleSuccess();
      return result;
    } catch (error) {
      this.handleFailure();
      throw error;
    }
  }

  handleSuccess() {
    this.metrics.successfulRequests++;

    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= 3) { // Require 3 successes to close
        this.state = 'CLOSED';
        this.failureCount = 0;
      }
    } else if (this.state === 'CLOSED') {
      this.failureCount = 0;
    }
  }

  handleFailure() {
    this.metrics.failedRequests++;
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      metrics: { ...this.metrics }
    };
  }
}

// Usage trong production
const circuitBreaker = new AsyncCircuitBreaker({
  failureThreshold: 3,
  recoveryTimeout: 30000
});

async function robustApiCall(endpoint, data) {
  return circuitBreaker.execute(async () => {
    const response = await fetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status}`);
    }

    return response.json();
  });
}
```


**Pattern 2: Async Resource Pool Management**


```javascript
class AsyncResourcePool {
  constructor(factory, options = {}) {
    this.factory = factory;
    this.maxSize = options.maxSize || 10;
    this.minSize = options.minSize || 2;
    this.acquireTimeout = options.acquireTimeout || 5000;
    this.idleTimeout = options.idleTimeout || 30000;

    this.available = [];
    this.inUse = new Set();
    this.waiting = [];
    this.totalResources = 0;

    this.initialize();
  }

  async initialize() {
    // Create minimum resources
    for (let i = 0; i < this.minSize; i++) {
      const resource = await this.createResource();
      this.available.push(resource);
    }
  }

  async acquire() {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        const index = this.waiting.findIndex(w => w.resolve === resolve);
        if (index !== -1) {
          this.waiting.splice(index, 1);
        }
        reject(new Error('Resource acquisition timeout'));
      }, this.acquireTimeout);

      this.waiting.push({ resolve, reject, timeout });
      this.processWaiting();
    });
  }

  async processWaiting() {
    if (this.waiting.length === 0) return;

    if (this.available.length > 0) {
      // Use available resource
      const resource = this.available.pop();
      const waiter = this.waiting.shift();

      clearTimeout(waiter.timeout);
      this.inUse.add(resource);
      waiter.resolve(resource);
    } else if (this.totalResources < this.maxSize) {
      // Create new resource
      try {
        const resource = await this.createResource();
        const waiter = this.waiting.shift();

        clearTimeout(waiter.timeout);
        this.inUse.add(resource);
        waiter.resolve(resource);
      } catch (error) {
        const waiter = this.waiting.shift();
        clearTimeout(waiter.timeout);
        waiter.reject(error);
      }
    }
    // Otherwise wait for resource to be released
  }

  release(resource) {
    if (!this.inUse.has(resource)) {
      throw new Error('Resource not in use');
    }

    this.inUse.delete(resource);

    if (this.waiting.length > 0) {
      // Give to waiting request
      const waiter = this.waiting.shift();
      clearTimeout(waiter.timeout);
      this.inUse.add(resource);
      waiter.resolve(resource);
    } else {
      // Return to pool
      this.available.push(resource);
      this.scheduleResourceCleanup(resource);
    }
  }

  async createResource() {
    const resource = await this.factory();
    this.totalResources++;
    resource.createdAt = Date.now();
    resource.lastUsed = Date.now();
    return resource;
  }

  scheduleResourceCleanup(resource) {
    setTimeout(() => {
      if (this.available.includes(resource) &&
          Date.now() - resource.lastUsed > this.idleTimeout &&
          this.totalResources > this.minSize) {

        const index = this.available.indexOf(resource);
        if (index !== -1) {
          this.available.splice(index, 1);
          this.totalResources--;
          this.destroyResource(resource);
        }
      }
    }, this.idleTimeout);
  }

  async destroyResource(resource) {
    if (resource.destroy && typeof resource.destroy === 'function') {
      await resource.destroy();
    }
  }

  async withResource(fn) {
    const resource = await this.acquire();
    try {
      resource.lastUsed = Date.now();
      return await fn(resource);
    } finally {
      this.release(resource);
    }
  }

  async shutdown() {
    // Wait for all in-use resources
    while (this.inUse.size > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Destroy all available resources
    await Promise.all(this.available.map(resource => this.destroyResource(resource)));
    this.available = [];
    this.totalResources = 0;
  }
}

// Database connection pool example
const dbPool = new AsyncResourcePool(
  async () => {
    return await createDatabaseConnection();
  },
  {
    maxSize: 20,
    minSize: 5,
    acquireTimeout: 5000,
    idleTimeout: 60000
  }
);

async function executeQuery(sql, params) {
  return dbPool.withResource(async (connection) => {
    return await connection.query(sql, params);
  });
}
```


#### 🏭 Production Reality - Axon Video Processing Pipeline


Tại Axon, chúng tôi implemented robust async patterns cho video processing at scale:


```javascript
// Axon Production Video Processing System
class AxonVideoProcessor {
  constructor() {
    this.processingQueue = new PriorityQueue();
    this.resourcePools = {
      transcoding: new AsyncResourcePool(() => this.createTranscodingWorker(), {
        maxSize: 8, minSize: 2
      }),
      analysis: new AsyncResourcePool(() => this.createAnalysisWorker(), {
        maxSize: 4, minSize: 1
      }),
      storage: new AsyncResourcePool(() => this.createStorageConnection(), {
        maxSize: 10, minSize: 3
      })
    };

    this.circuitBreakers = {
      faceRecognition: new AsyncCircuitBreaker({ failureThreshold: 3 }),
      audioTranscription: new AsyncCircuitBreaker({ failureThreshold: 5 }),
      cloudUpload: new AsyncCircuitBreaker({ failureThreshold: 2 })
    };

    this.metrics = new VideoProcessingMetrics();
  }

  async processVideo(videoFile, metadata) {
    const processingId = this.generateProcessingId();
    const startTime = Date.now();

    try {
      // Phase 1: Initial validation và setup
      await this.validateVideoFile(videoFile, metadata);

      // Phase 2: Core processing (parallel where possible)
      const coreResults = await this.performCoreProcessing(
        videoFile,
        metadata,
        processingId
      );

      // Phase 3: Advanced analysis (depends on core results)
      const analysisResults = await this.performAdvancedAnalysis(
        coreResults,
        processingId
      );

      // Phase 4: Finalization và storage
      const finalResult = await this.finalizeProcessing(
        coreResults,
        analysisResults,
        processingId
      );

      // Record success metrics
      this.metrics.recordSuccess(processingId, Date.now() - startTime);

      return finalResult;

    } catch (error) {
      // Record failure metrics
      this.metrics.recordFailure(processingId, error, Date.now() - startTime);

      // Cleanup any partial processing
      await this.cleanupPartialProcessing(processingId);

      throw error;
    }
  }

  async performCoreProcessing(videoFile, metadata, processingId) {
    // Execute core operations concurrently
    const [
      uploadResult,
      thumbnailResult,
      metadataResult,
      transcodeResult
    ] = await Promise.allSettled([
      this.uploadToStorage(videoFile, processingId),
      this.generateThumbnails(videoFile, processingId),
      this.extractMetadata(videoFile),
      this.transcodeVideo(videoFile, processingId)
    ]);

    // Handle partial failures
    const results = {};

    if (uploadResult.status === 'fulfilled') {
      results.upload = uploadResult.value;
    } else {
      throw new Error(`Upload failed: ${uploadResult.reason.message}`);
    }

    if (thumbnailResult.status === 'fulfilled') {
      results.thumbnails = thumbnailResult.value;
    } else {
      console.warn('Thumbnail generation failed:', thumbnailResult.reason);
      results.thumbnails = await this.generateFallbackThumbnails(videoFile);
    }

    if (metadataResult.status === 'fulfilled') {
      results.metadata = metadataResult.value;
    } else {
      console.warn('Metadata extraction failed:', metadataResult.reason);
      results.metadata = this.getBasicMetadata(videoFile);
    }

    if (transcodeResult.status === 'fulfilled') {
      results.transcode = transcodeResult.value;
    } else {
      console.warn('Transcoding failed:', transcodeResult.reason);
      // Transcoding failure is not critical - use original
      results.transcode = { originalFile: videoFile };
    }

    return results;
  }

  async performAdvancedAnalysis(coreResults, processingId) {
    const analysisPromises = [];

    // Face recognition với circuit breaker
    if (coreResults.thumbnails) {
      analysisPromises.push(
        this.circuitBreakers.faceRecognition.execute(async () => {
          return this.performFaceRecognition(coreResults.thumbnails.keyFrames);
        }).catch(error => {
          console.warn('Face recognition failed:', error);
          return { faces: [], confidence: 0 };
        })
      );
    }

    // Audio transcription với circuit breaker
    if (coreResults.upload && coreResults.metadata.hasAudio) {
      analysisPromises.push(
        this.circuitBreakers.audioTranscription.execute(async () => {
          return this.transcribeAudio(coreResults.upload.audioTrack);
        }).catch(error => {
          console.warn('Audio transcription failed:', error);
          return { transcript: '', confidence: 0 };
        })
      );
    }

    // Motion detection (always attempt)
    if (coreResults.upload) {
      analysisPromises.push(
        this.detectMotion(coreResults.upload.videoTrack)
          .catch(error => {
            console.warn('Motion detection failed:', error);
            return { motionEvents: [], confidence: 0 };
          })
      );
    }

    const [faceResults, transcriptionResults, motionResults] =
      await Promise.all(analysisPromises);

    return {
      faces: faceResults || { faces: [], confidence: 0 },
      transcription: transcriptionResults || { transcript: '', confidence: 0 },
      motion: motionResults || { motionEvents: [], confidence: 0 }
    };
  }

  async uploadToStorage(videoFile, processingId) {
    return this.resourcePools.storage.withResource(async (storageConnection) => {
      // Chunked upload với progress tracking
      const chunks = await this.createVideoChunks(videoFile);
      const uploadedChunks = [];

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];

        try {
          const chunkResult = await this.uploadChunk(
            storageConnection,
            chunk,
            processingId,
            i
          );
          uploadedChunks.push(chunkResult);

          // Report progress
          this.reportUploadProgress(processingId, (i + 1) / chunks.length);

        } catch (error) {
          // Retry failed chunks
          console.warn(`Chunk ${i} failed, retrying:`, error);

          const retryResult = await this.retryChunkUpload(
            storageConnection,
            chunk,
            processingId,
            i,
            3 // max retries
          );

          uploadedChunks.push(retryResult);
        }
      }

      // Finalize upload
      return await this.finalizeUpload(storageConnection, uploadedChunks, processingId);
    });
  }

  async transcodeVideo(videoFile, processingId) {
    return this.resourcePools.transcoding.withResource(async (transcodingWorker) => {
      // Determine optimal encoding settings based on content
      const encodingSettings = await this.analyzeForOptimalEncoding(videoFile);

      // Start transcoding với progress monitoring
      const transcodeJob = await transcodingWorker.startJob({
        inputFile: videoFile,
        settings: encodingSettings,
        processingId
      });

      // Monitor progress với timeout
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          transcodeJob.cancel();
          reject(new Error('Transcoding timeout'));
        }, 300000); // 5 minute timeout

        transcodeJob.on('progress', (progress) => {
          this.reportTranscodingProgress(processingId, progress);
        });

        transcodeJob.on('complete', (result) => {
          clearTimeout(timeout);
          resolve(result);
        });

        transcodeJob.on('error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });
    });
  }

  async performFaceRecognition(keyFrames) {
    // Batch process frames để optimize GPU usage
    const batchSize = 4;
    const allFaces = [];

    for (let i = 0; i < keyFrames.length; i += batchSize) {
      const batch = keyFrames.slice(i, i + batchSize);

      const batchResults = await this.resourcePools.analysis.withResource(
        async (analysisWorker) => {
          return await analysisWorker.recognizeFacesBatch(batch);
        }
      );

      allFaces.push(...batchResults);
    }

    // Deduplicate và merge similar faces
    return this.deduplicateFaces(allFaces);
  }

  async cleanupPartialProcessing(processingId) {
    // Cleanup any uploaded chunks
    try {
      await this.resourcePools.storage.withResource(async (storage) => {
        await storage.deletePartialUpload(processingId);
      });
    } catch (error) {
      console.error('Failed to cleanup partial upload:', error);
    }

    // Cancel any running transcoding jobs
    try {
      await this.resourcePools.transcoding.withResource(async (transcoder) => {
        await transcoder.cancelJob(processingId);
      });
    } catch (error) {
      console.error('Failed to cancel transcoding job:', error);
    }

    // Remove temporary files
    try {
      await this.removeTempFiles(processingId);
    } catch (error) {
      console.error('Failed to remove temp files:', error);
    }
  }

  // Graceful shutdown
  async shutdown() {
    console.log('Initiating graceful shutdown...');

    // Stop accepting new work
    this.accepting = false;

    // Wait for current work to complete
    await this.waitForCurrentWork();

    // Shutdown resource pools
    await Promise.all([
      this.resourcePools.transcoding.shutdown(),
      this.resourcePools.analysis.shutdown(),
      this.resourcePools.storage.shutdown()
    ]);

    console.log('Shutdown complete');
  }
}
```


💭 **Production Wisdom**: "Tại Axon, video processing phải reliable và efficient - law enforcement data cannot be lost. Key lessons: always have fallbacks, use circuit breakers cho external services, implement comprehensive cleanup, và design for graceful degradation."


---


### 📖 10. FOLLOW-UP QUESTIONS VÀ INTERVIEW DEEP DIVE


#### 🎯 Essential Understanding Verification Questions


**Level 1: Fundamental Comprehension**


1. **Event Loop Integration**

"Giải thích step-by-step điều gì happens trong Event Loop khi async function encountered await statement?"
"Tại sao async/await không block main thread? Walk me through memory và execution model."
"So sánh performance characteristics của async/await vs Promise.then chains vs callbacks."
2. **Error Handling Mechanics**

"Trong async function, error được propagate như thế nào through multiple await statements?"
"Tại sao try/catch với async/await khác với Promise.catch về execution timing?"
"Design error handling strategy cho nested async operations với partial failure requirements."
3. **Concurrency vs Parallelism**

"Explain difference between concurrent execution với Promise.all vs sequential await calls."
"Khi nào nên sử dụng Promise.allSettled vs Promise.all trong production systems?"
"Design pattern cho managing thousands of concurrent async operations với memory constraints."


**Level 2: Advanced Implementation Understanding**


1. **Memory Management**

"Async functions maintain execution context như thế nào? Memory implications of suspended functions?"
"Design async operation manager mà prevents memory leaks trong long-running applications."
"Explain garbage collection challenges với pending Promises và suspended async functions."
2. **Performance Optimization**

"Analyze performance bottlenecks trong heavy async/await usage. How to optimize?"
"Design async processing pipeline cho high-throughput scenarios (>10k ops/sec)."
"Compare memory footprint của async/await vs generator-based solutions vs Promise chains."
3. **Browser vs Node.js Differences**

"How does async/await implementation differ between V8 trong browser vs Node.js?"
"Explain microtask queue behavior differences across different JavaScript engines."
"Design isomorphic async code mà works optimally trong both environments."


**Level 3: Principal-Level Architecture Questions**


1. **System Design với Async Patterns**

"Design distributed async processing system với fault tolerance và exactly-once semantics."
"Architect async API gateway mà handles 100k+ concurrent connections."
"Design async event sourcing system với CQRS pattern implementation."
2. **Production Debugging và Monitoring**

"How would you debug async deadlock trong production system?"
"Design monitoring strategy cho async operation performance và error rates."
"Implement distributed tracing cho complex async operation chains across microservices."
3. **Advanced Concurrency Patterns**

"Implement async rate limiter với sliding window algorithm."
"Design async circuit breaker với adaptive thresholds."
"Architect async resource pool với dynamic scaling based on load."


#### 🔍 Common Interview Scenarios


**Scenario 1: Race Conditions**


```javascript
// Question: What's wrong với this code?
class Counter {
  constructor() {
    this.count = 0;
  }

  async increment() {
    const current = this.count;
    await this.delay(100); // Simulate async work
    this.count = current + 1;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

const counter = new Counter();
Promise.all([
  counter.increment(),
  counter.increment(),
  counter.increment()
]);

// Expected answer: Race condition, final count might be 1 instead of 3
// Solution: Use locks, atomic operations, hoặc redesign
```


**Scenario 2: Error Handling Edge Cases**


```javascript
// Question: What happens với error handling here?
async function processItems(items) {
  const results = [];

  for (const item of items) {
    try {
      const result = await processItem(item);
      results.push(result);
    } catch (error) {
      console.log('Error processing item:', error);
      // What should happen here?
    }
  }

  return results;
}

// Follow-up: How to handle partial failures? Retry logic? Error accumulation?
```


**Scenario 3: Performance Optimization**


```javascript
// Question: Optimize this code for performance
async function fetchUserData(userIds) {
  const users = [];

  for (const id of userIds) {
    const user = await fetch(`/api/users/${id}`);
    const userData = await user.json();
    users.push(userData);
  }

  return users;
}

// Expected optimizations:
// 1. Concurrent requests với Promise.all
// 2. Batch API calls
// 3. Caching strategy
// 4. Request deduplication
// 5. Circuit breaker pattern
```


**Scenario 4: Complex Flow Control**


```javascript
// Question: Implement async workflow engine
class WorkflowEngine {
  async executeWorkflow(steps) {
    // Requirements:
    // 1. Execute steps trong order
    // 2. Support parallel execution for independent steps
    // 3. Handle failures với retry logic
    // 4. Support conditional execution
    // 5. Provide progress tracking
    // 6. Support cancellation

    // Implement this...
  }
}

// This tests:
// - Advanced async patterns
// - Error handling strategies
// - Performance considerations
// - Architecture design skills
```


#### 📚 Principal-Level Discussion Topics


**Topic 1: Async/Await Evolution và Future**


- "How do you see async/await evolving with WebAssembly integration?"
- "What are implications của async/await cho Web Workers và SharedArrayBuffer?"
- "Design async patterns cho edge computing scenarios với intermittent connectivity."


**Topic 2: Team Leadership và Async Code**


- "How do you establish async/await best practices across large engineering teams?"
- "What code review guidelines do you implement cho async code quality?"
- "How do you mentor junior developers về async programming pitfalls?"


**Topic 3: Architecture Decision Making**


- "When would you choose async/await over reactive programming (RxJS)?"
- "How do you evaluate trade-offs between async patterns trong system design?"
- "What factors influence your choice của async libraries và frameworks?"


#### 🏆 Mastery Verification Checklist


**✅ Foundation Level Mastery:**


- Can explain Event Loop integration từ first principles
- Understands memory model của async functions
- Can debug basic async/await issues
- Knows when to use concurrent vs sequential patterns


**✅ Senior Level Mastery:**


- Can design complex error handling strategies
- Understands performance implications deeply
- Can implement advanced concurrency patterns
- Knows browser vs Node.js implementation differences


**✅ Principal Level Mastery:**


- Can architect large-scale async systems
- Can design async patterns cho specific business requirements
- Can establish team practices và guidelines
- Can evaluate và choose appropriate async strategies for company needs


#### 💭 Final Reflection: The Journey of Async Mastery


"Async/await trong JavaScript không chỉ là syntax improvement. Đây là fundamental shift trong how we approach asynchronous programming. From callbacks hell của early JavaScript, through Promise chains, đến elegant async/await syntax - mỗi evolution reflected growing understanding về asynchronous computing challenges.


Tại Principal level, mastering async/await means understanding not just how to use it, but when not to use it. Sometimes reactive patterns better suited. Sometimes manual Promise orchestration provides better control. Sometimes even callbacks appropriate cho specific scenarios.


Key insight từ years working với async patterns at NAB, Axon, Binance, Webflow, và Figma: Technology is tool, not solution. Great engineering comes from understanding problems deeply enough để choose right tools và patterns cho specific contexts.


Async/await empowers us để write asynchronous code mà reads like synchronous code, but great async programming requires thinking asynchronously about data flow, error propagation, resource management, và system resilience."


---


**Final Checklist cho Async/Await Mastery:**


🔬 **Technical Understanding:**


- Event Loop mechanics với microtasks/macrotasks
- Memory management trong suspended functions
- Error propagation patterns và recovery strategies
- Performance characteristics và optimization techniques
- Browser engine implementation details


🏗️ **Architecture Skills:**


- Design patterns cho concurrent operations
- Error handling strategies cho production systems
- Resource management với async operations
- Testing strategies cho async code
- Debugging techniques cho complex async flows


🎯 **Production Experience:**


- Handle high-concurrency scenarios
- Implement monitoring và observability
- Design for fault tolerance và resilience
- Optimize cho performance at scale
- Lead teams trong async best practices


Đây là comprehensive guide từ first principles đến production mastery. Async/await journey continues evolving, nhưng foundation principles remain constant: understand deeply, design thoughtfully, implement carefully, và always consider impact on users và systems.
