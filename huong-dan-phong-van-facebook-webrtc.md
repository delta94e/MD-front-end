# 🇻🇳 Hướng Dẫn Phỏng Vấn & Demo Chi Tiết — Facebook WebRTC Video Calling
## Tài liệu chuẩn bị nói (Speaking Script) và kịch bản demo trực quan dành cho Ứng viên

Tài liệu này dịch nghĩa và chi tiết hóa thành tựu của bạn trong dự án **Facebook Messenger Video Calling & WebRTC Screen Sharing**, giúp bạn chuẩn bị nội dung nói trôi chảy, chuyên nghiệp bằng tiếng Việt nhưng vẫn giữ các thuật ngữ tiếng Anh chuyên ngành (buzzwords) để ghi điểm tuyệt đối với nhà tuyển dụng.

---

## 🧭 Bảng Tổng Hợp Thuật Ngữ Kỹ Thuật (Buzzwords) Nên Dùng

| Thuật ngữ gốc | Giải thích & Cách dùng |
|---|---|
| **WebRTC API** | Bộ API tiêu chuẩn trong browser để truyền tải media (audio/video) thời gian thực (real-time). |
| **RTCPeerConnection** | Đối tượng kết nối WebRTC giữa client và server (hoặc peer) để quản lý luồng dữ liệu. |
| **replaceTrack()** | API cao cấp để hoán đổi track camera bằng track screen ở tầng RTP mà không cần đứt kết nối. |
| **SDP Renegotiation (Negotiationneeded)** | Quy trình thương thảo lại thông số cấu hình mạng và codec khi có track mới được thêm vào cuộc gọi. |
| **SDP Sanitization / Parsing** | Kỹ thuật lọc và định dạng lại nội dung văn bản SDP để giải quyết xung đột codec giữa các browser. |
| **ImmutableJS** | Thư viện quản lý state bất biến, ngăn chặn hoàn toàn race-conditions khi quản lý nhiều luồng video cùng lúc. |
| **GraphQL Subscriptions** | Giao thức real-time sử dụng WebSocket để trao đổi tin nhắn signaling giữa các client. |

---

## 📞 Messenger Video Calling & WebRTC Screen Sharing
> **Mục tiêu:** Viết lại toàn bộ ứng dụng Messenger Video Calling bằng React/GraphQL/ImmutableJS và tái cấu trúc pipeline đàm phán media WebRTC để hỗ trợ chia sẻ màn hình (screen sharing) chéo nền tảng (mọi trình duyệt và mobile).

### 1. Bối cảnh & Thách thức
Hệ thống gọi video của Facebook Messenger phục vụ hàng tỷ phút gọi mỗi ngày. 
*   **Vấn đề:** Ban đầu, tính năng chia sẻ màn hình gặp giới hạn nghiêm trọng: chỉ hỗ trợ cuộc gọi 1:1 và bắt buộc cả 2 bên cùng dùng Chrome.
*   **Hạn chế:** Không thể chia sẻ màn hình trong Group Calls hoặc Rooms. Nếu người dùng sử dụng Firefox, Safari hay Mobile, tính năng này hoàn toàn bị vô hiệu hóa hoặc gây lỗi treo cuộc gọi.
*   **Thách thức:** Trong cuộc gọi nhóm, việc bật/tắt camera hoặc chia sẻ màn hình liên tục tạo ra hàng loạt tín hiệu đàm phán đồng thời, dễ gây ra tình trạng race-condition (lỗi luồng bất đồng bộ), dẫn đến việc vỡ layout video hoặc mất kết nối.

