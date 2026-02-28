# Interview One Side — Deep Dive

> 📅 2026-02-14 · ⏱ 18 phút đọc
>
> Base-36 Conversion, HTTPS vs HTTP, Process & Thread Communication,
> Node.js Cluster, Native AJAX, Tree Traversal, Symmetric Binary Tree
> Độ khó: ⭐️⭐️⭐️⭐️ | Frontend Interview Round 1

---

## Mục Lục

| #   | Phần                                                  |
| --- | ----------------------------------------------------- |
| 1   | Giới thiệu bản thân & Tại sao chọn Frontend           |
| 2   | Algorithm: Chuyển đổi hệ cơ số 36 (Base-36)           |
| 3   | HTTPS — Nguyên lý & Khác biệt với HTTP                |
| 4   | OS: Process & Thread — Giao tiếp                      |
| 5   | Node.js Cluster — Multi-process & Port sharing        |
| 6   | Implement Native AJAX                                 |
| 7   | Algorithm: Các cách duyệt cây & Level-order Traversal |
| 8   | Algorithm: Kiểm tra cây nhị phân đối xứng             |

---

## §1. Giới thiệu bản thân & Tại sao chọn Frontend

```
GIỚI THIỆU BẢN THÂN — FRAMEWORK:
═══════════════════════════════════════════════════════════════

  ① MỞ ĐẦU (30 giây):
  → Tên, trường/công ty hiện tại
  → Số năm kinh nghiệm
  → Vị trí ứng tuyển

  ② KINH NGHIỆM NỔI BẬT (1-2 phút):
  → 2-3 projects đáng chú ý nhất
  → Vai trò + công nghệ sử dụng
  → Kết quả đạt được (số liệu cụ thể!)
  → VD: "Tối ưu performance, giảm LCP từ 4s xuống 1.2s"

  ③ KỸ NĂNG CHUYÊN MÔN (30 giây):
  → Tech stack chính: React/Vue/Angular
  → Điểm mạnh: performance, architecture, testing...
  → Open-source contributions (nếu có!)

  ④ KẾT (15 giây):
  → Tại sao quan tâm vị trí này
  → Mong muốn đóng góp

  ⚠️ TIPS:
  → NGẮN GỌN! 2-3 phút là đủ!
  → KHÔNG liệt kê công nghệ như đọc CV!
  → NÓI VỀ IMPACT, không chỉ responsibilities!
  → Chuẩn bị SẴN 2 phiên bản: 1 phút + 3 phút!
```

```
TẠI SAO CHỌN FRONTEND?
═══════════════════════════════════════════════════════════════

  CÁC GÓC NHÌN TRẢ LỜI:

  ① Đam mê TRẢI NGHIỆM NGƯỜI DÙNG:
  → Frontend = nơi SẢN PHẨM GẶP NGƯỜI DÙNG!
  → Code được NHÌN THẤY trực tiếp → thỏa mãn!
  → UX tốt → users vui → mình vui!

  ② SÁNG TẠO + KỸ THUẬT kết hợp:
  → Không chỉ code logic mà còn thiết kế UI!
  → CSS animations, interactions, responsiveness!
  → Cả nghệ thuật lẫn kỹ thuật!

  ③ HỆ SINH THÁI đa dạng & phát triển nhanh:
  → React, Vue, Svelte, Next.js, Vite...
  → Web, Mobile (React Native), Desktop (Electron)!
  → Luôn có cái mới để học!

  ④ TẦM ẢNH HƯỞNG rộng:
  → Frontend chạy trên HÀNG TRIỆU thiết bị!
  → Performance optimization ảnh hưởng trực tiếp business!

  ⚠️ TRÁNH: "Vì frontend dễ hơn backend" → SAI!
  ⚠️ TRÁNH: "Vì lương cao" → KHÔNG nên nói trực tiếp!
  ⚠️ NÊN: Kết hợp đam mê CÁ NHÂN + lý do CHUYÊN MÔN!
```

---

## §2. Algorithm: Chuyển đổi hệ cơ số 36 (Base-36)

```
BASE-36 CONVERSION — KHÁI NIỆM:
═══════════════════════════════════════════════════════════════

  Hệ cơ số 36 dùng 36 ký tự:
  → 0-9 (10 chữ số) + a-z (26 chữ cái) = 36!

  Ký tự:  0 1 2 3 4 5 6 7 8 9 a  b  c  ... z
  Giá trị: 0 1 2 3 4 5 6 7 8 9 10 11 12 ... 35

  VÍ DỤ:
  → Số 255 (base 10) = "73" (base 36)
    255 = 7 × 36 + 3
  → Số 1000 (base 10) = "rs" (base 36)
    1000 = 27 × 36 + 28
    27 = 'r', 28 = 's'

  ỨNG DỤNG:
  → URL shortener (YouTube, TinyURL!)
  → Unique ID generation!
  → Nén số lớn thành string ngắn!
```

