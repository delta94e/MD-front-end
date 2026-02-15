# Study Guide: Micro-frontend - Cơ chế triển khai ở tầng thấp

## Mục lục
1. [Tổng quan về Micro-frontend](#1-tổng-quan)
2. [Cơ chế cách ly (Isolation)](#2-cơ-chế-cách-ly)
3. [Cách ly CSS](#3-cách-ly-css)
4. [Cơ chế giao tiếp (Communication)](#4-cơ-chế-giao-tiếp)
5. [Ví dụ thực tế](#5-ví-dụ-thực-tế)

---

## 1. Tổng quan về Micro-frontend

### Khái niệm
Micro-frontend là kiến trúc chia nhỏ ứng dụng frontend thành các module độc lập, mỗi module có thể:
- Phát triển độc lập
- Deploy riêng biệt
- Sử dụng công nghệ khác nhau
- Được quản lý bởi các team khác nhau

### Vấn đề cần giải quyết
- **Cách ly JavaScript**: Tránh xung đột biến toàn cục
- **Cách ly CSS**: Tránh style bị ghi đè
- **Giao tiếp**: Các sub-app cần trao đổi dữ liệu
- **Quản lý vòng đời**: Mount/unmount sub-app

---

## 2. Cơ chế cách ly (Isolation)

### 2.1. Proxy Sandbox (Hộp cát Proxy)

#### Nguyên lý hoạt động
Sử dụng ES6 Proxy để tạo một môi trường JavaScript độc lập cho mỗi sub-application.

#### Cách thức hoạt động

```javascript
// Triển khai Sandbox cơ bản dựa trên Proxy
class ProxySandbox {
  constructor(name) {
    this.name = name;
    this.running = false;
    
    // Tạo một object giả lập window
    const fakeWindow = {};
    
    // Lưu trữ các thuộc tính đã thay đổi
    this.modifiedProps = new Map();
    
    // Tạo Proxy
    this.proxy = new Proxy(fakeWindow, {
      get: (target, key) => {
        // Ưu tiên lấy từ fakeWindow
        if (key in target) {
          return target[key];
        }
        // Nếu không có thì lấy từ window thật
        return window[key];
      },
      
      set: (target, key, value) => {
        if (this.running) {
          // Lưu lại thuộc tính đã thay đổi
          if (!this.modifiedProps.has(key)) {
            this.modifiedProps.set(key, window[key]);
          }
          target[key] = value;
        }
        return true;
      },
      
      has: (target, key) => {
        return key in target || key in window;
      }
    });
  }
  
  // Kích hoạt sandbox
  active() {
    this.running = true;
  }
  
  // Hủy kích hoạt và dọn dẹp side effects
  inactive() {
    this.running = false;
    
    // Khôi phục lại các thuộc tính đã thay đổi
    this.modifiedProps.forEach((value, key) => {
      if (value === undefined) {
        delete window[key];
      } else {
        window[key] = value;
      }
    });
    
    this.modifiedProps.clear();
  }
}
```

#### Ví dụ sử dụng

```javascript
// Tạo sandbox cho sub-app
const sandbox = new ProxySandbox('app1');
sandbox.active();

// Code của sub-app chạy trong sandbox
(function(window) {
  // Các biến toàn cục chỉ tồn tại trong sandbox
  window.myGlobalVar = 'Hello from App1';
  window.myFunction = () => console.log('App1 function');
})(sandbox.proxy);

// Khi unmount sub-app
sandbox.inactive(); // Tất cả side effects bị xóa
```

### 2.2. Snapshot Sandbox (Hộp cát Snapshot)

#### Nguyên lý
Chụp "ảnh" trạng thái window trước và sau khi chạy sub-app.

```javascript
class SnapshotSandbox {
  constructor() {
    this.windowSnapshot = {};
    this.modifyPropsMap = {};
  }
  
  active() {
    // Lưu snapshot của window
    for (const prop in window) {
      this.windowSnapshot[prop] = window[prop];
    }
    
    // Khôi phục các thay đổi trước đó
    Object.keys(this.modifyPropsMap).forEach(prop => {
      window[prop] = this.modifyPropsMap[prop];
    });
  }
  
  inactive() {
    // So sánh và lưu các thay đổi
    for (const prop in window) {
      if (window[prop] !== this.windowSnapshot[prop]) {
        this.modifyPropsMap[prop] = window[prop];
        // Khôi phục lại giá trị ban đầu
        window[prop] = this.windowSnapshot[prop];
      }
    }
  }
}
```

### 2.3. So sánh các phương pháp Sandbox

| Phương pháp | Ưu điểm | Nhược điểm | Sử dụng khi |
|-------------|---------|------------|-------------|
| **Proxy Sandbox** | - Hiệu năng cao<br>- Hỗ trợ đa instance<br>- Cách ly tốt | - Không hỗ trợ IE | Ứng dụng hiện đại |
| **Snapshot Sandbox** | - Tương thích tốt<br>- Đơn giản | - Chỉ hỗ trợ 1 instance<br>- Hiệu năng thấp | Legacy browsers |

---

## 3. Cách ly CSS

### 3.1. Shadow DOM

#### Khái niệm
Shadow DOM tạo một DOM tree độc lập, style bên trong không ảnh hưởng ra ngoài và ngược lại.

#### Triển khai

```javascript
class MicroApp {
  constructor(container, html, css) {
    // Tạo Shadow DOM
    const shadow = container.attachShadow({ mode: 'open' });
    
    // Inject CSS và HTML
    shadow.innerHTML = `
      <style>
        ${css}
      </style>
      <div class="micro-app-content">
        ${html}
      </div>
    `;
  }
}

// Sử dụng
const container = document.getElementById('micro-app-container');
const app = new MicroApp(
  container,
  '<h1>Hello Micro-frontend</h1>',
  'h1 { color: red; font-size: 24px; }'
);
```

#### Ưu và nhược điểm

**Ưu điểm:**
- Cách ly hoàn toàn, không cần prefix
- Native browser API, hiệu năng tốt
- Không xung đột CSS

**Nhược điểm:**
- Không thể sử dụng global styles
- Khó debug
- Một số thư viện UI không tương thích

### 3.2. Scoped CSS

#### Nguyên lý
Thêm prefix/namespace cho tất cả CSS selector.

#### Triển khai thủ công

```javascript
class ScopedCSS {
  constructor(appName) {
    this.prefix = `micro-app-${appName}`;
  }
  
  // Thêm prefix vào CSS
  process(cssText) {
    // Regex đơn giản để thêm prefix
    return cssText.replace(
      /([^\r\n,{}]+)(,(?=[^}]*{)|\s*{)/g,
      (match, selector, separator) => {
        // Bỏ qua các selector đặc biệt
        if (selector.includes(':root') || 
            selector.includes('body') || 
            selector.includes('html')) {
          return match;
        }
        
        return `.${this.prefix} ${selector.trim()}${separator}`;
      }
    );
  }
  
  // Wrap container với prefix class
  wrapContainer(container) {
    container.classList.add(this.prefix);
  }
}

// Sử dụng
const scoped = new ScopedCSS('app1');
const originalCSS = `
  h1 { color: blue; }
  .title { font-size: 20px; }
`;

const scopedCSS = scoped.process(originalCSS);
console.log(scopedCSS);
// Output:
// .micro-app-app1 h1 { color: blue; }
// .micro-app-app1 .title { font-size: 20px; }
```

#### Qiankun's Scoped CSS

Qiankun sử dụng cơ chế tương tự nhưng phức tạp hơn:

```javascript
// Qiankun tự động wrap CSS
import { start } from 'qiankun';

start({
  sandbox: {
    strictStyleIsolation: false, // Không dùng Shadow DOM
    experimentalStyleIsolation: true // Dùng Scoped CSS
  }
});
```

### 3.3. CSS Modules

```javascript
// app1.module.css
.title {
  color: red;
}

// Webpack tự động tạo unique class name
// Output: .app1_title_3x7k2
```

### 3.4. CSS-in-JS

```javascript
import styled from 'styled-components';

// Mỗi component có unique class name
const Title = styled.h1`
  color: blue;
  font-size: 24px;
`;
```

---

## 4. Cơ chế giao tiếp (Communication)

### 4.1. Custom Events (Sự kiện tùy chỉnh)

#### Cách hoạt động
Sử dụng browser's Event API để giao tiếp giữa các app.

#### Triển khai

```javascript
// ===== Event Bus =====
class EventBus {
  constructor() {
    this.events = {};
  }
  
  // Đăng ký lắng nghe sự kiện
  on(eventName, callback) {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push(callback);
    
    // Trả về function để unsubscribe
    return () => {
      this.events[eventName] = this.events[eventName].filter(
        cb => cb !== callback
      );
    };
  }
  
  // Phát sự kiện
  emit(eventName, data) {
    if (this.events[eventName]) {
      this.events[eventName].forEach(callback => {
        callback(data);
      });
    }
  }
  
  // Xóa tất cả listeners
  off(eventName) {
    delete this.events[eventName];
  }
}

// Tạo global event bus
window.microEventBus = new EventBus();

// ===== Sub-app 1: Gửi sự kiện =====
// Khi user login
function handleLogin(userData) {
  window.microEventBus.emit('user:login', {
    userId: userData.id,
    username: userData.name,
    timestamp: Date.now()
  });
}

// ===== Sub-app 2: Nhận sự kiện =====
// Lắng nghe sự kiện login
const unsubscribe = window.microEventBus.on('user:login', (data) => {
  console.log('User logged in:', data.username);
  updateUserUI(data);
});

// Cleanup khi unmount
function onUnmount() {
  unsubscribe();
}
```

#### Sử dụng Native CustomEvent

```javascript
// ===== Sub-app 1: Phát sự kiện =====
function sendMessage(message) {
  const event = new CustomEvent('micro:message', {
    detail: {
      from: 'app1',
      message: message,
      timestamp: Date.now()
    },
    bubbles: true,
    composed: true
  });
  
  window.dispatchEvent(event);
}

// ===== Main app hoặc Sub-app 2: Lắng nghe =====
window.addEventListener('micro:message', (event) => {
  console.log('Received message:', event.detail);
  
  if (event.detail.from === 'app1') {
    handleApp1Message(event.detail.message);
  }
});

// Cleanup
window.removeEventListener('micro:message', handler);
```

### 4.2. Props Communication (Qiankun)

```javascript
// ===== Main App =====
import { registerMicroApps, start } from 'qiankun';

// Shared state
const sharedState = {
  user: null,
  theme: 'light'
};

registerMicroApps([
  {
    name: 'app1',
    entry: '//localhost:8081',
    container: '#container',
    activeRule: '/app1',
    props: {
      // Truyền data xuống sub-app
      data: sharedState,
      
      // Truyền callback functions
      onUserChange: (user) => {
        sharedState.user = user;
        // Notify các app khác
      },
      
      onThemeChange: (theme) => {
        sharedState.theme = theme;
      }
    }
  }
]);

start();

// ===== Sub-app =====
// Nhận props từ main app
export async function mount(props) {
  console.log('Received props:', props);
  
  // Sử dụng shared data
  const currentUser = props.data.user;
  
  // Gọi callback để update
  props.onUserChange({ id: 1, name: 'John' });
}
```

### 4.3. Global State Management

#### Sử dụng Redux/MobX

```javascript
// ===== Shared Store =====
import { createStore } from 'redux';

// Tạo global store
const globalStore = createStore(reducer);

// Expose qua window
window.__GLOBAL_STORE__ = globalStore;

// ===== Sub-app 1: Dispatch action =====
window.__GLOBAL_STORE__.dispatch({
  type: 'USER_LOGIN',
  payload: { userId: 123, username: 'john' }
});

// ===== Sub-app 2: Subscribe changes =====
window.__GLOBAL_STORE__.subscribe(() => {
  const state = window.__GLOBAL_STORE__.getState();
  console.log('State updated:', state);
});
```

#### Sử dụng RxJS

```javascript
import { BehaviorSubject } from 'rxjs';

// ===== Shared Observable =====
class GlobalState {
  constructor() {
    this.user$ = new BehaviorSubject(null);
    this.theme$ = new BehaviorSubject('light');
  }
  
  setUser(user) {
    this.user$.next(user);
  }
  
  setTheme(theme) {
    this.theme$.next(theme);
  }
}

window.__GLOBAL_STATE__ = new GlobalState();

// ===== Sub-app 1: Update state =====
window.__GLOBAL_STATE__.setUser({ id: 1, name: 'John' });

// ===== Sub-app 2: Subscribe =====
const subscription = window.__GLOBAL_STATE__.user$.subscribe(user => {
  console.log('User changed:', user);
});

// Cleanup
subscription.unsubscribe();
```

### 4.4. LocalStorage/SessionStorage

```javascript
// ===== Sub-app 1: Lưu data =====
function saveUserData(user) {
  localStorage.setItem('micro:user', JSON.stringify(user));
  
  // Trigger storage event
  window.dispatchEvent(new Event('storage'));
}

// ===== Sub-app 2: Lắng nghe thay đổi =====
window.addEventListener('storage', (e) => {
  if (e.key === 'micro:user') {
    const user = JSON.parse(e.newValue);
    updateUI(user);
  }
});

// Hoặc polling
setInterval(() => {
  const user = JSON.parse(localStorage.getItem('micro:user'));
  if (user !== currentUser) {
    updateUI(user);
  }
}, 1000);
```

---

## 5. Ví dụ thực tế

### 5.1. Triển khai Micro-frontend đơn giản

```javascript
// ===== micro-frontend-framework.js =====
class MicroFrontendFramework {
  constructor() {
    this.apps = new Map();
    this.currentApp = null;
  }
  
  // Đăng ký sub-app
  registerApp(config) {
    const { name, entry, container, activeRule }= config;
    
    this.apps.set(name, {
      name,
      entry,
      container,
      activeRule,
      sandbox: null,
      status: 'NOT_LOADED' // NOT_LOADED, LOADING, LOADED, MOUNTED
    });
  }
  
  // Load sub-app
  async loadApp(name) {
    const app = this.apps.get(name);
    if (!app) return;
    
    if (app.status === 'LOADED' || app.status === 'MOUNTED') {
      return;
    }
    
    app.status = 'LOADING';
    
    try {
      // Fetch HTML
      const html = await fetch(app.entry).then(res => res.text());
      
      // Parse HTML để lấy JS và CSS
      const { js, css }= this.parseHTML(html);
      
      // Tạo sandbox
      app.sandbox = new ProxySandbox(name);
      
      // Inject CSS với scoped
      this.injectCSS(css, name);
      
      // Execute JS trong sandbox
      app.sandbox.active();
      this.executeJS(js, app.sandbox.proxy);
      
      app.status = 'LOADED';
    } catch (error) {
      console.error(`Failed to load app ${name}:`, error);
      app.status = 'NOT_LOADED';
    }
  }
  
  // Mount sub-app
  async mountApp(name) {
    const app = this.apps.get(name);
    if (!app || app.status !== 'LOADED') return;
    
    // Unmount current app
    if (this.currentApp && this.currentApp !== name) {
      await this.unmountApp(this.currentApp);
    }
    
    // Mount new app
    const container = document.querySelector(app.container);
    if (container) {
      app.sandbox.active();
      
      // Call mount lifecycle
      if (window[`${name}_mount`]) {
        await window[`${name}_mount`](container);
      }
      
      app.status = 'MOUNTED';
      this.currentApp = name;
    }
  }
  
  // Unmount sub-app
  async unmountApp(name) {
    const app = this.apps.get(name);
    if (!app || app.status !== 'MOUNTED') return;
    
    // Call unmount lifecycle
    if (window[`${name}_unmount`]) {
      await window[`${name}_unmount`]();
    }
    
    // Deactivate sandbox
    app.sandbox.inactive();
    
    // Clear container
    const container = document.querySelector(app.container);
    if (container) {
      container.innerHTML = '';
    }
    
    app.status = 'LOADED';
    this.currentApp = null;
  }
  
  // Parse HTML
  parseHTML(html) {
    const jsRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
    const cssRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
    
    let js = '';
    let css = '';
    let match;
    
    while ((match = jsRegex.exec(html)) !== null) {
      js += match[1] + '\n';
    }
    
    while ((match = cssRegex.exec(html)) !== null) {
      css += match[1] + '\n';
    }
    
    return { js, css };
  }
  
  // Inject CSS với scoped
  injectCSS(css, appName) {
    const scopedCSS = this.scopeCSS(css, appName);
    const style = document.createElement('style');
    style.setAttribute('data-app', appName);
    style.textContent = scopedCSS;
    document.head.appendChild(style);
  }
  
  // Scope CSS
  scopeCSS(css, appName) {
    const prefix = `.micro-app-${appName}`;
    return css.replace(
      /([^\r\n,{}]+)(,(?=[^}]*{)|\s*{)/g,
      (match, selector, separator) => {
        if (selector.includes(':root') || 
            selector.includes('body') || 
            selector.includes('html')) {
          return match;
        }
        return `${prefix} ${selector.trim()}${separator}`;
      }
    );
  }
  
  // Execute JS
  executeJS(js, sandbox) {
    try {
      // Wrap code trong function để tránh pollution
      const code = `
        (function(window) {
          ${js}
        })(this);
      `;
      
      // Execute trong sandbox context
      new Function('window', code).call(sandbox, sandbox);
    } catch (error) {
      console.error('Failed to execute JS:', error);
    }
  }
  
  // Start framework
  start() {
    // Listen route changes
    window.addEventListener('hashchange', () => {
      this.handleRouteChange();
    });
    
    // Initial route
    this.handleRouteChange();
  }
  
  // Handle route change
  async handleRouteChange() {
    const hash = window.location.hash.slice(1);
    
    for (const [name, app] of this.apps) {
      if (hash.startsWith(app.activeRule)) {
        await this.loadApp(name);
        await this.mountApp(name);
        return;
      }
    }
  }
}

// ===== Sử dụng =====
const framework = new MicroFrontendFramework();

// Đăng ký apps
framework.registerApp({
  name: 'app1',
  entry: 'http://localhost:8081/index.html',
  container: '#micro-app-container',
  activeRule: '/app1'
});

framework.registerApp({
  name: 'app2',
  entry: 'http://localhost:8082/index.html',
  container: '#micro-app-container',
  activeRule: '/app2'
});

// Start
framework.start();
```

### 5.2. Sub-app Example

```javascript
// ===== app1/index.html =====
<!DOCTYPE html>
<html>
<head>
  <style>
    .container {
      padding: 20px;
      background: #f0f0f0;
    }
    
    h1 {
      color: #333;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Sub Application 1</h1>
    <button id="sendBtn">Send Message</button>
  </div>
  
  <script>
    // Export lifecycle hooks
    window.app1_mount = async function(container) {
      console.log('App1 mounted');
      
      // Setup event listeners
      document.getElementById('sendBtn').addEventListener('click', () => {
        window.microEventBus.emit('app1:message', {
          text: 'Hello from App1',
          timestamp: Date.now()
        });
      });
    };
    
    window.app1_unmount = async function() {
      console.log('App1 unmounted');
      // Cleanup
    };
  </script>
</body>
</html>
```

---

## 6. Tổng kết

### Các kỹ thuật chính

| Kỹ thuật | Mục đích | Công cụ/Framework |
|----------|----------|-------------------|
| **Proxy Sandbox** | Cách ly JavaScript | Qiankun, Custom |
| **Shadow DOM** | Cách ly CSS hoàn toàn | Native API |
| **Scoped CSS** | Cách ly CSS với prefix | Qiankun, PostCSS |
| **Custom Events** | Giao tiếp giữa apps | Native API |
| **Props/Callbacks** | Truyền data từ main app | Qiankun |
| **Global State** | Shared state management | Redux, MobX, RxJS |

### Best Practices

1. **Cách ly:**
   - Luôn sử dụng sandbox cho JS
   - Chọn Shadow DOM nếu có thể, fallback sang Scoped CSS
   - Tránh sử dụng global variables

2. **Giao tiếp:**
   - Sử dụng Event Bus cho loose coupling
   - Props/Callbacks cho tight coupling
   - Tránh over-communication

3. **Performance:**
   - Lazy load sub-apps
   - Preload critical apps
   - Cache resources

4. **Error Handling:**
   - Isolate errors trong từng sub-app
   - Implement error boundaries
   - Logging và monitoring

### Frameworks phổ biến

- **Qiankun**: Framework hoàn chỉnh từ Alibaba
- **Single-SPA**: Framework linh hoạt, community lớn
- **Module Federation**: Webpack 5 native solution
- **Micro-app**: Lightweight, dựa trên Web Components

---

## Tài liệu tham khảo

- [Qiankun Documentation](https://qiankun.umijs.org/)
- [Single-SPA Documentation](https://single-spa.js.org/)
- [MDN - Shadow DOM](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_shadow_DOM)
- [MDN - Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy)
