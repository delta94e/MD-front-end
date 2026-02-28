# Flyweight Pattern — Deep Dive

> 📅 2026-02-15 · ⏱ 20 phút đọc
>
> Flyweight Concept & Intrinsic/Extrinsic,
> Book Library Example,
> Flyweight Factory,
> Object Pool vs Flyweight,
> DOM Optimization, Canvas Rendering,
> String Interning, Icon Systems,
> Prototypal Inheritance & Flyweight,
> Memory Benchmarks & Tradeoffs
> Độ khó: ⭐️⭐️⭐️⭐️ | Design Pattern

---

## Mục Lục

| #   | Phần                                           |
| --- | ---------------------------------------------- |
| 1   | Flyweight Pattern là gì?                       |
| 2   | Intrinsic vs Extrinsic State                   |
| 3   | Book Library — Ví dụ kinh điển                 |
| 4   | Flyweight Factory                              |
| 5   | Prototypal Inheritance — JS Flyweight tự nhiên |
| 6   | DOM Optimization                               |
| 7   | Canvas / Game — Hàng ngàn objects              |
| 8   | String Interning & Caching                     |
| 9   | Icon System — Reuse SVG                        |
| 10  | Object Pool vs Flyweight                       |
| 11  | Memory Benchmarks                              |
| 12  | Real-World Applications                        |
| 13  | Tradeoffs — Ưu & Nhược điểm                    |
| 14  | Tóm tắt                                        |

---

## §1. Flyweight Pattern là gì?

```
FLYWEIGHT PATTERN — KHÁI NIỆM:
═══════════════════════════════════════════════════════════════

  ĐỊNH NGHĨA:
  → Flyweight = TIẾT KIỆM BỘ NHỚ!
  → Khi tạo SỐ LƯỢNG LỚN objects TƯƠNG TỰ nhau!
  → CHIA SẺ phần CHUNG giữa các objects!
  → Mỗi object CHỈ GIỮ phần RIÊNG!
  → → Giảm ĐÁNG KỂ memory consumption!

  VÍ DỤ THỰC TẾ: THƯ VIỆN SÁCH!
  → 1000 bản copy "Harry Potter"!
  → Mỗi bản có: title, author, isbn → GIỐNG NHAU!
  → Mỗi bản có: availability, sales → KHÁC NHAU!
  → TẠO 1000 Book objects ĐẦY ĐỦ? → LÃNG PHÍ!
  → TẠO 1 Book shared + 1000 records nhẹ? → TIẾT KIỆM!

  TÊN GỌI:
  → "Flyweight" = "hạng ruồi" (boxing!)
  → Nhẹ nhất có thể! Tối thiểu weight!
  → Object nhẹ nhất bằng cách CHIA SẺ data chung!
```

```
KHÔNG CÓ FLYWEIGHT vs CÓ FLYWEIGHT:
═══════════════════════════════════════════════════════════════

  ❌ KHÔNG CÓ FLYWEIGHT (5 copies = 5 FULL objects!):

  Copy1: { title: "HP", author: "JK", isbn: "AB", avail: T, sales: 100 }
  Copy2: { title: "HP", author: "JK", isbn: "AB", avail: F, sales: 50  }
  Copy3: { title: "HP", author: "JK", isbn: "AB", avail: T, sales: 30  }
  Copy4: { title: "HP", author: "JK", isbn: "AB", avail: F, sales: 20  }
  Copy5: { title: "HP", author: "JK", isbn: "AB", avail: T, sales: 10  }

  → 5 objects × (title + author + isbn + avail + sales)!
  → title, author, isbn LẶP LẠI 5 lần! LÃNG PHÍ!

  ✅ CÓ FLYWEIGHT (1 shared + 5 lightweight!):

  SharedBook: { title: "HP", author: "JK", isbn: "AB" }  ← 1 LẦN!

  Copy1: { book: SharedBook, avail: T, sales: 100 }  ← NHẸ!
  Copy2: { book: SharedBook, avail: F, sales: 50  }  ← NHẸ!
  Copy3: { book: SharedBook, avail: T, sales: 30  }  ← NHẸ!
  Copy4: { book: SharedBook, avail: F, sales: 20  }  ← NHẸ!
  Copy5: { book: SharedBook, avail: T, sales: 10  }  ← NHẸ!

  → 1 shared object + 5 lightweight refs!
  → TIẾT KIỆM memory!
```

---

## §2. Intrinsic vs Extrinsic State

```
HAI LOẠI STATE:
═══════════════════════════════════════════════════════════════

  INTRINSIC STATE (NỘI TẠI):
  → Data GIỐNG NHAU giữa nhiều objects!
  → KHÔNG thay đổi theo context!
  → CÓ THỂ chia sẻ!
  → Lưu TRONG flyweight object!
  → VD: title, author, isbn của sách!

  EXTRINSIC STATE (NGOẠI TẠI):
  → Data KHÁC NHAU giữa các objects!
  → THAY ĐỔI theo context!
  → KHÔNG chia sẻ được!
  → Lưu BÊN NGOÀI flyweight!
  → VD: availability, sales của bản copy!

  ┌─────────────────────────────────────────────────┐
  │              FLYWEIGHT OBJECT                   │
  │  ┌─────────────────────────────────┐           │
  │  │ INTRINSIC (shared!)            │           │
  │  │ → title: "Harry Potter"        │           │
  │  │ → author: "JK Rowling"         │           │
  │  │ → isbn: "AB123"                │           │
  │  └─────────────────────────────────┘           │
  └─────────────────────────────────────────────────┘
        ↑              ↑              ↑
  ┌─────┴──┐     ┌─────┴──┐     ┌─────┴──┐
  │Context1│     │Context2│     │Context3│
  │avail: T│     │avail: F│     │avail: T│  EXTRINSIC
  │sales:100│    │sales:50│     │sales:30│  (separate!)
  └────────┘     └────────┘     └────────┘
```

