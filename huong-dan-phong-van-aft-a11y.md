# 🇻🇳 Hướng Dẫn Phỏng Vấn & Demo Chi Tiết — Amazon AFT & Accessibility
## Tài liệu chuẩn bị nói (Speaking Script) và kịch bản demo trực quan từng mục dành cho Ứng viên

Tài liệu này dịch nghĩa và chi tiết hóa 5 thành tựu lớn của bạn trong dự án **Amazon Fulfillment Technologies (AFT) & Accessibility**, giúp bạn chuẩn bị nội dung nói trôi chảy, chuyên nghiệp bằng tiếng Việt nhưng vẫn giữ các thuật ngữ tiếng Anh chuyên ngành (buzzwords) để ghi điểm tuyệt đối với nhà tuyển dụng.

---

## 🧭 Bảng Tổng Hợp Thuật Ngữ Kỹ Thuật (Buzzwords) Nên Dùng

| Thuật ngữ gốc | Giải thích & Cách dùng |
|---|---|
| **Web Components / Custom Elements** | Công nghệ xây dựng các thẻ HTML tùy biến hoạt động độc lập với framework. |
| **Shadow DOM Encapsulation** | Cơ chế đóng gói DOM và style, giúp cô lập mã CSS không bị ghi đè chéo. |
| **Framework-Agnostic** | Khả năng chạy trên mọi môi trường công nghệ (React, Angular, Vanilla JS). |
| **Cypress & Jest Axe-core** | Các công cụ quét lỗi vi phạm tiêu chuẩn tiếp cận (accessibility) tự động trong CI. |
| **SpeechSynthesis (Web Speech API)** | Web API dùng để chuyển văn bản thành giọng nói (Text-to-Speech) ngay trên trình duyệt. |
| **Tactile Workstation Design** | Thiết kế không gian làm việc vật lý có hỗ trợ nhãn nổi chữ nổi Braille cho người mù. |
| **Inclusive Design / Day-1 A11y** | Tư duy xây dựng tính năng tiếp cận ngay từ đầu, thay vì sửa lỗi chắp vá sau này. |

---

## 🔌 Mục 1 & 2 — Tech-Agnostic Design System với Web Components
> **Mục tiêu:** Xây dựng hệ thống thiết kế (Design System) nhất quán cho AFT bằng Web Components để chạy mượt trên cả React và các hệ thống di sản (legacy) HTML/CSS/JS.

### 1. Bối cảnh & Thách thức
Hệ thống quản lý kho vận (Fulfillment Centers - FC) của Amazon hoạt động 24/7 và chứa hàng trăm ứng dụng được phát triển qua nhiều thời kỳ khác nhau.
*   **Vấn đề:** Không thể viết lại tất cả các ứng dụng di sản bằng React vì rủi ro gián đoạn chuỗi cung ứng là rất lớn.
*   **Thách thức:** Việc duy trì các thư viện CSS riêng lẻ cho từng framework gây ra sự bất nhất về giao diện (UI inconsistency) và tăng chi phí bảo trì.

### 2. Giải pháp kỹ thuật bạn đã xây dựng
*   Lựa chọn công nghệ **Web Components (Custom Elements & Shadow DOM)** làm nền tảng cốt lõi (sử dụng Stencil.js).
*   Shadow DOM giúp đóng gói mã CSS hoàn toàn, cô lập không cho giao diện chính ghi đè vào component.
*   Xây dựng lớp bọc tự động (React wrapper) để các team dùng React có trải nghiệm code liền mạch (Typesafe props), trong khi các dự án di sản chỉ cần dùng thẻ script HTML để tải.
*   Tích hợp sẵn các thuộc tính accessibility (ARIA, focus target) trực tiếp vào code của component ngay từ ngày đầu (**Day-1 Accessibility**).

### 3. Kết quả (Metrics)
*   **100+ teams** trên toàn Amazon Operations đã tải và áp dụng.
*   Tránh được việc viết lại các ứng dụng di sản, giảm thiểu tối đa rủi ro gián đoạn vận hành kho.

