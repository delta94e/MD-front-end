# WebSocket Protocol Fundamentals

## You

Websocket
Websocket is a persistent protocol based on http, the server can actively pushcompatible:
 FLASH SocketLong polling: sending ajax messages at regular intervalsLong poll: Send --> respond when there is a messagenew WebSocket(url)ws.onerror = fnws.onclose = fnws.onopen = fnws.onmessage = fnws.send()
作者：郭东东 链接：https://juejin.cn/post/6844903776512393224 来源：稀土掘金 著作权归作者所有。商业转载请联系作者获得授权，非商业转载请注明出处。

## Claude


# WebSocket: Hành Trình Khám Phá Từ First Principles Đến Principal Engineering


## 🌟 Mở Đầu: Tại Sao WebSocket Lại Quan Trọng Đến Vậy?


Chào các bạn! Hôm nay chúng ta sẽ cùng nhau deep dive vào một trong những công nghệ quan trọng nhất trong modern web development - **WebSocket**. Là một Principal Front-end Engineer đã trải qua hành trình tại NAB, Axon, Binance, Webflow, và Figma, tôi có thể khẳng định rằng WebSocket không chỉ là một API đơn thuần, mà là một paradigm shift fundamentally trong cách chúng ta tư duy về real-time communication.


Khi tôi lần đầu tiên encounter WebSocket tại NAB vào năm 2018, tôi đã confused về một điều: "Tại sao chúng ta cần một protocol mới khi đã có HTTP?" Câu hỏi này dẫn dắt tôi vào một hành trình khám phá sâu sắc về network protocols, browser internals, và system architecture - kiến thức mà sau này trở thành foundation cho mọi real-time features tôi xây dựng tại Binance và Figma.


## 📖 PHẦN I: FOUNDATION LEVEL - HIỂU WEBSOCKET TỪ GỐC RỄ


### 🌱 Nguồn Gốc & Motivation: Câu Chuyện Đằng Sau WebSocket


#### Problem Statement Chi Tiết: Tại Sao HTTP Không Đủ?


Để hiểu tại sao WebSocket được tạo ra, chúng ta cần quay về những ngày đầu của web development. Hãy tưởng tượng bạn đang làm việc tại một startup fintech năm 2005, và CEO yêu cầu bạn xây dựng một trading platform real-time. Với chỉ HTTP trong tay, bạn sẽ gặp phải những challenges sau:


**1. HTTP Request-Response Model:**


```
Client ---[Request]---> Server
Client <--[Response]--- Server
[Connection Closed]
```


HTTP được design theo request-response model, nghĩa là:


- Client phải luôn initiate communication
- Mỗi request tạo ra một TCP connection mới (hoặc reuse từ connection pool)
- Server không thể "chủ động" gửi data đến client
- Overhead của HTTP headers trong mỗi request


**2. Real-world Example từ NAB:**
Khi tôi làm việc tại NAB, chúng tôi có một requirement: hiển thị real-time account balance updates. Với HTTP, chúng tôi phải:


```javascript
// Cách cũ: Polling every 5 seconds
setInterval(() => {
  fetch('/api/account/balance')
    .then(response => response.json())
    .then(data => updateUI(data));
}, 5000);
```


**Problems với approach này:**


- **Network overhead:** Mỗi 5 giây gửi một HTTP request, ngay cả khi không có data mới
- **Battery drain:** Mobile apps liên tục poll server
- **Server load:** Thousands of concurrent polling requests
- **Latency:** Worst case 5 seconds delay để receive updates
- **Scalability issues:** Server phải handle massive số lượng meaningless requests


#### Historical Context: Evolution của Real-time Communication


**Phase 1: The Dark Ages (1995-2005)**


```
Webpage ---> [Manual Refresh] ---> Server
```


Users phải manually refresh page để get new data.


**Phase 2: AJAX Revolution (2005-2008)**


```javascript
// XMLHttpRequest cho phép async communication
const xhr = new XMLHttpRequest();
xhr.open('GET', '/api/data');
xhr.onreadystatechange = function() {
  if (xhr.readyState === 4 && xhr.status === 200) {
    updateUI(xhr.responseText);
  }
};
xhr.send();
```


**Phase 3: Polling Techniques (2008-2011)**


**3a. Short Polling:**


```javascript
// Gửi request liên tục
function poll() {
  fetch('/api/updates')
    .then(response => response.json())
    .then(data => {
      if (data.hasUpdates) updateUI(data);
      setTimeout(poll, 1000); // Poll every second
    });
}
```


**Problems:**


- Massive server load
- Network waste
- Poor user experience due to latency


**3b. Long Polling:**


```javascript
// Server giữ connection open until có data mới
function longPoll() {
  fetch('/api/longpoll')
    .then(response => response.json())
    .then(data => {
      updateUI(data);
      longPoll(); // Immediately start next poll
    })
    .catch(() => {
      setTimeout(longPoll, 5000); // Retry after error
    });
}
```


**Improvements:**


- Reduced latency
- Less network traffic
- Better user experience


**Remaining Problems:**


- Still HTTP overhead
- Complex server implementation
- Browser connection limits
- Difficult error handling
- Resource management complexity


#### 💭 Principal's Perspective: Tại Sao Long Polling Vẫn Không Đủ?


Khi tôi architecting real-time features tại Binance, long polling dẫn đến những challenges sau:


**1. Connection Management Nightmare:**


```javascript
// Phải manage multiple long-polling connections
const connections = {
  priceUpdates: null,
  orderUpdates: null,
  tradeHistory: null,
  notifications: null
};

// Browser limit: 6 concurrent connections per domain
// Với 4 long-polling connections, chỉ còn 2 cho other requests
```


**2. Complex Error Handling:**


```javascript
function handleLongPollError(error, connectionType) {
  // Network error? Server error? Timeout?
  // Exponential backoff logic
  // Connection state management
  // User notification
  // Fallback mechanisms
}
```


**3. Mobile Performance Issues:**


- Battery drain từ constant HTTP connections
- Data usage từ HTTP headers
- Connection state management khi app background/foreground


### 🔬 Bản Chất & Mechanism: WebSocket Protocol Deep Dive


#### WebSocket Protocol Overview: Từ HTTP Đến Full-Duplex


WebSocket được định nghĩa trong RFC 6455 (2011) như một protocol để enable full-duplex communication over một single TCP connection. Đây là revolutionary step vì:


**1. Full-Duplex Communication:**


```
Client <--[Bi-directional]---> Server
       <--[Any time]-->
```


Khác với HTTP:


```
Client --[Request]--> Server
Client <-[Response]-- Server
[Connection Closed]
```


**2. Protocol Upgrade Mechanism:**
WebSocket sử dụng HTTP upgrade mechanism để "chuyển đổi" từ HTTP connection thành WebSocket connection:


```http
GET /websocket HTTP/1.1
Host: example.com
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Sec-WebSocket-Version: 13
```


Server response:


```http
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
```


#### Step-by-Step WebSocket Handshake Analysis:


**Step 1: Client Initiation**


```javascript
const ws = new WebSocket('ws://example.com/socket');
```


Browser internally:


1. Tạo TCP connection đến server (port 80 cho ws://, port 443 cho wss://)
2. Gửi HTTP upgrade request với special headers
3. Generate random `Sec-WebSocket-Key` (16-byte base64-encoded value)


**Step 2: Key Generation Deep Dive**


```javascript
// Pseudo-code for Sec-WebSocket-Key generation
function generateWebSocketKey() {
  const randomBytes = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...randomBytes));
}
```


**Step 3: Server Validation**
Server phải:


1. Validate `Sec-WebSocket-Key`
2. Concatenate với magic string: `"258EAFA5-E914-47DA-95CA-C5AB0DC85B11"`
3. SHA-1 hash và base64 encode để tạo `Sec-WebSocket-Accept`


```python
# Server-side validation (Python example)
import hashlib
import base64

def generate_accept_key(client_key):
    magic_string = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"
    combined = client_key + magic_string
    sha1_hash = hashlib.sha1(combined.encode()).digest()
    return base64.b64encode(sha1_hash).decode()
```


**Step 4: Protocol Switch**
Sau successful handshake:


- TCP connection được "converted" thành WebSocket connection
- HTTP protocol headers không còn được sử dụng
- Data được transmitted theo WebSocket frame format


#### WebSocket Frame Format: Binary Protocol Analysis


WebSocket data được transmitted theo frames với specific format:


```
0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-------+-+-------------+-------------------------------+
|F|R|R|R| opcode|M| Payload len |    Extended payload length    |
|I|S|S|S|  (4)  |A|     (7)     |             (16/64)           |
|N|V|V|V|       |S|             |   (if payload len==126/127)   |
| |1|2|3|       |K|             |                               |
+-+-+-+-+-------+-+-------------+ - - - - - - - - - - - - - - - +
|     Extended payload length continued, if payload len == 127  |
+ - - - - - - - - - - - - - - - +-------------------------------+
|                               |Masking-key, if MASK set to 1  |
+-------------------------------+-------------------------------+
| Masking-key (continued)       |          Payload Data         |
+-------------------------------- - - - - - - - - - - - - - - - +
:                     Payload Data continued ...                :
+ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - +
|                     Payload Data continued ...                |
+---------------------------------------------------------------+
```


**Field Breakdown:**


**FIN (1 bit):** Final fragment flag


- 1: This is final fragment of message
- 0: More fragments follow


**RSV1, RSV2, RSV3 (1 bit each):** Reserved for extensions


**Opcode (4 bits):** Frame type


- 0x0: Continuation frame
- 0x1: Text frame (UTF-8)
- 0x2: Binary frame
- 0x8: Connection close
- 0x9: Ping
- 0xA: Pong


**MASK (1 bit):** Payload masking


- Client-to-server frames MUST be masked
- Server-to-client frames MUST NOT be masked


**Payload Length (7 bits + extended):**


- 0-125: Actual length
- 126: Next 16 bits contain length
- 127: Next 64 bits contain length


#### 💭 Deep Understanding Process: Frame Masking Security


Khi tôi đầu tiên học về WebSocket masking, tôi confused: "Tại sao client phải mask data nhưng server thì không?"


**Security Reasoning:**


1. **Proxy Cache Poisoning Prevention:** Masked data prevent malicious websites từ crafting WebSocket frames giống HTTP requests
2. **Transparent Proxy Issues:** Một số proxy servers có thể misinterpret WebSocket frames as HTTP requests nếu không được masked


**Masking Algorithm:**


```javascript
// Pseudo-code for masking
function maskPayload(payload, maskingKey) {
  const masked = new Uint8Array(payload.length);
  for (let i = 0; i < payload.length; i++) {
    masked[i] = payload[i] ^ maskingKey[i % 4];
  }
  return masked;
}
```


### 💡 Intuitive Understanding: WebSocket Analogy


#### Real-World Analogy: Telephone vs. Mail System


**HTTP Request-Response = Mail System:**


```
You --[Write Letter]---> Post Office --[Deliver]---> Friend
You <--[Reply Letter]--- Post Office <--[Send Back]-- Friend
[End of Communication]
```


- Mỗi lần communication cần complete "setup" process
- High latency (days)
- Overhead (envelope, postage, addressing)
- One-way communication per "transaction"


**WebSocket = Telephone Call:**


```
You <--[Talk anytime]---> Friend
    <--[Listen anytime]-->
[Ongoing conversation until hangup]
```


- One-time setup (dialing)
- Low latency (instant)
- Minimal overhead during conversation
- True bidirectional communication


#### Technical Analogy: TCP vs. WebSocket


```
TCP Socket (Server-to-Server):
App1 <--[Direct TCP]---> App2

WebSocket (Browser-to-Server):
Browser <--[WebSocket over TCP]---> Server
```


WebSocket essentially brings TCP-like capabilities to web browsers, với additional features như:


- Browser security model compliance
- HTTP upgrade compatibility
- Frame-based messaging
- Built-in ping/pong heartbeat


### ⚙️ Implementation Deep Dive: WebSocket API Analysis


#### Client-Side API Breakdown


**1. Constructor Analysis:**


```javascript
const ws = new WebSocket(url, protocols);
```


**Parameters Deep Dive:**


**url (Required):**


- Format: `ws://` hoặc `wss://` (secure)
- Examples:

ws://localhost:8080/socket
wss://api.example.com/realtime
ws://example.com:3000/chat?room=general&user=john


**protocols (Optional):**


```javascript
// Single protocol
const ws = new WebSocket('ws://example.com', 'chat-protocol-v1');

// Multiple protocols (server chọn một)
const ws = new WebSocket('ws://example.com', [
  'chat-protocol-v2',
  'chat-protocol-v1'
]);
```


**Constructor Internal Process:**


1. URL validation và parsing
2. Protocol validation
3. Create WebSocket object trong "CONNECTING" state
4. Initiate TCP connection
5. Send HTTP upgrade request
6. Return WebSocket object immediately (async process)


**2. Event Handlers Deep Analysis:**


**onopen Event:**


```javascript
ws.onopen = function(event) {
  console.log('Connection established');
  console.log('Protocol selected:', ws.protocol);
  console.log('Extensions:', ws.extensions);
};
```


**Event Properties:**


- `event.target`: WebSocket object
- `ws.protocol`: Server-selected protocol
- `ws.extensions`: Negotiated extensions
- `ws.readyState`: Should be `WebSocket.OPEN` (1)


**onmessage Event Deep Dive:**


```javascript
ws.onmessage = function(event) {
  console.log('Message received:', event.data);
  console.log('Message type:', typeof event.data);
  console.log('Last event ID:', event.lastEventId);
  console.log('Origin:', event.origin);
};
```


**Data Types Handling:**


```javascript
ws.onmessage = function(event) {
  if (typeof event.data === 'string') {
    // Text frame received
    const message = JSON.parse(event.data);
    handleTextMessage(message);
  } else if (event.data instanceof ArrayBuffer) {
    // Binary frame received
    const view = new DataView(event.data);
    handleBinaryMessage(view);
  } else if (event.data instanceof Blob) {
    // Blob data (rare, usually converted to ArrayBuffer)
    event.data.arrayBuffer().then(handleBinaryMessage);
  }
};
```


**onerror Event Analysis:**


```javascript
ws.onerror = function(event) {
  console.error('WebSocket error:', event);
  // Note: error details often limited for security reasons

  // Error could be:
  // - Connection failed
  // - Handshake failed
  // - Network error during communication
  // - Protocol error
};
```


**onclose Event Deep Dive:**


```javascript
ws.onclose = function(event) {
  console.log('Connection closed');
  console.log('Code:', event.code);
  console.log('Reason:', event.reason);
  console.log('Clean close:', event.wasClean);

  handleConnectionClose(event.code, event.reason);
};
```


**Close Codes Reference:**


```javascript
const CLOSE_CODES = {
  1000: 'Normal closure',
  1001: 'Going away',
  1002: 'Protocol error',
  1003: 'Unsupported data',
  1005: 'No status received',
  1006: 'Abnormal closure',
  1007: 'Invalid frame payload data',
  1008: 'Policy violation',
  1009: 'Message too big',
  1010: 'Mandatory extension',
  1011: 'Internal server error',
  1015: 'TLS handshake'
};
```


**3. Methods Analysis:**


**send() Method Deep Dive:**


```javascript
// Text data
ws.send('Hello, server!');
ws.send(JSON.stringify({ type: 'message', content: 'Hello' }));

// Binary data
const buffer = new ArrayBuffer(16);
const view = new DataView(buffer);
view.setUint32(0, 42);
ws.send(buffer);

// Blob data
const blob = new Blob(['Hello'], { type: 'text/plain' });
ws.send(blob);
```


**Send Method Validation:**


```javascript
function safeSend(ws, data) {
  if (ws.readyState === WebSocket.OPEN) {
    try {
      ws.send(data);
      return true;
    } catch (error) {
      console.error('Send failed:', error);
      return false;
    }
  } else {
    console.warn('WebSocket not open. State:', ws.readyState);
    return false;
  }
}
```


**close() Method:**


```javascript
// Graceful close
ws.close();

// Close with code and reason
ws.close(1000, 'User logged out');

// Emergency close
ws.close(1001, 'Page unloading');
```


#### ReadyState Management:


```javascript
const READY_STATES = {
  CONNECTING: 0, // Connection not yet established
  OPEN: 1,       // Connection established and ready for communication
  CLOSING: 2,    // Connection is going through closing handshake
  CLOSED: 3      // Connection closed or couldn't open
};

function getReadyStateDescription(state) {
  switch (state) {
    case WebSocket.CONNECTING:
      return 'Establishing connection...';
    case WebSocket.OPEN:
      return 'Connected and ready';
    case WebSocket.CLOSING:
      return 'Closing connection...';
    case WebSocket.CLOSED:
      return 'Connection closed';
    default:
      return 'Unknown state';
  }
}
```


#### 💭 Production Reality: Error Handling Patterns


Trong real-world applications tại Binance, chúng tôi implement comprehensive error handling:


```javascript
class RobustWebSocket {
  constructor(url, options = {}) {
    this.url = url;
    this.options = {
      maxReconnectAttempts: 5,
      reconnectInterval: 1000,
      maxReconnectInterval: 30000,
      reconnectDecay: 1.5,
      timeoutInterval: 2000,
      enableLogging: true,
      ...options
    };

    this.reconnectAttempts = 0;
    this.reconnectTimer = null;
    this.ws = null;
    this.forcedClose = false;
    this.timedOut = false;

    this.eventHandlers = {
      open: [],
      message: [],
      error: [],
      close: []
    };

    this.connect();
  }

  connect() {
    this.ws = new WebSocket(this.url);
    this.setupEventHandlers();
    this.setupTimeout();
  }

  setupEventHandlers() {
    this.ws.onopen = (event) => {
      this.log('Connection established');
      this.reconnectAttempts = 0;
      this.timedOut = false;
      this.fireEvent('open', event);
    };

    this.ws.onmessage = (event) => {
      this.fireEvent('message', event);
    };

    this.ws.onerror = (event) => {
      this.log('WebSocket error:', event);
      this.fireEvent('error', event);
    };

    this.ws.onclose = (event) => {
      this.log('Connection closed:', event.code, event.reason);
      this.fireEvent('close', event);

      if (!this.forcedClose && !this.timedOut) {
        this.scheduleReconnect();
      }
    };
  }

  setupTimeout() {
    clearTimeout(this.timeoutTimer);
    this.timeoutTimer = setTimeout(() => {
      this.log('Connection timeout');
      this.timedOut = true;
      this.ws.close();
    }, this.options.timeoutInterval);
  }

  scheduleReconnect() {
    if (this.reconnectAttempts < this.options.maxReconnectAttempts) {
      this.reconnectAttempts++;

      const timeout = this.options.reconnectInterval *
        Math.pow(this.options.reconnectDecay, this.reconnectAttempts - 1);
      const maxTimeout = this.options.maxReconnectInterval;
      const reconnectTimeout = Math.min(timeout, maxTimeout);

      this.log(`Reconnecting in ${reconnectTimeout}ms (attempt ${this.reconnectAttempts})`);

      this.reconnectTimer = setTimeout(() => {
        this.connect();
      }, reconnectTimeout);
    } else {
      this.log('Max reconnection attempts reached');
      this.fireEvent('maxReconnectAttemptsReached');
    }
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(data);
        return true;
      } catch (error) {
        this.log('Send error:', error);
        return false;
      }
    } else {
      this.log('Cannot send: WebSocket not open');
      return false;
    }
  }

  close(code = 1000, reason = '') {
    this.forcedClose = true;
    clearTimeout(this.reconnectTimer);
    clearTimeout(this.timeoutTimer);

    if (this.ws) {
      this.ws.close(code, reason);
    }
  }

  // Event handling methods
  addEventListener(type, handler) {
    if (this.eventHandlers[type]) {
      this.eventHandlers[type].push(handler);
    }
  }

  removeEventListener(type, handler) {
    if (this.eventHandlers[type]) {
      const index = this.eventHandlers[type].indexOf(handler);
      if (index !== -1) {
        this.eventHandlers[type].splice(index, 1);
      }
    }
  }

  fireEvent(type, event = {}) {
    if (this.eventHandlers[type]) {
      this.eventHandlers[type].forEach(handler => {
        try {
          handler(event);
        } catch (error) {
          this.log('Event handler error:', error);
        }
      });
    }
  }

  log(...args) {
    if (this.options.enableLogging) {
      console.log('[RobustWebSocket]', ...args);
    }
  }
}
```


## 📖 PHẦN II: SENIOR LEVEL - ADVANCED CONCEPTS VÀ PATTERNS


### 🏗️ Architecture Patterns: WebSocket trong Large-Scale Applications


#### 1. Connection Management Strategies


**Connection Pooling Pattern:**


```javascript
class WebSocketPool {
  constructor(baseUrl, options = {}) {
    this.baseUrl = baseUrl;
    this.options = {
      maxConnections: 5,
      connectionTimeout: 30000,
      idleTimeout: 300000, // 5 minutes
      ...options
    };

    this.connections = new Map();
    this.availableConnections = [];
    this.pendingRequests = [];
    this.connectionCount = 0;

    this.setupIdleTimer();
  }

  async acquireConnection(channel) {
    // Reuse existing connection for same channel
    if (this.connections.has(channel)) {
      const conn = this.connections.get(channel);
      if (conn.readyState === WebSocket.OPEN) {
        return conn;
      } else {
        this.connections.delete(channel);
      }
    }

    // Get available connection
    if (this.availableConnections.length > 0) {
      const conn = this.availableConnections.pop();
      this.connections.set(channel, conn);
      return conn;
    }

    // Create new connection if under limit
    if (this.connectionCount < this.options.maxConnections) {
      return this.createConnection(channel);
    }

    // Wait for available connection
    return new Promise((resolve, reject) => {
      this.pendingRequests.push({ channel, resolve, reject });
    });
  }

  async createConnection(channel) {
    try {
      const ws = new RobustWebSocket(`${this.baseUrl}/${channel}`);

      ws.addEventListener('open', () => {
        this.connectionCount++;
        this.connections.set(channel, ws);
        this.processPendingRequests();
      });

      ws.addEventListener('close', () => {
        this.handleConnectionClose(channel, ws);
      });

      await this.waitForConnection(ws);
      return ws;
    } catch (error) {
      throw new Error(`Failed to create WebSocket connection: ${error.message}`);
    }
  }

  releaseConnection(channel) {
    const conn = this.connections.get(channel);
    if (conn && conn.readyState === WebSocket.OPEN) {
      this.connections.delete(channel);
      this.availableConnections.push(conn);
      this.processPendingRequests();
    }
  }

  handleConnectionClose(channel, ws) {
    this.connections.delete(channel);
    this.connectionCount--;

    const index = this.availableConnections.indexOf(ws);
    if (index !== -1) {
      this.availableConnections.splice(index, 1);
    }
  }

  processPendingRequests() {
    if (this.pendingRequests.length > 0 && this.availableConnections.length > 0) {
      const request = this.pendingRequests.shift();
      const conn = this.availableConnections.pop();
      this.connections.set(request.channel, conn);
      request.resolve(conn);
    }
  }

  setupIdleTimer() {
    setInterval(() => {
      this.cleanupIdleConnections();
    }, 60000); // Check every minute
  }

  cleanupIdleConnections() {
    const now = Date.now();
    this.availableConnections = this.availableConnections.filter(conn => {
      if (now - conn.lastUsed > this.options.idleTimeout) {
        conn.close(1000, 'Idle timeout');
        this.connectionCount--;
        return false;
      }
      return true;
    });
  }
}
```


#### 2. Message Routing và Multiplexing


**Channel-based Message Routing:**


```javascript
class WebSocketRouter {
  constructor(websocket) {
    this.ws = websocket;
    this.channels = new Map();
    this.messageQueue = [];
    this.isReady = false;

    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.ws.addEventListener('open', () => {
      this.isReady = true;
      this.flushMessageQueue();
    });

    this.ws.addEventListener('message', (event) => {
      this.routeMessage(event.data);
    });

    this.ws.addEventListener('close', () => {
      this.isReady = false;
    });
  }

  subscribe(channel, handler) {
    if (!this.channels.has(channel)) {
      this.channels.set(channel, new Set());

      // Send subscription message to server
      this.send({
        type: 'subscribe',
        channel: channel
      });
    }

    this.channels.get(channel).add(handler);

    // Return unsubscribe function
    return () => this.unsubscribe(channel, handler);
  }

  unsubscribe(channel, handler) {
    if (this.channels.has(channel)) {
      const handlers = this.channels.get(channel);
      handlers.delete(handler);

      if (handlers.size === 0) {
        this.channels.delete(channel);

        // Send unsubscription message to server
        this.send({
          type: 'unsubscribe',
          channel: channel
        });
      }
    }
  }

  send(message) {
    const serialized = JSON.stringify(message);

    if (this.isReady) {
      this.ws.send(serialized);
    } else {
      this.messageQueue.push(serialized);
    }
  }

  routeMessage(data) {
    try {
      const message = JSON.parse(data);
      const { channel, ...payload } = message;

      if (this.channels.has(channel)) {
        const handlers = this.channels.get(channel);
        handlers.forEach(handler => {
          try {
            handler(payload);
          } catch (error) {
            console.error(`Handler error for channel ${channel}:`, error);
          }
        });
      }
    } catch (error) {
      console.error('Message routing error:', error);
    }
  }

  flushMessageQueue() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      this.ws.send(message);
    }
  }

  publish(channel, data) {
    this.send({
      type: 'publish',
      channel: channel,
      data: data
    });
  }
}
```


#### 💭 Principal's Perspective: Scaling WebSocket tại Binance


Tại Binance, chúng tôi handle millions of concurrent WebSocket connections. Một trong những challenges lớn nhất là message routing efficiency. Initial implementation của chúng tôi:


```javascript
// Naive approach - O(n) message routing
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);

  // Linear search through all subscriptions
  for (const subscription of subscriptions) {
    if (subscription.symbol === message.symbol) {
      subscription.handler(message);
    }
  }
};
```


**Problem:** Với 10,000+ subscriptions, mỗi message phải iterate through all subscriptions.


**Solution:** Hash-based routing với O(1) lookup:


```javascript
class OptimizedRouter {
  constructor() {
    this.routes = new Map(); // symbol -> Set<handlers>
    this.wildcardRoutes = new Set(); // handlers for all symbols
  }

  subscribe(pattern, handler) {
    if (pattern === '*') {
      this.wildcardRoutes.add(handler);
    } else {
      if (!this.routes.has(pattern)) {
        this.routes.set(pattern, new Set());
      }
      this.routes.get(pattern).add(handler);
    }
  }

  route(message) {
    const { symbol } = message;

    // Direct symbol handlers - O(1)
    if (this.routes.has(symbol)) {
      this.routes.get(symbol).forEach(handler => handler(message));
    }

    // Wildcard handlers - O(k) where k = number of wildcard handlers
    this.wildcardRoutes.forEach(handler => handler(message));
  }
}
```


### 🔧 Performance Optimization Strategies


#### 1. Message Batching và Throttling


**Message Batching Pattern:**


```javascript
class MessageBatcher {
  constructor(websocket, options = {}) {
    this.ws = websocket;
    this.options = {
      batchSize: 100,
      batchTimeout: 16, // ~60fps
      maxBatchSize: 1000,
      ...options
    };

    this.messageBuffer = [];
    this.batchTimer = null;
    this.lastFlushTime = 0;
  }

  addMessage(message) {
    this.messageBuffer.push(message);

    // Immediate flush if buffer is full
    if (this.messageBuffer.length >= this.options.maxBatchSize) {
      this.flush();
      return;
    }

    // Schedule flush if not already scheduled
    if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => {
        this.flush();
      }, this.options.batchTimeout);
    }
  }

  flush() {
    if (this.messageBuffer.length === 0) return;

    const batch = this.messageBuffer.splice(0, this.options.batchSize);
    const batchMessage = {
      type: 'batch',
      messages: batch,
      timestamp: Date.now()
    };

    this.ws.send(JSON.stringify(batchMessage));

    clearTimeout(this.batchTimer);
    this.batchTimer = null;
    this.lastFlushTime = Date.now();

    // Schedule next flush if more messages remain
    if (this.messageBuffer.length > 0) {
      this.batchTimer = setTimeout(() => {
        this.flush();
      }, this.options.batchTimeout);
    }
  }

  // Force immediate flush
  forceFlush() {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
    this.flush();
  }
}
```


**Throttling Implementation:**


```javascript
class ThrottledWebSocket {
  constructor(websocket, options = {}) {
    this.ws = websocket;
    this.options = {
      messagesPerSecond: 100,
      burstSize: 20,
      ...options
    };

    this.tokenBucket = {
      tokens: this.options.burstSize,
      lastRefill: Date.now(),
      capacity: this.options.burstSize
    };

    this.messageQueue = [];
    this.drainTimer = null;

    this.startTokenRefill();
  }

  send(message) {
    if (this.hasTokens()) {
      this.consumeToken();
      this.ws.send(message);
    } else {
      this.messageQueue.push(message);
      this.scheduleDrain();
    }
  }

  hasTokens() {
    this.refillTokens();
    return this.tokenBucket.tokens > 0;
  }

  consumeToken() {
    this.tokenBucket.tokens = Math.max(0, this.tokenBucket.tokens - 1);
  }

  refillTokens() {
    const now = Date.now();
    const timePassed = now - this.tokenBucket.lastRefill;
    const tokensToAdd = (timePassed / 1000) * this.options.messagesPerSecond;

    this.tokenBucket.tokens = Math.min(
      this.tokenBucket.capacity,
      this.tokenBucket.tokens + tokensToAdd
    );
    this.tokenBucket.lastRefill = now;
  }

  scheduleDrain() {
    if (!this.drainTimer) {
      this.drainTimer = setTimeout(() => {
        this.drainQueue();
      }, 1000 / this.options.messagesPerSecond);
    }
  }

  drainQueue() {
    this.drainTimer = null;

    while (this.messageQueue.length > 0 && this.hasTokens()) {
      const message = this.messageQueue.shift();
      this.consumeToken();
      this.ws.send(message);
    }

    if (this.messageQueue.length > 0) {
      this.scheduleDrain();
    }
  }

  startTokenRefill() {
    setInterval(() => {
      this.refillTokens();
      if (this.messageQueue.length > 0 && this.hasTokens()) {
        this.drainQueue();
      }
    }, 100); // Check every 100ms
  }
}
```


#### 2. Memory Management và Garbage Collection


**Efficient Message Handling:**


```javascript
class MemoryEfficientWebSocket {
  constructor(url) {
    this.ws = new WebSocket(url);
    this.messagePool = new MessagePool(1000); // Reuse message objects
    this.handlers = new WeakMap(); // Prevent memory leaks

    this.setupOptimizedHandlers();
  }

  setupOptimizedHandlers() {
    this.ws.onmessage = (event) => {
      // Reuse objects instead of creating new ones
      const message = this.messagePool.acquire();

      try {
        Object.assign(message, JSON.parse(event.data));
        this.processMessage(message);
      } catch (error) {
        console.error('Message processing error:', error);
      } finally {
        // Return object to pool
        this.messagePool.release(message);
      }
    };
  }

  processMessage(message) {
    // Process message without creating additional objects
    const { type, data } = message;

    switch (type) {
      case 'price_update':
        this.handlePriceUpdate(data);
        break;
      case 'order_update':
        this.handleOrderUpdate(data);
        break;
      default:
        this.handleGenericMessage(message);
    }
  }

  // Avoid creating closures in hot paths
  handlePriceUpdate = (data) => {
    // Direct property access instead of destructuring
    const symbol = data.symbol;
    const price = data.price;
    const timestamp = data.timestamp;

    // Update UI efficiently
    this.updatePriceDisplay(symbol, price, timestamp);
  };

  // Use object pooling for frequent operations
  updatePriceDisplay(symbol, price, timestamp) {
    const element = this.priceElements.get(symbol);
    if (element) {
      // Direct DOM manipulation is faster than React re-renders
      // for high-frequency price updates
      element.textContent = price.toFixed(2);
      element.dataset.timestamp = timestamp;
    }
  }
}

class MessagePool {
  constructor(size) {
    this.pool = [];
    this.size = size;

    // Pre-allocate objects
    for (let i = 0; i < size; i++) {
      this.pool.push({});
    }
  }

  acquire() {
    return this.pool.pop() || {};
  }

  release(obj) {
    if (this.pool.length < this.size) {
      // Clear object properties
      Object.keys(obj).forEach(key => delete obj[key]);
      this.pool.push(obj);
    }
  }
}
```


#### 💭 Performance Debugging Experience tại Figma


Tại Figma, chúng tôi encountered performance issues với real-time collaborative editing. Initial WebSocket implementation gây memory leaks và UI lag:


**Problem Analysis:**


```javascript
// Memory leak: Event listeners không được cleaned up
function subscribeToDocument(documentId) {
  const ws = new WebSocket(`wss://api.figma.com/documents/${documentId}`);

  ws.onmessage = (event) => {
    const operation = JSON.parse(event.data);

    // Memory leak: Creating new objects for each operation
    const transformedOperation = {
      id: generateId(),
      timestamp: Date.now(),
      ...operation
    };

    // Memory leak: Event listeners accumulate
    document.addEventListener('operation', () => {
      applyOperation(transformedOperation);
    });
  };
}
```


**Solution Implementation:**


```javascript
class CollaborativeDocument {
  constructor(documentId) {
    this.documentId = documentId;
    this.operations = new CircularBuffer(10000); // Bounded memory
    this.operationPool = new ObjectPool(() => ({}), 1000);
    this.eventController = new AbortController(); // Cleanup mechanism

    this.connectWebSocket();
  }

