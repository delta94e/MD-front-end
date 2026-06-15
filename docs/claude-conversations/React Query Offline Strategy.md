# React Query Offline Strategy

## You

Offline React Query

## Claude


# 🚀 Phân Tích React Query Offline & NetworkMode


## 📝 1. TÓM TẮT CHÍNH


React Query v4 giới thiệu **networkMode** để giải quyết các vấn đề xử lý offline scenarios trong v3. Tính năng này cho phép developers có control tốt hơn về cách queries hoạt động khi mất kết nối mạng, thông qua 3 modes khác nhau và trạng thái **fetchStatus** mới.


**Tại sao quan trọng?** Mobile apps cần hoạt động mượt mà khi mất mạng, và React Query v3 có những edge cases khó chịu khi handle offline state.


---


## 🔍 2. KHÁI NIỆM CỐT LÕI


### 🎯 NetworkMode


**Định nghĩa:** Cài đặt quyết định cách React Query handle queries khi không có kết nối mạng.


**3 Modes chính:**


- **online** (default): Queries chỉ chạy khi có mạng
- **always**: Queries luôn chạy, không quan tâm đến mạng
- **offlineFirst**: Giống v3 - request đầu luôn fire, retry bị pause khi offline


### 🎯 FetchStatus


**Định nghĩa:** Trạng thái mới thay thế `isFetching` boolean, mô tả chính xác query đang làm gì.


**3 Trạng thái:**


- **fetching**: Query đang thực sự execute (request in-flight)
- **paused**: Query bị pause vì mất mạng
- **idle**: Query không chạy


### 🎯 Paused State


**Định nghĩa:** Trạng thái phụ (secondary state) khi query bị tạm dừng vì mất mạng.


**So sánh với state machines:** Giống như bạn có main state (loading/success/error) và sub-state (paused/not paused) - có thể kết hợp: "success + paused", "loading + paused".


---


## 💡 3. HIỂU BẢN CHẤT


### 🔥 Pain Points được giải quyết:


**Problem 1 - Loading vô tận:**


```javascript
// v3: User click vào post khi offline
// → Query stuck ở loading state mãi mãi
// → Dev tools show "fetching" nhưng thực tế đang pause
```


**Problem 2 - Retry dependency:**


```javascript
// v3: Nếu tắt retry, query lập tức error khi offline
// → Không có cách nào pause query cho đến khi có mạng trở lại
```


**Problem 3 - Non-network queries bị ảnh hưởng:**


```javascript
// v3: Web Worker queries cũng bị pause khi offline
// → Window focus refetch bị disable hoàn toàn khi offline
```


### ⚙️ Cơ chế hoạt động underlying:


React Query v4 **tách biệt 2 concepts:**


1. **Data state** (`status`): Tình trạng của data (loading/success/error)
2. **Network state** (`fetchStatus`): Tình trạng của network request


```javascript
// Trước v4: Chỉ có isFetching boolean
const { data, isLoading, isFetching } = useQuery(...)

// v4: Có fetchStatus chi tiết
const {
  data,
  status,        // 'loading' | 'success' | 'error'
  fetchStatus,   // 'fetching' | 'paused' | 'idle'
  isPaused       // derived từ fetchStatus
} = useQuery(...)
```


### 🎯 Tại sao solution này được chọn?


**Alternative 1:** Implement custom offline detection logic


- ❌ Phức tạp, mỗi dev phải tự handle
- ❌ Inconsistent behavior across apps


**Alternative 2:** Ignore offline hoàn toàn


- ❌ Poor UX khi user mất mạng
- ❌ Battery drain từ failed requests


**✅ NetworkMode approach:**


- Declarative configuration
- Consistent behavior
- Flexible cho different use cases


---


## 🛠️ 4. CODE EXAMPLES THỰC TẾ


### 🎯 Online Mode (Default)


