# UI Components Deep Dive — Phần 10: Digital Clock, File Explorer, Tic-tac-toe, Traffic Light

> 📅 2026-03-11 · ⏱ 50 phút đọc
>
> Chủ đề: Tự viết lại từ đầu — Digital Clock, File Explorer, Tic-tac-toe, Traffic Light
> Version: Vanilla JavaScript + React
> Không thư viện! Viết tay 100%!

---

## Mục Lục

| #   | Component     | Vanilla JS | React | Giải thích | RADIO |
| --- | ------------- | ---------- | ----- | ---------- | ----- |
| 1   | Digital Clock | §1.1       | §1.2  | §1.3       | §1.4  |
| 2   | File Explorer | §2.1       | §2.2  | §2.3       | §2.4  |
| 3   | Tic-tac-toe   | §3.1       | §3.2  | §3.3       | §3.4  |
| 4   | Traffic Light | §4.1       | §4.2  | §4.3       | §4.4  |

---

# 🕐 Component 1: Digital Clock

## Kiến Trúc Digital Clock

```
DIGITAL CLOCK — 7-SEGMENT DISPLAY:
═══════════════════════════════════════════════════════════════

   ┌───┐ ┌───┐   ┌───┐ ┌───┐   ┌───┐ ┌───┐
   │ 1 │ │ 2 │ : │ 3 │ │ 4 │ : │ 5 │ │ 6 │
   └───┘ └───┘   └───┘ └───┘   └───┘ └───┘
    H  H    :     M  M    :     S  S

  Mỗi SỐ = 7 segments:
     ─── a ───
    │         │
    f         b
    │         │
     ─── g ───
    │         │
    e         c
    │         │
     ─── d ───

  Số 0: a,b,c,d,e,f    (TẤT CẢ trừ g!)
  Số 1: b,c             (chỉ phải!)
  Số 2: a,b,d,e,g       (trên phải, dưới trái!)
  Số 3: a,b,c,d,g       (cả phải + ngang!)
  Số 4: b,c,f,g         (trái trên + phải + giữa!)
  Số 5: a,c,d,f,g       (trên trái, dưới phải!)
  Số 6: a,c,d,e,f,g     (tất cả trừ b!)
  Số 7: a,b,c            (trên + phải!)
  Số 8: a,b,c,d,e,f,g   (TẤT CẢ!)
  Số 9: a,b,c,d,f,g     (tất cả trừ e!)
```

### 📋 Phân tích yêu cầu — Digital Clock

```
CÂU HỎI CẦN HỎI INTERVIEWER:
═══════════════════════════════════════════════════════════════

  1. "12-hour hay 24-hour format?"
     → 24-hour: đơn giản hơn (không cần AM/PM!)
     → 12-hour: cần logic chuyển đổi!

  2. "7-segment rendering: CSS hay Canvas?"
     → CSS: div + border/clip-path!
     → Canvas: drawRect cho mỗi segment!
     → CSS cho interview!

  3. "Colon nhấp nháy (blink)?"
     → Optional! CSS animation blink!

  4. "Update interval?"
     → 1 giây (show seconds!)
     → setInterval(fn, 1000)!
```

---

## §1.1 Digital Clock — Vanilla JavaScript

```javascript
// ═══ Vanilla JS Digital Clock ═══

// Segment map: mỗi số → segments nào sáng!
// Thứ tự: [a, b, c, d, e, f, g]
const SEGMENT_MAP = {
  0: [1, 1, 1, 1, 1, 1, 0],
  1: [0, 1, 1, 0, 0, 0, 0],
  2: [1, 1, 0, 1, 1, 0, 1],
  3: [1, 1, 1, 1, 0, 0, 1],
  4: [0, 1, 1, 0, 0, 1, 1],
  5: [1, 0, 1, 1, 0, 1, 1],
  6: [1, 0, 1, 1, 1, 1, 1],
  7: [1, 1, 1, 0, 0, 0, 0],
  8: [1, 1, 1, 1, 1, 1, 1],
  9: [1, 1, 1, 1, 0, 1, 1],
};

class DigitalClock {
  constructor(container) {
    this.container =
      typeof container === 'string'
        ? document.querySelector(container)
        : container;
    this._init();
  }

  _init() {
    this.container.className = 'digital-clock';

    // Tạo 6 digits: HH:MM:SS
    this.digits = [];
    const segments = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];

    for (let i = 0; i < 6; i++) {
      // Thêm colon SAU digit 2 và 4!
      if (i === 2 || i === 4) {
        const colon = document.createElement('div');
        colon.className = 'colon';
        colon.innerHTML = '<span></span><span></span>';
        this.container.appendChild(colon);
      }

      const digitEl = document.createElement('div');
      digitEl.className = 'digit';

      segments.forEach((seg) => {
        const segEl = document.createElement('div');
        segEl.className = `segment segment-${seg}`;
        digitEl.appendChild(segEl);
      });

      this.container.appendChild(digitEl);
      this.digits.push(digitEl);
    }

    this._tick();
    this.intervalId = setInterval(() => this._tick(), 1000);
  }

  _tick() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    const time = h + m + s; // "143025"

    time.split('').forEach((char, i) => {
      const map = SEGMENT_MAP[parseInt(char)];
      const segs = this.digits[i].querySelectorAll('.segment');
      segs.forEach((seg, j) => {
        seg.classList.toggle('on', map[j] === 1);
      });
    });
  }

  destroy() {
    clearInterval(this.intervalId);
  }
}

new DigitalClock('#app');
```

