# Captcha SDK — Deep Dive

> 📅 2026-02-14 · ⏱ 18 phút đọc
>
> CAPTCHA Types, Slide Puzzle, Click Select, SMS/Email OTP,
> SDK Architecture, Canvas Rendering, Behavior Analysis,
> Anti-Bot Detection, Server Verification, Security Best Practices
> Độ khó: ⭐️⭐️⭐️⭐️⭐️ | System Design Interview

---

## Mục Lục

| #   | Phần                                       |
| --- | ------------------------------------------ |
| 1   | CAPTCHA là gì? Tại sao cần?                |
| 2   | Phân loại CAPTCHA — 6 loại                 |
| 3   | Kiến trúc Captcha SDK                      |
| 4   | Slide Puzzle CAPTCHA — Implement           |
| 5   | Click-Select CAPTCHA — Implement           |
| 6   | Behavior Analysis — Phân tích hành vi      |
| 7   | Server Verification — Xác minh phía server |
| 8   | Anti-Bot Detection — Chống bot             |
| 9   | Security Best Practices                    |
| 10  | SDK API Design                             |
| 11  | Tóm tắt phỏng vấn                          |

---

## §1. CAPTCHA là gì? Tại sao cần?

```
CAPTCHA — ĐỊNH NGHĨA:
═══════════════════════════════════════════════════════════════

  CAPTCHA = Completely Automated Public Turing test to tell
            Computers and Humans Apart

  → Bài test TỰ ĐỘNG để PHÂN BIỆT người thật vs máy (bot)!

  TẠI SAO CẦN?
  ┌────────────────────────────────────────────────────────┐
  │ ① CHỐNG BRUTE FORCE: bot thử hàng triệu mật khẩu!    │
  │ ② CHỐNG SPAM: bot đăng ký tài khoản hàng loạt!        │
  │ ③ CHỐNG SCRAPING: bot crawl dữ liệu!                  │
  │ ④ CHỐNG DDoS: bot tấn công server liên tục!            │
  │ ⑤ CHỐNG TICKET SCALPING: bot mua vé hàng loạt!        │
  │ ⑥ CHỐNG FAKE VOTES: bot vote/like hàng loạt!           │
  └────────────────────────────────────────────────────────┘

  ĐẶT Ở ĐÂU?
  → Login form (sau 3 lần sai!)
  → Registration form
  → Password reset
  → Payment / Checkout
  → Comment / Review submission
  → API rate-limited endpoints
```

---

## §2. Phân loại CAPTCHA — 6 loại

```
6 LOẠI CAPTCHA:
═══════════════════════════════════════════════════════════════

  ① TEXT CAPTCHA (Truyền thống — ĐÃ LỖI THỜI!):
  ┌────────────────────────────────────────────────────────┐
  │  ┌──────────────────────┐                              │
  │  │  X7kP9m  (méo, nhiễu)│  → Nhập chữ trong ảnh!     │
  │  └──────────────────────┘                              │
  │  → OCR bây giờ đọc được → KHÔNG AN TOÀN!              │
  │  → UX tệ: khó đọc, người dùng ghét!                   │
  └────────────────────────────────────────────────────────┘

  ② MATH CAPTCHA:
  ┌────────────────────────────────────────────────────────┐
  │  "3 + 7 = ?"  → Nhập kết quả!                        │
  │  → Đơn giản! Bot dễ giải → KHÔNG AN TOÀN!             │
  └────────────────────────────────────────────────────────┘

  ③ SLIDE PUZZLE CAPTCHA (滑块验证 — PHỔ BIẾN!): ⭐
  ┌────────────────────────────────────────────────────────┐
  │  ┌─────────────────────┐                               │
  │  │ ████  [gap]   image │ → Kéo mảnh ghép vào chỗ trống│
  │  └─────────────────────┘                               │
  │  → Phân tích HÀNH VI kéo: tốc độ, trajectory, jitter! │
  │  → Rất khó cho bot mô phỏng hành vi người thật!       │
  └────────────────────────────────────────────────────────┘

  ④ CLICK-SELECT CAPTCHA (点选验证 — PHỔ BIẾN!): ⭐
  ┌────────────────────────────────────────────────────────┐
  │  "Chọn tất cả ô có đèn giao thông"                    │
  │  ┌──┬──┬──┐                                           │
  │  │🚦│🌳│🚦│  → Click đúng ô!                          │
  │  ├──┼──┼──┤                                           │
  │  │🏠│🚦│🚗│  → Google reCAPTCHA v2 dùng kiểu này!     │
  │  └──┴──┴──┘                                           │
  └────────────────────────────────────────────────────────┘

  ⑤ INVISIBLE / BEHAVIOR CAPTCHA (vô hình!): ⭐⭐
  ┌────────────────────────────────────────────────────────┐
  │  → User KHÔNG THẤY gì cả!                             │
  │  → SDK ẩn phân tích: mouse movement, scroll,          │
  │    keystroke timing, device fingerprint!                │
  │  → Chỉ hiện challenge KHI nghi ngờ là bot!            │
  │  → Google reCAPTCHA v3, Cloudflare Turnstile!          │
  └────────────────────────────────────────────────────────┘

  ⑥ SMS / EMAIL OTP:
  ┌────────────────────────────────────────────────────────┐
  │  → Gửi mã 6 số qua SMS/Email!                         │
  │  → User nhập mã → verify!                             │
  │  → Tốn tiền SMS! Nhưng rất an toàn!                    │
  └────────────────────────────────────────────────────────┘
```

