/**
 * CocCocDemo.tsx
 *
 * Coc Coc Browser — Frontend Engineer
 *
 * 1. VAST/VPAID ADS — engineered video ad system from scratch for Coc Coc New Tab.
 *    VAST XML parsing, quartile tracking beacons, VPAID JS API, wrapper chains.
 *
 * 2. WEB WORKERS + MONITORING — caching Web Worker (off-main-thread),
 *    Grafana + ClickhouseDB performance dashboards.
 *
 * 3. TOOLS & TESTING — Proxyme (open-source NodeJS proxy), Jest unit tests,
 *    Nightwatch E2E, CI/CD. Games SDK and Video Search features.
 *
 * TABS
 *   📺 VAST/VPAID Ads   — interactive ad flow simulation + tracking beacons
 *   ⚡ Performance       — Web Worker caching, Grafana-style monitoring
 *   🛠 Tools             — Proxyme, Jest, Nightwatch, CI/CD, Games SDK
 */

import React, { useState, useEffect, useRef, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────
// VAST types and data
// ─────────────────────────────────────────────────────────────────

type AdState = "idle" | "requesting" | "parsing" | "loaded" | "playing" | "complete";
type TrackingEvent = { event: string; time: string; url: string; fired: boolean };

const TRACKING_EVENTS_TEMPLATE: Omit<TrackingEvent, "fired">[] = [
  { event: "AdRequest",     time: "00:00",  url: "https://ads.coccoc.com/track?e=request&sid=..." },
  { event: "Impression",    time: "00:00",  url: "https://ads.coccoc.com/track?e=impression&sid=..." },
  { event: "Start (0%)",    time: "00:01",  url: "https://pixel.coccoc.com/track?e=start&sid=..." },
  { event: "FirstQuartile", time: "00:07",  url: "https://pixel.coccoc.com/track?e=firstQuartile&sid=..." },
  { event: "Midpoint (50%)",time: "00:15",  url: "https://pixel.coccoc.com/track?e=midpoint&sid=..." },
  { event: "ThirdQuartile", time: "00:22",  url: "https://pixel.coccoc.com/track?e=thirdQuartile&sid=..." },
  { event: "Complete",      time: "00:30",  url: "https://pixel.coccoc.com/track?e=complete&sid=..." },
];

const VAST_XML = `<?xml version="1.0" encoding="UTF-8"?>
<VAST version="3.0">
  <Ad id="coccoc-newtab-001">
    <InLine>
      <AdSystem>CocCoc AdServer 1.0</AdSystem>
      <AdTitle>Coc Coc New Tab Ad</AdTitle>
      <Impression>
        <![CDATA[https://ads.coccoc.com/track?e=impression&sid=abc123]]>
      </Impression>
      <Creatives>
        <Creative>
          <Linear skipoffset="00:00:05">
            <Duration>00:00:30</Duration>
            <TrackingEvents>
              <Tracking event="start">
                <![CDATA[https://pixel.coccoc.com/track?e=start]]>
              </Tracking>
              <Tracking event="firstQuartile">
                <![CDATA[https://pixel.coccoc.com/track?e=firstQuartile]]>
              </Tracking>
              <Tracking event="midpoint">
                <![CDATA[https://pixel.coccoc.com/track?e=midpoint]]>
              </Tracking>
              <Tracking event="thirdQuartile">
                <![CDATA[https://pixel.coccoc.com/track?e=thirdQuartile]]>
              </Tracking>
              <Tracking event="complete">
                <![CDATA[https://pixel.coccoc.com/track?e=complete]]>
              </Tracking>
            </TrackingEvents>
            <VideoClicks>
              <ClickThrough>
                <![CDATA[https://advertiser.example.com/landing]]>
              </ClickThrough>
              <ClickTracking>
                <![CDATA[https://ads.coccoc.com/track?e=click]]>
              </ClickTracking>
            </VideoClicks>
            <MediaFiles>
              <MediaFile type="video/mp4" width="1280" height="720"
                         bitrate="2000" delivery="progressive">
                <![CDATA[https://cdn.coccoc.com/ads/ad-001.mp4]]>
              </MediaFile>
              <MediaFile type="video/webm" width="1280" height="720"
                         bitrate="2000" delivery="progressive">
                <![CDATA[https://cdn.coccoc.com/ads/ad-001.webm]]>
              </MediaFile>
            </MediaFiles>
          </Linear>
        </Creative>
      </Creatives>
    </InLine>
  </Ad>
</VAST>`;

// ─────────────────────────────────────────────────────────────────
// Grafana-style metrics data
// ─────────────────────────────────────────────────────────────────

function generateSearchLatency() {
  return Array.from({ length: 20 }, (_, i) => ({
    t: `${i}:00`, v: Math.round(80 + Math.random() * 60 + (i === 8 || i === 13 ? 120 : 0))
  }));
}

function generateCacheHits() {
  return Array.from({ length: 20 }, (_, i) => ({
    t: `${i}:00`, hits: Math.round(70 + Math.random() * 20), misses: Math.round(5 + Math.random() * 10)
  }));
}

// ─────────────────────────────────────────────────────────────────
// Proxyme mock data
// ─────────────────────────────────────────────────────────────────

const PROXY_REQUESTS = [
  { method: "GET",  url: "https://api.coccoc.com/search?q=weather",         status: 200, time: 42,  size: "18.4 KB", modified: false },
  { method: "GET",  url: "https://cdn.coccoc.com/newtab/widgets/news.json", status: 200, time: 78,  size: "42.1 KB", modified: false },
  { method: "POST", url: "https://ads.coccoc.com/vast/request",             status: 200, time: 134, size: "2.8 KB",  modified: false },
  { method: "GET",  url: "https://games.coccoc.com/sdk/loader.js",          status: 200, time: 21,  size: "6.2 KB",  modified: false },
  { method: "GET",  url: "https://pixel.coccoc.com/track?e=impression",     status: 204, time: 8,   size: "0 B",     modified: false },
];

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

function CodeBlock({ code, label, color = "#64748b" }: { code: string; label?: string; color?: string }) {
  return (
    <div style={{ background: "#0a0a14", borderRadius: 8, overflow: "hidden", border: "1px solid #1e293b" }}>
      {label && <div style={{ padding: "5px 12px", borderBottom: "1px solid #1e293b", fontSize: 10, color }}>{label}</div>}
      <pre style={{ margin: 0, padding: 12, fontSize: 9, fontFamily: "monospace", color: "#94a3b8", lineHeight: 1.7, overflow: "auto", maxHeight: 280 }}>{code}</pre>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────

export function CocCocDemo() {
  const [activeTab, setActiveTab] = useState<"ads" | "perf" | "tools">("ads");

  // VAST ad state
  const [adState, setAdState] = useState<AdState>("idle");
  const [events, setEvents] = useState<TrackingEvent[]>(
    TRACKING_EVENTS_TEMPLATE.map(e => ({ ...e, fired: false }))
  );
  const [adProgress, setAdProgress] = useState(0);
  const [adTime, setAdTime] = useState(0);
  const [skipped, setSkipped] = useState(false);
  const adIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startAd = useCallback(() => {
    if (adState !== "idle") return;
    setSkipped(false);
    setAdProgress(0);
    setAdTime(0);
    setEvents(TRACKING_EVENTS_TEMPLATE.map(e => ({ ...e, fired: false })));

    setAdState("requesting");
    setTimeout(() => {
      setAdState("parsing");
      setEvents(prev => prev.map((e, i) => i === 0 ? { ...e, fired: true } : e));
      setTimeout(() => {
        setAdState("loaded");
        setTimeout(() => {
          setAdState("playing");
          setEvents(prev => prev.map((e, i) => i <= 1 ? { ...e, fired: true } : e));
          let t = 0;
          adIntervalRef.current = setInterval(() => {
            t += 0.5;
            setAdTime(t);
            const pct = (t / 30) * 100;
            setAdProgress(pct);
            // fire quartile events
            if (t >= 0.5  && t < 1)   setEvents(prev => prev.map((e, i) => i <= 2 ? { ...e, fired: true } : e));
            if (t >= 7.5  && t < 8)   setEvents(prev => prev.map((e, i) => i <= 3 ? { ...e, fired: true } : e));
            if (t >= 15   && t < 15.5) setEvents(prev => prev.map((e, i) => i <= 4 ? { ...e, fired: true } : e));
            if (t >= 22.5 && t < 23)  setEvents(prev => prev.map((e, i) => i <= 5 ? { ...e, fired: true } : e));
            if (t >= 30) {
              clearInterval(adIntervalRef.current!);
              setAdState("complete");
              setEvents(prev => prev.map(e => ({ ...e, fired: true })));
            }
          }, 100);
        }, 400);
      }, 600);
    }, 500);
  }, [adState]);

  const skipAd = useCallback(() => {
    if (adIntervalRef.current) clearInterval(adIntervalRef.current);
    setSkipped(true);
    setAdState("idle");
    setAdProgress(0);
    setAdTime(0);
  }, []);

  const resetAd = useCallback(() => {
    if (adIntervalRef.current) clearInterval(adIntervalRef.current);
    setAdState("idle");
    setAdProgress(0);
    setAdTime(0);
    setSkipped(false);
    setEvents(TRACKING_EVENTS_TEMPLATE.map(e => ({ ...e, fired: false })));
  }, []);

  useEffect(() => () => { if (adIntervalRef.current) clearInterval(adIntervalRef.current); }, []);

  // Perf data
  const [searchLatency] = useState(generateSearchLatency);
  const [cacheData] = useState(generateCacheHits);

  // Proxyme state
  const [intercepting, setIntercepting] = useState(false);
  const [requests, setRequests] = useState(PROXY_REQUESTS);
  const [modifyIndex, setModifyIndex] = useState<number | null>(null);

  const startIntercept = () => {
    setIntercepting(true);
    setRequests(PROXY_REQUESTS);
  };

  const toggleModify = (i: number) => {
    setRequests(prev => prev.map((r, idx) => idx === i ? { ...r, modified: !r.modified } : r));
  };

  const TABS = [
    { id: "ads"   as const, label: "📺 VAST/VPAID Ads"   },
    { id: "perf"  as const, label: "⚡ Performance"       },
    { id: "tools" as const, label: "🛠 Tools & Testing"   },
  ];

  const adPct = Math.round(adProgress);
  const canSkip = adTime >= 5 && adState === "playing";

  return (
    <div style={{ background: "#0f172a", color: "#f1f5f9", fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100vh", padding: 24 }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg, #1a73e8, #0d47a1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 900, color: "#fff" }}>C</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Coc Coc Browser</h1>
            <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
              Frontend Engineer · VAST/VPAID · Web Workers · Proxyme OSS · ClickhouseDB · Grafana
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["Search Engine Frontend", "New Tab (iOS/Android)", "VAST/VPAID", "Web Workers", "Grafana", "ClickhouseDB", "Video Search", "Games SDK", "ReactJS", "Svelte", "Proxyme OSS"].map(t => (
            <span key={t} style={{ background: "#1e293b", color: "#94a3b8", border: "1px solid #334155", borderRadius: 20, padding: "3px 10px", fontSize: 11 }}>{t}</span>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid #1e293b", paddingBottom: 4 }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            background: activeTab === tab.id ? "#1e293b" : "transparent",
            color: activeTab === tab.id ? "#f1f5f9" : "#64748b",
            border: activeTab === tab.id ? "1px solid #334155" : "1px solid transparent",
            borderRadius: "8px 8px 0 0", padding: "8px 20px", cursor: "pointer", fontSize: 13, fontWeight: 600,
          }}>{tab.label}</button>
        ))}
      </div>

      {/* ── VAST/VPAID ADS ── */}
      {activeTab === "ads" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {/* Ad player */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>
              COC COC NEW TAB — VAST AD SIMULATION
            </div>

            {/* New Tab mockup */}
            <div style={{ background: "#1a1a2e", border: "1px solid #334155", borderRadius: 10, overflow: "hidden", marginBottom: 10 }}>
              {/* Browser bar */}
              <div style={{ background: "#252540", padding: "6px 12px", display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ display: "flex", gap: 4 }}>{["#ef4444","#f59e0b","#22c55e"].map(c => <div key={c} style={{ width: 8, height: 8, borderRadius: "50%", background: c }} />)}</div>
                <div style={{ flex: 1, background: "#1a1a2e", borderRadius: 4, padding: "3px 8px", fontSize: 9, color: "#475569" }}>coccoc://newtab</div>
              </div>
              {/* New tab content */}
              <div style={{ padding: 12 }}>
                <div style={{ textAlign: "center", marginBottom: 10 }}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: "#3b82f6", marginBottom: 4 }}>Coc Coc</div>
                  <div style={{ background: "#252540", borderRadius: 20, padding: "5px 14px", display: "inline-flex", gap: 6, alignItems: "center" }}>
                    <span style={{ fontSize: 10 }}>🔍</span>
                    <span style={{ fontSize: 9, color: "#475569" }}>Tìm kiếm hoặc nhập địa chỉ...</span>
                  </div>
                </div>
                {/* Ad slot */}
                <div style={{ background: "#0f0f1e", border: `2px solid ${adState === "playing" ? "#3b82f6" : "#334155"}`, borderRadius: 8, aspectRatio: "16/9", position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {adState === "idle" && !skipped && (
                    <div style={{ textAlign: "center", color: "#475569" }}>
                      <div style={{ fontSize: 20, marginBottom: 4 }}>📺</div>
                      <div style={{ fontSize: 9 }}>Ad Slot</div>
                    </div>
                  )}
                  {adState === "requesting" && (
                    <div style={{ textAlign: "center", color: "#64748b", fontSize: 9 }}>Fetching VAST XML…</div>
                  )}
                  {adState === "parsing" && (
                    <div style={{ textAlign: "center", color: "#64748b", fontSize: 9 }}>Parsing VAST response…</div>
                  )}
                  {adState === "loaded" && (
                    <div style={{ textAlign: "center", color: "#64748b", fontSize: 9 }}>Loading media…</div>
                  )}
                  {adState === "playing" && (
                    <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #0d2241 0%, #1a3a6e 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative" }}>
                      <div style={{ fontSize: 28, opacity: 0.5 }}>🎬</div>
                      <div style={{ position: "absolute", top: 6, left: 6, background: "#00000080", borderRadius: 3, padding: "1px 5px", fontSize: 7, color: "#94a3b8" }}>Ad</div>
                      <div style={{ position: "absolute", top: 6, right: 6, background: "#00000080", borderRadius: 3, padding: "1px 5px", fontSize: 7, color: "#94a3b8" }}>
                        {Math.max(0, 30 - Math.round(adTime))}s
                      </div>
                      {canSkip && (
                        <button onClick={skipAd} style={{ position: "absolute", bottom: 20, right: 6, background: "#00000090", border: "1px solid #94a3b8", borderRadius: 3, padding: "2px 7px", fontSize: 8, color: "#fff", cursor: "pointer" }}>
                          Skip Ad ▶
                        </button>
                      )}
                      {!canSkip && adState === "playing" && (
                        <div style={{ position: "absolute", bottom: 20, right: 6, background: "#00000080", borderRadius: 3, padding: "2px 7px", fontSize: 8, color: "#94a3b8" }}>
                          Skip in {Math.max(0, Math.ceil(5 - adTime))}s
                        </div>
                      )}
                      {/* Progress bar */}
                      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: "#ffffff20" }}>
                        <div style={{ background: "#3b82f6", height: "100%", width: `${adPct}%`, transition: "width 0.1s" }} />
                      </div>
                    </div>
                  )}
                  {adState === "complete" && (
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 18, marginBottom: 4 }}>✅</div>
                      <div style={{ fontSize: 9, color: "#22c55e" }}>Ad complete</div>
                    </div>
                  )}
                  {skipped && (
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 9, color: "#64748b" }}>Ad skipped</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Controls */}
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={startAd} disabled={adState !== "idle"} style={{ background: adState === "idle" ? "#3b82f6" : "#334155", border: "none", borderRadius: 8, padding: "8px 16px", color: adState === "idle" ? "#fff" : "#64748b", cursor: adState === "idle" ? "pointer" : "not-allowed", fontSize: 11, fontWeight: 700 }}>
                ▶ Load Ad (VAST)
              </button>
              <button onClick={resetAd} disabled={adState === "idle" && !skipped && events[0].fired === false} style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, padding: "7px 14px", color: "#64748b", cursor: "pointer", fontSize: 11 }}>
                ↺ Reset
              </button>
            </div>
          </div>

          {/* Tracking events + VAST */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>
              TRACKING BEACON LOG
            </div>
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 10, marginBottom: 10 }}>
              {events.map((evt, i) => (
                <div key={evt.event} style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "5px 0", borderBottom: i < events.length - 1 ? "1px solid #0f172a" : "none", opacity: evt.fired ? 1 : 0.3, transition: "opacity 0.3s" }}>
                  <span style={{ fontSize: 10, flexShrink: 0, marginTop: 1 }}>{evt.fired ? "🟢" : "⚪"}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: evt.fired ? "#22c55e" : "#475569" }}>{evt.event}</span>
                      <span style={{ fontSize: 8, color: "#334155" }}>{evt.time}</span>
                    </div>
                    <div style={{ fontSize: 8, color: "#334155", fontFamily: "monospace" }}>{evt.url}</div>
                  </div>
                </div>
              ))}
            </div>
            <CodeBlock label="VAST XML — ad response from Coc Coc Ad Server" color="#3b82f6" code={VAST_XML} />
          </div>
        </div>
      )}

      {/* ── PERFORMANCE ── */}
      {activeTab === "perf" && (
        <div>
          {/* Grafana-style panels */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            {/* Search latency */}
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 10 }}>
                Search Query Latency (P99) · ClickhouseDB → Grafana
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 60 }}>
                {searchLatency.map((p, i) => (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                    <div
                      style={{
                        height: `${(p.v / 260) * 60}px`,
                        background: p.v > 150 ? "#ef4444" : p.v > 120 ? "#f59e0b" : "#22c55e",
                        borderRadius: "2px 2px 0 0", opacity: 0.8,
                      }}
                      title={`${p.t}: ${p.v}ms`}
                    />
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 7, color: "#334155", marginTop: 3 }}>
                <span>-20m</span><span>now</span>
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
                <span style={{ fontSize: 9, color: "#22c55e" }}>● &lt; 120ms</span>
                <span style={{ fontSize: 9, color: "#f59e0b" }}>● 120-150ms</span>
                <span style={{ fontSize: 9, color: "#ef4444" }}>● &gt; 150ms</span>
              </div>
            </div>

            {/* Cache hit/miss */}
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 10 }}>
                Web Worker Cache: Hit vs Miss Rate
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 60 }}>
                {cacheData.map((p, i) => {
                  const total = p.hits + p.misses;
                  return (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                      <div style={{ height: `${(p.misses / total) * 60}px`, background: "#ef4444", borderRadius: "2px 2px 0 0", opacity: 0.7 }} />
                      <div style={{ height: `${(p.hits / total) * 60 * 0.3}px`, background: "#22c55e", opacity: 0.8 }} />
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
                <span style={{ fontSize: 9, color: "#22c55e" }}>● Cache Hit (~85%)</span>
                <span style={{ fontSize: 9, color: "#ef4444" }}>● Cache Miss (~15%)</span>
              </div>
            </div>
          </div>

          {/* Web Worker explanation */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 14, marginBottom: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8 }}>WEB WORKER CACHING — off main thread</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {[
                    { icon: "🧵", label: "Main Thread",   color: "#ef4444", detail: "UI rendering, user events, React reconciliation. Must stay fast." },
                    { icon: "⚙️", label: "Cache Worker",  color: "#22c55e", detail: "IndexedDB reads/writes, cache strategy, expiration logic — off main thread." },
                    { icon: "📡", label: "Message API",   color: "#6366f1", detail: "postMessage({ type: 'GET', url }) ↔ onmessage({ data: cachedResponse })" },
                    { icon: "🗄",  label: "Cache Store",  color: "#0ea5e9", detail: "Cache API + IndexedDB. Worker owns storage — no main thread blocking." },
                  ].map(item => (
                    <div key={item.label} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
                      <div>
                        <div style={{ fontSize: 9, fontWeight: 700, color: item.color }}>{item.label}</div>
                        <div style={{ fontSize: 9, color: "#64748b" }}>{item.detail}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <CodeBlock label="Grafana + ClickhouseDB — performance monitoring stack" color="#f59e0b" code={
`// ClickhouseDB: columnar analytics database (Yandex-built).
// Ideal for: high-write, high-read analytics at scale.
// Used at Coc Coc for: search latency, ad impressions, user behavior.

// 1. FRONTEND → ClickhouseDB (event ingest):
//    User action → send to ingest API → ClickhouseDB table
//    Example: every search query logged with latency + result count
//    INSERT INTO search_events (timestamp, query, latency_ms, result_count, user_region)
//    VALUES (now(), 'weather', 89, 12, 'HN');

// 2. ClickhouseDB → Grafana:
//    Grafana data source: ClickhouseDB plugin
//    Dashboard panels: time-series queries
//    SELECT
//      toStartOfMinute(timestamp) AS minute,
//      quantile(0.99)(latency_ms) AS p99_latency
//    FROM search_events
//    WHERE timestamp >= now() - INTERVAL 1 HOUR
//    GROUP BY minute
//    ORDER BY minute

// 3. ALERTING:
//    Grafana alert: if p99_latency > 200ms for 5 minutes → PagerDuty
//    This caught: CDN configuration change that introduced 80ms extra latency
//    Alert fired 3 minutes after the deployment. Rolled back before user impact.

// WHY CLICKHOUSE (not PostgreSQL or MySQL):
// ClickhouseDB is columnar: reads of specific columns are very fast.
// A search latency query reads: timestamp + latency_ms. That's 2 columns.
// PostgreSQL reads entire rows (all columns) even if you only need 2.
// At 1M events/day: ClickhouseDB query in 50ms. PostgreSQL: 5-10 seconds.
// For real-time dashboards: ClickhouseDB is the right choice.`} />
            </div>

            <CodeBlock label="Web Worker caching — off-main-thread cache strategy for Coc Coc" color="#22c55e" code={
`// WHY WEB WORKERS FOR CACHING:
// The Coc Coc New Tab loads: news, weather, shortcuts, ads.
// Each = a network request. Without caching: slow new tab.
// With Service Worker: automatic but limited control.
// With Web Worker: full programmatic control over cache strategy.

// cache.worker.js (runs in a separate thread)
const CACHE_VERSION = "v3";
const cache = new Map(); // in-memory L1 cache

self.onmessage = async ({ data: { type, url, maxAge } }) => {
  if (type === "GET") {
    // 1. Check L1 (in-memory)
    const mem = cache.get(url);
    if (mem && Date.now() - mem.ts < (maxAge ?? 60_000)) {
      self.postMessage({ url, data: mem.data, source: "memory" });
      return;
    }

    // 2. Check L2 (IndexedDB)
    const stored = await idbGet(url);
    if (stored && Date.now() - stored.ts < (maxAge ?? 300_000)) {
      cache.set(url, stored);  // promote to L1
      self.postMessage({ url, data: stored.data, source: "idb" });
      return;
    }

    // 3. Network fetch (worker thread, not main thread)
    const res = await fetch(url);
    const data = await res.json();
    const entry = { data, ts: Date.now() };
    cache.set(url, entry);           // L1
    await idbSet(url, entry);        // L2
    self.postMessage({ url, data, source: "network" });
  }
};

// Main thread usage:
const worker = new Worker("cache.worker.js");

function fetchCached(url, maxAge) {
  return new Promise(resolve => {
    const handler = ({ data }) => {
      if (data.url === url) {
        worker.removeEventListener("message", handler);
        resolve(data);
      }
    };
    worker.addEventListener("message", handler);
    worker.postMessage({ type: "GET", url, maxAge });
  });
}

// WHY THIS MATTERS:
// Cache operations (IDB read/write) are async but still consume CPU.
// On a low-end Android device, IDB reads can take 50-100ms.
// If this runs on the main thread: UI freezes for 50-100ms.
// In a Worker: main thread never blocks. Smooth UI.`} />
          </div>
        </div>
      )}

      {/* ── TOOLS & TESTING ── */}
      {activeTab === "tools" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {/* Proxyme */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>
              PROXYME — open-source NodeJS programmatic proxy
            </div>
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 12, marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#f1f5f9" }}>proxyme</span>
                  <span style={{ fontSize: 9, color: "#64748b", marginLeft: 8 }}>thienphanexcalibur/proxyme</span>
                </div>
                <button onClick={startIntercept} disabled={intercepting} style={{ background: intercepting ? "#22c55e" : "#1a3a6e", border: "none", borderRadius: 6, padding: "5px 12px", color: "#fff", cursor: intercepting ? "not-allowed" : "pointer", fontSize: 10 }}>
                  {intercepting ? "● Intercepting" : "▶ Start Proxy"}
                </button>
              </div>
              {intercepting && (
                <div>
                  <div style={{ fontSize: 8, color: "#475569", marginBottom: 6 }}>Listening on http://localhost:8080 · {requests.length} requests captured</div>
                  {requests.map((r, i) => (
                    <div key={i} style={{ background: "#0f172a", borderRadius: 6, padding: "7px 10px", marginBottom: 4, border: `1px solid ${r.modified ? "#f59e0b30" : "#334155"}` }}>
                      <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 3 }}>
                        <span style={{ fontSize: 8, background: r.method === "POST" ? "#6366f120" : "#334155", color: r.method === "POST" ? "#a5b4fc" : "#64748b", borderRadius: 3, padding: "1px 5px", fontWeight: 700 }}>{r.method}</span>
                        <span style={{ fontSize: 9, color: r.status === 200 ? "#22c55e" : "#f59e0b" }}>{r.status}</span>
                        <span style={{ fontSize: 8, color: "#475569" }}>{r.time}ms</span>
                        <span style={{ fontSize: 8, color: "#334155" }}>{r.size}</span>
                        {r.modified && <span style={{ fontSize: 7, background: "#f59e0b20", color: "#f59e0b", borderRadius: 3, padding: "1px 5px" }}>modified</span>}
                      </div>
                      <div style={{ fontSize: 8, color: "#64748b", fontFamily: "monospace", marginBottom: 4 }}>{r.url}</div>
                      <button onClick={() => toggleModify(i)} style={{ background: "transparent", border: `1px solid ${r.modified ? "#f59e0b" : "#334155"}`, borderRadius: 4, padding: "2px 8px", color: r.modified ? "#f59e0b" : "#475569", cursor: "pointer", fontSize: 8 }}>
                        {r.modified ? "✓ Response modified" : "⚡ Intercept & modify"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {!intercepting && (
                <div style={{ textAlign: "center", padding: 16, color: "#334155", fontSize: 10 }}>
                  Start proxy to capture and modify HTTP traffic
                </div>
              )}
            </div>
            <CodeBlock label="Proxyme — NodeJS API (github.com/thienphanexcalibur/proxyme)" color="#0ea5e9" code={
`// Proxyme: programmatic HTTP proxy for traffic monitoring.
// Unlike Charles/mitmproxy: configured in code, not a GUI.
// Use case: automated testing, CI debugging, VAST ad verification.

const { Proxy } = require("proxyme");

const proxy = new Proxy({ port: 8080 });

// Intercept and log all VAST ad requests
proxy.intercept({
  filter: (req) => req.url.includes("/vast/"),
  onRequest: (req, res, next) => {
    console.log("[VAST]", req.method, req.url);
    // Log request headers, verify ad server response format
    next();
  },
  onResponse: (req, res, body, next) => {
    // Verify VAST XML is valid before it reaches the player
    if (!body.includes("<VAST")) {
      console.error("[VAST] Invalid response:", body.slice(0, 200));
    }
    // Modify response for testing (inject tracking URLs, etc.)
    const modified = body.replace(
      "https://ads.coccoc.com",
      "https://test.coccoc.com"
    );
    next(modified);
  },
});

proxy.start();
// WHY PROXYME (not Charles or Burp):
// GUI proxies are manual. Proxyme is programmable.
// Run in CI: intercept VAST responses, assert structure.
// No manual step needed. Catches ad format regressions automatically.
// Used in Nightwatch E2E tests to mock ad server responses
// and verify player behaviour under different VAST scenarios.`} />
          </div>

          {/* Testing + CI/CD + Games SDK */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginBottom: 8, letterSpacing: "0.08em" }}>
              JEST UNIT TESTS + NIGHTWATCH E2E
            </div>
            <CodeBlock label="Jest — VAST parser unit tests" color="#a855f7" code={
`// Jest tests for the VAST parser (engineered from scratch).
// Every VAST parsing case must be covered: valid XML,
// wrapper chains, empty responses, malformed XML.

describe("VASTParser", () => {
  it("parses a standard VAST Linear ad", async () => {
    const vast = await VASTParser.parse(VALID_VAST_XML);
    expect(vast.ads).toHaveLength(1);
    expect(vast.ads[0].type).toBe("InLine");
    expect(vast.ads[0].duration).toBe(30);
    expect(vast.ads[0].mediaFiles).toHaveLength(2);
    expect(vast.ads[0].mediaFiles[0].type).toBe("video/mp4");
  });

  it("fires tracking beacons at correct quartile timestamps", async () => {
    const mockFetch = jest.fn().mockResolvedValue({ ok: true });
    global.fetch = mockFetch;

    const player = new VASTPlayer();
    await player.load(VALID_VAST_XML);
    player.fireQuartileEvent("midpoint");

    expect(mockFetch).toHaveBeenCalledWith(
      "https://pixel.coccoc.com/track?e=midpoint&sid=abc123",
      expect.objectContaining({ method: "GET" })
    );
  });

  it("handles VAST wrapper chains (max 3 hops)", async () => {
    // Wrapper: VAST response contains a URI to another VAST
    // Must follow the chain and get the inline ad.
    const vast = await VASTParser.parse(WRAPPER_VAST_XML);
    expect(vast.ads[0].type).toBe("InLine"); // followed to inline
    expect(VASTParser.hops).toBeLessThanOrEqual(3); // safety limit
  });

  it("returns null for empty VAST response", async () => {
    const vast = await VASTParser.parse(EMPTY_VAST_XML);
    expect(vast).toBeNull();
  });
});`} />

            <div style={{ marginTop: 10 }}>
              <CodeBlock label="Games SDK — browser game integration at Coc Coc" color="#22c55e" code={
`// COC COC GAMES SDK
// A JavaScript SDK for browser-based games embedded in the Coc Coc browser.
// Games can be web-based (WebGL, Canvas 2D) or third-party (iframe embedded).

// SDK API surface:
class CocCocGamesSDK {
  // Auth: user identity without exposing PII to the game
  async getUser(): Promise<{ userId: string; displayName: string; avatar: string }> {}

  // Leaderboard: post + fetch scores
  async postScore(score: number, level: string): Promise<void> {}
  async getLeaderboard(gameId: string): Promise<LeaderboardEntry[]> {}

  // IAP (in-app purchases via Coc Coc coin system)
  async purchaseItem(itemId: string): Promise<PurchaseResult> {}

  // Events: track game events for analytics (ClickhouseDB ingest)
  track(event: string, properties: Record<string, unknown>): void {}

  // Ad integration: show a reward ad between levels
  async showRewardedAd(): Promise<{ rewarded: boolean }> {}
}

// USAGE IN A GAME:
const sdk = new CocCocGamesSDK({ gameId: "puzzle-master" });
await sdk.initialize();

// After level complete:
await sdk.postScore(12800, "level-5");
const leaderboard = await sdk.getLeaderboard("puzzle-master");
// Show leaderboard in game UI

// Reward ad between levels:
const { rewarded } = await sdk.showRewardedAd();
if (rewarded) givePlayerBonusCoins(50);

// WHY A DEDICATED SDK (not generic APIs):
// Game developers should focus on game logic, not on:
// - Coc Coc authentication flow (OAuth vs browser session)
// - ClickhouseDB ingest format for analytics
// - VAST ad lifecycle management for rewarded ads
// The SDK abstracts all of this. Game developer calls 3 methods.`} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CocCocDemo;
