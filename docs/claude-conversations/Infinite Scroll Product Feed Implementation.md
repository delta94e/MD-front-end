# Infinite Scroll Product Feed Implementation

## You

TikTok/Shopee: Xây dựng Feed sản phẩm/video với "Infinite Scroll" và tối ưu hóa hiệu năngĐề bài này mô phỏng tính năng cốt lõi của các ứng dụng mạng xã hội và thương mại điện tử, tập trung vào khả năng làm việc với API, quản lý dữ liệu lớn và tối ưu hóa trải nghiệm người dùng.
Mô tả:
Xây dựng một trang danh sách sản phẩm (hoặc video) có thể cuộn vô tận. Dữ liệu sẽ được lấy từ một API giả lập.
Yêu cầu chi tiết (Requirements):
* API giả lập:
   * Cung cấp một hàm fetchItems({ page, limit }) trả về một Promise.
   * Promise này sẽ resolve sau một khoảng thời gian ngẫu nhiên (ví dụ: 300ms - 1000ms) để mô phỏng độ trễ mạng.
   * Kết quả trả về là một object có dạng: { items: [...], hasMore: boolean }.
* Giao diện:
   * Hiển thị danh sách các sản phẩm/video dưới dạng lưới (grid) hoặc danh sách (list).
   * Mỗi item hiển thị các thông tin cơ bản như hình ảnh, tên, giá (cho Shopee) hoặc tên kênh, caption (cho TikTok).
* Tính năng Infinite Scroll:
   * Khi người dùng cuộn gần đến cuối trang, ứng dụng phải tự động gọi API để tải thêm dữ liệu cho trang tiếp theo.
   * Trong khi đang tải dữ liệu mới, phải hiển thị một chỉ báo tải (loading indicator) ở cuối danh sách.
   * Khi không còn dữ liệu để tải (hasMore: false), không thực hiện thêm yêu cầu API nào nữa và ẩn loading indicator.
* Xử lý lỗi và trạng thái:
   * Xử lý trường hợp API gọi thất bại và hiển thị một thông báo lỗi cùng nút "Thử lại" (Retry).
   * Hiển thị trạng thái rỗng (empty state) nếu lần gọi API đầu tiên không trả về sản phẩm nào.
Kỳ vọng (Expectations):
* Quản lý State và Side Effects: Sử dụng useState và useEffect một cách hợp lý để quản lý danh sách item, trạng thái loading, lỗi và số trang hiện tại.
* Tối ưu hóa hiệu năng (Performance Optimization):
   * Sử dụng Intersection Observer API để phát hiện khi người dùng cuộn đến cuối trang. Đây là cách tiếp cận hiện đại và hiệu quả hơn so với việc lắng nghe sự kiện scroll.
   * Thử thách nâng cao: Áp dụng kỹ thuật "virtualization" (hoặc "windowing") để chỉ render các item đang hiển thị trong viewport, giúp duy trì hiệu năng mượt mà ngay cả khi danh sách có hàng ngàn item. Có thể sử dụng thư viện như react-window hoặc tự triển khai.
* Debouncing/Throttling: Tránh việc gọi API liên tục khi người dùng cuộn nhanh.
* Trải nghiệm người dùng: Đảm bảo trải nghiệm cuộn mượt mà, không bị giật lag khi dữ liệu mới được thêm vào.

## Claude


Tôi sẽ tạo một ứng dụng feed sản phẩm với infinite scroll hoàn chỉnh theo yêu cầu của bạn. Đây sẽ là một implementation chuyên nghiệp mô phỏng Shopee với tất cả các tính năng được yêu cầu.


Tôi đã xây dựng một ứng dụng feed sản phẩm hoàn chỉnh theo phong cách Shopee với tất cả các tính năng được yêu cầu. Đây là những điểm nổi bật:


## 🎯 Các tính năng đã implement:


### API & Data Management


- ✅ API giả lập với delay ngẫu nhiên (300-1000ms)
- ✅ Trả về `{ items, hasMore }` như yêu cầu
- ✅ Mô phỏng lỗi mạng ngẫu nhiên (5% chance)
- ✅ Dữ liệu sản phẩm phong phú (tên, giá, rating, đã bán, location, tags)


### Infinite Scroll tối ưu


- ✅ **Intersection Observer API** (hiện đại, hiệu quả hơn scroll events)
- ✅ **Debouncing** 300ms để tránh spam API calls
- ✅ Auto-load khi scroll gần cuối trang (100px threshold)
- ✅ Loading indicator và skeleton UI chuyên nghiệp


### Error Handling & UX


- ✅ Xử lý lỗi với thông báo rõ ràng và nút "Thử lại"
- ✅ Empty state khi không có dữ liệu
- ✅ Initial loading state với skeleton cards
- ✅ Prevent duplicate API calls


### Performance Optimization


- ✅ **Lazy loading images** với placeholder
- ✅ **Debounced scroll detection**
- ✅ Efficient re-renders với useCallback
- ✅ Clean up Intersection Observer


### UI/UX như Shopee


- ✅ **Responsive grid** (2-6 columns tùy màn hình)
- ✅ **Smooth animations** và hover effects
- ✅ Product cards với đầy đủ thông tin (giá, discount, rating, tags)
- ✅ Professional loading states
- ✅ Vietnamese currency formatting


## 🚀 Kỹ thuật nâng cao được sử dụng:


1. **Custom Hook useDebounce** - Tối ưu performance
2. **Intersection Observer** - Detect scroll hiệu quả
3. **Image lazy loading** - Tải ảnh khi cần thiết
4. **Error boundaries** - Xử lý lỗi graceful
5. **Responsive design** - Tự động adapt layout
6. **Animation system** - Smooth transitions


## 💡 Điểm đặc biệt:


- **No virtualization** trong demo này vì phức tạp cho artifact, nhưng structure cho phép dễ dàng integrate react-window
- **Real-world ready** - Code có thể dùng trong production với API thật
- **Mobile-first** - Responsive từ 2 columns (mobile) đến 6 columns (desktop)
- **Vietnamese localization** - Currency, địa danh, UI text


Ứng dụng này demo đầy đủ các kỹ thuật hiện đại cho infinite scroll feed, tương tự như các app thương mại điện tử hàng đầu!