```javascript
import { useQuery } from '@tanstack/react-query';

function PostDetail({ postId }) {
  const {
    data,
    status,        // 'loading' | 'success' | 'error'
    fetchStatus,   // 'fetching' | 'paused' | 'idle'
    isPaused       // boolean derived từ fetchStatus
  } = useQuery({
    queryKey: ['post', postId],
    queryFn: () => fetchPost(postId),
    networkMode: 'online' // default value, có thể bỏ qua
  });

  // Hiển thị UI based on trạng thái kết hợp
  if (status === 'loading' && fetchStatus === 'paused') {
    return (
      <div className="offline-banner">
        📶 Đang chờ kết nối mạng để tải dữ liệu...
      </div>
    );
  }

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (status === 'success') {
    return (
      <div>
        <h1>{data.title}</h1>
        <p>{data.content}</p>
        {/* Nếu đang background refetch nhưng bị pause */}
        {fetchStatus === 'paused' && (
          <div className="refetch-paused">
            🔄 Sẽ cập nhật khi có mạng trở lại
          </div>
        )}
      </div>
    );
  }

  return <div>Có lỗi xảy ra</div>;
}
```


### 🎯 Always Mode - Cho Web Workers


```javascript
function HeavyComputationComponent() {
  const { data, status } = useQuery({
    queryKey: ['heavy-computation'],
    queryFn: async () => {
      // Tính toán nặng trong Web Worker, không cần mạng
      const worker = new Worker('/heavy-computation.js');
      return new Promise((resolve) => {
        worker.postMessage({ data: largeDataset });
        worker.onmessage = (e) => resolve(e.data);
      });
    },
    networkMode: 'always', // Luôn chạy dù có mạng hay không
  });

  // Query này sẽ không bao giờ bị pause vì network
  return status === 'loading' ? 'Computing...' : <Result data={data} />;
}
```


### 🎯 OfflineFirst Mode - Cho Service Workers/Browser Cache


```javascript
function GitHubRepoInfo({ repoName }) {
  const { data, status, fetchStatus } = useQuery({
    queryKey: ['github-repo', repoName],
    queryFn: () => fetch(`https://api.github.com/repos/${repoName}`),
    networkMode: 'offlineFirst', // Request đầu luôn fire
    retry: 3
  });

  /*
  Flow hoạt động:
  1. Request được fire ngay lập tức
  2. Nếu hit browser cache (cache-control: max-age=60)
     → Success ngay cả khi offline
  3. Nếu cache miss + offline
     → Network error → Retry bị pause → Status = paused
  4. Khi online trở lại → Resume retry
  */

  if (status === 'loading' && fetchStatus === 'paused') {
    return <div>📡 Đang chờ mạng để lấy data mới...</div>;
  }

  if (status === 'success') {
    return (
      <div>
        <h2>{data.name}</h2>
        <p>⭐ {data.stargazers_count} stars</p>
        {fetchStatus === 'paused' && (
          <small>📡 Đang thử cập nhật...</small>
        )}
      </div>
    );
  }

  return <div>Error loading repo</div>;
}
```


### 🎯 Global Configuration


```javascript
// src/queryClient.js
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      networkMode: 'online', // Default cho tất cả queries
      retry: (failureCount, error) => {
        // Custom retry logic based on error type
        if (error.message.includes('offline')) return false;
        return failureCount < 3;
      }
    },
    mutations: {
      networkMode: 'offlineFirst', // Mutations có thể cần behavior khác
    }
  }
});
```


---


## 🔄 5. SO SÁNH & PHÂN BIỆT


### 📊 So sánh 3 NetworkModes


```
ModeFirst RequestRetry BehaviorUse Caseonline❌ Không fire khi offline⏸️ Pause khi offlineData fetching APIsalways✅ Luôn fire♾️ Không pauseWeb Workers, local computationofflineFirst✅ Luôn fire⏸️ Pause retry khi offlinePWA với Service Worker
```


### 🔄 React Query v3 vs v4


#### v3 Behavior:


```javascript
// v3: Chỉ có isFetching boolean
const { data, isLoading, isFetching, error } = useQuery(key, fetcher);

