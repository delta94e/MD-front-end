/**
 * ExperimentationDemo.tsx
 *
 * A/B Experimentation Platform
 *
 * CONTEXT
 *   Led experimentation across product and growth teams — designed test hypotheses,
 *   implemented flag-driven variants via LaunchDarkly, collaborated with data analytics
 *   team to instrument metrics, ran statistical analysis, and presented findings to
 *   stakeholders (product, design, engineering, leadership).
 *
 * TABS
 *   🧪 Experiments    — list of all A/B tests with status, lift, significance
 *   📊 Analysis       — deep-dive: funnel, time series, CI bars, segments
 *   📈 Program Health — overall win rate, cumulative lift, velocity
 *   📋 Methodology    — hypothesis framework, power analysis, SRM check, code patterns
 */

import React, { useState, useMemo } from "react";

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

type ExpStatus = "running" | "winner" | "loser" | "inconclusive";

interface Experiment {
  id:              string;
  name:            string;
  hypothesis:      string;
  team:            string;
  status:          ExpStatus;
  startDate:       string;
  endDate?:        string;
  primaryMetric:   string;
  controlRate:     number;
  treatmentRate:   number;
  lift:            number;
  pValue:          number;
  sampleControl:   number;
  sampleTreatment: number;
  targetSample:    number;
  ciLow:           number;
  ciHigh:          number;
  segments:        { label: string; lift: number; sig: boolean }[];
  funnel:          { step: string; control: number; treatment: number }[];
  dailyPValue:     number[];
  tags:            string[];
}

// ─────────────────────────────────────────────────────────────────
// Mock data — realistic experiment results
// ─────────────────────────────────────────────────────────────────

