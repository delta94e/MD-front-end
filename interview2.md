# Senior Front-End Engineer Interview - Technical Deep Dive

## React Advanced Concepts, SSR/SSG/RSC, and Performance Optimization

---

**Interviewer:** Good morning! I'm Michael, Principal Engineer on the front-end infrastructure team. Today we're going to dive deep into some React internals, rendering strategies, and performance optimization. Let's start with something practical - can you walk me through how you'd implement a component that displays the current window width and updates in real-time as the user resizes their browser?

**Candidate:** Good morning, Michael. Sure, I'd approach this by creating a custom hook to encapsulate the window resize logic. The core idea is to add an event listener to the window's resize event in a useEffect, and store the current width in state with useState. When the window resizes, we update the state, which triggers a re-render with the new width.

However, there's an important performance consideration here - the resize event fires very frequently, potentially dozens of times per second as someone drags the window edge. Without optimization, we'd be updating state and re-rendering our component constantly, which could cause performance issues.

**Interviewer:** Exactly, so how would you handle that performance issue?

**Candidate:** I'd implement debouncing. The idea is to delay the actual state update until the user has stopped resizing for a certain amount of time, say three hundred milliseconds. So even if the resize event fires fifty times in one second, we only update the state once after they've finished resizing. I'd create a debounce utility function that wraps the resize handler and uses setTimeout to delay execution, clearing the previous timeout if a new event comes in before it fires.

**Interviewer:** Good. Now here's a critical question - when you're setting up this event listener in useEffect, what dependencies would you specify in the dependency array, and why is that important?

**Candidate:** That's a great question because it touches on a common mistake. I'd include the resize handler function and the debounce delay in the dependencies. The reason this matters is that useEffect needs to know when to clean up the old event listener and set up a new one. If the handler function reference changes between renders, we could end up with stale closures or memory leaks from listeners that never get removed.

To prevent the handler function from changing on every render, I'd wrap it in useCallback with an empty dependency array, since it only needs to call setWidth, which React guarantees to be stable.

**Interviewer:** Let me push back on that a bit - what if I told you that you can't use useCallback for the handler? How would the cleanup mechanism work?

**Candidate:** Ah, that's getting at how useEffect's cleanup function works. Even without useCallback, the cleanup would still work because every time useEffect runs, it first executes the cleanup function returned from the previous render, which removes the old listener with the old handler reference. Then it adds the new listener with the new handler reference. So we wouldn't have duplicate listeners, but we would be removing and re-adding the listener on every render, which is inefficient.

The real issue without useCallback would be that we'd be creating a new debounced function on every render because the handler reference changes. This means our debouncing wouldn't work correctly - each render would reset the timeout delay.

**Interviewer:** Excellent analysis. Now let's talk about Hook rules. Why can't you conditionally call useEffect - for example, putting it inside an if statement based on some condition?

**Candidate:** This comes down to how React internally tracks Hooks. React maintains Hooks in a linked list structure attached to the component's Fiber node. The crucial part is that React identifies which Hook is which purely by the order they're called in. It doesn't use any other identifier.

So when your component renders the first time, React builds this list: first Hook is useState for count, second Hook is useEffect for the data fetch, third Hook is useState for name, and so on. On subsequent renders, React walks through this same list in the same order, matching each Hook call to the corresponding entry in the list.

If you put a useEffect inside an if statement that's true on the first render but false on the second render, React's internal list would get out of sync. It would try to match your second Hook call to what it thinks should be a useEffect, but now that's actually a different Hook because you skipped one. This leads to completely broken behavior - you might get the wrong state, effects might not run or clean up properly, or the whole thing might crash.

**Interviewer:** What specifically breaks at the implementation level? Walk me through what React is doing internally.

**Candidate:** At the implementation level, React uses a currentHook pointer that advances through the Hooks linked list with each Hook call. On the initial render, when you call useState, React creates a new Hook object with the state value and a setState function, adds it to the list, and moves the pointer forward. When you call useEffect, it creates another Hook object with the effect callback and dependencies, adds it, moves the pointer.

On subsequent renders, React doesn't create new Hook objects - it reuses the existing ones from the list. The currentHook pointer starts at the beginning of the list again. When you call useState, React reads from the current Hook object, returns the stored state, and moves the pointer. When you call useEffect, it reads from the next Hook object, compares the new dependencies with the stored ones, and decides whether to queue the effect.

If you skip a Hook conditionally, the pointer gets misaligned. React might read state from what's actually a useEffect Hook object, or try to compare dependencies from what's actually a useState Hook object. The data structures don't match up, leading to type errors or incorrect behavior.

**Interviewer:** Perfect. Now let's shift to useRef. I want you to explain the fundamental difference between useRef and useState at the implementation level, and then tell me why useEffect can't listen to changes in a ref's current property.

