# Hướng Dẫn Học Tập: Hiển Thị Chiều Rộng Cửa Sổ Theo Thời Gian Thực trong React

## Mục tiêu
Xây dựng một component React hiển thị chiều rộng cửa sổ trình duyệt theo thời gian thực, sử dụng Custom Hook và kỹ thuật debounce để tối ưu hiệu suất.

---

## 📋 Code hoàn chỉnh

```javascript
import { useState, useEffect, useCallback } from 'react';

// Hàm debounce
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Custom Hook
function useWindowWidth(delay = 300) {
  const [width, setWidth] = useState(window.innerWidth);

  const handleResize = useCallback(() => {
    setWidth(window.innerWidth);
  }, []);

  useEffect(() => {
    // Tạo phiên bản debounce của hàm xử lý resize
    const debouncedHandleResize = debounce(handleResize, delay);
    
    // Thêm event listener
    window.addEventListener('resize', debouncedHandleResize);
    
    // Thực thi ngay lập tức để lấy chiều rộng ban đầu
    handleResize();
    
    // Cleanup function
    return () => {
      window.removeEventListener('resize', debouncedHandleResize);
    };
  }, [handleResize, delay]);

  return width;
}

// Ví dụ sử dụng
function WindowWidthDisplay() {
  const windowWidth = useWindowWidth();

  return (
    <div>
      <h2>Hiển thị chiều rộng cửa sổ theo thời gian thực</h2>
      <p>Chiều rộng cửa sổ hiện tại: {windowWidth}px</p>
    </div>
  );
}

export default WindowWidthDisplay;
```

---

## 🔍 Phân tích chi tiết từng phần

### 1. Hàm Debounce

```javascript
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
```

#### Debounce là gì?
**Debounce** là kỹ thuật trзадержки việc thực thi một hàm cho đến khi một khoảng thời gian nhất định đã trôi qua kể từ lần gọi cuối cùng.

#### Tại sao cần Debounce?
- Event `resize` được kích hoạt **rất nhiều lần** khi người dùng thay đổi kích thước cửa sổ
- Mỗi lần kích hoạt sẽ gọi `setState`, gây ra re-render
- Quá nhiều re-render → **giảm hiệu suất**, giao diện bị lag

#### Cách hoạt động:

```
Không có debounce:
resize → update → render
resize → update → render  
resize → update → render (100+ lần/giây)

Có debounce (300ms):
resize → chờ → resize → chờ → resize → chờ 300ms → update → render
```

#### Phân tích từng dòng:

```javascript
function debounce(func, wait) {
  let timeout;  // Biến lưu trữ timer ID
  
  return function executedFunction(...args) {
    // Hàm này sẽ được gọi mỗi khi event xảy ra
    
    const later = () => {
      clearTimeout(timeout);  // Xóa timer cũ
      func(...args);          // Thực thi hàm gốc
    };
    
    clearTimeout(timeout);           // Hủy timer trước đó (nếu có)
    timeout = setTimeout(later, wait); // Tạo timer mới
  };
}
```

#### Ví dụ minh họa:

```javascript
// Không có debounce
window.addEventListener('resize', () => {
  console.log('Resize!'); // In ra hàng trăm lần
});

// Có debounce
const debouncedResize = debounce(() => {
  console.log('Resize!'); // Chỉ in ra sau khi dừng resize 300ms
}, 300);

window.addEventListener('resize', debouncedResize);
```

---

### 2. Custom Hook: useWindowWidth

```javascript
function useWindowWidth(delay = 300) {
  const [width, setWidth] = useState(window.innerWidth);

  const handleResize = useCallback(() => {
    setWidth(window.innerWidth);
  }, []);

  useEffect(() => {
    const debouncedHandleResize = debounce(handleResize, delay);
    window.addEventListener('resize', debouncedHandleResize);
    handleResize();
    
    return () => {
      window.removeEventListener('resize', debouncedHandleResize);
    };
  }, [handleResize, delay]);

  return width;
}
```

#### Custom Hook là gì?
Custom Hook là hàm JavaScript bắt đầu bằng `use` và có thể gọi các React Hooks khác bên trong.

#### Lợi ích của Custom Hook:
- **Tái sử dụng logic**: Dùng ở nhiều component khác nhau
- **Tách biệt concerns**: Logic riêng biệt với UI
- **Dễ test**: Test logic độc lập với component
- **Code sạch hơn**: Component đơn giản, dễ đọc

---

### 3. useState - Quản lý state

```javascript
const [width, setWidth] = useState(window.innerWidth);
```