```javascript
// ═══ CÁCH 1: Dùng Number.toString() (Built-in!) ═══

function toBase36(num) {
  return num.toString(36);
}

console.log(toBase36(255)); // "73"
console.log(toBase36(1000)); // "rs"
console.log(toBase36(0)); // "0"
console.log(toBase36(35)); // "z"
console.log(toBase36(36)); // "10"

// Ngược lại: base 36 → base 10:
console.log(parseInt("73", 36)); // 255
console.log(parseInt("rs", 36)); // 1000
```

```javascript
// ═══ CÁCH 2: Tự implement (PHỎNG VẤN YÊU CẦU!) ═══

function toBase36Manual(num) {
  if (num === 0) return "0";

  const chars = "0123456789abcdefghijklmnopqrstuvwxyz";
  const isNegative = num < 0;
  num = Math.abs(num);

  let result = "";

  while (num > 0) {
    const remainder = num % 36; // Lấy DƯ!
    result = chars[remainder] + result; // Thêm vào ĐẦU!
    num = Math.floor(num / 36); // Chia NGUYÊN cho 36!
  }

  return isNegative ? "-" + result : result;
}

// VÍ DỤ TỪNG BƯỚC — 255 → base 36:
// 255 % 36 = 3  → chars[3]  = '3' → result = "3"
// 255 / 36 = 7  (floor)
//   7 % 36 = 7  → chars[7]  = '7' → result = "73"
//   7 / 36 = 0  → DỪNG!
// Kết quả: "73" ✅

console.log(toBase36Manual(255)); // "73"
console.log(toBase36Manual(1000)); // "rs"
console.log(toBase36Manual(-42)); // "-16"
```

```javascript
// ═══ TỔNG QUÁT: Chuyển đổi bất kỳ base nào ═══

function convertBase(num, base) {
  if (base < 2 || base > 36) {
    throw new Error("Base must be between 2 and 36");
  }
  if (num === 0) return "0";

  const chars = "0123456789abcdefghijklmnopqrstuvwxyz";
  const isNegative = num < 0;
  num = Math.abs(num);

  let result = "";
  while (num > 0) {
    result = chars[num % base] + result;
    num = Math.floor(num / base);
  }

  return isNegative ? "-" + result : result;
}

// Base 2 (nhị phân):
console.log(convertBase(10, 2)); // "1010"
// Base 8 (bát phân):
console.log(convertBase(255, 8)); // "377"
// Base 16 (thập lục phân):
console.log(convertBase(255, 16)); // "ff"
// Base 36:
console.log(convertBase(1000, 36)); // "rs"
```

```
THUẬT TOÁN CHUYỂN ĐỔI HỆ CƠ SỐ:
═══════════════════════════════════════════════════════════════

  BƯỚC 1: Chia số cho BASE
  BƯỚC 2: Lấy PHẦN DƯ → ký tự tương ứng
  BƯỚC 3: Lấy PHẦN NGUYÊN → lặp lại bước 1
  BƯỚC 4: DỪNG khi phần nguyên = 0
  BƯỚC 5: ĐỌC NGƯỢC kết quả!

  ĐỘ PHỨC TẠP:
  → Time: O(log_base(n)) — số lần chia!
  → Space: O(log_base(n)) — chiều dài result string!
```

---

## §3. HTTPS — Nguyên lý & Khác biệt với HTTP

```
HTTPS — BẢN CHẤT:
═══════════════════════════════════════════════════════════════

  HTTPS = HTTP + SSL/TLS!
  → HTTP truyền dữ liệu PLAIN TEXT!
  → HTTPS MÃ HÓA dữ liệu trước khi truyền!

  ┌──────────────────────────────────────────────────────┐
  │ HTTP:                                                │
  │ [Client] ──── plain text ────→ [Server]              │
  │ → Ai ở giữa cũng ĐỌC ĐƯỢC! (Man-in-the-Middle!) 💀│
  ├──────────────────────────────────────────────────────┤
  │ HTTPS:                                               │
  │ [Client] ──── encrypted ────→ [Server]               │
  │ → Dữ liệu MÃ HÓA! Không đọc được! 🔒              │
  └──────────────────────────────────────────────────────┘
```