const EXPERIMENTS: Experiment[] = [
  {
    id: "exp-001",
    name: "Checkout CTA Colour — Green vs Blue",
    hypothesis: "Changing the primary CTA from brand-blue (#6366f1) to high-contrast green (#16a34a) will increase purchase conversion by reducing visual competition with the page background.",
    team: "Growth",
    status: "winner",
    startDate: "2024-09-02", endDate: "2024-09-16",
    primaryMetric: "Purchase conversion rate",
    controlRate: 0.032, treatmentRate: 0.03466,
    lift: 8.3,
    pValue: 0.023,
    sampleControl: 48392, sampleTreatment: 47811, targetSample: 45000,
    ciLow: 2.1, ciHigh: 14.6,
    segments: [
      { label: "Mobile",   lift: 12.1, sig: true  },
      { label: "Desktop",  lift:  3.2, sig: false },
      { label: "New users",lift: 10.8, sig: true  },
      { label: "Returning",lift:  5.4, sig: false },
    ],
    funnel: [
      { step: "Impression",  control: 100,  treatment: 100 },
      { step: "PDP view",    control: 62.3, treatment: 63.1 },
      { step: "Add to cart", control: 22.1, treatment: 23.4 },
      { step: "Checkout",    control:  8.5, treatment:  9.1 },
      { step: "Purchase",    control:  3.2, treatment:  3.47 },
    ],
    dailyPValue: [0.48, 0.42, 0.39, 0.35, 0.30, 0.27, 0.22, 0.18, 0.14, 0.09, 0.06, 0.04, 0.023, 0.023],
    tags: ["checkout", "cta", "growth", "mobile"],
  },
  {
    id: "exp-002",
    name: "Onboarding Flow — 3-step vs 5-step",
    hypothesis: "Reducing onboarding from 5 steps to 3 will decrease drop-off during signup by eliminating optional profile fields, improving completion rate by ≥15%.",
    team: "Activation",
    status: "winner",
    startDate: "2024-10-01", endDate: "2024-10-21",
    primaryMetric: "Onboarding completion rate",
    controlRate: 0.61, treatmentRate: 0.751,
    lift: 23.1,
    pValue: 0.001,
    sampleControl: 12881, sampleTreatment: 12644, targetSample: 10000,
    ciLow: 17.4, ciHigh: 28.8,
    segments: [
      { label: "Mobile",   lift: 28.4, sig: true },
      { label: "Desktop",  lift: 17.2, sig: true },
      { label: "Email signup", lift: 25.1, sig: true },
      { label: "Social signup",lift: 19.4, sig: true },
    ],
    funnel: [
      { step: "Start",           control: 100,  treatment: 100  },
      { step: "Step 1 complete", control:  91,  treatment:  95  },
      { step: "Step 2 complete", control:  80,  treatment:  89  },
      { step: "Step 3 complete", control:  72,  treatment:  82  },
      { step: "Fully complete",  control:  61,  treatment:  75.1 },
    ],
    dailyPValue: [0.45, 0.38, 0.29, 0.20, 0.12, 0.07, 0.03, 0.01, 0.001, 0.001, 0.001, 0.001, 0.001, 0.001, 0.001, 0.001, 0.001, 0.001, 0.001, 0.001],
    tags: ["onboarding", "activation", "signup"],
  },
  {
    id: "exp-003",
    name: "Pricing Page — Monthly-first vs Annual-first",
    hypothesis: "Displaying annual pricing as the default (highlighted) option will increase annual plan upgrades by anchoring users on the discounted annual price first.",
    team: "Monetisation",
    status: "winner",
    startDate: "2024-10-28", endDate: "2024-11-11",
    primaryMetric: "Annual plan selection rate",
    controlRate: 0.38, treatmentRate: 0.426,
    lift: 12.1,
    pValue: 0.031,
    sampleControl: 9842, sampleTreatment: 9711, targetSample: 8000,
    ciLow: 4.2, ciHigh: 20.3,
    segments: [
      { label: "Freemium",    lift: 15.8, sig: true  },
      { label: "Trial users", lift:  9.4, sig: true  },
      { label: "Mobile",      lift:  6.1, sig: false },
      { label: "Desktop",     lift: 16.3, sig: true  },
    ],
    funnel: [
      { step: "Pricing page",     control: 100,  treatment: 100 },
      { step: "Plan selected",    control:  74,  treatment:  78 },
      { step: "Annual selected",  control:  38,  treatment:  42.6 },
      { step: "Payment started",  control:  29,  treatment:  33 },
      { step: "Converted",        control:  22,  treatment:  25 },
    ],
    dailyPValue: [0.44, 0.40, 0.36, 0.31, 0.26, 0.20, 0.16, 0.11, 0.07, 0.047, 0.036, 0.031, 0.031, 0.031],
    tags: ["pricing", "monetisation", "annual"],
  },
  {
    id: "exp-004",
    name: "AI Search Autocomplete",
    hypothesis: "Adding AI-powered semantic suggestions to the search bar will increase search success rate (clicks a result within 30s) by reducing zero-result searches.",
    team: "Search",
    status: "running",
    startDate: "2024-11-04",
    primaryMetric: "Search success rate",
    controlRate: 0.712, treatmentRate: 0.741,
    lift: 4.1,
    pValue: 0.14,
    sampleControl: 28441, sampleTreatment: 28102, targetSample: 60000,
    ciLow: -1.3, ciHigh: 9.8,
    segments: [
      { label: "Power users",  lift: 7.2, sig: false },
      { label: "Casual users", lift: 1.8, sig: false },
      { label: "Mobile",       lift: 5.1, sig: false },
      { label: "Desktop",      lift: 3.2, sig: false },
    ],
    funnel: [
      { step: "Search query",    control: 100,  treatment: 100 },
      { step: "Autocomplete shown", control: 0, treatment: 88 },
      { step: "Autocomplete used",  control: 0, treatment: 34 },
      { step: "Result clicked",  control:  71.2, treatment: 74.1 },
      { step: "Task complete",   control:  58.4, treatment: 61.2 },
    ],
    dailyPValue: [0.48, 0.45, 0.42, 0.38, 0.33, 0.28, 0.22, 0.18],
    tags: ["search", "ai", "ux"],
  },
  {
    id: "exp-005",
    name: "Homepage Hero — Video vs Static",
    hypothesis: "An autoplaying ambient hero video will increase engagement and demonstrate product value better than a static image, leading to higher demo requests.",
    team: "Marketing",
    status: "loser",
    startDate: "2024-08-05", endDate: "2024-08-19",
    primaryMetric: "Demo request rate",
    controlRate: 0.051, treatmentRate: 0.0499,
    lift: -2.1,
    pValue: 0.048,
    sampleControl: 31222, sampleTreatment: 30988, targetSample: 28000,
    ciLow: -4.1, ciHigh: -0.2,
    segments: [
      { label: "Mobile",     lift: -8.4, sig: true  },
      { label: "Desktop",    lift: +1.2, sig: false },
      { label: "Fast connection",  lift:  0.8, sig: false },
      { label: "Slow connection",  lift: -12.1, sig: true },
    ],
    funnel: [
      { step: "Homepage",       control: 100, treatment: 100  },
      { step: ">10s engaged",   control:  42, treatment:  38  },
      { step: "Clicked CTA",    control:  9.4, treatment:  8.8 },
      { step: "Demo form",      control:  6.8, treatment:  6.5 },
      { step: "Demo requested", control:  5.1, treatment:  4.99 },
    ],
    dailyPValue: [0.45, 0.41, 0.38, 0.35, 0.29, 0.22, 0.17, 0.11, 0.07, 0.052, 0.048, 0.048, 0.048, 0.048],
    tags: ["homepage", "video", "marketing", "loser"],
  },
  {
    id: "exp-006",
    name: "Email Reminder Timing — 10am vs 2pm",
    hypothesis: "Sending re-engagement emails at 2pm (post-lunch) rather than 10am will improve open rates as users are more likely to check email during an afternoon lull.",
    team: "CRM",
    status: "inconclusive",
    startDate: "2024-10-15", endDate: "2024-10-29",
    primaryMetric: "Email open rate",
    controlRate: 0.224, treatmentRate: 0.231,
    lift: 3.1,
    pValue: 0.21,
    sampleControl: 18200, sampleTreatment: 18098, targetSample: 18000,
    ciLow: -2.4, ciHigh: 8.8,
    segments: [
      { label: "B2B users",   lift: 5.8, sig: false },
      { label: "B2C users",   lift: 1.2, sig: false },
      { label: "Mobile",      lift: 4.4, sig: false },
      { label: "Desktop",     lift: 1.8, sig: false },
    ],
    funnel: [
      { step: "Sent",     control: 100,  treatment: 100 },
      { step: "Delivered",control:  97.4, treatment: 97.6 },
      { step: "Opened",   control:  22.4, treatment: 23.1 },
      { step: "Clicked",  control:   8.1, treatment:  8.6 },
    ],
    dailyPValue: [0.48, 0.44, 0.40, 0.38, 0.35, 0.31, 0.28, 0.26, 0.24, 0.22, 0.21, 0.21, 0.21, 0.21],
    tags: ["email", "crm", "timing"],
  },
];

