# Browser API — Deep Dive

> 📅 2026-02-13 · ⏱ 30 phút đọc
>
> DOM & BOM API, DOM Performance, Event Flow & Delegation,
> Network Requests (XHR/Fetch), Same-Origin Policy & CORS,
> Browser Storage, Cross-Tab Communication
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Core Browser Interview

---

## Mục Lục

| #   | Phần                                         |
| --- | -------------------------------------------- |
| 1   | DOM API — W3C Standard & Browser Differences |
| 2   | BOM — Browser Object Model                   |
| 3   | DOM Performance Optimization                 |
| 4   | Browser Storage — Massive Data & Performance |
| 5   | Event Flow — Capturing, Bubbling, Delegation |
| 6   | Network Requests — XHR, Fetch, Libraries     |
| 7   | Same-Origin Policy & CORS                    |
| 8   | Browser Storage Mechanisms — So sánh         |
| 9   | Cross-Tab Communication                      |
| 10  | Tổng kết & Checklist phỏng vấn               |

---

## §1. DOM API — W3C Standard & Browser Differences

```
DOM (Document Object Model):
═══════════════════════════════════════════════════════════════

  → API cho phép JS tương tác với HTML/XML documents
  → W3C standard → cross-browser (lý thuyết!)
  → Document → Elements → Attributes → Text = TREE structure!

  DOM NODE TYPES:
  ┌──────────────────┬───────┬──────────────────────┐
  │ Type             │ Value │ Ví dụ                 │
  ├──────────────────┼───────┼──────────────────────┤
  │ ELEMENT_NODE     │ 1     │ <div>, <p>, <span>   │
  │ ATTRIBUTE_NODE   │ 2     │ class="foo" (deprecated)│
  │ TEXT_NODE        │ 3     │ "Hello World"        │
  │ COMMENT_NODE     │ 8     │ <!-- comment -->     │
  │ DOCUMENT_NODE    │ 9     │ document             │
  │ DOCUMENT_FRAGMENT│ 11    │ DocumentFragment     │
  └──────────────────┴───────┴──────────────────────┘
```

```javascript
// ═══ DOM SELECTION ═══
document.getElementById("app"); // 1 element (by ID)
document.getElementsByClassName("btn"); // HTMLCollection (live!)
document.getElementsByTagName("div"); // HTMLCollection (live!)
document.querySelector(".btn.primary"); // 1 element (CSS selector)
document.querySelectorAll(".btn"); // NodeList (STATIC!)

// ⚠️ HTMLCollection vs NodeList:
// HTMLCollection: LIVE! DOM thay đổi → collection cập nhật tự động!
// NodeList (querySelectorAll): STATIC! Snapshot lúc gọi!
// NodeList (childNodes): LIVE!

const live = document.getElementsByClassName("item"); // LIVE!
const static_ = document.querySelectorAll(".item"); // STATIC!
document.body.innerHTML += '<div class="item">New</div>';
live.length; // +1 ← TỰ ĐỘNG cập nhật!
static_.length; // KHÔNG đổi! ← Snapshot cũ!

// ═══ DOM MANIPULATION ═══
// Tạo:
const div = document.createElement("div");
const text = document.createTextNode("Hello");
const fragment = document.createDocumentFragment(); // ⚡ Batch!

// Thêm:
parent.appendChild(child);
parent.insertBefore(newNode, referenceNode);
parent.append(node1, node2, "text"); // Multiple! (modern)
parent.prepend(node); // Đầu! (modern)
ref.before(node); // Trước ref (modern)
ref.after(node); // Sau ref (modern)

// Xóa:
parent.removeChild(child);
child.remove(); // Modern!

// Thay thế:
parent.replaceChild(newChild, oldChild);
oldChild.replaceWith(newChild); // Modern!

// Clone:
node.cloneNode(false); // Shallow (chỉ element, không con!)
node.cloneNode(true); // Deep (element + tất cả con!)

// ═══ DOM ATTRIBUTES ═══
el.getAttribute("data-id");
el.setAttribute("data-id", "123");
el.removeAttribute("data-id");
el.hasAttribute("data-id");
el.dataset.id; // data-* attributes truy cập trực tiếp!

// ⚠️ getAttribute vs property:
// getAttribute('checked') → "checked" (HTML attribute — string!)
// el.checked → true (DOM property — boolean!)
// Attribute = giá trị INITIAL trong HTML
// Property = giá trị HIỆN TẠI trong JS object

// ═══ DOM STYLES ═══
el.style.backgroundColor = "red"; // Inline style
el.className = "btn primary"; // Thay thế!
el.classList.add("active"); // Thêm class
el.classList.remove("active"); // Xóa class
el.classList.toggle("active"); // Toggle!
el.classList.contains("active"); // Kiểm tra
el.classList.replace("old", "new"); // Thay thế

// Computed Style (giá trị THỰC TẾ — sau CSS cascade!):
getComputedStyle(el).fontSize; // "16px"

// ═══ BROWSER DIFFERENCES ═══
// innerText vs textContent:
// textContent: TẤT CẢ text (kể cả hidden!) — nhanh! W3C!
// innerText: chỉ VISIBLE text — trigger reflow! Chậm!
// innerHTML: HTML string (⚠️ XSS risk!)

// children vs childNodes:
// children: chỉ ELEMENT nodes (HTMLCollection!)
// childNodes: TẤT CẢ nodes (text, comment...) (NodeList!)
```

