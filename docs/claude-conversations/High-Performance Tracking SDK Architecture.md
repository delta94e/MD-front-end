# High-Performance Tracking SDK Architecture

## You

Continue

## Claude


# Phân Tích Chuyên Sâu: Kiến Trúc và Triển Khai Hệ Thống Tracking SDK Hiệu Năng Cao - Góc Nhìn Principal Engineer


## Mở Đầu: Tại Sao Cần Hiểu Sâu Về Tracking Systems?


Khi tôi làm việc tại các công ty như NAB, Axon, Binance, Webflow, và Figma, một trong những thách thức lớn nhất mà chúng ta phải đối mặt là việc xây dựng hệ thống monitoring và tracking có thể scale được với hàng triệu users mà không ảnh hưởng đến performance của ứng dụng chính. Bài viết này sẽ phân tích sâu về một implementation cụ thể của tracking SDK, từ góc độ của một Principal Engineer với hơn 10 năm kinh nghiệm.


## PHẦN I: FOUNDATION LEVEL - HIỂU BẢN CHẤT CỦA TRACKING


### 1. Tracking SDK Là Gì? - Từ First Principles


#### 🌱 Nguồn Gốc & Motivation


Trước khi đi vào chi tiết kỹ thuật, chúng ta cần hiểu tại sao tracking SDK lại tồn tại. Hãy tưởng tượng bạn đang vận hành một cửa hàng online. Bạn muốn biết:


- Khách hàng click vào đâu nhiều nhất?
- Trang nào load chậm khiến khách hàng rời đi?
- Lỗi JavaScript nào đang xảy ra mà bạn không biết?


Trong thời kỳ đầu của web development (khoảng năm 2000-2010), developers thường giải quyết bằng cách:


```javascript
// Cách cũ - Primitive tracking
window.onerror = function(msg, url, line) {
  // Gửi ngay request đến server
  fetch('/error-log', {
    method: 'POST',
    body: JSON.stringify({msg, url, line})
  });
};
```


Vấn đề của approach này:


1. **Network Flooding**: Mỗi event một request, gây quá tải server
2. **Performance Impact**: Block main thread mỗi khi có event
3. **Reliability Issues**: Mất data khi network unstable
4. **No Structure**: Khó maintain và extend


#### 🔬 Bản Chất & Mechanism


Một tracking SDK hiện đại là một **abstraction layer** giữa application code và data collection backend. Nó hoạt động theo nguyên lý:


```javascript
// Conceptual Model
const TrackingSDK = {
  // Data Collection Layer
  collect: (event) => { /* Capture event data */ },

  // Processing Layer
  process: (events) => { /* Transform, filter, aggregate */ },

  // Storage Layer
  buffer: (events) => { /* Temporary storage in memory */ },

  // Transmission Layer
  report: (batch) => { /* Send to backend efficiently */ }
};
```


**Core Algorithm** (simplified):


```
1. Event Capture: DOM events → SDK internal format
2. Prioritization: High/Medium/Low priority queues
3. Buffering: Accumulate events until threshold
4. Batching: Group multiple events into single request
5. Scheduling: Use browser idle time for transmission
6. Fallback: Handle network failures gracefully
```


#### 💡 Intuitive Understanding


Hãy nghĩ về tracking SDK như một **"thư ký thông minh"** của website:


- **Observer**: Luôn quan sát mọi hoạt động (clicks, scrolls, errors)
- **Note-taker**: Ghi chép lại những sự kiện quan trọng
- **Organizer**: Phân loại và tổ chức information
- **Reporter**: Định kỳ báo cáo tổng hợp cho "sếp" (backend)
- **Efficient**: Không làm phiền công việc chính của office


### 2. Core + Plugin Architecture - Deep Dive


#### 🌱 Nguồn Gốc & Motivation


Architecture pattern "Core + Plugin" không phải là invention mới. Nó được sử dụng rộng rãi trong:


- **Webpack**: Core bundler + loaders/plugins
- **Babel**: Core transformer + plugins
- **ESLint**: Core linter + rules
- **VS Code**: Core editor + extensions


Lý do pattern này phổ biến:


1. **Separation of Concerns**: Core chỉ handle fundamental logic
2. **Extensibility**: Dễ dàng thêm features mới
3. **Maintainability**: Bug trong plugin không crash toàn system
4. **Team Scalability**: Nhiều team có thể develop plugins parallel


#### 🔬 Bản Chất & Mechanism


```javascript
// Core Architecture Pseudo-code
class TrackingCore {
  constructor() {
    this.plugins = new Map();
    this.eventBus = new EventEmitter();
    this.scheduler = new ReportScheduler();
  }

  // Plugin Registration
  use(plugin) {
    // Validate plugin interface
    if (!this.validatePlugin(plugin)) {
      throw new Error('Invalid plugin interface');
    }

    // Initialize plugin with core context
    plugin.init(this.getContext());

    // Register plugin event handlers
    this.plugins.set(plugin.name, plugin);
  }

  // Context Object - Core services cho plugins
  getContext() {
    return {
      emit: this.eventBus.emit.bind(this.eventBus),
      on: this.eventBus.on.bind(this.eventBus),
      report: this.scheduler.schedule.bind(this.scheduler),
      utils: this.utilities
    };
  }
}
```


**Plugin Interface Contract**:


```typescript
interface TrackingPlugin {
  name: string;
  version: string;

  // Lifecycle hooks
  init(context: CoreContext): void;
  destroy(): void;

  // Event handlers
  onEvent?(event: TrackingEvent): void;
  onReport?(data: EventData): void;
}
```


#### ⚙️ Implementation Deep Dive


Từ kinh nghiệm implement tracking systems tại Binance (với volume > 100M events/day), tôi học được:


**1. Plugin Lifecycle Management**:


```javascript
class PluginManager {
  async loadPlugin(pluginConfig) {
    try {
      // Dynamic import để avoid blocking main bundle
      const Plugin = await import(pluginConfig.source);

      // Sandbox isolation
      const sandbox = new PluginSandbox(pluginConfig.permissions);
      const pluginInstance = new Plugin(sandbox.getContext());

      // Health check
      await this.validatePluginHealth(pluginInstance);

      this.activePlugins.set(pluginConfig.name, {
        instance: pluginInstance,
        sandbox,
        config: pluginConfig
      });

    } catch (error) {
      // Graceful degradation - app continues without plugin
      this.handlePluginLoadFailure(pluginConfig, error);
    }
  }
}
```


**2. Event Bus với Type Safety**:


```typescript
// Events được type-check compile time
type EventMap = {
  'user.click': ClickEvent;
  'page.load': PageLoadEvent;
  'error.js': JSErrorEvent;
};

class TypedEventBus {
  private handlers = new Map<string, Function[]>();

  on<K extends keyof EventMap>(
    event: K,
    handler: (data: EventMap[K]) => void
  ) {
    const handlers = this.handlers.get(event) || [];
    handlers.push(handler);
    this.handlers.set(event, handlers);
  }

  emit<K extends keyof EventMap>(event: K, data: EventMap[K]) {
    const handlers = this.handlers.get(event) || [];
    handlers.forEach(handler => {
      // Error boundary để prevent plugin crash core
      try {
        handler(data);
      } catch (error) {
        this.handlePluginError(event, error);
      }
    });
  }
}
```


### 3. Plugin System Deep Dive - Ba Loại Plugin Chính


#### A. Performance Monitoring Plugin


#### 🌱 Nguồn Gốc & Motivation


Performance monitoring có roots từ server-side APM (Application Performance Monitoring) tools như New Relic, Dynatrace. Khi Single Page Applications trở nên phổ biến, nhu cầu monitor client-side performance tăng cao.


**Historical context**:


- **2010**: Chỉ có basic `window.performance.timing`
- **2015**: Performance Observer API ra đời
- **2020**: Core Web Vitals được Google standardize
- **2024**: Advanced metrics như INP (Interaction to Next Paint)


#### 🔬 Bản Chất & Mechanism


Performance monitoring hoạt động through **passive observation** của browser APIs:


```javascript
class PerformancePlugin {
  constructor() {
    this.metrics = {
      vitals: new Map(), // LCP, FID, CLS
      resources: new Map(), // Network timing
      custom: new Map() // User-defined
    };
  }

  init(context) {
    this.setupVitalsMonitoring();
    this.setupResourceMonitoring();
    this.setupUserTimingAPI();
  }

  setupVitalsMonitoring() {
    // Largest Contentful Paint
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];

      this.metrics.vitals.set('lcp', {
        value: lastEntry.startTime,
        element: lastEntry.element?.tagName,
        url: lastEntry.url,
        timestamp: Date.now()
      });

      // Report nếu LCP > threshold
      if (lastEntry.startTime > 2500) {
        this.context.emit('performance.lcp.poor', {
          value: lastEntry.startTime,
          threshold: 2500
        });
      }
    }).observe({entryTypes: ['largest-contentful-paint']});

    // First Input Delay
    new PerformanceObserver((entryList) => {
      entryList.getEntries().forEach(entry => {
        this.metrics.vitals.set('fid', {
          value: entry.processingStart - entry.startTime,
          eventType: entry.name,
          timestamp: Date.now()
        });
      });
    }).observe({entryTypes: ['first-input']});

    // Cumulative Layout Shift
    let clsValue = 0;
    new PerformanceObserver((entryList) => {
      entryList.getEntries().forEach(entry => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
          this.metrics.vitals.set('cls', {
            value: clsValue,
            timestamp: Date.now()
          });
        }
      });
    }).observe({entryTypes: ['layout-shift']});
  }
}
```


#### 💡 Real-world Application - Binance Trading Platform


Tại Binance, chúng tôi monitor trading interface với độ chính xác millisecond:


```javascript
// Custom metric cho trading latency
class TradingPerformancePlugin extends PerformancePlugin {
  trackOrderPlacement() {
    const startTime = performance.now();

    // Mark timing cho từng bước
    performance.mark('order-validation-start');
    // ... validation logic
    performance.mark('order-validation-end');

    performance.mark('order-submit-start');
    // ... API call
    performance.mark('order-submit-end');

    // Measure total latency
    performance.measure('order-placement-total', 'order-validation-start', 'order-submit-end');

    // Alert nếu > 100ms (critical cho trading)
    const totalTime = performance.getEntriesByName('order-placement-total')[0].duration;
    if (totalTime > 100) {
      this.context.emit('trading.latency.critical', {
        duration: totalTime,
        userId: this.getCurrentUser().id,
        orderType: this.getCurrentOrderType()
      });
    }
  }
}
```


#### B. User Behavior Tracking Plugin


#### 🌱 Nguồn Gốc & Motivation


User behavior tracking evolved from simple "page view" counters thành sophisticated user journey analysis. Companies như Google Analytics, Mixpanel, Amplitude pioneered event-based tracking.


**Evolution timeline**:


- **Early 2000s**: Server logs analysis
- **2005**: JavaScript-based page view tracking
- **2010**: Event-based tracking (clicks, scrolls)
- **2015**: User session replay
- **2020**: Privacy-first tracking (GDPR compliance)


#### 🔬 Bản Chất & Mechanism


User behavior tracking = **Event capture + User session management + Privacy compliance**


```javascript
class UserBehaviorPlugin {
  constructor() {
    this.session = new UserSession();
    this.eventCapture = new EventCaptureManager();
    this.privacy = new PrivacyManager();
  }

  init(context) {
    this.setupEventListeners();
    this.setupIntersectionObserver();
    this.setupUserIdentification();
  }

  setupEventListeners() {
    // Throttled scroll tracking
    let scrollTimeout;
    document.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        this.trackScrollDepth();
      }, 100);
    }, { passive: true });

    // Click tracking với element context
    document.addEventListener('click', (event) => {
      const element = event.target.closest('[data-track], button, a');
      if (!element) return;

      this.trackClick({
        elementType: element.tagName.toLowerCase(),
        elementText: element.textContent?.trim().substring(0, 100),
        elementAttributes: this.getRelevantAttributes(element),
        position: { x: event.clientX, y: event.clientY },
        timestamp: Date.now()
      });
    });

    // Form interaction tracking
    document.addEventListener('focusin', (event) => {
      if (event.target.matches('input, textarea, select')) {
        this.trackFormInteraction('focus', event.target);
      }
    });
  }

  // Advanced viewport tracking
  setupIntersectionObserver() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.trackElementView({
            elementId: entry.target.id,
            elementClass: entry.target.className,
            visibilityRatio: entry.intersectionRatio,
            timeVisible: Date.now()
          });
        }
      });
    }, {
      threshold: [0.1, 0.5, 0.9] // Track different visibility levels
    });

    // Auto-track elements với data attributes
    document.querySelectorAll('[data-track-view]').forEach(el => {
      observer.observe(el);
    });
  }
}
```


#### 💡 Real-world Application - Figma Editor


Tại Figma, user behavior tracking phải handle millions of micro-interactions:


```javascript
class FigmaEditorBehaviorPlugin extends UserBehaviorPlugin {
  trackCanvasInteraction() {
    const canvasEvents = ['mousedown', 'mousemove', 'mouseup', 'wheel'];

    canvasEvents.forEach(eventType => {
      this.canvas.addEventListener(eventType, (event) => {
        // Batch canvas events để avoid flooding
        this.canvasEventBuffer.push({
          type: eventType,
          tool: this.currentTool,
          coordinates: { x: event.offsetX, y: event.offsetY },
          timestamp: performance.now()
        });

        // Flush buffer every 100ms hoặc khi buffer full
        if (this.canvasEventBuffer.length >= 50) {
          this.flushCanvasEvents();
        }
      });
    });
  }

  // Intelligent event sampling để reduce data volume
  shouldSampleEvent(event) {
    // Sample 100% critical events, 10% mousemove, 1% idle events
    const samplingRates = {
      'tool.select': 1.0,
      'layer.create': 1.0,
      'canvas.mousemove': 0.1,
      'canvas.idle': 0.01
    };

    return Math.random() < (samplingRates[event.type] || 0.1);
  }
}
```


#### C. Error Monitoring Plugin


#### 🌱 Nguồn Gốc & Motivation


Error monitoring đã evolve từ simple console.log thành sophisticated error tracking systems như Sentry, Rollbar, LogRocket.


**Why error monitoring matters**:


- **Business Impact**: 1 second delay = 7% decrease in conversions
- **User Experience**: Silent errors kill user trust
- **Developer Productivity**: Proactive error detection vs reactive debugging


#### 🔬 Bản Chất & Mechanism


Error monitoring = **Error capture + Context enrichment + Deduplication + Alerting**


```javascript
class ErrorMonitoringPlugin {
  constructor() {
    this.errorBuffer = [];
    this.contextTracker = new ErrorContextTracker();
    this.deduplicator = new ErrorDeduplicator();
  }

  init(context) {
    this.setupGlobalErrorHandling();
    this.setupPromiseRejectionHandling();
    this.setupCustomErrorReporting();
    this.setupNetworkErrorTracking();
  }

  setupGlobalErrorHandling() {
    window.addEventListener('error', (event) => {
      const errorInfo = {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
        stack: event.error?.stack,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        // Rich context
        context: this.contextTracker.getCurrentContext()
      };

      this.reportError(errorInfo);
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const errorInfo = {
        type: 'unhandledrejection',
        reason: event.reason,
        promise: event.promise,
        timestamp: Date.now(),
        context: this.contextTracker.getCurrentContext()
      };

      this.reportError(errorInfo);
    });
  }

  // Network request error tracking
  setupNetworkErrorTracking() {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);

        // Track HTTP errors
        if (!response.ok) {
          this.reportNetworkError({
            url: args[0],
            status: response.status,
            statusText: response.statusText,
            method: args[1]?.method || 'GET',
            timestamp: Date.now()
          });
        }

        return response;
      } catch (error) {
        // Network failures
        this.reportNetworkError({
          url: args[0],
          error: error.message,
          type: 'network_failure',
          timestamp: Date.now()
        });
        throw error;
      }
    };
  }

  // Context enrichment cho error debugging
  enrichErrorContext(error) {
    return {
      ...error,
      breadcrumbs: this.contextTracker.getBreadcrumbs(),
      userActions: this.contextTracker.getRecentActions(),
      systemInfo: {
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        memory: performance.memory,
        connection: navigator.connection,
        battery: navigator.getBattery?.()
      }
    };
  }
}
```


