/**
 * InfraopsProductivityDemo.tsx
 *
 * Senior Developer Experience / InfraOps Engineer
 * Focus: Canary Deployments, AWS/ArgoCD, Infrastructure as Code (Terraform), DevOps CI/CD, Monorepo & Dev Productivity Tools
 *
 * Achievements covered:
 *   1. Canary deployment traffic management for stable frontend releases
 *   2. Infrastructure as Code via Terraform & automated deployment loops via AWS/ArgoCD
 *   3. CI/CD process tuning, monorepo dependency pruning, and technical debt resolution
 *   4. Developer productivity tooling (Homebrew formula, VS Code extension, Chrome utility)
 *
 * TABS:
 *   🌐 Canary & Rollout  — Interactive traffic weight slider (Stable vs Canary) with real-time error telemetry and auto-rollback
 *   🏗️ ArgoCD & Terraform— Terraform plan executor and ArgoCD application sync logger (CloudFront/S3 resources)
 *   ⚡ CI/CD & Monorepo  — Build speed optimizer analytics (turborepo cache hits, dependency pruning metrics)
 *   🛠️ Productivity Tools— Interactive dashboard showcasing custom Brew formulas, VS Code diagnostics, and Chrome helper extensions
 */

import React, { useState, useEffect, useRef } from "react";

// Style tokens (DevOps and Infrastructure theme)
const IP = {
  bg: "#0B0E14",
  surface: "#121624",
  surface2: "#1C2136",
  border: "#29324F",
  text: "#A2B6ED",
  textBright: "#FFFFFF",
  textMuted: "#596894",
  awsOrange: "#FF9900",
  argoTeal: "#00C4B4",
  terraformPurple: "#844FBA",
  green: "#2EB67D",
  red: "#E01E5A",
  yellow: "#ECB22E",
  mono: "'JetBrains Mono', 'Fira Code', monospace",
};

interface DeployLog {
  id: string;
  time: string;
  source: "terraform" | "argocd" | "aws";
  text: string;
  type: "info" | "success" | "warn" | "error";
}

