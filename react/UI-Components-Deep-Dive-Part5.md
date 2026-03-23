# UI Components Deep Dive — Phần 5: Portfolio Visualizer & Markdown Editor

> 📅 2026-03-09 · ⏱ 45 phút đọc
>
> Chủ đề: Tự viết từ đầu — Portfolio Visualizer & Markdown Editor
> Version: Vanilla JavaScript + React + Web Component
> Không thư viện! Viết tay 100%!

---

## Mục Lục

| #   | Component            | Vanilla JS | React | Advanced | Web Component |
| --- | -------------------- | ---------- | ----- | -------- | ------------- |
| 17  | Portfolio Visualizer | §17.1      | §17.2 | §17.3    | §17.4         |
| 18  | Markdown Editor      | §18.1      | §18.2 | §18.3    | §18.4         |

---

# 📊 Component 17: Portfolio Visualizer

## Kiến Trúc Portfolio Visualizer

```
PORTFOLIO VISUALIZER:
═══════════════════════════════════════════════════════════════

  ┌─────────────────────────────────────────────────┐
  │  Total: $125,000        Return: +15.3%          │
  ├─────────────────────────────────────────────────┤
  │                                                 │
  │    ╭───╮                                        │
  │    │   │  ╭───╮                                 │
  │    │   │  │   │  ╭───╮                          │  ← Bar chart
  │    │   │  │   │  │   │  ╭───╮  ╭───╮           │
  │    │VTI│  │VOO│  │BND│  │GLD│  │REI│           │
  │    │40%│  │25%│  │20%│  │10%│  │ 5%│           │
  │    └───┘  └───┘  └───┘  └───┘  └───┘           │
  │                                                 │
  ├─────────────────────────────────────────────────┤
  │       ╭────────────╮                            │
  │      ╱    VTI 40%   ╲                           │
  │     │   VOO 25%      │                          │  ← Donut chart
  │      ╲   BND 20%    ╱                           │
  │       ╰────────────╯                            │
  └─────────────────────────────────────────────────┘

  Data Model:
  holdings = [
    { symbol: "VTI", name: "Total Stock", allocation: 40, value: 50000, return: 12.5 },
    ...
  ]

  Key Concepts:
  • SVG/Canvas rendering (bar chart, donut chart!)
  • Color palette generation!
  • Responsive layout!
  • Tooltip on hover!
  • Animated transitions!
```

---

## §17.1 Portfolio Visualizer — Vanilla JavaScript

```css
.portfolio {
  max-width: 700px;
  font-family: system-ui;
}
.portfolio-header {
  display: flex;
  justify-content: space-between;
  padding: 16px;
  background: #1a1a2e;
  color: #e2e8f0;
  border-radius: 12px 12px 0 0;
}
.portfolio-header .total {
  font-size: 28px;
  font-weight: bold;
}
.portfolio-header .return {
  font-size: 20px;
}
.portfolio-header .return.positive {
  color: #48bb78;
}
.portfolio-header .return.negative {
  color: #fc8181;
}
.portfolio-charts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  padding: 20px;
  background: #f7fafc;
}
.portfolio-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 16px;
}
.portfolio-table th {
  text-align: left;
  padding: 8px;
  border-bottom: 2px solid #e2e8f0;
  font-size: 13px;
  color: #718096;
}
.portfolio-table td {
  padding: 8px;
  border-bottom: 1px solid #edf2f7;
  font-size: 14px;
}
.portfolio-table .symbol {
  font-weight: bold;
  color: #2d3748;
}
.portfolio-table .positive {
  color: #38a169;
}
.portfolio-table .negative {
  color: #e53e3e;
}
.bar-label {
  font-size: 11px;
  fill: #fff;
  text-anchor: middle;
}
```

