# Front-End System Design — Phần 23: REST vs GraphQL — "Decision Diagram!"

> 📅 2026-03-09 · ⏱ 25 phút đọc
>
> Nguồn: Frontend Masters — Evgenii Ray (Meta, ex-JetBrains)
> Bài: REST vs GraphQL — "GraphQL tax: new client library, caching layer, state manager, +1500KB bundle. Decision diagram: small app → REST. Public API → REST. Read-heavy + limited budget → REST. GraphQL shines in complex apps: trading with 3 protocols unified via subscription + source stream."
> Độ khó: ⭐️⭐️⭐️⭐️ | Core — API architecture decisions!

---

## Mục Lục

| #   | Phần                                    |
| --- | --------------------------------------- |
| 1   | The GraphQL Tax — "What You Pay!"       |
| 2   | Decision Diagram — "More NOs Than YES!" |
| 3   | When GraphQL Shines — "Complex Apps!"   |
| 4   | GraphQL Subscription + Source Stream    |
| 5   | Network Section Summary                 |
| 6   | Tự Code: API Patterns                   |

---

## §1. The GraphQL Tax — "What You Pay!"

> Evgenii: _"When you introduce GraphQL: new client library, new caching layer, new state manager, potential bundle size impact. This is the tax you pay."_

```
GRAPHQL TAX:
═══════════════════════════════════════════════════════════════

  1. New Client Library
     → Apollo Client, urql, Relay
     → ~1,500 KB addition to bundle! 💀

  2. New Caching Layer
     → Client-side cache (Apollo InMemoryCache)
     → Need to manage cache invalidation!

  3. New State Manager
     → Ensures client synced with server
     → Replaces/competes with Redux, Zustand, etc.

  4. Bundle Size Impact
     → +1,500 KB potential increase!
     → Critical for mobile/slow networks!

  "GraphQL is great, but there are use cases
   when you want to fall back to REST." — Evgenii
```

---

## §2. Decision Diagram — "More NOs Than YES!"

> Evgenii: _"I try to draw the decision diagram. [LAUGH] More nos than yes for GraphQL."_

```
REST vs GraphQL DECISION TREE:
═══════════════════════════════════════════════════════════════

  App size?
  ├── Small → REST ✅ (done!)
  │
  └── Medium/Large
       │
       └── Public API?
            ├── YES → REST ✅ (clients expect REST!)
            │
            └── NO
                 │
                 └── Read-heavy requests?
                      ├── YES + Limited budget/small team
                      │    → REST ✅ (use HTTP cache!)
                      │
                      └── Large team / unlimited budget
                           │
                           └── Isomorphic types?
                                │  (server types shared with client?)
                                ├── NO → REST ✅ (too much transformation!)
                                │
                                └── YES
                                     │
                                     └── Bundle size critical?
                                          ├── YES → REST ✅ (+1500KB!)
                                          │
                                          └── NO
                                               │
                                               └── Complex API model?
                                                    │  (different variations
                                                    │   of same object?)
                                                    ├── NO → REST ✅
                                                    │
                                                    └── YES → GraphQL ✅
```

```
DECISION SUMMARY:
═══════════════════════════════════════════════════════════════

  REST wins when:
  ✅ Small apps (don't overcomplicate!)
  ✅ Public API (clients expect REST!)
  ✅ Read-heavy + limited budget (HTTP cache!)
  ✅ No isomorphic types (data transformation needed!)
  ✅ Bundle size critical (+1500KB matter!)
  ✅ Simple API model

  GraphQL wins when:
  ✅ Complex apps with many data variations
  ✅ Large team + budget
  ✅ Isomorphic types (shared server/client types!)
  ✅ Bundle size not critical
  ✅ Multiple data sources to unify

  "More NOs than YES." — Evgenii
```

---

## §3. When GraphQL Shines — "Complex Apps!"

> Evgenii: _"GraphQL provides most value in Complex Apps. Can simplify architecture. Trading app: 3 endpoints, 3 different protocols. Encapsulate complexity with GraphQL subscription."_

```
TRADING APP — WITHOUT GraphQL:
═══════════════════════════════════════════════════════════════

  Component A → fetch('/api/orders')      → Short Polling
  Component B → new WebSocket('/prices')  → WebSocket
  Component C → new EventSource('/updates')→ SSE

  3 different protocols in your codebase! 💀
  3 different patterns! 💀
  3 different error handling strategies! 💀
  Inconsistent code style! 💀
```

```
TRADING APP — WITH GraphQL:
═══════════════════════════════════════════════════════════════

  Component A → subscription { orders }     → Same API! ✅
  Component B → subscription { prices }     → Same API! ✅
  Component C → subscription { updates }    → Same API! ✅

  All use unified GraphQL subscription!
  Internal implementation varies:
  ├── orders:  source stream → Short Polling
  ├── prices:  source stream → WebSocket
  └── updates: source stream → SSE

  Developers use same pattern everywhere!
  Complexity hidden in source stream layer! ✅
```

---

## §4. GraphQL Subscription + Source Stream

> Evgenii: _"Source stream is just interface of the endpoint you utilize. Can implement short polling, WebSockets, or SSE. Developers use same subscription across whole application."_

