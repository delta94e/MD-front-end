# The Hard Parts of UI Development — Phần 7: Storing Data in JavaScript — "JavaScript = Bảng Điều Khiển Của Browser!"

> 📅 2026-03-08 · ⏱ 40 phút đọc
>
> Nguồn: Frontend Masters — Will Sentance
> Khoá học: The Hard Parts of UI Development
> Bài: Storing Data in JavaScript — "JavaScript Saves Data, Runs Code, Accesses DOM!"
> Độ khó: ⭐️⭐️⭐️ | Intermediate — JavaScript runtime, console object, document object, hidden links!

---

## Mục Lục

| #   | Phần                                                              |
| --- | ----------------------------------------------------------------- |
| 1   | JavaScript Trong Web Browser — "Ngôn Ngữ Phổ Biến Nhất Thế Giới!" |
| 2   | Sơ Đồ Toàn Cảnh Web Browser — "Tất Cả Thành Phần Kết Nối Ra Sao?" |
| 3   | JavaScript Runtime — "Memory + Thread + Call Stack!"              |
| 4   | Closure & Asynchronicity — "Hai Tính Năng Đặc Biệt!"              |
| 5   | Console — "Không Phải JavaScript! Nằm Ngoài Engine!"              |
| 6   | Document Object — "Cánh Cổng Vào DOM Từ JavaScript!"              |
| 7   | Hidden Links — "Thuộc Tính Ẩn Kết Nối JS ↔ C++!"                  |
| 8   | Web Browser APIs — "JavaScript = Bảng Điều Khiển!"                |
| 9   | Tự Implement: JavaScript Runtime Mô Phỏng                         |
| 10  | 🔬 Deep Analysis Patterns — 6 Tư Duy Phân Tích Sâu                |

---

## §1. JavaScript Trong Web Browser — "Ngôn Ngữ Phổ Biến Nhất Thế Giới!"

> Will: _"JavaScript becomes the most popular language in the world, because it runs in the web browser, which is almost an operating system level of available features."_

### Bối cảnh — Tại sao JavaScript thống trị?

Will mở bài bằng một nhận xét cực kỳ quan trọng: JavaScript trở thành ngôn ngữ phổ biến nhất thế giới **KHÔNG** vì nó là ngôn ngữ tốt nhất — mà vì nó chạy trong **web browser**, và web browser có mức độ tính năng **gần như bằng một hệ điều hành** (operating system). Đây là insight sâu sắc: JavaScript "cưỡi" trên sức mạnh của browser.

Hãy phân tích tại sao điều này quan trọng. Web browser hiện đại (Chrome, Firefox, Safari) bao gồm:

- **Rendering engine** (Blink/WebKit/Gecko) — hiển thị trang web
- **JavaScript engine** (V8/SpiderMonkey/JavaScriptCore) — chạy code
- **Networking stack** — HTTP requests, WebSocket, fetch API
- **Storage** — LocalStorage, IndexedDB, Cookies, Cache API
- **Media** — Audio API, Video, WebRTC (video call!)
- **Graphics** — Canvas 2D, WebGL (3D!), WebGPU
- **Device access** — Geolocation, Camera, Microphone, Bluetooth, USB
- **Workers** — Web Workers (multi-threading!), Service Workers (offline!)
- **Security** — Same-Origin Policy, CORS, CSP, HTTPS

Tất cả những tính năng này đều có thể truy cập **từ JavaScript**. Will nói: "almost an operating system level" — và đây hoàn toàn chính xác. Spotify desktop app, Slack, VS Code — tất cả đều là **web browser bọc lại** (Electron/Chromium). JavaScript không mạnh vì bản thân nó — JavaScript mạnh vì nó là **bảng điều khiển** (control panel) cho toàn bộ tính năng của browser.

### JavaScript bản chất là gì theo Will?

Will nhấn mạnh: bản chất JavaScript **rất đơn giản** — "pretty basic language". Nó chỉ làm hai việc cốt lõi:

1. **Lưu dữ liệu** (save data) — biến, object, array, function
2. **Chạy code để thay đổi dữ liệu** (run code to change data) — operators, functions, logic

Mọi thứ "ấn tượng" khác (DOM manipulation, fetch, animation, audio) đều là tính năng **của browser**, KHÔNG phải của JavaScript. JavaScript chỉ "gọi" đến những tính năng đó thông qua **Web Browser APIs**.

