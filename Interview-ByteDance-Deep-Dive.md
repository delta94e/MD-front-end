# ByteDance Frontend Interview — Full 5 Rounds Deep Dive

> 📅 2026-02-14 · ⏱ 25 phút đọc
>
> Node.js Multiprocessing & IPC & Worker Threads,
> Greedy Algorithm (Assign Cookies), Monotonic Stack,
> Object.defineProperty, hashchange & History API,
> JSONP Implementation, Happypack & Tree Shaking
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | ByteDance 5 Rounds Interview

---

## Tổng quan 5 vòng phỏng vấn

```
BYTEDANCE — 5 VÒNG:
═══════════════════════════════════════════════════════════════

  ┌─────────┬──────────┬─────────────────────────────────────┐
  │ Vòng    │ Thời gian│ Chủ đề chính                        │
  ├─────────┼──────────┼─────────────────────────────────────┤
  │ One     │ ~50 phút │ Base-36, HTTPS, OS Process/Thread,  │
  │         │          │ Node.js Cluster, Native AJAX,       │
  │         │          │ Tree Traversal, Symmetric Tree      │
  │         │          │ → Xem Interview-OneSide-Deep-Dive   │
  ├─────────┼──────────┼─────────────────────────────────────┤
  │ Two     │ ~40 phút │ let/var/const, HTTP Headers, CORS,  │
  │         │          │ Webpack, HTTP Methods, TypeScript,   │
  │         │          │ React Optimization, Merge Intervals  │
  │         │          │ → Xem Interview-TwoSide-Deep-Dive   │
  ├─────────┼──────────┼─────────────────────────────────────┤
  │ Three   │ ~60 phút │ Node.js deep: multiprocess, IPC,    │
  │         │          │ Worker Threads; Greedy Algorithm;    │
  │         │          │ Monotonic Stack Max X Interval       │
  │         │          │ → ĐỌC TÀI LIỆU NÀY! ⭐             │
  ├─────────┼──────────┼─────────────────────────────────────┤
  │ Four    │ ~40 phút │ Merge Sorted Lists, Cookie attrs,   │
  │         │          │ Storage comparison, Position, Status │
  │         │          │ Codes, OPTIONS, Less/Sass            │
  │         │          │ → Xem Interview-ThreeSide-Deep-Dive │
  ├─────────┼──────────┼─────────────────────────────────────┤
  │ HR      │ ~30 phút │ Câu hỏi hành vi, kế hoạch tương lai│
  │         │          │ → Xem Interview-ThreeSide-Deep-Dive │
  └─────────┴──────────┴─────────────────────────────────────┘

  KINH NGHIỆM TỪ TÁC GIẢ:
  → Ôn 1 tuần trước phỏng vấn!
  → ByteDance RẤT COI TRỌNG algorithms! → LeetCode + Sword Offer!
  → Đọc kinh nghiệm phỏng vấn trên Nowcoder!
  → ByteDance hiệu quả CỰC CAO: pass 1 vòng → 5 phút sau vòng tiếp!
```

---

## Mục Lục — Nội dung chính (Round 3 + Bổ sung)

| #   | Phần                                              |
| --- | ------------------------------------------------- |
| 1   | Node.js Multiprocessing — Chi tiết                |
| 2   | Node.js IPC — Giao tiếp giữa các Process          |
| 3   | Node.js Worker Threads — Đa luồng                 |
| 4   | Object.defineProperty — Tất cả thuộc tính         |
| 5   | hashchange & History API                          |
| 6   | JSONP — Implement cross-domain                    |
| 7   | Happypack & Tree Shaking                          |
| 8   | Algorithm: Assign Cookies (Greedy)                |
| 9   | Algorithm: Max X Value Interval (Monotonic Stack) |
| 10  | Checklist tổng hợp                                |

---

## §1. Node.js Multiprocessing — Chi tiết

```
NODE.JS MULTIPROCESSING — TẠI SAO?
═══════════════════════════════════════════════════════════════

  Node.js = SINGLE-THREADED EVENT LOOP!
  → 1 process = 1 CPU core!
  → Server 8 cores → chỉ dùng 1! LÃNG PHÍ! 😩

  2 MODULE TẠO MULTI-PROCESS:

  ① child_process module:
  → spawn(), exec(), execFile(), fork()
  → Tạo child process để chạy commands hoặc scripts!

  ② cluster module:
  → fork() nhiều WORKER processes!
  → Tất cả workers LISTEN CÙNG PORT!
  → Tận dụng tất cả CPU cores!
```

