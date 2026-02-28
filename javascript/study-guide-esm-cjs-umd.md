# Hướng Dẫn Học Tập: ESM, CommonJS và UMD

## Tổng Quan

Trong JavaScript, có ba hệ thống module chính được sử dụng để tổ chức và chia sẻ code: **ESM** (ES Modules), **CommonJS** (thường viết tắt là CJS), và **UMD** (Universal Module Definition). Mỗi hệ thống có đặc điểm, ưu nhược điểm riêng và phù hợp với các môi trường khác nhau.

---

## 1. ESM (ES Modules)

### Định Nghĩa
ESM là hệ thống module được giới thiệu trong ES6 (ECMAScript 2015), được hỗ trợ native bởi các trình duyệt hiện đại và Node.js. Đây là chuẩn module chính thức của JavaScript.

### Đặc Điểm Chính
- **Xác định dependencies tại thời điểm compile** (compile-time)
- Sử dụng cú pháp `import` và `export`
- Hỗ trợ phân tích tĩnh (static analysis)
- Module được load bất đồng bộ (asynchronous)

### Môi Trường Hoạt Động

#### Trình duyệt:
```html
<script type="module">
  import { myFunction } from './module.js';
</script>
```

#### Node.js:
- Sử dụng file có đuôi `.mjs`
- Hoặc cấu hình trong `package.json`:
```json
{
  "type": "module"
}
```

### Cú Pháp

#### Export:
```javascript
// Named exports
export const name = 'ESM';
export function greet() {
  return 'Hello from ESM';
}

// Default export
export default class MyClass {
  constructor() {
    this.type = 'ESM';
  }
}
```

#### Import:
```javascript
// Import named exports
import { name, greet } from './module.js';

// Import default export
import MyClass from './module.js';

// Import tất cả
import * as myModule from './module.js';

// Import động (dynamic import)
const module = await import('./module.js');
```

### ✅ Ưu Điểm

1. **Hỗ trợ Tree Shaking**: Nhờ phân tích tĩnh, các bundler có thể loại bỏ code không sử dụng, giảm kích thước bundle
2. **Hỗ trợ native trên trình duyệt**: Không cần công cụ đóng gói trong môi trường development
3. **Tối ưu hóa tốt hơn**: Compiler có thể tối ưu code hiệu quả hơn
4. **Hỗ trợ circular references**: Module chỉ được load một lần và lưu trong cache
5. **Async loading**: Không block việc thực thi code khác
6. **Chuẩn chính thức**: Là tương lai của JavaScript module system

### ❌ Nhược Điểm

1. **Không tương thích với trình duyệt cũ**: Cần transpile qua Webpack/Babel cho các trình duyệt cũ
2. **Vấn đề tương thích với CommonJS**: Khi sử dụng trong Node.js, cần xử lý cẩn thận khi tương tác với CommonJS
3. **Cấu hình phức tạp hơn**: Đặc biệt trong môi trường Node.js khi mix với CommonJS

### Ví Dụ Thực Tế

```javascript
// math.js
export function add(a, b) {
  return a + b;
}

export function subtract(a, b) {
  return a - b;
}

export const PI = 3.14159;

// main.js
import { add, PI } from './math.js';

console.log(add(5, 3)); // 8
console.log(PI); // 3.14159
```

---

## 2. CommonJS (CJS)

### Định Nghĩa
CommonJS là hệ thống module mặc định của Node.js, được thiết kế chủ yếu cho môi trường server-side. Dependencies được xác định tại runtime và module được load đồng bộ (synchronous).

### Đặc Điểm Chính
- **Xác định dependencies tại runtime**
- Sử dụng `require()` và `module.exports`
- Load module đồng bộ (synchronous) - sẽ block execution
- Mỗi file là một module riêng biệt

### Môi Trường Hoạt Động

#### Node.js:
- Hỗ trợ native, không cần cấu hình
- File có đuôi `.js` (mặc định) hoặc `.cjs`

#### Trình duyệt:
- Cần đóng gói qua Webpack, Browserify, hoặc các bundler khác

### Cú Pháp

#### Export:
```javascript
// Cách 1: Export từng phần
exports.name = 'CommonJS';
exports.greet = function() {
  return 'Hello from CommonJS';
};

// Cách 2: Export toàn bộ object
module.exports = {
  name: 'CommonJS',
  greet: function() {
    return 'Hello from CommonJS';
  }
};

// Cách 3: Export một giá trị duy nhất
module.exports = class MyClass {
  constructor() {
    this.type = 'CommonJS';
  }
};
```

#### Import:
```javascript
// Import toàn bộ module
const myModule = require('./module');

// Destructuring
const { name, greet } = require('./module');

// Import class hoặc function
const MyClass = require('./module');
```

### ✅ Ưu Điểm

1. **Hỗ trợ mặc định trong Node.js**: Không cần cấu hình gì thêm
2. **Đơn giản và dễ sử dụng**: Cú pháp trực quan, dễ hiểu
3. **Ecosystem lớn**: Hầu hết các package trên npm đều hỗ trợ CommonJS
4. **Dynamic require**: Có thể require module dựa trên điều kiện runtime

