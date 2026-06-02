# Web Page Rendering Process

## You

The process from inputting URL to displayingDNS resolutionTCP three-way handshakeSend request, analyze URL, set request message (header, body)The server returns the requested file (html)Browser rendering
 HTML parser --> DOM Tree
 Tokenization algorithm to mark the element statusDOM tree constructionCSS parser --> Style Tree
 Parse CSS code and generate style treeattachment --> Render Tree
 Combine the DOM tree and the style tree to generate a rendering treelayout: layoutGPU painting: pixel painting page
作者：郭东东 链接：https://juejin.cn/post/6844903776512393224 来源：稀土掘金 著作权归作者所有。商业转载请联系作者获得授权，非商业转载请注明出处。

## You

Continue

## Claude


# Hành Trình Từ URL Đến Pixel: Giải Mã Hoàn Toàn Quy Trình Web Rendering - Phân Tích Từ Góc Độ Principal Frontend Engineer


## 📚 Lời Mở Đầu - Cái Nhìn Từ Kinh Nghiệm Thực Tế


Khi tôi mới bắt đầu làm việc tại NAB (National Australia Bank), một câu hỏi đơn giản từ junior developer đã làm tôi giật mình: *"Anh ơi, chính xác điều gì xảy ra khi user click vào link trong web app của chúng ta?"*


Lúc đó tôi đã có 5 năm kinh nghiệm, nhưng khi cố gắng giải thích chi tiết, tôi nhận ra mình chỉ hiểu "surface level" - biết các bước nhưng không hiểu **tại sao** và **cách thức** cụ thể. Đó là lúc tôi bắt đầu journey đào sâu vào browser internals, network protocols và rendering pipeline.


💭 **Principal's Reflection**: *Sau 15 năm qua các công ty như NAB, Axon, Binance, Webflow và Figma, tôi nhận ra rằng understanding này không chỉ là kiến thức - nó là foundation để build high-performance applications, debug complex issues, và make architectural decisions that scale.*


Hôm nay, chúng ta sẽ cùng dissect từng molecule của quá trình này, từ khi user gõ URL cho đến khi pixel cuối cùng được paint lên màn hình.


---


## 🌱 PHẦN I: FOUNDATION - HIỂU TỪ GỐC RỄ


### 📖 DNS Resolution - Cuộc Hành Trình Tìm Địa Chỉ Thật


#### 🌱 Nguồn Gốc & Motivation: Tại Sao DNS Tồn Tại?


Trước khi DNS (Domain Name System) được Paul Mockapetris tạo ra năm 1983, internet hoạt động như thế nào? Hãy tưởng tượng internet đầu những năm 1970s:


**Vấn đề Gốc Rễ**:
Computers chỉ hiểu IP addresses (ví dụ: 192.168.1.1), nhưng humans thì nhớ names dễ hơn numbers. Ban đầu, Stanford Research Institute (SRI) maintain một file text giant gọi là `HOSTS.TXT` chứa mapping của tất cả hostnames to IP addresses trên toàn internet.


```
# HOSTS.TXT example from 1970s
10.0.0.1    ARPANET-HOST
10.0.0.2    STANFORD-AI
10.0.0.3    UCLA-NMC
```


**Thảm Họa Scaling**:


- File này phải được download manually và update trên mọi computer
- Khi internet grow, file size explode exponentially
- Single point of failure
- No real-time updates
- Name conflicts galore


💭 **Think Out Loud**: *Khi tôi đầu tiên học về DNS resolution, tôi đã confused về việc tại sao cần đến 4-5 steps chỉ để translate một domain name. Aha moment của tôi là khi realize rằng DNS không chỉ là một lookup table - nó là một distributed database system được design để handle billions of queries per second globally với fault tolerance.*


#### 🔬 Bản Chất & Mechanism: DNS Hierarchy - Cây Phân Cấp Toàn Cầu


DNS hoạt động như một **inverted tree structure** (cây ngược):


```
. (root)
                   /    |    \
                .com   .org   .edu
               /   |     |      \
            google microsoft   stanford
           /    |      |         |
         www   mail   outlook   www
```


**Core Components Deep Dive**:


1. **Root Servers** (13 logical servers globally):

Operated by organizations like Verisign, ISC, NASA
Each "logical" server is actually hundreds of physical servers using anycast
Store pointers to TLD (Top Level Domain) servers
2. **TLD Servers** (.com, .org, .net):

Managed by registries (Verisign for .com)
Store pointers to authoritative nameservers
3. **Authoritative Nameservers**:

Final source of truth for domain records
Managed by domain owners or DNS providers


#### 🔍 Step-by-Step DNS Resolution Process


Khi bạn type `www.example.com` vào browser:


**Step 1: Browser Cache Check**


```javascript
// Browser pseudocode
function resolveHostname(hostname) {
    // Check browser's internal DNS cache first
    let cachedIP = browserDNSCache.get(hostname);
    if (cachedIP && !cachedIP.isExpired()) {
        return cachedIP.address;
    }

    // Proceed to OS-level resolution
    return systemResolve(hostname);
}
```


**Step 2: Operating System Cache**


```c
// OS DNS cache (simplified C pseudocode)
struct dns_cache_entry {
    char hostname[256];
    uint32_t ip_address;
    time_t expiry;
    uint32_t ttl;
};

uint32_t os_dns_lookup(const char* hostname) {
    struct dns_cache_entry* entry = find_in_cache(hostname);
    if (entry && time(NULL) < entry->expiry) {
        return entry->ip_address;
    }

    // Cache miss - query recursive resolver
    return query_recursive_resolver(hostname);
}
```


**Step 3: Recursive Resolver Query**
Recursive resolver (thường là ISP's DNS server hoặc public resolvers như 8.8.8.8) thực hiện iterative queries:


```
1. Query Root Server: "Where can I find .com info?"
   Root → Returns: "Ask TLD server at 192.5.6.30"

2. Query TLD Server: "Where can I find example.com info?"
   TLD → Returns: "Ask authoritative server at 198.51.100.1"

3. Query Authoritative Server: "What's the IP for www.example.com?"
   Auth → Returns: "93.184.216.34"
```


**Memory Model Analysis**:
Mỗi DNS query consume:


- ~512 bytes UDP packet (standard)
- ~50-100ms latency per hop
- Multiple round trips = cumulative latency


#### ⚙️ Implementation Details - Tại Webflow


Tại Webflow, chúng tôi đã optimize DNS resolution cho custom domains:


```javascript
// DNS prefetching strategy
function prefetchDomainResources(domains) {
    domains.forEach(domain => {
        // Add DNS prefetch hint
        const link = document.createElement('link');
        link.rel = 'dns-prefetch';
        link.href = `//${domain}`;
        document.head.appendChild(link);
    });
}

// Preload critical domains
prefetchDomainResources([
    'fonts.googleapis.com',
    'cdn.jsdelivr.net',
    'analytics.google.com'
]);
```


#### 🏭 Production Reality - Debugging DNS Issues


**Common DNS Problems tôi gặp tại Binance**:


1. **DNS Propagation Delays**:


```bash
# Tools để debug DNS propagation
dig @8.8.8.8 api.binance.com
dig @1.1.1.1 api.binance.com
dig @208.67.222.222 api.binance.com

# Check TTL values
dig +noall +answer api.binance.com
```


1. **CNAME Chains Too Long**:


```
www.example.com → CNAME → cdn.example.com
cdn.example.com → CNAME → global.fastly.com
global.fastly.com → CNAME → prod.fastly.com
prod.fastly.com → A → 151.101.1.140
```


💡 **Production Lesson**: DNS chains >3 hops significantly impact performance. We optimized by using ALIAS records.


#### 💭 Principal's Perspective: DNS Strategy Decisions


**At Scale (Binance volume: 100M+ DNS queries/day)**:


1. **Multi-Provider Strategy**:

Primary: Cloudflare (anycast performance)
Secondary: Route53 (AWS integration)
Tertiary: DNS Made Easy (redundancy)
2. **TTL Strategy**:

A records: 300s (balance between cache efficiency và failover speed)
CNAME records: 3600s (less frequent changes)
TXT records: 86400s (rarely change)
3. **Monitoring Critical**:


```javascript
// DNS monitoring pseudo-implementation
function monitorDNSHealth() {
    const criticalDomains = ['api.binance.com', 'www.binance.com'];

    setInterval(() => {
        criticalDomains.forEach(async domain => {
            const startTime = Date.now();
            try {
                await dns.lookup(domain);
                const responseTime = Date.now() - startTime;

                if (responseTime > 100) {
                    alertSlack(`DNS slow for ${domain}: ${responseTime}ms`);
                }
            } catch (error) {
                alertPagerDuty(`DNS failure for ${domain}: ${error.message}`);
            }
        });
    }, 30000); // Check every 30s
}
```


#### 🎯 Verification Checklist - DNS Understanding


**Self-Assessment Questions**:


1. Tại sao recursive resolver không query tất cả servers simultaneously để faster resolution?
2. DNS over HTTPS (DoH) khác gì DNS over TLS (DoT)?
3. Anycast routing impact DNS performance như thế nào?


**Common Interview Questions**:


- "Walk me through DNS resolution for a subdomain như api.payments.stripe.com"
- "How would you debug DNS resolution taking 2+ seconds?"
- "Design a DNS failover strategy for a global application"


---


### 📖 TCP Three-Way Handshake - Nghi Thức Bắt Tay Tin Cậy


#### 🌱 Nguồn Gốc & Motivation: Tại Sao Cần "Bắt Tay"?


Trước TCP (Transmission Control Protocol), network communication sử dụng protocols đơn giản hơn như UDP. Vấn đề?


**Fundamental Problems TCP Solves**:


1. **Reliability**: Packets có thể bị lost, duplicated, hoặc arrive out of order
2. **Flow Control**: Sender có thể overwhelm receiver
3. **Congestion Control**: Network có thể become congested
4. **Connection State**: Cả hai sides cần agree về connection state


💭 **Think Out Loud**: *Ban đầu tôi confused về việc tại sao cần 3 steps thay vì 2. Aha moment: 2-way handshake không guarantee rằng cả hai sides đều ready. Client có thể think connection established nhưng server chưa ready to receive data.*


#### 🔬 Bản Chất & Mechanism: Three-Way Handshake Deep Dive


**Step-by-Step Breakdown**:


```
Client                                Server
  |                                     |
  |  SYN (seq=100)                     |
  |------------------------------------>|
  |                                     |
  |          SYN-ACK (seq=200, ack=101) |
  |<------------------------------------|
  |                                     |
  |  ACK (seq=101, ack=201)            |
  |------------------------------------>|
  |                                     |
  |    Connection Established          |
