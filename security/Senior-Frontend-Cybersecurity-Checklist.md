# 🎯 Senior Frontend Engineer — Interview Checklist & Roadmap

> **Vị trí 1:** Senior Software Engineer – Front End (AI Firewall / Cybersecurity)
> **Vị trí 2:** Senior Software Engineer – Front End (E2EE Messaging Platform)
> **Vị trí 3:** Senior Software Engineer – Front End (AI Agent Platform)
> **Mục tiêu:** Checklist toàn bộ kiến thức cần ôn, mapping với tài liệu đã có, xác định gaps cần bổ sung.

---

## 📊 Coverage Overview

| #   | Category                               | Coverage | Status                | JD         |
| --- | -------------------------------------- | -------- | --------------------- | ---------- |
| 1   | JavaScript Core & ES6+                 | 95%      | ✅ Strong             | All 3      |
| 2   | TypeScript                             | 40%      | ⚠️ Need dedicated doc | All 3      |
| 3   | React & Hooks Deep                     | 85%      | ✅ Strong             | All 3      |
| 4   | State Management (Redux/Zustand/TQ)    | 60%      | ⚠️ In progress        | All 3      |
| 5   | Performance & CRP Optimization         | 90%      | ✅ Strong             | All 3      |
| 6   | Data Visualization (D3/Recharts/WebGL) | 90%      | ✅ Strong             | Cyber + AI |
| 7   | Real-Time (WebSocket/SSE)              | 70%      | 🔄 In progress        | All 3      |
| 8   | Build Tools (Webpack/Vite/ESBuild)     | 85%      | ✅ Strong             | All 3      |
| 9   | Testing (Jest/Playwright)              | 20%      | 🔴 Missing            | All 3      |
| 10  | Frontend Security (XSS/CSP/OWASP)      | 30%      | 🔴 Need doc           | All 3      |
| 11  | Networking (TCP/UDP/DNS/HTTP)          | 85%      | ✅ Strong             | All 3      |
| 12  | Cybersecurity Domain                   | 50%      | ⚠️ Partial            | Cyber      |
| 13  | System Design                          | 70%      | ⚠️ Need more          | All 3      |
| 14  | CSS/HTML/Advanced Styling              | 70%      | ⚠️ Need CSS-in-JS     | All 3      |
| 15  | Browser & V8 Internals                 | 85%      | ✅ Strong             | All 3      |
| 16  | Data Structures & Algorithms           | 30%      | 🔴 Need practice      | All 3      |
| 17  | **Electron & Desktop (IPC, Node.js)**  | 10%      | 🔴 Missing            | E2EE       |
| 18  | **E2EE / Cryptography**                | 5%       | 🔴 Missing            | E2EE       |
| 19  | **WebRTC (Audio/Video/Group Calls)**   | 5%       | 🔴 Missing            | E2EE       |
| 20  | **IndexedDB / Local-First / Offline**  | 30%      | 🔴 Need doc           | E2EE       |
| 21  | **Service Workers & PWA**              | 10%      | 🔴 Missing            | E2EE       |
| 22  | **SOLID & Design Patterns**            | 40%      | ⚠️ Need doc           | E2EE + AI  |
| 23  | **GraphQL & API Integration**          | 20%      | 🔴 Need doc           | AI         |
| 24  | **CI/CD Pipelines**                    | 20%      | 🔴 Need doc           | AI         |
| 25  | **UI Component Libraries & A11y**      | 50%      | ⚠️ Need doc           | AI + E2EE  |
| 26  | **AI/ML Frontend Integration**         | 40%      | ⚠️ Partial            | Cyber + AI |

---

## 🗺️ Roadmap — Thứ tự ưu tiên ôn luyện

```
PRIORITY ROADMAP (8 tuần — Covering BOTH JDs):
═══════════════════════════════════════════════════════════════

  TUẦN 1-2: CORE FUNDAMENTALS (Nền tảng — phải chắc)
  ┌─────────────────────────────────────────────────────────┐
  │ ⭐ JavaScript Core (review existing docs)         Both │
  │ ⭐ TypeScript Advanced (TẠO MỚI)                  Both │
  │ ⭐ React Deep Dive (review existing)              Both │
  │ ⭐ SOLID & Design Patterns (TẠO MỚI)             E2EE │
  │ ⭐ Data Structures & Algorithms (LeetCode)        Both │
  └─────────────────────────────────────────────────────────┘

  TUẦN 3-4: REAL-TIME & STATE MANAGEMENT
  ┌─────────────────────────────────────────────────────────┐
  │ ⭐ Real-Time Monitoring (HOÀN THÀNH doc)          Both │
  │ ⭐ Redux + Thunk deep dive                        E2EE │
  │ ⭐ WebRTC (Audio/Video/Group Calls) (TẠO MỚI)    E2EE │
  │ ⭐ IndexedDB / Local-First patterns (TẠO MỚI)    E2EE │
  └─────────────────────────────────────────────────────────┘

  TUẦN 5: DOMAIN-SPECIFIC
  ┌─────────────────────────────────────────────────────────┐
  │ ⭐ Frontend Security & OWASP (TẠO MỚI)           Both │
  │ ⭐ E2EE / Cryptography fundamentals (TẠO MỚI)    E2EE │
  │ ⭐ Cybersecurity Domain Knowledge (TẠO MỚI)      Cyber│
  │ ⭐ Networking (review TCP/HTTP docs)              Both │
  └─────────────────────────────────────────────────────────┘

  TUẦN 6: PLATFORM & TOOLING
  ┌─────────────────────────────────────────────────────────┐
  │ ⭐ Electron & Desktop (IPC, Node.js) (TẠO MỚI)   E2EE │
  │ ⭐ Service Workers & PWA (TẠO MỚI)               E2EE │
  │ ⭐ Threat Visualization (review existing)         Cyber│
  │ ⭐ CSS-in-JS, Design Systems (review)             E2EE │
  └─────────────────────────────────────────────────────────┘

  TUẦN 7: TESTING & PERFORMANCE
  ┌─────────────────────────────────────────────────────────┐
  │ ⭐ Testing strategies (TẠO MỚI)                   Both │
  │ ⭐ Performance & CRP deep dive (review)           Both │
  │ ⭐ V8 internals, memory profiling (review)        E2EE │
  └─────────────────────────────────────────────────────────┘

  TUẦN 8: SYSTEM DESIGN & MOCK INTERVIEWS
  ┌─────────────────────────────────────────────────────────┐
  │ ⭐ System Design: Security Dashboard              Cyber│
  │ ⭐ System Design: E2EE Messaging App              E2EE │
  │ ⭐ Behavioral questions prep                      Both │
  │ ⭐ Mock interviews & review tất cả docs           Both │
  └─────────────────────────────────────────────────────────┘
```

---

## ✅ DETAILED CHECKLIST

### 1. JavaScript Core & ES6+ ✅

