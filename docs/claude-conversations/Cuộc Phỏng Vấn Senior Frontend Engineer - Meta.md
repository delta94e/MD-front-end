# Cuộc Phỏng Vấn Senior Frontend Engineer - Meta

## Claude


Tôi sẽ mô phỏng một cuộc phỏng vấn kỹ thuật hoàn chỉnh cho vị trí Senior Frontend Engineer tại Meta, tập trung vào chủ đề Browser Performance Monitoring. Đây sẽ là cuộc đối thoại giữa interviewer (Staff Engineer tại Meta) và candidate xuất sắc.


Tôi đã tạo ra một cuộc phỏng vấn kỹ thuật hoàn chỉnh và chuyên sâu cho vị trí Senior Frontend Engineer tại Meta, tập trung vào chủ đề **Browser Performance Monitoring**.


## Highlights của cuộc phỏng vấn:


### 🎯 Structure hoàn chỉnh 3 phần:


- **Warm-up**: Context setting và experience discussion
- **Deep Technical**: Comprehensive technical deep-dive
- **Coding Challenge**: Live implementation với real-world complexity


### 💡 Technical Depth:


- **Performance APIs mastery** (Navigation Timing, Resource Timing, Performance Observer)
- **Core Web Vitals implementation** với accurate measurement strategies
- **Advanced monitoring architectures** (RUM vs Synthetic hybrid approach)
- **Statistical anomaly detection** với ML-ready frameworks
- **Production-scale considerations** (sampling, offline handling, alerting)


### 🚀 Meta-level Engineering:


- **Billions of users scale** considerations
- **Real-time processing** requirements
- **Cross-platform compatibility** strategies
- **Business impact correlation** analysis


### 🔧 Production-ready Code:


- Comprehensive error handling
- Edge case management (offline, SPA navigation, network failures)
- Performance impact minimization
- Extensible architecture patterns


### 📊 Advanced Features:


- **Smart sampling** với bias prevention
- **Real-time alerting** với false positive reduction
- **Statistical validation** methods
- **A/B testing frameworks** cho monitoring itself


Cuộc phỏng vấn thể hiện level **L6 Senior Engineer** với deep technical expertise, system design thinking, và production experience phù hợp với Meta's engineering standards.


Candidate demonstrate comprehensive understanding từ browser fundamentals đến enterprise-scale monitoring challenges, với practical solutions và innovative approaches.


## Claude


# Cuộc Phỏng Vấn Senior Frontend Engineer - Meta


## Chủ đề: Browser Performance Monitoring


---


## PHẦN 1: WARM-UP & INTRODUCTION


**Interviewer**: Chào Alex! Cảm ơn bạn đã dành thời gian cho cuộc phỏng vấn hôm nay. Tôi là Sarah, Staff Engineer ở Meta đã làm việc với performance và infrastructure được 12 năm. Trước khi bắt đầu, bạn có thể giới thiệu ngắn gọn về bản thân và kinh nghiệm với performance monitoring không?


**Candidate**: Chào Sarah! Tôi là Alex, hiện tại là Senior Frontend Engineer với 7 năm kinh nghiệm. Trong 3 năm gần đây tôi đã làm tech lead cho team performance tại một công ty fintech xử lý 50M+ transactions/tháng. Tôi đã build và maintain comprehensive performance monitoring system bao gồm cả **synthetic và real user monitoring**.


Cụ thể, tôi đã implement **custom performance tracking infrastructure** sử dụng Performance Observer API, Navigation Timing API và Paint Timing API. Hệ thống này track được các metrics như **Core Web Vitals** (LCP, FID, CLS), **custom business metrics** và **resource loading performance**. Điều đặc biệt là chúng tôi đã optimize được **Time to Interactive từ 4.2s xuống 1.8s** và **First Contentful Paint từ 2.1s xuống 800ms** cho main application.


**Interviewer**: Ấn tượng đấy! Vậy trong kinh nghiệm của bạn, performance monitoring khác gì so với performance optimization? Và tại sao monitoring lại quan trọng đối với business?


**Candidate**: Đây là câu hỏi rất hay! **Performance monitoring và optimization là hai mặt của cùng một đồng xu** nhưng serve different purposes:


**Performance Monitoring** là việc **continuously measure, collect và analyze** performance data để:


- **Detect performance regressions** sớm trước khi impact users
- **Establish baseline performance** và track trends over time
- **Identify bottlenecks** và prioritize optimization efforts
- **Correlate performance với business metrics** như conversion rate, bounce rate


**Performance Optimization** là việc **actively improve** performance based on monitoring insights.


Về business impact, tôi có một case study cụ thể: Trong dự án e-commerce trước, chúng tôi phát hiện qua monitoring data rằng **mỗi 100ms delay trong checkout page** dẫn đến **2.3% drop in conversion rate**. Điều này tương đương **$450K revenue loss/tháng**.


**Monitoring helped us identify** rằng vấn đề không phải là code performance mà là **third-party payment widget** load chậm trong peak hours. Without monitoring, chúng tôi sẽ không biết root cause và có thể optimize sai direction.


**Interviewer**: Excellent insight! Giờ tôi muốn deep dive vào technical aspects. Trong monitoring system của bạn, bạn đã sử dụng những APIs nào và tại sao chọn chúng?


---


## PHẦN 2: DEEP TECHNICAL DISCUSSION


### 2.1 Performance APIs Deep Dive


**Candidate**: Great question! Trong production system, tôi đã sử dụng **combination của multiple Performance APIs** để capture comprehensive performance picture:


#### 1. Performance Observer API - The Foundation


```javascript
// Core implementation tôi đã sử dụng
const performanceObserver = new PerformanceObserver((list) => {
  const entries = list.getEntries();
  entries.forEach(entry => {
    switch(entry.entryType) {
      case 'navigation':
        collectNavigationMetrics(entry);
        break;
      case 'resource':
        collectResourceMetrics(entry);
        break;
      case 'paint':
        collectPaintMetrics(entry);
        break;
      case 'largest-contentful-paint':
        collectLCPMetrics(entry);
        break;
      case 'first-input':
        collectFIDMetrics(entry);
        break;
      case 'layout-shift':
        collectCLSMetrics(entry);
        break;
    }
  });
});

// Observe multiple entry types
performanceObserver.observe({
  entryTypes: ['navigation', 'resource', 'paint', 'largest-contentful-paint',
               'first-input', 'layout-shift', 'longtask']
});
```


**Lý do chọn Performance Observer**:


- **Asynchronous và non-blocking** - không impact main thread performance
- **Comprehensive coverage** - có thể observe tất cả performance events
- **Future-proof** - support các metrics mới như Core Web Vitals


#### 2. Navigation Timing API - Deep Page Load Analysis


```javascript
function collectNavigationMetrics(entry) {
  const metrics = {
    // DNS Resolution
    dnsLookupDuration: entry.domainLookupEnd - entry.domainLookupStart,

    // TCP Connection
    tcpConnectDuration: entry.connectEnd - entry.connectStart,

    // SSL Handshake (if HTTPS)
    sslDuration: entry.connectEnd - entry.secureConnectionStart,

    // Time to First Byte
    ttfb: entry.responseStart - entry.requestStart,

    // Response Download
    responseDownloadDuration: entry.responseEnd - entry.responseStart,

    // DOM Processing
    domProcessingDuration: entry.domComplete - entry.responseEnd,

    // Critical rendering path metrics
    domInteractive: entry.domInteractive - entry.fetchStart,
    domContentLoaded: entry.domContentLoadedEventEnd - entry.fetchStart,
    loadComplete: entry.loadEventEnd - entry.fetchStart,

    // Advanced metrics
    redirectCount: entry.redirectCount,
    transferSize: entry.transferSize,
    encodedBodySize: entry.encodedBodySize,
    decodedBodySize: entry.decodedBodySize
  };

  // Custom business logic metrics
  metrics.isFromCache = entry.transferSize === 0;
  metrics.compressionRatio = entry.decodedBodySize / entry.encodedBodySize;

  reportMetrics('navigation', metrics);
}
```


#### 3. Resource Timing API - Detailed Resource Analysis


```javascript
function analyzeResourcePerformance() {
  const resources = performance.getEntriesByType('resource');

  const resourceAnalysis = {
    totalResources: resources.length,
    resourcesByType: {},
    slowResources: [],
    cacheHitRate: 0,
    totalTransferSize: 0
  };

  resources.forEach(resource => {
    const type = resource.initiatorType;

    // Group by resource type
    if (!resourceAnalysis.resourcesByType[type]) {
      resourceAnalysis.resourcesByType[type] = {
        count: 0,
        totalDuration: 0,
        totalSize: 0,
        cacheHits: 0
      };
    }

    const typeData = resourceAnalysis.resourcesByType[type];
    typeData.count++;
    typeData.totalDuration += resource.duration;
    typeData.totalSize += resource.transferSize;

    // Detect cache hits
    if (resource.transferSize === 0) {
      typeData.cacheHits++;
    }

    // Identify slow resources (>2s for non-images, >5s for images)
    const slowThreshold = type === 'img' ? 5000 : 2000;
    if (resource.duration > slowThreshold) {
      resourceAnalysis.slowResources.push({
        name: resource.name,
        type: type,
        duration: resource.duration,
        size: resource.transferSize
      });
    }

    resourceAnalysis.totalTransferSize += resource.transferSize;
  });

  // Calculate cache hit rate
  const totalCacheHits = Object.values(resourceAnalysis.resourcesByType)
    .reduce((sum, type) => sum + type.cacheHits, 0);
  resourceAnalysis.cacheHitRate = totalCacheHits / resources.length;

  return resourceAnalysis;
}
```


**Interviewer**: Rất impressive! Tôi thấy bạn có deep understanding về các APIs. Giờ tôi muốn hỏi về một challenge phổ biến: **làm sao để measure First Meaningful Paint một cách accurate**? Như bạn biết, FMP không còn trong Core Web Vitals nữa, nhưng nó vẫn quan trọng cho business context.


### 2.2 First Meaningful Paint Implementation


**Candidate**: Đây là một trong những **challenging metrics** nhất để implement chính xác! FMP được deprecated vì **subjective nature** của nó, nhưng trong practice, nó vẫn rất valuable cho business analysis.


Tôi đã implement **multiple approaches** và combine chúng để có accurate FMP measurement:


#### Approach 1: DOM Mutation + Layout Analysis