#### 💡 Real-world Application - NAB Banking Platform


Tại NAB, error monitoring cho banking app requires extreme reliability:


```javascript
class BankingErrorPlugin extends ErrorMonitoringPlugin {
  reportCriticalError(error) {
    // Classify error severity
    const severity = this.classifyErrorSeverity(error);

    if (severity === 'CRITICAL') {
      // Immediate PagerDuty alert
      this.context.emit('error.critical', {
        ...error,
        userId: this.getCurrentUser()?.id,
        accountId: this.getCurrentAccount()?.id,
        transactionId: this.getCurrentTransaction()?.id,
        piiRedacted: true // Compliance requirement
      });

      // Fallback reporting qua multiple channels
      this.sendToPagerDuty(error);
      this.sendToSlack(error);
      this.logToCloudWatch(error);
    }
  }

  classifyErrorSeverity(error) {
    const criticalPatterns = [
      /payment.*failed/i,
      /authentication.*error/i,
      /balance.*incorrect/i,
      /transaction.*timeout/i
    ];

    return criticalPatterns.some(pattern =>
      pattern.test(error.message)
    ) ? 'CRITICAL' : 'WARNING';
  }
}
```


## PHẦN II: SENIOR LEVEL - ADVANCED ARCHITECTURE PATTERNS


### 4. Sandbox System - Deep Architectural Analysis


#### 🌱 Nguồn Gốc & Motivation: Tại Sao Cần Sandbox?


Sandbox concept không phải mới, nó có roots từ:


- **Operating Systems**: Process isolation (Unix processes, Windows sandboxes)
- **Browser Security**: Same-origin policy, iframe sandbox
- **Cloud Computing**: Container isolation (Docker, LXC)
- **Programming Languages**: VM isolation (JVM, .NET CLR)


Trong context của tracking SDK, sandbox giải quyết specific problems:


1. **Plugin Code Isolation**: Third-party plugins có thể chứa malicious/buggy code
2. **Global State Protection**: Prevent plugins modify window object, DOM globals
3. **Resource Management**: Limit memory/CPU usage của plugins
4. **Error Containment**: Bug trong plugin không crash entire SDK


#### 🔬 Bản Chất & Mechanism: Sandbox Types Deep Dive


**1. Proxy-based Sandbox (Lightweight Logical Isolation)**


```javascript
class ProxySandbox {
  constructor(config = {}) {
    this.allowList = new Set(config.allowList || []);
    this.denyList = new Set(config.denyList || []);
    this.fakeWindow = Object.create(null);
    this.originalDescriptors = new Map();
  }

  createSandboxedGlobal() {
    const sandboxedWindow = new Proxy(this.fakeWindow, {
      has: (target, prop) => {
        // Prevent access to denied properties
        if (this.denyList.has(prop)) return false;

        // Allow explicitly allowed properties
        if (this.allowList.has(prop)) return true;

        // Check if property exists in real window
        return prop in window;
      },

      get: (target, prop) => {
        // Return sandboxed value if exists
        if (prop in target) return target[prop];

        // Security check
        if (this.denyList.has(prop)) {
          throw new SecurityError(`Access to '${prop}' is denied in sandbox`);
        }

        // Proxy methods để maintain binding
        const value = window[prop];
        if (typeof value === 'function') {
          return value.bind(window);
        }

        return value;
      },

      set: (target, prop, value) => {
        // Prevent modification of critical globals
        if (this.isDangerous(prop)) {
          throw new SecurityError(`Cannot modify '${prop}' in sandbox`);
        }

        // Store in sandbox scope
        target[prop] = value;
        return true;
      }
    });

    return sandboxedWindow;
  }

  isDangerous(prop) {
    const dangerousProps = [
      'document', 'localStorage', 'sessionStorage',
      'location', 'history', 'fetch', 'XMLHttpRequest'
    ];
    return dangerousProps.includes(prop);
  }
}
```


**2. Web Worker Sandbox (Physical Thread Isolation)**


```javascript
class WebWorkerSandbox {
  constructor(pluginCode, permissions = {}) {
    this.worker = null;
    this.messageQueue = [];
    this.pendingCalls = new Map();
    this.callId = 0;
  }

  async initialize() {
    // Create worker với restricted context
    const workerCode = `
      // Worker context - no DOM access by default
      const allowedAPIs = ${JSON.stringify(this.permissions.allowedAPIs || [])};

      // Message handler
      self.onmessage = function(event) {
        const { id, method, args } = event.data;

        try {
          // Execute plugin method
          const result = self.pluginInstance[method](...args);

          // Send result back to main thread
          self.postMessage({
            id,
            type: 'result',
            data: result
          });
        } catch (error) {
          self.postMessage({
            id,
            type: 'error',
            error: error.message
          });
        }
      };

      // Load plugin code
      ${this.pluginCode}
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    this.worker = new Worker(URL.createObjectURL(blob));

    this.worker.onmessage = this.handleWorkerMessage.bind(this);
    this.worker.onerror = this.handleWorkerError.bind(this);
  }

  // Async communication với worker
  async callPluginMethod(method, ...args) {
    const id = ++this.callId;

    return new Promise((resolve, reject) => {
      this.pendingCalls.set(id, { resolve, reject });

      this.worker.postMessage({
        id,
        method,
        args: this.serializeArgs(args)
      });
    });
  }
}
```


**3. Iframe Sandbox (Browser Process Isolation)**


```javascript
class IframeSandbox {
  constructor(pluginCode, permissions = {}) {
    this.iframe = null;
    this.initialized = false;
    this.permissions = permissions;
  }

  async initialize() {
    // Create sandboxed iframe
    this.iframe = document.createElement('iframe');
    this.iframe.src = 'about:blank';
    this.iframe.sandbox = this.buildSandboxFlags();

    // Hidden iframe
    this.iframe.style.display = 'none';
    document.body.appendChild(this.iframe);

    // Wait for iframe load
    await new Promise(resolve => {
      this.iframe.onload = resolve;
    });

    // Inject plugin code
    await this.injectPluginCode();
  }

  buildSandboxFlags() {
    const flags = ['allow-scripts'];

    if (this.permissions.allowNetworking) {
      flags.push('allow-same-origin');
    }

    if (this.permissions.allowPopups) {
      flags.push('allow-popups');
    }

    return flags.join(' ');
  }

  async injectPluginCode() {
    const doc = this.iframe.contentDocument;
    const script = doc.createElement('script');

    script.textContent = `
      // Iframe context
      const parentTracker = {
        report: (data) => {
          parent.postMessage({
            type: 'tracking-report',
            data: data
          }, '*');
        }
      };

      // Plugin code
      ${this.pluginCode}
    `;

    doc.body.appendChild(script);
  }
}
```


#### 💭 Principal's Perspective: Sandbox Selection Strategy


Từ kinh nghiệm triển khai tại các platforms lớn, tôi có framework quyết định:


```javascript
class SandboxSelector {
  selectOptimalSandbox(plugin, context) {
    const factors = {
      securityLevel: this.assessSecurityRisk(plugin),
      performanceRequirement: this.getPerformanceRequirement(context),
      browserSupport: this.getBrowserSupport(),
      resourceConstraints: this.getResourceConstraints()
    };

    if (factors.securityLevel === 'HIGH' && factors.resourceConstraints.memory > 100) {
      return 'WebWorker'; // Maximum isolation
    }

    if (factors.performanceRequirement === 'CRITICAL') {
      return 'Proxy'; // Minimum overhead
    }

    if (factors.browserSupport.legacy) {
      return 'Iframe'; // Maximum compatibility
    }

    return 'Proxy'; // Default choice
  }
}
```


### 5. Reporting System Architecture - Chuyển Từ Dual-Queue Sang Tri-Queue


#### 🌱 Nguồn Gốc & Motivation: Tại Sao Dual-Queue Không Đủ?


Traditional dual-queue system:


- **Real-time Queue**: Immediate reporting for critical events
- **Batch Queue**: Accumulate non-critical events


Limitations discovered at scale:


1. **Priority Blindness**: Cannot distinguish between medium và low priority
2. **Resource Waste**: Low-priority events consume same resources as medium
3. **Flexibility**: Binary choice không match real-world requirements


#### 🔬 Bản Chất & Mechanism: Tri-Queue + Scheduler Architecture


```javascript
class TriQueueReportingSystem {
  constructor(config = {}) {
    this.queues = {
      high: new PriorityQueue({ maxSize: 100, flushThreshold: 1 }),
      medium: new PriorityQueue({ maxSize: 500, flushThreshold: 10 }),
      low: new PriorityQueue({ maxSize: 1000, flushThreshold: 50 })
    };

    this.scheduler = new IdleScheduler();
    this.networkManager = new NetworkManager();
    this.bufferManager = new BufferManager(config.bufferSize || 100);
  }

