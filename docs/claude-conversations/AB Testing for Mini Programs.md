# AB Testing for Mini Programs

## You

Continue

## Claude


# Phân Tích Chuyên Sâu: AB Testing Cho Mini Programs - Từ First Principles Đến Production Scale


*Từ góc nhìn của một Principal Front-end Engineer với kinh nghiệm tại NAB, Axon, Binance, Webflow, Figma*


---


## Mở Đầu: Tại Sao AB Testing Lại Quan Trọng Đến Vậy?


💭 **Think Out Loud - Suy nghĩ thầm lặng:**


>
> Khi tôi lần đầu tiên gặp khái niệm AB testing tại NAB, tôi đã confused: "Tại sao chúng ta không thể chỉ đơn giản là deploy feature mới cho tất cả users luôn?" Aha moment của tôi đến khi một production bug ảnh hưởng đến 2 triệu customers - tôi nhận ra rằng "fail fast, fail small" không chỉ là một slogan mà là survival strategy trong scale.
>
>


Trước khi đi sâu vào technical implementation, chúng ta cần hiểu **tại sao** AB testing tồn tại. Đây không chỉ là một technical practice, mà là một **risk management strategy** và **data-driven decision making framework**.


### 🌱 Nguồn Gốc & Motivation


**Problem Statement:**
Trong thế giới software development, mỗi feature mới là một **hypothesis** (giả thuyết). Chúng ta hypothesis rằng:


- Feature X sẽ improve user engagement
- UI change Y sẽ increase conversion rate
- Algorithm Z sẽ reduce churn rate


Nhưng hypothesis và reality thường khác nhau. Trước khi có AB testing:


```
Traditional Release Process:
1. Product Manager: "Users sẽ love feature này!"
2. Engineers: "Implement feature"
3. Deploy to 100% users
4. Measure impact
5. Nếu feature fails → All users affected → Business impact massive
```


**Historical Context:**
AB testing concept xuất phát từ **statistical hypothesis testing** trong medical research (clinical trials). Google đầu tiên apply vào web development vào early 2000s. Idea cốt lõi: **controlled experiment** với **randomized control group**.


## Phần I: Foundation Level - Hiểu Bản Chất AB Testing


### 📖 AB Testing Là Gì? (First Principles Explanation)


🔬 **Bản Chất & Mechanism:**


AB Testing, fundamentally, là một **controlled experiment** where:


- **Control Group (A)**: Receives original experience
- **Treatment Group (B)**: Receives modified experience
- **Randomization**: Users randomly assigned to groups
- **Statistical Analysis**: Compare outcomes between groups


**Core Algorithm Explanation:**


```typescript
// Pseudo-code for AB testing mechanism
interface User {
  id: string;
  attributes: UserAttributes;
}

interface Experiment {
  id: string;
  trafficAllocation: number; // 0.0 to 1.0
  variants: Variant[];
}

interface Variant {
  id: string;
  allocation: number; // percentage of traffic
  config: any;
}

function assignUserToVariant(user: User, experiment: Experiment): Variant {
  // Step 1: Check if user is eligible for experiment
  if (!isEligible(user, experiment)) {
    return getControlVariant(experiment);
  }

  // Step 2: Generate stable hash for consistent assignment
  const hash = murmurhash3(user.id + experiment.id);

  // Step 3: Convert hash to bucket (0-99)
  const bucket = hash % 100;

  // Step 4: Determine variant based on allocation
  let cumulativeAllocation = 0;
  for (const variant of experiment.variants) {
    cumulativeAllocation += variant.allocation;
    if (bucket < cumulativeAllocation) {
      return variant;
    }
  }

  return getControlVariant(experiment);
}
```


💡 **Intuitive Understanding:**


Tưởng tượng AB testing như một **scientific experiment**:


- Bạn có 1000 users visit website
- 500 users see version A (original)
- 500 users see version B (new design)
- After 1 week, measure which version performs better


**Real-world Analogy:**
Giống như khi bạn test 2 loại thuốc:


- Group A: Placebo
- Group B: New medicine
- Measure: Recovery rate


### 🔬 Tại Sao Cần Randomization?


**Problem:** Nếu không randomize, results có thể bị biased.


**Example:**


```
Biased Assignment:
- Version A: Users from 9AM-12PM (morning users)
- Version B: Users from 6PM-9PM (evening users)

Problem: Morning users vs Evening users có different behavior patterns
→ Results không accurately reflect version performance
```


**Solution: Randomization**


```typescript
// Stable randomization using hash function
function getStableGroup(userId: string, experimentId: string): string {
  const combinedKey = userId + experimentId;
  const hash = murmurhash3(combinedKey);
  const bucket = hash % 100;

  // Consistent assignment: same user always gets same variant
  return bucket < 50 ? 'A' : 'B';
}
```


**Why Hash Function?**


- **Deterministic**: Same input always produces same output
- **Uniform Distribution**: Hash values evenly distributed
- **Stable**: User always gets same variant across sessions


### 💭 Principal's Perspective - Common Misconceptions:


**Misconception 1:** "AB testing is just splitting traffic 50/50"
**Reality:** Traffic allocation depends on:


- Risk tolerance
- Statistical power requirements
- Business impact potential


**Misconception 2:** "Larger sample size always better"
**Reality:** There's an optimal sample size based on:


- Effect size you want to detect
- Statistical significance requirements
- Time constraints


**Misconception 3:** "AB testing gives instant results"
**Reality:** Need sufficient:


- Sample size
- Time duration
- Statistical significance


## Phần II: Senior Level - Implementation Deep Dive


### 📖 Parameterized API (Dynamic Configuration Center)


🌱 **Nguồn Gốc & Motivation:**


Trước khi có dynamic configuration, AB testing implementations rất **brittle**:


```typescript
// Old way - Hardcoded variants
function renderButton() {
  const isInExperiment = getUserGroup() === 'B';

  if (isInExperiment) {
    return <Button color="red">Click Me</Button>;
  } else {
    return <Button color="blue">Click Me</Button>;
  }
}

// Problems:
// 1. Need code deploy để change experiment
// 2. Cannot dynamically adjust traffic allocation
// 3. Hard to manage multiple experiments
// 4. No real-time control
```


**Solution: Dynamic Configuration Center**


Configuration center là một **centralized service** that:


- Stores experiment configurations
- Serves configurations via API
- Allows real-time updates
- Handles fallbacks and error scenarios


🔬 **Bản Chất & Mechanism:**


**Architecture Overview:**


```
┌─────────────────┐    ┌──────────────────────┐    ┌─────────────────┐
│   Mini Program  │───▶│  Configuration API   │───▶│   Config Store  │
│                 │    │                      │    │   (Database)    │
└─────────────────┘    └──────────────────────┘    └─────────────────┘
```


**Core Components:**


1. **Configuration Service**
2. **Client SDK**
3. **Local Cache**
4. **Fallback Mechanism**


⚙️ **Implementation Deep Dive:**


```typescript
// Configuration Service API Design
interface ConfigurationAPI {
  getExperiments(appId: string, userId: string): Promise<ExperimentConfig[]>;
  getVariables(keys: string[]): Promise<Record<string, any>>;
  trackEvent(event: TrackingEvent): Promise<void>;
}

interface ExperimentConfig {
  experimentId: string;
  isActive: boolean;
  trafficAllocation: number;
  variants: VariantConfig[];
  targetingRules: TargetingRule[];
}

interface VariantConfig {
  variantId: string;
  allocation: number;
  parameters: Record<string, any>;
}

// Client SDK Implementation
class ABTestingSDK {
  private cache: Map<string, any> = new Map();
  private userId: string;
  private appId: string;
  private apiClient: ConfigurationAPI;

  constructor(config: SDKConfig) {
    this.appId = config.appId;
    this.userId = config.userId;
    this.apiClient = new ConfigurationAPIClient(config.apiEndpoint);
  }

  async initialize(): Promise<void> {
    try {
      // Load experiments and cache locally
      const experiments = await this.apiClient.getExperiments(
        this.appId,
        this.userId
      );

      // Process experiments and determine user's variants
      for (const experiment of experiments) {
        if (experiment.isActive) {
          const variant = this.assignUserToVariant(experiment);
          this.cache.set(experiment.experimentId, variant);
        }
      }

      // Cache to local storage for offline scenarios
      await this.persistCache();

    } catch (error) {
      console.error('Failed to initialize AB testing:', error);
      await this.loadFromLocalCache();
    }
  }

  private assignUserToVariant(experiment: ExperimentConfig): VariantConfig {
    // Check targeting rules first
    if (!this.matchesTargetingRules(experiment.targetingRules)) {
      return experiment.variants.find(v => v.variantId === 'control')!;
    }

    // Generate stable hash for user assignment
    const hash = this.generateStableHash(
      this.userId + experiment.experimentId
    );

    const bucket = hash % 100;

    // Check if user falls within traffic allocation
    if (bucket >= experiment.trafficAllocation) {
      return experiment.variants.find(v => v.variantId === 'control')!;
    }

    // Assign to variant based on allocation
    let cumulativeAllocation = 0;
    for (const variant of experiment.variants) {
      cumulativeAllocation += variant.allocation;
      if (bucket < cumulativeAllocation) {
        return variant;
      }
    }

    // Fallback to control
    return experiment.variants.find(v => v.variantId === 'control')!;
  }

  getVariant(experimentId: string): VariantConfig | null {
    return this.cache.get(experimentId) || null;
  }

  getParameter(experimentId: string, parameterKey: string, defaultValue: any): any {
    const variant = this.getVariant(experimentId);
    return variant?.parameters[parameterKey] ?? defaultValue;
  }

  private generateStableHash(input: string): number {
    // MurmurHash3 implementation for stable, uniform distribution
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}
```


**Usage in Mini Program:**


```typescript
// App.js - Initialization
App({
  globalData: {
    abSDK: null,
    experimentConfig: {}
  },

  async onLaunch() {
    // Initialize AB testing SDK
    const userId = await this.getUserId();

    this.globalData.abSDK = new ABTestingSDK({
      appId: 'your-app-id',
      userId: userId,
      apiEndpoint: 'https://config-api.yourcompany.com',
      timeout: 3000
    });

    try {
      await this.globalData.abSDK.initialize();

      // Load dynamic parameters
      this.globalData.experimentConfig = {
        buttonColor: this.globalData.abSDK.getParameter(
          'ui_optimization_exp',
          'button_color',
          '#1976d2'
        ),
        bannerUrl: this.globalData.abSDK.getParameter(
          'content_exp',
          'banner_url',
          '/default-banner.jpg'
        ),
        pricingStrategy: this.globalData.abSDK.getParameter(
          'pricing_exp',
          'strategy',
          'standard'
        )
      };

      // Notify all pages to update with new config
      this.notifyPagesConfigLoaded();

    } catch (error) {
      console.error('AB testing initialization failed:', error);
      // Use default configuration
      this.loadDefaultConfig();
    }
  },

  notifyPagesConfigLoaded() {
    // Trigger re-render of all active pages
    const pages = getCurrentPages();
    pages.forEach(page => {
      if (typeof page.onConfigLoaded === 'function') {
        page.onConfigLoaded();
      }
    });
  }
});

// Page implementation
Page({
  data: {
    buttonColor: '#1976d2',
    bannerImage: '/default-banner.jpg',
    priceDisplay: 'Standard pricing'
  },

  onLoad() {
    this.loadExperimentConfig();
  },

  onConfigLoaded() {
    this.loadExperimentConfig();
  },

  loadExperimentConfig() {
    const app = getApp();
    const config = app.globalData.experimentConfig;

    this.setData({
      buttonColor: config.buttonColor,
      bannerImage: config.bannerUrl,
      priceDisplay: this.getPriceDisplay(config.pricingStrategy)
    });

    // Track experiment exposure
    app.globalData.abSDK.trackEvent({
      eventType: 'experiment_exposure',
      experimentId: 'ui_optimization_exp',
      userId: app.globalData.userId,
      timestamp: Date.now(),
      properties: {
        page: 'home',
        variant: config.buttonColor
      }
    });
  },

  getPriceDisplay(strategy) {
    switch(strategy) {
      case 'discount_15': return '15% off for orders over $100';
      case 'discount_20': return '20% off all items';
      case 'standard':
      default: return 'Regular pricing';
    }
  },

  onButtonClick() {
    const app = getApp();

    // Track conversion event
    app.globalData.abSDK.trackEvent({
      eventType: 'button_click',
      experimentId: 'ui_optimization_exp',
      userId: app.globalData.userId,
      timestamp: Date.now(),
      properties: {
        buttonColor: this.data.buttonColor,
        page: 'home'
      }
    });

    // Continue with business logic
    this.navigateToNextPage();
  }
});
```


