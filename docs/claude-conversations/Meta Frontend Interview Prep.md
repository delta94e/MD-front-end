# Meta Frontend Interview Prep

## Claude


# 🎯 Meta Frontend Engineering Technical Interview Simulation


*Based on the provided frontend development article covering mobile optimization, cross-domain solutions, rendering performance, and modern JavaScript concepts*


---


## Phase 1: Article Overview & Initial Understanding


**Interviewer**: Good morning! I'm Sarah, Principal Engineer at Meta. Today we'll dive deep into frontend performance and mobile optimization concepts. Let's start with the basics - can you walk me through the key components of a proper viewport meta tag and why each attribute matters for mobile experience?


*(Chào buổi sáng! Tôi là Sarah, Principal Engineer tại Meta. Hôm nay chúng ta sẽ tìm hiểu sâu về hiệu suất frontend và tối ưu hóa mobile. Hãy bắt đầu với những điều cơ bản - bạn có thể giải thích các thành phần chính của thẻ meta viewport và tại sao mỗi thuộc tính lại quan trọng cho trải nghiệm mobile?)*


**Candidate**: Absolutely! The viewport meta tag is crucial for responsive design. Let me break down each attribute:


```html
<meta name="viewport" content="width=device-width,initial-scale=1.0,minimum-scale=1.0,maximum-scale=1.0,user-scalable=no" />
```


- `width=device-width`: Sets viewport to match device screen width, ensuring consistent rendering across devices
- `initial-scale=1.0`: Prevents automatic zooming on page load, maintaining intended design scale
- `minimum-scale=1.0` & `maximum-scale=1.0`: Controls zoom boundaries to maintain design integrity
- `user-scalable=no`: Disables pinch-to-zoom for app-like experience (though this can hurt accessibility)


This configuration ensures our React components render predictably across iOS Safari, Android Chrome, and other mobile browsers.


**Interviewer**: Excellent foundation! Now, you mentioned the 1px rendering issue on mobile devices. At Meta, we deal with pixel-perfect designs across millions of devices. How would you implement a scalable solution for this across a large codebase?


*(Xuất sắc! Bây giờ, bạn đã đề cập đến vấn đề rendering 1px trên thiết bị mobile. Tại Meta, chúng tôi xử lý thiết kế pixel-perfect trên hàng triệu thiết bị. Bạn sẽ triển khai giải pháp có thể mở rộng như thế nào cho vấn đề này trên codebase lớn?)*


**Candidate**: For a large-scale application like Facebook or Instagram, I'd implement a systematic approach:


**Global Solution (Preferred for Meta-scale)**:


```css
/* Set initial-scale to 0.5 in viewport */
<meta name="viewport" content="width=device-width,initial-scale=0.5">

/* All rem calculations follow design specs directly */
.border-thin { border: 1px solid #e4e6ea; }
```


**Component-level Solution using CSS Custom Properties**:


```css
:root {
  --pixel-ratio: 1;
}

@media (-webkit-min-device-pixel-ratio: 2) {
  :root { --pixel-ratio: 0.5; }
}

.hairline-border {
  border: calc(1px * var(--pixel-ratio)) solid #e4e6ea;
}
```


**React Hook for Dynamic Implementation**:


```javascript
const usePixelRatio = () => {
  const [ratio, setRatio] = useState(1);

  useEffect(() => {
    setRatio(1 / window.devicePixelRatio);
  }, []);

  return ratio;
};
```


The global approach scales better for Meta's ecosystem since it handles all border cases uniformly across News Feed, Stories, and Messenger components.


**Evaluation: 4/4 - Excellent understanding of scale, provided multiple solutions with rationale for enterprise-level implementation**


---


## Phase 2: Core Technical Deep Dive


**Interviewer**: Great! Let's talk about cross-domain communication. At Meta, we handle data exchange between facebook.com, instagram.com, and various CDN domains. Walk me through the security implications and implementation of JSONP versus modern alternatives.


*(Tuyệt vời! Hãy nói về giao tiếp cross-domain. Tại Meta, chúng tôi xử lý trao đổi dữ liệu giữa facebook.com, instagram.com và các CDN domain khác nhau. Hãy giải thích về các tác động bảo mật và cách triển khai JSONP so với các phương án hiện đại khác.)*


**Candidate**: JSONP was revolutionary but has significant security vulnerabilities for a company like Meta:


**JSONP Implementation & Risks**:


```javascript
// Traditional JSONP - DANGEROUS for production
function fetchUserData(userId) {
  const script = document.createElement('script');
  script.src = `https://api.facebook.com/user?id=${userId}&callback=handleUser`;
  document.head.appendChild(script);
}

