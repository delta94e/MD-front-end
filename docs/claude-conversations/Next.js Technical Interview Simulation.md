# Next.js Technical Interview Simulation

## Claude


I'll simulate a comprehensive technical interview for a Senior Frontend Engineer position at NAB, focusing on the recent Next.js 15.4 release and Turbopack. Let me create this as a natural dialogue between an experienced NAB interviewer and an exceptional candidate.


I've created a comprehensive technical interview simulation for a Senior Frontend Engineer position at NAB, focusing on Next.js 15.4 and Turbopack. This realistic interview demonstrates the depth of technical discussion and practical problem-solving you'd expect at a senior level.


The simulation covers:


🔥 **Key Highlights:**


- **Next.js 15.4 & Turbopack Production Readiness** - Deep dive into the 8,302 integration tests passing and production implications
- **Financial Services Architecture** - PPR implementation for portfolio dashboards with real-time data
- **Performance Impact Analysis** - Quantified productivity gains and CI/CD cost savings
- **Production-Grade Code** - Complete React components with error boundaries, WebSocket integration, and accessibility
- **Monitoring & Compliance** - Financial services-specific monitoring with regulatory compliance


🎯 **Technical Depth:**


- Smart prefetching with `onInvalidate` callbacks
- Partial Pre-rendering (PPR) implementation
- Real-time WebSocket price updates
- Production monitoring and alerting systems
- Data integrity validation for financial applications


The interview demonstrates **L5/L6 senior engineering expertise** with practical, production-ready solutions that address NAB's specific requirements for performance, security, and compliance in financial services.


Would you like me to elaborate on any specific aspect of the technical implementation or dive deeper into particular areas like the monitoring strategy or PPR architecture?


## Claude


# NAB Senior Frontend Engineer Interview Simulation


## Next.js 15.4 & Turbopack Deep Dive


---


## Part 1: Warm-up & Introduction


**Interviewer**: Good morning! I'm Sarah Chen, Principal Frontend Engineer here at NAB. I've been with the team for about 12 years now, and I'm excited to chat with you today about frontend engineering, particularly around some of the latest developments in the React ecosystem. Before we dive into the technical deep dive, could you give me a brief overview of your recent experience with Next.js and modern build tools?


**Candidate**: Good morning Sarah! Thanks for having me. I'm really excited about this conversation too. Over the past few years, I've been working extensively with Next.js across several large-scale applications. Most recently, I led the migration of our e-commerce platform from a legacy React SPA to Next.js 14, and now we're evaluating the move to 15.4 - particularly excited about **Turbopack reaching production stability**.


In my current role, I've been responsible for a platform serving about 2 million daily active users, where we've implemented **hybrid rendering strategies** with ISR, SSR, and client-side rendering based on specific page requirements. We've also been experimenting with **React Server Components** and the App Router since Next.js 13, which has been transformative for our performance metrics.


Regarding build tools, I've worked extensively with Webpack for years, but I've been closely following Turbopack's development since its announcement. The **8x-10x build speed improvements** we've seen in our development environment have been game-changing, especially for our team of 15+ frontend engineers working on the same codebase.


**Interviewer**: That's impressive scale! I'm particularly interested in your mention of the recent Next.js 15.4 release. I know you've been following Turbopack's development - what's your take on it finally reaching production stability? How significant is this milestone for the frontend ecosystem?


**Candidate**: This is absolutely massive for the ecosystem, and here's why I think it's such a pivotal moment:


**From an Engineering Perspective:**
The fact that Turbopack has passed **all 8,302 production integration tests** is remarkable. These aren't just unit tests - they cover edge cases, regression scenarios, and debugging scenarios that real-world applications encounter. The rigor of this testing gives me confidence that we're not just getting speed improvements, but **production-grade reliability**.


**Performance Impact:**
In our testing environment, we've seen build times drop from **45 minutes to under 6 minutes** for our full production build. But more importantly, **Hot Module Replacement (HMR)** response times have gone from 3-4 seconds to under 200ms. For a development team, this isn't just a nice-to-have - it fundamentally changes how we iterate and debug.


**Strategic Implications:**
What excites me most is that this positions Next.js to compete directly with **Vite's development experience** while maintaining all the production optimizations that make Next.js powerful. We're finally getting the best of both worlds - **Vite-like dev speed with Next.js production capabilities**.


**Rust Ecosystem Integration:**
The fact that this is built in Rust also signals a broader trend. We're seeing SWC, Turbopack, and tools like Tauri all leveraging Rust's performance characteristics. This creates a **more cohesive, high-performance toolchain** for JavaScript development.


**Interviewer**: You mentioned hybrid rendering strategies earlier. With Next.js 15.4 introducing improved PPR (Partial Pre-rendering) support and Turbopack optimizations, how would you approach architecting a new financial services application that needs to balance security, performance, and SEO requirements?


**Candidate**: That's a great question, especially in the financial services context where we have unique constraints. Let me break down my approach:


**Rendering Strategy Architecture:**


```typescript
// next.config.js
const nextConfig = {
  experimental: {
    ppr: true,
    turbopackPersistentCaching: true,
    dynamicIO: true
  },
  // Security-first configuration
  poweredByHeader: false,
  reactStrictMode: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
  }
}
```


**1. Page Classification System:**
I'd implement a **three-tier rendering strategy**:


- **Static Pre-rendered (SSG)**: Marketing pages, terms of service, help documentation
- **Partial Pre-rendering (PPR)**: Account dashboards, transaction history listings
- **Server-Side Rendered (SSR)**: Real-time trading interfaces, security-sensitive operations


**2. PPR Implementation for Financial Dashboards:**


```typescript
// app/dashboard/page.tsx
import { Suspense } from 'react'
import { StaticAccountSummary } from './components/StaticAccountSummary'
import { DynamicTransactionFeed } from './components/DynamicTransactionFeed'
import { DynamicMarketData } from './components/DynamicMarketData'

export default function DashboardPage() {
  return (
    <div className="dashboard-layout">
      {/* Pre-rendered static shell */}
      <StaticAccountSummary />

      {/* Dynamic, user-specific content */}
      <Suspense fallback={<TransactionsSkeleton />}>
        <DynamicTransactionFeed />
      </Suspense>

      <Suspense fallback={<MarketDataSkeleton />}>
        <DynamicMarketData />
      </Suspense>
    </div>
  )
}
```


**3. Security Considerations:**


```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')

  // CSP for financial data protection
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://trusted-cdn.nab.com.au; style-src 'self' 'unsafe-inline'"
  )

  return response
}
```


**4. Performance Optimization with Turbopack:**


The key advantage here is **Turbopack's persistent caching**. In financial applications, we often have complex calculation modules that don't change frequently. Turbopack's dependency analysis can cache these effectively:


```javascript
// turbopack.config.js
module.exports = {
  experimental: {
    turbopackPersistentCaching: {
      strategies: ['memory', 'filesystem'],
      invalidationPatterns: [
        'src/calculations/**',
        'src/models/**',
        'public/market-data/**'
      ]
    }
  }
}
```


**5. SEO Strategy:**
For financial services, SEO is crucial for customer acquisition:


```typescript
// app/global-not-found.tsx (New in 15.4)
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Page Not Found | NAB - National Australia Bank',
  description: 'The page you are looking for cannot be found. Explore NAB banking services, loans, and financial solutions.',
  robots: {
    index: false,
    follow: true
  },
  alternates: {
    canonical: 'https://nab.com.au/404'
  }
}

export default function GlobalNotFound() {
  return (
    <div className="error-page">
      <h1>Page Not Found</h1>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Error 404 - Page Not Found',
            description: 'NAB - Page not found error'
          })
        }}
      />
    </div>
  )
}
```


**Trade-offs Analysis:**


- **PPR Benefits**: Faster perceived loading, better Core Web Vitals, reduced server load
- **PPR Challenges**: Increased complexity in state management, potential flash of unstyled content
- **Turbopack Benefits**: Dramatically faster builds, better development experience
- **Turbopack Considerations**: Still maturing ecosystem, potential compatibility issues with some Webpack plugins


---


## Part 2: Deep Technical Discussion


**Interviewer**: I'm impressed with your architectural thinking. Let's dive deeper into some technical specifics. The new `router.prefetch()` method in Next.js 15.4 includes an `onInvalidate` callback. How would you leverage this in a complex financial application where data freshness is critical?


**Candidate**: This is actually one of the most exciting additions for financial applications. The `onInvalidate` callback addresses a major pain point we've had with **stale financial data** and **cache invalidation strategies**. Let me show you how I'd implement this:


**Smart Prefetching with Invalidation Strategy:**


```typescript
// hooks/useSmartPrefetch.ts
import { useRouter } from 'next/navigation'
import { useCallback, useRef, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'

interface PrefetchConfig {
  route: string
  conditions?: {
    userActivity?: boolean
    marketHours?: boolean
    connectionQuality?: 'slow' | 'fast'
  }
  invalidationStrategy?: 'aggressive' | 'conservative' | 'market-driven'
}

export function useSmartPrefetch(config: PrefetchConfig) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const invalidationTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map())

  const handleInvalidation = useCallback(async () => {
    console.log(`Cache invalidated for route: ${config.route}`)

    // Invalidate related React Query caches
    await queryClient.invalidateQueries({
      queryKey: ['route-data', config.route],
      exact: false
    })

    // Re-prefetch with updated data if conditions still met
    if (shouldReprefetch(config.conditions)) {
      router.prefetch(config.route, {
        onInvalidate: handleInvalidation
      })
    }
  }, [config.route, config.conditions, queryClient, router])

  const prefetchRoute = useCallback(() => {
    // Clear existing invalidation timeout
    const existingTimeout = invalidationTimeouts.current.get(config.route)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
    }

    // Set invalidation strategy based on config
    let invalidationDelay: number
    switch (config.invalidationStrategy) {
      case 'aggressive':
        invalidationDelay = 30000 // 30 seconds for real-time trading data
        break
      case 'market-driven':
        invalidationDelay = isMarketOpen() ? 60000 : 300000 // 1min or 5min
        break
      default:
        invalidationDelay = 120000 // 2 minutes default
    }

    router.prefetch(config.route, {
      onInvalidate: handleInvalidation
    })

    // Set up automatic invalidation
    const timeout = setTimeout(handleInvalidation, invalidationDelay)
    invalidationTimeouts.current.set(config.route, timeout)
  }, [config, handleInvalidation, router])

  return { prefetchRoute, invalidateCache: handleInvalidation }
}

function shouldReprefetch(conditions?: PrefetchConfig['conditions']): boolean {
  if (!conditions) return true

  // Check user activity
  if (conditions.userActivity && !isUserActive()) return false

  // Check market hours for financial data
  if (conditions.marketHours && !isMarketOpen()) return false

  // Check connection quality
  if (conditions.connectionQuality === 'fast' && isSlowConnection()) return false

  return true
}
```


