# UI Components Deep Dive — Phần 9: Progress Bars, Stopwatch, Like Button

> 📅 2026-03-11 · ⏱ 45 phút đọc
>
> Chủ đề: Tự viết lại từ đầu — Progress Bars, Stopwatch, Like Button
> Version: Vanilla JavaScript + React
> Không thư viện! Viết tay 100%!

---

## Mục Lục

| #   | Component     | Vanilla JS | React | Giải thích | RADIO |
| --- | ------------- | ---------- | ----- | ---------- | ----- |
| 1   | Progress Bars | §1.1       | §1.2  | §1.3       | §1.4  |
| 2   | Stopwatch     | §2.1       | §2.2  | §2.3       | §2.4  |
| 3   | Like Button   | §3.1       | §3.2  | §3.3       | §3.4  |

---

# 📊 Component 1: Progress Bars

## Kiến Trúc Progress Bars

```
PROGRESS BARS:
═══════════════════════════════════════════════════════════════

  ┌─────────────────────────────────────────┐
  │         Progress Bars Demo              │
  │                                         │
  │  ┌───────────────────────────────────┐  │
  │  │████████████████████████████  100% │  │  ← bar 1 (done!)
  │  └───────────────────────────────────┘  │
  │  ┌───────────────────────────────────┐  │
  │  │██████████████████░░░░░░░░░░  65%  │  │  ← bar 2 (filling!)
  │  └───────────────────────────────────┘  │
  │  ┌───────────────────────────────────┐  │
  │  │██░░░░░░░░░░░░░░░░░░░░░░░░░  10%  │  │  ← bar 3 (just added!)
  │  └───────────────────────────────────┘  │
  │                                         │
  │              [   Add   ]                │  ← click = thêm bar!
  └─────────────────────────────────────────┘

  Behavior:
  • Click "Add" → thêm 1 progress bar!
  • Bar mới bắt đầu từ 0% → fill lên 100%!
  • Mỗi bar mất ~2000ms để fill xong!
  • Smooth animation (CSS transition!)
  • Nhiều bars fill ĐỒNG THỜI!
```

### 📋 Phân tích yêu cầu — Progress Bars

```
CÂU HỎI CẦN HỎI INTERVIEWER:
═══════════════════════════════════════════════════════════════

  1. "Animation: CSS transition hay JS requestAnimationFrame?"
     → CSS transition: đơn giản, smooth, GPU-accelerated!
     → requestAnimationFrame: kiểm soát chi tiết hơn!
     → Scope: CSS transition đủ!

  2. "Tốc độ fill: linear hay ease?"
     → Linear: tốc độ đều (progress bar thường dùng!)
     → Ease: bắt đầu chậm, nhanh dần, chậm cuối!

  3. "Khi bar đến 100%: remove hay giữ?"
     → Giữ! Hiện trạng thái completed!

  4. "Hiện text % không?"
     → Có → thêm text overlay trên bar!

  5. "Có giới hạn số lượng bars?"
     → Scope: không giới hạn!
```

---

## §1.1 Progress Bars — Vanilla JavaScript

```javascript
// ═══ Vanilla JS Progress Bars ═══

class ProgressBars {
  constructor(container) {
    this.container =
      typeof container === 'string'
        ? document.querySelector(container)
        : container;

    this.DURATION = 2000; // 2 giây!
    this.bars = [];

    this._init();
  }

  _init() {
    this.container.innerHTML = `
      <h1>Progress Bars</h1>
      <div id="barList"></div>
      <button id="addBtn">Add</button>
    `;

    this.barList = this.container.querySelector('#barList');
    this.addBtn = this.container.querySelector('#addBtn');

    this.addBtn.addEventListener('click', () => this.addBar());
  }

  addBar() {
    const wrapper = document.createElement('div');
    wrapper.className = 'progress-wrapper';

    const bar = document.createElement('div');
    bar.className = 'progress-bar';

    wrapper.appendChild(bar);
    this.barList.appendChild(wrapper);

    // Force reflow TRƯỚC khi set width!
    // Không có dòng này → transition KHÔNG chạy!
    bar.getBoundingClientRect();

    // Trigger animation!
    bar.style.width = '100%';

    this.bars.push({ wrapper, bar });
  }
}

new ProgressBars('#app');
```

```css
/* ═══ CSS Progress Bars ═══ */

.progress-wrapper {
  background: #e2e8f0;
  border-radius: 8px;
  margin-bottom: 12px;
  height: 32px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  width: 0%;                          /* Bắt đầu từ 0! */
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 8px;
  transition: width 2000ms linear;    /* 2s fill, tốc độ đều! */
}
```

### Giải thích Vanilla JS — Line by line

**`getBoundingClientRect()` — Tại sao BẮT BUỘC:**

