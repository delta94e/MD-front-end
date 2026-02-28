# STUDY GUIDE: ISLANDS ARCHITECTURE
## Kiến Trúc Đảo (Islands Architecture) - Rendering Pattern

---

## 📚 MỤC LỤC

1. [Tổng Quan](#1-tổng-quan)
2. [Khái Niệm Cốt Lõi](#2-khái-niệm-cốt-lõi)
3. [Vấn Đề Cần Giải Quyết](#3-vấn-đề-cần-giải-quyết)
4. [Cách Hoạt Động](#4-cách-hoạt-động)
5. [So Sánh Với Các Pattern Khác](#5-so-sánh-với-các-pattern-khác)
6. [Triển Khai Thực Tế](#6-triển-khai-thực-tế)
7. [Ưu & Nhược Điểm](#7-ưu--nhược-điểm)
8. [Các Framework Hỗ Trợ](#8-các-framework-hỗ-trợ)
9. [Ví Dụ Thực Hành](#9-ví-dụ-thực-hành)
10. [Khi Nào Nên Sử Dụng](#10-khi-nào-nên-sử-dụng)

---

## 1. TỔNG QUAN

### Định Nghĩa Ngắn Gọn
**Islands Architecture** là một kiến trúc khuyến khích việc tạo ra các "đảo" tương tác nhỏ, tập trung trong các trang web được render từ server. Thay vì một ứng dụng duy nhất kiểm soát toàn bộ trang, có nhiều điểm khởi đầu độc lập.

### Nguồn Gốc
- Thuật ngữ được phổ biến bởi **Katie Sylor-Miller** (Frontend Architect tại Etsy) và **Jason Miller** (tác giả Preact)
- Được đề xuất lần đầu trong cuộc họp năm 2019
- Mục tiêu: Giảm lượng JavaScript gửi đến client

### Ý Tưởng Chính
```
Trang HTML tĩnh + Các "đảo" tương tác độc lập = Islands Architecture
```

---

## 2. KHÁI NIỆM CỐT LÕI

### 2.1 "Đảo" (Island) Là Gì?

**Đảo** là một vùng động (dynamic region) trên trang web có khả năng:
- Tự render HTML trên server
- Tự hydrate (kích hoạt) trên client
- Hoạt động độc lập với các phần khác của trang
- Chứa script riêng và có thể thực thi bất đồng bộ

### 2.2 Phân Loại Nội Dung Trang

#### Nội Dung Tĩnh (Static Content)
- HTML thuần túy, không tương tác
- Không cần hydration
- Không kích hoạt sự kiện
- Ví dụ: Văn bản, hình ảnh, tiêu đề

#### Nội Dung Động (Dynamic Content)
- Kết hợp HTML + JavaScript
- Cần hydration sau khi render
- Có khả năng tương tác
- Ví dụ: Nút bấm, form, carousel, search bar

### 2.3 Sơ Đồ Minh Họa

```
┌─────────────────────────────────────────┐
│         TRANG WEB (Static HTML)         │
│                                         │
│  ┌──────────┐    ┌──────────┐          │
│  │ Island 1 │    │ Island 2 │          │
│  │ (Button) │    │ (Search) │          │
│  └──────────┘    └──────────┘          │
│                                         │
│              ┌──────────┐               │
│              │ Island 3 │               │
│              │(Carousel)│               │
│              └──────────┘               │
└─────────────────────────────────────────┘
```

---

## 3. VẤN ĐỀ CẦN GIẢI QUYẾT

### 3.1 Vấn Đề Với SSR Truyền Thống

**Server-Side Rendering (SSR)** hiện tại có những hạn chế:

1. **JavaScript Bloat** (Quá tải JavaScript)
   - Gửi toàn bộ JavaScript cho cả trang
   - Phải tái tạo Virtual DOM cho toàn bộ trang
   - Hydration tốn kém tài nguyên

2. **Top-Down Rendering**
   - Component cha phải khởi tạo trước con
   - Lỗi ở một component ảnh hưởng toàn bộ trang
   - Không thể ưu tiên component quan trọng

3. **Trade-off SEO vs UX**
   - SSR tốt cho SEO nhưng kém UX
   - Người dùng nhìn trang "giả" trong khi chờ JavaScript load
   - Time to Interactive (TTI) cao

### 3.2 Ví Dụ Thực Tế

#### Trang Blog Điển Hình
```
- Tiêu đề bài viết (TĨNH)
- Nội dung bài viết (TĨNH)
- Hình ảnh (TĨNH)
- Nút chia sẻ mạng xã hội (ĐỘNG - Island)
- Widget chat (ĐỘNG - Island)
- Comment section (ĐỘNG - Island)
```

#### Trang E-commerce
```
- Mô tả sản phẩm (TĨNH)
- Hình ảnh sản phẩm (TĨNH)
- Image carousel (ĐỘNG - Island)
- Thanh tìm kiếm (ĐỘNG - Island)
- Nút thêm vào giỏ (ĐỘNG - Island)
```

---

## 4. CÁCH HOẠT ĐỘNG

### 4.1 Quy Trình Render

```
BƯỚC 1: SERVER
├─ Render toàn bộ HTML tĩnh
├─ Tạo placeholder cho các island
└─ Gửi HTML đến client

BƯỚC 2: CLIENT
├─ Hiển thị HTML ngay lập tức
├─ Load script cho từng island độc lập
├─ Hydrate từng island khi cần
└─ Các island hoạt động độc lập
```

### 4.2 Hydration Độc Lập

**Progressive Hydration truyền thống:**
```
Root Component
  └─ Child A (chờ Root)
      └─ Child B (chờ Child A)
          └─ Child C (chờ Child B)
```

**Islands Architecture:**
```
Island 1 ─┐
Island 2 ─┼─ Hydrate song song, độc lập
Island 3 ─┘
```

### 4.3 Scheduling với requestIdleCallback()

```javascript
// Pseudo-code
islands.forEach(island => {
  requestIdleCallback(() => {
    hydrateIsland(island);
  });
});
```

**Lợi ích:**
- Hydrate khi main thread rảnh
- Không block rendering
- Ưu tiên nội dung quan trọng

---

## 5. SO SÁNH VỚI CÁC PATTERN KHÁC

### 5.1 Islands vs Micro-frontends

| Tiêu Chí | Islands | Micro-frontends |
|----------|---------|-----------------|
| Composition | Qua HTML | Không nhất thiết qua HTML |
| Scope | Component-level | Application-level |
| Độc lập | Cao | Rất cao |
| Phức tạp | Thấp | Cao |

### 5.2 Islands vs Progressive Enhancement

**Điểm Giống:**
- Cả hai đều tăng cường HTML tĩnh
- Cả hai đều hoạt động mà không cần JavaScript

**Điểm Khác:**
- Islands có SSR hydration tích hợp
- Islands có metaphor nhất quán cho interactivity
- Islands có component-based architecture

### 5.3 Islands vs Traditional SPA

| Tiêu Chí | Islands | SPA |
|----------|---------|-----|
| JavaScript Size | Nhỏ (chỉ islands) | Lớn (toàn bộ app) |
| TTI | Nhanh | Chậm |
| SEO | Tốt | Cần SSR |
| Routing | Server-side | Client-side |
| Phù hợp | Content sites | Web apps |

---

## 6. TRIỂN KHAI THỰC TẾ

### 6.1 Yêu Cầu Framework

Framework cần hỗ trợ:

1. **Static Rendering**
   - Render trang tĩnh trên server
   - Zero JavaScript mặc định

2. **Component Embedding**
   - Nhúng component động qua placeholder
   - Mỗi component có script riêng

3. **Isomorphic Rendering**
   - Render cùng component trên server & client
   - Nhận diện component ở cả hai phía

4. **Partial Hydration**
   - Hydrate từng component độc lập
   - Scheduling thông minh

### 6.2 Các Phương Pháp Triển Khai

#### A. Manual Islands
```html
<!-- Static HTML -->
<article>
  <h1>Tiêu đề tĩnh</h1>
  <p>Nội dung tĩnh...</p>
  
  <!-- Island placeholder -->
  <div id="social-buttons" data-island>
    <!-- Server-rendered HTML -->
  </div>
</article>

<script type="module">
  // Hydrate island khi cần
  import { hydrate } from './social-buttons.js';
  hydrate('#social-buttons');
</script>
```

#### B. Framework-based Islands
```jsx
// Astro example
---
import SocialButtons from './SocialButtons.jsx';
---

<article>
  <h1>Tiêu đề tĩnh</h1>
  <p>Nội dung tĩnh...</p>
  
  <!-- Island với directive -->
  <SocialButtons client:visible />
</article>
```

---

## 7. ƯU & NHƯỢC ĐIỂM

### 7.1 Ưu Điểm

#### ✅ Performance (Hiệu Năng)
- **Giảm JavaScript:** Chỉ gửi code cho islands
- **TTI nhanh hơn:** Không cần recreate Virtual DOM toàn trang
- **Số liệu thực tế:** Astro giảm 83% JavaScript so với Next.js/Nuxt.js

#### ✅ SEO
- Nội dung tĩnh render trên server
- HTML đầy đủ ngay từ đầu
- Không cần chờ JavaScript

#### ✅ Prioritization (Ưu Tiên Nội Dung)
- Nội dung chính hiển thị ngay
- Tính năng phụ load dần dần
- Trải nghiệm người dùng tốt hơn

#### ✅ Accessibility (Khả Năng Truy Cập)
- HTML tĩnh chuẩn
- Links hoạt động mà không cần JS
- Screen reader friendly

#### ✅ Component-based
- Tái sử dụng cao
- Dễ bảo trì
- Tách biệt concerns

#### ✅ Fault Isolation (Cô Lập Lỗi)
- Lỗi ở island này không ảnh hưởng island khác
- Degradation graceful
- Resilience cao

### 7.2 Nhược Điểm

#### ❌ Hạn Chế Framework
- Ít framework hỗ trợ
- Phải học framework mới
- Migration tốn công

#### ❌ Tài Liệu Hạn Chế
- Ít discussion trong cộng đồng
- Best practices chưa rõ ràng
- Ít case studies

#### ❌ Khó Lựa Chọn
- Nhiều framework mới claim hỗ trợ
- Khó đánh giá chất lượng
- Ecosystem chưa ổn định

#### ❌ Không Phù Hợp Highly Interactive Apps
- Social media apps
- Real-time collaboration tools
- Apps cần hàng nghìn islands

#### ❌ Routing Limitations
- Chủ yếu multi-page apps
- Client-side routing phức tạp hơn
- Không phù hợp SPA thuần túy

---

## 8. CÁC FRAMEWORK HỖ TRỢ

### 8.1 Astro ⭐ (Khuyến Nghị)

**Đặc Điểm:**
- Được xây dựng dựa trên Islands Architecture
- Multi-framework (React, Vue, Svelte, Preact...)
- Built-in partial hydration
- Lazy loading components

**Ví Dụ:**
```astro
---
import { SocialButtons } from './SocialButtons.js';
---

<html>
  <body>
    <article>
      <h1>Tiêu đề</h1>
      <p>Nội dung tĩnh...</p>
      
      <!-- Island với loading strategy -->
      <SocialButtons client:visible />
    </article>
  </body>
</html>
```

**Client Directives:**
- `client:load` - Load ngay
- `client:idle` - Load khi idle
- `client:visible` - Load khi visible
- `client:media` - Load theo media query
- `client:only` - Chỉ render trên client

### 8.2 Marko

**Đặc Điểm:**
- Phát triển bởi eBay
- Streaming rendering
- Automatic partial hydration
- Isomorphic
- Compiler tối ưu hóa

**Ví Dụ:**
```marko
<article>
  <h1>Tiêu đề</h1>
  <p>Nội dung tĩnh...</p>
  
  <!-- Component tự động partial hydrate -->
  <social-buttons/>
</article>
```

**Ưu Điểm:**
- Out-of-order streaming
- Progressive rendering
- Không cần JavaScript bundle cho loading states

### 8.3 Eleventy + Preact

**Đặc Điểm:**
- Eleventy: Static site generator
- Preact: Lightweight React alternative
- Declarative hydration control
- Lazy hydration support

**Ví Dụ:**
```jsx
import { WithHydration } from './hydration';

export default function Page() {
  return (
    <article>
      <h1>Tiêu đề</h1>
      <p>Nội dung tĩnh...</p>
      
      <WithHydration>
        <SocialButtons />
      </WithHydration>
    </article>
  );
}
```

### 8.4 So Sánh Framework

| Framework | Năm Ra Mắt | Độ Khó | Multi-Framework | Streaming |
|-----------|------------|--------|-----------------|-----------|
| Astro | 2021 | Dễ | ✅ | ❌ |
| Marko | 2014 | Trung bình | ❌ | ✅ |
| Eleventy | 2018 | Trung bình | ⚠️ (cần setup) | ❌ |

---

## 9. VÍ DỤ THỰC HÀNH

### 9.1 Ví Dụ Đơn Giản: Blog Post

#### File Structure
```
src/
├── pages/
│   └── blog-post.astro
├── components/
│   ├── SocialButtons.jsx
│   └── CommentSection.jsx
└── styles/
    └── blog.css
```

#### blog-post.astro
```astro
---
import { SocialButtons } from '../components/SocialButtons.jsx';
import { CommentSection } from '../components/CommentSection.jsx';
---

<html lang="vi">
  <head>
    <title>Bài Viết Blog</title>
    <link rel="stylesheet" href="/blog.css" />
  </head>
  
  <body>
    <article class="content">
      <!-- STATIC CONTENT -->
      <header>
        <h1>Tiêu Đề Bài Viết</h1>
        <p class="meta">Ngày 15/01/2025 • 5 phút đọc</p>
      </header>
      
      <section class="body">
        <p>Đây là nội dung bài viết được render từ server...</p>
        <img src="/images/post-image.jpg" alt="Hình minh họa" />
        <p>Thêm nội dung...</p>
      </section>
      
      <!-- ISLAND 1: Social Buttons -->
      <aside class="social">
        <SocialButtons client:visible />
      </aside>
      
      <!-- ISLAND 2: Comments -->
      <section class="comments">
        <CommentSection client:idle />
      </section>
    </article>
  </body>
</html>
```

#### SocialButtons.jsx
```jsx
import { useState } from 'react';

export function SocialButtons() {
  const [shared, setShared] = useState(false);
  
  const handleShare = (platform) => {
    console.log(`Chia sẻ lên ${platform}`);
    setShared(true);
  };
  
  return (
    <div className="social-buttons">
      <h3>Chia sẻ bài viết</h3>
      <button onClick={() => handleShare('Facebook')}>
        📘 Facebook
      </button>
      <button onClick={() => handleShare('Twitter')}>
        🐦 Twitter
      </button>
      <button onClick={() => handleShare('LinkedIn')}>
        💼 LinkedIn
      </button>
      {shared && <p>✅ Đã chia sẻ!</p>}
    </div>
  );
}
```

### 9.2 Ví Dụ Nâng Cao: E-commerce Product Page

```astro
---
import ProductGallery from '../islands/ProductGallery.vue';
import AddToCart from '../islands/AddToCart.svelte';
import Reviews from '../islands/Reviews.jsx';
import RecommendedProducts from '../islands/RecommendedProducts.jsx';

const product = await fetchProduct(Astro.params.id);
---

<html>
  <body>
    <!-- STATIC: Product Info -->
    <section class="product-info">
      <h1>{product.name}</h1>
      <p class="price">{product.price} VNĐ</p>
      <div class="description">
        {product.description}
      </div>
    </section>
    
    <!-- ISLAND 1: Image Gallery (Vue) -->
    <ProductGallery 
      images={product.images}
      client:visible
    />
    
    <!-- ISLAND 2: Add to Cart (Svelte) -->
    <AddToCart 
      productId={product.id}
      client:idle
    />
    
    <!-- STATIC: Specifications -->
    <section class="specs">
      <h2>Thông Số Kỹ Thuật</h2>
      <ul>
        {product.specs.map(spec => (
          <li>{spec.name}: {spec.value}</li>
        ))}
      </ul>
    </section>
    
    <!-- ISLAND 3: Reviews (React) -->
    <Reviews 
      productId={product.id}
      client:visible
    />
    
    <!-- ISLAND 4: Recommendations (React) -->
    <RecommendedProducts 
      category={product.category}
      client:media="(min-width: 768px)"
    />
  </body>
</html>
```

### 9.3 Performance Comparison

**Trước Islands (Traditional SSR):**
```
JavaScript Bundle: 250 KB
TTI: 3.5s
FCP: 1.2s
```

**Sau Islands:**
```
JavaScript Bundle: 42 KB (giảm 83%)
TTI: 0.8s (nhanh hơn 4.4x)
FCP: 0.6s (nhanh hơn 2x)
```

---

## 10. KHI NÀO NÊN SỬ DỤNG

### 10.1 Phù Hợp ✅

#### Content-Heavy Sites
- Blog, tin tức
- Documentation sites
- Marketing pages
- Portfolio sites

#### E-commerce
- Product pages
- Category pages
- Landing pages

#### Corporate Sites
- Company websites
- About pages
- Contact pages

### 10.2 Không Phù Hợp ❌

#### Highly Interactive Apps
- Social media platforms (Facebook, Twitter)
- Real-time collaboration (Google Docs, Figma)
- Online games
- Chat applications

#### Admin Dashboards
- Nhiều state management
- Nhiều real-time updates
- Complex data flows

### 10.3 Decision Matrix

```
                    Nội Dung Tĩnh
                          ↑
                          |
                    ISLANDS |
                    PERFECT |
                          |
←─────────────────────────┼─────────────────────────→
Ít Tương Tác              |              Nhiều Tương Tác
                          |
                          |    SPA
                          |    BETTER
                          |
                          ↓
                    Nội Dung Động
```

---

## 📝 CHECKLIST HỌC TẬP

### Kiến Thức Cơ Bản
- [ ] Hiểu khái niệm "Island"
- [ ] Phân biệt static vs dynamic content
- [ ] Hiểu quy trình hydration
- [ ] Biết sự khác biệt với SSR truyền thống

### Kiến Thức Nâng Cao
- [ ] Hiểu partial hydration
- [ ] Biết cách scheduling với requestIdleCallback
- [ ] So sánh được với micro-frontends
- [ ] Hiểu trade-offs của pattern

### Thực Hành
- [ ] Cài đặt và chạy Astro
- [ ] Tạo island đơn giản
- [ ] Sử dụng client directives
- [ ] Build một blog page hoàn chỉnh
- [ ] Đo lường performance improvements

---

## 🎯 CÂU HỎI ÔN TẬP

### Câu Hỏi Lý Thuyết

1. **Islands Architecture giải quyết vấn đề gì của SSR truyền thống?**
   <details>
   <summary>Đáp án</summary>
   - Giảm JavaScript bloat
   - Loại bỏ top-down rendering
   - Cải thiện TTI
   - Tách biệt lỗi giữa các components
   </details>

2. **Sự khác biệt chính giữa Islands và Progressive Enhancement là gì?**
   <details>
   <summary>Đáp án</summary>
   Islands có SSR hydration tích hợp và metaphor nhất quán cho component-based interactivity
   </details>

3. **Tại sao Islands không phù hợp với social media apps?**
   <details>
   <summary>Đáp án</summary>
   Vì cần quá nhiều islands (hàng nghìn), làm mất đi lợi ích của pattern
   </details>

### Câu Hỏi Thực Hành

1. **Làm thế nào để tạo một island chỉ load khi visible trong Astro?**
   <details>
   <summary>Đáp án</summary>
   ```astro
   <MyComponent client:visible />
   ```
   </details>

2. **Framework nào hỗ trợ streaming rendering với Islands?**
   <details>
   <summary>Đáp án</summary>
   Marko
   </details>

---

## 📚 TÀI LIỆU THAM KHẢO

### Bài Viết Gốc
- Jason Miller's Islands Architecture post
- Katie Sylor-Miller's JSConf talk

### Framework Documentation
- [Astro Docs](https://docs.astro.build)
- [Marko Docs](https://markojs.com)
- [Eleventy Docs](https://www.11ty.dev)

### Case Studies
- Astro vs Next.js performance comparison
- eBay's Marko implementation
- Etsy's frontend architecture evolution

---

## 💡 TIPS HỌC TẬP

1. **Bắt đầu với Astro** - Dễ nhất để học Islands
2. **Build project thực tế** - Blog hoặc portfolio
3. **Đo lường performance** - So sánh với SPA
4. **Thử nhiều frameworks** - Hiểu trade-offs
5. **Đọc source code** - Học cách implement

---

## 🚀 BƯỚC TIẾP THEO

1. Cài đặt Astro và tạo project đầu tiên
2. Migrate một trang blog sang Islands
3. Thử nghiệm với các client directives
4. Đo lường và so sánh performance
5. Khám phá Marko cho streaming rendering

---

**Chúc bạn học tốt! 🎉**

*Study guide này được tạo dựa trên tài liệu từ Jason Miller, Katie Sylor-Miller và cộng đồng Islands Architecture.*