**Implementation in Portfolio Components:**


```typescript
// components/portfolio/PortfolioNavigation.tsx
import { useSmartPrefetch } from '@/hooks/useSmartPrefetch'
import { Link } from 'next/link'

export function PortfolioNavigation() {
  const { prefetchRoute } = useSmartPrefetch({
    route: '/portfolio/detailed-holdings',
    conditions: {
      userActivity: true,
      marketHours: true,
      connectionQuality: 'fast'
    },
    invalidationStrategy: 'market-driven'
  })

  return (
    <nav className="portfolio-nav">
      <Link
        href="/portfolio/detailed-holdings"
        onMouseEnter={prefetchRoute}
        // New syntax sugar in 15.4
        prefetch="auto"
      >
        Detailed Holdings
      </Link>
    </nav>
  )
}
```


**Market Data Synchronization:**


```typescript
// lib/market-data-sync.ts
import { EventEmitter } from 'events'

class MarketDataSynchronizer extends EventEmitter {
  private wsConnection: WebSocket | null = null
  private prefetchInvalidators: Map<string, () => void> = new Map()

  constructor() {
    super()
    this.initializeWebSocket()
  }

  registerPrefetchInvalidator(symbol: string, invalidatorFn: () => void) {
    this.prefetchInvalidators.set(symbol, invalidatorFn)
  }

  private initializeWebSocket() {
    this.wsConnection = new WebSocket('wss://market-data.nab.com.au/ws')

    this.wsConnection.onmessage = (event) => {
      const data = JSON.parse(event.data)

      if (data.type === 'price_update') {
        // Invalidate prefetched routes related to this symbol
        const invalidator = this.prefetchInvalidators.get(data.symbol)
        if (invalidator) {
          invalidator()
        }

        // Emit event for other components to react
        this.emit('price_update', data)
      }
    }
  }
}

export const marketDataSync = new MarketDataSynchronizer()
```


**Integration with React Query for Data Consistency:**


```typescript
// hooks/useMarketAwareQuery.ts
import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { marketDataSync } from '@/lib/market-data-sync'

export function useMarketAwareQuery<T>(
  queryKey: string[],
  queryFn: () => Promise<T>,
  symbol?: string
) {
  const query = useQuery({
    queryKey,
    queryFn,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false
  })

  useEffect(() => {
    if (!symbol) return

    const handlePriceUpdate = (data: any) => {
      if (data.symbol === symbol) {
        query.refetch()
      }
    }

    marketDataSync.on('price_update', handlePriceUpdate)

    return () => {
      marketDataSync.off('price_update', handlePriceUpdate)
    }
  }, [symbol, query])

  return query
}
```


**Performance Monitoring Integration:**


```typescript
// lib/prefetch-analytics.ts
interface PrefetchMetrics {
  route: string
  prefetchTime: number
  invalidationCount: number
  hitRate: number
  userNavigated: boolean
}

class PrefetchAnalytics {
  private metrics: Map<string, PrefetchMetrics> = new Map()

  trackPrefetch(route: string) {
    const existing = this.metrics.get(route) || {
      route,
      prefetchTime: Date.now(),
      invalidationCount: 0,
      hitRate: 0,
      userNavigated: false
    }

    this.metrics.set(route, existing)
  }

  trackInvalidation(route: string) {
    const metrics = this.metrics.get(route)
    if (metrics) {
      metrics.invalidationCount++
      this.metrics.set(route, metrics)
    }
  }

  trackNavigation(route: string) {
    const metrics = this.metrics.get(route)
    if (metrics) {
      metrics.userNavigated = true
      metrics.hitRate = this.calculateHitRate(metrics)
      this.metrics.set(route, metrics)

      // Send to analytics
      this.sendAnalytics(metrics)
    }
  }

  private calculateHitRate(metrics: PrefetchMetrics): number {
    const prefetchAge = Date.now() - metrics.prefetchTime
    const invalidationPenalty = metrics.invalidationCount * 0.1
    return Math.max(0, (1 - (prefetchAge / 300000)) - invalidationPenalty)
  }

  private sendAnalytics(metrics: PrefetchMetrics) {
    // Send to your analytics platform
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as any).gtag('event', 'prefetch_performance', {
        route: metrics.route,
        hit_rate: metrics.hitRate,
        invalidation_count: metrics.invalidationCount
      })
    }
  }
}

export const prefetchAnalytics = new PrefetchAnalytics()
```


**Trade-offs and Considerations:**


1. **Memory Management**: Aggressive prefetching can consume significant memory. I'd implement a **LRU cache** with size limits.
2. **Network Efficiency**: The invalidation callbacks need to be balanced against bandwidth usage, especially on mobile connections.
3. **Financial Data Accuracy**: The aggressive invalidation strategy ensures data freshness but increases server load. We'd need **circuit breakers** to prevent overwhelming our APIs.
4. **User Experience**: The `prefetch="auto"` syntax sugar makes the code more readable while maintaining the intelligent prefetching behavior.


**Interviewer**: Excellent implementation! I'm particularly impressed with your market data synchronization approach. Now, let's talk about the performance implications. You mentioned Turbopack's 8x-10x build speed improvements. From a practical standpoint, how would this impact your team's development workflow and CI/CD pipeline?


**Candidate**: This is where Turbopack becomes transformative for team productivity and operational efficiency. Let me break down the **real-world impact** across different aspects of our development lifecycle:


**Development Workflow Transformation:**


```typescript
// Before Turbopack (Webpack)
// Our typical development session:
// - Cold start: 45-60 seconds
// - HMR updates: 3-4 seconds
// - Full rebuild after git pull: 2-3 minutes
// - Bundle analysis: 5-10 minutes

// After Turbopack
// - Cold start: 6-8 seconds
// - HMR updates: 150-300ms
// - Full rebuild after git pull: 20-30 seconds
// - Bundle analysis: Real-time via Turbopack's built-in tools
```


**CI/CD Pipeline Optimization:**


Here's how I'd restructure our pipeline to leverage Turbopack's capabilities:


```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline with Turbopack

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18, 20]

    steps:
      - uses: actions/checkout@v3

      # Turbopack cache strategy
      - name: Setup Turbopack Cache
        uses: actions/cache@v3
        with:
          path: |
            ~/.npm
            .next/cache
            .turbopack/cache
          key: ${{ runner.os }}-turbopack-${{ hashFiles('**/package-lock.json') }}-${{ hashFiles('**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx') }}
          restore-keys: |
            ${{ runner.os }}-turbopack-${{ hashFiles('**/package-lock.json') }}-
            ${{ runner.os }}-turbopack-

      - name: Install dependencies
        run: npm ci

      # Parallel builds with Turbopack
      - name: Build Production (Turbopack)
        run: npm run build:turbopack
        env:
          NODE_ENV: production
          NEXT_TELEMETRY_DISABLED: 1

      - name: Build Storybook (Turbopack)
        run: npm run build:storybook
        env:
          NODE_ENV: production

      # Performance regression testing
      - name: Bundle Size Analysis
        run: |
          npm run analyze:bundle
          npm run compare:bundle-size

      - name: Performance Benchmarks
        run: |
          npm run test:performance
          npm run lighthouse:ci

  # Deployment with Turbopack optimizations
  deploy:
    needs: build-and-test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Vercel with Turbopack
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
        run: |
          npx vercel --prod --token $VERCEL_TOKEN \
            --build-env NEXT_BUILD_TOOL=turbopack \
            --build-env TURBOPACK_PERSISTENT_CACHING=true
```


**Performance Monitoring Setup:**


```typescript
// scripts/performance-monitoring.ts
import { performance, PerformanceObserver } from 'perf_hooks'
import fs from 'fs/promises'

interface BuildMetrics {
  buildTool: 'webpack' | 'turbopack'
  startTime: number
  endTime: number
  duration: number
  memoryUsage: NodeJS.MemoryUsage
  bundleSize: number
  chunkCount: number
  hmrResponseTime?: number
}

class PerformanceMonitor {
  private metrics: BuildMetrics[] = []
  private observer: PerformanceObserver

  constructor() {
    this.observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.name.includes('build') || entry.name.includes('hmr')) {
          this.recordMetric(entry)
        }
      })
    })

    this.observer.observe({ entryTypes: ['measure', 'navigation'] })
  }

  async recordBuildStart(buildTool: 'webpack' | 'turbopack') {
    performance.mark(`${buildTool}-build-start`)

    return {
      buildTool,
      startTime: Date.now(),
      memoryUsage: process.memoryUsage()
    }
  }

  async recordBuildEnd(buildContext: Partial<BuildMetrics>) {
    const endTime = Date.now()
    performance.mark(`${buildContext.buildTool}-build-end`)
    performance.measure(
      `${buildContext.buildTool}-build`,
      `${buildContext.buildTool}-build-start`,
      `${buildContext.buildTool}-build-end`
    )

    const bundleStats = await this.analyzeBundleSize()

    const completeMetrics: BuildMetrics = {
      ...buildContext,
      endTime,
      duration: endTime - (buildContext.startTime || 0),
      memoryUsage: process.memoryUsage(),
      bundleSize: bundleStats.totalSize,
      chunkCount: bundleStats.chunkCount
    } as BuildMetrics

    this.metrics.push(completeMetrics)
    await this.exportMetrics()

    return completeMetrics
  }

  private async analyzeBundleSize() {
    try {
      const buildManifest = await fs.readFile('.next/build-manifest.json', 'utf-8')
      const manifest = JSON.parse(buildManifest)

      let totalSize = 0
      let chunkCount = 0

      for (const page in manifest.pages) {
        const chunks = manifest.pages[page]
        chunkCount += chunks.length

        for (const chunk of chunks) {
          try {
            const chunkPath = `.next/static/chunks/${chunk}`
            const stats = await fs.stat(chunkPath)
            totalSize += stats.size
          } catch (e) {
            // Chunk might not exist or be in different location
          }
        }
      }

      return { totalSize, chunkCount }
    } catch (error) {
      console.warn('Could not analyze bundle size:', error)
      return { totalSize: 0, chunkCount: 0 }
    }
  }

  private async exportMetrics() {
    const metricsReport = {
      timestamp: new Date().toISOString(),
      summary: this.generateSummary(),
      detailed: this.metrics.slice(-10) // Last 10 builds
    }

    await fs.writeFile(
      'performance-metrics.json',
      JSON.stringify(metricsReport, null, 2)
    )
  }

  private generateSummary() {
    const turbopackBuilds = this.metrics.filter(m => m.buildTool === 'turbopack')
    const webpackBuilds = this.metrics.filter(m => m.buildTool === 'webpack')

    const avgTurbopack = turbopackBuilds.reduce((acc, m) => acc + m.duration, 0) / turbopackBuilds.length
    const avgWebpack = webpackBuilds.reduce((acc, m) => acc + m.duration, 0) / webpackBuilds.length

    return {
      turbopackAverage: avgTurbopack,
      webpackAverage: avgWebpack,
      improvementRatio: webpackBuilds.length > 0 ? avgWebpack / avgTurbopack : 0,
      totalBuilds: this.metrics.length
    }
  }
}

export const performanceMonitor = new PerformanceMonitor()
```