```css
/* ═══ CSS 7-Segment Display ═══ */

.digital-clock {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #1a1a2e;
  padding: 30px;
  border-radius: 16px;
}

.digit {
  position: relative;
  width: 40px;
  height: 70px;
}

/* Segment chung: thanh ngang/dọc! */
.segment {
  position: absolute;
  background: #333;
  border-radius: 2px;
  transition: background 0.15s;
}

.segment.on {
  background: #0ff;
  box-shadow: 0 0 8px #0ff;
}

/* Thanh NGANG: a (trên), g (giữa), d (dưới) */
.segment-a { top: 0; left: 4px; width: 32px; height: 4px; }
.segment-g { top: 33px; left: 4px; width: 32px; height: 4px; }
.segment-d { top: 66px; left: 4px; width: 32px; height: 4px; }

/* Thanh DỌC: f,e (trái), b,c (phải) */
.segment-f { top: 4px; left: 0; width: 4px; height: 29px; }
.segment-e { top: 37px; left: 0; width: 4px; height: 29px; }
.segment-b { top: 4px; right: 0; width: 4px; height: 29px; }
.segment-c { top: 37px; right: 0; width: 4px; height: 29px; }

/* Colon: 2 chấm tròn */
.colon {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 10px 4px;
}
.colon span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #0ff;
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  50% { opacity: 0; }
}
```

### Giải thích — Line by line

**SEGMENT_MAP — Lookup table pattern:**

```
SEGMENT MAP — TẠI SAO DÙNG OBJECT:
═══════════════════════════════════════════════════════════════

  Mỗi số 0-9 → 7 segments on/off!
  SEGMENT_MAP[0] = [1,1,1,1,1,1,0]
  → segments a,b,c,d,e,f = ON (1)
  → segment g = OFF (0)
  → Hiện số 0 (không có gạch giữa!)

  Tại sao KHÔNG dùng if/switch?
  → 10 số × 7 segments = 70 conditions!
  → Lookup table: O(1) access!
  → Dễ đọc, dễ maintain!

  Alternative: bitmask!
  → 0 = 0b1111110 = 0x7E
  → 1 = 0b0110000 = 0x30
  → Compact hơn nhưng KHÓ ĐỌC!
```

**`setInterval` vs `requestAnimationFrame` — Clock:**

```
SETINTERVAL CHO CLOCK:
═══════════════════════════════════════════════════════════════

  Clock ≠ Animation!
  → Clock: update 1 lần/giây → setInterval(fn, 1000)!
  → Animation: 60fps smoothly → requestAnimationFrame!

  Tại sao KHÔNG rAF cho clock?
  → rAF = 60 calls/giây! Waste cho clock!
  → Clock chỉ cần 1 call/giây!
  → setInterval = ĐỦ và hiệu quả!

  Drift problem:
  → setInterval(fn, 1000) có thể trễ ~1-15ms!
  → Sau 1 giờ: có thể lệch vài giây!
  → Fix: đọc new Date() mỗi tick (code hiện tại!)
  → KHÔNG tự đếm seconds (sẽ drift!)
```

---

## §1.2 Digital Clock — React

```jsx
// ═══ React Digital Clock ═══

import { useState, useEffect } from 'react';

const SEGMENT_MAP = {
  0: [1,1,1,1,1,1,0], 1: [0,1,1,0,0,0,0],
  2: [1,1,0,1,1,0,1], 3: [1,1,1,1,0,0,1],
  4: [0,1,1,0,0,1,1], 5: [1,0,1,1,0,1,1],
  6: [1,0,1,1,1,1,1], 7: [1,1,1,0,0,0,0],
  8: [1,1,1,1,1,1,1], 9: [1,1,1,1,0,1,1],
};

const SEGMENTS = ['a','b','c','d','e','f','g'];

function Digit({ value }) {
  const map = SEGMENT_MAP[value];
  return (
    <div className="digit">
      {SEGMENTS.map((seg, i) => (
        <div
          key={seg}
          className={`segment segment-${seg} ${map[i] ? 'on' : ''}`}
        />
      ))}
    </div>
  );
}

function DigitalClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const h = String(time.getHours()).padStart(2, '0');
  const m = String(time.getMinutes()).padStart(2, '0');
  const s = String(time.getSeconds()).padStart(2, '0');

  return (
    <div className="digital-clock">
      <Digit value={+h[0]} /><Digit value={+h[1]} />
      <div className="colon"><span /><span /></div>
      <Digit value={+m[0]} /><Digit value={+m[1]} />
      <div className="colon"><span /><span /></div>
      <Digit value={+s[0]} /><Digit value={+s[1]} />
    </div>
  );
}
```

### Giải thích React

**`useState(new Date())` — Tại sao lưu cả Date object:**

```
STATE STRATEGY:
═══════════════════════════════════════════════════════════════

  ❌ useState('14:30:25'):
  → String formatting MỖI GIÂY trong setInterval!
  → Nếu cần đổi format (12h/24h) → sửa setInterval!

  ✅ useState(new Date()):
  → Lưu raw data! Format ở render!
  → Đổi format: chỉ sửa render logic!
  → Single source of truth!
```

---

# 🎤 RADIO Interview Walkthrough — Digital Clock

### R — Requirements