| Topic                                           | Status | Document                              |
| ----------------------------------------------- | ------ | ------------------------------------- |
| 8 Data Types, Stack vs Heap memory              | ✅     | `JS-DataTypes-ES6-Deep-Dive.md`       |
| Prototype chain, inheritance                    | ✅     | `JS-Basics-Prototype-Deep-Dive.md`    |
| Closures, Scope chain, Lexical scope            | ✅     | `JavaScript-Deep-Dive.md`             |
| `this` binding (4 rules + arrow fn)             | ✅     | `JavaScript-Deep-Dive.md`             |
| Event Loop, Microtask vs Macrotask              | ✅     | `JS-Execution-Mechanism-Deep-Dive.md` |
| Promise, async/await, error handling            | ✅     | `Promise-Concurrency-Deep-Dive.md`    |
| Promise concurrency (all, race, allSettled)     | ✅     | `Promise-Concurrency-Deep-Dive.md`    |
| ES6+ features (destructuring, spread, Map/Set)  | ✅     | `JS-DataTypes-ES6-Deep-Dive.md`       |
| Symbol, BigInt, WeakMap/WeakSet                 | ✅     | `JS-DataTypes-ES6-Deep-Dive.md`       |
| CommonJS vs ES Modules                          | ✅     | `CommonJS-ES6-Modules-Deep-Dive.md`   |
| Proxy, Reflect                                  | ✅     | `JavaScript-Deep-Dive.md`             |
| Generator functions, iterators                  | ⚠️     | Cần review thêm                       |
| Web APIs (IntersectionObserver, ResizeObserver) | ✅     | `Image-LazyLoad-Deep-Dive.md`         |
| Element geometry (offset/client/scroll)         | ✅     | `JavaScript-Deep-Dive.md`             |

---

### 2. TypeScript ⚠️ CẦN TẠO DOC MỚI

| Topic                                                   | Status | Document                |
| ------------------------------------------------------- | ------ | ----------------------- |
| Basic types, interfaces, type aliases                   | ⚠️     | Scattered in other docs |
| Generics (constraints, conditional types)               | 🔴     | **TẠO MỚI**             |
| Utility types (Partial, Pick, Omit, Record, ReturnType) | 🔴     | **TẠO MỚI**             |
| Discriminated unions, exhaustive checks                 | 🔴     | **TẠO MỚI**             |
| Template literal types                                  | 🔴     | **TẠO MỚI**             |
| `infer` keyword, mapped types                           | 🔴     | **TẠO MỚI**             |
| Type narrowing, type guards (is, in, satisfies)         | 🔴     | **TẠO MỚI**             |
| Declaration merging, module augmentation                | 🔴     | **TẠO MỚI**             |
| `strict` mode, `noUncheckedIndexedAccess`               | 🔴     | **TẠO MỚI**             |
| Branded types (for IP, Port, Domain safety)             | 🔴     | **TẠO MỚI**             |
| Type-safe event emitters, state machines                | 🔴     | **TẠO MỚI**             |
| Zod / runtime validation                                | 🔴     | **TẠO MỚI**             |

> **📌 Action:** Tạo `TypeScript-Advanced-Deep-Dive.md`

---

### 3. React & Modern Patterns ✅

| Topic                                         | Status | Document                                                          |
| --------------------------------------------- | ------ | ----------------------------------------------------------------- |
| Hooks deep dive (useState, useEffect, useRef) | ✅     | `React-Best-Practices-Deep-Dive.md`                               |
| useCallback, useMemo, React.memo              | ✅     | `React-Best-Practices-Deep-Dive.md`                               |
| useEffect dependencies & cleanup              | ✅     | `React-Effect-Dependencies-Deep-Dive.md`                          |
| Custom hooks patterns                         | ✅     | `React-Best-Practices-Deep-Dive.md`                               |
| Context API patterns, performance pitfalls    | ✅     | `React-Best-Practices-Deep-Dive.md`                               |
| React rendering behavior, reconciliation      | ✅     | `React-Best-Practices-Deep-Dive.md`                               |
| Compound components, render props             | ✅     | `React-NestedCheckboxes-Deep-Dive.md`                             |
| Suspense, ErrorBoundary                       | ⚠️     | Cần review thêm                                                   |
| Server Components (RSC) — if Next.js          | ⚠️     | Cần review                                                        |
| React 18/19 features (Transitions, use)       | ⚠️     | Cần review                                                        |
| Virtual scrolling / windowing                 | ✅     | `Large-Data-Handling-Deep-Dive.md`                                |
| Complex tree/table components                 | ✅     | `React-FileExplorer-Deep-Dive.md`, `React-DataTable-Deep-Dive.md` |

---

### 4. State Management ⚠️

| Topic                                               | Status | Document                                                 | JD           |
| --------------------------------------------------- | ------ | -------------------------------------------------------- | ------------ |
| **Redux Toolkit** — slices, createAsyncThunk        | 🔴     | **TẠO MỚI hoặc thêm vào Real-Time doc**                  | Both         |
| **Redux + Thunk** — async side effects              | 🔴     | **TẠO MỚI**                                              | E2EE         |
| Redux middleware (thunk, saga patterns)             | 🔴     | **TẠO MỚI**                                              | Both         |
| **Redux state containers** — scalable architecture  | 🔴     | **TẠO MỚI**                                              | E2EE         |
| RTK Query — real-time cache + WS integration        | 🔴     | **TẠO MỚI**                                              | Cyber        |
| **Zustand** — stores, middleware, subscriptions     | 🔴     | **TẠO MỚI hoặc thêm vào Real-Time doc**                  | Cyber        |
| Zustand + WebSocket patterns                        | 🔄     | `Real-Time-Security-Monitoring-Deep-Dive.md` (đang viết) | Cyber        |
| **TanStack Query** — queryClient, mutations         | ✅     | `TanStack-SingleFlight-Deep-Dive.md`                     | Cyber        |
| TanStack Query + WebSocket cache invalidation       | 🔄     | `Real-Time-Security-Monitoring-Deep-Dive.md` (đang viết) | Cyber        |
| State normalization (entity adapter)                | 🔴     | **TẠO MỚI**                                              | Both         |
| Optimistic updates pattern                          | ⚠️     | Đang viết                                                | Both         |
| **Predictable data flows** — unidirectional pattern | ⚠️     | Scattered                                                | E2EE         |
| Jotai / Recoil (atomic state)                       | ⚠️     | Có trong project knowledge                               | Nice-to-have |

> **📌 Action:** Hoàn thành `Real-Time-Security-Monitoring-Deep-Dive.md` sections 7-9
> **📌 Action:** E2EE JD focuses heavily on Redux + Thunk — cần deep-dive doc riêng

---

### 5. Data Visualization ✅

| Topic                                  | Status | Document                                   |
| -------------------------------------- | ------ | ------------------------------------------ |
| D3.js scales, axes, layouts            | ✅     | `Threat-Visualization-AI-Deep-Dive.md` §5  |
| D3 + React integration pattern         | ✅     | `Threat-Visualization-AI-Deep-Dive.md` §5  |
| D3 force simulation (network topology) | ✅     | `Threat-Visualization-AI-Deep-Dive.md` §7  |
| D3 geo projections (threat maps)       | ✅     | `Threat-Visualization-AI-Deep-Dive.md` §6  |
| Recharts: Area, Line, Bar, Pie         | ✅     | `Threat-Visualization-AI-Deep-Dive.md` §9  |
| Canvas vs SVG vs WebGL decision matrix | ✅     | `Threat-Visualization-AI-Deep-Dive.md` §12 |
| WebGL / Three.js basics                | ✅     | `Threat-Visualization-AI-Deep-Dive.md` §11 |
| SHAP / AI explanation visualizations   | ✅     | `Threat-Visualization-AI-Deep-Dive.md` §4  |
| Sankey diagrams (attack flows)         | ✅     | `Threat-Visualization-AI-Deep-Dive.md` §8  |
| AI confidence → UX translation         | ✅     | `Threat-Visualization-AI-Deep-Dive.md` §10 |

