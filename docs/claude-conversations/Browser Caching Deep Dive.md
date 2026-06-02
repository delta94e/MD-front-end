# Browser Caching Deep Dive

## You

Continue

## Claude


# Phân Tích Chuyên Sâu: Browser Caching Mechanism - Từ URL Input Đến Page Display


*Góc nhìn Principal Front-end Engineer từ kinh nghiệm thực chiến tại NAB, Axon, Binance, Webflow, và Figma*


---


## 🚀 Lời Mở Đầu: Hành Trình Hiểu Sâu Browser Caching


Chào các bạn, tôi là một Principal Front-end Engineer đã có gần 15 năm kinh nghiệm làm việc tại các công ty công nghệ hàng đầu như NAB (National Australia Bank), Axon, Binance, Webflow, và Figma. Hôm nay, tôi sẽ cùng các bạn deep dive vào một trong những mechanism quan trọng nhất của web development: **Browser Caching**.


Bài viết tôi đang phân tích đã nêu lên các khái niệm cốt lõi, nhưng với góc nhìn của một Principal Engineer, tôi sẽ giúp các bạn hiểu sâu hơn, từ first principles đến production considerations, từ absolute beginner level đến system design implications.


### 💭 Think Out Loud: Câu Chuyện Cá Nhân


*Khi tôi mới bắt đầu career ở NAB năm 2010, tôi nghĩ browser caching chỉ đơn giản là "browser lưu file lại để load nhanh lần sau". Nhưng khi phải optimize performance cho hàng triệu users, tôi nhận ra đây là một ecosystem phức tạp với rất nhiều layers, trade-offs, và edge cases mà không phải developer nào cũng hiểu sâu.*


*Aha moment của tôi là khi debug một incident tại Binance: users báo không thấy price updates real-time, và root cause là... aggressive caching policy cho API responses! Từ đó tôi bắt đầu research sâu về cache-control headers, browser storage mechanisms, và service worker strategies.*


---


## 📚 PHẦN I: FOUNDATION LEVEL - XÂY DỰNG NỀN TẢNG HIỂU BIẾT


### 🌱 Chapter 1: Browser Architecture - The Foundation of Everything


#### 📖 Multi-Process & Multi-Thread Architecture


**🌱 Nguồn Gốc & Motivation:**


Trước khi deep dive vào caching, chúng ta cần hiểu tại sao browsers modern như Chrome lại sử dụng multi-process architecture. Đây không phải là decision tùy tiện mà là solution cho những problems fundamentals:


**Problem 1: Memory Isolation**
Trong thời đại single-process browsers (như IE6), một tab crash có thể làm toàn bộ browser crash. Imagine bạn đang checkout trên e-commerce với 20 tabs open, suddenly một tab với heavy JavaScript làm crash toàn bộ browser - disaster!


**Problem 2: Security Sandboxing**
Websites có thể access memory của nhau, tạo ra security vulnerabilities. Một malicious website có thể đọc data từ banking website khác cùng browser process.


**Problem 3: Performance Bottlenecks**
Single thread cho rendering, JavaScript execution, và network handling tạo ra performance bottlenecks. Users expect smooth 60fps animations while downloading large assets.


**🔬 Bản Chất & Mechanism:**


Chrome's process architecture từ perspective của systems design:


```
┌─────────────────────────────────────────────────────┐
│                    Main Process                     │
│                 (Browser Process)                   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│  │     UI      │ │ Navigation  │ │   Network   │   │
│  │  Management │ │   Control   │ │   Proxy     │   │
│  └─────────────┘ └─────────────┘ └─────────────┘   │
└─────────────────────────┬───────────────────────────┘
                          │
         ┌────────────────┼────────────────┐
         │                │                │
┌────────▼────────┐ ┌─────▼─────┐ ┌───────▼────────┐
│  Renderer       │ │  Network  │ │      GPU       │
│  Process        │ │  Process  │ │    Process     │
│                 │ │           │ │                │
│ ┌─────────────┐ │ │ ┌───────┐ │ │ ┌────────────┐ │
│ │    DOM      │ │ │ │ HTTP  │ │ │ │ Graphics   │ │
│ │   Engine    │ │ │ │Client │ │ │ │ Rendering  │ │
│ └─────────────┘ │ │ └───────┘ │ │ └────────────┘ │
│ ┌─────────────┐ │ │ ┌───────┐ │ │ ┌────────────┐ │
│ │     V8      │ │ │ │ Cache │ │ │ │   WebGL    │ │
│ │   Engine    │ │ │ │Manager│ │ │ │   Canvas   │ │
│ └─────────────┘ │ │ └───────┘ │ │ └────────────┘ │
└─────────────────┘ └───────────┘ └────────────────┘
```


**💡 Intuitive Understanding:**


Think về browser như một construction company:


- **Main Process** = Project Manager: coordinates everything, doesn't do heavy lifting
- **Renderer Process** = Construction Workers: actually build the house (render pages)
- **Network Process** = Supply Chain Manager: handles all material delivery (HTTP requests)
- **GPU Process** = Specialized Equipment Operator: handles heavy machinery (graphics)


**⚙️ Implementation Deep Dive:**


Khi bạn type URL vào address bar, đây là sequence of events:


1. **Browser Process receives input**
cpp// Simplified Chrome source code flow
void NavigationController::LoadURL(const GURL& url) {
  // Security checks
  if (!IsValidURL(url)) return;

  // Process selection
  SiteInstance* site_instance = GetSiteInstanceForURL(url);
  RenderProcessHost* render_process = site_instance->GetProcess();
2. **Process Selection Algorithm**
Chrome sử dụng Site Isolation policy:

Same origin = same renderer process (for performance)
Cross-origin = different renderer process (for security)
Special sites (như banking) = isolated process
3. **Memory Management**
Each process có isolated memory space:
cppclass RenderProcessHost {
  private:
    base::Process process_;              // OS process handle
    mojo::Remote<mojom::Renderer> renderer_; // IPC interface
    std::unique_ptr<ChildProcessHost> child_process_host_;


**🏭 Production Reality tại các công ty:**


**Tại NAB (Banking):**


- Site Isolation critical cho security: customer data must be isolated
- Dedicated renderer processes cho banking transactions
- Custom process priorities cho high-value operations


**Tại Binance (High-frequency trading):**


- Network process optimization cho real-time data streams
- WebSocket connections handled in isolated network threads
- GPU process acceleration cho complex charts và animations


**Tại Figma (Collaborative design):**


- Renderer process sharing cho collaborative editing
- Custom WebAssembly modules trong isolated processes
- Cross-process communication cho real-time collaboration


### 💭 Deep Understanding Process:


**Confusion tôi từng gặp:** "Tại sao browser cần quá nhiều processes? Không phải memory overhead sẽ rất lớn?"


**Aha moment:** Khi debug memory leaks tại Webflow, tôi realize rằng process isolation actually giúp garbage collection hiệu quả hơn. Khi close một tab, toàn bộ renderer process và memory của nó được OS reclaim ngay lập tức, thay vì rely on JavaScript GC.


**Common misconception:** "Multi-process = always better performance"
Actually, IPC (Inter-Process Communication) có overhead. For simple websites, single-process có thể faster, nhưng trade-off là stability và security.


---


#### 📖 Network Process - The Gateway to Caching


**🌱 Nguồn Gốc & Motivation:**


Network Process là heart of browser caching mechanism. Trước đây, network handling được spread across multiple processes, tạo ra:


- Inconsistent caching behavior
- Duplicated network requests
- Complex debugging
- Security vulnerabilities


Chrome's Network Process consolidates tất cả network operations vào single process với clear responsibilities.


**🔬 Bản Chất & Mechanism:**


Network Process architecture:


```cpp
class NetworkService {
  public:
    // HTTP Cache Management
    std::unique_ptr<HttpCache> http_cache_;

    // DNS Resolution
    std::unique_ptr<HostResolver> host_resolver_;

    // Connection Management
    std::unique_ptr<HttpNetworkSession> session_;

    // Cookie Management
    std::unique_ptr<CookieManager> cookie_manager_;

    // Certificate Handling
    std::unique_ptr<CertVerifier> cert_verifier_;
};
```


**Network Stack Layers:**


```
┌─────────────────────────────────┐
│         Application Layer       │ ← HTML, CSS, JS, Images
│            (HTTP/2)             │
├─────────────────────────────────┤
│         Transport Layer         │ ← TCP, UDP, QUIC
│           (Reliable)            │
├─────────────────────────────────┤
│         Network Layer           │ ← IP Routing
│          (Addressing)           │
├─────────────────────────────────┤
│         Data Link Layer         │ ← Ethernet, WiFi
│         (Frame Format)          │
├─────────────────────────────────┤
│         Physical Layer          │ ← Cables, Radio Waves
│        (Bit Transmission)       │
└─────────────────────────────────┘
```


**💡 Intuitive Understanding:**


Network Process giống như một mail sorting facility:


- **Incoming requests** = letters to be sent
- **HTTP Cache** = local storage room for frequently sent letters
- **DNS Resolver** = address book to convert names to street addresses
- **Connection Pool** = fleet of delivery trucks reused for efficiency
- **Security Checks** = postal inspectors checking for dangerous content


**⚙️ Implementation Deep Dive:**


HTTP Cache implementation trong Chrome:


```cpp
class HttpCache {
  private:
    // Backend storage (disk or memory)
    std::unique_ptr<HttpCacheBackend> backend_;

    // Active transactions
    std::map<std::string, HttpCacheTransaction*> active_entries_;

    // Pending requests waiting for cache lookup
    std::map<std::string, std::vector<PendingRequest>> pending_requests_;

  public:
    // Main entry point for cache lookup
    int CreateTransaction(RequestPriority priority,
                         HttpCacheTransaction** transaction) {
      // 1. Generate cache key from URL + method + headers
      std::string cache_key = GenerateCacheKey(request);

      // 2. Check if entry exists in cache
      if (backend_->HasEntry(cache_key)) {
        // 3. Validate freshness (strong cache check)
        if (IsEntryFresh(cache_key)) {
          return ServeCachedResponse(cache_key, transaction);
        }
        // 4. If stale, prepare conditional request
        else {
          return PrepareConditionalRequest(cache_key, transaction);
        }
      }

      // 5. Cache miss - create new network transaction
      return CreateNetworkTransaction(transaction);
    }
};
```


**Cache Key Generation Algorithm:**


```cpp
std::string GenerateCacheKey(const HttpRequestInfo& request) {
  std::string key;

  // Primary components
  key += request.method;                    // GET, POST, etc.
  key += "|" + request.url.spec();        // Full URL

  // Vary header considerations
  if (HasVaryHeader(request)) {
    key += "|vary:";
    for (const auto& header : GetVaryHeaders(request)) {
      key += header.first + "=" + header.second + ";";
    }
  }

  // CORS preflight considerations
  if (request.cors_preflight_policy != cors::PreflightPolicy::kPreventPreflight) {
    key += "|cors-preflight";
  }

  return base::SHA1HashString(key);  // Hash for efficiency
}
```


**🏭 Production Reality:**


**Tại Axon (Video streaming):**
Network Process optimization critical cho large video files:


- Custom cache eviction policies cho video segments
- Prioritized network queues cho real-time streams
- Bandwidth throttling integration với cache warming


**Performance metrics tracking:**


```javascript
// Custom performance monitoring
window.performance.getEntriesByType('navigation')[0].responseStart -
window.performance.getEntriesByType('navigation')[0].requestStart
// Measures network process efficiency
```


**💭 Debugging Mental Model:**


**Common debugging approach khi cache không work as expected:**


1. **Chrome DevTools Network tab:**
Status | Method | Domain | File | Size | Time | Initiator
200    | GET    | cdn... | app.js | 1.2MB (from cache) | 2ms | script
2. **Check cache headers trong Response Headers:**
cache-control: public, max-age=31536000
etag: "abc123"
last-modified: Wed, 21 Aug 2024 10:00:00 GMT
3. **Application tab → Storage:**

HTTP Cache entries
Service Worker cache
Local Storage / Session Storage


**Red flags báo hiệu cache misconfiguration:**


- Resources loaded fresh on every page refresh
- Large bundle sizes with no cache headers
- 304 responses với large response times (cache validation taking too long)
- Mixed content warnings (HTTPS page loading HTTP cached resources)


---


### 🌱 Chapter 2: URL Parsing & Resolution - The Journey Begins


#### 📖 From User Input to Structured Request


**🌱 Nguồn Gốc & Motivation:**


URL parsing là first step trong browser caching pipeline, nhưng rất nhiều developers không realize complexity involved. User input như "baidu.com" phải được transform thành structured HTTP request với proper headers để cache system có thể work correctly.


**Historical context:** Tim Berners-Lee designed URL format in 1994, nhưng modern browsers phải handle millions of edge cases:


- Punycode for international domain names
- URL encoding for special characters
- Protocol upgrading (HTTP → HTTPS)
- Search engine integration
- Autocomplete suggestions


**Problem statement:** Browser must determine:


1. Is this a search query or a URL?
2. What protocol to use?
3. Which port to connect to?
4. How to handle redirects?
5. What cache key to generate?


**🔬 Bản Chất & Mechanism:**


URL parsing algorithm trong Chrome:


```cpp
class URLParser {
  public:
    static GURL ParseUserInput(const std::string& input) {
      // Step 1: Detect input type
      InputType type = ClassifyInput(input);

      switch (type) {
        case URL_WITH_PROTOCOL:
          return ParseCompleteURL(input);

        case PARTIAL_URL:
          return CompletePartialURL(input);

        case SEARCH_QUERY:
          return CreateSearchURL(input);

        case INVALID:
          return GURL();  // Invalid URL
      }
    }

  private:
    static InputType ClassifyInput(const std::string& input) {
      // Regex patterns for classification
      if (std::regex_match(input, protocol_regex_)) {
        return URL_WITH_PROTOCOL;  // https://example.com
      }

      if (std::regex_match(input, domain_regex_)) {
        return PARTIAL_URL;        // example.com
      }

      if (ContainsSpaces(input) || IsSearchPattern(input)) {
        return SEARCH_QUERY;       // "best restaurants"
      }

      return INVALID;
    }
};
```


**💡 Intuitive Understanding:**


URL parsing giống như address recognition system:


- **Raw input** = handwritten address on envelope
- **Classification** = determining if it's complete address, partial, or description
- **Completion** = adding missing components (zip code, country)
- **Validation** = checking if address actually exists
- **Standardization** = converting to postal service format


**⚙️ Implementation Deep Dive:**


**URL Components Analysis:**


```
https://user:pass@www.example.com:8080/path/to/resource?query=value&page=1#section2
└─┬─┘   └┬┘└┬┘ └────────┬────────┘└┬┘└──────┬──────┘└──────┬──────┘└───┬───┘
  │      │  │           │          │        │              │           │
scheme  user pass      host       port     path          query      fragment
```


Mỗi component có impact lên caching:


```cpp
struct URLComponents {
  // Cache key generation
  std::string scheme;     // HTTP vs HTTPS = different cache entries
  std::string host;       // Different hosts = different cache partitions
  int port;              // Different ports = different origins
  std::string path;       // Path is primary cache key component
  std::string query;      // Query parameters may be ignored for caching
  std::string fragment;   // Fragment never sent to server, ignored for cache

  // Security considerations
  std::string username;   // Credentials in URL = security issue
  std::string password;   // Should be stripped for cache keys
};
```


**URL Completion Algorithm:**


```cpp
GURL CompletePartialURL(const std::string& partial) {
  std::string completed = partial;

  // Step 1: Add protocol if missing
  if (!HasProtocol(partial)) {
    // Default to HTTPS for security
    completed = "https://" + completed;

    // Fallback to HTTP if HTTPS fails (determined later)
    fallback_url_ = "http://" + completed;
  }

  // Step 2: Add www if domain resolution fails
  if (!HasWWWPrefix(partial) && IsBareDomain(partial)) {
    www_variant_ = InsertWWWPrefix(completed);
  }

  // Step 3: Add default path
  if (!HasPath(completed)) {
    completed += "/";
  }

  // Step 4: Validate and parse
  GURL url(completed);
  return url.is_valid() ? url : GURL();
}
```


**🏭 Production Reality:**


**Tại Webflow (Website builder):**
URL parsing critical cho custom domains:


- Users input partial domains: "mysite.com"
- System must determine if it's published Webflow site
- Cache keys must handle both webflow.io và custom domains
- SSL certificate validation affects cache behavior


**Custom URL completion logic:**


```javascript
function completeWebflowURL(input) {
  // Check if it's already complete Webflow URL
  if (input.includes('.webflow.io')) {
    return input;
  }

  // Check if it's custom domain pointing to Webflow
  if (isCustomDomain(input)) {
    return `https://${input}`;
  }

  // Default to Webflow subdomain
  return `https://${input}.webflow.io`;
}
```


**Cache implications:**


- `mysite.com` và `mysite.webflow.io` = different cache entries
- SSL redirects create additional cache entries
- Custom domain verification affects cache headers


**💭 Deep Understanding Process:**


**Confusion tôi từng có:** "Tại sao sometimes typing 'facebook.com' redirect qua '[www.facebook.com](http://www.facebook.com/)', nhưng cache key lại different?"


**Aha moment:** URL canonicalization happens AFTER cache lookup. Browser first tries cache with original URL, nếu cache miss thì mới redirect. Điều này có thể create duplicate cache entries cho same resource.


**Debugging story tại Figma:**
User report: "Figma loading slow on corporate network"
Investigation: Corporate proxy was rewriting URLs:


- `figma.com/file/123` → `figma.com:443/file/123` (explicit port)
- Different cache keys caused cache misses
- Solution: Normalize URLs before cache key generation


**Common interview questions:**


1. **"What happens when user types 'google' in address bar?"**
Expected answer progression:

Junior: "Browser searches Google"
Mid: "Browser checks if it's URL first, then falls back to search"
Senior: "URL classification algorithm, autocomplete lookup, search engine integration"
Principal: "Discuss security implications, cache key generation, and performance optimizations"
2. **"Why do some websites work with 'www' prefix và some don't?"**
Deep answer:
www.example.com và example.com are technically different hosts
- DNS can be configured differently for each
- SSL certificates may only cover one variant
- Cache entries are separate for each
- SEO implications require canonical URL setup


---


#### 📖 DNS Resolution & Cache Interaction


**🌱 Nguồn Gốc & Motivation:**


DNS (Domain Name System) là critical component often overlooked trong caching pipeline. Before browser có thể cache any HTTP response, nó phải resolve domain name thành IP address. DNS resolution có its own caching layers:


1. **Browser DNS Cache**
2. **OS DNS Cache**
3. **Router DNS Cache**
4. **ISP DNS Cache**
5. **Authoritative DNS Servers**


**Problem:** DNS lookup có thể take 20-120ms, significantly impacting page load time. DNS caching reduces này từ milliseconds về microseconds.


**🔬 Bản Chất & Mechanism:**


DNS Resolution Pipeline:


```cpp
class HostResolver {
  private:
    // Multi-level cache hierarchy
    std::unique_ptr<HostCache> host_cache_;           // Browser level
    std::unique_ptr<NetworkChangeNotifier> network_notifier_;