🏭 **Production Reality - Performance Optimization:**


**Challenge:** API calls add latency to app startup
**Solution:** Multi-layered caching strategy


```typescript
class OptimizedABSDK extends ABTestingSDK {
  private memoryCache: Map<string, any> = new Map();
  private persistentCache: any;
  private cacheExpiry: number = 3600000; // 1 hour

  async initialize(): Promise<void> {
    // Layer 1: Memory cache (fastest)
    if (this.memoryCache.size > 0) {
      return;
    }

    // Layer 2: Persistent cache (fast)
    try {
      const cachedData = await this.loadFromPersistentCache();
      if (cachedData && !this.isCacheExpired(cachedData.timestamp)) {
        this.memoryCache = new Map(cachedData.experiments);
        return;
      }
    } catch (error) {
      console.warn('Failed to load from persistent cache:', error);
    }

    // Layer 3: Network call (slow but fresh)
    try {
      await this.loadFromNetwork();
    } catch (error) {
      console.error('Network call failed, using stale cache:', error);
      // Use stale cache as last resort
      await this.loadFromStaleCache();
    }
  }

  private async loadFromNetwork(): Promise<void> {
    const experiments = await this.apiClient.getExperiments(
      this.appId,
      this.userId
    );

    // Process and cache
    this.processExperiments(experiments);
    await this.persistToCache();
  }

  private async persistToCache(): Promise<void> {
    const cacheData = {
      timestamp: Date.now(),
      experiments: Array.from(this.memoryCache.entries())
    };

    // Use WeChat's storage API
    wx.setStorageSync('ab_test_cache', cacheData);
  }

  private isCacheExpired(timestamp: number): boolean {
    return Date.now() - timestamp > this.cacheExpiry;
  }
}
```


**💭 Principal's Perspective - Cache Strategy:**


Khi design caching strategy cho AB testing, tôi learned từ experience tại Binance:


1. **Cache Invalidation Strategy:**

Time-based expiry (1 hour)
Version-based invalidation
Manual invalidation via admin panel
2. **Cache Consistency:**

User assignments must be stable
Configuration changes should propagate gradually
Handle cache stampede scenarios
3. **Fallback Hierarchy:**
Memory Cache → Persistent Cache → Network → Default Config → Fail Safe


### 📖 Function Switch (Feature Flags)


🌱 **Nguồn Gốc & Motivation:**


Feature flags xuất phát từ **continuous deployment** practices. Problem statement:


```
Traditional Feature Development:
1. Develop feature in feature branch
2. Merge to main when complete
3. Deploy to production
4. If feature has issues → Rollback entire deployment

Problems:
- Long-lived feature branches
- Integration conflicts
- All-or-nothing deployment
- Slow feedback loops
```


**Solution: Feature Flags**


```
Feature Flag Approach:
1. Develop feature behind a flag
2. Deploy code with flag OFF
3. Enable flag for small % of users
4. Gradually increase percentage
5. If issues → Disable flag instantly (no deployment needed)
```


🔬 **Bản Chất & Mechanism:**


Feature flags are **runtime configuration switches** that control:


- Feature visibility
- Code path execution
- User experience variations
- System behavior modifications


**Core Algorithm:**


```typescript
interface FeatureFlag {
  flagKey: string;
  enabled: boolean;
  rolloutPercentage: number;
  targetingRules: TargetingRule[];
  variants: FlagVariant[];
}

interface TargetingRule {
  attribute: string;
  operator: 'equals' | 'in' | 'greaterThan' | 'lessThan' | 'contains';
  values: any[];
}

interface FlagVariant {
  key: string;
  value: any;
  allocation: number;
}

class FeatureFlagService {
  private flags: Map<string, FeatureFlag> = new Map();
  private userId: string;
  private userAttributes: Record<string, any>;

  constructor(userId: string, userAttributes: Record<string, any>) {
    this.userId = userId;
    this.userAttributes = userAttributes;
  }

  isEnabled(flagKey: string): boolean {
    const flag = this.flags.get(flagKey);
    if (!flag) return false;

    // Check if flag is globally enabled
    if (!flag.enabled) return false;

    // Check targeting rules
    if (!this.matchesTargetingRules(flag.targetingRules)) {
      return false;
    }

    // Check rollout percentage
    const hash = this.generateStableHash(this.userId + flagKey);
    const bucket = hash % 100;

    return bucket < flag.rolloutPercentage;
  }

  getVariant(flagKey: string): any {
    if (!this.isEnabled(flagKey)) return null;

    const flag = this.flags.get(flagKey);
    if (!flag || flag.variants.length === 0) return true;

    // Assign user to variant
    const hash = this.generateStableHash(this.userId + flagKey + 'variant');
    const bucket = hash % 100;

    let cumulativeAllocation = 0;
    for (const variant of flag.variants) {
      cumulativeAllocation += variant.allocation;
      if (bucket < cumulativeAllocation) {
        return variant.value;
      }
    }

    return flag.variants[0].value; // Fallback to first variant
  }

  private matchesTargetingRules(rules: TargetingRule[]): boolean {
    return rules.every(rule => {
      const userValue = this.userAttributes[rule.attribute];

      switch (rule.operator) {
        case 'equals':
          return userValue === rule.values[0];
        case 'in':
          return rule.values.includes(userValue);
        case 'greaterThan':
          return userValue > rule.values[0];
        case 'lessThan':
          return userValue < rule.values[0];
        case 'contains':
          return typeof userValue === 'string' &&
                 userValue.includes(rule.values[0]);
        default:
          return false;
      }
    });
  }
}
```


⚙️ **Implementation trong Mini Program:**


```typescript
// Feature Flag SDK for Mini Program
import FeatureFlagSDK from '@ff-sdk/miniprogram';

class MiniProgramFeatureFlags {
  private sdk: FeatureFlagSDK;
  private pollingInterval: number;
  private intervalId: any;

  constructor(config: {
    appId: string;
    userId: string;
    userAttributes: Record<string, any>;
    pollingInterval?: number;
  }) {
    this.sdk = new FeatureFlagSDK({
      appId: config.appId,
      userId: config.userId,
      userAttributes: config.userAttributes
    });

    this.pollingInterval = config.pollingInterval || 30000; // 30 seconds
  }

  async initialize(): Promise<void> {
    try {
      await this.sdk.initialize();
      this.startPolling();
    } catch (error) {
      console.error('Feature flags initialization failed:', error);
      // Use cached flags if available
      await this.sdk.loadFromCache();
    }
  }

  private startPolling(): void {
    this.intervalId = setInterval(async () => {
      try {
        await this.sdk.refresh();
      } catch (error) {
        console.warn('Feature flags refresh failed:', error);
      }
    }, this.pollingInterval);
  }

  isEnabled(flagKey: string): boolean {
    return this.sdk.isEnabled(flagKey);
  }

  getVariant(flagKey: string): any {
    return this.sdk.getVariant(flagKey);
  }

  destroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}

// App.js
App({
  globalData: {
    featureFlags: null
  },

  async onLaunch() {
    const userInfo = await this.getUserInfo();

    this.globalData.featureFlags = new MiniProgramFeatureFlags({
      appId: 'your-app-id',
      userId: userInfo.userId,
      userAttributes: {
        city: userInfo.city,
        vipLevel: userInfo.vipLevel,
        deviceType: wx.getSystemInfoSync().platform,
        appVersion: this.getAppVersion()
      },
      pollingInterval: 30000
    });

    await this.globalData.featureFlags.initialize();
  },

  onHide() {
    // Clean up polling when app goes to background
    if (this.globalData.featureFlags) {
      this.globalData.featureFlags.destroy();
    }
  }
});

// Page implementation với feature flags
Page({
  data: {
    showNewCheckoutFlow: false,
    paymentMethods: [],
    recommendationAlgorithm: 'default'
  },

  onLoad() {
    this.loadFeatureFlags();
  },

  onShow() {
    // Re-evaluate flags when page becomes visible
    // (flags might have changed due to polling)
    this.loadFeatureFlags();
  },

  loadFeatureFlags() {
    const app = getApp();
    const ff = app.globalData.featureFlags;

    // Check new checkout flow flag
    const showNewCheckout = ff.isEnabled('new_checkout_flow');

    // Get payment methods variant
    const paymentMethodsVariant = ff.getVariant('payment_methods_exp');
    const paymentMethods = this.getPaymentMethods(paymentMethodsVariant);

    // Get recommendation algorithm
    const recoAlgorithm = ff.getVariant('recommendation_algorithm') || 'default';

    this.setData({
      showNewCheckoutFlow: showNewCheckout,
      paymentMethods: paymentMethods,
      recommendationAlgorithm: recoAlgorithm
    });

    // Track feature flag exposure
    this.trackFeatureFlagExposure({
      'new_checkout_flow': showNewCheckout,
      'payment_methods_exp': paymentMethodsVariant,
      'recommendation_algorithm': recoAlgorithm
    });
  },

  getPaymentMethods(variant) {
    switch(variant) {
      case 'credit_first':
        return ['credit_card', 'debit_card', 'digital_wallet'];
      case 'wallet_first':
        return ['digital_wallet', 'credit_card', 'debit_card'];
      case 'minimal':
        return ['credit_card', 'digital_wallet'];
      default:
        return ['credit_card', 'debit_card'];
    }
  },

  onCheckoutClick() {
    if (this.data.showNewCheckoutFlow) {
      this.navigateToNewCheckout();
    } else {
      this.navigateToLegacyCheckout();
    }
  },

  navigateToNewCheckout() {
    wx.navigateTo({
      url: '/pages/checkout-v2/checkout-v2'
    });
  },

  navigateToLegacyCheckout() {
    wx.navigateTo({
      url: '/pages/checkout/checkout'
    });
  }
});
```


🏭 **Production Reality - Progressive Release Strategy:**


Trong thực tế tại các công ty lớn, progressive release strategy rất quan trọng:


```typescript
// Progressive Release Configuration
interface ReleaseStage {
  stage: string;
  duration: number; // in hours
  percentage: number;
  criteria: ReleaseGate[];
}

interface ReleaseGate {
  metric: string;
  threshold: number;
  operator: 'lessThan' | 'greaterThan';
}

const PROGRESSIVE_RELEASE_CONFIG: ReleaseStage[] = [
  {
    stage: 'internal',
    duration: 24, // 1 day
    percentage: 1,
    criteria: [
      { metric: 'error_rate', threshold: 0.1, operator: 'lessThan' },
      { metric: 'crash_rate', threshold: 0.01, operator: 'lessThan' }
    ]
  },
  {
    stage: 'beta_users',
    duration: 48, // 2 days
    percentage: 5,
    criteria: [
      { metric: 'error_rate', threshold: 0.05, operator: 'lessThan' },
      { metric: 'user_satisfaction', threshold: 4.0, operator: 'greaterThan' }
    ]
  },
  {
    stage: 'regional_rollout',
    duration: 72, // 3 days
    percentage: 20,
    criteria: [
      { metric: 'conversion_rate', threshold: -0.02, operator: 'greaterThan' },
      { metric: 'page_load_time', threshold: 2000, operator: 'lessThan' }
    ]
  },
  {
    stage: 'full_rollout',
    duration: 0, // immediate
    percentage: 100,
    criteria: []
  }
];

class ProgressiveReleaseManager {
  private currentStage: number = 0;
  private stageStartTime: number = 0;
  private metrics: MetricsCollector;

  constructor(private flagKey: string, private config: ReleaseStage[]) {
    this.metrics = new MetricsCollector();
  }

  async checkAndProgress(): Promise<void> {
    const currentStageConfig = this.config[this.currentStage];
    if (!currentStageConfig) return; // Already at final stage

    // Check if stage duration has passed
    const stageElapsed = Date.now() - this.stageStartTime;
    const stageDuration = currentStageConfig.duration * 3600000; // Convert to ms

    if (stageElapsed < stageDuration) return; // Wait for stage to complete

    // Check if all criteria are met
    const criteriaMet = await this.checkReleaseCriteria(currentStageConfig.criteria);

    if (criteriaMet) {
      await this.progressToNextStage();
    } else {
      await this.rollbackRelease();
    }
  }

  private async checkReleaseCriteria(criteria: ReleaseGate[]): Promise<boolean> {
    for (const gate of criteria) {
      const metricValue = await this.metrics.getMetric(gate.metric);

      const passed = gate.operator === 'lessThan'
        ? metricValue < gate.threshold
        : metricValue > gate.threshold;

      if (!passed) {
        console.warn(`Release gate failed: ${gate.metric} = ${metricValue}, threshold = ${gate.threshold}`);
        return false;
      }
    }

    return true;
  }

  private async progressToNextStage(): Promise<void> {
    this.currentStage++;
    this.stageStartTime = Date.now();

    const nextStage = this.config[this.currentStage];
    if (nextStage) {
      await this.updateFeatureFlagPercentage(this.flagKey, nextStage.percentage);
      console.log(`Progressed ${this.flagKey} to stage ${nextStage.stage} (${nextStage.percentage}%)`);
    }
  }

  private async rollbackRelease(): Promise<void> {
    console.error(`Release criteria not met for ${this.flagKey}, rolling back`);
    await this.updateFeatureFlagPercentage(this.flagKey, 0);

    // Alert engineering team
    await this.sendAlert({
      type: 'feature_rollback',
      flagKey: this.flagKey,
      stage: this.config[this.currentStage].stage,
      reason: 'release_criteria_not_met'
    });
  }
}
```


**💭 Principal's Perspective - Feature Flag Strategy:**


Từ experience tại Webflow và Figma, tôi learned:


1. **Flag Lifecycle Management:**
Draft → Development → Testing → Production → Cleanup
2. **Technical Debt Prevention:**

Set expiration dates for flags
Regular cleanup of unused flags
Code review process for new flags
3. **Organizational Alignment:**

Product teams understand flag impact
Engineering teams follow flag hygiene
Support teams know how to troubleshoot


## Phần III: Principal Level - Production Scale Considerations


### 📖 Data Collection & Analytics Architecture


🌱 **Nguồn Gốc & Motivation:**


AB testing data collection không chỉ đơn giản là "log events". Trong production scale, chúng ta cần:


1. **High-volume data ingestion** (millions of events/second)
2. **Real-time analytics** (for early signal detection)
3. **Statistical rigor** (proper experiment analysis)
4. **Privacy compliance** (GDPR, CCPA requirements)


💭 **Think Out Loud - Personal Experience:**


>
> Tại Binance, chúng tôi process hơn 100 million AB testing events per day. Lúc đầu, chúng tôi naive approach: gửi events directly từ client đến analytics database. Result: database overload, lost events, inaccurate analysis. Aha moment: cần design proper **event streaming architecture** với **buffering, batching, và fault tolerance**.
>
>


🔬 **Bản Chất & Mechanism:**


**Modern Data Collection Architecture:**


```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Mini Program  │───▶│   Event Buffer  │───▶│  Message Queue  │───▶│  Analytics DB   │
│                 │    │                 │    │   (Kafka/SQS)   │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
                                              ┌─────────────────┐
                                              │  Stream Processor│
                                              │  (Real-time)    │
                                              └─────────────────┘
```


⚙️ **Implementation Deep Dive:**


```typescript
// Event Schema Design
interface ABTestEvent {
  // Core identifiers
  eventId: string;
  userId: string;
  sessionId: string;
  experimentId: string;
  variantId: string;

  // Event details
  eventType: 'exposure' | 'conversion' | 'interaction' | 'error';
  eventName: string;
  timestamp: number;

  // Context
  page: string;
  component?: string;
  elementId?: string;

  // Custom properties
  properties: Record<string, any>;

  // Technical context
  userAgent: string;
  platform: 'ios' | 'android' | 'web';
  appVersion: string;
  sdkVersion: string;

  // Privacy & compliance
  consentGiven: boolean;
  dataRetentionDays: number;
}

// High-performance Event Collector
class ABTestEventCollector {
  private eventBuffer: ABTestEvent[] = [];
  private flushInterval: number = 5000; // 5 seconds
  private maxBufferSize: number = 100;
  private flushTimer: any;
  private apiEndpoint: string;

  constructor(config: {
    apiEndpoint: string;
    flushInterval?: number;
    maxBufferSize?: number;
  }) {
    this.apiEndpoint = config.apiEndpoint;
    this.flushInterval = config.flushInterval || 5000;
    this.maxBufferSize = config.maxBufferSize || 100;

    this.startFlushTimer();
    this.handleAppStateChanges();
  }

  track(event: Partial<ABTestEvent>): void {
    // Enrich event with context
    const enrichedEvent: ABTestEvent = {
      eventId: this.generateEventId(),
      timestamp: Date.now(),
      sessionId: this.getSessionId(),
      userAgent: navigator.userAgent,
      platform: this.detectPlatform(),
      appVersion: this.getAppVersion(),
      sdkVersion: '1.0.0',
      consentGiven: this.hasUserConsent(),
      dataRetentionDays: 90,
      ...event
    } as ABTestEvent;

    // Validate event
    if (!this.validateEvent(enrichedEvent)) {
      console.warn('Invalid event data:', enrichedEvent);
      return;
    }

    // Add to buffer
    this.eventBuffer.push(enrichedEvent);

    // Flush if buffer is full
    if (this.eventBuffer.length >= this.maxBufferSize) {
      this.flush();
    }
  }

  private async flush(): Promise<void> {
    if (this.eventBuffer.length === 0) return;

    const eventsToSend = [...this.eventBuffer];
    this.eventBuffer = [];

    try {
      await this.sendEvents(eventsToSend);
    } catch (error) {
      console.error('Failed to send events:', error);

      // Retry logic with exponential backoff
      await this.retryWithBackoff(eventsToSend);
    }
  }

  private async sendEvents(events: ABTestEvent[]): Promise<void> {
    const payload = {
      events,
      batchId: this.generateBatchId(),
      timestamp: Date.now()
    };

    const response = await fetch(this.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Version': this.getAppVersion()
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }

  private async retryWithBackoff(events: ABTestEvent[], attempt: number = 1): Promise<void> {
    const maxRetries = 3;
    const baseDelay = 1000; // 1 second

    if (attempt > maxRetries) {
      // Save to local storage for later retry
      await this.saveToLocalStorage(events);
      return;
    }

    const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff

    setTimeout(async () => {
      try {
        await this.sendEvents(events);
      } catch (error) {
        console.warn(`Retry ${attempt} failed:`, error);
        await this.retryWithBackoff(events, attempt + 1);
      }
    }, delay);
  }

  private async saveToLocalStorage(events: ABTestEvent[]): Promise<void> {
    try {
      const existing = wx.getStorageSync('pending_events') || [];
      const updated = [...existing, ...events];

      // Keep only last 1000 events to prevent storage bloat
      const trimmed = updated.slice(-1000);

      wx.setStorageSync('pending_events', trimmed);
    } catch (error) {
      console.error('Failed to save events to local storage:', error);
    }
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  private handleAppStateChanges(): void {
    // Flush events when app goes to background
    wx.onAppHide(() => {
      this.flush();
    });

    // Retry pending events when app becomes active
    wx.onAppShow(async () => {
      await this.retryPendingEvents();
    });
  }

  private async retryPendingEvents(): Promise<void> {
    try {
      const pendingEvents = wx.getStorageSync('pending_events') || [];
      if (pendingEvents.length > 0) {
        await this.sendEvents(pendingEvents);
        wx.removeStorageSync('pending_events');
      }
    } catch (error) {
      console.warn('Failed to retry pending events:', error);
    }
  }

  private validateEvent(event: ABTestEvent): boolean {
    // Required fields validation
    const requiredFields = ['eventId', 'userId', 'experimentId', 'eventType', 'timestamp'];

    for (const field of requiredFields) {
      if (!event[field as keyof ABTestEvent]) {
        console.warn(`Missing required field: ${field}`);
        return false;
      }
    }

    // Data type validation
    if (typeof event.timestamp !== 'number' || event.timestamp <= 0) {
      console.warn('Invalid timestamp');
      return false;
    }

    // Privacy validation
    if (!event.consentGiven) {
      console.warn('User consent not given, skipping event');
      return false;
    }

    return true;
  }

  // Utility methods
  private generateEventId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private generateBatchId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }

  private getSessionId(): string {
    let sessionId = wx.getStorageSync('session_id');
    if (!sessionId) {
      sessionId = this.generateEventId();
      wx.setStorageSync('session_id', sessionId);
    }
    return sessionId;
  }

  private detectPlatform(): 'ios' | 'android' | 'web' {
    const systemInfo = wx.getSystemInfoSync();
    if (systemInfo.platform === 'ios') return 'ios';
    if (systemInfo.platform === 'android') return 'android';
    return 'web';
  }

  private getAppVersion(): string {
    // Implementation depends on your app's version management
    return wx.getAccountInfoSync().miniProgram.version || '1.0.0';
  }

  private hasUserConsent(): boolean {
    // Check user's privacy consent status
    return wx.getStorageSync('privacy_consent') === true;
  }
}
```


**Advanced Event Tracking Patterns:**