```javascript
// ═══ Vanilla JS Portfolio Visualizer ═══

class PortfolioVisualizer {
  constructor(container, holdings = []) {
    this.container =
      typeof container === "string"
        ? document.querySelector(container)
        : container;
    this.holdings = holdings;
    this.colors = [
      "#3182ce",
      "#e53e3e",
      "#38a169",
      "#dd6b20",
      "#805ad5",
      "#d69e2e",
      "#319795",
      "#b83280",
      "#2b6cb0",
      "#c53030",
    ];
    this._render();
  }

  _render() {
    this.container.className = "portfolio";
    const total = this.holdings.reduce((s, h) => s + h.value, 0);
    const weightedReturn = this.holdings.reduce(
      (s, h) => s + (h.return * h.allocation) / 100,
      0,
    );

    this.container.innerHTML = `
      <div class="portfolio-header">
        <div>
          <div style="font-size:13px;color:#a0aec0">Tổng giá trị</div>
          <div class="total">$${total.toLocaleString()}</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:13px;color:#a0aec0">Lợi nhuận</div>
          <div class="return ${weightedReturn >= 0 ? "positive" : "negative"}">
            ${weightedReturn >= 0 ? "+" : ""}${weightedReturn.toFixed(1)}%
          </div>
        </div>
      </div>
      <div class="portfolio-charts">
        <div class="bar-chart-container"></div>
        <div class="donut-chart-container"></div>
      </div>
      <table class="portfolio-table">
        <thead><tr>
          <th>Symbol</th><th>Tên</th><th>Tỉ lệ</th><th>Giá trị</th><th>Lợi nhuận</th>
        </tr></thead>
        <tbody></tbody>
      </table>
    `;

    this._renderBarChart();
    this._renderDonutChart();
    this._renderTable();
  }

  _renderBarChart() {
    const container = this.container.querySelector(".bar-chart-container");
    const w = 300,
      h = 200,
      padding = 30;
    const maxAlloc = Math.max(...this.holdings.map((h) => h.allocation));

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    svg.setAttribute("width", "100%");

    const barW = (w - padding * 2) / this.holdings.length - 8;
    this.holdings.forEach((holding, i) => {
      const barH = (holding.allocation / maxAlloc) * (h - padding * 2);
      const x = padding + i * (barW + 8);
      const y = h - padding - barH;

      // Bar:
      const rect = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "rect",
      );
      rect.setAttribute("x", x);
      rect.setAttribute("y", h - padding);
      rect.setAttribute("width", barW);
      rect.setAttribute("height", 0);
      rect.setAttribute("fill", this.colors[i % this.colors.length]);
      rect.setAttribute("rx", 4);
      svg.appendChild(rect);

      // Animate bar growth:
      setTimeout(
        () => {
          rect.setAttribute("y", y);
          rect.setAttribute("height", barH);
          rect.style.transition = "y 0.5s ease, height 0.5s ease";
        },
        50 + i * 100,
      );

      // Label:
      const text = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text",
      );
      text.setAttribute("x", x + barW / 2);
      text.setAttribute("y", h - padding + 16);
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("font-size", "11");
      text.setAttribute("fill", "#718096");
      text.textContent = holding.symbol;
      svg.appendChild(text);

      // Value on top:
      const valText = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text",
      );
      valText.setAttribute("x", x + barW / 2);
      valText.setAttribute("y", y - 5);
      valText.setAttribute("text-anchor", "middle");
      valText.setAttribute("font-size", "11");
      valText.setAttribute("fill", "#2d3748");
      valText.setAttribute("font-weight", "bold");
      valText.textContent = `${holding.allocation}%`;
      svg.appendChild(valText);
    });

    container.appendChild(svg);
  }

  _renderDonutChart() {
    const container = this.container.querySelector(".donut-chart-container");
    const size = 200,
      cx = 100,
      cy = 100,
      r = 70,
      strokeW = 30;
    const circumference = 2 * Math.PI * r;

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", `0 0 ${size} ${size}`);
    svg.setAttribute("width", "100%");

    // Background circle:
    const bgCircle = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle",
    );
    bgCircle.setAttribute("cx", cx);
    bgCircle.setAttribute("cy", cy);
    bgCircle.setAttribute("r", r);
    bgCircle.setAttribute("fill", "none");
    bgCircle.setAttribute("stroke", "#e2e8f0");
    bgCircle.setAttribute("stroke-width", strokeW);
    svg.appendChild(bgCircle);

    let offset = 0;
    this.holdings.forEach((holding, i) => {
      const segLen = (holding.allocation / 100) * circumference;
      const circle = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "circle",
      );
      circle.setAttribute("cx", cx);
      circle.setAttribute("cy", cy);
      circle.setAttribute("r", r);
      circle.setAttribute("fill", "none");
      circle.setAttribute("stroke", this.colors[i % this.colors.length]);
      circle.setAttribute("stroke-width", strokeW);
      circle.setAttribute(
        "stroke-dasharray",
        `${segLen} ${circumference - segLen}`,
      );
      circle.setAttribute("stroke-dashoffset", `${-offset}`);
      circle.setAttribute("transform", `rotate(-90 ${cx} ${cy})`);
      circle.style.cursor = "pointer";

      // Tooltip on hover:
      circle.addEventListener("mouseenter", () => {
        circle.setAttribute("stroke-width", strokeW + 6);
        this._showTooltip(
          container,
          `${holding.symbol}: ${holding.allocation}%`,
        );
      });
      circle.addEventListener("mouseleave", () => {
        circle.setAttribute("stroke-width", strokeW);
        this._hideTooltip(container);
      });

      svg.appendChild(circle);
      offset += segLen;
    });

    // Center text:
    const centerText = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text",
    );
    centerText.setAttribute("x", cx);
    centerText.setAttribute("y", cy + 5);
    centerText.setAttribute("text-anchor", "middle");
    centerText.setAttribute("font-size", "16");
    centerText.setAttribute("fill", "#2d3748");
    centerText.setAttribute("font-weight", "bold");
    centerText.textContent = `${this.holdings.length} assets`;
    svg.appendChild(centerText);

    container.appendChild(svg);
  }

  _showTooltip(container, text) {
    let tip = container.querySelector(".chart-tooltip");
    if (!tip) {
      tip = document.createElement("div");
      tip.className = "chart-tooltip";
      tip.style.cssText =
        "position:absolute;background:#1a1a2e;color:#fff;padding:6px 12px;border-radius:6px;font-size:13px;pointer-events:none;z-index:10;";
      container.style.position = "relative";
      container.appendChild(tip);
    }
    tip.textContent = text;
    tip.style.display = "block";
  }

  _hideTooltip(container) {
    const tip = container.querySelector(".chart-tooltip");
    if (tip) tip.style.display = "none";
  }

  _renderTable() {
    const tbody = this.container.querySelector("tbody");
    this.holdings.forEach((h, i) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="symbol">
          <span style="display:inline-block;width:10px;height:10px;border-radius:50%;
            background:${this.colors[i]};margin-right:6px"></span>${h.symbol}
        </td>
        <td>${h.name}</td>
        <td>${h.allocation}%</td>
        <td>$${h.value.toLocaleString()}</td>
        <td class="${h.return >= 0 ? "positive" : "negative"}">
          ${h.return >= 0 ? "+" : ""}${h.return.toFixed(1)}%
        </td>
      `;
      tbody.appendChild(tr);
    });
  }
}