**Team Workflow Impact Analysis:**


```typescript
// scripts/team-productivity-analysis.ts
interface TeamMetrics {
  developerId: string
  dailyBuilds: number
  averageBuildTime: number
  productiveTime: number // Time spent coding vs waiting for builds
  contextSwitches: number // Times switching tasks while waiting
}

class ProductivityAnalyzer {
  private readonly AVERAGE_BUILD_FREQUENCY = 50 // builds per developer per day
  private readonly CONTEXT_SWITCH_COST = 23 * 60 * 1000 // 23 minutes in ms

  calculateProductivityGains(teamSize: number) {
    const webpackMetrics = {
      avgBuildTime: 45000, // 45 seconds
      hmrTime: 3500 // 3.5 seconds
    }

    const turbopackMetrics = {
      avgBuildTime: 6000, // 6 seconds
      hmrTime: 200 // 200ms
    }

    // Daily calculations per developer
    const buildTimeSavingsPerDev = (webpackMetrics.avgBuildTime - turbopackMetrics.avgBuildTime)
      * this.AVERAGE_BUILD_FREQUENCY

    const hmrSavingsPerDev = (webpackMetrics.hmrTime - turbopackMetrics.hmrTime)
      * (this.AVERAGE_BUILD_FREQUENCY * 3) // Assuming 3 HMR cycles per build

    // Context switching reduction
    const contextSwitchReduction = this.calculateContextSwitchReduction(
      webpackMetrics.avgBuildTime,
      turbopackMetrics.avgBuildTime
    )

    return {
      perDeveloper: {
        dailyTimeSavings: buildTimeSavingsPerDev + hmrSavingsPerDev,
        weeklyTimeSavings: (buildTimeSavingsPerDev + hmrSavingsPerDev) * 5,
        monthlyTimeSavings: (buildTimeSavingsPerDev + hmrSavingsPerDev) * 22,
        contextSwitchReduction
      },
      teamTotal: {
        dailyTimeSavings: (buildTimeSavingsPerDev + hmrSavingsPerDev) * teamSize,
        weeklyTimeSavings: (buildTimeSavingsPerDev + hmrSavingsPerDev) * teamSize * 5,
        monthlyTimeSavings: (buildTimeSavingsPerDev + hmrSavingsPerDev) * teamSize * 22,
        totalContextSwitchReduction: contextSwitchReduction * teamSize
      }
    }
  }

  private calculateContextSwitchReduction(oldBuildTime: number, newBuildTime: number): number {
    // If build time drops below 10 seconds, developers are less likely to context switch
    const oldContextSwitches = oldBuildTime > 10000 ?
      Math.floor(this.AVERAGE_BUILD_FREQUENCY * 0.7) : 0

    const newContextSwitches = newBuildTime > 10000 ?
      Math.floor(this.AVERAGE_BUILD_FREQUENCY * 0.7) : 0

    return (oldContextSwitches - newContextSwitches) * this.CONTEXT_SWITCH_COST
  }

  generateReport(teamSize: number = 15) {
    const gains = this.calculateProductivityGains(teamSize)

    return {
      summary: `
        For a team of ${teamSize} developers:
        - Daily time savings: ${(gains.teamTotal.dailyTimeSavings / 1000 / 60 / 60).toFixed(1)} hours
        - Weekly time savings: ${(gains.teamTotal.weeklyTimeSavings / 1000 / 60 / 60).toFixed(1)} hours
        - Monthly time savings: ${(gains.teamTotal.monthlyTimeSavings / 1000 / 60 / 60).toFixed(1)} hours
        - Equivalent to: ${(gains.teamTotal.monthlyTimeSavings / 1000 / 60 / 60 / 8).toFixed(1)} full work days per month
      `,
      detailed: gains
    }
  }
}

const analyzer = new ProductivityAnalyzer()
console.log(analyzer.generateReport(15)) // NAB team size
```


**Memory and Resource Optimization:**


```typescript
// next.config.js
const nextConfig = {
  experimental: {
    turbopackPersistentCaching: true,
    turbopackMemoryLimit: 8192, // 8GB limit for large codebases
    turbopackConcurrency: 8, // Optimal for CI environment
  },

  // Turbopack-specific optimizations
  turbopack: {
    resolveExtensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    memoryLimit: '8gb',

    // Custom loader configurations
    loaders: {
      '.svg': ['@svgr/webpack'],
      '.md': ['@next/mdx-loader']
    },

    // Tree shaking optimizations
    treeShaking: {
      preset: 'aggressive',
      manualChunks: {
        'vendor-charts': ['recharts', 'd3', 'chart.js'],
        'vendor-ui': ['@mui/material', '@headlessui/react'],
        'vendor-state': ['zustand', 'jotai', '@tanstack/react-query']
      }
    }
  }
}
```


**CI/CD Cost Analysis:**


The financial impact for NAB would be substantial:


1. **Build Time Reduction**: From 45 minutes to 6 minutes = **87% time savings**
2. **CI Minutes Cost**: Assuming GitHub Actions at $0.008/minute:

Old cost per build: 45 × $0.008 = $0.36
New cost per build: 6 × $0.008 = $0.048
Daily savings (100 builds): $31.20
Monthly savings: $936
Annual savings: $11,232
3. **Developer Productivity**: 15 developers × 2.5 hours saved per week × $100/hour = **$1,950 per week** in productivity gains
4. **Deployment Frequency**: Faster builds enable more frequent deployments, reducing risk and improving feature delivery speed.


**Migration Strategy Considerations:**


```typescript
// scripts/migration-validator.ts
import { execSync } from 'child_process'
import { performance } from 'perf_hooks'

class MigrationValidator {
  async validateTurbopackCompatibility() {
    const checks = [
      this.checkWebpackPluginCompatibility,
      this.validateCustomLoaders,
      this.testHMRBehavior,
      this.validateBundleOutput,
      this.checkMemoryUsage
    ]

    const results = await Promise.all(
      checks.map(check => this.runCheck(check))
    )

    return {
      compatible: results.every(r => r.passed),
      issues: results.filter(r => !r.passed),
      recommendations: this.generateRecommendations(results)
    }
  }

  private async runCheck(checkFn: () => Promise<any>) {
    try {
      const start = performance.now()
      const result = await checkFn.call(this)
      const duration = performance.now() - start

      return {
        passed: true,
        result,
        duration,
        error: null
      }
    } catch (error) {
      return {
        passed: false,
        result: null,
        duration: 0,
        error: error.message
      }
    }
  }

  private async checkWebpackPluginCompatibility() {
    // Check for incompatible webpack plugins
    const packageJson = require('../package.json')
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies }

    const potentialIssues = [
      'webpack-bundle-analyzer', // Has Turbopack equivalent
      'html-webpack-plugin', // Built into Next.js
      'mini-css-extract-plugin' // Handled by Turbopack
    ]

    return {
      incompatiblePlugins: potentialIssues.filter(plugin => dependencies[plugin]),
      totalPlugins: Object.keys(dependencies).filter(dep => dep.includes('webpack')).length
    }
  }

  private async validateCustomLoaders() {
    // Check for custom webpack loaders that might need migration
    const webpackConfig = require('../webpack.config.js')
    // Implementation details...
  }

  private generateRecommendations(results: any[]) {
    // Generate specific migration recommendations
    return [
      'Consider migrating webpack-bundle-analyzer to Turbopack\'s built-in analysis',
      'Update custom loaders to Turbopack equivalents',
      'Test HMR behavior with your specific component library'
    ]
  }
}
```


**Real-World Impact Summary:**


For NAB's frontend engineering team, Turbopack's production readiness represents:


1. **Development Velocity**: **8-10x faster iterations** leading to more experimental development and faster feature delivery
2. **Cost Efficiency**: **$50,000+ annual savings** in CI/CD costs and developer productivity
3. **Quality Improvements**: Faster feedback loops lead to better code quality and fewer bugs in production
4. **Team Morale**: Reduced frustration with slow builds, more time for creative problem-solving
5. **Competitive Advantage**: Ability to ship features faster than competitors still using slower build tools


**Interviewer**: Outstanding analysis! Your cost-benefit breakdown and migration strategy really demonstrate senior-level thinking. Now let's shift to a coding challenge. I'd like you to implement a React component that leverages some of the new Next.js 15.4 features while solving a practical problem we face at NAB.


---


## Part 3: Coding Challenge


**Interviewer**: Here's the scenario: We need to build a **real-time financial portfolio dashboard** that displays a user's investment holdings with live price updates. The component should:


1. Use **Partial Pre-rendering (PPR)** to show static layout immediately
2. Implement **smart prefetching** with the new `onInvalidate` callback
3. Handle **real-time WebSocket updates** for price changes
4. Include **error boundaries** and loading states
5. Be **accessible** and **performance-optimized**


The data structure for a holding looks like this:


```typescript
interface Holding {
  id: string
  symbol: string
  companyName: string
  quantity: number
  currentPrice: number
  previousClose: number
  marketValue: number
  dayChange: number
  dayChangePercent: number
  lastUpdated: Date
}
```


Can you implement this component with all the Next.js 15.4 optimizations we've discussed?


**Candidate**: Absolutely! This is a perfect use case for showcasing Next.js 15.4's capabilities. Let me build this step by step, focusing on **production-ready code** with proper error handling and performance optimizations.


```typescript
// types/portfolio.ts
export interface Holding {
  id: string
  symbol: string
  companyName: string
  quantity: number
  currentPrice: number
  previousClose: number
  marketValue: number
  dayChange: number
  dayChangePercent: number
  lastUpdated: Date
}

export interface PortfolioSummary {
  totalValue: number
  dayChange: number
  dayChangePercent: number
  totalGainLoss: number
  totalGainLossPercent: number
}

export interface PriceUpdate {
  symbol: string
  price: number
  change: number
  changePercent: number
  timestamp: Date
}
```


