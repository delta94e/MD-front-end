# Senior Front-End Engineer Interview - Technical Deep Dive

## React & Next.js Focus

---

**Interviewer:** Thanks for joining us today. I'm Sarah, I lead the front-end architecture team here. I'd like to dive deep into some React and Next.js concepts with you. Let's start with something fundamental but often misunderstood - can you walk me through how React Hooks changed the way we think about component lifecycle, specifically with useEffect and useLayoutEffect?

**Candidate:** Absolutely. So when Hooks were introduced, they fundamentally shifted our mental model from lifecycle methods to synchronization with external systems. The key difference between useEffect and useLayoutEffect really comes down to timing and what you're trying to accomplish.

useEffect runs asynchronously after React has committed changes to the DOM and the browser has had a chance to paint. This is perfect for side effects that don't need to block the visual update - things like data fetching, setting up subscriptions, or logging analytics events. The browser can show users the updated UI immediately while the effect runs in the background.

useLayoutEffect, on the other hand, fires synchronously after DOM mutations but before the browser paints. This means it blocks the visual update, which sounds bad, but it's actually crucial when you need to measure DOM elements or make synchronous DOM changes to prevent visual flickering.

**Interviewer:** Interesting. Can you give me a concrete example where using useEffect would cause a visual bug that useLayoutEffect would solve?

**Candidate:** Sure, great question. Imagine you're building a tooltip component that needs to position itself relative to a trigger element. If you use useEffect to measure the trigger's position and update the tooltip's position, here's what happens: React renders the tooltip at position zero-zero, the browser paints it in the wrong place, then your effect runs, measures the trigger, calculates the correct position, and updates. The user sees a flicker as the tooltip jumps from the initial wrong position to the correct one.

With useLayoutEffect, you measure and position before the browser paints, so the tooltip appears in the correct position immediately. The tradeoff is that your JavaScript blocks painting for those few milliseconds, but that's better than a visual glitch.

**Interviewer:** Good. Now let's talk about performance optimization. When would you reach for React.memo versus useMemo, and how do you decide when the optimization is actually worth it?

**Candidate:** This is where developers often over-optimize, actually. React.memo is a higher-order component that memoizes the entire component - it prevents re-renders when props haven't changed based on shallow comparison. useMemo is a hook that memoizes a computed value within a component.

The decision framework I use is: React.memo is for preventing expensive renders of child components, while useMemo is for expensive calculations within a component that don't need to rerun on every render. But here's the critical part - both have overhead. React.memo adds comparison logic on every render of the parent, and useMemo adds memory overhead and comparison logic.

I only reach for these when I've measured an actual performance problem. If a component is rendering in under sixteen milliseconds, optimizing it probably won't provide noticeable improvement. I use React DevTools Profiler to identify components that are rendering frequently and taking significant time, then apply optimizations strategically.

**Interviewer:** Let's say you've identified a component that's rendering too often. Walk me through your optimization strategy beyond just wrapping it in React.memo.

**Candidate:** Right, so React.memo alone often isn't enough because of how JavaScript handles reference equality. Even if you wrap a component in React.memo, if you're passing object literals, arrays, or functions as props, those create new references on every parent render, breaking memoization.

My strategy usually goes like this: First, I audit the props. Are we passing inline objects or arrays? Those need to be memoized with useMemo. Are we passing callback functions? Those need useCallback with proper dependencies.

Second, I look at state structure. Sometimes the real problem is that state is too high up in the component tree, causing unnecessary renders of subtrees that don't care about that state. Pushing state down or using Context more strategically can eliminate the render problem entirely.

Third, I consider whether the component should be split. If only part of a component needs to re-render based on certain props, I'll extract that part into its own component. The classic example is a large form where only the field being edited should re-render, not the entire form.

**Interviewer:** Good thinking about state location. Let's shift to Next.js since you'll be working extensively with it here. Can you explain the difference between getStaticProps, getServerSideProps, and the new App Router's server components? When would you choose each?

**Candidate:** This has evolved significantly with Next.js thirteen and fourteen. In the Pages Router, getStaticProps runs at build time to generate static HTML, which is perfect for content that doesn't change often - blog posts, marketing pages, documentation. You get incredible performance because you're serving pre-rendered HTML from a CDN. The tradeoff is that you need to rebuild to update content, though Incremental Static Regeneration helps with that.