// Problems:
if (isLoading) {
  // Không biết đang loading hay paused vì offline
  return 'Loading...'; // Misleading!
}
```


#### v4 Improvement:


```javascript
// v4: Granular control
const { data, status, fetchStatus, isPaused } = useQuery({...});

// Clear distinction:
if (status === 'loading' && fetchStatus === 'paused') {
  return 'Waiting for network...'; // Accurate!
}

if (status === 'loading' && fetchStatus === 'fetching') {
  return 'Loading...'; // Actually loading!
}
```


### ⚖️ Ưu/Nhược điểm từng approach


#### Online Mode:


✅ **Ưu điểm:**


- Battery efficient (không fire request vô ích)
- Clear UX về network dependency
- Prevent failed requests spam


❌ **Nhược điểm:**


- Không work với offline-first architectures
- Cần extra logic để handle paused state


#### Always Mode:


✅ **Ưu điểm:**


- Simple - không cần worry về network
- Perfect cho non-network operations


❌ **Nhược điểm:**


- Có thể waste battery với network calls
- Không có offline UX optimization


#### OfflineFirst Mode:


✅ **Ưu điểm:**


- Tương thích với Service Workers/PWA
- Tận dụng browser cache
- Backward compatible với v3


❌ **Nhược điểm:**


- Vẫn fire initial request (có thể fail)
- Phức tạp hơn để reason about


---


## 🎯 6. BEST PRACTICES


### ⭐ Quan trọng khi implement:


#### 1. Chọn đúng NetworkMode cho use case


```javascript
// ✅ Good: API calls dùng 'online'
const { data } = useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers,
  networkMode: 'online'
});

// ✅ Good: PWA với Service Worker dùng 'offlineFirst'
const { data } = useQuery({
  queryKey: ['cached-data'],
  queryFn: fetchCachedData,
  networkMode: 'offlineFirst'
});

// ❌ Bad: API call dùng 'always' sẽ waste battery
```


#### 2. Handle Paused State trong UI


```javascript
function SmartLoadingComponent() {
  const { data, status, fetchStatus } = useQuery({...});

  // ✅ Good: Specific messaging cho từng case
  if (status === 'loading') {
    if (fetchStatus === 'paused') {
      return <OfflineMessage />; // Custom offline UI
    }
    if (fetchStatus === 'fetching') {
      return <LoadingSpinner />; // Normal loading
    }
  }

  // ❌ Bad: Generic loading không inform user
  if (status === 'loading') {
    return <div>Loading...</div>; // User không biết tại sao stuck
  }
}
```


#### 3. Combine với Online/Offline Detection


```javascript
import { useOnlineManager } from '@tanstack/react-query';

function App() {
  const onlineManager = useOnlineManager();

  // Listen to online/offline events
  useEffect(() => {
    function handleOnline() {
      onlineManager.setOnline(true);
    }

    function handleOffline() {
      onlineManager.setOnline(false);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [onlineManager]);

  return <YourApp />;
}
```


### 🚨 Common Mistakes cần tránh:


#### 1. Ignore fetchStatus


```javascript
// ❌ Bad: Chỉ check status
if (isLoading) {
  return <Spinner />;
}

// ✅ Good: Check cả fetchStatus
if (status === 'loading') {
  if (fetchStatus === 'paused') return <OfflineMessage />;
  if (fetchStatus === 'fetching') return <Spinner />;
}
```


#### 2. Wrong NetworkMode choice


```javascript
// ❌ Bad: Dùng 'always' cho API calls
const { data } = useQuery({
  queryKey: ['api-data'],
  queryFn: () => fetch('/api/data'),
  networkMode: 'always' // Sẽ spam failed requests khi offline
});

// ✅ Good:
networkMode: 'online' // Pause khi offline
```


#### 3. Không handle background refetch paused


```javascript
function DataComponent() {
  const { data, fetchStatus } = useQuery({...});

  return (
    <div>
      {data && <DataDisplay data={data} />}
      {/* ✅ Good: Inform user về background state */}
      {fetchStatus === 'paused' && (
        <div className="bg-yellow-100 p-2">
          🔄 Sẽ sync data khi có mạng
        </div>
      )}
    </div>
  );
}
```


### ⚡ Performance Considerations:


#### 1. Battery Optimization


```javascript
// ✅ Dùng 'online' mode để tránh failed requests
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      networkMode: 'online',
      refetchOnWindowFocus: false, // Tắt auto refetch
      retry: (failureCount, error) => {
        // Thông minh hơn về retry
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
          return false; // Network error, đừng retry
        }
        return failureCount < 2;
      }
    }
  }
});
```


#### 2. Memory Management


```javascript
// ✅ Set cache time hợp lý cho offline data
const { data } = useQuery({
  queryKey: ['offline-data'],
  queryFn: fetchOfflineData,
  networkMode: 'offlineFirst',
  cacheTime: 10 * 60 * 1000, // 10 minutes
  staleTime: 5 * 60 * 1000,  // 5 minutes
});
```


---


## 🚀 7. ỨNG DỤNG THỰC TẾ


### 📱 E-commerce Mobile App


```javascript
// Product catalog - cần fresh data
const useProducts = () => useQuery({
  queryKey: ['products'],
  queryFn: fetchProducts,
  networkMode: 'online', // Pause khi offline
  staleTime: 5 * 60 * 1000 // 5 phút
});

