# WebGL — Deep Dive Study Document

> **Mục tiêu:** Từ zero đến master — hiểu sâu WebGL từ concept cơ bản đến production patterns.
> **Áp dụng:** Security visualization (100K+ points), 3D threat maps, particle systems, data-intensive dashboards.
> **Liên quan:** `Threat-Visualization-AI-Deep-Dive.md` §11 (Three.js basics)

```
DIFFICULTY PROGRESSION:
═══════════════════════════════════════════════════════════════

  🟢 BEGINNER (§0 - §1)
  │  → Canvas basics, GPU vs CPU, tại sao cần WebGL
  │  → Coordinate systems, basic math
  │
  🟡 INTERMEDIATE (§2 - §6)
  │  → GPU pipeline, GLSL shaders, buffers
  │  → Textures, framebuffers, instanced rendering
  │
  🟠 ADVANCED (§7 - §10)
  │  → Three.js architecture, React Three Fiber
  │  → Security viz patterns, performance optimization
  │
  🔴 EXPERT (§11 - §15)
     → Lighting & materials, animation, WebGL2/WebGPU
     → Advanced GLSL techniques, interview mastery
```

---

## Mục lục

0. [Prerequisites — Nền tảng cho Beginner](#0-prerequisites)
1. [Overview & Khi nào dùng WebGL](#1-overview)
2. [GPU Rendering Pipeline](#2-gpu-rendering-pipeline)
3. [WebGL API Fundamentals](#3-webgl-api-fundamentals)
4. [Shaders & GLSL](#4-shaders--glsl)
5. [Textures & Framebuffers](#5-textures--framebuffers)
6. [Instanced Rendering & Performance](#6-instanced-rendering)
7. [Three.js Architecture](#7-threejs-architecture)
8. [React Three Fiber (R3F)](#8-react-three-fiber)
9. [Security Visualization Patterns](#9-security-visualization-patterns)
10. [WebGL Performance Optimization](#10-performance-optimization)
11. [Lighting & Materials](#11-lighting--materials)
12. [Animation & Interaction Patterns](#12-animation--interaction)
13. [Advanced GLSL Techniques](#13-advanced-glsl)
14. [WebGL2 & WebGPU](#14-webgl2--webgpu)
15. [Interview Questions](#15-interview-questions)

---

## 0. Prerequisites — Nền tảng cho Beginner 🟢

> **Nếu bạn chưa biết gì về WebGL, bắt đầu từ đây.**
> Section này giải thích các khái niệm nền tảng cần hiểu TRƯỚC KHI học WebGL.

### 0.1 Canvas là gì?

```
CANVAS — Tấm vải vẽ trong browser:
═══════════════════════════════════════════════════════════════

  HTML Page
  ┌─────────────────────────────────────────────┐
  │  <h1>My App</h1>                            │
  │                                              │
  │  ┌─────────────────────────────────┐        │
  │  │         <canvas>                │        │
  │  │                                 │        │
  │  │   ← Đây là vùng vẽ pixel       │        │
  │  │     Giống tấm vải (canvas)      │        │
  │  │     trong hội họa               │        │
  │  │                                 │        │
  │  └─────────────────────────────────┘        │
  │                                              │
  │  <p>Other content</p>                       │
  └─────────────────────────────────────────────┘

  Canvas có 2 "context" (cách vẽ):
  ┌───────────────────────────────────────────────┐
  │ ① canvas.getContext('2d')                     │
  │    → CPU vẽ từng pixel (đơn giản, quen thuộc)│
  │    → fillRect, drawImage, arc, lineTo         │
  │                                               │
  │ ② canvas.getContext('webgl') ← FOCUS CỦA DOC │
  │    → GPU vẽ song song (nhanh, mạnh)           │
  │    → Shaders, buffers, textures               │
  └───────────────────────────────────────────────┘
```

```typescript
// ═══════════════════════════════════════════════════
// CANVAS 2D — Ví dụ cơ bản (so sánh với WebGL sau)
// ═══════════════════════════════════════════════════

// Bước 1: Tạo canvas trong HTML
// <canvas id="myCanvas" width="800" height="600"></canvas>

// Bước 2: Lấy 2D context
const canvas = document.getElementById("myCanvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;

// Bước 3: Vẽ hình tròn đỏ
ctx.beginPath();
ctx.arc(400, 300, 50, 0, Math.PI * 2); // x, y, radius, startAngle, endAngle
ctx.fillStyle = "red";
ctx.fill();
// → Canvas 2D: ~5 dòng code, dễ hiểu
// → Nhưng vẽ 100K hình tròn sẽ RẤT CHẬM (CPU vẽ tuần tự)

// Bước 4: Vẽ 1000 hình tròn → bắt đầu thấy chậm
for (let i = 0; i < 1000; i++) {
  ctx.beginPath();
  ctx.arc(
    Math.random() * 800, // random x
    Math.random() * 600, // random y
    5, // radius
    0,
    Math.PI * 2,
  );
  ctx.fillStyle = `hsl(${Math.random() * 360}, 70%, 50%)`;
  ctx.fill();
}
// → 1K circles: OK (~60fps)
// → 10K circles: chậm (~30fps)
// → 100K circles: KHÔNG THỂ (~5fps)
// → Đây là lý do cần WebGL!
```

### 0.2 CPU vs GPU — Tại sao GPU nhanh hơn?

```
CPU vs GPU — Sự khác biệt cốt lõi:
═══════════════════════════════════════════════════════════════

  CPU (Central Processing Unit):
  ┌──────────────────────────────────────────────────────────┐
  │ 🧠 ÍT NHÂN, MẠNH MỖI NHÂN                              │
  │                                                          │
  │  ┌───┐  ┌───┐  ┌───┐  ┌───┐                            │
  │  │ 1 │  │ 2 │  │ 3 │  │ 4 │   ← 4-16 cores            │
  │  └───┘  └───┘  └───┘  └───┘                            │
  │                                                          │
  │  Mỗi core: rất mạnh, chạy logic phức tạp               │
  │  Nhưng chỉ làm 4-16 việc cùng lúc                      │
  │                                                          │
  │  GIỐNG NHƯ: 4 đầu bếp giỏi, nấu 4 món phức tạp       │
  └──────────────────────────────────────────────────────────┘

  GPU (Graphics Processing Unit):
  ┌──────────────────────────────────────────────────────────┐
  │ 🔥 NHIỀU NHÂN, ĐƠN GIẢN MỖI NHÂN                       │
  │                                                          │
  │  ┌─┐┌─┐┌─┐┌─┐┌─┐┌─┐┌─┐┌─┐┌─┐┌─┐┌─┐┌─┐┌─┐┌─┐┌─┐┌─┐  │
  │  │1││2││3││4││5││6││7││8││9││ ││ ││ ││ ││ ││ ││ │  │
  │  └─┘└─┘└─┘└─┘└─┘└─┘└─┘└─┘└─┘└─┘└─┘└─┘└─┘└─┘└─┘└─┘  │
  │  ... × 1000-5000 cores!                                  │
  │                                                          │
  │  Mỗi core: đơn giản, chỉ tính toán nhỏ                 │
  │  Nhưng làm 1000+ việc CÙNG LÚC (parallel)              │
  │                                                          │
  │  GIỐNG NHƯ: 1000 người xếp gạch — mỗi người xếp 1      │
  │             viên → xong 1000 viên cùng lúc!             │
  └──────────────────────────────────────────────────────────┘

  VÍ DỤ THỰC TẾ — Vẽ 100K pixels:
  ┌──────────────────────────────────────────────────────────┐
  │ CPU: pixel1 → pixel2 → pixel3 → ... → pixel100000      │
  │      Tuần tự, mất ~16ms × (100K / throughput)           │
  │                                                          │
  │ GPU: pixel1, pixel2, pixel3, ..., pixel4096 → CÙNG LÚC │
  │      Rồi batch tiếp: pixel4097..8192 → CÙNG LÚC        │
  │      Tổng cộng chỉ ~25 batches → xong!                  │
  └──────────────────────────────────────────────────────────┘
```

### 0.3 Coordinate Systems — Hệ tọa độ

```
HỆ TỌA ĐỘ — WebGL vs Canvas vs CSS:
═══════════════════════════════════════════════════════════════

  ① CSS / DOM (quen thuộc):
     (0,0) ──────→ X+
       │
       │   Gốc ở TOP-LEFT
       ▼   Y tăng xuống dưới
       Y+

  ② Canvas 2D (giống CSS):
     (0,0) ──────→ X+
       │
       │   Gốc ở TOP-LEFT
       ▼   Y tăng xuống dưới
       Y+
       Đơn vị: pixels (0 → canvas.width)

  ③ WebGL Clip Space (KHÁC BIỆT!):
              Y+ (1.0)
              │
              │
    (-1,0)────┼────(1,0)  X+
              │
              │
            Y- (-1.0)

     Gốc ở CENTER!
     X: -1 (trái) → +1 (phải)
     Y: -1 (dưới)  → +1 (trên)  ← NGƯỢC với CSS!
     Z: -1 (gần)   → +1 (xa)

  ④ Chuyển đổi:
     CSS pixel → WebGL clip space:
     clipX = (pixelX / canvas.width)  * 2 - 1
     clipY = (pixelY / canvas.height) * -2 + 1  ← ĐẢO Y!
```

```typescript
// ═══════════════════════════════════════════════════
// COORDINATE CONVERSION — CSS pixels ↔ WebGL clip space
// ═══════════════════════════════════════════════════

function pixelToClip(
  pixelX: number,
  pixelY: number,
  canvas: HTMLCanvasElement,
): [number, number] {
  // CSS: top-left = (0,0), Y goes down
  // WebGL: center = (0,0), Y goes up
  const clipX = (pixelX / canvas.width) * 2 - 1;
  const clipY = (pixelY / canvas.height) * -2 + 1; // flip Y!
  return [clipX, clipY];
}

// Ví dụ:
// Canvas 800x600
// CSS pixel (400, 300) → center → WebGL (0, 0) ✓
// CSS pixel (0, 0)     → top-left → WebGL (-1, 1) ✓
// CSS pixel (800, 600) → bottom-right → WebGL (1, -1) ✓

function clipToPixel(
  clipX: number,
  clipY: number,
  canvas: HTMLCanvasElement,
): [number, number] {
  const pixelX = ((clipX + 1) / 2) * canvas.width;
  const pixelY = ((1 - clipY) / 2) * canvas.height; // flip Y back
  return [pixelX, pixelY];
}
```

### 0.4 Vector & Matrix Basics — Toán cơ bản cho 3D

```
VECTOR — Mũi tên trong không gian:
═══════════════════════════════════════════════════════════════

  Vector = hướng + độ dài
  vec2(3, 4)  → 2D: đi phải 3, lên 4
  vec3(1, 2, 3) → 3D: x=1, y=2, z=3

  ① Length (Độ dài):
     |vec2(3,4)| = √(3² + 4²) = √25 = 5

  ② Normalize (Vector đơn vị, length = 1):
     normalize(vec2(3,4)) = vec2(3/5, 4/5) = vec2(0.6, 0.8)
     Dùng khi: chỉ cần HƯỚNG, không cần độ lớn

  ③ Dot Product (Tích vô hướng):
     dot(A, B) = |A| × |B| × cos(θ)
     Kết quả: 1 số → cho biết 2 vector giống hướng?
     • dot > 0 → cùng hướng
     • dot = 0 → vuông góc (90°)
     • dot < 0 → ngược hướng
     Dùng khi: tính ánh sáng (light direction · surface normal)

  ④ Cross Product (Tích có hướng — chỉ 3D):
     cross(A, B) = vector VUÔNG GÓC với cả A và B
     Dùng khi: tính surface normal từ 2 cạnh tam giác

  MATRIX — Phép biến đổi:
  ┌──────────────────────────────────────────────────────┐
  │ Matrix 4x4 = cách biến đổi toàn bộ không gian       │
  │                                                      │
  │ Translate (dịch chuyển):                             │
  │ ┌ 1  0  0  tx ┐                                     │
  │ │ 0  1  0  ty │  → Dời object đi (tx, ty, tz)       │
  │ │ 0  0  1  tz │                                     │
  │ └ 0  0  0  1  ┘                                     │
  │                                                      │
  │ Scale (co giãn):                                     │
  │ ┌ sx 0  0  0 ┐                                      │
  │ │ 0  sy 0  0 │  → Phóng to/thu nhỏ (sx, sy, sz)    │
  │ │ 0  0  sz 0 │                                      │
  │ └ 0  0  0  1 ┘                                      │
  │                                                      │
  │ NHÂN Matrix = KẾT HỢP biến đổi:                     │
  │ ProjectionMatrix × ViewMatrix × ModelMatrix          │
  │ = MVP matrix (từ local → screen)                     │
  └──────────────────────────────────────────────────────┘
```

```typescript
// ═══════════════════════════════════════════════════
// VECTOR OPERATIONS — Pure JS (trước khi dùng gl-matrix)
// ═══════════════════════════════════════════════════

// Hiểu concept trước, dùng library sau!

type Vec2 = [number, number];
type Vec3 = [number, number, number];

// Length (độ dài vector)
function length(v: Vec3): number {
  return Math.sqrt(v[0] ** 2 + v[1] ** 2 + v[2] ** 2);
}
// length([3, 4, 0]) → 5

// Normalize (vector đơn vị)
function normalize(v: Vec3): Vec3 {
  const len = length(v);
  return [v[0] / len, v[1] / len, v[2] / len];
}
// normalize([3, 4, 0]) → [0.6, 0.8, 0]

// Dot product
function dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}
// dot([1,0,0], [0,1,0]) → 0 (vuông góc)
// dot([1,0,0], [1,0,0]) → 1 (cùng hướng)

// Cross product
function cross(a: Vec3, b: Vec3): Vec3 {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}
// cross([1,0,0], [0,1,0]) → [0,0,1] (Z axis)

// Ví dụ thực tế: tính hướng ánh sáng chiếu vào bề mặt
const lightDir: Vec3 = normalize([1, 1, 0]); // light từ phải-trên
const surfaceNormal: Vec3 = [0, 1, 0]; // mặt phẳng nằm ngang
const brightness = Math.max(0, dot(lightDir, surfaceNormal));
// brightness = 0.707 → ~70% sáng (ánh sáng chiếu xiên 45°)
```

### 0.5 WebGL "Hello World" — So sánh với Canvas 2D

```typescript
// ═══════════════════════════════════════════════════
// SO SÁNH: Canvas 2D vs WebGL — Vẽ 1 tam giác
// ═══════════════════════════════════════════════════

// ──────────────────────────────────────────
// CÁCH 1: Canvas 2D (3 dòng)
// ──────────────────────────────────────────
const ctx = canvas.getContext("2d")!;
ctx.beginPath();
ctx.moveTo(400, 100); // đỉnh trên
ctx.lineTo(200, 500); // đỉnh trái dưới
ctx.lineTo(600, 500); // đỉnh phải dưới
ctx.closePath();
ctx.fillStyle = "red";
ctx.fill();
// → Đơn giản, dễ hiểu
// → CPU vẽ, chậm khi nhiều objects

// ──────────────────────────────────────────
// CÁCH 2: WebGL (~50 dòng) — Chi tiết ở §3
// ──────────────────────────────────────────
// 1. Viết shader code (chương trình chạy trên GPU)
// 2. Compile shader → program
// 3. Tạo buffer, upload vertex data
// 4. Kết nối attributes
// 5. Draw call
// → Phức tạp, nhưng GPU vẽ, CỰC NHANH

// TẠI SAO WebGL "phức tạp"?
// Vì bạn đang LẬP TRÌNH CHO GPU — khác CPU hoàn toàn:
// - GPU không biết "hình tròn" hay "chữ nhật"
// - GPU chỉ biết TRIANGLES (tam giác)
// - Mọi hình phức tạp = tổ hợp tam giác
// - Bạn phải viết "shader" = chương trình GPU
//   để nói cho GPU biết: vẽ ở đâu? màu gì?
```

---

## 1. Overview & Khi nào dùng WebGL

> **🎯 Học xong phần này, bạn sẽ biết:**
>
> - Khi nào nên dùng WebGL thay vì Canvas 2D hoặc SVG
> - Tại sao frontend developer cần quan tâm đến WebGL
> - Các use cases thực tế của WebGL trong ngành

### Tại sao Frontend Developer cần biết WebGL?

```
TẠI SAO CẦN WEBGL?
═══════════════════════════════════════════════════════════════

  Hãy tưởng tượng bạn là quản lý một trung tâm vận chuyển:

  ① GỬI THƯ TAY (SVG):
     → Viết từng lá thư bằng tay, đẹp, có thể sửa lại
     → Nhưng chỉ gửi được vài trăm lá/ngày
     → Giống SVG: mỗi phần tử là 1 DOM node, tương tác dễ
       nhưng quá 1000 phần tử sẽ rất chậm

  ② MÁY PHOTOCOPY (Canvas 2D):
     → Copy nhanh hơn, hàng ngàn tờ/ngày
     → Nhưng mỗi tờ vẫn photo TUẦN TỰ (1 máy, 1 tờ/lần)
     → Giống Canvas 2D: CPU vẽ pixel nhanh hơn SVG
       nhưng vẫn tuần tự, 50K+ objects bắt đầu chậm

  ③ NHÀ MÁY IN (WebGL):
     → 1000 máy in chạy CÙNG LÚC, hàng triệu tờ/ngày
     → Setup phức tạp (cần lập trình máy in)
     → Nhưng khi chạy rồi → CỰC NHANH
     → Giống WebGL: phải viết shader (lập trình GPU)
       nhưng GPU có 1000+ cores chạy song song

  KHI NÀO BẠN SẼ GẶP WEBGL TRONG CÔNG VIỆC?
  ┌──────────────────────────────────────────────────────┐
  │ ① Dashboard có 100K+ data points (monitoring, SOC)  │
  │ ② Bản đồ 3D (threat maps, visualization)            │
  │ ③ Hiệu ứng visual cao cấp (particle effects)       │
  │ ④ App cần performance đồ họa cao (design tools)     │
  │ ⑤ Games hoặc 3D product showcase trên web           │
  │                                                      │
  │ → Nếu bạn làm ở công ty có dashboard lớn,           │
  │   visualization phức tạp, hoặc 3D trên web          │
  │   → BẠN SẼ CẦN WebGL (thường qua Three.js/R3F)     │
  └──────────────────────────────────────────────────────┘
```

Dưới đây là **cây quyết định** giúp bạn chọn công nghệ phù hợp — hãy dựa vào **số lượng phần tử cần vẽ** làm tiêu chí chính:

```
CÂY QUYẾT ĐỊNH WebGL:
═══════════════════════════════════════════════════════════════

  Kích thước dữ liệu?
  │
  ├── < 1K phần tử ──→ SVG (D3.js, Recharts)
  │                      ✅ Sự kiện DOM, CSS styling, accessibility
  │
  ├── 1K - 50K ──→ Canvas 2D
  │                 ✅ Vẽ pixel nhanh, biến đổi 2D
  │                 ✅ Đủ cho hầu hết dashboard
  │
  ├── 50K - 1M ──→ WebGL (tài liệu này)
  │                 ✅ Xử lý song song bằng GPU
  │                 ✅ Instanced rendering (1 draw call = 100K objects)
  │                 ✅ Custom shader cho hiệu ứng hình ảnh
  │
  └── > 1M ──→ WebGPU (tương lai) hoặc server-side rendering

  ĐIỂM MẤU CHỐT:
  ┌──────────────────────────────────────────────────────┐
  │ CPU (Canvas 2D): vẽ objects TỪNG CÁI MỘT (tuần tự) │
  │ GPU (WebGL):     vẽ TẤT CẢ CÙNG LÚC (song song)    │
  │                                                      │
  │ 100K hình tròn trên Canvas: ~15fps (nghẽn CPU)       │
  │ 100K hình tròn trên WebGL:  ~60fps (GPU song song)   │
  └──────────────────────────────────────────────────────┘

  CÁC TRƯỜNG HỢP SỬ DỤNG WebGL TRONG FRONTEND:
  ┌──────────────────────────────────────────────────────┐
  │ ① Trực quan hóa dữ liệu (100K+ điểm dữ liệu)      │
  │ ② 3D Globe / Bản đồ (threat maps, dữ liệu địa lý)  │
  │ ③ Particle Systems (luồng sự kiện real-time)        │
  │ ④ Xử lý hình ảnh (filters, ML inference)            │
  │ ⑤ Games & 3D tương tác                              │
  │ ⑥ Trực quan hóa khoa học                            │
  └──────────────────────────────────────────────────────┘
```

### 1.1 WebGL là gì?

> **Giải thích đơn giản:** Khi bạn viết `canvas.getContext('2d')`, bạn đang nói: _"Tôi muốn vẽ bằng CPU"_. Khi viết `canvas.getContext('webgl2')`, bạn đang nói: _"Tôi muốn vẽ bằng GPU"_. Cùng một `<canvas>`, nhưng **cách vẽ hoàn toàn khác nhau** — giống như cùng 1 chiếc xe, nhưng bật số tay hoặc số tự động thì cách lái khác.

```typescript
// WebGL = JavaScript API giao tiếp GPU qua OpenGL ES 2.0 (WebGL1) / 3.0 (WebGL2)
// Chạy BÊN TRONG phần tử <canvas> — giống Canvas 2D nhưng dùng GPU

const canvas = document.getElementById("gl-canvas") as HTMLCanvasElement;

// Lấy WebGL2 context (ưu tiên) với fallback sang WebGL1
const gl =
  canvas.getContext("webgl2") ??
  canvas.getContext("webgl") ??
  canvas.getContext("experimental-webgl");

if (!gl) {
  console.error("WebGL không được hỗ trợ");
  // Fallback sang Canvas 2D
}

// Kiểm tra phiên bản WebGL2
const isWebGL2 = gl instanceof WebGL2RenderingContext;
console.log(`Phiên bản WebGL: ${isWebGL2 ? "2.0" : "1.0"}`);

// Kiểm tra khả năng chính
console.log("Kích thước texture tối đa:", gl.getParameter(gl.MAX_TEXTURE_SIZE));
console.log(
  "Số vertex attribs tối đa:",
  gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
);
console.log("Số draw buffers tối đa:", gl.getParameter(gl.MAX_DRAW_BUFFERS)); // WebGL2
console.log("Renderer:", gl.getParameter(gl.RENDERER));
```

---

## 2. GPU Rendering Pipeline — Đường ống kết xuất GPU

> **🎯 Học xong phần này, bạn sẽ biết:**
>
> - Dữ liệu đi từ JavaScript đến màn hình như thế nào
> - Vertex shader và Fragment shader làm gì
> - Tại sao GPU vẽ nhanh hơn CPU (song song)

### Pipeline là gì? — Analogy "Dây chuyền lắp ráp"

```
PIPELINE = DÂY CHUYỀN NHÀ MÁY:
═══════════════════════════════════════════════════════════════

  Hãy tưởng tượng một nhà máy sản xuất áo phông:

  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
  │ ① CẮT    │→  │ ② MAY    │→  │ ③ IN HOA │→  │ ④ ĐÓNG   │
  │ VẢI      │   │ GHÉP     │   │ VĂN      │   │ GÓI      │
  └──────────┘   └──────────┘   └──────────┘   └──────────┘

  → Mỗi bước CHUYÊN MÔN hóa, mỗi bước nhận đầu vào từ bước trước
  → Nhiều áo được xử lý ĐỒNG THỜI ở các bước khác nhau
  → KHÔNG THỂ bỏ qua bước nào — phải theo thứ tự

  GPU Pipeline cũng GIỐNG HỆT:

  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
  │ ① VERTEX │→  │ ② LẮP    │→  │ ③ RASTER │→  │ ④ FRAG   │
  │ SHADER   │   │ RÁP      │   │ IZATION  │   │ SHADER   │
  │ (Xác     │   │ (Ghép    │   │ (Chuyển  │   │ (Tô      │
  │  định    │   │  thành   │   │  thành   │   │  màu     │
  │  VỊ TRÍ) │   │  ▲)      │   │  pixels) │   │  pixel)  │
  └──────────┘   └──────────┘   └──────────┘   └──────────┘

  → Bước ① và ④ là 2 bước BẠN PHẢI VIẾT CODE (shader)
  → Bước ② và ③ GPU tự làm (bạn không cần code)
  → Đây là LÝ DO WebGL yêu cầu bạn viết shader!
```

Dưới đây là **sơ đồ chi tiết** pipeline với các loại dữ liệu đầu vào:

```
ĐƯỜNG ỐNG KẾT XUẤT GPU — WebGL:
═══════════════════════════════════════════════════════════════

  JavaScript (CPU)          Đường ống GPU
  ┌─────────────┐    ┌──────────────────────────────────┐
  │ Vertex Data │───→│ ① VERTEX SHADER                  │
  │ (vị trí,    │    │    → Chạy CHO MỖI VERTEX         │
  │  màu sắc,   │    │    → Biến đổi 3D → 2D (MVP)     │
  │  normals)   │    │    → Đầu ra: gl_Position          │
  └─────────────┘    │                                    │
                     │ ② LẮP RÁP PRIMITIVES              │
  ┌─────────────┐    │    → Gom vertices thành tam giác  │
  │ Uniforms    │───→│                                    │
  │ (matrices,  │    │ ③ RASTERIZATION                   │
  │  thời gian, │    │    → Tam giác → Fragments (pixels)│
  │  màu sắc)   │    │    → Nội suy attributes            │
  └─────────────┘    │                                    │
                     │ ④ FRAGMENT SHADER                  │
  ┌─────────────┐    │    → Chạy CHO MỖI PIXEL           │
  │ Textures    │───→│    → Tính toán màu cuối cùng       │
  │ (hình ảnh,  │    │    → Đầu ra: gl_FragColor          │
  │  dữ liệu)  │    │                                    │
  └─────────────┘    │ ⑤ HÒA TRỘN ĐẦU RA                │
                     │    → Kiểm tra độ sâu, blending     │
                     │    → Ghi vào framebuffer           │
                     └──────────────────────────────────┘
                                    │
                                    ▼
                           ┌──────────────┐
                           │   Màn hình    │
                           └──────────────┘

  QUAN TRỌNG: Shader code chạy trên GPU, SONG SONG cho mỗi vertex/pixel.
  1000 vertices → 1000 vertex shader instances chạy CÙNG LÚC.
  1M pixels → 1M fragment shader instances chạy CÙNG LÚC.

  ┌────────────────────────────────────────────────────────┐
  │ VERTEX SHADER:   Xác định VỊ TRÍ của vật thể          │
  │ FRAGMENT SHADER: Xác định MÀU SẮC của từng pixel       │
  └────────────────────────────────────────────────────────┘
```

### 2.1 MVP Matrix — Model-View-Projection

> **Analogy "Chụp ảnh":** MVP Matrix giống việc chụp ảnh một bức tượng:
>
> - **Model** = đặt bức tượng ở đâu, xoay hướng nào, to hay nhỏ (biến đổi vật thể)
> - **View** = bạn đứng ở đâu để chụp, nhìn hướng nào (camera)
> - **Projection** = dùng ống kính gì? Góc rộng (perspective — vật xa nhỏ hơn) hay zoom phẳng (orthographic — mọi thứ cùng cỡ)
>
> GPU nhân 3 ma trận này lại: `gl_Position = Projection × View × Model × vị_trí_đỉnh` → ra được vị trí pixel trên màn hình.

```
HỆ TỌA ĐỘ 3D:
═══════════════════════════════════════════════════════════════

  Object Space → World Space → Camera Space → Screen Space
       │              │             │              │
    MODEL          VIEW         PROJECTION      VIEWPORT
    Matrix         Matrix        Matrix         Transform

  gl_Position = PROJECTION × VIEW × MODEL × vertexPosition

  ┌──────────────────────────────────────────────────────┐
  │ MODEL:      Biến đổi vật thể (dịch/xoay/co giãn)    │
  │ VIEW:       Vị trí & hướng nhìn của camera           │
  │ PROJECTION: Phối cảnh (chiều sâu 3D) hoặc trực giao │
  └──────────────────────────────────────────────────────┘

  Perspective Projection (hiệu ứng chiều sâu):
  → Vật gần = to hơn, vật xa = nhỏ hơn
  → Dùng cho: cảnh 3D, globe, games

  Orthographic Projection (không có chiều sâu):
  → Mọi vật thể cùng kích thước dù khoảng cách khác nhau
  → Dùng cho: 2D overlay, UI, trực quan hóa dữ liệu
```

```typescript
// Xây dựng MVP Matrix bằng gl-matrix
import { mat4 } from "gl-matrix";

function createMVP(canvas: HTMLCanvasElement) {
  // MODEL: đặt vị trí vật thể trong thế giới
  const model = mat4.create();
  mat4.translate(model, model, [0, 0, -5]); // di chuyển ra sau
  mat4.rotateY(model, model, Date.now() * 0.001); // xoay

  // VIEW: camera nhìn vào gốc tọa độ
  const view = mat4.create();
  mat4.lookAt(
    view,
    [0, 2, 5], // vị trí camera (mắt)
    [0, 0, 0], // mục tiêu nhìn (tâm)
    [0, 1, 0], // hướng lên trên
  );

  // PROJECTION: phối cảnh có chiều sâu
  const projection = mat4.create();
  mat4.perspective(
    projection,
    Math.PI / 4, // Góc nhìn: 45 độ
    canvas.width / canvas.height, // tỷ lệ khung hình
    0.1, // mặt phẳng gần
    100, // mặt phẳng xa
  );

  // Kết hợp thành MVP
  const mvp = mat4.create();
  mat4.multiply(mvp, projection, view);
  mat4.multiply(mvp, mvp, model);
  return mvp;
}
```

---

## 3. WebGL API Cơ bản

> **🎯 Học xong phần này, bạn sẽ biết:**
>
> - 6 bước để vẽ hình đầu tiên bằng WebGL
> - Buffer là gì, tại sao cần buffer
> - Shader, program, attributes — các khái niệm cốt lõi

```
WEBGL = "CÔNG THỨC NẤU ĂN" CHO GPU:
═══════════════════════════════════════════════════════════════

  Nấu ăn cần: ① Công thức → ② Nguyên liệu → ③ Nấu → ④ Bày ra đĩa
  WebGL cần:  ① Shader    → ② Buffer (data) → ③ Link → ④ Draw

  6 BƯỚC VẼ HÌNH — TÓM TẮT TRƯỚC KHI ĐI CHI TIẾT:
  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │ BƯỚC 1: Viết Shader (công thức cho GPU)                 │
  │    → Vertex shader: "vẽ ở ĐÂU?"                        │
  │    → Fragment shader: "vẽ MÀU GÌ?"                      │
  │                                                          │
  │ BƯỚC 2: Compile Shader (kiểm tra công thức đúng không)  │
  │    → GPU biên dịch code GLSL thành mã máy               │
  │                                                          │
  │ BƯỚC 3: Tạo Program (gộp 2 shader thành 1 chương trình) │
  │    → Link vertex + fragment shader lại với nhau          │
  │                                                          │
  │ BƯỚC 4: Tạo Buffer & tải data lên GPU                   │
  │    → Gửi tọa độ, màu sắc từ CPU → GPU memory           │
  │    → Giống như chuyển nguyên liệu vào bếp               │
  │                                                          │
  │ BƯỚC 5: Kết nối Attributes (nói GPU đọc data thế nào)   │
  │    → "2 số đầu = vị trí, 3 số sau = màu"               │
  │                                                          │
  │ BƯỚC 6: Vẽ! (gl.drawArrays)                             │
  │    → GPU chạy shader cho từng vertex & pixel             │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  💡 LƯU Ý: Từ bước 2-5, bạn chỉ làm 1 LẦN khi khởi tạo.
     Bước 6 chạy lại MỖI FRAME (60 lần/giây).
```

### 3.1 Luồng kết xuất hoàn chỉnh

```typescript
// ═══════════════════════════════════════════════════
// WEBGL TAM GIÁC ĐẦU TIÊN — Luồng hoàn chỉnh
// ═══════════════════════════════════════════════════

function renderTriangle(gl: WebGLRenderingContext) {
  // ━━━ BƯỚC 1: Viết mã nguồn Shader ━━━
  const vertexShaderSource = `
    attribute vec2 a_position;
    attribute vec3 a_color;
    varying vec3 v_color;

    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
      v_color = a_color;     // truyền cho fragment shader
    }
  `;

  const fragmentShaderSource = `
    precision mediump float;
    varying vec3 v_color;

    void main() {
      gl_FragColor = vec4(v_color, 1.0);
    }
  `;

  // ━━━ BƯỚC 2: Biên dịch Shader ━━━
  function compileShader(
    gl: WebGLRenderingContext,
    source: string,
    type: number,
  ): WebGLShader {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error(`Lỗi biên dịch Shader: ${info}`);
    }
    return shader;
  }

  const vertexShader = compileShader(gl, vertexShaderSource, gl.VERTEX_SHADER);
  const fragShader = compileShader(
    gl,
    fragmentShaderSource,
    gl.FRAGMENT_SHADER,
  );

  // ━━━ BƯỚC 3: Liên kết Program ━━━
  const program = gl.createProgram()!;
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(`Lỗi liên kết Program: ${gl.getProgramInfoLog(program)}`);
  }
  gl.useProgram(program);

  // ━━━ BƯỚC 4: Tạo Buffer & Tải dữ liệu lên ━━━
  // Vertex tam giác: [x, y, r, g, b] xen kẽ
  const vertices = new Float32Array([
    // x     y     r    g    b
    0.0,
    0.5,
    1.0,
    0.0,
    0.0, // đỉnh trên (màu đỏ)
    -0.5,
    -0.5,
    0.0,
    1.0,
    0.0, // dưới-trái (màu xanh lá)
    0.5,
    -0.5,
    0.0,
    0.0,
    1.0, // dưới-phải (màu xanh dương)
  ]);

  const buffer = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  // ━━━ BƯỚC 5: Kết nối Attributes ━━━
  const FLOAT_SIZE = Float32Array.BYTES_PER_ELEMENT; // 4 bytes
  const STRIDE = 5 * FLOAT_SIZE; // 5 floats per vertex

  // Attribute vị trí (2 floats, offset 0)
  const posLoc = gl.getAttribLocation(program, "a_position");
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, STRIDE, 0);

  // Attribute màu sắc (3 floats, offset 2 * FLOAT_SIZE)
  const colorLoc = gl.getAttribLocation(program, "a_color");
  gl.enableVertexAttribArray(colorLoc);
  gl.vertexAttribPointer(colorLoc, 3, gl.FLOAT, false, STRIDE, 2 * FLOAT_SIZE);

  // ━━━ BƯỚC 6: Vẽ ━━━
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.TRIANGLES, 0, 3); // 3 vertices
}
```

#### 📖 Giải thích từng bước cho người mới:

```
BƯỚC 1 — VIẾT SHADER (dòng 731-750):
═══════════════════════════════════════════════════════════════

  Bạn đang viết 2 "chương trình nhỏ" bằng ngôn ngữ GLSL
  (không phải JavaScript!) rồi lưu vào biến string.

  📌 VERTEX SHADER (chạy 3 lần — vì tam giác có 3 đỉnh):
  ┌─────────────────────────────────────────────────────────┐
  │ attribute vec2 a_position;                              │
  │  → "Mỗi đỉnh cho tôi 2 số (x, y) = vị trí"          │
  │  → attribute = dữ liệu KHÁC NHAU cho mỗi đỉnh        │
  │                                                         │
  │ attribute vec3 a_color;                                 │
  │  → "Mỗi đỉnh cho tôi 3 số (r, g, b) = màu"           │
  │                                                         │
  │ varying vec3 v_color;                                   │
  │  → "Tôi sẽ TRUYỀN màu này sang fragment shader"       │
  │  → varying = cầu nối giữa vertex ↔ fragment           │
  │                                                         │
  │ gl_Position = vec4(a_position, 0.0, 1.0);              │
  │  → "Đỉnh này nằm ở vị trí (x, y, z=0, w=1)"         │
  │  → vec4 vì GPU cần 4 thành phần (x, y, z, w)          │
  │  → z=0 vì tam giác phẳng 2D, w=1 luôn (chuẩn hóa)    │
  └─────────────────────────────────────────────────────────┘

  📌 FRAGMENT SHADER (chạy hàng ngàn lần — mỗi pixel 1 lần):
  ┌─────────────────────────────────────────────────────────┐
  │ precision mediump float;                                │
  │  → "Tính toán số thực ở độ chính xác trung bình"      │
  │  → BẮT BUỘC khai báo trong fragment shader             │
  │                                                         │
  │ varying vec3 v_color;                                   │
  │  → Nhận màu đã NỘI SUY từ vertex shader               │
  │  → Ví dụ: pixel giữa đỉnh đỏ và đỉnh xanh lá        │
  │    → sẽ nhận v_color = màu pha trộn (gradient)        │
  │                                                         │
  │ gl_FragColor = vec4(v_color, 1.0);                     │
  │  → "Pixel này có màu v_color, alpha = 1.0 (đặc)"     │
  └─────────────────────────────────────────────────────────┘


BƯỚC 2 — BIÊN DỊCH SHADER (dòng 752-775):
═══════════════════════════════════════════════════════════════

  GPU KHÔNG đọc được text GLSL trực tiếp.
  Phải compile (biên dịch) thành mã máy GPU hiểu.

  gl.createShader(type)     → Tạo vỏ shader rỗng trên GPU
  gl.shaderSource(shader, source) → Nạp code GLSL vào
  gl.compileShader(shader)  → GPU biên dịch code
  gl.getShaderParameter(... COMPILE_STATUS) → Kiểm tra lỗi

  ⚠️ Nếu GLSL code sai cú pháp → compile thất bại
     → getShaderInfoLog() cho biết lỗi ở đâu
     → Đây là cách DUY NHẤT để debug shader!


BƯỚC 3 — TẠO PROGRAM (dòng 777-786):
═══════════════════════════════════════════════════════════════

  Program = GỘP vertex shader + fragment shader lại.

  gl.createProgram()         → Tạo chương trình rỗng
  gl.attachShader(p, vertex) → Gắn vertex shader vào
  gl.attachShader(p, frag)   → Gắn fragment shader vào
  gl.linkProgram(p)          → Liên kết: kiểm tra
                                vertex và fragment "nói chuyện" được không
                                (varying phải khớp tên + kiểu)
  gl.useProgram(p)           → "GPU ơi, dùng program này để vẽ!"

  💡 Bạn có thể tạo NHIỀU program (mỗi cái = 1 hiệu ứng khác)
     và chuyển đổi bằng gl.useProgram(programKhac)


BƯỚC 4 — TẠO BUFFER & TẢI DATA (dòng 788-811):
═══════════════════════════════════════════════════════════════

  Buffer = vùng nhớ trên GPU để lưu data vertex.
  JavaScript chạy trên CPU, GPU có bộ nhớ RIÊNG → phải "upload".

  Dữ liệu tam giác — 3 đỉnh, mỗi đỉnh có 5 số:
  ┌──────────────────────────────────────────────────────┐
  │ Đỉnh 0: x=0.0  y=0.5   r=1.0 g=0.0 b=0.0  (đỏ)   │
  │ Đỉnh 1: x=-0.5 y=-0.5  r=0.0 g=1.0 b=0.0  (xanh lá)│
  │ Đỉnh 2: x=0.5  y=-0.5  r=0.0 g=0.0 b=1.0  (xanh dương)│
  └──────────────────────────────────────────────────────┘

  Float32Array → mảng số thực 32-bit (GPU chỉ hiểu kiểu này)
  gl.createBuffer()   → Tạo vùng nhớ rỗng trên GPU
  gl.bindBuffer(...)  → "Tôi đang thao tác với buffer này"
                        (giống mở file trước khi ghi)
  gl.bufferData(...)  → Copy data từ CPU → GPU memory
     gl.STATIC_DRAW   → "Data này sẽ KHÔNG thay đổi"
                        (GPU tối ưu lưu trữ)


BƯỚC 5 — KẾT NỐI ATTRIBUTES (dòng 813-825):
═══════════════════════════════════════════════════════════════

  Data đã ở trên GPU, nhưng GPU chưa biết ĐỌC THẾ NÀO.
  Cần chỉ dẫn: "2 số đầu = vị trí, 3 số sau = màu"

  Bộ nhớ GPU (1 mảng phẳng):
  [0.0, 0.5, 1.0, 0.0, 0.0, -0.5, -0.5, 0.0, 1.0, 0.0, ...]
   ├── x ─┤ ├── y ─┤ ├─ r ─┤ ├─ g ─┤ ├─ b ─┤  ← Đỉnh 0
   ├────── a_position ──────┤ ├──── a_color ────────────────┤

  STRIDE = 5 × 4 bytes = 20 bytes (khoảng cách giữa 2 đỉnh)
  → Đỉnh 0 bắt đầu ở byte 0, Đỉnh 1 ở byte 20, ...

  vertexAttribPointer(posLoc, 2, FLOAT, false, STRIDE, 0)
                      │      │                        │
                      │      │                        └─ offset: bắt đầu ở byte 0
                      │      └─ 2 số float (x, y)
                      └─ thuộc attribute "a_position"

  vertexAttribPointer(colorLoc, 3, FLOAT, false, STRIDE, 8)
                      │         │                        │
                      │         │                        └─ offset: bắt đầu ở byte 8
                      │         │                           (sau 2 float × 4 bytes)
                      │         └─ 3 số float (r, g, b)
                      └─ thuộc attribute "a_color"


BƯỚC 6 — VẼ! (dòng 827-831):
═══════════════════════════════════════════════════════════════

  gl.viewport(0, 0, w, h)   → "Vẽ toàn bộ canvas"
  gl.clearColor(0,0,0,1)    → "Nền màu đen"
  gl.clear(COLOR_BUFFER_BIT) → Xóa canvas bằng màu nền
  gl.drawArrays(TRIANGLES, 0, 3)
               │          │  │
               │          │  └─ LẤY 3 vertex
               │          └─ bắt đầu từ vertex 0
               └─ ghép thành TAM GIÁC

  → GPU chạy vertex shader 3 lần (1 lần/đỉnh)
  → GPU rasterize tam giác → tạo ra hàng ngàn pixels
  → GPU chạy fragment shader cho MỖI pixel
  → Kết quả: tam giác gradient đỏ-xanh lá-xanh dương! 🎨
```

### 3.2 Các loại Buffer & Cách dùng

```typescript
// ═══════════════════════════════════════════════════
// CÁC LOẠI BUFFER — Khi nào dùng loại nào
// ═══════════════════════════════════════════════════

// ① ARRAY_BUFFER — dữ liệu vertex (vị trí, màu, UV)
const vbo = gl.createBuffer()!;
gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW);

// ② ELEMENT_ARRAY_BUFFER — dữ liệu index (tái sử dụng vertex)
// Không có index: hình vuông = 6 vertices (2 tam giác)
// Có index:    hình vuông = 4 vertices + 6 indices (tiết kiệm bộ nhớ)
const indices = new Uint16Array([0, 1, 2, 0, 2, 3]);
const ebo = gl.createBuffer()!;
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

// Vẽ với indices
gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

// ③ Gợi ý sử dụng:
// gl.STATIC_DRAW  — dữ liệu gán 1 lần, vẽ nhiều lần (geometry)
// gl.DYNAMIC_DRAW — dữ liệu thay đổi thường xuyên (particles, animations)
// gl.STREAM_DRAW  — dữ liệu gán 1 lần, vẽ 1 lần (hiệu ứng tức thời)

// ④ UNIFORM_BUFFER (WebGL2) — uniforms dùng chung giữa các shader
const ubo = gl.createBuffer()!;
gl.bindBuffer(gl.UNIFORM_BUFFER, ubo);
gl.bufferData(gl.UNIFORM_BUFFER, 64, gl.DYNAMIC_DRAW);
gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, ubo); // binding point 0
```

#### 📖 Giải thích Buffer cho người mới:

```
TAI SAO CẦN BUFFER?
═══════════════════════════════════════════════════════════════

  CPU và GPU có bộ nhớ RIÊNG NHAU:
  ┌──────────┐       ┌──────────┐
  │ CPU RAM  │ ───→ │ GPU VRAM │
  │ (JS và  │ copy  │ (shader  │
  │  data)   │       │  đọc được)│
  └──────────┘       └──────────┘

  Buffer = vùng nhớ trên GPU (VRAM).
  Bạn phải COPY data từ JS (CPU) sang buffer (GPU)
  để shader có thể đọc được.

  MÔ HÌNH "BIND" (quan trọng!):
  ───────────────────────────────
  WebGL dùng mô hình "state machine" (máy trạng thái):
  → Bạn không nói "ghi vào buffer-A"
  → Bạn nói "bind buffer-A" (chọn nó làm mục tiêu)
  → Rồi "bufferData(data)" (ghi vào mục tiêu hiện tại)
  → Giống mở file → ghi vào file → đóng file

  INDEX BUFFER — Tại sao cần?
  ───────────────────────────────
  Vẽ hình vuông cần 2 tam giác:

  KHÔNG có index (6 vertices, LÃNG PHÍ):
  △ Tam giác 1: đỉnh A, B, C
  △ Tam giác 2: đỉnh A, C, D    ← A và C LẶP LẠI!

  CÓ index (4 vertices + 6 indices, TIẾT KIỆM):
  Đỉnh: A(0), B(1), C(2), D(3)   ← chỉ 4 đỉnh
  Index: [0,1,2, 0,2,3]           ← GPU biết ghép thế nào
  → Tiết kiệm 33% bộ nhớ, càng nhiều đỉnh càng tiết kiệm!
```

### 3.3 VAO — Vertex Array Object (WebGL2)

```typescript
// ═══════════════════════════════════════════════════
// VAO — Lưu cấu hình attribute để tái sử dụng
// ═══════════════════════════════════════════════════
// Vấn đề: Thiết lập attributes mỗi frame = tốn kém
// Giải pháp: VAO ghi nhớ toàn bộ trạng thái attribute, phát lại bằng 1 lệnh duy nhất

const gl2 = gl as WebGL2RenderingContext;

// Tạo & bind VAO
const vao = gl2.createVertexArray()!;
gl2.bindVertexArray(vao);

// Thiết lập attributes MỘT LẦN (ghi vào VAO)
gl2.bindBuffer(gl2.ARRAY_BUFFER, vbo);
gl2.enableVertexAttribArray(posLoc);
gl2.vertexAttribPointer(posLoc, 2, gl2.FLOAT, false, STRIDE, 0);
gl2.enableVertexAttribArray(colorLoc);
gl2.vertexAttribPointer(colorLoc, 3, gl2.FLOAT, false, STRIDE, 8);
gl2.bindBuffer(gl2.ELEMENT_ARRAY_BUFFER, ebo);

gl2.bindVertexArray(null); // unbind

// Trong vòng lặp render: chỉ cần bind VAO, toàn bộ trạng thái được khôi phục
function render() {
  gl2.bindVertexArray(vao);
  gl2.drawElements(gl2.TRIANGLES, 6, gl2.UNSIGNED_SHORT, 0);
  gl2.bindVertexArray(null);
}
```

#### 📖 Giải thích VAO cho người mới:

```
VAO = "BOOKMARK" CỦA GPU:
═══════════════════════════════════════════════════════════════

  KHÔNG có VAO (làm lại mỗi frame):
  ──────────────────────────────
  Frame 1: bindBuffer → enableAttrib → attribPointer → draw
  Frame 2: bindBuffer → enableAttrib → attribPointer → draw
  Frame 3: bindBuffer → enableAttrib → attribPointer → draw
  → Lặp lại 6-7 lệnh mỗi frame = chậm!

  CÓ VAO (setup 1 lần, dùng mãi):
  ──────────────────────────────
  Setup: bindVAO → bindBuffer → enableAttrib → attribPointer
         → VAO ghi nhớ tất cả!

  Frame 1: bindVAO → draw   ← chỉ 2 lệnh!
  Frame 2: bindVAO → draw
  Frame 3: bindVAO → draw
  → Giống đánh dấu trang sách (bookmark)
     thay vì tìm lại từ đầu mỗi lần!
```

---

## 4. Shaders & GLSL

> **🎯 Học xong phần này, bạn sẽ biết:**
>
> - GLSL là gì và tại sao phải học ngôn ngữ riêng cho GPU
> - Sự khác nhau giữa attribute, uniform, varying
> - Cách dữ liệu chảy từ JavaScript → vertex shader → fragment shader

### Shader là gì? — Giải thích cho Beginner

```
SHADER = "CÔNG THỨC" CHẠY TRÊN GPU:
═══════════════════════════════════════════════════════════════

  💡 Tại sao cần viết code riêng cho GPU?
  → GPU không hiểu JavaScript!
  → GPU có ngôn ngữ riêng: GLSL (giống C nhưng đơn giản hơn)
  → Bạn viết GLSL trong JavaScript dưới dạng chuỗi string
    rồi gửi xuống GPU để compile & chạy

  CÓ 2 LOẠI SHADER BẠN PHẢI VIẾT:

  ┌─────────────────────────────────────────────────────────┐
  │ VERTEX SHADER — chạy 1 lần cho MỖI ĐỈNH (vertex)      │
  │                                                         │
  │   Đầu vào: tọa độ 3D của 1 đỉnh                       │
  │   Câu hỏi: "Đỉnh này nằm ở đâu trên màn hình?"       │
  │   Đầu ra:  gl_Position (vị trí pixel)                  │
  │                                                         │
  │   Ví dụ: tam giác có 3 đỉnh → chạy 3 lần              │
  ├─────────────────────────────────────────────────────────┤
  │ FRAGMENT SHADER — chạy 1 lần cho MỖI PIXEL             │
  │                                                         │
  │   Đầu vào: vị trí pixel (đã được nội suy từ vertices)  │
  │   Câu hỏi: "Pixel này có màu gì?"                      │
  │   Đầu ra:  gl_FragColor (màu RGBA)                      │
  │                                                         │
  │   Ví dụ: tam giác chiếm 10K pixels → chạy 10K lần     │
  └─────────────────────────────────────────────────────────┘

  CÁC LOẠI DỮ LIỆU ĐƯA VÀO SHADER:
  ┌─────────────────────────────────────────────────────────┐
  │ attribute (in) — "Mỗi đỉnh có giá trị KHÁC NHAU"      │
  │   Ví dụ: vị trí (x,y), màu (r,g,b) — mỗi đỉnh 1 bộ  │
  │   Giống: mỗi học sinh có TÊN khác nhau                │
  │                                                         │
  │ uniform — "TẤT CẢ đỉnh/pixel dùng CÙNG giá trị"       │
  │   Ví dụ: ma trận MVP, thời gian, màu nền              │
  │   Giống: cả lớp cùng 1 THẦY GIÁO                      │
  │                                                         │
  │ varying (out/in) — "Truyền từ vertex → fragment"       │
  │   Ví dụ: vertex shader tính màu → fragment shader nhận │
  │   GPU TỰ ĐỘNG nội suy giữa các đỉnh!                  │
  │   Giống: gradient màu — đỉnh đỏ + đỉnh xanh           │
  │          → pixels ở giữa tự chuyển màu dần             │
  └─────────────────────────────────────────────────────────┘
```

Dưới đây là **sơ đồ luồng dữ liệu** chi tiết giữa JavaScript và 2 shader:

```
LUỒNG DỮ LIỆU GLSL:
═══════════════════════════════════════════════════════════════

  JavaScript              Vertex Shader         Fragment Shader
  ┌──────────┐
  │ attribute│──→ in vec3 a_position ──→
  │ (per     │   in vec3 a_color    ──→ out vec3 v_color ──→ in vec3 v_color
  │  vertex) │                             (interpolated!)
  └──────────┘

  ┌──────────┐
  │ uniform  │──→ uniform mat4 u_mvp  ──→ uniform mat4 u_mvp
  │ (global) │   (same value for ALL      (same value for ALL
  └──────────┘    vertices)                 fragments)

  ┌──────────┐
  │ texture  │──────────────────────────→ uniform sampler2D u_tex
  │ (images) │                            texture(u_tex, v_uv)
  └──────────┘

  MÔ TẢ CÁC QUALIFIER:
  ┌─────────────────────────────────────────────────────────┐
  │ attribute/in  — Đầu vào từng vertex  (vị trí, màu)     │
  │ uniform       — Hằng số toàn cục   (ma trận MVP, t.gian)│
  │ varying/out   — Vertex → Fragment (nội suy)            │
  │ gl_Position   — Đầu ra có sẵn     (vị trí clip-space) │
  │ gl_FragColor  — Đầu ra có sẵn     (màu pixel)         │
  └─────────────────────────────────────────────────────────┘
```

### 4.1 Ngôn ngữ GLSL cơ bản

```glsl
// ═══════════════════════════════════════════════════
// GLSL — Kiểu dữ liệu & Hàm chính
// ═══════════════════════════════════════════════════

// --- TYPES ---
float f = 1.0;          // always use .0 (not int 1)
vec2  v2 = vec2(1.0, 2.0);
vec3  v3 = vec3(1.0, 0.0, 0.0);     // RGB or XYZ
vec4  v4 = vec4(v3, 1.0);            // RGBA or XYZW
mat4  m  = mat4(1.0);                // identity matrix

// Swizzling — truy cập thành phần theo thứ tự bất kỳ
vec4 color = vec4(1.0, 0.5, 0.0, 1.0);
vec3 rgb = color.rgb;       // (1.0, 0.5, 0.0)
vec2 rg  = color.rg;        // (1.0, 0.5)
vec3 bgr = color.bgr;       // reversed!
float r  = color.r;          // 1.0

// --- HÀM TOÁN HỌC ---
float d = length(v3);                // độ dài vector
float dt = dot(v3, v3);             // tích vô hướng
vec3 n = normalize(v3);             // vector đơn vị
vec3 c = cross(v3, vec3(0,1,0));    // tích có hướng
float x = mix(0.0, 1.0, 0.5);      // nội suy tuyến tính → 0.5
float s = smoothstep(0.0, 1.0, x); // nội suy mượt
float cl = clamp(x, 0.0, 1.0);     // giới hạn phạm vi

// --- MẪU THƯỜNG DÙNG ---

// Circle (SDF — Signed Distance Function)
float circle(vec2 uv, vec2 center, float radius) {
  return smoothstep(radius + 0.01, radius - 0.01, length(uv - center));
}

// Hiệu ứng đập (xung)
float pulse(float time, float speed) {
  return 0.5 + 0.5 * sin(time * speed);
}

// Mẫu lưới
float grid(vec2 uv, float size) {
  vec2 g = fract(uv * size);
  return step(0.95, max(g.x, g.y));
}
```

#### 📖 Giải thích GLSL cho người mới:

```
GLSL — NHỮNG ĐIỂM KHÁC VỚI JAVASCRIPT:
═══════════════════════════════════════════════════════════════

  ① KIỂU DỮ LIỆU — GLSL chặt hơn JS rất nhiều:
  ──────────────────────────────────────────────
  JS:   let x = 1;         → Tự đoán kiểu (number)
  GLSL: float x = 1.0;     → PHẢI khai báo kiểu (float)
        int i = 1;          → PHẢI phân biệt int vs float
        float y = 1;        → ❌ LỖI! Phải viết 1.0

  💡 Quy tắc: luôn viết 1.0 thay vì 1, 0.0 thay vì 0

  ② vec2, vec3, vec4 — VECTOR (nhóm số):
  ──────────────────────────────────────────────
  vec2 = 2 số → dùng cho tọa độ 2D (x, y) hoặc UV
  vec3 = 3 số → dùng cho vị trí 3D (x,y,z) hoặc màu (r,g,b)
  vec4 = 4 số → dùng cho vị trí clip (x,y,z,w) hoặc RGBA

  Ví dụ:
  vec3 red = vec3(1.0, 0.0, 0.0);   → Màu đỏ
  vec4 pos = vec4(red, 1.0);        → Ghép thành (1,0,0,1)

  ③ SWIZZLING — Đặc trưng RIÊNG của GLSL (JS không có!):
  ──────────────────────────────────────────────
  Cho phép truy cập + sắp xếp lại thành phần:

  vec4 color = vec4(1.0, 0.5, 0.0, 1.0);
                    │     │     │     │
                    r     g     b     a

  color.rgb  → vec3(1.0, 0.5, 0.0)    lấy 3 thành phần
  color.rg   → vec2(1.0, 0.5)         lấy 2 thành phần
  color.bgr  → vec3(0.0, 0.5, 1.0)    ĐẢO NGƯỢC thứ tự!
  color.r    → 1.0                     lấy 1 thành phần

  💡 Có thể dùng .xyzw (vị trí) hoặc .rgba (màu) — giống nhau
     vec3 pos; pos.x = pos.r (cùng giá trị, khác tên)

  ④ HÀM TOÁN HỌC QUAN TRỌNG:
  ──────────────────────────────────────────────
  mix(a, b, t)    → Pha trộn giữa a và b, t = tỷ lệ (0→1)
                    mix(đỏ, xanh, 0.5) = tím (nửa đỏ nửa xanh)

  smoothstep(a, b, x) → Chuyển đổi MƯỢT từ 0→1 trong khoảng [a,b]
                         Rất quan trọng! Dùng cho: viền mềm,
                         gradient, hiệu ứng xuất hiện/biến mất

  clamp(x, min, max)  → Giới hạn x trong [min, max]
                         clamp(1.5, 0, 1) = 1.0

  ⑤ MẪU HAY DÙNG — smoothstep tạo hình tròn:
  ──────────────────────────────────────────────
  smoothstep(radius + 0.01, radius - 0.01, distance)

  → distance > radius + 0.01  → trả về 0 (NGOÀI hình tròn)
  → distance < radius - 0.01  → trả về 1 (TRONG hình tròn)
  → distance ở giữa           → trả về 0→1 (VIỀN MỀM)
  → Kết quả: hình tròn với cạnh anti-aliased (không răng cưa)
```

### 4.2 Vertex Shader thực tế — Hệ thống Particle

```glsl
// ═══════════════════════════════════════════════════
// VERTEX SHADER — Particles hoạt hình (Sự kiện bảo mật)
// ═══════════════════════════════════════════════════
#version 300 es

in vec3 a_position;    // vị trí gốc của particle
in float a_size;       // kích thước particle
in float a_birth;      // thời điểm sinh ra
in vec3 a_velocity;    // hướng chuyển động
in vec4 a_color;       // RGBA

uniform mat4 u_mvp;
uniform float u_time;
uniform float u_maxAge;

out vec4 v_color;
out float v_age;

void main() {
  float age = u_time - a_birth;
  v_age = age / u_maxAge;

  // Xóa particle cũ (di chuyển ra ngoài màn hình)
  if (v_age > 1.0) {
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0); // clip
    gl_PointSize = 0.0;
    return;
  }

  // Hoạt hình vị trí
  vec3 pos = a_position + a_velocity * age;

  // Mờ dần theo tuổi thọ
  float alpha = 1.0 - v_age;
  v_color = vec4(a_color.rgb, a_color.a * alpha);

  // Kích thước thu nhỏ theo tuổi
  gl_PointSize = a_size * (1.0 - v_age * 0.5);

  gl_Position = u_mvp * vec4(pos, 1.0);
}
```

### 4.3 Fragment Shader thực tế — Hiệu ứng phát sáng

```glsl
// ═══════════════════════════════════════════════════
// FRAGMENT SHADER — Particles phát sáng với cạnh mềm
// ═══════════════════════════════════════════════════
#version 300 es
precision mediump float;

in vec4 v_color;
in float v_age;

out vec4 fragColor;

void main() {
  // gl_PointCoord: [0,1] trong point sprite
  vec2 uv = gl_PointCoord * 2.0 - 1.0; // chuyển sang [-1, 1]
  float dist = length(uv);

  // Hình tròn mềm với hiệu ứng phát sáng
  float alpha = smoothstep(1.0, 0.0, dist);

  // Thêm vòng phát sáng
  float glow = smoothstep(1.0, 0.3, dist) * 0.5;

  fragColor = vec4(v_color.rgb, v_color.a * (alpha + glow));

  // Loại bỏ fragment hoàn toàn trong suốt (tối ưu hiệu suất)
  if (fragColor.a < 0.01) discard;
}
```

---

## 5. Textures & Framebuffers

> **🎯 Học xong phần này, bạn sẽ biết:**
>
> - Texture là gì và tại sao cần texture
> - Framebuffer là gì và “render-to-texture” dùng để làm gì
> - Cách tải hình ảnh lên GPU và dùng trong shader

```
TEXTURE = "DÁN HÌNH" LÊN VẬT THỂ 3D:
═══════════════════════════════════════════════════════════════

  Hãy tưởng tượng bạn có 1 khối rubik trắng:
  → Không có texture: chỉ là hình 3D có màu đơn (nhàm chán)
  → Có texture: dán hình lên mỗi mặt → trông thực tế, chi tiết!

  Trong WebGL, texture = hình ảnh được tải lên GPU memory:
  ┌───────────────────────────────────────────────────┐
  │ ① Tải hình ảnh từ URL/file vào Image                    │
  │ ② Tạo texture trên GPU: gl.createTexture()            │
  │ ③ Upload pixels lên GPU: gl.texImage2D()              │
  │ ④ Trong shader: texture(u_tex, v_uv) → lấy màu pixel │
  └───────────────────────────────────────────────────┘

  FRAMEBUFFER = "Vẽ vào giấy nháp trước":
  → Thay vì vẽ thẳng lên màn hình, vẽ vào texture tạm
  → Rồi dùng texture đó để vẽ tiếp (hậu xử lý)
  → Ví dụ: vẽ cảnh → texture tạm → thêm bloom/blur → màn hình
```

### 5.1 Tải và sử dụng Texture

```typescript
// ═══════════════════════════════════════════════════
// TEXTURE — Tải hình ảnh và dùng trong shader
// ═══════════════════════════════════════════════════

function loadTexture(
  gl: WebGLRenderingContext,
  url: string,
): Promise<WebGLTexture> {
  return new Promise((resolve, reject) => {
    const texture = gl.createTexture()!;
    const image = new Image();
    image.crossOrigin = "anonymous";

    image.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, texture);

      // Tải hình ảnh lên GPU
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        image,
      );

      // Lọc (cách lấy mẫu giữa các pixel)
      gl.texParameteri(
        gl.TEXTURE_2D,
        gl.TEXTURE_MIN_FILTER,
        gl.LINEAR_MIPMAP_LINEAR,
      );
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

      // Wrapping (xử lý tại các cạnh)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      // Tạo mipmap cho thu nhỏ
      gl.generateMipmap(gl.TEXTURE_2D);

      resolve(texture);
    };
    image.onerror = reject;
    image.src = url;
  });
}

// Data Texture — mã hóa dữ liệu dưới dạng pixel (bảng tra cứu bên GPU)
function createDataTexture(
  gl: WebGL2RenderingContext,
  data: Float32Array,
  width: number,
) {
  const texture = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Lưu dữ liệu float trong texture (WebGL2: định dạng R32F)
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.R32F,
    width,
    data.length / width,
    0,
    gl.RED,
    gl.FLOAT,
    data,
  );

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  return texture;
}
```

### 5.2 Framebuffer — Kết xuất sang Texture (Hậu xử lý)

```typescript
// ═══════════════════════════════════════════════════
// FRAMEBUFFER — Kết xuất cảnh vào texture, rồi hậu xử lý
// ═══════════════════════════════════════════════════
// Trường hợp dùng: Hiệu ứng glow/bloom, motion blur, FXAA

function createFramebuffer(
  gl: WebGL2RenderingContext,
  width: number,
  height: number,
) {
  const fbo = gl.createFramebuffer()!;
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

  // Đính kèm màu (mục tiêu kết xuất)
  const colorTex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, colorTex);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA8,
    width,
    height,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    null,
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    colorTex,
    0,
  );

  // Đính kèm độ sâu
  const depthBuffer = gl.createRenderbuffer()!;
  gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, width, height);
  gl.framebufferRenderbuffer(
    gl.FRAMEBUFFER,
    gl.DEPTH_ATTACHMENT,
    gl.RENDERBUFFER,
    depthBuffer,
  );

  // Kiểm tra tính hoàn chỉnh
  if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
    throw new Error("Framebuffer không hoàn chỉnh");
  }

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return { fbo, colorTex, depthBuffer };
}

// Đường ống hậu xử lý:
// Lượt 1: Kết xuất cảnh → texture FBO
// Lượt 2: Vẽ quad toàn màn hình với texture FBO + shader hậu xử lý
function renderWithPostProcess(gl: WebGL2RenderingContext) {
  const { fbo, colorTex } = createFramebuffer(
    gl,
    gl.canvas.width,
    gl.canvas.height,
  );

  // Lượt 1: Cảnh → FBO
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  renderScene(gl); // kết xuất bình thường

  // Lượt 2: Quad toàn màn hình với shader bloom/blur
  gl.bindFramebuffer(gl.FRAMEBUFFER, null); // quay lại màn hình
  gl.useProgram(postProcessProgram);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, colorTex);
  gl.uniform1i(gl.getUniformLocation(postProcessProgram, "u_texture"), 0);
  drawFullscreenQuad(gl);
}
```

---

## 6. Instanced Rendering — 100K+ Vật thể

> **🎯 Học xong phần này, bạn sẽ biết:**
>
> - Tại sao vẽ 100K vật thể bình thường sẽ chậm
> - Instancing giải quyết vấn đề này như thế nào
> - Cách dùng `vertexAttribDivisor` và `drawArraysInstanced`

```
INSTANCING = "PHOTOCOPY" THÔNG MINH:
═══════════════════════════════════════════════════════════════

  Vấn đề: Bạn cần vẽ 100K hình tròn (mỗi cái khác vị trí, màu)

  KHÔNG có instancing (cách dở):
  → Vẽ hình tròn 1 → vẽ hình tròn 2 → ... → vẽ hình tròn 100K
  → 100K lệnh vẽ riêng biệt → CPU-GPU bận rộn giao tiếp
  → Giống: viết tay 100K lá thư giống nhau 😩

  CÓ instancing (cách thông minh):
  → Tạo 1 hình tròn mẫu + danh sách 100K (vị trí, màu)
  → Nói GPU: "photocopy hình mẫu 100K lần, mỗi bản đặt ở vị trí khác"
  → CHỈ 1 lệnh vẽ duy nhất! GPU làm tất cả song song
  → Giống: photo 1 mẫu, in 100K bản cùng lúc 🚀

  Kết quả:
  ┌──────────────────────────────────────────┐
  │ Không instancing: 100K draw calls → ~5fps │
  │ Có instancing:    1 draw call     → 60fps  │
  └──────────────────────────────────────────┘
```

Dưới đây là sơ đồ chi tiết so sánh có và không có instancing:

```
INSTANCED RENDERING — Kỹ thuật hiệu suất chính của WebGL:
═══════════════════════════════════════════════════════════════

  KHÔNG CÓ Instancing:
  ┌────────────────────────────────────────────────────────┐
  │ for (100K particles) {                                 │
  │   gl.bindBuffer(...)    // 100K lệnh bind              │
  │   gl.uniform*(...)      // 100K cập nhật uniform      │
  │   gl.drawArrays(...)    // 100K lệnh vẽ               │
  │ }                                                      │
  │ → 300K+ lệnh GL mỗi frame → CHẬM (~5fps)                │
  └────────────────────────────────────────────────────────┘

  CÓ Instancing:
  ┌────────────────────────────────────────────────────────┐
  │ // Tải toàn bộ dữ liệu instance trong MỘT buffer     │
  │ gl.bindBuffer(..., instanceBuffer)                     │
  │ gl.bufferData(..., allPositionsAndColors)              │
  │ gl.drawArraysInstanced(..., 100K)  // MỘT lệnh vẽ    │
  │ → ~3 lệnh GL mỗi frame → NHANH (60fps)                 │
  └────────────────────────────────────────────────────────┘
```

```typescript
// ═══════════════════════════════════════════════════
// INSTANCED RENDERING — 100K điểm mối đe dọa
// ═══════════════════════════════════════════════════

function renderInstancedPoints(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  points: Array<{
    x: number;
    y: number;
    z: number;
    r: number;
    g: number;
    b: number;
    size: number;
  }>,
) {
  // ① Geometry cơ bản (quad đơn vị — giống cho tất cả instance)
  const quadVerts = new Float32Array([
    -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, 0.5,
  ]);
  const quadVBO = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, quadVBO);
  gl.bufferData(gl.ARRAY_BUFFER, quadVerts, gl.STATIC_DRAW);

  const posLoc = gl.getAttribLocation(program, "a_quadPos");
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  // ② Dữ liệu instance (riêng biệt cho từng instance)
  const instanceData = new Float32Array(points.length * 7); // x,y,z,r,g,b,size
  points.forEach((p, i) => {
    const offset = i * 7;
    instanceData[offset] = p.x;
    instanceData[offset + 1] = p.y;
    instanceData[offset + 2] = p.z;
    instanceData[offset + 3] = p.r;
    instanceData[offset + 4] = p.g;
    instanceData[offset + 5] = p.b;
    instanceData[offset + 6] = p.size;
  });

  const instanceVBO = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, instanceVBO);
  gl.bufferData(gl.ARRAY_BUFFER, instanceData, gl.DYNAMIC_DRAW);

  // ③ Thiết lập instance attributes với DIVISOR = 1
  const F = Float32Array.BYTES_PER_ELEMENT;
  const instStride = 7 * F;

  const iPos = gl.getAttribLocation(program, "a_instancePos");
  gl.enableVertexAttribArray(iPos);
  gl.vertexAttribPointer(iPos, 3, gl.FLOAT, false, instStride, 0);
  gl.vertexAttribDivisor(iPos, 1); // ← MẤU CHỐT: tiến theo mỗi INSTANCE

  const iCol = gl.getAttribLocation(program, "a_instanceColor");
  gl.enableVertexAttribArray(iCol);
  gl.vertexAttribPointer(iCol, 3, gl.FLOAT, false, instStride, 3 * F);
  gl.vertexAttribDivisor(iCol, 1);

  const iSize = gl.getAttribLocation(program, "a_instanceSize");
  gl.enableVertexAttribArray(iSize);
  gl.vertexAttribPointer(iSize, 1, gl.FLOAT, false, instStride, 6 * F);
  gl.vertexAttribDivisor(iSize, 1);

  // ④ MỘT lệnh vẽ duy nhất cho TẤT CẢ 100K instance
  gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, points.length);
}
```

---

## 7. Kiến trúc Three.js

```
THREE.js — CÁC LỚP TRỪU TƯỢNG:
═══════════════════════════════════════════════════════════════

  Three.js bao bọc WebGL thô vào mô hình scene-graph:
  ┌───────────────────────────────────────────────────────┐
  │                                                       │
  │  Scene                                                │
  │  ├── Mesh (Geometry + Material)                       │
  │  │   ├── BoxGeometry / SphereGeometry / BufferGeometry│
  │  │   └── MeshBasicMaterial / MeshPhongMaterial / ...  │
  │  ├── Light (Ambient, Directional, Point)              │
  │  ├── Camera (Perspective / Orthographic)              │
  │  ├── Group (container chứa nhiều mesh)               │
  │  └── InstancedMesh (100K+ vật thể giống nhau)       │
  │                                                       │
  │  Renderer → WebGLRenderer                             │
  │  Controls → OrbitControls, MapControls                │
  │  Loaders  → TextureLoader, GLTFLoader                 │
  └───────────────────────────────────────────────────────┘

  So sánh WebGL thô vs THREE.js:
  ┌───────────────────────────────────────────────────────┐
  │ WebGL thô:    ~100 dòng cho 1 tam giác có màu         │
  │ Three.js:    ~15 dòng cho 1 tam giác có màu          │
  │                                                       │
  │ WebGL thô:    Kiểm soát hoàn toàn, hiệu suất tối đa     │
  │ Three.js:    Cài đặt dễ, mặc định tốt, mở rộng được   │
  └───────────────────────────────────────────────────────┘
```

### 7.1 Mẫu cài đặt cơ bản

```typescript
// ═══════════════════════════════════════════════════
// THREE.js — Cài đặt production với cleanup
// ═══════════════════════════════════════════════════
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

class ThreeScene {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private animationId: number = 0;

  constructor(container: HTMLElement) {
    const { clientWidth: w, clientHeight: h } = container;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x070b15);
    this.scene.fog = new THREE.Fog(0x070b15, 100, 500);

    // Camera
    this.camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
    this.camera.position.set(0, 50, 200);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance", // yêu cầu GPU rời
    });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // giới hạn 2x
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(this.renderer.domElement);

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;

    // Xử lý thay đổi kích thước
    const onResize = () => {
      const { clientWidth: w, clientHeight: h } = container;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    // Ánh sáng
    this.scene.add(new THREE.AmbientLight(0x404040, 2));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(100, 100, 100);
    this.scene.add(dirLight);
  }

  addMesh(mesh: THREE.Object3D) {
    this.scene.add(mesh);
  }

  start() {
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    };
    animate();
  }

  // QUAN TRỌNG: dọn dẹp đúng cách để ngăn rò rỉ bộ nhớ
  dispose() {
    cancelAnimationFrame(this.animationId);
    this.controls.dispose();
    this.renderer.dispose();

    // Duyệt và dọn dẹp tất cả geometries/materials/textures
    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });

    this.renderer.domElement.remove();
  }
}
```

### 7.2 InstancedMesh — 100K vật thể trong Three.js

```typescript
// ═══════════════════════════════════════════════════
// InstancedMesh — Lớp bọc Three.js cho instanced rendering
// ═══════════════════════════════════════════════════

function createThreatCloud(
  threats: Array<{ x: number; y: number; z: number; risk: string }>,
): THREE.InstancedMesh {
  const geo = new THREE.SphereGeometry(0.5, 8, 8);
  const mat = new THREE.MeshBasicMaterial();
  const mesh = new THREE.InstancedMesh(geo, mat, threats.length);

  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  const riskColors: Record<string, number> = {
    critical: 0xff1744,
    high: 0xff9100,
    medium: 0xffd600,
    low: 0x00e676,
    info: 0x90a4ae,
  };

  threats.forEach((t, i) => {
    dummy.position.set(t.x, t.y, t.z);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);

    color.setHex(riskColors[t.risk] ?? 0xffffff);
    mesh.setColorAt(i, color);
  });

  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

  return mesh;
}

// Cập nhật động (hoạt hình vị trí mỗi frame)
function updateThreatPositions(
  mesh: THREE.InstancedMesh,
  threats: Array<{ x: number; y: number; z: number }>,
  time: number,
) {
  const dummy = new THREE.Object3D();
  threats.forEach((t, i) => {
    dummy.position.set(
      t.x + Math.sin(time + i) * 0.5,
      t.y + Math.cos(time + i) * 0.3,
      t.z,
    );
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  });
  mesh.instanceMatrix.needsUpdate = true; // yêu cầu GPU tải lại
}
```

### 7.3 ShaderMaterial tùy chỉnh

```typescript
// ═══════════════════════════════════════════════════
// Shader tùy chỉnh trong Three.js — Cung tấn công với hiệu ứng phát sáng
// ═══════════════════════════════════════════════════

const attackArcMaterial = new THREE.ShaderMaterial({
  uniforms: {
    u_time: { value: 0 },
    u_color: { value: new THREE.Color(0xff1744) },
    u_opacity: { value: 0.8 },
  },
  vertexShader: `
    varying float vProgress;
    attribute float progress; // 0..1 along arc

    void main() {
      vProgress = progress;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float u_time;
    uniform vec3 u_color;
    uniform float u_opacity;
    varying float vProgress;

    void main() {
      // "Viên đạn" hoạt hình di chuyển dọc cung
      float bullet = smoothstep(0.0, 0.05, abs(vProgress - fract(u_time * 0.5)));
      float glow = 1.0 - bullet;

      // Mờ dần ở đầu/cuối cung
      float fade = smoothstep(0.0, 0.1, vProgress) * smoothstep(1.0, 0.9, vProgress);

      gl_FragColor = vec4(u_color, u_opacity * fade * (0.3 + glow * 0.7));
    }
  `,
  transparent: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});

// Cập nhật trong vòng lặp hoạt hình:
// attackArcMaterial.uniforms.u_time.value = clock.getElapsedTime();
```

---

## 8. React Three Fiber (R3F)

```
R3F — REACT + THREE.js:
═══════════════════════════════════════════════════════════════

  ƯU ĐIỂM CHÍNH:
  ┌───────────────────────────────────────────────────────┐
  │ ① Khai báo          — JSX thay vì mệnh lệnh          │
  │ ② Vòng đời React    — cleanup, effects, state       │
  │ ③ Theo component    — component 3D tái sử dụng      │
  │ ④ Suspense          — tải model/texture bất đồng bộ │
  │ ⑤ @react-three/drei — 100+ helper sẵn dùng          │
  │ ⑥ Hiệu suất         — tự động batching, cập nhật thông minh │
  └───────────────────────────────────────────────────────┘

  HỆ SINH THÁI:
  @react-three/fiber — Renderer lõi
  @react-three/drei  — Helpers (OrbitControls, Text, v.v.)
  @react-three/postprocessing — Hiệu ứng (bloom, SSAO)
  leva / dat.gui     — Điều khiển debug
```

### 8.1 Mẫu Component R3F

```tsx
// ═══════════════════════════════════════════════════
// R3F — Cảnh 3D khai báo
// ═══════════════════════════════════════════════════

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Text, Html } from "@react-three/drei";
import { useRef, useState, useMemo } from "react";
import * as THREE from "three";

// Điểm mối đe dọa với hoạt hình và tương tác hover
const ThreatNode: React.FC<{
  position: [number, number, number];
  risk: "critical" | "high" | "medium" | "low";
  label: string;
  onClick: () => void;
}> = ({ position, risk, label, onClick }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const color = useMemo(
    () =>
      ({
        critical: "#ff1744",
        high: "#ff9100",
        medium: "#ffd600",
        low: "#00e676",
      })[risk],
    [risk],
  );

  // Hoạt hình đập (pulse)
  useFrame(({ clock }) => {
    if (meshRef.current) {
      const s = 1 + Math.sin(clock.elapsedTime * 3) * 0.15;
      meshRef.current.scale.setScalar(hovered ? s * 1.3 : s);
    }
  });

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered ? 0.8 : 0.3}
        />
      </mesh>

      {/* Lớp phủ HTML — chỉ hiển khi hover */}
      {hovered && (
        <Html distanceFactor={10} style={{ pointerEvents: "none" }}>
          <div className="tooltip">{label}</div>
        </Html>
      )}
    </group>
  );
};

// Cảnh chính
const SecurityScene: React.FC<{ threats: ThreatData[] }> = ({ threats }) => (
  <Canvas camera={{ position: [0, 50, 200], fov: 45 }}>
    <ambientLight intensity={0.4} />
    <directionalLight position={[100, 100, 100]} />
    <OrbitControls enableDamping dampingFactor={0.05} />

    {threats.map((t) => (
      <ThreatNode
        key={t.id}
        position={[t.x, t.y, t.z]}
        risk={t.risk}
        label={t.label}
        onClick={() => console.log("Selected:", t.id)}
      />
    ))}
  </Canvas>
);
```

### 8.2 Hiệu suất R3F — InstancedMesh

```tsx
// ═══════════════════════════════════════════════════
// R3F — 100K particles với InstancedMesh
// ═══════════════════════════════════════════════════

const Particles: React.FC<{ count: number }> = ({ count }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Khởi tạo vị trí
  const particles = useMemo(() => {
    return Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * 200,
      y: (Math.random() - 0.5) * 200,
      z: (Math.random() - 0.5) * 200,
      speed: Math.random() * 0.5 + 0.1,
    }));
  }, [count]);

  // Hoạt hình mỗi frame (KHÔNG cập nhật state → không re-render)
  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.elapsedTime;

    particles.forEach((p, i) => {
      dummy.position.set(
        p.x + Math.sin(t * p.speed) * 10,
        p.y + Math.cos(t * p.speed) * 5,
        p.z,
      );
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[0.3, 6, 6]} />
      <meshBasicMaterial color="#00b0ff" transparent opacity={0.6} />
    </instancedMesh>
  );
};
```

---

## 9. Các mẫu trực quan hóa bảo mật

```
CÁC MẪU TRỰC QUAN HÓA BẢO MẬT:
═══════════════════════════════════════════════════════════════

  ① HỆ THỐNG PARTICLE — Luồng sự kiện thời gian thực
     → Mỗi particle = 1 sự kiện mạng
     → Màu = mức độ đe dọa, kích thước = mức độ nghiêm trọng
     → Vị trí = ánh xạ nguồn/đích
     → Dùng cho: Giám sát lưu lượng trực tiếp, trực quan hóa DDoS

  ② CẤU TRÚC MẠNG 3D
     → Nút = máy chủ/thiết bị, cạnh = kết nối
     → Bố cục hướng lực trong không gian 3D
     → Camera bay qua để điều hướng
     → Dùng cho: Bản đồ hạ tầng, hiển thị di chuyển ngang

  ③ BẢN ĐỒ MỐI ĐE DỌA 3D GLOBE
     → Hình cầu + tọa độ địa lý → vị trí 3D
     → Cung hoạt hình giữa nguồn/đích
     → Lớp phủ nhiệt cho mật độ
     → Dùng cho: Dashboard SOC toàn cầu, phân tích GeoIP

  ④ PHONG CẢNH DỮ LIỆU (Địa hình)
     → Chiều cao = giá trị chỉ số (mật độ mối đe dọa)
     → Màu = danh mục (gradient mức độ rủi ro)
     → Điều hướng camera qua "núi dữ liệu"
     → Dùng cho: Tổng quan phân tích log, phát hiện bất thường

  ⑤ KHỐI THỜI GIAN
     → X = thời gian, Y = IP nguồn, Z = port đích
     → Biểu đồ phân tán 3D của sự kiện
     → Dùng cho: Khám phá mẫu, phân tích theo thời gian
```

### 9.1 Hệ thống Particle cho luồng sự kiện

```typescript
// ═══════════════════════════════════════════════════
// THREE.js — Hệ thống particle cho sự kiện bảo mật trực tiếp
// ═══════════════════════════════════════════════════

class SecurityParticleSystem {
  private geometry: THREE.BufferGeometry;
  private material: THREE.PointsMaterial;
  private points: THREE.Points;
  private positions: Float32Array;
  private colors: Float32Array;
  private sizes: Float32Array;
  private ages: Float32Array;
  private maxParticles: number;
  private nextIndex: number = 0;

  constructor(scene: THREE.Scene, maxParticles = 100000) {
    this.maxParticles = maxParticles;
    this.positions = new Float32Array(maxParticles * 3);
    this.colors = new Float32Array(maxParticles * 3);
    this.sizes = new Float32Array(maxParticles);
    this.ages = new Float32Array(maxParticles);

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(this.positions, 3),
    );
    this.geometry.setAttribute(
      "color",
      new THREE.BufferAttribute(this.colors, 3),
    );
    this.geometry.setAttribute(
      "size",
      new THREE.BufferAttribute(this.sizes, 1),
    );

    this.material = new THREE.PointsMaterial({
      size: 2,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    this.points = new THREE.Points(this.geometry, this.material);
    scene.add(this.points);
  }

  // Thêm sự kiện mới (kiểu ring buffer)
  emit(x: number, y: number, z: number, risk: string) {
    const i = this.nextIndex % this.maxParticles;
    const i3 = i * 3;

    this.positions[i3] = x;
    this.positions[i3 + 1] = y;
    this.positions[i3 + 2] = z;

    const riskColor: Record<string, [number, number, number]> = {
      critical: [1, 0.09, 0.27],
      high: [1, 0.57, 0],
      medium: [1, 0.84, 0],
      low: [0, 0.9, 0.46],
    };
    const [r, g, b] = riskColor[risk] ?? [0.56, 0.64, 0.68];
    this.colors[i3] = r;
    this.colors[i3 + 1] = g;
    this.colors[i3 + 2] = b;

    this.sizes[i] = risk === "critical" ? 4 : 2;
    this.ages[i] = 0;

    this.nextIndex++;

    // Đánh dấu buffer cần tải lên GPU
    (this.geometry.attributes.position as THREE.BufferAttribute).needsUpdate =
      true;
    (this.geometry.attributes.color as THREE.BufferAttribute).needsUpdate =
      true;
    (this.geometry.attributes.size as THREE.BufferAttribute).needsUpdate = true;
  }

  // Gọi mỗi frame — làm mờ particle cũ
  update(deltaTime: number) {
    for (let i = 0; i < Math.min(this.nextIndex, this.maxParticles); i++) {
      this.ages[i] += deltaTime;
      const fade = Math.max(0, 1 - this.ages[i] / 10); // 10s lifetime
      this.colors[i * 3 + 0] *= fade > 0.01 ? 1 : 0; // kill dead particles
    }
    (this.geometry.attributes.color as THREE.BufferAttribute).needsUpdate =
      true;
  }
}
```

---

## 10. Tối ưu hiệu suất WebGL

```
DANH SÁCH KIỂM TRA HIỆU SUẤT:
═══════════════════════════════════════════════════════════════

  ① GIẢM THIỂU DRAW CALLS
  ┌───────────────────────────────────────────────────────┐
  │ • Dùng InstancedMesh cho geometry lặp lại              │
  │ • Gộp geometries tĩnh (BufferGeometryUtils.merge)     │
  │ • Texture Atlas (gộp nhiều texture thành 1)          │
  │ • Gộp materials (giảm chuyển đổi program)             │
  │ Mục tiêu: < 100 draw calls mỗi frame                   │
  └───────────────────────────────────────────────────────┘

  ② GIẢM TẢI GPU
  ┌───────────────────────────────────────────────────────┐
  │ • Level of Detail (LOD): ít polygon hơn khi xa        │
  │ • Frustum culling: bỏ qua vật ngoài màn hình         │
  │ • Occlusion culling: bỏ qua vật bị che               │
  │ • Giới hạn devicePixelRatio tối đa 2                   │
  │ • Texture lũy thừa 2 (256, 512, 1024, 2048)            │
  └───────────────────────────────────────────────────────┘

  ③ GIẢM ĐỒNG BỘ CPU-GPU
  ┌───────────────────────────────────────────────────────┐
  │ • bufferSubData cho cập nhật 1 phần (thay vì bufferData) │
  │ • Tránh gl.readPixels (buộc GPU đồng bộ)               │
  │ • Dùng VAO (Vertex Array Objects) — WebGL2             │
  │ • Giảm thiểu cập nhật uniform                          │
  │ • Dùng Typed Arrays (Float32Array, không phải JS arrays) │
  └───────────────────────────────────────────────────────┘

  ④ HIỆU SUẤT SHADER
  ┌───────────────────────────────────────────────────────┐
  │ • Tránh rẽ nhánh (if/else) trong fragment shaders      │
  │ • Dùng step/smoothstep thay cho điều kiện             │
  │ • Giảm tra cứu texture mỗi fragment                    │
  │ • Dùng `discard` hạn chế (phá vỡ early-Z)           │
  │ • lowp/mediump khi độ chính xác không cần thiết      │
  └───────────────────────────────────────────────────────┘

  ⑤ QUẢN LÝ BỘ NHỚ
  ┌───────────────────────────────────────────────────────┐
  │ • Dispose geometries, materials, textures khi dọn dẹp  │
  │ • Tái dùng BufferGeometry (cập nhật, kđừng tạo lại)  │
  │ • Object pool cho mesh tạo/hủy thường xuyên         │
  │ • Giám sát: renderer.info.memory                       │
  │ • Giám sát: renderer.info.render.calls                 │
  └───────────────────────────────────────────────────────┘
```

### 10.1 Giám sát hiệu suất

```typescript
// ═══════════════════════════════════════════════════
// Giám sát hiệu suất THREE.js
// ═══════════════════════════════════════════════════

function logPerformance(renderer: THREE.WebGLRenderer) {
  const info = renderer.info;
  console.table({
    "Draw calls": info.render.calls,
    Triangles: info.render.triangles,
    Points: info.render.points,
    Geometries: info.memory.geometries,
    Textures: info.memory.textures,
    Programs: info.programs?.length ?? 0,
  });
}

// Bộ đếm FPS (không cần thư viện ngoài)
class FPSCounter {
  private frames = 0;
  private lastTime = performance.now();
  fps = 0;

  tick() {
    this.frames++;
    const now = performance.now();
    if (now - this.lastTime >= 1000) {
      this.fps = this.frames;
      this.frames = 0;
      this.lastTime = now;
    }
  }
}

// Dùng trong vòng lặp hoạt hình:
// const fps = new FPSCounter();
// function animate() { fps.tick(); ... }
```

---

## 11. Lighting & Materials 🔴

```
LIGHTING MODELS — Từ cơ bản đến nâng cao:
═══════════════════════════════════════════════════════════════

  ① FLAT SHADING (đơn giản nhất):
     → Mỗi tam giác 1 màu duy nhất
     → Không có gradient, trông "low-poly"
     → Tính 1 lần per triangle

  ② PHONG LIGHTING MODEL (tiêu chuẩn):
     → 3 thành phần cộng lại:

     Ambient + Diffuse + Specular = Final Color

     ┌─────────────────────────────────────────────────┐
     │ AMBIENT (ánh sáng môi trường)                   │
     │ → Sáng đều khắp nơi, không có nguồn sáng cụ thể│
     │ → Giống ánh sáng trời mây                       │
     │ → ambient = ambientStrength × lightColor         │
     │                                                  │
     │ DIFFUSE (khuếch tán)                             │
     │ → Ánh sáng chiếu vào bề mặt → tán ra đều       │
     │ → Phụ thuộc góc giữa light và surface normal    │
     │ → diffuse = max(dot(normal, lightDir), 0)        │
     │ → Mặt hướng về nguồn sáng → sáng               │
     │ → Mặt quay đi → tối                             │
     │                                                  │
     │ SPECULAR (phản chiếu)                            │
     │ → Điểm sáng lấp lánh trên bề mặt bóng          │
     │ → Phụ thuộc góc nhìn (camera position)           │
     │ → specular = pow(max(dot(reflect, viewDir),0),n)│
     │ → n lớn → điểm sáng nhỏ, tập trung (kim loại)  │
     │ → n nhỏ → điểm sáng lớn, mờ (nhựa, gốm)       │
     └─────────────────────────────────────────────────┘

  ③ PBR — Physically Based Rendering (chuyên nghiệp):
     → Mô phỏng vật lý thật: kim loại, gỗ, da, nước
     → Dùng metalness + roughness thay vì specular
     → Three.js: MeshStandardMaterial (PBR mặc định)
```

### 11.1 Phong Lighting — Fragment Shader

```glsl
// ═══════════════════════════════════════════════════
// PHONG LIGHTING — Shader hoàn chỉnh
// ═══════════════════════════════════════════════════
#version 300 es
precision mediump float;

// Từ vertex shader (đã interpolate)
in vec3 v_normal;
in vec3 v_fragPos;    // vị trí fragment trong world space

// Uniforms từ JavaScript
uniform vec3 u_lightPos;      // vị trí nguồn sáng
uniform vec3 u_lightColor;    // màu nguồn sáng (thường trắng)
uniform vec3 u_viewPos;       // vị trí camera
uniform vec3 u_objectColor;   // màu vật thể

out vec4 fragColor;

void main() {
  // ① AMBIENT — ánh sáng nền
  float ambientStrength = 0.15;
  vec3 ambient = ambientStrength * u_lightColor;

  // ② DIFFUSE — khuếch tán
  vec3 normal = normalize(v_normal);
  vec3 lightDir = normalize(u_lightPos - v_fragPos);
  float diff = max(dot(normal, lightDir), 0.0);
  // max(0) vì dot < 0 = mặt sau, không nhận sáng
  vec3 diffuse = diff * u_lightColor;

  // ③ SPECULAR — phản chiếu
  float specularStrength = 0.5;
  float shininess = 32.0;  // n: độ bóng (32 = default)
  vec3 viewDir = normalize(u_viewPos - v_fragPos);
  vec3 reflectDir = reflect(-lightDir, normal);
  // reflect(): tính hướng phản chiếu ánh sáng
  float spec = pow(max(dot(viewDir, reflectDir), 0.0), shininess);
  vec3 specular = specularStrength * spec * u_lightColor;

  // KẾT HỢP
  vec3 result = (ambient + diffuse + specular) * u_objectColor;
  fragColor = vec4(result, 1.0);
}
```

### 11.2 Materials trong Three.js

```typescript
// ═══════════════════════════════════════════════════
// THREE.js MATERIALS — Từ đơn giản đến PBR
// ═══════════════════════════════════════════════════

// ① MeshBasicMaterial — KHÔNG bị ảnh hưởng bởi ánh sáng
// Dùng cho: wireframe, debug, flat UI elements
const basic = new THREE.MeshBasicMaterial({
  color: 0xff1744,
  wireframe: false, // true = chỉ hiện khung dây
});

// ② MeshPhongMaterial — Phong lighting (§11.1)
// Dùng cho: hầu hết mọi thứ, nhanh, đẹp đủ dùng
const phong = new THREE.MeshPhongMaterial({
  color: 0x1a2744, // màu diffuse
  specular: 0x2a3a5c, // màu specular highlight
  shininess: 30, // độ bóng (default 30)
  emissive: 0x0a1628, // tự phát sáng (không cần light)
});

// ③ MeshStandardMaterial — PBR (physically based)
// Dùng cho: chất lượng cao, realistic
const pbr = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  metalness: 0.8, // 0 = nhựa/gỗ, 1 = kim loại
  roughness: 0.2, // 0 = gương, 1 = matte/nhám
  envMap: cubeTexture, // texture phản chiếu môi trường
});

// ④ MeshPhysicalMaterial — PBR nâng cao
// Dùng cho: glass, clearcoat, subsurface scattering
const glass = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  metalness: 0,
  roughness: 0,
  transmission: 0.9, // trong suốt (glass effect)
  thickness: 1.5, // độ dày vật liệu
  ior: 1.5, // index of refraction (glass = 1.5)
  clearcoat: 1.0, // lớp bóng phủ ngoài
});

// ⑤ ShaderMaterial — Custom GLSL (full control)
// Dùng cho: hiệu ứng đặc biệt, §7.3 có ví dụ chi tiết
```

---

## 12. Animation & Interaction Patterns 🔴

```
ANIMATION PATTERNS:
═══════════════════════════════════════════════════════════════

  ① requestAnimationFrame LOOP
     → Vòng lặp render chạy ~60fps
     → GPU sync với monitor refresh rate
     → LUÔN dùng RAF, KHÔNG dùng setInterval

  ② DELTA TIME
     → Thời gian giữa 2 frames
     → Dùng để animation mượt trên mọi thiết bị
     → 60fps: dt ≈ 16ms, 30fps: dt ≈ 33ms
     → position += speed * deltaTime (không phụ thuộc fps)

  ③ EASING FUNCTIONS
     → Linear: đều đều (nhàm chán)
     → EaseIn: bắt đầu chậm → nhanh dần
     → EaseOut: bắt đầu nhanh → chậm dần
     → EaseInOut: chậm → nhanh → chậm (tự nhiên nhất)

  ④ TWEENING
     → Chuyển từ giá trị A → B trong thời gian T
     → Dùng easing để điều khiển tốc độ chuyển đổi
```

### 12.1 Animation Loop Pattern

```typescript
// ═══════════════════════════════════════════════════
// ANIMATION LOOP — Production pattern
// ═══════════════════════════════════════════════════

class AnimationLoop {
  private animationId: number = 0;
  private lastTime: number = 0;
  private isRunning: boolean = false;

  constructor(
    private onUpdate: (deltaTime: number, elapsedTime: number) => void,
    private onRender: () => void,
  ) {}

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.tick(this.lastTime);
  }

  private tick = (currentTime: number) => {
    this.animationId = requestAnimationFrame(this.tick);

    // Delta time in seconds
    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    // Cap delta time (tab switch = huge dt)
    const clampedDt = Math.min(deltaTime, 0.1); // max 100ms

    this.onUpdate(clampedDt, currentTime / 1000);
    this.onRender();
  };

  stop() {
    this.isRunning = false;
    cancelAnimationFrame(this.animationId);
  }
}

// Usage:
// const loop = new AnimationLoop(
//   (dt, t) => { object.rotation.y += 1.0 * dt; }, // update
//   () => { renderer.render(scene, camera); },       // render
// );
// loop.start();
```

### 12.2 Easing Functions

```typescript
// ═══════════════════════════════════════════════════
// EASING — Hàm điều khiển tốc độ animation
// ═══════════════════════════════════════════════════
// t = progress (0 → 1), returns eased value (0 → 1)

const Easing = {
  // Linear — đều (mặc định, nhưng không tự nhiên)
  linear: (t: number) => t,

  // Quadratic — tự nhiên, phổ biến nhất
  easeInQuad: (t: number) => t * t,
  easeOutQuad: (t: number) => t * (2 - t),
  easeInOutQuad: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),

  // Cubic — mạnh hơn quadratic
  easeInCubic: (t: number) => t * t * t,
  easeOutCubic: (t: number) => --t * t * t + 1,
  easeInOutCubic: (t: number) =>
    t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,

  // Elastic — nảy bật (đẹp cho UI)
  easeOutElastic: (t: number) =>
    t === 0 || t === 1
      ? t
      : Math.pow(2, -10 * t) * Math.sin(((t - 0.075) * (2 * Math.PI)) / 0.3) +
        1,

  // Back — quá đà rồi quay lại (overshooting)
  easeOutBack: (t: number) => {
    const s = 1.70158;
    return (t -= 1) * t * ((s + 1) * t + s) + 1;
  },

  // Bounce — nảy như bóng
  easeOutBounce: (t: number) => {
    if (t < 1 / 2.75) return 7.5625 * t * t;
    if (t < 2 / 2.75) return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
    if (t < 2.5 / 2.75) return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
    return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
  },
};

// Lerp (Linear Interpolation) + Easing
function lerp(
  from: number,
  to: number,
  t: number,
  ease = Easing.linear,
): number {
  return from + (to - from) * ease(t);
}

// Vector lerp
function lerpVec3(a: Vec3, b: Vec3, t: number, ease = Easing.linear): Vec3 {
  const et = ease(t);
  return [
    a[0] + (b[0] - a[0]) * et,
    a[1] + (b[1] - a[1]) * et,
    a[2] + (b[2] - a[2]) * et,
  ];
}
```

### 12.3 Raycasting — Click Detection in 3D

```typescript
// ═══════════════════════════════════════════════════
// RAYCASTING — Bắn tia từ mouse vào 3D scene
// ═══════════════════════════════════════════════════
// Dùng khi: click/hover vào object trong 3D
// Concept: mouse click → tia từ camera → giao object nào?

import * as THREE from "three";

class Raycaster3D {
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private scene: THREE.Scene;
  private camera: THREE.Camera;

  constructor(
    scene: THREE.Scene,
    camera: THREE.Camera,
    canvas: HTMLCanvasElement,
  ) {
    this.scene = scene;
    this.camera = camera;

    canvas.addEventListener("click", (event) => {
      // ① Chuyển mouse pixel → NDC (-1..1)
      const rect = canvas.getBoundingClientRect();
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      // ② Bắn tia từ camera qua vị trí mouse
      this.raycaster.setFromCamera(this.mouse, this.camera);

      // ③ Tìm objects bị tia đâm trúng
      const intersects = this.raycaster.intersectObjects(
        this.scene.children,
        true, // recursive: check children
      );

      if (intersects.length > 0) {
        const hit = intersects[0]; // closest object
        console.log("Clicked:", hit.object.name);
        console.log("Point:", hit.point); // 3D intersection point
        console.log("Distance:", hit.distance); // camera → hit
        console.log("Face:", hit.face); // which triangle
      }
    });
  }
}

// Raycasting cho InstancedMesh:
// intersects[0].instanceId → index của instance bị click
// Rất hữu ích cho 100K threat points: biết click vào threat nào
```

### 12.4 Camera Controls & Fly-Through

```typescript
// ═══════════════════════════════════════════════════
// CAMERA PATTERNS — Different controls for different UX
// ═══════════════════════════════════════════════════

// ① OrbitControls — Xoay quanh target (phổ biến nhất)
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
const orbit = new OrbitControls(camera, renderer.domElement);
orbit.target.set(0, 0, 0); // xoay quanh gốc
orbit.enableDamping = true; // quán tính khi xoay
orbit.dampingFactor = 0.05;
orbit.minDistance = 10; // zoom tối thiểu
orbit.maxDistance = 500; // zoom tối đa
orbit.maxPolarAngle = Math.PI / 2; // không xoay dưới mặt đất
orbit.autoRotate = true; // tự xoay khi idle
orbit.autoRotateSpeed = 0.5;

// ② Smooth camera transition (bay đến vị trí mới)
function flyTo(
  camera: THREE.PerspectiveCamera,
  targetPos: THREE.Vector3,
  targetLookAt: THREE.Vector3,
  duration: number = 2,
) {
  const startPos = camera.position.clone();
  const startTime = performance.now();

  function animate() {
    const elapsed = (performance.now() - startTime) / 1000;
    const t = Math.min(elapsed / duration, 1);
    const eased = Easing.easeInOutCubic(t);

    camera.position.lerpVectors(startPos, targetPos, eased);
    camera.lookAt(targetLookAt);

    if (t < 1) requestAnimationFrame(animate);
  }
  animate();
}

// Ví dụ: click threat → fly camera đến threat đó
// flyTo(camera, new THREE.Vector3(threatX, threatY + 20, threatZ + 30),
//       new THREE.Vector3(threatX, threatY, threatZ));
```

---

## 13. Advanced GLSL Techniques 🔴

### 13.1 Noise Functions — Tạo hiệu ứng tự nhiên

```glsl
// ═══════════════════════════════════════════════════
// SIMPLEX NOISE — Shader-based random patterns
// ═══════════════════════════════════════════════════
// Dùng cho: terrain, clouds, fire, organic effects

// Simple 2D hash function
vec2 hash22(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)),
           dot(p, vec2(269.5, 183.3)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453);
}

// Value noise
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);

  // Smooth interpolation (Hermite curve)
  vec2 u = f * f * (3.0 - 2.0 * f); // smoothstep

  // 4 corners
  float a = dot(hash22(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0));
  float b = dot(hash22(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0));
  float c = dot(hash22(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0));
  float d = dot(hash22(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0));

  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

// Fractal Brownian Motion — multiple noise layers
float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;
  for (int i = 0; i < 6; i++) {
    value += amplitude * noise(p * frequency);
    amplitude *= 0.5;
    frequency *= 2.0;
  }
  return value;
}

// Usage in fragment shader:
// float n = fbm(v_uv * 5.0 + u_time * 0.3);
// → Cloud-like pattern that moves over time
```

### 13.2 SDF — Signed Distance Functions

```glsl
// ═══════════════════════════════════════════════════
// SDF — Hình dạng bằng toán, không cần geometry
// ═══════════════════════════════════════════════════
// Concept: mỗi pixel tính khoảng cách đến hình
// distance < 0 → bên trong, > 0 → bên ngoài

// Circle
float sdCircle(vec2 p, float r) {
  return length(p) - r;
}

// Rounded rectangle
float sdRoundRect(vec2 p, vec2 size, float r) {
  vec2 d = abs(p) - size + r;
  return length(max(d, 0.0)) - r;
}

// Ring (vòng tròn rỗng)
float sdRing(vec2 p, float outerR, float innerR) {
  return abs(length(p) - outerR) - innerR;
}

// Triangle
float sdTriangle(vec2 p, float r) {
  const float k = sqrt(3.0);
  p.x = abs(p.x) - r;
  p.y = p.y + r / k;
  if (p.x + k * p.y > 0.0) p = vec2(p.x - k * p.y, -k * p.x - p.y) / 2.0;
  p.x -= clamp(p.x, -2.0 * r, 0.0);
  return -length(p) * sign(p.y);
}

// SDF Operations — combine shapes
float opUnion(float d1, float d2) { return min(d1, d2); }
float opSubtract(float d1, float d2) { return max(-d1, d2); }
float opIntersect(float d1, float d2) { return max(d1, d2); }
float opSmoothUnion(float d1, float d2, float k) {
  float h = clamp(0.5 + 0.5 * (d2 - d1) / k, 0.0, 1.0);
  return mix(d2, d1, h) - k * h * (1.0 - h);
}

// Kết xuất SDF → pixel với cạnh kháng răng cưa
vec4 renderSDF(float dist, vec3 fillColor) {
  float alpha = 1.0 - smoothstep(-0.01, 0.01, dist);
  return vec4(fillColor, alpha);
}

// Sử dụng: chỉ báo mối đe dọa với SDF
void main() {
  vec2 uv = gl_PointCoord * 2.0 - 1.0;

  // Vòng với hiệu ứng đập
  float ring = sdRing(uv, 0.6 + sin(u_time * 3.0) * 0.1, 0.05);
  vec4 ringColor = renderSDF(ring, vec3(1.0, 0.09, 0.27)); // red

  // Hình tròn bên trong
  float circle = sdCircle(uv, 0.3);
  vec4 circleColor = renderSDF(circle, vec3(1.0, 0.2, 0.35));

  // Kết hợp
  fragColor = mix(circleColor, ringColor, ringColor.a);
}
```

### 13.3 Color Manipulation

```glsl
// ═══════════════════════════════════════════════════
// COLOR TECHNIQUES — Phổ biến trong shader
// ═══════════════════════════════════════════════════

// RGB ↔ HSV conversion
vec3 rgb2hsv(vec3 c) {
  vec4 K = vec4(0.0, -1.0/3.0, 2.0/3.0, -1.0);
  vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
  float d = q.x - min(q.w, q.y);
  float e = 1.0e-10;
  return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

// Heatmap color (value 0→1 → blue→cyan→green→yellow→red)
vec3 heatmap(float t) {
  t = clamp(t, 0.0, 1.0);
  return vec3(
    smoothstep(0.5, 0.8, t),                          // R
    smoothstep(0.0, 0.5, t) - smoothstep(0.5, 1.0, t), // G
    1.0 - smoothstep(0.0, 0.5, t)                      // B
  );
}
// Dùng cho: threat density maps, heatmaps

// Viridis-like colormap (perceptually uniform — tốt cho data viz)
vec3 viridis(float t) {
  const vec3 c0 = vec3(0.267, 0.004, 0.329);
  const vec3 c1 = vec3(0.283, 0.141, 0.458);
  const vec3 c2 = vec3(0.236, 0.287, 0.510);
  const vec3 c3 = vec3(0.164, 0.428, 0.475);
  const vec3 c4 = vec3(0.127, 0.566, 0.405);
  const vec3 c5 = vec3(0.341, 0.686, 0.293);
  const vec3 c6 = vec3(0.696, 0.786, 0.200);
  const vec3 c7 = vec3(0.993, 0.906, 0.144);
  t = clamp(t, 0.0, 1.0) * 7.0;
  int i = int(floor(t));
  float f = fract(t);
  // ... simplified lookup
  if (i == 0) return mix(c0, c1, f);
  if (i == 1) return mix(c1, c2, f);
  if (i == 2) return mix(c2, c3, f);
  if (i == 3) return mix(c3, c4, f);
  if (i == 4) return mix(c4, c5, f);
  if (i == 5) return mix(c5, c6, f);
  return mix(c6, c7, f);
}
```

---

## 14. WebGL2 & WebGPU

```
So sánh WebGL1 vs WebGL2 vs WebGPU:
═══════════════════════════════════════════════════════════════

  ┌─────────────┬────────────┬────────────┬───────────────┐
  │ Tính năng    │ WebGL1     │ WebGL2     │ WebGPU        │
  ├─────────────┼────────────┼────────────┼───────────────┤
  │ Dựa trên    │ OpenGL ES  │ OpenGL ES  │ Vulkan/Metal/ │
  │             │ 2.0        │ 3.0        │ D3D12         │
  ├─────────────┼────────────┼────────────┼───────────────┤
  │ VAO         │ Extension  │ ✅ Tích hợp  │ N/A           │
  │ Instancing  │ Extension  │ ✅ Tích hợp  │ ✅             │
  │ MRT         │ Extension  │ ✅ Tích hợp  │ ✅             │
  │ 3D Textures │ ❌          │ ✅          │ ✅             │
  │ UBO         │ ❌          │ ✅          │ ✅ (Bind Grp)  │
  │ Compute     │ ❌          │ ❌          │ ✅ Compute     │
  │ Đa luồng    │ ❌          │ ❌          │ ✅             │
  ├─────────────┼────────────┼────────────┼───────────────┤
  │ Hỗ trợ      │ ~97%       │ ~95%       │ ~75% (2025)   │
  │ Trình duyệt  │            │            │               │
  ├─────────────┼────────────┼────────────┼───────────────┤
  │ Dùng khi    │ Dự phòng   │ Lựa chọn  │ Tương lai /    │
  │             │ cũ         │ mặc định   │ Tính toán nặng │
  └─────────────┴────────────┴────────────┴───────────────┘

  ƯU ĐIỂM CHÍNH CỦA WebGPU:
  → Compute shaders (điện toán trên GPU không cần hack)
  → Chi phí CPU thấp hơn (command buffers)
  → Quản lý bộ nhớ GPU tường minh
  → Kết xuất đa luồng
  → Ngôn ngữ shader hiện đại (WGSL)
```

---

## 15. Câu hỏi phỏng vấn 🔴

```
CÂU HỎI PHỎNG VẤN WEBGL:
═══════════════════════════════════════════════════════════════

Q1: Giải thích rendering pipeline của WebGL.

A:  Dữ liệu đi qua 5 giai đoạn:
    ① Vertex Shader — chạy cho mỗi vertex, biến đổi 3D→clip space
       qua ma trận MVP (Model × View × Projection)
    ② Primitive Assembly — gộp vertices thành tam giác
    ③ Rasterization — chuyển tam giác thành fragments (pixels),
       nội suy giá trị varying giữa các vertices
    ④ Fragment Shader — chạy cho mỗi pixel, tính màu cuối cùng
    ⑤ Output Merging — kiểm tra độ sâu, hòa trộn, ghi vào framebuffer
    MẤU CHỐT: shaders chạy trên GPU SONG SONG (1M pixels = 1M instances
         của fragment shader chạy đồng thời)

Q2: Làm sao để render 100K điểm dữ liệu ở 60fps?

A:  Dùng instanced rendering:
    ① Tạo MỘT geometry nền (sphere/quad nhỏ)
    ② Đóng gói toàn bộ dữ liệu instance vào Float32Array: vị trí, màu,
       kích thước (7 floats mỗi instance = ~2.8MB cho 100K)
    ③ Tải lên như ARRAY_BUFFER với gl.DYNAMIC_DRAW
    ④ Dùng vertexAttribDivisor(loc, 1) để tiến theo mỗi instance
    ⑤ MỘT lệnh vẽ: gl.drawArraysInstanced(gl.TRIANGLES, 0, n, 100K)
    Kết quả: 100K vật thể với ~3 lệnh GL thay vì 300K+.
    Trong Three.js: dùng THREE.InstancedMesh.
    Trong R3F: <instancedMesh args={[geo, mat, 100000]}>

Q3: Khi nào chọn Canvas 2D vs WebGL vs SVG?

A:  Quyết định dựa trên lượng dữ liệu và tương tác:
    → SVG: < 1K phần tử, cần DOM events/CSS/accessibility
    → Canvas 2D: 1K–50K phần tử, đủ cho hầu hết dashboards
    → WebGL: 50K–1M phần tử, cần xử lý song song GPU
    → WebGPU: > 1M phần tử, cần compute shaders

    Với dashboard bảo mật có 100K điểm mối đe dọa streaming
    thời gian thực: WebGL với instanced rendering + ring buffer
    cho quản lý dữ liệu + RAF batching cho cập nhật mượt.

Q4: Shader là gì? Giải thích vertex shader vs fragment shader.

A:  Shader là các chương trình nhỏ chạy trên GPU:
    → Vertex Shader: chạy 1 lần mỗi vertex, xác định vị trí
      hiển thị (ĐÂU) (biến đổi vị trí qua ma trận MVP)
    → Fragment Shader: chạy 1 lần mỗi pixel, xác định màu
      (MÀU GÌ) cho mỗi pixel (ánh sáng, textures, hiệu ứng)
    Chúng giao tiếp qua biến varying/out được tự động
    nội suy giữa các vertices bởi GPU trong quá trình
    rasterization.

Q5: Bạn xử lý quản lý bộ nhớ trong WebGL/Three.js như thế nào?

A:  Vấn đề quan trọng — WebGL KHÔNG có garbage collect:
    ① Dispose geometries: geometry.dispose()
    ② Dispose materials: material.dispose()
    ③ Dispose textures: texture.dispose()
    ④ Hủy animation frame khi unmount
    ⑤ Gỡ event listeners (resize, mouse)
    ⑥ Giám sát: renderer.info.memory (geometries, textures)
    Trong React: dọn dẹp trong hàm return của useEffect.
    Lỗi rò rỉ thường gặp: tạo mới geometry/material mỗi frame
    thay vì cập nhật buffer hiện có.

Q6: Giải thích sự khác nhau giữa WebGL1 và WebGL2.

A:  WebGL2 (OpenGL ES 3.0) thêm các tính năng quan trọng:
    → VAO (Vertex Array Objects): lưu cấu hình attribute
    → Instancing tích hợp: drawArraysInstanced
    → Uniform Buffer Objects (UBO): khối uniform dùng chung
    → 3D Textures: dữ liệu thể tích
    → Multiple Render Targets (MRT): deferred rendering
    → Texture không cần lũy thừa 2
    → GLSL #version 300 es: in/out đúng cách, độ chính xác tốt hơn
    Hỗ trợ trình duyệt: ~95%, luôn thử WebGL2 trước với
    WebGL1 dự phòng cho tương thích.

Q7: Bạn sẽ tích hợp bản đồ mối đe dọa 3D globe vào React như thế nào?

A:  Hai cách tiếp cận:
    ① Mệnh lệnh (Three.js + useRef):
       → Thiết lập scene/camera/renderer trong useEffect
       → Cập nhật qua refs (không re-render React)
       → Kiểm soát hoàn toàn, tốt nhất cho cảnh phức tạp
    ② Khai báo (React Three Fiber):
       → <Canvas><Sphere><meshPhongMaterial /></Canvas>
       → useFrame cho hoạt hình (không cập nhật state)
       → Theo component, quen thuộc với React patterns
    Cả hai: chuyển lat/lng → 3D qua tọa độ cầu:
       phi = (90 - lat) * PI/180
       theta = (lng + 180) * PI/180
       x = -r * sin(phi) * cos(theta)
       y = r * cos(phi)
       z = r * sin(phi) * sin(theta)

Q8: Giải thích mô hình ánh sáng Phong và khi nào dùng PBR thay thế.

A:  Phong = 3 thành phần: Ambient + Diffuse + Specular
    → Ambient: chiếu sáng nền không đổi
    → Diffuse: dot(normal, lightDir) — bề mặt hướng về ánh sáng
    → Specular: pow(dot(viewDir, reflectDir), shininess)
    Nhanh, đủ cho hầu hết trực quan hóa thời gian thực.

    PBR (Physically Based Rendering):
    → Dùng metalness + roughness thay vì specular
    → Bảo toàn năng lượng: phản xạ + hấp thụ = 1
    → Lý thuyết microfacet: bề mặt như các gương siêu nhỏ
    → Chân thực hơn nhưng tốn kém hơn
    Dùng PBR khi: trực quan hóa sản phẩm, cảnh chân thực
    Dùng Phong khi: data viz, hệ thống particle, cần hiệu suất

Q9: Bạn hiện thực phát hiện click trên vật thể 3D như thế nào?

A:  Raycasting: bắn tia từ camera qua vị trí chuột
    ① Chuyển chuột (px) → NDC: x = (mx/w)*2-1, y = -(my/h)*2+1
    ② Tạo tia từ camera: raycaster.setFromCamera(ndc, camera)
    ③ Kiểm tra giao: raycaster.intersectObjects(scene.children)
    → Trả về: object, point, distance, face, instanceId
    → Với InstancedMesh: intersects[0].instanceId = instance nào
    Hiệu suất: dùng bounding sphere/box trước kiểm tra tam giác

Q10: Bạn debug shader như thế nào?

A:  GLSL KHÔNG có console.log. Các kỹ thuật debug:
    ① Xuất giá trị dưới dạng màu: fragColor = vec4(v_normal, 1.0)
       → Đỏ=X, Xanh lá=Y, Xanh dương=Z, kiểm tra hướng trực quan
    ② Kiểm tra lỗi compile: gl.getShaderInfoLog(shader)
    ③ Render giá trị trung gian: fragColor = vec4(vec3(depth), 1.0)
    ④ Dùng công cụ trình duyệt: Spector.js, WebGL Inspector
    ⑤ Đơn giản hóa: giảm shader tối thiểu, thêm lại code dần dần
    ⑥ Kiểm tra độ chính xác: mediump vs highp có thể gây artifact trên mobile

Q11: Bạn xử lý hoạt hình độc lập với tốc độ khình như thế nào?

A:  Dùng mẫu delta time:
    → Theo dõi thời gian giữa các frame: dt = (now - lastTime) / 1000
    → Nhân tất cả chuyển động với dt: pos += speed * dt
    → 60fps: dt ≈ 0.016s, 30fps: dt ≈ 0.033s
    → Vật di chuyển CÙNG QUÃNG ĐƯỜNG bất kể tốc độ frame
    → Giới hạn dt để tránh nhảy lớn: Math.min(dt, 0.1)
    → Lớp Clock của Three.js có sẵn getDelta()

Q12: Bạn làm cho nội dung WebGL có thể truy cập được như thế nào?

A:  <canvas> WebGL không đọc được bởi screen readers. Giải pháp:
    ① Thêm aria-label vào phần tử canvas
    ② Thêm lớp phủ DOM ẩn với mô tả văn bản
    ③ Điều hướng bàn phím: lắng nghe key events, di chuyển camera
    ④ An toàn cho mù màu: dùng hình dạng + màu (không chỉ màu)
    ⑤ Động tác giảm: tôn trọng prefers-reduced-motion media query
    ⑥ Chế độ tương phản cao: cung cấp fallback 2D thay thế
    ⑦ Thông báo screen reader: cập nhật vùng aria-live
       khi người dùng tương tác với vật thể 3D
```

---

## Bảng tóm tắt

| Phần | Mức độ | Chủ đề               | Điểm chính                                  |
| ---- | ------ | -------------------- | ------------------------------------------- |
| §0   | 🟢     | Điều kiện tiên quyết | Canvas, GPU vs CPU, tọa độ, vectors         |
| §1   | 🟢     | Tổng quan            | SVG < 1K, Canvas 1K-50K, WebGL 50K-1M       |
| §2   | 🟡     | GPU Pipeline         | Vertex Shader → Rasterize → Fragment Shader |
| §3   | 🟡     | WebGL API            | Buffer → Shader → Program → Draw            |
| §4   | 🟡     | GLSL                 | vec4, swizzling, smoothstep, qualifiers     |
| §5   | 🟡     | Textures             | Data textures, FBO hậu xử lý                |
| §6   | 🟡     | Instancing           | 100K vật thể = 1 draw call                  |
| §7   | 🟠     | Three.js             | Scene graph, InstancedMesh, dispose         |
| §8   | 🟠     | R3F                  | 3D khai báo, useFrame, không re-renders     |
| §9   | 🟠     | Trực quan bảo mật    | Particles, topology, globe, terrain         |
| §10  | 🟠     | Hiệu suất            | < 100 draw calls, LOD, VAO, typed arrays    |
| §11  | 🔴     | Ánh sáng             | Phong (A+D+S), PBR (metalness+roughness)    |
| §12  | 🔴     | Hoạt hình            | Vòng RAF, delta time, easing, raycasting    |
| §13  | 🔴     | GLSL nâng cao        | Noise (fbm), hình SDF, không gian màu       |
| §14  | 🔴     | WebGL2/GPU           | WebGL2 mặc định, WebGPU cho compute         |
| §15  | 🔴     | Phỏng vấn            | 12 Q&A bao quát tất cả chủ đề               |

---

## 🗺️ Lộ trình học — Từ người mới đến chuyên gia

```
THỨ TỰ HỌC ĐƯỢC KHUẤN NGHỈ:
═══════════════════════════════════════════════════════════════

  WEEK 1-2: Foundation 🟢
  ├── §0 Prerequisites: Canvas, GPU, toán cơ bản
  ├── §1 Overview: biết khi nào dùng WebGL
  ├── Bài tập: vẽ shapes bằng Canvas 2D
  └── Bài tập: setup WebGL context, clear color

  WEEK 3-4: Core WebGL 🟡
  ├── §2 GPU Pipeline: hiểu data flow
  ├── §3 WebGL API: vẽ tam giác đầu tiên!
  ├── §4 GLSL: viết shader cơ bản
  ├── Bài tập: vẽ hình vuông, hình tròn bằng shader
  └── Bài tập: uniform animation (đổi màu theo thời gian)

  WEEK 5-6: Intermediate 🟡
  ├── §5 Textures: load ảnh, render-to-texture
  ├── §6 Instancing: 100K particles
  ├── Bài tập: particle system cơ bản
  └── Bài tập: texture mapping lên cube

  WEEK 7-8: Frameworks 🟠
  ├── §7 Three.js: scene graph, materials
  ├── §8 R3F: declarative 3D trong React
  ├── Bài tập: xây 3D scene bằng Three.js
  └── Bài tập: port sang R3F

  WEEK 9-10: Applied 🟠
  ├── §9 Security Viz: particle systems, globe
  ├── §10 Performance: optimization checklist
  ├── Bài tập: real-time data visualization
  └── Bài tập: performance profiling

  WEEK 11-12: Expert 🔴
  ├── §11 Lighting: Phong, PBR
  ├── §12 Animation: easing, raycasting
  ├── §13 Advanced GLSL: noise, SDF
  ├── §14 WebGL2 & WebGPU: future-proofing
  ├── §15 Interview: practice all Q&A
  └── Bài tập: CAPSTONE — 3D threat globe dashboard

  📚 RESOURCES:
  ├── WebGL Fundamentals (webglfundamentals.org)
  ├── Three.js Journey (threejs-journey.com)
  ├── The Book of Shaders (thebookofshaders.com)
  ├── Shadertoy (shadertoy.com) — GLSL playground
  └── R3F Docs (docs.pmnd.rs)
```
