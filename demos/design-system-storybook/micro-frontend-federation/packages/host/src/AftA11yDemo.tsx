/**
 * AftA11yDemo.tsx
 *
 * Senior Frontend Engineer — Amazon Fulfillment Technologies (AFT)
 * Focus: Web Components Design System, Blind Packing Auditory Interface, Operations Accessibility, Global Scale Telemetry
 */

import React, { useState, useEffect } from "react";

// Style tokens (Amazon Fulfillment brand: Squid Ink, Gold & Orange)
const AM = {
  bg: "#0B0E14",
  surface: "#121624",
  surface2: "#1C2136",
  border: "#29324F",
  text: "#A2B6ED",
  textBright: "#FFFFFF",
  textMuted: "#596894",
  amazonOrange: "#FF9900",
  amazonGold: "#F5B041",
  green: "#2EB67D",
  red: "#E01E5A",
  blue: "#29B6F6",
  mono: "'JetBrains Mono', 'Fira Code', monospace",
};

interface PackItem {
  id: string;
  name: string;
  sku: string;
  boxSize: string;
  status: "pending" | "scanned" | "packed";
}

const ITEMS_TO_PACK: PackItem[] = [
  { id: "item-1", name: "Premium Noise Cancelling Headphones", sku: "SKU-HPHONE-901", boxSize: "A-3", status: "pending" },
  { id: "item-2", name: "Ergonomic Mechanical Keyboard", sku: "SKU-KEYBD-402", boxSize: "B-2", status: "pending" },
  { id: "item-3", name: "USB-C Fast Charging Adapter", sku: "SKU-CHARG-110", boxSize: "A-1", status: "pending" },
];

