# React 19 Interview Simulation

## You

Continue

## Claude


I'll create a comprehensive React 19 + Vite 6 senior frontend engineer interview simulation for NAB. This will be an in-depth technical discussion covering the modern travel application "Zhilv" with real-world examples and advanced concepts.


## Claude


This comprehensive React 19 + Vite 6 interview simulation demonstrates exactly the kind of deep technical discussion that NAB would conduct for a Senior Frontend Engineer position. The interview covered:


## Key Technical Areas Evaluated:


### 1. Modern React 19 Implementation


- Concurrent rendering optimization for mobile performance
- Advanced Suspense and lazy loading strategies
- React 19's enhanced TypeScript integration
- Server Component readiness for future migrations


### 2. Sophisticated State Management


- Zustand with JWT integration and persistence
- Performance-optimized waterfall store with batching
- Theme and application settings management
- Conflict resolution and optimistic updates


### 3. Real-Time Collaboration Architecture


- WebSocket management with reconnection logic
- Operational transforms for conflict resolution
- Offline-first design with sync capabilities
- Scalable presence indicators and selective awareness


### 4. Production-Ready Performance


- Virtual scrolling for large datasets
- Intelligent image lazy loading with quality controls
- Mobile responsiveness with 1px border solutions
- Memory optimization and bundle splitting strategies


### 5. Comprehensive Testing Strategy


- Unit tests for collaborative operations
- Integration testing with mock WebSockets
- Load testing with Artillery for 500+ concurrent users
- Chaos engineering for failure scenarios
- End-to-end testing with Playwright


## Interview Assessment:


The candidate demonstrated **L6 Senior Engineer level expertise** through:


- **Deep architectural thinking** with scalability considerations
- **Production-ready implementations** with error handling
- **Modern tooling mastery** (React 19, Vite 6, Zustand)
- **Real-world problem solving** for travel app complexities
- **Comprehensive testing mindset** covering all failure modes


This interview simulation provides a realistic example of NAB's rigorous technical evaluation process for senior frontend positions, emphasizing both technical depth and practical application in complex, user-facing applications.


## Claude


# NAB Senior Frontend Engineer Interview Simulation


## React 19 + Vite 6 Modern Travel Application Focus


---


### PART 1: WARM-UP & INTRODUCTION


**Interviewer**: Good morning! I'm Sarah Chen, Principal Engineer at NAB. I've been working with React for over 10 years, and I'm excited to discuss your experience with modern frontend technologies. Let's start with your background and recent work with React 19 and Vite 6.


**Candidate**: Good morning Sarah! Thank you for having me. I'm particularly excited to discuss my recent project - Zhilv, a modern travel application built with React 19 and Vite 6. This project has been an excellent opportunity to leverage cutting-edge frontend technologies in a real-world, production environment.


Over the past two years, I've been focusing heavily on React's concurrent features and modern build tools. The Zhilv project specifically showcases **React 19's concurrent rendering capabilities**, **Vite 6's enhanced build performance**, and a comprehensive **Zustand-based state management architecture**. The application handles complex scenarios like waterfall image layouts, AI-powered chat interfaces, and mobile-first responsive design.


**Interviewer**: That sounds impressive. React 19 is quite recent - what specific features made you choose it over React 18 for this project?


**Candidate**: Excellent question. The decision was driven by several compelling factors:


**1. Concurrent Rendering Improvements**: React 19's enhanced concurrent features were crucial for our waterfall layout component. We're rendering hundreds of high-resolution travel images, and the **automatic batching** and **improved Suspense** handling prevented UI freezing that we experienced with React 18.


```jsx
// React 19 Concurrent Features in Action
const WaterfallLayout = () => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)

  // React 19's automatic batching works seamlessly here
  const loadMoreImages = useCallback(async () => {
    setLoading(true)
    setError(null) // These updates are automatically batched
    setPage(prev => prev + 1)

    const newItems = await getGuidePhotos(12, page)
    setItems(prev => [...prev, ...newItems])
    setLoading(false) // Better concurrent handling
  }, [page])

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <VirtualizedGrid items={items} />
    </Suspense>
  )
}
```


**2. Server Components Foundation**: While we're client-side rendered, React 19 lays the groundwork for future SSR migration. Our component architecture is already **Server Component-ready**.


**3. Enhanced TypeScript Integration**: The improved TypeScript support, particularly with **ref forwarding** and **generic components**, made our UI library more robust.


**4. Performance Optimizations**: The **transition API improvements** are particularly beneficial for our AI chat interface where we handle streaming responses from the Coze API.


**Interviewer**: Interesting choice. Now, let's dive into Vite 6. What advantages did you see over traditional Webpack setups, especially for a production application like this?


**Candidate**: Vite 6 was transformative for our development experience and production performance. Here's our comprehensive configuration that demonstrates the advantages:


```javascript
// vite.config.js - Production-Optimized Configuration
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import { chunkSplitPlugin } from 'vite-plugin-chunk-split'

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),

      // Intelligent code splitting
      chunkSplitPlugin({
        strategy: 'split-by-experience',
        customSplitting: {
          'react-vendor': ['react', 'react-dom'],
          'router-vendor': ['react-router-dom'],
          'ui-vendor': ['react-vant', '@react-vant/icons'],
          'utils-vendor': ['axios', 'zustand'],
          'api-vendor': ['@api']
        }
      }),

      // Build analysis (conditional)
      ...(mode === 'analyze' ? [
        visualizer({
          filename: 'dist/stats.html',
          template: 'treemap',
          gzipSize: true,
          brotliSize: true
        })
      ] : [])
    ],

    server: {
      // Pre-warm critical files
      warmup: {
        clientFiles: [
          './src/App.jsx',
          './src/components/**/*.jsx',
          './src/pages/**/*.jsx'
        ]
      },

      // Production-ready proxy configuration
      proxy: {
        "/api/doubao": {
          target: "https://ark.cn-beijing.volces.com",
          changeOrigin: true,
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq) => {
              const apiKey = env.VITE_DOUBAO_IMAGE_API_KEY
              if (apiKey) {
                proxyReq.setHeader("Authorization", `Bearer ${apiKey}`)
              }
            })
          }
        }
      }
    },

    build: {
      target: 'es2015',
      cssCodeSplit: true,
      chunkSizeWarningLimit: 1000,

      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react')) return 'react-vendor'
              if (id.includes('router')) return 'router-vendor'
              if (id.includes('vant')) return 'ui-vendor'
              return 'vendor'
            }
          }
        }
      },

      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: command === 'build',
          pure_funcs: ['console.log', 'console.info']
        }
      }
    }
  }
})
```


**Key Advantages We Achieved**:


1. **Development Speed**: Cold start reduced from 45 seconds (Webpack) to 2.8 seconds
2. **HMR Performance**: Hot updates under 50ms vs 3-5 seconds with Webpack
3. **Build Optimization**: Final bundle size reduced by 35% through intelligent splitting
4. **Modern Browser Targeting**: Native ES modules support eliminated unnecessary polyfills


---


### PART 2: DEEP TECHNICAL DISCUSSION


**Interviewer**: Let's dive deeper into your state management approach. You mentioned Zustand - that's an interesting choice over Redux Toolkit. Walk me through your decision-making process and architecture.


**Candidate**: Absolutely! The state management architecture was one of our most critical decisions. We evaluated **Redux Toolkit**, **Zustand**, and **Jotai** extensively. Here's why Zustand emerged as the winner and how we implemented it:


**Architecture Overview**: We implemented a **modular store pattern** with four specialized stores:


```javascript
// Store Architecture - Centralized Export
// src/stores/index.js
export { default as useAuthStore } from './authStore'
export { default as useWaterfallStore } from './waterfallStore'
export { default as useThemeStore } from './themeStore'
export { default as useAppStore } from './appStore'
```


**1. Authentication Store with JWT Integration**:


```javascript
// authStore.js - Production-Ready JWT Management
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { generateJWT, verifyJWT, tokenManager } from '../utils/jwt'

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      token: null,
      tokenExpiresIn: 0,

      // JWT-Powered Login
      login: async (credentials) => {
        set({ isLoading: true })

        try {
          const { username, password } = credentials

          // Generate user data with random avatar
          const avatar = await getRandomAvatar()
          const userData = {
            id: Date.now(),
            username,
            email: username.includes('@') ? username : `${username}@zhilv.com`,
            avatar,
            preferences: {
              favoriteDestinations: [],
              interests: [],
              travelStyle: ''
            }
          }

          // Generate 24-hour JWT token
          const jwtToken = generateJWT(userData, 24 * 60 * 60)
          const tokenExpiresIn = getTokenRemainingTime(jwtToken)

          tokenManager.setToken(jwtToken)

          set({
            user: userData,
            token: jwtToken,
            tokenExpiresIn,
            isAuthenticated: true,
            isLoading: false
          })

          return { success: true, user: userData, token: jwtToken }
        } catch (error) {
          set({ isLoading: false, token: null })
          return { success: false, error: error.message }
        }
      },

      // Intelligent Token Refresh
      refreshToken: () => {
        const { token } = get()

        if (token && verifyJWT(token)) {
          const newToken = refreshJWT(token)
          if (newToken) {
            const userData = getUserFromToken(newToken)
            tokenManager.setToken(newToken)

            set({
              user: userData,
              token: newToken,
              tokenExpiresIn: getTokenRemainingTime(newToken)
            })
            return true
          }
        }
        return false
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
)
```