```
JAVASCRIPT — NGÔN NGỮ "ĐƠN GIẢN" NHƯNG MẠNH MẼ:
═══════════════════════════════════════════════════════════════

  BẢN CHẤT JAVASCRIPT (rất đơn giản!):
  ┌──────────────────────────────────────────────────────────┐
  │ ① LƯU DỮ LIỆU:                                        │
  │   → let likes = 7;                                      │
  │   → const user = { name: "Scott" };                     │
  │   → const todos = ["mua sữa", "học JS"];               │
  │                                                          │
  │ ② CHẠY CODE ĐỂ THAY ĐỔI:                              │
  │   → likes = likes + 1; // 7 → 8!                       │
  │   → user.name = "Will"; // đổi tên!                    │
  │   → todos.push("viết blog"); // thêm todo!             │
  │                                                          │
  │ "JavaScript sees data, runs code to change that data,    │
  │  does it inside execution contexts. THAT IS IT."        │
  └──────────────────────────────────────────────────────────┘

  SỨC MẠNH THỰC SỰ (từ browser!):
  ┌──────────────────────────────────────────────────────────┐
  │ JavaScript + Browser = "Gần như Operating System!"      │
  │                                                          │
  │ → document.querySelector() ← DOM API!                  │
  │ → fetch("api.com/data") ← Networking!                  │
  │ → localStorage.setItem() ← Storage!                    │
  │ → navigator.geolocation ← Device Access!               │
  │ → new Audio("song.mp3") ← Media!                      │
  │ → canvas.getContext("2d") ← Graphics!                  │
  │                                                          │
  │ "JavaScript is a CONTROL PANEL for all of these          │
  │  features that could almost constitute an                │
  │  OPERATING SYSTEM." — Will Sentance                     │
  │                                                          │
  │ → Spotify, Slack, VS Code = Chromium bọc lại!          │
  │ → Web browser = nền tảng ứng dụng phổ quát!           │
  └──────────────────────────────────────────────────────────┘
```

---

## §2. Sơ Đồ Toàn Cảnh Web Browser — "Tất Cả Thành Phần Kết Nối Ra Sao?"

> Will: _"The only file type we can open directly in the web browser is HTML."_

### Bối cảnh — Bức tranh toàn cảnh

Will vẽ một "schematic diagram" (sơ đồ tổng quan) của web browser và đây là bức tranh quan trọng nhất để hiểu mọi thứ tiếp theo. Browser bao gồm nhiều thành phần riêng biệt nhưng **kết nối** với nhau:

Điểm bắt đầu luôn là **HTML** — đây là file duy nhất browser có thể mở trực tiếp. Khi bạn truy cập `www.wikipedia.org`, browser tải về file HTML và bắt đầu parse. Từ HTML, mọi thứ khác được kích hoạt: CSS được tải qua `<link>`, JavaScript được tải qua `<script>`, hình ảnh được tải qua `<img>`.

Will nhấn mạnh rằng HTML parser đọc file **line by line** (từng dòng) và thêm element vào **C++ list** (DOM). Đồng thời, khi gặp thẻ `<script>`, HTML parser **dừng lại** và kích hoạt JavaScript engine chạy.