---

## §2. BOM — Browser Object Model

```javascript
// ═══ WINDOW — Global Object ═══
// window = global scope + Browser APIs

window.innerWidth; // Viewport width (excluding scrollbar)
window.innerHeight; // Viewport height
window.outerWidth; // Browser window width
window.outerHeight; // Browser window height
window.scrollX; // Horizontal scroll position
window.scrollY; // Vertical scroll position
window.devicePixelRatio; // HiDPI ratio (retina = 2)

window.open(url, target, features);
window.close();
window.print();
window.alert("Hello");
window.confirm("Sure?"); // → true/false
window.prompt("Name?"); // → string/null

// ═══ LOCATION ═══
// https://www.example.com:8080/path/page?id=1&name=alice#section
location.href; // Full URL
location.protocol; // "https:"
location.hostname; // "www.example.com"
location.port; // "8080"
location.host; // "www.example.com:8080"
location.pathname; // "/path/page"
location.search; // "?id=1&name=alice"
location.hash; // "#section"
location.origin; // "https://www.example.com:8080"

location.assign(url); // Navigate (thêm history!)
location.replace(url); // Navigate (KHÔNG thêm history!)
location.reload(); // Reload (cache nếu có)
location.reload(true); // Force reload (no cache!)

// URL Search Params:
const params = new URLSearchParams(location.search);
params.get("id"); // "1"
params.has("name"); // true
params.set("page", "2");
params.toString(); // "id=1&name=alice&page=2"

// ═══ NAVIGATOR ═══
navigator.userAgent; // Browser/OS string
navigator.language; // "vi", "en-US"
navigator.onLine; // true/false
navigator.clipboard; // Clipboard API
navigator.geolocation; // Geolocation API
navigator.mediaDevices; // Camera/Mic API
navigator.serviceWorker; // Service Worker API
navigator.sendBeacon(url, data); // Gửi data trước khi trang đóng!

// ⚠️ Detect browser bằng userAgent KHÔNG đáng tin!
// → Dùng Feature Detection:
if ("IntersectionObserver" in window) {
  /* use it */
}
if ("serviceWorker" in navigator) {
  /* use it */
}

// ═══ HISTORY ═══
history.length; // Số entries
history.back(); // ← Quay lại
history.forward(); // → Tiến tới
history.go(-2); // Nhảy 2 trang trước
history.pushState(state, title, url); // Thêm entry (SPA!)
history.replaceState(state, title, url); // Thay thế entry
window.addEventListener("popstate", (e) => {
  console.log(e.state); // Khi user nhấn Back/Forward
});

// ═══ SCREEN ═══
screen.width; // Độ phân giải ngang
screen.height; // Độ phân giải dọc
screen.availWidth; // Trừ taskbar
screen.availHeight;
screen.colorDepth; // 24 (bits)
```

---

## §3. DOM Performance Optimization

```
VẤN ĐỀ HIỆU SUẤT DOM:
═══════════════════════════════════════════════════════════════

  DOM operations = CHẬM! (cross-boundary JS ↔ C++ rendering engine!)
  → Thay đổi DOM → Reflow (layout) + Repaint → TỐN HIỆU SUẤT!
  → Mục tiêu: GIẢM số lần thao tác DOM!
```