  connectWebSocket() {
    this.ws = new WebSocket(`wss://api.figma.com/documents/${this.documentId}`);

    this.ws.onmessage = (event) => {
      this.handleOperation(event.data);
    };
  }

  handleOperation(data) {
    // Reuse objects from pool
    const operation = this.operationPool.acquire();
    Object.assign(operation, JSON.parse(data));

    // Apply operation
    this.applyOperation(operation);

    // Store in circular buffer (auto-cleanup old operations)
    this.operations.push(operation);

    // Return to pool for reuse
    this.operationPool.release(operation);
  }

  cleanup() {
    // Clean up all resources
    this.eventController.abort();
    this.ws.close();
    this.operations.clear();
    this.operationPool.clear();
  }
}
```


### 🛡️ Security Considerations


#### 1. Origin Validation và CSRF Protection


**Server-Side Origin Validation:**


```javascript
// Node.js WebSocket server example
const WebSocket = require('ws');

const wss = new WebSocket.Server({
  port: 8080,
  verifyClient: (info) => {
    // Validate origin
    const origin = info.origin;
    const allowedOrigins = [
      'https://app.example.com',
      'https://staging.example.com'
    ];

    if (!allowedOrigins.includes(origin)) {
      console.log(`Rejected connection from ${origin}`);
      return false;
    }

    // Additional security checks
    const userAgent = info.req.headers['user-agent'];
    if (isBlockedUserAgent(userAgent)) {
      return false;
    }

    return true;
  }
});

