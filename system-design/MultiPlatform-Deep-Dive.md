# Multi-Platform Development — Deep Dive

> 📅 2026-02-13 · ⏱ 30 phút đọc
>
> SPA, Viewport & Units, Mobile Adaptation,
> React Native, Electron, Mini Programs, Cross-Platform Frameworks
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Full-Stack Frontend Interview

---

## Mục Lục

| #   | Phần                                  |
| --- | ------------------------------------- |
| 1   | SPA — Single Page Application         |
| 2   | Viewport, Resolution & CSS Units      |
| 3   | Mobile Page Adaptation                |
| 4   | React Native — Mobile Development     |
| 5   | Electron — Desktop Development        |
| 6   | Mini Programs — WeChat / Zalo         |
| 7   | Cross-Platform Frameworks — Nguyên lý |
| 8   | Tổng kết & Checklist phỏng vấn        |

---

## §1. SPA — Single Page Application

```
SPA (Single Page Application):
═══════════════════════════════════════════════════════════════

  → 1 file HTML DUY NHẤT + JS render nội dung!
  → Navigate KHÔNG reload toàn trang (client-side routing!)
  → JS thay đổi DOM, cập nhật URL (History API!)
  → Ví dụ: Gmail, Facebook, Twitter, Notion

  MPA (Multi Page Application):
  → Mỗi route = 1 HTML file MỚI từ server!
  → Navigate → full page reload!
  → Ví dụ: Blog WordPress truyền thống

  ┌───────── MPA ─────────────────────────────────────┐
  │ /home → Server → home.html (full reload!)         │
  │ /about → Server → about.html (full reload!)       │
  │ /contact → Server → contact.html (full reload!)   │
  └───────────────────────────────────────────────────┘

  ┌───────── SPA ─────────────────────────────────────┐
  │ /home   ┐                                         │
  │ /about  ├→ index.html + app.js → JS render view!  │
  │ /contact┘  (NO reload! JS swap component!)        │
  └───────────────────────────────────────────────────┘
```

```
SPA ROUTING — 2 MODES:
═══════════════════════════════════════════════════════════════

  ① HASH MODE (#):
     → URL: example.com/#/about
     → window.addEventListener('hashchange', handler)
     → Hash thay đổi → KHÔNG gửi request tới server!
     → Browser KHÔNG reload!
     → ⚠️ Xấu URL, SEO kém, nhưng ĐƠN GIẢN!

  ② HISTORY MODE:
     → URL: example.com/about (sạch, đẹp!)
     → history.pushState / replaceState → đổi URL
     → window.addEventListener('popstate', handler)
     → ⚠️ Server phải config: TẤT CẢ routes → index.html!
     → Nếu không: /about → 404 (server không biết route!)

  ┌──── Hash Routing ──────────────────┐
  │ URL: site.com/#/about              │
  │ hashchange → swap view!            │
  │ Server: chỉ cần serve 1 file!      │
  │ SEO: ❌ (Search engine bỏ qua #!)  │
  └────────────────────────────────────┘

  ┌──── History Routing ───────────────┐
  │ URL: site.com/about                │
  │ pushState + popstate → swap view!  │
  │ Server: CẦN fallback → index.html! │
  │ SEO: ✅ (nếu SSR/SSG!)            │
  └────────────────────────────────────┘
```

```javascript
// ═══ IMPLEMENT SIMPLE SPA ROUTER ═══

class Router {
  constructor() {
    this.routes = {};
    window.addEventListener("popstate", () => this.resolve());
  }

  // Đăng ký route:
  addRoute(path, handler) {
    this.routes[path] = handler;
    return this; // Chainable!
  }

  // Navigate:
  navigate(path) {
    history.pushState(null, "", path);
    this.resolve();
  }

  // Resolve current path:
  resolve() {
    const path = location.pathname;
    const handler = this.routes[path] || this.routes["*"];
    if (handler) handler();
  }
}

// SỬ DỤNG:
const router = new Router();
router
  .addRoute("/", () => render("Home Page"))
  .addRoute("/about", () => render("About Page"))
  .addRoute("*", () => render("404 Not Found"));

document.querySelectorAll("a[data-spa]").forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    router.navigate(link.pathname);
  });
});
```