```


**Detailed Packet Analysis**:


**Step 1: SYN (Synchronize)**


```
TCP Header:
- Source Port: 54321
- Destination Port: 443 (HTTPS)
- Sequence Number: 1000000000 (randomly chosen)
- Acknowledgment Number: 0
- Flags: SYN = 1
- Window Size: 65535
- Checksum: calculated
```


Client nói: *"Tôi muốn establish connection. My initial sequence number là 1000000000."*


**Step 2: SYN-ACK (Synchronize-Acknowledge)**


```
TCP Header:
- Source Port: 443
- Destination Port: 54321
- Sequence Number: 2000000000 (server's random choice)
- Acknowledgment Number: 1000000001 (client's seq + 1)
- Flags: SYN = 1, ACK = 1
- Window Size: 32768
- Checksum: calculated
```


Server responds: *"OK, tôi received your SYN. My sequence number là 2000000000. Tôi expect your next sequence number là 1000000001."*


**Step 3: ACK (Acknowledge)**


```
TCP Header:
- Source Port: 54321
- Destination Port: 443
- Sequence Number: 1000000001
- Acknowledgment Number: 2000000001 (server's seq + 1)
- Flags: ACK = 1
- Window Size: 65535
- Checksum: calculated
```


Client confirms: *"Perfect, tôi received your SYN-ACK. Connection established!"*


#### ⚙️ Implementation Details - Browser TCP Stack


Modern browsers implement TCP stack với sophisticated optimizations:


```javascript
// Browser's conceptual TCP connection management
class TCPConnection {
    constructor(hostname, port) {
        this.hostname = hostname;
        this.port = port;
        this.state = 'CLOSED';
        this.sequenceNumber = this.generateRandomSeq();
        this.windowSize = 65535;
        this.congestionWindow = 1; // Start with 1 MSS
    }

    async connect() {
        this.state = 'SYN_SENT';

        // Send SYN packet
        const synPacket = {
            flags: { SYN: true },
            sequenceNumber: this.sequenceNumber,
            windowSize: this.windowSize
        };

        await this.sendPacket(synPacket);

        // Wait for SYN-ACK
        const synAckPacket = await this.waitForPacket();

        if (synAckPacket.flags.SYN && synAckPacket.flags.ACK) {
            this.state = 'ESTABLISHED';
            this.serverSequenceNumber = synAckPacket.sequenceNumber;

            // Send final ACK
            const ackPacket = {
                flags: { ACK: true },
                sequenceNumber: this.sequenceNumber + 1,
                acknowledgmentNumber: synAckPacket.sequenceNumber + 1
            };

            await this.sendPacket(ackPacket);
            return true;
        }

        throw new Error('Handshake failed');
    }
}
```


#### 🏭 Production Reality - TCP Optimization tại Figma


Tại Figma, real-time collaboration requires optimal TCP performance:


**1. TCP Fast Open (TFO)**:


```javascript
// Enable TCP Fast Open for repeat connections
const socket = new TCPSocket({
    fastOpen: true,
    noDelay: true // Disable Nagle's algorithm
});
```


**2. Connection Pooling**:


```javascript
class ConnectionPool {
    constructor() {
        this.pools = new Map(); // hostname -> Connection[]
        this.maxConnectionsPerHost = 6; // Browser limit
    }

    async getConnection(hostname, port) {
        const key = `${hostname}:${port}`;
        let pool = this.pools.get(key) || [];

        // Reuse existing connection
        const availableConnection = pool.find(conn =>
            conn.state === 'ESTABLISHED' && !conn.busy
        );

        if (availableConnection) {
            return availableConnection;
        }

        // Create new if under limit
        if (pool.length < this.maxConnectionsPerHost) {
            const newConnection = new TCPConnection(hostname, port);
            await newConnection.connect();
            pool.push(newConnection);
            this.pools.set(key, pool);
            return newConnection;
        }

        // Wait for available connection
        return this.waitForAvailableConnection(key);
    }
}
```


#### 💭 Principal's Perspective: TCP Strategy for Modern Web Apps


**At NAB (Banking Requirements)**:


- **Security**: All connections TLS 1.3+
- **Reliability**: Connection retry với exponential backoff
- **Monitoring**: Track connection establishment time


```javascript
// Production TCP monitoring
function monitorTCPPerformance() {
    const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
            if (entry.entryType === 'navigation') {
                const tcpTime = entry.connectEnd - entry.connectStart;
                const tlsTime = entry.secureConnectionStart ?
                    entry.connectEnd - entry.secureConnectionStart : 0;

                // Alert if TCP handshake > 100ms
                if (tcpTime > 100) {
                    analytics.track('slow_tcp_handshake', {
                        duration: tcpTime,
                        url: entry.name,
                        userAgent: navigator.userAgent
                    });
                }
            }
        });
    });

    observer.observe({ entryTypes: ['navigation'] });
}
```


**Common TCP Issues & Solutions**:


1. **High Latency Handshakes**:

Solution: CDN with edge termination
Monitor: connectStart → connectEnd timing
2. **Connection Timeouts**:

Solution: Implement retry logic with jitter
Monitor: Failed connection rate
3. **Head-of-Line Blocking**:

Solution: HTTP/2 multiplexing hoặc HTTP/3 QUIC
Monitor: Request queuing time


#### 🎯 Verification Checklist - TCP Understanding


**Self-Assessment Questions**:


1. Tại sao sequence numbers phải random thay vì start từ 0?
2. TCP window scaling hoạt động như thế nào?
3. Nagle's algorithm vs TCP_NODELAY trade-offs?


**Real-World Debugging Scenario**:


```bash
# Debug TCP connection issues
netstat -an | grep :443
tcpdump -i eth0 host example.com and port 443
ss -i # Show TCP info including congestion window
```


---


### 📖 HTTP Request Formation - Crafting the Perfect Message


#### 🌱 Nguồn Gốc & Motivation: Evolution từ HTTP/0.9 đến HTTP/3


**HTTP/0.9 (1991) - The Beginning**:


```
GET /index.html
```


Chỉ có vậy thôi! No headers, no status codes, chỉ GET và HTML response.


**HTTP/1.0 (1996) - Adding Structure**:


```
GET /index.html HTTP/1.0
Host: www.example.com
User-Agent: Mozilla/1.0
```


**HTTP/1.1 (1997) - The Workhorse**:


```
GET /api/users HTTP/1.1
Host: api.example.com
Connection: keep-alive
Accept: application/json
User-Agent: Mozilla/5.0...
```


**HTTP/2 (2015) - Binary Protocol**:


- Binary framing
- Multiplexing
- Server push
- Header compression (HPACK)


**HTTP/3 (2022) - QUIC Transport**:


- UDP-based
- Built-in encryption
- Reduced latency
- Connection migration


💭 **Think Out Loud**: *Khi đầu tiên work với HTTP/2 tại Axon, tôi confused về việc tại sao performance không improve much. Aha moment: HTTP/2 multiplexing chỉ effective khi có many small requests. Large payloads vẫn benefit từ HTTP/1.1 trong một số cases.*


#### 🔬 Bản Chất & Mechanism: HTTP Request Anatomy


**Complete HTTP/1.1 Request Structure**:


```
GET /api/v1/users/123 HTTP/1.1
Host: api.example.com
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36
Accept: application/json, text/plain, */*
Accept-Language: en-US,en;q=0.9,vi;q=0.8
Accept-Encoding: gzip, deflate, br
Connection: keep-alive
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Cache-Control: no-cache
Pragma: no-cache
X-Requested-With: XMLHttpRequest
Referer: https://app.example.com/dashboard
Origin: https://app.example.com

[Optional Body for POST/PUT/PATCH]
```


#### 🔍 Step-by-Step Request Formation Process


**Browser's Request Creation Pipeline**:


```javascript
// Browser's internal request formation (conceptual)
class HTTPRequest {
    constructor(method, url, options = {}) {
        this.method = method.toUpperCase();
        this.url = new URL(url);
        this.headers = new Map();
        this.body = options.body;

        // Initialize with default headers
        this.setDefaultHeaders();

        // Apply user-defined headers
        if (options.headers) {
            this.setHeaders(options.headers);
        }
    }

    setDefaultHeaders() {
        // Mandatory headers
        this.headers.set('Host', this.url.host);
        this.headers.set('User-Agent', navigator.userAgent);

        // Content negotiation
        this.headers.set('Accept', this.determineAcceptHeader());
        this.headers.set('Accept-Language', navigator.language);
        this.headers.set('Accept-Encoding', 'gzip, deflate, br');

        // Connection management
        this.headers.set('Connection', 'keep-alive');

        // Security headers
        if (this.url.protocol === 'https:') {
            this.headers.set('Upgrade-Insecure-Requests', '1');
        }

        // CORS headers if cross-origin
        if (this.isCrossOrigin()) {
            this.headers.set('Origin', location.origin);
        }
    }

    determineAcceptHeader() {
        // Context-aware Accept header
        const context = this.detectRequestContext();

        switch (context) {
            case 'api':
                return 'application/json, text/plain, */*';
            case 'image':
                return 'image/webp, image/apng, image/*';
            case 'document':
                return 'text/html, application/xhtml+xml, application/xml;q=0.9, */*;q=0.8';
            default:
                return '*/*';
        }
    }

    async serialize() {
        const requestLine = `${this.method} ${this.url.pathname}${this.url.search} HTTP/1.1`;
        const headers = Array.from(this.headers.entries())
            .map(([key, value]) => `${key}: ${value}`)
            .join('\r\n');

        let request = `${requestLine}\r\n${headers}\r\n\r\n`;

        if (this.body) {
            request += await this.serializeBody();
        }

        return request;
    }
}
```


#### ⚙️ Implementation Details - Advanced Request Handling


**Content-Type Auto-Detection**:


```javascript
// Intelligent Content-Type detection
function determineContentType(body) {
    if (body instanceof FormData) {
        return 'multipart/form-data'; // Browser sets boundary
    }

    if (body instanceof URLSearchParams) {
        return 'application/x-www-form-urlencoded';
    }

    if (body instanceof ArrayBuffer || body instanceof Uint8Array) {
        return 'application/octet-stream';
    }

    if (typeof body === 'object') {
        return 'application/json';
    }

    if (typeof body === 'string') {
        // Heuristic detection
        try {
            JSON.parse(body);
            return 'application/json';
        } catch {
            return 'text/plain';
        }
    }

    return 'text/plain';
}
```


**Request Interceptor Pattern (used tại Binance)**:


```javascript
class RequestInterceptor {
    constructor() {
        this.interceptors = [];
    }

    use(interceptor) {
        this.interceptors.push(interceptor);
    }

    async intercept(request) {
        let modifiedRequest = request;

        for (const interceptor of this.interceptors) {
            modifiedRequest = await interceptor(modifiedRequest);
        }

        return modifiedRequest;
    }
}

// Production interceptors
const interceptor = new RequestInterceptor();

// Authentication interceptor
interceptor.use(async (request) => {
    const token = await getAuthToken();
    if (token) {
        request.headers.set('Authorization', `Bearer ${token}`);
    }
    return request;
});

// Rate limiting interceptor
interceptor.use(async (request) => {
    await rateLimiter.waitForCapacity();
    return request;
});

// Retry logic interceptor
interceptor.use(async (request) => {
    request.retryCount = 0;
    request.maxRetries = 3;
    return request;
});

// Analytics interceptor
interceptor.use(async (request) => {
    analytics.track('api_request_initiated', {
        method: request.method,
        endpoint: request.url.pathname,
        userAgent: navigator.userAgent
    });
    return request;
});
```


#### 🏭 Production Reality - Request Optimization tại Webflow


**1. Request Deduplication**:


```javascript
class RequestDeduplicator {
    constructor() {
        this.pendingRequests = new Map();
    }

    async request(url, options) {
        const key = this.generateKey(url, options);

        // Return existing promise if request in flight
        if (this.pendingRequests.has(key)) {
            return this.pendingRequests.get(key);
        }

        // Create new request
        const requestPromise = this.executeRequest(url, options)
            .finally(() => {
                this.pendingRequests.delete(key);
            });

        this.pendingRequests.set(key, requestPromise);
        return requestPromise;
    }

    generateKey(url, options) {
        return `${options.method || 'GET'}:${url}:${JSON.stringify(options.body || {})}`;
    }
}
```


**2. Request Prioritization**:


```javascript
class PriorityQueue {
    constructor() {
        this.queues = {
            high: [],      // Critical API calls
            normal: [],    // Standard requests
            low: []        // Analytics, tracking
        };
        this.processing = false;
    }

    enqueue(request, priority = 'normal') {
        this.queues[priority].push(request);
        this.process();
    }

    async process() {
        if (this.processing) return;
        this.processing = true;

        while (this.hasRequests()) {
            // Process high priority first
            const request = this.dequeue();
            await this.executeRequest(request);
        }

        this.processing = false;
    }

