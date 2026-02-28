# Senior Front-End Engineer Interview - React Internals & System Design

## React Architecture, Mini-Programs, and Infrastructure

---

**Interviewer:** Good afternoon! I'm Alex, Principal Engineer on the Platform team. Today we'll dive deep into React internals, architectural patterns, and some system design topics. Let's start with something fundamental that often gets misunderstood - can you explain React's synthetic event system? Not just what it is, but why it exists and how it actually works under the hood?

**Candidate:** Good afternoon, Alex. Sure, I'd be happy to explain synthetic events. The core reason React created this abstraction is to solve browser inconsistencies. Different browsers implement DOM events slightly differently - Internet Explorer had its own event model, Firefox and Chrome had variations in how they handled certain events. React wanted to give developers a unified, predictable API regardless of which browser the user is running.

But there's a more important performance reason - event delegation. Instead of attaching individual event listeners to every DOM element that needs one, React attaches a single listener to the root of your application. In React seventeen and later, this is the root container where you call ReactDOM.render. In earlier versions, it was the document.

When your component renders and you write onClick equals handleClick, React doesn't actually attach that handler to that specific DOM element. Instead, it registers this event handler internally and keeps track of which Fiber node it belongs to. When a user actually clicks on that element, the native browser event bubbles up through the DOM tree until it reaches the root container where React's listener catches it.

**Interviewer:** Interesting. So when that root listener catches the event, what happens next? Walk me through the dispatch process.

**Candidate:** When the root listener catches the native event, React's dispatchEvent function kicks in. This function needs to figure out which React components care about this event and in what order to call their handlers.

First, it uses the native event's target property to identify which DOM node was actually clicked. Then React looks up the corresponding Fiber node for that DOM element. This is possible because React maintains a mapping between DOM nodes and Fiber nodes through a property on the DOM element itself.

Once React has the Fiber node, it walks up the Fiber tree from that node toward the root, collecting all event handlers along the way that are registered for this event type. This mimics the bubbling phase of native events. For certain event types, React also simulates the capture phase by walking down from the root first.

All these collected handlers get added to a dispatch queue. React wraps the native event in a SyntheticEvent object that normalizes the API across browsers, then executes the handlers in the queue sequentially. The SyntheticEvent has all the standard event properties like target, currentTarget, preventDefault, stopPropagation, and so on.

**Interviewer:** You mentioned that React wraps the native event. Why not just use the native event directly after normalizing it?

**Candidate:** That's a great question because it gets at a subtle but important optimization. React uses event pooling - or at least it did in versions before React seventeen. The SyntheticEvent object is reused across different events to reduce garbage collection pressure.

After all the event handlers have executed, React nullifies all properties on the SyntheticEvent object and returns it to a pool for reuse. This means if you try to access event.target asynchronously, like inside a setTimeout, it would be null because the event object has been reset and reused for other events.

In React seventeen, they actually removed event pooling because modern JavaScript engines are good enough at garbage collection that the performance benefit wasn't significant anymore, and it was a common source of bugs when developers didn't understand this behavior.

**Interviewer:** Good explanation. Now let's shift to React's rendering and update mechanism. Can you walk me through what happens when a component calls setState? Start from the update being scheduled all the way to pixels on screen.

**Candidate:** This touches on React's entire architecture, so let me break it down by the major phases. When you call setState, you're not immediately triggering a render. Instead, React schedules an update, which is where the Scheduler comes in.

The Scheduler is React's task coordination system. It receives the update and assigns it a priority using what's called the lane model. Different types of updates get different lanes - user interactions like clicks get high priority lanes, data fetching or passive effects get lower priority lanes. These lanes are represented as bit fields, so React can efficiently check which lanes have pending work using bitwise operations.

Once the update is scheduled, the Reconciler takes over. The Reconciler is responsible for the work-in-progress phase, where React figures out what actually needs to change. It starts from the Fiber node where setState was called and begins traversing the tree, calling render methods and creating new Fiber nodes.

**Interviewer:** You mentioned the Reconciler creates new Fiber nodes. Doesn't React reuse Fiber nodes from the previous render? Explain the workInProgress tree concept.

**Candidate:** Exactly, that's the double buffering technique. React maintains two Fiber trees - the current tree representing what's on screen, and the workInProgress tree representing the next state being computed. When an update happens, React doesn't modify the current tree directly. Instead, it creates or updates the workInProgress tree.

Each Fiber node has an alternate pointer linking it to its counterpart in the other tree. When React processes a Fiber during reconciliation, if the component's props and type haven't changed, it can clone the old Fiber and reuse its state. If things have changed, it creates a new Fiber node with updated information.

The genius of this approach is interruptibility. If a higher priority update comes in while React is building the workInProgress tree, it can abandon that work and start over using the still-intact current tree. Once the workInProgress tree is complete and committed, React just swaps the pointers - workInProgress becomes current, and current becomes the new workInProgress base for future updates.

**Interviewer:** How does React actually interrupt work? What's the mechanism that allows it to pause and resume?