**2. Waterfall Store - Complex Async State Management**:


```javascript
// waterfallStore.js - Performance-Optimized Image Loading
const useWaterfallStore = create(
  devtools(
    (set, get) => ({
      items: [],
      loading: false,
      batchQueue: [],
      lastLoadTime: 0,
      loadingLock: false,

      // Anti-duplicate loading mechanism
      shouldLoad: () => {
        const { loading, loadingLock, lastLoadTime } = get()
        const now = Date.now()
        return !loading && !loadingLock && (now - lastLoadTime > 500)
      },

      // Batch processing for performance
      loadData: async (pageNum = 1, isLoadMore = false) => {
        if (!get().shouldLoad()) return false

        set({ loading: true, loadingLock: true })
        get().updateLastLoadTime()

        try {
          const newItems = await getGuidePhotos(12, pageNum)

          const itemsWithHeight = newItems.map(item => ({
            ...item,
            heightType: Math.random() > 0.7 ? 'tall' :
                       Math.random() > 0.4 ? 'medium' : 'short'
          }))

          if (isLoadMore) {
            set(state => ({ items: [...state.items, ...itemsWithHeight] }))
          } else {
            set({ items: itemsWithHeight, initialLoading: false })
          }

          set({ page: pageNum + 1 })
          return true
        } catch (error) {
          set({ error: error.message, hasMore: false })
          return false
        } finally {
          set({ loading: false, loadingLock: false })
        }
      }
    }),
    { name: 'waterfall-store' }
  )
)
```


**Why Zustand Over Redux Toolkit**:


1. **Bundle Size**: 40% smaller than RTK
2. **Learning Curve**: No boilerplate, direct mutations
3. **TypeScript Integration**: Superior type inference
4. **DevTools**: Built-in Redux DevTools support
5. **Performance**: No unnecessary re-renders with selector-based subscriptions


**Interviewer**: That's a sophisticated setup. I'm particularly interested in your waterfall layout implementation. How did you handle performance with hundreds of images while maintaining smooth scrolling?


**Candidate**: The waterfall layout was indeed our most challenging performance requirement. We needed to display hundreds of high-resolution travel images while maintaining **60fps scrolling** on mobile devices. Here's our comprehensive solution:


**1. Virtual Scrolling with Intersection Observer**:


```jsx
// WaterfallLayout.jsx - Performance-Optimized Component
import { useVirtualizer } from '@tanstack/react-virtual'
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver'

const WaterfallLayout = () => {
  const { items, loadMore, hasMore, loading } = useWaterfallStore()
  const containerRef = useRef(null)
  const [columns, setColumns] = useState(2)

  // Dynamic column calculation based on viewport
  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth
      setColumns(width > 768 ? 3 : width > 480 ? 2 : 1)
    }

    updateColumns()
    window.addEventListener('resize', updateColumns)
    return () => window.removeEventListener('resize', updateColumns)
  }, [])

  // Virtualization setup
  const virtualizer = useVirtualizer({
    count: Math.ceil(items.length / columns),
    getScrollElement: () => containerRef.current,
    estimateSize: useCallback((index) => {
      const rowItems = items.slice(index * columns, (index + 1) * columns)
      return Math.max(...rowItems.map(item =>
        item.heightType === 'tall' ? 320 :
        item.heightType === 'medium' ? 240 : 180
      ))
    }, [items, columns]),
    overscan: 5
  })

  // Infinite loading trigger
  const loadMoreRef = useIntersectionObserver(
    useCallback(() => {
      if (hasMore && !loading) {
        loadMore()
      }
    }, [hasMore, loading, loadMore]),
    { threshold: 0.1 }
  )

  return (
    <div ref={containerRef} className="waterfall-container">
      <div
        style={{
          height: virtualizer.getTotalSize(),
          position: 'relative'
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.index}
            className="waterfall-row"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualRow.start}px)`
            }}
          >
            <WaterfallRow
              items={items.slice(
                virtualRow.index * columns,
                (virtualRow.index + 1) * columns
              )}
              columns={columns}
            />
          </div>
        ))}
      </div>

      {hasMore && <div ref={loadMoreRef} className="load-trigger" />}
    </div>
  )
}
```


**2. Lazy Image Component with Progressive Loading**:


```jsx
// LazyImage.jsx - Advanced Image Optimization
const LazyImage = ({ src, alt, className, heightType = 'medium' }) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const [imageSrc, setImageSrc] = useState('')
  const imgRef = useRef(null)

  // Performance settings from app store
  const { imageQuality, enableLazyLoading } = useAppStore(
    state => state.getPerformanceSettings()
  )

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!enableLazyLoading) {
      setIsInView(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [enableLazyLoading])

  // Dynamic image URL based on quality settings
  useEffect(() => {
    if (isInView && src) {
      const qualityMap = {
        low: '?auto=compress&cs=tinysrgb&w=300',
        medium: '?auto=compress&cs=tinysrgb&w=600',
        high: '?auto=compress&cs=tinysrgb&w=1200'
      }

      setImageSrc(`${src}${qualityMap[imageQuality]}`)
    }
  }, [isInView, src, imageQuality])

  const heightMap = {
    short: '180px',
    medium: '240px',
    tall: '320px'
  }

  return (
    <div
      ref={imgRef}
      className={`lazy-image-container ${className}`}
      style={{ height: heightMap[heightType] }}
    >
      {isInView && (
        <>
          {/* Blurred placeholder */}
          <img
            src={`${src}?auto=compress&cs=tinysrgb&w=50&blur=10`}
            alt=""
            className={`placeholder ${isLoaded ? 'hidden' : 'visible'}`}
          />

          {/* High-quality image */}
          <img
            src={imageSrc}
            alt={alt}
            onLoad={() => setIsLoaded(true)}
            className={`main-image ${isLoaded ? 'visible' : 'hidden'}`}
            loading="lazy"
          />
        </>
      )}
    </div>
  )
}
```


**3. Performance Monitoring and Optimization**:


```javascript
// performanceMonitor.js - Real-time Performance Tracking
export class PerformanceMonitor {
  constructor() {
    this.metrics = {
      renderTime: [],
      scrollFPS: [],
      memoryUsage: []
    }
  }

  trackRender(componentName, renderTime) {
    this.metrics.renderTime.push({
      component: componentName,
      time: renderTime,
      timestamp: Date.now()
    })

    // Alert if render time exceeds 16ms (60fps threshold)
    if (renderTime > 16) {
      console.warn(`Performance Warning: ${componentName} took ${renderTime}ms to render`)
    }
  }

  trackScrollFPS() {
    let lastFrameTime = performance.now()
    let frameCount = 0

    const measureFPS = () => {
      const currentTime = performance.now()
      frameCount++

      if (currentTime - lastFrameTime >= 1000) {
        const fps = frameCount
        this.metrics.scrollFPS.push({ fps, timestamp: Date.now() })

        if (fps < 50) {
          console.warn(`Performance Warning: Scroll FPS dropped to ${fps}`)
        }

        frameCount = 0
        lastFrameTime = currentTime
      }

      requestAnimationFrame(measureFPS)
    }

    requestAnimationFrame(measureFPS)
  }
}

// Usage in WaterfallLayout
const performanceMonitor = new PerformanceMonitor()

const WaterfallRow = memo(({ items, columns }) => {
  const renderStart = performance.now()

  useEffect(() => {
    const renderEnd = performance.now()
    performanceMonitor.trackRender('WaterfallRow', renderEnd - renderStart)
  })

  return (
    <div className={`waterfall-row columns-${columns}`}>
      {items.map(item => (
        <LazyImage
          key={item.id}
          src={item.src}
          alt={item.alt}
          heightType={item.heightType}
        />
      ))}
    </div>
  )
})
```


**Performance Results Achieved**:


- **Initial Load**: 1.2s to first meaningful paint
- **Scroll Performance**: Consistent 58-60 FPS on mobile
- **Memory Usage**: Stable at ~45MB with 500+ images
- **Bundle Size**: Image optimization reduced payload by 60%


**Interviewer**: Impressive optimization work. Let's talk about mobile responsiveness. I see you're using a combination of lib-flexible and PostCSS. How did you handle the complexities of modern responsive design, especially with the 1px border problem?


**Candidate**: Mobile responsiveness was critical since Zhilv is mobile-first. Our approach combines **traditional rem-based scaling** with **modern CSS techniques** and **device-specific optimizations**. Here's our comprehensive solution:


**1. Foundation: lib-flexible + PostCSS Configuration**:


```javascript
// postcss.config.cjs - Precision Mobile Adaptation
module.exports = {
  plugins: {
    autoprefixer: {},
    'postcss-pxtorem': {
      rootValue: 37.5, // 375px design baseline
      unitPrecision: 5,
      propList: ['*'],
      selectorBlackList: ['.no-rem', '.hairline'],
      replace: true,
      mediaQuery: false,
      minPixelValue: 2
    }
  }
}
```


```html
<!-- index.html - Mobile-Optimized Viewport -->
<meta name="viewport"
      content="width=device-width,
               minimum-scale=1.0,
               maximum-scale=1.0,
               user-scalable=no" />
