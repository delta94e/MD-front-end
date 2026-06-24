# 🇻🇳 Hướng Dẫn Phỏng Vấn & Demo Chi Tiết — Amazon Risk & Compliance Platform
## Tài liệu chuẩn bị nói (Speaking Script) và kịch bản demo trực quan từng mục dành cho Ứng viên

Tài liệu này dịch nghĩa và chi tiết hóa 5 thành tựu lớn của bạn trong dự án **Amazon Risk & Compliance Platform**, giúp bạn chuẩn bị nội dung nói trôi chảy, chuyên nghiệp bằng tiếng Việt nhưng vẫn giữ các thuật ngữ tiếng Anh chuyên ngành (buzzwords) để ghi điểm tuyệt đối với nhà tuyển dụng.

---

## 🧭 Bảng Tổng Hợp Thuật Ngữ Kỹ Thuật (Buzzwords) Nên Dùng

| Thuật ngữ gốc | Giải thích & Cách dùng |
|---|---|
| **Webpack Module Federation** | Công nghệ cốt lõi để chia nhỏ app thành các Micro-frontend độc lập tải tại runtime. |
| **Shared Scope / Singletons** | Chia sẻ các thư viện chung (React, React-DOM) trong bộ nhớ, tránh tải trùng lặp. |
| **Resiliency & Error Boundary** | Cơ chế tự phục hồi, khoanh vùng lỗi của từng MFE để tránh làm crash toàn bộ Shell. |
| **SOC-2 Type II Certification** | Tiêu chuẩn bảo mật và kiểm soát dữ liệu nghiêm ngặt trong tài chính/risk. |
| **CloudWatch Paging & SNS** | Hệ thống giám sát lỗi tự động gửi cảnh báo (page) cho kỹ sư on-call. |
| **Design Token Mapping** | Kỹ thuật dịch chuyển biến thiết kế từ hệ thống này sang hệ thống khác thông qua CSS variables. |
| **Mock Service Worker (MSW)** | Thư viện mock API chạy ở tầng Service Worker của browser, giúp test offline 100%. |
| **WBS (Work Breakdown Structure)** | Phân rã công việc chi tiết để đưa ra ước lượng (estimates) chính xác. |

---

## 🧩 Mục 1 — Micro-frontend (MFE) Platform
> **Mục tiêu:** Consolidation các trang quản lý rủi ro (Risk Lifecycle) từ nhiều team sở hữu về một ứng dụng duy nhất.

### 1. Bối cảnh & Thách thức
Trước đây tại Amazon Risk, mỗi team (Merchant Risk, Transaction Risk, Identity, Compliance) sở hữu các trang web riêng biệt chạy trên các subdomain/công nghệ khác nhau. 
*   **Vấn đề:** Sellers phải chuyển tab liên tục, authenticate nhiều lần, giao diện không đồng nhất.
*   **Rào cản kỹ thuật:** Gom chung vào một repository Monolith sẽ gây nghẽn hàng đợi release (Release Bottleneck). Lỗi của một team khi deploy có thể làm sập toàn bộ hệ thống Risk.

### 2. Giải pháp kỹ thuật bạn đã xây dựng
*   Thiết kế ứng dụng **Host Shell (App Shell)** sử dụng **Webpack Module Federation**.
*   Các ứng dụng của từng team được tách ra thành các container độc lập (**Remote MFEs**), tự biên dịch và triển khai lên S3/CloudFront.
*   Host Shell phân giải các remote entry points này động tại runtime dựa trên file cấu hình phiên bản (JSON descriptor).
*   Bao bọc mỗi Remote MFE bằng **React Error Boundary** và **Skeleton Loader** để đạt độ cô lập lỗi tuyệt đối (Fault Isolation).

### 3. Kết quả (Metrics)
*   **0%** tỉ lệ lỗi chéo (lỗi MFE này không ảnh hưởng MFE khác).
*   Tốc độ tải các trang con giảm xuống còn **0ms** độ trễ mạng do tái sử dụng chung instance React/React-DOM trong **Shared Scope**.