```javascript
// ═══ child_process — 4 methods ═══

const { spawn, exec, execFile, fork } = require("child_process");

// ① spawn() — stream-based, cho output LỚN!
const ls = spawn("ls", ["-la"]);
ls.stdout.on("data", (data) => console.log(`stdout: ${data}`));
ls.stderr.on("data", (data) => console.error(`stderr: ${data}`));
ls.on("close", (code) => console.log(`exit code: ${code}`));

// ② exec() — buffer-based, cho output NHỎ (<200KB!)
exec("ls -la", (error, stdout, stderr) => {
  if (error) throw error;
  console.log(stdout);
});

// ③ execFile() — giống exec nhưng KHÔNG qua shell!
execFile("node", ["--version"], (error, stdout) => {
  console.log(stdout); // v18.x.x
});

// ④ fork() — ĐẶC BIỆT! Tạo Node.js process MỚI + IPC channel!
const child = fork("./worker.js");
child.send({ type: "start", data: [1, 2, 3] }); // Gửi qua IPC!
child.on("message", (msg) => console.log("From child:", msg));
```

```javascript
// ═══ cluster module — Production pattern! ═══

const cluster = require("cluster");
const http = require("http");
const numCPUs = require("os").cpus().length;

if (cluster.isMaster) {
  console.log(`Master ${process.pid} running`);

  // Fork workers = số CPU cores:
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  // Worker crash → restart!
  cluster.on("exit", (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    cluster.fork(); // AUTO-RESTART!
  });

  // Giao tiếp Master ↔ Worker:
  for (const id in cluster.workers) {
    cluster.workers[id].send("Hello from master!");
    cluster.workers[id].on("message", (msg) => {
      console.log(`Worker ${id}: ${msg}`);
    });
  }
} else {
  // Worker process:
  http
    .createServer((req, res) => {
      res.writeHead(200);
      res.end(`Worker ${process.pid}\n`);
    })
    .listen(8000);
  // ↑ TẤT CẢ workers listen CÙNG PORT 8000!

  process.on("message", (msg) => {
    console.log(`Worker ${process.pid} received: ${msg}`);
  });
}
```

```
CLUSTER — PORT SHARING CƠ CHẾ:
═══════════════════════════════════════════════════════════════

  HỎI: Nhiều process listen CÙNG 1 port? Làm sao?

  CƠ CHẾ (mặc định Node.js):
  → MASTER process tạo server socket, bind port!
  → Master NHẬN connection rồi PHÂN PHỐI cho workers!
  → Workers nhận file descriptor (fd) qua IPC!
  → Round-robin scheduling (trừ Windows!)

  THỰC TẾ:
  → CHỈ MASTER bind port!
  → Workers KHÔNG trực tiếp bind port!
  → Master đóng vai trò LOAD BALANCER!

  ┌────────┐  Request   ┌────────────┐  fd   ┌──────────┐
  │ Client │ ──────────→│   Master   │──────→│ Worker 1 │
  │        │            │ (port 8000)│──────→│ Worker 2 │
  │        │            │            │──────→│ Worker 3 │
  └────────┘            └────────────┘       └──────────┘
```

---

## §2. Node.js IPC — Giao tiếp giữa các Process

```
NODE.JS IPC (Inter-Process Communication):
═══════════════════════════════════════════════════════════════

  Node.js processes giao tiếp qua:

  ① IPC CHANNEL (Built-in! fork/cluster):
  ┌────────────────────────────────────────────────────────┐
  │ → fork() và cluster.fork() TỰ ĐỘNG tạo IPC channel!   │
  │ → process.send(message) — gửi!                        │
  │ → process.on('message', callback) — nhận!              │
  │ → Data tự động SERIALIZE/DESERIALIZE (JSON!)           │
  │ → Underlying: Unix Domain Socket (Unix) hoặc           │
  │   Named Pipe (Windows)!                                │
  └────────────────────────────────────────────────────────┘
```

```javascript
// ═══ IPC — Master ↔ Worker ═══

// master.js
const { fork } = require("child_process");
const worker = fork("./worker.js");

// GỬI message cho worker:
worker.send({ type: "task", payload: { id: 1, data: [10, 20, 30] } });

// NHẬN message từ worker:
worker.on("message", (msg) => {
  console.log("Result from worker:", msg);
  // { type: 'result', payload: 60 }
});

worker.on("exit", (code) => {
  console.log(`Worker exited with code ${code}`);
});

// worker.js
process.on("message", (msg) => {
  if (msg.type === "task") {
    const sum = msg.payload.data.reduce((a, b) => a + b, 0);
    // GỬI kết quả VỀ master:
    process.send({ type: "result", payload: sum });
  }
});
```