getServerSideProps runs on every request on the server, so you get fresh data every time but sacrifice some performance. I'd use this for authenticated pages, dashboards with real-time data, or any content that's highly personalized and can't be cached.

The App Router with Server Components changes this paradigm significantly. Components are server components by default, which means they run on the server and send minimal JavaScript to the client. You can fetch data directly in these components without special functions. This is powerful because you're not shipping the data fetching logic to the client, you can access backend resources directly, and the data fetching can be parallelized and deduplicated automatically.

**Interviewer:** How do you handle the hydration mismatch issues that sometimes occur with server-side rendering, especially when dealing with things like timestamps or user-specific data?

**Candidate:** Hydration mismatches are one of the trickiest SSR issues. They happen when the HTML rendered on the server doesn't match what React renders on the client during hydration. The classic culprit is anything that's different between server and client environments - timestamps, random IDs, browser-only APIs.

My approach is prevention first. For timestamps, I avoid rendering them during SSR if they're based on the client's timezone. Instead, I render them client-side only using a useEffect with a state flag, or I render a placeholder during SSR and update it after hydration.

For user-specific data from localStorage or cookies, I use a similar pattern - render a neutral state on the server, then update after hydration. In Next.js App Router, you can use the 'use client' directive strategically to move just the problematic components to client-side rendering.

The suppressHydrationWarning prop exists for cases where a mismatch is intentional and safe, like timestamps, but I'm cautious with it because it can hide real bugs.

**Interviewer:** Let's talk about data fetching patterns. How would you architect data fetching in a complex Next.js application with multiple levels of components that need data, considering both performance and maintainability?

**Candidate:** This is where architecture decisions really matter. In the App Router, I lean heavily on server components for the initial data fetch because they can fetch in parallel at the layout and page level. For example, a dashboard might have a layout fetching user permissions and a page fetching dashboard data simultaneously.

For client-side data fetching, I use a combination of strategies. For data that updates frequently or needs to be real-time, I implement SWR or React Query. These libraries give you caching, revalidation, optimistic updates, and request deduplication out of the box. The key is setting appropriate cache times - for user data that rarely changes, maybe five minutes, for volatile data like stock prices, maybe five seconds.

For globally needed data, I consider the Context API combined with server components for the initial data and client-side libraries for updates. But I'm careful not to put too much in Context because every context update re-renders all consumers.

One pattern I've found effective is to fetch at the highest necessary level and pass data down explicitly as props when the component tree is shallow, but use Context or a state management library when you're prop-drilling through multiple levels.

**Interviewer:** What about error boundaries and error handling in this data fetching architecture?

**Candidate:** Error handling needs to be layered. For server components, Next.js provides error.js and loading.js file conventions that create automatic boundaries. These are great for page-level errors. But I also implement granular error boundaries around specific features so that if one widget on a dashboard fails, the rest still works.

For async data fetching with libraries like SWR, I handle errors in the component with the error state from the hook, providing fallback UI or retry mechanisms. The key is thinking about what the user can do - if it's a critical error, show an error page with support contact info. If it's a non-critical feature, show a fallback and a retry button.

I also implement error logging to services like Sentry, capturing not just the error but the context - what data was being fetched, what user actions led there, browser and network information. This makes debugging production issues much faster.

**Interviewer:** Speaking of production issues, how do you approach bundle size optimization in Next.js? What's your strategy?

**Candidate:** Bundle size directly impacts Time to Interactive, so it's critical. Next.js does a lot automatically - automatic code splitting per page, tree shaking in production builds, script optimization. But there's more I do proactively.

First, I audit dependencies regularly. The webpack-bundle-analyzer plugin shows you what's taking up space. Often you'll find massive libraries imported for one function - I've seen projects importing all of lodash when they only needed three functions. Switching to lodash-es and importing just what you need can save hundreds of kilobytes.

Second, dynamic imports for non-critical features. If you have a modal with a rich text editor that only shows when users click a button, lazy load it with next/dynamic. The user won't wait for that code on initial page load.