```
SƠ ĐỒ TOÀN CẢNH WEB BROWSER:
═══════════════════════════════════════════════════════════════

  ┌─────────────────────────────────────────────────────────┐
  │                    🌐 WEB BROWSER                       │
  │                                                         │
  │  ┌──────────────┐     ┌──────────────────────────┐     │
  │  │  HTML FILE    │     │  CSS FILE                 │     │
  │  │  app.html     │     │  styles.css               │     │
  │  │              ─┼──→ │                           │     │
  │  └──────┬───────┘     └──────────┬───────────────┘     │
  │         │ parse                   │ parse               │
  │         ▼                         ▼                     │
  │  ┌──────────────┐     ┌──────────────────────────┐     │
  │  │  HTML PARSER  │     │  CSS PARSER               │     │
  │  │  (line by     │     │  → CSSOM!                │     │
  │  │   line!)      │     └──────────────────────────┘     │
  │  └──────┬───────┘                                       │
  │         │ tạo nodes                                     │
  │         ▼                                               │
  │  ┌──────────────────────────────────────────────┐       │
  │  │         C++ LIST OF ELEMENTS (DOM!)           │       │
  │  │  ┌─────────┬─────────┬─────────┐             │       │
  │  │  │ input   │ div     │ script  │ ← từ HTML!  │       │
  │  │  └─────────┴─────────┴────┬────┘             │       │
  │  │                            │                  │       │
  │  │  Layout + Render Engine    │ kích hoạt!      │       │
  │  │  → 60fps → Pixels! 🖥️    │                  │       │
  │  └────────────────────────────┼──────────────────┘       │
  │                               │                          │
  │                               ▼                          │
  │  ┌──────────────────────────────────────────────┐       │
  │  │         JAVASCRIPT ENGINE (V8!)               │       │
  │  │                                               │       │
  │  │  ┌─────────────────┐  ┌──────────────────┐  │       │
  │  │  │ MEMORY (store!) │  │ THREAD of         │  │       │
  │  │  │ → data mutable! │  │ EXECUTION         │  │       │
  │  │  │ → có thể đổi!  │  │ → line by line!  │  │       │
  │  │  └─────────────────┘  └──────────────────┘  │       │
  │  │                                               │       │
  │  │  ┌─────────────────────────────────────────┐ │       │
  │  │  │ CALL STACK — danh sách function đang    │ │       │
  │  │  │ chạy! global() → fn1() → fn2()        │ │       │
  │  │  └─────────────────────────────────────────┘ │       │
  │  └──────────────────────────────────────────────┘       │
  │                                                         │
  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │
  │  │ 🟣 CONSOLE   │  │ 🟣 TIMERS   │  │ 🟣 NETWORK │  │
  │  │ (Dev Tools!) │  │ (setTimeout)│  │ (fetch!)   │  │
  │  └──────────────┘  └──────────────┘  └─────────────┘  │
  │                                                         │
  │  → Tất cả thành phần 🟣 = NGOÀI JavaScript!           │
  │  → JavaScript truy cập chúng qua Web Browser APIs!    │
  └─────────────────────────────────────────────────────────┘

  ĐIỂM QUAN TRỌNG:
  ┌──────────────────────────────────────────────────────────┐
  │ ① HTML = file DUY NHẤT browser mở trực tiếp!           │
  │ ② HTML parser = line by line, tạo DOM nodes!           │
  │ ③ Gặp <script> = kích hoạt JavaScript engine!         │
  │ ④ JavaScript engine = memory + thread + call stack!    │
  │ ⑤ Console, Timer, Network = NGOÀI JS, truy cập qua API│
  └──────────────────────────────────────────────────────────┘
```

---

## §3. JavaScript Runtime — "Memory + Thread + Call Stack!"

> Will: _"JavaScript engine is gonna have a store of data that can be changed. A thread of execution that can thread through and execute code line by line."_

### Bối cảnh — Ba thành phần cốt lõi

Will phân tích JavaScript engine thành ba thành phần cốt lõi:

**① Memory (Bộ nhớ):** Nơi lưu trữ data — biến, object, function. Data này **có thể thay đổi** (mutable). Đây là điểm khác biệt CỐT LÕI so với HTML (data cố định, lưu một lần) và DOM (có data nhưng không chạy code trên nó). JavaScript memory = data KHẢ BIẾN!

**② Thread of Execution (Luồng thực thi):** JavaScript chạy code **từng dòng một** (line by line). Đây là single-threaded — tại một thời điểm, chỉ MỘT dòng code chạy. Will nhấn mạnh: thread "đi qua" (thread through) code và thực thi — đọc dòng 1, thực hiện, đọc dòng 2, thực hiện...

**③ Call Stack (Ngăn xếp gọi hàm):** Danh sách các function **đang chạy**. Khi JavaScript bắt đầu, function `global()` (toàn bộ file code) được đẩy vào call stack. Khi gọi function mới, nó được đẩy lên đỉnh stack. Khi function hoàn thành, nó được lấy ra khỏi stack. Call stack giúp JavaScript **biết mình đang ở đâu** trong code.

```
JAVASCRIPT RUNTIME — 3 THÀNH PHẦN:
═══════════════════════════════════════════════════════════════

  CHẠY CODE THỰC TẾ:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │  let post = "Hi!"          ← Dòng 1: lưu vào memory!  │
  │  post = "Hi 👋"             ← Dòng 2: thay đổi data!   │
  │  console.log(post)          ← Dòng 3: truy cập API!    │
  │                                                          │
  │  MEMORY:           CALL STACK:                           │
  │  ┌──────────────┐ ┌──────────────┐                      │
  │  │ post: "Hi 👋" │ │              │                      │
  │  │              │ │ global()     │ ← đang chạy!        │
  │  └──────────────┘ └──────────────┘                      │
  │                                                          │
  │  THREAD OF EXECUTION:                                    │
  │  → Dòng 1: let post = "Hi!" → lưu vào memory!        │
  │  → Dòng 2: post = "Hi 👋" → CẬP NHẬT memory!         │
  │  → Dòng 3: console.log(post) → truy cập Console API!  │
  │                                                          │
  │  "JavaScript sees data, runs code to change that data,  │
  │   does it inside execution contexts."                    │
  └──────────────────────────────────────────────────────────┘
```

### Execution Context — "Phòng thí nghiệm riêng"