// Security Issues:
// 1. XSS vulnerability - malicious script execution
// 2. No error handling capability
// 3. Cache pollution attacks
// 4. CSRF potential if not properly validated
```


**Modern Meta Approach - CORS + Security Headers**:


```javascript
// Production-ready implementation
const fetchUserData = async (userId) => {
  try {
    const response = await fetch(`https://graph.facebook.com/v18.0/${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-FB-Trace-Id': generateTraceId(),
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    logger.error('User data fetch failed', { userId, error });
    throw error;
  }
};
```


**Server-side CORS Configuration**:


```javascript
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://facebook.com');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-FB-Trace-Id');
  res.setHeader('Content-Security-Policy', "default-src 'self' https://*.facebook.com");
  next();
});
```


For Meta's architecture, we'd also implement domain verification, rate limiting, and request signing for additional security layers.


**Interviewer**: Perfect security mindset! Now let's dive into rendering performance. You mentioned several optimization techniques. At Meta scale, how would you prioritize and implement these optimizations across News Feed, which renders thousands of posts with images, videos, and interactive elements?


*(Tư duy bảo mật hoàn hảo! Bây giờ hãy tìm hiểu về hiệu suất rendering. Bạn đã đề cập đến nhiều kỹ thuật tối ưu hóa. Với quy mô của Meta, bạn sẽ ưu tiên và triển khai các tối ưu hóa này như thế nào trên News Feed, nơi render hàng nghìn bài đăng với hình ảnh, video và các yếu tố tương tác?)*


**Candidate**: Excellent question! For News Feed optimization, I'd implement a multi-layered strategy prioritized by impact:


**Tier 1: Critical Rendering Path Optimization**


```javascript
// 1. Defer non-critical JavaScript
const loadNonCriticalJS = () => {
  const scripts = [
    '/js/comments-handler.js',
    '/js/share-analytics.js',
    '/js/emoji-picker.js'
  ];

  scripts.forEach(src => {
    const script = document.createElement('script');
    script.src = src;
    script.loading = 'lazy';
    document.body.appendChild(script);
  });
};

// Load after initial paint
requestIdleCallback(loadNonCriticalJS);
```


**Tier 2: Virtualized Scrolling for Infinite Feed**


```javascript
// React implementation for News Feed virtualization
const VirtualizedNewsFeed = ({ posts }) => {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 10 });
  const containerRef = useRef();

  const handleScroll = useCallback(
    throttle(() => {
      const container = containerRef.current;
      const scrollTop = container.scrollTop;
      const containerHeight = container.clientHeight;
      const itemHeight = 400; // Average post height

      const start = Math.floor(scrollTop / itemHeight);
      const end = Math.ceil((scrollTop + containerHeight) / itemHeight) + 5; // Buffer

      setVisibleRange({ start: Math.max(0, start - 5), end }); // Pre-buffer
    }, 16), // 60fps throttling
    []
  );

  return (
    <div ref={containerRef} onScroll={handleScroll} style={{ height: '100vh', overflow: 'auto' }}>
      {posts.slice(visibleRange.start, visibleRange.end).map(post => (
        <NewsPostCard key={post.id} post={post} />
      ))}
    </div>
  );
};
```


**Tier 3: Resource Loading Strategy**


```javascript
// Progressive image loading with WebP support
const OptimizedImage = ({ src, alt }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            const webpSrc = src.replace(/\.(jpg|jpeg|png)$/, '.webp');

            // Feature detection for WebP
            const supportsWebP = new Image();
            supportsWebP.onload = () => {
              img.src = webpSrc;
              observer.unobserve(img);
            };
            supportsWebP.onerror = () => {
              img.src = src;
              observer.unobserve(img);
            };
            supportsWebP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
          }
        });
      },
      { rootMargin: '50px' }
    );

    if (imgRef.current) observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, [src]);

  return (
    <img
      ref={imgRef}
      alt={alt}
      onLoad={() => setLoaded(true)}
      onError={() => setError(true)}
      style={{
        opacity: loaded ? 1 : 0,
        transition: 'opacity 0.3s ease',
        backgroundColor: error ? '#f0f2f5' : 'transparent'
      }}
    />
  );
};
```


**Tier 4: Hardware Acceleration Strategy**


```css
/* Selective hardware acceleration for animations */
.news-post-card {
  /* Only apply to animated elements */
  will-change: auto;
}

.news-post-card:hover,
.news-post-card.transitioning {
  will-change: transform, opacity;
  transform: translateZ(0); /* Force hardware acceleration */
}

.news-post-card.animation-complete {
  will-change: auto; /* Release GPU resources */
}
```


**Performance Monitoring**:


```javascript
// Real-time performance tracking
const trackRenderPerformance = () => {
  const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      if (entry.entryType === 'measure') {
        analytics.track('render_performance', {
          name: entry.name,
          duration: entry.duration,
          startTime: entry.startTime
        });
      }
    });
  });

  observer.observe({ entryTypes: ['measure', 'navigation'] });
};
```


This approach ensures News Feed maintains 60fps scrolling even with complex interactive elements while minimizing memory usage across different device capabilities.


**Evaluation: 4/4 - Comprehensive understanding of performance optimization at scale, excellent real-world implementation examples**


---


## Phase 3: Practical Implementation


**Interviewer**: Outstanding! Let's get hands-on. I want you to implement a React component that handles the text overflow scenarios you mentioned, but with a twist - it needs to work for both single-line and multi-line cases, detect overflow dynamically, and work across all Meta products. Walk me through your implementation approach and code it up.


*(Xuất sắc! Hãy thực hành. Tôi muốn bạn triển khai một React component xử lý các tình huống text overflow mà bạn đã đề cập, nhưng có thêm yêu cầu - nó cần hoạt động cho cả trường hợp một dòng và nhiều dòng, phát hiện overflow một cách động, và hoạt động trên tất cả sản phẩm của Meta. Hãy giải thích cách tiếp cận và code implementation.)*


**Candidate**: Perfect! I'll create a robust `TextOverflow` component that dynamically handles both scenarios. Let me walk through my approach:


**Architecture & Requirements Analysis**:


```javascript
// Component requirements:
// 1. Dynamic overflow detection
// 2. Single/multi-line support
// 3. Accessibility compliance
// 4. Performance optimized
// 5. Cross-browser compatibility
// 6. Customizable styling
```


**Core Implementation**:


```javascript
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { debounce } from 'lodash';

const TextOverflow = ({
  children,
  maxLines = 1,
  showTooltip = true,
  ellipsisText = '...',
  expandable = false,
  className = '',
  style = {},
  onOverflowChange = () => {}
}) => {
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFullText, setShowFullText] = useState(false);
  const textRef = useRef(null);
  const measureRef = useRef(null);

  // Dynamic overflow detection
  const checkOverflow = useCallback(() => {
    if (!textRef.current) return;

    const element = textRef.current;
    const computedStyle = window.getComputedStyle(element);
    const lineHeight = parseFloat(computedStyle.lineHeight);
    const maxHeight = lineHeight * maxLines;

    let hasOverflow = false;

    if (maxLines === 1) {
      // Single line: check scrollWidth vs clientWidth
      hasOverflow = element.scrollWidth > element.clientWidth;
    } else {
      // Multi-line: check actual height vs max allowed height
      // Create a clone to measure actual content height
      if (!measureRef.current) {
        measureRef.current = element.cloneNode(true);
        measureRef.current.style.cssText = `
          position: absolute;
          visibility: hidden;
          height: auto;
          max-height: none;
          white-space: normal;
          overflow: visible;
          pointer-events: none;
        `;
        document.body.appendChild(measureRef.current);
      }

      measureRef.current.textContent = children;
      measureRef.current.style.width = element.clientWidth + 'px';

      const actualHeight = measureRef.current.scrollHeight;
      hasOverflow = actualHeight > maxHeight;
    }

    if (hasOverflow !== isOverflowing) {
      setIsOverflowing(hasOverflow);
      onOverflowChange(hasOverflow);
    }
  }, [children, maxLines, isOverflowing, onOverflowChange]);

  // Debounced resize handler for performance
  const debouncedCheck = useCallback(
    debounce(checkOverflow, 150),
    [checkOverflow]
  );

  // ResizeObserver for dynamic content changes
  useEffect(() => {
    const element = textRef.current;
    if (!element) return;

    const resizeObserver = new ResizeObserver(debouncedCheck);
    resizeObserver.observe(element);

    // Initial check
    checkOverflow();

    return () => {
      resizeObserver.disconnect();
      if (measureRef.current && document.body.contains(measureRef.current)) {
        document.body.removeChild(measureRef.current);
      }
    };
  }, [checkOverflow, debouncedCheck]);

  // Handle expand/collapse
  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  // Generate CSS styles
  const getTextStyles = () => {
    if (isExpanded || !isOverflowing) {
      return {
        overflow: 'visible',
        whiteSpace: 'normal',
        ...style
      };
    }

    const baseStyles = {
      overflow: 'hidden',
      ...style
    };

    if (maxLines === 1) {
      return {
        ...baseStyles,
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis'
      };
    }

    // Multi-line WebKit solution
    return {
      ...baseStyles,
      display: '-webkit-box',
      WebkitBoxOrient: 'vertical',
      WebkitLineClamp: maxLines,
      lineClamp: maxLines, // Standard property for future compatibility
    };
  };

  // Tooltip implementation
  const TooltipWrapper = ({ children: tooltipChildren }) => {
    if (!showTooltip || !isOverflowing) {
      return tooltipChildren;
    }

    return (
      <div
        title={typeof children === 'string' ? children : ''}
        style={{ position: 'relative' }}
      >
        {tooltipChildren}
      </div>
    );
  };

  return (
    <TooltipWrapper>
      <div
        ref={textRef}
        className={`text-overflow-component ${className}`}
        style={getTextStyles()}
        role="text"
        aria-expanded={expandable ? isExpanded : undefined}
        aria-label={isOverflowing && !isExpanded ? `${children} (truncated)` : undefined}
      >
        {children}

        {/* Expandable functionality */}
        {expandable && isOverflowing && (
          <button
            onClick={toggleExpanded}
            className="text-overflow-toggle"
            style={{
              background: 'none',
              border: 'none',
              color: '#1877f2', // Meta blue
              cursor: 'pointer',
              fontSize: 'inherit',
              fontWeight: '600',
              marginLeft: '4px',
              padding: '0'
            }}
            aria-label={isExpanded ? 'Show less' : 'Show more'}
          >
            {isExpanded ? 'Show less' : 'Show more'}
          </button>
        )}
      </div>
    </TooltipWrapper>
  );
};

// Enhanced hook for advanced use cases
export const useTextOverflow = (ref, maxLines = 1) => {
  const [isOverflowing, setIsOverflowing] = useState(false);

  const checkOverflow = useCallback(() => {
    if (!ref.current) return false;

    const element = ref.current;
    const computedStyle = window.getComputedStyle(element);
    const lineHeight = parseFloat(computedStyle.lineHeight);
    const maxHeight = lineHeight * maxLines;

    const hasOverflow = maxLines === 1
      ? element.scrollWidth > element.clientWidth
      : element.scrollHeight > maxHeight;

    setIsOverflowing(hasOverflow);
    return hasOverflow;
  }, [ref, maxLines]);

  useEffect(() => {
    const observer = new ResizeObserver(
      debounce(checkOverflow, 100)
    );

    if (ref.current) {
      observer.observe(ref.current);
      checkOverflow();
    }

    return () => observer.disconnect();
  }, [checkOverflow]);

  return { isOverflowing, checkOverflow };
};

export default TextOverflow;
```


**Usage Examples for Different Meta Products**:


```javascript
// News Feed post content
<TextOverflow
  maxLines={3}
  expandable={true}
  onOverflowChange={(overflow) => analytics.track('text_overflow', { overflow })}
>
  {postContent}
</TextOverflow>

// Messenger chat preview
<TextOverflow
  maxLines={1}
  showTooltip={true}
  className="message-preview"
>
  {lastMessage}
</TextOverflow>

// Instagram bio
<TextOverflow
  maxLines={4}
  expandable={true}
  ellipsisText="... more"
>
  {userBio}
</TextOverflow>
```


**CSS for Cross-browser Compatibility**:


```css
.text-overflow-component {
  /* Fallback for browsers without line-clamp support */
  position: relative;
}

/* IE/Edge fallback */
.text-overflow-component:not([style*="webkit-line-clamp"]) {
  position: relative;
  overflow: hidden;
}

.text-overflow-component:not([style*="webkit-line-clamp"])::after {
  content: "";
  position: absolute;
  bottom: 0;
  right: 0;
  width: 20px;
  height: 1.2em;
  background: linear-gradient(to right, transparent, white 50%);
}

/* Focus states for accessibility */
.text-overflow-toggle:focus {
  outline: 2px solid #1877f2;
  outline-offset: 2px;
  border-radius: 2px;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .text-overflow-toggle {
    border: 1px solid currentColor;
    padding: 2px 4px;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .text-overflow-component {
    transition: none !important;
  }
}
```


**Key Implementation Benefits**:


1. **Performance**: Uses ResizeObserver + debouncing, avoiding constant DOM measurements
2. **Accessibility**: Proper ARIA labels, focus management, high contrast support
3. **Scalability**: Works across News Feed, Messenger, Instagram with consistent API
4. **Browser Support**: Graceful fallbacks for older browsers
5. **Memory Efficient**: Cleanup observers and temporary DOM elements
6. **Type Safety**: Can be easily enhanced with TypeScript definitions


This component handles the complexity internally while providing a simple, consistent API across all Meta products.


**Interviewer**: Exceptional work! Your solution demonstrates production-ready thinking. One final question - how would you test this component to ensure it works reliably across Meta's diverse user base and devices?


*(Công việc xuất sắc! Giải pháp của bạn thể hiện tư duy sẵn sàng cho production. Một câu hỏi cuối cùng - bạn sẽ test component này như thế nào để đảm bảo nó hoạt động đáng tin cậy trên diverse user base và devices của Meta?)*


**Candidate**: Great question! Testing at Meta scale requires a comprehensive strategy covering multiple dimensions:


**1. Unit Testing with Jest & React Testing Library**:


```javascript
// __tests__/TextOverflow.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import TextOverflow from '../TextOverflow';

describe('TextOverflow Component', () => {
  // Mock ResizeObserver for testing
  beforeAll(() => {
    global.ResizeObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }));
  });

  test('handles single-line overflow detection', async () => {
    const longText = 'This is a very long text that should overflow';
    const onOverflowChange = jest.fn();

    // Mock DOM measurements
    Object.defineProperty(HTMLElement.prototype, 'scrollWidth', {
      configurable: true,
      value: 300,
    });
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
      configurable: true,
      value: 200,
    });

    render(
      <TextOverflow
        maxLines={1}
        onOverflowChange={onOverflowChange}
      >
        {longText}
      </TextOverflow>
    );

    await waitFor(() => {
      expect(onOverflowChange).toHaveBeenCalledWith(true);
    });
  });

  test('expandable functionality works correctly', async () => {
    render(
      <TextOverflow maxLines={2} expandable={true}>
        {'Long text that overflows multiple lines'.repeat(10)}
      </TextOverflow>
    );

    const showMoreButton = screen.getByLabelText('Show more');
    expect(showMoreButton).toBeInTheDocument();

    fireEvent.click(showMoreButton);

    await waitFor(() => {
      expect(screen.getByLabelText('Show less')).toBeInTheDocument();
    });
  });

  test('accessibility attributes are correct', () => {
    render(
      <TextOverflow maxLines={1} expandable={true}>
        Overflow text
      </TextOverflow>
    );

    const textElement = screen.getByRole('text');
    expect(textElement).toHaveAttribute('aria-expanded');
  });
});
```


**2. Visual Regression Testing**:


```javascript
// visual-tests/TextOverflow.visual.test.js
import { chromium } from 'playwright';

describe('TextOverflow Visual Tests', () => {
  let browser, page;

  beforeAll(async () => {
    browser = await chromium.launch();
    page = await browser.newPage();
  });

  afterAll(async () => {
    await browser.close();
  });

  test('renders correctly across different viewport sizes', async () => {
    const viewports = [
      { width: 375, height: 667 }, // iPhone SE
      { width: 414, height: 896 }, // iPhone 11 Pro Max
      { width: 1920, height: 1080 }, // Desktop
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto('http://localhost:3000/text-overflow-demo');

      await expect(page).toHaveScreenshot(
        `text-overflow-${viewport.width}x${viewport.height}.png`
      );
    }
  });

  test('handles different font sizes correctly', async () => {
    await page.goto('http://localhost:3000/text-overflow-demo');

    // Test with user's accessibility font scaling
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '20px';
    });

    await expect(page.locator('.text-overflow-component')).toHaveScreenshot(
      'text-overflow-large-font.png'
    );
  });
});
```


**3. Cross-Browser Testing with BrowserStack**:


```javascript
// browserstack.config.js
const browserStackConfig = {
  browsers: [
    // iOS Safari versions
    { browserName: 'Safari', browser_version: '14.0', os: 'OS X', os_version: 'Big Sur' },
    { browserName: 'Safari', browser_version: '15.0', os: 'OS X', os_version: 'Monterey' },

    // Android Chrome versions
    { browserName: 'Chrome', browser_version: '90.0', os: 'Android', os_version: '11.0' },
    { browserName: 'Chrome', browser_version: '96.0', os: 'Android', os_version: '12.0' },

    // Desktop browsers
    { browserName: 'Chrome', browser_version: '108.0', os: 'Windows', os_version: '11' },
    { browserName: 'Firefox', browser_version: '107.0', os: 'Windows', os_version: '11' },
    { browserName: 'Edge', browser_version: '108.0', os: 'Windows', os_version: '11' },
  ],

  testSuite: [
    'single-line-overflow',
    'multi-line-overflow',
    'expand-collapse-functionality',
    'tooltip-display',
    'keyboard-navigation'
  ]
};
```


**4. Performance Testing**:


```javascript
// performance-tests/TextOverflow.perf.test.js
import { performance } from 'perf_hooks';

describe('TextOverflow Performance', () => {
  test('handles large datasets efficiently', async () => {
    const startTime = performance.now();

    // Render 1000 components with overflow detection
    const components = Array.from({ length: 1000 }, (_, i) => (
      <TextOverflow key={i} maxLines={3}>
        {`Performance test content ${i} `.repeat(50)}
      </TextOverflow>
    ));

    render(<div>{components}</div>);

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Should render 1000 components in under 500ms
    expect(renderTime).toBeLessThan(500);
  });

  test('ResizeObserver callbacks are properly debounced', async () => {
    const mockCallback = jest.fn();

    render(
      <TextOverflow onOverflowChange={mockCallback}>
        Test content
      </TextOverflow>
    );

    // Simulate rapid resize events
    act(() => {
      for (let i = 0; i < 10; i++) {
        window.dispatchEvent(new Event('resize'));
      }
    });

    await waitFor(() => {
      // Should only call once due to debouncing
      expect(mockCallback).toHaveBeenCalledTimes(1);
    }, { timeout: 200 });
  });
});
```


**5. Accessibility Testing**:


```javascript
// a11y-tests/TextOverflow.a11y.test.js
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('TextOverflow Accessibility', () => {
  test('has no accessibility violations', async () => {
    const { container } = render(
      <TextOverflow maxLines={2} expandable={true}>
        Content for accessibility testing
      </TextOverflow>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('works with screen readers', async () => {
    render(
      <TextOverflow maxLines={1} expandable={true}>
        Screen reader test content that overflows
      </TextOverflow>
    );

    const showMoreButton = screen.getByLabelText('Show more');

    // Test keyboard navigation
    showMoreButton.focus();
    fireEvent.keyDown(showMoreButton, { key: 'Enter' });

    await waitFor(() => {
      expect(screen.getByLabelText('Show less')).toBeInTheDocument();
    });
  });

  test('supports high contrast mode', () => {
    // Mock high contrast media query
    Object.defineProperty(window, 'matchMedia', {
      value: jest.fn(() => ({
        matches: true,
        media: '(prefers-contrast: high)',
        addListener: jest.fn(),
        removeListener: jest.fn(),
      })),
    });

    const { container } = render(
      <TextOverflow expandable={true}>
        High contrast test
      </TextOverflow>
    );

    // Verify high contrast styles are applied
    expect(container.querySelector('.text-overflow-toggle')).toHaveStyle({
      border: '1px solid currentColor'
    });
  });
});
```


**6. Real-world Device Testing Strategy**:


```javascript
// Real device testing matrix for Meta's global user base
const deviceTestMatrix = {
  // High-end devices (US, EU)
  premium: [
    'iPhone 14 Pro (iOS 16)',
    'Samsung Galaxy S23 (Android 13)',
    'iPad Pro 2022',
  ],

  // Mid-range devices (Global markets)
  midRange: [
    'iPhone 12 (iOS 15)',
    'Samsung Galaxy A54',
    'Google Pixel 6a',
  ],

  // Budget devices (Emerging markets - critical for Meta)
  budget: [
    'iPhone SE 2020 (iOS 14)',
    'Samsung Galaxy A13',
    'Xiaomi Redmi Note 11',
    'Motorola Moto G Power',
  ],

  // Network conditions
  networkConditions: [
    '4G Fast (50 Mbps)',
    '3G Slow (1.5 Mbps)',
    '2G (Edge case for emerging markets)',
    'Offline (cached content)'
  ]
};
```


**7. A/B Testing Framework**:


```javascript
// Integrate with Meta's experimentation platform
const TextOverflowExperiment = ({ experimentConfig, children, ...props }) => {
  const experiment = useExperiment('text_overflow_v2', {
    // Control: Original implementation
    control: { maxLines: props.maxLines, expandable: false },

    // Treatment: Enhanced with expand functionality
    treatment: { maxLines: props.maxLines, expandable: true },
  });

  return (
    <TextOverflow
      {...props}
      {...experiment.params}
      onOverflowChange={(overflow) => {
        // Track metrics for both variants
        analytics.track('text_overflow_interaction', {
          variant: experiment.variant,
          hasOverflow: overflow,
          component: props.componentName,
        });

        props.onOverflowChange?.(overflow);
      }}
    >
      {children}
    </TextOverflow>
  );
};
```


**8. Continuous Monitoring**:


```javascript
// Production monitoring and error tracking
const TextOverflowWithMonitoring = (props) => {
  useEffect(() => {
    // Monitor ResizeObserver performance
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.duration > 16) { // Slower than 60fps
          Sentry.captureMessage('TextOverflow performance degradation', {
            extra: {
              duration: entry.duration,
              component: 'TextOverflow',
              props: JSON.stringify(props)
            }
          });
        }
      });
    });

    observer.observe({ entryTypes: ['measure'] });
    return () => observer.disconnect();
  }, []);

  return <TextOverflow {...props} />;
};
```


This comprehensive testing strategy ensures reliability across Meta's 3+ billion users, diverse devices, and varying network conditions while providing continuous feedback for optimization.


**Final Evaluation: 4/4 - Demonstrates exceptional understanding of enterprise-scale testing, covering all critical aspects including performance, accessibility, cross-browser compatibility, and real-world usage scenarios. Shows production-ready thinking with monitoring and experimentation integration.**


---


## 🎯 Overall Interview Assessment


**Technical Competency: 4/4**


- Demonstrated deep understanding of frontend fundamentals
- Provided production-ready, scalable solutions
- Showed excellent problem-solving approach
- Code quality meets Big Tech standards


**Meta Culture Fit: 4/4**


- Focus on user impact and scale
- Security-first mindset
- Performance optimization prioritization
- Accessibility consideration


**Communication: 4/4**


- Clear technical explanations
- Structured problem-solving approach
- Good balance of theory and practical implementation


**Recommendation: STRONG HIRE for Principal Frontend Engineer role**


*This candidate demonstrates the technical depth, scalability mindset, and production experience expected for a senior role at Meta.*


## Claude


# 🎯 PHÂN TÍCH CHUYÊN SÂU: FRONTEND PERFORMANCE & MOBILE OPTIMIZATION GUIDE


## 1. 📝 TÓM TẮT CHÍNH


Bài viết này là một **comprehensive guide** về các kỹ thuật tối ưu hóa frontend và mobile development, tập trung vào 21 topics quan trọng từ viewport handling đến performance optimization. Document này giải quyết những **pain points phổ biến** mà frontend developers gặp phải khi develop cross-platform applications, đặc biệt là mobile-first responsive design và browser compatibility issues.


**Tại sao quan trọng?** Trong thời đại mobile-first, việc master các techniques này là **must-have skill** để build applications có performance tốt, UX smooth trên mọi devices và browsers.


## 2. 🔍 KHÁI NIỆM CỐT LÕI


### 🔧 Viewport Meta Tag


**Định nghĩa:** Tag HTML control cách browser render page trên mobile devices


```html
<meta name="viewport" content="width=device-width,initial-scale=1.0,minimum-scale=1.0,maximum-scale=1.0,user-scalable=no" />
```


### 🌐 Cross-Domain Communication


**Định nghĩa:** Techniques để bypass Same Origin Policy và communicate giữa different domains


- **JSONP:** JSON with Padding - inject script tags để fetch data
- **CORS:** Cross-Origin Resource Sharing - server-side headers control
- **PostMessage API:** Safe communication between windows/iframes


### ⚡ Hardware Acceleration


**Định nghĩa:** Sử dung GPU thay vì CPU để handle graphics operations


```css
/* Trigger hardware acceleration */
transform: translateZ(0);
will-change: transform;
```


### 📱 1px Problem


**Định nghĩa:** Trên high-DPI screens, 1px CSS border render thành 2px physical pixels


## 3. 💡 HIỂU BẢN CHẤT


### 🎯 Pain Points Được Giải Quyết:


**Mobile Rendering Issues:**


- Viewport không consistent across devices
- 1px borders appear thick trên retina displays
- Touch interactions không responsive


**Performance Bottlenecks:**


- Blocking scripts/styles trong `<head>`
- Unnecessary repaints/reflows
- Memory leaks từ DOM manipulation


**Cross-Browser Compatibility:**


- Different event handling mechanisms
- Inconsistent CSS support
- Mobile browser quirks


### 🔬 Cơ Chế Underlying:


**Browser Rendering Pipeline:**


```
HTML Parse → DOM Tree → CSSOM → Render Tree → Layout → Paint → Composite
```


**Hardware Acceleration Flow:**


```
CSS Transform → Composite Layer → GPU Processing → Hardware Accelerated Rendering
```


## 4. 🛠️ CODE EXAMPLES THỰC TẾ


### 📱 Viewport & 1px Solution


```html
<!-- Giải pháp toàn cục cho 1px problem -->
<meta name="viewport" content="width=device-width,initial-scale=0.5">

<style>
/* Tất cả borders giờ sẽ render chính xác */
.border-thin {
    border: 1px solid #e4e6ea; /* Không cần transform nữa */
}
</style>
```


```css
/* Giải pháp cục bộ với transform */
.hairline-border {
    position: relative;
    border: none;
}

.hairline-border::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 200%; /* Scale up 2x */
    height: 200%;
    border: 1px solid #e4e6ea;
    transform: scale(0.5); /* Scale down về 0.5x = 1px thật */
    transform-origin: 0 0;
    pointer-events: none;
}
```


### 🌐 Cross-Domain Solutions


```javascript
// ❌ JSONP - Không secure, deprecated
function oldJSONP(callback) {
    const script = document.createElement('script');
    script.src = `https://api.example.com/data?callback=${callback}`;
    document.head.appendChild(script);
}

// ✅ Modern Fetch với CORS
async function modernFetch() {
    try {
        const response = await fetch('https://api.example.com/data', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            mode: 'cors', // Explicit CORS mode
            credentials: 'include' // Include cookies if needed
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Fetch failed:', error);
        throw error;
    }
}
```


### ⚡ Hardware Acceleration Best Practices


```css
/* ✅ Selective hardware acceleration */
.animated-element {
    /* Chỉ enable khi cần animate */
    will-change: auto;
}

.animated-element:hover,
.animated-element.animating {
    will-change: transform, opacity;
    transform: translateZ(0); /* Force layer creation */
}

.animated-element.animation-complete {
    will-change: auto; /* Release GPU memory */
}

/* ❌ Avoid - GPU memory waste */
.everything {
    transform: translateZ(0); /* Không nên apply cho mọi element */
}
```


### 📝 Text Overflow Solutions


```css
/* Single-line text overflow */
.single-line-ellipsis {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    width: 200px; /* Required width */
}

/* Multi-line text overflow - WebKit */
.multi-line-ellipsis {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3; /* Số dòng muốn hiển thị */
    overflow: hidden;
    line-height: 1.4em;
    max-height: 4.2em; /* 3 lines * 1.4em */
}

/* Cross-browser multi-line với gradient fade */
.multi-line-fallback {
    position: relative;
    line-height: 1.4em;
    max-height: 4.2em;
    overflow: hidden;
}

.multi-line-fallback::after {
    content: "";
    position: absolute;
    bottom: 0;
    right: 0;
    width: 30px;
    height: 1.4em;
    background: linear-gradient(to right, transparent, white 70%);
}
```


## 5. 🔄 SO SÁNH & PHÂN BIỆT


### 📊 Viewport Scaling Approaches


```
ApproachProsConsUse CaseGlobal Scale 0.5✅ Simple, works everywhere❌ Affects all dimensionsLarge codebasesLocal Transform✅ Granular control❌ More CSS overheadSpecific componentsSVG Borders✅ True 1px on all screens❌ Limited styling optionsIcons, simple borders
```


### 🌐 Cross-Domain Methods


```
MethodSecurityPerformanceBrowser SupportBest ForJSONP❌ Low⚡ Fast✅ UniversalLegacy systemsCORS✅ High⚡ Fast✅ ModernProduction APIsPostMessage✅ High🐌 Medium✅ Universaliframe communicationProxy Server✅ High🐌 Slow✅ UniversalDevelopment
```


### ⚡ Hardware Acceleration Trade-offs


```
PropertyGPU MemoryPerformanceBatteryUse WhentransformMedium✅ HighMediumAnimationsopacityLow✅ HighLowFade effectswill-changeHigh✅ Very HighHighCritical animations
```


## 6. 🎯 BEST PRACTICES


### ⚠️ Critical Guidelines


```javascript
// ✅ DO: Efficient event handling
const handleScroll = throttle(() => {
    // Heavy operations
}, 16); // 60fps

// ❌ DON'T: Direct event binding
window.addEventListener('scroll', heavyFunction);
```


```css
/* ✅ DO: Efficient CSS animations */
.smooth-animation {
    transition: transform 0.3s ease-out;
    will-change: transform; /* Only during animation */
}

/* ❌ DON'T: Force hardware acceleration everywhere */
* {
    transform: translateZ(0); /* Memory waste */
}
```


### 🚫 Common Mistakes


1. **Viewport Scale Confusion:**


```html
<!-- ❌ Wrong: Breaks accessibility -->
<meta name="viewport" content="width=device-width,initial-scale=0.5,user-scalable=no">

<!-- ✅ Right: Preserve user control -->
<meta name="viewport" content="width=device-width,initial-scale=1.0,user-scalable=yes">
```


1. **Hardware Acceleration Overuse:**


```css
/* ❌ Performance killer */
.every-element {
    will-change: transform, opacity, filter, backdrop-filter;
}

/* ✅ Selective usage */
.animating-element {
    will-change: transform;
}
.animating-element:not(.animating) {
    will-change: auto;
}
```


## 7. 🚀 ỨNG DỤNG THỰC TẾ


### 🏢 E-commerce Platform


```javascript
// Product grid với infinite scroll và hardware acceleration
class ProductGrid {
    constructor() {
        this.setupVirtualization();
        this.setupHardwareAcceleration();
    }

    setupHardwareAcceleration() {
        // Chỉ enable cho visible items
        this.visibleItems.forEach(item => {
            item.style.willChange = 'transform';
            item.style.transform = 'translateZ(0)';
        });
    }

    onScrollComplete() {
        // Release GPU memory
        this.allItems.forEach(item => {
            item.style.willChange = 'auto';
        });
    }
}
```


### 📱 Social Media App


```javascript
// News feed với optimized text overflow
const PostContent = ({ content, maxLines = 3 }) => {
    const [isExpanded, setExpanded] = useState(false);
    const [isOverflowing, setOverflowing] = useState(false);

    useEffect(() => {
        // Detect overflow dynamically
        const element = textRef.current;
        const lineHeight = parseInt(getComputedStyle(element).lineHeight);
        const maxHeight = lineHeight * maxLines;

        setOverflowing(element.scrollHeight > maxHeight);
    }, [content, maxLines]);

    return (
        <div
            ref={textRef}
            className={isExpanded ? 'expanded' : 'truncated'}
            style={{
                WebkitLineClamp: isExpanded ? 'none' : maxLines,
                display: '-webkit-box',
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
            }}
        >
            {content}
            {isOverflowing && (
                <button onClick={() => setExpanded(!isExpanded)}>
                    {isExpanded ? 'Thu gọn' : 'Xem thêm'}
                </button>
            )}
        </div>
    );
};
```


## 8. 📚 KIẾN THỨC LIÊN QUAN


### 📋 Prerequisites


- **CSS Box Model** & **Flexbox/Grid**
- **Browser Rendering Pipeline**
- **JavaScript Event Loop**
- **HTTP/HTTPS Protocols**
- **Mobile Browser Architecture**


### 🔮 Advanced Topics


- **Web Workers** cho background processing
- **Service Workers** cho caching strategies
- **WebAssembly** cho performance-critical code
- **CSS Containment** cho rendering optimization
- **Intersection Observer API** cho scroll optimization


### 🔗 Related Technologies


- **React/Vue Virtual DOM** optimization
- **Webpack/Vite** bundling strategies
- **CDN** và **Edge Computing**
- **Progressive Web Apps (PWA)**


## 9. 💼 INTERVIEW PERSPECTIVE


### ❓ Câu Hỏi Thường Gặp


**Q: "Giải thích 1px problem và cách solve?"**


```
A: "1px problem xảy ra trên high-DPI screens khi 1px CSS không tương ứng 1px physical.
Có 3 solutions chính:
1. Global viewport scale 0.5 - simple nhưng affect toàn bộ layout
2. Local transform scale(0.5) với pseudo-elements - granular control
3. SVG borders - true 1px nhưng limited styling

Tôi thường dùng approach 2 cho components quan trọng và approach 1 cho large-scale apps."
```


**Q: "Tại sao không nên overuse hardware acceleration?"**


```
A: "Hardware acceleration tạo composite layers trên GPU, consume memory và battery.
Key points:
- Mỗi layer consume GPU memory
- GPU context switching có overhead
- Mobile devices có limited GPU memory
- Best practice: use will-change dynamically, chỉ enable khi animate"
```


**Q: "CORS vs JSONP - khi nào dùng gì?"**


```
A: "CORS là standard hiện tại, secure và flexible. JSONP deprecated vì:
- Security risks: execute arbitrary code
- Limited to GET requests
- No error handling
- CORS support tốt trên modern browsers

Chỉ dùng JSONP khi support legacy browsers không có CORS."
```


### 🏆 Điểm Cộng Khi Demo


1. **Show Performance Impact:**


```javascript
// Measure rendering performance
performance.mark('start-render');
// ... rendering code
performance.mark('end-render');
performance.measure('render-time', 'start-render', 'end-render');
console.log(performance.getEntriesByName('render-time')[0].duration);
```


1. **Demonstrate Cross-browser Testing:**


```javascript
// Feature detection before using
const supportsIntersectionObserver = 'IntersectionObserver' in window;
const supportsWebP = document.createElement('canvas')
    .toDataURL('image/webp').indexOf('data:image/webp') === 0;
```


## 10. 🎪 DEMO INTERACTIVE


```html
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width,initial-scale=1.0">
    <title>Frontend Optimization Demo</title>
    <style>
        /* Demo styles với best practices */
        .demo-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .performance-demo {
            border: 1px solid #e4e6ea;
            border-radius: 8px;
            padding: 16px;
            margin: 16px 0;
            transition: transform 0.2s ease;
        }

        .performance-demo:hover {
            transform: translateY(-2px);
            will-change: transform;
        }

        .performance-demo:not(:hover) {
            will-change: auto;
        }

        .text-overflow-demo {
            width: 300px;
            padding: 12px;
            border: 1px solid #ccc;
            border-radius: 4px;
            margin: 8px 0;
        }

        .single-line {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .multi-line {
            display: -webkit-box;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 2;
            overflow: hidden;
            line-height: 1.4;
        }

        .hardware-acceleration-demo {
            width: 100px;
            height: 100px;
            background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
            border-radius: 8px;
            margin: 16px;
            cursor: pointer;
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .hardware-acceleration-demo:hover {
            transform: scale(1.1) rotateZ(5deg);
            will-change: transform;
        }

        .hardware-acceleration-demo:not(:hover) {
            will-change: auto;
        }
    </style>
</head>
<body>
    <div class="demo-container">
        <h1>🚀 Frontend Optimization Interactive Demo</h1>

        <section class="performance-demo">
            <h3>📱 Text Overflow Demo</h3>
            <div class="text-overflow-demo single-line">
                <strong>Single Line:</strong> Đây là một dòng text rất dài sẽ bị truncate với ellipsis khi overflow container width
            </div>
            <div class="text-overflow-demo multi-line">
                <strong>Multi Line:</strong> Đây là paragraph dài với nhiều dòng text. WebKit line-clamp sẽ truncate sau 2 dòng và show ellipsis tự động. Rất tiện lợi cho UI cards và previews.
            </div>
        </section>

        <section class="performance-demo">
            <h3>⚡ Hardware Acceleration Demo</h3>
            <div class="hardware-acceleration-demo" title="Hover để xem smooth animation với GPU acceleration"></div>
            <p><small>💡 Hover vào box trên để xem smooth animation với hardware acceleration. will-change được set dynamically để optimize performance.</small></p>
        </section>

        <section class="performance-demo">
            <h3>🔧 Performance Metrics</h3>
            <div id="performance-metrics">
                <p>Loading performance data...</p>
            </div>
        </section>
    </div>

    <script>
        // Performance monitoring demo
        function measurePerformance() {
            const metrics = {
                // DOM metrics
                domElements: document.querySelectorAll('*').length,
                // Memory usage (if available)
                memory: performance.memory ? {
                    used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + 'MB',
                    total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024) + 'MB'
                } : 'Not available',
                // Navigation timing
                loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart + 'ms',
                // Paint metrics
                firstPaint: performance.getEntriesByType('paint')
                    .find(entry => entry.name === 'first-paint')?.startTime.toFixed(2) + 'ms' || 'N/A'
            };

            document.getElementById('performance-metrics').innerHTML = `
                <p><strong>DOM Elements:</strong> ${metrics.domElements}</p>
                <p><strong>JS Heap:</strong> ${typeof metrics.memory === 'object' ? metrics.memory.used + ' / ' + metrics.memory.total : metrics.memory}</p>
                <p><strong>Load Time:</strong> ${metrics.loadTime}</p>
                <p><strong>First Paint:</strong> ${metrics.firstPaint}</p>
                <p><small>💡 Những metrics này giúp monitor performance trong development</small></p>
            `;
        }

        // Run performance measurement
        window.addEventListener('load', measurePerformance);

        // Demo cross-domain fetch (sẽ fail do CORS, nhưng show concept)
        async function demoCORS() {
            try {
                const response = await fetch('https://jsonplaceholder.typicode.com/posts/1');
                const data = await response.json();
                console.log('✅ CORS request successful:', data.title);
            } catch (error) {
                console.log('❌ CORS blocked (expected):', error.message);
            }
        }

        demoCORS();

        // Device detection demo
        function detectDevice() {
            const ua = navigator.userAgent;
            const devices = ['Android', 'iPhone', 'iPad', 'Windows Phone'];
            const detected = devices.find(device => ua.includes(device)) || 'Desktop';
            console.log(`📱 Device detected: ${detected}`);
            return detected;
        }

        detectDevice();
    </script>
</body>
</html>
```


---


## 🎯 TÓM TẮT QUAN TRỌNG


>
> **💡 Key Takeaways:**
>
>
> 1. **Mobile-first approach** với proper viewport setup
> 2. **Selective hardware acceleration** - chỉ enable khi cần
> 3. **Modern CORS** thay thế JSONP deprecated
> 4. **Performance monitoring** là must-have skill
> 5. **Cross-browser testing** essential cho production
>
>


**🚀 Next Steps:** Practice implementing các techniques này trong personal projects, measure performance impact, và build up portfolio với optimized code examples.
