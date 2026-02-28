# new Operator — Handwritten Series!

> **new làm gì? 4 bước bên trong engine!**
> Prototype linking, this binding, return value trap!

---

## §1. new Làm 4 Bước!

```
  new Constructor(args):
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ① TẠO object rỗng!                                           │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ var obj = {};  ← object mới, trống! ★                │    │
  │  └──────────────────────────────────────────────────────┘    │
  │     │                                                          │
  │     ▼                                                          │
  │  ② LIÊN KẾT prototype!                                        │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ obj.__proto__ = Constructor.prototype ★               │    │
  │  │                                                      │    │
  │  │ → obj kế thừa methods từ prototype! ★                │    │
  │  │ → obj instanceof Constructor === true! ★             │    │
  │  └──────────────────────────────────────────────────────┘    │
  │     │                                                          │
  │     ▼                                                          │
  │  ③ GỌI Constructor, this = obj!                                │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ var result = Constructor.apply(obj, args) ★           │    │
  │  │                                                      │    │
  │  │ → this.name = 'Minh' → obj.name = 'Minh' ★          │    │
  │  │ → this.age = 25 → obj.age = 25 ★                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │     │                                                          │
  │     ▼                                                          │
  │  ④ XỬ LÝ return!                                               │
  │  ┌──────────────────────────────────────────────────────┐    │
  │  │ if (result là object/function) {                       │    │
  │  │   return result; ← DÙNG result! ★ (bỏ obj!)         │    │
  │  │ } else {                                               │    │
  │  │   return obj;    ← DÙNG obj! ★ (bỏ result!)         │    │
  │  │ }                                                     │    │
  │  └──────────────────────────────────────────────────────┘    │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §2. Tự Viết myNew!

```javascript
// ═══════════════════════════════════════════════════════════
// TỰ VIẾT: myNew — mô phỏng new operator! ★★★
// ═══════════════════════════════════════════════════════════

function myNew(Constructor) {
  // ★ Lấy arguments (bỏ Constructor — arg đầu tiên!)
  var args = [];
  for (var i = 1; i < arguments.length; i++) {
    args.push(arguments[i]);
  }

  // ★ BƯỚC 1: Tạo object rỗng!
  var obj = {};

  // ★ BƯỚC 2: Liên kết prototype!
  // obj.__proto__ = Constructor.prototype;
  // Cách chuẩn hơn: Object.create!
  obj.__proto__ = Constructor.prototype;

  // ★ BƯỚC 3: Gọi Constructor, bind this = obj!
  var result = Constructor.apply(obj, args);

  // ★ BƯỚC 4: Xử lý return value!
  // Nếu constructor return object/function → dùng nó!
  // Nếu return primitive (number, string...) → BỎ QUA, dùng obj!
  var isObject = typeof result === "object" && result !== null;
  var isFunction = typeof result === "function";

  return isObject || isFunction ? result : obj;
}

// ═══════════════════════════════════════════════════════════
// TEST!
// ═══════════════════════════════════════════════════════════

function Person(name, age) {
  this.name = name;
  this.age = age;
}
Person.prototype.greet = function () {
  return "Xin chào, tôi là " + this.name;
};

// Native new!
var p1 = new Person("Minh", 25);
console.log(p1.name); // 'Minh' ✅
console.log(p1.greet()); // 'Xin chào, tôi là Minh' ✅
console.log(p1 instanceof Person); // true ✅

// myNew!
var p2 = myNew(Person, "Minh", 25);
console.log(p2.name); // 'Minh' ✅
console.log(p2.greet()); // 'Xin chào, tôi là Minh' ✅
console.log(p2 instanceof Person); // true ✅
```

---

## §3. Return Value — Bẫy!

```javascript
// ═══════════════════════════════════════════════════════════
// BẪY 1: Return PRIMITIVE → BỎ QUA! ★
// ═══════════════════════════════════════════════════════════

function Foo(name) {
  this.name = name;
  return 123; // ★ Primitive! → BỊ BỎ QUA! ★
}

var f = new Foo("test");
console.log(f); // { name: 'test' } ✅ (không phải 123!)
console.log(f.name); // 'test' ✅

// ═══════════════════════════════════════════════════════════
// BẪY 2: Return OBJECT → DÙNG NÓ! ★★★
// ═══════════════════════════════════════════════════════════

