# UI Components Deep Dive — Phần 11: Tic-tac-toe II, Image Carousel I → II → III

> 📅 2026-03-11 · ⏱ 50 phút đọc
>
> Chủ đề: Tự viết lại từ đầu — Tic-tac-toe II (NxN), Image Carousel tiến hóa
> Version: Vanilla JavaScript + React
> Không thư viện! Viết tay 100%!

---

## Mục Lục

| #   | Component          | Vanilla JS | React | Giải thích | RADIO |
| --- | ------------------ | ---------- | ----- | ---------- | ----- |
| 1   | Tic-tac-toe II     | §1.1       | §1.2  | §1.3       | §1.4  |
| 2   | Image Carousel I   | §2.1       | §2.2  | §2.3       | §2.4  |
| 3   | Image Carousel II  | §3.1       | §3.2  | §3.3       | §3.4  |
| 4   | Image Carousel III | §4.1       | §4.2  | §4.3       | §4.4  |

---

# ❌⭕ Component 1: Tic-tac-toe II (NxN Board, M-in-a-row)

## Kiến Trúc Tic-tac-toe II

```
TIC-TAC-TOE II — NxN BOARD:
═══════════════════════════════════════════════════════════════

  Ví dụ: N=5, M=4 (cần 4 liên tiếp để thắng!)

  Status: Player X's turn!

  ┌────┬────┬────┬────┬────┐
  │  X │    │  O │    │    │  row 0
  ├────┼────┼────┼────┼────┤
  │    │  X │    │  O │    │  row 1
  ├────┼────┼────┼────┼────┤
  │  O │    │  X │    │    │  row 2
  ├────┼────┼────┼────┼────┤
  │    │    │    │  X │    │  row 3
  ├────┼────┼────┼────┼────┤
  │    │    │    │    │    │  row 4
  └────┴────┴────┴────┴────┘
   col0 col1 col2 col3 col4

  X đang thắng: diagonal (0,0)→(1,1)→(2,2)→(3,3) = 4 liên tiếp!

  Khác Tic-tac-toe I:
  → Board NxN (dynamic, không chỉ 3x3!)
  → Win condition: M liên tiếp (không chỉ 3!)
  → KHÔNG thể hardcode WIN_CONDITIONS!
  → Phải check DYNAMIC tại mỗi move!
```

### 📋 Phân tích yêu cầu

```
CÂU HỎI CẦN HỎI:
═══════════════════════════════════════════════════════════════

  1. "N và M có giới hạn?"
     → N: 3-20 (quá lớn → UI vỡ!)
     → M: 3-N (M ≤ N, nếu không impossible!)

  2. "User input N, M hay fixed?"
     → User chọn qua UI (dropdown/input!)

  3. "Win detection: thuật toán nào?"
     → 3x3: hardcode 8 conditions → O(1)!
     → NxN: check 4 hướng từ ô vừa đánh → O(M)!
     → KHÔNG cần check toàn bộ board!

  4. "Draw detection?"
     → Tất cả ô filled + không winner!
     → Có thể "early draw" detection (advanced!)
```

```
SO SÁNH 3x3 vs NxN:
═══════════════════════════════════════════════════════════════

  ┌──────────────────────┬──────────────────────┐
  │ 3x3 (Part 10)       │ NxN (Part 11!)       │
  ├──────────────────────┼──────────────────────┤
  │ Array(9).fill(null)  │ NxN 2D array!        │
  │ WIN_CONDITIONS[8]    │ Dynamic check!       │
  │ Hardcoded            │ Algorithm per move!  │
  │ O(1) win check       │ O(M) per direction!  │
  │ 1D index             │ (row, col) 2D index! │
  └──────────────────────┴──────────────────────┘
```

---

## §1.1 Tic-tac-toe II — Vanilla JavaScript