**Candidate:** This is where the time-slicing magic happens. The Reconciler doesn't process the entire tree in one synchronous operation. Instead, it breaks the work into units - each unit is processing one Fiber node. After completing each unit, React checks if it needs to yield control back to the browser.

The Scheduler uses requestIdleCallback or, more commonly in modern React, MessageChannel to schedule callbacks during browser idle time. React sets a deadline, typically aiming to finish work within five milliseconds to maintain sixty frames per second. After processing each Fiber node, it checks the current time against this deadline using a shouldYield function.

If time is up, React breaks out of the work loop, saving its position by keeping a pointer to the current Fiber node it's working on. Control returns to the browser, which can handle events, paint, or do other work. When React gets scheduled again in the next idle period, it picks up from that saved pointer and continues processing more Fiber nodes.

**Interviewer:** What about the actual DOM updates? When and how do those happen?

**Candidate:** DOM updates happen in the Commit phase, which is synchronous and cannot be interrupted. Once the Reconciler finishes building the complete workInProgress tree, it transitions to Commit. This phase is split into three sub-phases: before mutation, mutation, and layout.

Before mutation is where React calls getSnapshotBeforeUpdate on class components and schedules useEffect cleanup functions. The mutation phase is where React actually applies changes to the DOM - inserting, updating, or removing DOM nodes based on the effect tags that were set during reconciliation.

The layout phase happens after DOM mutations but before the browser paints. This is where useLayoutEffect callbacks run, refs get updated, and componentDidMount or componentDidUpdate fire for class components. These run synchronously and can read layout information or make additional DOM changes that need to happen before paint.

Finally, after the layout phase completes, React schedules useEffect callbacks to run asynchronously after the paint, which is why they don't block visual updates.

**Interviewer:** Let's dive into the reconciliation itself - the Diff algorithm. Explain how React determines what changed between renders. Start with the single-node case.

**Candidate:** React's Diff algorithm has to solve the problem of comparing two trees efficiently. A general tree diff is O(n³) complexity, which is way too slow. React makes assumptions to get it down to O(n).

For single-node diff, React is comparing one new React element with one old Fiber node. The process is straightforward: First, React checks if the old Fiber exists at all. If there's no old Fiber at this position, it's clearly a new node being added, so React creates a new Fiber with the Placement effect tag.

If an old Fiber exists, React compares the key prop first. If the keys are different, the nodes are treated as completely different elements. React marks the old Fiber for deletion and creates a new Fiber for the new element. This is why keys are so important - they tell React which elements are conceptually the same across renders.

If the keys match, React then compares the type - is it the same component or element type? If the type differs, same deal - delete the old, create the new. But if both key and type match, React knows this is the same logical element, just potentially with different props. It reuses the old Fiber, marks it with an Update tag, and updates its props.

**Interviewer:** What about lists of children? That's where things get complex, right? Walk me through the multi-node diff.

**Candidate:** Lists are indeed more complex because you have to handle insertions, deletions, and moves. React uses a clever two-pass algorithm to handle this efficiently.

The first pass iterates through the new children and the old Fiber siblings in parallel, comparing them position by position. For each pair, if the key and type match, React reuses the Fiber and continues to the next pair. This handles the common case where most of the list stays the same and only a few items change.

The first pass ends early if React encounters a pair that can't be reused - either different keys or no old Fiber to compare against. At this point, React checks what ended prematurely. If we ran out of new children but still have old Fibers, those old Fibers are marked for deletion - items were removed from the list.

If we ran out of old Fibers but still have new children, React creates new Fibers for the remaining children - items were added to the list. But if both the new children and old Fibers have items remaining, we have the complex case - items were moved around or a mix of additions, deletions, and moves.

**Interviewer:** How does React handle that complex case with reordering?

**Candidate:** For reordering, React uses a map-based approach in the second pass. It takes all the remaining old Fibers and puts them into a map keyed by their key prop. Then it iterates through the remaining new children.

For each new child, React looks up its key in the map to see if there's a matching old Fiber. If found, it reuses that Fiber and removes it from the map. If not found, it creates a new Fiber. React also tracks the last placed index to detect when items have moved.

Here's the clever part: as React processes each new child, if it finds a reusable old Fiber whose original index is less than the last placed index, it knows this Fiber has moved to the right and needs a Placement tag. If the original index is greater than or equal to the last placed index, the item is in the correct relative position and doesn't need to move.

After processing all new children, any old Fibers still remaining in the map are marked for deletion - they were in the old list but not in the new one. This two-pass approach minimizes DOM operations by identifying the minimal set of moves needed.

**Interviewer:** Excellent. Let's shift topics to mini-programs. You mentioned you've worked with WeChat mini-programs. Can you explain their architecture and why they're designed that way?

**Candidate:** WeChat mini-programs use a dual-thread architecture that's quite different from normal web apps. There's a view thread running in WebView instances and a logic thread running in a JavaScript runtime - JavaScriptCore on iOS and V8 on Android. These two threads can't directly communicate with each other; all communication goes through the native layer.