---

## §3. Kiến trúc Captcha SDK

```
CAPTCHA SDK ARCHITECTURE:
═══════════════════════════════════════════════════════════════

  ┌─────────────────────── CLIENT SDK ────────────────────┐
  │                                                       │
  │  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐ │
  │  │  UI Module   │  │  Behavior   │  │  Crypto      │ │
  │  │             │  │  Collector  │  │  Module      │ │
  │  │ • Canvas    │  │             │  │             │ │
  │  │ • Slide bar │  │ • Mouse     │  │ • Encrypt   │ │
  │  │ • Click grid│  │ • Keyboard  │  │ • Sign      │ │
  │  │ • Modal     │  │ • Touch     │  │ • Token     │ │
  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘ │
  │         └────────────────┼────────────────┘         │
  │                          │                           │
  │                   ┌──────▼──────┐                    │
  │                   │   Core      │                    │
  │                   │   Engine    │                    │
  │                   │ • Validate  │                    │
  │                   │ • Submit    │                    │
  │                   └──────┬──────┘                    │
  └──────────────────────────┼────────────────────────────┘
                             │ HTTPS
                    ┌────────▼────────┐
                    │  CAPTCHA SERVER │
                    │ • Generate      │
                    │ • Verify        │
                    │ • Risk Score    │
                    └─────────────────┘
```

---

## §4. Slide Puzzle CAPTCHA — Implement

```
SLIDE PUZZLE — LUỒNG HOẠT ĐỘNG:
═══════════════════════════════════════════════════════════════

  ① SERVER tạo challenge:
  → Chọn ảnh ngẫu nhiên!
  → Cắt 1 mảnh puzzle ở vị trí (targetX, targetY)!
  → Gửi client: ảnh nền (có lỗ) + mảnh puzzle + puzzleY!
  → KHÔNG gửi targetX! (bí mật phía server!)

  ② CLIENT hiển thị:
  → Vẽ ảnh nền bằng Canvas!
  → Vẽ mảnh puzzle ở bên TRÁI!
  → Hiện slide bar ở dưới!

  ③ USER kéo:
  → Kéo slide bar → mảnh puzzle di chuyển theo!
  → SDK GHI LẠI toàn bộ trajectory (x, y, time)!

  ④ CLIENT gửi verify:
  → Gửi: slideX + trajectory + behavior data!
  → Server so sánh slideX vs targetX!
  → Server PHÂN TÍCH trajectory (bot detection!)
```