```
TLS/SSL HANDSHAKE — QUY TRÌNH:
═══════════════════════════════════════════════════════════════

  ① Client Hello:
  → Client gửi: TLS version, cipher suites hỗ trợ,
    random number (Client Random)!

  ② Server Hello:
  → Server chọn: cipher suite, gửi SSL Certificate
    (chứa Public Key!) + random number (Server Random)!

  ③ Client xác minh Certificate:
  → Kiểm tra: CA đáng tin? Hết hạn chưa? Domain đúng?
  → Nếu OK → tạo Pre-Master Secret!
  → MÃ HÓA Pre-Master Secret bằng Public Key của server!
  → Gửi cho server!

  ④ Server giải mã:
  → Dùng Private Key giải mã → lấy Pre-Master Secret!
  → Cả 2 bên có: Client Random + Server Random + Pre-Master Secret
  → TẠO Session Key (symmetric key!) = key dùng để mã hóa data!

  ⑤ Giao tiếp mã hóa:
  → Dùng Session Key (đối xứng) để mã hóa/giải mã data!
  → NHANH hơn asymmetric encryption!

  FLOW:
  ┌────────┐                              ┌────────┐
  │ Client │  ① ClientHello              │ Server │
  │        │  ────────────────────────→   │        │
  │        │  ② ServerHello + Cert        │        │
  │        │  ←────────────────────────   │        │
  │        │  ③ Encrypted Pre-Master      │        │
  │        │  ────────────────────────→   │        │
  │        │  ④ Cả 2 có Session Key!     │        │
  │        │  ⑤ 🔒 Encrypted Data 🔒    │        │
  │        │  ←══════════════════════→   │        │
  └────────┘                              └────────┘
```

```
HTTP vs HTTPS — SO SÁNH:
═══════════════════════════════════════════════════════════════

  ┌─────────────────┬──────────────────┬──────────────────────┐
  │ Tiêu chí        │ HTTP             │ HTTPS                 │
  ├─────────────────┼──────────────────┼──────────────────────┤
  │ Port mặc định   │ 80               │ 443                   │
  ├─────────────────┼──────────────────┼──────────────────────┤
  │ Bảo mật         │ Plain text! ❌   │ Mã hóa SSL/TLS! ✅   │
  ├─────────────────┼──────────────────┼──────────────────────┤
  │ Certificate     │ Không cần!       │ CẦN SSL Certificate!  │
  │                 │                  │ (từ CA!)               │
  ├─────────────────┼──────────────────┼──────────────────────┤
  │ Tốc độ          │ Nhanh hơn!       │ Chậm hơn chút!        │
  │                 │ (không encrypt)  │ (TLS handshake!)       │
  ├─────────────────┼──────────────────┼──────────────────────┤
  │ SEO             │ Bình thường      │ Google ƯU TIÊN! ⭐    │
  ├─────────────────┼──────────────────┼──────────────────────┤
  │ URL             │ http://          │ https://               │
  ├─────────────────┼──────────────────┼──────────────────────┤
  │ Mã hóa          │ Không!           │ Asymmetric (handshake) │
  │                 │                  │ + Symmetric (data!)    │
  ├─────────────────┼──────────────────┼──────────────────────┤
  │ Man-in-Middle   │ Dễ bị! 💀       │ Chống được! ✅         │
  └─────────────────┴──────────────────┴──────────────────────┘

  TẠI SAO HTTPS DÙNG 2 LOẠI MÃ HÓA?
  → Asymmetric (RSA): CHẬM nhưng AN TOÀN cho key exchange!
  → Symmetric (AES): NHANH cho data transfer thực tế!
  → Kết hợp: dùng asymmetric để trao đổi symmetric key!
  → Sau đó dùng symmetric key cho toàn bộ session!
```

---

## §4. OS: Process & Thread — Giao tiếp

```
PROCESS vs THREAD — NHẮC LẠI:
═══════════════════════════════════════════════════════════════

  PROCESS (Tiến trình):
  → Đơn vị CẤP PHÁT TÀI NGUYÊN của OS!
  → Mỗi process có KHÔNG GIAN BỘ NHỚ RIÊNG!
  → Process A KHÔNG thể truy cập memory Process B!

  THREAD (Luồng):
  → Đơn vị THỰC THI NHỎ NHẤT trong 1 process!
  → Các threads TRONG CÙNG process CHIA SẺ memory!
  → Thread-1, Thread-2 cùng process → truy cập CÙNG data!
```

