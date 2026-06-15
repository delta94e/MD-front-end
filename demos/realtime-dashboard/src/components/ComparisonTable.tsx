import React from 'react';

export default function ComparisonTable() {
  const specs = [
    {
      metric: 'Giao thức truyền dẫn',
      polling: 'HTTP/1.1 or HTTP/2 (Short-lived requests)',
      sse: 'HTTP/1.1 or HTTP/2 (Persistent HTTP stream)',
      ws: 'WebSocket Protocol (ws:// / wss://) upgraded from HTTP'
    },
    {
      metric: 'Hướng truyền dữ liệu',
      polling: 'Một chiều (Client-to-Server pull)',
      sse: 'Một chiều (Server-to-Client push)',
      ws: 'Hai chiều (Bi-directional full-duplex)'
    },
    {
      metric: 'Chi phí Handshake & Header',
      polling: 'Rất cao (Lặp lại full HTTP headers 500B-1KB trên mỗi request)',
      sse: 'Thấp (Chỉ thực hiện 1 lần HTTP handshake duy nhất khi kết nối)',
      ws: 'Thấp (Chỉ thực hiện 1 lần HTTP upgrade handshake duy nhất)'
    },
    {
      metric: 'Độ trễ cập nhật (Latency)',
      polling: 'Cao (Phụ thuộc vào khoảng thời gian Polling, trung bình ~ interval/2)',
      sse: 'Cực thấp (Sub-millisecond, server đẩy ngay khi có dữ liệu)',
      ws: 'Cực thấp (Sub-millisecond, tối ưu hóa qua TCP frames)'
    },
    {
      metric: 'Cơ chế Reconnection',
      polling: 'Tự nhiên (Mỗi request độc lập, tự phục hồi)',
      sse: 'Tự động (Browser xử lý kèm theo gửi Last-Event-ID)',
      ws: 'Thủ công (Client phải tự viết logic Exponential Backoff + Ping)'
    },
    {
      metric: 'Khả năng cache ở Edge (CDN)',
      polling: 'Dễ dàng (HTTP response standard, có thể cache ngắn)',
      sse: 'Khó nhưng khả thi (Fastly Fanout hỗ trợ push CDN)',
      ws: 'Không thể (TCP tunnel trực tiếp không thể cache)'
    },
    {
      metric: 'Khả năng chịu tải (Scale)',
      polling: 'Tải CPU cực lớn trên server do lượng request khổng lồ',
      sse: 'Hỗ trợ 5M+ tốt hơn nhờ multiplexing qua HTTP/2, tốn ít file descriptors',
      ws: 'Tốn tài nguyên RAM/FD để giữ kết nối mở, cần cluster Pub/Sub'
    },
    {
      metric: 'Firewall & Proxy friendly',
      polling: 'Hoàn hảo (Port 80/443 tiêu chuẩn)',
      sse: 'Tốt (HTTP standard)',
      ws: 'Có thể bị chặn bởi một số proxy doanh nghiệp nghiêm ngặt'
    }
  ];

  return (
    <div className="comparison-table-wrapper">
      <h3 className="section-title">So sánh đặc tính kỹ thuật các giao thức</h3>
      <div className="table-responsive">
        <table className="comparison-table">
          <thead>
            <tr>
              <th>Đặc tính</th>
              <th>HTTP Polling</th>
              <th>Server-Sent Events (SSE)</th>
              <th>WebSocket</th>
            </tr>
          </thead>
          <tbody>
            {specs.map((spec, i) => (
              <tr key={i} className="hover-row">
                <td className="spec-metric">{spec.metric}</td>
                <td className="spec-polling">{spec.polling}</td>
                <td className="spec-sse">{spec.sse}</td>
                <td className="spec-ws">{spec.ws}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
