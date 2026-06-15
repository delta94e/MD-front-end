import React, { useState } from 'react';
import { MetricsDisplay } from './components/MetricsDisplay';
import { UnoptimizedPage } from './components/UnoptimizedPage';
import { OptimizedPage } from './components/OptimizedPage';
import { 
  Zap, 
  Sparkles, 
  RefreshCw, 
  ChevronRight, 
  ShieldCheck, 
  Activity, 
  Image, 
  Cpu, 
  Server,
  CornerDownRight
} from 'lucide-react';
import './App.css';

export const App = () => {
  const [activeTab, setActiveTab] = useState<'unoptimized' | 'optimized'>('unoptimized');
  const [testRunId, setTestRunId] = useState<number>(Date.now());
  const [networkType, setNetworkType] = useState<'wifi' | 'fast3g'>('wifi');
  const [clickCount, setClickCount] = useState<number>(0);

  const handleResetTest = () => {
    setTestRunId(Date.now());
    setClickCount(0);
  };

  const handleInteraction = () => {
    setClickCount(prev => prev + 1);
  };

  return (
    <div className="performance-app">
      {/* Header bar */}
      <header className="performance-navbar">
        <div className="nav-brand">
          <Zap className="brand-logo" />
          <div>
            <h1>Core Web Vitals Sandbox</h1>
            <span className="brand-subtitle">Performance Diagnostics & Optimization (LCP, FID/INP, CLS)</span>
          </div>
        </div>

        <div className="nav-actions">
          <button className="reset-btn" onClick={handleResetTest}>
            <RefreshCw className="reset-icon" />
            Reset Trace Data
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <main className="performance-main ds-container">
        
        {/* Left column: Diagnostics dashboard */}
        <section className="diagnostics-panel">
          <MetricsDisplay testRunId={testRunId} />

          {/* Core Web Vitals Strategy Cards */}
          <div className="strategies-card">
            <div className="card-title">
              <ShieldCheck style={{ color: 'var(--color-success)', width: '18px' }} />
              <h5>Applied Core Web Vitals Strategies</h5>
            </div>
            
            <div className="strategy-list">
              <div className="strategy-item">
                <div className="strategy-header">
                  <Image className="strategy-icon" />
                  <strong>1. Image Optimization (LCP/CLS)</strong>
                </div>
                <div className="strategy-desc">
                  Chuyển đổi sang WebP (giảm dung lượng 80%), thêm <code>aspect-ratio</code> bằng cách thiết lập 
                  <code>width</code>/<code>height</code> rõ ràng để triệt tiêu hoàn toàn Layout Shifts.
                </div>
              </div>

              <div className="strategy-item">
                <div className="strategy-header">
                  <Cpu className="strategy-icon" />
                  <strong>2. Offloading Main Thread (FID/INP)</strong>
                </div>
                <div className="strategy-desc">
                  Di chuyển tác vụ tính toán nặng sang <strong>Web Workers</strong> (luồng nền phụ) để main thread 
                  luôn rảnh rỗi và phản hồi click chuột ngay lập tức (FID &lt; 50ms).
                </div>
              </div>

              <div className="strategy-item">
                <div className="strategy-header">
                  <Server className="strategy-icon" />
                  <strong>3. Resource Prioritization (LCP)</strong>
                </div>
                <div className="strategy-desc">
                  Thiết lập <code>loading="eager"</code> cho ảnh LCP đầu trang và sử dụng 
                  cấu hình preload tài nguyên quan trọng để tăng tốc độ tải.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Right column: Sandbox Canvas */}
        <section className="sandbox-panel">
          {/* Tab selector */}
          <div className="canvas-selectors">
            <button 
              className={`selector-tab bad ${activeTab === 'unoptimized' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('unoptimized');
                handleResetTest();
              }}
            >
              <Activity className="selector-icon" />
              Before (Unoptimized UI)
            </button>
            <button 
              className={`selector-tab good ${activeTab === 'optimized' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('optimized');
                handleResetTest();
              }}
            >
              <Sparkles className="selector-icon" />
              After (Optimized UI)
            </button>
          </div>

          {/* Test Canvas area */}
          <div className="canvas-viewport">
            <div className="viewport-controls">
              <div className="network-simulator">
                <span>Simulate Connection:</span>
                <select 
                  value={networkType} 
                  onChange={(e) => setNetworkType(e.target.value as any)}
                  disabled // Disabled for actual client performance consistency
                >
                  <option value="wifi">Fast Wi-Fi (No Throttling)</option>
                  <option value="fast3g">Slow 3G Network (Simulated)</option>
                </select>
              </div>
              <div className="interaction-tracker">
                Clicks Triggered: <strong>{clickCount}</strong>
              </div>
            </div>

            {/* Scoped view mounts either page based on tab */}
            <div className={`canvas-content ${networkType}`}>
              {activeTab === 'unoptimized' ? (
                <UnoptimizedPage key={testRunId} onInteractionTriggered={handleInteraction} />
              ) : (
                <OptimizedPage key={testRunId} onInteractionTriggered={handleInteraction} />
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Footer copyright */}
      <footer className="playground-footer">
        <p>Built for Nguyen Huu Truong - Senior Frontend Engineer Interview Portfolio.</p>
        <p style={{ marginTop: '4px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
          Leveraging native browser <code>PerformanceObserver</code> to log actual Web Vitals.
        </p>
      </footer>
    </div>
  );
};

export default App;