function isBlockedUserAgent(userAgent) {
  const blockedPatterns = [
    /bot/i,
    /crawler/i,
    /scanner/i
  ];

  return blockedPatterns.some(pattern => pattern.test(userAgent));
}
```


**Client-Side Security Headers:**


```javascript
class SecureWebSocket {
  constructor(url, options = {}) {
    // Ensure secure protocol in production
    if (location.protocol === 'https:' && url.startsWith('ws:')) {
      throw new Error('Cannot use insecure WebSocket on HTTPS page');
    }

    this.options = {
      maxMessageSize: 1024 * 1024, // 1MB limit
      allowedMessageTypes: ['text', 'binary'],
      validateMessages: true,
      ...options
    };

    this.ws = new WebSocket(url);
    this.setupSecurityHandlers();
  }

  setupSecurityHandlers() {
    this.ws.onmessage = (event) => {
      if (!this.validateMessage(event)) {
        console.warn('Invalid message received, ignoring');
        return;
      }

      this.handleMessage(event);
    };
  }

  validateMessage(event) {
    // Size validation
    if (event.data.length > this.options.maxMessageSize) {
      console.warn('Message exceeds size limit');
      return false;
    }

    // Type validation
    const messageType = typeof event.data;
    if (!this.options.allowedMessageTypes.includes(messageType)) {
      console.warn(`Invalid message type: ${messageType}`);
      return false;
    }

    // Content validation for JSON messages
    if (this.options.validateMessages && messageType === 'string') {
      try {
        const parsed = JSON.parse(event.data);
        return this.validateMessageStructure(parsed);
      } catch (error) {
        console.warn('Invalid JSON message');
        return false;
      }
    }

    return true;
  }

  validateMessageStructure(message) {
    // Implement schema validation
    const requiredFields = ['type', 'timestamp'];

    for (const field of requiredFields) {
      if (!(field in message)) {
        console.warn(`Missing required field: ${field}`);
        return false;
      }
    }

    // Validate timestamp recency (prevent replay attacks)
    const messageAge = Date.now() - message.timestamp;
    if (messageAge > 300000) { // 5 minutes
      console.warn('Message too old, possible replay attack');
      return false;
    }

    return true;
  }

  send(data) {
    // Add security metadata
    const secureMessage = {
      ...data,
      timestamp: Date.now(),
      nonce: this.generateNonce()
    };

    this.ws.send(JSON.stringify(secureMessage));
  }

  generateNonce() {
    return crypto.getRandomValues(new Uint32Array(1))[0].toString(16);
  }
}
```


#### 2. Rate Limiting và DDoS Protection


**Client-Side Rate Limiting:**


```javascript
class RateLimitedWebSocket {
  constructor(url, limits = {}) {
    this.limits = {
      messagesPerSecond: 10,
      burstLimit: 50,
      connectionAttemptsPerMinute: 5,
      ...limits
    };

    this.messageTokens = this.limits.burstLimit;
    this.connectionAttempts = new CircularBuffer(100);
    this.lastTokenRefill = Date.now();

    this.connect(url);
  }

  connect(url) {
    // Check connection rate limit
    if (!this.canAttemptConnection()) {
      throw new Error('Connection rate limit exceeded');
    }

    this.recordConnectionAttempt();
    this.ws = new WebSocket(url);
    this.setupRateLimitedHandlers();
  }

  canAttemptConnection() {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Count recent connection attempts
    const recentAttempts = this.connectionAttempts.filter(
      timestamp => timestamp > oneMinuteAgo
    );

    return recentAttempts.length < this.limits.connectionAttemptsPerMinute;
  }

  recordConnectionAttempt() {
    this.connectionAttempts.push(Date.now());
  }

  send(data) {
    if (!this.hasMessageTokens()) {
      throw new Error('Message rate limit exceeded');
    }

    this.consumeMessageToken();
    this.ws.send(data);
  }

  hasMessageTokens() {
    this.refillTokens();
    return this.messageTokens > 0;
  }

  consumeMessageToken() {
    this.messageTokens = Math.max(0, this.messageTokens - 1);
  }

  refillTokens() {
    const now = Date.now();
    const timePassed = now - this.lastTokenRefill;
    const tokensToAdd = (timePassed / 1000) * this.limits.messagesPerSecond;

    this.messageTokens = Math.min(
      this.limits.burstLimit,
      this.messageTokens + tokensToAdd
    );
    this.lastTokenRefill = now;
  }
}
```


## 📖 PHẦN III: PRINCIPAL LEVEL - ENTERPRISE ARCHITECTURE & SYSTEM DESIGN


### 🏛️ Enterprise WebSocket Architecture


#### 1. Multi-Tenant WebSocket Infrastructure


**Tenant Isolation Strategy:**


```javascript
class MultiTenantWebSocketManager {
  constructor(options = {}) {
    this.options = {
      maxConnectionsPerTenant: 1000,
      tenantIsolationLevel: 'strict', // 'strict' | 'soft'
      resourceQuotas: {
        bandwidthPerTenant: 10 * 1024 * 1024, // 10MB/s
        messagesPerSecond: 1000,
        storagePerTenant: 100 * 1024 * 1024 // 100MB
      },
      ...options
    };

    this.tenants = new Map(); // tenantId -> TenantContext
    this.globalMetrics = new MetricsCollector();
    this.resourceMonitor = new ResourceMonitor();

    this.setupTenantManagement();
  }

  setupTenantManagement() {
    // Auto-scaling based on tenant load
    setInterval(() => {
      this.optimizeTenantResources();
    }, 30000); // Every 30 seconds

    // Cleanup inactive tenants
    setInterval(() => {
      this.cleanupInactiveTenants();
    }, 300000); // Every 5 minutes
  }

  async createTenantConnection(tenantId, userId, connectionOptions = {}) {
    let tenant = this.tenants.get(tenantId);

    if (!tenant) {
      tenant = await this.initializeTenant(tenantId);
    }

    // Enforce connection limits
    if (tenant.getConnectionCount() >= this.options.maxConnectionsPerTenant) {
      throw new Error(`Connection limit exceeded for tenant ${tenantId}`);
    }

    // Check resource quotas
    if (!tenant.hasAvailableResources()) {
      throw new Error(`Resource quota exceeded for tenant ${tenantId}`);
    }

    return tenant.createConnection(userId, connectionOptions);
  }

  async initializeTenant(tenantId) {
    const tenant = new TenantContext(tenantId, {
      ...this.options.resourceQuotas,
      isolationLevel: this.options.tenantIsolationLevel
    });

    // Load tenant configuration
    const config = await this.loadTenantConfig(tenantId);
    tenant.applyConfiguration(config);

    // Setup tenant-specific monitoring
    tenant.setupMetrics(this.globalMetrics);

    this.tenants.set(tenantId, tenant);
    return tenant;
  }

  optimizeTenantResources() {
    for (const [tenantId, tenant] of this.tenants) {
      const metrics = tenant.getMetrics();

      // Auto-scale based on usage patterns
      if (metrics.avgConnectionsLast5Min > metrics.allocatedConnections * 0.8) {
        this.requestResourceIncrease(tenantId, 'connections');
      }

      if (metrics.avgBandwidthLast5Min > metrics.allocatedBandwidth * 0.8) {
        this.requestResourceIncrease(tenantId, 'bandwidth');
      }

      // Scale down underutilized resources
      if (metrics.avgConnectionsLast15Min < metrics.allocatedConnections * 0.3) {
        this.requestResourceDecrease(tenantId, 'connections');
      }
    }
  }

  requestResourceIncrease(tenantId, resourceType) {
    // Implement auto-scaling logic
    console.log(`Requesting ${resourceType} increase for tenant ${tenantId}`);
  }

  cleanupInactiveTenants() {
    const inactiveThreshold = 3600000; // 1 hour
    const now = Date.now();

    for (const [tenantId, tenant] of this.tenants) {
      if (now - tenant.lastActivity > inactiveThreshold && tenant.getConnectionCount() === 0) {
        tenant.cleanup();
        this.tenants.delete(tenantId);
        console.log(`Cleaned up inactive tenant: ${tenantId}`);
      }
    }
  }
}

class TenantContext {
  constructor(tenantId, quotas) {
    this.tenantId = tenantId;
    this.quotas = quotas;
    this.connections = new Map(); // userId -> WebSocket
    this.messageRouter = new TenantMessageRouter(tenantId);
    this.resourceTracker = new TenantResourceTracker(quotas);
    this.lastActivity = Date.now();

    this.setupTenantIsolation();
  }

  setupTenantIsolation() {
    // Implement tenant-specific message isolation
    this.messageRouter.setIsolationLevel(this.quotas.isolationLevel);

    // Setup resource monitoring
    this.resourceTracker.onQuotaExceeded((resourceType) => {
      this.handleQuotaExceeded(resourceType);
    });
  }