### ❌ Nhược Điểm

1. **Không phù hợp với trình duyệt**: Load đồng bộ gây blocking, ảnh hưởng performance
2. **Không hỗ trợ Tree Shaking**: Không thể phân tích tĩnh để loại bỏ code không dùng
3. **Không phải chuẩn chính thức**: Chỉ là convention, không phải ES standard
4. **Khó tối ưu hóa**: Bundler khó tối ưu code CommonJS

### Ví Dụ Thực Tế

```javascript
// math.js
function add(a, b) {
  return a + b;
}

function subtract(a, b) {
  return a - b;
}

const PI = 3.14159;

module.exports = {
  add,
  subtract,
  PI
};

// main.js
const math = require('./math');
// hoặc
const { add, PI } = require('./math');

console.log(add(5, 3)); // 8
console.log(PI); // 3.14159
```

---

## 3. UMD (Universal Module Definition)

### Định Nghĩa
UMD là một pattern cho phép module hoạt động trong nhiều môi trường khác nhau: ESM, CommonJS, AMD và browser globals. Nó tự động phát hiện môi trường và chọn phương thức export phù hợp.

### Đặc Điểm Chính
- **Tương thích đa môi trường**: Browser, Node.js, AMD
- Tự động detect và adapt theo môi trường
- Thường được sử dụng cho library development

### Cấu Trúc UMD

```javascript
(function (root, factory) {
  // Kiểm tra AMD (RequireJS)
  if (typeof define === 'function' && define.amd) {
    define(['jquery'], factory);
  } 
  // Kiểm tra CommonJS
  else if (typeof exports === 'object') {
    module.exports = factory(require('jquery'));
  }
  // Browser global variables
  else {
    root.MyLib = factory(root.jQuery);
  }
}(typeof self !== 'undefined' ? self : this, function ($) {
  // Logic của module
  return {
    name: 'UMD',
    version: '1.0.0',
    greet: function() {
      return 'Hello from UMD';
    }
  };
}));
```

### Môi Trường Hoạt Động

#### Trình duyệt:
```html
<!-- Cách 1: Script tag trực tiếp -->
<script src="mylib.js"></script>
<script>
  console.log(MyLib.name); // 'UMD'
</script>

<!-- Cách 2: Qua AMD loader (RequireJS) -->
<script>
  require(['mylib'], function(MyLib) {
    console.log(MyLib.name);
  });
</script>
```

#### Node.js:
```javascript
const MyLib = require('./mylib');
console.log(MyLib.name); // 'UMD'
```

### ✅ Ưu Điểm

1. **Tương thích đa nền tảng**: Hoạt động được ở mọi môi trường (browser/Node.js/AMD)
2. **Lý tưởng cho library development**: Các thư viện như jQuery, Lodash, Moment.js sử dụng UMD
3. **Không cần build riêng**: Một file có thể chạy ở nhiều môi trường
4. **Backward compatibility**: Hỗ trợ cả hệ thống cũ và mới

### ❌ Nhược Điểm

1. **Code dài dòng**: Chứa nhiều logic kiểm tra môi trường, làm tăng kích thước file
2. **Không tận dụng được tối ưu của ESM**: Không hỗ trợ Tree Shaking và static analysis
3. **Khó maintain**: Code phức tạp hơn, khó đọc và debug
4. **Không còn cần thiết**: Với sự phổ biến của ESM và các build tools hiện đại, UMD ít cần thiết hơn

### Ví Dụ Thực Tế

```javascript
// mylib.umd.js
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD
    define([], factory);
  }else if (typeof module === 'object' && module.exports) {
    // CommonJS
    module.exports = factory();
  } else {
    // Browser globals
    root.MyMath = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  
  function add(a, b) {
    return a + b;
  }
  
  function subtract(a, b) {
    return a - b;
  }
  
  const PI = 3.14159;
  
  // Public API
  return {
    add: add,
    subtract: subtract,
    PI: PI
  };
}));
```

---

## So Sánh Tổng Quan

| Tiêu Chí | ESM | CommonJS | UMD |
|----------|-----|----------|-----|
| **Cú pháp** | `import`/`export` | `require()`/`module.exports` | Wrapper function |
| **Load timing** | Compile-time | Runtime | Runtime |
| **Load type** | Async | Sync | Tùy môi trường |
| **Tree Shaking** | ✅ Có | ❌ Không | ❌ Không |
| **Browser native** | ✅ Có | ❌ Không | ✅ Có |
| **Node.js native** | ✅ Có (từ v12+) | ✅ Có | ✅ Có |
| **Static analysis** | ✅ Có | ❌ Không | ❌ Không |
| **Kích thước code** | Nhỏ | Nhỏ | Lớn (do wrapper) |
| **Use case** | Modern apps | Node.js apps | Libraries |
| **Tương lai** | ✅ Chuẩn chính thức | ⚠️ Legacy | ⚠️ Ít cần thiết |

---

## Khi Nào Sử Dụng Gì?