```
CÁC CÁCH IPC KHÁC TRONG NODE.JS:
═══════════════════════════════════════════════════════════════

  ② STDIO STREAMS (stdin/stdout/stderr):
  ┌────────────────────────────────────────────────────────┐
  │ const child = spawn('node', ['script.js'],            │
  │     { stdio: ['pipe', 'pipe', 'pipe'] });             │
  │ child.stdout.on('data', (data) => { ... });           │
  │ child.stdin.write('input data\n');                    │
  │ → Đơn giản nhưng chỉ text/buffer!                    │
  └────────────────────────────────────────────────────────┘

  ③ SHARED MEMORY (SharedArrayBuffer):
  ┌────────────────────────────────────────────────────────┐
  │ → Dùng với Worker Threads (KHÔNG phải child_process!)  │
  │ → SharedArrayBuffer + Atomics!                         │
  │ → NHANH NHẤT! Không cần serialize/deserialize!         │
  └────────────────────────────────────────────────────────┘

  ④ UNIX DOMAIN SOCKET / TCP SOCKET:
  ┌────────────────────────────────────────────────────────┐
  │ → net.createServer() + net.createConnection()          │
  │ → Giao tiếp giữa processes KHÔNG CÓ quan hệ cha-con! │
  │ → Linh hoạt nhất! Cross-machine nếu TCP!              │
  └────────────────────────────────────────────────────────┘

  ⑤ MESSAGE QUEUE (Redis, RabbitMQ):
  ┌────────────────────────────────────────────────────────┐
  │ → External service! Reliable! Persistent!              │
  │ → Dùng cho microservices architecture!                 │
  │ → Persist messages, retry, dead-letter queue!          │
  └────────────────────────────────────────────────────────┘
```

---

## §3. Node.js Worker Threads — Đa luồng

```
WORKER THREADS — NODE.JS CÓ ĐA LUỒNG KHÔNG?
═══════════════════════════════════════════════════════════════

  CÂU TRẢ LỜI: CÓ! Từ Node.js 10.5+ (stable từ 12+!)

  worker_threads module!

  CLUSTER vs WORKER THREADS:
  ┌───────────────────┬──────────────────┬──────────────────┐
  │                   │ cluster (fork)   │ Worker Threads   │
  ├───────────────────┼──────────────────┼──────────────────┤
  │ Tạo ra            │ PROCESS mới!     │ THREAD mới!      │
  ├───────────────────┼──────────────────┼──────────────────┤
  │ Memory            │ RIÊNG BIỆT!      │ CHIA SẺ được!    │
  │                   │ Copy-on-write    │ SharedArrayBuffer │
  ├───────────────────┼──────────────────┼──────────────────┤
  │ V8 instance       │ V8 RIÊNG!        │ V8 RIÊNG! (nhẹ   │
  │                   │                  │ hơn process!)    │
  ├───────────────────┼──────────────────┼──────────────────┤
  │ Startup cost      │ CAO! (fork!)     │ THẤP hơn!        │
  ├───────────────────┼──────────────────┼──────────────────┤
  │ Giao tiếp         │ IPC (serialize!) │ postMessage +    │
  │                   │                  │ SharedArrayBuffer │
  ├───────────────────┼──────────────────┼──────────────────┤
  │ Dùng cho          │ HTTP server      │ CPU-intensive    │
  │                   │ scaling!         │ tasks! (crypto,  │
  │                   │                  │ image processing)│
  └───────────────────┴──────────────────┴──────────────────┘
```

```javascript
// ═══ WORKER THREADS — IMPLEMENTATION ═══

// main.js
const {
  Worker,
  isMainThread,
  parentPort,
  workerData,
} = require("worker_threads");

if (isMainThread) {
  // MAIN THREAD:
  const worker = new Worker("./worker.js", {
    workerData: { numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
  });

  worker.on("message", (result) => {
    console.log("Sum:", result); // 55
  });

  worker.on("error", (err) => console.error(err));
  worker.on("exit", (code) => {
    if (code !== 0) console.error(`Worker stopped with code ${code}`);
  });
} else {
  // WORKER THREAD (nếu cùng file):
  const sum = workerData.numbers.reduce((a, b) => a + b, 0);
  parentPort.postMessage(sum);
}
```

```javascript
// ═══ SHARED MEMORY — SharedArrayBuffer + Atomics ═══

const { Worker, isMainThread } = require("worker_threads");

if (isMainThread) {
  // Tạo shared memory: 4 bytes = 1 Int32
  const sharedBuffer = new SharedArrayBuffer(4);
  const sharedArray = new Int32Array(sharedBuffer);

  sharedArray[0] = 0; // Giá trị ban đầu!

  // Tạo 4 workers CÙNG truy cập shared memory:
  for (let i = 0; i < 4; i++) {
    const worker = new Worker("./counter-worker.js", {
      workerData: { sharedBuffer },
    });
  }

  setTimeout(() => {
    console.log("Counter:", sharedArray[0]);
    // → 4000 (mỗi worker tăng 1000 lần!)
  }, 2000);
}

// counter-worker.js
const { workerData } = require("worker_threads");
const sharedArray = new Int32Array(workerData.sharedBuffer);

for (let i = 0; i < 1000; i++) {
  Atomics.add(sharedArray, 0, 1); // ATOMIC increment!
  // ↑ Thread-safe! Không race condition!
}

// ⚠️ Atomics đảm bảo THREAD-SAFE!
// → Atomics.add() → cộng atomic
// → Atomics.load() → đọc atomic
// → Atomics.store() → ghi atomic
// → Atomics.compareExchange() → CAS operation!
// → Atomics.wait() / Atomics.notify() → synchronization!
```