### 4. Kịch bản nói (What to say)
> *"Tại Amazon, tôi đã thiết kế và xây dựng nền tảng **Micro-frontend (MFE)** để tích hợp toàn bộ các trang quản lý vòng đời rủi ro (Risk lifecycle) vốn do nhiều team độc lập sở hữu vào một ứng dụng duy nhất. 
> 
> Chúng tôi sử dụng **Webpack Module Federation** để Host Shell liên kết động với các Remote MFE tại runtime. Để đảm bảo hệ thống không bị crash dây chuyền, tôi đã thiết lập các **React Error Boundaries** bao bọc từng mount node của MFE. Nếu MFE của Transaction Risk bị sập do lỗi mạng hoặc lỗi JS, Host Shell sẽ tự động cô lập lỗi, ghi nhận telemetry và hiển thị một khung skeleton cảnh báo, trong khi các phần Merchant Risk hay Compliance vẫn hoạt động bình thường mà không cần tải lại trang."*

### 5. Cách trình diễn Demo trực quan
1.  Bấm vào tab **🧩 Micro-Frontend Platform**.
2.  Click lần lượt các tab con *Merchant*, *Transaction*, *Identity*, *Compliance* trên thanh điều hướng giả lập để chỉ ra các luồng dữ liệu khác nhau được tải động.
3.  Click nút **⏳ Sim Network Lag** để trình diễn trạng thái **Skeleton Loading** mượt mà.
4.  Click nút **🚨 Sim Server Crash** để mô phỏng lỗi sập server từ xa. Cho nhà tuyển dụng thấy **Error Boundary** hoạt động: hiển thị bảng thông báo lỗi và nút khôi phục khẩn cấp riêng cho MFE đó mà không ảnh hưởng tới toàn bộ cấu trúc Shell.

---

## 🗂️ Mục 2 — Lightweight Case Management & Production Compliance
> **Mục tiêu:** Hệ thống quản trị case tuân thủ pháp lý nhẹ, an toàn, có đầy đủ quy trình kiểm thử, giám sát và chứng nhận bảo mật.

### 1. Bối cảnh & Thách thức
Hệ thống xử lý các vấn đề pháp lý (Regulatory issues) liên quan đến dữ liệu nhạy cảm (rửa tiền, thuế, dữ liệu cá nhân GDPR).
*   **Vấn đề:** Bất kỳ rò rỉ dữ liệu hoặc lỗi giao dịch nào cũng có thể dẫn đến phạt pháp lý hàng triệu USD.
*   Hệ thống yêu cầu bảo mật nghiêm ngặt và quy trình kiểm thử E2E cực kỳ chặt chẽ trước khi deploy.

### 2. Giải pháp kỹ thuật bạn đã xây dựng
*   Thiết kế hệ thống quản lý case bất đồng bộ, sử dụng **strict type-checking** và cơ chế **input sanitization** ở frontend.
*   Xây dựng luồng **CI/CD pipeline** hoàn chỉnh qua AWS CodePipeline: tự động chạy kiểm thử tĩnh, quét mã độc hại qua **Snyk**, chạy **Cypress/Jest Integration Tests** tự động.
*   Tích hợp giám sát **CloudWatch** theo dõi thời gian phản hồi (latency) của API và tỷ lệ lỗi JS ở client. Nếu phát hiện lỗi nghiêm trọng, CloudWatch Alarm sẽ kích hoạt qua SNS gửi pager đến kênh Slack của kỹ sư trực chiến.
*   Tuân thủ nghiêm ngặt và đạt chứng chỉ bảo mật **SOC-2 Type II** cho ứng dụng.

### 3. Kết quả (Metrics)
*   **99.99%** thời gian hoạt động ổn định (uptime).
*   **0** lỗi bảo mật nghiêm trọng lọt lưới nhờ CI/CD quét tự động.

