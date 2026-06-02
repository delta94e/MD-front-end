# Frontend Interview Simulation at NAB

## You

An error occurred while trying to run the generated artifact.
Identifier 'trackState' has already been declared  Can you fix this error in unified-debugging-architecture?

## Claude


# Mô phỏng Cuộc Phỏng Vấn Senior Frontend Engineer tại NAB


## Cuộc phỏng vấn kỹ thuật với chủ đề: "Ditch console.log() and embrace the browser debugger"


---


**Interviewer**: Xin chào! Tôi là Sarah Chen, Staff Engineer tại NAB với hơn 12 năm kinh nghiệm trong frontend development. Hôm nay chúng ta sẽ có một cuộc thảo luận kỹ thuật sâu về debugging strategies và nhiều chủ đề khác liên quan đến Senior Frontend Engineer role. Bạn có thể tự giới thiệu một chút không?


**Candidate**: Xin chào Sarah! Tôi là Alex Nguyen, hiện đang làm Senior Frontend Developer với 8 năm kinh nghiệm chuyên sâu về React ecosystem. Tôi đã làm việc với các tech stack như React, Next.js, React Query, Redux, Zustand, và các state management solutions khác. Trong những năm qua, tôi đã lead nhiều projects quy mô lớn, từ e-commerce platforms đến fintech applications với hàng triệu users. **Một trong những điều tôi passionate nhất là code quality và developer experience** - điều này bao gồm cả việc tối ưu debugging workflows và tooling để team có thể work efficiently hơn.


**Interviewer**: Tuyệt vời! Tôi thấy bạn có kinh nghiệm với fintech, điều này rất relevant cho NAB. Hôm nay tôi muốn bắt đầu với một topic mà tôi thấy nhiều developers struggle: debugging practices. Cụ thể, tôi muốn discuss về việc move away from console.log() và embrace browser debugging tools. Trước tiên, bạn có thể share về debugging approach hiện tại của bạn không?


**Candidate**: **Debugging strategy của tôi đã evolve significantly qua những năm qua.** Ban đầu, giống như nhiều developers khác, tôi heavily rely on console.log() để track variable values và execution flow. Nhưng khi work với large-scale applications, đặc biệt trong production environments, tôi nhận ra những limitations:


**Console.log() limitations:**


- **Performance impact**: Excessive logging có thể slow down applications, đặc biệt khi deal với large objects
- **Code pollution**: Forget to remove console statements lead to messy codebase
- **Limited context**: Chỉ see values tại specific moments, không có full execution context
- **Production issues**: Console logs in production có thể expose sensitive data


**Hiện tại debugging workflow của tôi:**


1. **Browser DevTools Debugger** cho interactive debugging
2. **React DevTools** cho component hierarchy và state inspection
3. **Redux/Zustand DevTools** cho state management debugging
4. **Network tab** cho API calls và performance analysis
5. **Performance tab** cho profiling và optimization
6. **Strategic logging** - only when necessary với proper log levels


**Tôi approach debugging systematically**: Reproduce issue → Set breakpoints → Step through execution → Analyze state changes → Identify root cause → Implement fix → Verify solution.


**Interviewer**: Excellent! Tôi thấy bạn có systematic approach. Bây giờ, let's dive deeper. Bạn có thể walk me through cách bạn sử dụng browser debugger để debug một specific scenario không? Ví dụ, một calculator app có bug trong calculation logic - giống như trong article mà bạn có thể đã encounter.


**Candidate**: Absolutely! Tôi sẽ walk through một real-world scenario tương tự mà tôi đã encounter trong một financial calculation feature.


**Scenario**: E-commerce checkout calculator tính wrong total amount - thay vì $39.60, nó return $14105.09.


**Step 1: Reproduce và Setup**


```javascript
// Problematic code structure
function calculateTotal() {
  const subtotal = getSubtotal();
  const tax = getTax();
  const discount = getDiscount();

  const total = subtotal + tax - discount;
  return total;
}
```


**Step 2: Set Strategic Breakpoints**


Thay vì random console.log(), tôi use **targeted breakpoint strategy**:


```javascript
// Set breakpoint at function entry
function calculateTotal() {
  const subtotal = getSubtotal(); // Breakpoint here
  const tax = getTax(); // And here
  const discount = getDiscount(); // And here

  const total = subtotal + tax - discount; // Final calculation breakpoint
  return total;
}
```


**Step 3: Execution Analysis với DevTools**


Khi hit breakpoints, tôi analyze:


- **Scope panel**: Check all local variables và their types
- **Watch expressions**: Monitor specific calculations
- **Call stack**: Understand execution flow


**Key Discovery**: Trong scope panel, tôi notice:


```
subtotal: "1020" (string instead of number)
tax: "89" (string)
discount: 5 (number)
```


**Step 4: Root Cause Analysis**


**The issue**: String concatenation instead of arithmetic addition!


```javascript
// What's happening:
"1020" + "89" - 5 = "102089" - 5 = 102084
```


**Step 5: DOM Input Investigation**


Set breakpoint trong `getSubtotal()`:


```javascript
function getSubtotal() {
  return document.querySelector('#subtotal-input').value; // Returns string!
}
```


**Solution Implementation:**


```javascript
function getSubtotal() {
  return Number(document.querySelector('#subtotal-input').value) || 0;
}

// Or với better error handling:
function getSubtotal() {
  const value = document.querySelector('#subtotal-input').value;
  const numValue = parseFloat(value);
  if (isNaN(numValue)) {
    throw new Error(`Invalid subtotal value: ${value}`);
  }
  return numValue;
}
```


**Advanced Debugging Techniques tôi used:**