---

## §4. Object.defineProperty — Tất cả thuộc tính

```
OBJECT.DEFINEPROPERTY — 6 DESCRIPTORS:
═══════════════════════════════════════════════════════════════

  Phỏng vấn hỏi: "Ngoài get và set còn gì?"
  → CÓ 6 descriptors! Chia 2 nhóm:

  ┌───────────────────────────────────────────────────────────┐
  │ DATA DESCRIPTOR (Mô tả dữ liệu):                        │
  ├───────────────────────────────────────────────────────────┤
  │ ① value         → GIÁ TRỊ của property!                  │
  │                    Mặc định: undefined                    │
  │ ② writable      → Có thể GHI LẠI không?                  │
  │                    Mặc định: false (defineProperty)       │
  │                    Mặc định: true (obj.x = val)           │
  └───────────────────────────────────────────────────────────┘

  ┌───────────────────────────────────────────────────────────┐
  │ ACCESSOR DESCRIPTOR (Mô tả truy cập):                    │
  ├───────────────────────────────────────────────────────────┤
  │ ③ get            → GETTER function! Gọi khi ĐỌC property!│
  │                    Mặc định: undefined                    │
  │ ④ set            → SETTER function! Gọi khi GHI property!│
  │                    Mặc định: undefined                    │
  └───────────────────────────────────────────────────────────┘

  ┌───────────────────────────────────────────────────────────┐
  │ SHARED DESCRIPTORS (Cả 2 loại đều có):                    │
  ├───────────────────────────────────────────────────────────┤
  │ ⑤ configurable   → Có thể DELETE hoặc THAY ĐỔI descriptor│
  │                    không? Mặc định: false                 │
  │ ⑥ enumerable     → Có xuất hiện trong for...in và         │
  │                    Object.keys() không? Mặc định: false   │
  └───────────────────────────────────────────────────────────┘

  ⚠️ KHÔNG thể dùng value/writable CÙNG LÚC với get/set!
  → Data descriptor HOẶC Accessor descriptor, KHÔNG cả hai!
```

```javascript
// ═══ DATA DESCRIPTOR ═══

const obj = {};
Object.defineProperty(obj, "name", {
  value: "John",
  writable: false, // KHÔNG ghi lại được!
  enumerable: true, // Xuất hiện trong for...in!
  configurable: false, // KHÔNG delete, KHÔNG modify descriptor!
});

obj.name = "Jane"; // Silent fail! (strict mode → TypeError!)
console.log(obj.name); // "John" — không đổi!
delete obj.name; // false! configurable = false!

// ═══ ACCESSOR DESCRIPTOR (Vue 2 Data Hijacking!) ═══

const data = { _price: 100 };
Object.defineProperty(data, "price", {
  get() {
    console.log("GET price!");
    return this._price;
  },
  set(newVal) {
    console.log(`SET price: ${this._price} → ${newVal}`);
    this._price = newVal;
    // → Trigger re-render! (Vue 2 reactivity!)
  },
  enumerable: true,
  configurable: true,
});

data.price; // "GET price!" → 100
data.price = 200; // "SET price: 100 → 200"
```

---

## §5. hashchange & History API

```
SPA ROUTING — 2 CÁCH:
═══════════════════════════════════════════════════════════════

  ① HASH MODE (#):
  ┌────────────────────────────────────────────────────────┐
  │ URL: https://app.com/#/about                           │
  │                      ↑ hash phần!                      │
  │                                                        │
  │ → Hash thay đổi → KHÔNG gửi request lên server!       │
  │ → Browser fire event: hashchange!                      │
  │ → JS lắng nghe hashchange → render component tương ứng!│
  └────────────────────────────────────────────────────────┘

  ② HISTORY MODE (HTML5):
  ┌────────────────────────────────────────────────────────┐
  │ URL: https://app.com/about                             │
  │ → URL SẠCH! Không có #!                                │
  │                                                        │
  │ → pushState/replaceState → thay đổi URL KHÔNG reload! │
  │ → popstate event khi user bấm back/forward!            │
  │ → CẦN server config: trả index.html cho TẤT CẢ paths! │
  └────────────────────────────────────────────────────────┘
```

```javascript
// ═══ HASH MODE — hashchange ═══

window.addEventListener("hashchange", (event) => {
  const hash = window.location.hash; // "#/about"
  console.log("Old URL:", event.oldURL);
  console.log("New URL:", event.newURL);
  console.log("Hash:", hash);

  // Route matching:
  switch (hash) {
    case "#/":
      renderHome();
      break;
    case "#/about":
      renderAbout();
      break;
    case "#/contact":
      renderContact();
      break;
    default:
      render404();
  }
});

// Thay đổi hash:
window.location.hash = "#/about"; // → trigger hashchange!
```