// Usage:
const portfolio = new PortfolioVisualizer("#portfolio", [
  {
    symbol: "VTI",
    name: "Total Stock Market",
    allocation: 40,
    value: 50000,
    return: 12.5,
  },
  {
    symbol: "VOO",
    name: "S&P 500",
    allocation: 25,
    value: 31250,
    return: 18.2,
  },
  {
    symbol: "BND",
    name: "Total Bond",
    allocation: 20,
    value: 25000,
    return: -2.1,
  },
  { symbol: "GLD", name: "Gold", allocation: 10, value: 12500, return: 8.7 },
  {
    symbol: "REIT",
    name: "Real Estate",
    allocation: 5,
    value: 6250,
    return: 5.3,
  },
]);
```

### 📖 RADIO Walkthrough — Portfolio Visualizer

> **R — Requirements:** Hiển thị portfolio với bar chart (allocation), donut chart (tỉ lệ), bảng chi tiết, tooltip, animated transitions.

> **A — Architecture:** Class `PortfolioVisualizer` render 3 phần: header (tổng giá trị + lợi nhuận), charts (SVG bar + donut), table. Data = array of holdings.

> **I — Implementation:**

**SVG Donut Chart — `stroke-dasharray` segments:**

```
Chu vi = 2πr = 2 × 3.14 × 70 = 439.6
VTI 40% → segLen = 0.4 × 439.6 = 175.8
dasharray = "175.8 263.8"  ← vẽ 175.8, bỏ 263.8!
offset tăng dần cho mỗi segment → xếp cạnh nhau!
```

Mỗi segment là 1 `<circle>` riêng với `stroke-dasharray` khác nhau. `stroke-dashoffset` đẩy điểm bắt đầu → các segment nối tiếp!

**Bar chart animation:** Set `height=0` ban đầu, rồi `setTimeout` set height thật + CSS transition → bars mọc lên từ từ!

**`toLocaleString()` cho format tiền:** `50000.toLocaleString()` → `"50,000"` (thêm dấu phẩy tự động theo locale).

---

## §17.2 Portfolio Visualizer — React

```javascript
import { useState, useMemo } from "react";