---

## §3. Book Library — Ví dụ kinh điển

```javascript
// ═══ BOOK LIBRARY — FLYWEIGHT ═══

// FLYWEIGHT: chỉ chứa INTRINSIC state!
class Book {
  constructor(title, author, isbn) {
    this.title = title;
    this.author = author;
    this.isbn = isbn;
  }
}

// FLYWEIGHT FACTORY: quản lý shared instances!
const books = new Map();

const createBook = (title, author, isbn) => {
  // Đã có Book với isbn này? → TRẢ LẠI cái cũ!
  const existingBook = books.has(isbn);
  if (existingBook) {
    return books.get(isbn);
  }

  // Chưa có? → Tạo MỚI và cache!
  const book = new Book(title, author, isbn);
  books.set(isbn, book);
  return book;
};

// EXTRINSIC state: lưu RIÊNG cho mỗi copy!
const bookList = [];

const addBook = (title, author, isbn, availability, sales) => {
  const book = {
    ...createBook(title, author, isbn), // SHARED intrinsic!
    sales, // EXTRINSIC — riêng cho copy này!
    availability, // EXTRINSIC — riêng cho copy này!
  };

  bookList.push(book);
  return book;
};

// ═══ THÊM 5 COPIES của 3 cuốn sách ═══

addBook("Harry Potter", "JK Rowling", "AB123", false, 100);
addBook("Harry Potter", "JK Rowling", "AB123", true, 50);
addBook("To Kill a Mockingbird", "Harper Lee", "CD345", true, 10);
addBook("To Kill a Mockingbird", "Harper Lee", "CD345", false, 20);
addBook("The Great Gatsby", "F. Scott Fitzgerald", "EF567", false, 20);

console.log("Total copies:", bookList.length); // 5
console.log("Total Book objects:", books.size); // 3 ← CHỈ 3!

// → 5 copies NHƯNG chỉ 3 Book instances!
// → "Harry Potter" dùng CHUNG 1 Book object!
// → "To Kill a Mockingbird" dùng CHUNG 1 Book object!
```

```
MEMORY SAVING:
═══════════════════════════════════════════════════════════════

  KHÔNG Flyweight:     CÓ Flyweight:
  5 copies             3 Book objects (shared!)
  × 5 properties       + 5 copy records (lightweight!)
  = 25 property slots  = 15 + 10 = 25 property slots

  → 5 copies thì TƯƠNG ĐƯƠNG!
  → NHƯNG nếu 10,000 copies của 100 sách?

  KHÔNG Flyweight:     CÓ Flyweight:
  10,000               100 Book objects
  × 5 properties       + 10,000 × 2 properties
  = 50,000 slots       = 300 + 20,000 = 20,300 slots

  → TIẾT KIỆM 59.4% memory! 🎉
  → Càng NHIỀU copies → càng TIẾT KIỆM!
```

---

## §4. Flyweight Factory

```javascript
// ═══ FLYWEIGHT FACTORY — GENERIC ═══

class FlyweightFactory {
  constructor() {
    this.flyweights = new Map();
  }

  // Lấy hoặc tạo flyweight:
  get(key, createFn) {
    if (!this.flyweights.has(key)) {
      this.flyweights.set(key, createFn());
    }
    return this.flyweights.get(key);
  }

  // Thống kê:
  getCount() {
    return this.flyweights.size;
  }

  // Xóa cache:
  clear() {
    this.flyweights.clear();
  }

  // Kiểm tra:
  has(key) {
    return this.flyweights.has(key);
  }
}

// ═══ SỬ DỤNG ═══

const bookFactory = new FlyweightFactory();

function addBook(title, author, isbn, availability, sales) {
  // Flyweight = shared Book:
  const bookType = bookFactory.get(isbn, () => ({
    title,
    author,
    isbn,
  }));

  // Context = extrinsic state:
  return {
    bookType, // Reference tới SHARED object!
    availability,
    sales,
  };
}

const copies = [
  addBook("Harry Potter", "JK Rowling", "AB123", true, 100),
  addBook("Harry Potter", "JK Rowling", "AB123", false, 50),
  addBook("Harry Potter", "JK Rowling", "AB123", true, 30),
];

console.log(bookFactory.getCount()); // 1 — chỉ 1 Book type!
console.log(copies.length); // 3 — nhưng 3 copies!

// Tất cả copies CHIA SẺ cùng 1 bookType:
console.log(copies[0].bookType === copies[1].bookType); // true!
console.log(copies[1].bookType === copies[2].bookType); // true!
```