```
REQUIREMENTS:
═══════════════════════════════════════════════════════════════

  1. HH:MM:SS format (24-hour!)
  2. 7-segment display cho mỗi digit!
  3. Update mỗi giây!
  4. Colon blinking (optional!)
```

### A — Architecture

```
ARCHITECTURE:
═══════════════════════════════════════════════════════════════

  App
  ├── setInterval(1000ms) → new Date()
  ├── Format: HH:MM:SS → 6 digits
  └── 6 × Digit component
      └── 7 × Segment div
          └── class "on"/"off" từ SEGMENT_MAP

  Key: SEGMENT_MAP[number] → boolean[7]!
```

### I — Implementation

```
IMPLEMENTATION:
═══════════════════════════════════════════════════════════════

  BƯỚC 1 (5 phút): SEGMENT_MAP + CSS segments!
  → Lookup table cho 0-9!
  → CSS absolute positioning cho 7 thanh!

  BƯỚC 2 (3 phút): Clock logic!
  → setInterval → new Date() → format!

  BƯỚC 3 (2 phút): Toggle segments on/off!
  → classList.toggle('on', map[j])!

  BƯỚC 4 (5 phút): Styling!
  → Neon glow (box-shadow!)
  → Colon blink animation!
```

### Edge Cases

```
EDGE CASES:
═══════════════════════════════════════════════════════════════

  1. MIDNIGHT: 00:00:00 → all segments correct!
  2. DRIFT: setInterval delay → read Date mỗi tick!
  3. TAB HIDDEN: setInterval throttled → Date.now() accurate!
  4. 12-HOUR: hour > 12 → subtract 12, add AM/PM!
  5. TIMEZONE: new Date() = local time tự động!
  6. MEMORY LEAK: clearInterval trong destroy/cleanup!
```

```
INTERVIEW TIPS:
═══════════════════════════════════════════════════════════════

  💡 KEY POINTS:
  → "SEGMENT_MAP = lookup table O(1)!"
  → "setInterval cho clock, KHÔNG rAF!"
  → "Đọc new Date() mỗi tick — không tự đếm!"
  → "CSS absolute positioning cho segments!"

  ⚠ SAI LẦM:
  → Tự đếm seconds (drift!)
  → rAF cho clock (waste CPU!)
  → Quên clearInterval (memory leak!)
  → Hardcode segment vị trí bằng JS thay CSS!
```

---

# 📁 Component 2: File Explorer

## Kiến Trúc File Explorer

```
FILE EXPLORER — RECURSIVE TREE:
═══════════════════════════════════════════════════════════════

  📁 Documents ▼              ← directory (expanded!)
  │  📁 Photos ▶              ← directory (collapsed!)
  │  📄 Word.doc              ← file (leaf!)
  │  📄 Powerpoint.ppt        ← file (leaf!)
  📁 Downloads ▶              ← directory (collapsed!)
  📄 README.md                ← file (root level!)

  Data structure (RECURSIVE!):
  interface FileObject {
    id: number;
    name: string;
    children?: FileObject[];  ← optional = file!
  }

  children có → DIRECTORY!
  children không có → FILE!
  children rỗng [] → empty directory!
```

### 📋 Phân tích yêu cầu

```
CÂU HỎI CẦN HỎI:
═══════════════════════════════════════════════════════════════

  1. "Sort order?"
     → Directories TRƯỚC files!
     → Alphabetical trong mỗi nhóm!

  2. "Default: expanded hay collapsed?"
     → Collapsed! User click để mở!

  3. "Empty directories?"
     → Cho phép! Hiện ▶ nhưng click → rỗng!

  4. "Click file có action gì?"
     → Scope: không! Chỉ hiện tên!

  5. "Indentation bao nhiêu?"
     → Mỗi level indent thêm ~20px!
```

---

## §2.1 File Explorer — Vanilla JavaScript

```javascript
// ═══ Vanilla JS File Explorer ═══

const fileData = [
  { id: 1, name: 'README.md' },
  {
    id: 2, name: 'Documents',
    children: [
      { id: 3, name: 'Word.doc' },
      { id: 4, name: 'Powerpoint.ppt' },
      {
        id: 5, name: 'Photos',
        children: [
          { id: 6, name: 'vacation.jpg' },
          { id: 7, name: 'profile.png' },
        ],
      },
    ],
  },
  {
    id: 8, name: 'Downloads',
    children: [{ id: 9, name: 'setup.exe' }],
  },
];

function sortItems(items) {
  return [...items].sort((a, b) => {
    // Directories trước files!
    const aIsDir = a.children != null;
    const bIsDir = b.children != null;
    if (aIsDir !== bIsDir) return aIsDir ? -1 : 1;
    // Alphabetical trong cùng nhóm!
    return a.name.localeCompare(b.name);
  });
}

function renderTree(items, container, depth = 0) {
  const sorted = sortItems(items);

  sorted.forEach((item) => {
    const isDir = item.children != null;
    const row = document.createElement('div');
    row.className = 'tree-item';
    row.style.paddingLeft = `${depth * 20}px`;

    if (isDir) {
      // Directory: clickable, expandable!
      const arrow = document.createElement('span');
      arrow.className = 'arrow';
      arrow.textContent = '▶';

      const name = document.createElement('span');
      name.textContent = `📁 ${item.name}`;

      const childContainer = document.createElement('div');
      childContainer.className = 'tree-children';
      childContainer.style.display = 'none';

      row.appendChild(arrow);
      row.appendChild(name);
      row.style.cursor = 'pointer';

      row.addEventListener('click', (e) => {
        e.stopPropagation(); // QUAN TRỌNG!
        const expanded = childContainer.style.display !== 'none';
        childContainer.style.display = expanded ? 'none' : 'block';
        arrow.textContent = expanded ? '▶' : '▼';
      });

      container.appendChild(row);
      container.appendChild(childContainer);

      // RECURSIVE! Render children!
      renderTree(item.children, childContainer, depth + 1);
    } else {
      // File: leaf node, no interaction!
      row.textContent = `📄 ${item.name}`;
      row.style.paddingLeft = `${depth * 20 + 20}px`;
      container.appendChild(row);
    }
  });
}

const root = document.querySelector('#app');
renderTree(fileData, root);
```