```javascript
class FirstMeaningfulPaintDetector {
  constructor() {
    this.mutationObserver = null;
    this.layoutChangePoints = [];
    this.resourceLoadCompleted = false;
    this.fmpTimestamp = null;
  }

  startDetection() {
    this.observeLayoutChanges();
    this.monitorResourceLoading();
    this.scheduleAnalysis();
  }

  observeLayoutChanges() {
    this.mutationObserver = new MutationObserver((mutations) => {
      const layoutScore = this.calculateLayoutScore(mutations);

      if (layoutScore > 0) {
        this.layoutChangePoints.push({
          timestamp: performance.now(),
          score: layoutScore,
          mutations: mutations.length
        });
      }
    });

    this.mutationObserver.observe(document, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });
  }

  calculateLayoutScore(mutations) {
    let score = 0;

    mutations.forEach(mutation => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Score based on element visibility and importance
            const rect = node.getBoundingClientRect();
            const isInViewport = this.isInViewport(rect);
            const elementWeight = this.getElementWeight(node);

            if (isInViewport && elementWeight > 0) {
              score += elementWeight * this.getVisibilityScore(rect);
            }
          }
        });
      }
    });

    return score;
  }

  getElementWeight(element) {
    const tagWeights = {
      'img': 5,
      'video': 8,
      'canvas': 6,
      'svg': 4,
      'h1': 3, 'h2': 2, 'h3': 2,
      'p': 1,
      'div': this.hasBackgroundImage(element) ? 3 : 0.5
    };

    return tagWeights[element.tagName.toLowerCase()] || 0.5;
  }

  isInViewport(rect) {
    return rect.top < window.innerHeight &&
           rect.left < window.innerWidth &&
           rect.bottom > 0 &&
           rect.right > 0;
  }

  getVisibilityScore(rect) {
    const viewportArea = window.innerWidth * window.innerHeight;
    const elementArea = rect.width * rect.height;
    const visibleArea = Math.min(elementArea, viewportArea * 0.5);

    return visibleArea / viewportArea;
  }

  analyzeFMP() {
    if (this.layoutChangePoints.length === 0) return;

    // Find the point with highest layout score increase
    let maxScoreIncrease = 0;
    let fmpCandidate = null;

    for (let i = 1; i < this.layoutChangePoints.length; i++) {
      const current = this.layoutChangePoints[i];
      const previous = this.layoutChangePoints[i - 1];
      const scoreIncrease = current.score - previous.score;

      if (scoreIncrease > maxScoreIncrease) {
        maxScoreIncrease = scoreIncrease;
        fmpCandidate = current.timestamp;
      }
    }

    // Validate with resource loading completion
    if (fmpCandidate && this.resourceLoadCompleted) {
      this.fmpTimestamp = Math.max(fmpCandidate, this.getHeroResourcesLoadTime());
      this.reportFMP();
    }
  }
}
```


#### Approach 2: Hero Elements Detection


```javascript
class HeroElementsTracker {
  constructor(config = {}) {
    this.heroSelectors = config.heroSelectors || [
      '.hero-image',
      '.main-banner',
      '.featured-content',
      '[data-hero]'
    ];
    this.heroElements = new Map();
    this.allHeroesLoaded = false;
  }

  trackHeroElements() {
    // Identify hero elements
    this.heroSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        this.heroElements.set(element, {
          isLoaded: false,
          loadTime: null,
          isVisible: this.isInInitialViewport(element)
        });

        this.observeHeroElement(element);
      });
    });
  }

  observeHeroElement(element) {
    if (element.tagName === 'IMG') {
      if (element.complete) {
        this.markHeroLoaded(element);
      } else {
        element.addEventListener('load', () => this.markHeroLoaded(element));
        element.addEventListener('error', () => this.markHeroLoaded(element));
      }
    } else {
      // For non-image elements, check background images and fonts
      this.checkElementResources(element);
    }
  }

  async checkElementResources(element) {
    const computedStyle = getComputedStyle(element);
    const backgroundImage = computedStyle.backgroundImage;

    if (backgroundImage && backgroundImage !== 'none') {
      const imageUrl = this.extractImageUrl(backgroundImage);
      if (imageUrl) {
        await this.waitForImageLoad(imageUrl);
      }
    }

    // Check for custom fonts
    await this.waitForFontsLoad(computedStyle);

    this.markHeroLoaded(element);
  }

  markHeroLoaded(element) {
    const heroData = this.heroElements.get(element);
    if (heroData && !heroData.isLoaded) {
      heroData.isLoaded = true;
      heroData.loadTime = performance.now();

      this.checkAllHeroesLoaded();
    }
  }

  checkAllHeroesLoaded() {
    const visibleHeroes = Array.from(this.heroElements.entries())
      .filter(([element, data]) => data.isVisible);

    const loadedVisibleHeroes = visibleHeroes
      .filter(([element, data]) => data.isLoaded);

    if (loadedVisibleHeroes.length === visibleHeroes.length &&
        visibleHeroes.length > 0) {

      const maxLoadTime = Math.max(
        ...loadedVisibleHeroes.map(([element, data]) => data.loadTime)
      );

      this.reportHeroElementsLoadTime(maxLoadTime);
    }
  }
}
```


**Trade-offs Analysis**:


**DOM Mutation Approach**:


- ✅ **Pros**: Automatically detects content changes, works for dynamic content
- ❌ **Cons**: Can be noisy, requires careful calibration, performance overhead
- **Use case**: Single Page Applications với dynamic content loading


**Hero Elements Approach**:


- ✅ **Pros**: More accurate cho specific business metrics, less noise
- ❌ **Cons**: Requires manual configuration, might miss unexpected important content
- **Use case**: Static pages với well-defined hero content


**Combined Approach** (recommended):


```javascript
class FMPDetector {
  constructor(config) {
    this.domTracker = new FirstMeaningfulPaintDetector();
    this.heroTracker = new HeroElementsTracker(config);
    this.fmpTimestamp = null;
  }

  detect() {
    const domFMP = this.domTracker.getFMP();
    const heroFMP = this.heroTracker.getHeroLoadTime();

    // Use hero elements time if available, fallback to DOM analysis
    this.fmpTimestamp = heroFMP || domFMP;

    // Additional validation with Core Web Vitals
    this.validateWithLCP();

    return this.fmpTimestamp;
  }

  validateWithLCP() {
    // FMP should not be later than LCP
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lcpEntry = entries[entries.length - 1];

      if (this.fmpTimestamp > lcpEntry.startTime) {
        this.fmpTimestamp = lcpEntry.startTime;
      }
    }).observe({ entryTypes: ['largest-contentful-paint'] });
  }
}
```


**Interviewer**: Tuyệt vời! Tôi thấy bạn có systematic approach và understand trade-offs rất rõ. Giờ tôi muốn challenge bạn về **Real User Monitoring vs Synthetic Monitoring**. Trong production environment quy mô lớn như Facebook/Meta, làm sao để balance giữa hai approaches này?


### 2.3 RUM vs Synthetic Monitoring Strategy


**Candidate**: Đây là một architectural decision rất critical! Tại previous company, chúng tôi đã build **hybrid monitoring strategy** sau khi experience painful lessons từ việc rely too much vào một approach.


#### Strategic Framework:


**Synthetic Monitoring (Pre-production + Continuous)**:


```javascript
// Lighthouse CI integration
class SyntheticMonitoringPipeline {
  constructor() {
    this.lighthouseConfig = {
      extends: 'lighthouse:default',
      settings: {
        onlyAudits: [
          'first-contentful-paint',
          'largest-contentful-paint',
          'first-meaningful-paint',
          'speed-index',
          'interactive',
          'first-cpu-idle',
          'max-potential-fid'
        ],
        // Simulate different network conditions
        throttlingMethod: 'simulate',
        throttling: {
          rttMs: 150,
          throughputKbps: 1638.4,
          cpuSlowdownMultiplier: 4
        }
      }
    };
  }

  async runContinuousAuditing() {
    const criticalPages = [
      'https://example.com/',
      'https://example.com/product',
      'https://example.com/checkout',
      'https://example.com/dashboard'
    ];

    const results = await Promise.all(
      criticalPages.map(url => this.auditPage(url))
    );

    // Performance regression detection
    this.detectRegressions(results);

    // Budget enforcement
    this.enforcePerformanceBudgets(results);

    return results;
  }

  detectRegressions(results) {
    results.forEach(result => {
      const historical = this.getHistoricalBaseline(result.url);

      const regressions = [];

      // Check for significant regressions (>10% increase)
      Object.keys(result.metrics).forEach(metric => {
        const current = result.metrics[metric];
        const baseline = historical[metric];

        if (baseline && (current - baseline) / baseline > 0.1) {
          regressions.push({
            metric,
            current,
            baseline,
            regression: ((current - baseline) / baseline * 100).toFixed(2) + '%'
          });
        }
      });

      if (regressions.length > 0) {
        this.alertRegressions(result.url, regressions);
      }
    });
  }

  enforcePerformanceBudgets(results) {
    const budgets = {
      'first-contentful-paint': 2000,
      'largest-contentful-paint': 2500,
      'interactive': 5000,
      'speed-index': 4000
    };

    results.forEach(result => {
      const violations = [];

      Object.entries(budgets).forEach(([metric, budget]) => {
        if (result.metrics[metric] > budget) {
          violations.push({
            metric,
            actual: result.metrics[metric],
            budget,
            overage: result.metrics[metric] - budget
          });
        }
      });

      if (violations.length > 0) {
        // Block deployment if critical violations
        const criticalViolations = violations.filter(v =>
          v.overage > budgets[v.metric] * 0.2
        );

        if (criticalViolations.length > 0) {
          throw new Error(`Performance budget violations: ${JSON.stringify(criticalViolations)}`);
        }
      }
    });
  }
}
```


**Real User Monitoring (Production)**:


```javascript
class ProductionRUMCollector {
  constructor() {
    this.samplingRate = this.calculateSamplingRate();
    this.batchSize = 50;
    this.batchQueue = [];
    this.sessionData = this.initializeSession();
  }

  calculateSamplingRate() {
    // Smart sampling based on traffic volume
    const dailyUsers = this.getEstimatedDailyUsers();

    if (dailyUsers < 10000) return 1.0;      // 100% sampling for low traffic
    if (dailyUsers < 100000) return 0.5;     // 50% sampling for medium traffic
    if (dailyUsers < 1000000) return 0.1;    // 10% sampling for high traffic
    return 0.01;                             // 1% sampling for very high traffic
  }

  shouldSample(userId = null) {
    // Consistent sampling per user to avoid bias
    if (userId) {
      const hash = this.hashString(userId);
      return (hash % 100) < (this.samplingRate * 100);
    }

    return Math.random() < this.samplingRate;
  }

  collectCoreWebVitals() {
    // LCP Collection
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lcpEntry = entries[entries.length - 1];

      this.addMetric('lcp', {
        value: lcpEntry.startTime,
        element: lcpEntry.element?.tagName || 'unknown',
        url: lcpEntry.url || document.URL,
        timestamp: Date.now(),
        sessionId: this.sessionData.sessionId,
        userId: this.sessionData.userId
      });
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // FID Collection
    new PerformanceObserver((list) => {
      list.getEntries().forEach(entry => {
        this.addMetric('fid', {
          value: entry.processingStart - entry.startTime,
          eventType: entry.name,
          timestamp: Date.now(),
          sessionId: this.sessionData.sessionId
        });
      });
    }).observe({ entryTypes: ['first-input'] });

    // CLS Collection with session-based aggregation
    let clsValue = 0;
    let sessionEntries = [];

    new PerformanceObserver((list) => {
      list.getEntries().forEach(entry => {
        if (!entry.hadRecentInput) {
          const sessionEntry = sessionEntries.find(e =>
            entry.startTime - e.startTime < 1000 &&
            entry.startTime - sessionEntries[sessionEntries.length - 1]?.startTime < 5000
          );

          if (!sessionEntry) {
            sessionEntries.push({ startTime: entry.startTime, value: entry.value });
          } else {
            sessionEntry.value += entry.value;
          }

          clsValue = Math.max(...sessionEntries.map(e => e.value));
        }
      });

      this.addMetric('cls', {
        value: clsValue,
        timestamp: Date.now(),
        sessionId: this.sessionData.sessionId
      });
    }).observe({ entryTypes: ['layout-shift'] });
  }

  collectBusinessMetrics() {
    // Custom business-specific metrics
    this.trackUserJourney();
    this.trackConversionFunnels();
    this.trackErrorBoundaries();
  }

  trackUserJourney() {
    // Track key user interactions with performance context
    const userActions = ['click', 'submit', 'scroll', 'input'];

    userActions.forEach(actionType => {
      document.addEventListener(actionType, (event) => {
        const startTime = performance.now();

        // Measure response time for interactions
        requestAnimationFrame(() => {
          const responseTime = performance.now() - startTime;

          this.addMetric('user-interaction', {
            actionType,
            responseTime,
            element: event.target.tagName,
            elementId: event.target.id,
            timestamp: Date.now()
          });
        });
      }, { passive: true });
    });
  }

  collectContextualData() {
    return {
      // Device & Network Context
      connection: navigator.connection ? {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt,
        saveData: navigator.connection.saveData
      } : null,

      // Device Context
      deviceMemory: navigator.deviceMemory,
      hardwareConcurrency: navigator.hardwareConcurrency,

      // Viewport Context
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio,

      // User Context
      isLoggedIn: this.sessionData.userId !== null,
      userType: this.sessionData.userType,
      referrer: document.referrer,

      // Technical Context
      userAgent: navigator.userAgent,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  }
}
```