---

### 6. Real-Time Communication 🔄

| Topic                                      | Status | Document                                        |
| ------------------------------------------ | ------ | ----------------------------------------------- |
| WebSocket fundamentals                     | ✅     | `SSE-WebSocket-Deep-Dive.md`                    |
| Server-Sent Events (SSE)                   | ✅     | `SSE-WebSocket-Deep-Dive.md`                    |
| WebSocket vs SSE vs Long Polling           | ✅     | `SSE-WebSocket-Deep-Dive.md`                    |
| Production WS: auth, heartbeat, reconnect  | ✅     | `Real-Time-Security-Monitoring-Deep-Dive.md` §3 |
| Binary protocols (MessagePack, Protobuf)   | ✅     | `Real-Time-Security-Monitoring-Deep-Dive.md` §4 |
| Ring Buffer, RAF batching                  | ✅     | `Real-Time-Security-Monitoring-Deep-Dive.md` §6 |
| Backpressure handling                      | ✅     | `Real-Time-Security-Monitoring-Deep-Dive.md` §3 |
| State management for real-time data        | 🔄     | **Đang viết** (sections 7-12)                   |
| Adaptive transport (WS → polling fallback) | ✅     | `Real-Time-Security-Monitoring-Deep-Dive.md` §5 |

---

### 7. Performance Optimization ✅

| Topic                                                | Status | Document                                          | JD    |
| ---------------------------------------------------- | ------ | ------------------------------------------------- | ----- |
| **Critical Rendering Path** (Layout→Paint→Composite) | ✅     | `Browser-Deep-Dive.md`                            | E2EE  |
| Virtual scrolling (10K+ rows)                        | ✅     | `Large-Data-Handling-Deep-Dive.md`                | Both  |
| Web Workers for heavy computation                    | ✅     | `Threat-Visualization-AI-Deep-Dive.md` §12        | Both  |
| Canvas rendering for large datasets                  | ✅     | `Threat-Visualization-AI-Deep-Dive.md` §4, §6, §7 | Cyber |
| React performance (memo, useMemo, useCallback)       | ✅     | `React-Best-Practices-Deep-Dive.md`               | Both  |
| Bundle optimization, code splitting                  | ✅     | `High-Performance-Frontend-Deep-Dive.md`          | Both  |
| Image lazy loading, IntersectionObserver             | ✅     | `Image-LazyLoad-Deep-Dive.md`                     | Both  |
| requestAnimationFrame batching                       | ✅     | `Real-Time-Security-Monitoring-Deep-Dive.md` §6   | Both  |
| Debounce, Throttle                                   | ✅     | `JavaScript-Deep-Dive.md`                         | Both  |
| **Memory leak analysis & profiling**                 | ✅     | `High-Performance-Frontend-Deep-Dive.md`          | E2EE  |
| **V8 memory profiling, heap snapshots**              | ⚠️     | `JS-Runtime-Deep-Dive.md` (cần bổ sung)           | E2EE  |
| **Race condition detection & resolution**            | 🔴     | **TẠO MỚI**                                       | E2EE  |
| QuadTree for spatial queries                         | ✅     | `Threat-Visualization-AI-Deep-Dive.md` §12        | Cyber |
| Reflow / Repaint optimization                        | ✅     | `Browser-Deep-Dive.md`                            | Both  |
| **High-frequency data rendering** (chat, calls)      | 🔄     | `Real-Time-Security-Monitoring-Deep-Dive.md`      | E2EE  |

---

### 8. Build Tools & Module Systems ✅

| Topic                                             | Status | Document                                 | JD   |
| ------------------------------------------------- | ------ | ---------------------------------------- | ---- |
| Webpack core (loaders, plugins, chunks)           | ✅     | `Webpack-Deep-Dive.md`                   | Both |
| Webpack HMR mechanism                             | ✅     | `Webpack-HMR-Deep-Dive.md`               | Both |
| Webpack async loading (code splitting)            | ✅     | `Webpack-Async-Loading-Deep-Dive.md`     | Both |
| Webpack custom loader                             | ✅     | `Webpack-Loader-Deep-Dive.md`            | Both |
| ESBuild architecture                              | ✅     | `Esbuild-Deep-Dive.md`                   | Both |
| **Vite deep dive** (dev server, build)            | ⚠️     | Cần review/tạo doc                       | E2EE |
| AST and Babel / **Transpilation layer**           | ✅     | `AST-Deep-Dive.md`                       | Both |
| Tree shaking                                      | ✅     | `CommonJS-ES6-Modules-Deep-Dive.md`      | Both |
| **Bundle efficiency** (analyze, optimize)         | ✅     | `High-Performance-Frontend-Deep-Dive.md` | E2EE |
| **Environment configurations** (dev/staging/prod) | ⚠️     | Cần review                               | E2EE |

---

### 9. Testing 🔴 CẦN TẠO DOC MỚI

| Topic                                    | Status | Document    |
| ---------------------------------------- | ------ | ----------- |
| Jest fundamentals (describe, it, expect) | 🔴     | **TẠO MỚI** |
| React Testing Library (RTL)              | 🔴     | **TẠO MỚI** |
| Mocking (jest.mock, jest.fn, spyOn)      | 🔴     | **TẠO MỚI** |
| Testing async code (waitFor, act)        | 🔴     | **TẠO MỚI** |
| Testing hooks (renderHook)               | 🔴     | **TẠO MỚI** |
| Testing WebSocket connections            | 🔴     | **TẠO MỚI** |
| Integration testing patterns             | 🔴     | **TẠO MỚI** |
| Playwright E2E testing                   | 🔴     | **TẠO MỚI** |
| Test coverage strategy                   | 🔴     | **TẠO MỚI** |
| Testing security-critical UI flows       | 🔴     | **TẠO MỚI** |

> **📌 Action:** Tạo `Testing-Deep-Dive.md` (Jest + RTL + Playwright)

---

### 10. Frontend Security 🔴 CẦN TẠO DOC MỚI

| Topic                                  | Status | Document                                   |
| -------------------------------------- | ------ | ------------------------------------------ |
| XSS (Reflected, Stored, DOM-based)     | ⚠️     | Phần nhỏ trong `Cross-Origin-Deep-Dive.md` |
| CSRF protection                        | ⚠️     | Phần nhỏ trong `HTTP-Deep-Dive.md`         |
| Content Security Policy (CSP)          | 🔴     | **TẠO MỚI**                                |
| CORS deep dive                         | ✅     | `Cross-Origin-Deep-Dive.md`                |
| Secure session management              | ⚠️     | `Token-Storage-Deep-Dive.md`               |
| JWT best practices                     | ⚠️     | `HTTP-Deep-Dive.md`                        |
| OWASP Top 10 (frontend perspective)    | 🔴     | **TẠO MỚI**                                |
| Subresource Integrity (SRI)            | 🔴     | **TẠO MỚI**                                |
| Secure by Design principles            | 🔴     | **TẠO MỚI**                                |
| Input sanitization / validation        | 🔴     | **TẠO MỚI**                                |
| Clickjacking, MIME sniffing prevention | 🔴     | **TẠO MỚI**                                |

