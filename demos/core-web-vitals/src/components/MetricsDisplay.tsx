import React, { useEffect, useState } from 'react';
import { RefreshCw, Zap, Sliders, AlertTriangle } from 'lucide-react';
import './MetricsDisplay.css';

interface MetricsDisplayProps {
  testRunId: number;
}

export const MetricsDisplay = ({ testRunId }: MetricsDisplayProps) => {
  const [lcp, setLcp] = useState<number>(0);
  const [cls, setCls] = useState<number>(0);
  const [fid, setFid] = useState<number>(0);
  const [longTasksCount, setLongTasksCount] = useState<number>(0);
  const [maxLongTaskDuration, setMaxLongTaskDuration] = useState<number>(0);

  // Reset metrics when a new test run is initiated
  useEffect(() => {
    setLcp(0);
    setCls(0);
    setFid(0);
    setLongTasksCount(0);
    setMaxLongTaskDuration(0);

    // 1. Largest Contentful Paint (LCP) Observer
    let lcpObserver: PerformanceObserver | null = null;
    try {
      lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        setLcp(lastEntry.startTime);
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (e) {
      console.warn('LCP observer not supported or blocked:', e);
    }

    // 2. Cumulative Layout Shift (CLS) Observer
    let clsValue = 0;
    let clsObserver: PerformanceObserver | null = null;
    try {
      clsObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          const shiftEntry = entry as any;
          if (!shiftEntry.hadRecentInput) {
            clsValue += shiftEntry.value;
            setCls(clsValue);
          }
        }
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });
    } catch (e) {
      console.warn('CLS observer not supported:', e);
    }

    // 3. First Input Delay (FID) Observer
    let fidObserver: PerformanceObserver | null = null;
    try {
      fidObserver = new PerformanceObserver((entryList) => {
        const firstInput = entryList.getEntries()[0] as any;
        const delay = firstInput.processingStart - firstInput.startTime;
        setFid(delay);
      });
      fidObserver.observe({ type: 'first-input', buffered: true });
    } catch (e) {
      console.warn('FID observer not supported:', e);
    }

    // 4. Long Tasks Observer (Proxy for TBT and indicator of main thread blocks)
    let longTasks: number = 0;
    let maxTaskDuration: number = 0;
    let longTaskObserver: PerformanceObserver | null = null;
    try {
      longTaskObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        longTasks += entries.length;
        setLongTasksCount(longTasks);
        
        for (const entry of entries) {
          if (entry.duration > maxTaskDuration) {
            maxTaskDuration = entry.duration;
            setMaxLongTaskDuration(maxTaskDuration);
          }
        }
      });
      longTaskObserver.observe({ type: 'longtask', buffered: true });
    } catch (e) {
      console.warn('Long Tasks observer not supported:', e);
    }

    return () => {
      lcpObserver?.disconnect();
      clsObserver?.disconnect();
      fidObserver?.disconnect();
      longTaskObserver?.disconnect();
    };
  }, [testRunId]);

  // Color coding helper for Web Vitals grading
  const getMetricGrade = (type: 'LCP' | 'FID' | 'CLS', val: number) => {
    if (type === 'LCP') {
      if (val === 0) return { text: 'N/A', class: 'grade-na' };
      if (val < 1200) return { text: 'GOOD (🚀 < 1.2s)', class: 'grade-good' };
      if (val < 2500) return { text: 'NEEDS IMPROVEMENT', class: 'grade-warning' };
      return { text: 'POOR (🛑 > 2.5s)', class: 'grade-poor' };
    }
    if (type === 'FID') {
      if (val === 0) return { text: 'GOOD (🚀 < 50ms)', class: 'grade-good' }; // Defaults to good if no clicks yet
      if (val < 50) return { text: 'GOOD (🚀 < 50ms)', class: 'grade-good' };
      if (val < 100) return { text: 'NEEDS IMPROVEMENT', class: 'grade-warning' };
      return { text: 'POOR (🛑 > 100ms)', class: 'grade-poor' };
    }
    // CLS
    if (val < 0.05) return { text: 'GOOD (🚀 < 0.05)', class: 'grade-good' };
    if (val < 0.1) return { text: 'NEEDS IMPROVEMENT', class: 'grade-warning' };
    return { text: 'POOR (🛑 > 0.10)', class: 'grade-poor' };
  };

  const lcpGrade = getMetricGrade('LCP', lcp);
  const fidGrade = getMetricGrade('FID', fid);
  const clsGrade = getMetricGrade('CLS', cls);

  return (
    <div className="metrics-dashboard">
      <div className="dashboard-title">
        <Zap style={{ width: '18px', color: 'var(--color-primary)' }} />
        <h4>Real-Time Chrome Web Vitals Profiler</h4>
      </div>

      <div className="metrics-grid">
        {/* Metric Card: LCP */}
        <div className={`metric-card ${lcpGrade.class}`}>
          <div className="metric-header">
            <span>Largest Contentful Paint (LCP)</span>
            <span className="metric-badge">Tải ảnh đầu trang</span>
          </div>
          <div className="metric-value">
            {lcp === 0 ? 'Loading...' : `${(lcp / 1000).toFixed(2)}s`}
          </div>
          <div className="metric-grade-label">{lcpGrade.text}</div>
          <div className="metric-info-bar">Thời điểm phần tử đồ họa lớn nhất xuất hiện trên màn hình.</div>
        </div>

        {/* Metric Card: CLS */}
        <div className={`metric-card ${clsGrade.class}`}>
          <div className="metric-header">
            <span>Cumulative Layout Shift (CLS)</span>
            <span className="metric-badge">Bo cục giật cục</span>
          </div>
          <div className="metric-value">{cls.toFixed(4)}</div>
          <div className="metric-grade-label">{clsGrade.text}</div>
          <div className="metric-info-bar">Đo lường độ dịch chuyển bất ngờ của các phần tử khi tải trang.</div>
        </div>

        {/* Metric Card: FID */}
        <div className={`metric-card ${fidGrade.class}`}>
          <div className="metric-header">
            <span>First Input Delay (FID / INP Proxy)</span>
            <span className="metric-badge">Phản hồi click</span>
          </div>
          <div className="metric-value">
            {fid === 0 && longTasksCount > 0 
              ? `${maxLongTaskDuration.toFixed(0)}ms (Est.)` 
              : `${fid.toFixed(0)}ms`}
          </div>
          <div className="metric-grade-label">{fidGrade.text}</div>
          <div className="metric-info-bar">Độ trễ phản hồi khi người dùng tương tác lần đầu với trang.</div>
        </div>
      </div>

      {/* Main Thread blocking metrics */}
      <div className="main-thread-stats">
        <div className="stat-row">
          <Sliders className="stat-icon" />
          <span>Long Tasks phát hiện trên Main Thread (TBT Proxy):</span>
          <strong>{longTasksCount} lần</strong>
        </div>
        <div className="stat-row">
          <AlertTriangle className="stat-icon" />
          <span>Tác vụ chặn luồng chính lâu nhất (Max Blocking):</span>
          <strong style={{ color: maxLongTaskDuration > 50 ? 'var(--color-danger)' : 'var(--color-success)' }}>
            {maxLongTaskDuration.toFixed(0)}ms
          </strong>
        </div>
      </div>
    </div>
  );
};
export default MetricsDisplay;