1. **Conditional breakpoints**: `console.assert(typeof subtotal === 'number')`
2. **Expression evaluation**: Test fixes directly trong console
3. **Live editing**: Modify code directly trong Sources tab để test solutions


**Interviewer**: Impressive analysis! Tôi thấy bạn không chỉ identify problem mà còn implement robust solution. Bây giờ, let's talk về performance implications. Trong large React applications với complex state management, làm sao bạn debug performance issues mà không affect user experience?


**Candidate**: **Performance debugging trong production React apps là một art form!** Tôi đã develop một comprehensive strategy qua experience với high-traffic fintech applications.


**Production-Safe Debugging Strategy:**


**1. React Profiler Integration**


```javascript
// Custom profiler wrapper for production
import { Profiler } from 'react';

const ProfilerWrapper = ({ id, children, enabled = false }) => {
  const onRenderCallback = (id, phase, actualDuration, baseDuration) => {
    if (enabled && process.env.NODE_ENV !== 'production') {
      console.group(`🚀 ${id} Render Performance`);
      console.log(`Phase: ${phase}`);
      console.log(`Actual Duration: ${actualDuration}ms`);
      console.log(`Base Duration: ${baseDuration}ms`);
      console.groupEnd();
    }
  };

  return enabled ? (
    <Profiler id={id} onRender={onRenderCallback}>
      {children}
    </Profiler>
  ) : children;
};
```


**2. Custom Performance Hooks**


```javascript
// usePerformanceLogger hook
const usePerformanceLogger = (componentName, dependencies = []) => {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(Date.now());

  useEffect(() => {
    renderCount.current += 1;
    const currentTime = Date.now();
    const timeSinceLastRender = currentTime - lastRenderTime.current;

    if (process.env.NODE_ENV === 'development') {
      console.log(`${componentName} render #${renderCount.current}`);
      console.log(`Time since last render: ${timeSinceLastRender}ms`);
    }

    lastRenderTime.current = currentTime;
  }, dependencies);

  return renderCount.current;
};
```


**3. State Management Debugging với Zustand/Redux DevTools**


Cho Zustand stores:


```javascript
import { devtools } from 'zustand/middleware';

const useStore = create(devtools((set, get) => ({
  // Store implementation
  updateUser: (userData) => set(
    (state) => ({ ...state, user: userData }),
    false,
    'updateUser' // Action name for DevTools
  ),
}), {
  name: 'user-store', // Store name in DevTools
  serialize: {
    options: {
      undefined: true, // Include undefined values
      function: true,  // Include functions
    }
  }
}));
```


**4. Memory Leak Detection**


```javascript
// Custom hook to detect memory leaks
const useMemoryMonitor = (componentName) => {
  useEffect(() => {
    if (typeof window !== 'undefined' && window.performance) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'measure') {
            console.log(`${componentName} - ${entry.name}: ${entry.duration}ms`);
          }
        });
      });

      observer.observe({ entryTypes: ['measure'] });

      return () => observer.disconnect();
    }
  }, [componentName]);
};
```


**5. Network Performance Debugging**


Cho React Query optimization:


```javascript
// Custom React Query devtools
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      onError: (error, query) => {
        if (process.env.NODE_ENV === 'development') {
          console.group('🔴 Query Error');
          console.log('Query Key:', query.queryKey);
          console.log('Error:', error);
          console.groupEnd();
        }
      },
      onSuccess: (data, query) => {
        if (process.env.NODE_ENV === 'development') {
          performance.mark(`query-${query.queryHash}-end`);
          performance.measure(
            `Query ${query.queryKey[0]}`,
            `query-${query.queryHash}-start`,
            `query-${query.queryHash}-end`
          );
        }
      }
    }
  }
});
```


**6. Component Re-render Analysis**


Sử dụng **why-did-you-render** trong development:


```javascript
// wdyr.js
import React from 'react';