```javascript
// ═══ Vanilla JS Tic-tac-toe II (NxN) ═══

class TicTacToeNxN {
  constructor(container, n = 5, m = 4) {
    this.container =
      typeof container === 'string'
        ? document.querySelector(container)
        : container;
    this.n = n;  // board size!
    this.m = m;  // consecutive marks to win!
    this._reset();
    this._init();
  }

  _reset() {
    // 2D array NxN, filled with null!
    this.board = Array.from({ length: this.n }, () =>
      Array(this.n).fill(null)
    );
    this.isXTurn = true;
    this.winner = null;
    this.moveCount = 0;
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

    // CSS Grid dynamic columns!
    this.boardEl.style.gridTemplateColumns = `repeat(${this.n}, 60px)`;
    this.boardEl.style.gridTemplateRows = `repeat(${this.n}, 60px)`;

    this._renderBoard();
    this.resetBtn.addEventListener('click', () => this.reset());
  }

  _renderBoard() {
    this.boardEl.innerHTML = '';
    this.cells = [];

    for (let r = 0; r < this.n; r++) {
      this.cells[r] = [];
      for (let c = 0; c < this.n; c++) {
        const cell = document.createElement('div');
        cell.className = 'ttt-cell';
        cell.addEventListener('click', () => this._handleClick(r, c));
        this.boardEl.appendChild(cell);
        this.cells[r][c] = cell;
      }
    }
  }

  _handleClick(row, col) {
    if (this.board[row][col] !== null || this.winner) return;

    const mark = this.isXTurn ? 'X' : 'O';
    this.board[row][col] = mark;
    this.moveCount++;

    this.cells[row][col].textContent = mark;
    this.cells[row][col].classList.add(mark.toLowerCase());

    // Check win TẠI ô vừa đánh!
    if (this._checkWinAt(row, col, mark)) {
      this.winner = mark;
      this.statusEl.textContent = `Player ${mark} wins! 🎉`;
      return;
    }

    // Check draw!
    if (this.moveCount === this.n * this.n) {
      this.statusEl.textContent = "It's a draw! 🤝";
      return;
    }

    this.isXTurn = !this.isXTurn;
    this.statusEl.textContent = `Player ${this.isXTurn ? 'X' : 'O'}'s turn`;
  }

  // ⭐ THUẬT TOÁN CHÍNH: check 4 hướng từ (row, col)!
  _checkWinAt(row, col, mark) {
    // 4 hướng: ngang, dọc, chéo xuống, chéo lên!
    const directions = [
      [0, 1],   // horizontal →
      [1, 0],   // vertical ↓
      [1, 1],   // diagonal ↘
      [1, -1],  // anti-diagonal ↙
    ];

    for (const [dr, dc] of directions) {
      let count = 1; // ô hiện tại!

      // Đếm theo hướng THUẬN!
      for (let i = 1; i < this.m; i++) {
        const r = row + dr * i;
        const c = col + dc * i;
        if (r < 0 || r >= this.n || c < 0 || c >= this.n) break;
        if (this.board[r][c] !== mark) break;
        count++;
      }

      // Đếm theo hướng NGƯỢC!
      for (let i = 1; i < this.m; i++) {
        const r = row - dr * i;
        const c = col - dc * i;
        if (r < 0 || r >= this.n || c < 0 || c >= this.n) break;
        if (this.board[r][c] !== mark) break;
        count++;
      }

      if (count >= this.m) return true;
    }

    return false;
  }

  reset() {
    this._reset();
    this.statusEl.textContent = "Player X's turn";
    this._renderBoard();
  }
}

new TicTacToeNxN('#app', 5, 4);
```

### Giải thích — Line by line

**`_checkWinAt` — Thuật toán 4 hướng:**

```
WIN CHECK — 4 DIRECTIONS:
═══════════════════════════════════════════════════════════════

  Khi đánh ô (2,2), check 4 hướng:

  Hướng 1: Horizontal [0,1]
  → Thuận: (2,3), (2,4), ...
  → Ngược: (2,1), (2,0), ...
  → Đếm liên tiếp cùng mark!

  Hướng 2: Vertical [1,0]
  → Thuận: (3,2), (4,2), ...
  → Ngược: (1,2), (0,2), ...

  Hướng 3: Diagonal [1,1]
  → Thuận: (3,3), (4,4), ...    ↘
  → Ngược: (1,1), (0,0), ...    ↖

  Hướng 4: Anti-diagonal [1,-1]
  → Thuận: (3,1), (4,0), ...    ↙
  → Ngược: (1,3), (0,4), ...    ↗

  Mỗi hướng: count = 1 + thuận + ngược!
  count ≥ M → WIN!

  Tại sao CẢ thuận VÀ ngược?
  → Ô vừa đánh có thể NẰM GIỮA chuỗi thắng!
  → VD: _ X [X] X _ → ô [X] giữa chuỗi 3!
  → Chỉ đếm 1 hướng → miss!

  Complexity: O(4 × M) = O(M) per move!
  → Tốt hơn O(N²) scan toàn board!
