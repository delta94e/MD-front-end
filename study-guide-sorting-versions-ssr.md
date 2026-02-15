# Study Guide: Sắp Xếp Phiên Bản & Kiến Trúc SSR

## Phần 1: Thuật Toán Sắp Xếp Số Phiên Bản

### 1.1 Giới Thiệu Bài Toán

**Đề bài:** Cho một danh sách các số phiên bản, hãy sắp xếp chúng theo thứ tự tăng dần.

**Ví dụ:**
- Input: `["1.0.1", "0.1", "1.3.26", "1.0.3.29", "2.1.3", "1.0.9.7.25"]`
- Output: `["0.1", "1.0.1", "1.0.3.29", "1.0.9.7.25", "1.3.26", "2.1.3"]`

### 1.2 Phân Tích Bài Toán

**Đặc điểm của số phiên bản:**
- Các số được phân tách bởi dấu chấm (`.`)
- Mỗi phần là một số nguyên
- Độ dài các phiên bản có thể khác nhau (vd: `0.1` vs `1.0.9.7.25`)
- So sánh từ trái sang phải, từng phần một

**Thách thức:**
- Không thể so sánh trực tiếp như chuỗi (vì `"2" > "10"` trong so sánh chuỗi)
- Phải xử lý các phiên bản có độ dài khác nhau
- Cần chuyển đổi từng phần thành số để so sánh chính xác

### 1.3 Giải Thuật Chi Tiết

```javascript
function sortVersions(versions) {
  return versions.sort((a, b) => {
    // Bước 1: Tách chuỗi thành mảng số
    const partsA = a.split('.').map(Number);
    const partsB = b.split('.').map(Number);
    
    // Bước 2: Tìm độ dài lớn nhất
    const maxLength = Math.max(partsA.length, partsB.length);
    
    // Bước 3: So sánh từng phần
    for (let i = 0; i < maxLength; i++) {
      const numA = partsA[i] || 0;  // Nếu không tồn tại, coi như 0
      const numB = partsB[i] || 0;
      
      if (numA !== numB) {
        return numA - numB;  // Trả về âm nếu a < b, dương nếu a > b
      }
    }
    
    return 0;  // Hai phiên bản bằng nhau
  });
}
```

### 1.4 Giải Thích Từng Bước

**Bước 1: Tách và chuyển đổi**
```javascript
const partsA = a.split('.').map(Number);
// "1.0.1" → ["1", "0", "1"] → [1, 0, 1]
```

**Bước 2: Xác định độ dài so sánh**
```javascript
const maxLength = Math.max(partsA.length, partsB.length);
// So sánh "1.0.1" (3 phần) với "1.0.9.7.25" (5 phần)
// maxLength = 5
```

**Bước 3: So sánh từng vị trí**
```javascript
// Ví dụ: So sánh "1.0.1" với "1.0.3.29"
// i=0: 1 === 1 → tiếp tục
// i=1: 0 === 0 → tiếp tục
// i=2: 1 < 3 → return -1 (1.0.1 đứng trước)
```

### 1.5 Độ Phức Tạp

- **Thời gian:** O(n × m × log n)
  - n: số lượng phiên bản
  - m: số phần trung bình của mỗi phiên bản
  - log n: độ phức tạp của thuật toán sort

- **Không gian:** O(n × m)
  - Lưu trữ các mảng con đã tách

### 1.6 Test Cases

```javascript
// Test 1: Các phiên bản cơ bản
console.log(sortVersions(["1.0", "1.1", "0.9"]));
// Output: ["0.9", "1.0", "1.1"]

// Test 2: Độ dài khác nhau
console.log(sortVersions(["1.0.0", "1.0", "1"]));
// Output: ["1", "1.0", "1.0.0"] (tất cả bằng nhau)

// Test 3: Số lớn
console.log(sortVersions(["1.10", "1.2", "1.9"]));
// Output: ["1.2", "1.9", "1.10"]

// Test 4: Phiên bản phức tạp
console.log(sortVersions(["1.0.1", "0.1", "1.3.26", "1.0.3.29", "2.1.3", "1.0.9.7.25"]));
// Output: ["0.1", "1.0.1", "1.0.3.29", "1.0.9.7.25", "1.3.26", "2.1.3"]
```

### 1.7 Các Biến Thể Của Bài Toán

**Biến thể 1: So sánh hai phiên bản**
```javascript
function compareVersions(v1, v2) {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  const maxLength = Math.max(parts1.length, parts2.length);
  
  for (let i = 0; i < maxLength; i++) {
    const num1 = parts1[i] || 0;
    const num2 = parts2[i] || 0;
    
    if (num1 < num2) return -1;
    if (num1 > num2) return 1;
  }
  
  return 0;
}
```