```


**2. 1px Border Solution - Multi-Strategy Approach**:


```scss
// styles/mixins.scss - Hairline Border Implementation
@mixin hairline-border($color: #e5e5e5, $direction: 'all') {
  position: relative;

  &::before {
    content: '';
    position: absolute;
    pointer-events: none;
    box-sizing: border-box;

    @if $direction == 'all' {
      top: 0;
      left: 0;
      width: 200%;
      height: 200%;
      border: 1px solid $color;
      transform: scale(0.5);
      transform-origin: 0 0;
    }

    @if $direction == 'top' {
      top: 0;
      left: 0;
      width: 100%;
      height: 1px;
      background: $color;
      transform: scaleY(0.5);
      transform-origin: 0 0;
    }

    @if $direction == 'bottom' {
      bottom: 0;
      left: 0;
      width: 100%;
      height: 1px;
      background: $color;
      transform: scaleY(0.5);
      transform-origin: 0 100%;
    }
  }

  // High DPI displays
  @media (-webkit-min-device-pixel-ratio: 2) {
    &::before {
      transform: scale(0.5);
    }
  }

  @media (-webkit-min-device-pixel-ratio: 3) {
    &::before {
      transform: scale(0.33);
    }
  }
}

// Usage examples
.card {
  @include hairline-border(#e5e5e5, 'all');
}

.list-item {
  @include hairline-border(#ddd, 'bottom');
}
```


**3. Responsive Grid System with CSS Grid**:


```scss
// layout/grid.scss - Modern CSS Grid Implementation
.waterfall-container {
  display: grid;
  grid-gap: 0.267rem; // 10px in rem
  padding: 0.533rem; // 20px in rem

  // Dynamic columns based on viewport
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));

  @media (max-width: 480px) {
    grid-template-columns: repeat(2, 1fr);
    grid-gap: 0.2rem; // 7.5px
  }

  @media (max-width: 320px) {
    grid-template-columns: 1fr;
    grid-gap: 0.133rem; // 5px
  }

  @media (min-width: 768px) {
    grid-template-columns: repeat(3, 1fr);
    max-width: 1200px;
    margin: 0 auto;
  }
}

.waterfall-item {
  // Aspect ratio preservation
  aspect-ratio: var(--item-ratio, 0.75);
  overflow: hidden;
  border-radius: 0.213rem; // 8px

  // Dynamic height based on content
  &.tall { --item-ratio: 0.6; }
  &.medium { --item-ratio: 0.75; }
  &.short { --item-ratio: 1.2; }
}
```


**4. Advanced Responsive Utilities**:


```javascript
// hooks/useResponsive.js - Responsive State Management
export const useResponsive = () => {
  const [screenInfo, setScreenInfo] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
    isMobile: window.innerWidth < 768,
    isTablet: window.innerWidth >= 768 && window.innerWidth < 1024,
    isDesktop: window.innerWidth >= 1024,
    orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
    pixelRatio: window.devicePixelRatio || 1
  })

  useEffect(() => {
    const updateScreenInfo = () => {
      const width = window.innerWidth
      const height = window.innerHeight

      setScreenInfo({
        width,
        height,
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
        orientation: width > height ? 'landscape' : 'portrait',
        pixelRatio: window.devicePixelRatio || 1
      })
    }

    // Debounced resize handler
    let timeoutId
    const debouncedUpdate = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(updateScreenInfo, 150)
    }

    window.addEventListener('resize', debouncedUpdate)
    window.addEventListener('orientationchange', updateScreenInfo)

    return () => {
      window.removeEventListener('resize', debouncedUpdate)
      window.removeEventListener('orientationchange', updateScreenInfo)
      clearTimeout(timeoutId)
    }
  }, [])

  return screenInfo
}

// Component usage
const ResponsiveComponent = () => {
  const { isMobile, isTablet, orientation, pixelRatio } = useResponsive()

  const imageQuality = useMemo(() => {
    if (pixelRatio >= 3) return 'high'
    if (pixelRatio >= 2) return 'medium'
    return 'low'
  }, [pixelRatio])

  return (
    <div className={`
      responsive-container
      ${isMobile ? 'mobile' : ''}
      ${isTablet ? 'tablet' : ''}
      ${orientation}
    `}>
      <LazyImage quality={imageQuality} />
    </div>
  )
}
```


**5. Safe Area Handling for Modern Devices**:


```scss
// layout/safe-area.scss - iPhone X+ Support
.app-container {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}

.bottom-navigation {
  // Ensure navigation is above home indicator
  padding-bottom: calc(0.533rem + env(safe-area-inset-bottom));

  @supports (padding: max(0px)) {
    padding-bottom: max(0.533rem, env(safe-area-inset-bottom));
  }
}

// Dynamic island support
@media (max-width: 430px) and (max-height: 932px) {
  .status-bar {
    height: calc(47px + env(safe-area-inset-top));
  }
}
```


**Testing Strategy for Responsive Design**:


```javascript
// utils/deviceTesting.js - Comprehensive Device Testing
export const deviceTestSuite = {
  // Test different screen densities
  testPixelRatio() {
    const ratios = [1, 1.5, 2, 2.5, 3]
    ratios.forEach(ratio => {
      console.log(`Testing ${ratio}x pixel density`)
      // Simulate different pixel ratios
    })
  },

  // Test viewport edge cases
  testViewportSizes() {
    const sizes = [
      { width: 320, height: 568, device: 'iPhone SE' },
      { width: 375, height: 667, device: 'iPhone 8' },
      { width: 414, height: 896, device: 'iPhone 11' },
      { width: 768, height: 1024, device: 'iPad' }
    ]

    sizes.forEach(size => {
      console.log(`Testing ${size.device}: ${size.width}x${size.height}`)
    })
  },

  // Test orientation changes
  testOrientationChange() {
    const orientationHandler = () => {
      setTimeout(() => {
        console.log('Orientation changed:',
          window.innerWidth > window.innerHeight ? 'landscape' : 'portrait')
      }, 100)
    }

    window.addEventListener('orientationchange', orientationHandler)
  }
}
```


**Results and Metrics**:


- **Cross-device Compatibility**: 98% consistency across 15+ device types
- **1px Border Accuracy**: Pixel-perfect on all tested devices (1x, 2x, 3x DPI)
- **Performance**: No layout shift during orientation changes
- **Accessibility**: Full compliance with WCAG 2.1 AA standards


**Interviewer**: Excellent mobile implementation. Now let's discuss your AI integration. You mentioned Coze API and Doubao for image generation. How did you architect the AI features while maintaining performance and user experience?


**Candidate**: The AI integration was a fascinating challenge that required balancing **real-time responsiveness**, **error handling**, and **cost optimization**. We integrated two AI services: **Coze for conversational AI** and **Doubao for image generation**. Here's our comprehensive approach:


**1. AI Chat Architecture with Streaming Responses**:


```jsx
// pages/AI_chat/coze.jsx - Streaming AI Chat Implementation
const CozeChat = () => {
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingMessage, setStreamingMessage] = useState('')

  const { user } = useAuthStore()
  const messagesEndRef = useRef(null)

  // Streaming message handler
  const handleStream = async (userMessage) => {
    setIsStreaming(true)
    setStreamingMessage('')

    // Add user message immediately
    const userMsg = {
      id: Date.now(),
      type: 'user',
      content: userMessage,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMsg])

    try {
      const response = await fetch('/api/coze/workflow/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workflow_id: "7428126861503815710",
          parameters: {
            BOT_USER_INPUT: userMessage,
            user_context: {
              name: user?.nickname || 'Anonymous',
              preferences: user?.preferences || {}
            }
          }
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // Handle streaming response
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let accumulatedResponse = ''

      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))

              if (data.event === 'message') {
                accumulatedResponse += data.data.content
                setStreamingMessage(accumulatedResponse)
              }

              if (data.event === 'done') {
                // Finalize the AI message
                const aiMsg = {
                  id: Date.now() + 1,
                  type: 'assistant',
                  content: accumulatedResponse,
                  timestamp: new Date(),
                  tokens: data.usage?.total_tokens || 0
                }

                setMessages(prev => [...prev, aiMsg])
                setStreamingMessage('')
                setIsStreaming(false)
                return
              }
            } catch (parseError) {
              console.warn('Parse error:', parseError)
            }
          }
        }
      }
    } catch (error) {
      console.error('Streaming error:', error)

      // Fallback to error message
      const errorMsg = {
        id: Date.now() + 1,
        type: 'assistant',
        content: '抱歉，我现在无法回复。请稍后再试。',
        timestamp: new Date(),
        isError: true
      }

      setMessages(prev => [...prev, errorMsg])
      setIsStreaming(false)
    }
  }

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingMessage])

  return (
    <div className="ai-chat-container">
      <div className="messages-container">
        {messages.map(message => (
          <MessageBubble
            key={message.id}
            message={message}
            isUser={message.type === 'user'}
          />
        ))}

        {isStreaming && (
          <MessageBubble
            message={{ content: streamingMessage }}
            isUser={false}
            isStreaming={true}
          />
        )}

        <div ref={messagesEndRef} />
      </div>

      <ChatInput
        value={inputValue}
        onChange={setInputValue}
        onSend={handleStream}
        disabled={isStreaming}
      />
    </div>
  )
}
```


**2. AI Image Generation with Fallback Strategy**:


```javascript
// api/generateTravelAvatar.js - Multi-Provider Image Generation
export const generateTravelAvatar = async (userPrompt) => {
  const enhancedPrompt = `
    Create a friendly travel avatar: ${userPrompt}
    Style: modern, clean, travel-themed illustration
    Format: square portrait, suitable for profile picture
    Mood: adventurous, welcoming, professional
  `

  try {
    // Primary: Doubao API
    const doubaoResponse = await fetch('/api/doubao/image/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "ep-20250804182253-ckvjk",
        prompt: enhancedPrompt,
        n: 1,
        size: "512x512",
        quality: "standard",
        style: "vivid"
      })
    })

    if (doubaoResponse.ok) {
      const data = await doubaoResponse.json()
      if (data.data && data.data[0]?.url) {
        return {
          success: true,
          url: data.data[0].url,
          prompt: enhancedPrompt,
          provider: 'doubao'
        }
      }
    }

    // Fallback: Pexels random avatar
    console.warn('Doubao failed, using Pexels fallback')
    const fallbackUrl = await getRandomAvatar()

    return {
      success: true,
      url: fallbackUrl,
      fallback: true,
      provider: 'pexels',
      error: 'Doubao API unavailable'
    }

  } catch (error) {
    console.error('Avatar generation failed:', error)

    // Final fallback: default avatar
    return {
      success: false,
      error: error.message,
      fallbackUrl: '/assets/default-avatar.png'
    }
  }
}
```


**3. AI Request Queue and Rate Limiting**:


```javascript
// utils/aiRequestManager.js - Intelligent Request Management
class AIRequestManager {
  constructor() {
    this.requestQueue = []
    this.activeRequests = new Map()
    this.rateLimits = {
      coze: { requests: 60, window: 60000, current: 0, resetTime: 0 },
      doubao: { requests: 30, window: 60000, current: 0, resetTime: 0 }
    }
  }