```javascript
// ═══ ① DocumentFragment — BATCH operations! ═══
// ❌ Chậm (10,000 DOM writes!):
for (let i = 0; i < 10000; i++) {
  const li = document.createElement("li");
  li.textContent = `Item ${i}`;
  ul.appendChild(li); // 10,000 reflows! 💀
}

// ✅ Nhanh (1 DOM write!):
const fragment = document.createDocumentFragment();
for (let i = 0; i < 10000; i++) {
  const li = document.createElement("li");
  li.textContent = `Item ${i}`;
  fragment.appendChild(li); // Fragment = trongm emory!
}
ul.appendChild(fragment); // 1 reflow! ⚡

// ═══ ② innerHTML batch — Xây string rồi gán 1 lần ═══
// ✅ Nhanh:
let html = "";
for (let i = 0; i < 10000; i++) {
  html += `<li>Item ${i}</li>`;
}
ul.innerHTML = html; // 1 parse + 1 reflow!

// ═══ ③ Tránh FORCED SYNCHRONOUS LAYOUT ═══
// ❌ Layout Thrashing (đọc → viết → đọc → viết...):
for (let i = 0; i < 100; i++) {
  const height = el.offsetHeight; // FORCE LAYOUT! (đọc)
  el.style.height = height + 1 + "px"; // Invalidate layout (viết)
  // → Mỗi vòng = 1 forced reflow! 100 reflows! 💀
}

// ✅ Batch đọc, batch viết:
const height = el.offsetHeight; // Đọc 1 lần!
for (let i = 0; i < 100; i++) {
  el.style.height = height + i + "px"; // Chỉ viết!
}
// → Browser gộp thành 1 reflow!

// ═══ ④ requestAnimationFrame — Sync với render cycle ═══
// ✅ Animate mượt (60fps):
function animate() {
  el.style.transform = `translateX(${pos++}px)`;
  if (pos < 300) {
    requestAnimationFrame(animate); // Sync với browser paint!
  }
}
requestAnimationFrame(animate);
// → Chạy TRƯỚC mỗi paint → mượt! Tự throttle 60fps!

// ═══ ⑤ Virtual DOM / Diffing (React approach) ═══
// → Không thao tác DOM trực tiếp
// → Diff virtual tree → chỉ patch THAY ĐỔI → minimal DOM operations!
// → React, Vue sử dụng nội bộ!

// ═══ ⑥ CSS class thay vì inline styles ═══
// ❌ Nhiều reflows:
el.style.width = "100px";
el.style.height = "200px";
el.style.color = "red";
// → Có thể 3 reflows!

// ✅ 1 reflow:
el.className = "new-style"; // 1 class change = 1 reflow!

// ═══ ⑦ Debounce / Throttle ═══
function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

function throttle(fn, interval) {
  let lastTime = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastTime >= interval) {
      lastTime = now;
      fn.apply(this, args);
    }
  };
}

// Dùng cho: scroll, resize, input, mousemove
window.addEventListener("scroll", throttle(handleScroll, 100));
input.addEventListener("input", debounce(handleSearch, 300));
```

---

## §4. Browser Storage — Massive Data & Performance

```javascript
// ═══ IndexedDB — DATABASE trong browser! ═══
// → Lưu trữ STRUCTURED DATA lượng lớn (hàng trăm MB!)
// → Asynchronous (không block UI!)
// → Key-value + indexes + transactions

function openDB(name, version) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, version);

    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      // Tạo Object Store (= table):
      if (!db.objectStoreNames.contains("users")) {
        const store = db.createObjectStore("users", { keyPath: "id" });
        store.createIndex("email", "email", { unique: true });
        store.createIndex("age", "age");
      }
    };

    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

// CRUD operations:
async function addUser(db, user) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("users", "readwrite");
    tx.objectStore("users").add(user);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

async function getUser(db, id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("users", "readonly");
    const req = tx.objectStore("users").get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function queryByIndex(db, indexName, value) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("users", "readonly");
    const index = tx.objectStore("users").index(indexName);
    const req = index.getAll(value);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// Sử dụng:
const db = await openDB("myApp", 1);
await addUser(db, { id: 1, name: "Alice", email: "a@b.com", age: 25 });
const user = await getUser(db, 1);
const users = await queryByIndex(db, "age", 25);

// ⚠️ PERFORMANCE TIPS:
// ✅ Batch writes trong 1 transaction (không tạo tx mỗi write!)
// ✅ Dùng index cho queries thường xuyên
// ✅ Cursor cho large datasets (stream thay vì getAll!)
// ✅ Web Worker cho heavy IndexedDB operations!
```

---

## §5. Event Flow — Capturing, Bubbling, Delegation