**Candidate:** The key difference is where and how React stores the data. With useState, the value is stored in the Hook's memoizedState property on the Fiber node, and calling setState triggers React's update mechanism - it marks the Fiber as needing work, schedules a re-render, and eventually reconciles the component tree.

With useRef, React creates a plain JavaScript object with a current property during the initial render, stores a reference to this object on the Fiber node, and just returns that same object reference on every subsequent render. Critically, this object lives outside React's reactivity system. When you modify ref.current, you're just mutating a regular JavaScript object - React has no idea it happened because there's no setter function, no Proxy, no observation mechanism at all.

**Interviewer:** So why can't useEffect detect changes to ref.current?

**Candidate:** There are actually two reasons working together here. First, as I mentioned, modifications to ref.current don't trigger re-renders. useEffect only runs its dependency comparison when the component renders. If the component doesn't render, useEffect doesn't even get a chance to check its dependencies.

Second, and more subtly, even if the component re-renders for some other reason, the ref dependency wouldn't be detected as changed. useEffect compares dependencies using Object.is, which checks reference equality for objects. The ref object itself - the object with the current property - is the same object instance across all renders. Only the value inside current changed, but that's not what useEffect is comparing. It's comparing the ref object reference, which never changes.

**Interviewer:** Interesting. So how would you make a ref observable if you really needed to trigger effects when it changes?

**Candidate:** You'd need to bridge the gap between the ref's mutable world and React's reactive world. The pattern I'd use is to create a version counter with useState alongside the ref. Instead of directly mutating ref.current, I'd create a setter function that both updates ref.current and increments the version counter. Then useEffect can depend on the version counter - when it changes, you know the ref changed.

However, I'd question whether this is the right approach. If you need reactive updates based on a value changing, that's exactly what useState is for. useRef is intentionally designed for non-reactive storage - things like DOM references, interval IDs, previous values for comparison, or any data you want to persist across renders without causing renders. If you're fighting to make it reactive, you probably should be using useState instead.

**Interviewer:** When would you genuinely need that pattern then?

**Candidate:** A legitimate use case would be when you need both worlds - you want the value to be mutable for frequent updates that shouldn't cause renders, but occasionally you need to trigger an effect based on specific changes. For example, imagine you're tracking mouse position in a ref because you don't want to re-render on every pixel movement, but you do want to run an effect when the mouse enters a specific region. You'd update the ref on every mousemove, but only increment the version counter when crossing the region boundary.

**Interviewer:** Good. Let's switch gears to rendering strategies. Can you explain the fundamental difference between Server-Side Rendering, Static Site Generation, and React Server Components, and when you'd choose each?

**Candidate:** These are three different approaches to generating HTML on the server, but they differ significantly in when and how that happens.

Server-Side Rendering happens at request time. When a user requests a page, your Node server executes your React components, generates the complete HTML, and sends it to the browser. The browser displays this HTML immediately - the user sees content fast. Then React "hydrates" the page, attaching event listeners and making it interactive. The key characteristic is that every request generates fresh HTML, so it's great for personalized or frequently changing content. The trade-off is server load - you're doing computational work on every single request.

Static Site Generation happens at build time. During your deployment process, you pre-render every page to HTML files. These static files get deployed to a CDN. When users request a page, the CDN just serves the pre-generated file - no computation needed. This is incredibly fast and scalable, but the content is frozen at build time. If data changes, you need to rebuild and redeploy. It's perfect for content that doesn't change often, like documentation or marketing pages.

React Server Components are a newer paradigm that's more granular. Instead of thinking about entire pages being server or client rendered, you think about individual components. Server Components run only on the server - they can directly access databases, read files, call internal APIs. They send their output as a special format to the client, not as HTML. Client Components are traditional React components that hydrate and become interactive. The beautiful part is you can compose them together - a Server Component can render Client Components as children, passing server data down as props.

**Interviewer:** Why would Server Components be better than just using SSR with data fetching?

**Candidate:** The fundamental advantage is the JavaScript bundle size. With traditional SSR, every component's code ships to the browser, even if that component only runs on the server to fetch data. So your data-fetching logic, database client libraries, data transformation utilities - all of that goes to the client even though it never executes there. You're paying the cost in bundle size and parse time for code that runs once on the server and then sits unused on the client.

With Server Components, the server component code never ships to the browser at all. If you have a component that queries your database and renders a list, only the list rendering output is sent to the client, not the database query code. This can dramatically reduce bundle sizes for data-heavy applications.

Additionally, Server Components can fetch data in parallel more naturally. In traditional SSR, you often have a waterfall problem - parent component fetches data, renders, child component sees its props and fetches more data. With Server Components, you can start multiple data fetches at different levels of the tree simultaneously, and the server coordinates sending everything down together.