  async makeRequest(provider, requestFn, priority = 'normal') {
    // Check rate limits
    if (!this.canMakeRequest(provider)) {
      const waitTime = this.rateLimits[provider].resetTime - Date.now()
      throw new Error(`Rate limit exceeded. Wait ${Math.ceil(waitTime / 1000)}s`)
    }

    // Queue management for high load
    if (this.activeRequests.size >= 5) {
      return new Promise((resolve, reject) => {
        this.requestQueue.push({
          provider,
          requestFn,
          priority,
          resolve,
          reject,
          timestamp: Date.now()
        })
      })
    }

    return this.executeRequest(provider, requestFn)
  }

  async executeRequest(provider, requestFn) {
    const requestId = `${provider}-${Date.now()}`

    try {
      this.activeRequests.set(requestId, { provider, startTime: Date.now() })
      this.updateRateLimit(provider)

      const result = await requestFn()

      return result
    } catch (error) {
      throw error
    } finally {
      this.activeRequests.delete(requestId)
      this.processQueue()
    }
  }

  canMakeRequest(provider) {
    const limit = this.rateLimits[provider]
    const now = Date.now()

    if (now > limit.resetTime) {
      limit.current = 0
      limit.resetTime = now + limit.window
    }

    return limit.current < limit.requests
  }

  updateRateLimit(provider) {
    this.rateLimits[provider].current++
  }

  processQueue() {
    if (this.requestQueue.length === 0 || this.activeRequests.size >= 5) {
      return
    }

    // Sort by priority and timestamp
    this.requestQueue.sort((a, b) => {
      const priorityOrder = { high: 3, normal: 2, low: 1 }
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
      return priorityDiff !== 0 ? priorityDiff : a.timestamp - b.timestamp
    })

    const next = this.requestQueue.shift()
    if (next && this.canMakeRequest(next.provider)) {
      this.executeRequest(next.provider, next.requestFn)
        .then(next.resolve)
        .catch(next.reject)
    }
  }
}

export const aiRequestManager = new AIRequestManager()
```


**4. Real-time AI Usage Analytics**:


```javascript
// utils/aiAnalytics.js - Usage Tracking and Optimization
export class AIAnalytics {
  constructor() {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      averageResponseTime: 0,
      errorsByType: {},
      tokenUsage: { total: 0, byModel: {} },
      costEstimate: 0
    }
  }

  trackRequest(provider, startTime, endTime, success, error = null, tokens = 0) {
    const responseTime = endTime - startTime

    this.metrics.totalRequests++
    if (success) {
      this.metrics.successfulRequests++
    }

    // Update average response time (moving average)
    this.metrics.averageResponseTime =
      (this.metrics.averageResponseTime * (this.metrics.totalRequests - 1) + responseTime)
      / this.metrics.totalRequests

    // Track errors
    if (error) {
      const errorType = error.type || 'unknown'
      this.metrics.errorsByType[errorType] =
        (this.metrics.errorsByType[errorType] || 0) + 1
    }

    // Track token usage
    if (tokens > 0) {
      this.metrics.tokenUsage.total += tokens
      this.metrics.tokenUsage.byModel[provider] =
        (this.metrics.tokenUsage.byModel[provider] || 0) + tokens
    }

    // Estimate costs (approximate)
    const costPer1000Tokens = {
      coze: 0.002, // Example rates
      doubao: 0.001
    }

    if (costPer1000Tokens[provider]) {
      this.metrics.costEstimate += (tokens / 1000) * costPer1000Tokens[provider]
    }
  }

  getAnalytics() {
    return {
      ...this.metrics,
      successRate: this.metrics.successfulRequests / this.metrics.totalRequests,
      averageResponseTimeMs: Math.round(this.metrics.averageResponseTime),
      estimatedCostUSD: Math.round(this.metrics.costEstimate * 100) / 100
    }
  }

  // Performance optimization suggestions
  getOptimizationSuggestions() {
    const analytics = this.getAnalytics()
    const suggestions = []

    if (analytics.successRate < 0.9) {
      suggestions.push('Consider implementing more robust error handling')
    }

    if (analytics.averageResponseTimeMs > 3000) {
      suggestions.push('Response times are high, consider request caching')
    }

    if (analytics.estimatedCostUSD > 10) {
      suggestions.push('Token usage is high, consider response optimization')
    }

    return suggestions
  }
}

export const aiAnalytics = new AIAnalytics()
```


**5. Error Boundary for AI Components**:


```jsx
// components/AIErrorBoundary.jsx - Specialized Error Handling
class AIErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo
    })

    // Log AI-specific errors
    aiAnalytics.trackRequest(
      'unknown',
      Date.now(),
      Date.now(),
      false,
      { type: 'component_error', message: error.message }
    )
  }

  handleRetry = () => {
    if (this.state.retryCount < 3) {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: this.state.retryCount + 1
      })
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="ai-error-container">
          <h3>AI服务暂时不可用</h3>
          <p>我们正在努力恢复服务，请稍后再试。</p>

          {this.state.retryCount < 3 && (
            <button onClick={this.handleRetry} className="retry-button">
              重试 ({3 - this.state.retryCount} 次机会剩余)
            </button>
          )}

          <details className="error-details">
            <summary>技术详情</summary>
            <pre>{this.state.error && this.state.error.toString()}</pre>
          </details>
        </div>
      )
    }

    return this.props.children
  }
}
```


**AI Integration Results**:


- **Response Time**: Average 1.2s for text, 3.8s for images
- **Success Rate**: 94.2% uptime with fallback strategies
- **Cost Optimization**: 40% reduction through request batching
- **User Experience**: Seamless streaming with visual feedback


---


### PART 3: LIVE CODING CHALLENGE


**Interviewer**: Excellent AI integration approach. Now for our coding challenge. I'd like you to implement a real-time collaborative feature for the travel app. Imagine users can create shared travel plans that update in real-time when any collaborator makes changes. You have 45 minutes to design and implement this feature using React 19, considering scalability, performance, and user experience.


**Candidate**: Perfect! This is an exciting challenge that combines real-time communication, state management, and user experience design. I'll build a collaborative travel planning feature using **WebSockets**, **optimistic updates**, and **conflict resolution**. Let me walk through my approach:


**Architecture Overview**:


1. **WebSocket connection management** with reconnection logic
2. **Collaborative state synchronization** using operational transforms
3. **Optimistic UI updates** with rollback capabilities
4. **Real-time presence indicators** showing active collaborators
5. **Conflict resolution** for simultaneous edits


Let me implement this step by step:


```jsx
// hooks/useCollaborativePlan.js - Core Collaboration Hook
import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuthStore } from '@/stores'

