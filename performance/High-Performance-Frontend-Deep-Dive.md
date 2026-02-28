# High-Performance Frontend Development — Cybersecurity Dashboard Deep Dive

> 📅 2026-02-11 · ⏱ 30 phút đọc
>
> Hướng dẫn chuyên sâu cho Senior Frontend Engineer tại công ty Cybersecurity.
> Bao gồm: Dashboard real-time, Zero-Trust Policy Editor, Firewall Rule Management,
> và tối ưu hiệu năng xử lý hàng ngàn events/giây.
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Chủ đề: ReactJS + TypeScript + Real-time Systems

---

## Mục Lục

1. [Tổng Quan — Cybersecurity Frontend Challenges](#1-tổng-quan--cybersecurity-frontend-challenges)
2. [Kiến Trúc Dashboard Real-Time](#2-kiến-trúc-dashboard-real-time)
3. [Data-Heavy Dashboard — Network Traffic Monitor](#3-data-heavy-dashboard--network-traffic-monitor)
4. [Security Event Log Viewer — Xử Lý Hàng Triệu Log](#4-security-event-log-viewer--xử-lý-hàng-triệu-log)
5. [Zero-Trust Policy Editor](#5-zero-trust-policy-editor)
6. [Firewall Rule Management Interface](#6-firewall-rule-management-interface)
7. [Rendering Performance — Thousands of Events Per Second](#7-rendering-performance--thousands-of-events-per-second)
8. [WebSocket & Streaming Architecture](#8-websocket--streaming-architecture)
9. [Web Worker — Offload Heavy Computation](#9-web-worker--offload-heavy-computation)
10. [Canvas & WebGL — Vượt Qua Giới Hạn DOM](#10-canvas--webgl--vượt-qua-giới-hạn-dom)
11. [State Management cho Real-Time Data](#11-state-management-cho-real-time-data)
12. [Testing & Monitoring Performance](#12-testing--monitoring-performance)
13. [Câu Hỏi Phỏng Vấn Senior](#13-câu-hỏi-phỏng-vấn-senior)

---

## 1. Tổng Quan — Cybersecurity Frontend Challenges

```
TẠI SAO CYBERSECURITY FRONTEND KHÓ HƠN WEB APP THÔNG THƯỜNG?
═══════════════════════════════════════════════════════════════

  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  ① DATA VOLUME — Hàng triệu events/ngày                  │
  │  → Network packets, firewall logs, IDS/IPS alerts         │
  │  → Mỗi giây có thể có 1000-5000+ events mới              │
  │  → Traditional DOM rendering KHÔNG THỂ handle             │
  │                                                            │
  │  ② REAL-TIME REQUIREMENT — Delay = Security Risk          │
  │  → SOC Analyst cần thấy alert NGAY LẬP TỨC               │
  │  → 1 giây delay = attacker có thể đã exfiltrate data     │
  │  → Dashboard phải update < 100ms latency                  │
  │                                                            │
  │  ③ COMPLEX VISUALIZATION — Multi-dimensional Data         │
  │  → Network topology graphs (1000+ nodes)                  │
  │  → Time-series charts (millions of data points)           │
  │  → Geo-maps (IP geolocation)                              │
  │  → Correlation matrices, Sankey diagrams                  │
  │                                                            │
  │  ④ POLICY COMPLEXITY — Zero-Trust Rules                   │
  │  → Nested conditional logic (if/then/else chains)         │
  │  → 100-500+ firewall rules với dependencies              │
  │  → Rule conflict detection & resolution                   │
  │  → Version control cho policy changes                     │
  │                                                            │
  │  ⑤ SECURITY OF THE APP ITSELF                             │
  │  → XSS trong security dashboard = ironic catastrophe      │
  │  → CSP headers, input sanitization                        │
  │  → Role-based access (SOC L1/L2/L3, Admin, Auditor)      │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

### Các sản phẩm Cybersecurity Frontend tiêu biểu

```
SẢN PHẨM THAM KHẢO:
═══════════════════════════════════════════════════════════════

  ┌──────────────────┬─────────────────────────────────────────┐
  │ Sản phẩm         │ Frontend Challenges                     │
  ├──────────────────┼─────────────────────────────────────────┤
  │ Splunk           │ Search 10TB+ logs, real-time dashboards │
  │ Elastic SIEM     │ Kibana visualizations, KQL queries      │
  │ CrowdStrike      │ EDR timeline, process tree graphs       │
  │ Palo Alto        │ Firewall policy editor, traffic monitor │
  │ Cloudflare       │ WAF rule builder, analytics dashboard   │
  │ Wiz              │ Cloud security graph, attack paths      │
  │ Snyk             │ Dependency vulnerability trees          │
  └──────────────────┴─────────────────────────────────────────┘

  → Tất cả đều dùng React/TypeScript + custom visualization
  → Tất cả đều phải handle MASSIVE real-time data
```

---

## 2. Kiến Trúc Dashboard Real-Time

```
ARCHITECTURE OVERVIEW — CYBERSECURITY DASHBOARD:
═══════════════════════════════════════════════════════════════

  ┌─────────────────────────────────────────────────────────┐
  │                    DATA SOURCES                          │
  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
  │  │ Firewall │ │   IDS    │ │   SIEM   │ │ Endpoint │  │
  │  │   Logs   │ │  Alerts  │ │  Events  │ │   EDR    │  │
  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘  │
  └───────┼────────────┼────────────┼────────────┼─────────┘
          │            │            │            │
          ▼            ▼            ▼            ▼
  ┌─────────────────────────────────────────────────────────┐
  │              MESSAGE BROKER (Kafka/Redis)                │
  │         Normalize → Enrich → Route to topics            │
  └────────────────────────┬────────────────────────────────┘
                           │
                           ▼
  ┌─────────────────────────────────────────────────────────┐
  │                 BACKEND API LAYER                        │
  │  ┌───────────────┐  ┌───────────────┐                   │
  │  │  REST API     │  │  WebSocket    │                   │
  │  │  (historical) │  │  (real-time)  │                   │
  │  └───────┬───────┘  └───────┬───────┘                   │
  └──────────┼──────────────────┼───────────────────────────┘
             │                  │
             ▼                  ▼
  ┌─────────────────────────────────────────────────────────┐
  │                 FRONTEND (React + TS)                    │
  │                                                          │
  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
  │  │  Event   │ │ Network  │ │  Policy  │ │ Firewall │  │
  │  │  Stream  │ │ Topology │ │  Editor  │ │  Rules   │  │
  │  │  Buffer  │ │  Graph   │ │ (Z-Trust)│ │ Manager  │  │
  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
  │                                                          │
  │  ┌──────────────────────────────────────────────────┐   │
  │  │  PERFORMANCE LAYER                                │   │
  │  │  • Ring Buffer    • Web Workers   • Canvas/WebGL │   │
  │  │  • Virtual Scroll • RAF Batching  • WASM Decoder │   │
  │  └──────────────────────────────────────────────────┘   │
  └─────────────────────────────────────────────────────────┘
```

### TypeScript Types — Core Domain Models

```typescript
// ═══════════════════════════════════════════════════
// CORE SECURITY EVENT TYPES
// ═══════════════════════════════════════════════════

type SeverityLevel = "critical" | "high" | "medium" | "low" | "info";

type EventCategory =
  | "intrusion_detection"
  | "malware"
  | "data_exfiltration"
  | "brute_force"
  | "policy_violation"
  | "anomaly"
  | "authentication"
  | "firewall";

interface SecurityEvent {
  id: string;
  timestamp: number; // Unix ms — dùng number cho performance
  severity: SeverityLevel;
  category: EventCategory;
  sourceIP: string;
  destIP: string;
  sourcePort: number;
  destPort: number;
  protocol: "TCP" | "UDP" | "ICMP" | "HTTP" | "HTTPS" | "DNS";
  action: "allow" | "deny" | "alert" | "drop";
  payload?: string; // Base64 encoded
  ruleId?: string; // Firewall rule matched
  geoSource?: GeoLocation;
  geoDest?: GeoLocation;
  rawLog: string;
}

interface GeoLocation {
  country: string;
  city: string;
  lat: number;
  lng: number;
  asn: string; // Autonomous System Number
  org: string; // Organization
}

// ═══════════════════════════════════════════════════
// NETWORK TRAFFIC TYPES
// ═══════════════════════════════════════════════════

interface NetworkFlow {
  flowId: string;
  sourceIP: string;
  destIP: string;
  bytesIn: number;
  bytesOut: number;
  packetsIn: number;
  packetsOut: number;
  startTime: number;
  endTime: number;
  protocol: string;
  applicationLayer: string; // HTTP, DNS, SSH, etc.
  tlsVersion?: string;
  threatScore: number; // 0-100
}

// ═══════════════════════════════════════════════════
// ZERO-TRUST POLICY TYPES
// ═══════════════════════════════════════════════════

interface ZeroTrustPolicy {
  id: string;
  name: string;
  version: number;
  status: "draft" | "active" | "archived";
  rules: PolicyRule[];
  createdBy: string;
  updatedAt: number;
  appliesTo: PolicyTarget[];
}

interface PolicyRule {
  id: string;
  order: number; // Execution priority
  condition: PolicyCondition;
  action: PolicyAction;
  enabled: boolean;
  description: string;
  tags: string[];
}

interface PolicyCondition {
  type: "and" | "or" | "not" | "match";
  field?: string; // e.g., 'user.role', 'device.os'
  operator?: "eq" | "neq" | "in" | "contains" | "regex" | "gt" | "lt";
  value?: string | number | string[];
  children?: PolicyCondition[]; // Nested conditions for and/or/not
}

type PolicyAction =
  | { type: "allow" }
  | { type: "deny"; reason: string }
  | { type: "challenge"; method: "mfa" | "captcha" | "device_check" }
  | { type: "isolate"; level: "browser" | "network" }
  | { type: "log"; fields: string[] };

interface PolicyTarget {
  type: "user_group" | "ip_range" | "application" | "device_type";
  value: string;
}

// ═══════════════════════════════════════════════════
// FIREWALL RULE TYPES
// ═══════════════════════════════════════════════════

interface FirewallRule {
  id: string;
  order: number;
  name: string;
  enabled: boolean;
  source: NetworkSelector;
  destination: NetworkSelector;
  service: ServiceSelector;
  action: "allow" | "deny" | "drop" | "reject" | "log";
  schedule?: ScheduleConfig;
  logging: boolean;
  hitCount: number; // Số lần rule được match
  lastHit: number | null;
  createdAt: number;
  modifiedAt: number;
  comment: string;
}

interface NetworkSelector {
  type: "any" | "ip" | "cidr" | "range" | "group" | "geo";
  value: string;
  negate: boolean; // "NOT this network"
}

interface ServiceSelector {
  type: "any" | "port" | "port_range" | "protocol" | "service_group";
  value: string;
  protocol?: "tcp" | "udp" | "both";
}
```

---

## 3. Data-Heavy Dashboard — Network Traffic Monitor

### 3.1 Ring Buffer — Cấu Trúc Dữ Liệu Cho Real-Time

```
RING BUFFER — TẠI SAO KHÔNG DÙNG ARRAY THÔNG THƯỜNG?
═══════════════════════════════════════════════════════════════

  ❌ Array thông thường:
  ┌────────────────────────────────────────────────────────┐
  │  events.push(newEvent)     // O(1) amortized          │
  │  if (events.length > MAX)                              │
  │    events.shift()          // O(n) — COPY TOÀN BỘ!   │
  │                                                        │
  │  Với 50,000 events, mỗi shift() = copy 49,999 items  │
  │  Nếu 1000 events/sec → 1000 × shift() = DISASTER    │
  └────────────────────────────────────────────────────────┘

  ✅ Ring Buffer (Circular Buffer):
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │    Index:  0   1   2   3   4   5   6   7              │
  │          ┌───┬───┬───┬───┬───┬───┬───┬───┐            │
  │          │ E │ F │ G │ H │ A │ B │ C │ D │            │
  │          └───┴───┴───┴───┴───┴───┴───┴───┘            │
  │                          ↑               ↑             │
  │                        head            tail            │
  │                     (oldest)         (newest)          │
  │                                                        │
  │  Write: buffer[tail % capacity] = newEvent  // O(1)   │
  │  → Ghi đè item cũ nhất, KHÔNG shift!                 │
  │  → Memory cố định, không GC pressure                  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

```typescript
// ═══════════════════════════════════════════════════
// RING BUFFER IMPLEMENTATION
// ═══════════════════════════════════════════════════

class RingBuffer<T> {
  private buffer: (T | undefined)[];
  private head = 0; // Read position
  private tail = 0; // Write position
  private count = 0;
  private readonly capacity: number;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.buffer = new Array(capacity);
  }

  /** Push item — O(1), overwrites oldest if full */
  push(item: T): void {
    this.buffer[this.tail] = item;
    this.tail = (this.tail + 1) % this.capacity;

    if (this.count === this.capacity) {
      // Buffer đầy → head tiến lên (mất item cũ nhất)
      this.head = (this.head + 1) % this.capacity;
    } else {
      this.count++;
    }
  }

  /** Push nhiều items cùng lúc — batch operation */
  pushBatch(items: T[]): void {
    for (const item of items) {
      this.push(item);
    }
  }

  /** Lấy N items mới nhất — cho rendering */
  getLatest(n: number): T[] {
    const count = Math.min(n, this.count);
    const result: T[] = [];

    for (let i = 0; i < count; i++) {
      const idx = (this.tail - 1 - i + this.capacity) % this.capacity;
      result.push(this.buffer[idx]!);
    }

    return result; // Newest first
  }

  /** Iterate all items — oldest to newest */
  *[Symbol.iterator](): Iterator<T> {
    for (let i = 0; i < this.count; i++) {
      yield this.buffer[(this.head + i) % this.capacity]!;
    }
  }

  get size(): number {
    return this.count;
  }
  get isFull(): boolean {
    return this.count === this.capacity;
  }

  /** Clear buffer — reset without deallocation */
  clear(): void {
    this.head = 0;
    this.tail = 0;
    this.count = 0;
    // KHÔNG tạo array mới → tránh GC!
  }
}

// Usage trong Security Dashboard:
const eventBuffer = new RingBuffer<SecurityEvent>(50_000);
// → Giữ 50K events gần nhất, memory cố định ~20MB
```

### 3.2 Dashboard Layout Component

```typescript
// ═══════════════════════════════════════════════════
// DASHBOARD GRID LAYOUT
// ═══════════════════════════════════════════════════

interface DashboardWidget {
  id: string;
  type: 'traffic_chart' | 'event_stream' | 'geo_map'
      | 'top_threats' | 'policy_violations' | 'bandwidth';
  gridArea: string;     // CSS Grid area
  refreshRate: number;  // ms — mỗi widget có tốc độ riêng
}

const SecurityDashboard: React.FC = () => {
  const widgets: DashboardWidget[] = useMemo(() => [
    { id: 'traffic',   type: 'traffic_chart',      gridArea: '1/1/2/3', refreshRate: 1000 },
    { id: 'events',    type: 'event_stream',        gridArea: '1/3/3/4', refreshRate: 100 },
    { id: 'geo',       type: 'geo_map',             gridArea: '2/1/3/2', refreshRate: 5000 },
    { id: 'threats',   type: 'top_threats',          gridArea: '2/2/3/3', refreshRate: 3000 },
    { id: 'bandwidth', type: 'bandwidth',            gridArea: '3/1/4/4', refreshRate: 2000 },
  ], []);

  return (
    <div className="dashboard-grid">
      {widgets.map(widget => (
        <DashboardPanel key={widget.id} widget={widget} />
      ))}
    </div>
  );
};

// Mỗi widget tự quản lý refresh cycle riêng
const DashboardPanel = React.memo<{ widget: DashboardWidget }>(
  ({ widget }) => {
    // Independent refresh — widget chậm không block widget nhanh
    const data = useWidgetData(widget.id, widget.refreshRate);

    return (
      <div className="panel" style={{ gridArea: widget.gridArea }}>
        <WidgetRenderer type={widget.type} data={data} />
      </div>
    );
  }
);
```

---

## 4. Security Event Log Viewer — Xử Lý Hàng Triệu Log

### 4.1 Virtual Scroll cho Log Viewer

```
VIRTUAL SCROLL — LOG VIEWER ARCHITECTURE:
═══════════════════════════════════════════════════════════════

  Trong Cybersecurity, Log Viewer là component QUAN TRỌNG NHẤT.
  SOC Analyst dành 60-80% thời gian đọc logs.

  REQUIREMENTS:
  ┌────────────────────────────────────────────────────────┐
  │  • Hiển thị 100K-1M+ log entries                      │
  │  • Real-time append (auto-scroll to bottom)           │
  │  • Search/Filter KHÔNG lag                            │
  │  • Syntax highlighting cho log content                │
  │  • Mỗi row có dynamic height (expandable details)     │
  │  • Column resizing & sorting                          │
  │  • Copy-to-clipboard cho investigation               │
  └────────────────────────────────────────────────────────┘

  GIẢI PHÁP: Windowed Virtualization + Ring Buffer

  ┌────────────────── Container ──────────────────────────┐
  │ ┌──────────────────────────────────────────────────┐  │
  │ │ Phantom spacer (height = startIdx × rowHeight)   │  │
  │ ├──────────────────────────────────────────────────┤  │
  │ │ ██ [CRIT] 17:05:32 Brute force from 10.0.0.5   │  │
  │ │ ██ [HIGH] 17:05:32 SQL injection attempt        │  │ ← Visible
  │ │ ██ [MED]  17:05:33 Port scan detected           │  │   Window
  │ │ ██ [LOW]  17:05:33 DNS query anomaly            │  │
  │ │ ██ [INFO] 17:05:34 TLS handshake completed      │  │
  │ ├──────────────────────────────────────────────────┤  │
  │ │ Phantom spacer (height = remaining × rowHeight)  │  │
  │ └──────────────────────────────────────────────────┘  │
  └───────────────────────────────────────────────────────┘
```

```typescript
// ═══════════════════════════════════════════════════
// VIRTUAL LOG VIEWER — OPTIMIZED FOR SECURITY LOGS
// ═══════════════════════════════════════════════════

import { useVirtualizer } from '@tanstack/react-virtual';

interface LogViewerProps {
  buffer: RingBuffer<SecurityEvent>;
  autoScroll: boolean;
  filter?: (event: SecurityEvent) => boolean;
}

const LogViewer: React.FC<LogViewerProps> = ({ buffer, autoScroll, filter }) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);

  // Filtered view — computed lazily
  const visibleEvents = useMemo(() => {
    const all = [...buffer]; // Iterate ring buffer
    return filter ? all.filter(filter) : all;
  }, [buffer.size, filter]); // size thay đổi = có events mới

  const virtualizer = useVirtualizer({
    count: visibleEvents.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 36,    // Estimated row height
    overscan: 20,               // Buffer 20 rows mỗi hướng
  });

  // Auto-scroll to bottom khi có events mới
  // CHỈ KHI user KHÔNG đang manually scroll
  useEffect(() => {
    if (autoScroll && !isUserScrolling) {
      virtualizer.scrollToIndex(visibleEvents.length - 1, {
        align: 'end',
        behavior: 'smooth',
      });
    }
  }, [visibleEvents.length, autoScroll, isUserScrolling]);

  // Detect user manual scroll
  const handleScroll = useCallback(() => {
    const el = parentRef.current;
    if (!el) return;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
    setIsUserScrolling(!isAtBottom);
  }, []);

  return (
    <div
      ref={parentRef}
      onScroll={handleScroll}
      className="log-viewer"
      style={{ height: '100%', overflow: 'auto' }}
    >
      <div style={{
        height: virtualizer.getTotalSize(),
        position: 'relative',
      }}>
        {virtualizer.getVirtualItems().map(virtualRow => (
          <LogRow
            key={virtualRow.key}
            event={visibleEvents[virtualRow.index]}
            style={{
              position: 'absolute',
              top: virtualRow.start,
              height: virtualRow.size,
              width: '100%',
            }}
          />
        ))}
      </div>
    </div>
  );
};

// Severity color coding — critical for SOC workflow
const SEVERITY_COLORS: Record<SeverityLevel, string> = {
  critical: '#ff1744',
  high:     '#ff9100',
  medium:   '#ffd600',
  low:      '#00e5ff',
  info:     '#b0bec5',
};

const LogRow = React.memo<{ event: SecurityEvent; style: React.CSSProperties }>(
  ({ event, style }) => (
    <div className="log-row" style={style}>
      <span className="timestamp">
        {formatTimestamp(event.timestamp)}
      </span>
      <span
        className="severity-badge"
        style={{ backgroundColor: SEVERITY_COLORS[event.severity] }}
      >
        {event.severity.toUpperCase()}
      </span>
      <span className="source-ip">{event.sourceIP}</span>
      <span className="arrow">→</span>
      <span className="dest-ip">{event.destIP}</span>
      <span className="category">{event.category}</span>
      <span className="action">{event.action}</span>
    </div>
  )
);
```

---

## 5. Zero-Trust Policy Editor

```
ZERO-TRUST POLICY EDITOR — DESIGN CHALLENGES:
═══════════════════════════════════════════════════════════════

  Zero-Trust = "Never trust, always verify"
  Mỗi request phải được EVALUATE qua policy rules.

  EDITOR PHẢI HỖ TRỢ:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ① VISUAL RULE BUILDER                                │
  │  → Drag-and-drop conditions (AND/OR/NOT)              │
  │  → Nested logic trees (unlimited depth)               │
  │  → Real-time validation ("rule conflict detected!")   │
  │                                                        │
  │  ② POLICY SIMULATION                                   │
  │  → "What if?" — test policy against sample traffic    │
  │  → Show which rules match, in what order              │
  │  → Highlight shadowed/unreachable rules               │
  │                                                        │
  │  ③ DIFF & VERSION CONTROL                              │
  │  → Side-by-side comparison of policy versions         │
  │  → Audit trail — who changed what, when               │
  │  → Rollback to previous version                       │
  │                                                        │
  │  ④ CONFLICT DETECTION                                  │
  │  → Rule A: Allow 10.0.0.0/8 on port 443             │
  │  → Rule B: Deny 10.0.0.5 on port 443                │
  │  → Order matters! Highlight potential conflicts       │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 5.1 Recursive Condition Tree Component

```typescript
// ═══════════════════════════════════════════════════
// CONDITION TREE — RECURSIVE VISUAL BUILDER
// ═══════════════════════════════════════════════════

interface ConditionNodeProps {
  condition: PolicyCondition;
  path: number[];            // Vị trí trong tree [0, 2, 1]
  onChange: (path: number[], updated: PolicyCondition) => void;
  onDelete: (path: number[]) => void;
  depth: number;
}

const ConditionNode: React.FC<ConditionNodeProps> = ({
  condition, path, onChange, onDelete, depth,
}) => {
  // Logic group (AND / OR / NOT)
  if (condition.type === 'and' || condition.type === 'or' || condition.type === 'not') {
    return (
      <div
        className={`condition-group condition-${condition.type}`}
        style={{ marginLeft: depth * 24 }}
      >
        <div className="group-header">
          {/* Toggle giữa AND/OR/NOT */}
          <select
            value={condition.type}
            onChange={e => onChange(path, {
              ...condition,
              type: e.target.value as 'and' | 'or' | 'not',
            })}
          >
            <option value="and">AND — All conditions must match</option>
            <option value="or">OR — Any condition can match</option>
            <option value="not">NOT — Negate the result</option>
          </select>

          <button onClick={() => onDelete(path)} className="delete-btn">
            ✕ Remove Group
          </button>
        </div>

        {/* Render children recursively */}
        <div className="group-children">
          {condition.children?.map((child, idx) => (
            <ConditionNode
              key={idx}
              condition={child}
              path={[...path, idx]}
              onChange={onChange}
              onDelete={onDelete}
              depth={depth + 1}
            />
          ))}

          <button
            className="add-condition-btn"
            onClick={() => {
              const newChild: PolicyCondition = {
                type: 'match',
                field: 'user.email',
                operator: 'eq',
                value: '',
              };
              onChange(path, {
                ...condition,
                children: [...(condition.children || []), newChild],
              });
            }}
          >
            + Add Condition
          </button>
        </div>
      </div>
    );
  }

  // Leaf condition (match)
  return (
    <div className="condition-leaf" style={{ marginLeft: depth * 24 }}>
      <FieldSelector
        value={condition.field!}
        onChange={field => onChange(path, { ...condition, field })}
      />
      <OperatorSelector
        value={condition.operator!}
        onChange={operator => onChange(path, { ...condition, operator })}
      />
      <ValueInput
        value={condition.value!}
        operator={condition.operator!}
        onChange={value => onChange(path, { ...condition, value })}
      />
      <button onClick={() => onDelete(path)} className="delete-btn">✕</button>
    </div>
  );
};
```

### 5.2 Immutable Update Helper cho Nested Trees

```typescript
// ═══════════════════════════════════════════════════
// IMMUTABLE TREE UPDATE — CRITICAL FOR REACT
// ═══════════════════════════════════════════════════
// React cần reference thay đổi để re-render.
// Với nested tree, phải tạo object mới ở MỖI LEVEL.

function updateConditionAtPath(
  root: PolicyCondition,
  path: number[],
  updater: (node: PolicyCondition) => PolicyCondition,
): PolicyCondition {
  if (path.length === 0) {
    return updater(root);
  }

  const [head, ...rest] = path;
  const children = root.children ? [...root.children] : [];

  children[head] = updateConditionAtPath(children[head], rest, updater);

  return { ...root, children };
}

function deleteConditionAtPath(
  root: PolicyCondition,
  path: number[],
): PolicyCondition {
  if (path.length === 1) {
    return {
      ...root,
      children: root.children?.filter((_, i) => i !== path[0]),
    };
  }

  const [head, ...rest] = path;
  const children = root.children ? [...root.children] : [];
  children[head] = deleteConditionAtPath(children[head], rest);

  return { ...root, children };
}

// Usage trong PolicyEditor:
const handleConditionChange = useCallback(
  (path: number[], updated: PolicyCondition) => {
    setPolicy((prev) => ({
      ...prev,
      rules: prev.rules.map((rule, i) =>
        i === activeRuleIndex
          ? {
              ...rule,
              condition:
                path.length === 0
                  ? updated
                  : updateConditionAtPath(rule.condition, path, () => updated),
            }
          : rule,
      ),
    }));
  },
  [activeRuleIndex],
);
```

### 5.3 Rule Conflict Detection

```typescript
// ═══════════════════════════════════════════════════
// CONFLICT DETECTION — OVERLAPPING RULES
// ═══════════════════════════════════════════════════

interface RuleConflict {
  ruleA: PolicyRule;
  ruleB: PolicyRule;
  type: 'shadow' | 'contradiction' | 'redundancy';
  description: string;
}

function detectConflicts(rules: PolicyRule[]): RuleConflict[] {
  const conflicts: RuleConflict[] = [];

  for (let i = 0; i < rules.length; i++) {
    for (let j = i + 1; j < rules.length; j++) {
      const ruleA = rules[i];
      const ruleB = rules[j];

      // Check if conditions overlap
      const overlap = checkConditionOverlap(ruleA.condition, ruleB.condition);

      if (overlap) {
        if (ruleA.action.type !== ruleB.action.type) {
          // Contradiction: same traffic, different actions
          conflicts.push({
            ruleA, ruleB,
            type: 'contradiction',
            description:
              `Rule "${ruleA.description}" (${ruleA.action.type}) ` +
              `conflicts with "${ruleB.description}" (${ruleB.action.type})`,
          });
        } else if (isSubset(ruleB.condition, ruleA.condition)) {
          // Shadow: ruleA is broader and comes first → ruleB never fires
          conflicts.push({
            ruleA, ruleB,
            type: 'shadow',
            description:
              `Rule "${ruleB.description}" is shadowed by ` +
              `"${ruleA.description}" and will NEVER match`,
          });
        }
      }
    }
  }

  return conflicts;
}

// Hiển thị trong UI:
const ConflictWarnings: React.FC<{ conflicts: RuleConflict[] }> = ({ conflicts }) => (
  <div className="conflict-panel">
    {conflicts.map((c, i) => (
      <div key={i} className={`conflict-item conflict-${c.type}`}>
        <span className="conflict-icon">
          {c.type === 'shadow' ? '👁️‍🗨️' :
           c.type === 'contradiction' ? '⚠️' : 'ℹ️'}
        </span>
        <span>{c.description}</span>
      </div>
    ))}
  </div>
);
```

---

## 6. Firewall Rule Management Interface

```
FIREWALL RULE EDITOR — KEY PATTERNS:
═══════════════════════════════════════════════════════════════

  ┌────────────────────────────────────────────────────────┐
  │  FIREWALL RULES TABLE                                  │
  │                                                        │
  │  #  │ Name           │ Src       │ Dst       │ Action │
  │  ───┼────────────────┼───────────┼───────────┼────────│
  │  1  │ Block China    │ CN (geo)  │ Any       │ ⛔ DENY │
  │  2  │ Allow VPN      │ 10.0.0/8  │ 10.1.0/24│ ✅ ALLOW│
  │  3  │ DMZ Access     │ Any       │ DMZ Group │ ✅ ALLOW│
  │  4  │ Drop All       │ Any       │ Any       │ ⛔ DROP │
  │  ───┴────────────────┴───────────┴───────────┴────────│
  │                                                        │
  │  FEATURES CẦN THIẾT:                                   │
  │  ① Drag-and-drop reorder (order = priority)           │
  │  ② Inline editing (click to edit, save on blur)       │
  │  ③ Hit count display (rule được match bao nhiêu lần) │
  │  ④ Enable/Disable toggle per rule                     │
  │  ⑤ Batch operations (select multiple → delete/move)  │
  │  ⑥ Search & filter across 500+ rules                 │
  │  ⑦ Import/Export (CSV, JSON, vendor-specific format)  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 6.1 Drag-and-Drop Rule Reordering

```typescript
// ═══════════════════════════════════════════════════
// DnD RULE REORDERING — dnd-kit library
// ═══════════════════════════════════════════════════

import {
  DndContext, closestCenter, PointerSensor,
  useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy,
  useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const FirewallRuleTable: React.FC = () => {
  const [rules, setRules] = useState<FirewallRule[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }, // Prevent accidental drags
    })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setRules(prev => {
      const oldIndex = prev.findIndex(r => r.id === active.id);
      const newIndex = prev.findIndex(r => r.id === over.id);
      const reordered = arrayMove(prev, oldIndex, newIndex);

      // Cập nhật order field sau khi reorder
      return reordered.map((rule, idx) => ({
        ...rule,
        order: idx + 1,
      }));
    });

    // Persist to backend
    saveRuleOrder(rules.map(r => r.id));
  }, [rules]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={rules.map(r => r.id)}
        strategy={verticalListSortingStrategy}
      >
        <table className="firewall-rules-table">
          <thead>
            <tr>
              <th>#</th><th>Name</th><th>Source</th>
              <th>Destination</th><th>Service</th>
              <th>Action</th><th>Hits</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rules.map(rule => (
              <SortableRuleRow key={rule.id} rule={rule} />
            ))}
          </tbody>
        </table>
      </SortableContext>
    </DndContext>
  );
};

const SortableRuleRow: React.FC<{ rule: FirewallRule }> = ({ rule }) => {
  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id: rule.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: 'grab',
  };

  return (
    <tr ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <td>{rule.order}</td>
      <td>{rule.name}</td>
      <td><NetworkBadge selector={rule.source} /></td>
      <td><NetworkBadge selector={rule.destination} /></td>
      <td><ServiceBadge selector={rule.service} /></td>
      <td><ActionBadge action={rule.action} /></td>
      <td className="hit-count">{formatHitCount(rule.hitCount)}</td>
      <td>
        <ToggleSwitch
          checked={rule.enabled}
          onChange={() => toggleRule(rule.id)}
        />
      </td>
    </tr>
  );
};
```

### 6.2 Optimistic Updates & Undo

```typescript
// ═══════════════════════════════════════════════════
// OPTIMISTIC UPDATE + UNDO PATTERN
// ═══════════════════════════════════════════════════
// Firewall rule changes cần IMMEDIATE feedback
// nhưng cũng cần UNDO vì sai lầm = security incident

interface UndoableAction {
  id: string;
  description: string;
  execute: () => Promise<void>;
  undo: () => Promise<void>;
  timestamp: number;
}

function useUndoableActions() {
  const [history, setHistory] = useState<UndoableAction[]>([]);
  const [undoTimeoutId, setUndoTimeoutId] = useState<NodeJS.Timeout | null>(
    null,
  );
  const UNDO_WINDOW = 10_000; // 10 seconds to undo

  const perform = useCallback(async (action: UndoableAction) => {
    // 1. Execute optimistically (update UI immediately)
    await action.execute();

    // 2. Add to undo history
    setHistory((prev) => [...prev, action]);

    // 3. Show toast with undo button
    showToast({
      message: action.description,
      action: {
        label: "Undo",
        onClick: () => undoLast(),
      },
      duration: UNDO_WINDOW,
    });
  }, []);

  const undoLast = useCallback(async () => {
    setHistory((prev) => {
      const last = prev[prev.length - 1];
      if (last) {
        last.undo(); // Revert the change
        return prev.slice(0, -1);
      }
      return prev;
    });
  }, []);

  return { perform, undoLast, history };
}

// Usage:
// const { perform } = useUndoableActions();
// perform({
//   id: 'delete-rule-5',
//   description: 'Deleted rule "Block China"',
//   execute: () => deleteRuleAPI(ruleId),
//   undo: () => restoreRuleAPI(ruleId, ruleSnapshot),
// });
```

---

## 7. Rendering Performance — Thousands of Events Per Second

```
PERFORMANCE BOTTLENECK ANALYSIS:
═══════════════════════════════════════════════════════════════

  1000 events/sec → MỖI GIÂY phải handle:

  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ① PARSE: 1000 JSON objects (WebSocket messages)      │
  │  ② FILTER: Check against active filters               │
  │  ③ INDEX: Update lookup maps (IP → events)            │
  │  ④ AGGREGATE: Update charts, counters, histograms     │
  │  ⑤ RENDER: Update visible DOM elements                │
  │                                                        │
  │  NẾU LÀM TẤT CẢ TRÊN MAIN THREAD:                    │
  │  → 1000 setState() calls = 1000 re-renders           │
  │  → Browser FREEZE!                                     │
  │                                                        │
  │  GIẢI PHÁP: BATCH + BUFFER + THROTTLE                 │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 7.1 RAF Batching — Core Pattern

```typescript
// ═══════════════════════════════════════════════════
// RAF BATCHING — GOLDEN PATTERN CHO REAL-TIME UI
// ═══════════════════════════════════════════════════

function useRAFBatch<T>(onFlush: (items: T[]) => void, maxBatchSize = 500) {
  const bufferRef = useRef<T[]>([]);
  const rafIdRef = useRef<number | null>(null);
  const onFlushRef = useRef(onFlush);
  onFlushRef.current = onFlush;

  const add = useCallback(
    (item: T) => {
      bufferRef.current.push(item);

      // Nếu buffer đầy → flush ngay (backpressure)
      if (bufferRef.current.length >= maxBatchSize) {
        if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
        flush();
        return;
      }

      // Schedule flush at next frame
      if (!rafIdRef.current) {
        rafIdRef.current = requestAnimationFrame(flush);
      }
    },
    [maxBatchSize],
  );

  const flush = useCallback(() => {
    rafIdRef.current = null;
    if (bufferRef.current.length === 0) return;

    const batch = bufferRef.current;
    bufferRef.current = []; // Swap buffer — O(1)!
    onFlushRef.current(batch);
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, []);

  return { add, flush };
}

// Usage:
// const { add } = useRAFBatch<SecurityEvent>((batch) => {
//   eventBuffer.pushBatch(batch);
//   updateAggregates(batch);
//   // Chỉ 1 setState per frame!
//   setEventCount(prev => prev + batch.length);
// });
//
// ws.onmessage = (msg) => add(JSON.parse(msg.data));
```

### 7.2 Aggregate Counters — Tránh Re-render Toàn Dashboard

```typescript
// ═══════════════════════════════════════════════════
// AGGREGATE STATE — GIẢM RE-RENDERS
// ═══════════════════════════════════════════════════

// ❌ SAI — mỗi event → re-render toàn bộ dashboard
// const [events, setEvents] = useState<SecurityEvent[]>([]);
// setEvents(prev => [...prev, ...newBatch]); // Copy TOÀN BỘ array!

// ✅ ĐÚNG — tách state thành independent atoms
interface DashboardAggregates {
  totalEvents: number;
  bySeverity: Record<SeverityLevel, number>;
  byCategory: Record<EventCategory, number>;
  topSourceIPs: Array<{ ip: string; count: number }>;
  eventsPerSecond: number;
  timeSeriesData: Array<{ timestamp: number; count: number }>;
}

function useAggregateState() {
  // Mỗi widget subscribe CHỈ phần data nó cần
  const aggregatesRef = useRef<DashboardAggregates>(initialAggregates);
  const [, forceRender] = useReducer((x) => x + 1, 0);
  const lastRenderRef = useRef(0);

  const updateAggregates = useCallback((batch: SecurityEvent[]) => {
    const agg = aggregatesRef.current;

    for (const event of batch) {
      agg.totalEvents++;
      agg.bySeverity[event.severity]++;
      agg.byCategory[event.category]++;
    }

    // Throttle UI updates to max 10fps for aggregates
    const now = performance.now();
    if (now - lastRenderRef.current > 100) {
      lastRenderRef.current = now;
      forceRender(); // Trigger re-render
    }
  }, []);

  return { aggregates: aggregatesRef.current, updateAggregates };
}
```

---

## 8. WebSocket & Streaming Architecture

```
WEBSOCKET PATTERN CHO SECURITY EVENTS:
═══════════════════════════════════════════════════════════════

  ┌────────────── Frontend ──────────────────────────────┐
  │                                                       │
  │  WebSocket   →  Message   →  RAF      →  Ring     →  │ UI
  │  Connection     Parser       Batcher     Buffer       │ Update
  │                                                       │
  │  Features cần có:                                     │
  │  • Auto-reconnect with exponential backoff           │
  │  • Heartbeat/ping-pong                                │
  │  • Subscription management (topics/channels)         │
  │  • Binary protocol support (Protobuf/MessagePack)    │
  │  • Backpressure handling                              │
  │                                                       │
  └───────────────────────────────────────────────────────┘
```

```typescript
// ═══════════════════════════════════════════════════
// RESILIENT WEBSOCKET — AUTO-RECONNECT + HEARTBEAT
// ═══════════════════════════════════════════════════

class SecurityWebSocket {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private heartbeatTimer: NodeJS.Timer | null = null;
  private readonly maxReconnectDelay = 30_000;
  private readonly heartbeatInterval = 15_000;

  constructor(
    private url: string,
    private onEvent: (event: SecurityEvent) => void,
    private onStatusChange: (
      status: "connected" | "reconnecting" | "error",
    ) => void,
  ) {}

  connect(): void {
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.onStatusChange("connected");
      this.startHeartbeat();

      // Subscribe to channels
      this.send({
        type: "subscribe",
        channels: ["firewall", "ids", "auth", "malware"],
      });
    };

    this.ws.onmessage = (msg) => {
      // Binary support — Protobuf decode
      if (msg.data instanceof ArrayBuffer) {
        const events = decodeProtobuf(msg.data);
        events.forEach(this.onEvent);
        return;
      }

      // JSON fallback
      const data = JSON.parse(msg.data);
      if (data.type === "pong") return; // Heartbeat response
      if (data.type === "event") this.onEvent(data.payload);
      if (data.type === "batch") data.payload.forEach(this.onEvent);
    };

    this.ws.onclose = () => {
      this.stopHeartbeat();
      this.reconnect();
    };

    this.ws.onerror = () => {
      this.onStatusChange("error");
    };
  }

  private reconnect(): void {
    this.onStatusChange("reconnecting");
    // Exponential backoff: 1s, 2s, 4s, 8s, ... max 30s
    const delay = Math.min(
      1000 * Math.pow(2, this.reconnectAttempts),
      this.maxReconnectDelay,
    );
    this.reconnectAttempts++;

    setTimeout(() => this.connect(), delay);
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      this.send({ type: "ping", timestamp: Date.now() });
    }, this.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private send(data: object): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  disconnect(): void {
    this.stopHeartbeat();
    this.ws?.close();
  }
}
```

---

## 9. Web Worker — Offload Heavy Computation

```
WEB WORKER USE-CASES TRONG CYBERSECURITY:
═══════════════════════════════════════════════════════════════

  ┌────────────────────────────────────────────────────────┐
  │  Main Thread (UI)        │  Worker Thread (Background) │
  │──────────────────────────┼────────────────────────────│
  │  • Render components     │  • Parse 10K logs/batch    │
  │  • Handle user input     │  • Regex search across logs│
  │  • Animations            │  • IP geolocation lookup   │
  │  • WebSocket receive     │  • Rule conflict detection │
  │                          │  • CSV export generation   │
  │                          │  • Threat score calculation│
  │                          │  • Data aggregation        │
  └────────────────────────────────────────────────────────┘
```

```typescript
// ═══════════════════════════════════════════════════
// TYPED WEB WORKER — security-worker.ts
// ═══════════════════════════════════════════════════

// Worker messages — strictly typed
type WorkerRequest =
  | { type: "SEARCH_LOGS"; query: string; logs: SecurityEvent[] }
  | { type: "AGGREGATE"; events: SecurityEvent[]; groupBy: string }
  | { type: "DETECT_ANOMALY"; flows: NetworkFlow[]; baseline: number[] }
  | { type: "EXPORT_CSV"; events: SecurityEvent[]; columns: string[] };

type WorkerResponse =
  | { type: "SEARCH_RESULTS"; matches: SecurityEvent[]; took: number }
  | { type: "AGGREGATE_RESULTS"; data: Record<string, number> }
  | { type: "ANOMALY_RESULTS"; anomalies: NetworkFlow[] }
  | { type: "EXPORT_DONE"; csv: string };

// Worker file (security.worker.ts):
self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const { data } = e;

  switch (data.type) {
    case "SEARCH_LOGS": {
      const start = performance.now();
      const regex = new RegExp(data.query, "i");
      const matches = data.logs.filter(
        (log) =>
          regex.test(log.rawLog) ||
          regex.test(log.sourceIP) ||
          regex.test(log.destIP) ||
          regex.test(log.category),
      );
      self.postMessage({
        type: "SEARCH_RESULTS",
        matches,
        took: performance.now() - start,
      } satisfies WorkerResponse);
      break;
    }

    case "AGGREGATE": {
      const grouped: Record<string, number> = {};
      for (const event of data.events) {
        const key = (event as any)[data.groupBy] ?? "unknown";
        grouped[key] = (grouped[key] || 0) + 1;
      }
      self.postMessage({
        type: "AGGREGATE_RESULTS",
        data: grouped,
      } satisfies WorkerResponse);
      break;
    }

    case "EXPORT_CSV": {
      const header = data.columns.join(",");
      const rows = data.events.map((e) =>
        data.columns
          .map((col) => JSON.stringify((e as any)[col] ?? ""))
          .join(","),
      );
      self.postMessage({
        type: "EXPORT_DONE",
        csv: [header, ...rows].join("\n"),
      } satisfies WorkerResponse);
      break;
    }
  }
};

// ═══════════════════════════════════════════════════
// REACT HOOK — useWorker
// ═══════════════════════════════════════════════════

function useSecurityWorker() {
  const workerRef = useRef<Worker | null>(null);
  const callbacksRef = useRef<Map<string, (data: WorkerResponse) => void>>(
    new Map(),
  );

  useEffect(() => {
    workerRef.current = new Worker(
      new URL("./security.worker.ts", import.meta.url),
      { type: "module" },
    );

    workerRef.current.onmessage = (e: MessageEvent<WorkerResponse>) => {
      const callback = callbacksRef.current.get(e.data.type);
      callback?.(e.data);
    };

    return () => workerRef.current?.terminate();
  }, []);

  const searchLogs = useCallback(
    (query: string, logs: SecurityEvent[]): Promise<WorkerResponse> => {
      return new Promise((resolve) => {
        callbacksRef.current.set("SEARCH_RESULTS", resolve);
        workerRef.current?.postMessage({
          type: "SEARCH_LOGS",
          query,
          logs,
        } satisfies WorkerRequest);
      });
    },
    [],
  );

  return { searchLogs };
}
```

---

## 10. Canvas & WebGL — Vượt Qua Giới Hạn DOM

```
KHI NÀO CẦN CANVAS THAY VÌ DOM?
═══════════════════════════════════════════════════════════════

  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  DOM (React Components):                               │
  │  → Tốt cho: forms, tables, text, interactive UI       │
  │  → Giới hạn: ~10K nodes trước khi lag                 │
  │  → Mỗi node = object trong memory + layout engine     │
  │                                                        │
  │  Canvas 2D:                                            │
  │  → Tốt cho: charts, heatmaps, simple visualizations   │
  │  → Giới hạn: CPU-bound (single thread)                │
  │  → Pixel-based, không có "objects" → ít memory        │
  │                                                        │
  │  WebGL (GPU):                                          │
  │  → Tốt cho: network topology (10K+ nodes), particle   │
  │  → Giới hạn: complex setup, shader programming        │
  │  → GPU-accelerated → HÀNG TRIỆU elements             │
  │                                                        │
  │  TRONG CYBERSECURITY:                                   │
  │  ┌──────────────────────────┬────────────────────────┐ │
  │  │ Use Case                 │ Recommendation         │ │
  │  ├──────────────────────────┼────────────────────────┤ │
  │  │ Log table (100K rows)    │ DOM + Virtual Scroll   │ │
  │  │ Time-series chart        │ Canvas 2D              │ │
  │  │ Network topology graph   │ WebGL (via Deck.gl)    │ │
  │  │ Geo IP map               │ Canvas + WebGL tiles   │ │
  │  │ Packet flow animation    │ Canvas 2D              │ │
  │  │ Threat heatmap           │ WebGL                  │ │
  │  └──────────────────────────┴────────────────────────┘ │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 10.1 Canvas Time-Series Chart cho Events/Second

```typescript
// ═══════════════════════════════════════════════════
// CANVAS CHART — REAL-TIME EVENTS PER SECOND
// ═══════════════════════════════════════════════════

interface TimeSeriesPoint {
  timestamp: number;
  value: number;
  severity?: SeverityLevel;
}

const RealtimeChart: React.FC<{
  data: TimeSeriesPoint[];
  width: number;
  height: number;
}> = ({ data, width, height }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    // Set DPR for sharp rendering on Retina displays
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    function draw() {
      ctx.clearRect(0, 0, width, height);

      if (data.length < 2) return;

      // Calculate scales
      const xScale = width / (data.length - 1);
      const maxValue = Math.max(...data.map(d => d.value), 1);
      const yScale = (height - 40) / maxValue; // 40px padding

      // Draw grid lines
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 5; i++) {
        const y = (height - 40) * (i / 4) + 20;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw area fill (gradient)
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, 'rgba(0, 229, 255, 0.3)');
      gradient.addColorStop(1, 'rgba(0, 229, 255, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(0, height - 20);
      data.forEach((point, i) => {
        ctx.lineTo(i * xScale, height - 20 - point.value * yScale);
      });
      ctx.lineTo(width, height - 20);
      ctx.closePath();
      ctx.fill();

      // Draw line
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      data.forEach((point, i) => {
        const x = i * xScale;
        const y = height - 20 - point.value * yScale;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Draw current value
      const latest = data[data.length - 1];
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 24px Inter, sans-serif';
      ctx.fillText(`${latest.value.toLocaleString()} events/s`, 10, 30);

      rafRef.current = requestAnimationFrame(draw);
    }

    draw();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [data, width, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height }}
      className="realtime-chart"
    />
  );
};
```

### 10.2 OffscreenCanvas trong Web Worker

```typescript
// ═══════════════════════════════════════════════════
// OFFSCREENCANVAS — RENDER TRONG WORKER THREAD
// ═══════════════════════════════════════════════════
// Cho phép vẽ Canvas HOÀN TOÀN ở background thread
// → Main thread 100% free cho UI interaction!

// Main thread:
const canvas = document.getElementById("chart") as HTMLCanvasElement;
const offscreen = canvas.transferControlToOffscreen();

const worker = new Worker("chart.worker.ts");
worker.postMessage({ canvas: offscreen }, [offscreen]); // Transfer ownership!

// chart.worker.ts:
self.onmessage = (e) => {
  if (e.data.canvas) {
    const ctx = e.data.canvas.getContext("2d");

    // Render loop chạy HOÀN TOÀN trong worker!
    function draw(data: TimeSeriesPoint[]) {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      // ... vẽ chart ở đây
      // Main thread KHÔNG BỊ ẢNH HƯỞNG!
    }

    // Nhận data updates
    self.onmessage = (e) => {
      if (e.data.type === "UPDATE_DATA") {
        draw(e.data.points);
      }
    };
  }
};

// ⚠️ Browser support: Chrome 69+, Firefox 105+, Safari 16.4+
// Kiểm tra: if ('OffscreenCanvas' in window) { ... }
```

---

## 11. State Management cho Real-Time Data

```
STATE MANAGEMENT STRATEGIES — SO SÁNH:
═══════════════════════════════════════════════════════════════

  ┌────────────────────┬──────────────────────────────────────┐
  │ Approach           │ Khi nào dùng                         │
  ├────────────────────┼──────────────────────────────────────┤
  │ useRef + forceRe-  │ High-frequency data (>10 updates/s) │
  │ render             │ Khi KHÔNG cần mọi update trigger     │
  │                    │ re-render. Throttle render manually. │
  ├────────────────────┼──────────────────────────────────────┤
  │ Zustand            │ Dashboard state, filter state.       │
  │                    │ Nhẹ, selector-based subscriptions.   │
  │                    │ Chỉ re-render component CẦN.         │
  ├────────────────────┼──────────────────────────────────────┤
  │ Jotai              │ Fine-grained atoms. Mỗi widget =    │
  │                    │ 1 atom. Update 1 widget không ảnh    │
  │                    │ hưởng widgets khác.                  │
  ├────────────────────┼──────────────────────────────────────┤
  │ Redux              │ Complex business logic (policies,    │
  │                    │ rules). Cần middleware (saga/thunk)  │
  │                    │ cho async flows. DevTools debug.     │
  ├────────────────────┼──────────────────────────────────────┤
  │ External Store +   │ Ring buffer, aggregate counters.     │
  │ useSyncExternal-   │ Data lives OUTSIDE React. React chỉ │
  │ Store              │ subscribe và render khi cần.         │
  └────────────────────┴──────────────────────────────────────┘
```

### 11.1 useSyncExternalStore cho Ring Buffer

```typescript
// ═══════════════════════════════════════════════════
// useSyncExternalStore — CONNECT RING BUFFER TO REACT
// ═══════════════════════════════════════════════════
// Ring Buffer sống NGOÀI React → performance tốt nhất
// React chỉ "subscribe" và render khi được thông báo

import { useSyncExternalStore } from "react";

class EventStore {
  private buffer = new RingBuffer<SecurityEvent>(50_000);
  private listeners = new Set<() => void>();
  private version = 0;
  private throttleTimer: number | null = null;

  push(events: SecurityEvent[]): void {
    this.buffer.pushBatch(events);
    this.version++;

    // Throttle notifications to max 30fps
    if (!this.throttleTimer) {
      this.throttleTimer = window.setTimeout(() => {
        this.throttleTimer = null;
        this.notify();
      }, 33); // ~30fps
    }
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener());
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getSnapshot(): SecurityEvent[] {
    return this.buffer.getLatest(100); // Chỉ lấy 100 mới nhất để render
  }

  getVersion(): number {
    return this.version;
  }
}

// Singleton store
const eventStore = new EventStore();

// React Hook:
function useLatestEvents(count = 100): SecurityEvent[] {
  return useSyncExternalStore(
    (callback) => eventStore.subscribe(callback),
    () => eventStore.getSnapshot(),
  );
}

// Usage:
// const events = useLatestEvents(50);
// → Component chỉ re-render max 30fps
// → Ring buffer nhận 1000+ events/s mà không lag
```

### 11.2 Zustand Store cho Dashboard Filters

```typescript
// ═══════════════════════════════════════════════════
// ZUSTAND STORE — DASHBOARD FILTERS & UI STATE
// ═══════════════════════════════════════════════════

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

interface DashboardStore {
  // Filters
  severityFilter: SeverityLevel[];
  categoryFilter: EventCategory[];
  timeRange: { start: number; end: number } | "live";
  searchQuery: string;

  // UI State
  selectedEventId: string | null;
  isLiveMode: boolean;
  layout: "grid" | "focus";

  // Actions
  toggleSeverity: (severity: SeverityLevel) => void;
  setTimeRange: (range: DashboardStore["timeRange"]) => void;
  setSearchQuery: (query: string) => void;
  selectEvent: (id: string | null) => void;
  toggleLiveMode: () => void;
}

const useDashboardStore = create<DashboardStore>()(
  subscribeWithSelector((set) => ({
    // Initial state
    severityFilter: ["critical", "high", "medium"],
    categoryFilter: [],
    timeRange: "live",
    searchQuery: "",
    selectedEventId: null,
    isLiveMode: true,
    layout: "grid",

    // Actions — chỉ re-render components subscribe field đó
    toggleSeverity: (severity) =>
      set((state) => ({
        severityFilter: state.severityFilter.includes(severity)
          ? state.severityFilter.filter((s) => s !== severity)
          : [...state.severityFilter, severity],
      })),

    setTimeRange: (range) => set({ timeRange: range }),
    setSearchQuery: (query) => set({ searchQuery: query }),
    selectEvent: (id) => set({ selectedEventId: id }),
    toggleLiveMode: () => set((s) => ({ isLiveMode: !s.isLiveMode })),
  })),
);

// Component chỉ subscribe severity → chỉ re-render khi severity thay đổi
// const severity = useDashboardStore(s => s.severityFilter);
```

---

## 12. Testing & Monitoring Performance

```
PERFORMANCE TESTING CHECKLIST:
═══════════════════════════════════════════════════════════════

  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ① METRICS TO TRACK:                                   │
  │  ┌──────────────────────┬──────────────────────────┐  │
  │  │ Metric               │ Target                   │  │
  │  ├──────────────────────┼──────────────────────────┤  │
  │  │ FPS during streaming │ ≥ 30fps sustained        │  │
  │  │ Memory usage         │ < 200MB after 1 hour     │  │
  │  │ Event-to-render      │ < 100ms (P95)            │  │
  │  │ Search latency       │ < 500ms for 100K logs    │  │
  │  │ Initial load         │ < 3s (LCP)               │  │
  │  │ Long tasks           │ No tasks > 50ms          │  │
  │  │ Layout shifts        │ CLS < 0.1                │  │
  │  └──────────────────────┴──────────────────────────┘  │
  │                                                        │
  │  ② TOOLS:                                              │
  │  • Chrome DevTools Performance tab                    │
  │  • React DevTools Profiler                            │
  │  • Chrome Memory tab (heap snapshots)                 │
  │  • Performance Observer API (programmatic)            │
  │  • Lighthouse CI (automated checks)                   │
  │                                                        │
  │  ③ LOAD TESTING:                                       │
  │  • Simulate 5000 events/sec via WebSocket mock        │
  │  • Run for 30 minutes → check memory leaks            │
  │  • Test with 500 firewall rules (drag-and-drop)       │
  │  • Test with 10-level deep policy condition tree       │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 12.1 Performance Observer Hook

```typescript
// ═══════════════════════════════════════════════════
// PERFORMANCE MONITORING — LONG TASK DETECTION
// ═══════════════════════════════════════════════════

function usePerformanceMonitor(componentName: string) {
  useEffect(() => {
    // Detect long tasks (>50ms)
    const longTaskObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 50) {
          console.warn(
            `[${componentName}] Long task detected: ${entry.duration.toFixed(1)}ms`,
            entry,
          );

          // Report to monitoring service
          reportMetric({
            name: "long_task",
            component: componentName,
            duration: entry.duration,
            timestamp: Date.now(),
          });
        }
      }
    });

    longTaskObserver.observe({ type: "longtask", buffered: true });

    return () => longTaskObserver.disconnect();
  }, [componentName]);
}

// FPS Monitor hook
function useFPSMonitor(): number {
  const [fps, setFps] = useState(60);

  useEffect(() => {
    let frames = 0;
    let lastTime = performance.now();
    let rafId: number;

    function measure() {
      frames++;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        setFps(frames);
        frames = 0;
        lastTime = now;
      }
      rafId = requestAnimationFrame(measure);
    }

    rafId = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return fps;
}

// Memory leak detection
function useMemoryMonitor(intervalMs = 10_000) {
  useEffect(() => {
    if (!("memory" in performance)) return;

    const timer = setInterval(() => {
      const mem = (performance as any).memory;
      const usedMB = (mem.usedJSHeapSize / 1024 / 1024).toFixed(1);
      const totalMB = (mem.totalJSHeapSize / 1024 / 1024).toFixed(1);

      if (mem.usedJSHeapSize > 200 * 1024 * 1024) {
        // > 200MB
        console.error(`⚠️ High memory usage: ${usedMB}MB / ${totalMB}MB`);
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [intervalMs]);
}
```

---

## 13. Câu Hỏi Phỏng Vấn Senior

### Q1: Thiết kế dashboard hiển thị 5000 security events/giây mà không lag?

> **Trả lời mẫu:**
> Kiến trúc 4 tầng: **(1)** WebSocket nhận events, **(2)** RAF Batching gom events vào 1 batch per frame (max 60 flushes/sec), **(3)** Ring Buffer (cố định 50K capacity) lưu trữ — O(1) write, không GC pressure, **(4)** Virtual Scroll chỉ render ~30 visible rows. Aggregation (counters, charts) dùng `useRef` + throttled `forceRender` (10fps đủ cho charts). Heavy computation (search, export) offload sang Web Worker. Canvas cho time-series charts thay vì DOM.

### Q2: Ring Buffer vs Array — tại sao Ring Buffer tốt hơn cho real-time data?

> Array.push() + Array.shift() khi buffer đầy = **O(n)** vì shift copy toàn bộ array. Với 50K events, mỗi shift = copy 49,999 items. Ring Buffer dùng circular index: `buffer[tail % capacity] = item` — luôn **O(1)**, memory cố định, không tạo garbage cho GC.

### Q3: Giải thích RAF Batching pattern cho real-time updates

> Thay vì setState mỗi khi nhận event (1000 setState/sec = 1000 re-renders), buffer events vào array, chỉ flush 1 lần per animation frame (~60fps). Dùng `requestAnimationFrame` để schedule flush. Nếu buffer quá lớn (backpressure), flush ngay. Kết quả: 1000 events/sec → chỉ 60 renders/sec, mỗi render xử lý ~16 events.

### Q4: Thiết kế Zero-Trust Policy Editor — xử lý nested conditions?

> **Data model**: Recursive `PolicyCondition` type với `and/or/not/match`. **UI**: Recursive React component `ConditionNode` render tree. **Updates**: Immutable path-based updates — `updateConditionAtPath(root, [0, 2, 1], updater)` tạo object mới ở mỗi level. **Validation**: Real-time conflict detection (shadow rules, contradictions) chạy trong Web Worker khi user thay đổi rules. **UX**: Drag-and-drop reorder, visual AND/OR grouping, color-coded depth levels.

### Q5: useSyncExternalStore vs useState — khi nào dùng cái nào?

> `useState` cho normal React state — mỗi setState = re-render. Phù hợp cho UI state (modal open, form values). `useSyncExternalStore` cho data sống **ngoài React** (Ring Buffer, IndexedDB, WebSocket store). React chỉ "subscribe" và render khi store notify. Kết hợp throttled notify (30fps) → control chính xác tần suất re-render. Tránh "tearing" (inconsistent state) trong concurrent mode.

### Q6: WebSocket connection trong production — những vấn đề gì cần giải quyết?

> **(1)** Auto-reconnect với exponential backoff (1s→2s→4s→...→30s max). **(2)** Heartbeat/ping-pong mỗi 15s detect connection death. **(3)** Message queuing khi offline → replay khi reconnect. **(4)** Binary protocol (Protobuf/MessagePack) giảm 60-80% bandwidth so với JSON. **(5)** Channel subscription management — subscribe/unsubscribe topics. **(6)** Backpressure handling — drop oldest events khi client xử lý không kịp.

### Q7: Canvas vs DOM cho data visualization — trade-offs?

> **DOM (React)**: Accessibility (screen readers), event handling (click/hover per element), SEO, devtools inspection. Giới hạn ~10K nodes. **Canvas**: Unlimited elements (pixel-based), smooth animations, less memory. Nhưng: no accessibility, manual hit testing, no text selection. **Chiến lược**: Dùng DOM cho interactive elements (tables, forms, tooltips), Canvas cho dense visualizations (charts, heatmaps, network graphs). `OffscreenCanvas` + Worker cho rendering không block UI.

### Q8: Memory leak trong long-running security dashboard — phát hiện và ngăn chặn?

> **Phát hiện**: Chrome DevTools → Memory tab → Heap snapshots mỗi 10 phút → compare. `Performance.memory` API monitoring. **Nguyên nhân phổ biến**: (1) Event listeners không cleanup (useEffect missing return), (2) WebSocket callbacks giữ closure references, (3) Growing arrays không bounded (dùng RingBuffer thay Array), (4) setInterval/setTimeout không clear. **Ngăn chặn**: Ring Buffer (memory cố định), WeakRef cho caches, AbortController cho fetch/WS, automated memory monitoring alert khi > 200MB.

### Q9: Firewall rule reordering — tại sao order quan trọng và xử lý conflicts?

> Firewall rules evaluate **top-to-bottom, first match wins**. Rule order = security posture. **Shadow detection**: Rule B sẽ KHÔNG BAO GIỜ match nếu Rule A ở trên rộng hơn và cùng action. **Contradiction**: 2 rules overlap nhưng khác action (allow vs deny) → order quyết định behavior. **UI**: Drag-and-drop reorder + instant conflict warnings. Persist order change với optimistic update + undo (10s window). Batch multiple reorders trước khi commit.

### Q10: Tối ưu TypeScript types cho cybersecurity domain — best practices?

> **(1)** Discriminated unions cho event types: `type Event = FirewallEvent | IDSEvent | AuthEvent` — compiler force exhaustive handling. **(2)** Branded types cho IP addresses: `type IPv4 = string & { __brand: 'IPv4' }` — prevent mixing IP with general strings. **(3)** Const enums cho severity levels — zero runtime overhead. **(4)** Strict null checks — `hitCount: number | null` force handling missing data. **(5)** Template literal types cho CIDR: `` type CIDR = `${number}.${number}.${number}.${number}/${number}` ``. **(6)** Readonly types cho policy snapshots — prevent accidental mutation.