### 4. Kịch bản nói (What to say)
> *"Tôi đã phát triển một hệ thống quản lý case gọn nhẹ để xử lý các vấn đề pháp chế và quy định của Amazon. Vì đây là hệ thống xử lý thông tin nhạy cảm, tôi đã thiết kế nó đạt chuẩn bảo mật **SOC-2 Type II** ngay từ client-side bằng cách áp dụng cơ chế lọc dữ liệu đầu vào và xoay vòng token bảo mật. 
> 
> Ứng dụng được bao phủ hoàn chỉnh bởi hệ thống tự động: luồng **CI/CD** kiểm tra lỗi bảo mật qua Snyk trước khi deploy Canary, đi kèm bộ kiểm thử tích hợp **Jest và Cypress**. Để đảm bảo tính sẵn sàng, tôi thiết lập **CloudWatch Alarms**. Khi phát hiện latency viết case vượt quá **500ms** hoặc tỷ lệ lỗi tăng vọt, hệ thống sẽ ngay lập tức kích hoạt pager để báo động cho đội ngũ trực vận hành."*

### 5. Cách trình diễn Demo trực quan
1.  Bấm vào tab **🗂️ Regulatory Cases & CI/CD**.
2.  Nhập dữ liệu vào form để thêm một case mới. Hãy chọn mức độ nghiêm trọng là **High** và nhấn submit.
3.  Chỉ vào phần **🚨 CLOUDWATCH ALARM TRIGGERED** xuất hiện để giải thích cơ chế giám sát thời gian thực.
4.  Bấm nút **Run Tests** để chạy kiểm thử tích hợp giả lập và chỉ ra các dòng log thành công của Cypress.
5.  Bấm nút **Trigger Deploy** để chạy tiến trình CI/CD giả lập, giải thích luồng quét lỗ hổng bảo mật và ký chứng nhận SOC-2 tự động trước khi deploy.

---

## 🎨 Mục 3 — Theming Interoperability Bridge Library
> **Mục tiêu:** Thư viện theme trung gian đồng bộ giao diện giữa Amazon component library và thư viện Form Builder bên thứ ba (hơn 100 teams sử dụng).

### 1. Bối cảnh & Thách thức
Một số bộ phận cần dùng thư viện Form Builder bên thứ ba để xây dựng khảo sát động cho nhà bán hàng. Tuy nhiên, thư viện này không hỗ trợ hệ thống thiết kế nội bộ của Amazon (`@awsui/components-react`).
*   **Vấn đề:** Trải nghiệm người dùng bị đứt gãy (nút bấm, màu sắc, font chữ hiển thị lệch lạc). 
*   **Rào cản kỹ thuật:** Việc viết đè CSS thủ công hàng nghìn dòng gây ra nợ kỹ thuật (technical debt), dễ bị vỡ giao diện mỗi khi thư viện ngoài nâng cấp phiên bản.

### 2. Giải pháp kỹ thuật bạn đã xây dựng
*   Xây dựng một thư viện **Theming Interop Bridge**.
*   Thư viện này đọc các biến thiết kế (**Design Tokens**) của Amazon, dịch mã (compile) và map chúng thành các **CSS Custom Properties** (biến CSS runtime) mà thư viện Form Builder bên thứ ba có thể tiêu thụ trực tiếp.
*   Đóng gói thư viện này thành một npm package tiêu chuẩn nội bộ.

### 3. Kết quả (Metrics)
*   **Gần 100 teams** thuộc nhiều tổ chức (orgs) khác nhau trong Amazon đã cài đặt và áp dụng như một tiêu chuẩn chung.
*   Loại bỏ hoàn toàn các dòng code ghi đè CSS thủ công, giảm **92%** số lượng ticket hỗ trợ liên quan đến vỡ giao diện.

