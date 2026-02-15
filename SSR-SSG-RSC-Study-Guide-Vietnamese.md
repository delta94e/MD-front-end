# Hướng Dẫn Chi Tiết: SSR, SSG và RSC

## Mục Lục
1. [SSR - Server-Side Rendering](#1-ssr---server-side-rendering)
2. [SSG - Static Site Generation](#2-ssg---static-site-generation)
3. [RSC - React Server Components](#3-rsc---react-server-components)
4. [So Sánh Tổng Quan](#4-so-sánh-tổng-quan)
5. [Khi Nào Dùng Gì?](#5-khi-nào-dùng-gì)

---

## 1. SSR - Server-Side Rendering

### Nguyên lý hoạt động

SSR (Server-Side Rendering) là kỹ thuật render HTML trên server trước khi gửi về client.

**Quy trình:**

```
1. User yêu cầu trang → 2. Server chạy JavaScript
                         ↓
3. Server tạo HTML hoàn chỉnh → 4. Gửi HTML về browser
                                 ↓
5. Browser hiển thị HTML → 6. Tải JavaScript → 7. Hydration (tương tác)
```

**Hydration** là quá trình "kích hoạt" các event handler và state management trên HTML tĩnh đã được render.

### Ví dụ code

#### Next.js (App Router)
```javascript
// app/san-pham/[id]/page.js
export default async function ProductPage({ params }) {
  // Chạy trên server mỗi khi có request
  const res = await fetch(`https://api.example.com/products/${params.id}`, {
    cache: 'no-store' // Không cache, luôn fetch mới
  });
  const product = await res.json();
  
  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      <p>Giá: {product.price}VNĐ</p>
    </div>
  );
}
```

#### Next.js (Pages Router)
```javascript
// pages/san-pham/[id].js
export async function getServerSideProps(context) {
  const { id }= context.params;
  
  // Chạy trên server mỗi lần request
  const res = await fetch(`https://api.example.com/products/${id}`);
  const product = await res.json();
  
  return {
    props: { product }
  };
}

export default function ProductPage({ product }) {
  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
    </div>
  );
}
```

#### Nuxt.js
```vue
<!-- pages/san-pham/[id].vue -->
<template>
  <div>
    <h1>{{ product.name }}</h1>
    <p>{{ product.description }}</p>
    <p>Giá: {{ product.price }} VNĐ</p>
  </div>
</template>

<script setup>
const route = useRoute();

// useFetch tự động chạy trên server
const { data: product }= await useFetch(`https://api.example.com/products/${route.params.id}`);
</script>
```

### Ưu điểm

#### ✅ 1. Tốc độ hiển thị ban đầu nhanh (Fast First Contentful Paint)

```
SSR:  Request → Server render (500ms) → HTML hiển thị ngay
CSR:  Request → HTML trống → Tải JS (2s) → Chạy JS → Hiển thị
```

**Ví dụ thực tế:**
- Người dùng thấy nội dung sau 500ms (SSR)
- So với 2-3 giây với CSR (Client-Side Rendering)

#### ✅ 2. SEO thân thiện

```html
<!-- HTML mà Google bot nhận được (SSR) -->
<html>
  <head>
    <title>Giày thể thao Nike Air Max</title>
    <meta name="description" content="Giày Nike chính hãng giá tốt"/>
  </head>
  <body>
    <h1>Giày thể thao Nike Air Max</h1>
    <p>Giá: 2,500,000 VNĐ</p>
  </body>
</html>
```

Google bot có thể đọc và index nội dung ngay lập tức.

#### ✅ 3. Tương thích thiết bị yếu

Thiết bị cũ hoặc mạng chậm vẫn thấy nội dung vì HTML đã được render sẵn.

### Nhược điểm

#### ❌ 1. Tải server cao

```javascript
// Mỗi request đều phải render
app.get('/san-pham/:id', async (req, res) => {
  const product = await db.getProduct(req.params.id);
  const html = renderToString(<ProductPage product={product} />);
  res.send(html);
});

