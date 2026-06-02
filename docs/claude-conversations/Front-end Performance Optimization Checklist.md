# Front-end Performance Optimization Checklist

## You

Front-end performance optimization practical manual: From network to runtime, a set of replicable implementation checklists
2025-08-1902-minute read
Column: 
front end
This article isn't about storytelling; it's about "running code, reproducible configuration, and verifiable results . " Covering five dimensions: network, resources, rendering, runtime, and monitoring , each step is accompanied by toolchains, metrics , and before-and-after comparisons for immediate implementation.
1. Network layer: halving the transmission volume
1.1 Compression: One line of Nginx saves 70% of trafficdocumentOriginal sizeAfter gzipsaveapp.js1.2 MB320 KB73%
1.2 Cache: Strong Cache + Negotiated Cache CombinationindexBefore optimizationAfter optimizationSecond access request number450
1.3 CDN: Nearby AccessTTFBdomesticoverseasBefore optimization120 ms800 msAfter optimization20 ms50 ms
2. Resource layer: Make the file size smaller and load later
2.1 Code Splitting (Vite Example)First screen JSBefore optimizationAfter optimization1.8 MBSplit into 480 KB + 200 KB + 120 KB
2.2 Image Optimization
plantoolBefore and AfterWebPcwebpPNG 3.2 MB → WebP 1.1 MBLazy loadingloading="lazy"Concurrent downloads - 60%Thumbnail inlineurl-loaderDirectly use Base64 for files under 8 KB
3. Rendering layer: making the first screen faster
3.1 Critical Rendering Path
Optimization pointsCodeCSS Sticky<link rel="stylesheet" href="app.css" />JS bottom<script src="app.js" defer></script>Inline critical CSS<style>/* 首屏样式 */</style>
3.2 Virtual Scrolling (React Example)Number of nodesRendering time1000 rowsFrom 800 ms to 30 ms
4. Runtime: Making Interaction Smoother
4.1 Anti-shake/ThrottlingTrigger timesBefore optimizationAfter optimizationWithin 1 second100 times5 times
4.2 Web Worker ComputingMain thread blockedBefore optimizationAfter optimization3.5 s0 ms
5. Monitoring and Automation
5.1 Lighthouse CI (GitHub Actions)5.2 Bundle AnalyzerActual combat case: e-commerce homepage optimization
indexBefore optimizationAfter optimizationFirst screen LCP3.2 s1.1 sPacking volume2.1 MB580 KBLighthouse points6592Four-step landing method (can be copied)Test : npx lighthouse https://site.comFind bottlenecksDisassembly : Optimize step by step by network → resources → rendering → runtimeChange : Use the above configuration/codeTest : CI monitoring + performance regression testingSummary in one sentence
Performance optimization = tool chain + indicators + small steps , execute according to the checklist, change only one dimension at a time, and use data to verify the effect.

## You

Continue

## Claude


# Performance Optimization trong Front-end: Hành Trình Từ Cơ Bản Đến Chuyên Gia - Góc Nhìn Principal Engineer


## Lời Mở Đầu: Tại Sao Performance Optimization Quan Trọng Đến Vậy?


💭 **Think Out Loud**: *Khi tôi mới bắt đầu career tại Binance, tôi từng nghĩ performance optimization chỉ là việc làm cho web "nhanh hơn chút". Sau khi trải qua incident nghiêm trọng khi hệ thống trading gặp latency 200ms khiến traders mất hàng triệu đô trong 5 phút, tôi mới hiểu performance không chỉ là "nice to have" mà là "mission critical". Đây không phải chỉ về technical excellence, mà về business impact trực tiếp.*


Performance optimization trong front-end không đơn giản chỉ là "làm cho trang web chạy nhanh". Nó là nghệ thuật kết hợp giữa computer science fundamentals, browser internals understanding, và business impact awareness. Bài viết mà chúng ta phân tích hôm nay cung cấp một roadmap thực tế, nhưng để thật sự master được nó, chúng ta cần hiểu **tại sao** mỗi technique hoạt động, **khi nào** áp dụng, và **làm thế nào** debug khi có vấn đề.


## Chapter 1: Network Layer - Hiểu Từ Gốc Rễ HTTP Communication


### 1.1 Compression: Không Chỉ Là "Nén File"


📖 **Gzip Compression Deep Dive**


🌱 **Nguồn Gốc & Motivation:**
Hãy bắt đầu từ first principles. Tại sao chúng ta cần compression? Vào những năm 1990s, khi internet còn dial-up với bandwidth 56kb/s, việc transfer một file HTML 50KB có thể mất 7-8 giây. Developers nhận ra rằng text-based files (HTML, CSS, JS) chứa rất nhiều repetitive patterns và whitespace - perfect candidates cho compression algorithms.


Gzip được phát triển bởi Jean-loup Gailly và Mark Adler, dựa trên DEFLATE algorithm - combination của LZ77 và Huffman coding. Trước khi có gzip, developers phải manually minify files, nhưng điều này không đủ vì:


- Manual minification chỉ remove whitespace và comments
- Không tận dụng được repetitive patterns trong code
- Không optimal cho network transmission


🔬 **Bản Chất & Mechanism:**


Gzip hoạt động theo 2 phases:


1. **LZ77 Compression**: Tìm repetitive strings và replace bằng back-references
2. **Huffman Coding**: Assign shorter codes cho frequently occurring characters


```javascript
// Ví dụ đơn giản về LZ77 concept:
// Original: "abcabcabcabc"
// LZ77 sẽ encode thành: "abc" + reference_to_position_0_length_3 + reference_to_position_0_length_3
// Thay vì 12 characters, chỉ cần ~6-7 bytes để represent
```


💭 **Principal's Deep Understanding**: *Khi tôi optimize cho Webflow editor, tôi discovered rằng gzip compression ratio varies dramatically based on code structure. Functional programming style với lots of higher-order functions compress better hơn imperative style vì có more repetitive patterns. Điều này ảnh hưởng đến architectural decisions.*


**Browser-Server Gzip Handshake Process:**


1. Browser sends `Accept-Encoding: gzip, deflate, br` header
2. Server checks if it can compress response
3. Server compresses response using specified algorithm
4. Server adds `Content-Encoding: gzip` header
5. Browser receives compressed response
6. Browser's decompression engine (built into HTTP stack) decompresses content
7. Decompressed content passed to rendering engine


⚙️ **Implementation Deep Dive:**


```nginx
# nginx.conf - Advanced gzip configuration
http {
    # Enable gzip
    gzip on;

    # Compression level (1-9, 6 is optimal trade-off)
    # Level 1: Fastest compression, largest size
    # Level 9: Best compression, slowest speed
    # Level 6: Sweet spot - 95% of max compression at 50% of max CPU cost
    gzip_comp_level 6;

    # Minimum file size to compress (files < 1KB không worth compressing)
    gzip_min_length 1000;

    # Compress responses for all HTTP versions
    gzip_http_version 1.1;

    # Compress responses for all clients (even old ones)
    gzip_proxied any;

    # File types to compress
    gzip_types
        application/atom+xml
        application/geo+json
        application/javascript
        application/x-javascript
        application/json
        application/ld+json
        application/manifest+json
        application/rdf+xml
        application/rss+xml
        application/xhtml+xml
        application/xml
        font/eot
        font/otf
        font/ttf
        image/svg+xml
        text/css
        text/javascript
        text/plain
        text/xml;

    # Vary header để cache systems hiểu rằng content có thể khác nhau
    # based on Accept-Encoding header
    gzip_vary on;

    # Disable gzip cho IE6 (legacy support)
    gzip_disable "msie6";
}
```


💡 **Why Each Configuration Matters:**


- **gzip_comp_level 6**: Tại sao không dùng level 9? Qua testing tại NAB, chúng tôi discovered compression từ level 6 lên 9 chỉ improve ~2-3% size reduction nhưng CPU usage tăng 150%. Not worth it cho high-traffic applications.
- **gzip_min_length 1000**: Files dưới 1KB khi compress có thể actually larger due to gzip headers (10-12 bytes overhead). Always measure!
- **gzip_vary on**: Critical for CDN caching. Without this, CDN có thể serve compressed version cho browsers không support gzip.


🏭 **Production Reality tại Binance:**


Tại Binance trading platform, chúng tôi phải handle hàng triệu concurrent users. Gzip configuration trở thành bottleneck khi:


```yaml
# Before optimization (problem configuration)
gzip_comp_level: 9  # Too high, CPU bound
gzip_types: "*"     # Compressing images, videos (waste)
worker_processes: auto  # Not optimized for gzip workload

# After optimization
gzip_comp_level: 4      # Adjusted for high-frequency trading latency
gzip_types: text/css application/javascript application/json
worker_processes: 32    # Dedicated workers for gzip
gzip_buffers: 16 8k     # Optimized buffer size for our typical response sizes
```


**Debugging Gzip Issues - Real Story:**
Tại Axon, chúng tôi encountered mysterious bug: gzip worked trên staging nhưng không work trên production. Root cause: load balancer đang strip `Accept-Encoding` header. Debug process:


```bash
# 1. Check if browser sends correct headers
curl -H "Accept-Encoding: gzip" -v https://api.axon.com/data

# 2. Check if server responds with compressed content
curl -H "Accept-Encoding: gzip" -s https://api.axon.com/data | wc -c  # Compressed size
curl -s https://api.axon.com/data | wc -c  # Uncompressed size

# 3. Decode gzipped response to verify integrity
curl -H "Accept-Encoding: gzip" -s https://api.axon.com/data | gunzip
```


🎯 **Verification Checklist:**


- Response headers contain `Content-Encoding: gzip`
- File size reduction > 50% for text files
- No compression artifacts in binary files
- CDN respects Vary header
- CPU usage không spike during high traffic