  createConnection(userId, options) {
    const ws = new TenantWebSocket(this.tenantId, userId, {
      messageRouter: this.messageRouter,
      resourceTracker: this.resourceTracker,
      ...options
    });

    this.connections.set(userId, ws);
    this.lastActivity = Date.now();

    // Setup connection monitoring
    ws.on('message', (data) => {
      this.resourceTracker.recordMessage(data.length);
      this.lastActivity = Date.now();
    });

    ws.on('close', () => {
      this.connections.delete(userId);
    });

    return ws;
  }

  getConnectionCount() {
    return this.connections.size;
  }

  hasAvailableResources() {
    return !this.resourceTracker.isAnyQuotaExceeded();
  }

  handleQuotaExceeded(resourceType) {
    console.warn(`Quota exceeded for tenant ${this.tenantId}: ${resourceType}`);

    // Implement throttling or connection limiting
    switch (resourceType) {
      case 'bandwidth':
        this.enableBandwidthThrottling();
        break;
      case 'messages':
        this.enableMessageRatelimiting();
        break;
      case 'storage':
        this.triggerStorageCleanup();
        break;
    }
  }

  enableBandwidthThrottling() {
    for (const ws of this.connections.values()) {
      ws.enableThrottling({ bandwidthLimit: this.quotas.bandwidthPerTenant * 0.8 });
    }
  }

  cleanup() {
    for (const ws of this.connections.values()) {
      ws.close(1001, 'Tenant cleanup');
    }
    this.connections.clear();
    this.messageRouter.cleanup();
    this.resourceTracker.cleanup();
  }
}
```


#### 2. Global Load Balancing và Failover


**Geographic Load Distribution:**


```javascript
class GlobalWebSocketLoadBalancer {
  constructor(options = {}) {
    this.options = {
      regions: ['us-east', 'us-west', 'eu-west', 'ap-southeast'],
      loadBalancingStrategy: 'latency-based', // 'round-robin' | 'latency-based' | 'capacity-based'
      healthCheckInterval: 30000,
      failoverThreshold: 3,
      ...options
    };

    this.regionEndpoints = new Map();
    this.regionHealth = new Map();
    this.connectionCounts = new Map();
    this.latencyMetrics = new Map();

    this.initializeRegions();
    this.startHealthChecks();
  }

  initializeRegions() {
    this.options.regions.forEach(region => {
      this.regionEndpoints.set(region, {
        primary: `wss://${region}.api.example.com/ws`,
        backup: `wss://${region}-backup.api.example.com/ws`
      });

      this.regionHealth.set(region, {
        status: 'unknown',
        latency: Infinity,
        capacity: 0,
        lastCheck: 0,
        failureCount: 0
      });

      this.connectionCounts.set(region, 0);
    });
  }

  async selectOptimalRegion(clientLocation) {
    const healthyRegions = Array.from(this.regionHealth.entries())
      .filter(([region, health]) => health.status === 'healthy')
      .map(([region]) => region);

    if (healthyRegions.length === 0) {
      throw new Error('No healthy regions available');
    }

    switch (this.options.loadBalancingStrategy) {
      case 'latency-based':
        return this.selectByLatency(healthyRegions, clientLocation);
      case 'capacity-based':
        return this.selectByCapacity(healthyRegions);
      case 'round-robin':
        return this.selectRoundRobin(healthyRegions);
      default:
        return healthyRegions[0];
    }
  }

  selectByLatency(regions, clientLocation) {
    // Calculate estimated latency based on geographic distance
    let bestRegion = regions[0];
    let bestLatency = this.estimateLatency(bestRegion, clientLocation);

    for (const region of regions.slice(1)) {
      const latency = this.estimateLatency(region, clientLocation);
      if (latency < bestLatency) {
        bestLatency = latency;
        bestRegion = region;
      }
    }

    return bestRegion;
  }

  selectByCapacity(regions) {
    // Select region with lowest current load
    let bestRegion = regions[0];
    let bestLoad = this.calculateRegionLoad(bestRegion);

    for (const region of regions.slice(1)) {
      const load = this.calculateRegionLoad(region);
      if (load < bestLoad) {
        bestLoad = load;
        bestRegion = region;
      }
    }

    return bestRegion;
  }

  calculateRegionLoad(region) {
    const connections = this.connectionCounts.get(region);
    const health = this.regionHealth.get(region);
    return connections / health.capacity;
  }

  estimateLatency(region, clientLocation) {
    // Implement geographic latency estimation
    const regionCoords = this.getRegionCoordinates(region);
    const distance = this.calculateDistance(clientLocation, regionCoords);

    // Base latency estimation: ~1ms per 100km + regional latency
    const baseLatency = distance / 100;
    const regionalLatency = this.latencyMetrics.get(region)?.average || 50;

    return baseLatency + regionalLatency;
  }

  async createConnectionToRegion(region, options = {}) {
    const endpoints = this.regionEndpoints.get(region);
    let websocket;

    try {
      // Try primary endpoint first
      websocket = await this.createWebSocket(endpoints.primary, options);
    } catch (error) {
      console.warn(`Primary endpoint failed for ${region}, trying backup`);

      try {
        websocket = await this.createWebSocket(endpoints.backup, options);
      } catch (backupError) {
        // Mark region as unhealthy
        this.markRegionUnhealthy(region);
        throw new Error(`Both endpoints failed for region ${region}`);
      }
    }

    // Track connection
    this.connectionCounts.set(region, this.connectionCounts.get(region) + 1);

    // Setup connection monitoring
    websocket.addEventListener('close', () => {
      this.connectionCounts.set(region, this.connectionCounts.get(region) - 1);
    });

    return websocket;
  }

  async createWebSocket(url, options) {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(url);
      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error('Connection timeout'));
      }, 10000);

      ws.addEventListener('open', () => {
        clearTimeout(timeout);
        resolve(ws);
      });

      ws.addEventListener('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  startHealthChecks() {
    setInterval(() => {
      this.checkAllRegionHealth();
    }, this.options.healthCheckInterval);
  }

  async checkAllRegionHealth() {
    const healthChecks = this.options.regions.map(region =>
      this.checkRegionHealth(region)
    );

    await Promise.allSettled(healthChecks);
  }

  async checkRegionHealth(region) {
    const startTime = Date.now();
    const endpoints = this.regionEndpoints.get(region);

    try {
      // Simple health check via HTTP
      const response = await fetch(`${endpoints.primary.replace('wss://', 'https://')}/health`, {
        method: 'GET',
        timeout: 5000
      });

      if (response.ok) {
        const latency = Date.now() - startTime;
        this.updateRegionHealth(region, 'healthy', latency);
      } else {
        this.updateRegionHealth(region, 'unhealthy', Infinity);
      }
    } catch (error) {
      this.updateRegionHealth(region, 'unhealthy', Infinity);
    }
  }

  updateRegionHealth(region, status, latency) {
    const health = this.regionHealth.get(region);
    const wasHealthy = health.status === 'healthy';

    health.status = status;
    health.latency = latency;
    health.lastCheck = Date.now();

    if (status === 'healthy') {
      health.failureCount = 0;
      if (!wasHealthy) {
        console.log(`Region ${region} is now healthy`);
      }
    } else {
      health.failureCount++;
      if (wasHealthy) {
        console.warn(`Region ${region} is now unhealthy`);
      }
    }
  }

  markRegionUnhealthy(region) {
    const health = this.regionHealth.get(region);
    health.status = 'unhealthy';
    health.failureCount++;
  }
}
```


#### 💭 Principal's Perspective: Global Architecture tại Webflow


Tại Webflow, chúng tôi faced challenges với global WebSocket distribution cho real-time collaborative editing. Users từ different continents cần seamless experience:


**Challenge:** Editor collaboration between user ở New York và designer ở Tokyo
**Solution:** Operational Transform + Regional Sync


```javascript
class GlobalCollaborationManager {
  constructor() {
    this.regionalSyncNodes = new Map([
      ['americas', new RegionalSyncNode('us-east')],
      ['europe', new RegionalSyncNode('eu-west')],
      ['asia', new RegionalSyncNode('ap-southeast')]
    ]);

    this.operationQueue = new OperationalTransform();
    this.conflictResolver = new ConflictResolver();
  }

  async synchronizeGlobalOperation(operation, sourceRegion) {
    // Transform operation for different regions
    const transformedOps = await this.operationQueue.transform(operation);

    // Broadcast to all regions except source
    const syncPromises = [];
    for (const [region, syncNode] of this.regionalSyncNodes) {
      if (region !== sourceRegion) {
        syncPromises.push(syncNode.applyOperation(transformedOps[region]));
      }
    }

    // Wait for global consistency
    await Promise.all(syncPromises);
  }
}
```


### 🔄 Event-Driven Architecture với WebSocket


#### 1. Message Bus Integration


**WebSocket Event Bus Pattern:**


```javascript
class WebSocketEventBus {
  constructor(options = {}) {
    this.options = {
      persistence: true,
      eventStore: 'redis', // 'redis' | 'memory' | 'database'
      replayCapability: true,
      deadLetterQueue: true,
      maxRetries: 3,
      ...options
    };

    this.subscriptions = new Map(); // eventType -> Set<handlers>
    this.persistentStorage = this.initializeStorage();
    this.deadLetterQueue = new DeadLetterQueue();
    this.eventStore = new EventStore(this.options.eventStore);

    this.setupEventProcessing();
  }

  subscribe(eventType, handler, options = {}) {
    if (!this.subscriptions.has(eventType)) {
      this.subscriptions.set(eventType, new Set());
    }

    const subscription = {
      handler,
      options: {
        persistent: true,
        retryPolicy: 'exponential-backoff',
        maxRetries: this.options.maxRetries,
        ...options
      },
      id: this.generateSubscriptionId()
    };

    this.subscriptions.get(eventType).add(subscription);

    // If replay is requested, send historical events
    if (options.replay) {
      this.replayEvents(eventType, subscription);
    }

    return () => this.unsubscribe(eventType, subscription);
  }

  async publish(eventType, payload, metadata = {}) {
    const event = {
      id: this.generateEventId(),
      type: eventType,
      payload,
      metadata: {
        timestamp: Date.now(),
        source: 'websocket-bus',
        ...metadata
      },
      version: 1
    };

    // Persist event if configured
    if (this.options.persistence) {
      await this.eventStore.store(event);
    }

    // Distribute to subscribers
    await this.distributeEvent(event);

    return event.id;
  }

  async distributeEvent(event) {
    const subscribers = this.subscriptions.get(event.type) || new Set();

    const deliveryPromises = Array.from(subscribers).map(subscription =>
      this.deliverToSubscriber(event, subscription)
    );

    await Promise.allSettled(deliveryPromises);
  }

  async deliverToSubscriber(event, subscription) {
    const { handler, options } = subscription;
    let attempts = 0;

    while (attempts < options.maxRetries) {
      try {
        await handler(event);
        return; // Success
      } catch (error) {
        attempts++;
        console.error(`Event delivery failed (attempt ${attempts}):`, error);

        if (attempts < options.maxRetries) {
          await this.waitForRetry(attempts, options.retryPolicy);
        } else {
          // Send to dead letter queue
          await this.deadLetterQueue.add({
            event,
            subscription: subscription.id,
            error: error.message,
            attempts
          });
        }
      }
    }
  }