function Bar(name) {
  this.name = name;
  return { custom: "object!" }; // ★ Object! → DÙNG NÓ! ★★★
}

var b = new Bar("test");
console.log(b); // { custom: 'object!' } ★ (KHÔNG phải { name: 'test' }!)
console.log(b.name); // undefined! ❌
console.log(b instanceof Bar); // false! ❌ ★

// ═══════════════════════════════════════════════════════════
// BẪY 3: Return FUNCTION → DÙNG NÓ! ★
// ═══════════════════════════════════════════════════════════

function Baz() {
  this.value = 1;
  return function () {
    return "hàm!";
  }; // ★ Function! → DÙNG! ★
}

var z = new Baz();
console.log(z); // function! ★ (không phải { value: 1 }!)
console.log(z()); // 'hàm!' ★
console.log(z.value); // undefined! ❌

// ═══════════════════════════════════════════════════════════
// BẪY 4: Return null → BỎ QUA! ★
// ═══════════════════════════════════════════════════════════

function Qux() {
  this.x = 1;
  return null; // ★ null! typeof null === 'object' NHƯNG!
  // ★ new BỎ QUA null! ★ (special case!)
}

var q = new Qux();
console.log(q); // { x: 1 } ✅ (null bị bỏ qua!)
```

```
  RETURN VALUE RULES:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ┌──────────────────┬──────────────────────────────────┐    │
  │  │ Constructor return│ new trả về                      │    │
  │  ├──────────────────┼──────────────────────────────────┤    │
  │  │ không return      │ obj (instance!) ✅ ★             │    │
  │  │ return undefined  │ obj (instance!) ✅               │    │
  │  │ return 123         │ obj (instance!) ✅ (bỏ qua!) ★ │    │
  │  │ return 'abc'       │ obj (instance!) ✅ (bỏ qua!)   │    │
  │  │ return true        │ obj (instance!) ✅ (bỏ qua!)   │    │
  │  │ return null        │ obj (instance!) ✅ (bỏ qua!) ★ │    │
  │  │ return {}          │ {} ★★★ (dùng return!) ❌        │    │
  │  │ return []          │ [] ★★★ (dùng return!) ❌        │    │
  │  │ return function    │ function ★★★ (dùng return!) ❌  │    │
  │  └──────────────────┴──────────────────────────────────┘    │
  │                                                              │
  │  QUY TẮC:                                                       │
  │  → return PRIMITIVE + null → BỎ QUA! Trả obj! ★              │
  │  → return OBJECT (trừ null) / FUNCTION → DÙNG NÓ! ★★★       │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §4. Prototype Chain Sau new!

```
  PROTOTYPE LINKING:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  function Person(name) { this.name = name; }                  │
  │  Person.prototype.greet = function() { ... }                  │
  │  var p = new Person('Minh');                                   │
  │                                                              │
  │  p                    Person.prototype     Object.prototype   │
  │  ┌──────────┐        ┌──────────────┐     ┌─────────────┐   │
  │  │ name:     │  __proto__  │ greet: fn  │  __proto__│ toString  │   │
  │  │ 'Minh'   │───────→│ constructor: │───────→│ valueOf   │   │
  │  └──────────┘        │  Person      │     │ ...         │   │
  │                      └──────────────┘     └──────┬──────┘   │
  │                                                  │           │
  │                                              __proto__        │
  │                                                  │           │
  │                                                null          │
  │                                                              │
  │  p.name   → TÌM trong p → CÓ! ★                              │
  │  p.greet  → TÌM trong p → KHÔNG!                              │
  │           → TÌM trong Person.prototype → CÓ! ★               │
  │  p.toString → p → KHÔNG → Person.prototype → KHÔNG           │
  │             → Object.prototype → CÓ! ★                       │
  │                                                              │
  │  ★ Đây là PROTOTYPE CHAIN! ★★★                                 │
  │  ★ new tạo liên kết p.__proto__ = Person.prototype! ★       │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §5. Câu Hỏi Phỏng Vấn!

```
  CÂU HỎI:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  ❓ 1: new làm gì?                                                │
  │  → 4 bước: tạo obj → link prototype → call constructor      │
  │    → xử lý return! ★                                         │
  │                                                              │
  │  ❓ 2: Constructor return object thì sao?                        │
  │  → new DÙNG object đó! Bỏ instance! ★★★                     │
  │  → instanceof = false! ❌                                     │
  │  → Nhưng return primitive → BỎ QUA! Trả instance! ★         │
  │                                                              │
  │  ❓ 3: Tại sao cần prototype linking?                            │
  │  → Để instance kế thừa methods từ prototype! ★               │
  │  → p.greet() → tìm trong prototype chain! ★                  │
  │  → instanceof kiểm tra prototype chain! ★                    │
  │                                                              │
  │  ❓ 4: new vs Object.create?                                     │
  │  → new: tạo obj + GỌI constructor (init properties!)! ★     │
  │  → Object.create: tạo obj + link prototype NHƯNG              │
  │    KHÔNG gọi constructor! ★                                   │
  │                                                              │
  │  ❓ 5: Arrow function có new được không?                         │
  │  → KHÔNG! ❌ Arrow không có [[Construct]]! ★                 │
  │  → Không có prototype! ★                                      │
  │  → TypeError: is not a constructor! ★                         │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## §6. 3 Phiên Bản Tiến Hóa!

