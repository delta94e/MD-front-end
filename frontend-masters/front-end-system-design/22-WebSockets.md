# Front-End System Design — Phần 22: WebSockets — "Fastest Duplex, but Infrastructure Nightmare!"

> 📅 2026-03-09 · ⏱ 30 phút đọc
>
> Nguồn: Frontend Masters — Evgenii Ray (Meta, ex-JetBrains)
> Bài: WebSockets — "Fastest duplex. HTTP/1 handshake → upgrade to TCP. 65,000 TCP socket limit. Very expensive infrastructure. Stateful = lose state on disconnect. Use SSE + POST instead of WebSocket for chat! WebSocket only for sensors, gaming, trading, precise location."
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Advanced — "Think twice before using WebSockets!"

---

## Mục Lục

| #   | Phần                                                      |
| --- | --------------------------------------------------------- |
| 1   | What Is WebSocket? — "HTTP/1 → Upgrade to TCP!"           |
| 2   | The Problem — "65,000 Sockets, Infrastructure Nightmare!" |
| 3   | Stateful — "Lose Connection = Lose State!"                |
| 4   | When to Use WebSockets — "Think Twice!"                   |
| 5   | Shop Admin App — "What Protocol for Each?"                |
| 6   | Q&A — "Chat, Notion, Media Files"                         |
| 7   | Protocol Decision Guide                                   |
| 8   | Tự Code: WebSocket Patterns                               |

---

## §1. What Is WebSocket? — "HTTP/1 → Upgrade to TCP!"

> Evgenii: _"Fastest way to transfer data. Client sends handshake via HTTP/1, server sends upgrade response. After upgrade, communication uses TCP instead of HTTP."_

```
WEBSOCKET CONNECTION:
═══════════════════════════════════════════════════════════════

  Client                          Server
    │                               │
    │── HTTP/1 Handshake ──────────→│  "I want WebSocket!"
    │                               │
    │←── Upgrade: websocket ───────│  "OK, upgrade to TCP!"
    │                               │
    │══ TCP Connection (duplex!) ══│
    │                               │
    │──── data ───────────────────→│  Client pushes!
    │←──── data ──────────────────│  Server pushes!
    │──── data ───────────────────→│  Bidirectional!
    │←──── data ──────────────────│  Real-time!
    │                               │

  After upgrade: pure TCP, no HTTP overhead!
  Both sides can push data ANYTIME! ✅
  "Fastest way to transfer data." — Evgenii
```

---

## §2. The Problem — "65,000 Sockets, Infrastructure Nightmare!"

> Evgenii: _"65,000 TCP socket limit per server. TCP socket takes lots of CPU. Need very good investment in server infrastructure. Money incomparable to SSE."_

```
WEBSOCKET INFRASTRUCTURE COST:
═══════════════════════════════════════════════════════════════

  1 WebSocket connection = 1 TCP socket!
  1 server = max 65,000 TCP sockets!
  Each socket = CPU + memory!

  500,000 users online?
  → Need 500,000 / 65,000 ≈ 8 servers minimum!
  → Each server maintaining 65K sockets!
  → CPU + memory × 65K = EXPENSIVE! 💀

  "Very resource-consuming. 65,000 TCP socket limit.
   TCP socket takes a lot of CPU to be maintained.
   Very good investment in server infrastructure needed.
   Money incomparable to SSE." — Evgenii

  ENERGY DRAIN:
  → Duplex antenna (send + receive!)
  → Will REALLY drain battery fast!
  → "It drains energy and utilize CPU a lot." — Evgenii
```

---

## §3. Stateful — "Lose Connection = Lose State!"

> Evgenii: _"WebSockets are stateful. Lose connection = lose all data stored within socket. Need separate infrastructure to store state in database."_

```
STATEFUL PROBLEM:
═══════════════════════════════════════════════════════════════

  SSE (stateless):
  Connection lost → auto-reconnect → resume! ✅
  Any server instance can respond!

  WebSocket (stateful!):
  Connection lost → ALL STATE LOST! 💀
  Need to:
  1. Store state in separate database!
  2. Restore state on reconnect!
  3. Maintain sync infrastructure!
  4. Handle partial data loss!

  "Once you lose connection, you lose all data
   stored within the socket. Need separate
   infrastructure for state." — Evgenii
```

---

