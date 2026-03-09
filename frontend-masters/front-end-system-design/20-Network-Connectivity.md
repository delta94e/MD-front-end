# Front-End System Design — Phần 20: Network Connectivity — "UDP vs TCP, HTTP, WebSockets, SSE, Long Polling!"

> 📅 2026-03-09 · ⏱ 35 phút đọc
>
> Nguồn: Frontend Masters — Evgenii Ray (Meta, ex-JetBrains)
> Bài: Network Connectivity — "UDP (speed, data loss OK) vs TCP (3-way handshake, data validity). HTTP 1.1/2 (TCP), WebSockets (TCP upgrade), SSE (HTTP/2 push), HTTP/3 (QUIC = UDP!). Long polling: easy but drains battery (4h to drain 2000mAh!), re-handshake on tower switch. Good for desktop, bad for mobile!"
> Độ khó: ⭐️⭐️⭐️⭐️ | Core — network protocols, real-time communication!

---

## Mục Lục

| #   | Phần                                      |
| --- | ----------------------------------------- |
| 1   | The Problem — "Shop Admin App!"           |
| 2   | UDP vs TCP — "Speed vs Validity!"         |
| 3   | Protocol Family Tree                      |
| 4   | Long Polling — "Easy but Battery Killer!" |
| 5   | Problem 1: CPU & Energy Drain             |
| 6   | Problem 2: Latency on Mobile              |
| 7   | Problem 3: Stateless Reconnection         |
| 8   | Long Polling Summary                      |
| 9   | Tự Code: Protocol Patterns                |

---

## §1. The Problem — "Shop Admin App!"

> Evgenii: _"Building Shop Administration app with two endpoints: track new orders and chat with employees. What technologies would we use?"_

```
SHOP ADMIN APP:
═══════════════════════════════════════════════════════════════

  Endpoint 1: Track New Orders
  → Need real-time updates
  → Server pushes new order notifications
  → "How do we get updates from server?"

  Endpoint 2: Chat with Employees
  → Bidirectional communication
  → Send and receive messages
  → Low latency required!

  Which protocol for each?
  → Let's explore the options!
```

---

## §2. UDP vs TCP — "Speed vs Validity!"

> Evgenii: _"UDP doesn't guarantee package received in full — some data loss. Used in video streaming. TCP ensures data received in full — 3-way handshake. TCP is slower because of 3 network trips."_

```
UDP vs TCP:
═══════════════════════════════════════════════════════════════

  UDP (User Datagram Protocol):
  Client ──── data ────→ Server
         ← response ────
  → NO guarantee data received!
  → Data loss possible!
  → FAST (no handshake!)
  → Use: video streaming, gaming

  TCP (Transmission Control Protocol):
  Client ─── SYN ──────→ Server     (1. "I want to connect!")
         ← SYN-ACK ────             (2. "I can connect too!")
         ─── ACK ──────→            (3. "Let's talk!")
         ─── REQUEST ──→            (4. Actual data!)
  → GUARANTEES data received!
  → 3-way handshake = 3 network trips!
  → SLOWER than UDP!
  → Use: web, chat, file transfer
```

```
3-WAY HANDSHAKE:
═══════════════════════════════════════════════════════════════

  Client                    Server
    │                         │
    │──── SYN ───────────────→│  "Hey, I want to connect!"
    │                         │
    │←── SYN-ACK ────────────│  "OK, I can connect too!"
    │                         │
    │──── ACK ───────────────→│  "Great, let's talk!"
    │                         │
    │──── REQUEST ───────────→│  "Give me the data!"
    │                         │
    │←── RESPONSE ───────────│  "Here's your data!"
    │                         │

  3 trips before ANY data sent!
  "TCP is generally slower than UDP." — Evgenii
```

---

## §3. Protocol Family Tree

> Evgenii: _"HTTP 1.1 based on TCP. HTTP/2 also TCP. WebSockets use HTTP 1 to initiate, then upgrade to TCP. SSE based on HTTP/2. HTTP/3 based on QUIC which uses UDP. We're moving from TCP to UDP!"_

```
PROTOCOL FAMILY TREE:
═══════════════════════════════════════════════════════════════

  TCP                              UDP
   │                                │
   ├── HTTP/1.1                     ├── QUIC (Google!)
   │    │                           │    │
   │    └── HTTP/2                  │    └── HTTP/3 (future!)
   │         │                      │
   │         └── SSE (Server-Sent)  └── WebRTC (streaming!)
   │
   ├── WebSockets
   │    (HTTP/1 handshake → upgrade to raw TCP!)
   │
   └── HTTP/2
        └── SSE (Server Push)

  "We are moving from TCP to UDP soon
   for HTTP/3 protocol." — Evgenii
```