> **📌 Action:** Tạo `Frontend-Security-Deep-Dive.md`

---

### 11. Networking & Protocols ✅

| Topic                            | Status | Document                       |
| -------------------------------- | ------ | ------------------------------ |
| TCP 3-way handshake, reliability | ✅     | `TCP-Deep-Dive.md`             |
| TCP vs UDP                       | ✅     | `TCP-vs-UDP.md`                |
| HTTP/1.1, HTTP/2, HTTP/3         | ✅     | `HTTP-Deep-Dive.md`            |
| HTTPS / TLS handshake            | ✅     | `HTTP-Deep-Dive.md`            |
| DNS resolution process           | ✅     | `Browser-Deep-Dive.md`         |
| Browser page load pipeline       | ✅     | `Browser-Deep-Dive.md`         |
| Browser caching strategies       | ✅     | `HTTP-Deep-Dive.md`            |
| Same-Origin Policy, CORS         | ✅     | `Cross-Origin-Deep-Dive.md`    |
| IP addresses, Ports, Subnets     | ⚠️     | Cần thêm chi tiết              |
| VPN, Proxy fundamentals          | 🔴     | **Thêm vào Cybersecurity doc** |

---

### 12. Cybersecurity Domain Knowledge ⚠️

| Topic                                      | Status | Document                                  |
| ------------------------------------------ | ------ | ----------------------------------------- |
| Firewall types (packet, stateful, NGFW)    | 🔴     | **TẠO MỚI**                               |
| IDS/IPS concepts                           | 🔴     | **TẠO MỚI**                               |
| VPN tunneling                              | 🔴     | **TẠO MỚI**                               |
| Zero-Trust architecture                    | 🔴     | **TẠO MỚI**                               |
| MITRE ATT&CK framework                     | ✅     | `Threat-Visualization-AI-Deep-Dive.md` §8 |
| Common attack types (DDoS, MITM, Phishing) | 🔴     | **TẠO MỚI**                               |
| OWASP Top 10                               | 🔴     | **TẠO MỚI**                               |
| SOC operations workflow                    | ⚠️     | Partial in Threat Viz doc                 |
| Network topology concepts                  | ✅     | `Threat-Visualization-AI-Deep-Dive.md` §7 |
| Firewall rules / ACL concepts              | 🔴     | **TẠO MỚI**                               |
| Threat intelligence & IOCs                 | ⚠️     | Partial                                   |

> **📌 Action:** Tạo `Cybersecurity-Fundamentals-Deep-Dive.md`

---

### 13. CSS / HTML / UI-UX & Advanced Styling ⚠️

| Topic                                      | Status | Document                       | JD    |
| ------------------------------------------ | ------ | ------------------------------ | ----- |
| CSS Selectors, Specificity                 | ✅     | `HTML-CSS-Deep-Dive.md`        | Both  |
| Box Model, BFC                             | ✅     | `HTML-CSS-Deep-Dive.md`        | Both  |
| Flexbox, Grid                              | ✅     | `HTML-CSS-Deep-Dive.md`        | Both  |
| Responsive design                          | ✅     | `HTML-CSS-Deep-Dive.md`        | Both  |
| CSS Positioning                            | ✅     | `HTML-CSS-Deep-Dive.md`        | Both  |
| Semantic HTML                              | ✅     | `HTML-CSS-Deep-Dive.md`        | Both  |
| **CSS-in-JS** (styled-components, Emotion) | 🔴     | **TẠO MỚI**                    | E2EE  |
| **CSS Modules**                            | 🔴     | **TẠO MỚI**                    | E2EE  |
| **Sass/Less** preprocessors                | ⚠️     | Cần review                     | E2EE  |
| **UI Design Systems** (building/consuming) | 🔴     | **TẠO MỚI**                    | E2EE  |
| **Pixel-perfect implementation** patterns  | ⚠️     | Cần review                     | E2EE  |
| Accessibility (a11y) basics                | ⚠️     | Cần thêm                       | Both  |
| Dark mode / design tokens                  | ⚠️     | Cần review                     | Both  |
| Critical Control Systems UX patterns       | 🔴     | **Thêm vào Cybersecurity doc** | Cyber |

> **📌 Action:** Bổ sung CSS-in-JS, CSS Modules, Design Systems vào `HTML-CSS-Deep-Dive.md` hoặc tạo doc mới

---

### 14. Browser & V8 Internals ✅

| Topic                                                 | Status | Document                                                          | JD   |
| ----------------------------------------------------- | ------ | ----------------------------------------------------------------- | ---- |
| Chrome multi-process architecture                     | ✅     | `Browser-Deep-Dive.md`                                            | Both |
| Rendering pipeline (DOM→CSSOM→Layout→Paint→Composite) | ✅     | `Browser-Deep-Dive.md`                                            | Both |
| Event handling, delegation                            | ✅     | `Browser-Deep-Dive.md`                                            | Both |
| Client-side storage (Cookie, Storage, IndexedDB)      | ✅     | `LocalStorage-Deep-Dive.md`, `Web-Storage-And-Packet-Sticking.md` | Both |
| **V8 engine, JIT compilation, hidden classes**        | ✅     | `JS-Runtime-Deep-Dive.md`                                         | E2EE |
| **Garbage collection** (Mark-Sweep, Generational)     | ✅     | `JS-Runtime-Deep-Dive.md`                                         | E2EE |
| **Event Loop + Microtasks** deep internals            | ✅     | `JS-Execution-Mechanism-Deep-Dive.md`                             | E2EE |
| **Memory profiling** (DevTools heap snapshots)        | ⚠️     | Cần bổ sung vào Runtime doc                                       | E2EE |
| **Node.js Event Loop** differences from browser       | 🔴     | **TẠO MỚI**                                                       | E2EE |

---

### 15. System Design ⚠️

| Topic                                   | Status | Document                                                 | JD    |
| --------------------------------------- | ------ | -------------------------------------------------------- | ----- |
| Design a real-time dashboard            | 🔄     | `Real-Time-Security-Monitoring-Deep-Dive.md`             | Cyber |
| Design a global threat map              | ✅     | `Threat-Visualization-AI-Deep-Dive.md`                   | Cyber |
| **Design an E2EE messaging app**        | 🔴     | **TẠO MỚI**                                              | E2EE  |
| **Design a video/audio calling system** | 🔴     | **TẠO MỚI**                                              | E2EE  |
| Design Google Calendar / Sheet / Map    | ✅     | `google-calendar.md`, `google-sheet.md`, `google-map.md` | Both  |
| Design an E-commerce promotion system   | ✅     | `e-commerce-promotion.md`                                | Both  |
| Design a food delivery app              | ✅     | `food-delivery.md`                                       | Both  |
| Micro-frontend architecture             | ✅     | `Micro-Frontend-Style-Architecture-Deep-Dive.md`         | Both  |
| Design a firewall rule editor           | 🔴     | **TẠO MỚI**                                              | Cyber |
| Design a log viewer (100K+ entries)     | 🔄     | In Real-Time doc                                         | Cyber |
| **Design offline-first chat with sync** | 🔴     | **TẠO MỚI**                                              | E2EE  |