  public:
    int Resolve(const HostPortPair& host_port_pair,
               const NetLogWithSource& net_log,
               CompletionOnceCallback callback) {

      // Step 1: Check browser DNS cache
      const HostCache::Entry* cache_entry =
          host_cache_->Lookup(host_port_pair, base::TimeTicks::Now());

      if (cache_entry && !cache_entry->IsExpired()) {
        return HandleCacheHit(cache_entry, callback);
      }

      // Step 2: Check OS DNS cache (implicit)
      // Step 3: Query upstream DNS servers
      return StartDnsQuery(host_port_pair, callback);
    }

  private:
    void OnDnsQueryComplete(const std::string& hostname,
                           const AddressList& addresses,
                           int error) {
      if (error == OK) {
        // Cache successful resolution
        HostCache::Entry entry(addresses,
                              HostCache::Entry::SOURCE_DNS,
                              base::TimeTicks::Now() + kDnsTtl);
        host_cache_->Set(hostname, entry);
      }
    }
};
```


**DNS Cache Entry Structure:**


```cpp
class HostCache::Entry {
  public:
    // Resolved IP addresses
    AddressList addresses_;

    // Cache metadata
    Source source_;              // DNS, HOST_FILE, etc.
    base::TimeTicks expiration_; // When to evict
    int error_;                  // Resolution result

    // Performance tracking
    base::TimeDelta resolution_time_;
    int query_count_;

    bool IsExpired() const {
      return base::TimeTicks::Now() > expiration_;
    }
};
```


**💡 Intuitive Understanding:**


DNS caching giống như phone book lookup optimization:


- **First time:** Look up person's number in phone book (slow)
- **Subsequent times:** Remember number in personal address book (fast)
- **Expiration:** Periodically update in case person changed number
- **Hierarchy:** Personal book → family book → neighborhood directory → official phone book


**⚙️ Implementation Deep Dive:**


**DNS Cache Interaction với HTTP Cache:**


```javascript
// Simplified flow
async function fetchResource(url) {
  const parsedURL = new URL(url);

  // Step 1: DNS resolution (with caching)
  const ipAddress = await resolveDNS(parsedURL.hostname);

  // Step 2: Cache key generation includes resolved IP
  const cacheKey = generateCacheKey({
    protocol: parsedURL.protocol,
    host: parsedURL.hostname,  // Use hostname, not IP
    port: parsedURL.port,
    path: parsedURL.pathname,
    query: parsedURL.search
  });

  // Step 3: HTTP cache lookup
  const cachedResponse = await httpCache.get(cacheKey);
  if (cachedResponse && isValid(cachedResponse)) {
    return cachedResponse;
  }

  // Step 4: Network request using resolved IP
  return networkRequest(ipAddress, parsedURL.pathname);
}
```


**Performance Optimization Patterns:**


1. **DNS Prefetching:**
html<link rel="dns-prefetch" href="//cdn.example.com">
<link rel="dns-prefetch" href="//analytics.google.com">
2. **Connection Prewarming:**
html<link rel="preconnect" href="//fonts.googleapis.com" crossorigin>
3. **Resource Hints:**
html<link rel="prefetch" href="/next-page-resources.css">
<link rel="preload" href="/critical.css" as="style">


**🏭 Production Reality:**


**Tại Binance (Global trading platform):**
DNS resolution critical cho high-frequency trading:


```javascript
// Multi-region DNS optimization
const DNS_SERVERS = {
  'us-east': ['1.1.1.1', '8.8.8.8'],
  'eu-west': ['1.1.1.1', '8.8.4.4'],
  'asia-pacific': ['8.8.8.8', '208.67.222.222']
};