### Giải thích — Line by line

**Recursion — Tại sao cần:**

```
RECURSION — FILE TREE:
═══════════════════════════════════════════════════════════════

  File tree = NESTED data structure!
  → Depth không biết trước!
  → Có thể 1 level, có thể 10 levels!

  Loop KHÔNG đủ:
  for (item of items) {
    // render item
    // Nhưng item.children cũng có children!
    // Và children.children cũng có children!
    // → Bao nhiêu loop lồng nhau? KHÔNG BIẾT!
  }

  RECURSION = hàm GỌI CHÍNH NÓ:
  function renderTree(items) {
    items.forEach(item => {
      if (item.children) {
        renderTree(item.children);  ← GỌI LẠI!
      }
    });
  }
  → Mỗi level gọi renderTree cho children!
  → Children gọi renderTree cho grandchildren!
  → Tự dừng khi item không có children (base case!)
```

**`e.stopPropagation()` — Tại sao BẮT BUỘC:**

```
STOPPROPAGATION — NESTED CLICKS:
═══════════════════════════════════════════════════════════════

  Vấn đề: directories LỒNG NHAU!

  📁 Documents (click handler!)
  │  📁 Photos (click handler!)
  │  │  📄 vacation.jpg

  Click "Photos":
  → KHÔNG có stopPropagation:
    1. Photos click fires! ✅
    2. Event BUBBLE UP → Documents click fires! 💀
    3. Cả Photos VÀ Documents toggle! SAI!

  → CÓ stopPropagation:
    1. Photos click fires! ✅
    2. Event DỪNG! Không bubble! ✅
    3. Chỉ Photos toggle! ĐÚNG!
```

**`localeCompare` — Sort đúng cách:**

```
LOCALECOMPARE vs SO SÁNH THƯỜNG:
═══════════════════════════════════════════════════════════════

  'á'.localeCompare('b') → -1 (á trước b! ✅)
  'á' < 'b' → false (so sánh Unicode! 💀)

  localeCompare hiểu NGÔN NGỮ!
  → Tiếng Việt: ă, â, đ đúng thứ tự!
  → Case-insensitive option: { sensitivity: 'base' }
  
  Phỏng vấn: mention localeCompare = điểm cộng!
```

---

## §2.2 File Explorer — React

```jsx
// ═══ React File Explorer ═══

import { useState } from 'react';

function sortItems(items) {
  return [...items].sort((a, b) => {
    const aIsDir = a.children != null;
    const bIsDir = b.children != null;
    if (aIsDir !== bIsDir) return aIsDir ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

function FileItem({ item, depth = 0 }) {
  const [expanded, setExpanded] = useState(false);
  const isDir = item.children != null;

  if (!isDir) {
    return (
      <div className="tree-item" style={{ paddingLeft: (depth * 20 + 20) }}>
        📄 {item.name}
      </div>
    );
  }

  const sorted = sortItems(item.children);

  return (
    <div>
      <div
        className="tree-item tree-dir"
        style={{ paddingLeft: depth * 20, cursor: 'pointer' }}
        onClick={() => setExpanded((prev) => !prev)}
      >
        <span className="arrow">{expanded ? '▼' : '▶'}</span>
        📁 {item.name}
      </div>
      {expanded && (
        <div className="tree-children">
          {sorted.map((child) => (
            <FileItem key={child.id} item={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function FileExplorer({ data }) {
  const sorted = sortItems(data);
  return (
    <div className="file-explorer">
      {sorted.map((item) => (
        <FileItem key={item.id} item={item} depth={0} />
      ))}
    </div>
  );
}
```

### Giải thích React

**Component đệ quy — `FileItem` render chính nó:**

```
RECURSIVE COMPONENT:
═══════════════════════════════════════════════════════════════

  FileItem render FileItem!
  → Mỗi directory render children là FileItem!
  → Children cũng render children là FileItem!
  → Base case: file (không có children!) → leaf!

  React handles recursion NATURALLY:
  → Mỗi FileItem có STATE RIÊNG (expanded!)
  → Expand Documents ≠ affect Photos!
  → Component isolation! ✅
```

**Conditional rendering `{expanded && ...}` — Lazy render:**

```
LAZY RENDER:
═══════════════════════════════════════════════════════════════

  {expanded && sorted.map(child => <FileItem ... />)}

  expanded = false:
  → false && ... = false → KHÔNG render children!
  → Children FileItems KHÔNG TỒN TẠI trong DOM!
  → Tiết kiệm memory + performance!

  expanded = true:
  → true && ... = render children!
  → Mount lần đầu → tạo state cho mỗi child!

  vs display: none:
  → display: none → render TẤT CẢ nhưng ẩn!
  → Lãng phí nếu tree rất lớn!
  → Conditional rendering = tốt hơn cho tree!
```