```typescript
// ═══ SLIDE CAPTCHA — CANVAS RENDERING ═══

interface SlideConfig {
  width: number; // Canvas width
  height: number; // Canvas height
  puzzleSize: number; // Puzzle piece size
  tolerance: number; // Sai số cho phép (px)
}

class SlideCaptcha {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private puzzleCanvas: HTMLCanvasElement;
  private puzzleCtx: CanvasRenderingContext2D;
  private config: SlideConfig;
  private trajectory: { x: number; y: number; t: number }[] = [];
  private startTime: number = 0;
  private isDragging = false;

  constructor(container: HTMLElement, config: SlideConfig) {
    this.config = config;

    // Tạo canvas chính (ảnh nền có lỗ):
    this.canvas = document.createElement("canvas");
    this.canvas.width = config.width;
    this.canvas.height = config.height;
    this.ctx = this.canvas.getContext("2d")!;

    // Tạo canvas puzzle (mảnh ghép):
    this.puzzleCanvas = document.createElement("canvas");
    this.puzzleCanvas.width = config.puzzleSize + 10;
    this.puzzleCanvas.height = config.height;
    this.puzzleCtx = this.puzzleCanvas.getContext("2d")!;

    container.appendChild(this.canvas);
    container.appendChild(this.puzzleCanvas);

    this.createSlider(container);
  }

  // ═══ VẼ PUZZLE PIECE SHAPE (hình mảnh ghép!) ═══
  private drawPuzzlePath(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
  ) {
    const s = size;
    const r = s * 0.15; // Tab radius

    ctx.beginPath();
    ctx.moveTo(x, y);

    // Cạnh trên + tab lồi:
    ctx.lineTo(x + s * 0.4, y);
    ctx.arc(x + s * 0.5, y, r, Math.PI, 0, false); // Tab!
    ctx.lineTo(x + s, y);

    // Cạnh phải + tab lồi:
    ctx.lineTo(x + s, y + s * 0.4);
    ctx.arc(x + s, y + s * 0.5, r, -Math.PI / 2, Math.PI / 2, false);
    ctx.lineTo(x + s, y + s);

    // Cạnh dưới:
    ctx.lineTo(x, y + s);

    // Cạnh trái:
    ctx.lineTo(x, y);

    ctx.closePath();
  }

  // ═══ RENDER CHALLENGE ═══
  async renderChallenge(bgImageUrl: string, targetX: number, targetY: number) {
    const img = await this.loadImage(bgImageUrl);

    // Vẽ ảnh nền:
    this.ctx.drawImage(img, 0, 0, this.config.width, this.config.height);

    // Vẽ LỖ trên nền (shadow + clip):
    this.drawPuzzlePath(this.ctx, targetX, targetY, this.config.puzzleSize);
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    this.ctx.fill();

    // CẮT mảnh puzzle từ ảnh gốc:
    this.puzzleCtx.save();
    this.drawPuzzlePath(this.puzzleCtx, 0, targetY, this.config.puzzleSize);
    this.puzzleCtx.clip();
    this.puzzleCtx.drawImage(
      img,
      targetX,
      0,
      this.config.puzzleSize + 10,
      this.config.height,
      0,
      0,
      this.config.puzzleSize + 10,
      this.config.height,
    );
    this.puzzleCtx.restore();

    // Viền mảnh puzzle:
    this.drawPuzzlePath(this.puzzleCtx, 0, targetY, this.config.puzzleSize);
    this.puzzleCtx.strokeStyle = "rgba(255,255,255,0.8)";
    this.puzzleCtx.lineWidth = 2;
    this.puzzleCtx.stroke();
  }

  // ═══ SLIDER CONTROL ═══
  private createSlider(container: HTMLElement) {
    const sliderTrack = document.createElement("div");
    sliderTrack.className = "captcha-slider-track";

    const sliderThumb = document.createElement("div");
    sliderThumb.className = "captcha-slider-thumb";
    sliderThumb.textContent = "→";

    sliderTrack.appendChild(sliderThumb);
    container.appendChild(sliderTrack);

    // DRAG EVENTS:
    let startX = 0;

    const onStart = (clientX: number) => {
      this.isDragging = true;
      startX = clientX;
      this.startTime = Date.now();
      this.trajectory = [];
    };

    const onMove = (clientX: number) => {
      if (!this.isDragging) return;
      const deltaX = clientX - startX;
      if (deltaX < 0 || deltaX > this.config.width - this.config.puzzleSize)
        return;

      // Di chuyển puzzle piece:
      this.puzzleCanvas.style.transform = `translateX(${deltaX}px)`;
      sliderThumb.style.left = `${deltaX}px`;

      // GHI trajectory:
      this.trajectory.push({
        x: deltaX,
        y: 0,
        t: Date.now() - this.startTime,
      });
    };

    const onEnd = () => {
      if (!this.isDragging) return;
      this.isDragging = false;
      this.onVerify();
    };

    // Mouse events:
    sliderThumb.addEventListener("mousedown", (e) => onStart(e.clientX));
    document.addEventListener("mousemove", (e) => onMove(e.clientX));
    document.addEventListener("mouseup", onEnd);

    // Touch events (mobile!):
    sliderThumb.addEventListener("touchstart", (e) =>
      onStart(e.touches[0].clientX),
    );
    document.addEventListener("touchmove", (e) => onMove(e.touches[0].clientX));
    document.addEventListener("touchend", onEnd);
  }

  // ═══ SUBMIT VERIFICATION ═══
  private async onVerify() {
    const finalX = this.trajectory[this.trajectory.length - 1]?.x || 0;
    const duration = Date.now() - this.startTime;

    const payload = {
      slideX: finalX,
      duration,
      trajectory: this.trajectory,
      // Behavior features:
      behavior: this.analyzeBehavior(),
    };

    // Encrypt + gửi server:
    const encrypted = this.encrypt(JSON.stringify(payload));
    const response = await fetch("/api/captcha/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: encrypted, challengeId: this.challengeId }),
    });

    const result = await response.json();
    if (result.success) {
      this.onSuccess?.(result.token);
    } else {
      this.onFail?.();
      this.refresh(); // Tạo challenge mới!
    }
  }

  private loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  }
}
```