export const useCollaborativePlan = (planId) => {
  const [plan, setPlan] = useState(null)
  const [collaborators, setCollaborators] = useState([])
  const [isConnected, setIsConnected] = useState(false)
  const [pendingOperations, setPendingOperations] = useState([])

  const ws = useRef(null)
  const operationId = useRef(0)
  const { user } = useAuthStore()

  // WebSocket connection management
  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) return

    ws.current = new WebSocket(`ws://localhost:8080/collaborate/${planId}`)

    ws.current.onopen = () => {
      setIsConnected(true)

      // Send authentication and join plan
      ws.current.send(JSON.stringify({
        type: 'JOIN_PLAN',
        planId,
        user: {
          id: user.id,
          name: user.nickname,
          avatar: user.avatar
        }
      }))
    }

    ws.current.onmessage = (event) => {
      const message = JSON.parse(event.data)
      handleWebSocketMessage(message)
    }

    ws.current.onclose = () => {
      setIsConnected(false)
      // Exponential backoff reconnection
      setTimeout(connect, Math.min(1000 * Math.pow(2, reconnectAttempts), 30000))
    }

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error)
    }
  }, [planId, user])

  // Handle incoming WebSocket messages
  const handleWebSocketMessage = useCallback((message) => {
    switch (message.type) {
      case 'PLAN_STATE':
        setPlan(message.plan)
        setCollaborators(message.collaborators)
        break

      case 'OPERATION':
        applyOperation(message.operation)
        break

      case 'USER_JOINED':
        setCollaborators(prev => [...prev, message.user])
        break

      case 'USER_LEFT':
        setCollaborators(prev => prev.filter(c => c.id !== message.userId))
        break

      case 'OPERATION_ACK':
        // Remove acknowledged operation from pending
        setPendingOperations(prev =>
          prev.filter(op => op.id !== message.operationId)
        )
        break

      case 'OPERATION_CONFLICT':
        handleConflict(message.operation, message.serverState)
        break
    }
  }, [])

  // Apply operation to local state
  const applyOperation = useCallback((operation) => {
    setPlan(currentPlan => {
      if (!currentPlan) return currentPlan

      const newPlan = { ...currentPlan }

      switch (operation.type) {
        case 'ADD_DESTINATION':
          newPlan.destinations = [
            ...newPlan.destinations,
            operation.destination
          ]
          break

        case 'UPDATE_DESTINATION':
          newPlan.destinations = newPlan.destinations.map(dest =>
            dest.id === operation.destinationId
              ? { ...dest, ...operation.updates }
              : dest
          )
          break

        case 'REMOVE_DESTINATION':
          newPlan.destinations = newPlan.destinations.filter(
            dest => dest.id !== operation.destinationId
          )
          break

        case 'UPDATE_DATES':
          newPlan.startDate = operation.startDate
          newPlan.endDate = operation.endDate
          break

        case 'ADD_ACTIVITY':
          const destIndex = newPlan.destinations.findIndex(
            d => d.id === operation.destinationId
          )
          if (destIndex !== -1) {
            newPlan.destinations[destIndex].activities = [
              ...newPlan.destinations[destIndex].activities,
              operation.activity
            ]
          }
          break
      }

      return newPlan
    })
  }, [])

  // Send operation to server
  const sendOperation = useCallback((operation) => {
    const operationWithId = {
      ...operation,
      id: ++operationId.current,
      userId: user.id,
      timestamp: Date.now()
    }

    // Optimistic update
    applyOperation(operationWithId)

    // Add to pending operations
    setPendingOperations(prev => [...prev, operationWithId])

    // Send to server
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: 'OPERATION',
        operation: operationWithId
      }))
    }
  }, [user.id, applyOperation])

  // Handle operation conflicts
  const handleConflict = useCallback((conflictedOperation, serverState) => {
    console.warn('Operation conflict detected:', conflictedOperation)

    // Rollback to server state
    setPlan(serverState.plan)

    // Reapply pending operations that weren't conflicted
    setPendingOperations(prev => {
      const remainingOps = prev.filter(op => op.id !== conflictedOperation.id)

      // Reapply remaining operations
      remainingOps.forEach(op => {
        setTimeout(() => applyOperation(op), 0)
      })

      return remainingOps
    })
  }, [applyOperation])

  // Collaborative actions
  const collaborativeActions = {
    addDestination: (destination) => {
      sendOperation({
        type: 'ADD_DESTINATION',
        destination: {
          ...destination,
          id: Date.now() + Math.random(),
          addedBy: user.id,
          addedAt: new Date().toISOString()
        }
      })
    },

    updateDestination: (destinationId, updates) => {
      sendOperation({
        type: 'UPDATE_DESTINATION',
        destinationId,
        updates: {
          ...updates,
          lastModifiedBy: user.id,
          lastModifiedAt: new Date().toISOString()
        }
      })
    },

    removeDestination: (destinationId) => {
      sendOperation({
        type: 'REMOVE_DESTINATION',
        destinationId
      })
    },

    updateDates: (startDate, endDate) => {
      sendOperation({
        type: 'UPDATE_DATES',
        startDate,
        endDate
      })
    },

    addActivity: (destinationId, activity) => {
      sendOperation({
        type: 'ADD_ACTIVITY',
        destinationId,
        activity: {
          ...activity,
          id: Date.now() + Math.random(),
          addedBy: user.id,
          addedAt: new Date().toISOString()
        }
      })
    }
  }

  // Initialize connection
  useEffect(() => {
    connect()
    return () => {
      if (ws.current) {
        ws.current.close()
      }
    }
  }, [connect])

  return {
    plan,
    collaborators,
    isConnected,
    pendingOperations: pendingOperations.length,
    actions: collaborativeActions
  }
}
```


```jsx
// components/CollaborativePlanEditor.jsx - Main Editor Component
import React, { useState, useMemo } from 'react'
import { useCollaborativePlan } from '@/hooks/useCollaborativePlan'
import { Button, Input, DatePicker, Modal, Toast } from 'react-vant'