```
FORCE REFLOW — TRICK QUAN TRỌNG:
═══════════════════════════════════════════════════════════════

  Vấn đề: CSS transition cần 2 trạng thái!
  → Trạng thái A (width: 0%) → Trạng thái B (width: 100%)
  → Browser PHẢI biết A TRƯỚC khi chuyển sang B!

  KHÔNG có getBoundingClientRect():
  bar.style.width = '0%';    // set A
  bar.style.width = '100%';  // set B ngay lập tức!
  → Browser BATCH 2 thay đổi cùng lúc!
  → Browser chỉ thấy: width = 100% (bỏ qua 0%!)
  → KHÔNG có transition! Nhảy thẳng 100%! 💀

  CÓ getBoundingClientRect():
  // width đã là 0% (từ CSS .progress-bar!)
  bar.getBoundingClientRect();  // ← FORCE browser đọc layout!
  bar.style.width = '100%';    // set B
  → Browser ĐÃ BIẾT A (0%) → mới chuyển sang B (100%)!
  → Transition CHẠY! 0% → 100% trong 2s! ✅

  getBoundingClientRect() FORCE REFLOW:
  → Buộc browser tính toán layout NGAY LẬP TỨC!
  → Browser "commit" trạng thái hiện tại!
  → Sau đó thay đổi width → browser thấy KHÁC → animate!

  Alternatives (cũng force reflow):
  → element.offsetHeight
  → element.offsetWidth
  → getComputedStyle(element).width
  → Tất cả đều BUỘC browser tính layout!
```

**CSS `transition` vs `requestAnimationFrame`:**

```
2 CÁCH ANIMATE PROGRESS BAR:
═══════════════════════════════════════════════════════════════

  CÁCH 1: CSS transition (code hiện tại!)
  .progress-bar {
    transition: width 2000ms linear;
  }
  bar.style.width = '100%';
  → Browser handle animation!
  → GPU-accelerated → smooth 60fps!
  → Đơn giản! 1 dòng CSS!
  → NHƯNG: không thể pause/resume!

  CÁCH 2: requestAnimationFrame (JS!)
  function animate(bar) {
    const start = performance.now();
    function step(now) {
      const progress = Math.min((now - start) / 2000, 1);
      bar.style.width = (progress * 100) + '%';
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  → JS control mỗi frame!
  → Có thể pause, resume, reverse!
  → NHƯNG: phức tạp hơn, có thể không smooth!

  Phỏng vấn: CSS transition ĐỦ!
  → Mention rAF = bonus points!
```

---

## §1.2 Progress Bars — React

```jsx
// ═══ React Progress Bars ═══

import { useState, useEffect } from 'react';

function ProgressBar() {
  const [filled, setFilled] = useState(false);

  useEffect(() => {
    // requestAnimationFrame đảm bảo browser đã paint 0%!
    const rafId = requestAnimationFrame(() => {
      setFilled(true);
    });
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <div className="progress-wrapper">
      <div
        className="progress-bar"
        style={{ width: filled ? '100%' : '0%' }}
      />
    </div>
  );
}

function ProgressBars() {
  const [bars, setBars] = useState([]);

  const addBar = () => {
    setBars((prev) => [...prev, { id: Date.now() }]);
  };

  return (
    <div>
      <h1>Progress Bars</h1>
      {bars.map((bar) => (
        <ProgressBar key={bar.id} />
      ))}
      <button onClick={addBar}>Add</button>
    </div>
  );
}
```

### Giải thích React — Line by line

**`useEffect` + `requestAnimationFrame` — Tại sao không `setTimeout`:**

```
REACT ANIMATION TIMING:
═══════════════════════════════════════════════════════════════

  Vấn đề React: render → DOM update → paint
  → setState(true) trong cùng render → BATCH!
  → Browser không thấy 0% → chỉ thấy 100%!
  → KHÔNG có transition!

  useEffect + rAF giải quyết:
  1. Component mount → render width: 0%
  2. useEffect chạy SAU render!
  3. requestAnimationFrame chờ browser PAINT xong 0%!
  4. setFilled(true) → re-render → width: 100%!
  5. Browser thấy 0% → 100% → TRANSITION chạy! ✅

  Tại sao KHÔNG dùng setTimeout(fn, 0)?
  → setTimeout(fn, 0) có thể chạy TRƯỚC paint!
  → Không đảm bảo browser đã paint 0%!
  → requestAnimationFrame = đợi ĐÚNG next paint! ✅

  Tại sao cleanup: cancelAnimationFrame?
  → Component unmount trước khi rAF chạy!
  → Không cleanup → setFilled trên unmounted component!
  → React warning: "setState on unmounted component"!
```

**`Date.now()` cho key — Tại sao không index:**