```javascript
// ═══ FLYWEIGHT FACTORY — VỚI COMPOSITE KEY ═══

class TreeFactory {
  constructor() {
    this.treeTypes = new Map();
  }

  getTreeType(name, color, texture) {
    // Key = composite từ nhiều intrinsic props:
    const key = `${name}_${color}_${texture}`;

    if (!this.treeTypes.has(key)) {
      this.treeTypes.set(key, new TreeType(name, color, texture));
    }
    return this.treeTypes.get(key);
  }
}

// Flyweight: intrinsic state!
class TreeType {
  constructor(name, color, texture) {
    this.name = name;
    this.color = color;
    this.texture = texture; // Texture image = NẶNG!
  }

  draw(canvas, x, y) {
    // Vẽ cây tại vị trí (x, y) dùng texture shared:
    console.log(`Drawing ${this.name} (${this.color}) at (${x}, ${y})`);
  }
}

// Context: extrinsic state!
class Tree {
  constructor(x, y, type) {
    this.x = x; // Extrinsic — vị trí riêng!
    this.y = y; // Extrinsic — vị trí riêng!
    this.type = type; // Reference → shared flyweight!
  }

  draw(canvas) {
    this.type.draw(canvas, this.x, this.y);
  }
}

// ═══ FOREST VỚI 1 TRIỆU CÂY ═══

const factory = new TreeFactory();
const forest = [];

for (let i = 0; i < 1_000_000; i++) {
  // Chỉ có 3 loại cây → 3 flyweights!
  const types = [
    ["Oak", "green", "oak.png"],
    ["Pine", "dark-green", "pine.png"],
    ["Birch", "light-green", "birch.png"],
  ];
  const [name, color, texture] = types[i % 3];

  const type = factory.getTreeType(name, color, texture);
  forest.push(
    new Tree(
      Math.random() * 1000, // x
      Math.random() * 1000, // y
      type, // SHARED flyweight!
    ),
  );
}

console.log("Trees:", forest.length); // 1,000,000
console.log("Tree types:", factory.treeTypes.size); // 3 ← CHỈ 3!

// → 1 triệu cây NHƯNG chỉ 3 TreeType objects!
// → Texture images KHÔNG bị duplicate!
// → TIẾT KIỆM hàng GB memory!
```

---

## §5. Prototypal Inheritance — JS Flyweight tự nhiên

```javascript
// ═══ PROTOTYPE = FLYWEIGHT TỰ NHIÊN CỦA JS! ═══

// JavaScript PROTOTYPE BẢN CHẤT là Flyweight:
// → Methods trên prototype = SHARED (intrinsic!)
// → Properties trên instance = UNIQUE (extrinsic!)

class Car {
  constructor(make, model, year, color) {
    // Instance properties = EXTRINSIC:
    this.make = make;
    this.model = model;
    this.year = year;
    this.color = color;
  }

  // Prototype methods = INTRINSIC (shared!):
  drive() {
    console.log(`${this.make} ${this.model} is driving!`);
  }

  honk() {
    console.log("Beep beep!");
  }

  getInfo() {
    return `${this.year} ${this.make} ${this.model} (${this.color})`;
  }
}

const car1 = new Car("Toyota", "Camry", 2024, "white");
const car2 = new Car("Toyota", "Camry", 2024, "black");
const car3 = new Car("Honda", "Civic", 2023, "red");

// Methods CHIA SẺ trên prototype:
console.log(car1.drive === car2.drive); // true! CÙNG function!
console.log(car2.drive === car3.drive); // true! CÙNG function!

// → 1000 Car instances = 1000 × (4 props) + 1 × (3 methods)!
// → KHÔNG phải 1000 × (4 props + 3 methods)!
// → Prototype = Flyweight MIỄN PHÍ trong JS!
```

```
PROTOTYPE vs EXPLICIT FLYWEIGHT:
═══════════════════════════════════════════════════════════════

  PROTOTYPE (tự động!):
  → Methods trên prototype = SHARED!
  → Instance data = RIÊNG!
  → JavaScript LÀM SẴN cho bạn!
  → KHÔNG cần pattern phức tạp!

  EXPLICIT FLYWEIGHT (thủ công!):
  → Khi DATA cũng cần SHARED (không chỉ methods!)
  → VD: title, author, isbn = data GIỐNG NHAU!
  → Prototype KHÔNG giải quyết được!
  → CẦN Flyweight Factory!

  ┌──────────────────┬──────────────────┬──────────────────┐
  │                  │ Prototype        │ Flyweight         │
  ├──────────────────┼──────────────────┼──────────────────┤
  │ Shared gì?       │ Methods ONLY!    │ Methods + DATA!  │
  │ Tự động?         │ ✅ JS built-in  │ ❌ Phải code!    │
  │ Factory cần?     │ ❌ Không        │ ✅ Cần!          │
  │ Use case         │ Class methods    │ Large identical  │
  │                  │                  │ data objects!    │
  └──────────────────┴──────────────────┴──────────────────┘
```

---

## §6. DOM Optimization

```javascript
// ═══ DOM FLYWEIGHT — EVENT DELEGATION ═══

// ❌ BAD: 10,000 event listeners!
const list = document.getElementById("list");
const items = list.querySelectorAll("li");

items.forEach((item) => {
  // MỖI item 1 listener → 10,000 listeners! NẶNG!
  item.addEventListener("click", (e) => {
    handleItemClick(e.target.dataset.id);
  });
});

// ✅ GOOD: 1 event listener (FLYWEIGHT!)
list.addEventListener("click", (e) => {
  // 1 listener cho TẤT CẢ items!
  const item = e.target.closest("li");
  if (item) {
    handleItemClick(item.dataset.id);
  }
});

// → Event delegation = Flyweight cho event listeners!
// → 1 shared handler thay vì N riêng biệt!
// → Tiết kiệm memory + tốt cho dynamic items!
```