```typescript
// Specialized tracking for different event types
class AdvancedEventTracker {
  private collector: ABTestEventCollector;
  private impressionTracker: IntersectionObserver;

  constructor(collector: ABTestEventCollector) {
    this.collector = collector;
    this.setupImpressionTracking();
  }

  // Track element exposure (when element becomes visible)
  trackExposure(elementId: string, experimentId: string, variantId: string): void {
    this.collector.track({
      eventType: 'exposure',
      eventName: 'element_visible',
      experimentId,
      variantId,
      elementId,
      properties: {
        viewportHeight: wx.getSystemInfoSync().windowHeight,
        scrollPosition: this.getScrollPosition()
      }
    });
  }

  // Track user interactions with detailed context
  trackInteraction(eventName: string, elementId: string, context: any): void {
    this.collector.track({
      eventType: 'interaction',
      eventName,
      elementId,
      properties: {
        ...context,
        interactionTime: Date.now(),
        elementPosition: this.getElementPosition(elementId),
        gestureData: this.getGestureContext()
      }
    });
  }

  // Track conversion events with funnel context
  trackConversion(conversionType: string, experimentId: string, variantId: string, value?: number): void {
    this.collector.track({
      eventType: 'conversion',
      eventName: conversionType,
      experimentId,
      variantId,
      properties: {
        conversionValue: value,
        funnelStep: this.getCurrentFunnelStep(),
        timeSinceExposure: this.getTimeSinceFirstExposure(experimentId),
        sessionDuration: this.getSessionDuration()
      }
    });
  }

  // Track performance metrics
  trackPerformance(experimentId: string, variantId: string): void {
    const performanceData = this.collectPerformanceMetrics();

    this.collector.track({
      eventType: 'performance',
      eventName: 'page_performance',
      experimentId,
      variantId,
      properties: performanceData
    });
  }

  // Track errors with context
  trackError(error: Error, experimentId?: string, variantId?: string): void {
    this.collector.track({
      eventType: 'error',
      eventName: 'javascript_error',
      experimentId: experimentId || 'unknown',
      variantId: variantId || 'unknown',
      properties: {
        errorMessage: error.message,
        errorStack: error.stack,
        errorType: error.name,
        userAgent: navigator.userAgent,
        currentPage: this.getCurrentPage(),
        experimentContext: this.getActiveExperiments()
      }
    });
  }

  private setupImpressionTracking(): void {
    // Use Intersection Observer for accurate impression tracking
    this.impressionTracker = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const elementId = entry.target.getAttribute('data-ab-element');
            const experimentId = entry.target.getAttribute('data-ab-experiment');
            const variantId = entry.target.getAttribute('data-ab-variant');

            if (elementId && experimentId && variantId) {
              this.trackExposure(elementId, experimentId, variantId);
            }
          }
        });
      },
      {
        threshold: 0.5, // Element must be 50% visible
        rootMargin: '0px'
      }
    );
  }

  private collectPerformanceMetrics(): any {
    // Mini program performance API
    const performance = wx.getPerformance();

    return {
      loadTime: performance.navigationStart ?
        Date.now() - performance.navigationStart : null,
      memoryUsage: performance.memory ? {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize
      } : null,
      networkType: wx.getNetworkType(),
      deviceInfo: {
        model: wx.getSystemInfoSync().model,
        platform: wx.getSystemInfoSync().platform,
        version: wx.getSystemInfoSync().version
      }
    };
  }
}
```


🏭 **Production Reality - Statistical Analysis Engine:**


```typescript
// Statistical Analysis for AB Tests
class ABTestAnalyzer {
  private significanceLevel: number = 0.05; // 95% confidence
  private minimumDetectableEffect: number = 0.02; // 2% minimum effect

  // Calculate statistical significance
  calculateSignificance(controlGroup: ExperimentData, treatmentGroup: ExperimentData): AnalysisResult {
    const controlRate = controlGroup.conversions / controlGroup.visitors;
    const treatmentRate = treatmentGroup.conversions / treatmentGroup.visitors;

    // Calculate pooled standard error
    const pooledRate = (controlGroup.conversions + treatmentGroup.conversions) /
                      (controlGroup.visitors + treatmentGroup.visitors);

    const standardError = Math.sqrt(
      pooledRate * (1 - pooledRate) *
      (1/controlGroup.visitors + 1/treatmentGroup.visitors)
    );

    // Calculate z-score
    const zScore = (treatmentRate - controlRate) / standardError;

    // Calculate p-value (two-tailed test)
    const pValue = 2 * (1 - this.normalCDF(Math.abs(zScore)));

    // Calculate confidence interval
    const marginOfError = 1.96 * standardError; // 95% confidence
    const confidenceInterval = {
      lower: (treatmentRate - controlRate) - marginOfError,
      upper: (treatmentRate - controlRate) + marginOfError
    };

    return {
      controlRate,
      treatmentRate,
      lift: (treatmentRate - controlRate) / controlRate,
      zScore,
      pValue,
      isSignificant: pValue < this.significanceLevel,
      confidenceInterval,
      sampleSize: {
        control: controlGroup.visitors,
        treatment: treatmentGroup.visitors
      }
    };
  }

  // Calculate required sample size
  calculateSampleSize(
    baselineRate: number,
    minimumDetectableEffect: number,
    power: number = 0.8
  ): number {
    const alpha = this.significanceLevel;
    const beta = 1 - power;

    const zAlpha = this.normalInverse(1 - alpha/2);
    const zBeta = this.normalInverse(1 - beta);

    const p1 = baselineRate;
    const p2 = baselineRate * (1 + minimumDetectableEffect);

    const numerator = Math.pow(zAlpha + zBeta, 2) * (p1*(1-p1) + p2*(1-p2));
    const denominator = Math.pow(p1 - p2, 2);

    return Math.ceil(numerator / denominator);
  }

  // Early stopping detection
  shouldStopEarly(data: ExperimentData[]): EarlyStoppingResult {
    const analysis = this.calculateSignificance(data[0], data[1]);

    // Check for statistical significance
    if (analysis.isSignificant) {
      return {
        shouldStop: true,
        reason: 'statistical_significance',
        confidence: 1 - analysis.pValue
      };
    }

    // Check for futility (very unlikely to reach significance)
    const projectedSampleSize = this.projectFinalSampleSize(data);
    if (projectedSampleSize > this.maxSampleSize) {
      return {
        shouldStop: true,
        reason: 'futility',
        confidence: 0.8
      };
    }

    return {
      shouldStop: false,
      reason: null,
      confidence: 0
    };
  }

  private normalCDF(x: number): number {
    // Standard normal cumulative distribution function approximation
    return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
  }

  private erf(x: number): number {
    // Error function approximation
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;

    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }
}

interface ExperimentData {
  visitors: number;
  conversions: number;
}

interface AnalysisResult {
  controlRate: number;
  treatmentRate: number;
  lift: number;
  zScore: number;
  pValue: number;
  isSignificant: boolean;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  sampleSize: {
    control: number;
    treatment: number;
  };
}
```


### 📖 Circuit Breaker & Safety Mechanisms


🌱 **Nguồn Gốc & Motivation:**


Trong production environment, AB tests có thể **fail catastrophically**:


1. **Bad variant** causes crashes
2. **API failures** break user experience
3. **Performance degradation** affects all users
4. **Data pipeline issues** lead to wrong decisions


💭 **Think Out Loud - Personal Experience:**


>
> Tại NAB, chúng tôi có một incident: AB test variant introduced memory leak causing app crashes for 20% users. Took 2 hours to detect và rollback manually. Lesson learned: cần **automated circuit breaker** để detect anomalies và automatically disable experiments.
>
>


🔬 **Bản Chất & Mechanism:**


Circuit breaker pattern applied to AB testing:


```
Normal State → Failure Detection → Circuit Open → Recovery Check → Circuit Closed
```


⚙️ **Implementation Deep Dive:**


```typescript
// Circuit Breaker for AB Testing
class ABTestCircuitBreaker {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private circuitOpenTime: number = 0;

  // Configuration
  private readonly failureThreshold: number = 10;
  private readonly timeoutDuration: number = 60000; // 1 minute
  private readonly resetTimeout: number = 300000; // 5 minutes

  // Metrics tracking
  private metrics: HealthMetrics = {
    errorRate: 0,
    responseTime: 0,
    crashRate: 0,
    userSatisfaction: 0
  };

  constructor(
    private experimentId: string,
    private alertService: AlertService,
    private configService: ConfigurationService
  ) {}

  async executeExperiment<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      // Circuit is open, use fallback
      throw new CircuitBreakerError('Circuit breaker is open');
    }

    try {
      const result = await this.executeWithTimeout(operation);
      this.onSuccess();
      return result;

    } catch (error) {
      this.onFailure(error);
      throw error;
    }
  }

  private async executeWithTimeout<T>(operation: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Operation timeout'));
      }, this.timeoutDuration);

      operation()
        .then(result => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  private onSuccess(): void {
    this.resetFailureCount();

    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED';
      console.log(`Circuit breaker for ${this.experimentId} closed after successful recovery`);
    }
  }

  private onFailure(error: Error): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    console.error(`Experiment ${this.experimentId} failed:`, error);

    if (this.failureCount >= this.failureThreshold) {
      this.openCircuit();
    }
  }

  private openCircuit(): void {
    this.state = 'OPEN';
    this.circuitOpenTime = Date.now();

    console.error(`Circuit breaker opened for experiment ${this.experimentId}`);

    // Automatically disable the experiment
    this.disableExperiment();

    // Send alert to engineering team
    this.alertService.sendAlert({
      type: 'circuit_breaker_opened',
      experimentId: this.experimentId,
      failureCount: this.failureCount,
      timestamp: Date.now(),
      metrics: this.metrics
    });

    // Schedule recovery check
    setTimeout(() => this.checkRecovery(), this.resetTimeout);
  }

  private async disableExperiment(): Promise<void> {
    try {
      await this.configService.updateExperiment(this.experimentId, {
        isActive: false,
        disabledReason: 'circuit_breaker_triggered',
        disabledAt: Date.now()
      });
    } catch (error) {
      console.error('Failed to disable experiment:', error);
    }
  }

  private checkRecovery(): void {
    if (this.state === 'OPEN') {
      this.state = 'HALF_OPEN';
      console.log(`Circuit breaker for ${this.experimentId} entering half-open state`);
    }
  }

  private resetFailureCount(): void {
    this.failureCount = 0;
  }

  // Health metrics monitoring
  updateMetrics(metrics: Partial<HealthMetrics>): void {
    this.metrics = { ...this.metrics, ...metrics };

    // Check if metrics indicate unhealthy state
    if (this.isUnhealthyState()) {
      this.onFailure(new Error('Health metrics indicate unhealthy state'));
    }
  }

  private isUnhealthyState(): boolean {
    return (
      this.metrics.errorRate > 0.05 ||        // >5% error rate
      this.metrics.crashRate > 0.01 ||        // >1% crash rate
      this.metrics.responseTime > 5000 ||     // >5s response time
      this.metrics.userSatisfaction < 3.0     // <3.0 satisfaction score
    );
  }
}

interface HealthMetrics {
  errorRate: number;
  responseTime: number;
  crashRate: number;
  userSatisfaction: number;
}

class CircuitBreakerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CircuitBreakerError';
  }
}
```


**Automated Anomaly Detection:**