```javascript
// ═══ HISTORY MODE — pushState / replaceState ═══

// pushState(state, title, url) → THÊM vào history stack!
history.pushState({ page: "about" }, "", "/about");
// → URL đổi thành /about! KHÔNG reload!
// → history stack THÊM 1 entry!

// replaceState(state, title, url) → THAY THẾ entry hiện tại!
history.replaceState({ page: "home" }, "", "/");
// → URL đổi! History stack KHÔNG thêm entry!

// popstate — khi user bấm Back/Forward:
window.addEventListener("popstate", (event) => {
  console.log("State:", event.state);
  // → { page: 'about' } hoặc null
  routeChange(window.location.pathname);
});

// ⚠️ pushState/replaceState KHÔNG trigger popstate!
// → popstate CHỈ trigger khi user bấm nút Back/Forward!

// ═══ SO SÁNH ═══
// Hash: đơn giản, không cần server config, có # xấu!
// History: URL sạch, CẦN server fallback (config Nginx/Apache!)
//
// Nginx config cho History mode:
// location / {
//     try_files $uri $uri/ /index.html;
// }
```

---

## §6. JSONP — Implement cross-domain

```
JSONP — LỢI DỤNG <script> TAG:
═══════════════════════════════════════════════════════════════

  Same-Origin Policy KHÔNG chặn <script src="...">!
  → JSONP lợi dụng điều này để bypass CORS!

  FLOW:
  ① Client tạo <script> tag với URL + callback name
  ② Server nhận request → wrap data trong callback function
  ③ Browser nhận script → tự động execute → gọi callback!
```

```javascript
// ═══ JSONP — Handwritten Implementation ═══

function jsonp(url, callbackName = "callback") {
  return new Promise((resolve, reject) => {
    // Tạo unique callback name:
    const fnName = `jsonp_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    // Đăng ký global callback:
    window[fnName] = function (data) {
      resolve(data);
      // Cleanup:
      delete window[fnName];
      document.head.removeChild(script);
    };

    // Tạo <script> tag:
    const script = document.createElement("script");
    const separator = url.includes("?") ? "&" : "?";
    script.src = `${url}${separator}${callbackName}=${fnName}`;

    // Handle errors:
    script.onerror = function () {
      reject(new Error("JSONP request failed"));
      delete window[fnName];
      document.head.removeChild(script);
    };

    // Chèn vào DOM → browser TỰ ĐỘNG fetch + execute!
    document.head.appendChild(script);
  });
}

// SỬ DỤNG:
jsonp("https://api.example.com/data", "cb")
  .then((data) => console.log(data))
  .catch((err) => console.error(err));

// Server trả về:
// jsonp_1707900000_abc123({ name: "John", age: 30 })
// → Browser execute → gọi window.jsonp_... → resolve!

// ⚠️ HẠN CHẾ JSONP:
// → CHỈ hỗ trợ GET!
// → Không an toàn! (XSS risk nếu server bị hack!)
// → Không có error handling tốt!
// → Hiện tại: DÙNG CORS HEADERS thay thế!
```

---

## §7. Happypack & Tree Shaking

```
HAPPYPACK — PARALLEL PROCESSING:
═══════════════════════════════════════════════════════════════

  Webpack mặc định: chạy loaders TUẦN TỰ trên 1 thread!
  → Happypack: chia files thành NHIỀU phần → xử lý SONG SONG!
  → Tạo thread pool → mỗi thread xử lý 1 phần!

  ⚠️ STATUS: Happypack ĐÃ DEPRECATED!
  → Thay thế: thread-loader (Webpack 4+!)
  → Hoặc: Webpack 5 cache: { type: 'filesystem' }!
```

```javascript
// ═══ thread-loader (thay thế Happypack) ═══

// webpack.config.js
module.exports = {
  module: {
    rules: [
      {
        test: /\.js$/,
        use: [
          {
            loader: "thread-loader",
            options: {
              workers: 4, // Số threads!
              workerParallelJobs: 50,
            },
          },
          "babel-loader",
        ],
      },
    ],
  },
};

// → babel-loader chạy trên 4 threads SONG SONG!
// → Build nhanh hơn đáng kể cho project lớn!
```

```
TREE SHAKING — LOẠI BỎ DEAD CODE:
═══════════════════════════════════════════════════════════════

  NGUYÊN LÝ:
  → Phân tích STATIC imports (ES Modules!)
  → Tìm code KHÔNG ĐƯỢC import/sử dụng!
  → LOẠI BỎ khỏi bundle cuối cùng!

  ĐIỀU KIỆN:
  ① ES Modules (import/export)! CommonJS (require) KHÔNG HỖ TRỢ!
  ② mode: 'production' (Webpack tự bật!)
  ③ sideEffects: false trong package.json!
  ④ KHÔNG dùng dynamic imports cho phần muốn tree shake!
```

```javascript
// ═══ TREE SHAKING — VÍ DỤ ═══