### 2. Giải pháp kỹ thuật bạn đã xây dựng
*   **replaceTrack() API:** Thay vì ngắt kết nối WebRTC cũ và tạo kết nối mới để thêm track màn hình (gây đóng băng cuộc gọi 3 giây), bạn sử dụng `RTCRtpSender.replaceTrack()` để tráo đổi trực tiếp track camera bằng track màn hình tại tầng RTP, giúp chuyển đổi mượt dưới 100ms.
*   **SDP Sanitization (Lọc SDP):** Firefox và Safari có cách định cấu hình codec khác Chrome. Bạn viết bộ lọc chuỗi SDP để chuẩn hóa các profile codec (như H.264/VP9) trước khi gọi lệnh `setLocalDescription()`.
*   **GraphQL Signaling Subscriptions:** Sử dụng GraphQL qua WebSocket để truyền tải các tin nhắn báo hiệu (Signaling - Offer, Answer, ICE candidates) cực kỳ nhanh trong các cuộc gọi nhóm.
*   **ImmutableJS State:** Sử dụng ImmutableJS để khóa chặt trạng thái của các luồng video tham gia cuộc gọi. Giao diện React chỉ render khi có reference trạng thái mới, loại bỏ hoàn toàn các lỗi vỡ layout do bất đồng bộ hủy/gắn track.

### 3. Kết quả (Metrics)
*   Cho phép chia sẻ màn hình chéo trình duyệt (Chrome, Firefox, Safari) sang cả ứng dụng di động Messenger.
*   **Tăng trưởng vượt bậc** tổng thời gian người dùng chia sẻ màn hình trên nền tảng web.
*   Giảm tỷ lệ lỗi kết nối khi chia sẻ màn hình đi **94.2%**.

### 4. Kịch bản nói (What to say)
> *"Tại Facebook, tôi đã chủ trì viết lại toàn bộ hệ thống gọi video của Messenger (gồm 1:1, Group Calls và Rooms) bằng công nghệ React Hooks, GraphQL Subscriptions và ImmutableJS. 
> 
> Một trong những thành tựu nổi bật nhất của tôi là tái cấu trúc toàn bộ pipeline đàm phán media của WebRTC để giải quyết giới hạn chia sẻ màn hình. Trước đây, screen share chỉ chạy được giữa Chrome-to-Chrome trong cuộc gọi 1:1. 
> 
> Tôi đã triển khai kỹ thuật tráo đổi track bằng **replaceTrack API** để hoán đổi trực tiếp camera sang screen stream mà không cần đứt kết nối. Tôi cũng xây dựng bộ lọc **SDP Sanitizer** để giải quyết xung đột cấu hình codec giữa các trình duyệt khác nhau như Safari và Firefox, đồng thời làm việc với team mobile để giải mã stream trên điện thoại. Kết quả là tính năng screen sharing hiện chạy mượt mà trên mọi trình duyệt, mọi loại cuộc gọi nhóm, giúp thời gian sử dụng tính năng này tăng trưởng vượt bậc."*

### 5. Cách trình diễn Demo trực quan
1.  Bấm vào tab **📞 Video & Screen Share** trên ứng dụng demo Facebook.
2.  Trỏ vào thanh điều hướng cuộc gọi giả lập ở góc trên, click chọn qua lại các chế độ: *Group*, *One-to-One*, *Room* để giới thiệu các môi trường cuộc gọi khác nhau.
3.  Ở phần **RENEGOTIATION CONSOLE**, thử thay đổi *Sender Platform* (ví dụ: Safari) và *Receiver Platform* (ví dụ: Messenger App Mobile).
4.  Bấm nút **Share Screen (màu xanh)**:
    *   Màn hình giả lập sẽ chuyển sang trạng thái chia sẻ màn hình (🖥️).
    *   Bảng **getStats API** bên dưới sẽ hiển thị trực quan các thông số Framerate (30 fps), Bitrate (Mbps), và Packet Loss (%) cập nhật động.
    *   Khung log signaling màu đen ở bên phải sẽ in liên tục các dòng log đàm phán thời gian thực: *SDP Offer sent, VP9 negotiated, ICE completed, DTLS bound*, minh chứng cho luồng xử lý kỹ thuật phức tạp đã diễn ra thành công.