Third, for heavy libraries that are needed but not immediately, I use next/script with the lazyOnload strategy. Analytics scripts, chat widgets, these can load after the page is interactive.

Fourth, image optimization is huge. Next.js Image component handles this well, but you need to set proper sizes and use modern formats like WebP with fallbacks.

**Interviewer:** Let's go deeper on Next.js Image. What's happening under the hood, and what gotchas have you encountered?

**Candidate:** The Image component is actually quite sophisticated. When you use it, Next.js creates an image optimization API route that serves optimized images on-demand. It detects the browser's supported formats - if it supports WebP or AVIF, it serves those instead of JPEG or PNG. It also automatically generates multiple sizes based on your sizes prop and the device pixel ratio, serving the smallest appropriate version.

The gotchas I've hit: First, the sizes prop is crucial and often misunderstood. It tells the browser what size the image will be at different viewport widths. If you get this wrong, the browser might download a larger image than necessary. For example, if your image is full-width on mobile but only three hundred pixels on desktop, your sizes should reflect that: something like "parentheses max-width: seven sixty eight px parentheses one hundred vw, three hundred px".

Second, layout prop behavior - 'fill' requires the parent to have position relative and defined dimensions, which trips people up. And with the new App Router, we now use style prop instead of layout in some cases.

Third, the image optimization service requires either the default loader or a custom one. If you're using a CDN like Cloudinary or Imgix, you need to configure a custom loader, otherwise the images won't optimize properly.

**Interviewer:** Excellent. Now let's shift to TypeScript integration, which we use heavily. How do you approach typing complex React patterns, like render props or higher-order components?

**Candidate:** TypeScript with React has gotten much better, but complex patterns still require thought. For render props, the key is properly typing the function prop. Let's say I have a data fetching component that passes data and loading state to its children as a function.

The render prop function needs to be typed as a function that receives an object with the data type and loading boolean, and returns a ReactNode. So something like: children should be typed as a function that takes an object parameter with data of generic type T or null, and loading as boolean, and returns ReactNode.

For higher-order components, which I try to avoid in favor of hooks honestly, you need to type both the props the HOC adds and the original component props. I typically define the injected props interface separately, then the HOC function is generic over the component's props, returning a component that accepts those props minus the injected ones.

**Interviewer:** Why do you prefer hooks over HOCs? There must be cases where HOCs are still useful.

**Candidate:** You're right to push back. Hooks are generally more composable and avoid wrapper hell, but HOCs have their place. The main advantages of hooks are composition - you can use multiple custom hooks in one component without nesting, and the data flow is more explicit in the component body.

But HOCs are still useful for cross-cutting concerns at the component boundary level. For example, if you need to enforce authentication at the component level where unauthenticated users shouldn't even see the component's loading state, an HOC that returns null or redirects before the component renders makes sense.

Similarly, for third-party library integration that needs to wrap components, like React DnD's DragSource or DropTarget, HOCs are the designed pattern. And for optimization wrappers like React.memo, we're essentially using HOCs.

The key is choosing the right tool. For logic reuse within components, hooks win. For component wrapping behavior, HOCs can be clearer.

**Interviewer:** Let's talk about testing strategy. How do you test React components that use hooks, especially ones with complex async logic?

**Candidate:** Testing hooks requires understanding both what you're testing and the testing library's rendering model. For components with async logic, I use React Testing Library with its async utilities like waitFor, findBy queries, and user-event for interactions.

The strategy is to test behavior, not implementation. I render the component, simulate user interactions, and assert on what the user sees. For async operations, I wait for the expected state change before asserting. For example, if a component fetches data on mount, I'd use findByText or waitFor to wait for the data to appear.

For complex custom hooks, I sometimes test them in isolation using renderHook from testing-library/react-hooks, though I prefer testing them through components when possible because that's how they're actually used.

Mocking is critical for async operations. I mock API calls with msw - Mock Service Worker - which intercepts network requests at the network level. This is more robust than mocking fetch or axios directly because it works the same way in tests as in the browser.

**Interviewer:** How do you handle testing components that interact with Next.js specific features like routing or server components?

**Candidate:** Next.js testing has some nuances. For routing, I mock the useRouter hook or usePathname and useSearchParams in the App Router. Next.js provides jest setup files that you can configure to mock these automatically.