```
GIAO TIẾP GIỮA CÁC PROCESS (IPC):
═══════════════════════════════════════════════════════════════

  IPC = Inter-Process Communication
  → Processes có MEMORY RIÊNG → cần cơ chế giao tiếp!

  ┌────────────────────────────────────────────────────────────┐
  │ ① PIPE (Đường ống):                                        │
  │ → Giao tiếp MỘT CHIỀU!                                    │
  │ → Thường dùng giữa process CHA-CON!                       │
  │ → VD: ls | grep "test" (pipe trong shell!)                 │
  │ → Named Pipe (FIFO): cho processes KHÔNG liên quan!        │
  ├────────────────────────────────────────────────────────────┤
  │ ② MESSAGE QUEUE (Hàng đợi tin nhắn):                       │
  │ → Gửi messages vào QUEUE!                                  │
  │ → Process khác ĐỌC từ queue!                               │
  │ → Asynchronous! Producer-Consumer pattern!                 │
  ├────────────────────────────────────────────────────────────┤
  │ ③ SHARED MEMORY (Bộ nhớ chia sẻ):                          │
  │ → NHANH NHẤT! Nhiều process TRUY CẬP CÙNG vùng memory!    │
  │ → Cần SYNCHRONIZATION (semaphore/mutex) để tránh race!     │
  ├────────────────────────────────────────────────────────────┤
  │ ④ SEMAPHORE (Cờ hiệu):                                     │
  │ → Cơ chế ĐỒNG BỘ! Kiểm soát truy cập tài nguyên chung!   │
  │ → Counter: > 0 → cho phép truy cập; = 0 → chờ!            │
  ├────────────────────────────────────────────────────────────┤
  │ ⑤ SOCKET:                                                  │
  │ → Giao tiếp qua NETWORK! (TCP/UDP!)                        │
  │ → Có thể giao tiếp GIỮA CÁC MÁY KHÁC NHAU!               │
  │ → Linh hoạt nhất nhưng CHẬM hơn!                          │
  ├────────────────────────────────────────────────────────────┤
  │ ⑥ SIGNAL (Tín hiệu):                                       │
  │ → "Thông báo" event cho process!                            │
  │ → VD: Ctrl+C = SIGINT, kill = SIGTERM!                     │
  │ → Đơn giản, KHÔNG truyền data phức tạp!                   │
  └────────────────────────────────────────────────────────────┘
```

```
GIAO TIẾP GIỮA CÁC THREAD:
═══════════════════════════════════════════════════════════════

  Threads TRONG CÙNG process CHIA SẺ memory!
  → Giao tiếp DỄ hơn processes!
  → NHƯNG cần ĐỒNG BỘ HÓA!

  ┌────────────────────────────────────────────────────────────┐
  │ ① SHARED VARIABLES (Biến chia sẻ):                         │
  │ → Đơn giản nhất! Threads đọc/ghi CÙNG biến!               │
  │ → CẦN: mutex/lock để tránh race condition!                │
  ├────────────────────────────────────────────────────────────┤
  │ ② MUTEX (Mutual Exclusion):                                │
  │ → Khóa! Chỉ 1 thread truy cập tài nguyên tại 1 thời điểm!│
  │ → Thread khác PHẢI CHỜ đến khi khóa được mở!              │
  ├────────────────────────────────────────────────────────────┤
  │ ③ CONDITION VARIABLE (Biến điều kiện):                      │
  │ → Thread CHỜ cho đến khi điều kiện THỎA MÃN!              │
  │ → Thread khác SIGNAL khi điều kiện đúng!                   │
  ├────────────────────────────────────────────────────────────┤
  │ ④ SEMAPHORE:                                                │
  │ → Giống ở process! Nhưng cho threads!                      │
  │ → Cho phép N threads truy cập đồng thời!                   │
  └────────────────────────────────────────────────────────────┘

  ⚠️ VẤN ĐỀ LỚN NHẤT: RACE CONDITION!
  → 2 threads ghi CÙNG biến CÙNG LÚC → kết quả SAI!
  → GIẢI PHÁP: Mutex, Semaphore, Atomic operations!

  JAVASCRIPT:
  → JS = SINGLE THREAD! → KHÔNG có race condition!
  → Worker Threads: dùng postMessage() (giống IPC!)
  → SharedArrayBuffer + Atomics: shared memory cho workers!
```

---

## §5. Node.js Cluster — Multi-process & Port sharing

```
NODE.JS CLUSTER — TẠI SAO?
═══════════════════════════════════════════════════════════════

  Node.js = SINGLE-THREADED! (Event Loop!)
  → 1 process = 1 CPU core!
  → Server 8 cores → Node.js chỉ dùng 1 core! Lãng phí! 😩

  GIẢI PHÁP: cluster module!
  → Tạo NHIỀU WORKER PROCESSES!
  → Mỗi worker = 1 Node.js instance riêng!
  → Tận dụng TẤT CẢ CPU cores!
```

```javascript
// ═══ NODE.JS CLUSTER — IMPLEMENTATION ═══

const cluster = require("cluster");
const http = require("http");
const numCPUs = require("os").cpus().length; // Số CPU cores!

if (cluster.isMaster) {
  // ══ MASTER PROCESS ══
  console.log(`Master ${process.pid} is running`);

  // Fork workers = số CPU cores:
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork(); // Tạo worker process!
  }

  // Worker bị crash → tạo worker MỚI:
  cluster.on("exit", (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    cluster.fork(); // Auto-restart!
  });
} else {
  // ══ WORKER PROCESS ══
  // Mỗi worker TẠO HTTP server:
  http
    .createServer((req, res) => {
      res.writeHead(200);
      res.end(`Hello from Worker ${process.pid}\n`);
    })
    .listen(8000);
  //       ↑ TẤT CẢ workers listen CÙNG PORT 8000!

  console.log(`Worker ${process.pid} started`);
}
```