function PortfolioVisualizer({ holdings }) {
  const [hovered, setHovered] = useState(null);

  const total = useMemo(
    () => holdings.reduce((s, h) => s + h.value, 0),
    [holdings],
  );
  const weightedReturn = useMemo(
    () => holdings.reduce((s, h) => s + (h.return * h.allocation) / 100, 0),
    [holdings],
  );
  const colors = [
    "#3182ce",
    "#e53e3e",
    "#38a169",
    "#dd6b20",
    "#805ad5",
    "#d69e2e",
    "#319795",
    "#b83280",
  ];

  const maxAlloc = Math.max(...holdings.map((h) => h.allocation));
  const r = 70,
    circumference = 2 * Math.PI * r;

  let donutOffset = 0;
  const donutSegments = holdings.map((h, i) => {
    const segLen = (h.allocation / 100) * circumference;
    const seg = { ...h, segLen, offset: donutOffset, color: colors[i] };
    donutOffset += segLen;
    return seg;
  });

  return (
    <div className="portfolio">
      <div className="portfolio-header">
        <div>
          <div style={{ fontSize: 13, color: "#a0aec0" }}>Tổng giá trị</div>
          <div className="total">${total.toLocaleString()}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 13, color: "#a0aec0" }}>Lợi nhuận</div>
          <div
            className={`return ${weightedReturn >= 0 ? "positive" : "negative"}`}
          >
            {weightedReturn >= 0 ? "+" : ""}
            {weightedReturn.toFixed(1)}%
          </div>
        </div>
      </div>

      <div className="portfolio-charts">
        {/* Bar Chart */}
        <svg viewBox="0 0 300 200" style={{ width: "100%" }}>
          {holdings.map((h, i) => {
            const barW = 40,
              barH = (h.allocation / maxAlloc) * 140;
            const x = 30 + i * (barW + 8),
              y = 170 - barH;
            return (
              <g key={h.symbol}>
                <rect
                  x={x}
                  y={y}
                  width={barW}
                  height={barH}
                  fill={colors[i]}
                  rx={4}
                  style={{ transition: "height 0.5s, y 0.5s" }}
                />
                <text
                  x={x + barW / 2}
                  y={186}
                  textAnchor="middle"
                  fontSize={11}
                  fill="#718096"
                >
                  {h.symbol}
                </text>
                <text
                  x={x + barW / 2}
                  y={y - 5}
                  textAnchor="middle"
                  fontSize={11}
                  fill="#2d3748"
                  fontWeight="bold"
                >
                  {h.allocation}%
                </text>
              </g>
            );
          })}
        </svg>

        {/* Donut Chart */}
        <svg viewBox="0 0 200 200" style={{ width: "100%" }}>
          <circle
            cx={100}
            cy={100}
            r={r}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={30}
          />
          {donutSegments.map((seg, i) => (
            <circle
              key={seg.symbol}
              cx={100}
              cy={100}
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={hovered === i ? 36 : 30}
              strokeDasharray={`${seg.segLen} ${circumference - seg.segLen}`}
              strokeDashoffset={-seg.offset}
              transform="rotate(-90 100 100)"
              style={{ transition: "stroke-width 0.2s", cursor: "pointer" }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            />
          ))}
          <text
            x={100}
            y={105}
            textAnchor="middle"
            fontSize={14}
            fill="#2d3748"
            fontWeight="bold"
          >
            {hovered !== null
              ? `${holdings[hovered].symbol} ${holdings[hovered].allocation}%`
              : `${holdings.length} assets`}
          </text>
        </svg>
      </div>

      <table className="portfolio-table">
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Tên</th>
            <th>Tỉ lệ</th>
            <th>Giá trị</th>
            <th>Lợi nhuận</th>
          </tr>
        </thead>
        <tbody>
          {holdings.map((h, i) => (
            <tr key={h.symbol}>
              <td className="symbol">
                <span
                  style={{
                    display: "inline-block",
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: colors[i],
                    marginRight: 6,
                  }}
                />
                {h.symbol}
              </td>
              <td>{h.name}</td>
              <td>{h.allocation}%</td>
              <td>${h.value.toLocaleString()}</td>
              <td className={h.return >= 0 ? "positive" : "negative"}>
                {h.return >= 0 ? "+" : ""}
                {h.return.toFixed(1)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### §17.3 Advanced Patterns — Portfolio Visualizer

```javascript
// ═══ PATTERN 1: Rebalance calculator ═══
function useRebalancer(holdings, targetTotal) {
  return useMemo(() => {
    return holdings.map((h) => ({
      ...h,
      targetValue: (h.allocation / 100) * targetTotal,
      diff: (h.allocation / 100) * targetTotal - h.value,
    }));
  }, [holdings, targetTotal]);
}

// ═══ PATTERN 2: Historical performance line chart ═══
function SparkLine({ data, width = 200, height = 40, color = "#3182ce" }) {
  const min = Math.min(...data),
    max = Math.max(...data);
  const range = max - min || 1;
  const points = data
    .map(
      (v, i) =>
        `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * height}`,
    )
    .join(" ");

  return (
    <svg width={width} height={height}>
      <polyline points={points} fill="none" stroke={color} strokeWidth={1.5} />
    </svg>
  );
}
```

---

## §17.4 Portfolio Visualizer — Web Component

```javascript
class MyPortfolio extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._data = [];
  }
  set holdings(v) {
    this._data = v;
    this._render();
  }
  connectedCallback() {
    this._render();
  }

  _render() {
    const h = this._data;
    if (!h.length) return;
    const total = h.reduce((s, x) => s + x.value, 0);
    const colors = ["#3182ce", "#e53e3e", "#38a169", "#dd6b20", "#805ad5"];
    const maxA = Math.max(...h.map((x) => x.allocation));
    const r = 70,
      C = 2 * Math.PI * r;

    let donut = "",
      offset = 0;
    h.forEach((x, i) => {
      const seg = (x.allocation / 100) * C;
      donut += `<circle cx="100" cy="100" r="${r}" fill="none"
        stroke="${colors[i]}" stroke-width="30"
        stroke-dasharray="${seg} ${C - seg}" stroke-dashoffset="${-offset}"
        transform="rotate(-90 100 100)"/>`;
      offset += seg;
    });

    let bars = "";
    h.forEach((x, i) => {
      const bw = 40,
        bh = (x.allocation / maxA) * 140;
      const bx = 30 + i * 48,
        by = 170 - bh;
      bars += `<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="${colors[i]}" rx="4"/>
        <text x="${bx + 20}" y="186" text-anchor="middle" font-size="11" fill="#718096">${x.symbol}</text>`;
    });

    let rows = h
      .map(
        (x, i) => `<tr>
      <td><span style="display:inline-block;width:10px;height:10px;border-radius:50%;
        background:${colors[i]};margin-right:6px"></span>${x.symbol}</td>
      <td>${x.name}</td><td>${x.allocation}%</td>
      <td>$${x.value.toLocaleString()}</td>
      <td style="color:${x.return >= 0 ? "#38a169" : "#e53e3e"}">${x.return >= 0 ? "+" : ""}${x.return.toFixed(1)}%</td>
    </tr>`,
      )
      .join("");

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; max-width: 700px; font-family: system-ui; }
        .hd { display: flex; justify-content: space-between; padding: 16px;
              background: #1a1a2e; color: #e2e8f0; border-radius: 12px 12px 0 0; }
        .charts { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; padding: 20px; }
        table { width: 100%; border-collapse: collapse; }
        th { text-align: left; padding: 8px; border-bottom: 2px solid #e2e8f0; font-size: 13px; color: #718096; }
        td { padding: 8px; border-bottom: 1px solid #edf2f7; font-size: 14px; }
      </style>
      <div class="hd">
        <div><div style="font-size:13px;color:#a0aec0">Tổng</div><div style="font-size:28px;font-weight:bold">$${total.toLocaleString()}</div></div>
      </div>
      <div class="charts">
        <svg viewBox="0 0 300 200" width="100%">${bars}</svg>
        <svg viewBox="0 0 200 200" width="100%">
          <circle cx="100" cy="100" r="${r}" fill="none" stroke="#e2e8f0" stroke-width="30"/>
          ${donut}
        </svg>
      </div>
      <table><thead><tr><th>Symbol</th><th>Tên</th><th>%</th><th>Giá trị</th><th>Return</th></tr></thead>
      <tbody>${rows}</tbody></table>
    `;
  }
}
customElements.define("my-portfolio", MyPortfolio);
```

---

# ✏️ Component 18: Markdown Editor

## Kiến Trúc Markdown Editor

````
MARKDOWN EDITOR:
═══════════════════════════════════════════════════════════════

  ┌─────────────────────────────────────────────────┐
  │ B │ I │ H1│ H2│ 🔗│ 📋│ 📷│ `` │ ── │         │  ← Toolbar
  ├──────────────────┬──────────────────────────────┤
  │                  │                              │
  │  # Hello World   │  Hello World                 │
  │                  │  ───────────                  │
  │  This is **bold**│  This is bold                │  ← Side-by-side
  │  and *italic*    │  and italic                   │     Edit + Preview
  │                  │                              │
  │  - Item 1        │  • Item 1                    │
  │  - Item 2        │  • Item 2                    │
  │                  │                              │
  │  ```js           │  ┌──────────────┐            │
  │  const x = 1;    │  │ const x = 1; │            │
  │  ```             │  └──────────────┘            │
  │                  │                              │
  └──────────────────┴──────────────────────────────┘

  Parser: Markdown → HTML
  Regex patterns cho: headings, bold, italic, links, images,
  code blocks, lists, blockquotes, horizontal rules

  Key Concepts:
  • Markdown parser (regex-based!)
  • Live preview (real-time!)
  • Toolbar actions (wrap selection!)
  • Keyboard shortcuts (Ctrl+B = bold!)
  • LocalStorage auto-save!
````

---

## §18.1 Markdown Editor — Vanilla JavaScript

```css
.md-editor {
  max-width: 900px;
  font-family: system-ui;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
}
.md-toolbar {
  display: flex;
  gap: 4px;
  padding: 8px;
  background: #f7fafc;
  border-bottom: 1px solid #e2e8f0;
  flex-wrap: wrap;
}
.md-toolbar button {
  padding: 6px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  font-size: 14px;
}
.md-toolbar button:hover {
  background: #edf2f7;
}
.md-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  min-height: 400px;
}
.md-input {
  width: 100%;
  height: 100%;
  border: none;
  resize: none;
  padding: 16px;
  font-family: "Menlo", monospace;
  font-size: 14px;
  line-height: 1.6;
  outline: none;
  box-sizing: border-box;
  border-right: 1px solid #e2e8f0;
}
.md-preview {
  padding: 16px;
  overflow-y: auto;
  line-height: 1.6;
  font-size: 14px;
}
.md-preview h1 {
  font-size: 28px;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 8px;
}
.md-preview h2 {
  font-size: 22px;
  border-bottom: 1px solid #edf2f7;
  padding-bottom: 6px;
}
.md-preview h3 {
  font-size: 18px;
}
.md-preview code {
  background: #f7fafc;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: "Menlo", monospace;
  font-size: 13px;
}
.md-preview pre {
  background: #1a1a2e;
  color: #e2e8f0;
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
}
.md-preview pre code {
  background: none;
  padding: 0;
  color: inherit;
}
.md-preview blockquote {
  border-left: 4px solid #3182ce;
  padding: 8px 16px;
  margin: 8px 0;
  background: #ebf8ff;
  color: #2b6cb0;
}
.md-preview img {
  max-width: 100%;
  border-radius: 8px;
}
.md-preview a {
  color: #3182ce;
}
.md-preview hr {
  border: none;
  border-top: 2px solid #e2e8f0;
  margin: 16px 0;
}
.md-preview ul,
.md-preview ol {
  padding-left: 24px;
}
.md-preview table {
  border-collapse: collapse;
  width: 100%;
}
.md-preview th,
.md-preview td {
  border: 1px solid #e2e8f0;
  padding: 8px;
}
.md-preview th {
  background: #f7fafc;
}
```

````javascript
// ═══ Vanilla JS Markdown Editor ═══

class MarkdownEditor {
  constructor(container, options = {}) {
    this.container =
      typeof container === "string"
        ? document.querySelector(container)
        : container;
    this.autosaveKey = options.autosaveKey || "md-editor-content";
    this.onChange = options.onChange || (() => {});
    this._render();
    this._loadSaved();
  }

  _render() {
    this.container.className = "md-editor";
    this.container.innerHTML = `
      <div class="md-toolbar">
        <button data-action="bold" title="Bold (Ctrl+B)"><b>B</b></button>
        <button data-action="italic" title="Italic (Ctrl+I)"><i>I</i></button>
        <button data-action="h1" title="Heading 1">H1</button>
        <button data-action="h2" title="Heading 2">H2</button>
        <button data-action="h3" title="Heading 3">H3</button>
        <button data-action="link" title="Link">🔗</button>
        <button data-action="image" title="Image">📷</button>
        <button data-action="code" title="Inline code">\`\`</button>
        <button data-action="codeblock" title="Code block">{ }</button>
        <button data-action="quote" title="Blockquote">❝</button>
        <button data-action="ul" title="Unordered list">• list</button>
        <button data-action="ol" title="Ordered list">1. list</button>
        <button data-action="hr" title="Horizontal rule">──</button>
      </div>
      <div class="md-body">
        <textarea class="md-input" placeholder="Viết markdown ở đây..."></textarea>
        <div class="md-preview"></div>
      </div>
    `;

    this.textarea = this.container.querySelector(".md-input");
    this.preview = this.container.querySelector(".md-preview");

    // Live preview:
    this.textarea.addEventListener("input", () => {
      this._updatePreview();
      this._autosave();
    });

    // Toolbar:
    this.container
      .querySelector(".md-toolbar")
      .addEventListener("click", (e) => {
        const btn = e.target.closest("button");
        if (!btn) return;
        this._toolbarAction(btn.dataset.action);
      });

    // Keyboard shortcuts:
    this.textarea.addEventListener("keydown", (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "b") {
          e.preventDefault();
          this._toolbarAction("bold");
        }
        if (e.key === "i") {
          e.preventDefault();
          this._toolbarAction("italic");
        }
        if (e.key === "k") {
          e.preventDefault();
          this._toolbarAction("link");
        }
      }
      // Tab = indent:
      if (e.key === "Tab") {
        e.preventDefault();
        this._insertAtCursor("  ");
      }
    });
  }

  // ═══ MARKDOWN PARSER ═══
  _parseMarkdown(md) {
    let html = md;

    // Code blocks (``` ... ```) — PHẢI parse TRƯỚC inline code!
    html = html.replace(
      /```(\w*)\n([\s\S]*?)```/g,
      (_, lang, code) =>
        `<pre><code class="lang-${lang}">${this._escapeHtml(code.trim())}</code></pre>`,
    );

    // Inline code (`...`):
    html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

    // Headings:
    html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
    html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
    html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");

    // Bold + Italic:
    html = html.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
    html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");

    // Images (trước links vì cú pháp tương tự!):
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');
    // Links:
    html = html.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank">$1</a>',
    );

    // Blockquotes:
    html = html.replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>");

    // Horizontal rules:
    html = html.replace(/^(-{3,}|_{3,}|\*{3,})$/gm, "<hr>");

    // Unordered lists:
    html = html.replace(/^[*-] (.+)$/gm, "<li>$1</li>");
    html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, "<ul>$1</ul>");

    // Ordered lists:
    html = html.replace(/^\d+\. (.+)$/gm, "<li>$1</li>");

    // Paragraphs (text không nằm trong tag nào):
    html = html.replace(/^(?!<[a-z])((?!<\/?\w).+)$/gm, "<p>$1</p>");

    // Line breaks:
    html = html.replace(/\n/g, "");

    return html;
  }

  _escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  _updatePreview() {
    this.preview.innerHTML = this._parseMarkdown(this.textarea.value);
    this.onChange(this.textarea.value);
  }

  _toolbarAction(action) {
    const ta = this.textarea;
    const start = ta.selectionStart,
      end = ta.selectionEnd;
    const selected = ta.value.substring(start, end);

    const wrappers = {
      bold: { before: "**", after: "**", placeholder: "bold text" },
      italic: { before: "*", after: "*", placeholder: "italic text" },
      code: { before: "`", after: "`", placeholder: "code" },
      link: { before: "[", after: "](url)", placeholder: "link text" },
      image: { before: "![", after: "](url)", placeholder: "alt text" },
      h1: { before: "# ", after: "", placeholder: "Heading 1", line: true },
      h2: { before: "## ", after: "", placeholder: "Heading 2", line: true },
      h3: { before: "### ", after: "", placeholder: "Heading 3", line: true },
      quote: { before: "> ", after: "", placeholder: "quote", line: true },
      ul: { before: "- ", after: "", placeholder: "list item", line: true },
      ol: { before: "1. ", after: "", placeholder: "list item", line: true },
      hr: { before: "\n---\n", after: "", placeholder: "" },
      codeblock: { before: "```\n", after: "\n```", placeholder: "code here" },
    };

    const w = wrappers[action];
    if (!w) return;

    const text = selected || w.placeholder;
    const newText = w.before + text + w.after;

    ta.setRangeText(newText, start, end, "select");
    ta.focus();
    this._updatePreview();
  }

  _insertAtCursor(text) {
    const ta = this.textarea;
    const start = ta.selectionStart;
    ta.setRangeText(text, start, start, "end");
    this._updatePreview();
  }

  _autosave() {
    clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => {
      localStorage.setItem(this.autosaveKey, this.textarea.value);
    }, 500);
  }

  _loadSaved() {
    const saved = localStorage.getItem(this.autosaveKey);
    if (saved) {
      this.textarea.value = saved;
      this._updatePreview();
    }
  }

  getValue() {
    return this.textarea.value;
  }
  setValue(md) {
    this.textarea.value = md;
    this._updatePreview();
  }
}