function optimizeDNSForRegion(region) {
  // Configure DNS servers based on user location
  // Reduces DNS resolution time from 50ms to 5ms
  return DNS_SERVERS[region] || DNS_SERVERS['us-east'];
}
```


**DNS Cache Monitoring:**


```javascript
// Track DNS resolution performance
performance.addEventListener('navigation', (entry) => {
  const dnsTime = entry.domainLookupEnd - entry.domainLookupStart;

  analytics.track('dns_resolution_time', {
    hostname: entry.name,
    duration: dnsTime,
    cache_hit: dnsTime < 5 // Likely cache hit if < 5ms
  });
});
```


**💭 Debugging Mental Model:**


**Tools để debug DNS issues:**


1. **Chrome DevTools Timeline:**
Request URL: https://api.binance.com/v3/ticker/price
DNS Lookup: 2.34ms (cache hit indicator)
Initial Connection: 45.67ms
SSL: 23.45ms
2. **Command line tools:**
bash# Check DNS resolution time
dig @8.8.8.8 api.binance.com

# Trace DNS resolution path
nslookup -debug api.binance.com
3. **Chrome's internal DNS cache:**
chrome://net-internals/#dns


**Common DNS-related cache issues:**


1. **Stale DNS cache after IP change:**
javascript// Force DNS cache clear (for debugging)
chrome.browsingData.remove({
  "since": 0
}, {
  "cache": true,
  "cookies": true
});
2. **Mixed content issues:**
// HTTP resource from HTTPS page
https://secure.example.com loads http://cdn.example.com/script.js
// DNS resolution cho HTTP resource may be blocked


---


## 📚 PHẦN II: SENIOR LEVEL - DEEP DIVING INTO MECHANISMS


### 🚀 Chapter 3: HTTP Request Construction & Headers


#### 📖 Anatomy of HTTP Request for Caching


**🌱 Nguồn Gốc & Motivation:**


HTTP request construction là where caching strategy becomes concrete. Every header included/excluded affects cache behavior. Tại Principal level, understanding this helps optimize cache hit rates từ 60% lên 95%+.


**Historical evolution:**


- HTTP/0.9 (1991): No caching headers
- HTTP/1.0 (1996): Basic caching với Expires
- HTTP/1.1 (1997): Cache-Control, ETags, conditional requests
- HTTP/2 (2015): Header compression, multiplexing
- HTTP/3 (2020): QUIC transport, improved performance


**🔬 Bản Chất & Mechanism:**


HTTP Request Structure cho caching:


```
GET /api/v1/user/profile HTTP/1.1
Host: api.example.com
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36
Accept: application/json, text/plain, */*
Accept-Encoding: gzip, deflate, br
Accept-Language: en-US,en;q=0.9,vi;q=0.8
Connection: keep-alive
Cache-Control: max-age=0
If-None-Match: "abc123xyz"
If-Modified-Since: Wed, 21 Aug 2024 10:00:00 GMT
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```


**Cache-Affecting Headers Analysis:**


```cpp
class HttpRequestHeaders {
  public:
    // Primary cache headers
    void SetCacheControl(const std::string& value);
    void SetIfNoneMatch(const std::string& etag);
    void SetIfModifiedSince(const std::string& date);

    // Vary-affecting headers
    void SetAcceptEncoding(const std::string& encodings);
    void SetAcceptLanguage(const std::string& languages);
    void SetUserAgent(const std::string& user_agent);

    // Security headers that affect caching
    void SetAuthorization(const std::string& token);
    void SetCookie(const std::string& cookies);

  private:
    // Cache key generation logic
    std::string GenerateVaryKey() const {
      std::string key;

      // Headers that create different cache variants
      if (HasHeader("Accept-Encoding")) {
        key += "encoding:" + GetHeader("Accept-Encoding") + ";";
      }

      if (HasHeader("Accept-Language")) {
        key += "lang:" + GetHeader("Accept-Language") + ";";
      }

      return base::SHA1HashString(key);
    }
};
```


**💡 Intuitive Understanding:**


HTTP request construction giống như preparing different keys cho different locks:


- **Base URL** = building address
- **Cache-Control** = instructions cho how long to keep key
- **If-None-Match/If-Modified-Since** = checking if lock has changed
- **Vary headers** = different keys for different scenarios (language, encoding)
- **Authorization** = personal key that shouldn't be shared


**⚙️ Implementation Deep Dive:**


**Conditional Request Construction:**


```cpp
void HttpCache::PrepareConditionalRequest(
    const std::string& cache_key,
    HttpRequestInfo* request_info) {

  const HttpCacheEntry* entry = GetCacheEntry(cache_key);
  if (!entry) return;

  const HttpResponseHeaders* cached_headers = entry->response_headers();

  // Add If-None-Match for ETag validation
  std::string etag;
  if (cached_headers->GetNormalizedHeader("ETag", &etag)) {
    request_info->extra_headers.SetHeader("If-None-Match", etag);
  }

  // Add If-Modified-Since for timestamp validation
  std::string last_modified;
  if (cached_headers->GetNormalizedHeader("Last-Modified", &last_modified)) {
    request_info->extra_headers.SetHeader("If-Modified-Since", last_modified);
  }

  // Handle strong vs weak ETags
  if (etag.starts_with("W/")) {
    // Weak ETag - only use for GET/HEAD requests
    if (request_info->method != "GET" && request_info->method != "HEAD") {
      request_info->extra_headers.RemoveHeader("If-None-Match");
    }
  }
}
```


**Vary Header Processing:**


```cpp
class VaryProcessor {
  public:
    static std::string ComputeVaryKey(
        const HttpRequestHeaders& request_headers,
        const HttpResponseHeaders& response_headers) {

      std::string vary_header;
      if (!response_headers.GetNormalizedHeader("Vary", &vary_header)) {
        return "";  // No vary handling needed
      }

      if (vary_header == "*") {
        return "vary:*";  // Uncacheable
      }

      std::vector<std::string> vary_fields = SplitString(vary_header, ",");
      std::string vary_key;

      for (const auto& field : vary_fields) {
        std::string trimmed_field = TrimWhitespace(field);
        std::string field_value;

        if (request_headers.GetHeader(trimmed_field, &field_value)) {
          vary_key += trimmed_field + ":" + field_value + ";";
        }
      }

      return base::SHA1HashString(vary_key);
    }
};
```


**🏭 Production Reality:**


**Tại Figma (Collaborative design platform):**


Real-time collaboration requires careful request header management:


```javascript
class FigmaAPIClient {
  constructor() {
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'no-cache', // Real-time data
      'X-Figma-Client-Version': '1.2.3'
    };
  }

  async makeRequest(endpoint, options = {}) {
    const headers = {
      ...this.defaultHeaders,
      ...options.headers
    };

    // Dynamic cache control based on data type
    if (endpoint.includes('/files/') && options.method === 'GET') {
      // File metadata can be cached briefly
      headers['Cache-Control'] = 'max-age=60, stale-while-revalidate=300';
    } else if (endpoint.includes('/comments/')) {
      // Comments change frequently
      headers['Cache-Control'] = 'no-cache, must-revalidate';
    }

    // Conditional requests for file versions
    if (options.fileVersion) {
      headers['If-None-Match'] = `"${options.fileVersion}"`;
    }

    return fetch(endpoint, { headers, ...options });
  }
}
```


**Performance optimization tại scale:**


```javascript
// Header compression for HTTP/2
const headerOptimization = {
  // Use HPACK compression
  'accept-encoding': 'br, gzip, deflate',

  // Minimize vary headers to improve cache hit rate
  'vary': 'Accept-Encoding', // Only vary on encoding, not user-agent

  // Use consistent header ordering for better compression
  headerOrder: [
    'host', 'method', 'path', 'scheme',
    'accept', 'accept-encoding', 'cache-control',
    'if-none-match', 'if-modified-since'
  ]
};
```


**💭 Deep Understanding Process:**


**Debugging story tại Webflow:**


Issue: "CSS files not updating after deployment"


Investigation process:


1. **Check request headers:**
Cache-Control: max-age=0
If-None-Match: "old-etag-value"
2. **Check response:**
Status: 304 Not Modified
ETag: "old-etag-value"
3. **Root cause:** CDN was returning stale ETag values
4. **Solution:** Force cache invalidation with versioned URLs


**Common mistakes trong header configuration:**


1. **Over-aggressive caching:**
javascript// Bad: Cache user-specific data
headers['Cache-Control'] = 'public, max-age=3600';
headers['Vary'] = 'User-Agent'; // Creates too many cache variants
2. **Under-utilizing conditional requests:**
javascript// Bad: Always fetch full response
fetch('/api/data', {
  headers: { 'Cache-Control': 'no-cache' }
});

// Good: Use conditional requests
fetch('/api/data', {
  headers: {
    'If-None-Match': lastKnownETag,
    'Cache-Control': 'max-age=0'
  }
});


**Interview Questions:**


**Q: "Explain difference between Cache-Control: no-cache và Cache-Control: no-store"**


**Principal-level answer:**


```
no-cache:
- Resource CAN be cached
- Must validate with server before use (conditional request)
- Server responds 304 if not modified
- Useful for ensuring freshness while allowing caching

no-store:
- Resource MUST NOT be cached anywhere
- Always fetch from server
- Used for sensitive data (authentication tokens, personal info)
- Higher bandwidth usage but maximum security
```


**Q: "How does Vary header affect cache efficiency?"**


**Deep answer:**


```javascript
// Response with Vary header
Response Headers:
Vary: Accept-Encoding, Accept-Language

// Creates separate cache entries for:
// 1. English + gzip: cache-key-1
// 2. English + brotli: cache-key-2
// 3. Vietnamese + gzip: cache-key-3
// 4. Vietnamese + brotli: cache-key-4

// Cache hit rate decreases with more Vary dimensions
// Principal decision: Balance between correctness and efficiency
```


---


#### 📖 Authorization & Cookie Headers Impact on Caching


**🌱 Nguồn Gốc & Motivation:**


Authorization và Cookie headers tạo ra fundamental challenges cho caching:


1. **Security:** Cached responses với sensitive data có thể leaked
2. **Personalization:** Different users need different responses
3. **Performance:** Authentication checks slow down cache hits


**Security evolution:**


- Early web: No authentication, simple caching
- Web 2.0: Session cookies, cache bypassing
- Modern SPAs: JWT tokens, sophisticated cache strategies
- Microservices: Service-to-service auth, edge caching


**🔬 Bản Chất & Mechanism:**


Authentication Header Processing:


```cpp
class AuthenticationCacheHandler {
  public:
    CacheDecision ShouldCache(const HttpRequestInfo& request,
                             const HttpResponseInfo& response) {

      // Never cache responses to authenticated requests by default
      if (request.extra_headers.HasHeader("Authorization")) {
        return CheckAuthorizationCaching(request, response);
      }

      // Handle cookie-based authentication
      if (request.extra_headers.HasHeader("Cookie")) {
        return CheckCookieCaching(request, response);
      }

      return CACHE_ALLOWED;
    }

  private:
    CacheDecision CheckAuthorizationCaching(
        const HttpRequestInfo& request,
        const HttpResponseInfo& response) {

      // Check Cache-Control directives
      std::string cache_control;
      if (response.headers->GetNormalizedHeader("Cache-Control", &cache_control)) {

        // Server explicitly allows caching
        if (Contains(cache_control, "public")) {
          return CACHE_ALLOWED;
        }

        // Server allows private caching (browser only, not proxies)
        if (Contains(cache_control, "private")) {
          return CACHE_PRIVATE_ONLY;
        }

        // Server sets max-age for authenticated responses
        if (Contains(cache_control, "max-age")) {
          return CACHE_WITH_VALIDATION;
        }
      }

      // Default: Don't cache authenticated requests
      return CACHE_FORBIDDEN;
    }
};
```


**Cookie Impact on Cache Keys:**


```cpp
class CookieCacheStrategy {
  public:
    std::string GenerateCacheKey(const HttpRequestInfo& request) {
      std::string base_key = GenerateBaseKey(request.url);

      // Check if response varies on cookies
      if (ResponseVariesOnCookies(request.url)) {
        std::string cookie_header;
        request.extra_headers.GetHeader("Cookie", &cookie_header);

        // Parse relevant cookies only
        auto relevant_cookies = ExtractRelevantCookies(cookie_header);
        if (!relevant_cookies.empty()) {
          base_key += "|cookies:" + SerializeCookies(relevant_cookies);
        }
      }

      return base_key;
    }

  private:
    std::vector<Cookie> ExtractRelevantCookies(const std::string& cookie_header) {
      // Only include cookies that affect response content
      const std::set<std::string> cache_affecting_cookies = {
        "session_id", "user_preferences", "language", "theme"
      };

      std::vector<Cookie> relevant;
      auto all_cookies = ParseCookies(cookie_header);

      for (const auto& cookie : all_cookies) {
        if (cache_affecting_cookies.count(cookie.name)) {
          relevant.push_back(cookie);
        }
      }

      return relevant;
    }
};
```


**💡 Intuitive Understanding:**


Cookie và Authorization caching giống như library access control:


- **Public resources** = anyone can access, shared cache OK
- **Private resources** = only specific user, personal cache only
- **Sensitive resources** = no caching allowed, always verify identity
- **Personalized resources** = different cache for each user


**⚙️ Implementation Deep Dive:**


**JWT Token Caching Strategy:**


```javascript
class JWTCacheStrategy {
  constructor() {
    this.tokenCache = new Map();
    this.responseCache = new Map();
  }

  generateCacheKey(url, token) {
    // Extract user ID from JWT without full decode
    const tokenPayload = this.extractPayload(token);
    const userId = tokenPayload.sub;

    // Create user-specific cache key
    return `${url}|user:${userId}`;
  }

  async fetchWithAuth(url, token) {
    const cacheKey = this.generateCacheKey(url, token);

    // Check user-specific cache
    const cachedResponse = this.responseCache.get(cacheKey);
    if (cachedResponse && !this.isExpired(cachedResponse)) {
      return cachedResponse.data;
    }

    // Make authenticated request
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Cache-Control': 'private, max-age=300' // Cache for 5 minutes
      }
    });

    if (response.ok) {
      this.responseCache.set(cacheKey, {
        data: await response.json(),
        timestamp: Date.now(),
        ttl: 300000 // 5 minutes
      });
    }

    return response.data;
  }

  extractPayload(token) {
    // Simple base64 decode without verification
    // In production, use proper JWT library
    const payloadBase64 = token.split('.')[1];
    const payloadJson = atob(payloadBase64);
    return JSON.parse(payloadJson);
  }
}
```


**Session-based Caching:**


```javascript
class SessionCacheManager {
  constructor() {
    this.sessionCache = new Map();
    this.SESSION_COOKIE_NAME = 'sessionId';
  }

  getSessionId() {
    return document.cookie
      .split('; ')
      .find(row => row.startsWith(`${this.SESSION_COOKIE_NAME}=`))
      ?.split('=')[1];
  }

  async fetchSessionData(endpoint) {
    const sessionId = this.getSessionId();
    if (!sessionId) {
      throw new Error('No active session');
    }

    const cacheKey = `${endpoint}|session:${sessionId}`;

    // Check session-specific cache
    if (this.sessionCache.has(cacheKey)) {
      const cached = this.sessionCache.get(cacheKey);
      if (Date.now() - cached.timestamp < cached.ttl) {
        return cached.data;
      }
    }

    // Fetch with session cookie
    const response = await fetch(endpoint, {
      credentials: 'include', // Include cookies
      headers: {
        'Cache-Control': 'private, max-age=600'
      }
    });

    if (response.ok) {
      const data = await response.json();
      this.sessionCache.set(cacheKey, {
        data,
        timestamp: Date.now(),
        ttl: 600000 // 10 minutes
      });
      return data;
    }

    throw new Error(`Request failed: ${response.status}`);
  }

  clearSessionCache() {
    // Clear all session-specific cache entries
    for (const [key, value] of this.sessionCache.entries()) {
      if (key.includes(`|session:${this.getSessionId()}`)) {
        this.sessionCache.delete(key);
      }
    }
  }
}
```


**🏭 Production Reality:**


**Tại NAB (Banking platform):**


Multi-layered authentication caching:


```javascript
class NABSecureCacheManager {
  constructor() {
    this.publicCache = new Map();     // Public data
    this.privateCache = new Map();    // User-specific data
    this.sensitiveCache = new Map();  // Session-only data
    this.encryptionKey = this.deriveEncryptionKey();
  }

  async fetchBankingData(endpoint, securityLevel = 'private') {
    const authToken = this.getAuthToken();
    const customerId = this.extractCustomerId(authToken);

    switch (securityLevel) {
      case 'public':
        // Branch locations, interest rates
        return this.fetchPublicData(endpoint);

      case 'private':
        // Account balances, transaction history
        return this.fetchPrivateData(endpoint, customerId);

      case 'sensitive':
        // Payment processing, fund transfers
        return this.fetchSensitiveData(endpoint, authToken);
    }
  }

  async fetchPrivateData(endpoint, customerId) {
    const cacheKey = `${endpoint}|customer:${customerId}`;

    // Check encrypted private cache
    const encrypted = this.privateCache.get(cacheKey);
    if (encrypted && !this.isExpired(encrypted)) {
      return this.decrypt(encrypted.data);
    }

    const response = await fetch(endpoint, {
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`,
        'X-Customer-ID': customerId,
        'Cache-Control': 'private, max-age=60' // 1 minute only
      }
    });

    if (response.ok) {
      const data = await response.json();

      // Encrypt before caching
      const encryptedData = this.encrypt(data);
      this.privateCache.set(cacheKey, {
        data: encryptedData,
        timestamp: Date.now(),
        ttl: 60000 // 1 minute
      });

      return data;
    }
  }

  async fetchSensitiveData(endpoint, authToken) {
    // Never cache sensitive operations
    return fetch(endpoint, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      }
    });
  }

  // Security methods
  encrypt(data) {
    // Use Web Crypto API for encryption
    return crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: crypto.getRandomValues(new Uint8Array(12)) },
      this.encryptionKey,
      new TextEncoder().encode(JSON.stringify(data))
    );
  }

  deriveEncryptionKey() {
    // Derive key from session data
    const sessionData = this.getSessionData();
    return crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(sessionData),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );
  }
}
```


**💭 Debugging Mental Model:**


**Common authentication caching issues:**


1. **Stale user data after logout:**
javascript// Problem: User logs out but cached data persists
class LogoutHandler {
  logout() {
    // Clear server session
    await fetch('/api/logout', { method: 'POST' });

    // Clear client-side caches
    this.clearAllUserCaches();

    // Clear browser caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(name => caches.delete(name))
      );
    }
  }
}
2. **Cross-user data leakage:**
javascript// Problem: User A sees User B's data
// Solution: Include user ID in cache keys
function generateSecureCacheKey(url, userId) {
  return `${url}|user:${sha256(userId)}`;
}


**Interview Questions:**


**Q: "How would you implement caching for a multi-tenant SaaS application?"**


**Principal-level answer:**


```javascript
class MultiTenantCacheStrategy {
  generateCacheKey(url, tenantId, userId) {
    // Hierarchical cache key structure
    return `tenant:${tenantId}|user:${userId}|${url}`;
  }

  async fetchTenantData(endpoint, tenantId, userId) {
    // Implement tenant isolation
    const cacheKey = this.generateCacheKey(endpoint, tenantId, userId);

    // Different cache strategies by data sensitivity
    if (this.isPublicTenantData(endpoint)) {
      return this.publicTenantCache.get(cacheKey);
    } else if (this.isPrivateTenantData(endpoint)) {
      return this.privateTenantCache.get(cacheKey);
    } else {
      // Sensitive data - no caching
      return this.fetchDirectly(endpoint, tenantId, userId);
    }
  }
}
```


---


## 📚 PHẦN III: PRINCIPAL LEVEL - SYSTEM DESIGN & OPTIMIZATION


### 🚀 Chapter 4: Strong Caching Deep Dive


#### 📖 Cache-Control vs Expires - The Evolution Story


**🌱 Nguồn Gốc & Motivation:**


Strong caching là foundation của web performance optimization. Evolution từ simple Expires header đến sophisticated Cache-Control directives reflects increasing complexity của modern web applications.


**Historical timeline:**


- **1990s:** Static websites, simple file serving
- **2000s:** Dynamic content, CDN emergence
- **2010s:** SPA applications, API-driven architecture
- **2020s:** Edge computing, micro-frontends, real-time applications


**Principal perspective:** Understanding trade-offs between caching aggressiveness và content freshness is critical for system-wide performance optimization.


**🔬 Bản Chất & Mechanism:**


**Expires Header Processing:**


```cpp
class ExpiresHeaderProcessor {
  public:
    base::TimeDelta CalculateFreshnesLifetime(
        const HttpResponseHeaders* headers,
        const base::Time& response_time) {

      std::string expires_value;
      if (!headers->GetNormalizedHeader("Expires", &expires_value)) {
        return base::TimeDelta();  // No explicit expiration
      }

      base::Time expires_time;
      if (!ParseHttpDate(expires_value, &expires_time)) {
        // Invalid date format - treat as expired
        return base::TimeDelta::FromSeconds(-1);
      }

      // Calculate remaining lifetime
      base::TimeDelta lifetime = expires_time - response_time;

      // Handle clock skew and invalid dates
      if (lifetime.InSeconds() < 0) {
        return base::TimeDelta();  // Already expired
      }

      return lifetime;
    }
};
```


**Cache-Control Directive Processing:**


```cpp
class CacheControlProcessor {
  private:
    struct CacheControlDirectives {
      int max_age = -1;           // max-age=3600
      int s_maxage = -1;          // s-maxage=7200 (proxy cache)
      bool no_cache = false;      // no-cache
      bool no_store = false;      // no-store
      bool must_revalidate = false; // must-revalidate
      bool public_cache = false;  // public
      bool private_cache = false; // private
      int stale_while_revalidate = -1; // stale-while-revalidate=60
      int stale_if_error = -1;    // stale-if-error=300
    };

  public:
    CacheControlDirectives ParseCacheControl(const std::string& value) {
      CacheControlDirectives directives;

      std::vector<std::string> parts = SplitString(value, ",");
      for (const auto& part : parts) {
        std::string trimmed = TrimWhitespace(part);

        if (trimmed == "no-cache") {
          directives.no_cache = true;
        } else if (trimmed == "no-store") {
          directives.no_store = true;
        } else if (trimmed == "public") {
          directives.public_cache = true;
        } else if (trimmed == "private") {
          directives.private_cache = true;
        } else if (trimmed.starts_with("max-age=")) {
          directives.max_age = ParseIntDirective(trimmed, "max-age=");
        } else if (trimmed.starts_with("s-maxage=")) {
          directives.s_maxage = ParseIntDirective(trimmed, "s-maxage=");
        } else if (trimmed.starts_with("stale-while-revalidate=")) {
          directives.stale_while_revalidate =
              ParseIntDirective(trimmed, "stale-while-revalidate=");
        }
      }

      return directives;
    }

    base::TimeDelta CalculateFreshnessLifetime(
        const CacheControlDirectives& directives,
        const base::Time& response_time) {

      // Cache-Control max-age takes precedence over Expires
      if (directives.max_age >= 0) {
        return base::TimeDelta::FromSeconds(directives.max_age);
      }

      // Fall back to Expires header if no max-age
      return CalculateExpiresLifetime(response_time);
    }
};
```


**💡 Intuitive Understanding:**


Cache-Control directives giống như detailed instructions cho storage facility:


- **max-age=3600** = "Keep this for exactly 1 hour"
- **public** = "Anyone can store this in shared storage"
- **private** = "Only store this in personal storage"
- **no-cache** = "Check with original source before using"
- **no-store** = "Don't store this anywhere"
- **must-revalidate** = "When expired, must verify before using"


**⚙️ Implementation Deep Dive:**


**Cache Freshness Calculation Algorithm:**


```cpp
class CacheFreshnessCalculator {
  public:
    enum FreshnessState {
      FRESH,                    // Can use without validation
      STALE_REVALIDATE,        // Stale but can revalidate
      STALE_SERVE_ERROR,       // Stale but can serve if error
      EXPIRED_MUST_VALIDATE    // Must validate with origin
    };

    FreshnessState DetermineFreshness(
        const HttpResponseHeaders* headers,
        const base::Time& response_time,
        const base::Time& current_time) {

      CacheControlDirectives cc = ParseCacheControl(headers);

      // Check no-store first
      if (cc.no_store) {
        return EXPIRED_MUST_VALIDATE;
      }

      // Calculate age of response
      base::TimeDelta response_age = current_time - response_time;

      // Get freshness lifetime
      base::TimeDelta freshness_lifetime;
      if (cc.max_age >= 0) {
        freshness_lifetime = base::TimeDelta::FromSeconds(cc.max_age);
      } else {
        freshness_lifetime = CalculateExpiresLifetime(headers, response_time);
      }

      // Determine freshness state
      if (response_age <= freshness_lifetime) {
        return FRESH;
      }

      // Check stale-while-revalidate
      if (cc.stale_while_revalidate >= 0) {
        base::TimeDelta stale_threshold =
            freshness_lifetime + base::TimeDelta::FromSeconds(cc.stale_while_revalidate);
        if (response_age <= stale_threshold) {
          return STALE_REVALIDATE;
        }
      }

      // Check stale-if-error
      if (cc.stale_if_error >= 0) {
        base::TimeDelta error_threshold =
            freshness_lifetime + base::TimeDelta::FromSeconds(cc.stale_if_error);
        if (response_age <= error_threshold) {
          return STALE_SERVE_ERROR;
        }
      }

      return EXPIRED_MUST_VALIDATE;
    }
};
```


**Advanced Caching Patterns:**


```javascript
class AdvancedCacheStrategy {
  constructor() {
    this.cacheStorage = null;
    this.initializeCacheStorage();
  }

  async initializeCacheStorage() {
    if ('caches' in window) {
      this.cacheStorage = await caches.open('advanced-cache-v1');
    }
  }

  // Immutable asset caching
  generateImmutableCacheHeaders() {
    return {
      'Cache-Control': 'public, max-age=31536000, immutable', // 1 year
      'Expires': new Date(Date.now() + 31536000000).toUTCString()
    };
  }

  // API response caching with revalidation
  generateAPILevelCacheHeaders(endpoint) {
    const cacheStrategies = {
      // Static reference data
      '/api/countries': 'public, max-age=86400', // 1 day

      // User preferences
      '/api/user/preferences': 'private, max-age=3600', // 1 hour

      // Real-time data with background updates
      '/api/stock/prices': 'public, max-age=60, stale-while-revalidate=300',

      // Critical data requiring validation
      '/api/account/balance': 'private, max-age=0, must-revalidate',

      // Temporary data
      '/api/upload/progress': 'no-store'
    };

    return { 'Cache-Control': cacheStrategies[endpoint] || 'no-cache' };
  }

  // Service Worker cache strategy
  async implementServiceWorkerCaching() {
    const strategies = {
      // Network First - for API calls
      networkFirst: async (request) => {
        try {
          const networkResponse = await fetch(request);
          await this.cacheStorage.put(request, networkResponse.clone());
          return networkResponse;
        } catch (error) {
          return await this.cacheStorage.match(request);
        }
      },

      // Cache First - for static assets
      cacheFirst: async (request) => {
        const cachedResponse = await this.cacheStorage.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }

        const networkResponse = await fetch(request);
        await this.cacheStorage.put(request, networkResponse.clone());
        return networkResponse;
      },

      // Stale While Revalidate - for frequently updated content
      staleWhileRevalidate: async (request) => {
        const cachedResponse = await this.cacheStorage.match(request);

        // Start background fetch
        const fetchPromise = fetch(request).then(response => {
          this.cacheStorage.put(request, response.clone());
          return response;
        });

        // Return cached version immediately if available
        return cachedResponse || await fetchPromise;
      }
    };

    return strategies;
  }
}
```


**🏭 Production Reality:**


**Tại Webflow (Website builder platform):**


Multi-tier caching strategy cho different asset types:


```javascript
class WebflowCacheManager {
  constructor() {
    this.CDN_BASE = 'https://assets.website-files.com';
    this.API_BASE = 'https://webflow.com/api';
    this.cacheStrategies = this.initializeCacheStrategies();
  }

  initializeCacheStrategies() {
    return {
      // Published site assets - immutable
      publishedAssets: {
        'Cache-Control': 'public, max-age=31536000, immutable',
        'CDN-Cache-Control': 'public, max-age=31536000',
        pattern: /\/[a-f0-9]{32}\.(css|js|png|jpg|webp)$/
      },

      // Designer preview assets - short cache
      previewAssets: {
        'Cache-Control': 'private, max-age=300', // 5 minutes
        'CDN-Cache-Control': 'public, max-age=60',
        pattern: /\/preview\/.*\.(css|js)$/
      },

      // CMS content - conditional caching
      cmsContent: {
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
        'CDN-Cache-Control': 'public, max-age=3600',
        'ETag': true, // Enable ETag generation
        pattern: /\/api\/collections\//
      },

      // User-generated content
      userContent: {
        'Cache-Control': 'private, max-age=1800', // 30 minutes
        pattern: /\/api\/user\//
      }
    };
  }

  async optimizeCachePerformance() {
    // Preload critical CSS
    const criticalCSS = await this.extractCriticalCSS();
    this.preloadResource(criticalCSS, {
      'Cache-Control': 'public, max-age=86400', // 1 day
      as: 'style'
    });

    // Prefetch likely-to-be-needed resources
    const prefetchCandidates = this.identifyPrefetchCandidates();
    prefetchCandidates.forEach(resource => {
      this.prefetchResource(resource, {
        'Cache-Control': 'public, max-age=3600'
      });
    });
  }

  // Cache warming strategy
  async warmCache(siteId) {
    const criticalResources = [
      `/sites/${siteId}/css/main.css`,
      `/sites/${siteId}/js/webflow.js`,
      `/sites/${siteId}/images/hero.jpg`
    ];

    // Warm cache in background
    Promise.all(
      criticalResources.map(url =>
        fetch(url, {
          headers: { 'Cache-Control': 'public, max-age=86400' }
        })
      )
    );
  }
}
```


**CDN Edge Caching Configuration:**


```javascript
// Cloudflare Workers script for advanced caching
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);

  // Asset fingerprinting detection
  const isVersionedAsset = /\.[a-f0-9]{8,}\.(css|js|png|jpg|webp)$/.test(url.pathname);

  if (isVersionedAsset) {
    // Immutable assets - aggressive caching
    const response = await fetch(request, {
      cf: {
        cacheEverything: true,
        cacheTtlByStatus: {
          "200-299": 31536000,  // 1 year
          "300-399": 60,        // 1 minute for redirects
          "400-499": 10,        // 10 seconds for client errors
          "500-599": 0          // Don't cache server errors
        }
      }
    });

    // Add immutable cache headers
    const modifiedResponse = new Response(response.body, response);
    modifiedResponse.headers.set(
      'Cache-Control',
      'public, max-age=31536000, immutable'
    );

    return modifiedResponse;
  }

  // Dynamic content - conditional caching
  return fetch(request, {
    cf: {
      cacheEverything: true,
      cacheTtl: 300,  // 5 minutes
    }
  });
}
```


**💭 Deep Understanding Process:**


**Performance monitoring story tại Figma:**


Challenge: "Design files loading slowly for users in Asia-Pacific region"


Investigation approach:


1. **Cache hit rate analysis:**
javascript// Monitoring cache effectiveness
const cacheMetrics = {
  hitRate: (cacheHits / totalRequests) * 100,
  missRate: (cacheMisses / totalRequests) * 100,
  revalidationRate: (revalidations / totalRequests) * 100
};

// Target: 85%+ hit rate for static assets
console.log('Cache hit rate:', cacheMetrics.hitRate);
2. **TTL optimization based on usage patterns:**
javascript// Analyze access patterns
const accessPatterns = analyzeFileAccessFrequency();

// Adjust cache TTL dynamically
const optimizedTTL = {
  recentFiles: 3600,      // 1 hour - frequently accessed
  archivedFiles: 86400,   // 24 hours - rarely changed
  sharedFiles: 1800,      // 30 minutes - collaborative editing
  publicFiles: 7200       // 2 hours - stable content
};
3. **Root cause:** CDN cache invalidation was too aggressive
4. **Solution:** Implemented layered cache invalidation strategy


**Common performance pitfalls:**


1. **Over-caching dynamic content:**
javascript// Problem: User-specific data cached globally
response.headers['Cache-Control'] = 'public, max-age=3600'; // Wrong!

// Solution: User-specific caching
response.headers['Cache-Control'] = 'private, max-age=300';
2. **Under-utilizing immutable assets:**
javascript// Problem: Versioned assets with short cache
// app.abc123.js with max-age=3600

// Solution: Immutable directive for versioned assets
headers['Cache-Control'] = 'public, max-age=31536000, immutable';


**Interview Questions:**


**Q: "Design a caching strategy for a global e-commerce platform"**


**Principal-level approach:**


```javascript
class EcommerceCacheStrategy {
  constructor() {
    this.strategies = {
      // Product catalog - varies by region/currency
      productCatalog: {
        'Cache-Control': 'public, max-age=1800, stale-while-revalidate=3600',
        'Vary': 'Accept-Language, Accept-Currency',
        'CDN-Cache-Control': 'public, max-age=3600'
      },

      // User cart - private, short-lived
      userCart: {
        'Cache-Control': 'private, max-age=300, must-revalidate'
      },

      // Static assets - long-lived
      staticAssets: {
        'Cache-Control': 'public, max-age=31536000, immutable'
      },

      // Price data - fresh but with fallback
      pricing: {
        'Cache-Control': 'public, max-age=60, stale-if-error=300'
      }
    };
  }
}
```


**Trade-off analysis:**


- **Aggressive caching** = Better performance, potential stale content
- **Conservative caching** = Always fresh, higher server load
- **Layered approach** = Optimal balance, increased complexity


---


#### 📖 Browser Cache Storage Implementation


**🌱 Nguồn Gốc & Motivation:**


Browser cache storage là physical implementation của caching policies. Understanding storage mechanisms helps Principal Engineers optimize memory usage, disk I/O, và cache eviction strategies.


**Storage evolution:**


- **Early browsers:** Simple file-based cache
- **Modern browsers:** Sophisticated LRU cache với memory/disk tiers
- **Current state:** Partitioned cache, encrypted storage, cross-origin isolation


**🔬 Bản Chất & Mechanism:**


**Cache Storage Architecture:**


```cpp
class HttpCache {
  private:
    // Disk cache for persistent storage
    std::unique_ptr<disk_cache::Backend> disk_cache_;

    // Memory cache for hot entries
    std::unique_ptr<MemoryCache> memory_cache_;

    // Cache index for fast lookup
    std::unique_ptr<CacheIndex> cache_index_;

  public:
    class Entry {
      private:
        // Metadata
        std::string key_;
        base::Time response_time_;
        base::Time last_accessed_;
        int64_t size_;

        // Response data
        scoped_refptr<HttpResponseHeaders> headers_;
        std::unique_ptr<disk_cache::Entry> disk_entry_;

        // Cache validation
        std::string etag_;
        base::Time last_modified_;

      public:
        bool IsStale(base::Time current_time) const {
          base::TimeDelta age = current_time - response_time_;
          base::TimeDelta max_age = GetMaxAge();
          return age > max_age;
        }

        bool CanServeStale() const {
          return headers_->HasHeader("stale-while-revalidate") ||
                 headers_->HasHeader("stale-if-error");
        }
    };

    // Main cache operations
    int OpenEntry(const std::string& key, disk_cache::Entry** entry);
    int CreateEntry(const std::string& key, disk_cache::Entry** entry);
    int DeleteEntry(const std::string& key);
};
```


**Memory vs Disk Cache Strategy:**


```cpp
class CacheStorageManager {
  private:
    static const int64_t kMaxMemoryCacheSize = 64 * 1024 * 1024;  // 64MB
    static const int64_t kMaxDiskCacheSize = 1024 * 1024 * 1024;  // 1GB

  public:
    enum StorageDecision {
      MEMORY_ONLY,     // Small, frequently accessed
      DISK_ONLY,       // Large, less frequently accessed
      MEMORY_AND_DISK, // Medium size, hot content
      NO_STORAGE       // Sensitive or no-store content
    };

    StorageDecision DecideStorageLocation(
        const HttpResponseHeaders* headers,
        int64_t response_size) {

      // Check cache-control directives first
      std::string cache_control;
      if (headers->GetNormalizedHeader("Cache-Control", &cache_control)) {
        if (Contains(cache_control, "no-store")) {
          return NO_STORAGE;
        }

        if (Contains(cache_control, "private") && response_size > kMaxMemoryCacheSize) {
          return MEMORY_ONLY;  // Private data shouldn't go to disk
        }
      }

      // Size-based decisions
      if (response_size < 1024) {           // < 1KB
        return MEMORY_ONLY;
      } else if (response_size < 1024 * 1024) {  // < 1MB
        return MEMORY_AND_DISK;
      } else {                              // > 1MB
        return DISK_ONLY;
      }
    }
};
```


**💡 Intuitive Understanding:**


Browser cache storage giống như warehouse management system:


- **Memory cache** = Front desk storage (fast access, limited space)
- **Disk cache** = Main warehouse (slower access, large capacity)
- **Cache index** = Inventory system (quick lookup where items are stored)
- **Eviction policy** = Space management rules (what to remove when full)


**⚙️ Implementation Deep Dive:**


**LRU Cache Implementation:**


```cpp
template<typename Key, typename Value>
class LRUCache {
  private:
    struct Node {
      Key key;
      Value value;
      std::shared_ptr<Node> prev, next;

      Node(const Key& k, const Value& v) : key(k), value(v) {}
    };

    int capacity_;
    int size_;
    std::shared_ptr<Node> head_, tail_;
    std::unordered_map<Key, std::shared_ptr<Node>> cache_map_;

    void MoveToHead(std::shared_ptr<Node> node) {
      // Remove from current position
      node->prev->next = node->next;
      node->next->prev = node->prev;

      // Insert after head
      node->next = head_->next;
      node->prev = head_;
      head_->next->prev = node;
      head_->next = node;
    }

    std::shared_ptr<Node> RemoveTail() {
      auto last = tail_->prev;
      last->prev->next = tail_;
      tail_->prev = last->prev;
      return last;
    }

  public:
    LRUCache(int capacity) : capacity_(capacity), size_(0) {
      head_ = std::make_shared<Node>(Key{}, Value{});
      tail_ = std::make_shared<Node>(Key{}, Value{});
      head_->next = tail_;
      tail_->prev = head_;
    }

    Value Get(const Key& key) {
      auto it = cache_map_.find(key);
      if (it != cache_map_.end()) {
        // Move to head (mark as recently used)
        MoveToHead(it->second);
        return it->second->value;
      }
      return Value{};  // Cache miss
    }

    void Put(const Key& key, const Value& value) {
      auto it = cache_map_.find(key);
      if (it != cache_map_.end()) {
        // Update existing entry
        it->second->value = value;
        MoveToHead(it->second);
      } else {
        // Add new entry
        auto new_node = std::make_shared<Node>(key, value);

        if (size_ >= capacity_) {
          // Evict least recently used
          auto tail_node = RemoveTail();
          cache_map_.erase(tail_node->key);
          --size_;
        }

        cache_map_[key] = new_node;
        new_node->next = head_->next;
        new_node->prev = head_;
        head_->next->prev = new_node;
        head_->next = new_node;
        ++size_;
      }
    }
};
```


**Advanced Eviction Strategies:**


```cpp
class SmartCacheEviction {
  public:
    enum EvictionStrategy {
      LRU,              // Least Recently Used
      LFU,              // Least Frequently Used
      FIFO,             // First In, First Out
      SIZE_BASED,       // Evict largest entries first
      ACCESS_PATTERN,   // Based on access frequency and recency
      PRIORITY_BASED    // Based on content type priority
    };

  private:
    struct CacheEntryMetrics {
      int access_count;
      base::Time last_access;
      base::Time creation_time;
      int64_t size;
      ContentType content_type;
      float priority_score;

      float CalculateEvictionScore(EvictionStrategy strategy) const {
        switch (strategy) {
          case LRU:
            return (base::Time::Now() - last_access).InSecondsF();

          case LFU:
            return 1.0f / std::max(1, access_count);

          case SIZE_BASED:
            return static_cast<float>(size);

          case ACCESS_PATTERN: {
            float recency = (base::Time::Now() - last_access).InSecondsF();
            float frequency = static_cast<float>(access_count);
            return recency / std::max(1.0f, frequency);
          }

          case PRIORITY_BASED:
            return 1.0f / std::max(0.1f, priority_score);
        }
      }
    };

  public:
    std::vector<std::string> SelectEntriesForEviction(
        const std::map<std::string, CacheEntryMetrics>& entries,
        int64_t bytes_to_free,
        EvictionStrategy strategy) {

      // Calculate eviction scores
      std::vector<std::pair<std::string, float>> scored_entries;
      for (const auto& [key, metrics] : entries) {
        float score = metrics.CalculateEvictionScore(strategy);
        scored_entries.emplace_back(key, score);
      }

      // Sort by eviction score (highest = most likely to evict)
      std::sort(scored_entries.begin(), scored_entries.end(),
                [](const auto& a, const auto& b) {
                  return a.second > b.second;
                });

      // Select entries until we free enough space
      std::vector<std::string> to_evict;
      int64_t bytes_freed = 0;

      for (const auto& [key, score] : scored_entries) {
        if (bytes_freed >= bytes_to_free) break;

        to_evict.push_back(key);
        bytes_freed += entries.at(key).size;
      }

      return to_evict;
    }
};
```


**🏭 Production Reality:**


**Tại Axon (Body camera and evidence management):**


Specialized cache storage cho large video files:


```javascript
class AxonVideoCacheManager {
  constructor() {
    this.videoCache = new Map();
    this.thumbnailCache = new Map();
    this.metadataCache = new Map();

    // Different storage strategies for different content types
    this.storageStrategies = {
      video: {
        maxSize: 500 * 1024 * 1024,  // 500MB
        evictionPolicy: 'SIZE_BASED',
        compression: 'none'  // Videos already compressed
      },
      thumbnail: {
        maxSize: 50 * 1024 * 1024,   // 50MB
        evictionPolicy: 'LRU',
        compression: 'webp'
      },
      metadata: {
        maxSize: 10 * 1024 * 1024,   // 10MB
        evictionPolicy: 'LFU',
        compression: 'gzip'
      }
    };
  }

  async storeVideoSegment(videoId, segmentIndex, segmentData) {
    const cacheKey = `${videoId}:${segmentIndex}`;
    const strategy = this.storageStrategies.video;

    // Check if we need to evict before storing
    if (this.getCurrentCacheSize('video') + segmentData.length > strategy.maxSize) {
      await this.evictLeastImportantSegments(segmentData.length);
    }

    // Store with metadata for eviction decisions
    this.videoCache.set(cacheKey, {
      data: segmentData,
      timestamp: Date.now(),
      size: segmentData.length,
      accessCount: 0,
      lastAccess: Date.now(),
      priority: this.calculateSegmentPriority(videoId, segmentIndex)
    });

    // Update access patterns for future eviction decisions
    this.updateAccessPattern(cacheKey, 'store');
  }

  calculateSegmentPriority(videoId, segmentIndex) {
    // Higher priority for:
    // 1. Recent evidence
    // 2. Segments near current playback position
    // 3. Beginning/end of videos (often most important)

    const videoMetadata = this.metadataCache.get(videoId);
    if (!videoMetadata) return 1.0;

    let priority = 1.0;

    // Recency boost
    const ageInDays = (Date.now() - videoMetadata.createdAt) / (24 * 60 * 60 * 1000);
    priority += Math.max(0, 2.0 - ageInDays / 30); // Boost recent videos

    // Position boost (first/last 10% of video)
    const totalSegments = videoMetadata.totalSegments;
    if (segmentIndex < totalSegments * 0.1 || segmentIndex > totalSegments * 0.9) {
      priority += 0.5;
    }

    return priority;
  }

  async evictLeastImportantSegments(bytesNeeded) {
    const entries = Array.from(this.videoCache.entries())
      .map(([key, data]) => ({
        key,
        ...data,
        evictionScore: this.calculateEvictionScore(data)
      }))
      .sort((a, b) => b.evictionScore - a.evictionScore); // Highest score = evict first

    let bytesFreed = 0;
    const toEvict = [];

    for (const entry of entries) {
      if (bytesFreed >= bytesNeeded) break;
      toEvict.push(entry.key);
      bytesFreed += entry.size;
    }

    // Perform eviction
    toEvict.forEach(key => {
      this.videoCache.delete(key);
      console.log(`Evicted video segment: ${key}`);
    });
  }

  calculateEvictionScore(cacheEntry) {
    const now = Date.now();
    const ageInMinutes = (now - cacheEntry.lastAccess) / (60 * 1000);
    const accessFrequency = cacheEntry.accessCount / Math.max(1,
      (now - cacheEntry.timestamp) / (60 * 60 * 1000)); // accesses per hour

    // High score = more likely to evict
    return ageInMinutes / Math.max(0.1, accessFrequency) / cacheEntry.priority;
  }
}
```


**IndexedDB Integration cho persistent caching:**


```javascript
class PersistentCacheManager {
  constructor() {
    this.dbName = 'AxonCache';
    this.version = 1;
    this.db = null;
  }

  async initialize() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Video segments store
        if (!db.objectStoreNames.contains('videoSegments')) {
          const store = db.createObjectStore('videoSegments', { keyPath: 'id' });
          store.createIndex('videoId', 'videoId', { unique: false });
          store.createIndex('lastAccess', 'lastAccess', { unique: false });
          store.createIndex('size', 'size', { unique: false });
        }

        // Cache metadata
        if (!db.objectStoreNames.contains('cacheMetadata')) {
          db.createObjectStore('cacheMetadata', { keyPath: 'key' });
        }
      };
    });
  }

  async storeSegmentPersistently(segmentId, segmentData, metadata) {
    const transaction = this.db.transaction(['videoSegments'], 'readwrite');
    const store = transaction.objectStore('videoSegments');

    const entry = {
      id: segmentId,
      data: segmentData,
      ...metadata,
      storedAt: Date.now()
    };

    await store.put(entry);

    // Update cache size tracking
    await this.updateCacheSize(segmentData.length);
  }

  async getStorageQuotaInfo() {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        quota: estimate.quota,
        usage: estimate.usage,
        usagePercentage: (estimate.usage / estimate.quota) * 100
      };
    }
    return null;
  }
}
```


**💭 Debugging Mental Model:**


**Cache storage debugging workflow:**


1. **Chrome DevTools → Application → Storage:**
Cache Storage → inspect service worker caches
IndexedDB → check persistent storage
Local Storage → session data
2. **Memory usage analysis:**
javascript// Monitor cache size
const cacheSize = performance.memory ? {
  used: performance.memory.usedJSHeapSize,
  total: performance.memory.totalJSHeapSize,
  limit: performance.memory.jsHeapSizeLimit
} : null;
3. **Cache efficiency metrics:**
javascriptconst cacheMetrics = {
  hitRate: cacheHits / (cacheHits + cacheMisses),
  evictionRate: evictions / totalStores,
  averageEntrySize: totalCacheSize / entryCount,
  storageUtilization: usedSpace / availableSpace
};


**Common storage issues:**


1. **Memory leaks from uncleaned cache entries:**
javascript// Problem: Entries never cleaned up
class LeakyCacheManager {
  store(key, data) {
    this.cache.set(key, data); // Never removed!
  }
}

// Solution: Implement proper eviction
class ProperCacheManager {
  store(key, data) {
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }
    this.cache.set(key, data);
  }
}
2. **Quota exceeded errors:**
javascript// Handle storage quota gracefully
try {
  await cache.put(request, response);
} catch (error) {
  if (error.name === 'QuotaExceededError') {
    await this.freeUpSpace();
    await cache.put(request, response);
  }
}


**Interview Questions:**


**Q: "How would you design a cache eviction strategy for a video streaming app?"**


**Principal-level considerations:**


```javascript
class StreamingCacheEviction {
  constructor() {
    this.strategies = {
      // Predictive prefetching
      predictive: (userHistory) => {
        return this.predictNextSegments(userHistory);
      },

      // Quality-aware eviction
      qualityAware: (segments) => {
        // Keep low-quality versions longer (smaller, good fallback)
        return segments.sort((a, b) => b.quality - a.quality);
      },

      // Viewing pattern based
      viewingPattern: (segments) => {
        // Keep segments from popular time ranges
        return segments.filter(s => s.popularity > threshold);
      }
    };
  }
}
```


---


## 🚀 Chapter 5: Negotiated Caching - The Art of Validation


#### 📖 Last-Modified vs ETag - Evolution of Content Validation


**🌱 Nguồn Gốc & Motivation:**


Negotiated caching represents the evolution from crude time-based validation đến sophisticated content-based validation. Đây là critical optimization that can reduce bandwidth usage by 60-80% while maintaining content freshness.


**Historical context:**


- **HTTP/1.0 (1996):** Last-Modified header introduced
- **HTTP/1.1 (1999):** ETag introduced for content-based validation
- **Modern era:** Weak vs Strong ETags, sophisticated generation algorithms


**Principal insight:** Choice between Last-Modified vs ETag affects not just performance, but also cache correctness, especially for dynamic content và distributed systems.


**🔬 Bản Chất & Mechanism:**


**Last-Modified Validation Flow:**


```cpp
class LastModifiedValidator {
  private:
    // Time-based validation precision
    static const int kTimeResolutionSeconds = 1;

  public:
    struct ValidationResult {
      bool is_modified;
      base::Time last_modified_time;
      std::string reason;
    };

    ValidationResult ValidateLastModified(
        const base::Time& cached_last_modified,
        const base::Time& resource_last_modified) {

      ValidationResult result;
      result.last_modified_time = resource_last_modified;

      // Handle time precision issues
      base::TimeDelta time_diff = resource_last_modified - cached_last_modified;

      if (time_diff.InSeconds() > kTimeResolutionSeconds) {
        result.is_modified = true;
        result.reason = "Resource modified after cached version";
      } else if (time_diff.InSeconds() < -kTimeResolutionSeconds) {
        // Clock skew or file system issues
        result.is_modified = false;
        result.reason = "Possible clock skew detected";
      } else {
        result.is_modified = false;
        result.reason = "Resource not modified";
      }

      return result;
    }

    // Generate If-Modified-Since header
    std::string GenerateIfModifiedSinceHeader(const base::Time& last_modified) {
      // Convert to HTTP date format
      return base::TimeFormatHTTP(last_modified);
    }

    // Common edge cases handling
    bool IsValidLastModifiedTime(const base::Time& time) {
      base::Time now = base::Time::Now();
      base::Time unix_epoch = base::Time::UnixEpoch();

      // Reject future times (clock skew)
      if (time > now + base::TimeDelta::FromMinutes(5)) {
        return false;
      }

      // Reject times before Unix epoch
      if (time < unix_epoch) {
        return false;
      }

      return true;
    }
};
```


**ETag Generation & Validation:**


```cpp
class ETagGenerator {
  public:
    enum ETagType {
      STRONG_ETAG,  // Content-based, byte-level precision
      WEAK_ETAG     // Semantic equivalence, allows minor changes
    };

  private:
    // Strong ETag generation using content hash
    std::string GenerateStrongETag(const std::string& content) {
      std::string hash = base::SHA256HashString(content);
      return "\"" + base::HexEncode(hash.substr(0, 16)) + "\"";
    }

    // Weak ETag generation based on semantic markers
    std::string GenerateWeakETag(const std::string& content,
                                 const base::Time& last_modified) {
      // Combine content length, last modified, and semantic markers
      std::string semantic_signature =
          std::to_string(content.length()) + ":" +
          std::to_string(last_modified.ToTimeT()) + ":" +
          ExtractSemanticMarkers(content);

      std::string hash = base::SHA256HashString(semantic_signature);
      return "W/\"" + base::HexEncode(hash.substr(0, 16)) + "\"";
    }

    std::string ExtractSemanticMarkers(const std::string& content) {
      // For HTML: extract title, meta description, main headings
      // For JSON: extract schema version, key field counts
      // For CSS: extract selectors count, media queries

      if (IsHTMLContent(content)) {
        return ExtractHTMLMarkers(content);
      } else if (IsJSONContent(content)) {
        return ExtractJSONMarkers(content);
      } else {
        // Fall back to content length
        return std::to_string(content.length());
      }
    }

  public:
    std::string GenerateETag(const std::string& content,
                           const base::Time& last_modified,
                           ETagType type) {
      switch (type) {
        case STRONG_ETAG:
          return GenerateStrongETag(content);
        case WEAK_ETAG:
          return GenerateWeakETag(content, last_modified);
      }
    }

    // ETag comparison for validation
    bool ETagsMatch(const std::string& etag1, const std::string& etag2) {
      // Handle weak ETag comparisons
      bool etag1_weak = etag1.starts_with("W/");
      bool etag2_weak = etag2.starts_with("W/");

      std::string normalized1 = etag1_weak ? etag1.substr(2) : etag1;
      std::string normalized2 = etag2_weak ? etag2.substr(2) : etag2;

      // Weak comparison allows different ETag types to match
      return normalized1 == normalized2;
    }
};
```


**💡 Intuitive Understanding:**


ETag vs Last-Modified giống như different verification methods:


**Last-Modified** = timestamp on document


- "Has this document been touched since I last saw it?"
- Simple but imprecise (1-second granularity)
- Can give false positives (file touched but content unchanged)


**ETag** = content fingerprint


- "Is the content exactly the same as what I have?"
- Precise but requires computation
- Strong ETag: byte-level accuracy
- Weak ETag: semantic equivalence


**⚙️ Implementation Deep Dive:**


**Conditional Request Processing:**


```cpp
class ConditionalRequestHandler {
  public:
    enum ValidationResult {
      NOT_MODIFIED_304,     // Return 304 Not Modified
      MODIFIED_200,         // Return 200 OK with new content
      PRECONDITION_FAILED_412  // Precondition failed
    };

    ValidationResult ProcessConditionalRequest(
        const HttpRequestHeaders& request_headers,
        const std::string& current_content,
        const base::Time& current_last_modified) {

      // Priority: ETag validation over Last-Modified
      std::string if_none_match;
      if (request_headers.GetHeader("If-None-Match", &if_none_match)) {
        return ProcessETagValidation(if_none_match, current_content);
      }

      std::string if_modified_since;
      if (request_headers.GetHeader("If-Modified-Since", &if_modified_since)) {
        return ProcessLastModifiedValidation(if_modified_since, current_last_modified);
      }

      // No conditional headers - return full content
      return MODIFIED_200;
    }

  private:
    ValidationResult ProcessETagValidation(
        const std::string& if_none_match,
        const std::string& current_content) {

      // Handle wildcard
      if (if_none_match == "*") {
        return NOT_MODIFIED_304;  // Any version exists
      }

      // Parse multiple ETags
      std::vector<std::string> client_etags = ParseETagList(if_none_match);
      std::string current_etag = GenerateCurrentETag(current_content);

      for (const auto& client_etag : client_etags) {
        if (ETagsMatch(client_etag, current_etag)) {
          return NOT_MODIFIED_304;
        }
      }

      return MODIFIED_200;
    }

    ValidationResult ProcessLastModifiedValidation(
        const std::string& if_modified_since,
        const base::Time& current_last_modified) {

      base::Time client_time;
      if (!base::Time::FromString(if_modified_since.c_str(), &client_time)) {
        return MODIFIED_200;  // Invalid date format
      }

      // Compare with 1-second precision
      base::TimeDelta diff = current_last_modified - client_time;
      if (diff.InSeconds() <= 0) {
        return NOT_MODIFIED_304;
      }

      return MODIFIED_200;
    }

    std::vector<std::string> ParseETagList(const std::string& etag_header) {
      std::vector<std::string> etags;

      // Handle comma-separated list: "etag1", "etag2", W/"etag3"
      std::regex etag_regex(R"((W/)?\"[^\"]+\")");
      std::sregex_iterator iter(etag_header.begin(), etag_header.end(), etag_regex);
      std::sregex_iterator end;

      for (; iter != end; ++iter) {
        etags.push_back(iter->str());
      }

      return etags;
    }
};
```


**Advanced ETag Strategies:**


```javascript
class AdvancedETagManager {
  constructor() {
    this.etagStrategies = {
      // Static file ETags based on file metadata
      staticFile: (filePath, stats) => {
        return `"${stats.size}-${stats.mtime.getTime()}"`;
      },

      // Database record ETags using version fields
      databaseRecord: (record) => {
        return `"${record.id}-${record.version}-${record.updated_at}"`;
      },

      // Computed content ETags using content hash
      computedContent: (content) => {
        const hash = this.computeHash(content);
        return `"${hash}"`;
      },

      // Weak ETags for user-customizable content
      userCustomizable: (baseContent, userPreferences) => {
        const baseHash = this.computeHash(baseContent);
        const prefHash = this.computeHash(JSON.stringify(userPreferences));
        return `W/"${baseHash}-${prefHash.substring(0, 8)}"`;
      }
    };
  }

  computeHash(content) {
    // Using Web Crypto API for consistent hashing
    return crypto.subtle.digest('SHA-256',
      new TextEncoder().encode(content)
    ).then(buffer => {
      return Array.from(new Uint8Array(buffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
        .substring(0, 16);
    });
  }

  // ETag generation for different content types
  async generateContextualETag(content, metadata) {
    const contentType = metadata.contentType;

    switch (contentType) {
      case 'application/json':
        return this.generateJSONETag(content);

      case 'text/html':
        return this.generateHTMLETag(content);

      case 'text/css':
        return this.generateCSSETag(content);

      default:
        return this.generateGenericETag(content);
    }
  }

  async generateJSONETag(jsonContent) {
    try {
      // Normalize JSON for consistent ETags
      const parsed = JSON.parse(jsonContent);
      const normalized = JSON.stringify(parsed, Object.keys(parsed).sort());
      return await this.computeHash(normalized);
    } catch (error) {
      // Fall back to content hash if JSON parsing fails
      return await this.computeHash(jsonContent);
    }
  }

  async generateHTMLETag(htmlContent) {
    // Extract semantic content for weak ETag
    const semanticContent = this.extractSemanticHTML(htmlContent);
    const hash = await this.computeHash(semanticContent);
    return `W/"${hash}"`;
  }

  extractSemanticHTML(html) {
    // Remove whitespace, comments, and non-semantic elements
    return html
      .replace(/<!--[\s\S]*?-->/g, '')  // Remove comments
      .replace(/\s+/g, ' ')             // Normalize whitespace
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remove scripts
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')   // Remove inline styles
      .trim();
  }
}
```


**🏭 Production Reality:**


**Tại Binance (Cryptocurrency exchange):**


High-frequency data với sophisticated ETag strategies:


```javascript
class BinanceCacheManager {
  constructor() {
    this.priceDataCache = new Map();
    this.orderBookCache = new Map();
    this.userDataCache = new Map();

    // Different ETag strategies for different data types
    this.etagStrategies = {
      // Price data: version-based ETags
      price: (symbol, data) => {
        return `"${symbol}-${data.timestamp}-${data.sequenceId}"`;
      },

      // Order book: depth-based weak ETags
      orderBook: (symbol, orderBook) => {
        const topLevels = this.extractTopOrderLevels(orderBook, 10);
        const signature = this.computeOrderBookSignature(topLevels);
        return `W/"${symbol}-${signature}"`;
      },

      // User orders: strong ETags based on exact state
      userOrders: (userId, orders) => {
        const ordersHash = this.hashOrdersArray(orders);
        return `"user-${userId}-${ordersHash}"`;
      },

      // Market statistics: time-based weak ETags
      marketStats: (symbol, stats, timeWindow) => {
        const timeSlot = Math.floor(Date.now() / (timeWindow * 1000));
        return `W/"stats-${symbol}-${timeSlot}"`;
      }
    };
  }

  async handlePriceDataRequest(symbol, clientETag) {
    const currentData = await this.getCurrentPriceData(symbol);
    const currentETag = this.etagStrategies.price(symbol, currentData);

    // Check if client has current version
    if (clientETag && clientETag === currentETag) {
      return {
        status: 304,
        headers: {
          'ETag': currentETag,
          'Cache-Control': 'public, max-age=1' // 1 second cache
        }
      };
    }

    return {
      status: 200,
      headers: {
        'ETag': currentETag,
        'Cache-Control': 'public, max-age=1',
        'Last-Modified': new Date(currentData.timestamp).toUTCString()
      },
      data: currentData
    };
  }

  extractTopOrderLevels(orderBook, levels) {
    return {
      bids: orderBook.bids.slice(0, levels),
      asks: orderBook.asks.slice(0, levels)
    };
  }

  computeOrderBookSignature(topLevels) {
    // Create signature based on top price levels
    const bidSignature = topLevels.bids
      .map(([price, quantity]) => `${price}:${quantity}`)
      .join('|');

    const askSignature = topLevels.asks
      .map(([price, quantity]) => `${price}:${quantity}`)
      .join('|');

    const combined = `${bidSignature}||${askSignature}`;
    return this.quickHash(combined);
  }

  quickHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  // Performance optimization: batch ETag validation
  async validateMultipleETags(requests) {
    const validationPromises = requests.map(async ({ symbol, clientETag, dataType }) => {
      const currentData = await this.getCurrentData(symbol, dataType);
      const currentETag = this.etagStrategies[dataType](symbol, currentData);

      return {
        symbol,
        dataType,
        isModified: clientETag !== currentETag,
        currentETag
      };
    });

    return Promise.all(validationPromises);
  }
}
```


**CDN-level ETag handling:**


```javascript
// Cloudflare Workers script for ETag optimization
addEventListener('fetch', event => {
  event.respondWith(handleETagRequest(event.request));
});

async function handleETagRequest(request) {
  const url = new URL(request.url);
  const clientETag = request.headers.get('If-None-Match');

  // Generate origin-based cache key
  const cacheKey = new Request(url.toString(), {
    headers: {
      'Accept': request.headers.get('Accept') || '*/*',
      'Accept-Encoding': request.headers.get('Accept-Encoding') || 'identity'
    }
  });

  // Check edge cache
  const cachedResponse = await caches.default.match(cacheKey);
  if (cachedResponse) {
    const cachedETag = cachedResponse.headers.get('ETag');

    // Compare ETags
    if (clientETag && etagsMatch(clientETag, cachedETag)) {
      return new Response(null, {
        status: 304,
        headers: {
          'ETag': cachedETag,
          'Cache-Control': cachedResponse.headers.get('Cache-Control'),
          'Expires': cachedResponse.headers.get('Expires')
        }
      });
    }

    return cachedResponse;
  }

  // Fetch from origin
  const originResponse = await fetch(request);

  // Cache response if cacheable
  if (originResponse.status === 200 && originResponse.headers.get('ETag')) {
    await caches.default.put(cacheKey, originResponse.clone());
  }

  return originResponse;
}