Mỗi khi function được gọi, JavaScript tạo một **execution context** (ngữ cảnh thực thi) mới — giống như một "phòng thí nghiệm riêng" với memory riêng (local variables) và thread riêng. Will gọi đây là "many stores of data" — nhiều kho lưu trữ data, mỗi function có kho riêng.

---

## §4. Closure & Asynchronicity — "Hai Tính Năng Đặc Biệt!"

> Will: _"JavaScript lets us have code saved in functions arbitrarily execute, run later on out of order — known as asynchronicity. And they're gonna need the data from when those functions were saved — known as closure."_

### Bối cảnh — Hai "siêu năng lực" ngoài basic

Will nhắc đến hai tính năng đặc biệt khiến JavaScript mạnh hơn "basic language":

**① Asynchronicity (bất đồng bộ):** Function có thể được **lưu** và **chạy SAU** — không theo thứ tự định nghĩa. Ví dụ: `setTimeout(myFunc, 1000)` — `myFunc` được lưu, 1 giây sau mới chạy. Hoặc `addEventListener("click", handleClick)` — `handleClick` được lưu, khi người dùng click mới chạy. Đây là nền tảng cho mọi tương tác UI!

Will gọi đây là "out of order" — function chạy **không theo thứ tự** viết code. Và cụ thể với UI, function chạy khi **user actions happening** — nghĩa là khi người dùng tương tác.

**② Closure (bao đóng/backpack):** Khi function được lưu để chạy sau, nó **mang theo** data từ môi trường nơi nó được **tạo ra**. Will gọi closure là "the backpack" — ba lô mang theo data. Đây là tính năng yêu thích của Will trong JavaScript!

```
HAI TÍNH NĂNG ĐẶC BIỆT:
═══════════════════════════════════════════════════════════════

  ① ASYNCHRONICITY — "Out of order execution!":
  ┌──────────────────────────────────────────────────────────┐
  │ Dòng 1: function handleClick() { likes++ }              │
  │ Dòng 2: button.addEventListener("click", handleClick)   │
  │ Dòng 3: console.log("Tiếp tục code khác!")             │
  │                                                          │
  │ → Dòng 1: lưu function! Chưa chạy!                    │
  │ → Dòng 2: đăng ký! "Khi user click → chạy dòng 1!"  │
  │ → Dòng 3: chạy ngay! JavaScript tiếp tục!             │
  │                                                          │
  │ ... 5 phút sau, user click ...                          │
  │ → handleClick() mới chạy! OUT OF ORDER!                │
  │                                                          │
  │ "Functions arbitrarily execute, run LATER ON             │
  │  out of order — known as ASYNCHRONICITY."               │
  └──────────────────────────────────────────────────────────┘

  ② CLOSURE — "The Backpack! 🎒":
  ┌──────────────────────────────────────────────────────────┐
  │ function createCounter() {                               │
  │   let count = 0;  ← data LOCAL!                        │
  │   return function increment() {                         │
  │     count++;  ← truy cập data từ NƠI ĐƯỢC TẠO!       │
  │     return count;                                       │
  │   }                                                      │
  │ }                                                        │
  │                                                          │
  │ const myCounter = createCounter();                       │
  │ → createCounter() chạy xong, biến mất!                │
  │ → NHƯNG count = 0 vẫn SỐNG! Trong "backpack"!         │
  │                                                          │
  │ myCounter(); // 1 ← count++ từ backpack!               │
  │ myCounter(); // 2 ← count++ tiếp!                      │
  │ myCounter(); // 3 ← data VẪNLUÔN ở đó!               │
  │                                                          │
  │ "They're gonna need the data from when those functions  │
  │  were saved, defined. Known as CLOSURE.                  │
  │  That's the BACKPACK." — Will 🎒                        │
  └──────────────────────────────────────────────────────────┘

  TẠI SAO QUAN TRỌNG CHO UI:
  ┌──────────────────────────────────────────────────────────┐
  │ → Asynchronicity = function chạy khi user tương tác!   │
  │ → Closure = function mang theo STATE khi chạy sau!     │
  │ → Kết hợp = event handler giữ được state hiện tại!    │
  │                                                          │
  │ Ví dụ: button.addEventListener("click", () => {        │
  │   likes++;  ← closure giữ `likes` từ scope ngoài!     │
  │   updateView();  ← async — chạy khi user click!       │
  │ })                                                       │
  └──────────────────────────────────────────────────────────┘
```

---

## §5. Console — "Không Phải JavaScript! Nằm Ngoài Engine!"

> Will: _"The console is NOT in JavaScript, not a chance. It sits as a separate feature as part of the dev tools."_

### Bối cảnh — Console = Web Browser API, không phải JS!