**Biến thể 2: Xử lý phiên bản có chữ cái (vd: "1.0.0-alpha")**
```javascript
function sortVersionsWithLabels(versions) {
  return versions.sort((a, b) => {
    // Tách phần số và phần nhãn
    const [numA, labelA = ''] = a.split('-');
    const [numB, labelB = ''] = b.split('-');
    
    // So sánh phần số trước
    const partsA = numA.split('.').map(Number);
    const partsB = numB.split('.').map(Number);
    const maxLength = Math.max(partsA.length, partsB.length);
    
    for (let i = 0; i < maxLength; i++) {
      const diff = (partsA[i] || 0) - (partsB[i] || 0);
      if (diff !== 0) return diff;
    }
    
    // Nếu phần số bằng nhau, so sánh nhãn
    return labelA.localeCompare(labelB);
  });
}
```

### 1.8 Lỗi Thường Gặp

❌ **Lỗi 1: So sánh trực tiếp chuỗi**
```javascript
// SAI
versions.sort(); // "10.0" sẽ đứng trước "2.0"
```

❌ **Lỗi 2: Không xử lý độ dài khác nhau**
```javascript
// SAI - sẽ bỏ qua các phần còn lại
for (let i = 0; i < partsA.length; i++) {
  // Nếu partsB ngắn hơn sẽ bị lỗi
}
```

❌ **Lỗi 3: Không chuyển đổi sang số**
```javascript
// SAI
const partsA = a.split('.'); // Vẫn là chuỗi
```

---

## Phần 2: Kiến Trúc SSR (Server-Side Rendering)

### 2.1 SSR Là Gì?

**Server-Side Rendering (SSR)** là kỹ thuật render HTML trên server thay vì trên client (browser).

**Quy trình:**
1. User gửi request đến server
2. Server chạy JavaScript, render HTML hoàn chỉnh
3. Server gửi HTML đã render về client
4. Browser hiển thị ngay lập tức
5. JavaScript "hydrate" để trang trở nên tương tác

### 2.2 So Sánh SSR vs CSR (Client-Side Rendering)

| Tiêu chí | SSR | CSR |
|----------|-----|-----|
| **Tốc độ hiển thị ban đầu** | Nhanh (HTML có sẵn) | Chậm (phải tải JS trước) |
| **SEO** | Tốt (crawler thấy nội dung) | Kém (cần JS để render) |
| **Time to Interactive** | Chậm hơn | Nhanh hơn |
| **Server load** | Cao | Thấp |
| **Trải nghiệm sau khi load** | Giống CSR | Mượt mà |

### 2.3 Ưu Điểm Của SSR

✅ **SEO tốt hơn**
- Search engine dễ dàng index nội dung
- Meta tags được render sẵn

✅ **First Contentful Paint (FCP) nhanh**
- User thấy nội dung ngay lập tức
- Không cần đợi JavaScript load

✅ **Tốt cho thiết bị yếu**
- Giảm tải xử lý cho client
- Phù hợp với mobile

✅ **Social media sharing**
- Preview cards hiển thị đúng
- Open Graph tags có sẵn

### 2.4 Nhược Điểm Của SSR

❌ **Server load cao**
- Mỗi request cần render lại
- Tốn tài nguyên server

❌ **Time to Interactive (TTI) chậm**
- Phải đợi hydration hoàn tất
- User thấy nội dung nhưng chưa tương tác được

❌ **Phức tạp hơn**
- Cần xử lý cả server và client
- Khó debug hơn

❌ **Chi phí hosting cao**
- Cần server mạnh
- Không thể dùng static hosting

### 2.5 Kiến Trúc SSR Cơ Bản

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ 1. Request
       ▼
┌─────────────────────┐
│   Node.js Server    │
│  ┌───────────────┐  │
│  │  React/Vue    │  │ 2. Render HTML
│  │  Component    │  │
│  └───────────────┘  │
│  ┌───────────────┐  │
│  │  Data Fetch   │  │ 3. Fetch data
│  └───────────────┘  │
└──────┬──────────────┘
       │ 4. Return HTML
       ▼