For server components in the App Router, the testing strategy shifts. Server components can't be tested with traditional React testing because they don't run in a browser environment. Instead, you test the integration - does the page render correctly, does navigation work, do server actions execute properly. This often means end-to-end tests with Playwright or Cypress become more important.

For client components, testing remains the same. For components that are'use client' but receive props from server components, I test them in isolation with mock props, just like any other component.

**Interviewer:** Final question - we're building a complex dashboard application with real-time updates, multiple data sources, and it needs to work offline. Walk me through your architectural approach using React and Next.js.

**Candidate:** This is a fascinating challenge that brings together everything we've discussed. Here's how I'd architect it:

First, the data layer. For real-time updates, I'd implement WebSocket connections for critical data streams, falling back to polling for less critical data. I'd use a state management solution like Zustand or Redux Toolkit - probably Zustand for its simpler API - to maintain a normalized state shape. The normalization prevents duplication and makes updates efficient.

For offline functionality, I'd leverage service workers for caching and background sync. Next.js supports PWAs with next-pwa package. The strategy would be network-first for data that needs to be fresh, falling back to cache when offline. For user actions while offline, I'd queue them using the Background Sync API and process when connection returns.

The data fetching architecture would use React Query or SWR with persistent cache storage. When online, these libraries keep data fresh with background revalidation. When offline, they serve from cache and mark queries as stale. Once reconnected, they automatically refetch.

For the UI, I'd use optimistic updates extensively. When users perform actions, update the UI immediately assuming success, then reconcile if the action fails. This makes the app feel fast even with network latency.

The component structure would separate server and client components strategically. The initial page shell and layout would be server components for fast initial load. The real-time dashboard widgets would be client components that hydrate quickly and establish their data connections.

For multiple data sources, I'd implement an abstraction layer - data adapters that normalize different API responses into consistent shapes. This makes the components agnostic to where data comes from.

Error handling would be comprehensive with retry logic for transient failures, error boundaries for component failures, and clear user feedback about connection status and what data might be stale.

**Interviewer:** That's a solid architectural overview. Thank you for the detailed discussion today. Do you have any questions for me?

**Candidate:** Yes, actually - you mentioned the front-end architecture team. How does the team balance innovation with stability when you have production applications serving millions of users? Are there opportunities to experiment with newer patterns like React Server Components while maintaining reliability?

---

## Final Code Examples

```typescript
// 1. useEffect vs useLayoutEffect - Tooltip Example
import { useEffect, useLayoutEffect, useRef, useState } from "react";

interface TooltipProps {
  trigger: React.ReactNode;
  content: string;
}

// ❌ BAD: Using useEffect causes flicker
function TooltipWithFlicker({ trigger, content }: TooltipProps) {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();

      setPosition({
        top: triggerRect.bottom + 8,
        left: triggerRect.left + (triggerRect.width - tooltipRect.width) / 2,
      });
    }
  }, []);

  return (
    <>
      <div ref={triggerRef}>{trigger}</div>
      <div
        ref={tooltipRef}
        style={{
          position: "fixed",
          top: position.top,
          left: position.left,
        }}
      >
        {content}
      </div>
    </>
  );
}

// ✅ GOOD: Using useLayoutEffect prevents flicker
function TooltipOptimized({ trigger, content }: TooltipProps) {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();

      setPosition({
        top: triggerRect.bottom + 8,
        left: triggerRect.left + (triggerRect.width - tooltipRect.width) / 2,
      });
    }
  }, []);

  return (
    <>
      <div ref={triggerRef}>{trigger}</div>
      <div
        ref={tooltipRef}
        style={{
          position: "fixed",
          top: position.top,
          left: position.left,
        }}
      >
        {content}
      </div>
    </>
  );
}

// 2. React.memo vs useMemo - Performance Optimization
interface User {
  id: string;
  name: string;
  email: string;
}

interface UserListProps {
  users: User[];
  onUserClick: (id: string) => void;
}

// ❌ BAD: Child re-renders on every parent render
function UserListUnoptimized({ users, onUserClick }: UserListProps) {
  return (
    <div>
      {users.map((user) => (
        <UserCard key={user.id} user={user} onClick={onUserClick} />
      ))}
    </div>
  );
}

// ✅ GOOD: Optimized with React.memo and useCallback
const UserCard = React.memo(
  ({ user, onClick }: { user: User; onClick: (id: string) => void }) => {
    console.log(`Rendering user: ${user.name}`);
    return (
      <div onClick={() => onClick(user.id)}>
        <h3>{user.name}</h3>
        <p>{user.email}</p>
      </div>
    );
  }
);

function UserListOptimized({ users, onUserClick }: UserListProps) {
  // useMemo for expensive sorting operation
  const sortedUsers = useMemo(() => {
    console.log("Sorting users...");
    return [...users].sort((a, b) => a.name.localeCompare(b.name));
  }, [users]);

  // useCallback to prevent breaking React.memo
  const handleClick = useCallback(
    (id: string) => {
      onUserClick(id);
    },
    [onUserClick]
  );

  return (
    <div>
      {sortedUsers.map((user) => (
        <UserCard key={user.id} user={user} onClick={handleClick} />
      ))}
    </div>
  );
}

// 3. Next.js App Router - Server and Client Components
// app/dashboard/page.tsx - Server Component
import { Suspense } from "react";
import { RealtimeWidget } from "./realtime-widget";
import { getUser } from "@/lib/auth";

async function getUserPermissions(userId: string) {
  const res = await fetch(
    `https://api.example.com/users/${userId}/permissions`,
    {
      next: { revalidate: 300 }, // Cache for 5 minutes
    }
  );
  return res.json();
}