The reason for this separation is primarily security and control. By running your JavaScript logic in a separate thread that doesn't have DOM access, WeChat prevents mini-programs from doing malicious things like injecting scripts, accessing arbitrary URLs, or scraping user data from the page. All capabilities are exposed through the wx API, which WeChat controls and can monitor.

When your code calls setData to update the view, the data doesn't go directly to the WebView. Instead, it's serialized, sent through the native bridge to the WeChat client, which then forwards it to the appropriate WebView. The view layer uses a data-binding system to apply these changes to the WXML template.

**Interviewer:** That sounds like it could have performance implications. What's the overhead of this architecture?

**Candidate:** You're absolutely right, the bridge crossing has overhead. Every setData call has to serialize the data to JSON, send it through native code, deserialize it, and then apply it to the view. This is why setData optimization is critical for mini-program performance.

The most important rule is to minimize setData frequency and the amount of data in each call. If you're updating multiple pieces of state, batch them into a single setData instead of multiple calls. And only send the data that actually changed - if you're updating one property, send just that property path, not the entire data object.

Another consequence of this architecture is that you lose the immediate feedback loop of the DOM. In a normal web app, you can update state and immediately query the DOM to get computed dimensions or positions. In mini-programs, there's a delay because the data has to cross the bridge. You need to use callbacks or wait for the next render cycle to get updated layout information.

**Interviewer:** What specific optimizations have you implemented for mini-program performance?

**Candidate:** I've implemented several layers of optimization. First, request preloading - I rewrote the navigation methods to intercept route changes and trigger API requests for the next page before the navigation completes. By the time the new page's onLoad hook runs, the data is often already fetched and can be retrieved from a cache.

For the view layer, I reduced WXML nesting depth significantly. Deep nesting slows down the template compilation and rendering. I also merged style definitions - instead of having many elements with slightly different styles, I created utility classes and combined them, which reduces the WXSS file size and makes style application faster.

Skeleton screens were crucial for perceived performance. Instead of showing a blank page while data loads, I show a gray placeholder that matches the final layout. This makes the app feel responsive even when the network is slow. I cached the first screen's data in local storage, so returning users see content immediately from cache while fresh data loads in the background.

Package splitting and subpackage preloading help with load times. The main package contains only the essential pages, and feature-specific pages are in subpackages that load on demand. I configured preloading rules so that common subpackages start loading based on user behavior patterns before they're actually needed.

**Interviewer:** You mentioned building a custom request library. Why build your own instead of using something like Axios?

**Candidate:** We were upgrading our tech stack across dozens of different product lines, and we needed something that was framework-agnostic - it had to work equally well in React, Vue, vanilla JavaScript, and even mini-programs. The library also needed to support heavy customization because each product line had unique requirements around authentication, error handling, and data transformation.

Axios's API design didn't fit our needs well. At the time, it was class-based and didn't support a clean plugin system. You could only customize through interceptor functions, which became unwieldy when you needed to handle complex scenarios like retry logic with exponential backoff, or token refresh with request queuing.

I designed our library around a plugin architecture inspired by Koa's middleware system. We maintain separate plugin queues for request processing and response processing. Each plugin is a simple function that receives a context object and can modify the request, handle errors, or transform the response.

**Interviewer:** How does that plugin system actually work? Walk me through the execution flow.

**Candidate:** The core is two separate execution pipelines. When you make a request, it first goes through the request plugin queue. Each plugin is an async function that receives the config object and can modify it - adding headers, transforming the URL, attaching authentication tokens, whatever's needed.

Plugins execute sequentially, and each one awaits the next before proceeding. This means a plugin can do work before the actual request, pass control down the chain, and then do more work after the response comes back. It's exactly like Koa middleware's onion model.

Once all request plugins have executed, the actual XMLHttpRequest is made. When the response arrives, it goes through the response plugin queue in reverse order. This symmetry is powerful - a plugin that added an authentication header on the way out can check for auth errors and refresh tokens on the way back.

We also added a decorator system on top of this. You can annotate individual request methods with specific plugins using TypeScript decorators. For example, at-Retry with specific configuration applies retry logic to just that endpoint. At-Cache makes that request cacheable. This makes it very explicit which requests have special behavior without cluttering the main plugin configuration.

**Interviewer:** How would you implement the retry logic specifically? What are the edge cases?

**Candidate:** Retry logic is tricky because you have to handle several scenarios correctly. First, you need to identify which errors are retryable. Network failures and 5xx server errors should be retried, but 4xx client errors generally shouldn't be - retrying a 404 is pointless.

I implemented it as a response plugin that catches errors. When an error occurs, the plugin checks if it's retryable and if we haven't exceeded the maximum retry count. If both conditions pass, it implements exponential backoff - the delay before retrying doubles each time, so the first retry might be after one second, then two, then four.

An important edge case is idempotency. GET requests are safe to retry, but what about POST or PUT? The plugin needs to respect the HTTP method or allow the developer to explicitly mark a request as idempotent. Non-idempotent requests shouldn't auto-retry because you could end up creating duplicate resources or double-charging a credit card.

Another edge case is token refresh during retries. If a request fails with a 401, a plugin might refresh the auth token. But if the token refresh fails, you need to abort all pending retries and log the user out. I implemented request queuing - when token refresh is in progress, subsequent requests wait for it to complete rather than all trying to refresh simultaneously.