```
SPA ƯU ĐIỂM vs NHƯỢC ĐIỂM:
═══════════════════════════════════════════════════════════════

  ✅ ƯU ĐIỂM:
  → Trải nghiệm MƯỢT (không reload!)
  → Nhanh sau lần tải đầu (chỉ fetch data!)
  → Tách biệt Frontend/Backend (RESTful API!)
  → Tương tác native-like (transitions, animations!)

  ❌ NHƯỢC ĐIỂM:
  → Initial load CHẬM (tải JS bundle lớn!)
  → SEO KÉM (HTML trống, content render bằng JS!)
  → Memory leaks dễ xảy ra (SPA sống lâu!)
  → Browser Back/Forward cần xử lý cẩn thận

  GIẢI PHÁP:
  → Code Splitting: lazy load routes → giảm initial bundle!
  → SSR (Server-Side Rendering): render HTML trên server → SEO!
  → SSG (Static Site Generation): pre-render tại build time!
  → Service Worker: cache assets → offline support!

  FRAMEWORKS CHO SPA:
  → React (+ Next.js SSR/SSG!)
  → Vue (+ Nuxt.js SSR/SSG!)
  → Angular
  → Svelte (+ SvelteKit!)
```

---

## §2. Viewport, Resolution & CSS Units

```
VIEWPORT:
═══════════════════════════════════════════════════════════════

  Layout Viewport: kích thước CSS "canvas" mặc định
  → Mobile mặc định: ~980px (thu nhỏ trang desktop!)
  → Dùng meta viewport để override!

  Visual Viewport: phần THỰC SỰ nhìn thấy trên screen
  → Zoom in → visual viewport NHỎ hơn layout viewport!

  Ideal Viewport: kích thước TỐI ƯU cho device
  → width=device-width → layout = ideal viewport!

  <meta name="viewport" content="
    width=device-width,     ← Layout = device width!
    initial-scale=1.0,      ← Không zoom lúc đầu!
    maximum-scale=1.0,      ← Không cho zoom (accessibility ⚠️!)
    user-scalable=no        ← Không cho user zoom
  ">

  ⚠️ Best practice:
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  → ĐỪNG disable zoom! (accessibility violation!)
```

```
RESOLUTION & PIXEL CONCEPTS:
═══════════════════════════════════════════════════════════════

  ① PHYSICAL PIXEL (Device Pixel):
     → Điểm ảnh THỰC TẾ trên screen!
     → iPhone 14 Pro: 2556 × 1179 physical pixels

  ② CSS PIXEL (Logical Pixel):
     → Đơn vị dùng trong CSS/JS!
     → 1 CSS pixel ≠ 1 physical pixel (trên HiDPI!)
     → iPhone 14 Pro: 852 × 393 CSS pixels

  ③ DPR (Device Pixel Ratio):
     → DPR = Physical Pixels / CSS Pixels
     → iPhone 14 Pro: DPR = 3 (2556/852 = 3)
     → window.devicePixelRatio → 3
     → 1 CSS pixel = 3×3 = 9 physical pixels!

  ④ PPI (Pixels Per Inch):
     → Mật độ physical pixels trên 1 inch!
     → iPhone 14 Pro: 460 PPI

  ⚠️ DPR vs PPI:
  → DPR = tỷ lệ physical/CSS (1, 2, 3...)
  → PPI = mật độ pixel trên phần cứng!
  → DPR ảnh hưởng CSS rendering!
  → PPI ảnh hưởng image clarity!

  → Image cho Retina (DPR=2): cần ảnh 2× kích thước!
  → srcset: <img srcset="img-1x.jpg 1x, img-2x.jpg 2x">
```

