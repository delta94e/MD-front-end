# Image Optimization — Tối Ưu Hình Ảnh Deep Dive

> 📅 2026-02-11 · ⏱ 15 phút đọc
>
> Tài liệu chuyên sâu về Image Optimization:
> 5 chiến lược tối ưu (CSS thay thế, CDN responsive,
> Base64, Sprite Sheet, format chọn lọc),
> 7 định dạng ảnh (BMP, GIF, JPEG, PNG-8, PNG-24, SVG, WebP),
> bảng so sánh chi tiết, và use cases.
> Độ khó: ⭐️⭐️⭐️⭐️ | Chủ đề: Frontend Performance Optimization

---

## Mục Lục

0. [5 Chiến lược tối ưu hình ảnh](#0-5-chiến-lược-tối-ưu-hình-ảnh)
1. [7 Định dạng ảnh phổ biến](#1-7-định-dạng-ảnh-phổ-biến)
2. [Bảng so sánh chi tiết](#2-bảng-so-sánh-chi-tiết)
3. [WebP — Deep Dive](#3-webp--deep-dive)
4. [Tóm Tắt & Câu Hỏi Phỏng Vấn](#4-tóm-tắt--câu-hỏi-phỏng-vấn)

---

## 0. 5 Chiến lược tối ưu hình ảnh

> **🎯 Không dùng ảnh nếu được → CDN responsive → Base64 → Sprite → đúng format**

```
5 CHIẾN LƯỢC TỐI ƯU:
═══════════════════════════════════════════════════════════════

  ① KHÔNG DÙNG ẢNH (thay bằng CSS):
  ┌──────────────────────────────────────────────────────────┐
  │ Ảnh trang trí (decorative) → thay bằng CSS             │
  │ → Gradients, shadows, borders, shapes                   │
  │ → Pseudo-elements (::before, ::after)                   │
  │ → CSS animations thay vì GIF                            │
  │ → KHÔNG request HTTP → nhanh nhất!                     │
  └──────────────────────────────────────────────────────────┘

  ② CDN + RESPONSIVE IMAGE:
  ┌──────────────────────────────────────────────────────────┐
  │ Mobile: màn hình NHỎ → không cần ảnh GỐC (full size)  │
  │ → Load ảnh qua CDN                                      │
  │ → Tính WIDTH phù hợp màn hình                          │
  │ → Request ảnh đã CROP / RESIZE từ CDN                  │
  │ → Tiết kiệm BANDWIDTH đáng kể                          │
  │                                                          │
  │ VD: <img src="cdn.com/pic.jpg?w=375&q=80">             │
  │ → CDN trả ảnh 375px width, quality 80%                 │
  └──────────────────────────────────────────────────────────┘

  ③ ẢNH NHỎ → BASE64:
  ┌──────────────────────────────────────────────────────────┐
  │ Ảnh nhỏ (< 8KB) → encode thành Base64 string           │
  │ → Nhúng trực tiếp vào HTML/CSS                          │
  │ → KHÔNG cần HTTP request riêng                          │
  │ → Giảm số lượng requests                                │
  │                                                          │
  │ VD: background: url(data:image/png;base64,iVBOR...)     │
  │ ⚠️ Base64 tăng ~33% file size → chỉ dùng cho ảnh NHỎ │
  └──────────────────────────────────────────────────────────┘

  ④ SPRITE SHEET (CSS Sprites):
  ┌──────────────────────────────────────────────────────────┐
  │ Gộp NHIỀU icon files → 1 ẢNH DUY NHẤT                  │
  │ → Chỉ cần 1 HTTP request cho tất cả icons             │
  │ → Dùng background-position để hiển thị từng icon       │
  │                                                          │
  │ ┌──┬──┬──┬──┐                                           │
  │ │🏠│📧│⚙️│🔍│  ← 1 file sprite.png                    │
  │ └──┴──┴──┴──┘                                           │
  │ background-position: -32px 0; → hiển thị icon ⚙️       │
  └──────────────────────────────────────────────────────────┘

  ⑤ CHỌN ĐÚNG FORMAT:
  ┌──────────────────────────────────────────────────────────┐
  │ → WebP ưu tiên (nếu browser hỗ trợ)                   │
  │ → Icon nhỏ: SVG (vector, scale vô hạn)                │
  │ → Ảnh nhỏ bitmap: PNG-8                                 │
  │ → Ảnh chụp/photos: JPEG                                │
  │ → Animations: GIF hoặc CSS/JS animations               │
  └──────────────────────────────────────────────────────────┘
```

```css
/* ===== ① CSS thay thế ảnh ===== */

/* Gradient thay background image */
.hero {
  background: linear-gradient(135deg, #667eea, #764ba2);
}

/* Triangle thay icon */
.arrow-down {
  width: 0;
  height: 0;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-top: 10px solid #333;
}

/* Shadow thay shadow image */
.card {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}
```

```html
<!-- ===== ② Responsive Images ===== -->

<!-- srcset: browser chọn ảnh phù hợp -->
<img
  src="pic-400.jpg"
  srcset="pic-400.jpg 400w, pic-800.jpg 800w, pic-1200.jpg 1200w"
  sizes="(max-width: 600px) 400px,
           (max-width: 1000px) 800px,
           1200px"
  alt="Responsive image"
/>

<!-- picture: fallback format -->
<picture>
  <source srcset="pic.webp" type="image/webp" />
  <source srcset="pic.jpg" type="image/jpeg" />
  <img src="pic.jpg" alt="Fallback image" />
</picture>
```

```css
/* ===== ④ CSS Sprites ===== */
.icon {
  background-image: url("sprites.png");
  background-repeat: no-repeat;
  width: 32px;
  height: 32px;
}
.icon-home {
  background-position: 0 0;
}
.icon-mail {
  background-position: -32px 0;
}
.icon-search {
  background-position: -64px 0;
}
.icon-gear {
  background-position: -96px 0;
}
```

---

## 1. 7 Định dạng ảnh phổ biến

> **🎯 Indexed (bảng màu) vs Direct (trực tiếp) — Lossy vs Lossless**

```
KIẾN THỨC NỀN:
═══════════════════════════════════════════════════════════════

  INDEXED COLOR (Bảng màu):
  → Ảnh lưu BẢNG MÀU (palette) gồm N màu (VD: 256 màu)
  → Mỗi pixel trỏ tới INDEX trong bảng
  → File size NHỎ, nhưng giới hạn số màu

  DIRECT COLOR (Màu trực tiếp):
  → Mỗi pixel lưu TRỰC TIẾP giá trị RGB/RGBA
  → Hàng TRIỆU màu (16.7M+)
  → File size LỚN hơn, nhưng màu PHONG PHÚ

  LOSSY (Nén có mất dữ liệu):
  → Loại bỏ data "ít quan trọng" → file NHỎ hơn
  → KHÔNG thể khôi phục ảnh gốc 100%

  LOSSLESS (Nén không mất dữ liệu):
  → Nén mà KHÔNG mất data → file LỚN hơn
  → CÓ THỂ khôi phục ảnh gốc 100%
```

### ① BMP (Bitmap)

```
BMP — Bitmap:
═══════════════════════════════════════════════════════════════

  ┌──────────────┬──────────────────────────────────────────┐
  │ Loại         │ Bitmap (raster)                           │
  │ Compression  │ LOSSLESS (không mất dữ liệu)            │
  │ Color        │ INDEXED + DIRECT (cả 2)                  │
  │ File size    │ RẤT LỚN ❌ (hầu như không nén)          │
  │ Transparency │ Không hỗ trợ                             │
  │ Animation    │ Không hỗ trợ                             │
  │ Use case     │ Ít dùng trên web ❌                      │
  └──────────────┴──────────────────────────────────────────┘

  → Hầu như KHÔNG NÉN data → file size rất lớn
  → KHÔNG PHÙ HỢP cho web
```

### ② GIF (Graphics Interchange Format)

```
GIF — Graphics Interchange Format:
═══════════════════════════════════════════════════════════════

  ┌──────────────┬──────────────────────────────────────────┐
  │ Loại         │ Bitmap (raster)                           │
  │ Compression  │ LOSSLESS (LZW algorithm)                 │
  │ Color        │ INDEXED (tối đa 256 màu / 8-bit)        │
  │ File size    │ Nhỏ ✅                                    │
  │ Transparency │ Có (binary: 100% hoặc 0%)               │
  │ Animation    │ CÓ ✅ (đặc điểm nổi bật!)               │
  │ Use case     │ Animation đơn giản, ít màu              │
  └──────────────┴──────────────────────────────────────────┘

  ✅ File size nhỏ, hỗ trợ animation + transparency
  ❌ Chỉ 256 màu → không phù hợp ảnh phong phú
  ❌ Nên thay bằng PNG-8 (trừ khi cần animation)
```

### ③ JPEG (Joint Photographic Experts Group)

```
JPEG — Joint Photographic Experts Group:
═══════════════════════════════════════════════════════════════

  ┌──────────────┬──────────────────────────────────────────┐
  │ Loại         │ Bitmap (raster)                           │
  │ Compression  │ LOSSY (có mất dữ liệu)                  │
  │ Color        │ DIRECT (16.7 triệu màu)                 │
  │ File size    │ Nhỏ-Vừa (tùy quality)                   │
  │ Transparency │ KHÔNG hỗ trợ ❌                          │
  │ Animation    │ KHÔNG hỗ trợ                             │
  │ Use case     │ PHOTOS, ảnh chụp ✅                      │
  └──────────────┴──────────────────────────────────────────┘

  ✅ Direct color → rất phù hợp cho PHOTOS
  ✅ File size nhỏ hơn BMP/PNG rất nhiều
  ❌ Lossy → KHÔNG phù hợp cho logo, wireframe, text
  ❌ Lossy → ảnh bị MỜ ở quality thấp
  ❌ Không có transparency
```

### ④ PNG-8 (Portable Network Graphics — 8-bit)

```
PNG-8 — 8-bit Indexed Color:
═══════════════════════════════════════════════════════════════

  ┌──────────────┬──────────────────────────────────────────┐
  │ Loại         │ Bitmap (raster)                           │
  │ Compression  │ LOSSLESS                                  │
  │ Color        │ INDEXED (tối đa 256 màu / 8-bit)        │
  │ File size    │ Nhỏ hơn GIF ✅                            │
  │ Transparency │ CÓ + có ALPHA (điều chỉnh được) ✅      │
  │ Animation    │ KHÔNG hỗ trợ ❌ (APNG có)               │
  │ Use case     │ Icons, logos, ảnh ÍT MÀU                │
  └──────────────┴──────────────────────────────────────────┘

  ✅ THAY THẾ TUYỆT VỜI cho GIF
  ✅ File size NHỎ HƠN GIF cùng chất lượng
  ✅ Hỗ trợ ALPHA transparency (GIF không có)
  → Trừ khi cần animation → luôn dùng PNG-8 thay GIF
```

### ⑤ PNG-24 (Portable Network Graphics — 24-bit)

```
PNG-24 — 24-bit Direct Color:
═══════════════════════════════════════════════════════════════

  ┌──────────────┬──────────────────────────────────────────┐
  │ Loại         │ Bitmap (raster)                           │
  │ Compression  │ LOSSLESS                                  │
  │ Color        │ DIRECT (16.7 triệu màu)                 │
  │ File size    │ LỚN hơn JPEG, GIF, PNG-8 ❌             │
  │ Transparency │ CÓ + full ALPHA ✅                       │
  │ Animation    │ KHÔNG hỗ trợ                             │
  │ Use case     │ Ảnh cần LOSSLESS + TRANSPARENCY          │
  └──────────────┴──────────────────────────────────────────┘

  ✅ Lossless + direct color + alpha transparency
  ✅ NHỎ HƠN BMP đáng kể
  ❌ LỚN HƠN JPEG, GIF, PNG-8 nhiều
  → Dùng khi cần chất lượng CAO + transparency
```

### ⑥ SVG (Scalable Vector Graphics)

```
SVG — Scalable Vector Graphics:
═══════════════════════════════════════════════════════════════

  ┌──────────────┬──────────────────────────────────────────┐
  │ Loại         │ VECTOR (không phải bitmap!)               │
  │ Compression  │ LOSSLESS                                  │
  │ Color        │ Không giới hạn                            │
  │ File size    │ Nhỏ (cho shapes đơn giản)                │
  │ Transparency │ CÓ ✅                                     │
  │ Animation    │ CÓ (SMIL, CSS, JS) ✅                    │
  │ Scale        │ VÔ HẠN — không mất chất lượng ✅        │
  │ Use case     │ Logos, icons, illustrations              │
  └──────────────┴──────────────────────────────────────────┘

  ✅ VECTOR → phóng to KHÔNG bị VỠ (không pixel)
  ✅ XML-based → có thể edit, animate bằng CSS/JS
  ✅ Small file size cho shapes đơn giản
  ✅ Responsive: scale theo container
  → Lý tưởng cho: logos, icons, illustrations, charts
```

### ⑦ WebP

```
WebP — Google's Web Image Format:
═══════════════════════════════════════════════════════════════

  ┌──────────────┬──────────────────────────────────────────┐
  │ Loại         │ Bitmap (raster)                           │
  │ Compression  │ LOSSY + LOSSLESS (cả 2!)                │
  │ Color        │ DIRECT                                    │
  │ File size    │ NHỎ NHẤT ✅ (so với cùng quality)        │
  │ Transparency │ CÓ (chỉ +22% extra size) ✅             │
  │ Animation    │ CÓ ✅                                     │
  │ Use case     │ MỌI THỨ trên web (nếu hỗ trợ)          │
  └──────────────┴──────────────────────────────────────────┘

  ✅ Được thiết kế RIÊNG cho Web
  ✅ Cùng quality: NHỎ HƠN PNG 26% (lossless)
  ✅ Cùng quality: NHỎ HƠN JPEG 25-34% (lossy)
  ✅ Hỗ trợ transparency, animation
  ❌ Compatibility: trước đây chỉ Chrome/Opera
     (2024+: hầu hết browsers đã hỗ trợ)
```

---

## 2. Bảng so sánh chi tiết

```
7 FORMATS — BẢNG SO SÁNH:
═══════════════════════════════════════════════════════════════

  ┌──────────┬────────┬─────────┬────────┬───────┬──────┬──────┐
  │ Format   │ Type   │Compress │ Color  │Transp │Anim  │ Size │
  ├──────────┼────────┼─────────┼────────┼───────┼──────┼──────┤
  │ BMP      │Bitmap  │Lossless │Both    │ ❌    │ ❌   │ XL   │
  │ GIF      │Bitmap  │Lossless │Index   │ ✅    │ ✅   │ S    │
  │          │        │(LZW)   │(256)   │(bin)  │      │      │
  │ JPEG     │Bitmap  │Lossy   │Direct  │ ❌    │ ❌   │ S-M  │
  │ PNG-8    │Bitmap  │Lossless │Index   │ ✅    │ ❌   │ S    │
  │          │        │        │(256)   │(alpha)│      │      │
  │ PNG-24   │Bitmap  │Lossless │Direct  │ ✅    │ ❌   │ L    │
  │          │        │        │        │(alpha)│      │      │
  │ SVG      │VECTOR  │Lossless │N/A    │ ✅    │ ✅   │ XS   │
  │ WebP     │Bitmap  │Both    │Direct  │ ✅    │ ✅   │ XS   │
  └──────────┴────────┴─────────┴────────┴───────┴──────┴──────┘

  Size: XS < S < M < L < XL
```

```
CHỌN FORMAT ĐÚNG — DECISION TREE:
═══════════════════════════════════════════════════════════════

  Cần hiển thị ảnh?
  │
  ├─ Có thể thay bằng CSS? ────── YES → DÙNG CSS (không cần ảnh)
  │
  ├─ Icon / Logo / Illustration? ── YES → SVG (vector, scale)
  │
  ├─ Animation? ────────────────── YES → GIF hoặc CSS animation
  │
  ├─ Photo / ảnh chụp?
  │  ├─ Browser hỗ trợ WebP? ──── YES → WebP (lossy, nhỏ nhất)
  │  └─ Không? ─────────────────── → JPEG
  │
  ├─ Ảnh nhỏ, ít màu?
  │  ├─ < 8KB? ──────────────────── → Base64 inline
  │  └─ > 8KB? ──────────────────── → PNG-8
  │
  ├─ Cần transparency + lossless?── → PNG-24 hoặc WebP lossless
  │
  └─ Nhiều icons nhỏ? ──────────── → CSS Sprite Sheet
```

---

## 3. WebP — Deep Dive

> **🎯 Format được thiết kế RIÊNG cho Web — nhỏ nhất cùng quality**

```
WEBP — SO SÁNH VỚI CÁC FORMATS KHÁC:
═══════════════════════════════════════════════════════════════

  ┌────────────────────────────────────────────────────────────┐
  │ LOSSLESS compression:                                      │
  │ → WebP NHỎ HƠN PNG 26% (cùng quality)                    │
  │                                                            │
  │ PNG:  100KB    →    WebP lossless: 74KB (-26%)            │
  ├────────────────────────────────────────────────────────────┤
  │ LOSSY compression:                                         │
  │ → WebP NHỎ HƠN JPEG 25-34% (cùng quality)               │
  │                                                            │
  │ JPEG: 100KB   →    WebP lossy: 66-75KB (-25~34%)         │
  ├────────────────────────────────────────────────────────────┤
  │ TRANSPARENCY:                                              │
  │ → WebP lossless + transparency chỉ thêm 22% extra size   │
  │                                                            │
  │ PNG transparent: 100KB → WebP transparent: ~80KB          │
  └────────────────────────────────────────────────────────────┘
```

```html
<!-- WebP với Fallback -->
<picture>
  <source srcset="image.webp" type="image/webp" />
  <source srcset="image.jpg" type="image/jpeg" />
  <img src="image.jpg" alt="WebP with fallback" />
</picture>
```

```javascript
// Detect WebP support
function supportsWebP() {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL("image/webp").indexOf("data:image/webp") === 0;
}

// Conditional loading
if (supportsWebP()) {
  img.src = "photo.webp";
} else {
  img.src = "photo.jpg";
}
```

---

## 4. Tóm Tắt & Câu Hỏi Phỏng Vấn

### Quick Reference

```
IMAGE OPTIMIZATION — QUICK REFERENCE:
═══════════════════════════════════════════════════════════════

  5 CHIẾN LƯỢC:
    ① CSS thay thế (gradient, shadow, shapes)
    ② CDN responsive (resize theo screen width)
    ③ Base64 inline (ảnh < 8KB, giảm HTTP requests)
    ④ CSS Sprites (gộp icons → 1 file)
    ⑤ Format đúng (WebP > JPEG/PNG > GIF > BMP)

  7 FORMATS:
    BMP:    Lossless, No compress, XL → KHÔNG dùng web
    GIF:    Lossless, Indexed 256, Animation ✅, Transparency
    JPEG:   Lossy, Direct color → PHOTOS ✅
    PNG-8:  Lossless, Indexed 256, Alpha → thay GIF ✅
    PNG-24: Lossless, Direct, Alpha → high quality + transp
    SVG:    Vector, Scale vô hạn → Icons/Logos ✅
    WebP:   Both, -26% PNG, -25~34% JPEG → WEB ✅
```

### Câu Hỏi Phỏng Vấn Thường Gặp

**1. Kể 5 cách tối ưu hình ảnh?**

> ① **CSS** thay thế ảnh trang trí (gradient, shadow). ② **CDN** + responsive images (resize theo **screen width**, srcset/sizes). ③ Ảnh nhỏ <8KB → **Base64** inline (giảm HTTP requests). ④ Nhiều icons → **CSS Sprites** (gộp 1 file, background-position). ⑤ Chọn **format đúng**: ưu tiên WebP → SVG cho icons → JPEG cho photos → PNG-8 cho ảnh ít màu.

**2. Phân biệt 7 định dạng ảnh?**

> **BMP**: lossless, không nén, rất lớn (không dùng web). **GIF**: lossless, indexed 256 màu, hỗ trợ **animation** + transparency. **JPEG**: **lossy**, direct color → lý tưởng cho **photos** (không transparency). **PNG-8**: lossless, indexed 256, **alpha transparency** → thay GIF. **PNG-24**: lossless, direct color, full alpha → ảnh **chất lượng cao** + transparency. **SVG**: **vector**, scale vô hạn → icons/logos. **WebP**: cả lossy + lossless, **nhỏ hơn** PNG 26%, JPEG 25-34%.

**3. Khi nào dùng JPEG? Khi nào dùng PNG?**

> **JPEG**: ảnh chụp, photos (direct color, lossy nhưng file nhỏ, **không cần transparency**). **PNG-8**: icons, logos ít màu (lossless, 256 màu, alpha). **PNG-24**: ảnh cần lossless + transparency + nhiều màu (file **lớn hơn** JPEG nhiều).

**4. WebP có ưu nhược điểm gì?**

> **Ưu**: hỗ trợ cả lossy + lossless, cùng quality → nhỏ hơn **PNG 26%** (lossless), nhỏ hơn **JPEG 25-34%** (lossy). Hỗ trợ transparency (chỉ +22% extra) + animation. **Nhược**: trước đây compatibility kém (chỉ Chrome/Opera), nay (2024+) hầu hết browsers hỗ trợ. Dùng `<picture>` tag để **fallback**.

**5. CSS Sprites là gì? Ưu nhược?**

> Gộp nhiều **icon files** thành **1 ảnh duy nhất**, dùng `background-position` hiển thị từng icon. **Ưu**: giảm HTTP requests (1 thay vì N). **Nhược**: khó maintain khi thêm/sửa icon, responsive phức tạp. Ngày nay **SVG icons** hoặc **icon fonts** thường được ưu tiên hơn.

**6. Base64 inline có khi nào không nên dùng?**

> Base64 encode tăng file size **~33%**. Chỉ nên dùng cho ảnh **<8KB**. Ảnh lớn → Base64 string **rất dài** → CSS/HTML file **phình to** → không cache riêng → performance **tệ hơn**. Ngoài ra Base64 không tách riêng → **browser không cache** như file ảnh riêng.

---

## Checklist Học Tập

- [ ] Biết 5 chiến lược tối ưu hình ảnh
- [ ] Hiểu CSS thay thế ảnh trang trí (gradient, shadow, shapes)
- [ ] Biết CDN responsive images (srcset, sizes, picture tag)
- [ ] Hiểu Base64 inline (ưu nhược, khi nào dùng)
- [ ] Biết CSS Sprites (background-position)
- [ ] Phân biệt Indexed vs Direct color, Lossy vs Lossless
- [ ] Biết 7 formats: BMP/GIF/JPEG/PNG-8/PNG-24/SVG/WebP
- [ ] Biết decision tree chọn format
- [ ] Hiểu WebP (26% < PNG, 25-34% < JPEG, fallback)
- [ ] Biết dùng `<picture>` tag cho format fallback

---

_Cập nhật lần cuối: Tháng 2, 2026_