**Interviewer:** Let's talk about the problems with SSR. What causes blocking in Node.js SSR and how would you diagnose and fix it?

**Candidate:** Node.js uses a single-threaded event loop, which means CPU-intensive operations can block the entire process from handling other requests. In SSR, the most common blocker is the rendering itself - generating HTML from React components is synchronous and CPU-bound. If you're rendering a complex component tree with heavy computation, that work blocks the event loop.

To diagnose it, I'd use Node's built-in profiler or tools like clinic.js to identify where CPU time is being spent. You'd typically see renderToString taking up significant time in the flame graph. For a quick check, you can add timing logs around your render calls and monitoring for response time spikes.

**Interviewer:** How would you fix it?

**Candidate:** There are several approaches depending on the severity. For moderate cases, switching from renderToString to renderToNodeStream or renderToPipeableStream helps significantly. These streaming APIs don't block on generating the entire HTML - they start sending chunks to the client as they're ready. The client can start parsing and displaying content earlier, and your server isn't holding the entire HTML string in memory.

For heavier rendering, I'd implement component-level caching. If parts of your page don't change often - like a navigation bar or footer - you can cache their rendered HTML and reuse it across requests. This reduces the component tree you're rendering on each request.

Another technique is to identify expensive components and move them to client-side rendering. Not everything needs to be server-rendered. If a component is heavy and not critical for SEO or initial paint, lazy load it on the client.

For extreme cases, you might need worker threads. You can offload the rendering to a worker pool, keeping your main event loop free to handle requests. This adds complexity with inter-process communication, but it prevents any single render from blocking other users.

**Interviewer:** What about database calls during SSR? How do those impact blocking?

**Candidate:** Database calls themselves shouldn't block the event loop if you're using async/await properly with non-blocking database clients. The issue is more about latency and serial waterfalls. If your component tree does sequential async operations - fetch user data, then based on that fetch posts, then based on those fetch comments - you're adding up all those round-trip times before you can send any HTML.

The fix is parallel fetching where possible. Use Promise.all to fire off multiple independent queries simultaneously. In Next.js App Router with Server Components, this happens more naturally - different components can fetch in parallel without manually orchestrating it.

You also need connection pool management. If you exhaust your database connection pool, new requests will queue waiting for connections, which looks like blocking even though it's actually resource starvation. Proper pool sizing and connection reuse is critical.

**Interviewer:** Let's talk SEO. Walk me through your approach to SEO for a React application, starting with the fundamentals.

**Candidate:** SEO for React applications requires thinking about both what search engine crawlers can see and how they interpret your content. The foundation is server-side rendering or static generation - crawlers need to see content in the initial HTML response. Modern crawlers like Googlebot can execute JavaScript, but you shouldn't rely on that exclusively because it's slower and less reliable.

The HTML structure itself matters enormously. I'd use semantic HTML tags properly - h1 for the main page heading, with a clear hierarchy through h2, h3. Navigation should use the nav element. Main content in a main element. This helps crawlers understand the structure and relative importance of content.

Meta tags in the head are crucial. Every page needs a unique, descriptive title under sixty characters. The meta description should be compelling and include relevant keywords, though it doesn't directly impact ranking - it affects click-through rates from search results. Open Graph and Twitter Card tags help when your content is shared on social media.

**Interviewer:** How do you handle dynamic meta tags in a React application?

**Candidate:** In Next.js, I'd use the Metadata API in the App Router or the Head component in the Pages Router. These let you set meta tags programmatically based on the page data. For example, a blog post page would pull the post title and excerpt from the database and set those as the page title and description.

The critical part is that these meta tags need to be in the server-rendered HTML. If you're using client-side React without SSR, libraries like React Helmet don't actually help with crawlers because the meta tags get added by JavaScript after the initial HTML loads. The crawler might not see them. With SSR, React Helmet or Next.js Head works because it injects the tags into the server-rendered HTML.

**Interviewer:** What about sitemaps and robots.txt? Explain their purpose and how you'd implement them.

**Candidate:** Robots.txt is a file at the root of your domain that tells crawlers which parts of your site they're allowed to crawl. It's not about security - it's about guiding crawlers to your important content and away from things like admin panels, API routes, or duplicate content paths. You'd specify user-agent for different crawlers and use Disallow directives for paths they shouldn't crawl. It's also where you declare your sitemap location.

The sitemap is an XML file that lists all the URLs on your site you want crawled, along with metadata like when they were last modified, how often they change, and their priority relative to other pages. This is especially important for large sites or sites with dynamic content where the crawler might not discover all pages through links alone. Search engines use it as a suggestion for crawl prioritization.

