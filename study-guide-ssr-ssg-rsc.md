# Study Guide: SSR, SSG, và RSC

## Mục lục
1. [SSR - Server-Side Rendering](#ssr---server-side-rendering)
2. [SSG - Static Site Generation](#ssg---static-site-generation)
3. [RSC - React Server Components](#rsc---react-server-components)
4. [So sánh tổng quan](#so-sánh-tổng-quan)

---

## SSR - Server-Side Rendering

### Nguyên lý hoạt động

Khi người dùng yêu cầu một trang web, server sẽ thực thi JavaScript theo thời gian thực, tạo ra HTML hoàn chỉnh và trả về cho trình duyệt.

**Quy trình:**
1. User gửi request đến server
2. Server chạy JavaScript và render HTML
3. Browser nhận HTML đã render sẵn và hiển thị ngay
4. Browser tải JavaScript và thực hiện **hydration** để trang web trở nên tương tác

### Ưu điểm

✅ **Tốc độ tải trang ban đầu nhanh**
- Người dùng thấy nội dung ngay lập tức mà không cần đợi JS thực thi
- Cải thiện trải nghiệm người dùng đáng kể

✅ **Thân thiện với SEO**
- Công cụ tìm kiếm có thể crawl và index nội dung HTML hoàn chỉnh
- Tăng khả năng xuất hiện trên kết quả tìm kiếm

✅ **Tương thích với thiết bị yếu**
- Không phụ thuộc hoàn toàn vào khả năng xử lý JavaScript của client
- Phù hợp với thiết bị có hiệu năng thấp

### Nhược điểm

❌ **Tải server cao**
- Mỗi request đều cần render real-time
- Server có thể chậm lại khi có nhiều request đồng thời (high concurrency)

❌ **TTFB (Time to First Byte) chậm**
- Người dùng phải đợi server tạo HTML
- Thời gian phản hồi phụ thuộc vào độ phức tạp của trang

❌ **Độ trễ tương tác**
- Trang web chỉ có thể tương tác sau khi hydration hoàn tất
- Có thể gây hiện tượng "trang đã hiển thị nhưng chưa click được"

### Kịch bản áp dụng

- Website nội dung cần SEO (tin tức, blog, báo điện tử)
- Ứng dụng yêu cầu tốc độ tải trang đầu tiên cao
- Trang web có nội dung động thay đổi theo từng user

---

## SSG - Static Site Generation

### Nguyên lý hoạt động

Tất cả các trang HTML tĩnh được tạo sẵn trong **giai đoạn build** và sau đó được host trực tiếp trên CDN.

**Quy trình:**
1. Trong quá trình build, tất cả trang được render thành HTML tĩnh
2. Các file HTML được deploy lên CDN
3. Khi user truy cập, CDN trả về HTML đã render sẵn
4. Không cần tính toán từ server

### Ưu điểm

✅ **Hiệu năng cực cao**
- CDN trả về HTML trực tiếp, tốc độ cực nhanh
- Thời gian phản hồi gần như tức thì

✅ **Không tải server**
- Không cần render runtime, tiết kiệm tài nguyên máy chủ
- Chi phí vận hành thấp

✅ **Bảo mật cao**
- Không có logic server động, giảm bề mặt tấn công
- Ít lỗ hổng bảo mật hơn

### Nhược điểm

❌ **Không phù hợp với nội dung động**
- Cập nhật dữ liệu cần rebuild toàn bộ site
- Không thể cá nhân hóa nội dung theo user

❌ **Chi phí mở rộng cao**
- Khi có nhiều trang, thời gian build rất lâu
- Khó quản lý với website lớn (hàng nghìn trang)

❌ **Không có cá nhân hóa**
- Tất cả user thấy cùng một nội dung
- Cần kết hợp JavaScript phía client để cá nhân hóa

### Kịch bản áp dụng

- Website có nội dung ít thay đổi (tài liệu, landing page, portfolio)
- Trang marketing cần hiệu năng cực cao
- Blog cá nhân, website giới thiệu công ty
- Documentation sites

---

## RSC - React Server Components

### Nguyên lý hoạt động

Phân biệt component nào render ở server-side và component nào render ở client-side **dựa trên từng component**.

**Quy trình:**
1. Server component truy cập trực tiếp database/API
2. Server trả về dữ liệu dạng JSON (không phải HTML)
3. Client nhận JSON và render các component
4. Client component xử lý tương tác người dùng

### Ưu điểm

✅ **Giảm kích thước JavaScript phía client**
- Logic phức tạp giữ lại ở server
- Bundle size nhỏ hơn, tải trang nhanh hơn

✅ **Code splitting tự động**
- Tải component theo nhu cầu (on-demand)
- Tối ưu hiệu năng tải trang

✅ **Truy cập backend trực tiếp**
- Server component có thể gọi DB/API trực tiếp
- Không cần tạo API endpoint riêng
- Giảm số lượng request

### Nhược điểm

❌ **Độ phức tạp cao**
- Cần xử lý vấn đề giao tiếp giữa server và client component
- Đường cong học tập dốc

❌ **Yêu cầu tương thích**
- Phải dùng React 18+ 
- Cần framework hỗ trợ (Next.js 13+, hoặc tương tự)

❌ **Khó debug**
- Debug xuyên suốt môi trường server-client khá phức tạp
- Cần công cụ và kinh nghiệm đặc biệt

### Kịch bản áp dụng

- Ứng dụng phức tạp cần tối ưu package size và tốc độ tải
- Dashboard, admin panel cần lấy dữ liệu từ server
- Ứng dụng có nhiều dữ liệu động từ database
- Website cần cân bằng giữa SEO và tương tác phức tạp

---

## So sánh tổng quan

| Tiêu chí | SSR | SSG | RSC |
|----------|-----|-----|-----|
| **Thời điểm render** | Runtime (mỗi request) | Build time | Hybrid (server + client) |
| **Tốc độ tải trang** | Nhanh | Cực nhanh | Nhanh |
| **SEO** | Tốt | Tốt | Tốt |
| **Nội dung động** | Hỗ trợ tốt | Không hỗ trợ | Hỗ trợ tốt |
| **Tải server** | Cao | Không có | Trung bình |
| **Bundle size** | Lớn | Lớn | Nhỏ |
| **Độ phức tạp** | Trung bình | Thấp | Cao |
| **Cá nhân hóa** | Có | Không | Có |

### Khi nào dùng gì?

**Chọn SSR khi:**
- Cần SEO tốt
- Nội dung thay đổi theo user
- Có server mạnh

**Chọn SSG khi:**
- Nội dung tĩnh, ít thay đổi
- Cần hiệu năng tối đa
- Ngân sách server hạn chế

**Chọn RSC khi:**
- Dự án React phức tạp
- Cần tối ưu bundle size
- Có nhiều data fetching từ server
- Sẵn sàng đầu tư thời gian học

---

## Ghi chú thêm

### Hydration là gì?

Hydration là quá trình JavaScript "kích hoạt" HTML tĩnh đã được render sẵn, biến nó thành ứng dụng React tương tác đầy đủ.

### Xu hướng hiện tại

Nhiều framework hiện đại (Next.js, Remix, Astro) cho phép **kết hợp cả 3 phương pháp** trong cùng một ứng dụng:
- Dùng SSG cho trang landing
- Dùng SSR cho trang chi tiết sản phẩm
- Dùng RSC cho dashboard

### Framework phổ biến

- **Next.js**: Hỗ trợ đầy đủ SSR, SSG, và RSC
- **Remix**: Tập trung vào SSR
- **Astro**: Tối ưu cho SSG với "Islands Architecture"
- **Gatsby**: Chuyên về SSG

---

**Nguồn tham khảo:** Tổng hợp từ tài liệu React, Next.js và các bài viết kỹ thuật
