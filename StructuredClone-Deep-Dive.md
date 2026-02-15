# structuredClone — Modern Deep Copy — Deep Dive

> 📅 2026-02-12 · ⏱ 8 phút đọc
>
> JavaScript đã có native method cho deep copy: `structuredClone`.
> So sánh với spread, JSON.parse/stringify, lodash cloneDeep.
> Supported types, limitations, bundle size.
> Độ khó: ⭐️⭐️⭐️ | Chủ đề: JavaScript / API

---

## Mục Lục

0. [structuredClone là gì?](#0-structuredclone)
1. [Tại sao KHÔNG dùng spread / Object.assign?](#1-spread)
2. [Tại sao KHÔNG dùng JSON.parse(JSON.stringify)?](#2-json)
3. [Tại sao KHÔNG dùng lodash cloneDeep?](#3-lodash)
4. [structuredClone KHÔNG clone được gì?](#4-limitations)
5. [Danh sách supported types](#5-supported)
6. [Tóm Tắt & Câu Hỏi Phỏng Vấn](#6-tóm-tắt)

---

## 0. structuredClone là gì?

### Native deep copy — built-in JavaScript runtime

```javascript
const calendarEvent = {
  title: "前端修罗场",
  date: new Date(123),
  attendees: ["Steve"],
};

const copied = structuredClone(calendarEvent);

copied.attendees; // ["Steve"]
copied.date; // Date: Wed Dec 31 1969
calendarEvent.attendees === copied.attendees; // false ← KHÁC reference!
```

```
structuredClone — CAPABILITIES:
═══════════════════════════════════════════════════════════════

  ✅ Clone nested objects & arrays (vô hạn depth)
  ✅ Clone circular references (tham chiếu vòng)
  ✅ Clone Date, Set, Map, Error, RegExp
  ✅ Clone ArrayBuffer, Blob, File, ImageData
  ✅ Transfer transferable objects
  ✅ NATIVE — không cần install thư viện!
  ✅ Available: browsers + Node.js + Deno
```

### Ví dụ phức tạp

```javascript
const kitchenSink = {
  set: new Set([1, 3, 3]),
  map: new Map([[1, 2]]),
  regex: /foo/,
  deep: { array: [new File(someBlobData, "file.txt")] },
  error: new Error("Hello!"),
};

// Circular reference
kitchenSink.circular = kitchenSink;

// ✅ TẤT CẢ đều được clone!
const clonedSink = structuredClone(kitchenSink);

clonedSink.set; // Set {1, 3}     ← Set nguyên vẹn!
clonedSink.map; // Map {1 => 2}   ← Map nguyên vẹn!
clonedSink.regex; // /foo/           ← RegExp nguyên vẹn!
clonedSink.error; // Error: Hello!   ← Error nguyên vẹn!
clonedSink.circular === clonedSink; // true ← Circular OK!
```

---

## 1. Tại sao KHÔNG dùng spread / Object.assign?

### Spread / Object.assign = SHALLOW copy

```javascript
const calendarEvent = {
  title: "前端修罗场",
  date: new Date(123),
  attendees: ["Steve"],
};

// Spread operator — SHALLOW copy
const shallowCopy = { ...calendarEvent };

shallowCopy.attendees.push("Bob");
shallowCopy.date.setTime(456);

// ❌ BUG! Original bị thay đổi!
calendarEvent.attendees; // ["Steve", "Bob"] ← BỊ PUSH!
calendarEvent.date; // Date(456)        ← BỊ SET!
```

```
SHALLOW COPY — VẤN ĐỀ:
═══════════════════════════════════════════════════════════════

  Spread / Object.assign / Object.create:
  → CHỈ copy layer ĐẦU TIÊN (primitives OK)
  → Nested objects/arrays = SHARED REFERENCE!

  ┌─────────────────────────────────────────────────────┐
  │ original.title ──── "前端修罗场"                     │
  │ original.date  ──┐                                  │
  │                   ├── Date(123)  ← SHARED!          │
  │ shallow.date   ──┘                                  │
  │ original.attendees ──┐                              │
  │                      ├── ["Steve"] ← SHARED!        │
  │ shallow.attendees  ──┘                              │
  └─────────────────────────────────────────────────────┘

  → Sửa shallow.attendees → original CŨNG BỊ SỬA!
  → Đây là bug RẤT KHÓ DEBUG trong production!

  KHI NÀO DÙNG SHALLOW COPY?
  → Chỉ khi object PHẲNG (flat) — không có nested objects
  → const simple = { title: "hi", count: 1 }
  → const copy = { ...simple }  ← OK!
```

---

## 2. Tại sao KHÔNG dùng JSON.parse(JSON.stringify)?

### Date → string, Set/Map → {}

```javascript
const calendarEvent = {
  title: "前端修罗场",
  date: new Date(123),
  attendees: ["Steve"],
};

const problematicCopy = JSON.parse(JSON.stringify(calendarEvent));
```

```javascript
// KẾT QUẢ:
{
    title: "前端修罗场",
    date: "1970-01-01T00:00:00.123Z",  // ❌ String, KHÔNG PHẢI Date!
    attendees: ["Steve"]
}
```

### Complex types → {} hoặc mất

```javascript
const kitchenSink = {
  set: new Set([1, 3, 3]),
  map: new Map([[1, 2]]),
  regex: /foo/,
  deep: { array: [new File(someBlobData, "file.txt")] },
  error: new Error("Hello!"),
};

JSON.parse(JSON.stringify(kitchenSink));
```

```javascript
// KẾT QUẢ — THẢM HỌA:
{
    "set": {},        // ❌ Set → rỗng!
    "map": {},        // ❌ Map → rỗng!
    "regex": {},      // ❌ RegExp → rỗng!
    "deep": {
        "array": [{}] // ❌ File → rỗng!
    },
    "error": {}       // ❌ Error → rỗng!
}
```

```
JSON.parse(JSON.stringify) — 5 VẤN ĐỀ:
═══════════════════════════════════════════════════════════════

  ┌──────────────────┬─────────────────────────────────────┐
  │ Type             │ Kết quả JSON                       │
  ├──────────────────┼─────────────────────────────────────┤
  │ Date             │ → String (mất Date object!)        │
  │ Set              │ → {} (mất toàn bộ data!)           │
  │ Map              │ → {} (mất toàn bộ data!)           │
  │ RegExp           │ → {} (mất pattern!)                │
  │ Error            │ → {} (mất message!)                │
  │ File / Blob      │ → {} (mất data!)                   │
  │ undefined        │ → biến mất hoàn toàn!              │
  │ Function         │ → biến mất hoàn toàn!              │
  │ Symbol           │ → biến mất hoàn toàn!              │
  │ BigInt           │ → ❌ TypeError (crash!)             │
  │ Circular ref     │ → ❌ TypeError (crash!)             │
  └──────────────────┴─────────────────────────────────────┘

  KHI NÀO DÙNG JSON?
  → Chỉ khi data chỉ có primitives + plain objects + arrays
  → Không có Date, Set, Map, Function, undefined, circular
  → Performance tốt cho simple data!
```

---

## 3. Tại sao KHÔNG dùng lodash cloneDeep?

### Hoạt động đúng, nhưng...

```javascript
import cloneDeep from "lodash/cloneDeep";

const calendarEvent = {
  title: "前端修罗场",
  date: new Date(123),
  attendees: ["Steve"],
};

const clonedEvent = cloneDeep(calendarEvent); // ✅ Đúng!
```

### Vấn đề: BUNDLE SIZE!

```
LODASH cloneDeep — BUNDLE SIZE:
═══════════════════════════════════════════════════════════════

  import cloneDeep from 'lodash/cloneDeep':
  → 17.4 KB minified (5.3 KB gzip)
  → Chỉ cho 1 function!

  import { cloneDeep } from 'lodash':
  → Nếu tree-shaking KHÔNG hoạt động (thường xảy ra):
  → TOÀN BỘ lodash = ~25 KB gzip!!!

  vs structuredClone:
  → 0 KB — BUILT-IN trong JavaScript runtime!
  → Không cần install, không cần import
  → Không tăng bundle size!

  ┌─────────────────────────┬───────────┬──────────────────┐
  │ Method                  │ Bundle    │ Cần install?     │
  ├─────────────────────────┼───────────┼──────────────────┤
  │ structuredClone         │ 0 KB      │ Không (native)   │
  │ lodash/cloneDeep        │ 5.3 KB gz │ Có (npm install) │
  │ lodash (full)           │ ~25 KB gz │ Có               │
  │ JSON.parse/stringify    │ 0 KB      │ Không (native)   │
  └─────────────────────────┴───────────┴──────────────────┘
```

---

## 4. structuredClone KHÔNG clone được gì?

### 5 điều KHÔNG THỂ clone

```javascript
// ❌ 1. Functions — DataCloneError!
structuredClone({ fn: () => {} });
// → Throws DataCloneError

// ❌ 2. DOM Nodes — DataCloneError!
structuredClone({ el: document.body });
// → Throws DataCloneError

// ❌ 3. Property Descriptors (getters/setters)
structuredClone({
  get foo() {
    return "bar";
  },
});
// → { foo: 'bar' }   ← Giá trị được clone, getter thì KHÔNG!

// ❌ 4. Prototype chain
class MyClass {
  foo = "bar";
  myMethod() {
    /* ... */
  }
}
const myClass = new MyClass();
const cloned = structuredClone(myClass);
// → { foo: 'bar' }           ← Properties OK
// cloned instanceof MyClass   → false  ← Prototype MẤT!
// cloned.myMethod             → undefined ← Method MẤT!

// ❌ 5. Symbol
structuredClone({ [Symbol("key")]: "value" });
// → {} ← Symbol key bị bỏ qua!
```

```
LIMITATIONS — TẠI SAO?
═══════════════════════════════════════════════════════════════

  structuredClone dùng "Structured Clone Algorithm"
  → Được thiết kế cho DATA transfer (postMessage, IndexedDB)
  → KHÔNG phải cho code transfer

  Function: code = executable → KHÔNG phải data → ❌
  DOM Node: bind vào document → KHÔNG serialize được → ❌
  Getter/Setter: metadata, không phải data → chỉ clone VALUE
  Prototype: class definition, không phải data → ❌
  Symbol: unique identity, không serialize → ❌

  → structuredClone clone DATA, KHÔNG clone BEHAVIOR!
```

---

## 5. Danh sách Supported Types

### Built-in JS Types ✅

```
SUPPORTED JS TYPES:
═══════════════════════════════════════════════════════════════

  Primitives:
  ✅ number, string, boolean, null, undefined, BigInt
  ❌ Symbol (KHÔNG hỗ trợ)

  Objects:
  ✅ Object (plain objects only, e.g. { a: 1 })
  ✅ Array
  ✅ Map
  ✅ Set
  ✅ Date
  ✅ RegExp
  ✅ ArrayBuffer
  ✅ DataView
  ✅ TypedArray (Uint8Array, Float32Array, ...)
  ✅ Boolean (object wrapper)

  Error Types:
  ✅ Error, EvalError, RangeError, ReferenceError
  ✅ SyntaxError, TypeError, URIError

  ❌ Function, Symbol, DOM nodes, getters/setters, prototype
```

### Web/API Types ✅

```
SUPPORTED WEB/API TYPES:
═══════════════════════════════════════════════════════════════

  ✅ Blob
  ✅ File
  ✅ FileList
  ✅ ImageData
  ✅ ImageBitmap
  ✅ AudioData
  ✅ VideoFrame
  ✅ CryptoKey
  ✅ RTCCertificate

  ✅ DOMException
  ✅ DOMMatrix / DOMMatrixReadOnly
  ✅ DOMPoint / DOMQuad / DOMRect

  ✅ FileSystemDirectoryHandle
  ✅ FileSystemFileHandle
  ✅ FileSystemHandle
```

### Browser Support

```
BROWSER SUPPORT (2024+):
═══════════════════════════════════════════════════════════════

  ✅ Chrome 98+        (Feb 2022)
  ✅ Firefox 94+       (Nov 2021)
  ✅ Safari 15.4+      (Mar 2022)
  ✅ Edge 98+          (Feb 2022)
  ✅ Node.js 17+       (Oct 2021)
  ✅ Deno 1.14+        (Sep 2021)

  → >95% global browser coverage (2024)
  → An toàn để dùng trong production!
  → Web Workers: support còn hạn chế
```

---

## 6. Tóm Tắt

### So sánh 4 phương pháp deep copy

```
4 DEEP COPY METHODS — COMPARISON:
═══════════════════════════════════════════════════════════════

  ┌──────────────────┬────────┬────────┬────────┬────────────┐
  │ Feature          │Spread  │ JSON   │Lodash  │structClone │
  ├──────────────────┼────────┼────────┼────────┼────────────┤
  │ Deep copy        │ ❌     │ ✅     │ ✅     │ ✅          │
  │ Circular ref     │ ❌     │ ❌     │ ✅     │ ✅          │
  │ Date             │ ref ⚠️ │ string❌│ ✅     │ ✅          │
  │ Set / Map        │ ref ⚠️ │ {} ❌  │ ✅     │ ✅          │
  │ RegExp           │ ref ⚠️ │ {} ❌  │ ✅     │ ✅          │
  │ Error            │ ref ⚠️ │ {} ❌  │ ✅     │ ✅          │
  │ File / Blob      │ ref ⚠️ │ {} ❌  │ ⚠️     │ ✅          │
  │ Function         │ ref    │ mất ❌ │ ref    │ ❌ Error    │
  │ Symbol           │ ❌     │ mất ❌ │ ✅     │ ❌          │
  │ BigInt           │ ref    │ Error❌│ ✅     │ ✅          │
  │ undefined        │ ref    │ mất ❌ │ ✅     │ ✅          │
  │ Prototype chain  │ ❌     │ ❌     │ ✅     │ ❌          │
  ├──────────────────┼────────┼────────┼────────┼────────────┤
  │ Bundle size      │ 0 KB   │ 0 KB   │ 5.3KB  │ 0 KB       │
  │ Native           │ ✅     │ ✅     │ ❌     │ ✅          │
  │ Performance      │ fast   │ fast   │ medium │ fast        │
  └──────────────────┴────────┴────────┴────────┴────────────┘

  KHUYẾN NGHỊ:
  → Flat object: Spread { ...obj }
  → Simple data (no Date/Set/Map): JSON.parse(JSON.stringify)
  → Complex data: structuredClone ⭐ (RECOMMENDED)
  → Cần clone prototype/Symbol: lodash cloneDeep
```

### Decision Tree

```
CHỌN METHOD NÀO?
═══════════════════════════════════════════════════════════════

  Object có nested?
  ├── KHÔNG → Spread / Object.assign ✅
  └── CÓ →
      Data chỉ có primitives + plain objects?
      ├── CÓ → JSON.parse(JSON.stringify) ✅ (fastest)
      └── KHÔNG →
          Cần clone Function / Symbol / Prototype?
          ├── CÓ → lodash cloneDeep
          └── KHÔNG → structuredClone ⭐ (BEST CHOICE)
```

### Quick Reference

```
structuredClone — QUICK REF:
═══════════════════════════════════════════════════════════════

  SYNTAX:    structuredClone(value)
  NATIVE:    Built-in, 0 KB bundle, no import needed
  SUPPORTS:  Date, Set, Map, RegExp, Error, Blob, File,
             BigInt, undefined, circular references
  CANNOT:    Function, Symbol, DOM, getter/setter, prototype
  THROWS:    DataCloneError khi gặp unsupported type
  ALGORITHM: Structured Clone Algorithm (same as postMessage)
  SUPPORT:   Chrome 98+, Firefox 94+, Safari 15.4+, Node 17+
```

### Câu Hỏi Phỏng Vấn

**1. structuredClone là gì? Tại sao nên dùng thay các method cũ?**

> `structuredClone` là **native JavaScript API** (2021+) thực hiện deep copy. Dùng **Structured Clone Algorithm** (cùng algorithm với `postMessage`, IndexedDB). Ưu hơn spread (shallow only), JSON (mất Date/Set/Map/circular), lodash (17.4KB bundle). Hỗ trợ Date, Set, Map, RegExp, Error, Blob, File, BigInt, circular references, undefined. Không cần install, **0 KB** bundle size.

**2. structuredClone không clone được gì? Tại sao?**

> 5 thứ: ① **Function** (executable code, không phải data — throw DataCloneError), ② **DOM nodes** (bind vào document), ③ **Property descriptors** (getter/setter — chỉ clone giá trị, không clone function), ④ **Prototype chain** (class methods mất, instanceof = false), ⑤ **Symbol** (unique identity, không serialize). Nguyên nhân: algorithm thiết kế cho **data transfer**, không phải code transfer.

**3. Khi nào dùng JSON.parse/stringify thay vì structuredClone?**

> Khi data **chỉ có primitives + plain objects + arrays** (không có Date, Set, Map, Function, undefined, circular). JSON method có **performance tốt** cho simple data và support rộng hơn (IE11). Nhưng Date → string, Set/Map → {}, undefined/Function biến mất, BigInt/circular → TypeError crash.

**4. Lodash cloneDeep có ưu điểm gì mà structuredClone không có?**

> Lodash cloneDeep clone được **prototype chain** (instanceof giữ nguyên), **Symbol keys**, và **không throw error** với Function (giữ reference). Nhược: **17.4KB** (5.3KB gzip) bundle size, cần npm install. Dùng khi cần clone class instances hoặc objects có Symbol keys.

**5. Structured Clone Algorithm được dùng ở đâu ngoài structuredClone?**

> **postMessage** (Web Workers, iframes), **IndexedDB** (store/retrieve), **History API** (`history.pushState`), **Notification API**. Algorithm giống nhau → cùng limitations (no Function, no DOM, no Symbol).

---

## Checklist Học Tập

- [ ] structuredClone = native deep copy API (2021+, 0 KB bundle)
- [ ] Spread / Object.assign = SHALLOW copy (nested = shared reference)
- [ ] JSON.parse/stringify: Date→string, Set/Map→{}, no circular/BigInt
- [ ] lodash cloneDeep: 17.4KB bundle, clone prototype + Symbol
- [ ] structuredClone clone: Date, Set, Map, RegExp, Error, Blob, File
- [ ] structuredClone KHÔNG clone: Function, Symbol, DOM, getter, prototype
- [ ] DataCloneError khi gặp unsupported types (Function, DOM)
- [ ] Getter → chỉ clone VALUE, không clone getter function
- [ ] Class instance → properties OK, instanceof = false, methods mất
- [ ] Structured Clone Algorithm = postMessage, IndexedDB dùng cùng algo
- [ ] Browser support: Chrome 98+, Firefox 94+, Safari 15.4+, Node 17+
- [ ] Decision: flat → spread, simple → JSON, complex → structuredClone

---

_Cập nhật lần cuối: Tháng 2, 2026_