async function getDashboardData() {
  const res = await fetch("https://api.example.com/dashboard", {
    cache: "no-store", // Always fresh
  });
  return res.json();
}

export default async function DashboardPage() {
  // Parallel data fetching
  const [user, permissions, dashboardData] = await Promise.all([
    getUser(),
    getUserPermissions("user-id"),
    getDashboardData(),
  ]);

  return (
    <div className="dashboard">
      <h1>Welcome, {user.name}</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <RealtimeWidget permissions={permissions} />
      </Suspense>
      <DashboardContent data={dashboardData} />
    </div>
  );
}

// app/dashboard/realtime-widget.tsx - Client Component
("use client");

import { useEffect, useState } from "react";

interface RealtimeWidgetProps {
  permissions: string[];
}

export function RealtimeWidget({ permissions }: RealtimeWidgetProps) {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const ws = new WebSocket("wss://api.example.com/realtime");

    ws.onmessage = (event) => {
      setData(JSON.parse(event.data));
    };

    return () => ws.close();
  }, []);

  if (!permissions.includes("view_realtime")) {
    return <div>Access denied</div>;
  }

  return (
    <div>
      <h2>Real-time Data</h2>
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  );
}

// 4. Hydration Mismatch Prevention
("use client");

import { useEffect, useState } from "react";

// ❌ BAD: Hydration mismatch
function TimestampBad() {
  const timestamp = new Date().toLocaleString();
  return <div>Current time: {timestamp}</div>;
}

// ✅ GOOD: Prevents hydration mismatch
function TimestampGood() {
  const [timestamp, setTimestamp] = useState<string>("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTimestamp(new Date().toLocaleString());
  }, []);

  if (!mounted) {
    return <div>Current time: Loading...</div>;
  }

  return <div>Current time: {timestamp}</div>;
}

// Alternative: suppressHydrationWarning for intentional mismatches
function TimestampWithSuppression() {
  const timestamp = new Date().toLocaleString();

  return <div suppressHydrationWarning>Current time: {timestamp}</div>;
}

// 5. Data Fetching with SWR and Error Handling
("use client");

import useSWR from "swr";
import { useState } from "react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface DashboardData {
  metrics: {
    revenue: number;
    users: number;
    conversions: number;
  };
}