### 4. Kịch bản nói (What to say)
> *"Khi tích hợp một thư viện dựng form động của bên thứ ba vào hệ thống của Amazon, chúng tôi gặp vấn đề không tương thích về mặt giao diện với bộ thư viện AWSUI nội bộ. 
> 
> Thay vì viết đè CSS thô và thủ công—điều sẽ tạo ra nợ kỹ thuật rất lớn khi thư viện cập nhật—tôi đã phát triển một thư viện trung gian **Theming Interoperability**. Thư viện này dịch chuyển động các **Amazon Design Tokens** thành các **CSS Variables** tương thích mà thư viện bên ngoài có thể đọc trực tiếp tại runtime. Giải pháp này giúp đồng bộ giao diện 100%, được thông qua làm tiêu chuẩn chung áp dụng cho **gần 100 teams** trên toàn Amazon."*

### 5. Cách trình diễn Demo trực quan
1.  Bấm vào tab **🎨 Theming Interop Bridge**.
2.  Kéo thanh trượt thay đổi *Border Radius* hoặc sử dụng bảng màu thay đổi màu sắc chủ đạo của Amazon.
3.  Trỏ vào phần **THEMING TOKEN MAP TRANSLATION** để chỉ ra các biến CSS (`--theme-brand-color`) đang thay đổi tương ứng.
4.  Cho nhà tuyển dụng xem thẻ **Form Builder Template Preview** kế bên thay đổi độ bo góc, khoảng đệm (padding) và màu nền ngay lập tức để minh chứng cho tính tương thích giao diện runtime.

---

## ⚙️ Mục 4 — Streamlining Frontend Engineering Processes
> **Mục tiêu:** Tối ưu hóa quy trình frontend (thiết kế hệ thống, thống nhất tech stack, đào tạo React/Performance, testing local server-side).

### 1. Bối cảnh & Thách thức
Quy trình phát triển frontend của các team ban đầu bị phân mảnh:
*   Mỗi team tự chọn phiên bản React/Webpack khác nhau dẫn đến lỗi xung đột khi chạy Micro-frontend.
*   Việc kiểm thử tính năng phải phụ thuộc vào việc cài đặt môi trường backend Docker rất nặng nề, tốn nhiều ngày cấu hình.
*   Kỹ năng tối ưu hóa React của dev chưa đồng đều dẫn đến lãng phí tài nguyên render.

### 2. Giải pháp kỹ thuật bạn đã xây dựng
*   **Quy chuẩn hóa:** Phát hành các mẫu tài liệu thiết kế hệ thống (System Design Document Templates) thống nhất cho frontend.
*   **Tech Stack Lock:** Khóa cứng các phiên bản công nghệ dùng chung (React 18, Typescript, Webpack Presets) trong CI.
*   **Đào tạo hiệu năng:** Tổ chức các buổi workshop hướng dẫn sử dụng Chrome DevTools Profiler, giảm thời gian render của React qua memoization.
*   **Local testing offine:** Triển khai **Mock Service Worker (MSW)** để chặn các request từ client-side đến server-side app và trả về dữ liệu mock ngay tại local browser.

### 3. Kết quả (Metrics)
*   Render latency giảm **90%** (từ 120ms xuống còn 12ms).
*   Thời gian kiểm thử tính năng (feature testing time) giảm tới **80%** (từ vài ngày xuống còn vài phút vì không cần chạy Docker backend).

### 4. Kịch bản nói (What to say)
> *"Để chuẩn hóa quy trình kỹ nghệ frontend, tôi đã thực hiện bốn cải tiến lớn: 
> 
> (a) chuẩn hóa mẫu tài liệu thiết kế hệ thống tập trung vào hiệu suất và a11y; (b) đồng bộ và khóa cứng các phiên bản trong tech stack để tránh xung đột MFE; (c) tổ chức đào tạo chuyên sâu giúp các lập trình viên tối ưu hóa vòng đời render của React từ 120ms xuống 12ms; và đặc biệt là (d) triển khai cơ chế giả lập API local bằng **Mock Service Worker (MSW)**. Cải tiến này cho phép các kỹ sư kiểm thử toàn bộ tính năng nghiệp vụ của ứng dụng ngay tại local mà không cần khởi động các dịch vụ backend nặng nề, giảm thời gian test tính năng đi 80%."*