Đây là insight mà nhiều developer không biết: `console` **KHÔNG** phải là tính năng JavaScript! Nó là tính năng của **Dev Tools** trong browser. Will nói rõ: "not a chance" — tuyệt đối không phải JavaScript.

Vậy tại sao chúng ta có thể viết `console.log()` trong JS? Vì khi JavaScript engine khởi động trong browser, memory của nó được **tự động populate** (nạp sẵn) với một object tên `console`. Object này có nhiều method: `log`, `error`, `table`, `time`, `dir`. Nhưng khi chúng ta **gọi** các method này, chúng KHÔNG làm gì trong JavaScript — thay vào đó, chúng **gửi thông tin ra ngoài** browser, đến Dev Tools console.

Will và học viên liệt kê các phương thức của console:

- `console.log()` — in thông tin
- `console.error()` — in lỗi (màu đỏ)
- `console.table()` — in dạng bảng
- `console.time()` — đếm thời gian
- `console.dir()` — hiển thị cấu trúc object

Tất cả đều là **Web Browser APIs** — tính năng browser mà JavaScript "giao tiếp" (interface) với.

```
CONSOLE — NẰM NGOÀI JAVASCRIPT:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────     ┌──────────────────────┐
  │ JAVASCRIPT ENGINE        │     │ 🟣 DEV TOOLS        │
  │                          │     │ ┌──────────────────┐│
  │ memory:                  │     │ │ CONSOLE           ││
  │ ┌──────────────────────┐ │     │ │                  ││
  │ │ console: {           │ │     │ │ > "Hi!"          ││
  │ │   log: ƒ ──────────────┼────▶│ │ > Error: ...     ││
  │ │   error: ƒ ────────────┼────▶│ │ > ┌─────┬────┐  ││
  │ │   table: ƒ ────────────┼────▶│ │   │ key │ val│  ││
  │ │   time: ƒ  ────────────┼────▶│ │   └─────┴────┘  ││
  │ │   dir: ƒ   ────────────┼────▶│ │                  ││
  │ │ }                    │ │     │ └──────────────────┘│
  │ └──────────────────────┘ │     └──────────────────────┘
  │                          │
  │ "console is NOT in        │
  │  JavaScript, not a chance.│
  │  It sits as a SEPARATE    │
  │  feature as part of the   │
  │  dev tools."              │
  └──────────────────────────┘

  GIỐNG NHƯ console, CÓ NHIỀU APIs KHÁC:
  ┌──────────────────────────────────────────────────────────┐
  │ → console.log() = gửi text đến Dev Tools!              │
  │ → fetch() = gửi HTTP request qua Networking!           │
  │ → setTimeout() = đặt timer qua Timer feature!          │
  │ → document.querySelector() = truy cập DOM (C++)!       │
  │                                                          │
  │ "These are all functions that when run, they are what    │
  │  they call technically WEB BROWSER APIs."               │
  │ "Features of the web browser that we API interface      │
  │  with FROM JavaScript."                                  │
  └──────────────────────────────────────────────────────────┘
```

---

## §6. Document Object — "Cánh Cổng Vào DOM Từ JavaScript!"

> Will: _"We do get automatically in JavaScript a regular old object by the name of document. And it's gonna have a HIDDEN LINK."_

### Bối cảnh — Document = cầu nối JS ↔ DOM

Sau khi thấy `console` là Web Browser API, Will chuyển sang **API quan trọng nhất cho UI engineering**: object `document`. Giống console, `document` được **tự động tạo** trong JavaScript memory khi engine khởi động. Nhưng document có điều đặc biệt: nó có **hidden link** (liên kết ẩn) đến DOM — danh sách element C++ trên trang.

Will giải thích tại sao cần "hidden link": trong JavaScript, chúng ta chỉ có thể lưu trữ các **data structure** cơ bản — numbers, strings, objects, arrays, booleans. Không tồn tại kiểu dữ liệu nào là "hidden link to another part of the web browser" — nó không phải number, không phải string, không phải gì hết!

Vậy JavaScript giải quyết thế nào? Bằng cách lưu hidden link **bên trong một object** — dưới dạng **hidden property** (thuộc tính ẩn). Object `document` là một JavaScript object bình thường, nhưng bên trong nó có thuộc tính ẩn trỏ đến C++ DOM.