// 1000 request/giây = 1000 lần render/giây
```

**Giải pháp:**
- Sử dụng cache (Redis)
- Load balancing
- CDN cho static assets

#### ❌ 2. TTFB (Time To First Byte) chậm

```
CSR: Request → HTML trống (50ms) → Tải JS
SSR: Request → Server render (500ms) → HTML đầy đủ
```

User phải đợi server render xong mới thấy gì.

#### ❌ 3. Độ trễ tương tác (TTI - Time To Interactive)

```html
<!-- User thấy button này ngay -->
<button>Thêm vào giỏ</button>

<!-- Nhưng click không hoạt động cho đến khi hydration xong (2-3s sau) -->
```

**Vấn đề:** User thấy nội dung nhưng chưa tương tác được → Trải nghiệm không tốt.

### Khi nào dùng SSR?

✅ **Nên dùng:**
- Website tin tức, blog cần SEO
- Trang sản phẩm e-commerce
- Dashboard cần dữ liệu real-time
- Nội dung cá nhân hóa (user-specific)

❌ **Không nên dùng:**
- Ứng dụng nội bộ không cần SEO
- Trang có nhiều tương tác phức tạp
- Server không đủ mạnh

---

## 2. SSG - Static Site Generation

### Nguyên lý hoạt động

SSG tạo sẵn tất cả HTML trong quá trình **build**, sau đó host trên CDN.

**Quy trình:**

```
Build time:
1. Fetch tất cả dữ liệu
2. Generate HTML cho mọi trang
3. Lưu file HTML tĩnh

Runtime:
User request → CDN trả về HTML ngay lập tức (< 50ms)
```

### Ví dụ code

#### Next.js (App Router) - Static Generation
```javascript
// app/blog/[slug]/page.js

// Tạo danh sách tất cả các trang cần generate
export async function generateStaticParams() {
  const posts = await fetch('https://api.example.com/posts').then(res => res.json());
  
  return posts.map(post => ({
    slug: post.slug
  }));
}

// Generate HTML cho mỗi trang
export default async function BlogPost({ params }) {
  const post = await fetch(`https://api.example.com/posts/${params.slug}`).then(res => res.json());
  
  return (
    <article>
      <h1>{post.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: post.content }} />
    </article>
  );
}
```

#### Next.js (Pages Router)
```javascript
// pages/blog/[slug].js

// Chạy lúc build, tạo danh sách paths
export async function getStaticPaths() {
  const res = await fetch('https://api.example.com/posts');
  const posts = await res.json();
  
  const paths = posts.map(post => ({
    params: { slug: post.slug }
  }));
  
  return {
    paths,
    fallback: false // 404 nếu path không tồn tại
  };
}

// Chạy lúc build, fetch data cho mỗi page
export async function getStaticProps({ params }) {
  const res = await fetch(`https://api.example.com/posts/${params.slug}`);
  const post = await res.json();
  
  return {
    props: { post },
    revalidate: 3600 // ISR: Regenerate sau 1 giờ
  };
}

