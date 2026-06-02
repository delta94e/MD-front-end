# Front-end Interview Insights: Meitu Experience

## Claude


# Phân Tích Chuyên Sâu: Kinh Nghiệm Phỏng Vấn Front-end Meitu - Góc Nhìn Principal Engineer MAANG


## Mở Đầu: Hành Trình Hiểu Sâu Một Cuộc Phỏng Vấn Front-end


💭 **Principal's Perspective**: *Khi tôi đọc bài chia sẻ kinh nghiệm phỏng vấn này, điều đầu tiên tôi nhận ra là đây không chỉ là một danh sách câu hỏi technical - đây là một bản đồ tri thức hoàn chỉnh về những gì một front-end engineer cần master để thành công trong industry. Mỗi câu hỏi đều ẩn chứa một câu chuyện deeper về architecture thinking, performance optimization, và user experience engineering.*


Bài viết chia sẻ kinh nghiệm phỏng vấn tại Meitu này là một tài liệu quý giá, không chỉ bởi vì nó liệt kê các câu hỏi mà còn bởi vì nó phản ánh trend hiện tại của industry về những skills và knowledge areas mà companies đang tìm kiếm. Từ góc độ của một Principal Engineer đã trải qua hàng trăm cuộc interview tại các công ty top-tier, tôi sẽ dissect từng aspect của bài viết này và provide insights sâu sắc về why these questions matter và how to approach them như một senior technologist.


## PHẦN I: FOUNDATION LEVEL - HIỂU RÕ CƠ SỞ


### 📖 Mobile Development Platform Selection Strategy


🌱 **Nguồn Gốc & Motivation:**


Câu hỏi "How do you generally determine the platform for mobile development, Android, IOS, or WeChat?" tại first glance có vẻ simple, nhưng nó actually reveals một understanding requirement rất profound về strategic thinking trong technology selection.


💭 **Think Out Loud**: *Khi tôi đầu tiên encounter question này trong career, tôi đã think nó chỉ là về technical capabilities. Nhưng sau nhiều năm architect các systems tại scale, tôi realize rằng platform selection là một trong những critical decisions ảnh hưởng đến toàn bộ product lifecycle, user acquisition strategy, và business outcomes.*


**Historical Context & Problem Statement:**


Trước khi mobile development platforms mature như ngày nay, developers phải face challenge của fragmentation. Mỗi platform có:


- **Different programming languages**: Java/Kotlin cho Android, Objective-C/Swift cho iOS, JavaScript cho WeChat Mini Programs
- **Different UI paradigms**: Material Design vs Human Interface Guidelines vs WeChat Design Language
- **Different performance characteristics**: Native vs Hybrid vs Web-based approaches
- **Different distribution mechanisms**: Google Play Store vs App Store vs WeChat ecosystem


🔬 **Bản Chất & Mechanism:**


**Core Decision Framework Algorithm:**


```javascript
// Platform Selection Decision Engine
class PlatformSelector {
  constructor(projectRequirements) {
    this.requirements = projectRequirements;
    this.platforms = ['Android', 'iOS', 'WeChat', 'Web'];
    this.decisionMatrix = this.buildDecisionMatrix();
  }

  buildDecisionMatrix() {
    return {
      userBase: {
        weight: 0.3,
        criteria: {
          geographic: ['China', 'Global', 'Regional'],
          demographic: ['Young', 'Professional', 'General'],
          behavior: ['Social', 'Commerce', 'Utility']
        }
      },
      technicalRequirements: {
        weight: 0.25,
        criteria: {
          performance: ['High', 'Medium', 'Low'],
          deviceAccess: ['Full', 'Limited', 'Web-only'],
          offline: ['Required', 'Nice-to-have', 'Not-needed']
        }
      },
      businessConstraints: {
        weight: 0.25,
        criteria: {
          timeline: ['Aggressive', 'Standard', 'Flexible'],
          budget: ['Limited', 'Medium', 'High'],
          teamSkills: ['Native', 'Web', 'Mixed']
        }
      },
      distributionStrategy: {
        weight: 0.2,
        criteria: {
          appStore: ['Required', 'Preferred', 'Avoid'],
          webAccess: ['Required', 'Nice', 'Not-needed'],
          socialIntegration: ['Critical', 'Important', 'Optional']
        }
      }
    };
  }

  evaluatePlatform(platform, context) {
    // Deep analysis algorithm để determine best fit
    let score = 0;

    // User Base Analysis
    if (platform === 'WeChat' && context.geographic === 'China') {
      score += this.decisionMatrix.userBase.weight * 1.0;
    } else if (platform === 'iOS' && context.demographic === 'Professional') {
      score += this.decisionMatrix.userBase.weight * 0.9;
    } else if (platform === 'Android' && context.geographic === 'Global') {
      score += this.decisionMatrix.userBase.weight * 0.8;
    }

    // Technical Requirements Evaluation
    if (context.performance === 'High' && ['Android', 'iOS'].includes(platform)) {
      score += this.decisionMatrix.technicalRequirements.weight * 1.0;
    } else if (context.deviceAccess === 'Limited' && platform === 'WeChat') {
      score += this.decisionMatrix.technicalRequirements.weight * 0.7;
    }

    return score;
  }
}
```


💡 **Intuitive Understanding:**


Imagine bạn đang design một house. Bạn không chỉ pick materials based trên aesthetics - bạn cần consider climate, budget, local building codes, availability của skilled workers, và intended use của house. Similarly, platform selection for mobile development requires comprehensive analysis của multiple factors.


**Real-world Analogy**: Think về việc choose transportation method cho một trip:


- **Private car (Native iOS/Android)**: Maximum control, best performance, requires significant investment
- **Public transport (Cross-platform frameworks)**: Cost-effective, standardized, some limitations
- **Bike sharing (WeChat Mini Programs)**: Quick setup, limited scope, perfect cho specific use cases


⚙️ **Implementation Deep Dive:**


**Case Study: Netflix Mobile Strategy Evolution**


Tại Netflix, chúng tôi đã evolve platform strategy qua several phases:


**Phase 1 (Early days)**: Pure native development


```swift
// iOS Native Implementation
class VideoPlayerViewController: UIViewController {
    private var player: AVPlayer
    private var playerLayer: AVPlayerLayer

    override func viewDidLoad() {
        super.viewDidLoad()
        setupVideoPlayer()
        optimizeForBatteryLife()
        handleNetworkConditions()
    }

    private func optimizeForBatteryLife() {
        // Native optimizations cho battery efficiency
        player.allowsExternalPlayback = true
        player.usesExternalPlaybackWhileExternalScreenIsActive = true
    }
}
```


**Phase 2 (Scale challenges)**: Hybrid approach với shared business logic


```javascript
// Shared Business Logic Layer
class StreamingEngine {
  constructor(platform) {
    this.platform = platform;
    this.adaptiveStreaming = new AdaptiveStreamingManager();
    this.drmManager = new DRMManager(platform);
  }

  async initializePlayback(contentId, userProfile) {
    // Platform-agnostic streaming logic
    const streamingUrl = await this.getOptimalStream(contentId, userProfile);
    const drmToken = await this.drmManager.acquireToken(contentId);

    // Platform-specific rendering
    return this.platform.createPlayer(streamingUrl, drmToken);
  }

  getOptimalStream(contentId, userProfile) {
    // Complex algorithm để determine best streaming quality
    // based trên network conditions, device capabilities, user preferences
    return this.adaptiveStreaming.selectBestStream({
      deviceSpecs: this.platform.getDeviceSpecs(),
      networkBandwidth: this.platform.getCurrentBandwidth(),
      userPreferences: userProfile.qualityPreferences
    });
  }
}
```


🏭 **Production Reality tại MAANG:**


**Meta's Platform Strategy cho Facebook App:**


💭 **Debug Story**: *Tại Meta, chúng tôi faced một challenge thú vị khi decide platform cho Facebook's new feature - Instagram Shopping integration. Initially, team muốn build native cho cả iOS và Android để maximize performance. Nhưng sau extensive analysis, chúng tôi realized rằng time-to-market và consistency across platforms was more critical than marginal performance gains.*


```javascript
// Meta's Cross-Platform Decision Framework
const FacebookPlatformStrategy = {
  coreApp: {
    platform: 'Native (iOS/Android)',
    rationale: 'Performance critical, complex interactions, deep OS integration',
    tradeoffs: {
      pros: ['Maximum performance', 'Full platform APIs', 'Best UX'],
      cons: ['Higher development cost', 'Slower feature parity', 'More complexity']
    }
  },

  experimentalFeatures: {
    platform: 'React Native',
    rationale: 'Faster iteration, shared codebase, A/B testing efficiency',
    tradeoffs: {
      pros: ['Faster development', 'Code sharing', 'Rapid testing'],
      cons: ['Performance overhead', 'Platform limitations', 'Additional abstraction']
    }
  },

  utilityFeatures: {
    platform: 'Web Views',
    rationale: 'Simple implementation, easy updates, consistent experience',
    tradeoffs: {
      pros: ['Easy deployment', 'Consistent across platforms', 'Web team expertise'],
      cons: ['Performance limitations', 'Limited native integration', 'Network dependency']
    }
  }
};
```


**Amazon's WeChat Strategy for China Market:**


Amazon's approach để enter Chinese market thông qua WeChat ecosystem là một masterclass trong strategic platform selection:


```javascript
// Amazon WeChat Mini Program Architecture
class AmazonWeChatIntegration {
  constructor() {
    this.wechatAPI = new WeChatAPI();
    this.amazonBackend = new AmazonBackendConnector();
    this.userManager = new WeChatUserManager();
  }

  async handleProductBrowsing(userId, category) {
    // Leverage WeChat's social features cho product discovery
    const socialRecommendations = await this.wechatAPI.getSocialGraph(userId);
    const amazonProducts = await this.amazonBackend.getProducts({
      category,
      socialContext: socialRecommendations,
      geoLocation: 'China'
    });

    // Optimize cho WeChat's performance constraints
    return this.optimizeForWeChatRendering(amazonProducts);
  }

  optimizeForWeChatRendering(products) {
    // WeChat Mini Programs có strict memory và performance limits
    return products.map(product => ({
      id: product.id,
      title: product.title.substring(0, 50), // Limit text length
      image: this.compressImage(product.image, { maxSize: '200kb' }),
      price: product.price,
      // Remove heavy data để fit WeChat constraints
      description: null,
      reviews: null
    }));
  }
}
```


💭 **Principal's Strategic Insight**: *Việc Amazon choose WeChat Mini Program instead của native app cho China market wasn't just about development cost - it was about understanding rằng trong Chinese market, user behavior revolves around WeChat ecosystem. Users don't want to download another app; they want seamless integration với their existing social workflow.*


### 📖 Mobile Responsive Design & REM Calculation Deep Dive


🌱 **Nguồn Gốc & Motivation:**


Câu hỏi về "How to deal with the size, width and height of mobile pages" và "How to calculate rem based on the size of the design draft" touch vào một trong những fundamental challenges của modern web development: creating consistent user experiences across an incredibly diverse ecosystem của devices.


**Historical Context & Evolution:**


Pre-smartphone era, web developers chỉ cần worry về desktop resolutions, typically 1024x768 hoặc 1280x1024. Life was simple - fixed-width layouts worked perfectly.


Then came the mobile revolution:


- 2007: iPhone introduced 320x480 screen
- 2010-2015: Android fragmentation explosion với hundreds of different screen sizes
- 2014: iPhone 6 Plus introduced high-DPI screens
- 2016-present: Foldable phones, ultra-wide screens, notches, dynamic islands


💭 **Think Out Loud**: *Khi tôi first started mobile web development vào 2010, responsive design chưa exist. Chúng tôi actually build separate "m.website.com" versions. Nó was nightmare để maintain! Responsive design era bắt đầu với Ethan Marcotte's famous article, nhưng practical implementation required years của trial và error để perfect.*


🔬 **Bản Chất & Mechanism:**


**Core Problem: Viewport và Density Independence**


Fundamental challenge là translating design mockups (typically created at specific resolutions) into fluid, scalable interfaces mà works across all devices.