```
CSS UNITS — SO SÁNH:
═══════════════════════════════════════════════════════════════

  ┌─────────┬───────────────────────────────────────────────┐
  │ Unit    │ Giải thích                                     │
  ├─────────┼───────────────────────────────────────────────┤
  │ px      │ CSS pixel (logical!) — TUYỆT ĐỐI             │
  │         │ Không thay đổi theo context!                  │
  ├─────────┼───────────────────────────────────────────────┤
  │ em      │ Relative to PARENT font-size!                 │
  │         │ parent: 16px → 1.5em = 24px                   │
  │         │ ⚠️ Lồng nhau → NHÂN BỘI! (compound!)        │
  │         │ div(2em) > p(2em) = 4× root! 💀              │
  ├─────────┼───────────────────────────────────────────────┤
  │ rem     │ Relative to ROOT (<html>) font-size!          │
  │         │ html: 16px → 1.5rem = 24px LUÔN!             │
  │         │ ✅ Không compound! Predictable!               │
  ├─────────┼───────────────────────────────────────────────┤
  │ %       │ Relative to PARENT element                    │
  │         │ width: 50% = 50% parent width                 │
  ├─────────┼───────────────────────────────────────────────┤
  │ vw / vh │ Viewport width / height                       │
  │         │ 100vw = full viewport width                   │
  │         │ ⚠️ Mobile: 100vh > visible (address bar!)    │
  ├─────────┼───────────────────────────────────────────────┤
  │ dvh     │ Dynamic viewport height (mobile!)             │
  │         │ Thay đổi khi address bar hide/show!           │
  │         │ ✅ Fix cho mobile 100vh issue!                │
  ├─────────┼───────────────────────────────────────────────┤
  │ vmin    │ min(vw, vh) — responsive!                     │
  │ vmax    │ max(vw, vh)                                   │
  └─────────┴───────────────────────────────────────────────┘

  THỰC TẾ:
  → Layout: % hoặc vw/vh
  → Font size: rem (predictable!)
  → Component spacing: em (relative to component!)
  → Fixed values: px
  → Full-screen mobile: dvh (dynamic viewport!)
```

---

## §3. Mobile Page Adaptation

```
MOBILE ADAPTATION — CÁC PHƯƠNG PHÁP:
═══════════════════════════════════════════════════════════════

  ① REM + Root Font-size (phổ biến nhất!):
  → Thay đổi html font-size THEO screen width!
  → Tất cả element dùng rem → TỰ ĐỘNG scale!

  ② Viewport Units (vw):
  → Trực tiếp dùng vw cho mọi thứ!
  → 1vw = 1% viewport width

  ③ Media Queries (breakpoints):
  → Thay đổi layout tại các breakpoints!
  → Tailwind approach: sm, md, lg, xl, 2xl

  ④ Flexible Layout:
  → Flexbox + percentages + min/max
  → Fluid, không cần breakpoints!
```

```javascript
// ═══ CÁCH 1: REM Adaptation (flexible.js — Alibaba) ═══

// Nguyên lý: design width 750px; 1rem = 75px trên 750px screen
function setRemUnit() {
  const docEl = document.documentElement;
  const clientWidth = docEl.clientWidth;

  // Design width = 750, chia thành 10 phần:
  // 750px → 1rem = 75px
  // 375px → 1rem = 37.5px (tự scale!)
  const designWidth = 750;
  const rem = (clientWidth / designWidth) * 75;
  docEl.style.fontSize = rem + "px";
}

setRemUnit();
window.addEventListener("resize", setRemUnit);

// CSS: design file nói 150px → 150/75 = 2rem
// .box { width: 2rem; height: 2rem; }
// Trên 375px screen: 2 × 37.5 = 75px (đúng tỷ lệ!) ✅

// ⚠️ Dùng PostCSS plugin "postcss-pxtorem" → tự convert px→rem!

// ═══ CÁCH 2: Viewport Units (vw) ═══

// Design width = 750px; 100vw = 750px → 1px = 100/750 = 0.1333vw
// Design nói 150px → 150 × 100/750 = 20vw

// CSS:
// .box { width: 20vw; height: 20vw; }
// Trên 375px: 20vw = 75px (đúng!) ✅

// ⚠️ Dùng PostCSS plugin "postcss-px-to-viewport" → tự convert!
// postcss.config.js:
// module.exports = {
//     plugins: {
//         'postcss-px-to-viewport': {
//             viewportWidth: 750,
//             unitPrecision: 5,
//             viewportUnit: 'vw',
//         }
//     }
// };

// ═══ CÁCH 3: Media Queries ═══
/* CSS: */
// /* Mobile first! */
// .container { padding: 16px; }
//
// /* Tablet (≥768px) */
// @media (min-width: 768px) {
//     .container { max-width: 720px; margin: 0 auto; }
// }
//
// /* Desktop (≥1024px) */
// @media (min-width: 1024px) {
//     .container { max-width: 960px; }
// }
//
// /* Large (≥1280px) */
// @media (min-width: 1280px) {
//     .container { max-width: 1200px; }
// }
```

