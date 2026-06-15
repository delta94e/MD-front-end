import React, { useEffect, useState, useRef } from 'react';
import { CheckCircle } from 'lucide-react';

interface OptimizedPageProps {
  onInteractionTriggered: () => void;
}

export const OptimizedPage = ({ onInteractionTriggered }: OptimizedPageProps) => {
  const [showDelayedBanner, setShowDelayedBanner] = useState(false);
  const [clickResult, setClickResult] = useState<string>('');
  const [isCalculating, setIsCalculating] = useState(false);
  const workerRef = useRef<Worker | null>(null);

  // Initialize Web Worker for FID/INP offloading
  useEffect(() => {
    // Vite Web Worker loading pattern
    workerRef.current = new Worker(
      new URL('../workers/heavy-task.worker.ts', import.meta.url),
      { type: 'module' }
    );

    workerRef.current.onmessage = (event: MessageEvent) => {
      const { count, duration } = event.data;
      setIsCalculating(false);
      setClickResult(`Giao dịch thành công! Tìm thấy ${count} số nguyên tố trong ${duration.toFixed(0)}ms (Chạy song song dưới Web Worker).`);
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  // Simulating zero layout-shift delayed banner (CLS prevention)
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowDelayedBanner(true); // Loads after 800ms
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Web Worker offloaded task (low FID simulation)
  const handleOptimizedClick = () => {
    onInteractionTriggered();
    if (workerRef.current) {
      setIsCalculating(true);
      setClickResult('Đang tính toán song song dưới Web Worker...');
      workerRef.current.postMessage({ limit: 4000000 }); // Same limit as unoptimized page
    }
  };

  return (
    <div className="test-canvas optimized">
      <div className="canvas-badge good">Optimized Core Web Vitals (After)</div>

      {/* CLS Prevention: Reserve space beforehand using a wrapper wrapper height */}
      <div className="cls-banner-placeholder" style={{ minHeight: showDelayedBanner ? 'auto' : '64px' }}>
        {showDelayedBanner ? (
          <div className="cls-banner success">
            <CheckCircle style={{ color: 'var(--color-success)' }} />
            <div>
              <strong>[No Layout Shift] Banner Quảng Cáo Được Giữ Chỗ!</strong>
              <p>Khung chứa đã được giữ chỗ trước bằng CSS min-height. Các phần tử dưới không hề bị dịch chuyển.</p>
            </div>
          </div>
        ) : (
          <div className="cls-loading-placeholder">Đang tải banner quảng cáo...</div>
        )}
      </div>

      <h3>Khóa học Lập trình Frontend Nâng cao</h3>
      
      <p className="content-paragraph">
        Chào mừng bạn đến với khóa học chuyên sâu về kiến trúc Frontend. Tại đây chúng ta sẽ nghiên cứu các chủ đề
        về tối ưu hóa trình duyệt, phân tích bundle và thiết kế hệ thống giao diện lớn cho doanh nghiệp.
      </p>

      {/* FID/INP Optimization: Asynchronous calculations via Web Worker */}
      <div className="interactive-test-section">
        <button 
          className="ds-btn ds-btn-success" 
          onClick={handleOptimizedClick}
          disabled={isCalculating}
        >
          {isCalculating ? 'Đang giao dịch...' : 'Bấm để thực hiện thanh toán giao dịch (Web Worker)'}
        </button>
        {clickResult && <p className="click-feedback-success">{clickResult}</p>}
      </div>

      <p className="content-paragraph">
        Để hiểu rõ hơn về cách trình duyệt dựng hình, chúng ta cần tìm hiểu về các giai đoạn: Parse HTML, CSSOM, 
        Render Tree, Layout, Paint, Composite. Bất kỳ tiến trình JavaScript nào chạy lâu hơn 50ms đều chặn luồng 
        chính và trì hoãn thời gian phản hồi giao diện.
      </p>

      {/* LCP Optimization: Modern WebP formats with pre-allocated width/height aspects */}
      <div className="lcp-image-section">
        <h4>Largest Contentful Paint (LCP) Image Area</h4>
        <div className="optimized-image-container">
          <img 
            src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800" // Loaded smaller size optimized photo
            alt="Optimized Space"
            className="optimized-lcp-img"
            width="800"
            height="450"
            loading="eager" // Eager because it's Above the Fold (LCP image)
          />
        </div>
      </div>
    </div>
  );
};
export default OptimizedPage;