```
GRAPHQL SOURCE STREAM ARCHITECTURE:
═══════════════════════════════════════════════════════════════

  ┌─── Application Layer ────────────────────┐
  │  Components use:                          │
  │  useSubscription(GET_ORDERS)              │
  │  useSubscription(GET_PRICES)              │
  │  useSubscription(GET_UPDATES)             │
  │  → Unified API! Same code pattern!       │
  └───────────────┬──────────────────────────┘
                  │
  ┌───────────────▼──────────────────────────┐
  │  GraphQL Subscription Layer               │
  │  → Routes to appropriate source stream   │
  └───────────────┬──────────────────────────┘
                  │
  ┌───────────────▼──────────────────────────┐
  │  Source Streams (internal!)               │
  │  ├── OrderStream → Short Polling          │
  │  ├── PriceStream → WebSocket              │
  │  └── UpdateStream → SSE                   │
  └──────────────────────────────────────────┘

  "Encapsulate complexity on internal layer.
   Minimizing different code style,
   maintaining unified code." — Evgenii
```

---

## §5. Network Section Summary

```
NETWORK CONNECTIVITY — COMPLETE SUMMARY:
═══════════════════════════════════════════════════════════════

  Part 20: TCP vs UDP
  → TCP: 3-way handshake, data guaranteed
  → UDP: fast, data loss OK

  Part 20: Long Polling
  → Easy, cheap, desktop only
  → Battery drain, 50KB headers, stateless

  Part 21: Server-Sent Events (SSE)
  → HTTP/2 server push, receive-only antenna
  → Auto-reconnect, no overhead, easy scaling
  → BEST for most real-time use cases! ✅

  Part 22: WebSockets
  → Fastest duplex, but infrastructure nightmare
  → 65K sockets, stateful, battery drain
  → Only for sensors/gaming/trading

  Part 23: REST vs GraphQL
  → REST for most cases (simple, cached, standard)
  → GraphQL for complex apps with unified subscriptions

  RECOMMENDED STACK:
  ┌──────────────────────────────────────┐
  │  Receive data: SSE                   │
  │  Send data: HTTP POST               │
  │  Simple desktop: Long Polling        │
  │  Critical real-time: WebSocket       │
  │  Video/audio: WebRTC                 │
  │  API: REST (simple) / GraphQL (complex) │
  └──────────────────────────────────────┘
```

---

## §6. Tự Code: API Patterns

```javascript
// ═══ REST vs GraphQL DECISION HELPER ═══

function decideAPIStrategy(requirements) {
  const {
    appSize, // 'small' | 'medium' | 'large'
    isPublicAPI,
    isReadHeavy,
    teamSize, // 'small' | 'large'
    isomorphicTypes,
    bundleSizeCritical,
    complexAPIModel,
  } = requirements;

  // Decision tree (more NOs than YES!)
  if (appSize === "small") return "REST";
  if (isPublicAPI) return "REST";
  if (isReadHeavy && teamSize === "small") return "REST";
  if (!isomorphicTypes) return "REST";
  if (bundleSizeCritical) return "REST";
  if (!complexAPIModel) return "REST";

  return "GraphQL"; // Only when ALL conditions met!
}

// ═══ UNIFIED DATA LAYER (GraphQL-like pattern without GraphQL!) ═══

class DataLayer {
  #streams = new Map();

  registerStream(name, sourceStream) {
    this.#streams.set(name, sourceStream);
  }

  subscribe(name, callback) {
    const stream = this.#streams.get(name);
    if (!stream) throw new Error(`Stream ${name} not found!`);
    return stream.subscribe(callback);
  }
}

// Source stream implementations:
class SSEStream {
  #url;
  #source;

  constructor(url) {
    this.#url = url;
  }

  subscribe(callback) {
    this.#source = new EventSource(this.#url);
    this.#source.onmessage = (e) => callback(JSON.parse(e.data));
    return () => this.#source.close();
  }
}

class PollingStream {
  #url;
  #interval;
  #timer;

  constructor(url, interval = 20000) {
    this.#url = url;
    this.#interval = interval;
  }

  subscribe(callback) {
    const poll = async () => {
      const res = await fetch(this.#url);
      callback(await res.json());
    };
    poll();
    this.#timer = setInterval(poll, this.#interval);
    return () => clearInterval(this.#timer);
  }
}

// Usage (unified API, different protocols internally!):
const dataLayer = new DataLayer();
dataLayer.registerStream("orders", new PollingStream("/api/orders"));
dataLayer.registerStream("prices", new SSEStream("/api/prices/stream"));

// Components use SAME pattern:
const unsub1 = dataLayer.subscribe("orders", (data) => renderOrders(data));
const unsub2 = dataLayer.subscribe("prices", (data) => renderPrices(data));

// "Minimizing different code style,
//  maintaining unified code!" — Evgenii

console.log("═══ REST vs GraphQL ═══");
console.log("GraphQL tax: library + cache + state + 1500KB!");
console.log("REST wins: small apps, public API, read-heavy, budget!");
console.log("GraphQL wins: complex apps, many data variations!");
console.log("GraphQL source streams: unify 3 protocols into 1 API!");
```

---

## Checklist

```
[ ] GraphQL tax: client lib + cache + state manager + 1500KB!
[ ] Small app → REST (no need for complexity!)
[ ] Public API → REST (clients expect it!)
[ ] Read-heavy + limited budget → REST (HTTP cache!)
[ ] No isomorphic types → REST (too much transformation!)
[ ] Bundle size critical → REST (+1500KB matters!)
[ ] Complex API model + variations → GraphQL!
[ ] GraphQL subscription + source stream pattern!
[ ] Source stream: interface abstracting protocol (poll/SSE/WS)!
[ ] Unified code pattern for developers!
[ ] "More NOs than YES for GraphQL." — Evgenii
TIẾP THEO → Phần 24: Performance Optimization!
```