```typescript
// hooks/useWebSocketConnection.ts
import { useCallback, useEffect, useRef, useState } from 'react'
import { PriceUpdate } from '@/types/portfolio'

interface WebSocketConfig {
  url: string
  reconnectAttempts?: number
  reconnectDelay?: number
  heartbeatInterval?: number
}

export function useWebSocketConnection({
  url,
  reconnectAttempts = 5,
  reconnectDelay = 3000,
  heartbeatInterval = 30000
}: WebSocketConfig) {
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting')
  const [lastMessage, setLastMessage] = useState<PriceUpdate | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectCountRef = useRef(0)
  const messageHandlersRef = useRef<Set<(message: PriceUpdate) => void>>(new Set())

  const connect = useCallback(() => {
    try {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        return
      }

      setConnectionStatus('connecting')
      const ws = new WebSocket(url)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('WebSocket connected')
        setConnectionStatus('connected')
        reconnectCountRef.current = 0

        // Start heartbeat
        heartbeatIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }))
          }
        }, heartbeatInterval)

        // Subscribe to price updates
        ws.send(JSON.stringify({
          type: 'subscribe',
          channels: ['price_updates']
        }))
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)

          if (data.type === 'price_update') {
            const priceUpdate: PriceUpdate = {
              symbol: data.symbol,
              price: data.price,
              change: data.change,
              changePercent: data.changePercent,
              timestamp: new Date(data.timestamp)
            }

            setLastMessage(priceUpdate)

            // Notify all registered handlers
            messageHandlersRef.current.forEach(handler => {
              try {
                handler(priceUpdate)
              } catch (error) {
                console.error('Error in message handler:', error)
              }
            })
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason)
        setConnectionStatus('disconnected')

        // Clear heartbeat
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current)
          heartbeatIntervalRef.current = null
        }

        // Attempt reconnection if not a clean close
        if (event.code !== 1000 && reconnectCountRef.current < reconnectAttempts) {
          reconnectCountRef.current++
          console.log(`Reconnection attempt ${reconnectCountRef.current}/${reconnectAttempts}`)

          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, reconnectDelay * Math.pow(2, reconnectCountRef.current - 1)) // Exponential backoff
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        setConnectionStatus('error')
      }
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
      setConnectionStatus('error')
    }
  }, [url, reconnectAttempts, reconnectDelay, heartbeatInterval])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current)
      heartbeatIntervalRef.current = null
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnected')
      wsRef.current = null
    }

    setConnectionStatus('disconnected')
  }, [])

  const addMessageHandler = useCallback((handler: (message: PriceUpdate) => void) => {
    messageHandlersRef.current.add(handler)

    return () => {
      messageHandlersRef.current.delete(handler)
    }
  }, [])

  useEffect(() => {
    connect()

    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return {
    connectionStatus,
    lastMessage,
    addMessageHandler,
    reconnect: connect,
    disconnect
  }
}
```


```typescript
// hooks/usePortfolioData.ts
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useState } from 'react'
import { Holding, PortfolioSummary, PriceUpdate } from '@/types/portfolio'
import { useWebSocketConnection } from './useWebSocketConnection'

async function fetchPortfolioData(): Promise<{ holdings: Holding[], summary: PortfolioSummary }> {
  const response = await fetch('/api/portfolio', {
    headers: {
      'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error(`Portfolio fetch failed: ${response.status}`)
  }

  return response.json()
}

export function usePortfolioData() {
  const queryClient = useQueryClient()
  const [localHoldings, setLocalHoldings] = useState<Holding[]>([])

  const { connectionStatus, addMessageHandler } = useWebSocketConnection({
    url: process.env.NEXT_PUBLIC_WS_URL || 'wss://api.nab.com.au/portfolio/ws',
    reconnectAttempts: 5,
    reconnectDelay: 1000,
    heartbeatInterval: 30000
  })

  const query = useQuery({
    queryKey: ['portfolio'],
    queryFn: fetchPortfolioData,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
    refetchInterval: 60000, // Refetch every minute as fallback
    retry: (failureCount, error) => {
      // Don't retry on authentication errors
      if (error.message.includes('401') || error.message.includes('403')) {
        return false
      }
      return failureCount < 3
    }
  })

  // Handle real-time price updates
  const handlePriceUpdate = useCallback((priceUpdate: PriceUpdate) => {
    setLocalHoldings(currentHoldings => {
      return currentHoldings.map(holding => {
        if (holding.symbol === priceUpdate.symbol) {
          const newPrice = priceUpdate.price
          const newMarketValue = holding.quantity * newPrice
          const newDayChange = priceUpdate.change
          const newDayChangePercent = priceUpdate.changePercent

          return {
            ...holding,
            currentPrice: newPrice,
            marketValue: newMarketValue,
            dayChange: newDayChange,
            dayChangePercent: newDayChangePercent,
            lastUpdated: priceUpdate.timestamp
          }
        }
        return holding
      })
    })

    // Update React Query cache
    queryClient.setQueryData(['portfolio'], (oldData: any) => {
      if (!oldData) return oldData

      const updatedHoldings = oldData.holdings.map((holding: Holding) => {
        if (holding.symbol === priceUpdate.symbol) {
          return {
            ...holding,
            currentPrice: priceUpdate.price,
            marketValue: holding.quantity * priceUpdate.price,
            dayChange: priceUpdate.change,
            dayChangePercent: priceUpdate.changePercent,
            lastUpdated: priceUpdate.timestamp
          }
        }
        return holding
      })

      // Recalculate summary
      const totalValue = updatedHoldings.reduce((sum, h) => sum + h.marketValue, 0)
      const totalDayChange = updatedHoldings.reduce((sum, h) => sum + (h.dayChange * h.quantity), 0)
      const totalDayChangePercent = totalValue > 0 ? (totalDayChange / (totalValue - totalDayChange)) * 100 : 0

      return {
        holdings: updatedHoldings,
        summary: {
          ...oldData.summary,
          totalValue,
          dayChange: totalDayChange,
          dayChangePercent: totalDayChangePercent
        }
      }
    })
  }, [queryClient])

  useEffect(() => {
    const unsubscribe = addMessageHandler(handlePriceUpdate)
    return unsubscribe
  }, [addMessageHandler, handlePriceUpdate])

  useEffect(() => {
    if (query.data?.holdings) {
      setLocalHoldings(query.data.holdings)
    }
  }, [query.data?.holdings])

  const holdings = localHoldings.length > 0 ? localHoldings : query.data?.holdings || []
  const summary = query.data?.summary || null

  return {
    holdings,
    summary,
    isLoading: query.isLoading,
    error: query.error,
    connectionStatus,
    refetch: query.refetch
  }
}
```


```typescript
// components/portfolio/PortfolioErrorBoundary.tsx
'use client'

import { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: any
}

export class PortfolioErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Portfolio Error Boundary caught an error:', error, errorInfo)

    // Send error to monitoring service
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as any).gtag('event', 'exception', {
        description: error.message,
        fatal: false,
        custom_map: {
          component: 'PortfolioDashboard',
          stack: error.stack
        }
      })
    }

    this.setState({
      hasError: true,
      error,
      errorInfo
    })
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div
          className="portfolio-error-boundary bg-red-50 border border-red-200 rounded-lg p-6 m-4"
          role="alert"
          aria-live="polite"
        >
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-6 w-6 text-red-500" aria-hidden="true" />
            <div>
              <h3 className="text-lg font-semibold text-red-800">
                Portfolio Loading Error
              </h3>
              <p className="text-red-700 mt-1">
                We're having trouble loading your portfolio data. This might be a temporary issue.
              </p>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm text-red-600">
                    Technical Details
                  </summary>
                  <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-auto">
                    {this.state.error.message}
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </div>
          </div>
          <div className="mt-4 flex space-x-3">
            <button
              onClick={this.handleRetry}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              aria-label="Retry loading portfolio"
            >
              <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
              Try Again
            </button>
            <a
              href="/support"
              className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Contact Support
            </a>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
```


```typescript
// components/portfolio/PortfolioSkeleton.tsx
export function PortfolioSkeleton() {
  return (
    <div className="portfolio-skeleton space-y-6" aria-label="Loading portfolio data">
      {/* Summary skeleton */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/5"></div>
        </div>
      </div>

      {/* Holdings skeleton */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="animate-pulse h-6 bg-gray-200 rounded w-1/4"></div>
        </div>
        <div className="divide-y divide-gray-200">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="px-6 py-4">
              <div className="animate-pulse flex items-center space-x-4">
                <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/6"></div>
                </div>
                <div className="text-right space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```


```typescript
// components/portfolio/HoldingRow.tsx
import { memo } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Holding } from '@/types/portfolio'

interface HoldingRowProps {
  holding: Holding
  onClick?: () => void
}

export const HoldingRow = memo(function HoldingRow({
  holding,
  onClick
}: HoldingRowProps) {
  const isPositive = holding.dayChangePercent > 0
  const isNegative = holding.dayChangePercent < 0
  const isNeutral = holding.dayChangePercent === 0

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const formatPercent = (percent: number) => {
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`
  }

  return (
    <div
      className={`holding-row px-6 py-4 transition-colors duration-150 ${
        onClick ? 'cursor-pointer hover:bg-gray-50' : ''
      }`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      } : undefined}
      aria-label={`${holding.companyName} holding details`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Company logo placeholder */}
          <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-sm font-semibold text-blue-600">
              {holding.symbol.slice(0, 2).toUpperCase()}
            </span>
          </div>

          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-900">
              {holding.companyName}
            </h3>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>{holding.symbol}</span>
              <span>{holding.quantity} shares</span>
              <span className="text-xs text-gray-500">
                Last updated: {holding.lastUpdated.toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-lg font-semibold text-gray-900">
            {formatCurrency(holding.marketValue)}
          </div>
          <div className="flex items-center justify-end space-x-1">
            {isPositive && (
              <TrendingUp className="h-4 w-4 text-green-500" aria-hidden="true" />
            )}
            {isNegative && (
              <TrendingDown className="h-4 w-4 text-red-500" aria-hidden="true" />
            )}
            {isNeutral && (
              <Minus className="h-4 w-4 text-gray-400" aria-hidden="true" />
            )}
            <span
              className={`text-sm font-medium ${
                isPositive ? 'text-green-600' :
                isNegative ? 'text-red-600' :
                'text-gray-600'
              }`}
            >
              {formatCurrency(Math.abs(holding.dayChange))} ({formatPercent(holding.dayChangePercent)})
            </span>
          </div>
          <div className="text-sm text-gray-600">
            {formatCurrency(holding.currentPrice)} per share
          </div>
        </div>
      </div>
    </div>
  )
})

HoldingRow.displayName = 'HoldingRow'
```


```typescript
// components/portfolio/PortfolioSummary.tsx
import { memo } from 'react'
import { TrendingUp, TrendingDown, DollarSign, Activity } from 'lucide-react'
import { PortfolioSummary as PortfolioSummaryType } from '@/types/portfolio'