```typescript
// Anomaly Detection System
class AnomalyDetector {
  private historicalData: MetricData[] = [];
  private alertThresholds: AlertThresholds;

  constructor(alertThresholds: AlertThresholds) {
    this.alertThresholds = alertThresholds;
  }

  detectAnomalies(currentMetrics: MetricData): AnomalyReport {
    const anomalies: Anomaly[] = [];

    // Statistical anomaly detection
    const statisticalAnomalies = this.detectStatisticalAnomalies(currentMetrics);
    anomalies.push(...statisticalAnomalies);

    // Threshold-based detection
    const thresholdAnomalies = this.detectThresholdAnomalies(currentMetrics);
    anomalies.push(...thresholdAnomalies);

    // Trend-based detection
    const trendAnomalies = this.detectTrendAnomalies(currentMetrics);
    anomalies.push(...trendAnomalies);

    return {
      timestamp: Date.now(),
      anomalies,
      severity: this.calculateSeverity(anomalies),
      recommendation: this.generateRecommendation(anomalies)
    };
  }

  private detectStatisticalAnomalies(current: MetricData): Anomaly[] {
    const anomalies: Anomaly[] = [];

    if (this.historicalData.length < 30) {
      // Need more data for statistical analysis
      return anomalies;
    }

    // Calculate z-scores for each metric
    for (const [metricName, value] of Object.entries(current.metrics)) {
      const historicalValues = this.historicalData.map(d => d.metrics[metricName]);
      const mean = this.calculateMean(historicalValues);
      const stdDev = this.calculateStandardDeviation(historicalValues, mean);

      const zScore = (value - mean) / stdDev;

      // Flag if z-score > 3 (99.7% confidence)
      if (Math.abs(zScore) > 3) {
        anomalies.push({
          type: 'statistical',
          metric: metricName,
          currentValue: value,
          expectedValue: mean,
          severity: Math.abs(zScore) > 4 ? 'high' : 'medium',
          description: `${metricName} is ${zScore > 0 ? 'higher' : 'lower'} than expected (z-score: ${zScore.toFixed(2)})`
        });
      }
    }

    return anomalies;
  }

  private detectThresholdAnomalies(current: MetricData): Anomaly[] {
    const anomalies: Anomaly[] = [];

    // Check against absolute thresholds
    if (current.metrics.errorRate > this.alertThresholds.maxErrorRate) {
      anomalies.push({
        type: 'threshold',
        metric: 'errorRate',
        currentValue: current.metrics.errorRate,
        expectedValue: this.alertThresholds.maxErrorRate,
        severity: 'high',
        description: `Error rate (${current.metrics.errorRate}) exceeds threshold (${this.alertThresholds.maxErrorRate})`
      });
    }

    if (current.metrics.responseTime > this.alertThresholds.maxResponseTime) {
      anomalies.push({
        type: 'threshold',
        metric: 'responseTime',
        currentValue: current.metrics.responseTime,
        expectedValue: this.alertThresholds.maxResponseTime,
        severity: 'medium',
        description: `Response time (${current.metrics.responseTime}ms) exceeds threshold (${this.alertThresholds.maxResponseTime}ms)`
      });
    }

    return anomalies;
  }

  private detectTrendAnomalies(current: MetricData): Anomaly[] {
    const anomalies: Anomaly[] = [];

    // Look at last 10 data points for trend analysis
    const recentData = this.historicalData.slice(-10);
    if (recentData.length < 5) return anomalies;

    // Check for sudden drops in conversion rate
    const conversionRates = recentData.map(d => d.metrics.conversionRate);
    const recentAverage = this.calculateMean(conversionRates.slice(-3));
    const previousAverage = this.calculateMean(conversionRates.slice(0, -3));

    const conversionDrop = (previousAverage - recentAverage) / previousAverage;

    if (conversionDrop > 0.1) { // 10% drop
      anomalies.push({
        type: 'trend',
        metric: 'conversionRate',
        currentValue: current.metrics.conversionRate,
        expectedValue: previousAverage,
        severity: 'high',
        description: `Conversion rate has dropped ${(conversionDrop * 100).toFixed(1)}% in recent measurements`
      });
    }

    return anomalies;
  }

  private calculateSeverity(anomalies: Anomaly[]): 'low' | 'medium' | 'high' {
    if (anomalies.some(a => a.severity === 'high')) return 'high';
    if (anomalies.some(a => a.severity === 'medium')) return 'medium';
    return 'low';
  }

  private generateRecommendation(anomalies
```


## Claude


```typescript
private generateRecommendation(anomalies: Anomaly[]): string {
   if (anomalies.length === 0) {
     return 'No anomalies detected. Experiment is performing normally.';
   }

   const highSeverityAnomalies = anomalies.filter(a => a.severity === 'high');

   if (highSeverityAnomalies.length > 0) {
     const criticalMetrics = highSeverityAnomalies.map(a => a.metric);
     return `IMMEDIATE ACTION REQUIRED: Critical anomalies detected in ${criticalMetrics.join(', ')}. Consider pausing experiment and investigating root cause.`;
   }

   const mediumSeverityAnomalies = anomalies.filter(a => a.severity === 'medium');
   if (mediumSeverityAnomalies.length > 0) {
     return `Monitor closely: Moderate anomalies detected. Consider increasing monitoring frequency and prepare for potential rollback.`;
   }

   return 'Minor anomalies detected. Continue monitoring but no immediate action required.';
 }

 private calculateMean(values: number[]): number {
   return values.reduce((sum, val) => sum + val, 0) / values.length;
 }

 private calculateStandardDeviation(values: number[], mean: number): number {
   const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
   return Math.sqrt(variance);
 }

 addDataPoint(data: MetricData): void {
   this.historicalData.push(data);

   // Keep only last 100 data points to prevent memory bloat
   if (this.historicalData.length > 100) {
     this.historicalData = this.historicalData.slice(-100);
   }
 }
}

interface MetricData {
 timestamp: number;
 experimentId: string;
 metrics: {
   errorRate: number;
   responseTime: number;
   conversionRate: number;
   crashRate: number;
   userSatisfaction: number;
 };
}

interface Anomaly {
 type: 'statistical' | 'threshold' | 'trend';
 metric: string;
 currentValue: number;
 expectedValue: number;
 severity: 'low' | 'medium' | 'high';
 description: string;
}

interface AnomalyReport {
 timestamp: number;
 anomalies: Anomaly[];
 severity: 'low' | 'medium' | 'high';
 recommendation: string;
}

interface AlertThresholds {
 maxErrorRate: number;
 maxResponseTime: number;
 maxCrashRate: number;
 minUserSatisfaction: number;
}
```


**Comprehensive Safety System Integration:**


```typescript
// Integrated Safety System for AB Testing
class ABTestSafetySystem {
  private circuitBreakers: Map<string, ABTestCircuitBreaker> = new Map();
  private anomalyDetector: AnomalyDetector;
  private alertService: AlertService;
  private metricsCollector: MetricsCollector;
  private configService: ConfigurationService;

  constructor(dependencies: SafetySystemDependencies) {
    this.anomalyDetector = new AnomalyDetector(dependencies.alertThresholds);
    this.alertService = dependencies.alertService;
    this.metricsCollector = dependencies.metricsCollector;
    this.configService = dependencies.configService;

    // Start monitoring loop
    this.startMonitoring();
  }

  // Register experiment for safety monitoring
  registerExperiment(experimentId: string): void {
    const circuitBreaker = new ABTestCircuitBreaker(
      experimentId,
      this.alertService,
      this.configService
    );

    this.circuitBreakers.set(experimentId, circuitBreaker);
    console.log(`Safety monitoring enabled for experiment: ${experimentId}`);
  }

  // Execute experiment with safety checks
  async executeExperiment<T>(
    experimentId: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const circuitBreaker = this.circuitBreakers.get(experimentId);

    if (!circuitBreaker) {
      throw new Error(`Experiment ${experimentId} not registered for safety monitoring`);
    }

    try {
      const startTime = Date.now();
      const result = await circuitBreaker.executeExperiment(operation);
      const endTime = Date.now();

      // Record successful execution metrics
      this.recordExecutionMetrics(experimentId, {
        success: true,
        duration: endTime - startTime,
        timestamp: Date.now()
      });

      return result;

    } catch (error) {
      // Record failure metrics
      this.recordExecutionMetrics(experimentId, {
        success: false,
        error: error.message,
        timestamp: Date.now()
      });

      throw error;
    }
  }

  private startMonitoring(): void {
    // Monitor experiments every 30 seconds
    setInterval(async () => {
      await this.performHealthCheck();
    }, 30000);

    // Comprehensive analysis every 5 minutes
    setInterval(async () => {
      await this.performComprehensiveAnalysis();
    }, 300000);
  }

  private async performHealthCheck(): Promise<void> {
    const activeExperiments = await this.configService.getActiveExperiments();

    for (const experiment of activeExperiments) {
      try {
        const metrics = await this.metricsCollector.getRealtimeMetrics(experiment.id);

        // Update circuit breaker with current metrics
        const circuitBreaker = this.circuitBreakers.get(experiment.id);
        if (circuitBreaker) {
          circuitBreaker.updateMetrics(metrics);
        }

        // Quick anomaly check
        const anomalyReport = this.anomalyDetector.detectAnomalies({
          timestamp: Date.now(),
          experimentId: experiment.id,
          metrics
        });

        if (anomalyReport.severity === 'high') {
          await this.handleCriticalAnomaly(experiment.id, anomalyReport);
        }

      } catch (error) {
        console.error(`Health check failed for experiment ${experiment.id}:`, error);
      }
    }
  }

  private async performComprehensiveAnalysis(): Promise<void> {
    const activeExperiments = await this.configService.getActiveExperiments();

    for (const experiment of activeExperiments) {
      try {
        // Get comprehensive metrics over last hour
        const metrics = await this.metricsCollector.getMetrics(
          experiment.id,
          Date.now() - 3600000, // Last hour
          Date.now()
        );

        // Statistical analysis
        const analysis = await this.performStatisticalAnalysis(experiment.id, metrics);

        // Check if experiment should be stopped early
        if (analysis.shouldStop) {
          await this.stopExperiment(experiment.id, analysis.reason);
        }

        // Update experiment status
        await this.updateExperimentStatus(experiment.id, analysis);

      } catch (error) {
        console.error(`Comprehensive analysis failed for experiment ${experiment.id}:`, error);
      }
    }
  }

  private async handleCriticalAnomaly(
    experimentId: string,
    anomalyReport: AnomalyReport
  ): Promise<void> {
    console.error(`Critical anomaly detected in experiment ${experimentId}:`, anomalyReport);

    // Immediate actions
    await Promise.all([
      // Reduce traffic to experiment
      this.configService.updateExperiment(experimentId, {
        trafficAllocation: Math.min(
          await this.getCurrentTrafficAllocation(experimentId) * 0.5,
          0.05 // Maximum 5% traffic during anomaly
        )
      }),

      // Send high-priority alert
      this.alertService.sendAlert({
        type: 'critical_anomaly',
        experimentId,
        anomalyReport,
        severity: 'high',
        timestamp: Date.now()
      }),

      // Log for audit trail
      this.logSafetyAction(experimentId, 'traffic_reduced', 'critical_anomaly_detected')
    ]);
  }

  private async stopExperiment(experimentId: string, reason: string): Promise<void> {
    console.log(`Stopping experiment ${experimentId} due to: ${reason}`);

    await Promise.all([
      // Disable experiment
      this.configService.updateExperiment(experimentId, {
        isActive: false,
        stoppedAt: Date.now(),
        stopReason: reason
      }),

      // Notify stakeholders
      this.alertService.sendAlert({
        type: 'experiment_stopped',
        experimentId,
        reason,
        timestamp: Date.now()
      }),

      // Generate final report
      this.generateFinalReport(experimentId, reason)
    ]);
  }

  private async performStatisticalAnalysis(
    experimentId: string,
    metrics: any[]
  ): Promise<StatisticalAnalysisResult> {
    // Implementation would include:
    // - Power analysis
    // - Sequential testing
    // - Bayesian analysis
    // - Multiple comparison corrections

    // Simplified implementation for example
    const analyzer = new ABTestAnalyzer();
    const controlData = metrics.filter(m => m.variant === 'control');
    const treatmentData = metrics.filter(m => m.variant === 'treatment');

    if (controlData.length < 100 || treatmentData.length < 100) {
      return { shouldStop: false, reason: 'insufficient_data' };
    }

    const significance = analyzer.calculateSignificance(
      this.aggregateData(controlData),
      this.aggregateData(treatmentData)
    );

    if (significance.isSignificant) {
      return {
        shouldStop: true,
        reason: 'statistical_significance_reached',
        confidence: 1 - significance.pValue
      };
    }

    // Check for futility
    const projectedSampleSize = this.projectRequiredSampleSize(significance);
    const maxAllowedSampleSize = 1000000; // 1M users

    if (projectedSampleSize > maxAllowedSampleSize) {
      return {
        shouldStop: true,
        reason: 'futility_detected',
        confidence: 0.8
      };
    }

    return { shouldStop: false, reason: 'continue_experiment' };
  }

  private recordExecutionMetrics(experimentId: string, metrics: any): void {
    // Record to time-series database for trend analysis
    this.metricsCollector.record({
      experimentId,
      timestamp: Date.now(),
      ...metrics
    });
  }

  private async getCurrentTrafficAllocation(experimentId: string): Promise<number> {
    const experiment = await this.configService.getExperiment(experimentId);
    return experiment.trafficAllocation;
  }

  private logSafetyAction(experimentId: string, action: string, reason: string): void {
    console.log(`Safety action logged: ${experimentId} - ${action} - ${reason}`);
    // In production, this would log to audit system
  }

  private aggregateData(data: any[]): any {
    // Aggregate metrics for statistical analysis
    return {
      visitors: data.length,
      conversions: data.filter(d => d.converted).length
    };
  }

  private projectRequiredSampleSize(significance: any): number {
    // Project how many more samples needed for significance
    // Simplified calculation
    return significance.sampleSize.control * 2;
  }
}

interface StatisticalAnalysisResult {
  shouldStop: boolean;
  reason: string;
  confidence?: number;
}

interface SafetySystemDependencies {
  alertThresholds: AlertThresholds;
  alertService: AlertService;
  metricsCollector: MetricsCollector;
  configService: ConfigurationService;
}
```


