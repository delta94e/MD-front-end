# Webpack HMR (Hot Module Replacement) — Nguyên Lý Từ Bên Trong

> Phân tích chi tiết nguyên lý Hot Module Replacement trong Webpack: cơ chế WebSocket, quá trình cập nhật module, và thiết kế kiến trúc Client-Server.
> Độ khó: ⭐️⭐️ | Thời gian đọc: ~15 phút

---

## Table of Contents

1. [Giới Thiệu](#1-giới-thiệu)
2. [Sử Dụng Cơ Bản](#2-sử-dụng-cơ-bản)
3. [Sử Dụng Trong Framework](#3-sử-dụng-trong-framework)
4. [Ý Tưởng Cốt Lõi — Core Ideas](#4-ý-tưởng-cốt-lõi--core-ideas)
5. [Tổng Kết](#5-tổng-kết)
6. [Câu Hỏi Phỏng Vấn](#6-câu-hỏi-phỏng-vấn)

---

## 1. Giới Thiệu

```
┌─────────────────────────────────────────────────────────────────┐
│  WEBPACK HMR — HOT MODULE REPLACEMENT                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  HMR = Cập nhật MODULE trên page KHÔNG CẦN refresh toàn bộ     │
│                                                                 │
│  TẠI SAO CẦN HMR?                                              │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  TRƯỚC HMR (Full Page Reload):                            │  │
│  │                                                           │  │
│  │  Code thay đổi → Reload TOÀN BỘ trang                    │  │
│  │    → Mất hết state (form data, scroll position)           │  │
│  │    → Popup/modal đóng lại                                 │  │
│  │    → Phải thao tác lại từ đầu                             │  │
│  │    → Chỉ đổi font-size cũng phải reload trang             │  │
│  │    → Hiệu suất phát triển RẤT THẤP                       │  │
│  │                                                           │  │
│  │  SAU HMR (Module Hot Swap):                               │  │
│  │                                                           │  │
│  │  Code thay đổi → Chỉ cập nhật MODULE thay đổi            │  │
│  │    → Giữ nguyên state                                     │  │
│  │    → Popup/modal vẫn mở                                   │  │
│  │    → Input vẫn giữ giá trị                                │  │
│  │    → Trải nghiệm dev LIỀN MẠCH                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  80% developer KHÔNG hiểu rõ nguyên lý HMR                     │
│  → Chỉ biết dùng, không hiểu cách hoạt động                    │
│  → Nhưng đây là kiến thức BẮT BUỘC cho vị trí FE infra        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### So Sánh Trước và Sau HMR

```
TRƯỚC HMR — FULL PAGE RELOAD:
═══════════════════════════════════════════════════════════════

   Thay đổi code        Browser
   ┌──────────┐         ┌──────────────────────────┐
   │ name.js  │         │  ┌────────────────────┐  │
   │ đổi text │ ──────► │  │ RELOAD TOÀN BỘ     │  │
   │          │         │  │ ┌──────────────┐   │  │
   └──────────┘         │  │ │ state = ❌   │   │  │
                        │  │ │ input = ❌   │   │  │
                        │  │ │ modal = ❌   │   │  │
                        │  │ └──────────────┘   │  │
                        │  └────────────────────┘  │
                        └──────────────────────────┘

SAU HMR — MODULE HOT SWAP:
═══════════════════════════════════════════════════════════════

   Thay đổi code        Browser
   ┌──────────┐         ┌──────────────────────────┐
   │ name.js  │         │  ┌────────────────────┐  │
   │ đổi text │ ──────► │  │ CHỈ CẬP NHẬT      │  │
   │          │         │  │ MODULE name.js      │  │
   └──────────┘         │  │ ┌──────────────┐   │  │
                        │  │ │ state = ✅   │   │  │
                        │  │ │ input = ✅   │   │  │
                        │  │ │ modal = ✅   │   │  │
                        │  │ └──────────────┘   │  │
                        │  └────────────────────┘  │
                        └──────────────────────────┘
```

---

## 2. Sử Dụng Cơ Bản

### Cài Đặt Project

```
KHỞI TẠO PROJECT:
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  npm init                           // Khởi tạo project    │
│  yarn add webpack webpack-cli       // Core Webpack         │
│           webpack-dev-server        // Dev server (HMR)     │
│           html-webpack-plugin       // Inject vào HTML      │
│                                                             │
│  CÁC DEPENDENCY:                                            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  webpack              → Core library                  │ │
│  │  webpack-cli          → Xử lý CLI args, khởi động     │ │
│  │  webpack-dev-server   → Dev server + HMR support       │ │
│  │  html-webpack-plugin  → Inject CSS/JS vào HTML         │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  CẤU TRÚC THƯ MỤC:                                         │
│  ├── node_modules                                          │
│  ├── package.json                                          │
│  ├── index.html           ← HTML template                  │
│  ├── webpack.config.js    ← Cấu hình Webpack               │
│  └── src/                 ← Source code                    │
│       ├── index.js        ← Entry file                     │
│       └── name.js         ← Module phụ thuộc               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Bật HMR Chỉ Cần 2 Bước

```
BẬT HMR TRONG WEBPACK — 2 BƯỚC DUY NHẤT:
══════════════════════════════════════════════════════════════

  BƯỚC 1: Đặt devServer.hot = true trong webpack.config.js
  BƯỚC 2: Gọi module.hot.accept() trong code → khai báo callback
          khi module thay đổi

══════════════════════════════════════════════════════════════
```

### webpack.config.js

```javascript
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  mode: "development", // Development mode
  entry: "./src/index.js", // Entry file
  devServer: {
    hot: true, // ← BẬT HMR — đây là key!
    port: 8000, // Port number
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./index.html", // Inject build output vào HTML
    }),
  ],
};
```

### index.html

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>hmr</title>
  </head>
  <body>
    <div id="root"></div>
    <!-- Input để test giữ nguyên state khi HMR -->
    <input />
  </body>
</html>
```

### src/index.js

```javascript
import name from "./name";

const render = () => {
  const rootDom = document.getElementById("root");
  rootDom.innerText = name;
};

render();

// ⭐ Đoạn code này BẮT BUỘC để HMR hoạt động
// → Mô tả: khi module thay đổi → làm gì?
if (module.hot) {
  module.hot.accept("./name", function () {
    console.log("name module đã thay đổi → xử lý hot update logic");
    render();
  });
}
```

### src/name.js

```javascript
const name = "不要秃头啊";
export default name;
```

### Chạy Project

```
CHẠY HMR:
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  // package.json                                           │
│  "scripts": {                                              │
│    "start": "webpack serve"                                │
│  }                                                          │
│                                                             │
│  yarn start                                                 │
│  → webpack-dev-server dùng webpack-cli                     │
│  → Khởi động compile ở WATCH MODE                          │
│  → File thay đổi → tự động cập nhật KHÔNG cần refresh      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

```
KẾT QUẢ HMR:

  ┌─── Browser ──────────────────────────────────┐
  │                                              │
  │  "不要秃头啊"                                 │
  │                                              │
  │  ┌──────────────────────────┐                │
  │  │ user đã gõ gì đó        │ ← Input        │
  │  └──────────────────────────┘                │
  │                                              │
  └──────────────────────────────────────────────┘
         │
         │  ← Đổi name.js: name = "不要秃头啊123"
         │     → Save file
         ▼
  ┌─── Browser (KHÔNG REFRESH) ──────────────────┐
  │                                              │
  │  "不要秃头啊123"         ← Text ĐÃ cập nhật  │
  │                                              │
  │  ┌──────────────────────────┐                │
  │  │ user đã gõ gì đó        │ ← Input GIỮ    │
  │  └──────────────────────────┘    NGUYÊN!     │
  │                                              │
  └──────────────────────────────────────────────┘
```

---

## 3. Sử Dụng Trong Framework

### Pain Point Của HMR Thuần

```
VẤN ĐỀ LỚN NHẤT CỦA HMR:
═══════════════════════════════════════════════════════════════

  Phải MANUALLY viết module.hot.accept() cho MỌI module
  → Rất COUNTERINTUITIVE (phản trực giác)
  → Dễ quên, dễ sai

  GIẢI PHÁP TỪ CỘNG ĐỒNG:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  Vue  → vue-loader                                      │
  │         → Hỗ trợ HMR cho Vue components                 │
  │         → Out-of-the-box, không cần cấu hình thêm       │
  │                                                          │
  │  React → react-refresh (thay thế React Hot Loader)       │
  │          + @pmmmwh/react-refresh-webpack-plugin          │
  │          → Cập nhật React components real-time            │
  │          → Giữ nguyên component state                    │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════
```

### 3.1 Setup React Development Environment

```
CÀI ĐẶT REACT & DEPENDENCIES:
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  DEPENDENCIES CẦN CÀI:                                     │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  react               → Core React library             │  │
│  │  react-dom            → React DOM rendering           │  │
│  │  @babel/core          → Babel compiler core           │  │
│  │  @babel/preset-react  → Babel preset cho React        │  │
│  │  babel-loader         → Webpack loader cho Babel      │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**babel.config.js:**

```javascript
module.exports = {
  presets: ["@babel/preset-react"],
};
```

**webpack.config.js** (thêm babel-loader):

```javascript
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  mode: "development",
  entry: "./src/index.jsx",
  devServer: {
    hot: true,
    port: 8000,
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/i,
        exclude: /node_modules/,
        use: "babel-loader", // ← Dùng Babel để compile JSX
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./index.html",
    }),
  ],
};
```

**src/index.jsx:**

```jsx
import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./app.jsx";

const rootElement = document.getElementById("root");
const root = createRoot(rootElement);

root.render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

**src/app.jsx:**

```jsx
import React from "react";

export default function App() {
  return (
    <div>
      作者：不要秃头啊
      <input />
    </div>
  );
}
```

### 3.2 Bật HMR Trong React

```
BẬT HMR TRONG REACT — CHỈ CẦN 2 BƯỚC:
══════════════════════════════════════════════════════════════

  BƯỚC 1: Thêm plugin "react-refresh/babel" vào babel.config.js
  BƯỚC 2: Thêm ReactRefreshWebpackPlugin vào webpack.config.js

══════════════════════════════════════════════════════════════

  CÀI ĐẶT:
  ┌──────────────────────────────────────────────────────────┐
  │  npm install -D @pmmmwh/react-refresh-webpack-plugin    │
  │                 react-refresh                            │
  │                                                          │
  │  react-refresh                                           │
  │    → Chuyên cho React hot reloading                     │
  │    → Thay thế React Hot Loader (deprecated)             │
  │    → Được Dan Abramov (Redux author) giới thiệu         │
  │                                                          │
  │  @pmmmwh/react-refresh-webpack-plugin                   │
  │    → Plugin Webpack cho react-refresh                   │
  └──────────────────────────────────────────────────────────┘
```

**babel.config.js** (thêm react-refresh plugin):

```javascript
module.exports = {
  presets: ["@babel/preset-react"],
  plugins: ["react-refresh/babel"], // ← THÊM plugin này
};
```

**webpack.config.js** (thêm ReactRefreshWebpackPlugin):

```javascript
const HtmlWebpackPlugin = require("html-webpack-plugin");
const ReactRefreshWebpackPlugin = require("@pmmmwh/react-refresh-webpack-plugin");

module.exports = {
  // ...cấu hình khác
  plugins: [
    new HtmlWebpackPlugin({
      template: "./index.html",
    }),
    new ReactRefreshWebpackPlugin(), // ← THÊM plugin này
  ],
};
```

```
KẾT QUẢ — REACT HMR:
═══════════════════════════════════════════════════════════════

  ┌─── Browser ──────────────────────────────────┐
  │                                              │
  │  作者：不要秃头啊                              │
  │                                              │
  │  ┌──────────────────────────┐                │
  │  │ user đã gõ "hello"      │ ← Input có     │
  │  └──────────────────────────┘    giá trị     │
  │                                              │
  └──────────────────────────────────────────────┘
         │
         │  ← Đổi app.jsx: text = "作者：不要秃头啊123"
         ▼
  ┌─── Browser (HMR) ───────────────────────────┐
  │                                              │
  │  作者：不要秃头啊123    ← Text ĐÃ cập nhật   │
  │                                              │
  │  ┌──────────────────────────┐                │
  │  │ hello                    │ ← Input GIỮ    │
  │  └──────────────────────────┘    NGUYÊN!     │
  │                              ✅ HMR hoạt động │
  └──────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════
```

---

## 4. Ý Tưởng Cốt Lõi — Core Ideas

### webpack-dev-server Làm Gì?

```
════════════════════════════════════════════════════════════════════
WEBPACK-DEV-SERVER — TOÀN CẢNH HOẠT ĐỘNG
════════════════════════════════════════════════════════════════════

  Khi chạy "webpack serve", webpack-dev-server thực hiện:

  ┌─────────────────────────────────────────────────────────────┐
  │                                                             │
  │  ① INJECT CLIENT CODE                                      │
  │     → Tự động thêm 2 file vào client code:                │
  │     ┌──────────────────────────────────────────────────┐   │
  │     │  File 1: WebSocket client code                   │   │
  │     │    → Giao tiếp WebSocket với server              │   │
  │     │                                                  │   │
  │     │  File 2: HMR runtime code                        │   │
  │     │    → Nhận code mới → cập nhật modules            │   │
  │     └──────────────────────────────────────────────────┘   │
  │                                                             │
  │  ② KHỞI ĐỘNG 2 SERVICES                                   │
  │     ┌──────────────────────────────────────────────────┐   │
  │     │                                                  │   │
  │     │  HTTP Server (Local Service)                     │   │
  │     │    → Phục vụ kết quả compile                    │   │
  │     │    → Browser request qua port 8000              │   │
  │     │    → Trả về compiled content                     │   │
  │     │                                                  │   │
  │     │  WebSocket Server (Bidirectional Communication)  │   │
  │     │    → Khi module thay đổi + compile thành công    │   │
  │     │    → Thông báo cho client qua message            │   │
  │     │    → Client request code mới + hot update        │   │
  │     │                                                  │   │
  │     └──────────────────────────────────────────────────┘   │
  │                                                             │
  │  ③ COMPILE Ở WATCH MODE                                    │
  │     → File thay đổi → webpack phát hiện → recompile       │
  │     → Mỗi lần compile → tạo HASH DUY NHẤT                │
  │                                                             │
  └─────────────────────────────────────────────────────────────┘
```

### Khái Niệm: Chunk vs Module

```
CHUNK vs MODULE — PHÂN BIỆT QUAN TRỌNG:
═══════════════════════════════════════════════════════════════

  MODULE = MỖI FILE là một code module
           → src/index.js = 1 module
           → src/name.js  = 1 module

  CHUNK  = TẬP HỢP các modules ĐÓNG GÓI cùng nhau
           → Thường từ cùng 1 entry file
           → Cuối cùng tạo thành 1 file output

  VÍ DỤ TRONG PROJECT NÀY:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  entry: "./src/index.js"                              │
  │         │                                              │
  │         ├── src/index.js  ┐                            │
  │         │                 ├─ CHUNK "main"              │
  │         └── src/name.js   ┘                            │
  │                           (cùng entry → cùng chunk)   │
  │                                                        │
  │  OUTPUT: dist/main.js (chứa cả 2 modules)            │
  │                                                        │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  src/index.js = MODULE ①                        │  │
  │  │  src/name.js  = MODULE ②                        │  │
  │  │                                                  │  │
  │  │  CHUNK "main" = { MODULE ①, MODULE ② }          │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════
```

### 4.1 Lần Khởi Động Đầu Tiên

```
════════════════════════════════════════════════════════════════════
LẦN KHỞI ĐỘNG ĐẦU TIÊN — FIRST STARTUP
════════════════════════════════════════════════════════════════════

  ┌─────── Server (Webpack) ───────┐     ┌─────── Client (Browser) ───────┐
  │                                │     │                                │
  │  Compile lần đầu              │     │  Biến nội bộ:                  │
  │  → Tạo hash = h1              │     │  ┌──────────────────────────┐  │
  │                                │     │  │  lastHash    = null      │  │
  │  Gửi hash qua WebSocket ──────┼────►│  │  currentHash = null      │  │
  │  → message: { hash: "h1" }    │     │  └──────────────────────────┘  │
  │                                │     │                                │
  │                                │     │  Nhận hash từ server:          │
  │                                │     │  ┌──────────────────────────┐  │
  │                                │     │  │  lastHash    = "h1"      │  │
  │                                │     │  │  currentHash = "h1"      │  │
  │                                │     │  └──────────────────────────┘  │
  │                                │     │                                │
  │                                │     │  ⚠️ Lần đầu nhận hash:        │
  │                                │     │  → lastHash = currentHash     │
  │                                │     │  → KHÔNG làm gì thêm          │
  │                                │     │  → Chỉ lưu hash               │
  │                                │     │                                │
  └────────────────────────────────┘     └────────────────────────────────┘


  lastHash:    Hash NHẬN LẦN TRƯỚC
  currentHash: Hash NHẬN LẦN NÀY

  → Lần đầu kết nối: lastHash = currentHash = h1
  → Chưa có gì thay đổi, chỉ lưu lại hash ban đầu

════════════════════════════════════════════════════════════════════
```

### 4.2 Lần Compile Thứ Hai (Khi Code Thay Đổi)

```
════════════════════════════════════════════════════════════════════
COMPILE LẦN 2 — KHI SOURCE CODE THAY ĐỔI
════════════════════════════════════════════════════════════════════

  Giả sử thay đổi: name = "不要秃头啊" → name = "不要秃头啊123"

  ┌─────── Server ─────────────────┐     ┌─────── Client ─────────────────┐
  │                                │     │                                │
  │  Phát hiện name.js thay đổi   │     │  Trạng thái hiện tại:          │
  │  → Recompile                  │     │  ┌──────────────────────────┐  │
  │  → Tạo hash = h2             │     │  │  lastHash    = "h1"      │  │
  │                                │     │  │  currentHash = "h1"      │  │
  │  Gửi h2 qua WebSocket ────────┼────►│  └──────────────────────────┘  │
  │  → message: { hash: "h2" }    │     │                                │
  │                                │     │  Nhận hash mới → cập nhật:    │
  │                                │     │  ┌──────────────────────────┐  │
  │                                │     │  │  lastHash    = "h1"      │  │
  │                                │     │  │  currentHash = "h2"      │  │
  │                                │     │  └──────────────────────────┘  │
  │                                │     │                                │
  └────────────────────────────────┘     └────────────────────────────────┘

════════════════════════════════════════════════════════════════════
```

### Bước 1: Client Request JSON — Chunk Nào Đã Thay Đổi?

```
════════════════════════════════════════════════════════════════════
BƯỚC 1: CLIENT HỎI SERVER — CHUNK NÀO ĐÃ THAY ĐỔI?
════════════════════════════════════════════════════════════════════

  Client gửi request dùng lastHash = "h1":

  ┌─────── Client ─────────────────┐     ┌─────── Server ─────────────────┐
  │                                │     │                                │
  │  HTTP GET                      │     │                                │
  │  main.h1.hot-update.json  ─────┼────►│  So sánh:                      │
  │                                │     │  h1 (client) vs h2 (server)    │
  │  (Request bằng lastHash        │     │                                │
  │   để hỏi "từ h1, chunk nào     │     │  Tìm ra chunk thay đổi:       │
  │   đã thay đổi?")              │     │  → chunk "main" đã thay đổi   │
  │                                │     │                                │
  │                                │ ◄───┼─ Response:                     │
  │  Nhận response:               │     │  {                             │
  │  → chunk "main" đã thay đổi   │     │    c: { main: true },          │
  │                                │     │    r: [],                      │
  │                                │     │    m: []                       │
  │                                │     │  }                             │
  │                                │     │                                │
  └────────────────────────────────┘     └────────────────────────────────┘

  c: changed chunks    → { main: true } = chunk "main" đã thay đổi
  r: removed chunks    → []
  m: removed modules   → []

════════════════════════════════════════════════════════════════════
```

### Bước 2: Client Request JS — Module Nào Đã Thay Đổi?

```
════════════════════════════════════════════════════════════════════
BƯỚC 2: CLIENT HỎI SERVER — MODULE NÀO TRONG CHUNK ĐÃ ĐỔI?
════════════════════════════════════════════════════════════════════

  Client biết chunk "main" đã đổi → request code cụ thể:

  ┌─────── Client ─────────────────┐     ┌─────── Server ─────────────────┐
  │                                │     │                                │
  │  HTTP GET                      │     │                                │
  │  main.h1.hot-update.js  ───────┼────►│  So sánh code chi tiết:        │
  │                                │     │  h1 vs h2 trong chunk "main"   │
  │  (Request code thực tế         │     │                                │
  │   của các modules đã đổi)     │     │  Tìm ra module thay đổi:       │
  │                                │     │  → src/name.js đã thay đổi    │
  │                                │     │                                │
  │                                │ ◄───┼─ Response: source code MỚI    │
  │                                │     │  của src/name.js               │
  │  Nhận source code mới         │     │                                │
  │  của module src/name.js        │     │                                │
  │                                │     │                                │
  └────────────────────────────────┘     └────────────────────────────────┘

════════════════════════════════════════════════════════════════════
```

### Bước 3: Client Cập Nhật Module

```
════════════════════════════════════════════════════════════════════
BƯỚC 3: CLIENT CẬP NHẬT MODULE — HOT SWAP
════════════════════════════════════════════════════════════════════

  Client đã có source code mới của src/name.js

  QUÁ TRÌNH CẬP NHẬT:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ① Thay thế module src/name.js bằng code mới               │
  │                                                              │
  │  ② Tìm modules PHỤ THUỘC vào src/name.js                   │
  │     → src/index.js require("./name") → phụ thuộc name.js   │
  │                                                              │
  │  ③ Re-execute module src/index.js                           │
  │     → Vì phụ thuộc name.js → cần chạy lại                  │
  │     → Callback trong module.hot.accept() được gọi          │
  │     → render() chạy lại → DOM cập nhật                     │
  │                                                              │
  │  ④ Kết quả: chỉ phần thay đổi được update                 │
  │     → State giữ nguyên (input, modal...)                    │
  │     → KHÔNG reload toàn bộ page                             │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘

════════════════════════════════════════════════════════════════════
```

### Toàn Bộ Flow — Tổng Hợp

```
════════════════════════════════════════════════════════════════════
TOÀN BỘ HMR FLOW — TỪ THAY ĐỔI CODE ĐẾN CẬP NHẬT BROWSER
════════════════════════════════════════════════════════════════════

  Developer                Server                    Client (Browser)
     │                       │                              │
     │  Save file            │                              │
     │  (name.js đổi)        │                              │
     │ ─────────────────────►│                              │
     │                       │                              │
     │                       │  Webpack detect change       │
     │                       │  → Recompile (watch mode)    │
     │                       │  → Generate hash = h2        │
     │                       │                              │
     │                       │  WebSocket message           │
     │                       │  { type: "hash",             │
     │                       │    hash: "h2" }              │
     │                       │ ────────────────────────────►│
     │                       │                              │
     │                       │                              │  Cập nhật:
     │                       │                              │  lastHash = h1
     │                       │                              │  currentHash = h2
     │                       │                              │
     │                       │       GET main.h1.json       │
     │                       │ ◄────────────────────────────│
     │                       │                              │  "Chunk nào đổi?"
     │                       │  Response:                   │
     │                       │  { c: { main: true } }       │
     │                       │ ────────────────────────────►│
     │                       │                              │
     │                       │       GET main.h1.js         │
     │                       │ ◄────────────────────────────│
     │                       │                              │  "Code mới của
     │                       │  Response:                   │   chunk main?"
     │                       │  (code mới name.js)          │
     │                       │ ────────────────────────────►│
     │                       │                              │
     │                       │                              │  Hot swap module
     │                       │                              │  → Re-execute
     │                       │                              │  → DOM cập nhật
     │                       │                              │  → State giữ nguyên
     │                       │                              │  ✅ HMR hoàn tất!
     │                       │                              │

════════════════════════════════════════════════════════════════════
```

### Tại Sao Cần 2 Hash (lastHash & currentHash)?

```
TẠI SAO CLIENT CẦN 2 HASH?
═══════════════════════════════════════════════════════════════

  VẤN ĐỀ: Server KHÔNG biết client đang ở hash nào!

  TÌNH HUỐNG MULTI-WINDOW:
  ┌─────────────────────────────────────────────────────────┐
  │                                                         │
  │  Server: hash hiện tại = h5                            │
  │                                                         │
  │  Client A (Tab 1): đang ở hash h3                      │
  │    → Cần update h3 → h5                                │
  │    → Gửi lastHash = h3 cho server                      │
  │                                                         │
  │  Client B (Tab 2): đang ở hash h4                      │
  │    → Cần update h4 → h5                                │
  │    → Gửi lastHash = h4 cho server                      │
  │                                                         │
  │  Client C (Tab 3): vừa mở, đang ở hash h5             │
  │    → Không cần update                                   │
  │    → lastHash = currentHash = h5                       │
  │                                                         │
  └─────────────────────────────────────────────────────────┘

  → Client gửi lastHash cho server
  → Server so sánh lastHash vs hash hiện tại
  → Trả về ĐÚNG phần code đã thay đổi giữa 2 versions

═══════════════════════════════════════════════════════════════
```

### Tối Ưu Performance: memfs

```
VỀ PERFORMANCE — MEMFS:
═══════════════════════════════════════════════════════════════

  VẤN ĐỀ: Mỗi lần file thay đổi → recompile
           → Ghi file ra ổ cứng → RẤT CHẬM

  GIẢI PHÁP: webpack-dev-server dùng MEMFS
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  memfs = Memory File System (do Webpack tự viết)        │
  │                                                          │
  │  THAY VÌ:                                                │
  │  ┌────────────────────────────────────────────────────┐  │
  │  │  Compile → Ghi ra ổ cứng (disk I/O) → CHẬM       │  │
  │  └────────────────────────────────────────────────────┘  │
  │                                                          │
  │  MEMFS LÀM:                                              │
  │  ┌────────────────────────────────────────────────────┐  │
  │  │  Compile → Giữ trong BỘ NHỚ (RAM) → CỰC NHANH   │  │
  │  └────────────────────────────────────────────────────┘  │
  │                                                          │
  │  → Kết quả compile KHÔNG ghi ra disk                    │
  │  → GIỮ trong memory → truy xuất nhanh                  │
  │  → Performance tối ưu cho development                   │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════
```

---

## 5. Tổng Kết

```
════════════════════════════════════════════════════════════════════
TỔNG KẾT — HMR CORE
════════════════════════════════════════════════════════════════════

  ① HMR = Cập nhật module KHÔNG cần refresh page
     → Giữ state, tăng hiệu suất dev

  ② CORE MECHANISM = WebSocket đồng bộ giữa client & server
     → Server compile → tạo hash → gửi qua WS
     → Client nhận hash → request chunks/modules đã đổi
     → Hot swap module → re-execute → DOM update

  ③ FLOW 2 BƯỚC REQUEST:
     → Bước 1: Request JSON  → biết CHUNK nào thay đổi
     → Bước 2: Request JS    → lấy CODE modules thay đổi

  ④ 2 HASH (lastHash, currentHash):
     → Client gửi lastHash cho server
     → Server so sánh → trả về diff
     → Hỗ trợ multi-window scenario

  ⑤ PERFORMANCE: memfs
     → Compile output giữ trong RAM
     → Không ghi ra disk → cực nhanh

  ⑥ FRAMEWORK SUPPORT:
     → Vue: vue-loader (built-in HMR)
     → React: react-refresh + webpack plugin

════════════════════════════════════════════════════════════════════

  QUICK REFERENCE — CÁC THÀNH PHẦN CHÍNH:
  ┌──────────────────────┬─────────────────────────────────────┐
  │ Thành Phần           │ Vai Trò                             │
  ├──────────────────────┼─────────────────────────────────────┤
  │ webpack-dev-server   │ Khởi động HTTP + WebSocket server  │
  │ WebSocket            │ Giao tiếp realtime server ↔ client │
  │ Hash                 │ Định danh mỗi lần compile          │
  │ hot-update.json      │ Metadata: chunk nào thay đổi       │
  │ hot-update.js        │ Source code mới của modules         │
  │ module.hot.accept()  │ Khai báo callback khi module đổi   │
  │ memfs                │ In-memory file system (fast I/O)   │
  │ Watch Mode           │ Tự phát hiện file thay đổi         │
  └──────────────────────┴─────────────────────────────────────┘
```

---

## 6. Câu Hỏi Phỏng Vấn

```
════════════════════════════════════════════════════════════════════
CÂU HỎI PHỎNG VẤN — WEBPACK HMR
════════════════════════════════════════════════════════════════════
```

### Q1: HMR là gì? Tại sao cần HMR?

```
TRẢ LỜI:
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  HMR (Hot Module Replacement) là cơ chế cho phép cập nhật  │
│  MODULE cụ thể trên page MÀ KHÔNG CẦN reload toàn bộ trang│
│                                                              │
│  Tại sao cần:                                                │
│  ① Giữ nguyên state (form data, scroll, modal...)          │
│  ② Tăng hiệu suất dev (không chờ full reload)              │
│  ③ Trải nghiệm dev liền mạch                               │
│  ④ Đặc biệt quan trọng với các ứng dụng phức tạp          │
│     (nhiều form fields, nested modals, complex state)       │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Q2: Giải thích nguyên lý hoạt động của HMR?

```
TRẢ LỜI:
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  HMR hoạt động dựa trên 4 component chính:                 │
│                                                              │
│  ① webpack-dev-server khởi động 2 service:                  │
│     → HTTP server: phục vụ compiled content                 │
│     → WebSocket server: giao tiếp realtime với client       │
│                                                              │
│  ② Webpack compile ở watch mode:                            │
│     → File thay đổi → detect → recompile                   │
│     → Mỗi lần compile tạo 1 hash duy nhất                  │
│                                                              │
│  ③ Server gửi hash mới qua WebSocket cho client            │
│                                                              │
│  ④ Client nhận hash → thực hiện 2 request:                  │
│     → Request 1 (JSON): hỏi chunk nào thay đổi             │
│     → Request 2 (JS): lấy source code mới                  │
│     → Hot swap module → re-execute dependent modules        │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Q3: Tại sao client cần 2 biến lastHash và currentHash?

```
TRẢ LỜI:
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  Vì SERVER KHÔNG BIẾT client đang ở version nào!            │
│                                                              │
│  Trong tình huống multi-window (nhiều tab):                 │
│  → Tab A có thể đang ở hash h3                             │
│  → Tab B có thể đang ở hash h4                             │
│  → Server đang ở hash h5                                    │
│                                                              │
│  Client gửi lastHash cho server:                            │
│  → Server so sánh lastHash vs hash hiện tại                 │
│  → Trả về ĐÚNG phần code thay đổi giữa 2 versions         │
│                                                              │
│  Nếu chỉ có 1 hash:                                         │
│  → Server không biết client cần update từ đâu              │
│  → Không thể xác định diff chính xác                       │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Q4: webpack-dev-server dùng memfs để làm gì?

```
TRẢ LỜI:
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  memfs (Memory File System) = Hệ thống file trong bộ nhớ   │
│  → Do Webpack tự viết                                       │
│                                                              │
│  Mục đích: TĂNG PERFORMANCE                                 │
│                                                              │
│  Nếu mỗi lần compile → ghi file ra ổ cứng:                │
│  → Disk I/O rất chậm                                        │
│  → Đặc biệt khi file thay đổi liên tục                    │
│                                                              │
│  Với memfs:                                                  │
│  → Kết quả compile GIỮ TRONG RAM                           │
│  → Không ghi ra disk                                        │
│  → Truy xuất cực nhanh                                      │
│  → Phù hợp cho development (không cần file thật)           │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Q5: HMR có thể cover tất cả trường hợp không?

```
TRẢ LỜI:
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  KHÔNG — HMR không thể cover 100% trường hợp               │
│                                                              │
│  HMR hoạt động tốt khi:                                     │
│  ✅ Thay đổi nhỏ (text, style, logic đơn giản)             │
│  ✅ Thay đổi trong component (với framework support)        │
│  ✅ Cập nhật CSS/SCSS                                       │
│                                                              │
│  HMR có thể KHÔNG hoạt động khi:                            │
│  ❌ Thay đổi cấu trúc lớn (routing, global state)          │
│  ❌ Module không có accept handler                          │
│  ❌ Side effects không thể rollback                         │
│                                                              │
│  Khi HMR fail → fallback = FULL PAGE RELOAD                │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Q6: So sánh Live Reload vs HMR?

```
TRẢ LỜI:
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  LIVE RELOAD:                                                │
│  → File thay đổi → RELOAD TOÀN BỘ PAGE                     │
│  → Mất hết state                                            │
│  → Đơn giản, không cần viết accept handler                  │
│                                                              │
│  HMR (Hot Module Replacement):                               │
│  → File thay đổi → CHỈ thay thế MODULE đã đổi              │
│  → Giữ nguyên state                                         │
│  → Cần accept handler (hoặc framework support)              │
│  → Phức tạp hơn nhưng UX tốt hơn nhiều                     │
│                                                              │
│  ┌────────────────┬──────────────┬──────────────────────┐   │
│  │                │ Live Reload  │ HMR                  │   │
│  ├────────────────┼──────────────┼──────────────────────┤   │
│  │ Scope          │ Toàn trang   │ Chỉ module thay đổi │   │
│  │ State          │ Mất          │ Giữ nguyên           │   │
│  │ Speed          │ Chậm hơn     │ Nhanh hơn            │   │
│  │ Complexity     │ Đơn giản     │ Phức tạp hơn         │   │
│  │ Setup          │ Tự động      │ Cần config/handler   │   │
│  └────────────────┴──────────────┴──────────────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Q7: Vai trò của module.hot.accept() là gì?

```
TRẢ LỜI:
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  module.hot.accept(dependency, callback) có 2 mục đích:     │
│                                                              │
│  ① KHAI BÁO dependency nào cần watch:                       │
│     → module.hot.accept("./name", callback)                 │
│     → Khi "./name" thay đổi → trigger callback              │
│                                                              │
│  ② ĐỊNH NGHĨA logic cập nhật:                               │
│     → Callback chứa code để update UI                       │
│     → VD: gọi render() lại để DOM reflect thay đổi         │
│                                                              │
│  Nếu KHÔNG có module.hot.accept():                           │
│  → HMR không biết làm gì khi module thay đổi               │
│  → Fallback → full page reload                              │
│                                                              │
│  Framework giải quyết bằng cách TỰ ĐỘNG thêm:              │
│  → vue-loader: auto inject accept handler cho .vue files    │
│  → react-refresh: auto handle cho React components          │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Q8: File hot-update.json và hot-update.js chứa gì?

```
TRẢ LỜI:
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  hot-update.json (Manifest):                                 │
│  → Metadata mô tả CHUNK NÀO thay đổi                       │
│  → Format: main.[lastHash].hot-update.json                  │
│  → Nội dung:                                                │
│    {                                                         │
│      c: { main: true },  // Changed chunks                  │
│      r: [],              // Removed chunks                   │
│      m: []               // Removed modules                  │
│    }                                                         │
│                                                              │
│  hot-update.js (Update Code):                                │
│  → SOURCE CODE MỚI của modules đã thay đổi                 │
│  → Format: main.[lastHash].hot-update.js                    │
│  → Chứa code thực tế để thay thế module cũ                 │
│                                                              │
│  FLOW:                                                       │
│  Client request JSON trước → biết chunk nào đổi             │
│  → Sau đó request JS → lấy code mới                        │
│  → 2 bước giúp tối ưu: chỉ download code CẦN THIẾT        │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```