```
KEY STRATEGY:
═══════════════════════════════════════════════════════════════

  ❌ index as key:
  bars.map((bar, index) => <ProgressBar key={index} />)
  → Thêm bar → reorder indices → React re-render WRONG bars!
  → Bar cũ animation bị reset!

  ✅ unique id:
  { id: Date.now() }
  → Mỗi bar có ID riêng!
  → Thêm bar mới → bars cũ giữ nguyên!
  → Animation không bị ảnh hưởng!

  Production: dùng crypto.randomUUID() hoặc nanoid()!
  → Date.now() có thể trùng nếu click RẤT nhanh!
```

---

## §1.3 Giải thích Progress Bars — Từng phần

### CSS `linear-gradient` — Visual đẹp hơn solid color

```
LINEAR-GRADIENT — PROGRESS BAR:
═══════════════════════════════════════════════════════════════

  background: #667eea;
  → Solid color → nhàm chán! 😐

  background: linear-gradient(90deg, #667eea, #764ba2);
  → Gradient từ trái sang phải!
  → #667eea (xanh tím) → #764ba2 (tím)
  → Đẹp hơn nhiều! ✅

  Striped pattern (bonus!):
  background: repeating-linear-gradient(
    45deg,
    #667eea 0px, #667eea 10px,
    #764ba2 10px, #764ba2 20px
  );
  → Sọc chéo 45°! Giống loading indicator!
```

### `overflow: hidden` — Tại sao cần

```
OVERFLOW HIDDEN:
═══════════════════════════════════════════════════════════════

  .progress-wrapper {
    border-radius: 8px;
    overflow: hidden;
  }

  Không có overflow: hidden:
  → .progress-bar có border-radius: 8px
  → Nhưng NẰM TRONG wrapper cũng có border-radius!
  → Bar tràn ra ngoài border-radius của wrapper! 💀

  Có overflow: hidden:
  → Bar bị CẮT theo border-radius của wrapper!
  → Bo góc đẹp! ✅
```

### Vanilla JS vs React — So sánh

```
VANILLA VS REACT — PROGRESS BARS:
═══════════════════════════════════════════════════════════════

  ┌──────────────────┬────────────────────────┐
  │ Vanilla JS       │ React                  │
  ├──────────────────┼────────────────────────┤
  │ getBoundingClient│ useEffect + rAF        │
  │ Rect() for       │ for timing             │
  │ reflow           │                        │
  │                  │                        │
  │ DOM manipulation │ State-driven           │
  │ createElement    │ JSX rendering          │
  │                  │                        │
  │ Direct style     │ style={{ width }}      │
  │ bar.style.width  │ conditional            │
  │                  │                        │
  │ Manual cleanup   │ useEffect cleanup      │
  └──────────────────┴────────────────────────┘
```

---

# 🎤 RADIO Interview Walkthrough — Progress Bars

### R — Requirements

```
REQUIREMENTS — CÂU HỎI CẦN HỎI:
═══════════════════════════════════════════════════════════════

  1. "Animation: CSS hay JS?"
     → CSS transition: đơn giản, smooth!

  2. "Duration chính xác?"
     → ~2000ms!

  3. "Nhiều bars cùng lúc?"
     → CÓ! Mỗi bar animation ĐỘC LẬP!

  4. "Hiện % text?"
     → Optional bonus!

  5. "Pause/resume?"
     → Scope: không cần!
```

```
SCOPE — PROGRESS BARS:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────┐
  │ MUST HAVE (5 phút):                      │
  │ ✅ Click Add → thêm progress bar         │
  │ ✅ Bar fill 0% → 100% trong ~2s          │
  │ ✅ Smooth animation                      │
  │ ✅ Nhiều bars đồng thời                  │
  ├──────────────────────────────────────────┤
  │ NICE TO HAVE (5 phút):                   │
  │ 🔵 % text overlay                        │
  │ 🔵 Striped pattern                       │
  │ 🔵 Pause/resume                          │
  │ 🔵 requestAnimationFrame alternative     │
  └──────────────────────────────────────────┘
```

### A — Architecture

```
ARCHITECTURE:
═══════════════════════════════════════════════════════════════

  App
  ├── bars[] state
  ├── [Add] button → push new bar
  └── bars.map() →
      └── ProgressBar component
          ├── wrapper (background track!)
          └── bar (colored fill!)
              └── CSS transition: width 2s linear

  Key insight:
  → Animation hoàn toàn bằng CSS!
  → JS chỉ toggle width: 0% → 100%!
  → CSS transition handle smooth animation!
```

### D — Design