if (process.env.NODE_ENV === 'development') {
  const whyDidYouRender = require('@welldone-software/why-did-you-render');
  whyDidYouRender(React, {
    trackAllPureComponents: true,
    trackHooks: true,
    logOwnerReasons: true,
    logOnDifferentValues: true,
  });
}
```


**Production Debugging Strategy:**


1. **Feature flags** để enable debugging selectively
2. **Error boundaries** với detailed error reporting
3. **Performance budgets** với automated monitoring
4. **User session recording** integration với LogRocket/FullStory
5. **Real User Monitoring** với custom metrics


**Interviewer**: Fantastic! Tôi appreciate việc bạn consider both development và production scenarios. Bây giờ, let's dig into a coding challenge. Tôi muốn bạn implement một React component mà có thể debug efficiently. Specifically, tôi muốn bạn create một **custom debugging hook** mà có thể track component lifecycle, state changes, và performance metrics. Bạn có thể live code solution không?


**Candidate**: Absolutely! Tôi sẽ create một comprehensive debugging hook mà combines multiple debugging strategies into một reusable solution.


**Candidate**: Tôi vừa implement một comprehensive debugging hook mà tôi thường sử dụng trong production projects. **Highlight key features:**


**1. Lifecycle Tracking**: Monitors mount/unmount/render cycles với detailed timing
**2. State Change Detection**: Tracks tất cả state mutations với old/new value comparison

**3. Performance Monitoring**: Sử dụng Performance API để measure execution time
**4. Props Change Analysis**: Detects và logs prop changes với deep comparison
**5. Debug Utilities**: Provides methods để inspect và manage debug history


**Key implementation insights:**


- **Conditional enabling**: Only active trong development để avoid production overhead
- **Memory management**: Proper cleanup trong useEffect return để prevent memory leaks
- **Performance optimization**: Sử dụng useCallback và useMemo để avoid unnecessary re-renders
- **Flexible configuration**: Options object để customize debugging behavior per component


**Advanced features:**


- **Performance marks**: Integration với browser Performance API
- **Deep object comparison**: JSON.stringify cho accurate change detection
- **Historical tracking**: Maintains complete history của state/props changes
- **Structured logging**: Organized console output với grouping và styling


Bạn có thể see trong demo việc nó tracks mọi thứ from component lifecycle đến performance metrics một cách comprehensive.


**Interviewer**: Excellent implementation! Tôi thấy bạn handle edge cases như memory cleanup và performance optimization rất well. Bây giờ, let me ask về specific debugging scenarios trong production. **Scenario**: Bạn có một React application với 10,000+ concurrent users, và bạn notice intermittent performance issues chỉ affecting specific user sessions. Traditional debugging tools không sufficient vì issue chỉ reproduce under specific conditions. How would you approach this?


**Candidate**: **Đây là exact scenario tôi đã face trong previous fintech project!** Intermittent issues under load require một completely different debugging strategy. Let me walk through comprehensive approach:


**1. Production-Safe Error Boundaries với Context Collection**


```javascript
class ProductionErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Collect comprehensive context
    const debugContext = {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      errorInfo,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      sessionId: this.getSessionId(),
      userId: this.getUserId(),

      // Performance context
      memory: performance.memory ? {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
      } : null,

      // Network context
      connection: navigator.connection ? {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt
      } : null,

      // React context
      componentStack: errorInfo.componentStack,
      renderCount: this.getRenderCount(),

      // Application state snapshot
      reduxState: this.getReduxSnapshot(),
      localStorageSnapshot: this.getLocalStorageSnapshot()
    };

    // Send to error tracking service
    this.reportError(debugContext);
  }

  getSessionId = () => {
    return sessionStorage.getItem('sessionId') || 'unknown';
  }

  getUserId = () => {
    // Get from Redux store or context
    return window.__REDUX_STORE__?.getState()?.user?.id || 'anonymous';
  }

  getRenderCount = () => {
    return window.__DEBUG_RENDER_COUNT__ || 0;
  }

  getReduxSnapshot = () => {
    try {
      const state = window.__REDUX_STORE__?.getState();
      // Only capture safe, non-sensitive data
      return {
        user: { id: state?.user?.id, role: state?.user?.role },
        ui: state?.ui,
        navigation: state?.navigation,
        // Exclude sensitive data
      };
    } catch {
      return null;
    }
  }

  reportError = async (context) => {
    try {
      await fetch('/api/error-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(context)
      });
    } catch {
      // Fallback to local storage cho offline scenarios
      const errors = JSON.parse(localStorage.getItem('offlineErrors') || '[]');
      errors.push(context);
      localStorage.setItem('offlineErrors', JSON.stringify(errors.slice(-10)));
    }
  }
}
```


**2. Performance Monitoring với User-Specific Metrics**


```javascript
// Advanced performance monitoring hook
const useProductionPerformanceMonitor = (userId, sessionId) => {
  const metricsBuffer = useRef([]);
  const lastReportTime = useRef(Date.now());

  const reportMetric = useCallback((metricName, value, metadata = {}) => {
    const metric = {
      name: metricName,
      value,
      timestamp: Date.now(),
      userId,
      sessionId,
      url: window.location.pathname,
      metadata: {
        ...metadata,
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      }
    };

    metricsBuffer.current.push(metric);

    // Batch send metrics every 30 seconds
    if (Date.now() - lastReportTime.current > 30000) {
      sendMetricsBatch();
    }
  }, [userId, sessionId]);

  const sendMetricsBatch = useCallback(async () => {
    if (metricsBuffer.current.length === 0) return;

    const batch = [...metricsBuffer.current];
    metricsBuffer.current = [];
    lastReportTime.current = Date.now();

    try {
      await fetch('/api/performance-metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metrics: batch })
      });
    } catch {
      // Re-add to buffer if failed
      metricsBuffer.current = batch.concat(metricsBuffer.current);
    }
  }, []);

  // Monitor specific performance patterns
  useEffect(() => {
    // Long task monitoring
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.duration > 50) { // Tasks longer than 50ms
          reportMetric('long-task', entry.duration, {
            startTime: entry.startTime,
            name: entry.name
          });
        }
      });
    });

    observer.observe({ entryTypes: ['longtask'] });

    // Memory pressure monitoring
    const checkMemory = () => {
      if (performance.memory) {
        const usedPercent = (performance.memory.usedJSHeapSize /
                           performance.memory.jsHeapSizeLimit) * 100;

        if (usedPercent > 80) {
          reportMetric('memory-pressure', usedPercent);
        }
      }
    };

    const memoryInterval = setInterval(checkMemory, 60000);

    return () => {
      observer.disconnect();
      clearInterval(memoryInterval);
      sendMetricsBatch(); // Send final batch
    };
  }, [reportMetric, sendMetricsBatch]);

  return { reportMetric };
};
```


**3. Session Recording Integration với Conditional Sampling**


```javascript
// Smart session recording based on user behavior
const useConditionalSessionRecording = (userId, conditions) => {
  useEffect(() => {
    const shouldRecord = () => {
      // Record based on specific conditions
      return conditions.some(condition => {
        switch (condition.type) {
          case 'user_segment':
            return condition.segments.includes(getUserSegment(userId));
          case 'error_rate':
            return getErrorRate() > condition.threshold;
          case 'performance_issue':
            return getAverageLoadTime() > condition.threshold;
          case 'random_sampling':
            return Math.random() < condition.percentage;
          default:
            return false;
        }
      });
    };

    if (shouldRecord()) {
      // Initialize LogRocket or similar
      window.LogRocket?.init('app-id');
      window.LogRocket?.identify(userId, {
        name: getUserName(userId),
        email: getUserEmail(userId),
        segment: getUserSegment(userId)
      });
    }
  }, [userId, conditions]);
};
```


**4. Real-Time Issue Detection với Machine Learning Insights**


```javascript
// Anomaly detection for performance patterns
const useAnomalyDetection = (userId) => {
  const performanceHistory = useRef([]);
  const baselineMetrics = useRef(null);

  const detectAnomaly = useCallback((currentMetrics) => {
    if (!baselineMetrics.current) {
      // Build baseline from first 10 data points
      performanceHistory.current.push(currentMetrics);
      if (performanceHistory.current.length >= 10) {
        baselineMetrics.current = calculateBaseline(performanceHistory.current);
      }
      return false;
    }

    // Statistical anomaly detection
    const zScore = calculateZScore(currentMetrics, baselineMetrics.current);
    const isAnomaly = Math.abs(zScore) > 2; // 2 standard deviations

    if (isAnomaly) {
      // Report anomaly với context
      reportAnomaly({
        userId,
        currentMetrics,
        baseline: baselineMetrics.current,
        zScore,
        timestamp: Date.now(),
        sessionContext: captureSessionContext()
      });
    }

    return isAnomaly;
  }, [userId]);

  const calculateBaseline = (history) => {
    const avgLoadTime = history.reduce((sum, h) => sum + h.loadTime, 0) / history.length;
    const avgMemoryUsage = history.reduce((sum, h) => sum + h.memoryUsage, 0) / history.length;

    return {
      loadTime: {
        mean: avgLoadTime,
        stdDev: calculateStdDev(history.map(h => h.loadTime), avgLoadTime)
      },
      memoryUsage: {
        mean: avgMemoryUsage,
        stdDev: calculateStdDev(history.map(h => h.memoryUsage), avgMemoryUsage)
      }
    };
  };

  return { detectAnomaly };
};
```


**5. A/B Testing Integration cho Debugging**


```javascript
// Debug different user cohorts separately
const useDebugCohorts = (userId) => {
  const cohort = useMemo(() => {
    const hash = simpleHash(userId);
    return hash % 100; // 0-99
  }, [userId]);

  const debugLevel = useMemo(() => {
    if (cohort < 1) return 'verbose'; // 1% get verbose logging
    if (cohort < 5) return 'detailed'; // 4% get detailed logging
    if (cohort < 20) return 'standard'; // 15% get standard logging
    return 'minimal'; // 80% get minimal logging
  }, [cohort]);

  return { cohort, debugLevel };
};
```


**Key strategies for production debugging:**


1. **Selective instrumentation**: Chỉ monitor specific user cohorts để minimize performance impact
2. **Context preservation**: Capture complete application state khi errors occur
3. **Temporal correlation**: Track metrics over time để identify patterns
4. **User journey mapping**: Reconstruct user actions leading to issues
5. **Performance budgets**: Automated alerting khi metrics exceed thresholds
6. **Distributed tracing**: Track requests across microservices architecture


**Tools integration:**


- **Sentry** cho error tracking với release correlation
- **LogRocket** cho session replay với performance correlation
- **DataDog RUM** cho real user monitoring
- **Custom dashboards** với Grafana cho metric visualization


**Interviewer**: Impressive! Bạn có comprehensive approach to production debugging. Tôi thấy bạn balance user privacy, performance impact, và debugging effectiveness rất well. Bây giờ, let's dive deeper into specific React debugging scenarios. **Advanced Question**: Trong một large React application với complex component tree, làm sao bạn debug issues liên quan đến **React Context performance problems** và **unnecessary re-renders** across nested components? Đặc biệt khi có multiple context providers và complex dependency chains?


**Candidate**: **Đây là one of the most challenging debugging scenarios trong large React applications!** Context performance issues thường subtle và difficult to detect until they cause significant performance problems. Tôi đã develop một systematic approach:


**1. Context Performance Profiling Strategy**


```javascript
// Enhanced Context with built-in performance monitoring
const createMonitoredContext = (name, defaultValue) => {
  const Context = React.createContext(defaultValue);
  const subscribers = new Set();
  const renderMetrics = new Map();

  // Custom provider với performance tracking
  const Provider = ({ children, value }) => {
    const [subscribers, setSubscribers] = useState(new Set());
    const renderCount = useRef(0);
    const lastRenderTime = useRef(Date.now());
    const valueHistory = useRef([]);

    // Track value changes và their impact
    const previousValue = useRef(value);
    useEffect(() => {
      const currentTime = Date.now();
      const timeSinceLastRender = currentTime - lastRenderTime.current;

      if (JSON.stringify(value) !== JSON.stringify(previousValue.current)) {
        const change = {
          timestamp: currentTime,
          previousValue: previousValue.current,
          newValue: value,
          subscriberCount: subscribers.size,
          timeSinceLastChange: timeSinceLastRender
        };

        valueHistory.current.push(change);

        // Log significant changes
        if (process.env.NODE_ENV === 'development') {
          console.group(`🔄 ${name} Context Value Change`);
          console.log('Previous:', previousValue.current);
          console.log('New:', value);
          console.log('Subscribers affected:', subscribers.size);
          console.log('Time since last change:', timeSinceLastRender + 'ms');
          console.groupEnd();
        }

        // Alert for frequent changes
        if (timeSinceLastRender < 16) { // Less than one frame
          console.warn(`⚠️ ${name} Context changing too frequently (${timeSinceLastRender}ms)`);
        }
      }

      previousValue.current = value;
      lastRenderTime.current = currentTime;
    }, [value, subscribers.size]);

    // Enhanced context value với debugging utilities
    const enhancedValue = useMemo(() => ({
      ...value,
      __debug: {
        contextName: name,
        renderCount: renderCount.current,
        subscriberCount: subscribers.size,
        valueHistory: valueHistory.current.slice(-10), // Last 10 changes
        getMetrics: () => ({
          totalRenders: renderCount.current,
          totalValueChanges: valueHistory.current.length,
          averageTimeBetweenChanges: valueHistory.current.length > 1
            ? (Date.now() - valueHistory.current[0].timestamp) / valueHistory.current.length
            : 0,
          subscriberCount: subscribers.size
        })
      }
    }), [value, subscribers.size]);

    return (
      <Context.Provider value={enhancedValue}>
        {children}
      </Context.Provider>
    );
  };

  // Enhanced hook với subscription tracking
  const useContext = () => {
    const context = React.useContext(Context);
    const componentName = useComponentName(); // Custom hook to get component name
    const renderCount = useRef(0);
    const subscriptionTime = useRef(Date.now());

    useEffect(() => {
      // Register subscriber
      const subscriber = {
        componentName,
        subscriptionTime: subscriptionTime.current,
        renderCount: renderCount.current
      };

      subscribers.add(subscriber);

      if (process.env.NODE_ENV === 'development') {
        console.log(`📡 ${componentName} subscribed to ${name} Context`);
      }

      return () => {
        subscribers.delete(subscriber);
        if (process.env.NODE_ENV === 'development') {
          console.log(`🔌 ${componentName} unsubscribed from ${name} Context`);
        }
      };
    }, [componentName]);

    // Track render count
    renderCount.current += 1;

    return context;
  };

  return { Provider, useContext, Context };
};
```


**2. Component Re-render Analysis Tool**


```javascript
// Advanced re-render tracking
const useRenderTracker = (componentName, props = {}, deps = []) => {
  const renderCount = useRef(0);
  const previousProps = useRef(props);
  const previousDeps = useRef(deps);
  const renderTimes = useRef([]);
  const causeAnalysis = useRef([]);

  useEffect(() => {
    renderCount.current += 1;
    const renderTime = Date.now();
    renderTimes.current.push(renderTime);

    // Analyze render cause
    const causes = [];

    // Check props changes
    Object.keys(props).forEach(key => {
      if (props[key] !== previousProps.current[key]) {
        causes.push({
          type: 'prop',
          key,
          previousValue: previousProps.current[key],
          newValue: props[key]
        });
      }
    });

    // Check deps changes
    deps.forEach((dep, index) => {
      if (dep !== previousDeps.current[index]) {
        causes.push({
          type: 'dependency',
          index,
          previousValue: previousDeps.current[index],
          newValue: dep
        });
      }
    });

    if (causes.length === 0 && renderCount.current > 1) {
      causes.push({ type: 'unknown', reason: 'No prop or dep changes detected' });
    }

    causeAnalysis.current.push({
      renderNumber: renderCount.current,
      timestamp: renderTime,
      causes
    });

    // Performance analysis
    if (renderTimes.current.length > 1) {
      const timeBetweenRenders = renderTime - renderTimes.current[renderTimes.current.length - 2];

      if (timeBetweenRenders < 16) { // Less than 1 frame
        console.warn(`⚡ ${componentName} rendered too frequently (${timeBetweenRenders}ms between renders)`);
      }
    }

    // Log detailed render info
    if (process.env.NODE_ENV === 'development') {
      console.group(`🎨 ${componentName} Render #${renderCount.current}`);
      if (causes.length > 0) {
        console.log('Render causes:', causes);
      }
      console.log('Props:', props);
      console.log('Dependencies:', deps);
      console.groupEnd();
    }

    previousProps.current = props;
    previousDeps.current = deps;
  });

  return {
    renderCount: renderCount.current,
    getRenderAnalysis: () => ({
      totalRenders: renderCount.current,
      averageTimeBetweenRenders: renderTimes.current.length > 1
        ? (renderTimes.current[renderTimes.current.length - 1] - renderTimes.current[0]) / (renderTimes.current.length - 1)
        : 0,
      renderCauses: causeAnalysis.current.slice(-10),
      frequentCauses: getFrequentCauses(causeAnalysis.current)
    })
  };
};