function etagsMatch(etag1, etag2) {
  // Handle both strong and weak ETag comparisons
  const normalize = (etag) => etag.startsWith('W/') ? etag.substring(2) : etag;
  return normalize(etag1) === normalize(etag2);
}
```


**💭 Deep Understanding Process:**


**Debugging story tại Figma:**


Issue: "Design files showing outdated content despite server updates"


Investigation process:


1. **Check ETag generation consistency:**
javascript// Problem discovered: ETag generation included server timestamps
const inconsistentETag = `"${content_hash}-${server_timestamp}"`;
// Different servers generated different ETags for same content

// Solution: Content-only ETags
const consistentETag = `"${content_hash}"`;
2. **Verify conditional request handling:**
javascript// Problem: Server not properly handling If-None-Match
if (request.headers['if-none-match'] === response.etag) {
  // Missing quotes comparison!
  // "abc123" !== abc123
}

// Solution: Proper ETag parsing
const normalizeETag = (etag) => etag.replace(/^W\//, '').replace(/"/g, '');


**ETag vs Last-Modified trade-offs:**


```javascript
const comparisonMatrix = {
  accuracy: {
    lastModified: 'second-level precision, false positives possible',
    etag: 'content-level precision, exact matches'
  },

  performance: {
    lastModified: 'minimal server computation',
    etag: 'requires content processing'
  },

  bandwidth: {
    lastModified: '29 characters (HTTP date)',
    etag: '10-40 characters (hash-based)'
  },

  cacheability: {
    lastModified: 'works with all proxies',
    etag: 'some older proxies ignore ETags'
  }
};
```


**Interview Questions:**


**Q: "When would you choose Last-Modified over ETag?"**


**Principal-level decision framework:**


```javascript
class CacheValidationStrategy {
  chooseValidationMethod(resourceType, systemConstraints) {
    const factors = {
      // Content characteristics
      changeFrequency: resourceType.changeFrequency,
      contentSize: resourceType.averageSize,

      // System constraints
      cpuBudget: systemConstraints.availableCPU,
      bandwidthCost: systemConstraints.bandwidthPricing,

      // Client characteristics
      clientCapabilities: systemConstraints.supportedFeatures
    };

    // Decision logic
    if (factors.contentSize > 10_000_000) { // >10MB files
      return 'last-modified'; // Avoid computing hashes for large files
    }

    if (factors.changeFrequency === 'high' && factors.cpuBudget === 'low') {
      return 'last-modified'; // Reduce server computation
    }

    if (factors.clientCapabilities.supportsETags) {
      return 'etag'; // More accurate validation
    }

    return 'both'; // Use both for maximum compatibility
  }
}
```


---


#### 📖 304 Not Modified Response Optimization


**🌱 Nguồn Gốc & Motivation:**


304 Not Modified response là cornerstone của efficient web caching. Đây là mechanism cho phép browsers validate cached content without downloading full response, potentially saving 90%+ bandwidth cho subsequent requests.


**Performance impact:**


- Reduces bandwidth usage by 70-95%
- Decreases server load (no need to generate full response)
- Improves perceived performance (faster validation than full download)
- Essential for mobile networks và metered connections


**Principal consideration:** 304 responses must be faster than full responses, or caching becomes counterproductive.


**🔬 Bản Chất & Mechanism:**


**304 Response Generation Pipeline:**


```cpp
class NotModifiedResponseGenerator {
  public:
    struct ValidationContext {
      std::string request_url;
      HttpRequestHeaders request_headers;
      base::Time current_time;

