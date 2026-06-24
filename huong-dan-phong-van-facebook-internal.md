# 🎙️ Hướng Dẫn Phỏng Vấn & Kịch Bản Demo: Facebook Employee Web Video Client, Companion Screen Share & Touch Hardware

Tài liệu này chuẩn bị cho bạn các phần nói (speaking script) bằng tiếng Việt cực kỳ chuyên nghiệp và ấn tượng, danh sách thuật ngữ kỹ thuật (buzzwords) cần dùng, và các bước để demo trực tiếp trên simulator trong buổi phỏng vấn.

---

## ⚡ 1. Elevator Pitch (Phần Nói Giới Thiệu Bản Thân - 60 Giây)
*Mục tiêu: Gây ấn tượng mạnh ngay lập tức về chiều sâu kỹ thuật và tầm ảnh hưởng của các hệ thống bạn đã xây dựng.*

> "Tại Facebook, tôi chịu trách nhiệm chính trong việc duy trì và phát triển **Employee Web Video Calling Client** — một ứng dụng SPA được xây dựng bằng React, Flux và ImmutableJS, được sử dụng bởi toàn bộ nhân viên Facebook cho các cuộc gọi nội bộ. Do codebase cốt lõi được chia sẻ trực tiếp với Messenger video calling stack, những cải tiến và tối ưu hóa hiệu năng của tôi cũng đã được phát hành cho hàng trăm triệu người dùng Messenger công cộng.
>
> Bên cạnh đó, tôi đã tự mình thiết kế và hiện thực hóa công cụ **Laptop Companion Screen Sharing** dựa trên WebRTC. Công cụ này cho phép nhân viên chia sẻ màn hình laptop cực kỳ mượt mà khi đang thực hiện cuộc gọi trên một thiết bị khác như di động hoặc thiết bị Portal, giải quyết triệt để bài toán feedback âm thanh vòng lặp (acoustic loop).
>
> Cuối cùng, tôi cũng trực tiếp phát triển các công cụ cộng tác thời gian thực sử dụng React và Redux chạy trên **nền tảng phần cứng màn hình cảm ứng chuyên dụng chạy Chromium** tại các phòng họp. Tôi đã tối ưu hóa độ trễ phản hồi cảm ứng từ 300ms xuống 0ms, giải quyết vấn đề rò rỉ bộ nhớ khi chạy 24/7, và xây dựng tính năng bảng vẽ whiteboard cộng tác thời gian thực với độ trễ đồng bộ dưới 50ms."

---

## 🛠️ 2. Từ Khóa Kỹ Thuật Quan Trọng (Technical Buzzwords)
Hãy chủ động đưa các từ khóa này vào câu trả lời để chứng minh kinh nghiệm thực chiến:

- **WebRTC Stack:** `RTCRtpSender.replaceTrack()`, `getUserMedia`, `SDP (Session Description Protocol) Sanitization`, `ICE Candidates`, `Signaling via GraphQL Subscriptions (SSE/WebSocket)`.
- **State Management & Data Structures:** `Flux Stores`, `Unidirectional Data Flow`, `Redux Root Reducer`, `ImmutableJS (Map/List)`, `Structural Sharing`, `Reference Equality Check`.
- **Kiosk & Hardware Optimization:** `Standalone Chromium Kiosk Mode`, `Touch Event Latency (300ms Delay)`, `Viewport meta-tags`, `Passive Native Event Listeners`, `Canvas 2D Context`, `Linear Interpolation (Lerp)`, `requestAnimationFrame Batching`, `Chrome DevTools Memory Profiling`.
- **Audio Engineering:** `Acoustic Echo Cancellation (AEC)`, `Acoustic Feedback Loop Suppression`, `Microphonic Feedback Squeal`.

---

## 📺 3. Kịch Bản Demo Trực Tiếp Từng Bước (Step-by-Step Demo Script)
Khi trình bày (share màn hình demo dự án trong workspace), hãy mở tab **👤 Facebook Eng** trên giao diện chính và thực hiện theo kịch bản sau:

### Bước 1: Giới thiệu giao diện tổng quan
- **Hành động:** Trỏ chuột vào các sub-tabs ở đầu màn hình demo: `Public Video Calling (Messenger Core)`, `🖥️ Employee Laptop Companion`, `📱 Custom Touch Hardware`.
- **Nói:** *"Đây là dashboard mô phỏng ba khu vực chính trong dự án của tôi tại Facebook. Tôi sẽ đi qua từng phần để giải thích cách hoạt động và các thách thức kỹ thuật đã vượt qua."*

### Bước 2: Demo Laptop Companion Screen Sharing
- **Hành động:**
  1. Click vào sub-tab **🖥️ Employee Laptop Companion**.
  2. Tại phần **Primary Device in Room**, chọn thiết bị chính (`🥽 Portal Call` hoặc `📱 Mobile Call`).
  3. Click vào nút **Present Screen (Màu xanh dương)**.
  4. Quan sát console hiển thị các dòng log như:
     - `[Acoustic] Feedback loop suppressed: Laptop mic muted, audio routed to primary Portal.`
     - `[Signaling] Companion Laptop paired successfully.`
     - `[WebRTC] Bonding laptop screen track to active Portal session...`
  5. Click **Disconnect Present** để kết thúc luồng.
- **Nói:**
  - *"Thách thức lớn nhất khi nhân viên họp trong phòng là họ dùng Portal để nghe gọi, nhưng lại muốn lấy laptop ra để chia sẻ slide. Nếu họ join cuộc gọi trên cả hai thiết bị, mic và loa của hai máy sẽ tạo nên tiếng rú rít kinh hoàng (acoustic feedback).*
  - *Như các bạn thấy trên log console của simulator: Khi người dùng bấm 'Present Screen', hệ thống của tôi lập tức gọi getUserMedia với tùy chọn `audio: false` trên laptop. Đồng thời, qua kênh WebRTC Data Channel hoặc WebSocket, chúng tôi gửi một tín hiệu đến thiết bị Portal chính để tự động kích hoạt cấu hình Acoustic Echo Cancellation (AEC) đặc biệt và chuyển toàn bộ audio output sang Portal. Nhờ đó, việc chia sẻ màn hình diễn ra tức thì và 100% không bị hú."*

### Bước 3: Demo Bảng Vẽ Cộng Tác Trên Phần Cứng Màn Hình Cảm Ứng (Touch Hardware)
- **Hành động:**
  1. Click vào sub-tab **📱 Custom Touch Hardware**.
  2. Di chuột hoặc dùng ngón tay (nếu màn hình cảm ứng) vẽ các đường nét lên khung bảng trắng (Whiteboard).
  3. Quan sát các dòng log Redux Action tự động nhảy phía dưới console:
     - `[Redux Action] DRAW_START (X, Y)`
     - `[Redux Action] DRAW_MOVE (batched coordinates)`
     - `[Redux Action] DRAW_END`
     - `[WebSocket] Broadcasted draw stroke to room devices.`
  4. Click nút **Clear Canvas (Màu đỏ)** và xem log action `CLEAR_CANVAS`.
- **Nói:**
  - *"Đây là mô phỏng ứng dụng bảng vẽ cộng tác chạy trên thiết bị kiosk Chromium đặt tại các phòng họp. Để vẽ mượt mà, tôi đã giải quyết 3 bài toán:*
  - *Thứ nhất, Chromium mặc định hoãn sự kiện click 300ms để chờ kiểm tra double-tap. Tôi đã cấu hình meta-viewport loại bỏ zoom và lắng nghe trực tiếp các sự kiện touch native thụ động (touchstart/touchend) để đưa độ trễ phản hồi về 0ms.*
  - *Thứ hai, nếu cứ mỗi lần ngón tay di chuyển ta lại bắn một Action Redux và gửi đi qua WebSocket, trình duyệt sẽ lập tức bị nghẽn (render lag). Tôi đã gom (batch) các tọa độ vẽ lại và chỉ phát tín hiệu mỗi 16ms thông qua `requestAnimationFrame`.*
  - *Thứ ba, để đảm bảo các thiết bị khác trong phòng vẽ mượt mà, tôi nén tọa độ thành mảng số tối giản và sử dụng thuật toán nội suy tuyến tính (linear interpolation) để vẽ mượt giữa các điểm nhận được, khắc phục hoàn toàn hiện tượng đứt nét do trễ mạng."*