```
PROTOCOL COMPARISON:
═══════════════════════════════════════════════════════════════

  | Protocol     | Base | Direction        | Use Case           |
  |-------------|------|------------------|--------------------|
  | HTTP/1.1    | TCP  | Request/Response | REST APIs          |
  | HTTP/2      | TCP  | Multiplexed      | Modern web         |
  | HTTP/3      | UDP  | Multiplexed      | Future web!        |
  | WebSockets  | TCP  | Bidirectional!   | Chat, real-time    |
  | SSE         | HTTP/2| Server → Client | Notifications      |
  | WebRTC      | UDP  | Peer-to-peer     | Video/audio stream |
```

---

## §4. Long Polling — "Easy but Battery Killer!"

> Evgenii: _"Long polling: normal GET call every specified timeframe, e.g. every 20 seconds. Very easy to implement — just setInterval + fetch."_

```javascript
// Long Polling: simple but problematic!
async function longPoll() {
  setInterval(async () => {
    const response = await fetch("/api/new-orders");
    const orders = await response.json();
    if (orders.length > 0) {
      renderNewOrders(orders);
    }
  }, 20000); // Every 20 seconds!
}
```

```
LONG POLLING:
═══════════════════════════════════════════════════════════════

  Client                    Server
    │                         │
    │── GET /orders ─────────→│  (handshake + request)
    │←── response ───────────│
    │                         │
    │   ... 20 seconds ...    │
    │                         │
    │── GET /orders ─────────→│  (handshake AGAIN!)
    │←── response ───────────│
    │                         │
    │   ... 20 seconds ...    │
    │                         │
    │── GET /orders ─────────→│  (handshake AGAIN!)
    │←── response ───────────│

  Every 20s: new TCP socket + 3-way handshake + headers!
```

---

## §5. Problem 1: CPU & Energy Drain

> Evgenii: _"TCP socket takes CPU and drains energy. Mobile network module has two modes: receive-only (energy efficient) and duplex (send+receive, not efficient). 2000mAh battery: only 4 hours maintaining one socket!"_

```
MOBILE ANTENNA MODES:
═══════════════════════════════════════════════════════════════

  Mode 1: Receive Only (idle)
  → Very energy efficient!
  → Can only receive data
  → Phone mostly in this mode

  Mode 2: Duplex (active)
  → Send AND receive data!
  → NOT energy efficient!
  → Activated during long polling!

  Long polling keeps antenna in DUPLEX mode!
  → Constant energy drain! 💀

  EXPERIMENT:
  2000 mAh battery + 1 TCP socket maintained
  → Only ~4 HOURS to drain full battery!
  "Just maintaining one socket opened!" — Evgenii
```

```
HEADER OVERHEAD:
═══════════════════════════════════════════════════════════════

  HTTP/1.1: headers NOT compressed!
  → Each request sends ~50KB of header data!
  → Every 20s: 50KB × 3 requests/min = 150KB/min wasted!

  HTTP/2: headers compressed!
  → Better, but still need 3-way handshake!

  "You may end up sending 50 kilobytes every request
   of just header data." — Evgenii
```

---

## §6. Problem 2: Latency on Mobile

> Evgenii: _"On fast train, lose connection, reconnect to new network tower. Need to re-establish connection, re-handshake. Multiple tower switches = significant latency increase."_

```
MOBILE TOWER SWITCHING:
═══════════════════════════════════════════════════════════════

  Tower A          Tower B          Tower C
    🗼               🗼               🗼
    │                │                │
    │← connected    │                │
    │  (handshake)  │                │
    │               │                │
    │── lost! ──→   │← reconnect!   │
    │               │  (handshake)  │
    │               │               │
    │               │── lost! ──→   │← reconnect!
    │               │               │  (handshake)
    │               │               │
    │               │               │

  Each switch: NEW 3-way handshake! 💀
  Fast train: many switches = HIGH latency!
```

---

## §7. Problem 3: Stateless Reconnection

> Evgenii: _"REST API is stateless. You lose state, need to re-implement reconnection infrastructure on server side. For mobile apps, long polling costs MORE money to support long-term."_

```
STATELESS PROBLEM:
═══════════════════════════════════════════════════════════════

  Request 1: GET /orders → Server knows nothing about client!
  Request 2: GET /orders → Server knows nothing again!

  Each request is independent:
  → No session memory
  → Need reconnection infrastructure
  → Need to track "last seen order" manually
  → "Costs more to support money wise." — Evgenii
```