```javascript
// Viewport Calculation Engine
class ViewportManager {
  constructor() {
    this.baseDesignWidth = 375; // iPhone 6/7/8 as baseline
    this.baseFontSize = 16; // Browser default
    this.currentViewport = this.getCurrentViewport();
    this.scaleFactor = this.calculateScaleFactor();
  }

  getCurrentViewport() {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio,
      orientation: this.getOrientation()
    };
  }

  calculateScaleFactor() {
    // Dynamic REM calculation based on viewport
    return this.currentViewport.width / this.baseDesignWidth;
  }

  convertPxToRem(pxValue) {
    // Convert design pixel values to scalable REM units
    const remValue = pxValue / this.baseFontSize;
    return `${remValue}rem`;
  }

  convertPxToVw(pxValue) {
    // Convert to viewport width units
    const vwValue = (pxValue / this.baseDesignWidth) * 100;
    return `${vwValue}vw`;
  }

  // Advanced: Fluid typography với clamp()
  createFluidTypography(minPx, maxPx, minVw = 320, maxVw = 1200) {
    const slope = (maxPx - minPx) / (maxVw - minVw);
    const intersection = -minVw * slope + minPx;

    return `clamp(${minPx}px, ${intersection}px + ${slope * 100}vw, ${maxPx}px)`;
  }
}
```


**Step-by-step REM Calculation Process:**


```scss
// SCSS Implementation của Dynamic REM System
$base-design-width: 375px; // iPhone 6/7/8 width
$base-font-size: 16px; // Browser default

// Function để convert design pixels to REM
@function px-to-rem($px) {
  @return ($px / $base-font-size) * 1rem;
}

// Function để create responsive sizing
@function fluid-size($min-px, $max-px, $min-vw: 320px, $max-vw: 1200px) {
  $slope: ($max-px - $min-px) / ($max-vw - $min-vw);
  $intersection: $min-px - ($slope * $min-vw);

  @return clamp(#{$min-px}, #{$intersection} + #{$slope * 100}vw, #{$max-px});
}

// Advanced mixin cho responsive typography
@mixin responsive-typography($mobile-size, $desktop-size) {
  font-size: px-to-rem($mobile-size);

  @media (min-width: 768px) {
    font-size: fluid-size($mobile-size, $desktop-size);
  }

  @media (min-width: 1200px) {
    font-size: px-to-rem($desktop-size);
  }
}

// Usage examples
.headline {
  @include responsive-typography(24px, 48px);
  line-height: 1.2;
  margin-bottom: px-to-rem(16px);
}

.body-text {
  @include responsive-typography(16px, 18px);
  line-height: 1.6;
}
```


💡 **Intuitive Understanding:**


Think về REM calculation như việc design một flexible blueprint cho một building mà needs to work trên different lot sizes:


**Real-world Analogy**:


- **Design mockup** = Architectural blueprint drawn for specific lot size
- **REM units** = Proportional measurements mà scale with lot size
- **Viewport** = Actual lot size where building will be constructed
- **Base font size** = Foundation measurement unit (like "1 meter" in architecture)


⚙️ **Implementation Deep Dive:**


**Google's Material Design Implementation:**


```javascript
// Google Material Design Responsive System
class MaterialResponsiveSystem {
  constructor() {
    this.breakpoints = {
      xs: 0,      // Extra small devices
      sm: 600,    // Small devices
      md: 960,    // Medium devices
      lg: 1280,   // Large devices
      xl: 1920    // Extra large devices
    };

    this.spacing = {
      base: 8, // 8px base spacing unit
      scale: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] // Multipliers
    };

    this.typography = {
      h1: { mobile: 96, desktop: 96 },
      h2: { mobile: 60, desktop: 60 },
      h3: { mobile: 48, desktop: 48 },
      h4: { mobile: 34, desktop: 34 },
      h5: { mobile: 24, desktop: 24 },
      h6: { mobile: 20, desktop: 20 },
      subtitle1: { mobile: 16, desktop: 16 },
      subtitle2: { mobile: 14, desktop: 14 },
      body1: { mobile: 16, desktop: 16 },
      body2: { mobile: 14, desktop: 14 }
    };
  }

  getSpacing(multiplier) {
    return this.spacing.base * multiplier;
  }

  generateCSS() {
    let css = ':root {\n';

    // Generate spacing variables
    this.spacing.scale.forEach(multiplier => {
      const value = this.getSpacing(multiplier);
      css += `  --spacing-${multiplier}: ${value}px;\n`;
      css += `  --spacing-${multiplier}-rem: ${value / 16}rem;\n`;
    });

    // Generate typography variables
    Object.entries(this.typography).forEach(([variant, sizes]) => {
      css += `  --typography-${variant}-mobile: ${sizes.mobile / 16}rem;\n`;
      css += `  --typography-${variant}-desktop: ${sizes.desktop / 16}rem;\n`;
    });

    css += '}\n';
    return css;
  }

  // Advanced: Dynamic font size calculation
  calculateOptimalFontSize(viewport, content) {
    const wordsPerLine = this.estimateWordsPerLine(viewport.width, content);
    const optimalLineLength = Math.min(Math.max(wordsPerLine, 8), 12); // 8-12 words per line

    return {
      fontSize: viewport.width / (optimalLineLength * 8), // Approximate character width
      lineHeight: 1.4 + (0.2 * (viewport.width / 1200)) // Dynamic line height
    };
  }
}
```


🏭 **Production Reality tại Netflix:**


**Netflix TV App Responsive Strategy:**


💭 **Debug Story**: *Tại Netflix, một trong những biggest challenges mà tôi encountered was designing cho TV screens. TVs range từ 32" đến 85", với viewing distances từ 3 feet đến 15 feet. Traditional responsive design principles không apply directly because users sit farther away từ larger screens.*


```javascript
// Netflix TV Responsive Design System
class NetflixTVResponsiveSystem {
  constructor() {
    this.tvCategories = {
      small: { diagonal: 32, distance: 4, dpi: 68 },   // 32" TV, 4ft viewing
      medium: { diagonal: 55, distance: 8, dpi: 80 },  // 55" TV, 8ft viewing
      large: { diagonal: 75, distance: 12, dpi: 94 },  // 75" TV, 12ft viewing
      xlarge: { diagonal: 85, distance: 15, dpi: 104 } // 85" TV, 15ft viewing
    };
  }

  calculateOptimalSizing(screenSize, viewingDistance) {
    // Angular size calculation để determine optimal font/element sizes
    const angularSize = Math.atan((screenSize * 0.0254) / (viewingDistance * 0.3048));
    const baseAngularSize = Math.atan(0.32 / 2.4); // Reference: 32" at 8ft

    const scaleFactor = angularSize / baseAngularSize;

    return {
      titleFontSize: `${2.5 * scaleFactor}rem`,
      bodyFontSize: `${1.2 * scaleFactor}rem`,
      cardSpacing: `${1.5 * scaleFactor}rem`,
      focusRingWidth: `${0.3 * scaleFactor}rem`
    };
  }

  generateTVSpecificCSS() {
    return `
      @media screen and (min-width: 1920px) and (min-height: 1080px) {
        /* Standard 1080p TV */
        :root {
          --tv-title-size: 2.5rem;
          --tv-body-size: 1.2rem;
          --tv-card-gap: 1.5rem;
        }
      }

      @media screen and (min-width: 3840px) and (min-height: 2160px) {
        /* 4K TV */
        :root {
          --tv-title-size: 3.5rem;
          --tv-body-size: 1.8rem;
          --tv-card-gap: 2.2rem;
        }
      }

      @media screen and (min-width: 7680px) and (min-height: 4320px) {
        /* 8K TV */
        :root {
          --tv-title-size: 5rem;
          --tv-body-size: 2.5rem;
          --tv-card-gap: 3rem;
        }
      }
    `;
  }
}
```


**Amazon's Responsive E-commerce Implementation:**


```javascript
// Amazon Product Page Responsive Strategy
class AmazonResponsiveProduct {
  constructor() {
    this.productLayoutModes = {
      mobile: {
        maxWidth: 767,
        layout: 'single-column',
        imageRatio: '1:1',
        maxImages: 5
      },
      tablet: {
        maxWidth: 1024,
        layout: 'two-column',
        imageRatio: '4:3',
        maxImages: 8
      },
      desktop: {
        maxWidth: Infinity,
        layout: 'three-column',
        imageRatio: '16:9',
        maxImages: 12
      }
    };
  }

  calculateProductImageSizes() {
    const viewport = window.innerWidth;
    let config;

    if (viewport <= 767) {
      config = this.productLayoutModes.mobile;
    } else if (viewport <= 1024) {
      config = this.productLayoutModes.tablet;
    } else {
      config = this.productLayoutModes.desktop;
    }

    return {
      thumbnailSize: `${viewport * 0.15}px`,
      mainImageSize: `${viewport * 0.4}px`,
      gridColumns: config.layout === 'single-column' ? 1 :
                   config.layout === 'two-column' ? 2 : 3
    };
  }

  // Advanced: Dynamic loading based on viewport
  async loadOptimalImages(productId, viewport) {
    const imageConfig = this.calculateProductImageSizes();
    const imagesToLoad = Math.min(
      imageConfig.gridColumns * 2, // Load 2 rows worth
      this.productLayoutModes[this.getCurrentMode()].maxImages
    );

    // Load high-res images chỉ khi cần thiết
    const imageQualities = viewport > 1024 ? 'high' :
                           viewport > 767 ? 'medium' : 'low';

    return await this.imageService.loadProductImages(productId, {
      count: imagesToLoad,
      quality: imageQualities,
      sizes: imageConfig
    });
  }
}
```


💭 **Principal's Advanced Insight**: *Một misconception phổ biến là responsive design chỉ about screen sizes. Trong thực tế, optimal responsive design cần consider network conditions, device capabilities, user context (touch vs mouse), và even ambient lighting conditions. Tại Amazon, chúng tôi discovered rằng users behave differently khi shopping trên phone vs tablet vs desktop - không chỉ về layout preferences mà cả về attention span và decision-making patterns.*


## PHẦN II: SENIOR LEVEL - REACT ECOSYSTEM MASTERY


### 📖 React Functional Components Lifecycle & Call Frequency


🌱 **Nguồn Gốc & Motivation:**


Câu hỏi "Functional components, when will they be called in an application cycle, and how many times will the function be called?" đi straight to the heart của React's rendering philosophy và performance implications. Đây không phải simple question về lifecycle - đây là question về understanding React's reconciliation algorithm, render optimization, và memory management.


**Historical Context & Evolution:**


React's evolution from class components to functional components represents một paradigm shift fundamental trong thinking về UI components:


**Pre-Hooks Era (2013-2018):**


```javascript
// Class Component - Explicit Lifecycle Methods
class UserProfile extends React.Component {
  constructor(props) {
    super(props);
    this.state = { user: null, loading: true };
  }

  componentDidMount() {
    // Called once after first render
    this.fetchUserData();
  }

  componentDidUpdate(prevProps) {
    // Called after every re-render (except first)
    if (prevProps.userId !== this.props.userId) {
      this.fetchUserData();
    }
  }

  componentWillUnmount() {
    // Called before component is removed
    this.cleanup();
  }

  render() {
    // Called every time component needs to update
    return <div>{this.state.user?.name}</div>;
  }
}
```


**Post-Hooks Era (2019-present):**


```javascript
// Functional Component - Implicit Lifecycle through Hooks
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // This entire function runs every time component re-renders
  useEffect(() => {
    // Equivalent to componentDidMount + componentDidUpdate
    fetchUserData(userId).then(setUser);
  }, [userId]); // Dependency array controls when effect runs

  useEffect(() => {
    // Equivalent to componentWillUnmount
    return () => cleanup();
  }, []); // Empty array = run once on mount, cleanup on unmount

  // This return statement executes every render
  return <div>{user?.name}</div>;
}
```


💭 **Think Out Loud**: *Khi hooks first came ra, tôi initially resisted them because class components seemed more explicit about lifecycle. Nhưng sau khi deep dive into React's internals và work với complex applications tại scale, tôi realized rằng functional components actually provide more precise control over when computations happen - bạn just need to understand the mental model differently.*


🔬 **Bản Chất & Mechanism:**


**Core Function Call Frequency Algorithm:**