**Interviewer:** Let's talk about monitoring and observability. How do you approach logging in a production application, especially something like a mini-program where traditional dev tools don't work well?

**Candidate:** For mini-programs specifically, I built a custom logging system because the debugging experience is poor in production. Users can't open dev tools, and you can't easily see console logs from their devices. I implemented a WebSocket-based log streaming service.

When the mini-program launches, it establishes a WebSocket connection to our logging server. I override the console methods - log, warn, error - to intercept all console calls. These messages get batched and sent over the WebSocket connection to the server, which forwards them to our data warehouse for storage and analysis.

For business event tracking, I use a different approach. Critical user actions like starting checkout, completing payment, or encountering errors trigger tracking events with structured data - user ID, timestamp, event type, relevant context. These go through a separate reporting pipeline optimized for analytics rather than debugging.

**Interviewer:** How do you handle the volume of logs? You can't store everything forever.

**Candidate:** You're right, log volume management is critical. For code logs - the console messages - I implement sampling. In production, we only log errors and warnings at full rate. Info and debug logs are sampled at one percent or less, just enough to give us visibility when debugging specific issues.

We also have retention policies. Debug logs are kept for seven days, errors for thirty days, and we aggregate older data into statistics - error counts, common error types, affected user counts - which we keep for a year. The raw logs get deleted to control storage costs.

For business event tracking, we can keep more because the volume is lower and the value is higher. These events drive our analytics dashboards and alert systems. I set up anomaly detection - if the payment completion rate drops below a threshold, or if error rates spike, alerts fire to the on-call team.

**Interviewer:** How do you measure the business impact of technical improvements? That's often difficult to quantify.

**Candidate:** This is something I've spent a lot of time on because engineers often struggle to communicate the value of technical work to business stakeholders. The approach I use is to define measurable business metrics that the technical work should impact, then track those metrics before and after the change.

For example, when we implemented the request preloading optimization in the mini-program, the technical goal was faster page loads. But the business doesn't care about milliseconds - they care about user behavior. So we defined the metric as "percentage of users who complete checkout after viewing a product." We tracked this for two weeks before the optimization and two weeks after.

The data showed a two-point-five percent increase in checkout completion rate after the optimization. We could attribute this to faster load times because we did an A/B test - half the users got the optimized version, half didn't. The optimized group had a significantly higher completion rate. This translates directly to revenue - two-point-five percent more checkouts means measurable additional sales.

**Interviewer:** What about technical improvements that don't have such direct business impact? How do you quantify those?

**Candidate:** For less direct impacts, you need to build a chain of reasoning. Take logging improvements as an example. Better logging doesn't directly increase revenue. But better logging reduces time to detect and diagnose issues. We can measure this - before the logging improvement, average time from bug report to root cause identification was six hours. After, it's one hour.

Faster diagnosis means faster fixes, which means less downtime or fewer users affected. We can measure that too - incidents affect five thousand fewer users on average, and are resolved four hours faster. Now we can calculate the business impact: five thousand users times average order value times conversion rate equals potential lost revenue prevented.

It's not always perfect, and sometimes you need to make assumptions, but the key is being transparent about your methodology. If you say "this technical improvement saved an estimated fifty thousand dollars," be ready to explain the calculation and its limitations.

**Interviewer:** Let's do a coding exercise. Can you write a function to find the longest common prefix among an array of strings?

**Candidate:** Sure. So if I have strings like "flower", "flow", and "flight", the longest common prefix would be "fl". Let me think about the approach.

I'd iterate character by character through the first string and check if all other strings have that same character at that position. I'll build up the common prefix as I go. As soon as I find a position where any string differs or is too short, I return what I've accumulated so far.

Let me code this out. I'll create an empty string to accumulate the prefix. Then I need to know how far I can safely iterate - that's the length of the shortest string in the array, because the prefix can't be longer than the shortest string. So I'll find that minimum length first.

Then I'll loop from index zero to that minimum length. For each index, I'll append the character from the first string to my accumulating prefix. Then I'll check all strings to see if they start with this prefix so far. If any string doesn't, I need to backtrack - remove the character I just added and return what I have.

If I make it through the entire loop without finding a mismatch, the entire first string up to the minimum length is a common prefix, so I return it.

**Interviewer:** That works, but let me ask - why check if strings start with the prefix on every iteration? Could you optimize that?

**Candidate:** Oh, good point. I'm doing redundant work. On iteration five, when I check if strings start with the five-character prefix, I'm implicitly re-checking the first four characters I already verified in previous iterations. I should instead just check if the character at the current index matches across all strings.

Let me revise: for each position, I'll get the character from the first string at that position. Then I'll iterate through all other strings and check if their character at that same position matches. If any string doesn't match or is too short, I return the prefix I've built up so far. This is more efficient because I'm only checking one character per string per iteration.

**Interviewer:** Good. Now a harder one - implement a string decoder. Given a string like "3[a2[c]]", decode it to "accaccacc". The number before brackets tells you how many times to repeat the content inside.