---

## §5. Click-Select CAPTCHA — Implement

```typescript
// ═══ CLICK-SELECT CAPTCHA ═══

interface ClickChallenge {
  backgroundImage: string; // Ảnh nền!
  question: string; // "Chọn các ô có đèn giao thông"
  gridSize: number; // 3x3 = 9 ô!
}

class ClickCaptcha {
  private selectedCells: number[] = [];
  private clickPoints: { x: number; y: number; t: number }[] = [];
  private startTime: number = 0;

  constructor(private container: HTMLElement) {}

  render(challenge: ClickChallenge) {
    this.startTime = Date.now();
    const { gridSize, backgroundImage, question } = challenge;

    // Tạo UI:
    const wrapper = document.createElement("div");
    wrapper.className = "captcha-click-wrapper";
    wrapper.innerHTML = `
            <p class="captcha-question">${question}</p>
            <div class="captcha-grid" style="
                background-image: url(${backgroundImage});
                grid-template-columns: repeat(${gridSize}, 1fr);
            ">
                ${Array.from(
                  { length: gridSize * gridSize },
                  (_, i) => `
                    <div class="captcha-cell" data-index="${i}"></div>
                `,
                ).join("")}
            </div>
            <button class="captcha-submit">Xác nhận</button>
        `;

    this.container.appendChild(wrapper);

    // Click handlers:
    wrapper.querySelectorAll(".captcha-cell").forEach((cell) => {
      cell.addEventListener("click", (e) => {
        const index = parseInt((cell as HTMLElement).dataset.index!);
        this.toggleCell(index, cell as HTMLElement, e as MouseEvent);
      });
    });

    // Submit:
    wrapper
      .querySelector(".captcha-submit")!
      .addEventListener("click", () => this.submit());
  }

  private toggleCell(index: number, el: HTMLElement, event: MouseEvent) {
    const pos = this.selectedCells.indexOf(index);
    if (pos === -1) {
      this.selectedCells.push(index);
      el.classList.add("selected");
    } else {
      this.selectedCells.splice(pos, 1);
      el.classList.remove("selected");
    }

    // Ghi click behavior:
    this.clickPoints.push({
      x: event.clientX,
      y: event.clientY,
      t: Date.now() - this.startTime,
    });
  }

  private async submit() {
    const payload = {
      selectedCells: this.selectedCells,
      clickPoints: this.clickPoints,
      duration: Date.now() - this.startTime,
    };

    const res = await fetch("/api/captcha/verify-click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await res.json();
    // Handle success/fail...
  }
}
```

---

## §6. Behavior Analysis — Phân tích hành vi