// Shopping cart - cần work offline
const useCart = () => useQuery({
  queryKey: ['cart'],
  queryFn: () => localStorage.getItem('cart'),
  networkMode: 'always', // Luôn work, không cần network
});

// Order submission - offline first với queue
const useSubmitOrder = () => useMutation({
  mutationFn: submitOrder,
  networkMode: 'offlineFirst', // Try submit, queue nếu offline
  onError: (error) => {
    if (isNetworkError(error)) {
      // Add to offline queue
      addToOfflineQueue('submitOrder', orderData);
    }
  }
});
```


### 🏥 Healthcare Dashboard


```javascript
// Patient data - critical, need fresh data
const usePatientData = (patientId) => useQuery({
  queryKey: ['patient', patientId],
  queryFn: () => fetchPatient(patientId),
  networkMode: 'online',
  refetchInterval: 30000, // Auto refresh khi có mạng
});

// Medical calculations - local processing
const useDoseCalculation = (patientData) => useQuery({
  queryKey: ['dose-calc', patientData],
  queryFn: () => calculateDose(patientData),
  networkMode: 'always', // Không cần mạng
  enabled: !!patientData
});
```


### 📰 News PWA với Service Worker


```javascript
// Articles với cache-first strategy
const useArticles = () => useQuery({
  queryKey: ['articles'],
  queryFn: async () => {
    // Service Worker sẽ intercept request này
    const response = await fetch('/api/articles');
    return response.json();
  },
  networkMode: 'offlineFirst', // Let SW handle caching
  staleTime: 15 * 60 * 1000 // 15 phút
});

// Reading progress - local storage
const useReadingProgress = () => useQuery({
  queryKey: ['reading-progress'],
  queryFn: () => JSON.parse(localStorage.getItem('progress') || '{}'),
  networkMode: 'always'
});
```


### 🎮 Gaming App với Offline Features


```javascript
// Leaderboard - cần real-time data
const useLeaderboard = () => useQuery({
  queryKey: ['leaderboard'],
  queryFn: fetchLeaderboard,
  networkMode: 'online',
  refetchInterval: 10000
});

// Game saves - hybrid approach
const useGameSave = (gameId) => useQuery({
  queryKey: ['game-save', gameId],
  queryFn: async () => {
    try {
      // Try cloud save first
      return await fetchCloudSave(gameId);
    } catch (error) {
      // Fallback to local save
      return getLocalSave(gameId);
    }
  },
  networkMode: 'offlineFirst'
});
```


### 💰 Financial App


```javascript
// Market data - cần real-time
const useMarketData = () => useQuery({
  queryKey: ['market-data'],
  queryFn: fetchMarketData,
  networkMode: 'online',
  refetchInterval: 5000, // 5 giây
  onError: () => {
    // Show stale data warning
    toast.warning('Showing cached market data');
  }
});

