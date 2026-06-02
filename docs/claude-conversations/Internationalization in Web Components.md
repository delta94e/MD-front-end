# Internationalization in Web Components

## You

Coursera/Udemy: Xây dựng Component hỗ trợ đa ngôn ngữ (Internationalization) và bố cục RTLCác công ty có người dùng toàn cầu phải đảm bảo sản phẩm của họ hoạt động tốt ở mọi ngôn ngữ và khu vực. Đề bài này kiểm tra khả năng xây dựng giao diện linh hoạt, có thể thích ứng với các ngôn ngữ và định dạng văn hóa khác nhau.
Mô tả:
Hãy xây dựng một component "Thẻ khóa học" (CourseCard) hiển thị các thông tin cơ bản. Component này phải có khả năng chuyển đổi linh hoạt giữa tiếng Anh (LTR - Left-to-Right) và tiếng Ả Rập (RTL - Right-to-Left).
Yêu cầu chi tiết (Requirements):
* Component CourseCard:
   * Hiển thị các thông tin: ảnh bìa, tiêu đề khóa học, tên tác giả, đánh giá (ví dụ: 4.5 ★★★★★), và giá tiền.
* Quốc tế hóa (Internationalization - i18n):
   * Tất cả các chuỗi văn bản tĩnh (ví dụ: "by", "Rating") phải được lấy từ các file JSON ngôn ngữ riêng biệt (ví dụ: en.json, ar.json).
   * Phải có một nút chuyển đổi ngôn ngữ ở đâu đó trong ứng dụng. Khi nhấn nút này, toàn bộ nội dung của CourseCard phải thay đổi sang ngôn ngữ tương ứng mà không cần tải lại trang.
* Bố cục Phải-qua-Trái (Right-to-Left - RTL):
   * Khi chuyển sang tiếng Ả Rập, toàn bộ bố cục của thẻ phải đảo ngược:
      * Văn bản phải được căn lề phải.
      * Hình ảnh thường ở bên trái sẽ chuyển sang bên phải.
      * Các phần tử như hàng sao đánh giá (stars) phải hiển thị bên trái tên tác giả thay vì bên phải.
* Bản địa hóa (Localization - l10n):
   * Giá tiền phải được định dạng theo đúng chuẩn của từng ngôn ngữ/khu vực. Ví dụ:
      * Tiếng Anh: $19.99
      * Có thể giả lập một ngôn ngữ châu Âu để hiển thị: 19,99 €
   * Sử dụng Intl API của JavaScript để định dạng số và tiền tệ một cách chính xác.
Kỳ vọng (Expectations):
* Kiến thức về i18n Frameworks: Có kinh nghiệm sử dụng các thư viện như react-i18next hoặc Format.js (React Intl) để quản lý bản dịch và tích hợp vào React.
* CSS cho RTL: Hiểu và sử dụng các thuộc tính logic của CSS (CSS Logical Properties) như margin-inline-start thay cho margin-left, text-align: start thay cho text-align: left. Đây là cách tiếp cận hiện đại và đúng đắn nhất để xử lý RTL.
* Intl API: Nắm vững cách sử dụng các đối tượng Intl.NumberFormat để xử lý các định dạng số và tiền tệ phức tạp mà không cần hard-code.
* Tư duy toàn cầu:

## Claude


Tôi sẽ xây dựng một component CourseCard hoàn chỉnh với hỗ trợ đa ngôn ngữ và bố cục RTL. Đây là một ứng dụng thực tế cho các trang web giáo dục toàn cầu.


Tôi đã xây dựng một component CourseCard hoàn chỉnh với đầy đủ các tính năng internationalization và RTL support. Đây là những điểm nổi bật:


## 🌍 Tính năng Internationalization (i18n)


1. **Translation System**: Sử dụng Context API để quản lý translations từ object JSON
2. **Language Toggle**: Nút chuyển đổi ngôn ngữ với icon Globe từ Lucide React
3. **Dynamic Content**: Tất cả text được translate realtime khi chuyển ngôn ngữ


## 🔄 Hỗ trợ RTL (Right-to-Left)


1. **CSS Logical Properties**: Sử dụng `inset-inline-start/end` thay vì `left/right`
2. **Text Alignment**: `text-align: start` tự động adapt theo direction
3. **Component Layout**: Star rating reverse direction cho RTL
4. **Badge Position**: Bestseller badge tự động chuyển position


## 💱 Localization (l10n) với Intl API


```javascript
const formatCurrency = (amount) => {
  return new Intl.NumberFormat(locales[language], {
    style: 'currency',
    currency: currencies[language],
    minimumFractionDigits: 2
  }).format(amount);
};
```


- **Tiếng Anh**: $19.99 (USD)
- **Tiếng Ả Rập**: ر.س ١٩٫٩٩ (Saudi Riyal với số Ả Rập)


## 🎨 CSS Logical Properties Modern


- `margin-block-end` thay vì `margin-bottom`
- `inset-block-start` thay vì `top`
- `inset-inline-start` thay vì `left`
- Direction-agnostic flexbox với `justify-content: start`


## ♿ Accessibility Features


- Proper `dir` attribute trên elements
- Focus states cho keyboard navigation
- ARIA labels cho buttons
- Semantic HTML structure


## 📱 Responsive Design


- Mobile-first approach
- CSS Grid với auto-fit
- Flexible layouts cho cả LTR và RTL


Component này demonstrate best practices cho global applications, đặc biệt quan trọng cho các platform giáo dục như Coursera/Udemy phục vụ người dùng từ nhiều nền văn hóa khác nhau!