```
BEHAVIOR ANALYSIS — PHÂN BIỆT NGƯỜI vs BOT:
═══════════════════════════════════════════════════════════════

  ĐÂY LÀ PHẦN QUAN TRỌNG NHẤT CỦA CAPTCHA SDK!
  → vị trí slide ĐÚNG chưa đủ! Bot có thể tính toán!
  → HÀNH VI kéo mới là yếu tố PHÂN BIỆT!

  NGƯỜI THẬT:                    BOT:
  ┌──────────────────────┐      ┌──────────────────────┐
  │ • Tốc độ KHÔNG ĐỀU!  │      │ • Tốc độ ĐỀU ĐẶN!   │
  │ • Có dao động Y!     │      │ • Y = 0 (thẳng!)     │
  │ • Có jitter (rung)!  │      │ • Mượt MÁ hoàn hảo!  │
  │ • Tăng tốc rồi giảm  │      │ • Tốc độ hằng số!    │
  │ • Duration 500-3000ms│      │ • Quá nhanh < 200ms! │
  │ • Trajectory cong!   │      │ • Trajectory thẳng!  │
  └──────────────────────┘      └──────────────────────┘
```

```typescript
// ═══ BEHAVIOR ANALYSIS — FEATURES ═══

class BehaviorAnalyzer {
  analyze(trajectory: { x: number; y: number; t: number }[]) {
    if (trajectory.length < 5) return { isBot: true, score: 0 };

    return {
      // ① Tổng thời gian:
      duration: trajectory[trajectory.length - 1].t - trajectory[0].t,

      // ② Số điểm dữ liệu (con người > 20, bot thường < 10):
      pointCount: trajectory.length,

      // ③ Y-axis variance (con người dao động, bot = 0):
      yVariance: this.variance(trajectory.map((p) => p.y)),

      // ④ Tốc độ variance (con người không đều, bot đều):
      speedVariance: this.calcSpeedVariance(trajectory),

      // ⑤ Acceleration changes (con người: tăng tốc → giảm tốc):
      accelerationChanges: this.calcAccelerationChanges(trajectory),

      // ⑥ Jitter (rung nhẹ — con người LUÔN có!):
      jitter: this.calcJitter(trajectory),

      // ⑦ Straightness (bot kéo THẲNG, con người hơi cong!):
      straightness: this.calcStraightness(trajectory),
    };
  }

  // VARIANCE: đo độ phân tán!
  private variance(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  }

  // SPEED VARIANCE: tốc độ có đều không?
  private calcSpeedVariance(
    trajectory: { x: number; y: number; t: number }[],
  ): number {
    const speeds: number[] = [];
    for (let i = 1; i < trajectory.length; i++) {
      const dx = trajectory[i].x - trajectory[i - 1].x;
      const dt = trajectory[i].t - trajectory[i - 1].t;
      if (dt > 0) speeds.push(Math.abs(dx) / dt);
    }
    return this.variance(speeds);
  }

  // ACCELERATION CHANGES: bao nhiêu lần đổi chiều tăng/giảm tốc?
  private calcAccelerationChanges(
    trajectory: { x: number; y: number; t: number }[],
  ): number {
    const speeds: number[] = [];
    for (let i = 1; i < trajectory.length; i++) {
      const dx = trajectory[i].x - trajectory[i - 1].x;
      const dt = trajectory[i].t - trajectory[i - 1].t;
      if (dt > 0) speeds.push(dx / dt);
    }

    let changes = 0;
    for (let i = 2; i < speeds.length; i++) {
      const prevAccel = speeds[i - 1] - speeds[i - 2];
      const currAccel = speeds[i] - speeds[i - 1];
      if (prevAccel * currAccel < 0) changes++; // Đổi chiều!
    }
    return changes;
  }

  // JITTER: micro-movements (con người LUÔN có!):
  private calcJitter(
    trajectory: { x: number; y: number; t: number }[],
  ): number {
    let totalJitter = 0;
    for (let i = 2; i < trajectory.length; i++) {
      const dx1 = trajectory[i].x - trajectory[i - 1].x;
      const dx2 = trajectory[i - 1].x - trajectory[i - 2].x;
      totalJitter += Math.abs(dx1 - dx2);
    }
    return totalJitter / trajectory.length;
  }

  // STRAIGHTNESS: đường đi có thẳng quá không?
  private calcStraightness(
    trajectory: { x: number; y: number; t: number }[],
  ): number {
    const first = trajectory[0];
    const last = trajectory[trajectory.length - 1];
    const directDistance = Math.sqrt(
      (last.x - first.x) ** 2 + (last.y - first.y) ** 2,
    );

    let totalDistance = 0;
    for (let i = 1; i < trajectory.length; i++) {
      totalDistance += Math.sqrt(
        (trajectory[i].x - trajectory[i - 1].x) ** 2 +
          (trajectory[i].y - trajectory[i - 1].y) ** 2,
      );
    }

    // = 1 nếu hoàn toàn thẳng (BOT!)
    // < 1 nếu có dao động (NGƯỜI!)
    return totalDistance > 0 ? directDistance / totalDistance : 1;
  }
}

// BOT DETECTION RULES:
// duration < 200ms → BOT! (quá nhanh!)
// yVariance === 0 → BOT! (kéo thẳng Y!)
// speedVariance < 0.001 → BOT! (tốc độ đều!)
// straightness > 0.99 → BOT! (đường thẳng hoàn hảo!)
// pointCount < 5 → BOT! (quá ít dữ liệu!)
// accelerationChanges < 2 → BOT! (không đổi tốc!)
```