### 5. Cách trình diễn Demo trực quan
1.  Bấm vào tab **⚙️ DevProcess & Leadership**.
2.  Bên tay phải, trỏ vào khu vực **Local Testing MSW** và bấm nút **Mock Running / Mock Disabled** để minh họa khả năng bật tắt mock API.
3.  Kéo thanh trượt **Mock Endpoint Latency** để chứng minh khả năng giả lập độ trễ mạng trong code MSW ở dưới thay đổi động.
4.  Chỉ vào bảng thống kê hiệu quả tối ưu hóa React Render (120ms -> 12ms) để thể hiện kết quả đào tạo.

---

## 🎯 Mục 5 — Project Leadership & Technical Delivery
> **Mục tiêu:** Dẫn dắt kỹ thuật cho nhiều dự án: dự toán công sức (effort estimation), phân rã công việc (WBS), thiết kế hệ thống, setup base app và quản trị PR review.

### 1. Bối cảnh & Thách thức
Khi chạy nhiều dự án song song, việc lập kế hoạch thiếu chính xác sẽ dẫn đến trễ hạn (deadline delay) và code chất lượng kém do dev tự setup môi trường không đồng nhất.

### 2. Giải pháp kỹ thuật bạn đã xây dựng
*   **WBS & Estimation:** Phát triển công thức ước lượng chi tiết dựa trên phân rã đầu việc (WBS), đưa ra số ngày phát triển kèm hệ số đệm (buffer) rủi ro kỹ thuật.
*   **Base App Setup:** Trực tiếp dựng khung ứng dụng cơ sở (scaffolding) với đầy đủ quy tắc Lint, Typescript nghiêm ngặt và cấu hình CI ban đầu.
*   **PR Governance:** Thiết lập bộ quy chuẩn review PR, yêu cầu bắt buộc phải có độ phủ test >90% và báo cáo kiểm thử accessibility (a11y) trước khi cho phép merge code.

### 3. Kết quả (Metrics)
*   **100%** dự án bàn giao đúng thời hạn cam kết.
*   Mã nguồn đồng nhất về tiêu chuẩn chất lượng trên toàn bộ các dự án MFE con.

### 4. Kịch bản nói (What to say)
> *"Với vai trò là người dẫn dắt kỹ thuật frontend cho nhiều dự án, tôi quản lý toàn diện từ khâu lập kế hoạch đến phân phối sản phẩm. Tôi trực tiếp xây dựng công thức phân rã công việc **WBS (Work Breakdown Structure)** để đưa ra các ước lượng tiến độ chính xác. 
> 
> Tôi thiết lập sẵn các khung ứng dụng cơ sở (base app setup) chuẩn hóa về mặt cấu hình TypeScript và ESLint để các team con có thể bắt tay vào viết code nghiệp vụ ngay lập tức. Để bảo vệ chất lượng đầu ra, tôi áp dụng mô hình review code chặt chẽ đòi hỏi 2 chữ ký phê duyệt từ senior, kiểm soát độ phủ test và chuẩn accessibility trước khi bàn giao sản phẩm."*

### 5. Cách trình diễn Demo trực quan
1.  Vẫn ở tab **⚙️ DevProcess & Leadership**, trỏ vào danh sách chọn mẫu tài liệu ở góc trái.
2.  Lần lượt chọn xem:
    *   *Standard System Design Document:* Cho thấy các mục quy định về Performance, State, và Telemetry.
    *   *Effort Estimation & Breakdown Checklist:* Cho thấy công thức tính ngày công phát triển cụ thể của dự án.
    *   *Code Standards & Reviews Guidelines:* Minh họa quy tắc kiểm tra PR tự động.