// Portfolio calculations - local
const usePortfolioAnalysis = (holdings) => useQuery({
  queryKey: ['portfolio-analysis', holdings],
  queryFn: () => calculatePortfolioMetrics(holdings),
  networkMode: 'always'
});
```


---


## 📚 8. KIẾN THỨC LIÊN QUAN


### 📋 Prerequisites cần biết:


#### Cơ bản:


- React Hooks (useState, useEffect)
- Promise và async/await
- Browser APIs (fetch, localStorage)
- Network concepts (HTTP status codes)


#### React Query fundamentals:


```javascript
// Cần hiểu các concepts này trước:
const { data, status, error } = useQuery({
  queryKey: ['key'],
  queryFn: fetcher,
  // Các options cơ bản
  enabled: true,
  retry: 3,
  staleTime: 0,
  cacheTime: 5 * 60 * 1000
});
```


### 🚀 Advanced Topics để học tiếp:


#### 1. Optimistic Updates với Offline


```javascript
const useOptimisticUpdate = () => useMutation({
  mutationFn: updateData,
  networkMode: 'offlineFirst',
  onMutate: async (newData) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries(['data']);

    // Snapshot previous value
    const previousData = queryClient.getQueryData(['data']);

    // Optimistically update
    queryClient.setQueryData(['data'], newData);

    return { previousData };
  },
  onError: (err, newData, context) => {
    // Rollback on error
    queryClient.setQueryData(['data'], context.previousData);
  }
});
```


#### 2. Offline Queue Implementation


```javascript
class OfflineQueue {
  constructor(queryClient) {
    this.queue = [];
    this.queryClient = queryClient;
    this.isOnline = navigator.onLine;

    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processQueue();
    });
  }

  add(mutation) {
    if (this.isOnline) {
      return mutation();
    } else {
      this.queue.push(mutation);
    }
  }

  async processQueue() {
    while (this.queue.length > 0) {
      const mutation = this.queue.shift();
      try {
        await mutation();
      } catch (error) {
        // Handle failed queued mutations
        console.error('Queued mutation failed:', error);
      }
    }
  }
}
```


#### 3. Custom Online Manager


```javascript
import { onlineManager } from '@tanstack/react-query';

// Custom online detection
class SmartOnlineManager {
  constructor() {
    this.setupListeners();
  }

  setupListeners() {
    // Browser online/offline events
    window.addEventListener('online', () => {
      onlineManager.setOnline(true);
    });

    window.addEventListener('offline', () => {
      onlineManager.setOnline(false);
    });

    // Custom ping-based detection
    this.startPingCheck();
  }

  async startPingCheck() {
    setInterval(async () => {
      try {
        await fetch('/api/ping', {
          method: 'HEAD',
          cache: 'no-cache'
        });
        onlineManager.setOnline(true);
      } catch {
        onlineManager.setOnline(false);
      }
    }, 30000); // Check every 30s
  }
}
```


### 🔗 Related Technologies:


#### Service Workers cho PWA


```javascript
// sw.js
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          if (cachedResponse) {
            // Return cached version
            return cachedResponse;
          }

          // Try network
          return fetch(event.request)
            .then(response => {
              // Cache successful responses
              if (response.status === 200) {
                const responseClone = response.clone();
                caches.open('api-cache').then(cache => {
                  cache.put(event.request, responseClone);
                });
              }
              return response;
            });
        })
    );
  }
});
```


#### IndexedDB cho Offline Storage


```javascript
// Dùng với 'always' networkMode
const useIndexedDBQuery = (key, fetcher) => useQuery({
  queryKey: key,
  queryFn: async () => {
    // Try IndexedDB first
    const cached = await getFromIndexedDB(key);
    if (cached && !isStale(cached)) {
      return cached.data;
    }

    // Fallback to fetcher
    const data = await fetcher();
    await saveToIndexedDB(key, data);
    return data;
  },
  networkMode: 'always'
});
```


---


## 💼 9. INTERVIEW PERSPECTIVE


### 🎯 Câu hỏi Interview có thể gặp:


#### Q1: "React Query v4 có gì mới về offline handling?"


**💡 Cách trả lời professional:**


```
"React Query v4 giới thiệu networkMode và fetchStatus để giải quyết các vấn đề offline của v3.