```javascript
// ═══ DOM ELEMENT POOL — VIRTUAL SCROLLING ═══

class VirtualList {
  constructor(container, itemHeight, totalItems, renderItem) {
    this.container = container;
    this.itemHeight = itemHeight;
    this.totalItems = totalItems;
    this.renderItem = renderItem;

    // FLYWEIGHT POOL: chỉ tạo DOM elements NHÌN THẤY!
    this.visibleCount = Math.ceil(container.clientHeight / itemHeight) + 2;
    this.pool = []; // ← Pool of reusable DOM elements!

    this._createPool();
    this._setupScroll();
    this._render();
  }

  _createPool() {
    // Chỉ tạo SỐ ÍT elements (flyweights!):
    for (let i = 0; i < this.visibleCount; i++) {
      const el = document.createElement("div");
      el.style.height = `${this.itemHeight}px`;
      el.style.position = "absolute";
      el.style.width = "100%";
      this.container.appendChild(el);
      this.pool.push(el);
    }
    // Tổng height cho scroll:
    this.container.style.height = `${this.totalItems * this.itemHeight}px`;

    console.log(`Created ${this.pool.length} DOM elements`);
    console.log(`For ${this.totalItems} total items`);
    // → 20 elements cho 100,000 items!
  }

  _setupScroll() {
    this.container.parentElement.addEventListener("scroll", () =>
      this._render(),
    );
  }

  _render() {
    const scrollTop = this.container.parentElement.scrollTop;
    const startIndex = Math.floor(scrollTop / this.itemHeight);

    // TÁI SỬ DỤNG pool elements (flyweight!):
    for (let i = 0; i < this.pool.length; i++) {
      const dataIndex = startIndex + i;
      const el = this.pool[i];

      if (dataIndex < this.totalItems) {
        el.style.top = `${dataIndex * this.itemHeight}px`;
        el.style.display = "block";
        this.renderItem(el, dataIndex);
      } else {
        el.style.display = "none";
      }
    }
  }
}

// SỬ DỤNG: 100,000 items → chỉ ~20 DOM elements!
new VirtualList(
  document.getElementById("container"),
  40, // item height
  100_000, // total items
  (el, index) => {
    el.textContent = `Item ${index}`;
  },
);

// → 100,000 items NHƯNG chỉ ~20 DOM nodes!
// → Scroll → TÁI SỬ DỤNG nodes!
// → Flyweight cho DOM = Virtual Scrolling!
```

---

## §7. Canvas / Game — Hàng ngàn objects

```javascript
// ═══ PARTICLE SYSTEM — FLYWEIGHT ═══

// Flyweight: shared visual properties!
class ParticleType {
  constructor(color, size, shape, texture) {
    this.color = color;
    this.size = size;
    this.shape = shape;
    this.texture = texture; // Image object = NẶNG!
  }

  draw(ctx, x, y, alpha) {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;

    if (this.shape === "circle") {
      ctx.beginPath();
      ctx.arc(x, y, this.size, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(x - this.size / 2, y - this.size / 2, this.size, this.size);
    }
  }
}

// Context: extrinsic state cho mỗi particle!
class Particle {
  constructor(type, x, y, vx, vy, life) {
    this.type = type; // → SHARED flyweight!
    this.x = x;
    this.y = y;
    this.vx = vx; // velocity x
    this.vy = vy; // velocity y
    this.life = life; // remaining life
    this.maxLife = life;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.1; // gravity
    this.life--;
  }

  draw(ctx) {
    const alpha = this.life / this.maxLife;
    this.type.draw(ctx, this.x, this.y, alpha);
  }

  isDead() {
    return this.life <= 0;
  }
}

// Flyweight Factory:
const particleTypes = {
  fire: new ParticleType("orange", 3, "circle", null),
  smoke: new ParticleType("gray", 5, "circle", null),
  spark: new ParticleType("yellow", 2, "square", null),
  snow: new ParticleType("white", 4, "circle", null),
};

// ═══ PARTICLE SYSTEM ═══

class ParticleSystem {
  constructor(canvas) {
    this.ctx = canvas.getContext("2d");
    this.particles = [];
  }

  emit(type, x, y, count = 50) {
    const flyweight = particleTypes[type]; // SHARED!

    for (let i = 0; i < count; i++) {
      this.particles.push(
        new Particle(
          flyweight, // ← TẤT CẢ particles cùng type CHIA SẺ!
          x,
          y,
          (Math.random() - 0.5) * 5, // vx
          (Math.random() - 0.5) * 5, // vy
          Math.random() * 60 + 30, // life
        ),
      );
    }
  }

  update() {
    this.particles = this.particles.filter((p) => !p.isDead());
    this.particles.forEach((p) => p.update());
  }

  draw() {
    this.ctx.clearRect(0, 0, 800, 600);
    this.particles.forEach((p) => p.draw(this.ctx));
  }
}

// SỬ DỤNG:
const system = new ParticleSystem(canvas);

// Emit 10,000 fire particles → chỉ 1 ParticleType object!
system.emit("fire", 400, 300, 10000);
console.log("Particles:", system.particles.length); // 10,000
console.log("Particle types:", Object.keys(particleTypes).length); // 4

// → 10,000 particles CHIA SẺ 1 ParticleType!
// → Color, size, shape, texture = KHÔNG duplicate!
```