## §4. When to Use WebSockets — "Think Twice!"

> Evgenii: _"If you think WebSocket is good, think twice! Very big investment for business."_

```
WEBSOCKET USE CASES:
═══════════════════════════════════════════════════════════════

  ✅ USE WebSockets ONLY for:
  • Machine sensors (real-time data gathering!)
  • Online gaming (precise timing!)
  • Trading/micro-trading (timing-critical!)
  • Precise location tracking
  • 500,000+ connections in parallel

  ❌ DO NOT use for:
  • Chat apps! "Use SSE + POST instead." — Evgenii
  • Notification systems (SSE!)
  • Order tracking (SSE or long polling!)
  • Content updates (SSE!)
  • "Simple desktop apps" (long polling!)

  CHAT APP RECOMMENDATION:
  ┌─── Receive messages: SSE (server push!) ───┐
  │   → Battery efficient!                       │
  │   → Auto-reconnect!                          │
  │   → Much cheaper infrastructure!             │
  ├─── Send messages: HTTP POST request! ────────┤
  │   → Normal REST call!                        │
  │   → No WebSocket needed!                     │
  └──────────────────────────────────────────────┘
  "Much cheaper and easier infrastructure
   and code wise." — Evgenii
```

---

## §5. Shop Admin App — "What Protocol for Each?"

> Evgenii: _"For our shop admin: desktop order tracking = long polling or SSE. Mobile = SSE. Chat: SSE for receiving, POST for sending."_

```
SHOP ADMIN APP DECISIONS:
═══════════════════════════════════════════════════════════════

  Endpoint: Get New Orders
  ├── Desktop: Long Polling ✅ or SSE ✅
  └── Mobile:  SSE ✅ (battery efficient!)

  Endpoint: Get New Messages (Chat)
  ├── Desktop: Short Polling ✅ or SSE ✅
  └── Mobile:  SSE ✅

  Endpoint: Send Messages
  ├── Desktop: HTTP POST ✅
  └── Mobile:  HTTP POST ✅

  "You don't need WebSocket to POST data to server.
   Just use normal HTTP POST request." — Evgenii
```

---

## §6. Q&A — "Chat, Notion, Media Files"

> Student: _"Would SSE work for media files?"_
> Evgenii: _"No! SSE is text-based. For video, use WebRTC."_

```
Q&A HIGHLIGHTS:
═══════════════════════════════════════════════════════════════

  Q: SSE for images/videos?
  A: "No, SSE not good for media. Media is binary data.
     Use WebRTC for video content." — Evgenii

  Q: Best protocol for real-time editors like Notion?
  A: "For saving: normal POST request.
     For receiving updates: SSE.
     For collaborative editing: special data structures needed
     (research papers exist). SSE still good for basic cases.
     Even Notion case, SSE would handle." — Evgenii

  Q: But what about WebSockets for Notion?
  A: "Infrastructure-wise, WebSockets are terrible.
     Hard to maintain. Lots of overhead.
     Need thoughtful decision. I would use
     HTTP POST + SSE instead." — Evgenii

  Q: SSE performance vs WebSockets?
  A: "Very close! WebSockets slightly faster,
     but for basic cases SSE would handle." — Evgenii
```

---

## §7. Protocol Decision Guide

```
PROTOCOL DECISION TREE:
═══════════════════════════════════════════════════════════════

  Is it bidirectional?
  ├── NO → Is it real-time?
  │         ├── YES → SSE ✅
  │         └── NO  → Long Polling ✅ (desktop)
  │
  └── YES → Is timing CRITICAL (microseconds)?
             ├── YES → WebSocket ✅ (sensors, gaming, trading)
             └── NO  → SSE + POST ✅ (chat, editors)

  COMPARISON TABLE:
  | Feature         | Long Poll | SSE      | WebSocket |
  |----------------|-----------|----------|-----------|
  | Direction       | Req/Res   | Server→  | Duplex    |
  | Battery         | Drains 💀 | Efficient✅| Drains 💀 |
  | Infrastructure  | Easy      | Easy     | Complex 💀|
  | Reconnection    | Manual    | Auto ✅   | Manual    |
  | State           | Stateless | Stateless| Stateful! |
  | Cost            | Cheap     | Cheap    | Expensive |
  | Performance     | Slowest   | Fast ✅   | Fastest   |
  | Mobile          | Bad ❌    | Good ✅   | Bad ❌    |
  | Desktop         | Good ✅   | Good ✅   | Overkill  |

  "If you think WebSocket is good. Think twice.
   Very big investment for business." — Evgenii
```