```

**2D array — `Array.from` pattern:**

```
2D ARRAY CREATION:
═══════════════════════════════════════════════════════════════

  ❌ Array(n).fill(Array(n).fill(null)):
  → TẤT CẢ rows trỏ đến CÙNG 1 array!
  → board[0][0] = 'X' → board[1][0] cũng = 'X'! 💀

  ✅ Array.from({ length: n }, () => Array(n).fill(null)):
  → Mỗi row = array MỚI riêng biệt!
  → Arrow function chạy n lần → n arrays khác nhau!
  → board[0][0] = 'X' → board[1][0] vẫn null! ✅

  Đây là BẪY phổ biến trong phỏng vấn!
  → fill() dùng CÙNG reference cho tất cả!
  → Array.from() gọi callback → tạo MỚI mỗi lần!
```

**Dynamic CSS Grid:**

```
DYNAMIC GRID:
═══════════════════════════════════════════════════════════════

  this.boardEl.style.gridTemplateColumns = `repeat(${this.n}, 60px)`;

  N=3: "repeat(3, 60px)" → 3 cột!
  N=5: "repeat(5, 60px)" → 5 cột!
  N=10: "repeat(10, 60px)" → 10 cột!

  Grid TỰ ĐỘNG adjust!
  → Không cần CSS class riêng cho mỗi N!
  → JavaScript set inline style động!
```

---

## §1.2 Tic-tac-toe II — React

```jsx
// ═══ React Tic-tac-toe II (NxN) ═══

import { useState, useCallback } from 'react';

function createBoard(n) {
  return Array.from({ length: n }, () => Array(n).fill(null));
}

function checkWinAt(board, row, col, mark, m) {
  const n = board.length;
  const directions = [[0,1],[1,0],[1,1],[1,-1]];

  for (const [dr, dc] of directions) {
    let count = 1;
    // Thuận!
    for (let i = 1; i < m; i++) {
      const r = row + dr * i, c = col + dc * i;
      if (r < 0 || r >= n || c < 0 || c >= n) break;
      if (board[r][c] !== mark) break;
      count++;
    }
    // Ngược!
    for (let i = 1; i < m; i++) {
      const r = row - dr * i, c = col - dc * i;
      if (r < 0 || r >= n || c < 0 || c >= n) break;
      if (board[r][c] !== mark) break;
      count++;
    }
    if (count >= m) return true;
  }
  return false;
}

function TicTacToeNxN({ n = 5, m = 4 }) {
  const [board, setBoard] = useState(() => createBoard(n));
  const [isXTurn, setIsXTurn] = useState(true);
  const [winner, setWinner] = useState(null);
  const [moveCount, setMoveCount] = useState(0);

  const handleClick = useCallback((row, col) => {
    if (board[row][col] || winner) return;

    const mark = isXTurn ? 'X' : 'O';
    const newBoard = board.map((r) => [...r]); // deep copy!
    newBoard[row][col] = mark;
    setBoard(newBoard);

    if (checkWinAt(newBoard, row, col, mark, m)) {
      setWinner(mark);
    } else {
      setMoveCount((prev) => prev + 1);
      setIsXTurn((prev) => !prev);
    }
  }, [board, winner, isXTurn, m]);

  const isDraw = !winner && moveCount + 1 >= n * n;

  const status = winner
    ? `Player ${winner} wins! 🎉`
    : isDraw ? "It's a draw! 🤝"
    : `Player ${isXTurn ? 'X' : 'O'}'s turn`;

  const reset = () => {
    setBoard(createBoard(n));
    setIsXTurn(true);
    setWinner(null);
    setMoveCount(0);
  };

  return (
    <div>
      <div className="ttt-status">{status}</div>
      <div className="ttt-board"
        style={{ gridTemplateColumns: `repeat(${n}, 60px)` }}>
        {board.map((row, r) =>
          row.map((cell, c) => (
            <div
              key={`${r}-${c}`}
              className={`ttt-cell ${cell ? cell.toLowerCase() : ''}`}
              onClick={() => handleClick(r, c)}
            >
              {cell}
            </div>
          ))
        )}
      </div>
      <button onClick={reset}>Reset</button>
    </div>
  );
}
```

### Giải thích React

**Deep copy board — `board.map(r => [...r])`:**

```
IMMUTABLE UPDATE — 2D ARRAY:
═══════════════════════════════════════════════════════════════

  ❌ board[row][col] = mark; setBoard(board);
  → Mutate GỐC! React không thấy thay đổi!
  → Cùng reference → không re-render!

  ✅ const newBoard = board.map(r => [...r]);
  → Tạo array MỚI! Mỗi row cũng MỚI!
  → newBoard[row][col] = mark → chỉ sửa copy!
  → setBoard(newBoard) → React thấy KHÁC → re-render!

  Tại sao map(r => [...r]) chứ không [...board]?
  → [...board] → shallow copy! Rows vẫn CÙNG reference!
  → board.map(r => [...r]) → DEEP copy 1 level!
  → Đủ cho 2D array of primitives!