---

## §8. String Interning & Caching

```javascript
// ═══ STRING INTERNING — JS ENGINE FLYWEIGHT! ═══

// JavaScript engine TỰ ĐỘNG intern strings!
const a = "hello";
const b = "hello";
console.log(a === b); // true → CÙNG 1 string trong memory!

// → JS engine KHÔNG TẠO 2 copies "hello"!
// → Nó TÁI SỬ DỤNG cùng 1 reference!
// → ĐÂY LÀ FLYWEIGHT do engine làm!

// ═══ MANUAL CACHING — FLYWEIGHT CHO COMPUTED VALUES ═══

class StyleCache {
  constructor() {
    this.cache = new Map();
  }

  // Flyweight: cache computed style objects!
  getStyle(color, fontSize, fontWeight) {
    const key = `${color}_${fontSize}_${fontWeight}`;

    if (!this.cache.has(key)) {
      // Tạo style object MỚI:
      this.cache.set(
        key,
        Object.freeze({
          color,
          fontSize: `${fontSize}px`,
          fontWeight,
          lineHeight: `${fontSize * 1.5}px`,
          // ... nhiều computed properties!
        }),
      );
    }

    return this.cache.get(key);
  }

  getStats() {
    return {
      cached: this.cache.size,
      memoryEstimate: `~${this.cache.size * 200}B`,
    };
  }
}

const styleCache = new StyleCache();

// 1000 elements cần style → chỉ tạo unique styles!
const elements = Array.from({ length: 1000 }, (_, i) => ({
  id: i,
  style: styleCache.getStyle(
    i % 2 === 0 ? "red" : "blue", // 2 colors
    i % 3 === 0 ? 14 : 16, // 2 sizes
    i % 2 === 0 ? "bold" : "normal", // 2 weights
  ),
}));

console.log(styleCache.getStats());
// → { cached: 4, memoryEstimate: "~800B" }
// → 1000 elements CHIA SẺ chỉ 4 style objects!
```

---

## §9. Icon System — Reuse SVG

```javascript
// ═══ ICON SYSTEM — SVG FLYWEIGHT ═══

class IconFactory {
  constructor() {
    this.icons = new Map();
    this.usageCount = new Map();
  }

  // Flyweight: cache SVG data!
  getIcon(name) {
    if (!this.icons.has(name)) {
      // Tạo SVG element 1 LẦN:
      const svg = this._createSVG(name);
      this.icons.set(name, svg);
      this.usageCount.set(name, 0);
    }

    this.usageCount.set(name, this.usageCount.get(name) + 1);

    // Return CLONE (nhẹ hơn tạo mới!):
    return this.icons.get(name).cloneNode(true);
  }

  _createSVG(name) {
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("width", "24");
    svg.setAttribute("height", "24");

    // Icon paths:
    const paths = {
      heart: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5...",
      star: "M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61...",
      home: "M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z",
      search: "M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16...",
    };

    const path = document.createElementNS(svgNS, "path");
    path.setAttribute("d", paths[name] || "");
    svg.appendChild(path);

    return svg;
  }

  getStats() {
    return {
      uniqueIcons: this.icons.size,
      usage: Object.fromEntries(this.usageCount),
    };
  }
}

const iconFactory = new IconFactory();

// 500 items, mỗi item có heart + star icons:
const listItems = Array.from({ length: 500 }, (_, i) => {
  const li = document.createElement("li");
  li.appendChild(iconFactory.getIcon("heart")); // SHARED template!
  li.appendChild(iconFactory.getIcon("star")); // SHARED template!
  li.textContent = ` Item ${i}`;
  return li;
});

console.log(iconFactory.getStats());
// → { uniqueIcons: 2, usage: { heart: 500, star: 500 } }
// → 1000 icons NHƯNG chỉ 2 SVG templates!
```

---

## §10. Object Pool vs Flyweight

```
OBJECT POOL vs FLYWEIGHT:
═══════════════════════════════════════════════════════════════

  ┌──────────────────┬──────────────────┬──────────────────┐
  │                  │ Flyweight        │ Object Pool      │
  ├──────────────────┼──────────────────┼──────────────────┤
  │ Mục đích         │ TIẾT KIỆM memory│ TIẾT KIỆM        │
  │                  │ (chia sẻ data!)  │ creation cost!   │
  │ Cách hoạt động   │ CHIA SẺ objects  │ TÁI SỬ DỤNG     │
  │                  │ (cùng lúc!)      │ objects (lần lượt!)|
  │ Object state     │ IMMUTABLE shared │ MUTABLE reset!   │
  │ Ownership        │ NHIỀU users cùng │ 1 user tại 1     │
  │                  │ 1 object!        │ thời điểm!       │
  │ Khi nào?         │ Nhiều objects    │ Objects tốn kém  │
  │                  │ GIỐNG NHAU!      │ để CREATE/DESTROY!│
  │ VD               │ Shared textures  │ DB connections   │
  │                  │ Book types       │ Thread pool      │
  └──────────────────┴──────────────────┴──────────────────┘
```