In Next.js, for a static or mostly static site, I'd generate the sitemap at build time. You'd read your routes, format them as XML according to the sitemap protocol, and write it to the public directory. For dynamic sites, you'd create an API route that generates the sitemap on-demand, potentially with caching.

**Interviewer:** Why would you need caching for a dynamically generated sitemap?

**Candidate:** Sitemaps can get very large for big sites - potentially hundreds of thousands or millions of URLs. If you're generating that by querying your database for every page, post, and product on every request, that's a heavy operation. Search engines might request your sitemap multiple times per day, and you don't want that hammering your database.

Caching the sitemap for a reasonable period, like an hour or a day depending on how often your content changes, means you do the expensive generation once and serve the cached result multiple times. You'd invalidate the cache when new content is published if you need more real-time updates.

**Interviewer:** Let's go back to something you mentioned earlier about the HTML tree depth algorithm. If I gave you an HTML string, how would you calculate the maximum depth of nesting?

**Candidate:** The approach is to parse the HTML string for opening and closing tags, maintain a depth counter, and track the maximum depth seen. I'd use a regular expression to find all tags - both self-closing and regular ones. When I encounter an opening tag that's not self-closing, I increment the depth counter. When I hit a closing tag, I decrement it. I'd track the maximum value the depth counter reaches.

The tricky parts are handling self-closing tags, which don't change the depth, and malformed HTML. For self-closing tags like br or img with a slash before the closing bracket, I'd detect that in the regex and skip incrementing depth. For malformed HTML, a robust implementation might use a stack to match opening and closing tags, ensuring they're balanced.

**Interviewer:** Why use a regex instead of a proper HTML parser?

**Candidate:** That's a great question and highlights a trade-off. A regex approach is simpler and doesn't require dependencies, but it's fragile. HTML is not a regular language, so regex can't truly parse it correctly - especially with things like script tags containing angle brackets, comments, or CDATA sections. A proper HTML parser like parse5 or the browser's DOMParser would handle all these edge cases correctly.

In production code, I'd probably use a real parser for correctness. The regex approach works for clean HTML in controlled environments, like if you're generating the HTML yourself and know it's well-formed. But for arbitrary user input or scraped HTML, it would fail on edge cases.

**Interviewer:** Walk me through how you'd implement that with a proper parser approach instead.

**Candidate:** With a proper parser, I'd parse the HTML into a DOM tree and then do a depth-first traversal to find the maximum depth. Starting from the root, I'd recursively visit each child node, tracking the current depth as I go down and the maximum depth seen. When I visit a node, the depth is one plus my parent's depth. I'd iterate through all children, recurse on each, and track the maximum.

The advantage is correctness - the parser handles all HTML edge cases, and you're working with a proper tree structure. The disadvantage is it's slower and uses more memory because you're building the full DOM tree. For a simple depth calculation, that might be overkill, but it's the right approach for complex HTML manipulation tasks.

**Interviewer:** Let me ask you something more architectural. You're building a large-scale application with Next.js. It has user dashboards with personalized data, marketing pages, documentation, and a blog. How would you decide which rendering strategy to use for each section?

**Candidate:** I'd map rendering strategy to the characteristics of each section. Marketing pages and documentation have content that rarely changes and doesn't need personalization - perfect candidates for Static Site Generation. I'd use getStaticProps to fetch data at build time and generate static HTML. These pages would be blazingly fast, served from CDN edge nodes close to users globally.

The blog is interesting because it depends on the publishing frequency. If posts are published occasionally, SSG with Incremental Static Regeneration would work well. ISR lets you specify a revalidation time - say, sixty seconds. After that time, the next request triggers a background regeneration with fresh data, but the user still gets the stale page instantly. This gives you the speed of static pages with more frequent updates. If you're publishing multiple times per hour, SSR might be better to ensure content is always fresh.

User dashboards absolutely need Server-Side Rendering or the new App Router with Server Components. The data is different for every user and needs to be fresh. You can't pre-render it at build time. With SSR, each request generates HTML with that user's data. With Server Components in the App Router, you get finer-grained control - the dashboard shell could be static, with specific data widgets as Server Components that fetch user-specific data.

**Interviewer:** How would you handle authentication in this mixed rendering approach?

**Candidate:** Authentication needs careful handling across rendering strategies. For SSG pages that are public, no authentication is needed. For SSR pages and Server Components that need authentication, I'd verify the auth token on the server before rendering. In Next.js middleware, I can intercept requests to protected routes, check for a valid session cookie or JWT, and redirect to login if authentication fails.

The trick is avoiding auth checks that slow down page loads. I'd use middleware for route-level protection, but for personalized content within a page, I might render a shell quickly and fetch personalized data client-side if it's not critical for initial render. This gets pixels on screen fast while still ensuring security.