function DashboardWithSWR() {
  const [retryCount, setRetryCount] = useState(0);

  const { data, error, isLoading, mutate } = useSWR<DashboardData>(
    "/api/dashboard",
    fetcher,
    {
      refreshInterval: 5000, // Refresh every 5 seconds
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
        // Never retry on 404
        if (error.status === 404) return;

        // Only retry up to 3 times
        if (retryCount >= 3) return;

        // Exponential backoff
        setTimeout(() => revalidate({ retryCount }), 1000 * 2 ** retryCount);
      },
    }
  );

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
    mutate();
  };

  if (error) {
    return (
      <div className="error-container">
        <h2>Failed to load dashboard</h2>
        <p>{error.message}</p>
        <button onClick={handleRetry}>Retry</button>
      </div>
    );
  }

  if (isLoading) {
    return <div>Loading dashboard...</div>;
  }

  return (
    <div className="dashboard">
      <MetricCard title="Revenue" value={data?.metrics.revenue} />
      <MetricCard title="Users" value={data?.metrics.users} />
      <MetricCard title="Conversions" value={data?.metrics.conversions} />
    </div>
  );
}

// 6. TypeScript - Complex Types for React Patterns
import { ReactNode } from "react";

// Render Props Pattern
interface DataFetcherRenderProps<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

interface DataFetcherProps<T> {
  url: string;
  children: (props: DataFetcherRenderProps<T>) => ReactNode;
}

function DataFetcher<T>({ url, children }: DataFetcherProps<T>) {
  const { data, error, isLoading } = useSWR<T>(url, fetcher);

  return (
    <>
      {children({
        data: data ?? null,
        loading: isLoading,
        error: error ?? null,
      })}
    </>
  );
}

// Usage
function App() {
  return (
    <DataFetcher<{ name: string; email: string }> url="/api/user">
      {({ data, loading, error }) => {
        if (loading) return <div>Loading...</div>;
        if (error) return <div>Error!</div>;
        return <div>{data?.name}</div>;
      }}
    </DataFetcher>
  );
}

// Higher-Order Component Pattern
interface WithLoadingProps {
  isLoading: boolean;
}

function withLoading<P extends object>(
  Component: React.ComponentType<P>
): React.FC<P & WithLoadingProps> {
  return function WithLoadingComponent({
    isLoading,
    ...props
  }: P & WithLoadingProps) {
    if (isLoading) {
      return <div>Loading...</div>;
    }
    return <Component {...(props as P)} />;
  };
}

// Usage
interface UserProfileProps {
  name: string;
  email: string;
}

const UserProfile: React.FC<UserProfileProps> = ({ name, email }) => (
  <div>
    <h1>{name}</h1>
    <p>{email}</p>
  </div>
);

const UserProfileWithLoading = withLoading(UserProfile);

// 7. Next.js Image Optimization
import Image from "next/image";

// ✅ GOOD: Proper Image usage with sizes
function ResponsiveImageGallery() {
  return (
    <div className="gallery">
      <Image
        src="/hero-image.jpg"
        alt="Hero"
        width={1200}
        height={600}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        priority // Load immediately for LCP
        quality={85}
      />

      <div className="grid">
        {Array.from({ length: 9 }).map((_, i) => (
          <Image
            key={i}
            src={`/gallery-${i}.jpg`}
            alt={`Gallery image ${i}`}
            width={400}
            height={300}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            loading="lazy"
          />
        ))}
      </div>
    </div>
  );
}

// Custom loader for CDN
const cloudinaryLoader = ({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}) => {
  const params = ["f_auto", "c_limit", `w_${width}`, `q_${quality || "auto"}`];
  return `https://res.cloudinary.com/demo/image/upload/${params.join(
    ","
  )}${src}`;
};

function ImageWithCustomLoader() {
  return (
    <Image
      loader={cloudinaryLoader}
      src="/sample.jpg"
      alt="Sample"
      width={800}
      height={600}
    />
  );
}

// 8. Offline-First Dashboard Architecture
("use client");

import { useEffect, useState } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

// Store with persistence
interface DashboardState {
  metrics: any[];
  lastSync: number;
  isOnline: boolean;
  pendingActions: any[];
  setMetrics: (metrics: any[]) => void;
  addPendingAction: (action: any) => void;
  clearPendingActions: () => void;
  setOnlineStatus: (status: boolean) => void;
}

const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
      metrics: [],
      lastSync: Date.now(),
      isOnline: true,
      pendingActions: [],
      setMetrics: (metrics) => set({ metrics, lastSync: Date.now() }),
      addPendingAction: (action) =>
        set((state) => ({
          pendingActions: [...state.pendingActions, action],
        })),
      clearPendingActions: () => set({ pendingActions: [] }),
      setOnlineStatus: (status) => set({ isOnline: status }),
    }),
    {
      name: "dashboard-storage",
    }
  )
);