```javascript
// React Reconciliation Engine Simulation
class ReactReconciler {
  constructor() {
    this.componentCallCount = new Map();
    this.renderQueue = [];
    this.currentFiber = null;
  }

  scheduleUpdate(component, newProps, newState) {
    // React's scheduler decides when to actually run updates
    this.renderQueue.push({
      component,
      props: newProps,
      state: newState,
      priority: this.calculatePriority(component)
    });

    // Batch updates trong same frame
    if (!this.isRenderingScheduled) {
      this.isRenderingScheduled = true;
      requestIdleCallback(() => this.flushRenderQueue());
    }
  }

  flushRenderQueue() {
    while (this.renderQueue.length > 0) {
      const update = this.renderQueue.shift();
      this.renderComponent(update);
    }
    this.isRenderingScheduled = false;
  }

  renderComponent(componentUpdate) {
    const { component, props, state } = componentUpdate;

    // Increment call count
    const currentCount = this.componentCallCount.get(component) || 0;
    this.componentCallCount.set(component, currentCount + 1);

    // CRITICAL: Functional component function executes entirely
    // every single time component re-renders
    const newVirtualDOM = component(props, state);

    // React then diffs previous vs new virtual DOM
    this.reconcileChanges(component.previousVDOM, newVirtualDOM);

    component.previousVDOM = newVirtualDOM;
  }

  // Detailed analysis của khi nào functional component gets called
  analyzeComponentCallFrequency(component) {
    return {
      totalCalls: this.componentCallCount.get(component) || 0,
      reasons: [
        'Initial mount',
        'Parent component re-render',
        'Props change',
        'State change (via useState)',
        'Context value change',
        'Force re-render (via useReducer dispatch)',
        'Suspense boundary resolution'
      ],
      optimizationOpportunities: this.identifyOptimizations(component)
    };
  }
}
```


**Step-by-step Function Execution Flow:**


```javascript
// Detailed Functional Component Execution Analysis
function DetailedComponentExample({ userId, theme }) {
  console.log('🔄 Function component body starts executing');

  // 1. State initialization (useState)
  const [user, setUser] = useState(() => {
    console.log('💾 useState initializer - only runs on first mount');
    return null;
  });

  const [posts, setPosts] = useState([]);

  // 2. Derived state calculations (runs every render)
  const isUserLoaded = user !== null;
  const postCount = posts.length;
  console.log(`📊 Derived calculations - isUserLoaded: ${isUserLoaded}, postCount: ${postCount}`);

  // 3. Memoized values (useMemo) - conditional execution
  const expensiveUserStats = useMemo(() => {
    console.log('🧮 useMemo calculation - only when user changes');
    if (!user) return null;

    return {
      totalLikes: user.posts?.reduce((acc, post) => acc + post.likes, 0),
      avgPostLength: user.posts?.reduce((acc, post) => acc + post.content.length, 0) / user.posts?.length,
      topTags: extractTopTags(user.posts)
    };
  }, [user]); // Only recalculates khi user object changes

  // 4. Effects (useEffect) - scheduled for after render
  useEffect(() => {
    console.log('🌟 Effect: Fetch user data - runs after render');

    async function fetchData() {
      try {
        const userData = await api.fetchUser(userId);
        setUser(userData);

        const userPosts = await api.fetchUserPosts(userId);
        setPosts(userPosts);
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      }
    }

    fetchData();
  }, [userId]); // Re-runs when userId changes

  // 5. Cleanup effects
  useEffect(() => {
    console.log('🧹 Effect: Setup cleanup');

    const cleanup = () => {
      console.log('🗑️ Cleanup function executing');
      // Cancel ongoing requests, clear timers, etc.
    };

    return cleanup; // This function runs on unmount or before next effect
  }, []);

  // 6. Event handlers (useCallback) - memoized functions
  const handleUserUpdate = useCallback((newUserData) => {
    console.log('🔄 Event handler: Update user');
    setUser(prevUser => ({ ...prevUser, ...newUserData }));
  }, []); // Function reference stays stable unless dependencies change

  // 7. Render logic (runs every time)
  console.log('🎨 Render logic executing');

  if (!isUserLoaded) {
    return <div>Loading user...</div>;
  }

  // 8. JSX creation (every render)
  console.log('🏗️ Creating JSX virtual DOM');

  return (
    <div className={`user-profile theme-${theme}`}>
      <h1>{user.name}</h1>
      <p>Posts: {postCount}</p>
      {expensiveUserStats && (
        <div>
          <p>Total likes: {expensiveUserStats.totalLikes}</p>
          <p>Avg post length: {expensiveUserStats.avgPostLength}</p>
        </div>
      )}
      <button onClick={handleUserUpdate}>Update Profile</button>
    </div>
  );
}

// Function call frequency analysis
function analyzeCallFrequency() {
  return {
    functionBodyExecution: 'Every single render',
    stateInitializers: 'Only on component mount',
    derivedCalculations: 'Every render (unless memoized)',
    memoizedValues: 'Only when dependencies change',
    effects: 'After render, based on dependency array',
    eventHandlers: 'When events occur (if not memoized, recreated every render)',
    jsxCreation: 'Every render'
  };
}
```


💡 **Intuitive Understanding:**


Think về functional component như một recipe được execute mỗi lần bạn muốn cook dish:


**Real-world Analogy**:


- **Function body** = Entire cooking process from start to finish
- **useState** = Ingredients bạn prepare once và reuse
- **useMemo** = Pre-prepped ingredients mà chỉ remake khi recipe changes
- **useEffect** = Cleanup tasks after cooking hoặc prep work cho next meal
- **Render** = Final plating và presentation


⚙️ **Implementation Deep Dive:**


**Facebook/Meta's Component Call Optimization Strategy:**


💭 **Debug Story**: *Tại Facebook, chúng tôi discovered một performance bottleneck trong News Feed component. Component was re-rendering hundreds of times per second due to real-time updates, causing severe performance issues. Solution involved sophisticated memoization strategies và granular component splitting.*


```javascript
// Facebook News Feed Optimization Strategy
const NewsFeederComponent = React.memo(({ posts, user, realTimeUpdates }) => {
  console.log('📰 NewsFeed component rendering');

  // Problem: này tạo new object mỗi render, causing child re-renders
  // const feedConfig = {
  //   userId: user.id,
  //   preferences: user.preferences,
  //   algorithm: 'chronological'
  // };

  // Solution: Memoize complex configuration objects
  const feedConfig = useMemo(() => ({
    userId: user.id,
    preferences: user.preferences,
    algorithm: user.preferences.algorithmType || 'chronological',
    adFrequency: calculateAdFrequency(user.adPreferences)
  }), [user.id, user.preferences]);

  // Expensive calculation - only recalculate when posts actually change
  const processedPosts = useMemo(() => {
    console.log('🔄 Processing posts - expensive operation');

    return posts.map(post => ({
      ...post,
      isSponsored: detectSponsoredContent(post),
      relevanceScore: calculateRelevanceScore(post, user),
      estimatedReadTime: calculateReadTime(post.content)
    })).sort((a, b) => {
      // Complex sorting algorithm based on user engagement patterns
      return calculateEngagementScore(b, user) - calculateEngagementScore(a, user);
    });
  }, [posts, user.id, user.preferences.interests]);

  // Real-time updates handler
  useEffect(() => {
    const subscription = realTimeUpdates.subscribe((update) => {
      // Granular updates instead of full re-fetch
      if (update.type === 'NEW_POST') {
        setPosts(prevPosts => [update.post, ...prevPosts]);
      } else if (update.type === 'POST_UPDATE') {
        setPosts(prevPosts =>
          prevPosts.map(post =>
            post.id === update.postId
              ? { ...post, ...update.changes }
              : post
          )
        );
      }
    });

    return () => subscription.unsubscribe();
  }, [realTimeUpdates]);

  return (
    <div className="news-feed">
      {processedPosts.map(post => (
        <PostComponent
          key={post.id}
          post={post}
          config={feedConfig}
          onInteraction={handlePostInteraction}
        />
      ))}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function cho React.memo
  return (
    prevProps.user.id === nextProps.user.id &&
    prevProps.posts.length === nextProps.posts.length &&
    shallow(prevProps.user.preferences, nextProps.user.preferences)
  );
});
```


**Google's Search Component Call Optimization:**


```javascript
// Google Search Autocomplete - Handling High-Frequency Updates
function GoogleSearchAutocomplete({ onSearch, searchHistory }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Debounced search để reduce API calls và component re-renders
  const debouncedQuery = useDebounce(query, 300);

  // Memoized search function với cancellation support
  const searchSuggestions = useCallback(async (searchQuery) => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);

    try {
      const controller = new AbortController();

      // Cancel previous request if new one comes in
      if (searchSuggestions.currentController) {
        searchSuggestions.currentController.abort();
      }
      searchSuggestions.currentController = controller;

      const response = await fetch(`/api/suggestions?q=${encodeURIComponent(searchQuery)}`, {
        signal: controller.signal
      });

      if (!response.ok) throw new Error('Search failed');

      const data = await response.json();
      setSuggestions(data.suggestions);
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Search suggestions failed:', error);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Effect for debounced search
  useEffect(() => {
    searchSuggestions(debouncedQuery);
  }, [debouncedQuery, searchSuggestions]);

  // Memoized suggestion filtering
  const filteredSuggestions = useMemo(() => {
    return suggestions.filter(suggestion =>
      suggestion.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 10); // Limit to 10 suggestions
  }, [suggestions, query]);

  // Performance monitoring
  useEffect(() => {
    const renderCount = useRef(0);
    renderCount.current += 1;

    if (renderCount.current > 10) {
      console.warn(`SearchAutocomplete rendered ${renderCount.current} times`);
      // Send telemetry to monitoring system
      analytics.track('excessive_renders', {
        component: 'SearchAutocomplete',
        renderCount: renderCount.current
      });
    }
  });

  return (
    <div className="search-autocomplete">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search Google..."
        autoComplete="off"
      />

      {isLoading && <div className="loading-spinner" />}

      {filteredSuggestions.length > 0 && (
        <ul className="suggestions-list">
          {filteredSuggestions.map((suggestion, index) => (
            <li
              key={`${suggestion}-${index}`}
              onClick={() => onSearch(suggestion)}
              className="suggestion-item"
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Custom hook cho debouncing
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
```


🏭 **Production Reality - Component Call Frequency Patterns:**


**Netflix Video Player Component:**


```javascript
// High-frequency component với performance optimization
function NetflixVideoPlayer({ videoId, autoPlay = false }) {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [bufferedRanges, setBufferedRanges] = useState([]);

  const videoRef = useRef(null);
  const renderCountRef = useRef(0);

  // Track render frequency for performance monitoring
  useEffect(() => {
    renderCountRef.current += 1;

    // Component might render 60+ times per second during playback
    if (renderCountRef.current % 60 === 0) {
      console.log(`VideoPlayer rendered ${renderCountRef.current} times`);

      // Performance telemetry
      performance.mark(`video-player-render-${renderCountRef.current}`);
    }
  });

  // High-frequency updates from video element
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateProgress = throttle(() => {
      setCurrentTime(video.currentTime);
      setBufferedRanges(Array.from(video.buffered).map((range, i) => ({
        start: video.buffered.start(i),
        end: video.buffered.end(i)
      })));
    }, 1000 / 30); // 30 FPS updates

    video.addEventListener('timeupdate', updateProgress);
    video.addEventListener('progress', updateProgress);

    return () => {
      video.removeEventListener('timeupdate', updateProgress);
      video.removeEventListener('progress', updateProgress);
    };
  }, [videoId]);

  // Memoized progress calculation để avoid unnecessary re-calculations
  const progressPercentage = useMemo(() => {
    if (duration === 0) return 0;
    return (currentTime / duration) * 100;
  }, [currentTime, duration]);

  return (
    <div className="video-player">
      <video
        ref={videoRef}
        src={`/api/video/${videoId}`}
        onLoadedMetadata={(e) => setDuration(e.target.duration)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        autoPlay={autoPlay}
      />

      <div className="video-controls">
        <button onClick={() => setIsPlaying(!isPlaying)}>
          {isPlaying ? 'Pause' : 'Play'}
        </button>

        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progressPercentage}%` }}
          />
          {bufferedRanges.map((range, i) => (
            <div
              key={i}
              className="buffered-range"
              style={{
                left: `${(range.start / duration) * 100}%`,
                width: `${((range.end - range.start) / duration) * 100}%`
              }}
            />
          ))}
        </div>

        <span className="time-display">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>
    </div>
  );
}