```
NHIỀU PROCESS LISTEN CÙNG 1 PORT? — CƠ CHẾ:
═══════════════════════════════════════════════════════════════

  HỎI: Bình thường 1 port chỉ 1 process listen?
  ĐÁP: ĐÚNG! Nhưng cluster làm được nhờ CƠ CHẾ ĐẶC BIỆT!

  ┌────────────────────────────────────────────────────────────┐
  │ CƠ CHẾ 1: MASTER ĐÓhref VAI TRÒ PROXY (mặc định!)        │
  │                                                            │
  │ Client Request                                             │
  │      ↓                                                     │
  │ [Master Process] ← LISTEN port 8000!                       │
  │      ↓ (round-robin - phân phối đều!)                      │
  │ ┌────────┬────────┬────────┬────────┐                      │
  │ │Worker 1│Worker 2│Worker 3│Worker 4│                      │
  │ └────────┘────────┘────────┘────────┘                      │
  │                                                            │
  │ → MASTER listen port THẬT SỰ!                              │
  │ → Nhận request → CHUYỂN cho worker qua IPC!                │
  │ → Round-robin: lần lượt Worker 1→2→3→4→1→...!             │
  ├────────────────────────────────────────────────────────────┤
  │ CƠ CHẾ 2: SO_REUSEPORT (Linux!)                            │
  │                                                            │
  │ → Kernel CHO PHÉP nhiều processes bind CÙNG port!          │
  │ → Kernel tự phân phối connections!                          │
  │ → Hiệu quả hơn vì KHÔNG cần master proxy!                 │
  └────────────────────────────────────────────────────────────┘

  NODE.JS MẶC ĐỊNH DÙNG CƠ CHẾ 1:
  → Master process listen port!
  → Master chuyển FILE DESCRIPTOR (fd) cho workers qua IPC!
  → Workers nhận fd → xử lý request!
  → Thực tế chỉ MASTER bind port, workers KHÔNG bind!

  ⚠️ KHÁC VỚI WORKER THREADS:
  → cluster.fork() = tạo PROCESS mới (fork!)
  → Worker Threads = tạo THREAD trong cùng process!
  → Cluster: mỗi worker có V8 instance RIÊNG, memory RIÊNG!
  → Worker Threads: chia sẻ memory (SharedArrayBuffer!)
```

---

## §6. Implement Native AJAX

```
AJAX — KHÁI NIỆM:
═══════════════════════════════════════════════════════════════

  AJAX = Asynchronous JavaScript And XML
  → Gửi HTTP request KHÔNG CẦN reload trang!
  → Nhận response → cập nhật DOM CỤC BỘ!

  CORE: XMLHttpRequest (XHR) object!
  → Dù tên có "XML" nhưng có thể gửi/nhận BẤT KỲ data!
  → JSON phổ biến nhất hiện nay!
```

```javascript
// ═══ NATIVE AJAX — XMLHttpRequest ═══

// ①  GET REQUEST:
function ajaxGet(url) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // BƯỚC 1: Khởi tạo request
    xhr.open("GET", url, true);
    //                      ↑ true = ASYNCHRONOUS!

    // BƯỚC 2: Set response type
    xhr.responseType = "json";

    // BƯỚC 3: Set headers (optional)
    xhr.setRequestHeader("Content-Type", "application/json");

    // BƯỚC 4: Handle response
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        // readyState 4 = DONE!
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(xhr.response);
        } else {
          reject(new Error(`HTTP Error: ${xhr.status}`));
        }
      }
    };

    // BƯỚC 4b: Handle network errors
    xhr.onerror = function () {
      reject(new Error("Network Error"));
    };

    // BƯỚC 4c: Handle timeout
    xhr.timeout = 5000; // 5 giây!
    xhr.ontimeout = function () {
      reject(new Error("Request Timeout"));
    };

    // BƯỚC 5: GỬI request!
    xhr.send(null); // GET → body = null!
  });
}
```

```javascript
// ② POST REQUEST:
function ajaxPost(url, data) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open("POST", url, true);
    xhr.responseType = "json";
    xhr.setRequestHeader("Content-Type", "application/json");

    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(xhr.response);
        } else {
          reject(new Error(`HTTP Error: ${xhr.status}`));
        }
      }
    };

    xhr.onerror = () => reject(new Error("Network Error"));
    xhr.ontimeout = () => reject(new Error("Timeout"));
    xhr.timeout = 5000;

    // POST → gửi DATA trong body!
    xhr.send(JSON.stringify(data));
    //       ↑ Object → JSON string!
  });
}

// SỬ DỤNG:
ajaxGet("https://api.example.com/users")
  .then((data) => console.log(data))
  .catch((err) => console.error(err));

ajaxPost("https://api.example.com/users", {
  name: "John",
  age: 30,
}).then((data) => console.log(data));
```