#### Giải thích:
- `width`: Biến state lưu chiều rộng hiện tại
- `setWidth`: Hàm để cập nhật state
- `window.innerWidth`: Giá trị khởi tạo (chiều rộng ban đầu)

#### window.innerWidth là gì?
- Thuộc tính của browser API
- Trả về chiều rộng viewport (vùng hiển thị) tính bằng pixels
- Không bao gồm scrollbar

```javascript
console.log(window.innerWidth);  // Ví dụ: 1920
console.log(window.outerWidth);  // Chiều rộng toàn bộ cửa sổ browser
```

---

### 4. useCallback - Tối ưu hóa function

```javascript
const handleResize = useCallback(() => {
  setWidth(window.innerWidth);
}, []);
```

#### useCallback là gì?
Hook giúp **ghi nhớ (memoize)** một function, chỉ tạo lại khi dependencies thay đổi.

#### Tại sao cần useCallback ở đây?

**Không dùng useCallback:**
```javascript
// Mỗi lần component re-render, tạo function mới
const handleResize = () => {
  setWidth(window.innerWidth);
};

useEffect(() => {
  // Function mới → useEffect chạy lại → vòng lặp vô hạn
}, [handleResize]); // ⚠️ handleResize thay đổi mỗi lần render
```

**Dùng useCallback:**
```javascript
// Function được ghi nhớ, không tạo lại
const handleResize = useCallback(() => {
  setWidth(window.innerWidth);
}, []); // ✅ Chỉ tạo 1 lần

useEffect(() => {
  // handleResize không đổi → useEffect chỉ chạy 1 lần
}, [handleResize]);
```

#### Dependencies array `[]`:
- Array rỗng → function chỉ được tạo **1 lần duy nhất**
- Nếu có dependencies → function được tạo lại khi dependencies thay đổi

---

### 5. useEffect - Side Effects

```javascript
useEffect(() => {
  const debouncedHandleResize = debounce(handleResize, delay);
  window.addEventListener('resize', debouncedHandleResize);
  handleResize();
  
  return () => {
    window.removeEventListener('resize', debouncedHandleResize);
  };
}, [handleResize, delay]);
```

#### useEffect là gì?
Hook để thực hiện **side effects** (tác động phụ) như:
- Gọi API
- Đăng ký event listeners
- Thao tác DOM
- Timers (setTimeout, setInterval)

#### Phân tích từng bước:

**Bước 1: Tạo debounced function**
```javascript
const debouncedHandleResize = debounce(handleResize, delay);
```
- Tạo phiên bản debounce của `handleResize`
- `delay` mặc định là 300ms

**Bước 2: Đăng ký event listener**
```javascript
window.addEventListener('resize', debouncedHandleResize);
```
- Lắng nghe sự kiện `resize` trên window
- Khi resize xảy ra → gọi `debouncedHandleResize`

**Bước 3: Lấy giá trị ban đầu**
```javascript
handleResize();
```
- Gọi ngay lập tức để set chiều rộng ban đầu
- Không cần chờ user resize

**Bước 4: Cleanup function**
```javascript
return () => {
  window.removeEventListener('resize', debouncedHandleResize);
};
```
- Hàm cleanup chạy khi:
  - Component unmount (bị xóa khỏi DOM)
  - Dependencies thay đổi (trước khi effect chạy lại)
- **Quan trọng**: Phải remove listener để tránh **memory leak**

#### Dependencies array `[handleResize, delay]`:
- Effect chạy lại khi `handleResize` hoặc `delay` thay đổi
- Vì `handleResize` được memoize bằng `useCallback` → chỉ chạy 1 lần

---

### 6. Component sử dụng Hook

```javascript
function WindowWidthDisplay() {
  const windowWidth = useWindowWidth();

  return (
    <div>
      <h2>Hiển thị chiều rộng cửa sổ theo thời gian thực</h2>
      <p>Chiều rộng cửa sổ hiện tại: {windowWidth}px</p>
    </div>
  );
}
```

#### Đơn giản và sạch sẽ:
- Chỉ cần gọi `useWindowWidth()`
- Không cần quan tâm logic bên trong
- Component tập trung vào UI

---

## 🎯 Luồng hoạt động (Flow)

### Lần đầu tiên component render:

```
1. Component mount
   ↓
2. useState khởi tạo: width = window.innerWidth (ví dụ: 1920)
   ↓
3. useCallback tạo handleResize function
   ↓
4. useEffect chạy:
   - Tạo debouncedHandleResize
   - Đăng ký window.addEventListener('resize', ...)
   - Gọi handleResize() → setWidth(1920)
   ↓
5. Component render với width = 1920
```