      // Cached resource metadata
      std::string cached_etag;
      base::Time cached_last_modified;

      // Current resource metadata
      std::string current_etag;
      base::Time current_last_modified;
      int64_t content_length;
    };

    HttpResponseInfo Generate304Response(const ValidationContext& context) {
      HttpResponseInfo response_info;

      // Set status code
      response_info.status_code = 304;
      response_info.status_text = "Not Modified";

      // Copy validation headers from original response
      HttpResponseHeaders* headers = response_info.headers.get();

      // Required headers for 304 response
      if (!context.current_etag.empty()) {
        headers->SetHeader("ETag", context.current_etag);
      }

      if (!context.current_last_modified.is_null()) {
        headers->SetHeader("Last-Modified",
                          base::TimeFormatHTTP(context.current_last_modified));
      }

      // Copy cache control headers
      std::string cache_control = GetCacheControlForResource(context.request_url);
      if (!cache_control.empty()) {
        headers->SetHeader("Cache-Control", cache_control);
      }

      // Update response timestamp
      headers->SetHeader("Date", base::TimeFormatHTTP(context.current_time));

      // Vary header must be preserved
      std::string vary_header = GetVaryHeaderForResource(context.request_url);
      if (!vary_header.empty()) {
        headers->SetHeader("Vary", vary_header);
      }

      // No message body for 304 responses
      response_info.content_length = 0;

      return response_info;
    }

  private:
    // Performance optimization: Cache header generation
    std::string GetCacheControlForResource(const std::string& url) {
      static std::unordered_map<std::string, std::string> cache_patterns = {
        {".css", "public, max-age=86400"},
        {".js", "public, max-age=86400"},
        {".png", "public, max-age=2592000"},
        {".jpg", "public, max-age=2592000"},
        {"/api/", "private, max-age=300"}
      };

      for (const auto& [pattern, cache_control] : cache_patterns) {
        if (url.find(pattern) != std::string::npos) {
          return cache_control;
        }
      }

      return "public, max-age=3600"; // Default
    }
};
```


**Client-side 304 Response Processing:**


```cpp
class ClientCacheManager {
  public:
    enum CacheUpdateResult {
      CACHE_UPDATED,        // Headers updated, content reused
      CACHE_INVALIDATED,    // Cache entry removed
      CACHE_ERROR          // Processing error
    };

    CacheUpdateResult Process304Response(
        const std::string& cache_key,
        const HttpResponseInfo& not_modified_response) {

      // Find existing cache entry
      HttpCacheEntry* existing_entry = cache_.GetEntry(cache_key);
      if (!existing_entry) {
        return CACHE_ERROR; // No cached entry to update
      }

      // Update metadata from 304 response
      HttpResponseHeaders* updated_headers =
          existing_entry->mutable_response_headers();

      const HttpResponseHeaders* response_headers =
          not_modified_response.headers.get();

      // Update validation headers
      std::string etag;
      if (response_headers->GetNormalizedHeader("ETag", &etag)) {
        updated_headers->SetHeader("ETag", etag);
      }

      std::string last_modified;
      if (response_headers->GetNormalizedHeader("Last-Modified", &last_modified)) {
        updated_headers->SetHeader("Last-Modified", last_modified);
      }

      // Update cache control directives
      std::string cache_control;
      if (response_headers->GetNormalizedHeader("Cache-Control", &cache_control)) {
        updated_headers->SetHeader("Cache-Control", cache_control);
      }

      // Update timestamp to reset age calculation
      updated_headers->SetHeader("Date",
                               base::TimeFormatHTTP(base::Time::Now()));

      // Reset freshness lifetime
      existing_entry->set_response_time(base::Time::Now());

      return CACHE_UPDATED;
    }

    // Optimize 304 response validation speed
    bool FastValidateConditionalRequest(
        const std::string& cache_key,
        const HttpRequestHeaders& request_headers) {

      // Quick validation without full cache entry lookup
      const CacheIndex::Entry* index_entry = cache_index_.GetEntry(cache_key);
      if (!index_entry) {
        return false; // Not in cache
      }

      // Compare ETags directly from index
      std::string if_none_match;
      if (request_headers.GetHeader("If-None-Match", &if_none_match)) {
        return index_entry->etag == if_none_match;
      }

      // Compare timestamps from index
      std::string if_modified_since;
      if (request_headers.GetHeader("If-Modified-Since", &if_modified_since)) {
        base::Time client_time;
        if (base::Time::FromString(if_modified_since.c_str(), &client_time)) {
          return index_entry->last_modified <= client_time;
        }
      }

      return false;
    }
};
```


**💡 Intuitive Understanding:**


304 response mechanism giống như library book validation:


1. **Patron (browser)** checks out book (caches resource)
2. **Returns later** với book receipt (sends conditional headers)
3. **Librarian (server)** checks if book changed (validates ETags/timestamps)
4. **If unchanged:** "Keep your copy" (304 response)
5. **If changed:** "Here's the new version" (200 response với updated content)


**⚙️ Implementation Deep Dive:**


**Performance-Optimized 304 Handler:**


```javascript
class OptimizedConditionalHandler {
  constructor() {
    this.validationCache = new Map(); // Cache validation results
    this.etagIndex = new Map();       // Fast ETag lookup
    this.timestampIndex = new Map();  // Fast timestamp lookup
  }

