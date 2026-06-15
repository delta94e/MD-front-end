# WebSockets with React Query

## You

#7: Using WebSockets with React Query

## Claude


# 🌐 Phân Tích: Using WebSockets with React Query


## 📝 TÓM TẮT CHÍNH


Bài viết này giải quyết một trong những câu hỏi hot nhất trong React ecosystem: **Làm thế nào để kết hợp WebSockets với React Query để xử lý live data một cách hiệu quả?**


Vấn đề này quan trọng vì trong các ứng dụng real-time (chat, notification, live updates), chúng ta cần synchronize data giữa multiple clients mà không cần user phải manually refresh hoặc polling liên tục - điều này vừa tốn performance vừa không user-friendly.


---


## 🔍 KHÁI NIỆM CỐT LÕI


### 1. WebSockets là gì?


```javascript
// HTTP request thông thường (one-way communication)
fetch('/api/posts') // Client request
  .then(response => response.json()) // Server response
  // Connection đóng ngay sau đó

// WebSocket (bi-directional communication)
const ws = new WebSocket('wss://api.example.com')
ws.onmessage = (event) => {
  // Server có thể push data bất cứ lúc nào!
  console.log('Real-time update:', event.data)
}
```


**Hiểu đơn giản:**


- **HTTP** như việc gửi thư: bạn gửi câu hỏi, đợi phản hồi, rồi tắt máy
- **WebSocket** như cuộc gọi điện thoại: cả hai bên có thể nói chuyện bất cứ lúc nào


### 2. React Query Integration


React Query không có built-in WebSocket support, nhưng điều này là **advantage** chứ không phải limitation:


```javascript
// React Query chỉ cần Promise - không quan tâm data đến từ đâu
const usePost = (id) => useQuery({
  queryKey: ['posts', id],
  queryFn: () => fetchPost(id), // HTTP, GraphQL, localStorage, etc.
})
```


---


## 💡 HIỂU BẢN CHẤT


### Pain Points mà giải pháp này solve:


**🚨 Trước khi có WebSocket integration:**


```javascript
// User A edit post
const updatePost = useMutation({
  mutationFn: updatePostAPI,
  onSuccess: () => {
    queryClient.invalidateQueries(['posts'])
    // Chỉ User A thấy update, User B/C/D vẫn thấy data cũ!
  }
})
```


**✅ Sau khi có WebSocket integration:**


```javascript
// User A edit post
// Server tự động push event tới ALL connected clients
// User B, C, D đều nhận real-time update
websocket.onmessage = (event) => {
  const { entity, id } = JSON.parse(event.data)
  queryClient.invalidateQueries(['posts', id])
  // Tất cả users đều sync!
}
```


### Cơ chế underlying:


1. **Query invalidation** thông minh: chỉ refetch khi component đang active
2. **Event-driven updates**: server gửi events thay vì complete data
3. **Selective updates**: chỉ update data mà user đang quan tâm


---


## 🛠️ CODE EXAMPLES THỰC TẾ


### 1. Setup cơ bản:


### 2. Partial Data Updates:


---


## 🔄 SO SÁNH & PHÂN BIỆT


### WebSocket + React Query vs. Alternatives:


```
ApproachƯu điểm ✅Nhược điểm ❌Khi nào dùng?WebSocket + RQ• Real-time updates<br/>• Smart caching<br/>• Declarative syntax<br/>• Background refetching• Setup complexity<br/>• WebSocket connection overhead<br/>• Need fallback for connection lossReal-time apps, collaborative tools, live dataPolling + React Query• Simple implementation<br/>• Works với REST APIs<br/>• Reliable• Network overhead<br/>• Battery drain<br/>• Delayed updatesSimple dashboards, status checksServer-Sent Events• Simpler than WebSocket<br/>• Auto-reconnection<br/>• HTTP-friendly• One-way communication only<br/>• Limited browser supportLive feeds, notificationsGraphQL Subscriptions• Type-safe<br/>• Powerful filtering<br/>• Great tooling• Complex setup<br/>• Vendor lock-in<br/>• Learning curveGraphQL-first apps
```


