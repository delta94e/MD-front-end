# Figma Property Adjuster in React

## You

Figma/Webflow: Xây dựng một thanh điều chỉnh thuộc tính (Property Adjuster) cho phần tửĐây là dạng đề bài mô phỏng lại một tính năng cốt lõi của các công cụ thiết kế trực quan, yêu cầu kiến thức sâu về xử lý sự kiện, quản lý state phức tạp và DOM manipulation.
Mô tả:
Bạn hãy tạo một ứng dụng React cho phép người dùng vẽ một hình chữ nhật lên màn hình và thay đổi các thuộc tính của nó (kích thước, vị trí, màu nền, bo góc) thông qua một thanh công cụ (inspector panel) bên cạnh.
Yêu cầu chi tiết (Requirements):
* Vùng vẽ (Canvas):
   * Phải có một khu vực chính để hiển thị hình chữ nhật.
   * Người dùng có thể click và kéo chuột trên vùng này để xác định vị trí và kích thước ban đầu của hình chữ nhật.
* Hình chữ nhật (Rectangle Component):
   * Có thể được chọn (selected) bằng cách click vào nó. Khi được chọn, nó sẽ có một đường viền đặc biệt (ví dụ: màu xanh, nét đứt).
   * Có thể thay đổi kích thước bằng cách kéo các điểm neo (resize handles) ở các góc và các cạnh.
   * Có thể di chuyển bằng cách kéo thả (drag and drop) chính hình chữ nhật đó.