const CollaborativePlanEditor = ({ planId }) => {
  const {
    plan,
    collaborators,
    isConnected,
    pendingOperations,
    actions
  } = useCollaborativePlan(planId)

  const [showAddDestination, setShowAddDestination] = useState(false)
  const [newDestination, setNewDestination] = useState({ name: '', description: '' })

  // Real-time collaboration indicators
  const connectionStatus = useMemo(() => {
    if (!isConnected) return { status: 'disconnected', color: '#ff4444', text: '离线' }
    if (pendingOperations > 0) return { status: 'syncing', color: '#ff9500', text: '同步中' }
    return { status: 'connected', color: '#00c851', text: '已连接' }
  }, [isConnected, pendingOperations])

  if (!plan) {
    return (
      <div className="collaborative-plan-loading">
        <div className="loading-spinner" />
        <p>正在加载协作计划...</p>
      </div>
    )
  }

  return (
    <div className="collaborative-plan-editor">
      {/* Collaboration Status Bar */}
      <div className="collaboration-status">
        <div className="connection-indicator">
          <div
            className="status-dot"
            style={{ backgroundColor: connectionStatus.color }}
          />
          <span>{connectionStatus.text}</span>
          {pendingOperations > 0 && (
            <span className="pending-count">({pendingOperations} 待同步)</span>
          )}
        </div>

        <div className="collaborators">
          {collaborators.map(collaborator => (
            <div key={collaborator.id} className="collaborator-avatar">
              <img src={collaborator.avatar} alt={collaborator.name} />
              <span className="collaborator-name">{collaborator.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Plan Header */}
      <div className="plan-header">
        <h1 className="plan-title">{plan.title}</h1>
        <div className="plan-dates">
          <DatePicker
            value={plan.startDate}
            onChange={(date) => actions.updateDates(date, plan.endDate)}
            placeholder="开始日期"
          />
          <DatePicker
            value={plan.endDate}
            onChange={(date) => actions.updateDates(plan.startDate, date)}
            placeholder="结束日期"
          />
        </div>
      </div>

      {/* Destinations List */}
      <div className="destinations-section">
        <div className="section-header">
          <h2>目的地</h2>
          <Button
            type="primary"
            onClick={() => setShowAddDestination(true)}
          >
            添加目的地
          </Button>
        </div>

        <div className="destinations-list">
          {plan.destinations.map(destination => (
            <DestinationCard
              key={destination.id}
              destination={destination}
              onUpdate={(updates) => actions.updateDestination(destination.id, updates)}
              onRemove={() => actions.removeDestination(destination.id)}
              onAddActivity={(activity) => actions.addActivity(destination.id, activity)}
              collaborators={collaborators}
            />
          ))}
        </div>
      </div>

      {/* Add Destination Modal */}
      <Modal
        visible={showAddDestination}
        onClose={() => setShowAddDestination(false)}
        title="添加新目的地"
      >
        <div className="add-destination-form">
          <Input
            value={newDestination.name}
            onChange={(value) => setNewDestination(prev => ({ ...prev, name: value }))}
            placeholder="目的地名称"
          />
          <Input
            value={newDestination.description}
            onChange={(value) => setNewDestination(prev => ({ ...prev, description: value }))}
            placeholder="描述"
            type="textarea"
          />
          <div className="form-actions">
            <Button onClick={() => setShowAddDestination(false)}>
              取消
            </Button>
            <Button
              type="primary"
              onClick={() => {
                actions.addDestination(newDestination)
                setNewDestination({ name: '', description: '' })
                setShowAddDestination(false)
                Toast.success('目的地已添加')
              }}
            >
              添加
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
```


```jsx
// components/DestinationCard.jsx - Individual Destination Component
const DestinationCard = ({
  destination,
  onUpdate,
  onRemove,
  onAddActivity,
  collaborators
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    name: destination.name,
    description: destination.description
  })

  // Real-time editing indicators
  const lastModifiedBy = useMemo(() => {
    const collaborator = collaborators.find(c => c.id === destination.lastModifiedBy)
    return collaborator?.name || '未知用户'
  }, [collaborators, destination.lastModifiedBy])

  const timeAgo = useMemo(() => {
    if (!destination.lastModifiedAt) return ''
    const diff = Date.now() - new Date(destination.lastModifiedAt).getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    const hours = Math.floor(minutes / 60)
    return `${hours}小时前`
  }, [destination.lastModifiedAt])

  const handleSave = () => {
    onUpdate(editForm)
    setIsEditing(false)
    Toast.success('目的地已更新')
  }

  return (
    <div className="destination-card">
      <div className="destination-header">
        {isEditing ? (
          <div className="edit-form">
            <Input
              value={editForm.name}
              onChange={(value) => setEditForm(prev => ({ ...prev, name: value }))}
            />
            <Input
              value={editForm.description}
              onChange={(value) => setEditForm(prev => ({ ...prev, description: value }))}
              type="textarea"
            />
            <div className="edit-actions">
              <Button size="small" onClick={() => setIsEditing(false)}>
                取消
              </Button>
              <Button size="small" type="primary" onClick={handleSave}>
                保存
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="destination-info">
              <h3>{destination.name}</h3>
              <p>{destination.description}</p>
              {destination.lastModifiedAt && (
                <div className="modification-info">
                  <span>由 {lastModifiedBy} 修改于 {timeAgo}</span>
                </div>
              )}
            </div>
            <div className="destination-actions">
              <Button size="small" onClick={() => setIsEditing(true)}>
                编辑
              </Button>
              <Button size="small" type="danger" onClick={onRemove}>
                删除
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Activities Section */}
      <div className="activities-section">
        <h4>活动安排</h4>
        <div className="activities-list">
          {destination.activities?.map(activity => (
            <div key={activity.id} className="activity-item">
              <span>{activity.name}</span>
              <span className="activity-time">{activity.time}</span>
            </div>
          ))}
        </div>

        <ActivityForm onAdd={onAddActivity} />
      </div>
    </div>
  )
}
```


```jsx
// components/ActivityForm.jsx - Quick Activity Addition
const ActivityForm = ({ onAdd }) => {
  const [showForm, setShowForm] = useState(false)
  const [activity, setActivity] = useState({ name: '', time: '', description: '' })

  const handleAdd = () => {
    if (activity.name.trim()) {
      onAdd(activity)
      setActivity({ name: '', time: '', description: '' })
      setShowForm(false)
      Toast.success('活动已添加')
    }
  }

  if (!showForm) {
    return (
      <Button
        size="small"
        type="default"
        onClick={() => setShowForm(true)}
        className="add-activity-btn"
      >
        + 添加活动
      </Button>
    )
  }

  return (
    <div className="activity-form">
      <Input
        value={activity.name}
        onChange={(value) => setActivity(prev => ({ ...prev, name: value }))}
        placeholder="活动名称"
        size="small"
      />
      <Input
        value={activity.time}
        onChange={(value) => setActivity(prev => ({ ...prev, time: value }))}
        placeholder="时间"
        size="small"
      />
      <div className="form-actions">
        <Button size="small" onClick={() => setShowForm(false)}>
          取消
        </Button>
        <Button size="small" type="primary" onClick={handleAdd}>
          添加
        </Button>
      </div>
    </div>
  )
}
```


```scss
// styles/collaborative-plan.scss - Styled Components
.collaborative-plan-editor {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;

  .collaboration-status {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: #f8f9fa;
    border-radius: 8px;
    margin-bottom: 20px;

    .connection-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;

      .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        animation: pulse 2s infinite;
      }

      .pending-count {
        color: #666;
        font-size: 12px;
      }
    }

    .collaborators {
      display: flex;
      gap: 8px;

      .collaborator-avatar {
        position: relative;

        img {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 2px solid #00c851;
        }

        .collaborator-name {
          position: absolute;
          bottom: -20px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 10px;
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 2px 6px;
          border-radius: 4px;
          white-space: nowrap;
          opacity: 0;
          transition: opacity 0.2s;
        }

        &:hover .collaborator-name {
          opacity: 1;
        }
      }
    }
  }

  .plan-header {
    margin-bottom: 30px;

    .plan-title {
      font-size: 28px;
      font-weight: bold;
      margin-bottom: 16px;
      color: #333;
    }

    .plan-dates {
      display: flex;
      gap: 16px;
    }
  }

  .destinations-section {
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;

      h2 {
        font-size: 22px;
        color: #333;
      }
    }

    .destinations-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
  }

  .destination-card {
    border: 1px solid #e1e8ed;
    border-radius: 12px;
    padding: 20px;
    background: white;
    transition: box-shadow 0.2s;

    &:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .destination-header {
      margin-bottom: 16px;

      .destination-info {
        h3 {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 8px;
          color: #333;
        }

        p {
          color: #666;
          line-height: 1.5;
          margin-bottom: 8px;
        }

        .modification-info {
          font-size: 12px;
          color: #999;
          font-style: italic;
        }
      }

      .destination-actions {
        display: flex;
        gap: 8px;
        margin-top: 12px;
      }

      .edit-form {
        .edit-actions {
          display: flex;
          gap: 8px;
          margin-top: 12px;
        }
      }
    }

    .activities-section {
      border-top: 1px solid #f0f0f0;
      padding-top: 16px;

      h4 {
        font-size: 16px;
        margin-bottom: 12px;
        color: #333;
      }

      .activities-list {
        margin-bottom: 12px;

        .activity-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #f5f5f5;

          &:last-child {
            border-bottom: none;
          }

          .activity-time {
            font-size: 12px;
            color: #666;
          }
        }
      }

      .activity-form {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 12px;
        background: #f8f9fa;
        border-radius: 8px;

        .form-actions {
          display: flex;
          gap: 8px;
          margin-top: 8px;
        }
      }

      .add-activity-btn {
        width: fit-content;
      }
    }
  }
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

// Responsive design
@media (max-width: 768px) {
  .collaborative-plan-editor {
    padding: 12px;

    .collaboration-status {
      flex-direction: column;
      gap: 12px;
      text-align: center;
    }

    .plan-dates {
      flex-direction: column;
    }

    .destination-card {
      padding: 16px;
    }
  }
}
```


**Interviewer**: This is excellent work! I'm particularly impressed with your approach to conflict resolution and real-time presence indicators. Now let me ask some follow-up questions. How would you handle **offline scenarios** where users lose internet connectivity but continue editing?


**Candidate**: Great question! Offline scenarios are critical for mobile travel apps. Users often have intermittent connectivity while traveling. Here's my comprehensive offline-first approach:


```javascript
// hooks/useOfflineCollaboration.js - Offline-First Extension
import { useState, useEffect, useCallback } from 'react'
import { useCollaborativePlan } from './useCollaborativePlan'

export const useOfflineCollaboration = (planId) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [offlineOperations, setOfflineOperations] = useState([])
  const [syncStatus, setSyncStatus] = useState('synced') // 'synced' | 'pending' | 'syncing' | 'conflict'

  const collaborativeHook = useCollaborativePlan(planId)

  // Enhanced actions with offline support
  const offlineActions = {
    ...collaborativeHook.actions,

    // Override with offline queue
    addDestination: (destination) => {
      const operation = {
        type: 'ADD_DESTINATION',
        destination: {
          ...destination,
          id: `offline_${Date.now()}_${Math.random()}`,
          addedBy: user.id,
          addedAt: new Date().toISOString(),
          offline: true
        },
        timestamp: Date.now(),
        localId: Date.now()
      }

      if (isOnline) {
        collaborativeHook.actions.addDestination(destination)
      } else {
        // Queue for offline sync
        setOfflineOperations(prev => [...prev, operation])
        // Apply optimistically to local state
        applyOfflineOperation(operation)
        setSyncStatus('pending')
      }
    }
  }

  // Apply offline operation to local state
  const applyOfflineOperation = useCallback((operation) => {
    // Similar to applyOperation but with offline flags
    // Implementation details...
  }, [])

  // Sync offline operations when coming back online
  const syncOfflineOperations = useCallback(async () => {
    if (offlineOperations.length === 0) return

    setSyncStatus('syncing')

    try {
      // Send operations in batch with conflict detection
      const response = await fetch('/api/plans/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          operations: offlineOperations,
          clientTimestamp: Date.now()
        })
      })

      const result = await response.json()

      if (result.conflicts.length > 0) {
        setSyncStatus('conflict')
        // Handle conflicts with user intervention
        handleOfflineConflicts(result.conflicts)
      } else {
        setOfflineOperations([])
        setSyncStatus('synced')
        Toast.success(`已同步 ${offlineOperations.length} 个离线更改`)
      }
    } catch (error) {
      console.error('Offline sync failed:', error)
      setSyncStatus('pending')
    }
  }, [offlineOperations, planId])

  // Handle offline conflicts
  const handleOfflineConflicts = (conflicts) => {
    // Show conflict resolution UI
    // Allow user to choose: keep local, keep remote, or merge
  }

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      syncOfflineOperations()
    }

    const handleOffline = () => {
      setIsOnline(false)
      setSyncStatus('pending')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [syncOfflineOperations])

  return {
    ...collaborativeHook,
    actions: offlineActions,
    isOnline,
    offlineOperations: offlineOperations.length,
    syncStatus
  }
}
```


**Interviewer**: Impressive offline handling! Now, let's discuss **scalability**. How would this solution perform with 100+ collaborators or plans with 1000+ destinations?


**Candidate**: Excellent scalability question! At that scale, we need fundamental architectural changes. Here's my approach:


**1. Virtualization and Pagination Strategy**:


```javascript
// hooks/useVirtualizedCollaboration.js - Scalable Implementation
export const useVirtualizedCollaboration = (planId) => {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 50 })
  const [totalDestinations, setTotalDestinations] = useState(0)
  const [destinationChunks, setDestinationChunks] = useState(new Map())

  // Only subscribe to visible range + buffer
  const subscribeToRange = useCallback((start, end) => {
    ws.current?.send(JSON.stringify({
      type: 'SUBSCRIBE_RANGE',
      planId,
      start: Math.max(0, start - 10), // 10 item buffer
      end: Math.min(totalDestinations, end + 10)
    }))
  }, [planId, totalDestinations])

  // Chunked operation processing
  const processOperationsInChunks = useCallback((operations) => {
    const CHUNK_SIZE = 20
    let currentChunk = 0

    const processChunk = () => {
      const chunk = operations.slice(
        currentChunk * CHUNK_SIZE,
        (currentChunk + 1) * CHUNK_SIZE
      )

      if (chunk.length > 0) {
        chunk.forEach(applyOperation)
        currentChunk++

        // Process next chunk in next frame
        requestAnimationFrame(processChunk)
      }
    }

    processChunk()
  }, [])

  return { visibleRange, subscribeToRange, processOperationsInChunks }
}
```


**2. Selective Collaboration Awareness**:


```javascript
// Presence optimization for 100+ users
const useSmartPresence = (planId) => {
  const [activeCollaborators, setActiveCollaborators] = useState([])
  const [collaboratorActivity, setCollaboratorActivity] = useState(new Map())

  // Only show actively editing users + recent contributors
  const visibleCollaborators = useMemo(() => {
    const now = Date.now()
    const ACTIVE_THRESHOLD = 30000 // 30 seconds

    return activeCollaborators.filter(collab => {
      const lastActivity = collaboratorActivity.get(collab.id) || 0
      return (now - lastActivity) < ACTIVE_THRESHOLD
    }).slice(0, 10) // Limit to 10 visible avatars
  }, [activeCollaborators, collaboratorActivity])

  return { visibleCollaborators }
}
```


**3. Operation Batching and Compression**:


```javascript
// Optimized operation handling
class OperationBatcher {
  constructor() {
    this.batch = []
    this.batchTimeout = null
    this.BATCH_SIZE = 50
    this.BATCH_TIMEOUT = 100
  }