```
1PX BORDER VẤN ĐỀ (Retina!):
═══════════════════════════════════════════════════════════════

  DPR=2: CSS 1px = 2 physical px → border THẤY DÀY!
  DPR=3: CSS 1px = 3 physical px → CÒN DÀY HƠN!

  GIẢI PHÁP ① transform scale:
  .border-1px::after {
      content: '';
      position: absolute;
      left: 0; bottom: 0;
      width: 100%; height: 1px;
      background: #ccc;
      transform: scaleY(0.5);  /* DPR=2: 0.5 */
  }
  @media (-webkit-min-device-pixel-ratio: 3) {
      .border-1px::after {
          transform: scaleY(0.333);  /* DPR=3 */
      }
  }

  GIẢI PHÁP ② viewport scale (initial-scale=0.5):
  → DPR=2: <meta viewport initial-scale=0.5>
  → CSS 1px = 1 physical px! ✅
  → NHƯNG: tất cả kích thước phải ×2!

  GIẢI PHÁP ③ border-image / SVG:
  → Dùng SVG 1px line làm border-image!
```

---

## §4. React Native — Mobile Development

```
REACT NATIVE — NGUYÊN LÝ HOẠT ĐỘNG:
═══════════════════════════════════════════════════════════════

  → JS code → NATIVE UI components!
  → KHÔNG phải WebView! → Native performance!
  → "Learn once, write anywhere" (không phải "write once"!)

  KIẾN TRÚC (New Architecture — 2022+):
  ┌─────────────────────────────────────────────────┐
  │ JavaScript Thread                               │
  │ ┌──────────────────────────────────────────────┐│
  │ │ React Components → Virtual DOM → Diff        ││
  │ │ Business Logic, State Management             ││
  │ │ Engine: Hermes (AOT bytecode!) / JSC / V8    ││
  │ └───────────────────┬──────────────────────────┘│
  │                     │ JSI (JS Interface!)       │
  │                     │ (Direct C++ binding!)     │
  │                     │ (NO JSON serialization!)  │
  │                     ▼                           │
  │ ┌──────────────────────────────────────────────┐│
  │ │ Fabric (New Renderer)                         ││
  │ │ → C++ Shadow Tree (layout calculation!)       ││
  │ │ → Yoga engine (Flexbox layout!)              ││
  │ │ → Commit → Mount native views!               ││
  │ └──────────────────────────────────────────────┘│
  │                     │                           │
  │                     ▼                           │
  │ ┌──────────────────────────────────────────────┐│
  │ │ Native UI                                     ││
  │ │ iOS: UIView, UILabel, UIScrollView           ││
  │ │ Android: View, TextView, ScrollView          ││
  │ └──────────────────────────────────────────────┘│
  └─────────────────────────────────────────────────┘

  OLD ARCHITECTURE (Bridge):
  JS Thread ←— JSON Bridge (async, serialize!) —→ Native Thread
  → CHẬM! Serialize/deserialize mỗi message! Bottleneck!

  NEW ARCHITECTURE (JSI + Fabric + TurboModules):
  JS Thread ←— JSI (C++ direct sync!) —→ Native Thread
  → NHANH! Direct memory access! Synchronous khi cần!

  HERMES (JS Engine cho RN):
  → Ahead-of-Time (AOT) compile JS → bytecode tại BUILD TIME!
  → Không cần parse/compile JS lúc runtime!
  → Giảm startup time 50%+!
  → Giảm memory usage 30%+!
```