---

### 16. Data Structures & Algorithms 🔴

| Topic                               | Status | Document                                        |
| ----------------------------------- | ------ | ----------------------------------------------- |
| Array/String manipulation           | 🔴     | **LeetCode practice**                           |
| Hash Map / Set patterns             | 🔴     | **LeetCode practice**                           |
| Two pointers / Sliding window       | 🔴     | **LeetCode practice**                           |
| Stack / Queue                       | 🔴     | **LeetCode practice**                           |
| Binary search                       | 🔴     | **LeetCode practice**                           |
| Tree traversal (DFS, BFS)           | ⚠️     | `React-FileExplorer-Deep-Dive.md`               |
| Graph algorithms (for topology viz) | 🔴     | **LeetCode practice**                           |
| Trie (for IP/domain autocomplete)   | 🔴     | **LeetCode practice**                           |
| Sorting algorithms                  | 🔴     | **LeetCode practice**                           |
| Dynamic Programming basics          | 🔴     | **LeetCode practice**                           |
| Ring Buffer, Circular Queue         | ✅     | `Real-Time-Security-Monitoring-Deep-Dive.md` §6 |

> **📌 Action:** LeetCode 75 + Neetcode 150 focused practice

---

### 17. Soft Skills & Behavioral

| Topic                                      | Status | Notes                    |
| ------------------------------------------ | ------ | ------------------------ |
| Collaboration with backend/security team   | ⚠️     | Prepare STAR stories     |
| Explaining technical decisions to non-tech | ⚠️     | Prepare examples         |
| Handling production incidents              | ⚠️     | Prepare STAR stories     |
| Code review best practices                 | ⚠️     | Prepare examples         |
| Mentoring junior developers                | ⚠️     | Prepare STAR stories     |
| English communication                      | ⚠️     | Practice mock interviews |

---

### 18. Electron & Desktop Development 🔴 CẦN TẠO DOC MỚI (E2EE)

| Topic                                                    | Status | Document    |
| -------------------------------------------------------- | ------ | ----------- |
| Electron architecture (Main Process, Renderer Process)   | 🔴     | **TẠO MỚI** |
| **IPC** (ipcMain, ipcRenderer, contextBridge)            | 🔴     | **TẠO MỚI** |
| **preload.js** — secure bridge between main & renderer   | 🔴     | **TẠO MỚI** |
| Node.js APIs in Electron (fs, path, crypto)              | 🔴     | **TẠO MỚI** |
| **Security hardening** (nodeIntegration: false, sandbox) | 🔴     | **TẠO MỚI** |
| Auto-update mechanism (electron-updater)                 | 🔴     | **TẠO MỚI** |
| Native OS features (notifications, tray, menu)           | 🔴     | **TẠO MỚI** |
| Electron + React integration patterns                    | 🔴     | **TẠO MỚI** |
| **Debugging Electron** (main process vs renderer)        | 🔴     | **TẠO MỚI** |

> **📌 Action:** Tạo `Electron-Desktop-Deep-Dive.md`

---

### 19. E2EE & Cryptography 🔴 CẦN TẠO DOC MỚI (E2EE)

| Topic                                             | Status | Document    |
| ------------------------------------------------- | ------ | ----------- |
| **End-to-End Encryption** concepts                | 🔴     | **TẠO MỚI** |
| **Signal Protocol** (Double Ratchet, X3DH)        | 🔴     | **TẠO MỚI** |
| Web Crypto API (SubtleCrypto)                     | 🔴     | **TẠO MỚI** |
| **AES-256-GCM, RSA, ECDH** key exchange           | 🔴     | **TẠO MỚI** |
| Key management in browser/Electron                | 🔴     | **TẠO MỚI** |
| **WebAssembly for crypto** (libsodium-wasm)       | 🔴     | **TẠO MỚI** |
| Perfect Forward Secrecy (PFS)                     | 🔴     | **TẠO MỚI** |
| Message authentication (HMAC, digital signatures) | 🔴     | **TẠO MỚI** |

> **📌 Action:** Tạo `E2EE-Cryptography-Deep-Dive.md`

---

### 20. WebRTC — Audio/Video/Group Calls 🔴 CẦN TẠO DOC MỚI (E2EE)

| Topic                                          | Status | Document    |
| ---------------------------------------------- | ------ | ----------- |
| **WebRTC fundamentals** (ICE, STUN, TURN, SDP) | 🔴     | **TẠO MỚI** |
| **RTCPeerConnection** API                      | 🔴     | **TẠO MỚI** |
| **MediaStream** — getUserMedia (camera, mic)   | 🔴     | **TẠO MỚI** |
| **Signaling server** architecture              | 🔴     | **TẠO MỚI** |
| **SFU vs Mesh** for group calls                | 🔴     | **TẠO MỚI** |
| Screen sharing                                 | 🔴     | **TẠO MỚI** |
| Audio/Video encoding (VP9, Opus)               | 🔴     | **TẠO MỚI** |
| React + WebRTC integration                     | 🔴     | **TẠO MỚI** |
| **E2EE for WebRTC** (Insertable Streams API)   | 🔴     | **TẠO MỚI** |
| Network quality/bandwidth adaptation           | 🔴     | **TẠO MỚI** |

> **📌 Action:** Tạo `WebRTC-Deep-Dive.md`

---

### 21. IndexedDB / Local-First / Offline 🔴 CẦN TẠO DOC MỚI (E2EE)

| Topic                                        | Status | Document                            |
| -------------------------------------------- | ------ | ----------------------------------- |
| **IndexedDB** API deep dive                  | ⚠️     | `LocalStorage-Deep-Dive.md` (basic) |
| IndexedDB with **Dexie.js** wrapper          | 🔴     | **TẠO MỚI**                         |
| **Data modeling** for local DB               | 🔴     | **TẠO MỚI**                         |
| **Offline-first** architecture pattern       | 🔴     | **TẠO MỚI**                         |
| **Sync strategies** (CRDTs, last-write-wins) | 🔴     | **TẠO MỚI**                         |
| **Message queue** for offline sends          | 🔴     | **TẠO MỚI**                         |
| Storage quota management                     | ⚠️     | Partial                             |
| **Structured clone algorithm**               | ⚠️     | Partial                             |

> **📌 Action:** Tạo `IndexedDB-Local-First-Deep-Dive.md`

---

### 22. Service Workers & PWA 🔴 CẦN TẠO DOC MỚI (E2EE)

| Topic                                                                     | Status | Document    |
| ------------------------------------------------------------------------- | ------ | ----------- |
| Service Worker lifecycle (install, activate, fetch)                       | 🔴     | **TẠO MỚI** |
| **Cache strategies** (Cache First, Network First, Stale-While-Revalidate) | 🔴     | **TẠO MỚI** |
| **Push notifications** (Push API + Notification API)                      | 🔴     | **TẠO MỚI** |
| **Background Sync** API                                                   | 🔴     | **TẠO MỚI** |
| Workbox library                                                           | 🔴     | **TẠO MỚI** |
| Service Worker + WebSocket coordination                                   | 🔴     | **TẠO MỚI** |