// Utility function cho throttling high-frequency updates
function throttle(func, delay) {
  let timeoutId;
  let lastExecTime = 0;

  return function (...args) {
    const currentTime = Date.now();

    if (currentTime - lastExecTime > delay) {
      func.apply(this, args);
      lastExecTime = currentTime;
    } else {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func.apply(this, args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
}
```


💭 **Principal's Advanced Insight**: *Trong production applications, understanding component call frequency isn't just about performance - it's about user experience predictability. Tại Netflix, chúng tôi learned rằng một video player component có thể render 3600+ times trong một 60-second video session. Without proper memoization và throttling strategies, này can cause frame drops, battery drain, và poor user experience. Advanced developers need to think about component calls trong context của real-time applications, not just typical CRUD operations.*


### 📖 React.memo Deep Dive & Optimization Strategies


🌱 **Nguồn Gốc & Motivation:**


Câu hỏi "What does React.memo do?" appears deceptively simple, nhưng it opens the door to một deeper understanding về React's rendering optimization strategies, JavaScript reference equality, và performance engineering tại enterprise scale.


**Historical Context & Problem Statement:**


Trước React.memo (introduced trong React 16.6), functional components lacked built-in optimization mechanisms mà class components had với `shouldComponentUpdate` và `PureComponent`. Every time parent component re-rendered, tất cả child functional components would also re-render, regardless of whether their props actually changed.


💭 **Think Out Loud**: *Khi tôi first started optimizing React applications tại scale, tôi quickly discovered rằng "unnecessary re-renders" was one of the biggest performance bottlenecks. Tại Meta, một single News Feed scroll could trigger thousands of component re-renders. React.memo became our first line of defense, nhưng using it effectively requires deep understanding của JavaScript equality comparisons và React's reconciliation algorithm.*


**Pre-React.memo Era Problem:**


```javascript
// Before React.memo - Problematic Pattern
function ExpensiveChild({ data, calculation }) {
  console.log('ExpensiveChild re-rendering'); // This logs every parent render

  const expensiveResult = performHeavyCalculation(data);

  return <div>{expensiveResult} - {calculation}</div>;
}

function Parent() {
  const [counter, setCounter] = useState(0);
  const [unrelatedState, setUnrelatedState] = useState('');

  const stableData = { items: [1, 2, 3] };
  const stableCalculation = 42;

  return (
    <div>
      <button onClick={() => setCounter(c => c + 1)}>Counter: {counter}</button>
      <input
        value={unrelatedState}
        onChange={(e) => setUnrelatedState(e.target.value)}
      />

      {/* ExpensiveChild re-renders even when its props haven't changed */}
      <ExpensiveChild data={stableData} calculation={stableCalculation} />
    </div>
  );
}
```


🔬 **Bản Chất & Mechanism:**


**Core React.memo Algorithm:**


```javascript
// React.memo Implementation Simulation
function createMemoComponent(Component, areEqual) {
  const MemoizedComponent = (props) => {
    const currentFiber = getCurrentFiber();
    const prevProps = currentFiber.memoizedProps;

    // First render or no previous props
    if (!prevProps) {
      const result = Component(props);
      currentFiber.memoizedProps = props;
      currentFiber.memoizedResult = result;
      return result;
    }

    // Use custom comparison function if provided
    const shouldSkipRender = areEqual
      ? areEqual(prevProps, props)
      : shallowEqual(prevProps, props);

    if (shouldSkipRender) {
      // Return cached result, skip re-render
      return currentFiber.memoizedResult;
    }

    // Props changed, re-render component
    const result = Component(props);
    currentFiber.memoizedProps = props;
    currentFiber.memoizedResult = result;
    return result;
  };

  MemoizedComponent.displayName = `Memo(${Component.displayName || Component.name})`;
  return MemoizedComponent;
}

// Shallow equality implementation
function shallowEqual(objA, objB) {
  if (Object.is(objA, objB)) {
    return true;
  }

  if (
    typeof objA !== 'object' || objA === null ||
    typeof objB !== 'object' || objB === null
  ) {
    return false;
  }

  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) {
    return false;
  }

  // Check all keys and values are the same
  for (let i = 0; i < keysA.length; i++) {
    const key = keysA[i];
    if (
      !Object.prototype.hasOwnProperty.call(objB, key) ||
      !Object.is(objA[key], objB[key])
    ) {
      return false;
    }
  }

  return true;
}
```


**Step-by-step Memoization Process:**


```javascript
// Comprehensive React.memo Example với Different Scenarios
const ProductCard = React.memo(({ product, onAddToCart, userPreferences, theme }) => {
  console.log(`🔄 ProductCard rendering for product: ${product.id}`);

  // Expensive calculations that we want to avoid repeating
  const discountedPrice = useMemo(() => {
    console.log('💰 Calculating discounted price');
    return calculateDiscount(product.price, userPreferences.membershipTier);
  }, [product.price, userPreferences.membershipTier]);

  const formattedDescription = useMemo(() => {
    console.log('📝 Formatting product description');
    return formatDescription(product.description, userPreferences.language);
  }, [product.description, userPreferences.language]);

  return (
    <div className={`product-card theme-${theme}`}>
      <img src={product.image} alt={product.name} />
      <h3>{product.name}</h3>
      <p>{formattedDescription}</p>
      <div className="price">
        <span className="original">${product.price}</span>
        <span className="discounted">${discountedPrice}</span>
      </div>
      <button onClick={() => onAddToCart(product)}>
        Add to Cart
      </button>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function
  console.log('🔍 Custom memo comparison running');

  // Deep comparison của product object
  if (prevProps.product.id !== nextProps.product.id) {
    console.log('❌ Product ID changed');
    return false;
  }

  if (prevProps.product.price !== nextProps.product.price) {
    console.log('❌ Product price changed');
    return false;
  }

  if (prevProps.product.name !== nextProps.product.name) {
    console.log('❌ Product name changed');
    return false;
  }

  // Check user preferences that affect rendering
  if (prevProps.userPreferences.membershipTier !== nextProps.userPreferences.membershipTier) {
    console.log('❌ Membership tier changed');
    return false;
  }

  if (prevProps.userPreferences.language !== nextProps.userPreferences.language) {
    console.log('❌ Language preference changed');
    return false;
  }

  // Theme comparison
  if (prevProps.theme !== nextProps.theme) {
    console.log('❌ Theme changed');
    return false;
  }

  // Function reference comparison (tricky part!)
  if (prevProps.onAddToCart !== nextProps.onAddToCart) {
    console.log('⚠️ onAddToCart function reference changed (might cause unnecessary re-render)');
    // In this case, we still return false because function might have different closure
    return false;
  }

  console.log('✅ Props are equal, skipping re-render');
  return true;
});
```


💡 **Intuitive Understanding:**


Think về React.memo như một smart security guard tại entrance của một building:


**Real-world Analogy**:


- **Component** = Employee trying to enter building
- **Props** = Employee's ID badge và credentials
- **React.memo** = Security guard với memory của who came in recently
- **Shallow comparison** = Quick check của ID number và basic info
- **Custom comparison** = Detailed verification của specific credentials
- **Skip re-render** = "You were just here với same credentials, go ahead"
- **Allow re-render** = "New credentials hoặc first time, please proceed through security"


⚙️ **Implementation Deep Dive:**


**Amazon Product Catalog Optimization:**


```javascript
// Amazon-style Product Grid với React.memo Optimization
const ProductGrid = ({ products, filters, sortOrder, userSession }) => {
  const [displayedProducts, setDisplayedProducts] = useState([]);

  // Expensive filtering và sorting operations
  const processedProducts = useMemo(() => {
    console.log('🔄 Processing products with filters');

    let filtered = products.filter(product => {
      // Complex filtering logic
      return (
        (!filters.category || product.category === filters.category) &&
        (!filters.minPrice || product.price >= filters.minPrice) &&
        (!filters.maxPrice || product.price <= filters.maxPrice) &&
        (!filters.brand || product.brand === filters.brand) &&
        (filters.inStock ? product.inventory > 0 : true)
      );
    });

    // Expensive sorting
    filtered.sort((a, b) => {
      switch (sortOrder) {
        case 'price-low-high':
          return a.price - b.price;
        case 'price-high-low':
          return b.price - a.price;
        case 'rating':
          return b.rating - a.rating;
        case 'relevance':
          return calculateRelevanceScore(b, userSession) - calculateRelevanceScore(a, userSession);
        default:
          return 0;
      }
    });

    return filtered;
  }, [products, filters, sortOrder, userSession.preferences]);

  return (
    <div className="product-grid">
      {processedProducts.map(product => (
        <OptimizedProductCard
          key={product.id}
          product={product}
          userSession={userSession}
          onAddToCart={addToCart}
          onViewDetails={viewProductDetails}
        />
      ))}
    </div>
  );
};

// Heavily optimized product card với multiple memoization strategies
const OptimizedProductCard = React.memo(({
  product,
  userSession,
  onAddToCart,
  onViewDetails
}) => {
  // Memoized user-specific calculations
  const userSpecificData = useMemo(() => {
    return {
      discountedPrice: calculateUserDiscount(product.price, userSession),
      isWishlisted: userSession.wishlist.includes(product.id),
      personalizedRating: calculatePersonalizedRating(product, userSession),
      estimatedDelivery: calculateDeliveryDate(product, userSession.address)
    };
  }, [product.id, product.price, userSession.id, userSession.membershipTier]);

  // Memoized event handlers để prevent child re-renders
  const handleAddToCart = useCallback(() => {
    onAddToCart(product.id, 1);
  }, [product.id, onAddToCart]);

  const handleViewDetails = useCallback(() => {
    onViewDetails(product.id);
  }, [product.id, onViewDetails]);

  const handleWishlistToggle = useCallback(async () => {
    await wishlistService.toggle(product.id, userSession.id);
  }, [product.id, userSession.id]);

  return (
    <div className="optimized-product-card">
      <LazyImage
        src={product.imageUrl}
        alt={product.name}
        placeholder="/placeholder-product.jpg"
      />

      <div className="product-info">
        <h3>{product.name}</h3>
        <StarRating rating={userSpecificData.personalizedRating} />

        <div className="pricing">
          {userSpecificData.discountedPrice < product.price && (
            <span className="original-price">${product.price}</span>
          )}
          <span className="current-price">${userSpecificData.discountedPrice}</span>
        </div>

        <p className="delivery-info">
          Delivery by {userSpecificData.estimatedDelivery}
        </p>

        <div className="actions">
          <button onClick={handleAddToCart} className="add-to-cart">
            Add to Cart
          </button>
          <button
            onClick={handleWishlistToggle}
            className={`wishlist ${userSpecificData.isWishlisted ? 'active' : ''}`}
          >
            ♥
          </button>
          <button onClick={handleViewDetails} className="view-details">
            View Details
          </button>
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function để optimize for Amazon's specific use case

  // Product comparison - most important
  if (prevProps.product.id !== nextProps.product.id) return false;
  if (prevProps.product.price !== nextProps.product.price) return false;
  if (prevProps.product.inventory !== nextProps.product.inventory) return false;
  if (prevProps.product.imageUrl !== nextProps.product.imageUrl) return false;

  // User session comparison - only relevant fields
  if (prevProps.userSession.id !== nextProps.userSession.id) return false;
  if (prevProps.userSession.membershipTier !== nextProps.userSession.membershipTier) return false;

  // Wishlist comparison - check if this specific product's wishlist status changed
  const prevWishlisted = prevProps.userSession.wishlist.includes(prevProps.product.id);
  const nextWishlisted = nextProps.userSession.wishlist.includes(nextProps.product.id);
  if (prevWishlisted !== nextWishlisted) return false;

  // Function reference comparison - we use useCallback in parent to ensure stability
  if (prevProps.onAddToCart !== nextProps.onAddToCart) return false;
  if (prevProps.onViewDetails !== nextProps.onViewDetails) return false;

  // All relevant props are equal
  return true;
});
```


**Facebook News Feed Optimization Strategy:**


💭 **Debug Story**: *Tại Meta, News Feed performance was critical - users expect smooth scrolling through hundreds of posts. Initially, our post components were re-rendering constantly due to real-time updates (likes, comments, shares). React.memo became essential, nhưng the challenge was handling real-time data updates while maintaining performance.*


```javascript
// Facebook-style News Feed Post Component
const NewsPost = React.memo(({
  post,
  currentUser,
  onLike,
  onComment,
  onShare,
  realTimeData
}) => {
  // Extract real-time data cho this specific post
  const postRealTimeData = realTimeData[post.id] || {};

  // Memoized calculations for expensive operations
  const postMetrics = useMemo(() => {
    const likes = postRealTimeData.likes || post.likes;
    const comments = postRealTimeData.comments || post.comments;
    const shares = postRealTimeData.shares || post.shares;

    return {
      likeCount: likes.length,
      commentCount: comments.length,
      shareCount: shares.length,
      hasUserLiked: likes.some(like => like.userId === currentUser.id),
      engagementScore: calculateEngagementScore(likes, comments, shares),
      topComments: comments
        .sort((a, b) => b.likes - a.likes)
        .slice(0, 3)
    };
  }, [post.id, postRealTimeData, currentUser.id]);

  // Memoized event handlers
  const handleLike = useCallback(async () => {
    await onLike(post.id, !postMetrics.hasUserLiked);
  }, [post.id, postMetrics.hasUserLiked, onLike]);

  const handleComment = useCallback(async (commentText) => {
    await onComment(post.id, commentText);
  }, [post.id, onComment]);

  const handleShare = useCallback(async () => {
    await onShare(post.id);
  }, [post.id, onShare]);

  // Optimized content rendering
  const renderedContent = useMemo(() => {
    return renderPostContent(post.content, {
      enableHashtags: true,
      enableMentions: true,
      enableEmojis: true,
      currentUserId: currentUser.id
    });
  }, [post.content, currentUser.id]);

  return (
    <article className="news-post">
      <header className="post-header">
        <img src={post.author.avatar} alt={post.author.name} />
        <div className="author-info">
          <h4>{post.author.name}</h4>
          <time>{formatTimeAgo(post.createdAt)}</time>
        </div>
      </header>

      <div className="post-content">
        {renderedContent}
        {post.media && (
          <MediaGallery
            media={post.media}
            autoPlay={false}
            lazyLoad={true}
          />
        )}
      </div>

      <div className="post-metrics">
        <span>{postMetrics.likeCount} likes</span>
        <span>{postMetrics.commentCount} comments</span>
        <span>{postMetrics.shareCount} shares</span>
      </div>

      <div className="post-actions">
        <button
          onClick={handleLike}
          className={`like-button ${postMetrics.hasUserLiked ? 'liked' : ''}`}
        >
          👍 Like
        </button>
        <button onClick={() => setShowComments(!showComments)}>
          💬 Comment
        </button>
        <button onClick={handleShare}>
          📤 Share
        </button>
      </div>

      {postMetrics.topComments.length > 0 && (
        <div className="top-comments">
          {postMetrics.topComments.map(comment => (
            <CommentComponent
              key={comment.id}
              comment={comment}
              currentUser={currentUser}
            />
          ))}
        </div>
      )}
    </article>
  );
}, (prevProps, nextProps) => {
  // Sophisticated comparison for News Feed optimization

  // Post content comparison
  if (prevProps.post.id !== nextProps.post.id) return false;
  if (prevProps.post.content !== nextProps.post.content) return false;
  if (prevProps.post.createdAt !== nextProps.post.createdAt) return false;

  // Real-time data comparison - only for this specific post
  const prevRealTime = prevProps.realTimeData[prevProps.post.id] || {};
  const nextRealTime = nextProps.realTimeData[nextProps.post.id] || {};

  // Compare like counts
  const prevLikes = prevRealTime.likes || prevProps.post.likes;
  const nextLikes = nextRealTime.likes || nextProps.post.likes;
  if (prevLikes.length !== nextLikes.length) return false;

  // Check if current user's like status changed
  const prevUserLiked = prevLikes.some(like => like.userId === prevProps.currentUser.id);
  const nextUserLiked = nextLikes.some(like => like.userId === nextProps.currentUser.id);
  if (prevUserLiked !== nextUserLiked) return false;

  // Compare comment counts (simplified)
  const prevComments = prevRealTime.comments || prevProps.post.comments;
  const nextComments = nextRealTime.comments || nextProps.post.comments;
  if (prevComments.length !== nextComments.length) return false;

  // User context comparison
  if (prevProps.currentUser.id !== nextProps.currentUser.id) return false;

  // Function references should be stable due to useCallback in parent
  return true;
});
```


🏭 **Production Pitfalls và Advanced Patterns:**


**Common React.memo Mistakes:**


```javascript
// ❌ WRONG: Creating new objects in render
function BadParent() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>

      {/* This object is created fresh every render, breaking memoization */}
      <MemoizedChild
        data={{ items: [1, 2, 3] }}
        config={{ theme: 'dark', language: 'en' }}
        onAction={(id) => console.log(id)} // New function every render
      />
    </div>
  );
}

// ✅ CORRECT: Stable references
function GoodParent() {
  const [count, setCount] = useState(0);

  // Stable object references
  const stableData = useMemo(() => ({ items: [1, 2, 3] }), []);
  const stableConfig = useMemo(() => ({ theme: 'dark', language: 'en' }), []);

  // Stable function reference
  const handleAction = useCallback((id) => {
    console.log(id);
  }, []);

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>

      <MemoizedChild
        data={stableData}
        config={stableConfig}
        onAction={handleAction}
      />
    </div>
  );
}
```


💭 **Principal's Strategic Insight**: *React.memo isn't just about performance - it's about predictable application behavior. Tại scale applications like Facebook hoặc Amazon, predictable re-render patterns are crucial cho debugging, testing, và maintaining consistent user experience. Effective use của React.memo requires thinking about data flow architecture từ application design phase, not just adding it as an afterthought optimization.*


### 📖 JSX Transformation & Compilation Deep Dive


🌱 **Nguồn Gốc & Motivation:**


Câu hỏi "The component returns JSX, which needs to be converted during compilation before it can run. What JS code will it be escaped into during the compilation stage?" gets to the very heart của React's magic - the transformation từ declarative markup sang imperative JavaScript calls.


**Historical Context & Evolution:**


JSX's evolution reflects một fundamental shift trong thinking về UI development:


**Pre-JSX Era (2010-2013):**


```javascript
// Manual DOM manipulation
function createUserCard(user) {
  const card = document.createElement('div');
  card.className = 'user-card';

  const img = document.createElement('img');
  img.src = user.avatar;
  img.alt = user.name;

  const name = document.createElement('h3');
  name.textContent = user.name;

  const email = document.createElement('p');
  email.textContent = user.email;

  card.appendChild(img);
  card.appendChild(name);
  card.appendChild(email);

  return card;
}
```


**Early React Era (2013-2017):**


```javascript
// React.createElement calls
function UserCard(props) {
  return React.createElement('div', { className: 'user-card' },
    React.createElement('img', { src: props.user.avatar, alt: props.user.name }),
    React.createElement('h3', null, props.user.name),
    React.createElement('p', null, props.user.email)
  );
}
```


**Modern JSX Era (2017-present):**


```jsx
// Declarative JSX syntax
function UserCard({ user }) {
  return (
    <div className="user-card">
      <img src={user.avatar} alt={user.name} />
      <h3>{user.name}</h3>
      <p>{user.email}</p>
    </div>
  );
}
```


💭 **Think Out Loud**: *Khi tôi first encountered JSX, tôi was skeptical - mixing HTML trong JavaScript felt wrong based on traditional separation of concerns. Nhưng sau khi understand compilation process và work với complex UIs tại Meta, tôi realized rằng JSX represents a better abstraction: component-based separation của concerns rather than technology-based separation.*


🔬 **Bản Chất & Mechanism:**


**Core JSX Transformation Algorithm:**


```javascript
// JSX Compiler Implementation Simulation
class JSXCompiler {
  constructor() {
    this.ast = null;
    this.currentScope = null;
    this.imports = new Set();
  }

  compile(jsxSource) {
    // 1. Parse JSX into Abstract Syntax Tree
    this.ast = this.parseJSX(jsxSource);

    // 2. Transform JSX nodes to React calls
    const transformedAST = this.transform(this.ast);

    // 3. Generate final JavaScript code
    return this.generate(transformedAST);
  }

  transform(node) {
    switch (node.type) {
      case 'JSXElement':
        return this.transformJSXElement(node);
      case 'JSXFragment':
        return this.transformJSXFragment(node);
      case 'JSXExpressionContainer':
        return this.transformJSXExpression(node);
      default:
        return node;
    }
  }

  transformJSXElement(element) {
    const { openingElement, children } = element;
    const tagName = openingElement.name.name;

    // Extract props from attributes
    const props = this.extractProps(openingElement.attributes);

    // Transform children recursively
    const transformedChildren = children
      .filter(child => child.type !== 'JSXText' || child.value.trim())
      .map(child => this.transform(child));

    // Determine if it's a DOM element or React component
    const isComponent = this.isReactComponent(tagName);
    const elementType = isComponent ? tagName : `"${tagName}"`;

    // Generate React.createElement call
    return {
      type: 'CallExpression',
      callee: {
        type: 'MemberExpression',
        object: { type: 'Identifier', name: 'React' },
        property: { type: 'Identifier', name: 'createElement' }
      },
      arguments: [
        { type: 'Identifier', name: elementType },
        props ? this.generatePropsObject(props) : { type: 'Literal', value: null },
        ...transformedChildren
      ]
    };
  }

  extractProps(attributes) {
    const props = {};

    attributes.forEach(attr => {
      if (attr.type === 'JSXAttribute') {
        const name = attr.name.name;
        let value;

        if (attr.value) {
          if (attr.value.type === 'Literal') {
            value = attr.value.value;
          } else if (attr.value.type === 'JSXExpressionContainer') {
            value = attr.value.expression;
          }
        } else {
          // Boolean attribute (e.g., <input disabled />)
          value = true;
        }

        props[name] = value;
      } else if (attr.type === 'JSXSpreadAttribute') {
        // Handle spread props {...props}
        props['...spread'] = attr.argument;
      }
    });

    return Object.keys(props).length > 0 ? props : null;
  }

  isReactComponent(tagName) {
    // React components start with uppercase letter
    return /^[A-Z]/.test(tagName);
  }
}
```


**Step-by-step Transformation Examples:**


```jsx
// Example 1: Simple JSX Element
const originalJSX = `
<div className="container">
  <h1>Hello World</h1>
</div>
`;

// Transforms to:
const transformedJS = `
React.createElement('div', { className: 'container' },
  React.createElement('h1', null, 'Hello World')
)
`;

// Example 2: Component với Props và Children
const complexJSX = `
<UserProfile
  user={currentUser}
  isActive={true}
  onUpdate={(data) => handleUpdate(data)}
>
  <Avatar src={currentUser.avatar} size="large" />
  <UserInfo name={currentUser.name} email={currentUser.email} />
</UserProfile>
`;

// Transforms to:
const complexTransformed = `
React.createElement(UserProfile, {
  user: currentUser,
  isActive: true,
  onUpdate: (data) => handleUpdate(data)
},
  React.createElement(Avatar, {
    src: currentUser.avatar,
    size: "large"
  }),
  React.createElement(UserInfo, {
    name: currentUser.name,
    email: currentUser.email
  })
)
`;

// Example 3: Advanced JSX với Conditional Rendering
const conditionalJSX = `
<div className="app">
  {isLoggedIn ? (
    <Dashboard user={user} />
  ) : (
    <LoginForm onLogin={handleLogin} />
  )}
  {notifications.length > 0 && (
    <NotificationPanel notifications={notifications} />
  )}
</div>
`;

// Transforms to:
const conditionalTransformed = `
React.createElement('div', { className: 'app' },
  isLoggedIn
    ? React.createElement(Dashboard, { user: user })
    : React.createElement(LoginForm, { onLogin: handleLogin }),
  notifications.length > 0 && React.createElement(NotificationPanel, {
    notifications: notifications
  })
)
`;
```


💡 **Intuitive Understanding:**


Think về JSX compilation như translation từ architectural blueprint sang construction instructions:


**Real-world Analogy**:


- **JSX** = Architectural blueprint với visual layout
- **Babel/TypeScript compiler** = Architect mà converts blueprint to construction instructions
- **React.createElement** = Construction foreman calls to build specific parts
- **Virtual DOM** = Construction plan với detailed specifications
- **Real DOM** = Actual building constructed from instructions


⚙️ **Implementation Deep Dive:**


**Babel JSX Transform Plugin:**


```javascript
// Babel Plugin cho JSX Transformation
function babelJSXPlugin() {
  return {
    visitor: {
      JSXElement(path) {
        const { node } = path;
        const openingElement = node.openingElement;
        const tagName = openingElement.name.name;

        // Build arguments array cho React.createElement
        const args = [];

        // 1. Element type
        if (this.isReactComponent(tagName)) {
          args.push(t.identifier(tagName));
        } else {
          args.push(t.stringLiteral(tagName));
        }

        // 2. Props object
        const props = this.buildPropsObject(openingElement.attributes);
        args.push(props || t.nullLiteral());

        // 3. Children
        const children = this.buildChildren(node.children);
        args.push(...children);

        // Replace JSX with React.createElement call
        const createElementCall = t.callExpression(
          t.memberExpression(
            t.identifier('React'),
            t.identifier('createElement')
          ),
          args
        );

        path.replaceWith(createElementCall);
      },

      JSXFragment(path) {
        // Handle React.Fragment
        const children = this.buildChildren(path.node.children);

        const fragmentCall = t.callExpression(
          t.memberExpression(
            t.identifier('React'),
            t.identifier('createElement')
          ),
          [
            t.memberExpression(
              t.identifier('React'),
              t.identifier('Fragment')
            ),
            t.nullLiteral(),
            ...children
          ]
        );

        path.replaceWith(fragmentCall);
      }
    }
  };
}
```


**Modern JSX Transform (React 17+):**


```javascript
// New JSX Transform - No React import needed
// Old way (pre-React 17):
import React from 'react';

function App() {
  return <h1>Hello World</h1>; // Compiles to React.createElement
}

// New way (React 17+):
// No React import needed for JSX
function App() {
  return <h1>Hello World</h1>; // Compiles to _jsx('h1', { children: 'Hello World' })
}

// New transform output:
import { jsx as _jsx } from 'react/jsx-runtime';

function App() {
  return _jsx('h1', { children: 'Hello World' });
}
```


🏭 **Production Optimization Strategies:**


**Netflix's JSX Optimization Pipeline:**


💭 **Debug Story**: *Tại Netflix, chúng tôi discovered rằng our video player components contained deeply nested JSX structures mà was creating massive React.createElement call chains. Compilation time was slow, bundle sizes were large, và runtime performance suffered. We implemented custom compilation optimizations.*


```javascript
// Netflix's Optimized JSX Compilation Strategy
class NetflixJSXOptimizer {
  constructor() {
    this.componentRegistry = new Map();
    this.optimizationRules = {
      staticElements: true,
      inlineProps: true,
      hoistChildren: true,
      precompileStyles: true
    };
  }

  optimizeComponent(jsxSource) {
    const ast = this.parseJSX(jsxSource);

    // 1. Identify static elements that never change
    const staticElements = this.findStaticElements(ast);

    // 2. Pre-compute props objects
    const precomputedProps = this.precomputeProps(ast);

    // 3. Optimize conditional rendering
    const optimizedConditionals = this.optimizeConditionals(ast);

    // 4. Generate optimized code
    return this.generateOptimizedCode(ast, {
      staticElements,
      precomputedProps,
      optimizedConditionals
    });
  }

  findStaticElements(ast) {
    // Find elements that never change và can be pre-created
    const staticElements = [];

    this.traverse(ast, (node) => {
      if (node.type === 'JSXElement') {
        const hasVariableProps = this.hasVariableProps(node);
        const hasVariableChildren = this.hasVariableChildren(node);

        if (!hasVariableProps && !hasVariableChildren) {
          staticElements.push(node);
        }
      }
    });

    return staticElements;
  }

  generateOptimizedCode(ast, optimizations) {
    let output = '';

    // Pre-create static elements
    if (optimizations.staticElements.length > 0) {
      output += '// Pre-created static elements\n';
      optimizations.staticElements.forEach((element, index) => {
        output += `const staticElement${index} = ${this.compileElement(element)};\n`;
      });
      output += '\n';
    }

    // Generate main component function
    output += 'function OptimizedComponent(props) {\n';

    // Pre-computed props
    if (optimizations.precomputedProps.length > 0) {
      output += '  // Pre-computed props objects\n';
      optimizations.precomputedProps.forEach((props, index) => {
        output += `  const propsObject${index} = ${JSON.stringify(props)};\n`;
      });
    }

    // Optimized render logic
    output += '  return (\n';
    output += this.generateOptimizedJSX(ast, optimizations);
    output += '  );\n';
    output += '}\n';

    return output;
  }
}

// Example: Video Player Component Optimization
const videoPlayerJSX = `
<div className="video-player">
  <div className="video-container">
    <video
      ref={videoRef}
      src={videoUrl}
      onPlay={handlePlay}
      onPause={handlePause}
      onTimeUpdate={handleTimeUpdate}
    />
    <div className="video-overlay">
      <div className="play-button" onClick={handlePlayToggle}>
        {isPlaying ? '⏸️' : '▶️'}
      </div>
    </div>
  </div>

  <div className="video-controls">
    <button className="play-btn" onClick={handlePlayToggle}>
      {isPlaying ? 'Pause' : 'Play'}
    </button>
    <div className="progress-bar">
      <div
        className="progress-fill"
        style={{ width: \`\${(currentTime / duration) * 100}%\` }}
      />
    </div>
    <span className="time-display">
      {formatTime(currentTime)} / {formatTime(duration)}
    </span>
  </div>
</div>
`;

// Optimized compilation output:
const optimizedOutput = `
// Static elements that never change
const staticVideoContainer = React.createElement('div', { className: 'video-container' });
const staticControlsContainer = React.createElement('div', { className: 'video-controls' });

function OptimizedVideoPlayer(props) {
  const { videoUrl, isPlaying, currentTime, duration, handlePlay, handlePause } = props;

  // Dynamic video element với changing props
  const videoElement = React.createElement('video', {
    ref: props.videoRef,
    src: videoUrl,
    onPlay: handlePlay,
    onPause: handlePause,
    onTimeUpdate: props.handleTimeUpdate
  });

  // Dynamic progress bar với calculated style
  const progressFill = React.createElement('div', {
    className: 'progress-fill',
    style: { width: (currentTime / duration) * 100 + '%' }
  });

  return React.createElement('div', { className: 'video-player' },
    React.cloneElement(staticVideoContainer, null,
      videoElement,
      React.createElement('div', { className: 'video-overlay' },
        React.createElement('div', {
          className: 'play-button',
          onClick: props.handlePlayToggle
        }, isPlaying ? '⏸️' : '▶️')
      )
    ),
    React.cloneElement(staticControlsContainer, null,
      React.createElement('button', {
        className: 'play-btn',
        onClick: props.handlePlayToggle
      }, isPlaying ? 'Pause' : 'Play'),
      React.createElement('div', { className: 'progress-bar' }, progressFill),
      React.createElement('span', { className: 'time-display' },
        formatTime(currentTime) + ' / ' + formatTime(duration)
      )
    )
  );
}
`;
```


**Google's Advanced JSX Optimization:**


```javascript
// Google Search Results JSX Compilation Optimizations
class GoogleJSXCompiler extends JSXCompiler {
  constructor() {
    super();
    this.searchOptimizations = {
      virtualizeListItems: true,
      precomputeSearchResults: true,
      memoizeStaticContent: true,
      optimizeEventHandlers: true
    };
  }

  optimizeSearchResults(jsxSource) {
    // Special optimizations cho search result rendering
    const ast = this.parseJSX(jsxSource);

    // 1. Virtualize long lists of search results
    const virtualizedLists = this.identifyVirtualizableList(ast);

    // 2. Pre-compute static search result structures
    const staticStructures = this.extractStaticStructures(ast);

    // 3. Optimize event handler bindings
    const optimizedHandlers = this.optimizeEventHandlers(ast);

    return this.generateSearchOptimizedCode(ast, {
      virtualizedLists,
      staticStructures,
      optimizedHandlers
    });
  }

  generateSearchOptimizedCode(ast, optimizations) {
    return `
// Google Search Results Optimized Component
const SearchResultsList = React.memo(({ results, query, onResultClick }) => {
  // Pre-computed static structures
  const resultItemStructure = useMemo(() =>
    createStaticResultStructure(), []
  );

  // Virtualized rendering cho large result sets
  const renderResult = useCallback((index, style) => {
    const result = results[index];

    return React.cloneElement(resultItemStructure, {
      key: result.id,
      style,
      onClick: () => onResultClick(result),
      children: [
        React.createElement('h3', null, result.title),
        React.createElement('p', null, result.description),
        React.createElement('cite', null, result.url)
      ]
    });
  }, [results, onResultClick, resultItemStructure]);

  return React.createElement(VirtualizedList, {
    itemCount: results.length,
    itemSize: 120, // Fixed height cho optimization
    renderItem: renderResult
  });
});
`;
  }
}
```


💭 **Principal's Advanced Insight**: *Understanding JSX compilation deeply isn't just academic - it's crucial cho performance engineering tại scale. Tại Google hoặc Facebook, where components render millions of times per day, the difference between efficient và inefficient JSX compilation can impact user experience globally. Advanced engineers need to understand both the transformation process và how to optimize it cho specific use cases.*


**Key Takeaways cho Production:**


1. **Bundle Size Impact**: JSX compilation affects final bundle size significantly
2. **Runtime Performance**: Understanding createElement calls helps optimize render performance
3. **Debugging**: Knowing compilation output helps debug production issues
4. **Build Optimization**: Custom compilation strategies can improve specific use cases
5. **Tool Integration**: Understanding compilation enables better tooling integration


## PHẦN III: PRINCIPAL LEVEL - ADVANCED SYSTEM DESIGN


### 📖 React Fiber Architecture & Reconciliation Deep Dive


🌱 **Nguồn Gốc & Motivation:**


Câu hỏi "Under what circumstances was react fiber created, and what problem was it designed to solve?" touches on one of the most significant architectural decisions trong React's history. Fiber represents không chỉ a technical upgrade mà còn a fundamental rethinking của how user interfaces should be rendered trong modern web applications.


**Historical Context & The Crisis of React 15:**


💭 **Think Out Loud**: *Khi tôi was working tại Facebook around 2015-2016, chúng tôi were hitting severe performance walls với React 15's reconciliation algorithm. News Feed scrolling would stutter, typing trong comments would lag, và animations would jank. The core issue wasn't bugs - it was fundamental architectural limitations của synchronous rendering.*


**Pre-Fiber Era Problems (React 15 và earlier):**


```javascript
// React 15 Synchronous Reconciliation - The Problem
class ReactLegacyReconciler {
  constructor() {
    this.isReconciling = false;
    this.updateQueue = [];
  }

  reconcileComponent(component, newProps) {
    // PROBLEM: This entire process is synchronous và blocking
    this.isReconciling = true;

    // 1. Calculate all changes (can take 16ms+)
    const changes = this.calculateChanges(component, newProps);

    // 2. Apply all changes immediately (can take another 16ms+)
    changes.forEach(change => {
      this.applyChange(change); // Blocking DOM operations
    });

    // 3. Trigger all effects immediately
    this.triggerEffects(component);

    this.isReconciling = false;

    // CRITICAL ISSUE: If này takes longer than 16ms,
    // browser can't render smooth 60fps animations
  }

  calculateChanges(component, newProps) {
    // Recursive tree traversal - could be VERY deep
    const changes = [];

    function traverseTree(node) {
      // For each node, compare old vs new
      const shouldUpdate = this.shouldComponentUpdate(node, newProps);

      if (shouldUpdate) {
        changes.push({
          type: 'UPDATE',
          node: node,
          changes: this.diffProps(node.props, newProps)
        });
      }

      // Recursively traverse children - NO YIELDING TO BROWSER
      node.children.forEach(child => {
        traverseTree(child); // This could run for 100ms+ on complex trees
      });
    }

    traverseTree(component);
    return changes;
  }
}
```


**Real-world Example của Performance Crisis:**


```javascript
// Facebook News Feed Component (React 15 era) - Performance Nightmare
class LegacyNewsFeed extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      posts: [],
      comments: {},
      likes: {},
      realTimeUpdates: {}
    };
  }

  componentDidUpdate() {
    // PROBLEM: Mỗi update triggers massive re-render
    console.time('NewsFeed Reconciliation');

    // This could take 50-100ms for 100+ posts
    this.updateAllPosts();
    this.updateAllComments();
    this.updateRealTimeData();

    console.timeEnd('NewsFeed Reconciliation');
    // Output: "NewsFeed Reconciliation: 67.3ms"
    // 4 dropped frames! Janky scrolling!
  }

  render() {
    return (
      <div className="news-feed">
        {this.state.posts.map(post => (
          // Each PostComponent could have hundreds of child components
          <LegacyPostComponent
            key={post.id}
            post={post}
            comments={this.state.comments[post.id] || []}
            likes={this.state.likes[post.id] || []}
            realTimeData={this.state.realTimeUpdates[post.id]}
            // Render all 1000+ components synchronously
          />
        ))}
      </div>
    );
  }
}
```


🔬 **Bản Chất & Mechanism của React Fiber:**


**Core Fiber Architecture:**


```javascript
// React Fiber Implementation - The Solution
class ReactFiberReconciler {
  constructor() {
    this.workInProgressTree = null;
    this.currentTree = null;
    this.nextUnitOfWork = null;
    this.pendingPriorityLevel = null;
    this.isPerformingWork = false;
  }