```javascript
// ═══ OBJECT POOL — SO SÁNH ═══

class ObjectPool {
  constructor(createFn, resetFn, initialSize = 10) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    this.available = [];
    this.inUse = new Set();

    // Pre-create:
    for (let i = 0; i < initialSize; i++) {
      this.available.push(createFn());
    }
  }

  // MƯỢN object từ pool:
  acquire() {
    const obj =
      this.available.length > 0 ? this.available.pop() : this.createFn();

    this.inUse.add(obj);
    return obj;
  }

  // TRẢ LẠI object cho pool:
  release(obj) {
    if (this.inUse.has(obj)) {
      this.inUse.delete(obj);
      this.resetFn(obj); // Reset state!
      this.available.push(obj); // Quay lại pool!
    }
  }

  getStats() {
    return {
      available: this.available.length,
      inUse: this.inUse.size,
      total: this.available.length + this.inUse.size,
    };
  }
}

// ═══ SỬ DỤNG POOL cho bullets trong game ═══

const bulletPool = new ObjectPool(
  () => ({ x: 0, y: 0, vx: 0, vy: 0, active: false }),
  (bullet) => {
    bullet.x = 0;
    bullet.y = 0;
    bullet.active = false;
  },
  100, // Pre-create 100 bullets!
);

function shoot(x, y, direction) {
  const bullet = bulletPool.acquire(); // KHÔNG tạo mới!
  bullet.x = x;
  bullet.y = y;
  bullet.vx = Math.cos(direction) * 10;
  bullet.vy = Math.sin(direction) * 10;
  bullet.active = true;
  return bullet;
}

// Bullet ra khỏi màn hình → trả lại pool:
function onBulletOffScreen(bullet) {
  bulletPool.release(bullet); // TÁI SỬ DỤNG!
}

// → Pool: objects TÁI SỬ DỤNG lần lượt (1 user/time!)
// → Flyweight: objects CHIA SẺ đồng thời (nhiều users!)
```

---

## §11. Memory Benchmarks

```javascript
// ═══ BENCHMARK: CÓ vs KHÔNG CÓ FLYWEIGHT ═══

function benchmarkWithoutFlyweight(count) {
  const items = [];
  const startMem = process.memoryUsage().heapUsed;

  for (let i = 0; i < count; i++) {
    items.push({
      // INTRINSIC (lặp lại!):
      type: ["warrior", "mage", "archer"][i % 3],
      baseHP: [100, 60, 80][i % 3],
      baseATK: [15, 25, 20][i % 3],
      baseDEF: [12, 5, 8][i % 3],
      sprite: `sprite_${["warrior", "mage", "archer"][i % 3]}.png`,
      animations: { idle: "idle.anim", walk: "walk.anim" },
      // EXTRINSIC (khác nhau!):
      id: i,
      x: Math.random() * 1000,
      y: Math.random() * 1000,
      currentHP: [100, 60, 80][i % 3],
    });
  }

  const endMem = process.memoryUsage().heapUsed;
  return {
    items: items.length,
    memoryMB: ((endMem - startMem) / 1024 / 1024).toFixed(2),
  };
}

function benchmarkWithFlyweight(count) {
  // Flyweights — chỉ 3 objects!
  const types = {
    warrior: Object.freeze({
      type: "warrior",
      baseHP: 100,
      baseATK: 15,
      baseDEF: 12,
      sprite: "sprite_warrior.png",
      animations: { idle: "idle.anim", walk: "walk.anim" },
    }),
    mage: Object.freeze({
      type: "mage",
      baseHP: 60,
      baseATK: 25,
      baseDEF: 5,
      sprite: "sprite_mage.png",
      animations: { idle: "idle.anim", walk: "walk.anim" },
    }),
    archer: Object.freeze({
      type: "archer",
      baseHP: 80,
      baseATK: 20,
      baseDEF: 8,
      sprite: "sprite_archer.png",
      animations: { idle: "idle.anim", walk: "walk.anim" },
    }),
  };

  const items = [];
  const startMem = process.memoryUsage().heapUsed;
  const typeNames = ["warrior", "mage", "archer"];

  for (let i = 0; i < count; i++) {
    items.push({
      // Reference tới SHARED flyweight:
      type: types[typeNames[i % 3]],
      // EXTRINSIC only:
      id: i,
      x: Math.random() * 1000,
      y: Math.random() * 1000,
      currentHP: types[typeNames[i % 3]].baseHP,
    });
  }

  const endMem = process.memoryUsage().heapUsed;
  return {
    items: items.length,
    flyweights: Object.keys(types).length,
    memoryMB: ((endMem - startMem) / 1024 / 1024).toFixed(2),
  };
}

// ═══ KẾT QUẢ ═══

console.log(benchmarkWithoutFlyweight(100_000));
// → { items: 100000, memoryMB: "52.34" }

console.log(benchmarkWithFlyweight(100_000));
// → { items: 100000, flyweights: 3, memoryMB: "25.12" }

// → TIẾT KIỆM ~52% memory!
```

