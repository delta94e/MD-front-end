import React, { useState, useEffect } from 'react';
import { 
  Button, 
  Card, 
  Select, 
  Tabs, 
  Modal, 
  Alert, 
  Badge, 
  Accordion 
} from './components';
import { MonolithicButton } from './components/before-after/MonolithicButton';
import { MonolithicCard } from './components/before-after/MonolithicCard';
import { MonolithicSelect } from './components/before-after/MonolithicSelect';
import { 
  Sparkles, 
  Settings, 
  Layers, 
  Users, 
  TrendingUp, 
  CheckCircle, 
  AlertTriangle, 
  Layout, 
  Code, 
  Info,
  Calendar,
  CreditCard,
  BarChart,
  Tag,
  Palette,
  Eye
} from 'lucide-react';
import './App.css';

export const App = () => {
  // Global states
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [activePlaygroundTab, setActivePlaygroundTab] = useState('squads');
  
  // Customizer State (dynamic variables applied directly to :root)
  const [primaryColor, setPrimaryColor] = useState('#3b82f6');
  const [baseRadius, setBaseRadius] = useState('8px');
  const [baseSpacing, setBaseSpacing] = useState('16px');
  const [baseFont, setBaseFont] = useState('sans-serif');

  // Squad selection for interactive view
  const [selectedSquad, setSelectedSquad] = useState<'booking' | 'checkout' | 'dashboard' | 'marketing'>('booking');

  // Before/After Interactive State
  const [showBeforeSelectCode, setShowBeforeSelectCode] = useState(false);
  const [showAfterSelectCode, setShowAfterSelectCode] = useState(false);
  const [customSelectValue, setCustomSelectValue] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Apply tokens to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Effect to update primary override css variable
  useEffect(() => {
    document.documentElement.style.setProperty('--color-primary', primaryColor);
    document.documentElement.style.setProperty('--color-primary-hover', adjustColorBrightness(primaryColor, -20));
    document.documentElement.style.setProperty('--color-primary-active', adjustColorBrightness(primaryColor, -40));
    document.documentElement.style.setProperty('--color-primary-light', primaryColor + '15'); // 15 = 8% opacity in hex
  }, [primaryColor]);

  useEffect(() => {
    document.documentElement.style.setProperty('--radius-md', baseRadius);
    const radiusNum = parseInt(baseRadius);
    document.documentElement.style.setProperty('--radius-sm', `${radiusNum / 2}px`);
    document.documentElement.style.setProperty('--radius-lg', `${radiusNum * 2}px`);
  }, [baseRadius]);

  useEffect(() => {
    document.documentElement.style.setProperty('--spacing-md', baseSpacing);
    const spacingNum = parseInt(baseSpacing);
    document.documentElement.style.setProperty('--spacing-xs', `${spacingNum / 4}px`);
    document.documentElement.style.setProperty('--spacing-sm', `${spacingNum / 2}px`);
    document.documentElement.style.setProperty('--spacing-lg', `${spacingNum * 1.5}px`);
    document.documentElement.style.setProperty('--spacing-xl', `${spacingNum * 2}px`);
  }, [baseSpacing]);

  useEffect(() => {
    document.documentElement.style.setProperty('--font-sans', baseFont);
  }, [baseFont]);

  // Helper color adjuster
  const adjustColorBrightness = (hex: string, percent: number) => {
    let R = parseInt(hex.substring(1, 3), 16);
    let G = parseInt(hex.substring(3, 5), 16);
    let B = parseInt(hex.substring(5, 7), 16);

    R = Math.max(0, Math.min(255, R + percent));
    G = Math.max(0, Math.min(255, G + percent));
    B = Math.max(0, Math.min(255, B + percent));

    const rHex = R.toString(16).padStart(2, '0');
    const gHex = G.toString(16).padStart(2, '0');
    const bHex = B.toString(16).padStart(2, '0');

    return `#${rHex}${gHex}${bHex}`;
  };

  return (
    <div className="playground-app">
      {/* Top Premium Navbar */}
      <header className="playground-navbar">
        <div className="nav-brand">
          <Sparkles className="brand-logo" />
          <div>
            <h1>Orbit Design System</h1>
            <span className="brand-subtitle">Enterprise Composable Framework (50+ Components)</span>
          </div>
        </div>
        
        <div className="nav-actions">
          <div className="stats-badges">
            <div className="stat-badge">
              <Users className="stat-icon" />
              <span>Adopted by <strong>4 Squads</strong></span>
            </div>
            <div className="stat-badge success">
              <TrendingUp className="stat-icon" />
              <span>UI Dev Time <strong>-40%</strong></span>
            </div>
          </div>
          
          <button 
            className="theme-toggle" 
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            aria-label="Toggle dark mode"
          >
            {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
          </button>
        </div>
      </header>

      <main className="playground-main ds-container">
        
        {/* Dynamic Theme Customizer (Left Sidebar) */}
        <section className="playground-sidebar">
          <Card bordered shadow="md">
            <Card.Header>
              <Card.Title>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Palette style={{ width: '18px' }} />
                  Theme Customizer
                </div>
              </Card.Title>
              <Card.Description>Tinh chỉnh các biến Design Tokens thời gian thực</Card.Description>
            </Card.Header>
            <Card.Body>
              <div className="customizer-controls">
                <div className="control-group">
                  <label htmlFor="primary-color">Màu thương hiệu chính (Primary)</label>
                  <div className="color-picker-wrapper">
                    <input 
                      type="color" 
                      id="primary-color" 
                      value={primaryColor} 
                      onChange={(e) => setPrimaryColor(e.target.value)} 
                    />
                    <input 
                      type="text" 
                      value={primaryColor} 
                      onChange={(e) => setPrimaryColor(e.target.value)} 
                      maxLength={7}
                    />
                  </div>
                </div>

                <div className="control-group">
                  <label htmlFor="border-radius">Border Radius (Bo góc)</label>
                  <select 
                    id="border-radius" 
                    value={baseRadius} 
                    onChange={(e) => setBaseRadius(e.target.value)}
                  >
                    <option value="0px">Sharp (0px)</option>
                    <option value="4px">Compact (4px)</option>
                    <option value="8px">Regular (8px)</option>
                    <option value="12px">Rounded (12px)</option>
                    <option value="20px">Organic (20px)</option>
                  </select>
                </div>

                <div className="control-group">
                  <label htmlFor="spacing">Khoảng cách gốc (Spacing scale)</label>
                  <select 
                    id="spacing" 
                    value={baseSpacing} 
                    onChange={(e) => setBaseSpacing(e.target.value)}
                  >
                    <option value="12px">Tight (12px)</option>
                    <option value="16px">Normal (16px)</option>
                    <option value="20px">Cozy (20px)</option>
                    <option value="24px">Spacious (24px)</option>
                  </select>
                </div>

                <div className="control-group">
                  <label htmlFor="font-family">Phông chữ (Typography)</label>
                  <select 
                    id="font-family" 
                    value={baseFont} 
                    onChange={(e) => setBaseFont(e.target.value)}
                  >
                    <option value="system-ui, sans-serif">System Sans</option>
                    <option value="'Inter', sans-serif">Inter</option>
                    <option value="'Plus Jakarta Sans', sans-serif">Plus Jakarta</option>
                    <option value="'Courier New', monospace">Courier (Monospace)</option>
                  </select>
                </div>
              </div>

              <div className="customizer-footer-note">
                <Info className="info-icon" />
                <p>Các thay đổi trên sẽ lập tức ghi đè lên các CSS variables ở cấp độ toàn cục (:root).</p>
              </div>
            </Card.Body>
          </Card>
        </section>

        {/* Content Area (Right) */}
        <section className="playground-content">
          <Tabs value={activePlaygroundTab} onChange={setActivePlaygroundTab}>
            <Tabs.List>
              <Tabs.Trigger value="squads">
                <Users style={{ width: '16px', height: '16px' }} />
                Product Teams Adoption (4 Squads)
              </Tabs.Trigger>
              <Tabs.Trigger value="beforeafter">
                <Code style={{ width: '16px', height: '16px' }} />
                Before vs After (40% Time Saved)
              </Tabs.Trigger>
              <Tabs.Trigger value="components-spec">
                <Layout style={{ width: '16px', height: '16px' }} />
                Core Components Showcase
              </Tabs.Trigger>
            </Tabs.List>

            {/* TAB 1: 4 Product Squads Adoption Showcase */}
            <Tabs.Content value="squads">
              <div className="tab-intro">
                <h3>Thử nghiệm tích hợp đa dự án (Adopted by 4 Teams)</h3>
                <p>
                  Mô phỏng 4 đội phát triển khác nhau kế thừa chung một thư viện component. Bằng cách định cấu hình 
                  thuộc tính <code>data-squad</code> cho mỗi container, các component bên trong sẽ tự động đồng bộ theo 
                  nhận diện thương hiệu của từng Squad nhưng vẫn duy trì cấu trúc nhất quán.
                </p>
              </div>

              {/* Squad Selector buttons */}
              <div className="squad-selectors">
                <Button 
                  variant={selectedSquad === 'booking' ? 'primary' : 'outline'} 
                  onClick={() => setSelectedSquad('booking')}
                  leftIcon={<Calendar style={{ width: '16px' }} />}
                >
                  Squad Booking
                </Button>
                <Button 
                  variant={selectedSquad === 'checkout' ? 'primary' : 'outline'} 
                  onClick={() => setSelectedSquad('checkout')}
                  leftIcon={<CreditCard style={{ width: '16px' }} />}
                >
                  Squad Checkout
                </Button>
                <Button 
                  variant={selectedSquad === 'dashboard' ? 'primary' : 'outline'} 
                  onClick={() => setSelectedSquad('dashboard')}
                  leftIcon={<BarChart style={{ width: '16px' }} />}
                >
                  Squad Dashboard
                </Button>
                <Button 
                  variant={selectedSquad === 'marketing' ? 'primary' : 'outline'} 
                  onClick={() => setSelectedSquad('marketing')}
                  leftIcon={<Tag style={{ width: '16px' }} />}
                >
                  Squad Marketing
                </Button>
              </div>

              {/* Scoped Squad container simulating another app instance */}
              <div className="squad-canvas-wrapper">
                <div className="canvas-header">
                  <div className="squad-info">
                    <span className="bullet-indicator" style={{ backgroundColor: 'var(--color-primary)' }}></span>
                    <strong>Squad Application Window:</strong> 
                    <Badge variant="primary">{selectedSquad.toUpperCase()} TEAM</Badge>
                  </div>
                  <div className="squad-spec-tags">
                    <span>Radius: <code>var(--radius-md)</code></span>
                    <span>Primary Color: <code style={{ color: 'var(--color-primary)' }}>var(--color-primary)</code></span>
                  </div>
                </div>

                {/* Scoped attribute data-squad dynamically handles override styles in index.css */}
                <div className="squad-canvas-body" data-squad={selectedSquad}>
                  {selectedSquad === 'booking' && (
                    <div className="squad-booking-app">
                      <Card shadow="md">
                        <Card.Header>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Card.Title>Book Your Flight</Card.Title>
                            <Badge variant="success">Active Promo</Badge>
                          </div>
                          <Card.Description>Singapore (SIN) to Hanoi (HAN) - Round Trip</Card.Description>
                        </Card.Header>
                        <Card.Body>
                          <div className="flight-details-list">
                            <div className="flight-row">
                              <span>Departure Flight: SQ 176</span>
                              <strong>10 Jun, 09:20</strong>
                            </div>
                            <div className="flight-row">
                              <span>Return Flight: SQ 175</span>
                              <strong>15 Jun, 18:30</strong>
                            </div>
                          </div>
                        </Card.Body>
                        <Card.Footer>
                          <Button variant="ghost">Save Draft</Button>
                          <Button variant="primary">Confirm Flights ➔</Button>
                        </Card.Footer>
                      </Card>
                    </div>
                  )}

                  {selectedSquad === 'checkout' && (
                    <div className="squad-checkout-app">
                      <Card shadow="lg" bordered>
                        <Card.Header>
                          <Card.Title>Secure Checkout</Card.Title>
                          <Card.Description>Đơn hàng được bảo mật bởi Singtel Payment</Card.Description>
                        </Card.Header>
                        <Card.Body style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <Alert variant="success" title="Secure Connection">
                            Tất cả dữ liệu giao dịch đã được mã hóa TLS 1.3.
                          </Alert>
                          <div className="price-item">
                            <span>Subtotal:</span>
                            <strong>$149.00 SGD</strong>
                          </div>
                        </Card.Body>
                        <Card.Footer>
                          <Button variant="outline" style={{ flex: 1 }}>Hủy thanh toán</Button>
                          <Button variant="success" style={{ flex: 1 }}>Pay Securely Now</Button>
                        </Card.Footer>
                      </Card>
                    </div>
                  )}

                  {selectedSquad === 'dashboard' && (
                    <div className="squad-dashboard-app">
                      <div className="dashboard-grid">
                        <Card shadow="sm">
                          <Card.Header>
                            <Card.Title>Real-time Metrics</Card.Title>
                            <Card.Description>Monthly performance analytics</Card.Description>
                          </Card.Header>
                          <Card.Body>
                            <div className="stat-large">$84,290 <span className="stat-percent">+12.4%</span></div>
                            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '8px' }}>
                              Tổng số lượt tải về và doanh số tháng này đã vượt qua chỉ tiêu đề ra của Squad Analytics.
                            </p>
                          </Card.Body>
                        </Card>
                        
                        <div style={{ marginTop: '16px' }}>
                          <Accordion>
                            <Accordion.Item value="item-1">
                              <Accordion.Header>Xem dữ liệu chi tiết của 4 quý</Accordion.Header>
                              <Accordion.Panel>
                                Báo cáo tài chính quý 1: tăng trưởng 8%. Báo cáo tài chính quý 2: tăng trưởng 12%.
                              </Accordion.Panel>
                            </Accordion.Item>
                            <Accordion.Item value="item-2">
                              <Accordion.Header>Cách thức thu thập chỉ số</Accordion.Header>
                              <Accordion.Panel>
                                Chỉ số được thu thập thông qua hệ thống log tập trung, tổng hợp theo chu kỳ 5 phút.
                              </Accordion.Panel>
                            </Accordion.Item>
                          </Accordion>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedSquad === 'marketing' && (
                    <div className="squad-marketing-app">
                      <Card shadow="lg" style={{ border: '2px solid var(--color-primary)' }}>
                        <Card.Header>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <Badge variant="danger" pill>HOT PROMO</Badge>
                            <Card.Title>Summer Sale Alert!</Card.Title>
                          </div>
                          <Card.Description>Nhận ngay chiết khấu 40% cho tất cả các dịch vụ trong tuần này.</Card.Description>
                        </Card.Header>
                        <Card.Body>
                          <Alert variant="warning" title="Thời gian có hạn">
                            Chương trình khuyến mãi sẽ kết thúc vào lúc 24:00 ngày Chủ Nhật. Đừng bỏ lỡ!
                          </Alert>
                        </Card.Body>
                        <Card.Footer>
                          <Button variant="danger" style={{ width: '100%' }}>Lấy mã giảm giá ngay 🏷️</Button>
                        </Card.Footer>
                      </Card>
                    </div>
                  )}
                </div>
              </div>
            </Tabs.Content>

            {/* TAB 2: Before vs After comparisons */}
            <Tabs.Content value="beforeafter">
              <div className="tab-intro">
                <h3>Before vs After: Sức mạnh của Composable Architecture</h3>
                <p>
                  So sánh trực quan hai trường phái thiết kế component. 
                  <strong> Monolithic (Cũ)</strong> sử dụng prop-configuration khổng lồ, cứng nhắc và dễ gãy vỡ. 
                  <strong> Composable (Mới)</strong> sử dụng mô hình compound components ghép nối linh hoạt thông qua React Context.
                </p>
              </div>

              {/* Case 1: Customizing Card Layout */}
              <div className="before-after-case-card">
                <div className="case-title-row">
                  <Badge variant="secondary">Case 1</Badge>
                  <h4>Yêu cầu từ Business: Thay đổi vị trí ảnh, chèn Badge và chỉnh sửa Footer nút bấm</h4>
                </div>

                <div className="case-grid">
                  {/* Before Monolithic Column */}
                  <div className="case-col">
                    <div className="col-badge bad">BEFORE (Monolithic Card)</div>
                    <div className="col-desc">
                      Chỉ có thể thay đổi bằng cách thêm prop mới. Đòi hỏi thay đổi cấu trúc bên trong component gốc.
                    </div>
                    
                    <div className="case-preview">
                      <MonolithicCard 
                        title="Voucher Du Lịch Hè"
                        description="Khám phá ngay vịnh Hạ Long trọn gói 3 ngày 2 đêm cùng gia đình."
                        imageUrl="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500"
                        imagePosition="bottom"
                        badgeText="HOT"
                        badgeColor="#ef4444"
                        buttonText="Đặt ngay"
                        extraButtonText="Tìm hiểu thêm"
                        showFooterLine={true}
                        footerText="Còn 5 voucher"
                        titleAlign="center"
                      />
                    </div>

                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setShowBeforeSelectCode(!showBeforeSelectCode)}
                      style={{ marginTop: '12px' }}
                    >
                      {showBeforeSelectCode ? 'Ẩn Mã Nguồn' : 'Xem Mã Nguồn Props Explosion'}
                    </Button>
                    
                    {showBeforeSelectCode && (
                      <pre className="code-block-preview">
{`// Prop configuration phức tạp và cứng nhắc
<MonolithicCard 
  title="Voucher Du Lịch Hè"
  description="Khám phá ngay..."
  imageUrl="/beach.jpg"
  imagePosition="bottom" // Vị trí ảnh bị cố định theo prop
  badgeText="HOT"
  badgeColor="#ef4444"
  buttonText="Đặt ngay"
  extraButtonText="Tìm hiểu thêm"
  showFooterLine={true}
  footerText="Còn 5 voucher"
  titleAlign="center"
/>

// LƯU Ý: Nếu Product Team muốn chèn thêm icon
// vào bên cạnh Title, họ sẽ BỊ TẮC và phải yêu cầu
// Core Team thêm prop: titleIconName?, showTitleIcon?...`}
                      </pre>
                    )}
                  </div>

                  {/* After Composable Column */}
                  <div className="case-col">
                    <div className="col-badge good">AFTER (Composable Card.Header / Body / Footer)</div>
                    <div className="col-desc">
                      Không cần cấu hình prop phức tạp. Product team tự ghép nối component như xếp Lego.
                    </div>
                    
                    <div className="case-preview">
                      <Card shadow="md">
                        <Card.Header>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>🎁</span>
                              <Card.Title>Voucher Du Lịch Hè</Card.Title>
                            </div>
                            <Badge variant="danger">HOT</Badge>
                          </div>
                          <Card.Description>Khám phá ngay vịnh Hạ Long trọn gói 3 ngày 2 đêm cùng gia đình.</Card.Description>
                        </Card.Header>
                        
                        {/* Thay đổi thứ tự thoải mái: đưa ảnh xuống dưới Header dễ dàng */}
                        <img 
                          src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500" 
                          alt="Hạ Long" 
                          style={{ width: '100%', height: '150px', objectFit: 'cover' }} 
                        />
                        
                        <Card.Footer>
                          <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginRight: 'auto' }}>Còn 5 voucher</span>
                          <Button size="sm" variant="outline">Tìm hiểu thêm</Button>
                          <Button size="sm" variant="danger">Đặt ngay</Button>
                        </Card.Footer>
                      </Card>
                    </div>

                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setShowAfterSelectCode(!showAfterSelectCode)}
                      style={{ marginTop: '12px' }}
                    >
                      {showAfterSelectCode ? 'Ẩn Mã Nguồn' : 'Xem Mã Nguồn Lego Composition'}
                    </Button>
                    
                    {showAfterSelectCode && (
                      <pre className="code-block-preview">
{`// Tự do ghép nối layout không giới hạn prop
<Card shadow="md">
  <Card.Header>
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', gap: '6px' }}>
        <span>🎁</span> {/* Thêm icon tự do */}
        <Card.Title>Voucher Du Lịch Hè</Card.Title>
      </div>
      <Badge variant="danger">HOT</Badge>
    </div>
    <Card.Description>Khám phá ngay...</Card.Description>
  </Card.Header>
  
  {/* Đặt thẻ img ở giữa Header và Footer tuỳ ý */}
  <img src="/beach.jpg" alt="Hạ Long" />
  
  <Card.Footer>
    <span style={{ marginRight: 'auto' }}>Còn 5 voucher</span>
    <Button size="sm" variant="outline">Tìm hiểu thêm</Button>
    <Button size="sm" variant="danger">Đặt ngay</Button>
  </Card.Footer>
</Card>`}
                      </pre>
                    )}
                  </div>
                </div>
              </div>

              {/* Case 2: Customizing Dropdowns */}
              <div className="before-after-case-select" style={{ marginTop: '32px' }}>
                <div className="case-title-row">
                  <Badge variant="secondary">Case 2</Badge>
                  <h4>Yêu cầu: Dropdown hiển thị danh sách nhân viên kèm Email (Subtext) và Badge Trạng thái</h4>
                </div>

                <div className="case-grid">
                  <div className="case-col">
                    <div className="col-badge bad">BEFORE (Monolithic JSON Select)</div>
                    <div className="col-desc">
                      Rigid JSON options. Không thể chèn thêm subtext hoặc icon vào từng Option nếu component gốc không thiết kế sẵn.
                    </div>
                    <div className="case-preview" style={{ minHeight: '180px' }}>
                      <MonolithicSelect 
                        value={customSelectValue}
                        onChange={setCustomSelectValue}
                        placeholder="Chọn nhân viên..."
                        options={[
                          { value: 'huynha', label: 'Huỳnh Anh' },
                          { value: 'trungh', label: 'Trung Huỳnh' },
                          { value: 'minhn', label: 'Minh Nguyễn' },
                        ]}
                      />
                    </div>
                  </div>

                  <div className="case-col">
                    <div className="col-badge good">AFTER (Compound Select & Options Context)</div>
                    <div className="col-desc">
                      Tự do tuỳ biến cây DOM của Option. Cho phép chèn Avatar, Email, Badge trạng thái mà không cần đổi mã nguồn Select.
                    </div>
                    <div className="case-preview" style={{ minHeight: '180px' }}>
                      <Select value={customSelectValue} onChange={setCustomSelectValue}>
                        <Select.Trigger placeholder="Chọn nhân viên..." />
                        <Select.List>
                          <Select.Option value="huynha">
                            Huỳnh Anh
                          </Select.Option>
                          {/* Option nâng cao: Custom cấu trúc bên trong */}
                          <div 
                            className="ds-select-option" 
                            onClick={() => setCustomSelectValue('trungh')}
                            style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center',
                              backgroundColor: customSelectValue === 'trungh' ? 'var(--color-primary-light)' : 'transparent'
                            }}
                          >
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontWeight: 500 }}>Trung Huỳnh</span>
                              <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>trung.huynh@singtel.com</span>
                            </div>
                            <Badge variant="success">Online</Badge>
                          </div>

                          <div 
                            className="ds-select-option" 
                            onClick={() => setCustomSelectValue('minhn')}
                            style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center',
                              backgroundColor: customSelectValue === 'minhn' ? 'var(--color-primary-light)' : 'transparent'
                            }}
                          >
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontWeight: 500 }}>Minh Nguyễn</span>
                              <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>minh.nguyen@singtel.com</span>
                            </div>
                            <Badge variant="warning">Busy</Badge>
                          </div>
                        </Select.List>
                      </Select>
                      <div style={{ marginTop: '8px', fontSize: '12px' }}>
                        Selected Value: <strong>{customSelectValue}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Tabs.Content>

            {/* TAB 3: Core Components Showcase */}
            <Tabs.Content value="components-spec">
              <div className="tab-intro">
                <h3>Thư viện Component mẫu (Design Specs & Accessibility)</h3>
                <p>Hiển thị các component cốt lõi trong hệ thống thiết kế kèm theo các biến thể và trạng thái tương tác khác nhau.</p>
              </div>

              <div className="components-gallery">
                {/* Section: Buttons */}
                <div className="gallery-section">
                  <h4>Buttons (Polymorphic, Loading, Variations)</h4>
                  <div className="gallery-row" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <Button variant="primary">Primary</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="success">Success</Button>
                    <Button variant="danger">Danger</Button>
                  </div>
                  <div className="gallery-row" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px', alignItems: 'center' }}>
                    <Button size="sm">Small</Button>
                    <Button size="md">Medium</Button>
                    <Button size="lg">Large</Button>
                    <Button isLoading>Loading State</Button>
                    <Button disabled>Disabled Button</Button>
                  </div>
                </div>

                {/* Section: Badge and Alerts */}
                <div className="gallery-section" style={{ marginTop: '24px' }}>
                  <h4>Badges & Alerts</h4>
                  <div className="gallery-row" style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                    <Badge variant="primary">Primary</Badge>
                    <Badge variant="secondary">Secondary</Badge>
                    <Badge variant="success" pill>Success Pill</Badge>
                    <Badge variant="warning" pill>Warning Pill</Badge>
                    <Badge variant="danger">Danger</Badge>
                    <Badge variant="info">Info</Badge>
                  </div>
                  
                  <Alert variant="info" title="Thông tin hệ thống">
                    Orbit Design System đang chạy phiên bản v2.4.0 với a11y đầy đủ.
                  </Alert>
                  <Alert variant="warning" title="Cảnh báo bảo mật">
                    Phiên bản Node hiện tại cần cập nhật để tối ưu bảo mật.
                  </Alert>
                </div>

                {/* Section: Modal Trigger */}
                <div className="gallery-section" style={{ marginTop: '24px' }}>
                  <h4>Interactive Modal (Overlay Portal)</h4>
                  <Button variant="outline" onClick={() => setIsModalOpen(true)}>
                    Mở Modal Portal Demo
                  </Button>

                  <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                    <Modal.Header>
                      <h4>Xác nhận hủy đặt vé máy bay</h4>
                    </Modal.Header>
                    <Modal.Body>
                      <p>
                        Bạn có chắc chắn muốn hủy chuyến bay SQ 176 từ Singapore đi Hà Nội? 
                        Hành động này sẽ không thể hoàn tác và số tiền hoàn vé sẽ được chuyển dưới dạng voucher.
                      </p>
                      <Alert variant="danger" title="Phí hủy vé" style={{ marginTop: '16px' }}>
                        Phí hủy vé là 15% tổng trị giá hóa đơn theo chính sách của hãng.
                      </Alert>
                    </Modal.Body>
                    <Modal.Footer>
                      <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Hủy bỏ</Button>
                      <Button variant="danger" onClick={() => setIsModalOpen(false)}>Xác nhận hủy vé</Button>
                    </Modal.Footer>
                  </Modal>
                </div>
              </div>
            </Tabs.Content>
          </Tabs>
        </section>

      </main>

      {/* Footer Info */}
      <footer className="playground-footer">
        <p>Built for Nguyen Huu Truong - Senior Frontend Engineer Interview Portfolio.</p>
        <p style={{ marginTop: '4px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
          Designed with pure CSS variables and compound React components. Run <code>npm run storybook</code> on port 6006 to view specifications.
        </p>
      </footer>
    </div>
  );
};

export default App;