// Usage:
const editor = new MarkdownEditor("#editor", {
  autosaveKey: "my-notes",
  onChange: (md) => console.log("Changed:", md.length, "chars"),
});
````

### 📖 RADIO Walkthrough — Markdown Editor

> **R — Requirements:** Split-view editor: trái = markdown input, phải = HTML preview. Toolbar buttons, keyboard shortcuts (Ctrl+B/I/K), autosave localStorage.

> **A — Architecture:** `MarkdownEditor` class: textarea → `_parseMarkdown()` (regex pipeline) → innerHTML preview. Toolbar wraps selection with markdown syntax.

> **I — Implementation:**

**Markdown Parser — thứ tự regex RẤT QUAN TRỌNG!**

````
1. Code blocks (```) — TRƯỚC TIÊN! Nội dung bên trong KHÔNG bị parse tiếp!
2. Inline code (`...`) — tương tự, escape nội dung!
3. Headings (# ## ###) — parse dòng dài (###) trước dòng ngắn (#)!
4. Bold+Italic (*** > ** > *) — greedy: parse dài nhất trước!
5. Images (!) trước Links ([]) — vì cú pháp gần giống!
6. Blockquotes, lists, paragraphs — cuối cùng!
````

Nếu sai thứ tự: `**bold**` bên trong code block sẽ bị parse thành `<strong>` → **SAI!**

**`setRangeText()` — thay thế selection:**

```javascript
ta.setRangeText(newText, start, end, "select");
```

API gốc của `<textarea>` cho phép thay thế text từ `start` đến `end`. `'select'` = giữ selection sau khi thay → user thấy text vừa chèn được highlight!

**Autosave — debounced localStorage:** Save sau 500ms không gõ (debounce). Load khi khởi tạo. Tránh save mỗi keystroke (tốn I/O).

---

## §18.2 Markdown Editor — React

````javascript
import { useState, useCallback, useRef, useEffect } from "react";

function useMarkdown(initialValue = "") {
  const [markdown, setMarkdown] = useState(initialValue);

  const parse = useCallback((md) => {
    let html = md;
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
      const escaped = code.trim().replace(/</g, "&lt;").replace(/>/g, "&gt;");
      return `<pre><code>${escaped}</code></pre>`;
    });
    html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
    html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
    html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
    html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");
    html = html.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
    html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    html = html.replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>");
    html = html.replace(/^(-{3,})$/gm, "<hr>");
    html = html.replace(/^[*-] (.+)$/gm, "<li>$1</li>");
    html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, "<ul>$1</ul>");
    return html;
  }, []);

  return { markdown, setMarkdown, html: parse(markdown) };
}

function MarkdownEditor({ autosaveKey = "md-editor" }) {
  const saved = localStorage.getItem(autosaveKey) || "";
  const { markdown, setMarkdown, html } = useMarkdown(saved);
  const textareaRef = useRef(null);

  // Autosave:
  useEffect(() => {
    const timer = setTimeout(
      () => localStorage.setItem(autosaveKey, markdown),
      500,
    );
    return () => clearTimeout(timer);
  }, [markdown, autosaveKey]);

  const wrapSelection = useCallback(
    (before, after, placeholder) => {
      const ta = textareaRef.current;
      if (!ta) return;
      const start = ta.selectionStart,
        end = ta.selectionEnd;
      const selected = markdown.substring(start, end) || placeholder;
      const newText =
        markdown.substring(0, start) +
        before +
        selected +
        after +
        markdown.substring(end);
      setMarkdown(newText);
      setTimeout(() => {
        ta.focus();
        ta.setSelectionRange(
          start + before.length,
          start + before.length + selected.length,
        );
      }, 0);
    },
    [markdown, setMarkdown],
  );

  const handleKeyDown = useCallback(
    (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "b") {
          e.preventDefault();
          wrapSelection("**", "**", "bold");
        }
        if (e.key === "i") {
          e.preventDefault();
          wrapSelection("*", "*", "italic");
        }
        if (e.key === "k") {
          e.preventDefault();
          wrapSelection("[", "](url)", "link");
        }
      }
    },
    [wrapSelection],
  );

  return (
    <div className="md-editor">
      <div className="md-toolbar">
        <button onClick={() => wrapSelection("**", "**", "bold")}>
          <b>B</b>
        </button>
        <button onClick={() => wrapSelection("*", "*", "italic")}>
          <i>I</i>
        </button>
        <button onClick={() => wrapSelection("# ", "", "Heading")}>H1</button>
        <button onClick={() => wrapSelection("[", "](url)", "link")}>🔗</button>
        <button onClick={() => wrapSelection("`", "`", "code")}>``</button>
        <button onClick={() => wrapSelection("```\n", "\n```", "code")}>
          {"{ }"}
        </button>
      </div>
      <div className="md-body">
        <textarea
          ref={textareaRef}
          className="md-input"
          value={markdown}
          onChange={(e) => setMarkdown(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Viết markdown ở đây..."
        />
        <div
          className="md-preview"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  );
}
````

### §18.3 Advanced Patterns — Markdown Editor

```javascript
// ═══ PATTERN 1: Sync scroll (editor + preview scroll cùng tốc độ!) ═══
function useSyncScroll(editorRef, previewRef) {
  useEffect(() => {
    const editor = editorRef.current,
      preview = previewRef.current;
    if (!editor || !preview) return;

    const syncScroll = (source, target) => {
      const ratio =
        source.scrollTop / (source.scrollHeight - source.clientHeight);
      target.scrollTop = ratio * (target.scrollHeight - target.clientHeight);
    };

    const onEditorScroll = () => syncScroll(editor, preview);
    const onPreviewScroll = () => syncScroll(preview, editor);

    editor.addEventListener("scroll", onEditorScroll);
    preview.addEventListener("scroll", onPreviewScroll);
    return () => {
      editor.removeEventListener("scroll", onEditorScroll);
      preview.removeEventListener("scroll", onPreviewScroll);
    };
  }, [editorRef, previewRef]);
}

// ═══ PATTERN 2: Word count + reading time ═══
function useWordCount(text) {
  return useMemo(() => {
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    return { words, chars: text.length, readTime: Math.ceil(words / 200) };
  }, [text]);
}

// ═══ PATTERN 3: Export to HTML file ═══
function useExportHtml(html, title = "Document") {
  return useCallback(() => {
    const fullHtml = `<!DOCTYPE html><html><head><title>${title}</title>
      <style>body{max-width:700px;margin:40px auto;font-family:system-ui;line-height:1.6;padding:0 20px}</style>
      </head><body>${html}</body></html>`;
    const blob = new Blob([fullHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }, [html, title]);
}
```

---

## §18.4 Markdown Editor — Web Component

````javascript
class MyMarkdownEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }
  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; max-width: 900px; font-family: system-ui; }
        .editor { border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
        .toolbar { display: flex; gap: 4px; padding: 8px; background: #f7fafc;
                   border-bottom: 1px solid #e2e8f0; }
        .toolbar button { padding: 6px 10px; border: 1px solid #e2e8f0; border-radius: 6px;
                          background: #fff; cursor: pointer; }
        .body { display: grid; grid-template-columns: 1fr 1fr; min-height: 400px; }
        textarea { border: none; resize: none; padding: 16px; font-family: monospace;
                   font-size: 14px; line-height: 1.6; outline: none;
                   border-right: 1px solid #e2e8f0; }
        .preview { padding: 16px; overflow-y: auto; line-height: 1.6; }
        .preview h1 { font-size: 28px; border-bottom: 2px solid #e2e8f0; }
        .preview h2 { font-size: 22px; }
        .preview code { background: #f7fafc; padding: 2px 6px; border-radius: 4px; }
        .preview pre { background: #1a1a2e; color: #e2e8f0; padding: 16px; border-radius: 8px; }
        .preview blockquote { border-left: 4px solid #3182ce; padding: 8px 16px; background: #ebf8ff; }
      </style>
      <div class="editor">
        <div class="toolbar">
          <button data-a="b"><b>B</b></button>
          <button data-a="i"><i>I</i></button>
          <button data-a="h1">H1</button>
          <button data-a="link">🔗</button>
          <button data-a="code">\`\`</button>
        </div>
        <div class="body">
          <textarea placeholder="Viết markdown..."></textarea>
          <div class="preview"></div>
        </div>
      </div>
    `;

    const ta = this.shadowRoot.querySelector("textarea");
    const preview = this.shadowRoot.querySelector(".preview");

    ta.addEventListener("input", () => {
      preview.innerHTML = this._parse(ta.value);
    });

    this.shadowRoot.querySelector(".toolbar").addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;
      const wraps = {
        b: ["**", "**", "bold"],
        i: ["*", "*", "italic"],
        h1: ["# ", "", "Heading"],
        link: ["[", "](url)", "link"],
        code: ["`", "`", "code"],
      };
      const w = wraps[btn.dataset.a];
      if (!w) return;
      const s = ta.selectionStart,
        e2 = ta.selectionEnd;
      const sel = ta.value.substring(s, e2) || w[2];
      ta.setRangeText(w[0] + sel + w[1], s, e2, "select");
      preview.innerHTML = this._parse(ta.value);
    });
  }

  _parse(md) {
    let h = md;
    h = h.replace(
      /```(\w*)\n([\s\S]*?)```/g,
      (_, l, c) => `<pre><code>${c.trim().replace(/</g, "&lt;")}</code></pre>`,
    );
    h = h.replace(/`([^`]+)`/g, "<code>$1</code>");
    h = h.replace(/^### (.+)$/gm, "<h3>$1</h3>");
    h = h.replace(/^## (.+)$/gm, "<h2>$1</h2>");
    h = h.replace(/^# (.+)$/gm, "<h1>$1</h1>");
    h = h.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    h = h.replace(/\*(.+?)\*/g, "<em>$1</em>");
    h = h.replace(
      /!\[([^\]]*)\]\(([^)]+)\)/g,
      '<img src="$2" alt="$1" style="max-width:100%">',
    );
    h = h.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    h = h.replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>");
    h = h.replace(/^(-{3,})$/gm, "<hr>");
    h = h.replace(/^[*-] (.+)$/gm, "<li>$1</li>");
    h = h.replace(/((?:<li>.*<\/li>\n?)+)/g, "<ul>$1</ul>");
    return h;
  }
}
customElements.define("my-markdown-editor", MyMarkdownEditor);
````

```html
<my-markdown-editor></my-markdown-editor>
```