```
DOCUMENT OBJECT — CÁNH CỔNG VÀO DOM:
═══════════════════════════════════════════════════════════════

  JAVASCRIPT MEMORY:
  ┌──────────────────────────────────────────────────────────┐
  │ document = {                                             │
  │   [[hidden_link]] ──────────────────▶ C++ DOM LIST!     │
  │                                                          │
  │   querySelector: ƒ ← tìm element theo selector!       │
  │   getElementById: ƒ ← tìm element theo ID!            │
  │   createElement: ƒ  ← tạo element MỚI!               │
  │   createTextNode: ƒ ← tạo text node MỚI!             │
  │   ... 30-40 methods khác!                               │
  │ }                                                        │
  │                                                          │
  │ "We do get automatically in JavaScript a regular old     │
  │  object by the name of DOCUMENT."                       │
  │                                                          │
  │ "And it's gonna have a HIDDEN LINK."                    │
  │ "A C++ pointer — a reference, a link to the exact       │
  │  place in the computer's memory store where this        │
  │  list [DOM] is." — Will                                 │
  └──────────────────────────────────────────────────────────┘

  TẠI SAO "HIDDEN"?
  ┌──────────────────────────────────────────────────────────┐
  │ Trong JavaScript ta chỉ lưu được:                       │
  │ → numbers, strings, booleans, objects, arrays            │
  │                                                          │
  │ "Hidden link to C++ memory" = KHÔNG phải data type nào! │
  │ → Không phải number!                                    │
  │ → Không phải string!                                    │
  │ → Không phải gì hết!                                    │
  │                                                          │
  │ Giải pháp: giấu bên trong OBJECT dưới dạng HIDDEN      │
  │ PROPERTY — thuộc tính ẩn không console.log được!        │
  │                                                          │
  │ Giống [[Prototype]] (prototype chain!) hoặc             │
  │ [[Scope]] (closure backpack!) — toàn hidden properties! │
  └──────────────────────────────────────────────────────────┘
```

### Document "chock-a-block" với methods

Will dùng thành ngữ tiếng Anh **"chock-a-block"** (đầy ắp) để mô tả object document — nó chứa hàng chục methods. Tất cả các method này, khi được gọi, KHÔNG chỉ làm việc trong JavaScript — chúng **đi theo hidden link** ra ngoài C++ DOM và thao tác trên đó.

---

## §7. Hidden Links — "Thuộc Tính Ẩn Kết Nối JS ↔ C++!"

> Will: _"Whenever you see in JavaScript hidden links out to other parts of the web browser, know that it's probably being stored as a hidden property on an object."_

### Bối cảnh — Pattern "hidden property" xuất hiện nhiều lần

Will chỉ ra một **pattern lặp lại** trong JavaScript: mỗi khi cần kết nối đến phần khác của browser, JavaScript sử dụng **hidden property trên object**. Pattern này xuất hiện ở nhiều nơi:

1. **`document`** — hidden link đến DOM (C++ list of elements)
2. **`console`** — hidden link đến Dev Tools console
3. **Closure** — `[[Scope]]` hidden property giữ reference đến scope ngoài
4. **Prototype chain** — `[[Prototype]]` hidden property trỏ đến prototype object
5. **DOM accessor objects** — hidden link đến specific DOM element (sẽ thấy ở phần 8-9)

Về mặt kỹ thuật, hidden link trong `document` là **C++ pointer** — một tham chiếu đến vị trí chính xác trong bộ nhớ máy tính nơi DOM list được lưu trữ.

```
HIDDEN LINKS — PATTERN LẶP LẠI:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────────────┐
  │ PATTERN: JavaScript object + hidden property + link out! │
  │                                                          │
  │ ① document:                                             │
  │    └── [[link]] ──▶ C++ DOM (list of elements!)        │
  │                                                          │
  │ ② console:                                              │
  │    └── [[link]] ──▶ Dev Tools Console!                 │
  │                                                          │
  │ ③ closure function:                                     │
  │    └── [[Scope]] ──▶ scope ngoài (backpack!)           │
  │                                                          │
  │ ④ any object:                                           │
  │    └── [[Prototype]] ──▶ prototype object!             │
  │                                                          │
  │ ⑤ jsDiv (sẽ thấy!):                                   │
  │    └── [[link]] ──▶ specific C++ DOM element!          │
  │                                                          │
  │ "Whenever you see hidden links out to other parts       │
  │  of the web browser, know that it's probably being      │
  │  stored as a HIDDEN PROPERTY on an OBJECT."             │
  └──────────────────────────────────────────────────────────┘
```

---

## §8. Web Browser APIs — "JavaScript = Bảng Điều Khiển!"

> Will: _"JavaScript is like a CONTROL PANEL for all of these features that could almost constitute an operating system."_

### Bối cảnh — JS thuần vs Browser APIs

Will kết thúc phần này bằng việc phân biệt rõ: **JavaScript engine thuần** (lưu data + chạy code) vs **Web Browser APIs** (tất cả tính năng "bên ngoài" mà JS truy cập).