export default function BlogPost({ post }) {
  return (
    <article>
      <h1>{post.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: post.content }}/>
    </article>
  );
}
```

#### Gatsby
```javascript
// gatsby-node.js
exports.createPages = async ({ graphql, actions }) => {
  const { createPage }= actions;
  
  const result = await graphql(`
    query {
      allMarkdownRemark {
        edges {
          node {
            frontmatter {
              slug
            }
          }
        }
      }
    }
  `);
  
  result.data.allMarkdownRemark.edges.forEach(({ node }) => {
    createPage({
      path: node.frontmatter.slug,
      component: path.resolve('./src/templates/blog-post.js'),
      context: {
        slug: node.frontmatter.slug
      }
    });
  });
};
```

### Ưu điểm

#### ✅ 1. Hiệu suất cực cao

```
Request → CDN (10-50ms) → HTML hiển thị ngay
```

**So sánh:**
- SSG: 10-50ms (CDN)
- SSR: 200-500ms (server render)
- CSR: 2-3s (tải + chạy JS)

#### ✅ 2. Không tải server

```
10,000 requests/giây → CDN xử lý tất cả
Server không cần làm gì
```

**Chi phí thấp:** Chỉ trả tiền CDN bandwidth, không cần server mạnh.

#### ✅ 3. Bảo mật cao

Không có server-side logic → Không thể tấn công server.

### Nhược điểm

#### ❌ 1. Không phù hợp nội dung động

```javascript
// Nếu có 10,000 sản phẩm
export async function getStaticPaths() {
  const products = await fetch('https://api.example.com/products').then(res => res.json());
  
  // Phải generate 10,000 HTML files
  return {
    paths: products.map(p => ({ params: { id: p.id } })),
    fallback: false
  };
}
```

**Vấn đề:**
- Thêm sản phẩm mới → Phải rebuild toàn bộ site
- Cập nhật giá → Phải rebuild

**Giải pháp:** ISR (Incremental Static Regeneration)

```javascript
export async function getStaticProps({ params }) {
  const product = await fetch(`https://api.example.com/products/${params.id}`).then(res => res.json());
  
  return {
    props: { product },
    revalidate: 60 // Regenerate sau 60 giây nếu có request mới
  };
}
```

#### ❌ 2. Build time lâu

```bash
# 10,000 trang × 500ms/trang = 5,000 giây = 83 phút build time
npm run build
```

**Giải pháp:**
- Sử dụng `fallback: 'blocking'` để generate on-demand
- Chia nhỏ build thành nhiều lần

#### ❌ 3. Không cá nhân hóa

Tất cả user thấy cùng một HTML.

**Giải pháp:** Kết hợp client-side JavaScript

```javascript
export default function ProductPage({ product }) {
  const [userPrice, setUserPrice] = useState(product.price);
  
  useEffect(() => {
    // Fetch giá theo user sau khi trang load
    fetch('/api/user-price')
      .then(res => res.json())
      .then(data => setUserPrice(data.price));
  }, []);
  
  return (
    <div>
      <h1>{product.name}</h1>
      <p>Giá: {userPrice} VNĐ</p>
    </div>
  );
}
```

### Khi nào dùng SSG?

✅ **Nên dùng:**
- Blog, documentation
- Landing page, marketing site
- Portfolio, company website
- Trang sản phẩm ít thay đổi

❌ **Không nên dùng:**
- Dashboard real-time
- Social media feed
- Trang cá nhân hóa cao
- Nội dung cập nhật liên tục

---

## 3. RSC - React Server Components

### Nguyên lý hoạt động

RSC cho phép **tách biệt component** thành:
- **Server Components:** Chạy trên server, không gửi JS về client
- **Client Components:** Chạy trên client, có tương tác

**Quy trình:**

```
1. Server Components fetch data và render
2. Kết quả được serialize thành JSON
3. Gửi về client
4. Client Components hydrate và xử lý tương tác
```

### Ví dụ code

#### Next.js 13+ App Router

```javascript
// app/dashboard/page.js (Server Component - mặc định)

import { ClientCounter } from './ClientCounter';

// Component này chạy trên server
export default async function Dashboard() {
  // Có thể truy cập database trực tiếp
  const db = await connectDB();
  const stats = await db.query('SELECT * FROM stats');
  
  // Có thể đọc file system
  const config = await fs.readFile('./config.json');
  
  // Có thể dùng secret keys
  const apiKey = process.env.SECRET_API_KEY;
  
  return (
    <div>
      <h1>Dashboard</h1>
      
      {/* Server Component - không gửi JS */}
      <ServerStats data={stats}/>
      
      {/* Client Component - có tương tác */}
      <ClientCounter />
    </div>
  );
}