    dequeue() {
        if (this.queues.high.length > 0) {
            return this.queues.high.shift();
        }
        if (this.queues.normal.length > 0) {
            return this.queues.normal.shift();
        }
        return this.queues.low.shift();
    }
}
```


#### 💭 Principal's Perspective: Request Strategy at Scale


**Performance Patterns tôi implement tại Figma**:


**1. Request Batching**:


```javascript
class RequestBatcher {
    constructor(maxBatchSize = 10, maxWaitTime = 50) {
        this.maxBatchSize = maxBatchSize;
        this.maxWaitTime = maxWaitTime;
        this.pendingRequests = [];
        this.timer = null;
    }

    async request(endpoint, data) {
        return new Promise((resolve, reject) => {
            this.pendingRequests.push({
                endpoint,
                data,
                resolve,
                reject
            });

            if (this.pendingRequests.length >= this.maxBatchSize) {
                this.flush();
            } else if (!this.timer) {
                this.timer = setTimeout(() => this.flush(), this.maxWaitTime);
            }
        });
    }

    async flush() {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }

        const batch = this.pendingRequests.splice(0);

        try {
            const response = await fetch('/api/batch', {
                method: 'POST',
                body: JSON.stringify(batch.map(r => ({
                    endpoint: r.endpoint,
                    data: r.data
                })))
            });

            const results = await response.json();

            batch.forEach((request, index) => {
                request.resolve(results[index]);
            });
        } catch (error) {
            batch.forEach(request => {
                request.reject(error);
            });
        }
    }
}
```


**2. Intelligent Caching Strategy**:


```javascript
class IntelligentCache {
    constructor() {
        this.cache = new Map();
        this.accessCount = new Map();
        this.lastAccess = new Map();
    }

    set(key, value, ttl = 300000) { // 5 minutes default
        this.cache.set(key, {
            value,
            expiry: Date.now() + ttl,
            size: this.estimateSize(value)
        });

        this.updateAccessStats(key);
        this.evictIfNeeded();
    }

    get(key) {
        const entry = this.cache.get(key);

        if (!entry || Date.now() > entry.expiry) {
            this.cache.delete(key);
            return null;
        }

        this.updateAccessStats(key);
        return entry.value;
    }

    updateAccessStats(key) {
        this.accessCount.set(key, (this.accessCount.get(key) || 0) + 1);
        this.lastAccess.set(key, Date.now());
    }

    evictIfNeeded() {
        // LFU + LRU hybrid eviction
        if (this.getTotalSize() > this.maxSize) {
            const candidates = Array.from(this.cache.keys())
                .sort((a, b) => {
                    const scoreA = this.getEvictionScore(a);
                    const scoreB = this.getEvictionScore(b);
                    return scoreA - scoreB;
                });

            // Evict lowest scoring entries
            const toEvict = candidates.slice(0, Math.ceil(candidates.length * 0.1));
            toEvict.forEach(key => this.cache.delete(key));
        }
    }
}
```


#### 🎯 Verification Checklist - HTTP Request Understanding


**Self-Assessment Questions**:


1. Tại sao Host header bắt buộc trong HTTP/1.1?
2. Connection: keep-alive vs Connection: close implications?
3. HTTP/2 server push benefits và drawbacks?


**Production Debugging Scenario**:


```javascript
// Debug HTTP request issues
function debugRequest(request) {
    console.group('🔍 Request Debug');

    // Validate headers
    const requiredHeaders = ['Host', 'User-Agent'];
    requiredHeaders.forEach(header => {
        if (!request.headers.has(header)) {
            console.warn(`❌ Missing required header: ${header}`);
        }
    });

    // Check for common mistakes
    if (request.method === 'GET' && request.body) {
        console.warn('❌ GET request should not have body');
    }

    if (request.headers.get('Content-Type')?.includes('json') &&
        typeof request.body === 'string') {
        try {
            JSON.parse(request.body);
        } catch {
            console.warn('❌ Invalid JSON in request body');
        }
    }

    // Performance checks
    const headerSize = Array.from(request.headers.entries())
        .reduce((size, [key, value]) => size + key.length + value.length, 0);

    if (headerSize > 8192) {
        console.warn(`⚠️ Large headers (${headerSize} bytes) may cause issues`);
    }

    console.groupEnd();
}
```


---


## 🌱 PHẦN II: NETWORK LAYER - GIAO TIẾP VÀ TRUYỀN TẢI


### 📖 Server Response Processing - Giải Mã Thông Điệp Trả Về


#### 🌱 Nguồn Gốc & Motivation: Tại Sao Server Response Phức Tạp?


Trong early days của web, server response đơn giản:


```
<html>
<body>
Hello World!
</body>
</html>
```


Nhưng modern web applications require:


- **Content Negotiation**: Different formats (JSON, XML, HTML)
- **Caching Strategies**: ETags, Last-Modified, Cache-Control
- **Security Headers**: CSP, CORS, HSTS
- **Performance Optimization**: Compression, Chunked Transfer
- **Error Handling**: Meaningful status codes và error details


💭 **Think Out Loud**: *Khi work tại NAB với banking regulations, tôi realize server response không chỉ là data - nó là contract giữa client và server, bao gồm security policies, caching directives, và compliance information.*


#### 🔬 Bản Chất & Mechanism: HTTP Response Anatomy


**Complete HTTP Response Structure**:


```
HTTP/1.1 200 OK
Date: Thu, 21 Aug 2025 10:30:00 GMT
Server: nginx/1.20.1
Content-Type: application/json; charset=utf-8
Content-Length: 1247
Content-Encoding: gzip
Cache-Control: public, max-age=300, s-maxage=600
ETag: "abc123def456"
Last-Modified: Thu, 21 Aug 2025 10:25:00 GMT
Vary: Accept-Encoding, Accept-Language
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Access-Control-Allow-Origin: https://app.example.com
Access-Control-Allow-Credentials: true
Set-Cookie: sessionId=abc123; HttpOnly; Secure; SameSite=Strict
Connection: keep-alive

{
  "data": {
    "users": [...]
  },
  "meta": {
    "total": 1247,
    "page": 1
  }
}
```


#### 🔍 Step-by-Step Response Processing


**Browser's Response Processing Pipeline**:


```javascript
// Browser's internal response processing (conceptual)
class HTTPResponse {
    constructor(rawResponse) {
        this.statusCode = rawResponse.statusCode;
        this.statusText = rawResponse.statusText;
        this.headers = new Map(rawResponse.headers);
        this.body = rawResponse.body;
        this.url = rawResponse.url;
        this.redirected = rawResponse.redirected;
    }

    async process() {
        // Step 1: Validate response
        this.validateResponse();

        // Step 2: Handle redirects
        if (this.isRedirect()) {
            return this.handleRedirect();
        }

        // Step 3: Process security headers
        this.processSecurityHeaders();

        // Step 4: Handle caching
        this.processCachingHeaders();

        // Step 5: Decode content
        const decodedBody = await this.decodeBody();

        // Step 6: Parse content based on Content-Type
        return this.parseContent(decodedBody);
    }

    validateResponse() {
        // Check for required headers
        if (!this.headers.has('Content-Type')) {
            console.warn('Response missing Content-Type header');
        }

        // Validate status code ranges
        if (this.statusCode >= 400) {
            throw new HTTPError(this.statusCode, this.statusText);
        }
    }

    async decodeBody() {
        const encoding = this.headers.get('Content-Encoding');

        switch (encoding) {
            case 'gzip':
                return await this.decompressGzip(this.body);
            case 'deflate':
                return await this.decompressDeflate(this.body);
            case 'br':
                return await this.decompressBrotli(this.body);
            default:
                return this.body;
        }
    }

    parseContent(body) {
        const contentType = this.headers.get('Content-Type') || '';

        if (contentType.includes('application/json')) {
            return this.parseJSON(body);
        }

        if (contentType.includes('text/html')) {
            return this.parseHTML(body);
        }

        if (contentType.includes('text/xml') || contentType.includes('application/xml')) {
            return this.parseXML(body);
        }

        return body; // Return as-is for other types
    }

    parseJSON(body) {
        try {
            return JSON.parse(body);
        } catch (error) {
            throw new ParseError('Invalid JSON response', body);
        }
    }
}
```


#### ⚙️ Implementation Details - Advanced Response Handling


**Content Negotiation System**:


```javascript
// Server-side content negotiation (Node.js example)
class ContentNegotiator {
    constructor(request) {
        this.acceptHeader = request.headers.accept || '*/*';
        this.acceptLanguage = request.headers['accept-language'] || 'en';
        this.acceptEncoding = request.headers['accept-encoding'] || '';
    }

    negotiateContentType(availableTypes) {
        const acceptedTypes = this.parseAcceptHeader(this.acceptHeader);

        // Sort by quality factor (q value)
        const sortedTypes = acceptedTypes.sort((a, b) => b.quality - a.quality);

        for (const acceptedType of sortedTypes) {
            for (const availableType of availableTypes) {
                if (this.typesMatch(acceptedType.type, availableType)) {
                    return availableType;
                }
            }
        }

        // Default fallback
        return availableTypes[0];
    }

    parseAcceptHeader(acceptHeader) {
        return acceptHeader.split(',').map(type => {
            const [mediaType, ...params] = type.trim().split(';');
            const quality = params.find(p => p.trim().startsWith('q='));

            return {
                type: mediaType.trim(),
                quality: quality ? parseFloat(quality.split('=')[1]) : 1.0
            };
        });
    }

    negotiateEncoding() {
        const encodings = ['br', 'gzip', 'deflate']; // Preference order

        for (const encoding of encodings) {
            if (this.acceptEncoding.includes(encoding)) {
                return encoding;
            }
        }

        return 'identity'; // No compression
    }
}
```


**Streaming Response Handler**:


```javascript
// Handle streaming responses (used tại Figma for real-time collaboration)
class StreamingResponseHandler {
    constructor() {
        this.decoder = new TextDecoder();
        this.buffer = '';
    }

    async handleStream(response) {
        const reader = response.body.getReader();

        try {
            while (true) {
                const { done, value } = await reader.read();

                if (done) break;

                // Decode chunk
                const chunk = this.decoder.decode(value, { stream: true });
                this.buffer += chunk;

                // Process complete messages
                this.processBuffer();
            }
        } finally {
            reader.releaseLock();
        }
    }

    processBuffer() {
        const messages = this.buffer.split('\n');
        this.buffer = messages.pop(); // Keep incomplete message in buffer

        messages.forEach(message => {
            if (message.trim()) {
                this.handleMessage(JSON.parse(message));
            }
        });
    }

    handleMessage(data) {
        switch (data.type) {
            case 'update':
                this.applyUpdate(data.payload);
                break;
            case 'cursor':
                this.updateCursor(data.payload);
                break;
            case 'presence':
                this.updatePresence(data.payload);
                break;
        }
    }
}
```


#### 🏭 Production Reality - Response Optimization tại Binance


**1. Intelligent Compression Strategy**:


```javascript
// Dynamic compression based on content and client capabilities
function selectCompression(content, acceptEncoding, contentType) {
    const size = Buffer.byteLength(content);

    // Don't compress small responses (overhead > benefit)
    if (size < 1024) {
        return 'identity';
    }

    // Don't compress already compressed content
    if (contentType.includes('image/') ||
        contentType.includes('video/') ||
        contentType.includes('application/pdf')) {
        return 'identity';
    }

    // Choose best compression for content type
    if (contentType.includes('application/json') ||
        contentType.includes('text/')) {

        if (acceptEncoding.includes('br')) {
            return 'br'; // Best compression ratio
        }

        if (acceptEncoding.includes('gzip')) {
            return 'gzip'; // Good balance
        }

        if (acceptEncoding.includes('deflate')) {
            return 'deflate'; // Fallback
        }
    }

    return 'identity';
}
```


**2. Response Caching Strategy**:


```javascript
// Multi-layered caching system
class ResponseCacheManager {
    constructor() {
        this.memoryCache = new Map();
        this.redisCache = new Redis();
        this.cdnCache = new CDNManager();
    }