---

## §8. Tự Code: WebSocket Patterns

```javascript
// ═══ WEBSOCKET CLIENT ═══

class WSClient {
  #ws;
  #url;
  #handlers = new Map();
  #reconnectInterval;
  #stateStore;

  constructor(url, stateStore = null) {
    this.#url = url;
    this.#stateStore = stateStore;
  }

  connect() {
    this.#ws = new WebSocket(this.#url);

    this.#ws.onopen = () => {
      console.log("WebSocket connected!");
      // Restore state if reconnecting!
      if (this.#stateStore) {
        const lastState = this.#stateStore.getLastState();
        if (lastState) {
          this.send("restore", lastState);
        }
      }
    };

    this.#ws.onmessage = (event) => {
      const { type, data } = JSON.parse(event.data);
      const handler = this.#handlers.get(type);
      if (handler) handler(data);

      // Persist state (stateful = must backup!)
      if (this.#stateStore) {
        this.#stateStore.saveState(type, data);
      }
    };

    this.#ws.onclose = () => {
      console.log("Connection lost! Reconnecting...");
      // Manual reconnection needed! (unlike SSE!)
      this.#reconnectInterval = setTimeout(() => {
        this.connect();
      }, 3000);
    };

    this.#ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return this;
  }

  on(type, handler) {
    this.#handlers.set(type, handler);
    return this;
  }

  send(type, data) {
    if (this.#ws.readyState === WebSocket.OPEN) {
      this.#ws.send(JSON.stringify({ type, data }));
    }
  }

  disconnect() {
    clearTimeout(this.#reconnectInterval);
    this.#ws.close();
  }
}

// ═══ SSE + POST PATTERN (Recommended for Chat!) ═══

class ChatClient {
  #sse;
  #handlers = new Map();

  // RECEIVE via SSE (server push!)
  connect(url) {
    this.#sse = new EventSource(url);

    this.#sse.addEventListener("new-message", (event) => {
      const message = JSON.parse(event.data);
      this.#handlers.get("message")?.(message);
    });

    // Auto-reconnection built-in! ✅
    this.#sse.onerror = () => {
      console.log("Auto-reconnecting...");
    };

    return this;
  }

  on(type, handler) {
    this.#handlers.set(type, handler);
    return this;
  }

  // SEND via HTTP POST (normal REST!)
  async sendMessage(conversationId, text) {
    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId, text }),
    });
    // "You don't need WebSocket to POST data!" — Evgenii
  }

  disconnect() {
    this.#sse.close();
  }
}

// Usage comparison:
// ❌ WebSocket chat (expensive!):
const wsChat = new WSClient("ws://server/chat");
wsChat.connect().on("message", (msg) => renderMessage(msg));
wsChat.send("message", { text: "Hello" });

// ✅ SSE + POST chat (recommended!):
const chat = new ChatClient();
chat.connect("/api/chat/stream").on("message", (msg) => renderMessage(msg));
chat.sendMessage("conv1", "Hello");

console.log("═══ WEBSOCKET vs SSE ═══");
console.log("WebSocket: fastest, but infrastructure nightmare!");
console.log("65K socket limit, stateful, drains battery!");
console.log("Use ONLY for: sensors, gaming, trading!");
console.log("Chat: SSE (receive) + POST (send) = much cheaper!");
console.log("'Think twice before WebSockets!' — Evgenii");
```

---

## Checklist

```
[ ] WebSocket: HTTP/1 handshake → upgrade to raw TCP!
[ ] Duplex: both sides push data anytime!
[ ] 65,000 TCP socket limit per server!
[ ] Very expensive infrastructure!
[ ] Duplex antenna = battery drain!
[ ] Stateful: lose connection = lose all state!
[ ] Need separate DB to persist state!
[ ] Manual reconnection required (unlike SSE!)
[ ] Use ONLY for: sensors, gaming, trading, location!
[ ] Chat: SSE + POST, NOT WebSocket!
[ ] SSE performance ≈ WebSocket for most cases!
[ ] "Think twice. Very big investment." — Evgenii
TIẾP THEO → Phần 23: REST vs GraphQL!
```