// Server Component (không cần 'use client')
function ServerStats({ data }) {
  return (
    <div>
      <p>Tổng users: {data.totalUsers}</p>
      <p>Doanh thu: {data.revenue}</p>
    </div>
  );
}
```

```javascript
// app/dashboard/ClientCounter.js (Client Component)
'use client'; // Đánh dấu là Client Component

import { useState } from 'react';

export function ClientCounter() {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Tăng
      </button>
    </div>
  );
}
```

### Sự khác biệt Server vs Client Components

| Tính năng | Server Component | Client Component |
|-----------|------------------|------------------|
| Chạy ở đâu | Server | Client |
| Gửi JS về client | ❌ Không | ✅ Có |
| Có thể dùng hooks | ❌ Không | ✅ Có |
| Có thể dùng event handlers | ❌ Không | ✅ Có |
| Truy cập database | ✅ Có | ❌ Không |
| Truy cập file system | ✅ Có | ❌ Không |
| Dùng secret keys | ✅ Có | ❌ Không |
| SEO | ✅ Tốt | ⚠️ Phụ thuộc |

### Ví dụ thực tế: Trang sản phẩm

```javascript
// app/san-pham/[id]/page.js (Server Component)

import { AddToCartButton } from './AddToCartButton';
import { ProductReviews } from './ProductReviews';

export default async function ProductPage({ params }) {
  // Fetch trực tiếp từ database (chạy trên server)
  const product = await db.products.findById(params.id);
  const reviews = await db.reviews.findByProductId(params.id);
  
  return (
    <div>
      {/* Server Component - không gửi JS */}
      <ProductInfo product={product} />
      
      {/* Client Component - có tương tác */}
      <AddToCartButton productId={product.id} />
      
      {/* Server Component - render HTML tĩnh */}
      <ProductReviews reviews={reviews} />
    </div>
  );
}

// Server Component
function ProductInfo({ product }) {
  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      <p>Giá: {product.price} VNĐ</p>
    </div>
  );
}

// Server Component
function ProductReviews({ reviews }) {
  return (
    <div>
      <h2>Đánh giá</h2>
      {reviews.map(review => (
        <div key={review.id}>
          <p>{review.comment}</p>
          <p>⭐ {review.rating}/5</p>
        </div>
      ))}
    </div>
  );
}
```

```javascript
// app/san-pham/[id]/AddToCartButton.js (Client Component)
'use client';

import { useState } from 'react';

export function AddToCartButton({ productId }) {
  const [loading, setLoading] = useState(false);
  
  const handleAddToCart = async () => {
    setLoading(true);
    await fetch('/api/cart', {
      method: 'POST',
      body: JSON.stringify({ productId })
    });
    setLoading(false);
    alert('Đã thêm vào giỏ hàng!');
  };
  
  return (
    <button onClick={handleAddToCart} disabled={loading}>
      {loading ? 'Đang thêm...' : 'Thêm vào giỏ'}
    </button>
  );
}
```

### Ưu điểm

#### ✅ 1. Giảm kích thước JS bundle

```javascript
// Trước (CSR - tất cả chạy trên client)
import { format }from 'date-fns'; // 200KB
import { marked } from 'marked'; // 50KB