Một học viên hỏi: "Làm sao biết function nào là JavaScript built-in vs Browser API?" Will trả lời: "Kiểm tra MDN. Nếu MDN liệt kê trong Web APIs, đó là browser feature." Và thêm: "Hầu hết mọi thứ chúng ta sử dụng 'hằng ngày' đều là Web APIs — DOM, fetch, timer, console. JavaScript thuần chỉ lưu data và chạy code."

Will cũng đề cập đến **Chromium** — engine browser mà Chrome, Edge, Opera, Brave sử dụng. Ông nhấn mạnh: Spotify, Slack, VS Code, Atom — tất cả app desktop phổ biến đều **chạy trên Chromium** (thông qua Electron). "You basically got a full operating system, and then just wrapped it up to make it like Slack app."

---

## §9. Tự Implement: JavaScript Runtime Mô Phỏng

```javascript
// ═══════════════════════════════════
// Mô phỏng JavaScript Runtime
// Tự viết từ đầu, không dùng framework!
// ═══════════════════════════════════

// ── Phần 1: Memory — Lưu trữ data ──

class JSMemory {
  constructor() {
    this.variables = new Map();
  }

  declare(name, value, kind = "let") {
    if (kind === "const" && this.variables.has(name)) {
      throw new Error(`Cannot redeclare const '${name}'`);
    }
    this.variables.set(name, { value, kind, mutable: kind !== "const" });
    console.log(`  Memory: ${name} = ${JSON.stringify(value)}`);
  }

  assign(name, value) {
    const variable = this.variables.get(name);
    if (!variable) throw new Error(`${name} is not defined`);
    if (!variable.mutable) throw new Error(`Cannot reassign const '${name}'`);
    variable.value = value;
    console.log(`  Memory: ${name} reassigned → ${JSON.stringify(value)}`);
  }

  get(name) {
    const variable = this.variables.get(name);
    if (!variable) throw new Error(`${name} is not defined`);
    return variable.value;
  }
}

// ── Phần 2: Call Stack ──

class CallStack {
  constructor() {
    this.stack = [];
  }

  push(fnName) {
    this.stack.push(fnName);
    console.log(`  Call Stack: [${this.stack.join(" → ")}]`);
  }

  pop() {
    const removed = this.stack.pop();
    console.log(
      `  Call Stack: [${this.stack.join(" → ")}] (${removed} finished)`,
    );
    return removed;
  }

  current() {
    return this.stack[this.stack.length - 1];
  }
}

// ── Phần 3: Web Browser APIs (NGOÀI JavaScript!) ──

class WebBrowserAPIs {
  constructor() {
    this.console = { log: (msg) => console.log(`  🟣 Console: ${msg}`) };
    this.dom = []; // C++ DOM elements!
    this.timers = [];
  }

  // document object — hidden link to DOM
  createDocumentObject() {
    return {
      _hiddenLink: this.dom, // [[link]] → C++ DOM!
      querySelector: (selector) => {
        const found = this.dom.find((el) => el.type === selector);
        if (!found) return null;
        // Tạo accessor object với hidden link!
        return {
          _hiddenLink: found,
          get textContent() {
            return found.text;
          },
          set textContent(val) {
            found.text = val;
            console.log(`  🟣 DOM: Set ${selector}.textContent = "${val}"`);
          },
        };
      },
    };
  }
}

// ── Phần 4: JavaScript Engine ──

class JSEngine {
  constructor(browserAPIs) {
    this.memory = new JSMemory();
    this.callStack = new CallStack();
    this.browser = browserAPIs;

    // Auto-populate memory với browser APIs!
    this.memory.declare("console", this.browser.console, "const");
    this.memory.declare(
      "document",
      this.browser.createDocumentObject(),
      "const",
    );
  }

  run(code) {
    console.log("\n═══ JavaScript Engine START ═══");
    this.callStack.push("global()");
    code(this);
    this.callStack.pop();
    console.log("═══ JavaScript Engine END ═══\n");
  }
}

// ── Phần 5: Chạy thử! ──

const browser = new WebBrowserAPIs();
// HTML parser đã thêm elements:
browser.dom.push({ type: "input", value: "" });
browser.dom.push({ type: "div", text: "" });
browser.dom.push({ type: "script", src: "app.js" });

const engine = new JSEngine(browser);

engine.run((js) => {
  // let post = "Hi!"
  js.memory.declare("post", "Hi!");

  // const jsDiv = document.querySelector("div")
  const doc = js.memory.get("document");
  const jsDiv = doc.querySelector("div");
  js.memory.declare("jsDiv", jsDiv, "const");

  // jsDiv.textContent = post
  const post = js.memory.get("post");
  jsDiv.textContent = post; // → DOM updated!

  // console.log(post)
  const consoleObj = js.memory.get("console");
  consoleObj.log(post);
});
```

