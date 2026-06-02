# React Date Range Picker Component

## You

Uber/Airbnb: Xây dựng Component chọn ngày và phạm vi ngày (Date Range Picker)Đây là một component UI phức tạp và phổ biến, kiểm tra khả năng xây dựng logic nghiệp vụ, quản lý trạng thái giao diện và khả năng tùy biến cao.
Mô tả:
Tạo một component DateRangePicker cho phép người dùng chọn một ngày bắt đầu và một ngày kết thúc.
Yêu cầu chi tiết (Requirements):
* Giao diện:
   * Component bao gồm một ô input. Khi click vào, một popup lịch sẽ hiện ra.
   * Lịch hiển thị theo tháng, có các nút để chuyển tới/lui các tháng.
   * Hiển thị tên các ngày trong tuần (T2, T3, T4, ...).
* Chức năng chọn ngày:
   * Lần click đầu tiên sẽ chọn ngày bắt đầu (startDate).
   * Lần click thứ hai sẽ chọn ngày kết thúc (endDate).
   * Các ngày nằm giữa startDate và endDate phải được tô sáng để thể hiện phạm vi được chọn.
   * startDate và endDate cũng phải được đánh dấu đặc biệt (ví dụ: hình tròn màu nền đậm).
   * Nếu người dùng chọn một endDate trước startDate, startDate sẽ được reset và ngày vừa chọn sẽ trở thành startDate mới.
   * Sau khi chọn xong startDate và endDate, popup lịch có thể tự động đóng.
   * Giá trị hiển thị trên ô input phải là chuỗi định dạng, ví dụ: "18/08/2025 - 24/08/2025".
* Các trạng thái của ngày:
   * Disabled: Có thể truyền vào một mảng các ngày hoặc một hàm để vô hiệu hóa một số ngày nhất định (ví dụ: các ngày trong quá khứ, các ngày đã được đặt chỗ). Người dùng không thể click vào các ngày này.
   * Hover: Khi người dùng đã chọn startDate và di chuột qua các ngày khác, phạm vi từ startDate đến ngày đang hover phải được tô sáng tạm thời để người dùng xem trước.
* Tính tùy biến (Props):
   * Component phải nhận các props như onDatesChange (callback function được gọi khi phạm vi ngày thay đổi), disabledDates (mảng các ngày bị vô hiệu hóa), initialStartDate, initialEndDate.
Kỳ vọng (Expectations):
* Logic ngày tháng: Xử lý logic ngày tháng một cách chính xác (ví dụ: tính toán số ngày trong một tháng, ngày đầu tiên của tháng là thứ mấy). Khuyến khích sử dụng thư viện như date-fns hoặc dayjs để đơn giản hóa, nhưng ứng viên phải giải thích được logic đằng sau.
* Khả năng tái sử dụng: Component được thiết kế để dễ dàng tái sử dụng ở nhiều nơi trong ứng dụng.
* Quản lý State phức tạp: Quản lý tốt các trạng thái như startDate, endDate, tháng đang hiển thị (currentMonth), trạng thái mở/đóng của popup.
* Accessibility (a11y): Lịch phải có thể điều hướng được bằng bàn phím. Các nút và ngày phải có thuộc tính aria phù hợp.

## Claude


Tôi sẽ tạo một component DateRangePicker hoàn chỉnh theo yêu cầu của bạn. Đây là một component phức tạp với nhiều tính năng và logic quản lý state.


Tôi đã tạo một component **DateRangePicker** hoàn chỉnh với tất cả các tính năng được yêu cầu. Đây là những điểm nổi bật:


## ✨ Các tính năng đã implement:


### 🎯 Giao diện & UX:


- Input field hiển thị range đã chọn với format `dd/mm/yyyy - dd/mm/yyyy`
- Popup calendar với navigation tháng mượt mà
- Hiển thị tên ngày trong tuần (CN, T2, T3...)
- Auto-close sau khi chọn xong cả 2 ngày


### 🎛️ Logic chọn ngày:


- **Click 1:** Chọn startDate (màu xanh đậm)
- **Click 2:** Chọn endDate (màu xanh đậm)
- **Range highlighting:** Các ngày giữa được tô sáng màu xanh nhạt
- **Smart reset:** Nếu chọn endDate < startDate → reset và làm startDate mới
- **Hover preview:** Khi đã có startDate, hover sẽ preview range tạm thời


### 🚫 Disabled dates:


- Support **array** các ngày cụ thể
- Support **function** để disable theo logic (VD: disable cuối tuần)
- Visual feedback rõ ràng cho ngày bị disable


### ♿ Accessibility:


- Keyboard navigation (ESC, Tab, Enter, Space)
- ARIA labels đầy đủ
- Focus management tốt
- Screen reader friendly


### 🔧 Props API linh hoạt:


```javascript
<DateRangePicker
  onDatesChange={(dates) => console.log(dates)}
  disabledDates={[new Date(2025, 7, 19)]} // hoặc function
  initialStartDate={new Date()}
  initialEndDate={new Date()}
  placeholder="Chọn khoảng thời gian"
/>
```


## 🏗️ Kiến trúc code:


### Utility Functions:


- `getDaysInMonth()`, `getFirstDayOfMonth()` - Logic calendar chính xác
- `isSameDay()`, `isDateBetween()` - So sánh ngày
- `formatDate()` - Format hiển thị
- `isDateDisabled()` - Check disabled state


### State Management:


```javascript
- isOpen: trạng thái popup
- startDate/endDate: range được chọn
- currentMonth/currentYear: tháng đang xem
- hoverDate: ngày đang hover để preview
- focusedDay: keyboard navigation
```


### Advanced Features:


- Click outside để đóng popup
- Highlight ngày hôm nay
- Multiple demo examples
- Responsive design với CSS-in-JS


## 🎨 Demo bao gồm:


1. **Basic picker** - chức năng cơ bản
2. **Disabled specific dates** - disable ngày cụ thể
3. **Disabled weekends** - disable cuối tuần
4. **With initial values** - có giá trị mặc định


Component này đã sẵn sàng production với performance tốt, code clean và dễ maintain! 🚀