### Khi user resize cửa sổ:

```
1. User kéo cửa sổ → event 'resize' kích hoạt
   ↓
2. debouncedHandleResize được gọi
   ↓
3. Debounce chờ 300ms
   ↓
4. Nếu không có resize mới trong 300ms:
   - handleResize() được thực thi
   - setWidth(window.innerWidth) → cập nhật state
   ↓
5. Component re-render với width mới
   ↓
6. UI cập nhật hiển thị chiều rộng mới
```

### Khi component unmount:

```
1. Component bị xóa khỏi DOM
   ↓
2. Cleanup function chạy
   ↓
3. window.removeEventListener('resize', ...) được gọi
   ↓
4. Event listener bị xóa → không còn memory leak
```

---

## 💡 Các vấn đề thường gặp và giải pháp

### Vấn đề 1: Memory Leak

**Lỗi:**
```javascript
useEffect(() => {
  window.addEventListener('resize', handleResize);
  // ❌ Thiếu cleanup function
});
```

**Hậu quả:**
- Mỗi lần component re-render → thêm listener mới
- Listener cũ không bị xóa → tích lũy
- Gây memory leak và hiệu suất giảm

**Giải pháp:**
```javascript
useEffect(() => {
  window.addEventListener('resize', handleResize);
  
  return () => {
    window.removeEventListener('resize', handleResize); // ✅ Cleanup
  };
}, [handleResize]);
```

---

### Vấn đề 2: Infinite Loop

**Lỗi:**
```javascript
const handleResize = () => {  // ❌ Không dùng useCallback
  setWidth(window.innerWidth);
};

useEffect(() => {
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, [handleResize]); // ⚠️ handleResize thay đổi mỗi lần render
```

**Hậu quả:**
- Component render → tạo `handleResize` mới
- `handleResize` thay đổi → useEffect chạy lại
- useEffect chạy → có thể trigger re-render
- Vòng lặp vô hạn

**Giải pháp:**
```javascript
const handleResize = useCallback(() => {  // ✅ Memoize function
  setWidth(window.innerWidth);
}, []);
```

---

### Vấn đề 3: Quá nhiều re-renders

**Lỗi:**
```javascript
useEffect(() => {
  window.addEventListener('resize', () => {
    setWidth(window.innerWidth); // ❌ Không có debounce
  });
});
```

**Hậu quả:**
- Resize event kích hoạt hàng trăm lần/giây
- Mỗi lần → setState → re-render
- UI bị lag, hiệu suất kém

**Giải pháp:**
```javascript
const debouncedHandleResize = debounce(handleResize, 300); // ✅ Debounce
window.addEventListener('resize', debouncedHandleResize);
```

---

### Vấn đề 4: SSR (Server-Side Rendering)

**Lỗi:**
```javascript
const [width, setWidth] = useState(window.innerWidth);
// ❌ Lỗi: window is not defined (trên server)
```

**Giải pháp:**
```javascript
const [width, setWidth] = useState(() => {
  // ✅ Kiểm tra môi trường
  return typeof window !== 'undefined' ? window.innerWidth : 0;
});
```

---

## 🔧 Các biến thể và mở rộng

### Biến thể 1: Thêm chiều cao

```javascript
function useWindowSize(delay = 300) {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  const handleResize = useCallback(() => {
    setSize({
      width: window.innerWidth,
      height: window.innerHeight
    });
  }, []);

  useEffect(() => {
    const debouncedHandleResize = debounce(handleResize, delay);
    window.addEventListener('resize', debouncedHandleResize);
    handleResize();
    
    return () => {
      window.removeEventListener('resize', debouncedHandleResize);
    };
  }, [handleResize, delay]);

  return size;
}

// Sử dụng
function App() {
  const { width, height } = useWindowSize();
  
  return (
    <div>
      <p>Chiều rộng: {width}px</p>
      <p>Chiều cao: {height}px</p>
    </div>
  );
}
```

---

### Biến thể 2: Responsive breakpoints

```javascript
function useBreakpoint() {
  const width = useWindowWidth();
  
  const breakpoint = useMemo(() => {
    if (width < 640) return 'mobile';
    if (width < 768) return 'sm';
    if (width < 1024) return 'md';
    if (width < 1280) return 'lg';
    return 'xl';
  }, [width]);
  
  return { width, breakpoint };
}

// Sử dụng
function ResponsiveComponent() {
  const { width, breakpoint }= useBreakpoint();
  
  return (
    <div>
      <p>Breakpoint: {breakpoint}</p>
      <p>Width: {width}px</p>
      
      {breakpoint === 'mobile' && <MobileMenu />}
      {breakpoint !== 'mobile' && <DesktopMenu />}
    </div>
  );
}
```

