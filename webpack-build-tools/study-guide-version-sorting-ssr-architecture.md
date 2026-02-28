# Study Guide: Sắp xếp Version Numbers và Kiến trúc SSR

## Mục lục
1. [Thuật toán sắp xếp Version Numbers](#thuật-toán-sắp-xếp-version-numbers)
2. [Kiến trúc SSR (Server-Side Rendering)](#kiến-trúc-ssr-server-side-rendering)
3. [Segment SSR Architecture](#segment-ssr-architecture)

---

## Thuật toán sắp xếp Version Numbers

### Bài toán

Cho một danh sách các số phiên bản (version numbers), cần sắp xếp chúng theo thứ tự tăng dần.

**Ví dụ:**
```
Input:  ["1.0.1", "0.1", "1.3.26", "1.0.3.29", "2.1.3", "1.0.9.7.25"]
Output: ["0.1", "1.0.1", "1.0.3.29", "1.0.9.7.25", "1.3.26", "2.1.3"]
```

### Thách thức

❌ **Không thể sắp xếp trực tiếp như string:**
```javascript
// SAI - So sánh string sẽ cho kết quả sai
["1.0.1", "0.1", "1.3.26"].sort()
// Kết quả: ["0.1", "1.0.1", "1.3.26"] ✓ (may mắn đúng)

["1.2", "1.10", "1.3"].sort()
// Kết quả: ["1.10", "1.2", "1.3"] ✗ (SAI - vì so sánh string)
// Đúng phải là: ["1.2", "1.3", "1.10"]
```

❌ **Các version có độ dài khác nhau:**
- `"1.0"` vs `"1.0.1.5"`
- Cần xử lý các phần thiếu như số 0

### Giải pháp: Thuật toán viết tay

```javascript
function sortVersions(versions) {
  return versions.sort((a, b) => {
    // Bước 1: Tách version thành mảng số
    const partsA = a.split('.').map(Number);
    const partsB = b.split('.').map(Number);
    
    // Bước 2: Tìm độ dài lớn nhất
    const maxLength = Math.max(partsA.length, partsB.length);
    
    // Bước 3: So sánh từng phần
    for (let i = 0; i < maxLength; i++) {
      const numA = partsA[i] || 0;  // Nếu không có thì coi như 0
      const numB = partsB[i] || 0;
      
      if (numA !== numB) {
        return numA - numB;  // Trả về âm nếu a < b, dương nếu a > b
      }
    }
    
    return 0;  // Hai version bằng nhau
  });
}
```

### Phân tích từng bước

#### Bước 1: Tách version thành mảng số

```javascript
const partsA = a.split('.').map(Number);
```

**Ví dụ:**
```javascript
"1.0.3.29".split('.')     // ["1", "0", "3", "29"]
         .map(Number)     // [1, 0, 3, 29]
```

**Tại sao dùng `map(Number)`?**
- Chuyển string thành số để so sánh chính xác
- `"10" > "9"` là `false` (so sánh string)
- `10 > 9` là `true` (so sánh số) ✓

#### Bước 2: Tìm độ dài lớn nhất

```javascript
const maxLength = Math.max(partsA.length, partsB.length);
```

**Tại sao cần maxLength?**

So sánh `"1.0"` với `"1.0.1"`:
```javascript
partsA = [1, 0]        // length = 2
partsB = [1, 0, 1]     // length = 3
maxLength = 3          // Phải duyệt đủ 3 phần
```

#### Bước 3: So sánh từng phần

```javascript
for (let i = 0; i < maxLength; i++) {
  const numA = partsA[i] || 0;
  const numB = partsB[i] || 0;
  
  if (numA !== numB) {
    return numA - numB;
  }
}
```

**Ví dụ chi tiết:**

So sánh `"1.0"` với `"1.0.1"`:

| i | partsA[i] | partsB[i] | numA | numB | So sánh |
|---|-----------|-----------|------|------|---------|
| 0 | 1 | 1 | 1 | 1 | Bằng nhau, tiếp tục |
| 1 | 0 | 0 | 0 | 0 | Bằng nhau, tiếp tục |
| 2 | undefined | 1 | 0 | 1 | 0 < 1, return -1 |

**Kết quả:** `"1.0"` < `"1.0.1"` ✓

### Độ phức tạp

- **Thời gian:** O(n × m × log n)
  - n: số lượng version
  - m: số phần trung bình của mỗi version
  - log n: độ phức tạp của thuật toán sort

- **Không gian:** O(n × m)
  - Lưu trữ các mảng parts

### Test cases

```javascript
// Test 1: Các version có độ dài khác nhau
console.log(sortVersions(["1.0", "1.0.1", "1"]));
// Output: ["1", "1.0", "1.0.1"]

// Test 2: Version có số lớn
console.log(sortVersions(["1.2", "1.10", "1.3"]));
// Output: ["1.2", "1.3", "1.10"]

// Test 3: Version phức tạp
console.log(sortVersions(["1.0.1", "0.1", "1.3.26", "1.0.3.29", "2.1.3", "1.0.9.7.25"]));
// Output: ["0.1", "1.0.1", "1.0.3.29", "1.0.9.7.25", "1.3.26", "2.1.3"]

// Test 4: Version giống nhau
console.log(sortVersions(["1.0.0", "1.0", "1"]));
// Output: ["1", "1.0", "1.0.0"] (cả 3 đều bằng nhau về mặt giá trị)
```

### Cải tiến và biến thể

#### Biến thể 1: Xử lý version có chữ cái

```javascript
function sortVersionsWithAlpha(versions) {
  return versions.sort((a, b) => {
    const partsA = a.split('.').map(part => {
      const num = parseInt(part);
      return isNaN(num) ? part : num;
    });
    const partsB = b.split('.').map(part => {
      const num = parseInt(part);
      return isNaN(num) ? part : num;
    });
    
    const maxLength = Math.max(partsA.length, partsB.length);
    
    for (let i = 0; i < maxLength; i++) {
      const valA = partsA[i] || 0;
      const valB = partsB[i] || 0;
      
      if (typeof valA === 'number' && typeof valB === 'number') {
        if (valA !== valB) return valA - valB;
      } else {
        const strA = String(valA);
        const strB = String(valB);
        if (strA !== strB) return strA.localeCompare(strB);
      }
    }
    
    return 0;
  });
}

// Test
console.log(sortVersionsWithAlpha(["1.0.0-alpha", "1.0.0-beta", "1.0.0"]));
```

#### Biến thể 2: Sắp xếp giảm dần

```javascript
function sortVersionsDesc(versions) {
  return versions.sort((a, b) => {
    const partsA = a.split('.').map(Number);
    const partsB = b.split('.').map(Number);
    const maxLength = Math.max(partsA.length, partsB.length);
    
    for (let i = 0; i < maxLength; i++) {
      const numA = partsA[i] || 0;
      const numB = partsB[i] || 0;
      
      if (numA !== numB) {
        return numB - numA;  // Đảo ngược so sánh
      }
    }
    
    return 0;
  });
}
```

### Lỗi thường gặp

❌ **Lỗi 1: Quên chuyển sang Number**
```javascript
// SAI
const parts = "1.10.2".split('.');  // ["1", "10", "2"]
// "10" < "2" là true (so sánh string)

// ĐÚNG
const parts = "1.10.2".split('.').map(Number);  // [1, 10, 2]
// 10 > 2 là true (so sánh số)
```

❌ **Lỗi 2: Không xử lý độ dài khác nhau**
```javascript
// SAI - chỉ duyệt đến độ dài ngắn nhất
for (let i = 0; i < Math.min(partsA.length, partsB.length); i++)

// ĐÚNG - duyệt đến độ dài dài nhất
for (let i = 0; i < Math.max(partsA.length, partsB.length); i++)
```

❌ **Lỗi 3: Không xử lý undefined**
```javascript
// SAI
const numA = partsA[i];  // có thể là undefined

// ĐÚNG
const numA = partsA[i] || 0;  // coi undefined như 0
```

---

## Kiến trúc SSR (Server-Side Rendering)

### Tổng quan

SSR là kiến trúc render HTML trên server trước khi gửi về client, giúp cải thiện SEO và tốc độ tải trang ban đầu.

### Kiến trúc cơ bản

```
┌─────────┐         ┌─────────┐         ┌──────────┐
│ Browser │ Request │ Server  │  Query  │ Database │
│         ├────────>│         ├────────>│          │
│         │         │         │<────────┤          │
│         │         │         │  Data   │          │
│         │         │         │         └──────────┘
│         │         │ Render  │
│         │         │ HTML    │
│         │<────────┤         │
│         │  HTML   │         │
└─────────┘         └─────────┘
```

### Quy trình hoạt động chi tiết

#### 1. Request Phase (Giai đoạn yêu cầu)

```javascript
// Client gửi request
GET /product/123 HTTP/1.1
Host: example.com
```

#### 2. Server Processing (Xử lý trên server)

```javascript
// Server nhận request và xử lý
app.get('/product/:id', async (req, res) => {
  // Bước 1: Lấy dữ liệu
  const product = await db.getProduct(req.params.id);
  
  // Bước 2: Render React component thành HTML
  const html = ReactDOMServer.renderToString(
    <ProductPage product={product} />
  );
  
  // Bước 3: Nhúng HTML vào template
  const fullHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${product.name}</title>
        <script src="/bundle.js"></script>
      </head>
      <body>
        <div id="root">${html}</div>
        <script>
          window.__INITIAL_DATA__ = ${JSON.stringify(product)};
        </script>
      </body>
    </html>
  `;
  
  // Bước 4: Gửi HTML về client
  res.send(fullHtml);
});
```

#### 3. Client Hydration (Kích hoạt trên client)

```javascript
// Client nhận HTML và hydrate
import { hydrateRoot } from 'react-dom/client';

const initialData = window.__INITIAL_DATA__;
const root = document.getElementById('root');

hydrateRoot(root, <ProductPage product={initialData} />);
```

### Các thành phần chính

#### 1. Server Renderer

```javascript
// server/renderer.js
import ReactDOMServer from 'react-dom/server';

export function renderApp(Component, props) {
  return ReactDOMServer.renderToString(
    <Component {...props} />
  );
}
```

#### 2. Data Fetching Layer

```javascript
// server/dataFetcher.js
export async function fetchPageData(url) {
  // Lấy dữ liệu từ API/Database
  const data = await fetch(`https://api.example.com${url}`);
  return data.json();
}
```

#### 3. HTML Template

```javascript
// server/template.js
export function htmlTemplate(content, initialData) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="/styles.css">
      </head>
      <body>
        <div id="root">${content}</div>
        <script>
          window.__INITIAL_DATA__ = ${JSON.stringify(initialData)};
        </script>
        <script src="/client.js"></script>
      </body>
    </html>
  `;
}
```

### Ưu điểm của kiến trúc SSR

✅ **SEO tốt hơn**
- Search engine nhận được HTML hoàn chỉnh
- Không cần chờ JavaScript thực thi

✅ **First Contentful Paint (FCP) nhanh**
- User thấy nội dung ngay lập tức
- Cải thiện trải nghiệm người dùng

✅ **Hoạt động tốt trên thiết bị yếu**
- Giảm tải xử lý cho client
- Phù hợp với mobile và thiết bị cũ

### Nhược điểm

❌ **Tải server cao**
- Mỗi request cần render lại
- Chi phí server tăng

❌ **TTFB (Time To First Byte) chậm hơn**
- Phải đợi server render xong
- Phụ thuộc vào tốc độ server

❌ **Phức tạp hơn**
- Cần maintain code cho cả server và client
- Khó debug hơn

---

## Segment SSR Architecture

### Khái niệm

**Segment SSR** (hay còn gọi là **Progressive SSR** hoặc **Streaming SSR**) là kiến trúc chia trang web thành nhiều phần (segments) và render từng phần một, thay vì đợi render toàn bộ trang.

### Vấn đề của SSR truyền thống

```
Traditional SSR Timeline:
├─────────────────────────────────┤ Server rendering (5s)
                                  └──┤ Send HTML (0.1s)
                                     └─┤ User sees content

Total: 5.1s để user thấy nội dung
```

**Vấn đề:**
- Nếu một phần chậm (ví dụ: query database phức tạp), toàn bộ trang bị chậm
- User phải đợi tất cả dữ liệu sẵn sàng

### Giải pháp: Segment SSR

```
Segment SSR Timeline:
├──┤ Render Header (0.1s)
   └──┤ Send Header HTML (0.1s) → User sees header
      ├────┤ Render Main (2s)
           └──┤ Send Main HTML (0.1s) → User sees main content
              ├──────────┤ Render Sidebar (3s)
                         └──┤ Send Sidebar HTML (0.1s) → User sees sidebar

Total: 0.2s để user thấy nội dung đầu tiên (header)
       2.4s để thấy nội dung chính
       5.5s để thấy toàn bộ trang
```

### Kiến trúc Segment SSR

```
┌─────────────────────────────────────────┐
│           Browser                       │
│  ┌─────────────────────────────────┐   │
│  │ Header (rendered first)         │   │
│  ├─────────────────────────────────┤   │
│  │ Main Content (rendered second)  │   │
│  ├─────────────────────────────────┤   │
│  │ Sidebar (rendered last)         │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
         ↑         ↑         ↑
         │         │         │
    Stream 1   Stream 2  Stream 3
         │         │         │
┌────────┴─────────┴─────────┴────────────┐
│           Server                         │
│  ┌──────────┐  ┌──────────┐  ┌────────┐│
│  │ Segment  │  │ Segment  │  │Segment ││
│  │    1     │  │    2     │  │   3    ││
│  └──────────┘  └──────────┘  └────────┘│
└──────────────────────────────────────────┘
```

### Cài đặt với React 18 Suspense

```javascript
// app/page.js
import { Suspense } from 'react';

export default function Page() {
  return (
    <div>
      {/* Segment 1: Render ngay lập tức */}
      <Header />
      
      {/* Segment 2: Render khi data sẵn sàng */}
      <Suspense fallback={<LoadingMain />}>
        <MainContent />
      </Suspense>
      
      {/* Segment 3: Render sau cùng */}
      <Suspense fallback={<LoadingSidebar />}>
        <Sidebar />
      </Suspense>
    </div>
  );
}

// Component với async data fetching
async function MainContent() {
  const data = await fetchMainData(); // Có thể mất 2s
  return <div>{data.content}</div>;
}

async function Sidebar() {
  const data = await fetchSidebarData(); // Có thể mất 3s
  return <aside>{data.items}</aside>;
}
```

### Cách hoạt động

#### 1. Initial Response (Phản hồi ban đầu)

Server gửi HTML shell ngay lập tức:

```html
<!DOCTYPE html>
<html>
<body>
  <div id="root">
    <header>Header content</header>
    
    <!-- Placeholder cho MainContent -->
    <div id="suspense-1">
      <div class="loading">Loading main content...</div>
    </div>
    
    <!-- Placeholder cho Sidebar -->
    <div id="suspense-2">
      <div class="loading">Loading sidebar...</div>
    </div>
  </div>
  <script src="/client.js"></script>
</body>
</html>
```

#### 2. Streaming Updates (Cập nhật dần)

Khi data sẵn sàng, server stream thêm HTML:

```html
<!-- Stream 1: MainContent ready -->
<script>
  document.getElementById('suspense-1').innerHTML = `
    <div class="main-content">
      <h1>Main Content</h1>
      <p>Content here...</p>
    </div>
  `;
</script>

<!-- Stream 2: Sidebar ready -->
<script>
  document.getElementById('suspense-2').innerHTML = `
    <aside class="sidebar">
      <ul>
        <li>Item 1</li>
        <li>Item 2</li>
      </ul>
    </aside>
  `;
</script>
```

### Ưu điểm của Segment SSR

✅ **Time to First Byte (TTFB) nhanh hơn**
- Không cần đợi tất cả data
- User thấy nội dung ngay lập tức

✅ **Progressive Loading**
- Trang load dần dần
- Trải nghiệm mượt mà hơn

✅ **Tối ưu hiệu năng**
- Các phần độc lập không ảnh hưởng lẫn nhau
- Phần nào chậm không làm chậm phần khác

✅ **SEO vẫn tốt**
- Search engine vẫn nhận được HTML đầy đủ
- Chỉ là nhận dần thay vì một lần

### Nhược điểm

❌ **Phức tạp hơn**
- Cần xử lý streaming
- Khó debug

❌ **Yêu cầu framework hỗ trợ**
- React 18+ với Suspense
- Next.js 13+ hoặc Remix

❌ **Có thể gây layout shift**
- Nội dung xuất hiện dần có thể làm trang nhảy
- Cần dự trù kích thước placeholder

### So sánh SSR vs Segment SSR

| Tiêu chí | Traditional SSR | Segment SSR |
|----------|----------------|-------------|
| **TTFB** | Chậm (đợi tất cả) | Nhanh (gửi ngay) |
| **Time to Interactive** | Nhanh hơn | Chậm hơn một chút |
| **User Experience** | Thấy tất cả cùng lúc | Thấy dần dần |
| **Độ phức tạp** | Trung bình | Cao |
| **SEO** | Tốt | Tốt |
| **Tải server** | Cao | Cao (nhưng phân tán) |

### Khi nào dùng Segment SSR?

✅ **Nên dùng khi:**
- Trang có nhiều phần độc lập
- Một số phần có data fetching chậm
- Muốn cải thiện perceived performance
- Có các phần ít quan trọng (sidebar, comments)

❌ **Không nên dùng khi:**
- Trang đơn giản, ít nội dung
- Tất cả data load nhanh như nhau
- Cần tất cả nội dung hiển thị cùng lúc
- Team chưa quen với streaming SSR

### Ví dụ thực tế với Next.js 13+

```javascript
// app/product/[id]/page.js
import { Suspense }from 'react';

export default function ProductPage({ params }) {
  return (
    <div>
      {/* Segment 1: Product info - quan trọng nhất */}
      <Suspense fallback={<ProductSkeleton />}>
        <ProductInfo id={params.id} />
      </Suspense>
      
      {/* Segment 2: Reviews - ít quan trọng hơn */}
      <Suspense fallback={<ReviewsSkeleton />}>
        <ProductReviews id={params.id} />
      </Suspense>
      
      {/* Segment 3: Recommendations - ít quan trọng nhất */}
      <Suspense fallback={<RecommendationsSkeleton />}>
        <RelatedProducts id={params.id}/>
      </Suspense>
    </div>
  );
}

// Async Server Component
async function ProductInfo({ id }) {
  const product = await db.product.findUnique({ where: { id } });
  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      <span>${product.price}</span>
    </div>
  );
}

async function ProductReviews({ id }) {
  // Có thể mất 2-3s
  const reviews = await db.review.findMany({ 
    where: { productId: id },
    take: 10 
  });
  return (
    <div>
      {reviews.map(review => (
        <ReviewCard key={review.id}review={review}/>
      ))}
    </div>
  );
}

async function RelatedProducts({ id }) {
  // Có thể mất 3-4s (ML recommendation)
  const related = await recommendationEngine.getRelated(id);
  return (
    <div>
      {related.map(product => (
        <ProductCard key={product.id} product={product}/>
      ))}
    </div>
  );
}
```

### Best Practices

#### 1. Ưu tiên nội dung quan trọng

```javascript
// ✓ ĐÚNG: Nội dung chính không wrap trong Suspense
<div>
  <MainContent />  {/* Render ngay */}
  <Suspense fallback={<Loading />}>
    <Comments />  {/* Có thể đợi */}
  </Suspense>
</div>

// ✗ SAI: Wrap tất cả trong Suspense
<Suspense fallback={<Loading />}>
  <MainContent />  {/* Không nên đợi */}
  <Comments />
</Suspense>
```

#### 2. Tạo skeleton loading hợp lý

```javascript
function ProductSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
      <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
    </div>
  );
}
```

#### 3. Xử lý lỗi cho từng segment

```javascript
import { ErrorBoundary } from 'react-error-boundary';

<ErrorBoundary fallback={<ErrorMessage />}>
  <Suspense fallback={<Loading />}>
    <DataComponent />
  </Suspense>
</ErrorBoundary>
```

---

## Tổng kết

### Version Sorting Algorithm
- Thuật toán quan trọng trong quản lý phiên bản
- Cần xử lý cẩn thận: chuyển đổi kiểu dữ liệu, độ dài khác nhau
- Độ phức tạp O(n × m × log n)

### SSR Architecture
- Render HTML trên server để cải thiện SEO và FCP
- Trade-off giữa server load và user experience
- Phù hợp với content-heavy websites

### Segment SSR
- Cải tiến của SSR truyền thống
- Streaming HTML để giảm TTFB
- Cần framework hỗ trợ (React 18+, Next.js 13+)
- Tốt nhất cho trang có nhiều phần độc lập

### Lựa chọn kiến trúc

```
Nội dung tĩnh → SSG
Nội dung động, cần SEO → SSR
Trang phức tạp, nhiều phần → Segment SSR
Ứng dụng tương tác cao → CSR (Client-Side Rendering)
```