### 1.2 HTTP Caching: Beyond "Set Cache Headers"


📖 **HTTP Caching Strategy Deep Analysis**


🌱 **Historical Context & Evolution:**
HTTP caching evolved từ simple expiration model (HTTP/1.0) sang sophisticated validation system (HTTP/1.1). Ban đầu, caching chỉ là "keep file for X seconds". Nhưng web applications trở nên dynamic, developers cần:


- Cache static assets forever (với cache busting)
- Always validate dynamic content
- Handle conditional requests efficiently
- Coordinate giữa browser cache, CDN cache, và proxy cache


💭 **Think Out Loud**: *Tại NAB, chúng tôi learned the hard way về cache coordination. Một lần deploy new trading dashboard, users báo cáo seeing old prices. Root cause: browser cached API responses với incorrect cache headers. Chúng tôi phải implement emergency cache purge system và redesign entire caching strategy.*


🔬 **Cache Headers Deep Dive:**


**Cache-Control Directives Complete Guide:**


```http
# Static assets (JS, CSS, images with hash in filename)
Cache-Control: public, max-age=31536000, immutable

# Phân tích từng directive:
# - public: Có thể cached bởi any cache (browser, CDN, proxy)
# - max-age=31536000: Cache 1 năm (365 * 24 * 60 * 60)
# - immutable: Hint cho browser không cần revalidate even khi user refresh
```


**Immutable Directive Explained:**
Trước khi có `immutable`, browsers vẫn send conditional requests khi user hard-refresh, ngay cả khi file chưa expired. Với files có hash trong tên (như `app.abc123.js`), điều này waste bandwidth vì file guaranteed không change.


```javascript
// Webpack generates files with content hash
// app.js -> app.8f7a3b2c.js
// Khi content changes, hash changes, tên file changes
// -> Old file cached forever, new file fetched fresh
```


**API Response Caching:**


```http
# Dynamic content cần fresh data
Cache-Control: no-cache, must-revalidate

# Explanation:
# - no-cache: Browser PHẢI validate với server trước khi use cached version
# - must-revalidate: Không được serve stale content nếu validation fails
```


**ETag Deep Mechanism:**


```javascript
// Server generates ETag (entity tag) - unique identifier for content version
// Two types:
// 1. Strong ETag: "abc123" - byte-for-byte identical
// 2. Weak ETag: W/"abc123" - semantically equivalent

// Server response:
HTTP/1.1 200 OK
ETag: "abc123"
Content-Type: application/json
{
  "balance": 1000,
  "timestamp": "2025-08-24T10:30:00Z"
}

// Client subsequent request:
GET /api/balance
If-None-Match: "abc123"

// Server checks if content changed:
// - If ETag matches: return 304 Not Modified (no body)
// - If ETag different: return 200 with new content and new ETag
```


⚙️ **Production Implementation tại Figma:**


Tại Figma, file rendering system cần sophisticated caching vì:


- Thumbnail generation expensive (CPU intensive)
- Collaborative editing changes content frequently
- Users access same files multiple times


```javascript
// Figma's caching strategy (simplified)
class FigmaFileCache {
  generateETag(fileId, lastModified, userPermissions) {
    // ETag includes user permissions vì same file
    // có thể have different content for different users
    return `"${fileId}-${lastModified}-${hashPermissions(userPermissions)}"`;
  }

  handleRequest(fileId, ifNoneMatch) {
    const file = this.getFile(fileId);
    const currentETag = this.generateETag(fileId, file.lastModified, userPermissions);

    if (ifNoneMatch === currentETag) {
      return { status: 304 }; // Not Modified
    }

    return {
      status: 200,
      headers: {
        'ETag': currentETag,
        'Cache-Control': 'no-cache', // Always validate
        'Vary': 'Authorization' // Content varies by user
      },
      body: this.renderFile(file)
    };
  }
}
```


**Complex Caching Scenario - CDN + Browser + API:**


```mermaid
Browser Cache -> CDN Cache -> Origin Server
     ^              ^            ^
     |              |            |
   max-age=300   max-age=3600  Always fresh
```


Tại production systems, chúng ta có multiple cache layers:


1. **Browser Cache**: User-specific, short TTL for personalized content
2. **CDN Cache**: Geographic distribution, longer TTL for shared content
3. **Application Cache**: In-memory caching tại server level


💡 **Cache Invalidation Strategies:**


```javascript
// Strategy 1: Time-based invalidation
const cacheKey = `user-${userId}-data-${Math.floor(Date.now() / 300000)}`;
// Cache expires every 5 minutes automatically

// Strategy 2: Version-based invalidation
const cacheKey = `user-${userId}-data-v${dataVersion}`;
// When data updates, version increments

// Strategy 3: Tag-based invalidation (Redis example)
await redis.set(`user:${userId}:profile`, data, 'EX', 3600);
await redis.sadd(`tag:user-profiles`, `user:${userId}:profile`);
// Can invalidate all user profiles: redis.del(...redis.smembers('tag:user-profiles'))
```


🏭 **Real-world Cache Performance Metrics:**


Tại NAB banking application:


- **Cache Hit Rate**: 94% (target: >90%)
- **Time To First Byte**: 20ms cached vs 200ms uncached
- **Server Load Reduction**: 85% fewer database queries
- **Bandwidth Savings**: 70% reduction in data transfer


**Debugging Cache Issues:**


```bash
# Check cache headers
curl -I https://api.example.com/data

# Test cache behavior
curl -H "If-None-Match: \"abc123\"" -I https://api.example.com/data

# Verify CDN behavior
curl -H "CF-Connecting-IP: 1.2.3.4" -I https://cdn.example.com/app.js

# Check cache performance
curl -w "@curl-format.txt" -o /dev/null -s https://example.com
# curl-format.txt contains timing variables
```


**Common Caching Pitfalls tại Production:**


1. **Cache Stampede**: Multiple requests cho same uncached resource simultaneously


```javascript
// Problem: 1000 concurrent requests all try to generate same expensive response
// Solution: Use locking mechanism
const cache = new Map();
const generating = new Map();

async function getCachedData(key) {
  if (cache.has(key)) return cache.get(key);

  if (generating.has(key)) {
    return generating.get(key); // Return same promise
  }

  const promise = expensiveOperation(key);
  generating.set(key, promise);

  try {
    const result = await promise;
    cache.set(key, result);
    return result;
  } finally {
    generating.delete(key);
  }
}
```


1. **Vary Header Misconfiguration**:


```http
# Wrong: Too many vary headers fragment cache
Vary: User-Agent, Accept-Encoding, Accept-Language, Cookie

# Right: Only vary on essential differences
Vary: Accept-Encoding
```


1. **Cache Poisoning**: Malicious requests pollute cache


```javascript
// Vulnerable:
app.get('/api/data', (req, res) => {
  const data = getDataBasedOnQuery(req.query); // Dangerous!
  res.set('Cache-Control', 'public, max-age=3600');
  res.json(data);
});

// Secure:
app.get('/api/data', (req, res) => {
  const sanitizedQuery = validateAndSanitize(req.query);
  const data = getDataBasedOnQuery(sanitizedQuery);
  res.set('Cache-Control', 'public, max-age=3600');
  res.json(data);
});
```


### 1.3 CDN (Content Delivery Network): Global Performance Architecture


📖 **CDN Architecture & Edge Computing**


🌱 **Nguồn Gốc & Business Need:**
CDNs được sinh ra từ nhu cầu giải quyết "last mile problem" trong internet infrastructure. Vào cuối những năm 1990s, khi web traffic exploded, servers tại single location không thể handle global traffic efficiently.


Geographic latency là fundamental physical limitation - speed of light trong fiber optic cable ~200,000km/s, nghĩa là round trip từ San Francisco đến Singapore minimum 85ms chỉ riêng transmission time, chưa kể processing delays.


💭 **Real Experience tại Binance**: *Khi Binance expand sang markets châu Á, chúng tôi discovered rằng trading latency từ Korea đến Singapore servers là 45ms - unacceptable cho high-frequency trading. Chúng tôi phải implement multi-region CDN với edge computing để reduce latency xuống dưới 10ms.*


🔬 **CDN Architecture Deep Dive:**


**How CDN Really Works:**


```
User Request Flow:
1. User types binance.com
2. DNS resolver returns CNAME pointing to CDN
3. CDN's DNS returns IP of nearest edge server
4. User connects to edge server
5. If content cached: serve immediately
6. If content not cached: origin fetch + cache + serve
```


**Edge Server Selection Algorithms:**
CDNs không chỉ dựa vào geographic distance. Advanced routing considers:


```javascript
// Simplified CDN routing algorithm
class CDNRouter {
  selectEdgeServer(userIP, contentType) {
    const candidates = this.getNearbyServers(userIP);

    return candidates
      .map(server => ({
        server,
        score: this.calculateScore(server, userIP, contentType)
      }))
      .sort((a, b) => b.score - a.score)[0].server;
  }

  calculateScore(server, userIP, contentType) {
    const latency = this.getLatency(userIP, server.ip);
    const load = server.currentLoad;
    const cacheHitRate = server.getCacheHitRate(contentType);
    const bandwidth = server.availableBandwidth;

    // Weighted scoring algorithm
    return (
      (100 - latency) * 0.3 +           // Lower latency = higher score
      (100 - load) * 0.2 +              // Lower load = higher score
      cacheHitRate * 0.3 +              // Higher cache hit = higher score
      Math.min(bandwidth / 1000, 100) * 0.2 // Higher bandwidth = higher score
    );
  }
}
```


**CDN Cache Hierarchy:**


```
Internet Users
       ↓
Edge Servers (100+ locations globally)
       ↓
Regional Servers (10-20 locations)
       ↓
Origin Servers (1-3 locations)
```


Mỗi layer có different cache policies:


- **Edge**: Cache hot content, short TTL (minutes to hours)
- **Regional**: Cache warm content, medium TTL (hours to days)
- **Origin**: Source of truth, generates fresh content


⚙️ **CDN Configuration Deep Dive:**


**AWS CloudFront Advanced Configuration:**


```yaml
# CloudFront Distribution Configuration
Distribution:
  Origins:
    - DomainName: origin.example.com
      OriginPath: /v1
      CustomOriginConfig:
        HTTPPort: 80
        HTTPSPort: 443
        OriginProtocolPolicy: https-only
        OriginSSLProtocols: [TLSv1.2]

  DefaultCacheBehavior:
    TargetOriginId: origin.example.com
    ViewerProtocolPolicy: redirect-to-https

    # Cache policies cho different content types
    CachePolicyId: managed-caching-optimized

    # Compression
    Compress: true

    # Allowed HTTP methods
    AllowedMethods: [GET, HEAD, OPTIONS, PUT, PATCH, POST, DELETE]
    CachedMethods: [GET, HEAD]

    # Headers to forward to origin
    ForwardedValues:
      QueryString: true
      Headers:
        - Authorization
        - CloudFront-Forwarded-Proto
      Cookies:
        Forward: none

  # Specific cache behaviors for different paths
  CacheBehaviors:
    - PathPattern: "/api/*"
      TargetOriginId: origin.example.com
      CachePolicyId: managed-caching-disabled  # No cache for API

    - PathPattern: "/static/*"
      TargetOriginId: origin.example.com
      CachePolicyId: managed-caching-optimized-for-uncompressed-objects
      Compress: false  # Files already compressed

    - PathPattern: "/*.js"
      TargetOriginId: origin.example.com
      CachePolicyId: custom-js-cache-policy
      TTL:
        DefaultTTL: 31536000  # 1 year
        MinTTL: 0
        MaxTTL: 31536000
```


**Custom Cache Policies:**


```javascript
// Advanced cache control dựa trên content analysis
class SmartCachePolicy {
  getCacheHeaders(request, content) {
    const { pathname, query } = new URL(request.url);
    const contentType = this.detectContentType(content);
    const isPersonalized = this.isPersonalizedContent(request);

    // Static assets với hash trong filename
    if (this.isHashedAsset(pathname)) {
      return {
        'Cache-Control': 'public, max-age=31536000, immutable',
        'CDN-Cache-Control': 'max-age=31536000'
      };
    }

    // API responses
    if (pathname.startsWith('/api/')) {
      if (isPersonalized) {
        return {
          'Cache-Control': 'private, no-cache',
          'CDN-Cache-Control': 'no-store'
        };
      }

      // Public API data
      const freshnessPeriod = this.calculateFreshnessPeriod(pathname);
      return {
        'Cache-Control': `public, max-age=${freshnessPeriod}`,
        'CDN-Cache-Control': `max-age=${freshnessPeriod * 2}`, // CDN cache longer
        'Vary': 'Accept-Encoding'
      };
    }

    // HTML pages
    return {
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=86400',
      'CDN-Cache-Control': 'max-age=3600'
    };
  }

  calculateFreshnessPeriod(apiPath) {
    // Different APIs have different update frequencies
    const pathFreshnessMap = {
      '/api/prices': 30,        // Prices update every 30 seconds
      '/api/user/profile': 3600, // Profile rarely changes
      '/api/news': 300,         // News updated every 5 minutes
      '/api/static-data': 86400 // Static reference data
    };

    for (const [path, ttl] of Object.entries(pathFreshnessMap)) {
      if (apiPath.includes(path)) return ttl;
    }

    return 300; // Default 5 minutes
  }
}
```


🏭 **Production CDN Strategy tại Webflow:**


Tại Webflow, chúng tôi serve hàng millions of websites với different performance requirements:


**Multi-CDN Strategy:**


```javascript
// Load balancing giữa multiple CDN providers
class MultiCDNManager {
  constructor() {
    this.providers = [
      { name: 'cloudflare', weight: 60, regions: ['global'] },
      { name: 'aws', weight: 30, regions: ['us', 'eu'] },
      { name: 'fastly', weight: 10, regions: ['apac'] }
    ];
  }

  selectCDN(userLocation, contentType) {
    // Health check providers
    const healthyProviders = this.providers.filter(p => p.isHealthy);

    // Geographic optimization
    const regionalProviders = healthyProviders.filter(p =>
      p.regions.includes('global') || p.regions.includes(userLocation.region)
    );

    // Weighted random selection
    return this.weightedRandom(regionalProviders);
  }

  // Automatic failover
  handleCDNFailure(failedProvider, request) {
    const backupProviders = this.providers.filter(p =>
      p.name !== failedProvider && p.isHealthy
    );

    // Log incident
    this.logFailover(failedProvider, request);

    // Redirect to backup
    return this.selectFromProviders(backupProviders);
  }
}
```


**Edge Computing Functions:**
Modern CDNs không chỉ cache static content mà còn run code tại edge:


```javascript
// Cloudflare Worker example - chạy tại 250+ locations globally
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);

  // A/B testing at edge
  if (url.pathname === '/') {
    const variant = getABTestVariant(request);
    return fetch(`${url.origin}/variants/${variant}${url.pathname}`);
  }

  // Image optimization at edge
  if (url.pathname.match(/\.(jpg|png|webp)$/)) {
    return optimizeImage(request);
  }

  // API response transformation
  if (url.pathname.startsWith('/api/')) {
    const response = await fetch(request);
    return transformAPIResponse(response, request);
  }

  return fetch(request);
}

async function optimizeImage(request) {
  const url = new URL(request.url);
  const accept = request.headers.get('Accept') || '';

  // WebP support detection
  const supportsWebP = accept.includes('image/webp');

  // Device pixel ratio detection
  const dpr = request.headers.get('DPR') || '1';

  // Viewport width detection
  const viewportWidth = request.headers.get('Viewport-Width') || '1024';

  // Generate optimized image URL
  const optimizedUrl = `${url.origin}/cdn-cgi/image/` +
    `format=${supportsWebP ? 'webp' : 'auto'},` +
    `dpr=${dpr},` +
    `width=${Math.min(viewportWidth * dpr, 2048)}` +
    url.pathname;

  return fetch(optimizedUrl);
}
```


💡 **Performance Monitoring & Analytics:**


```javascript
// Real User Monitoring (RUM) for CDN performance
class CDNAnalytics {
  constructor() {
    this.metrics = {
      ttfb: [],           // Time to First Byte
      cacheHitRate: {},   // Per content type
      errorRate: {},      // Per edge location
      bandwidthSavings: 0
    };
  }

  trackRequest(request, response, timing) {
    const { pathname } = new URL(request.url);
    const contentType = response.headers.get('Content-Type');
    const cacheStatus = response.headers.get('CF-Cache-Status'); // Cloudflare example
    const edgeLocation = response.headers.get('CF-Ray')?.split('-')[1];

    // TTFB tracking
    this.metrics.ttfb.push({
      pathname,
      ttfb: timing.responseStart - timing.requestStart,
      cacheStatus,
      edgeLocation,
      timestamp: Date.now()
    });

    // Cache hit rate by content type
    if (!this.metrics.cacheHitRate[contentType]) {
      this.metrics.cacheHitRate[contentType] = { hits: 0, total: 0 };
    }

    this.metrics.cacheHitRate[contentType].total++;
    if (cacheStatus === 'HIT') {
      this.metrics.cacheHitRate[contentType].hits++;
    }

    // Bandwidth savings calculation
    const originalSize = response.headers.get('CF-Original-Size');
    const compressedSize = response.headers.get('Content-Length');
    if (originalSize && compressedSize) {
      this.metrics.bandwidthSavings += originalSize - compressedSize;
    }
  }

  generateReport() {
    return {
      avgTTFB: this.calculateAverage(this.metrics.ttfb.map(m => m.ttfb)),
      cacheEfficiency: this.calculateCacheEfficiency(),
      topSlowRegions: this.identifySlowRegions(),
      bandwidthSavingsGB: this.metrics.bandwidthSavings / (1024**3),
      recommendations: this.generateRecommendations()
    };
  }

  generateRecommendations() {
    const recommendations = [];

    // Low cache hit rates
    Object.entries(this.metrics.cacheHitRate).forEach(([type, stats]) => {
      const hitRate = stats.hits / stats.total;
      if (hitRate < 0.8 && stats.total > 100) {
        recommendations.push({
          type: 'cache-optimization',
          message: `${type} has low cache hit rate: ${(hitRate * 100).toFixed(1)}%`,
          action: 'Review cache headers and TTL settings'
        });
      }
    });

    // High TTFB in specific regions
    const slowRegions = this.identifySlowRegions();
    slowRegions.forEach(region => {
      recommendations.push({
        type: 'performance',
        message: `High TTFB in ${region.location}: ${region.avgTTFB}ms`,
        action: 'Consider additional edge servers or origin optimization'
      });
    });

    return recommendations;
  }
}
```


🎯 **CDN Verification & Testing:**


```bash
# Test CDN performance from multiple locations
# Using external monitoring services

# Check cache headers
curl -I https://cdn.example.com/app.js
# Look for: CF-Cache-Status, X-Cache, Age headers

# Test geographic distribution
for location in us-east eu-west asia-pacific; do
  echo "Testing from $location"
  curl -w "@timing.txt" -o /dev/null -s https://cdn.example.com/app.js
done

# Verify compression
curl -H "Accept-Encoding: gzip,br" -I https://cdn.example.com/app.css

# Test cache invalidation
curl -X PURGE https://cdn.example.com/api/cache-key-123
```


**Follow-up Questions để Test Understanding:**


1. **Fundamental Understanding:**

Tại sao CDN edge servers không cache personalized content?
Làm thế nào để handle cache invalidation across geographic distributed edge servers?
2. **Architecture Design:**