function OfflineDashboard() {
  const {
    metrics,
    isOnline,
    pendingActions,
    setMetrics,
    addPendingAction,
    clearPendingActions,
    setOnlineStatus,
  } = useDashboardStore();

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setOnlineStatus(true);
    const handleOffline = () => setOnlineStatus(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [setOnlineStatus]);

  // Sync pending actions when back online
  useEffect(() => {
    if (isOnline && pendingActions.length > 0) {
      const syncPendingActions = async () => {
        try {
          await Promise.all(
            pendingActions.map((action) =>
              fetch("/api/actions", {
                method: "POST",
                body: JSON.stringify(action),
                headers: { "Content-Type": "application/json" },
              })
            )
          );
          clearPendingActions();
        } catch (error) {
          console.error("Failed to sync:", error);
        }
      };

      syncPendingActions();
    }
  }, [isOnline, pendingActions, clearPendingActions]);

  // Optimistic update
  const handleAction = async (action: any) => {
    // Update UI immediately
    const optimisticMetrics = [...metrics, { ...action, pending: true }];
    setMetrics(optimisticMetrics);

    try {
      if (isOnline) {
        await fetch("/api/actions", {
          method: "POST",
          body: JSON.stringify(action),
          headers: { "Content-Type": "application/json" },
        });
      } else {
        addPendingAction(action);
      }
    } catch (error) {
      // Rollback on error
      setMetrics(metrics);
    }
  };

  return (
    <div>
      <div className="status-bar">
        {isOnline ? "🟢 Online" : "🔴 Offline"}
        {pendingActions.length > 0 &&
          ` - ${pendingActions.length} pending actions`}
      </div>
      <div className="metrics">
        {metrics.map((metric, i) => (
          <div key={i} className={metric.pending ? "pending" : ""}>
            {metric.value}
          </div>
        ))}
      </div>
    </div>
  );
}

// 9. Testing with React Testing Library and MSW
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";

// MSW Server setup
const server = setupServer(
  http.get("/api/users", () => {
    return HttpResponse.json([
      { id: "1", name: "John Doe", email: "john@example.com" },
      { id: "2", name: "Jane Doe", email: "jane@example.com" },
    ]);
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Test
describe("UserList", () => {
  it("fetches and displays users", async () => {
    render(<UserListOptimized users={[]} onUserClick={() => {}} />);

    // Wait for data to load
    expect(await screen.findByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("jane@example.com")).toBeInTheDocument();
  });

  it("handles errors gracefully", async () => {
    server.use(
      http.get("/api/users", () => {
        return new HttpResponse(null, { status: 500 });
      })
    );

    render(<UserListOptimized users={[]} onUserClick={() => {}} />);

    expect(await screen.findByText(/error/i)).toBeInTheDocument();

    // Click retry button
    const retryButton = screen.getByRole("button", { name: /retry/i });
    await userEvent.click(retryButton);
  });

  it("calls onUserClick when user is clicked", async () => {
    const mockOnClick = jest.fn();
    render(<UserListOptimized users={[]} onUserClick={mockOnClick} />);

    const userCard = await screen.findByText("John Doe");
    await userEvent.click(userCard);

    expect(mockOnClick).toHaveBeenCalledWith("1");
  });
});

// 10. Advanced Next.js Middleware for Auth
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("auth-token");
  const isAuthPage = request.nextUrl.pathname.startsWith("/login");
  const isProtectedRoute = request.nextUrl.pathname.startsWith("/dashboard");

  // Redirect to login if accessing protected route without token
  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect to dashboard if accessing login with valid token
  if (isAuthPage && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Add custom headers for security
  const response = NextResponse.next();
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
```

This comprehensive code collection demonstrates production-ready patterns for:

- Performance optimization with React.memo and useMemo
- Server and Client Components in Next.js App Router
- Hydration mismatch prevention
- Advanced data fetching with error handling
- TypeScript typing for complex patterns
- Image optimization
- Offline-first architecture
- Testing strategies
- Security middleware