## Phần IV: Architectural & Strategic Considerations


### 📖 Privacy & Compliance


🌱 **Nguồn Gốc & Motivation:**


Trong era of GDPR, CCPA, và các privacy regulations, AB testing phải comply với:


1. **Explicit consent** for data collection
2. **Data minimization** principles
3. **Right to be forgotten**
4. **Data portability** requirements
5. **Purpose limitation** (only use data for stated purpose)


💭 **Think Out Loud - Personal Experience:**


>
> Tại Figma, chúng tôi learned the hard way: không thể chỉ đơn giản collect tất cả user data for AB testing. GDPR audit revealed chúng tôi collect unnecessary PII data. Lesson: **privacy by design** từ đầu, not afterthought.
>
>


```typescript
// Privacy-Compliant AB Testing Framework
class PrivacyCompliantABTesting {
  private consentManager: ConsentManager;
  private dataProcessor: PrivacyAwareDataProcessor;
  private retentionManager: DataRetentionManager;

  constructor(config: PrivacyConfig) {
    this.consentManager = new ConsentManager(config.consentSettings);
    this.dataProcessor = new PrivacyAwareDataProcessor(config.processingRules);
    this.retentionManager = new DataRetentionManager(config.retentionPolicies);
  }

  async trackEvent(event: ABTestEvent): Promise<void> {
    // 1. Verify consent
    const hasConsent = await this.consentManager.hasValidConsent(
      event.userId,
      'analytics'
    );

    if (!hasConsent) {
      console.log('User has not consented to analytics tracking');
      return;
    }

    // 2. Data minimization - only collect necessary fields
    const minimizedEvent = this.dataProcessor.minimizeData(event);

    // 3. Add privacy metadata
    const privacyEnhancedEvent = {
      ...minimizedEvent,
      consentTimestamp: await this.consentManager.getConsentTimestamp(event.userId),
      dataRetentionDays: this.retentionManager.getRetentionPeriod(event.eventType),
      processingPurpose: 'ab_testing',
      legalBasis: 'consent'
    };

    // 4. Store with encryption
    await this.storeEvent(privacyEnhancedEvent);
  }

  // Handle "Right to be Forgotten" requests
  async deleteUserData(userId: string): Promise<void> {
    console.log(`Processing deletion request for user: ${userId}`);

    // 1. Delete from all data stores
    await Promise.all([
      this.deleteFromEventStore(userId),
      this.deleteFromAnalyticsDB(userId),
      this.deleteFromCacheStore(userId)
    ]);

    // 2. Anonymize aggregated data
    await this.anonymizeAggregatedData(userId);

    // 3. Update consent records
    await this.consentManager.recordDeletion(userId);

    console.log(`User data deletion completed for: ${userId}`);
  }

  // Export user data for portability
  async exportUserData(userId: string): Promise<UserDataExport> {
    const hasConsent = await this.consentManager.hasValidConsent(userId, 'data_export');

    if (!hasConsent) {
      throw new Error('User has not consented to data export');
    }

    const userData = await this.collectUserData(userId);

    return {
      userId,
      exportDate: new Date().toISOString(),
      data: userData,
      format: 'JSON',
      retentionInfo: await this.retentionManager.getUserRetentionInfo(userId)
    };
  }

  private async storeEvent(event: any): Promise<void> {
    // Encrypt sensitive data before storage
    const encryptedEvent = await this.encryptSensitiveFields(event);

    // Store with TTL based on retention policy
    await this.eventStore.store(encryptedEvent, {
      ttl: event.dataRetentionDays * 24 * 60 * 60 * 1000
    });
  }
}

class ConsentManager {
  private consentStore: ConsentStore;

  constructor(private settings: ConsentSettings) {
    this.consentStore = new ConsentStore();
  }

  async hasValidConsent(userId: string, purpose: string): Promise<boolean> {
    const consent = await this.consentStore.getConsent(userId);

    if (!consent) return false;

    // Check if consent is still valid (not expired)
    const isValid = consent.expiresAt > Date.now();

    // Check if specific purpose is consented
    const hasPurposeConsent = consent.purposes.includes(purpose);

    return isValid && hasPurposeConsent;
  }

  async recordConsent(userId: string, purposes: string[]): Promise<void> {
    const consent: ConsentRecord = {
      userId,
      purposes,
      consentedAt: Date.now(),
      expiresAt: Date.now() + (365 * 24 * 60 * 60 * 1000), // 1 year
      version: this.settings.consentVersion,
      ipAddress: await this.getClientIP(),
      userAgent: navigator.userAgent
    };

    await this.consentStore.saveConsent(consent);
  }

  async withdrawConsent(userId: string, purposes?: string[]): Promise<void> {
    if (purposes) {
      // Withdraw specific purposes
      await this.consentStore.updateConsent(userId, {
        purposes: purposes,
        action: 'withdraw'
      });
    } else {
      // Withdraw all consent
      await this.consentStore.deleteConsent(userId);
    }
  }
}
```


### 📖 Multi-Variate Testing & Advanced Experimentation


🔬 **Bản Chất & Mechanism:**


Multi-variate testing (MVT) allows testing **multiple variables simultaneously**:


```typescript
// Multi-Variate Testing Framework
interface MultiVariateExperiment {
  experimentId: string;
  factors: Factor[];
  interactions: boolean; // Whether to test factor interactions
  trafficAllocation: number;
}

interface Factor {
  name: string;
  levels: string[]; // Different values for this factor
}

interface FactorCombination {
  combination: Record<string, string>;
  allocation: number;
}

class MultiVariateTestingEngine {
  private experiments: Map<string, MultiVariateExperiment> = new Map();

  // Generate all possible factor combinations
  generateCombinations(experiment: MultiVariateExperiment): FactorCombination[] {
    const factors = experiment.factors;
    const combinations: FactorCombination[] = [];

    // Generate cartesian product of all factor levels
    const generateCartesian = (arr: Factor[], i: number, current: Record<string, string>) => {
      if (i === arr.length) {
        combinations.push({
          combination: { ...current },
          allocation: 100 / this.getTotalCombinations(factors) // Equal allocation
        });
        return;
      }

      for (const level of arr[i].levels) {
        current[arr[i].name] = level;
        generateCartesian(arr, i + 1, current);
      }
    };

    generateCartesian(factors, 0, {});
    return combinations;
  }

  // Assign user to factor combination
  assignUserToCombination(
    userId: string,
    experimentId: string
  ): FactorCombination | null {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) return null;

    // Check if user is in experiment traffic
    const hash = this.generateHash(userId + experimentId);
    const bucket = hash % 100;

    if (bucket >= experiment.trafficAllocation) {
      return null; // User not in experiment
    }

    // Get all combinations
    const combinations = this.generateCombinations(experiment);

    // Assign to specific combination
    const combinationHash = this.generateHash(userId + experimentId + 'combination');
    const combinationBucket = combinationHash % combinations.length;

    return combinations[combinationBucket];
  }

  // Statistical analysis for multi-variate tests
  analyzeMultiVariateResults(
    experimentId: string,
    data: MVTData[]
  ): MVTAnalysisResult {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) throw new Error('Experiment not found');

    // Main effects analysis
    const mainEffects = this.analyzeMainEffects(experiment.factors, data);

    // Interaction effects analysis (if enabled)
    const interactionEffects = experiment.interactions
      ? this.analyzeInteractionEffects(experiment.factors, data)
      : {};

    // Find best performing combination
    const bestCombination = this.findBestCombination(data);

    return {
      experimentId,
      mainEffects,
      interactionEffects,
      bestCombination,
      statisticalSignificance: this.calculateMVTSignificance(data),
      recommendations: this.generateRecommendations(mainEffects, interactionEffects)
    };
  }

  private analyzeMainEffects(factors: Factor[], data: MVTData[]): MainEffects {
    const effects: MainEffects = {};

    for (const factor of factors) {
      effects[factor.name] = {};

      for (const level of factor.levels) {
        // Filter data for this factor level
        const levelData = data.filter(d =>
          d.combination[factor.name] === level
        );

        // Calculate conversion rate for this level
        const conversions = levelData.filter(d => d.converted).length;
        const conversionRate = conversions / levelData.length;

        effects[factor.name][level] = {
          conversionRate,
          sampleSize: levelData.length,
          conversions
        };
      }
    }

    return effects;
  }

  private analyzeInteractionEffects(factors: Factor[], data: MVTData[]): InteractionEffects {
    const interactions: InteractionEffects = {};

    // Analyze two-way interactions
    for (let i = 0; i < factors.length; i++) {
      for (let j = i + 1; j < factors.length; j++) {
        const factor1 = factors[i];
        const factor2 = factors[j];
        const interactionKey = `${factor1.name} × ${factor2.name}`;

        interactions[interactionKey] = {};

        // For each combination of levels
        for (const level1 of factor1.levels) {
          for (const level2 of factor2.levels) {
            const combinationKey = `${level1} + ${level2}`;

            const combinationData = data.filter(d =>
              d.combination[factor1.name] === level1 &&
              d.combination[factor2.name] === level2
            );

            const conversions = combinationData.filter(d => d.converted).length;
            const conversionRate = conversions / combinationData.length;

            interactions[interactionKey][combinationKey] = {
              conversionRate,
              sampleSize: combinationData.length,
              conversions
            };
          }
        }
      }
    }

    return interactions;
  }

  private getTotalCombinations(factors: Factor[]): number {
    return factors.reduce((total, factor) => total * factor.levels.length, 1);
  }

  private generateHash(input: string): number {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
}

// Example Usage
const mvtEngine = new MultiVariateTestingEngine();

// Define a multi-variate test
const experiment: MultiVariateExperiment = {
  experimentId: 'checkout_optimization_mvt',
  trafficAllocation: 20, // 20% of users
  interactions: true, // Test factor interactions
  factors: [
    {
      name: 'button_color',
      levels: ['blue', 'green', 'red']
    },
    {
      name: 'button_text',
      levels: ['Buy Now', 'Purchase', 'Add to Cart']
    },
    {
      name: 'layout',
      levels: ['single_column', 'two_column']
    }
  ]
};

// This creates 3 × 3 × 2 = 18 different combinations to test
```