┌─────────────┐
│   Browser   │ 5. Display + Hydrate
└─────────────┘
```

### 2.6 Segment SSR (Partial SSR)

**Segment SSR** là kỹ thuật chỉ render một phần trang trên server, phần còn lại render trên client.

**Ví dụ kiến trúc:**
```
┌────────────────────────────┐
│         Header             │ ← SSR (static)
├────────────────────────────┤
│      Main Content          │ ← SSR (dynamic)
├────────────────────────────┤
│      Sidebar (Ads)         │ ← CSR (client-only)
├────────────────────────────┤
│      Comments              │ ← CSR (lazy load)
└────────────────────────────┘
```

### 2.7 Các Chiến Lược Segment SSR

**1. Static SSR**
- Render một lần, cache lâu dài
- Phù hợp: Header, Footer, Landing page

**2. Dynamic SSR**
- Render mỗi request
- Phù hợp: User dashboard, personalized content

**3. Incremental Static Regeneration (ISR)**
- Render static, cập nhật định kỳ
- Phù hợp: Blog posts, product pages

**4. Streaming SSR**
- Gửi HTML từng phần
- Phù hợp: Trang lớn, nhiều component

### 2.8 Ví Dụ Thực Tế: Next.js

**App Router với Segment SSR:**

```javascript
// app/page.js - SSR mặc định
export default async function HomePage() {
  const data = await fetch('https://api.example.com/data');
  return <div>{data.title}</div>;
}

// app/dashboard/page.js - Dynamic SSR
export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  const user = await getCurrentUser();
  return <div>Welcome {user.name}</div>;
}

// components/Comments.js - Client Component
'use client';

export default function Comments() {
  const [comments, setComments] = useState([]);
  
  useEffect(() => {
    fetch('/api/comments').then(res => setComments(res));
  }, []);
  
  return <div>{comments.map(c => <p>{c.text}</p>)}</div>;
}
```

### 2.9 Khi Nào Dùng SSR?

✅ **Nên dùng SSR khi:**
- SEO quan trọng (blog, e-commerce)
- Cần FCP nhanh
- Nội dung thay đổi thường xuyên
- Target audience có mạng chậm

❌ **Không nên dùng SSR khi:**
- Ứng dụng nội bộ (không cần SEO)
- Trang admin/dashboard
- Ứng dụng real-time phức tạp
- Budget server hạn chế

### 2.10 Best Practices

**1. Cache thông minh**
```javascript
// Cache static content
export const revalidate = 3600; // 1 giờ

// Cache per-user
const cacheKey = `user-${userId}`;
```

**2. Code splitting**
```javascript
// Lazy load component không cần thiết
const HeavyComponent = dynamic(() => import('./Heavy'), {
  loading: () => <Spinner />,
  ssr: false // Không SSR component này
});
```

**3. Optimize data fetching**
```javascript
// Fetch song song
const [user, posts] = await Promise.all([
  fetchUser(),
  fetchPosts()
]);
```

**4. Streaming cho nội dung lớn**
```javascript
// React 18 Suspense
<Suspense fallback={<Loading />}>
  <SlowComponent />
</Suspense>
```

### 2.11 Các Framework Hỗ Trợ SSR

| Framework | Đặc điểm |
|-----------|----------|
| **Next.js** | Full-featured, App Router, ISR |
| **Nuxt.js** | Vue ecosystem, auto-routing |
| **SvelteKit** | Lightweight, fast |
| **Remix** | Nested routing, progressive enhancement |
| **Astro** | Partial hydration, multi-framework |

---

## Phần 3: Bài Tập Thực Hành

### Bài 1: Sắp Xếp Phiên Bản
Viết hàm sắp xếp các phiên bản sau:
```javascript
["2.0.0", "1.9.9", "1.10.0", "1.2.3", "0.0.1"]
```

### Bài 2: So Sánh Phiên Bản
Viết hàm trả về phiên bản lớn nhất trong mảng.

### Bài 3: Thiết Kế SSR
Thiết kế kiến trúc SSR cho một trang e-commerce có:
- Header (logo, menu)
- Product list (dynamic)
- Sidebar filters
- Footer

Quyết định phần nào nên SSR, CSR, ISR và giải thích lý do.

---

## Tài Liệu Tham Khảo

- [Next.js Documentation - SSR](https://nextjs.org/docs)
- [React Server Components](https://react.dev/blog/2023/03/22/react-labs-what-we-have-been-working-on-march-2023)
- [Web.dev - Rendering Patterns](https://web.dev/rendering-on-the-web/)
- [MDN - Server-side rendering](https://developer.mozilla.org/en-US/docs/Learn/Server-side)

---

**Lưu ý:** Study guide này được tạo để học tập. Hãy thực hành code và thử nghiệm với các framework thực tế để hiểu sâu hơn!