// ─────────────────────────────────────────────────────────────────
// Config maps
// ─────────────────────────────────────────────────────────────────

const STATUS_CFG: Record<ExpStatus, { color: string; bg: string; icon: string; label: string }> = {
  running:      { color: "#60a5fa", bg: "#1e3a5f", icon: "▶", label: "Running" },
  winner:       { color: "#4ade80", bg: "#052e16", icon: "✓", label: "Winner" },
  loser:        { color: "#ef4444", bg: "#450a0a", icon: "✕", label: "Loser" },
  inconclusive: { color: "#94a3b8", bg: "#1e293b", icon: "—", label: "Inconclusive" },
};

const SIG_THRESHOLD = 0.05;

// ─────────────────────────────────────────────────────────────────
// Small SVG charts
// ─────────────────────────────────────────────────────────────────

/** p-value time series — shows significance line and p-value converging */
function PValueChart({ data, width = 200, height = 60 }: { data: number[]; width?: number; height?: number }) {
  const padT = 6; const padB = 12;
  const inner = height - padT - padB;
  const maxP = 0.5;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = padT + ((maxP - Math.min(v, maxP)) / maxP) * inner;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  const sigY = (padT + ((maxP - SIG_THRESHOLD) / maxP) * inner).toFixed(1);
  const lastP = data[data.length - 1];
  const lastX = width;
  const lastY = (padT + ((maxP - Math.min(lastP, maxP)) / maxP) * inner).toFixed(1);
  const lineColor = lastP < SIG_THRESHOLD ? "#4ade80" : lastP < 0.15 ? "#fbbf24" : "#6366f1";
  return (
    <svg width={width} height={height} style={{ display: "block", overflow: "visible" }}>
      {/* significance threshold line */}
      <line x1={0} y1={sigY} x2={width} y2={sigY} stroke="#ef4444" strokeWidth={1} strokeDasharray="4,3" opacity={0.6} />
      <text x={width + 2} y={Number(sigY) + 3} fontSize={7} fill="#ef4444" opacity={0.8}>p=0.05</text>
      {/* p-value curve */}
      <polyline points={points} fill="none" stroke={lineColor} strokeWidth={2} strokeLinecap="round" />
      {/* terminal dot */}
      <circle cx={lastX} cy={lastY} r={3} fill={lineColor} />
      {/* day labels */}
      <text x={0}  y={height} fontSize={7} fill="#475569">day 1</text>
      <text x={width - 22} y={height} fontSize={7} fill="#475569">{`day ${data.length}`}</text>
    </svg>
  );
}