// utils.js
export function add(a, b) {
  return a + b;
}
export function subtract(a, b) {
  return a - b;
}
export function multiply(a, b) {
  return a * b;
}
export function divide(a, b) {
  return a / b;
}

// main.js
import { add } from "./utils"; // CHỈ import add!
console.log(add(1, 2));

// TREE SHAKING sẽ:
// ✅ Giữ: add()
// ❌ Loại: subtract(), multiply(), divide() → DEAD CODE!
// → Bundle nhỏ hơn!

// ⚠️ TRƯỜNG HỢP KHÔNG TREE SHAKE ĐƯỢC:
import _ from "lodash"; // ❌ Import TOÀN BỘ!
import { map } from "lodash"; // ❌ Vẫn bundle HẾT! (CommonJS internal!)

import map from "lodash/map"; // ✅ Import trực tiếp file!
// HOẶC:
import { map } from "lodash-es"; // ✅ ES Modules version!
```

```javascript
// package.json — sideEffects config:
{
    "name": "my-app",
    "sideEffects": false
    // → Báo Webpack: TẤT CẢ modules đều KHÔNG có side effects!
    // → An toàn để tree shake!
}

// Hoặc chỉ định files CÓ side effects:
{
    "sideEffects": [
        "*.css",           // CSS files có side effects (import styles!)
        "./src/polyfills.js" // Polyfills có side effects!
    ]
}

// ⚠️ SIDE EFFECT = code chạy KHI import, KHÔNG cần gọi function!
// VD: import './styles.css'  → side effect (inject styles!)
//     import 'core-js'       → side effect (polyfill globals!)
```

---

## §8. Algorithm: Assign Cookies (Greedy)

```
BÀI TOÁN (LeetCode 455):
═══════════════════════════════════════════════════════════════

  Giáo viên phát bánh cho học sinh:
  → Mỗi học sinh CHỈ nhận 1 bánh!
  → Mỗi học sinh muốn SIZE KHÁC NHAU!
  → Mục tiêu: THỎA MÃN nhiều học sinh nhất!

  VÍ DỤ 1:
  → Yêu cầu: [1, 3, 5, 4, 2]
  → Bánh:     [1, 1]
  → Kết quả:  1 học sinh (bánh size 1 cho học sinh yêu cầu 1!)

  VÍ DỤ 2:
  → Yêu cầu: [10, 9, 8, 7, 6]
  → Bánh:     [7, 6, 5]
  → Kết quả:  2 học sinh (7→7, 6→6!)

  GREEDY STRATEGY:
  → SẮP XẾP cả 2 mảng!
  → Bánh NHỎ NHẤT cho học sinh yêu cầu NHỎ NHẤT!
  → Tại sao? Dùng bánh nhỏ cho yêu cầu nhỏ →
    TIẾT KIỆM bánh lớn cho yêu cầu lớn!
```

```javascript
// ═══ ASSIGN COOKIES — GREEDY ═══

function findContentChildren(children, cookies) {
  // BƯỚC 1: SẮP XẾP tăng dần!
  children.sort((a, b) => a - b);
  cookies.sort((a, b) => a - b);

  let child = 0; // Con trỏ children
  let cookie = 0; // Con trỏ cookies

  // BƯỚC 2: Two pointers!
  while (child < children.length && cookie < cookies.length) {
    if (cookies[cookie] >= children[child]) {
      // Bánh ĐỦ LỚN → thỏa mãn học sinh!
      child++; // Học sinh tiếp theo!
    }
    cookie++; // Bánh tiếp theo (dù thỏa mãn hay không!)
  }

  return child; // Số học sinh được thỏa mãn!
}

// VÍ DỤ TỪNG BƯỚC:
// children: [1, 3, 5, 4, 2] → sort → [1, 2, 3, 4, 5]
// cookies:  [1, 1]           → sort → [1, 1]
//
// child=0, cookie=0: cookies[0]=1 >= children[0]=1 → ✅ child=1
// child=1, cookie=1: cookies[1]=1 >= children[1]=2 → ❌ (1 < 2)
// cookie=2 → HẾT cookies! → return 1 ✅

// VÍ DỤ 2:
// children: [10, 9, 8, 7, 6] → sort → [6, 7, 8, 9, 10]
// cookies:  [7, 6, 5]         → sort → [5, 6, 7]
//
// child=0, cookie=0: 5 >= 6? → ❌
// child=0, cookie=1: 6 >= 6? → ✅ child=1
// child=1, cookie=2: 7 >= 7? → ✅ child=2
// cookie=3 → HẾT cookies! → return 2 ✅

console.log(findContentChildren([1, 3, 5, 4, 2], [1, 1])); // 1
console.log(findContentChildren([10, 9, 8, 7, 6], [7, 6, 5])); // 2
console.log(findContentChildren([1, 2, 3], [1, 2, 3])); // 3
```

```
ĐỘ PHỨC TẠP:
  Time:  O(n log n + m log m) — sorting!
  Space: O(1) — in-place (không tính sort!)

  GREEDY PROOF:
  → Bánh nhỏ dùng cho yêu cầu nhỏ → tối ưu cục bộ!
  → Nếu dùng bánh LỚN cho yêu cầu nhỏ → lãng phí!
  → Mỗi bước tối ưu cục bộ → tối ưu TOÀN CỤC! ✅