### V1.0 — ES5 Classic (arguments!)

```javascript
// ═══════════════════════════════════════════════════════════
// V1: ES5 — dùng arguments (pseudo-array!) ★
// ═══════════════════════════════════════════════════════════

function objectFactory() {
  // ★ arguments = pseudo-array! Không có shift()!
  // → Mượn Array.prototype.shift bằng call! ★

  // Bước 1: Lấy constructor (arg đầu tiên!)
  var Constructor = [].shift.call(arguments);
  // ★ shift.call LÀM 2 VIỆC:
  // ① Lấy arguments[0] = Constructor
  // ② Xóa nó khỏi arguments → arguments chỉ còn params! ★

  // Bước 2: Tạo obj + link prototype!
  var obj = new Object();
  obj.__proto__ = Constructor.prototype;
  // ★ __proto__ = non-standard nhưng browser hỗ trợ!
  // ★ Hiệu năng THẤP hơn Object.create! ❌

  // Bước 3: Bind this + chạy!
  var result = Constructor.apply(obj, arguments);
  // ★ arguments lúc này đã bị shift → chỉ còn params! ★

  // Bước 4: Xử lý return!
  // ★ LỖ HỔNG: typeof function !== 'object'! ❌
  return typeof result === "object" && result !== null ? result : obj;
}

// ═══════════════════════════════════════════════════════════
// GIẢI THÍCH [].shift.call(arguments):
// ═══════════════════════════════════════════════════════════
// arguments = { 0: Person, 1: 'Minh', 2: 25, length: 3 }
// ★ Không phải Array thật! Không có .shift()!
//
// [].shift = Array.prototype.shift (mượn method!)
// .call(arguments) = gọi shift TRÊN arguments!
//
// SAU shift:
// Constructor = Person
// arguments = { 0: 'Minh', 1: 25, length: 2 } ★
```

```
  [].shift.call(arguments):
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  TRƯỚC shift:                                                   │
  │  arguments = { 0: Person, 1: 'Minh', 2: 25, length: 3 }    │
  │                  ↑                                            │
  │              shift lấy cái này!                                │
  │                                                              │
  │  SAU shift:                                                      │
  │  Constructor = Person ★                                        │
  │  arguments = { 0: 'Minh', 1: 25, length: 2 } ★              │
  │                                                              │
  │  ★ arguments là pseudo-array (có length, có index)!          │
  │  ★ KHÔNG có .push, .shift, .map...!                           │
  │  ★ Dùng [].method.call(arguments) để MƯỢN! ★★★              │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

### V2.0 — ES6 Modern (Object.create + rest params!)

```javascript
// ═══════════════════════════════════════════════════════════
// V2: ES6 — Object.create + ...args! ★
// ═══════════════════════════════════════════════════════════