### 4. Kịch bản nói (What to say)
> *"Tại bộ phận AFT Experience Design, tôi đã chủ trì thiết kế hệ thống thiết kế (Design System) nội bộ chạy trên toàn bộ mạng lưới kho vận của Amazon. Do đặc thù kho vận vận hành liên tục, hệ thống chứa rất nhiều ứng dụng di sản viết bằng HTML/JS thuần và cả các app React mới. 
> 
> Thay vì chọn giải pháp React-only buộc các team cũ phải rewrite từ đầu, tôi chọn **Web Components** làm nền tảng cốt lõi. Nhờ vào cơ chế đóng gói **Shadow DOM**, các thành phần giao diện chạy cực kỳ ổn định, không bị ảnh hưởng bởi CSS bên ngoài. Tất cả các components này được nhúng sẵn thuộc tính tiếp cận (Accessibility) từ đầu, đảm bảo tính đồng nhất giao diện và độ tin cậy vận hành rất cao."*

### 5. Cách trình diễn Demo trực quan
1.  Bấm vào tab **🔌 Web Components System**.
2.  Click nút chuyển đổi giữa **React Component Wrapper** và **Vanilla JS Custom Element** để biểu diễn khả năng tích hợp linh hoạt trên mọi công nghệ.
3.  Trỏ vào phần **Badge Status** hiển thị trên màn hình: Giải thích rằng đây là Shadow DOM cô lập hoàn toàn, không thể bị phá vỡ cấu trúc CSS bởi mã nguồn bên ngoài.

---

## 🔊 Mục 3 — Audio-Assisted Packing Process cho Người Khiếm Thị
> **Mục tiêu:** Thiết kế quy trình đóng gói hàng hóa không cần màn hình hiển thị, dùng âm thanh hướng dẫn để hỗ trợ người khiếm thị làm việc.

### 1. Bối cảnh & Thách thức
Đóng gói (Packing) là khâu cốt lõi trong kho của Amazon. Người đóng gói phải lấy hàng, quét mã, chọn hộp phù hợp, dán băng keo và in nhãn.
*   **Vấn đề:** Ứng dụng đóng gói cũ hiển thị hoàn toàn trên màn hình (vạch đỏ lỗi, tên hộp cần dùng). Người mù hoặc giảm thị lực không thể thực hiện công việc này.

### 2. Giải pháp kỹ thuật bạn đã xây dựng
*   Thiết kế một giao diện đóng gói không màn hình, chuyển đổi toàn bộ trạng thái hình ảnh thành luồng âm thanh thời gian thực.
*   Sử dụng **Web Speech API (SpeechSynthesis)** để đọc chỉ dẫn trực tiếp qua tai nghe của nhân viên khi họ thực hiện quét barcode.
*   Thiết kế hệ thống tín hiệu âm thanh (Audio Cue): Sử dụng các tần số âm thanh khác nhau (tiếng ping nhẹ cho thành công, tiếng còi hú nhỏ cho lỗi quét sai) giúp người dùng nhận diện kết quả tức thì mà không bị mệt mỏi do nghe đọc quá nhiều chữ.

### 3. Kết quả (Metrics)
*   Dự án được hoàn thành năm 2021 và **triển khai thành công trên quy mô toàn cầu**.
*   Mở ra cơ hội nghề nghiệp bình đẳng cho hàng ngàn người khiếm thị trên toàn thế giới tại các kho của Amazon.

### 4. Kịch bản nói (What to say)
> *"Vào năm 2021, tôi đã thiết kế và triển khai quy trình đóng gói hàng hóa bằng âm thanh dành riêng cho các nhân viên khiếm thị. Trước đây, quy trình này phụ thuộc 100% vào màn hình trực quan. 
> 
> Tôi đã chuyển dịch toàn bộ giao diện này sang mô hình phản hồi âm thanh bất đồng bộ thông qua tai nghe, tận dụng công nghệ **Text-to-Speech** và hệ thống **Audio Cues** (tần số âm thanh phân cấp). Khi nhân viên quét hàng hóa, hệ thống sẽ đọc chính xác loại hộp cần lấy và xác thực hành vi của họ. Dự án này hiện đã được scale toàn cầu, mang lại cơ hội việc làm thực tế cho hàng ngàn người khuyết tật."*