### Implementation Comparison:


```javascript
// ❌ POLLING: Tốn resources, delayed updates
const usePollingPosts = () => {
  return useQuery({
    queryKey: ['posts'],
    queryFn: fetchPosts,
    refetchInterval: 5000, // Poll every 5s - waste!
  });
};

// ✅ WEBSOCKET: Efficient, instant updates
const useRealtimePosts = () => {
  useWebSocketSubscription(); // Setup once
  return useQuery({
    queryKey: ['posts'],
    queryFn: fetchPosts,
    staleTime: Infinity, // Only update via WebSocket
  });
};
```


---


## 🎯 BEST PRACTICES


### 🔥 Critical Implementation Tips:


**1. Connection Management:**


```javascript
// ✅ ĐÚNG: Cleanup và error handling
const useWebSocketConnection = () => {
  const [connectionStatus, setConnectionStatus] = useState('Connecting');

  useEffect(() => {
    const ws = new WebSocket(WS_URL);
    let heartbeatInterval;

    ws.onopen = () => {
      setConnectionStatus('Connected');
      // Heartbeat để maintain connection
      heartbeatInterval = setInterval(() => {
        ws.send(JSON.stringify({ type: 'ping' }));
      }, 30000);
    };

    ws.onclose = () => {
      setConnectionStatus('Disconnected');
      clearInterval(heartbeatInterval);
      // Auto-reconnect logic
      setTimeout(() => {
        // Reconnect after delay
      }, 5000);
    };

    return () => {
      clearInterval(heartbeatInterval);
      ws.close();
    };
  }, []);
};
```


**2. Data Validation:**


```javascript
// ✅ ĐÚNG: Validate WebSocket messages
websocket.onmessage = (event) => {
  try {
    const data = JSON.parse(event.data);

    // Validate message structure
    if (!data.type || !data.entity) {
      console.warn('Invalid WebSocket message:', data);
      return;
    }

    // Type-safe handling
    switch (data.type) {
      case 'INVALIDATE':
        handleInvalidation(data);
        break;
      case 'PARTIAL_UPDATE':
        handlePartialUpdate(data);
        break;
      default:
        console.warn('Unknown message type:', data.type);
    }
  } catch (error) {
    console.error('Failed to parse WebSocket message:', error);
  }
};
```


**3. Performance Optimization:**


```javascript
// ✅ ĐÚNG: Debounce rapid updates
const useOptimizedWebSocket = () => {
  const queryClient = useQueryClient();
  const pendingInvalidations = useRef(new Set());

  const debouncedInvalidate = useMemo(
    () => debounce(() => {
      pendingInvalidations.current.forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey });
      });
      pendingInvalidations.current.clear();
    }, 100),
    [queryClient]
  );

  // Collect invalidations, execute in batch
  const handleInvalidation = (queryKey) => {
    pendingInvalidations.current.add(queryKey);
    debouncedInvalidate();
  };
};
```


### ⚠️ Common Mistakes để tránh:


**1. Memory Leaks:**


```javascript
// ❌ SAI: Không cleanup listeners
useEffect(() => {
  const ws = new WebSocket(url);
  ws.onmessage = handleMessage;
  // Missing cleanup!
}, []);

// ✅ ĐÚNG: Proper cleanup
useEffect(() => {
  const ws = new WebSocket(url);
  ws.onmessage = handleMessage;
  return () => ws.close(); // ← Quan trọng!
}, []);
```


**2. Over-invalidation:**


```javascript
// ❌ SAI: Invalidate tất cả mọi thứ
queryClient.invalidateQueries(); // Nuclear option!

// ✅ ĐÚNG: Specific invalidation
queryClient.invalidateQueries({
  queryKey: ['posts', 'list']
});
```


---


## 🚀 ỨNG DỤNG THỰC TẾ


### Real-World Use Cases:


**🎮 1. Gaming/Esports Platform:**


```javascript
// Live tournament scores, player stats
const useTournamentLive = (tournamentId) => {
  useWebSocketSubscription(`tournament:${tournamentId}`);

  return useQuery({
    queryKey: ['tournament', tournamentId],
    queryFn: () => fetchTournament(tournamentId),
    staleTime: Infinity,
  });
};

// WebSocket events:
// { type: 'SCORE_UPDATE', tournamentId: 123, payload: { team1: 2, team2: 1 } }
// { type: 'PLAYER_STATUS', tournamentId: 123, playerId: 456, payload: { status: 'offline' } }
```


**💬 2. Collaborative Editor (như Notion, Google Docs):**


```javascript
// Real-time document collaboration
const useDocument = (docId) => {
  useWebSocketSubscription(`document:${docId}`);

  return useQuery({
    queryKey: ['document', docId],
    queryFn: () => fetchDocument(docId),
    staleTime: Infinity,
  });
};

// WebSocket events cho operational transformation:
// { type: 'TEXT_INSERT', docId: '123', position: 45, text: 'Hello' }
// { type: 'TEXT_DELETE', docId: '123', position: 45, length: 5 }
// { type: 'USER_CURSOR', docId: '123', userId: 'user1', position: 50 }
```


**📊 3. Trading/Financial Dashboard:**


```javascript
// Live stock prices, crypto prices
const useStockPrice = (symbol) => {
  useWebSocketSubscription('market-data');

  return useQuery({
    queryKey: ['stock', symbol],
    queryFn: () => fetchStockData(symbol),
    staleTime: Infinity,
  });
};

// High-frequency updates:
// { type: 'PRICE_UPDATE', symbol: 'AAPL', price: 150.25, change: +0.75 }
// { type: 'VOLUME_UPDATE', symbol: 'AAPL', volume: 1250000 }
```


### Integration với Frameworks:


**⚡ Next.js Integration:**


```javascript
// pages/_app.js - Global WebSocket setup
function MyApp({ Component, pageProps }) {
  return (
    <QueryClientProvider client={queryClient}>
      <WebSocketProvider>
        <Component {...pageProps} />
      </WebSocketProvider>
    </QueryClientProvider>
  );
}

// hooks/useWebSocketProvider.js
export const WebSocketProvider = ({ children }) => {
  useEffect(() => {
    // Setup global WebSocket connection
    const ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL);

    // Store in global context or useRef
    return () => ws.close();
  }, []);

  return children;
};
```


---


## 📚 KIẾN THỨC LIÊN QUAN


### Prerequisites cần biết:


**🎯 Cơ bản:**


- React Hooks (useEffect, useRef, useState)
- Promise/async-await patterns
- JSON parsing và error handling
- Browser WebSocket API basics


**🎯 Intermediate:**


- React Query core concepts (queries, mutations, cache)
- Event-driven programming patterns
- Debouncing và throttling
- Connection state management


**🎯 Advanced:**


- Operational Transformation algorithms (cho collaborative editing)
- CRDT (Conflict-free Replicated Data Types)
- WebSocket protocol deep dive
- Network partition handling


### Technologies để tìm hiểu tiếp:


**📡 Alternative Real-time Solutions:**


```javascript
// Server-Sent Events (simpler)
const eventSource = new EventSource('/api/events');
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // Handle server-sent events
};

// Socket.IO (feature-rich)
import io from 'socket.io-client';
const socket = io('http://localhost:3001');
socket.on('update', (data) => {
  // Handle Socket.IO events
});

// GraphQL Subscriptions
const SUBSCRIPTION = gql`
  subscription OnPostUpdated {
    postUpdated {
      id
      title
      content
    }
  }
`;
```


**🔧 Advanced Patterns:**


- **Optimistic Updates:** Update UI immediately, rollback nếu fail
- **Conflict Resolution:** Handle concurrent edits
- **Offline Support:** Queue updates khi mất connection
- **Message Queuing:** Redis/RabbitMQ cho scale