// Helper to identify frequent render causes
const getFrequentCauses = (analysis) => {
  const causeFrequency = {};

  analysis.forEach(render => {
    render.causes.forEach(cause => {
      const key = `${cause.type}-${cause.key || cause.index || 'unknown'}`;
      causeFrequency[key] = (causeFrequency[key] || 0) + 1;
    });
  });

  return Object.entries(causeFrequency)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5); // Top 5 causes
};
```


**3. Context Dependency Analyzer**


```javascript
// Analyze context dependency chains
const useContextDependencyAnalyzer = () => {
  const contexts = useRef(new Map());
  const dependencies = useRef(new Map());

  const trackContextUsage = (contextName, componentName, dependencies) => {
    if (!contexts.current.has(contextName)) {
      contexts.current.set(contextName, new Set());
    }
    contexts.current.get(contextName).add(componentName);

    dependencies.current.set(`${contextName}-${componentName}`, dependencies);
  };

  const analyzeDependencyChain = () => {
    const analysis = {};

    contexts.current.forEach((components, contextName) => {
      analysis[contextName] = {
        subscriberCount: components.size,
        subscribers: Array.from(components),
        potentialOptimizations: []
      };

      // Detect potential optimizations
      if (components.size > 10) {
        analysis[contextName].potentialOptimizations.push(
          'Consider splitting context - too many subscribers'
        );
      }

      // Check for unnecessary dependencies
      const contextDeps = Array.from(components).map(comp =>
        dependencies.current.get(`${contextName}-${comp}`) || []
      );

      const allDeps = new Set(contextDeps.flat());
      if (allDeps.size > 5) {
        analysis[contextName].potentialOptimizations.push(
          'Context contains too many different data types - consider splitting'
        );
      }
    });

    return analysis;
  };

  return { trackContextUsage, analyzeDependencyChain };
};
```


**4. Advanced Context Optimization Patterns**


```javascript
// Context splitting pattern với automatic optimization
const createOptimizedContext = (initialState, options = {}) => {
  const { splitThreshold = 5, autoSplit = true } = options;

  // Track which parts of state are accessed together
  const accessPatterns = useRef(new Map());

  const StateContext = createContext(initialState);
  const DispatchContext = createContext(null);

  const Provider = ({ children }) => {
    const [state, dispatch] = useReducer(reducer, initialState);
    const accessTracker = useRef(new Set());

    // Track state access patterns
    const trackAccess = (key) => {
      accessTracker.current.add(key);

      // Analyze patterns every 100 accesses
      if (accessTracker.current.size % 100 === 0) {
        analyzeAccessPatterns();
      }
    };

    const analyzeAccessPatterns = () => {
      const patterns = Array.from(accessTracker.current);

      // Find frequently co-accessed properties
      const coAccessMatrix = calculateCoAccessMatrix(patterns);

      // Suggest context splits
      if (autoSplit && shouldSplitContext(coAccessMatrix, splitThreshold)) {
        console.warn(`🔄 Consider splitting context based on access patterns:`,
                    suggestSplits(coAccessMatrix));
      }
    };

    // Memoized state với access tracking
    const trackedState = useMemo(() => {
      return new Proxy(state, {
        get(target, prop) {
          trackAccess(prop);
          return target[prop];
        }
      });
    }, [state]);

    return (
      <StateContext.Provider value={trackedState}>
        <DispatchContext.Provider value={dispatch}>
          {children}
        </DispatchContext.Provider>
      </StateContext.Provider>
    );
  };

  return { StateContext, DispatchContext, Provider };
};
```


**5. Component Tree Performance Visualizer**


```javascript
// React DevTools integration for performance visualization
const usePerformanceVisualizer = () => {
  const componentMetrics = useRef(new Map());

  const recordComponentMetric = (componentName, metric) => {
    if (!componentMetrics.current.has(componentName)) {
      componentMetrics.current.set(componentName, []);
    }
    componentMetrics.current.get(componentName).push({
      ...metric,
      timestamp: Date.now()
    });
  };

  const generatePerformanceReport = () => {
    const report = {};

    componentMetrics.current.forEach((metrics, componentName) => {
      const recentMetrics = metrics.slice(-50); // Last 50 metrics

      report[componentName] = {
        totalRenders: recentMetrics.length,
        averageRenderTime: recentMetrics.reduce((sum, m) => sum + (m.renderTime || 0), 0) / recentMetrics.length,
        renderFrequency: calculateRenderFrequency(recentMetrics),
        performanceScore: calculatePerformanceScore(recentMetrics),
        recommendations: generateRecommendations(recentMetrics)
      };
    });

    return report;
  };

  const calculatePerformanceScore = (metrics) => {
    const avgRenderTime = metrics.reduce((sum, m) => sum + (m.renderTime || 0), 0) / metrics.length;
    const renderFreq = calculateRenderFrequency(metrics);

    // Score based on render time và frequency
    let score = 100;
    if (avgRenderTime > 16) score -= 20; // Over 1 frame
    if (avgRenderTime > 33) score -= 30; // Over 2 frames
    if (renderFreq > 60) score -= 25; // Over 60 renders per second

    return Math.max(0, score);
  };

  return { recordComponentMetric, generatePerformanceReport };
};
```


**Advanced debugging workflow:**


1. **Context audit**: Map all context dependencies và subscriber relationships
2. **Performance profiling**: Use React Profiler với custom metrics collection
3. **Access pattern analysis**: Track which context values are accessed together
4. **Optimization recommendations**: Automated suggestions cho context splitting
5. **Visual dependency mapping**: Generate diagrams của component re-render chains
6. **A/B testing**: Compare performance với và without optimizations


**Tools integration:**


- **React DevTools Profiler** với custom marks
- **Chrome DevTools Performance** cho detailed timing analysis
- **why-did-you-render** cho development debugging
- **Custom performance dashboards** cho monitoring production context performance


**Interviewer**: Outstanding! Bạn demonstrate deep understanding của React internals và performance optimization strategies. Tôi particularly impressed với cách bạn combine theoretical knowledge với practical tooling solutions.


Bây giờ, let's move to our final technical challenge. **Complex Scenario**: Bạn join một team đang maintain một legacy React application với mixed patterns - có component sử dụng class components, functional components với hooks, Redux, Context API, và local state scattered throughout. Application có performance issues và inconsistent debugging practices across team members.


**Your task**: Design và implement một **unified debugging strategy** mà có thể work across all these patterns và gradually modernize debugging practices. Bạn cần consider team adoption, legacy code constraints, và migration path. Can you architect this solution?


**Candidate**: **Đây là exact situation tôi faced khi join previous team!** Legacy applications với mixed patterns require một gradual, non-disruptive approach. Tôi sẽ design một comprehensive debugging architecture mà supports all patterns while gradually encouraging modern practices.


**Candidate**: Tôi vừa implement một comprehensive unified debugging architecture mà addresses all challenges của legacy React applications. **Key architectural decisions:**


**1. Universal Debug Manager Pattern**


- **Central hub** mà coordinates debugging across all component patterns
- **Global accessibility** cho legacy code integration
- **Configurable** để adapt different team needs và migration stages
- **Performance-conscious** với built-in cleanup và optimization


**2. Non-Disruptive Integration Strategy**


- **HOC wrapper** cho class components - zero code changes required
- **Enhanced hooks** cho modern components với backward compatibility
- **Middleware pattern** cho Redux integration
- **Progressive enhancement** - team có thể adopt gradually


**3. Team Migration Support**


- **Visual dashboard** với migration progress tracking
- **Pattern analysis** để identify modernization opportunities
- **Automated recommendations** based on usage patterns
- **Clear adoption path** from legacy to modern debugging practices


**4. Production Readiness**


- **Conditional enabling** để avoid production overhead
- **Memory management** với automatic cleanup
- **Error boundaries** trong debugging infrastructure
- **Persistence options** cho offline debugging


**Key benefits for team adoption:**


1. **Immediate value**: Works với existing codebase immediately
2. **Low friction**: No breaking changes or major refactoring required
3. **Educational**: Visual insights help team understand modernization benefits
4. **Scalable**: Architecture grows với team's modernization efforts
5. **Standards**: Establishes consistent debugging practices across patterns


**Migration strategy:**


- **Phase 1**: Deploy unified debugging infrastructure
- **Phase 2**: Gradual conversion của high-traffic components
- **Phase 3**: Team training on modern debugging practices
- **Phase 4**: Sunset legacy patterns as modernization completes


**Production deployment considerations:**


- Feature flags để control debugging granularity
- Performance budgets với automated monitoring
- Team dashboard integration với existing monitoring tools
- Documentation và training materials cho onboarding


**Interviewer**: Exceptional work! Bạn đã demonstrate comprehensive understanding của both technical implementation và practical team dynamics. Tôi particularly impressed với cách bạn balance immediate needs với long-term modernization goals.


Trước khi chúng ta wrap up, tôi có một final question về **leadership và mentoring**. Với experience mà bạn vừa demonstrate, làm sao bạn would approach **mentoring junior developers** về debugging best practices? Đặc biệt khi họ still heavily rely on console.log() và chưa familiar với advanced debugging tools?


**Candidate**: **Mentoring junior developers về debugging là one of my favorite responsibilities!** Tôi approach this với structured learning path mà builds confidence gradually:


**1. Meet Them Where They Are**


Thay vì immediately criticize console.log(), tôi start bằng cách improve their current practices:


```javascript
// Phase 1: Enhanced console.log practices
// From: console.log(user)
// To: Structured logging
console.group('🔍 User Data Analysis');
console.log('User ID:', user.id);
console.log('User Role:', user.role);
console.log('Last Login:', user.lastLogin);
console.table(user.permissions);
console.groupEnd();