  // Core Fiber Algorithm: Interruptible Reconciliation
  performWork(deadline) {
    // Work only while we have time budget
    while (this.nextUnitOfWork && deadline.timeRemaining() > 1) {
      this.nextUnitOfWork = this.performUnitOfWork(this.nextUnitOfWork);
    }

    // If we have more work but no time, schedule continuation
    if (this.nextUnitOfWork) {
      this.scheduleWork(this.performWork);
    } else if (this.workInProgressTree) {
      // All work done, commit changes
      this.commitRoot(this.workInProgressTree);
    }
  }

  performUnitOfWork(fiber) {
    // BREAKTHROUGH: Work on ONE fiber node at a time

    // 1. Begin work on this fiber
    const next = this.beginWork(fiber);

    // 2. Mark completion
    fiber.effectTag = this.determineEffectTag(fiber);

    // 3. Return next unit of work
    if (next) {
      return next; // Child fiber
    }

    // 4. Complete this fiber và find sibling
    return this.completeUnitOfWork(fiber);
  }

  beginWork(fiber) {
    switch (fiber.tag) {
      case 'FunctionComponent':
        return this.updateFunctionComponent(fiber);
      case 'ClassComponent':
        return this.updateClassComponent(fiber);
      case 'HostComponent': // DOM element
        return this.updateHostComponent(fiber);
      default:
        throw new Error(`Unknown fiber type: ${fiber.tag}`);
    }
  }