---

## §7. Server Verification — Xác minh phía server

```
SERVER VERIFICATION — FLOW:
═══════════════════════════════════════════════════════════════

  ① CLIENT gửi: { slideX, trajectory, behavior, challengeId }
  ② SERVER xác minh:
     a. challengeId CÒN HẠN KHÔNG? (TTL 60s!)
     b. slideX vs targetX → sai số < tolerance? (±5px!)
     c. behavior analysis → bot score > threshold?
     d. replay attack? (challengeId đã dùng chưa?)
  ③ Nếu PASS → trả TOKEN (JWT, hạn 5 phút!)
  ④ Client dùng TOKEN cho API request tiếp theo!
  ⑤ API server VERIFY TOKEN trước khi xử lý!
```

```typescript
// ═══ SERVER VERIFICATION (Node.js Express) ═══

import jwt from "jsonwebtoken";
import crypto from "crypto";

const challenges = new Map(); // challengeId → { targetX, createdAt }

// ① GENERATE CHALLENGE:
app.post("/api/captcha/generate", (req, res) => {
  const challengeId = crypto.randomUUID();
  const targetX = Math.floor(Math.random() * 200) + 50; // 50-250px
  const targetY = Math.floor(Math.random() * 100) + 30;

  challenges.set(challengeId, {
    targetX,
    targetY,
    createdAt: Date.now(),
    used: false,
  });

  // TTL: tự xóa sau 60s!
  setTimeout(() => challenges.delete(challengeId), 60000);

  res.json({
    challengeId,
    backgroundImage: `/images/bg_${Math.floor(Math.random() * 100)}.jpg`,
    puzzleY: targetY,
    // ⚠️ KHÔNG gửi targetX!
  });
});

// ② VERIFY:
app.post("/api/captcha/verify", (req, res) => {
  const { challengeId, data } = req.body;

  // Decrypt data:
  const { slideX, trajectory, behavior } = JSON.parse(decrypt(data));

  // Check challenge exists + not expired:
  const challenge = challenges.get(challengeId);
  if (!challenge) return res.json({ success: false, error: "expired" });

  // Check replay attack:
  if (challenge.used)
    return res.json({ success: false, error: "already_used" });
  challenge.used = true;

  // Check position (tolerance ±5px):
  const positionOk = Math.abs(slideX - challenge.targetX) <= 5;

  // Check behavior:
  const behaviorAnalyzer = new BehaviorAnalyzer();
  const features = behaviorAnalyzer.analyze(trajectory);
  const isHuman =
    features.duration > 200 &&
    features.yVariance > 0 &&
    features.speedVariance > 0.001 &&
    features.straightness < 0.99 &&
    features.pointCount > 5;

  if (positionOk && isHuman) {
    // Tạo JWT token (hạn 5 phút!):
    const token = jwt.sign(
      { challengeId, verified: true },
      process.env.JWT_SECRET!,
      { expiresIn: "5m" },
    );
    res.json({ success: true, token });
  } else {
    res.json({ success: false });
  }

  // Cleanup:
  challenges.delete(challengeId);
});
```

---

## §8. Anti-Bot Detection — Chống bot