  // Fast path for 304 validation
  async handleConditionalRequest(request) {
    const url = request.url;
    const ifNoneMatch = request.headers.get('if-none-match');
    const ifModifiedSince = request.headers.get('if-modified-since');

    // Fast ETag validation
    if (ifNoneMatch) {
      const currentETag = this.etagIndex.get(url);
      if (currentETag && this.etagsMatch(ifNoneMatch, currentETag)) {
        return this.create304Response(currentETag, url);
      }
    }

    // Fast timestamp validation
    if (ifModifiedSince) {
      const currentTimestamp = this.timestampIndex.get(url);
      if (currentTimestamp && this.timestampNotModified(ifModifiedSince, currentTimestamp)) {
        return this.create304Response(null, url, currentTimestamp);
      }
    }

    // Validation cache check (avoid redundant work)
    const validationKey = `${url}:${ifNoneMatch || ifModifiedSince}`;
    const cachedValidation = this.validationCache.get(validationKey);
    if (cachedValidation && !this.isValidationExpired(cachedValidation)) {
      return cachedValidation.response;
    }

    // Full validation required
    return this.performFullValidation(request);
  }

  create304Response(etag, url, lastModified) {
    const response = new Response(null, { status: 304 });

    if (etag) {
      response.headers.set('ETag', etag);
    }

    if (lastModified) {
      response.headers.set('Last-Modified', new Date(lastModified).toUTCString());
    }

    // Copy cache control from original response
    const cacheControl = this.getCacheControlForURL(url);
    if (cacheControl) {
      response.headers.set('Cache-Control', cacheControl);
    }

    response.headers.set('Date', new Date().toUTCString());

    return response;
  }

  etagsMatch(clientETag, serverETag) {
    // Handle multiple ETags in If-None-Match
    const clientETags = this.parseETagHeader(clientETag);

    return clientETags.some(tag => {
      // Normalize for comparison (remove W/ prefix)
      const normalizedClient = tag.replace(/^W\//, '');
      const normalizedServer = serverETag.replace(/^W\//, '');
      return normalizedClient === normalizedServer;
    });
  }

  parseETagHeader(etagHeader) {
    // Parse comma-separated ETag list: "tag1", W/"tag2", "tag3"
    const tags = [];
    const regex = /(W\/)?"[^"]+"/g;
    let match;

    while ((match = regex.exec(etagHeader)) !== null) {
      tags.push(match[0]);
    }

    return tags;
  }

  // Performance monitoring
  trackValidationPerformance(url, validationType, responseTime) {
    const metrics = {
      url,
      validationType, // 'etag', 'timestamp', 'full'
      responseTime,
      timestamp: Date.now()
    };

    // Send to monitoring system
    this.sendMetrics('304_validation_performance', metrics);
  }
}
```


**🏭 Production Reality:**


**Tại Webflow (Website publishing platform):**


Multi-layer 304 optimization cho published sites:


```javascript
class WebflowConditionalCaching {
  constructor() {
    this.siteMetadataCache = new Map();
    this.assetVersionCache = new Map();
    this.contentHashCache = new Map();
  }