---

## §10. 🔬 Deep Analysis Patterns

### 10.1 Pattern ①: Chuỗi 5-Whys

```
5 WHYS: TẠI SAO JAVASCRIPT "ĐƠN GIẢN" MÀ MẠNH?
═══════════════════════════════════════════════════════════════

  WHY ①: Tại sao JS phổ biến nhất thế giới?
  └→ Vì nó chạy trong web browser — nền tảng phổ biến
     nhất! Mọi thiết bị có browser!

  WHY ②: Tại sao browser làm JS mạnh?
  └→ Browser có tính năng "gần OS": networking, storage,
     graphics, media, device access! JS truy cập tất cả!

  WHY ③: Tại sao console không phải JavaScript?
  └→ Vì console là tính năng Dev Tools! JS chỉ có object
     `console` với hidden link RA NGOÀI engine! Giống
     fetch, setTimeout, document — tất cả đều NGOÀI JS!

  WHY ④: Tại sao dùng hidden property?
  └→ Vì JS chỉ lưu được: number, string, object, array,
     boolean. "Hidden link to C++" = không phải data type
     nào! Nên giấu bên trong object dưới dạng hidden property!

  WHY ⑤: Tại sao document là cánh cổng quan trọng nhất?
  └→ Vì document có hidden link đến DOM — nơi pixels
     được hiển thị! Thay đổi DOM = thay đổi pixels!
     Đây là CẦU NỐI duy nhất giữa JS data và visual output!
```

### 10.2 Pattern ②: Bản đồ luồng data

```
BẢN ĐỒ — JAVASCRIPT → PIXELS:
═══════════════════════════════════════════════════════════════

  JavaScript Memory
  ┌─────────────────┐
  │ post = "Hi!"    │
  └────────┬────────┘
           │ document.querySelector("div")
           │ → tìm div trên DOM
           │ → tạo accessor object
           │ → hidden link tới C++ div
           ▼
  ┌─────────────────┐
  │ jsDiv = {       │
  │   [[link]] → ──┼──▶ C++ DOM: div
  │   textContent   │         │
  │ }               │         │ set text = "Hi!"
  └─────────────────┘         │
                              ▼
                    Layout + Render Engine
                              │
                              ▼ 60fps!
                         🖥️ PIXELS!
                         Hiện "Hi!" trên trang!

  "It becomes PROFOUNDLY POWERFUL if we can save data,
   change it, and then use it in the DOM."
```

---

## Self-Assessment Checklist

```
CHECKLIST — SAU KHI HỌC PHẦN 7:
═══════════════════════════════════════════════════════════════

  JAVASCRIPT RUNTIME:
  [ ] Memory = lưu data khả biến (mutable!)
  [ ] Thread of execution = chạy code line by line!
  [ ] Call Stack = danh sách function đang chạy!
  [ ] Execution Context = "phòng thí nghiệm" riêng mỗi function!
  [ ] "JavaScript is a pretty basic language."

  HAI TÍNH NĂNG ĐẶC BIỆT:
  [ ] Asynchronicity = function chạy SAU, không theo thứ tự!
  [ ] Closure = "backpack" — mang theo data từ nơi được tạo!
  [ ] Kết hợp = event handler có thể giữ state!

  WEB BROWSER APIs:
  [ ] Console = NGOÀI JavaScript! Là tính năng Dev Tools!
  [ ] console.log/error/table/time/dir = gửi data RA NGOÀI!
  [ ] "All functions that when run are Web Browser APIs."

  DOCUMENT OBJECT:
  [ ] Tự động tạo khi JS engine khởi động!
  [ ] Hidden link (C++ pointer) đến DOM!
  [ ] "Chock-a-block" với 30-40 methods!
  [ ] querySelector, getElementById, createElement, v.v.!

  HIDDEN LINKS:
  [ ] Pattern lặp lại: object + hidden property + link out!
  [ ] document [[link]] → DOM
  [ ] console [[link]] → Dev Tools
  [ ] closure [[Scope]] → scope ngoài
  [ ] prototype [[Prototype]] → prototype object
  [ ] "Stored as hidden property on an object."

  JS = BẢNG ĐIỀU KHIỂN:
  [ ] JS thuần = chỉ lưu data + chạy code!
  [ ] Browser APIs = DOM, fetch, timer, console, media, v.v.!
  [ ] "Control panel for an operating system!"
  [ ] Spotify/Slack/VSCode = Chromium bọc lại!

  TIẾP THEO → Phần 8: WebIDL & WebCore!
  → "Cách JavaScript giao tiếp với C++ DOM!"
```