Trước v4, khi user offline và click vào một resource chưa cached, query sẽ stuck ở loading state mãi mãi. v4 giải quyết bằng cách:

1. Tách biệt data state (status) và network state (fetchStatus)
2. Có 3 networkMode: online, always, offlineFirst
3. Paused state để represent query đang chờ network

Ví dụ: với networkMode 'online', query sẽ pause thay vì loading vô tận, cho phép dev hiện UX phù hợp."
```


#### Q2: "Khi nào dùng networkMode nào?"


**💡 Cách trả lời:**


```
- 'online' (default): Cho API calls thông thường. Query pause khi offline để tránh failed requests và battery drain.

- 'always': Cho operations không cần network như Web Workers, local calculations, IndexedDB queries.

- 'offlineFirst': Cho PWA với Service Workers hoặc apps có browser cache layer. Initial request luôn fire để hit cache, nhưng retry pause khi offline.

Example: News app dùng 'offlineFirst' để tận dụng Service Worker cache, trong khi banking app dùng 'online' vì cần fresh data."
```


#### Q3: "fetchStatus khác với status như thế nào?"


**💡 Cách trả lời:**


```
status cho biết tình trạng data:
- loading: chưa có data
- success: có data
- error: có lỗi

fetchStatus cho biết tình trạng network request:
- fetching: đang request
- paused: bị pause vì offline
- idle: không request

Có thể kết hợp: 'success + paused' nghĩa là có data từ trước, nhưng background refetch bị pause vì offline."
```


#### Q4: "Làm sao handle optimistic updates khi offline?"


**💡 Cách trả lời advanced:**


```
"Với networkMode 'offlineFirst', ta có thể implement optimistic updates:

1. onMutate: Apply changes immediately to cache
2. Mutation fire nhưng có thể fail vì offline
3. onError: Rollback changes nếu failed
4. Khi online trở lại: Retry mutation

