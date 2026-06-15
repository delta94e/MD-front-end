import React, { useState, useEffect, useRef } from 'react';
import { 
  Wifi, 
  Radio, 
  Server, 
  Activity, 
  Cpu, 
  Database, 
  RefreshCw, 
  Play, 
  Pause, 
  AlertOctagon, 
  ShieldAlert, 
  ArrowRight,
  Gauge
} from 'lucide-react';
import ComparisonTable from './components/ComparisonTable.tsx';

interface Region {
  name: string;
  load: number;
  active: number;
}

interface Metrics {
  timestamp: number;
  subscribers: number;
  tps: number;
  cpu: number;
  memory: number;
  activeConnections: number;
  latency: number;
  regions: Region[];
}

interface LogEntry {
  time: string;
  protocol: string;
  bytes: number;
  message: string;
}

export default function App() {
  const [protocol, setProtocol] = useState<'polling' | 'sse' | 'websocket'>('websocket');
  const [isActive, setIsActive] = useState<boolean>(true);
  const [intervalMs, setIntervalMs] = useState<number>(200); // For polling and websocket
  const [isThrottled, setIsThrottled] = useState<boolean>(true); // Client-side performance optimization
  
  // App metrics
  const [data, setData] = useState<Metrics | null>(null);
  const [msgCount, setMsgCount] = useState<number>(0);
  const [renderCount, setRenderCount] = useState<number>(0);
  const [totalBytes, setTotalBytes] = useState<number>(0);
  const [liveLogs, setLiveLogs] = useState<LogEntry[]>([]);
  
  // Connection statuses
  const [connStatus, setConnStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');

  // Refs for throttling & connections
  const wsRef = useRef<WebSocket | null>(null);
  const sseRef = useRef<EventSource | null>(null);
  const pollingIntervalRef = useRef<number | null>(null);
  const bufferRef = useRef<Metrics | null>(null);
  const batchIntervalRef = useRef<number | null>(null);
  const rafPendingRef = useRef<boolean>(false);
  const prevTimeRef = useRef<number>(Date.now());
  const speedRef = useRef<number>(200);

  // Increment render counter on every render
  useEffect(() => {
    setRenderCount(prev => prev + 1);
  });

  // Keep ref up to date
  useEffect(() => {
    speedRef.current = intervalMs;
  }, [intervalMs]);

  // Log incoming events
  const addLog = (protocolName: string, bytes: number, message: string) => {
    const now = new Date();
    const timeStr = `${now.toTimeString().split(' ')[0]}.${String(now.getMilliseconds()).padStart(3, '0')}`;
    setLiveLogs(prev => [
      { time: timeStr, protocol: protocolName, bytes, message },
      ...prev.slice(0, 19) // Keep last 20 logs
    ]);
  };

  // Process data incoming from any channel
  const handleIncomingData = (incoming: Metrics, sizeBytes: number) => {
    setMsgCount(prev => prev + 1);
    setTotalBytes(prev => prev + sizeBytes);

    if (isThrottled) {
      // BUFFER & BATCHING: Save to buffer, defer UI update
      bufferRef.current = incoming;
      
      if (!rafPendingRef.current) {
        rafPendingRef.current = true;
        requestAnimationFrame(() => {
          if (bufferRef.current) {
            setData(bufferRef.current);
          }
          rafPendingRef.current = false;
        });
      }
    } else {
      // UNOPTIMIZED: Update state immediately (triggers re-render on every message)
      setData(incoming);
    }
  };

  // Main connection management
  useEffect(() => {
    // Clear all existing connections/timers
    cleanupConnections();
    
    if (!isActive) {
      setConnStatus('disconnected');
      return;
    }

    setConnStatus('connecting');
    const bytesEstimated = 320; // Avg JSON payload size in bytes

    if (protocol === 'polling') {
      addLog('HTTP Polling', 0, `Khởi tạo Polling với chu kỳ ${intervalMs}ms...`);
      
      const fetchPollingData = async () => {
        try {
          const res = await fetch('http://localhost:3006/api/polling');
          const json = await res.json();
          // Polling has HTTP Header overhead (~850B headers + ~320B body)
          handleIncomingData(json, 850 + bytesEstimated);
          setConnStatus('connected');
        } catch (err) {
          console.error(err);
          setConnStatus('disconnected');
        }
      };

      fetchPollingData();
      const interval = window.setInterval(fetchPollingData, intervalMs);
      pollingIntervalRef.current = interval;

    } else if (protocol === 'sse') {
      addLog('SSE', 0, 'Đang mở kết nối EventSource...');
      
      const sse = new EventSource('http://localhost:3006/api/sse');
      sseRef.current = sse;

      sse.onopen = () => {
        setConnStatus('connected');
        addLog('SSE', 0, 'Đã kết nối qua HTTP stream!');
      };

      sse.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'connected') {
            addLog('SSE', event.data.length, 'Nhận sự kiện connected từ Server');
          } else if (message.type === 'update') {
            handleIncomingData(message.data, event.data.length);
          }
        } catch (e) {
          console.error(e);
        }
      };

      sse.onerror = (e) => {
        console.error('SSE Error:', e);
        setConnStatus('disconnected');
      };

    } else if (protocol === 'websocket') {
      addLog('WS', 0, 'Đang mở kết nối WebSocket...');
      
      const ws = new WebSocket('ws://localhost:3006/api/ws');
      wsRef.current = ws;

      ws.onopen = () => {
        setConnStatus('connected');
        addLog('WS', 0, 'Đã mở WebSocket socket!');
        // Send initial interval configuration
        ws.send(JSON.stringify({ type: 'config', interval: intervalMs }));
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'connected') {
            addLog('WS', event.data.length, 'Nhận handshake ACK từ WebSocket Server');
          } else if (message.type === 'config_ack') {
            addLog('WS', event.data.length, `Server xác nhận đổi tần suất stream: ${message.interval}ms`);
          } else if (message.type === 'update') {
            // WS frame overhead is very small (~2 bytes overhead)
            handleIncomingData(message.data, 2 + event.data.length);
          }
        } catch (e) {
          console.error(e);
        }
      };

      ws.onclose = () => {
        setConnStatus('disconnected');
        addLog('WS', 0, 'WebSocket đã đóng kết nối.');
      };

      ws.onerror = (e) => {
        console.error('WS Error:', e);
        setConnStatus('disconnected');
      };
    }

    return () => {
      cleanupConnections();
    };
  }, [protocol, isActive]);

  // Handle Dynamic Interval updates for WebSockets
  useEffect(() => {
    if (protocol === 'websocket' && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'config', interval: intervalMs }));
    }
  }, [intervalMs, protocol]);

  const cleanupConnections = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    if (sseRef.current) {
      sseRef.current.close();
      sseRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  // Reset metrics counters
  const handleResetCounters = () => {
    setMsgCount(0);
    setRenderCount(0);
    setTotalBytes(0);
    setLiveLogs([]);
  };

  // Utility to format bytes
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="app-container">
      {/* HEADER */}
      <header className="app-header">
        <div className="header-brand">
          <div className="logo-glow">
            <Activity className="icon-pulse text-cyan" size={28} />
          </div>
          <div>
            <h1>Real-Time Live Dashboard</h1>
            <p className="subtitle">Interactive Testing Sandbox: WebSocket vs SSE vs HTTP Polling</p>
          </div>
        </div>
        <div className="header-status">
          <span className={`status-badge ${connStatus}`}>
            <span className="pulse-dot"></span>
            {connStatus === 'connected' ? 'CONNECTED' : connStatus === 'connecting' ? 'CONNECTING...' : 'DISCONNECTED'}
          </span>
          <button 
            className={`btn-play-pause ${isActive ? 'active' : 'paused'}`}
            onClick={() => setIsActive(!isActive)}
            title={isActive ? 'Tạm dừng kết nối' : 'Bắt đầu kết nối'}
          >
            {isActive ? <Pause size={18} /> : <Play size={18} />}
            {isActive ? 'Pause Feed' : 'Resume Feed'}
          </button>
        </div>
      </header>

      {/* CORE GRID */}
      <div className="dashboard-grid">
        
        {/* SIDE PANEL: CONTROLS & INFO */}
        <aside className="control-sidebar panel-glow">
          <div className="sidebar-section">
            <h3 className="section-title">Cấu hình kết nối</h3>
            
            <div className="protocol-selector">
              <button 
                className={`protocol-btn ${protocol === 'websocket' ? 'active' : ''}`}
                onClick={() => setProtocol('websocket')}
              >
                <Wifi size={16} />
                <span>WebSocket</span>
              </button>
              
              <button 
                className={`protocol-btn ${protocol === 'sse' ? 'active' : ''}`}
                onClick={() => setProtocol('sse')}
              >
                <Radio size={16} />
                <span>SSE stream</span>
              </button>
              
              <button 
                className={`protocol-btn ${protocol === 'polling' ? 'active' : ''}`}
                onClick={() => setProtocol('polling')}
              >
                <RefreshCw size={16} />
                <span>HTTP Polling</span>
              </button>
            </div>

            <div className="warning-box">
              {protocol === 'websocket' && (
                <p className="protocol-desc">
                  <strong>WebSocket:</strong> Kết nối Full-Duplex hai chiều. Client có thể tùy chỉnh tần suất cập nhật trực tiếp mà không cần khởi tạo lại connection handshake.
                </p>
              )}
              {protocol === 'sse' && (
                <p className="protocol-desc">
                  <strong>Server-Sent Events:</strong> Kết nối một chiều hiệu quả, ổn định, chạy trên HTTP tiêu chuẩn, tích hợp sẵn tự động reconnect và gửi Last-Event-ID. Tần suất cập nhật mặc định từ Server: 200ms.
                </p>
              )}
              {protocol === 'polling' && (
                <p className="protocol-desc yellow">
                  <strong>HTTP Polling:</strong> Client liên tục gửi request HTTP. Tạo ra lượng lớn Overhead Headers trên mỗi request và gây tải nặng cho server.
                </p>
              )}
            </div>
          </div>

          <div className="sidebar-section">
            <div className="section-header-row">
              <h3 className="section-title">Tần suất cập nhật (Interval)</h3>
              <span className="badge-value text-cyan">{intervalMs}ms</span>
            </div>
            <input 
              type="range" 
              min="50" 
              max="2000" 
              step="50"
              value={intervalMs} 
              onChange={(e) => setIntervalMs(Number(e.target.value))}
              className="slider-cyan"
              disabled={protocol === 'sse'} // SSE is server-driven
            />
            {protocol === 'sse' && (
              <span className="input-hint">SSE được cấu hình mặc định 200ms từ server.</span>
            )}
            {protocol !== 'sse' && (
              <span className="input-hint">Kéo slide để giả lập tần suất đẩy dữ liệu cực nhanh.</span>
            )}
          </div>

          <div className="sidebar-section">
            <div className="toggle-container">
              <div>
                <h4 className="toggle-title">Client-side Throttling</h4>
                <p className="toggle-desc">Sử dụng requestAnimationFrame buffer để gom nhóm render giúp tránh nghẽn luồng chính (60fps).</p>
              </div>
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={isThrottled} 
                  onChange={(e) => setIsThrottled(e.target.checked)}
                />
                <span className="slider round"></span>
              </label>
            </div>
            
            <div className={`throttle-indicator ${isThrottled ? 'on' : 'off'}`}>
              <div className="indicator-dot"></div>
              <span>{isThrottled ? 'Optimization Active (rAF Batched)' : 'Optimization Disabled (Raw State Updates)'}</span>
            </div>
          </div>

          <div className="sidebar-section client-perf">
            <h3 className="section-title">Chỉ số truyền tải & Render</h3>
            <div className="perf-grid">
              <div className="perf-card">
                <span className="perf-label">Messages Đã Nhận</span>
                <span className="perf-val text-white">{msgCount}</span>
              </div>
              <div className="perf-card">
                <span className="perf-label">React Renders</span>
                <span className="perf-val text-green">{renderCount}</span>
              </div>
              <div className="perf-card full-width">
                <span className="perf-label">Tỷ lệ Render / Messages</span>
                <div className="progress-bar-container">
                  <div 
                    className={`progress-fill ${isThrottled ? 'green' : 'red'}`}
                    style={{ width: `${Math.min(100, msgCount === 0 ? 0 : (renderCount / msgCount) * 100)}%` }}
                  ></div>
                </div>
                <span className="progress-val">
                  {msgCount === 0 ? '0%' : ((renderCount / msgCount) * 100).toFixed(1)}% {isThrottled ? '(Tối ưu CPU tốt)' : '(Over-rendering!)'}
                </span>
              </div>
              <div className="perf-card">
                <span className="perf-label">Băng thông tích lũy</span>
                <span className="perf-val text-cyan">{formatBytes(totalBytes)}</span>
              </div>
              <div className="perf-card">
                <span className="perf-label">Băng thông hiện tại</span>
                <span className="perf-val text-cyan">
                  {formatBytes(Math.round(totalBytes / (msgCount === 0 ? 1 : (msgCount * (intervalMs / 1000)))))}/s
                </span>
              </div>
            </div>
            <button className="btn-secondary" onClick={handleResetCounters}>Reset Counters</button>
          </div>
        </aside>

        {/* MAIN PANEL: DASHBOARD VIEW */}
        <main className="dashboard-content">
          
          {/* HIGH LEVEL KPIS */}
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-icon-row">
                <Server className="text-cyan" size={20} />
                <span className="kpi-glow cyan"></span>
              </div>
              <span className="kpi-label">Subscribers Hoạt động</span>
              <span className="kpi-val text-cyan">
                {data ? data.subscribers.toLocaleString('vi-VN') : '5.124.930'}
              </span>
              <span className="kpi-trend text-green">+4,850/phút</span>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-row">
                <Activity className="text-emerald" size={20} />
                <span className="kpi-glow emerald"></span>
              </div>
              <span className="kpi-label">Giao dịch / Giây (TPS)</span>
              <span className="kpi-val text-emerald">
                {data ? data.tps.toLocaleString('vi-VN') : '14.250'}
              </span>
              <span className="kpi-trend text-green">+1.2% vs 1h trước</span>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-row">
                <Cpu className="text-purple" size={20} />
                <span className="kpi-glow purple"></span>
              </div>
              <span className="kpi-label">Tải CPU Cụm Server</span>
              <span className="kpi-val text-purple">
                {data ? `${data.cpu}%` : '45%'}
              </span>
              <div className="kpi-progress">
                <div 
                  className="kpi-progress-fill" 
                  style={{ width: data ? `${data.cpu}%` : '45%', backgroundColor: 'var(--color-purple)' }}
                ></div>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-row">
                <Database className="text-amber" size={20} />
                <span className="kpi-glow amber"></span>
              </div>
              <span className="kpi-label">RAM / Trễ Database</span>
              <span className="kpi-val text-amber">
                {data ? `${data.memory}GB / ${data.latency}ms` : '4.8GB / 35ms'}
              </span>
              <span className="kpi-trend text-amber">Cluster Healthy</span>
            </div>
          </div>

          {/* LOWER GRID: CHARTS AND LOGS */}
          <div className="charts-logs-grid">
            
            {/* REGIONAL LOAD SHIFT (animated bars) */}
            <div className="dashboard-panel panel-glow">
              <h3 className="section-title">
                <Gauge size={16} className="text-cyan inline-icon" />
                Tải phân phối khu vực (Region Servers)
              </h3>
              <p className="panel-desc">Phân tải thời gian thực từ 5M+ subscribers đến Edge Node</p>
              
              <div className="regions-list">
                {(data?.regions || [
                  { name: 'US-East (N. Virginia)', load: 45, active: 1804500 },
                  { name: 'EU-West (Frankfurt)', load: 38, active: 1503200 },
                  { name: 'AP-East (Hong Kong)', load: 60, active: 1210800 },
                  { name: 'SA-East (São Paulo)', load: 22, active: 506400 }
                ]).map((reg, idx) => (
                  <div className="region-row" key={idx}>
                    <div className="region-info">
                      <span className="region-name">{reg.name}</span>
                      <span className="region-metrics font-mono text-cyan">
                        {reg.active.toLocaleString('vi-VN')} conns | {reg.load}% CPU
                      </span>
                    </div>
                    <div className="region-bar-bg">
                      <div 
                        className={`region-bar-fill ${reg.load > 70 ? 'high' : reg.load > 50 ? 'medium' : 'low'}`}
                        style={{ width: `${reg.load}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="server-scale-diagram">
                <div className="scale-node active">
                  <span>LB (Nginx/L7)</span>
                </div>
                <ArrowRight size={14} className="text-cyan arrow-bounce" />
                <div className="scale-cluster">
                  <div className="cluster-node">Node 1 (Active)</div>
                  <div className="cluster-node">Node 2 (Active)</div>
                  <div className="cluster-node">Node 3 (Active)</div>
                </div>
                <ArrowRight size={14} className="text-cyan arrow-bounce" />
                <div className="scale-pubsub">
                  <span>Redis Pub/Sub</span>
                </div>
              </div>
            </div>

            {/* REAL-TIME EVENT STREAM LOGS */}
            <div className="dashboard-panel panel-glow">
              <h3 className="section-title">
                <Activity size={16} className="text-cyan inline-icon" />
                Real-Time Data Ingestion Stream
              </h3>
              <p className="panel-desc">Stream logs các bản tin nhận được phía Client</p>
              
              <div className="logs-container font-mono">
                {liveLogs.length === 0 ? (
                  <div className="logs-empty">
                    <AlertOctagon size={24} className="text-muted" />
                    <span>Không có luồng dữ liệu. Bấm nút Play ở góc trên để kết nối.</span>
                  </div>
                ) : (
                  liveLogs.map((log, idx) => (
                    <div className="log-line" key={idx}>
                      <span className="log-time text-muted">[{log.time}]</span>
                      <span className={`log-proto-badge ${log.protocol.toLowerCase().replace(' ', '-')}`}>
                        {log.protocol}
                      </span>
                      <span className="log-bytes text-purple">+{log.bytes}B</span>
                      <span className="log-msg text-white">{log.message}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* DENSE COMPARISON TABLE */}
          <div className="dashboard-panel panel-glow comparison-panel">
            <ComparisonTable />
          </div>

        </main>
      </div>
    </div>
  );
}