```
XHR — READYSTATE VALUES:
═══════════════════════════════════════════════════════════════

  ┌───────┬─────────────────┬───────────────────────────────┐
  │ Value │ State           │ Ý nghĩa                       │
  ├───────┼─────────────────┼───────────────────────────────┤
  │ 0     │ UNSENT          │ open() chưa gọi!              │
  │ 1     │ OPENED          │ open() đã gọi!                │
  │ 2     │ HEADERS_RECEIVED│ Đã nhận response headers!     │
  │ 3     │ LOADING         │ Đang tải response body...     │
  │ 4     │ DONE            │ HOÀN THÀNH! ✅                │
  └───────┴─────────────────┴───────────────────────────────┘

  onreadystatechange FIRE Ở MỖI STATE CHANGE!
  → Kiểm tra readyState === 4 để biết request XONG!
  → + Kiểm tra status 200-299 để biết THÀNH CÔNG!
```

```javascript
// ═══ SO SÁNH VỚI FETCH API ═══

// Fetch (hiện đại hơn!):
async function fetchGet(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP Error: ${response.status}`);
  }
  return response.json();
}

// ⚠️ KHÁC BIỆT XHR vs FETCH:
// → XHR: có onprogress (upload/download progress!)
// → XHR: có abort() (hủy request!)
// → XHR: có timeout property!
// → Fetch: Promise-based! Cleaner API!
// → Fetch: KHÔNG reject trên HTTP errors (404, 500)!
//          → Phải kiểm tra response.ok!
// → Fetch: KHÔNG có built-in timeout! (cần AbortController!)
// → Fetch: KHÔNG gửi cookies mặc định cross-origin!
//          → credentials: 'include' để gửi!
```

---

## §7. Algorithm: Các cách duyệt cây & Level-order Traversal

```
CÁC CÁCH DUYỆT CÂY NHỊ PHÂN:
═══════════════════════════════════════════════════════════════

  Cây ví dụ:
          1
         / \
        2   3
       / \   \
      4   5   6

  4 CÁCH DUYỆT:

  ① Pre-order (Tiền tự — NLR): GỐC → trái → phải
     → 1, 2, 4, 5, 3, 6

  ② In-order (Trung tự — LNR): trái → GỐC → phải
     → 4, 2, 5, 1, 3, 6

  ③ Post-order (Hậu tự — LRN): trái → phải → GỐC
     → 4, 5, 2, 6, 3, 1

  ④ Level-order (Theo tầng — BFS!): từng tầng trái → phải
     → 1 | 2, 3 | 4, 5, 6

  3 cách đầu = DFS (Depth-First Search!)
  Cách cuối = BFS (Breadth-First Search!)
```

```javascript
// ═══ ĐỊNH NGHĨA NODE ═══

class TreeNode {
  constructor(val, left = null, right = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}
```

```javascript
// ═══ DFS — ĐỆ QUY ═══

// ① Pre-order (NLR): Gốc → Trái → Phải
function preorder(root) {
  if (!root) return [];
  return [root.val, ...preorder(root.left), ...preorder(root.right)];
}

// ② In-order (LNR): Trái → Gốc → Phải
function inorder(root) {
  if (!root) return [];
  return [...inorder(root.left), root.val, ...inorder(root.right)];
}

// ③ Post-order (LRN): Trái → Phải → Gốc
function postorder(root) {
  if (!root) return [];
  return [...postorder(root.left), ...postorder(root.right), root.val];
}
```

```javascript
// ═══ DFS — ITERATIVE (dùng Stack!) ═══

// ① Pre-order iterative:
function preorderIterative(root) {
  if (!root) return [];
  const result = [];
  const stack = [root];

  while (stack.length > 0) {
    const node = stack.pop();
    result.push(node.val);

    // Push RIGHT trước (vì stack LIFO → left sẽ pop trước!)
    if (node.right) stack.push(node.right);
    if (node.left) stack.push(node.left);
  }

  return result;
}

// ② In-order iterative:
function inorderIterative(root) {
  const result = [];
  const stack = [];
  let curr = root;

  while (curr || stack.length > 0) {
    // Đi hết TRÁI trước:
    while (curr) {
      stack.push(curr);
      curr = curr.left;
    }
    curr = stack.pop();
    result.push(curr.val); // Xử lý gốc!
    curr = curr.right; // Sang phải!
  }

  return result;
}
```

```javascript
// ═══ BFS — LEVEL-ORDER TRAVERSAL (DÙNG QUEUE!) ═══
// ⭐ ĐÂY LÀ CÂU HỎI CHÍNH!

function levelOrder(root) {
  if (!root) return [];

  const result = [];
  const queue = [root]; // Dùng QUEUE (FIFO!)

  while (queue.length > 0) {
    const levelSize = queue.length; // Số nodes ở tầng hiện tại!
    const currentLevel = [];

    for (let i = 0; i < levelSize; i++) {
      const node = queue.shift(); // Lấy đầu queue!
      currentLevel.push(node.val);

      // Thêm con trái + phải vào queue:
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }

    result.push(currentLevel);
  }

  return result;
}

// VÍ DỤ:
//         1
//        / \
//       2   3
//      / \   \
//     4   5   6
//
// levelOrder → [[1], [2, 3], [4, 5, 6]]
//
// TỪNG BƯỚC:
// Queue: [1]        → level 1: [1]     → push 2, 3
// Queue: [2, 3]     → level 2: [2, 3]  → push 4, 5, 6
// Queue: [4, 5, 6]  → level 3: [4,5,6] → no children
// Queue: []          → DỪNG!
```

```javascript
// ═══ LEVEL-ORDER — KHÔNG PHÂN TẦNG (đơn giản hơn) ═══

function levelOrderFlat(root) {
  if (!root) return [];

  const result = [];
  const queue = [root];

  while (queue.length > 0) {
    const node = queue.shift();
    result.push(node.val);

    if (node.left) queue.push(node.left);
    if (node.right) queue.push(node.right);
  }

  return result;
  // → [1, 2, 3, 4, 5, 6] (flat, không phân tầng)
}
```

```
DFS vs BFS — SO SÁNH:
═══════════════════════════════════════════════════════════════