  // Event classification và routing
  enqueue(event) {
    const priority = this.classifyEventPriority(event);
    const queue = this.queues[priority];

    // Add timestamp và metadata
    const enrichedEvent = {
      ...event,
      priority,
      timestamp: Date.now(),
      sessionId: this.getSessionId(),
      userId: this.getUserId()
    };

    queue.push(enrichedEvent);

    // Check flush conditions
    this.checkFlushConditions(priority);
  }

  classifyEventPriority(event) {
    // Critical business events
    const highPriorityPatterns = [
      'error.javascript',
      'error.network.4xx',
      'error.network.5xx',
      'performance.lcp.poor',
      'user.payment.failed',
      'user.auth.failed'
    ];

    // Important user interactions
    const mediumPriorityPatterns = [
      'user.click.cta',
      'user.form.submit',
      'performance.fcp',
      'user.page.view'
    ];

    // Background monitoring
    const lowPriorityPatterns = [
      'user.scroll',
      'user.hover',
      'performance.resource.timing',
      'user.idle'
    ];

    const eventType = event.type;

    if (highPriorityPatterns.some(pattern => eventType.includes(pattern))) {
      return 'high';
    }

    if (mediumPriorityPatterns.some(pattern => eventType.includes(pattern))) {
      return 'medium';
    }

    return 'low';
  }
}
```


#### ⚙️ Implementation Deep Dive: Scheduler + RequestIdleCallback


```javascript
class IdleScheduler {
  constructor() {
    this.taskQueue = [];
    this.isProcessing = false;
    this.processedCount = 0;

    // Feature detection với graceful fallback
    this.hasRequestIdleCallback = 'requestIdleCallback' in window;
  }

  schedule(task, priority = 'low') {
    this.taskQueue.push({ task, priority, timestamp: Date.now() });

    if (!this.isProcessing) {
      this.startProcessing();
    }
  }

  startProcessing() {
    this.isProcessing = true;

    if (this.hasRequestIdleCallback) {
      this.processWithIdleCallback();
    } else {
      // Fallback cho older browsers
      this.processWithSetTimeout();
    }
  }

  processWithIdleCallback() {
    requestIdleCallback((deadline) => {
      // Process tasks while we have idle time
      while (deadline.timeRemaining() > 0 && this.taskQueue.length > 0) {
        const { task } = this.taskQueue.shift();

        try {
          task();
          this.processedCount++;
        } catch (error) {
          this.handleTaskError(error);
        }
      }

      // Continue processing if more tasks exist
      if (this.taskQueue.length > 0) {
        this.processWithIdleCallback();
      } else {
        this.isProcessing = false;
      }
    }, { timeout: 5000 }); // Max 5s delay
  }

  processWithSetTimeout() {
    // Simulate idle callback với timeout
    setTimeout(() => {
      const startTime = performance.now();
      const maxProcessingTime = 16; // ~1 frame budget

      while (
        (performance.now() - startTime) < maxProcessingTime &&
        this.taskQueue.length > 0
      ) {
        const { task } = this.taskQueue.shift();

        try {
          task();
          this.processedCount++;
        } catch (error) {
          this.handleTaskError(error);
        }
      }

      if (this.taskQueue.length > 0) {
        this.processWithSetTimeout();
      } else {
        this.isProcessing = false;
      }
    }, 0);
  }
}
```


#### 💡 Real-world Application: Webflow Editor Performance


Tại Webflow, chúng tôi phải handle millions of design operations:


```javascript
class WebflowReportingSystem extends TriQueueReportingSystem {
  classifyEventPriority(event) {
    // Designer-specific priority logic
    if (event.type.startsWith('design.element.')) {
      // Element operations - medium priority
      return 'medium';
    }

    if (event.type.startsWith('design.canvas.zoom') ||
        event.type.startsWith('design.canvas.pan')) {
      // Canvas interactions - low priority, high volume
      return 'low';
    }

    if (event.type.startsWith('design.publish') ||
        event.type.startsWith('design.export')) {
      // Critical operations - high priority
      return 'high';
    }

    return super.classifyEventPriority(event);
  }