  // Site-level conditional caching
  async handleSiteRequest(siteId, request) {
    const siteMetadata = await this.getSiteMetadata(siteId);
    const clientETag = request.headers.get('if-none-match');

    // Generate site-level ETag including:
    // - Site content version
    // - CMS collection versions
    // - Asset versions
    // - Publish timestamp
    const siteETag = await this.generateSiteETag(siteId, siteMetadata);

    if (clientETag && clientETag.includes(siteETag)) {
      return new Response(null, {
        status: 304,
        headers: {
          'ETag': `"${siteETag}"`,
          'Cache-Control': 'public, max-age=300', // 5 minutes
          'Vary': 'Accept-Encoding'
        }
      });
    }

    // Generate full site response
    const siteHTML = await this.generateSiteHTML(siteId, siteMetadata);

    return new Response(siteHTML, {
      status: 200,
      headers: {
        'ETag': `"${siteETag}"`,
        'Content-Type': 'text/html',
        'Cache-Control': 'public, max
```


## Claude


-age=300', // 5 minutes
'Vary': 'Accept-Encoding'
}
});
}


```
async generateSiteETag(siteId, metadata) {
  const components = [
    metadata.publishedAt,
    metadata.contentVersion,
    metadata.assetVersion,
    await this.getCMSCollectionVersions(siteId)
  ];

  const combined = components.join('|');
  const hash = await this.computeHash(combined);
  return hash.substring(0, 16);
}

// Asset-level conditional caching với immutable detection
async handleAssetRequest(assetPath, request) {
  const isVersionedAsset = /\.[a-f0-9]{8,}\.(css|js|png|jpg|webp)$/.test(assetPath);

  if (isVersionedAsset) {
    // Versioned assets are immutable
    const clientETag = request.headers.get('if-none-match');
    const assetETag = this.extractVersionFromPath(assetPath);

    if (clientETag && clientETag.includes(assetETag)) {
      return new Response(null, {
        status: 304,
        headers: {
          'ETag': `"${assetETag}"`,
          'Cache-Control': 'public, max-age=31536000, immutable',
          'Expires': new Date(Date.now() + 31536000000).toUTCString()
        }
      });
    }
  }

  // Non-versioned assets use content-based validation
  return this.handleNonVersionedAsset(assetPath, request);
}

// CMS collection conditional caching
async handleCMSCollectionRequest(siteId, collectionSlug, request) {
  const collection = await this.getCMSCollection(siteId, collectionSlug);
  const clientETag = request.headers.get('if-none-match');

  // Collection ETag based on:
  // - Collection schema version
  // - Last item modification time
  // - Item count
  const collectionETag = this.generateCollectionETag(collection);

  if (clientETag === `"${collectionETag}"`) {
    return new Response(null, {
      status: 304,
      headers: {
        'ETag': `"${collectionETag}"`,
        'Cache-Control': 'public, max-age=60', // 1 minute
        'Vary': 'Accept, Accept-Encoding'
      }
    });
  }

  const collectionData = await this.serializeCMSCollection(collection);

  return new Response(JSON.stringify(collectionData), {
    status: 200,
    headers: {
      'ETag': `"${collectionETag}"`,
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=60'
    }
  });
}

generateCollectionETag(collection) {
  const signature = [
    collection.id,
    collection.schema_version,
    collection.updated_at,
    collection.items_count,
    collection.last_item_modified
  ].join(':');

  return this.quickHash(signature);
}

// Performance optimization: Batch validation
async batchValidateMultipleResources(requests) {
  const validations = await Promise.all(
    requests.map(async req => {
      const startTime = performance.now();
      const isNotModified = await this.fastValidateResource(req);
      const endTime = performance.now();

      return {
        url: req.url,
        isNotModified,
        validationTime: endTime - startTime
      };
    })
  );

  // Track performance metrics
  const averageValidationTime = validations.reduce((sum, v) => sum + v.validationTime, 0) / validations.length;
  const notModifiedRate = validations.filter(v => v.isNotModified).length / validations.length;

  this.trackMetrics('batch_validation', {
    requestCount: requests.length,
    averageValidationTime,
    notModifiedRate
  });

  return validations;
}
```


}


```
**Advanced 304 Response Patterns:**

```javascript
class Advanced304Patterns {
  constructor() {
    this.conditionalStrategies = {
      // Progressive enhancement for older clients
      progressive: async (request) => {
        const supportsETags = this.clientSupportsETags(request);
        const supportsStaleWhileRevalidate = this.clientSupportsStaleWhileRevalidate(request);

        if (supportsETags && supportsStaleWhileRevalidate) {
          return this.handleAdvancedConditionalRequest(request);
        } else {
          return this.handleBasicConditionalRequest(request);
        }
      },

      // Hierarchical validation for complex resources
      hierarchical: async (request) => {
        // Validate parent resource first, then children
        const parentValid = await this.validateParentResource(request);
        if (!parentValid) {
          return this.generateFullResponse(request);
        }

        const childrenValid = await this.validateChildResources(request);
        return childrenValid ? this.generate304Response() : this.generatePartialResponse(request);
      },

      // Conditional validation based on resource criticality
      prioritized: async (request) => {
        const resourcePriority = this.getResourcePriority(request.url);
        const validationBudget = this.getValidationBudget();

        if (resourcePriority === 'high' || validationBudget > 0.8) {
          return this.performThoroughValidation(request);
        } else {
          return this.performQuickValidation(request);
        }
      }
    };
  }

  // Smart conditional request routing
  async routeConditionalRequest(request) {
    const url = new URL(request.url);
    const resourceType = this.identifyResourceType(url);

    const strategies = {
      'api': 'progressive',
      'static': 'hierarchical',
      'dynamic': 'prioritized'
    };

    const strategy = strategies[resourceType] || 'progressive';
    return this.conditionalStrategies[strategy](request);
  }

  // Predictive 304 responses
  async predictiveConditionalHandling(request) {
    const userAgent = request.headers.get('user-agent');
    const requestPattern = this.analyzeRequestPattern(request);

    // Predict likely conditional requests
    const predictedRequests = await this.predictNextRequests(requestPattern);

    // Pre-validate predicted resources
    const prevalidationPromises = predictedRequests.map(url =>
      this.prevalidateResource(url)
    );

    await Promise.all(prevalidationPromises);

    // Handle current request with pre-validated context
    return this.handleWithPrevalidation(request);
  }
}
```


**Real-time 304 Response Analytics:**


```javascript
class ConditionalCacheAnalytics {
  constructor() {
    this.metrics = {
      validationRequests: 0,
      notModifiedResponses: 0,
      validationErrors: 0,
      averageValidationTime: 0,
      bandwidthSaved: 0
    };

    this.buckets = {
      by_content_type: new Map(),
      by_validation_type: new Map(),
      by_response_size: new Map(),
      by_time_of_day: new Array(24).fill(0)
    };
  }

  trackConditionalRequest(request, response, metrics) {
    this.metrics.validationRequests++;

    if (response.status === 304) {
      this.metrics.notModifiedResponses++;
      this.metrics.bandwidthSaved += metrics.originalSize;
    }

    // Track by content type
    const contentType = this.extractContentType(request.url);
    const contentStats = this.buckets.by_content_type.get(contentType) || { requests: 0, not_modified: 0 };
    contentStats.requests++;
    if (response.status === 304) contentStats.not_modified++;
    this.buckets.by_content_type.set(contentType, contentStats);

    // Track validation performance
    const validationType = this.determineValidationType(request);
    const validationStats = this.buckets.by_validation_type.get(validationType) || {
      count: 0,
      total_time: 0,
      success_rate: 0
    };
    validationStats.count++;
    validationStats.total_time += metrics.validationTime;
    this.buckets.by_validation_type.set(validationType, validationStats);

    // Track by time of day for pattern analysis
    const hour = new Date().getHours();
    this.buckets.by_time_of_day[hour]++;
  }

  generatePerformanceReport() {
    const hitRate = this.metrics.notModifiedResponses / this.metrics.validationRequests;
    const avgValidationTime = this.metrics.averageValidationTime;
    const bandwidthSavings = this.metrics.bandwidthSaved;

    return {
      summary: {
        hitRate: `${(hitRate * 100).toFixed(2)}%`,
        totalRequests: this.metrics.validationRequests,
        bandwidthSaved: `${(bandwidthSavings / (1024 * 1024)).toFixed(2)} MB`,
        averageValidationTime: `${avgValidationTime.toFixed(2)} ms`
      },

      contentTypeBreakdown: Array.from(this.buckets.by_content_type.entries())
        .map(([type, stats]) => ({
          contentType: type,
          hitRate: `${((stats.not_modified / stats.requests) * 100).toFixed(2)}%`,
          requests: stats.requests
        })),

      validationTypeBreakdown: Array.from(this.buckets.by_validation_type.entries())
        .map(([type, stats]) => ({
          validationType: type,
          averageTime: `${(stats.total_time / stats.count).toFixed(2)} ms`,
          count: stats.count
        })),

      peakHours: this.buckets.by_time_of_day
        .map((count, hour) => ({ hour, requests: count }))
        .sort((a, b) => b.requests - a.requests)
        .slice(0, 3)
    };
  }

  identifyOptimizationOpportunities() {
    const opportunities = [];

    // Low hit rate content types
    for (const [contentType, stats] of this.buckets.by_content_type) {
      const hitRate = stats.not_modified / stats.requests;
      if (hitRate < 0.5 && stats.requests > 100) {
        opportunities.push({
          type: 'low_hit_rate',
          contentType,
          hitRate: `${(hitRate * 100).toFixed(2)}%`,
          suggestion: 'Consider more aggressive caching or better ETag generation'
        });
      }
    }

    // Slow validation types
    for (const [validationType, stats] of this.buckets.by_validation_type) {
      const avgTime = stats.total_time / stats.count;
      if (avgTime > 100 && stats.count > 50) { // >100ms average
        opportunities.push({
          type: 'slow_validation',
          validationType,
          averageTime: `${avgTime.toFixed(2)} ms`,
          suggestion: 'Optimize validation logic or use faster validation method'
        });
      }
    }

    return opportunities;
  }
}
```


**💭 Deep Understanding Process:**


**Performance optimization story tại NAB:**


Challenge: "Online banking API responses showing high 304 validation times"


Investigation approach:


1. **Validation performance profiling:**
javascriptconst validationProfiler = {
  etagValidation: [], // Track ETag validation times
  timestampValidation: [], // Track Last-Modified validation times
  databaseLookups: [], // Track database query times

  profileValidation: async function(validationType, validationFn) {
    const startTime = performance.now();
    const result = await validationFn();
    const endTime = performance.now();

    this[`${validationType}Validation`].push(endTime - startTime);
    return result;
  }
};
2. **Root cause analysis:**
javascript// Problem: ETag generation required database queries
const inefficientETagGeneration = async (accountId) => {
  const account = await database.getAccount(accountId); // 50ms query
  const transactions = await database.getRecentTransactions(accountId); // 100ms query
  const balance = await database.getCurrentBalance(accountId); // 30ms query

  return `"${account.version}-${transactions.hash}-${balance.timestamp}"`;
};

// Solution: Cached metadata approach
const efficientETagGeneration = async (accountId) => {
  const metadata = await cache.getAccountMetadata(accountId); // 2ms lookup
  return `"${metadata.etag}"`;
};
3. **Optimization results:**

304 validation time: 180ms → 5ms
Database load reduction: 75%
User experience improvement: Perceived loading time -85%


**Common 304 optimization pitfalls:**


1. **Expensive validation logic:**
javascript// Anti-pattern: Complex validation
const expensiveValidation = async (resource) => {
  const currentContent = await generateFullResource(resource); // Expensive!
  const currentETag = await hashContent(currentContent);
  return currentETag === cachedETag;
};

// Better: Lightweight validation
const efficientValidation = (resource) => {
  return resource.lastModified <= cachedTimestamp;
};
2. **Missing cache-control headers in 304 responses:**
javascript// Problem: 304 without cache directives
return new Response(null, {
  status: 304,
  headers: { 'ETag': currentETag } // Missing Cache-Control!
});

// Solution: Include cache directives
return new Response(null, {
  status: 304,
  headers: {
    'ETag': currentETag,
    'Cache-Control': 'public, max-age=3600',
    'Expires': new Date(Date.now() + 3600000).toUTCString()
  }
});


**Interview Questions:**


**Q: "A user reports that after clearing their browser cache, the website loads slowly. How would you optimize the cold cache scenario while maintaining efficient 304 responses?"**


**Principal-level solution:**


```javascript
class ColdCacheOptimization {
  constructor() {
    this.warmupStrategies = {
      // Progressive cache warming
      progressive: async (userContext) => {
        const criticalResources = this.identifyCriticalResources(userContext);
        const prioritizedResources = this.prioritizeResources(criticalResources);

        // Warm cache progressively
        for (const resource of prioritizedResources) {
          await this.precacheResource(resource);
          await this.generateConditionalHeaders(resource);
        }
      },

      // Predictive warming based on user patterns
      predictive: async (userHistory) => {
        const likelyResources = await this.predictLikelyResources(userHistory);
        await this.batchPrecache(likelyResources);
      }
    };
  }

  async optimizeColdCacheExperience(request) {
    const userContext = this.extractUserContext(request);

    // Immediate response with cache warming hints
    const response = await this.generateInitialResponse(request);

    // Background cache warming
    this.warmupStrategies.progressive(userContext);

    // Add prefetch hints to response
    this.addResourceHints(response, userContext);

    return response;
  }
}
```


---


## 📚 PHẦN IV: SYSTEM ARCHITECT LEVEL - ADVANCED PATTERNS & OPTIMIZATION


### 🎯 Chapter 6: HTTP Redirects & Cache Interaction


#### 📖 30x Status Codes and Cache Behavior


**🌱 Nguồn Gốc & Motivation:**


HTTP redirects create complex interactions với browser caching mechanisms. Different redirect status codes có different caching behaviors, và understanding này is critical cho system architects designing large-scale applications.


**Redirect evolution:**


- **HTTP/1.0:** 301, 302 redirects introduced
- **HTTP/1.1:** 307, 308 added for method preservation
- **Modern practices:** 303 for POST-redirect-GET pattern
- **HSTS:** Automatic HTTP→HTTPS redirects


**System impact:** Poorly configured redirects can create redirect chains, cache pollution, và performance degradation at scale.


**🔬 Bản Chất & Mechanism:**


**Redirect Status Code Analysis:**


```cpp
class RedirectCacheHandler {
  public:
    enum RedirectCacheability {
      CACHEABLE,           // Can be cached by browsers and proxies
      BROWSER_ONLY,        // Cacheable by browser, not proxies
      NON_CACHEABLE,       // Should not be cached
      CONDITIONAL_CACHE    // Cacheable under specific conditions
    };

    struct RedirectInfo {
      int status_code;
      std::string location;
      RedirectCacheability cacheability;
      base::TimeDelta default_cache_duration;
      bool preserves_method;
      bool allows_body;
    };

    static const std::map<int, RedirectInfo> redirect_behaviors = {
      {301, {301, "", CACHEABLE, base::TimeDelta::FromHours(24), false, false}},
      {302, {302, "", NON_CACHEABLE, base::TimeDelta(), false, false}},
      {303, {303, "", NON_CACHEABLE, base::TimeDelta(), false, false}},
      {307, {307, "", NON_CACHEABLE, base::TimeDelta(), true, true}},
      {308, {308, "", CACHEABLE, base::TimeDelta::FromHours(24), true, true}}
    };

    RedirectCacheDecision DetermineRedirectCaching(
        int status_code,
        const HttpResponseHeaders* headers,
        const std::string& original_method) {

      const auto& redirect_info = redirect_behaviors.at(status_code);
      RedirectCacheDecision decision;

      decision.should_cache = false;
      decision.cache_duration = base::TimeDelta();

      // Check explicit cache headers first
      std::string cache_control;
      if (headers->GetNormalizedHeader("Cache-Control", &cache_control)) {
        if (Contains(cache_control, "no-cache") || Contains(cache_control, "no-store")) {
          decision.should_cache = false;
          return decision;
        }

        // Extract max-age if present
        int max_age = ExtractMaxAge(cache_control);
        if (max_age > 0) {
          decision.should_cache = true;
          decision.cache_duration = base::TimeDelta::FromSeconds(max_age);
          return decision;
        }
      }

      // Check Expires header
      std::string expires;
      if (headers->GetNormalizedHeader("Expires", &expires)) {
        base::Time expires_time;
        if (ParseHttpDate(expires, &expires_time)) {
          base::TimeDelta lifetime = expires_time - base::Time::Now();
          if (lifetime.InSeconds() > 0) {
            decision.should_cache = true;
            decision.cache_duration = lifetime;
            return decision;
          }
        }
      }

      // Fall back to status code default behavior
      if (redirect_info.cacheability == CACHEABLE) {
        decision.should_cache = true;
        decision.cache_duration = redirect_info.default_cache_duration;
      }

      // Special handling for method-changing redirects
      if (!redirect_info.preserves_method && (original_method == "POST" || original_method == "PUT")) {
        // Don't cache redirects that change POST/PUT to GET
        decision.should_cache = false;
      }

      return decision;
    }
};
```


**Redirect Chain Processing:**


```cpp
class RedirectChainProcessor {
  private:
    static const int kMaxRedirectChainLength = 20;
    static const int kMaxCachedRedirects = 5;

  public:
    struct RedirectChain {
      std::vector<GURL> urls;
      std::vector<int> status_codes;
      std::vector<base::TimeDelta> cache_durations;
      int total_redirects;
      bool is_cacheable_chain;
    };

    RedirectChain ProcessRedirectChain(const GURL& initial_url) {
      RedirectChain chain;
      chain.urls.push_back(initial_url);
      chain.total_redirects = 0;
      chain.is_cacheable_chain = true;

      GURL current_url = initial_url;

      while (chain.total_redirects < kMaxRedirectChainLength) {
        // Check if we have cached redirect for current URL
        const CachedRedirect* cached = GetCachedRedirect(current_url);
        if (cached && !cached->IsExpired()) {
          chain.urls.push_back(cached->target_url);
          chain.status_codes.push_back(cached->status_code);
          chain.cache_durations.push_back(cached->remaining_lifetime);

          current_url = cached->target_url;
          chain.total_redirects++;
          continue;
        }

        // Fetch and process redirect
        HttpResponseInfo response = FetchURL(current_url);

        if (!IsRedirectStatus(response.status_code)) {
          break; // Final destination reached
        }

        std::string location;
        if (!response.headers->GetNormalizedHeader("Location", &location)) {
          break; // Invalid redirect
        }

        GURL next_url = current_url.Resolve(location);
        if (!next_url.is_valid()) {
          break;
        }

        // Check for redirect loops
        if (std::find(chain.urls.begin(), chain.urls.end(), next_url) != chain.urls.end()) {
          break; // Redirect loop detected
        }

        chain.urls.push_back(next_url);
        chain.status_codes.push_back(response.status_code);

        // Determine caching for this redirect
        RedirectCacheDecision cache_decision =
            DetermineRedirectCaching(response.status_code, response.headers.get(), "GET");

        if (cache_decision.should_cache && chain.total_redirects < kMaxCachedRedirects) {
          CacheRedirect(current_url, next_url, response.status_code, cache_decision.cache_duration);
          chain.cache_durations.push_back(cache_decision.cache_duration);
        } else {
          chain.is_cacheable_chain = false;
          chain.cache_durations.push_back(base::TimeDelta());
        }

        current_url = next_url;
        chain.total_redirects++;
      }

      return chain;
    }

    // Optimize redirect chains by caching intermediate redirects
    void OptimizeRedirectChain(const RedirectChain& chain) {
      if (chain.total_redirects <= 1) return;

      // Cache direct mappings for common redirect patterns
      if (IsCommonRedirectPattern(chain)) {
        const GURL& initial_url = chain.urls[0];
        const GURL& final_url = chain.urls.back();

        // Cache direct mapping with shorter TTL
        base::TimeDelta cache_ttl = base::TimeDelta::FromMinutes(30);
        CacheRedirect(initial_url, final_url, 307, cache_ttl);
      }
    }
};
```


**💡 Intuitive Understanding:**


HTTP redirect caching giống như GPS route optimization:


- **301 Permanent Redirect** = "This road is permanently closed, always use the detour"
- **302 Temporary Redirect** = "Road closed for construction, check again later"
- **307 Temporary Redirect** = "Same as 302 but don't change your driving method"
- **308 Permanent Redirect** = "Same as 301 but don't change your driving method"


**Cache implications:**


- Cached redirects = Skip asking for directions
- Redirect chains = Multiple turns to reach destination
- Cache invalidation = Updated route information


**⚙️ Implementation Deep Dive:**


**Smart Redirect Cache Strategy:**


```javascript
class SmartRedirectCache {
  constructor() {
    this.redirectCache = new Map();
    this.redirectChains = new Map();
    this.redirectMetrics = new Map();

    // Different caching strategies for different redirect patterns
    this.strategies = {
      // WWW canonicalization
      canonicalization: {
        pattern: /^https?:\/\/(www\.)?([^\/]+)(.*)$/,
        cacheTTL: 86400000, // 24 hours
        permanent: true
      },

      // HTTP to HTTPS upgrades
      protocolUpgrade: {
        pattern: /^http:\/\/(.+)$/,
        cacheTTL: 3600000, // 1 hour (shorter for security)
        permanent: false
      },

      // URL shortener redirects
      shortener: {
        pattern: /^https?:\/\/(bit\.ly|t\.co|tinyurl\.com)/,
        cacheTTL: 1800000, // 30 minutes
        permanent: false
      },

      // API version redirects
      apiVersion: {
        pattern: /\/api\/v\d+\//,
        cacheTTL: 3600000, // 1 hour
        permanent: false
      }
    };
  }

  async handleRedirectRequest(url, options = {}) {
    const cacheKey = this.generateRedirectCacheKey(url);

    // Check for cached redirect
    const cachedRedirect = this.redirectCache.get(cacheKey);
    if (cachedRedirect && !this.isRedirectExpired(cachedRedirect)) {
      this.updateRedirectMetrics(url, 'cache_hit');

      // Follow cached redirect
      return this.handleRedirectRequest(cachedRedirect.targetUrl, {
        ...options,
        redirectCount: (options.redirectCount || 0) + 1
      });
    }

    // Fetch and process redirect
    const response = await fetch(url, {
      method: options.method || 'GET',
      redirect: 'manual' // Handle redirects manually
    });

    if (this.isRedirectStatus(response.status)) {
      const location = response.headers.get('location');
      if (!location) {
        throw new Error('Redirect response missing Location header');
      }

      const targetUrl = new URL(location, url).href;
      const redirectInfo = {
        sourceUrl: url,
        targetUrl,
        statusCode: response.status,
        timestamp: Date.now(),
        headers: Object.fromEntries(response.headers.entries())
      };

      // Determine caching strategy
      const cacheDecision = this.shouldCacheRedirect(redirectInfo);
      if (cacheDecision.shouldCache) {
        this.cacheRedirect(cacheKey, redirectInfo, cacheDecision.ttl);
      }

      this.updateRedirectMetrics(url, 'redirect_followed');

      // Prevent infinite redirect loops
      if ((options.redirectCount || 0) >= 20) {
        throw new Error('Too many redirects');
      }

      // Follow redirect
      return this.handleRedirectRequest(targetUrl, {
        ...options,
        redirectCount: (options.redirectCount || 0) + 1
      });
    }

    return response;
  }

  shouldCacheRedirect(redirectInfo) {
    const { statusCode, sourceUrl, headers } = redirectInfo;

    // Check explicit cache headers
    const cacheControl = headers['cache-control'];
    if (cacheControl) {
      if (cacheControl.includes('no-cache') || cacheControl.includes('no-store')) {
        return { shouldCache: false };
      }

      const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
      if (maxAgeMatch) {
        return {
          shouldCache: true,
          ttl: parseInt(maxAgeMatch[1]) * 1000
        };
      }
    }

    // Status code based caching
    switch (statusCode) {
      case 301: // Permanent redirect
      case 308: // Permanent redirect (method preserved)
        return { shouldCache: true, ttl: 86400000 }; // 24 hours

      case 302: // Temporary redirect
      case 303: // See other
      case 307: // Temporary redirect (method preserved)
        // Only cache if we have explicit cache headers
        return { shouldCache: false };

      default:
        return { shouldCache: false };
    }
  }

  // Pattern-based redirect optimization
  optimizeRedirectPatterns() {
    const patterns = this.analyzeRedirectPatterns();

    for (const [pattern, redirects] of patterns) {
      if (redirects.length > 10 && redirects[0].consistency > 0.9) {
        // Create pattern-based cache entry
        this.createPatternCache(pattern, redirects[0].commonTarget);
      }
    }
  }

  analyzeRedirectPatterns() {
    const patterns = new Map();

    for (const [cacheKey, redirectInfo] of this.redirectCache) {
      for (const [patternName, strategy] of Object.entries(this.strategies)) {
        if (strategy.pattern.test(redirectInfo.sourceUrl)) {
          if (!patterns.has(patternName)) {
            patterns.set(patternName, []);
          }
          patterns.get(patternName).push(redirectInfo);
        }
      }
    }

    return patterns;
  }
}
```


**🏭 Production Reality:**


**Tại Figma (Global design platform):**


Sophisticated redirect handling cho multi-region deployment:


```javascript
class FigmaRedirectOptimizer {
  constructor() {
    this.regionMap = {
      'us-east': 'figma.com',
      'us-west': 'figma.com',
      'eu': 'eu.figma.com',
      'asia': 'asia.figma.com'
    };

    this.redirectStrategies = {
      // Region-based redirects
      regional: async (request) => {
        const userRegion = await this.detectUserRegion(request);
        const targetDomain = this.regionMap[userRegion];

        if (request.url.hostname !== targetDomain) {
          return this.createRegionalRedirect(request.url, targetDomain);
        }

        return null; // No redirect needed
      },

      // Authentication redirects
      auth: async (request) => {
        const authToken = this.extractAuthToken(request);

        if (!authToken && this.requiresAuth(request.url)) {
          return this.createAuthRedirect(request.url);
        }

        return null;
      },

      // File access redirects
      fileAccess: async (request) => {
        const fileId = this.extractFileId(request.url);
        if (fileId) {
          const fileLocation = await this.getOptimalFileServer(fileId);
          if (fileLocation !== request.url.hostname) {
            return this.createFileAccessRedirect(request.url, fileLocation);
          }
        }

        return null;
      }
    };
  }

  async handleFigmaRequest(request) {
    // Apply redirect strategies in priority order
    const strategies = ['auth', 'regional', 'fileAccess'];

    for (const strategyName of strategies) {
      const redirect = await this.redirectStrategies[strategyName](request);
      if (redirect) {
        return this.processRedirectWithCaching(redirect, strategyName);
      }
    }

    // No redirect needed, process normally
    return this.handleNormalRequest(request);
  }

  createRegionalRedirect(originalUrl, targetDomain) {
    const redirectUrl = new URL(originalUrl);
    redirectUrl.hostname = targetDomain;

    return {
      status: 302, // Temporary - user's region might change
      location: redirectUrl.href,
      cacheControl: 'private, max-age=1800', // 30 minutes
      reason: 'regional_optimization'
    };
  }

  createFileAccessRedirect(originalUrl, fileServer) {
    const redirectUrl = new URL(originalUrl);
    redirectUrl.hostname = fileServer;

    return {
      status: 307, // Preserve method for file operations
      location: redirectUrl.href,
      cacheControl: 'private, max-age=300', // 5 minutes
      reason: 'file_server_optimization'
    };
  }

  async detectUserRegion(request) {
    // Multiple detection methods for accuracy
    const detectionMethods = [
      () => this.getRegionFromCookie(request),
      () => this.getRegionFromHeader(request),
      () => this.getRegionFromIP(request),
      () => 'us-east' // Default fallback
    ];

    for (const method of detectionMethods) {
      const region = await method();
      if (region && this.regionMap[region]) {
        return region;
      }
    }

    return 'us-east'; // Ultimate fallback
  }

  // Advanced redirect chain optimization
  async optimizeRedirectChains() {
    const chains = await this.analyzeRedirectChains();

    for (const chain of chains) {
      if (chain.length > 2 && chain.frequency > 100) {
        // Create direct mapping for common chains
        await this.createChainShortcut(chain);
      }
    }
  }

  async createChainShortcut(chain) {
    const sourceUrl = chain[0];
    const finalUrl = chain[chain.length - 1];

    // Cache direct mapping
    await this.cacheRedirect(sourceUrl, {
      targetUrl: finalUrl,
      statusCode: 307,
      ttl: 1800000, // 30 minutes
      reason: 'chain_optimization'
    });

    console.log(`Created redirect shortcut: ${sourceUrl} -> ${finalUrl}`);
  }
}
```


**HSTS and Secure Redirect Handling:**


```javascript
class SecureRedirectManager {
  constructor() {
    this.hstsCache = new Map();
    this.securityPolicies = {
      // Strict Transport Security
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true
      },

      // Content Security Policy for redirects
      csp: {
        'upgrade-insecure-requests': true,
        'block-all-mixed-content': true
      }
    };
  }

  async handleSecurityRedirect(request) {
    const url = new URL(request.url);

    // Handle HTTP to HTTPS upgrades
    if (url.protocol === 'http:') {
      const hstsPolicy = this.getHSTSPolicy(url.hostname);

      if (hstsPolicy) {
        // HSTS policy exists - upgrade to HTTPS
        url.protocol = 'https:';

        return {
          status: 301, // Permanent redirect for security
          location: url.href,
          headers: {
            'Strict-Transport-Security': this.generateHSTSHeader(hstsPolicy),
            'Cache-Control': 'public, max-age=31536000' // Cache HTTPS upgrade
          },
          reason: 'hsts_upgrade'
        };
      }
    }

    // Handle mixed content upgrades
    if (this.isMixedContentRequest(request)) {
      return this.handleMixedContentUpgrade(request);
    }

    return null; // No security redirect needed
  }

  getHSTSPolicy(hostname) {
    // Check cached HSTS policies
    const cachedPolicy = this.hstsCache.get(hostname);
    if (cachedPolicy && !this.isHSTSExpired(cachedPolicy)) {
      return cachedPolicy;
    }

    // Check HSTS preload list
    if (this.isInHSTSPreloadList(hostname)) {
      const policy = {
        maxAge: 31536000,
        includeSubDomains: true,
        timestamp: Date.now()
      };

      this.hstsCache.set(hostname, policy);
      return policy;
    }

    return null;
  }

  generateHSTSHeader(policy) {
    let header = `max-age=${policy.maxAge}`;

    if (policy.includeSubDomains) {
      header += '; includeSubDomains';
    }

    if (policy.preload) {
      header += '; preload';
    }

    return header;
  }

  // Performance optimization: Batch security header processing
  async batchProcessSecurityRedirects(requests) {
    const securityRedirects = await Promise.all(
      requests.map(async request => {
        const redirect = await this.handleSecurityRedirect(request);
        return { request, redirect };
      })
    );

    // Group by redirect type for optimization
    const redirectGroups = this.groupRedirectsByType(securityRedirects);

    // Apply batch optimizations
    for (const [type, redirects] of redirectGroups) {
      await this.optimizeRedirectGroup(type, redirects);
    }

    return securityRedirects;
  }
}
```


**💭 Deep Understanding Process:**


**Performance debugging story tại Binance:**


Challenge: "Trading API showing high latency due to redirect chains"


Investigation process:


1. **Redirect chain analysis:**
javascriptconst redirectAnalyzer = {
  chains: new Map(),

  analyzeRequest: function(url) {
    const chain = [];
    let currentUrl = url;
    let redirectCount = 0;

    while (redirectCount < 10) {
      const response = this.makeHeadRequest(currentUrl);

      if (!this.isRedirect(response.status)) {
        break;
      }

      const location = response.headers.get('location');
      chain.push({
        url: currentUrl,
        status: response.status,
        location
      });

      currentUrl = new URL(location, currentUrl).href;
      redirectCount++;
    }

    return chain;
  }
};
2. **Root cause identification:**
Original URL: http://api.binance.com/v1/ticker
Redirect 1: 301 -> https://api.binance.com/v1/ticker
Redirect 2: 301 -> https://api.binance.com/v3/ticker
Redirect 3: 302 -> https://api1.binance.com/v3/ticker
Final: 200 OK

Total redirects: 3
Additional latency: ~150ms
3. **Optimization solution:**
javascriptclass BinanceRedirectOptimizer {
  constructor() {
    this.directMappings = new Map([
      ['http://api.binance.com/v1/', 'https://api1.binance.com/v3/'],
      ['https://api.binance.com/v1/', 'https://api1.binance.com/v3/']
    ]);
  }

  optimizeURL(originalUrl) {
    for (const [pattern, replacement] of this.directMappings) {
      if (originalUrl.startsWith(pattern)) {
        return originalUrl.replace(pattern, replacement);
      }
    }
    return originalUrl;
  }
}
4. **Results:**

Reduced redirect chains: 3 → 0
API latency improvement: 150ms reduction
Bandwidth savings: 40% for repeated requests


**Common redirect optimization strategies:**


1. **Redirect chain elimination:**
javascript// Before: Multiple redirects
http://example.com → https://example.com → https://www.example.com → https://app.example.com

// After: Direct mapping
http://example.com → https://app.example.com
2. **Conditional redirect caching:**
javascriptconst redirectCacheStrategy = {
  permanent: 'public, max-age=31536000', // 1 year
  temporary: 'private, max-age=300',     // 5 minutes
  conditional: 'public, max-age=3600'    // 1 hour
};


**Interview Questions:**


**Q: "How would you optimize redirect performance for a global CDN serving millions of requests?"**


**System Architect level approach:**


```javascript
class GlobalRedirectOptimizer {
  constructor() {
    this.edgeOptimizations = {
      // Pre-compute redirect mappings
      precomputed: new Map(),

      // Regional redirect policies
      regional: new Map(),

      // A/B testing redirect variants
      experimental: new Map()
    };
  }

  async optimizeAtEdge(request) {
    const region = this.detectRegion(request);
    const optimization = this.selectOptimization(request, region);

    switch (optimization.type) {
      case 'precomputed':
        return this.servePrecomputedRedirect(request);

      case 'regional':
        return this.serveRegionalRedirect(request, region);

      case 'experimental':
        return this.serveExperimentalRedirect(request);

      default:
        return this.serveStandardRedirect(request);
    }
  }
}
```


---


#### 📖 HTTPS Upgrade Redirects - Security Meets Performance


**🌱 Nguồn Gốc & Motivation:**


HTTPS upgrade redirects represent critical intersection của security và performance optimization. Modern web applications must handle HTTP-to-HTTPS upgrades efficiently while maintaining optimal user experience.


**Evolution timeline:**


- **2010s:** Manual HTTPS implementation
- **2014:** Let's Encrypt democratizes SSL certificates
- **2016:** HTTP/2 requires HTTPS for most benefits
- **2018:** Chrome marks HTTP sites as "Not Secure"
- **2020s:** HTTPS-first policies, automatic upgrades


**System Architect perspective:** HTTPS redirects affect caching strategies, CDN configurations, and overall application architecture decisions.


**🔬 Bản Chất & Mechanism:**


**HTTPS Upgrade Strategy Implementation:**


```cpp
class HTTPSUpgradeManager {
  public:
    enum UpgradeStrategy {
      IMMEDIATE_REDIRECT,     // Always redirect HTTP to HTTPS
      CONDITIONAL_UPGRADE,    // Upgrade based on resource type/user
      HSTS_ENFORCEMENT,      // Use HSTS to force browser upgrades
      MIXED_CONTENT_UPGRADE, // Upgrade mixed content automatically
      PROGRESSIVE_UPGRADE    // Gradually upgrade user base
    };

  private:
    struct UpgradePolicy {
      UpgradeStrategy strategy;
      int redirect_status_code;    // 301, 302, 307, 308
      base::TimeDelta cache_duration;
      bool include_hsts_header;
      bool upgrade_all_requests;
      std::vector<std::string> exempted_paths;
    };

    std::map<std::string, UpgradePolicy> domain_policies_;

  public:
    HttpResponseInfo ProcessHTTPRequest(
        const std::string& domain,
        const GURL& request_url,
        const HttpRequestHeaders& request_headers) {

      const UpgradePolicy& policy = GetUpgradePolicy(domain);

      // Check if this request should be upgraded
      if (!ShouldUpgradeRequest(request_url, policy)) {
        return ProcessAsHTTP(request_url, request_headers);
      }

      // Create HTTPS redirect
      GURL https_url = UpgradeToHTTPS(request_url);

      HttpResponseInfo redirect_response;
      redirect_response.status_code = policy.redirect_status_code;
      redirect_response.status_text = GetStatusText(policy.redirect_status_code);

      // Set redirect headers
      HttpResponseHeaders* headers = redirect_response.headers.get();
      headers->SetHeader("Location", https_url.spec());

      // Add caching headers
      std::string cache_control = GenerateCacheControl(policy.cache_duration);
      headers->SetHeader("Cache-Control", cache_control);

      // Add HSTS header if policy requires
      if (policy.include_hsts_header) {
        std::string hsts_header = GenerateHSTSHeader(domain);
        headers->SetHeader("Strict-Transport-Security", hsts_header);
      }

      // Add security headers
      headers->SetHeader("Content-Security-Policy", "upgrade-insecure-requests");

      return redirect_response;
    }

  private:
    bool ShouldUpgradeRequest(const GURL& url, const UpgradePolicy& policy) {
      // Check exempted paths
      for (const auto& exempted_path : policy.exempted_paths) {
        if (url.path().starts_with(exempted_path)) {
          return false;
        }
      }

      // Strategy-specific logic
      switch (policy.strategy) {
        case IMMEDIATE_REDIRECT:
          return true;

        case CONDITIONAL_UPGRADE:
          return IsUpgradeableResource(url);

        case HSTS_ENFORCEMENT:
          return HasHSTSPolicy(url.host());

        case MIXED_CONTENT_UPGRADE:
          return IsMixedContentRequest(url);

        case PROGRESSIVE_UPGRADE:
          return ShouldUpgradeProgressively(url);
      }

      return false;
    }

    std::string GenerateHSTSHeader(const std::string& domain) {
      // Generate HSTS header based on domain security policy
      const SecurityPolicy& security_policy = GetSecurityPolicy(domain);

      std::stringstream hsts_header;
      hsts_header << "max-age=" << security_policy.hsts_max_age;

      if (security_policy.include_subdomains) {
        hsts_header << "; includeSubDomains";
      }

      if (security_policy.preload) {
        hsts_header << "; preload";
      }

      return hsts_header.str();
    }
};
```


**Smart HTTPS Upgrade with Performance Optimization:**


```javascript
class SmartHTTPSUpgrader {
  constructor() {
    this.upgradeStrategies = {
      // Immediate upgrade for all requests
      aggressive: {
        shouldUpgrade: () => true,
        redirectStatus: 301, // Permanent redirect
        cacheControl: 'public, max-age=31536000', // 1 year cache
        hstsMaxAge: 31536000
      },

      // Progressive upgrade based on user agent capabilities
      progressive: {
        shouldUpgrade: (request) => this.supportsHTTPS(request),
        redirectStatus: 302, // Temporary redirect during transition
        cacheControl: 'public, max-age=3600', // 1 hour cache
        hstsMaxAge: 86400 // 24 hours
      },

      // Resource-type based upgrade
      resourceBased: {
        shouldUpgrade: (request) => this.isUpgradeableResource(request),
        redirectStatus: 307, // Method preserving
        cacheControl: 'private, max-age=1800', // 30 minutes
        hstsMaxAge: 7200 // 2 hours
      }
    };

    this.performanceMetrics = {
      upgradeLatency: [],
      cacheHitRate: 0,
      httpsAdoptionRate: 0
    };
  }

  async handleHTTPRequest(request) {
    const startTime = performance.now();
    const url = new URL(request.url);

    // Skip upgrade for HTTP requests that shouldn't be upgraded
    if (this.shouldSkipUpgrade(url)) {
      return this.handleAsHTTP(request);
    }

    // Select upgrade strategy
    const strategy = this.selectUpgradeStrategy(request);

    if (!strategy.shouldUpgrade(request)) {
      return this.handleAsHTTP(request);
    }

    // Check for cached HTTPS redirect
    const cachedRedirect = await this.getCachedHTTPSRedirect(url.href);
    if (cachedRedirect) {
      this.trackMetrics('cache_hit', performance.now() - startTime);
      return cachedRedirect;
    }

    // Create HTTPS redirect
    const httpsUrl = this.upgradeToHTTPS(url);
    const redirectResponse = this.createHTTPSRedirect(httpsUrl, strategy);

    // Cache the redirect for future requests
    await this.cacheHTTPSRedirect(url.href, redirectResponse, strategy);

    this.trackMetrics('redirect_created', performance.now() - startTime);
    return redirectResponse;
  }

  upgradeToHTTPS(httpUrl) {
    const httpsUrl = new URL(httpUrl.href);
    httpsUrl.protocol = 'https:';

    // Handle port mapping
    if (httpsUrl.port === '80') {
      httpsUrl.port = '443';
    } else if (httpsUrl.port === '') {
      // Default ports don't need explicit specification
    }

    return httpsUrl;
  }

  createHTTPSRedirect(httpsUrl, strategy) {
    const headers = new Headers({
      'Location': httpsUrl.href,
      'Cache-Control': strategy.cacheControl,
      'Strict-Transport-Security': `max-age=${strategy.hstsMaxAge}; includeSubDomains; preload`,
      'Content-Security-Policy': 'upgrade-insecure-requests',
      'Vary': 'User-Agent', // Vary on user agent for progressive strategies
    });

    return new Response(null, {
      status: strategy.redirectStatus,
      headers: headers
    });
  }

  // Advanced: Service Worker integration for client-side HTTPS upgrades
  generateServiceWorkerUpgradeLogic() {
    return `
      // Service Worker code for automatic HTTPS upgrades
      self.addEventListener('fetch', (event) => {
        const url = new URL(event.request.url);

        if (url.protocol === 'http:' && this.shouldUpgradeToHTTPS(url)) {
          url.protocol = 'https:';

          const httpsRequest = new Request(url.href, {
            method: event.request.method,
            headers: event.request.headers,
            body: event.request.body,
            mode: event.request.mode,
            credentials: event.request.credentials,
            cache: event.request.cache,
            redirect: event.request.redirect,
            referrer: event.request.referrer
          });

          event.respondWith(fetch(httpsRequest));
        }
      });

      shouldUpgradeToHTTPS(url) {
        // Check HSTS policy
        const hstsPolicy = this.getHSTSPolicy(url.hostname);
        if (hstsPolicy && !hstsPolicy.expired) {
          return true;
        }

        // Check upgrade patterns
        const upgradePatterns = [
          /api\\./,
          /secure\\./,
          /checkout\\./,
          /login\\./,
          /account\\./
        ];

        return upgradePatterns.some(pattern => pattern.test(url.hostname));
      }
    `;
  }

  // Performance optimization: Bulk HTTPS redirect processing
  async bulkProcessHTTPSUpgrades(requests) {
    // Group requests by domain for batch processing
    const requestsByDomain = this.groupRequestsByDomain(requests);

    const upgradePromises = Object.entries(requestsByDomain).map(
      async ([domain, domainRequests]) => {
        const domainStrategy = this.getDomainUpgradeStrategy(domain);

        return Promise.all(
          domainRequests.map(request =>
            this.processHTTPSUpgradeWithStrategy(request, domainStrategy)
          )
        );
      }
    );

    const results = await Promise.all(upgradePromises);
    return results.flat();
  }
}
```


**🏭 Production Reality:**


**Tại Axon (Law enforcement technology):**


Security-critical HTTPS implementation với zero-downtime upgrades:


```javascript
class AxonSecureRedirectManager {
  constructor() {
    this.securityLevels = {
      // Evidence management - highest security
      evidence: {
        forceHTTPS: true,
        hstsMaxAge: 63072000, // 2 years
        includeSubDomains: true,
        preload: true,
        redirectStatus: 301,
        cacheControl: 'public, max-age=31536000'
      },

      // Officer dashboard - high security
      dashboard: {
        forceHTTPS: true,
        hstsMaxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: false,
        redirectStatus: 301,
        cacheControl: 'private, max-age=86400'
      },

      // Public API - standard security
      api: {
        forceHTTPS: true,
        hstsMaxAge: 86400, // 24 hours
        includeSubDomains: false,
        preload: false,
        redirectStatus: 307, // Preserve method for API calls
        cacheControl: 'public, max-age=3600'
      },

      // Marketing site - flexible security
      marketing: {
        forceHTTPS: false, // Allow HTTP for A/B testing
        hstsMaxAge: 3600, // 1 hour
        includeSubDomains: false,
        preload: false,
        redirectStatus: 302,
        cacheControl: 'public, max-age=1800'
      }
    };
  }

  async handleAxonRequest(request) {
    const url = new URL(request.url);
    const securityLevel = this.determineSecurityLevel(url);
    const config = this.securityLevels[securityLevel];

    // Force HTTPS for security-critical endpoints
    if (url.protocol === 'http:' && config.forceHTTPS) {
      return this.createSecureRedirect(url, config);
    }

    // Handle HTTPS request normally
    if (url.protocol === 'https:') {
      return this.handleSecureRequest(request, config);
    }

    // Allow HTTP for non-critical endpoints (if configured)
    return this.handleInsecureRequest(request, config);
  }

  determineSecurityLevel(url) {
    const path = url.pathname;

    if (path.startsWith('/evidence/') || path.startsWith('/storage/')) {
      return 'evidence';
    }

    if (path.startsWith('/dashboard/') || path.startsWith('/officer/')) {
      return 'dashboard';
    }

    if (path.startsWith('/api/')) {
      return 'api';
    }

    return 'marketing';
  }

  createSecureRedirect(httpUrl, config) {
    const httpsUrl = new URL(httpUrl.href);
    httpsUrl.protocol = 'https:';

    const headers = new Headers({
      'Location': httpsUrl.href,
      'Cache-Control': config.cacheControl,
      'Strict-Transport-Security': this.generateHSTSHeader(config),
      'Content-Security-Policy': 'upgrade-insecure-requests; block-all-mixed-content',
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    });

    return new Response(null, {
      status: config.redirectStatus,
      headers: headers
    });
  }

  generateHSTSHeader(config) {
    let header = `max-age=${config.hstsMaxAge}`;

    if (config.includeSubDomains) {
      header += '; includeSubDomains';
    }

    if (config.preload) {
      header += '; preload';
    }

    return header;
  }

  // Zero-downtime HTTPS migration strategy
  async performGradualHTTPSMigration(domain) {
    const migrationPhases = [
      { name: 'testing', percentage: 5, duration: 86400000 }, // 1 day
      { name: 'early_adopters', percentage: 25, duration: 604800000 }, // 1 week
      { name: 'general_rollout', percentage: 75, duration: 604800000 }, // 1 week
      { name: 'complete', percentage: 100, duration: Infinity }
    ];

    for (const phase of migrationPhases) {
      console.log(`Starting HTTPS migration phase: ${phase.name}`);

      await this.updateHTTPSRedirectPercentage(domain, phase.percentage);
      await this.monitorHTTPSMigrationHealth(domain, phase.duration);

      const healthMetrics = await this.getHTTPSHealthMetrics(domain);
      if (healthMetrics.errorRate > 0.01) { // 1% error threshold
        console.error(`HTTPS migration health check failed for ${domain}`);
        await this.rollbackHTTPSMigration(domain);
        throw new Error('HTTPS migration failed health check');
      }
    }

    console.log(`HTTPS migration completed for ${domain}`);
  }

  async monitorHTTPSMigrationHealth(domain, duration) {
    const startTime = Date.now();

    while (Date.now() - startTime < duration) {
      const metrics = await this.collectHTTPSMetrics(domain);

      await this.reportMigrationMetrics(domain, metrics);

      // Check for critical issues
      if (metrics.httpsErrorRate > 0.05) { // 5% error rate
        throw new Error(`High HTTPS error rate detected: ${metrics.httpsErrorRate}`);
      }

      if (metrics.certificateIssues > 0) {
        throw new Error(`SSL certificate issues detected: ${metrics.certificateIssues}`);
      }

      // Wait before next check
      await new Promise(resolve => setTimeout(resolve, 300000)); // 5 minutes
    }
  }
}
```


**CDN-level HTTPS Optimization:**


```javascript
// Cloudflare Worker for optimized HTTPS redirects
addEventListener('fetch', event => {
  event.respondWith(handleHTTPSOptimization(event.request));
});

async function handleHTTPSOptimization(request) {
  const url = new URL(request.url);

  // Skip HTTPS redirect for already secure requests
  if (url.protocol === 'https:') {
    return handleSecureRequest(request);
  }

  // Check for cached HTTPS redirect
  const cacheKey = `https-redirect:${url.hostname}${url.pathname}`;
  const cache = caches.default;
  const cachedResponse = await cache.match(cacheKey);

  if (cachedResponse) {
    return cachedResponse;
  }

  // Create optimized HTTPS redirect
  const httpsUrl = new URL(url.href);
  httpsUrl.protocol = 'https:';

  const redirectResponse = new Response(null, {
    status: 301,
    headers: {
      'Location': httpsUrl.href,
      'Cache-Control': 'public, max-age=86400', // 24 hours
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
      'Content-Security-Policy': 'upgrade-insecure-requests'
    }
  });

  // Cache redirect at edge for 24 hours
  event.waitUntil(cache.put(cacheKey, redirectResponse.clone()));

  return redirectResponse;
}

async function handleSecureRequest(request) {
  const response = await fetch(request);

  // Add security headers to all HTTPS responses
  const secureResponse = new Response(response.body, response);
  secureResponse.headers.set('Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload');
  secureResponse.headers.set('Content-Security-Policy',
    'upgrade-insecure-requests; block-all-mixed-content');

  return secureResponse;
}
```


**💭 Deep Understanding Process:**


**HTTPS migration story tại Webflow:**


Challenge: "Migrate 1M+ hosted websites from HTTP to HTTPS without breaking user sites"


Strategic approach:


1. **Phased rollout dengan careful monitoring:**
javascriptconst migrationStrategy = {
  phase1: {
    percentage: 1, // 1% of sites
    criteria: 'new_sites_only',
    monitoring: 'intensive'
  },
  phase2: {
    percentage: 10,
    criteria: 'active_sites_low_traffic',
    monitoring: 'standard'
  },
  phase3: {
    percentage: 50,
    criteria: 'active_sites_medium_traffic',
    monitoring: 'automated'
  },
  phase4: {
    percentage: 100,
    criteria: 'all_remaining_sites',
    monitoring: 'automated'
  }
};
2. **Custom certificate provisioning:**
javascriptasync function provisionSSLCertificate(domain) {
  try {
    // Use Let's Encrypt ACME protocol
    const certificate = await acmeClient.requestCertificate({
      domains: [domain, `www.${domain}`],
      challengeType: 'http-01'
    });

    await this.deployCertificateToEdge(certificate, domain);
    return { success: true, certificate };
  } catch (error) {
    console.error(`SSL provisioning failed for ${domain}:`, error);
    return { success: false, error: error.message };
  }
}
3. **Graceful fallback mechanisms:**
javascriptasync function handleSSLFailure(domain, request) {
  // Log SSL failure for investigation
  await this.logSSLFailure(domain, {
    error: 'certificate_unavailable',
    timestamp: Date.now(),
    userAgent: request.headers.get('user-agent')
  });

  // Serve HTTP version with upgrade hint
  const response = await this.serveHTTPVersion(request);
  response.headers.set('Upgrade-Insecure-Requests', '1');

  return response;
}


**Performance impact analysis:**


```javascript
const httpsPerformanceMetrics = {
  // Latency impact
  redirectOverhead: 150, // ms average
  tlsHandshakeTime: 100, // ms average
  certificateValidation: 50, // ms average

  // Bandwidth impact
  redirectResponseSize: 342, // bytes average
  hstsHeaderSize: 85, // bytes

  // Caching benefits
  redirectCacheHitRate: 0.92, // 92% cache hit rate
  cacheDurationOptimal: 86400 // 24 hours
};

const optimizationStrategies = {
  // Reduce redirect overhead
  preloadHSTS: 'Browsers automatically upgrade HTTP to HTTPS',

  // TLS optimization
  http2ServerPush: 'Push critical resources during TLS handshake',
  ocspStapling: 'Include certificate status in TLS handshake',

  // Certificate optimization
  ecdsaCertificates: 'Smaller certificate size, faster validation',
  certificatePinning: 'Skip certificate validation for known domains'
};
```


**Interview Questions:**


**Q: "Design an HTTPS migration strategy for a high-traffic e-commerce site with complex checkout flows"**


**System Architect approach:**


```javascript
class EcommerceHTTPSMigration {
  constructor() {
    this.criticalFlows = [
      'checkout',
      'payment',
      'user_auth',
      'admin_panel'
    ];

    this.migrationStrategy = {
      // Phase 1: Critical security paths first
      securityCritical: {
        paths: ['/checkout/*', '/payment/*', '/admin/*'],
        redirectStatus: 301,
        hstsMaxAge: 31536000,
        rolloutPercentage: 100
      },

      // Phase 2: User accounts and auth
      userFlows: {
        paths: ['/login', '/register', '/account/*'],
        redirectStatus: 301,
        hstsMaxAge: 86400,
        rolloutPercentage: 50 // Gradual rollout
      },

      // Phase 3: General content
      general: {
        paths: ['/*'],
        redirectStatus: 302, // Temporary during transition
        hstsMaxAge: 3600,
        rolloutPercentage: 25
      }
    };
  }
}
```


The approach demonstrates understanding của business priorities (security-critical paths first), risk mitigation (gradual rollout), và performance optimization (appropriate cache settings for each phase).