---

# 🎤 RADIO Interview Walkthrough — File Explorer

### R — Requirements

```
REQUIREMENTS:
═══════════════════════════════════════════════════════════════

  1. Hiện file/directory names!
  2. Directories: expandable/collapsible!
  3. Directories TRƯỚC files! Alphabetical!
  4. Indentation = hierarchy!
  5. Empty directories: cho phép!
  6. Files: không interactive!
```

### A — Architecture

```
ARCHITECTURE:
═══════════════════════════════════════════════════════════════

  FileExplorer
  └── FileItem (RECURSIVE!)
      ├── isDir? → clickable + arrow + children!
      │   └── expanded → render FileItem for each child!
      └── isFile? → leaf, no interaction!

  Key: RECURSION cho nested data!
  State: mỗi directory có expanded boolean riêng!
```

### I — Implementation

```
IMPLEMENTATION:
═══════════════════════════════════════════════════════════════

  BƯỚC 1 (3 phút): Data structure + sort function!
  → sortItems: directories first, then alphabetical!
  BƯỚC 2 (5 phút): Recursive render!
  → isDir? → render arrow + children container!
  → isFile? → render leaf!
  BƯỚC 3 (3 phút): Toggle expand/collapse!
  → Click handler + stopPropagation!
  BƯỚC 4 (2 phút): Indentation!
  → paddingLeft = depth * 20px!
```

### Edge Cases

```
EDGE CASES:
═══════════════════════════════════════════════════════════════

  1. EMPTY DIRECTORY: children = [] → show folder, click OK!
  2. DEEPLY NESTED: 20 levels → paddingLeft rất lớn!
     → Fix: max depth hoặc horizontal scroll!
  3. LARGE DATASET: 10000 files → virtualization!
  4. DUPLICATE NAMES: different IDs → key handles!
  5. SPECIAL CHARACTERS: HTML entities in names!
  6. CLICK PROPAGATION: nested dirs → stopPropagation!
```

```
INTERVIEW TIPS:
═══════════════════════════════════════════════════════════════

  💡 KEY POINTS:
  → "Recursion cho tree structure!"
  → "stopPropagation cho nested click handlers!"
  → "Directories trước files, alphabetical sort!"
  → "Each directory has independent state!"

  🎯 ĐIỂM CỘNG:
  → Mention virtualization cho large trees!
  → Mention lazy loading cho remote data!
  → Mention keyboard navigation (arrows!)
  → Mention aria-expanded cho accessibility!

  ⚠ SAI LẦM:
  → Quên stopPropagation → nested clicks!
  → Sort files trước directories!
  → Quên empty directory case!
  → Render ALL children even when collapsed!
```

---

# ❌⭕ Component 3: Tic-tac-toe

## Kiến Trúc Tic-tac-toe

```
TIC-TAC-TOE:
═══════════════════════════════════════════════════════════════

  Status: Player X's turn!

  ┌─────┬─────┬─────┐
  │  X  │  O  │  X  │  cells[0] cells[1] cells[2]
  ├─────┼─────┼─────┤
  │     │  X  │  O  │  cells[3] cells[4] cells[5]
  ├─────┼─────┼─────┤
  │  O  │     │  X  │  cells[6] cells[7] cells[8]
  └─────┴─────┴─────┘

  Win conditions (8 tổng!):
  Rows:     [0,1,2] [3,4,5] [6,7,8]
  Columns:  [0,3,6] [1,4,7] [2,5,8]
  Diagonals:[0,4,8] [2,4,6]

      [ Reset ]
```

---

## §3.1 Tic-tac-toe — Vanilla JavaScript

```javascript
// ═══ Vanilla JS Tic-tac-toe ═══

const WIN_CONDITIONS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
  [0, 4, 8], [2, 4, 6],            // diagonals
];

class TicTacToe {
  constructor(container) {
    this.container =
      typeof container === 'string'
        ? document.querySelector(container)
        : container;
    this.board = Array(9).fill(null);
    this.isXTurn = true;
    this.winner = null;
    this._init();
  }

  _init() {
    this.container.innerHTML = `
      <div class="ttt-status" id="status">Player X's turn</div>
      <div class="ttt-board" id="board"></div>
      <button class="ttt-reset" id="resetBtn">Reset</button>
    `;

    this.statusEl = this.container.querySelector('#status');
    this.boardEl = this.container.querySelector('#board');
    this.resetBtn = this.container.querySelector('#resetBtn');

    // Tạo 9 cells!
    this.cells = [];
    for (let i = 0; i < 9; i++) {
      const cell = document.createElement('div');
      cell.className = 'ttt-cell';
      cell.addEventListener('click', () => this._handleClick(i));
      this.boardEl.appendChild(cell);
      this.cells.push(cell);
    }

    this.resetBtn.addEventListener('click', () => this.reset());
  }

  _handleClick(index) {
    // Guard: ô đã đánh hoặc đã có winner!
    if (this.board[index] !== null || this.winner) return;

    // Đánh!
    this.board[index] = this.isXTurn ? 'X' : 'O';
    this.cells[index].textContent = this.board[index];
    this.cells[index].classList.add(this.isXTurn ? 'x' : 'o');

    // Check win!
    this.winner = this._checkWinner();
    if (this.winner) {
      this.statusEl.textContent = `Player ${this.winner} wins! 🎉`;
      return;
    }

    // Check draw!
    if (this.board.every((cell) => cell !== null)) {
      this.statusEl.textContent = "It's a draw! 🤝";
      return;
    }

    // Switch turn!
    this.isXTurn = !this.isXTurn;
    this.statusEl.textContent = `Player ${this.isXTurn ? 'X' : 'O'}'s turn`;
  }

  _checkWinner() {
    for (const [a, b, c] of WIN_CONDITIONS) {
      if (
        this.board[a] &&
        this.board[a] === this.board[b] &&
        this.board[a] === this.board[c]
      ) {
        return this.board[a]; // 'X' hoặc 'O'!
      }
    }
    return null;
  }

  reset() {
    this.board = Array(9).fill(null);
    this.isXTurn = true;
    this.winner = null;
    this.statusEl.textContent = "Player X's turn";
    this.cells.forEach((cell) => {
      cell.textContent = '';
      cell.className = 'ttt-cell';
    });
  }
}