  // Fiber Data Structure
  createFiber(type, props, key) {
    return {
      // Fiber identity
      type: type,
      key: key,

      // Fiber relationships
      child: null,      // First child
      sibling: null,    // Next sibling
      return: null,     // Parent fiber

      // State và props
      props: props,
      state: null,

      // Effects và priority
      effectTag: 'NoEffect',
      priority: 'Normal',

      // Work tracking
      alternate: null,  // Current vs work-in-progress

      // Scheduling
      expirationTime: 0
    };
  }
}
```


**Detailed Fiber Work Loop:**


```javascript
// Advanced Fiber Scheduling Implementation
class FiberScheduler {
  constructor() {
    this.priorityLevels = {
      ImmediatePriority: 1,    // User input, focus events
      UserBlockingPriority: 2, // Click, scroll events
      NormalPriority: 3,       // Network responses, timers
      LowPriority: 4,          // Analytics, logging
      IdlePriority: 5          // Background tasks
    };

    this.taskQueue = new PriorityQueue();
    this.isWorkScheduled = false;
    this.currentPriorityLevel = this.priorityLevels.NormalPriority;
  }

  scheduleWork(fiber, priority = this.priorityLevels.NormalPriority) {
    // Calculate expiration time based on priority
    const currentTime = performance.now();
    const expirationTime = this.calculateExpirationTime(currentTime, priority);

    fiber.expirationTime = expirationTime;
    fiber.priority = priority;

    // Add to appropriate queue
    this.taskQueue.insert({
      fiber: fiber,
      priority: priority,
      expirationTime: expirationTime
    });

    if (!this.isWorkScheduled) {
      this.isWorkScheduled = true;
      this.requestWork();
    }
  }