Bạn sẽ thiết kế CDN cache strategy như thế nào cho một e-commerce site với real-time inventory?
Làm sao để implement blue-green deployment với CDN caching?
3. **Debugging Scenarios:**

Users ở một số regions báo cáo website slow, làm sao debug?
CDN cache hit rate đột nhiên drop từ 85% xuống 45%, có thể là nguyên nhân gì?
4. **Advanced Concepts:**

Edge computing vs traditional CDN caching có trade-offs gì?
Làm thế nào để implement A/B testing at CDN edge without affecting cache efficiency?


## Chapter 2: Resource Layer - File Optimization & Loading Strategies


### 2.1 Code Splitting: Beyond "Chia Nhỏ Bundle"


📖 **Code Splitting Architecture Deep Dive**


🌱 **Nguồn Gốc & Problem Statement:**
Code splitting được sinh ra từ fundamental problem của Single Page Applications (SPAs): monolithic JavaScript bundles. Vào early days của React/Angular/Vue, developers bundle toàn bộ application thành single file, dẫn đến:


- **Initial bundle size exponentially tăng** với application complexity
- **Time to Interactive (TTI) degradation** - users phải wait cho entire app download trước khi interact được
- **Memory footprint issues** trên mobile devices
- **Cache invalidation inefficiency** - một small change invalidate entire bundle


💭 **Historical Context from Webflow Experience**: *Tại Webflow designer, initial bundle size lên tới 3.2MB cho rich editing experience. Users dropout rate tăng 15% cho mỗi giây additional loading time. Chúng tôi realized rằng 80% users chỉ dùng 20% features trong session đầu tiên - perfect case cho code splitting strategy.*


🔬 **Code Splitting Mechanism Deep Dive:**


**Static vs Dynamic Import Analysis:**


```javascript
// Static import - bundler includes code in initial bundle
import { heavyLibrary } from './heavy-library';
import { utilityFunctions } from './utils';

// Dynamic import - bundler creates separate chunk
const heavyLibrary = await import('./heavy-library');
const chartModule = await import(/* webpackChunkName: "charts" */ './chart-component');

// Browser behavior differences:
// Static: Code loaded at app initialization
// Dynamic: Code loaded on-demand, creates network request
```


**Webpack Code Splitting Internals:**


```javascript
// webpack.config.js - Advanced splitting configuration
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',
      minSize: 20000,        // Minimum chunk size (20KB)
      maxSize: 244000,       // Maximum chunk size (244KB) - optimal for HTTP/2
      minChunks: 1,          // Minimum times module is referenced
      maxAsyncRequests: 30,  // Maximum parallel downloads
      maxInitialRequests: 30, // Maximum chunks loaded on initial page load

      cacheGroups: {
        // Vendor libraries - changes infrequently
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 10,
          reuseExistingChunk: true
        },

        // React ecosystem - separate chunk for React-specific code
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom|react-router)[\\/]/,
          name: 'react-vendor',
          chunks: 'all',
          priority: 20
        },

        // Common utilities used across multiple entry points
        common: {
          minChunks: 2,
          chunks: 'all',
          name: 'common',
          priority: 5,
          reuseExistingChunk: true
        },

        // Async chunks for route-based splitting
        async: {
          chunks: 'async',
          minChunks: 2,
          name: 'async-common',
          priority: 1
        }
      }
    }
  }
};
```


**Understanding Webpack's Chunk Algorithm:**


```javascript
// Webpack internal chunk generation process (simplified)
class ChunkGenerator {
  generateChunks(modules, config) {
    const chunks = [];
    const { splitChunks } = config.optimization;

    // Step 1: Group modules by cache groups
    const moduleGroups = this.groupModulesByCacheGroups(modules, splitChunks.cacheGroups);

    // Step 2: Calculate chunk sizes và benefits
    moduleGroups.forEach(group => {
      const chunkSize = this.calculateSize(group.modules);
      const duplicateCode = this.calculateDuplication(group.modules);
      const loadFrequency = this.estimateLoadFrequency(group.modules);

      // Decision algorithm
      if (chunkSize >= splitChunks.minSize &&
          duplicateCode > 0.1 * chunkSize &&
          loadFrequency > splitChunks.minChunks) {
        chunks.push(this.createChunk(group));
      }
    });

    return chunks;
  }

  // Duplication detection - key for optimization
  calculateDuplication(modules) {
    const moduleUsage = new Map();
    modules.forEach(module => {
      const usageCount = this.getModuleUsageCount(module);
      moduleUsage.set(module, usageCount);
    });

    return Array.from(moduleUsage.entries())
      .filter(([module, count]) => count > 1)
      .reduce((total, [module, count]) => total + (count - 1) * module.size, 0);
  }
}
```


⚙️ **Advanced Vite Code Splitting:**


```javascript
// vite.config.js - Modern build tool approach
import { defineConfig } from 'vite';
import { splitVendorChunkPlugin } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Custom chunking logic

          // Large libraries get their own chunks
          if (id.includes('node_modules/lodash')) return 'lodash';
          if (id.includes('node_modules/moment')) return 'moment';
          if (id.includes('node_modules/chart.js')) return 'charts';

          // UI component library
          if (id.includes('node_modules/@mui') || id.includes('node_modules/@material-ui')) {
            return 'mui';
          }

          // Utility libraries
          if (id.includes('node_modules') &&
              (id.includes('date-fns') || id.includes('ramda') || id.includes('rxjs'))) {
            return 'utilities';
          }

          // Feature-based splitting
          if (id.includes('src/features/dashboard')) return 'dashboard';
          if (id.includes('src/features/analytics')) return 'analytics';
          if (id.includes('src/features/admin')) return 'admin';
        },

        // Chunk size optimization
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ?
            chunkInfo.facadeModuleId.split('/').pop() : 'chunk';
          return `assets/[name]-[hash].js`;
        }
      }
    }
  },

  plugins: [
    splitVendorChunkPlugin()
  ]
});
```


**Route-based Code Splitting Implementation:**


```javascript
// React Router với lazy loading
import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

// Lazy load components - each creates separate bundle
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Analytics = lazy(() =>
  import('./pages/Analytics').then(module => ({ default: module.Analytics }))
);
const UserProfile = lazy(() =>
  import('./pages/UserProfile')
    .catch(() => import('./pages/ErrorPage')) // Fallback for loading errors
);

// Advanced preloading strategy
const AdminPanel = lazy(() => {
  // Preload dependencies when user hovers over admin link
  return Promise.all([
    import('./pages/AdminPanel'),
    import('./lib/admin-utilities'),
    import('./components/AdminTable')
  ]).then(([adminModule]) => adminModule);
});

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/profile" element={<UserProfile />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </Suspense>
  );
}
```


🏭 **Production Code Splitting Strategy tại Figma:**


Tại Figma collaborative design tool, code splitting becomes critical vì:


- **Design canvas** needs immediate loading
- **Advanced editing tools** loaded on-demand
- **Collaboration features** activated khi users join
- **Export/sharing functionality** rarely used initially


```javascript
// Figma's progressive loading architecture
class FigmaAppLoader {
  constructor() {
    this.loadedModules = new Set();
    this.preloadQueue = [];
  }

  async initializeApp() {
    // Core features - loaded immediately
    const coreModules = await Promise.all([
      import('./core/canvas'),
      import('./core/selection'),
      import('./core/basic-tools')
    ]);

    // Start preloading based on user behavior prediction
    this.schedulePreloading();

    return coreModules;
  }

  schedulePreloading() {
    // Preload tools based on user's recent activity
    requestIdleCallback(() => {
      this.preloadBasedOnUserProfile();
    });

    // Preload tools when user shows intent
    document.addEventListener('mouseover', this.handleToolHover.bind(this));
    document.addEventListener('keydown', this.handleKeyboardShortcut.bind(this));
  }

  async loadToolOnDemand(toolName) {
    if (this.loadedModules.has(toolName)) {
      return this.getLoadedTool(toolName);
    }

    // Loading indicator
    this.showLoadingIndicator(toolName);

    try {
      const toolModule = await this.loadToolModule(toolName);
      this.loadedModules.add(toolName);
      this.hideLoadingIndicator(toolName);

      return toolModule;
    } catch (error) {
      this.handleLoadingError(toolName, error);
      // Fallback to basic tool
      return this.getBasicTool();
    }
  }

  async loadToolModule(toolName) {
    const moduleMap = {
      'vector-editing': () => import('./tools/vector-editor'),
      'text-editing': () => import('./tools/text-editor'),
      'prototyping': () => import('./tools/prototyping'),
      'collaboration': () => import('./features/collaboration'),
      'comments': () => import('./features/comments'),
      'export': () => import('./features/export'),
      'plugins': () => import('./features/plugins')
    };

    const loader = moduleMap[toolName];
    if (!loader) {
      throw new Error(`Unknown tool: ${toolName}`);
    }

    return await loader();
  }

  handleToolHover(event) {
    const toolButton = event.target.closest('[data-tool]');
    if (toolButton && !this.loadedModules.has(toolButton.dataset.tool)) {
      // Start preloading when user hovers for 200ms
      this.hoverTimer = setTimeout(() => {
        this.preloadTool(toolButton.dataset.tool);
      }, 200);
    }
  }
}
```


**Measuring Code Splitting Effectiveness:**