new TicTacToe('#app');
```

```css
/* ═══ CSS Tic-tac-toe ═══ */

.ttt-board {
  display: grid;
  grid-template-columns: repeat(3, 100px);
  grid-template-rows: repeat(3, 100px);
  gap: 4px;
  background: #333;
  border-radius: 8px;
  overflow: hidden;
}

.ttt-cell {
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s;
}

.ttt-cell:hover { background: #f0f0f0; }
.ttt-cell.x { color: #e53e3e; }
.ttt-cell.o { color: #3182ce; }
```

### Giải thích — Line by line

**WIN_CONDITIONS — flat array:**

```
WIN CHECK — ELEGANT PATTERN:
═══════════════════════════════════════════════════════════════

  Board = 1D array (KHÔNG phải 2D!):
  [0] [1] [2]     → board[0..8]
  [3] [4] [5]
  [6] [7] [8]

  Tại sao 1D, không phải 2D?
  → 2D: board[row][col] → cần 2 index!
  → 1D: board[i] → 1 index! Đơn giản hơn!
  → Index → row: Math.floor(i/3), col: i%3

  WIN_CONDITIONS = 8 tổ hợp thắng:
  → Duyệt qua TỪNG tổ hợp!
  → 3 ô giống nhau VÀ không null → WIN!

  board[a] && board[a] === board[b] && board[a] === board[c]
  → board[a] = truthy check (không null!)
  → 3 ô CÙNG giá trị ('X' hoặc 'O')!
```

**`Array(9).fill(null)` — Tại sao null:**

```
ARRAY(9).FILL(NULL):
═══════════════════════════════════════════════════════════════

  Array(9) → [empty × 9] → sparse array!
  Array(9).fill(null) → [null, null, ... null]

  Tại sao null, không phải '' hoặc 0?
  → null = "chưa đánh"! Semantic rõ ràng!
  → '': falsy, nhưng 0 cũng falsy → confusing!
  → null: rõ ràng "CHƯA CÓ GIÁ TRỊ"!

  Check: board[i] !== null → ô đã đánh!
  Check: board.every(cell => cell !== null) → DRAW!
```

---

## §3.2 Tic-tac-toe — React

```jsx
// ═══ React Tic-tac-toe ═══

import { useState, useCallback } from 'react';

const WIN_CONDITIONS = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6],
];

function checkWinner(board) {
  for (const [a, b, c] of WIN_CONDITIONS) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
}

function TicTacToe() {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXTurn, setIsXTurn] = useState(true);

  const winner = checkWinner(board);
  const isDraw = !winner && board.every((c) => c !== null);

  const status = winner
    ? `Player ${winner} wins! 🎉`
    : isDraw
    ? "It's a draw! 🤝"
    : `Player ${isXTurn ? 'X' : 'O'}'s turn`;

  const handleClick = useCallback((index) => {
    if (board[index] || winner) return;

    setBoard((prev) => {
      const next = [...prev];
      next[index] = isXTurn ? 'X' : 'O';
      return next;
    });
    setIsXTurn((prev) => !prev);
  }, [board, winner, isXTurn]);

  const reset = useCallback(() => {
    setBoard(Array(9).fill(null));
    setIsXTurn(true);
  }, []);

  return (
    <div>
      <div className="ttt-status">{status}</div>
      <div className="ttt-board">
        {board.map((cell, i) => (
          <div
            key={i}
            className={`ttt-cell ${cell ? cell.toLowerCase() : ''}`}
            onClick={() => handleClick(i)}
          >
            {cell}
          </div>
        ))}
      </div>
      <button className="ttt-reset" onClick={reset}>Reset</button>
    </div>
  );
}
```

### Giải thích React

**`winner` = derived state — KHÔNG useState:**

```
DERIVED STATE:
═══════════════════════════════════════════════════════════════

  ❌ const [winner, setWinner] = useState(null);
  → Phải setWinner mỗi move → DỄ QUÊN!
  → 2 states (board + winner) có thể OUT OF SYNC!

  ✅ const winner = checkWinner(board);
  → Tính TỪ board mỗi render!
  → LUÔN đúng! Không thể out of sync!
  → "Derived state" = tính từ state khác!

  Quy tắc: nếu CÓ THỂ tính từ state khác → ĐỪ useState!
```

---

# 🎤 RADIO Interview Walkthrough — Tic-tac-toe

### R — Requirements

```
REQUIREMENTS:
═══════════════════════════════════════════════════════════════

  1. 3×3 grid, 2 players (X, O)!
  2. Alternating turns!
  3. Win detection: 3 in a row/col/diagonal!
  4. Draw detection: all cells filled!
  5. Status display: turn, winner, draw!
  6. Reset button!