---

### Biến thể 3: Throttle thay vì Debounce

```javascript
// Throttle: Thực thi tối đa 1 lần trong khoảng thời gian
function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

function useWindowWidthThrottled(limit = 300) {
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    const throttledResize = throttle(() => {
      setWidth(window.innerWidth);
    }, limit);
    
    window.addEventListener('resize', throttledResize);
    return () => window.removeEventListener('resize', throttledResize);
  }, [limit]);

  return width;
}
```

**So sánh Debounce vs Throttle:**

```
Debounce (300ms):
Event: ||||||||||||||||||||____
Call:                       ↑ (chỉ gọi sau khi dừng)

Throttle (300ms):
Event: ||||||||||||||||||||____
Call:  ↑       ↑       ↑       ↑ (gọi đều đặn)
```

---

### Biến thể 4: Với TypeScript

```typescript
import { useState, useEffect, useCallback } from 'react';

function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function useWindowWidth(delay: number = 300): number {
  const [width, setWidth] = useState<number>(() => {
    return typeof window !== 'undefined' ? window.innerWidth : 0;
  });

  const handleResize = useCallback(() => {
    setWidth(window.innerWidth);
  }, []);

  useEffect(() => {
    const debouncedHandleResize = debounce(handleResize, delay);
    window.addEventListener('resize', debouncedHandleResize);
    handleResize();
    
    return () => {
      window.removeEventListener('resize', debouncedHandleResize);
    };
  }, [handleResize, delay]);

  return width;
}

// Sử dụng với TypeScript
const WindowWidthDisplay: React.FC = () => {
  const windowWidth: number = useWindowWidth();

  return (
    <div>
      <h2>Chiều rộng cửa sổ: {windowWidth}px</h2>
    </div>
  );
};

export default WindowWidthDisplay;
```

---

## 📊 So sánh các phương pháp

| Phương pháp | Ưu điểm | Nhược điểm | Khi nào dùng |
|-------------|---------|------------|--------------|
| **Không tối ưu** | Đơn giản | Hiệu suất kém, lag UI | Không nên dùng |
| **Debounce** | Giảm số lần gọi, smooth | Có độ trễ cuối | Khi cần giá trị cuối cùng |
| **Throttle** | Update đều đặn, responsive | Vẫn gọi nhiều lần | Khi cần feedback liên tục |
| **ResizeObserver API** | Hiệu suất tốt nhất | Browser support hạn chế | Production apps |

---

## 🎓 Bài tập thực hành

### Bài tập 1: Thêm orientation detection

```javascript
function useWindowInfo(delay = 300) {
  const [info, setInfo] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
    orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
  });

  const handleResize = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    setInfo({
      width,
      height,
      orientation: width > height ? 'landscape' : 'portrait'
    });
  }, []);

  useEffect(() => {
    const debouncedHandleResize = debounce(handleResize, delay);
    window.addEventListener('resize', debouncedHandleResize);
    handleResize();
    
    return () => {
      window.removeEventListener('resize', debouncedHandleResize);
    };
  }, [handleResize, delay]);

  return info;
}

// Sử dụng
function OrientationDisplay() {
  const { width, height, orientation } = useWindowInfo();
  
  return (
    <div>
      <p>Kích thước: {width} x {height}</p>
      <p>Hướng: {orientation === 'landscape' ? 'Ngang' : 'Dọc'}</p>
    </div>
  );
}
```

---

### Bài tập 2: Lưu vào localStorage

```javascript
function useWindowWidthPersisted(delay = 300) {
  const [width, setWidth] = useState(() => {
    // Đọc từ localStorage khi khởi tạo
    const saved = localStorage.getItem('windowWidth');
    return saved ? parseInt(saved, 10) : window.innerWidth;
  });

  const handleResize = useCallback(() => {
    const newWidth = window.innerWidth;
    setWidth(newWidth);
    localStorage.setItem('windowWidth', newWidth.toString());
  }, []);

  useEffect(() => {
    const debouncedHandleResize = debounce(handleResize, delay);
    window.addEventListener('resize', debouncedHandleResize);
    handleResize();
    
    return () => {
      window.removeEventListener('resize', debouncedHandleResize);
    };
  }, [handleResize, delay]);

  return width;
}
```

---

### Bài tập 3: Với animation