---


## 💼 INTERVIEW PERSPECTIVE


### Câu hỏi Interview thường gặp:


**Q1: "Explain how you would implement real-time features in a React app"**


**🎯 Câu trả lời Professional:**


```
"Tôi sẽ analyze requirements trước:

1. **Type of real-time updates:**
   - One-way (notifications) → Server-Sent Events
   - Bi-directional (chat) → WebSockets
   - Query-based (GraphQL) → Subscriptions

2. **Implementation với React Query:**
   - Setup WebSocket connection trong useEffect
   - Parse incoming messages và invalidate relevant queries
   - Use staleTime: Infinity để chỉ update via WebSocket
   - Handle connection errors và reconnection logic

3. **Performance considerations:**
   - Debounce rapid updates để avoid UI thrashing
   - Use partial updates cho small changes
   - Implement heartbeat để detect connection issues

4. **Scalability:**
   - Namespace WebSocket channels theo feature
   - Implement message filtering client-side
   - Consider connection pooling cho large apps"
```


**Q2: "What are the trade-offs between polling vs WebSockets?"**


**🎯 So sánh table:**


```
AspectPollingWebSocketsComplexitySimpleComplexLatencyHigh (poll interval)Low (instant)Server LoadHigh (constant requests)Low (persistent connection)Battery LifePoor (mobile)GoodReliabilityHigh (HTTP)Medium (connection drops)Firewall IssuesRareCommon
```


**Q3: "How do you handle WebSocket disconnections?"**


```javascript
// Professional implementation với retry logic
const useReliableWebSocket = (url) => {
  const [status, setStatus] = useState('connecting');
  const wsRef = useRef();
  const retryCountRef = useRef(0);

  const connect = useCallback(() => {
    const ws = new WebSocket(url);

    ws.onopen = () => {
      setStatus('connected');
      retryCountRef.current = 0; // Reset retry count
    };

    ws.onclose = () => {
      setStatus('disconnected');

      // Exponential backoff retry
      const retryDelay = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000);
      retryCountRef.current++;

      setTimeout(connect, retryDelay);
    };

    wsRef.current = ws;
  }, [url]);

  useEffect(() => {
    connect();
    return () => wsRef.current?.close();
  }, [connect]);

  return { status, ws: wsRef.current };
};
```


### Điểm cộng khi demonstrate:


**🏆 Advanced Knowledge:**


- Hiểu về WebSocket subprotocols
- Security considerations (CSRF, XSS protection)
- Performance monitoring và metrics
- Graceful degradation strategies


**🏆 Production Experience:**


- Message ordering guarantees
- Connection pooling strategies
- Load balancing với sticky sessions
- Monitoring và alerting setup


---


## 🎪 DEMO INTERACTIVE


Phân tích hoàn thành! 🎉


---


## 🎓 KẾT LUẬN & TAKEAWAYS


Sau khi phân tích comprehensive này, bạn đã nắm vững:


**🎯 Core Understanding:**


- WebSocket + React Query pattern để solve real-time data synchronization
- Event-driven architecture thay vì polling
- Smart caching strategy với staleTime: Infinity


**🛠️ Implementation Skills:**


- Setup WebSocket connection với error handling
- Integrate với React Query queries một cách hiệu quả
- Handle both invalidation và partial updates
- Connection management với retry logic


**💼 Production Ready:**


- Best practices cho scalable architecture
- Performance optimization strategies
- Interview-ready explanations
- Real-world use cases và patterns


**🚀 Next Steps:**


- Implement trong project của bạn
- Explore advanced patterns như operational transformation
- Research alternative solutions như Server-Sent Events
- Practice với different WebSocket providers


Bạn giờ đã có đầy đủ knowledge để implement real-time features trong React apps một cách professional! 💪


**🔥 Pro Tip:** Start với simple use case (like notifications) rồi gradually scale lên complex features (like collaborative editing). Pattern này sẽ work cho mọi real-time requirement!