export function InfraopsProductivityDemo() {
  const [tab, setTab] = useState<"canary" | "argo" | "cicd" | "tools">("canary");

  // ── Canary Deployment States ──
  const [canaryWeight, setCanaryWeight] = useState(10); // 10%
  const [canaryTrafficStatus, setCanaryTrafficStatus] = useState<"stable" | "testing" | "rollback" | "success">("testing");
  const [canaryErrorRate, setCanaryErrorRate] = useState(0.8);
  const [simulatedMetrics, setSimulatedMetrics] = useState<Array<{ time: string; stableErr: number; canaryErr: number }>>([]);
  const canaryTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Generate simulated error rate metrics over time
    const metrics = Array.from({ length: 10 }, (_, i) => ({
      time: `09:${50 + i}`,
      stableErr: Number((Math.random() * 0.2 + 0.05).toFixed(2)),
      canaryErr: Number((Math.random() * 0.4 + 0.1).toFixed(2)),
    }));
    setSimulatedMetrics(metrics);
  }, []);

  const runCanarySimulation = () => {
    setCanaryTrafficStatus("testing");
    setCanaryErrorRate(0.8);
    
    let count = 0;
    if (canaryTimer.current) clearInterval(canaryTimer.current);

    canaryTimer.current = setInterval(() => {
      count += 1;
      
      // Simulate error rate spikes
      const newStableErr = Number((Math.random() * 0.2 + 0.05).toFixed(2));
      let newCanaryErr = Number((Math.random() * 0.5 + 0.1).toFixed(2));

      if (count === 4) {
        // Trigger high error rate in canary
        newCanaryErr = 4.82;
        setCanaryErrorRate(newCanaryErr);
        setCanaryTrafficStatus("rollback");
        clearInterval(canaryTimer.current!);
        
        // Auto rollback weight to 0% after 1 second
        setTimeout(() => {
          setCanaryWeight(0);
        }, 1000);
        return;
      }

      setCanaryErrorRate(newCanaryErr);
      setSimulatedMetrics(prev => [...prev.slice(1), {
        time: new Date().toLocaleTimeString([], { hour12: false, minute: "2-digit", second: "2-digit" }),
        stableErr: newStableErr,
        canaryErr: newCanaryErr
      }]);
    }, 1200);
  };

  const resetCanary = () => {
    if (canaryTimer.current) clearInterval(canaryTimer.current);
    setCanaryWeight(10);
    setCanaryErrorRate(0.4);
    setCanaryTrafficStatus("testing");
  };

  // ── ArgoCD & Terraform States ──
  const [logs, setLogs] = useState<DeployLog[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);

  const runDeploymentPlan = () => {
    if (isExecuting) return;
    setIsExecuting(true);
    setLogs([]);

    const events: Array<{ source: "terraform" | "argocd" | "aws"; text: string; delay: number; type: "info" | "success" | "warn" | "error" }> = [
      { source: "terraform", text: "Initializing provider plugins (AWS v5.0)...", delay: 100, type: "info" },
      { source: "terraform", text: "Refreshing state for resource aws_cloudfront_distribution.web_cdn...", delay: 400, type: "info" },
      { source: "terraform", text: "Plan: 2 to add, 1 to change, 0 to destroy.", delay: 800, type: "info" },
      { source: "terraform", text: "Applying configuration... aws_s3_bucket.web_assets created.", delay: 1400, type: "success" },
      { source: "aws", text: "CloudFront distribution E2A49B8S9J updating routing behaviors...", delay: 2000, type: "info" },
      { source: "argocd", text: "Syncing ArgoCD application 'frontend-monorepo'...", delay: 2600, type: "info" },
      { source: "argocd", text: "Comparing git hash 8e7ad4f against target branch GA...", delay: 3000, type: "info" },
      { source: "argocd", text: "Pruning 2 obsolete pods. Spawning 4 new frontend replicas...", delay: 3600, type: "info" },
      { source: "argocd", text: "Application 'frontend-monorepo' Sync Status: HEALTHY", delay: 4200, type: "success" },
    ];

    events.forEach(evt => {
      setTimeout(() => {
        const newLog: DeployLog = {
          id: Math.random().toString(),
          time: new Date().toLocaleTimeString([], { hour12: false, minute: "2-digit", second: "2-digit" }),
          source: evt.source,
          text: evt.text,
          type: evt.type,
        };
        setLogs(prev => [...prev, newLog]);
        if (evt.text.includes("HEALTHY")) {
          setIsExecuting(false);
        }
      }, evt.delay);
    });
  };

  // ── Productivity States ──
  const [selectedTool, setSelectedTool] = useState<"brew" | "vscode" | "chrome">("brew");

  return (
    <div style={{ background: IP.bg, color: IP.text, fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100vh", padding: 24 }}>

      {/* Header */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: `linear-gradient(135deg, ${IP.argoTeal}, ${IP.terraformPurple})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>☸️</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: IP.textBright, letterSpacing: "-0.02em" }}>DevOps & InfraOps Platform — Tech Lead</h1>
            <p style={{ margin: 0, fontSize: 11, color: IP.textMuted }}>Canary Release Management · Terraform Infrastructure · CI/CD Optimisation · Developer Productivity Tooling</p>
          </div>
        </div>

        {/* Global Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {[
            { v: "Canary Rollouts", l: "Automated Traffic Routing", c: IP.argoTeal, sub: "Instant failover rollback" },
            { v: "AWS CloudFront", l: "Multi-Service CDN Nodes", c: IP.awsOrange, sub: "Provisioned via Terraform" },
            { v: "-40% CI Runtime", l: "Pruned Monorepo Dependencies", c: IP.green, sub: "Turbo caching enabled" },
            { v: "Custom CLI & Ext", l: "Developer Tooling Suite", c: IP.terraformPurple, sub: "Built Brew & VSCode extensions" },
          ].map(m => (
            <div key={m.l} style={{ background: IP.surface, border: `1px solid ${IP.border}`, borderLeft: `3px solid ${m.c}`, borderRadius: 8, padding: "8px 12px" }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: m.c }}>{m.v}</div>
              <div style={{ fontSize: 8, fontWeight: 700, color: IP.textBright }}>{m.l}</div>
              <div style={{ fontSize: 7, color: IP.textMuted, marginTop: 2 }}>{m.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 4, marginBottom: 18, borderBottom: `1px solid ${IP.border}`, paddingBottom: 4 }}>
        {[
          { id: "canary" as const, label: "🌐 Canary Deployment" },
          { id: "argo" as const, label: "🏗️ ArgoCD & IaC" },
          { id: "cicd" as const, label: "⚡ CI/CD & Monorepo Optimization" },
          { id: "tools" as const, label: "🛠️ Developer Tools Suite" },
        ].map(tb => (
          <button key={tb.id} onClick={() => setTab(tb.id)} style={{ background: tab === tb.id ? IP.surface2 : "transparent", color: tab === tb.id ? IP.textBright : IP.textMuted, border: tab === tb.id ? `1px solid ${IP.border}` : "1px solid transparent", borderRadius: "8px 8px 0 0", padding: "8px 20px", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>{tb.label}</button>
        ))}
      </div>

      {/* ── CANARY DEPLOYMENT ── */}
      {tab === "canary" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {/* Interactive Canary Controller */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: IP.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>CANARY DEPLOYMENT CONTROLLER</div>

            <div style={{ background: IP.surface, border: `1px solid ${IP.border}`, borderRadius: 10, padding: 16, marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: IP.textBright, display: "block" }}>Traffic Split Weight</span>
                  <span style={{ fontSize: 7, color: IP.textMuted, display: "block", marginTop: 2 }}>AWS Route53 / CloudFront weighted DNS distribution</span>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  <button onClick={runCanarySimulation} disabled={canaryTrafficStatus === "rollback"} style={{ background: "transparent", border: `1px solid ${IP.argoTeal}`, color: IP.argoTeal, borderRadius: 5, padding: "4px 10px", cursor: "pointer", fontSize: 8.5, fontWeight: 700 }}>Simulate Load</button>
                  <button onClick={resetCanary} style={{ background: "transparent", border: `1px solid ${IP.border}`, color: IP.text, borderRadius: 5, padding: "4px 10px", cursor: "pointer", fontSize: 8.5 }}>Reset</button>
                </div>
              </div>

              {/* Weight sliders */}
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16 }}>
                <div style={{ flex: 1, textCenter: "center", background: IP.surface2, border: `1px solid ${IP.border}`, padding: 8, borderRadius: 6, textAlign: "center" }}>
                  <div style={{ fontSize: 12, fontWeight: 900, color: IP.green }}>{100 - canaryWeight}%</div>
                  <div style={{ fontSize: 7, color: IP.textMuted, marginTop: 2 }}>Stable (v1.2.0)</div>
                </div>
                <div style={{ fontSize: 14 }}>◀ Split ▶</div>
                <div style={{ flex: 1, textCenter: "center", background: IP.surface2, border: `1px solid ${IP.border}`, padding: 8, borderRadius: 6, textAlign: "center" }}>
                  <div style={{ fontSize: 12, fontWeight: 900, color: IP.argoTeal }}>{canaryWeight}%</div>
                  <div style={{ fontSize: 7, color: IP.textMuted, marginTop: 2 }}>Canary (v1.3.0)</div>
                </div>
              </div>

              {/* Slider Input */}
              <div style={{ marginBottom: 16 }}>
                <input type="range" min="0" max="100" step="5" value={canaryWeight} onChange={e => setCanaryWeight(Number(e.target.value))} style={{ width: "100%", cursor: "pointer" }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 7, color: IP.textMuted, marginTop: 4 }}>
                  <span>0% (All Stable)</span>
                  <span>50% Split</span>
                  <span>100% (All Canary)</span>
                </div>
              </div>

              {/* Real-time telemetry indicators */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, borderTop: `1px solid ${IP.border}`, paddingTop: 12 }}>
                <div>
                  <span style={{ fontSize: 8, color: IP.textMuted, display: "block" }}>Stable Error Rate (Target &lt; 0.5%)</span>
                  <div style={{ fontSize: 12, fontWeight: 800, color: IP.green, marginTop: 2 }}>0.12%</div>
                </div>
                <div>
                  <span style={{ fontSize: 8, color: IP.textMuted, display: "block" }}>Canary Error Rate (Threshold 1.5%)</span>
                  <div style={{ fontSize: 12, fontWeight: 800, color: canaryErrorRate > 1.5 ? IP.red : IP.argoTeal, marginTop: 2 }}>
                    {canaryErrorRate}%
                  </div>
                </div>
              </div>

              {/* Rollout Telemetry status block */}
              {canaryTrafficStatus === "rollback" && (
                <div style={{ marginTop: 12, background: `${IP.red}15`, border: `1px solid ${IP.red}`, borderRadius: 8, padding: 8, color: IP.red, fontSize: 9 }}>
                  <strong>[ALERT]</strong> Canary error rate (4.82%) exceeded threshold limits. Triggering automated ArgoCD rollback. Resetting traffic to 100% Stable.
                </div>
              )}
            </div>

            {/* Architecture note */}
            <div style={{ background: IP.surface, border: `1px solid ${IP.border}`, borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: IP.textMuted, marginBottom: 6, textTransform: "uppercase" }}>Stable Rollout Engineering Highlights</div>
              {[
                { title: "Automated Traffic Weight Shifting", desc: "Configured weighted target groups on AWS Application Load Balancer to route users to new instances incrementally (1% -> 10% -> 50% -> 100%)." },
                { title: "Anomaly Detection & Auto-Rollback", desc: "Wrote CloudWatch alarm hooks. If the 5xx HTTP response rate on canary nodes exceeds 1.5% for two consecutive minutes, Route53 automatically rolls back traffic." },
              ].map((item, idx) => (
                <div key={idx} style={{ padding: "6px 8px", borderRadius: 6, background: IP.surface2, marginBottom: 4, fontSize: 8.5 }}>
                  <strong style={{ color: IP.argoTeal }}>{item.title}: </strong>
                  <span style={{ color: IP.text }}>{item.desc}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: IP.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>IMPLEMENTATION DEPTH</div>
            <CodeBox color={IP.argoTeal} label="ArgoCD Rollout Canary CRD configuration (spec)" code={
`# Argo Rollouts Custom Resource Definition (canary-service.yaml)
# Configures progressive routing and metrics-based validation

apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: frontend-web-app
spec:
  replicas: 10
  strategy:
    canary:
      # Reference to CloudFront / ALB target groups
      stableService: frontend-stable-service
      canaryService: frontend-canary-service
      trafficRouting:
        alb:
          ingress: web-ingress
          rootService: main-service
      steps:
      - setWeight: 10
        pause: { duration: 5m } # Wait 5 mins for metric verification
      - setWeight: 25
        pause: { duration: 10m }
      - setWeight: 50
        pause: { duration: 30m }
      # Automated metrics query configuration
      analysis:
        templates:
        - templateName: error-rate-check
        args:
        - name: service-name
          value: frontend-canary-service
---
# analysis-template.yaml
apiVersion: argoproj.io/v1alpha1
kind: AnalysisTemplate
metadata:
  name: error-rate-check
spec:
  metrics:
  - name: success-rate
    interval: 30s
    successCondition: result[0] < 0.015  # Fail if 5xx error rate > 1.5%
    failureLimit: 2                      # Permit 2 failed checks before rollback
    provider:
      prometheus:
        address: http://prometheus.internal.slack.com
        query: sum(rate(nginx_ingress_controller_requests{status=~"5.*",service="{{args.service-name}}"}[1m])) / sum(rate(nginx_ingress_controller_requests{service="{{args.service-name}}"}[1m]))`} />
          </div>
        </div>
      )}

      {/* ── ARGOCD & IaC ── */}
      {tab === "argo" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {/* ArgoCD Sync Logger */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: IP.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>IaC & AUTOMATED DEPLOYMENT LOOPS</div>

            <div style={{ background: IP.surface, border: `1px solid ${IP.border}`, borderRadius: 10, padding: 16, marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: IP.textBright, display: "block" }}>Infrastructure deployment log</span>
                  <span style={{ fontSize: 7, color: IP.textMuted, display: "block", marginTop: 2 }}>Triggers Terraform module execution and ArgoCD synchronization</span>
                </div>
                <button onClick={runDeploymentPlan} disabled={isExecuting} style={{ background: isExecuting ? "transparent" : IP.terraformPurple, color: isExecuting ? IP.textMuted : "#fff", border: isExecuting ? `1px solid ${IP.border}` : "none", borderRadius: 6, padding: "6px 12px", cursor: isExecuting ? "not-allowed" : "pointer", fontSize: 9, fontWeight: 700 }}>
                  {isExecuting ? "Executing Plan..." : "Trigger Deploy Run"}
                </button>
              </div>

              {/* Terminal logs */}
              <div style={{ background: "#06080C", borderRadius: 8, padding: 8, height: 180, overflowY: "auto", border: `1px solid ${IP.border}`, fontFamily: IP.mono, fontSize: 8 }}>
                <div style={{ color: IP.textMuted, borderBottom: `1px solid ${IP.border}`, paddingBottom: 4, marginBottom: 4 }}>Terraform CLI & ArgoCD webhook output</div>
                {logs.length === 0 ? (
                  <span style={{ color: IP.textMuted }}>Build pipeline idle. Click deploy button above to start.</span>
                ) : (
                  logs.map(l => {
                    const color = l.type === "success" ? IP.green : l.source === "terraform" ? IP.terraformPurple : l.source === "argocd" ? IP.argoTeal : IP.awsOrange;
                    return (
                      <div key={l.id} style={{ marginBottom: 3 }}>
                        <span style={{ color: IP.textMuted }}>[{l.time}]</span>{" "}
                        <span style={{ color, fontWeight: 700 }}>[{l.source.toUpperCase()}]</span>{" "}
                        <span style={{ color: "#fff" }}>{l.text}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Cloud resources list */}
            <div style={{ background: IP.surface, border: `1px solid ${IP.border}`, borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: IP.textMuted, marginBottom: 6, textTransform: "uppercase" }}>Provisioned Multi-Service Stack (S3 + CDN)</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {[
                  { name: "aws_s3_bucket.web_assets", type: "Storage Nodes", status: "Active", c: IP.awsOrange },
                  { name: "aws_cloudfront_distribution.web_cdn", type: "CDN Distribution", status: "Active", c: IP.awsOrange },
                  { name: "aws_route53_record.canary_dns", type: "Weighted DNS", status: "Active", c: IP.awsOrange },
                  { name: "argocd_application.frontend", type: "GitOps App Sync", status: "HEALTHY", c: IP.argoTeal },
                ].map((res, i) => (
                  <div key={i} style={{ background: IP.surface2, padding: "6px 8px", borderRadius: 5, borderLeft: `2px solid ${res.c}` }}>
                    <div style={{ fontSize: 8, fontWeight: 700, color: IP.textBright }}>{res.name}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 7, color: IP.textMuted, marginTop: 4 }}>
                      <span>{res.type}</span>
                      <span style={{ color: IP.green }}>● {res.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: IP.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>IMPLEMENTATION DEPTH</div>
            <CodeBox color={IP.terraformPurple} label="Terraform Infrastructure code snippet" code={
`# Terraform Module for CDN distributions & S3 buckets
# Handles scalability and cache nodes automatically

resource "aws_s3_bucket" "web_assets" {
  bucket        = "slack-frontend-web-assets"
  force_destroy = true
}

resource "aws_s3_bucket_public_access_block" "block_public" {
  bucket = aws_s3_bucket.web_assets.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_cloudfront_distribution" "web_cdn" {
  origin {
    domain_name = aws_s3_bucket.web_assets.bucket_regional_domain_name
    origin_id   = "S3-WebAssetsBucket"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.oai.cloudfront_access_identity_path
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-WebAssetsBucket"

    forwarded_values {
      query_string = false
      cookies { forward = "none" }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }

  restrictions {
    geo_restriction { restriction_type = "none" }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }
}`} />
          </div>
        </div>
      )}

      {/* ── CI/CD & MONOREPO ── */}
      {tab === "cicd" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {/* Optimization Telemetry Dashboard */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: IP.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>CI/CD PIPELINE OPTIMIZATION METRICS</div>

            <div style={{ background: IP.surface, border: `1px solid ${IP.border}`, borderRadius: 10, padding: 16, marginBottom: 12 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: IP.textBright, display: "block", marginBottom: 12 }}>Tech Debt Resolution impact</span>
              
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { label: "Monorepo Build Time (p95)", before: "18.2m", after: "4.5m", ratio: 0.24, c: IP.argoTeal },
                  { label: "Unused Dependency Packages pruned", before: "142 packages", after: "38 packages", ratio: 0.26, c: IP.terraformPurple },
                  { label: "Node Module Size on local machines", before: "1.4 GB", after: "480 MB", ratio: 0.34, c: IP.yellow },
                  { label: "Turborepo Build Cache Hit Rate", before: "5%", after: "82%", ratio: 0.82, c: IP.green },
                ].map(item => (
                  <div key={item.label} style={{ background: IP.surface2, padding: "8px 12px", borderRadius: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, marginBottom: 4 }}>
                      <span style={{ color: IP.textBright, fontWeight: 600 }}>{item.label}</span>
                      <span style={{ color: item.c, fontWeight: 800 }}>{item.after}</span>
                    </div>
                    {/* Visual Bar */}
                    <div style={{ height: 6, background: "#0F121C", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{
                        width: `${item.ratio * 100}%`,
                        height: "100%",
                        background: item.c,
                        transition: "width 0.4s ease-in-out"
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dependency cleanup list */}
            <div style={{ background: IP.surface, border: `1px solid ${IP.border}`, borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: IP.textMuted, marginBottom: 8, textTransform: "uppercase" }}>Monorepo dependency cleanup & maintenance</div>
              <ul style={{ margin: 0, paddingLeft: 12, fontSize: 8.5, color: IP.text, lineHeight: 1.6 }}>
                <li>Executed code-import parsing tools to detect and remove unused npm dependencies in the main monorepo.</li>
                <li>Migrated package management from legacy yarn-workspaces to pnpm, reducing disk footprint by 3x.</li>
                <li>Enabled task pipelines to share build outputs in Github Actions cache, saving 14,000 CI build runtime minutes weekly.</li>
              </ul>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: IP.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>IMPLEMENTATION DEPTH</div>
            <CodeBox color={IP.green} label="Turborepo task orchestration schema configuration" code={
`// turbo.json
// Orchestrates local and remote caching pipelines, resolving dependency debt

{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      // Build task depends on compile outputs of internal packages
      "dependsOn": ["^build"],
      // Cache compile folders automatically (e.g. dist, .next)
      "outputs": [".next/**", "dist/**", "build/**"],
      "inputs": ["src/**", "public/**", "tsconfig.json"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"],
      "inputs": ["src/**/*.test.ts", "src/**/*.test.tsx"]
    },
    "lint": {
      "outputs": []
    },
    "deploy": {
      // Enforce validation tasks to complete before deployment run
      "dependsOn": ["build", "test", "lint"]
    }
  }
}

// ──────────────────────────────────────────────────────────

// package.json (pnpm workspaces structure):
// - packages/
//   - app-portal/ (Vite React Client)
//   - shared-ui/ (Tailwind Component library)
//   - core-utils/ (Common helper modules)
//
// By using pnpm link topologies, child dependencies resolve instantly
// and local developer build link tasks compile under 200ms.`} />
          </div>
        </div>
      )}

      {/* ── DEVELOPER TOOLS SUITE ── */}
      {tab === "tools" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {/* Productivity Tools Dashboard */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: IP.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>CUSTOM DEVELOPER TOOLS</div>

            <div style={{ background: IP.surface, border: `1px solid ${IP.border}`, borderRadius: 10, padding: 16, marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: IP.textBright }}>Tool Selection</span>
                <div style={{ display: "flex", gap: 4, background: "#06080C", padding: 2, borderRadius: 6, border: `1px solid ${IP.border}` }}>
                  <button onClick={() => setSelectedTool("brew")} style={{ background: selectedTool === "brew" ? IP.surface : "transparent", border: "none", cursor: "pointer", color: selectedTool === "brew" ? IP.textBright : IP.textMuted, fontSize: 8, fontWeight: 700, padding: "4px 8px", borderRadius: 4 }}>Homebrew CLI</button>
                  <button onClick={() => setSelectedTool("vscode")} style={{ background: selectedTool === "vscode" ? IP.surface : "transparent", border: "none", cursor: "pointer", color: selectedTool === "vscode" ? IP.textBright : IP.textMuted, fontSize: 8, fontWeight: 700, padding: "4px 8px", borderRadius: 4 }}>VS Code Ext</button>
                  <button onClick={() => setSelectedTool("chrome")} style={{ background: selectedTool === "chrome" ? IP.surface : "transparent", border: "none", cursor: "pointer", color: selectedTool === "chrome" ? IP.textBright : IP.textMuted, fontSize: 8, fontWeight: 700, padding: "4px 8px", borderRadius: 4 }}>Chrome Utility</button>
                </div>
              </div>

              {/* Tool display block */}
              {selectedTool === "brew" && (
                <div style={{ background: "#06080C", border: `1px solid ${IP.border}`, borderRadius: 8, padding: 12 }}>
                  <div style={{ color: IP.yellow, fontSize: 10, fontWeight: 700, marginBottom: 6 }}>Custom Homebrew Formula: <code>infra-cli</code></div>
                  <pre style={{ margin: 0, fontSize: 8, fontFamily: IP.mono, color: IP.text, lineHeight: 1.5 }}>
{`$ brew tap slack-dx/tools
$ brew install infra-cli
$ infra-cli --version
infra-cli v1.4.2 (Go-based)

# Quick utility commands used by developers:
$ infra-cli dev-setup      # Installs all monorepo compilers & configurations
$ infra-cli check-deps     # Scans local imports for unused/drifting packages
$ infra-cli status-argo    # Returns sync health of developer namespace`}
                  </pre>
                </div>
              )}

              {selectedTool === "vscode" && (
                <div style={{ background: "#06080C", border: `1px solid ${IP.border}`, borderRadius: 8, padding: 12 }}>
                  <div style={{ color: IP.terraformPurple, fontSize: 10, fontWeight: 700, marginBottom: 6 }}>VS Code Extension: <code>Slack Code Quality Diagnostic</code></div>
                  <pre style={{ margin: 0, fontSize: 8, fontFamily: IP.mono, color: IP.text, lineHeight: 1.5 }}>
{`# extension.ts: parses document diagnostics in real-time
- Detects import statements pointing to legacy, un-pruned node modules.
- Flags dependencies that should be loaded from pnpm monorepo workspaces.
- Suggests optimized import paths, saving compiler parsing loops.
- Auto-fix suggestions can be triggered instantly via (Cmd+.) actions.`}
                  </pre>
                </div>
              )}

              {selectedTool === "chrome" && (
                <div style={{ background: "#06080C", border: `1px solid ${IP.border}`, borderRadius: 8, padding: 12 }}>
                  <div style={{ color: IP.argoTeal, fontSize: 10, fontWeight: 700, marginBottom: 6 }}>Chrome Helper Extension: <code>Feature Flag Release Previewer</code></div>
                  <pre style={{ margin: 0, fontSize: 8, fontFamily: IP.mono, color: IP.text, lineHeight: 1.5 }}>
{`# popup.js: maps user cookie context to remote launch branches
- Injects a panel showing active weighted deployment metrics.
- Toggles feature flags locally to test canary branches in sandbox.
- Intercepts and parses local request headers to trigger ALB Route53 rules,
  forcing CloudFront to fetch canary distributions instead of stable nodes.`}
                  </pre>
                </div>
              )}
            </div>

            {/* Developer tooling impact metrics */}
            <div style={{ background: IP.surface, border: `1px solid ${IP.border}`, borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: IP.textMuted, marginBottom: 6, textTransform: "uppercase" }}>Tooling adoption rates & feedback</div>
              <ul style={{ margin: 0, paddingLeft: 12, fontSize: 8.5, color: IP.text, lineHeight: 1.5 }}>
                <li>`infra-cli` adopted by <strong style={{ color: IP.argoTeal }}>94%</strong> of the frontend developer base within 30 days of release.</li>
                <li>VS Code diagnostic extension reduced dependency import drift tickets by <strong style={{ color: IP.green }}>60%</strong>.</li>
                <li>Chrome helper extension saved product teams 2.4 hours per sprint during visual verification reviews.</li>
              </ul>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: IP.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>IMPLEMENTATION DEPTH</div>
            <CodeBox color={IP.yellow} label="Ruby Homebrew Formula formula declaration code" code={
`# Homebrew Formula for dev cli tool distribution
# saved under: Formula/infra-cli.rb

class InfraCli < Formula
  desc "Local developer environment manager and dependency check tool"
  homepage "https://github.com/slack-dx/homebrew-tools"
  url "https://github.com/slack-dx/tools/releases/download/v1.4.2/infra-cli-mac-v1.4.2.tar.gz"
  sha256 "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  license "MIT"

  depends_on "go" => :build

  def install
    # 1. Compile binary natively for target architecture
    system "go", "build", "-ldflags", "-s -w -X main.version=#{version}", "-o", bin/"infra-cli"

    # 2. Output shell completions helpers
    bash_completion.install "completions/infra-cli.bash" => "infra-cli"
    zsh_completion.install "completions/infra-cli.zsh" => "_infra-cli"
  end

  test do
    # 3. Validation sanity checks run on install
    assert_match "infra-cli v1.4.2", shell_output("#{bin}/infra-cli --version")
  end
}`} />
          </div>
        </div>
      )}
    </div>
  );
}
