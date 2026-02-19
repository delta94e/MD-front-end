# Color Contrast & Accessibility Standards — Deep Dive!

> **Chủ đề**: How to ensure color contrast ratios meet accessibility standards
> **Ngôn ngữ**: Tiếng Việt — giải thích cực kỳ chi tiết!
> **Phương châm**: Tự viết lại bằng tay — KHÔNG dùng thư viện!

---

## Mục Lục

1. [§1. Color Contrast Là Gì? — Toán Học!](#1)
2. [§2. WCAG Contrast Requirements!](#2)
3. [§3. Tự Viết — Contrast Ratio Calculator!](#3)
4. [§4. Tự Viết — Auto Color Fixer!](#4)
5. [§5. Color Blindness — Không Chỉ Là Contrast!](#5)
6. [§6. Design System & Contrast!](#6)
7. [§7. Tự Viết — Page-Wide Contrast Auditor!](#7)
8. [§8. React & Contrast!](#8)
9. [§9. Tổng Kết & Câu Hỏi Phỏng Vấn!](#9)

---

## §1. Color Contrast Là Gì? — Toán Học!

```
  COLOR CONTRAST — NGUYÊN LÝ:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  CONTRAST RATIO = mức CHÊNH LỆCH ĐỘ SÁNG giữa       │
  │  text (foreground) và nền (background)!                │
  │                                                        │
  │  CÔNG THỨC WCAG 2.x:                                  │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  Contrast Ratio = (L1 + 0.05) / (L2 + 0.05)     │  │
  │  │                                                  │  │
  │  │  L1 = RELATIVE LUMINANCE sáng hơn                │  │
  │  │  L2 = RELATIVE LUMINANCE tối hơn                 │  │
  │  │  0.05 = hệ số tránh chia cho 0                   │  │
  │  │                                                  │  │
  │  │  → Kết quả: từ 1:1 đến 21:1                     │  │
  │  │  → 1:1 = KHÔNG contrast (cùng màu!)             │  │
  │  │  → 21:1 = MAX contrast (đen trên trắng!)        │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  RELATIVE LUMINANCE (theo WCAG):                       │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  Bước 1: Chuyển RGB (0-255) → sRGB (0-1):       │  │
  │  │    sR = R / 255                                  │  │
  │  │    sG = G / 255                                  │  │
  │  │    sB = B / 255                                  │  │
  │  │                                                  │  │
  │  │  Bước 2: Linearize (loại bỏ gamma):             │  │
  │  │    if sC <= 0.03928:                             │  │
  │  │      linearC = sC / 12.92                        │  │
  │  │    else:                                         │  │
  │  │      linearC = ((sC + 0.055) / 1.055) ^ 2.4     │  │
  │  │                                                  │  │
  │  │  Bước 3: Tính Luminance:                         │  │
  │  │    L = 0.2126 × linearR                          │  │
  │  │      + 0.7152 × linearG                          │  │
  │  │      + 0.0722 × linearB                          │  │
  │  │                                                  │  │
  │  │  → Hệ số KHÁC NHAU vì mắt nhạy MÀU XANH LÁ    │  │
  │  │    nhất (0.7152) → đỏ (0.2126) → xanh (0.0722)│  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  VÍ DỤ:                                               │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  Text: #333333 (R=51, G=51, B=51)               │  │
  │  │  sR = 51/255 = 0.2                               │  │
  │  │  → linearR = ((0.2+0.055)/1.055)^2.4 = 0.0331  │  │
  │  │  L_text = 0.2126×0.0331 + 0.7152×0.0331         │  │
  │  │         + 0.0722×0.0331 = 0.0331                │  │
  │  │                                                  │  │
  │  │  Background: #FFFFFF (R=255, G=255, B=255)       │  │
  │  │  L_bg = 1.0                                     │  │
  │  │                                                  │  │
  │  │  Ratio = (1.0 + 0.05) / (0.0331 + 0.05)         │  │
  │  │        = 1.05 / 0.0831 = 12.63:1                │  │
  │  │  → ✅ PASS AA (>4.5:1) và AAA (>7:1)!           │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §2. WCAG Contrast Requirements!

```
  WCAG 2.x CONTRAST REQUIREMENTS:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ① TEXT CONTRAST (SC 1.4.3 — Level AA):               │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  Normal text (< 18pt hoặc < 14pt bold):         │  │
  │  │  → Tối thiểu 4.5 : 1                            │  │
  │  │                                                  │  │
  │  │  Large text (≥ 18pt hoặc ≥ 14pt bold):           │  │
  │  │  → Tối thiểu 3 : 1                              │  │
  │  │                                                  │  │
  │  │  18pt = 24px = 1.5rem                            │  │
  │  │  14pt bold = 18.66px bold = ~1.17rem bold        │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ② TEXT CONTRAST (SC 1.4.6 — Level AAA):              │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  Normal text: → Tối thiểu 7 : 1                 │  │
  │  │  Large text:  → Tối thiểu 4.5 : 1               │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ③ NON-TEXT CONTRAST (SC 1.4.11 — Level AA):          │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  UI Components & graphical objects:               │  │
  │  │  → Tối thiểu 3 : 1                              │  │
  │  │                                                  │  │
  │  │  Áp dụng cho:                                    │  │
  │  │  • Border của input, button                      │  │
  │  │  • Focus indicator                               │  │
  │  │  • Icons (khi icon là CÁCH DUY NHẤT hiểu ý)     │  │
  │  │  • Charts/graphs data series                     │  │
  │  │  • Custom checkboxes, switches, sliders          │  │
  │  │                                                  │  │
  │  │  KHÔNG áp dụng:                                  │  │
  │  │  • Logos, decorative images                      │  │
  │  │  • Disabled controls                             │  │
  │  │  • Browser default controls (chưa styled)        │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  BẢNG TÓM TẮT:                                        │
  │  ┌──────────────┬───────────┬───────────┐              │
  │  │ Loại         │ AA        │ AAA       │              │
  │  ├──────────────┼───────────┼───────────┤              │
  │  │ Normal text  │ 4.5 : 1   │ 7 : 1    │              │
  │  │ Large text   │ 3 : 1     │ 4.5 : 1  │              │
  │  │ UI/Graphics  │ 3 : 1     │ —        │              │
  │  └──────────────┴───────────┴───────────┘              │
  │                                                        │
  │  ⚠️ FOCUS INDICATOR (SC 2.4.7 — Level AA):            │
  │  → Focus outline phải contrast ≥ 3:1 với:            │
  │    • Adjacent background!                             │
  │    • Unfocused state của component!                   │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

```
  MÀU PHỔ BIẾN — PASS hay FAIL?
  ┌────────────────────────────────────────────────────────┐
  │  Foreground  │ Background │ Ratio   │ AA  │ AAA       │
  │  ────────────│────────────│─────────│─────│─────      │
  │  #000000     │ #FFFFFF    │ 21 : 1  │ ✅  │ ✅        │
  │  #333333     │ #FFFFFF    │ 12.6:1  │ ✅  │ ✅        │
  │  #595959     │ #FFFFFF    │ 7.0 :1  │ ✅  │ ✅        │
  │  #767676     │ #FFFFFF    │ 4.5 :1  │ ✅  │ ❌        │
  │  #808080     │ #FFFFFF    │ 3.9 :1  │ ❌  │ ❌        │
  │  #FF0000     │ #FFFFFF    │ 4.0 :1  │ ❌  │ ❌        │
  │  #0000FF     │ #FFFFFF    │ 8.6 :1  │ ✅  │ ✅        │
  │  #008000     │ #FFFFFF    │ 5.1 :1  │ ✅  │ ❌        │
  │  #FFFF00     │ #FFFFFF    │ 1.1 :1  │ ❌  │ ❌        │
  │  #FFFFFF     │ #0066CC    │ 5.3 :1  │ ✅  │ ❌        │
  │                                                        │
  │  ⚠️ MÀU ĐỎ thuần (#FF0000) trên trắng KHÔNG đạt AA! │
  │  → Đỏ đậm hơn: #CC0000 = 5.9:1 ✅                    │
  │  ⚠️ Vàng trên trắng GẦN NHƯ VÔ HÌNH! (1.1:1)        │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

---

## §3. Tự Viết — Contrast Ratio Calculator!

```javascript
// ═══════════════════════════════════════════════════════════
// CONTRAST RATIO CALCULATOR — TỰ VIẾT!
// Theo đúng công thức WCAG 2.x!
// ═══════════════════════════════════════════════════════════

var ContrastChecker = (function () {
  // ① Chuyển HEX → RGB:
  function hexToRgb(hex) {
    hex = hex.replace("#", "");
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    return {
      r: parseInt(hex.substring(0, 2), 16),
      g: parseInt(hex.substring(2, 4), 16),
      b: parseInt(hex.substring(4, 6), 16),
    };
  }

  // ② Chuyển RGB → sRGB → Linear:
  function linearize(channel) {
    // channel: 0-255
    var sRGB = channel / 255;
    if (sRGB <= 0.03928) {
      return sRGB / 12.92;
    }
    return Math.pow((sRGB + 0.055) / 1.055, 2.4);
  }

  // ③ Tính Relative Luminance:
  function relativeLuminance(r, g, b) {
    var linR = linearize(r);
    var linG = linearize(g);
    var linB = linearize(b);
    // Hệ số theo độ nhạy mắt người:
    return 0.2126 * linR + 0.7152 * linG + 0.0722 * linB;
  }

  // ④ Tính Contrast Ratio:
  function contrastRatio(color1, color2) {
    var rgb1 = typeof color1 === "string" ? hexToRgb(color1) : color1;
    var rgb2 = typeof color2 === "string" ? hexToRgb(color2) : color2;

    var l1 = relativeLuminance(rgb1.r, rgb1.g, rgb1.b);
    var l2 = relativeLuminance(rgb2.r, rgb2.g, rgb2.b);

    // L1 = sáng hơn, L2 = tối hơn:
    var lighter = Math.max(l1, l2);
    var darker = Math.min(l1, l2);

    return (lighter + 0.05) / (darker + 0.05);
  }

  // ⑤ Kiểm tra WCAG compliance:
  function check(foreground, background, fontSize, isBold) {
    var ratio = contrastRatio(foreground, background);
    fontSize = fontSize || 16;

    // Xác định large text:
    // 18pt = 24px hoặc 14pt bold = 18.66px bold
    var isLarge = fontSize >= 24 || (fontSize >= 18.66 && isBold);

    var aaMin = isLarge ? 3 : 4.5;
    var aaaMin = isLarge ? 4.5 : 7;

    return {
      ratio: Math.round(ratio * 100) / 100,
      isLargeText: isLarge,
      AA: ratio >= aaMin,
      AAA: ratio >= aaaMin,
      aaRequired: aaMin,
      aaaRequired: aaaMin,
      grade: ratio >= aaaMin ? "AAA" : ratio >= aaMin ? "AA" : "FAIL",
    };
  }

  // ⑥ Parse CSS color string:
  function parseColor(str) {
    str = str.trim();
    // HEX:
    if (str[0] === "#") return hexToRgb(str);
    // rgb(r, g, b):
    var m = str.match(/\d+/g);
    if (m && m.length >= 3) {
      return { r: parseInt(m[0]), g: parseInt(m[1]), b: parseInt(m[2]) };
    }
    // Named colors (phổ biến):
    var named = {
      white: { r: 255, g: 255, b: 255 },
      black: { r: 0, g: 0, b: 0 },
      red: { r: 255, g: 0, b: 0 },
      green: { r: 0, g: 128, b: 0 },
      blue: { r: 0, g: 0, b: 255 },
      gray: { r: 128, g: 128, b: 128 },
      grey: { r: 128, g: 128, b: 128 },
    };
    return named[str.toLowerCase()] || null;
  }

  return {
    hexToRgb: hexToRgb,
    relativeLuminance: relativeLuminance,
    contrastRatio: contrastRatio,
    check: check,
    parseColor: parseColor,
  };
})();

// SỬ DỤNG:
// ContrastChecker.check('#767676', '#FFFFFF');
// → { ratio: 4.54, AA: true, AAA: false, grade: 'AA' }

// ContrastChecker.check('#808080', '#FFFFFF');
// → { ratio: 3.95, AA: false, AAA: false, grade: 'FAIL' }

// ContrastChecker.check('#808080', '#FFFFFF', 24);
// → { ratio: 3.95, AA: true (large text!), grade: 'AA' }
```

---

## §4. Tự Viết — Auto Color Fixer!

```javascript
// ═══════════════════════════════════════════════════════════
// AUTO COLOR FIXER — TỰ VIẾT!
// Tự động tìm màu GẦN NHẤT đạt contrast!
// ═══════════════════════════════════════════════════════════

var ContrastFixer = (function () {
  // ① RGB → HSL:
  function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    var max = Math.max(r, g, b);
    var min = Math.min(r, g, b);
    var h,
      s,
      l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / d + 2) / 6;
          break;
        case b:
          h = ((r - g) / d + 4) / 6;
          break;
      }
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
  }

  // ② HSL → RGB:
  function hslToRgb(h, s, l) {
    h /= 360;
    s /= 100;
    l /= 100;
    var r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      function hue2rgb(p, q, t) {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      }
      var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      var p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }
    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255),
    };
  }

  // ③ RGB → HEX:
  function rgbToHex(r, g, b) {
    function toHex(c) {
      var hex = c.toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    }
    return "#" + toHex(r) + toHex(g) + toHex(b);
  }

  // ④ CORE: Tìm màu foreground gần nhất đạt target ratio:
  function fixForeground(foreground, background, targetRatio) {
    targetRatio = targetRatio || 4.5;
    var fgRgb = ContrastChecker.hexToRgb(foreground);
    var bgRgb = ContrastChecker.hexToRgb(background);

    // Kiểm tra đã pass chưa:
    var currentRatio = ContrastChecker.contrastRatio(fgRgb, bgRgb);
    if (currentRatio >= targetRatio) {
      return {
        original: foreground,
        fixed: foreground,
        changed: false,
        ratio: currentRatio,
      };
    }

    // Chuyển sang HSL:
    var hsl = rgbToHsl(fgRgb.r, fgRgb.g, fgRgb.b);
    var bgLum = ContrastChecker.relativeLuminance(bgRgb.r, bgRgb.g, bgRgb.b);

    // Giữ HUE, SATURATION → chỉ thay đổi LIGHTNESS!
    // → giữ tone màu gốc, chỉ đậm/nhạt hơn!

    // Nền sáng → làm tối foreground (giảm L):
    // Nền tối → làm sáng foreground (tăng L):
    var direction = bgLum > 0.5 ? -1 : 1;
    var step = 0.5; // 0.5% mỗi bước
    var bestL = hsl.l;
    var bestRatio = currentRatio;

    for (var i = 0; i < 200; i++) {
      var newL = hsl.l + direction * step * i;
      if (newL < 0 || newL > 100) break;

      var newRgb = hslToRgb(hsl.h, hsl.s, newL);
      var ratio = ContrastChecker.contrastRatio(newRgb, bgRgb);

      if (ratio >= targetRatio) {
        bestL = newL;
        bestRatio = ratio;
        break;
      }
    }

    var fixedRgb = hslToRgb(hsl.h, hsl.s, bestL);
    var fixedHex = rgbToHex(fixedRgb.r, fixedRgb.g, fixedRgb.b);

    return {
      original: foreground,
      fixed: fixedHex,
      changed: fixedHex.toLowerCase() !== foreground.toLowerCase(),
      originalRatio: Math.round(currentRatio * 100) / 100,
      fixedRatio: Math.round(bestRatio * 100) / 100,
    };
  }

  // ⑤ Suggest multiple passing colors (giữ hue):
  function suggestColors(foreground, background) {
    return {
      AA_normal: fixForeground(foreground, background, 4.5),
      AA_large: fixForeground(foreground, background, 3),
      AAA_normal: fixForeground(foreground, background, 7),
    };
  }

  return {
    fixForeground: fixForeground,
    suggestColors: suggestColors,
    rgbToHsl: rgbToHsl,
    hslToRgb: hslToRgb,
    rgbToHex: rgbToHex,
  };
})();

// SỬ DỤNG:
// ContrastFixer.fixForeground('#808080', '#FFFFFF');
// → { original: '#808080', fixed: '#767676',
//     originalRatio: 3.95, fixedRatio: 4.54 }

// ContrastFixer.suggestColors('#FF6666', '#FFFFFF');
// → AA_normal: '#CC3333' (4.5:1)
//   AA_large:  '#FF5555' (3:1)
//   AAA_normal: '#991111' (7:1)
```

---

## §5. Color Blindness — Không Chỉ Là Contrast!

```
  COLOR BLINDNESS — PHÂN LOẠI:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  ~8% nam giới và ~0.5% nữ giới bị mù màu!            │
  │                                                        │
  │  ① DEUTERANOPIA (mù xanh lá — PHỔ BIẾN NHẤT ~5%):   │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  Bình thường: 🔴 đỏ  🟢 xanh  🔵 xanh dương    │  │
  │  │  Deuteranopia: 🟡 vàng 🟡 vàng  🔵 xanh dương   │  │
  │  │  → ĐỎ & XANH LÁ nhìn GIỐNG NHAU!               │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ② PROTANOPIA (mù đỏ ~1%):                           │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  → Đỏ nhìn TỐI hơn + lẫn với xanh lá           │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ③ TRITANOPIA (mù xanh dương — hiếm ~0.01%):         │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  → Xanh dương & vàng nhìn giống nhau             │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  ④ ACHROMATOPSIA (mù màu hoàn toàn — rất hiếm):      │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │  → Chỉ thấy grayscale (đen-trắng-xám)          │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  │  QUY TẮC: KHÔNG DÙNG MÀU LÀ CÁCH DUY NHẤT!           │
  │  ┌──────────────────────────────────────────────────┐  │
  │  │                                                  │  │
  │  │  ❌ Error chỉ = border đỏ                        │  │
  │  │  ✅ Error = border đỏ + icon ⚠️ + text "Lỗi!"   │  │
  │  │                                                  │  │
  │  │  ❌ Link chỉ = text màu xanh (không underline)  │  │
  │  │  ✅ Link = text xanh + underline                 │  │
  │  │                                                  │  │
  │  │  ❌ Required field chỉ = label đỏ                │  │
  │  │  ✅ Required = label + * + aria-required         │  │
  │  │                                                  │  │
  │  │  ❌ Chart chỉ = các màu khác nhau               │  │
  │  │  ✅ Chart = màu + pattern (sọc, chấm, gạch)    │  │
  │  │                                                  │  │
  │  │  ❌ Status chỉ = xanh/đỏ/vàng dot               │  │
  │  │  ✅ Status = dot + text "Active/Error/Warning"  │  │
  │  │                                                  │  │
  │  └──────────────────────────────────────────────────┘  │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

```javascript
// ═══════════════════════════════════════════════════════════
// COLOR BLIND SAFE PALETTE — TỰ VIẾT:
// ═══════════════════════════════════════════════════════════

var ColorBlindSafe = (function () {
  // Color blindness simulation matrices:
  var _matrices = {
    protanopia: [0.567, 0.433, 0, 0.558, 0.442, 0, 0, 0.242, 0.758],
    deuteranopia: [0.625, 0.375, 0, 0.7, 0.3, 0, 0, 0.3, 0.7],
    tritanopia: [0.95, 0.05, 0, 0, 0.433, 0.567, 0, 0.475, 0.525],
  };

  function simulateColor(r, g, b, type) {
    var m = _matrices[type];
    if (!m) return { r: r, g: g, b: b };
    return {
      r: Math.min(255, Math.max(0, Math.round(m[0] * r + m[1] * g + m[2] * b))),
      g: Math.min(255, Math.max(0, Math.round(m[3] * r + m[4] * g + m[5] * b))),
      b: Math.min(255, Math.max(0, Math.round(m[6] * r + m[7] * g + m[8] * b))),
    };
  }

  // Kiểm tra 2 màu phân biệt được TRÊN MỌI LOẠI mù màu:
  function areSafeColors(color1, color2) {
    var rgb1 = ContrastChecker.hexToRgb(color1);
    var rgb2 = ContrastChecker.hexToRgb(color2);
    var types = ["protanopia", "deuteranopia", "tritanopia"];
    var results = {};

    for (var i = 0; i < types.length; i++) {
      var sim1 = simulateColor(rgb1.r, rgb1.g, rgb1.b, types[i]);
      var sim2 = simulateColor(rgb2.r, rgb2.g, rgb2.b, types[i]);

      // Euclidean distance in simulated space:
      var dist = Math.sqrt(
        Math.pow(sim1.r - sim2.r, 2) +
          Math.pow(sim1.g - sim2.g, 2) +
          Math.pow(sim1.b - sim2.b, 2),
      );

      results[types[i]] = {
        distance: Math.round(dist),
        safe: dist > 50, // > 50 = phân biệt được
      };
    }

    results.allSafe = types.every(function (t) {
      return results[t].safe;
    });

    return results;
  }

  return {
    simulateColor: simulateColor,
    areSafeColors: areSafeColors,
  };
})();

// VD:
// ColorBlindSafe.areSafeColors('#FF0000', '#00FF00');
// → deuteranopia: { distance: 28, safe: false }
// → ĐỎ & XANH LÁ KHÔNG phân biệt được cho người mù màu deuteranopia!
```

---

## §6. Design System & Contrast!

```javascript
// ═══════════════════════════════════════════════════════════
// CONTRAST-SAFE DESIGN TOKENS:
// ═══════════════════════════════════════════════════════════

var DesignTokens = {
  // Text colors đạt AA (4.5:1) trên nền trắng:
  text: {
    primary: "#1A1A1A", // 16.75:1 ✅
    secondary: "#595959", // 7.0:1  ✅
    tertiary: "#767676", // 4.54:1 ✅ (biên AA!)
    disabled: "#A0A0A0", // 2.97:1 ❌ (nhưng disabled OK!)
    link: "#0055CC", // 7.08:1 ✅
    error: "#CC0000", // 5.87:1 ✅
    success: "#006600", // 7.82:1 ✅
    warning: "#7A4B00", // 6.36:1 ✅
  },

  // Background pairs (text trên nền):
  pairs: [
    { bg: "#FFFFFF", fg: "#1A1A1A" }, // 16.75:1
    { bg: "#F5F5F5", fg: "#1A1A1A" }, // 15.53:1
    { bg: "#1A1A1A", fg: "#FFFFFF" }, // 16.75:1 (dark)
    { bg: "#0055CC", fg: "#FFFFFF" }, // 7.08:1 (blue btn)
    { bg: "#CC0000", fg: "#FFFFFF" }, // 5.87:1 (red btn)
    { bg: "#006600", fg: "#FFFFFF" }, // 7.82:1 (green btn)
  ],
};

// Validate toàn bộ design tokens:
function validateDesignTokens(tokens) {
  var issues = [];

  // Check text on white:
  for (var name in tokens.text) {
    if (name === "disabled") continue; // skip disabled
    var result = ContrastChecker.check(tokens.text[name], "#FFFFFF");
    if (!result.AA) {
      issues.push(
        "text." +
          name +
          ": " +
          tokens.text[name] +
          " = " +
          result.ratio +
          ":1 FAIL AA (cần 4.5:1)!",
      );
    }
  }

  // Check pairs:
  for (var i = 0; i < tokens.pairs.length; i++) {
    var pair = tokens.pairs[i];
    var result = ContrastChecker.check(pair.fg, pair.bg);
    if (!result.AA) {
      issues.push(
        "Pair: " +
          pair.fg +
          " on " +
          pair.bg +
          " = " +
          result.ratio +
          ":1 FAIL!",
      );
    }
  }

  return {
    valid: issues.length === 0,
    issues: issues,
  };
}
```

---

## §7. Tự Viết — Page-Wide Contrast Auditor!

```javascript
// ═══════════════════════════════════════════════════════════
// PAGE CONTRAST AUDITOR — TỰ VIẾT!
// Scan toàn bộ page khiểm tra contrast!
// ═══════════════════════════════════════════════════════════

var ContrastAuditor = (function () {
  function getEffectiveBackground(element) {
    var el = element;
    while (el && el !== document.body) {
      var bg = window.getComputedStyle(el).backgroundColor;
      var rgb = bg.match(/\d+/g);
      if (rgb && rgb.length >= 3) {
        // Bỏ qua transparent (alpha = 0):
        if (rgb.length === 4 && parseFloat(rgb[3]) === 0) {
          el = el.parentElement;
          continue;
        }
        // Bỏ qua rgba(0,0,0,0):
        if (
          parseInt(rgb[0]) === 0 &&
          parseInt(rgb[1]) === 0 &&
          parseInt(rgb[2]) === 0 &&
          rgb.length === 4 &&
          parseFloat(rgb[3]) === 0
        ) {
          el = el.parentElement;
          continue;
        }
        return {
          r: parseInt(rgb[0]),
          g: parseInt(rgb[1]),
          b: parseInt(rgb[2]),
        };
      }
      el = el.parentElement;
    }
    // Default: white
    return { r: 255, g: 255, b: 255 };
  }

  function audit(root) {
    root = root || document.body;
    var textElements = root.querySelectorAll(
      "p, h1, h2, h3, h4, h5, h6, span, a, button, " +
        "label, li, td, th, dt, dd, blockquote, cite, " +
        "strong, em, small",
    );

    var results = { pass: [], fail: [], total: 0 };

    for (var i = 0; i < textElements.length; i++) {
      var el = textElements[i];
      var text = el.textContent.trim();
      if (!text) continue;

      results.total++;

      var style = window.getComputedStyle(el);
      var fgStr = style.color;
      var fgRgb = fgStr.match(/\d+/g);
      if (!fgRgb) continue;

      var fg = {
        r: parseInt(fgRgb[0]),
        g: parseInt(fgRgb[1]),
        b: parseInt(fgRgb[2]),
      };
      var bg = getEffectiveBackground(el);

      var fontSize = parseFloat(style.fontSize);
      var fontWeight = parseInt(style.fontWeight);
      var isBold = fontWeight >= 700;
      var isLarge = fontSize >= 24 || (fontSize >= 18.66 && isBold);

      var ratio = ContrastChecker.contrastRatio(fg, bg);
      var minRatio = isLarge ? 3 : 4.5;

      var entry = {
        text: text.substring(0, 40),
        element: el.tagName.toLowerCase(),
        fontSize: Math.round(fontSize) + "px",
        bold: isBold,
        isLarge: isLarge,
        foreground: "rgb(" + fg.r + "," + fg.g + "," + fg.b + ")",
        background: "rgb(" + bg.r + "," + bg.g + "," + bg.b + ")",
        ratio: Math.round(ratio * 100) / 100,
        required: minRatio,
        pass: ratio >= minRatio,
      };

      if (entry.pass) {
        results.pass.push(entry);
      } else {
        results.fail.push(entry);
      }
    }

    return results;
  }

  function report(root) {
    var results = audit(root);
    console.group("🎨 Contrast Audit Report");
    console.log("Total elements:", results.total);
    console.log("✅ Pass:", results.pass.length);
    console.log("❌ Fail:", results.fail.length);

    if (results.fail.length > 0) {
      console.group("❌ Failed Elements:");
      results.fail.forEach(function (f) {
        console.log(
          f.element + ': "' + f.text + '"',
          "| ratio:",
          f.ratio + ":1",
          "| cần:",
          f.required + ":1",
          "| fg:",
          f.foreground,
          "| bg:",
          f.background,
        );
      });
      console.groupEnd();
    }
    console.groupEnd();
    return results;
  }

  // Visual highlight lỗi trên page:
  function highlightFails(root) {
    var results = audit(root);
    results.fail.forEach(function (f, i) {
      // Tìm lại element:
      var els = (root || document.body).querySelectorAll(f.element);
      for (var j = 0; j < els.length; j++) {
        if (els[j].textContent.trim().substring(0, 40) === f.text) {
          els[j].style.outline = "3px solid #FF0000";
          els[j].style.outlineOffset = "2px";
          els[j].title =
            "Contrast FAIL: " + f.ratio + ":1 (cần " + f.required + ":1)";
          break;
        }
      }
    });
    return results.fail.length;
  }

  return { audit: audit, report: report, highlightFails: highlightFails };
})();

// SỬ DỤNG:
// ContrastAuditor.report();
// → In ra console danh sách pass/fail + ratio!

// ContrastAuditor.highlightFails();
// → Highlight viền đỏ lên elements bị fail contrast!
```

---

## §8. React & Contrast!

```javascript
// ═══════════════════════════════════════════════════════════
// ① useContrastCheck — Hook kiểm tra contrast:
// ═══════════════════════════════════════════════════════════

function useContrastCheck(foreground, background, fontSize, isBold) {
  return React.useMemo(
    function () {
      return ContrastChecker.check(foreground, background, fontSize, isBold);
    },
    [foreground, background, fontSize, isBold],
  );
}

// ═══════════════════════════════════════════════════════════
// ② REACT — Contrast-Safe Text Component:
// ═══════════════════════════════════════════════════════════

function SafeText(props) {
  var fg = props.color || "#1A1A1A";
  var bg = props.background || "#FFFFFF";
  var fontSize = props.fontSize || 16;

  var result = useContrastCheck(fg, bg, fontSize, props.bold);

  // Dev warning:
  React.useEffect(
    function () {
      if (!result.AA) {
        console.warn(
          "[A11y] Contrast FAIL:",
          fg,
          "on",
          bg,
          "=",
          result.ratio + ":1",
          "(cần",
          result.aaRequired + ":1)",
        );
      }
    },
    [result],
  );

  return React.createElement(
    props.as || "span",
    {
      style: {
        color: fg,
        backgroundColor: bg === "transparent" ? undefined : bg,
        fontSize: fontSize + "px",
        fontWeight: props.bold ? "bold" : "normal",
      },
      "data-contrast": result.ratio,
      "data-contrast-pass": String(result.AA),
    },
    props.children,
  );
}

// ═══════════════════════════════════════════════════════════
// ③ REACT — Theme Validator Component (dev tool):
// ═══════════════════════════════════════════════════════════

function ThemeContrastValidator(props) {
  var issues = React.useMemo(
    function () {
      var errs = [];
      var pairs = props.pairs || [];
      for (var i = 0; i < pairs.length; i++) {
        var pair = pairs[i];
        var result = ContrastChecker.check(
          pair.foreground,
          pair.background,
          pair.fontSize,
          pair.bold,
        );
        if (!result.AA) {
          errs.push({
            name: pair.name,
            foreground: pair.foreground,
            background: pair.background,
            ratio: result.ratio,
            required: result.aaRequired,
            suggestion: ContrastFixer.fixForeground(
              pair.foreground,
              pair.background,
            ).fixed,
          });
        }
      }
      return errs;
    },
    [props.pairs],
  );

  if (issues.length === 0) {
    return React.createElement(
      "div",
      {
        style: { color: "#006600", padding: "10px" },
      },
      "✅ Tất cả color pairs đạt WCAG AA!",
    );
  }

  return React.createElement(
    "div",
    {
      role: "alert",
      style: { border: "2px solid #CC0000", padding: "10px" },
    },
    React.createElement(
      "h3",
      null,
      "⚠️ " + issues.length + " contrast issues:",
    ),
    React.createElement(
      "ul",
      null,
      issues.map(function (issue, i) {
        return React.createElement(
          "li",
          { key: i },
          React.createElement("strong", null, issue.name),
          ": ",
          issue.foreground,
          " on ",
          issue.background,
          " = ",
          issue.ratio,
          ":1",
          " (cần ",
          issue.required,
          ":1)",
          " → Gợi ý: ",
          React.createElement(
            "span",
            {
              style: { color: issue.suggestion, fontWeight: "bold" },
            },
            issue.suggestion,
          ),
        );
      }),
    ),
  );
}

// SỬ DỤNG:
// React.createElement(ThemeContrastValidator, {
//     pairs: [
//         { name: 'Body text', foreground: '#808080',
//           background: '#FFFFFF', fontSize: 16 },
//         { name: 'Heading', foreground: '#333333',
//           background: '#FFFFFF', fontSize: 24, bold: true },
//     ]
// });
```

---

## §9. Tổng Kết & Câu Hỏi Phỏng Vấn!

```
  COLOR CONTRAST — TỔNG KẾT:
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  │  WCAG REQUIREMENTS:                                    │
  │  Normal text: AA = 4.5:1, AAA = 7:1                   │
  │  Large text:  AA = 3:1,   AAA = 4.5:1                 │
  │  UI/Graphics: AA = 3:1                                │
  │                                                        │
  │  CÔNG THỨC:                                            │
  │  Ratio = (L_sáng + 0.05) / (L_tối + 0.05)            │
  │  L = 0.2126×R + 0.7152×G + 0.0722×B (linearized)     │
  │                                                        │
  │  TOOLS: Lighthouse, axe, Chrome DevTools contrast     │
  │  checker, tự viết ContrastChecker!                     │
  │                                                        │
  │  COLOR BLINDNESS: Không dùng MÀU LÀ CÁCH DUY NHẤT!   │
  │  → Thêm: icon, text, pattern, underline              │
  │                                                        │
  │  DESIGN SYSTEM: validate tokens lúc build!             │
  │  REACT: useContrastCheck hook, dev warnings!           │
  │                                                        │
  └────────────────────────────────────────────────────────┘
```

**❓ Q1: WCAG yêu cầu contrast ratio bao nhiêu?**

> **Level AA**: Normal text (< 24px) ≥ **4.5:1**, Large text (≥ 24px hoặc ≥ 18.66px bold) ≥ **3:1**, UI components/graphics ≥ **3:1**. **Level AAA**: Normal ≥ **7:1**, Large ≥ **4.5:1**. Công thức: `(L_lighter + 0.05) / (L_darker + 0.05)` với L = relative luminance tính từ linearized sRGB: `0.2126×R + 0.7152×G + 0.0722×B`. Range: 1:1 (cùng màu) → 21:1 (đen/trắng).

**❓ Q2: Làm sao đảm bảo contrast đạt chuẩn?**

> ① **Design phase**: Tạo design tokens với color pairs đã validate (ContrastChecker). ② **Development**: Dùng Chrome DevTools contrast checker (inspect → color swatch). ③ **CI/CD**: Axe/Lighthouse tự động scan. ④ **Code**: Hook `useContrastCheck` warn trong dev mode. ⑤ **Auto-fix**: Tool `ContrastFixer` giữ hue, chỉ thay lightness để đạt target ratio. ⑥ **Color blindness**: Simulate protanopia/deuteranopia, đảm bảo thông tin không chỉ dùng màu (thêm icon, text, pattern).

**❓ Q3: Relative luminance tính thế nào?**

> 3 bước: ① **sRGB**: chia 255 (range 0-1). ② **Linearize**: loại gamma — nếu `sC ≤ 0.03928` → `sC/12.92`, ngược lại `((sC+0.055)/1.055)^2.4`. ③ **Luminance**: `L = 0.2126×R + 0.7152×G + 0.0722×B`. Hệ số khác nhau vì **mắt người nhạy xanh lá nhất** (0.7152) > đỏ (0.2126) > xanh dương (0.0722). Kết quả: 0 (đen) → 1 (trắng).

**❓ Q4: Tại sao #FF0000 (đỏ thuần) trên trắng không đạt AA?**

> Red #FF0000 trên white #FFFFFF chỉ có ratio **4.0:1** — chưa đạt 4.5:1 AA! Lý do: luminance formula coi trọng **green channel** nhất (0.7152), red chỉ có 0.2126 → đỏ thuần luminance cao → contrast với trắng thấp. Fix: dùng đỏ đậm hơn `#CC0000` = 5.87:1 ✅ hoặc `#B60000` = 6.56:1 ✅.

**❓ Q5: Color blindness ảnh hưởng contrast thế nào?**

> Contrast ratio WCAG tính trên **luminance** (độ sáng), không quan tâm hue → vấn đề color blindness KHÁC vấn đề contrast. VD: đỏ (#FF0000) và xanh (#00FF00) có contrast OK, nhưng người **deuteranopia** (mù xanh lá, ~5% nam) **KHÔNG phân biệt được**! Giải pháp: ① Không dùng màu là cách DUY NHẤT truyền thông tin (WCAG 1.4.1). ② Thêm icon, text label, pattern. ③ Simulate color blindness bằng Chrome DevTools (Rendering → Emulate vision deficiencies).

---

> 📝 **Ghi nhớ cuối cùng:**
> "Normal text AA = 4.5:1, Large text = 3:1! Ratio = (L_sáng + 0.05) / (L_tối + 0.05)! Mắt nhạy xanh lá nhất (0.7152)! Đỏ thuần #FF0000 trên trắng KHÔNG đạt AA! Color blindness ≠ contrast — đừng dùng màu là cách duy nhất! Validate design tokens + auto-fix bằng HSL lightness adjustment!"