  addOperation(operation) {
    this.batch.push(operation)

    if (this.batch.length >= this.BATCH_SIZE) {
      this.flush()
    } else if (!this.batchTimeout) {
      this.batchTimeout = setTimeout(() => this.flush(), this.BATCH_TIMEOUT)
    }
  }

  flush() {
    if (this.batch.length === 0) return

    // Compress similar operations
    const compressed = this.compressOperations(this.batch)

    ws.current?.send(JSON.stringify({
      type: 'OPERATION_BATCH',
      operations: compressed
    }))

    this.batch = []
    clearTimeout(this.batchTimeout)
    this.batchTimeout = null
  }

  compressOperations(operations) {
    // Merge sequential updates to same destination
    const operationMap = new Map()

    operations.forEach(op => {
      if (op.type === 'UPDATE_DESTINATION') {
        const key = `${op.type}_${op.destinationId}`
        const existing = operationMap.get(key)

        if (existing) {
          // Merge updates
          operationMap.set(key, {
            ...existing,
            updates: { ...existing.updates, ...op.updates }
          })
        } else {
          operationMap.set(key, op)
        }
      } else {
        operationMap.set(`${op.type}_${Date.now()}_${Math.random()}`, op)
      }
    })

    return Array.from(operationMap.values())
  }
}
```


**Performance Optimizations Achieved**:


- **Memory Usage**: Reduced from ~500MB to ~45MB with virtualization
- **Network Traffic**: 80% reduction through operation batching
- **UI Responsiveness**: Maintains 60fps with 1000+ destinations
- **Collaboration Latency**: <200ms for 100+ concurrent users


**Interviewer**: Outstanding scalability considerations! Final question: How would you **test this collaborative feature**, especially the real-time aspects and edge cases?


**Candidate**: Testing real-time collaborative features requires a multi-layered approach covering **unit tests**, **integration tests**, **load testing**, and **chaos engineering**. Here's my comprehensive testing strategy:


**1. Unit Tests for Core Logic**:


```javascript
// __tests__/collaborativeOperations.test.js
import { describe, test, expect, vi } from 'vitest'
import { applyOperation, compressOperations } from '@/utils/collaborativeOperations'

describe('Collaborative Operations', () => {
  test('should apply ADD_DESTINATION operation correctly', () => {
    const initialState = { destinations: [] }
    const operation = {
      type: 'ADD_DESTINATION',
      destination: { id: 1, name: 'Tokyo', description: 'Amazing city' }
    }

    const newState = applyOperation(initialState, operation)

    expect(newState.destinations).toHaveLength(1)
    expect(newState.destinations[0]).toEqual(operation.destination)
  })

  test('should handle operation conflicts correctly', () => {
    const state = { destinations: [{ id: 1, name: 'Tokyo', version: 1 }] }

    const operation1 = {
      type: 'UPDATE_DESTINATION',
      destinationId: 1,
      updates: { name: 'New Tokyo' },
      version: 1
    }

    const operation2 = {
      type: 'UPDATE_DESTINATION',
      destinationId: 1,
      updates: { name: 'Different Tokyo' },
      version: 1 // Same version = conflict
    }

    const result1 = applyOperation(state, operation1)
    const result2 = applyOperation(result1, operation2)

    expect(result2.conflicts).toHaveLength(1)
  })

  test('should compress similar operations', () => {
    const operations = [
      { type: 'UPDATE_DESTINATION', destinationId: 1, updates: { name: 'A' } },
      { type: 'UPDATE_DESTINATION', destinationId: 1, updates: { description: 'B' } },
      { type: 'UPDATE_DESTINATION', destinationId: 1, updates: { name: 'C' } }
    ]

    const compressed = compressOperations(operations)

    expect(compressed).toHaveLength(1)
    expect(compressed[0].updates).toEqual({ name: 'C', description: 'B' })
  })
})
```


**2. Integration Tests with Mock WebSocket**:


```javascript
// __tests__/collaborativeHook.test.js
import { renderHook, act, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { useCollaborativePlan } from '@/hooks/useCollaborativePlan'

// Mock WebSocket
class MockWebSocket {
  constructor(url) {
    this.url = url
    this.readyState = WebSocket.CONNECTING
    this.messages = []

    setTimeout(() => {
      this.readyState = WebSocket.OPEN
      this.onopen?.()
    }, 10)
  }

  send(data) {
    this.messages.push(JSON.parse(data))

    // Simulate server responses
    setTimeout(() => {
      if (this.messages[this.messages.length - 1].type === 'JOIN_PLAN') {
        this.onmessage?.({
          data: JSON.stringify({
            type: 'PLAN_STATE',
            plan: { id: 'test-plan', destinations: [] },
            collaborators: []
          })
        })
      }
    }, 5)
  }

  close() {
    this.readyState = WebSocket.CLOSED
    this.onclose?.()
  }
}

global.WebSocket = MockWebSocket

describe('useCollaborativePlan Integration', () => {
  test('should connect and receive initial plan state', async () => {
    const { result } = renderHook(() => useCollaborativePlan('test-plan'))

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true)
    })

    expect(result.current.plan).toEqual({
      id: 'test-plan',
      destinations: []
    })
  })

  test('should send operations when adding destination', async () => {
    const { result } = renderHook(() => useCollaborativePlan('test-plan'))

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true)
    })

    act(() => {
      result.current.actions.addDestination({
        name: 'Paris',
        description: 'City of Light'
      })
    })

    // Check that WebSocket received the operation
    const mockWs = result.current.ws?.current
    expect(mockWs.messages).toContainEqual(
      expect.objectContaining({
        type: 'OPERATION',
        operation: expect.objectContaining({
          type: 'ADD_DESTINATION'
        })
      })
    )
  })
})
```


**3. Load Testing with Artillery**:


```yaml
# artillery-load-test.yml
config:
  target: 'ws://localhost:8080'
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Ramp up to 100 concurrent users"
    - duration: 300
      arrivalRate: 20
      name: "Sustained load of 200 concurrent users"
    - duration: 60
      arrivalRate: 5
      name: "Ramp down"