```javascript
// ═══ REACT NATIVE — CORE CONCEPTS ═══

// Component mapping:
// React Web       →  React Native
// <div>           →  <View>
// <span>/<p>      →  <Text>
// <img>           →  <Image>
// <input>         →  <TextInput>
// <button>        →  <TouchableOpacity> / <Pressable>
// <ul>/<li>       →  <FlatList> / <SectionList>
// <scroll>        →  <ScrollView>
// CSS             →  StyleSheet.create({})

import React from "react";
import { View, Text, StyleSheet, FlatList, Pressable } from "react-native";

const App = () => {
  const [items, setItems] = React.useState([
    { id: "1", title: "Learn React Native" },
    { id: "2", title: "Build an App" },
  ]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My App</Text>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable style={styles.item}>
            <Text>{item.title}</Text>
          </Pressable>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 16 },
  item: { padding: 12, borderBottomWidth: 1, borderColor: "#eee" },
});

// ⚠️ StyleSheet: chỉ subset CSS! Flexbox mặc định!
// → flexDirection mặc định: 'column' (Web = 'row'!)
// → Không có: float, grid, ::before, ::after
// → Đơn vị: chỉ number (= dp, auto-scale theo DPR!)

// PLATFORM ADAPTATION:
import { Platform } from "react-native";
const styles = StyleSheet.create({
  shadow: Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
    },
    android: { elevation: 5 },
  }),
});
```

---

## §5. Electron — Desktop Development

```
ELECTRON — NGUYÊN LÝ:
═══════════════════════════════════════════════════════════════

  → Chromium (render) + Node.js (backend) = Desktop App!
  → Web technologies → native desktop app!
  → Apps: VS Code, Slack, Discord, Notion, Figma Desktop

  KIẾN TRÚC:
  ┌─────────────────────────────────────────────────┐
  │ MAIN PROCESS (Node.js)                          │
  │ → 1 per app! Singleton!                         │
  │ → Quản lý: windows, menus, tray, dialogs        │
  │ → Truy cập: file system, OS APIs, native modules│
  │ → IPC: giao tiếp với renderer processes!        │
  ├─────────────────────────────────────────────────┤
  │                  IPC                            │
  │         (ipcMain ←→ ipcRenderer)                │
  ├──────────────┬──────────────┬───────────────────┤
  │ RENDERER 1   │ RENDERER 2   │ RENDERER 3        │
  │ (Chromium)   │ (Chromium)   │ (Chromium)        │
  │ HTML/CSS/JS  │ HTML/CSS/JS  │ HTML/CSS/JS       │
  │ = 1 window!  │ = 1 window!  │ = 1 window!       │
  │ React/Vue... │              │                   │
  └──────────────┴──────────────┴───────────────────┘

  Main Process:
  → BrowserWindow: tạo cửa sổ
  → Menu, Tray, Dialog, Notification
  → app lifecycle events
  → autoUpdater, powerMonitor

  Renderer Process:
  → Web page trong BrowserWindow
  → Giống browser tab!
  → ⚠️ Sandboxed! Không truy cập Node.js trực tiếp!
  → Dùng preload script + contextBridge!
```

```javascript
// ═══ ELECTRON — CODE STRUCTURE ═══

// main.js (Main Process):
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true, // ✅ Bảo mật!
      nodeIntegration: false, // ✅ Không cho Node trong renderer!
    },
  });
  win.loadFile("index.html");
}

app.whenReady().then(createWindow);

// IPC: nhận message từ renderer:
ipcMain.handle("read-file", async (event, filePath) => {
  const fs = require("fs").promises;
  return await fs.readFile(filePath, "utf-8");
});

// preload.js (Bridge giữa Main ↔ Renderer):
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  readFile: (path) => ipcRenderer.invoke("read-file", path),
  onUpdate: (callback) => ipcRenderer.on("update", callback),
});
// → Renderer truy cập: window.electronAPI.readFile(path)

// renderer.js (Renderer Process — Web!):
document.getElementById("load").addEventListener("click", async () => {
  const content = await window.electronAPI.readFile("./data.txt");
  document.getElementById("output").textContent = content;
});

// ⚠️ BẢO MẬT:
// ✅ contextIsolation: true (renderer KHÔNG truy cập Node!)
// ✅ preload + contextBridge (expose CHỈ APIs cần thiết!)
// ❌ nodeIntegration: true (remote code execution risk!)
```