---

## §8. Long Polling Summary

> Evgenii: _"Long polling: very easy, cheap, no additional infrastructure — for desktop apps. Not battery efficient, not network efficient for mobile. Consider different technique for mobile web."_

```
LONG POLLING SUMMARY:
═══════════════════════════════════════════════════════════════

  ✅ PROS:
  • Very easy to implement (setInterval + fetch!)
  • Cheap, no additional infrastructure
  • Works great for desktop apps
  • No special server setup needed

  ❌ CONS:
  • Not battery efficient (duplex antenna!)
  • Not network efficient (50KB headers × every request!)
  • High latency on mobile (tower switching!)
  • Stateless (need reconnection infrastructure!)
  • HTTP/1: even worse (uncompressed headers!)

  USE CASES:
  ✅ Desktop apps (no battery/network concerns!)
  ✅ Low-frequency updates (every few minutes!)
  ✅ Simple prototypes, MVPs

  ❌ AVOID FOR:
  ❌ Mobile web apps (battery drain!)
  ❌ Real-time chat (latency!)
  ❌ High-frequency updates!
```

---

## §9. Tự Code: Protocol Patterns

```javascript
// ═══ LONG POLLING (Desktop) ═══

class LongPoller {
  #interval;
  #url;
  #onData;
  #pollInterval;

  constructor(url, onData, intervalMs = 20000) {
    this.#url = url;
    this.#onData = onData;
    this.#pollInterval = intervalMs;
  }

  start() {
    // Initial fetch
    this.#poll();

    // Set interval
    this.#interval = setInterval(() => {
      this.#poll();
    }, this.#pollInterval);

    return this;
  }

  async #poll() {
    try {
      const response = await fetch(this.#url);
      const data = await response.json();
      if (data && data.length > 0) {
        this.#onData(data);
      }
    } catch (error) {
      console.error("Poll failed:", error);
      // Could implement retry logic here
    }
  }

  stop() {
    clearInterval(this.#interval);
  }
}

// Usage (desktop only!):
const poller = new LongPoller("/api/new-orders", (orders) => {
  orders.forEach((order) => renderOrder(order));
});
poller.start();

// ═══ PROTOCOL SELECTOR ═══

function selectProtocol(requirements) {
  const { isMobile, isRealTime, isBidirectional, frequency } = requirements;

  if (isBidirectional) {
    return "WebSocket"; // Chat, collaborative editing
  }

  if (isRealTime && !isBidirectional) {
    return "SSE"; // Server-sent events, notifications
  }

  if (isMobile && frequency === "high") {
    return "WebSocket"; // Avoid long polling on mobile!
  }

  if (!isMobile && frequency === "low") {
    return "Long Polling"; // Simple, cheap for desktop!
  }

  return "SSE"; // Default: server push
}

// Examples:
selectProtocol({
  isMobile: false,
  isRealTime: false,
  isBidirectional: false,
  frequency: "low",
}); // → 'Long Polling' (desktop order tracking!)

selectProtocol({
  isMobile: true,
  isRealTime: true,
  isBidirectional: true,
  frequency: "high",
}); // → 'WebSocket' (mobile chat!)

console.log("═══ NETWORK CONNECTIVITY ═══");
console.log("UDP: fast, data loss OK (video streaming!)");
console.log("TCP: 3-way handshake, data guaranteed!");
console.log("Long polling: easy but battery killer on mobile!");
console.log("HTTP/1: 50KB headers uncompressed per request!");
console.log("Mobile antenna duplex = energy drain!");
console.log("Desktop: long polling OK. Mobile: use WebSocket/SSE!");
```

---

## Checklist

```
[ ] UDP: fast, no delivery guarantee, video streaming!
[ ] TCP: 3-way handshake (SYN → SYN-ACK → ACK), data guaranteed!
[ ] HTTP/1.1, HTTP/2: TCP-based!
[ ] HTTP/3: QUIC (UDP-based!) — future of web!
[ ] WebSockets: HTTP/1 → upgrade to raw TCP, bidirectional!
[ ] SSE: HTTP/2 server push, one-directional!
[ ] WebRTC: UDP, peer-to-peer streaming!
[ ] Long polling: setInterval + fetch, easy but problems:
[ ]   - Battery drain (duplex antenna, 4h to drain 2000mAh!)
[ ]   - HTTP/1 headers: 50KB uncompressed per request!
[ ]   - Mobile tower switching = re-handshake = latency!
[ ]   - Stateless REST = reconnection infrastructure needed!
[ ] Long polling OK for desktop, BAD for mobile!
TIẾP THEO → Phần 21!
```