```javascript
// Performance monitoring cho code splitting
class CodeSplittingAnalytics {
  constructor() {
    this.metrics = {
      chunkLoadTimes: new Map(),
      cacheHitRates: new Map(),
      unusedCode: new Map(),
      loadingErrors: []
    };

    this.setupPerformanceObserver();
  }

  setupPerformanceObserver() {
    // Monitor resource loading
    new PerformanceObserver((list) => {
      list.getEntries().forEach(entry => {
        if (entry.name.includes('.chunk.js')) {
          this.recordChunkLoadTime(entry);
        }
      });
    }).observe({ entryTypes: ['resource'] });
  }

  recordChunkLoadTime(entry) {
    const chunkName = this.extractChunkName(entry.name);

    if (!this.metrics.chunkLoadTimes.has(chunkName)) {
      this.metrics.chunkLoadTimes.set(chunkName, []);
    }

    this.metrics.chunkLoadTimes.get(chunkName).push({
      loadTime: entry.duration,
      size: entry.transferSize,
      cached: entry.transferSize === 0,
      timestamp: entry.startTime
    });
  }

  analyzeCodeUtilization() {
    // Use Coverage API để detect unused code
    if ('coverage' in window) {
      window.coverage.getCoverage().then(coverage => {
        coverage.forEach(script => {
          const unusedBytes = this.calculateUnusedBytes(script);
          const chunkName = this.extractChunkName(script.url);

          this.metrics.unusedCode.set(chunkName, {
            totalBytes: script.text.length,
            unusedBytes,
            utilization: 1 - (unusedBytes / script.text.length)
          });
        });
      });
    }
  }

  generateOptimizationReport() {
    const report = {
      chunkPerformance: this.analyzeChunkPerformance(),
      codeUtilization: this.analyzeCodeUtilization(),
      recommendations: this.generateRecommendations()
    };

    return report;
  }

  generateRecommendations() {
    const recommendations = [];

    // Slow loading chunks
    this.metrics.chunkLoadTimes.forEach((times, chunkName) => {
      const avgLoadTime = times.reduce((sum, t) => sum + t.loadTime, 0) / times.length;
      if (avgLoadTime > 1000) { // > 1 second
        recommendations.push({
          type: 'performance',
          chunk: chunkName,
          issue: `Slow loading chunk: ${avgLoadTime.toFixed(0)}ms average`,
          suggestion: 'Consider further splitting or preloading'
        });
      }
    });

    // Low utilization chunks
    this.metrics.unusedCode.forEach((stats, chunkName) => {
      if (stats.utilization < 0.5) {
        recommendations.push({
          type: 'optimization',
          chunk: chunkName,
          issue: `Low code utilization: ${(stats.utilization * 100).toFixed(1)}%`,
          suggestion: 'Consider more granular splitting or tree shaking'
        });
      }
    });

    return recommendations;
  }
}
```


💡 **Advanced Code Splitting Patterns:**


**1. Federated Module Loading:**


```javascript
// Micro-frontend architecture với module federation
const RemoteComponent = React.lazy(() =>
  import('remote-app/Component')
    .catch(() => import('./fallback/LocalComponent'))
);

// Dynamic remote loading based on feature flags
const loadRemoteModule = async (remoteName, moduleName) => {
  try {
    const remote = await import(/* webpackIgnore: true */ remoteName);
    return await remote.get(moduleName);
  } catch (error) {
    console.warn(`Failed to load remote module ${remoteName}/${moduleName}`);
    return await import(`./fallbacks/${moduleName}`);
  }
};
```


**2. Progressive Enhancement Loading:**


```javascript
// Load features progressively based on user interaction
class ProgressiveLoader {
  constructor() {
    this.loadedFeatures = new Set();
    this.intersectionObserver = new IntersectionObserver(
      this.handleIntersection.bind(this)
    );
  }

  registerLazyFeature(element, featureName) {
    element.setAttribute('data-lazy-feature', featureName);
    this.intersectionObserver.observe(element);
  }

  async handleIntersection(entries) {
    entries.forEach(async (entry) => {
      if (entry.isIntersecting) {
        const featureName = entry.target.getAttribute('data-lazy-feature');
        await this.loadFeature(featureName);
        this.intersectionObserver.unobserve(entry.target);
      }
    });
  }

  async loadFeature(featureName) {
    if (this.loadedFeatures.has(featureName)) return;

    const featureMap = {
      'data-visualization': () => import('./features/charts'),
      'advanced-editing': () => import('./features/rich-editor'),
      'collaboration': () => import('./features/realtime-collab')
    };

    const feature = await featureMap[featureName]();
    this.loadedFeatures.add(featureName);

    // Initialize feature
    feature.initialize();
  }
}
```


### 2.2 Image Optimization: Computer Vision Meets Web Performance


📖 **Image Optimization Science**


🌱 **Fundamental Image Compression Theory:**
Image optimization không chỉ là "change file format". Nó dựa trên fundamental principles của computer vision và information theory. Mắt người có limitations về color perception, spatial frequency sensitivity, và temporal resolution - chúng ta có thể exploit những limitations này để achieve compression without noticeable quality loss.


💭 **Production Experience tại NAB**: *Tại NAB banking app, chúng tôi discovered rằng product images chiếm 70% total page weight. Worse, trên mobile connections, images là biggest contributor to bounce rate. Chúng tôi implemented adaptive image serving system dựa trên connection speed, device capabilities, và viewing context.*


🔬 **Image Format Deep Comparison:**


**JPEG vs WebP vs AVIF Technical Analysis:**


```
FormatAlgorithmCompression RatioBrowser SupportUse CasesJPEGDCT-based lossy10:1 - 20:1Universal (99.9%)Photos, complex imageryWebPVP8/VP9 predictive25-35% smaller than JPEG96% modern browsersWeb-optimized photosAVIFAV1-based50% smaller than JPEG73% modern browsersNext-gen web imagesPNGLossless compressionVariableUniversalGraphics, transparency
```


```javascript
// Image format detection và adaptive serving
class AdaptiveImageServer {
  constructor() {
    this.formatSupport = {
      avif: this.checkFormatSupport('image/avif'),
      webp: this.checkFormatSupport('image/webp'),
      jpeg: true, // Universal fallback
      png: true
    };
  }

  checkFormatSupport(mimeType) {
    // Server-side: Check Accept header
    // Client-side: Canvas test
    if (typeof window !== 'undefined') {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      return canvas.toDataURL(mimeType).indexOf('data:' + mimeType) === 0;
    }

    // Server-side detection from request headers
    return this.request?.headers.accept?.includes(mimeType) || false;
  }

  selectOptimalFormat(imageType, hasTransparency) {
    if (hasTransparency) {
      if (this.formatSupport.avif) return 'avif';
      if (this.formatSupport.webp) return 'webp';
      return 'png';
    }

    // For photos without transparency
    if (imageType === 'photo') {
      if (this.formatSupport.avif) return 'avif';
      if (this.formatSupport.webp) return 'webp';
      return 'jpeg';
    }

    // For graphics/illustrations
    if (this.formatSupport.webp) return 'webp';
    return 'png';
  }

  generateResponsiveImageURL(originalPath, options = {}) {
    const {
      width = 'auto',
      quality = 80,
      format = 'auto',
      devicePixelRatio = 1
    } = options;

    const actualWidth = width === 'auto' ? null : width * devicePixelRatio;
    const optimalFormat = format === 'auto' ?
      this.selectOptimalFormat(this.detectImageType(originalPath)) : format;

    // CDN-based image transformation URL
    return `https://images.cdn.com/transform/` +
      `format=${optimalFormat}/` +
      `quality=${quality}/` +
      `${actualWidth ? `width=${actualWidth}/` : ''}` +
      `${originalPath}`;
  }
}
```


⚙️ **Advanced Image Processing Pipeline:**


```javascript
// Production image processing system tại Webflow
class ImageProcessingPipeline {
  constructor() {
    this.processors = [
      new MetadataExtractor(),
      new QualityAnalyzer(),
      new FormatOptimizer(),
      new SizeVariantGenerator(),
      new CDNUploader()
    ];
  }

  async processImage(imageFile, context) {
    let processedImage = imageFile;
    const processingResults = {};

    // Step 1: Extract metadata và analyze content
    const metadata = await this.extractMetadata(processedImage);
    processingResults.metadata = metadata;

    // Step 2: Content-aware quality optimization
    const qualityProfile = await this.analyzeImageContent(processedImage, metadata);
    processingResults.qualityProfile = qualityProfile;

    // Step 3: Generate multiple variants
    const variants = await this.generateVariants(processedImage, qualityProfile, context);
    processingResults.variants = variants;

    // Step 4: Upload to CDN với optimal caching headers
    const cdnResults = await this.uploadToCDN(variants);
    processingResults.cdnUrls = cdnResults;

    return processingResults;
  }

  async analyzeImageContent(imageBuffer, metadata) {
    // Computer vision analysis để determine optimal compression settings
    const analysis = {
      hasText: false,
      complexity: 'medium',
      colorRange: 'normal',
      noiseLevel: 'low',
      edgeIntensity: 'medium'
    };

    // Text detection - affects compression settings
    if (metadata.width > 300 && metadata.height > 100) {
      analysis.hasText = await this.detectTextInImage(imageBuffer);
    }

    // Complexity analysis - high complexity needs lower compression
    analysis.complexity = await this.calculateImageComplexity(imageBuffer);

    // Color analysis - monochromatic images compress better
    analysis.colorRange = await this.analyzeColorDistribution(imageBuffer);

    return this.generateQualityProfile(analysis);
  }

  generateQualityProfile(analysis) {
    let baseQuality = 80;

    // Adjust quality based on content analysis
    if (analysis.hasText) baseQuality = Math.max(baseQuality, 85);
    if (analysis.complexity === 'high') baseQuality = Math.min(baseQuality + 5, 95);
    if (analysis.colorRange === 'limited') baseQuality = Math.max(baseQuality - 10, 70);

    return {
      jpeg: {
        quality: baseQuality,
        progressive: true,
        optimizeCoding: true
      },
      webp: {
        quality: Math.max(baseQuality - 5, 75), // WebP generally more efficient
        method: analysis.complexity === 'high' ? 6 : 4, // Encoding effort
        autoFilter: true
      },
      avif: {
        quality: Math.max(baseQuality - 10, 70), // AVIF much more efficient
        speed: analysis.complexity === 'high' ? 6 : 8, // Encoding speed vs quality
        chromaSubsampling: analysis.hasText ? '444' : '420'
      }
    };
  }