```
ELECTRON vs TAURI:
═══════════════════════════════════════════════════════════════

  ┌──────────────────┬──────────────┬──────────────┐
  │ Feature          │ Electron     │ Tauri         │
  ├──────────────────┼──────────────┼──────────────┤
  │ Renderer         │ Chromium     │ System WebView│
  │ Backend          │ Node.js      │ Rust!         │
  │ Bundle size      │ ~150MB+ 💀  │ ~5-10MB! ⚡   │
  │ Memory           │ Heavy        │ Light!        │
  │ Performance      │ Good         │ Excellent!    │
  │ Ecosystem        │ Huge! NPM    │ Growing       │
  │ Maturity         │ ⭐⭐⭐⭐⭐  │ ⭐⭐⭐        │
  │ Learning curve   │ Easy (JS!)   │ Need Rust     │
  └──────────────────┴──────────────┴──────────────┘
```

---

## §6. Mini Programs — WeChat / Zalo

```
MINI PROGRAM — NGUYÊN LÝ:
═══════════════════════════════════════════════════════════════

  → Ứng dụng NHỎ chạy TRONG super app (WeChat, Zalo, Alipay...)
  → KHÔNG cần install từ App Store!
  → Hybrid: Rendering (WebView) + Logic (JS Engine) = 2 threads!

  DUAL-THREAD ARCHITECTURE:
  ┌──────────────────────────────────────────────────┐
  │ RENDER THREAD (WebView)     │ LOGIC THREAD       │
  │ → WXML/HTML → DOM           │ → JS (JSCore/V8)   │
  │ → WXSS/CSS → Styles         │ → App + Page logic  │
  │ → Chỉ RENDER! Không chạy JS!│ → Data binding      │
  │                              │ → API calls         │
  ├──────────────────────────────┼────────────────────┤
  │                    Native Layer                   │
  │  → Bridge communication!                         │
  │  → setData({}) → serialize → send → render!      │
  │  → Native components (map, video, camera)        │
  │  → wx.request, wx.login, wx.pay...              │
  └──────────────────────────────────────────────────┘

  TẠI SAO 2 THREADS?
  → Bảo mật: JS không truy cập DOM trực tiếp! (XSS-free!)
  → Kiểm soát: platform quản lý rendering!
  → ⚠️ Nhược: setData() = serialize + cross-thread communication = CHẬM!
  → ⚠️ Tối ưu: giảm setData() frequency + data size!

  LIFECYCLE:
  App: onLaunch → onShow → onHide → onError
  Page: onLoad → onShow → onReady → onHide → onUnload
```

```javascript
// ═══ WECHAT MINI PROGRAM CODE ═══

// app.json — Config:
// {
//     "pages": ["pages/index/index", "pages/about/about"],
//     "window": { "navigationBarTitleText": "My App" },
//     "tabBar": { "list": [{ "pagePath": "pages/index/index", "text": "Home" }]}
// }

// pages/index/index.wxml (Template — WXML):
// <view class="container">
//     <text>{{ message }}</text>
//     <button bindtap="handleTap">Click me</button>
//     <view wx:for="{{ items }}" wx:key="id">
//         <text>{{ item.name }}</text>
//     </view>
// </view>

// pages/index/index.js (Logic):
Page({
  data: {
    message: "Hello Mini Program!",
    items: [],
  },

  onLoad() {
    this.fetchItems();
  },

  handleTap() {
    this.setData({ message: "Tapped!" });
    // ⚠️ setData = cross-thread! Minimize calls!
  },

  async fetchItems() {
    const res = await wx.request({ url: "https://api.example.com/items" });
    this.setData({ items: res.data });
  },
});

// ⚠️ PERFORMANCE TIPS:
// ✅ Batch setData (gộp nhiều field 1 lần!)
// ✅ Chỉ setData fields THAY ĐỔI, không gửi cả object!
// ✅ Dùng wx:key cho list rendering!
// ❌ setData quá thường xuyên (scroll → throttle!)
// ❌ setData data quá lớn (> 256KB sẽ warning!)
```