export function AftA11yDemo() {
  const [activeTab, setActiveTab] = useState<"wc" | "packer" | "audit" | "telemetry">("wc");

  // ── Tab 1: Web Components States ──
  const [wcFramework, setWcFramework] = useState<"react" | "vanilla">("react");

  // ── Tab 2: Blind Packer Workstation States ──
  const [packItems, setPackItems] = useState<PackItem[]>(ITEMS_TO_PACK);
  const [currentStep, setCurrentStep] = useState<number>(0); // 0: Start, 1: Scan Item, 2: Place in Box, 3: Scan Box, 4: Scan Shipping Label, 5: Complete
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(true);
  const [packerLogs, setPackerLogs] = useState<string[]>(["[Station] Station initialized. Headset connected."]);
  const [selectedBoxSize, setSelectedBoxSize] = useState<string>("");

  const speakMessage = (text: string) => {
    if (!isAudioEnabled) return;
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const advancePackerStep = (action: string) => {
    const item = packItems[0];
    if (!item) return;

    const timestamp = new Date().toLocaleTimeString();
    if (currentStep === 0) {
      // Initialize
      setCurrentStep(1);
      setPackerLogs(prev => [`[${timestamp}] Packing started. Preparing ${item.name}`, ...prev]);
      speakMessage(`Scan item: ${item.name}`);
    } else if (currentStep === 1) {
      // Scan Item success
      setCurrentStep(2);
      setPackItems(prev => prev.map((x, idx) => idx === 0 ? { ...x, status: "scanned" } : x));
      setPackerLogs(prev => [`[${timestamp}] Barcode scanned: ${item.sku}. Item matched.`, ...prev]);
      speakMessage(`Item matched. Place item in box size: ${item.boxSize}.`);
    } else if (currentStep === 2) {
      // Confirm box size chosen
      if (!selectedBoxSize) {
        speakMessage("Please select a box size to simulate placing.");
        return;
      }
      if (selectedBoxSize !== item.boxSize) {
        speakMessage(`Incorrect box. The system requested box: ${item.boxSize}. You placed in: ${selectedBoxSize}`);
        setPackerLogs(prev => [`[${timestamp}] Warning: Box mismatch. Selected ${selectedBoxSize}, required ${item.boxSize}`, ...prev]);
        return;
      }
      setCurrentStep(3);
      setPackerLogs(prev => [`[${timestamp}] Item placed in Box ${item.boxSize}.`, ...prev]);
      speakMessage(`Box matched. Scan box barcode to confirm container.`);
    } else if (currentStep === 3) {
      // Scan box barcode
      setCurrentStep(4);
      setPackItems(prev => prev.map((x, idx) => idx === 0 ? { ...x, status: "packed" } : x));
      setPackerLogs(prev => [`[${timestamp}] Box container barcode verified.`, ...prev]);
      speakMessage("Scan shipping label to finish order.");
    } else if (currentStep === 4) {
      // Scan shipping label
      setCurrentStep(5);
      setPackerLogs(prev => [`[${timestamp}] Shipping label scanned. Box sealed. Order completed.`, ...prev]);
      speakMessage("Job complete. Order shipped on time.");
    }
  };

  const resetPackerDemo = () => {
    setPackItems(ITEMS_TO_PACK);
    setCurrentStep(0);
    setSelectedBoxSize("");
    setPackerLogs(["[Station] Packing station reset. Waiting for associate to scan first tote."]);
    speakMessage("Station reset. Welcome back associate.");
  };

  // ── Tab 3: A11y Audit Code Blocks States ──
  const [auditTarget, setAuditTarget] = useState<"button" | "input" | "announcer">("button");
  const [isAudited, setIsAudited] = useState<boolean>(false);

  // ── Tab 4: Telemetry States ──
  const [selectedSite, setSelectedSite] = useState<"SEA-1" | "HAM-2" | "TYO-4" | "SYD-3">("SEA-1");

  return (
    <div style={{ background: AM.bg, color: AM.text, fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100vh", padding: 24 }}>
      
      {/* Header Banner */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: `linear-gradient(135deg, ${AM.amazonOrange}, ${AM.amazonGold})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>📦</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: AM.textBright, letterSpacing: "-0.02em" }}>Amazon Fulfillment Technologies (AFT) — Design & A11y</h1>
            <p style={{ margin: 0, fontSize: 11, color: AM.textMuted }}>Tech-Agnostic Web Components · Operations Accessibility · Blind Packing Audio Guidance · Physical Workstation Audits</p>
          </div>
        </div>

        {/* Global Statistics */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {[
            { v: "Web Components", l: "Tech-Agnostic Core", c: AM.amazonOrange, sub: "React / Vanilla / Legacy tools compatible" },
            { v: "Audio Guidance", l: "Blind Packing System", c: AM.amazonGold, sub: "Screen-free workspace scaled globally" },
            { v: "Day-1 A11y Check", l: "Compliance CI Checks", c: AM.green, sub: "0 retrofitting required on core library" },
            { v: "100+ Orgs Teams", l: "Fulfillment Adoption", c: AM.blue, sub: "Standardized across Amazon Operations" },
          ].map(m => (
            <div key={m.l} style={{ background: AM.surface, border: `1px solid ${AM.border}`, borderLeft: `3px solid ${m.c}`, borderRadius: 8, padding: "8px 12px" }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: m.c }}>{m.v}</div>
              <div style={{ fontSize: 8, fontWeight: 700, color: AM.textBright }}>{m.l}</div>
              <div style={{ fontSize: 7, color: AM.textMuted, marginTop: 2 }}>{m.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 4, marginBottom: 18, borderBottom: `1px solid ${AM.border}`, paddingBottom: 4 }}>
        {[
          { id: "wc" as const, label: "🔌 Web Components System" },
          { id: "packer" as const, label: "🔊 Blind Packer Workstation" },
          { id: "audit" as const, label: "♿ Operations A11y Audit" },
          { id: "telemetry" as const, label: "📊 Global Telemetry & Scale" },
        ].map(tb => (
          <button
            key={tb.id}
            onClick={() => setActiveTab(tb.id)}
            style={{
              background: activeTab === tb.id ? AM.surface2 : "transparent",
              color: activeTab === tb.id ? AM.textBright : AM.textMuted,
              border: activeTab === tb.id ? `1px solid ${AM.border}` : "1px solid transparent",
              borderRadius: "8px 8px 0 0",
              padding: "8px 20px",
              cursor: "pointer",
              fontSize: 11,
              fontWeight: 600,
              outline: "none"
            }}
          >
            {tb.label}
          </button>
        ))}
      </div>

      {/* ── TAB 1: WEB COMPONENTS DESIGN SYSTEM ── */}
      {activeTab === "wc" && (
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 14 }}>
          {/* Component sandbox preview */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: AM.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>DESIGN SYSTEM COMPONENT CONTAINER (TECH-AGNOSTIC)</div>
            <div style={{ background: AM.surface, border: `1px solid ${AM.border}`, borderRadius: 10, padding: 16, height: 480, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              
              <div>
                {/* Selector */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#06080C", padding: "8px 12px", borderRadius: 8, marginBottom: 16 }}>
                  <span style={{ fontSize: 10, color: AM.textBright, fontWeight: 800 }}>🔩 Target Tool Integration Environment</span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <span onClick={() => setWcFramework("react")} style={{ fontSize: 8, padding: "3px 8px", borderRadius: 4, cursor: "pointer", background: wcFramework === "react" ? AM.amazonOrange : AM.surface, color: wcFramework === "react" ? "#000" : AM.text, fontWeight: 700 }}>REACT COMPONENT WRAPPER</span>
                    <span onClick={() => setWcFramework("vanilla")} style={{ fontSize: 8, padding: "3px 8px", borderRadius: 4, cursor: "pointer", background: wcFramework === "vanilla" ? AM.amazonOrange : AM.surface, color: wcFramework === "vanilla" ? "#000" : AM.text, fontWeight: 700 }}>VANILLA JS CUSTOM ELEMENT</span>
                  </div>
                </div>

                <p style={{ margin: "0 0 14px 0", fontSize: 9.5, color: AM.text, lineHeight: 1.5 }}>
                  Because fulfillment centers use apps written years apart, building components using standard **Web Components** ensures they run natively on any page without dependency issues.
                </p>

                {/* Simulated Web Component Render */}
                <div style={{ background: AM.surface2, border: `1px solid ${AM.border}`, padding: 16, borderRadius: 8, marginTop: 10 }}>
                  <div style={{ borderBottom: `1px solid ${AM.border}`, paddingBottom: 6, marginBottom: 12, fontSize: 8, fontWeight: 700, color: AM.textMuted }}>
                    RENDERED IN HOST RUNTIME: <code>{`<aft-badge-status>`}</code> CUSTOM ELEMENT
                  </div>
                  
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    {/* Simulated Shadow DOM Web Component */}
                    <div style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      background: "#06080C",
                      border: `1px solid ${AM.amazonOrange}`,
                      borderRadius: 4,
                      padding: "4px 10px",
                      fontSize: 10,
                      color: AM.textBright
                    }}>
                      <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: AM.green }} />
                      <span>Order Fulfillment Status: On Time</span>
                    </div>

                    <div style={{ fontSize: 9, color: AM.text }}>
                      <strong>Encapsulated styles:</strong> Shadow DOM protects this badge. Global CSS can't overwrite it, protecting layout stability inside warehouses.
                    </div>
                  </div>
                </div>
              </div>

              {/* Code output for active option */}
              <div style={{ background: "#06080C", borderRadius: 8, padding: 8, border: `1px solid ${AM.border}` }}>
                <span style={{ fontSize: 8, fontWeight: 700, color: AM.textMuted, display: "block", marginBottom: 4 }}>
                  {wcFramework === "react" ? "REACT COMPONENT IMPLEMENTATION" : "RAW VANILLA HTML/JS CUSTOM ELEMENT IMPORT"}
                </span>
                <pre style={{ margin: 0, fontFamily: AM.mono, fontSize: 8.5, color: AM.green }}>
                  {wcFramework === "react" ? 
`// React Wrapper uses Web Component bindings
import { AftBadgeStatus } from '@aft/design-system-react';

export function StatusIndicator() {
  return <AftBadgeStatus label="On Time" state="healthy" />
}` 
: 
`<!-- Legacy Vanilla JS integration -->
<script src="https://cdn.amazon.com/aft/wc/aft-badge-status.js"></script>

<aft-badge-status label="On Time" state="healthy"></aft-badge-status>`
                  }
                </pre>
              </div>

            </div>
          </div>

          {/* Web components core metrics */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: AM.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>DESIGN SYSTEM ADVANTAGES</div>
            <div style={{ background: AM.surface, border: `1px solid ${AM.border}`, borderRadius: 10, padding: 14, height: 480, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { title: "Resiliency in Warehouse Tools", desc: "Legacy fulfillment terminals don't support modern frameworks. Web Components work natively out-of-the-box, ensuring tools remain active under high-uptime promises." },
                  { title: "Accessibility Built-in from Day-1", desc: "All components contain pre-configured ARIA mappings, tab indexes, and keyboard targets, avoiding the need to retrofit them later." },
                  { title: "Framework-Agnostic Flexibility", desc: "Supports React, Angular, Vue, and vanilla HTML applications across Amazon. One codebase updates styling for all platforms." },
                ].map((item, idx) => (
                  <div key={idx} style={{ background: AM.surface2, padding: 10, borderRadius: 6 }}>
                    <div style={{ fontSize: 9.5, fontWeight: 700, color: AM.amazonGold, marginBottom: 4 }}>{item.title}</div>
                    <p style={{ margin: 0, fontSize: 8.5, color: AM.text, lineHeight: 1.4 }}>{item.desc}</p>
                  </div>
                ))}
              </div>

              <div style={{ background: "#06080C", padding: 8, borderRadius: 6, fontSize: 8 }}>
                <span style={{ color: AM.textBright, fontWeight: 700, display: "block", marginBottom: 3 }}>Technical Leader Check:</span>
                We locked the component architecture to native custom elements. This saved thousands of hours that would have been wasted rewriting legacy apps in React.
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: BLIND PACKER AUDIT WORKSTATION ── */}
      {activeTab === "packer" && (
        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 14 }}>
          {/* Packer Workspace Simulator */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: AM.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>SCREEN-FREE AUDITORY WORKSTATION SIMULATOR</div>
            <div style={{ background: AM.surface, border: `1px solid ${AM.border}`, borderRadius: 10, padding: 16, height: 480, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              
              {/* Simulator Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${AM.border}`, paddingBottom: 6 }}>
                <div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: AM.textBright, display: "block" }}>🔊 Packing Workstation Audio Emulator</span>
                  <span style={{ fontSize: 8, color: AM.textMuted }}>Uses browser SpeechSynthesis API to simulate headphone guidance for blind associates.</span>
                </div>
                <button
                  onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                  style={{
                    background: isAudioEnabled ? AM.green : AM.red,
                    border: "none",
                    color: "#fff",
                    borderRadius: 4,
                    padding: "4px 8px",
                    fontSize: 8,
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  {isAudioEnabled ? "🔊 AUDIO ON" : "🔇 MUTED"}
                </button>
              </div>

              {/* Station State mock graphic */}
              <div style={{ flex: 1, background: "#06080C", border: `1px solid ${AM.border}`, borderRadius: 8, margin: "10px 0", padding: 12, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                
                {/* Active packing checklist */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 9.5, color: AM.textBright, fontWeight: 700 }}>Associate Workstation State</span>
                    <span style={{ fontSize: 8, fontFamily: AM.mono, color: AM.amazonGold }}>
                      STEP {currentStep} OF 5
                    </span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 9, color: currentStep >= 1 ? AM.green : AM.textMuted }}>
                      <span>{currentStep >= 2 ? "✔" : "●"}</span>
                      <span>Scan Target Item from Tote</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 9, color: currentStep >= 2 ? AM.green : AM.textMuted }}>
                      <span>{currentStep >= 3 ? "✔" : "●"}</span>
                      <span>Identify box size and place item (Requested Box: <strong>{packItems[0]?.boxSize}</strong>)</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 9, color: currentStep >= 3 ? AM.green : AM.textMuted }}>
                      <span>{currentStep >= 4 ? "✔" : "●"}</span>
                      <span>Scan box barcode to confirm selection</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 9, color: currentStep >= 4 ? AM.green : AM.textMuted }}>
                      <span>{currentStep >= 5 ? "✔" : "●"}</span>
                      <span>Scan shipping label and apply to box</span>
                    </div>
                  </div>
                </div>

                {/* Box Selector for step 2 */}
                {currentStep === 2 && (
                  <div style={{ background: AM.surface2, border: `1px solid ${AM.border}`, padding: 8, borderRadius: 6 }}>
                    <span style={{ fontSize: 8, color: AM.textMuted, display: "block", marginBottom: 4 }}>SIMULATE TACTILE BOX BINS SELECTION:</span>
                    <div style={{ display: "flex", gap: 4 }}>
                      {["A-1", "B-2", "A-3"].map(box => (
                        <button
                          key={box}
                          onClick={() => setSelectedBoxSize(box)}
                          style={{
                            flex: 1,
                            background: selectedBoxSize === box ? AM.amazonOrange : AM.surface,
                            border: `1px solid ${AM.border}`,
                            color: selectedBoxSize === box ? "#000" : AM.textBright,
                            borderRadius: 4,
                            padding: "4px 0",
                            fontSize: 8.5,
                            fontWeight: 700,
                            cursor: "pointer"
                          }}
                        >
                          Bin Box {box}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Interactive Action Control */}
                <div style={{ display: "flex", gap: 6 }}>
                  {currentStep < 5 ? (
                    <button
                      onClick={() => advancePackerStep("next")}
                      style={{
                        flex: 1,
                        background: `linear-gradient(135deg, ${AM.amazonOrange}, ${AM.amazonGold})`,
                        border: "none",
                        color: "#000",
                        fontWeight: 900,
                        fontSize: 10,
                        borderRadius: 5,
                        padding: "8px 0",
                        cursor: "pointer"
                      }}
                    >
                      {currentStep === 0 && "Start Auditory Packing Process"}
                      {currentStep === 1 && "Simulate Scanning Item Barcode"}
                      {currentStep === 2 && "Simulate Placing Item in Bin"}
                      {currentStep === 3 && "Simulate Scanning Box Barcode"}
                      {currentStep === 4 && "Simulate Scanning Shipping Label"}
                    </button>
                  ) : (
                    <button
                      onClick={resetPackerDemo}
                      style={{ flex: 1, background: AM.green, border: "none", color: "#fff", fontWeight: 700, fontSize: 10, borderRadius: 5, padding: "8px 0", cursor: "pointer" }}
                    >
                      🎉 Packing Complete. Start Next Order.
                    </button>
                  )}
                  {currentStep > 0 && (
                    <button onClick={resetPackerDemo} style={{ background: "transparent", border: `1px solid ${AM.border}`, color: AM.text, padding: "0 10px", borderRadius: 5, fontSize: 9, cursor: "pointer" }}>Reset</button>
                  )}
                </div>

              </div>

            </div>
          </div>

          {/* Packer audio terminal logs */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: AM.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>HEADSET SPEECH SYNTHESIS LOGS</div>
            <div style={{ background: AM.surface, border: `1px solid ${AM.border}`, borderRadius: 10, padding: 14, height: 480, display: "flex", flexDirection: "column" }}>
              
              <div style={{ flex: 1, overflowY: "auto", fontFamily: AM.mono, fontSize: 8.5, background: "#06080C", padding: 10, borderRadius: 6, border: `1px solid ${AM.border}`, marginBottom: 10 }}>
                {packerLogs.map((log, idx) => (
                  <div key={idx} style={{ color: log.includes("Warning") ? AM.red : log.includes("Sealed") || log.includes("matched") ? AM.green : AM.text, borderBottom: "1px solid #141829", padding: "4px 0" }}>
                    {log}
                  </div>
                ))}
              </div>

              <div style={{ background: AM.surface2, padding: 10, borderRadius: 6 }}>
                <span style={{ fontSize: 8.5, fontWeight: 700, color: AM.textBright, display: "block", marginBottom: 4 }}>Workstation Assistive Layout:</span>
                <p style={{ margin: 0, fontSize: 8, color: AM.text, lineHeight: 1.5 }}>
                  The physical packing bench was also redesigned with tactile Braille labels on box bins, physical sensor alignments, and optimal scanner heights to enable blind associates to work alongside their peers.
                </p>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: OPERATIONS A11Y AUDIT ── */}
      {activeTab === "audit" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {/* Auditing interface */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: AM.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>ACCESSIBILITY COMPLIANCE AUDITING WORKSPACE</div>
            <div style={{ background: AM.surface, border: `1px solid ${AM.border}`, borderRadius: 10, padding: 16, height: 485, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: AM.textBright, display: "block", marginBottom: 6 }}>Day-1 Accessibility Checklist & Code Audits</span>
                <p style={{ margin: "0 0 14px 0", fontSize: 9.5, color: AM.text, lineHeight: 1.5 }}>
                  Rather than auditing applications manually before deployment, we enforce a11y parameters in our design token libraries and build tooling configs.
                </p>

                {/* Audit Targets Selector */}
                <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
                  {[
                    { id: "button" as const, label: "Interactive Custom Button" },
                    { id: "input" as const, label: "Barcode Input Element" },
                    { id: "announcer" as const, label: "Live Auditory Announcer" },
                  ].map(target => (
                    <button
                      key={target.id}
                      onClick={() => { setAuditTarget(target.id); setIsAudited(false); }}
                      style={{
                        flex: 1,
                        background: auditTarget === target.id ? AM.surface2 : "transparent",
                        border: `1px solid ${AM.border}`,
                        color: auditTarget === target.id ? AM.textBright : AM.textMuted,
                        borderRadius: 5,
                        padding: "5px 0",
                        fontSize: 8,
                        fontWeight: 700,
                        cursor: "pointer"
                      }}
                    >
                      {target.label}
                    </button>
                  ))}
                </div>

                {/* Code Preview Box */}
                <div style={{ background: "#06080C", border: `1px solid ${AM.border}`, borderRadius: 8, padding: 10, height: 160, overflowY: "auto" }}>
                  <pre style={{ margin: 0, fontFamily: AM.mono, fontSize: 8, color: isAudited ? AM.green : AM.red }}>
                    {auditTarget === "button" && (
                      isAudited ? 
`<button 
  aria-label="Confirm item placement in tote"
  tabIndex={0}
  onClick={handleConfirm}>
  Confirm Item
</button>
<!-- ✔ compliant check passed -->`
                      :
`<div 
  style={{ cursor: 'pointer' }} 
  onClick={handleConfirm}>
  Confirm Item
</div>
<!-- ❌ Error: div lacks aria-label role, and cannot receive keyboard focus -->`
                    )}

                    {auditTarget === "input" && (
                      isAudited ? 
`<label htmlFor="barcode-field">Scan Item Barcode</label>
<input 
  id="barcode-field"
  type="text" 
  aria-required="true"
/>
<!-- ✔ compliant: linked label and inputs -->`
                      :
`<input 
  placeholder="Scan Item Barcode"
  type="text" 
/>
<!-- ❌ Error: Input lacks programmatic label descriptor -->`
                    )}

                    {auditTarget === "announcer" && (
                      isAudited ? 
`<div 
  role="status" 
  aria-live="polite" 
  style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden' }}>
  {activeAudioText}
</div>
<!-- ✔ compliant: screen readers will announce live updates immediately -->`
                      :
`<div style={{ display: 'none' }}>
  {activeAudioText}
</div>
<!-- ❌ Warning: display: none blocks screen reader parsing entirely -->`
                    )}
                  </pre>
                </div>
              </div>

              {/* Action */}
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  onClick={() => setIsAudited(true)}
                  disabled={isAudited}
                  style={{
                    flex: 1,
                    background: isAudited ? AM.surface2 : AM.amazonOrange,
                    border: "none",
                    color: isAudited ? AM.textMuted : "#000",
                    fontWeight: 700,
                    fontSize: 9,
                    borderRadius: 5,
                    padding: "8px 0",
                    cursor: isAudited ? "default" : "pointer"
                  }}
                >
                  {isAudited ? "✔ Audit Compliance Passed" : "Execute Day-1 Accessibility Auto-Correction Code"}
                </button>
              </div>

            </div>
          </div>

          {/* Right panel: physical workstation audit specifications */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: AM.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>PHYSICAL WORKSTATION AUDIT RULES</div>
            <div style={{ background: AM.surface, border: `1px solid ${AM.border}`, borderRadius: 10, padding: 16, height: 485, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <span style={{ fontSize: 9.5, color: AM.textBright, fontWeight: 700 }}>AFT Operations physical workspace audit checklist</span>
                <p style={{ margin: 0, fontSize: 8.5, color: AM.text, lineHeight: 1.4 }}>
                  Fulfillment operations require designing physical interfaces alongside layout software to prevent strain and error.
                </p>

                <div style={{ background: AM.surface2, border: `1px solid ${AM.border}`, padding: 8, borderRadius: 6 }}>
                  <div style={{ fontSize: 8.5, color: AM.amazonGold, fontWeight: 700, marginBottom: 3 }}>1. Scanner Placement Heights</div>
                  <div style={{ fontSize: 7.5, color: AM.textMuted }}>Mount fixed barcode scanners at 105cm height (optimal range for wheelchair access and seated associates).</div>
                </div>

                <div style={{ background: AM.surface2, border: `1px solid ${AM.border}`, padding: 8, borderRadius: 6 }}>
                  <div style={{ fontSize: 8.5, color: AM.amazonGold, fontWeight: 700, marginBottom: 3 }}>2. Tactile Bin Markings</div>
                  <div style={{ fontSize: 7.5, color: AM.textMuted }}>Apply raised tactile rubber identifiers and Braille labels on box compartments A-1 through A-4.</div>
                </div>

                <div style={{ background: AM.surface2, border: `1px solid ${AM.border}`, padding: 8, borderRadius: 6 }}>
                  <div style={{ fontSize: 8.5, color: AM.amazonGold, fontWeight: 700, marginBottom: 3 }}>3. Noise Cancelling Headset Spec</div>
                  <div style={{ fontSize: 7.5, color: AM.textMuted }}>Equip stations with bone-conduction headsets, allowing associates to hear ambient alarm sirens while receiving speech guidance.</div>
                </div>
              </div>

              <div style={{ background: "#06080C", padding: 8, borderRadius: 6, fontSize: 7.5 }}>
                <strong>Note:</strong> We map accessibility reviews directly into standard WBS task items to ensure physical and digital teams build together.
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: TELEMETRY & SCALE ── */}
      {activeTab === "telemetry" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {/* Site selection & details */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: AM.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>FC GLOBAL DEPLOYMENTS STATUS</div>
            <div style={{ background: AM.surface, border: `1px solid ${AM.border}`, borderRadius: 10, padding: 16, height: 480, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: AM.textBright, display: "block", marginBottom: 6 }}>Auditory Packing global rollout tracker</span>
                <p style={{ margin: "0 0 14px 0", fontSize: 9.5, color: AM.text, lineHeight: 1.5 }}>
                  The blind packer guidance system has been deployed across multiple key fulfillment centers, expanding employment options globally.
                </p>

                {/* Simulated geographic map / site list */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {[
                    { id: "SEA-1" as const, location: "Seattle, WA, USA", status: "Active", count: 18, rating: "100%" },
                    { id: "HAM-2" as const, location: "Hamburg, Germany", status: "Active", count: 12, rating: "100%" },
                    { id: "TYO-4" as const, location: "Tokyo, Japan", status: "Active", count: 8, rating: "98%" },
                    { id: "SYD-3" as const, location: "Sydney, Australia", status: "Staging", count: 2, rating: "100%" },
                  ].map(site => (
                    <div
                      key={site.id}
                      onClick={() => setSelectedSite(site.id)}
                      style={{
                        background: selectedSite === site.id ? AM.surface2 : "#06080C",
                        border: selectedSite === site.id ? `1px solid ${AM.amazonOrange}` : `1px solid ${AM.border}`,
                        padding: 8,
                        borderRadius: 6,
                        cursor: "pointer",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}
                    >
                      <div>
                        <span style={{ fontSize: 9.5, fontWeight: 700, color: AM.textBright }}>{site.id} — {site.location}</span>
                        <span style={{ fontSize: 7, color: AM.textMuted, display: "block" }}>Active auditory stations: {site.count} units</span>
                      </div>
                      
                      <div style={{ textAlign: "right" }}>
                        <span style={{ fontSize: 8, fontWeight: 700, color: site.status === "Active" ? AM.green : AM.amazonGold }}>{site.status}</span>
                        <span style={{ fontSize: 7, color: AM.textMuted, display: "block" }}>A11y compliance: {site.rating}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: "#06080C", padding: 8, borderRadius: 6, fontSize: 8 }}>
                <strong>Selected site metrics:</strong> Seattle Fulfillment Center (SEA-1) handles an average of **1,400 packages per week** using audio-guided packing lanes.
              </div>

            </div>
          </div>

          {/* Telemetry charts mockup */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: AM.textMuted, marginBottom: 8, letterSpacing: "0.08em" }}>DESIGN SYSTEM ADOPTION TELEMETRY</div>
            <div style={{ background: AM.surface, border: `1px solid ${AM.border}`, borderRadius: 10, padding: 16, height: 480, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              
              <div>
                <span style={{ fontSize: 9.5, color: AM.textBright, fontWeight: 700, display: "block", marginBottom: 12 }}>AFT Design System components usage share</span>
                
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, marginBottom: 3 }}>
                      <span>React Applications (Fulfillment Dashboards)</span>
                      <span style={{ fontWeight: 700 }}>52% share</span>
                    </div>
                    <div style={{ height: 6, background: "#06080C", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: "52%", background: AM.amazonOrange }} />
                    </div>
                  </div>

                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, marginBottom: 3 }}>
                      <span>Vanilla JS / HTML Screens (Warehouse Terminals)</span>
                      <span style={{ fontWeight: 700 }}>38% share</span>
                    </div>
                    <div style={{ height: 6, background: "#06080C", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: "38%", background: AM.amazonGold }} />
                    </div>
                  </div>

                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, marginBottom: 3 }}>
                      <span>Angular & other frameworks</span>
                      <span style={{ fontWeight: 700 }}>10% share</span>
                    </div>
                    <div style={{ height: 6, background: "#06080C", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: "10%", background: AM.blue }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Graphic metrics summary */}
              <div style={{ background: AM.surface2, border: `1px solid ${AM.border}`, padding: 10, borderRadius: 8 }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: AM.textBright, display: "block", marginBottom: 6 }}>LOBAL SCALE ADVANTAGE</span>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, textAlign: "center" }}>
                  <div style={{ background: AM.surface, padding: 6, borderRadius: 5 }}>
                    <div style={{ fontSize: 7, color: AM.textMuted }}>Teams Supported</div>
                    <div style={{ fontSize: 13, fontWeight: 900, color: AM.green }}>104 teams</div>
                  </div>
                  <div style={{ background: AM.surface, padding: 6, borderRadius: 5 }}>
                    <div style={{ fontSize: 7, color: AM.textMuted }}>Components adoption</div>
                    <div style={{ fontSize: 13, fontWeight: 900, color: AM.green }}>96.2% compliance</div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Global CSS spinner keyframe */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

    </div>
  );
}