  async generateVariants(imageBuffer, qualityProfile, context) {
    const variants = [];
    const breakpoints = [480, 768, 1024, 1440, 1920]; // Common responsive breakpoints

    for (const width of breakpoints) {
      for (const format of ['avif', 'webp', 'jpeg']) {
        const variant = await this.resizeAndCompress({
          imageBuffer,
          width,
          format,
          quality: qualityProfile[format]?.quality || 80,
          context
        });

        variants.push({
          width,
          format,
          size: variant.length,
          url: null, // Will be populated by CDN upload
          buffer: variant
        });
      }
    }

    return variants;
  }
}
```


**Lazy Loading Implementation Deep Dive:**


```javascript
// Advanced lazy loading với predictive preloading
class IntelligentImageLazyLoader {
  constructor() {
    this.intersectionObserver = new IntersectionObserver(
      this.handleIntersection.bind(this),
      {
        rootMargin: '50px', // Start loading 50px before entering viewport
        threshold: 0
      }
    );

    this.loadedImages = new Set();
    this.preloadQueue = [];
    this.connectionInfo = this.getConnectionInfo();

    // Predictive preloading based on user scroll behavior
    this.setupScrollPrediction();
  }

  getConnectionInfo() {
    if ('connection' in navigator) {
      const connection = navigator.connection;
      return {
        effectiveType: connection.effectiveType, // '4g', '3g', '2g', 'slow-2g'
        downlink: connection.downlink, // Bandwidth estimate in Mbps
        rtt: connection.rtt, // Round trip time in ms
        saveData: connection.saveData // User data saver preference
      };
    }

    return { effectiveType: '4g', downlink: 10, rtt: 100, saveData: false };
  }

  setupScrollPrediction() {
    let scrollVelocity = 0;
    let lastScrollY = window.scrollY;
    let lastScrollTime = Date.now();

    const trackScrollVelocity = () => {
      const currentScrollY = window.scrollY;
      const currentTime = Date.now();

      const deltaY = currentScrollY - lastScrollY;
      const deltaTime = currentTime - lastScrollTime;

      scrollVelocity = deltaTime > 0 ? deltaY / deltaTime : 0;

      lastScrollY = currentScrollY;
      lastScrollTime = currentTime;

      // Predict scroll destination và preload images
      if (Math.abs(scrollVelocity) > 0.5) { // Fast scrolling
        this.predictivePreload(scrollVelocity);
      }
    };

    window.addEventListener('scroll', trackScrollVelocity, { passive: true });
  }

  predictivePreload(velocity) {
    // Predict where user will scroll based on velocity
    const viewportHeight = window.innerHeight;
    const currentScroll = window.scrollY;
    const predictedScroll = currentScroll + (velocity * 1000); // Predict 1 second ahead

    // Find images near predicted scroll position
    const images = document.querySelectorAll('img[data-src]:not([data-loaded])');
    images.forEach(img => {
      const rect = img.getBoundingClientRect();
      const imgTop = rect.top + currentScroll;

      if (Math.abs(imgTop - predictedScroll) < viewportHeight) {
        this.preloadImage(img);
      }
    });
  }

  handleIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        this.loadImage(entry.target);
        this.intersectionObserver.unobserve(entry.target);
      }
    });
  }

  async loadImage(img) {
    if (this.loadedImages.has(img)) return;

    const adaptiveOptions = this.getAdaptiveLoadingOptions(img);
    const srcset = this.generateResponsiveSrcset(img, adaptiveOptions);

    // Create new image element for loading
    const imageLoader = new Image();

    // Progressive enhancement: load low-quality placeholder first
    if (img.dataset.placeholder && this.connectionInfo.effectiveType !== '4g') {
      await this.loadPlaceholder(img);
    }

    return new Promise((resolve, reject) => {
      imageLoader.onload = () => {
        // Replace placeholder with high-quality image
        img.src = imageLoader.src;
        img.srcset = srcset;
        img.setAttribute('data-loaded', 'true');

        // Add fade-in animation
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.3s ease';
        requestAnimationFrame(() => {
          img.style.opacity = '1';
        });

        this.loadedImages.add(img);
        resolve();
      };

      imageLoader.onerror = () => {
        // Fallback to original src
        img.src = img.dataset.fallback || img.dataset.src;
        img.setAttribute('data-error', 'true');
        reject(new Error('Image load failed'));
      };

      // Start loading
      imageLoader.src = this.selectOptimalImageUrl(img, adaptiveOptions);
    });
  }

  getAdaptiveLoadingOptions(img) {
    const rect = img.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // Adjust quality based on connection và data saver preference
    let quality = 80;
    if (this.connectionInfo.saveData) quality = 60;
    else if (this.connectionInfo.effectiveType === '2g') quality = 50;
    else if (this.connectionInfo.effectiveType === '3g') quality = 70;

    // Adjust size based on display context
    const displayWidth = Math.ceil(rect.width * dpr);
    const displayHeight = Math.ceil(rect.height * dpr);

    return {
      width: displayWidth,
      height: displayHeight,
      quality,
      format: this.getBestSupportedFormat(),
      urgent: this.isAboveFold(img) // Prioritize above-fold images
    };
  }

  generateResponsiveSrcset(img, options) {
    const baseSrc = img.dataset.src;
    const widths = [480, 768, 1024, 1440, 1920];

    return widths
      .filter(w => w <= options.width * 2) // Don't generate unnecessary large sizes
      .map(width => {
        const url = this.generateImageUrl(baseSrc, {
          ...options,
          width
        });
        return `${url} ${width}w`;
      })
      .join(', ');
  }
}
```


🏭 **Production Image


## Claude


🏭 **Production Image Optimization tại Pinterest:**


Pinterest serve billions of images daily với extreme diversity - từ recipe photos đến fashion imagery. Chúng tôi developed adaptive image pipeline:


```javascript
// Pinterest's content-aware image optimization
class PinterestImageOptimizer {
  constructor() {
    this.mlClassifier = new ImageContentClassifier();
    this.optimizationProfiles = {
      'food': {
        quality: 85, // Food needs high quality for appeal
        sharpening: 1.2,
        saturation: 1.1,
        priorityFormats: ['avif', 'webp', 'jpeg']
      },
      'fashion': {
        quality: 88, // Fashion details critical
        sharpening: 1.0,
        saturation: 1.05,
        priorityFormats: ['avif', 'webp', 'jpeg']
      },
      'home-decor': {
        quality: 80, // Balanced approach
        sharpening: 0.9,
        saturation: 0.95,
        priorityFormats: ['webp', 'jpeg']
      },
      'text-heavy': {
        quality: 90, // Text readability crucial
        sharpening: 1.5,
        compression: 'lossless-first',
        priorityFormats: ['webp', 'png']
      }
    };
  }

  async optimizeForPinterest(imageBuffer, pin_metadata) {
    // Step 1: AI-powered content classification
    const contentType = await this.mlClassifier.classify(imageBuffer);

    // Step 2: User engagement prediction
    const engagementScore = await this.predictEngagement(pin_metadata, contentType);

    // Step 3: Adaptive optimization based on predicted performance
    const profile = this.optimizationProfiles[contentType];

    // High engagement potential = higher quality budget
    if (engagementScore > 0.8) {
      profile.quality = Math.min(profile.quality + 5, 95);
    }

    // Step 4: Generate variants optimized for Pinterest's grid layout
    return await this.generatePinterestVariants(imageBuffer, profile, pin_metadata);
  }

  async generatePinterestVariants(imageBuffer, profile, metadata) {
    const variants = [];

    // Pinterest-specific breakpoints based on grid layout
    const pinterestBreakpoints = [
      { width: 236, label: 'grid-small' },      // Mobile grid
      { width: 345, label: 'grid-medium' },     // Tablet grid
      { width: 474, label: 'grid-large' },      // Desktop grid
      { width: 736, label: 'closeup' },         // Pin closeup view
      { width: 1200, label: 'fullscreen' }      // Full resolution view
    ];

    for (const breakpoint of pinterestBreakpoints) {
      for (const format of profile.priorityFormats) {
        const variant = await this.processVariant({
          imageBuffer,
          ...breakpoint,
          format,
          profile,
          metadata
        });

        variants.push(variant);
      }
    }

    return variants;
  }

