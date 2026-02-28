# Real-Time Security Monitoring — Deep Dive

> **Mục tiêu:** Ôn luyện kiến thức cho vị trí Senior Frontend Engineer tại công ty Cybersecurity.
> **Chủ đề:** Architect WebSocket connections cho live firewall logs & threat alerts,
> quản lý complex client-side state (Redux, Zustand, TanStack Query) để UI phản ánh
> chính xác trạng thái network devices trong real-time.

---

## Table of Contents

1. [Overview & Architecture](#1-overview--architecture)
2. [TypeScript Domain Models](#2-typescript-domain-models)
3. [WebSocket Architecture — Production-Grade](#3-websocket-architecture--production-grade)
4. [Binary Protocols & Message Encoding](#4-binary-protocols--message-encoding)
5. [Resilient Connection Management](#5-resilient-connection-management)
6. [Firewall Log Streaming Pipeline](#6-firewall-log-streaming-pipeline)
7. [State Management — Redux Toolkit](#7-state-management--redux-toolkit)
8. [State Management — Zustand](#8-state-management--zustand)
9. [State Management — TanStack Query](#9-state-management--tanstack-query)
10. [Real-Time State Synchronization Patterns](#10-real-time-state-synchronization-patterns)
11. [Performance Optimization](#11-performance-optimization)
12. [Dashboard Patterns & Interview Questions](#12-dashboard-patterns--interview-questions)

---

## 1. Overview & Architecture

```
REAL-TIME SECURITY MONITORING — ARCHITECTURE OVERVIEW:
═══════════════════════════════════════════════════════════════

  VẤN ĐỀ: SOC Dashboard cần hiển thị:
  • 10K+ firewall log entries/second
  • Live device status (100s of network devices)
  • Threat alerts với < 500ms latency
  • Policy changes reflected INSTANTLY

  ┌─────────────────────────────────────────────────────────┐
  │                    ARCHITECTURE                         │
  │                                                         │
  │  ┌──────────┐    ┌──────────┐    ┌──────────────────┐  │
  │  │ Firewall │    │   IDS/   │    │ Network Devices  │  │
  │  │  Logs    │    │   IPS    │    │ (SNMP/Telemetry) │  │
  │  └────┬─────┘    └────┬─────┘    └────────┬─────────┘  │
  │       │               │                    │            │
  │       ▼               ▼                    ▼            │
  │  ┌─────────────────────────────────────────────────┐   │
  │  │           Message Broker (Kafka/Redis)          │   │
  │  │         Topic-based event distribution          │   │
  │  └──────────────────────┬──────────────────────────┘   │
  │                         │                               │
  │                         ▼                               │
  │  ┌─────────────────────────────────────────────────┐   │
  │  │        WebSocket Gateway (Backend)               │   │
  │  │  • Authentication (JWT)                          │   │
  │  │  • Channel subscription management               │   │
  │  │  • Rate limiting & backpressure                  │   │
  │  │  • Message batching (100ms window)               │   │
  │  └──────────────────────┬──────────────────────────┘   │
  │                         │                               │
  │                    WebSocket                            │
  │                    (wss://)                              │
  │                         │                               │
  │                         ▼                               │
  │  ┌─────────────────────────────────────────────────┐   │
  │  │           FRONTEND — Browser                     │   │
  │  │                                                   │   │
  │  │  ┌───────────────┐  ┌─────────────────────────┐ │   │
  │  │  │ WS Connection │  │    State Management     │ │   │
  │  │  │ Manager       │  │  (Redux/Zustand/TQ)     │ │   │
  │  │  │               │──│                         │ │   │
  │  │  │ • Auto-recon  │  │  • Device states        │ │   │
  │  │  │ • Heartbeat   │  │  • Log buffer           │ │   │
  │  │  │ • Binary msg  │  │  • Alert queue          │ │   │
  │  │  │ • Backpressure│  │  • Filter/search state  │ │   │
  │  │  └───────────────┘  └─────────────────────────┘ │   │
  │  │                                                   │   │
  │  │  ┌─────────────────────────────────────────────┐ │   │
  │  │  │           UI Components                      │ │   │
  │  │  │  • Virtual scroll log viewer                │ │   │
  │  │  │  • Device status grid                       │ │   │
  │  │  │  • Alert notification panel                 │ │   │
  │  │  │  • Real-time charts (Recharts)              │ │   │
  │  │  └─────────────────────────────────────────────┘ │   │
  │  └─────────────────────────────────────────────────────┘   │
  └─────────────────────────────────────────────────────────┘

  KEY METRICS:
  ┌───────────────────────────────────────────────────────┐
  │  Metric              │ Target          │ Acceptable    │
  ├──────────────────────┼─────────────────┼───────────────┤
  │  WS → UI latency     │ < 100ms         │ < 500ms       │
  │  Log throughput       │ 10K events/s    │ 5K events/s   │
  │  Memory (1hr session) │ < 200MB         │ < 500MB       │
  │  Reconnection time    │ < 2s            │ < 5s          │
  │  UI FPS              │ 60fps           │ > 30fps       │
  │  State sync accuracy │ 100%            │ > 99.9%       │
  └───────────────────────────────────────────────────────┘
```

---

## 2. TypeScript Domain Models

```typescript
// ═══════════════════════════════════════════════════
// FIREWALL LOG TYPES
// ═══════════════════════════════════════════════════

type LogSeverity =
  | "emergency"
  | "alert"
  | "critical"
  | "error"
  | "warning"
  | "notice"
  | "info"
  | "debug";

type LogAction =
  | "allow"
  | "deny"
  | "drop"
  | "reject"
  | "reset"
  | "log"
  | "quarantine";

interface FirewallLogEntry {
  id: string;
  timestamp: number; // Unix ms
  deviceId: string;
  deviceName: string;
  severity: LogSeverity;
  action: LogAction;
  rule: {
    id: string;
    name: string;
    zone: string; // "WAN→LAN", "DMZ→Internal"
  };
  source: {
    ip: string;
    port: number;
    country?: string;
    mac?: string;
  };
  destination: {
    ip: string;
    port: number;
    service?: string; // "HTTPS", "SSH", "DNS"
  };
  protocol: "TCP" | "UDP" | "ICMP" | "GRE" | "ESP";
  bytes: number;
  packets: number;
  sessionDuration?: number; // seconds
  threatInfo?: {
    category: string; // "malware", "c2", "phishing"
    severity: number; // 1-10
    signature: string;
    action: "alert" | "block" | "sinkhole";
  };
  nat?: {
    srcTranslated: string;
    dstTranslated: string;
  };
}

// ═══════════════════════════════════════════════════
// NETWORK DEVICE TYPES
// ═══════════════════════════════════════════════════

type DeviceType =
  | "firewall"
  | "router"
  | "switch"
  | "waf"
  | "ids"
  | "ips"
  | "vpn_gateway"
  | "load_balancer";

type DeviceStatus =
  | "online"
  | "degraded"
  | "offline"
  | "maintenance"
  | "unreachable";

interface NetworkDevice {
  id: string;
  name: string;
  type: DeviceType;
  hostname: string;
  ip: string;
  status: DeviceStatus;
  lastSeen: number; // Unix ms
  firmware: string;
  location: string; // "DC-01 Rack 4A"
  metrics: DeviceMetrics;
  interfaces: NetworkInterface[];
  activeSessions: number;
  cpuUsage: number; // 0-100
  memoryUsage: number; // 0-100
  uptimeSeconds: number;
  config: {
    lastModified: number;
    version: string;
    pendingChanges: boolean;
  };
}

interface DeviceMetrics {
  throughputMbps: number;
  connectionsPerSecond: number;
  droppedPackets: number;
  latencyMs: number;
  errorRate: number; // percentage
  bandwidthUtilization: number; // percentage
}

interface NetworkInterface {
  name: string; // "eth0", "ge-0/0/0"
  status: "up" | "down" | "admin_down";
  speedMbps: number;
  inBytes: number;
  outBytes: number;
  errors: number;
  utilization: number; // percentage
}

// ═══════════════════════════════════════════════════
// THREAT ALERT TYPES
// ═══════════════════════════════════════════════════

type AlertPriority = "P1" | "P2" | "P3" | "P4";

type AlertStatus =
  | "new"
  | "acknowledged"
  | "investigating"
  | "resolved"
  | "false_positive"
  | "escalated";

interface ThreatAlert {
  id: string;
  timestamp: number;
  priority: AlertPriority;
  status: AlertStatus;
  title: string;
  description: string;
  source: string; // "IDS", "Firewall", "AI Model"
  category: string; // "intrusion", "malware", "policy_violation"
  affectedDevices: string[]; // Device IDs
  indicators: Array<{
    type: "ip" | "domain" | "hash" | "url" | "email";
    value: string;
    confidence: number;
  }>;
  assignee?: string;
  relatedAlerts: string[];
  timeline: Array<{
    timestamp: number;
    action: string;
    actor: string;
  }>;
}

// ═══════════════════════════════════════════════════
// WEBSOCKET MESSAGE TYPES
// ═══════════════════════════════════════════════════

type WSMessageType =
  | "LOG_BATCH" // Batch of firewall logs
  | "DEVICE_UPDATE" // Single device status change
  | "DEVICE_METRICS" // Device metrics update
  | "ALERT_NEW" // New threat alert
  | "ALERT_UPDATE" // Alert status change
  | "POLICY_CHANGE" // Firewall policy changed
  | "HEARTBEAT" // Connection health check
  | "SUBSCRIBE" // Client → Server: subscribe
  | "UNSUBSCRIBE" // Client → Server: unsubscribe
  | "ACK" // Acknowledgment
  | "ERROR" // Error message
  | "SNAPSHOT" // Full state snapshot
  | "BACKPRESSURE"; // Server overwhelmed signal

interface WSMessage<T = unknown> {
  type: WSMessageType;
  payload: T;
  timestamp: number;
  sequence: number; // For ordering & gap detection
  channel?: string; // "logs:fw-01", "alerts:p1"
}

// Specific payload types
interface LogBatchPayload {
  deviceId: string;
  logs: FirewallLogEntry[];
  totalPending: number; // Backpressure indicator
}

interface DeviceUpdatePayload {
  deviceId: string;
  changes: Partial<NetworkDevice>;
  previousStatus?: DeviceStatus;
}

interface AlertPayload {
  alert: ThreatAlert;
  correlatedAlerts?: string[];
}
```

---

## 3. WebSocket Architecture — Production-Grade

```
WEBSOCKET ARCHITECTURE — PRODUCTION PATTERNS:
═══════════════════════════════════════════════════════════════

  KHÔNG PHẢI chỉ `new WebSocket()` là xong!
  Production cần:

  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ① AUTHENTICATION                                      │
  │  → JWT token trong URL hoặc first message              │
  │  → Token refresh trước khi expire                      │
  │  → Reject unauthorized connections server-side         │
  │                                                        │
  │  ② CHANNEL SUBSCRIPTION                                │
  │  → Subscribe to specific topics (logs, alerts, device) │
  │  → Unsubscribe khi component unmount                   │
  │  → Server chỉ gửi data client cần                     │
  │                                                        │
  │  ③ MESSAGE ORDERING                                    │
  │  → Sequence numbers cho mỗi message                   │
  │  → Gap detection → request missing messages            │
  │  → Server-side msg buffer cho reconnection             │
  │                                                        │
  │  ④ BACKPRESSURE HANDLING                                │
  │  → Client quá chậm → server pause/drop cũ nhất        │
  │  → Client signal "I'm overwhelmed" → server throttle   │
  │  → Adaptive batching based on client processing speed  │
  │                                                        │
  │  ⑤ ERROR HANDLING                                       │
  │  → Graceful degradation (WS fail → polling fallback)   │
  │  → Connection state machine (connecting/open/closing)  │
  │  → User notification khi connection issues             │
  │                                                        │
  │  ⑥ MONITORING                                           │
  │  → Latency tracking (message timestamp vs receive)     │
  │  → Throughput metrics (msg/s, bytes/s)                 │
  │  → Connection health reporting                          │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 3.1 Production WebSocket Client

```typescript
// ═══════════════════════════════════════════════════
// SECURITY WEBSOCKET CLIENT — Production-grade
// ═══════════════════════════════════════════════════

type ConnectionState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "failed";

interface WSClientConfig {
  url: string;
  token: string;
  maxReconnectAttempts: number;
  reconnectBaseDelay: number; // ms
  reconnectMaxDelay: number; // ms
  heartbeatInterval: number; // ms
  messageBufferSize: number;
  enableBinary: boolean;
  onStateChange?: (state: ConnectionState) => void;
}

const DEFAULT_CONFIG: Partial<WSClientConfig> = {
  maxReconnectAttempts: 10,
  reconnectBaseDelay: 1000,
  reconnectMaxDelay: 30000,
  heartbeatInterval: 15000,
  messageBufferSize: 1000,
  enableBinary: true,
};

class SecurityWebSocketClient {
  private ws: WebSocket | null = null;
  private config: WSClientConfig;
  private state: ConnectionState = "disconnected";
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private lastHeartbeatResponse = 0;
  private lastSequence = 0;
  private subscriptions = new Set<string>();
  private listeners = new Map<string, Set<(data: any) => void>>();
  private pendingMessages: WSMessage[] = [];
  private metrics = {
    messagesReceived: 0,
    bytesReceived: 0,
    latencyMs: 0,
    lastMessageTime: 0,
    reconnections: 0,
  };

  constructor(config: WSClientConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config } as WSClientConfig;
  }

  // ═══════════════════════════════════════════
  // CONNECTION LIFECYCLE
  // ═══════════════════════════════════════════
  connect(): void {
    if (this.state === "connected" || this.state === "connecting") return;

    this.setState("connecting");

    // JWT in URL query (alternative: send as first message)
    const url = `${this.config.url}?token=${this.config.token}`;
    this.ws = new WebSocket(url);

    if (this.config.enableBinary) {
      this.ws.binaryType = "arraybuffer";
    }

    this.ws.onopen = () => {
      this.setState("connected");
      this.reconnectAttempts = 0;
      this.startHeartbeat();

      // Re-subscribe to channels after reconnect
      for (const channel of this.subscriptions) {
        this.sendMessage({
          type: "SUBSCRIBE",
          payload: { channel },
          timestamp: Date.now(),
          sequence: 0,
        });
      }

      // Request snapshot to sync state
      this.sendMessage({
        type: "SNAPSHOT",
        payload: {},
        timestamp: Date.now(),
        sequence: 0,
      });

      // Flush pending messages
      while (this.pendingMessages.length > 0) {
        const msg = this.pendingMessages.shift()!;
        this.sendMessage(msg);
      }
    };

    this.ws.onmessage = (event) => {
      this.handleMessage(event);
    };

    this.ws.onclose = (event) => {
      this.stopHeartbeat();

      if (event.code === 4001) {
        // Authentication failed — don't reconnect
        this.setState("failed");
        this.emit("error", {
          code: "AUTH_FAILED",
          message: "Token expired or invalid",
        });
        return;
      }

      if (event.code !== 1000) {
        // Abnormal close → reconnect
        this.attemptReconnect();
      } else {
        this.setState("disconnected");
      }
    };

    this.ws.onerror = () => {
      // Error details not available in browser (security)
      // onclose will fire after this
    };
  }

  disconnect(): void {
    this.reconnectAttempts = this.config.maxReconnectAttempts; // Prevent reconnect
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.stopHeartbeat();
    this.ws?.close(1000, "Client disconnect");
    this.setState("disconnected");
  }

  // ═══════════════════════════════════════════
  // CHANNEL SUBSCRIPTION
  // ═══════════════════════════════════════════
  subscribe(channel: string, callback: (data: any) => void): () => void {
    this.subscriptions.add(channel);

    if (!this.listeners.has(channel)) {
      this.listeners.set(channel, new Set());
    }
    this.listeners.get(channel)!.add(callback);

    // Send subscribe message if connected
    if (this.state === "connected") {
      this.sendMessage({
        type: "SUBSCRIBE",
        payload: { channel },
        timestamp: Date.now(),
        sequence: 0,
      });
    }

    // Return unsubscribe function
    return () => {
      this.listeners.get(channel)?.delete(callback);
      if (this.listeners.get(channel)?.size === 0) {
        this.subscriptions.delete(channel);
        this.listeners.delete(channel);
        if (this.state === "connected") {
          this.sendMessage({
            type: "UNSUBSCRIBE",
            payload: { channel },
            timestamp: Date.now(),
            sequence: 0,
          });
        }
      }
    };
  }

  // ═══════════════════════════════════════════
  // MESSAGE HANDLING
  // ═══════════════════════════════════════════
  private handleMessage(event: MessageEvent): void {
    let message: WSMessage;

    if (event.data instanceof ArrayBuffer) {
      // Binary message — decode MessagePack/Protobuf
      message = this.decodeBinary(event.data);
    } else {
      message = JSON.parse(event.data);
    }

    // Track metrics
    this.metrics.messagesReceived++;
    this.metrics.bytesReceived +=
      event.data instanceof ArrayBuffer
        ? event.data.byteLength
        : (event.data as string).length;
    this.metrics.latencyMs = Date.now() - message.timestamp;
    this.metrics.lastMessageTime = Date.now();

    // Sequence gap detection
    if (message.sequence > 0 && message.sequence !== this.lastSequence + 1) {
      const gap = message.sequence - this.lastSequence - 1;
      console.warn(`[WS] Sequence gap detected: missed ${gap} messages`);
      // Request missing messages
      this.sendMessage({
        type: "ACK",
        payload: { lastReceived: this.lastSequence, gap },
        timestamp: Date.now(),
        sequence: 0,
      });
    }
    if (message.sequence > 0) {
      this.lastSequence = message.sequence;
    }

    // Route message
    switch (message.type) {
      case "HEARTBEAT":
        this.lastHeartbeatResponse = Date.now();
        break;

      case "BACKPRESSURE":
        this.emit("backpressure", message.payload);
        break;

      case "ERROR":
        this.emit("error", message.payload);
        break;

      default:
        // Route to channel subscribers
        if (message.channel) {
          const handlers = this.listeners.get(message.channel);
          handlers?.forEach((handler) => handler(message.payload));
        }
        // Route to type subscribers
        this.emit(message.type, message.payload);
    }
  }

  private sendMessage(message: WSMessage): void {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      if (this.pendingMessages.length < this.config.messageBufferSize) {
        this.pendingMessages.push(message);
      }
      return;
    }

    if (this.config.enableBinary) {
      this.ws.send(this.encodeBinary(message));
    } else {
      this.ws.send(JSON.stringify(message));
    }
  }

  // ═══════════════════════════════════════════
  // RECONNECTION — Exponential Backoff + Jitter
  // ═══════════════════════════════════════════
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      this.setState("failed");
      this.emit("error", {
        code: "MAX_RECONNECT",
        message: "Max reconnection attempts reached",
      });
      return;
    }

    this.setState("reconnecting");
    this.reconnectAttempts++;
    this.metrics.reconnections++;

    // Exponential backoff with jitter
    const delay = Math.min(
      this.config.reconnectBaseDelay * Math.pow(2, this.reconnectAttempts - 1),
      this.config.reconnectMaxDelay,
    );
    const jitter = delay * 0.3 * Math.random();
    const finalDelay = delay + jitter;

    this.emit("reconnecting", {
      attempt: this.reconnectAttempts,
      maxAttempts: this.config.maxReconnectAttempts,
      nextRetryMs: finalDelay,
    });

    this.reconnectTimer = setTimeout(() => this.connect(), finalDelay);
  }

  // ═══════════════════════════════════════════
  // HEARTBEAT
  // ═══════════════════════════════════════════
  private startHeartbeat(): void {
    this.lastHeartbeatResponse = Date.now();
    this.heartbeatTimer = setInterval(() => {
      // Check if we missed a heartbeat response
      const elapsed = Date.now() - this.lastHeartbeatResponse;
      if (elapsed > this.config.heartbeatInterval * 2) {
        console.warn("[WS] Heartbeat timeout — connection may be dead");
        this.ws?.close(4000, "Heartbeat timeout");
        return;
      }

      this.sendMessage({
        type: "HEARTBEAT",
        payload: { clientTime: Date.now() },
        timestamp: Date.now(),
        sequence: 0,
      });
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  // ═══════════════════════════════════════════
  // EVENT EMITTER
  // ═══════════════════════════════════════════
  private emit(event: string, data: any): void {
    const handlers = this.listeners.get(event);
    handlers?.forEach((handler) => handler(data));
  }

  on(event: string, handler: (data: any) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
    return () => this.listeners.get(event)?.delete(handler);
  }

  private setState(state: ConnectionState): void {
    this.state = state;
    this.config.onStateChange?.(state);
    this.emit("stateChange", state);
  }

  getState(): ConnectionState {
    return this.state;
  }
  getMetrics() {
    return { ...this.metrics };
  }

  // Binary encoding stubs
  private encodeBinary(msg: WSMessage): ArrayBuffer {
    // Use MessagePack or Protobuf in production
    const json = JSON.stringify(msg);
    return new TextEncoder().encode(json).buffer;
  }

  private decodeBinary(buffer: ArrayBuffer): WSMessage {
    const text = new TextDecoder().decode(buffer);
    return JSON.parse(text);
  }
}
```

### 3.2 React Hook — useSecurityWebSocket

```typescript
// ═══════════════════════════════════════════════════
// REACT HOOK — Connect WS Client to React lifecycle
// ═══════════════════════════════════════════════════

interface UseSecurityWSOptions {
  url: string;
  token: string;
  channels: string[];
  enabled?: boolean;
  onMessage?: (type: WSMessageType, payload: any) => void;
  onError?: (error: any) => void;
}

interface UseSecurityWSReturn {
  connectionState: ConnectionState;
  metrics: typeof SecurityWebSocketClient.prototype.getMetrics extends () => infer R
    ? R
    : never;
  subscribe: (channel: string, handler: (data: any) => void) => () => void;
  sendMessage: (msg: WSMessage) => void;
}

function useSecurityWebSocket(
  options: UseSecurityWSOptions,
): UseSecurityWSReturn {
  const { url, token, channels, enabled = true, onMessage, onError } = options;

  const clientRef = useRef<SecurityWebSocketClient | null>(null);
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("disconnected");
  const [metrics, setMetrics] = useState({
    messagesReceived: 0,
    bytesReceived: 0,
    latencyMs: 0,
    lastMessageTime: 0,
    reconnections: 0,
  });

  // Stable callback refs
  const onMessageRef = useRef(onMessage);
  const onErrorRef = useRef(onError);
  onMessageRef.current = onMessage;
  onErrorRef.current = onError;

  // Initialize client
  useEffect(() => {
    if (!enabled) return;

    const client = new SecurityWebSocketClient({
      url,
      token,
      maxReconnectAttempts: 10,
      reconnectBaseDelay: 1000,
      reconnectMaxDelay: 30000,
      heartbeatInterval: 15000,
      messageBufferSize: 1000,
      enableBinary: true,
      onStateChange: setConnectionState,
    });

    clientRef.current = client;

    // Listen for errors
    const unsubError = client.on("error", (err) => {
      onErrorRef.current?.(err);
    });

    // Listen for all message types
    const messageTypes: WSMessageType[] = [
      "LOG_BATCH",
      "DEVICE_UPDATE",
      "DEVICE_METRICS",
      "ALERT_NEW",
      "ALERT_UPDATE",
      "POLICY_CHANGE",
      "SNAPSHOT",
    ];
    const unsubMessages = messageTypes.map((type) =>
      client.on(type, (payload) => {
        onMessageRef.current?.(type, payload);
      }),
    );

    // Subscribe to channels
    const unsubChannels = channels.map((ch) =>
      client.subscribe(ch, (data) => {
        onMessageRef.current?.(data.type, data);
      }),
    );

    // Connect
    client.connect();

    // Metrics polling
    const metricsInterval = setInterval(() => {
      setMetrics(client.getMetrics());
    }, 2000);

    return () => {
      clearInterval(metricsInterval);
      unsubError();
      unsubMessages.forEach((u) => u());
      unsubChannels.forEach((u) => u());
      client.disconnect();
      clientRef.current = null;
    };
  }, [url, token, enabled, channels.join(",")]); // channels as stable key

  const subscribe = useCallback(
    (channel: string, handler: (data: any) => void) => {
      return clientRef.current?.subscribe(channel, handler) ?? (() => {});
    },
    [],
  );

  const sendMessage = useCallback((msg: WSMessage) => {
    clientRef.current?.["sendMessage"](msg);
  }, []);

  return { connectionState, metrics, subscribe, sendMessage };
}
```

### 3.3 Connection Status UI

```typescript
// ═══════════════════════════════════════════════════
// CONNECTION STATUS — Visual indicator
// ═══════════════════════════════════════════════════

const CONNECTION_STATUS_CONFIG: Record<ConnectionState, {
  color: string; label: string; icon: string; pulse: boolean;
}> = {
  connected:    { color: '#00e676', label: 'Live', icon: '🟢', pulse: true },
  connecting:   { color: '#ffd600', label: 'Connecting...', icon: '🟡', pulse: true },
  reconnecting: { color: '#ff9100', label: 'Reconnecting...', icon: '🟠', pulse: true },
  disconnected: { color: '#90a4ae', label: 'Disconnected', icon: '⚪', pulse: false },
  failed:       { color: '#ff1744', label: 'Connection Failed', icon: '🔴', pulse: false },
};

const ConnectionStatusBar: React.FC<{
  state: ConnectionState;
  metrics: { latencyMs: number; messagesReceived: number };
  onReconnect?: () => void;
}> = ({ state, metrics, onReconnect }) => {
  const config = CONNECTION_STATUS_CONFIG[state];

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '4px 12px', borderRadius: 6,
      background: 'rgba(255,255,255,0.05)',
      border: `1px solid ${config.color}33`,
      fontSize: 12,
    }}>
      <span style={{
        width: 8, height: 8, borderRadius: '50%',
        background: config.color,
        animation: config.pulse ? 'pulse 2s infinite' : 'none',
      }} />
      <span style={{ color: config.color, fontWeight: 600 }}>
        {config.label}
      </span>

      {state === 'connected' && (
        <>
          <span style={{ color: '#666' }}>|</span>
          <span style={{ color: '#999' }}>
            Latency: {metrics.latencyMs}ms
          </span>
          <span style={{ color: '#999' }}>
            Events: {metrics.messagesReceived.toLocaleString()}
          </span>
        </>
      )}

      {state === 'failed' && onReconnect && (
        <button onClick={onReconnect} style={{
          background: 'rgba(255,23,68,0.15)',
          border: '1px solid rgba(255,23,68,0.3)',
          color: '#ff1744', padding: '2px 8px',
          borderRadius: 4, cursor: 'pointer', fontSize: 11,
        }}>
          Retry
        </button>
      )}
    </div>
  );
};
```

---

## 4. Binary Protocols & Message Encoding

```
BINARY PROTOCOLS — TẠI SAO QUAN TRỌNG:
═══════════════════════════════════════════════════════════════

  10K logs/second × ~500 bytes/log = 5 MB/s JSON bandwidth
  Với binary encoding (MessagePack): ~2 MB/s (60% savings)

  SO SÁNH:
  ┌──────────────────┬──────────┬───────┬─────────────────┐
  │ Format           │ Encode   │ Size  │ Parse Speed     │
  ├──────────────────┼──────────┼───────┼─────────────────┤
  │ JSON             │ Simple   │ 100%  │ Fast (native)   │
  │ MessagePack      │ Library  │ ~60%  │ Very Fast       │
  │ Protocol Buffers │ Schema   │ ~40%  │ Fastest         │
  │ CBOR             │ Library  │ ~65%  │ Fast            │
  │ FlatBuffers      │ Schema   │ ~35%  │ Zero-copy read  │
  └──────────────────┴──────────┴───────┴─────────────────┘

  RECOMMENDATION cho Security Dashboard:
  ┌──────────────────────────────────────────────────────┐
  │                                                      │
  │  ① Prototype / small team → JSON (simple, debuggable)│
  │  ② Production / high volume → MessagePack            │
  │     → npm: msgpack-lite — simple API, good perf     │
  │     → Tương thích JSON, không cần schema            │
  │  ③ Enterprise / cross-platform → Protobuf            │
  │     → Schema evolution, strong typing               │
  │     → Cần maintain .proto files                     │
  │                                                      │
  └──────────────────────────────────────────────────────┘
```

### 4.1 MessagePack Implementation

```typescript
// ═══════════════════════════════════════════════════
// MESSAGEPACK — Binary encoding for WebSocket
// ═══════════════════════════════════════════════════
// npm install @msgpack/msgpack

import { encode, decode } from "@msgpack/msgpack";

class BinaryMessageCodec {
  // Encode: JS Object → ArrayBuffer
  encode(message: WSMessage): ArrayBuffer {
    // Compact format: use short keys to save bytes
    const compact = {
      t: message.type, // type
      p: message.payload, // payload
      ts: message.timestamp, // timestamp
      s: message.sequence, // sequence
      c: message.channel, // channel
    };
    return encode(compact).buffer;
  }

  // Decode: ArrayBuffer → JS Object
  decode(buffer: ArrayBuffer): WSMessage {
    const compact = decode(new Uint8Array(buffer)) as any;
    return {
      type: compact.t,
      payload: compact.p,
      timestamp: compact.ts,
      sequence: compact.s,
      channel: compact.c,
    };
  }
}

// Usage in WebSocket client:
const codec = new BinaryMessageCodec();

// Sending
ws.send(
  codec.encode({
    type: "SUBSCRIBE",
    payload: { channel: "logs:fw-01" },
    timestamp: Date.now(),
    sequence: 0,
  }),
);

// Receiving
ws.onmessage = (event) => {
  if (event.data instanceof ArrayBuffer) {
    const message = codec.decode(event.data);
    handleMessage(message);
  }
};
```

### 4.2 Structured Clone vs JSON vs MessagePack Benchmark

```typescript
// ═══════════════════════════════════════════════════
// BENCHMARK — Encoding comparison
// ═══════════════════════════════════════════════════

function benchmarkEncoding(logs: FirewallLogEntry[]) {
  // JSON
  console.time("JSON encode");
  const jsonStr = JSON.stringify(logs);
  console.timeEnd("JSON encode");
  console.log(`JSON size: ${jsonStr.length} bytes`);

  console.time("JSON decode");
  JSON.parse(jsonStr);
  console.timeEnd("JSON decode");

  // MessagePack
  console.time("MsgPack encode");
  const msgpackBuf = encode(logs);
  console.timeEnd("MsgPack encode");
  console.log(`MsgPack size: ${msgpackBuf.byteLength} bytes`);

  console.time("MsgPack decode");
  decode(msgpackBuf);
  console.timeEnd("MsgPack decode");

  // Results (typical for 1000 log entries):
  // JSON:     encode ~5ms, size ~520KB, decode ~3ms
  // MsgPack:  encode ~8ms, size ~310KB, decode ~4ms
  // → 40% bandwidth savings, ~2ms overhead
}
```

---

## 5. Resilient Connection Management

```
CONNECTION RESILIENCE — STATE MACHINE:
═══════════════════════════════════════════════════════════════

  ┌──────────────┐
  │              │     connect()
  │ DISCONNECTED ├─────────────────┐
  │              │                 │
  └──────┬───────┘                 ▼
         │              ┌──────────────────┐
         │              │                  │
    disconnect()        │   CONNECTING     │
         │              │                  │
         │              └────┬────────┬────┘
         │                   │        │
         │              onopen   onerror/onclose
         │                   │        │
         │                   ▼        │
         │        ┌──────────────┐    │
         │        │              │    │
         ├────────┤  CONNECTED   │    │
         │        │              │    │
         │        └──────┬───────┘    │
         │               │           │
         │         unexpected         │
         │           close            │
         │               │           │
         │               ▼           ▼
         │    ┌────────────────────────────┐
         │    │                            │
         ├────┤    RECONNECTING            │◄───────┐
         │    │    attempts < max          │        │
         │    │                            │  backoff
         │    └─────────────┬──────────────┘  timer
         │                  │                   │
         │            attempt fails ────────────┘
         │                  │
         │         attempts >= max
         │                  │
         │                  ▼
         │         ┌──────────────┐
         │         │              │
         └─────────┤   FAILED     │
                   │              │
                   └──────────────┘

  EXPONENTIAL BACKOFF WITH JITTER:
  ┌────────────────────────────────────────────────────┐
  │                                                    │
  │  Attempt │ Base Delay │ + Jitter    │ Total       │
  │  ────────┼────────────┼─────────────┼───────────  │
  │  1       │ 1s         │ 0-0.3s      │ 1.0-1.3s   │
  │  2       │ 2s         │ 0-0.6s      │ 2.0-2.6s   │
  │  3       │ 4s         │ 0-1.2s      │ 4.0-5.2s   │
  │  4       │ 8s         │ 0-2.4s      │ 8.0-10.4s  │
  │  5       │ 16s        │ 0-4.8s      │ 16-20.8s   │
  │  6+      │ 30s (cap)  │ 0-9s        │ 30-39s     │
  │                                                    │
  │  WHY JITTER?                                       │
  │  → Tránh "thundering herd": 1000 clients           │
  │    reconnect cùng lúc → server overload            │
  │  → Jitter = random delay spread → gradual reconnect│
  │                                                    │
  └────────────────────────────────────────────────────┘
```

### 5.1 Polling Fallback

```typescript
// ═══════════════════════════════════════════════════
// POLLING FALLBACK — When WebSocket is unavailable
// ═══════════════════════════════════════════════════

class PollingFallback {
  private intervals = new Map<string, ReturnType<typeof setInterval>>();
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  startPolling(
    endpoint: string,
    intervalMs: number,
    callback: (data: any) => void,
  ): () => void {
    let lastTimestamp = Date.now();

    const poll = async () => {
      try {
        const response = await fetch(
          `${this.baseUrl}${endpoint}?since=${lastTimestamp}`,
          {
            headers: { Accept: "application/json" },
            signal: AbortSignal.timeout(5000),
          },
        );
        if (response.ok) {
          const data = await response.json();
          lastTimestamp = Date.now();
          callback(data);
        }
      } catch (err) {
        console.warn(`[Polling] Failed: ${endpoint}`, err);
      }
    };

    // Initial request
    poll();
    const id = setInterval(poll, intervalMs);
    this.intervals.set(endpoint, id);

    return () => {
      clearInterval(id);
      this.intervals.delete(endpoint);
    };
  }

  stopAll(): void {
    for (const [, id] of this.intervals) clearInterval(id);
    this.intervals.clear();
  }
}

// Adaptive transport: WS → Polling fallback
function useAdaptiveTransport(config: {
  wsUrl: string;
  apiUrl: string;
  token: string;
  channels: string[];
  onMessage: (type: WSMessageType, payload: any) => void;
}) {
  const [transport, setTransport] = useState<"websocket" | "polling">(
    "websocket",
  );

  const ws = useSecurityWebSocket({
    url: config.wsUrl,
    token: config.token,
    channels: config.channels,
    onMessage: config.onMessage,
    onError: (err) => {
      if (err.code === "MAX_RECONNECT") {
        // WS completely failed → switch to polling
        setTransport("polling");
      }
    },
  });

  useEffect(() => {
    if (transport !== "polling") return;

    const poller = new PollingFallback(config.apiUrl);
    const cleanups = [
      poller.startPolling("/api/logs", 2000, (data) =>
        config.onMessage("LOG_BATCH", data),
      ),
      poller.startPolling("/api/devices", 5000, (data) =>
        config.onMessage("DEVICE_UPDATE", data),
      ),
      poller.startPolling("/api/alerts", 3000, (data) =>
        config.onMessage("ALERT_NEW", data),
      ),
    ];

    return () => {
      cleanups.forEach((c) => c());
      poller.stopAll();
    };
  }, [transport]);

  return { ...ws, transport };
}
```

---

## 6. Firewall Log Streaming Pipeline

```
LOG STREAMING — THE CORE CHALLENGE:
═══════════════════════════════════════════════════════════════

  10K logs/second → Browser phải:
  ① Buffer logs (KHÔNG re-render cho mỗi log)
  ② Aggregate cho charts (time-bucket)
  ③ Virtual scroll cho log viewer (chỉ render visible)
  ④ Evict old logs (memory management)

  DATA FLOW:
  ┌─────────────────────────────────────────────────────┐
  │                                                     │
  │  WebSocket                                          │
  │      │                                              │
  │      ▼                                              │
  │  ┌──────────┐    ┌─────────────┐                   │
  │  │ Message  │───▶│ Ring Buffer │ (fixed-size FIFO)  │
  │  │ Decoder  │    │ 50K entries │                    │
  │  └──────────┘    └──────┬──────┘                    │
  │                         │                            │
  │              ┌──────────┼──────────┐                │
  │              ▼          ▼          ▼                │
  │        ┌──────┐   ┌──────┐   ┌──────────┐         │
  │        │Filter│   │ Agg  │   │ Search   │         │
  │        │Engine│   │Engine│   │ Index    │         │
  │        └──┬───┘   └──┬───┘   └────┬─────┘         │
  │           │          │            │                │
  │           ▼          ▼            ▼                │
  │     ┌──────────┐ ┌──────┐  ┌───────────┐         │
  │     │Log Viewer│ │Charts│  │Search Res.│         │
  │     │(Virtual) │ │      │  │           │         │
  │     └──────────┘ └──────┘  └───────────┘         │
  │                                                     │
  └─────────────────────────────────────────────────────┘
```

### 6.1 Ring Buffer — Fixed-Size Log Store

```typescript
// ═══════════════════════════════════════════════════
// RING BUFFER — O(1) append, bounded memory
// ═══════════════════════════════════════════════════
// Thay vì array.push() + array.slice() (O(N)):
// → Ring buffer overwrites oldest entries (O(1))
// → Memory = FIXED at capacity × entry size

class RingBuffer<T> {
  private buffer: (T | undefined)[];
  private head = 0; // Next write position
  private count = 0; // Current number of items
  private capacity: number;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.buffer = new Array(capacity);
  }

  push(item: T): void {
    this.buffer[this.head] = item;
    this.head = (this.head + 1) % this.capacity;
    if (this.count < this.capacity) this.count++;
  }

  pushMany(items: T[]): void {
    for (const item of items) this.push(item);
  }

  // Get items in chronological order
  toArray(): T[] {
    if (this.count < this.capacity) {
      return this.buffer.slice(0, this.count) as T[];
    }
    // Wrap around: head..end + start..head
    return [
      ...this.buffer.slice(this.head),
      ...this.buffer.slice(0, this.head),
    ] as T[];
  }

  // Get last N items (most recent)
  getLast(n: number): T[] {
    const arr = this.toArray();
    return arr.slice(-n);
  }

  // Get items matching filter (for search)
  filter(predicate: (item: T) => boolean): T[] {
    return this.toArray().filter(predicate);
  }

  get size(): number {
    return this.count;
  }
  get isFull(): boolean {
    return this.count >= this.capacity;
  }

  clear(): void {
    this.buffer = new Array(this.capacity);
    this.head = 0;
    this.count = 0;
  }
}
```

### 6.2 Log Manager with RAF Batching

```typescript
// ═══════════════════════════════════════════════════
// LOG MANAGER — Batched updates with RAF
// ═══════════════════════════════════════════════════
// CRITICAL: Không bao giờ re-render cho MỖI log!
// → Batch tất cả logs nhận trong 1 RAF frame
// → Update React state 1x per frame (≤ 60/s)

class LogStreamManager {
  private buffer = new RingBuffer<FirewallLogEntry>(50_000);
  private pendingBatch: FirewallLogEntry[] = [];
  private rafId: number | null = null;
  private listeners = new Set<(logs: FirewallLogEntry[]) => void>();
  private filters: LogFilter = {};

  // Called by WebSocket handler — any frequency
  ingestBatch(batch: LogBatchPayload): void {
    this.pendingBatch.push(...batch.logs);
    this.scheduleFlush();
  }

  private scheduleFlush(): void {
    // Only schedule ONE raf, even if multiple batches arrive
    if (this.rafId !== null) return;

    this.rafId = requestAnimationFrame(() => {
      this.rafId = null;

      if (this.pendingBatch.length === 0) return;

      // Move pending → ring buffer
      this.buffer.pushMany(this.pendingBatch);

      // Get filtered view
      const filtered = this.applyFilters(this.pendingBatch);

      // Notify listeners with NEW logs only (not entire buffer)
      for (const listener of this.listeners) {
        listener(filtered);
      }

      this.pendingBatch = [];
    });
  }

  private applyFilters(logs: FirewallLogEntry[]): FirewallLogEntry[] {
    return logs.filter((log) => {
      if (
        this.filters.severity &&
        !this.filters.severity.includes(log.severity)
      )
        return false;
      if (this.filters.action && !this.filters.action.includes(log.action))
        return false;
      if (this.filters.deviceId && log.deviceId !== this.filters.deviceId)
        return false;
      if (this.filters.search) {
        const s = this.filters.search.toLowerCase();
        return (
          log.source.ip.includes(s) ||
          log.destination.ip.includes(s) ||
          log.rule.name.toLowerCase().includes(s)
        );
      }
      return true;
    });
  }

  setFilters(filters: LogFilter): void {
    this.filters = filters;
    // Re-emit old filtered data when filter changes
    const all = this.buffer.filter(
      (log) => this.applyFilters([log]).length > 0,
    );
    for (const listener of this.listeners) {
      listener(all);
    }
  }

  subscribe(listener: (logs: FirewallLogEntry[]) => void): () => void {
    this.listeners.add(listener);
    // Send current buffer on subscribe
    listener(this.buffer.toArray());
    return () => this.listeners.delete(listener);
  }

  getSnapshot(): FirewallLogEntry[] {
    return this.buffer.toArray();
  }

  getStats() {
    return {
      totalIngested: this.buffer.size,
      bufferCapacity: 50_000,
      pendingBatch: this.pendingBatch.length,
    };
  }

  destroy(): void {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.listeners.clear();
    this.buffer.clear();
  }
}

interface LogFilter {
  severity?: LogSeverity[];
  action?: LogAction[];
  deviceId?: string;
  search?: string;
  timeRange?: { start: number; end: number };
}
```

### 6.3 useLogStream Hook

```typescript
// ═══════════════════════════════════════════════════
// REACT HOOK — Log stream consumer
// ═══════════════════════════════════════════════════

const LogStreamContext = React.createContext<LogStreamManager | null>(null);

// Provider — at app root
const LogStreamProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const managerRef = useRef(new LogStreamManager());

  useEffect(() => {
    return () => managerRef.current.destroy();
  }, []);

  return (
    <LogStreamContext.Provider value={managerRef.current}>
      {children}
    </LogStreamContext.Provider>
  );
};

// Consumer hook
function useLogStream(filters?: LogFilter) {
  const manager = useContext(LogStreamContext);
  if (!manager) throw new Error('useLogStream must be within LogStreamProvider');

  const [logs, setLogs] = useState<FirewallLogEntry[]>([]);
  const [stats, setStats] = useState(manager.getStats());

  // Apply filters
  useEffect(() => {
    if (filters) manager.setFilters(filters);
  }, [manager, JSON.stringify(filters)]);

  // Subscribe to new logs
  useEffect(() => {
    // Use ref-based accumulation to avoid re-render per batch
    const accumulated = new RingBuffer<FirewallLogEntry>(10_000);
    let rafId: number | null = null;

    const unsub = manager.subscribe((newLogs) => {
      newLogs.forEach(log => accumulated.push(log));

      // Throttle React state updates to 10fps max
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        setLogs(accumulated.toArray());
        setStats(manager.getStats());
      });
    });

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      unsub();
    };
  }, [manager]);

  return { logs, stats };
}
```