#### Hybrid Strategy Implementation:


```javascript
class HybridMonitoringOrchestrator {
  constructor() {
    this.syntheticMonitoring = new SyntheticMonitoringPipeline();
    this.rumCollector = new ProductionRUMCollector();
    this.alertingSystem = new AlertingSystem();
  }

  async initialize() {
    // Synthetic monitoring for baselines and regressions
    this.startContinuousSyntheticMonitoring();

    // RUM for real user experience
    if (this.rumCollector.shouldSample()) {
      this.rumCollector.startCollection();
    }

    // Cross-validate findings
    this.startCrossValidation();
  }

  startCrossValidation() {
    // Compare synthetic vs RUM data to identify discrepancies
    setInterval(async () => {
      const syntheticData = await this.getSyntheticBaselines();
      const rumData = await this.getRUMAggregates();

      this.validateDataConsistency(syntheticData, rumData);
    }, 3600000); // Every hour
  }

  validateDataConsistency(synthetic, rum) {
    const discrepancies = [];

    // Compare key metrics
    ['lcp', 'fid', 'cls'].forEach(metric => {
      const syntheticValue = synthetic[metric];
      const rumValue = rum[metric].p50; // Use median for comparison

      const discrepancy = Math.abs(syntheticValue - rumValue) / syntheticValue;

      if (discrepancy > 0.3) { // More than 30% difference
        discrepancies.push({
          metric,
          synthetic: syntheticValue,
          rum: rumValue,
          discrepancy: (discrepancy * 100).toFixed(2) + '%'
        });
      }
    });

    if (discrepancies.length > 0) {
      this.alertingSystem.sendAlert('data-discrepancy', {
        discrepancies,
        possibleCauses: [
          'Synthetic monitoring not representative of real users',
          'RUM sampling bias',
          'Network conditions difference',
          'User behavior variations'
        ]
      });
    }
  }
}
```


#### Key Trade-offs & Decision Framework:


**Synthetic Monitoring**:


- ✅ **Pros**: Consistent conditions, regression detection, CI/CD integration, detailed debugging
- ❌ **Cons**: Not representative of real users, limited scenarios, expensive to maintain
- **Best for**: Performance budgets, regression detection, competitive analysis


**Real User Monitoring**:


- ✅ **Pros**: Real user experience, comprehensive coverage, business correlation
- ❌ **Cons**: Sampling limitations, debugging difficulty, privacy concerns, performance impact
- **Best for**: Business metrics correlation, user experience insights, geographic analysis


**Hybrid Strategy Benefits**:


1. **Synthetic provides early warning** - Catch regressions before users do
2. **RUM validates real impact** - Understand actual user experience
3. **Cross-validation reduces false alarms** - Synthetic alerts validated by RUM trends
4. **Comprehensive coverage** - Different monitoring approaches catch different issues


**Interviewer**: Excellent comprehensive answer! Bạn clearly understand the complexities of monitoring at scale. Giờ tôi muốn test practical skills với một coding challenge.


---


## PHẦN 3: CODING CHALLENGE


**Interviewer**: Tôi sẽ give bạn một real-world scenario. Imagine you're building a performance monitoring library cho Meta's family of apps (Facebook, Instagram, WhatsApp). Library này cần:


1. **Track Core Web Vitals** với accurate measurement
2. **Handle multiple single-page applications** trong cùng một page
3. **Implement smart sampling** để minimize performance impact
4. **Support offline queue** cho network failures
5. **Provide real-time alerting** cho performance regressions


Bạn có thể live code solution không? Tôi sẽ ask follow-up questions trong quá trình coding.


**Candidate**: Absolutely! Đây là một complex system design challenge. Tôi sẽ build solution step by step. Let me start với **core architecture** và sau đó implement từng component.


```javascript
/**
 * MetaPerformanceMonitor - Enterprise Performance Monitoring Library
 * Designed for high-scale applications like Facebook/Instagram/WhatsApp
 */

class MetaPerformanceMonitor {
  constructor(config = {}) {
    this.config = this.mergeConfig(config);
    this.observers = new Map();
    this.metrics = new Map();
    this.offlineQueue = new OfflineQueueManager();
    this.sampler = new SmartSampler(this.config.sampling);
    this.alerting = new RealTimeAlerting(this.config.alerting);
    this.spaTracker = new SPANavigationTracker();

    this.isInitialized = false;
    this.currentPageId = this.generatePageId();

    // Bind methods to maintain context
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    this.handlePageUnload = this.handlePageUnload.bind(this);
  }

  mergeConfig(userConfig) {
    const defaultConfig = {
      apiEndpoint: '/api/performance-metrics',
      batchSize: 50,
      flushInterval: 30000, // 30 seconds
      maxQueueSize: 1000,

      sampling: {
        baseRate: 0.1, // 10% base sampling
        errorSampling: 1.0, // 100% error sampling
        slowSessionSampling: 0.5, // 50% for slow sessions
        adaptiveEnabled: true
      },

      alerting: {
        enabled: true,
        thresholds: {
          lcp: 2500, // 2.5 seconds
          fid: 100,  // 100ms
          cls: 0.1   // 0.1 cumulative layout shift
        },
        realTimeEnabled: true
      },

      spa: {
        trackHashChanges: true,
        trackStateChanges: true,
        debounceMs: 100
      },

      offline: {
        enabled: true,
        maxRetries: 3,
        retryDelay: 1000
      }
    };

    return this.deepMerge(defaultConfig, userConfig);
  }

  async initialize() {
    if (this.isInitialized) {
      console.warn('MetaPerformanceMonitor already initialized');
      return;
    }

    try {
      // Check if user should be sampled
      if (!this.sampler.shouldSample()) {
        console.log('User not sampled for performance monitoring');
        return;
      }

      // Initialize core components
      await Promise.all([
        this.initializePerformanceObservers(),
        this.initializeSPATracking(),
        this.initializeOfflineHandling(),
        this.initializeVisibilityTracking()
      ]);

      // Start data collection
      this.startMetricsCollection();

      this.isInitialized = true;
      console.log('MetaPerformanceMonitor initialized successfully');

    } catch (error) {
      console.error('Failed to initialize MetaPerformanceMonitor:', error);
      // Graceful degradation - don't break the main application
    }
  }

  async initializePerformanceObservers() {
    const observerConfigs = [
      {
        entryTypes: ['navigation'],
        callback: this.handleNavigationEntry.bind(this)
      },
      {
        entryTypes: ['paint'],
        callback: this.handlePaintEntry.bind(this)
      },
      {
        entryTypes: ['largest-contentful-paint'],
        callback: this.handleLCPEntry.bind(this)
      },
      {
        entryTypes: ['first-input'],
        callback: this.handleFIDEntry.bind(this)
      },
      {
        entryTypes: ['layout-shift'],
        callback: this.handleLayoutShiftEntry.bind(this)
      },
      {
        entryTypes: ['resource'],
        callback: this.handleResourceEntry.bind(this)
      },
      {
        entryTypes: ['longtask'],
        callback: this.handleLongTaskEntry.bind(this)
      }
    ];

    for (const config of observerConfigs) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach(config.callback);
        });

        observer.observe({ entryTypes: config.entryTypes });
        this.observers.set(config.entryTypes[0], observer);

      } catch (error) {
        console.warn(`Failed to initialize observer for ${config.entryTypes[0]}:`, error);
        // Continue with other observers
      }
    }
  }

  handleLCPEntry(entry) {
    const lcpData = {
      metric: 'lcp',
      value: entry.startTime,
      element: this.getElementSelector(entry.element),
      elementSize: entry.size,
      loadTime: entry.loadTime,
      renderTime: entry.renderTime,
      pageId: this.currentPageId,
      timestamp: Date.now(),
      url: entry.url || window.location.href
    };

    this.addMetric(lcpData);

    // Real-time alerting check
    if (this.config.alerting.realTimeEnabled) {
      this.alerting.checkThreshold('lcp', entry.startTime);
    }
  }

  handleFIDEntry(entry) {
    const fidValue = entry.processingStart - entry.startTime;

    const fidData = {
      metric: 'fid',
      value: fidValue,
      eventType: entry.name,
      startTime: entry.startTime,
      processingStart: entry.processingStart,
      processingEnd: entry.processingStart + entry.duration,
      pageId: this.currentPageId,
      timestamp: Date.now()
    };

    this.addMetric(fidData);

    // Check for slow interactions
    if (fidValue > this.config.alerting.thresholds.fid) {
      this.alerting.reportSlowInteraction(fidData);
    }
  }

  handleLayoutShiftEntry(entry) {
    // Aggregate CLS per session
    if (!entry.hadRecentInput) {
      this.aggregateCLS(entry);
    }
  }

  aggregateCLS(entry) {
    const sessionId = this.getOrCreateCLSSession(entry.startTime);

    if (!this.clsSessions) {
      this.clsSessions = new Map();
    }

    let session = this.clsSessions.get(sessionId);
    if (!session) {
      session = {
        value: 0,
        startTime: entry.startTime,
        entries: []
      };
      this.clsSessions.set(sessionId, session);
    }

    session.value += entry.value;
    session.entries.push(entry);

    // Report CLS when session ends or threshold exceeded
    if (session.value > this.config.alerting.thresholds.cls) {
      this.reportCLS(session);
    }
  }

  getOrCreateCLSSession(timestamp) {
    // CLS sessions are separated by gaps of more than 1 second
    // and capped at 5 seconds maximum length
    const sessionGap = 1000;
    const maxSessionLength = 5000;

    if (!this.lastCLSTime || timestamp - this.lastCLSTime > sessionGap) {
      this.currentCLSSessionId = this.generateSessionId();
      this.currentCLSSessionStart = timestamp;
    } else if (timestamp - this.currentCLSSessionStart > maxSessionLength) {
      this.currentCLSSessionId = this.generateSessionId();
      this.currentCLSSessionStart = timestamp;
    }

    this.lastCLSTime = timestamp;
    return this.currentCLSSessionId;
  }
}
```