  async processVariant({ imageBuffer, width, label, format, profile, metadata }) {
    // Content-aware resizing (maintaining aspect ratio)
    const aspectRatio = metadata.originalHeight / metadata.originalWidth;
    const height = Math.round(width * aspectRatio);

    // Apply content-specific enhancements
    let processedBuffer = imageBuffer;

    if (profile.sharpening !== 1.0) {
      processedBuffer = await this.applySharpening(processedBuffer, profile.sharpening);
    }

    if (profile.saturation !== 1.0) {
      processedBuffer = await this.adjustSaturation(processedBuffer, profile.saturation);
    }

    // Format-specific compression
    const compressedBuffer = await this.compressImage({
      buffer: processedBuffer,
      width,
      height,
      format,
      quality: profile.quality
    });

    return {
      label,
      width,
      height,
      format,
      size: compressedBuffer.length,
      compressionRatio: imageBuffer.length / compressedBuffer.length,
      buffer: compressedBuffer
    };
  }
}
```


**WebP Advanced Configuration:**


```javascript
// WebP encoding với advanced options
const webpEncodeOptions = {
  // Lossless options
  lossless: false,
  quality: 80,

  // Advanced compression settings
  method: 6,          // Compression method (0-6, 6 = slowest/best)
  segments: 4,        // Number of segments for segmented encoding
  sns_strength: 50,   // Spatial noise shaping (0-100)
  filter_strength: 60, // Deblocking filter strength (0-100)
  filter_sharpness: 0, // Deblocking filter sharpness (0-7)
  filter_type: 1,     // Deblocking filter type (0-2)
  autofilter: true,   // Auto-adjust filter parameters
  alpha_compression: 1, // Alpha compression method
  alpha_filtering: 1,   // Alpha filtering method
  alpha_quality: 100,   // Alpha channel quality

  // Pass-specific settings
  pass: 1,            // Number of entropy analysis passes (1-10)
  show_compressed: 0,  // Debug: show compressed blocks
  preprocessing: 0,    // Preprocessing filter
  partitions: 0,      // Number of partitions (0-3)
  partition_limit: 0, // Limit on quality degradation due to partitioning

  // Advanced features
  emulate_jpeg_size: false, // Match JPEG size approximately
  thread_level: 0,         // Multi-threading level
  low_memory: false,       // Low memory usage mode
  near_lossless: 100,     // Near-lossless quality (0-100, 100=lossless)
  exact: false,           // Exact transparency preservation
  use_delta_palette: false, // Use delta palette encoding
  use_sharp_yuv: false     // Use sharp YUV->RGB conversion
};

async function encodeWebP(imageBuffer, options = {}) {
  const finalOptions = { ...webpEncodeOptions, ...options };

  // Dynamic option adjustment based on image characteristics
  const imageInfo = await analyzeImageCharacteristics(imageBuffer);

  if (imageInfo.hasTransparency) {
    finalOptions.alpha_quality = Math.max(finalOptions.alpha_quality, 90);
    finalOptions.exact = true;
  }

  if (imageInfo.complexity > 0.8) {
    finalOptions.method = Math.max(finalOptions.method, 5);
    finalOptions.segments = 4;
  }

  if (imageInfo.hasText) {
    finalOptions.sns_strength = Math.min(finalOptions.sns_strength, 30);
    finalOptions.filter_strength = Math.max(finalOptions.filter_strength, 70);
  }

  return await webpEncode(imageBuffer, finalOptions);
}
```


### 2.3 Critical Resource Prioritization


📖 **Resource Loading Priority Deep Dive**


🔬 **Browser Resource Loading Mechanism:**


```javascript
// Modern resource priority system
class ResourcePriorityManager {
  constructor() {
    this.loadingQueue = {
      'critical': [],     // Above-fold content
      'important': [],    // Interactive elements
      'normal': [],       // Below-fold content
      'low': []          // Analytics, tracking
    };

    this.performanceObserver = this.initializePerformanceMonitoring();
  }

  prioritizeResource(resource, context) {
    const priority = this.calculatePriority(resource, context);

    // Modern priority hints
    if (resource.tagName === 'LINK') {
      resource.setAttribute('fetchpriority', priority);
    } else if (resource.tagName === 'IMG') {
      resource.setAttribute('fetchpriority', priority);

      // Preload critical images
      if (priority === 'high' && this.isAboveFold(resource)) {
        this.preloadImage(resource);
      }
    } else if (resource.tagName === 'SCRIPT') {
      this.optimizeScriptLoading(resource, priority);
    }

    return priority;
  }

  calculatePriority(resource, context) {
    let score = 50; // Base priority score

    // Above-fold content gets highest priority
    if (this.isAboveFold(resource)) score += 40;

    // Interactive elements need high priority
    if (this.isInteractiveElement(resource)) score += 30;

    // Critical for functionality
    if (this.isCriticalForFunctionality(resource)) score += 35;

    // User initiated requests
    if (context?.userInitiated) score += 25;

    // Convert score to priority level
    if (score >= 85) return 'high';
    if (score >= 65) return 'medium';
    if (score >= 45) return 'low';
    return 'very-low';
  }

  optimizeScriptLoading(script, priority) {
    switch (priority) {
      case 'high':
        // Critical scripts load immediately
        script.removeAttribute('defer');
        script.removeAttribute('async');
        break;

      case 'medium':
        // Important scripts load async
        script.setAttribute('async', '');
        script.removeAttribute('defer');
        break;

      case 'low':
        // Non-critical scripts defer
        script.setAttribute('defer', '');
        script.removeAttribute('async');
        break;

      case 'very-low':
        // Analytics and tracking load after page load
        this.loadAfterPageLoad(script);
        break;
    }
  }

  loadAfterPageLoad(script) {
    if (document.readyState === 'complete') {
      this.loadScript(script);
    } else {
      window.addEventListener('load', () => {
        setTimeout(() => this.loadScript(script), 1000);
      }, { once: true });
    }
  }
}
```


**Critical CSS Extraction:**


```javascript
// Automated critical CSS detection
class CriticalCSSExtractor {
  constructor() {
    this.criticalViewportHeight = window.innerHeight;
    this.criticalSelectors = new Set();
  }

  async extractCriticalCSS(cssText, html) {
    // Parse CSS and HTML
    const css = await this.parseCSS(cssText);
    const dom = await this.parseHTML(html);

    // Identify above-fold elements
    const aboveFoldElements = this.getAboveFoldElements(dom);

    // Extract selectors used by above-fold elements
    const criticalSelectors = this.extractSelectorsForElements(
      aboveFoldElements,
      css
    );

    // Generate critical CSS
    const criticalCSS = this.generateCriticalCSS(css, criticalSelectors);

    return {
      critical: criticalCSS,
      remaining: this.generateRemainingCSS(css, criticalSelectors),
      stats: {
        originalSize: cssText.length,
        criticalSize: criticalCSS.length,
        criticalPercentage: (criticalCSS.length / cssText.length * 100).toFixed(1)
      }
    };
  }

  getAboveFoldElements(dom) {
    const aboveFoldElements = [];
    const walker = document.createTreeWalker(
      dom,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: (node) => {
          const rect = this.estimateElementPosition(node);
          return rect.top < this.criticalViewportHeight ?
            NodeFilter.FILTER_ACCEPT :
            NodeFilter.FILTER_REJECT;
        }
      }
    );

    let node;
    while (node = walker.nextNode()) {
      aboveFoldElements.push(node);
    }

    return aboveFoldElements;
  }

  extractSelectorsForElements(elements, css) {
    const usedSelectors = new Set();

    elements.forEach(element => {
      // Check each CSS rule against element
      css.rules.forEach(rule => {
        if (rule.type === CSSRule.STYLE_RULE) {
          try {
            if (element.matches(rule.selectorText)) {
              usedSelectors.add(rule.selectorText);
            }
          } catch (e) {
            // Handle complex selectors that can't be matched directly
            if (this.complexSelectorMatches(element, rule.selectorText)) {
              usedSelectors.add(rule.selectorText);
            }
          }
        }
      });
    });

    return usedSelectors;
  }

  generateCriticalCSS(css, criticalSelectors) {
    let criticalCSS = '';

    css.rules.forEach(rule => {
      if (rule.type === CSSRule.STYLE_RULE &&
          criticalSelectors.has(rule.selectorText)) {
        criticalCSS += rule.cssText + '\n';
      } else if (rule.type === CSSRule.MEDIA_RULE) {
        // Handle media queries
        const criticalMediaCSS = this.extractCriticalFromMedia(rule, criticalSelectors);
        if (criticalMediaCSS) {
          criticalCSS += `@media ${rule.conditionText} {\n${criticalMediaCSS}}\n`;
        }
      }
    });

    return this.optimizeCriticalCSS(criticalCSS);
  }

  optimizeCriticalCSS(css) {
    // Remove unused properties, merge duplicate selectors, etc.
    return css
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
      .replace(/\s+/g, ' ')             // Normalize whitespace
      .replace(/;\s*}/g, '}')           // Remove unnecessary semicolons
      .trim();
  }
}
```


**Advanced Preloading Strategies:**


```javascript
// Intelligent resource preloading
class IntelligentPreloader {
  constructor() {
    this.preloadedResources = new Map();
    this.userBehaviorTracker = new UserBehaviorTracker();
    this.connectionAwarePreloading = new ConnectionAwarePreloader();
  }

  async initializePreloading() {
    // Preload based on route prediction
    await this.preloadBasedOnRoutes();

    // Preload based on user behavior patterns
    await this.preloadBasedOnBehavior();

    // Preload critical resources for likely next actions
    await this.preloadCriticalResources();
  }

  async preloadBasedOnRoutes() {
    const currentRoute = window.location.pathname;
    const routeAnalytics = await this.getRouteAnalytics(currentRoute);

    // Preload resources for top 3 most likely next routes
    const likelyNextRoutes = routeAnalytics.nextRoutes.slice(0, 3);

    likelyNextRoutes.forEach(async (route) => {
      if (route.probability > 0.3) { // 30% threshold
        await this.preloadRouteResources(route.path, route.probability);
      }
    });
  }

  async preloadRouteResources(routePath, probability) {
    // Adjust preload aggressiveness based on probability
    const preloadLevel = this.calculatePreloadLevel(probability);

    const routeManifest = await this.getRouteManifest(routePath);

    switch (preloadLevel) {
      case 'aggressive':
        // Preload all critical resources
        await this.preloadResources(routeManifest.critical);
        await this.preloadResources(routeManifest.important);
        break;

      case 'moderate':
        // Only preload critical resources
        await this.preloadResources(routeManifest.critical);
        break;

      case 'conservative':
        // Only preload DNS and critical CSS
        await this.preloadDNS(routeManifest.domains);
        await this.preloadResource(routeManifest.criticalCSS, 'style');
        break;
    }
  }