```
DOM EVENT FLOW (W3C):
═══════════════════════════════════════════════════════════════

  3 PHASES:
  ① CAPTURING (bắt) — từ TRÊN xuống DƯỚI (window → target)
  ② TARGET — đến element ĐÍCH
  ③ BUBBLING (sủi bọt) — từ DƯỚI lên TRÊN (target → window)

  Click <button> bên trong <div> bên trong <body>:

  CAPTURING (phase 1):        BUBBLING (phase 3):
  window ─────┐               ┌───── window
  document ───┤               ├───── document
  <html> ─────┤               ├───── <html>
  <body> ─────┤               ├───── <body>
  <div> ──────┤               ├───── <div>
              ▼               ▲
           <button>  ←── TARGET (phase 2)
```

```javascript
// ═══ addEventListener — 3rd arg = capture? ═══
el.addEventListener("click", handler, false); // BUBBLING (default!)
el.addEventListener("click", handler, true); // CAPTURING!
el.addEventListener("click", handler, {
  capture: false, // Bubbling
  once: true, // Tự remove sau 1 lần!
  passive: true, // Không gọi preventDefault! (scroll performance!)
});

// ⚠️ event.stopPropagation():
// → DỪNG lan truyền (capturing HOẶC bubbling)
// → Listeners cùng element VẪN chạy!

// event.stopImmediatePropagation():
// → DỪNG TẤT CẢ — kể cả listeners cùng element!

// event.preventDefault():
// → Ngăn hành vi MẶC ĐỊNH (link click, form submit...)
// → KHÔNG dừng propagation!

// ═══ EVENT DELEGATION (Ủy quyền sự kiện!) ═══
// → Thay vì gắn listener cho MỖI child → gắn 1 listener ở PARENT!
// → Tận dụng EVENT BUBBLING!

// ❌ Gắn 1000 listeners:
document.querySelectorAll(".item").forEach((item) => {
  item.addEventListener("click", handleClick); // 1000 listeners! 💀
});

// ✅ Gắn 1 listener (delegation!):
document.getElementById("list").addEventListener("click", (e) => {
  const item = e.target.closest(".item"); // Tìm ancestor match!
  if (!item) return; // Click ngoài item → bỏ!
  handleClick(item);
});

// ƯU ĐIỂM delegation:
// ✅ Ít listeners → ít memory!
// ✅ Dynamic elements (thêm/xóa) → tự động hoạt động!
// ✅ Setup 1 lần!

// ⚠️ CHÚ Ý:
// → Dùng e.target (element THỰC SỰ được click!)
// → Dùng e.currentTarget (element CÓ listener!)
// → closest() để tìm đúng element cha!

// ═══ EVENTS KHÔNG BUBBLE ═══
// focus / blur → KHÔNG bubble! (dùng focusin / focusout thay thế!)
// load / unload / scroll (trên element) / resize
// mouseenter / mouseleave → KHÔNG bubble! (dùng mouseover/mouseout!)
```

---

## §6. Network Requests — XHR, Fetch, Libraries