  async waitForRetry(attempt, policy) {
    let delay;

    switch (policy) {
      case 'exponential-backoff':
        delay = Math.min(1000 * Math.pow(2, attempt - 1), 30000);
        break;
      case 'linear':
        delay = 1000 * attempt;
        break;
      case 'fixed':
        delay = 5000;
        break;
      default:
        delay = 1000;
    }

    return new Promise(resolve => setTimeout(resolve, delay));
  }

  async replayEvents(eventType, subscription) {
    const { since } = subscription.options;
    const historicalEvents = await this.eventStore.getEvents({
      type: eventType,
      since: since || Date.now() - 86400000 // Default: last 24 hours
    });

    for (const event of historicalEvents) {
      try {
        await subscription.handler(event);
      } catch (error) {
        console.error('Replay event delivery failed:', error);
      }
    }
  }

  // WebSocket integration
  attachWebSocket(websocket, options = {}) {
    const socketSubscriptions = new Set();

    // Handle incoming WebSocket messages as events
    websocket.addEventListener('message', (messageEvent) => {
      try {
        const data = JSON.parse(messageEvent.data);
        if (data.type && data.payload) {
          this.publish(data.type, data.payload, {
            source: 'websocket',
            socketId: websocket.id
          });
        }
      } catch (error) {
        console.error('WebSocket message parsing error:', error);
      }
    });

    // Subscribe to events and forward to WebSocket
    const subscribeToEvent = (eventType) => {
      const unsubscribe = this.subscribe(eventType, (event) => {
        if (websocket.readyState === WebSocket.OPEN) {
          websocket.send(JSON.stringify({
            type: 'event',
            eventType: event.type,
            payload: event.payload,
            metadata: event.metadata
          }));
        }
      });

      socketSubscriptions.add(unsubscribe);
      return unsubscribe;
    };

    // Cleanup on WebSocket close
    websocket.addEventListener('close', () => {
      socketSubscriptions.forEach(unsubscribe => unsubscribe());
      socketSubscriptions.clear();
    });

    return { subscribeToEvent };
  }
}

class EventStore {
  constructor(type) {
    this.type = type;
    this.storage = this.initializeStorage(type);
  }

  initializeStorage(type) {
    switch (type) {
      case 'redis':
        return new RedisEventStore();
      case 'database':
        return new DatabaseEventStore();
      default:
        return new MemoryEventStore();
    }
  }

  async store(event) {
    return this.storage.store(event);
  }

  async getEvents(criteria) {
    return this.storage.getEvents(criteria);
  }
}

class MemoryEventStore {
  constructor() {
    this.events = new Map(); // eventType -> Array<events>
  }

  async store(event) {
    if (!this.events.has(event.type)) {
      this.events.set(event.type, []);
    }

    this.events.get(event.type).push(event);

    // Cleanup old events (keep last 10000 per type)
    const eventList = this.events.get(event.type);
    if (eventList.length > 10000) {
      eventList.splice(0, eventList.length - 10000);
    }
  }

  async getEvents(criteria) {
    const { type, since } = criteria;
    const events = this.events.get(type) || [];

    if (since) {
      return events.filter(event => event.metadata.timestamp >= since);
    }

    return events;
  }
}
```


#### 2. CQRS Pattern với WebSocket


**Command Query Responsibility Segregation:**


```javascript
class WebSocketCQRSHandler {
  constructor(options = {}) {
    this.commandHandlers = new Map();
    this.queryHandlers = new Map();
    this.eventProjectors = new Map();
    this.readModels = new Map();

    this.eventBus = new WebSocketEventBus(options);
    this.commandBus = new CommandBus();
    this.queryBus = new QueryBus();

    this.setupCQRSIntegration();
  }

  // Command side (Write operations)
  registerCommandHandler(commandType, handler) {
    this.commandHandlers.set(commandType, handler);
  }

  async handleCommand(websocket, message) {
    const { commandType, payload, metadata } = message;

    try {
      // Validate command
      await this.validateCommand(commandType, payload);

      // Execute command
      const handler = this.commandHandlers.get(commandType);
      if (!handler) {
        throw new Error(`No handler for command: ${commandType}`);
      }

      const events = await handler(payload, metadata);

      // Publish resulting events
      for (const event of events) {
        await this.eventBus.publish(event.type, event.payload, {
          ...event.metadata,
          commandId: message.id,
          userId: metadata.userId
        });
      }

      // Send acknowledgment
      websocket.send(JSON.stringify({
        type: 'command-result',
        commandId: message.id,
        success: true,
        events: events.map(e => e.id)
      }));

    } catch (error) {
      // Send error response
      websocket.send(JSON.stringify({
        type: 'command-result',
        commandId: message.id,
        success: false,
        error: error.message
      }));
    }
  }

  // Query side (Read operations)
  registerQueryHandler(queryType, handler) {
    this.queryHandlers.set(queryType, handler);
  }

  async handleQuery(websocket, message) {
    const { queryType, parameters, metadata } = message;

    try {
      const handler = this.queryHandlers.get(queryType);
      if (!handler) {
        throw new Error(`No handler for query: ${queryType}`);
      }

      const result = await handler(parameters, metadata);

      websocket.send(JSON.stringify({
        type: 'query-result',
        queryId: message.id,
        success: true,
        data: result
      }));

    } catch (error) {
      websocket.send(JSON.stringify({
        type: 'query-result',
        queryId: message.id,
        success: false,
        error: error.message
      }));
    }
  }

  // Event projection (Update read models)
  registerEventProjector(eventType, projector) {
    this.eventProjectors.set(eventType, projector);

    // Subscribe to events
    this.eventBus.subscribe(eventType, async (event) => {
      try {
        await projector(event);
        await this.notifyReadModelUpdate(eventType, event);
      } catch (error) {
        console.error(`Projection error for ${eventType}:`, error);
      }
    });
  }

  async notifyReadModelUpdate(eventType, event) {
    // Notify connected clients about read model updates
    const updateMessage = {
      type: 'read-model-update',
      eventType,
      eventId: event.id,
      timestamp: event.metadata.timestamp
    };

    // Broadcast to interested clients
    await this.broadcastToSubscribers(eventType, updateMessage);
  }

  setupCQRSIntegration() {
    // Handle different message types from WebSocket
    this.messageRouter = (websocket, message) => {
      switch (message.type) {
        case 'command':
          return this.handleCommand(websocket, message);
        case 'query':
          return this.handleQuery(websocket, message);
        case 'subscribe':
          return this.handleSubscription(websocket, message);
        case 'unsubscribe':
          return this.handleUnsubscription(websocket, message);
        default:
          throw new Error(`Unknown message type: ${message.type}`);
      }
    };
  }

  // Real-time subscriptions
  handleSubscription(websocket, message) {
    const { subscriptionType, parameters } = message;

    // Subscribe to specific events or read model changes
    const unsubscribe = this.subscribeToUpdates(
      subscriptionType,
      parameters,
      (update) => {
        if (websocket.readyState === WebSocket.OPEN) {
          websocket.send(JSON.stringify(update));
        }
      }
    );

    // Store unsubscribe function for cleanup
    if (!websocket.subscriptions) {
      websocket.subscriptions = new Map();
    }
    websocket.subscriptions.set(message.subscriptionId, unsubscribe);

    // Send subscription confirmation
    websocket.send(JSON.stringify({
      type: 'subscription-confirmed',
      subscriptionId: message.subscriptionId
    }));
  }

  subscribeToUpdates(subscriptionType, parameters, callback) {
    switch (subscriptionType) {
      case 'user-notifications':
        return this.subscribeToUserNotifications(parameters.userId, callback);
      case 'document-changes':
        return this.subscribeToDocumentChanges(parameters.documentId, callback);
      case 'system-events':
        return this.subscribeToSystemEvents(callback);
      default:
        throw new Error(`Unknown subscription type: ${subscriptionType}`);
    }
  }
}

// Example: Trading platform CQRS implementation
class TradingPlatformCQRS extends WebSocketCQRSHandler {
  constructor() {
    super();
    this.setupTradingHandlers();
  }

  setupTradingHandlers() {
    // Commands
    this.registerCommandHandler('place-order', this.handlePlaceOrder.bind(this));
    this.registerCommandHandler('cancel-order', this.handleCancelOrder.bind(this));
    this.registerCommandHandler('update-order', this.handleUpdateOrder.bind(this));

    // Queries
    this.registerQueryHandler('get-portfolio', this.handleGetPortfolio.bind(this));
    this.registerQueryHandler('get-order-book', this.handleGetOrderBook.bind(this));
    this.registerQueryHandler('get-trade-history', this.handleGetTradeHistory.bind(this));

    // Event projectors
    this.registerEventProjector('order-placed', this.projectOrderPlaced.bind(this));
    this.registerEventProjector('order-filled', this.projectOrderFilled.bind(this));
    this.registerEventProjector('price-updated', this.projectPriceUpdated.bind(this));
  }

  async handlePlaceOrder(payload, metadata) {
    const { symbol, quantity, price, type } = payload;
    const { userId } = metadata;

    // Business logic validation
    await this.validateOrderPlacement(userId, symbol, quantity, price);

    // Generate events
    const orderId = this.generateOrderId();
    const events = [
      {
        type: 'order-placed',
        payload: { orderId, userId, symbol, quantity, price, type },
        metadata: { timestamp: Date.now() }
      }
    ];

    // Check for immediate matching
    const matches = await this.findOrderMatches(symbol, price, quantity, type);
    if (matches.length > 0) {
      events.push({
        type: 'order-matched',
        payload: { orderId, matches },
        metadata: { timestamp: Date.now() }
      });
    }

    return events;
  }

  async projectOrderPlaced(event) {
    const { orderId, userId, symbol, quantity, price, type } = event.payload;

    // Update order book read model
    await this.updateOrderBookReadModel(symbol, {
      orderId,
      userId,
      quantity,
      price,
      type,
      status: 'open',
      timestamp: event.metadata.timestamp
    });

    // Update user portfolio read model
    await this.updatePortfolioReadModel(userId, {
      pendingOrders: { [orderId]: { symbol, quantity, price, type } }
    });
  }

  async updateOrderBookReadModel(symbol, orderData) {
    // Update cached order book
    const orderBook = await this.getOrderBook(symbol);
    orderBook.addOrder(orderData);

    // Notify subscribers
    await this.notifyOrderBookUpdate(symbol, orderData);
  }