/** Confidence interval bar — horizontal */
function CIBar({ ciLow, ciHigh, lift, width = 260 }: { ciLow: number; ciHigh: number; lift: number; width?: number }) {
  const domain = 30;
  const center = width / 2;
  const scale = (v: number) => center + (v / domain) * (width / 2);
  const x1 = Math.max(0, scale(ciLow));
  const x2 = Math.min(width, scale(ciHigh));
  const dotX = Math.max(4, Math.min(width - 4, scale(lift)));
  const isPositive = ciLow > 0;
  const isNegative = ciHigh < 0;
  const color = isPositive ? "#4ade80" : isNegative ? "#ef4444" : "#94a3b8";
  return (
    <svg width={width} height={28} style={{ display: "block", overflow: "visible" }}>
      {/* zero line */}
      <line x1={center} y1={2} x2={center} y2={22} stroke="#334155" strokeWidth={1} />
      {/* CI band */}
      <rect x={x1} y={8} width={x2 - x1} height={8} rx={3} fill={color} opacity={0.25} />
      <line x1={x1} y1={10} x2={x1} y2={22} stroke={color} strokeWidth={1.5} />
      <line x1={x2} y1={10} x2={x2} y2={22} stroke={color} strokeWidth={1.5} />
      <line x1={x1} y1={12} x2={x2} y2={12} stroke={color} strokeWidth={2} />
      {/* lift dot */}
      <circle cx={dotX} cy={12} r={4} fill={color} />
      {/* labels */}
      <text x={x1} y={26} fontSize={7} fill={color} textAnchor="middle">{ciLow > 0 ? "+" : ""}{ciLow.toFixed(1)}%</text>
      <text x={x2} y={26} fontSize={7} fill={color} textAnchor="middle">{ciHigh > 0 ? "+" : ""}{ciHigh.toFixed(1)}%</text>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────
// Funnel visualisation
// ─────────────────────────────────────────────────────────────────

function FunnelChart({ funnel }: { funnel: Experiment["funnel"] }) {
  const maxVal = funnel[0].control;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {funnel.map((f, i) => {
        const cPct = (f.control / maxVal) * 100;
        const tPct = (f.treatment / maxVal) * 100;
        const delta = f.treatment - f.control;
        return (
          <div key={f.step}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>
              <span style={{ fontWeight: 600 }}>{f.step}</span>
              <span style={{ color: delta > 0 ? "#4ade80" : delta < 0 ? "#ef4444" : "#94a3b8", fontWeight: 700 }}>
                {delta > 0 ? "+" : ""}{delta.toFixed(1)}pp
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 9, color: "#6366f1", width: 54, textAlign: "right" }}>control</span>
                <div style={{ flex: 1, height: 10, background: "#0f172a", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ width: `${cPct}%`, height: "100%", background: "#6366f1", borderRadius: 3, transition: "width 0.4s ease" }} />
                </div>
                <span style={{ fontSize: 10, color: "#6366f1", width: 40, fontFamily: "monospace" }}>{f.control}%</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 9, color: "#4ade80", width: 54, textAlign: "right" }}>treatment</span>
                <div style={{ flex: 1, height: 10, background: "#0f172a", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ width: `${tPct}%`, height: "100%", background: "#4ade80", borderRadius: 3, transition: "width 0.4s ease" }} />
                </div>
                <span style={{ fontSize: 10, color: "#4ade80", width: 40, fontFamily: "monospace" }}>{f.treatment}%</span>
              </div>
            </div>
            {i < funnel.length - 1 && <div style={{ borderTop: "1px dashed #1e293b", marginTop: 10 }} />}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Methodology code snippets
// ─────────────────────────────────────────────────────────────────

const METHODOLOGY_SECTIONS = [
  {
    id: "hypothesis", icon: "🔬", title: "Hypothesis Framework (HEART)",
    desc: "Every experiment starts with a structured hypothesis using the HEART framework to tie the change to a measurable user outcome.",
    code: `// Experiment hypothesis template — written before any code:
interface ExperimentHypothesis {
  // HEART framework: Happiness, Engagement, Adoption, Retention, Task success
  signal:       string;  // What behaviour are we measuring?
  metric:       string;  // What is the primary metric? (countable, timely)
  change:       string;  // What will we change and why?
  expectation:  string;  // We expect [metric] to [increase/decrease] by [X%]
  assumption:   string;  // We assume [user belief] based on [evidence]
}

// Real example (exp-001):
const ctaColourHypothesis: ExperimentHypothesis = {
  signal:      "Purchase conversion rate (unique buyers / unique visitors)",
  metric:      "Purchase CVR — measured per session, primary metric",
  change:      "Change CTA background from #6366f1 (indigo) to #16a34a (green)",
  expectation: "We expect purchase CVR to increase by ≥5% within 14 days",
  assumption:  "We assume indigo CTA blends with the nav bar; green creates contrast",
};

// Guardrail metrics (must NOT regress):
const guardrails = [
  "Cart abandonment rate: must not increase >2%",
  "Average order value: must not decrease >1%",
  "Page load time: must not increase >100ms",
];`,
  },
  {
    id: "samplesize", icon: "🔢", title: "Sample Size & Power Analysis",
    desc: "Running tests too long wastes time; stopping too early leads to false positives. Power analysis ensures tests are adequately sized from day 1.",
    code: `// Power analysis — calculates required sample size before running
// Using two-proportion z-test

function calculateSampleSize({
  baselineRate,      // current conversion rate (control)
  minimumDetectableEffect, // smallest lift we care about (e.g., 0.05 = 5%)
  alpha = 0.05,      // Type I error rate (false positive) — 5%
  power = 0.80,      // 1 - Type II error rate (false negative) — 80% power
}: SampleSizeParams): number {
  const p1 = baselineRate;
  const p2 = baselineRate * (1 + minimumDetectableEffect);

  // Z-scores for alpha/2 and beta
  const zAlpha = 1.96;   // for alpha = 0.05 (two-tailed)
  const zBeta  = 0.842;  // for power = 0.80

  const pBar = (p1 + p2) / 2;

  const numerator   = Math.pow(zAlpha * Math.sqrt(2 * pBar * (1 - pBar)) +
                               zBeta  * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2)), 2);
  const denominator = Math.pow(p2 - p1, 2);

  return Math.ceil(numerator / denominator); // per variant
}

// exp-001:
calculateSampleSize({
  baselineRate: 0.032,            // 3.2% purchase CVR
  minimumDetectableEffect: 0.05,  // detect ≥5% relative lift
  alpha: 0.05, power: 0.80,
});
// → 44,720 users per variant (ran for 14 days to reach n=48k)`,
  },
  {
    id: "significance", icon: "📐", title: "Statistical Significance & p-value",
    desc: "Two-proportion z-test compares control and treatment conversion rates to compute p-value and confidence intervals.",
    code: `// Two-proportion z-test implementation
function computeSignificance(
  nControl:   number, xControl:   number,  // sample size, conversions
  nTreatment: number, xTreatment: number,
  alpha = 0.05
): StatResult {
  const p1 = xControl   / nControl;
  const p2 = xTreatment / nTreatment;
  const pPool = (xControl + xTreatment) / (nControl + nTreatment);

  const se     = Math.sqrt(pPool * (1 - pPool) * (1/nControl + 1/nTreatment));
  const zScore = (p2 - p1) / se;
  const pValue = 2 * (1 - normalCDF(Math.abs(zScore)));  // two-tailed

  // 95% CI for the difference
  const seDiff = Math.sqrt(p1*(1-p1)/nControl + p2*(1-p2)/nTreatment);
  const z95    = 1.96;
  const ciLow  = (p2 - p1 - z95 * seDiff) / p1;  // relative to baseline
  const ciHigh = (p2 - p1 + z95 * seDiff) / p1;

  return {
    lift:          (p2 - p1) / p1,
    pValue,
    isSignificant: pValue < alpha,
    confidenceInterval: [ciLow, ciHigh],
    zScore,
  };
}

// exp-001 result:
// p1=0.032, p2=0.03466, n≈48k each
// → z=2.28, p=0.023, 95%CI=[+2.1%,+14.6%] ✅ Significant`,
  },
  {
    id: "srm", icon: "⚖", title: "SRM Check (Sample Ratio Mismatch)",
    desc: "Before analysing results, always verify the traffic split matches the intended ratio. SRM indicates a bug in randomisation or logging.",
    code: `// SRM (Sample Ratio Mismatch) check — runs automatically before analysis
// Uses chi-squared test on actual vs expected traffic split

function checkSRM(
  nControl:   number,
  nTreatment: number,
  expectedRatio = 0.5  // 50/50 split expected
): SRMResult {
  const total    = nControl + nTreatment;
  const expected = { control: total * expectedRatio, treatment: total * (1 - expectedRatio) };
  const actual   = { control: nControl, treatment: nTreatment };

  // Chi-squared statistic
  const chi2 = Object.keys(actual).reduce((sum, key) => {
    const e = expected[key as keyof typeof expected];
    const o = actual[key as keyof typeof actual];
    return sum + Math.pow(o - e, 2) / e;
  }, 0);

  // Degrees of freedom = 1, chi2 threshold for p<0.01: 6.635
  const hasSRM = chi2 > 6.635;
  const pValue = 1 - chiSquaredCDF(chi2, 1);

  if (hasSRM) {
    console.warn(
      \`SRM detected! Expected \${expected.control.toFixed(0)} control,\` +
      \`got \${nControl} (deviation: \${((nControl/total - expectedRatio)*100).toFixed(1)}%)\`
    );
    // Block analysis — results unreliable
  }
  return { hasSRM, chi2, pValue };
}

// exp-001: control=48392, treatment=47811, ratio=50.27% vs 49.73%
// chi2=3.44, p=0.064 → No SRM, analysis proceeds ✅`,
  },
  {
    id: "presentation", icon: "📊", title: "Presenting Results to Stakeholders",
    desc: "Analytics results presented as structured executive summaries — 1-pager with recommendation, evidence, and next steps.",
    code: `// Experiment results one-pager template:
/*
 ┌─────────────────────────────────────────────────────────────┐
 │ EXPERIMENT: Checkout CTA Colour — Green vs Blue             │
 │ Team: Growth · Duration: 14 days · Decision: SHIP GREEN     │
 ├─────────────────────────────────────────────────────────────┤
 │ HYPOTHESIS                                                  │
 │   Green CTA increases purchase CVR by reducing visual       │
 │   competition with the indigo navigation bar.               │
 │                                                             │
 │ RESULT  ✅ STATISTICALLY SIGNIFICANT (p=0.023)              │
 │   Purchase CVR:    3.20% → 3.47%  (+8.3% lift)            │
 │   95% CI:          +2.1% to +14.6%                         │
 │   Revenue impact:  +$43k/month (extrapolated at current MRR)│
 │                                                             │
 │ KEY INSIGHTS                                                │
 │   • Mobile: +12.1% lift (primary driver — 68% of traffic)  │
 │   • Desktop: +3.2% (not sig. — low priority)               │
 │   • Effect driven by add-to-cart → checkout step           │
 │                                                             │
 │ RECOMMENDATION                                              │
 │   Ship to 100%. Update design token --color-cta to #16a34a.│
 │   Monitor for 30 days: revenue, AOV, return rate.          │
 │                                                             │
 │ NEXT EXPERIMENTS                                            │
 │   1. CTA copy test: "Buy now" vs "Add to bag"              │
 │   2. Checkout page form: 1-page vs 2-step                  │
 └─────────────────────────────────────────────────────────────┘
*/

// Automated result summary generated by analytics pipeline:
function generateExecSummary(exp: ExperimentResult): string {
  const decision = exp.isSignificant
    ? exp.lift > 0 ? "SHIP TREATMENT" : "SHIP CONTROL"
    : "GATHER MORE DATA";

  return \`
    Decision: \${decision}
    Lift:     \${exp.lift > 0 ? "+" : ""}\${(exp.lift * 100).toFixed(1)}%
    p-value:  \${exp.pValue.toFixed(3)} (\${exp.isSignificant ? "significant" : "not significant"})
    95% CI:   [\${(exp.ciLow*100).toFixed(1)}%, \${(exp.ciHigh*100).toFixed(1)}%]
    Sample:   \${exp.nControl.toLocaleString()} control / \${exp.nTreatment.toLocaleString()} treatment
  \`.trim();
}`,
  },
];

// ─────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────

export function ExperimentationDemo() {
  const [activeTab, setActiveTab] = useState<"experiments" | "analysis" | "health" | "methodology">("experiments");
  const [selectedId, setSelectedId]   = useState<string>("exp-001");
  const [methodId, setMethodId]       = useState("hypothesis");
  const [statusFilter, setStatusFilter] = useState<ExpStatus | "all">("all");

  const selected = EXPERIMENTS.find(e => e.id === selectedId)!;
  const activeMeth = METHODOLOGY_SECTIONS.find(s => s.id === methodId)!;

  const filtered = useMemo(() =>
    EXPERIMENTS.filter(e => statusFilter === "all" || e.status === statusFilter),
    [statusFilter]
  );

  // Program health metrics
  const completed = EXPERIMENTS.filter(e => e.status !== "running");
  const winners   = EXPERIMENTS.filter(e => e.status === "winner");
  const winRate   = completed.length ? (winners.length / completed.length * 100).toFixed(0) : "0";
  const avgLift   = winners.length
    ? (winners.reduce((s, e) => s + e.lift, 0) / winners.length).toFixed(1)
    : "0";

  return (
    <div style={{ background: "#0f172a", color: "#f1f5f9", fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100vh", padding: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 28 }}>🧪</span>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>A/B Experimentation Platform</h1>
            <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
              Led experimentation · Statistical analysis · Analytics collaboration · Stakeholder presentation
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["LaunchDarkly flags", "Two-proportion z-test", "Power analysis", "SRM check", "HEART framework", "Executive summaries", "Segment analysis"].map(t => (
            <span key={t} style={{ background: "#1e293b", color: "#94a3b8", border: "1px solid #334155", borderRadius: 20, padding: "3px 10px", fontSize: 11 }}>{t}</span>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid #1e293b", paddingBottom: 4 }}>
        {[
          { id: "experiments" as const, label: "🧪 Experiments" },
          { id: "analysis"    as const, label: "📊 Analysis" },
          { id: "health"      as const, label: "📈 Program Health" },
          { id: "methodology" as const, label: "📋 Methodology" },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            background: activeTab === tab.id ? "#1e293b" : "transparent",
            color: activeTab === tab.id ? "#f1f5f9" : "#64748b",
            border: activeTab === tab.id ? "1px solid #334155" : "1px solid transparent",
            borderRadius: "8px 8px 0 0", padding: "8px 18px",
            cursor: "pointer", fontSize: 13, fontWeight: 600,
          }}>{tab.label}</button>
        ))}
      </div>

      {/* ── EXPERIMENTS ── */}
      {activeTab === "experiments" && (
        <div>
          {/* Summary pills */}
          <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
            {[
              { label: "Total", value: String(EXPERIMENTS.length), color: "#818cf8" },
              { label: "Running", value: String(EXPERIMENTS.filter(e => e.status === "running").length), color: "#60a5fa" },
              { label: "Winners", value: String(winners.length), color: "#4ade80" },
              { label: "Losers",  value: String(EXPERIMENTS.filter(e => e.status === "loser").length), color: "#ef4444" },
              { label: "Win rate", value: `${winRate}%`, color: "#fbbf24" },
            ].map(s => (
              <div key={s.label} style={{ background: "#1e293b", border: `1px solid ${s.color}20`, borderRadius: 8, padding: "8px 14px" }}>
                <div style={{ fontSize: 9, color: "#64748b" }}>{s.label}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</div>
              </div>
            ))}

            {/* Status filter */}
            <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
              {(["all", "running", "winner", "loser", "inconclusive"] as const).map(f => (
                <button key={f} onClick={() => setStatusFilter(f)} style={{
                  background: statusFilter === f ? "#1e293b" : "transparent",
                  border: `1px solid ${statusFilter === f ? "#6366f1" : "#334155"}`,
                  borderRadius: 6, padding: "4px 10px",
                  color: statusFilter === f ? "#f1f5f9" : "#64748b",
                  cursor: "pointer", fontSize: 11,
                }}>{f}</button>
              ))}
            </div>
          </div>

          {/* Experiment cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map(exp => {
              const sc = STATUS_CFG[exp.status];
              const progress = Math.min(100, ((exp.sampleControl + exp.sampleTreatment) / (exp.targetSample * 2)) * 100);
              return (
                <div
                  key={exp.id}
                  onClick={() => { setSelectedId(exp.id); setActiveTab("analysis"); }}
                  style={{
                    background: "#1e293b", border: `1px solid ${selectedId === exp.id ? "#6366f1" : "#334155"}`,
                    borderRadius: 10, padding: 16, cursor: "pointer", transition: "all 0.15s",
                  }}
                >
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>{exp.name}</span>
                        <span style={{ background: sc.bg, color: sc.color, fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 4, border: `1px solid ${sc.color}40` }}>
                          {sc.icon} {sc.label}
                        </span>
                        <span style={{ fontSize: 9, color: "#64748b" }}>{exp.team}</span>
                      </div>
                      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8, lineHeight: 1.5 }}>{exp.hypothesis.slice(0, 120)}…</div>

                      {/* Key metrics row */}
                      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center" }}>
                        <div>
                          <div style={{ fontSize: 9, color: "#64748b" }}>Lift</div>
                          <div style={{ fontSize: 16, fontWeight: 800, color: exp.lift > 0 ? "#4ade80" : exp.lift < 0 ? "#ef4444" : "#94a3b8" }}>
                            {exp.lift > 0 ? "+" : ""}{exp.lift}%
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 9, color: "#64748b" }}>p-value</div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: exp.pValue < SIG_THRESHOLD ? "#4ade80" : "#94a3b8" }}>
                            {exp.pValue.toFixed(3)}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 9, color: "#64748b" }}>Sample (n each)</div>
                          <div style={{ fontSize: 12, color: "#94a3b8" }}>{exp.sampleControl.toLocaleString()}</div>
                        </div>
                        <div style={{ flex: 1, minWidth: 100 }}>
                          <div style={{ fontSize: 9, color: "#64748b", marginBottom: 4 }}>Sample progress</div>
                          <div style={{ height: 5, background: "#0f172a", borderRadius: 3, overflow: "hidden" }}>
                            <div style={{ width: `${progress}%`, height: "100%", background: progress >= 100 ? "#4ade80" : "#6366f1", borderRadius: 3 }} />
                          </div>
                          <div style={{ fontSize: 9, color: "#64748b", marginTop: 2 }}>{progress.toFixed(0)}% of target</div>
                        </div>
                        <div style={{ flexShrink: 0 }}>
                          <PValueChart data={exp.dailyPValue} width={120} height={44} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── ANALYSIS ── */}
      {activeTab === "analysis" && (
        <div>
          {/* Experiment selector */}
          <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
            {EXPERIMENTS.map(e => {
              const sc = STATUS_CFG[e.status];
              return (
                <button key={e.id} onClick={() => setSelectedId(e.id)} style={{
                  background: selectedId === e.id ? sc.color + "20" : "#1e293b",
                  border: `1px solid ${selectedId === e.id ? sc.color : "#334155"}`,
                  borderRadius: 6, padding: "4px 10px",
                  color: selectedId === e.id ? sc.color : "#64748b",
                  cursor: "pointer", fontSize: 11, fontWeight: 600,
                }}>{sc.icon} {e.name.split("—")[0].trim()}</button>
              );
            })}
          </div>

          {/* Analysis content */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            {/* Left: summary */}
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 16 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>{selected.name}</span>
                <span style={{ background: STATUS_CFG[selected.status].bg, color: STATUS_CFG[selected.status].color, fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 4 }}>
                  {STATUS_CFG[selected.status].icon} {STATUS_CFG[selected.status].label}
                </span>
              </div>

              <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.6, marginBottom: 12 }}>{selected.hypothesis}</div>

              {/* Stats grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
                {[
                  { label: "Primary metric", value: selected.primaryMetric, small: true },
                  { label: "Control rate",   value: `${(selected.controlRate * 100).toFixed(2)}%` },
                  { label: "Treatment rate", value: `${(selected.treatmentRate * 100).toFixed(2)}%` },
                  { label: "Relative lift",  value: `${selected.lift > 0 ? "+" : ""}${selected.lift}%`, color: selected.lift > 0 ? "#4ade80" : "#ef4444" },
                  { label: "p-value",        value: selected.pValue.toFixed(3), color: selected.pValue < 0.05 ? "#4ade80" : "#94a3b8" },
                  { label: "n (per arm)",    value: selected.sampleControl.toLocaleString() },
                ].map(s => (
                  <div key={s.label} style={{ background: "#0f172a", borderRadius: 6, padding: "8px 10px" }}>
                    <div style={{ fontSize: 9, color: "#64748b", marginBottom: 1 }}>{s.label}</div>
                    <div style={{ fontSize: s.small ? 10 : 14, fontWeight: 700, color: s.color ?? "#f1f5f9", lineHeight: 1.3 }}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Confidence interval */}
              <div>
                <div style={{ fontSize: 10, color: "#64748b", marginBottom: 6, fontWeight: 700 }}>95% CONFIDENCE INTERVAL</div>
                <CIBar ciLow={selected.ciLow} ciHigh={selected.ciHigh} lift={selected.lift} />
                <div style={{ fontSize: 10, color: selected.ciLow > 0 ? "#4ade80" : selected.ciHigh < 0 ? "#ef4444" : "#94a3b8", marginTop: 4 }}>
                  {selected.ciLow > 0
                    ? "✓ Entire CI above zero — statistically significant positive effect"
                    : selected.ciHigh < 0
                    ? "✕ Entire CI below zero — statistically significant negative effect"
                    : "— CI crosses zero — effect not yet certain"
                  }
                </div>
              </div>
            </div>

            {/* Right: p-value time series */}
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#f1f5f9", marginBottom: 4 }}>p-value over time</div>
              <div style={{ fontSize: 10, color: "#64748b", marginBottom: 12 }}>
                Red dashed line = significance threshold (p=0.05). Curve dropping below → significant.
              </div>
              <PValueChart data={selected.dailyPValue} width={380} height={120} />

              {/* Segment breakdown */}
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#f1f5f9", marginBottom: 8 }}>Segment analysis</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {selected.segments.map(seg => (
                    <div key={seg.label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11 }}>
                      <span style={{ width: 90, color: "#94a3b8" }}>{seg.label}</span>
                      <div style={{ flex: 1, height: 6, background: "#0f172a", borderRadius: 3, position: "relative", overflow: "hidden" }}>
                        <div style={{
                          position: "absolute", left: "50%",
                          width: `${Math.abs(seg.lift) * 1.5}%`,
                          transform: seg.lift > 0 ? "translateX(0)" : `translateX(-100%)`,
                          height: "100%",
                          background: seg.sig ? (seg.lift > 0 ? "#4ade80" : "#ef4444") : "#334155",
                          borderRadius: 3,
                        }} />
                      </div>
                      <span style={{ width: 44, textAlign: "right", color: seg.sig ? (seg.lift > 0 ? "#4ade80" : "#ef4444") : "#64748b", fontWeight: seg.sig ? 700 : 400 }}>
                        {seg.lift > 0 ? "+" : ""}{seg.lift}%
                      </span>
                      <span style={{ fontSize: 9, color: seg.sig ? "#4ade80" : "#475569" }}>{seg.sig ? "sig" : "—"}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Funnel */}
          <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#f1f5f9", marginBottom: 4 }}>Conversion Funnel</div>
            <div style={{ fontSize: 10, color: "#64748b", marginBottom: 14 }}>
              <span style={{ color: "#6366f1" }}>■ control</span> vs <span style={{ color: "#4ade80" }}>■ treatment</span> — delta shown as percentage-point difference
            </div>
            <FunnelChart funnel={selected.funnel} />
          </div>
        </div>
      )}

      {/* ── PROGRAM HEALTH ── */}
      {activeTab === "health" && (
        <div>
          {/* Top metrics */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
            {[
              { label: "Experiments run",        value: String(EXPERIMENTS.length), sub: "2024", color: "#818cf8" },
              { label: "Win rate",               value: `${winRate}%`, sub: `${winners.length}/${completed.length} concluded`, color: "#4ade80" },
              { label: "Avg lift (winners)",     value: `+${avgLift}%`, sub: "on primary metric", color: "#22d3ee" },
              { label: "Avg experiment runtime", value: "13.4 days", sub: "to significance", color: "#fbbf24" },
            ].map(m => (
              <div key={m.label} style={{ background: "#1e293b", border: `1px solid ${m.color}20`, borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 10, color: "#64748b", marginBottom: 2 }}>{m.label}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: m.color }}>{m.value}</div>
                <div style={{ fontSize: 10, color: "#475569" }}>{m.sub}</div>
              </div>
            ))}
          </div>

          {/* Experiment outcomes table */}
          <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, overflow: "hidden", marginBottom: 16 }}>
            <div style={{ padding: "10px 16px", borderBottom: "1px solid #334155", fontSize: 12, fontWeight: 700, color: "#f1f5f9" }}>All Experiments — Summary</div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#0f172a" }}>
                  {["Experiment", "Team", "Metric", "Lift", "p-value", "95% CI", "Status"].map(h => (
                    <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: "#64748b", fontWeight: 700, fontSize: 10, borderBottom: "2px solid #334155" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {EXPERIMENTS.map(exp => {
                  const sc = STATUS_CFG[exp.status];
                  return (
                    <tr key={exp.id}
                      onClick={() => { setSelectedId(exp.id); setActiveTab("analysis"); }}
                      style={{ borderBottom: "1px solid #0f172a", cursor: "pointer" }}>
                      <td style={{ padding: "8px 12px", color: "#f1f5f9", fontWeight: 600 }}>{exp.name.split("—")[0].trim()}</td>
                      <td style={{ padding: "8px 12px", color: "#64748b" }}>{exp.team}</td>
                      <td style={{ padding: "8px 12px", color: "#64748b", fontSize: 10 }}>{exp.primaryMetric}</td>
                      <td style={{ padding: "8px 12px", fontWeight: 700, color: exp.lift > 0 ? "#4ade80" : "#ef4444" }}>{exp.lift > 0 ? "+" : ""}{exp.lift}%</td>
                      <td style={{ padding: "8px 12px", fontFamily: "monospace", color: exp.pValue < 0.05 ? "#4ade80" : "#94a3b8" }}>{exp.pValue.toFixed(3)}</td>
                      <td style={{ padding: "8px 12px", fontSize: 10, color: "#64748b" }}>[{exp.ciLow > 0 ? "+" : ""}{exp.ciLow}%, {exp.ciHigh > 0 ? "+" : ""}{exp.ciHigh}%]</td>
                      <td style={{ padding: "8px 12px" }}>
                        <span style={{ background: sc.bg, color: sc.color, fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 4 }}>{sc.icon} {sc.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Key learnings */}
          <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#f1f5f9", marginBottom: 12 }}>Key Learnings — 2024</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { icon: "🟢", title: "Mobile is high-leverage", body: "All 3 winning experiments showed stronger lift on mobile (avg +2.4× vs desktop). Prioritise mobile-first variants." },
                { icon: "🔴", title: "Video ≠ engagement", body: "Hero video hurt desktop performance on slow connections. Static image with motion-safe CSS performs better across segments." },
                { icon: "🟡", title: "Onboarding friction is expensive", body: "Every extra step in onboarding costs ~5% completion. 3-step flow: +23% activation. Apply to all new user flows." },
                { icon: "💡", title: "Anchor pricing drives annual", body: "Defaulting to annual pricing (with savings badge) lifts annual plan selection by 12% — pure framing, no feature change." },
              ].map(l => (
                <div key={l.title} style={{ background: "#0f172a", borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: 14, marginBottom: 4 }}>{l.icon} <span style={{ fontSize: 12, fontWeight: 700, color: "#f1f5f9" }}>{l.title}</span></div>
                  <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.6 }}>{l.body}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── METHODOLOGY ── */}
      {activeTab === "methodology" && (
        <div style={{ display: "flex", gap: 16 }}>
          <div style={{ width: 200, flexShrink: 0 }}>
            {METHODOLOGY_SECTIONS.map(s => (
              <button key={s.id} onClick={() => setMethodId(s.id)} style={{
                display: "block", width: "100%", textAlign: "left",
                background: methodId === s.id ? "#6366f120" : "#1e293b",
                border: `1px solid ${methodId === s.id ? "#6366f1" : "#334155"}`,
                borderRadius: 8, padding: "10px 12px", marginBottom: 6,
                cursor: "pointer", color: methodId === s.id ? "#a5b4fc" : "#94a3b8",
                fontSize: 12, fontWeight: methodId === s.id ? 700 : 400,
              }}>
                {s.icon} {s.title}
              </button>
            ))}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 20, marginBottom: 14 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#f1f5f9", marginBottom: 6 }}>{activeMeth.icon} {activeMeth.title}</div>
              <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.7 }}>{activeMeth.desc}</div>
            </div>
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, overflow: "hidden" }}>
              <div style={{ padding: "8px 14px", borderBottom: "1px solid #334155", fontSize: 10, color: "#64748b", background: "#0f172a" }}>
                Implementation
              </div>
              <pre style={{ margin: 0, padding: 16, fontSize: 11, fontFamily: "monospace", color: "#94a3b8", lineHeight: 1.7, overflow: "auto", maxHeight: 420 }}>
                <code>{activeMeth.code}</code>
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExperimentationDemo;