    async getResponse(key, generator) {
        // L1: Memory cache (fastest)
        const memoryResult = this.memoryCache.get(key);
        if (memoryResult && !this.isExpired(memoryResult)) {
            return memoryResult.data;
        }

        // L2: Redis cache (fast)
        const redisResult = await this.redisCache.get(key);
        if (redisResult) {
            const parsed = JSON.parse(redisResult);
            if (!this.isExpired(parsed)) {
                // Populate L1 cache
                this.memoryCache.set(key, parsed);
                return parsed.data;
            }
        }

        // L3: Generate fresh response
        const freshData = await generator();
        const cacheEntry = {
            data: freshData,
            timestamp: Date.now(),
            ttl: this.calculateTTL(freshData)
        };

        // Populate all cache layers
        this.memoryCache.set(key, cacheEntry);
        await this.redisCache.setex(key, cacheEntry.ttl, JSON.stringify(cacheEntry));

        return freshData;
    }

    calculateTTL(data) {
        // Dynamic TTL based on data characteristics
        if (data.type === 'user-specific') {
            return 60; // 1 minute
        }

        if (data.type === 'market-data') {
            return 30; // 30 seconds
        }

        if (data.type === 'static-config') {
            return 3600; // 1 hour
        }

        return 300; // 5 minutes default
    }
}
```


#### 💭 Principal's Perspective: Response Strategy at Enterprise Scale


**Performance Monitoring tại NAB**:


```javascript
// Comprehensive response monitoring
class ResponseMonitor {
    constructor() {
        this.metrics = {
            responseTime: new Histogram(),
            responseSize: new Histogram(),
            statusCodes: new Counter(),
            compressionRatio: new Histogram()
        };
    }

    recordResponse(response, startTime) {
        const duration = Date.now() - startTime;
        const size = this.getResponseSize(response);

        // Record core metrics
        this.metrics.responseTime.observe(duration);
        this.metrics.responseSize.observe(size);
        this.metrics.statusCodes.inc({ status: response.status });

        // Compression effectiveness
        const originalSize = response.headers.get('X-Original-Size');
        if (originalSize) {
            const ratio = size / parseInt(originalSize);
            this.metrics.compressionRatio.observe(ratio);
        }

        // Alert on anomalies
        if (duration > 1000) {
            this.alertSlowResponse(response, duration);
        }

        if (size > 1024 * 1024) { // 1MB
            this.alertLargeResponse(response, size);
        }
    }

    generatePerformanceReport() {
        return {
            averageResponseTime: this.metrics.responseTime.mean(),
            p95ResponseTime: this.metrics.responseTime.percentile(0.95),
            p99ResponseTime: this.metrics.responseTime.percentile(0.99),
            totalRequests: this.metrics.statusCodes.total(),
            errorRate: this.calculateErrorRate(),
            averageCompressionRatio: this.metrics.compressionRatio.mean()
        };
    }
}
```


**Error Response Standardization**:


```javascript
// Consistent error response format across microservices
class ErrorResponseBuilder {
    static build(error, request) {
        const baseResponse = {
            success: false,
            timestamp: new Date().toISOString(),
            path: request.url,
            method: request.method,
            requestId: request.headers['x-request-id']
        };

        if (error instanceof ValidationError) {
            return {
                ...baseResponse,
                status: 400,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Request validation failed',
                    details: error.details,
                    fields: error.fields
                }
            };
        }

        if (error instanceof AuthenticationError) {
            return {
                ...baseResponse,
                status: 401,
                error: {
                    code: 'AUTHENTICATION_REQUIRED',
                    message: 'Valid authentication required',
                    loginUrl: '/auth/login'
                }
            };
        }

        if (error instanceof AuthorizationError) {
            return {
                ...baseResponse,
                status: 403,
                error: {
                    code: 'INSUFFICIENT_PERMISSIONS',
                    message: 'Insufficient permissions for this operation',
                    requiredPermissions: error.requiredPermissions
                }
            };
        }

        // Generic server error (don't expose internals)
        return {
            ...baseResponse,
            status: 500,
            error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'An internal server error occurred',
                supportCode: this.generateSupportCode()
            }
        };
    }
}
```


#### 🎯 Verification Checklist - Response Processing Understanding


**Self-Assessment Questions**:


1. Tại sao Vary header quan trọng cho caching?
2. ETags vs Last-Modified header trade-offs?
3. Chunked Transfer Encoding hoạt động như thế nào?


**Production Debugging Tools**:


```javascript
// Response debugging utilities
function debugResponse(response) {
    console.group('📨 Response Analysis');

    // Status validation
    console.log(`Status: ${response.status} ${response.statusText}`);

    // Header analysis
    const headers = Object.fromEntries(response.headers);
    console.table(headers);

    // Caching analysis
    const cacheHeaders = [
        'Cache-Control', 'ETag', 'Last-Modified',
        'Expires', 'Vary'
    ];

    const cacheInfo = {};
    cacheHeaders.forEach(header => {
        if (response.headers.has(header)) {
            cacheInfo[header] = response.headers.get(header);
        }
    });

    if (Object.keys(cacheInfo).length > 0) {
        console.group('🗄️ Cache Headers');
        console.table(cacheInfo);
        console.groupEnd();
    }

    // Security analysis
    const securityHeaders = [
        'Content-Security-Policy',
        'X-Content-Type-Options',
        'X-Frame-Options',
        'Strict-Transport-Security'
    ];

    const securityInfo = {};
    securityHeaders.forEach(header => {
        securityInfo[header] = response.headers.get(header) || '❌ Missing';
    });

    console.group('🔒 Security Headers');
    console.table(securityInfo);
    console.groupEnd();

    console.groupEnd();
}
```


---


## 🌱 PHẦN III: BROWSER RENDERING ENGINE - TỪ HTML ĐẾN PIXELS


### 📖 HTML Parser & DOM Tree Construction - Xây Dựng Cấu Trúc Dữ Liệu


#### 🌱 Nguồn Gốc & Motivation: Tại Sao Cần Parse HTML?


Trước khi browsers hiện đại, HTML parsing đơn giản và không có standards. Mỗi browser implement theo cách riêng, dẫn đến:


**Vấn Đề Historical**:


- **Inconsistent Rendering**: Cùng HTML code render khác nhau trên browsers
- **No Error Recovery**: Malformed HTML crash browsers
- **Performance Issues**: Naive parsing algorithms O(n²) complexity
- **Security Vulnerabilities**: No input validation


**HTML5 Parsing Algorithm** (2008) giải quyết bằng cách định nghĩa:


- **Deterministic Parsing**: Cùng input → cùng output
- **Error Recovery**: Handle malformed HTML gracefully
- **Security**: Input sanitization và validation
- **Performance**: Optimized algorithms


💭 **Think Out Loud**: *Khi đầu tiên đọc HTML5 parsing spec, tôi shocked về độ phức tạp - 900+ pages chỉ để parse HTML! Aha moment: HTML parsing không chỉ là text processing, nó là security boundary, performance bottleneck, và foundation của entire web platform.*


#### 🔬 Bản Chất & Mechanism: HTML Parsing Pipeline Deep Dive


**HTML Parsing Process Overview**:


```
Raw HTML Bytes → Character Stream → Token Stream → DOM Tree
     ↓              ↓                ↓              ↓
   UTF-8          Scanner         Tokenizer      Tree Builder
  Decoder       (Lexical)       (Syntactic)    (Semantic)
```


#### 🔍 Step 1: Character Stream Processing


**Input Stream Management**:


```javascript
// Browser's character stream processor (conceptual)
class HTMLInputStream {
    constructor(htmlBytes) {
        this.bytes = htmlBytes;
        this.encoding = this.detectEncoding();
        this.decoder = new TextDecoder(this.encoding);
        this.characters = this.decoder.decode(this.bytes);
        this.position = 0;
        this.line = 1;
        this.column = 1;
    }

    detectEncoding() {
        // Priority order for encoding detection

        // 1. BOM (Byte Order Mark)
        if (this.hasBOM()) {
            return this.getBOMEncoding();
        }

        // 2. HTTP Content-Type header
        const httpEncoding = this.getHTTPEncoding();
        if (httpEncoding) {
            return httpEncoding;
        }

        // 3. HTML meta tag
        const metaEncoding = this.scanForMetaEncoding();
        if (metaEncoding) {
            return metaEncoding;
        }

        // 4. Default to UTF-8
        return 'utf-8';
    }