Key point là separate local state updates với network sync. User thấy changes ngay lập tức, nhưng app handle sync ở background."
```


### 🏆 Điểm cộng khi demonstrate knowledge:


#### 1. Hiểu trade-offs:


```javascript
// Demonstrate hiểu khi nào nên dùng gì
"Tôi sẽ chọn 'online' mode cho trading app vì data freshness critical,
nhưng 'offlineFirst' cho content app với Service Worker để better UX."
```


#### 2. Real-world experience:


```javascript
// Show practical knowledge
"Trong project trước, chúng tôi dùng 'always' mode cho shopping cart
stored trong localStorage, và 'online' cho product catalog API."
```


#### 3. Performance awareness:


```javascript
// Discuss battery/performance implications
"NetworkMode 'online' giúp save battery vì tránh spam failed requests,
đặc biệt quan trọng cho mobile apps."
```


#### 4. Architecture thinking:


```javascript
// Show system design skills
"Tôi thiết kế offline queue để handle mutations, và dùng
IndexedDB làm persistent cache layer với 'always' mode."
```


#### 5. Testing considerations:


```javascript
// Mention testing strategies
"React Query Devtools có network mode toggle để test offline scenarios
mà không cần thực sự disconnect. Cũng cần test với slow/flaky connections."
```


---


## 🎪 10. DEMO INTERACTIVE


Tôi sẽ tạo một demo interactive để bạn experiment với các networkMode khác nhau:


## 🎯 Demo Interactive Insights


Demo trên cho phép bạn **hands-on experience** với các networkMode khác nhau. Đây là những insights quan trọng từ việc experiment:


### 🔍 Key Observations:


#### 1. Online Mode Behavior


- **Khi offline:** Query pause ngay lập tức, không fire request
- **UX benefit:** User biết rõ app đang chờ mạng
- **Performance:** Save battery, tránh failed request spam
- **Use case:** Perfect cho API calls cần fresh data


#### 2. Always Mode Consistency


- **Network independent:** Luôn hoạt động regardless of connection
- **Predictable:** Behavior không thay đổi
- **Trade-off:** Có thể waste resources với network calls
- **Use case:** Local computations, IndexedDB operations


#### 3. OfflineFirst Flexibility


- **Hybrid approach:** Best of both worlds
- **Cache utilization:** Tận dụng browser/SW cache
- **Graceful degradation:** Fresh data khi online, cached khi offline
- **Use case:** PWA, content apps với Service Workers


### 🏆 Production Insights


Từ kinh nghiệm thực tế với React Query offline trong production:


```javascript
// ✅ Real-world pattern tôi hay dùng
const useHybridData = (key, fetcher) => {
  const { data, status, fetchStatus } = useQuery({
    queryKey: key,
    queryFn: fetcher,
    networkMode: 'offlineFirst',
    staleTime: 5 * 60 * 1000, // 5 phút
    cacheTime: 30 * 60 * 1000, // 30 phút
    retry: (failureCount, error) => {
      // Smart retry logic
      if (error.name === 'TypeError') return false; // Network error
      return failureCount < 2;
    }
  });

  // Custom hook để handle offline UX
  const isOfflineLoading = status === 'loading' && fetchStatus === 'paused';
  const isBackgroundSync = status === 'success' && fetchStatus === 'paused';

  return {
    data,
    isLoading: status === 'loading',
    isOfflineLoading,
    isBackgroundSync
  };
};
```


### 🎯 Architecture Recommendations


Sau 3+ năm implement React Query offline trong production:


#### 1. Layer-based Approach


```
Application Layer
├── React Query (orchestration)
├── Network Layer (online/offline detection)
├── Cache Layer (Service Worker/browser cache)
└── Storage Layer (IndexedDB/localStorage)
```


#### 2. Smart NetworkMode Selection


```javascript
// Global configuration tôi recommend
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      networkMode: 'online',     // Safe default
      staleTime: 30000,          // 30s stale time
      cacheTime: 5 * 60 * 1000,  // 5m cache time
    },
    mutations: {
      networkMode: 'offlineFirst', // Better UX cho mutations
      retry: false,                // Handle manually
    }
  }
});
```


#### 3. Offline-First Architecture


```javascript
// Service Worker + React Query combo
// sw.js
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        const networkFetch = fetch(event.request).then(response => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open('api-v1').then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        });

        return cached || networkFetch;
      })
    );
  }
});
```


---


## 🚀 Kết Luận & Next Steps


React Query v4's NetworkMode là một **game-changer** cho offline-capable applications. Tính năng này solve một problem cực kỳ practical trong mobile/PWA development.


### 🎯 Key Takeaways:


1. **Separation of Concerns:** Data state vs Network state
2. **Declarative Configuration:** Không cần custom offline logic
3. **Performance Optimization:** Battery và resource efficiency
4. **UX Enhancement:** Clear feedback cho offline scenarios


### 📈 Learning Path tiếp theo:


#### Beginner Level:


- Master basic React Query concepts
- Understand Promise-based async patterns
- Learn Service Worker fundamentals


#### Intermediate Level:


- Implement offline queues
- Build optimistic update patterns
- Create custom online managers


#### Advanced Level:


- Design offline-first architectures
- Performance optimization strategies
- Build offline sync algorithms


### 💼 Career Impact:


Understanding React Query offline capabilities đặt bạn trong **top 10%** frontend engineers. Đây là skill extremely valuable cho:


- **Mobile-first companies** (Grab, Shopee, etc.)
- **E-commerce platforms** cần work trên poor connections
- **Enterprise apps** với reliability requirements
- **PWA development** roles


**Bottom line:** React Query NetworkMode không chỉ là feature technical, mà là foundation cho building **resilient user experiences** trong mobile-first world của chúng ta. 🌟