> **📌 Action:** Tạo `Service-Workers-PWA-Deep-Dive.md`

---

### 23. SOLID & Design Patterns ⚠️ CẦN TẠO DOC MỚI (E2EE)

| Topic                                        | Status | Document    |
| -------------------------------------------- | ------ | ----------- |
| **SOLID principles** in Frontend context     | 🔴     | **TẠO MỚI** |
| **DRY, KISS, YAGNI**                         | ⚠️     | Cần review  |
| **Observer pattern** (EventEmitter, pub/sub) | ⚠️     | Scattered   |
| **Strategy pattern** (plugin systems)        | ⚠️     | Scattered   |
| **Factory pattern** (component factories)    | 🔴     | **TẠO MỚI** |
| **Dependency Injection** in React            | 🔴     | **TẠO MỚI** |
| **Clean Architecture** for frontend          | 🔴     | **TẠO MỚI** |
| **Code review** best practices & leadership  | ⚠️     | Cần review  |

> **📌 Action:** Tạo `SOLID-Design-Patterns-Deep-Dive.md`

---

### 24. Messaging Domain Knowledge (E2EE)

| Topic                                                         | Status | Document          |
| ------------------------------------------------------------- | ------ | ----------------- |
| **XMPP protocol** fundamentals                                | 🔴     | **TẠO MỚI**       |
| **Message delivery guarantees** (at-least-once, exactly-once) | 🔴     | Thêm vào E2EE doc |
| Chat app data model (threads, reactions, read receipts)       | 🔴     | **TẠO MỚI**       |
| **Presence system** (online, typing, last seen)               | 🔴     | **TẠO MỚI**       |
| Group chat architecture                                       | 🔴     | **TẠO MỚI**       |
| Message search (full-text, encrypted search)                  | 🔴     | **TẠO MỚI**       |
| File/media transfer in E2EE context                           | 🔴     | **TẠO MỚI**       |

---

### 25. GraphQL & API Integration 🔴 CẦN TẠO DOC MỚI (AI)

| Topic                                                        | Status | Document                             |
| ------------------------------------------------------------ | ------ | ------------------------------------ |
| **RESTful API** design & best practices                      | ⚠️     | Scattered in other docs              |
| **GraphQL** fundamentals (queries, mutations, subscriptions) | 🔴     | **TẠO MỚI**                          |
| **Apollo Client** (cache, optimistic updates, pagination)    | 🔴     | **TẠO MỚI**                          |
| GraphQL vs REST trade-offs                                   | 🔴     | **TẠO MỚI**                          |
| **GraphQL subscriptions** for real-time data                 | 🔴     | **TẠO MỚI**                          |
| Error handling & retry patterns (API layer)                  | ⚠️     | Partial                              |
| **React Query + REST** vs **Apollo + GraphQL**               | 🔴     | **TẠO MỚI**                          |
| API caching strategies (SWR, stale-while-revalidate)         | ⚠️     | `TanStack-SingleFlight-Deep-Dive.md` |
| **Data fetching patterns** (waterfall, parallel, prefetch)   | ⚠️     | Partial                              |
| **API pagination** (cursor, offset, infinite scroll)         | 🔴     | **TẠO MỚI**                          |

> **📌 Action:** Tạo `GraphQL-API-Integration-Deep-Dive.md`

---

### 26. CI/CD & DevOps for Frontend 🔴 CẦN TẠO DOC MỚI (AI)

| Topic                                          | Status | Document    |
| ---------------------------------------------- | ------ | ----------- |
| **CI/CD pipeline** fundamentals                | 🔴     | **TẠO MỚI** |
| GitHub Actions / GitLab CI basics              | 🔴     | **TẠO MỚI** |
| **Automated testing in CI** (lint, unit, e2e)  | 🔴     | **TẠO MỚI** |
| **Deployment strategies** (blue-green, canary) | 🔴     | **TẠO MỚI** |
| Docker basics for frontend                     | 🔴     | **TẠO MỚI** |
| **Preview deployments** (Vercel, Netlify)      | ⚠️     | Cần review  |
| Environment management (staging, production)   | ⚠️     | Cần review  |
| **Monorepo** (Nx, Turborepo)                   | 🔴     | **TẠO MỚI** |

> **📌 Action:** Tạo `CI-CD-Frontend-Deep-Dive.md`

---

### 27. UI Component Libraries & Accessibility ⚠️ (AI + E2EE)

| Topic                                          | Status | Document    |
| ---------------------------------------------- | ------ | ----------- |
| **Material UI (MUI)** — theming, customization | ⚠️     | Cần review  |
| **Ant Design** — config provider, patterns     | ⚠️     | Cần review  |
| Building a **Design System** from scratch      | 🔴     | **TẠO MỚI** |
| **Headless UI** pattern (Radix, React Aria)    | 🔴     | **TẠO MỚI** |
| **Storybook** for component documentation      | 🔴     | **TẠO MỚI** |
| **Accessibility (WCAG 2.1)** deep dive         | 🔴     | **TẠO MỚI** |
| ARIA roles, keyboard navigation                | 🔴     | **TẠO MỚI** |
| **Screen reader** testing patterns             | 🔴     | **TẠO MỚI** |
| **Focus management** in complex UIs            | ⚠️     | Partial     |

> **📌 Action:** Bổ sung vào `HTML-CSS-Deep-Dive.md` hoặc tạo `Accessibility-DesignSystem-Deep-Dive.md`

---

### 28. AI/ML Frontend Integration ⚠️ (Cyber + AI)

| Topic                                                       | Status | Document                                   |
| ----------------------------------------------------------- | ------ | ------------------------------------------ |
| Presenting **AI-driven insights** in UI                     | ⚠️     | `Threat-Visualization-AI-Deep-Dive.md`     |
| **Confidence scores** → user-friendly indicators            | ✅     | `Threat-Visualization-AI-Deep-Dive.md` §10 |
| **AI agent interfaces** (chat, actions, suggestions)        | 🔴     | **TẠO MỚI**                                |
| **Streaming AI responses** (SSE/WS for LLM output)          | ⚠️     | `SSE-WebSocket-Deep-Dive.md`               |
| **Loading states** for ML inference (skeleton, progressive) | 🔴     | **TẠO MỚI**                                |
| **Data pipeline visualization**                             | ⚠️     | `Threat-Visualization-AI-Deep-Dive.md`     |
| **A/B testing** UI for AI features                          | 🔴     | **TẠO MỚI**                                |
| **Explainable AI** (XAI) in UI                              | ✅     | `Threat-Visualization-AI-Deep-Dive.md` §4  |
| SQL/NoSQL concepts for frontend engineers                   | 🔴     | **TẠO MỚI**                                |

> **📌 Action:** Phần lớn đã cover trong `Threat-Visualization-AI-Deep-Dive.md`, cần bổ sung AI Agent UI patterns

---

## 📋 ACTION PLAN — Documents cần tạo mới