  async notifyOrderBookUpdate(symbol, orderData) {
    const updateMessage = {
      type: 'order-book-update',
      symbol,
      order: orderData,
      timestamp: Date.now()
    };

    // Send to all clients subscribed to this symbol
    await this.broadcastToSymbolSubscribers(symbol, updateMessage);
  }
}
```


### 📊 Monitoring và Observability


#### 1. WebSocket Metrics Collection


**Comprehensive Metrics System:**


```javascript
class WebSocketMetricsCollector {
  constructor(options = {}) {
    this.options = {
      metricsInterval: 5000, // 5 seconds
      histogramBuckets: [1, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000],
      enableDetailedLogging: false,
      ...options
    };

    this.metrics = {
      connections: {
        total: 0,
        active: 0,
        failed: 0,
        byRegion: new Map(),
        byTenant: new Map()
      },
      messages: {
        sent: 0,
        received: 0,
        bytesTransferred: 0,
        latencyHistogram: new Histogram(this.options.histogramBuckets),
        errorRate: new ErrorRateTracker(),
        throughput: new ThroughputTracker()
      },
      performance: {
        cpuUsage: new CPUTracker(),
        memoryUsage: new MemoryTracker(),
        gcPressure: new GCTracker(),
        eventLoopLag: new EventLoopLagTracker()
      },
      business: {
        activeUsers: new Set(),
        revenue: new RevenueTracker(),
        featureUsage: new Map()
      }
    };

    this.alerts = new AlertManager();
    this.setupMetricsCollection();
  }

  recordConnection(event, metadata = {}) {
    const { type, region, tenantId, userId } = metadata;

    switch (event) {
      case 'opened':
        this.metrics.connections.total++;
        this.metrics.connections.active++;
        this.incrementRegionCount(region);
        this.incrementTenantCount(tenantId);
        this.metrics.business.activeUsers.add(userId);
        break;

      case 'closed':
        this.metrics.connections.active--;
        this.decrementRegionCount(region);
        this.decrementTenantCount(tenantId);
        break;

      case 'failed':
        this.metrics.connections.failed++;
        this.alerts.checkConnectionFailureRate();
        break;
    }

    this.emitMetricUpdate('connection', { event, metadata });
  }

  recordMessage(direction, size, latency = null, metadata = {}) {
    const { messageType, userId, tenantId } = metadata;

    if (direction === 'sent') {
      this.metrics.messages.sent++;
    } else {
      this.metrics.messages.received++;
    }

    this.metrics.messages.bytesTransferred += size;
    this.metrics.messages.throughput.record(size);

    if (latency !== null) {
      this.metrics.messages.latencyHistogram.record(latency);

      // Alert on high latency
      if (latency > 1000) {
        this.alerts.highLatencyAlert(latency, metadata);
      }
    }

    // Track feature usage
    if (messageType) {
      this.recordFeatureUsage(messageType, userId);
    }

    this.emitMetricUpdate('message', { direction, size, latency, metadata });
  }

  recordError(error, context = {}) {
    this.metrics.messages.errorRate.record(error);

    // Categorize errors
    const errorCategory = this.categorizeError(error);
    this.alerts.errorAlert(errorCategory, error, context);

    this.emitMetricUpdate('error', { error, context, category: errorCategory });
  }

  recordFeatureUsage(feature, userId) {
    if (!this.metrics.business.featureUsage.has(feature)) {
      this.metrics.business.featureUsage.set(feature, new Set());
    }

    this.metrics.business.featureUsage.get(feature).add(userId);
  }

  recordRevenue(amount, currency, metadata = {}) {
    this.metrics.business.revenue.record(amount, currency, metadata);
  }

  setupMetricsCollection() {
    // Periodic metrics calculation
    setInterval(() => {
      this.calculateDerivedMetrics();
      this.publishMetrics();
      this.checkAlerts();
    }, this.options.metricsInterval);

    // System resource monitoring
    setInterval(() => {
      this.collectSystemMetrics();
    }, 1000);
  }

  calculateDerivedMetrics() {
    const now = Date.now();

    // Calculate rates
    this.metrics.messages.sendRate = this.metrics.messages.throughput.getRate('sent');
    this.metrics.messages.receiveRate = this.metrics.messages.throughput.getRate('received');
    this.metrics.messages.errorRate = this.metrics.messages.errorRate.getRate();

    // Calculate percentiles
    this.metrics.messages.latencyP50 = this.metrics.messages.latencyHistogram.percentile(50);
    this.metrics.messages.latencyP95 = this.metrics.messages.latencyHistogram.percentile(95);
    this.metrics.messages.latencyP99 = this.metrics.messages.latencyHistogram.percentile(99);

    // Business metrics
    this.metrics.business.dailyActiveUsers = this.metrics.business.activeUsers.size;
    this.metrics.business.featureAdoption = this.calculateFeatureAdoption();
  }

  calculateFeatureAdoption() {
    const adoption = {};
    const totalUsers = this.metrics.business.activeUsers.size;

    for (const [feature, users] of this.metrics.business.featureUsage) {
      adoption[feature] = {
        users: users.size,
        adoptionRate: totalUsers > 0 ? users.size / totalUsers : 0
      };
    }

    return adoption;
  }

  collectSystemMetrics() {
    this.metrics.performance.cpuUsage.record();
    this.metrics.performance.memoryUsage.record();
    this.metrics.performance.eventLoopLag.record();
  }

  publishMetrics() {
    const snapshot = this.getMetricsSnapshot();

    // Send to monitoring systems (Prometheus, DataDog, etc.)
    this.sendToPrometheus(snapshot);
    this.sendToDataDog(snapshot);
    this.sendToCustomDashboard(snapshot);
  }

  getMetricsSnapshot() {
    return {
      timestamp: Date.now(),
      connections: {
        total: this.metrics.connections.total,
        active: this.metrics.connections.active,
        failed: this.metrics.connections.failed,
        byRegion: Object.fromEntries(this.metrics.connections.byRegion),
        byTenant: Object.fromEntries(this.metrics.connections.byTenant)
      },
      messages: {
        sent: this.metrics.messages.sent,
        received: this.metrics.messages.received,
        bytesTransferred: this.metrics.messages.bytesTransferred,
        sendRate: this.metrics.messages.sendRate,
        receiveRate: this.metrics.messages.receiveRate,
        errorRate: this.metrics.messages.errorRate,
        latency: {
          p50: this.metrics.messages.latencyP50,
          p95: this.metrics.messages.latencyP95,
          p99: this.metrics.messages.latencyP99
        }
      },
      performance: {
        cpuUsage: this.metrics.performance.cpuUsage.getCurrent(),
        memoryUsage: this.metrics.performance.memoryUsage.getCurrent(),
        eventLoopLag: this.metrics.performance.eventLoopLag.getCurrent()
      },
      business: {
        dailyActiveUsers: this.metrics.business.dailyActiveUsers,
        featureAdoption: this.metrics.business.featureAdoption,
        revenue: this.metrics.business.revenue.getSnapshot()
      }
    };
  }

  checkAlerts() {
    const snapshot = this.getMetricsSnapshot();

    // Connection alerts
    if (snapshot.connections.active > 90000) {
      this.alerts.trigger('high-connection-count', snapshot.connections.active);
    }

    // Latency alerts
    if (snapshot.messages.latency.p95 > 500) {
      this.alerts.trigger('high-latency', snapshot.messages.latency.p95);
    }

    // Error rate alerts
    if (snapshot.messages.errorRate > 0.05) { // 5%
      this.alerts.trigger('high-error-rate', snapshot.messages.errorRate);
    }

    // Business alerts
    if (snapshot.business.dailyActiveUsers < 1000) {
      this.alerts.trigger('low-user-activity', snapshot.business.dailyActiveUsers);
    }
  }

  // Utility classes
  categorizeError(error) {
    const message = error.message.toLowerCase();

    if (message.includes('connection') || message.includes('network')) {
      return 'network';
    } else if (message.includes('timeout')) {
      return 'timeout';
    } else if (message.includes('auth') || message.includes('permission')) {
      return 'authentication';
    } else if (message.includes('rate limit')) {
      return 'rate-limiting';
    } else {
      return 'application';
    }
  }

  emitMetricUpdate(type, data) {
    if (this.options.enableDetailedLogging) {
      console.log(`Metric update [${type}]:`, data);
    }

    // Emit to real-time monitoring dashboard
    this.emit('metric-update', { type, data, timestamp: Date.now() });
  }
}

class Histogram {
  constructor(buckets) {
    this.buckets = buckets.sort((a, b) => a - b);
    this.counts = new Array(buckets.length).fill(0);
    this.sum = 0;
    this.count = 0;
  }

  record(value) {
    this.sum += value;
    this.count++;

    // Find appropriate bucket
    for (let i = 0; i < this.buckets.length; i++) {
      if (value <= this.buckets[i]) {
        this.counts[i]++;
        break;
      }
    }
  }

  percentile(p) {
    if (this.count === 0) return 0;

    const targetCount = Math.ceil((p / 100) * this.count);
    let runningCount = 0;

    for (let i = 0; i < this.counts.length; i++) {
      runningCount += this.counts[i];
      if (runningCount >= targetCount) {
        return this.buckets[i];
      }
    }

    return this.buckets[this.buckets.length - 1];
  }

  average() {
    return this.count > 0 ? this.sum / this.count : 0;
  }
}

class AlertManager {
  constructor() {
    this.alerts = new Map();
    this.alertHandlers = new Map();
    this.cooldowns = new Map();
  }

  registerHandler(alertType, handler) {
    if (!this.alertHandlers.has(alertType)) {
      this.alertHandlers.set(alertType, new Set());
    }
    this.alertHandlers.get(alertType).add(handler);
  }

  trigger(alertType, value, metadata = {}) {
    const alertKey = `${alertType}-${JSON.stringify(metadata)}`;
    const now = Date.now();

    // Check cooldown (prevent spam)
    if (this.cooldowns.has(alertKey)) {
      const lastAlert = this.cooldowns.get(alertKey);
      if (now - lastAlert < 300000) { // 5 minute cooldown
        return;
      }
    }

    this.cooldowns.set(alertKey, now);

    const alert = {
      type: alertType,
      value,
      metadata,
      timestamp: now,
      severity: this.calculateSeverity(alertType, value)
    };

    // Execute handlers
    const handlers = this.alertHandlers.get(alertType) || new Set();
    handlers.forEach(handler => {
      try {
        handler(alert);
      } catch (error) {
        console.error('Alert handler error:', error);
      }
    });

    // Log alert
    console.warn(`ALERT [${alertType}]:`, alert);
  }

  calculateSeverity(alertType, value) {
    // Define severity thresholds
    const severityRules = {
      'high-connection-count': { warning: 80000, critical: 95000 },
      'high-latency': { warning: 500, critical: 1000 },
      'high-error-rate': { warning: 0.05, critical: 0.1 },
      'low-user-activity': { warning: 5000, critical: 1000 }
    };

    const rule = severityRules[alertType];
    if (!rule) return 'info';

    if (value >= rule.critical) return 'critical';
    if (value >= rule.warning) return 'warning';
    return 'info';
  }
}
```


#### 💭 Production Experience: Monitoring tại Binance


Tại Binance, real-time monitoring WebSocket connections là critical để maintain service reliability. Chúng tôi learned từ multiple incidents:


**Incident 1: Memory Leak từ Event Listeners**


```javascript
// Problem: Memory leak trong connection handling
class BadWebSocketHandler {
  constructor() {
    this.connections = new Map();
  }

  handleConnection(ws) {
    // Memory leak: event listeners accumulate without cleanup
    ws.on('message', (data) => {
      this.processMessage(data);
    });

    // Missing: proper cleanup when connection closes
    this.connections.set(ws.id, ws);
  }
}