* Thanh công cụ (Inspector Panel):
   * Khi hình chữ nhật được chọn, thanh công cụ sẽ hiển thị các input để chỉnh sửa các thuộc tính sau:
      * Position: X, Y (ô nhập số).
      * Size: Width, Height (ô nhập số).
      * Background Color: Mã màu hex (ví dụ: #FFFFFF). Có thể là một ô input[type=color].
      * Border Radius: Bo góc (ô nhập số hoặc thanh trượt).
   * Mọi thay đổi trên thanh công cụ phải được phản ánh ngay lập tức lên hình chữ nhật trên vùng vẽ.
   * Ngược lại, khi người dùng thay đổi kích thước hoặc vị trí của hình chữ nhật bằng cách kéo thả, các giá trị trong thanh công cụ cũng phải được cập nhật theo thời gian thực.
Kỳ vọng (Expectations):
* Quản lý State: Sử dụng state của React (useState, useReducer) một cách hiệu quả để quản lý trạng thái của hình chữ nhật.
* Hiệu năng: Tương tác kéo thả và thay đổi kích thước phải mượt mà, không gây ra re-render không cần thiết. Cân nhắc sử dụng useCallback, useMemo hoặc các kỹ thuật tối ưu hóa khác.
* Kiến trúc Component: Cấu trúc code phải rõ ràng, chia thành các component tái sử dụng được (ví dụ: Canvas, Rectangle, InspectorPanel, NumericInput).
* Xử lý sự kiện: Xử lý chính xác các sự kiện chuột như onMouseDown, onMouseMove, onMouseUp để tính toán tọa độ và kích thước.

## You

Figma/Webflow: Xây dựng một thanh điều chỉnh thuộc tính (Property Adjuster) cho phần tửĐây là dạng đề bài mô phỏng lại một tính năng cốt lõi của các công cụ thiết kế trực quan, yêu cầu kiến thức sâu về xử lý sự kiện, quản lý state phức tạp và DOM manipulation.
Mô tả:
Bạn hãy tạo một ứng dụng React cho phép người dùng vẽ một hình chữ nhật lên màn hình và thay đổi các thuộc tính của nó (kích thước, vị trí, màu nền, bo góc) thông qua một thanh công cụ (inspector panel) bên cạnh.
Yêu cầu chi tiết (Requirements):
* Vùng vẽ (Canvas):
   * Phải có một khu vực chính để hiển thị hình chữ nhật.
   * Người dùng có thể click và kéo chuột trên vùng này để xác định vị trí và kích thước ban đầu của hình chữ nhật.
* Hình chữ nhật (Rectangle Component):
   * Có thể được chọn (selected) bằng cách click vào nó. Khi được chọn, nó sẽ có một đường viền đặc biệt (ví dụ: màu xanh, nét đứt).
   * Có thể thay đổi kích thước bằng cách kéo các điểm neo (resize handles) ở các góc và các cạnh.
   * Có thể di chuyển bằng cách kéo thả (drag and drop) chính hình chữ nhật đó.
* Thanh công cụ (Inspector Panel):
   * Khi hình chữ nhật được chọn, thanh công cụ sẽ hiển thị các input để chỉnh sửa các thuộc tính sau:
      * Position: X, Y (ô nhập số).
      * Size: Width, Height (ô nhập số).
      * Background Color: Mã màu hex (ví dụ: #FFFFFF). Có thể là một ô input[type=color].
      * Border Radius: Bo góc (ô nhập số hoặc thanh trượt).
   * Mọi thay đổi trên thanh công cụ phải được phản ánh ngay lập tức lên hình chữ nhật trên vùng vẽ.
   * Ngược lại, khi người dùng thay đổi kích thước hoặc vị trí của hình chữ nhật bằng cách kéo thả, các giá trị trong thanh công cụ cũng phải được cập nhật theo thời gian thực.
Kỳ vọng (Expectations):
* Quản lý State: Sử dụng state của React (useState, useReducer) một cách hiệu quả để quản lý trạng thái của hình chữ nhật.
* Hiệu năng: Tương tác kéo thả và thay đổi kích thước phải mượt mà, không gây ra re-render không cần thiết. Cân nhắc sử dụng useCallback, useMemo hoặc các kỹ thuật tối ưu hóa khác.
* Kiến trúc Component: Cấu trúc code phải rõ ràng, chia thành các component tái sử dụng được (ví dụ: Canvas, Rectangle, InspectorPanel, NumericInput).
* Xử lý sự kiện: Xử lý chính xác các sự kiện chuột như onMouseDown, onMouseMove, onMouseUp để tính toán tọa độ và kích thước.

## Claude


Tôi sẽ tạo một ứng dụng React mô phỏng tính năng Property Adjuster của Figma/Webflow với đầy đủ các yêu cầu bạn đã nêu.


Tôi đã tạo một ứng dụng React hoàn chỉnh mô phỏng tính năng Property Adjuster của Figma/Webflow. Đây là những điểm nổi bật của ứng dụng:


## ✨ Tính năng chính


**🎨 Vùng vẽ (Canvas)**


- Click và kéo để vẽ hình chữ nhật mới
- Khu vực làm việc 800x600px với nền xám nhạt


**📦 Hình chữ nhật tương tác**


- **Chọn**: Click để chọn, có đường viền xanh nét đứt
- **Di chuyển**: Kéo thả toàn bộ hình chữ nhật
- **Resize**: 8 điểm neo (4 góc + 4 cạnh) để thay đổi kích thước
- **Visual feedback**: Con trô chuột thay đổi theo chế độ


**⚙️ Inspector Panel**


- **Position**: X, Y coordinates
- **Size**: Width, Height (tối thiểu 20px)
- **Background Color**: Color picker + hex input
- **Border Radius**: Bo góc (0 đến 50% kích thước nhỏ nhất)


## 🚀 Tối ưu hóa hiệu năng


- **React.memo**: Ngăn re-render không cần thiết
- **useCallback & useMemo**: Tối ưu các hàm và calculations
- **Event optimization**: Xử lý mouse events hiệu quả
- **State management**: Update state chính xác, không dư thừa


## 🏗️ Kiến trúc component


```
App
├── Canvas (vùng vẽ)
│   └── Rectangle (hình chữ nhật có resize handles)
│       └── ResizeHandle (8 điểm neo)
└── InspectorPanel (thanh công cụ)
    ├── NumericInput (input số)
    └── ColorInput (chọn màu)
```


## 💡 Cách sử dụng


1. **Vẽ hình mới**: Click "New Rectangle" hoặc kéo chuột trên canvas
2. **Chỉnh sửa**: Click chọn hình, dùng Inspector Panel hoặc kéo trực tiếp
3. **Di chuyển**: Kéo thả hình chữ nhật
4. **Resize**: Kéo các điểm neo xanh
5. **Bỏ chọn**: Click vào vùng trống


Ứng dụng có đồng bộ 2 chiều hoàn toàn - mọi thay đổi trên UI đều được phản ánh ngay lập tức, đúng như yêu cầu của Figma/Webflow!


## Claude


Tôi sẽ tạo một phiên bản cải tiến của ứng dụng Property Adjuster với kiến trúc tốt hơn, sử dụng useReducer và hỗ trợ nhiều hình chữ nhật.


Tôi đã tạo một phiên bản cải tiến hoàn toàn của ứng dụng Property Adjuster với kiến trúc và tính năng nâng cao hơn. Đây là những điểm nổi bật:


## 🚀 Cải tiến về Kiến trúc


**📦 State Management với useReducer**


- Sử dụng `useReducer` thay vì `useState` để quản lý state phức tạp
- Actions được định nghĩa rõ ràng với `ACTIONS` constants
- State flow dễ debug và maintain hơn


**🎯 Component Architecture**


```
App
├── Toolbar (thanh công cụ chính)
├── Canvas (vùng vẽ với grid background)
│   └── Rectangle[] (nhiều hình chữ nhật)
│       └── ResizeHandle[] (8 điểm neo mỗi hình)
└── InspectorPanel (panel thuộc tính nâng cao)
    ├── NumericInput (input số với unit)
    ├── ColorInput (color picker + hex)
    └── SliderInput (thanh trượt mới)
```


## ✨ Tính năng mới


**🔄 Multi-Rectangle Support**


- Tạo và quản lý nhiều hình chữ nhật
- Selection system với visual feedback
- Independent property editing


**⌨️ Keyboard Shortcuts**


- `Ctrl+N`: Tạo hình chữ nhật mới
- `Ctrl+D`: Duplicate hình đã chọn
- `Delete`: Xóa hình đã chọn


**🎨 Advanced Properties**


- **Transform**: Rotation với slider (-180° to 180°)
- **Smart Constraints**: Auto-limit theo canvas bounds
- **Info Display**: Area, aspect ratio calculations
- **Visual Enhancements**: Grid background, shadows, transitions


**🔧 Enhanced UX**


- **Drawing Preview**: Dashed outline khi vẽ
- **Smart Bounds**: Giới hạn trong canvas
- **Context Actions**: Duplicate, delete buttons
- **Visual Feedback**: Improved selection states
- **Help System**: Floating keyboard shortcuts


## ⚡ Tối ưu hiệu năng


**🎯 React Optimizations**


- `React.memo` cho tất cả components
- `useCallback` cho event handlers
- `useMemo` cho expensive calculations
- Efficient re-render prevention


**🖱️ Smooth Interactions**


- Optimized mouse event handling
- Smooth transitions (when not dragging)
- Proper cursor states
- No layout thrashing


## 🎨 UI/UX Improvements


**📐 Professional Canvas**


- Grid background (20px intervals)
- Proper shadows và borders
- Visual constraints feedback
- Better selection indicators


**📋 Enhanced Inspector**


- Grouped property sections
- Unit indicators (px, °)
- Smart min/max constraints
- Better visual hierarchy
- Action buttons (duplicate, delete)


**🎯 Better Feedback**


- Real-time property updates
- Visual constraints
- Status information
- Loading states


Ứng dụng này giờ đây có cảm giác rất professional và gần gũi với các công cụ thiết kế thực tế như Figma, với khả năng mở rộng dễ dàng để thêm các loại shapes khác!