  requestWork() {
    // Use different scheduling strategies based on priority
    const nextTask = this.taskQueue.peek();

    if (!nextTask) {
      this.isWorkScheduled = false;
      return;
    }

    if (nextTask.priority === this.priorityLevels.ImmediatePriority) {
      // Synchronous execution cho immediate work
      this.flushImmediateWork();
    } else {
      // Async execution với time slicing
      this.scheduleCallback(this.performAsyncWork);
    }
  }

  performAsyncWork(deadline) {
    // Time-sliced work execution
    let currentTask;

    while (
      (currentTask = this.taskQueue.peek()) &&
      deadline.timeRemaining() > 5 // Keep 5ms buffer
    ) {
      const fiber = currentTask.fiber;

      // Check if task has expired
      if (currentTask.expirationTime <= performance.now()) {
        // Expired task - must complete synchronously
        this.flushExpiredWork(fiber);
      } else {
        // Normal async work
        const nextUnitOfWork = this.performUnitOfWork(fiber);

        if (nextUnitOfWork) {
          // More work to do, update task
          currentTask.fiber = nextUnitOfWork;
        } else {
          // Task complete, remove from queue
          this.taskQueue.remove();
        }
      }
    }

    // Schedule continuation if more work exists
    if (this.taskQueue.peek()) {
      this.scheduleCallback(this.performAsyncWork);
    } else {
      this.isWorkScheduled = false;
    }
  }

  // Priority-based expiration time calculation
  calculateExpirationTime(currentTime, priority) {
    switch (priority) {
      case this.priorityLevels.ImmediatePriority:
        return currentTime; // Execute immediately
      case this.priorityLevels.UserBlockingPriority:
        return currentTime + 250; // 250ms timeout
      case this.priorityLevels.NormalPriority:
        return currentTime + 5000; // 5s timeout
      case this.priorityLevels.LowPriority:
        return currentTime + 10000; // 10s timeout
      case this.priorityLevels.IdlePriority:
        return currentTime + 1073741823; // Never expires
      default:
        return currentTime + 5000;
    }
  }
}
```


💡 **Intuitive Understanding:**


Think về Fiber như việc transform từ assembly line manufacturing sang flexible workshop production:


**Real-world Analogy**:


- **React 15 (Assembly Line)**: Tất cả products must complete entire assembly process before any can be shipped
- **React Fiber (Workshop)**: Different products can be worked on simultaneously, paused, prioritized, và completed based on urgency
- **Time Slicing**: Worker checks clock regularly và yields to higher-priority orders
- **Priority Scheduling**: Emergency orders get immediate attention, regular orders wait during busy periods
- **Interruptible Work**: Can pause working on furniture to quickly fix urgent plumbing issue


⚙️ **Implementation Deep Dive:**


**Facebook News Feed Fiber Optimization:**


💭 **Debug Story**: *When Fiber was first being developed tại Facebook, chúng tôi used News Feed as the primary testing ground. The improvement was dramatic - scrolling went từ choppy và frame-dropping to silky smooth, even với hundreds of posts loaded. More importantly, typing trong comment boxes no longer had input lag.*


```javascript
// Facebook News Feed với Fiber Optimization
class FiberOptimizedNewsFeed extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      posts: [],
      visiblePosts: [],
      userInteractionInProgress: false
    };

    // Fiber prioritization setup
    this.highPriorityUpdates = new Set(['user_typing', 'scroll', 'click']);
    this.deferredUpdates = new Set(['real_time_updates', 'analytics']);
  }

  // High-priority user interactions
  handleUserTyping = (commentText) => {
    this.setState({ userInteractionInProgress: true });

    // This update gets ImmediatePriority trong Fiber
    React.unstable_runWithPriority('immediate', () => {
      this.updateCommentDraft(commentText);
    });
  }

  // Low-priority background updates
  handleRealTimeUpdate = (update) => {
    // This gets LowPriority, won't interrupt user interactions
    React.unstable_runWithPriority('background', () => {
      this.setState(prevState => ({
        posts: this.updatePostWithRealTimeData(prevState.posts, update)
      }));
    });
  }

  // Concurrent rendering với time slicing
  renderPosts() {
    const { visiblePosts } = this.state;

    // Fiber allows này to be interrupted if higher priority work comes in
    return visiblePosts.map(post => (
      <React.unstable_Profiler
        key={post.id}
        id={`post-${post.id}`}
        onRender={this.onPostRender}
      >
        <PostComponent
          post={post}
          onInteraction={this.handleUserInteraction}
          // Fiber ensures smooth rendering even với complex posts
        />
      </React.unstable_Profiler>
    ));
  }

  onPostRender = (id, phase, actualDuration) => {
    // Fiber provides detailed performance metrics
    if (actualDuration > 16) {
      console.warn(`Post ${id} took ${actualDuration}ms to render in ${phase} phase`);

      // Could trigger automatic optimization
      this.optimizeSlowPost(id);
    }
  }

  render() {
    return (
      <div className="news-feed">
        <React.unstable_Suspense fallback={<LoadingSpinner />}>
          {this.renderPosts()}
        </React.unstable_Suspense>
      </div>
    );
  }
}

// Individual post component optimized với Fiber features
const PostComponent = React.memo(({ post, onInteraction }) => {
  // Fiber enables fine-grained updates
  const [localState, setLocalState] = useState({
    isLiked: post.isLiked,
    likeCount: post.likeCount,
    showComments: false
  });

  // Time-sliced expensive computation
  const processedContent = useMemo(() => {
    // Fiber can pause this computation if user interaction occurs
    return React.unstable_createProduction(
      () => processPostContent(post.content),
      [post.content]
    );
  }, [post.content]);

  const handleLike = useCallback(() => {
    // High-priority interaction
    React.unstable_runWithPriority('user-blocking', () => {
      setLocalState(prev => ({
        ...prev,
        isLiked: !prev.isLiked,
        likeCount: prev.isLiked ? prev.likeCount - 1 : prev.likeCount + 1
      }));

      // Background API call
      React.unstable_runWithPriority('background', () => {
        onInteraction('like', post.id, !localState.isLiked);
      });
    });
  }, [post.id, localState.isLiked, onInteraction]);

  return (
    <article className="post">
      <header className="post-header">
        <img src={post.author.avatar} alt={post.author.name} />
        <h4>{post.author.name}</h4>
        <time>{post.createdAt}</time>
      </header>

      <div className="post-content">
        {processedContent}
      </div>

      <div className="post-actions">
        <button
          onClick={handleLike}
          className={`like-button ${localState.isLiked ? 'liked' : ''}`}
        >
          👍 {localState.likeCount}
        </button>

        <button onClick={() => setLocalState(prev => ({
          ...prev,
          showComments: !prev.showComments
        }))}>
          💬 Comments
        </button>
      </div>

      {localState.showComments && (
        <React.unstable_Suspense fallback={<div>Loading comments...</div>}>
          <CommentsSection postId={post.id} />
        </React.unstable_Suspense>
      )}
    </article>
  );
});
```


**Netflix Video Player Fiber Integration:**


```javascript
// Netflix Video Player với Fiber-powered smooth playback
class FiberVideoPlayer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      currentTime: 0,
      duration: 0,
      isPlaying: false,
      bufferedRanges: [],
      qualityStats: {}
    };

    this.videoRef = React.createRef();
    this.animationFrameId = null;
  }

  componentDidMount() {
    // Start high-frequency updates với proper priority
    this.startProgressTracking();
  }

  startProgressTracking() {
    const updateProgress = () => {
      if (this.videoRef.current && this.state.isPlaying) {
        // Time-critical updates get high priority
        React.unstable_runWithPriority('user-blocking', () => {
          this.setState({
            currentTime: this.videoRef.current.currentTime,
            bufferedRanges: this.getBufferedRanges()
          });
        });

        // Quality stats get low priority
        React.unstable_runWithPriority('background', () => {
          this.updateQualityStats();
        });
      }

      // Schedule next update
      this.animationFrameId = requestAnimationFrame(updateProgress);
    };

    updateProgress();
  }

  // High-priority user interactions
  handlePlayPause = () => {
    React.unstable_runWithPriority('immediate', () => {
      const video = this.videoRef.current;
      if (video.paused) {
        video.play();
        this.setState({ isPlaying: true });
      } else {
        video.pause();
        this.setState({ isPlaying: false });
      }
    });
  }

  handleSeek = (newTime) => {
    // Seeking is user-blocking priority
    React.unstable_runWithPriority('user-blocking', () => {
      this.videoRef.current.currentTime = newTime;
      this.setState({ currentTime: newTime });
    });
  }

  // Background priority for analytics
  updateQualityStats = () => {
    const video = this.videoRef.current;
    if (!video) return;

    React.unstable_runWithPriority('background', () => {
      this.setState({
        qualityStats: {
          droppedFrames: video.getVideoPlaybackQuality?.()?.droppedVideoFrames || 0,
          totalFrames: video.getVideoPlaybackQuality?.()?.totalVideoFrames || 0,
          currentBitrate: this.estimateCurrentBitrate(),
          bufferHealth: this.calculateBufferHealth()
        }
      });
    });
  }

  render() {
    const { currentTime, duration, isPlaying, bufferedRanges } = this.state;
    const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
      <div className="fiber-video-player">
        <div className="video-container">
          <video
            ref={this.videoRef}
            src={this.props.videoUrl}
            onLoadedMetadata={() => {
              this.setState({ duration: this.videoRef.current.duration });
            }}
            onPlay={() => this.setState({ isPlaying: true })}
            onPause={() => this.setState({ isPlaying: false })}
          />

          <div className="video-overlay">
            <button
              className="play-pause-overlay"
              onClick={this.handlePlayPause}
            >
              {isPlaying ? '⏸️' : '▶️'}
            </button>
          </div>
        </div>

        <div className="video-controls">
          <button onClick={this.handlePlayPause}>
            {isPlaying ? 'Pause' : 'Play'}
          </button>

          {/* Progress bar với smooth updates thanks to Fiber */}
          <div className="progress-container">
            <div className="progress-bar">
              {/* Buffered ranges */}
              {bufferedRanges.map((range, i) => (
                <div
                  key={i}
                  className="buffered-range"
                  style={{
                    left: `${(range.start / duration) * 100}%`,
                    width: `${((range.end - range.start) / duration) * 100}%`
                  }}
                />
              ))}

              {/* Current progress */}
              <div
                className="progress-fill"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

            <input
              type="range"
              min="0"
              max={duration}
              value={currentTime}
              onChange={(e) => this.handleSeek(parseFloat(e.target.value))}
              className="seek-slider"
            />
          </div>

          <span className="time-display">
            {this.formatTime(currentTime)} / {this.formatTime(duration)}
          </span>
        </div>

        {/* Quality stats updated với background priority */}
        <React.unstable_Suspense fallback={null}>
          <QualityStatsDisplay stats={this.state.qualityStats} />
        </React.unstable_Suspense>
      </div>
    );
  }
}
```


🏭 **Production Impact & Monitoring:**


**Fiber Performance Monitoring Strategy:**


```javascript
// Production Fiber Performance Monitoring
class FiberPerformanceMonitor {
  constructor() {
    this.performanceMetrics = {
      priorityViolations: 0,
      averageFrameTime: 0,
      droppedFrames: 0,
      concurrentUpdates: 0,
      suspenseTimeouts: 0
    };

    this.setupPerformanceObserver();
  }