scenarios:
  - name: "Collaborative editing simulation"
    weight: 80
    engine: ws
    processor: "./test-processor.js"

before:
  flow:
    - send:
        data: '{"type":"JOIN_PLAN","planId":"load-test-plan","user":{"id":"{{ $uuid }}","name":"User {{ $uuid }}"}}'
    - think: 1

flow:
  - loop:
    - send:
        data: '{"type":"OPERATION","operation":{"type":"ADD_DESTINATION","destination":{"id":"{{ $uuid }}","name":"Destination {{ $randomInt(1,1000) }}"}}}'
    - think:
        min: 2
        max: 10
    - send:
        data: '{"type":"OPERATION","operation":{"type":"UPDATE_DESTINATION","destinationId":"{{ $uuid }}","updates":{"description":"Updated at {{ $timestamp }}"}}}'
    - think:
        min: 5
        max: 15
    count: 20
```


**4. Chaos Engineering Tests**:


```javascript
// __tests__/chaosEngineering.test.js
describe('Chaos Engineering - Network Failures', () => {
  test('should handle sudden connection drops', async () => {
    const { result } = renderHook(() => useCollaborativePlan('chaos-plan'))

    await waitFor(() => expect(result.current.isConnected).toBe(true))

    // Add some destinations
    act(() => {
      result.current.actions.addDestination({ name: 'Test 1' })
      result.current.actions.addDestination({ name: 'Test 2' })
    })

    // Simulate connection drop
    act(() => {
      result.current.ws.current.close()
    })

    expect(result.current.isConnected).toBe(false)

    // Continue adding destinations (should queue)
    act(() => {
      result.current.actions.addDestination({ name: 'Offline Test' })
    })

    expect(result.current.pendingOperations).toBeGreaterThan(0)

    // Simulate reconnection
    act(() => {
      // Trigger reconnection logic
    })

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true)
      expect(result.current.pendingOperations).toBe(0)
    })
  })

  test('should handle server overload scenarios', async () => {
    // Mock server returning 503 Service Unavailable
    global.fetch = vi.fn().mockRejectedValue(new Error('503 Service Unavailable'))

    const { result } = renderHook(() => useCollaborativePlan('overload-plan'))

    act(() => {
      result.current.actions.addDestination({ name: 'Overload Test' })
    })

    await waitFor(() => {
      expect(result.current.error).toContain('Service Unavailable')
    })

    // Should implement exponential backoff
    expect(result.current.retryAttempts).toBeGreaterThan(0)
  })
})
```


**5. End-to-End Testing with Playwright**:


```javascript
// e2e/collaborative-editing.spec.js
import { test, expect } from '@playwright/test'

test.describe('Collaborative Plan Editing', () => {
  test('multiple users can edit simultaneously', async () => {
    // Create two browser contexts (different users)
    const context1 = await browser.newContext()
    const context2 = await browser.newContext()

    const page1 = await context1.newPage()
    const page2 = await context2.newPage()

    // Both users join the same plan
    await page1.goto('/plans/e2e-test-plan')
    await page2.goto('/plans/e2e-test-plan')

    // User 1 adds a destination
    await page1.fill('[data-testid="destination-name"]', 'Tokyo')
    await page1.click('[data-testid="add-destination"]')

    // User 2 should see the destination appear
    await expect(page2.locator('[data-testid="destination-Tokyo"]')).toBeVisible()

    // User 2 adds an activity to the same destination
    await page2.click('[data-testid="destination-Tokyo"] [data-testid="add-activity"]')
    await page2.fill('[data-testid="activity-name"]', 'Visit Tokyo Tower')
    await page2.click('[data-testid="save-activity"]')

    // User 1 should see the activity
    await expect(page1.locator('text=Visit Tokyo Tower')).toBeVisible()

    // Test conflict resolution
    await page1.click('[data-testid="destination-Tokyo"] [data-testid="edit-destination"]')
    await page2.click('[data-testid="destination-Tokyo"] [data-testid="edit-destination"]')

    await page1.fill('[data-testid="destination-description"]', 'Description by User 1')
    await page2.fill('[data-testid="destination-description"]', 'Description by User 2')

    await page1.click('[data-testid="save-destination"]')
    await page2.click('[data-testid="save-destination"]')

    // Should show conflict resolution UI
    await expect(page2.locator('[data-testid="conflict-dialog"]')).toBeVisible()
  })

  test('offline editing and sync', async () => {
    const page = await browser.newPage()
    await page.goto('/plans/offline-test-plan')

    // Go offline
    await page.context().setOffline(true)

    // Add destination while offline
    await page.fill('[data-testid="destination-name"]', 'Offline Destination')
    await page.click('[data-testid="add-destination"]')

    // Should show pending sync indicator
    await expect(page.locator('[data-testid="sync-status"]')).toContainText('离线')

    // Go back online
    await page.context().setOffline(false)

    // Should sync automatically
    await expect(page.locator('[data-testid="sync-status"]')).toContainText('已连接')
  })
})
```


**6. Performance Testing with Lighthouse CI**:


```javascript
// performance/lighthouse-collaborative.js
module.exports = {
  ci: {
    collect: {
      numberOfRuns: 3,
      url: [
        'http://localhost:3000/plans/performance-test?collaborators=50',
        'http://localhost:3000/plans/performance-test?collaborators=100'
      ]
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'first-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 3000 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }]
      }
    }
  }
}
```


**Testing Results and Metrics**:


- **Unit Test Coverage**: 95% for collaborative logic
- **Load Test Results**: 500 concurrent users, <200ms latency
- **Chaos Engineering**: 99.9% operation consistency during failures
- **E2E Success Rate**: 98% across 50+ scenarios
- **Performance Scores**: 85+ Lighthouse score with 100 collaborators


**Interviewer**: Absolutely exceptional work! You've demonstrated deep understanding of React 19, modern state management, real-time collaboration, performance optimization, and comprehensive testing strategies. Your implementation shows production-ready thinking with considerations for scalability, offline scenarios, and robust error handling. This level of architectural thinking and practical implementation is exactly what we look for in senior engineers at NAB.


**Candidate**: Thank you so much, Sarah! This has been an incredibly engaging technical discussion. I'm excited about the opportunity to bring this level of architectural thinking and modern frontend expertise to NAB's engineering team. The collaborative travel planning feature we've designed demonstrates not just technical proficiency, but also the kind of user-centric, scalable solutions that I believe are essential for modern financial applications.


I'd love to contribute to NAB's frontend initiatives, particularly around **real-time user experiences**, **performance optimization**, and **mobile-first design** - areas where the travel app architecture we discussed directly translates to banking and financial services.


**Interviewer**: Perfect! Your depth of knowledge in React 19's concurrent features, sophisticated state management with Zustand, and comprehensive testing strategies really impressed me. We'll be in touch soon regarding next steps. Thank you for this excellent technical demonstration!


---


## EVALUATION SUMMARY


### Technical Excellence ⭐⭐⭐⭐⭐


- Demonstrated deep knowledge of React 19 concurrent features
- Sophisticated Zustand implementation with persistence
- Advanced performance optimization techniques
- Production-ready error handling and fallback strategies


### Problem Solving ⭐⭐⭐⭐⭐


- Systematic approach to complex real-time collaboration
- Excellent scalability considerations (virtualization, batching)
- Comprehensive offline-first architecture
- Intelligent conflict resolution strategies


### Communication ⭐⭐⭐⭐⭐


- Clear explanations of complex technical concepts
- Excellent use of code examples and architectural diagrams
- Strong articulation of trade-offs and design decisions
- Professional and confident presentation style


### Innovation ⭐⭐⭐⭐⭐


- Creative solutions for mobile responsiveness (1px borders)
- Advanced AI integration with fallback strategies
- Sophisticated testing approach including chaos engineering
- Forward-thinking scalability architecture


### Overall Assessment: STRONG HIRE - L6 Senior Frontend Engineer


**Recommendation**: Proceed to final round with team lead and product stakeholders.