```

**`useState(() => createBoard(n))` — Lazy initializer:**

```
LAZY INITIALIZER:
═══════════════════════════════════════════════════════════════

  ❌ useState(createBoard(n)):
  → createBoard chạy MỖI render!
  → Tạo array rồi bỏ đi (waste!)

  ✅ useState(() => createBoard(n)):
  → Arrow function chỉ chạy 1 LẦN (mount!)
  → Renders sau: skip! Performance! ✅
```

---

# 🎤 RADIO Interview Walkthrough — Tic-tac-toe II

### R — Requirements

```
REQUIREMENTS:
═══════════════════════════════════════════════════════════════

  1. NxN board (dynamic size!)
  2. M-in-a-row to win!
  3. Turn-based (X/O alternating!)
  4. Win/draw detection!
  5. Reset button!
  6. M ≤ N (validation!)
```

### A — Architecture

```
ARCHITECTURE:
═══════════════════════════════════════════════════════════════

  Key difference from 3x3:
  → DYNAMIC win check per move!
  → Check 4 directions × 2 ways (thuận + ngược)!
  → O(M) per move, NOT O(N²)!

  State: { board[N][N], isXTurn, winner, moveCount }
  → board = 2D array (not 1D!)
  → moveCount = track for draw!
```

### I — Implementation

```
IMPLEMENTATION:
═══════════════════════════════════════════════════════════════

  BƯỚC 1 (3 phút): Dynamic NxN grid!
  → CSS grid-template-columns: repeat(N, 60px)!

  BƯỚC 2 (5 phút): 2D board + click handler!
  → Array.from({ length: n }, () => Array(n).fill(null))!

  BƯỚC 3 (8 phút): _checkWinAt algorithm! ⭐
  → 4 directions × thuận/ngược!
  → Count consecutive marks!
  → count ≥ M → win!

  BƯỚC 4 (2 phút): Draw + Reset!
```

### Edge Cases + Tips

```
EDGE CASES:
═══════════════════════════════════════════════════════════════

  1. M > N: impossible to win → validate!
  2. N = 1, M = 1: first click wins!
  3. Win at EDGE: boundary check (r < 0, c >= n)!
  4. Win in MIDDLE of chain: thuận + ngược!
  5. Large N (20+): CSS cell size adjustment!
```

```
INTERVIEW TIPS:
═══════════════════════════════════════════════════════════════

  💡 KEY POINTS:
  → "4 hướng × thuận/ngược = complete check!"
  → "O(M) per move, NOT O(N²)!"
  → "Array.from — KHÔNG Array(n).fill(Array!)!"
  → "board.map(r => [...r]) for immutable update!"

  ⚠ SAI LẦM:
  → Hardcode win conditions (impossible for NxN!)
  → Array(n).fill(Array(n)) → shared reference!
  → Chỉ check 1 chiều (quên ngược!)
  → O(N²) scan toàn board mỗi move!
```

---

# 🖼️ Component 2: Image Carousel I (Basic)

## Kiến Trúc Image Carousel I

```
IMAGE CAROUSEL I — BASIC:
═══════════════════════════════════════════════════════════════

  ┌────────────────────────────────────┐
  │                                    │
  │  [◀]    ┌──────────────┐    [▶]   │
  │         │              │          │
  │         │   Image 3    │          │
  │         │   (current)  │          │
  │         │              │          │
  │         └──────────────┘          │
  │                                    │
  │         ○  ○  ●  ○  ○             │  ← page dots!
  │                                    │
  └────────────────────────────────────┘

  Max size: 600×400px!
  1 image element in DOM at any time!
  Cycling: last → first, first → last!
  No animation (Carousel I!)
```

### 📋 Phân tích yêu cầu

```
REQUIREMENTS:
═══════════════════════════════════════════════════════════════

  1. Array of image URLs → display 1 at a time!
  2. Max 600×400, responsive nếu viewport nhỏ hơn!
  3. Prev/Next buttons → cycling!
  4. Page dots → click = jump to image!
  5. CHỈ 1 \<img\> trong DOM! (technical constraint!)
  6. Images shrink to fit (object-fit!)
  7. Empty space = black background!
  8. No animation (đó là Carousel II!)
```

---

## §2.1 Image Carousel I — Vanilla JavaScript

```javascript
// ═══ Vanilla JS Image Carousel I ═══