---

## ❓ 4. Các Câu Hỏi Phỏng Vấn Hóc Búa & Cách Trả Lời (Deep Q&As)

### Câu 1: Tại sao không dùng Redux cho cả hai dự án mà lại chia ra Flux cho Video Client và Redux cho Touch Kiosk?
> **Trả lời:** *"Employee Web Video Client kế thừa codebase dùng chung với Messenger public. Khi dự án được khởi tạo, Flux là kiến trúc quản lý state mặc định tại Facebook với các Dispatcher trung tâm và nhiều Store độc lập (như CallStore, UserStore, MediaStore). Việc đập đi viết lại toàn bộ Messenger Core sang Redux là cực kỳ rủi ro và tốn kém nguồn lực vô ích. Trong khi đó, dự án Touch Hardware Kiosk là một hệ thống cộng tác mới hoàn toàn. Redux phù hợp hơn ở đây nhờ mô hình Single Store và luồng dữ liệu tuần tự, giúp chúng tôi triển khai các tính năng như Undo/Redu lịch sử vẽ bảng (Whiteboard history) một cách cực kỳ đơn giản qua việc lưu trữ snapshot state."*

### Câu 2: Làm thế nào bạn giải quyết triệt để rò rỉ bộ nhớ (memory leaks) trên thiết bị kiosk chạy Chromium 24/7?
> **Trả lời:** *"Với một ứng dụng chạy liên tục nhiều tháng không reload, rò rỉ dù chỉ vài KB một ngày cũng sẽ làm sập thiết bị. Tôi đã kết nối Chrome DevTools từ xa vào phần cứng test để ghi nhận biểu đồ Heap Memory. Chúng tôi phát hiện ra hai nguyên nhân chính: (1) Các event listener gắn trực tiếp vào đối tượng `window` trong React Component không được gỡ bỏ khi unmount. (2) Các kết nối WebRTC PeerConnection bị bỏ hoang mà không được gọi hàm `pc.close()`. Tôi đã khắc phục bằng cách thiết lập các hàm dọn dẹp (cleanup) nghiêm ngặt trong block trả về của `useEffect`. Ngoài ra, chúng tôi thiết lập một tác vụ cron-job chạy lúc 3 giờ sáng mỗi ngày để tự động reload lại trang web nếu cảm biến phòng họp báo không có người, nhằm giải phóng hoàn toàn bộ nhớ heap."*

### Câu 3: replaceTrack() khác gì so với addTrack() / removeTrack() truyền thống trong WebRTC khi bạn làm Companion Share?
> **Trả lời:** *"Hàm `addTrack()` hoặc `removeTrack()` sẽ yêu cầu thay đổi trực tiếp cấu hình media của kết nối. Khi đó, trình duyệt buộc phải trigger sự kiện `onnegotiationneeded` và bắt đầu một quy trình thương lượng SDP mới (mất từ 2 đến 3 giây để kiểm tra lại ICE candidates và thiết lập khóa bảo mật DTLS), làm mất hình ảnh/tiếng tạm thời. Ngược lại, `RTCRtpSender.replaceTrack()` hoạt động trực tiếp ở tầng RTP media. Nó cho phép thay thế track video nguồn (từ camera) bằng track chia sẻ màn hình mà không cần renegotiate lại kết nối WebRTC. Cuộc gọi không bị gián đoạn dù chỉ 1ms, đem lại trải nghiệm tức thì dưới 100ms."*

---

*Tài liệu được biên soạn chi tiết cho buổi phỏng vấn và demo kỹ thuật tại Facebook.*