```javascript
function useWindowWidthAnimated(delay = 300) {
  const [width, setWidth] = useState(window.innerWidth);
  const [isResizing, setIsResizing] = useState(false);

  const handleResize = useCallback(() => {
    setWidth(window.innerWidth);
    setIsResizing(false);
  }, []);

  useEffect(() => {
    const debouncedHandleResize = debounce(handleResize, delay);
    
    const onResize = () => {
      setIsResizing(true);
      debouncedHandleResize();
    };
    
    window.addEventListener('resize', onResize);
    handleResize();
    
    return () => {
      window.removeEventListener('resize', onResize);
    };
  }, [handleResize, delay]);

  return { width, isResizing };
}

// Sử dụng
function AnimatedDisplay() {
  const { width, isResizing }= useWindowWidthAnimated();
  
  return (
    <div style={{
      transition: 'all 0.3s ease',
      opacity: isResizing ? 0.5 : 1
    }}>
      <p>Chiều rộng: {width}px</p>
      {isResizing && <span>Đang thay đổi kích thước...</span>}
    </div>
  );
}
```

---

## 🌟 Best Practices

### 1. Luôn cleanup event listeners

```javascript
// ✅ GOOD
useEffect(() => {
  const handler = () => { /* ... */ };
  window.addEventListener('resize', handler);
  
  return () => {
    window.removeEventListener('resize', handler);
  };
}, []);

// ❌ BAD - Memory leak
useEffect(() => {
  window.addEventListener('resize', () => { /* ... */ });
  // Thiếu cleanup
}, []);
```

---

### 2. Sử dụng debounce/throttle cho events tần suất cao

```javascript
// ✅ GOOD - Với debounce
const debouncedHandler = debounce(handler, 300);
window.addEventListener('resize', debouncedHandler);

// ❌ BAD - Không tối ưu
window.addEventListener('resize', handler);
```

---

### 3. Memoize functions với useCallback

```javascript
// ✅ GOOD
const handleResize = useCallback(() => {
  setWidth(window.innerWidth);
}, []);

// ❌ BAD - Tạo function mới mỗi lần render
const handleResize = () => {
  setWidth(window.innerWidth);
};
```

---

### 4. Xử lý SSR

```javascript
// ✅ GOOD - An toàn với SSR
const [width, setWidth] = useState(() => {
  return typeof window !== 'undefined' ? window.innerWidth : 0;
});

// ❌ BAD - Lỗi trên server
const [width, setWidth] = useState(window.innerWidth);
```

---

### 5. Tách logic thành Custom Hook

```javascript
// ✅ GOOD - Tái sử dụng được
function useWindowWidth() { /* ... */ }

function ComponentA() {
  const width = useWindowWidth();
  // ...
}

function ComponentB() {
  const width = useWindowWidth();
  // ...
}

// ❌ BAD - Duplicate code
function ComponentA() {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => { /* ... */ }, []);
  // ...
}
```

---

## 📚 Thuật ngữ quan trọng

- **Custom Hook**: Hàm tái sử dụng logic, bắt đầu bằng `use`
- **Debounce**: Trì hoãn thực thi cho đến khi dừng gọi
- **Throttle**: Giới hạn số lần thực thi trong khoảng thời gian
- **Side Effect**: Tác động phụ (API, DOM, events, timers)
- **Cleanup Function**: Hàm dọn dẹp khi unmount hoặc trước khi effect chạy lại
- **Memory Leak**: Rò rỉ bộ nhớ do không giải phóng tài nguyên
- **Memoization**: Ghi nhớ giá trị để tránh tính toán lại
- **Event Listener**: Hàm lắng nghe sự kiện
- **Viewport**: Vùng hiển thị của trình duyệt

---

## 🎯 Kết luận

### Những điểm quan trọng cần nhớ:

1. **Debounce** giúp giảm số lần re-render khi resize
2. **useCallback** memoize function để tránh infinite loop
3. **useEffect** để đăng ký và cleanup event listeners
4. **Custom Hook** giúp tái sử dụng logic
5. **Cleanup function** bắt buộc để tránh memory leak

### Khi nào sử dụng pattern này:

- Responsive design cần biết kích thước viewport
- Adaptive layouts thay đổi theo screen size
- Performance monitoring
- Analytics tracking
- Conditional rendering dựa trên breakpoints

---

*Study guide này giúp bạn hiểu sâu về cách xây dựng một Custom Hook để theo dõi kích thước cửa sổ trong React. Hãy thực hành với các ví dụ và bài tập để nắm vững kiến thức!*