### 🔴 P0 — Core (cả 3 JD đều yêu cầu)

| Priority | Document                                                | Est. Size   | Why                                |
| -------- | ------------------------------------------------------- | ----------- | ---------------------------------- |
| 🔴 P0    | `TypeScript-Advanced-Deep-Dive.md`                      | ~2000 lines | All 3 JDs: "Non-negotiable"        |
| 🔴 P0    | `Frontend-Security-Deep-Dive.md`                        | ~1500 lines | All 3 JDs: XSS, CSP, secure coding |
| 🔴 P0    | `Testing-Deep-Dive.md`                                  | ~1500 lines | All 3 JDs: quality assurance       |
| 🔴 P0    | Hoàn thành `Real-Time-Security-Monitoring-Deep-Dive.md` | ~1500 more  | §7-12: Redux, Zustand, TQ          |

### 🟠 P1 — Domain-Specific (1-2 JD yêu cầu rõ ràng)

| Priority | Document                                  | Est. Size   | Why                     |
| -------- | ----------------------------------------- | ----------- | ----------------------- |
| 🟠 P1    | `GraphQL-API-Integration-Deep-Dive.md`    | ~1200 lines | AI JD: REST + GraphQL   |
| 🟠 P1    | `Electron-Desktop-Deep-Dive.md`           | ~1500 lines | E2EE: core requirement  |
| 🟠 P1    | `E2EE-Cryptography-Deep-Dive.md`          | ~1200 lines | E2EE: domain knowledge  |
| 🟠 P1    | `WebRTC-Deep-Dive.md`                     | ~1500 lines | E2EE: audio/video calls |
| 🟠 P1    | `Cybersecurity-Fundamentals-Deep-Dive.md` | ~1200 lines | Cyber: domain knowledge |
| 🟠 P1    | `IndexedDB-Local-First-Deep-Dive.md`      | ~1000 lines | E2EE: offline-ready     |

### 🟡 P2 — Bổ sung & Nice-to-have

| Priority | Document                                   | Est. Size   | Why                           |
| -------- | ------------------------------------------ | ----------- | ----------------------------- |
| 🟡 P2    | `CI-CD-Frontend-Deep-Dive.md`              | ~1000 lines | AI JD: CI/CD pipeline         |
| 🟡 P2    | `Accessibility-DesignSystem-Deep-Dive.md`  | ~1000 lines | AI+E2EE: A11y + Design System |
| 🟡 P2    | `SOLID-Design-Patterns-Deep-Dive.md`       | ~1000 lines | E2EE+AI: code quality         |
| 🟡 P2    | `Service-Workers-PWA-Deep-Dive.md`         | ~1000 lines | E2EE: nice-to-have            |
| 🟡 P2    | `State-Management-Comparison-Deep-Dive.md` | ~1500 lines | Redux vs Zustand vs TQ        |
| 🟡 P2    | `System-Design-E2EE-Messaging.md`          | ~1200 lines | E2EE: interview scenario      |
| 🟡 P2    | `System-Design-Security-Dashboard.md`      | ~1000 lines | Cyber: interview scenario     |
| 🟡 P2    | `System-Design-AI-Agent-Platform.md`       | ~1200 lines | AI: interview scenario        |

---

## 📚 Existing Documents — Quick Reference

```
ĐÃ CÓ (57 files):
═══════════════════════════════════════════════════════════════

  JAVASCRIPT & TYPESCRIPT:
  ├── JS-Basics-Prototype-Deep-Dive.md
  ├── JS-DataTypes-ES6-Deep-Dive.md
  ├── JS-Execution-Mechanism-Deep-Dive.md
  ├── JS-Runtime-Deep-Dive.md
  ├── JavaScript-Deep-Dive.md
  ├── Promise-Concurrency-Deep-Dive.md
  └── CommonJS-ES6-Modules-Deep-Dive.md

  REACT:
  ├── React-Best-Practices-Deep-Dive.md
  ├── React-Effect-Dependencies-Deep-Dive.md
  ├── React-DataTable-Deep-Dive.md
  ├── React-FileExplorer-Deep-Dive.md
  ├── React-NestedCheckboxes-Deep-Dive.md
  └── TanStack-SingleFlight-Deep-Dive.md

  VISUALIZATION & AI:
  └── Threat-Visualization-AI-Deep-Dive.md ✨

  REAL-TIME:
  ├── SSE-WebSocket-Deep-Dive.md
  └── Real-Time-Security-Monitoring-Deep-Dive.md (🔄 đang viết)

  PERFORMANCE:
  ├── High-Performance-Frontend-Deep-Dive.md
  ├── Large-Data-Handling-Deep-Dive.md
  └── Image-LazyLoad-Deep-Dive.md

  BUILD TOOLS:
  ├── Webpack-Deep-Dive.md
  ├── Webpack-HMR-Deep-Dive.md
  ├── Webpack-Async-Loading-Deep-Dive.md
  ├── Webpack-Loader-Deep-Dive.md
  ├── Esbuild-Deep-Dive.md
  └── AST-Deep-Dive.md

  NETWORKING:
  ├── HTTP-Deep-Dive.md
  ├── TCP-Deep-Dive.md
  ├── TCP-vs-UDP.md
  └── Cross-Origin-Deep-Dive.md

  BROWSER:
  ├── Browser-Deep-Dive.md
  ├── LocalStorage-Deep-Dive.md
  ├── Token-Storage-Deep-Dive.md
  └── Web-Storage-And-Packet-Sticking.md

  HTML/CSS:
  └── HTML-CSS-Deep-Dive.md

  SYSTEM DESIGN:
  ├── google-calendar.md
  ├── google-sheet.md
  ├── google-map.md
  ├── e-commerce-promotion.md
  ├── food-delivery.md
  └── BookMyShow.md

  OTHER:
  ├── Frontend-Interview-Prep-Deep-Dive.md
  ├── Frontend-Standards-Deep-Dive.md
  ├── Modular-Principles-Deep-Dive.md
  └── Micro-Frontend-Style-Architecture-Deep-Dive.md
```

---

## 🎯 Interview Focus Areas — Theo từng JD

