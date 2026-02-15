# Study Guide: SSR, Segment SSR và RSI

## Mục lục
1. [Traditional SSR (Server-Side Rendering)](#1-traditional-ssr)
2. [Segment SSR (Phân đoạn SSR)](#2-segment-ssr)
3. [RSI (Remote Server Includes)](#3-rsi)
4. [So sánh các phương pháp](#4-so-sánh)
5. [Bài tập thực hành](#5-bài-tập-thực-hành)

---

## 1. Traditional SSR (Server-Side Rendering)

### Khái niệm cơ bản
**Server-Side Rendering (SSR)** là kỹ thuật render HTML hoàn chỉnh trên server trước khi gửi về trình duyệt của người dùng.

### Quy trình hoạt động

```
Người dùng gửi yêu cầu
    ↓
Server Node.js nhận request
    ↓
Thực thi render React/Vue components
    ↓
Tạo HTML hoàn chỉnh + JavaScript cho client
    ↓
Gửi về trình duyệt
    ↓
Trình duyệt thực hiện Hydration (kích hoạt tương tác)
```

### Chi tiết kỹ thuật

**Runtime Rendering**: Khi người dùng yêu cầu trang, server sẽ:
- Chạy code React/Vue để tạo HTML
- Kết nối database nếu cần
- Xử lý logic nghiệp vụ
- Trả về HTML đã render sẵn

### Ví dụ code

```javascript
// Server Express.js với React SSR
import express from 'express';
import React from 'react';
import { renderToString } from 'react-dom/server';
import App from './App';

const app = express();

app.get('/', (req, res) => {
  // Render component thành HTML string
  const html = renderToString(<App />);
  
  // Gửi HTML hoàn chỉnh về client
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>SSR App</title>
      </head>
      <body>
        <div id="root">${html}</div>
        <script src="/bundle.js"></script>
      </body>
    </html>
  `);
});

app.listen(3000);
```

### Ưu điểm ✅

1. **Tải trang đầu tiên nhanh (Fast First Paint)**
   - Người dùng thấy nội dung ngay lập tức
   - Không cần đợi JavaScript tải xong

2. **Thân thiện với SEO**
   - Công cụ tìm kiếm đọc được nội dung HTML
   - Tốt cho Google, Bing indexing

3. **Tương thích thiết bị yếu**
   - Thiết bị cũ vẫn hiển thị được nội dung
   - Ít phụ thuộc vào JavaScript client

### Nhược điểm ❌

1. **Tải cao cho server**
   - Mỗi request phải render lại toàn bộ
   - Tốn CPU và RAM server

2. **TTFB (Time to First Byte) cao**
   - Người dùng phải đợi server render xong
   - Có thể chậm nếu có nhiều logic phức tạp

3. **Khó scale**
   - Cần nhiều server khi traffic tăng
   - Chi phí infrastructure cao

### Khi nào nên dùng?

- Website tin tức, blog (cần SEO tốt)
- E-commerce (sản phẩm cần được index)
- Landing pages quan trọng
- Ứng dụng cần hỗ trợ thiết bị cũ

---

## 2. Segment SSR (Server-Side Rendering phân đoạn)

### Khái niệm cơ bản

**Segment SSR** là kỹ thuật chia trang thành nhiều phần độc lập (segments) và render từng phần một cách riêng biệt.

### Hai đặc điểm chính

#### 1. Streaming Chunked Rendering (Render theo luồng)
- Chia trang thành nhiều module độc lập
- Mỗi module có thể render riêng biệt
- Không cần đợi toàn bộ trang

#### 2. Progressive Rendering (Render tiến trình)
- Render và truyền tải đồng thời
- Gửi HTML về client ngay khi sẵn sàng
- Không đợi toàn bộ page hoàn thành

### Quy trình hoạt động

```
Request từ user
    ↓
Server bắt đầu render Header (gửi ngay)
    ↓
Server render ProductList (gửi tiếp)
    ↓
Server render Footer (gửi cuối)
    ↓
Browser nhận và hiển thị từng phần
```

### Ví dụ code với React 18

```javascript
// 1. Định nghĩa component có thể phân đoạn
import { Suspense } from 'react';

function Page() {
  return (
    <div>
      {/* Phần này render ngay lập tức */}
      <Header />
      
      {/* Phần này render bất đồng bộ */}
      <Suspense fallback={<Spinner />}>
        <ProductList />  {/* Module tải chậm */}
      </Suspense>
      
      {/* Phần này cũng render ngay */}
      <Footer />
    </div>
  );
}

// Component bất đồng bộ
async function ProductList() {
  // Giả sử fetch data từ API
  const products = await fetchProducts();
  
  return (
    <div>
      {products.map(p => (
        <ProductCard key={p.id}product={p}/>
      ))}
    </div>
  );
}
```

```javascript
// 2. Server streaming response
import { renderToPipeableStream } from 'react-dom/server';
import express from 'express';

const app = express();

app.get('/', (req, res) => {
  // Tạo stream để gửi HTML từng phần
  const stream = renderToPipeableStream(<Page />, {
    onShellReady() {
      // Gửi phần HTML ban đầu ngay lập tức
      res.setHeader('Content-Type', 'text/html');
      stream.pipe(res);
    },
    onError(error) {
      console.error(error);
    }
  });
});

app.listen(3000);
```

### Cách hoạt động chi tiết

**Bước 1**: Server gửi HTML shell (khung trang) ngay lập tức
```html
<!DOCTYPE html>
<html>
  <body>
    <header>Logo và Menu</header>
    <div id="products">
      <!-- Placeholder spinner -->
      <div class="spinner">Đang tải...</div>
    </div>
    <footer>Footer content</footer>
  </body>
</html>
```

**Bước 2**: Khi ProductList render xong, server gửi thêm:
```html
<script>
  // Code để thay thế spinner bằng nội dung thật
  document.getElementById('products').innerHTML = `
    <div class="product">Sản phẩm 1</div>
    <div class="product">Sản phẩm 2</div>
  `;
</script>
```

### Ưu điểm ✅

1. **Nội dung quan trọng hiển thị trước**
   - Critical CSS/JS được ưu tiên
   - Module không quan trọng lazy-load sau

2. **Giảm áp lực server**
   - CPU được sử dụng theo từng đoạn
   - Giảm peak memory pressure
   - Không bị block bởi một phần chậm

3. **Trải nghiệm người dùng tốt hơn**
   - Thấy nội dung nhanh hơn
   - Cảm giác trang load mượt mà

4. **Tối ưu TTFB**
   - Byte đầu tiên gửi đi rất nhanh
   - Không đợi toàn bộ render

### So sánh với Traditional SSR

| Tiêu chí | Traditional SSR | Segment SSR |
|----------|----------------|-------------|
| TTFB | Chậm (đợi full render) | Nhanh (gửi ngay phần đầu) |
| Memory | Cao (render toàn bộ) | Thấp hơn (render từng phần) |
| User Experience | Thấy trang một lúc | Thấy dần dần |
| Độ phức tạp code | Đơn giản | Phức tạp hơn |

### Khi nào nên dùng?

- Trang có nhiều phần độc lập
- Một số phần cần fetch data chậm
- Muốn tối ưu perceived performance
- Ứng dụng React 18+ hoặc framework hỗ trợ streaming

---

## 3. RSI (Remote Server Includes)

### Khái niệm cơ bản

**RSI (Remote Server Includes)** là kỹ thuật chia trang thành nhiều fragment (mảnh), mỗi fragment được render bởi service độc lập, sau đó kết hợp lại tại CDN edge.

### Kiến trúc

```
                    CDN Edge
                       ↓
        ┌──────────────┼──────────────┐
        ↓              ↓              ↓
   Service A      Service B      Service C
   (Header)       (Body)         (Footer)
        ↓              ↓              ↓
      DB A          API B          Cache C
```

### So sánh với Traditional SSR

```diff
- Traditional SSR: 
  [Database → Render toàn bộ → HTML hoàn chỉnh]

+ RSI:
  [Database → Render Fragment A] ──┐
  [API      → Render Fragment B] ──┼→ CDN kết hợp → HTML
  [Cache    → Render Fragment C] ──┘
```

### Ví dụ code

#### Service A - Render Header
```javascript
// service-header/index.js
import express from 'express';

const app = express();

app.get('/render-header', async (req, res) => {
  const user = await getUserFromDB(req.cookies.userId);
  
  const html = `
    <header>
      <h1>My Website</h1>
      <nav>
        <span>Xin chào, ${user.name}</span>
      </nav>
    </header>
  `;
  
  res.send(html);
});

app.listen(3001);
```

#### Service B - Render Body
```javascript
// service-body/index.js
import express from 'express';

const app = express();

app.get('/render-body', async (req, res) => {
  const products = await fetchProductsFromAPI();
  
  const html = `
    <main>
      ${products.map(p => `
        <div class="product">
          <h2>${p.name}</h2>
          <p>${p.price} VNĐ</p>
        </div>
      `).join('')}
    </main>
  `;
  
  res.send(html);
});

app.listen(3002);
```

#### CDN Edge Logic (Cloudflare Workers)
```javascript
// CDN edge worker
async function handleRequest(request) {
  // Gọi song song các service
  const [headerResponse, bodyResponse, footerResponse] = await Promise.all([
    fetch('https://service-a.com/render-header', {
      headers: { cookie: request.headers.get('cookie') }
    }),
    fetch('https://service-b.com/render-body'),
    fetch('https://service-c.com/render-footer')
  ]);
  
  // Kết hợp các fragment
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>RSI Example</title>
      </head>
      <body>
        ${await headerResponse.text()}
        ${await bodyResponse.text()}
        ${await footerResponse.text()}
      </body>
    </html>
  `;
  
  return new Response(html, {
    headers: { 'Content-Type': 'text/html' }
  });
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});
```

### Quy trình hoạt động chi tiết

**Bước 1**: User request đến CDN edge
```
User → CDN (gần nhất về địa lý)
```

**Bước 2**: CDN gọi các service song song
```
CDN → Service A (Header)
    → Service B (Body)  
    → Service C (Footer)
```

**Bước 3**: CDN nhận responses và kết hợp
```
Response A: <header>...</header>
Response B: <main>...</main>
Response C: <footer>...</footer>

→ Kết hợp thành HTML hoàn chỉnh
```

**Bước 4**: CDN gửi về user
```
CDN → User (HTML hoàn chỉnh)
```

### Ưu điểm ✅

1. **Giảm độ trễ từ origin server**
   - Xử lý tại edge gần user
   - Không cần về origin server chính

2. **Fault tolerance (Chịu lỗi tốt)**
   - Một fragment lỗi không ảnh hưởng toàn bộ
   - Có thể fallback sang nội dung mặc định

3. **Tách biệt concerns**
   - Mỗi team quản lý service riêng
   - Deploy độc lập không ảnh hưởng nhau

4. **Tối ưu cache**
   - Phần tĩnh pre-generate và cache lâu
   - Phần động render on-demand

5. **Scale linh hoạt**
   - Scale từng service theo nhu cầu
   - Không cần scale toàn bộ monolith

### Nhược điểm ❌

1. **Độ phức tạp cao**
   - Cần quản lý nhiều service
   - Infrastructure phức tạp hơn

2. **Chi phí CDN**
   - Tính phí theo request tại edge
   - Có thể đắt với traffic cao

3. **Debugging khó**
   - Lỗi có thể ở nhiều service
   - Cần distributed tracing

### Khi nào nên dùng?

- Ứng dụng lớn với nhiều team
- Cần scale từng phần độc lập
- Có traffic toàn cầu (cần CDN)
- Microservices architecture

---

## 4. So sánh các phương pháp

### Bảng so sánh tổng quan

| Tiêu chí | Traditional SSR | Segment SSR | RSI |
|----------|----------------|-------------|-----|
| **TTFB** | Chậm | Nhanh | Rất nhanh |
| **Độ phức tạp** | Thấp | Trung bình | Cao |
| **Server load** | Cao | Trung bình | Thấp (phân tán) |
| **SEO** | Tốt | Tốt | Tốt |
| **Scalability** | Khó | Trung bình | Dễ |
| **Chi phí** | Trung bình | Trung bình | Cao (CDN) |
| **Fault tolerance** | Thấp | Trung bình | Cao |
| **Cache** | Khó | Trung bình | Dễ (từng phần) |

### Khi nào dùng phương pháp nào?

#### Chọn Traditional SSR khi:
- Dự án nhỏ, đơn giản
- Team nhỏ, ít kinh nghiệm
- Budget hạn chế
- Không cần scale lớn

#### Chọn Segment SSR khi:
- Dùng React 18+ hoặc Next.js 13+
- Trang có phần tải chậm
- Muốn cải thiện UX
- Có kinh nghiệm với streaming

#### Chọn RSI khi:
- Ứng dụng lớn, nhiều team
- Microservices architecture
- Traffic toàn cầu
- Cần scale linh hoạt
- Budget đủ cho CDN

### Ví dụ thực tế

**E-commerce website**:
```
Header (user info)     → RSI Service A (cần auth)
Product listing        → Segment SSR (lazy load)
Recommendations        → RSI Service B (ML service)
Footer                 → Traditional SSR (static)
```

---

## 5. Bài tập thực hành

### Bài 1: Implement Traditional SSR

**Yêu cầu**: Tạo một trang blog đơn giản với Express + React SSR

**Gợi ý**:
```javascript
// TODO: Implement
// 1. Setup Express server
// 2. Create React component
// 3. Use renderToString
// 4. Return HTML with hydration script
```

### Bài 2: Implement Segment SSR

**Yêu cầu**: Chuyển đổi bài 1 sang Segment SSR với React 18

**Gợi ý**:
```javascript
// TODO: Implement
// 1. Wrap slow components với Suspense
// 2. Use renderToPipeableStream
// 3. Test streaming behavior
```

### Bài 3: Simulate RSI

**Yêu cầu**: Tạo 2 service riêng biệt và kết hợp tại một endpoint

**Gợi ý**:
```javascript
// Service 1: Port 3001 - render header
// Service 2: Port 3002 - render body
// Main service: Port 3000 - combine fragments
```

### Câu hỏi ôn tập

1. **Giải thích sự khác biệt giữa SSR và CSR (Client-Side Rendering)?**

2. **Tại sao Segment SSR có TTFB thấp hơn Traditional SSR?**

3. **RSI giải quyết vấn đề gì mà Traditional SSR không làm được?**

4. **Khi nào nên dùng Suspense trong React SSR?**

5. **CDN edge computing khác gì với origin server?**

### Tài nguyên học thêm

- React 18 Streaming SSR: https://react.dev/reference/react-dom/server
- Next.js App Router: https://nextjs.org/docs/app
- Cloudflare Workers: https://workers.cloudflare.com/
- Edge Computing concepts: https://www.cloudflare.com/learning/serverless/glossary/what-is-edge-computing/

---

## Tóm tắt

- **Traditional SSR**: Render toàn bộ trên server, đơn giản nhưng chậm
- **Segment SSR**: Render và stream từng phần, cải thiện TTFB và UX
- **RSI**: Render phân tán tại edge, tốt cho microservices và scale lớn

Chọn phương pháp phù hợp với quy mô dự án, team và yêu cầu kỹ thuật!