### 5. Cách trình diễn Demo trực quan
1.  Bấm vào tab **🔊 Blind Packer Workstation**.
2.  Đảm bảo đã bật nút **🔊 AUDIO ON** (bật âm thanh máy tính của bạn lên).
3.  Click nút **Start Auditory Packing Process**. Bạn sẽ nghe thấy tiếng máy tính đọc: *"Scan item: Premium Noise Cancelling Headphones"*.
4.  Lần lượt làm theo các bước giả lập: Click quét barcode sản phẩm -> Chọn hộp phù hợp -> Quét mã xác nhận hộp -> In nhãn. Giao diện sẽ tự động phát âm thanh hướng dẫn từng bước bằng tiếng Anh vô cùng trực quan.

---

## ♿ Mục 4 & 5 — Accessibility Leadership & Governance
> **Mục tiêu:** Dẫn dắt các chiến dịch nâng cao nhận thức về A11y, tổ chức kiểm duyệt thiết kế/mã nguồn, kiểm thử tự động và thiết kế trạm làm việc vật lý.

### 1. Bối cảnh & Thách thức
Lập trình viên thường bỏ qua accessibility vì nghĩ rằng nó phức tạp và ít người dùng. 
*   **Vấn đề:** Ứng dụng nội bộ chạy trong kho thường rất khó tương tác bằng phím hoặc có độ tương phản màu rất kém, gây khó khăn cho nhân viên lớn tuổi hoặc có thị lực yếu.

### 2. Giải pháp kỹ thuật bạn đã xây dựng
*   **Kiểm thử tự động:** Cấu hình **Axe-core** chạy trực tiếp trong luồng test Cypress/Jest của pipeline CI. Bất kỳ đoạn code nào vi phạm (thiếu thẻ label, độ tương phản kém) sẽ bị từ chối merge tự động.
*   **Đào tạo kỹ sư:** Thiết lập các chương trình đào tạo thực tế (yêu cầu dev dùng bàn phím và bịt mắt dùng Screen Reader điều hướng app của chính mình).
*   **Thiết kế vật lý:** Phối hợp thiết kế các trạm làm việc vật lý (Tactile Workstation) bao gồm khoảng cách máy quét barcode phù hợp, vị trí dán chữ nổi Braille, và chọn loại tai nghe truyền xương (bone-conduction) để nhân viên khi khiếm thị vừa nghe được chỉ dẫn vừa nghe được còi báo động trong kho.

### 3. Kết quả (Metrics)
*   Nâng cao nhận thức và chuẩn hóa quy trình phát triển cho hơn **104 teams** kỹ sư phần mềm vận hành tại Amazon.

### 4. Kịch bản nói (What to say)
> *"Để đảm bảo tính tiếp cận (Accessibility) bền vững, tôi đã dẫn dắt các sáng kiến kỹ thuật trên toàn bộ AFT và Amazon. Tôi tích hợp thư viện quét tự động **Axe-core** vào pipeline CI để phát hiện sớm các lỗi vi phạm tiêu chuẩn WCAG 2.1 AA. 
> 
> Bên cạnh phần mềm, tôi phối hợp với đội thiết kế kho để chuẩn hóa các trạm làm việc vật lý (**Tactile Workstations**) đạt chuẩn công học (ergonomics) và hỗ trợ xúc giác tốt. Tôi cũng xây dựng các tài liệu đào tạo thực hành để nâng cao kỹ năng viết mã tiếp cận cho các lập trình viên trên toàn bộ tổ chức."*

### 5. Cách trình diễn Demo trực quan
1.  Bấm vào tab **♿ Operations A11y Audit**.
2.  Click chọn các mục kiểm tra lỗi: *Interactive Custom Button*, *Barcode Input Element*, *Live Auditory Announcer*.
3.  Show cho nhà tuyển dụng thấy đoạn mã lỗi màu đỏ (thiếu ARIA, sai cấu trúc HTML).
4.  Bấm nút **Execute Day-1 Accessibility Auto-Correction Code** để chuyển sang mã màu xanh đã được sửa lỗi chuẩn tiếp cận và giải thích cơ chế kiểm thử tự động của bạn.
5.  Trỏ vào phần **PHYSICAL WORKSTATION AUDIT RULES** để mô tả cách bạn thiết kế phần cứng và không gian vật lý ở kho.