---

## §7. Cross-Platform Frameworks — Nguyên lý

```
3 KIỂU CROSS-PLATFORM:
═══════════════════════════════════════════════════════════════

  ① WEBVIEW-BASED (Hybrid):
     → Cordova / Ionic / Capacitor
     → Web app chạy trong WebView!
     → JS Bridge → gọi native APIs
     → ✅ Dễ! Code Web bình thường!
     → ❌ Performance kém! Không native feel!

  ② NATIVE BRIDGE:
     → React Native / NativeScript
     → JS logic → Bridge → Native UI components!
     → UI thật sự NATIVE!
     → ✅ Native performance + feel!
     → ❌ Bridge overhead, platform-specific code

  ③ CUSTOM RENDERING ENGINE:
     → Flutter (Dart + Skia engine!)
     → Tự VẼ mọi pixel! Không dùng native UI!
     → ✅ Pixel-perfect consistent across platforms!
     → ✅ Cực kỳ performance (60/120fps!)
     → ❌ Không native feel (tự vẽ!)
     → ❌ Học Dart mới!

  ┌──── WebView ──────────────────────────────────┐
  │                                               │
  │  JS/HTML/CSS → WebView → Native Shell          │
  │                  ↕ Bridge                      │
  │               Native APIs                     │
  │                                               │
  │  Cordova, Ionic, Capacitor                    │
  └───────────────────────────────────────────────┘

  ┌──── Native Bridge ───────────────────────────┐
  │                                               │
  │  JS (React) → Bridge/JSI → Native UI           │
  │  Logic: JS  │  UI: Native!                    │
  │                                               │
  │  React Native, NativeScript                   │
  └───────────────────────────────────────────────┘

  ┌──── Custom Renderer ─────────────────────────┐
  │                                               │
  │  Dart → Skia/Impeller → Canvas → Pixels!       │
  │  Tự vẽ TẤT CẢ! Platform-independent!          │
  │                                               │
  │  Flutter                                      │
  └───────────────────────────────────────────────┘
```

```
FRAMEWORK SO SÁNH:
═══════════════════════════════════════════════════════════════

  ┌──────────────┬──────────┬──────────┬──────────┬──────────┐
  │ Feature      │ RN       │ Flutter  │ Ionic    │ Capacitor│
  ├──────────────┼──────────┼──────────┼──────────┼──────────┤
  │ Language     │ JS/TS    │ Dart     │ JS/TS    │ JS/TS    │
  │ UI           │ Native!  │ Custom!  │ WebView  │ WebView  │
  │ Performance  │ ⭐⭐⭐⭐ │ ⭐⭐⭐⭐⭐│ ⭐⭐⭐   │ ⭐⭐⭐   │
  │ Native feel  │ ✅       │ ~Custom  │ ❌       │ ❌       │
  │ Hot reload   │ ✅       │ ✅       │ ✅       │ ✅       │
  │ Ecosystem    │ NPM!     │ pub.dev  │ NPM      │ NPM      │
  │ Desktop      │ ⚠️       │ ✅       │ ✅       │ ✅       │
  │ Web          │ ⚠️       │ ✅       │ ✅       │ ✅       │
  │ Learning     │ React!   │ Dart     │ Web!     │ Web!     │
  │ Company      │ Meta     │ Google   │ Ionic    │ Ionic    │
  └──────────────┴──────────┴──────────┴──────────┴──────────┘

  MINI PROGRAM FRAMEWORKS:
  ┌──────────────┬──────────────────────────────────────┐
  │ Framework    │ Đặc điểm                             │
  ├──────────────┼──────────────────────────────────────┤
  │ Taro (京东)   │ React syntax → multi-platform mini! │
  │ uni-app      │ Vue syntax → multi-platform mini!   │
  │ Remax        │ React → mini programs               │
  │ mpvue        │ Vue → WeChat mini (legacy!)         │
  └──────────────┴──────────────────────────────────────┘

  → Taro/uni-app: 1 codebase → WeChat + Alipay + Baidu + H5 + RN!
  → Compile-time: transform JSX/Vue → WXML + JS logic!
  → Runtime: adapter layer để abstract platform differences!
```