function BlogPost({ post }) {
  const formattedDate = format(new Date(post.date), 'dd/MM/yyyy');
  const html = marked(post.content);
  
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

// Bundle size: 250KB gửi về client
```

```javascript
// Sau (RSC - chạy trên server)
import { format } from 'date-fns';
import { marked } from 'marked';

// Server Component - không gửi JS về client
export default async function BlogPost({ params }) {
  const post = await db.posts.findBySlug(params.slug);
  const formattedDate = format(new Date(post.date), 'dd/MM/yyyy');
  const html = marked(post.content);
  
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

// Bundle size: 0KB (chỉ gửi HTML)
```

#### ✅ 2. Tự động code splitting

Next.js tự động chia nhỏ code theo route và component.

#### ✅ 3. Truy cập backend trực tiếp

```javascript
// Không cần tạo API route
export default async function UserProfile({ params }) {
  // Truy cập database trực tiếp
  const user = await db.users.findById(params.id);
  
  // Dùng secret key an toàn
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const subscription = await stripe.subscriptions.retrieve(user.subscriptionId);
  
  return (
    <div>
      <h1>{user.name}</h1>
      <p>Gói: {subscription.plan.name}</p>
    </div>
  );
}
```

### Nhược điểm

#### ❌ 1. Độ phức tạp cao

Phải hiểu rõ component nào nên là Server, component nào nên là Client.

**Quy tắc:**
- Cần tương tác (onClick, onChange) → Client Component
- Chỉ hiển thị dữ liệu → Server Component
- Dùng hooks (useState, useEffect) → Client Component
- Fetch data từ DB → Server Component

#### ❌ 2. Yêu cầu React 18+ và framework hỗ trợ

Chỉ hoạt động với:
- Next.js 13+ (App Router)
- Một số framework khác đang phát triển

#### ❌ 3. Debug khó khăn

```javascript
// Lỗi có thể xảy ra ở server hoặc client
export default async function Page() {
  const data = await fetchData(); // Lỗi ở server?
  
  return <ClientComponent data={data} />; // Lỗi ở client?
}
```

**Giải pháp:**
- Sử dụng error boundaries
- Log cẩn thận
- Hiểu rõ lifecycle

### Khi nào dùng RSC?

✅ **Nên dùng:**
- Ứng dụng phức tạp cần tối ưu bundle size
- Dashboard, admin panel
- Trang cần fetch nhiều data từ backend
- Muốn bảo mật logic trên server

❌ **Không nên dùng:**
- Dự án nhỏ, đơn giản
- Team chưa quen React 18+
- Cần tương thích với React cũ

---

## 4. So Sánh Tổng Quan

### Bảng so sánh

| Tiêu chí | SSR | SSG | RSC |
|----------|-----|-----|-----|
| **Render khi nào** | Mỗi request | Build time | Hybrid (server + client) |
| **Tốc độ hiển thị** | Nhanh (500ms) | Cực nhanh (50ms) | Nhanh (300ms) |
| **SEO** | ✅ Tốt | ✅ Tốt nhất | ✅ Tốt |
| **Nội dung động** | ✅ Tốt | ❌ Khó | ✅ Tốt |
| **Tải server** | ❌ Cao | ✅ Không có | ⚠️ Trung bình |
| **Bundle size** | ⚠️ Lớn | ⚠️ Lớn | ✅ Nhỏ |
| **Độ phức tạp** | ⚠️ Trung bình | ✅ Đơn giản | ❌ Cao |
| **Chi phí** | ❌ Cao (server) | ✅ Thấp (CDN) | ⚠️ Trung bình |

### Biểu đồ hiệu suất

```
Thời gian hiển thị (ms):
SSG:  ████ 50ms
RSC:  ████████ 300ms
SSR:  ████████████ 500ms
CSR:  ████████████████████████ 2000ms

Bundle size (KB):
RSC:  ████ 50KB
SSR:  ████████████ 200KB
SSG:  ████████████ 200KB
CSR:  ████████████████ 300KB
```

### Kết hợp các kỹ thuật

Trong thực tế, bạn có thể kết hợp:

```javascript
// Next.js App Router

// Trang chủ - SSG (nội dung tĩnh)
export default async function HomePage() {
  return <div>Trang chủ</div>;
}

// Blog - SSG với ISR
export const revalidate = 3600; // Regenerate mỗi giờ

export default async function BlogPage() {
  const posts = await db.posts.findAll();
  return <PostList posts={posts}/>;
}

// Dashboard - RSC (server + client components)
export default async function Dashboard() {
  const stats = await db.getStats(); // Server Component
  
  return (
    <div>
      <ServerStats data={stats} />
      <ClientChart data={stats}/> {/* Client Component */}
    </div>
  );
}

// User profile - SSR (dynamic, personalized)
export const dynamic = 'force-dynamic';

export default async function UserProfile({ params }) {
  const user = await db.users.findById(params.id);
  return <Profile user={user} />;
}
```

---

## 5. Khi Nào Dùng Gì?

### Decision Tree (Cây quyết định)

```
Bắt đầu
  │
  ├─ Cần SEO?
  │   ├─ Không → CSR (React SPA)
  │   └─ Có
  │       │
  │       ├─ Nội dung thay đổi thường xuyên?
  │       │   ├─ Không → SSG
  │       │   │   └─ Nhiều trang (>1000)?
  │       │   │       ├─ Không → SSG thuần
  │       │   │       └─ Có → SSG + ISR
  │       │   │
  │       │   └─ Có → Nội dung cá nhân hóa?
  │       │       ├─ Không → SSR
  │       │       └─ Có → RSC hoặc SSR
  │       │
  │       └─ Cần tối ưu bundle size?
  │           ├─ Không → SSR
  │           └─ Có → RSC
```

### Các trường hợp cụ thể

#### 1. Blog cá nhân
```
✅ Dùng: SSG
Lý do: Nội dung ít thay đổi, cần SEO, muốn tốc độ cao
Framework: Next.js, Gatsby, Hugo
```

#### 2. Website tin tức
```
✅ Dùng: SSG + ISR hoặc SSR
Lý do: Nội dung cập nhật thường xuyên, cần SEO
Framework: Next.js với ISR
```

#### 3. E-commerce
```
✅ Dùng: Hybrid
- Trang chủ, danh mục: SSG + ISR
- Trang sản phẩm: SSR hoặc SSG + ISR
- Giỏ hàng, checkout: CSR
- Dashboard admin: RSC
```

#### 4. Social media
```
✅ Dùng: CSR + SSR cho landing page
Lý do: Nội dung real-time, cá nhân hóa cao
Framework: React SPA + Next.js cho marketing pages
```

#### 5. Dashboard/Admin panel
```
✅ Dùng: RSC hoặc CSR
Lý do: Không cần SEO, nhiều tương tác, cần tối ưu bundle
Framework: Next.js App Router (RSC)
```

#### 6. Documentation site
```
✅ Dùng: SSG
Lý do: Nội dung tĩnh, cần SEO, tốc độ cao
Framework: Docusaurus, VitePress, Next.js
```

#### 7. Landing page marketing
```
✅ Dùng: SSG
Lý do: Nội dung tĩnh, cần SEO tốt nhất, tốc độ cực cao
Framework: Next.js, Astro
```

---

## Tổng Kết

### Chọn công nghệ phù hợp

**SSR:** Khi cần SEO + nội dung động + cá nhân hóa
**SSG:** Khi cần tốc độ cao + SEO + nội dung ít thay đổi
**RSC:** Khi cần tối ưu bundle + truy cập backend trực tiếp + ứng dụng phức tạp

### Best Practices

1. **Đừng over-engineer:** Bắt đầu đơn giản, tối ưu sau
2. **Đo lường hiệu suất:** Dùng Lighthouse, Web Vitals
3. **Kết hợp kỹ thuật:** Không nhất thiết chọn 1 cách duy nhất
4. **Ưu tiên trải nghiệm người dùng:** Tốc độ + SEO + tương tác mượt mà

### Công cụ hữu ích

- **Next.js:** Framework tốt nhất cho SSR/SSG/RSC
- **Nuxt.js:** Tương tự Next.js cho Vue
- **Gatsby:** Tốt cho SSG
- **Astro:** Tối ưu cho static sites
- **Remix:** Alternative cho Next.js, focus vào web fundamentals

Chúc bạn thành công! 🚀