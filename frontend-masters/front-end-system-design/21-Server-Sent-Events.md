# Front-End System Design — Phần 21: Server-Sent Events — "Server Push, Battery Efficient, Auto-Reconnect!"

> 📅 2026-03-09 · ⏱ 25 phút đọc
>
> Nguồn: Frontend Masters — Evgenii Ray (Meta, ex-JetBrains)
> Bài: Server-Sent Events — "HTTP/2-based server push. Duplex antenna only for initial handshake, then receive-only mode = battery efficient! Auto-reconnection on protocol level. HTTP/2 multiplexing = 200 requests in 1 TCP socket. No overhead headers. Easy horizontal scaling. Cons: can't push to server, string only."
> Độ khó: ⭐️⭐️⭐️⭐️ | Core — server push, real-time, mobile-friendly!

---

## Mục Lục

| #   | Phần                                              |
| --- | ------------------------------------------------- |
| 1   | What Is SSE? — "Server Push Technology!"          |
| 2   | SSE vs Long Polling — "Receive Only Mode!"        |
| 3   | Auto-Reconnection — "Protocol Level!"             |
| 4   | Horizontal Scaling — "Easy!"                      |
| 5   | HTTP/2 Multiplexing — "200 Requests in 1 Socket!" |
| 6   | SSE Summary — Pros, Cons, Use Cases               |
| 7   | Tự Code: SSE Patterns                             |

---

## §1. What Is SSE? — "Server Push Technology!"

> Evgenii: _"Server-Sent Events is server-push technology based on HTTP/2. Establish connection, then server pushes data to client."_

```
SERVER-SENT EVENTS:
═══════════════════════════════════════════════════════════════

  Client                        Server
    │                             │
    │── 3-way handshake ────────→│  (duplex mode, one time!)
    │←─────────────────────────│
    │                             │
    │  (switch to receive-only!)  │
    │                             │
    │←──── event: new-order ─────│  Server PUSHES data!
    │←──── event: new-order ─────│  Server PUSHES data!
    │←──── event: update ────────│  Server PUSHES data!
    │←──── event: new-order ─────│  Server PUSHES data!
    │                             │

  One-directional: Server → Client only!
  Client CANNOT push data to server! (use fetch for that!)
```

---

## §2. SSE vs Long Polling — "Receive Only Mode!"

> Evgenii: _"Duplex antenna used only for initial 3-way handshake. Rest of connection is server push — receive-only mode. Won't drain battery!"_

```
SSE vs LONG POLLING:
═══════════════════════════════════════════════════════════════

  Long Polling:
  ┌── Request ──→ ┌── Response ──→ (repeat!)
  │  DUPLEX mode  │  DUPLEX mode
  │  Send + Recv  │  Send + Recv
  │  ENERGY DRAIN!│  ENERGY DRAIN!
  └───────────────┘───────────────

  Server-Sent Events:
  ┌── Handshake ──→ ┌── Receive only! ──→ (continuous!)
  │  DUPLEX mode    │  RECEIVE ONLY mode
  │  (1 time only!) │  Energy efficient! ✅
  └─────────────────┘─────────────────────

  Long Polling: duplex antenna ALL the time! 💀
  SSE: duplex ONCE, then receive-only! ✅

  "In case of SSE, the duplex antenna is not used.
   We only use receive-only mode." — Evgenii
```

```
NO OVERHEAD DATA:
═══════════════════════════════════════════════════════════════

  Long Polling (every 20s):
  → 3-way handshake (3 trips!)
  → Send HTTP headers (50KB on HTTP/1!)
  → Receive response
  → Total: handshake + headers + data

  SSE (continuous):
  → Handshake once!
  → No headers per event!
  → Receive ONLY content data!
  → "Doesn't send any overhead data—
     receive only data that relates to content." — Evgenii
```

---

## §3. Auto-Reconnection — "Protocol Level!"

> Evgenii: _"Huge difference: reconnection implemented on protocol level. You don't need to handle that infrastructure-wise. You can always resume from where you started."_