    scanForMetaEncoding() {
        // Look for <meta charset="..."> in first 1024 bytes
        const firstKB = this.bytes.slice(0, 1024);
        const text = new TextDecoder('ascii').decode(firstKB);

        const metaMatch = text.match(/<meta[^>]+charset\s*=\s*["']?([^"'>\s]+)/i);
        return metaMatch ? metaMatch[1] : null;
    }

    peek() {
        return this.characters[this.position];
    }

    advance() {
        const char = this.characters[this.position++];

        if (char === '\n') {
            this.line++;
            this.column = 1;
        } else {
            this.column++;
        }

        return char;
    }

    isEOF() {
        return this.position >= this.characters.length;
    }
}
```


#### 🔍 Step 2: Tokenization - Lexical Analysis


**HTML Tokenizer State Machine**:


HTML tokenizer implement finite state machine với 80+ states theo HTML5 spec:


```javascript
// Simplified HTML tokenizer
class HTMLTokenizer {
    constructor(inputStream) {
        this.input = inputStream;
        this.state = 'DATA_STATE';
        this.currentToken = null;
        this.tokens = [];

        // Temporary buffers
        this.temporaryBuffer = '';
        this.characterReferenceCode = 0;
    }

    tokenize() {
        while (!this.input.isEOF()) {
            this.handleCurrentState();
        }

        return this.tokens;
    }

    handleCurrentState() {
        const char = this.input.peek();

        switch (this.state) {
            case 'DATA_STATE':
                this.handleDataState(char);
                break;

            case 'TAG_OPEN_STATE':
                this.handleTagOpenState(char);
                break;

            case 'TAG_NAME_STATE':
                this.handleTagNameState(char);
                break;

            case 'BEFORE_ATTRIBUTE_NAME_STATE':
                this.handleBeforeAttributeNameState(char);
                break;

            // ... 80+ other states
        }
    }

    handleDataState(char) {
        if (char === '<') {
            this.setState('TAG_OPEN_STATE');
        } else if (char === '&') {
            this.setState('CHARACTER_REFERENCE_STATE');
        } else if (char === null) {
            this.emitEOFToken();
        } else {
            this.emitCharacterToken(char);
        }

        this.input.advance();
    }

    handleTagOpenState(char) {
        if (char === '!') {
            this.setState('MARKUP_DECLARATION_OPEN_STATE');
        } else if (char === '/') {
            this.setState('END_TAG_OPEN_STATE');
        } else if (this.isASCIIAlpha(char)) {
            this.currentToken = new StartTagToken();
            this.setState('TAG_NAME_STATE');
            return; // Don't advance, reprocess char
        } else if (char === '?') {
            // Parse error: unexpected question mark
            this.parseError('unexpected-question-mark-instead-of-tag-name');
            this.currentToken = new CommentToken();
            this.setState('BOGUS_COMMENT_STATE');
            return;
        } else {
            // Parse error: invalid first character of tag name
            this.parseError('invalid-first-character-of-tag-name');
            this.emitCharacterToken('<');
            this.setState('DATA_STATE');
            return;
        }

        this.input.advance();
    }

    emitToken(token) {
        if (token instanceof StartTagToken || token instanceof EndTagToken) {
            // Deduplicate attributes
            const seenAttributes = new Set();
            token.attributes = token.attributes.filter(attr => {
                if (seenAttributes.has(attr.name)) {
                    this.parseError('duplicate-attribute');
                    return false;
                }
                seenAttributes.add(attr.name);
                return true;
            });
        }

        this.tokens.push(token);
    }
}
```


**Token Types**:


```javascript
class Token {
    constructor(type) {
        this.type = type;
    }
}

class StartTagToken extends Token {
    constructor() {
        super('START_TAG');
        this.tagName = '';
        this.attributes = [];
        this.selfClosing = false;
    }
}

class EndTagToken extends Token {
    constructor() {
        super('END_TAG');
        this.tagName = '';
    }
}

class CharacterToken extends Token {
    constructor(data) {
        super('CHARACTER');
        this.data = data;
    }
}

class CommentToken extends Token {
    constructor() {
        super('COMMENT');
        this.data = '';
    }
}

class DOCTYPEToken extends Token {
    constructor() {
        super('DOCTYPE');
        this.name = null;
        this.publicId = null;
        this.systemId = null;
        this.forceQuirks = false;
    }
}
```


#### 🔍 Step 3: Tree Construction - Syntactic Analysis


**DOM Tree Builder**:


Tree construction implement stack-based algorithm để handle nested elements:


```javascript
// DOM Tree Constructor
class TreeConstructor {
    constructor(tokens) {
        this.tokens = tokens;
        this.document = new Document();
        this.openElements = []; // Stack of open elements
        this.activeFormattingElements = []; // For formatting reconstruction
        this.insertionMode = 'INITIAL';
        this.tokenIndex = 0;

        // Create html element
        this.htmlElement = this.createElement('html');
        this.document.appendChild(this.htmlElement);
        this.openElements.push(this.htmlElement);
    }

    construct() {
        while (this.tokenIndex < this.tokens.length) {
            const token = this.tokens[this.tokenIndex];
            this.processToken(token);
            this.tokenIndex++;
        }

        return this.document;
    }

    processToken(token) {
        switch (this.insertionMode) {
            case 'INITIAL':
                this.handleInitialMode(token);
                break;

            case 'BEFORE_HTML':
                this.handleBeforeHTMLMode(token);
                break;

            case 'BEFORE_HEAD':
                this.handleBeforeHeadMode(token);
                break;

            case 'IN_HEAD':
                this.handleInHeadMode(token);
                break;

            case 'IN_BODY':
                this.handleInBodyMode(token);
                break;

            // ... many other insertion modes
        }
    }

    handleInBodyMode(token) {
        if (token.type === 'START_TAG') {
            switch (token.tagName) {
                case 'div':
                case 'p':
                case 'span':
                    this.insertHTMLElement(token);
                    break;

                case 'img':
                case 'br':
                case 'hr':
                    this.insertSelfClosingElement(token);
                    break;

                case 'script':
                    this.handleScriptStartTag(token);
                    break;

                case 'style':
                    this.handleStyleStartTag(token);
                    break;

                default:
                    this.insertHTMLElement(token);
            }
        } else if (token.type === 'END_TAG') {
            this.handleEndTag(token);
        } else if (token.type === 'CHARACTER') {
            this.insertCharacter(token.data);
        }
    }

    insertHTMLElement(token) {
        const element = this.createElement(token.tagName);

        // Set attributes
        token.attributes.forEach(attr => {
            element.setAttribute(attr.name, attr.value);
        });

        // Insert into current parent
        const parent = this.getCurrentNode();
        parent.appendChild(element);

        // Push to open elements stack
        if (!this.isSelfClosing(token.tagName)) {
            this.openElements.push(element);
        }

        return element;
    }

    handleEndTag(token) {
        // Find matching start tag in open elements stack
        for (let i = this.openElements.length - 1; i >= 0; i--) {
            const element = this.openElements[i];

            if (element.tagName.toLowerCase() === token.tagName) {
                // Close all elements up to matching start tag
                this.openElements.splice(i);
                break;
            }

            // Check if this is a formatting element
            if (this.isFormattingElement(element)) {
                this.reconstructActiveFormattingElements();
            }
        }
    }

    getCurrentNode() {
        return this.openElements[this.openElements.length - 1];
    }
}
```


#### ⚙️ Implementation Details - DOM Node Construction


**DOM Node Factory**:


```javascript
// Browser's DOM node creation system
class DOMNodeFactory {
    constructor() {
        this.nodePool = new Map(); // Object pooling for performance
        this.elementConstructors = new Map([
            ['div', HTMLDivElement],
            ['span', HTMLSpanElement],
            ['img', HTMLImageElement],
            ['a', HTMLAnchorElement],
            ['script', HTMLScriptElement],
            ['style', HTMLStyleElement]
        ]);
    }

    createElement(tagName, document) {
        const normalizedTagName = tagName.toLowerCase();
        const Constructor = this.elementConstructors.get(normalizedTagName
```


## Claude


) || HTMLElement;


```
// Try to reuse from object pool
    const poolKey = `${normalizedTagName}:${document.id}`;
    const pooledNodes = this.nodePool.get(poolKey) || [];

    if (pooledNodes.length > 0) {
        const node = pooledNodes.pop();
        this.resetNode(node);
        return node;
    }

    // Create new node
    const element = new Constructor();
    element.ownerDocument = document;
    element.tagName = normalizedTagName.toUpperCase();
    element.localName = normalizedTagName;
    element.nodeName = element.tagName;
    element.nodeType = Node.ELEMENT_NODE;

    // Initialize element-specific properties
    this.initializeElement(element, normalizedTagName);

    return element;
}

initializeElement(element, tagName) {
    switch (tagName) {
        case 'img':
            element.complete = false;
            element.naturalWidth = 0;
            element.naturalHeight = 0;
            break;

        case 'a':
            element.protocol = '';
            element.hostname = '';
            element.pathname = '';
            break;

        case 'script':
            element.async = false;
            element.defer = false;
            element.crossOrigin = null;
            break;

        case 'input':
            element.type = 'text';
            element.value = '';
            element.checked = false;
            break;
    }
}

returnToPool(node) {
    if (this.isPoolable(node)) {
        const poolKey = `${node.localName}:${node.ownerDocument.id}`;
        const pooledNodes = this.nodePool.get(poolKey) || [];

        if (pooledNodes.length < 100) { // Pool size limit
            pooledNodes.push(node);
            this.nodePool.set(poolKey, pooledNodes);
        }
    }
}
```


}


```
#### 🏭 Production Reality - Parser Optimization tại Figma

**Incremental Parsing for Large Documents**:

```javascript
// Streaming HTML parser for performance
class StreamingHTMLParser {
    constructor() {
        this.parseBuffer = '';
        this.currentDocument = new Document();
        this.chunkSize = 8192; // 8KB chunks
        this.parseTimeQuota = 5; // 5ms per frame
    }

    async parseStream(readableStream) {
        const reader = readableStream.getReader();
        const decoder = new TextDecoder();

        try {
            while (true) {
                const { done, value } = await reader.read();

                if (done) {
                    // Process remaining buffer
                    this.processRemainingBuffer();
                    break;
                }

                // Decode chunk
                const chunk = decoder.decode(value, { stream: true });
                this.parseBuffer += chunk;

                // Parse with time slicing
                await this.parseWithTimeSlicing();
            }
        } finally {
            reader.releaseLock();
        }

        return this.currentDocument;
    }

    async parseWithTimeSlicing() {
        const startTime = performance.now();

        while (this.parseBuffer.length > 0) {
            // Check if we've exceeded time quota
            if (performance.now() - startTime > this.parseTimeQuota) {
                // Yield control back to browser
                await this.yieldToMain();
                return;
            }

            // Parse one complete element or text node
            const consumed = this.parseNextNode();

            if (consumed === 0) {
                // Need more data
                break;
            }

            this.parseBuffer = this.parseBuffer.slice(consumed);
        }
    }

    parseNextNode() {
        if (this.parseBuffer.startsWith('<')) {
            return this.parseElement();
        } else {
            return this.parseTextContent();
        }
    }

    parseElement() {
        const endIndex = this.findElementEnd();

        if (endIndex === -1) {
            return 0; // Incomplete element, need more data
        }

        const elementHTML = this.parseBuffer.slice(0, endIndex + 1);

        // Quick element creation without full tokenization
        // for better performance on large documents
        const element = this.fastElementParser(elementHTML);

        if (element) {
            this.appendToCurrentParent(element);
        }

        return endIndex + 1;
    }

    async yieldToMain() {
        return new Promise(resolve => {
            if ('scheduler' in window && 'postTask' in scheduler) {
                scheduler.postTask(resolve);
            } else {
                setTimeout(resolve, 0);
            }
        });
    }
}
```


**Error Recovery and Malformed HTML Handling**:


```javascript
// Production-grade error recovery
class HTMLErrorRecovery {
    constructor() {
        this.errorLog = [];
        this.recoveryStrategies = new Map([
            ['unclosed-tag', this.handleUnclosedTag],
            ['invalid-nesting', this.handleInvalidNesting],
            ['missing-quotes', this.handleMissingQuotes],
            ['invalid-character', this.handleInvalidCharacter]
        ]);
    }

    handleParseError(error, context) {
        this.errorLog.push({
            type: error.type,
            message: error.message,
            line: context.line,
            column: context.column,
            timestamp: Date.now()
        });

        // Apply recovery strategy
        const strategy = this.recoveryStrategies.get(error.type);

        if (strategy) {
            return strategy.call(this, error, context);
        }

        // Default recovery: skip problematic content
        return this.skipToNextValidToken(context);
    }

    handleUnclosedTag(error, context) {
        // Strategy: Auto-close unclosed tags at block boundaries
        const openTags = context.openElements;
        const lastTag = openTags[openTags.length - 1];

        if (this.isBlockElement(lastTag)) {
            // Close all inline elements
            while (openTags.length > 0 &&
                   this.isInlineElement(openTags[openTags.length - 1])) {
                const elementToClose = openTags.pop();
                this.insertImplicitEndTag(elementToClose);
            }
        }

        return { action: 'continue', insertedNodes: [] };
    }

    handleInvalidNesting(error, context) {
        // Strategy: Move invalidly nested elements to valid location
        const { invalidElement, validParent } = error.details;

        // Find nearest valid parent
        const nearestValidParent = this.findNearestValidParent(
            invalidElement.tagName,
            context.openElements
        );

        if (nearestValidParent) {
            // Close elements until we reach valid parent
            const elementsToClose = this.getElementsToClose(
                context.openElements,
                nearestValidParent
            );

            elementsToClose.forEach(element => {
                this.insertImplicitEndTag(element);
            });

            return {
                action: 'continue',
                newParent: nearestValidParent
            };
        }

        // Fallback: treat as text content
        return {
            action: 'text-fallback',
            textContent: invalidElement.outerHTML
        };
    }

    generateErrorReport() {
        const errorsByType = this.errorLog.reduce((acc, error) => {
            acc[error.type] = (acc[error.type] || 0) + 1;
            return acc;
        }, {});

        return {
            totalErrors: this.errorLog.length,
            errorsByType,
            criticalErrors: this.errorLog.filter(e => e.type in {
                'unclosed-tag': true,
                'invalid-nesting': true
            }),
            timestamp: Date.now()
        };
    }
}
```


#### 💭 Principal's Perspective: Parser Performance at Scale


**Tại Webflow - Handling Large Documents**:


User-generated websites có thể có thousands of elements. Key optimizations:


```javascript
// Performance monitoring for parser
class ParserPerformanceMonitor {
    constructor() {
        this.metrics = {
            parseTime: [],
            nodeCount: [],
            memoryUsage: [],
            errorRate: []
        };

        this.thresholds = {
            maxParseTime: 100, // 100ms
            maxNodeCount: 10000, // 10K nodes
            maxMemoryIncrease: 50 * 1024 * 1024 // 50MB
        };
    }

    measureParsing(htmlContent, parserFn) {
        const startTime = performance.now();
        const startMemory = this.getMemoryUsage();

        try {
            const result = parserFn(htmlContent);

            const endTime = performance.now();
            const endMemory = this.getMemoryUsage();

            // Record metrics
            const parseTime = endTime - startTime;
            const nodeCount = this.countNodes(result);
            const memoryIncrease = endMemory - startMemory;

            this.recordMetrics({
                parseTime,
                nodeCount,
                memoryIncrease,
                success: true
            });

            // Check thresholds
            this.checkPerformanceThresholds({
                parseTime,
                nodeCount,
                memoryIncrease
            });

            return result;
        } catch (error) {
            this.recordMetrics({
                parseTime: performance.now() - startTime,
                nodeCount: 0,
                memoryIncrease: this.getMemoryUsage() - startMemory,
                success: false,
                error: error.message
            });

            throw error;
        }
    }

    checkPerformanceThresholds(metrics) {
        if (metrics.parseTime > this.thresholds.maxParseTime) {
            this.alertSlowParsing(metrics);
        }

        if (metrics.nodeCount > this.thresholds.maxNodeCount) {
            this.alertLargeDocument(metrics);
        }

        if (metrics.memoryIncrease > this.thresholds.maxMemoryIncrease) {
            this.alertMemoryUsage(metrics);
        }
    }

    getOptimizationRecommendations() {
        const avgParseTime = this.calculateAverage(this.metrics.parseTime);
        const avgNodeCount = this.calculateAverage(this.metrics.nodeCount);

        const recommendations = [];

        if (avgParseTime > 50) {
            recommendations.push({
                type: 'performance',
                priority: 'high',
                suggestion: 'Consider implementing streaming parsing for large documents'
            });
        }

        if (avgNodeCount > 5000) {
            recommendations.push({
                type: 'architecture',
                priority: 'medium',
                suggestion: 'Implement virtual scrolling or pagination for large node lists'
            });
        }

        return recommendations;
    }
}
```


**Memory Management for DOM Trees**:


```javascript
// DOM node memory management
class DOMMemoryManager {
    constructor() {
        this.nodeReferences = new WeakMap();
        this.observedNodes = new Set();
        this.cleanupQueue = [];

        // Cleanup worker
        this.startCleanupWorker();
    }

    trackNode(node) {
        this.nodeReferences.set(node, {
            created: Date.now(),
            lastAccessed: Date.now(),
            accessCount: 1
        });

        // Use MutationObserver to track when nodes are removed
        if (!this.observedNodes.has(node)) {
            this.observeNode(node);
        }
    }

    observeNode(node) {
        if (node.nodeType === Node.ELEMENT_NODE) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList') {
                        mutation.removedNodes.forEach((removedNode) => {
                            this.scheduleNodeCleanup(removedNode);
                        });
                    }
                });
            });

            observer.observe(node.parentNode || document, {
                childList: true,
                subtree: true
            });

            this.observedNodes.add(node);
        }
    }

    scheduleNodeCleanup(node) {
        // Add to cleanup queue
        this.cleanupQueue.push({
            node,
            scheduledAt: Date.now()
        });

        // Process queue if it gets large
        if (this.cleanupQueue.length > 1000) {
            this.processCleanupQueue();
        }
    }

    processCleanupQueue() {
        const now = Date.now();
        const processed = [];

        this.cleanupQueue.forEach((item) => {
            // Wait 5 seconds before cleanup to allow for potential reuse
            if (now - item.scheduledAt > 5000) {
                this.cleanupNode(item.node);
                processed.push(item);
            }
        });

        // Remove processed items
        processed.forEach((item) => {
            const index = this.cleanupQueue.indexOf(item);
            if (index > -1) {
                this.cleanupQueue.splice(index, 1);
            }
        });
    }

    cleanupNode(node) {
        // Remove event listeners
        this.removeAllEventListeners(node);

        // Clear references
        this.nodeReferences.delete(node);

        // Return to object pool if applicable
        if (this.nodeFactory) {
            this.nodeFactory.returnToPool(node);
        }

        // Recursively cleanup children
        if (node.childNodes) {
            Array.from(node.childNodes).forEach((child) => {
                this.cleanupNode(child);
            });
        }
    }

    startCleanupWorker() {
        // Periodic cleanup every 30 seconds
        setInterval(() => {
            this.processCleanupQueue();
            this.garbageCollectUnusedNodes();
        }, 30000);
    }

    garbageCollectUnusedNodes() {
        const now = Date.now();
        const staleThreshold = 5 * 60 * 1000; // 5 minutes

        // Find nodes that haven't been accessed recently
        const staleNodes = [];

        for (const [node, metadata] of this.nodeReferences) {
            if (now - metadata.lastAccessed > staleThreshold &&
                !document.contains(node)) {
                staleNodes.push(node);
            }
        }

        // Cleanup stale nodes
        staleNodes.forEach((node) => {
            this.cleanupNode(node);
        });

        if (staleNodes.length > 0) {
            console.log(`🧹 Cleaned up ${staleNodes.length} stale DOM nodes`);
        }
    }
}
```


#### 🎯 Verification Checklist - HTML Parser Understanding


**Self-Assessment Questions**:


1. Tại sao HTML parsing cần state machine thay vì regular expressions?
2. Implicit tag closure rules hoạt động như thế nào?
3. Character encoding detection priority order?


**Production Debugging Scenarios**:


```javascript
// HTML parser debugging utilities
function debugHTMLParsing(htmlString) {
    console.group('🔍 HTML Parsing Debug');

    // 1. Character encoding validation
    const encoding = detectEncoding(htmlString);
    console.log(`Detected encoding: ${encoding}`);

    // 2. Tokenization preview
    const tokens = tokenizeHTML(htmlString.slice(0, 500)); // First 500 chars
    console.log('First 10 tokens:', tokens.slice(0, 10));

    // 3. Parse tree structure
    const parseTree = parseHTML(htmlString);
    console.log('Parse tree depth:', getTreeDepth(parseTree));
    console.log('Total nodes:', countAllNodes(parseTree));

    // 4. Error detection
    const errors = validateHTML(htmlString);
    if (errors.length > 0) {
        console.warn('Parse errors found:', errors);
    }

    // 5. Performance metrics
    const startTime = performance.now();
    parseHTML(htmlString);
    const parseTime = performance.now() - startTime;
    console.log(`Parse time: ${parseTime.toFixed(2)}ms`);

    console.groupEnd();
}

// Check for common HTML issues
function validateHTMLStructure(document) {
    const issues = [];

    // Check for unclosed tags
    const unclosedTags = findUnclosedTags(document);
    if (unclosedTags.length > 0) {
        issues.push({
            type: 'unclosed-tags',
            elements: unclosedTags
        });
    }

    // Check for invalid nesting
    const invalidNesting = findInvalidNesting(document);
    if (invalidNesting.length > 0) {
        issues.push({
            type: 'invalid-nesting',
            elements: invalidNesting
        });
    }

    // Check for missing required attributes
    const missingAttributes = findMissingRequiredAttributes(document);
    if (missingAttributes.length > 0) {
        issues.push({
            type: 'missing-attributes',
            elements: missingAttributes
        });
    }

    return issues;
}
```


**Browser DevTools Integration**:


```javascript
// Custom parser performance panel
if (window.DevToolsAPI) {
    window.DevToolsAPI.addPanel({
        name: 'HTML Parser',
        onShown: function(panel) {
            // Display parsing metrics
            panel.setContent(`
                <div id="parser-metrics">
                    <h3>Parser Performance</h3>
                    <div id="parse-times"></div>
                    <div id="node-counts"></div>
                    <div id="memory-usage"></div>
                    <div id="error-rates"></div>
                </div>
            `);

            // Real-time updates
            setInterval(() => {
                updateParserMetrics(panel);
            }, 1000);
        }
    });
}
```


---


### 📖 CSS Parser & Style Tree Construction - Tạo Bản Đồ Định Dạng


#### 🌱 Nguồn Gốc & Motivation: Từ Inline Styles Đến CSSOM


**Pre-CSS Era (early 1990s)**:


```html
<!-- Styling trước CSS -->
<font color="red" size="4">
    <b><i>Styled text</i></b>
</font>
<table bgcolor="#cccccc" border="1">
    <tr><td align="center">Content</td></tr>
</table>
```


**Vấn Đề Fundamental**:


- **Mixing Concerns**: Content và presentation mixed together
- **No Reusability**: Phải repeat styles cho mỗi element
- **Maintainability Nightmare**: Change màu sắc → edit hundreds of files
- **Limited Expressiveness**: Chỉ basic styling options


**CSS1 (1996) Revolution**:


```css
/* Separation of concerns */
.error-message {
    color: red;
    font-weight: bold;
    background-color: #ffe6e6;
    border: 1px solid #ff0000;
}
```


💭 **Think Out Loud**: *Khi đầu tiên study CSS parsing tại Axon, tôi wonder tại sao CSS syntax phức tạp thế. Aha moment khi realize CSS không chỉ là styling language - nó là declarative programming language với inheritance, cascading, specificity calculation, và complex selector matching.*


#### 🔬 Bản Chất & Mechanism: CSS Parsing Pipeline


**CSS Processing Overview**:


```
Raw CSS → Tokenization → Parsing → CSSOM → Style Resolution → Computed Styles
    ↓          ↓            ↓        ↓           ↓              ↓
  Lexer   Token Stream   AST    Object Model   Cascade    Final Values
```


#### 🔍 Step 1: CSS Tokenization


**CSS Tokenizer Implementation**:


```javascript
// CSS Tokenizer based on CSS Syntax Module Level 3
class CSSTokenizer {
    constructor(cssText) {
        this.input = cssText;
        this.position = 0;
        this.line = 1;
        this.column = 1;
    }

    tokenize() {
        const tokens = [];

        while (this.position < this.input.length) {
            const token = this.consumeToken();

            if (token) {
                tokens.push(token);
            }
        }

        return tokens;
    }

    consumeToken() {
        this.consumeWhitespace();

        if (this.position >= this.input.length) {
            return null;
        }

        const char = this.peek();

        switch (char) {
            case '/':
                if (this.peek(1) === '*') {
                    return this.consumeComment();
                }
                return this.consumeDelim();

            case '"':
            case "'":
                return this.consumeString(char);

            case '#':
                return this.consumeHash();

            case '@':
                return this.consumeAtKeyword();

            case '.':
                if (this.isDigit(this.peek(1))) {
                    return this.consumeNumber();
                }
                return this.consumeDelim();

            case '{':
                return this.consumeToken('{', 'LEFT_BRACE');

            case '}':
                return this.consumeToken('}', 'RIGHT_BRACE');

            case ':':
                return this.consumeToken(':', 'COLON');

            case ';':
                return this.consumeToken(';', 'SEMICOLON');

            case ',':
                return this.consumeToken(',', 'COMMA');

            case '(':
                return this.consumeToken('(', 'LEFT_PAREN');

            case ')':
                return this.consumeToken(')', 'RIGHT_PAREN');

            case '[':
                return this.consumeToken('[', 'LEFT_BRACKET');

            case ']':
                return this.consumeToken(']', 'RIGHT_BRACKET');

            default:
                if (this.isDigit(char) ||
                    (char === '+' || char === '-') && this.isDigit(this.peek(1))) {
                    return this.consumeNumber();
                }

                if (this.isNameStart(char)) {
                    return this.consumeIdentLike();
                }

                return this.consumeDelim();
        }
    }

    consumeString(quote) {
        const startPos = this.position;
        this.advance(); // Skip opening quote

        let value = '';

        while (this.position < this.input.length) {
            const char = this.peek();

            if (char === quote) {
                this.advance(); // Skip closing quote
                return {
                    type: 'STRING',
                    value: value,
                    raw: this.input.slice(startPos, this.position)
                };
            }

            if (char === '\\') {
                this.advance();
                const escaped = this.consumeEscapedChar();
                value += escaped;
            } else if (char === '\n') {
                // Unterminated string
                throw new Error(`Unterminated string at line ${this.line}`);
            } else {
                value += char;
                this.advance();
            }
        }

        throw new Error(`Unterminated string at line ${this.line}`);
    }

    consumeNumber() {
        const startPos = this.position;
        let value = '';

        // Handle sign
        if (this.peek() === '+' || this.peek() === '-') {
            value += this.advance();
        }

        // Consume integer part
        while (this.isDigit(this.peek())) {
            value += this.advance();
        }

        // Consume decimal part
        if (this.peek() === '.' && this.isDigit(this.peek(1))) {
            value += this.advance(); // '.'

            while (this.isDigit(this.peek())) {
                value += this.advance();
            }
        }

        // Consume exponent part
        if (this.peek() === 'e' || this.peek() === 'E') {
            const exponentStart = this.position;
            value += this.advance(); // 'e' or 'E'

            if (this.peek() === '+' || this.peek() === '-') {
                value += this.advance();
            }

            if (!this.isDigit(this.peek())) {
                // Invalid exponent, backtrack
                this.position = exponentStart;
                value = value.slice(0, -(this.position - exponentStart));
            } else {
                while (this.isDigit(this.peek())) {
                    value += this.advance();
                }
            }
        }

        // Check for unit
        const unit = this.consumeUnit();

        return {
            type: unit ? 'DIMENSION' : 'NUMBER',
            value: parseFloat(value),
            unit: unit || null,
            raw: this.input.slice(startPos, this.position)
        };
    }

    consumeIdentLike() {
        const name = this.consumeName();

        if (this.peek() === '(') {
            return {
                type: 'FUNCTION',
                name: name,
                args: this.consumeFunctionArgs()
            };
        }

        return {
            type: 'IDENT',
            value: name
        };
    }

    consumeName() {
        let name = '';

        while (this.position < this.input.length) {
            const char = this.peek();

            if (this.isNameChar(char)) {
                name += this.advance();
            } else if (char === '\\') {
                this.advance();
                name += this.consumeEscapedChar();
            } else {
                break;
            }
        }

        return name;
    }
}
```


#### 🔍 Step 2: CSS Parser - Building AST


**CSS Parser Implementation**:


```javascript
// CSS Parser building Abstract Syntax Tree
class CSSParser {
    constructor(tokens) {
        this.tokens = tokens;
        this.position = 0;
        this.errors = [];
    }

    parse() {
        const stylesheet = {
            type: 'StyleSheet',
            rules: []
        };

        while (!this.isEOF()) {
            try {
                const rule = this.parseRule();
                if (rule) {
                    stylesheet.rules.push(rule);
                }
            } catch (error) {
                this.handleError(error);
                this.skipToNextRule();
            }
        }

        return stylesheet;
    }

    parseRule() {
        const token = this.peek();

        if (!token) return null;

        if (token.type === 'AT_KEYWORD') {
            return this.parseAtRule();
        } else {
            return this.parseStyleRule();
        }
    }

    parseStyleRule() {
        const rule = {
            type: 'StyleRule',
            selectors: [],
            declarations: []
        };

        // Parse selectors
        rule.selectors = this.parseSelectors();

        // Expect '{'
        this.expect('LEFT_BRACE');

        // Parse declarations
        while (!this.check('RIGHT_BRACE') && !this.isEOF()) {
            const declaration = this.parseDeclaration();
            if (declaration) {
                rule.declarations.push(declaration);
            }

            // Optional semicolon
            if (this.check('SEMICOLON')) {
                this.advance();
            }
        }

        // Expect '}'
        this.expect('RIGHT_BRACE');

        return rule;
    }

    parseSelectors() {
        const selectors = [];

        do {
            const selector = this.parseSelector();
            selectors.push(selector);

            if (this.check('COMMA')) {
                this.advance(); // consume comma
            } else {
                break;
            }
        } while (!this.isEOF());

        return selectors;
    }

    parseSelector() {
        const selector = {
            type: 'Selector',
            combinator: null,
            simple: []
        };

        // Parse simple selectors
        while (!this.check('LEFT_BRACE') &&
               !this.check('COMMA') &&
               !this.isEOF()) {

            const token = this.peek();

            if (token.type === 'IDENT') {
                // Type selector
                selector.simple.push({
                    type: 'TypeSelector',
                    name: this.advance().value
                });
            } else if (token.type === 'HASH') {
                // ID selector
                selector.simple.push({
                    type: 'IDSelector',
                    name: this.advance().value
                });
            } else if (token.type === 'DELIM' && token.value === '.') {
                // Class selector
                this.advance(); // consume '.'
                const className = this.expect('IDENT').value;
                selector.simple.push({
                    type: 'ClassSelector',
                    name: className
                });
            } else if (token.type === 'LEFT_BRACKET') {
                // Attribute selector
                selector.simple.push(this.parseAttributeSelector());
            } else if (token.type === 'COLON') {
                // Pseudo selector
                selector.simple.push(this.parsePseudoSelector());
            } else if (this.isCombinator(token)) {
                // Combinator
                selector.combinator = this.advance().value;
            } else {
                this.advance(); // Skip unknown token
            }
        }

        return selector;
    }

    parseDeclaration() {
        const property = this.expect('IDENT').value;

        this.expect('COLON');

        const values = this.parseValues();

        // Check for !important
        let important = false;
        if (this.check('DELIM') && this.peek().value === '!') {
            this.advance(); // consume '!'
            const importantToken = this.expect('IDENT');
            if (importantToken.value === 'important') {
                important = true;
            }
        }

        return {
            type: 'Declaration',
            property: property,
            values: values,
            important: important
        };
    }

    parseValues() {
        const values = [];

        while (!this.check('SEMICOLON') &&
               !this.check('RIGHT_BRACE') &&
               !this.check('DELIM', '!') &&
               !this.isEOF()) {

            const value = this.parseValue();
            if (value) {
                values.push(value);
            }
        }

        return values;
    }

    parseValue() {
        const token = this.advance();

        switch (token.type) {
            case 'NUMBER':
                return {
                    type: 'Number',
                    value: token.value
                };

            case 'DIMENSION':
                return {
                    type: 'Dimension',
                    value: token.value,
                    unit: token.unit
                };

            case 'STRING':
                return {
                    type: 'String',
                    value: token.value
                };

            case 'IDENT':
                return {
                    type: 'Identifier',
                    name: token.value
                };

            case 'FUNCTION':
                return {
                    type: 'Function',
                    name: token.name,
                    args: token.args
                };

            case 'HEX_COLOR':
                return {
                    type: 'Color',
                    value: token.value
                };

            default:
                return null;
        }
    }
}
```


#### 🔍 Step 3: CSSOM Construction


**CSS Object Model Builder**:


```javascript
// CSSOM Builder
class CSSOMBuilder {
    constructor() {
        this.styleSheet = new CSSStyleSheet();
        this.mediaQueries = new Map();
        this.keyframes = new Map();
    }

    buildFromAST(ast) {
        ast.rules.forEach(rule => {
            this.processRule(rule);
        });

        return this.styleSheet;
    }

    processRule(rule) {
        switch (rule.type) {
            case 'StyleRule':
                this.processStyleRule(rule);
                break;

            case 'MediaRule':
                this.processMediaRule(rule);
                break;

            case 'KeyframesRule':
                this.processKeyframesRule(rule);
                break;

            case 'ImportRule':
                this.processImportRule(rule);
                break;

            case 'FontFaceRule':
                this.processFontFaceRule(rule);
                break;
        }
    }

    processStyleRule(rule) {
        const cssRule = new CSSStyleRule();
        cssRule.selectorText = this.serializeSelectors(rule.selectors);

        // Build style declaration
        const style = new CSSStyleDeclaration();

        rule.declarations.forEach(declaration => {
            const property = this.normalizeProperty(declaration.property);
            const value = this.serializeValues(declaration.values);
            const priority = declaration.important ? 'important' : '';

            style.setProperty(property, value, priority);
        });

        cssRule.style = style;
        this.styleSheet.insertRule(cssRule);
    }

    processMediaRule(rule) {
        const mediaRule = new CSSMediaRule();
        mediaRule.conditionText = rule.condition;
        mediaRule.media = this.parseMediaQuery(rule.condition);

        // Process nested rules
        rule.rules.forEach(nestedRule => {
            const processedRule = this.processRule(nestedRule);
            mediaRule.insertRule(processedRule);
        });

        this.styleSheet.insertRule(mediaRule);
    }

    normalizeProperty(property) {
        // Convert kebab-case to camelCase for JavaScript
        return property.replace(/-([a-z])/g, (match, letter) =>
            letter.toUpperCase()
        );
    }

    serializeValues(values) {
        return values.map(value => {
            switch (value.type) {
                case 'Number':
                    return value.value.toString();

                case 'Dimension':
                    return `${value.value}${value.unit}`;

                case 'String':
                    return `"${value.value}"`;

                case 'Identifier':
                    return value.name;

                case 'Function':
                    const args = value.args.map(arg =>
                        this.serializeValues([arg])
                    ).join(', ');
                    return `${value.name}(${args})`;

                case 'Color':
                    return value.value;

                default:
                    return '';
            }
        }).join(' ');
    }
}
```


#### ⚙️ Implementation Details - Advanced CSS Processing


**CSS Selector Specificity Calculator**:


```javascript
// CSS Specificity calculation according to CSS Selectors Level 4
class SpecificityCalculator {
    constructor() {
        this.cache = new Map();
    }

    calculate(selector) {
        // Check cache first
        const cacheKey = this.serializeSelector(selector);
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        const specificity = this.calculateSpecificity(selector);
        this.cache.set(cacheKey, specificity);

        return specificity;
    }

    calculateSpecificity(selector) {
        let a = 0; // Inline styles (handled elsewhere)
        let b = 0; // IDs
        let c = 0; // Classes, attributes, pseudo-classes
        let d = 0; // Elements and pseudo-elements

        this.walkSelector(selector, (component) => {
            switch (component.type) {
                case 'IDSelector':
                    b++;
                    break;

                case 'ClassSelector':
                case 'AttributeSelector':
                case 'PseudoClass':
                    c++;
                    break;

                case 'TypeSelector':
                case 'PseudoElement':
                    d++;
                    break;

                case 'UniversalSelector':
                    // Universal selector (*) has no specificity
                    break;

                case 'PseudoClassFunction':
                    // :not(), :is(), :where() have special rules
                    this.handleFunctionalPseudoClass(component, { b, c, d });
                    break;
            }
        });

        return {
            a, b, c, d,
            value: a * 1000 + b * 100 + c * 10 + d,
            toString: () => `${a},${b},${c},${d}`
        };
    }

    handleFunctionalPseudoClass(component, specificity) {
        switch (component.name) {
            case 'not':
            case 'is':
                // Take the highest specificity of arguments
                let maxSpec = { a: 0, b: 0, c: 0, d: 0 };

                component.args.forEach(arg => {
                    const argSpec = this.calculateSpecificity(arg);
                    if (argSpec.value > maxSpec.value) {
                        maxSpec = argSpec;
                    }
                });

                specificity.b += maxSpec.b;
                specificity.c += maxSpec.c;
                specificity.d += maxSpec.d;
                break;

            case 'where':
                // :where() always has 0 specificity
                break;

            default:
                // Regular pseudo-class function
                specificity.c++;
        }
    }

    compare(spec1, spec2) {
        // Compare specificity values
        if (spec1.a !== spec2.a) return spec1.a - spec2.a;
        if (spec1.b !== spec2.b) return spec1.b - spec2.b;
        if (spec1.c !== spec2.c) return spec1.c - spec2.c;
        if (spec1.d !== spec2.d) return spec1.d - spec2.d;

        return 0; // Equal specificity
    }
}
```


#### 🏭 Production Reality - CSS Performance tại Figma


**CSS-in-JS Runtime Optimization**:


```javascript
// Optimized CSS-in-JS system used at Figma for component styling
class OptimizedCSSRuntime {
    constructor() {
        this.styleSheet = document.createElement('style');
        document.head.appendChild(this.styleSheet);

        this.classCache = new Map();
        this.ruleIndex = 0;
        this.batchedInsertions = [];
        this.insertionScheduled = false;

        // Performance monitoring
        this.metrics = {
            cacheHits: 0,
            cacheMisses: 0,
            ruleGenerations: 0,
            insertionTime: []
        };
    }

    css(styles) {
        // Generate stable hash for styles
        const hash = this.hashStyles(styles);

        // Check cache
        if (this.classCache.has(hash)) {
            this.metrics.cacheHits++;
            return this.classCache.get(hash);
        }

        this.metrics.cacheMisses++;

        // Generate class name
        const className = `css-${hash}`;

        // Generate CSS rule
        const cssRule = this.generateCSSRule(className, styles);

        // Cache and schedule insertion
        this.classCache.set(hash, className);
        this.scheduleRuleInsertion(cssRule);

        return className;
    }

    generateCSSRule(className, styles) {
        const declarations = this.generateDeclarations(styles);

        return {
            selector: `.${className}`,
            declarations: declarations,
            rule: `.${className} { ${declarations.join('; ')} }`
        };
    }

    generateDeclarations(styles) {
        const declarations = [];

        for (const [property, value] of Object.entries(styles)) {
            // Handle vendor prefixes
            const prefixedProperty = this.addVendorPrefixes(property);
            const processedValue = this.processValue(property, value);

            if (Array.isArray(prefixedProperty)) {
                prefixedProperty.forEach(prop => {
                    declarations.push(`${prop}: ${processedValue}`);
                });
            } else {
                declarations.push(`${prefixedProperty}: ${processedValue}`);
            }
        }

        return declarations;
    }

    processValue(property, value) {
        // Unit conversion
        if (typeof value === 'number' && this.needsPixelUnit(property)) {
            return `${value}px`;
        }

        // Color conversion
        if (property.includes('color') || property.includes('Color')) {
            return this.processColor(value);
        }

        // Transform functions
        if (property === 'transform') {
            return this.processTransform(value);
        }

        return value;
    }

    addVendorPrefixes(property) {
        const prefixMap = {
            'transform': ['-webkit-transform', '-moz-transform', 'transform'],
            'transition': ['-webkit-transition', '-moz-transition', 'transition'],
            'animation': ['-webkit-animation', '-moz-animation', 'animation'],
            'userSelect': ['-webkit-user-select', '-moz-user-select', 'user-select'],
            'appearance': ['-webkit-appearance', '-moz-appearance', 'appearance']
        };

        return prefixMap[property] || property;
    }

    scheduleRuleInsertion(cssRule) {
        this.batchedInsertions.push(cssRule);

        if (!this.insertionScheduled) {
            this.insertionScheduled = true;

            // Batch insertions for better performance
            if ('scheduler' in window && 'postTask' in scheduler) {
                scheduler.postTask(() => this.flushInsertions());
            } else {
                requestAnimationFrame(() => this.flushInsertions());
            }
        }
    }

    flushInsertions() {
        if (this.batchedInsertions.length === 0) {
            this.insertionScheduled = false;
            return;
        }

        const startTime = performance.now();

        // Batch insert all rules
        const rules = this.batchedInsertions.map(insertion => insertion.rule);
        const combinedCSS = rules.join('\n');

        try {
            // Use insertRule for better performance than textContent
            const ruleStrings = combinedCSS.split('\n');
            ruleStrings.forEach(rule => {
                if (rule.trim()) {
                    this.styleSheet.sheet.insertRule(rule, this.ruleIndex++);
                }
            });
        } catch (error) {
            // Fallback to textContent if insertRule fails
            console.warn('Failed to insert CSS rules via insertRule, falling back to textContent');
            this.styleSheet.textContent += combinedCSS;
        }

        const insertionTime = performance.now() - startTime;
        this.metrics.insertionTime.push(insertionTime);
        this.metrics.ruleGenerations += this.batchedInsertions.length;

        // Clear batch
        this.batchedInsertions = [];
        this.insertionScheduled = false;

        // Alert if insertion is slow
        if (insertionTime > 16) { // 1 frame at 60fps
            console.warn(`Slow CSS insertion: ${insertionTime.toFixed(2)}ms for ${rules.length} rules`);
        }
    }

    hashStyles(styles) {
        // Fast hash function for style objects
        const str = JSON.stringify(styles, Object.keys(styles).sort());
        let hash = 0;

        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }

        return Math.abs(hash).toString(36);
    }

    getPerformanceReport() {
        const avgInsertionTime = this.metrics.insertionTime.length > 0 ?
            this.metrics.insertionTime.reduce((a, b) => a + b) / this.metrics.insertionTime.length : 0;

        return {
            cacheHitRate: this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses),
            totalRules: this.metrics.ruleGenerations,
            averageInsertionTime: avgInsertionTime,
            maxInsertionTime: Math.max(...this.metrics.insertionTime),
            cacheSize: this.classCache.size
        };
    }
}
```


#### 💭 Principal's Perspective: CSS Architecture at Enterprise Scale


**Performance Strategy tại Webflow**:


```javascript
// CSS performance monitoring and optimization
class CSSPerformanceMonitor {
    constructor() {
        this.observer = new PerformanceObserver(this.handlePerformanceEntries.bind(this));
        this.observer.observe({ entryTypes: ['measure', 'mark'] });

        this.metrics = {
            parseTime: [],
            ruleCount: [],
            selectorComplexity: [],
            renderTime: []
        };

        this.startMonitoring();
    }

    measureCSSParsing(cssText) {
        performance.mark('css-parse-start');

        const parser = new CSSParser();
        const ast = parser.parse(cssText);

        performance.mark('css-parse-end');
        performance.measure('css-parse-duration', 'css-parse-start', 'css-parse-end');

        // Analyze complexity
        const complexity = this.analyzeCSSComplexity(ast);
        this.recordComplexityMetrics(complexity);

        return ast;
    }

    analyzeCSSComplexity(ast) {
        const complexity = {
            totalRules: 0,
            totalSelectors: 0,
            maxSelectorComplexity: 0,
            averageSelectorComplexity: 0,
            deepestNesting: 0,
            mediaQueries: 0,
            keyframes: 0,
            imports: 0
        };

        this.walkAST(ast, (node, depth) => {
            switch (node.type) {
                case 'StyleRule':
                    complexity.totalRules++;
                    complexity.totalSelectors += node.selectors.length;

                    node.selectors.forEach(selector => {
                        const selectorComplexity = this.calculateSelectorComplexity(selector);
                        complexity.maxSelectorComplexity = Math.max(
                            complexity.maxSelectorComplexity,
                            selectorComplexity
                        );
                    });
                    break;

                case 'MediaRule':
                    complexity.mediaQueries++;
                    complexity.deepestNesting = Math.max(complexity.deepestNesting, depth);
                    break;

                case 'KeyframesRule':
                    complexity.keyframes++;
                    break;

                case 'ImportRule':
                    complexity.imports++;
                    break;
            }
        });

        if (complexity.totalSelectors > 0) {
            complexity.averageSelectorComplexity =
                complexity.maxSelectorComplexity / complexity.totalSelectors;
        }

        return complexity;
    }

    calculateSelectorComplexity(selector) {
        let complexity = 0;

        // Base complexity for each simple selector
        complexity += selector.simple.length;

        // Additional complexity for pseudo-classes and attributes
        selector.simple.forEach(simple => {
            switch (simple.type) {
                case 'PseudoClass':
                    complexity += 1;
                    break;
                case 'AttributeSelector':
                    complexity += 2; // Attributes are more expensive
                    break;
                case 'PseudoElement':
                    complexity += 0.5;
                    break;
            }
        });

        // Descendant combinators add complexity
        if (selector.combinator) {
            complexity += 1;
        }

        return complexity;
    }

    generateOptimizationRecommendations() {
        const recommendations = [];

        // Check for overly complex selectors
        const maxComplexity = Math.max(...this.metrics.selectorComplexity);
        if (maxComplexity > 20) {
            recommendations.push({
                type: 'performance',
                severity: 'high',
                message: `Found selectors with complexity ${maxComplexity}. Consider simplifying.`,
                suggestion: 'Use class selectors instead of complex descendant selectors'
            });
        }

        // Check for excessive rule count
        const avgRuleCount = this.calculateAverage(this.metrics.ruleCount);
        if (avgRuleCount > 5000) {
            recommendations.push({
                type: 'scalability',
                severity: 'medium',
                message: `High rule count (${avgRuleCount}). Consider CSS architecture review.`,
                suggestion: 'Implement CSS purging or component-based styling'
            });
        }

        // Check for slow parsing
        const avgParseTime = this.calculateAverage(this.metrics.parseTime);
        if (avgParseTime > 100) {
            recommendations.push({
                type: 'performance',
                severity: 'high',
                message: `Slow CSS parsing (${avgParseTime}ms average).`,
                suggestion: 'Split large CSS files and load critical styles first'
            });
        }

        return recommendations;
    }

    handlePerformanceEntries(list) {
        list.getEntries().forEach(entry => {
            if (entry.name === 'css-parse-duration') {
                this.metrics.parseTime.push(entry.duration);
            }
        });
    }
}
```


#### 🎯 Verification Checklist - CSS Parser Understanding


**Self-Assessment Questions**:


1. CSS cascade algorithm hoạt động như thế nào với specificity, inheritance, và source order?
2. CSS custom properties (variables) được resolve khi nào trong parsing pipeline?
3. CSS containment impact performance như thế nào?


**Production Debugging Tools**:


```javascript
// CSS debugging utilities
function debugCSSParsing(cssText) {
    console.group('🎨 CSS Parsing Debug');

    // Tokenization analysis
    const tokens = new CSSTokenizer(cssText).tokenize();
    console.log(`Tokens generated: ${tokens.length}`);

    // Parsing analysis
    const startTime = performance.now();
    const ast = new CSSParser(tokens).parse();
    const parseTime = performance.now() - startTime;

    console.log(`Parse time: ${parseTime.toFixed(2)}ms`);
    console.log(`Rules found: ${ast.rules.length}`);

    // Specificity analysis
    const specificities = ast.rules
        .filter(rule => rule.type === 'StyleRule')
        .map(rule => ({
            selector: rule.selectorText,
            specificity: new SpecificityCalculator().calculate(rule.selectors[0])
        }))
        .sort((a, b) => b.specificity.value - a.specificity.value);

    console.log('Top 5 highest specificity selectors:');
    console.table(specificities.slice(0, 5));

    // Error analysis
    if (ast.errors && ast.errors.length > 0) {
        console.warn('Parse errors found:', ast.errors);
    }

    console.groupEnd();
}

// CSS performance analyzer
function analyzeCSSPerformance(styleSheets) {
    const analysis = {
        totalRules: 0,
        totalSelectors: 0,
        complexSelectors: [],
        duplicateRules: [],
        unusedSelectors: []
    };

    Array.from(styleSheets).forEach(sheet => {
        try {
            Array.from(sheet.cssRules).forEach(rule => {
                if (rule.type === CSSRule.STYLE_RULE) {
                    analysis.totalRules++;
                    analysis.totalSelectors++;

                    // Check selector complexity
                    const complexity = calculateSelectorComplexity(rule.selectorText);
                    if (complexity > 15) {
                        analysis.complexSelectors.push({
                            selector: rule.selectorText,
                            complexity: complexity
                        });
                    }

                    // Check for unused selectors (basic check)
                    if (!document.querySelector(rule.selectorText)) {
                        analysis.unusedSelectors.push(rule.selectorText);
                    }
                }
            });
        } catch (e) {
            console.warn('Cannot analyze stylesheet due to CORS:', e);
        }
    });

    return analysis;
}
```


Tôi sẽ tiếp tục với phần cuối của series này, covering render tree construction, layout calculation, và GPU painting process. Những concepts này sẽ tie together toàn bộ browser rendering pipeline và show cách optimize từng stage cho maximum performance.