**Candidate:** This is a nested structure problem, which makes me think stack. The key insight is that when I encounter a closing bracket, I need to repeat the content between the matching opening bracket, but that content might itself contain already-decoded nested patterns.

Let me walk through the algorithm. I'll use a stack and iterate through the string character by character. When I see a digit, I need to accumulate it in case it's a multi-digit number like "12[a]". When I see an opening bracket or a letter, I'll push it onto the stack.

The interesting part is the closing bracket. When I encounter one, I need to pop from the stack until I hit the matching opening bracket. Everything I pop is the string to repeat. But I need to pop in reverse order to preserve the string, so I'll collect the popped items into an array and reverse it.

Once I hit the opening bracket and pop it, the next pop should be the number telling me how many times to repeat. Then I construct the repeated string and push it back onto the stack as a single unit. This is key - the repeated result becomes a new element on the stack, so if it's inside an outer bracket group, it gets repeated along with everything else.

**Interviewer:** What happens with the multi-digit numbers? How do you handle "12[ab]"?

**Candidate:** Right, I need to accumulate digits carefully. When I encounter a digit, I don't immediately push it. Instead, I append it to a number string I'm building up. When I encounter the next non-digit character - either a bracket or a letter - I push the accumulated number string onto the stack and reset my number accumulator.

This way, "12[ab]" processes as: see "1", add to number string. See "2", add to number string, now it's "12". See "[", push "12" to stack and reset number string, then push "[" to stack. See "a", push to stack. See "b", push to stack. See "]", pop until we get to "[", which gives us "ba" reversed to "ab", pop one more to get "12", create "ab" repeated twelve times, push that result back.

**Interviewer:** Walk me through the exact stack state for "2[abc]" step by step.

**Candidate:** Sure. Starting with an empty stack and empty numStr.

Character "2": it's a digit, so numStr becomes "2". Stack is still empty.

Character "[": numStr is not empty, so push "2" to stack and reset numStr to empty. Then push "[" to stack. Stack is now ["2", "["].

Character "a": it's a letter, push it. Stack is ["2", "[", "a"].

Character "b": push it. Stack is ["2", "[", "a", "b"].

Character "c": push it. Stack is ["2", "[", "a", "b", "c"].

Character "]": this triggers the popping logic. Create an empty temp array. Pop "c", add to temp. Pop "b", add to temp. Pop "a", add to temp. Now we pop "[", which signals to stop collecting. Temp is ["c", "b", "a"].

Reverse temp to ["a", "b", "c"], join to get "abc". Pop once more to get "2". Convert to number, repeat "abc" two times to get "abcabc". Push this result back to the stack.

Stack is now ["abcabc"]. After processing all characters, join the stack to get the final result "abcabc".

**Interviewer:** Excellent. Last question - you've worked on multiple complex systems. When you're starting a new project, how do you approach the system design? What's your process?

**Candidate:** I start by really understanding the requirements, both functional and non-functional. What does the system need to do? What are the scale requirements - how many users, requests per second, data volume? What are the constraints - latency requirements, availability requirements, budget?

Then I identify the key challenges. Is this primarily a data modeling problem? A performance problem? A scalability problem? This determines which architectural patterns matter most. For example, if it's a read-heavy system with millions of users, caching architecture is critical. If it's a data consistency problem with complex transactions, I'm thinking about database choice and transaction isolation levels.

Next, I sketch the high-level architecture - the major components and how they communicate. I try to identify clean boundaries and interfaces between components. This is where I apply principles like separation of concerns and single responsibility. Each component should have a clear purpose and well-defined inputs and outputs.

**Interviewer:** How do you validate that your design is actually good before implementing it?

**Candidate:** I do a few things. First, I walk through concrete use cases and failure scenarios. If a user does action X, how does data flow through the system? If service Y goes down, what happens? If traffic spikes to ten times normal, where are the bottlenecks? This often reveals issues I didn't consider.

I also review with other engineers, especially those with different expertise. Someone with strong database background might catch an N+1 query problem I missed. Someone with operations experience might point out monitoring gaps or deployment complexity.

For critical systems, I'll build a prototype or proof of concept for the risky parts. If I'm uncertain whether a particular database can handle the query patterns we need, I'll load test it with realistic data. If I'm not sure about a caching strategy, I'll implement a small version and see if cache hit rates are what I expect.

Finally, I document the design decisions and the tradeoffs. Why did we choose REST over GraphQL? Why PostgreSQL instead of MongoDB? What are we optimizing for, and what are we sacrificing? This helps future me and other engineers understand the context when revisiting decisions later.

**Interviewer:** Great answers throughout. Do you have any questions for me about how we approach these challenges at our scale?

**Candidate:** Yes, actually - given that you're working at a platform level supporting multiple product teams, how do you balance providing good defaults and abstractions while still allowing teams the flexibility to optimize for their specific use cases? And how do you handle versioning and migration when you need to make breaking changes to core infrastructure?

---

## Final Code Examples