```javascript
// ═══ ① XMLHttpRequest (XHR) — Classic! ═══

function ajax(options) {
  return new Promise((resolve, reject) => {
    const {
      method = "GET",
      url,
      data,
      headers = {},
      timeout = 30000,
      responseType = "json",
    } = options;

    const xhr = new XMLHttpRequest();

    // ① Open connection:
    xhr.open(method, url, true); // true = async!

    // ② Set headers:
    Object.entries(headers).forEach(([key, value]) => {
      xhr.setRequestHeader(key, value);
    });
    if (data && typeof data === "object" && !(data instanceof FormData)) {
      xhr.setRequestHeader("Content-Type", "application/json");
    }

    // ③ Response type:
    xhr.responseType = responseType;
    xhr.timeout = timeout;

    // ④ Handlers:
    xhr.onload = function () {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({
          status: xhr.status,
          data: xhr.response,
          headers: xhr.getAllResponseHeaders(),
        });
      } else {
        reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
      }
    };

    xhr.onerror = () => reject(new Error("Network error"));
    xhr.ontimeout = () => reject(new Error("Request timeout"));

    // ⑤ Progress (upload/download):
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && options.onUploadProgress) {
        options.onUploadProgress((e.loaded / e.total) * 100);
      }
    };

    // ⑥ Send:
    const body =
      data && typeof data === "object" && !(data instanceof FormData)
        ? JSON.stringify(data)
        : data;
    xhr.send(body || null);
  });
}

// Sử dụng:
const res = await ajax({
  method: "POST",
  url: "/api/users",
  data: { name: "Alice" },
});

// ═══ ② Fetch API — Modern! ═══
const response = await fetch("/api/users", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name: "Alice" }),
  credentials: "include", // Gửi cookies cross-origin!
  signal: AbortController.signal, // Cancel!
});

// ⚠️ Fetch KHÔNG reject khi HTTP error (404, 500)!
if (!response.ok) throw new Error(`HTTP ${response.status}`);
const data = await response.json();

// Abort controller:
const controller = new AbortController();
setTimeout(() => controller.abort(), 5000); // Timeout 5s!
fetch(url, { signal: controller.signal }).catch((e) => {
  if (e.name === "AbortError") console.log("Cancelled!");
});

// ═══ Fetch vs XHR ═══
// ┌───────────────────┬──────────────┬──────────────┐
// │ Feature           │ XHR          │ Fetch        │
// ├───────────────────┼──────────────┼──────────────┤
// │ API               │ Callback     │ Promise!     │
// │ Error handling    │ reject mọi   │ Chỉ network  │
// │                   │ HTTP error   │ error reject!│
// │ Upload progress   │ ✅           │ ❌           │
// │ Abort             │ xhr.abort()  │ AbortController│
// │ Cookies           │ Auto send    │ credentials! │
// │ Stream response   │ ❌           │ ✅ ReadableStream│
// │ Service Worker    │ ❌           │ ✅           │
// └───────────────────┴──────────────┴──────────────┘

// ═══ ③ Axios (Third-party library) ═══
// → Promise-based, interceptors, cancel, transform, XSRF protection
axios.interceptors.request.use((config) => {
  config.headers.Authorization = `Bearer ${token}`;
  return config;
});

axios.interceptors.response.use(
  (res) => res.data,
  (err) => {
    if (err.response?.status === 401) redirectToLogin();
    return Promise.reject(err);
  },
);

// ═══ ④ navigator.sendBeacon — Gửi data khi trang closing! ═══
window.addEventListener("beforeunload", () => {
  navigator.sendBeacon(
    "/api/analytics",
    JSON.stringify({
      event: "page_leave",
      duration: Date.now() - startTime,
    }),
  );
  // → GUARANTEED delivery! Không block page close!
});
```

---

## §7. Same-Origin Policy & CORS

```
SAME-ORIGIN POLICY:
═══════════════════════════════════════════════════════════════

  ORIGIN = Protocol + Host + Port
  → https://example.com:443 ← ORIGIN

  SAME ORIGIN: protocol + host + port PHẢI GIỐNG!
  ┌────────────────────────────┬──────────┬─────────────┐
  │ URL                        │ Same?    │ Lý do       │
  ├────────────────────────────┼──────────┼─────────────┤
  │ https://a.com/page1        │ ✅       │ Chỉ khác path│
  │ https://a.com/page2        │          │             │
  │ http://a.com               │ ❌       │ Khác protocol│
  │ https://b.a.com            │ ❌       │ Khác host   │
  │ https://a.com:8080         │ ❌       │ Khác port   │
  └────────────────────────────┴──────────┴─────────────┘

  BỊ HẠN CHẾ:
  → AJAX/Fetch cross-origin → BLOCKED!
  → DOM access (iframe cross-origin) → BLOCKED!
  → Cookie/Storage cross-origin → BLOCKED!

  KHÔNG BỊ HẠN CHẾ:
  → <img src>, <script src>, <link href> → OK!
  → <form action> → OK (nhưng không đọc response!)
```