```
DESIGN DECISIONS:
═══════════════════════════════════════════════════════════════

  1. CSS transition vs JS animation:
     → CSS: GPU-accelerated, smooth, simple!
     → JS (rAF): more control, can pause!
     → Chọn: CSS transition!

  2. Force reflow technique:
     → Vanilla: getBoundingClientRect()
     → React: useEffect + requestAnimationFrame
     → CẢ HAI đảm bảo browser paint 0% trước!

  3. width vs transform:
     → width: trigger layout recalculation!
     → transform: scaleX() → GPU, no layout!
     → Chọn: width (đơn giản, đủ cho interview!)
     → Mention: transform tốt hơn cho production!
```

### I — Implementation (Triển khai)

```
IMPLEMENTATION WALKTHROUGH:
═══════════════════════════════════════════════════════════════

  BƯỚC 1 (2 phút): HTML/CSS structure!
  → Wrapper (track) + bar (fill)!
  → CSS transition: width 2000ms linear!

  BƯỚC 2 (3 phút): Add button logic!
  → Click → createElement bar!
  → Force reflow → set width 100%!
  → NÓI: "getBoundingClientRect force reflow!"

  BƯỚC 3 (2 phút): React version!
  → useState cho bars array!
  → useEffect + rAF cho animation timing!

  BƯỚC 4 (3 phút): Giải thích!
  → Why force reflow needed!
  → CSS transition vs rAF!
  → width vs transform performance!
```

### Edge Cases — Đề phòng!

```
EDGE CASES:
═══════════════════════════════════════════════════════════════

  1. RAPID CLICKING:
     → 100 clicks → 100 bars → performance?
     → CSS transitions = lightweight!
     → Nhưng nhiều DOM nodes = slow!
     → Fix: virtualization hoặc limit!

  2. TAB HIDDEN:
     → User switch tab → requestAnimationFrame PAUSE!
     → CSS transition: vẫn chạy (browser handle!)
     → rAF: paused → resume khi focus lại!

  3. REDUCED MOTION:
     → prefers-reduced-motion: reduce
     → Nên skip animation cho accessibility!
     @media (prefers-reduced-motion: reduce) {
       .progress-bar { transition: none; }
     }
```

```
INTERVIEW TIPS — PROGRESS BARS:
═══════════════════════════════════════════════════════════════

  ⏱ TIMELINE (30 phút):
  ├── 0-2 phút:   Hỏi requirements!
  ├── 2-5 phút:   CSS structure (wrapper + bar)!
  ├── 5-10 phút:  JS logic (add + force reflow!)
  ├── 10-15 phút: Giải thích force reflow!
  ├── 15-20 phút: React version!
  ├── 20-25 phút: CSS vs rAF comparison!
  └── 25-30 phút: Edge cases + optimization!

  💡 KEY TALKING POINTS:
  → "CSS transition cho smooth animation!"
  → "getBoundingClientRect() force reflow — BẮT BUỘC!"
  → "React: useEffect + rAF đảm bảo paint trước!"
  → "width vs transform: performance trade-off!"

  ⚠ SAI LẦM PHỔ BIẾN:
  → Quên force reflow → không có animation!
  → Dùng setInterval thay vì CSS transition!
  → setTimeout(0) thay vì rAF trong React!
  → index as key → animation reset!
```

---

# ⏱ Component 2: Stopwatch

## Kiến Trúc Stopwatch

```
STOPWATCH:
═══════════════════════════════════════════════════════════════

  ┌─────────────────────────────────────────┐
  │                                         │
  │           00:00:12:450                   │  ← timer display
  │           hh:mm:ss:ms                    │    (clickable!)
  │                                         │
  │      [ Start/Stop ]    [ Reset ]        │  ← controls
  │                                         │
  └─────────────────────────────────────────┘

  Behavior:
  • Start: bắt đầu đếm thời gian!
  • Stop: tạm dừng (KHÔNG reset!)
  • Reset: về 00:00:00:000, dừng timer!
  • Click vào timer display = Start/Stop!
  • Hiển thị: hh:mm:ss:ms format!
```

---

## §2.1 Stopwatch — Vanilla JavaScript