### 📖 Advanced Statistical Methods


🔬 **Bayesian AB Testing:**


```typescript
// Bayesian AB Testing Implementation
class BayesianABTest {
  private priorAlpha: number = 1; // Prior belief about success
  private priorBeta: number = 1;  // Prior belief about failure

  constructor(priors?: { alpha: number; beta: number }) {
    if (priors) {
      this.priorAlpha = priors.alpha;
      this.priorBeta = priors.beta;
    }
  }

  // Calculate posterior distribution
  calculatePosterior(successes: number, trials: number): BetaDistribution {
    return {
      alpha: this.priorAlpha + successes,
      beta: this.priorBeta + trials - successes
    };
  }

  // Calculate probability that variant B beats variant A
  probabilityBBeatsA(
    variantA: { successes: number; trials: number },
    variantB: { successes: number; trials: number }
  ): number {
    const posteriorA = this.calculatePosterior(variantA.successes, variantA.trials);
    const posteriorB = this.calculatePosterior(variantB.successes, variantB.trials);

    // Monte Carlo simulation to estimate P(B > A)
    const simulations = 100000;
    let bWins = 0;

    for (let i = 0; i < simulations; i++) {
      const sampleA = this.betaSample(posteriorA.alpha, posteriorA.beta);
      const sampleB = this.betaSample(posteriorB.alpha, posteriorB.beta);

      if (sampleB > sampleA) {
        bWins++;
      }
    }

    return bWins / simulations;
  }

  // Calculate expected loss
  expectedLoss(
    variantA: { successes: number; trials: number },
    variantB: { successes: number; trials: number }
  ): { lossIfChooseA: number; lossIfChooseB: number } {
    const posteriorA = this.calculatePosterior(variantA.successes, variantA.trials);
    const posteriorB = this.calculatePosterior(variantB.successes, variantB.trials);

    const simulations = 100000;
    let lossA = 0; // Loss if we choose A when B is better
    let lossB = 0; // Loss if we choose B when A is better

    for (let i = 0; i < simulations; i++) {
      const sampleA = this.betaSample(posteriorA.alpha, posteriorA.beta);
      const sampleB = this.betaSample(posteriorB.alpha, posteriorB.beta);

      // If B is better but we choose A, we lose (B - A)
      if (sampleB > sampleA) {
        lossA += sampleB - sampleA;
      } else {
        // If A is better but we choose B, we lose (A - B)
        lossB += sampleA - sampleB;
      }
    }

    return {
      lossIfChooseA: lossA / simulations,
      lossIfChooseB: lossB / simulations
    };
  }

  // Stopping criteria based on expected loss
  shouldStop(
    variantA: { successes: number; trials: number },
    variantB: { successes: number; trials: number },
    lossThreshold: number = 0.01 // 1% loss threshold
  ): { shouldStop: boolean; winner: 'A' | 'B' | null; confidence: number } {
    const probability = this.probabilityBBeatsA(variantA, variantB);
    const loss = this.expectedLoss(variantA, variantB);

    // If probability is very high and expected loss is low, stop
    if (probability > 0.95 && loss.lossIfChooseB < lossThreshold) {
      return { shouldStop: true, winner: 'B', confidence: probability };
    }

    if (probability < 0.05 && loss.lossIfChooseA < lossThreshold) {
      return { shouldStop: true, winner: 'A', confidence: 1 - probability };
    }

    return { shouldStop: false, winner: null, confidence: Math.max(probability, 1 - probability) };
  }

  // Sample from Beta distribution using Box-Muller transform
  private betaSample(alpha: number, beta: number): number {
    // Use gamma samples to generate beta sample
    const gammaA = this.gammaSample(alpha);
    const gammaB = this.gammaSample(beta);
    return gammaA / (gammaA + gammaB);
  }

  private gammaSample(shape: number): number {
    // Simplified gamma sampling (for illustration)
    // In production, use a proper gamma sampling algorithm
    if (shape < 1) {
      return this.gammaSample(shape + 1) * Math.pow(Math.random(), 1 / shape);
    }

    const d = shape - 1 / 3;
    const c = 1 / Math.sqrt(9 * d);

    while (true) {
      let x = this.normalSample();
      let v = 1 + c * x;

      if (v <= 0) continue;

      v = v * v * v;
      const u = Math.random();

      if (u < 1 - 0.0331 * x * x * x * x) {
        return d * v;
      }

      if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) {
        return d * v;
      }
    }
  }

  private normalSample(): number {
    // Box-Muller transform
    static let hasSpare = false;
    static let spare: number;

    if (hasSpare) {
      hasSpare = false;
      return spare;
    }

    hasSpare = true;
    const u = Math.random();
    const v = Math.random();
    const mag = Math.sqrt(-2 * Math.log(u));
    spare = mag * Math.cos(2 * Math.PI * v);
    return mag * Math.sin(2 * Math.PI * v);
  }
}

interface BetaDistribution {
  alpha: number;
  beta: number;
}
```


**Sequential Testing:**


```typescript
// Sequential Testing for Early Stopping
class SequentialTesting {
  private alpha: number; // Type I error rate
  private beta: number;  // Type II error rate
  private minimumEffect: number; // Minimum effect size to detect

  constructor(config: { alpha: number; beta: number; minimumEffect: number }) {
    this.alpha = config.alpha;
    this.beta = config.beta;
    this.minimumEffect = config.minimumEffect;
  }

  // SPRT (Sequential Probability Ratio Test)
  sprtAnalysis(
    controlData: { successes: number; trials: number },
    treatmentData: { successes: number; trials: number }
  ): SPRTResult {
    const p0 = controlData.successes / controlData.trials; // Null hypothesis rate
    const p1 = p0 + this.minimumEffect; // Alternative hypothesis rate

    // Calculate likelihood ratio
    const likelihoodRatio = this.calculateLikelihoodRatio(
      treatmentData.successes,
      treatmentData.trials,
      p0,
      p1
    );

    // Calculate decision boundaries
    const upperBoundary = (1 - this.beta) / this.alpha;
    const lowerBoundary = this.beta / (1 - this.alpha);

    if (likelihoodRatio >= upperBoundary) {
      return {
        decision: 'reject_null',
        confidence: 1 - this.alpha,
        shouldStop: true,
        likelihoodRatio
      };
    }

    if (likelihoodRatio <= lowerBoundary) {
      return {
        decision: 'accept_null',
        confidence: 1 - this.beta,
        shouldStop: true,
        likelihoodRatio
      };
    }

    return {
      decision: 'continue',
      confidence: 0,
      shouldStop: false,
      likelihoodRatio
    };
  }

  private calculateLikelihoodRatio(
    successes: number,
    trials: number,
    p0: number,
    p1: number
  ): number {
    const failures = trials - successes;

    // Likelihood under H1 / Likelihood under H0
    const numerator = Math.pow(p1, successes) * Math.pow(1 - p1, failures);
    const denominator = Math.pow(p0, successes) * Math.pow(1 - p0, failures);

    return numerator / denominator;
  }
}

interface SPRTResult {
  decision: 'reject_null' | 'accept_null' | 'continue';
  confidence: number;
  shouldStop: boolean;
  likelihoodRatio: number;
}
```


## Phần V: Production Deployment & Monitoring


### 📖 Infrastructure & Scalability


🏭 **Production Architecture:**


```typescript
// Distributed AB Testing Infrastructure
class DistributedABTestingPlatform {
  private configurationCluster: ConfigurationCluster;
  private eventStreamProcessor: EventStreamProcessor;
  private analyticsEngine: AnalyticsEngine;
  private cacheLayer: DistributedCache;

  constructor(config: PlatformConfig) {
    this.configurationCluster = new ConfigurationCluster(config.configNodes);
    this.eventStreamProcessor = new EventStreamProcessor(config.kafkaConfig);
    this.analyticsEngine = new AnalyticsEngine(config.analyticsConfig);
    this.cacheLayer = new DistributedCache(config.redisConfig);
  }

  // High-availability configuration service
  async getExperimentConfiguration(
    appId: string,
    userId: string
  ): Promise<ExperimentConfig[]> {
    const cacheKey = `config:${appId}:${userId}`;

    try {
      // Try cache first
      const cached = await this.cacheLayer.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      // Fallback to configuration cluster
      const config = await this.configurationCluster.getConfiguration(appId, userId);

      // Cache for 5 minutes
      await this.cacheLayer.setex(cacheKey, 300, JSON.stringify(config));

      return config;

    } catch (error) {
      console.error('Configuration service error:', error);

      // Fallback to local default configuration
      return this.getDefaultConfiguration(appId);
    }
  }

  // High-throughput event ingestion
  async ingestEvent(event: ABTestEvent): Promise<void> {
    try {
      // Send to Kafka for stream processing
      await this.eventStreamProcessor.sendEvent(event);

      // Also send to real-time analytics for immediate insights
      await this.analyticsEngine.processEventRealtime(event);

    } catch (error) {
      console.error('Event ingestion failed:', error);

      // Fallback: store in local buffer for retry
      await this.storeEventForRetry(event);
    }
  }
}

// Configuration Cluster for High Availability
class ConfigurationCluster {
  private nodes: ConfigNode[];
  private currentNodeIndex: number = 0;

  constructor(nodeConfigs: NodeConfig[]) {
    this.nodes = nodeConfigs.map(config => new ConfigNode(config));
  }

  async getConfiguration(appId: string, userId: string): Promise<ExperimentConfig[]> {
    const maxRetries = this.nodes.length;
    let lastError: Error;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const node = this.getCurrentNode();

      try {
        const config = await node.getConfiguration(appId, userId);
        return config;

      } catch (error) {
        console.warn(`Node ${node.id} failed:`, error);
        lastError = error;
        this.moveToNextNode();
      }
    }

    throw new Error(`All configuration nodes failed. Last error: ${lastError.message}`);
  }

  private getCurrentNode(): ConfigNode {
    return this.nodes[this.currentNodeIndex];
  }

  private moveToNextNode(): void {
    this.currentNodeIndex = (this.currentNodeIndex + 1) % this.nodes.length;
  }
}

// Event Stream Processing with Kafka
class EventStreamProcessor {
  private producer: KafkaProducer;
  private consumer: KafkaConsumer;

  constructor(kafkaConfig: KafkaConfig) {
    this.producer = new KafkaProducer(kafkaConfig);
    this.consumer = new KafkaConsumer(kafkaConfig);

    this.startEventProcessor();
  }

  async sendEvent(event: ABTestEvent): Promise<void> {
    const topic = this.getTopicForEvent(event);
    const partition = this.getPartitionForUser(event.userId);

    await this.producer.send({
      topic,
      partition,
      messages: [{
        key: event.userId,
        value: JSON.stringify(event),
        timestamp: event.timestamp.toString()
      }]
    });
  }

  private startEventProcessor(): void {
    this.consumer.subscribe(['ab-test-events']);

    this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const event = JSON.parse(message.value.toString());
          await this.processEvent(event);

        } catch (error) {
          console.error('Event processing failed:', error);
          // Send to dead letter queue
          await this.sendToDeadLetterQueue(message);
        }
      }
    });
  }

  private async processEvent(event: ABTestEvent): Promise<void> {
    // Real-time aggregation
    await this.updateRealTimeMetrics(event);

    // Anomaly detection
    await this.checkForAnomalies(event);

    // Update user segments
    await this.updateUserSegments(event);

    // Store in analytics database
    await this.storeInAnalyticsDB(event);
  }

  private getTopicForEvent(event: ABTestEvent): string {
    // Route events to different topics based on type
    switch (event.eventType) {
      case 'exposure': return 'ab-test-exposures';
      case 'conversion': return 'ab-test-conversions';
      case 'error': return 'ab-test-errors';
      default: return 'ab-test-events';
    }
  }

  private getPartitionForUser(userId: string): number {
    // Consistent partitioning to ensure ordered processing per user
    const hash = this.hashFunction(userId);
    return hash % 10; // Assuming 10 partitions
  }
}
```