For hybrid pages - like a product page that's static but shows personalized cart status - I'd SSG the main content and use client-side fetching for the user-specific bits. The page loads fast from CDN, then React hydrates and makes a quick API call for the cart info.

**Interviewer:** Last question - you mentioned Node.js SSR blocking earlier. Can you walk through a specific scenario where you'd debug a slow SSR response time and what tools and techniques you'd use?

**Candidate:** Let's say users are reporting slow page loads on the dashboard. First, I'd check monitoring - response time metrics from my APM tool like New Relic or Datadog. I'd look for patterns - is it all requests or specific pages? Specific times of day? That tells me if it's a code issue or infrastructure scaling problem.

If it's a code issue, I'd start with timing instrumentation. I'd add console.time calls around the renderToString or renderToPipeableStream call, around database queries, and around any other async operations in getServerSideProps. This gives me a breakdown of where time is spent.

Next, I'd run Node's built-in profiler in a staging environment. Node --prof generates a profile, then --prof-process converts it to a readable format. This shows a flame graph of CPU usage - I can see exactly which functions are taking time. Often you find surprise culprits, like a utility function that's accidentally doing expensive work inside a render loop.

For memory issues, I'd use heapsnapshot or the heap profiler. Memory leaks in SSR are particularly nasty because each request might leak a small amount, but over thousands of requests it accumulates. The heap snapshot shows what objects are consuming memory. Common culprits are global caches that grow unbounded or event listeners that aren't cleaned up.

**Interviewer:** What if the profiler shows the rendering itself is just inherently slow?

**Candidate:** Then I'd look at optimizing the component tree. I'd use React DevTools Profiler in a development build to see which components are taking the most render time. Often you find components doing unnecessary work - maybe iterating over large arrays, doing complex calculations that could be memoized, or not using keys properly on lists causing inefficient reconciliation.

I'd consider architectural changes - splitting heavy components across the client-server boundary, caching expensive calculations between requests, or lazy-loading parts of the page. In extreme cases, you might need to rethink the page structure itself. Maybe the dashboard doesn't need to be a single monolithic SSR page - you could render a shell quickly and stream in panels as they're ready.

The key is measurement-driven optimization. Don't guess where the problem is - profile it, find the actual bottleneck, and fix that specific issue. Then measure again to verify the fix worked and identify the next bottleneck.

**Interviewer:** Excellent. That's a comprehensive discussion. Before we wrap up, do you have any questions for me about how we handle these challenges at our scale?

**Candidate:** Yes, actually - you mentioned earlier that this is the infrastructure team. How do you balance providing good defaults and abstractions for product teams while still giving them flexibility to optimize for their specific use cases? Like, do you mandate certain rendering strategies, or is it more of a guidelines approach?

---

## Final Code Examples