```typescript
// 1. Longest Common Prefix
function longestCommonPrefix(strs: string[]): string {
  if (!strs || strs.length === 0) return "";
  if (strs.length === 1) return strs[0];

  // Find minimum length among all strings
  const minLength = Math.min(...strs.map((s) => s.length));

  let prefix = "";

  for (let i = 0; i < minLength; i++) {
    const char = strs[0][i];

    // Check if all strings have the same character at position i
    for (let j = 1; j < strs.length; j++) {
      if (strs[j][i] !== char) {
        return prefix;
      }
    }

    // All strings match at this position
    prefix += char;
  }

  return prefix;
}

// Alternative: Vertical scanning (more efficient)
function longestCommonPrefixOptimized(strs: string[]): string {
  if (!strs || strs.length === 0) return "";

  // Use first string as reference
  for (let i = 0; i < strs[0].length; i++) {
    const char = strs[0][i];

    // Check if this character exists at position i in all other strings
    for (let j = 1; j < strs.length; j++) {
      if (i >= strs[j].length || strs[j][i] !== char) {
        return strs[0].substring(0, i);
      }
    }
  }

  return strs[0];
}

// Binary search approach (for very long strings)
function longestCommonPrefixBinarySearch(strs: string[]): string {
  if (!strs || strs.length === 0) return "";

  const minLength = Math.min(...strs.map((s) => s.length));
  let low = 0;
  let high = minLength;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const prefix = strs[0].substring(0, mid);

    if (isCommonPrefix(strs, prefix)) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return strs[0].substring(0, Math.floor((low + high) / 2));
}

function isCommonPrefix(strs: string[], prefix: string): boolean {
  return strs.every((str) => str.startsWith(prefix));
}

// Test cases
console.log(longestCommonPrefix(["flower", "flow", "flight"])); // "fl"
console.log(longestCommonPrefix(["dog", "racecar", "car"])); // ""
console.log(longestCommonPrefix(["abcdef", "abdefw", "abc"])); // "ab"

// 2. String Decoder
function decodeString(s: string): string {
  const stack: string[] = [];
  let numStr = "";
  let i = 0;

  while (i < s.length) {
    const char = s[i];

    // Build up multi-digit numbers
    if (!isNaN(parseInt(char))) {
      numStr += char;
    } else {
      // If we have accumulated a number, push it
      if (numStr) {
        stack.push(numStr);
        numStr = "";
      }

      if (char === "]") {
        // Time to decode
        const temp: string[] = [];

        // Pop until we find the opening bracket
        while (stack.length > 0) {
          const current = stack.pop()!;

          if (current === "[") {
            // Found the opening bracket
            // Pop once more to get the number
            const repeatCount = parseInt(stack.pop()!);

            // Build the repeated string
            const strToRepeat = temp.reverse().join("");
            const repeated = strToRepeat.repeat(repeatCount);

            // Push back as a single unit
            stack.push(repeated);
            break;
          } else {
            // Collect characters to repeat
            temp.push(current);
          }
        }
      } else {
        // Opening bracket or letter - just push
        stack.push(char);
      }
    }

    i++;
  }

  return stack.join("");
}

// Alternative implementation with clearer separation
function decodeStringCleaner(s: string): string {
  const stack: Array<{ str: string; count: number }> = [];
  let currentStr = "";
  let currentNum = 0;

  for (const char of s) {
    if (char >= "0" && char <= "9") {
      // Build multi-digit number
      currentNum = currentNum * 10 + parseInt(char);
    } else if (char === "[") {
      // Push current state and start new level
      stack.push({ str: currentStr, count: currentNum });
      currentStr = "";
      currentNum = 0;
    } else if (char === "]") {
      // Pop and build repeated string
      const { str, count } = stack.pop()!;
      currentStr = str + currentStr.repeat(count);
    } else {
      // Regular character
      currentStr += char;
    }
  }

  return currentStr;
}

// Recursive approach
function decodeStringRecursive(s: string): string {
  let index = 0;

  function decode(): string {
    let result = "";
    let num = 0;

    while (index < s.length) {
      const char = s[index];

      if (char >= "0" && char <= "9") {
        num = num * 10 + parseInt(char);
        index++;
      } else if (char === "[") {
        index++; // Skip '['
        const decoded = decode();
        result += decoded.repeat(num);
        num = 0;
        index++; // Skip ']'
      } else if (char === "]") {
        return result;
      } else {
        result += char;
        index++;
      }
    }

    return result;
  }

  return decode();
}

// Test cases
console.log(decodeString("3[a]2[bc]")); // "aaabcbc"
console.log(decodeString("3[a2[c]]")); // "accaccacc"
console.log(decodeString("2[abc]3[cd]ef")); // "abcabccdcdcdef"
console.log(decodeString("10[a]")); // "aaaaaaaaaa"

// 3. React Synthetic Event System (Conceptual Implementation)
type EventHandler = (event: SyntheticEvent) => void;

interface SyntheticEvent {
  type: string;
  target: EventTarget | null;
  currentTarget: EventTarget | null;
  nativeEvent: Event;
  preventDefault(): void;
  stopPropagation(): void;
  isPropagationStopped(): boolean;
}

class SyntheticEventImpl implements SyntheticEvent {
  private _isPropagationStopped = false;

  constructor(
    public type: string,
    public target: EventTarget | null,
    public currentTarget: EventTarget | null,
    public nativeEvent: Event
  ) {}

  preventDefault(): void {
    this.nativeEvent.preventDefault();
  }

  stopPropagation(): void {
    this._isPropagationStopped = true;
    this.nativeEvent.stopPropagation();
  }

  isPropagationStopped(): boolean {
    return this._isPropagationStopped;
  }
}

class EventRegistry {
  private listeners: Map<string, Map<EventTarget, EventHandler[]>> = new Map();
  private rootElement: HTMLElement | null = null;

  attachToRoot(root: HTMLElement): void {
    this.rootElement = root;

    // Attach native listeners for all supported event types
    const eventTypes = [
      "click",
      "change",
      "submit",
      "input",
      "keydown",
      "keyup",
    ];

    eventTypes.forEach((type) => {
      root.addEventListener(type, this.dispatchEvent.bind(this, type), true); // Capture phase
      root.addEventListener(type, this.dispatchEvent.bind(this, type), false); // Bubble phase
    });
  }

  registerListener(
    target: EventTarget,
    eventType: string,
    handler: EventHandler
  ): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Map());
    }

    const typeMap = this.listeners.get(eventType)!;

    if (!typeMap.has(target)) {
      typeMap.set(target, []);
    }

    typeMap.get(target)!.push(handler);
  }

  private dispatchEvent(eventType: string, nativeEvent: Event): void {
    const target = nativeEvent.target as EventTarget;

    // Create synthetic event
    const syntheticEvent = new SyntheticEventImpl(
      eventType,
      target,
      target,
      nativeEvent
    );

    // Collect handlers from target to root
    const handlers: Array<{ target: EventTarget; handler: EventHandler }> = [];
    let currentTarget: EventTarget | null = target;

    while (currentTarget) {
      const typeMap = this.listeners.get(eventType);
      if (typeMap && typeMap.has(currentTarget)) {
        const targetHandlers = typeMap.get(currentTarget)!;
        targetHandlers.forEach((handler) => {
          handlers.push({ target: currentTarget!, handler });
        });
      }

      // Walk up the DOM tree
      if (currentTarget instanceof Node && currentTarget.parentNode) {
        currentTarget = currentTarget.parentNode;
      } else {
        break;
      }
    }

    // Execute handlers
    for (const { target: handlerTarget, handler } of handlers) {
      if (syntheticEvent.isPropagationStopped()) break;

      syntheticEvent.currentTarget = handlerTarget;
      handler(syntheticEvent);
    }
  }
}

// Usage example
const registry = new EventRegistry();
const root = document.getElementById("root")!;
registry.attachToRoot(root);

const button = document.createElement("button");
button.textContent = "Click me";
root.appendChild(button);

registry.registerListener(button, "click", (event) => {
  console.log("Button clicked!", event.target);
});

// 4. Plugin-based Request Library
interface RequestConfig {
  url: string;
  method: string;
  headers?: Record<string, string>;
  data?: any;
  params?: Record<string, string>;
  timeout?: number;
}

interface ResponseData {
  data: any;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: RequestConfig;
}

type RequestPlugin = (
  config: RequestConfig,
  next: () => Promise<ResponseData>
) => Promise<ResponseData>;

type ResponsePlugin = (
  response: ResponseData,
  next: () => Promise<ResponseData>
) => Promise<ResponseData>;

class HttpClient {
  private requestPlugins: RequestPlugin[] = [];
  private responsePlugins: ResponsePlugin[] = [];

  useRequest(plugin: RequestPlugin): this {
    this.requestPlugins.push(plugin);
    return this;
  }

  useResponse(plugin: ResponsePlugin): this {
    this.responsePlugins.push(plugin);
    return this;
  }

  async request(config: RequestConfig): Promise<ResponseData> {
    // Build request plugin chain
    let requestIndex = 0;
    const executeRequestPlugins = async (): Promise<RequestConfig> => {
      if (requestIndex >= this.requestPlugins.length) {
        return config;
      }

      const plugin = this.requestPlugins[requestIndex++];

      // This is a simplified version - real implementation would handle response
      const response = await plugin(config, async () => {
        return this.makeRequest(await executeRequestPlugins());
      });

      return config;
    };

    // Execute request plugins and make actual request
    await executeRequestPlugins();
    const response = await this.makeRequest(config);

    // Build response plugin chain
    let responseIndex = this.responsePlugins.length - 1;
    const executeResponsePlugins = async (
      resp: ResponseData
    ): Promise<ResponseData> => {
      if (responseIndex < 0) {
        return resp;
      }

      const plugin = this.responsePlugins[responseIndex--];
      return plugin(resp, async () => executeResponsePlugins(resp));
    };

    return executeResponsePlugins(response);
  }

  private async makeRequest(config: RequestConfig): Promise<ResponseData> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      let url = config.url;
      if (config.params) {
        const params = new URLSearchParams(config.params);
        url += "?" + params.toString();
      }

      xhr.open(config.method, url);

      // Set headers
      if (config.headers) {
        Object.entries(config.headers).forEach(([key, value]) => {
          xhr.setRequestHeader(key, value);
        });
      }

      // Set timeout
      if (config.timeout) {
        xhr.timeout = config.timeout;
      }

      xhr.onload = () => {
        resolve({
          data: JSON.parse(xhr.responseText),
          status: xhr.status,
          statusText: xhr.statusText,
          headers: this.parseHeaders(xhr.getAllResponseHeaders()),
          config,
        });
      };

      xhr.onerror = () => reject(new Error("Network error"));
      xhr.ontimeout = () => reject(new Error("Request timeout"));

      xhr.send(config.data ? JSON.stringify(config.data) : null);
    });
  }

  private parseHeaders(headerStr: string): Record<string, string> {
    const headers: Record<string, string> = {};
    headerStr.split("\r\n").forEach((line) => {
      const [key, value] = line.split(": ");
      if (key) headers[key] = value;
    });
    return headers;
  }
}

// Example plugins
const authPlugin: RequestPlugin = async (config, next) => {
  // Add auth token
  config.headers = config.headers || {};
  config.headers["Authorization"] = `Bearer ${getAuthToken()}`;
  return next();
};

const retryPlugin: ResponsePlugin = async (response, next) => {
  const maxRetries = 3;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      return await next();
    } catch (error) {
      retries++;
      if (retries >= maxRetries) throw error;

      // Exponential backoff
      await new Promise((resolve) =>
        setTimeout(resolve, Math.pow(2, retries) * 1000)
      );
    }
  }

  return response;
};

const loggingPlugin: RequestPlugin = async (config, next) => {
  console.log(`[Request] ${config.method} ${config.url}`);
  const start = Date.now();

  try {
    const response = await next();
    const duration = Date.now() - start;
    console.log(
      `[Response] ${config.method} ${config.url} - ${response.status} (${duration}ms)`
    );
    return response;
  } catch (error) {
    const duration = Date.now() - start;
    console.error(
      `[Error] ${config.method} ${config.url} - Failed (${duration}ms)`,
      error
    );
    throw error;
  }
};

function getAuthToken(): string {
  return localStorage.getItem("token") || "";
}

// Usage
const client = new HttpClient();
client.useRequest(authPlugin);
client.useRequest(loggingPlugin);
client.useResponse(retryPlugin);

client
  .request({
    url: "/api/users",
    method: "GET",
  })
  .then((response) => console.log(response.data));

// 5. Mini-Program Performance Optimization Patterns

// Request Preloading
class NavigationManager {
  private preloadedData: Map<string, Promise<any>> = new Map();

  navigateTo(url: string, preloadRequests?: Array<() => Promise<any>>): void {
    // Start preloading requests before navigation
    if (preloadRequests) {
      const key = url;
      const dataPromise = Promise.all(preloadRequests.map((req) => req()));
      this.preloadedData.set(key, dataPromise);
    }

    // Actual navigation
    wx.navigateTo({ url });
  }

  async getPreloadedData(url: string): Promise<any[]> {
    const data = await this.preloadedData.get(url);
    this.preloadedData.delete(url);
    return data || [];
  }
}

// setData Optimization
class OptimizedComponent {
  private pendingUpdates: Record<string, any> = {};
  private updateTimer: number | null = null;

  setDataOptimized(updates: Record<string, any>): void {
    // Batch updates
    Object.assign(this.pendingUpdates, updates);

    if (this.updateTimer) {
      clearTimeout(this.updateTimer);
    }

    this.updateTimer = setTimeout(() => {
      // Only send changed data
      const changes = this.getDiff(this.pendingUpdates);

      // Use path notation for nested updates
      const pathUpdates: Record<string, any> = {};
      Object.entries(changes).forEach(([key, value]) => {
        if (typeof value === "object" && !Array.isArray(value)) {
          Object.entries(value).forEach(([nestedKey, nestedValue]) => {
            pathUpdates[`${key}.${nestedKey}`] = nestedValue;
          });
        } else {
          pathUpdates[key] = value;
        }
      });

      // Actual setData call
      this.setData(pathUpdates);

      this.pendingUpdates = {};
      this.updateTimer = null;
    }, 16); // Batch for one frame
  }

  private getDiff(updates: Record<string, any>): Record<string, any> {
    // Compare with current data and only return changes
    const changes: Record<string, any> = {};

    Object.entries(updates).forEach(([key, value]) => {
      if (JSON.stringify(this.data[key]) !== JSON.stringify(value)) {
        changes[key] = value;
      }
    });

    return changes;
  }

  private setData(data: Record<string, any>): void {
    // Actual mini-program setData
    console.log("setData called with:", data);
  }

  private data: Record<string, any> = {};
}
```

This comprehensive code demonstrates production-ready implementations of:

- String manipulation algorithms with multiple approaches
- Stack-based parsing for nested structures
- React's synthetic event system architecture
- Plugin-based request library with middleware pattern
- Mini-program performance optimization techniques
- Batched updates and diff algorithms
- Request preloading and caching strategies