// Introduce console methods they don't know
console.time('API Call');
// ... API call
console.timeEnd('API Call');

console.assert(user.id, 'User ID should exist');
console.warn('Deprecated feature used:', user.legacyField);
```


**2. Gradual Tool Introduction**


Tôi introduce debugging tools through **practical scenarios**:


```javascript
// Week 1: Browser DevTools basics
// Show them Sources tab during code review
// Demonstrate: "Instead of console.log here, let's set a breakpoint"

// Week 2: React DevTools
// Show component tree exploration
// Demonstrate props/state inspection without code changes

// Week 3: Network debugging
// Show how to debug API calls in Network tab
// Connect API issues to component behavior

// Week 4: Performance debugging
// Introduction to Performance tab
// Show how rendering performance affects user experience
```


**3. Hands-On Pairing Sessions**


Tôi schedule regular **debugging sessions** where we work together:


```javascript
// Real scenario: "Let's debug this together"
const DebugSessionExample = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Junior approach: console.log everywhere
  // console.log('Component rendered');
  // console.log('Loading state:', loading);
  // console.log('Error state:', error);

  // Guided improvement: "Let's use debugger instead"
  const handleSubmit = async () => {
    setLoading(true);
    debugger; // "Set breakpoint here, let's step through together"

    try {
      const result = await apiCall();
      debugger; // "Check the result in DevTools"
      setData(result);
    } catch (err) {
      debugger; // "Let's inspect this error object"
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
};
```


**4. Interactive Learning Exercises**


Tôi create **debugging challenges** mà progressively build skills:


```javascript
// Exercise 1: "Find the bug using only DevTools"
const BuggyComponent = () => {
  const [count, setCount] = useState('0'); // Bug: string instead of number

  const increment = () => {
    setCount(count + 1); // This will concatenate!
  };

  // Challenge: Find và fix without console.log
  return <div onClick={increment}>Count: {count}</div>;
};

// Exercise 2: "Performance detective"
const SlowComponent = () => {
  const [items, setItems] = useState([]);

  // Intentionally inefficient - use Performance tab to identify
  const processedItems = items.map(item => ({
    ...item,
    processed: heavyComputation(item) // Called on every render!
  }));

  return <div>{processedItems.map(item => <div key={item.id}>{item.name}</div>)}</div>;
};
```


**5. Build Debugging Confidence**


```javascript
// Teaching systematic debugging approach
const DebuggingWorkflow = {
  step1: "Reproduce the issue consistently",
  step2: "Form hypothesis about the cause",
  step3: "Use appropriate debugging tool",
  step4: "Test hypothesis với breakpoints/inspection",
  step5: "Implement fix",
  step6: "Verify solution works",
  step7: "Prevent similar issues"
};

// Example walkthrough:
// "User clicks button, nothing happens"
// 1. Can you reproduce it? Always? Sometimes?
// 2. What might cause this? Event handler? State? API?
// 3. Let's check Event Listeners tab in DevTools
// 4. Set breakpoint in click handler
// 5. Step through execution
// 6. Found it! Missing setState call
// 7. Add unit test to prevent regression
```


**6. Create Safe Learning Environment**


- **No judgment** về current debugging habits
- **Celebrate discoveries** khi họ find bugs using new tools
- **Share my mistakes** - "I once spent 3 hours on a bug that DevTools would have shown immediately"
- **Encourage experimentation** - "Try different DevTools features, break things safely"


**7. Practical Mentoring Techniques**


```javascript
// Code review approach
// Instead of: "Don't use console.log"
// Say: "Great catch on this logic! Let me show you how DevTools
//       can help you debug this more efficiently next time"

// Pair programming approach
// Let them drive, I guide:
// "What tool do you think would help us understand what's happening here?"
// "What information do we need to solve this?"
// "Let's explore the DevTools together"

// Knowledge sharing sessions
// Monthly team sessions:
// - "Debugging technique of the month"
// - "Share your coolest DevTools discovery"
// - "Debug this mystery bug together"
```


**8. Progressive Skill Building Path**


**Beginner**: Console methods → Browser DevTools basics → React DevTools
**Intermediate**: Performance debugging → Network analysis → Redux DevTools

**Advanced**: Production debugging → Custom debugging tools → Mentoring others


**9. Measuring Progress**


- **Code review feedback**: Less console.log, more systematic debugging
- **Bug resolution time**: Faster identification và fixes
- **Tool adoption**: Natural use của DevTools during development
- **Knowledge sharing**: Junior developers helping others với debugging


**Key mentoring principles:**


- **Patience**: Everyone learns debugging at different pace
- **Practical focus**: Always connect tools to real problems they're solving
- **Incremental improvement**: Small wins build confidence
- **Lead by example**: Use debugging tools during all our coding sessions


**Success metrics:**


- Junior developers naturally reach for DevTools instead of console.log
- They can effectively debug their own issues
- They start teaching debugging techniques to newer team members
- Code quality improves through better debugging practices


**Interviewer**: Outstanding! Bạn demonstrate not only technical excellence nhưng also strong leadership qualities và understanding của how to develop others. Your mentoring approach shows patience, structure, và practical wisdom.


**Final Assessment**: Throughout cuộc phỏng vấn này, bạn đã consistently demonstrate:


✅ **Technical Excellence**: Deep knowledge của React ecosystem, debugging tools, và performance optimization
✅ **Problem-Solving Skills**: Systematic approach to complex debugging scenarios

✅ **Communication**: Clear explanations của technical concepts với practical examples
✅ **Innovation**: Creative solutions cho legacy system modernization
✅ **Leadership**: Thoughtful mentoring approach và team development strategies


**This concludes our technical interview. Based on your performance, tôi would recommend you for the Senior Frontend Engineer position tại NAB. Your combination của technical depth, practical experience, và mentoring capabilities aligns perfectly với our requirements.**


**Any final questions about the role or NAB's engineering culture?**


**Candidate**: Cảm ơn Sarah! Tôi rất excited về opportunity này. Tôi có một few final questions:


1. **Technical growth**: What opportunities does NAB provide cho Senior Engineers để stay current với evolving frontend technologies?
2. **Team dynamics**: How does NAB balance innovation với reliability requirements trong financial services context?
3. **Impact scope**: What kind của user-facing features would I be working on, và what's the typical user base size?
4. **Learning culture**: Does NAB support conference attendance, internal tech talks, hoặc open source contributions?


**Interviewer**: Excellent questions! Let me address each:


1. **Technical Growth**: NAB invests heavily trong continuous learning - quarterly tech allowances, internal engineering conferences, dedicated learning time, và encouragement để experiment với new technologies trong innovation sprints.
2. **Team Balance**: We follow "innovation with guardrails" approach - encourage experimentation trong non-critical paths while maintaining strict reliability standards cho core banking features. Regular architecture reviews ensure we balance both goals.
3. **Impact Scope**: You'd work on features serving millions của customers across Australia - from online banking interfaces đến mobile app experiences. Very high-scale, high-impact work.
4. **Learning Culture**: Absolutely! Conference budget, internal tech talks monthly, encouraged open source contributions (với IP guidelines), và regular knowledge sharing sessions.


**Welcome to the team! HR will follow up với details soon.**


---


## Tổng kết cuộc phỏng vấn


**Duration**: ~3 giờ technical interview
**Score**: L6 Senior Frontend Engineer level
**Key Strengths**:


- Comprehensive debugging expertise
- Production-ready code implementation
- Legacy system modernization experience
- Strong mentoring capabilities
- Systematic problem-solving approach


**Technical areas covered**:


- Browser debugging tools mastery
- React performance optimization
- Context API debugging strategies
- Legacy code modernization
- Production debugging architectures
- Team leadership và mentoring practices


## Claude


I see the issue! There's a naming conflict in the `useUnifiedDebug` hook where `trackState` is used both as a boolean option and as a function name. Let me fix this:


Fixed! The issue was a naming conflict where `trackState` was used both as:


1. A boolean option in the destructured `options` object
2. A function name for the callback


I renamed the boolean option from `trackState` to `enableStateTracking` to avoid the conflict. The debugging architecture should now work properly without any naming collision errors.


The fix changes:


- `trackState = true` → `enableStateTracking = true` in the options destructuring
- Updated the condition check to use `enableStateTracking` instead of the conflicting `trackState`
- Added the missing dependency to the useCallback dependency array