  ┌───────────┬──────────────────┬──────────────────────┐
  │           │ DFS              │ BFS                   │
  ├───────────┼──────────────────┼──────────────────────┤
  │ Cấu trúc │ Stack (hoặc đệ   │ Queue!                │
  │ dữ liệu  │ quy = call stack)│                       │
  ├───────────┼──────────────────┼──────────────────────┤
  │ Thứ tự   │ Đi SÂU trước!   │ Đi RỘNG trước!        │
  ├───────────┼──────────────────┼──────────────────────┤
  │ Space    │ O(h) h=chiều cao │ O(w) w=chiều rộng max │
  ├───────────┼──────────────────┼──────────────────────┤
  │ Dùng khi │ Tìm path, check  │ Shortest path,        │
  │          │ tồn tại, tree    │ level-order, nearest! │
  │          │ structure         │                       │
  └───────────┴──────────────────┴──────────────────────┘
```

---

## §8. Algorithm: Kiểm tra cây nhị phân đối xứng

```
CÂY NHỊ PHÂN ĐỐI XỨNG (SYMMETRIC TREE):
═══════════════════════════════════════════════════════════════

  Cây ĐỐI XỨNG = lật gương trái-phải GIỐNG NHAU!

  ĐỐI XỨNG ✅:           KHÔNG đối xứng ❌:
       1                       1
      / \                     / \
     2   2                   2   2
    / \ / \                   \   \
   3  4 4  3                   3   3

  ĐIỀU KIỆN ĐỐI XỨNG:
  → Node trái.val === Node phải.val
  → left.left đối xứng với right.right
  → left.right đối xứng với right.left
```

```javascript
// ═══ CÁCH 1: ĐỆ QUY (DFS!) ═══
// LeetCode 101: Symmetric Tree

function isSymmetric(root) {
  if (!root) return true;
  return isMirror(root.left, root.right);
}

function isMirror(left, right) {
  // Cả 2 null → đối xứng!
  if (!left && !right) return true;

  // 1 null, 1 không → KHÔNG đối xứng!
  if (!left || !right) return false;

  // Giá trị KHÁC nhau → KHÔNG đối xứng!
  if (left.val !== right.val) return false;

  // Kiểm tra ĐỆ QUY:
  // → left.left vs right.right (ngoài vs ngoài!)
  // → left.right vs right.left (trong vs trong!)
  return isMirror(left.left, right.right) && isMirror(left.right, right.left);
}

// VÍ DỤ:
//       1
//      / \
//     2   2
//    / \ / \
//   3  4 4  3
//
// isMirror(2, 2) → val bằng nhau ✅
//   isMirror(3, 3) → val bằng nhau ✅
//     isMirror(null, null) → cả 2 null ✅ → true!
//   isMirror(4, 4) → val bằng nhau ✅
//     isMirror(null, null) → true!
// → Kết quả: true! Cây đối xứng! ✅
```

```javascript
// ═══ CÁCH 2: ITERATIVE (BFS — dùng Queue!) ═══

function isSymmetricIterative(root) {
  if (!root) return true;

  const queue = [root.left, root.right];

  while (queue.length > 0) {
    const left = queue.shift();
    const right = queue.shift();

    // Cả 2 null → OK, tiếp tục!
    if (!left && !right) continue;

    // 1 null hoặc val khác → KHÔNG đối xứng!
    if (!left || !right) return false;
    if (left.val !== right.val) return false;

    // Push theo THỨ TỰ ĐỐI XỨNG:
    queue.push(left.left, right.right); // Ngoài vs ngoài!
    queue.push(left.right, right.left); // Trong vs trong!
  }

  return true;
}

// ⚠️ THỨ TỰ PUSH QUAN TRỌNG!
// → push(left.left, right.right) → cặp NGOÀI!
// → push(left.right, right.left) → cặp TRONG!
// → Mỗi lần shift 2 nodes ra → so sánh CẶP!
```

```
ĐỘ PHỨC TẠP:
═══════════════════════════════════════════════════════════════