```
ANTI-BOT — CÁC LỚP BẢO VỆ:
═══════════════════════════════════════════════════════════════

  ① DEVICE FINGERPRINT:
  → Canvas fingerprint, WebGL, Audio fingerprint!
  → Screen resolution, timezone, installed fonts!
  → navigator properties, plugins!
  → Browser THẬT vs Headless (Puppeteer, Selenium)!

  ② HEADLESS BROWSER DETECTION:
  → navigator.webdriver === true → HEADLESS!
  → window.chrome undefined → HEADLESS!
  → Missing plugins → HEADLESS!
  → Permission API behavior khác thường!

  ③ RATE LIMITING:
  → IP-based: max 10 challenges/phút/IP!
  → Fingerprint-based: max 5 challenges/phút/device!
  → Exponential backoff: fail nhiều → đợi lâu hơn!

  ④ PROOF OF WORK (PoW):
  → Client phải giải bài toán tính toán!
  → VD: tìm nonce sao cho SHA256(data + nonce) < target!
  → Người dùng: 100ms, không nhận ra!
  → Bot spam hàng nghìn requests: TỐN CPU!

  ⑤ ENCRYPTION:
  → Data client → server: ENCRYPT!
  → Obfuscate SDK code (khó reverse engineer!)
  → Anti-tampering: detect code modification!
```

```typescript
// ═══ DEVICE FINGERPRINT ═══

class DeviceFingerprint {
  async generate(): Promise<string> {
    const components = [
      this.getCanvasFingerprint(),
      this.getWebGLFingerprint(),
      this.getScreenInfo(),
      this.getTimezone(),
      this.getLanguages(),
      this.getPlatform(),
      this.getHardware(),
    ];

    const fingerprint = components.join("|");
    // Hash để tạo ID duy nhất:
    const hash = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(fingerprint),
    );
    return Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  private getCanvasFingerprint(): string {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    ctx.textBaseline = "top";
    ctx.font = "14px Arial";
    ctx.fillText("Hello, CAPTCHA! 🔒", 2, 2);
    return canvas.toDataURL();
  }

  private getWebGLFingerprint(): string {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl");
    if (!gl) return "no-webgl";
    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
    return debugInfo
      ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
      : "unknown";
  }

  private getScreenInfo(): string {
    return `${screen.width}x${screen.height}x${screen.colorDepth}`;
  }

  private getTimezone(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }
  private getLanguages(): string {
    return navigator.languages.join(",");
  }
  private getPlatform(): string {
    return navigator.platform;
  }
  private getHardware(): string {
    return `${navigator.hardwareConcurrency}`;
  }
}

// ═══ HEADLESS DETECTION ═══
function detectHeadless(): boolean {
  const checks = [
    navigator.webdriver === true,
    !window.chrome,
    navigator.plugins.length === 0,
    navigator.languages.length === 0,
    /HeadlessChrome/.test(navigator.userAgent),
  ];
  return checks.some(Boolean);
}
```

---

## §9. Security Best Practices

```
SECURITY — BEST PRACTICES:
═══════════════════════════════════════════════════════════════

  ① SERVER-SIDE VALIDATION (BẮT BUỘC!):
  → KHÔNG BAO GIỜ validate chỉ ở client!
  → Server giữ targetX, client KHÔNG biết!
  → Token có expiry (short-lived!)!

  ② CHALLENGE ONE-TIME USE:
  → Mỗi challengeId CHỈ dùng 1 lần!
  → Ngăn replay attack!

  ③ CHALLENGE TTL:
  → Challenge hết hạn sau 60s!
  → Ngăn brute force thử nhiều lần!

  ④ RATE LIMITING:
  → IP-based + Fingerprint-based!
  → Exponential backoff khi fail nhiều!

  ⑤ DATA ENCRYPTION:
  → Client → Server: encrypt payload!
  → Ngăn MITM đọc trajectory data!

  ⑥ CODE OBFUSCATION:
  → SDK source code: obfuscate + minify!
  → Anti-tampering: detect modification!

  ⑦ IMAGE DIVERSITY:
  → Pool 1000+ ảnh nền khác nhau!
  → Random puzzle position mỗi lần!
  → Ngăn ML training trên fixed images!

  ⑧ PROGRESSIVE CHALLENGE:
  → Lần 1: invisible (behavior only)!
  → Nghi ngờ → slide puzzle!
  → Vẫn nghi → click-select (khó hơn)!
  → Tiếp tục fail → block IP + SMS OTP!
```