```typescript
// 1. Window Width Display with Debouncing
import { useState, useEffect, useCallback, useRef } from "react";

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

// Custom hook for window width tracking
function useWindowWidth(delay: number = 300): number {
  const [width, setWidth] = useState<number>(
    typeof window !== "undefined" ? window.innerWidth : 0
  );

  const handleResize = useCallback(() => {
    setWidth(window.innerWidth);
  }, []);

  useEffect(() => {
    // Create debounced version of resize handler
    const debouncedHandleResize = debounce(handleResize, delay);

    // Add event listener
    window.addEventListener("resize", debouncedHandleResize);

    // Set initial width
    handleResize();

    // Cleanup function
    return () => {
      window.removeEventListener("resize", debouncedHandleResize);
    };
  }, [handleResize, delay]);

  return width;
}

// Component usage
export function WindowWidthDisplay() {
  const windowWidth = useWindowWidth(300);
  const [resizeCount, setResizeCount] = useState(0);

  useEffect(() => {
    // Track how many times width updates (after debounce)
    setResizeCount((prev) => prev + 1);
  }, [windowWidth]);

  return (
    <div className="window-width-display">
      <h2>Real-time Window Width</h2>
      <p className="current-width">
        Current Width: <strong>{windowWidth}px</strong>
      </p>
      <p className="resize-count">Updates: {resizeCount}</p>
      <div className="width-visualization">
        <div
          className="bar"
          style={{
            width: `${(windowWidth / window.screen.width) * 100}%`,
            height: "20px",
            backgroundColor: "#4CAF50",
            transition: "width 0.3s ease",
          }}
        />
      </div>
    </div>
  );
}

// 2. Understanding Hook Order - Demonstrating the Problem
// ❌ BAD: Conditional Hook calls (This will break!)
function BrokenComponent({ shouldFetch }: { shouldFetch: boolean }) {
  const [count, setCount] = useState(0);

  // ❌ NEVER DO THIS - Hook order must be consistent
  if (shouldFetch) {
    useEffect(() => {
      console.log("Fetching data...");
    }, []);
  }

  const [name, setName] = useState("");

  return (
    <div>
      {count} - {name}
    </div>
  );
}

// ✅ GOOD: Consistent Hook order
function CorrectComponent({ shouldFetch }: { shouldFetch: boolean }) {
  const [count, setCount] = useState(0);

  // ✅ Hook is always called, condition is inside
  useEffect(() => {
    if (shouldFetch) {
      console.log("Fetching data...");
    }
  }, [shouldFetch]);

  const [name, setName] = useState("");

  return (
    <div>
      {count} - {name}
    </div>
  );
}

// 3. useRef vs useState - Deep Understanding
interface TimerControlsProps {
  onTick?: (count: number) => void;
}

function TimerWithRef({ onTick }: TimerControlsProps) {
  // useRef - doesn't trigger re-renders when changed
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const countRef = useRef<number>(0);

  // useState - triggers re-renders when changed
  const [displayCount, setDisplayCount] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const startTimer = () => {
    if (intervalRef.current) return;

    setIsRunning(true);
    intervalRef.current = setInterval(() => {
      // Update ref (doesn't cause re-render)
      countRef.current += 1;

      // Update state every 10 ticks (causes re-render)
      if (countRef.current % 10 === 0) {
        setDisplayCount(countRef.current);
      }

      onTick?.(countRef.current);
    }, 100);
  };

  const stopTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      setIsRunning(false);
    }
  };

  const reset = () => {
    stopTimer();
    countRef.current = 0;
    setDisplayCount(0);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <div>
      <h3>Timer (Updates every 10 ticks)</h3>
      <p>Display Count: {displayCount}</p>
      <p>Actual Count: {countRef.current}</p>
      <button onClick={startTimer} disabled={isRunning}>
        Start
      </button>
      <button onClick={stopTimer} disabled={!isRunning}>
        Stop
      </button>
      <button onClick={reset}>Reset</button>
    </div>
  );
}

// 4. Making useRef Observable
function useWatchableRef<T>(initialValue: T) {
  const ref = useRef<T>(initialValue);
  const [version, setVersion] = useState(0);

  const setRef = useCallback((value: T) => {
    ref.current = value;
    setVersion((v) => v + 1);
  }, []);

  return [ref, setRef, version] as const;
}

// Usage example
function MouseRegionTracker() {
  const [mousePos, setMousePos, mousePosVersion] = useWatchableRef({
    x: 0,
    y: 0,
  });
  const [inRegion, setInRegion] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const newPos = { x: e.clientX, y: e.clientY };
      const wasInRegion = inRegion;
      const isInRegion =
        newPos.x > 200 && newPos.x < 400 && newPos.y > 200 && newPos.y < 400;

      // Update ref on every move (doesn't cause re-render)
      mousePos.current = newPos;

      // Only trigger version update when crossing region boundary
      if (wasInRegion !== isInRegion) {
        setMousePos(newPos);
        setInRegion(isInRegion);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [inRegion, mousePos, setMousePos]);

  // This effect only runs when mousePosVersion changes
  // (when mouse crosses region boundary)
  useEffect(() => {
    console.log("Mouse crossed region boundary at:", mousePos.current);
  }, [mousePosVersion, mousePos]);

  return (
    <div>
      <p>Move your mouse!</p>
      <p>In region (200-400, 200-400): {inRegion ? "Yes" : "No"}</p>
      <p>
        Position: {mousePos.current.x}, {mousePos.current.y}
      </p>
    </div>
  );
}

// 5. HTML Tree Depth Calculator
function getHtmlTreeDepth(htmlStr: string): number {
  let depth = 0;
  let maxDepth = 0;
  const stack: string[] = [];

  // Regex to match HTML tags
  // Matches: <tag>, </tag>, <tag/>
  const tagRegex = /<\/?([a-z][a-z0-9]*)[^>]*>/gi;

  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(htmlStr)) !== null) {
    const fullTag = match[0];
    const tagName = match[1];

    if (fullTag.startsWith("</")) {
      // Closing tag
      depth--;
      stack.pop();
    } else if (!fullTag.endsWith("/>")) {
      // Opening tag (not self-closing)
      depth++;
      maxDepth = Math.max(maxDepth, depth);
      stack.push(tagName);
    }
    // Self-closing tags (like <br/>) don't change depth
  }

  return maxDepth;
}

// Alternative: Using DOMParser for more robust parsing
function getHtmlTreeDepthRobust(htmlStr: string): number {
  // Only works in browser environment
  if (typeof window === "undefined") {
    return getHtmlTreeDepth(htmlStr);
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlStr, "text/html");

  function getDepth(node: Node, currentDepth: number = 0): number {
    if (!node.hasChildNodes()) {
      return currentDepth;
    }

    let maxChildDepth = currentDepth;

    node.childNodes.forEach((child) => {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const childDepth = getDepth(child, currentDepth + 1);
        maxChildDepth = Math.max(maxChildDepth, childDepth);
      }
    });

    return maxChildDepth;
  }

  return getDepth(doc.body);
}

// Test the functions
const htmlStr = `
  <div>
    <div>
      <span>123</span>
      <a>222</a>
      <div>
        <button>333</button>
        <br/>
      </div>
    </div>
  </div>