  Cả 2 cách:
  → Time:  O(n) — duyệt TẤT CẢ nodes!
  → Space: O(n) — worst case: queue/stack chứa n/2 nodes!
           O(h) cho đệ quy (h = chiều cao cây!)

  ⚠️ PHỎNG VẤN:
  → Được hỏi → viết ĐỆ QUY trước (ngắn gọn, dễ hiểu!)
  → Hỏi thêm → viết ITERATIVE (chứng minh hiểu BFS!)
```

---

## Tổng kết — Checklist phỏng vấn

```
MIND MAP:
═══════════════════════════════════════════════════════════════

  Interview One Side
  ├── Self-intro: Impact > responsibilities; 2-3 phút!
  ├── Base-36: chia dư lặp lại; 36 ký tự (0-9 + a-z)
  │   └── Tổng quát: convertBase(num, base) → O(log n)
  ├── HTTPS: HTTP + TLS; Asymmetric (handshake) + Symmetric (data)
  │   └── TLS Handshake: ClientHello → ServerHello+Cert → PreMaster → SessionKey
  ├── IPC: Pipe, Message Queue, Shared Memory, Semaphore, Socket, Signal
  │   └── Thread: Shared Variables + Mutex + Condition Variable
  ├── Node.js Cluster: Master fork workers; Master listen port → round-robin
  │   └── SO_REUSEPORT hoặc fd sharing qua IPC!
  ├── Native AJAX: XMLHttpRequest; open→setHeader→onreadystatechange→send
  │   └── readyState: 0-4; XHR vs Fetch (progress, timeout, cookies!)
  ├── Tree Traversal: DFS (Pre/In/Post-order) + BFS (Level-order!)
  │   └── DFS = Stack; BFS = Queue!
  └── Symmetric Tree: isMirror(left, right); left.left↔right.right!
      └── Đệ quy O(n) hoặc BFS iterative!
```

### Checklist

- [ ] **Giới thiệu**: Framework 4 phần (mở đầu, kinh nghiệm, kỹ năng, kết); 2-3 phút; nói IMPACT không chỉ responsibilities!
- [ ] **Base-36**: 36 ký tự (0-9, a-z); num % 36 → ký tự, num / 36 → lặp; đọc NGƯỢC; O(log n)!
- [ ] **HTTPS**: HTTP + SSL/TLS; port 443 vs 80; TLS handshake trao đổi Session Key!
- [ ] **TLS Handshake**: ClientHello → ServerHello+Cert → Client verify CA + gửi PreMasterSecret (encrypt RSA) → cả 2 tạo Session Key (symmetric!)
- [ ] **2 loại mã hóa**: Asymmetric (RSA, chậm) cho key exchange; Symmetric (AES, nhanh) cho data transfer!
- [ ] **IPC 6 cơ chế**: Pipe (1 chiều), Message Queue (async), Shared Memory (nhanh nhất!), Semaphore, Socket (cross-machine), Signal (event notification)!
- [ ] **Thread communication**: Shared variables + Mutex/Lock + Condition Variable + Semaphore; race condition → mutex!
- [ ] **Node.js Cluster**: cluster.fork() tạo worker processes; tận dụng multi-core; Master proxy round-robin!
- [ ] **Cluster port sharing**: Master listen port THẬT SỰ → chuyển fd cho workers qua IPC; hoặc SO_REUSEPORT (Linux)!
- [ ] **Native AJAX**: new XMLHttpRequest() → open(method, url, async) → setRequestHeader → onreadystatechange → send(body)!
- [ ] **readyState**: 0=UNSENT, 1=OPENED, 2=HEADERS_RECEIVED, 3=LOADING, 4=DONE; check readyState===4 + status 200-299!
- [ ] **XHR vs Fetch**: XHR có progress/timeout/abort; Fetch Promise-based, KHÔNG reject HTTP errors, KHÔNG có timeout built-in!
- [ ] **4 cách duyệt cây**: Pre-order (NLR), In-order (LNR), Post-order (LRN) = DFS; Level-order = BFS!
- [ ] **Level-order**: Dùng QUEUE! Mỗi vòng xử lý 1 tầng (levelSize); push children vào queue; O(n)!
- [ ] **DFS vs BFS**: DFS = Stack O(h); BFS = Queue O(w); DFS cho path/existence; BFS cho shortest/level!
- [ ] **Symmetric Tree**: isMirror(left, right); cả 2 null→true; 1 null→false; val khác→false; đệ quy left.left↔right.right + left.right↔right.left!
- [ ] **Symmetric iterative**: Queue push CẶP đối xứng; shift 2 nodes, so sánh; O(n)!

---

_Nguồn: ByteDance Frontend Interview — One Side · LeetCode 101, 102_
_Cập nhật lần cuối: Tháng 2, 2026_