```
AUTO-RECONNECTION:
═══════════════════════════════════════════════════════════════

  Long Polling (manual reconnection):
  Connection lost →
    Developer must implement retry logic!
    Developer must track "last seen" state!
    Developer must build infrastructure!
    "Costs more money to support." — Evgenii

  SSE (automatic reconnection):
  Connection lost →
    EventSource automatically reconnects!
    Resumes from where it stopped!
    Browser handles it! ✅
    No extra infrastructure needed!

  "Reconnection is implemented on protocol level.
   You can always resume from the place
   where you started." — Evgenii
```

---

## §4. Horizontal Scaling — "Easy!"

> Evgenii: _"Very easy to scale. If one server instance dies, forward request to separate instance. Because we can resume from previous place, doesn't matter which instance responds."_

```
HORIZONTAL SCALING:
═══════════════════════════════════════════════════════════════

  Server Instance A ──── dies! ✕
           │
  Client ──┤── reconnect → Server Instance B ✅
           │                → Resume from last event!
           │
  Server Instance C (standby)

  SSE: doesn't matter WHICH instance responds!
  → Resume from last event ID!
  → Easy load balancing! ✅
  → "Very easy to scale." — Evgenii

  Long Polling: stateless REST → need session tracking!
  → Much harder to scale! ❌
```

---

## §5. HTTP/2 Multiplexing — "200 Requests in 1 Socket!"

> Evgenii: _"HTTP/2 has multiplexing feature: open 200 requests within one single TCP socket. While HTTP/1 needs 5 TCP connections for 5 resources."_

```
HTTP/1.1 vs HTTP/2 MULTIPLEXING:
═══════════════════════════════════════════════════════════════

  HTTP/1.1 (5 resources = 5 TCP connections!):
  Client ─── TCP Socket 1 ──→ /api/orders
  Client ─── TCP Socket 2 ──→ /api/users
  Client ─── TCP Socket 3 ──→ /api/products
  Client ─── TCP Socket 4 ──→ /static/style.css
  Client ─── TCP Socket 5 ──→ /static/app.js
  → 5 sockets × handshake = SLOW! 💀

  HTTP/2 (5 resources = 1 TCP connection!):
  Client ─── TCP Socket 1 ──→ /api/orders
                             → /api/users
                             → /api/products
                             → /static/style.css
                             → /static/app.js
  → 1 socket, multiplexed! ✅
  → Up to 200 requests in 1 socket!

  "While in HTTP/1 to fetch 5 resources you have to
   open 5 TCP connections." — Evgenii
```

---

## §6. SSE Summary — Pros, Cons, Use Cases

> Evgenii: _"SSE: auto-reconnect, battery efficient, no overhead, easy scaling. Cons: can't push to server, string data only. Good for both desktop AND mobile. Performance comparable to WebSockets."_

```
SSE SUMMARY:
═══════════════════════════════════════════════════════════════

  ✅ PROS:
  • Auto-reconnection (protocol level!)
  • Battery efficient (receive-only antenna!)
  • No overhead headers (content data only!)
  • Easy horizontal scaling
  • Performance ≈ WebSockets!
  • Good for both desktop AND mobile!

  ❌ CONS:
  • Can't push data TO server (one-directional!)
  • String data only (need to parse text!)
  • Overkill for simple desktop apps

  USE CASES:
  ✅ Desktop AND mobile apps!
  ✅ Real-time notifications, order tracking!
  ✅ Streaming large text data (AI responses!)
  ✅ News feeds, stock tickers

  ❌ AVOID:
  ❌ Simple desktop apps (long polling is fine!)
  ❌ Need bidirectional (use WebSockets!)
  ❌ Binary data streaming (use WebSockets!)
```

```
COMPARISON TABLE:
═══════════════════════════════════════════════════════════════

  | Feature        | Long Polling | SSE          |
  |----------------|-------------|--------------|
  | Direction      | Req/Res     | Server→Client|
  | Auto-reconnect | Manual! ❌  | Built-in! ✅  |
  | Battery        | Drains! 💀  | Efficient! ✅ |
  | Headers        | Every req!  | None! ✅      |
  | Scaling        | Hard        | Easy! ✅      |
  | Bidirectional  | No          | No           |
  | Data types     | Any         | String only  |
  | Mobile         | Bad ❌      | Good ✅       |
  | Desktop        | Easy ✅     | Good ✅       |
```

---