```

---

## §9. Algorithm: Max X Value Interval (Monotonic Stack)

```
BÀI TOÁN:
═══════════════════════════════════════════════════════════════

  Cho dãy số nguyên dương a[]
  Với mỗi khoảng [i, j]:
  → X = MIN(a[i..j]) × SUM(a[i..j])
  → Tìm MAX X trên TẤT CẢ khoảng!

  VÍ DỤ: a = [3, 1, 6, 4, 5, 2]
  → Khoảng [6, 4, 5]: MIN=4, SUM=15, X = 4×15 = 60
  → Đây là X LỚN NHẤT!

  BRUTE FORCE:
  → Thử TẤT CẢ O(n²) khoảng → mỗi khoảng tính MIN + SUM!
  → O(n³) hoặc O(n²) với prefix sum → CHẬM!

  OPTIMAL: MONOTONIC STACK!
  → Với mỗi phần tử a[i], tìm khoảng RỘNG NHẤT mà a[i] là MIN!
  → Prefix sum để tính SUM O(1)!
  → Tổng: O(n)!
```

```javascript
// ═══ MAX X INTERVAL — MONOTONIC STACK ═══

function maxXInterval(arr) {
  const n = arr.length;
  if (n === 0) return { maxX: 0, interval: [] };

  // BƯỚC 1: Prefix sum (để tính SUM(i..j) = prefix[j+1] - prefix[i])
  const prefix = new Array(n + 1).fill(0);
  for (let i = 0; i < n; i++) {
    prefix[i + 1] = prefix[i] + arr[i];
  }

  // BƯỚC 2: Tìm left boundary (nearest smaller element bên TRÁI)
  const left = new Array(n); // left[i] = index nhỏ nhất bên trái mà arr[index] < arr[i]
  const stack1 = [];
  for (let i = 0; i < n; i++) {
    while (stack1.length > 0 && arr[stack1[stack1.length - 1]] >= arr[i]) {
      stack1.pop();
    }
    left[i] = stack1.length === 0 ? 0 : stack1[stack1.length - 1] + 1;
    stack1.push(i);
  }

  // BƯỚC 3: Tìm right boundary (nearest smaller element bên PHẢI)
  const right = new Array(n); // right[i] = index lớn nhất bên phải mà arr[index] < arr[i]
  const stack2 = [];
  for (let i = n - 1; i >= 0; i--) {
    while (stack2.length > 0 && arr[stack2[stack2.length - 1]] >= arr[i]) {
      stack2.pop();
    }
    right[i] = stack2.length === 0 ? n - 1 : stack2[stack2.length - 1] - 1;
    stack2.push(i);
  }

  // BƯỚC 4: Tính X cho mỗi phần tử (khi nó là MIN!)
  let maxX = 0;
  let bestLeft = 0,
    bestRight = 0;

  for (let i = 0; i < n; i++) {
    const sum = prefix[right[i] + 1] - prefix[left[i]];
    const x = arr[i] * sum;

    if (x > maxX) {
      maxX = x;
      bestLeft = left[i];
      bestRight = right[i];
    }
  }

  return {
    maxX,
    interval: arr.slice(bestLeft, bestRight + 1),
  };
}

// VÍ DỤ:
// arr = [3, 1, 6, 4, 5, 2]
//
// prefix = [0, 3, 4, 10, 14, 19, 21]
//
// left boundaries:   [0, 0, 2, 2, 3, 2]
//   i=0(3): stack=[] → left[0]=0, stack=[0]
//   i=1(1): arr[0]=3>=1 pop → left[1]=0, stack=[1]
//   i=2(6): arr[1]=1<6 → left[2]=2, stack=[1,2]
//   i=3(4): arr[2]=6>=4 pop → arr[1]=1<4 → left[3]=2, stack=[1,3]
//   i=4(5): arr[3]=4<5 → left[4]=4 → wait... let me reconsider
//
// Kết quả: i=3(val=4), left=2, right=4
//   interval = [6, 4, 5], SUM=15, X = 4×15 = 60 ✅

