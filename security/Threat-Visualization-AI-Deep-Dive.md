# Threat Visualization & AI Integration — Cybersecurity Frontend Deep Dive

> 📅 2026-02-11 · ⏱ 35 phút đọc
>
> Hướng dẫn chuyên sâu về Threat Visualization, AI Model Integration,
> và Advanced Data Visualization cho Senior Frontend Engineer tại Cybersecurity company.
> Bao gồm: D3.js, Recharts, WebGL/Three.js, Global Threat Maps, Network Topology, Confidence Score UX.
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Chủ đề: ReactJS + TypeScript + D3.js + AI/ML Visualization

---

## Mục Lục

1. [Tổng Quan — AI trong Cybersecurity Frontend](#1-tổng-quan--ai-trong-cybersecurity-frontend)
2. [TypeScript Domain Models — AI & Threat Data](#2-typescript-domain-models--ai--threat-data)
3. [Làm Việc Với Data Scientists — Workflow & Communication](#3-làm-việc-với-data-scientists--workflow--communication)
4. [Visualize AI Detection Models — Normal vs Anomaly](#4-visualize-ai-detection-models--normal-vs-anomaly)
5. [D3.js Fundamentals cho Security Visualization](#5-d3js-fundamentals-cho-security-visualization)
6. [Global Threat Map — Geo Visualization](#6-global-threat-map--geo-visualization)
7. [Network Topology Graph — Force-Directed Layout](#7-network-topology-graph--force-directed-layout)
8. [Attack Vector Visualization — Kill Chain & Sankey](#8-attack-vector-visualization--kill-chain--sankey)
9. [Recharts — Production-Ready Charts](#9-recharts--production-ready-charts)
10. [WebGL & Three.js — Large-Scale 3D Visualization](#10-webgl--threejs--large-scale-3d-visualization)
11. [Confidence Score UX — AI-to-Human Translation](#11-confidence-score-ux--ai-to-human-translation)
12. [Performance Optimization cho Heavy Visualizations](#12-performance-optimization-cho-heavy-visualizations)
13. [Câu Hỏi Phỏng Vấn Senior](#13-câu-hỏi-phỏng-vấn-senior)

---

## 1. Tổng Quan — AI trong Cybersecurity Frontend

```
TẠI SAO AI + VISUALIZATION LÀ CRITICAL SKILL?
═══════════════════════════════════════════════════════════════

  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │  HIỆN TRẠNG NGÀNH CYBERSECURITY:                           │
  │                                                            │
  │  • SOC (Security Operations Center) nhận 10K+ alerts/ngày │
  │  • 95% là FALSE POSITIVES — "alert fatigue"               │
  │  • AI/ML models giúp PHÂN LOẠI & PRIORITIZE               │
  │  • NHƯNG output của AI là NUMBERS (confidence scores)     │
  │  • Network admin KHÔNG HIỂU 0.7834 nghĩa là gì           │
  │                                                            │
  │  → FRONTEND ENGINEER là CẦU NỐI giữa:                    │
  │    AI Model Output ←→ Human Decision Making               │
  │                                                            │
  │  VAI TRÒ CỦA SENIOR FE:                                   │
  │  ┌─────────────────────────────────────────────────────┐  │
  │  │                                                      │  │
  │  │  ① Translate AI scores → visual risk indicators     │  │
  │  │  ② Build interactive model exploration tools        │  │
  │  │  ③ Visualize anomalies in network traffic           │  │
  │  │  ④ Create global threat maps (geo attacks)          │  │
  │  │  ⑤ Render network topology (10K+ nodes)             │  │
  │  │  ⑥ Display attack kill chains (MITRE ATT&CK)       │  │
  │  │  ⑦ Collaborate with Data Scientists on model UX     │  │
  │  │                                                      │  │
  │  └─────────────────────────────────────────────────────┘  │
  └────────────────────────────────────────────────────────────┘
```

### Visualization Library Landscape

```
LIBRARY COMPARISON CHO CYBERSECURITY:
═══════════════════════════════════════════════════════════════

  ┌───────────────┬─────────────┬──────────────┬─────────────┐
  │ Library       │ Best For    │ Performance  │ Learning    │
  ├───────────────┼─────────────┼──────────────┼─────────────┤
  │ Recharts      │ Dashboards  │ Good (10K)   │ ⭐ Easy     │
  │               │ Standard    │ SVG-based    │ React-first │
  │               │ charts      │              │             │
  ├───────────────┼─────────────┼──────────────┼─────────────┤
  │ D3.js         │ Custom viz  │ Great (50K)  │ ⭐⭐⭐ Hard  │
  │               │ Force graph │ SVG/Canvas   │ Imperative  │
  │               │ Geo maps    │              │             │
  ├───────────────┼─────────────┼──────────────┼─────────────┤
  │ Three.js      │ 3D viz      │ Excellent    │ ⭐⭐ Medium │
  │ /WebGL        │ Large-scale │ GPU-powered  │ Shader know │
  │               │ topology    │ 100K+ nodes  │             │
  ├───────────────┼─────────────┼──────────────┼─────────────┤
  │ Deck.gl       │ Geo maps    │ Excellent    │ ⭐⭐ Medium │
  │               │ Large data  │ WebGL        │ Layer-based │
  │               │ overlays    │ 1M+ points   │             │
  ├───────────────┼─────────────┼──────────────┼─────────────┤
  │ Observable    │ Prototyping │ Good         │ ⭐ Easy     │
  │ Plot          │ Quick viz   │ SVG          │ Concise API │
  ├───────────────┼─────────────┼──────────────┼─────────────┤
  │ Visx          │ React+D3    │ Great        │ ⭐⭐ Medium │
  │ (Airbnb)      │ Composable  │ SVG          │ Component   │
  └───────────────┴─────────────┴──────────────┴─────────────┘

  RECOMMENDATION cho Cybersecurity Dashboard:
  ┌────────────────────────────────────────────────────────┐
  │  • Standard charts (bar, line, pie) → Recharts        │
  │  • Network topology graph → D3.js force simulation    │
  │  • Global threat map → Deck.gl hoặc D3.js + GeoJSON  │
  │  • Attack flow / Sankey → D3.js                       │
  │  • 3D particle / massive data → Three.js / WebGL      │
  │  • Anomaly scatter plot → D3.js + Canvas              │
  │  • Quick prototypes → Observable Plot                 │
  └────────────────────────────────────────────────────────┘
```

---

## 2. TypeScript Domain Models — AI & Threat Data

```typescript
// ═══════════════════════════════════════════════════
// AI DETECTION MODEL TYPES
// ═══════════════════════════════════════════════════

/** Confidence score từ 0.0 → 1.0 */
type ConfidenceScore = number & { __brand: "ConfidenceScore" };

function toConfidence(value: number): ConfidenceScore {
  if (value < 0 || value > 1) throw new RangeError("Score must be 0-1");
  return value as ConfidenceScore;
}

/** Risk level sau khi translate từ confidence score */
type RiskLevel = "critical" | "high" | "medium" | "low" | "info";

interface AIDetectionResult {
  id: string;
  modelName: string; // "anomaly_detector_v3"
  modelVersion: string; // "3.2.1"
  timestamp: number;
  confidence: ConfidenceScore; // 0.0 - 1.0
  prediction: "normal" | "anomaly";
  category: ThreatCategory;
  features: FeatureVector; // Input features used
  explanation: ModelExplanation; // SHAP/LIME output
  relatedEvents: string[]; // Event IDs
}

type ThreatCategory =
  | "malware"
  | "phishing"
  | "ddos"
  | "brute_force"
  | "data_exfiltration"
  | "lateral_movement"
  | "command_and_control"
  | "privilege_escalation"
  | "zero_day"
  | "insider_threat";

/** Feature vector — input dimensions cho AI model */
interface FeatureVector {
  packetSize: number;
  bytesPerSecond: number;
  connectionDuration: number;
  portEntropy: number; // Shannon entropy of dest ports
  dnsQueryRate: number;
  failedLoginAttempts: number;
  uniqueDestIPs: number;
  payloadEntropy: number; // Entropy of packet payload
  protocolDistribution: Record<string, number>;
  timeOfDay: number; // 0-23
  geoDistance: number; // km from usual location
  [key: string]: number | Record<string, number>;
}

/** Model explanation — SHAP values cho interpretability */
interface ModelExplanation {
  type: "shap" | "lime" | "attention";
  featureImportance: Array<{
    feature: string;
    value: number; // Actual feature value
    contribution: number; // SHAP value (+ or -)
    direction: "increases_risk" | "decreases_risk";
  }>;
  baselineScore: number; // Expected score without features
  summary: string; // Generated explanation text
}

// ═══════════════════════════════════════════════════
// THREAT MAP TYPES
// ═══════════════════════════════════════════════════

interface ThreatMapPoint {
  id: string;
  lat: number;
  lng: number;
  country: string;
  city: string;
  threatCount: number;
  topCategory: ThreatCategory;
  riskLevel: RiskLevel;
  isSource: boolean; // Attack origin vs target
}

interface AttackFlow {
  id: string;
  source: { lat: number; lng: number; country: string };
  target: { lat: number; lng: number; country: string };
  volume: number; // Attack intensity
  category: ThreatCategory;
  timestamp: number;
}

// ═══════════════════════════════════════════════════
// NETWORK TOPOLOGY TYPES
// ═══════════════════════════════════════════════════

interface TopologyNode {
  id: string;
  type:
    | "server"
    | "workstation"
    | "router"
    | "firewall"
    | "switch"
    | "iot"
    | "cloud"
    | "external";
  label: string;
  ip: string;
  status: "healthy" | "warning" | "compromised" | "isolated";
  riskScore: ConfidenceScore;
  connections: number;
  group: string; // Network segment
  x?: number; // Force layout position
  y?: number;
}

interface TopologyEdge {
  source: string; // Node ID
  target: string;
  bandwidth: number; // Mbps
  threatLevel: RiskLevel;
  protocol: string;
  isEncrypted: boolean;
  latency: number; // ms
}

// ═══════════════════════════════════════════════════
// ATTACK VECTOR / KILL CHAIN TYPES (MITRE ATT&CK)
// ═══════════════════════════════════════════════════

type MitreTactic =
  | "reconnaissance"
  | "resource_development"
  | "initial_access"
  | "execution"
  | "persistence"
  | "privilege_escalation"
  | "defense_evasion"
  | "credential_access"
  | "discovery"
  | "lateral_movement"
  | "collection"
  | "command_and_control"
  | "exfiltration"
  | "impact";

interface AttackVector {
  id: string;
  name: string;
  tactics: MitreTactic[];
  techniques: string[]; // MITRE technique IDs
  confidence: ConfidenceScore;
  affectedAssets: string[];
  timeline: Array<{
    timestamp: number;
    tactic: MitreTactic;
    technique: string;
    description: string;
    evidence: string[];
  }>;
}
```

---

## 3. Làm Việc Với Data Scientists — Workflow & Communication

```
FRONTEND ↔ DATA SCIENCE COLLABORATION:
═══════════════════════════════════════════════════════════════

  WORKFLOW THỰC TẾ:

  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
  │ Data Science │     │   Backend    │     │   Frontend   │
  │              │     │              │     │              │
  │ ① Train      │     │ ③ Serve      │     │ ⑤ Visualize  │
  │   model      │────►│   model API  │────►│   results    │
  │              │     │              │     │              │
  │ ② Export     │     │ ④ Batch      │     │ ⑥ Explain    │
  │   features   │     │   predict    │     │   to users   │
  │   & weights  │     │              │     │              │
  └──────────────┘     └──────────────┘     └──────────────┘

  THÔNG TIN FRONTEND CẦN TỪ DATA SCIENTIST:

  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ① MODEL METADATA:                                     │
  │  → Tên model, version, accuracy metrics                │
  │  → Input features (tên, ý nghĩa, range)               │
  │  → Output format (confidence score, classification)    │
  │  → Inference latency (P50, P95, P99)                   │
  │                                                        │
  │  ② THRESHOLD DEFINITIONS:                               │
  │  → Tại confidence nào → "anomaly"? (vd: > 0.7)        │
  │  → ROC curve data cho threshold selection UI           │
  │  → False positive rate ở mỗi threshold                │
  │                                                        │
  │  ③ FEATURE IMPORTANCE:                                  │
  │  → SHAP values cho mỗi prediction                     │
  │  → Baseline expected score                             │
  │  → Feature names HUMAN-READABLE                        │
  │                                                        │
  │  ④ TRAINING DATA DISTRIBUTION:                          │
  │  → Normal traffic pattern → để hiện "baseline"         │
  │  → Known anomaly patterns → để hiện "examples"         │
  │  → Feature distribution histograms                     │
  │                                                        │
  │  ⑤ MODEL LIMITATIONS:                                   │
  │  → Biases (vd: false positives cao với VPN traffic)   │
  │  → Concept drift detection                             │
  │  → Retraining schedule                                 │
  │                                                        │
  └────────────────────────────────────────────────────────┘

  COMMON MISCOMMUNICATION:

  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ❌ DS says: "Model accuracy is 97%"                   │
  │  → FE phải hỏi: "Accuracy trên dataset NÀO?"         │
  │  → Imbalanced data (99% normal) → 97% = BAD model    │
  │                                                        │
  │  ❌ DS says: "Confidence > 0.5 = anomaly"              │
  │  → FE phải hỏi: "False positive rate ở 0.5 là bao    │
  │     nhiêu? User chấp nhận được bao nhiêu FP/ngày?"   │
  │                                                        │
  │  ❌ DS says: "Feature X contribution is 0.23"          │
  │  → FE phải hỏi: "0.23 trên thang gì? SHAP? LIME?    │
  │     Positive = tăng hay giảm risk?"                   │
  │                                                        │
  │  ✅ BEST PRACTICE:                                     │
  │  → Xây dựng shared DATA CONTRACT (API schema)         │
  │  → Tạo PROTOTYPE sớm (hiện output thô trước)          │
  │  → Review cùng nhau WEEKLY                             │
  │  → FE ATTEND model review meetings                     │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## 4. Visualize AI Detection Models — Normal vs Anomaly

> **🎯 Học xong phần này, bạn sẽ biết:**
>
> - SHAP là gì và tại sao cần "giải thích" kết quả AI cho người dùng
> - 4 cách visualize dữ liệu anomaly detection
> - Cách kết hợp Canvas + SVG để vẽ 50K+ data points

### Tại sao cần Visualize AI? — Giải thích cho Beginner

```
AI TRONG CYBERSECURITY — TẠI SAO CẦN VISUALIZATION?
═══════════════════════════════════════════════════════════════

  Hãy tưởng tượng bạn đi khám bác sĩ:

  ❌ Bác sĩ nói: "Bạn bị bệnh" → BẠN KHÔNG TIN
     → Không giải thích tại sao, dựa vào đâu

  ✅ Bác sĩ nói: "Bạn bị bệnh VÌ:"
     → Huyết áp cao (180/120) ← bình thường là 120/80
     → Đường huyết cao (250)  ← bình thường là 100
     → Bạn THẤy biểu đồ, HIỂU lý do → TIN TƯỞNG

  AI trong cybersecurity CŨNG VẬY:
  ┌──────────────────────────────────────────────────────┐
  │ AI nói: "Traffic này là ANOMALY (99% confidence)"   │
  │                                                      │
  │ SOC Analyst hỏi: "TẠI SAO?"                         │
  │                                                      │
  │ → SHAP trả lời: "VÌ:"                               │
  │   • Payload entropy = 0.95 (bt: 0.3) → +0.35 điểm  │
  │   • Bytes/giây = 50MB (bt: 1MB)      → +0.22 điểm  │
  │   • Port khác nhau = 200 (bt: 3)     → +0.15 điểm  │
  │                                                      │
  │ → Analyst THẤY biểu đồ → HIỂU → Ra quyết định      │
  └──────────────────────────────────────────────────────┘

  SHAP = SHapley Additive exPlanations:
  → Phương pháp toán học giải thích TỪNG YẾU TỐ
    đóng góp bao nhiêu vào kết quả dự đoán của AI
  → Bạn KHÔNG cần hiểu toán, chỉ cần biết VISUALIZE nó

  4 CÁCH VISUALIZE ANOMALY DETECTION:
  ┌──────────────────────────────────────────────────────┐
  │ ① Scatter Plot — Vẽ data points trên 2 trục        │
  │    → Thấy RÕ RÀNG cluster normal vs anomaly        │
  │                                                      │
  │ ② Decision Boundary — Vẽ ranh giới của AI model    │
  │    → Thấy AI "vẽ đường" phân tách ở đâu            │
  │                                                      │
  │ ③ Time Series — Vẽ traffic theo thời gian           │
  │    → Thấy đỉnh bất thường (spike) nổi bật          │
  │                                                      │
  │ ④ SHAP Bar Chart — Vẽ "tại sao" cho mỗi alert     │
  │    → Mỗi thanh = 1 yếu tố, dài = quan trọng       │
  └──────────────────────────────────────────────────────┘
```

Dưới đây là sơ đồ chi tiết 4 patterns:

```
ANOMALY DETECTION VISUALIZATION PATTERNS:
═══════════════════════════════════════════════════════════════

  MỤC TIÊU: Giúp SOC Analyst NGAY LẬP TỨC phân biệt
  được NORMAL traffic và ANOMALY traffic.

  4 VISUALIZATION PATTERNS CHÍNH:

  ① SCATTER PLOT — 2D Feature Space:
  ┌────────────────────────────────────────────┐
  │  Bytes/s ▲                                 │
  │          │      ·  · ·  ·                  │
  │          │   · ·  ██ ·  · ·  ← ANOMALY    │
  │          │  · ·  ████  · ·     CLUSTER     │
  │          │   · ·  ██ ·  ·                  │
  │          │                                  │
  │  ········│·····························    │
  │  · · · · │ · · · · · · · ← NORMAL         │
  │  · · · · │· · · · · · ·    CLUSTER         │
  │  · · · · │ · · · · · ·                    │
  │          └────────────────────────► Time    │
  └────────────────────────────────────────────┘

  ② DECISION BOUNDARY — Model Visualization:
  ┌────────────────────────────────────────────┐
  │  Feature B ▲                               │
  │            │  ░░░░░░░░░░░░░ HIGH RISK     │
  │            │  ░░░░████░░░░░░              │
  │            │  ░░░░████░░░░░░ anomalies    │
  │     -------│--boundary--------             │
  │   ▓▓▓▓▓▓▓▓│▓▓▓▓▓▓▓▓▓▓▓▓ LOW RISK        │
  │   ▓▓▓▓▓▓▓▓│▓▓▓▓▓▓▓▓▓▓▓▓ normal          │
  │            └──────────────────► Feature A  │
  └────────────────────────────────────────────┘

  ③ TIME-SERIES ANOMALY HIGHLIGHT:
  ┌────────────────────────────────────────────┐
  │  ▲ Traffic                                  │
  │  │         ╭──╮   ← Anomaly band          │
  │  │  ~~~╭──╯  ╰──╮~~~~~~~~~~~~~~~          │
  │  │  ~~/          \~~ ← Normal baseline     │
  │  │  ~/            \~~~~~~~~~~~~             │
  │  └──────────────────────────────► Time      │
  │    Shaded area = confidence interval       │
  │    Points OUTSIDE band = anomaly detected  │
  └────────────────────────────────────────────┘

  ④ FEATURE IMPORTANCE BAR (SHAP):
  ┌────────────────────────────────────────────┐
  │  Why is this flagged as ANOMALY?           │
  │                                             │
  │  Payload entropy  ████████████▶ +0.35      │
  │  Bytes/second     ████████▶     +0.22      │
  │  Port entropy     ██████▶       +0.15      │
  │  Geo distance     ████▶         +0.11      │
  │  Time of day      ◄██          -0.08      │
  │  DNS query rate   ◄███         -0.12      │
  │                                             │
  │  Base score: 0.15  →  Final: 0.78 (HIGH)  │
  └────────────────────────────────────────────┘
```

### 4.1 Anomaly Scatter Plot — D3 + Canvas

```typescript
// ═══════════════════════════════════════════════════
// ANOMALY SCATTER PLOT — Canvas for performance
// ═══════════════════════════════════════════════════
// SVG struggles với >5K points → Canvas is better

import { useRef, useEffect, useCallback } from 'react';
import * as d3 from 'd3';

interface ScatterPoint {
  x: number;           // Feature A value
  y: number;           // Feature B value
  prediction: 'normal' | 'anomaly';
  confidence: number;
  eventId: string;
}

interface AnomalyScatterProps {
  data: ScatterPoint[];
  width: number;
  height: number;
  xLabel: string;
  yLabel: string;
  onPointClick?: (point: ScatterPoint) => void;
}

const AnomalyScatterPlot: React.FC<AnomalyScatterProps> = ({
  data, width, height, xLabel, yLabel, onPointClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<SVGSVGElement>(null); // SVG overlay cho axes/labels
  const margin = { top: 20, right: 30, bottom: 50, left: 60 };

  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Scales — memoized
  const xScale = d3.scaleLinear()
    .domain(d3.extent(data, d => d.x) as [number, number])
    .range([0, innerWidth])
    .nice();

  const yScale = d3.scaleLinear()
    .domain(d3.extent(data, d => d.y) as [number, number])
    .range([innerHeight, 0])
    .nice();

  // Color by prediction + confidence
  const getColor = (point: ScatterPoint): string => {
    if (point.prediction === 'anomaly') {
      // Red intensity scales with confidence
      const alpha = 0.3 + point.confidence * 0.7;
      return `rgba(255, 23, 68, ${alpha})`;
    }
    return 'rgba(0, 229, 255, 0.4)'; // Cyan for normal
  };

  // Canvas render — performant cho 50K+ points
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, innerWidth, innerHeight);

    // Draw normal points FIRST (behind)
    const normals = data.filter(d => d.prediction === 'normal');
    const anomalies = data.filter(d => d.prediction === 'anomaly');

    for (const point of normals) {
      ctx.beginPath();
      ctx.arc(xScale(point.x), yScale(point.y), 3, 0, Math.PI * 2);
      ctx.fillStyle = getColor(point);
      ctx.fill();
    }

    // Draw anomalies ON TOP (visible)
    for (const point of anomalies) {
      const radius = 4 + point.confidence * 6; // Size = confidence
      ctx.beginPath();
      ctx.arc(xScale(point.x), yScale(point.y), radius, 0, Math.PI * 2);
      ctx.fillStyle = getColor(point);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 23, 68, 0.8)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }, [data, innerWidth, innerHeight]);

  // Hit testing for click interaction on Canvas
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (!onPointClick) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    // Find closest point (spatial search)
    let closest: ScatterPoint | null = null;
    let minDist = 20; // 20px threshold

    for (const point of data) {
      const px = xScale(point.x);
      const py = yScale(point.y);
      const dist = Math.sqrt((mx - px) ** 2 + (my - py) ** 2);
      if (dist < minDist) {
        minDist = dist;
        closest = point;
      }
    }

    if (closest) onPointClick(closest);
  }, [data, onPointClick]);

  return (
    <div style={{ position: 'relative', width, height }}>
      {/* Canvas layer — points */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          left: margin.left,
          top: margin.top,
          width: innerWidth,
          height: innerHeight,
          cursor: 'crosshair',
        }}
        onClick={handleCanvasClick}
      />

      {/* SVG overlay — axes and labels */}
      <svg ref={overlayRef} width={width} height={height}>
        <g transform={`translate(${margin.left},${margin.top})`}>
          {/* X Axis */}
          <g transform={`translate(0,${innerHeight})`}>
            {xScale.ticks(8).map(tick => (
              <g key={tick} transform={`translate(${xScale(tick)},0)`}>
                <line y2={6} stroke="#666" />
                <text y={20} textAnchor="middle" fill="#999" fontSize={12}>
                  {tick}
                </text>
              </g>
            ))}
            <text x={innerWidth / 2} y={42} textAnchor="middle"
                  fill="#ccc" fontSize={13}>{xLabel}</text>
          </g>

          {/* Y Axis */}
          {yScale.ticks(6).map(tick => (
            <g key={tick} transform={`translate(0,${yScale(tick)})`}>
              <line x2={-6} stroke="#666" />
              <text x={-10} textAnchor="end" fill="#999"
                    fontSize={12} dy="0.35em">{tick}</text>
            </g>
          ))}

          {/* Legend */}
          <g transform={`translate(${innerWidth - 150}, 10)`}>
            <circle cx={0} cy={0} r={4} fill="rgba(0,229,255,0.6)" />
            <text x={10} fill="#999" fontSize={12} dy="0.35em">Normal</text>

            <circle cx={0} cy={20} r={6} fill="rgba(255,23,68,0.8)" />
            <text x={10} y={20} fill="#999" fontSize={12} dy="0.35em">Anomaly</text>
          </g>
        </g>
      </svg>
    </div>
  );
};
```

#### 📖 Giải thích Scatter Plot cho người mới:

```
TẠI SAO DÙNG CANVAS + SVG CÙNG LÚC?
═══════════════════════════════════════════════════════════════

  SVG: mỗi điểm = 1 DOM element → 50K điểm = 50K elements = CHẬM!
  Canvas: vẽ pixels trực tiếp → 50K điểm vẫn MƯỢT

  Nhưng Canvas KHÔNG có DOM elements → không có text, axes
  → GIẢI PHÁP: DÙNG CẢ HAI!

  ┌─────────────────────────────────────────┐
  │ Lớp dưới: <canvas>  → vẽ 50K data points    │
  │ Lớp trên: <svg>     → vẽ axes, labels, legend │
  │ position: absolute → chồng lên nhau!          │
  └─────────────────────────────────────────┘

  DEVICE PIXEL RATIO (dpr) LÀ GÌ?
  ─────────────────────────────────
  Màn hình Retina có dpr = 2 (mỗi CSS pixel = 4 physical pixels)
  Nếu KHÔNG nhân dôi canvas size → HìNH BỊ Mờ!

  canvas.width = innerWidth * dpr;   ← gấp đôi kích thước thật
  ctx.scale(dpr, dpr);               ← scale lại cho đúng
  CSS width = innerWidth             ← hiển thị cở ban đầu
  → Kết quả: hình SẮC NÉT trên mọi màn hình!

  HIT TESTING TRÊN CANVAS:
  ─────────────────────────────────
  Canvas không có DOM → không có onClick cho từng điểm!
  → Phải tự tính: click ở pixel nào → gần điểm nào nhất?
  → Dùng khoảng cách Euclid: √((mx-px)² + (my-py)²)
  → Nếu < 20px threshold → coi như click vào điểm đó
```

### 4.2 SHAP Feature Importance Chart

```typescript
// ═══════════════════════════════════════════════════
// SHAP WATERFALL CHART — "WHY was this flagged?"
// ═══════════════════════════════════════════════════
// Most important visualization for AI explainability
// SOC Analyst cần biết TẠI SAO model flag anomaly

interface SHAPChartProps {
  explanation: ModelExplanation;
  width: number;
  height: number;
}

const SHAPWaterfallChart: React.FC<SHAPChartProps> = ({
  explanation, width, height,
}) => {
  const { featureImportance, baselineScore } = explanation;
  const margin = { top: 30, right: 100, bottom: 20, left: 160 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Sort by absolute contribution
  const sorted = [...featureImportance]
    .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
    .slice(0, 10); // Top 10 features

  const maxAbsContrib = Math.max(...sorted.map(f => Math.abs(f.contribution)));

  const yScale = d3.scaleBand()
    .domain(sorted.map(f => f.feature))
    .range([0, innerHeight])
    .padding(0.3);

  const xScale = d3.scaleLinear()
    .domain([-maxAbsContrib * 1.2, maxAbsContrib * 1.2])
    .range([0, innerWidth]);

  const centerX = xScale(0);

  return (
    <div className="shap-chart">
      <h3 className="shap-title">
        🔍 Why was this flagged?
        <span className="baseline">
          Base: {baselineScore.toFixed(2)} →
          Final: {(baselineScore + sorted.reduce((s, f) => s + f.contribution, 0)).toFixed(2)}
        </span>
      </h3>

      <svg width={width} height={height}>
        <g transform={`translate(${margin.left},${margin.top})`}>
          {/* Center line */}
          <line x1={centerX} y1={0} x2={centerX} y2={innerHeight}
                stroke="#555" strokeDasharray="4,4" />

          {sorted.map(feature => {
            const barWidth = Math.abs(xScale(feature.contribution) - centerX);
            const barX = feature.contribution >= 0 ? centerX : centerX - barWidth;
            const color = feature.contribution >= 0
              ? '#ff1744'   // Red = increases risk
              : '#00e676';  // Green = decreases risk

            return (
              <g key={feature.feature}
                 transform={`translate(0,${yScale(feature.feature)})`}>
                {/* Bar */}
                <rect
                  x={barX}
                  y={0}
                  width={barWidth}
                  height={yScale.bandwidth()}
                  fill={color}
                  opacity={0.8}
                  rx={3}
                />

                {/* Feature name (left) */}
                <text
                  x={-8}
                  y={yScale.bandwidth() / 2}
                  textAnchor="end"
                  fill="#ccc"
                  fontSize={12}
                  dy="0.35em"
                >
                  {humanizeFeatureName(feature.feature)}
                </text>

                {/* Contribution value (right of bar) */}
                <text
                  x={feature.contribution >= 0
                    ? centerX + barWidth + 6
                    : centerX - barWidth - 6}
                  y={yScale.bandwidth() / 2}
                  textAnchor={feature.contribution >= 0 ? 'start' : 'end'}
                  fill={color}
                  fontSize={12}
                  fontWeight="bold"
                  dy="0.35em"
                >
                  {feature.contribution >= 0 ? '+' : ''}
                  {feature.contribution.toFixed(3)}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
};

// Helper: Convert feature_names → Human Readable
function humanizeFeatureName(name: string): string {
  const map: Record<string, string> = {
    packetSize: 'Packet Size',
    bytesPerSecond: 'Bytes/Second',
    connectionDuration: 'Connection Duration',
    portEntropy: 'Port Entropy',
    dnsQueryRate: 'DNS Query Rate',
    failedLoginAttempts: 'Failed Logins',
    uniqueDestIPs: 'Unique Dest IPs',
    payloadEntropy: 'Payload Entropy',
    timeOfDay: 'Time of Day',
    geoDistance: 'Geo Distance (km)',
  };
  return map[name] || name.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
}
```

---

## 5. D3.js Fundamentals cho Security Visualization

> **🎯 Học xong phần này, bạn sẽ biết:**
>
> - D3.js là gì và KHÔNG phải là gì (không phải charting library)
> - Scale: khái niệm quan trọng nhất — chuyển data → pixels
> - 3 pattern tích hợp D3 + React, cái nào nên dùng

### D3.js là gì? — Giải thích cho Beginner

```
D3.js — "DATA-DRIVEN DOCUMENTS":
═══════════════════════════════════════════════════════════════

  ⚠️ HIỂU LẦM PHỔ BIẾN:
  D3 KHÔNG phải charting library (như Recharts, Chart.js)!
  D3 = BỘ CÔNG CỤ TOÁN HỌC để biến đổi data → hình ảnh

  Hãy tưởng tượng D3 như HỘP DỤNG CỤ của thợ xây:
  ┌──────────────────────────────────────────────────────┐
  │ Recharts = NHÀ XÂY SẴN (đẹp, nhưng chỉ có mấy mẫu)│
  │ D3.js    = GẠCH + XI MĂNG (xây gì cũng được,       │
  │            nhưng phải tự xây từ đầu)                 │
  └──────────────────────────────────────────────────────┘

  SCALE = KHÁI NIỆM QUAN TRỌNG NHẤT:
  ──────────────────────────────────────
  Scale = "máy chuyển đổi" từ DATA → PIXELS

  Ví dụ: bạn có data từ 0 → 1,000,000 bytes
  Nhưng màn hình chỉ rộng 500px!

  Data:   0 ─────────── 500,000 ─────────── 1,000,000
                            ↓ SCALE
  Pixels: 0px ──────────── 250px ─────────── 500px

  → scale(500,000) = 250px  ← D3 tính cho bạn!
  → scale(1,000,000) = 500px
  → scale(250,000) = 125px

  CÁC LOẠI SCALE THƯỜNG DÙNG:
  ┌────────────────────────────────────────────────────────┐
  │ Linear  → Dữ liệu đều (bytes, latency, scores)      │
  │ Log     → Dữ liệu chênh lệch lớn (1 → 1,000,000)   │
  │ Time    → Timestamps (dates, hours)                   │
  │ Color   → Map số → màu (0=xanh → 1=đỏ)              │
  │ Band    → Categorical (bar charts, pie charts)        │
  │ Ordinal → Category → color (malware=đỏ, ddos=cam)   │
  └────────────────────────────────────────────────────────┘
```

Dưới đây là các modules của D3.js và cách tích hợp với React:

```
D3.js CORE CONCEPTS — SECURITY DEVELOPER CẦN BIẾT:
═══════════════════════════════════════════════════════════════

  D3 = "Data-Driven Documents"
  KHÔNG phải charting library — là DATA MANIPULATION library.

  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  D3 CORE MODULES CHO CYBERSECURITY:                    │
  │                                                        │
  │  ┌──────────────┬──────────────────────────────────┐  │
  │  │ Module       │ Use Case                          │  │
  │  ├──────────────┼──────────────────────────────────┤  │
  │  │ d3-scale     │ Map data ranges → pixel ranges   │  │
  │  │ d3-axis      │ Generate axis ticks/labels        │  │
  │  │ d3-shape     │ Lines, areas, arcs, links         │  │
  │  │ d3-force     │ Network topology simulation       │  │
  │  │ d3-geo       │ Geographic projections, maps      │  │
  │  │ d3-hierarchy │ Tree layouts, treemaps            │  │
  │  │ d3-sankey    │ Flow diagrams (attack paths)      │  │
  │  │ d3-zoom      │ Pan and zoom interactions         │  │
  │  │ d3-brush     │ Selection ranges (time ranges)    │  │
  │  │ d3-transition│ Animated transitions              │  │
  │  │ d3-color     │ Color manipulation                │  │
  │  └──────────────┴──────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘

  REACT + D3 INTEGRATION PATTERNS:

  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  PATTERN 1: "React renders, D3 calculates"            │
  │  ✅ RECOMMENDED — best of both worlds                  │
  │  → D3 cho: scales, layouts, geo projections           │
  │  → React cho: DOM rendering, event handling           │
  │  → Kết hợp: React re-render khi data thay đổi        │
  │                                                        │
  │  PATTERN 2: "D3 renders, React wraps"                 │
  │  → D3 trực tiếp manipulate DOM via useRef             │
  │  → React cung cấp container + lifecycle               │
  │  → Dùng khi cần D3 features không có trong React      │
  │     (e.g., force simulation, complex transitions)     │
  │                                                        │
  │  PATTERN 3: "Full D3" (NO React rendering)            │
  │  ❌ AVOID — mất React benefits (reconciliation, etc.) │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 5.1 D3 Scales — Foundation cho Mọi Visualization

```typescript
// ═══════════════════════════════════════════════════
// D3 SCALES — MAP DATA → PIXELS
// ═══════════════════════════════════════════════════

import * as d3 from "d3";

// ① LINEAR SCALE — continuous data (bytes, latency)
const bytesScale = d3
  .scaleLinear()
  .domain([0, 10_000_000]) // Data range: 0 - 10MB
  .range([0, 500]) // Pixel range: 0 - 500px
  .clamp(true); // Values outside domain → clamped

bytesScale(5_000_000); // → 250 (middle)
bytesScale(15_000_000); // → 500 (clamped to max)

// ② LOG SCALE — exponential data (event counts, bandwidth)
const eventScale = d3
  .scaleLog()
  .domain([1, 1_000_000]) // 1 to 1M events
  .range([0, 400]);

eventScale(1000); // → 200 (middle of log scale)

// ③ COLOR SCALE — map confidence → color
const riskColorScale = d3
  .scaleLinear<string>()
  .domain([0, 0.3, 0.7, 1.0])
  .range(["#00e676", "#ffd600", "#ff9100", "#ff1744"]);
//        green      yellow     orange     red

riskColorScale(0.85); // → ~'#ff5722' (orange-red)

// ④ ORDINAL SCALE — category → color
const categoryColorScale = d3
  .scaleOrdinal<string>()
  .domain(["malware", "phishing", "ddos", "brute_force", "data_exfiltration"])
  .range(d3.schemeTableau10);

// ⑤ TIME SCALE — timestamps → pixels
const timeScale = d3
  .scaleTime()
  .domain([new Date("2024-01-01"), new Date("2024-12-31")])
  .range([0, 1000]);

// ⑥ BAND SCALE — categorical bar charts
const tacticScale = d3
  .scaleBand<MitreTactic>()
  .domain(["initial_access", "execution", "persistence", "exfiltration"])
  .range([0, 800])
  .padding(0.2);

// ⑦ QUANTIZE SCALE — continuous → discrete buckets
const severityScale = d3
  .scaleQuantize<RiskLevel>()
  .domain([0, 1])
  .range(["info", "low", "medium", "high", "critical"]);

severityScale(0.85); // → 'critical'
severityScale(0.35); // → 'low'
```

### 5.2 D3 + React Hook Pattern

```typescript
// ═══════════════════════════════════════════════════
// useD3 HOOK — REUSABLE D3 + REACT INTEGRATION
// ═══════════════════════════════════════════════════

function useD3<T extends SVGElement | HTMLCanvasElement>(
  renderFn: (element: T) => void | (() => void),
  deps: React.DependencyList,
): React.RefObject<T> {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!ref.current) return;
    const cleanup = renderFn(ref.current);
    return cleanup ?? undefined;
  }, deps);

  return ref;
}

// Usage — SVG chart:
// const svgRef = useD3<SVGSVGElement>((svg) => {
//   const selection = d3.select(svg);
//   // ... D3 operations
// }, [data]);
//
// return <svg ref={svgRef} width={width} height={height} />;
```

---

## 6. Global Threat Map — Geo Visualization

> **🎯 Học xong phần này, bạn sẽ biết:**
>
> - Projection là gì và tại sao cần projection
> - GeoJSON = format dữ liệu cho bản đồ địa lý
> - Cách vẽ bản đồ từ dữ liệu threat attacks

### Geo Projection là gì? — Giải thích cho Beginner

```
GEO PROJECTION = "MỞ TRÁI ĐẤT RA PHẲNG":
═══════════════════════════════════════════════════════════════

  Trái đất = hình CẦU, màn hình = hình PHẲNG
  → Cần "chiếu" (project) từ cầu → phẳng
  → Giống cách Google Maps hiển thị bản đồ trên màn hình!

  GEOJSON = FORMAT DỮ LIỆU BẢN ĐỒ:
  ──────────────────────────────
  GeoJSON = file JSON chứa tọa độ ranh giới các quốc gia
  → D3 đọc GeoJSON → dùng projection → vẽ SVG paths
  → Mỗi quốc gia = 1 <path> trên SVG
  → Tô màu theo threat level: xanh = an toàn, đỏ = nguy hiểm

  LUỒNG Xử LÝ:
  ┌───────────┐   ┌───────────┐   ┌───────────┐   ┌──────────┐
  │ GeoJSON   │→ │Projection │→ │ SVG Paths │→ │ Overlay  │
  │ (quốc gia)│   │ (chiếu)   │   │ (hình vẽ) │   │ (threats)│
  └───────────┘   └───────────┘   └───────────┘   └──────────┘
```

Dưới đây là sơ đồ chi tiết các lớp của Threat Map:

```
GLOBAL THREAT MAP — VISUALIZATION LAYERS:
═══════════════════════════════════════════════════════════════

  ┌────────────────────────────────────────────────────────────┐
  │                                                            │
  │         GLOBAL CYBER THREAT MAP                            │
  │                                                            │
  │    ┌─────────────────────────────────────────────────┐    │
  │    │          🌍 World Map (Dark Theme)               │    │
  │    │                                                   │    │
  │    │    🔴 ←─── Attack origins (red pulsing dots)     │    │
  │    │       ╲                                           │    │
  │    │        ╲── Animated arc lines (attack flows)     │    │
  │    │         ╲                                         │    │
  │    │    🔵 ←─── Target locations (blue dots)          │    │
  │    │                                                   │    │
  │    │    ░░ ←─── Heatmap overlay (threat density)      │    │
  │    │                                                   │    │
  │    └─────────────────────────────────────────────────┘    │
  │                                                            │
  │  LAYERS (toggle-able):                                     │
  │  ┌──────────────────────────────────────────────────────┐ │
  │  │  ☑ Attack Origins (source IPs → geo)                │ │
  │  │  ☑ Attack Flows (animated arcs)                     │ │
  │  │  ☐ Threat Heatmap (density overlay)                 │ │
  │  │  ☑ Target Locations (your assets)                   │ │
  │  │  ☐ Country Risk Coloring (choropleth)               │ │
  │  └──────────────────────────────────────────────────────┘ │
  │                                                            │
  │  IMPLEMENTATION OPTIONS:                                   │
  │  ① D3.js + GeoJSON → Full control, SVG/Canvas            │
  │  ② Deck.gl → WebGL, 1M+ points, great performance       │
  │  ③ Mapbox GL → Tile-based, street-level zoom             │
  │  ④ Leaflet → Simple, lightweight, plugin ecosystem       │
  │                                                            │
  └────────────────────────────────────────────────────────────┘
```

### 6.1 D3.js Geo Threat Map

```typescript
// ═══════════════════════════════════════════════════
// GLOBAL THREAT MAP — D3 + Canvas
// ═══════════════════════════════════════════════════

import * as d3 from 'd3';
import { feature } from 'topojson-client';
import type { Topology } from 'topojson-specification';

interface ThreatMapProps {
  attacks: AttackFlow[];
  threats: ThreatMapPoint[];
  width: number;
  height: number;
}

const GlobalThreatMap: React.FC<ThreatMapProps> = ({
  attacks, threats, width, height,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const svgOverlayRef = useRef<SVGSVGElement>(null);

  // Projection: Natural Earth (good for global view)
  const projection = useMemo(
    () => d3.geoNaturalEarth1()
      .scale(width / 5.5)
      .translate([width / 2, height / 2]),
    [width, height]
  );

  const pathGenerator = useMemo(
    () => d3.geoPath().projection(projection),
    [projection]
  );

  // Load world topology
  const [worldData, setWorldData] = useState<any>(null);

  useEffect(() => {
    fetch('/data/world-110m.json')
      .then(res => res.json())
      .then((topology: Topology) => {
        setWorldData(feature(topology, topology.objects.countries));
      });
  }, []);

  // Canvas render — map + attacks
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !worldData) return;
    const ctx = canvas.getContext('2d')!;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // ① Draw world map (dark theme)
    const canvasPath = d3.geoPath().projection(projection).context(ctx);

    ctx.fillStyle = '#0a1628';      // Dark ocean
    ctx.fillRect(0, 0, width, height);

    ctx.beginPath();
    canvasPath(worldData);
    ctx.fillStyle = '#1a2744';      // Dark land
    ctx.fill();
    ctx.strokeStyle = '#2a3a5c';    // Country borders
    ctx.lineWidth = 0.5;
    ctx.stroke();

    // ② Draw threat points
    for (const threat of threats) {
      const [x, y] = projection([threat.lng, threat.lat]) || [0, 0];
      const radius = Math.sqrt(threat.threatCount) * 0.5 + 3;

      // Glow effect
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 2);
      if (threat.isSource) {
        gradient.addColorStop(0, 'rgba(255, 23, 68, 0.8)');
        gradient.addColorStop(1, 'rgba(255, 23, 68, 0)');
      } else {
        gradient.addColorStop(0, 'rgba(0, 176, 255, 0.8)');
        gradient.addColorStop(1, 'rgba(0, 176, 255, 0)');
      }

      ctx.beginPath();
      ctx.arc(x, y, radius * 2, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Core dot
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = threat.isSource ? '#ff1744' : '#00b0ff';
      ctx.fill();
    }

    // ③ Draw attack flow arcs
    for (const attack of attacks) {
      const source = projection([attack.source.lng, attack.source.lat]);
      const target = projection([attack.target.lng, attack.target.lat]);
      if (!source || !target) continue;

      // Quadratic bezier — arc above the straight line
      const midX = (source[0] + target[0]) / 2;
      const midY = (source[1] + target[1]) / 2;
      const dx = target[0] - source[0];
      const dy = target[1] - source[1];
      const dist = Math.sqrt(dx * dx + dy * dy);
      // Control point offset perpendicular to the line
      const cpX = midX - dy * 0.3;
      const cpY = midY + dx * 0.3;

      // Gradient opacity based on volume
      const alpha = Math.min(0.8, 0.1 + attack.volume / 1000);

      ctx.beginPath();
      ctx.moveTo(source[0], source[1]);
      ctx.quadraticCurveTo(cpX, cpY, target[0], target[1]);
      ctx.strokeStyle = `rgba(255, 152, 0, ${alpha})`;
      ctx.lineWidth = Math.max(1, Math.log10(attack.volume));
      ctx.stroke();
    }
  }, [worldData, threats, attacks, projection, width, height]);

  return (
    <div className="threat-map-container" style={{ position: 'relative' }}>
      <canvas
        ref={canvasRef}
        style={{ width, height, borderRadius: '8px' }}
      />
      {/* SVG overlay for interactive tooltips */}
      <svg
        ref={svgOverlayRef}
        width={width}
        height={height}
        style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
      />
    </div>
  );
};
```

### 6.2 Animated Attack Flow với requestAnimationFrame

```typescript
// ═══════════════════════════════════════════════════
// ANIMATED ATTACK ARC — "Pulse" effect
// ═══════════════════════════════════════════════════
// Hiện "đường đạn" di chuyển từ source → target
// Tạo cảm giác REAL-TIME cho SOC dashboard

function useAnimatedFlows(
  ctx: CanvasRenderingContext2D | null,
  attacks: AttackFlow[],
  projection: d3.GeoProjection,
) {
  const animRef = useRef<number>(0);
  const progressRef = useRef(0);

  useEffect(() => {
    if (!ctx) return;

    function animate() {
      progressRef.current = (progressRef.current + 0.005) % 1;
      const t = progressRef.current;

      for (const attack of attacks) {
        const source = projection([attack.source.lng, attack.source.lat]);
        const target = projection([attack.target.lng, attack.target.lat]);
        if (!source || !target) continue;

        const midX = (source[0] + target[0]) / 2;
        const midY = (source[1] + target[1]) / 2;
        const dx = target[0] - source[0];
        const dy = target[1] - source[1];
        const cpX = midX - dy * 0.3;
        const cpY = midY + dx * 0.3;

        // Calculate point on quadratic bezier at parameter t
        const px =
          (1 - t) ** 2 * source[0] + 2 * (1 - t) * t * cpX + t ** 2 * target[0];
        const py =
          (1 - t) ** 2 * source[1] + 2 * (1 - t) * t * cpY + t ** 2 * target[1];

        // Draw "bullet" dot
        const bulletGradient = ctx.createRadialGradient(px, py, 0, px, py, 6);
        bulletGradient.addColorStop(0, "rgba(255, 255, 255, 1)");
        bulletGradient.addColorStop(0.5, "rgba(255, 152, 0, 0.8)");
        bulletGradient.addColorStop(1, "rgba(255, 152, 0, 0)");

        ctx.beginPath();
        ctx.arc(px, py, 6, 0, Math.PI * 2);
        ctx.fillStyle = bulletGradient;
        ctx.fill();
      }

      animRef.current = requestAnimationFrame(animate);
    }

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [ctx, attacks, projection]);
}
```

---

## 7. Network Topology Graph — Force-Directed Layout

> **🎯 Học xong phần này, bạn sẽ biết:**
>
> - Force simulation là gì và tại sao dùng cho network topology
> - Cách D3 force tự động sắp xếp nodes (không cần tọa độ thủ công)
> - Cách hiển thị trạng thái mạng (healthy/compromised/isolated)

### Force Simulation là gì? — Giải thích cho Beginner

```
FORCE SIMULATION = "MẠNG XÃ HỘI" CỦA MÁY TÍNH:
═══════════════════════════════════════════════════════════════

  Hãy tưởng tượng Facebook friend graph:
  → Mỗi người = 1 điểm (node)
  → Kết bạn = 1 đường nối (edge/link)
  → Nhóm bạn thân tự "dính" vào nhau (cluster)
  → Người lạ bị "đẩy" ra xa

  D3 FORCE SIMULATION cũng vậy:
  ┌──────────────────────────────────────────────┐
  │ Nodes = máy tính, servers, firewalls              │
  │ Links = kết nối mạng giữa chúng                  │
  │                                                  │
  │ D3 tự động sắp xếp vị trí bằng "lực vật lý":    │
  │ • Lực đẩy (charge) → nodes không chồng lên nhau │
  │ • Lực kéo (link)   → nodes kết nối gần nhau    │
  │ • Lực hướng tâm    → không bay ra ngoài vùng vẽ │
  │                                                  │
  │ Kết quả: layout TỰ ĐỘNG đẹp, không cần chỉ định  │
  │ tọa độ cho từng node!                              │
  └──────────────────────────────────────────────┘

  TRONG CYBERSECURITY:
  ─────────────────────
  • Node đỏ    = máy bị compromised
  • Node xanh  = máy healthy
  • Đường đỏ   = kết nối có threat
  • SOC analyst nhìn biểu đồ → thấy ngay lateral movement
```

Dưới đây là cấu trúc chi tiết của network topology visualization:

```
NETWORK TOPOLOGY — D3 FORCE SIMULATION:
═══════════════════════════════════════════════════════════════

  MỤC ĐÍCH: Hiển thị TOÀN BỘ network infrastructure
  để SOC analyst nhanh chóng xác định:
  • Node nào bị compromised?
  • Lateral movement path?
  • Isolated segments?

  ┌─────────────────────────────────────────────────────────┐
  │                                                         │
  │     [Router]────[Firewall]────[Switch]                 │
  │        │              │           │                     │
  │   [Server-1]    [Server-2]   [🔴 Server-3]            │
  │        │              │      (compromised)              │
  │   [WS-01][WS-02]  [DB-01]     │                       │
  │                                │                        │
  │                            [IoT-Hub]                    │
  │                           /    |    \                   │
  │                     [Cam-1] [Cam-2] [Sensor-1]         │
  │                                                         │
  │  COLOR CODING:                                          │
  │  🟢 Healthy (green)    🟡 Warning (yellow)             │
  │  🔴 Compromised (red)  ⚪ Isolated (gray)              │
  │                                                         │
  │  EDGE CODING:                                           │
  │  ─── Normal traffic  ═══ Heavy traffic                 │
  │  - - Encrypted        ╍╍╍ Suspicious                    │
  │                                                         │
  │  INTERACTIONS:                                          │
  │  • Click node → details panel                          │
  │  • Drag nodes → rearrange layout                       │
  │  • Zoom/Pan → explore large topologies                 │
  │  • Hover edge → show protocol & bandwidth              │
  │  • Right-click → isolate/investigate options            │
  │                                                         │
  └─────────────────────────────────────────────────────────┘
```

### 7.1 Force-Directed Graph với D3

```typescript
// ═══════════════════════════════════════════════════
// NETWORK TOPOLOGY — D3 Force Simulation + Canvas
// ═══════════════════════════════════════════════════
// Canvas thay vì SVG vì topology có thể có 5K+ nodes

import * as d3 from 'd3';

interface NetworkTopologyProps {
  nodes: TopologyNode[];
  edges: TopologyEdge[];
  width: number;
  height: number;
  onNodeClick?: (node: TopologyNode) => void;
}

const NetworkTopology: React.FC<NetworkTopologyProps> = ({
  nodes, edges, width, height, onNodeClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simulationRef = useRef<d3.Simulation<
    TopologyNode, TopologyEdge
  > | null>(null);
  const transformRef = useRef(d3.zoomIdentity);

  // Status → Color mapping
  const statusColor: Record<TopologyNode['status'], string> = {
    healthy: '#00e676',
    warning: '#ffd600',
    compromised: '#ff1744',
    isolated: '#616161',
  };

  // Node type → Icon shape
  const nodeSize: Record<TopologyNode['type'], number> = {
    server: 12,
    workstation: 8,
    router: 14,
    firewall: 16,
    switch: 10,
    iot: 6,
    cloud: 14,
    external: 10,
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // ═══════════════════════════════════════════
    // FORCE SIMULATION SETUP
    // ═══════════════════════════════════════════
    const simulation = d3.forceSimulation<TopologyNode>(nodes)
      .force('link', d3.forceLink<TopologyNode, TopologyEdge>(edges)
        .id(d => d.id)
        .distance(d => {
          // Shorter links for high-bandwidth connections
          return 80 + Math.max(0, 100 - d.bandwidth);
        })
        .strength(0.5)
      )
      .force('charge', d3.forceManyBody()
        .strength(d => {
          // Compromised nodes repel MORE (visual attention)
          return d.status === 'compromised' ? -300 : -150;
        })
      )
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide<TopologyNode>()
        .radius(d => nodeSize[d.type] + 5)
      )
      // Group nodes by network segment
      .force('x', d3.forceX<TopologyNode>()
        .x(d => {
          const groupIndex = [...new Set(nodes.map(n => n.group))].indexOf(d.group);
          return (groupIndex / 5) * width;
        })
        .strength(0.05)
      );

    simulationRef.current = simulation;

    // ═══════════════════════════════════════════
    // RENDER ON EACH TICK
    // ═══════════════════════════════════════════
    simulation.on('tick', () => {
      const transform = transformRef.current;

      ctx.save();
      ctx.clearRect(0, 0, width, height);
      ctx.translate(transform.x, transform.y);
      ctx.scale(transform.k, transform.k);

      // Draw edges
      for (const edge of edges) {
        const source = edge.source as unknown as TopologyNode;
        const target = edge.target as unknown as TopologyNode;
        if (!source.x || !target.x) continue;

        ctx.beginPath();
        ctx.moveTo(source.x, source.y!);
        ctx.lineTo(target.x, target.y!);

        // Edge style by threat level
        if (edge.threatLevel === 'critical' || edge.threatLevel === 'high') {
          ctx.strokeStyle = 'rgba(255, 23, 68, 0.6)';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 3]); // Dashed = suspicious
        } else {
          ctx.strokeStyle = edge.isEncrypted
            ? 'rgba(0, 229, 255, 0.3)'  // Cyan = encrypted
            : 'rgba(255, 255, 255, 0.15)';
          ctx.lineWidth = Math.max(1, Math.log10(edge.bandwidth));
          ctx.setLineDash([]);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Draw nodes
      for (const node of nodes) {
        if (node.x == null || node.y == null) continue;
        const size = nodeSize[node.type];
        const color = statusColor[node.status];

        // Glow for compromised nodes
        if (node.status === 'compromised') {
          ctx.beginPath();
          ctx.arc(node.x, node.y, size + 8, 0, Math.PI * 2);
          const glow = ctx.createRadialGradient(
            node.x, node.y, size,
            node.x, node.y, size + 8
          );
          glow.addColorStop(0, 'rgba(255, 23, 68, 0.4)');
          glow.addColorStop(1, 'rgba(255, 23, 68, 0)');
          ctx.fillStyle = glow;
          ctx.fill();
        }

        // Node shape by type
        ctx.beginPath();
        if (node.type === 'firewall') {
          // Diamond shape for firewall
          ctx.moveTo(node.x, node.y - size);
          ctx.lineTo(node.x + size, node.y);
          ctx.lineTo(node.x, node.y + size);
          ctx.lineTo(node.x - size, node.y);
          ctx.closePath();
        } else if (node.type === 'router' || node.type === 'switch') {
          // Square for network devices
          ctx.rect(node.x - size / 2, node.y - size / 2, size, size);
        } else {
          // Circle for everything else
          ctx.arc(node.x, node.y, size, 0, Math.PI * 2);
        }

        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Label
        ctx.fillStyle = '#ccc';
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(node.label, node.x, node.y + size + 14);
      }

      ctx.restore();
    });

    // ═══════════════════════════════════════════
    // ZOOM + PAN + DRAG
    // ═══════════════════════════════════════════
    const zoom = d3.zoom<HTMLCanvasElement, unknown>()
      .scaleExtent([0.1, 8])
      .on('zoom', (event) => {
        transformRef.current = event.transform;
        simulation.alpha(0.1).restart(); // Re-render
      });

    d3.select(canvas).call(zoom);

    // Drag behavior
    d3.select(canvas).on('mousedown', (event) => {
      const [mx, my] = d3.pointer(event);
      const transform = transformRef.current;
      const x = (mx - transform.x) / transform.k;
      const y = (my - transform.y) / transform.k;

      // Find clicked node
      const clickedNode = nodes.find(n => {
        if (!n.x || !n.y) return false;
        const dist = Math.sqrt((n.x - x) ** 2 + (n.y! - y) ** 2);
        return dist < nodeSize[n.type] + 5;
      });

      if (clickedNode && onNodeClick) {
        onNodeClick(clickedNode);
      }
    });

    return () => {
      simulation.stop();
    };
  }, [nodes, edges, width, height]);

  return (
    <div className="topology-container">
      <canvas
        ref={canvasRef}
        style={{
          width, height,
          cursor: 'grab',
          background: '#0a0e1a',
          borderRadius: '8px',
        }}
      />
      {/* Legend */}
      <div className="topology-legend">
        {Object.entries(statusColor).map(([status, color]) => (
          <span key={status} className="legend-item">
            <span className="legend-dot" style={{ background: color }} />
            {status}
          </span>
        ))}
      </div>
    </div>
  );
};
```

### 7.2 Grouping & Clustering cho Large Topologies

```typescript
// ═══════════════════════════════════════════════════
// TOPOLOGY GROUPING — Network Segments
// ═══════════════════════════════════════════════════
// Khi topology > 500 nodes → group thành clusters
// User expand cluster để xem chi tiết

interface TopologyCluster {
  id: string;
  name: string; // "DMZ", "Internal LAN", "Cloud VPC"
  nodeCount: number;
  compromisedCount: number;
  riskScore: number;
  isExpanded: boolean;
  children: TopologyNode[];
}

function clusterNodes(
  nodes: TopologyNode[],
  edges: TopologyEdge[],
): TopologyCluster[] {
  // Group by network segment
  const groups = new Map<string, TopologyNode[]>();
  for (const node of nodes) {
    const existing = groups.get(node.group) || [];
    existing.push(node);
    groups.set(node.group, existing);
  }

  return Array.from(groups.entries()).map(([group, children]) => ({
    id: `cluster-${group}`,
    name: group,
    nodeCount: children.length,
    compromisedCount: children.filter((n) => n.status === "compromised").length,
    riskScore: Math.max(...children.map((n) => n.riskScore as number)),
    isExpanded: children.length < 20, // Auto-expand small groups
    children,
  }));
}

// ═══════════════════════════════════════════════════
// SEMANTIC ZOOM — Khác nhau ở mỗi zoom level
// ═══════════════════════════════════════════════════
// Zoom out: thấy clusters (aggregate view)
// Zoom in: thấy individual nodes (detail view)

function getVisualDetailLevel(
  zoomScale: number,
): "overview" | "group" | "detail" {
  if (zoomScale < 0.5) return "overview"; // Clusters only
  if (zoomScale < 2.0) return "group"; // Clusters + major nodes
  return "detail"; // All nodes + labels
}
```

---

## 8. Attack Vector Visualization — Kill Chain & Sankey

> **🎯 Học xong phần này, bạn sẽ biết:**
>
> - Kill Chain là gì và tại sao cần visualize
> - Sankey diagram là gì và khi nào dùng
> - Cách vẽ luồng tấn công từ dữ liệu MITRE ATT&CK

### Kill Chain & Sankey là gì? — Giải thích cho Beginner

```
KILL CHAIN = "LỘ TRÌNH TẤN CÔNG":
═══════════════════════════════════════════════════════════════

  Hãy tưởng tượng một vụ cướp ngân hàng:
  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
  │ ① Thám   │→ │ ② Đột    │→ │ ③ Lấy   │→ │ ④ Chạy  │
  │   thính  │   │  nhập    │   │  tiền   │   │  trốn   │
  └──────────┘   └──────────┘   └──────────┘   └──────────┘

  Cyber Kill Chain cũng vậy — hacker tấn công theo BƯỚC:
  Reconnaissance → Initial Access → Execution → Persistence
  → Privilege Escalation → Lateral Movement → Exfiltration

  SANKEY DIAGRAM = "BIỂU ĐỒ DÒNG CHẢY":
  ─────────────────────────────────
  Giống như xem dòng chảy của sông:
  → Sông lớn ("đầu vào tấn công") chia thành nhiều nhánh
  → Nhánh RỘNG = nhiều events đi qua (đáng lo!)
  → Nhánh NHỎ = ít events (không quan trọng)

  Ví dụ: 1000 phishing emails → 200 clicked → 50 got malware
         → 10 privilege escalation → 3 data exfiltration
  → Sankey cho thấy CHIỀU RỘNG của từng bước!
```

Dưới đây là cấu trúc chi tiết của Kill Chain & Sankey:

```
ATTACK KILL CHAIN — MITRE ATT&CK FRAMEWORK:
═══════════════════════════════════════════════════════════════

  MỤC ĐÍCH: Hiển thị CHUỖI TẤN CÔNG (attack chain)
  qua các giai đoạn của MITRE ATT&CK framework.

  ① KILL CHAIN TIMELINE:
  ┌───────────────────────────────────────────────────────────┐
  │                                                           │
  │  Recon → Initial → Exec → Persist → Priv → Lateral → C2 │
  │    │     Access     │                  Esc    Move        │
  │    │       │        │                   │       │         │
  │    ▼       ▼        ▼                   ▼       ▼         │
  │  [Port   [Phish  [PowerShell          [Sudo  [RDP to     │
  │   Scan]   Email]  Download]            Vuln]  DB Server]  │
  │                                                           │
  │  ────●──────●────────●────────────────●──────●──── Time  │
  │  09:15    09:22     09:25            09:41  10:03         │
  │                                                           │
  └───────────────────────────────────────────────────────────┘

  ② SANKEY DIAGRAM — Attack Flow Distribution:
  ┌───────────────────────────────────────────────────────────┐
  │                                                           │
  │  Sources          Tactics           Targets              │
  │                                                           │
  │  China ═══╗    ╔═ Phishing ═══╗    ╔═══ Email Server     │
  │           ╠════╣              ╠════╣                      │
  │  Russia ══╣    ╠═ Malware ════╣    ╠═══ Database          │
  │           ╠════╣              ╠════╣                      │
  │  Iran ════╝    ╚═ DDoS ══════╝    ╚═══ Web Server        │
  │                                                           │
  │  Width of flow = attack volume                           │
  │                                                           │
  └───────────────────────────────────────────────────────────┘
```

### 8.1 Kill Chain Timeline Component

```typescript
// ═══════════════════════════════════════════════════
// ATTACK KILL CHAIN — MITRE ATT&CK Timeline
// ═══════════════════════════════════════════════════

const TACTIC_ORDER: MitreTactic[] = [
  'reconnaissance', 'resource_development', 'initial_access',
  'execution', 'persistence', 'privilege_escalation',
  'defense_evasion', 'credential_access', 'discovery',
  'lateral_movement', 'collection', 'command_and_control',
  'exfiltration', 'impact',
];

const TACTIC_COLORS: Record<MitreTactic, string> = {
  reconnaissance: '#78909c',
  resource_development: '#8d6e63',
  initial_access: '#ff7043',
  execution: '#ff5252',
  persistence: '#e040fb',
  privilege_escalation: '#7c4dff',
  defense_evasion: '#448aff',
  credential_access: '#ffd600',
  discovery: '#69f0ae',
  lateral_movement: '#ff6e40',
  collection: '#40c4ff',
  command_and_control: '#ff4081',
  exfiltration: '#ea80fc',
  impact: '#d50000',
};

interface KillChainProps {
  attackVector: AttackVector;
  width: number;
  height: number;
}

const KillChainTimeline: React.FC<KillChainProps> = ({
  attackVector, width, height,
}) => {
  const margin = { top: 40, right: 30, bottom: 60, left: 30 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const { timeline } = attackVector;

  // Time scale
  const timeExtent = d3.extent(timeline, d => d.timestamp) as [number, number];
  const xScale = d3.scaleLinear()
    .domain(timeExtent)
    .range([0, innerWidth]);

  // Tactic → Y position
  const yScale = d3.scaleBand<MitreTactic>()
    .domain(TACTIC_ORDER.filter(t => timeline.some(e => e.tactic === t)))
    .range([0, innerHeight])
    .padding(0.3);

  return (
    <div className="kill-chain">
      <h3>
        🎯 Attack Chain: {attackVector.name}
        <span className="confidence">
          Confidence: {((attackVector.confidence as number) * 100).toFixed(0)}%
        </span>
      </h3>

      <svg width={width} height={height}>
        <g transform={`translate(${margin.left},${margin.top})`}>
          {/* Connection lines between timeline events */}
          {timeline.slice(0, -1).map((event, i) => {
            const next = timeline[i + 1];
            return (
              <line
                key={`line-${i}`}
                x1={xScale(event.timestamp)}
                y1={(yScale(event.tactic) || 0) + yScale.bandwidth() / 2}
                x2={xScale(next.timestamp)}
                y2={(yScale(next.tactic) || 0) + yScale.bandwidth() / 2}
                stroke="rgba(255,255,255,0.2)"
                strokeWidth={2}
                strokeDasharray="4,4"
              />
            );
          })}

          {/* Tactic labels (left) */}
          {TACTIC_ORDER
            .filter(t => timeline.some(e => e.tactic === t))
            .map(tactic => (
              <g key={tactic}
                 transform={`translate(-8,${(yScale(tactic) || 0) + yScale.bandwidth() / 2})`}>
                <text
                  textAnchor="end"
                  fill={TACTIC_COLORS[tactic]}
                  fontSize={11}
                  dy="0.35em"
                >
                  {tactic.replace(/_/g, ' ')}
                </text>
              </g>
          ))}

          {/* Timeline events */}
          {timeline.map((event, i) => {
            const x = xScale(event.timestamp);
            const y = (yScale(event.tactic) || 0) + yScale.bandwidth() / 2;

            return (
              <g key={i} transform={`translate(${x},${y})`}
                 className="timeline-event">
                {/* Glow */}
                <circle r={16} fill={TACTIC_COLORS[event.tactic]}
                        opacity={0.15} />
                {/* Dot */}
                <circle r={8} fill={TACTIC_COLORS[event.tactic]}
                        stroke="#fff" strokeWidth={2} />
                {/* Technique label */}
                <text y={-16} textAnchor="middle" fill="#ccc"
                      fontSize={10} fontWeight="bold">
                  {event.technique}
                </text>
                {/* Time label */}
                <text y={24} textAnchor="middle" fill="#777" fontSize={9}>
                  {new Date(event.timestamp).toLocaleTimeString()}
                </text>
              </g>
            );
          })}

          {/* Time axis */}
          <g transform={`translate(0,${innerHeight + 20})`}>
            {xScale.ticks(6).map(tick => (
              <g key={tick} transform={`translate(${xScale(tick)},0)`}>
                <line y2={6} stroke="#444" />
                <text y={18} textAnchor="middle" fill="#777" fontSize={10}>
                  {new Date(tick).toLocaleTimeString()}
                </text>
              </g>
            ))}
          </g>
        </g>
      </svg>
    </div>
  );
};
```

### 8.2 Sankey Diagram — Attack Flow

```typescript
// ═══════════════════════════════════════════════════
// SANKEY DIAGRAM — Attack Source → Tactic → Target
// ═══════════════════════════════════════════════════
// d3-sankey: npm install d3-sankey @types/d3-sankey

import { sankey, sankeyLinkHorizontal, SankeyNode, SankeyLink } from 'd3-sankey';

interface SankeyData {
  nodes: Array<{ id: string; name: string; category: 'source' | 'tactic' | 'target' }>;
  links: Array<{ source: string; target: string; value: number }>;
}

const AttackSankeyDiagram: React.FC<{
  data: SankeyData;
  width: number;
  height: number;
}> = ({ data, width, height }) => {
  const margin = { top: 20, right: 20, bottom: 20, left: 20 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Build sankey layout
  const sankeyGenerator = sankey<
    { id: string; name: string; category: string },
    { source: string; target: string; value: number }
  >()
    .nodeId(d => d.id)
    .nodeWidth(20)
    .nodePadding(12)
    .extent([[0, 0], [innerWidth, innerHeight]]);

  const { nodes: layoutNodes, links: layoutLinks } = sankeyGenerator({
    nodes: data.nodes.map(d => ({ ...d })),
    links: data.links.map(d => ({ ...d })),
  });

  const linkPath = sankeyLinkHorizontal();

  // Color by category
  const categoryColor = {
    source: '#ff7043',
    tactic: '#7c4dff',
    target: '#40c4ff',
  };

  return (
    <svg width={width} height={height}>
      <g transform={`translate(${margin.left},${margin.top})`}>
        {/* Links */}
        {layoutLinks.map((link, i) => (
          <path
            key={i}
            d={linkPath(link as any) || ''}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={Math.max(1, (link as any).width)}
            opacity={0.6}
          >
            <title>
              {(link.source as any).name} → {(link.target as any).name}: {link.value}
            </title>
          </path>
        ))}

        {/* Nodes */}
        {layoutNodes.map(node => {
          const n = node as any;
          return (
            <g key={n.id}>
              <rect
                x={n.x0}
                y={n.y0}
                width={n.x1 - n.x0}
                height={n.y1 - n.y0}
                fill={categoryColor[n.category as keyof typeof categoryColor] || '#999'}
                rx={3}
              />
              <text
                x={n.x0 < innerWidth / 2 ? n.x1 + 8 : n.x0 - 8}
                y={(n.y0 + n.y1) / 2}
                textAnchor={n.x0 < innerWidth / 2 ? 'start' : 'end'}
                fill="#ccc"
                fontSize={11}
                dy="0.35em"
              >
                {n.name}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
};
```

---

## 9. Recharts — Production-Ready Charts

> **🎯 Học xong phần này, bạn sẽ biết:**
>
> - Khi nào dùng Recharts thay vì D3.js
> - Các loại chart phổ biến: Area, Line, Bar, Pie, Radar
> - Cách tích hợp Recharts + real-time data

### Recharts vs D3 — Giải thích cho Beginner

```
RECHARTS vs D3.js — ANALOGY:
═══════════════════════════════════════════════════════════════

  Recharts = ĐẶT ĐỒ ĂN ONLINE (Grab Food):
  → Chọn món → thêm topping → đặt → đồ ăn đến!
  → Nhanh, dễ, không cần biết nấu
  → Nhưng chỉ có những món trong menu

  D3.js = TỰ NẤU TỪ ĐẦU:
  → Mua nguyên liệu → chế biến → nấu → bày ra dĩa
  → Làm được món GI cũng được
  → Nhưng cần biết nấu (học nhiều hơn)

  TRONG CYBERSECURITY DASHBOARD:
  ┌──────────────────────────────────────────────┐
  │ Chart cơ bản (line, bar, pie) → RECHARTS       │
  │ Network graph, geo map       → D3.js          │
  │ 3D, 100K+ particles          → WebGL/Three.js  │
  └──────────────────────────────────────────────┘
  → 80% dashboard dùng Recharts, 20% cần D3/WebGL
```

```
RECHARTS — KHI NÀO DÙNG:
═══════════════════════════════════════════════════════════════

  ✅ Dùng Recharts khi:
  • Dashboard standard charts (bar, line, area, pie)
  • Data < 10K points
  • Cần nhanh, ít custom
  • Team members không biết D3

  ❌ KHÔNG dùng Recharts khi:
  • Network topology (cần force layout)
  • Geo maps (cần projection)
  • 50K+ data points (SVG perf limit)
  • Highly custom visualizations

  RECHARTS PATTERNS CHO CYBERSECURITY:
  ┌───────────────────────────────────────────────────┐
  │  ① Threat over Time     → AreaChart + brush      │
  │  ② Severity breakdown   → PieChart / RadialBar   │
  │  ③ Top attack sources   → BarChart horizontal    │
  │  ④ Model accuracy       → LineChart multi-series │
  │  ⑤ Alert volume         → ComposedChart          │
  │  ⑥ Response time        → ScatterChart           │
  └───────────────────────────────────────────────────┘
```

### 9.1 Threat Timeline với Brush Selection

```typescript
// ═══════════════════════════════════════════════════
// RECHARTS — THREAT TIMELINE + BRUSH ZOOM
// ═══════════════════════════════════════════════════

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Brush,
  ReferenceLine, Legend,
} from 'recharts';

interface ThreatTimelineData {
  timestamp: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  total: number;
  anomalyScore: number; // AI model output average
}

const ThreatTimeline: React.FC<{
  data: ThreatTimelineData[];
  baselineThreshold?: number;
}> = ({ data, baselineThreshold = 50 }) => {
  return (
    <div className="threat-timeline">
      <h3>📊 Threat Activity Timeline</h3>
      <ResponsiveContainer width="100%" height={400}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="criticalGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ff1744" stopOpacity={0.6} />
              <stop offset="95%" stopColor="#ff1744" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="highGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ff9100" stopOpacity={0.5} />
              <stop offset="95%" stopColor="#ff9100" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="mediumGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ffd600" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#ffd600" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#1a2744" />

          <XAxis
            dataKey="timestamp"
            tickFormatter={(ts) => new Date(ts).toLocaleTimeString()}
            stroke="#555"
            fontSize={11}
          />
          <YAxis stroke="#555" fontSize={11} />

          {/* Stacked areas by severity */}
          <Area
            type="monotone" dataKey="critical" stackId="1"
            stroke="#ff1744" fill="url(#criticalGrad)"
            strokeWidth={2}
          />
          <Area
            type="monotone" dataKey="high" stackId="1"
            stroke="#ff9100" fill="url(#highGrad)"
          />
          <Area
            type="monotone" dataKey="medium" stackId="1"
            stroke="#ffd600" fill="url(#mediumGrad)"
          />

          {/* Baseline threshold */}
          <ReferenceLine
            y={baselineThreshold}
            stroke="#ff5252"
            strokeDasharray="8 4"
            label={{ value: 'Alert Threshold', fill: '#ff5252', fontSize: 11 }}
          />

          <Tooltip
            contentStyle={{
              background: '#1a2744',
              border: '1px solid #2a3a5c',
              borderRadius: '8px',
              color: '#fff',
            }}
            labelFormatter={(ts) => new Date(ts as number).toLocaleString()}
          />

          <Legend />

          {/* Brush for time range selection */}
          <Brush
            dataKey="timestamp"
            height={30}
            stroke="#2a3a5c"
            fill="#0d1b2a"
            tickFormatter={(ts) => new Date(ts).toLocaleTimeString()}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
```

### 9.2 AI Model Performance Dashboard

```typescript
// ═══════════════════════════════════════════════════
// MODEL PERFORMANCE METRICS — Recharts
// ═══════════════════════════════════════════════════

import {
  RadialBarChart, RadialBar, Legend,
  PieChart, Pie, Cell,
  ComposedChart, Line, Bar,
} from 'recharts';

// ① ROC Curve visualization
const ROCCurveChart: React.FC<{
  rocData: Array<{ fpr: number; tpr: number; threshold: number }>;
  selectedThreshold: number;
  onThresholdChange: (threshold: number) => void;
}> = ({ rocData, selectedThreshold, onThresholdChange }) => {
  // Find nearest point to selected threshold
  const selectedPoint = rocData.reduce((best, point) =>
    Math.abs(point.threshold - selectedThreshold) <
    Math.abs(best.threshold - selectedThreshold) ? point : best
  );

  return (
    <div className="roc-curve">
      <h4>ROC Curve — Model Performance</h4>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={rocData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a2744" />
          <XAxis
            dataKey="fpr"
            label={{ value: 'False Positive Rate', position: 'bottom', fill: '#999' }}
            stroke="#555"
            domain={[0, 1]}
          />
          <YAxis
            label={{ value: 'True Positive Rate', angle: -90, position: 'left', fill: '#999' }}
            stroke="#555"
            domain={[0, 1]}
          />

          {/* Diagonal (random classifier) */}
          <ReferenceLine
            segment={[{ x: 0, y: 0 }, { x: 1, y: 1 }]}
            stroke="#555"
            strokeDasharray="4 4"
          />

          {/* ROC curve */}
          <Line
            type="monotone"
            dataKey="tpr"
            stroke="#00e5ff"
            strokeWidth={2}
            dot={false}
          />

          {/* Selected threshold point */}
          <ReferenceLine
            x={selectedPoint.fpr}
            stroke="#ff9100"
            strokeDasharray="4 4"
          />

          <Tooltip
            contentStyle={{ background: '#1a2744', border: '1px solid #2a3a5c' }}
            formatter={(value: number, name: string) => [
              value.toFixed(3),
              name === 'tpr' ? 'True Positive Rate' : name,
            ]}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Threshold slider */}
      <div className="threshold-slider">
        <label>
          Threshold: {selectedThreshold.toFixed(2)}
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={selectedThreshold}
            onChange={(e) => onThresholdChange(parseFloat(e.target.value))}
          />
        </label>
        <div className="threshold-metrics">
          <span>TPR: {selectedPoint.tpr.toFixed(3)}</span>
          <span>FPR: {selectedPoint.fpr.toFixed(3)}</span>
        </div>
      </div>
    </div>
  );
};

// ② Confusion Matrix
const ConfusionMatrix: React.FC<{
  tp: number; fp: number; fn: number; tn: number;
}> = ({ tp, fp, fn, tn }) => {
  const total = tp + fp + fn + tn;
  const accuracy = ((tp + tn) / total * 100).toFixed(1);
  const precision = (tp / (tp + fp) * 100).toFixed(1);
  const recall = (tp / (tp + fn) * 100).toFixed(1);
  const f1 = (2 * Number(precision) * Number(recall) /
    (Number(precision) + Number(recall))).toFixed(1);

  return (
    <div className="confusion-matrix">
      <h4>Confusion Matrix</h4>
      <table className="matrix-table">
        <thead>
          <tr>
            <th></th>
            <th>Predicted Anomaly</th>
            <th>Predicted Normal</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th>Actual Anomaly</th>
            <td className="tp">{tp.toLocaleString()} (TP)</td>
            <td className="fn">{fn.toLocaleString()} (FN)</td>
          </tr>
          <tr>
            <th>Actual Normal</th>
            <td className="fp">{fp.toLocaleString()} (FP)</td>
            <td className="tn">{tn.toLocaleString()} (TN)</td>
          </tr>
        </tbody>
      </table>

      <div className="metrics-row">
        <div className="metric">
          <span className="metric-label">Accuracy</span>
          <span className="metric-value">{accuracy}%</span>
        </div>
        <div className="metric">
          <span className="metric-label">Precision</span>
          <span className="metric-value">{precision}%</span>
        </div>
        <div className="metric">
          <span className="metric-label">Recall</span>
          <span className="metric-value">{recall}%</span>
        </div>
        <div className="metric">
          <span className="metric-label">F1 Score</span>
          <span className="metric-value">{f1}%</span>
        </div>
      </div>
    </div>
  );
};
```

---

## 10. Translating AI Confidence → Human-Readable Risk UX

> **🎯 Học xong phần này, bạn sẽ biết:**
>
> - Confidence score là gì và tại sao không hiển thị trực tiếp cho user
> - Cách chuyển đổi "0.73" thành "HIGH RISK" + hành động cụ thể
> - UX patterns cho risk visualization (màu, icon, động)

### Confidence Score là gì? — Giải thích cho Beginner

```
CONFIDENCE SCORE = "ĐÈN GIAO THÔNG" CHO SECURITY:
═══════════════════════════════════════════════════════════════

  AI trả về số confidence: 0.0 → 1.0
  Nhưng SOC Analyst KHÔNG muốn thấy "0.73"!
  Họ muốn biết: "TÔI PHẢI LÀM GÌ?"

  Giống đèn giao thông:
  ┌─────────────────────────────────────────────────┐
  │ 0.0 - 0.3  🟢 XANH   = "An toàn, tự động xử lý"   │
  │ 0.3 - 0.6  🟡 VÀNG   = "Cần xem lại khi rảnh"     │
  │ 0.6 - 0.85 🟠 CAM    = "Kiểm tra trong 1 giờ"     │
  │ 0.85 - 1.0 🔴 ĐỎ     = "Xử lý NGAY LẬP TỨC!"      │
  └─────────────────────────────────────────────────┘

  FRONTEND DEVELOPER cần làm:
  → Nhận số 0.73 từ API
  → Chuyển thành: màu cam + icon cảnh báo + text "HIGH RISK"
  → Thêm animation nhấp nháy cho alerts critical
  → SOC Analyst nhìn vào = BIẾT NGAY cần làm gì!
```

Dưới đây là chi tiết cách chuyển đổi confidence → UX:

```
AI CONFIDENCE → RISK UX — TRANSLATION LAYER:
═══════════════════════════════════════════════════════════════

  VẤN ĐỀ CHÍNH: SOC Analyst KHÔNG hiểu "confidence 0.73"
  Họ cần biết: "Tôi phải LÀM GÌ ngay bây giờ?"

  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  AI OUTPUT        →    HUMAN OUTPUT                    │
  │                                                        │
  │  confidence: 0.92 →    🔴 CRITICAL RISK               │
  │                        "Immediate action required"     │
  │                        Auto-escalate to Tier 2         │
  │                                                        │
  │  confidence: 0.73 →    🟠 HIGH RISK                    │
  │                        "Investigate within 15 min"     │
  │                        Show in priority queue          │
  │                                                        │
  │  confidence: 0.45 →    🟡 MEDIUM RISK                  │
  │                        "Review when available"         │
  │                        Group with similar alerts       │
  │                                                        │
  │  confidence: 0.22 →    🟢 LOW RISK                     │
  │                        "Likely false positive"         │
  │                        Auto-resolve after 24h          │
  │                                                        │
  │  confidence: 0.08 →    ⚪ INFORMATIONAL                │
  │                        "Normal behavior detected"      │
  │                        Log only, no notification       │
  │                                                        │
  └────────────────────────────────────────────────────────┘

  CRITICAL UX PRINCIPLES:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ① NEVER show raw confidence numbers alone             │
  │     → Always pair with label + color + action          │
  │                                                        │
  │  ② Show UNCERTAINTY, not just score                    │
  │     → "73% confident (±12%)" cho honest reporting      │
  │                                                        │
  │  ③ ACTIONABLE indicators                               │
  │     → Don't just say "high" → say "investigate in      │
  │       15 min" "escalate to Tier 2"                     │
  │                                                        │
  │  ④ FALSE POSITIVE awareness                            │
  │     → Show model's historical FP rate at this score   │
  │     → "At this threshold, 8% are false positives"     │
  │                                                        │
  │  ⑤ PROGRESSIVE DISCLOSURE                              │
  │     → Level 1: Color badge (at-a-glance)              │
  │     → Level 2: Risk label + action (hover/click)      │
  │     → Level 3: Full SHAP explanation (drill-down)     │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 10.1 Risk Score Translation Engine

```typescript
// ═══════════════════════════════════════════════════
// RISK TRANSLATION — AI Score → Human UX
// ═══════════════════════════════════════════════════

interface RiskConfig {
  level: RiskLevel;
  label: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
  action: string;
  sla: string; // Response SLA
  autoEscalate: boolean;
  notificationLevel: "none" | "silent" | "normal" | "urgent" | "critical";
}

// Configurable thresholds — tunable by SOC team
interface ThresholdConfig {
  critical: number; // default 0.85
  high: number; // default 0.65
  medium: number; // default 0.40
  low: number; // default 0.15
}

const DEFAULT_THRESHOLDS: ThresholdConfig = {
  critical: 0.85,
  high: 0.65,
  medium: 0.4,
  low: 0.15,
};

function translateRisk(
  confidence: number,
  thresholds: ThresholdConfig = DEFAULT_THRESHOLDS,
): RiskConfig {
  if (confidence >= thresholds.critical) {
    return {
      level: "critical",
      label: "Critical Risk",
      description:
        "Immediate action required. High-confidence threat detected.",
      color: "#ff1744",
      bgColor: "rgba(255, 23, 68, 0.1)",
      borderColor: "rgba(255, 23, 68, 0.5)",
      icon: "🔴",
      action: "Escalate to Tier 2 immediately",
      sla: "< 5 minutes",
      autoEscalate: true,
      notificationLevel: "critical",
    };
  }
  if (confidence >= thresholds.high) {
    return {
      level: "high",
      label: "High Risk",
      description: "Investigate promptly. Significant anomaly detected.",
      color: "#ff9100",
      bgColor: "rgba(255, 145, 0, 0.1)",
      borderColor: "rgba(255, 145, 0, 0.5)",
      icon: "🟠",
      action: "Investigate within 15 minutes",
      sla: "< 15 minutes",
      autoEscalate: false,
      notificationLevel: "urgent",
    };
  }
  if (confidence >= thresholds.medium) {
    return {
      level: "medium",
      label: "Medium Risk",
      description: "Review when available. Possible anomaly.",
      color: "#ffd600",
      bgColor: "rgba(255, 214, 0, 0.08)",
      borderColor: "rgba(255, 214, 0, 0.3)",
      icon: "🟡",
      action: "Review in alert queue",
      sla: "< 1 hour",
      autoEscalate: false,
      notificationLevel: "normal",
    };
  }
  if (confidence >= thresholds.low) {
    return {
      level: "low",
      label: "Low Risk",
      description: "Likely false positive. Auto-resolve after review period.",
      color: "#00e676",
      bgColor: "rgba(0, 230, 118, 0.05)",
      borderColor: "rgba(0, 230, 118, 0.2)",
      icon: "🟢",
      action: "Auto-resolve after 24h if no escalation",
      sla: "< 24 hours",
      autoEscalate: false,
      notificationLevel: "silent",
    };
  }
  return {
    level: "info",
    label: "Informational",
    description: "Normal behavior. No action required.",
    color: "#90a4ae",
    bgColor: "rgba(144, 164, 174, 0.05)",
    borderColor: "rgba(144, 164, 174, 0.2)",
    icon: "⚪",
    action: "Log only",
    sla: "N/A",
    autoEscalate: false,
    notificationLevel: "none",
  };
}
```

### 10.2 Risk Badge Component với Progressive Disclosure

```typescript
// ═══════════════════════════════════════════════════
// RISK BADGE — Multi-level disclosure
// ═══════════════════════════════════════════════════

const RiskBadge: React.FC<{
  detection: AIDetectionResult;
  thresholds?: ThresholdConfig;
  showDetails?: boolean;
}> = ({ detection, thresholds, showDetails = false }) => {
  const [expanded, setExpanded] = useState(false);
  const risk = translateRisk(detection.confidence as number, thresholds);

  return (
    <div
      className="risk-badge"
      style={{
        background: risk.bgColor,
        border: `1px solid ${risk.borderColor}`,
        borderRadius: '8px',
        padding: '8px 12px',
        cursor: 'pointer',
      }}
      onClick={() => setExpanded(!expanded)}
    >
      {/* Level 1: At-a-glance */}
      <div className="risk-badge-header" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="risk-icon">{risk.icon}</span>
        <span style={{ color: risk.color, fontWeight: 'bold' }}>{risk.label}</span>
        <span className="risk-confidence" style={{ color: '#999', fontSize: 12 }}>
          {((detection.confidence as number) * 100).toFixed(0)}%
        </span>

        {/* Animated confidence bar */}
        <div className="confidence-bar" style={{
          flex: 1, height: 4, background: '#1a2744', borderRadius: 2, overflow: 'hidden',
        }}>
          <div style={{
            width: `${(detection.confidence as number) * 100}%`,
            height: '100%',
            background: risk.color,
            borderRadius: 2,
            transition: 'width 0.5s ease',
          }} />
        </div>
      </div>

      {/* Level 2: Action guidance (hover or always shown) */}
      {(showDetails || expanded) && (
        <div className="risk-details" style={{ marginTop: 8 }}>
          <p style={{ color: '#ccc', fontSize: 13, margin: 0 }}>
            {risk.description}
          </p>
          <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 12 }}>
            <span style={{ color: risk.color }}>
              ⏱️ SLA: {risk.sla}
            </span>
            <span style={{ color: '#999' }}>
              📋 {risk.action}
            </span>
          </div>
        </div>
      )}

      {/* Level 3: Full SHAP explanation (drill-down) */}
      {expanded && detection.explanation && (
        <div className="risk-explanation" style={{ marginTop: 12 }}>
          <p style={{ color: '#aaa', fontSize: 12, fontStyle: 'italic' }}>
            {detection.explanation.summary}
          </p>
          <div className="top-features" style={{ marginTop: 8 }}>
            {detection.explanation.featureImportance
              .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
              .slice(0, 5)
              .map(feature => (
                <div
                  key={feature.feature}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 11,
                    padding: '2px 0',
                  }}
                >
                  <span style={{ color: '#ccc' }}>
                    {humanizeFeatureName(feature.feature)}
                  </span>
                  <span style={{
                    color: feature.direction === 'increases_risk' ? '#ff1744' : '#00e676',
                    fontWeight: 'bold',
                  }}>
                    {feature.contribution >= 0 ? '+' : ''}
                    {feature.contribution.toFixed(3)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
```

### 10.3 Threshold Tuning UI

```typescript
// ═══════════════════════════════════════════════════
// THRESHOLD TUNING — Let SOC team adjust thresholds
// ═══════════════════════════════════════════════════
// Model threshold ảnh hưởng trực tiếp:
// → Cao hơn = ít alerts, có thể miss threats
// → Thấp hơn = nhiều alerts, analyst fatigue

const ThresholdTuner: React.FC<{
  currentThresholds: ThresholdConfig;
  onThresholdsChange: (thresholds: ThresholdConfig) => void;
  historicalData: Array<{
    threshold: number;
    truePositives: number;
    falsePositives: number;
    falseNegatives: number;
  }>;
}> = ({ currentThresholds, onThresholdsChange, historicalData }) => {
  // Calculate impact metrics at current thresholds
  const getImpact = (threshold: number) => {
    const nearest = historicalData.reduce((best, d) =>
      Math.abs(d.threshold - threshold) < Math.abs(best.threshold - threshold) ? d : best
    );
    return nearest;
  };

  return (
    <div className="threshold-tuner">
      <h4>⚙️ Detection Threshold Tuning</h4>

      {(['critical', 'high', 'medium', 'low'] as const).map(level => {
        const threshold = currentThresholds[level];
        const impact = getImpact(threshold);
        const risk = translateRisk(threshold, currentThresholds);

        return (
          <div key={level} className="threshold-row" style={{
            display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12,
          }}>
            <span style={{ width: 80, color: risk.color, fontWeight: 'bold' }}>
              {risk.icon} {level}
            </span>

            <input
              type="range"
              min="0" max="1" step="0.01"
              value={threshold}
              onChange={(e) => onThresholdsChange({
                ...currentThresholds,
                [level]: parseFloat(e.target.value),
              })}
              style={{ flex: 1 }}
            />

            <span style={{ width: 50, color: '#ccc', fontSize: 12 }}>
              {threshold.toFixed(2)}
            </span>

            {impact && (
              <span style={{ fontSize: 11, color: '#777' }}>
                TP: {impact.truePositives} |
                FP: {impact.falsePositives} |
                FN: {impact.falseNegatives}
              </span>
            )}
          </div>
        );
      })}

      <div className="threshold-warning" style={{
        background: 'rgba(255, 152, 0, 0.1)',
        border: '1px solid rgba(255, 152, 0, 0.3)',
        borderRadius: 8,
        padding: '8px 12px',
        fontSize: 12,
        color: '#ff9100',
        marginTop: 12,
      }}>
        ⚠️ Lowering thresholds increases alert volume.
        Current estimated alerts/day: {calculateEstimatedAlerts(currentThresholds)}
      </div>
    </div>
  );
};

function calculateEstimatedAlerts(thresholds: ThresholdConfig): string {
  // Simplified estimation based on threshold levels
  const baseRate = 10000; // events/day
  const alertRate = baseRate * (1 - thresholds.low); // rough estimate
  return alertRate.toLocaleString();
}
```

---

## 11. WebGL / Three.js — 3D Security Visualization

> **🎯 Học xong phần này, bạn sẽ biết:**
>
> - Khi nào cần Three.js thay vì D3/Recharts
> - Cách tạo particle system cho 100K+ events
> - R3F (React Three Fiber) = Three.js + React

### Three.js là gì? — Giải thích cho Beginner

```
THREE.JS = "D3.JS NHƯNG CHO 3D":
═══════════════════════════════════════════════════════════════

  D3.js  = vẽ 2D (SVG/Canvas) → biểu đồ, bản đồ
  Three.js = vẽ 3D (WebGL/GPU)  → cảnh 3D, particles

  Tại sao cần 3D trong cybersecurity?
  ┌──────────────────────────────────────────────┐
  │ ① 100K+ network events → particles bay trong    │
  │   không gian 3D, màu = threat level              │
  │ ② Network topology 3D → xoay, zoom, navigate    │
  │   qua infrastructure thay vì nhìn 2D phẳng      │
  │ ③ Globe trái đất 3D → global threat map đẹp hơn │
  └──────────────────────────────────────────────┘

  R3F (React Three Fiber) = Three.js viết kiểu React:
  → Thay vì: new THREE.Mesh(...) ← imperative
  → Viết:   <mesh><sphereGeometry /><meshStandardMaterial /></mesh>
  → React dev quen thuộc hơn, dễ maintain hơn!
```

```
THREE.js / WebGL — KHI NÀO CẦN:
═══════════════════════════════════════════════════════════════

  ✅ Dùng Three.js/WebGL khi:
  • 3D network topology (navigate qua infrastructure)
  • Massive data points (100K+ particles)
  • Real-time attack animation (particle effects)
  • Globe visualization (3D threat map)
  • VR/AR security operations

  ❌ KHÔNG dùng khi:
  • Standard 2D charts → Recharts
  • Simple topology → D3 force + Canvas
  • Data < 50K points → Canvas 2D
  • Mobile-first (GPU intensive)

  COMMON PATTERNS:
  ┌───────────────────────────────────────────────────┐
  │  ① 3D Globe Threat Map                           │
  │     → Three.js + globe texture + points          │
  │     → Animated arcs between countries            │
  │                                                   │
  │  ② Particle System (Attack Volume)               │
  │     → WebGL instanced rendering                  │
  │     → 1M particles = 1M events in real-time      │
  │                                                   │
  │  ③ 3D Network Topology                            │
  │     → Three.js + force layout in 3D              │
  │     → Camera orbit/fly-through                    │
  │                                                   │
  │  ④ Data Landscape (Terrain Visualization)         │
  │     → Height = threat density                    │
  │     → Color = risk level                          │
  │     → Camera navigation through "data mountains" │
  └───────────────────────────────────────────────────┘
```

### 11.1 3D Globe Threat Map

```typescript
// ═══════════════════════════════════════════════════
// THREE.js — 3D GLOBE THREAT MAP
// ═══════════════════════════════════════════════════

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

interface GlobeTheatMapProps {
  threats: ThreatMapPoint[];
  attacks: AttackFlow[];
  containerRef: React.RefObject<HTMLDivElement>;
}

function useThreeGlobe({ threats, attacks, containerRef }: GlobeTheatMapProps) {
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070b15);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 300);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 150;
    controls.maxDistance = 500;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;

    // ① Globe sphere
    const globeGeo = new THREE.SphereGeometry(100, 64, 64);
    const globeMat = new THREE.MeshPhongMaterial({
      color: 0x1a2744,
      emissive: 0x0a1628,
      specular: 0x2a3a5c,
      shininess: 10,
      transparent: true,
      opacity: 0.9,
    });
    const globe = new THREE.Mesh(globeGeo, globeMat);
    scene.add(globe);

    // Atmosphere glow
    const atmosphereGeo = new THREE.SphereGeometry(102, 64, 64);
    const atmosphereMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
          gl_FragColor = vec4(0.0, 0.5, 1.0, intensity * 0.5);
        }
      `,
      side: THREE.BackSide,
      transparent: true,
    });
    scene.add(new THREE.Mesh(atmosphereGeo, atmosphereMat));

    // ② Threat points as instanced meshes (performance)
    const pointGeo = new THREE.SphereGeometry(1.5, 8, 8);
    const threatMesh = new THREE.InstancedMesh(
      pointGeo,
      new THREE.MeshBasicMaterial({ color: 0xff1744 }),
      threats.length,
    );

    const dummy = new THREE.Object3D();
    threats.forEach((threat, i) => {
      const pos = latLngToVector3(threat.lat, threat.lng, 101);
      dummy.position.copy(pos);
      dummy.updateMatrix();
      threatMesh.setMatrixAt(i, dummy.matrix);

      // Color by risk
      const color = new THREE.Color(threat.isSource ? 0xff1744 : 0x00b0ff);
      threatMesh.setColorAt(i, color);
    });
    scene.add(threatMesh);

    // Lights
    scene.add(new THREE.AmbientLight(0x404040, 2));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(200, 200, 200);
    scene.add(dirLight);

    // Animation loop
    function animate() {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    // Cleanup
    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;

    return () => {
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, [threats, attacks, containerRef]);
}

// Helper: Convert lat/lng to 3D position on sphere
function latLngToVector3(
  lat: number,
  lng: number,
  radius: number,
): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);

  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}
```

### 11.2 React Three Fiber Alternative

```typescript
// ═══════════════════════════════════════════════════
// REACT THREE FIBER — React-native Three.js
// ═══════════════════════════════════════════════════
// @react-three/fiber: Declarative Three.js with React

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Sphere, Line } from '@react-three/drei';

const ThreatGlobe: React.FC<{ threats: ThreatMapPoint[] }> = ({ threats }) => {
  return (
    <Canvas
      camera={{ position: [0, 0, 300], fov: 45 }}
      style={{ width: '100%', height: '600px', background: '#070b15' }}
    >
      <ambientLight intensity={0.4} />
      <directionalLight position={[200, 200, 200]} intensity={1} />
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        autoRotate
        autoRotateSpeed={0.5}
      />

      {/* Globe */}
      <Sphere args={[100, 64, 64]}>
        <meshPhongMaterial
          color="#1a2744"
          emissive="#0a1628"
          transparent
          opacity={0.9}
        />
      </Sphere>

      {/* Threat Points */}
      {threats.map(threat => {
        const pos = latLngToVector3(threat.lat, threat.lng, 101);
        return (
          <ThreatPoint
            key={threat.id}
            position={[pos.x, pos.y, pos.z]}
            isSource={threat.isSource}
            riskLevel={threat.riskLevel}
          />
        );
      })}
    </Canvas>
  );
};

const ThreatPoint: React.FC<{
  position: [number, number, number];
  isSource: boolean;
  riskLevel: RiskLevel;
}> = ({ position, isSource, riskLevel }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  // Pulsing animation
  useFrame(({ clock }) => {
    if (meshRef.current) {
      const scale = 1 + Math.sin(clock.elapsedTime * 3) * 0.2;
      meshRef.current.scale.setScalar(scale);
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[1.5, 8, 8]} />
      <meshBasicMaterial
        color={isSource ? '#ff1744' : '#00b0ff'}
        transparent
        opacity={0.8}
      />
    </mesh>
  );
};
```

---

## 12. Performance Optimization & Interview Questions

> **🎯 Học xong phần này, bạn sẽ biết:**
>
> - SVG vs Canvas vs WebGL — khi nào dùng cái nào
> - Các kỹ thuật tối ưu performance cho heavy visualizations
> - Câu hỏi phỏng vấn Senior về data visualization

### SVG vs Canvas vs WebGL — Bảng so sánh nhanh

```
CHỌN CÔNG NGHỆ Vẽ — QUY TẮC ĐƠN GIẢN:
═══════════════════════════════════════════════════════════════

  ┌────────────┬─────────────┬─────────────┬─────────────┐
  │            │ SVG         │ Canvas        │ WebGL         │
  ├────────────┼─────────────┼─────────────┼─────────────┤
  │ Số lượng   │ < 1K        │ 1K - 50K      │ 50K+          │
  │ Tương tác   │ ✅ Dễ        │ ⚠️ Khó        │ ⚠️ Rất khó   │
  │ Animation  │ CSS/SMIL    │ requestAnim   │ Shader        │
  │ Text       │ ✅ Native    │ ❌ Tự vẽ      │ ❌ Tự vẽ     │
  │ Nước đi     │ Recharts    │ D3+Canvas     │ Three.js/R3F  │
  └────────────┴─────────────┴─────────────┴─────────────┘

  QUY TẮC NGÓN TAY:
  • < 1K phần tử, cần hover/click → SVG (Recharts)
  • 1K-50K, không cần tương tác nhiều → Canvas (D3)
  • 50K+, cần 60fps → WebGL (Three.js)
```

Dưới đây là checklist performance optimization chi tiết:

```
VISUALIZATION PERFORMANCE CHECKLIST:
═══════════════════════════════════════════════════════════════

  DATA PIPELINE:
  ┌─────────────────────────────────────────────────────────┐
  │                                                         │
  │  ① DATA REDUCTION (before rendering)                   │
  │  → Aggregate: 1M events → 1K buckets (time-based)     │
  │  → Sample: Show 10K of 100K points                     │
  │  → Level of Detail: Zoom-dependent aggregation         │
  │                                                         │
  │  ② EFFICIENT RENDERING                                  │
  │  → Canvas > SVG for > 5K elements                      │
  │  → WebGL > Canvas for > 100K elements                  │
  │  → InstancedMesh for repeated geometries               │
  │  → OffscreenCanvas for background rendering            │
  │                                                         │
  │  ③ UPDATE STRATEGY                                      │
  │  → RAF batching (≤ 60fps updates)                      │
  │  → Dirty rectangle rendering (partial updates)          │
  │  → Double buffering for smooth transitions             │
  │                                                         │
  │  ④ REACT OPTIMIZATION                                   │
  │  → useMemo: scales, projections, layouts               │
  │  → useCallback: event handlers                          │
  │  → React.memo: chart components                         │
  │  → Refs for animation state (skip re-renders)          │
  │                                                         │
  │  ⑤ DATA STRUCTURE                                       │
  │  → Spatial index (QuadTree) for hit testing            │
  │  → Ring Buffer for streaming data                      │
  │  → Typed arrays (Float32Array) for WebGL               │
  │                                                         │
  └─────────────────────────────────────────────────────────┘
```

### 12.1 QuadTree cho Spatial Queries

```typescript
// ═══════════════════════════════════════════════════
// QUADTREE — Efficient spatial search for Canvas
// ═══════════════════════════════════════════════════
// Linear scan O(N) → QuadTree O(log N) for hit testing

import * as d3 from "d3";

function useQuadTree<T extends { x: number; y: number }>(
  data: T[],
  xAccessor: (d: T) => number = (d) => d.x,
  yAccessor: (d: T) => number = (d) => d.y,
) {
  return useMemo(() => {
    return d3.quadtree<T>().x(xAccessor).y(yAccessor).addAll(data);
  }, [data, xAccessor, yAccessor]);
}

// Usage in Canvas hit test:
// const tree = useQuadTree(points, d => xScale(d.x), d => yScale(d.y));
// const nearest = tree.find(mouseX, mouseY, 20); // 20px radius
// if (nearest) onPointClick(nearest);
```

### 12.2 Web Worker cho Heavy Visualization Computation

```typescript
// ═══════════════════════════════════════════════════
// WEB WORKER — Offload heavy viz computation
// ═══════════════════════════════════════════════════

// worker-viz.ts
self.onmessage = (event: MessageEvent) => {
  const { type, payload } = event.data;

  switch (type) {
    case "AGGREGATE_THREATS": {
      // Group threats into time buckets
      const { threats, bucketSizeMs } = payload;
      const buckets = new Map<number, any>();

      for (const threat of threats) {
        const bucketKey =
          Math.floor(threat.timestamp / bucketSizeMs) * bucketSizeMs;
        const bucket = buckets.get(bucketKey) || {
          timestamp: bucketKey,
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
          total: 0,
        };
        bucket[threat.riskLevel]++;
        bucket.total++;
        buckets.set(bucketKey, bucket);
      }

      self.postMessage({
        type: "AGGREGATED_RESULT",
        payload: Array.from(buckets.values()).sort(
          (a, b) => a.timestamp - b.timestamp,
        ),
      });
      break;
    }

    case "CALCULATE_FORCE_LAYOUT": {
      // Run D3 force simulation in worker
      const { nodes, edges, iterations } = payload;
      // ... force simulation ...
      self.postMessage({
        type: "LAYOUT_RESULT",
        payload: { nodes, edges },
      });
      break;
    }
  }
};

// useVizWorker hook
function useVizWorker() {
  const workerRef = useRef<Worker | null>(null);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    workerRef.current = new Worker(
      new URL("./worker-viz.ts", import.meta.url),
      { type: "module" },
    );

    workerRef.current.onmessage = (event) => {
      setResult(event.data);
    };

    return () => workerRef.current?.terminate();
  }, []);

  const compute = useCallback((type: string, payload: any) => {
    workerRef.current?.postMessage({ type, payload });
  }, []);

  return { compute, result };
}
```

### 12.3 Interview Questions

```
SENIOR FRONTEND — THREAT VISUALIZATION & AI INTEGRATION:
═══════════════════════════════════════════════════════════════

Q1: How would you architect a real-time global threat map
    that displays 10K+ concurrent attack flows?

A:  Architecture layers:
    ① Data Pipeline: WebSocket → Ring Buffer → RAF batch
    ② Rendering: Canvas 2D (not SVG) cho performance
       → D3 geoNaturalEarth1 projection for coordinates
       → Quadratic bezier curves for attack arcs
       → requestAnimationFrame for "bullet" animation
    ③ Optimization:
       → Aggregate: cluster nearby attacks (QuadTree)
       → LoD: zoom out → country-level, zoom in → city-level
       → Canvas double-buffering: render to offscreen canvas,
         then copy to visible canvas (avoid flicker)
    ④ If 100K+: Switch to WebGL (Deck.gl hoặc Three.js globe)
       → InstancedMesh for points (single draw call)
       → GPU-based particle system for arcs

Q2: Explain how you would translate AI confidence scores
    into actionable UX for SOC analysts.

A:  3-Layer Progressive Disclosure:
    ① At-a-glance: Color-coded badge (🔴🟠🟡🟢⚪)
       → Instant visual triage without reading
    ② Hover/click: Risk label + SLA + recommended action
       → "High Risk — Investigate within 15 min"
    ③ Drill-down: SHAP waterfall chart
       → "WHY flagged: 35% payload entropy, 22% bytes/s"

    Key principles:
    → NEVER show raw numbers alone (0.73 means nothing)
    → Show uncertainty (±12% confidence interval)
    → Show FP rate ("At this threshold, 8% are false positives")
    → Configurable thresholds (SOC team can tune)
    → Auto-escalation rules tied to risk levels

Q3: When would you choose Canvas vs SVG vs WebGL for
    security data visualization?

A:  Decision matrix:
    ┌────────────┬───────────┬──────────┬──────────┐
    │ Criteria   │ SVG       │ Canvas   │ WebGL    │
    ├────────────┼───────────┼──────────┼──────────┤
    │ Elements   │ < 5K      │ 5K-100K  │ 100K+    │
    │ Interactiv.│ Easy DOM  │ Hit test │ Complex  │
    │ Animation  │ CSS/SMIL  │ RAF loop │ Shaders  │
    │ Text       │ Excellent │ Manual   │ SDF font │
    │ Zoom/Pan   │ CSS trans.│ Manual   │ Camera   │
    │ A11y       │ Built-in  │ Manual   │ N/A      │
    │ Memory     │ High      │ Medium   │ Low/GPU  │
    └────────────┴───────────┴──────────┴──────────┘

    Cụ thể cho cybersecurity:
    → Alert list (< 1K items): SVG (accessible, selectable)
    → Scatter plot (50K events): Canvas 2D
    → Network topology (5K nodes): Canvas + D3 force
    → Globe threat map (100K points): WebGL / Three.js
    → Hybrid: Canvas for data points, SVG overlay for axes/labels

Q4: How would you implement a force-directed network topology
    graph with 5K+ nodes?

A:  Performance-critical decisions:
    ① Renderer: Canvas (not SVG)
       → Single draw call per frame vs 5K DOM nodes
    ② Force simulation:
       → d3.forceSimulation with forces:
         charges (repulsion), links, center, collision
       → Custom forces for network segmentation
    ③ Interactions:
       → Zoom/Pan: d3.zoom → transform matrix
       → Node drag: update simulation alpha
       → Semantic zoom: different detail at zoom levels
    ④ Large scale (> 5K):
       → Web Worker for force simulation
       → Cluster nodes by network segment
       → Expand/collapse clusters
       → QuadTree for O(log N) hit testing
    ⑤ Visual encoding:
       → Shape by type (circle=server, diamond=firewall)
       → Color by status (green/yellow/red/gray)
       → Glow effect for compromised nodes
       → Dashed edges for suspicious traffic

Q5: How would you build a MITRE ATT&CK kill chain visualization?

A:  Component design:
    ① Data model: AttackVector with timeline of events
       → Each event mapped to MITRE tactic + technique
    ② Layout: Tactic stages on Y-axis, time on X-axis
       → d3.scaleBand for tactics, d3.scaleLinear for time
    ③ Visual elements:
       → Colored dots per tactic (14 unique colors)
       → Dashed connection lines between events
       → Glow effect on nodes (attention grabbing)
       → Time labels on X-axis
    ④ Interaction:
       → Click event → show evidence + technique details
       → Hover → tooltip with description
       → Zoom brush for time range selection
    ⑤ Alternative views:
       → Sankey diagram: Source → Tactic → Target flow
       → d3-sankey layout engine
       → Width = attack volume

Q6: How do you handle real-time data streaming in
    visualization dashboards?

A:  Pipeline architecture:
    ① Connection: WebSocket with auto-reconnect
       → Binary protocol (MessagePack) cho bandwidth
    ② Buffering: Ring Buffer (fixed-size, O(1) append)
       → 60-second window, overwrite oldest data
    ③ Batching: requestAnimationFrame callback
       → Process ALL accumulated events per frame (≤ 16ms)
       → Never re-render for individual events
    ④ State: useRef + manual forceRender
       → Avoid React re-render for every event
       → Only trigger React when user-visible state changes
    ⑤ Aggregation: Web Worker for heavy computation
       → Time-bucket aggregation
       → Anomaly score calculation
       → Running statistical calculations
    ⑥ Rendering strategy:
       → Dirty rectangle (only redraw changed regions)
       → Double buffering (render to offscreen, swap)
       → Throttled labels (update text 1x/second)

Q7: Describe the D3 + React integration pattern you
    recommend for production dashboards.

A:  "React renders, D3 calculates" pattern:
    ① D3: scales, layouts, projections, arc generators
       → All pure math, no DOM manipulation
    ② React: JSX rendering, event handling, state
       → <rect>, <circle>, <path> as React elements
    ③ Benefits:
       → React reconciliation works normally
       → DevTools debugging works
       → Server-side rendering possible
       → TypeScript type safety
    ④ Exception: Use useRef + D3 select when:
       → Force simulation (ongoing tick events)
       → Complex zoom transforms (d3.zoom)
       → Brush interactions (d3.brush)
    ⑤ Custom hook: useD3<SVGElement>(renderFn, deps)
       → Encapsulate D3 logic in hook
       → Return ref to attach to SVG/Canvas element

Q8: How would you implement efficient hit testing on a
    Canvas-based visualization with 50K points?

A:  Strategies (from simple → complex):
    ① Linear scan O(N): Fine for < 5K points
       → Calculate distance from mouse to every point
       → Return closest within threshold radius
    ② QuadTree O(log N): Recommended for 5K-100K
       → d3.quadtree().addAll(points)
       → tree.find(mouseX, mouseY, radius)
       → Search only nearby spatial partition
    ③ Color picking O(1): Fastest, any size
       → Render each point with UNIQUE color to offscreen
       → Read pixel at mouse position → get element ID
       → GPU-accelerated, works with arbitrary shapes
    ④ Spatial hashing:
       → Divide canvas into grid cells
       → Map points to cells
       → Only check points in mouse's cell + neighbors

Q9: How would you make AI model explanations accessible
    to non-technical network administrators?

A:  UX translation strategy:
    ① Language: Replace ML jargon with domain terms
       → "SHAP value +0.35" → "This feature STRONGLY
         increased the risk score"
       → "Feature importance" → "Why was this flagged?"
    ② Visual hierarchy:
       → Waterfall chart (SHAP) → most intuitive
       → Color: Red = increased risk, Green = decreased
       → Sort by absolute impact (biggest factor first)
    ③ Contextual help:
       → Tooltip on each feature: "Payload entropy measures
         randomness in data — high values suggest encrypted
         or obfuscated malicious payloads"
    ④ Comparisons:
       → "Normal range: 50-200 bytes/s. This: 15,000 bytes/s
         (75x above normal)"
    ⑤ Confidence communication:
       → Gauge/meter visualization (like speedometer)
       → Color gradient from green → red
       → Textual: "High confidence — 9 out of 10 similar
         patterns were confirmed threats"
    ⑥ Historical context:
       → "Similar alerts in the past 30 days: 23 confirmed,
         5 false positives (82% true positive rate)"

Q10: What are the key considerations when choosing between
     Recharts, D3.js, and Three.js for a cybersecurity dashboard?

A:  Decision framework:
    ① TEAM SKILL: Recharts if team doesn't know D3
       → Recharts: React-declarative, minimal learning curve
       → D3: Steep curve, but unlimited flexibility
       → Three.js: Requires 3D/WebGL expertise
    ② DATA SCALE:
       → Recharts: < 10K points (SVG-based)
       → D3 + Canvas: 10K-100K points
       → Three.js/WebGL: 100K+ points, 3D
    ③ CUSTOMIZATION:
       → Recharts: Limited to built-in chart types
       → D3: Anything 2D (custom layouts, projections)
       → Three.js: Full 3D scene control
    ④ SPECIFIC USE CASES:
       → Standard dashboard metrics: Recharts
       → Network topology: D3 (force simulation)
       → Global threat map: D3 geo (2D) or Three.js (3D)
       → Attack kill chain: D3 (custom layout)
       → Massive event stream: WebGL particles
    ⑤ HYBRID APPROACH (RECOMMENDED):
       → Recharts for standard charts (quick, consistent)
       → D3 for specialized security viz (topology, flow)
       → Three.js ONLY for 3D globe or particle systems
       → Share color palettes and design tokens across all
```

---

**Document Summary:**

| Section | Topic                         | Key Technologies                            |
| ------- | ----------------------------- | ------------------------------------------- |
| 1       | Overview & Library Comparison | Recharts, D3, Three.js, Deck.gl             |
| 2       | TypeScript Domain Models      | AI types, Threat types, MITRE ATT&CK        |
| 3       | Data Science Collaboration    | Workflow, Communication, Data Contracts     |
| 4       | AI Detection Visualization    | Canvas scatter plot, SHAP waterfall         |
| 5       | D3.js Fundamentals            | Scales, React+D3 hooks, Integration         |
| 6       | Global Threat Map             | D3 geo + Canvas, animated arcs, projections |
| 7       | Network Topology              | D3 force simulation, Canvas, zoom/clusters  |
| 8       | Attack Vectors                | Kill chain timeline, Sankey diagram, MITRE  |
| 9       | Recharts Production           | Area charts, ROC curve, Confusion Matrix    |
| 10      | AI Confidence → UX            | Risk translation, progressive disclosure    |
| 11      | WebGL / Three.js              | 3D globe, React Three Fiber, particles      |
| 12      | Performance & Interview       | QuadTree, Web Workers, 10 interview Q&As    |