```javascript
// ═══ Vanilla JS Stopwatch ═══

class Stopwatch {
  constructor(container) {
    this.container =
      typeof container === 'string'
        ? document.querySelector(container)
        : container;

    this.elapsed = 0;       // tổng thời gian (ms!)
    this.startTime = null;  // thời điểm bắt đầu!
    this.rafId = null;      // requestAnimationFrame ID!
    this.isRunning = false;

    this._init();
  }

  _init() {
    this.container.innerHTML = `
      <div id="display" class="stopwatch-display">00:00:00:000</div>
      <div class="stopwatch-controls">
        <button id="startStopBtn">Start</button>
        <button id="resetBtn">Reset</button>
      </div>
    `;

    this.display = this.container.querySelector('#display');
    this.startStopBtn = this.container.querySelector('#startStopBtn');
    this.resetBtn = this.container.querySelector('#resetBtn');

    this.startStopBtn.addEventListener('click', () => this.toggleStartStop());
    this.resetBtn.addEventListener('click', () => this.reset());
    this.display.addEventListener('click', () => this.toggleStartStop());
  }

  toggleStartStop() {
    if (this.isRunning) {
      this.stop();
    } else {
      this.start();
    }
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.startStopBtn.textContent = 'Stop';

    // Ghi nhớ thời điểm bắt đầu!
    this.startTime = performance.now() - this.elapsed;

    const tick = (now) => {
      this.elapsed = now - this.startTime;
      this._updateDisplay();
      this.rafId = requestAnimationFrame(tick);
    };

    this.rafId = requestAnimationFrame(tick);
  }

  stop() {
    this.isRunning = false;
    this.startStopBtn.textContent = 'Start';
    cancelAnimationFrame(this.rafId);
  }

  reset() {
    this.stop();
    this.elapsed = 0;
    this._updateDisplay();
  }

  _updateDisplay() {
    const ms = this.elapsed;
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const millis = Math.floor(ms % 1000);

    this.display.textContent =
      `${String(hours).padStart(2, '0')}:` +
      `${String(minutes).padStart(2, '0')}:` +
      `${String(seconds).padStart(2, '0')}:` +
      `${String(millis).padStart(3, '0')}`;
  }
}

new Stopwatch('#app');
```

### Giải thích Vanilla JS — Line by line

**`performance.now()` vs `Date.now()` — Tại sao `performance.now()`:**

```
PERFORMANCE.NOW() vs DATE.NOW():
═══════════════════════════════════════════════════════════════

  Date.now():
  → Trả về Unix timestamp (milliseconds!)
  → Bị ảnh hưởng bởi system clock adjustment!
  → NTP sync → time có thể NHẢY tới/lùi!
  → Độ chính xác: ~1ms!

  performance.now():
  → Monotonic clock — CHỈ TĂNG, không bao giờ giảm!
  → KHÔNG bị ảnh hưởng bởi system clock!
  → Độ chính xác: ~5 microseconds (0.005ms!)
  → Phù hợp cho: timer, animation, benchmarking!

  Stopwatch CẦN performance.now():
  → User thay đổi system time → Date.now() SAI!
  → performance.now() KHÔNG bị ảnh hưởng! ✅
```

**`startTime = performance.now() - this.elapsed` — Resume trick:**

```
RESUME TRICK:
═══════════════════════════════════════════════════════════════

  Vấn đề: Start → Stop → Start lại!
  → Lần start đầu: elapsed = 0, startTime = 1000
  → Chạy 5 giây → Stop: elapsed = 5000
  → Start lại: nếu startTime = now (6000):
    → elapsed = 6000 - 6000 = 0! RESET RỒI! 💀

  Giải pháp: startTime = now - elapsed!
  → Start lại: now = 6000, elapsed = 5000
  → startTime = 6000 - 5000 = 1000
  → Tick: elapsed = now - 1000 = tiếp tục từ 5000! ✅

  Hình dung timeline:
  ──── 1000 ─── 6000 ─── 11000 ──→
       │Start    │Stop/Start │
       └─ 5s ────┘           │
                  └─ 5s ─────┘ (tiếp tục!)
```

**`requestAnimationFrame` vs `setInterval` — Tại sao rAF:**

```
RAF vs SETINTERVAL:
═══════════════════════════════════════════════════════════════

  ❌ setInterval(tick, 16):
  → 16ms ≈ 60fps! Nhưng...
  → KHÔNG chính xác! Có thể trễ!
  → Tab ẩn: VẪN chạy → waste CPU!
  → Không sync với browser paint!

  ✅ requestAnimationFrame(tick):
  → Sync với REFRESH RATE màn hình!
  → 60Hz → 60 calls/s, 144Hz → 144 calls/s!
  → Tab ẩn → TỰ ĐỘNG pause! (save CPU!)
  → Browser optimize painting!

  Phỏng vấn: rAF là CHUẨN cho animation!
```

---

## §2.2 Stopwatch — React