  // Smart batching cho design operations
  optimizeBatch(events) {
    // Group similar operations
    const grouped = events.reduce((acc, event) => {
      const key = `${event.type}-${event.elementId || 'global'}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(event);
      return acc;
    }, {});

    // Merge consecutive similar events
    return Object.values(grouped).map(group => {
      if (group.length === 1) return group[0];

      return this.mergeEvents(group);
    });
  }
}
```


### 6. Buffer Management vs localStorage: Architecture Decision


#### 🌱 Nguồn Gốc & Motivation: Storage Strategy Evolution


**Historical progression**:


1. **2005-2010**: Server-side session storage
2. **2010-2015**: localStorage/sessionStorage adoption
3. **2015-2020**: IndexedDB cho large datasets
4. **2020-now**: Memory-first với selective persistence


#### 🔬 Bản Chất & Mechanism: Buffer Manager Design


```javascript
class BufferManager {
  constructor(config = {}) {
    this.maxBufferSize = config.maxBufferSize || 100;
    this.maxMemoryUsage = config.maxMemoryUsage || 10 * 1024 * 1024; // 10MB
    this.autoFlushInterval = config.autoFlushInterval || 30000; // 30s

    this.buffer = [];
    this.bufferSize = 0; // Bytes
    this.lastFlush = Date.now();

    // Monitoring
    this.metrics = {
      eventsBuffered: 0,
      eventsDropped: 0,
      flushCount: 0,
      memoryPressure: 0
    };

    this.startAutoFlush();
    this.monitorMemoryPressure();
  }

  add(event) {
    const eventSize = this.estimateEventSize(event);

    // Memory pressure check
    if (this.bufferSize + eventSize > this.maxMemoryUsage) {
      this.handleMemoryPressure(event);
      return false;
    }

    // Buffer size check
    if (this.buffer.length >= this.maxBufferSize) {
      // Flush oldest events first
      this.flushOldestEvents(Math.ceil(this.maxBufferSize * 0.3));
    }

    this.buffer.push({
      ...event,
      bufferedAt: Date.now(),
      size: eventSize
    });

    this.bufferSize += eventSize;
    this.metrics.eventsBuffered++;

    return true;
  }

  // Accurate memory estimation
  estimateEventSize(event) {
    return JSON.stringify(event).length * 2; // UTF-16 = 2 bytes per char
  }

  handleMemoryPressure(newEvent) {
    const urgentFlushSize = Math.ceil(this.maxBufferSize * 0.5);

    // Priority-based eviction
    this.buffer.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    // Keep high priority, flush low priority
    const toKeep = this.buffer.slice(-urgentFlushSize);
    const toFlush = this.buffer.slice(0, -urgentFlushSize);

    if (toFlush.length > 0) {
      this.flush(toFlush);
    }

    this.buffer = toKeep;
    this.recalculateBufferSize();

    // Try adding event again
    return this.add(newEvent);
  }

  // Memory monitoring với performance.memory
  monitorMemoryPressure() {
    if (performance.memory) {
      setInterval(() => {
        const memInfo = performance.memory;
        const pressureRatio = memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit;

        this.metrics.memoryPressure = pressureRatio;

        // Proactive flushing khi memory cao
        if (pressureRatio > 0.8) {
          this.flush();
        }
      }, 5000);
    }
  }

  async flush(events = null) {
    const toFlush = events || [...this.buffer];
    if (toFlush.length === 0) return;

    try {
      // Network request
      await this.sendEvents(toFlush);

      // Remove flushed events from buffer
      if (!events) {
        this.buffer = [];
        this.bufferSize = 0;
      } else {
        // Remove specific events
        toFlush.forEach(event => {
          const index = this.buffer.indexOf(event);
          if (index > -1) {
            this.buffer.splice(index, 1);
            this.bufferSize -= event.size;
          }
        });
      }

      this.metrics.flushCount++;
      this.lastFlush = Date.now();

    } catch (error) {
      // Fallback to persistent storage on network failure
      this.fallbackToPersistentStorage(toFlush);
    }
  }

  // Fallback strategy
  async fallbackToPersistentStorage(events) {
    try {
      // Try IndexedDB first
      await this.storeInIndexedDB(events);
    } catch (error) {
      try {
        // Fallback to localStorage
        this.storeInLocalStorage(events);
      } catch (storageError) {
        // Last resort: drop events với logging
        this.metrics.eventsDropped += events.length;
        console.warn('Failed to store events, dropping:', events.length);
      }
    }
  }
}
```


#### 💡 Real-world Application: Axon Body Camera Analytics


Tại Axon, video analytics data requires careful buffer management:


```javascript
class AxonAnalyticsBuffer extends BufferManager {
  constructor(config) {
    super({
      ...config,
      maxBufferSize: 500, // Higher capacity cho video events
      maxMemoryUsage: 50 * 1024 * 1024 // 50MB
    });

    // Video-specific event types
    this.videoEventTypes = [
      'recording.start',
      'recording.stop',
      'motion.detected',
      'face.recognized',
      'audio.threshold'
    ];
  }

  add(event) {
    // Compress video analytics data
    if (this.videoEventTypes.includes(event.type)) {
      event = this.compressVideoEvent(event);
    }

    return super.add(event);
  }

  compressVideoEvent(event) {
    // Remove redundant metadata, keep essential data
    return {
      type: event.type,
      timestamp: event.timestamp,
      deviceId: event.deviceId,
      // Compress coordinate arrays
      coordinates: this.compressCoordinates(event.coordinates),
      // Delta compression cho motion data
      motionDelta: this.calculateMotionDelta(event.motion)
    };
  }
}
```


## PHẦN III: PRINCIPAL LEVEL - SYSTEM DESIGN & ARCHITECTURE DECISIONS


### 7. requestIdleCallback vs requestHostCallback: Deep Dive


#### 🌱 Nguồn Gốc & Motivation: Browser Scheduling Evolution


**Timeline của browser scheduling APIs**:


- **2009**: setTimeout/setInterval (crude timing)
- **2013**: requestAnimationFrame (60fps sync)
- **2015**: requestIdleCallback (idle time utilization)
- **2017**: React Scheduler với requestHostCallback (precise control)
- **2023**: scheduler.postTask (W3C standard)


#### 🔬 Bản Chất & Mechanism: Scheduler Comparison


```javascript
// requestIdleCallback - Browser managed
function demonstrateIdleCallback() {
  requestIdleCallback(function(deadline) {
    console.log('Time remaining:', deadline.timeRemaining());
    console.log('Did timeout:', deadline.didTimeout);

    // Browser gives us idle time chunks
    while (deadline.timeRemaining() > 0 && taskQueue.length > 0) {
      processTask(taskQueue.shift());
    }
  }, { timeout: 5000 });
}

// requestHostCallback - React's custom scheduler
function demonstrateHostCallback() {
  // React's implementation (simplified)
  const channel = new MessageChannel();
  const port1 = channel.port1;
  const port2 = channel.port2;

  port2.onmessage = function() {
    // Precise control over execution timing
    const startTime = performance.now();
    const timeSlice = 5; // 5ms slice

    while (performance.now() - startTime < timeSlice && taskQueue.length > 0) {
      processTask(taskQueue.shift());
    }

    // Schedule next slice nếu needed
    if (taskQueue.length > 0) {
      scheduleHostCallback();
    }
  };

  function scheduleHostCallback() {
    port1.postMessage(null);
  }
}
```


#### ⚙️ Implementation Deep Dive: Custom Scheduler for Tracking


```javascript
class TrackingScheduler {
  constructor(strategy = 'idle') {
    this.strategy = strategy;
    this.taskQueue = new PriorityQueue();
    this.isRunning = false;
    this.frameDeadline = 16.67; // 60fps = ~16.67ms per frame

    // Performance monitoring
    this.metrics = {
      tasksProcessed: 0,
      avgProcessingTime: 0,
      droppedTasks: 0
    };
  }

  schedule(task, priority = 'normal') {
    this.taskQueue.enqueue({
      task,
      priority,
      scheduledAt: performance.now()
    });

    if (!this.isRunning) {
      this.startProcessing();
    }
  }

  startProcessing() {
    this.isRunning = true;

    switch (this.strategy) {
      case 'idle':
        this.processWithIdleCallback();
        break;
      case 'frame':
        this.processWithAnimationFrame();
        break;
      case 'immediate':
        this.processImmediately();
        break;
      case 'custom':
        this.processWithCustomScheduler();
        break;
    }
  }

  processWithIdleCallback() {
    if (!('requestIdleCallback' in window)) {
      return this.processWithAnimationFrame();
    }

    requestIdleCallback((deadline) => {
      const startTime = performance.now();

      while (deadline.timeRemaining() > 2 && !this.taskQueue.isEmpty()) {
        const { task } = this.taskQueue.dequeue();

        try {
          task();
          this.metrics.tasksProcessed++;
        } catch (error) {
          this.handleTaskError(error);
        }
      }

      this.updateMetrics(performance.now() - startTime);

      if (!this.taskQueue.isEmpty()) {
        this.processWithIdleCallback();
      } else {
        this.isRunning = false;
      }
    });
  }

  processWithCustomScheduler() {
    // MessageChannel-based scheduler (React-style)
    const channel = new MessageChannel();
    const port1 = channel.port1;
    const port2 = channel.port2;

    port2.onmessage = () => {
      const startTime = performance.now();
      const timeSlice = this.calculateOptimalTimeSlice();

      while (
        (performance.now() - startTime) < timeSlice &&
        !this.taskQueue.isEmpty()
      ) {
        const { task, priority } = this.taskQueue.dequeue();

        // Priority-based time allocation
        const maxTime = this.getMaxTimeForPriority(priority);
        const taskStart = performance.now();

        try {
          task();

          // Monitor task performance
          const taskDuration = performance.now() - taskStart;
          if (taskDuration > maxTime) {
            console.warn(`Task exceeded time budget: ${taskDuration}ms > ${maxTime}ms`);
          }

          this.metrics.tasksProcessed++;
        } catch (error) {
          this.handleTaskError(error);
        }
      }

      if (!this.taskQueue.isEmpty()) {
        port1.postMessage(null);
      } else {
        this.isRunning = false;
      }
    };

    // Start processing
    port1.postMessage(null);
  }

  calculateOptimalTimeSlice() {
    // Dynamic time slice based on system performance
    const { memory } = performance;
    if (memory && memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.8) {
      return 3; // Reduced slice when memory pressure
    }

    // Check battery status
    if (navigator.getBattery) {
      navigator.getBattery().then(battery => {
        if (battery.level < 0.2) {
          return 2; // Conservative when low battery
        }
      });
    }

    return 5; // Default 5ms slice
  }
}
```


#### 💭 Principal's Perspective: Scheduler Strategy Selection


```javascript
class SchedulerStrategySelector {
  selectStrategy(context) {
    const factors = {
      appType: this.detectAppType(),
      userDevice: this.analyzeDevice(),
      dataVolume: this.estimateDataVolume(),
      criticalityLevel: this.assessCriticality()
    };

    // Decision matrix
    if (factors.appType === 'trading' && factors.criticalityLevel === 'high') {
      return 'immediate'; // Binance-style real-time trading
    }

    if (factors.appType === 'editor' && factors.dataVolume === 'high') {
      return 'custom'; // Figma-style complex interactions
    }

    if (factors.userDevice.performance === 'low') {
      return 'idle'; // Conservative for low-end devices
    }

    if (factors.appType === 'banking') {
      return 'frame'; // Consistent performance for NAB
    }

    return 'idle'; // Default safe choice
  }

  detectAppType() {
    // Heuristics based on DOM structure, URLs, etc.
    if (location.hostname.includes('trading') ||
        document.querySelector('[data-trading-interface]')) {
      return 'trading';
    }

    if (document.querySelector('canvas') &&
        document.querySelector('[data-editor]')) {
      return 'editor';
    }

    if (location.hostname.includes('bank') ||
        document.querySelector('[data-banking-app]')) {
      return 'banking';
    }

    return 'general';
  }
}
```


### 8. Network Optimization & Reliability Patterns


#### 🌱 Nguồn Gốc & Motivation: Network Reliability at Scale


**Network challenges at enterprise scale**:


- **Mobile Networks**: Intermittent connectivity, varying bandwidth
- **Global Distribution**: Latency differences across regions
- **Corporate Firewalls**: Proxy servers, content filtering
- **Edge Cases**: Airplane mode, tunnel networks, rate limiting


#### 🔬 Bản Chất & Mechanism: Robust Network Layer


```javascript
class NetworkManager {
  constructor(config = {}) {
    this.endpoints = config.endpoints || [];
    this.currentEndpoint = 0;
    this.retryConfig = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 30000,
      backoffMultiplier: 2
    };

    this.connectionMonitor = new ConnectionMonitor();
    this.requestQueue = new NetworkQueue();
    this.circuitBreaker = new CircuitBreaker();
  }

  async send(data, options = {}) {
    // Pre-flight checks
    if (!this.connectionMonitor.isOnline()) {
      return this.queueForLater(data);
    }

    if (this.circuitBreaker.isOpen()) {
      throw new Error('Circuit breaker open - network failures detected');
    }

    // Attempt delivery với retry logic
    return this.sendWithRetry(data, options);
  }

  async sendWithRetry(data, options, attempt = 1) {
    const endpoint = this.getCurrentEndpoint();

    try {
      const response = await this.makeRequest(endpoint, data, options);

      // Success - reset circuit breaker
      this.circuitBreaker.recordSuccess();

      return response;

    } catch (error) {
      this.circuitBreaker.recordFailure();

      // Failover to next endpoint
      if (this.shouldFailover(error)) {
        this.rotateEndpoint();
        return this.sendWithRetry(data, options, attempt);
      }

      // Retry với exponential backoff
      if (attempt < this.retryConfig.maxRetries && this.shouldRetry(error)) {
        const delay = this.calculateBackoffDelay(attempt);
        await this.sleep(delay);

        return this.sendWithRetry(data, options, attempt + 1);
      }

      // Final fallback strategies
      return this.handleFailure(data, error);
    }
  }

  async makeRequest(endpoint, data, options) {
    const request = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-SDK-Version': '2.0.0',
        'X-Request-ID': this.generateRequestId(),
        ...options.headers
      },
      body: JSON.stringify(data)
    };

    // Add authentication if needed
    if (options.auth) {
      request.headers['Authorization'] = `Bearer ${options.auth}`;
    }

    // Request timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout || 10000);

    try {
      const response = await fetch(endpoint, {
        ...request,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new NetworkError(`HTTP ${response.status}: ${response.statusText}`, {
          status: response.status,
          endpoint
        });
      }

      return response.json();

    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw new TimeoutError('Request timeout', { endpoint, timeout: options.timeout });
      }

      throw error;
    }
  }

  // Intelligent endpoint rotation
  rotateEndpoint() {
    this.currentEndpoint = (this.currentEndpoint + 1) % this.endpoints.length;
  }

  getCurrentEndpoint() {
    return this.endpoints[this.currentEndpoint];
  }

  shouldRetry(error) {
    // Retry on network errors, not client errors
    return (
      error instanceof TimeoutError ||
      error instanceof NetworkError && error.status >= 500 ||
      error.code === 'NETWORK_ERROR'
    );
  }

  shouldFailover(error) {
    // Failover on endpoint-specific issues
    return (
      error instanceof TimeoutError ||
      (error instanceof NetworkError && [502, 503, 504].includes(error.status))
    );
  }

  calculateBackoffDelay(attempt) {
    const delay = this.retryConfig.baseDelay *
                  Math.pow(this.retryConfig.backoffMultiplier, attempt - 1);

    // Add jitter để prevent thundering herd
    const jitter = delay * 0.1 * Math.random();

    return Math.min(delay + jitter, this.retryConfig.maxDelay);
  }

  // Fallback strategies
  async handleFailure(data, error) {
    // 1. Try sendBeacon for critical data
    if (this.isCriticalData(data) && navigator.sendBeacon) {
      const success = navigator.sendBeacon(
        this.getCurrentEndpoint(),
        JSON.stringify(data)
      );

      if (success) return { method: 'beacon', success: true };
    }

    // 2. Queue for retry when network recovers
    this.requestQueue.enqueue({
      data,
      timestamp: Date.now(),
      attempts: 0
    });

    // 3. Store in persistent storage
    await this.storeInIndexedDB(data);

    throw error; // Re-throw for upper layers
  }
}
```


#### 💡 Real-world Application: Banking Network Requirements


```javascript
class BankingNetworkManager extends NetworkManager {
  constructor(config) {
    super({
      ...config,
      endpoints: [
        'https://api-primary.bank.com/tracking',
        'https://api-backup.bank.com/tracking',
        'https://api-dr.bank.com/tracking' // Disaster recovery
      ]
    });

    // Banking-specific requirements
    this.encryptionKey = config.encryptionKey;
    this.complianceLogger = new ComplianceLogger();
  }

  async makeRequest(endpoint, data, options) {
    // PII encryption before transmission
    const encryptedData = await this.encryptPII(data);

    // Compliance logging
    this.complianceLogger.logDataTransmission({
      endpoint,
      dataTypes: this.classifyDataTypes(data),
      timestamp: Date.now()
    });

    return super.makeRequest(endpoint, encryptedData, {
      ...options,
      timeout: 5000, // Stricter timeout for banking
      headers: {
        ...options.headers,
        'X-Compliance-Version': '1.0',
        'X-Encryption-Method': 'AES-256-GCM'
      }
    });
  }

  async encryptPII(data) {
    // Identify PII fields
    const piiFields = ['userId', 'accountId', 'ip', 'email'];

    const encrypted = { ...data };

    for (const field of piiFields) {
      if (encrypted[field]) {
        encrypted[field] = await this.encrypt(encrypted[field]);
      }
    }

    return encrypted;
  }

  isCriticalData(data) {
    const criticalTypes = [
      'user.auth.failed',
      'transaction.error',
      'security.breach.attempt'
    ];

    return criticalTypes.includes(data.type);
  }
}
```


### 9. Circuit Breaker Pattern for Resilient Tracking


#### 🌱 Nguồn Gốc & Motivation: Failure Isolation


Circuit Breaker pattern comes from electrical engineering - prevent cascading failures by "breaking the circuit" when faults detected.


In software context:


- **Prevent Resource Exhaustion**: Stop making failing requests
- **Fast Failure**: Return immediately instead of timeout waits
- **System Recovery**: Allow system time to recover
- **Graceful Degradation**: Maintain core functionality


#### 🔬 Bản Chất & Mechanism: Circuit Breaker Implementation


```javascript
class CircuitBreaker {
  constructor(config = {}) {
    this.failureThreshold = config.failureThreshold || 5;
    this.recoveryTimeout = config.recoveryTimeout || 30000;
    this.monitoringWindow = config.monitoringWindow || 60000;

    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.successCount = 0;

    // Sliding window for failure tracking
    this.recentRequests = [];
    this.metrics = {
      totalRequests: 0,
      totalFailures: 0,
      totalSuccesses: 0
    };
  }

  async execute(operation, fallback = null) {
    if (this.state === 'OPEN') {
      if (this.shouldAttemptRecovery()) {
        this.state = 'HALF_OPEN';
        this.successCount = 0;
      } else {
        return this.executeFallback(fallback);
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();

      if (this.state === 'OPEN') {
        return this.executeFallback(fallback);
      }

      throw error;
    }
  }

  onSuccess() {
    this.recordRequest(true);
    this.metrics.totalSuccesses++;

    if (this.state === 'HALF_OPEN') {
      this.successCount++;

      // Recovery successful - close circuit
      if (this.successCount >= Math.ceil(this.failureThreshold / 2)) {
        this.reset();
      }
    } else {
      this.failureCount = 0;
    }
  }

  onFailure() {
    this.recordRequest(false);
    this.metrics.totalFailures++;
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === 'HALF_OPEN') {
      // Recovery failed - open circuit again
      this.state = 'OPEN';
    } else if (this.shouldOpenCircuit()) {
      this.state = 'OPEN';
      this.onCircuitOpened();
    }
  }

  recordRequest(success) {
    const now = Date.now();
    this.recentRequests.push({ success, timestamp: now });

    // Clean old requests outside monitoring window
    this.recentRequests = this.recentRequests.filter(
      req => now - req.timestamp < this.monitoringWindow
    );

    this.metrics.totalRequests++;
  }

  shouldOpenCircuit() {
    // Simple threshold-based
    if (this.failureCount >= this.failureThreshold) {
      return true;
    }

    // Rate-based within monitoring window
    const recentFailures = this.recentRequests.filter(req => !req.success);
    const failureRate = recentFailures.length / this.recentRequests.length;

    return failureRate > 0.5 && this.recentRequests.length >= 10;
  }

  shouldAttemptRecovery() {
    return Date.now() - this.lastFailureTime > this.recoveryTimeout;
  }

  reset() {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
  }

  async executeFallback(fallback) {
    if (typeof fallback === 'function') {
      try {
        return await fallback();
      } catch (error) {
        // Even fallback failed
        throw new CircuitBreakerOpenError('Circuit breaker open and fallback failed');
      }
    }

    // No fallback provided
    throw new CircuitBreakerOpenError('Circuit breaker open - service unavailable');
  }

  onCircuitOpened() {
    // Monitoring và alerting
    console.warn(`Circuit breaker opened - failure threshold reached: ${this.failureCount}/${this.failureThreshold}`);

    // Emit event for external monitoring
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('circuit-breaker-opened', {
        detail: {
          failureCount: this.failureCount,
          lastFailureTime: this.lastFailureTime,
          metrics: this.metrics
        }
      }));
    }
  }

  getStatus() {
    return {
      state: this.state,
      failureCount: this.fail
```


## Claude


```javascript
ureCount: this.failureCount,
     successCount: this.successCount,
     lastFailureTime: this.lastFailureTime,
     recentFailureRate: this.calculateRecentFailureRate(),
     metrics: this.metrics
   };
 }

 calculateRecentFailureRate() {
   if (this.recentRequests.length === 0) return 0;

   const failures = this.recentRequests.filter(req => !req.success).length;
   return failures / this.recentRequests.length;
 }
}
```


#### 💡 Real-world Application: Tracking Circuit Breaker


```javascript
class TrackingCircuitBreaker extends CircuitBreaker {
  constructor(config) {
    super({
      failureThreshold: 3, // Quick to fail for tracking
      recoveryTimeout: 15000, // 15s recovery
      monitoringWindow: 30000, // 30s window
      ...config
    });

    this.fallbackStorage = new IndexedDBFallback();
  }

  async trackEvent(event) {
    return this.execute(
      () => this.sendToServer(event),
      () => this.storeFallback(event) // Fallback to local storage
    );
  }

  async sendToServer(event) {
    const response = await fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.json();
  }

  async storeFallback(event) {
    // Store locally when circuit is open
    await this.fallbackStorage.store(event);

    return {
      stored: true,
      method: 'fallback',
      timestamp: Date.now()
    };
  }
}
```


## PHẦN IV: STAFF+ LEVEL - SYSTEM INSIGHTS & CRITICAL ANALYSIS


### 10. Architecture Critique & Improvement Opportunities


#### Critical Analysis of Current Implementation


**Strengths Identified:**


- Modular plugin architecture enables team scalability
- Tri-queue system provides good priority handling
- Sandbox isolation prevents plugin interference
- Buffer management reduces network overhead


**Architectural Concerns:**


**1. Memory Management Blind Spots**


```javascript
// Current approach has potential memory leaks
class MemoryOptimizedTracker {
  constructor() {
    this.eventPool = new ObjectPool(() => ({}), 100); // Reuse objects
    this.stringInternCache = new Map(); // Intern repeated strings
    this.weakEventRefs = new WeakMap(); // Prevent circular references
  }

  createEvent(type, data) {
    const event = this.eventPool.acquire();
    event.type = this.internString(type);
    event.data = data;
    event.timestamp = Date.now();

    // Register for cleanup
    this.weakEventRefs.set(event, { created: Date.now() });

    return event;
  }

  internString(str) {
    if (!this.stringInternCache.has(str)) {
      this.stringInternCache.set(str, str);
    }
    return this.stringInternCache.get(str);
  }
}
```


**2. Lack of Backpressure Handling**


```javascript
// Missing: Adaptive rate limiting based on system pressure
class AdaptiveRateLimiter {
  constructor() {
    this.baseRate = 100; // events/second
    this.currentRate = this.baseRate;
    this.pressureFactors = {
      memory: 1.0,
      cpu: 1.0,
      network: 1.0,
      battery: 1.0
    };
  }

  shouldAllow(event) {
    this.updatePressureFactors();

    const adjustedRate = this.baseRate * Math.min(...Object.values(this.pressureFactors));
    this.currentRate = Math.max(adjustedRate, 10); // Minimum 10/sec

    return this.tokenBucket.consume(1);
  }

  updatePressureFactors() {
    // Memory pressure
    if (performance.memory) {
      const memUsage = performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit;
      this.pressureFactors.memory = Math.max(0.1, 1 - memUsage);
    }

    // Battery level
    if (navigator.getBattery) {
      navigator.getBattery().then(battery => {
        this.pressureFactors.battery = Math.max(0.2, battery.level);
      });
    }
  }
}
```


**3. Limited Error Recovery Strategy**


```javascript
// Enhanced error recovery with progressive degradation
class RobustErrorRecovery {
  constructor() {
    this.degradationLevels = [
      'full',      // Normal operation
      'reduced',   // Skip low-priority events
      'critical',  // Only critical events
      'offline'    // Local storage only
    ];
    this.currentLevel = 0;
  }

  handleSystemStress(stressLevel) {
    const targetLevel = Math.min(stressLevel, this.degradationLevels.length - 1);

    if (targetLevel > this.currentLevel) {
      this.degradeService(targetLevel);
    } else if (targetLevel < this.currentLevel) {
      this.upgradeService(targetLevel);
    }
  }

  degradeService(level) {
    switch (this.degradationLevels[level]) {
      case 'reduced':
        this.disableLowPriorityTracking();
        break;
      case 'critical':
        this.enableCriticalOnlyMode();
        break;
      case 'offline':
        this.switchToOfflineMode();
        break;
    }
    this.currentLevel = level;
  }
}
```


### 11. Performance Optimization Strategies


#### Advanced Optimization Techniques


**1. Micro-optimization for Hot Paths**


```javascript
// Optimized event processing pipeline
class OptimizedEventProcessor {
  constructor() {
    // Pre-compile regex patterns
    this.patterns = {
      clickEvents: /^(click|tap|touch)$/,
      navEvents: /^(page|route|nav)$/,
      errorEvents: /^(error|exception|crash)$/
    };

    // Use typed arrays for numeric data
    this.timestampBuffer = new Float64Array(1000);
    this.bufferIndex = 0;

    // Pool frequently used objects
    this.eventPool = new Array(100).fill(null).map(() => ({}));
    this.poolIndex = 0;
  }

  processEvent(rawEvent) {
    // Fast path classification
    const eventType = this.classifyEventFast(rawEvent.type);

    // Reuse pooled object
    const event = this.eventPool[this.poolIndex];
    this.poolIndex = (this.poolIndex + 1) % this.eventPool.length;

    // Reset object properties (faster than creating new)
    Object.keys(event).forEach(key => delete event[key]);

    // Copy only necessary properties
    event.type = eventType;
    event.timestamp = this.getHighResTimestamp();

    return event;
  }

  classifyEventFast(type) {
    // Use binary search for large classification sets
    if (this.patterns.clickEvents.test(type)) return 'interaction';
    if (this.patterns.navEvents.test(type)) return 'navigation';
    if (this.patterns.errorEvents.test(type)) return 'error';
    return 'other';
  }
}
```


**2. Intelligent Batching with Compression**


```javascript
class IntelligentBatcher {
  constructor() {
    this.compressionThreshold = 1024; // Compress batches > 1KB
    this.batchSizeOptimizer = new BatchSizeOptimizer();
  }

  async createOptimalBatch(events) {
    // Group similar events for better compression
    const grouped = this.groupSimilarEvents(events);

    // Optimize batch size based on network conditions
    const optimalSize = await this.batchSizeOptimizer.getOptimalSize();

    const batches = [];
    let currentBatch = [];
    let currentSize = 0;

    for (const [eventType, eventGroup] of grouped) {
      const compressed = this.compressEventGroup(eventGroup);

      if (currentSize + compressed.byteLength > optimalSize && currentBatch.length > 0) {
        batches.push(this.finalizeBatch(currentBatch));
        currentBatch = [];
        currentSize = 0;
      }

      currentBatch.push({
        type: eventType,
        events: compressed,
        count: eventGroup.length
      });
      currentSize += compressed.byteLength;
    }

    if (currentBatch.length > 0) {
      batches.push(this.finalizeBatch(currentBatch));
    }

    return batches;
  }

  compressEventGroup(events) {
    // Delta compression for similar events
    if (events.length < 2) return events;

    const [first, ...rest] = events;
    const deltas = rest.map(event => this.calculateDelta(first, event));

    return {
      base: first,
      deltas: deltas,
      compressed: true
    };
  }
}
```


### 12. Scalability Considerations


#### Enterprise-Scale Deployment Patterns


**1. Multi-Tenant Architecture**


```javascript
class MultiTenantTracker {
  constructor() {
    this.tenantContexts = new Map();
    this.sharedResources = new SharedResourcePool();
    this.tenantIsolation = new TenantIsolationManager();
  }

  initializeTenant(tenantId, config) {
    // Isolated context per tenant
    const context = {
      config: this.validateTenantConfig(config),
      sandbox: new ProxySandbox(config.sandboxPermissions),
      buffer: new BufferManager(config.bufferSettings),
      scheduler: new TrackingScheduler(config.schedulingStrategy),
      plugins: new Map()
    };

    // Resource quotas per tenant
    context.quotas = {
      eventsPerSecond: config.eventsPerSecond || 100,
      maxBufferSize: config.maxBufferSize || 1000,
      maxMemoryUsage: config.maxMemoryUsage || 10 * 1024 * 1024
    };

    this.tenantContexts.set(tenantId, context);

    return context;
  }

  track(tenantId, event) {
    const context = this.tenantContexts.get(tenantId);
    if (!context) {
      throw new Error(`Unknown tenant: ${tenantId}`);
    }

    // Quota enforcement
    if (!this.checkQuotas(context, event)) {
      throw new QuotaExceededError(`Tenant ${tenantId} exceeded quotas`);
    }

    // Isolated processing
    return this.tenantIsolation.executeInContext(context, () => {
      return context.scheduler.schedule(() => {
        context.buffer.add(event);
      });
    });
  }
}
```


**2. Horizontal Scaling with Event Distribution**


```javascript
class DistributedTracker {
  constructor(nodeConfig) {
    this.nodeId = nodeConfig.nodeId;
    this.peers = new Map();
    this.consistentHashing = new ConsistentHashRing();
    this.eventDistributor = new EventDistributor();
  }

  async track(event) {
    // Determine responsible node
    const targetNode = this.consistentHashing.getNode(event.userId || event.sessionId);

    if (targetNode === this.nodeId) {
      // Process locally
      return this.processLocally(event);
    } else {
      // Forward to responsible node
      return this.forwardToNode(targetNode, event);
    }
  }

  async forwardToNode(nodeId, event) {
    const peer = this.peers.get(nodeId);
    if (!peer || !peer.isHealthy()) {
      // Fallback to local processing with replication
      const result = await this.processLocally(event);
      this.scheduleReplication(nodeId, event);
      return result;
    }

    return peer.send('track', event);
  }

  handleNodeFailure(failedNodeId) {
    // Redistribute load from failed node
    const affectedKeys = this.consistentHashing.getKeysForNode(failedNodeId);
    this.consistentHashing.removeNode(failedNodeId);

    // Trigger rebalancing
    this.rebalanceLoad(affectedKeys);
  }
}
```


### 13. Privacy & Compliance Architecture


#### GDPR/CCPA Compliant Design


```javascript
class PrivacyCompliantTracker {
  constructor(config) {
    this.privacyConfig = config.privacy || {};
    this.consentManager = new ConsentManager();
    this.dataClassifier = new PIIDataClassifier();
    this.encryption = new FieldLevelEncryption(config.encryptionKey);
  }

  async track(event) {
    // Consent check before processing
    const consent = await this.consentManager.getConsent(event.userId);
    if (!this.hasValidConsent(consent, event)) {
      return this.handleConsentDenied(event);
    }

    // Classify and handle PII
    const classified = this.dataClassifier.classify(event);
    const processed = await this.processByClassification(classified);

    // Apply retention policies
    this.applyRetentionPolicy(processed);

    return this.scheduleForProcessing(processed);
  }

  async processByClassification(classifiedEvent) {
    const processed = { ...classifiedEvent };

    // Handle PII fields
    if (processed.piiFields) {
      for (const field of processed.piiFields) {
        if (this.privacyConfig.encryptPII) {
          processed.data[field] = await this.encryption.encrypt(processed.data[field]);
        } else if (this.privacyConfig.hashPII) {
          processed.data[field] = this.hashField(processed.data[field]);
        } else if (this.privacyConfig.anonymizePII) {
          processed.data[field] = this.anonymizeField(processed.data[field]);
        }
      }
    }

    // Handle sensitive fields differently
    if (processed.sensitiveFields) {
      processed.data = this.redactSensitiveFields(processed.data, processed.sensitiveFields);
    }

    return processed;
  }

  applyRetentionPolicy(event) {
    const retentionPeriod = this.getRetentionPeriod(event.type);
    event._retention = {
      expiresAt: Date.now() + retentionPeriod,
      policy: this.privacyConfig.retentionPolicy
    };
  }
}
```


## Kết Luận: Đánh Giá Tổng Thể và Hướng Phát Triển


Hệ thống tracking SDK được phân tích trong tài liệu thể hiện một kiến trúc tiến bộ với nhiều điểm mạnh:


**Điểm Mạnh:**


- Kiến trúc modular với plugin system cho phép mở rộng
- Tri-queue system cung cấp priority handling tốt
- Sandbox isolation đảm bảo security
- Buffer management tối ưu network usage


**Điểm Cần Cải Tiến:**


- Memory management cần object pooling và weak references
- Thiếu backpressure handling cho high-load scenarios
- Error recovery strategy cần progressive degradation
- Privacy compliance cần field-level encryption và retention policies


**Khuyến Nghị Phát Triển:**


1. **Performance**: Implement micro-optimizations cho hot paths
2. **Scalability**: Multi-tenant architecture với resource quotas
3. **Reliability**: Circuit breaker pattern với intelligent fallbacks
4. **Privacy**: GDPR/CCPA compliance với encryption và data classification


Từ góc nhìn của một Staff+ Engineer, đây là foundation tốt nhưng cần evolution để handle enterprise-scale requirements. Việc áp dụng các advanced patterns như consistent hashing, progressive degradation, và privacy-by-design sẽ biến đây thành world-class tracking system.