---

## §8. Tổng kết & Checklist phỏng vấn

```
MIND MAP:
═══════════════════════════════════════════════════════════════

  Multi-Platform Development
  ├── SPA: 1 HTML + JS routing (hash #/ vs history pushState)
  │   ├── Pros: smooth UX, separated FE/BE
  │   └── Cons: slow initial load, bad SEO → fix: SSR/SSG/Code Split!
  ├── Viewport & Units: DPR (physical/CSS pixels), rem/em/vw/dvh
  ├── Mobile Adaptation: rem+rootFontSize, vw+PostCSS, media queries
  │   └── 1px border: transform scaleY(0.5) / viewport scale
  ├── React Native: JS→JSI→Fabric→Native UI (Hermes AOT bytecode!)
  │   └── Old: Bridge(JSON,slow) → New: JSI(C++,fast)
  ├── Electron: Chromium + Node.js → Main+Renderer+Preload+IPC
  │   └── vs Tauri: Rust+SystemWebView = 5MB vs 150MB!
  ├── Mini Programs: Dual-thread (Render WebView + Logic JS)
  │   └── setData = cross-thread, minimize calls!
  └── Cross-Platform: WebView(Cordova) vs Bridge(RN) vs Custom(Flutter)
      └── Mini: Taro(React), uni-app(Vue) → multi-platform compile!
```

### Checklist

- [ ] **SPA nguyên lý**: 1 HTML + JS swap views, client-side routing, NO full reload; Frameworks: React+Next, Vue+Nuxt
- [ ] **Hash vs History routing**: hash (#, hashchange, no server config), history (pushState, popstate, server fallback!)
- [ ] **SPA pros/cons**: ✅ smooth UX, separated FE/BE; ❌ slow initial, bad SEO → SSR/SSG/Code Splitting fix!
- [ ] **Viewport**: layout (CSS canvas) vs visual (actual view) vs ideal (device-width); meta viewport tag!
- [ ] **DPR**: Device Pixel Ratio = physical/CSS pixels; iPhone DPR=3 → 1 CSS px = 9 physical px; window.devicePixelRatio
- [ ] **px vs em vs rem**: px=absolute, em=parent font(compounds!), rem=root font(predictable!), vw/vh=viewport, dvh=dynamic
- [ ] **Mobile adaptation**: rem+rootFontSize (flexible.js), vw+PostCSS (postcss-px-to-viewport), Media Queries breakpoints
- [ ] **1px border**: DPR=2 → 1px CSS = 2px physical → fix: transform scaleY(0.5), viewport scale, SVG border-image
- [ ] **React Native architecture**: JS→JSI(C++ direct)→Fabric(Shadow Tree+Yoga)→Native UI; Old Bridge(JSON)→New JSI(sync!)
- [ ] **Hermes**: AOT bytecode at build → no runtime parse → 50% faster startup, 30% less memory
- [ ] **RN vs Web**: View/Text/Image, StyleSheet (Flexbox only! column default!), Platform.select(), no CSS grid/float/pseudo
- [ ] **Electron**: Main(Node.js, 1 per app) + Renderer(Chromium, 1 per window) + Preload(contextBridge) + IPC(invoke/handle)
- [ ] **Electron security**: contextIsolation:true, nodeIntegration:false, preload expose CHỈ APIs cần thiết!
- [ ] **Mini Program**: dual-thread (Render WebView + Logic JSCore), setData cross-thread (costly!), lifecycle: onLoad→onShow→onReady
- [ ] **Mini optimize**: batch setData, minimize data size, wx:key for lists, throttle scroll setData
- [ ] **Cross-platform 3 types**: WebView(Cordova,easy,slow), NativeBridge(RN,native UI), CustomRenderer(Flutter,Skia,pixel-perfect)
- [ ] **Taro/uni-app**: 1 codebase → WeChat+Alipay+H5+RN; compile-time transform JSX/Vue → WXML + adapter runtime

---

_Nguồn: ConardLi — "Multi-platform Development" · Juejin_
_Cập nhật lần cuối: Tháng 2, 2026_
