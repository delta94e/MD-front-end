# JavaScript & HTML Core — Q46–Q62 — Deep Dive

> 📅 2026-02-12 · ⏱ 18 phút đọc
>
> Tổng hợp Q46–Q62: Handwritten Promise/A+, async/await,
> instanceof, throttle/debounce, HTML vs XHTML vs HTML5,
> semantic tags, Web Storage, browser engines.
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | Chủ đề: JavaScript / HTML / Browser

---

## Mục Lục

0. [Handwritten Promise (Q46)](#q46)
1. [async/await & Handwritten (Q47)](#q47)
2. [Handwritten instanceof (Q48)](#q48)
3. [Throttle & Debounce (Q49)](#q49)
4. [HTML / XML / XHTML / HTML5 (Q50–Q51)](#q50)
5. [Inline / Block / Void Elements (Q52)](#q52)
6. [link vs @import (Q53)](#q53)
7. [Semantic Tags (Q54)](#q54)
8. [property vs attribute (Q55)](#q55)
9. [HTML5 Features (Q56)](#q56)
10. [Web Storage vs Cookie (Q59)](#q59)
11. [Browser Engines (Q60)](#q60)
12. [Multi-Domain Resources (Q62)](#q62)
13. [Tóm Tắt & Checklist](#tóm-tắt)

---

## Q46. Handwritten Promise

### Promise cơ bản — Nguyên lý

```
PROMISE — NGUYÊN LÝ:
═══════════════════════════════════════════════════════════════

  Promise = container chứa kết quả của async operation

  3 STATES (không thể đảo ngược!):
  ┌──────────┐     resolve()    ┌───────────┐
  │ PENDING  │ ─────────────→  │ FULFILLED │
  │ (chờ)    │                  │ (thành công)│
  └──────────┘                  └───────────┘
       │
       │ reject()               ┌───────────┐
       └──────────────────────→ │ REJECTED  │
                                │ (thất bại)│
                                └───────────┘

  RULES (Promise/A+):
  ① 3 states: pending → fulfilled HOẶC pending → rejected
  ② Một khi chuyển state → KHÔNG thể quay lại
  ③ value = giá trị success, reason = giá trị failure
  ④ Phải có .then(onFulfilled, onRejected)
  ⑤ then throw error → truyền vào onRejected của .then tiếp
```

### Step 1: Constructor cơ bản

```javascript
class MyPromise {
  // 3 states
  static PENDING = "pending";
  static FULFILLED = "fulfilled";
  static REJECTED = "rejected";

  constructor(executor) {
    this.status = MyPromise.PENDING;
    this.value = undefined; // Giá trị success
    this.reason = undefined; // Giá trị failure
    this.onFulfilledCallbacks = []; // then callbacks queue
    this.onRejectedCallbacks = [];

    // resolve & reject
    const resolve = (value) => {
      if (this.status === MyPromise.PENDING) {
        this.status = MyPromise.FULFILLED;
        this.value = value;
        // Chạy tất cả callbacks đang chờ
        this.onFulfilledCallbacks.forEach((fn) => fn());
      }
    };

    const reject = (reason) => {
      if (this.status === MyPromise.PENDING) {
        this.status = MyPromise.REJECTED;
        this.reason = reason;
        this.onRejectedCallbacks.forEach((fn) => fn());
      }
    };

    // Executor chạy NGAY khi new Promise
    try {
      executor(resolve, reject);
    } catch (error) {
      reject(error); // Executor throw → auto reject
    }
  }
}
```

```
CONSTRUCTOR — KEY POINTS:
═══════════════════════════════════════════════════════════════

  ① executor(resolve, reject) chạy NGAY (sync)
  ② resolve/reject chỉ hoạt động khi status = PENDING
     → Gọi resolve sau reject → BỊ BỎ QUA (状态不可逆)
  ③ callbacks array: cho trường hợp .then gọi TRƯỚC resolve
     → Khi resolve → flush tất cả callbacks
  ④ try/catch: executor throw error → auto reject
```

### Step 2: .then() method

```javascript
then(onFulfilled, onRejected) {
    // Default handlers
    onFulfilled = typeof onFulfilled === 'function'
        ? onFulfilled : value => value;          // Pass through
    onRejected = typeof onRejected === 'function'
        ? onRejected : reason => { throw reason }; // Re-throw

    // then PHẢI return Promise mới → chaining!
    const promise2 = new MyPromise((resolve, reject) => {
        const fulfilledTask = () => {
            // Dùng queueMicrotask đảm bảo async
            queueMicrotask(() => {
                try {
                    const x = onFulfilled(this.value);
                    resolvePromise(promise2, x, resolve, reject);
                } catch (error) {
                    reject(error);
                }
            });
        };

        const rejectedTask = () => {
            queueMicrotask(() => {
                try {
                    const x = onRejected(this.reason);
                    resolvePromise(promise2, x, resolve, reject);
                } catch (error) {
                    reject(error);
                }
            });
        };

        // 3 cases dựa trên current status
        if (this.status === MyPromise.FULFILLED) {
            fulfilledTask();
        } else if (this.status === MyPromise.REJECTED) {
            rejectedTask();
        } else {
            // PENDING → save callbacks, chờ resolve/reject
            this.onFulfilledCallbacks.push(fulfilledTask);
            this.onRejectedCallbacks.push(rejectedTask);
        }
    });

    return promise2;
}
```

```
.then() — KEY INSIGHTS:
═══════════════════════════════════════════════════════════════

  ① then PHẢI return Promise MỚI (chaining)
     → p.then().then().then() hoạt động

  ② Default handlers:
     → onFulfilled mặc định = value => value (pass through)
     → onRejected mặc định = reason => { throw reason } (re-throw)
     → Cho phép: p.then().catch(err => ...) hoạt động

  ③ 3 trường hợp execution:
     → FULFILLED: chạy onFulfilled NGAY (queueMicrotask)
     → REJECTED: chạy onRejected NGAY
     → PENDING: save vào callbacks array, chờ resolve/reject

  ④ queueMicrotask:
     → Đảm bảo .then callbacks chạy ASYNC (microtask)
     → Giống native Promise behavior
```

### Step 3: resolvePromise — xử lý chain

```javascript
function resolvePromise(promise2, x, resolve, reject) {
  // Tránh circular reference
  if (promise2 === x) {
    return reject(new TypeError("Circular reference detected"));
  }

  if (x instanceof MyPromise) {
    // x là Promise → đợi nó settle
    x.then(resolve, reject);
  } else if (x !== null && (typeof x === "object" || typeof x === "function")) {
    // x là thenable (có .then method)
    let called = false;
    try {
      let then = x.then;
      if (typeof then === "function") {
        then.call(
          x,
          (y) => {
            if (called) return;
            called = true;
            resolvePromise(promise2, y, resolve, reject);
          },
          (r) => {
            if (called) return;
            called = true;
            reject(r);
          },
        );
      } else {
        resolve(x); // Object nhưng không có .then
      }
    } catch (error) {
      if (called) return;
      called = true;
      reject(error);
    }
  } else {
    // x là primitive value → resolve ngay
    resolve(x);
  }
}
```

```
resolvePromise — TẠI SAO PHỨC TẠP?
═══════════════════════════════════════════════════════════════

  .then callback có thể return:
  ① Primitive (42, 'hello') → resolve(x) ngay
  ② Promise → đợi nó settle → resolve/reject theo
  ③ Thenable (object có .then) → gọi .then như Promise
  ④ Circular (promise2 === x) → TypeError!

  called flag:
  → Thenable có thể gọi resolve + reject cùng lúc
  → called = true → chỉ cho phép 1 lần → đảm bảo safe
```

### Step 4: Static methods

```javascript
// Promise.resolve
static resolve(value) {
    if (value instanceof MyPromise) return value;
    return new MyPromise(resolve => resolve(value));
}

// Promise.reject
static reject(reason) {
    return new MyPromise((_, reject) => reject(reason));
}

// Promise.all — tất cả phải resolve
static all(promises) {
    return new MyPromise((resolve, reject) => {
        const results = [];
        let count = 0;
        promises.forEach((p, i) => {
            MyPromise.resolve(p).then(
                value => {
                    results[i] = value; // Giữ thứ tự!
                    count++;
                    if (count === promises.length) resolve(results);
                },
                reject // Bất kỳ reject → reject ngay
            );
        });
        if (promises.length === 0) resolve([]);
    });
}

// Promise.race — ai xong trước dùng trước
static race(promises) {
    return new MyPromise((resolve, reject) => {
        promises.forEach(p => {
            MyPromise.resolve(p).then(resolve, reject);
        });
    });
}

// Promise.allSettled — đợi TẤT CẢ, không reject
static allSettled(promises) {
    return new MyPromise((resolve) => {
        const results = [];
        let count = 0;
        promises.forEach((p, i) => {
            MyPromise.resolve(p).then(
                value => {
                    results[i] = { status: 'fulfilled', value };
                    if (++count === promises.length) resolve(results);
                },
                reason => {
                    results[i] = { status: 'rejected', reason };
                    if (++count === promises.length) resolve(results);
                }
            );
        });
        if (promises.length === 0) resolve([]);
    });
}

// Promise.any — ai resolve trước dùng trước
static any(promises) {
    return new MyPromise((resolve, reject) => {
        const errors = [];
        let count = 0;
        promises.forEach((p, i) => {
            MyPromise.resolve(p).then(
                resolve, // Bất kỳ resolve → resolve ngay
                reason => {
                    errors[i] = reason;
                    if (++count === promises.length) {
                        reject(new AggregateError(errors, 'All promises rejected'));
                    }
                }
            );
        });
    });
}

// .catch = .then(null, onRejected)
catch(onRejected) {
    return this.then(null, onRejected);
}

// .finally = chạy dù resolve hay reject
finally(callback) {
    return this.then(
        value  => MyPromise.resolve(callback()).then(() => value),
        reason => MyPromise.resolve(callback()).then(() => { throw reason })
    );
}
```

```
STATIC METHODS — COMPARISON:
═══════════════════════════════════════════════════════════════

  ┌──────────────┬───────────┬────────────┬──────────────────┐
  │ Method       │ Resolve   │ Reject     │ Use case         │
  ├──────────────┼───────────┼────────────┼──────────────────┤
  │ all          │ Tất cả OK │ 1 fail     │ Parallel, all    │
  │ race         │ 1st done  │ 1st done   │ Timeout race     │
  │ allSettled   │ Tất cả    │ NEVER      │ Report all       │
  │ any          │ 1st OK    │ All fail   │ Fastest success  │
  └──────────────┴───────────┴────────────┴──────────────────┘
```

---

## Q47. async/await & Handwritten

### async/await là gì?

```
async/await:
═══════════════════════════════════════════════════════════════

  async:
  → Biến function thành Promise-returning function
  → async function fn() { return 1 } ≡ fn().then(v => ...) v=1
  → Cho phép dùng await bên trong

  await:
  → PAUSE execution cho đến Promise settle
  → await promise → resume với resolved value
  → Chỉ dùng TRONG async function

  BẢN CHẤT:
  → Syntactic sugar cho Generator + Promise
  → await x ≈ yield x + tự động .then(resume)
```

### Handwritten async/await (Generator-based)

```javascript
// async/await = Generator + auto-executor

function myAsync(generatorFn) {
  return function (...args) {
    const gen = generatorFn.apply(this, args);

    return new Promise((resolve, reject) => {
      function step(key, value) {
        let result;
        try {
          result = gen[key](value); // gen.next(value) hoặc gen.throw(value)
        } catch (error) {
          return reject(error);
        }

        const { value: val, done } = result;

        if (done) {
          // Generator xong → resolve
          resolve(val);
        } else {
          // Chưa xong → đợi Promise → step tiếp
          Promise.resolve(val).then(
            (v) => step("next", v), // Thành công → gen.next(v)
            (e) => step("throw", e), // Thất bại → gen.throw(e)
          );
        }
      }

      step("next", undefined); // Bắt đầu!
    });
  };
}

// Sử dụng:
const fetchData = myAsync(function* () {
  const user = yield fetch("/api/user"); // yield ≈ await
  const posts = yield fetch(`/api/posts?userId=${user.id}`);
  return posts;
});
fetchData().then(console.log);
```

```
HANDWRITTEN async — KEY INSIGHT:
═══════════════════════════════════════════════════════════════

  Generator:
  → yield PAUSE execution → return { value, done }
  → gen.next(v) RESUME execution → v thành giá trị yield

  Auto-executor:
  → gen.next() → lấy yielded Promise
  → .then(v => gen.next(v)) → resume với resolved value
  → Lặp lại cho đến done = true → resolve

  async/await                   Generator + Executor
  ─────────────────────────────────────────────────────
  async function fn()      →    function* fn()
  await somePromise        →    yield somePromise
  return value             →    return value
  (auto-execute)           →    myAsync(fn*)() (manual)
```

---

## Q48. Handwritten instanceof

```javascript
function mu_instanceof(L, R) {
  // Primitives luôn return false
  const baseTypes = ["string", "number", "boolean", "symbol", "undefined"];
  if (baseTypes.includes(typeof L) || L === null) return false;

  // traverse prototype chain
  let proto = Object.getPrototypeOf(L); // L.__proto__
  const prototype = R.prototype;

  while (true) {
    if (proto === null) return false; // End of chain
    if (proto === prototype) return true; // MATCH!
    proto = Object.getPrototypeOf(proto); // Lên 1 level
  }
}

mu_instanceof([], Array); // true
mu_instanceof("2023-01-09", Date); // false
mu_instanceof(new Date(), Date); // true
mu_instanceof({}, Object); // true
mu_instanceof([], Object); // true (Array → Object)
```

```
instanceof — NGUYÊN LÝ:
═══════════════════════════════════════════════════════════════

  L instanceof R:
  → Traverse L.__proto__ chain
  → Nếu gặp node === R.prototype → true
  → Nếu đến null (end) → false

  [] instanceof Array:
  [].__proto__ === Array.prototype → true ✅

  [] instanceof Object:
  [].__proto__ = Array.prototype
  Array.prototype.__proto__ = Object.prototype → true ✅

  ƯU ĐIỂM: Phân biệt Array, Object, Function, custom class
  NHƯỢC ĐIỂM: KHÔNG check được primitives (string, number...)
```

---

## Q49. Throttle & Debounce

### Debounce — Chờ n giây, reset nếu trigger lại

```javascript
function debounce(fn, wait) {
  let timer = null;
  return function (...args) {
    if (timer !== null) {
      clearTimeout(timer); // Trigger lại → RESET timer!
    }
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, wait);
  };
}

// Ví dụ: search input — đợi user ngừng gõ 300ms mới gọi API
input.addEventListener("input", debounce(handleSearch, 300));
```

### Throttle — Max 1 lần trong n giây

```javascript
function throttle(fn, wait) {
  let lastTime = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastTime >= wait) {
      fn.apply(this, args);
      lastTime = now;
    }
  };
}

// Ví dụ: scroll event — max 1 request mỗi giây
window.addEventListener("scroll", throttle(handleScroll, 1000));
```

```
DEBOUNCE vs THROTTLE:
═══════════════════════════════════════════════════════════════

  ┌──────────┬──────────────────────┬──────────────────────┐
  │          │ Debounce             │ Throttle             │
  ├──────────┼──────────────────────┼──────────────────────┤
  │ Ý nghĩa  │ Đợi yên rồi mới chạy │ Max 1 lần/interval   │
  │ Reset?   │ CÓ (trigger → reset) │ KHÔNG                │
  │ Use case │ Search input         │ Scroll, resize       │
  │          │ Window resize        │ Button click         │
  │          │ Form validate        │ API polling          │
  │ Ví von   │ Thang máy: đợi hết  │ Tàu bus: 10p/chuyến │
  │          │ người vào mới đóng cửa│ dù đông hay vắng   │
  └──────────┴──────────────────────┴──────────────────────┘

  Trigger liên tục 10 lần trong 5s (wait = 1s):
  → Debounce: chạy 1 LẦN (sau trigger cuối + 1s)
  → Throttle: chạy 5 LẦN (mỗi 1s)
```

---

## Q50–Q51. HTML / XML / XHTML / HTML5

```
HTML vs XML vs XHTML vs HTML5:
═══════════════════════════════════════════════════════════════

  ┌──────────┬────────────────────────────────────────────────┐
  │ HTML     │ HyperText Markup Language                     │
  │          │ Cú pháp LỎN, không strict                    │
  ├──────────┼────────────────────────────────────────────────┤
  │ XML      │ eXtensible Markup Language                    │
  │          │ Lưu trữ data + structure, mở rộng được       │
  ├──────────┼────────────────────────────────────────────────┤
  │ XHTML    │ eXtensible HTML = HTML + XML rules            │
  │          │ Cú pháp STRICT (tag phải lowercase, close)    │
  ├──────────┼────────────────────────────────────────────────┤
  │ HTML5    │ HTML + XHTML + HTML DOM tiêu chuẩn mới       │
  │          │ Thêm canvas, video, audio, semantic tags      │
  └──────────┴────────────────────────────────────────────────┘

  XHTML vs HTML:
  → Tag PHẢI lowercase: <DIV> ❌ → <div> ✅
  → Elements PHẢI close: <br> ❌ → <br /> ✅
  → Elements PHẢI nested đúng
  → PHẢI có root element

  HTML5 additions:
  → canvas, video, audio
  → Semantic: header, nav, footer, aside, article, section
  → localStorage, sessionStorage
  → WebWorker, WebSocket, Geolocation
  → New form controls: date, time, email, search
```

---

## Q52. Inline / Block / Void Elements

```
ELEMENT TYPES:
═══════════════════════════════════════════════════════════════

  INLINE (行内):
  → KHÔNG xuống dòng, chiều rộng = content
  → a, b, span, img, input, select, strong, em, i, label

  BLOCK (块级):
  → XUỐNG DÒNG, chiều rộng = 100% parent
  → div, ul, ol, li, dl, dt, dd, h1-h6, p, form, table

  VOID (空 — self-closing):
  → KHÔNG có content, KHÔNG có closing tag
  → <br>, <hr>, <img>, <input>, <link>, <meta>
  → <source>, <area>, <col>, <embed>, <wbr>
```

---

## Q53. link vs @import

```
link vs @import:
═══════════════════════════════════════════════════════════════

  ┌──────────────┬─────────────────────┬────────────────────┐
  │              │ <link>              │ @import            │
  ├──────────────┼─────────────────────┼────────────────────┤
  │ Loại         │ HTML tag            │ CSS directive      │
  │ Load timing  │ SONG SONG với HTML  │ SAU KHI page load  │
  │ Compatibility│ ALL browsers       │ IE5+ only          │
  │ Specificity  │ CAO hơn            │ THẤP hơn           │
  │ JS control   │ DOM manipulable    │ Không               │
  │ Recommend    │ ✅ DÙng            │ ❌ TRÁNH            │
  └──────────────┴─────────────────────┴────────────────────┘

  @import blocking: CSS @import phải đợi page load xong
  → CHẬM hơn → Flash Of Unstyled Content (FOUC)
  → Luôn dùng <link> thay @import!
```

---

## Q54. Semantic Tags

```
SEMANTIC TAGS:
═══════════════════════════════════════════════════════════════

  "Dùng TAG ĐÚNG cho CONTENT ĐÚNG"

  LỢI ÍCH:
  ① SEO: Search engines hiểu cấu trúc → rank tốt hơn
  ② Accessibility: Screen readers đọc đúng → người khiếm thị
  ③ Readability: Dev đọc code dễ hơn
  ④ Maintainability: Team làm việc thống nhất (W3C standard)
  ⑤ Graceful degradation: Mất CSS → vẫn thấy cấu trúc rõ

  NON-SEMANTIC → SEMANTIC:
  <div class="header">   →   <header>
  <div class="nav">      →   <nav>
  <div class="main">     →   <main>
  <div class="article">  →   <article>
  <div class="aside">    →   <aside>
  <div class="footer">   →   <footer>
  <div class="section">  →   <section>
  <b>bold</b>            →   <strong>important</strong>
  <i>italic</i>          →   <em>emphasis</em>
```

---

## Q55. property vs attribute

```
property vs attribute:
═══════════════════════════════════════════════════════════════

  ATTRIBUTE = HTML tag attribute (string only)
  → id, class, title, href, src, data-*, ...
  → el.getAttribute('class') / el.setAttribute('class', 'x')

  PROPERTY = DOM object property (any JS type)
  → childNodes, firstChild, innerHTML, className, value...
  → el.className / el.value / el.childNodes

  <input id="myInput" type="text" value="hello">

  Attribute: HTML source → 'hello' (KHÔNG thay đổi)
  Property: DOM state → user gõ 'world' → property = 'world'
             nhưng attribute vẫn = 'hello'

  → Attributes = initial values (HTML source)
  → Properties = live state (DOM runtime)
```

---

## Q56. HTML5 Features

```
HTML5 — NEW FEATURES:
═══════════════════════════════════════════════════════════════

  API & Features:
  ✅ Drag & Drop API
  ✅ Canvas API (2D drawing)
  ✅ Geolocation API
  ✅ Web Workers (background threads)
  ✅ WebSocket (bidirectional comms)
  ✅ localStorage / sessionStorage
  ✅ SVG / MathML support

  Media:
  ✅ <video> / <audio> (native playback)

  Semantic Tags:
  ✅ <header>, <nav>, <main>, <footer>
  ✅ <article>, <section>, <aside>, <figure>

  Form Controls:
  ✅ date, time, email, url, search, color, range

  REMOVED ELEMENTS:
  ❌ <font>, <center>, <big>, <strike>, <tt>
  ❌ <basefont>, <u> (presentational)
  ❌ <frameset>, <frame>, <noframes>
```

---

## Q59. Web Storage vs Cookie

```
WEB STORAGE vs COOKIE:
═══════════════════════════════════════════════════════════════

  ┌──────────────┬────────────┬──────────────┬──────────────┐
  │              │ Cookie     │ sessionStorage│ localStorage│
  ├──────────────┼────────────┼──────────────┼──────────────┤
  │ Size         │ ~4 KB      │ ~5 MB        │ ~5 MB        │
  │ Gửi server   │ AUTO mỗi  │ KHÔNG        │ KHÔNG        │
  │              │ HTTP request│              │              │
  │ Lifetime     │ Đến expiry │ Đóng tab     │ Vĩnh viễn    │
  │              │ date       │ → MẤT        │ (manual del) │
  │ Scope        │ Same origin│ Same tab     │ Same origin  │
  │              │ all tabs   │ only!        │ all tabs     │
  │ Access       │ Server + JS│ JS only      │ JS only      │
  └──────────────┴────────────┴──────────────┴──────────────┘

  localStorage API:
  localStorage.setItem(key, value)  // Lưu
  localStorage.getItem(key)         // Đọc
  localStorage.removeItem(key)      // Xóa 1
  localStorage.clear()              // Xóa tất cả

  CHỌN CÁI NÀO?
  → Auth token → Cookie (httpOnly, secure) hoặc memory
  → User preferences → localStorage
  → Form draft → sessionStorage
  → Large data → IndexedDB
```

---

## Q60. Browser Engines

```
BROWSER ENGINES:
═══════════════════════════════════════════════════════════════

  ┌──────────────┬─────────────────────────────────────────┐
  │ Engine       │ Browsers                               │
  ├──────────────┼─────────────────────────────────────────┤
  │ Blink        │ Chrome, Edge, Opera, Brave (Chromium)  │
  │ (was WebKit) │                                        │
  ├──────────────┼─────────────────────────────────────────┤
  │ WebKit       │ Safari, iOS browsers                   │
  ├──────────────┼─────────────────────────────────────────┤
  │ Gecko        │ Firefox                                │
  ├──────────────┼─────────────────────────────────────────┤
  │ Trident      │ IE (legacy), 360 Browser               │
  │ (→ EdgeHTML) │ (đã deprecated)                        │
  └──────────────┴─────────────────────────────────────────┘

  JS ENGINES:
  → V8:           Chrome, Edge, Node.js
  → SpiderMonkey: Firefox
  → JavaScriptCore (Nitro): Safari
```

---

## Q62. Multi-Domain Resources — Tại sao?

```
MULTI-DOMAIN — 5 LỢI ÍCH:
═══════════════════════════════════════════════════════════════

  ① CDN caching tiện hơn
     → Static files trên CDN domain → cache closer to user

  ② Bypass browser concurrent limit
     → Trình duyệt giới hạn ~6 connections/domain
     → 3 domains × 6 = 18 concurrent downloads!

  ③ Tiết kiệm Cookie bandwidth
     → Cookie gửi theo domain
     → Static domain (images.example.com) → NO cookie → nhẹ hơn

  ④ Giảm connections trên main domain
     → Main domain dành cho API calls
     → Static files trên CDN → không chiếm connection

  ⑤ Security isolation
     → Cookie-free domain cho static → giảm XSS attack surface
```

---

## Tóm Tắt

### Quick Reference

```
Q46-Q62 — QUICK REF:
═══════════════════════════════════════════════════════════════

  PROMISE:
  → 3 states: pending → fulfilled | rejected (irreversible)
  → Constructor: executor(resolve, reject) chạy NGAY
  → .then return NEW Promise → chaining
  → resolvePromise: handle primitive / Promise / thenable / circular
  → all (all OK) / race (first) / allSettled (report) / any (first OK)

  ASYNC/AWAIT:
  → Generator + auto-executor: yield ≈ await, gen.next(v) ≈ resume
  → async return Promise, await pause cho đến settle

  INSTANCEOF:
  → Traverse L.__proto__ chain, check === R.prototype
  → Không check được primitives

  DEBOUNCE vs THROTTLE:
  → Debounce: N giây SAU trigger cuối (search input)
  → Throttle: Max 1 lần / N giây (scroll, resize)

  HTML:
  → HTML (loose) vs XHTML (strict) vs HTML5 (modern features)
  → Inline: không xuống dòng | Block: xuống dòng | Void: self-close
  → link > @import (parallel vs blocking)
  → Semantic tags: SEO + accessibility + readability
  → property = DOM runtime state, attribute = HTML source

  STORAGE:
  → Cookie: 4KB, auto send, expiry | Session: 5MB, tab only
  → Local: 5MB, permanent, same origin

  BROWSER: Blink(Chrome) / WebKit(Safari) / Gecko(Firefox)
```

### Checklist

- [ ] Promise: 3 states, executor runs SYNC, state irreversible
- [ ] .then: return NEW Promise, 3 cases (fulfilled/rejected/pending)
- [ ] resolvePromise: primitive / Promise / thenable / circular
- [ ] Promise.all vs race vs allSettled vs any
- [ ] catch = then(null, onRejected), finally = always run
- [ ] async/await = Generator + Promise auto-executor
- [ ] yield ≈ await, gen.next(v) ≈ resume with value
- [ ] instanceof: traverse **proto**, check === R.prototype
- [ ] Debounce: clearTimeout + reset (thang máy)
- [ ] Throttle: Date.now() gap check (tàu bus)
- [ ] HTML loose, XHTML strict, HTML5 modern
- [ ] Inline/Block/Void elements
- [ ] link (parallel) vs @import (blocking after load)
- [ ] Semantic: đúng tag cho đúng content → SEO + a11y
- [ ] property (DOM state) vs attribute (HTML source)
- [ ] Cookie 4KB auto-send vs Storage 5MB local-only
- [ ] sessionStorage = tab scope, localStorage = origin scope
- [ ] Browser engines: Blink / WebKit / Gecko
- [ ] Multi-domain: bypass 6-conn limit, cookie-free, CDN

---

_Cập nhật lần cuối: Tháng 2, 2026_