```
BENCHMARK TỔNG HỢP:
═══════════════════════════════════════════════════════════════

  ┌──────────────┬──────────────────┬──────────────────┐
  │ Objects      │ Không Flyweight  │ Có Flyweight     │
  ├──────────────┼──────────────────┼──────────────────┤
  │ 1,000        │ ~0.5 MB          │ ~0.3 MB (40%↓)  │
  │ 10,000       │ ~5.2 MB          │ ~2.5 MB (52%↓)  │
  │ 100,000      │ ~52 MB           │ ~25 MB (52%↓)   │
  │ 1,000,000    │ ~520 MB          │ ~250 MB (52%↓)  │
  └──────────────┴──────────────────┴──────────────────┘

  → Càng NHIỀU objects → càng HIỆU QUẢ!
  → Càng NHIỀU intrinsic data → càng TIẾT KIỆM!

  ⚠️ LƯU Ý:
  → Ngày nay hardware có GBs RAM!
  → Flyweight LESS IMPORTANT hơn trước!
  → NHƯNG vẫn cần cho: games, canvas, mobile, IoT!
```

---

## §12. Real-World Applications

```javascript
// ═══ CSS CLASS MANAGER — FLYWEIGHT ═══

class CSSClassManager {
  constructor() {
    this.classLists = new Map(); // className → CSSStyleDeclaration
  }

  // Flyweight: cache parsed class combinations!
  getClasses(classString) {
    if (!this.classLists.has(classString)) {
      const parsed = classString.split(" ").filter(Boolean).sort().join(" ");

      this.classLists.set(classString, parsed);
    }
    return this.classLists.get(classString);
  }
}

// 10,000 elements có class="btn btn-primary"
// → CHỈ 1 parsed string cached!
```

```javascript
// ═══ MAP MARKER SYSTEM — FLYWEIGHT ═══

class MarkerTypeFactory {
  constructor() {
    this.types = new Map();
  }

  getMarkerType(category, color, icon) {
    const key = `${category}_${color}_${icon}`;

    if (!this.types.has(key)) {
      this.types.set(key, {
        category,
        color,
        icon,
        // Heavy assets:
        image: this._loadImage(icon),
        shadow: this._loadImage("shadow.png"),
        popupTemplate: this._createTemplate(category),
      });
    }
    return this.types.get(key);
  }

  _loadImage(src) {
    const img = new Image();
    img.src = src;
    return img;
  }

  _createTemplate(category) {
    return `<div class="popup popup-${category}">{{content}}</div>`;
  }
}

// Markers trên map: mỗi cái có vị trí riêng!
class MapMarker {
  constructor(lat, lng, type, data) {
    this.lat = lat; // Extrinsic!
    this.lng = lng; // Extrinsic!
    this.data = data; // Extrinsic!
    this.type = type; // → SHARED flyweight!
  }

  render(map) {
    // Dùng shared image, shadow, template:
    map.addMarker({
      position: [this.lat, this.lng],
      icon: this.type.image, // ← SHARED!
      shadow: this.type.shadow, // ← SHARED!
    });
  }
}

// ═══ 50,000 markers → chỉ 5 loại marker types ═══

const factory = new MarkerTypeFactory();
const markers = [];

const locations = generateRandomLocations(50_000);
const categories = ["restaurant", "hotel", "gas", "park", "shop"];
const colors = ["red", "blue", "green", "yellow", "purple"];
const icons = ["food.png", "bed.png", "fuel.png", "tree.png", "bag.png"];

locations.forEach((loc, i) => {
  const idx = i % 5;
  const type = factory.getMarkerType(categories[idx], colors[idx], icons[idx]);
  markers.push(new MapMarker(loc.lat, loc.lng, type, loc.data));
});

console.log("Markers:", markers.length); // 50,000
console.log("Marker types:", factory.types.size); // 5
// → 50,000 markers CHIA SẺ 5 image + shadow + template objects!
// → TIẾT KIỆM loading 49,995 images!
```

```javascript
// ═══ FONT GLYPH CACHE — TEXT RENDERING ═══

class GlyphCache {
  constructor() {
    this.glyphs = new Map(); // char → rendered glyph!
  }

  getGlyph(char, font, size) {
    const key = `${char}_${font}_${size}`;

    if (!this.glyphs.has(key)) {
      // EXPENSIVE: render glyph 1 lần!
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      ctx.font = `${size}px ${font}`;
      ctx.fillText(char, 0, size * 0.8);

      this.glyphs.set(key, {
        char,
        image: canvas, // Pre-rendered!
        width: ctx.measureText(char).width,
      });
    }

    return this.glyphs.get(key);
  }
}

// Render "Hello World" → chỉ cache 8 unique glyphs!
// H, e, l, o, W, r, d, ' '
// "l" xuất hiện 3 lần → CHỈ render 1 lần!
const cache = new GlyphCache();
const text = "Hello World";

text.split("").forEach((char, i) => {
  const glyph = cache.getGlyph(char, "Arial", 16);
  // Draw glyph.image at position i * glyph.width!
});

console.log("Characters:", text.length); // 11
console.log("Cached glyphs:", cache.glyphs.size); // 8 unique!
```

---

## §13. Tradeoffs — Ưu & Nhược điểm

```
ƯU ĐIỂM:
═══════════════════════════════════════════════════════════════

  ✅ TIẾT KIỆM MEMORY:
  → Chia sẻ intrinsic data giữa hàng ngàn objects!
  → 1 triệu objects → chỉ vài flyweight instances!
  → Giảm 50-90% memory trong best cases!

  ✅ GIẢM OBJECT CREATION:
  → Không tạo duplicate objects!
  → Factory cache → trả lại existing!
  → Nhanh hơn + ít GC pressure!

  ✅ CENTRALIZED DATA:
  → Thay đổi flyweight → TẤT CẢ contexts thay đổi!
  → Update texture → tất cả cây cùng type đổi!
  → Single source of truth cho shared data!

  ✅ SCALABLE:
  → Xử lý được SỐ LƯỢNG LỚN objects!
  → Games: 1 triệu particles!
  → Maps: 50,000 markers!
  → DOM: virtual scrolling 100,000 items!
```