### Sử dụng ESM khi:
- ✅ Bắt đầu dự án mới
- ✅ Cần Tree Shaking để tối ưu bundle size
- ✅ Làm việc với modern frameworks (React, Vue, Svelte)
- ✅ Target là trình duyệt hiện đại hoặc Node.js mới

### Sử dụng CommonJS khi:
- ✅ Làm việc với Node.js legacy code
- ✅ Dự án Node.js thuần không cần chạy trên browser
- ✅ Cần tương thích với ecosystem npm cũ
- ✅ Sử dụng các package chỉ hỗ trợ CommonJS

### Sử dụng UMD khi:
- ✅ Phát triển library cần hỗ trợ nhiều môi trường
- ✅ Cần backward compatibility với hệ thống cũ
- ✅ Muốn library có thể dùng trực tiếp qua `<script>` tag
- ⚠️ Lưu ý: Ngày nay, nhiều library chọn cách build riêng ESM và CJS thay vì dùng UMD

---

## Migration Path (Lộ Trình Chuyển Đổi)

### Từ CommonJS sang ESM:

```javascript
// CommonJS (CỦ)
const express = require('express');
const { readFile } = require('fs');
module.exports = { myFunction };

// ESM (MỚI)
import express from 'express';
import { readFile }from 'fs';
export { myFunction };
```

**Các bước:**
1. Thêm `"type": "module"` vào `package.json`
2. Đổi `require()` thành `import`
3. Đổi `module.exports` thành `export`
4. Đổi `__dirname` và `__filename` (không có sẵn trong ESM)

```javascript
// Thay thế __dirname và __filename trong ESM
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
```

---

## Best Practices (Thực Hành Tốt Nhất)

### ESM:
1. ✅ Luôn dùng file extension trong import: `import './module.js'`
2. ✅ Đặt import statements ở đầu file
3. ✅ Sử dụng named exports thay vì default exports khi có thể
4. ✅ Tận dụng dynamic imports cho code splitting

### CommonJS:
1. ✅ Cache kết quả require nếu dùng nhiều lần
2. ✅ Tránh circular dependencies
3. ✅ Sử dụng `module.exports` thay vì `exports` cho clarity

### UMD:
1. ✅ Chỉ dùng khi thực sự cần cross-environment compatibility
2. ✅ Minify code để giảm overhead của wrapper
3. ✅ Cân nhắc build riêng ESM và CJS thay vì UMD

---

## Câu Hỏi Ôn Tập

### Câu hỏi cơ bản:
1. ESM và CommonJS khác nhau ở điểm nào về thời điểm xác định dependencies?
2. Tại sao CommonJS không phù hợp với môi trường browser?
3. UMD giải quyết vấn đề gì?

### Câu hỏi nâng cao:
1. Tree Shaking hoạt động như thế nào và tại sao chỉ ESM hỗ trợ?
2. Làm thế nào để sử dụng cả ESM và CommonJS trong cùng một dự án Node.js?
3. Khi nào nên sử dụng dynamic import trong ESM?

### Đáp án gợi ý:

**Câu 1 (cơ bản):** ESM xác định dependencies tại compile-time (static), còn CommonJS xác định tại runtime (dynamic).

**Câu 2 (cơ bản):** CommonJS load module đồng bộ (synchronous), sẽ block browser rendering và gây performance issues.

**Câu 3 (cơ bản):** UMD cho phép code chạy được trên nhiều môi trường (browser, Node.js, AMD) mà không cần build riêng.

**Câu 1 (nâng cao):** Tree Shaking phân tích code tại compile-time để xác định phần nào được sử dụng. ESM hỗ trợ vì import/export là static, compiler biết chính xác gì được dùng. CommonJS dùng require() dynamic nên không thể phân tích trước.

**Câu 2 (nâng cao):** Có thể dùng file extension (`.mjs` cho ESM, `.cjs` cho CommonJS) hoặc tạo package.json riêng trong subfolder với "type" khác nhau.

**Câu 3 (nâng cao):** Dùng dynamic import khi cần lazy loading, code splitting, hoặc load module dựa trên điều kiện runtime.

---

## Tài Nguyên Học Thêm

### Documentation:
- MDN Web Docs: ES Modules
- Node.js Documentation: Modules
- Webpack Documentation: Module Methods

### Bài viết tham khảo:
- "ES modules: A cartoon deep-dive" - Lin Clark
- "Understanding ES6 Modules" - Nicholas C. Zakas
- Node.js ESM documentation

### Tools hữu ích:
- Webpack: Module bundler hỗ trợ tất cả các loại module
- Rollup: Bundler tối ưu cho ESM
- Babel: Transpiler để chuyển đổi ESM sang CommonJS

---

## Kết Luận

- **ESM** là tương lai của JavaScript modules, nên ưu tiên sử dụng cho dự án mới
- **CommonJS** vẫn quan trọng trong Node.js ecosystem, nhưng đang dần được thay thế
- **UMD** ít cần thiết hơn với sự phát triển của build tools, nhưng vẫn hữu ích cho library development

Xu hướng hiện tại là migrate sang ESM, nhưng cần hiểu cả ba để làm việc với legacy code và các library khác nhau.

---

**Chúc bạn học tốt! 🚀**