```jsx
// ═══ React Stopwatch ═══

import { useState, useRef, useCallback, useEffect } from 'react';

function formatTime(ms) {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const millis = Math.floor(ms % 1000);

  return (
    `${String(hours).padStart(2, '0')}:` +
    `${String(minutes).padStart(2, '0')}:` +
    `${String(seconds).padStart(2, '0')}:` +
    `${String(millis).padStart(3, '0')}`
  );
}

function Stopwatch() {
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const startTimeRef = useRef(null);
  const rafIdRef = useRef(null);

  useEffect(() => {
    if (!isRunning) return;

    startTimeRef.current = performance.now() - elapsed;

    const tick = (now) => {
      setElapsed(now - startTimeRef.current);
      rafIdRef.current = requestAnimationFrame(tick);
    };

    rafIdRef.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafIdRef.current);
  }, [isRunning]); // CHỈ phụ thuộc isRunning!

  const toggleStartStop = useCallback(() => {
    setIsRunning((prev) => !prev);
  }, []);

  const reset = useCallback(() => {
    setIsRunning(false);
    setElapsed(0);
  }, []);

  return (
    <div>
      <div className="stopwatch-display" onClick={toggleStartStop}>
        {formatTime(elapsed)}
      </div>
      <div className="stopwatch-controls">
        <button onClick={toggleStartStop}>
          {isRunning ? 'Stop' : 'Start'}
        </button>
        <button onClick={reset}>Reset</button>
      </div>
    </div>
  );
}
```

### Giải thích React — Line by line

**`useRef` cho startTime và rafId — Tại sao không `useState`:**

```
USEREF vs USESTATE — TIMER:
═══════════════════════════════════════════════════════════════

  startTimeRef, rafIdRef dùng useRef vì:
  1. Thay đổi KHÔNG cần re-render!
     → startTime thay đổi mỗi start → không cần update UI!
     → useState → re-render → WASTE performance!

  2. Cần giá trị MỚI NHẤT trong callback!
     → rAF callback chạy 60 lần/giây!
     → useState: closure capture giá trị CŨ!
     → useRef: .current luôn là giá trị MỚI NHẤT!

  3. Persist giữa renders!
     → Local variable reset mỗi render!
     → useRef.current tồn tại suốt lifecycle!

  Quy tắc:
  → Cần RE-RENDER khi thay đổi: useState!
  → KHÔNG cần re-render: useRef!
  → elapsed: useState (hiển thị trên UI!)
  → startTime: useRef (internal logic!)
```

**`useEffect` dependency `[isRunning]` — Tại sao không `[isRunning, elapsed]`:**

```
DEPENDENCY ARRAY:
═══════════════════════════════════════════════════════════════

  useEffect(() => { ... }, [isRunning]);

  Tại sao CHỈ [isRunning]?
  → Effect chạy khi START hoặc STOP!
  → START: setup rAF loop!
  → STOP: cleanup (cancelAnimationFrame!)

  Nếu thêm [isRunning, elapsed]:
  → elapsed thay đổi 60 lần/giây!
  → useEffect chạy lại 60 lần/giây!
  → Mỗi lần: cancel rAF cũ + tạo rAF mới!
  → WASTE! Và timer bị giật! 💀

  elapsed trong rAF callback:
  → KHÔNG đọc từ state (stale closure!)
  → Tính từ: performance.now() - startTimeRef.current
  → Luôn CHÍNH XÁC! ✅
```

---

# 🎤 RADIO Interview Walkthrough — Stopwatch

### R — Requirements

```
REQUIREMENTS:
═══════════════════════════════════════════════════════════════

  1. Start/Stop button toggle timer!
  2. Reset button → 0, stop timer!
  3. Display: hh:mm:ss:ms format!
  4. Click timer display = Start/Stop!
  5. Millisecond precision!
```

### A — Architecture

```
ARCHITECTURE:
═══════════════════════════════════════════════════════════════

  State: { elapsed, isRunning, startTime }
  
  ┌─ Display ──────────────────┐
  │  formatTime(elapsed)       │ ← click = toggle!
  └────────────────────────────┘
  ┌─ Controls ─────────────────┐
  │  [Start/Stop]    [Reset]   │
  └────────────────────────────┘

  Timer loop:
  rAF → elapsed = now - startTime → update display → rAF...
```

### I — Implementation

```
IMPLEMENTATION WALKTHROUGH:
═══════════════════════════════════════════════════════════════

  BƯỚC 1 (2 phút): HTML structure!
  BƯỚC 2 (5 phút): Start/Stop with rAF!
  → performance.now() cho precision!
  → startTime = now - elapsed cho resume!
  BƯỚC 3 (3 phút): Reset logic!
  BƯỚC 4 (3 phút): Format hh:mm:ss:ms!
  BƯỚC 5 (2 phút): Click display toggle!
```

### Edge Cases

```
EDGE CASES:
═══════════════════════════════════════════════════════════════

  1. DOUBLE-CLICK START:
     → if (isRunning) return; guard!
  2. RESET WHILE RUNNING:
     → Stop first, then reset!
  3. TAB HIDDEN:
     → rAF pauses → elapsed DRIFT!
     → Fix: performance.now() - startTime = CORRECT!
  4. VERY LONG DURATION:
     → Hours overflow? padStart(2) handles!
```