const IMAGES = [
  'https://picsum.photos/id/600/600/400',
  'https://picsum.photos/id/100/600/400',
  'https://picsum.photos/id/200/600/400',
  'https://picsum.photos/id/300/600/400',
  'https://picsum.photos/id/400/600/400',
];

class ImageCarousel {
  constructor(container, images = IMAGES) {
    this.container =
      typeof container === 'string'
        ? document.querySelector(container)
        : container;
    this.images = images;
    this.currentIndex = 0;
    this._init();
  }

  _init() {
    this.container.innerHTML = `
      <div class="carousel">
        <button class="carousel-btn prev" aria-label="Previous">◀</button>
        <div class="carousel-viewport">
          <img class="carousel-img" src="${this.images[0]}" alt="Slide 1" />
        </div>
        <button class="carousel-btn next" aria-label="Next">▶</button>
        <div class="carousel-dots" id="dots"></div>
      </div>
    `;

    this.imgEl = this.container.querySelector('.carousel-img');
    this.dotsContainer = this.container.querySelector('#dots');
    this.prevBtn = this.container.querySelector('.prev');
    this.nextBtn = this.container.querySelector('.next');

    // Tạo dots!
    this.dots = this.images.map((_, i) => {
      const dot = document.createElement('button');
      dot.className = `dot ${i === 0 ? 'active' : ''}`;
      dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
      dot.addEventListener('click', () => this.goTo(i));
      this.dotsContainer.appendChild(dot);
      return dot;
    });

    this.prevBtn.addEventListener('click', () => this.prev());
    this.nextBtn.addEventListener('click', () => this.next());
  }

  goTo(index) {
    this.currentIndex = index;
    // CHỈ đổi src — 1 img element duy nhất!
    this.imgEl.src = this.images[index];
    this.imgEl.alt = `Slide ${index + 1}`;

    // Update dots!
    this.dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
    });
  }

  prev() {
    const index = (this.currentIndex - 1 + this.images.length)
      % this.images.length;
    this.goTo(index);
  }

  next() {
    const index = (this.currentIndex + 1) % this.images.length;
    this.goTo(index);
  }
}

new ImageCarousel('#app');
```

```css
/* ═══ CSS Image Carousel ═══ */

.carousel {
  position: relative;
  max-width: 600px;
  margin: 0 auto;
  display: flex;
  align-items: center;
}

.carousel-viewport {
  width: 100%;
  max-height: 400px;
  background: #000; /* empty space = black! */
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 8px;
  aspect-ratio: 3 / 2;
}

.carousel-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain; /* shrink to fit, keep ratio! */
}

.carousel-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0,0,0,0.5);
  color: #fff;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 18px;
  z-index: 2;
}
.carousel-btn.prev { left: 8px; }
.carousel-btn.next { right: 8px; }