interface PortfolioSummaryProps {
  summary: PortfolioSummaryType
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error'
}

export const PortfolioSummary = memo(function PortfolioSummary({
  summary,
  connectionStatus
}: PortfolioSummaryProps) {
  const isPositive = summary.dayChangePercent > 0
  const isNegative = summary.dayChangePercent < 0

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const formatPercent = (percent: number) => {
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`
  }

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Activity className="h-4 w-4 text-green-500" aria-hidden="true" />
      case 'connecting':
        return <Activity className="h-4 w-4 text-yellow-500 animate-pulse" aria-hidden="true" />
      case 'disconnected':
        return <Activity className="h-4 w-4 text-gray-400" aria-hidden="true" />
      case 'error':
        return <Activity className="h-4 w-4 text-red-500" aria-hidden="true" />
    }
  }

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Live prices'
      case 'connecting':
        return 'Connecting...'
      case 'disconnected':
        return 'Disconnected'
      case 'error':
        return 'Connection error'
    }
  }

  return (
    <div className="portfolio-summary bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Portfolio Summary
          </h2>
          <div
            className="flex items-center space-x-2 text-sm"
            role="status"
            aria-live="polite"
            aria-label={`Market data connection status: ${getConnectionStatusText()}`}
          >
            {getConnectionStatusIcon()}
            <span
              className={`${
                connectionStatus === 'connected' ? 'text-green-700' :
                connectionStatus === 'connecting' ? 'text-yellow-700' :
                connectionStatus === 'error' ? 'text-red-700' :
                'text-gray-600'
              }`}
            >
              {getConnectionStatusText()}
            </span>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Value */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <DollarSign className="h-5 w-5 text-gray-400 mr-1" aria-hidden="true" />
              <span className="text-sm font-medium text-gray-600">Total Value</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(summary.totalValue)}
            </div>
          </div>

          {/* Day Change */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              {isPositive && <TrendingUp className="h-5 w-5 text-green-500 mr-1" aria-hidden="true" />}
              {isNegative && <TrendingDown className="h-5 w-5 text-red-500 mr-1" aria-hidden="true" />}
              <span className="text-sm font-medium text-gray-600">Today's Change</span>
            </div>
            <div
              className={`text-2xl font-bold ${
                isPositive ? 'text-green-600' :
                isNegative ? 'text-red-600' :
                'text-gray-900'
              }`}
            >
              {formatCurrency(Math.abs(summary.dayChange))}
            </div>
            <div
              className={`text-sm ${
                isPositive ? 'text-green-600' :
                isNegative ? 'text-red-600' :
                'text-gray-600'
              }`}
            >
              {formatPercent(summary.dayChangePercent)}
            </div>
          </div>

          {/* Total Gain/Loss */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <span className="text-sm font-medium text-gray-600">Total Gain/Loss</span>
            </div>
            <div
              className={`text-2xl font-bold ${
                summary.totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {formatCurrency(Math.abs(summary.totalGainLoss))}
            </div>
            <div
              className={`text-sm ${
                summary.totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {formatPercent(summary.totalGainLossPercent)}
            </div>
          </div>

          {/* Performance Indicator */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <span className="text-sm font-medium text-gray-600">Performance</span>
            </div>
            <div className="text-2xl font-bold">
              {summary.dayChangePercent > 1 ? '🚀' :
               summary.dayChangePercent > 0 ? '📈' :
               summary.dayChangePercent < -1 ? '📉' : '➡️'}
            </div>
            <div className="text-sm text-gray-600">
              {summary.dayChangePercent > 1 ? 'Strong Growth' :
               summary.dayChangePercent > 0 ? 'Positive' :
               summary.dayChangePercent < -1 ? 'Declining' : 'Stable'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})

PortfolioSummary.displayName = 'PortfolioSummary'
```


```typescript
// components/portfolio/PortfolioDashboard.tsx
'use client'

import { Suspense, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw, Settings, Download } from 'lucide-react'
import { PortfolioErrorBoundary } from './PortfolioErrorBoundary'
import { PortfolioSkeleton } from './PortfolioSkeleton'
import { PortfolioSummary } from './PortfolioSummary'
import { HoldingRow } from './HoldingRow'
import { usePortfolioData } from '@/hooks/usePortfolioData'
import { useSmartPrefetch } from '@/hooks/useSmartPrefetch'

// Static shell component that can be pre-rendered
function PortfolioDashboardShell() {
  return (
    <div className="portfolio-dashboard max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Your Portfolio
            </h1>
            <p className="text-gray-600 mt-1">
              Track your investments and watch your wealth grow
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              aria-label="Portfolio settings"
            >
              <Settings className="h-4 w-4 mr-2" aria-hidden="true" />
              Settings
            </button>
            <button
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              aria-label="Export portfolio data"
            >
              <Download className="h-4 w-4 mr-2" aria-hidden="true" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* This section will be dynamically populated */}
      <Suspense fallback={<PortfolioSkeleton />}>
        <DynamicPortfolioContent />
      </Suspense>
    </div>
  )
}

// Dynamic content that fetches real-time data
function DynamicPortfolioContent() {
  const router = useRouter()
  const {
    holdings,
    summary,
    isLoading,
    error,
    connectionStatus,
    refetch
  } = usePortfolioData()

  // Smart prefetching for holding details
  const { prefetchRoute } = useSmartPrefetch({
    route: '/portfolio/holding-details',
    conditions: {
      userActivity: true,
      connectionQuality: 'fast'
    },
    invalidationStrategy: 'market-driven'
  })

  const handleHoldingClick = useCallback((holdingId: string) => {
    // Prefetch the holding details page
    prefetchRoute()

    // Navigate to holding details
    router.push(`/portfolio/holdings/${holdingId}`)
  }, [prefetchRoute, router])

  const handleRefresh = useCallback(async () => {
    try {
      await refetch()
    } catch (error) {
      console.error('Failed to refresh portfolio data:', error)
    }
  }, [refetch])

  if (error) {
    throw error // Will be caught by ErrorBoundary
  }

  if (isLoading && !holdings.length) {
    return <PortfolioSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Portfolio Summary */}
      {summary && (
        <PortfolioSummary
          summary={summary}
          connectionStatus={connectionStatus}
        />
      )}

      {/* Holdings List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Holdings ({holdings.length})
            </h2>
            <button
              onClick={handleRefresh}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              aria-label="Refresh portfolio data"
              disabled={isLoading}
            >
              <RefreshCw
                className={`h-4 w-4 mr-1.5 ${isLoading ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              Refresh
            </button>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {holdings.map((holding) => (
            <HoldingRow
              key={holding.id}
              holding={holding}
              onClick={() => handleHoldingClick(holding.id)}
            />
          ))}
        </div>

        {holdings.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">
              <p className="text-lg">No holdings found</p>
              <p className="text-sm mt-1">Start investing to build your portfolio</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Main component with error boundary
export default function PortfolioDashboard() {
  return (
    <PortfolioErrorBoundary>
      <PortfolioDashboardShell />
    </PortfolioErrorBoundary>
  )
}
```


```typescript
// app/portfolio/page.tsx (using PPR)
import { Suspense } from 'react'
import { Metadata } from 'next'
import PortfolioDashboard from '@/components/portfolio/PortfolioDashboard'
import { PortfolioSkeleton } from '@/components/portfolio/PortfolioSkeleton'

export const metadata: Metadata = {
  title: 'Your Portfolio | NAB Investment Platform',
  description: 'View and manage your investment portfolio with real-time market data and performance tracking.',
  keywords: 'portfolio, investments, stocks, NAB, real-time prices',
  robots: {
    index: false, // Portfolio pages shouldn't be indexed
    follow: false
  }
}

// Enable Partial Pre-rendering for this page
export const experimental_ppr = true

// Static shell that gets pre-rendered
function PortfolioPageShell() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="portfolio-layout">
        {/* Static navigation and header can be pre-rendered */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <img
                  src="/nab-logo.svg"
                  alt="NAB"
                  className="h-8 w-auto"
                />
                <nav className="ml-8 flex space-x-4">
                  <a
                    href="/portfolio"
                    className="text-blue-600 border-b-2 border-blue-600 px-3 py-2 text-sm font-medium"
                    aria-current="page"
                  >
                    Portfolio
                  </a>
                  <a
                    href="/markets"
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                  >
                    Markets
                  </a>
                  <a
                    href="/research"
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                  >
                    Research
                  </a>
                </nav>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic content area */}
        <Suspense fallback={<PortfolioSkeleton />}>
          <PortfolioDashboard />
        </Suspense>
      </div>
    </main>
  )
}

export default function PortfolioPage() {
  return <PortfolioPageShell />
}
```


```typescript
// app/api/portfolio/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    // Get user authorization
    const headersList = headers()
    const authorization = headersList.get('authorization')

    if (!authorization) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Simulate fetching portfolio data
    // In production, this would call your backend services
    const portfolioData = {
      holdings: [
        {
          id: '1',
          symbol: 'CBA',
          companyName: 'Commonwealth Bank of Australia',
          quantity: 100,
          currentPrice: 102.50,
          previousClose: 101.75,
          marketValue: 10250,
          dayChange: 75,
          dayChangePercent: 0.74,
          lastUpdated: new Date()
        },
        {
          id: '2',
          symbol: 'BHP',
          companyName: 'BHP Group Limited',
          quantity: 250,
          currentPrice: 45.20,
          previousClose: 44.85,
          marketValue: 11300,
          dayChange: 87.50,
          dayChangePercent: 0.78,
          lastUpdated: new Date()
        },
        {
          id: '3',
          symbol: 'CSL',
          companyName: 'CSL Limited',
          quantity: 50,
          currentPrice: 285.60,
          previousClose: 287.20,
          marketValue: 14280,
          dayChange: -80,
          dayChangePercent: -0.56,
          lastUpdated: new Date()
        }
      ],
      summary: {
        totalValue: 35830,
        dayChange: 82.50,
        dayChangePercent: 0.23,
        totalGainLoss: 3830,
        totalGainLossPercent: 11.97
      }
    }

    return NextResponse.json(portfolioData, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error) {
    console.error('Portfolio API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```


**Interviewer**: This is exceptional work! I'm particularly impressed with your error boundary implementation and the separation of concerns between static and dynamic content. Can you walk me through how the Partial Pre-rendering (PPR) works in this implementation and what specific benefits it provides for our users?


**Candidate**: Absolutely! The PPR implementation here is designed to give our NAB customers the **fastest possible perceived loading time** while maintaining real-time data accuracy. Let me break down exactly how it works and the benefits:


**PPR Architecture Overview:**


```typescript
// The PPR flow in our portfolio dashboard:

// 1. STATIC SHELL (Pre-rendered at build time)
// ├── HTML structure
// ├── Navigation header
// ├── Page layout
// ├── Loading skeletons
// └── CSS/JS assets

// 2. DYNAMIC CONTENT (Streamed at request time)
// ├── User-specific portfolio data
// ├── Real-time market prices
// ├── WebSocket connections
// └── Personalized content
```


**How PPR Works in Our Implementation:**


1. **Build Time Pre-rendering:**


```typescript
// During build, Next.js pre-renders the static shell
// This includes everything that's not user-specific:

// Static parts (pre-rendered):
- Navigation header with NAB branding
- Page layout and structure
- Loading skeletons
- Error boundaries
- CSS styling and JavaScript bundles

// Dynamic parts (deferred):
- Portfolio holdings data
- Real-time price updates
- User-specific summary
- WebSocket connections
```


1. **Request Time Streaming:**


```typescript
// When a user visits /portfolio:

// Immediate response (0ms): Static shell served from edge cache
const staticShell = `
  <html>
    <head><!-- Pre-loaded assets --></head>
    <body>
      <header><!-- NAB navigation --></header>
      <main>
        <div class="portfolio-skeleton">
          <!-- Loading indicators -->
        </div>
      </main>
    </body>
  </html>
`

// Parallel execution (streaming):
const dynamicContent = await Promise.all([
  fetchPortfolioData(userId),
  establishWebSocketConnection(),
  loadMarketData()
])

// Dynamic content streamed as ready
```


**Technical Implementation Details:**


```typescript
// next.config.js - PPR Configuration
module.exports = {
  experimental: {
    ppr: true,
    turbopackPersistentCaching: true,

    // PPR-specific optimizations
    pprCachingStrategy: 'aggressive',
    pprStreamingThreshold: 100, // Stream after 100ms
    pprFallbackStrategy: 'skeleton'
  },

  // Enable streaming for API routes
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
    responseLimit: false // Allow streaming responses
  }
}
```


```typescript
// Advanced PPR with Smart Caching
// app/portfolio/layout.tsx

import { Suspense } from 'react'

// This layout is pre-rendered and cached globally
export default function PortfolioLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="portfolio-layout">
      {/* Static header - pre-rendered */}
      <StaticHeader />

      {/* Dynamic content area */}
      <main className="main-content">
        <Suspense
          fallback={<PortfolioSkeleton />}
          // PPR boundary - everything inside streams
        >
          {children}
        </Suspense>
      </main>

      {/* Static footer - pre-rendered */}
      <StaticFooter />
    </div>
  )
}
```


**Performance Benefits Analysis:**


```typescript
// Performance metrics comparison:

// Without PPR (Traditional SSR):
const traditionalSSR = {
  timeToFirstByte: 800,      // Wait for all data
  firstContentfulPaint: 1200, // User sees content
  timeToInteractive: 2000,    // Page becomes interactive
  perceivedPerformance: 'Slow' // User waits 1.2s for content
}

// With PPR:
const pprPerformance = {
  timeToFirstByte: 50,       // Static shell from edge
  firstContentfulPaint: 100,  // Immediate visual feedback
  timeToInteractive: 300,     // Shell interactive quickly
  dynamicContentLoaded: 800,  // Real data streams in
  perceivedPerformance: 'Fast' // User sees progress immediately
}

// Improvement metrics:
const improvement = {
  fcp: (traditionalSSR.firstContentfulPaint - pprPerformance.firstContentfulPaint) / traditionalSSR.firstContentfulPaint * 100, // 91.7% faster FCP
  tti: (traditionalSSR.timeToInteractive - pprPerformance.timeToInteractive) / traditionalSSR.timeToInteractive * 100, // 85% faster TTI
  userExperience: 'Dramatically improved perceived performance'
}
```


**Smart Caching Strategy:**


```typescript
// lib/ppr-cache-strategy.ts
export class PPRCacheStrategy {
  private static readonly CACHE_KEYS = {
    STATIC_SHELL: 'portfolio:shell:v1',
    USER_DATA: 'portfolio:user:',
    MARKET_DATA: 'portfolio:market:'
  }

  static async getStaticShell() {
    // Static shell cached indefinitely until deployment
    return await cache.get(this.CACHE_KEYS.STATIC_SHELL, {
      ttl: Infinity, // Cache until invalidated by deployment
      tags: ['static-shell', 'portfolio-layout']
    })
  }

  static async getUserData(userId: string) {
    // User data cached with shorter TTL
    return await cache.get(`${this.CACHE_KEYS.USER_DATA}${userId}`, {
      ttl: 300, // 5 minutes
      tags: [`user-${userId}`, 'portfolio-data'],
      revalidateOnStale: true // Serve stale while revalidating
    })
  }

  static async getMarketData(symbols: string[]) {
    // Market data cached very briefly
    const cacheKey = `${this.CACHE_KEYS.MARKET_DATA}${symbols.join(',')}`
    return await cache.get(cacheKey, {
      ttl: 30, // 30 seconds
      tags: ['market-data', ...symbols],
      backgroundRefresh: true // Always fresh data
    })
  }

  static async invalidateUserCache(userId: string) {
    await cache.invalidate([`user-${userId}`])
  }

  static async invalidateMarketCache(symbols: string[]) {
    await cache.invalidate(['market-data', ...symbols])
  }
}
```


**Real-time Integration with PPR:**


```typescript
// components/portfolio/PPRWebSocketIntegration.tsx
export function PPRWebSocketIntegration({ children }: { children: React.ReactNode }) {
  const [isShellReady, setIsShellReady] = useState(false)
  const [socketConnection, setSocketConnection] = useState<WebSocket | null>(null)

  useEffect(() => {
    // Mark shell as ready after hydration
    setIsShellReady(true)

    // Initialize WebSocket only after shell is ready
    const ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL!)

    ws.onopen = () => {
      console.log('WebSocket connected post-PPR')
      setSocketConnection(ws)
    }

    return () => {
      ws.close()
    }
  }, [])

  return (
    <WebSocketContext.Provider value={socketConnection}>
      {children}
    </WebSocketContext.Provider>
  )
}
```


**Edge Case Handling:**


```typescript
// lib/ppr-error-handling.ts
export class PPRErrorHandler {
  static handleStaticShellError(error: Error) {
    // If static shell fails, fallback to full SSR
    console.error('PPR static shell failed:', error)

    return {
      fallback: 'ssr',
      reason: 'static-shell-error',
      timestamp: Date.now()
    }
  }

  static handleDynamicContentError(error: Error) {
    // If dynamic content fails, show error in shell
    console.error('PPR dynamic content failed:', error)

    return {
      fallback: 'error-boundary',
      showStaleData: true,
      retryStrategy: 'exponential-backoff'
    }
  }

  static handlePartialFailure(failedComponents: string[]) {
    // Some dynamic components failed, others succeeded
    return {
      strategy: 'graceful-degradation',
      failedComponents,
      successfulComponents: ['summary', 'navigation'],
      userMessage: 'Some portfolio data is temporarily unavailable'
    }
  }
}
```


**User Experience Benefits:**


1. **Immediate Visual Feedback** (100ms vs 1200ms):

Users see the NAB portfolio interface instantly
Professional loading states instead of blank screens
Reduced perceived wait time by 91%
2. **Progressive Loading**:

Portfolio summary loads first (most important)
Individual holdings stream in as available
Real-time prices update seamlessly
3. **Better Error Handling**:

If market data fails, static portfolio structure still works
Graceful degradation instead of complete page failure
Users can still access account navigation and settings
4. **Mobile Performance**:

Critical for NAB mobile app users
Reduced data usage (static shell cached)
Better performance on slower connections
5. **SEO Benefits** (for public pages):

Search engines see structured content immediately
Better Core Web Vitals scores
Improved accessibility metrics


**Financial Impact for NAB:**


```typescript
// Business metrics improvement:
const businessImpact = {
  userEngagement: {
    bounceRate: '-23%',    // Users less likely to leave
    sessionDuration: '+15%', // More time exploring portfolio
    pageViews: '+8%'       // Better navigation experience
  },

  technicalMetrics: {
    serverLoad: '-40%',     // Less compute for static shells
    bandwidth: '-30%',      // Cached static assets
    errorRate: '-50%',      // Better error boundaries
    mobilePerformance: '+60%' // Faster mobile experience
  },

  customerSatisfaction: {
    nps: '+12 points',      // Faster perceived performance
    appStoreRating: '+0.3', // Better user reviews
    supportTickets: '-20%'  // Fewer performance complaints
  }
}
```


This PPR implementation gives NAB customers a **premium digital banking experience** where they see their portfolio interface immediately while real-time financial data streams in seamlessly. It's particularly powerful for mobile users who expect instant responsiveness from their banking apps.


**Interviewer**: Brilliant implementation! Your understanding of both the technical architecture and business impact is exactly what we look for in a senior engineer. Let me ask one final challenging question: How would you approach monitoring and optimizing this system in production, especially given the financial regulatory requirements we have at NAB?


**Candidate**: Excellent question! Monitoring a **financial services application** requires a much more comprehensive approach than typical web applications. We need to balance **performance optimization** with **regulatory compliance**, **security monitoring**, and **financial data integrity**. Let me outline a production-grade monitoring and optimization strategy:


## Production Monitoring Architecture


```typescript
// lib/monitoring/financial-monitoring.ts
interface FinancialMetrics {
  // Performance metrics
  portfolioLoadTime: number
  priceUpdateLatency: number
  webSocketConnectionHealth: string

  // Business metrics
  portfolioValueAccuracy: number
  priceDataFreshness: number
  transactionIntegrity: boolean

  // Compliance metrics
  dataRetentionCompliance: boolean
  accessControlViolations: number
  auditTrailCompleteness: number

  // Security metrics
  suspiciousActivityDetected: boolean
  encryptionStatus: string
  authenticationFailures: number
}

class FinancialMonitoringService {
  private metrics: FinancialMetrics[] = []
  private alertThresholds = {
    portfolioLoadTime: 2000, // 2 seconds max
    priceDataAge: 30000, // 30 seconds max staleness
    accuracyThreshold: 0.9999, // 99.99% accuracy required
    securityViolationLimit: 0 // Zero tolerance
  }

  async trackPortfolioAccess(userId: string, portfolioData: any) {
    const startTime = performance.now()

    try {
      // 1. Audit trail for compliance
      await this.createAuditEntry({
        userId,
        action: 'portfolio_access',
        timestamp: new Date(),
        ipAddress: this.getClientIP(),
        userAgent: this.getUserAgent(),
        dataAccessed: this.sanitizeForAudit(portfolioData)
      })

      // 2. Data integrity validation
      const integrityCheck = await this.validatePortfolioIntegrity(portfolioData)
      if (!integrityCheck.valid) {
        await this.escalateDataIntegrityIssue(userId, integrityCheck.errors)
      }

      // 3. Performance tracking
      const loadTime = performance.now() - startTime
      await this.recordPerformanceMetric('portfolio_load_time', loadTime, userId)

      // 4. Regulatory compliance check
      await this.verifyComplianceRequirements(userId, portfolioData)

    } catch (error) {
      await this.handleMonitoringError(error, userId)
    }
  }

  private async validatePortfolioIntegrity(portfolioData: any) {
    const checks = [
      this.validatePriceDataConsistency,
      this.checkCalculationAccuracy,
      this.verifyMarketValueCalculations,
      this.validateTimestamps
    ]

    const results = await Promise.all(
      checks.map(check => check.call(this, portfolioData))
    )

    return {
      valid: results.every(r => r.valid),
      errors: results.filter(r => !r.valid).map(r => r.error)
    }
  }

  private async validatePriceDataConsistency(portfolioData: any) {
    // Cross-reference with multiple market data sources
    for (const holding of portfolioData.holdings) {
      const externalPrice = await this.fetchExternalPrice(holding.symbol)
      const priceDifference = Math.abs(holding.currentPrice - externalPrice) / externalPrice

      if (priceDifference > 0.001) { // 0.1% tolerance
        return {
          valid: false,
          error: `Price inconsistency for ${holding.symbol}: ${priceDifference * 100}% difference`
        }
      }
    }

    return { valid: true }
  }
}
```


## Comprehensive Alerting System


```typescript
// lib/monitoring/alerting-system.ts
interface AlertSeverity {
  CRITICAL: 'CRITICAL'    // Financial data integrity, security breaches
  HIGH: 'HIGH'           // Performance degradation, accuracy issues
  MEDIUM: 'MEDIUM'       // Compliance warnings, minor errors
  LOW: 'LOW'             // Optimization opportunities
}

class FinancialAlertingSystem {
  private channels = {
    immediate: ['pagerduty', 'slack-critical', 'sms'],
    urgent: ['slack-alerts', 'email-oncall'],
    standard: ['email-team', 'dashboard']
  }

  async processAlert(alert: {
    severity: keyof AlertSeverity
    category: 'security' | 'compliance' | 'performance' | 'data-integrity'
    message: string
    context: any
    userId?: string
  }) {
    // 1. Immediate escalation for critical financial issues
    if (alert.severity === 'CRITICAL') {
      await this.escalateCriticalAlert(alert)
    }

    // 2. Compliance-specific handling
    if (alert.category === 'compliance') {
      await this.notifyComplianceTeam(alert)
      await this.createComplianceIncident(alert)
    }

    // 3. Security incident response
    if (alert.category === 'security') {
      await this.initiateSecurityResponse(alert)
    }

    // 4. Data integrity issues
    if (alert.category === 'data-integrity') {
      await this.freezeAffectedAccounts(alert)
      await this.escalateToDataTeam(alert)
    }
  }

  private async escalateCriticalAlert(alert: any) {
    // Multiple notification channels for critical issues
    await Promise.all([
      this.sendPagerDutyAlert(alert),
      this.sendSlackCriticalAlert(alert),
      this.sendSMSToOnCall(alert),
      this.createJiraIncident(alert),
      this.updateStatusPage(alert)
    ])

    // Auto-escalation if not acknowledged within 5 minutes
    setTimeout(async () => {
      const acknowledged = await this.checkAlertAcknowledgment(alert.id)
      if (!acknowledged) {
        await this.escalateToManagement(alert)
      }
    }, 5 * 60 * 1000)
  }
}
```


## Real-time Performance Monitoring


```typescript
// lib/monitoring/performance-monitor.ts
class RealTimePerformanceMonitor {
  private performanceObserver: PerformanceObserver
  private metrics: Map<string, number[]> = new Map()

  constructor() {
    this.initializePerformanceObserver()
    this.startRealTimeMetrics()
  }

  private initializePerformanceObserver() {
    this.performanceObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        this.processPerformanceEntry(entry)
      })
    })

    this.performanceObserver.observe({
      entryTypes: ['navigation', 'resource', 'measure', 'paint']
    })
  }

  private async processPerformanceEntry(entry: PerformanceEntry) {
    const metric = {
      name: entry.name,
      duration: entry.duration || 0,
      startTime: entry.startTime,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent
    }

    // Critical performance thresholds for financial applications
    const thresholds = {
      'portfolio-load': 2000,        // 2s max portfolio load
      'price-update': 100,           // 100ms max price update
      'websocket-latency': 50,       // 50ms max WebSocket latency
      'first-contentful-paint': 800  // 800ms max FCP
    }

    // Check against thresholds
    const threshold = thresholds[entry.name]
    if (threshold && metric.duration > threshold) {
      await this.reportPerformanceViolation(metric, threshold)
    }

    // Store for trend analysis
    this.storeMetric(entry.name, metric.duration)

    // Real-time dashboard updates
    await this.updateRealTimeDashboard(metric)
  }

  private async reportPerformanceViolation(metric: any, threshold: number) {
    const violation = {
      type: 'performance_threshold_exceeded',
      metric: metric.name,
      actual: metric.duration,
      threshold,
      severity: this.calculateSeverity(metric.duration, threshold),
      context: {
        url: metric.url,
        userAgent: metric.userAgent,
        timestamp: metric.timestamp
      }
    }

    // Immediate action for severe violations
    if (violation.severity === 'CRITICAL') {
      await this.triggerAutoScaling()
      await this.enablePerformanceMode()
    }

    // Report to monitoring systems
    await Promise.all([
      this.sendToDatadog(violation),
      this.sendToNewRelic(violation),
      this.updatePerformanceDashboard(violation)
    ])
  }

  private calculateSeverity(actual: number, threshold: number): string {
    const ratio = actual / threshold
    if (ratio > 3) return 'CRITICAL'
    if (ratio > 2) return 'HIGH'
    if (ratio > 1.5) return 'MEDIUM'
    return 'LOW'
  }
}
```


## Financial Data Integrity Monitoring


```typescript
// lib/monitoring/data-integrity-monitor.ts
class DataIntegrityMonitor {
  private integrityChecks = new Map<string, number>()

  async validateFinancialCalculations(portfolioData: any) {
    const validations = await Promise.all([
      this.validateMarketValueCalculations(portfolioData),
      this.validatePercentageCalculations(portfolioData),
      this.validateCurrencyPrecision(portfolioData),
      this.validateTimestampConsistency(portfolioData),
      this.crossReferenceMarketData(portfolioData)
    ])

    const failures = validations.filter(v => !v.valid)

    if (failures.length > 0) {
      await this.handleIntegrityFailures(failures, portfolioData)
    }

    // Record integrity score
    const integrityScore = (validations.length - failures.length) / validations.length
    await this.recordIntegrityScore(integrityScore, portfolioData.userId)

    return {
      valid: failures.length === 0,
      score: integrityScore,
      failures
    }
  }

  private async validateMarketValueCalculations(portfolioData: any) {
    for (const holding of portfolioData.holdings) {
      const expectedValue = holding.quantity * holding.currentPrice
      const actualValue = holding.marketValue
      const tolerance = 0.01 // 1 cent tolerance

      if (Math.abs(expectedValue - actualValue) > tolerance) {
        return {
          valid: false,
          error: `Market value calculation error for ${holding.symbol}`,
          expected: expectedValue,
          actual: actualValue,
          difference: Math.abs(expectedValue - actualValue)
        }
      }
    }

    return { valid: true }
  }

  private async validateCurrencyPrecision(portfolioData: any) {
    // Financial regulations require specific decimal precision
    const requiredPrecision = 2 // AUD requires 2 decimal places

    for (const holding of portfolioData.holdings) {
      const values = [
        holding.currentPrice,
        holding.marketValue,
        holding.dayChange
      ]

      for (const value of values) {
        const decimalPlaces = (value.toString().split('.')[1] || '').length
        if (decimalPlaces > requiredPrecision) {
          return {
            valid: false,
            error: `Excessive decimal precision for ${holding.symbol}`,
            value,
            actualPrecision: decimalPlaces,
            requiredPrecision
          }
        }
      }
    }

    return { valid: true }
  }

  private async crossReferenceMarketData(portfolioData: any) {
    // Validate against multiple authoritative sources
    const sources = [
      'ASX', // Australian Securities Exchange
      'Reuters',
      'Bloomberg'
    ]

    for (const holding of portfolioData.holdings) {
      const externalPrices = await Promise.all(
        sources.map(source => this.fetchPriceFromSource(holding.symbol, source))
      )

      const averagePrice = externalPrices.reduce((sum, price) => sum + price, 0) / externalPrices.length
      const variance = Math.abs(holding.currentPrice - averagePrice) / averagePrice

      if (variance > 0.005) { // 0.5% variance threshold
        return {
          valid: false,
          error: `Price variance exceeds threshold for ${holding.symbol}`,
          portfolioPrice: holding.currentPrice,
          marketAverage: averagePrice,
          variance: variance * 100
        }
      }
    }

    return { valid: true }
  }
}
```


## Compliance and Audit Monitoring


```typescript
// lib/monitoring/compliance-monitor.ts
class ComplianceMonitor {
  private auditLog: AuditEntry[] = []

  async trackUserActivity(activity: {
    userId: string
    action: string
    resource: string
    timestamp: Date
    ipAddress: string
    outcome: 'success' | 'failure'
    details?: any
  }) {
    // 1. Create detailed audit entry
    const auditEntry: AuditEntry = {
      id: generateUUID(),
      userId: activity.userId,
      action: activity.action,
      resource: activity.resource,
      timestamp: activity.timestamp,
      ipAddress: this.hashIP(activity.ipAddress), // Privacy compliance
      outcome: activity.outcome,
      sessionId: this.getCurrentSessionId(),
      userAgent: this.sanitizeUserAgent(),
      details: this.sanitizeDetails(activity.details)
    }

    // 2. Store in immutable audit log
    await this.storeAuditEntry(auditEntry)

    // 3. Real-time compliance checks
    await this.checkComplianceViolations(auditEntry)

    // 4. Regulatory reporting
    if (this.requiresRegulatoryReporting(activity.action)) {
      await this.scheduleRegulatoryReport(auditEntry)
    }
  }

  private async checkComplianceViolations(auditEntry: AuditEntry) {
    const violations = []

    // Check access pattern anomalies
    const recentAccess = await this.getRecentUserActivity(auditEntry.userId, 3600000) // 1 hour
    if (this.detectAnomalousAccess(recentAccess)) {
      violations.push('anomalous_access_pattern')
    }

    // Check data retention compliance
    if (await this.violatesDataRetention(auditEntry)) {
      violations.push('data_retention_violation')
    }

    // Check geographic restrictions
    if (await this.violatesGeographicRestrictions(auditEntry)) {
      violations.push('geographic_restriction_violation')
    }

    if (violations.length > 0) {
      await this.escalateComplianceViolations(auditEntry, violations)
    }
  }

  private async escalateComplianceViolations(auditEntry: AuditEntry, violations: string[]) {
    const incident = {
      id: generateUUID(),
      severity: 'HIGH',
      type: 'compliance_violation',
      userId: auditEntry.userId,
      violations,
      timestamp: new Date(),
      requiresImmediate: violations.some(v =>
        ['data_breach', 'unauthorized_access', 'geographic_restriction_violation'].includes(v)
      )
    }

    // Immediate response for serious violations
    if (incident.requiresImmediate) {
      await this.freezeUserSession(auditEntry.userId)
      await this.notifySecurityTeam(incident)
      await this.initiateIncidentResponse(incident)
    }

    // Report to compliance systems
    await Promise.all([
      this.reportToAustrac(incident), // Australian financial intelligence unit
      this.reportToApra(incident),    // Australian Prudential Regulation Authority
      this.reportToAsic(incident),    // Australian Securities and Investments Commission
      this.updateComplianceDashboard(incident)
    ])
  }
}
```


## Optimization Strategies


```typescript
// lib/optimization/performance-optimizer.ts
class PerformanceOptimizer {
  private optimizationRules = new Map<string, OptimizationRule>()

  constructor() {
    this.initializeOptimizationRules()
    this.startContinuousOptimization()
  }

  private initializeOptimizationRules() {
    // Rule 1: Dynamic resource allocation
    this.optimizationRules.set('dynamic_scaling', {
      condition: (metrics) => metrics.responseTime > 1000,
      action: async () => {
        await this.scaleServerInstances()
        await this.enableCDNCaching()
      },
      priority: 'HIGH'
    })

    // Rule 2: Database query optimization
    this.optimizationRules.set('query_optimization', {
      condition: (metrics) => metrics.dbQueryTime > 500,
      action: async () => {
        await this.optimizeSlowQueries()
        await this.updateIndexes()
      },
      priority: 'MEDIUM'
    })

    // Rule 3: Cache warming
    this.optimizationRules.set('cache_warming', {
      condition: (metrics) => metrics.cacheHitRate < 0.8,
      action: async () => {
        await this.warmCriticalCaches()
        await this.preloadFrequentData()
      },
      priority: 'MEDIUM'
    })
  }

  async analyzeAndOptimize(metrics: PerformanceMetrics) {
    const applicableRules = Array.from(this.optimizationRules.values())
      .filter(rule => rule.condition(metrics))
      .sort((a, b) => this.getPriority(a.priority) - this.getPriority(b.priority))

    for (const rule of applicableRules) {
      try {
        await rule.action()
        await this.recordOptimizationAction(rule, metrics)
      } catch (error) {
        await this.handleOptimizationError(rule, error)
      }
    }
  }

  private async warmCriticalCaches() {
    // Pre-load frequently accessed portfolio data
    const popularSymbols = await this.getPopularSymbols()
    await Promise.all([
      this.preloadMarketData(popularSymbols),
      this.preloadUserPreferences(),
      this.preloadStaticAssets()
    ])
  }

  private async optimizeSlowQueries() {
    const slowQueries = await this.identifySlowQueries()

    for (const query of slowQueries) {
      // Analyze query execution plan
      const executionPlan = await this.analyzeQueryPlan(query)

      // Apply optimizations
      if (executionPlan.missingIndexes.length > 0) {
        await this.createOptimalIndexes(executionPlan.missingIndexes)
      }

      if (executionPlan.inefficientJoins.length > 0) {
        await this.optimizeJoins(executionPlan.inefficientJoins)
      }
    }
  }
}
```


## Production Deployment Strategy


```typescript
// scripts/production-deployment.ts
class ProductionDeploymentManager {
  async deployWithMonitoring() {
    const deployment = {
      id: generateDeploymentId(),
      timestamp: new Date(),
      version: process.env.VERSION,
      environment: 'production'
    }

    try {
      // 1. Pre-deployment checks
      await this.runPreDeploymentChecks()

      // 2. Blue-green deployment with monitoring
      await this.initiateBlueGreenDeployment(deployment)

      // 3. Gradual traffic shifting with health checks
      await this.gradualTrafficShift(deployment)

      // 4. Post-deployment validation
      await this.validateDeployment(deployment)

      // 5. Monitoring setup for new version
      await this.setupVersionSpecificMonitoring(deployment)

    } catch (error) {
      await this.rollbackDeployment(deployment, error)
      throw error
    }
  }

  private async runPreDeploymentChecks() {
    const checks = [
      this.validateSecurityScans(),
      this.validatePerformanceTests(),
      this.validateComplianceChecks(),
      this.validateDataMigrations(),
      this.validateBackupStrategies()
    ]

    const results = await Promise.all(checks)
    const failures = results.filter(r => !r.passed)

    if (failures.length > 0) {
      throw new Error(`Pre-deployment checks failed: ${failures.map(f => f.reason).join(', ')}`)
    }
  }

  private async gradualTrafficShift(deployment: any) {
    const phases = [
      { percentage: 5, duration: 300000 },   // 5% for 5 minutes
      { percentage: 25, duration: 600000 },  // 25% for 10 minutes
      { percentage: 50, duration: 900000 },  // 50% for 15 minutes
      { percentage: 100, duration: 0 }       // 100%
    ]

    for (const phase of phases) {
      await this.shiftTraffic(deployment, phase.percentage)

      // Intensive monitoring during shift
      const healthCheck = await this.monitorPhaseHealth(phase.duration)

      if (!healthCheck.healthy) {
        await this.rollbackDeployment(deployment, healthCheck.issues)
        throw new Error(`Health check failed during ${phase.percentage}% phase`)
      }
    }
  }

  private async monitorPhaseHealth(duration: number): Promise<{healthy: boolean, issues: any[]}> {
    const monitoringInterval = 10000 // 10 seconds
    const endTime = Date.now() + duration
    const issues: any[] = []

    while (Date.now() < endTime) {
      const healthMetrics = await this.collectHealthMetrics()

      // Critical health indicators
      if (healthMetrics.errorRate > 0.01) { // 1% error rate threshold
        issues.push(`High error rate: ${healthMetrics.errorRate * 100}%`)
      }

      if (healthMetrics.responseTime > 2000) { // 2 second response time threshold
        issues.push(`Slow response time: ${healthMetrics.responseTime}ms`)
      }

      if (healthMetrics.portfolioDataAccuracy < 0.9999) { // 99.99% accuracy threshold
        issues.push(`Data accuracy below threshold: ${healthMetrics.portfolioDataAccuracy * 100}%`)
      }

      if (issues.length > 0) {
        return { healthy: false, issues }
      }

      await new Promise(resolve => setTimeout(resolve, monitoringInterval))
    }

    return { healthy: true, issues: [] }
  }
}
```


This monitoring and optimization strategy ensures that our NAB portfolio dashboard maintains **financial-grade reliability** while providing optimal performance for our customers. The combination of **real-time monitoring**, **automated optimization**, and **regulatory compliance** creates a robust production system that can handle the demands of financial services while meeting all audit and security requirements.


**Interviewer**: Outstanding! Your comprehensive approach to production monitoring, especially the financial compliance and data integrity aspects, demonstrates exactly the level of sophisticated thinking we need at NAB. You've covered everything from real-time performance monitoring to regulatory reporting requirements.


This has been an exceptional interview. Your technical depth, understanding of modern React/Next.js patterns, and especially your grasp of the unique requirements in financial services make you a strong candidate for our Senior Frontend Engineer role.


Do you have any questions about the role, our tech stack, or the team structure here at NAB?


**Candidate**: Thank you so much, Sarah! This has been a fantastic conversation, and I'm really excited about the opportunity to contribute to NAB's frontend engineering team. The technical challenges we've discussed - from Turbopack optimization to financial compliance monitoring - are exactly the kind of complex, high-impact problems I'm passionate about solving.


I do have a few questions:


**Team Structure & Collaboration:**
What does the typical collaboration look like between frontend engineers and other teams like DevOps, Security, and Compliance? Given the regulatory environment, I imagine there's significant cross-functional coordination.


**Technology Adoption:**
How does NAB approach adopting cutting-edge technologies like Turbopack or new React features? Is there a formal evaluation process, and how do you balance innovation with the stability requirements of financial services?


**Performance & Scale:**
Could you share more about the current scale we're operating at - concurrent users, transaction volumes, that sort of thing? And what are the biggest performance challenges the team is currently working on?


**Professional Development:**
What opportunities are there for growth and learning? Are there conference budgets, internal tech talks, or opportunities to contribute to open source projects?


**Team Culture:**
Finally, what do you enjoy most about working on the frontend team at NAB, and what advice would you give to someone joining the team?


I'm really looking forward to potentially joining the team and contributing to building world-class financial technology that millions of Australians depend on every day.


---


## Interview Summary & Evaluation


**Technical Excellence: ⭐⭐⭐⭐⭐**


- Demonstrated deep understanding of Next.js 15.4 and Turbopack
- Comprehensive knowledge of React ecosystem (React Query, WebSockets, state management)
- Production-ready code with proper error handling and performance optimization
- Understanding of advanced concepts like PPR, streaming, and caching strategies


**Problem Solving: ⭐⭐⭐⭐⭐**


- Systematic approach to architectural decisions
- Excellent trade-off analysis between performance, security, and maintainability
- Creative solutions for real-time data challenges in financial applications
- Comprehensive monitoring and optimization strategies


**Communication: ⭐⭐⭐⭐⭐**


- Clear explanations of complex technical concepts
- Excellent use of code examples and diagrams
- Strong business context understanding
- Professional presentation of solutions


**Innovation & Forward Thinking: ⭐⭐⭐⭐⭐**


- Early adoption and understanding of Turbopack's production readiness
- Creative integration of new Next.js 15.4 features
- Comprehensive approach to financial services requirements
- Proactive thinking about monitoring and optimization


**NAB Cultural Fit: ⭐⭐⭐⭐⭐**


- Strong understanding of financial services requirements
- Emphasis on security, compliance, and data integrity
- Focus on customer experience and reliability
- Professional approach to complex enterprise challenges


**Recommendation: STRONG HIRE - L6 Senior Frontend Engineer**


*This candidate demonstrates exceptional technical depth, practical experience, and the sophisticated thinking required for senior-level challenges at NAB. Their understanding of modern frontend technologies combined with financial services expertise makes them an ideal fit for our team.*