```javascript
// ═══ CÁCH 1: CORS (Cross-Origin Resource Sharing) — CHÍNH! ═══
// Server thêm headers cho phép cross-origin:

// Server response headers:
// Access-Control-Allow-Origin: https://frontend.com  (hoặc *)
// Access-Control-Allow-Methods: GET, POST, PUT
// Access-Control-Allow-Headers: Content-Type, Authorization
// Access-Control-Allow-Credentials: true  (cho cookies!)
// Access-Control-Max-Age: 86400  (cache preflight 24h!)

// SIMPLE REQUEST (không preflight):
// → GET/HEAD/POST + standard headers + standard content-type
// → Browser gửi TRỰC TIẾP + thêm Origin header!

// PREFLIGHT REQUEST (cần OPTIONS trước):
// → PUT, DELETE, PATCH, custom headers, application/json
// → Browser gửi OPTIONS trước → server trả CORS headers
// → OK? → Gửi request thật!

// OPTIONS /api/users HTTP/1.1
// Origin: https://frontend.com
// Access-Control-Request-Method: POST
// Access-Control-Request-Headers: Content-Type, Authorization

// ═══ CÁCH 2: JSONP — Hack dùng <script>! ═══
// → <script> KHÔNG bị same-origin policy!
// → Server trả: callback(data) → browser execute!

function jsonp(url, callbackName) {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    const fnName = callbackName || `jsonp_${Date.now()}`;

    window[fnName] = (data) => {
      resolve(data);
      delete window[fnName];
      document.head.removeChild(script);
    };

    script.src = `${url}?callback=${fnName}`;
    document.head.appendChild(script);
  });
}

// Server trả: jsonp_123456789({"name": "Alice", "age": 25})
const data = await jsonp("https://api.other.com/users/1");

// ⚠️ JSONP chỉ hỗ trợ GET! Không an toàn (XSS risk!)

// ═══ CÁCH 3: Proxy Server ═══
// → Frontend → Same-origin backend → Forward → API server!
// → Nginx proxy_pass, Node.js http-proxy, Vite proxy

// vite.config.js:
// server: {
//     proxy: {
//         '/api': {
//             target: 'https://real-api.com',
//             changeOrigin: true,
//         }
//     }
// }
// → fetch('/api/users') → proxy → https://real-api.com/api/users

// ═══ CÁCH 4: postMessage (cross-origin iframes!) ═══
// Parent → Iframe:
const iframe = document.getElementById("child");
iframe.contentWindow.postMessage(
  { type: "greeting", data: "Hello" },
  "https://child.com", // Target origin!
);

// Iframe nhận:
window.addEventListener("message", (e) => {
  if (e.origin !== "https://parent.com") return; // Verify origin!
  console.log(e.data);
});

// ═══ SO SÁNH CÁC PHƯƠNG PHÁP ═══
// ┌────────────────┬──────────┬──────────┬───────────────┐
// │ Method         │ Methods  │ Security │ Use case      │
// ├────────────────┼──────────┼──────────┼───────────────┤
// │ CORS           │ All      │ ✅ High │ API (primary!)│
// │ JSONP          │ GET only │ ❌ Low  │ Legacy APIs   │
// │ Proxy          │ All      │ ✅ High │ Dev/Prod      │
// │ postMessage    │ N/A      │ ✅ High │ iframes       │
// │ WebSocket      │ N/A      │ ✅ High │ Real-time     │
// │ document.domain│ N/A      │ ❌ Low  │ Deprecated!   │
// └────────────────┴──────────┴──────────┴───────────────┘
```

---

## §8. Browser Storage Mechanisms — So sánh

```
BROWSER STORAGE:
═══════════════════════════════════════════════════════════════

  ┌─────────────┬──────────┬─────────┬────────────┬─────────────┐
  │ Feature     │ Cookie   │ Local   │ Session    │ IndexedDB   │
  │             │          │ Storage │ Storage    │             │
  ├─────────────┼──────────┼─────────┼────────────┼─────────────┤
  │ Size        │ ~4KB     │ ~5-10MB │ ~5-10MB    │ >250MB!     │
  │ Lifetime    │ Expires  │ Manual  │ Tab close  │ Manual      │
  │             │ /MaxAge  │ delete  │            │ delete      │
  │ Scope       │ Domain+  │ Origin  │ Origin+    │ Origin      │
  │             │ Path     │         │ TAB only   │             │
  │ Sent to     │ ✅ Every │ ❌     │ ❌        │ ❌          │
  │ server?     │ request! │         │            │             │
  │ API         │ String   │ Sync    │ Sync       │ Async!      │
  │ Type        │ Key=Val  │ String  │ String     │ Structured  │
  │ Web Worker  │ ❌       │ ❌     │ ❌        │ ✅          │
  │ Indexed     │ ❌       │ ❌     │ ❌        │ ✅ Indexes! │
  └─────────────┴──────────┴─────────┴────────────┴─────────────┘
```