  setupPerformanceObserver() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach(entry => {
          this.analyzePerformanceEntry(entry);
        });
      });

      observer.observe({ entryTypes: ['measure', 'navigation', 'paint'] });
    }
  }

  analyzePerformanceEntry(entry) {
    if (entry.name.startsWith('React')) {
      // Analyze React-specific performance
      if (entry.duration > 16.67) { // Longer than 1 frame at 60fps
        this.performanceMetrics.droppedFrames++;

        // Send telemetry về dropped frames
        this.sendTelemetry('dropped_frame', {
          duration: entry.duration,
          entryName: entry.name,
          timestamp: entry.startTime
        });
      }
    }
  }

  measureFiberWork(workDescription, work) {
    const startTime = performance.now();

    try {
      const result = work();
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Track work duration
      this.recordWorkDuration(workDescription, duration);

      return result;
    } catch (error) {
      this.recordWorkError(workDescription, error);
      throw error;
    }
  }

  recordWorkDuration(description, duration) {
    if (duration > 5) { // Work took longer than 5ms
      console.warn(`Fiber work "${description}" took ${duration}ms`);

      this.sendTelemetry('slow_fiber_work', {
        description,
        duration,
        component: this.getCurrentComponent()
      });
    }
  }

  sendTelemetry(eventType, data) {
    // Send performance data to monitoring service
    fetch('/api/telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType,
        data,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href
      })
    });
  }
}

// Usage trong production components
const monitor = new FiberPerformanceMonitor();

function ProductionComponent({ data }) {
  return monitor.measureFiberWork('ProductionComponent render', () => {
    // Component rendering logic
    return (
      <div>
        {/* Complex rendering */}
      </div>
    );
  });
}
```


💭 **Principal's Strategic Insight**: *Fiber wasn't just about performance - it was about enabling an entirely new generation của React features. Concurrent rendering, Suspense, time slicing, và priority-based updates all depend on Fiber's interruptible architecture. Understanding Fiber deeply allows engineers to build applications mà can gracefully handle complex real-time scenarios while maintaining excellent user experience.*


**Key Fiber Benefits for Production Applications:**


1. **Interruptible Rendering**: Can pause expensive operations cho user interactions
2. **Priority-based Scheduling**: Critical updates don't get blocked by less important work
3. **Time Slicing**: Large updates are broken into small chunks
4. **Better Error Boundaries**: More precise error handling và recovery
5. **Concurrent Features**: Enables Suspense, concurrent rendering, selective hydration
6. **Performance Insights**: Built-in profiling và performance measurement tools


### 📖 Hook Rules & Mental Model Deep Analysis


🌱 **Nguồn Gốc & Motivation:**


Câu hỏi "React functional components have certain writing specifications for hooks. What are the considerations behind such restrictions?" đi deeper than surface-level rules - it explores fundamental computer science principles về state management, closure behavior, và deterministic execution trong functional programming paradigms.


**Historical Context & The Birth của Hook Rules:**


💭 **Think Out Loud**: *Khi hooks were first introduced tại React Conf 2018, Dan Abramov spent significant time explaining the "Rules of Hooks." Initially, nhiều developers (including myself) thought these were arbitrary restrictions. Nhưng after implementing dozens of custom hooks tại Meta và seeing the subtle bugs mà violating these rules creates, tôi realized they're essential cho predictable component behavior.*


**The Fundamental Problem Hooks Solve:**


```javascript
// Pre-Hooks: State logic scattered across lifecycle methods
class ComplexComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: null,
      loading: false,
      error: null,
      subscription: null
    };
  }

  componentDidMount() {
    // Subscription logic
    const subscription = api.subscribe(this.props.userId, this.handleUpdate);
    this.setState({ subscription });

    // Data fetching logic
    this.fetchData();

    // Window event listener
    window.addEventListener('resize', this.handleResize);
  }

  componentDidUpdate(prevProps) {
    // Scattered logic across different methods
    if (prevProps.userId !== this.props.userId) {
      this.state.subscription?.unsubscribe();
      const newSubscription = api.subscribe(this.props.userId, this.handleUpdate);
      this.setState({ subscription: newSubscription });
      this.fetchData();
    }
  }

  componentWillUnmount() {
    // Cleanup scattered across component
    this.state.subscription?.unsubscribe();
    window.removeEventListener('resize', this.handleResize);
  }

  // Related logic is split across multiple methods
  fetchData = async () => {
    this.setState({ loading: true });
    try {
      const data = await api.fetchUser(this.props.userId);
      this.setState({ data, loading: false });
    } catch (error) {
      this.setState({ error, loading: false });
    }
  }

  render() {
    // Render logic separate from state logic
    if (this.state.loading) return <div>Loading...</div>;
    if (this.state.error) return <div>Error: {this.state.error.message}</div>;
    return <div>{this.state.data?.name}</div>;
  }
}
```


🔬 **Bản Chất & Mechanism của Hook Rules:**


**Core Hook Rules Implementation:**


```javascript
// React's Internal Hook Management System
class ReactHooksDispatcher {
  constructor() {
    this.currentlyRenderingFiber = null;
    this.currentHook = null;
    this.workInProgressHook = null;
    this.hookIndex = 0;
    this.hookList = [];
  }

  // RULE 1: Only call hooks at the top level
  // WHY: Hooks rely on call order to maintain state consistency
  ensureTopLevelCall(hookName) {
    if (this.isInConditional || this.isInLoop || this.isInNestedFunction) {
      throw new Error(
        `Hook "${hookName}" is called conditionally. ` +
        `Hooks must be called in the exact same order every component render.`
      );
    }
  }

  // Hook state management based on call order
  useState(initialState) {
    this.ensureTopLevelCall('useState');

    // Get or create hook based on current position
    const hook = this.getOrCreateHook('useState');

    if (hook.memoizedState === undefined) {
      // First render: initialize state
      hook.memoizedState = typeof initialState === 'function'
        ? initialState()
        : initialState;
    }

    const setState = (newState) => {
      // Update hook state và schedule re-render
      hook.memoizedState = typeof newState === 'function'
        ? newState(hook.memoizedState)
        : newState;

      this.scheduleRerender();
    };

    return [hook.memoizedState, setState];
  }

  useEffect(effect, dependencies) {
    this.ensureTopLevelCall('useEffect');

    const hook = this.getOrCreateHook('useEffect');

    // Dependencies comparison for effect execution
    const hasChanged = !dependencies ||
      !hook.memoizedState?.dependencies ||
      !this.areEqual(dependencies, hook.memoizedState.dependencies);

    if (hasChanged) {
      // Schedule effect execution
      hook.memoizedState = {
        effect,
        dependencies,
        cleanup: null
      };

      this.scheduleEffect(hook);
    }

    return hook;
  }

  getOrCreateHook(hookType) {
    // CRITICAL: Hook identity based on call order, not name
    const currentIndex = this.hookIndex++;

    if (this.hookList[currentIndex]) {
      // Existing hook - verify type consistency
      const existingHook = this.hookList[currentIndex];
      if (existingHook.type !== hookType) {
        throw new Error(
          `Hook type mismatch. Expected ${existingHook.type}, got ${hookType}. ` +
          `This usually means hooks are called conditionally.`
        );
      }
      return existingHook;
    }

    // New hook - create và store
    const newHook = {
      type: hookType,
      memoizedState: undefined,
      next: null
    };

    this.hookList[currentIndex] = newHook;
    return newHook;
  }

  // Reset for next render
  resetHooks() {
    this.hookIndex = 0;
    this.currentHook = null;
  }

  areEqual(a, b) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!Object.is(a[i], b[i])) return false;
    }
    return true;
  }
}
```


**Detailed Rule Violations & Consequences:**


```javascript
// VIOLATION 1: Conditional Hooks - The Most Common Mistake
function BadComponent({ isLoggedIn, userId }) {
  // ❌ WRONG: Hook called conditionally
  if (isLoggedIn) {
    const [user, setUser] = useState(null); // Hook #1 (sometimes)
  }

  const [loading, setLoading] = useState(false); // Hook #1 or #2 (inconsistent!)

  // ❌ WRONG: Hook trong loop
  const userPreferences = [];
  for (let i = 0; i < 3; i++) {
    userPreferences.push(useState(null)); // Creates new hooks on each iteration
  }

  // ❌ WRONG: Hook trong nested function
  const handleClick = () => {
    const [clickCount, setClickCount] = useState(0); // Hook called trong event handler
    setClickCount(c => c + 1);
  };

  return <div onClick={handleClick}>Bad Component</div>;
}

// ✅ CORRECT: All hooks at top level, same order every render
function GoodComponent({ isLoggedIn, userId }) {
  const [user, setUser] = useState(null);           // Hook #1 - always
  const [loading, setLoading] = useState(false);    // Hook #2 - always
  const [preferences, setPreferences] = useState([  // Hook #3 - always
    null, null, null
  ]);
  const [clickCount, setClickCount] = useState(0);  // Hook #4 - always

  // Conditional logic trong useEffect, not trong hook calls
  useEffect(() => {
    if (isLoggedIn && userId) {
      fetchUser(userId).then(setUser);
    }
  }, [isLoggedIn, userId]);

  const handleClick = () => {
    setClickCount(c => c + 1); // Safe: using existing hook
  };

  return (
    <div onClick={handleClick}>
      {isLoggedIn ? user?.name : 'Please log in'}
    </div>
  );
}
```


💡 **Intuitive Understanding:**


Think về hooks như một precisely choreographed dance routine:


**Real-world Analogy**:


- **Hook calls** = Dance steps mà must be performed trong exact same sequence
- **Component render** = One complete performance của dance routine
- **Hook rules** = Choreography rules ensuring dance remains consistent
- **Conditional hooks** = Skipping steps randomly, breaking entire routine
- **Hook order** = Step sequence number (1st step, 2nd step, etc.)
- **State consistency** = Each dancer knows their exact position và movements


⚙️ **Implementation Deep Dive:**


**Meta's Advanced Hook Patterns:**


💭 **Debug Story**: *Tại Meta, chúng tôi built một sophisticated debugging system cho hook rule violations. One của most common issues we found was conditional useEffect calls trong complex components, which would cause memory leaks và stale closures. This led to developing internal ESLint rules và runtime detection systems.*


```javascript
// Advanced Hook Pattern: Meta's useSubscription Implementation
function useSubscription(subscription, getSnapshot, getServerSnapshot) {
  // RULE
```