```
INTERVIEW TIPS:
═══════════════════════════════════════════════════════════════

  💡 KEY POINTS:
  → "performance.now() cho monotonic clock!"
  → "rAF thay vì setInterval — sync với refresh rate!"
  → "startTime = now - elapsed cho resume!"
  → "useRef cho non-rendering values!"

  ⚠ SAI LẦM:
  → setInterval(fn, 10) thay vì rAF!
  → Date.now() thay vì performance.now()!
  → useState cho rafId/startTime!
  → Quên cleanup cancelAnimationFrame!
```

---

# 👍 Component 3: Like Button

## Kiến Trúc Like Button

```
LIKE BUTTON — STATE MACHINE:
═══════════════════════════════════════════════════════════════

  ┌──────────┐   click    ┌──────────┐
  │ DEFAULT  │──────────→ │ LOADING  │
  │ 🤍 Like  │            │ ⏳ Like  │
  └──────────┘            └────┬─────┘
       ↑                       │
       │                  ┌────┴─────┐
       │           success│          │failure
       │                  ↓          ↓
       │            ┌──────────┐  ┌──────────┐
       │            │  LIKED   │  │  ERROR   │
       │            │ ❤️ Liked │  │ 🤍 Like  │
       │            └────┬─────┘  │ + error  │
       │                 │        │ message! │
       │                 │click   └──────────┘
       │                 ↓             │
       │            ┌──────────┐       │
       │            │ LOADING  │       │
       │            │ ⏳ Liked │       │
       │            └────┬─────┘       │
       │                 │             │
       │            ┌────┴─────┐       │
       │     success│          │failure │
       └────────────┘          └───────┘

  API: POST /api/questions/like-button
  Body: { action: 'like' | 'unlike' }
  Response: 50% success / 50% failure!
```

---

## §3.1 Like Button — Vanilla JavaScript

```javascript
// ═══ Vanilla JS Like Button ═══

class LikeButton {
  constructor(container) {
    this.container =
      typeof container === 'string'
        ? document.querySelector(container)
        : container;

    this.API_URL = 'https://questions.greatfrontend.com/api/questions/like-button';
    this.isLiked = false;
    this.isLoading = false;

    this._init();
  }

  _init() {
    this.container.innerHTML = `
      <button id="likeBtn" class="like-btn">
        <span class="like-icon">🤍</span>
        <span class="like-text">Like</span>
      </button>
      <p id="errorMsg" class="error-msg"></p>
    `;

    this.btn = this.container.querySelector('#likeBtn');
    this.icon = this.container.querySelector('.like-icon');
    this.text = this.container.querySelector('.like-text');
    this.errorMsg = this.container.querySelector('#errorMsg');

    this.btn.addEventListener('click', () => this._handleClick());
  }

  async _handleClick() {
    if (this.isLoading) return; // Guard!

    this.isLoading = true;
    this.errorMsg.textContent = '';
    this._updateUI();

    const action = this.isLiked ? 'unlike' : 'like';

    try {
      const res = await fetch(this.API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message);
      }

      // Success! Toggle state!
      this.isLiked = !this.isLiked;
    } catch (err) {
      this.errorMsg.textContent = err.message;
    } finally {
      this.isLoading = false;
      this._updateUI();
    }
  }

  _updateUI() {
    this.btn.disabled = this.isLoading;

    if (this.isLoading) {
      this.icon.textContent = '⏳';
    } else {
      this.icon.textContent = this.isLiked ? '❤️' : '🤍';
    }

    this.text.textContent = this.isLiked ? 'Liked' : 'Like';

    this.btn.classList.toggle('liked', this.isLiked);
  }
}

new LikeButton('#app');
```

### Giải thích Vanilla JS — Line by line

**State machine — 4 trạng thái:**

```
STATE MACHINE — LIKE BUTTON:
═══════════════════════════════════════════════════════════════

  4 states: DEFAULT, LOADING, LIKED, ERROR
  
  Quản lý bằng 2 boolean:
  isLiked=false, isLoading=false → DEFAULT (🤍 Like)
  isLiked=false, isLoading=true  → LOADING (⏳ Like)
  isLiked=true,  isLoading=false → LIKED   (❤️ Liked)
  isLiked=true,  isLoading=true  → LOADING (⏳ Liked)

  ERROR: không phải state riêng!
  → isLiked giữ nguyên + errorMsg hiện!
  → Next click → thử lại!

  Tại sao KHÔNG dùng 1 biến state = 'default'|'loading'|...?
  → 2 booleans ĐƠN GIẢN hơn cho interview!
  → Production: enum hoặc state machine library!
```

**`try/catch/finally` + API 50/50:**