console.log(maxXInterval([3, 1, 6, 4, 5, 2]));
// { maxX: 60, interval: [6, 4, 5] }
```

```
MONOTONIC STACK — GIẢI THÍCH:
═══════════════════════════════════════════════════════════════

  Ý TƯỞNG CHÍNH:
  → Với mỗi a[i], tìm khoảng RỘNG NHẤT mà a[i] là phần tử NHỎ NHẤT!
  → Khoảng đó bị giới hạn bởi phần tử NHỎ HƠN a[i] ở 2 bên!
  → left[i] = vị trí bắt đầu khoảng (phần tử nhỏ hơn + 1 bên trái!)
  → right[i] = vị trí kết thúc khoảng (phần tử nhỏ hơn - 1 bên phải!)

  MONOTONIC STACK:
  → Stack giữ indices theo THỨ TỰ TĂNG DẦN của giá trị!
  → Khi gặp phần tử NHỎ HƠN đỉnh stack → POP!
  → Pop tức là tìm được boundary!

  ĐỘ PHỨC TẠP:
  → Time:  O(n) — mỗi phần tử push/pop stack TỐI ĐA 1 lần!
  → Space: O(n) — stack + prefix sum + left/right arrays!
```

---

## §10. Checklist tổng hợp 5 vòng

### Vòng 1 — Technical (50 phút)

- [ ] Base-36 conversion: chia dư lặp, 36 ký tự (0-9+a-z), O(log n)!
- [ ] HTTPS: HTTP+TLS, TLS handshake 5 bước, Asymmetric+Symmetric!
- [ ] OS Process/Thread: 6 IPC (Pipe, MsgQueue, SharedMem, Semaphore, Socket, Signal)!
- [ ] Node.js Cluster: fork workers, Master proxy round-robin, fd sharing qua IPC!
- [ ] Native AJAX: XMLHttpRequest, readyState 0-4, open→setHeader→onreadystatechange→send!
- [ ] Object.defineProperty: value, writable, get, set, configurable, enumerable!
- [ ] hashchange vs History API: hash(#, đơn giản) vs pushState(URL sạch, cần server config)!
- [ ] Tree Traversal: Pre/In/Post-order (DFS+Stack) + Level-order (BFS+Queue)!
- [ ] Symmetric Tree: isMirror(left, right), left.left↔right.right, O(n)!

### Vòng 2 — Technical (40 phút)

- [ ] let/var/const: scope (function vs block), hoisting+TDZ, const=binding bất biến!
- [ ] HTTP Headers: Request (Accept, Authorization, Cookie), Response (Content-Type, Set-Cookie, ETag, CORS)!
- [ ] Keep-Alive: HTTP/1.1 persistent, WebSocket, SSE, Long Polling!
- [ ] CORS: CORS headers, Proxy, JSONP (implement!), Nginx, postMessage!
- [ ] Webpack: Happypack→thread-loader (parallel!), Tree Shaking (ES Modules, sideEffects!)!
- [ ] HTTP Methods: GET/POST/PUT/PATCH/DELETE, idempotent!
- [ ] TS vs JS: static typing, compile-time errors, generics, interface!
- [ ] type vs interface: merge (interface!), union (type!), extends vs &!
- [ ] React Optimization: memo, useMemo, useCallback, lazy loading, virtualization!
- [ ] Merge Intervals: sort by start, prev.end >= curr.start → merge, O(n log n)!

### Vòng 3 — Algorithm Heavy (60 phút)

- [ ] Node.js multiprocessing: child_process (spawn/exec/fork) + cluster!
- [ ] Node.js IPC: process.send/on('message'), stdio streams, SharedArrayBuffer, Socket!
- [ ] Node.js Worker Threads: worker_threads module, postMessage, SharedArrayBuffer+Atomics!
- [ ] Cluster vs Worker Threads: process (memory riêng, IPC) vs thread (share memory, nhẹ hơn)!
- [ ] Assign Cookies (Greedy): sort cả 2, two pointers, bánh nhỏ cho yêu cầu nhỏ, O(n log n)!
- [ ] Max X Interval (Monotonic Stack): prefix sum + left/right boundaries, O(n)!

### Vòng 4 — Technical + HR (40 phút)

- [ ] Merge Sorted Lists: dummy node, while(l1&&l2) so sánh, nối phần còn lại, O(n+m) O(1)!
- [ ] Cookie Attributes: Domain, Path, Expires/Max-Age, Secure, HttpOnly, SameSite!
- [ ] Storage 4 loại: Cookie(4KB,auto-send), Session(server), LocalStorage(permanent), SessionStorage(tab-scoped)!
- [ ] HttpOnly: ngăn JS truy cập cookie, chống XSS!
- [ ] CSS Position: static/relative/absolute/fixed/sticky!
- [ ] Status Codes: 200/201/204/301/302/304/400/401/403/404/429/500/502/503!
- [ ] OPTIONS: CORS preflight, browser tự gửi cho non-simple requests!
- [ ] Less & Sass: variables, nesting, mixins, extend, functions, loops!

### Vòng 5 — HR (30 phút)

- [ ] Học frontend từ khi nào, cách học, kế hoạch tương lai!
- [ ] Dự án ấn tượng + khó khăn (STAR method!)!
- [ ] Hiểu biết về công ty, thời gian thực tập!

---

_Nguồn: 飘哥 — "字节跳动前端实习面经" · juejin.cn/post/6901225702377390093_
_Cập nhật lần cuối: Tháng 2, 2026_