**Interviewer**: Great start! Tôi thấy bạn có solid architecture. Giờ tôi muốn deep dive vào **Smart Sampling component**. Làm sao để ensure sampling không introduce bias nhưng vẫn minimize performance impact?


**Candidate**: Excellent question! Sampling bias là một huge challenge trong production monitoring. Let me implement **SmartSampler** với multiple strategies:


```javascript
class SmartSampler {
  constructor(config) {
    this.config = config;
    this.userSeed = this.generateUserSeed();
    this.sessionMetrics = new Map();
    this.adaptiveRates = new Map();

    // Initialize adaptive sampling
    if (config.adaptiveEnabled) {
      this.initializeAdaptiveSampling();
    }
  }

  shouldSample(context = {}) {
    const { userId, sessionId, metricType, isError } = context;

    // Always sample errors and critical issues
    if (isError || this.isCriticalMetric(metricType)) {
      return true;
    }

    // Use consistent user-based sampling to avoid bias
    const userSamplingRate = this.getUserSamplingRate(userId);
    if (!this.isUserSampled(userId, userSamplingRate)) {
      return false;
    }

    // Apply adaptive sampling based on current conditions
    if (this.config.adaptiveEnabled) {
      return this.adaptiveSampling(context);
    }

    return Math.random() < this.config.baseRate;
  }

  generateUserSeed() {
    // Create consistent seed for user-based sampling
    const userId = this.getUserId();
    if (userId) {
      return this.hashString(userId + 'meta-perf-sampling');
    }

    // Fallback to session-based sampling for anonymous users
    return this.hashString(this.getSessionId() + Date.now().toString());
  }

  hashString(str) {
    let hash = 0;
    if (str.length === 0) return hash;

    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return Math.abs(hash);
  }

  isUserSampled(userId, samplingRate) {
    const hash = this.hashString(userId || this.getSessionId());
    const bucket = hash % 10000; // 10000 buckets for fine-grained control
    return bucket < (samplingRate * 10000);
  }

  getUserSamplingRate(userId) {
    // Different sampling rates for different user segments
    const userSegment = this.getUserSegment(userId);

    const segmentRates = {
      'new-users': 0.5,      // 50% for new users (higher visibility)
      'power-users': 0.3,    // 30% for power users (they're more active)
      'enterprise': 1.0,     // 100% for enterprise users (SLA requirements)
      'internal': 1.0,       // 100% for internal users (debugging)
      'default': this.config.baseRate
    };

    return segmentRates[userSegment] || segmentRates['default'];
  }

  adaptiveSampling(context) {
    const { metricType, pageUrl, deviceType, networkCondition } = context;

    // Increase sampling for:
    // 1. Slow sessions (to understand performance issues better)
    // 2. New page types (to establish baselines)
    // 3. Poor network conditions (to understand real-world performance)
    // 4. Mobile devices (higher performance variance)

    let adaptiveRate = this.config.baseRate;

    // Slow session sampling
    if (this.isSlowSession()) {
      adaptiveRate = Math.min(adaptiveRate * 2, 1.0);
    }

    // New page sampling
    if (this.isNewPagePattern(pageUrl)) {
      adaptiveRate = Math.min(adaptiveRate * 1.5, 1.0);
    }

    // Network condition sampling
    if (this.isPoorNetworkCondition(networkCondition)) {
      adaptiveRate = Math.min(adaptiveRate * 2, 1.0);
    }

    // Mobile device sampling
    if (deviceType === 'mobile') {
      adaptiveRate = Math.min(adaptiveRate * 1.3, 1.0);
    }

    return Math.random() < adaptiveRate;
  }

  isSlowSession() {
    // Define slow session based on recent metrics
    const recentMetrics = this.getRecentSessionMetrics();

    return recentMetrics.some(metric => {
      switch (metric.type) {
        case 'lcp':
          return metric.value > 4000; // >4s LCP
        case 'fid':
          return metric.value > 300;  // >300ms FID
        case 'cls':
          return metric.value > 0.25; // >0.25 CLS
        default:
          return false;
      }
    });
  }

  isNewPagePattern(pageUrl) {
    // Check if we've seen this URL pattern recently
    const urlPattern = this.extractUrlPattern(pageUrl);
    const lastSeen = this.adaptiveRates.get(`pattern:${urlPattern}`);

    if (!lastSeen || Date.now() - lastSeen > 86400000) { // 24 hours
      this.adaptiveRates.set(`pattern:${urlPattern}`, Date.now());
      return true;
    }

    return false;
  }

  extractUrlPattern(url) {
    // Extract pattern from URL (remove IDs, query params)
    return url
      .replace(/\/\d+/g, '/:id')           // Replace numeric IDs
      .replace(/\?.*$/, '')                // Remove query params
      .replace(/\/[a-f0-9-]{36}/g, '/:uuid') // Replace UUIDs
      .replace(/\/[a-zA-Z0-9]{8,}/g, '/:token'); // Replace long tokens
  }

  isPoorNetworkCondition(networkCondition) {
    if (!networkCondition) return false;

    return networkCondition.effectiveType === 'slow-2g' ||
           networkCondition.effectiveType === '2g' ||
           (networkCondition.rtt && networkCondition.rtt > 300) ||
           (networkCondition.downlink && networkCondition.downlink < 0.5);
  }

  // Anti-bias mechanisms
  rotateSamplingBuckets() {
    // Periodically rotate sampling buckets to ensure different users
    // get sampled over time, reducing long-term bias
    setInterval(() => {
      this.samplingOffset = (this.samplingOffset || 0) + 1000;
      if (this.samplingOffset > 9000) {
        this.samplingOffset = 0;
      }
    }, 86400000); // Rotate daily
  }

  validateSamplingDistribution() {
    // Periodically check if sampling is representative
    const sampledUsers = this.getSampledUsersStats();
    const totalUsers = this.getTotalUsersStats();

    const biasMetrics = this.calculateSamplingBias(sampledUsers, totalUsers);

    if (biasMetrics.bias > 0.1) { // More than 10% bias
      console.warn('Sampling bias detected:', biasMetrics);
      this.adjustSamplingStrategy(biasMetrics);
    }
  }

  calculateSamplingBias(sampled, total) {
    const demographics = ['deviceType', 'networkType', 'geoLocation', 'userType'];
    const biasScores = [];

    demographics.forEach(demo => {
      const sampledDist = this.getDistribution(sampled, demo);
      const totalDist = this.getDistribution(total, demo);

      const kl_divergence = this.calculateKLDivergence(sampledDist, totalDist);
      biasScores.push(kl_divergence);
    });

    return {
      bias: Math.max(...biasScores),
      demographics: biasScores,
      timestamp: Date.now()
    };
  }
}
```


**Interviewer**: Impressive bias-aware sampling strategy! Giờ tôi muốn test edge case handling. What happens khi user navigates between SPAs hoặc khi network connection drops trong data collection?


**Candidate**: Great edge case questions! Let me implement **SPANavigationTracker** và **OfflineQueueManager** to handle these scenarios:


```javascript
class SPANavigationTracker {
  constructor(config) {
    this.config = config;
    this.navigationHistory = [];
    this.currentPageMetrics = new Map();
    this.routeChangeListeners = new Set();

    // Track different types of navigation
    this.initializeNavigationTracking();
  }

  initializeNavigationTracking() {
    // History API changes (pushState/replaceState)
    this.wrapHistoryAPI();

    // Hash changes
    if (this.config.trackHashChanges) {
      window.addEventListener('hashchange', this.handleHashChange.bind(this));
    }

    // Popstate events (back/forward)
    window.addEventListener('popstate', this.handlePopState.bind(this));

    // DOM changes that might indicate route changes
    this.observeRouteChanges();
  }

  wrapHistoryAPI() {
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    const self = this;

    history.pushState = function(...args) {
      const result = originalPushState.apply(this, args);
      self.handleRouteChange('pushstate', args[2] || window.location.href);
      return result;
    };

    history.replaceState = function(...args) {
      const result = originalReplaceState.apply(this, args);
      self.handleRouteChange('replacestate', args[2] || window.location.href);
      return result;
    };
  }

  handleRouteChange(type, newUrl) {
    const previousPage = this.getCurrentPage();
    const newPage = {
      url: newUrl,
      timestamp: performance.now(),
      navigationType: type,
      pageId: this.generatePageId()
    };

    // Finalize metrics for previous page
    if (previousPage) {
      this.finalizePageMetrics(previousPage);
    }

    // Start tracking new page
    this.startNewPageTracking(newPage);

    // Debounced execution to handle rapid route changes
    this.debounce(() => {
      this.notifyRouteChange(previousPage, newPage);
    }, this.config.debounceMs);
  }

  finalizePageMetrics(page) {
    const pageMetrics = this.currentPageMetrics.get(page.pageId);
    if (!pageMetrics) return;

    const timeOnPage = performance.now() - page.timestamp;

    // Calculate page-specific metrics
    const finalMetrics = {
      ...pageMetrics,
      timeOnPage,
      finalUrl: window.location.href,
      exitType: this.detectExitType(),
      interactionCount: this.getInteractionCount(page.pageId),
      scrollDepth: this.getMaxScrollDepth(page.pageId),
      bounced: timeOnPage < 10000 && this.getInteractionCount(page.pageId) === 0
    };

    // Report page completion
    this.reportPageMetrics(page, finalMetrics);

    // Clean up
    this.currentPageMetrics.delete(page.pageId);
  }

  startNewPageTracking(page) {
    this.navigationHistory.push(page);
    this.currentPageMetrics.set(page.pageId, {
      startTime: page.timestamp,
      metrics: new Map(),
      interactions: [],
      scrollEvents: []
    });

    // Reset Core Web Vitals observers for new page
    this.resetCoreWebVitalsForNewPage(page.pageId);

    // Start new performance measurements
    this.startPagePerformanceMeasurement(page);
  }

  resetCoreWebVitalsForNewPage(pageId) {
    // For SPAs, we need to manually track when "meaningful" navigation happens
    // Reset LCP tracking for new page content
    this.resetLCPTracking(pageId);

    // Reset FID (though it's per-session, we track per-page for SPA)
    this.resetFIDTracking(pageId);

    // Reset CLS (new layout should start fresh)
    this.resetCLSTracking(pageId);
  }

  resetLCPTracking(pageId) {
    // Mark current LCP as final for previous page
    if (this.currentLCPObserver) {
      this.currentLCPObserver.disconnect();
    }

    // Create new LCP observer for this page
    this.currentLCPObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lcpEntry = entries[entries.length - 1];

      // Only count LCP after route change
      if (lcpEntry.startTime > (this.getPageStartTime(pageId) || 0)) {
        this.recordPageMetric(pageId, 'lcp', {
          value: lcpEntry.startTime - this.getPageStartTime(pageId),
          element: this.getElementSelector(lcpEntry.element),
          url: lcpEntry.url
        });
      }
    });

    this.currentLCPObserver.observe({ entryTypes: ['largest-contentful-paint'] });
  }

  observeRouteChanges() {
    // Watch for DOM changes that might indicate route changes
    const observer = new MutationObserver((mutations) => {
      let significantChange = false;

      mutations.forEach(mutation => {
        // Check for title changes
        if (mutation.target.tagName === 'TITLE') {
          significantChange = true;
        }

        // Check for large DOM changes (might indicate new page content)
        if (mutation.addedNodes.length > 5 || mutation.removedNodes.length > 5) {
          significantChange = true;
        }

        // Check for main content area changes
        if (this.isMainContentArea(mutation.target)) {
          significantChange = true;
        }
      });

      if (significantChange) {
        this.handlePotentialRouteChange();
      }
    });

    observer.observe(document, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-route', 'id', 'class']
    });
  }

  handlePotentialRouteChange() {
    const currentUrl = window.location.href;
    const lastRecordedUrl = this.getLastRecordedUrl();

    if (currentUrl !== lastRecordedUrl) {
      this.handleRouteChange('dom-change', currentUrl);
    }
  }
}

class OfflineQueueManager {
  constructor(config) {
    this.config = config;
    this.queue = this.loadQueueFromStorage();
    this.isOnline = navigator.onLine;
    this.retryAttempts = new Map();
    this.processingQueue = false;

    this.initializeNetworkListeners();
    this.startQueueProcessor();
  }

  initializeNetworkListeners() {
    window.addEventListener('online', () => {
      console.log('Network connection restored');
      this.isOnline = true;
      this.processQueueWhenOnline();
    });

    window.addEventListener('offline', () => {
      console.log('Network connection lost');
      this.isOnline = false;
    });

    // Also monitor fetch failures to detect connectivity issues
    this.wrapFetch();
  }

  wrapFetch() {
    const originalFetch = window.fetch;
    const self = this;

    window.fetch = async function(url, options) {
      try {
        const response = await originalFetch.apply(this, arguments);

        // If fetch succeeds but we thought we were offline, update status
        if (!self.isOnline && response.ok) {
          self.isOnline = true;
          self.processQueueWhenOnline();
        }

        return response;
      } catch (error) {
        // Network error might indicate offline status
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
          self.isOnline = false;
        }
        throw error;
      }
    };
  }

  addToQueue(data, priority = 'normal') {
    const queueItem = {
      id: this.generateId(),
      data,
      priority,
      timestamp: Date.now(),
      attempts: 0,
      maxRetries: this.config.maxRetries
    };

    // Add based on priority
    if (priority === 'high') {
      this.queue.unshift(queueItem);
    } else {
      this.queue.push(queueItem);
    }

    // Limit queue size
    if (this.queue.length > this.config.maxQueueSize) {
      // Remove oldest normal priority items
      this.queue = this.queue.filter((item, index) =>
        item.priority === 'high' || index < this.config.maxQueueSize
      );
    }

    this.saveQueueToStorage();

    // Try to send immediately if online
    if (this.isOnline) {
      this.processQueue();
    }
  }

  async processQueue() {
    if (this.processingQueue || !this.isOnline || this.queue.length === 0) {
      return;
    }

    this.processingQueue = true;

    try {
      const batchSize = Math.min(10, this.queue.length);
      const batch = this.queue.splice(0, batchSize);

      // Process batch with retry logic
      const results = await Promise.allSettled(
        batch.map(item => this.sendMetric(item))
      );

      // Handle failures
      results.forEach((result, index) => {
        const item = batch[index];

        if (result.status === 'rejected') {
          item.attempts++;

          if (item.attempts < item.maxRetries) {
            // Re-add to queue with exponential backoff
            setTimeout(() => {
              if (item.priority === 'high') {
                this.queue.unshift(item);
              } else {
                this.queue.push(item);
              }
              this.saveQueueToStorage();
            }, this.calculateBackoffDelay(item.attempts));
          } else {
            console.warn('Max retries exceeded for metric:', item.id);
            this.handleFailedMetric(item, result.reason);
          }
        }
      });

      this.saveQueueToStorage();

      // Continue processing if more items in queue
      if (this.queue.length > 0) {
        setTimeout(() => this.processQueue(), 100);
      }

    } catch (error) {
      console.error('Error processing queue:', error);
    } finally {
      this.processingQueue = false;
    }
  }

  async sendMetric(item) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

    try {
      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Retry-Attempt': item.attempts.toString()
        },
        body: JSON.stringify({
          ...item.data,
          queuedAt: item.timestamp,
          sentAt: Date.now()
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response.json();

    } catch (error) {
      clearTimeout(timeoutId);

      // Classify error types for different retry strategies
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      } else if (error.message.includes('HTTP 5')) {
        throw new Error('Server error - will retry');
      } else if (error.message.includes('HTTP 4')) {
        // Client errors usually shouldn't be retried
        item.maxRetries = 0;
        throw new Error('Client error - will not retry');
      }

      throw error;
    }
  }

  calculateBackoffDelay(attempt) {
    // Exponential backoff with jitter
    const baseDelay = this.config.retryDelay;
    const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 1000; // Add random jitter

    return Math.min(exponentialDelay + jitter, 30000); // Max 30s delay
  }

  handleFailedMetric(item, error) {
    // Log failed metrics for debugging
    console.error('Failed to send metric after max retries:', {
      metricId: item.id,
      error: error.message,
      attempts: item.attempts,
      data: item.data
    });

    // Could implement additional failure handling:
    // - Send to alternative endpoint
    // - Store in IndexedDB for later analysis
    // - Send simplified error report
  }

  loadQueueFromStorage() {
    try {
      const stored = localStorage.getItem('meta-perf-queue');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('Failed to load queue from storage:', error);
      return [];
    }
  }

  saveQueueToStorage() {
    try {
      localStorage.setItem('meta-perf-queue', JSON.stringify(this.queue));
    } catch (error) {
      console.warn('Failed to save queue to storage:', error);
      // Could implement IndexedDB fallback here
    }
  }

  // Cleanup old queue items periodically
  cleanupQueue() {
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    const now = Date.now();

    this.queue = this.queue.filter(item =>
      (now - item.timestamp) < maxAge
    );

    this.saveQueueToStorage();
  }

  processQueueWhenOnline() {
    if (this.isOnline && this.queue.length > 0) {
      console.log(`Processing ${this.queue.length} queued metrics`);
      this.processQueue();
    }
  }

  startQueueProcessor() {
    // Process queue periodically
    setInterval(() => {
      if (this.isOnline) {
        this.processQueue();
      }
    }, 30000); // Every 30 seconds

    // Cleanup old items
    setInterval(() => {
      this.cleanupQueue();
    }, 3600000); // Every hour
  }

  getQueueStatus() {
    return {
      isOnline: this.isOnline,
      queueLength: this.queue.length,
      processingQueue: this.processingQueue,
      priorityBreakdown: {
        high: this.queue.filter(item => item.priority === 'high').length,
        normal: this.queue.filter(item => item.priority === 'normal').length
      }
    };
  }
}
```


**Interviewer**: Excellent robust implementation! Cuối cùng, tôi muốn hỏi về **Real-time Alerting System**. Trong production environment như Meta scale, làm sao để detect performance regressions trong real-time mà không tạo ra false alarms?


**Candidate**: Đây là probably the most challenging part! Real-time alerting tại Meta scale requires **sophisticated statistical analysis** và **intelligent anomaly detection**. Let me implement comprehensive solution:


```javascript
class RealTimeAlerting {
  constructor(config) {
    this.config = config;
    this.baseline = new BaselineManager();
    this.anomalyDetector = new AnomalyDetector();
    this.alertBuffer = new CircularBuffer(100); // Store recent alerts
    this.suppressionRules = new AlertSuppressionManager();

    // Statistical tracking for each metric
    this.metricStats = new Map();
    this.rollingWindows = new Map();

    this.initializeBaselines();
  }

  async initializeBaselines() {
    // Load historical baselines from server
    try {
      const baselines = await this.fetchBaselines();
      this.baseline.initialize(baselines);
    } catch (error) {
      console.warn('Failed to load baselines, using defaults:', error);
      this.baseline.initializeDefaults();
    }

    // Start baseline updating process
    this.startBaselineUpdates();
  }

  checkThreshold(metricType, value, context = {}) {
    const timestamp = Date.now();

    // Update rolling statistics
    this.updateRollingStats(metricType, value, timestamp);

    // Get current baseline and thresholds
    const baseline = this.baseline.getBaseline(metricType, context);
    const thresholds = this.calculateDynamicThresholds(metricType, baseline);

    // Multi-level anomaly detection
    const anomalyResult = this.anomalyDetector.analyze({
      metricType,
      value,
      baseline,
      thresholds,
      context,
      recentHistory: this.getRollingWindow(metricType)
    });

    if (anomalyResult.isAnomaly) {
      this.processAlert(metricType, value, anomalyResult, context);
    }
  }

  calculateDynamicThresholds(metricType, baseline) {
    const rollingStats = this.metricStats.get(metricType);

    if (!rollingStats || rollingStats.count < 30) {
      // Not enough data, use static thresholds
      return this.config.thresholds;
    }

    // Calculate statistical thresholds based on recent data
    const mean = rollingStats.mean;
    const stdDev = rollingStats.standardDeviation;

    // Different threshold strategies for different metrics
    switch (metricType) {
      case 'lcp':
        return {
          warning: Math.max(mean + 2 * stdDev, baseline.p95),
          critical: Math.max(mean + 3 * stdDev, baseline.p99),
          severe: Math.max(mean + 4 * stdDev, this.config.thresholds.lcp)
        };

      case 'fid':
        return {
          warning: Math.max(mean + 2 * stdDev, baseline.p90),
          critical: Math.max(mean + 3 * stdDev, baseline.p95),
          severe: Math.max(mean + 4 * stdDev, this.config.thresholds.fid)
        };

      case 'cls':
        return {
          warning: Math.max(mean + 2 * stdDev, baseline.p90),
          critical: Math.max(mean + 3 * stdDev, baseline.p95),
          severe: Math.max(mean + 4 * stdDev, this.config.thresholds.cls)
        };

      default:
        return this.config.thresholds;
    }
  }

  updateRollingStats(metricType, value, timestamp) {
    if (!this.metricStats.has(metricType)) {
      this.metricStats.set(metricType, {
        count: 0,
        sum: 0,
        sumSquared: 0,
        mean: 0,
        variance: 0,
        standardDeviation: 0,
        min: Infinity,
        max: -Infinity,
        recentValues: new CircularBuffer(1000)
      });
    }

    const stats = this.metricStats.get(metricType);

    // Update basic statistics
    stats.count++;
    stats.sum += value;
    stats.sumSquared += value * value;
    stats.mean = stats.sum / stats.count;
    stats.variance = (stats.sumSquared / stats.count) - (stats.mean * stats.mean);
    stats.standardDeviation = Math.sqrt(stats.variance);
    stats.min = Math.min(stats.min, value);
    stats.max = Math.max(stats.max, value);

    // Update rolling window
    stats.recentValues.add({
      value,
      timestamp
    });

    // Update rolling window for time-based analysis
    this.updateRollingWindow(metricType, value, timestamp);
  }

  updateRollingWindow(metricType, value, timestamp) {
    if (!this.rollingWindows.has(metricType)) {
      this.rollingWindows.set(metricType, new Map());
    }

    const windows = this.rollingWindows.get(metricType);

    // Different window sizes for different analysis
    const windowSizes = [
      { name: '1min', duration: 60 * 1000 },
      { name: '5min', duration: 5 * 60 * 1000 },
      { name: '15min', duration: 15 * 60 * 1000 },
      { name: '1hour', duration: 60 * 60 * 1000 }
    ];

    windowSizes.forEach(({ name, duration }) => {
      if (!windows.has(name)) {
        windows.set(name, new CircularBuffer(1000));
      }

      const window = windows.get(name);
      window.add({ value, timestamp });

      // Clean old entries
      window.removeOlderThan(timestamp - duration);
    });
  }

  getRollingWindow(metricType, windowName = '5min') {
    const windows = this.rollingWindows.get(metricType);
    if (!windows) return [];

    const window = windows.get(windowName);
    return window ? window.getAll() : [];
  }

  processAlert(metricType, value, anomalyResult, context) {
    const alert = {
      id: this.generateAlertId(),
      timestamp: Date.now(),
      metricType,
      value,
      severity: anomalyResult.severity,
      confidence: anomalyResult.confidence,
      context,
      anomalyDetails: anomalyResult.details,
      baseline: anomalyResult.baseline
    };

    // Apply suppression rules to prevent alert spam
    if (this.suppressionRules.shouldSuppress(alert)) {
      console.log('Alert suppressed:', alert.id);
      return;
    }

    // Add to alert buffer
    this.alertBuffer.add(alert);

    // Send alert based on severity
    this.sendAlert(alert);

    // Update suppression rules
    this.suppressionRules.recordAlert(alert);
  }

  async sendAlert(alert) {
    const alertPayload = {
      ...alert,
      additionalContext: this.gatherAdditionalContext(alert),
      suggestedActions: this.generateSuggestedActions(alert),
      relatedMetrics: this.getRelatedMetrics(alert)
    };

    // Different delivery methods based on severity
    switch (alert.severity) {
      case 'severe':
        await this.sendImmediateAlert(alertPayload);
        await this.sendSlackAlert(alertPayload);
        await this.sendEmailAlert(alertPayload);
        break;

      case 'critical':
        await this.sendSlackAlert(alertPayload);
        await this.sendEmailAlert(alertPayload);
        break;

      case 'warning':
        await this.sendSlackAlert(alertPayload);
        break;
    }

    // Always log to monitoring dashboard
    await this.logToDashboard(alertPayload);
  }

  gatherAdditionalContext(alert) {
    return {
      // Recent performance trends
      recentTrends: this.getRecentTrends(alert.metricType),

      // Concurrent alerts
      concurrentAlerts: this.getRecentAlerts(5 * 60 * 1000), // Last 5 minutes

      // System context
      systemContext: {
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        connection: this.getConnectionInfo(),
        performanceTiming: this.getPerformanceTiming()
      },

      // Business context
      businessContext: alert.context,

      // Statistical context
      statisticalContext: {
        recentSamples: this.getRollingWindow(alert.metricType, '1min').length,
        percentileRanking: this.calculatePercentileRanking(alert.metricType, alert.value)
      }
    };
  }

  generateSuggestedActions(alert) {
    const actions = [];

    switch (alert.metricType) {
      case 'lcp':
        if (alert.value > 4000) {
          actions.push('Check for large images or resources blocking render');
          actions.push('Investigate server response times');
          actions.push('Review critical resource loading order');
        }
        break;

      case 'fid':
        if (alert.value > 300) {
          actions.push('Check for long-running JavaScript tasks');
          actions.push('Review event handler efficiency');
          actions.push('Consider code splitting for large bundles');
        }
        break;

      case 'cls':
        if (alert.value > 0.25) {
          actions.push('Check for dynamic content insertions');
          actions.push('Review image and ad loading patterns');
          actions.push('Investigate font loading strategies');
        }
        break;
    }

    // Add generic actions
    actions.push('Check recent deployments for correlations');
    actions.push('Review error logs for related issues');

    return actions;
  }

  getRelatedMetrics(alert) {
    // Find other metrics that might be related to this alert
    const timeWindow = 10 * 60 * 1000; // 10 minutes
    const alertTime = alert.timestamp;

    const relatedMetrics = [];

    this.metricStats.forEach((stats, metricType) => {
      if (metricType === alert.metricType) return;

      const recentValues = stats.recentValues.getAll()
        .filter(item => Math.abs(item.timestamp - alertTime) < timeWindow);

      if (recentValues.length > 0) {
        const avgValue = recentValues.reduce((sum, item) => sum + item.value, 0) / recentValues.length;
        const baseline = this.baseline.getBaseline(metricType);

        relatedMetrics.push({
          metricType,
          averageValue: avgValue,
          baseline: baseline.median,
          deviation: ((avgValue - baseline.median) / baseline.median * 100).toFixed(2) + '%',
          sampleSize: recentValues.length
        });
      }
    });

    return relatedMetrics;
  }
}

class AnomalyDetector {
  analyze({ metricType, value, baseline, thresholds, context, recentHistory }) {
    const analyses = [
      this.thresholdAnalysis(value, thresholds),
      this.statisticalAnalysis(value, baseline, recentHistory),
      this.trendAnalysis(recentHistory),
      this.contextualAnalysis(value, context, baseline)
    ];

    // Combine results from different analysis methods
    const combinedResult = this.combineAnalyses(analyses);

    return {
      isAnomaly: combinedResult.isAnomaly,
      severity: combinedResult.severity,
      confidence: combinedResult.confidence,
      details: combinedResult.details,
      baseline
    };
  }

  thresholdAnalysis(value, thresholds) {
    if (value > thresholds.severe) {
      return {
        method: 'threshold',
        isAnomaly: true,
        severity: 'severe',
        confidence: 0.9,
        reason: `Value ${value} exceeds severe threshold ${thresholds.severe}`
      };
    } else if (value > thresholds.critical) {
      return {
        method: 'threshold',
        isAnomaly: true,
        severity: 'critical',
        confidence: 0.8,
        reason: `Value ${value} exceeds critical threshold ${thresholds.critical}`
      };
    } else if (value > thresholds.warning) {
      return {
        method: 'threshold',
        isAnomaly: true,
        severity: 'warning',
        confidence: 0.7,
        reason: `Value ${value} exceeds warning threshold ${thresholds.warning}`
      };
    }

    return {
      method: 'threshold',
      isAnomaly: false,
      severity: 'normal',
      confidence: 0.9
    };
  }

  statisticalAnalysis(value, baseline, recentHistory) {
    if (recentHistory.length < 10) {
      return { method: 'statistical', isAnomaly: false, confidence: 0.3 };
    }

    const recentValues = recentHistory.map(item => item.value);
    const mean = recentValues.reduce((sum, val) => sum + val, 0) / recentValues.length;
    const variance = recentValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / recentValues.length;
    const stdDev = Math.sqrt(variance);

    // Z-score analysis
    const zScore = Math.abs((value - mean) / stdDev);

    if (zScore > 3) {
      return {
        method: 'statistical',
        isAnomaly: true,
        severity: 'critical',
        confidence: 0.95,
        reason: `Z-score ${zScore.toFixed(2)} indicates significant deviation`,
        zScore
      };
    } else if (zScore > 2.5) {
      return {
        method: 'statistical',
        isAnomaly: true,
        severity: 'warning',
        confidence: 0.8,
        reason: `Z-score ${zScore.toFixed(2)} indicates moderate deviation`,
        zScore
      };
    }

    return {
      method: 'statistical',
      isAnomaly: false,
      confidence: 0.7,
      zScore
    };
  }

  trendAnalysis(recentHistory) {
    if (recentHistory.length < 20) {
      return { method: 'trend', isAnomaly: false, confidence: 0.3 };
    }

    // Simple linear regression to detect trends
    const values = recentHistory.map(item => item.value);
    const n = values.length;
    const indices = Array.from({ length: n }, (_, i) => i);

    const sumX = indices.reduce((sum, val) => sum + val, 0);
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = indices.reduce((sum, val, i) => sum + val * values[i], 0);
    const sumXX = indices.reduce((sum, val) => sum + val * val, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate R-squared to measure trend strength
    const meanY = sumY / n;
    const totalSumSquares = values.reduce((sum, val) => sum + Math.pow(val - meanY, 2), 0);
    const residualSumSquares = values.reduce((sum, val, i) => {
      const predicted = slope * i + intercept;
      return sum + Math.pow(val - predicted, 2);
    }, 0);

    const rSquared = 1 - (residualSumSquares / totalSumSquares);

    // Detect significant upward trends
    if (rSquared > 0.7 && slope > 0) {
      const relativeSlope = slope / meanY;

      if (relativeSlope > 0.1) { // 10% increase trend
        return {
          method: 'trend',
          isAnomaly: true,
          severity: 'warning',
          confidence: rSquared,
          reason: `Upward trend detected with slope ${slope.toFixed(2)}`,
          slope,
          rSquared
        };
      }
    }

    return {
      method: 'trend',
      isAnomaly: false,
      confidence: rSquared,
      slope,
      rSquared
    };
  }

  contextualAnalysis(value, context, baseline) {
    // Adjust expectations based on context
    let adjustedBaseline = baseline.median;
    let contextMultiplier = 1.0;

    // Network conditions
    if (context.networkCondition) {
      if (context.networkCondition.effectiveType === 'slow-2g') {
        contextMultiplier *= 3.0; // Expect 3x slower performance
      } else if (context.networkCondition.effectiveType === '2g') {
        contextMultiplier *= 2.0;
      } else if (context.networkCondition.effectiveType === '3g') {
        contextMultiplier *= 1.5;
      }
    }

    // Device type
    if (context.deviceType === 'mobile') {
      contextMultiplier *= 1.3; // Mobile typically 30% slower
    }

    // Time of day (peak hours might be slower)
    const hour = new Date().getHours();
    if (hour >= 9 && hour <= 17) { // Business hours
      contextMultiplier *= 1.2;
    }

    adjustedBaseline *= contextMultiplier;

    const deviation = (value - adjustedBaseline) / adjustedBaseline;

    if (deviation > 1.0) { // 100% worse than expected
      return {
        method: 'contextual',
        isAnomaly: true,
        severity: 'critical',
        confidence: 0.8,
        reason: `Value ${value} is ${(deviation * 100).toFixed(0)}% worse than context-adjusted baseline ${adjustedBaseline.toFixed(0)}`,
        contextMultiplier,
        adjustedBaseline
      };
    } else if (deviation > 0.5) { // 50% worse than expected
      return {
        method: 'contextual',
        isAnomaly: true,
        severity: 'warning',
        confidence: 0.7,
        reason: `Value ${value} is ${(deviation * 100).toFixed(0)}% worse than context-adjusted baseline`,
        contextMultiplier,
        adjustedBaseline
      };
    }

    return {
      method: 'contextual',
      isAnomaly: false,
      confidence: 0.6,
      deviation,
      contextMultiplier
    };
  }

  combineAnalyses(analyses) {
    const anomalies = analyses.filter(analysis => analysis.isAnomaly);

    if (anomalies.length === 0) {
      return {
        isAnomaly: false,
        severity: 'normal',
        confidence: Math.max(...analyses.map(a => a.confidence)),
        details: analyses
      };
    }

    // Weighted severity calculation
    const severityWeights = { 'severe': 4, 'critical': 3, 'warning': 2, 'normal': 1 };
    const weightedSeverity = anomalies.reduce((sum, analysis) => {
      return sum + severityWeights[analysis.severity] * analysis.confidence;
    }, 0) / anomalies.reduce((sum, analysis) => sum + analysis.confidence, 0);

    let finalSeverity = 'warning';
    if (weightedSeverity >= 3.5) {
      finalSeverity = 'severe';
    } else if (weightedSeverity >= 2.5) {
      finalSeverity = 'critical';
    }

    // Combined confidence (average of anomalous analyses)
    const combinedConfidence = anomalies.reduce((sum, analysis) => sum + analysis.confidence, 0) / anomalies.length;

    return {
      isAnomaly: true,
      severity: finalSeverity,
      confidence: combinedConfidence,
      details: analyses,
      anomalyCount: anomalies.length,
      consensusStrength: anomalies.length / analyses.length
    };
  }
}

class AlertSuppressionManager {
  constructor() {
    this.recentAlerts = new CircularBuffer(1000);
    this.suppressionRules = new Map();

    this.initializeSuppressionRules();
  }

  initializeSuppressionRules() {
    // Don't send same alert type more than once per 5 minutes
    this.suppressionRules.set('duplicate', {
      windowMs: 5 * 60 * 1000,
      maxCount: 1
    });

    // Limit total alerts to 10 per minute
    this.suppressionRules.set('rateLimit', {
      windowMs: 60 * 1000,
      maxCount: 10
    });

    // Don't send low-confidence alerts if high-confidence alert exists
    this.suppressionRules.set('confidence', {
      minConfidence: 0.7
    });
  }

  shouldSuppress(alert) {
    // Check each suppression rule
    for (const [ruleType, rule] of this.suppressionRules) {
      if (this.checkSuppressionRule(alert, ruleType, rule)) {
        return true;
      }
    }

    return false;
  }

  checkSuppressionRule(alert, ruleType, rule) {
    const now = alert.timestamp;

    switch (ruleType) {
      case 'duplicate':
        return this.checkDuplicateRule(alert, rule, now);
      case 'rateLimit':
        return this.checkRateLimitRule(alert, rule, now);
      case 'confidence':
        return this.checkConfidenceRule(alert, rule);
      default:
        return false;
    }
  }

  checkDuplicateRule(alert, rule, now) {
    const recentSimilarAlerts = this.recentAlerts.getAll()
      .filter(recentAlert =>
        recentAlert.metricType === alert.metricType &&
        recentAlert.severity === alert.severity &&
        (now - recentAlert.timestamp) < rule.windowMs
      );

    return recentSimilarAlerts.length >= rule.maxCount;
  }

  checkRateLimitRule(alert, rule, now) {
    const recentAlerts = this.recentAlerts.getAll()
      .filter(recentAlert => (now - recentAlert.timestamp) < rule.windowMs);

    return recentAlerts.length >= rule.maxCount;
  }

  checkConfidenceRule(alert, rule) {
    return alert.confidence < rule.minConfidence;
  }

  recordAlert(alert) {
    this.recentAlerts.add(alert);
  }
}

// Utility class for fixed-size circular buffer
class CircularBuffer {
  constructor(size) {
    this.size = size;
    this.buffer = [];
    this.index = 0;
  }

  add(item) {
    if (this.buffer.length < this.size) {
      this.buffer.push(item);
    } else {
      this.buffer[this.index] = item;
      this.index = (this.index + 1) % this.size;
    }
  }

  getAll() {
    if (this.buffer.length < this.size) {
      return this.buffer.slice();
    }

    return [
      ...this.buffer.slice(this.index),
      ...this.buffer.slice(0, this.index)
    ];
  }

  removeOlderThan(timestamp) {
    this.buffer = this.buffer.filter(item => item.timestamp >= timestamp);
    this.index = 0;
  }
}
```