```
ERROR HANDLING — 50% FAIL:
═══════════════════════════════════════════════════════════════

  API response:
  → 200: { message: 'Success!' }
  → 500: { message: 'Unknown error...' }

  try:
  → fetch + check res.ok!
  → Nếu !res.ok → parse JSON → throw error!
  → Nếu ok → toggle isLiked!

  catch:
  → Hiện error.message dưới button!
  → isLiked KHÔNG ĐỔI (revert!)

  finally:
  → LUÔN CHẠY dù success hay fail!
  → isLoading = false → enable button!
  → _updateUI() → refresh giao diện!
```

---

## §3.2 Like Button — React

```jsx
// ═══ React Like Button ═══

import { useState } from 'react';

const API_URL = 'https://questions.greatfrontend.com/api/questions/like-button';

function LikeButton() {
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleClick = async () => {
    if (isLoading) return;

    setIsLoading(true);
    setError(null);

    const action = isLiked ? 'unlike' : 'like';

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message);
      }

      setIsLiked((prev) => !prev);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button
        className={`like-btn ${isLiked ? 'liked' : ''}`}
        onClick={handleClick}
        disabled={isLoading}
      >
        <span className="like-icon">
          {isLoading ? '⏳' : isLiked ? '❤️' : '🤍'}
        </span>
        <span className="like-text">
          {isLiked ? 'Liked' : 'Like'}
        </span>
      </button>
      {error && <p className="error-msg">{error}</p>}
    </div>
  );
}
```

### Giải thích React — Line by line

**Conditional rendering — Ternary chain:**

```
TERNARY CHAIN — ICON:
═══════════════════════════════════════════════════════════════

  {isLoading ? '⏳' : isLiked ? '❤️' : '🤍'}

  Đọc: nếu loading → ⏳
        nếu liked → ❤️
        còn lại → 🤍

  3 trạng thái từ 2 booleans!
  → Không cần switch/case!
  → Inline trong JSX = ngắn gọn!
```

**`setIsLiked(prev => !prev)` — Functional update:**

```
FUNCTIONAL UPDATE:
═══════════════════════════════════════════════════════════════

  ❌ setIsLiked(!isLiked);
  → isLiked là CLOSURE VALUE từ lúc render!
  → Trong async callback → có thể STALE!

  ✅ setIsLiked(prev => !prev);
  → prev là LATEST VALUE từ React!
  → Luôn CHÍNH XÁC dù async!
```

---

# 🎤 RADIO Interview Walkthrough — Like Button

### R — Requirements

```
REQUIREMENTS:
═══════════════════════════════════════════════════════════════

  1. Default state: 🤍 Like
  2. Click → Loading (⏳) → API call!
  3. Success: toggle Like ↔ Liked!
  4. Failure: revert + show error message!
  5. API: 50% success/fail (for testing!)
  6. Disabled during loading!
```

### A — Architecture

```
ARCHITECTURE — STATE MACHINE:
═══════════════════════════════════════════════════════════════

  States: { isLiked, isLoading, error }
  
  User Click
    → isLoading = true
    → fetch POST { action }
    ├── Success → toggle isLiked
    └── Failure → set error message
    → isLoading = false (finally!)
```

### I — Implementation

```
IMPLEMENTATION WALKTHROUGH:
═══════════════════════════════════════════════════════════════

  BƯỚC 1 (3 phút): Button UI + states!
  BƯỚC 2 (5 phút): API call + error handling!
  → try/catch/finally pattern!
  → response.ok check!
  BƯỚC 3 (3 phút): Loading state + disabled!
  BƯỚC 4 (2 phút): Error display!
  BƯỚC 5 (2 phút): CSS states (liked class!)
```

### Edge Cases

```
EDGE CASES:
═══════════════════════════════════════════════════════════════

  1. DOUBLE-CLICK:
     → isLoading guard + disabled attribute!
  2. NETWORK ERROR:
     → fetch throws TypeError → catch handles!
  3. RAPID TOGGLE:
     → Can't click while loading!
  4. UNMOUNT DURING FETCH:
     → AbortController for cleanup!
  5. HOVER STATE:
     → CSS :hover trên button!
     → Failure → return to hover/default based on cursor!
```

```
INTERVIEW TIPS:
═══════════════════════════════════════════════════════════════

  💡 KEY POINTS:
  → "State machine: 2 booleans → 4 states!"
  → "try/catch/finally cho guaranteed cleanup!"
  → "response.ok check — fetch KHÔNG throw 4xx/5xx!"
  → "Optimistic update alternative!"

  🎯 ĐIỂM CỘNG:
  → Mention AbortController cho cleanup!
  → Mention optimistic update pattern!
  → Mention debounce/throttle!
  → Accessibility: aria-pressed cho toggle!

  ⚠ SAI LẦM:
  → Quên loading guard → double-click!
  → Quên try/catch → unhandled rejection!
  → Quên finally → button stuck disabled!
  → Quên response.ok check!
```