function objectFactory(Constructor) {
  // ★ ...args thay arguments! Dễ đọc hơn!
  var args = [];
  for (var i = 1; i < arguments.length; i++) {
    args.push(arguments[i]);
  }

  // ★ Object.create = tạo obj VỚI prototype SẴN!
  // → Không cần gán __proto__ sau! ★
  // → NHANH HƠN vì V8 tối ưu khi tạo! ★
  var obj = Object.create(Constructor.prototype);

  // Chạy constructor!
  var result = Constructor.apply(obj, args);

  // ★ VẪN CÒN LỖ HỔNG: return function bị bỏ sót! ❌
  return typeof result === "object" && result !== null ? result : obj;
}
```

```
  __proto__ vs Object.create:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  CÁCH 1: __proto__ (CHẬM!) ❌                                  │
  │  var obj = {};                     ← tạo với prototype mặc định│
  │  obj.__proto__ = Constructor.prototype; ← SỬA prototype! ★  │
  │  → V8 phải thay đổi hidden class!                            │
  │  → Tốn hiệu năng! ❌ ★                                      │
  │                                                              │
  │  CÁCH 2: Object.create (NHANH!) ✅ ★                          │
  │  var obj = Object.create(Constructor.prototype); ← TẠO với  │
  │  → prototype ĐÚNG ngay từ đầu! ★                             │
  │  → V8 tối ưu! ✅                                              │
  │  → Chuẩn ES5+! ✅                                             │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

### V3.0 — King's Version (hoàn hảo!) ★★★

```javascript
// ═══════════════════════════════════════════════════════════
// V3: KING — xử lý MỌI edge case! ★★★
// ═══════════════════════════════════════════════════════════

function objectFactory(Constructor) {
  // ★ KIỂM TRA: Constructor phải là function!
  if (typeof Constructor !== "function") {
    throw new TypeError(Constructor + " không phải là constructor!");
  }

  // Lấy args (không dùng ...args để tương thích ES5!)
  var args = [];
  for (var i = 1; i < arguments.length; i++) {
    args.push(arguments[i]);
  }

  // Bước 1: Tạo obj + link prototype!
  var obj = Object.create(Constructor.prototype);

  // Bước 2: Bind this + chạy!
  var result = Constructor.apply(obj, args);

  // Bước 3: XỬ LÝ HOÀN HẢO! ★★★
  // ★ LỖ HỔNG V1/V2: typeof function === 'function' (KHÔNG phải 'object'!)
  // → V1/V2 bỏ sót function → return obj sai! ❌
  // → V3 kiểm tra CẢ object VÀ function! ✅ ★★★
  var isObject = typeof result === "object" && result !== null;
  var isFunction = typeof result === "function";

  return isObject || isFunction ? result : obj;
}

// ═══════════════════════════════════════════════════════════
// TEST: Chứng minh V3 xử lý đúng function return!
// ═══════════════════════════════════════════════════════════

function Factory() {
  return function () {
    console.log("Tôi là function!");
  };
}

// V1/V2 (SAI!):
// typeof function === 'function' !== 'object'
// → return obj! ❌ (sai! phải return function!)

// V3 (ĐÚNG!):
var test = objectFactory(Factory);
console.log(typeof test); // 'function' ✅ ★
test(); // 'Tôi là function!' ✅
```

```
  3 PHIÊN BẢN:
  ┌──────────────────┬──────────────────┬──────────────┬──────────────┐
  │ Tiêu chí        │ V1 (ES5) ★       │ V2 (ES6) ★★ │ V3 (King) ★★★│
  ├──────────────────┼──────────────────┼──────────────┼──────────────┤
  │ Lấy args         │ [].shift.call!   │ ...args      │ arguments    │
  │ Link prototype   │ __proto__ ❌     │ Object.create│ Object.create│
  │ Return object    │ ✅               │ ✅           │ ✅           │
  │ Return function  │ ❌ BỎ SÓT! ★    │ ❌ BỎ SÓT!  │ ✅ ★★★       │
  │ Return null      │ ✅ (bỏ qua!)    │ ✅           │ ✅           │
  │ Param validation │ ❌               │ ❌           │ ✅ TypeError │
  │ Hiệu năng       │ Thấp (proto!)   │ Cao ★        │ Cao ★        │
  │ Phỏng vấn       │ Đạt! ★          │ Tốt! ★★     │ Xuất sắc! ★★★│
  └──────────────────┴──────────────────┴──────────────┴──────────────┘

  LỖ HỔNG V1/V2:
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  typeof result === 'object'                                    │
  │                                                              │
  │  typeof {}         → 'object' ✅                              │
  │  typeof []         → 'object' ✅                              │
  │  typeof null       → 'object' (nhưng check !== null!) ✅     │
  │  typeof function   → 'function' ★ (KHÔNG phải 'object'!)    │
  │                                                              │
  │  → V1/V2: return function bị bỏ sót! ❌                      │
  │  → V3: thêm typeof === 'function' → FIX! ✅ ★★★              │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```