`;

console.log("HTML Tree Depth (Regex):", getHtmlTreeDepth(htmlStr)); // 4
console.log("HTML Tree Depth (Parser):", getHtmlTreeDepthRobust(htmlStr)); // 4

// 6. Next.js Rendering Strategies Examples

// SSG - Static Site Generation
// app/blog/[slug]/page.tsx
export async function generateStaticParams() {
  const posts = await fetch("https://api.example.com/posts").then((res) =>
    res.json()
  );

  return posts.map((post: { slug: string }) => ({
    slug: post.slug,
  }));
}

async function getPost(slug: string) {
  const res = await fetch(`https://api.example.com/posts/${slug}`, {
    next: { revalidate: 3600 }, // ISR: Revalidate every hour
  });
  return res.json();
}

export default async function BlogPost({
  params,
}: {
  params: { slug: string };
}) {
  const post = await getPost(params.slug);

  return (
    <article>
      <h1>{post.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: post.content }} />
    </article>
  );
}

// SSR - Server-Side Rendering
// app/dashboard/page.tsx
import { cookies } from "next/headers";

async function getUserData(userId: string) {
  const res = await fetch(`https://api.example.com/users/${userId}`, {
    cache: "no-store", // Always fetch fresh data
  });
  return res.json();
}

export default async function Dashboard() {
  const cookieStore = cookies();
  const userId = cookieStore.get("userId")?.value;

  if (!userId) {
    redirect("/login");
  }

  const userData = await getUserData(userId);

  return (
    <div>
      <h1>Welcome, {userData.name}</h1>
      <DashboardContent data={userData} />
    </div>
  );
}

// RSC - React Server Components with Client Components
// app/dashboard/realtime-stats.tsx
("use client");

import { useEffect, useState } from "react";

interface RealtimeStatsProps {
  initialData: any;
}

export function RealtimeStats({ initialData }: RealtimeStatsProps) {
  const [data, setData] = useState(initialData);

  useEffect(() => {
    const ws = new WebSocket("wss://api.example.com/stats");

    ws.onmessage = (event) => {
      setData(JSON.parse(event.data));
    };

    return () => ws.close();
  }, []);

  return (
    <div className="stats-grid">
      <StatCard title="Active Users" value={data.activeUsers} />
      <StatCard title="Revenue" value={`$${data.revenue}`} />
      <StatCard title="Conversions" value={data.conversions} />
    </div>
  );
}

// Server Component that uses Client Component
// app/dashboard/page.tsx
import { RealtimeStats } from "./realtime-stats";

async function getInitialStats() {
  const res = await fetch("https://api.example.com/stats/initial");
  return res.json();
}

export default async function DashboardPage() {
  const initialStats = await getInitialStats();

  return (
    <div>
      <h1>Real-time Dashboard</h1>
      <RealtimeStats initialData={initialStats} />
    </div>
  );
}

// 7. SSR Performance Optimization

// Using Streaming
// app/dashboard/page.tsx
import { Suspense } from "react";

async function SlowComponent() {
  // Simulate slow data fetch
  await new Promise((resolve) => setTimeout(resolve, 3000));
  const data = await fetch("https://api.example.com/slow-endpoint").then((r) =>
    r.json()
  );

  return <div>Slow Data: {data.value}</div>;
}

async function FastComponent() {
  const data = await fetch("https://api.example.com/fast-endpoint").then((r) =>
    r.json()
  );
  return <div>Fast Data: {data.value}</div>;
}

export default function StreamingPage() {
  return (
    <div>
      <h1>Dashboard with Streaming</h1>

      {/* Fast component renders immediately */}
      <Suspense fallback={<div>Loading fast data...</div>}>
        <FastComponent />
      </Suspense>

      {/* Slow component streams in later */}
      <Suspense fallback={<div>Loading slow data...</div>}>
        <SlowComponent />
      </Suspense>
    </div>
  );
}