---

## §10. SDK API Design

```typescript
// ═══ PUBLIC SDK API ═══

interface CaptchaConfig {
  appId: string; // App identifier!
  serverUrl: string; // Captcha server URL!
  mode: "slide" | "click" | "invisible";
  lang?: "vi" | "en" | "zh";
  theme?: "light" | "dark";
  onSuccess: (token: string) => void; // Verify thành công!
  onFail?: (error: string) => void; // Verify thất bại!
  onClose?: () => void; // User đóng modal!
}

class CaptchaSDK {
  // Khởi tạo:
  static init(config: CaptchaConfig): CaptchaSDK;

  // Hiển thị captcha:
  show(): void;

  // Ẩn captcha:
  hide(): void;

  // Reset (tạo challenge mới):
  refresh(): void;

  // Hủy instance:
  destroy(): void;
}

// SỬ DỤNG:
const captcha = CaptchaSDK.init({
  appId: "my-app-123",
  serverUrl: "https://captcha.mycompany.com",
  mode: "slide",
  lang: "vi",
  theme: "dark",
  onSuccess: (token) => {
    // Gửi token kèm login request:
    fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Captcha-Token": token, // ← Token captcha!
      },
      body: JSON.stringify({ username, password }),
    });
  },
  onFail: (error) => console.log("Captcha failed:", error),
});

// Khi user click "Login":
loginButton.addEventListener("click", () => {
  captcha.show(); // Hiện captcha modal!
});
```

---

## §11. Tóm tắt phỏng vấn

```
PHỎNG VẤN — TRẢ LỜI:
═══════════════════════════════════════════════════════════════

  Q: "Thiết kế Captcha SDK như thế nào?"

  A: Captcha SDK gồm CLIENT + SERVER:

  CLIENT SDK (3 modules):
  → UI Module: Canvas vẽ puzzle/grid, modal, slider!
  → Behavior Collector: ghi trajectory (x, y, time)!
  → Crypto Module: encrypt data, device fingerprint!

  SERVER (3 chức năng):
  → Generate: tạo challenge (ảnh + target position)!
  → Verify: so sánh position + analyze behavior!
  → Token: issue JWT (short-lived, one-time!)

  ANTI-BOT — CHÌA KHÓA:
  → Behavior analysis (QUAN TRỌNG NHẤT!):
    speed variance, y-axis variance, jitter,
    acceleration changes, trajectory straightness!
  → Device fingerprint (Canvas, WebGL, screen!)
  → Headless detection (webdriver, chrome, plugins!)
  → Rate limiting + Proof of Work!

  SECURITY:
  → Server-side validation (KHÔNG validate ở client!)
  → One-time challenge (ngăn replay!)
  → TTL 60s (ngăn brute force!)
  → Data encryption (ngăn MITM!)
  → Progressive challenge (invisible → slide → click → block!)
```

---

### Checklist

- [ ] **CAPTCHA**: Completely Automated Public Turing test; phân biệt người vs bot!
- [ ] **6 loại**: Text (lỗi thời), Math (yếu), Slide (phổ biến), Click-select, Invisible (behavior), SMS OTP!
- [ ] **Slide Puzzle**: Canvas vẽ puzzle path, slider drag, trajectory recording, server verify position ±5px!
- [ ] **Click-Select**: Grid ảnh, chọn ô đúng, ghi click points + timing!
- [ ] **Behavior Analysis**: speed variance, y variance, jitter, acceleration changes, straightness, point count, duration!
- [ ] **Bot vs Human**: Bot = tốc độ đều, Y=0, thẳng, nhanh < 200ms; Human = dao động, jitter, tăng/giảm tốc!
- [ ] **Server Verify**: challengeId TTL 60s, one-time use, position check, behavior analysis, JWT token 5 phút!
- [ ] **Anti-Bot**: Device fingerprint (Canvas/WebGL/screen), Headless detection (webdriver), Rate limiting, PoW!
- [ ] **Security**: Server-side validation BẮT BUỘC, encrypt data, obfuscate SDK, image diversity 1000+!
- [ ] **Progressive**: invisible → slide → click-select → block + SMS OTP!
- [ ] **SDK API**: init(config) → show() → onSuccess(token) → kèm token trong API request!

---

_Cập nhật lần cuối: Tháng 2, 2026_