```
NHƯỢC ĐIỂM:
═══════════════════════════════════════════════════════════════

  ❌ COMPLEXITY:
  → Tách intrinsic/extrinsic = phức tạp hơn!
  → Thêm Factory layer!
  → Code khó đọc hơn direct creation!

  ❌ THREAD SAFETY:
  → Shared objects → concurrent access issues!
  → (Ít relevant trong single-threaded JS!)
  → NHƯNG important cho Web Workers!

  ❌ RUNTIME vs MEMORY TRADEOFF:
  → Lookup trong cache = thêm thời gian!
  → Hash key calculation!
  → Trade CPU cho memory!

  ❌ ÍT CẦN THIẾT NGÀY NAY:
  → Hardware có GBs RAM!
  → V8 engine tối ưu memory tốt!
  → Prototypal inheritance = tự nhiên flyweight!
  → CHỈ cần khi hàng chục ngàn objects!
```

```
KHI NÀO DÙNG:
═══════════════════════════════════════════════════════════════

  ✅ NÊN DÙNG:
  → Tạo HÀNG NGÀN objects tương tự!
  → Objects có NHIỀU shared data (textures, configs!)!
  → Memory-sensitive: mobile, IoT, games!
  → Virtual scrolling, particle systems, map markers!
  → Text rendering, icon systems, CSS caching!

  ❌ KHÔNG NÊN DÙNG:
  → Ít objects (< 100) → overhead lớn hơn benefit!
  → Objects hoàn toàn UNIQUE → không có gì để share!
  → Prototype đã đủ tốt → không cần explicit flyweight!
  → Khi code readability quan trọng hơn memory!
```

---

## §14. Tóm tắt

```
FLYWEIGHT PATTERN — TRẢ LỜI PHỎNG VẤN:
═══════════════════════════════════════════════════════════════

  Q: "Flyweight Pattern là gì?"
  A: Tiết kiệm memory bằng cách CHIA SẺ phần CHUNG
  (intrinsic state) giữa nhiều objects! Mỗi object
  chỉ giữ phần RIÊNG (extrinsic state)! Factory cache
  và trả lại existing flyweight thay vì tạo mới!

  Q: "Intrinsic vs Extrinsic State?"
  A: Intrinsic = shared, KHÔNG đổi theo context!
  (title, author, texture, color)
  Extrinsic = unique, THAY ĐỔI theo context!
  (position, availability, sales)

  Q: "Prototype vs Flyweight?"
  A: Prototype share METHODS tự động!
  Flyweight share cả DATA (cần phải code thủ công)!
  Prototype = JS built-in flyweight cho methods!

  Q: "Object Pool vs Flyweight?"
  A: Pool: TÁI SỬ DỤNG lần lượt (1 user/time!)
  Flyweight: CHIA SẺ đồng thời (nhiều users!)
  Pool = giảm creation cost; Flyweight = giảm memory!

  Q: "Real-world examples?"
  A: Virtual scrolling (20 DOM nodes cho 100k items!),
  game particles (1 triệu particles, 4 types!),
  map markers (50k markers, 5 types!),
  string interning (JS engine tự làm!),
  event delegation (1 listener cho N items!)

  Q: "Còn cần Flyweight ngày nay không?"
  A: Hardware mạnh → LESS IMPORTANT!
  NHƯNG VẪN CẦN cho: games, canvas, mobile/IoT,
  virtual scrolling, hàng chục ngàn objects!
```

---

### Checklist

- [ ] **Flyweight concept**: CHIA SẺ phần CHUNG; mỗi object chỉ giữ phần RIÊNG; tiết kiệm memory!
- [ ] **Intrinsic vs Extrinsic**: Intrinsic = shared (title, texture!); Extrinsic = unique (position, sales!)
- [ ] **Book Library**: createBook cache theo isbn; 5 copies → 3 Book instances; Map cache!
- [ ] **Flyweight Factory**: get(key, createFn); cache + return existing; composite key cho nhiều props!
- [ ] **Prototype = JS Flyweight**: methods trên prototype SHARED tự nhiên; chỉ share methods KHÔNG data!
- [ ] **DOM Optimization**: Event Delegation = 1 listener cho N items; Virtual Scrolling = N DOM nodes cho M items!
- [ ] **Canvas/Game**: Particle system (10k particles, 4 types!); Tree forest (1M trees, 3 types!)
- [ ] **String Interning**: JS engine tự cache identical strings; StyleCache cho computed styles!
- [ ] **Object Pool vs Flyweight**: Pool = tái sử dụng lần lượt; Flyweight = chia sẻ đồng thời!
- [ ] **Memory Benchmarks**: 100k objects → ~52% memory savings; càng nhiều objects càng hiệu quả!
- [ ] **Tradeoffs**: Ưu (memory saving, scalable!) vs Nhược (complexity, CPU tradeoff, ít cần ngày nay!)

---

_Nguồn: patterns.dev — Flyweight Pattern, Refactoring Guru, How To Do In Java_
_Cập nhật lần cuối: Tháng 2, 2026_
