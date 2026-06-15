import React, { useEffect, useState } from 'react';
import { AlertTriangle, AlertCircle } from 'lucide-react';

interface UnoptimizedPageProps {
  onInteractionTriggered: () => void;
}

export const UnoptimizedPage = ({ onInteractionTriggered }: UnoptimizedPageProps) => {
  const [showDelayedBanner, setShowDelayedBanner] = useState(false);
  const [clickResult, setClickResult] = useState<string>('');
  
  // 1. Simulating main-thread blocking on load (FID / INP / TBT block)
  useEffect(() => {
    console.log('[Before] Page loaded. Simulating main thread block for 1200ms...');
    const startTime = performance.now();
    
    // Synchronous CPU blocking loop directly on main thread
    let count = 0;
    const limit = 4000000; // Large number to block execution
    for (let i = 2; i <= limit; i++) {
      let isPrime = true;
      for (let j = 2; j <= Math.sqrt(i); j++) {
        if (i % j === 0) {
          isPrime = false;
          break;
        }
      }
      if (isPrime) count++;
    }
    
    const duration = performance.now() - startTime;
    console.log(`[Before] Main thread blocked for ${duration.toFixed(2)}ms!`);
  }, []);

  // 2. Simulating layout shifts (CLS block)
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowDelayedBanner(true); // Loads layout-shifting box after 800ms
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Synchronous blocking on button click (high FID simulation)
  const handleHeavyClick = () => {
    onInteractionTriggered();
    const startTime = performance.now();
    
    // Block main thread synchronously for 600ms
    const targetTime = startTime + 600;
    while (performance.now() < targetTime) {
      // Synchronous busy loop
    }
    
    setClickResult('Thao tác thành công! (Main thread bị nghẽn 600ms)');
  };

  return (
    <div className="test-canvas unoptimized">
      <div className="canvas-badge bad">Unoptimized Core Web Vitals (Before)</div>

      {/* Case 1: CLS (Cumulative Layout Shift) banner injection */}
      {showDelayedBanner && (
        <div className="cls-banner">
          <AlertCircle style={{ color: 'var(--color-danger)' }} />
          <div>
            <strong>[Layout Shift] Quảng cáo chèn động!</strong>
            <p>Banner này xuất hiện trễ và đẩy toàn bộ văn bản phía dưới xuống, gây ra lỗi CLS lớn.</p>
          </div>
        </div>
      )}

      <h3>Khóa học Lập trình Frontend Nâng cao</h3>
      
      <p className="content-paragraph">
        Chào mừng bạn đến với khóa học chuyên sâu về kiến trúc Frontend. Tại đây chúng ta sẽ nghiên cứu các chủ đề
        về tối ưu hóa trình duyệt, phân tích bundle và thiết kế hệ thống giao diện lớn cho doanh nghiệp.
      </p>

      {/* Case 2: FID/INP long task button */}
      <div className="interactive-test-section">
        <button className="ds-btn ds-btn-danger" onClick={handleHeavyClick}>
          Bấm để thực hiện thanh toán giao dịch (Heavy Sync Task)
        </button>
        {clickResult && <p className="click-feedback-error">{clickResult}</p>}
      </div>

      <p className="content-paragraph">
        Để hiểu rõ hơn về cách trình duyệt dựng hình, chúng ta cần tìm hiểu về các giai đoạn: Parse HTML, CSSOM, 
        Render Tree, Layout, Paint, Composite. Bất kỳ tiến trình JavaScript nào chạy lâu hơn 50ms đều chặn luồng 
        chính và trì hoãn thời gian phản hồi giao diện.
      </p>

      {/* Case 3: LCP (Largest Contentful Paint) - Huge unoptimized image */}
      <div className="lcp-image-section">
        <h4>Largest Contentful Paint (LCP) Image Area</h4>
        <div className="unoptimized-image-container">
          {/* Loaded from a high-resolution, uncompressed source without dimensions pre-allocated */}
          <img 
            src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2500" 
            alt="Huge Outer Space"
            className="huge-lcp-img"
          />
        </div>
      </div>
    </div>
  );
};
export default UnoptimizedPage;