// Solution: Proper resource management
class GoodWebSocketHandler {
  constructor() {
    this.connections = new Map();
    this.metrics = new WebSocketMetricsCollector();
  }

  handleConnection(ws) {
    const connectionId = this.generateConnectionId();

    // Create cleanup controller
    const cleanup = new AbortController();

    // Setup event listeners with cleanup
    ws.addEventListener('message', (event) => {
      this.processMessage(event.data);
    }, { signal: cleanup.signal });

    ws.addEventListener('close', () => {
      // Proper cleanup
      cleanup.abort();
      this.connections.delete(connectionId);
      this.metrics.recordConnection('closed', { connectionId });
    }, { signal: cleanup.signal });

    this.connections.set(connectionId, { ws, cleanup });
    this.metrics.recordConnection('opened', { connectionId });
  }
}
```


**Incident 2: Performance Degradation Under High Load**


```javascript
// Problem: Inefficient message processing
function inefficientMessageProcessor(message) {
  // JSON parsing in hot path
  const data = JSON.parse(message);

  // Linear search through subscribers
  for (const subscriber of allSubscribers) {
    if (subscriber.interestedIn(data.symbol)) {
      subscriber.notify(data);
    }
  }
}

// Solution: Optimized processing
class OptimizedMessageProcessor {
  constructor() {
    this.symbolSubscribers = new Map(); // O(1) lookup
    this.messagePool = new ObjectPool(1000); // Object reuse
  }

  processMessage(message) {
    // Reuse objects to reduce GC pressure
    const data = this.messagePool.acquire();
    Object.assign(data, JSON.parse(message));

    // Direct hash lookup
    const subscribers = this.symbolSubscribers.get(data.symbol);
    if (subscribers) {
      subscribers.forEach(subscriber => subscriber.notify(data));
    }

    // Return to pool
    this.messagePool.release(data);
  }
}
```


## 🎯 Follow-up Questions và Interview Preparation


### 📋 Câu Hỏi Phỏng Vấn Từ Cơ Bản Đến Chuyên Sâu


#### Junior Level Questions:


**1. WebSocket Fundamentals:**


```
Q: Tại sao chúng ta cần WebSocket khi đã có HTTP?
A: HTTP là request-response protocol, không hỗ trợ real-time bidirectional communication.
   WebSocket cung cấp:
   - Full-duplex communication
   - Lower latency
   - Reduced overhead
   - Server-initiated messages
```


**2. Basic Implementation:**


```javascript
// Q: Implement một WebSocket client đơn giản
class SimpleWebSocketClient {
  constructor(url) {
    this.ws = new WebSocket(url);
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.ws.onopen = () => console.log('Connected');
    this.ws.onmessage = (event) => console.log('Message:', event.data);
    this.ws.onclose = () => console.log('Disconnected');
    this.ws.onerror = (error) => console.error('Error:', error);
  }

  send(message) {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }
}
```


**3. Error Handling:**


```
Q: Làm thế nào để handle WebSocket connection failures?
A: - Check readyState before sending
   - Implement reconnection logic
   - Use exponential backoff
   - Handle different close codes appropriately
```


#### Mid-Level Questions:


**4. Performance Optimization:**


```
Q: Làm thế nào để optimize WebSocket performance trong high-traffic application?
A: - Message batching
   - Connection pooling
   - Efficient serialization
   - Memory management
   - Throttling mechanisms
```


**5. Security Considerations:**


```javascript
// Q: Implement secure WebSocket với authentication
class SecureWebSocket {
  constructor(url, token) {
    // Use secure protocol
    const secureUrl = url.replace('ws://', 'wss://');

    this.ws = new WebSocket(secureUrl, [], {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    this.setupSecurity();
  }

  setupSecurity() {
    // Validate all incoming messages
    this.ws.onmessage = (event) => {
      if (this.validateMessage(event.data)) {
        this.handleMessage(event.data);
      }
    };
  }

  validateMessage(data) {
    try {
      const message = JSON.parse(data);
      return this.hasRequiredFields(message) &&
             this.isWithinSizeLimit(data) &&
             this.isFromTrustedSource(message);
    } catch {
      return false;
    }
  }
}
```


**6. Scaling Patterns:**


```
Q: Làm thế nào để scale WebSocket connections across multiple servers?
A: - Load balancing với sticky sessions
   - Message broker để sync state
   - Connection pooling
   - Regional distribution
   - Horizontal scaling strategies
```


#### Senior Level Questions:


**7. System Design:**


```
Q: Design một real-time collaboration system như Google Docs
A: Components:
   - WebSocket gateway cluster
   - Operational Transform engine
   - Conflict resolution system
   - State synchronization
   - User presence management
   - Permission system
```


**8. Advanced Architecture:**


```javascript
// Q: Implement event sourcing với WebSocket
class EventSourcingWebSocket {
  constructor() {
    this.eventStore = new EventStore();
    this.projections = new Map();
    this.websocketClients = new Set();
  }

  async handleCommand(command) {
    // Validate command
    await this.validateCommand(command);

    // Generate events
    const events = await this.processCommand(command);

    // Store events
    for (const event of events) {
      await this.eventStore.append(event);
    }

    // Update projections
    await this.updateProjections(events);

    // Broadcast to clients
    await this.broadcastEvents(events);
  }

  async updateProjections(events) {
    for (const event of events) {
      for (const [name, projection] of this.projections) {
        if (projection.canHandle(event.type)) {
          await projection.apply(event);
        }
      }
    }
  }
}
```


#### Principal Level Questions:


**9. Enterprise Architecture:**


```
Q: Design WebSocket infrastructure cho enterprise với multi-tenancy
A: - Tenant isolation strategies
   - Resource quotas và monitoring
   - Global load balancing
   - Disaster recovery
   - Compliance requirements
   - Cost optimization
```


**10. Performance at Scale:**


```
Q: Optimize WebSocket performance cho millions of concurrent connections
A: - Connection multiplexing
   - Message compression
   - Custom protocols
   - Hardware optimization
   - Monitoring và alerting
   - Capacity planning
```


### 🔍 Debugging Scenarios


#### Scenario 1: Connection Issues


```javascript
// Debug WebSocket connection problems
class WebSocketDebugger {
  static diagnoseConnectionIssue(ws, error) {
    const diagnostics = {
      url: ws.url,
      readyState: ws.readyState,
      protocol: ws.protocol,
      extensions: ws.extensions,
      error: error?.message
    };

    // Check common issues
    if (ws.url.startsWith('ws:') && location.protocol === 'https:') {
      diagnostics.issue = 'Mixed content - use wss:// on HTTPS';
    }

    if (ws.readyState === WebSocket.CLOSED) {
      diagnostics.issue = 'Connection closed - check server availability';
    }

    return diagnostics;
  }
}
```


#### Scenario 2: Memory Leaks


```javascript
// Debug memory leaks in WebSocket applications
class MemoryLeakDetector {
  constructor() {
    this.connectionCount = 0;
    this.messageCount = 0;
    this.startTime = Date.now();
  }

  checkMemoryUsage() {
    const memUsage = performance.memory;
    const uptime = Date.now() - this.startTime;

    const report = {
      connections: this.connectionCount,
      messages: this.messageCount,
      memory: {
        used: memUsage.usedJSHeapSize,
        total: memUsage.totalJSHeapSize,
        limit: memUsage.jsHeapSizeLimit
      },
      ratios: {
        memoryPerConnection: memUsage.usedJSHeapSize / this.connectionCount,
        memoryGrowthRate: memUsage.usedJSHeapSize / uptime
      }
    };

    if (report.ratios.memoryGrowthRate > 1000) { // 1KB/ms
      console.warn('Potential memory leak detected:', report);
    }

    return report;
  }
}
```


### 📚 Best Practices Summary


#### Development Best Practices:


1. **Always handle all WebSocket events:**
javascriptws.onopen = handleOpen;
ws.onmessage = handleMessage;
ws.onerror = handleError;
ws.onclose = handleClose;
2. **Implement proper reconnection logic:**
javascriptclass RobustWebSocket {
  reconnect() {
    if (this.shouldReconnect()) {
      setTimeout(() => this.connect(), this.getBackoffDelay());
    }
  }
}
3. **Validate all incoming data:**
javascriptws.onmessage = (event) => {
  try {
    const data = JSON.parse(event.data);
    if (isValidMessage(data)) {
      handleMessage(data);
    }
  } catch (error) {
    console.error('Invalid message received');
  }
};


#### Production Best Practices:


1. **Monitor connection health:**
javascriptsetInterval(() => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'ping' }));
  }
}, 30000);
2. **Implement rate limiting:**
javascriptconst rateLimiter = new RateLimiter(100, 1000); // 100 messages per second

function sendMessage(data) {
  if (rateLimiter.canSend()) {
    ws.send(data);
  } else {
    queueMessage(data);
  }
}
3. **Use connection pooling:**
javascriptconst connectionPool = new WebSocketPool({
  maxConnections: 10,
  idleTimeout: 300000
});


### 🎓 Learning Path Recommendations


#### Beginner to Intermediate:


1. Master basic WebSocket API
2. Implement simple chat application
3. Add error handling và reconnection
4. Learn about different message types
5. Implement authentication


#### Intermediate to Senior:


1. Study WebSocket protocol in detail
2. Implement custom protocols
3. Learn about scaling patterns
4. Master performance optimization
5. Understand security implications


#### Senior to Principal:


1. Design enterprise-grade systems
2. Master multi-tenancy patterns
3. Implement global scaling
4. Optimize for extreme performance
5. Lead technical architecture decisions


---


## 🎯 Kết Luận: Mastering WebSocket từ First Principles


Qua hành trình deep dive này, chúng ta đã explore WebSocket từ những fundamental concepts đến enterprise-level architecture. Từ kinh nghiệm của tôi tại NAB, Axon, Binance, Webflow, và Figma, tôi có thể khẳng định rằng WebSocket mastery đòi hỏi hiểu biết sâu sắc về:


1. **Protocol fundamentals** - Hiểu cách WebSocket hoạt động ở network level
2. **Browser internals** - Nắm vững cách browser implement WebSocket
3. **Performance optimization** - Biết cách optimize cho high-scale applications
4. **Security considerations** - Implement proper security measures
5. **Enterprise patterns** - Design systems có thể scale và maintain


**Key Takeaways:**


- WebSocket không chỉ là API replacement cho polling, mà là paradigm shift trong real-time communication
- Production WebSocket systems đòi hỏi sophisticated error handling, monitoring, và scaling strategies
- Security và performance phải được consider từ đầu, không phải afterthought
- Enterprise WebSocket architecture cần address multi-tenancy, global distribution, và resource management


Hành trình từ hiểu basic WebSocket API đến architecting enterprise-grade real-time systems là một process đòi hỏi continuous learning và hands-on experience. Những patterns và techniques tôi share trong bài này đến từ real-world challenges và solutions tại các công ty scale lớn.


Remember: **Mastery comes from understanding not just HOW things work, but WHY they work that way, và WHEN to apply different approaches.**