```

### I — Implementation

```
IMPLEMENTATION:
═══════════════════════════════════════════════════════════════

  BƯỚC 1 (3 phút): HTML grid + CSS!
  → grid-template-columns: repeat(3, 100px)!
  BƯỚC 2 (5 phút): Click handler + turn logic!
  → Guard: cell taken or game over!
  BƯỚC 3 (5 phút): Win detection!
  → 8 WIN_CONDITIONS array!
  BƯỚC 4 (2 phút): Draw detection!
  → board.every(cell => cell !== null)!
  BƯỚC 5 (2 phút): Reset!
  → Array(9).fill(null)!
```

### Edge Cases

```
EDGE CASES:
═══════════════════════════════════════════════════════════════

  1. CLICK TAKEN CELL: guard → return!
  2. CLICK AFTER WIN: winner guard → return!
  3. DRAW: all filled, no winner!
  4. WIN ON LAST MOVE: check win BEFORE draw!
  5. DOUBLE-CLICK SAME CELL: already filled → no-op!
```

```
INTERVIEW TIPS:
═══════════════════════════════════════════════════════════════

  💡 KEY POINTS:
  → "1D array, KHÔNG 2D — simpler!"
  → "WIN_CONDITIONS = constant array!"
  → "Derived state for winner!"
  → "Guard clicks: taken cell + game over!"

  🎯 ĐIỂM CỘNG:
  → Mention AI opponent (minimax!)
  → Mention undo/redo (history array!)
  → Mention highlight winning cells!
  → Mention NxN generalization!
```

---

# 🚦 Component 4: Traffic Light

## Kiến Trúc Traffic Light

```
TRAFFIC LIGHT — STATE MACHINE:
═══════════════════════════════════════════════════════════════

  ┌─────────┐
  │  ┌───┐  │
  │  │ 🔴│  │  ← Red: 4000ms
  │  └───┘  │
  │  ┌───┐  │
  │  │ 🟡│  │  ← Yellow: 500ms
  │  └───┘  │
  │  ┌───┐  │
  │  │ 🟢│  │  ← Green: 3000ms
  │  └───┘  │
  └─────────┘

  Cycle: GREEN → YELLOW → RED → GREEN → ...
                3000ms   500ms   4000ms

  State machine (3 states, 3 transitions!):
  GREEN ──3000ms──→ YELLOW ──500ms──→ RED ──4000ms──→ GREEN
```

---

## §4.1 Traffic Light — Vanilla JavaScript

```javascript
// ═══ Vanilla JS Traffic Light ═══

const LIGHT_CONFIG = {
  green:  { color: '#22c55e', duration: 3000, next: 'yellow' },
  yellow: { color: '#eab308', duration: 500,  next: 'red' },
  red:    { color: '#ef4444', duration: 4000, next: 'green' },
};

class TrafficLight {
  constructor(container) {
    this.container =
      typeof container === 'string'
        ? document.querySelector(container)
        : container;
    this.currentLight = 'green';
    this._init();
  }

  _init() {
    this.container.innerHTML = `
      <div class="traffic-light">
        <div class="light" id="red"></div>
        <div class="light" id="yellow"></div>
        <div class="light" id="green"></div>
      </div>
    `;
    this.lights = {
      red: this.container.querySelector('#red'),
      yellow: this.container.querySelector('#yellow'),
      green: this.container.querySelector('#green'),
    };

    this._switchLight(this.currentLight);
  }

  _switchLight(color) {
    this.currentLight = color;
    const config = LIGHT_CONFIG[color];

    // Tắt tất cả!
    Object.values(this.lights).forEach((el) => {
      el.style.background = '#333';
      el.style.boxShadow = 'none';
    });

    // Bật light hiện tại!
    this.lights[color].style.background = config.color;
    this.lights[color].style.boxShadow = `0 0 20px ${config.color}`;

    // Schedule next light!
    this.timeoutId = setTimeout(() => {
      this._switchLight(config.next);
    }, config.duration);
  }

  destroy() {
    clearTimeout(this.timeoutId);
  }
}

new TrafficLight('#app');
```

```css
/* ═══ CSS Traffic Light ═══ */

.traffic-light {
  background: #1a1a1a;
  border-radius: 20px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 80px;
}

.light {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: #333;
  transition: background 0.3s, box-shadow 0.3s;
}
```

### Giải thích — Line by line

**LIGHT_CONFIG — Data-driven design:**

```
CONFIG OBJECT — TẠI SAO QUAN TRỌNG:
═══════════════════════════════════════════════════════════════

  ❌ if/switch approach:
  if (current === 'green') {
    duration = 3000;
    next = 'yellow';
  } else if (current === 'yellow') {
    duration = 500;
    next = 'red';
  } else { ... }
  → 3 blocks! Thêm state = thêm if! KHÓ MAINTAIN!

  ✅ Config object:
  LIGHT_CONFIG[color] → { duration, next, color }
  → O(1) lookup! 
  → Thêm state: thêm 1 entry vào config!
  → DATAS drive logic, KHÔNG phải code!

  Bonus: có thể externalize config:
  → Load from JSON/API!
  → Thay đổi timing KHÔNG cần sửa code!