### 📖 Monitoring & Observability


```typescript
// Comprehensive Monitoring System
class ABTestMonitoringSystem {
  private metricsCollector: MetricsCollector;
  private alertManager: AlertManager;
  private dashboardManager: DashboardManager;
  private logAggregator: LogAggregator;

  constructor(config: MonitoringConfig) {
    this.metricsCollector = new MetricsCollector(config.metricsConfig);
    this.alertManager = new AlertManager(config.alertConfig);
    this.dashboardManager = new DashboardManager(config.dashboardConfig);
    this.logAggregator = new LogAggregator(config.loggingConfig);
  }

  // Real-time metrics collection
  collectMetrics(): void {
    setInterval(async () => {
      const metrics = await this.gatherSystemMetrics();
      await this.metricsCollector.send(metrics);

      // Check for alerts
      await this.checkAlertConditions(metrics);

    }, 30000); // Every 30 seconds
  }

  private async gatherSystemMetrics(): Promise<SystemMetrics> {
    return {
      timestamp: Date.now(),

      // Platform metrics
      platform: {
        requestsPerSecond: await this.getRequestRate(),
        averageResponseTime: await this.getAverageResponseTime(),
        errorRate: await this.getErrorRate(),
        activeExperiments: await this.getActiveExperimentCount(),
        activeUsers: await this.getActiveUserCount()
      },

      // Experiment-specific metrics
      experiments: await this.getExperimentMetrics(),

      // Infrastructure metrics
      infrastructure: {
        cpuUsage: await this.getCPUUsage(),
        memoryUsage: await this.getMemoryUsage(),
        diskUsage: await this.getDiskUsage(),
        networkThroughput: await this.getNetworkThroughput()
      },

      // Business metrics
      business: {
        totalConversions: await this.getTotalConversions(),
        revenueImpact: await this.getRevenueImpact(),
        userSatisfaction: await this.getUserSatisfactionScore()
      }
    };
  }

  private async getExperimentMetrics(): Promise<ExperimentMetrics[]> {
    const activeExperiments = await this.getActiveExperiments();

    return Promise.all(
      activeExperiments.map(async (experiment) => {
        const metrics = await this.getMetricsForExperiment(experiment.id);

        return {
          experimentId: experiment.id,
          name: experiment.name,
          status: experiment.status,
          trafficAllocation: experiment.trafficAllocation,

          // Performance metrics
          exposures: metrics.exposures,
          conversions: metrics.conversions,
          conversionRate: metrics.conversions / metrics.exposures,

          // Quality metrics
          errorRate: metrics.errorRate,
          loadTime: metrics.averageLoadTime,

          // Statistical metrics
          significance: metrics.statisticalSignificance,
          power: metrics.statisticalPower,
          confidenceInterval: metrics.confidenceInterval,

          // Health metrics
          anomalies: metrics.anomalies,
          alerts: metrics.activeAlerts
        };
      })
    );
  }

  // Alert management
  private async checkAlertConditions(metrics: SystemMetrics): Promise<void> {
    const alertRules = await this.alertManager.getActiveRules();

    for (const rule of alertRules) {
      const shouldAlert = await this.evaluateAlertRule(rule, metrics);

      if (shouldAlert) {
        await this.alertManager.triggerAlert({
          ruleId: rule.id,
          severity: rule.severity,
          message: rule.message,
          metrics: metrics,
          timestamp: Date.now()
        });
      }
    }
  }

  // Custom dashboards for different stakeholders
  generateDashboards(): void {
    // Engineering Dashboard
    this.dashboardManager.createDashboard('engineering', {
      panels: [
        {
          title: 'System Performance',
          type: 'time-series',
          metrics: ['platform.requestsPerSecond', 'platform.averageResponseTime']
        },
        {
          title: 'Error Rates',
          type: 'single-stat',
          metrics: ['platform.errorRate']
        },
        {
          title: 'Infrastructure Health',
          type: 'gauge',
          metrics: ['infrastructure.cpuUsage', 'infrastructure.memoryUsage']
        }
      ]
    });

    // Product Manager Dashboard
    this.dashboardManager.createDashboard('product', {
      panels: [
        {
          title: 'Active Experiments',
          type: 'table',
          metrics: ['experiments.*.conversionRate', 'experiments.*.significance']
        },
        {
          title: 'Business Impact',
          type: 'bar-chart',
          metrics: ['business.revenueImpact']
        },
        {
          title: 'User Satisfaction',
          type: 'trend',
          metrics: ['business.userSatisfaction']
        }
      ]
    });

    // Executive Dashboard
    this.dashboardManager.createDashboard('executive', {
      panels: [
        {
          title: 'Overall Performance',
          type: 'scorecard',
          metrics: ['business.totalConversions', 'business.revenueImpact']
        },
        {
          title: 'Experiment Portfolio',
          type: 'summary',
          metrics: ['platform.activeExperiments']
        }
      ]
    });
  }
}

// SLA Monitoring
class SLAMonitor {
  private slaTargets: SLATarget[];
  private metricsStore: MetricsStore;

  constructor(slaTargets: SLATarget[]) {
    this.slaTargets = slaTargets;
    this.metricsStore = new MetricsStore();
  }

  async evaluateSLAs(): Promise<SLAReport> {
    const report: SLAReport = {
      timestamp: Date.now(),
      period: '1h', // Last hour
      targets: []
    };

    for (const target of this.slaTargets) {
      const metrics = await this.metricsStore.getMetrics(
        target.metricName,
        Date.now() - 3600000, // Last hour
        Date.now()
      );

      const currentValue = this.calculateMetricValue(metrics, target.aggregation);
      const isViolated = this.evaluateTarget(currentValue, target);

      report.targets.push({
        name: target.name,
        metricName: target.metricName,
        targetValue: target.targetValue,
        currentValue,
        isViolated,
        violationDuration: isViolated ? this.getViolationDuration(target) : 0
      });
    }

    return report;
  }

  private evaluateTarget(currentValue: number, target: SLATarget): boolean {
    switch (target.operator) {
      case 'lessThan': return currentValue >= target.targetValue;
      case 'greaterThan': return currentValue <= target.targetValue;
      case 'equals': return Math.abs(currentValue - target.targetValue) > target.tolerance;
      default: return false;
    }
  }
}

interface SLATarget {
  name: string;
  metricName: string;
  targetValue: number;
  operator: 'lessThan' | 'greaterThan' | 'equals';
  tolerance: number;
  aggregation: 'avg' | 'p95' | 'p99' | 'max' | 'min';
}
```


## Kết Luận & Best Practices


### 💭 Principal's Perspective - Lessons Learned


Qua journey từ junior dev đến Principal Engineer, đây là những lessons quan trọng nhất about AB testing:


**1. Start Simple, Scale Gradually**


```
Phase 1: Basic A/B testing với manual analysis
Phase 2: Automated statistical analysis
Phase 3: Multi-variate testing
Phase 4: AI-powered optimization
Phase 5: Full automation với safety mechanisms
```


**2. Culture > Technology**


- AB testing không chỉ là technical tool, mà là **cultural shift** toward data-driven decisions
- Engineering, Product, và Business teams cần align on methodology
- Regular training và knowledge sharing essential


**3. Statistical Rigor**


- **Never p-hack** (múltiple comparisons without correction)
- **Pre-register hypotheses** và analysis plans
- **Understand statistical power** và sample size requirements
- **Bayesian methods** often superior to frequentist approach


**4. Safety First**


- **Circuit breakers** mandatory trong production
- **Gradual rollouts** with automated monitoring
- **Fallback mechanisms** for every experiment
- **Privacy compliance** by design


**5. Organizational Alignment**


```typescript
// Good AB Testing Organization Structure
interface ABTestingTeam {
  champions: {
    engineering: 'Platform team maintains infrastructure';
    product: 'Define experiment strategy';
    data: 'Statistical analysis và insights';
    legal: 'Privacy và compliance oversight';
  };

  processes: {
    experiment_review: 'Cross-functional review before launch';
    statistical_validation: 'Data team validates methodology';
    post_mortem: 'Learn from every experiment';
  };

  tools: {
    self_service: 'Product teams can launch simple experiments';
    expert_support: 'Complex experiments need data team support';
    monitoring: 'Real-time dashboards for all stakeholders';
  };
}
```


### 🔮 Future Trends


**1. AI-Powered Experimentation**


- **Automated hypothesis generation** từ user behavior data
- **Dynamic traffic allocation** based on real-time performance
- **Multi-armed bandits** replacing traditional A/B tests
- **Causal inference** methods for complex experiments


**2. Privacy-First Testing**


- **Federated learning** for cross-platform experiments
- **Differential privacy** trong data collection
- **On-device experimentation** to minimize data transmission


**3. Real-Time Optimization**


- **Streaming analytics** for instant insights
- **Automatic experiment stopping** based on statistical criteria
- **Real-time personalization** using experiment results


---


**🎯 Takeaway Messages:**


1. **AB testing is both art and science** - combine statistical rigor với business intuition
2. **Infrastructure investment upfront** pays dividends in velocity và reliability
3. **Safety mechanisms non-negotiable** trong production environments
4. **Organizational alignment** more important than perfect technology
5. **Privacy và ethics** fundamental requirements, not afterthoughts


Hy vọng deep dive này helpful cho journey của bạn trong AB testing! Remember: **"In God we trust, all others must bring data"** - nhưng data phải được collect và analyze correctly. 🚀


💡 **Final Advice:** Bắt đầu simple với basic A/B testing, learn methodology thoroughly, rồi gradually add complexity. Most important: **measure everything, assume nothing, và always prioritize user experience**.