```javascript
// ═══ COOKIE ═══
document.cookie = "name=Alice; max-age=86400; path=/; secure; SameSite=Lax";
// ⚠️ Cookie gửi MỖI request → tốn bandwidth!
// ⚠️ HttpOnly cookie → JS KHÔNG ĐỌC ĐƯỢC (bảo mật!)

// Cookie flags:
// Secure     → chỉ gửi qua HTTPS!
// HttpOnly   → JS không truy cập! (chống XSS!)
// SameSite   → Strict/Lax/None (chống CSRF!)
// Path       → chỉ gửi cho path matching
// Domain     → domain + subdomains
// Max-Age    → giây sống (0 = xóa!)
// Expires    → ngày hết hạn

// ═══ localStorage / sessionStorage ═══
localStorage.setItem("user", JSON.stringify({ name: "Alice" }));
const user = JSON.parse(localStorage.getItem("user"));
localStorage.removeItem("user");
localStorage.clear();
localStorage.length;
localStorage.key(0); // Key tại index 0

// ⚠️ Sync! Blocking main thread!
// ⚠️ Chỉ lưu STRING! (JSON.stringify/parse!)
// ⚠️ Không có expiry! (phải tự implement!)

// Wrapper với expiry:
function setWithExpiry(key, value, ttlMs) {
  localStorage.setItem(
    key,
    JSON.stringify({
      value,
      expiry: Date.now() + ttlMs,
    }),
  );
}
function getWithExpiry(key) {
  const item = JSON.parse(localStorage.getItem(key));
  if (!item || Date.now() > item.expiry) {
    localStorage.removeItem(key);
    return null;
  }
  return item.value;
}

// ═══ KHI NÀO DÙNG GÌ ═══
// Cookies:    Auth tokens (HttpOnly!), user preferences nhỏ
// LocalStorage: Settings, cache data (persistent!)
// SessionStorage: Form data tạm, wizard steps, tab-specific state
// IndexedDB:  Large structured data, offline data, file caching
```

---

## §9. Cross-Tab Communication

```javascript
// ═══ CÁCH 1: BroadcastChannel (HIỆN ĐẠI!) ═══
// → API chuyên cho cross-tab communication!
// → Same-origin only! Simple API!

// Tab A:
const channel = new BroadcastChannel("app_channel");
channel.postMessage({ type: "LOGOUT", userId: 123 });

// Tab B:
const channel = new BroadcastChannel("app_channel");
channel.onmessage = (e) => {
  if (e.data.type === "LOGOUT") {
    console.log("User logged out in another tab!");
    redirectToLogin();
  }
};

channel.close(); // Cleanup!

// ═══ CÁCH 2: localStorage + storage event ═══
// → storage event BẮN ở CÁC TAB KHÁC (không phải tab hiện tại!)

// Tab A — Gửi:
localStorage.setItem(
  "message",
  JSON.stringify({
    type: "SYNC_CART",
    data: cartItems,
    timestamp: Date.now(), // Quan trọng! (trigger event cho cùng key!)
  }),
);

// Tab B — Nhận:
window.addEventListener("storage", (e) => {
  if (e.key === "message") {
    const message = JSON.parse(e.newValue);
    if (message.type === "SYNC_CART") {
      updateCart(message.data);
    }
  }
});

// ═══ CÁCH 3: SharedWorker ═══
// → 1 Worker CHIA SẺ giữa nhiều tabs!
// → Complex nhưng powerful!

// shared-worker.js:
const ports = [];
self.onconnect = (e) => {
  const port = e.ports[0];
  ports.push(port);

  port.onmessage = (e) => {
    // Broadcast cho TẤT CẢ tabs:
    ports.forEach((p) => {
      if (p !== port) p.postMessage(e.data);
    });
  };
};

// Tab A / Tab B:
const worker = new SharedWorker("shared-worker.js");
worker.port.start();
worker.port.postMessage({ type: "UPDATE", data: "hello" });
worker.port.onmessage = (e) => console.log("From other tab:", e.data);

// ═══ CÁCH 4: Service Worker + postMessage ═══
// → Intercept network + cross-tab communication!

// service-worker.js:
self.addEventListener("message", (e) => {
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      if (client.id !== e.source.id) {
        client.postMessage(e.data); // Gửi cho tabs KHÁC!
      }
    });
  });
});

// Tab:
navigator.serviceWorker.controller.postMessage({ type: "NOTIFY" });
navigator.serviceWorker.onmessage = (e) => console.log(e.data);

// ═══ SO SÁNH ═══
// ┌──────────────────┬──────────┬──────────┬────────────┐
// │ Method           │ Dễ dùng  │ Cross-   │ Browser    │
// │                  │          │ Origin?  │ Support    │
// ├──────────────────┼──────────┼──────────┼────────────┤
// │ BroadcastChannel │ ⭐⭐⭐⭐  │ ❌       │ Modern     │
// │ localStorage     │ ⭐⭐⭐   │ ❌       │ All!       │
// │ SharedWorker     │ ⭐⭐     │ ❌       │ Limited    │
// │ Service Worker   │ ⭐⭐     │ ❌       │ Modern     │
// │ postMessage      │ ⭐⭐⭐   │ ✅       │ All!       │
// │ (window.opener)  │          │          │            │
// └──────────────────┴──────────┴──────────┴────────────┘
```