```

**`setTimeout` recursive — Tại sao không `setInterval`:**

```
SETTIMEOUT RECURSIVE vs SETINTERVAL:
═══════════════════════════════════════════════════════════════

  setInterval: CÙNG interval mỗi lần!
  → setInterval(fn, 3000)
  → Nhưng mỗi light CẦN duration KHÁC nhau!
  → Green 3000, Yellow 500, Red 4000!
  → KHÔNG thể dùng 1 setInterval!

  setTimeout recursive:
  → setTimeout(switchToYellow, 3000)  ← green duration!
  → setTimeout(switchToRed, 500)      ← yellow duration!
  → setTimeout(switchToGreen, 4000)   ← red duration!
  → MỖI light schedule RIÊNG! ✅

  Đây là pattern "recursive setTimeout"!
  → Linh hoạt hơn setInterval!
  → Mỗi step có thể có duration KHÁC!
```

---

## §4.2 Traffic Light — React

```jsx
// ═══ React Traffic Light ═══

import { useState, useEffect } from 'react';

const LIGHT_CONFIG = {
  green:  { color: '#22c55e', duration: 3000, next: 'yellow' },
  yellow: { color: '#eab308', duration: 500,  next: 'red' },
  red:    { color: '#ef4444', duration: 4000, next: 'green' },
};

function TrafficLight() {
  const [currentLight, setCurrentLight] = useState('green');

  useEffect(() => {
    const config = LIGHT_CONFIG[currentLight];
    const timeoutId = setTimeout(() => {
      setCurrentLight(config.next);
    }, config.duration);

    return () => clearTimeout(timeoutId);
  }, [currentLight]);

  return (
    <div className="traffic-light">
      {['red', 'yellow', 'green'].map((color) => (
        <div
          key={color}
          className="light"
          style={{
            background: currentLight === color
              ? LIGHT_CONFIG[color].color
              : '#333',
            boxShadow: currentLight === color
              ? `0 0 20px ${LIGHT_CONFIG[color].color}`
              : 'none',
          }}
        />
      ))}
    </div>
  );
}
```

### Giải thích React

**`useEffect[currentLight]` — Self-scheduling pattern:**

```
SELF-SCHEDULING EFFECT:
═══════════════════════════════════════════════════════════════

  useEffect chạy khi currentLight THAY ĐỔI!

  1. Mount: currentLight = 'green'
     → useEffect: setTimeout(→yellow, 3000)!
  2. 3s sau: setCurrentLight('yellow')
     → cleanup: clearTimeout cũ!
     → useEffect lại: setTimeout(→red, 500)!
  3. 0.5s sau: setCurrentLight('red')
     → cleanup + setTimeout(→green, 4000)!
  4. 4s sau: setCurrentLight('green')
     → Quay lại bước 1! LOOP! ♻️

  Pattern: state change → effect → setTimeout
           → state change → effect → ...
  → SELF-SCHEDULING! Không cần setInterval!
  → Mỗi state có duration RIÊNG!

  Cleanup clearTimeout:
  → Nếu component unmount giữa chừng!
  → Không cleanup → setState trên unmounted!
```

---

# 🎤 RADIO Interview Walkthrough — Traffic Light

### R — Requirements

```
REQUIREMENTS:
═══════════════════════════════════════════════════════════════

  1. 3 lights: Red (4s), Yellow (0.5s), Green (3s)!
  2. Cycle: Green → Yellow → Red → Green → ...!
  3. Loop indefinitely!
  4. Visual: circle lights with glow!
```

### A — Architecture

```
ARCHITECTURE — STATE MACHINE:
═══════════════════════════════════════════════════════════════

  State: currentLight ∈ { 'green', 'yellow', 'red' }
  Config: LIGHT_CONFIG[state] → { duration, next, color }
  
  Transition:
  green ──3000ms──→ yellow ──500ms──→ red ──4000ms──→ green
  
  Mechanism: setTimeout(→next, duration) recursive!
```

### I — Implementation

```
IMPLEMENTATION:
═══════════════════════════════════════════════════════════════

  BƯỚC 1 (2 phút): LIGHT_CONFIG object!
  BƯỚC 2 (3 phút): HTML 3 circles + CSS!
  BƯỚC 3 (5 phút): setTimeout recursive switch!
  → Tắt tất cả → bật current → schedule next!
  BƯỚC 4 (2 phút): React useEffect pattern!
```

### Edge Cases

```
EDGE CASES:
═══════════════════════════════════════════════════════════════

  1. TAB HIDDEN: setTimeout throttled!
     → Nhưng vẫn chạy (không vấn đề!)
  2. UNMOUNT: clearTimeout trong cleanup!
  3. RAPID MOUNT/UNMOUNT: race condition!
     → Cleanup handles correctly!
  4. CONFIG CHANGE: update duration động!
     → Config object dễ update!
```

```
INTERVIEW TIPS:
═══════════════════════════════════════════════════════════════

  💡 KEY POINTS:
  → "Config object = data-driven, không if/switch!"
  → "setTimeout recursive, KHÔNG setInterval!"
  → "React: useEffect[state] self-scheduling!"
  → "Cleanup clearTimeout!"

  🎯 ĐIỂM CỘNG:
  → Mention config externalization!
  → Mention pedestrian button (event-driven override!)
  → Mention CSS transition cho smooth light change!
  → Mention aria-live cho accessibility!

  ⚠ SAI LẦM:
  → setInterval (khác duration mỗi light!)
  → if/switch thay vì config object!
  → Quên clearTimeout cleanup!
  → Hardcode color strings thay vì config!
```