## §7. Tự Code: SSE Patterns

```javascript
// ═══ SERVER-SENT EVENTS (Browser API) ═══

// 1. Basic SSE connection
const eventSource = new EventSource("/api/orders/stream");

// Listen for events
eventSource.onmessage = (event) => {
  const order = JSON.parse(event.data); // String → Object!
  renderNewOrder(order);
};

// Named events
eventSource.addEventListener("new-order", (event) => {
  const order = JSON.parse(event.data);
  console.log("New order:", order);
});

eventSource.addEventListener("order-update", (event) => {
  const update = JSON.parse(event.data);
  console.log("Order updated:", update);
});

// Auto-reconnection is BUILT-IN!
eventSource.onerror = (error) => {
  console.log("Connection lost, auto-reconnecting...");
  // Browser handles reconnection automatically! ✅
};

// Close connection when done
eventSource.close();

// ═══ SSE MANAGER (Production-ready) ═══

class SSEManager {
  #sources = new Map();

  subscribe(channel, url, handlers = {}) {
    if (this.#sources.has(channel)) {
      this.unsubscribe(channel); // Prevent duplicates!
    }

    const source = new EventSource(url);

    // Default message handler
    source.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handlers.onMessage?.(data);
    };

    // Error handler (auto-reconnect is built-in!)
    source.onerror = () => {
      handlers.onError?.();
      // EventSource reconnects automatically!
    };

    // Named event handlers
    if (handlers.events) {
      for (const [eventName, handler] of Object.entries(handlers.events)) {
        source.addEventListener(eventName, (event) => {
          handler(JSON.parse(event.data));
        });
      }
    }

    this.#sources.set(channel, source);
    return this;
  }

  unsubscribe(channel) {
    const source = this.#sources.get(channel);
    if (source) {
      source.close();
      this.#sources.delete(channel);
    }
  }

  unsubscribeAll() {
    for (const [channel] of this.#sources) {
      this.unsubscribe(channel);
    }
  }
}

// Usage:
const sse = new SSEManager();

sse.subscribe("orders", "/api/orders/stream", {
  onMessage: (order) => renderOrder(order),
  onError: () => showReconnecting(),
  events: {
    "new-order": (order) => showNotification(order),
    "order-cancelled": (order) => removeOrder(order),
  },
});

// ═══ SSE SERVER (Node.js example) ═══

// Express server sending SSE:
function setupSSE(app) {
  app.get("/api/orders/stream", (req, res) => {
    // SSE headers!
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    // Send event
    function sendEvent(eventName, data) {
      res.write(`event: ${eventName}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    }

    // Send new orders periodically
    const interval = setInterval(() => {
      sendEvent("new-order", {
        id: Date.now(),
        product: "Widget",
        quantity: 1,
      });
    }, 5000);

    // Cleanup on disconnect
    req.on("close", () => {
      clearInterval(interval);
    });
  });
}

console.log("═══ SERVER-SENT EVENTS ═══");
console.log("HTTP/2 server push technology!");
console.log("Receive-only antenna = battery efficient!");
console.log("Auto-reconnect built into protocol!");
console.log("No overhead headers per event!");
console.log("HTTP/2 multiplexing: 200 reqs in 1 TCP socket!");
console.log("Easy horizontal scaling!");
console.log("Performance ≈ WebSockets for server→client!");
```

---

## Checklist

```
[ ] SSE = HTTP/2-based server push technology!
[ ] Duplex antenna only for initial handshake!
[ ] Rest of connection = receive-only mode = battery efficient!
[ ] Auto-reconnection on protocol level (no manual infra!)
[ ] Resume from where you stopped!
[ ] Easy horizontal scaling (any instance can respond!)
[ ] HTTP/2 multiplexing: 200 requests in 1 TCP socket!
[ ] No overhead headers (content data only!)
[ ] Cons: can't push TO server (one-directional!)
[ ] Cons: string data only (parse JSON manually!)
[ ] Good for desktop AND mobile!
[ ] Performance comparable to WebSockets!
[ ] Use for: notifications, order tracking, AI streaming!
[ ] Avoid for: simple desktop (long polling OK), bidirectional!
TIẾP THEO → Phần 22: WebSockets!
```