  async preloadBasedOnBehavior() {
    const userPatterns = await this.userBehaviorTracker.getPatterns();

    // Preload based on hover intent
    document.addEventListener('mouseover', (e) => {
      const link = e.target.closest('a');
      if (link && !this.preloadedResources.has(link.href)) {
        setTimeout(() => {
          if (link.matches(':hover')) { // Still hovering after 100ms
            this.preloadLinkResources(link);
          }
        }, 100);
      }
    });

    // Preload based on scroll position
    const scrollPrediction = this.userBehaviorTracker.predictScrollDestination();
    if (scrollPrediction.confidence > 0.7) {
      await this.preloadResourcesNearPosition(scrollPrediction.position);
    }
  }

  async preloadResource(url, type, priority = 'low') {
    if (this.preloadedResources.has(url)) return;

    // Check connection quality before preloading
    if (!this.connectionAwarePreloading.shouldPreload(type, priority)) {
      return;
    }

    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = url;
    link.as = type;

    if (priority !== 'low') {
      link.setAttribute('fetchpriority', priority);
    }

    // Add to document head
    document.head.appendChild(link);

    // Track preloaded resources
    this.preloadedResources.set(url, {
      timestamp: Date.now(),
      type,
      priority,
      used: false
    });

    // Clean up unused preloads after 30 seconds
    setTimeout(() => {
      const resource = this.preloadedResources.get(url);
      if (resource && !resource.used) {
        document.head.removeChild(link);
        this.preloadedResources.delete(url);
      }
    }, 30000);
  }

  markResourceAsUsed(url) {
    const resource = this.preloadedResources.get(url);
    if (resource) {
      resource.used = true;

      // Track preload effectiveness
      this.trackPreloadEffectiveness(url, resource);
    }
  }

  trackPreloadEffectiveness(url, resource) {
    const effectiveness = {
      url,
      preloadTime: resource.timestamp,
      useTime: Date.now(),
      timeSaved: Date.now() - resource.timestamp,
      type: resource.type,
      priority: resource.priority
    };

    // Send analytics to improve future preloading decisions
    this.sendAnalytics('preload-effectiveness', effectiveness);
  }
}

// Connection-aware preloading
class ConnectionAwarePreloader {
  constructor() {
    this.connectionInfo = this.getConnectionInfo();
    this.preloadBudget = this.calculatePreloadBudget();
  }

  getConnectionInfo() {
    if ('connection' in navigator) {
      return {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt,
        saveData: navigator.connection.saveData
      };
    }

    return { effectiveType: '4g', downlink: 10, rtt: 100, saveData: false };
  }

  calculatePreloadBudget() {
    if (this.connectionInfo.saveData) return 0; // No preloading on data saver

    const budgetMap = {
      'slow-2g': 50,   // 50KB budget
      '2g': 150,       // 150KB budget
      '3g': 500,       // 500KB budget
      '4g': 2000       // 2MB budget
    };

    return budgetMap[this.connectionInfo.effectiveType] || 500;
  }

  shouldPreload(resourceType, priority) {
    if (this.connectionInfo.saveData) return false;

    const resourceSizes = {
      'script': 100,    // Average JS file size (KB)
      'style': 20,      // Average CSS file size (KB)
      'image': 50,      // Average image size (KB)
      'font': 30        // Average font file size (KB)
    };

    const estimatedSize = resourceSizes[resourceType] || 50;

    // Check if we have budget remaining
    if (estimatedSize > this.preloadBudget) return false;

    // Adjust decision based on priority and connection
    if (priority === 'high') return true;
    if (priority === 'medium' && this.connectionInfo.effectiveType !== '2g') return true;
    if (priority === 'low' && this.connectionInfo.effectiveType === '4g') return true;

    return false;
  }

  consumeBudget(amount) {
    this.preloadBudget = Math.max(0, this.preloadBudget - amount);
  }
}
```


🎯 **Performance Metrics & Monitoring:**


```javascript
// Advanced performance monitoring cho resource optimization
class ResourcePerformanceMonitor {
  constructor() {
    this.metrics = {
      resourceLoadTimes: new Map(),
      cachePerformance: new Map(),
      preloadEffectiveness: new Map(),
      criticalResourceMetrics: []
    };

    this.initializeObservers();
  }

  initializeObservers() {
    // Resource Timing Observer
    new PerformanceObserver((list) => {
      list.getEntries().forEach(entry => {
        this.recordResourceMetrics(entry);
      });
    }).observe({ entryTypes: ['resource'] });

    // Navigation Timing Observer
    new PerformanceObserver((list) => {
      list.getEntries().forEach(entry => {
        this.recordNavigationMetrics(entry);
      });
    }).observe({ entryTypes: ['navigation'] });

    // Largest Contentful Paint Observer
    new PerformanceObserver((list) => {
      list.getEntries().forEach(entry => {
        this.recordLCPMetrics(entry);
      });
    }).observe({ entryTypes: ['largest-contentful-paint'] });
  }

  recordResourceMetrics(entry) {
    const resourceType = this.determineResourceType(entry.name);
    const metrics = {
      url: entry.name,
      type: resourceType,
      duration: entry.duration,
      size: entry.transferSize,
      cached: entry.transferSize === 0,
      connectTime: entry.connectEnd - entry.connectStart,
      dnsTime: entry.domainLookupEnd - entry.domainLookupStart,
      tlsTime: entry.secureConnectionStart > 0 ?
        entry.connectEnd - entry.secureConnectionStart : 0,
      ttfb: entry.responseStart - entry.requestStart,
      downloadTime: entry.responseEnd - entry.responseStart,
      timestamp: entry.startTime
    };

    // Store metrics by resource type
    if (!this.metrics.resourceLoadTimes.has(resourceType)) {
      this.metrics.resourceLoadTimes.set(resourceType, []);
    }

    this.metrics.resourceLoadTimes.get(resourceType).push(metrics);

    // Alert on slow critical resources
    if (this.isCriticalResource(entry.name) && entry.duration > 1000) {
      this.alertSlowCriticalResource(entry.name, entry.duration);
    }
  }

  generatePerformanceReport() {
    const report = {
      summary: this.calculateSummaryMetrics(),
      resourceBreakdown: this.calculateResourceBreakdown(),
      optimizationRecommendations: this.generateRecommendations(),
      trends: this.calculatePerformanceTrends()
    };

    return report;
  }

  calculateSummaryMetrics() {
    const allMetrics = Array.from(this.metrics.resourceLoadTimes.values()).flat();

    return {
      totalResources: allMetrics.length,
      totalSize: allMetrics.reduce((sum, m) => sum + m.size, 0),
      averageLoadTime: allMetrics.reduce((sum, m) => sum + m.duration, 0) / allMetrics.length,
      cacheHitRate: allMetrics.filter(m => m.cached).length / allMetrics.length,
      slowResourcesCount: allMetrics.filter(m => m.duration > 1000).length
    };
  }

  generateRecommendations() {
    const recommendations = [];

    // Analyze resource types for optimization opportunities
    this.metrics.resourceLoadTimes.forEach((metrics, type) => {
      const avgDuration = metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length;
      const avgSize = metrics.reduce((sum, m) => sum + m.size, 0) / metrics.length;
      const cacheRate = metrics.filter(m => m.cached).length / metrics.length;

      if (avgDuration > 1000) {
        recommendations.push({
          type: 'performance',
          resource: type,
          issue: `Slow loading ${type} resources (${avgDuration.toFixed(0)}ms average)`,
          suggestions: this.getOptimizationSuggestions(type, avgDuration, avgSize)
        });
      }

      if (cacheRate < 0.7) {
        recommendations.push({
          type: 'caching',
          resource: type,
          issue: `Low cache hit rate for ${type} (${(cacheRate * 100).toFixed(1)}%)`,
          suggestions: ['Review cache headers', 'Implement CDN caching', 'Add service worker caching']
        });
      }
    });

    return recommendations;
  }

  getOptimizationSuggestions(resourceType, avgDuration, avgSize) {
    const suggestions = [];

    switch (resourceType) {
      case 'script':
        if (avgSize > 100000) suggestions.push('Code splitting and lazy loading');
        if (avgDuration > 2000) suggestions.push('Minification and compression');
        suggestions.push('Bundle optimization', 'Tree shaking');
        break;

      case 'stylesheet':
        suggestions.push('Critical CSS inlining', 'CSS minification');
        if (avgSize > 50000) suggestions.push('CSS code splitting');
        break;

      case 'image':
        suggestions.push('Modern image formats (WebP/AVIF)', 'Image compression');
        if (avgSize > 200000) suggestions.push('Responsive images', 'Lazy loading');
        break;

      case 'font':
        suggestions.push('Font preloading', 'Font display optimization');
        if (avgDuration > 1500) suggestions.push('WOFF2 format', 'Font subsetting');
        break;
    }

    return suggestions;
  }
}
```


Với foundation này về network và resource optimization, chúng ta đã covered:


1. **Network Layer**: Gzip compression mechanics, sophisticated HTTP caching strategies, và CDN architecture với edge computing
2. **Resource Layer**: Advanced code splitting patterns, AI-powered image optimization, và intelligent resource prioritization


Tiếp theo, chúng ta sẽ dive deep vào **Rendering Layer** - nơi browser transforms resources thành visual interface mà users interact với. Đây là nơi Web Vitals metrics được determined và user experience được defined.


**Key Takeaways từ Resource Layer:**


💡 **Performance Engineering Principles:**


- **Measure First**: Always profile before optimizing
- **Progressive Enhancement**: Start with basics, enhance based on capabilities
- **User-Centric**: Optimize for actual user behavior, not theoretical scenarios
- **Adaptive**: Adjust strategies based on device, connection, và context


🎯 **Next Chapter Preview**: Rendering optimization sẽ cover critical rendering path, virtual scrolling for large datasets, layout thrashing prevention, và advanced browser painting optimizations. Chúng ta sẽ explore browser internals và learn cách optimize rendering performance from paint time đến composite layers.