.carousel-dots {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
}
.dot {
  width: 10px; height: 10px;
  border-radius: 50%;
  background: rgba(255,255,255,0.5);
  border: none;
  cursor: pointer;
}
.dot.active { background: #fff; }
```

### Giải thích

**Chỉ 1 `<img>` — Đổi `src`:**

```
1 IMAGE ELEMENT:
═══════════════════════════════════════════════════════════════

  Yêu cầu: chỉ 1 <img> trong DOM!
  → KHÔNG render tất cả images rồi hide!

  Cách: đổi src attribute!
  this.imgEl.src = this.images[index];
  → Browser load image mới!
  → Image cũ bị thay thế!
  → 1 <img> element, N images qua src!

  Pros:
  → Memory: chỉ 1 image trong memory!
  → DOM: minimal elements!

  Cons:
  → Mỗi lần chuyển = tải lại! (nếu không cache)
  → Không thể animate transition!
  → Carousel II sẽ giải quyết bằng cách khác!
```

**`object-fit: contain` — Shrink to fit:**

```
OBJECT-FIT:
═══════════════════════════════════════════════════════════════

  object-fit: contain
  → Image SCO LẠI để TOÀN BỘ hiện!
  → Giữ nguyên aspect ratio!
  → Phần thừa = background (đen!)

  object-fit: cover
  → Image PHỦU ĐẦY container!
  → Có thể BỊ CẮT 2 bên!

  Yêu cầu: "entire image visible" → contain!
```

---

## §2.2 Image Carousel I — React

```jsx
import { useState, useCallback } from 'react';

const IMAGES = [
  'https://picsum.photos/id/600/600/400',
  'https://picsum.photos/id/100/600/400',
  'https://picsum.photos/id/200/600/400',
  'https://picsum.photos/id/300/600/400',
  'https://picsum.photos/id/400/600/400',
];

function ImageCarousel({ images = IMAGES }) {
  const [current, setCurrent] = useState(0);

  const prev = useCallback(() => {
    setCurrent((i) => (i - 1 + images.length) % images.length);
  }, [images.length]);

  const next = useCallback(() => {
    setCurrent((i) => (i + 1) % images.length);
  }, [images.length]);

  return (
    <div className="carousel">
      <button className="carousel-btn prev" onClick={prev}>◀</button>
      <div className="carousel-viewport">
        <img
          className="carousel-img"
          src={images[current]}
          alt={`Slide ${current + 1}`}
        />
      </div>
      <button className="carousel-btn next" onClick={next}>▶</button>
      <div className="carousel-dots">
        {images.map((_, i) => (
          <button
            key={i}
            className={`dot ${i === current ? 'active' : ''}`}
            onClick={() => setCurrent(i)}
          />
        ))}
      </div>
    </div>
  );
}
```

---

# 🖼️ Component 3: Image Carousel II (CSS Transitions)

## Kiến Trúc Carousel II

```
CAROUSEL II — SMOOTH TRANSITIONS:
═══════════════════════════════════════════════════════════════

  Khác Carousel I: CÓ animation khi chuyển slide!

  Approach: render TẤT CẢ images trong 1 row!
  → Container overflow: hidden!
  → Di chuyển offset = slide!

  ┌─ viewport (overflow: hidden!) ──────────┐
  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐   │
  │  │ img0 │ │ img1 │ │ img2 │ │ img3 │   │
  │  └──────┘ └──────┘ └──────┘ └──────┘   │
  └─────────────────────────────────────────┘
               ↑ visible = img1!

  Click Next: translate container sang TRÁI!
  → img1 slide ra ← | img2 slide vào →
  → CSS transition: transform 0.3s ease!

  Key: transform: translateX(-currentIndex * 100%)!
```

---

## §3.1 Image Carousel II — Vanilla JavaScript

```javascript
// ═══ Vanilla JS Image Carousel II ═══

class CarouselII {
  constructor(container, images) {
    this.container =
      typeof container === 'string'
        ? document.querySelector(container)
        : container;
    this.images = images;
    this.currentIndex = 0;
    this._init();
  }

  _init() {
    this.container.innerHTML = `
      <div class="carousel-ii">
        <button class="carousel-btn prev">◀</button>
        <div class="carousel-viewport">
          <div class="carousel-track" id="track"></div>
        </div>
        <button class="carousel-btn next">▶</button>
        <div class="carousel-dots" id="dots"></div>
      </div>
    `;

    this.track = this.container.querySelector('#track');
    this.dotsContainer = this.container.querySelector('#dots');

    // Render TẤT CẢ images vào track!
    this.images.forEach((src, i) => {
      const img = document.createElement('img');
      img.src = src;
      img.alt = `Slide ${i + 1}`;
      img.className = 'carousel-slide';
      this.track.appendChild(img);
    });

    // Track width = N * 100%!
    this.track.style.width = `${this.images.length * 100}%`;

    // Dots!
    this.dots = this.images.map((_, i) => {
      const dot = document.createElement('button');
      dot.className = `dot ${i === 0 ? 'active' : ''}`;
      dot.addEventListener('click', () => this.goTo(i));
      this.dotsContainer.appendChild(dot);
      return dot;
    });

    this.container.querySelector('.prev')
      .addEventListener('click', () => this.prev());
    this.container.querySelector('.next')
      .addEventListener('click', () => this.next());
  }

  goTo(index) {
    this.currentIndex = index;
    // Di chuyển track!
    this.track.style.transform =
      `translateX(-${index * (100 / this.images.length)}%)`;

    this.dots.forEach((d, i) => d.classList.toggle('active', i === index));
  }

  prev() {
    const i = (this.currentIndex - 1 + this.images.length) % this.images.length;
    this.goTo(i);
  }

  next() {
    const i = (this.currentIndex + 1) % this.images.length;
    this.goTo(i);
  }
}
```

```css
/* ═══ CSS Carousel II ═══ */

.carousel-viewport {
  overflow: hidden;
  max-width: 600px;
  border-radius: 8px;
}

.carousel-track {
  display: flex;
  transition: transform 0.4s ease; /* ← ANIMATION! */
}

.carousel-slide {
  flex: 0 0 calc(100% / var(--total)); /* Mỗi slide = viewport width */
  width: 100%;
  max-height: 400px;
  object-fit: contain;
  background: #000;
}
```

### Giải thích — Carousel II

**`translateX` animation — Tại sao không `left`/`marginLeft`:**

```
TRANSLATEX vs LEFT:
═══════════════════════════════════════════════════════════════

  ❌ left / margin-left:
  → Trigger LAYOUT recalculation (reflow!)
  → Browser phải tính lại vị trí TẤT CẢ elements!
  → Janky animation! 30fps!

  ✅ transform: translateX():
  → KHÔNG trigger layout!
  → GPU-accelerated compositing!
  → Smooth 60fps! ✅

  Đây là performance GOLDEN RULE:
  → Animate: transform + opacity!
  → KHÔNG animate: top, left, width, height!
```

---

# 🖼️ Component 4: Image Carousel III (Max 2 Images in DOM)

## Kiến Trúc Carousel III

```
CAROUSEL III — MAX 2 IMAGES:
═══════════════════════════════════════════════════════════════

  Carousel II: render TẤT CẢ N images → waste memory!
  Carousel III: chỉ 2 images trong DOM!
  → Current image + incoming image!
  → Sau transition: remove outgoing!

  Transition flow:
  1. Hiển thị: [img2]
  2. Click Next:
     → Thêm img3 vào DOM (bên phải!)
     → [img2][img3]
     → Animate: slide trái!
     → [img3] hiện, [img2] biến mất!
  3. Sau transition:
     → Remove img2 khỏi DOM!
     → Chỉ còn [img3]!

  Lợi ích:
  → Memory: 2 images max (không N!)
  → Lazy load: chỉ load khi cần!
  → Performance tốt cho 100+ images!
```

---

## §4.1 Image Carousel III — Vanilla JavaScript

```javascript
// ═══ Vanilla JS Image Carousel III ═══

class CarouselIII {
  constructor(container, images) {
    this.container =
      typeof container === 'string'
        ? document.querySelector(container)
        : container;
    this.images = images;
    this.currentIndex = 0;
    this.isAnimating = false; // lock khi đang animate!
    this._init();
  }

  _init() {
    this.container.innerHTML = `
      <div class="carousel-iii">
        <button class="carousel-btn prev">◀</button>
        <div class="carousel-viewport" id="viewport"></div>
        <button class="carousel-btn next">▶</button>
        <div class="carousel-dots" id="dots"></div>
      </div>
    `;

    this.viewport = this.container.querySelector('#viewport');
    this._showSlide(0);

    // Dots!
    this.dotsContainer = this.container.querySelector('#dots');
    this.dots = this.images.map((_, i) => {
      const dot = document.createElement('button');
      dot.className = `dot ${i === 0 ? 'active' : ''}`;
      dot.addEventListener('click', () => this.goTo(i));
      this.dotsContainer.appendChild(dot);
      return dot;
    });

    this.container.querySelector('.prev')
      .addEventListener('click', () => this.prev());
    this.container.querySelector('.next')
      .addEventListener('click', () => this.next());
  }

  _showSlide(index) {
    this.viewport.innerHTML = '';
    const img = document.createElement('img');
    img.src = this.images[index];
    img.className = 'slide-current';
    this.viewport.appendChild(img);
  }

  _transition(toIndex, direction) {
    if (this.isAnimating) return;
    this.isAnimating = true;

    const currentImg = this.viewport.querySelector('.slide-current');
    const nextImg = document.createElement('img');
    nextImg.src = this.images[toIndex];
    nextImg.className = 'slide-incoming';

    // Position incoming off-screen!
    const offset = direction === 'next' ? '100%' : '-100%';
    nextImg.style.transform = `translateX(${offset})`;

    this.viewport.appendChild(nextImg); // 2 images in DOM!

    // Force reflow!
    nextImg.getBoundingClientRect();

    // Animate both!
    const slideOut = direction === 'next' ? '-100%' : '100%';
    currentImg.style.transform = `translateX(${slideOut})`;
    nextImg.style.transform = 'translateX(0)';

    // Cleanup after transition!
    nextImg.addEventListener('transitionend', () => {
      currentImg.remove(); // Remove outgoing! Lại 1 image!
      nextImg.className = 'slide-current';
      this.currentIndex = toIndex;
      this.isAnimating = false;
      this._updateDots();
    }, { once: true });
  }

  _updateDots() {
    this.dots.forEach((d, i) =>
      d.classList.toggle('active', i === this.currentIndex));
  }

  goTo(index) {
    if (index === this.currentIndex) return;
    const dir = index > this.currentIndex ? 'next' : 'prev';
    this._transition(index, dir);
  }

  prev() {
    const i = (this.currentIndex - 1 + this.images.length) % this.images.length;
    this._transition(i, 'prev');
  }

  next() {
    const i = (this.currentIndex + 1) % this.images.length;
    this._transition(i, 'next');
  }
}
```

```css
/* ═══ CSS Carousel III ═══ */

.carousel-iii .carousel-viewport {
  position: relative;
  overflow: hidden;
  max-width: 600px;
  aspect-ratio: 3/2;
  background: #000;
}

.slide-current, .slide-incoming {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  object-fit: contain;
  transition: transform 0.4s ease;
}
```

### Giải thích — Carousel III

**`transitionend` event — Cleanup timing:**

```
TRANSITIONEND — TẠI SAO QUAN TRỌNG:
═══════════════════════════════════════════════════════════════

  Vấn đề: khi nào remove old image?
  → Remove NGAY → animation bị cắt!
  → setTimeout(400) → timing có thể sai!

  ✅ transitionend event:
  → Browser fire KHI transition HOÀN TẤT!
  → Timing CHÍNH XÁC 100%!
  → Không phụ thuộc duration CSS!

  { once: true }:
  → Listener tự remove sau 1 lần!
  → Không memory leak!
  → Không fire nhiều lần!
```

**`isAnimating` lock — Prevent double-click:**

```
ANIMATION LOCK:
═══════════════════════════════════════════════════════════════

  Không có isAnimating:
  → Click Next nhanh 2 lần!
  → Transition 1 chưa xong → transition 2 bắt đầu!
  → 3 images trong DOM (vi phạm constraint!)
  → Animation chéo nhau → glitch! 💀

  Có isAnimating:
  → Click Next → isAnimating = true!
  → Click Next lần 2 → return! (locked!)
  → Transition 1 xong → isAnimating = false!
  → Now click works! ✅
```

---

# 🎤 RADIO Interview Walkthrough — Image Carousel (I→II→III)

### R — Requirements

```
CAROUSEL EVOLUTION:
═══════════════════════════════════════════════════════════════

  Carousel I:  1 img, swap src, NO animation!
  Carousel II: ALL imgs, translateX track, CSS transition!
  Carousel III: 2 imgs max, swap on transitionend!

  ┌───────────┬──────────┬──────────┬──────────┐
  │           │ I        │ II       │ III      │
  ├───────────┼──────────┼──────────┼──────────┤
  │ DOM imgs  │ 1        │ ALL (N)  │ Max 2    │
  │ Animation │ None     │ Track    │ Slide    │
  │ Memory    │ Best     │ Worst    │ Good     │
  │ Complexity│ Simple   │ Medium   │ Hard     │
  │ Use case  │ Few imgs │ <10 imgs │ 100+ img │
  └───────────┴──────────┴──────────┴──────────┘
```

### I — Implementation

```
IMPLEMENTATION — PROGRESSIVE:
═══════════════════════════════════════════════════════════════

  Phỏng vấn: BẮT ĐẦU từ Carousel I!
  → Code nhanh (5 phút!)
  → Nói: "Muốn thêm animation?"
  → Phát triển lên II!
  → Nói: "Performance concern?"
  → Phát triển lên III!

  Show EVOLUTION = show DEPTH! ✅
```

### Edge Cases

```
EDGE CASES:
═══════════════════════════════════════════════════════════════

  1. 1 IMAGE: prev/next → same image!
  2. IMAGE LOAD ERROR: onerror fallback!
  3. RAPID CLICKING: isAnimating lock!
  4. VIEWPORT RESIZE: responsive container!
  5. KEYBOARD: arrow keys navigation!
  6. TOUCH: swipe (bonus!)
  7. LAZY LOAD: preload next image!
```

```
INTERVIEW TIPS:
═══════════════════════════════════════════════════════════════

  💡 KEY POINTS:
  → "translateX, KHÔNG left — GPU accelerated!"
  → "transitionend cho cleanup timing!"
  → "isAnimating lock chống double-click!"
  → "object-fit: contain giữ aspect ratio!"

  🎯 ĐIỂM CỘNG:
  → Show progressive evolution I→II→III!
  → Mention IntersectionObserver lazy load!
  → Mention touch events (swipe!)
  → Mention prefers-reduced-motion!
  → Mention aria-live cho screen readers!

  ⚠ SAI LẦM:
  → Animate left/margin (trigger layout!)
  → setTimeout thay vì transitionend!
  → Quên isAnimating → 3+ images in DOM!
  → Render ALL images cho Carousel III!
```