---

## §10. Tổng kết & Checklist phỏng vấn

```
MIND MAP:
═══════════════════════════════════════════════════════════════

  Browser API
  ├── DOM: getElementById, querySelector, HTMLCollection(live!) vs NodeList(static!)
  │   ├── Manipulation: createElement, appendChild, remove, cloneNode
  │   └── getAttribute vs property: attribute=initial HTML, property=current JS
  ├── BOM: window, location, navigator, history, screen
  │   └── Feature detection > userAgent sniffing!
  ├── DOM Performance: DocumentFragment, avoid layout thrashing, rAF, debounce/throttle
  ├── Storage: Cookie(4KB,sent!), localStorage(5MB), sessionStorage(tab), IndexedDB(250MB+)
  ├── Events: Capturing→Target→Bubbling, delegation(parent listener + e.target.closest)
  ├── Network: XHR(callback,progress), Fetch(promise,no reject on 4xx), Axios(interceptors)
  ├── Same-Origin: protocol+host+port, CORS(primary!), JSONP(GET only), Proxy, postMessage
  └── Cross-Tab: BroadcastChannel, localStorage+storage event, SharedWorker, ServiceWorker
```

### Checklist

- [ ] **DOM selection**: getElementById, querySelector(All), getElementsBy\*(live!) vs querySelectorAll(static!)
- [ ] **HTMLCollection vs NodeList**: HTMLCollection=live+auto update, NodeList(qSA)=static snapshot
- [ ] **DOM manipulation**: DocumentFragment batch, cloneNode(true) deep copy, before/after/prepend/append modern API
- [ ] **Attribute vs Property**: attribute = HTML initial value (string), property = JS current value (typed)
- [ ] **BOM location**: href, origin, search/hash, assign(history+) vs replace(no history), URLSearchParams
- [ ] **BOM history**: pushState/replaceState (SPA routing!), popstate event (Back/Forward!)
- [ ] **DOM performance**: DocumentFragment/innerHTML batch, avoid forced sync layout (read→write interleave), rAF animate
- [ ] **Debounce vs Throttle**: debounce = chờ ngừng (search input), throttle = tối đa N lần/giây (scroll)
- [ ] **IndexedDB**: async, structured data, transactions, indexes, hàng trăm MB, dùng cho offline/large data
- [ ] **Event flow**: Capturing (↓) → Target → Bubbling (↑); addEventListener 3rd arg = capture boolean/options
- [ ] **Event delegation**: 1 listener ở parent, e.target.closest('.selector'), ✅ dynamic elements, ✅ less memory
- [ ] **Events không bubble**: focus/blur (→ focusin/focusout), mouseenter/mouseleave (→ mouseover/mouseout), load, scroll
- [ ] **XHR handwritten**: new XMLHttpRequest → open → setRequestHeader → onload/onerror → send; readyState 0-4
- [ ] **Fetch vs XHR**: Fetch = Promise + no reject HTTP errors + AbortController; XHR = upload progress + auto cookies
- [ ] **Same-Origin**: protocol + host + port; script/img/link KHÔNG bị chặn, AJAX/fetch BỊ chặn
- [ ] **CORS**: server headers (Access-Control-Allow-\*); Simple request (GET/POST/HEAD) vs Preflight (OPTIONS)
- [ ] **JSONP**: `<script src>` trick, GET only, XSS risk, callback function trên window
- [ ] **Cookie flags**: Secure (HTTPS), HttpOnly (no JS!), SameSite (CSRF), Max-Age/Expires, Path/Domain
- [ ] **LocalStorage**: 5-10MB, persistent, sync, string only, cần JSON.stringify/parse, không có expiry
- [ ] **Cross-Tab**: BroadcastChannel (simple!), localStorage storage event (oldest, all browsers), SharedWorker, ServiceWorker

---

_Nguồn: ConardLi — "Browser API" · Juejin_
_Cập nhật lần cuối: Tháng 2, 2026_