// Parallel Data Fetching
async function getPageData() {
  // ❌ BAD: Sequential (waterfall)
  const user = await fetchUser();
  const posts = await fetchPosts(user.id);
  const comments = await fetchComments(posts[0].id);

  // ✅ GOOD: Parallel
  const [user, posts, stats] = await Promise.all([
    fetchUser(),
    fetchPosts(),
    fetchStats(),
  ]);

  return { user, posts, stats };
}

// Component-level caching
import { cache } from "react";

const getUser = cache(async (id: string) => {
  const res = await fetch(`https://api.example.com/users/${id}`);
  return res.json();
});

// This function is memoized - multiple calls with same ID
// within a single render will only fetch once
export default async function UserProfile({ userId }: { userId: string }) {
  const user = await getUser(userId);

  return (
    <div>
      <UserHeader user={user} />
      <UserDetails userId={userId} /> {/* Will reuse cached data */}
    </div>
  );
}

// 8. SEO Implementation

// Dynamic meta tags in Next.js App Router
// app/blog/[slug]/page.tsx
import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const post = await getPost(params.slug);

  return {
    title: `${post.title} | My Blog`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [post.coverImage],
      type: "article",
      publishedTime: post.publishedAt,
      authors: [post.author.name],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: [post.coverImage],
    },
  };
}

// Sitemap generation
// app/sitemap.ts
import { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await fetch("https://api.example.com/posts").then((res) =>
    res.json()
  );

  const postUrls = posts.map((post: any) => ({
    url: `https://example.com/blog/${post.slug}`,
    lastModified: post.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [
    {
      url: "https://example.com",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: "https://example.com/about",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    ...postUrls,
  ];
}

// Robots.txt generation
// app/robots.ts
import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/", "/private/"],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        crawlDelay: 2,
      },
    ],
    sitemap: "https://example.com/sitemap.xml",
  };
}

// Structured data for SEO
// components/article-structured-data.tsx
export function ArticleStructuredData({ article }: { article: any }) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    image: article.coverImage,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    author: {
      "@type": "Person",
      name: article.author.name,
    },
    publisher: {
      "@type": "Organization",
      name: "My Blog",
      logo: {
        "@type": "ImageObject",
        url: "https://example.com/logo.png",
      },
    },
    description: article.excerpt,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

// 9. Node.js SSR Debugging and Monitoring

// Performance monitoring middleware
import { performance } from "perf_hooks";

export function performanceMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const start = performance.now();

  res.on("finish", () => {
    const duration = performance.now() - start;

    // Log slow requests
    if (duration > 1000) {
      console.warn(`Slow request: ${req.path} took ${duration}ms`);
    }

    // Send to monitoring service
    sendMetric("http.request.duration", duration, {
      path: req.path,
      method: req.method,
      status: res.statusCode,
    });
  });

  next();
}

// Component-level timing
export async function TimedComponent({ data }: { data: any }) {
  const start = performance.now();

  // Simulate expensive operation
  const processedData = await processData(data);

  const duration = performance.now() - start;

  if (duration > 100) {
    console.warn(`TimedComponent took ${duration}ms to render`);
  }

  return <div>{processedData}</div>;
}

// Memory leak detection
let requestCount = 0;
const cache = new Map();

export function leakyMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  requestCount++;

  // ❌ BAD: Cache grows unbounded
  cache.set(requestCount, { data: new Array(1000000).fill("leak") });

  // ✅ GOOD: Implement cache eviction
  if (cache.size > 100) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }

  next();
}

// Worker thread for heavy rendering
// worker.js
const { parentPort } = require("worker_threads");
const React = require("react");
const { renderToString } = require("react-dom/server");

parentPort.on("message", ({ component, props }) => {
  try {
    const html = renderToString(React.createElement(component, props));
    parentPort.postMessage({ success: true, html });
  } catch (error) {
    parentPort.postMessage({ success: false, error: error.message });
  }
});

// Main thread
import { Worker } from "worker_threads";

async function renderInWorker(component: any, props: any) {
  return new Promise((resolve, reject) => {
    const worker = new Worker("./worker.js");

    worker.postMessage({ component, props });

    worker.on("message", (result) => {
      worker.terminate();
      if (result.success) {
        resolve(result.html);
      } else {
        reject(new Error(result.error));
      }
    });

    worker.on("error", reject);
  });
}
```

This comprehensive code collection demonstrates production-ready patterns for:

- Advanced React Hooks with proper cleanup and optimization
- Understanding Hook internals and constraints
- useRef vs useState implementation details
- HTML parsing and tree traversal algorithms
- All three rendering strategies (SSG, SSR, RSC) in Next.js
- Performance optimization for SSR
- SEO implementation with meta tags, sitemaps, and structured data
- Debugging and monitoring Node.js SSR applications
- Worker threads for heavy rendering workloads