```
═══════════════════════════════════════════════════════════════
JD #1: AI FIREWALL / CYBERSECURITY
═══════════════════════════════════════════════════════════════

  ① HIGH-PERF FRONTEND + VISUALIZATION (40%)
  ┌──────────────────────────────────────────────────────────┐
  │ • React + TypeScript deep dive                          │
  │ • D3.js, Recharts, Canvas, WebGL                        │
  │ • Virtual scrolling 10K+ rows                          │
  │ • Memory management for long-running sessions           │
  │ → DOCS: React-Best-Practices, High-Performance,         │
  │   Threat-Visualization, Large-Data-Handling              │
  └──────────────────────────────────────────────────────────┘

  ② REAL-TIME & STATE MANAGEMENT (30%)
  ┌──────────────────────────────────────────────────────────┐
  │ • WebSocket architecture (auth, reconnect, heartbeat)   │
  │ • Redux vs Zustand vs TanStack Query comparison         │
  │ • Ring Buffer, RAF batching, Backpressure               │
  │ → DOCS: Real-Time-Security-Monitoring, SSE-WebSocket    │
  └──────────────────────────────────────────────────────────┘

  ③ CYBERSECURITY DOMAIN (20%)
  ┌──────────────────────────────────────────────────────────┐
  │ • Firewall, Zero-Trust, IDS/IPS, OWASP Top 10          │
  │ • XSS prevention, CSP, secure session                   │
  │ → DOCS: CẦN TẠO MỚI (Security + Cybersecurity docs)    │
  └──────────────────────────────────────────────────────────┘

  ④ SYSTEM DESIGN (10%)
  ┌──────────────────────────────────────────────────────────┐
  │ • Design a SOC Dashboard / Firewall Rule Editor         │
  │ → DOCS: System Design docs + Real-Time doc              │
  └──────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════
JD #2: E2EE MESSAGING PLATFORM
═══════════════════════════════════════════════════════════════

  ① REACT + TYPESCRIPT + REDUX (35%)
  ┌──────────────────────────────────────────────────────────┐
  │ • React hooks, rendering, reconciliation                │
  │ • TypeScript deep (generics, utility types)             │
  │ • Redux + Thunk: scalable state containers              │
  │ • Pixel-perfect, responsive UI components               │
  │ → DOCS: React-Best-Practices, TypeScript doc (TẠO MỚI) │
  └──────────────────────────────────────────────────────────┘

  ② PERFORMANCE & V8 INTERNALS (25%)
  ┌──────────────────────────────────────────────────────────┐
  │ • Critical Rendering Path (Layout, Paint, Composite)    │
  │ • V8: memory leaks, heap profiling, race conditions     │
  │ • High-frequency real-time data rendering               │
  │ • Event Loop + Microtask deep understanding             │
  │ → DOCS: Browser-Deep-Dive, JS-Runtime, High-Performance │
  └──────────────────────────────────────────────────────────┘

  ③ ELECTRON & DESKTOP (15%)
  ┌──────────────────────────────────────────────────────────┐
  │ • Electron IPC bridge, preload.js                       │
  │ • Node.js integration, native OS features               │
  │ • Security hardening (sandbox, CSP)                     │
  │ → DOCS: Electron doc (TẠO MỚI)                          │
  └──────────────────────────────────────────────────────────┘

  ④ REAL-TIME & DATA (15%)
  ┌──────────────────────────────────────────────────────────┐
  │ • WebSocket: sub-second latency messaging               │
  │ • WebRTC: audio/video/group calls                       │
  │ • IndexedDB: offline-first, data sync                   │
  │ → DOCS: WebRTC doc, IndexedDB doc (TẠO MỚI)            │
  └──────────────────────────────────────────────────────────┘

  ⑤ SECURITY & CRYPTOGRAPHY (10%)
  ┌──────────────────────────────────────────────────────────┐
  │ • E2EE concepts, Signal Protocol                        │
  │ • Web Crypto API, Wasm for crypto                       │
  │ • Electron security hardening                           │
  │ → DOCS: E2EE doc (TẠO MỚI)                              │
  └──────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════
JD #3: AI AGENT PLATFORM
═══════════════════════════════════════════════════════════════

  ① REACT + TYPESCRIPT + STATE MGMT (35%)
  ┌──────────────────────────────────────────────────────────┐
  │ • React deep (hooks, rendering, reconciliation)         │
  │ • TypeScript (strong plus → expect deep questions)      │
  │ • Redux / Zustand / Pinia patterns                      │
  │ • Responsive, accessible UI components                  │
  │ → DOCS: React-Best-Practices, TypeScript doc (TẠO MỚI) │
  └──────────────────────────────────────────────────────────┘

  ② DATA VISUALIZATION & AI INTEGRATION (25%)
  ┌──────────────────────────────────────────────────────────┐
  │ • D3.js / Chart.js for AI model outputs                 │
  │ • Present AI insights, recommendations, actions         │
  │ • Streaming AI responses (SSE/WS for LLM)               │
  │ • Complex data-rich dashboards                          │
  │ → DOCS: Threat-Visualization, SSE-WebSocket             │
  └──────────────────────────────────────────────────────────┘

  ③ API INTEGRATION & TESTING (20%)
  ┌──────────────────────────────────────────────────────────┐
  │ • RESTful API + GraphQL integration                     │
  │ • Jest, RTL, Cypress/Playwright                         │
  │ • CI/CD pipeline experience                             │
  │ → DOCS: GraphQL doc, Testing doc (TẠO MỚI)              │
  └──────────────────────────────────────────────────────────┘

  ④ PERFORMANCE & UI/UX (15%)
  ┌──────────────────────────────────────────────────────────┐
  │ • Frontend performance optimization                     │
  │ • UI component libraries (MUI, Ant Design)              │
  │ • Accessibility, responsive design                      │
  │ → DOCS: High-Performance, HTML-CSS, A11y doc            │
  └──────────────────────────────────────────────────────────┘

  ⑤ MENTORSHIP & COLLABORATION (5%)
  ┌──────────────────────────────────────────────────────────┐
  │ • Mentoring junior engineers                            │
  │ • Agile workflow, cross-team collaboration              │
  │ • Technology evaluation & advocacy                      │
  │ → PREP: STAR stories, Behavioral questions              │
  └──────────────────────────────────────────────────────────┘
```

---

## 🔄 OVERLAP — Kiến thức dùng cho CẢ 3 JD

```
SHARED KNOWLEDGE (học 1 lần, dùng cho CẢ 3 JD):
═══════════════════════════════════════════════════════════════
  ✅ JavaScript Core & ES6+
  ✅ TypeScript
  ✅ React + Hooks deep
  ✅ State Management (Redux/Zustand)
  ✅ WebSocket real-time
  ✅ Performance optimization + CRP
  ✅ Build tools (Webpack/Vite)
  ✅ Testing (Jest/Playwright)
  ✅ Frontend Security (XSS, CSP)
  ✅ Browser internals
  ✅ HTML/CSS + Responsive + Accessible
  ✅ Data Structures & Algorithms
  ✅ System Design
  ✅ Behavioral / Mentorship

SHARED: CYBERSECURITY + AI AGENT:
  🔶 Data Visualization (D3.js, Recharts)
  🔶 AI model outputs → UI translation

UNIQUE TO CYBERSECURITY JD:
  🔶 Firewall/IDS/Zero-Trust domain
  🔶 MITRE ATT&CK framework
  🔶 WebGL/Three.js for 3D security viz
  🔶 Binary protocols (MessagePack)

UNIQUE TO E2EE MESSAGING JD:
  🔷 Electron / IPC / Desktop
  🔷 E2EE / Cryptography / Signal Protocol
  🔷 WebRTC (audio/video/group calls)
  🔷 IndexedDB / Local-first / Offline
  🔷 Service Workers / PWA
  🔷 XMPP protocol
  🔷 CSS-in-JS / Design Systems

UNIQUE TO AI AGENT PLATFORM JD:
  🟢 GraphQL integration (Apollo Client)
  🟢 CI/CD pipelines
  🟢 UI Component Libraries (MUI, Ant Design)
  🟢 AI agent interfaces (chat, actions, suggestions)
  � Data pipeline integration
  🟢 SQL/NoSQL awareness
  🟢 Agile methodology
  🟢 Technology evaluation mindset
```