**Interviewer**: Outstanding implementation! Bạn đã demonstrate comprehensive understanding of performance monitoring at enterprise scale. Before we wrap up, tôi có một cuối cùng question: **How would you validate and test this monitoring system** to ensure it's working correctly in production?


**Candidate**: Excellent final question! Validating a monitoring system là critical vì chúng ta monitor the monitors. Let me outline comprehensive testing strategy:


```javascript
class MonitoringSystemValidator {
  constructor(monitor) {
    this.monitor = monitor;
    this.testSuites = new Map();
    this.validationMetrics = new Map();

    this.initializeTestSuites();
  }

  initializeTestSuites() {
    // 1. Accuracy Testing
    this.testSuites.set('accuracy', new AccuracyTestSuite());

    // 2. Performance Impact Testing
    this.testSuites.set('performance', new PerformanceImpactTestSuite());

    // 3. Edge Case Testing
    this.testSuites.set('edgeCases', new EdgeCaseTestSuite());

    // 4. Integration Testing
    this.testSuites.set('integration', new IntegrationTestSuite());

    // 5. Load Testing
    this.testSuites.set('load', new LoadTestSuite());
  }

  async runFullValidation() {
    const results = new Map();

    for (const [suiteName, testSuite] of this.testSuites) {
      console.log(`Running ${suiteName} test suite...`);

      try {
        const suiteResults = await testSuite.run(this.monitor);
        results.set(suiteName, suiteResults);

        console.log(`${suiteName} tests completed:`, suiteResults.summary);
      } catch (error) {
        console.error(`${suiteName} test suite failed:`, error);
        results.set(suiteName, { error: error.message, passed: false });
      }
    }

    return this.generateValidationReport(results);
  }
}

class AccuracyTestSuite {
  async run(monitor) {
    const tests = [
      this.testCoreWebVitalsAccuracy(),
      this.testSyntheticVsRUMCorrelation(),
      this.testBaselineConsistency(),
      this.testCross-browserConsistency()
    ];

    const results = await Promise.all(tests);

    return {
      passed: results.every(r => r.passed),
      summary: results,
      accuracy: this.calculateOverallAccuracy(results)
    };
  }

  async testCoreWebVitalsAccuracy() {
    // Create controlled scenarios to validate Core Web Vitals measurement
    const scenarios = [
      {
        name: 'Fast LCP',
        setup: () => this.createFastLoadingPage(),
        expectedLCP: { min: 500, max: 1500 }
      },
      {
        name: 'Slow LCP',
        setup: () => this.createSlowLoadingPage(),
        expectedLCP: { min: 3000, max: 5000 }
      },
      {
        name: 'Good FID',
        setup: () => this.createResponsivePage(),
        expectedFID: { min: 0, max: 100 }
      },
      {
        name: 'Poor FID',
        setup: () => this.createUnresponsivePage(),
        expectedFID: { min: 200, max: 500 }
      }
    ];

    const testResults = [];

    for (const scenario of scenarios) {
      const iframe = await scenario.setup();
      const measuredMetrics = await this.measureMetricsInIframe(iframe, monitor);

      const accuracy = this.validateMetricAccuracy(
        measuredMetrics,
        scenario.expectedLCP || scenario.expectedFID
      );

      testResults.push({
        scenario: scenario.name,
        accuracy,
        measured: measuredMetrics,
        expected: scenario.expectedLCP || scenario.expectedFID
      });

      // Cleanup
      document.body.removeChild(iframe);
    }

    return {
      passed: testResults.every(r => r.accuracy > 0.8),
      details: testResults,
      averageAccuracy: testResults.reduce((sum, r) => sum + r.accuracy, 0) / testResults.length
    };
  }

  async createFastLoadingPage() {
    const iframe = document.createElement('iframe');
    iframe.style.width = '800px';
    iframe.style.height = '600px';

    const fastHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          .hero { width: 100%; height: 400px; background: blue; }
        </style>
      </head>
      <body>
        <div class="hero">Fast Loading Content</div>
        <script>
          // Initialize monitoring in iframe
          window.parent.initializeMonitoringInIframe(window);
        </script>
      </body>
      </html>
    `;

    iframe.srcdoc = fastHTML;
    document.body.appendChild(iframe);

    return new Promise(resolve => {
      iframe.onload = () => resolve(iframe);
    });
  }

  async createSlowLoadingPage() {
    const iframe = document.createElement('iframe');
    iframe.style.width = '800px';
    iframe.style.height = '600px';

    // Create intentionally slow loading page
    const slowHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          .hero { width: 100%; height: 400px; }
        </style>
      </head>
      <body>
        <div class="hero">
          <img src="data:image/png;base64,..." style="width:100%;height:100%;"
               onload="setTimeout(() => this.style.display='block', 3000)">
        </div>
        <script>
          // Simulate slow loading
          setTimeout(() => {
            window.parent.initializeMonitoringInIframe(window);
          }, 3500);
        </script>
      </body>
      </html>
    `;

    iframe.srcdoc = slowHTML;
    document.body.appendChild(iframe);

    return new Promise(resolve => {
      iframe.onload = () => resolve(iframe);
    });
  }

  async testSyntheticVsRUMCorrelation() {
    // Compare synthetic monitoring results with RUM data
    const syntheticResults = await this.runSyntheticTests();
    const rumResults = await this.collectRUMData(24 * 60 * 60 * 1000); // 24 hours

    const correlations = this.calculateCorrelations(syntheticResults, rumResults);

    return {
      passed: correlations.overall > 0.7, // Expect at least 70% correlation
      correlations,
      syntheticResults,
      rumSummary: this.summarizeRUMData(rumResults)
    };
  }

  calculateCorrelations(synthetic, rum) {
    const metrics = ['lcp', 'fid', 'cls'];
    const correlations = {};

    metrics.forEach(metric => {
      const syntheticValues = synthetic[metric] || [];
      const rumValues = rum[metric] || [];

      if (syntheticValues.length > 0 && rumValues.length > 0) {
        correlations[metric] = this.pearsonCorrelation(syntheticValues, rumValues);
      }
    });

    correlations.overall = Object.values(correlations)
      .reduce((sum, corr) => sum + corr, 0) / Object.keys(correlations).length;

    return correlations;
  }

  pearsonCorrelation(x, y) {
    const n = Math.min(x.length, y.length);
    if (n < 2) return 0;

    const sumX = x.slice(0, n).reduce((a, b) => a + b, 0);
    const sumY = y.slice(0, n).reduce((a, b) => a + b, 0);
    const sumXY = x.slice(0, n).reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.slice(0, n).reduce((sum, xi) => sum + xi * xi, 0);
    const sumYY = y.slice(0, n).reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  }
}

class PerformanceImpactTestSuite {
  async run(monitor) {
    const tests = [
      this.testCPUOverhead(),
      this.testMemoryUsage(),
      this.testNetworkOverhead(),
      this.testRenderingImpact()
    ];

    const results = await Promise.all(tests);

    return {
      passed: results.every(r => r.passed),
      summary: results,
      overallImpact: this.calculateOverallImpact(results)
    };
  }

  async testCPUOverhead() {
    // Measure CPU usage with and without monitoring
    const baselineCPU = await this.measureCPUUsage(() => {
      this.simulateNormalWebActivity();
    });

    const monitoringCPU = await this.measureCPUUsage(() => {
      monitor.initialize();
      this.simulateNormalWebActivity();
    });

    const overhead = ((monitoringCPU - baselineCPU) / baselineCPU) * 100;

    return {
      passed: overhead < 5, // Less than 5% CPU overhead
      overhead,
      baselineCPU,
      monitoringCPU,
      details: 'CPU overhead should be minimal'
    };
  }

  async measureCPUUsage(workload) {
    // Use Performance Timeline API to measure CPU usage
    const start = performance.now();

    await workload();

    const end = performance.now();
    const duration = end - start;

    // Get long tasks that occurred during workload
    const longTasks = performance.getEntriesByType('longtask')
      .filter(task => task.startTime >= start && task.startTime <= end)
      .reduce((sum, task) => sum + task.duration, 0);

    return {
      totalTime: duration,
      busyTime: longTasks,
      cpuUsage: longTasks / duration
    };
  }

  async testMemoryUsage() {
    // Test memory consumption and potential leaks
    const initialMemory = this.getMemoryUsage();

    // Run monitoring for extended period
    monitor.initialize();

    // Simulate heavy usage
    for (let i = 0; i < 1000; i++) {
      monitor.checkThreshold('lcp', Math.random() * 5000);
      monitor.checkThreshold('fid', Math.random() * 500);
      monitor.checkThreshold('cls', Math.random() * 0.5);
    }

    const afterUsageMemory = this.getMemoryUsage();

    // Force garbage collection if available
    if (window.gc) {
      window.gc();
    }

    await this.wait(1000); // Wait for GC

    const afterGCMemory = this.getMemoryUsage();

    const memoryLeakage = afterGCMemory - initialMemory;
    const maxMemoryUsage = afterUsageMemory - initialMemory;

    return {
      passed: memoryLeakage < 10 * 1024 * 1024, // Less than 10MB leakage
      memoryLeakage,
      maxMemoryUsage,
      initialMemory,
      finalMemory: afterGCMemory,
      details: 'Memory usage should be bounded and not leak'
    };
  }

  getMemoryUsage() {
    if (performance.memory) {
      return performance.memory.usedJSHeapSize;
    }

    // Fallback estimation
    return 0;
  }

  async testNetworkOverhead() {
    // Measure network traffic caused by monitoring
    const networkMonitor = new NetworkTrafficMonitor();

    networkMonitor.start();

    // Run monitoring for set period
    monitor.initialize();
    await this.simulateUserSession(60000); // 1 minute

    const networkStats = networkMonitor.stop();

    const dataTransferred = networkStats.totalBytes;
    const requestCount = networkStats.requestCount;

    return {
      passed: dataTransferred < 50 * 1024 && requestCount < 10, // <50KB, <10 requests per minute
      dataTransferred,
      requestCount,
      averageRequestSize: dataTransferred / requestCount,
      details: 'Network overhead should be minimal'
    };
  }

  async testRenderingImpact() {
    // Test impact on page rendering performance
    const renderingTests = [
      this.testAnimationFrameRate(),
      this.testScrollPerformance(),
      this.testInteractionDelay()
    ];

    const results = await Promise.all(renderingTests);

    return {
      passed: results.every(r => r.passed),
      details: results,
      summary: 'Monitoring should not significantly impact rendering'
    };
  }

  async testAnimationFrameRate() {
    // Test frame rate during monitoring
    const withoutMonitoring = await this.measureFrameRate(() => {
      this.runAnimation(5000); // 5 second animation
    });

    monitor.initialize();

    const withMonitoring = await this.measureFrameRate(() => {
      this.runAnimation(5000);
    });

    const frameRateImpact = ((withoutMonitoring - withMonitoring) / withoutMonitoring) * 100;

    return {
      passed: frameRateImpact < 10, // Less than 10% frame rate impact
      frameRateImpact,
      withoutMonitoring,
      withMonitoring,
      details: 'Animation frame rate should not be significantly impacted'
    };
  }
}

class EdgeCaseTestSuite {
  async run(monitor) {
    const tests = [
      this.testOfflineScenarios(),
      this.testNetworkFailures(),
      this.testBrowserCompatibility(),
      this.testMobileConstraints(),
      this.testHighVolumeScenarios()
    ];

    const results = await Promise.all(tests);

    return {
      passed: results.every(r => r.passed),
      summary: results,
      edgeCaseCoverage: results.length
    };
  }

  async testOfflineScenarios() {
    // Simulate offline/online transitions
    const offlineTests = [];

    // 1. Go offline during data collection
    monitor.initialize();

    // Simulate going offline
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false
    });

    window.dispatchEvent(new Event('offline'));

    // Generate metrics while offline
    for (let i = 0; i < 50; i++) {
      monitor.checkThreshold('lcp', Math.random() * 5000);
    }

    const queueLengthOffline = monitor.offlineQueue.getQueueStatus().queueLength;

    // Simulate coming back online
    navigator.onLine = true;
    window.dispatchEvent(new Event('online'));

    // Wait for queue processing
    await this.wait(5000);

    const queueLengthOnline = monitor.offlineQueue.getQueueStatus().queueLength;

    offlineTests.push({
      name: 'offline-queue',
      passed: queueLengthOffline > queueLengthOnline,
      details: `Queue: ${queueLengthOffline} -> ${queueLengthOnline}`
    });

    return {
      passed: offlineTests.every(t => t.passed),
      tests: offlineTests
    };
  }

  async testBrowserCompatibility() {
    // Test in different browser environments
    const compatibilityTests = [];

    // Test with limited Performance API support
    const originalPerformanceObserver = window.PerformanceObserver;

    // Simulate browser without PerformanceObserver
    window.PerformanceObserver = undefined;

    try {
      monitor.initialize();
      compatibilityTests.push({
        name: 'no-performance-observer',
        passed: true, // Should not throw
        details: 'Should gracefully degrade without PerformanceObserver'
      });
    } catch (error) {
      compatibilityTests.push({
        name: 'no-performance-observer',
        passed: false,
        error: error.message
      });
    }

    // Restore
    window.PerformanceObserver = originalPerformanceObserver;

    // Test with limited storage
    const originalLocalStorage = window.localStorage;

    window.localStorage = {
      setItem: () => { throw new Error('Storage full'); },
      getItem: () => null,
      removeItem: () => {}
    };

    try {
      monitor.offlineQueue.saveQueueToStorage();
      compatibilityTests.push({
        name: 'storage-failure',
        passed: true, // Should not throw
        details: 'Should handle storage failures gracefully'
      });
    } catch (error) {
      compatibilityTests.push({
        name: 'storage-failure',
        passed: false,
        error: error.message
      });
    }

    window.localStorage = originalLocalStorage;

    return {
      passed: compatibilityTests.every(t => t.passed),
      tests: compatibilityTests
    };
  }
}
```


#### Continuous Validation Strategy:


**1. Production Canary Testing**:


```javascript
class ProductionValidator {
  async runCanaryValidation() {
    // Deploy monitoring to small percentage of users
    // Compare results with established baseline

    const canaryResults = await this.collectCanaryData();
    const baselineResults = await this.getBaselineData();

    const validation = this.validateCanaryResults(canaryResults, baselineResults);

    if (!validation.passed) {
      await this.rollbackMonitoring();
      await this.alertDeploymentIssue(validation);
    }

    return validation;
  }
}
```


**2. Cross-validation với External Tools**:


```javascript
// Validate against Lighthouse, WebPageTest, etc.
class ExternalValidation {
  async validateAgainstLighthouse() {
    const lighthouseResults = await this.runLighthouse();
    const ourResults = await this.collectOurMetrics();

    return this.compareResults(lighthouseResults, ourResults);
  }
}
```


**3. A/B Testing Framework**:


```javascript
// Test different monitoring configurations
class MonitoringABTest {
  async runABTest() {
    // Version A: Current monitoring
    // Version B: New monitoring logic

    const results = await this.runSplitTest();
    return this.analyzeDifferences(results);
  }
}
```


**Key Validation Principles**:


1. **Accuracy First** - Monitoring must be accurate above all else
2. **Minimal Impact** - Performance monitoring shouldn't hurt performance
3. **Graceful Degradation** - Should work even with limited browser support
4. **Comprehensive Coverage** - Test all edge cases and failure modes
5. **Continuous Validation** - Monitor the monitors continuously


Đây là comprehensive approach để ensure monitoring system reliable và accurate trong production environment như Meta scale.


**Interviewer**: Tuyệt vời! Cuộc phỏng vấn của chúng ta kết thúc ở đây. Bạn đã demonstrate rất impressive understanding của performance monitoring từ fundamental concepts đến complex production challenges. Technical depth, system design thinking, và practical experience bạn show rất align với expectations cho Senior Frontend Engineer role tại Meta.


Key strengths tôi observe:


- **Deep technical knowledge** of Performance APIs và browser internals
- **System design thinking** với scalable architecture
- **Production mindset** với comprehensive error handling và edge cases
- **Data-driven approach** với statistical analysis và validation
- **Business awareness** hiểu impact của performance lên user experience


Bạn có questions nào cho team hoặc về role không?


**Candidate**: Cảm ơn Sarah! Đây là cuộc phỏng vấn rất enjoyable và challenging. Tôi có vài questions:


1. **Technical Direction**: Meta đang move towards direction nào cho performance monitoring? Có plans nào cho **real-time ML-based anomaly detection** không?
2. **Scale Challenges**: Với billions of users, những biggest challenges Meta face trong performance monitoring là gì?
3. **Team Structure**: Performance engineering team organize như thế nào? Có collaboration với product teams không?
4. **Innovation Opportunities**: Có opportunities nào để contribute to **open-source performance tools** như Lighthouse không?


**Interviewer**: Great questions!


1. Chúng tôi đang heavily invest vào **ML-powered performance insights** - exactly the direction bạn mentioned về anomaly detection.
2. Scale challenges chính là **data processing** và **real-time insights** across diverse devices/networks globally.
3. Performance team embedded across product teams nhưng có **central infrastructure team** cho shared tools.
4. Absolutely! Meta actively contributes to web standards và open-source tools.


Thanks for your time today. We'll be in touch soon!


---


## KẾT LUẬN


**Đánh giá tổng thể**: **STRONG HIRE** - Level L6 (Senior Engineer)


**Điểm mạnh**:


- Kiến thức technical sâu và comprehensive
- System design thinking mature
- Production experience rõ ràng
- Communication skills xuất sắc
- Problem-solving approach có hệ thống


**Areas for growth**:


- Có thể deepen ML/AI knowledge cho future performance optimization
- Continue building experience với Meta's specific infrastructure


Candidate demonstrates readiness cho Senior Frontend Engineer role tại Meta với focus on Performance Engineering.
